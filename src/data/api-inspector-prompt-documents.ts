import { ASSISTANT_STRUCTURE_REMINDER_TEXT, getSystemInstruction, REGENERATION_DIRECTIVE_TEXT, renderActiveNsfwContextReminder, renderResponseDetailInstruction, RESPONSE_PRIORITY_CHECK_TEXT } from "@/services/llm";
import type { Character, Memory, ScenarioData, Scene, TimeOfDay } from "@/types";

export type ApiInspectorPromptDocumentId = "api-call-1" | "api-call-2-support";

export interface ApiInspectorPromptDocument {
  id: ApiInspectorPromptDocumentId;
  buttonLabel: string;
  title: string;
  modalLabel: string;
  description: string;
  body: string;
}

type UiSettings = NonNullable<ScenarioData["uiSettings"]>;

const now = 1778882400000;

const basePhysicalAppearance = {
  hairColor: "{{character.physicalAppearance.hairColor}}",
  eyeColor: "{{character.physicalAppearance.eyeColor}}",
  build: "{{character.physicalAppearance.build}}",
  bodyHair: "{{character.physicalAppearance.bodyHair}}",
  height: "{{character.physicalAppearance.height}}",
  breastSize: "{{character.physicalAppearance.breastSize}}",
  genitalia: "{{character.physicalAppearance.genitalia}}",
  skinTone: "{{character.physicalAppearance.skinTone}}",
  makeup: "{{character.physicalAppearance.makeup}}",
  bodyMarkings: "{{character.physicalAppearance.bodyMarkings}}",
  temporaryConditions: "{{character.physicalAppearance.temporaryConditions}}",
  _extras: [{ id: "pa-extra", label: "{{physicalAppearance.customLabel}}", value: "{{physicalAppearance.customValue}}" }],
};

const baseCurrentlyWearing = {
  top: "{{character.currentlyWearing.top}}",
  bottom: "{{character.currentlyWearing.bottom}}",
  undergarments: "{{character.currentlyWearing.undergarments}}",
  miscellaneous: "{{character.currentlyWearing.miscellaneous}}",
  _extras: [{ id: "cw-extra", label: "{{currentlyWearing.customLabel}}", value: "{{currentlyWearing.customValue}}" }],
};

const basePreferredClothing = {
  casual: "{{character.preferredClothing.casual}}",
  work: "{{character.preferredClothing.work}}",
  sleep: "{{character.preferredClothing.sleep}}",
  undergarments: "{{character.preferredClothing.undergarments}}",
  miscellaneous: "{{character.preferredClothing.miscellaneous}}",
  _extras: [{ id: "pc-extra", label: "{{preferredClothing.customLabel}}", value: "{{preferredClothing.customValue}}" }],
};

function makeCharacter(name: string, controlledBy: "AI" | "User", role: "Main" | "Side"): Character {
  return {
    id: `${name.toLowerCase()}-${role.toLowerCase()}`,
    name,
    nicknames: `{{${name}.nicknames}}`,
    age: `{{${name}.age}}`,
    sexType: `{{${name}.sexType}}`,
    sexualOrientation: `{{${name}.sexualOrientation}}`,
    location: `{{${name}.location}}`,
    scenePosition: `{{${name}.scenePosition}}`,
    currentMood: `{{${name}.currentMood}}`,
    controlledBy,
    characterRole: role,
    roleDescription: `{{${name}.roleDescription}}`,
    tags: `{{${name}.tags}}`,
    avatarDataUrl: "",
    physicalAppearance: basePhysicalAppearance,
    currentlyWearing: baseCurrentlyWearing,
    preferredClothing: basePreferredClothing,
    personality: {
      splitMode: true,
      traits: [
        { id: `${name}-trait`, label: `{{${name}.personality.trait.label}}`, value: `{{${name}.personality.trait.value}}`, flexibility: "normal" },
      ],
      outwardTraits: [
        { id: `${name}-outward`, label: `{{${name}.personality.outward.label}}`, value: `{{${name}.personality.outward.value}}`, flexibility: "normal" },
      ],
      inwardTraits: [
        { id: `${name}-inward`, label: `{{${name}.personality.inward.label}}`, value: `{{${name}.personality.inward.value}}`, flexibility: "normal" },
      ],
    },
    goals: [
      {
        id: `${name}-goal`,
        title: `{{${name}.goal.title}}`,
        desiredOutcome: `{{${name}.goal.desiredOutcome}}`,
        currentStatus: `{{${name}.goal.currentStatus}}`,
        progress: 25,
        flexibility: "normal",
        alignment: {
          goalId: `${name}-goal`,
          goalKind: "character",
          characterId: `${name.toLowerCase()}-${role.toLowerCase()}`,
          score: 58,
          status: "active",
          trend: "stable",
          supportCount: 1,
          resistanceCount: 0,
          driftCount: 0,
          lastSignal: "neutral",
        },
        steps: [
          { id: `${name}-step-open`, description: `{{${name}.goal.openMilestone}}`, completed: false },
          { id: `${name}-step-complete`, description: `{{${name}.goal.completedMilestone}}`, completed: true, completedDay: 1, completedTimeOfDay: "sunrise" },
        ],
        createdAt: now,
        updatedAt: now,
      },
    ],
    background: {
      jobOccupation: `{{${name}.background.jobOccupation}}`,
      educationLevel: `{{${name}.background.educationLevel}}`,
      residence: `{{${name}.background.residence}}`,
      hobbies: `{{${name}.background.hobbies}}`,
      financialStatus: `{{${name}.background.financialStatus}}`,
      motivation: `{{${name}.background.motivation}}`,
      _extras: [{ id: `${name}-background-extra`, label: `{{${name}.background.extraLabel}}`, value: `{{${name}.background.extraValue}}` }],
    },
    tone: {
      _extras: [{ id: `${name}-tone-extra`, label: `{{${name}.tone.extraLabel}}`, value: `{{${name}.tone.extraValue}}` }],
    },
    keyLifeEvents: {
      _extras: [{ id: `${name}-event-extra`, label: `{{${name}.keyLifeEvents.label}}`, value: `{{${name}.keyLifeEvents.value}}` }],
    },
    relationships: {
      _extras: [{ id: `${name}-relationship-extra`, label: `{{${name}.relationships.label}}`, value: `{{${name}.relationships.value}}` }],
    },
    secrets: {
      _extras: [{ id: `${name}-secret-extra`, label: `{{${name}.secrets.label}}`, value: `{{${name}.secrets.value}}` }],
    },
    fears: {
      _extras: [{ id: `${name}-fear-extra`, label: `{{${name}.fears.label}}`, value: `{{${name}.fears.value}}` }],
    },
    sections: [
      {
        id: `${name}-custom-section`,
        title: `{{${name}.customSection.title}}`,
        items: [
          { id: `${name}-custom-item`, label: `{{${name}.customSection.itemLabel}}`, value: `{{${name}.customSection.itemValue}}`, createdAt: now, updatedAt: now },
        ],
        createdAt: now,
        updatedAt: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
}

const defaultUiSettings: UiSettings = {
  showBackgrounds: true,
  transparentBubbles: false,
  darkMode: true,
  offsetBubbles: false,
  proactiveCharacterDiscovery: true,
  dynamicText: true,
  proactiveNarrative: true,
  narrativePov: "third",
  nsfwIntensity: "high",
  realismMode: false,
  responseVerbosity: "detailed",
  chatCanvasColor: "#121214",
  chatBubbleColor: "#2f3137",
  apiUsageTestTracking: true,
};

function makeScenario(uiOverrides: Partial<UiSettings> = {}): ScenarioData {
  return {
    version: 1,
    characters: [
      makeCharacter("{{AI_MAIN_CHARACTER_NAME}}", "AI", "Main"),
      makeCharacter("{{USER_CHARACTER_NAME}}", "User", "Main"),
    ],
    sideCharacters: [makeCharacter("{{AI_SIDE_CHARACTER_NAME}}", "AI", "Side") as any],
    world: {
      core: {
        scenarioName: "{{world.core.scenarioName}}",
        briefDescription: "{{world.core.briefDescription}}",
        storyPremise: "{{world.core.storyPremise}}",
        dialogFormatting: "{{world.core.dialogFormatting}}",
        structuredLocations: [
          { id: "location-1", label: "{{location.label}}", description: "{{location.description}}" },
        ],
        customWorldSections: [
          {
            id: "world-custom-section",
            title: "{{world.customSection.title}}",
            items: [{ id: "world-custom-item", label: "{{world.customSection.itemLabel}}", value: "{{world.customSection.itemValue}}" }],
          },
        ],
        storyGoals: [
          {
            id: "story-goal-1",
            title: "{{storyGoal.title}}",
            desiredOutcome: "{{storyGoal.desiredOutcome}}",
            currentStatus: "{{storyGoal.currentStatus}}",
            flexibility: "rigid",
            alignment: {
              goalId: "story-goal-1",
              goalKind: "story",
              score: 64,
              status: "supported",
              trend: "rising",
              supportCount: 2,
              resistanceCount: 0,
              driftCount: 0,
              lastSignal: "support",
            },
            steps: [
              { id: "story-step-open", description: "{{storyGoal.openMilestone}}", completed: false },
              { id: "story-step-complete", description: "{{storyGoal.completedMilestone}}", completed: true, completedDay: 1, completedTimeOfDay: "sunrise" },
            ],
            createdAt: now,
            updatedAt: now,
          },
        ],
      },
      entries: [
        { id: "lore-1", title: "{{loreEntry.title}}", body: "{{loreEntry.body}}", createdAt: now, updatedAt: now },
      ],
    },
    story: {
      openingDialog: {
        enabled: true,
        text: "{{story.openingDialog.text}}",
        startingDay: 1,
        startingTimeOfDay: "sunrise",
      },
    },
    scenes: [
      { id: "scene-1", url: "{{scene.url}}", title: "{{scene.title}}", tags: ["{{scene.tag}}"], isStartingScene: true, createdAt: now },
    ],
    contentThemes: {
      characterTypes: ["{{contentThemes.characterTypes.selectedTag}}"],
      storyType: "NSFW",
      genres: ["{{contentThemes.genres.selectedTag}}"],
      origin: ["{{contentThemes.origin.selectedTag}}"],
      triggerWarnings: ["{{contentThemes.triggerWarnings.selectedTag}}"],
      customTags: ["{{contentThemes.customTags.selectedTag}}"],
    },
    uiSettings: { ...defaultUiSettings, ...uiOverrides },
    conversations: [
      {
        id: "{{conversation.id}}",
        title: "{{conversation.title}}",
        messages: [
          { id: "history-user", role: "user", text: "{{prior user message inside the 9-message API Call 1 history cap}}", createdAt: now, day: 1, timeOfDay: "sunrise" },
          { id: "history-ai", role: "assistant", text: "{{prior assistant message inside the 9-message API Call 1 history cap}}", createdAt: now, day: 1, timeOfDay: "sunrise" },
        ],
        currentDay: 1,
        currentTimeOfDay: "sunrise",
        createdAt: now,
        updatedAt: now,
      },
    ],
    selectedModel: "grok-4.3",
    selectedArtStyle: "{{selectedArtStyle}}",
  };
}

const sampleMemories: Memory[] = [
  { id: "memory-synopsis", scenarioId: "{{scenario.id}}", conversationId: "{{conversation.id}}", day: 1, entryType: "synopsis", content: "{{memory.synopsis.content}}", sourceMessageId: "{{sourceMessageId}}", createdAt: now, updatedAt: now } as any,
  { id: "memory-bullet", scenarioId: "{{scenario.id}}", conversationId: "{{conversation.id}}", day: 2, entryType: "bullet", content: "{{memory.currentDayBullet.content}}", sourceMessageId: "{{sourceMessageId}}", createdAt: now, updatedAt: now } as any,
];

const sampleScene: Scene = {
  id: "{{activeScene.id}}",
  url: "{{activeScene.url}}",
  title: "{{activeScene.title}}",
  tags: ["{{activeScene.tag}}"],
  isStartingScene: false,
  createdAt: now,
};

function call1System(uiOverrides: Partial<UiSettings> = {}, currentTimeOfDay: TimeOfDay = "sunrise") {
  return getSystemInstruction(makeScenario(uiOverrides), 2, currentTimeOfDay, sampleMemories, true, sampleScene);
}

function extractSection(fullPrompt: string, sectionHeading: string): string {
  const marker = `--- ${sectionHeading} ---`;
  const start = fullPrompt.indexOf(marker);
  if (start === -1) return "";
  const next = fullPrompt.indexOf("\n\n--- SECTION ", start + marker.length);
  return (next === -1 ? fullPrompt.slice(start) : fullPrompt.slice(start, next)).trim();
}

const defaultCall1System = call1System();
const chatSettingBlockHeadings = [
  "NARRATIVE POV:",
  "CHARACTER DISCOVERY:",
  "PROACTIVE AI MODE:",
  "NSFW INTENSITY:",
  "RESPONSE DETAIL:",
  "REALISM MODE:",
];

function extractChatSettingBlock(fullPrompt: string, blockHeading: string): string {
  const sectionText = extractSection(fullPrompt, "SECTION 8 - CHAT SETTINGS PER USER PREFERENCE");
  const start = sectionText.indexOf(blockHeading);
  if (start === -1) return "";

  const nextStarts = chatSettingBlockHeadings
    .filter((heading) => heading !== blockHeading)
    .map((heading) => sectionText.indexOf(`\n\n${heading}`, start + blockHeading.length))
    .filter((index) => index !== -1);
  const next = nextStarts.length ? Math.min(...nextStarts) : sectionText.length;
  return sectionText.slice(start, next).trim();
}

const call1SettingGroups = [
  {
    label: "Narrative POV",
    branches: [
      ["First Person", extractChatSettingBlock(call1System({ narrativePov: "first" }), "NARRATIVE POV:")],
      ["Third Person", extractChatSettingBlock(call1System({ narrativePov: "third" }), "NARRATIVE POV:")],
    ],
  },
  {
    label: "Character Discovery",
    branches: [
      ["Proactive / On", extractChatSettingBlock(call1System({ proactiveCharacterDiscovery: true }), "CHARACTER DISCOVERY:")],
      ["Strict / Off", extractChatSettingBlock(call1System({ proactiveCharacterDiscovery: false }), "CHARACTER DISCOVERY:")],
    ],
  },
  {
    label: "Proactive AI Mode",
    branches: [
      ["On", extractChatSettingBlock(call1System({ proactiveNarrative: true }), "PROACTIVE AI MODE:")],
      ["Off", extractChatSettingBlock(call1System({ proactiveNarrative: false }), "PROACTIVE AI MODE:")],
    ],
  },
  {
    label: "NSFW Intensity",
    branches: [
      ["Normal", extractChatSettingBlock(call1System({ nsfwIntensity: "normal" }), "NSFW INTENSITY:")],
      ["High", extractChatSettingBlock(call1System({ nsfwIntensity: "high" }), "NSFW INTENSITY:")],
    ],
  },
  {
    label: "Response Detail",
    branches: [
      ["Concise", `${extractChatSettingBlock(call1System({ responseVerbosity: "concise" }), "RESPONSE DETAIL:")}\nREQUEST max_tokens: 1024`],
      ["Balanced", `${extractChatSettingBlock(call1System({ responseVerbosity: "balanced" }), "RESPONSE DETAIL:")}\nREQUEST max_tokens: 2048`],
      ["Detailed", `${extractChatSettingBlock(call1System({ responseVerbosity: "detailed" }), "RESPONSE DETAIL:")}\nREQUEST max_tokens: 3072`],
    ],
  },
  {
    label: "Realism Mode",
    branches: [
      ["Off", extractChatSettingBlock(call1System({ realismMode: false }), "REALISM MODE:")],
      ["On", extractChatSettingBlock(call1System({ realismMode: true }), "REALISM MODE:")],
    ],
  },
];

const call1SettingsVariantDoc = call1SettingGroups
  .map((group) => [
    `--- ${group.label.toUpperCase()} ---`,
    ...group.branches.map(([label, text]) => `// Sent when ${group.label} = ${label}\n${text}`),
  ].join("\n\n"))
  .join("\n\n");

const call1SettingsMatrixSection = `--- SECTION 8 - CHAT SETTINGS PER USER PREFERENCE ---

// STATIC REVIEW NOTE:
// This review document shows every possible chat-setting injection branch grouped under its setting.
// A real API Call 1 request sends only one branch per group based on the user's current chat settings.
// The exact branch text below is generated from the same getSystemInstruction() renderer used by the live call.

${call1SettingsVariantDoc}`;

const defaultCall1SystemForReview = defaultCall1System.replace(
  extractSection(defaultCall1System, "SECTION 8 - CHAT SETTINGS PER USER PREFERENCE"),
  call1SettingsMatrixSection,
);

const characterStateSyncSystemPrompt = `You are the post-turn CHARACTER STATE SYNC worker for an adult roleplay app. Your job is to compare the latest exchange against the current saved character cards and return only supported field updates that materially changed.

--- CURRENT STORY CLOCK ---
{{storyClock}}

The app code owns timestamps. Do not invent day/time metadata. If an accepted update is saved, the backend will stamp it with the current story clock and source message/generation.

{{eligibleConstraint}}
--- CURRENT CHARACTER STATE ---
{{characterContext || 'No eligible character data provided'}}

--- SUPPORTED FIELD PATHS ---
Top-level fields:
- age
- sexType
- sexualOrientation
- roleDescription
- nicknames
- location
- scenePosition
- currentMood

Nested detail fields:
- physicalAppearance.* and physicalAppearance._extras
- currentlyWearing.* and currentlyWearing._extras
- preferredClothing.* and preferredClothing._extras
- background.* and background._extras

Structured sections:
- personality.traits
- personality.outwardTraits
- personality.inwardTraits
- personality.splitMode
- personality.miscellaneous
- personality.secrets
- personality.fears
- personality.kinksFantasies
- personality.desires
- tone._extras
- keyLifeEvents._extras
- relationships._extras
- secrets._extras
- fears._extras
- sections.SectionTitle.ItemLabel

Character goals:
- goals.GoalTitle

--- CORE TASK ---
- Review the latest user message and AI response against every supported field for each eligible character.
- Return an update when the latest exchange changes, reveals, corrects, progresses, completes, or contradicts a supported field.
- Return no update when the existing card is still accurate or when the evidence is weak.
- Use the real field path from SUPPORTED FIELD PATHS. Never create fake containers such as sections.Goals.* when goals.* exists.
- Preserve current card information unless the latest exchange gives a clear reason to change it.

--- FIELD GUIDANCE ---
- currentMood: emotional/psychological state only, max 12 words. No body-part prose, clothing, objects, or action sequences.
- location: broad place only. Do not change location to a destination merely because it was seen, mentioned, chosen, or approached. Update it only when the exchange clearly establishes that the character has actually arrived in, entered, left, or relocated to a different broad place.
- scenePosition: volatile immediate placement within the broad place. Update it whenever the latest exchange clearly changes where the character is right now: approaching, standing outside, blocked at an entrance, partially inside, fully inside, separated, hiding, restrained, positioned near another character, or positioned near an important object. Preserve in-transit states such as still approaching, visible ahead, separated from, outside, or not yet reached. Do not leave scenePosition blank when the current exchange clearly establishes immediate placement.
- appearance/clothing/background: update when the exchange explicitly reveals or changes the fact.
- personality/tone/relationships/secrets/fears/keyLifeEvents: write "Label: Description" as the value. Prefer refining a matching existing entry over adding a duplicate.
- custom sections: use sections.SectionTitle.ItemLabel only when the information belongs in an existing or clearly appropriate custom section. Do not use custom sections to avoid the structured fields above.

--- CHARACTER GOALS ---
- Use goals.GoalTitle only for durable objectives that remain meaningful beyond the current scene. Do not save momentary actions, current-scene logistics, routine movement, object interaction, or one-turn decisions as goals.
- Prefer updating an existing goal over creating a near-duplicate. Respect the goal's guidance_strength when present: rigid goals change only with strong evidence, normal goals update when clearly advanced, and flexible goals can shift when the scene repeatedly carries them elsewhere.
- For existing goals, update only current_status, progress, and complete_steps. Do not send new_steps for an existing goal, and do not replace an existing goal's step list.
- Create a brand-new goal only when the latest exchange clearly establishes a sustained objective that is not already covered by an existing goal.
- For brand-new goals, include desired_outcome, current_status, progress, and new_steps.
- The desired_outcome describes the ultimate sustained result of the goal: what becomes true when the goal is meaningfully achieved.
- New steps must be logical milestone stages that naturally build toward that desired_outcome.
- Create or advance goal steps only for major, durable shifts in knowledge, relationship, access, commitment, capability, status, safety, resources, or circumstances that will still matter many scenes later.
- A good step changes the ongoing story state after it happens. It should still matter later. It should not merely describe the next physical movement, object interaction, line of dialogue, one-turn decision, or scene chore.
- Examples are structural only. Do not copy their subject matter, genre, relationship type, setting, kink, or wording into unrelated stories.
- If a proposed goal or step would normally be completed within the current exchange or the next few exchanges, it is too granular to save. Leave it in the live scene instead of turning it into saved state.
- Use complete_steps only for existing steps that were clearly completed.
- Do not remove completed goals. When all steps are complete, preserve the goal and update current_status to show that the desired outcome is now part of the ongoing story.

--- CONSERVATIVE UPDATE RULES ---
- Empty updates are valid and preferred over low-confidence edits.
- Do not emit unchanged values.
- Do not reword existing values just to make them sound better.
- Do not add duplicate traits, tone entries, relationship entries, goals, or custom-section items under slightly different labels.
- Do not update characters outside ELIGIBLE CHARACTERS.
- Do not output unsupported fields; unsupported fields will be ignored.

--- OUTPUT JSON ---
Return only this JSON shape:
{
  "updates": [
    { "character": "CharacterName", "field": "currentMood", "value": "Nervous but determined" },
    { "character": "CharacterName", "field": "scenePosition", "value": "beside the relevant scene object" },
    { "character": "CharacterName", "field": "relationships._extras", "value": "OtherCharacter: Trusted after sharing important information" },
    { "character": "CharacterName", "field": "goals.Rebuild Trust", "value": "current_status: First honest conversation happened. | progress: 25 | complete_steps: 1" },
    { "character": "CharacterName", "field": "goals.Establish Lasting Dynamic", "value": "desired_outcome: CharacterName and OtherCharacter establish a sustained relationship dynamic that changes how they make decisions, communicate, and behave together. | current_status: Goal newly established. | progress: 0 | new_steps: Step 1: CharacterName tests whether OtherCharacter is receptive to the dynamic through low-pressure conversation or behavior. Step 2: CharacterName creates a repeated pattern that makes the dynamic part of their normal interactions. Step 3: CharacterName deepens the dynamic through a more meaningful commitment, ritual, agreement, or recurring behavior. Step 4: The characters confront the main resistance, uncertainty, or consequence preventing the dynamic from becoming stable. Step 5: The dynamic becomes an accepted part of the ongoing relationship and affects future choices." }
  ]
}

Return ONLY valid JSON. No explanations.`;

const characterStateSyncUserPrompt = `Analyze the latest exchange and return only material supported character-card deltas.

{{recentContext ? "RECENT CONVERSATION CONTEXT (for pattern detection):\\n" + recentContext : ""}}

---

{{userMessage ? "LATEST USER MESSAGE:\\n" + userMessage : ""}}

---

{{aiResponse ? "LATEST AI RESPONSE:\\n" + aiResponse : ""}}`;

const goalAlignmentSystemPrompt = `You are a precise goal-alignment classifier. Return valid JSON only.`;

const goalAlignmentUserPrompt = `You are the post-turn GOAL ALIGNMENT evaluator for an adult roleplay app.

Your job is NOT to write story text, create new goals, complete goal steps, or update character cards.
Your only job is to judge whether the latest exchange shows the user and scene supporting, resisting, drifting away from, or not engaging each existing goal.

--- STORY CLOCK ---
{{storyClock}}

--- RECENT CONTEXT ---
{{recentContext || "(none provided)"}}

--- LATEST USER MESSAGE ---
{{userMessage || "(empty)"}}

--- LATEST AI RESPONSE ---
{{aiResponse || "(empty)"}}

--- GOALS TO EVALUATE ---
{{goalsContext}}

--- CLASSIFICATION RULES ---
For each goal, choose exactly one signal:
- support: The latest exchange accepts, enables, follows, advances, or becomes more receptive to this goal.
- resistance: The user explicitly refuses, blocks, contradicts, rejects, avoids, or pushes back against this goal or an AI attempt to move toward it.
- drift: The user or scene keeps moving elsewhere without directly rejecting the goal. Use this when the goal is becoming less central because the roleplay is naturally carrying away from it.
- neutral: The goal is present as background but the exchange does not meaningfully change alignment.
- not_applicable: The goal has no real connection to this exchange.

Intensity:
- 0: no meaningful signal
- 1: weak signal
- 2: clear signal
- 3: strong signal

Important:
- Evaluate alignment only. Do not judge whether a step is completed.
- Do not penalize a goal just because it did not appear in a single turn. Use drift only when the user or scene is actively carrying away from it.
- Rigid, normal, and flexible are guidance strengths, not signals. Classify the exchange evidence; the app code will apply different scoring rates later.
- Empty or mostly not_applicable results are valid.

Respond in JSON only:
{
  "evaluations": [
    {
      "goalId": "...",
      "goalKind": "story|character",
      "characterId": null,
      "signal": "support|resistance|drift|neutral|not_applicable",
      "intensity": 0,
      "rationale": "One concise reason.",
      "evidence": "Short quote or paraphrase from this exchange."
    }
  ]
}`;

const memoryExtractionSystemPrompt = `You are a story memory curator for an adult roleplay. Your job is to identify only durable events from the latest user+AI exchange that will affect future scenes and narrative consistency.

CHARACTERS: {{characterNames?.join(', ') || 'Unknown'}}

--- EXTRACT ---
- Relationship milestones, intimacy milestones, durable agreements, promises, rules, secrets revealed, major decisions, injuries, pregnancy/status changes, persistent location changes, appearance changes, or new backstory that would cause a future inconsistency if forgotten.
- Include facts introduced by the USER even if the AI response did not repeat them.
- Use past tense and include character names.

--- IGNORE ---
- Minor gestures, routine actions, mood-only beats, atmosphere, flirting/buildup without consequence, or lines that do not reveal new information.

--- RULES ---
- Return 0-3 events maximum.
- Empty array is valid when nothing durable happened.
- Keep each point under 90 characters.
- For preferences, intentions, rules, or secrets, state who they belong to.

Return ONLY a JSON array of durable event strings.
Empty array is acceptable: []`;

const sideCharacterSystemPrompt = `You are a creative writing assistant specialized in character creation for roleplay stories. You generate detailed, consistent character profiles. Return ONLY valid JSON with no markdown code blocks or extra formatting.`;

const sideCharacterUserPrompt = `Based on this character's first appearance in a roleplay story, generate a detailed profile.

CHARACTER NAME: {{name}}
FIRST APPEARANCE DIALOG: {{dialogContext}}
EXTRACTED TRAITS: {{JSON.stringify(extractedTraits || {})}}
WORLD CONTEXT: {{worldContext || 'Modern setting'}}

Generate a JSON object with these fields (be creative but consistent with the dialog context):
- nicknames: comma-separated string of alternative names, pet names, or aliases this character might be called (can be empty if none)
- age: estimated age as string (e.g., "25", "mid-30s")
- sexType: sex/gender identity (e.g., "Female", "Male", "Non-binary")
- sexualOrientation: sexual orientation (e.g., "Heterosexual", "Bisexual", "Homosexual", "Pansexual")
- roleDescription: their role in the story - what they do or their relationship to other characters (1 sentence)
- physicalAppearance: object with these fields (fill in what can be inferred, leave empty string if unknown):
  - hairColor: string
  - eyeColor: string
  - build: string (e.g., "Athletic", "Slim", "Curvy")
  - height: string (e.g., "Tall", "Average", "Short")
  - skinTone: string
  - bodyHair: string
  - breastSize: string (if applicable)
  - genitalia: string (if mentioned)
  - makeup: string
  - bodyMarkings: string
  - temporaryConditions: string
- currentlyWearing: object with:
  - top: string
  - bottom: string
  - undergarments: string
  - miscellaneous: string
- background: object with:
  - relationshipStatus: string (e.g., "Single", "Married", "Unknown")
  - residence: string (where they live)
  - educationLevel: string
- personality: object with:
  - traits: array of 1-2 personality traits as strings
  - miscellaneous: string (other personality notes)
  - secrets: string (a secret they might have)
  - fears: string
  - kinksFantasies: string (if applicable to adult content)
  - desires: string (what they want)
- avatarPrompt: a detailed image generation prompt for creating their portrait (describe their appearance for an AI image generator)

Return ONLY valid JSON, no markdown formatting.`;

const avatarSystemPrompt = `You are a concise image prompt writer. Your task is to write a SHORT, focused character portrait prompt.

STRICT RULES:
1. Output ONLY the prompt text - no explanations, no quotes, no prefixes
2. Keep the prompt under {{maxLength}} characters
3. Focus on: face, expression, lighting, composition, art style
4. Prioritize the most visually distinctive features
5. Use comma-separated descriptors, not sentences
6. If style info is provided, incorporate it briefly`;

const avatarUserPrompt = `Write an image generation prompt for a character portrait.

Character: {{characterName}}
Description: {{avatarPrompt}}
{{stylePrompt ? "Style: " + stylePrompt.split(".")[0] : ""}}
{{negativePrompt ? "Avoid: " + negativePrompt : ""}}

Write a focused prompt under {{maxLength}} characters:`;

const characterEnhancementPromptFamilies = `// These are the exact currently implemented prompt families in src/services/character-ai.ts.
// The runtime fills in fullContext, selfContext, field labels, current values, user guidance, and empty field lists.

CHARACTER FIELD - GENERATE LABEL + DESCRIPTION
You are a character creation assistant for an interactive roleplay scenario.

You need to generate BOTH a short label/name AND a description for a {{sectionHint}} field on this character.

RULES:
1. The LABEL should be 1-4 words — a concise name for this trait/detail (e.g. "Loyal", "Childhood Trauma", "Raspy Voice")
2. The DESCRIPTION should be 1-2 sentences explaining/expanding on it
3. Look at all existing character data and world context to determine what trait/detail would be most fitting and NOT duplicate existing ones
4. Stay consistent with the character's established identity
5. NO purple prose. Be factual and story-relevant.
{{SECTION-SPECIFIC GUIDANCE}}
WORLD & SCENARIO CONTEXT:
{{fullContext}}

THIS CHARACTER'S EXISTING DATA:
{{selfContext || 'No data filled yet.'}}

{{currentValueSection}}SECTION TYPE: {{sectionHint}}

You MUST respond in EXACTLY this format (two lines, no extra text):
LABEL: <your label here>
DESCRIPTION: <your description here>

CHARACTER FIELD - PRECISE MODE
You are enhancing a character field for an interactive roleplay.

Expand the following character detail into 3-5 short tags separated by semicolons.
Focus on visual or key attributes only. No sentences, no explanations, no narrative rationale.
If a specific subject is provided below, every tag must reinforce THAT exact subject. Do not rename it or switch to a different concept.

WORLD & SCENARIO CONTEXT:
{{fullContext}}

THIS CHARACTER'S EXISTING DATA:
{{selfContext || 'No data filled yet.'}}

{{subjectSection}}{{currentValueSection}}FIELD TYPE: {{label}}
{{rowSubject ? 'Treat the specific subject above as binding context for the output.' : ''}}INSTRUCTION: {{fieldConfig.instruction}}

Output format: Tag1; Tag2; Tag3; Tag4
Return ONLY the semicolon-separated tags. Nothing else.

CHARACTER FIELD - DETAILED MODE
You are enhancing a character field for an interactive roleplay. Use STRUCTURED EXPANSION:

RULES:
1. Be concise and factual (max {{fieldConfig.maxSentences}} sentences)
2. Focus on narrative-relevant details - what matters for the story
3. NO purple prose or flowery language
4. Format: State the fact, then its implication if relevant
5. {{currentValue.trim() ? 'Preserve the existing content's intent while enhancing it' : 'Generate appropriate content from available context'}}
6. Stay consistent with all existing character data and world context below
7. If a specific subject or row label is provided below, expand THAT exact subject. Do not rename it, contradict it, or drift to a different concept.

WORLD & SCENARIO CONTEXT:
{{fullContext}}

THIS CHARACTER'S EXISTING DATA:
{{selfContext || 'No data filled yet.'}}

{{subjectSection}}{{currentValueSection}}FIELD TYPE: {{label}}
INSTRUCTION: {{fieldConfig.instruction}}

Return ONLY the enhanced text. No explanations, no prefixes, no markdown formatting.`;

const worldEnhancementPromptFamilies = `// These are the exact currently implemented prompt families in src/services/world-ai.ts.
// The runtime fills in scenarioContext, subject labels, current values, field labels, and field instructions.

WORLD FIELD - GENERATE LABEL + DESCRIPTION
You are a story-building assistant for an interactive roleplay scenario.

You need to generate BOTH a short label/name AND a description for a structured world/story field.

RULES:
1. The LABEL should be 1-5 words and feel native to the current story/world.
2. The DESCRIPTION should be 1-3 concise sentences or fragments that explain or flesh out that label.
3. Use all available story context, character context, selected content tags, and lore context below.
4. Do NOT duplicate an existing field if a similar concept is already present elsewhere in the scenario.
5. Stay tightly consistent with the actual scenario premise, cast, and selected themes.
6. No purple prose, no generic filler, and no random worldbuilding that ignores the current setup.

STORY + CHARACTER CONTEXT:
{{scenarioContext}}

{{subjectSection}}{{currentValueSection}}FIELD TYPE: {{fieldConfig.label}}

You MUST respond in EXACTLY this format (two lines, no extra text):
LABEL: <your label here>
DESCRIPTION: <your description here>

WORLD FIELD - PRECISE MODE
You are enhancing a story field for an interactive roleplay.

Expand the following into 3-6 short key points separated by semicolons.
Focus on essential facts only. No sentences, no explanations, no narrative rationale.
If a specific subject is provided below, every point must reinforce THAT exact subject. Do not rename it, soften it, or switch to a different concept.

STORY + CHARACTER CONTEXT:
{{scenarioContext}}

{{subjectSection}}{{currentValueSection}}FIELD TYPE: {{fieldConfig.label}}
{{subjectLabel ? 'Treat the subject label as binding context for the output.' : ''}}INSTRUCTION: {{fieldConfig.instruction}}

Output format: Point1; Point2; Point3; Point4
Return ONLY the semicolon-separated points. Nothing else.

WORLD FIELD - DETAILED MODE
You are enhancing a story field for an interactive roleplay. Use STRUCTURED EXPANSION:

RULES:
1. Be concise and factual (max {{fieldConfig.maxSentences}} sentences)
2. Focus on narrative-relevant implications - what matters for the story
3. NO purple prose or flowery language
4. Format: State the fact, then its implication for gameplay/story
5. {{currentValue.trim() ? 'Preserve the existing content's intent while enhancing it' : 'Generate appropriate content from available context'}}
6. If a specific subject or row label is provided below, expand THAT exact subject. Do not rename it, contradict it, or drift into a different idea.
7. Use the story premise, character roster, selected tags, lore entries, and opening context below to stay grounded.

STORY + CHARACTER CONTEXT:
{{scenarioContext}}

{{subjectSection}}{{currentValueSection}}FIELD TYPE: {{fieldConfig.label}}
INSTRUCTION: {{fieldConfig.instruction}}

Return ONLY the enhanced text. No explanations, no prefixes, no markdown formatting.`;

function buildApiCall1Document() {
  return `// ROLEPLAY PIPELINE PROMPT REVIEW
// API CALL 1: LIVE ROLEPLAY GENERATION
// This document is generated from the current getSystemInstruction() renderer in src/services/llm.ts.
// The {{...}} values below stand in for live story, character, memory, and conversation data.
// In a real call, only one selected chat-setting branch is present in SECTION 8.
// For review, SECTION 8 below is expanded into a grouped branch matrix so every possible setting injection is visible in-place.

REQUEST TARGET
/functions/v1/chat

REQUEST BODY SHAPE
{
  "messages": [
    { "role": "system", "content": "<the full system message below>" },
    { "role": "user", "content": "{{up to 9 prior roleplay messages before the current turn}}" },
    { "role": "assistant", "content": "{{up to 9 prior roleplay messages before the current turn}}" },
    { "role": "user", "content": "[SESSION: Message {{sessionMessageCount}} of current session]\\n\\n{{adaptiveStyleDirective when triggered}}{{optionalOutputRevisionRequiredDirectiveOnContinueRetry}}\\n\\n{{latest user text OR continue instruction wrapper}}{{optional regeneration request}}\\n\\n{{selectedResponseDetailRules}}\\n\\n{{activeNsfwContextReminder when story type is NSFW}}\\n\\n{{responsePriorityCheck}}\\n\\n{{assistantStructureReminder}}" }
  ],
  "modelId": "grok-4.3",
  "stream": true,
  "max_tokens": "{{1024 concise | 2048 balanced | 3072 detailed}}",
  "pipeline": "direct",
  "debugTrace": "{{true only when requested}}",
  "roleplayContext": {
    "conversationId": "{{conversationId}}",
    "currentDay": "{{currentDay}}",
    "currentTimeOfDay": "{{currentTimeOfDay}}",
    "activeSceneTitle": "{{active scene title or null unless an explicit [SCENE] tag has been established}}",
    "activeSceneTags": "{{active scene tags or [] unless an explicit [SCENE] tag has been established}}",
    "aiCharacterNames": "{{AI-controlled character names}}",
    "userCharacterNames": "{{User-controlled character names}}",
    "characterSceneStates": "{{name/control/role/location/scenePosition/currentMood for all playable characters}}"
  }
}

GROK REQUEST BODY SENT BY CHAT EDGE FUNCTION
{
  "model": "grok-4.3",
  "messages": "<same messages array shown above>",
  "stream": true,
  "temperature": 0.7,
  "max_tokens": "{{1024 concise | 2048 balanced | 3072 detailed}}"
}

================================================================================
FULL SYSTEM MESSAGE GENERATED BY getSystemInstruction()
================================================================================

${defaultCall1SystemForReview}

================================================================================
REGENERATION REQUEST APPENDED TO FINAL USER MESSAGE ONLY WHEN REGENERATING
================================================================================

${REGENERATION_DIRECTIVE_TEXT}

================================================================================
CONTINUE REQUEST FINAL USER MESSAGE ONLY WHEN PRESSING CONTINUE
================================================================================

[CONTINUE INSTRUCTION]
Continue from after the latest visible assistant response. Do not restart from, paraphrase, or circle around an older user-authored scene turn.

BACKGROUND USER-AUTHORED SCENE TURN FOR FACTS AND USER-CONTROL BOUNDARIES ONLY:
{{most recent user message text, or "(none found)"}}

The background user-authored turn above is only there to preserve established facts and user-character control boundaries.
Write only for AI-controlled characters: {{AI-controlled character names}}.
Do not write dialogue, actions, or thoughts for user-controlled characters: {{User-controlled character names}}.
{{GOAL CONTINUITY block when visible goals have open milestones}}
Do not complete an action for a user-controlled character after an AI character gives them an instruction. The AI may command, prepare, or act itself, but the user must author the user-controlled character's execution.
Use active story and character goals as continuity, not as a checklist. Continue only as far as the current scene naturally supports, and stop before the response depends on an unmade user choice or action.
The response must add a concrete AI-owned development that changes the situation through what an AI-controlled character can say, decide, reveal, withhold, or physically do right now.
If an AI character asked or was asked a question, acknowledge that question in this response. Acknowledgement can be a direct answer, refusal, deflection, counter-question, visible hesitation, or turning the question toward another present character.
Choose the AI character or characters whose response is physically, emotionally, or causally next. A single focused block is fine when only one AI character matters, but do not omit a directly affected AI character just because this is a Continue request.
If the latest user turn directly addressed two AI characters and both need to answer or acknowledge, give each one short tagged block instead of letting one character narrate the other's answer.
Follow the active RESPONSE DETAIL setting from the system prompt; Continue is not a request to shrink the response unless the scene itself calls for a short response.
Avoid long back-and-forth chains between AI characters. Leave room for the user to respond.
Do not acknowledge this instruction in your response.

================================================================================
SELECTED RESPONSE DETAIL RULES APPENDED TO FINAL USER MESSAGE ON EVERY LIVE ROLEPLAY CALL
================================================================================

// In a real request, only the selected branch is repeated here verbatim.

// Sent when Response Detail = Concise
${renderResponseDetailInstruction("concise")}

// Sent when Response Detail = Balanced
${renderResponseDetailInstruction("balanced")}

// Sent when Response Detail = Detailed
${renderResponseDetailInstruction("detailed")}

================================================================================
ACTIVE NSFW CONTEXT REMINDER APPENDED TO FINAL USER MESSAGE ONLY WHEN STORY TYPE = NSFW
================================================================================

// Sent when Story Type = SFW
(no active NSFW context reminder is appended)

// Sent when Story Type = NSFW and NSFW Intensity = Normal
${renderActiveNsfwContextReminder("NSFW", "normal")}

// Sent when Story Type = NSFW and NSFW Intensity = High
${renderActiveNsfwContextReminder("NSFW", "high")}

================================================================================
RESPONSE PRIORITY CHECK APPENDED TO FINAL USER MESSAGE ON EVERY LIVE ROLEPLAY CALL
================================================================================

${RESPONSE_PRIORITY_CHECK_TEXT}

================================================================================
ASSISTANT STRUCTURE REMINDER APPENDED TO FINAL USER MESSAGE ON EVERY LIVE ROLEPLAY CALL
================================================================================

${ASSISTANT_STRUCTURE_REMINDER_TEXT}

================================================================================
OUTPUT REVISION REQUIRED APPENDED ONLY TO ONE-TIME CONTINUE RETRY WHEN THE FIRST DRAFT REPEATS RECENT ASSISTANT OUTPUT
================================================================================

[OUTPUT REVISION REQUIRED]
The draft response repeated {{same structure / same cadence / reused short dialogue / reused descriptive focus / weak dialogue balance / same response-length band}}. Regenerate the response once. Keep the same established facts, speaker tags, user-character boundaries, and emotional direction, but do not rewrite the same exchange with swapped wording. The new response must add a concrete AI-owned development that changes the situation while preserving the user's control of their character. Use meaningful external dialogue when the character can speak, and avoid reusing the same descriptive focus, sentence shape, or closing internal thought pattern.`;
}

function buildApiCall2SupportDocument() {
  return `// ROLEPLAY PIPELINE PROMPT REVIEW
// API CALL 2 + SUPPORT CALLS
// These are the current prompt texts sent to Grok/xAI by the post-turn and adjacent support calls.
// {{...}} values are runtime substitutions filled by the app before the request is sent.

================================================================================
API CALL 2: CHARACTER STATE SYNC
================================================================================

EDGE FUNCTION
/functions/v1/extract-character-updates

REQUEST BODY SHAPE SENT TO xAI
{
  "model": "grok-4.3",
  "messages": [
    { "role": "system", "content": "<system prompt below>" },
    { "role": "user", "content": "<user prompt below>" }
  ],
  "temperature": 0.15,
  "max_tokens": 8192
}

SYSTEM MESSAGE
${characterStateSyncSystemPrompt}

USER MESSAGE
${characterStateSyncUserPrompt}

================================================================================
SUPPORT CALL: GOAL ALIGNMENT EVALUATION
================================================================================

EDGE FUNCTION
/functions/v1/evaluate-goal-alignment

REQUEST BODY SHAPE SENT TO xAI
{
  "model": "grok-4.3",
  "messages": [
    { "role": "system", "content": "<system prompt below>" },
    { "role": "user", "content": "<user prompt below>" }
  ],
  "temperature": 0.15,
  "max_tokens": 2048
}

SYSTEM MESSAGE
${goalAlignmentSystemPrompt}

USER MESSAGE
${goalAlignmentUserPrompt}

================================================================================
SUPPORT CALL: MEMORY EXTRACTION
================================================================================

EDGE FUNCTION
/functions/v1/extract-memory-events

REQUEST BODY SHAPE SENT TO xAI
{
  "model": "grok-4.3",
  "messages": [
    { "role": "system", "content": "<system prompt below>" },
    { "role": "user", "content": "Extract durable story-memory events from this latest exchange:\n\n{{exchangeText}}" }
  ],
  "temperature": 0.3
}

SYSTEM MESSAGE
${memoryExtractionSystemPrompt}

================================================================================
SUPPORT CALL: SIDE-CHARACTER GENERATION
================================================================================

EDGE FUNCTION
/functions/v1/generate-side-character

REQUEST BODY SHAPE SENT TO xAI
{
  "model": "grok-4.3",
  "messages": [
    { "role": "system", "content": "<system prompt below>" },
    { "role": "user", "content": "<user prompt below>" }
  ],
  "temperature": 0.8
}

SYSTEM MESSAGE
${sideCharacterSystemPrompt}

USER MESSAGE
${sideCharacterUserPrompt}

================================================================================
SUPPORT CALL: SIDE-CHARACTER AVATAR PROMPT OPTIMIZATION
================================================================================

// This section is only for the side-character portrait path.
// It first asks xAI to condense the new side character's avatar prompt, then sends that optimized prompt to image generation.
// This is separate from the scene/cover image-generation calls documented later.

EDGE FUNCTION
/functions/v1/generate-side-character-avatar

TEXT OPTIMIZATION REQUEST BODY SENT TO xAI
{
  "model": "grok-4.3",
  "messages": [
    { "role": "system", "content": "<system prompt below>" },
    { "role": "user", "content": "<user prompt below>" }
  ],
  "max_tokens": 300,
  "temperature": 0.7
}

SYSTEM MESSAGE
${avatarSystemPrompt}

USER MESSAGE
${avatarUserPrompt}

IMAGE GENERATION REQUEST BODY SENT TO xAI
{
  "model": "grok-imagine-image",
  "prompt": "{{optimizedPrompt}}",
  "n": 1
}

================================================================================
SUPPORT CALL: CHARACTER FIELD ENHANCEMENT / AI FILL / AI GENERATE
================================================================================

FRONTEND SERVICE
src/services/character-ai.ts

${characterEnhancementPromptFamilies}

================================================================================
SUPPORT CALL: STORY/WORLD FIELD ENHANCEMENT
================================================================================

FRONTEND SERVICE
src/services/world-ai.ts

${worldEnhancementPromptFamilies}

================================================================================
SUPPORT CALL: REGENERATE / CONTINUE WRAPPERS
================================================================================

Regenerate is not a separate model family. It appends the REGENERATION REQUEST shown in the API Call 1 document to the final user message.
Continue is also not a separate model family. It builds a scoped current-turn user wrapper in src/components/chronicle/ChatInterfaceTab.tsx and sends it through API Call 1.

================================================================================
SUPPORT CALL: IMAGE GENERATION CALLS
================================================================================

// This section is only for scene and cover image generation.
// It is not the side-character avatar path above, and it is not part of the normal text roleplay turn.

/functions/v1/generate-scene-image and /functions/v1/generate-cover-image call xAI image/text endpoints with runtime-built prompts from the current scene/style/card context. These are adjacent image calls, not part of the normal text roleplay turn.`;
}

export const apiInspectorPromptDocuments: Record<ApiInspectorPromptDocumentId, ApiInspectorPromptDocument> = {
  "api-call-1": {
    id: "api-call-1",
    buttonLabel: "API Call 1",
    title: "API Call 1 - Current Roleplay Generation Prompt",
    modalLabel: "API Call 1 Current Prompt",
    description: "Source-backed view of the current live roleplay generation request sent to Grok.",
    body: buildApiCall1Document(),
  },
  "api-call-2-support": {
    id: "api-call-2-support",
    buttonLabel: "API Call 2 + Support Calls",
    title: "API Call 2 + Support Calls - Current Prompt Text",
    modalLabel: "API Call 2 + Support Calls Current Prompt",
    description: "Source-backed view of the current post-turn and adjacent support prompts sent to Grok/xAI.",
    body: buildApiCall2SupportDocument(),
  },
};

export const apiInspectorPromptDocumentList: ApiInspectorPromptDocument[] = [
  apiInspectorPromptDocuments["api-call-1"],
  apiInspectorPromptDocuments["api-call-2-support"],
];
