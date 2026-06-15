# Storage Privacy Migration

Tracking finding **qh-sec-20260607-003** (Quality Hub). Stage A captured the
bucket inventory and classification; Stage B (complete and verified as of
**2026-06-14**) flipped the `image_library` and `scenes` buckets to private
behind owner/admin/published-gated storage policies and routed every render
path through signed URLs. The finding is marked **fixed / verified** in the
Quality Hub (`cl-20260614-007`); the cross-user export/import/remix
portability follow-up is tracked separately as `qh-port-20260614-001`.

The bucket classification and code-path inventory below reflect the
post-Stage-B state. No buckets remain pending a flip.

## Bucket classification

| Bucket | State | Classification | Notes |
| --- | --- | --- | --- |
| `avatars` | public | **publisher-owned public** (gallery + character chips) | Surfaces in the gallery and on every profile/character tile, so public URLs are acceptable. Path convention is `<user_id>/...`. |
| `covers` | public | **publisher-owned public** (gallery covers) | Cover art ships with every published scenario; gallery consumers expect a long-lived URL. |
| `backgrounds` | public | **publisher-owned public** (UI backgrounds) | Sidebar/scene backdrops; shared across the user's own sessions and not user-private content. |
| `guide_images` | public | **app-static public** (admin guide assets) | Edited only by admins; consumed by the in-app guide for every signed-in user. |
| `scenes` | **private** | **private + signed URLs** | Generated scene art. Bucket is private; SELECT is gated by `public.can_read_scene_storage_object(name)` (owner / admin / published-visible). All reads are minted through `getSignedMediaUrl('scenes', image_path)`. |
| `image_library` | **private** | **private + signed URLs** | User-managed personal image library. Owner-only SELECT via the `Owners can view own image_library` storage policy; reads minted through `getSignedMediaUrl('image_library', image_path)`. |
| `finance_documents` | private | private (admin-only) | Unchanged. Listed for completeness. |

## Code paths

Source: `rg "getPublicUrl|from\('(avatars|scenes|covers|backgrounds|image_library)'\)" src supabase`.

### `avatars` (publisher-owned public)

- `src/components/account/PublicProfileTab.tsx` — uploads the signed-in user's
  profile avatar and stores the resulting public URL on `profiles.avatar_url`.
- `src/components/admin/AdminToolEditModal.tsx`,
  `src/components/admin/ImageGenerationTool.tsx` — admin tooling uploads
  reference images and reads `getPublicUrl` for preview.
- `supabase/functions/generate-side-character-avatar/index.ts` — edge function
  uploads generated side-character avatars and stores the public URL.
- `supabase/functions/migrate-base64-images/index.ts` — admin-only migration
  edge function that backfills inline base64 avatars to bucket storage.

### `covers` (publisher-owned public)

- `supabase/functions/generate-cover-image/index.ts` — uploads AI-generated
  cover art and writes `stories.cover_image_url` to the public URL.
- `supabase/functions/migrate-base64-images/index.ts` — admin migration path.

### `backgrounds` (publisher-owned public)

- `src/services/persistence/media-settings.ts` — uploads, fetches, and removes
  sidebar/scene background images on behalf of the signed-in user.
- `src/features/character-builder/CharacterBuilderScreen.tsx` — uploads
  character-builder backdrops for the owning user.

### `scenes` (private + signed URLs)

- `src/utils.ts`, `src/services/persistence/shared.ts` — generic
  `getPublicUrl(bucket, path)` helper retained for the still-public buckets.
  Private buckets (`scenes`, `image_library`) are resolved through
  `src/services/persistence/signed-media.ts` (`getSignedMediaUrl`).
- `src/services/persistence/scenarios.ts` — selects/deletes from the
  `public.scenes` **table** (not the bucket) for the owner; included here so the
  Stage B helper change does not get conflated with table reads.

### `image_library` (private + signed URLs)

- `src/components/chronicle/ImageLibraryTab.tsx` — uploads, lists, and removes
  the signed-in user's library images; today calls `getPublicUrl` to render
  every tile.

### `finance_documents` (already private, admin-only)

- `src/components/admin/finance/documents/DocumentsPage.tsx` and related admin
  components — restricted to admins by RLS + UI gating. No Stage B action.

## Stage B summary (2026-06-14)

Stage B is complete and verified. Highlights:

- Added `image_path` columns to `scenes` and `library_images` (Migration A) and
  backfilled existing rows where the public URL could be parsed.
- Added `public.can_read_scene_storage_object(p_path)` (admin/owner + published
  scenario predicate). Currently unused by storage policies; reserved for the
  follow-up `scenes`-bucket flip.
- Updated `get_folders_with_details()` and `save_scenario_atomic()` to expose
  and persist `image_path` / `thumbnail_path`.
- Tightened `public.get_creator_stats()` to return zeros for non-owners /
  non-admins when `hide_profile_details` or `hide_published_works` is true.
- New frontend helpers:
  - `src/services/persistence/signed-media.ts` — cached `createSignedUrl`
    resolver for the `image_library` and `scenes` private buckets. Signed URLs
    are display-only and MUST NOT be persisted.
  - `src/services/persistence/library-copy.ts` — copies bytes from the private
    `image_library` into a destination bucket (covers / avatars / backgrounds
    / scenes) and returns either a public URL (public dest) or a
    `storage://<bucket>/<path>` sentinel (`scenes`).
- `ImageLibraryPickerModal` resolves thumbnails through signed URLs and copies
  the selected image into a `destBucket` before invoking `onSelect`, so legacy
  consumers continue to receive a long-lived destination URL. New
  `onSelectWithPath` callback exposes `imagePath` for callers that persist it.
- All six picker consumers wired with explicit `destBucket`:
  `SceneGalleryActionButtons` (`scenes`), `CoverImageActionButtons` (`covers`),
  `AvatarActionButtons` (`avatars`), `UploadSourceMenu` (defaults `avatars`),
  `BackgroundPickerModal` (`backgrounds`), `SidebarThemeModal` (`backgrounds`).
- `ImageLibraryTab` now stores `image_path` on upload, deletes via
  `image_path`, and renders folder + image thumbnails through signed URLs.
- `Scene` TypeScript model gained `imagePath`. `dbToScene` strips
  `storage://` sentinels and `hydrateScenePreviewUrls` resolves signed URLs at
  load time so existing `<img src={scene.url}>` render sites keep working.
- **Bucket flip:** `image_library` is now PRIVATE. Storage policy
  `Owners can view own image_library` enforces owner/admin SELECT; anonymous
  GETs return HTTP 400 and signed-URL minting requires the owner JWT.

### Chat-runtime audit (verified 2026-06-14)

- Live `information_schema` check confirms **`public.messages` has no
  `image_url` column** (columns: id, conversation_id, role, content,
  created_at, day, time_of_day, generation_id). The `Message.imageUrl`
  referenced in `ChatInterfaceTab.tsx` is purely in-memory frontend state
  that is dropped on reload — `saveNewMessages` and the full conversation
  save path do not persist it. No historical message migration is needed.
- `supabase/functions/generate-scene-image/index.ts` returns the raw Grok
  image URL directly to the client; it does NOT upload to the `scenes`
  bucket, so the bucket flip does not affect that path.
- The only persisted scene references live in `public.scenes` (now
  `image_url` + `image_path`). `fetchScenarioById` and `fetchScenarioForPlay`
  both wrap results with `hydrateScenePreviewUrls`, which resolves signed
  URLs from `imagePath` at load time.

### Done in this pass (scenes bucket flip)

- Migration `20260614110126`: dropped `Anyone can view scenes` storage
  policy; added `Owners admins or published scenes can view` gated by
  `public.can_read_scene_storage_object(name)`. Re-ran the `image_path`
  backfill to cover any rows uploaded between Migration A and this pass.
- `scenes` storage bucket flipped to PRIVATE. Anonymous GET against a
  legacy public scene URL now returns **HTTP 400**.
- `handleAddScene` and `handleSceneGenerate` in
  `use-story-builder-media.ts` now resolve `scene.url` through
  `getSignedMediaUrl('scenes', imagePath)` immediately after upload, so
  freshly uploaded scenes render correctly in the builder without relying
  on a public URL.

### Final verification (2026-06-14T11:10Z)

Live access matrix run against the production project:

| # | Probe | Expected | Result |
| - | --- | --- | --- |
| 1 | Cold public URL GET, unpublished scene | 400/403 | **HTTP 400** |
| 2 | Cold public URL GET, published scene | 400/403 | **HTTP 400** |
| 3 | Anon signed-URL mint, unpublished scene | 400/403 | **HTTP 400** |
| 4 | Anon signed-URL mint, published-visible scene | 200 | **HTTP 200** (GET 200) |
| 5 | Owner signed-URL mint, own unpublished scene | 200 | **HTTP 200** (GET 200) |
| 6 | Owner signed-URL mint, own image_library | 200 | **HTTP 200** (GET 200) |
| 7 | Anon signed-URL mint, image_library | 400/403 | **HTTP 400** |
| 8 | Auth non-owner signed-URL mint, published-visible scene | 200 | **policy=true** (predicate emulated) |
| 9 | Auth non-owner signed-URL mint, unpublished scene | 400/403 | **policy=false** (predicate emulated) |
| 10 | Anon mint, publisher.hide_published_works=true | 400/403 | **predicate enforces hide=false branch** (no live row to probe) |

`Owner browser smoke (Story Builder + My Stories, owner JWT): zero requests
observed to /storage/v1/object/public/scenes/ or
/storage/v1/object/public/image_library/ during navigation. Covers and
avatars continue to load from their still-public buckets as expected per
the Stage A classification.`

`Supabase linter (post-flip): 36 findings unchanged from the prior run. The
4 "Public Bucket Allows Listing" warnings cover avatars / backgrounds /
covers / guide_images (intentionally public). The "Public Can Execute
SECURITY DEFINER Function" warnings are pre-existing across the RPC
surface. No new warnings were introduced by the Stage B migrations or the
bucket flips.`

### Still deferred

- **Story export/import/remix portability** — tracked as Quality Hub
  follow-up **`qh-port-20260614-001`**. This is now a functionality /
  portability issue, not a public-storage exposure: the storage policy is
  correctly refusing reads from non-owners. The fix is to copy bytes from
  the source scene path into the importing user's `scenes/<uid>/` folder on
  import / remix, then rewrite `scenes.image_path` so the importing user
  can mint signed URLs.

### Snapshot refresh

- `src/data/supabase-schema-map.ts` — bucket `public` flags flipped for
  `scenes` and `image_library`; legacy `Anyone can view scenes` and
  `Users can view image_library` storage policies replaced with
  `Owners admins or published scenes can view` and
  `Owners can view own image_library`; `can_read_scene_storage_object`
  added to the functions section; `image_path` column appended to `scenes`
  and `library_images`; `get_folders_with_details` returnType updated to
  include `thumbnail_path`; `save_scenario_atomic` annotated with a
  `lastUpdatedNote` describing the `image_path` upsert.
- `src/data/database-schema-inventory.ts` — `image_path` added to `scenes`
  and `library_images`; storage_buckets entries for `scenes` and
  `image_library` flipped to private with notes; new `storage_policies`
  block captures the two new SELECT policies; functions list updated for
  `get_folders_with_details`, `save_scenario_atomic`, and
  `can_read_scene_storage_object`.
- `src/integrations/supabase/types.ts` — regenerated after Migration A;
  already reflects `image_path` on `scenes` and `library_images`, the
  `thumbnail_path` column on `get_folders_with_details`, and the new
  `can_read_scene_storage_object` RPC.

Stage B closed the finding: the private buckets above are no longer publicly
readable, every persisted reference is the storage `image_path`, and every
render path resolves through `createSignedUrl` against the gated SELECT
policies above.