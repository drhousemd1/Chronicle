// ============================================================================
// Batch D Stage C — backfill legacy public media into private buckets.
// Admin-only. Idempotent: only processes rows whose *_path column is NULL and
// whose legacy *_url looks like a Supabase public-bucket URL.
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

type Job = {
  table: string;
  url_col: string;
  path_col: string;
  src_bucket: string;
  dst_bucket: string;
  // Optional row-level filter to skip rows that should remain in the legacy bucket
  filter?: (row: Record<string, unknown>) => boolean;
  extraSelect?: string;
};

const JOBS: Job[] = [
  { table: 'user_backgrounds',         url_col: 'image_url',       path_col: 'image_path',       src_bucket: 'backgrounds', dst_bucket: 'user_backgrounds_private' },
  // sidebar_backgrounds: only migrate user-uploaded rows; leave default/shared in public bucket
  { table: 'sidebar_backgrounds',      url_col: 'image_url',       path_col: 'image_path',       src_bucket: 'backgrounds', dst_bucket: 'sidebar_backgrounds_private',
    extraSelect: ', category',
    filter: (r) => {
      const c = String((r as { category?: unknown }).category ?? '').toLowerCase();
      return c !== 'default' && c !== 'shared';
    },
  },
  { table: 'stories',                  url_col: 'cover_image_url', path_col: 'cover_image_path', src_bucket: 'covers',      dst_bucket: 'story_covers_private' },
  { table: 'characters',               url_col: 'avatar_url',      path_col: 'avatar_path',      src_bucket: 'avatars',     dst_bucket: 'character_avatars_private' },
  { table: 'side_characters',          url_col: 'avatar_url',      path_col: 'avatar_path',      src_bucket: 'avatars',     dst_bucket: 'character_avatars_private' },
  { table: 'character_session_states', url_col: 'avatar_url',      path_col: 'avatar_path',      src_bucket: 'avatars',     dst_bucket: 'character_avatars_private' },
];

function parsePublicBucketUrl(url: string, expectedBucket: string): string | null {
  // Match `…/storage/v1/object/public/<bucket>/<path>`
  const m = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
  if (!m) return null;
  if (m[1] !== expectedBucket) return null;
  try {
    return decodeURIComponent(m[2]);
  } catch {
    return m[2];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(req) });
  }
  const corsHeaders = getCorsHeaders(req);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: userError } = await authClient.auth.getUser(
      authHeader.replace('Bearer ', ''),
    );
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { data: isAdmin } = await authClient.rpc('has_role', {
      _user_id: user.id, _role: 'admin',
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden: admin only' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const summary: Record<string, { scanned: number; migrated: number; skipped_external: number; errors: number }> = {};

    for (const job of JOBS) {
      const stat = { scanned: 0, migrated: 0, skipped_external: 0, errors: 0 };
      summary[job.table] = stat;

      const select = `id, user_id, ${job.url_col}, ${job.path_col}${job.extraSelect ?? ''}`;
      const { data: rows, error: selErr } = await admin
        .from(job.table)
        .select(select)
        .is(job.path_col, null)
        .not(job.url_col, 'is', null);
      if (selErr) {
        stat.errors += 1;
        await admin.from('media_migration_errors').insert({
          source_table: job.table, error_kind: 'select_failed',
          error_detail: selErr.message,
        });
        continue;
      }

      for (const rawRow of rows || []) {
        const row = rawRow as Record<string, unknown>;
        const rowId = String(row.id);
        const userId = String(row.user_id ?? '');
        const url = String(row[job.url_col] ?? '');
        if (!url) continue;
        if (job.filter && !job.filter(row)) continue;
        stat.scanned += 1;

        const parsedPath = parsePublicBucketUrl(url, job.src_bucket);
        if (!parsedPath) {
          // External URL (e.g. xAI imgen CDN) or unparseable — record and skip.
          stat.skipped_external += 1;
          await admin.from('media_migration_errors').insert({
            source_table: job.table, source_row_id: rowId, user_id: userId || null,
            error_kind: 'external_or_unparseable_url',
            error_detail: url.startsWith('data:') ? 'data:URL omitted' : url.split('?')[0].slice(0, 200),
          });
          continue;
        }

        try {
          const { data: blob, error: dlErr } = await admin.storage
            .from(job.src_bucket).download(parsedPath);
          if (dlErr || !blob) throw new Error(`download: ${dlErr?.message || 'no blob'}`);

          const bytes = new Uint8Array(await blob.arrayBuffer());
          const contentType = blob.type || 'application/octet-stream';

          const { error: upErr } = await admin.storage
            .from(job.dst_bucket)
            .upload(parsedPath, bytes, { contentType, upsert: true });
          if (upErr) throw new Error(`upload: ${upErr.message}`);

          const { error: updErr } = await admin
            .from(job.table)
            .update({ [job.path_col]: parsedPath })
            .eq('id', rowId);
          if (updErr) throw new Error(`db update: ${updErr.message}`);

          stat.migrated += 1;
        } catch (e) {
          stat.errors += 1;
          await admin.from('media_migration_errors').insert({
            source_table: job.table, source_row_id: rowId, user_id: userId || null,
            source_bucket: job.src_bucket, source_path: parsedPath,
            target_bucket: job.dst_bucket, target_path: parsedPath,
            error_kind: 'migration_failed',
            error_detail: (e instanceof Error ? e.message : String(e)).slice(0, 500),
          });
        }
      }
    }

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'unknown' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});