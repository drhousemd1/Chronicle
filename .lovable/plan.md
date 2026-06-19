## Batch D — Media Storage Privacy (BF-04, BF-05, BF-06, PD-01) — Revised

Single controlled batch, executed in ordered internal stages. No part is deferred. Plan only; await approval.

### Contract (governs every decision below)

- **Public URL fields are allowed only for intentionally public surfaces:** `profiles.avatar_url` (profile avatars) and `stories.published_cover_url` (published gallery cover mirror). Nothing else may persist a long-lived public URL.
- **Private/custom media** (page backgrounds, user-uploaded sidebar themes, draft/private covers, private character/side-character avatars) must persist a durable bucket path in a `*_path` column and render through `getSignedMediaUrl`. No public-URL fallback after backfill closes.
- **Default/shared sidebar themes** are admin-owned public assets in a dedicated public bucket. Normal users cannot write to that bucket.

### 1. Current live state (confirmed in repo + Supabase)

- Buckets: `avatars` PUBLIC (profile + character + side-char + import re-uploads), `covers` PUBLIC (drafts AND published), `backgrounds` PUBLIC (page backgrounds AND user sidebar themes AND any admin defaults — all mixed), `scenes`/`image_library` PRIVATE (signed URL, Stage B complete), `guide_images` PUBLIC admin-only, `finance_documents` PRIVATE admin-only.
- Rows store permanent public URLs in: `user_backgrounds.image_url`, `sidebar_backgrounds.image_url`, `stories.cover_image_url`, `characters.avatar_url`, `side_characters.avatar_url`, `profiles.avatar_url`.
- No `*_path` durable columns exist except `scenes.image_path` and `library_images.image_path`.
- `sidebar_backgrounds.category` already exists and can distinguish `default`/`shared` from user uploads.
- `signed-media.ts` `PrivateBucket` union covers only `scenes | image_library`.

### 2. Target storage layout

| Bucket | Public? | Contents | Path | Writable by |
|---|---|---|---|---|
| `avatars` | **Public** | Profile avatars ONLY | `<userId>/profile/<file>` | owner, only under `<userId>/profile/` |
| `covers` | **Public** | Published gallery cover mirrors ONLY | `<userId>/<publishedScenarioId>/<file>` | service role (publish RPC) + owner of that published scenario |
| `sidebar_themes_public` | **Public (new)** | Default/shared sidebar themes | `default/<file>` or `shared/<file>` | admin only |
| `user_backgrounds_private` | Private (new) | Page backgrounds | `<userId>/<file>` | owner |
| `sidebar_backgrounds_private` | Private (new) | User-uploaded sidebar themes | `<userId>/<file>` | owner |
| `story_covers_private` | Private (new) | Draft/private covers + master copy of published covers | `<userId>/<scenarioId>/<file>` | owner, admin |
| `character_avatars_private` | Private (new) | Character + side-character avatars | `<userId>/<scenarioId>/<file>` | owner, admin; readable signed by anyone via helper when story is published-and-visible |
| `backgrounds` | **Deleted at end of batch** | — | — | — |

`backgrounds` bucket is decommissioned because its current dual-use (page bg + sidebar theme + would-be admin defaults) is exactly the BF-04/05 mixing problem. After backfill into `user_backgrounds_private` / `sidebar_backgrounds_private` / `sidebar_themes_public`, the `backgrounds` bucket is emptied and dropped in the same batch.

### 3. New / changed schema

Additive columns (no drops in same step):
- `user_backgrounds.image_path text`
- `sidebar_backgrounds.image_path text` (existing `category` column distinguishes default vs user rows)
- `stories.cover_image_path text` (private master)
- `stories.published_cover_url text` (public mirror, set only by publish flow)
- `characters.avatar_path text`
- `side_characters.avatar_path text`

After backfill closes (Stage E in same batch):
- `UPDATE` all private rows: set `*_url` to NULL where a `*_path` is present and the row is private.
- `user_backgrounds.image_url`, `sidebar_backgrounds.image_url` (user rows only), `characters.avatar_url`, `side_characters.avatar_url`, `stories.cover_image_url` are dropped at end of batch — they have no remaining legitimate use. (Default sidebar rows move to `sidebar_backgrounds.image_url` referencing `sidebar_themes_public`; that column stays for default rows. Implementation note: we keep the column for the table because default rows still need a public URL, but enforce via trigger that user-owned rows must have NULL `image_url` and non-NULL `image_path`.)
- `stories.cover_image_url` is dropped; gallery renders `published_cover_url`, owner UIs render signed URL from `cover_image_path`.
- `characters.avatar_url`, `side_characters.avatar_url` dropped; renderers use signed URL.
- `profiles.avatar_url` kept (intentionally public).

New helper functions:
- `public.can_read_private_story_media(p_bucket text, p_path text) returns boolean` — SECURITY DEFINER. Returns true if (a) caller owns the path, (b) caller is admin, or (c) path belongs to a row in `characters`/`side_characters`/`stories` whose parent story is published, not hidden, and publisher not hiding works. Mirrors the existing `can_read_scene_storage_object` pattern.
- Trigger `enforce_private_media_url_null` on `user_backgrounds`, `sidebar_backgrounds` (user rows), `characters`, `side_characters`, `stories` (private state): rejects INSERT/UPDATE that sets `image_url`/`avatar_url`/`cover_image_url` on a private row.
- Publish RPC update: `promote_story_cover_to_public(p_scenario_id uuid)` copies bytes from `story_covers_private` → `covers`, sets `published_cover_url`, returns the public URL. Unpublish/hide RPC clears `published_cover_url` AND deletes the public-bucket copy.

### 4. Storage RLS (storage.objects)

- `user_backgrounds_private`, `sidebar_backgrounds_private`: SELECT/INSERT/UPDATE/DELETE gated on `auth.uid()::text = (storage.foldername(name))[1]` OR admin.
- `story_covers_private`: same owner+admin gate.
- `character_avatars_private`: SELECT allowed when owner/admin OR `can_read_private_story_media('character_avatars_private', name)` returns true. Writes owner+admin only.
- `sidebar_themes_public`: SELECT `authenticated` + `anon`. INSERT/UPDATE/DELETE `has_role(auth.uid(),'admin')`.
- `avatars`: tighten — INSERT/UPDATE/DELETE require `(storage.foldername(name))[1] = auth.uid()::text AND (storage.foldername(name))[2] = 'profile'`. SELECT remains public.
- `covers`: tighten — INSERT/UPDATE/DELETE service role only (executed by publish RPC); SELECT public.
- `backgrounds`: all policies dropped at end of batch when bucket is deleted.

### 5. Backfill (admin-invoked edge function `migrate-media-to-private`)

Idempotent, per-bucket pass:
1. `user_backgrounds`: parse `<userId>/<file>` from `image_url`, copy bytes `backgrounds` → `user_backgrounds_private`, set `image_path`, NULL `image_url`, delete source object.
2. `sidebar_backgrounds`:
   - `category IN ('default','shared')` rows: copy bytes → `sidebar_themes_public/default/<file>`, rewrite `image_url` to new public URL, NULL `image_path`.
   - All other rows: copy to `sidebar_backgrounds_private`, set `image_path`, NULL `image_url`.
3. `stories`: copy current `cover_image_url` bytes → `story_covers_private`, set `cover_image_path`. For rows where `published_scenarios.is_published = true AND is_hidden = false`, also copy → `covers/<userId>/<publishedScenarioId>/<file>` and set `published_cover_url`. NULL `cover_image_url`.
4. `characters`, `side_characters`: copy `avatar_url` bytes → `character_avatars_private/<userId>/<scenarioId>/<file>`, set `avatar_path`, NULL `avatar_url`.
5. `profiles.avatar_url`: untouched.
6. Failures written to `media_migration_errors(row_table, row_id, source_url, error, created_at)` for admin review. Bucket cleanup waits until errors are zero.

After Stage E reports zero errors and validation probes pass:
- Drop columns listed in §3.
- `DELETE FROM storage.objects WHERE bucket_id = 'backgrounds';` then drop bucket via SQL (`delete from storage.buckets where id='backgrounds'`).

### 6. Export / Import / Remix

- Export serializes `*_path` plus a one-shot signed URL (short TTL) that the export downloader uses to inline bytes into the export archive. Public surfaces (profile avatar, published cover) keep their public URL.
- Import / Remix: `library-copy.ts` `copyMediaForUser` extended to all four new private buckets. Importer's user id is the only owner segment; original owner's path is never reused. `ensureStorageUrl` in `scenarios.ts` refactored to `ensureStoragePath` returning `{ bucket, path }`. Publish flow on the imported story calls `promote_story_cover_to_public` independently.

### 7. Frontend files changed (exact list)

Services:
- `src/services/persistence/media-settings.ts` — switch `uploadAvatar` (only profile path), add `uploadProfileAvatar`, replace `uploadCoverImage` with `uploadStoryCoverPrivate`, replace `uploadBackgroundImage` → `uploadUserBackgroundPrivate`, replace `uploadSidebarBackgroundImage` → `uploadSidebarThemePrivate`; all return `{ path }`. Update `createUserBackground`/`createSidebarBackground` to persist `image_path` and never write `image_url` for user rows. Update delete helpers to remove from the new buckets.
- `src/services/persistence/signed-media.ts` — extend `PrivateBucket` union with the four new buckets.
- `src/services/persistence/scenarios.ts` — `ensureStorageUrl` → `ensureStoragePath`; hydrate signed URLs at load time; save persists `cover_image_path`.
- `src/services/persistence/library-copy.ts` — add the four new private destinations.
- `src/services/persistence/characters.ts` and `side-characters.ts` — read/write `avatar_path`, no longer write `avatar_url`.

Components:
- `src/components/account/PublicProfileTab.tsx` — upload to `avatars/<userId>/profile/<file>` (only writer to `avatars`).
- `src/components/chronicle/BackgroundPickerModal.tsx`, `ImageLibraryPickerModal.tsx`, `ChatInterfaceTab.tsx` — render via `getSignedMediaUrl` for user rows; public URL for default/shared sidebar rows.
- `src/components/chronicle/GalleryStoryCard.tsx`, `StoryDetailModal.tsx` — gallery uses `published_cover_url`; owner-only previews use signed URL from `cover_image_path`.
- `src/features/character-editor-modal/CharacterEditorModalScreen.tsx`, `src/features/character-builder/CharacterBuilderScreen.tsx` — read/write `avatar_path`, render via signed URL.
- `src/features/story-builder/hooks/use-story-builder-media.ts` — uploads to `story_covers_private`, persists `cover_image_path`; on publish triggers `promote_story_cover_to_public`.

Edge functions:
- `supabase/functions/generate-cover-image/index.ts` — write to `story_covers_private`, return `{ path }`.
- `supabase/functions/generate-side-character-avatar/index.ts` — write to `character_avatars_private`, return `{ path }`.
- `supabase/functions/migrate-base64-images/index.ts` — target new private buckets per row type.
- New `supabase/functions/migrate-media-to-private/index.ts` — admin-invoked backfill described in §5.
- Publish/unpublish RPC wiring (in existing publish edge function or RPC) updated to call `promote_story_cover_to_public` / cleanup.

### 8. Migrations / live changes (ordered, single batch)

Stage A — additive schema + new buckets:
1. `storage_create_bucket` ×5: `user_backgrounds_private`, `sidebar_backgrounds_private`, `story_covers_private`, `character_avatars_private` (private); `sidebar_themes_public` (public).
2. SQL migration: add the six new columns in §3; create `can_read_private_story_media`; create RLS on storage.objects for the five new buckets; create `enforce_private_media_url_null` trigger (initially DISABLED); create `promote_story_cover_to_public` RPC.

Stage B — frontend renderer + writer changes shipped behind the existing fields (writers go to new buckets/paths, readers prefer `*_path` then fall back to `*_url`).

Stage C — backfill via `migrate-media-to-private` until `media_migration_errors` is empty.

Stage D — flip readers to `*_path`-only; enable `enforce_private_media_url_null` trigger; NULL all private `*_url` columns.

Stage E — lockdown migration:
1. Tighten `avatars` policies to `<userId>/profile/` writes.
2. Tighten `covers` policies to service-role writes.
3. Drop columns: `user_backgrounds.image_url`, `characters.avatar_url`, `side_characters.avatar_url`, `stories.cover_image_url`. Keep `sidebar_backgrounds.image_url` (default rows only, enforced by trigger).
4. Empty + drop `backgrounds` bucket and its policies.

Each SQL change goes through `supabase--migration`. Stage C runs through the edge function. All stages occur within this batch.

### 9. Schema snapshots / generated types

- Regenerate `src/integrations/supabase/types.ts`.
- Update `src/data/database-schema-inventory.ts`, `src/data/supabase-schema-map.ts` — buckets, new columns, helper function, dropped columns, dropped bucket.
- Update `src/data/architecture-file-analysis.ts` — new edge function, changed services.
- Update `src/data/api-usage-validation-registry.ts` — new RPCs (`can_read_private_story_media`, `promote_story_cover_to_public`).
- Update `docs/guides/storage-privacy-migration.md` with Stage C section + matrix.

### 10. Validation probes (must all pass before batch closes)

Cold-public-URL denial (the BF-04/05/06 acceptance test):
- For one row per private surface (page background, user sidebar theme, draft cover, character avatar in private story, side-character avatar in private story), execute as **anon (no auth header)** and as **a different authenticated user**:
  - `GET` against the legacy `https://<project>.supabase.co/storage/v1/object/public/backgrounds/<path>` → 400/404 (bucket gone).
  - `GET` against the new private bucket public URL → 400.
  - `supabase.storage.from(<private bucket>).list('<otherUserId>')` → empty / denied.
  - `supabase.storage.from(<private bucket>).createSignedUrl('<otherUserId>/<file>', 60)` → error.
- For published-story character avatar: same probes succeed via `can_read_private_story_media` signed URL, fail on direct public URL.

Positive paths:
- Owner upload + render + delete for each private bucket.
- Publish flow: draft cover (private) → publish → `published_cover_url` populated, public URL fetchable; unpublish → public URL 404 and `published_cover_url` cleared.
- Profile avatar upload still public.
- Default sidebar theme visible to all authenticated users.

Backend:
- `pg_policies` snapshot for `storage.objects` matches §4.
- `media_migration_errors` row count = 0 before Stage E lockdown migration runs.
- `select count(*) from storage.objects where bucket_id='backgrounds'` = 0 before bucket drop.
- `\d` snapshots confirm dropped columns.

Automated:
- `bun run lint`, build typecheck, `vitest run` for `media-settings`, `library-copy`, `signed-media` (with new bucket union), `scenarios` import/export, publish flow tests.
- Playwright smoke: gallery loads with covers; owner sees draft cover; non-owner cannot.

### 11. Quality Hub / change log

- `cl-20260619-004` in `src/data/ui-audit-findings.ts` with BF-04/05/06/PD-01 evidence (probe outputs, migration filenames, edge-function commit).
- Mark BF-04, BF-05, BF-06, PD-01 `resolved`.
- Append Stage C section to `docs/guides/storage-privacy-migration.md` covering the five new buckets, dropped `backgrounds` bucket, dropped legacy columns, and the cold-URL denial matrix.

### Risks / mitigations

- **Backfill duration**: large media volume could be slow. Edge function processes in chunks of 100 rows, resumable via `media_migration_errors` + `*_path IS NOT NULL` skip.
- **Storage.objects RLS on the four private buckets via SECURITY DEFINER helper**: same pattern as existing `can_read_scene_storage_object`, low risk.
- **Trigger blocking legacy writes**: enabled only after Stage D flip so Stage B dual-write logic isn't broken.
- **Bucket drop is destructive**: only runs after `storage.objects` for that bucket is empty AND probes pass.

No part of BF-04/05/06/PD-01 is deferred. Stage E lockdown and bucket drop are inside this batch and gated on the validation probes in §10.
