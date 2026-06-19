import type { UserBackground } from '@/types';
import { sanitizeUiSettings } from '@/utils';
import { supabase, toTimestamp } from './shared';
import {
  buildStorageSentinel,
  getSignedMediaUrl,
  getSignedMediaUrls,
  parseStorageSentinel,
  resolveStorageMaybeSentinel,
  type PrivateBucket,
} from './signed-media';

function dbToUserBackground(row: any): UserBackground {
  return {
    id: row.id,
    userId: row.user_id,
    imageUrl: row.image_url,
    imagePath: row.image_path || null,
    isSelected: row.is_selected || false,
    overlayColor: row.overlay_color || 'black',
    overlayOpacity: row.overlay_opacity ?? 10,
    category: row.category || 'Uncategorized',
    sortOrder: row.sort_order ?? 0,
    createdAt: toTimestamp(row.created_at),
  };
}

/**
 * Upload a blob to a public bucket and return the public URL. Used only for
 * intentionally public surfaces (profile avatars via PublicProfileTab; legacy
 * public uploads that haven't been migrated yet).
 */
async function uploadToPublicBucket(bucket: string, path: string, file: Blob): Promise<string> {
  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
  if (uploadError) throw uploadError;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Upload a blob to a private bucket and return a `storage://<bucket>/<path>`
 * sentinel. Callers must persist the sentinel into their `*_url` column and
 * the raw `<path>` into the matching `*_path` column, then resolve a signed
 * URL via getSignedMediaUrl for display.
 */
async function uploadToPrivateBucket(
  bucket: PrivateBucket,
  path: string,
  file: Blob,
  contentType?: string,
): Promise<{ path: string; sentinel: string; signedUrl: string }> {
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true, contentType });
  if (uploadError) throw uploadError;
  const signed = await getSignedMediaUrl(bucket, path);
  return { path, sentinel: buildStorageSentinel(bucket, path), signedUrl: signed };
}

function extractBackgroundStoragePath(imageUrl: string): string | null {
  const urlParts = imageUrl.split('/backgrounds/');
  return urlParts.length > 1 ? urlParts[1] : null;
}

/**
 * Upload a character avatar to the private `character_avatars_private` bucket.
 * Callers persist `path` into `characters.avatar_path` and `sentinel` into
 * `characters.avatar_url`; `signedUrl` is for immediate render only.
 *
 * NOTE: This is for character/side-character avatars only. Profile avatars
 * remain intentionally public and continue to upload directly to the `avatars`
 * bucket from PublicProfileTab.
 */
export async function uploadAvatar(
  userId: string,
  file: Blob,
  filename: string,
): Promise<{ path: string; sentinel: string; signedUrl: string }> {
  return uploadToPrivateBucket('character_avatars_private', `${userId}/${filename}`, file);
}

export async function uploadSceneImage(userId: string, file: Blob, filename: string): Promise<string> {
  // Kept as legacy string-returning helper; `scenes` bucket was migrated to
  // private in a previous Stage B. Callers already resolve a signed URL for
  // preview; the returned publicUrl will 404 anonymously but is preserved for
  // back-compat with library-copy and other consumers.
  const { error: uploadError } = await supabase.storage
    .from('scenes')
    .upload(`${userId}/${filename}`, file, { upsert: true });
  if (uploadError) throw uploadError;
  const { data } = supabase.storage.from('scenes').getPublicUrl(`${userId}/${filename}`);
  return data.publicUrl;
}

/**
 * Upload a story cover to the private `story_covers_private` bucket. Callers
 * persist `path` into `stories.cover_image_path` and `sentinel` into
 * `stories.cover_image_url`; `signedUrl` is for immediate render only.
 * The publish flow will mirror the file into the public `covers` bucket via
 * promote_story_cover_to_public.
 */
export async function uploadCoverImage(
  userId: string,
  file: Blob,
  filename: string,
): Promise<{ path: string; sentinel: string; signedUrl: string }> {
  return uploadToPrivateBucket('story_covers_private', `${userId}/${filename}`, file);
}

export async function fetchUserBackgrounds(userId: string): Promise<UserBackground[]> {
  const { data, error } = await supabase
    .from('user_backgrounds')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return hydrateUserBackgroundImageUrls(
    (data || []).map(dbToUserBackground),
    'user_backgrounds_private',
  );
}

/**
 * Upload a user page-background image to the private `user_backgrounds_private`
 * bucket. Returns a `storage://user_backgrounds_private/<path>` sentinel that
 * `createUserBackground` will detect and split into image_url + image_path.
 */
export async function uploadBackgroundImage(userId: string, file: Blob, filename: string): Promise<string> {
  const { sentinel } = await uploadToPrivateBucket(
    'user_backgrounds_private',
    `${userId}/${filename}`,
    file,
  );
  return sentinel;
}

export async function createUserBackground(userId: string, imageUrlOrSentinel: string): Promise<UserBackground> {
  const parsed = parseStorageSentinel(imageUrlOrSentinel);
  const row = {
    user_id: userId,
    image_url: imageUrlOrSentinel,
    image_path: parsed?.path ?? null,
    is_selected: false,
  };

  const { data, error } = await supabase
    .from('user_backgrounds')
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  const hydrated = dbToUserBackground(data);
  if (parsed) {
    hydrated.imageUrl = (await getSignedMediaUrl(parsed.bucket, parsed.path)) || '';
  }
  return hydrated;
}

export async function setSelectedBackground(userId: string, backgroundId: string | null): Promise<void> {
  const { error: unselectError } = await supabase
    .from('user_backgrounds')
    .update({ is_selected: false })
    .eq('user_id', userId);

  if (unselectError) throw unselectError;

  if (!backgroundId) return;

  const { error: selectError } = await supabase
    .from('user_backgrounds')
    .update({ is_selected: true })
    .eq('id', backgroundId)
    .eq('user_id', userId);

  if (selectError) throw selectError;
}

export async function setImageLibraryBackground(userId: string, backgroundId: string | null): Promise<void> {
  const { error: unselectError } = await supabase
    .from('user_backgrounds')
    .update({ image_library_selected: false })
    .eq('user_id', userId);

  if (unselectError) throw unselectError;

  if (!backgroundId) return;

  const { error: selectError } = await supabase
    .from('user_backgrounds')
    .update({ image_library_selected: true })
    .eq('id', backgroundId)
    .eq('user_id', userId);

  if (selectError) throw selectError;
}

export async function getImageLibraryBackground(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('user_backgrounds')
    .select('id')
    .eq('user_id', userId)
    .eq('image_library_selected', true)
    .maybeSingle();

  if (error) throw error;
  return data?.id || null;
}

export async function deleteUserBackground(userId: string, backgroundId: string, imageUrl: string): Promise<void> {
  // Look up the row first to find image_path (preferred) before falling back
  // to the legacy backgrounds-bucket URL parser.
  const { data: row } = await supabase
    .from('user_backgrounds')
    .select('image_path, image_url')
    .eq('id', backgroundId)
    .eq('user_id', userId)
    .maybeSingle();

  const dbRow = (row || {}) as { image_path?: string | null; image_url?: string | null };
  const fromPath = dbRow.image_path || null;
  const fromSentinel = parseStorageSentinel(dbRow.image_url ?? imageUrl);

  if (fromPath) {
    await supabase.storage.from('user_backgrounds_private').remove([fromPath]);
  } else if (fromSentinel) {
    await supabase.storage.from(fromSentinel.bucket).remove([fromSentinel.path]);
  } else {
    const storagePath = extractBackgroundStoragePath(imageUrl);
    if (storagePath) {
      await supabase.storage.from('backgrounds').remove([storagePath]);
    }
  }

  const { error } = await supabase
    .from('user_backgrounds')
    .delete()
    .eq('id', backgroundId)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function updateBackgroundOverlay(
  userId: string,
  backgroundId: string,
  overlayColor: string,
  overlayOpacity: number,
): Promise<void> {
  const { error } = await (supabase as any)
    .from('user_backgrounds')
    .update({ overlay_color: overlayColor, overlay_opacity: overlayOpacity })
    .eq('id', backgroundId)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function fetchSidebarBackgrounds(userId: string): Promise<UserBackground[]> {
  const { data, error } = await supabase
    .from('sidebar_backgrounds')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return hydrateUserBackgroundImageUrls(
    (data || []).map(dbToUserBackground),
    'sidebar_backgrounds_private',
  );
}

export async function uploadSidebarBackgroundImage(userId: string, file: Blob, filename: string): Promise<string> {
  const { sentinel } = await uploadToPrivateBucket(
    'sidebar_backgrounds_private',
    `${userId}/${filename}`,
    file,
  );
  return sentinel;
}

export async function createSidebarBackground(userId: string, imageUrlOrSentinel: string): Promise<UserBackground> {
  const parsed = parseStorageSentinel(imageUrlOrSentinel);
  const row = {
    user_id: userId,
    image_url: imageUrlOrSentinel,
    image_path: parsed?.path ?? null,
    is_selected: false,
  };

  const { data, error } = await supabase
    .from('sidebar_backgrounds')
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  const hydrated = dbToUserBackground(data);
  if (parsed) {
    hydrated.imageUrl = (await getSignedMediaUrl(parsed.bucket, parsed.path)) || '';
  }
  return hydrated;
}

export async function setSelectedSidebarBackground(userId: string, backgroundId: string | null): Promise<void> {
  const { error: unselectError } = await supabase
    .from('sidebar_backgrounds')
    .update({ is_selected: false })
    .eq('user_id', userId);

  if (unselectError) throw unselectError;

  if (!backgroundId) return;

  const { error: selectError } = await supabase
    .from('sidebar_backgrounds')
    .update({ is_selected: true })
    .eq('id', backgroundId)
    .eq('user_id', userId);

  if (selectError) throw selectError;
}

export async function deleteSidebarBackground(userId: string, backgroundId: string, imageUrl: string): Promise<void> {
  const { data: row } = await supabase
    .from('sidebar_backgrounds')
    .select('image_path, image_url, category')
    .eq('id', backgroundId)
    .eq('user_id', userId)
    .maybeSingle();

  const dbRow = (row || {}) as {
    image_path?: string | null;
    image_url?: string | null;
    category?: string | null;
  };
  const fromPath = dbRow.image_path || null;
  const fromSentinel = parseStorageSentinel(dbRow.image_url ?? imageUrl);

  if (fromPath) {
    await supabase.storage.from('sidebar_backgrounds_private').remove([fromPath]);
  } else if (fromSentinel) {
    await supabase.storage.from(fromSentinel.bucket).remove([fromSentinel.path]);
  } else {
    const storagePath = extractBackgroundStoragePath(imageUrl);
    if (storagePath) {
      await supabase.storage.from('backgrounds').remove([storagePath]);
    }
  }

  const { error } = await supabase
    .from('sidebar_backgrounds')
    .delete()
    .eq('id', backgroundId)
    .eq('user_id', userId);

  if (error) throw error;
}

/**
 * Stage B hydration: for rows that have `imagePath` (or a storage:// sentinel
 * in `imageUrl`), resolve a short-lived signed URL into `imageUrl` so the
 * existing render contract (<img src={bg.imageUrl} />) keeps working.
 * Legacy rows (no imagePath, no sentinel) are left untouched.
 */
async function hydrateUserBackgroundImageUrls(
  rows: UserBackground[],
  defaultBucket: PrivateBucket,
): Promise<UserBackground[]> {
  const tasks: Array<{ row: UserBackground; bucket: PrivateBucket; path: string }> = [];
  for (const row of rows) {
    const sentinel = parseStorageSentinel(row.imageUrl);
    if (row.imagePath) {
      tasks.push({ row, bucket: defaultBucket, path: row.imagePath });
    } else if (sentinel) {
      tasks.push({ row, bucket: sentinel.bucket, path: sentinel.path });
    }
  }
  if (tasks.length === 0) return rows;

  // Group by bucket for batch signing
  const byBucket = new Map<PrivateBucket, string[]>();
  for (const t of tasks) {
    const arr = byBucket.get(t.bucket) || [];
    arr.push(t.path);
    byBucket.set(t.bucket, arr);
  }
  const mapByBucket = new Map<PrivateBucket, Record<string, string>>();
  for (const [bucket, paths] of byBucket) {
    mapByBucket.set(bucket, await getSignedMediaUrls(bucket, paths));
  }
  for (const t of tasks) {
    const signed = mapByBucket.get(t.bucket)?.[t.path];
    if (signed) t.row.imageUrl = signed;
  }
  return rows;
}

export async function updateSidebarBackgroundCategories(
  updates: Array<{ id: string; category: string; sort_order: number }>,
): Promise<void> {
  const results = await Promise.all(
    updates.map((update) =>
      supabase
        .from('sidebar_backgrounds')
        .update({ category: update.category, sort_order: update.sort_order })
        .eq('id', update.id),
    ),
  );

  const firstError = results.find((result) => result.error);
  if (firstError?.error) throw firstError.error;
}

export async function fetchUserProfile(
  userId: string,
): Promise<{ username: string | null; display_name: string | null; avatar_url: string | null } | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('username, display_name, avatar_url')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch user profile:', error);
    return null;
  }

  return data;
}

export async function updateStoryUiSettings(
  scenarioId: string,
  uiSettings: Record<string, any>,
): Promise<void> {
  const { error } = await supabase
    .from('stories')
    .update({ ui_settings: sanitizeUiSettings(uiSettings) })
    .eq('id', scenarioId);
  if (error) throw error;
}

export async function updateNavButtonImages(navButtonImages: Record<string, any>): Promise<void> {
  const { data, error: updateError } = await (supabase as any)
    .from('app_settings')
    .update({ setting_value: navButtonImages, updated_at: new Date().toISOString() })
    .eq('setting_key', 'nav_button_images')
    .select('id');

  if (updateError) throw updateError;

  if (!data || data.length === 0) {
    const { error: insertError } = await (supabase as any)
      .from('app_settings')
      .insert({ setting_key: 'nav_button_images', setting_value: navButtonImages });

    if (insertError) throw insertError;
  }
}

export async function loadNavButtonImages(): Promise<Record<string, any>> {
  const { data } = await supabase
    .from('app_settings')
    .select('setting_value')
    .eq('setting_key', 'nav_button_images')
    .maybeSingle();

  return (data?.setting_value as Record<string, any>) || {};
}
