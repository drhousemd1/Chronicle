// publish-cover edge function (Batch D — covers/avatars lockdown).
// Promotes a story's private cover into the public `covers` bucket when a
// scenario is published, and removes the public mirror on unpublish/hide/delete.
// Required because gallery cards (PublishedScenario.scenario.cover_image_url)
// rely on a publicly resolvable URL — draft covers stay in
// story_covers_private and are never copied out by this function.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

interface PublishCoverRequest {
  scenarioId?: string;
  action?: "publish" | "unpublish";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }
  const corsHeaders = getCorsHeaders(req);
  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: jsonHeaders,
      });
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
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: jsonHeaders,
      });
    }

    let body: PublishCoverRequest;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: jsonHeaders,
      });
    }
    const scenarioId = typeof body.scenarioId === "string" ? body.scenarioId : "";
    const action = body.action === "unpublish" ? "unpublish" : "publish";
    if (!scenarioId) {
      return new Response(JSON.stringify({ error: "scenarioId required" }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    // Ownership check + path lookup via SECURITY DEFINER RPC.
    const { data: meta, error: rpcErr } = await userClient.rpc(
      "promote_story_cover_to_public",
      { p_scenario_id: scenarioId },
    );
    if (rpcErr) {
      return new Response(
        JSON.stringify({ error: rpcErr.message || "promote failed" }),
        { status: 403, headers: jsonHeaders },
      );
    }
    const ownerId: string | null = (meta as any)?.owner_id ?? null;
    const privatePath: string | null = (meta as any)?.cover_image_path ?? null;
    const existingPublicUrl: string | null = (meta as any)?.cover_image_url ?? null;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const publicMirrorPathFromUrl = (url: string | null): string | null => {
      if (!url) return null;
      const marker = "/storage/v1/object/public/covers/";
      const idx = url.indexOf(marker);
      if (idx === -1) return null;
      return url.substring(idx + marker.length).split("?")[0];
    };

    if (action === "unpublish") {
      const oldPath = publicMirrorPathFromUrl(existingPublicUrl);
      if (oldPath) {
        await admin.storage.from("covers").remove([oldPath]);
      }
      await admin
        .from("stories")
        .update({ cover_image_url: null })
        .eq("id", scenarioId);
      return new Response(
        JSON.stringify({ ok: true, action: "unpublish", removedPath: oldPath }),
        { headers: jsonHeaders },
      );
    }

    // Publish branch — must have a private source path.
    if (!privatePath || !ownerId) {
      return new Response(
        JSON.stringify({
          ok: true,
          action: "publish",
          publicUrl: existingPublicUrl,
          note: "no private cover_image_path; left existing public URL untouched",
        }),
        { headers: jsonHeaders },
      );
    }

    // Download from private bucket.
    const { data: blob, error: dlErr } = await admin.storage
      .from("story_covers_private")
      .download(privatePath);
    if (dlErr || !blob) {
      return new Response(
        JSON.stringify({
          error: "Failed to read private cover",
          detail: dlErr?.message,
        }),
        { status: 500, headers: jsonHeaders },
      );
    }

    const base = privatePath.split("/").pop() || `cover-${Date.now()}`;
    const publicPath = `${ownerId}/${scenarioId}/${base}`;
    const { error: upErr } = await admin.storage
      .from("covers")
      .upload(publicPath, blob, {
        upsert: true,
        contentType: blob.type || "image/jpeg",
      });
    if (upErr) {
      return new Response(
        JSON.stringify({ error: "Failed to upload public mirror", detail: upErr.message }),
        { status: 500, headers: jsonHeaders },
      );
    }

    const { data: pub } = admin.storage.from("covers").getPublicUrl(publicPath);
    const publicUrl = pub.publicUrl;

    // Remove stale public mirror if path changed.
    const oldPath = publicMirrorPathFromUrl(existingPublicUrl);
    if (oldPath && oldPath !== publicPath) {
      await admin.storage.from("covers").remove([oldPath]);
    }

    await admin
      .from("stories")
      .update({ cover_image_url: publicUrl })
      .eq("id", scenarioId);

    return new Response(
      JSON.stringify({ ok: true, action: "publish", publicUrl, publicPath }),
      { headers: jsonHeaders },
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || "publish-cover failed" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } },
    );
  }
});