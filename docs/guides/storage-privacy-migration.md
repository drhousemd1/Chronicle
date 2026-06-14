# Storage Privacy Migration — Stage A Inventory

Tracking finding **qh-sec-20260607-003** (Quality Hub). Stage A is documentation
only: catalog every code path that reads or writes a Supabase Storage bucket
and classify each bucket so Stage B can plan the public→private flips and the
signed-URL helper.

No bucket settings, RLS, or code paths are changed in Stage A. The buckets
listed below remain public-read until Stage B lands.

## Bucket classification

| Bucket | Today | Target | Notes |
| --- | --- | --- | --- |
| `avatars` | public | **publisher-owned public** (gallery + character chips) | Surfaces in the gallery and on every profile/character tile, so public URLs are acceptable. Path convention is `<user_id>/...`. |
| `covers` | public | **publisher-owned public** (gallery covers) | Cover art ships with every published scenario; gallery consumers expect a long-lived URL. |
| `backgrounds` | public | **publisher-owned public** (UI backgrounds) | Sidebar/scene backdrops; shared across the user's own sessions and not user-private content. |
| `guide_images` | public | **app-static public** (admin guide assets) | Edited only by admins; consumed by the in-app guide for every signed-in user. |
| `scenes` | public | **private + signed URLs** | Generated scene art is the most sensitive user media; today the URL is public even for unpublished/draft stories. Stage B must move to private + per-request signed URLs gated by owner / publication state. |
| `image_library` | public | **private + signed URLs** | User-managed personal image library. Should be owner-only. Stage B must flip the bucket private and route reads through a signed-URL helper that checks `library_images.user_id = auth.uid()`. |
| `finance_documents` | **private** | already private (admin-only) | No change. Listed for completeness. |

## Code paths (Stage A inventory)

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

### `scenes` (Stage B: private + signed URLs)

- `src/utils.ts`, `src/services/persistence/shared.ts` — generic
  `getPublicUrl(bucket, path)` helper used by the scene persistence layer.
  Stage B will replace the `scenes` and `image_library` callers with a
  signed-URL helper.
- `src/services/persistence/scenarios.ts` — selects/deletes from the
  `public.scenes` **table** (not the bucket) for the owner; included here so the
  Stage B helper change does not get conflated with table reads.

### `image_library` (Stage B: private + signed URLs)

- `src/components/chronicle/ImageLibraryTab.tsx` — uploads, lists, and removes
  the signed-in user's library images; today calls `getPublicUrl` to render
  every tile.

### `finance_documents` (already private, admin-only)

- `src/components/admin/finance/documents/DocumentsPage.tsx` and related admin
  components — restricted to admins by RLS + UI gating. No Stage B action.

## Stage B status (2026-06-14)

Stage B is **partially landed**. The finding `qh-sec-20260607-003` remains
`in-progress` until the `scenes` bucket also flips and the runtime chat
rendering audit completes.

### Done in this pass

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

### Still deferred

- **Story export/import portability.** Story Transfer (`src/lib/story-transfer.ts`)
  embeds the raw `scene.url` string in exported Markdown / JSON / RTF
  payloads. For cross-user imports, the embedded URL points at the original
  owner's private scene path; the importing user will not be able to mint a
  signed URL (non-owner, scenario not published), and `hydrateScenePreviewUrls`
  will surface as an empty `<img src>`. **Private scene images are not
  portable across users in this Stage B pass** — same applies to remix
  cloning. Follow-up: copy bytes into the importing user's `scenes` folder
  on import / remix, or drop `imagePath` when owner mismatch is detected.
- **`src/data/supabase-schema-map.ts` snapshot refresh** to reflect the new
  `image_library` + `scenes` storage policy names and `image_path` columns.

Stage B will:

1. Add a `getPrivateMediaUrl(bucket, path)` helper that calls
   `supabase.storage.from(bucket).createSignedUrl(path, ttl)` after the caller
   has confirmed owner / publication eligibility.
2. Flip `scenes` and `image_library` to private buckets, write owner-only
   `storage.objects` policies, and migrate the call sites above to the new
   helper.
3. Re-run the Quality Hub `qh-sec-20260607-003` check and only then mark the
   finding `fixed` + `verified`.

Stage A leaves the finding in `in-progress` because the buckets above remain
publicly readable.