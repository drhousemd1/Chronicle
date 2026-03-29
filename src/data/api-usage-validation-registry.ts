export type ApiUsageValidationCallGroup = "call_1" | "call_2" | "single_call";
export type ApiUsageValidationRowKind = "summary" | "detail";

export type ApiUsageValidationRow = {
  id: string;
  label: string;
  kind: ApiUsageValidationRowKind;
  callGroup: ApiUsageValidationCallGroup;
  parentId?: string;
  sort: number;
  helpText: string;
};

type ApiUsageValidationRowSeed = Omit<ApiUsageValidationRow, "helpText">;

const rows: ApiUsageValidationRowSeed[] = [
  { id: "summary.call1.chat_payload", label: "Call 1: Chat Payload", kind: "summary", callGroup: "call_1", sort: 10 },
  { id: "call1.meta.system_instruction", label: "System instruction", kind: "detail", callGroup: "call_1", parentId: "summary.call1.chat_payload", sort: 11 },
  { id: "call1.meta.history_messages", label: "Recent messages", kind: "detail", callGroup: "call_1", parentId: "summary.call1.chat_payload", sort: 12 },
  { id: "call1.meta.final_user_wrapper", label: "Final user wrapper", kind: "detail", callGroup: "call_1", parentId: "summary.call1.chat_payload", sort: 13 },
  { id: "call1.story.scenario_name", label: "Story card: name", kind: "detail", callGroup: "call_1", parentId: "summary.call1.chat_payload", sort: 14 },
  { id: "call1.story.brief_description", label: "Story card: brief description", kind: "detail", callGroup: "call_1", parentId: "summary.call1.chat_payload", sort: 15 },
  { id: "call1.story.story_premise", label: "Story details: premise", kind: "detail", callGroup: "call_1", parentId: "summary.call1.chat_payload", sort: 16 },
  { id: "call1.story.structured_locations", label: "Story details: locations", kind: "detail", callGroup: "call_1", parentId: "summary.call1.chat_payload", sort: 17 },
  { id: "call1.story.dialog_formatting", label: "Story details: dialog formatting", kind: "detail", callGroup: "call_1", parentId: "summary.call1.chat_payload", sort: 18 },
  { id: "call1.story.custom_world_sections", label: "Story details: custom world content", kind: "detail", callGroup: "call_1", parentId: "summary.call1.chat_payload", sort: 19 },
  { id: "call1.story.story_goals", label: "Story goals", kind: "detail", callGroup: "call_1", parentId: "summary.call1.chat_payload", sort: 20 },
  { id: "call1.cast.ai_characters", label: "CAST: AI characters", kind: "detail", callGroup: "call_1", parentId: "summary.call1.chat_payload", sort: 21 },
  { id: "call1.cast.user_controlled_exclusions", label: "CAST: user-controlled exclusions", kind: "detail", callGroup: "call_1", parentId: "summary.call1.chat_payload", sort: 22 },
  { id: "call1.cast.character_basics", label: "Character basics", kind: "detail", callGroup: "call_1", parentId: "summary.call1.chat_payload", sort: 23 },
  { id: "call1.cast.physical_appearance", label: "Physical appearance", kind: "detail", callGroup: "call_1", parentId: "summary.call1.chat_payload", sort: 24 },
  { id: "call1.cast.currently_wearing", label: "Currently wearing", kind: "detail", callGroup: "call_1", parentId: "summary.call1.chat_payload", sort: 25 },
  { id: "call1.cast.preferred_clothing", label: "Preferred clothing", kind: "detail", callGroup: "call_1", parentId: "summary.call1.chat_payload", sort: 26 },
  { id: "call1.cast.personality", label: "Personality", kind: "detail", callGroup: "call_1", parentId: "summary.call1.chat_payload", sort: 27 },
  { id: "call1.cast.tone", label: "Tone", kind: "detail", callGroup: "call_1", parentId: "summary.call1.chat_payload", sort: 28 },
  { id: "call1.cast.background", label: "Background", kind: "detail", callGroup: "call_1", parentId: "summary.call1.chat_payload", sort: 29 },
  { id: "call1.cast.key_life_events", label: "Key life events", kind: "detail", callGroup: "call_1", parentId: "summary.call1.chat_payload", sort: 30 },
  { id: "call1.cast.relationships", label: "Relationships", kind: "detail", callGroup: "call_1", parentId: "summary.call1.chat_payload", sort: 31 },
  { id: "call1.cast.secrets", label: "Secrets", kind: "detail", callGroup: "call_1", parentId: "summary.call1.chat_payload", sort: 32 },
  { id: "call1.cast.fears", label: "Fears", kind: "detail", callGroup: "call_1", parentId: "summary.call1.chat_payload", sort: 33 },
  { id: "call1.cast.character_goals", label: "Character goals", kind: "detail", callGroup: "call_1", parentId: "summary.call1.chat_payload", sort: 34 },
  { id: "call1.cast.custom_sections", label: "Custom character sections", kind: "detail", callGroup: "call_1", parentId: "summary.call1.chat_payload", sort: 35 },

  { id: "summary.call2.character_updates", label: "Call 2: Character Updates", kind: "summary", callGroup: "call_2", sort: 110 },
  { id: "call2.character_updates.user_message", label: "userMessage", kind: "detail", callGroup: "call_2", parentId: "summary.call2.character_updates", sort: 111 },
  { id: "call2.character_updates.ai_response", label: "aiResponse", kind: "detail", callGroup: "call_2", parentId: "summary.call2.character_updates", sort: 112 },
  { id: "call2.character_updates.recent_context", label: "recentContext", kind: "detail", callGroup: "call_2", parentId: "summary.call2.character_updates", sort: 113 },
  { id: "call2.character_updates.characters_payload", label: "characters", kind: "detail", callGroup: "call_2", parentId: "summary.call2.character_updates", sort: 114 },
  { id: "call2.character_updates.eligible_characters", label: "eligibleCharacters", kind: "detail", callGroup: "call_2", parentId: "summary.call2.character_updates", sort: 115 },

  { id: "summary.call2.memory_extract", label: "Call 2: Memory Extraction", kind: "summary", callGroup: "call_2", sort: 120 },
  { id: "call2.memory_extract.message_text", label: "messageText", kind: "detail", callGroup: "call_2", parentId: "summary.call2.memory_extract", sort: 121 },
  { id: "call2.memory_extract.character_names", label: "characterNames", kind: "detail", callGroup: "call_2", parentId: "summary.call2.memory_extract", sort: 122 },
  { id: "call2.memory_extract.model_id", label: "modelId", kind: "detail", callGroup: "call_2", parentId: "summary.call2.memory_extract", sort: 123 },

  { id: "summary.call2.goal_eval", label: "Call 2: Goal Evaluation", kind: "summary", callGroup: "call_2", sort: 130 },
  { id: "call2.goal_eval.user_message", label: "userMessage", kind: "detail", callGroup: "call_2", parentId: "summary.call2.goal_eval", sort: 131 },
  { id: "call2.goal_eval.ai_response", label: "aiResponse", kind: "detail", callGroup: "call_2", parentId: "summary.call2.goal_eval", sort: 132 },
  { id: "call2.goal_eval.pending_steps", label: "pendingSteps", kind: "detail", callGroup: "call_2", parentId: "summary.call2.goal_eval", sort: 133 },
  { id: "call2.goal_eval.temporal_context", label: "day/time", kind: "detail", callGroup: "call_2", parentId: "summary.call2.goal_eval", sort: 134 },

  { id: "summary.call2.memory_compress", label: "Call 2: Memory Compression", kind: "summary", callGroup: "call_2", sort: 140 },
  { id: "call2.memory_compress.bullets", label: "bullets", kind: "detail", callGroup: "call_2", parentId: "summary.call2.memory_compress", sort: 141 },
  { id: "call2.memory_compress.day", label: "day", kind: "detail", callGroup: "call_2", parentId: "summary.call2.memory_compress", sort: 142 },
  { id: "call2.memory_compress.conversation_id", label: "conversationId", kind: "detail", callGroup: "call_2", parentId: "summary.call2.memory_compress", sort: 143 },

  { id: "summary.call2.side_character_profile", label: "Call 2: Side Character Card", kind: "summary", callGroup: "call_2", sort: 150 },
  { id: "call2.side_character_profile.name", label: "name", kind: "detail", callGroup: "call_2", parentId: "summary.call2.side_character_profile", sort: 151 },
  { id: "call2.side_character_profile.dialog_context", label: "dialogContext", kind: "detail", callGroup: "call_2", parentId: "summary.call2.side_character_profile", sort: 152 },
  { id: "call2.side_character_profile.world_context", label: "worldContext", kind: "detail", callGroup: "call_2", parentId: "summary.call2.side_character_profile", sort: 153 },
  { id: "call2.side_character_profile.model_id", label: "modelId", kind: "detail", callGroup: "call_2", parentId: "summary.call2.side_character_profile", sort: 154 },

  { id: "summary.call2.side_character_avatar", label: "Call 2: Side Character Avatar", kind: "summary", callGroup: "call_2", sort: 160 },
  { id: "call2.side_character_avatar.avatar_prompt", label: "avatarPrompt", kind: "detail", callGroup: "call_2", parentId: "summary.call2.side_character_avatar", sort: 161 },
  { id: "call2.side_character_avatar.character_name", label: "characterName", kind: "detail", callGroup: "call_2", parentId: "summary.call2.side_character_avatar", sort: 162 },
  { id: "call2.side_character_avatar.model_id", label: "modelId", kind: "detail", callGroup: "call_2", parentId: "summary.call2.side_character_avatar", sort: 163 },

  { id: "summary.single.character_ai_fill", label: "Single Call: Character AI Fill", kind: "summary", callGroup: "single_call", sort: 210 },
  { id: "single.character_ai_fill.character_id", label: "characterId", kind: "detail", callGroup: "single_call", parentId: "summary.single.character_ai_fill", sort: 211 },
  { id: "single.character_ai_fill.world_context", label: "worldContext", kind: "detail", callGroup: "single_call", parentId: "summary.single.character_ai_fill", sort: 212 },
  { id: "single.character_ai_fill.self_context", label: "selfContext", kind: "detail", callGroup: "single_call", parentId: "summary.single.character_ai_fill", sort: 213 },
  { id: "single.character_ai_fill.prompt", label: "prompt", kind: "detail", callGroup: "single_call", parentId: "summary.single.character_ai_fill", sort: 214 },
  { id: "single.character_ai_fill.model_id", label: "modelId", kind: "detail", callGroup: "single_call", parentId: "summary.single.character_ai_fill", sort: 215 },

  { id: "summary.single.character_ai_generate", label: "Single Call: Character AI Generate", kind: "summary", callGroup: "single_call", sort: 220 },
  { id: "single.character_ai_generate.character_id", label: "characterId", kind: "detail", callGroup: "single_call", parentId: "summary.single.character_ai_generate", sort: 221 },
  { id: "single.character_ai_generate.world_context", label: "worldContext", kind: "detail", callGroup: "single_call", parentId: "summary.single.character_ai_generate", sort: 222 },
  { id: "single.character_ai_generate.prompt", label: "prompt", kind: "detail", callGroup: "single_call", parentId: "summary.single.character_ai_generate", sort: 223 },
  { id: "single.character_ai_generate.model_id", label: "modelId", kind: "detail", callGroup: "single_call", parentId: "summary.single.character_ai_generate", sort: 224 },

  { id: "summary.single.character_ai_enhance", label: "Single Call: Character AI Enhance", kind: "summary", callGroup: "single_call", sort: 230 },
  { id: "single.character_ai_enhance.field_name", label: "fieldName", kind: "detail", callGroup: "single_call", parentId: "summary.single.character_ai_enhance", sort: 231 },
  { id: "single.character_ai_enhance.prompt", label: "prompt", kind: "detail", callGroup: "single_call", parentId: "summary.single.character_ai_enhance", sort: 232 },
  { id: "single.character_ai_enhance.model_id", label: "modelId", kind: "detail", callGroup: "single_call", parentId: "summary.single.character_ai_enhance", sort: 233 },

  { id: "summary.single.world_ai_enhance", label: "Single Call: World AI Enhance", kind: "summary", callGroup: "single_call", sort: 240 },
  { id: "single.world_ai_enhance.field_name", label: "fieldName", kind: "detail", callGroup: "single_call", parentId: "summary.single.world_ai_enhance", sort: 241 },
  { id: "single.world_ai_enhance.prompt", label: "prompt", kind: "detail", callGroup: "single_call", parentId: "summary.single.world_ai_enhance", sort: 242 },
  { id: "single.world_ai_enhance.model_id", label: "modelId", kind: "detail", callGroup: "single_call", parentId: "summary.single.world_ai_enhance", sort: 243 },

  { id: "summary.single.character_card_ai_update", label: "Single Call: Character AI Update", kind: "summary", callGroup: "single_call", sort: 250 },
  { id: "single.character_card_ai_update.conversation_id", label: "conversationId", kind: "detail", callGroup: "single_call", parentId: "summary.single.character_card_ai_update", sort: 251 },
  { id: "single.character_card_ai_update.character_id", label: "characterId", kind: "detail", callGroup: "single_call", parentId: "summary.single.character_card_ai_update", sort: 252 },
  { id: "single.character_card_ai_update.user_message", label: "userMessage", kind: "detail", callGroup: "single_call", parentId: "summary.single.character_card_ai_update", sort: 253 },
  { id: "single.character_card_ai_update.ai_response", label: "aiResponse", kind: "detail", callGroup: "single_call", parentId: "summary.single.character_card_ai_update", sort: 254 },
  { id: "single.character_card_ai_update.characters_payload", label: "characters", kind: "detail", callGroup: "single_call", parentId: "summary.single.character_card_ai_update", sort: 255 },

  { id: "summary.single.cover_image", label: "Single Call: Cover Image", kind: "summary", callGroup: "single_call", sort: 260 },
  { id: "single.cover_image.prompt", label: "prompt", kind: "detail", callGroup: "single_call", parentId: "summary.single.cover_image", sort: 261 },
  { id: "single.cover_image.style_prompt", label: "stylePrompt", kind: "detail", callGroup: "single_call", parentId: "summary.single.cover_image", sort: 262 },

  { id: "summary.single.scene_image", label: "Single Call: Scene Image", kind: "summary", callGroup: "single_call", sort: 270 },
  { id: "single.scene_image.prompt_or_messages", label: "prompt/recentMessages", kind: "detail", callGroup: "single_call", parentId: "summary.single.scene_image", sort: 271 },
  { id: "single.scene_image.characters_or_context", label: "characters/context", kind: "detail", callGroup: "single_call", parentId: "summary.single.scene_image", sort: 272 },

  { id: "summary.single.character_avatar", label: "Single Call: Character Avatar", kind: "summary", callGroup: "single_call", sort: 280 },
  { id: "single.character_avatar.avatar_prompt", label: "avatarPrompt", kind: "detail", callGroup: "single_call", parentId: "summary.single.character_avatar", sort: 281 },
  { id: "single.character_avatar.character_name", label: "characterName", kind: "detail", callGroup: "single_call", parentId: "summary.single.character_avatar", sort: 282 },
  { id: "single.character_avatar.model_id", label: "modelId", kind: "detail", callGroup: "single_call", parentId: "summary.single.character_avatar", sort: 283 },
];

function getSummaryHelpText(rowId: string): string {
  switch (rowId) {
    case "summary.call1.chat_payload":
      return "Triggered every time API Call 1 is assembled in llm.ts before the chat edge function is called (send, regenerate, continue).";
    case "summary.call2.character_updates":
      return "Triggered when post-turn character extraction invokes extract-character-updates in ChatInterfaceTab.";
    case "summary.call2.memory_extract":
      return "Triggered when memory extraction invokes extract-memory-events after an assistant reply.";
    case "summary.call2.goal_eval":
      return "Triggered when goal evaluation invokes evaluate-goal-progress for pending story-goal steps.";
    case "summary.call2.memory_compress":
      return "Triggered on day change when bullet memories are compressed via compress-day-memories.";
    case "summary.call2.side_character_profile":
      return "Triggered when a new side character profile is generated via generate-side-character.";
    case "summary.call2.side_character_avatar":
      return "Triggered when side-character avatar generation invokes generate-side-character-avatar.";
    case "summary.single.character_ai_fill":
      return "Triggered when the Character Builder AI Fill action runs.";
    case "summary.single.character_ai_generate":
      return "Triggered when the Character Builder AI Generate action runs.";
    case "summary.single.character_ai_enhance":
      return "Triggered when Character Builder AI Enhance (precise/detailed) runs for a field.";
    case "summary.single.world_ai_enhance":
      return "Triggered when Story Builder AI Enhance (precise/detailed) runs for a world field.";
    case "summary.single.character_card_ai_update":
      return "Triggered when chat Character Card modal AI Update (deep scan) invokes extract-character-updates.";
    case "summary.single.cover_image":
      return "Triggered when Cover Image modal calls generate-cover-image.";
    case "summary.single.scene_image":
      return "Triggered when scene-image generation runs (Story Builder scene modal or Chat interface scene image).";
    case "summary.single.character_avatar":
      return "Triggered when avatar generation runs (Avatar modal or Character Card modal regenerate avatar).";
    default:
      return "Triggered when this pipeline is invoked by its mapped API Inspector flow.";
  }
}

function getDetailHelpText(row: ApiUsageValidationRowSeed): string {
  if (!row.parentId) return "Required payload/key check for this validation row.";

  if (row.parentId === "summary.call1.chat_payload") {
    if (row.id === "call1.meta.system_instruction") return "Call 1 trigger: verifies the assembled system instruction exists and is message[0] with role=system.";
    if (row.id === "call1.meta.history_messages") return "Call 1 trigger: verifies recent conversation messages were serialized into the message array in correct order/roles.";
    if (row.id === "call1.meta.final_user_wrapper") return "Call 1 trigger: verifies the final wrapped user message exists and contains the current user input.";
    if (row.id.startsWith("call1.story.")) return "Call 1 trigger: evaluated only when this Story Builder field is authored. Passes when it appears in assembled WORLD CONTEXT/system instruction.";
    if (row.id.startsWith("call1.cast.")) return "Call 1 trigger: evaluated when relevant AI/User character data exists. Passes when that cast data is serialized into the Call 1 system instruction.";
  }

  if (row.parentId === "summary.call2.character_updates") {
    return `Character update trigger: required payload key \`${row.label}\` for extract-character-updates.`;
  }
  if (row.parentId === "summary.call2.memory_extract") {
    return `Memory extract trigger: required payload key \`${row.label}\` for extract-memory-events.`;
  }
  if (row.parentId === "summary.call2.goal_eval") {
    return `Goal evaluation trigger: required payload key \`${row.label}\` for evaluate-goal-progress.`;
  }
  if (row.parentId === "summary.call2.memory_compress") {
    return `Memory compression trigger: required payload key \`${row.label}\` for compress-day-memories.`;
  }
  if (row.parentId === "summary.call2.side_character_profile") {
    return `Side-character profile trigger: required payload key \`${row.label}\` for generate-side-character.`;
  }
  if (row.parentId === "summary.call2.side_character_avatar") {
    return `Side-character avatar trigger: required payload key \`${row.label}\` for generate-side-character-avatar.`;
  }

  if (row.parentId === "summary.single.character_ai_fill") {
    return `AI Fill trigger: required payload/context key \`${row.label}\` for character_ai_fill call.`;
  }
  if (row.parentId === "summary.single.character_ai_generate") {
    return `AI Generate trigger: required payload/context key \`${row.label}\` for character_ai_generate call.`;
  }
  if (row.parentId === "summary.single.character_ai_enhance") {
    return `Character AI Enhance trigger: required payload key \`${row.label}\` for field enhancement call.`;
  }
  if (row.parentId === "summary.single.world_ai_enhance") {
    return `Story/World AI Enhance trigger: required payload key \`${row.label}\` for world-field enhancement call.`;
  }
  if (row.parentId === "summary.single.character_card_ai_update") {
    return `Character Card AI Update trigger: required payload key \`${row.label}\` for deep-scan extract-character-updates call.`;
  }
  if (row.parentId === "summary.single.cover_image") {
    return `Cover image trigger: required payload key \`${row.label}\` for generate-cover-image call.`;
  }
  if (row.parentId === "summary.single.scene_image") {
    return `Scene image trigger: required payload key \`${row.label}\` for scene-image generation call.`;
  }
  if (row.parentId === "summary.single.character_avatar") {
    return `Character avatar trigger: required payload key \`${row.label}\` for avatar generation call.`;
  }

  return "Required payload/key check for this validation row.";
}

function buildValidationHelpText(row: ApiUsageValidationRowSeed): string {
  if (row.kind === "summary") return getSummaryHelpText(row.id);
  return getDetailHelpText(row);
}

export const API_USAGE_VALIDATION_ROWS: ApiUsageValidationRow[] = [...rows]
  .map((row) => ({ ...row, helpText: buildValidationHelpText(row) }))
  .sort((a, b) => a.sort - b.sort);

export const API_USAGE_VALIDATION_ROW_IDS = API_USAGE_VALIDATION_ROWS.map((row) => row.id);

export const API_USAGE_VALIDATION_ROW_BY_ID = Object.fromEntries(
  API_USAGE_VALIDATION_ROWS.map((row) => [row.id, row])
) as Record<string, ApiUsageValidationRow>;

export const API_USAGE_VALIDATION_PARENT_ROWS = API_USAGE_VALIDATION_ROWS.filter((row) => row.kind === "summary");

export const API_USAGE_VALIDATION_DETAIL_ROWS = API_USAGE_VALIDATION_ROWS.filter((row) => row.kind === "detail");

export function getValidationDetailRows(parentId: string): ApiUsageValidationRow[] {
  return API_USAGE_VALIDATION_DETAIL_ROWS.filter((row) => row.parentId === parentId);
}
