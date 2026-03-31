import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

type UsagePeriod = "day" | "week" | "month" | "year";

interface Bucket {
  start: Date;
  end: Date;
  label: string;
}

interface UsagePoint {
  label: string;
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
  textCostUsd: number;
  imageCostUsd: number;
}

// Cost estimates per call (USD)
const TEXT_COST_PER_CALL = 0.001;   // ~avg token usage at grok-3-fast rates
const IMAGE_COST_PER_CALL = 0.02;   // grok-2-image rate

function createEmptyPoint(label: string): UsagePoint {
  return {
    label,
    messagesSent: 0,
    messagesGenerated: 0,
    imagesGenerated: 0,
    aiFillClicks: 0,
    aiUpdateClicks: 0,
    aiEnhanceClicks: 0,
    characterUpdateCalls: 0,
    characterCardsUpdated: 0,
    aiCharacterCardsGenerated: 0,
    aiAvatarsGenerated: 0,
    memoryExtractionCalls: 0,
    memoryEventsExtracted: 0,
    memoryCompressionCalls: 0,
    memoryBulletsCompressed: 0,
    sideCharacterAvatarsGenerated: 0,
    characterAvatarsGenerated: 0,
    sceneImagesGenerated: 0,
    coverImagesGenerated: 0,
    textCostUsd: 0,
    imageCostUsd: 0,
  };
}

function getPeriod(input: unknown): UsagePeriod {
  if (input === "day" || input === "week" || input === "month" || input === "year") return input;
  return "week";
}

function buildBuckets(period: UsagePeriod): Bucket[] {
  const now = new Date();

  if (period === "day") {
    return Array.from({ length: 8 }, (_, i) => {
      const start = new Date(now);
      start.setMinutes(0, 0, 0);
      start.setHours(start.getHours() - ((7 - i) * 3));
      const end = new Date(start);
      end.setHours(end.getHours() + 3);
      return {
        start,
        end,
        label: start.toLocaleTimeString([], { hour: "numeric" }),
      };
    });
  }

  if (period === "week") {
    return Array.from({ length: 7 }, (_, i) => {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - (6 - i));
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      return {
        start,
        end,
        label: start.toLocaleDateString([], { weekday: "short" }),
      };
    });
  }

  if (period === "month") {
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const startRange = new Date(startOfDay);
    startRange.setDate(startRange.getDate() - 27);
    return Array.from({ length: 4 }, (_, i) => {
      const start = new Date(startRange);
      start.setDate(startRange.getDate() + (i * 7));
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      return {
        start,
        end,
        label: `Wk${i + 1}`,
      };
    });
  }

  return Array.from({ length: 12 }, (_, i) => {
    const start = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1, 0, 0, 0, 0);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1, 0, 0, 0, 0);
    return {
      start,
      end,
      label: start.toLocaleString([], { month: "short" }),
    };
  });
}

function getBucketIndex(date: Date, buckets: Bucket[]): number {
  for (let i = 0; i < buckets.length; i += 1) {
    if (date >= buckets[i].start && date < buckets[i].end) return i;
  }
  return -1;
}

function safeDate(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function safeCount(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.floor(n));
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

    const body = await req.json().catch(() => ({}));
    const period = getPeriod(body?.period);
    const userIds: string[] | null = Array.isArray(body?.userIds) && body.userIds.length > 0
      ? body.userIds.filter((id: unknown) => typeof id === "string")
      : null;
    const buckets = buildBuckets(period);
    const points = buckets.map((bucket) => createEmptyPoint(bucket.label));
    const rangeStartIso = buckets[0].start.toISOString();

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

    // Build queries with optional userIds filter
    const messagesQuery = serviceClient
      .from("messages")
      .select("created_at, role")
      .gte("created_at", rangeStartIso)
      .in("role", ["user", "assistant"]);

    let eventsQuery = serviceClient
      .from("ai_usage_events")
      .select("created_at, event_type, event_count, user_id")
      .gte("created_at", rangeStartIso);

    if (userIds) {
      eventsQuery = eventsQuery.in("user_id", userIds);
      // For messages, we need to filter by conversation owner
      // Since messages don't have user_id directly, we skip userIds filter on messages
      // and rely on ai_usage_events which has user_id
    }

    let filteredMessagesPromise: Promise<{ data: Array<{ created_at: string; role: string }> | null; error: unknown }>;
    if (userIds) {
      const { data: conversationRows, error: conversationError } = await serviceClient
        .from("conversations")
        .select("id")
        .in("user_id", userIds);

      if (conversationError) {
        console.error("[admin-ai-usage-timeseries] Conversation filter query failed:", conversationError);
        filteredMessagesPromise = Promise.resolve({ data: [], error: null });
      } else {
        const conversationIds = (conversationRows || [])
          .map((row: { id: string }) => row.id)
          .filter((id: string) => typeof id === "string" && id.length > 0);

        filteredMessagesPromise = conversationIds.length === 0
          ? Promise.resolve({ data: [], error: null })
          : serviceClient
              .from("messages")
              .select("created_at, role")
              .gte("created_at", rangeStartIso)
              .in("role", ["user", "assistant"])
              .in("conversation_id", conversationIds);
      }
    } else {
      filteredMessagesPromise = messagesQuery;
    }

    const [messagesRes, eventsRes] = await Promise.all([
      filteredMessagesPromise,
      eventsQuery,
    ]);

    if (messagesRes.error) {
      console.error("[admin-ai-usage-timeseries] Messages query failed:", messagesRes.error);
    }
    if (eventsRes.error) {
      console.error("[admin-ai-usage-timeseries] Events query failed:", eventsRes.error);
    }

    for (const row of messagesRes.data || []) {
      const createdAt = safeDate(row.created_at);
      if (!createdAt) continue;
      const idx = getBucketIndex(createdAt, buckets);
      if (idx < 0) continue;
      if (row.role === "user") points[idx].messagesSent += 1;
      if (row.role === "assistant") points[idx].messagesGenerated += 1;
    }

    for (const row of eventsRes.data || []) {
      const createdAt = safeDate(row.created_at);
      if (!createdAt) continue;
      const idx = getBucketIndex(createdAt, buckets);
      if (idx < 0) continue;
      const count = safeCount(row.event_count);

      switch (row.event_type) {
        case "character_ai_fill":
          points[idx].aiFillClicks += count;
          break;
        case "character_card_ai_update":
          points[idx].aiUpdateClicks += count;
          break;
        case "character_ai_enhance_precise":
        case "character_ai_enhance_detailed":
        case "world_ai_enhance_precise":
        case "world_ai_enhance_detailed":
          points[idx].aiEnhanceClicks += count;
          break;
        case "character_cards_update_call":
          points[idx].characterUpdateCalls += count;
          break;
        case "character_cards_updated":
          points[idx].characterCardsUpdated += count;
          break;
        case "side_character_card_generated":
          points[idx].aiCharacterCardsGenerated += count;
          break;
        case "side_character_avatar_generated":
          points[idx].sideCharacterAvatarsGenerated += count;
          points[idx].aiAvatarsGenerated += count;
          break;
        case "character_avatar_generated":
          points[idx].characterAvatarsGenerated += count;
          points[idx].aiAvatarsGenerated += count;
          break;
        case "scene_image_generated":
          points[idx].sceneImagesGenerated += count;
          break;
        case "cover_image_generated":
          points[idx].coverImagesGenerated += count;
          break;
        case "memory_extraction_call":
          points[idx].memoryExtractionCalls += count;
          break;
        case "memory_events_extracted":
          points[idx].memoryEventsExtracted += count;
          break;
        case "memory_day_compression_call":
          points[idx].memoryCompressionCalls += count;
          break;
        case "memory_bullets_compressed":
          points[idx].memoryBulletsCompressed += count;
          break;
        default:
          break;
      }
    }

    for (const point of points) {
      point.imagesGenerated =
        point.sideCharacterAvatarsGenerated +
        point.characterAvatarsGenerated +
        point.sceneImagesGenerated +
        point.coverImagesGenerated;

      // Calculate cost estimates
      const textCalls =
        point.messagesGenerated +
        point.aiFillClicks +
        point.aiUpdateClicks +
        point.aiEnhanceClicks +
        point.characterUpdateCalls +
        point.aiCharacterCardsGenerated +
        point.memoryExtractionCalls +
        point.memoryCompressionCalls;
      point.textCostUsd = Math.round(textCalls * TEXT_COST_PER_CALL * 1000) / 1000;
      point.imageCostUsd = Math.round(point.imagesGenerated * IMAGE_COST_PER_CALL * 1000) / 1000;
    }

    return new Response(JSON.stringify({
      fetchedAt: new Date().toISOString(),
      period,
      points,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[admin-ai-usage-timeseries] Error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
