# Plan: DB-only migration — 3 post-turn debug/state-sync tables

## Guardrails (explicit confirmation)

- ✅ **Exactly three new tables, nothing else.** Only `public.conversation_state_change_events`, `public.conversation_world_state_snapshots`, and `public.conversation_api_call_traces` will be created. No other tables will be created, altered, dropped, renamed, or have columns added/removed.
- ✅ **No frontend/client/edge-function/code edits.** This migration is DB-only. I will not touch `src/`, `supabase/functions/`, `supabase/config.toml`, types, or any TypeScript/JS file. The auto-regenerated `src/integrations/supabase/types.ts` will refresh on its own after the migration runs — that is automatic, not an edit by me.
- ✅ **No FK to `auth.users`.** `user_id` is a plain `uuid NOT NULL` column with no foreign key. Only FKs are to `public.conversations(id)` and `public.messages(id)`, both `ON DELETE CASCADE`, exactly as specified.
- ✅ **RLS uses `(SELECT auth.uid()) = user_id`.** Every policy USING / WITH CHECK clause is wrapped as `(SELECT auth.uid()) = user_id` — never bare `auth.uid() = user_id`. RLS is enabled on all three tables.
- ✅ **Requested indexes included verbatim.** All 8 indexes (3 + 2 + 3) are created with `IF NOT EXISTS` and the exact names and column orders from your SQL. The `UNIQUE (conversation_id, source_message_id, source_generation_id)` on the snapshots table also creates its implicit index.
- ✅ **`updated_at` trigger only on `conversation_world_state_snapshots`.** The other two tables are append-only and have no `updated_at` column and no trigger. The trigger reuses the existing `public.update_updated_at_column()` function (already present in the project) and is created via `DROP TRIGGER IF EXISTS` then `CREATE TRIGGER` for safe replay.
- ✅ **Idempotent migration.** `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, `DO $$ ... pg_policies guard ... $$` blocks for every policy, and the trigger drop-then-create pattern. Replay-safe.
- ✅ **Will not apply yet.** I will only call `supabase--migration` after you explicitly say "proceed".

## Detailed table specs

### Table 1 — `public.conversation_state_change_events` (append-only ledger)
Captures each accepted post-turn field change, one row per (entity, field) delta.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | uuid | NO | gen_random_uuid() | PK |
| user_id | uuid | NO | — | RLS scope, no FK |
| conversation_id | uuid | NO | — | FK → conversations(id) ON DELETE CASCADE |
| source_message_id | uuid | NO | — | FK → messages(id) ON DELETE CASCADE |
| source_generation_id | uuid | NO | — | matches messages.generation_id |
| entity_type | text | NO | — | CHECK in (`character`, `side_character`, `world`, `story_goal`, `memory`) |
| entity_id | text | YES | — | string allows non-uuid ids (e.g. world keys) |
| entity_name | text | YES | — | denormalized label for export readability |
| field_path | text | NO | — | dotted path, e.g. `currently_wearing.top` |
| previous_value_preview | text | YES | — | truncated preview |
| next_value_preview | text | YES | — | truncated preview |
| story_day | integer | YES | — | snapshot of conversations.current_day |
| time_of_day | text | YES | — | snapshot of conversations.current_time_of_day |
| change_summary | text | YES | — | free-form summary line |
| call_type | text | NO | `'post_turn_state_sync'` | source pipeline |
| created_at | timestamptz | NO | now() | |

Indexes:
- `idx_conversation_state_change_events_user (user_id)`
- `idx_conversation_state_change_events_source (conversation_id, source_message_id, source_generation_id, created_at DESC)`
- `idx_conversation_state_change_events_entity (conversation_id, entity_type, entity_id, created_at DESC)`

RLS (enabled): SELECT, INSERT, DELETE — each `(SELECT auth.uid()) = user_id`. **No UPDATE policy** (immutable ledger).

### Table 2 — `public.conversation_world_state_snapshots` (per-generation world snapshot)

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | uuid | NO | gen_random_uuid() | PK |
| user_id | uuid | NO | — | RLS scope |
| conversation_id | uuid | NO | — | FK → conversations(id) CASCADE |
| source_message_id | uuid | NO | — | FK → messages(id) CASCADE |
| source_generation_id | uuid | NO | — | |
| snapshot | jsonb | NO | `'{}'::jsonb` | full non-character world/story snapshot |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | maintained by trigger |

Constraints: `UNIQUE (conversation_id, source_message_id, source_generation_id)` — one snapshot per generation.

Indexes:
- `idx_conversation_world_state_snapshots_user (user_id)`
- `idx_conversation_world_state_snapshots_conversation (conversation_id, source_message_id, source_generation_id)`

RLS (enabled): SELECT, INSERT, **UPDATE**, DELETE — each `(SELECT auth.uid()) = user_id` (UPDATE has both USING and WITH CHECK).

Trigger: `update_conversation_world_state_snapshots_updated_at BEFORE UPDATE FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()`. Created via DROP IF EXISTS + CREATE.

### Table 3 — `public.conversation_api_call_traces` (append-only API trace log)

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | uuid | NO | gen_random_uuid() | PK |
| user_id | uuid | NO | — | RLS scope |
| conversation_id | uuid | NO | — | FK → conversations(id) CASCADE |
| source_message_id | uuid | YES | — | FK → messages(id) CASCADE; nullable for pre-message calls |
| source_generation_id | uuid | YES | — | nullable to match |
| call_type | text | NO | — | CHECK in (`api_call_1_generation`, `post_turn_state_sync`, `memory_extraction`, `world_state_sync`, `side_character_generation`, `avatar_prompt_generation`) |
| status | text | NO | `'ok'` | CHECK in (`ok`, `skipped`, `error`) |
| request_payload | jsonb | YES | — | raw outgoing payload |
| response_payload | jsonb | YES | — | raw model response |
| parsed_output | jsonb | YES | — | structured parse of response |
| applied_changes | jsonb | YES | — | what was actually written downstream |
| error | text | YES | — | error message when status='error' |
| created_at | timestamptz | NO | now() | |

Indexes:
- `idx_conversation_api_call_traces_user (user_id)`
- `idx_conversation_api_call_traces_source (conversation_id, source_message_id, source_generation_id, call_type, created_at DESC)`
- `idx_conversation_api_call_traces_conversation (conversation_id, created_at DESC)`

RLS (enabled): SELECT, INSERT, DELETE — each `(SELECT auth.uid()) = user_id`. **No UPDATE policy** (immutable trace).

## SQL to execute
The exact SQL block from your message, used verbatim — no edits, no reordering, no additions.

## Post-migration verification (raw output, returned to you)
After the migration applies, I will run these read-only queries (via `supabase--read_query`) and the linter, and paste raw results in chat:

1. **Tables exist** — `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN (...)`.
2. **Columns** — full `column_name, data_type, is_nullable, column_default` dump from `information_schema.columns` for each of the three tables.
3. **Indexes** — `SELECT indexname, indexdef FROM pg_indexes WHERE schemaname='public' AND tablename IN (...)`.
4. **RLS enabled** — `SELECT relname, relrowsecurity FROM pg_class WHERE relname IN (...)`.
5. **Policies** — `SELECT tablename, policyname, cmd, qual, with_check FROM pg_policies WHERE schemaname='public' AND tablename IN (...)` so you can confirm `(SELECT auth.uid()) = user_id` form and per-command coverage.
6. **Trigger** — `SELECT tgname, tgrelid::regclass, pg_get_triggerdef(oid) FROM pg_trigger WHERE tgname='update_conversation_world_state_snapshots_updated_at'`.
7. **Linter** — `supabase--linter` raw output, with each warning explicitly tagged "new (introduced by this migration)" or "pre-existing (unrelated table)".

## Out of scope (explicitly NOT doing)
- No edits to `src/**`, `supabase/functions/**`, `supabase/config.toml`, or any application code.
- No data inserts/updates/deletes anywhere.
- No changes to existing tables, policies, functions, or triggers.
- No auth configuration changes.
- No memory file updates.

## Awaiting your "proceed"
I will not invoke `supabase--migration` until you explicitly approve.