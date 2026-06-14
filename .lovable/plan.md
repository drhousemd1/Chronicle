
# Supabase Fix Plan v4 — Approved

Working one finding at a time. After every step: regenerate `src/integrations/supabase/types.ts`, refresh `src/data/database-schema-inventory.ts` and `src/data/supabase-schema-map.ts`, update Quality Hub registry with evidence, run typecheck/lint/tests/build (when frontend touched), report, then wait.

Global guardrails:
- No user data deletion.
- No row contents, emails, secrets, tokens, story/chat text, images, or NSFW user content in any schema/inventory artifact.
- Finding 003 ends this pass as `in-progress`, not `fixed`.

---

## Step 1 — `qh-sec-20260607-001` `save_scenario_atomic` ownership (next action)

Single migration via `supabase--migration`. Replaces `public.save_scenario_atomic(uuid, uuid, jsonb, jsonb, jsonb, jsonb)` with same signature, SECURITY DEFINER, `search_path = public`.

Logic:

1. **Auth gate** (unchanged):
   ```sql
   IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
     RAISE EXCEPTION 'Unauthorized';
   END IF;
   ```
2. **Pre-flight ownership check** for `p_scenario_id`:
   ```sql
   PERFORM 1 FROM public.stories
     WHERE id = p_scenario_id AND user_id <> p_user_id;
   IF FOUND THEN RAISE EXCEPTION 'Unauthorized: scenario owned by another user'; END IF;
   ```
3. **Story upsert** — `ON CONFLICT (id) DO UPDATE ... WHERE public.stories.user_id = p_user_id`. Then `GET DIAGNOSTICS v_rows = ROW_COUNT;` and, if the story already existed and `v_rows = 0`, raise `Unauthorized: story ownership guard`. Detect "existed" by re-checking row presence pre-upsert (cached in a local boolean) so a fresh insert isn't mis-flagged.
4. **Children** — keep current loop structure; convert each `ON CONFLICT (id) DO UPDATE` to include guarded `WHERE` clauses:
   - characters: `WHERE public.characters.user_id = p_user_id AND public.characters.scenario_id = p_scenario_id`
   - codex_entries: `WHERE public.codex_entries.scenario_id = p_scenario_id`
   - scenes: `WHERE public.scenes.scenario_id = p_scenario_id`
   After each per-row upsert, `GET DIAGNOSTICS v_rows = ROW_COUNT;` — if `0`, raise `Unauthorized: <table> row <id> blocked by ownership guard`.
5. **Deletes** stay scoped to `scenario_id = p_scenario_id` (no row count check; zero deletes are legitimate).

**Verification (post-approval):**
- `supabase--read_query` to assert function body contains the four guard clauses and `GET DIAGNOSTICS`.
- Two-user simulation via temporary fixtures (auth-gated; will use `supabase--read_query` to confirm function signature/body — runtime simulation requires the user; we will document the SQL test plan and rely on body inspection + the GET DIAGNOSTICS guards as the structural evidence). If full runtime tests are required, will request the user run them in app.
- Regenerate `supabase-schema-map.ts` + `database-schema-inventory.ts` (function definition + guard notes only — no row contents).
- Update Quality Hub: `qh-sec-20260607-001` → `fixed`, evidence: function definition excerpt with guards.

No frontend changes in this step → typecheck only.

---

## Step 2 — `qh-sec-20260607-004` characters parent binding (after Step 1 verified)

Single migration: drop+recreate `characters` INSERT and UPDATE policies. INSERT `WITH CHECK` and UPDATE `USING`/`WITH CHECK`:
```sql
auth.uid() = user_id
AND (
  scenario_id IS NULL
  OR EXISTS (SELECT 1 FROM public.stories s WHERE s.id = scenario_id AND s.user_id = auth.uid())
)
```
Library characters (`scenario_id IS NULL`) preserved.

Verify with `supabase--read_query` against `pg_policies`. Refresh inventories. Quality Hub → fixed.

---

## Step 3 — `qh-sec-20260607-002` published_scenarios ownership (after Step 2)

Migration:
- Drop+recreate INSERT/UPDATE/DELETE policies requiring `publisher_id = auth.uid()` **and** `EXISTS (SELECT 1 FROM public.stories s WHERE s.id = scenario_id AND s.user_id = auth.uid())`.
- Quarantine pass (data update, included in same migration as `UPDATE`):
  ```sql
  UPDATE public.published_scenarios ps
  SET is_hidden = true, is_published = false, updated_at = now()
  FROM public.stories s
  WHERE s.id = ps.scenario_id AND s.user_id <> ps.publisher_id;
  ```
  Pre-run `supabase--read_query` to capture the count + IDs of mismatched rows; report to user. No deletions.
- Verify policies via `pg_policies`, refresh inventories, update Quality Hub.

---

## Step 4 — `qh-sec-20260607-011` gallery counters (after Step 3)

Single migration creates `public.scenario_plays` (id, published_scenario_id FK CASCADE, user_id FK CASCADE to auth.users, played_at), grants (`SELECT, INSERT ON ... TO authenticated; ALL TO service_role`), enables RLS, adds owner-only SELECT + INSERT policies (no UPDATE/DELETE), and the recency index.

Functions:
- `record_scenario_play(uuid)` — auth gate, validates `is_published=true AND is_hidden=false`, returns early if a row exists in last 5 min, inserts ledger row, increments `play_count`.
- Harden `record_scenario_view` — add `is_published=true AND is_hidden=false` check before inserting view row / incrementing.
- `sync_like_count()` / `sync_save_count()` — `CREATE OR REPLACE FUNCTION`, recompute target row counts.
- `DROP TRIGGER IF EXISTS trg_sync_like_count ON public.scenario_likes;` then `CREATE TRIGGER ... AFTER INSERT OR DELETE`. Same for `trg_sync_save_count` on `saved_scenarios`.
- Backfill: `UPDATE published_scenarios SET like_count = ..., save_count = ...`.
- `REVOKE EXECUTE ... FROM PUBLIC, anon, authenticated` for the six legacy counter RPCs.

Frontend edits (`src/services/gallery-data.ts`):
- `toggleLike` — drop `increment_like_count`/`decrement_like_count` calls; only insert/delete `scenario_likes`.
- `saveScenarioToCollection` / `unsaveScenario` — drop `increment_save_count`/`decrement_save_count` calls.
- `incrementPlayCount` → call `record_scenario_play`.
- `incrementViewCount` — already wraps `record_scenario_view`, keep.
- `rg "increment_(like|save|view|play)_count|decrement_(like|save)_count" src` must come back empty.

QA: typecheck, lint, tests, build. Refresh inventories + types. Quality Hub → fixed.

---

## Step 5 — `qh-sec-20260607-008` profile privacy (after Step 4)

Migration:
- Drop broad profiles SELECT. Add owner SELECT (`auth.uid() = id`) and admin SELECT (`public.has_role(auth.uid(), 'admin')`).
- `get_public_profiles(uuid[])` returning id, username, display_name, avatar_url, avatar_position, hide_profile_details, hide_published_works (no about_me, no preferred_genres).
- `get_public_creator_profile(uuid) returns jsonb` enforcing both privacy flags server-side. Owner/admin → full view. Otherwise:
  - `hide_profile_details=true` → `{ id, hide_profile_details:true }` only.
  - `hide_published_works=true` → profile shell, no works, no public work stats.
  Works query uses `SELECT COALESCE(jsonb_agg(to_jsonb(w) ORDER BY w.created_at DESC), '[]'::jsonb) INTO v_works FROM (...) w;` per spec.
- Revise `get_creator_stats` to return zeros for public stats when caller is not owner/admin and `hide_published_works=true`. Keep `follower_count` public.
- **Tighten `published_scenarios` SELECT policy** to gate on `profiles.hide_published_works`:
  ```sql
  USING (
    (is_published AND NOT is_hidden
      AND EXISTS (SELECT 1 FROM public.profiles p
                  WHERE p.id = published_scenarios.publisher_id
                    AND COALESCE(p.hide_published_works,false) = false))
    OR publisher_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  )
  ```
- Update `fetch_gallery_scenarios` body to manually exclude rows where publisher profile has `hide_published_works=true` (since SECURITY DEFINER bypasses RLS). Owner/admin branch preserved.

Frontend:
- `src/pages/CreatorProfile.tsx` → single `rpc('get_public_creator_profile', { p_user_id })`. Branch UI on returned flags.
- Saved-scenario and review author chips → `get_public_profiles`.
- Finance/admin reads unchanged (admin policy covers).
- `PublicProfileTab` self-read unchanged.

Verify: targeted `supabase--read_query` for both hidden states; typecheck/lint/tests/build. Refresh inventories + types. Quality Hub → fixed only after both flags verified.

---

## Step 6 — `qh-sec-20260607-003` storage Stage A (after Step 5)

**No DB or storage changes.** Inventory only:
- Create `docs/guides/storage-privacy-migration.md`. For each bucket (avatars, scenes, covers, backgrounds, image_library), list code paths from `rg "getPublicUrl|from\('(avatars|scenes|covers|backgrounds|image_library)'\)" src supabase` and classify each as owner-only / publisher-owned public / gallery-public / admin-only / app-static. No real URLs, no row content.
- Quality Hub: `qh-sec-20260607-003` stays `in-progress`; add change-log note that Stage B (signed-URL helper + bucket flips for `scenes` and `image_library`) is out of scope this pass.

---

## Wait-points

After each step: report what changed, what was verified, and stop until you say "continue with step N+1". Step 1 is the next action on approval.
