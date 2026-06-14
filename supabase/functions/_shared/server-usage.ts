import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const { error } = await serviceClient.from("ai_usage_events").insert({
      user_id: userId,
      event_type: eventType,
      event_source: `server:${functionName}`,
      event_count: normalizeCount(count),
      metadata: sanitizeServerUsageMetadata(metadata),
    });

    if (error) {
      console.warn(`[${functionName}] Skipped server usage telemetry: insert failed`, error);
    }
  } catch (error) {
    console.warn(`[${functionName}] Skipped server usage telemetry: unexpected error`, error);
  }
}
