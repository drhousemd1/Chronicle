import { supabase } from '@/integrations/supabase/client';

/**
 * Stage B signed-media helper for private storage buckets (scenes, image_library).
 *
 * Contract:
 * - Returns a short-lived signed URL for the given bucket+path. The URL must be
 *   used immediately and MUST NEVER be persisted to a database column or other
 *   long-term store (it expires). Persist `imagePath` only.
 * - Caches URLs in-memory per browser session, refreshing slightly before
 *   expiry to avoid flicker.
 */

export type PrivateBucket =
  | 'scenes'
  | 'image_library'
  | 'user_backgrounds_private'
  | 'sidebar_backgrounds_private'
  | 'story_covers_private'
  | 'character_avatars_private';

const KNOWN_PRIVATE_BUCKETS: PrivateBucket[] = [
  'scenes',
  'image_library',
  'user_backgrounds_private',
  'sidebar_backgrounds_private',
  'story_covers_private',
  'character_avatars_private',
];

const DEFAULT_TTL_SECONDS = 60 * 60; // 1 hour
const REFRESH_BEFORE_MS = 5 * 60 * 1000; // refresh 5 min before expiry

type CacheEntry = {
  url: string;
  expiresAt: number; // epoch ms
};

const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<string>>();

function cacheKey(bucket: PrivateBucket, path: string): string {
  return `${bucket}::${path}`;
}

/**
 * Resolve a signed URL for a private bucket object.
 * Returns empty string on failure (caller should fall back to a placeholder).
 * The returned URL is for DISPLAY ONLY — do not persist it.
 */
export async function getSignedMediaUrl(
  bucket: PrivateBucket,
  path: string,
  options?: { ttlSeconds?: number },
): Promise<string> {
  if (!path) return '';
  const ttl = options?.ttlSeconds ?? DEFAULT_TTL_SECONDS;
  const key = cacheKey(bucket, path);
  const now = Date.now();

  const cached = cache.get(key);
  if (cached && cached.expiresAt - REFRESH_BEFORE_MS > now) {
    return cached.url;
  }

  const existing = inflight.get(key);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, ttl);
      if (error || !data?.signedUrl) {
        console.warn('[signed-media] createSignedUrl failed', { bucket, path, error });
        return '';
      }
      cache.set(key, {
        url: data.signedUrl,
        expiresAt: now + ttl * 1000,
      });
      return data.signedUrl;
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, promise);
  return promise;
}

/**
 * Batch-resolve signed URLs. Returns a path→signedUrl map. Failed entries are
 * omitted from the map.
 */
export async function getSignedMediaUrls(
  bucket: PrivateBucket,
  paths: string[],
  options?: { ttlSeconds?: number },
): Promise<Record<string, string>> {
  const unique = Array.from(new Set(paths.filter((p): p is string => !!p)));
  const results = await Promise.all(
    unique.map(async (path) => {
      const url = await getSignedMediaUrl(bucket, path, options);
      return [path, url] as const;
    }),
  );
  const out: Record<string, string> = {};
  for (const [path, url] of results) {
    if (url) out[path] = url;
  }
  return out;
}

/**
 * Sentinel scheme used in legacy/atomic-save payloads to indicate the row's
 * canonical media reference is the path, not a public URL. Renderers MUST
 * resolve sentinels through getSignedMediaUrl before passing to <img>.
 */
export const STORAGE_SENTINEL_PREFIX = 'storage://';

export function isStorageSentinel(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.startsWith(STORAGE_SENTINEL_PREFIX);
}

/**
 * Parse a `storage://<bucket>/<path>` sentinel. Returns null when the value
 * isn't a sentinel or the bucket isn't a known private bucket.
 */
export function parseStorageSentinel(
  value: string | null | undefined,
): { bucket: PrivateBucket; path: string } | null {
  if (!isStorageSentinel(value)) return null;
  const rest = (value as string).slice(STORAGE_SENTINEL_PREFIX.length);
  const slash = rest.indexOf('/');
  if (slash <= 0) return null;
  const bucket = rest.slice(0, slash);
  const path = rest.slice(slash + 1);
  if (!path) return null;
  if (!(KNOWN_PRIVATE_BUCKETS as string[]).includes(bucket)) return null;
  return { bucket: bucket as PrivateBucket, path };
}

/**
 * If `value` is a `storage://<bucket>/<path>` sentinel, resolve a signed URL
 * and return it. Otherwise return the value unchanged (covers legacy public
 * URLs and empty strings).
 */
export async function resolveStorageMaybeSentinel(
  value: string | null | undefined,
): Promise<string> {
  if (!value) return '';
  const parsed = parseStorageSentinel(value);
  if (!parsed) return value;
  const signed = await getSignedMediaUrl(parsed.bucket, parsed.path);
  return signed || '';
}

/** Build a storage:// sentinel string. */
export function buildStorageSentinel(bucket: PrivateBucket, path: string): string {
  return `${STORAGE_SENTINEL_PREFIX}${bucket}/${path}`;
}

/** Clear the in-memory cache (test/debug only). */
export function __clearSignedMediaCache(): void {
  cache.clear();
  inflight.clear();
}