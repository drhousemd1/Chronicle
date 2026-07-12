## Goal

Make `/style-guide/supabase-schema-reference` an accurate source of truth. Data-only edits in `src/data/supabase-schema-reference.ts`. No page redesign, no schema/RLS/storage/migration changes.

## Scope

Only these files may change:

- `src/data/supabase-schema-reference.ts` (data corrections + add missing `scenario_plays` object)
- `src/data/supabase-schema-reference.test.ts` (only if object/row counts change; keep drift + controlled-vocabulary tests intact)

Out of scope: page component, styling, admin route gate, legend behavior, table columns, edge functions, migrations, RLS, storage policies, docs guides, other snapshot files.

## Classification rules (final)

### Raw Backend Exposure

Mark `Yes` when any human role — including the row's owner — can directly `SELECT`/list the raw table row or read the raw storage file through Supabase RLS/grants, outside the intended app UI (e.g. via the Data API, PostgREST, a signed-in supabase-js `.select('*')`, or a public bucket URL). Also `Yes` when an RPC/edge function is a thin passthrough returning raw rows/files with no meaningful curation.

Mark `No` only when user-facing access goes through curated SECURITY DEFINER RPCs (masked/filtered fields, privacy branches, aggregates), edge functions with service-role gating, signed URLs to private buckets, or aggregate counters — i.e. app-controlled paths that never hand back the raw row/file.

Consequence: **owner-scoped CRUD tables with a direct `USING (auth.uid() = user_id)` SELECT policy are `rawExposure: Yes`** even though other users' rows are blocked. Only tables where the base SELECT is denied to the owner and access flows exclusively through a curated definer path stay `No`.

### Read / Write / Update / Delete cells

Controlled values only: `Admin`, `None`, `Owner`, `Public`, `Signed-in`, `System` (combine with `/` when a policy legitimately grants two actors). **No explanatory prose, parentheticals, or function names in these cells.** All context — which RPC performs the write, why an owner cannot directly SELECT, published-scenario branches, service-role paths — goes in `purpose` or the object-level access/security rationale text.

For tables reachable only through SECURITY DEFINER functions with no direct SELECT policy: `Read` = `None` unless a real backend/system/admin process directly reads the raw table (`System` / `Admin`). Do not label `Read` as `Owner`/`Public` just because a definer RPC returns derived data. `Write`/`Update`/`Delete` reflect the actor whose action causes the change — usually `Owner` when a user action triggers a definer insert on their own row, `System` when service role writes independently.

## Findings before editing

- Live DB has 45 tables. The data file has 44 → **`scenario_plays` is missing** and must be added.
- 11 storage buckets already present in the `media-storage-buckets` object; access strings need verification.
- Many existing rows have filler `purpose` and single-role access guesses that need per-table review against real RLS.

## Work plan (single pass)

For each of the 45 tables and 11 storage buckets:

1. Pull live policies from `pg_policies` and columns from `information_schema.columns` via `supabase--read_query`; cross-check with known RLS-relevant functions (`has_role`, `can_read_scene_storage_object`, `can_read_private_story_media`, `get_public_creator_profile`, `get_public_profiles`, `get_public_app_flags`, `get_public_art_styles`, `fetch_gallery_scenarios`, `record_scenario_play`, `record_scenario_view`, `save_scenario_atomic`, `set_admin_access`, `get_my_*`).
2. Reconcile each row's `field` and `type` with the real column set.
3. For each row, correct:
   - `purpose` — real column role; when a definer function is the only write path, or a curated RPC is the only read path, name it here (not in the access cells).
   - `category` — from existing taxonomy.
   - `sensitivity` — High for private user/session content, private media paths, moderation/finance/admin/security, account-linked behavior; Medium for user-specific non-catastrophic; Low for timestamps, keys, safe operational metadata.
   - `rawExposure` — per rule above; owner-SELECT tables = `Yes`.
   - `read/write/update/delete` — controlled values only; per rule above.
   - `feedsUi` + `appLocation` — `appLocation` = `None` when `feedsUi` = `No`; otherwise a controlled surface name.

### New object: `scenario_plays`

Columns: `id`, `published_scenario_id`, `user_id`, `played_at`. Only 1 policy (owner-scoped insert triggered by `record_scenario_play` SECURITY DEFINER; no SELECT policy).

- `Read` = `None`, `Write` = `Owner`, `Update` = `None`, `Delete` = `None`.
- `rawExposure` = `No` (no direct SELECT for owner or anyone; only aggregate `play_count` surfaces).
- `feedsUi` = `No`, `appLocation` = `None`.
- Sensitivity: High. `purpose` explains that `record_scenario_play` performs the write and that reads happen only via the aggregate counter on `published_scenarios`.

### Expected corrections (illustrative)

- Owner-scoped roleplay/session/library tables (`stories`, `characters`, `codex_entries`, `scenes`, `content_themes`, `side_characters`, `memories`, `messages`, `conversations`, `character_session_states`, `character_state_message_snapshots`, `side_character_message_snapshots`, `conversation_world_state_snapshots`, `conversation_state_change_events`, `conversation_api_call_traces`, `conversation_dialog_debug_comments`, `goal_alignment_states`, `story_goal_step_derivations`, `image_folders`, `library_images`, `user_backgrounds`, `sidebar_backgrounds`, `saved_scenarios`, `creator_follows`, `scenario_likes`, `scenario_reviews`, `remixed_scenarios`): if the base SELECT policy is `auth.uid() = user_id`, mark `rawExposure: Yes`, read `Owner` (or `Owner/Admin` where has_role branch exists). Sensitivity stays High.
- `profiles`: base table SELECT policy determines `rawExposure`; fields returned only via `get_public_creator_profile`/`get_public_profiles` and not by the base policy stay `No`.
- `published_scenarios`: `rawExposure: Yes` if base policy allows anyone to SELECT `is_published AND NOT is_hidden` directly; otherwise `No` with read `None`/`System`.
- `app_settings`: base `Admin`; `get_public_app_flags` is curated → `No`.
- `art_styles`, `guide_documents`: `rawExposure` per base SELECT policy; curated RPC output alone doesn't flip it.
- `user_roles`: read via `has_role` definer only → `Read: None`, write/update/delete `Admin` via `set_admin_access`.
- Behavior/moderation tables (`reports`, `user_strikes`, `scenario_views`, `scenario_plays`): definer-only rule.
- Admin/system tables (`admin_notes`, `media_migration_errors`, `ai_usage_events`, `ai_usage_test_events`, `ai_usage_test_sessions`, `finance_documents`, `ad_spend`, `quality_hub_registries`): admin/system, High sensitivity.
- Storage buckets: reconcile with `can_read_scene_storage_object` / `can_read_private_story_media`. Public buckets (`avatars`, `covers`, `backgrounds`, `guide_images`) = `rawExposure: Yes` for reads. Private buckets accessed via signed URLs stay `No`. Access cells hold only controlled values; the published-scenario branch explanation goes in `purpose`/rationale.

## Tests

Update `src/data/supabase-schema-reference.test.ts` only if counts change:

- Objects 45 → **46** (add `scenario_plays`).
- Tables 44 → **45**. Storage = 1.
- Row total recomputed after edits.

Keep intact: controlled-vocabulary test (now also effectively enforces the "no prose in access cells" rule via `splitSchemaReferenceAccess` + `accessValues`), rejected-actors test, App Location ↔ Feeds UI test, reports-search test.

## Validation

1. `npm run test -- src/data/supabase-schema-reference.test.ts`
2. `npm run typecheck`
3. `npm run lint`
4. `npm run build`
5. Playwright against `http://localhost:8080/style-guide/supabase-schema-reference`: search, All/Tables/Storage filters, jump links, collapse/expand, Legend toggle, no console errors; verify Admin Panel tile still opens the route.

## What I will not change

Page component, layout, styling, legend, columns, admin gate; any Supabase schema, RLS, storage policy, edge function, secret, migration; snapshot files (`supabase-schema-map.ts`, `database-schema-inventory.ts`, `integrations/supabase/types.ts`); Quality Hub registry; controlled vocabulary; test intent.

## Report back

- Tables added (`scenario_plays`) and tables updated with per-row deltas.
- Storage bucket rows updated.
- Sources checked (pg_policies per table, information_schema.columns per table, referenced db functions).
- Rows flagged for human review — likely candidates: exact base-SELECT posture on `profiles` and `published_scenarios`; owner-visibility on debug/trace tables (`conversation_api_call_traces`, `conversation_dialog_debug_comments`); any table where base policy and definer function disagree on effective actor.
- Which validation commands passed.
