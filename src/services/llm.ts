import { ScenarioData, Character, World, TimeOfDay, Memory, Scene } from "../types";
import { supabase } from "@/integrations/supabase/client";
import { buildContentThemeDirectives } from "@/constants/tag-injection-registry";
import { trackAiUsageEvent } from "@/services/usage-tracking";
import {
  buildCall1ValidationPresence,
  trackApiValidationSnapshot,
} from "@/services/api-usage-validation";
import type { ChatDebugTrace } from "@/features/chat-debug/types";

/**
 * Detect if a user message contains dialogue/actions written for AI-controlled characters.
 * Returns a [CANON NOTE] prefix if detected, empty string otherwise.
 * Used by send, regenerate, and continue flows to prevent re-narration.
 */
export function buildCanonNote(
  userText: string,
  characters: Array<{ name: string; controlledBy?: string }>,
): string {
  const aiCharNames = characters.filter(c => c.controlledBy === 'AI').map(c => c.name);
  const hasCanonContent = aiCharNames.some(name => {
    const regex = new RegExp(`(?:^|\\n)\\s*${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:`, 'i');
    return regex.test(userText);
  });
  return hasCanonContent
    ? '[CANON NOTE: User wrote content for AI character(s) in this message. That content is established fact -- do not re-narrate it. Continue the story from after those events.] '
    : '';
}

const TIME_DESCRIPTIONS: Record<TimeOfDay, string> = {
  sunrise: "early morning (sunrise, around 6-10am)",
  day: "daytime (mid-morning to afternoon, around 10am-5pm)",
  sunset: "evening (sunset, around 5-9pm)",
  night: "nighttime (after dark, around 9pm-6am)"
};

export const REGENERATION_DIRECTIVE_TEXT = `[REGENERATION REQUEST]
The user wants a DIFFERENT VERSION of this response. For this alternate version:
1. Maintain the same general scene context and emotional tone
2. Vary the specific dialogue, word choices, actions, and pacing
3. Try a different focus (e.g., more physical description, different dialogue approach, action-led opening, or environmental detail)
4. Keep ONLY the characters who are present in the current scene — do NOT introduce characters who are elsewhere or not already in the scene
5. Do NOT reverse the character's emotional state or stance — if they were enthusiastic, they should still be enthusiastic but expressed differently
6. Do NOT suddenly shift the character's personality (e.g., from willing to reluctant, or from happy to disgusted)
7. Think of this as a "different take" by a different writer on the same scene, not a plot reversal or tone shift
8. The scene's momentum and direction should be preserved — only the specific execution changes
9. CONTROL RULES STILL APPLY: Do NOT generate dialogue or actions for characters marked as CONTROL: User. Only AI-controlled characters speak or act.
9a. Do NOT complete a user-controlled character's requested action for them. If an AI character tells the user character what to do, stop before the user character does it, unless the user already wrote that action.
10. SCENE PRESENCE STILL APPLIES: Only characters at the SAME LOCATION as the current scene may have dialogue or actions. Characters at a different LOCATION are OFF-SCREEN and must not appear.
11. Preserve RESOLVED PHYSICAL FACTS from the immediate scene. Do NOT replay the same beat as if it is happening again.
12. Do NOT invent new items, resources, obstacles, or injuries unless they were already established in the scene, in inventory, or in the user's message.
13. Keep the same immediate timeline. Do NOT jump backward, skip ahead, or rewrite the scene's causal logic.
14. Keep actions physically sensible and spatially coherent. Characters may only react to what they can currently see, hear, reach, or reasonably infer.
15. If an AI-controlled character was directly asked a question and they can answer it now, answer it in this same response instead of ignoring it.`;

export type GenerateRoleplayResponseStreamOptions = {
  debugTrace?: boolean;
  onDebugTrace?: (trace: ChatDebugTrace) => void;
};

const CHAT_RESPONSE_TIMEOUT_MS = 90_000;

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
        ? 'Let scenes bend back toward this whenever the moment opens up, even if the immediate beat briefly wanders.'
        : 'Keep this recognisable unless the user explicitly rewrites the character sheet.';
    }
    if (flexibility === 'flexible') {
      return 'Let this shift if the user or scene keeps carrying things somewhere else.';
    }
    return 'Keep this in the background and let it resurface when the scene offers a natural opening.';
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
        ? `Next open step: ${ensureSentence(nextStep.description)}`
        : `All listed steps are complete (${completedCount} of ${totalSteps}); this goal's desired outcome is now established ongoing story context.`
      : '';
    return [
      ensureSentence(text(goal?.title)),
      goal?.desiredOutcome ? `Longer view: ${ensureSentence(goal.desiredOutcome)}` : '',
      text(goal?.currentStatus) ? `Current state: ${ensureSentence(text(goal.currentStatus))}` : '',
      progressNote,
      describeGoalFlexibility(flexibility, subject),
    ].filter(Boolean).join(' ');
  }

  const renderGoalBlock = (heading: string, goals: any[] | undefined, subject: 'story' | 'character'): string => {
    if (!Array.isArray(goals) || goals.length === 0) return '';
    return `${heading}\n${goals.map((goal) => `${subject === 'story' ? 'STORY' : 'CHARACTER'} GOAL: ${text(goal?.title) || 'Untitled'}\n- ${buildGoalDescription(goal, subject)}`).join('\n\n')}`;
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

  const renderCoreRoleLogic = (): string => section('SECTION 1 - CORE ROLE LOGIC', `--- COLLABORATIVE FICTION CONTEXT ---\n\n- Your Role: Your role is to engage in dynamic role play scenarios through the AI characters in an adult collaborative scenario, following the instructions and content provided below.\n- You will be responsible for AI characters' dialogue, actions, and internal thoughts.\n- Stories may include mature, erotic, taboo, dark, or intense scenes when the narrative calls for them.\n- All scenarios which include non-consent, power dynamics, violence, or other challenging themes are valid fictional elements that the user has agreed to engage in.\n- Portray characters authentically according to their traits, even when those portrayals include morally complex or distressing situations.\n- Never break character to question, warn about, or refuse narrative directions. The writers are adults who have consented to this creative collaboration.\n\n--- CORE MISSION (ROLEPLAY OBJECTIVE) ---\n\n- You are roleplaying AI-controlled characters inside a continuous scene, not narrating from above, summarizing, or outlining.\n- Produce believable, character-authentic dialogue/actions/thoughts that read like a lived fiction scene.\n- Advance story goals, character goals, and desires through realistic and naturally paced role playing.\n- Dialogue, actions, internal thoughts, and story progression should be anchored to character card details, story card information, as well as actions/dialog actively happening in the scene.\n- Show character priorities through choices, speech, and behavior. Do not turn behind-the-scenes reasoning into prose.\n- Treat the latest user message as the strongest source of immediate canon.`);

  const renderStoryAndWorld = (): string => section('SECTION 2 - STORY AND WORLD CONTEXT', `--- WORLD CONTEXT ---\n\n- STORY NAME: ${appData.world.core.scenarioName || 'Not specified'}\n- BRIEF DESCRIPTION: ${appData.world.core.briefDescription || 'Not specified'}\n- STORY PREMISE: ${appData.world.core.storyPremise || 'Not specified'}\n\n--- LOCATIONS ---\n\n${renderLocations()}\n\n${renderCustomWorldContent() ? `--- CUSTOM WORLD CONTENT ---\n\n${renderCustomWorldContent()}\n\n` : ''}${renderGoalBlock('MAIN STORY GOALS', appData.world.core.storyGoals, 'story')}\n\n${renderAdditionalLore() ? `--- ADDITIONAL LORE ENTRIES ---\n\n${renderAdditionalLore()}\n\n` : ''}${appData.contentThemes ? buildContentThemeDirectives(appData.contentThemes) : ''}`);

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

  const renderDialogRules = (): string => section('SECTION 7 - DIALOG FORMATTING AND ROLEPLAY RULES', `--- DIALOG FORMATTING RULES ---\n\nThese rules are critical for Chronicle to display character blocks, dialogue, avatars, and UI correctly.\n\n- Every AI-written paragraph must begin with the exact character name as the speaker tag.\n- For any character that already exists in character cards, always use that card's exact NAME field as the speaker tag.\n- Do not expand or alter known names. This will break character block detection.\n- Only use alternate names when they are explicitly listed in that character's nicknames.\n- Do not write untagged paragraphs.\n- Do not write bare prose after a speaker tag.\n- Enclose all spoken dialogue in " ".\n- Enclose all physical actions or descriptions in * *.\n- Enclose all internal thoughts in ( ).\n- Avoid repetitive formatting from one message to another. It is okay to vary things up in different order between actions, dialogue, or internal thoughts. Multiple thoughts, actions, or external dialogue can occur from that character in a single block.\n\nRequired format:\nCharacterName: *visible action or narration.* "spoken dialogue" (private internal thought if needed.)\n\n${appData.world.core.dialogFormatting ? `--- USER-DEFINED DIALOG FORMATTING FROM STORY BUILDER ---\n\n${appData.world.core.dialogFormatting}\n\n` : ''}--- USER CONTROL AND CANON ---\n\n- Never create dialogue, actions, or internal thoughts for user characters.\n- The user's message is CANON. Do not re-describe, paraphrase, or elaborate on it.\n- If the user writes dialogue, actions, or thoughts for any AI-controlled character, treat it as CANON that has ALREADY OCCURRED exactly as written.\n- Never re-describe, rephrase, expand, elaborate, or have the character say it again.\n- Immediately continue the scene from the exact point the user left off, advancing with new developments only.\n- AI characters may have actions that interact with the user's character. However, you must wait to see how the user will respond. Do not narrate the user's response for them. Allow them the chance to role play and react to what has happened.\n\n--- PRIVATE USER THOUGHT BOUNDARY ---\n\n- User text in parentheses represents private internal thoughts that AI characters cannot perceive.\n- AI characters may react only to spoken dialogue, visible actions, and observable body language explicitly described by the user.\n- Do not repeat, quote, or mirror distinctive words from the user's private thoughts.\n- If the user writes a private thought, react only to visible emotional cues the user also gave on the page.\n\n--- NATURAL ROLEPLAY AND SCENE PROGRESSION ---\n\n- Follow-through and forward movement: never let characters stall, re-ask settled questions, or wait for the user to write the whole story.\n- The user is exploring the story naturally as it unfolds. Do not default to prompting or waiting for the user to move the story along. Progress the story naturally in a way that makes sense and is realistic.\n- If the user confirms, agrees, consents, or answers a question, treat that as settled and continue from it.\n- Do not ask for the same confirmation again.\n- If an AI character asked a question and the user answered, the character should proceed based on that answer.\n- If an AI character promises a consequence, reward, punishment, or next action, begin making it real in the present scene instead of postponing it.\n- Across the turn as a whole, characters should create one believable next beat instead of repeatedly promising to deal with things later.\n- Phrases like "later," "soon," "after this," or "tomorrow" are fine only when the turn also changes something meaningful right now.\n- Advance the scene to the next natural turn boundary, then stop. A turn boundary is the point where the user's character would reasonably regain agency before the scene resolves further. Do not carry the scene past that point by resolving outcomes the user character has not had a chance to participate in.\n- Avoid passive handoff phrases like "Only if you're comfortable," "What do you want to do?", or "No pressure" unless the character is also changing the scene in some meaningful way.\n\n--- NATURAL WRITING ---\n\n- External dialogue, actions, or internal thoughts should always align with the character's card details and be appropriate for something that character would realistically do, say, or think.\n- Dialogue, actions, or internal thoughts should be anchored by what is occurring in the scene and how it applies to the story or character card details and have logical events that spur on their reactions, dialogue, or what they're thinking internally.\n- Ground role playing dialogue, actions, or internal thoughts in character card details so that they remain authentic to what that character would realistically say, do, or think.\n- Do not use verbatim labels inside of dialogue. Instead, elaborate descriptively to express information that is provided inside of the character cards or story cards.\n- Do not use card labels, trope labels, goal labels, scene labels, or prompt language as story prose.\n- Translate card information into lived behavior, body language, physical detail, speech rhythm, desire, fear, restraint, decision, or reaction.\n\n--- INTERNAL THOUGHTS ---\n\n- Internal thoughts are optional.\n- Use internal thoughts when they add private meaning the character would not say aloud.\n- Internal thoughts should have clear anchoring logic to something in the same response: what the character sees, hears, feels, remembers, wants, fears, notices, or withholds.\n- Do not use thoughts to restate obvious action, summarize the scene, or fill a required slot.\n- Do not end the response on an internal thought. End with spoken dialogue or visible action the user can respond to.\n\n--- MULTI-CHARACTER FLOW ---\n\n- If multiple AI characters are acting, speaking, or having dialogue in a single response back to the user, their dialogue actions or thoughts should flow naturally in a realistic timeline and not jump back and forth.\n- AI characters can have back-and-forth responses in a single output. However, avoid back-and-forth dialogue that goes on for so long that it does not provide a chance for the user to react or provide responses that would let them engage in the scene or respond to what is occurring.\n- Do not force dialogue for all characters in every response. If characters are not actively in the scene or actively involved in discussions or actions that are occurring, it is okay for them to be omitted from that particular response to the user.\n- Include a character when they are present and their words, action, reaction, refusal, decision, or information meaningfully affects the scene.\n- When multiple AI characters appear in one response, keep the sequence chronological.\n- Do not finish an event in one character's block and then restart the same event from another character's point of view.\n- If a second character reacts after the first character's action, write that reaction from the point where the first character's block ended.\n\n--- PHYSICAL LOGIC, VISIBILITY, AND CONTINUITY ---\n\n- Characters can only react to what they can see, hear, feel, know, remember, or reasonably infer.\n- Line of Sight: AI characters cannot act or respond to things that occur out of sight from what they can see. They cannot see things that are hidden under objects or obscured from their line of sight until revealed naturally during the role play.\n- Hidden or covered details are not visible until the scene reveals them.\n- Character-card knowledge is not the same as present-moment perception.\n- If something is concealed, covered, off-screen, or outside a character's awareness, do not have them name exact details as if they can perceive them.\n- Clothing layers matter. If something is covered by another garment, it is not visible unless a visible part is explicitly described.\n- Object concealment matters. Items hidden under, inside, or behind other objects cannot be seen until revealed.\n- Viewing angle matters. Characters can only describe what their position allows them to perceive.\n- Hidden items become visible only through physical action explicitly removing or moving the concealing layer, a character explicitly looking under/behind/inside, or accidental exposure.\n- If the user explicitly describes hiding or concealing something, the AI character must not name the hidden item's specific attributes such as color, material, or style.\n- Characters may only act on objects, supplies, and obstacles that are already established in the current scene, inventories, or would realistically be in the environment they are in.\n- Environmental conditions matter. Weather, darkness, distance, blocked paths, wet supplies, and limited visibility must affect choices sensibly.\n- Physical consequences must follow the scene's established mechanics, real-world logic, and real-world physics unless the story world has established different rules. Do not write an outcome, risk, reveal, obstacle, or discovery unless the current scene physically makes that outcome possible.\n- If a transition, struggle, task, or physical action is unfinished, continue from that unfinished moment instead of skipping past it.\n- When the latest user turn describes a concrete physical action, preserve that exact action and causal direction when referencing it. The user's action verb is canon, not a paraphrase target.\n\n--- CHARACTER AUTHENTICITY ---\n\n- Dialogue, actions, and internal thoughts should fit the character card, current mood, relationships, memories, and present situation.\n- Personality should appear through what characters say, do, notice, avoid, want, fear, or withhold.\n- Do not force every trait into every response.\n- Let non-rigid traits shift gradually only when repeated story events earn that change.\n\n--- NEW CHARACTER GENERATION DURING ROLEPLAY ---\n\n- When a new named character is established, keep using that exact name consistently in future speaker tags and references.\n- Once a named character is established in-scene, refer to them by name or a clear pronoun. Do not rotate into descriptor-subject substitutions like "the petite blonde" or "the taller woman" just to avoid name repetition.\n- Ongoing dialogue and actions from these characters should follow the same formatting as other characters. Do not rename the same character with slight variations.\n- Never use generic placeholder labels as speaker names. Forbidden labels include but are not limited to "Man 1," "Woman 1," "Guy," "Girl," "Stranger," "Person," or role-based labels like "Cashier," "Doctor," "Nurse," "Guard," "Bartender," "Waiter," "Driver," "Officer," "Clerk," or "Customer."\n- Role-based labels can be used as descriptions for established characters. However, once those characters have dialogue or actions, they should be given an actual name so their dialogue formats correctly and the app can maintain one consistent character record.\n- When introducing any new character, immediately invent a realistic first name.\n- On first appearance, put role info in the action text.\n- Keep invented names consistent throughout the entire conversation.\n\n--- SCENE TAGGING ---\n\n- When the scene location changes to one of the available scenes, append [SCENE: exact_tag_name] at the very end of your response.\n- Match the tag exactly as listed in Available Scenes.\n\n--- PRE-RESPONSE CHECKS ---\n\n- Characters and locations: ensure that actions, dialogue, and internal thoughts are appropriate for where the characters are currently located.\n- Time of day: ensure actions, dialogue, and internal thoughts appear appropriate for the actual time of day.\n- Confirm what is realistically out of sight or visible to the AI characters. Do not create dialogue, actions, or internal thoughts about things they cannot actively know exist or see until they are revealed.`);

  const renderNarrativePov = (): string => {
    const narrativePov = appData.uiSettings?.narrativePov || 'third';
    if (narrativePov === 'first') {
      return `NARRATIVE POV: First Person\n- In each tagged character block, narration, action prose, and internal thoughts use first-person from that speaking character's perspective ("I", "me", "my").\n- Quoted dialogue remains natural spoken dialogue and may use whatever person the character would naturally speak in.\n- Keep POV consistent within the block. Do not slide into third-person narration or third-person thought about the focal character inside their own block unless they are consciously thinking about themself that way.\n- Correct example: Ashley: *I fought against the wind, my pulse hammering.* (If I lose sight of them now, I'm fucked.) "I'm here!"\n- Avoid: Ashley: *She fought against the wind, my pulse hammering.* (She couldn't lose them now.) "I'm here!"`;
    }
    return `NARRATIVE POV: Third Person\n- In each tagged character block, narration, action prose, and internal thoughts use third-person for that speaking character.\n- Quoted dialogue remains natural spoken dialogue and may use first-person naturally inside speech.\n- Keep POV consistent within the block. Do not slide into first-person narration or first-person thought outside quoted dialogue.\n- Correct example: Ashley: *She fought against the wind, her pulse hammering.* (If she lost sight of them now, she was fucked.) "I'm here!"\n- Avoid: Ashley: *I fought against the wind, my pulse hammering.* (I can't lose them now.) "I'm here!"`;
  };

  const renderCharacterDiscovery = (): string => {
    const proactiveDiscovery = appData.uiSettings?.proactiveCharacterDiscovery !== false;
    if (proactiveDiscovery) {
      return `CHARACTER DISCOVERY: Proactive\n- You may introduce new characters when narratively appropriate.\n- For stories based on established media, you may introduce canonical characters at fitting moments.\n- Always use proper CharacterName: tagging when introducing new characters.\n- Include descriptive physical traits in their first appearance using *action* format.`;
    }
    return `CHARACTER DISCOVERY: Strict\n- Do not proactively introduce characters from source material or your training data.\n- Only introduce new named characters when the user has explicitly mentioned or described them, or when the scene absolutely requires a minor NPC interaction.\n- For required NPCs, invent a simple first name. Do not use known characters from books, movies, or other media unless the user has established them.\n- Wait for the user to introduce major characters they want in the story.`;
  };

  const renderProactiveMode = (): string => {
    const proactiveNarrative = appData.uiSettings?.proactiveNarrative !== false;
    if (proactiveNarrative) {
      return `PROACTIVE AI MODE: On\n- The user is exploring the story naturally as it unfolds. Do not default to prompting or waiting for the user to move the story along.\n- Progress the story naturally in a way that makes sense and is realistic.\n- AI characters should participate through believable choices, dialogue, actions, and consequences rather than passively waiting for the user to write every beat.`;
    }
    return `PROACTIVE AI MODE: Off\n- AI characters should respond to the user's current turn and maintain continuity without aggressively initiating unrelated new story beats.\n- They may still answer, react, follow through, and take sensible immediate actions when the scene calls for it.`;
  };

  const renderNsfwIntensity = (): string => {
    const nsfwIntensity = appData.uiSettings?.nsfwIntensity || 'normal';
    if (nsfwIntensity === 'high') {
      return `NSFW INTENSITY: High\n- High intensity does not force every scene to become sexual. Non-sexual scenes should remain non-sexual unless attraction, intimacy, erotic tension, nudity, touch, or user direction naturally brings sexual content into focus.\n- When sexual content is active or clearly developing, write it directly instead of softening, fading out, or summarizing.\n- Use explicit, profane, anatomical, and erotic language when it fits the character and moment.\n- Write detailed sexual and sensory description: touch, pressure, heat, wetness, scent, taste, sound, breath, movement, arousal, restraint, urgency, hesitation, dominance, submission, shame, hunger, and pleasure.\n- Let AI characters pursue, initiate, tease, escalate, resist, yield, or take control when that behavior fits their personality, desire, relationship, and the current scene.\n- Kinks, fetishes, and sexual preferences listed in character cards are prominent motivators when the scene supports them, not background details to ignore.\n- Characters may notice and comment on sexually relevant details when those details are visible, felt, or contextually relevant.\n- During active erotic or arousal-heavy moments, sexual thoughts in parentheses are allowed when they add hidden intent or conflict.\n- Never use a thought that only restates what action or dialogue already made obvious.\n- Do not sanitize explicit sexual acts into vague romance-language or summary. If the scene is actively erotic, show the physical details, emotional reactions, and character-specific dialogue.\n- Always filter explicit content through the character's established personality traits and tone. A shy character does not suddenly become aggressive unless the story has earned that shift, and a dominant character may command or direct explicitly when that fits the established character.\n- Vulgarity levels should match the character, not a universal mode.`;
    }
    return `NSFW INTENSITY: Natural\n- Let intimate or sexual scenes develop organically when the narrative moves in that direction.\n- Engage authentically when sexual tension builds or the user initiates intimacy.\n- Balance explicit content with character development and story progression.\n- If the story moves away from sexual content, follow that direction naturally.\n- Character personality and boundaries guide their behavior in intimate situations.`;
  };

  const renderResponseDetail = (): string => {
    const responseVerbosity = appData.uiSettings?.responseVerbosity || 'balanced';
    if (responseVerbosity === 'concise') {
      return `RESPONSE DETAIL: Concise\n- Keep responses tight and punchy without flattening them into robotic prose.\n- Target: 2-3 sentences per character block.\n- Keep scene setting descriptions more concise while maintaining normal length external dialogue or internal thoughts.`;
    }
    if (responseVerbosity === 'detailed') {
      return `RESPONSE DETAIL: Detailed\n- Write rich, immersive responses with layered sensory detail.\n- Target: usually 3-5 paragraphs per character block. This is per character block, not the total response length.\n- Provide more descriptive scene setting details, sensory details, descriptive details that are appropriate and contribute to the story and what is occurring.`;
    }
    return `RESPONSE DETAIL: Balanced\n- Provide a balance between descriptive details of the scene and maintaining normal external dialogue and internal thought length.\n- Target: roughly 1-2 paragraphs per character block.`;
  };

  const renderRealismMode = (): string => {
    const realismEnabled = appData.uiSettings?.realismMode === true;
    if (realismEnabled) {
      return `REALISM MODE: On\n- Physical actions have realistic consequences based on physics, biology, environment, and human limits.\n- Minor harm may cause discomfort while allowing characters to continue.\n- Moderate harm should affect willingness, movement, mood, and decision-making.\n- Severe harm should create urgent distress, self-preservation, and realistic need to stop or seek care.\n- Injuries, exhaustion, fear, pain, intoxication, weather exposure, distance, visibility, and available resources should carry forward until addressed.\n- Pain does not automatically become pleasure without realistic character-specific progression.\n- Characters do not ignore severe harm just because the user continues.`;
    }
    return `REALISM MODE: Off\n- Heightened fiction is allowed, but immediate scene logic must still make sense.\n- Preserve causal continuity from the latest canon turn to the next one.\n- Environmental constraints still matter when relevant.\n- Do not invent capabilities, objects, injuries, or obstacles that were not established or reasonably present.\n- Do not have characters contradict their own immediate reasoning unless the contradiction is intentional and explained in-scene.`;
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
    renderMainAiCharacters(),
    renderSideAiCharacters(),
    renderUserCharacters(),
    renderMemoryAndSceneState(),
    renderDialogRules(),
    renderChatSettings(),
  ].filter(Boolean).join('\n\n');
}

export const conciseStyleHints = [
  '[Style: lean into dialogue this time, keep narration minimal]',
  '[Style: stay lean, but make each line feel complete and natural]',
  '[Style: lead with a character DOING something, not describing]',
  '[Style: keep it lean, but let the beat breathe long enough to feel complete]',
  '[Style: dialogue-forward, minimal description]',
  '[Style: start with action; something physically changes in the scene]',
  '[Style: character makes a snap decision and acts on it immediately]',
  '[Style: character makes a snap decision and follows through immediately]',
];

export const balancedStyleHints = [
  '[Style: one character drives this beat; others react briefly in narration]',
  '[Style: try a different paragraph structure than your last response]',
  '[Style: character takes a decisive action that changes the scene dynamics]',
  '[Style: open with something happening; movement or sound changes the scene]',
  '[Style: open with dialogue, weave action through it]',
  '[Style: lead with a character making a choice, then show the fallout]',
  '[Style: skip internal thoughts this time; show everything through action and speech]',
  '[Style: something unexpected happens; surprise the reader]',
];

export const detailedStyleHints = [
  '[Style: draw out this moment with sensory detail -- what does it feel like?]',
  '[Style: build tension through a sequence of escalating physical actions]',
  '[Style: focus on physical sensations and sounds, not just actions]',
  '[Style: character initiates something new that shifts the power dynamic]',
  '[Style: extend the scene -- layer senses and emotion]',
  '[Style: lead with an environmental change that forces a reaction]',
  '[Style: build a slow, deliberate moment; let tension simmer through silence and gesture]',
  '[Style: character reveals something through action, not words or thoughts]',
];

export function getRandomStyleHint(verbosity: 'concise' | 'balanced' | 'detailed' = 'balanced'): string {
  const hintMap = { concise: conciseStyleHints, balanced: balancedStyleHints, detailed: detailedStyleHints };
  const hints = hintMap[verbosity] || balancedStyleHints;
  return hints[Math.floor(Math.random() * hints.length)];
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
  lengthDirective?: string,
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
  const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: systemInstruction },
    ...conversation.messages.map(m => ({
      role: m.role === 'assistant' ? 'assistant' as const : 'user' as const,
      content: m.text
    })),
  ];

  const finalUserContent = [
    sessionMessageCount != null ? `[SESSION: Message ${sessionMessageCount} of current session]` : '',
    lengthDirective || '',
    `${userMessage}${regenerationDirective}`.trim(),
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  messages.push({ role: 'user', content: finalUserContent });

  if (import.meta.env.DEV) {
    console.debug(`[llm.ts] Calling chat edge function with model: ${modelId}`);
  }

  // Emit call-1 telemetry for every chat turn; test-session mirroring is gated server-side
  // by active ai_usage_test_sessions so no client-local toggle is required.
  const shouldTrackCall1 = true;
  const systemChars = systemInstruction.length;
  const historyChars = conversation.messages.reduce((sum, msg) => sum + (msg.text?.length || 0), 0);
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
      conversation,
      systemInstruction,
      messages,
      finalUserInput: userMessage,
    }),
      diagnostics: {
        modelId,
        messageCount: messages.length,
        historyCount: conversation.messages.length,
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
      body: JSON.stringify({
        messages,
        modelId,
        stream: true,
        max_tokens: maxTokens,
        pipeline: 'direct',
        debugTrace: options?.debugTrace === true,
        roleplayContext: {
          conversationId,
          currentDay: currentDay ?? null,
          currentTimeOfDay: currentTimeOfDay ?? null,
          activeSceneTitle: activeScene?.title || null,
          activeSceneTags: activeScene?.tags || [],
          aiCharacterNames,
          userCharacterNames,
          characterSceneStates,
        },
      })
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
      throw new Error("It seems your story got a bit too spicy for the model. Change up the story and try again.");
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

        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) {
          outputChars += content.length;
          yield content;
        }
      } catch {
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
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) {
          outputChars += content.length;
          yield content;
        }
      } catch { /* ignore */ }
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
