## Batch C v2 — BF-10 (reports/strikes/Realtime) + BF-11 (published_scenarios moderation field exposure)

Correction: column-level REVOKE is not a real privacy boundary while table-level SELECT remains for the same role. The revised BF-11 plan removes the broad public/authenticated raw SELECT on `published_scenarios` entirely and migrates non-owner surfaces to sanitized RPCs that already exist or are added here.

### Frontend inventory of raw `public.published_scenarios` reads
1. `src/services/gallery-data.ts`
   - `fetchPublishedScenarios` (legacy, **no live callers found** — confirmed via `rg`).
   - `getPublishedScenario(scenarioId)` — **owner-only callers**: `ShareStoryModal`, `StoryHub`.
   - `fetchUserPublishedScenarios(userId)` — **owner-only** (filters `publisher_id = userId`).
   - `fetchSavedScenarios(userId)` — **normal-user surface** (the user's Saved list), joins `published_scenarios (...)` for card display. Non-owner rows are read here.
   - `publishScenario` / `unpublishScenario` — owner INSERT/UPDATE only, unaffected by SELECT policy.
2. `src/components/account/PublicProfileTab.tsx` — **owner-only** (`publisher_id = user.id`).
3. Gallery (`Gallery.tsx` → `GalleryHub` → `fetchGalleryScenarios`) — already uses RPC `fetch_gallery_scenarios`. No raw read.
4. `CreatorProfile` — already uses RPC `get_public_creator_profile`. No raw read.
5. `StoryDetailModal` — receives data via props; no raw read.

Only one non-owner raw-read path remains: `fetchSavedScenarios`. Everything else is owner/admin or already sanitized.

### BF-11 — Proposed changes

#### 1. Migration: tighten `published_scenarios` SELECT to owner + admin only
- `DROP POLICY "Anyone can view published scenarios" ON public.published_scenarios;`
- `CREATE POLICY "Owners can view own publications" ON public.published_scenarios FOR SELECT TO authenticated USING (publisher_id = auth.uid());`
- `CREATE POLICY "Admins can view all publications" ON public.published_scenarios FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'));`
- INSERT/UPDATE/DELETE policies remain unchanged (publishers can manage own).
- `REVOKE SELECT ON public.published_scenarios FROM anon;` (no anon surface needs it — gallery RPC uses SECURITY DEFINER). Keep `GRANT SELECT ON public.published_scenarios TO authenticated;` so RLS gates owner/admin rows.
- `reported_count` becomes unreachable for non-owner, non-admin under any column subset, eliminating BF-11.

#### 2. Migration: new sanitized RPC for the Saved list
- `CREATE OR REPLACE FUNCTION public.get_saved_scenarios_for_user() RETURNS TABLE(id uuid, user_id uuid, published_scenario_id uuid, source_scenario_id uuid, created_at timestamptz, ps_id uuid, ps_scenario_id uuid, ps_publisher_id uuid, ps_allow_remix boolean, ps_tags text[], ps_like_count int, ps_save_count int, ps_play_count int, ps_view_count int, ps_avg_rating numeric, ps_review_count int, ps_is_published boolean, ps_is_hidden boolean, ps_created_at timestamptz, ps_updated_at timestamptz, story_id uuid, story_title text, story_description text, story_cover_image_url text, story_cover_image_position jsonb) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ ... $$;`
- Scoped to `auth.uid()`; JOINs `saved_scenarios → published_scenarios → stories`; filters `ps.is_published = true AND ps.is_hidden = false AND COALESCE(publisher.hide_published_works,false)=false`; **does not return `reported_count`** or any moderation field.
- `GRANT EXECUTE ON FUNCTION public.get_saved_scenarios_for_user() TO authenticated;`
- Publisher hydration continues client-side via existing `get_public_profiles` RPC.

#### 3. Migration: ensure owner/admin moderation-counter access for future surfaces (no UI today)
- `CREATE OR REPLACE FUNCTION public.get_scenario_moderation_counters(p_published_scenario_id uuid) RETURNS TABLE(reported_count int) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$ ... $$;` — gated by `publisher_id = auth.uid() OR has_role(auth.uid(),'admin')`. Registered but no frontend caller now (documented as backend-ready only).

### BF-10 — Proposed changes

#### 4. Migration: drop `reports` from Realtime publication
- `ALTER PUBLICATION supabase_realtime DROP TABLE public.reports;`

#### 5. Migration: remove raw own-SELECT on `reports`, add sanitized RPC
- `DROP POLICY "Users can view own submitted reports" ON public.reports;`
- `CREATE OR REPLACE FUNCTION public.get_my_submitted_reports() RETURNS TABLE(id uuid, story_id text, reason text, status text, created_at timestamptz) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT id, story_id, reason, status, created_at FROM public.reports WHERE reporter_user_id = auth.uid() ORDER BY created_at DESC $$;`
- `GRANT EXECUTE ... TO authenticated;`
- Omits `note`, `reviewed_by`, `accused_user_id`, `accused`, `reporter`. **No normal-user UI consumes this RPC today** — added backend-ready only; documented in Quality Hub.
- INSERT policy `Users can insert own reports` is preserved → report submission still works.
- Admin `Admins can manage reports` policy preserved → admin moderation works.

#### 6. Migration: remove raw own-SELECT on `user_strikes`, add sanitized account-status RPC
- `DROP POLICY "Users can view own strikes" ON public.user_strikes;`
- `CREATE OR REPLACE FUNCTION public.get_my_account_status() RETURNS TABLE(active_strike_count int, total_points int, latest_status text, latest_falls_off_at date) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ ... $$;` — `auth.uid()`-scoped aggregate; omits `issued_by`, `note`, `report_id`, `reason`.
- `GRANT EXECUTE ... TO authenticated;`
- **No normal-user UI consumes this RPC today** — backend-ready only.
- Admin `Admins can manage user strikes` preserved.

### Frontend file changes

- `src/services/gallery-data.ts`
  - Rewrite `fetchSavedScenarios` to call `supabase.rpc('get_saved_scenarios_for_user')` and reassemble `SavedScenario[]` from the flat row shape (publishers hydrated via `get_public_profiles`).
  - Remove `fetchPublishedScenarios` (dead code) **or** mark it owner/admin-only with explicit column list; will remove since no callers.
  - `getPublishedScenario` and `fetchUserPublishedScenarios` — unchanged logic; owner policy continues to satisfy access. Add explicit column lists (no `reported_count`) for defense-in-depth even though policy now gates rows.
- `src/components/account/PublicProfileTab.tsx` — unchanged (owner SELECT policy covers it).
- `src/components/admin/finance/users/ReportsPage.tsx` — remove `supabase.channel("reports-realtime").on("postgres_changes", ...)` subscription and `removeChannel` cleanup; replace with a 30s `setInterval(loadReports, 30_000)` cleared in the effect's return.
- `src/hooks/use-index-scenario-lifecycle.ts`, `src/hooks/use-index-authenticated-data.ts`, `src/pages/Index.tsx`, `src/components/chronicle/ShareStoryModal.tsx`, `src/components/chronicle/StoryHub.tsx` — no logic change; consume the unchanged service function signatures.

### Source-of-truth refresh (after live apply)
- `src/integrations/supabase/types.ts` — regenerated to include new RPCs and removed policies/Realtime entries.
- `src/data/supabase-schema-map.ts`:
  - `published_scenarios.policies`: replace `Anyone can view published scenarios` with `Owners can view own publications` + `Admins can view all publications`; note `anon` SELECT grant revoked.
  - `reports.policies`: remove `Users can view own submitted reports`; mark Realtime as **not published**.
  - `user_strikes.policies`: remove `Users can view own strikes`.
  - `functions[]`: add `get_saved_scenarios_for_user`, `get_scenario_moderation_counters`, `get_my_submitted_reports`, `get_my_account_status`.
- `src/data/database-schema-inventory.ts`: mirror policy/grant/function deltas; record Realtime publication change for `reports`.
- `src/data/architecture-file-analysis.ts`: register the new RPCs; update `ReportsPage.tsx` (drop Realtime), `gallery-data.ts` (new RPC), reflect removal of `fetchPublishedScenarios` if dropped.
- `src/data/api-inspector-prompt-documents.ts` and `src/data/api-usage-validation-registry.ts`: register the four new RPC paths (mark `get_my_submitted_reports` and `get_my_account_status` as "backend-ready, no UI consumer yet").
- `src/data/ui-audit-findings.ts`: new change-log entry `cl-20260619-003` covering BF-10 + BF-11; mark BF-10 and BF-11 issue rows with evidence (pg_policies / pg_publication_tables / probe results).
- `.lovable/plan.md`: append Batch C v2 record.

### Validation probes (run post-apply)

1. **BF-11 proof** — as a non-admin, non-publisher signed-in user:
   - `await supabase.from('published_scenarios').select('reported_count').limit(1)` → returns `[]` (RLS denies all rows).
   - `await supabase.from('published_scenarios').select('id').limit(1)` → returns `[]`.
   - As anon: same query → permission error (no SELECT grant) or `[]`.
   - As publisher of row X: `select('reported_count').eq('id', X)` → returns the row (owner branch).
   - As admin: full access preserved.
2. **Gallery still works** — `fetch_gallery_scenarios` RPC continues to return cards (no policy change to the RPC body; SECURITY DEFINER bypasses RLS).
3. **Saved list still works** — `fetchSavedScenarios` returns cards via new RPC; no `reported_count` in payload.
4. **Owner surfaces** — `ShareStoryModal` (`getPublishedScenario` on own scenario), `StoryHub`, `PublicProfileTab`, `fetchUserPublishedScenarios` all return rows.
5. **BF-10 reports** — `pg_publication_tables` shows `reports` removed; non-admin `select('*').from('reports')` returns `[]`; INSERT of own report still succeeds; admin ReportsPage still shows rows and polls every 30 s.
6. **BF-10 strikes** — non-admin `select('*').from('user_strikes')` returns `[]`; admin moderation UI unchanged.
7. **Snapshots** — `pg_policies` matches updated set; `information_schema.role_table_grants` confirms `anon` no longer holds SELECT on `published_scenarios`; new functions present in `pg_proc` with `SECURITY DEFINER` + `search_path = public`.
8. **Static greps** — `rg "reports-realtime" src` → 0; `rg "fetchPublishedScenarios\\b" src` → 0 (after removal); `rg "from\\(['\\\"]published_scenarios" src` → only owner/admin paths remain.
9. `bun run lint`, typecheck, and relevant vitest suites pass.

### Backend-ready vs UI-consumed (BF-10)
- `get_my_submitted_reports` and `get_my_account_status`: created and granted in this batch, but **no normal-user UI surface consumes them yet**. The existing AccountSettingsTab is not extended in this batch. Quality Hub entry will explicitly flag both as "RPC available, UI deferred to a later batch".

### Explicitly out of scope
- Batch D storage/media buckets (BF-04/05/06).
- Building an AccountStatus UI section.
- Any change to Batch A or Batch B artifacts.
- Schema or policy changes for tables other than `published_scenarios`, `reports`, `user_strikes`.
