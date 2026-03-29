import { supabase } from "@/integrations/supabase/client";

export type AiUsageEventType =
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
  | "side_character_generated"
  | "side_character_card_generated"
  | "side_character_avatar_generated"
  | "memory_extraction_call"
  | "memory_events_extracted"
  | "memory_day_compression_call"
  | "memory_bullets_compressed"
  | "goal_progress_eval_call"
  | "scene_image_generated"
  | "cover_image_generated"
  | "character_avatar_generated";

interface TrackAiUsageEventArgs {
  eventType: AiUsageEventType;
  eventSource?: string;
  metadata?: Record<string, unknown>;
  count?: number;
}

export async function trackAiUsageEvent({
  eventType,
  eventSource = "client",
  metadata = {},
  count = 1,
}: TrackAiUsageEventArgs): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke("track-ai-usage", {
      body: {
        eventType,
        eventSource,
        metadata,
        count,
      },
    });

    if (error) {
      console.error("[usage-tracking] Failed to track usage event:", error);
    }
  } catch (error) {
    console.error("[usage-tracking] Unexpected tracking error:", error);
  }
}
