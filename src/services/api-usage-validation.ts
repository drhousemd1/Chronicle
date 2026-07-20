import { ScenarioData, Character, Conversation, SideCharacter } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { isApiUsageTestEnabledLocal } from "@/services/api-usage-test-session";
import {
  API_USAGE_VALIDATION_ROW_BY_ID,
  ApiUsageValidationCallGroup,
} from "@/data/api-usage-validation-registry";
import { selectCharacterPromptFactsForRendering } from '@/features/chat-runtime/roleplay-character-card-facts';
import type { RoleplaySourceReceipt, RoleplaySourceSurface } from '@/features/chat-runtime/roleplay-source-receipts';

export const API_USAGE_VALIDATION_TRACE_VERSION = 1;

export type ValidationPresence = boolean | null | undefined;

export type ValidationSnapshotInput = {
  eventKey: string;
  eventSource: string;
  apiCallGroup: ApiUsageValidationCallGroup;
  parentRowId: string;
  detailPresence: Record<string, ValidationPresence>;
  diagnostics?: Record<string, unknown>;
  includeParent?: boolean;
};

type Call1ValidationSourceReceipt = Pick<
  RoleplaySourceReceipt,
  'surface' | 'sourceId' | 'sourceRecordId' | 'modelFacing'
>;

function normalizeText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map((item) => normalizeText(item)).filter(Boolean).join(" ");
  return "";
}

function normalizedIncludes(haystack: string, needle: string): boolean {
  const h = normalizeText(haystack).toLowerCase().replace(/\s+/g, " ");
  const n = normalizeText(needle).toLowerCase().replace(/\s+/g, " ");
  if (!n) return false;
  return h.includes(n);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasCharacterCardHeading(systemInstruction: string, characterName: string): boolean {
  const name = normalizeText(characterName);
  if (!name) return false;
  return new RegExp(`^CHARACTER:\\s*${escapeRegExp(name)}\\s*$`, 'imu').test(systemInstruction);
}

function hasSectionObjectData(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const entries = Object.entries(value as Record<string, unknown>);
  for (const [key, raw] of entries) {
    if (key === "_extras") continue;
    if (normalizeText(raw)) return true;
  }
  const extras = (value as Record<string, unknown>)._extras;
  if (Array.isArray(extras)) {
    return extras.some((item) => normalizeText((item as any)?.label) || normalizeText((item as any)?.value));
  }
  return false;
}

type PlayableCharacter = Character | SideCharacter;

function hasCustomSectionData(character: PlayableCharacter): boolean {
  return Array.isArray(character.sections) && character.sections.some((section) => {
    if (normalizeText(section.freeformValue)) return true;
    return (section.items || []).some((item) => normalizeText(item.label) || normalizeText(item.value));
  });
}

function hasPersonalityData(character: PlayableCharacter): boolean {
  const personality = character.personality;
  if (!personality) return false;
  const standard = Array.isArray(personality.traits) && personality.traits.some((trait) => (
    typeof trait === "string"
      ? Boolean(normalizeText(trait))
      : Boolean(normalizeText(trait.label) || normalizeText(trait.value))
  ));
  const outward = "outwardTraits" in personality
    && Array.isArray(personality.outwardTraits)
    && personality.outwardTraits.some((trait) => normalizeText(trait.label) || normalizeText(trait.value));
  const inward = "inwardTraits" in personality
    && Array.isArray(personality.inwardTraits)
    && personality.inwardTraits.some((trait) => normalizeText(trait.label) || normalizeText(trait.value));
  return standard || outward || inward;
}

function hasGoalData(character: PlayableCharacter): boolean {
  return "goals" in character
    && Array.isArray(character.goals)
    && character.goals.some((goal) => normalizeText(goal.title) || normalizeText(goal.desiredOutcome));
}

function sampleFromCustomWorldSections(sections: any[] | undefined): string {
  if (!Array.isArray(sections)) return "";
  for (const section of sections) {
    const title = normalizeText(section?.title);
    if (title) return title;
    if (Array.isArray(section?.items)) {
      for (const item of section.items) {
        const value = normalizeText(item?.label) || normalizeText(item?.value);
        if (value) return value;
      }
    }
    const freeform = normalizeText(section?.freeformValue);
    if (freeform) return freeform;
  }
  return "";
}

function hasRequiredValue(value: unknown): boolean {
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "boolean") return true;
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object") return Object.keys(value as Record<string, unknown>).length > 0;
  return false;
}

export function buildRequiredPresence(entries: Array<[string, unknown]>): Record<string, ValidationPresence> {
  const map: Record<string, ValidationPresence> = {};
  for (const [rowId, value] of entries) {
    map[rowId] = hasRequiredValue(value);
  }
  return map;
}

export function buildCall1ValidationPresence(input: {
  appData: ScenarioData;
  conversation: Conversation;
  systemInstruction: string;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  expectedHistoryMessages?: Array<{ role: "user" | "assistant"; content: string }>;
  expectedFinalUserContent: string;
  sourceReceipts?: readonly Call1ValidationSourceReceipt[];
  transport?: {
    providerTransport?: string;
    store?: boolean;
    reasoningEffort?: string;
  };
}): Record<string, ValidationPresence> {
  const {
    appData,
    conversation,
    systemInstruction,
    messages,
    expectedHistoryMessages,
    expectedFinalUserContent,
    sourceReceipts,
    transport,
  } = input;
  const world = appData.world?.core;
  const authoredPlayableCharacters = [
    ...(appData.characters || []),
    ...(appData.sideCharacters || []),
  ];
  const selectedReceipts = sourceReceipts?.filter((receipt) => receipt.modelFacing) ?? null;
  const sourceWasSelected = (...sourceIds: string[]) => (
    selectedReceipts === null
    || selectedReceipts.some((receipt) => receipt.sourceId && sourceIds.includes(receipt.sourceId))
  );
  const characterSurface = (character: PlayableCharacter): RoleplaySourceSurface => {
    if (character.controlledBy === 'User') return 'user_character_cards';
    return character.characterRole === 'Main' ? 'main_character_cards' : 'side_character_cards';
  };
  const characterRecordId = (character: PlayableCharacter): string => {
    const slug = character.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return `${characterSurface(character)}:${slug}`;
  };
  const characterWasSelected = (character: PlayableCharacter): boolean => (
    selectedReceipts === null
    || selectedReceipts.some((receipt) => (
      receipt.surface === characterSurface(character)
      && (!receipt.sourceRecordId || receipt.sourceRecordId === characterRecordId(character))
    ))
  );
  const playableCharacters = authoredPlayableCharacters.filter(characterWasSelected);
  const aiCharacters = playableCharacters.filter((character) => character.controlledBy === "AI");
  const userControlledCharacters = playableCharacters.filter((character) => character.controlledBy === "User");

  const detail: Record<string, ValidationPresence> = {};
  const aiCharacterFacts = aiCharacters.flatMap(selectCharacterPromptFactsForRendering);
  const factsForPrefix = (prefix: string) => aiCharacterFacts.filter((fact) => (
    fact.sourceField === prefix || fact.sourceField.startsWith(`${prefix}.`)
  ));
  const modelFacingFactsPresent = (prefix: string) => {
    const facts = factsForPrefix(prefix).filter((fact) => fact.modelFacing);
    return facts.length > 0 && facts.every((fact) => normalizedIncludes(systemInstruction, fact.value));
  };

  detail["call1.meta.system_instruction"] = Boolean(normalizeText(systemInstruction)) && messages[0]?.role === "system";

  const expectedHistory = expectedHistoryMessages ?? conversation.messages.map((message) => ({
    role: message.role === 'assistant' ? 'assistant' as const : 'user' as const,
    content: message.text,
  }));
  if (expectedHistory.length > 0) {
    const historySlice = messages.slice(1, 1 + expectedHistory.length);
    const historyOk =
      historySlice.length === expectedHistory.length &&
      expectedHistory.every((expected, idx) => {
        const serialized = historySlice[idx];
        if (!serialized) return false;
        return serialized.role === expected.role && serialized.content === expected.content;
      });
    detail["call1.meta.history_messages"] = historyOk;
  }

  const finalMessage = messages[messages.length - 1];
  detail["call1.meta.final_user_wrapper"] =
    finalMessage?.role === "user" &&
    Boolean(normalizeText(expectedFinalUserContent)) &&
    normalizeText(finalMessage.content) === normalizeText(expectedFinalUserContent);

  if (transport) {
    detail["call1.transport.responses"] = transport.providerTransport === "responses";
    detail["call1.transport.store_false"] = transport.store === false;
    detail["call1.transport.reasoning_medium"] = transport.reasoningEffort === "medium";
  }

  if (normalizeText(world?.scenarioName) && sourceWasSelected('world-context')) {
    detail["call1.story.scenario_name"] =
      normalizedIncludes(systemInstruction, "STORY NAME:") &&
      normalizedIncludes(systemInstruction, world?.scenarioName || "");
  }

  if (normalizeText(world?.briefDescription) && sourceWasSelected('world-context')) {
    detail["call1.story.brief_description"] =
      normalizedIncludes(systemInstruction, "BRIEF DESCRIPTION:") &&
      normalizedIncludes(systemInstruction, world?.briefDescription || "");
  }

  if (normalizeText(world?.storyPremise) && sourceWasSelected('world-context')) {
    detail["call1.story.story_premise"] =
      normalizedIncludes(systemInstruction, "STORY PREMISE:") &&
      normalizedIncludes(systemInstruction, world?.storyPremise || "");
  }

  if (
    Array.isArray(world?.structuredLocations)
    && world.structuredLocations.length > 0
    && sourceWasSelected('locations')
  ) {
    const sampleLocation = world.structuredLocations.find((entry) => normalizeText(entry.label) || normalizeText(entry.description));
    detail["call1.story.structured_locations"] =
      normalizedIncludes(systemInstruction, "LOCATIONS:") &&
      (sampleLocation
        ? normalizedIncludes(systemInstruction, sampleLocation.label || sampleLocation.description || "")
        : true);
  }

  if (normalizeText(world?.dialogFormatting)) {
    detail["call1.story.dialog_formatting"] =
      normalizedIncludes(systemInstruction, "DIALOG FORMATTING") ||
      normalizedIncludes(systemInstruction, "STRICT FORMATTING RULES");
  }

  if (
    Array.isArray(world?.customWorldSections)
    && world.customWorldSections.length > 0
    && sourceWasSelected('custom-world-content')
  ) {
    const sample = sampleFromCustomWorldSections(world.customWorldSections);
    detail["call1.story.custom_world_sections"] =
      normalizedIncludes(systemInstruction, "CUSTOM WORLD CONTENT") &&
      (sample ? normalizedIncludes(systemInstruction, sample) : true);
  }

  if (
    Array.isArray(world?.storyGoals)
    && world.storyGoals.length > 0
    && sourceWasSelected('main-story-goals')
  ) {
    const goalSample = world.storyGoals.find((goal) => normalizeText(goal.title) || normalizeText(goal.desiredOutcome));
    detail["call1.story.story_goals"] =
      (
        normalizedIncludes(systemInstruction, "STORY GOALS") ||
        normalizedIncludes(systemInstruction, "STORY BACKGROUND CONTEXT:")
      ) &&
      (goalSample
        ? normalizedIncludes(systemInstruction, goalSample.title || goalSample.desiredOutcome || "")
        : true);
  }

  if (aiCharacters.length > 0) {
    detail["call1.cast.ai_characters"] =
      (
        normalizedIncludes(systemInstruction, "MAIN AI CHARACTER CARD INFORMATION") ||
        normalizedIncludes(systemInstruction, "SIDE AI CHARACTER CARD INFORMATION") ||
        normalizedIncludes(systemInstruction, "CAST:")
      ) &&
      aiCharacters.slice(0, 3).every((character) => hasCharacterCardHeading(systemInstruction, character.name));

    detail["call1.cast.character_basics"] =
      normalizedIncludes(systemInstruction, "CHARACTER:") &&
      normalizedIncludes(systemInstruction, "IDENTITY FACTS") &&
      normalizedIncludes(systemInstruction, "CONTROLLED BY:") &&
      normalizedIncludes(systemInstruction, "STORY ROLE:");
  }

  if (userControlledCharacters.length > 0) {
    detail["call1.cast.user_controlled_exclusions"] =
      normalizedIncludes(systemInstruction, "USER-CONTROLLED") &&
      userControlledCharacters.slice(0, 3).every((character) => hasCharacterCardHeading(systemInstruction, character.name));
  }

  if (aiCharacters.some((character) => hasSectionObjectData(character.physicalAppearance))) {
    detail["call1.cast.physical_appearance"] =
      normalizedIncludes(systemInstruction, "CREATOR REFERENCE FACTS") &&
      modelFacingFactsPresent('physicalAppearance');
  }

  if (aiCharacters.some((character) => hasSectionObjectData(character.currentlyWearing))) {
    const visibleClothing = aiCharacters.flatMap((character) => [
      normalizeText(character.currentlyWearing?.top),
      normalizeText(character.currentlyWearing?.bottom),
    ]).filter(Boolean);
    detail["call1.cast.currently_wearing"] =
      normalizedIncludes(systemInstruction, "VISIBLE CLOTHING:") &&
      visibleClothing.every((value) => normalizedIncludes(systemInstruction, value));
  }

  if (aiCharacters.some((character) => hasSectionObjectData(character.preferredClothing))) {
    detail["call1.cast.preferred_clothing"] = modelFacingFactsPresent('preferredClothing');
  }

  if (aiCharacters.some((character) => hasPersonalityData(character))) {
    detail["call1.cast.personality"] =
      normalizedIncludes(systemInstruction, "VOICE AND BEHAVIOR AFFORDANCES") &&
      modelFacingFactsPresent('personality');
  }

  if (aiCharacters.some((character) => "tone" in character && hasSectionObjectData(character.tone))) {
    detail["call1.cast.tone"] = modelFacingFactsPresent('tone');
  }

  if (aiCharacters.some((character) => hasSectionObjectData(character.background))) {
    detail["call1.cast.background"] = modelFacingFactsPresent('background');
  }

  if (aiCharacters.some((character) => "keyLifeEvents" in character && hasSectionObjectData(character.keyLifeEvents))) {
    detail["call1.cast.key_life_events"] = modelFacingFactsPresent('keyLifeEvents');
  }

  if (aiCharacters.some((character) => "relationships" in character && hasSectionObjectData(character.relationships))) {
    detail["call1.cast.relationships"] = modelFacingFactsPresent('relationships');
  }

  if (aiCharacters.some((character) => "secrets" in character && hasSectionObjectData(character.secrets))) {
    const secretFacts = factsForPrefix('secrets');
    detail["call1.cast.secrets"] = secretFacts.length > 0
      && secretFacts.every((fact) => !fact.modelFacing && !normalizedIncludes(systemInstruction, fact.value));
  }

  if (aiCharacters.some((character) => "fears" in character && hasSectionObjectData(character.fears))) {
    detail["call1.cast.fears"] = modelFacingFactsPresent('fears');
  }

  if (aiCharacters.some((character) => hasGoalData(character))) {
    detail["call1.cast.character_goals"] =
      normalizedIncludes(systemInstruction, "CHARACTER GOALS:") ||
      normalizedIncludes(systemInstruction, "GOALS AND DESIRES:") ||
      normalizedIncludes(systemInstruction, "ONGOING CHARACTER CONTEXT:") ||
      normalizedIncludes(systemInstruction, "CHARACTER GOAL:");
  }

  if (aiCharacters.some((character) => hasCustomSectionData(character))) {
    detail["call1.cast.custom_sections"] = modelFacingFactsPresent('sections');
  }

  return detail;
}

function buildSnapshotLists(input: ValidationSnapshotInput): {
  expectedIds: string[];
  sentIds: string[];
  missingIds: string[];
} {
  const expectedIds: string[] = [];
  const sentIds: string[] = [];
  const missingIds: string[] = [];

  const detailEntries = Object.entries(input.detailPresence || {}).filter(([rowId, value]) => {
    if (!API_USAGE_VALIDATION_ROW_BY_ID[rowId]) return false;
    return value !== null && value !== undefined;
  });

  for (const [rowId, value] of detailEntries) {
    expectedIds.push(rowId);
    if (value === true) sentIds.push(rowId);
    else missingIds.push(rowId);
  }

  if (input.includeParent !== false && API_USAGE_VALIDATION_ROW_BY_ID[input.parentRowId]) {
    expectedIds.push(input.parentRowId);
    if (missingIds.length > 0) missingIds.push(input.parentRowId);
    else sentIds.push(input.parentRowId);
  }

  return {
    expectedIds: Array.from(new Set(expectedIds)),
    sentIds: Array.from(new Set(sentIds)),
    missingIds: Array.from(new Set(missingIds)),
  };
}

export async function trackApiValidationSnapshot(input: ValidationSnapshotInput): Promise<void> {
  if (!isApiUsageTestEnabledLocal()) return;

  const payload = buildSnapshotLists(input);

  try {
    const { error } = await supabase.functions.invoke("track-api-usage-test", {
      body: {
        eventKey: input.eventKey,
        apiCallGroup: input.apiCallGroup,
        eventSource: input.eventSource,
        status: payload.missingIds.length > 0 ? "fail" : "ok",
        metadata: {
          validationSnapshot: true,
          traceVersion: API_USAGE_VALIDATION_TRACE_VERSION,
          parentRowId: input.parentRowId,
          expectedIds: payload.expectedIds,
          sentIds: payload.sentIds,
          missingIds: payload.missingIds,
          diagnostics: input.diagnostics || {},
        },
      },
    });

    if (error) {
      console.error("[api-usage-validation] Failed to record validation snapshot:", error);
    }
  } catch (error) {
    console.error("[api-usage-validation] Unexpected snapshot tracking error:", error);
  }
}
