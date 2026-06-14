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
  "goal_alignment_eval_call",
  "scene_image_generated",
  "cover_image_generated",
  "character_avatar_generated",
]);

const CLIENT_DIAGNOSTIC_EVENT_SOURCE = "client_diagnostic";
const CLIENT_DIAGNOSTIC_METADATA_BLOCKLIST = [
  /cost/i,
  /price/i,
  /token/i,
  /^status$/i,
];

function normalizeMetadata(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  return input as Record<string, unknown>;
}

function sanitizeClientDiagnosticMetadata(
  input: Record<string, unknown>,
  clientReportedEventSource: string | null,
  clientReportedCount: unknown,
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (CLIENT_DIAGNOSTIC_METADATA_BLOCKLIST.some((pattern) => pattern.test(key))) continue;
    sanitized[key] = value;
  }
  return {
    ...sanitized,
    ...(clientReportedEventSource ? { clientReportedEventSource } : {}),
    ...(typeof clientReportedCount === "number" && Number.isFinite(clientReportedCount) ? { clientReportedCount } : {}),
    diagnosticOnly: true,
  };
}

function toNonNegativeInt(input: unknown): number {
  const n = typeof input === "number" ? input : Number(input);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

function jsonResponse(
  body: Record<string, unknown>,
  corsHeaders: Record<string, string>,
  status = 200,
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
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
  goal_alignment_eval_call: "post_turn",
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(req) });
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.warn("[track-ai-usage] Skipped telemetry: missing auth header");
      return jsonResponse({ ok: false, skipped: true, reason: "unauthorized" }, corsHeaders);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      console.warn("[track-ai-usage] Skipped telemetry: Supabase env not configured");
      return jsonResponse({ ok: false, skipped: true, reason: "env_not_configured" }, corsHeaders);
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const accessToken = authHeader.replace("Bearer ", "");
    const { data: userResult, error: userError } = await authClient.auth.getUser(accessToken);
    if (userError || !userResult?.user) {
      console.warn("[track-ai-usage] Skipped telemetry: invalid auth token", userError);
      return jsonResponse({ ok: false, skipped: true, reason: "invalid_token" }, corsHeaders);
    }

    const rawBody = await req.json().catch(() => ({}));
    const eventType = typeof rawBody?.eventType === "string" ? rawBody.eventType.trim() : "";
    const clientReportedEventSource = typeof rawBody?.eventSource === "string" && rawBody.eventSource.trim()
      ? rawBody.eventSource.trim().slice(0, 64)
      : null;
    const metadata = sanitizeClientDiagnosticMetadata(
      normalizeMetadata(rawBody?.metadata),
      clientReportedEventSource,
      rawBody?.count,
    );

    if (!ALLOWED_EVENT_TYPES.has(eventType)) {
      console.warn("[track-ai-usage] Skipped telemetry: unsupported event type", eventType);
      return jsonResponse({ ok: false, skipped: true, reason: "unsupported_event_type" }, corsHeaders);
    }

    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error: insertError } = await serviceClient.from("ai_usage_events").insert({
      user_id: userResult.user.id,
      event_type: eventType,
      event_source: CLIENT_DIAGNOSTIC_EVENT_SOURCE,
      event_count: 1,
      metadata,
    });

    if (insertError) {
      console.warn("[track-ai-usage] Skipped telemetry: usage event insert failed", insertError);
      return jsonResponse({ ok: false, skipped: true, reason: "usage_insert_failed" }, corsHeaders);
    }

    // Mirror into test-session trace table when this user has an active trace session.
    // This keeps test instrumentation isolated without changing existing behavior.
    const { data: activeSession, error: activeSessionError } = await serviceClient
      .from("ai_usage_test_sessions")
      .select("id")
      .eq("user_id", userResult.user.id)
      .eq("status", "active")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (activeSessionError) {
      console.warn("[track-ai-usage] Test trace session lookup failed:", activeSessionError);
    }

    if (activeSession?.id) {
      const inputChars = toNonNegativeInt(metadata.inputChars);
      const outputChars = toNonNegativeInt(metadata.outputChars);
      const inputTokensEst = Math.ceil(inputChars / 4);
      const outputTokensEst = Math.ceil(outputChars / 4);
      const totalTokensEst = inputTokensEst + outputTokensEst;

      const traceInsert = {
        session_id: activeSession.id,
        user_id: userResult.user.id,
        event_type: eventType,
        event_key: eventType,
        api_call_group: GROUP_BY_EVENT[eventType] || "misc",
        event_source: CLIENT_DIAGNOSTIC_EVENT_SOURCE,
        function_name: "track-ai-usage",
        model_id: typeof metadata.modelId === "string" ? metadata.modelId : null,
        input_chars: inputChars,
        output_chars: outputChars,
        input_tokens_est: inputTokensEst,
        output_tokens_est: outputTokensEst,
        total_tokens_est: totalTokensEst,
        est_cost_usd: 0,
        latency_ms: toNonNegativeInt(metadata.latencyMs) || null,
        status: "client_diagnostic",
        metadata: { ...metadata, eventCount: 1 },
      };

      const { error: traceError } = await serviceClient.from("ai_usage_test_events").insert(traceInsert);
      if (traceError) {
        console.warn("[track-ai-usage] Test trace insert failed:", traceError);
      }
    }

    return jsonResponse({ ok: true }, corsHeaders);
  } catch (error) {
    console.warn("[track-ai-usage] Skipped telemetry: unexpected error", error);
    return jsonResponse({ ok: false, skipped: true, reason: "unexpected_error" }, corsHeaders);
  }
});
