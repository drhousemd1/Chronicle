# Supabase Schema Snapshot

Run a single read-only introspection pass against live Lovable Cloud and produce two synchronized outputs Codex can consume.

## Outputs

1. **`/mnt/documents/supabase-schema-snapshot.json`** — raw live snapshot, downloadable artifact.
2. **`src/data/supabase-schema-map.ts`** — typed projection, app-importable, ready for an Admin → Supabase Schema Map tool to render.

Both files include a `generatedAt` timestamp, source project ref, and a `verification` field marking any item that could not be confirmed as `needs_verification`.

## Snapshot contents

Schema metadata only — no row contents, no secrets, no PII, no user/auth tokens, no chat/story text, no images.

- **Tables** (public schema): name, columns (name, type, nullable, default, identity), primary keys, foreign keys, unique constraints, check constraints, comments.
- **Row counts**: approximate via `pg_class.reltuples` (safe, no scan, no row data).
- **Grants**: per-role privileges (`anon`, `authenticated`, `service_role`) from `information_schema.role_table_grants`.
- **RLS**: `relrowsecurity` flag + every policy (name, command, roles, `USING`, `WITH CHECK`).
- **Functions / RPCs**: name, language, return type, arg signature, `SECURITY DEFINER` flag, `search_path` setting. Source bodies omitted (already visible in db-functions context).
- **Triggers**: name, table, timing, event, function.
- **Storage buckets**: name, public flag, file size limit, allowed mime types.
- **Storage policies**: policies on `storage.objects` scoped per bucket.
- **Edge functions**: listed from `supabase/functions/*/index.ts` directory scan (filesystem, not DB) — name + path only.
- **Enums**: custom types in `public` (e.g. `app_role`).

Anything the introspection query cannot resolve gets `"status": "needs_verification"` rather than a guessed value.

## Execution steps

1. Run one consolidated `SELECT jsonb_build_object(...)` via `supabase--read_query` covering tables, columns, FKs, policies, grants, functions, triggers, enums.
2. Run a second query against `storage.buckets` + `storage.policies` for storage facts.
3. Scan `supabase/functions/` directory for edge function list.
4. Merge into one JSON object → write to `/mnt/documents/supabase-schema-snapshot.json`.
5. Generate `src/data/supabase-schema-map.ts` with TypeScript interfaces (`SchemaTable`, `SchemaColumn`, `SchemaPolicy`, `SchemaFunction`, `SchemaBucket`, etc.) and a single `const supabaseSchemaMap: SupabaseSchemaSnapshot = { ... } as const` export.
6. Report counts (N tables, N policies, N functions, N buckets) and surface the artifact tag for download.

## Out of scope

- No Admin UI tool is built this turn — Codex builds the renderer from these files per your plan.
- No schema changes, no migrations, no edge function deploys.
- No row data, secrets, API keys, emails, messages, or images are read or written.
