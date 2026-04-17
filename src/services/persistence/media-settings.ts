import type { UserBackground } from '@/types';
import { supabase, toTimestamp } from './shared';

function dbToUserBackground(row: any): UserBackground {
  return {
    id: row.id,
    userId: row.user_id,
    imageUrl: row.image_url,
    isSelected: row.is_selected || false,
    overlayColor: row.overlay_color || 'black',
    overlayOpacity: row.overlay_opacity ?? 10,
    category: row.category || 'Uncategorized',
    sortOrder: row.sort_order ?? 0,
    createdAt: toTimestamp(row.created_at),
  };
}

async function uploadToBucket(bucket: string, path: string, file: Blob): Promise<string> {
  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

function extractBackgroundStoragePath(imageUrl: string): string | null {
  const urlParts = imageUrl.split('/backgrounds/');
  return urlParts.length > 1 ? urlParts[1] : null;
}

export async function uploadAvatar(userId: string, file: Blob, filename: string): Promise<string> {
  return uploadToBucket('avatars', `${userId}/${filename}`, file);
}

export async function uploadSceneImage(userId: string, file: Blob, filename: string): Promise<string> {
  return uploadToBucket('scenes', `${userId}/${filename}`, file);
}

export async function uploadCoverImage(userId: string, file: Blob, filename: string): Promise<string> {
  return uploadToBucket('covers', `${userId}/${filename}`, file);
}

export async function fetchUserBackgrounds(userId: string): Promise<UserBackground[]> {
  const { data, error } = await supabase
    .from('user_backgrounds')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(dbToUserBackground);
}

export async function uploadBackgroundImage(userId: string, file: Blob, filename: string): Promise<string> {
  return uploadToBucket('backgrounds', `${userId}/${filename}`, file);
}

export async function createUserBackground(userId: string, imageUrl: string): Promise<UserBackground> {
  const { data, error } = await supabase
    .from('user_backgrounds')
    .insert({
      user_id: userId,
      image_url: imageUrl,
      is_selected: false,
    })
    .select()
    .single();

  if (error) throw error;
  return dbToUserBackground(data);
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
  const storagePath = extractBackgroundStoragePath(imageUrl);
  if (storagePath) {
    await supabase.storage.from('backgrounds').remove([storagePath]);
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
  return (data || []).map(dbToUserBackground);
}

export async function uploadSidebarBackgroundImage(userId: string, file: Blob, filename: string): Promise<string> {
  return uploadToBucket('backgrounds', `${userId}/sidebar/${filename}`, file);
}

export async function createSidebarBackground(userId: string, imageUrl: string): Promise<UserBackground> {
  const { data, error } = await supabase
    .from('sidebar_backgrounds')
    .insert({
      user_id: userId,
      image_url: imageUrl,
      is_selected: false,
    })
    .select()
    .single();

  if (error) throw error;
  return dbToUserBackground(data);
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
  const storagePath = extractBackgroundStoragePath(imageUrl);
  if (storagePath) {
    await supabase.storage.from('backgrounds').remove([storagePath]);
  }

  const { error } = await supabase
    .from('sidebar_backgrounds')
    .delete()
    .eq('id', backgroundId)
    .eq('user_id', userId);

  if (error) throw error;
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
  await supabase.from('stories').update({ ui_settings: uiSettings }).eq('id', scenarioId);
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
