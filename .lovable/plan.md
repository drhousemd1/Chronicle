# Tenant Isolation & Media Privacy Hardening — REVISED Plan v4

Only BF-10 changed from v3 (Option A grants/RLS correction). All other findings (BF-02, 03, 04, 05, 06, 07, 08, 09, 11, 12, 13, 14) and staging order are unchanged from v2/v3 and not repeated here.

## BF-10 — Reports + strikes backend boundary + sanitized Account Status (REVISED, Option A)

### Live column evidence (re-verified)

- `public.reports`: `id, reporter, accused, reason, story_id, status, created_at, updated_at, reporter_user_id, accused_user_id, note, reviewed_by`. Admin-only fields: `note`, `reviewed_by`, `accused_user_id`, `accused`.
- `public.user_strikes`: `id, user_id, reason, issued_by, expires_at, created_at, report_id, points, note, status, issued_at, falls_off_at, updated_at`. Admin-only fields: `issued_by`, `note`, `points`, `report_id`.

The locked product rule forbids exposing these admin-only fields to normal users, so normal-user RLS SELECT must be removed and all user-facing reads must go through a sanitized RPC.

### Why Option A

App admins authenticate through the same Supabase `authenticated` Postgres role as regular users; the admin distinction is an RLS predicate (`has_role(auth.uid(),'admin')`). Revoking `SELECT` from `authenticated` at the table-grant level would also block the admin RLS path and break the existing admin moderation UI. Option A leaves the table grant intact and removes only the normal-user RLS SELECT policy, so normal users get zero rows (no policy matches) while admin SELECT continues to function through the admin policy. No admin UI rewrite required.

### Backend changes

1. Realtime
   - `ALTER PUBLICATION supabase_realtime DROP TABLE public.reports;`
   - Confirm `public.user_strikes` is not in the publication; drop it if it is.

2. Table grants — **leave existing grants in place** on both `public.reports` and `public.user_strikes` (no REVOKE). `authenticated` keeps SELECT/INSERT/UPDATE/DELETE so RLS can decide per-row. `service_role` keeps full access. `anon` is not granted.

3. `public.reports` policies (rewrite)
   - Keep / add: `Users can insert own reports` — `FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_user_id)`.
   - Keep / add: `Admins can select reports` — `FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'))`.
   - Keep / add: `Admins can update reports` — `FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'))`.
   - Keep / add: `Admins can delete reports` — `FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'))`.
   - **Drop** any existing SELECT policy that allows a normal user to read their own row (for example a `reporter_user_id = auth.uid()` SELECT policy). After this change there is no SELECT policy that matches non-admin users, so direct SELECT from `authenticated` returns 0 rows for normal users while the admin SELECT policy still matches admins.

4. `public.user_strikes` policies (rewrite)
   - Keep / add: `Admins can select strikes` — `FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'))`.
   - Keep / add: `Admins can insert strikes` / `Admins can update strikes` / `Admins can delete strikes` — same `has_role` gate (or one `FOR ALL` admin policy if the existing schema uses that shape).
   - **Drop** any existing SELECT policy that allows the strike subject to read their own row (for example `user_id = auth.uid()`). Same outcome as above: non-admin direct SELECT returns 0 rows; admin SELECT works via the admin policy.

5. New sanitized RPC `public.get_my_account_status()` (`SECURITY DEFINER`, `STABLE`, `SET search_path = public`, `GRANT EXECUTE ON FUNCTION public.get_my_account_status() TO authenticated`). Returns `jsonb`:
   ```json
   {
     "reports": [
       {"id": "<uuid>", "target_kind": "story|user",
        "status": "open|reviewed|dismissed|actioned",
        "reason_public": "<reason text>",
        "created_at": "...",
        "resolved_at": "<updated_at when status<>'open' else null>"}
     ],
     "strikes": [
       {"id": "<uuid>", "status": "active|expired|revoked",
        "reason_public": "<reason text>",
        "issued_at": "...", "expires_at": "...",
        "falls_off_at": "..."}
     ]
   }
   ```
   - `target_kind` derived: `'story'` when `story_id IS NOT NULL`, else `'user'`. No `target_id` returned.
   - `reason_public` is the user-submitted `reason` for reports and the user-visible `reason` for strikes. `note` (admin-only) is never returned.
   - Excludes: `note`, `reviewed_by`, `issued_by`, `points`, `report_id`, `accused_user_id`, `accused`, `reporter`, raw `updated_at`, and every other column not enumerated above.
   - Filters internally: `reports.reporter_user_id = auth.uid()` and `user_strikes.user_id = auth.uid()`. Raises `Unauthorized` if `auth.uid() IS NULL`.

6. Client code audit: remove any client `from('reports').select(...)` or `from('user_strikes').select(...)` calls that were previously used to render a normal user's own moderation data; they will silently return 0 rows after this change. Admin moderation UI continues to use direct table SELECT under the admin policy.

### Frontend changes

- Add private `Account Status` section to `src/components/account/AccountSettingsTab.tsx` (+ a small `AccountStatusSection.tsx`) that calls `supabase.rpc('get_my_account_status')` and renders:
  - "My reports": status badge, target kind, `reason_public`, `created_at`, `resolved_at`. Empty state when none.
  - "Account strikes": status badge, `reason_public`, `issued_at`, `expires_at`/`falls_off_at`. Empty state when none.
- No raw table access from the client for self-reads.

### Validation (must all pass before mark-fixed)

- Direct raw-table boundary (Option A semantics):
  - User A authed (non-admin): `SELECT * FROM public.reports WHERE reporter_user_id = auth.uid()` → **0 rows** (no matching RLS SELECT policy).
  - User A authed (non-admin): `SELECT * FROM public.reports` (no filter) → 0 rows.
  - User A authed (non-admin): `SELECT note, reviewed_by, accused_user_id FROM public.reports LIMIT 1` → 0 rows (policy returns nothing; admin fields therefore unreachable).
  - User A authed (non-admin): `SELECT * FROM public.user_strikes WHERE user_id = auth.uid()` → 0 rows.
  - User A authed (non-admin): `SELECT issued_by, note, points, report_id FROM public.user_strikes LIMIT 1` → 0 rows.
  - Anon (no `anon` grant): same probes → permission denied or 0 rows.
- Sanitized RPC:
  - User A authed: `SELECT public.get_my_account_status()` → returns only A's reports and strikes with only the whitelisted keys. JSON-key audit confirms `note`, `reviewed_by`, `issued_by`, `points`, `report_id`, `accused_user_id`, `accused`, `reporter` are absent.
  - User B authed: same RPC → returns only B's rows; cannot see A's.
  - Anon: RPC raises `Unauthorized`.
- Admin path (unchanged by this finding):
  - Admin authed: `SELECT * FROM public.reports` returns full rows including `note`, `reviewed_by`.
  - Admin authed: `SELECT * FROM public.user_strikes` returns full rows including `issued_by`, `note`, `points`.
  - Admin update and delete of a report and a strike still succeed.
- Insert path:
  - User A authed: `INSERT INTO public.reports (reporter_user_id, reason, story_id, status) VALUES (auth.uid(), ..., ..., 'open')` succeeds.
  - User A authed insert with `reporter_user_id = '<other-uuid>'` → blocked by the insert policy's `WITH CHECK`.
- Realtime:
  - Subscribe anon and authed to a `reports` channel; trigger admin insert → 0 messages received.
- UI smoke:
  - Account Settings → Account Status renders A's report and strike lists from the RPC.
  - DevTools network shows no direct `from=reports` or `from=user_strikes` requests from the user session.
  - Second account (B) opens Account Status; does not see A's data.
  - Admin moderation UI still loads reports and strikes (admin SELECT path intact).

### Repo files touched

- New migration: drop legacy normal-user SELECT policies on `reports` and `user_strikes`; ensure admin SELECT/INSERT/UPDATE/DELETE policies exist; add `reports` insert-own policy if missing; create `get_my_account_status()`; drop `reports` from `supabase_realtime` publication. **No REVOKE statements.**
- `src/components/account/AccountSettingsTab.tsx` + new `AccountStatusSection.tsx`.
- Remove client `from('reports'|'user_strikes').select(...)` calls used for non-admin self-reads.
- Schema snapshots: `src/data/supabase-schema-map.ts`, `src/data/database-schema-inventory.ts`, `src/integrations/supabase/types.ts`.
- Quality Hub: BF-10 entry updated with this evidence.

## Updated validation row (replaces BF-10 row in v2/v3 table)

| BF | Direct query probe | Storage probe | Realtime probe | RPC probe | UI smoke |
|----|-------------------|---------------|----------------|-----------|----------|
| 10 | Non-admin authed direct `SELECT * FROM reports` (own and all) → **0 rows** (no matching RLS SELECT policy); direct `SELECT note, reviewed_by, accused_user_id FROM reports` → 0 rows; non-admin authed direct `SELECT * FROM user_strikes` (own and all) → 0 rows; direct `SELECT issued_by, note, points, report_id FROM user_strikes` → 0 rows; `INSERT` own report still succeeds; insert with foreign `reporter_user_id` blocked by `WITH CHECK`; admin direct SELECT/UPDATE/DELETE on both tables still succeeds via `has_role` policies; anon receives permission denied or 0 rows | — | `reports` Realtime channel emits 0 to anon and authed on admin insert; `user_strikes` not in publication | `get_my_account_status()` returns only caller's sanitized reports + strikes with whitelisted keys only; anon raises Unauthorized; key-audit confirms `note`, `reviewed_by`, `issued_by`, `points`, `report_id`, `accused_user_id`, `accused`, `reporter` are absent | Account Settings → Account Status renders from RPC; no `from=reports` / `from=user_strikes` requests in network panel; second account sees only own data; admin moderation tools still load full rows |

## Everything else from v2/v3 — unchanged

All other findings and the staging order (Batch A independent, Batch B BF-08, Batch C BF-10 → BF-11, Batch D storage flips BF-04 → BF-05 → BF-06) carry over unchanged.
