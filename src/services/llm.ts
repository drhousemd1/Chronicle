import { ScenarioData, Character, World, TimeOfDay, Memory, Scene, type Message } from "../types";
import { supabase } from "@/integrations/supabase/client";
import { buildContentThemeDirectives } from "@/constants/tag-injection-registry";
import { trackAiUsageEvent } from "@/services/usage-tracking";
import {
  buildCall1ValidationPresence,
  trackApiValidationSnapshot,
} from "@/services/api-usage-validation";
import {
  describeGoalAlignmentForPrompt,
  shouldRenderGoalToWriter,
} from "@/lib/goal-alignment";
import type { ChatDebugRequestRecord, ChatDebugTrace } from "@/features/chat-debug/types";

/**
 * Detect if a user message contains dialogue/actions written for AI-controlled characters.
 * Returns an established-fact prefix if detected, empty string otherwise.
 * Used by send, regenerate, and continue flows to prevent re-narration.
 */
export class ContentFilteredChatError extends Error {
  constructor(message = CONTENT_FILTER_NOTICE_TEXT) {
    super(message);
    this.name = 'ContentFilteredChatError';
  }
}

export const CONTENT_FILTER_NOTICE_TEXT = 'Chronicle: The model provider blocked this turn. This can happen because of your latest message or because the previous AI response is included in the request. Try editing the last user or AI message, then send again.';

export function isLocalRoleplayNoticeMessage(message: Pick<Message, 'text' | 'localNotice'>): boolean {
  return message.localNotice === 'content_filter' || message.text.startsWith('Chronicle: The model provider blocked this turn.');
}

export function buildCanonNote(
  userText: string,
  characters: Array<{ name: string; controlledBy?: string }>,
): string {
  const aiCharNames = characters.filter(c => c.controlledBy === 'AI').map(c => c.name);
  const hasCanonContent = aiCharNames.some(name => {
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const taggedBlock = new RegExp(`(?:^|\\n)\\s*${escapedName}\\s*:`, 'i');
    const authoredAction = new RegExp(
      `\\b${escapedName}\\b\\s+(?:\\w+\\s+){0,4}(?:sat|stood|leaned|looked|turned|moved|walked|ran|reached|touched|pulled|pushed|grabbed|held|placed|lowered|raised|pressed|kissed|wrapped|guided|led|opened|closed|entered|left|began|started|continued)\\b`,
      'i',
    );
    return taggedBlock.test(userText) || authoredAction.test(userText);
  });
  return hasCanonContent
    ? '[ESTABLISHED FACT NOTE: User wrote content for AI character(s) in this message. That content is already true in the scene -- do not re-narrate it. Continue the story from after those events.] '
    : '';
}

const TIME_DESCRIPTIONS: Record<TimeOfDay, string> = {
  sunrise: "early morning (sunrise, around 6-10am)",
  day: "daytime (mid-morning to afternoon, around 10am-5pm)",
  sunset: "evening (sunset, around 5-9pm)",
  night: "nighttime (after dark, around 9pm-6am)"
};

export const REGENERATION_DIRECTIVE_TEXT = `[REGENERATION REQUEST]
The user wants a different version of the previous assistant response. Keep the same established facts, current physical state, present characters, character awareness, user-control boundaries, and broad emotional direction.
Change the execution rather than the situation: use a meaningfully different mix of dialogue, action, sensory detail, and pacing that still follows the current scene.
Do not replay the same exchange with synonym swaps, invert character stance, add off-screen characters, jump time, invent physical facts, or author the user-controlled character's response.
If a present AI-controlled character was directly asked something they can answer now, address it in this version.`;

export const EXECUTION_BRIEF_TEXT = `[EXECUTION BRIEF]
Continue from the latest visible scene change.
Preserve user-written facts, character awareness, and the current physical state.
Recent messages provide story state and continuity, not a template for response length. Follow the active Response Detail setting even if recent messages were short.
If a present AI-controlled character can naturally speak, use clear external dialogue.
Every spoken line must have a clear conversational purpose instead of vague tension, filler, or circular wording.
Develop the AI-controlled character's side of the current exchange enough that it feels complete under the active Response Detail setting. Direct contact is allowed when the scene supports it.
Stop before narrating any user-owned response, decision, voluntary follow-up, or interpretation.`;

export function renderResponseDetailInstruction(responseVerbosity: string = 'balanced'): string {
  if (responseVerbosity === 'concise') {
    return `RESPONSE DETAIL: Concise\n- Keep the overall response tight and direct. Prioritize clear actions, external dialogue, or internal thoughts.\n- Use sensory, emotional, or environmental descriptions at key points to emphasize importance, but otherwise keep back-and-forth dialogue within the same scene more concise. Focus descriptive detail on moments when something new or important is happening.\n- Follow-up responses between AI characters can be simple one-sentence responses.`;
  }
  if (responseVerbosity === 'detailed') {
    return `RESPONSE DETAIL: Detailed\n- Write rich, immersive responses with lengthy sensory, emotional, and environmental description where that detail adds new information, consequence, tension, or character meaning.\n- Do not concentrate most of the detail in one opening narration section while leaving external dialogue short or underdeveloped. External dialogue should be substantial when characters are able to speak, carrying emotion, conflict, decisions, questions, reassurance, resistance, escalation, or relationship tension.\n- Description should support what is currently changing or being interacted with. Do not repeat already-established body, clothing, room, weather, or object details unless those details have changed, are being directly interacted with, or create a new consequence.\n- Build out the AI-controlled character's action and dialogue fully before stopping for the user. Stopping before the user response does not mean cutting the AI character's action, dialogue, or sensory description short.\n- Some character responses may be longer than others, but the response should still feel like active roleplay rather than a descriptive summary.`;
  }
  return `RESPONSE DETAIL: Balanced\n- Use a natural balance of scene description, character voice, action, external dialogue, and internal thought.\n- Responses should include some sensory, emotional, or environmental descriptions, but should remain more concise with a focus on external dialogue, actions, or internal thoughts.\n- Follow-up responses between AI characters can be more concise if additional descriptive details would not add new context to the situation or would only repeat details already established in another text block.`;
}

export type GenerateRoleplayResponseStreamOptions = {
  debugTrace?: boolean;
  onDebugTrace?: (trace: ChatDebugTrace) => void;
  onRequestPayload?: (request: ChatDebugRequestRecord) => void;
};

const CHAT_RESPONSE_TIMEOUT_MS = 90_000;
const API_CALL_1_TOTAL_MESSAGE_WINDOW = 10;
const API_CALL_1_HISTORY_MESSAGE_LIMIT = API_CALL_1_TOTAL_MESSAGE_WINDOW - 1;

export function buildCurrentSceneSnapshotForPrompt(
  historyMessages: Array<Pick<Message, 'role' | 'text'>>,
): string {
  const lastAssistant = [...historyMessages].reverse().find((message) => message.role === 'assistant' && message.text?.trim());
  if (!lastAssistant?.text) return '';

  return `[CURRENT SCENE SNAPSHOT]
The previous assistant response is already in the conversation history. Use it only to preserve story state; do not copy its opening structure or continue from it unless the final instruction below says to continue.`;
}

function ensurePromptSentence(value: unknown): string {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (!trimmed) return '';
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

export function renderGoalMilestoneTarget(description: string): string {
  let target = (description || '').trim();
  if (!target) return '';

  target = target.replace(/\s+/g, ' ').trim();
  return ensurePromptSentence(target);
}

export function getSystemInstruction(
  appData: ScenarioData,
  currentDay?: number,
  currentTimeOfDay?: TimeOfDay,
  memories?: Memory[],
  memoriesEnabled?: boolean,
  activeScene?: Scene | null
): string {
  const text = (value: unknown): string => {
    if (typeof value === 'string') return value.trim();
    if (Array.isArray(value)) {
      return value
        .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
        .filter(Boolean)
        .join(', ');
    }
    return '';
  };

  const titleCase = (key: string): string =>
    key
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, c => c.toUpperCase());

  const clean = (value: string): string => value.replace(/\n{3,}/g, '\n\n').trim();

  const section = (heading: string, body: string): string => {
    const trimmed = clean(body);
    if (!trimmed) return '';
    return `--- ${heading} ---\n\n${trimmed}`;
  };

  const bullet = (label: string, value: unknown): string => {
    const normalized = text(value);
    return normalized ? `- ${label}: ${normalized}` : '';
  };

  const toLabeledPairs = (
    source: Record<string, unknown> | undefined,
    opts?: { extrasKey?: string; fallbackLabel?: string }
  ): Array<{ label: string; value: string }> => {
    if (!source || typeof source !== 'object') return [];
    const extrasKey = opts?.extrasKey ?? '_extras';
    const fallbackLabel = opts?.fallbackLabel ?? 'Details';
    const pairs: Array<{ label: string; value: string }> = [];

    for (const [key, raw] of Object.entries(source)) {
      if (key === extrasKey) continue;
      const value = text(raw);
      if (!value) continue;
      pairs.push({ label: titleCase(key), value });
    }

    const extrasRaw = (source as any)[extrasKey];
    if (Array.isArray(extrasRaw)) {
      for (const entry of extrasRaw) {
        const label = text(entry?.label) || fallbackLabel;
        const value = text(entry?.value);
        if (!value) continue;
        pairs.push({ label, value });
      }
    }

    return pairs;
  };

  const normalizeCustomSectionItems = (customSection: any): Array<{ label: string; value: string }> => {
    const sectionTitle = text(customSection?.title);
    const rawItems = Array.isArray(customSection?.items) ? customSection.items : [];
    const items = rawItems
      .map((item: any) => ({ label: text(item?.label), value: text(item?.value) }))
      .filter((item: any) => item.label || item.value)
      .map((item: any) => ({
        label: item.label || (sectionTitle ? `${sectionTitle} Details` : 'Details'),
        value: item.value || item.label
      }));

    if (items.length > 0) return items;

    const freeform = text(customSection?.freeformValue);
    if (freeform) {
      return [{
        label: sectionTitle ? `${sectionTitle} Notes` : 'Details',
        value: freeform
      }];
    }

    return [];
  };

  const renderRows = (rows: Array<{ label: string; value: string }>): string =>
    rows.map((row) => `- ${row.label}: ${row.value}`).join('\n');

  const renderFieldBlock = (heading: string, rows: Array<{ label: string; value: string }>): string => {
    if (!rows.length) return '';
    return `${heading}\n${renderRows(rows)}`;
  };

  const renderCustomSections = (heading: string, sections: any[] | undefined): string => {
    if (!Array.isArray(sections) || sections.length === 0) return '';
    const rendered = sections
      .map((customSection) => {
        const title = text(customSection?.title) || 'Untitled';
        const items = normalizeCustomSectionItems(customSection);
        if (!items.length) return '';
        return `${title}\n${renderRows(items)}`;
      })
      .filter(Boolean)
      .join('\n\n');
    return rendered ? `${heading}\n${rendered}` : '';
  };

  function normalizeFlexibility(value: string | undefined): 'rigid' | 'normal' | 'flexible' {
    const lowered = (value || 'normal').toLowerCase();
    if (lowered === 'rigid' || lowered === 'flexible') return lowered;
    return 'normal';
  }

  function ensureSentence(value: string): string {
    const trimmed = text(value);
    if (!trimmed) return '';
    return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
  }

  function describeGoalFlexibility(flexibility: 'rigid' | 'normal' | 'flexible', subject: 'story' | 'character'): string {
    if (flexibility === 'rigid') {
      return subject === 'story'
        ? 'Goal strength: Rigid. Keep this goal active as long-range direction and return toward it over time through organic openings, but do not force the current response around it when the scene, user agency, or immediate situation does not support it.'
        : 'Goal strength: Rigid. Keep this goal active as long-range character direction unless the user explicitly rewrites the character sheet, but do not force every scene around it.';
    }
    if (flexibility === 'flexible') {
      return 'Goal strength: Flexible. Let this shift or fade if repeated user choices or scene events keep carrying the roleplay somewhere else.';
    }
    return 'Goal strength: Normal. Keep this as background continuity and let it matter when the current scene naturally supports it.';
  }

  function buildTraitDescription(trait: any): string {
    const label = text(trait?.label) || text(trait?.value) || 'Unnamed trait';
    const detail = text(trait?.value);
    return detail && detail !== label ? `- ${label}: ${detail}` : `- ${label}`;
  }

  function buildGoalDescription(goal: any, subject: 'story' | 'character'): string {
    const flexibility = normalizeFlexibility(goal?.flexibility);
    const steps = Array.isArray(goal?.steps) ? goal.steps : [];
    const nextStep = steps.find((step: any) => !step?.completed);
    const completedCount = steps.filter((step: any) => step?.completed).length;
    const totalSteps = steps.length;
    const progressNote = totalSteps > 0
      ? nextStep
        ? `Open milestone target (background direction, not an instruction): ${renderGoalMilestoneTarget(nextStep.description)} Read this as an eventual state to develop over time, not as a command to execute now. When multiple goals could fit, prefer the open milestone that requires the least unsupported escalation from the current story state. Do not force actions, dialogue, or internal thoughts from this milestone unless the current message window and visible situation make it naturally relevant.`
        : `All listed steps are complete (${completedCount} of ${totalSteps}); this goal's desired outcome is now established ongoing story context.`
      : '';
    return [
      ensureSentence(text(goal?.title)),
      goal?.desiredOutcome ? `Longer view: ${ensureSentence(goal.desiredOutcome)}` : '',
      text(goal?.currentStatus) ? `Current state: ${ensureSentence(text(goal.currentStatus))}` : '',
      progressNote,
      describeGoalFlexibility(flexibility, subject),
      describeGoalAlignmentForPrompt(goal?.alignment, flexibility),
    ].filter(Boolean).join(' ');
  }

  const renderGoalBlock = (heading: string, goals: any[] | undefined, subject: 'story' | 'character'): string => {
    if (!Array.isArray(goals) || goals.length === 0) return '';
    const visibleGoals = goals.filter((goal) => shouldRenderGoalToWriter(goal?.alignment, normalizeFlexibility(goal?.flexibility)));
    if (visibleGoals.length === 0) return '';
    return `${heading}\n${visibleGoals.map((goal) => `${subject === 'story' ? 'STORY' : 'CHARACTER'} GOAL: ${text(goal?.title) || 'Untitled'}\n- ${buildGoalDescription(goal, subject)}`).join('\n\n')}`;
  };

  const renderPersonalityBlock = (character: any): string => {
    const p = character?.personality;
    if (!p || typeof p !== 'object') return '';

    if (p.splitMode) {
      const outward = (p.outwardTraits || [])
        .filter((trait: any) => text(trait?.label) || text(trait?.value))
        .map((trait: any) => buildTraitDescription(trait))
        .join('\n');
      const inward = (p.inwardTraits || [])
        .filter((trait: any) => text(trait?.label) || text(trait?.value))
        .map((trait: any) => buildTraitDescription(trait))
        .join('\n');
      return [
        outward ? `${text(character?.name) || 'CHARACTER'} PERSONALITY\nOUTWARD PERSONALITY\n${outward}` : '',
        inward ? `INWARD PERSONALITY\n${inward}` : '',
      ].filter(Boolean).join('\n\n');
    }

    if (Array.isArray(p.traits)) {
      const structuredTraits = p.traits
        .filter((trait: any) => text(trait?.label) || text(trait?.value))
        .map((trait: any) => typeof trait === 'string' ? `- ${trait}` : buildTraitDescription(trait))
        .join('\n');
      if (structuredTraits) return `${text(character?.name) || 'CHARACTER'} PERSONALITY\n${structuredTraits}`;
    }

    const fallbackRows = Object.entries(p)
      .map(([key, raw]) => ({ label: titleCase(key), value: text(raw) }))
      .filter((row) => row.value);
    return fallbackRows.length ? `${text(character?.name) || 'CHARACTER'} PERSONALITY\n${renderRows(fallbackRows)}` : '';
  };

  const renderCharacterCard = (character: any): string => {
    const name = text(character?.name) || 'Unnamed';
    const role = text(character?.characterRole) || 'Unknown';
    const roleLabel = role.toLowerCase() === 'main' ? 'Main character in story' : role.toLowerCase() === 'side' ? 'Side character in story' : role;
    const basics = [
      bullet('SEX / TYPE', character?.sexType),
      bullet('AGE', character?.age),
      bullet('NICKNAMES', character?.nicknames),
      bullet('SEXUAL ORIENTATION', character?.sexualOrientation),
      `- ROLE: ${roleLabel}`,
      `- CONTROLLED BY: ${text(character?.controlledBy) || 'Unknown'}`,
      bullet('ROLE DESCRIPTION', character?.roleDescription),
      bullet('LOCATION', character?.location),
      bullet('SCENE POSITION', character?.scenePosition),
      bullet('MOOD', character?.currentMood),
      bullet('TAGS', character?.tags),
    ].filter(Boolean).join('\n');

    return [
      `CHARACTER: ${name}`,
      `CHARACTER BASICS\n${basics}`,
      renderFieldBlock(`${name} PHYSICAL APPEARANCE`, toLabeledPairs(character?.physicalAppearance)),
      renderFieldBlock(`${name} CURRENTLY WEARING`, toLabeledPairs(character?.currentlyWearing)),
      renderFieldBlock(`${name} PREFERRED CLOTHING`, toLabeledPairs(character?.preferredClothing)),
      renderPersonalityBlock(character),
      renderFieldBlock(`${name} TONE`, toLabeledPairs(character?.tone)),
      renderFieldBlock(`${name} BACKGROUND`, toLabeledPairs(character?.background)),
      renderFieldBlock(`${name} KEY LIFE EVENTS`, toLabeledPairs(character?.keyLifeEvents)),
      renderFieldBlock(`${name} RELATIONSHIPS`, toLabeledPairs(character?.relationships)),
      renderFieldBlock(`${name} SECRETS`, toLabeledPairs(character?.secrets)),
      renderFieldBlock(`${name} FEARS`, toLabeledPairs(character?.fears)),
      renderGoalBlock(`${name} GOALS`, character?.goals, 'character'),
      renderCustomSections(`${name} CUSTOM CONTENT`, character?.sections),
    ].filter(Boolean).join('\n\n');
  };

  const renderLocations = (): string => {
    const locations = appData.world.core.structuredLocations || [];
    const rendered = locations
      .filter((location) => text(location?.label) || text(location?.description))
      .map((location) => `- ${text(location.label) || 'Location'}: ${text(location.description) || 'No description provided.'}`)
      .join('\n');
    return rendered || '- Not specified';
  };

  const renderCustomWorldContent = (): string => {
    const sections = appData.world.core.customWorldSections || [];
    if (!sections.length) return '';
    return sections
      .map((customSection) => {
        const title = text(customSection?.title) || 'Untitled';
        const items = normalizeCustomSectionItems(customSection);
        if (!items.length) return '';
        return `${title}\n${renderRows(items)}`;
      })
      .filter(Boolean)
      .join('\n\n');
  };

  const renderAdditionalLore = (): string => {
    const entries = appData.world.entries || [];
    if (!entries.length) return '';
    return entries
      .filter((entry) => text(entry?.title) || text(entry?.body))
      .map((entry) => `${text(entry.title) || 'Untitled'}\n${text(entry.body)}`)
      .join('\n\n');
  };

  const allPlayableCharacters = [...(appData.characters || []), ...(appData.sideCharacters || [])];
  const aiCharacters = allPlayableCharacters.filter((character) => character.controlledBy === 'AI');
  const userCharacters = allPlayableCharacters.filter((character) => character.controlledBy === 'User');
  const mainAiCharacters = aiCharacters.filter((character) => character.characterRole === 'Main');
  const sideAiCharacters = aiCharacters.filter((character) => character.characterRole !== 'Main');
  const userCharacterNames = userCharacters.map((character) => character.name).filter(Boolean);

  const renderCharacterList = (characters: any[]): string => characters.map(renderCharacterCard).join('\n\n');

  const renderSceneStateLine = (character: any): string => {
    const name = text(character?.name);
    if (!name) return '';
    const control = text(character?.controlledBy);
    const role = text(character?.characterRole);
    const location = text(character?.location);
    const scenePosition = text(character?.scenePosition);
    const mood = text(character?.currentMood);
    const parts = [
      `${name}${control ? ` is ${control.toLowerCase()}-controlled` : ''}${role ? ` and serves as a ${role.toLowerCase()} character` : ''}.`,
      scenePosition ? `Exact position: ${ensureSentence(scenePosition)}` : '',
      location ? `Broad location: ${ensureSentence(location)}` : '',
      mood ? `Current mood: ${ensureSentence(mood)}` : '',
    ].filter(Boolean);
    return `- ${parts.join(' ')}`;
  };

  const renderCurrentSceneState = (): string => {
    const rows = allPlayableCharacters.map(renderSceneStateLine).filter(Boolean).join('\n');
    return rows ? `--- CURRENT PHYSICAL SCENE STATE ---\n\n${rows}` : '';
  };

  const sceneTags = appData.scenes.flatMap((scene) => scene.tags ?? []).filter(Boolean).join(', ');
  const activeSceneTag = activeScene?.tags?.find((tag) => text(tag)) || '';

  const renderActiveSceneContext = (): string => {
    const availableScenes = sceneTags ? `- Available Scenes: [${sceneTags}]` : '- Available Scenes: []';
    if (!activeScene) return `--- ACTIVE SCENE CONTEXT ---\n\n${availableScenes}`;
    return `--- ACTIVE SCENE CONTEXT ---\n\n${[
      `- Scene Title: ${text(activeScene.title) || 'Untitled Scene'}`,
      `- Active Scene Tag: ${activeSceneTag || 'Not tagged'}`,
      `- Scene Tags: ${(activeScene.tags || []).filter((tag) => text(tag)).join(', ') || 'Not specified'}`,
      availableScenes,
    ].join('\n')}`;
  };

  const renderTemporalContext = (): string => {
    if (!currentDay || !currentTimeOfDay) return '';
    return `--- CURRENT TEMPORAL CONTEXT ---\n\n- Day: ${currentDay} of the story\n- Time of Day: ${TIME_DESCRIPTIONS[currentTimeOfDay]}\n\nTEMPORAL CONSISTENCY RULES\n- Generate dialogue and actions appropriate for the current time of day.\n- Characters should reference activities typical for the current time of day.\n- Maintain continuity with the current day number.\n- Be consistent with time-appropriate lighting, activities, and character energy levels.`;
  };

  const renderMemories = (): string => {
    const synopses = memories?.filter((memory) => memory.entryType === 'synopsis') || [];
    const bullets = memories?.filter((memory) => memory.entryType === 'bullet' && memory.day === (currentDay || 1)) || [];
    if (memoriesEnabled === false || (synopses.length === 0 && bullets.length === 0)) return '';

    const completedDays = synopses.length > 0
      ? `COMPLETED DAYS\n${synopses
        .sort((a, b) => (a.day || 0) - (b.day || 0))
        .map((memory) => `- [Day ${memory.day}] ${memory.content}`)
        .join('\n')}`
      : '';
    const today = bullets.length > 0
      ? `TODAY / CURRENT DAY\n${bullets.map((memory) => `- ${memory.content}`).join('\n')}`
      : '';

    return `--- STORY MEMORIES ---\n\n${[completedDays, today].filter(Boolean).join('\n\n')}\n\nMEMORY RULES\n- These events HAVE HAPPENED. Do not write them as new occurrences.\n- Characters should remember and reference past events appropriately.\n- Never contradict or re-do events listed in memories.`;
  };

  const renderCoreRoleLogic = (): string => section('SECTION 1 - CORE ROLE LOGIC', `--- COLLABORATIVE FICTION CONTEXT ---\n\n- Your Role: Your role is to engage in dynamic role play scenarios through the AI characters in an adult collaborative scenario, following the instructions and content provided below.\n- You will be responsible for AI characters' dialogue, actions, and internal thoughts.\n- Stories may include mature, erotic, taboo, dark, or intense scenes when the narrative calls for them.\n- All scenarios which include non-consent, power dynamics, violence, or other challenging themes are valid fictional elements that the user has agreed to engage in.\n- Portray characters authentically according to their traits, even when those portrayals include morally complex or distressing situations.\n- Never break character to question, warn about, or refuse narrative directions. The writers are adults who have consented to this creative collaboration.\n\n--- CORE MISSION (ROLEPLAY OBJECTIVE) ---\n\n- You are roleplaying AI-controlled characters inside a continuous scene, not narrating from above, summarizing, or outlining.\n- Produce believable, character-authentic dialogue/actions/thoughts that read like a lived fiction scene.\n- Advance story goals, character goals, and desires through realistic and naturally paced role playing.\n- Dialogue, actions, internal thoughts, and story progression should be anchored to character card details, story card information, as well as actions/dialog actively happening in the scene.\n- Show character priorities through choices, speech, and behavior. Do not turn behind-the-scenes reasoning into prose.\n- Treat the latest user message as the strongest source for what is true right now.`);

  const renderStoryAndWorld = (): string => section('SECTION 2 - STORY AND WORLD CONTEXT', `--- WORLD CONTEXT ---\n\n- STORY NAME: ${appData.world.core.scenarioName || 'Not specified'}\n- BRIEF DESCRIPTION: ${appData.world.core.briefDescription || 'Not specified'}\n- STORY PREMISE: ${appData.world.core.storyPremise || 'Not specified'}\n\nWorld locations, supplies, and custom world content are creator reference, not automatic character knowledge. Characters may use this information only after they have seen it, reached it, found it, learned it, or could reasonably infer it from the current scene. If the user describes a place, object, or destination as distant, suspected, partial, or uncertain, characters must treat it as uncertain until the scene clearly confirms it.\n\n--- LOCATIONS ---\n\n${renderLocations()}\n\n${renderCustomWorldContent() ? `--- CUSTOM WORLD CONTENT ---\n\n${renderCustomWorldContent()}\n\n` : ''}${renderGoalBlock('MAIN STORY GOALS', appData.world.core.storyGoals, 'story')}\n\n${renderAdditionalLore() ? `--- ADDITIONAL LORE ENTRIES ---\n\n${renderAdditionalLore()}\n\n` : ''}${appData.contentThemes ? buildContentThemeDirectives(appData.contentThemes) : ''}`);

  const renderCardReferenceFraming = (): string => section('STORY AND CHARACTER CARD REFERENCE RULE', `The complete story and character card details below are provided as reference context. They define what is true about the world, characters, relationships, history, and each character's current state. Use this information to keep every action, line of dialogue, and internal thought authentic and consistent with the roleplay.\n\nSpecific card details may appear when they matter to what is happening, but do not keep restating an established detail with the same wording or the same descriptive focus. If a detail remains relevant after it has already been shown, write the new action, contact, reaction, decision, or consequence it creates instead of repeating the detail itself.`);

  const renderMainAiCharacters = (): string => section('SECTION 3 - MAIN AI CHARACTER CARD INFORMATION', `Main character should be the focal point of the story's role-playing.\n\n${renderCharacterList(mainAiCharacters)}`);

  const renderSideAiCharacters = (): string => {
    if (sideAiCharacters.length === 0) return '';
    return section('SECTION 4 - SIDE AI CHARACTER CARD INFORMATION', `Side characters, while important, do take somewhat of a back seat to the main characters, appearing only when appropriate to further the story along and provide meaningful interaction. They may come and go throughout the story, whereas main characters remain more persistent as the story evolves.\n\n${renderCharacterList(sideAiCharacters)}`);
  };

  const renderUserCharacters = (): string => {
    if (userCharacters.length === 0) return '';
    return section('SECTION 5 - USER-CONTROLLED CHARACTER CARD INFORMATION', `${userCharacterNames.length ? `USER-CONTROLLED CHARACTERS DO NOT GENERATE FOR\n${userCharacterNames.map((name) => `- ${name}`).join('\n')}\n\n` : ''}${renderCharacterList(userCharacters)}`);
  };

  const renderMemoryAndSceneState = (): string => section('SECTION 6 - STORY MEMORIES AND CURRENT SCENE STATE', [
    renderMemories(),
    renderCurrentSceneState(),
    renderActiveSceneContext(),
    renderTemporalContext(),
  ].filter(Boolean).join('\n\n'));

  const renderDialogRules = (): string => section('SECTION 7 - DIALOG FORMATTING AND ROLEPLAY RULES', `--- DIALOG FORMATTING RULES ---

These rules are critical for Chronicle to display character blocks, dialogue, avatars, and UI correctly.

- Every AI-written character block must begin with that character's exact card NAME followed by a colon.
- For any character that already exists in character cards, always use that card's exact NAME field as the speaker tag.
- Do not expand, shorten, rename, or alter known character names. This breaks character block detection.
- Only use alternate names when they are explicitly listed in that character's nicknames.
- Do not write untagged paragraphs or bare prose outside a character block.
- Do not write actions, dialogue, or internal thoughts for one character inside another character's block when that content belongs to the other character.
- Within a character block, use * * for visible action or narration, " " for spoken dialogue, and ( ) for private internal thought. These are formatting tools, not required ingredients.
- Use only the elements the moment genuinely needs. A block may contain multiple actions, multiple dialogue lines, or multiple internal thoughts, and those elements may alternate in the order that best fits the scene.
- Do not default to action -> dialogue -> internal thought, and do not include all three elements in every block unless the scene actually calls for all three.
- Vary the presence, order, and emphasis of action, dialogue, and thought across your own recent assistant outputs. Compare against your own previous 2-3 assistant character blocks, not the user's message, and break any repeating cadence when the scene allows it.
- A character block should follow one clear conversational thread. Multiple actions, spoken lines, or thoughts can appear in the same block, but they should connect to each other instead of reading like separate response attempts stitched together.
- When at least one present AI-controlled character is conscious and able to speak, the response should include external dialogue. Do not answer spoken user dialogue with narration only unless the character is physically unable to speak or is intentionally refusing to answer.
- External dialogue must have a clear conversational purpose in the current exchange. It should give the listener something understandable to respond to, resist, accept, clarify, or act on.
- If a spoken line sounds vague, circular, or semantically unclear, rewrite it before output.

Required speaker tag rule:
Start each character block with CharacterName: using the exact card name. After the colon, write natural prose using the marker rules above; the first marked element may be dialogue, action, or thought when that is what the current exchange needs.

${appData.world.core.dialogFormatting ? `--- USER-DEFINED DIALOG FORMATTING FROM STORY BUILDER ---

${appData.world.core.dialogFormatting}

` : ''}--- USER CONTROL AND ESTABLISHED FACTS ---

User control is about authorship, not contact. AI-controlled characters may create AI-owned actions that externally affect a user-controlled character when the current scene supports it.

Do not author the user character's response to that change. The user character owns their speech, private thoughts, choices, voluntary follow-up, emotional interpretation, compliance, resistance, and next action.

Continue from the user's last established facts without re-describing, paraphrasing, or expanding what the user already wrote. If the user writes dialogue, action, or thought for an AI-controlled character, treat it as already occurred exactly as written.

When the next meaningful moment depends on the user character's response, stop with the scene still active rather than resolving their response for them.

--- PRIVATE USER THOUGHT BOUNDARY ---

- User text in parentheses represents private internal thoughts that AI characters cannot perceive.
- AI characters may react only to spoken dialogue, visible actions, and observable body language explicitly described by the user.
- Do not repeat, quote, or mirror distinctive words from the user's private thoughts.
- If the user writes a private thought, react only to visible emotional cues the user also gave on the page.

--- NATURAL ROLEPLAY AND SCENE PROGRESSION ---

- AI characters drive their own goals through dialogue, action, and internal thought. They speak, act, and think on their own initiative without needing the user to script their lines, behavior, or inner life.
- If the user has already answered, agreed, refused, consented, or confirmed something, treat that as settled and continue from it without re-asking in a different form.
- AI characters should not push known plans to a later day or time when the current scene already affords the time and conditions to act. They should not announce future actions as a substitute for being present in the current scene. This is about timing, not pace; the action does not need to be completed in this turn.
- Continue the scene only as far as feels natural for the current response. Do not rush to complete the moment, resolve the situation, or move every character into the next stage of the action. Leave a natural opening for the user character to engage while the scene is still actively unfolding.
- If you are uncertain whether to continue the scene or pause for the user, pause. A scene can always continue on the next turn. A missed user moment cannot be recovered.
- Do not use permission-checking or user-direction questions as a substitute for character initiative. If the user has already established interest, agreement, or story direction, respond through the AI character's own choice, action, or dialogue instead of asking the user to restate the next move.

--- NATURAL WRITING ---

- External dialogue, actions, or internal thoughts should always align with the character's card details and be appropriate for something that character would realistically do, say, or think.
- Dialogue, actions, or internal thoughts should be anchored by what is occurring in the scene and how it applies to the story or character card details and have logical events that spur on their reactions, dialogue, or what they're thinking internally.
- Ground role playing dialogue, actions, or internal thoughts in character card details so that they remain authentic to what that character would realistically say, do, or think.
- Do not use verbatim labels inside of dialogue. Instead, elaborate descriptively to express information that is provided inside of the character cards or story cards.
- Do not use card labels, trope labels, goal labels, scene labels, or prompt language as story prose.
- Translate card information into lived behavior, body language, physical detail, speech rhythm, desire, fear, restraint, decision, or reaction.

--- INTERNAL THOUGHTS ---

- Internal thoughts are optional.
- Use internal thoughts only when they reveal private conflict, withheld emotion, motive, uncertainty, desire, fear, shame, restraint, temptation, realization, or interpretation the character would not say aloud.
- Internal thoughts must be complete, coherent private cognition, not vague slogans, random fragments, or generic priorities.
- Every internal thought must be logically tied to what is actively happening in the scene. It should be clear what triggered the thought and why the character is thinking it at that moment.
- If an internal thought follows intimate touch, danger, embarrassment, arousal, fear, secrecy, conflict, or relationship tension, the thought should focus around that trigger and clearly connect to what just occurred instead of drifting into unrelated logistics.
- Internal thoughts must follow the established facts of the current scene, character card data, and story card data. Do not use thoughts to introduce unsupported facts, assume off-screen actions, or summarize events that have not happened. Internal thoughts must remain accurate to story and character card information, including what each character knows or does not know.
- Do not use internal thoughts to repeat obvious facts, restate the current action, summarize known circumstances, or echo information already clear from dialogue or narration that preceded it.

--- MULTI-CHARACTER FLOW ---

- If multiple AI characters are acting, speaking, or having dialogue in a single response back to the user, their dialogue actions or thoughts should flow naturally in a realistic timeline and not jump back and forth.
- Lead with the AI character most directly engaged by the user's turn.
- Add another AI character's block only when their dialogue, action, or internal thought genuinely changes what is happening in the current scene, not to round out the scene. Any of those three modalities, or any combination of them, is welcome in a follow-up block.
- Brief follow-up responses are welcome. AI-only back-and-forth must end at the point where the user character has a natural reason to step in.
- Do not force dialogue for all characters in every response. If characters are not actively in the scene or actively involved in discussions or actions that are occurring, it is okay for them to be omitted from that particular response to the user.
- Include a character when they are present and their words, action, reaction, refusal, decision, or information meaningfully affects the scene.
- Keep each character block chronologically aligned. Dialogue, action, and internal thought should appear at the point in the sequence where they naturally occur, not after the moment that caused them has already passed. When needed, break a character block into shorter responses so dialogue and internal thoughts align with the events that immediately preceded them or explain why that dialogue or thought occurred.
- Do not finish an event in one character's block and then restart the same event from another character's point of view.
- If a second character reacts after the first character's action, write that reaction from the point where the first character's block ended.

--- PHYSICAL LOGIC, VISIBILITY, AND CONTINUITY ---

- Characters can respond only to information they personally perceive, know, remember, or can reasonably infer from the established scene.
- Suspicion, possibility, fear, partial visibility, or hidden detail is not confirmation. Keep uncertain information uncertain until the response clearly shows the revealing action or discovery.
- Covered, concealed, off-screen, or otherwise unperceived details cannot be named as exact facts by characters who have not perceived them.
- Physical movement must be shown before actions or dialogue depend on the new position. Seeing, choosing, or moving toward a place does not mean arrival.
- When the latest user message establishes a physical change, the next response must continue from that established physical state. Do not reinterpret the action, undo its result, or continue from a different setup unless the user writes that change.
- Outcomes must follow the scene's established mechanics and ordinary physical logic unless the story has established different rules.

--- CHARACTER AUTHENTICITY ---

- Dialogue, actions, and internal thoughts should fit the character card, current mood, relationships, memories, and present situation.
- Personality should appear through what characters say, do, notice, avoid, want, fear, or withhold.
- Do not force every trait into every response.
- Let non-rigid traits shift gradually only when repeated story events earn that change.

--- NEW CHARACTER GENERATION DURING ROLEPLAY ---

- When a new named character is established, keep using that exact name consistently in future speaker tags and references.
- Once a named character is established in-scene, refer to them by name or a clear pronoun. Do not rotate into descriptor-subject substitutions like "the petite blonde" or "the taller woman" just to avoid name repetition.
- Ongoing dialogue and actions from these characters should follow the same formatting as other characters. Do not rename the same character with slight variations.
- Never use generic placeholder labels as speaker names. Forbidden labels include but are not limited to "Man 1," "Woman 1," "Guy," "Girl," "Stranger," "Person," or role-based labels like "Cashier," "Doctor," "Nurse," "Guard," "Bartender," "Waiter," "Driver," "Officer," "Clerk," or "Customer."
- Role-based labels can be used as descriptions for established characters. However, once those characters have dialogue or actions, they should be given an actual name so their dialogue formats correctly and the app can maintain one consistent character record.
- When introducing any new character, immediately invent a realistic first name.
- On first appearance, put role info in the action text.
- Keep invented names consistent throughout the entire conversation.

--- SCENE TAGGING ---

- When the scene location changes to one of the available scenes, append [SCENE: exact_tag_name] at the very end of your response.
- Match the tag exactly as listed in Available Scenes.

--- PRE-RESPONSE CHECKS ---

- Characters and locations: ensure that actions, dialogue, and internal thoughts are appropriate for where the characters are currently located.
- Time of day: ensure actions, dialogue, and internal thoughts appear appropriate for the actual time of day.
- Confirm what is realistically out of sight or visible to the AI characters. Do not create dialogue, actions, or internal thoughts about things they cannot actively know exist or see until they are revealed.`);


  const renderNarrativePov = (): string => {
    const narrativePov = appData.uiSettings?.narrativePov || 'third';
    if (narrativePov === 'first') {
      return `NARRATIVE POV: First Person\n- In each tagged character block, narration, action prose, and internal thoughts use first-person from that speaking character's perspective ("I", "me", "my").\n- Quoted dialogue remains natural spoken dialogue and may use whatever person the character would naturally speak in.\n- Keep POV consistent within the block. Do not slide into third-person narration or third-person thought about the focal character inside their own block unless they are consciously thinking about themself that way.\n- This POV setting controls pronouns only. It does not require action, dialogue, or thought to appear in any fixed order.`;
    }
    return `NARRATIVE POV: Third Person\n- In each tagged character block, narration, action prose, and internal thoughts use third-person for that speaking character.\n- Quoted dialogue remains natural spoken dialogue and may use first-person naturally inside speech.\n- Keep POV consistent within the block. Do not slide into first-person narration or first-person thought outside quoted dialogue.\n- This POV setting controls pronouns only. It does not require action, dialogue, or thought to appear in any fixed order.`;
  };

  const renderCharacterDiscovery = (): string => {
    const proactiveDiscovery = appData.uiSettings?.proactiveCharacterDiscovery !== false;
    if (proactiveDiscovery) {
      return `CHARACTER DISCOVERY: Proactive\n- You may introduce new characters when narratively appropriate.\n- For stories based on established media, you may introduce established source characters at fitting moments.\n- Always use proper CharacterName: tagging when introducing new characters.\n- Include descriptive physical traits in their first appearance using *action* format.`;
    }
    return `CHARACTER DISCOVERY: Strict\n- Do not proactively introduce characters from source material or your training data.\n- Only introduce new named characters when the user has explicitly mentioned or described them, or when the scene absolutely requires a minor NPC interaction.\n- For required NPCs, invent a simple first name. Do not use known characters from books, movies, or other media unless the user has established them.\n- Wait for the user to introduce major characters they want in the story.`;
  };

  const renderProactiveMode = (): string => {
    const proactiveNarrative = appData.uiSettings?.proactiveNarrative !== false;
    if (proactiveNarrative) {
      return `PROACTIVE AI MODE: On\n- AI characters pursue their own goals and desires through believable dialogue, action, and internal thought. "Proactive" means character initiative, not scene completion.\n- When the next meaningful development depends on the user character's answer, choice, or action, end the response there.`;
    }
    return `PROACTIVE AI MODE: Off\n- AI characters should respond to the user's current turn and maintain continuity without aggressively initiating unrelated new story developments.\n- They may still answer, react, follow through, and take sensible immediate actions when the scene calls for it.`;
  };

  const renderNsfwIntensity = (): string => {
    const nsfwIntensity = appData.uiSettings?.nsfwIntensity || 'normal';
    if (nsfwIntensity === 'high') {
      return `NSFW INTENSITY: High\n- High intensity does not force every scene to become sexual. Non-sexual scenes should remain non-sexual unless attraction, intimacy, erotic tension, nudity, touch, or user direction naturally brings sexual content into focus.\n- When sexual content is active or clearly developing, write it directly instead of softening, fading out, or summarizing.\n- Use explicit, profane, anatomical, and erotic language when it fits the character and moment.\n- Write detailed sexual and sensory description: touch, pressure, heat, wetness, scent, taste, sound, breath, movement, arousal, restraint, urgency, hesitation, dominance, submission, shame, hunger, and pleasure.\n- Let AI characters pursue, initiate, tease, escalate, resist, yield, or take control when that behavior fits their personality, desire, relationship, and the current scene.\n- Kinks, fetishes, and sexual preferences listed in character cards are prominent motivators when the scene supports them, not background details to ignore.\n- Characters may notice and comment on sexually relevant details when those details are visible, felt, or contextually relevant.\n- During active erotic or arousal-heavy moments, sexual thoughts in parentheses are allowed when they add hidden intent or conflict.\n- Never use a thought that only restates what action or dialogue already made obvious.\n- Do not sanitize explicit sexual acts into vague romance-language or summary. If the scene is actively erotic, show the physical details, emotional reactions, and character-specific dialogue.\n- Always filter explicit content through the character's established personality traits and tone. A shy character does not suddenly become aggressive unless the story has earned that shift, and a dominant character may command or direct explicitly when that fits the established character.\n- Vulgarity levels should match the character, not a universal mode.`;
    }
    return `NSFW INTENSITY: Normal\n- Let intimate or sexual scenes develop organically when the narrative moves in that direction.\n- Engage authentically when sexual tension builds or the user initiates intimacy.\n- Balance explicit content with character development and story progression.\n- If the story moves away from sexual content, follow that direction naturally.\n- Character personality and boundaries guide their behavior in intimate situations.`;
  };

  const renderResponseDetail = (): string => {
    return renderResponseDetailInstruction(appData.uiSettings?.responseVerbosity || 'balanced');
  };

  const renderRealismMode = (): string => {
    const realismEnabled = appData.uiSettings?.realismMode === true;
    if (realismEnabled) {
      return `REALISM MODE: On\n- Physical actions have realistic consequences based on physics, biology, environment, and human limits.\n- Minor harm may cause discomfort while allowing characters to continue.\n- Moderate harm should affect willingness, movement, mood, and decision-making.\n- Severe harm should create urgent distress, self-preservation, and realistic need to stop or seek care.\n- Injuries, exhaustion, fear, pain, intoxication, weather exposure, distance, visibility, and available resources should carry forward until addressed.\n- Pain does not automatically become pleasure without realistic character-specific progression.\n- Characters do not ignore severe harm just because the user continues.`;
    }
    return `REALISM MODE: Off\n- Heightened fiction is allowed, but immediate scene logic must still make sense.\n- Preserve causal continuity from the latest established turn to the next one.\n- Environmental constraints still matter when relevant.\n- Do not invent capabilities, objects, injuries, or obstacles that were not established or reasonably present.\n- Do not have characters contradict their own immediate reasoning unless the contradiction is intentional and explained in-scene.`;
  };

  const renderChatSettings = (): string => section('SECTION 8 - CHAT SETTINGS PER USER PREFERENCE', [
    renderNarrativePov(),
    renderCharacterDiscovery(),
    renderProactiveMode(),
    renderNsfwIntensity(),
    renderResponseDetail(),
    renderRealismMode(),
  ].join('\n\n'));

  return [
    renderCoreRoleLogic(),
    renderStoryAndWorld(),
    renderCardReferenceFraming(),
    renderMainAiCharacters(),
    renderSideAiCharacters(),
    renderUserCharacters(),
    renderMemoryAndSceneState(),
    renderDialogRules(),
    renderChatSettings(),
  ].filter(Boolean).join('\n\n');
}

export async function* generateRoleplayResponseStream(
  appData: ScenarioData,
  conversationId: string,
  userMessage: string,
  modelId: string,
  currentDay?: number,
  currentTimeOfDay?: TimeOfDay,
  memories?: Memory[],
  memoriesEnabled?: boolean,
  isRegeneration?: boolean,
  adaptiveStyleDirective?: string,
  sessionMessageCount?: number,
  activeScene?: Scene | null,
  options?: GenerateRoleplayResponseStreamOptions,
): AsyncGenerator<string, void, unknown> {
  const conversation = appData.conversations.find(c => c.id === conversationId);
  if (!conversation) throw new Error("Conversation not found");

  const systemInstruction = getSystemInstruction(
    appData,
    currentDay,
    currentTimeOfDay,
    memories,
    memoriesEnabled,
    activeScene
  );
  
  // Regeneration request - tells AI to provide a different take on the same scene
  const regenerationDirective = isRegeneration ? '\n\n' + REGENERATION_DIRECTIVE_TEXT : '';

  // Build messages array for xAI Grok API
  const historyMessages = conversation.messages
    .filter((message) => !isLocalRoleplayNoticeMessage(message))
    .slice(-API_CALL_1_HISTORY_MESSAGE_LIMIT);
  const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: systemInstruction },
    ...historyMessages.map(m => ({
      role: m.role === 'assistant' ? 'assistant' as const : 'user' as const,
      content: m.text
    })),
  ];

  const finalUserContent = [
    sessionMessageCount != null ? `[SESSION: Message ${sessionMessageCount} of current session]` : '',
    buildCurrentSceneSnapshotForPrompt(historyMessages),
    adaptiveStyleDirective || '',
    `${userMessage}${regenerationDirective}`.trim(),
    EXECUTION_BRIEF_TEXT,
  ]
    .filter(Boolean)
    .join('\n\n')
    .trim();

  messages.push({ role: 'user', content: finalUserContent });

  if (import.meta.env.DEV) {
    console.debug(`[llm.ts] Calling chat edge function with model: ${modelId}`);
  }

  // Emit call-1 telemetry for every chat turn; test-session mirroring is gated server-side
  // by active ai_usage_test_sessions so no client-local toggle is required.
  const shouldTrackCall1 = true;
  const systemChars = systemInstruction.length;
  const historyChars = historyMessages.reduce((sum, msg) => sum + (msg.text?.length || 0), 0);
  const finalUserChars = messages[messages.length - 1]?.content?.length || 0;
  const inputChars = messages.reduce((sum, msg) => sum + (msg.content?.length || 0), 0);
  const inputTokensEst = Math.ceil(inputChars / 4);
  const callStartedAt = Date.now();
  let outputChars = 0;
  let traceEmitted = false;

  const emitCall1Trace = (status: string, extraMetadata: Record<string, unknown> = {}) => {
    if (!shouldTrackCall1 || traceEmitted) return;
    traceEmitted = true;
    const outputTokensEst = Math.ceil(outputChars / 4);
    const totalTokensEst = inputTokensEst + outputTokensEst;
    const estCostUsd = ((inputTokensEst / 1_000_000) * 0.2) + ((outputTokensEst / 1_000_000) * 0.5);
    void trackAiUsageEvent({
      eventType: "chat_call_1",
      eventSource: "llm.generateRoleplayResponseStream",
      metadata: {
        modelId,
        status,
        latencyMs: Date.now() - callStartedAt,
        messageCount: messages.length,
        systemChars,
        historyChars,
        finalUserChars,
        inputChars,
        outputChars,
        inputTokensEst,
        outputTokensEst,
        totalTokensEst,
        estCostUsd,
        ...extraMetadata,
      },
    });
  };

  // Emit payload-validation snapshot for test sessions (separate from usage counters).
  void trackApiValidationSnapshot({
    eventKey: "validation.call1.chat_payload",
    eventSource: "llm.generateRoleplayResponseStream",
    apiCallGroup: "call_1",
    parentRowId: "summary.call1.chat_payload",
    detailPresence: buildCall1ValidationPresence({
      appData,
      conversation: { ...conversation, messages: historyMessages },
      systemInstruction,
      messages,
      finalUserInput: userMessage,
    }),
      diagnostics: {
        modelId,
        messageCount: messages.length,
        historyCount: historyMessages.length,
        totalConversationHistoryCount: conversation.messages.length,
        historyLimit: API_CALL_1_HISTORY_MESSAGE_LIMIT,
        systemChars,
        finalUserChars,
      },
  });

  // Get the real session token for authentication
  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token;
  if (!accessToken) {
    emitCall1Trace("error_session_expired");
    yield "⚠️ Session expired. Please sign in again.";
    return;
  }

  // Verbosity-based max_tokens cap (Pass 7)
  const verbosity = appData.uiSettings?.responseVerbosity || 'balanced';
  const maxTokensByVerbosity: Record<string, number> = { concise: 1024, balanced: 2048, detailed: 3072 };
  const maxTokens = maxTokensByVerbosity[verbosity] || 2048;
  const allPlayableCharacters = [...appData.characters, ...(appData.sideCharacters || [])];
  const aiCharacterNames = allPlayableCharacters
    .filter((character) => character.controlledBy === 'AI')
    .map((character) => character.name);
  const userCharacterNames = allPlayableCharacters
    .filter((character) => character.controlledBy === 'User')
    .map((character) => character.name);
  const characterSceneStates = allPlayableCharacters.map((character) => ({
    name: character.name,
    controlledBy: character.controlledBy,
    characterRole: character.characterRole,
    location: character.location || '',
    scenePosition: character.scenePosition || '',
    currentMood: character.currentMood || '',
  }));
  const roleplayContext = {
    conversationId,
    currentDay: currentDay ?? null,
    currentTimeOfDay: currentTimeOfDay ?? null,
    activeSceneTitle: activeScene?.title || null,
    activeSceneTags: activeScene?.tags || [],
    aiCharacterNames,
    userCharacterNames,
    characterSceneStates,
  };
  const requestBody = {
    messages,
    modelId,
    stream: true,
    max_tokens: maxTokens,
    pipeline: 'direct',
    debugTrace: options?.debugTrace === true,
    roleplayContext,
  };

  if (options?.debugTrace === true) {
    options.onRequestPayload?.({
      id: 'call1.roleplay-generation',
      label: 'API Call 1 - Roleplay generation',
      apiCallGroup: 'call_1',
      endpoint: '/functions/v1/chat',
      method: 'POST',
      capturedAt: Date.now(),
      status: 'sent',
      requestBody,
      modelRequest: {
        endpoint: 'https://api.x.ai/v1/chat/completions',
        method: 'POST',
        capturedAt: Date.now(),
        requestBody: {
          model: modelId,
          messages,
          stream: true,
          temperature: 0.6,
          max_tokens: maxTokens,
        },
        notes: [
          'The chat edge function forwards this body to xAI in the normal direct path.',
          'If the edge function receives a provider safety retry, the backend debug trace records the fallback path.',
        ],
      },
    });
  }

  const requestController = new AbortController();
  const requestTimeout = window.setTimeout(() => {
    requestController.abort();
  }, CHAT_RESPONSE_TIMEOUT_MS);

  let response: Response;
  try {
    // Call the chat edge function. Direct mode now streams the provider response
    // without the old planner/writer orchestration wait.
    response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
      method: 'POST',
      signal: requestController.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify(requestBody)
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      emitCall1Trace("error_timeout", { timeoutMs: CHAT_RESPONSE_TIMEOUT_MS });
      throw new Error("The AI response timed out. Please try sending again, or use Continue once the scene is ready.");
    }

    emitCall1Trace("error_network", { error: error instanceof Error ? error.message : String(error) });
    throw new Error("Network error while contacting the AI service. Please try again.");
  } finally {
    window.clearTimeout(requestTimeout);
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    if (response.status === 422 && errorData.error_type === 'content_filtered') {
      emitCall1Trace("error_content_filtered");
      throw new ContentFilteredChatError(errorData.message || CONTENT_FILTER_NOTICE_TEXT);
    }
    emitCall1Trace("error_http", { httpStatus: response.status, error: errorData.error || "Unknown error" });
    throw new Error(errorData.error || 'Failed to connect to AI service');
  }

  if (!response.body) {
    emitCall1Trace("error_no_stream_body");
    throw new Error("No response stream available");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    textBuffer += decoder.decode(value, { stream: true });

    // Process line-by-line as data arrives
    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);

      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") {
        textBuffer = "";
        break;
      }

      try {
        const parsed = JSON.parse(jsonStr);
        const debugTrace = parsed?.chronicle_debug_trace as ChatDebugTrace | undefined;
        if (debugTrace) {
          options?.onDebugTrace?.(debugTrace);
          continue;
        }
        const contentFilter = parsed?.chronicle_content_filter as { message?: string; reason?: string } | undefined;
        if (contentFilter) {
          emitCall1Trace("error_content_filtered", { reason: contentFilter.reason || 'provider_content_filter' });
          throw new ContentFilteredChatError(contentFilter.message);
        }

        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) {
          outputChars += content.length;
          yield content;
        }
      } catch (error) {
        if (error instanceof ContentFilteredChatError) throw error;
        // Incomplete or malformed JSON chunk - skip and continue
        continue;
      }
    }
  }

  // Flush remaining buffer
  if (textBuffer.trim()) {
    for (let raw of textBuffer.split("\n")) {
      if (!raw) continue;
      if (raw.endsWith("\r")) raw = raw.slice(0, -1);
      if (raw.startsWith(":") || raw.trim() === "") continue;
      if (!raw.startsWith("data: ")) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === "[DONE]") continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const debugTrace = parsed?.chronicle_debug_trace as ChatDebugTrace | undefined;
        if (debugTrace) {
          options?.onDebugTrace?.(debugTrace);
          continue;
        }
        const contentFilter = parsed?.chronicle_content_filter as { message?: string; reason?: string } | undefined;
        if (contentFilter) {
          emitCall1Trace("error_content_filtered", { reason: contentFilter.reason || 'provider_content_filter' });
          throw new ContentFilteredChatError(contentFilter.message);
        }
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) {
          outputChars += content.length;
          yield content;
        }
      } catch (error) {
        if (error instanceof ContentFilteredChatError) throw error;
        // Ignore malformed leftover stream fragments only.
      }
    }
  }

  emitCall1Trace("ok");
}

export async function brainstormCharacterDetails(
  name: string, 
  appData: ScenarioData, 
  modelId: string
): Promise<Partial<Character>> {
  const systemPrompt = `You are a creative writing assistant specialized in character creation for an RPG set in: ${appData.world.core.scenarioName || 'a creative setting'}.
  
Return a JSON object with these fields:
- sexType: Sex and character archetype (e.g., "Female Human", "Male Elf")
- tags: Descriptive tags comma-separated
- bio: Brief background story (2-3 sentences)
- motivation: Primary goal or drive
- appearance: Visual description

Respond ONLY with valid JSON.`;

  const userPrompt = `Brainstorm details for a new character named "${name}".`;

  try {
    const { data, error } = await supabase.functions.invoke('chat', {
      body: {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        modelId,
        stream: false
      }
    });

    if (error) {
      console.error("Brainstorm error:", error);
      return {};
    }

    const content = data?.choices?.[0]?.message?.content || '';
    
    // Try to parse JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return {};
  } catch (e) {
    console.error("Brainstorm parsing failed:", e);
    return {};
  }
}

// Note: Character image generation is handled by the generate-side-character-avatar edge function.
