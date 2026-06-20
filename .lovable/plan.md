## Security Scan Triage — Line-by-Line Plan

Live verification already performed:
- `get_folders_with_details(uuid)` overload does **not** exist live; only the zero-arg `auth.uid()` version is present. No DROP needed.
- `public.published_scenarios` **is** in `supabase_realtime` publication, and `GalleryHub.tsx` (lines ~190–230) is the only frontend subscriber.
- All public buckets (`avatars`, `covers`, `backgrounds`, `guide_images`) already have write policies locked to admin or path-restricted owner. Profile avatar uploads enforce `^<uid>/avatar-[0-9]+\.(jpg|...)$`. Covers writes are admin-only (publish-cover edge function uses service role). Backgrounds writes are admin-only.
- All SECURITY DEFINER public functions reviewed; each is a narrow guarded wrapper.

---

### 1. Art styles inaccessible to non-admin users
- **Verdict:** Expected / suppress.
- **Why:** `art_styles` holds backend prompt columns. UI uses `get_public_art_styles()` (id, display_name, thumbnail_url, sort_order only) — verified in `ArtStylesContext.tsx`.
- **Change:** None. Update `security memory` to record this is intentional.
- **Do not:** Add `SELECT` on `art_styles` to anon/authenticated.
- **Validation:** `rg "from\\('art_styles'\\)" src` returns only admin tool. RPC still returns 4 safe columns.

### 2. Guide documents inaccessible to non-admin users
- **Verdict:** Expected / suppress.
- **Why:** `guide_documents` is admin authoring data. `guide_images` bucket remains publicly readable for rendered assets (admin-only writes).
- **Change:** None. Note in security memory.
- **Do not:** Grant SELECT on `guide_documents` to non-admins.
- **Validation:** Confirm only `AppGuideTool.tsx` (admin) reads the table.

### 3. Creator profiles not readable by other authenticated users
- **Verdict:** Expected / suppress.
- **Why:** Privacy boundary. UI uses `get_public_profiles(uuid[])` and `get_public_creator_profile(uuid)` which redact when `hide_profile_details` / `hide_published_works` is set. Both verified live.
- **Change:** None. Note in security memory with the two RPC names as evidence.
- **Do not:** Add broad SELECT on `profiles`.

### 4. Published scenarios browsing requires explicit public read path
- **Verdict:** Expected / suppress (post-verification).
- **Why:** Public browsing goes through `fetch_gallery_scenarios` (verified live, SECURITY DEFINER, sanitized columns, enforces `is_published`/`is_hidden`/`hide_published_works`). Raw `published_scenarios` SELECT remains owner/admin scoped.
- **Change:** None to RLS. Note in security memory.
- **Validation:** `rg "from\\('published_scenarios'\\)" src` to confirm direct reads are only owner-scoped (gallery hub uses the RPC).

### 5. Realtime subscription on `published_scenarios`
- **Verdict:** Actual issue — targeted fix.
- **Why:** `GalleryHub.tsx` opens `supabase.channel('gallery-realtime')` with three `postgres_changes` listeners on `public.published_scenarios`. Any authenticated user can subscribe and receive raw row payloads, bypassing the redacted gallery RPC.
- **Changes:**
  1. **Frontend:** Remove the entire realtime block (`channel('gallery-realtime')`, three `on('postgres_changes', ...)` listeners, `subscribe()`, and cleanup `removeChannel`) in `src/components/chronicle/GalleryHub.tsx`. Replace cache freshness with:
     - React Query `invalidateQueries(['gallery'])` already called after local publish/unpublish in `gallery-data.ts` — keep.
     - Add `refetchOnWindowFocus: true` (or a 60s `staleTime`) to the gallery query if not already set.
  2. **Migration:** `ALTER PUBLICATION supabase_realtime DROP TABLE public.published_scenarios;`
  3. Search confirms no other consumer of this table on realtime.
- **Do not:** Add any new table-level realtime subscription. Do not touch `app_settings` (out of scope; subscription tiers UI behavior preserved — separate inspection later if asked).
- **Validation:** `rg "gallery-realtime|published_scenarios" src` returns no realtime subscriber. `SELECT * FROM pg_publication_tables WHERE pubname='supabase_realtime'` no longer lists `published_scenarios`. Gallery still refreshes after publish/unpublish via query invalidation.
- **Snapshot refresh:** `src/data/supabase-schema-map.ts` realtime publication list.

### 6 + 8. SECURITY DEFINER functions executable by anon/authenticated
- **Verdict:** Mostly expected / suppress; one cleanup.
- **Live audit summary** (all SECURITY DEFINER, executable by anon+authenticated unless noted):

  | Function | Class | Action |
  |---|---|---|
  | `get_public_art_styles()` | a — safe public wrapper | keep |
  | `get_public_profiles(uuid[])` | a | keep |
  | `get_public_creator_profile(uuid)` | a | keep |
  | `get_public_scenario_reviews(uuid,int,int)` | a | keep |
  | `get_public_app_flags()` | a | keep |
  | `fetch_gallery_scenarios(...)` | a | keep |
  | `get_creator_overall_rating(uuid)` | a | keep |
  | `get_creator_stats(uuid)` | a | keep |
  | `record_scenario_view(uuid)` / `record_scenario_play(uuid)` | b — auth own-user | keep |
  | `get_my_liked_scenarios(uuid[])` / `get_my_submitted_reports()` / `get_my_account_status()` / `get_saved_scenarios_for_user()` | b | keep |
  | `get_folders_with_details()` (zero-arg) | b | keep |
  | `promote_story_cover_to_public(uuid)` | b (owner/admin guarded) | keep |
  | `scan_legacy_avatar_refs(text[])` | b (admin-gated inside) | keep |
  | `get_scenario_moderation_counters(uuid)` | b (publisher/admin) | keep |
  | `set_admin_access(uuid,bool)` | b (admin-gated) | keep |
  | `has_role(uuid, app_role)` | a (read-only helper) | keep |
  | `can_read_scene_storage_object(text)`, `can_read_private_story_media(text,text)` | c — storage RLS helpers | keep (called from policies) |
  | `save_scenario_atomic(...)` | b (auth.uid() guard) | keep |
  | `handle_new_user()`, `update_updated_at_column()`, `set_updated_at_finance_live_tables()`, `update_review_aggregates()`, `sync_published_scenario_*_count()`, `validate_review_ratings()`, `enforce_private_media_url_null()` | c — trigger/internal | **REVOKE EXECUTE FROM PUBLIC, anon, authenticated** (keep service_role + postgres). |

- **Migration steps:**
  ```sql
  REVOKE EXECUTE ON FUNCTION
    public.handle_new_user(),
    public.update_updated_at_column(),
    public.set_updated_at_finance_live_tables(),
    public.update_review_aggregates(),
    public.sync_published_scenario_like_count(),
    public.sync_published_scenario_save_count(),
    public.sync_published_scenario_play_count(),
    public.validate_review_ratings(),
    public.enforce_private_media_url_null()
  FROM PUBLIC, anon, authenticated;
  ```
- **Do not:** Touch the public/auth-wrapper RPCs above. Do not drop `get_folders_with_details(uuid)` — that overload does not exist live (already verified).
- **Validation:** Re-run pg_proc ACL query; trigger functions show only `postgres`/`service_role` execute. UI smoke: gallery, profile, creator page, story save, publish, review, signup.
- **Snapshot refresh:** `supabase-schema-map.ts` function ACLs; no `types.ts` change needed.

### 7. Leaked Password Protection Disabled
- **Verdict:** Actual hardening — fix via Auth config.
- **Change:** Call `supabase--configure_auth` with `password_hibp_enabled: true`. No code change.
- **Validation:** Re-scan; warning clears.
- **Note in security memory:** HIBP enabled date.

### 9. Public Bucket Allows Listing
- **Verdict:** Expected / suppress, after live-policy verification (done above).
- **Per-bucket findings:**
  - `covers`: public read only; writes admin-only. Publish flow mirrors private → public via `publish-cover` edge fn. ✅
  - `avatars`: public read; user write path-restricted to `^<uid>/avatar-[0-9]+\.(jpg|jpeg|png|webp|gif)$`. Character avatars use `character_avatars_private`. ✅
  - `guide_images`: public read; admin-only writes. ✅
  - `backgrounds`: public read; admin-only writes. User page bgs use `user_backgrounds_private`; user sidebar themes use `sidebar_backgrounds_private`. ✅
- **Change:** None. Update security memory listing each bucket and why public listing is intentional (or low-sensitivity).
- **Do not:** Flip these to private; published covers, profile avatars, guide images, and default/shared sidebar themes need anonymous render.

---

### Execution order (after approval)
1. Migration: `ALTER PUBLICATION supabase_realtime DROP TABLE public.published_scenarios;` + `REVOKE EXECUTE` on the nine trigger/internal functions.
2. Edit `src/components/chronicle/GalleryHub.tsx` to remove realtime block; add `refetchOnWindowFocus` if missing.
3. Call `configure_auth` → `password_hibp_enabled: true`.
4. Refresh `src/data/supabase-schema-map.ts` (realtime list, function ACLs). `database-schema-inventory.ts` and `types.ts` unchanged.
5. Mark scanner rows 1, 2, 3, 4, 9 as accepted in security memory with evidence above; mark 5, 6/8, 7 as fixed with the change refs.
6. Re-run security scan; confirm only intentionally accepted rows remain.
