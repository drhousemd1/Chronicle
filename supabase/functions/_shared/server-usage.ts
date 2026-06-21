import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { estimateAiUsageCost } from "./usage-cost.ts";

export type ServerAiUsageEventType =
  | "chat_call_1"
  | "character_ai_fill"
  | "character_ai_generate"
  | "character_card_ai_update"
  | "character_cards_update_call"
  | "character_cards_updated"
  | "character_ai_enhance_precise"
  | "character_ai_enhance_detailed"
  | "world_ai_enhance_precise"
  | "world_ai_enhance_detailed"
  | "memory_extraction_call"
  | "memory_events_extracted"
  | "memory_day_compression_call"
  | "memory_bullets_compressed"
  | "goal_progress_eval_call"
  | "goal_alignment_eval_call"
  | "side_character_card_generated"
  | "side_character_avatar_generated"
  | "character_avatar_generated"
  | "scene_image_generated"
  | "cover_image_generated";

type RecordServerAiUsageArgs = {
  userId: string;
  eventType: ServerAiUsageEventType;
  functionName: string;
  count?: number;
  metadata?: Record<string, unknown>;
};

function normalizeCount(count: unknown): number {
  const numeric = typeof count === "number" ? count : Number(count);
  if (!Number.isFinite(numeric)) return 1;
  return Math.max(1, Math.min(1000, Math.floor(numeric)));
}

function sanitizeServerUsageMetadata(metadata: Record<string, unknown> = {}): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (typeof value === "string") {
      sanitized[key] = value.slice(0, 256);
    } else if (typeof value === "number" || typeof value === "boolean" || value === null) {
      sanitized[key] = value;
    }
  }

  return {
    ...sanitized,
    authoritative: true,
  };
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

async function mirrorServerUsageToActiveTestSession({
  serviceClient,
  userId,
  eventType,
  functionName,
  count,
  metadata,
}: {
  serviceClient: any;
  userId: string;
  eventType: ServerAiUsageEventType;
  functionName: string;
  count: number;
  metadata: Record<string, unknown>;
}) {
  const { data: activeSession, error: activeSessionError } = await serviceClient
    .from("ai_usage_test_sessions")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (activeSessionError) {
    console.warn(`[${functionName}] Test trace session lookup failed`, activeSessionError);
    return;
  }

  const activeSessionId = typeof activeSession?.id === "string" ? activeSession.id : "";
  if (!activeSessionId) return;

  const estimate = estimateAiUsageCost(eventType, metadata, count);
  const modelId = typeof metadata.modelId === "string"
    ? metadata.modelId
    : typeof metadata.textModelId === "string"
      ? metadata.textModelId
      : null;
  const inputChars = typeof metadata.inputChars === "number"
    ? Math.max(0, Math.floor(metadata.inputChars))
    : typeof metadata.promptChars === "number"
      ? Math.max(0, Math.floor(metadata.promptChars))
      : 0;
  const outputChars = typeof metadata.outputChars === "number" ? Math.max(0, Math.floor(metadata.outputChars)) : 0;
  const status = typeof metadata.status === "string" && metadata.status.trim()
    ? metadata.status.trim().slice(0, 64)
    : "server_authoritative";

  const { error: traceError } = await serviceClient.from("ai_usage_test_events").insert({
    session_id: activeSessionId,
    user_id: userId,
    event_type: eventType,
    event_key: eventType,
    api_call_group: GROUP_BY_EVENT[eventType] || "misc",
    event_source: `server:${functionName}`,
    function_name: functionName,
    model_id: modelId,
    input_chars: inputChars,
    output_chars: outputChars,
    input_tokens_est: estimate.inputTokens,
    output_tokens_est: estimate.outputTokens,
    total_tokens_est: estimate.totalTokens,
    est_cost_usd: estimate.estimatedCostUsd,
    status,
    metadata: {
      ...metadata,
      eventCount: count,
      serverAuthoritative: true,
      costEstimateSource: estimate.costEstimateSource,
    },
  });

  if (traceError) {
    console.warn(`[${functionName}] Test trace insert failed`, traceError);
  }
}

export async function recordServerAiUsage({
  userId,
  eventType,
  functionName,
  count = 1,
  metadata = {},
}: RecordServerAiUsageArgs): Promise<void> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn(`[${functionName}] Skipped server usage telemetry: Supabase env not configured`);
    return;
  }

  try {
    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const eventCount = normalizeCount(count);
    const sanitizedMetadata = sanitizeServerUsageMetadata(metadata);

    const { error } = await serviceClient.from("ai_usage_events").insert({
      user_id: userId,
      event_type: eventType,
      event_source: `server:${functionName}`,
      event_count: eventCount,
      metadata: sanitizedMetadata,
    });

    if (error) {
      console.warn(`[${functionName}] Skipped server usage telemetry: insert failed`, error);
      return;
    }

    await mirrorServerUsageToActiveTestSession({
      serviceClient,
      userId,
      eventType,
      functionName,
      count: eventCount,
      metadata: sanitizedMetadata,
    });
  } catch (error) {
    console.warn(`[${functionName}] Skipped server usage telemetry: unexpected error`, error);
  }
}
