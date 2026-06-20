// admin-media-cleanup edge function (Batch D — covers/avatars lockdown).
// Admin-only utility that deletes legacy public character/session-state avatar
// files from the `avatars` bucket after Stage C migration. Each candidate is
// re-verified server-side: it must have a private mirror in
// `character_avatars_private` and must not be referenced by any current
// profile/character/side_character/character_session_state row.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }
  const corsHeaders = getCorsHeaders(req);
  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: jsonHeaders });
    }
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: userErr } = await userClient.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: jsonHeaders });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Admin check
    const { data: isAdmin } = await admin.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin required" }), { status: 403, headers: jsonHeaders });
    }

    let body: { action?: string; dryRun?: boolean } = {};
    try { body = await req.json(); } catch { /* allow empty */ }
    const dryRun = body.dryRun === true;
    if (body.action !== "purge_legacy_character_avatars") {
      return new Response(
        JSON.stringify({ error: "unknown action" }),
        { status: 400, headers: jsonHeaders },
      );
    }

    // Build candidate list via SQL (read-only).
    const { data: candidates, error: qErr } = await admin.rpc("exec" as any, {} as any).catch(() => ({ data: null, error: null }));
    // The above rpc may not exist; fall back to direct query via PostgREST is
    // not possible against storage.objects, so we call our own SQL through a
    // helper select on storage.objects via the admin client.
    let names: string[] = [];
    if (!candidates) {
      const { data, error } = await admin
        .schema("storage" as any)
        .from("objects")
        .select("name")
        .eq("bucket_id", "avatars");
      if (error) {
        return new Response(JSON.stringify({ error: "Failed to list avatars", detail: error.message }), { status: 500, headers: jsonHeaders });
      }
      const all = (data || []).map((r: any) => r.name as string);

      const { data: priv } = await admin
        .schema("storage" as any)
        .from("objects")
        .select("name")
        .eq("bucket_id", "character_avatars_private");
      const privSet = new Set((priv || []).map((r: any) => r.name as string));

      // Fetch refs
      const [{ data: chars }, { data: sides }, { data: css }, { data: profiles }] = await Promise.all([
        admin.from("characters").select("avatar_url"),
        admin.from("side_characters").select("avatar_url"),
        admin.from("character_session_states").select("avatar_url"),
        admin.from("profiles").select("avatar_url"),
      ]);
      const referenced = new Set<string>();
      const collect = (rows: any[] | null) => {
        for (const r of rows || []) {
          const u: string | null = r?.avatar_url ?? null;
          if (!u) continue;
          const m = u.match(/\/storage\/v1\/object\/public\/avatars\/(.+)$/);
          if (m) referenced.add(m[1].split("?")[0]);
        }
      };
      collect(chars as any[]); collect(sides as any[]); collect(css as any[]); collect(profiles as any[]);

      // Only target legacy character pattern: <uid>/avatar-<uuid>-<ts>.<ext>
      const charPattern = /^[0-9a-f-]+\/avatar-[0-9a-f-]{36}-\d+\.(jpg|jpeg|png|webp)$/;
      names = all.filter((n) => charPattern.test(n) && privSet.has(n) && !referenced.has(n));
    }

    if (dryRun) {
      return new Response(JSON.stringify({ ok: true, dryRun: true, candidateCount: names.length, sample: names.slice(0, 10) }), { headers: jsonHeaders });
    }

    if (names.length === 0) {
      return new Response(JSON.stringify({ ok: true, deleted: 0 }), { headers: jsonHeaders });
    }

    // Chunked delete via Storage API.
    let deleted = 0;
    const errors: any[] = [];
    const chunkSize = 100;
    for (let i = 0; i < names.length; i += chunkSize) {
      const chunk = names.slice(i, i + chunkSize);
      const { data, error } = await admin.storage.from("avatars").remove(chunk);
      if (error) errors.push(error.message);
      else deleted += (data || []).length;
    }
    return new Response(JSON.stringify({ ok: true, deleted, errors }), { headers: jsonHeaders });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || "admin-media-cleanup failed" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } },
    );
  }
});