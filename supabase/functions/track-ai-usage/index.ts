import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

const ALLOWED_EVENT_TYPES = new Set([
  "chat_call_1",
  "character_ai_fill",
  "character_ai_generate",
  "character_card_ai_update",
  "character_cards_update_call",
  "character_cards_updated",
  "character_ai_enhance_precise",
  "character_ai_enhance_detailed",
  "world_ai_enhance_precise",
  "world_ai_enhance_detailed",
  "side_character_generated",
  "side_character_card_generated",
  "side_character_avatar_generated",
  "memory_extraction_call",
  "memory_events_extracted",
  "memory_day_compression_call",
  "memory_bullets_compressed",
  "goal_progress_eval_call",
  "scene_image_generated",
  "cover_image_generated",
  "character_avatar_generated",
]);

function normalizeMetadata(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  return input as Record<string, unknown>;
}

function toNonNegativeInt(input: unknown): number {
  const n = typeof input === "number" ? input : Number(input);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

function toNonNegativeFloat(input: unknown): number {
  const n = typeof input === "number" ? input : Number(input);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, n);
}

const GROUP_BY_EVENT: Record<string, string> = {
  chat_call_1: "call_1",
  character_cards_update_call: "call_2",
  character_cards_updated: "call_2",
  memory_extraction_call: "post_turn",
  memory_events_extracted: "post_turn",
  memory_day_compression_call: "post_turn",
  memory_bullets_compressed: "post_turn",
  goal_progress_eval_call: "post_turn",
  side_character_generated: "call_2",
  side_character_card_generated: "call_2",
  side_character_avatar_generated: "image",
  scene_image_generated: "image",
  cover_image_generated: "image",
  character_avatar_generated: "image",
  character_ai_fill: "single_call",
  character_ai_generate: "single_call",
  character_card_ai_update: "single_call",
  character_ai_enhance_precise: "single_call",
  character_ai_enhance_detailed: "single_call",
  world_ai_enhance_precise: "single_call",
  world_ai_enhance_detailed: "single_call",
};

const COST_PER_EVENT_USD: Record<string, number> = {
  character_cards_update_call: 0.01,
  memory_extraction_call: 0.008,
  memory_day_compression_call: 0.008,
  goal_progress_eval_call: 0.008,
  scene_image_generated: 0.02,
  cover_image_generated: 0.02,
  side_character_avatar_generated: 0.02,
  character_avatar_generated: 0.02,
  character_ai_fill: 0.015,
  character_ai_generate: 0.018,
  character_card_ai_update: 0.02,
  character_ai_enhance_precise: 0.004,
  character_ai_enhance_detailed: 0.004,
  world_ai_enhance_precise: 0.004,
  world_ai_enhance_detailed: 0.004,
};

const INPUT_RATE_PER_1M = 0.2;
const OUTPUT_RATE_PER_1M = 0.5;

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

    const rawBody = await req.json().catch(() => ({}));
    const eventType = typeof rawBody?.eventType === "string" ? rawBody.eventType.trim() : "";
    const eventSource = typeof rawBody?.eventSource === "string" && rawBody.eventSource.trim()
      ? rawBody.eventSource.trim().slice(0, 64)
      : "client";
    const metadata = normalizeMetadata(rawBody?.metadata);
    const count = Number.isFinite(rawBody?.count) ? Math.max(1, Math.min(1000, Math.floor(rawBody.count))) : 1;

    if (!ALLOWED_EVENT_TYPES.has(eventType)) {
      return new Response(JSON.stringify({ error: "Unsupported event type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error: insertError } = await serviceClient.from("ai_usage_events").insert({
      user_id: userResult.user.id,
      event_type: eventType,
      event_source: eventSource,
      event_count: count,
      metadata,
    });

    if (insertError) {
      console.error("[track-ai-usage] Failed insert:", insertError);
      return new Response(JSON.stringify({ error: "Failed to record usage event" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mirror into test-session trace table when this user has an active trace session.
    // This keeps test instrumentation isolated without changing existing behavior.
    const { data: activeSession } = await serviceClient
      .from("ai_usage_test_sessions")
      .select("id")
      .eq("user_id", userResult.user.id)
      .eq("status", "active")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (activeSession?.id) {
      const inputChars = toNonNegativeInt(metadata.inputChars);
      const outputChars = toNonNegativeInt(metadata.outputChars);
      const inputTokensEst = toNonNegativeInt(metadata.inputTokensEst) || Math.ceil(inputChars / 4);
      const outputTokensEst = toNonNegativeInt(metadata.outputTokensEst) || Math.ceil(outputChars / 4);
      const totalTokensEst = toNonNegativeInt(metadata.totalTokensEst) || (inputTokensEst + outputTokensEst);

      const tokenDerivedCost =
        ((inputTokensEst / 1_000_000) * INPUT_RATE_PER_1M) +
        ((outputTokensEst / 1_000_000) * OUTPUT_RATE_PER_1M);
      const perEventCost = (COST_PER_EVENT_USD[eventType] || 0) * count;
      const estCostUsd = toNonNegativeFloat(metadata.estCostUsd) || (tokenDerivedCost > 0 ? tokenDerivedCost : perEventCost);

      const traceInsert = {
        session_id: activeSession.id,
        user_id: userResult.user.id,
        event_key: eventType,
        api_call_group: GROUP_BY_EVENT[eventType] || "misc",
        event_source: eventSource,
        model_id: typeof metadata.modelId === "string" ? metadata.modelId : null,
        input_chars: inputChars,
        output_chars: outputChars,
        input_tokens_est: inputTokensEst,
        output_tokens_est: outputTokensEst,
        total_tokens_est: totalTokensEst,
        est_cost_usd: estCostUsd,
        latency_ms: toNonNegativeInt(metadata.latencyMs) || null,
        status: typeof metadata.status === "string" ? metadata.status.slice(0, 32) : "ok",
        metadata: { ...metadata, eventCount: count },
      };

      const { error: traceError } = await serviceClient.from("ai_usage_test_events").insert(traceInsert);
      if (traceError) {
        console.error("[track-ai-usage] Failed test trace insert:", traceError);
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[track-ai-usage] Error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
