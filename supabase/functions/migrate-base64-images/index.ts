import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }
  const corsHeaders = getCorsHeaders(req);

  try {
    // Auth guard — require authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: userError } = await authClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: isAdmin, error: roleError } = await authClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin',
    });
    if (roleError || !isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden: admin access required' }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role for admin access
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const results = { covers: 0, avatars: 0, sideCharAvatars: 0, errors: [] as string[] };

    // 1. Migrate cover images
    const { data: scenarios } = await supabase
      .from('stories')
      .select('id, user_id, cover_image_url')
      .like('cover_image_url', 'data:%');

    for (const row of scenarios || []) {
      try {
        const b64 = row.cover_image_url.split(',')[1];
        if (!b64) continue;
        const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
        const filename = `${row.user_id}/cover-migrated-${row.id}.png`;
        const { error: upErr } = await supabase.storage.from('covers').upload(filename, bytes, { contentType: 'image/png', upsert: true });
        if (upErr) { results.errors.push(`cover ${row.id}: ${upErr.message}`); continue; }
        const { data: urlData } = supabase.storage.from('covers').getPublicUrl(filename);
        await supabase.from('stories').update({ cover_image_url: urlData.publicUrl }).eq('id', row.id);
        results.covers++;
      } catch (e: any) {
        results.errors.push(`cover ${row.id}: ${(e as Error).message}`);
      }
    }

    // 2. Migrate character avatars
    const { data: characters } = await supabase
      .from('characters')
      .select('id, user_id, avatar_url')
      .like('avatar_url', 'data:%');

    for (const row of characters || []) {
      try {
        const b64 = row.avatar_url.split(',')[1];
        if (!b64) continue;
        const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
        const filename = `${row.user_id}/avatar-migrated-${row.id}.png`;
        const { error: upErr } = await supabase.storage.from('avatars').upload(filename, bytes, { contentType: 'image/png', upsert: true });
        if (upErr) { results.errors.push(`char ${row.id}: ${upErr.message}`); continue; }
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filename);
        await supabase.from('characters').update({ avatar_url: urlData.publicUrl }).eq('id', row.id);
        results.avatars++;
      } catch (e: any) {
        results.errors.push(`char ${row.id}: ${(e as Error).message}`);
      }
    }

    // 3. Migrate side character avatars
    const { data: sideChars } = await supabase
      .from('side_characters')
      .select('id, user_id, avatar_url')
      .like('avatar_url', 'data:%');

    for (const row of sideChars || []) {
      try {
        const b64 = row.avatar_url.split(',')[1];
        if (!b64) continue;
        const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
        const filename = `${row.user_id}/side-avatar-migrated-${row.id}.png`;
        const { error: upErr } = await supabase.storage.from('avatars').upload(filename, bytes, { contentType: 'image/png', upsert: true });
        if (upErr) { results.errors.push(`side ${row.id}: ${upErr.message}`); continue; }
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filename);
        await supabase.from('side_characters').update({ avatar_url: urlData.publicUrl }).eq('id', row.id);
        results.sideCharAvatars++;
      } catch (e: any) {
        results.errors.push(`side ${row.id}: ${(e as Error).message}`);
      }
    }

    console.log(`[migrate-base64-images] Done: ${results.covers} covers, ${results.avatars} avatars, ${results.sideCharAvatars} side chars`);

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("migrate-base64-images error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
