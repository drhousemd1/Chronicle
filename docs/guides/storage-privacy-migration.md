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

## Stage B (out of scope this pass)

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