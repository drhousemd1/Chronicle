import { supabase } from '@/integrations/supabase/client';
import { uuid } from '@/utils';
import { getSignedMediaUrl } from './signed-media';

/**
 * Stage B: image-library → destination-bucket copy contract.
 *
 * When a user picks an image from their (private) image_library via
 * ImageLibraryPickerModal, the bytes MUST be copied into the consumer's
 * destination bucket (covers / avatars / backgrounds / scenes) before being
 * persisted on a parent row. Never persist a signed image_library URL — it
 * expires.
 *
 * For public destination buckets (covers, avatars, backgrounds) the returned
 * `publicOrSentinelUrl` is a long-lived public URL. For the private `scenes`
 * bucket it is a `storage://scenes/<path>` sentinel; callers MUST resolve a
 * signed URL at render time via getSignedMediaUrl.
 */

export type LibraryPickerSelection = {
  imageId: string;
  imagePath: string;       // bucket-relative path in `image_library`
  previewUrl: string;       // signed URL — DISPLAY ONLY, never persist
  filename: string;
  contentType: string;
};

export type DestinationBucket = 'covers' | 'avatars' | 'backgrounds' | 'scenes';

export type CopiedLibraryImage = {
  destBucket: DestinationBucket;
  destPath: string;                 // bucket-relative path in destination
  publicOrSentinelUrl: string;       // public URL (public buckets) or storage:// sentinel (private)
  previewUrl: string;                // immediately usable display URL
  contentType: string;
};

const PRIVATE_DEST_BUCKETS: DestinationBucket[] = ['scenes'];

function isPrivateDest(bucket: DestinationBucket): boolean {
  return PRIVATE_DEST_BUCKETS.includes(bucket);
}

function inferExtension(filename: string, contentType: string): string {
  const m = /\.([a-zA-Z0-9]+)$/.exec(filename || '');
  if (m) return m[1].toLowerCase();
  if (contentType?.startsWith('image/')) return contentType.split('/')[1] || 'jpg';
  return 'jpg';
}

/**
 * Copy an image_library selection into a destination bucket owned by the user.
 *
 * @throws on auth, fetch, or upload failure. Callers should surface a user
 *   visible error and abort the parent save.
 */
export async function copyLibraryImageTo(
  selection: LibraryPickerSelection,
  destBucket: DestinationBucket,
  userId: string,
): Promise<CopiedLibraryImage> {
  if (!userId) throw new Error('copyLibraryImageTo: userId required');
  if (!selection?.imagePath) throw new Error('copyLibraryImageTo: selection.imagePath required');

  // Always fetch a fresh signed URL so we don't rely on a possibly-stale
  // previewUrl baked into the selection earlier in the user's session.
  const fetchUrl = (await getSignedMediaUrl('image_library', selection.imagePath))
    || selection.previewUrl;
  if (!fetchUrl) throw new Error('copyLibraryImageTo: could not resolve source signed URL');

  const response = await fetch(fetchUrl);
  if (!response.ok) {
    throw new Error(`copyLibraryImageTo: source fetch failed (${response.status})`);
  }
  const blob = await response.blob();
  const contentType = blob.type || selection.contentType || 'image/jpeg';

  const ext = inferExtension(selection.filename, contentType);
  const destPath = `${userId}/lib-${uuid()}-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(destBucket)
    .upload(destPath, blob, { contentType, upsert: false });
  if (uploadError) {
    throw new Error(`copyLibraryImageTo: upload failed: ${uploadError.message}`);
  }

  if (isPrivateDest(destBucket)) {
    const signed = await getSignedMediaUrl(destBucket as 'scenes', destPath);
    return {
      destBucket,
      destPath,
      publicOrSentinelUrl: `storage://${destBucket}/${destPath}`,
      previewUrl: signed,
      contentType,
    };
  }

  const { data } = supabase.storage.from(destBucket).getPublicUrl(destPath);
  return {
    destBucket,
    destPath,
    publicOrSentinelUrl: data.publicUrl,
    previewUrl: data.publicUrl,
    contentType,
  };
}