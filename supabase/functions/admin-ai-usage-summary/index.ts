import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

interface UsageCounters {
  messagesSent: number;
  messagesGenerated: number;
  imagesGenerated: number;
  aiFillClicks: number;
  aiUpdateClicks: number;
  aiEnhanceClicks: number;
  characterUpdateCalls: number;
  characterCardsUpdated: number;
  aiCharacterCardsGenerated: number;
  aiAvatarsGenerated: number;
  memoryExtractionCalls: number;
  memoryEventsExtracted: number;
  memoryCompressionCalls: number;
  memoryBulletsCompressed: number;
  sideCharacterAvatarsGenerated: number;
  characterAvatarsGenerated: number;
  sceneImagesGenerated: number;
  coverImagesGenerated: number;
}

async function countRows(builder: PromiseLike<{ count: number | null; error: unknown }>): Promise<number> {
  const result = await builder;
  if (result.error) {
    console.error("[admin-ai-usage-summary] Count query failed:", result.error);
    return 0;
  }
  return result.count ?? 0;
}

async function countEventsByType(supabase: SupabaseClient, eventTypes: string[]): Promise<number> {
  if (!eventTypes.length) return 0;
  const { data, error } = await supabase
    .from("ai_usage_events")
    .select("event_count")
    .in("event_type", eventTypes);

  if (error || !data) {
    console.error("[admin-ai-usage-summary] Event count query failed:", error);
    return 0;
  }

  return data.reduce((sum, row) => {
    const value = Number(row.event_count);
    return Number.isFinite(value) ? sum + value : sum;
  }, 0);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(req) });
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Supabase env not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const accessToken = authHeader.replace("Bearer ", "");
    const { data: userResult, error: userError } = await authClient.auth.getUser(accessToken);
    if (userError || !userResult?.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isAdmin } = await authClient.rpc("has_role", {
      _user_id: userResult.user.id,
      _role: "admin",
    });
    if (isAdmin !== true) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const [
      messagesSent,
      messagesGenerated,
      sceneImages,
      storyCovers,
      sideCharacterAvatars,
      sideCharacterRows,
      aiFillClicks,
      aiUpdateClicks,
      aiEnhanceClicks,
      characterUpdateCalls,
      characterCardsUpdated,
      aiCharacterCardsGeneratedEvents,
      aiAvatarsGeneratedTracked,
      memoryExtractionCalls,
      memoryEventsExtracted,
      memoryCompressionCalls,
      memoryBulletsCompressed,
      trackedGeneratedImages,
      trackedCharacterAvatars,
    ] = await Promise.all([
      countRows(serviceClient.from("messages").select("id", { head: true, count: "exact" }).eq("role", "user")),
      countRows(serviceClient.from("messages").select("id", { head: true, count: "exact" }).eq("role", "assistant")),
      countRows(serviceClient.from("scenes").select("id", { head: true, count: "exact" })),
      countRows(serviceClient.from("stories").select("id", { head: true, count: "exact" }).not("cover_image_url", "is", null).neq("cover_image_url", "")),
      countRows(serviceClient.from("side_characters").select("id", { head: true, count: "exact" }).not("avatar_url", "is", null).neq("avatar_url", "")),
      countRows(serviceClient.from("side_characters").select("id", { head: true, count: "exact" }).not("name", "is", null).neq("name", "")),
      countEventsByType(serviceClient, ["character_ai_fill"]),
      countEventsByType(serviceClient, ["character_card_ai_update"]),
      countEventsByType(serviceClient, [
        "character_ai_enhance_precise",
        "character_ai_enhance_detailed",
        "world_ai_enhance_precise",
        "world_ai_enhance_detailed",
      ]),
      countEventsByType(serviceClient, ["character_cards_update_call"]),
      countEventsByType(serviceClient, ["character_cards_updated"]),
      countEventsByType(serviceClient, ["side_character_card_generated"]),
      countEventsByType(serviceClient, ["side_character_avatar_generated", "character_avatar_generated"]),
      countEventsByType(serviceClient, ["memory_extraction_call"]),
      countEventsByType(serviceClient, ["memory_events_extracted"]),
      countEventsByType(serviceClient, ["memory_day_compression_call"]),
      countEventsByType(serviceClient, ["memory_bullets_compressed"]),
      countEventsByType(serviceClient, [
        "scene_image_generated",
        "cover_image_generated",
        "side_character_avatar_generated",
        "character_avatar_generated",
      ]),
      countEventsByType(serviceClient, ["character_avatar_generated"]),
    ]);

    const tableDerivedImageCount = sceneImages + storyCovers + sideCharacterAvatars;
    const counters: UsageCounters = {
      messagesSent,
      messagesGenerated,
      imagesGenerated: Math.max(tableDerivedImageCount, trackedGeneratedImages),
      aiFillClicks,
      aiUpdateClicks,
      aiEnhanceClicks,
      characterUpdateCalls,
      characterCardsUpdated,
      aiCharacterCardsGenerated: Math.max(aiCharacterCardsGeneratedEvents, sideCharacterRows),
      aiAvatarsGenerated: Math.max(aiAvatarsGeneratedTracked, sideCharacterAvatars + trackedCharacterAvatars),
      memoryExtractionCalls,
      memoryEventsExtracted,
      memoryCompressionCalls,
      memoryBulletsCompressed,
      sideCharacterAvatarsGenerated: sideCharacterAvatars,
      characterAvatarsGenerated: trackedCharacterAvatars,
      sceneImagesGenerated: sceneImages,
      coverImagesGenerated: storyCovers,
    };

    const payload = {
      fetchedAt: new Date().toISOString(),
      counters,
      diagnostics: {
        tableDerivedImageCount,
        trackedGeneratedImages,
        sideCharacterRows: counters.aiCharacterCardsGenerated,
      },
    };

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[admin-ai-usage-summary] Error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
