import { supabase } from '@/integrations/supabase/client';
import { uuid } from '@/utils';
import { getSignedMediaUrl, type PrivateBucket } from './signed-media';

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

export type SourcePrivateBucket = 'scenes' | 'image_library';

export type DestinationBucket =
  | 'covers'
  | 'avatars'
  | 'backgrounds'
  | 'scenes'
  | 'user_backgrounds_private'
  | 'sidebar_backgrounds_private'
  | 'story_covers_private'
  | 'character_avatars_private';

export type CopiedLibraryImage = {
  destBucket: DestinationBucket;
  destPath: string;                 // bucket-relative path in destination
  publicOrSentinelUrl: string;       // public URL (public buckets) or storage:// sentinel (private)
  previewUrl: string;                // immediately usable display URL
  contentType: string;
};

const PRIVATE_DEST_BUCKETS: DestinationBucket[] = [
  'scenes',
  'user_backgrounds_private',
  'sidebar_backgrounds_private',
  'story_covers_private',
  'character_avatars_private',
];

function isPrivateDest(bucket: DestinationBucket): boolean {
  return PRIVATE_DEST_BUCKETS.includes(bucket);
}

function inferExtension(filename: string, contentType: string): string {
  const m = /\.([a-zA-Z0-9]+)$/.exec(filename || '');
  if (m) return m[1].toLowerCase();
  if (contentType?.startsWith('image/')) return contentType.split('/')[1] || 'jpg';
  return 'jpg';
}

export async function copyPrivateStorageImageTo(
  source: {
    bucket: SourcePrivateBucket;
    path: string;
    filename?: string;
    contentType?: string;
    fallbackUrl?: string;
  },
  destination: {
    bucket: DestinationBucket;
    userId: string;
    filenamePrefix?: string;
  },
): Promise<CopiedLibraryImage> {
  if (!destination.userId) throw new Error('copyPrivateStorageImageTo: userId required');
  if (!source?.path) throw new Error('copyPrivateStorageImageTo: source.path required');

  const fetchUrl = (await getSignedMediaUrl(source.bucket, source.path)) || source.fallbackUrl;
  if (!fetchUrl) throw new Error('copyPrivateStorageImageTo: could not resolve source signed URL');

  const response = await fetch(fetchUrl);
  if (!response.ok) {
    throw new Error(`copyPrivateStorageImageTo: source fetch failed (${response.status})`);
  }

  const blob = await response.blob();
  const contentType = blob.type || source.contentType || 'image/jpeg';
  const sourceFilename = source.filename || source.path.split('/').pop() || 'image.jpg';
  const ext = inferExtension(sourceFilename, contentType);
  const prefix = destination.filenamePrefix || 'copy';
  const destPath = `${destination.userId}/${prefix}-${uuid()}-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(destination.bucket)
    .upload(destPath, blob, { contentType, upsert: false });
  if (uploadError) {
    throw new Error(`copyPrivateStorageImageTo: upload failed: ${uploadError.message}`);
  }

  if (isPrivateDest(destination.bucket)) {
    const signed = await getSignedMediaUrl(destination.bucket as PrivateBucket, destPath);
    return {
      destBucket: destination.bucket,
      destPath,
      publicOrSentinelUrl: `storage://${destination.bucket}/${destPath}`,
      previewUrl: signed,
      contentType,
    };
  }

  const { data } = supabase.storage.from(destination.bucket).getPublicUrl(destPath);
  return {
    destBucket: destination.bucket,
    destPath,
    publicOrSentinelUrl: data.publicUrl,
    previewUrl: data.publicUrl,
    contentType,
  };
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
  return copyPrivateStorageImageTo(
    {
      bucket: 'image_library',
      path: selection.imagePath,
      filename: selection.filename,
      contentType: selection.contentType,
      fallbackUrl: selection.previewUrl,
    },
    {
      bucket: destBucket,
      userId,
      filenamePrefix: 'lib',
    },
  );
}
