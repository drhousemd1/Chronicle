export type PhaseOneAuditStatus =
  | "connected"
  | "missing"
  | "partial"
  | "once-only"
  | "code-handled"
  | "not-in-prompt";

export type PhaseOneIssueType =
  | "MISSING FILE"
  | "MISSING CONTEXT"
  | "UNLABELED BLOCK"
  | "FORMAT MISMATCH"
  | "DEPRIORITIZED"
  | "STALE DATA"
  | "REDUNDANT"
  | "TRUNCATION RISK"
  | "FLOW BROKEN";

export interface PhaseOneAuditField {
  label: string;
  status: PhaseOneAuditStatus;
  detail: string;
  issueType?: PhaseOneIssueType;
  recommendation?: string;
}

export interface PhaseOneAuditContainer {
  id: string;
  title: string;
  description: string;
  fileRefs: Array<{ path: string; lines?: string; note?: string }>;
  codeSource?: string;
  fields: PhaseOneAuditField[];
}

export interface PhaseOneAuditGroup {
  id: string;
  title: string;
  description: string;
  containers: PhaseOneAuditContainer[];
}

export const phaseOneAuditGroups: PhaseOneAuditGroup[] = [
  {
    id: "story-builder",
    title: "Story Builder Containers (API Call 1 Mapping)",
    description:
      "Code-truth mapping from Story Builder fields to API Call 1 system prompt/context assembly.",
    containers: [
      {
        id: "story-card",
        title: "Audit: Story Card Container",
        description:
          "Scenario identity fields on the Story Builder page. Brief description should be available in prompt context; scenario title is currently used for app identity and some auxiliary prompts but not the main world context block.",
        fileRefs: [
          { path: "src/features/story-builder/StoryBuilderScreen.tsx" },
          { path: "src/types.ts", lines: "113-124" },
          { path: "src/services/llm.ts", lines: "203-211, 642-646" },
        ],
        codeSource:
          "WORLD CONTEXT currently starts with storyPremise/factions/locations/dialogFormatting/customWorld/storyGoals. scenarioName and briefDescription are not injected into this block.",
        fields: [
          {
            label: "Story Name (scenarioName)",
            status: "not-in-prompt",
            detail:
              "Not currently included in main API Call 1 world context block. Used in auxiliary prompts (e.g., brainstorm path), not primary narrative system instruction.",
          },
          {
            label: "Brief Description",
            status: "missing",
            detail:
              "Exists in data model/UI but is not serialized into WORLD CONTEXT for API Call 1.",
            issueType: "MISSING FILE",
            recommendation:
              "Inject briefDescription into WORLD CONTEXT near scenario premise so scene framing uses the authored summary.",
          },
        ],
      },
      {
        id: "story-details",
        title: "Audit: Story Details (World Core) Container",
        description:
          "Primary world-building payload currently serialized in llm.ts worldContext.",
        fileRefs: [
          { path: "src/features/story-builder/StoryBuilderScreen.tsx" },
          { path: "src/types.ts", lines: "113-124" },
          { path: "src/services/llm.ts", lines: "84-123, 203-211" },
        ],
        codeSource:
          "SCENARIO: storyPremise\nFACTIONS\nLOCATIONS (structuredLocations fallback to locations)\nDIALOG FORMATTING\nCUSTOM WORLD CONTENT (items only)\nSTORY GOALS",
        fields: [
          {
            label: "Story Premise",
            status: "connected",
            detail: "Serialized as SCENARIO in worldContext.",
          },
          {
            label: "Factions",
            status: "connected",
            detail: "Serialized in worldContext.",
          },
          {
            label: "Primary Locations (structured + legacy)",
            status: "connected",
            detail:
              "Structured locations are mapped; legacy plain-text locations are used as fallback.",
          },
          {
            label: "History Timeline",
            status: "missing",
            detail: "Field exists in WorldCore but is not included in worldContext assembly.",
            issueType: "MISSING FILE",
            recommendation: "Serialize historyTimeline into WORLD CONTEXT so chronology is model-visible.",
          },
          {
            label: "Tone Themes",
            status: "missing",
            detail: "Field exists in WorldCore but is not injected into API Call 1 prompt.",
            issueType: "MISSING FILE",
            recommendation: "Inject toneThemes into WORLD CONTEXT to stabilize tonal direction.",
          },
          {
            label: "Plot Hooks",
            status: "missing",
            detail: "Field exists in WorldCore but is currently omitted from worldContext.",
            issueType: "MISSING FILE",
            recommendation: "Serialize plotHooks so the model can reuse authored narrative hooks.",
          },
          {
            label: "Dialog Formatting",
            status: "connected",
            detail:
              "Serialized via getCriticalDialogRules + world.core.dialogFormatting merge.",
          },
          {
            label: "Custom World Content (structured items)",
            status: "connected",
            detail: "customWorldSections[].items label/value pairs are serialized.",
          },
          {
            label: "Custom World Content (freeformValue)",
            status: "missing",
            detail:
              "freeformValue exists in type model but is not serialized in customWorldContext assembly.",
            issueType: "FORMAT MISMATCH",
            recommendation:
              "Include freeformValue for sections typed as freeform so authored notes are not dropped.",
          },
        ],
      },
      {
        id: "story-goals",
        title: "Audit: Story Goals Container",
        description:
          "Global story goals are serialized with flexibility directives and step progress summary.",
        fileRefs: [
          { path: "src/components/chronicle/StoryGoalsSection.tsx" },
          { path: "src/types.ts", lines: "95-111" },
          { path: "src/services/llm.ts", lines: "97-123" },
        ],
        codeSource:
          "[RIGID|NORMAL|FLEXIBLE] Goal + Desired Outcome + Steps + computed Progress + directive text",
        fields: [
          {
            label: "Goal Name",
            status: "connected",
            detail: "Goal title serialized.",
          },
          {
            label: "Desired Outcome",
            status: "connected",
            detail: "desiredOutcome serialized when present.",
          },
          {
            label: "Guidance Strength (rigid/normal/flexible)",
            status: "connected",
            detail: "Flexibility mapped to directive behavior text in prompt.",
          },
          {
            label: "Steps + completion flags",
            status: "connected",
            detail: "Step list and completion-derived progress are serialized.",
          },
          {
            label: "currentStatus",
            status: "missing",
            detail:
              "StoryGoal.currentStatus exists in type but is not passed in current story goals serializer.",
            issueType: "MISSING FILE",
            recommendation: "Add currentStatus to serialized goal payload for explicit in-progress state.",
          },
        ],
      },
      {
        id: "opening-dialog",
        title: "Audit: Opening Dialog Container",
        description:
          "Opening scene and start-time controls. Opening text is intended for initialization context, not repeated every turn.",
        fileRefs: [
          { path: "src/features/story-builder/StoryBuilderScreen.tsx" },
          { path: "src/types.ts", lines: "22-32" },
          { path: "src/services/llm.ts", lines: "272-290" },
        ],
        fields: [
          {
            label: "Opening Dialog Text",
            status: "once-only",
            detail:
              "Should be injected once at session initialization only; not currently in recurring API Call 1 prompt assembly.",
          },
          {
            label: "Starting Day",
            status: "code-handled",
            detail:
              "Used to initialize conversation temporal state; runtime calls then rely on currentDay from session.",
          },
          {
            label: "Starting Time of Day",
            status: "code-handled",
            detail:
              "Used to initialize session time; recurring prompt uses live currentTimeOfDay temporal context.",
          },
          {
            label: "Current Day/Time Context",
            status: "connected",
            detail:
              "Temporal context block serializes current day + time description when values are provided.",
          },
          {
            label: "Time Advancement Mode/Interval",
            status: "code-handled",
            detail:
              "Frontend/session clock logic, not direct narrative prompt text.",
          },
        ],
      },
      {
        id: "scene-gallery",
        title: "Audit: Scene Gallery Container",
        description:
          "Scene images/tags used for background switching and scene context cues.",
        fileRefs: [
          { path: "src/features/story-builder/StoryBuilderScreen.tsx" },
          { path: "src/services/llm.ts", lines: "275, 651" },
        ],
        fields: [
          {
            label: "Scene Images (assets)",
            status: "code-handled",
            detail: "Image files stay in app/storage; they are not injected into text prompt.",
          },
          {
            label: "Available Scene Tags",
            status: "connected",
            detail: "All scene tags are serialized into AVAILABLE SCENES list.",
          },
          {
            label: "Active Scene Tag",
            status: "missing",
            detail:
              "Prompt has full available tag list but does not include explicit current active scene tag state.",
            issueType: "MISSING CONTEXT",
            recommendation:
              "Inject currently active scene tag as explicit context so model can align with current visual state.",
          },
        ],
      },
      {
        id: "art-style",
        title: "Audit: Art Style Preference Container",
        description:
          "Art style settings are used for image pipelines, not core narrative prompt behavior.",
        fileRefs: [
          { path: "src/features/story-builder/StoryBuilderScreen.tsx" },
          { path: "supabase/functions/generate-cover-image/index.ts" },
          { path: "supabase/functions/generate-scene-image/index.ts" },
        ],
        fields: [
          {
            label: "Art Style Selection",
            status: "not-in-prompt",
            detail:
              "Correctly excluded from API Call 1 narrative prompt; consumed by image-generation pipelines instead.",
          },
        ],
      },
      {
        id: "custom-rules",
        title: "Audit: Custom AI Rules Container",
        description:
          "Formatting and behavior directives injected through dialog formatting + instruction stack.",
        fileRefs: [
          { path: "src/services/llm.ts", lines: "44-78, 627-790" },
          { path: "src/types.ts", lines: "113-124" },
        ],
        fields: [
          {
            label: "Critical formatting wrappers (\"\", **, ())",
            status: "connected",
            detail: "Injected via getCriticalDialogRules into DIALOG FORMATTING.",
          },
          {
            label: "User custom dialog-formatting rules",
            status: "connected",
            detail:
              "world.core.dialogFormatting is appended after baseline critical rules.",
          },
        ],
      },
      {
        id: "content-themes",
        title: "Audit: Content Themes Container",
        description:
          "Theme/tag selection transformed into directive text via tag-injection registry.",
        fileRefs: [
          { path: "src/constants/tag-injection-registry.ts" },
          { path: "src/services/llm.ts", lines: "623-625, 643" },
        ],
        fields: [
          {
            label: "Character Types",
            status: "connected",
            detail: "Serialized via buildContentThemeDirectives output block.",
          },
          {
            label: "Story Type (SFW/NSFW)",
            status: "connected",
            detail: "Serialized via content theme directives.",
          },
          {
            label: "Genre",
            status: "connected",
            detail: "Serialized via content theme directives.",
          },
          {
            label: "Origin",
            status: "connected",
            detail: "Serialized via content theme directives.",
          },
          {
            label: "Trigger Warnings",
            status: "connected",
            detail: "Serialized via content theme directives.",
          },
          {
            label: "Custom Tags",
            status: "connected",
            detail: "Serialized via content theme directives.",
          },
        ],
      },
    ],
  },
  {
    id: "character-builder",
    title: "Character Builder Containers (CAST Serialization Audit)",
    description:
      "Code-truth mapping from Character Builder fields to CAST block and related prompt context in API Call 1.",
    containers: [
      {
        id: "character-basics",
        title: "Audit: Character Builder — Basics Container",
        description:
          "Top-level identity/control fields serialized into CAST character header and control lines.",
        fileRefs: [
          { path: "src/features/character-builder/CharacterBuilderScreen.tsx" },
          { path: "src/types.ts", lines: "228-266" },
          { path: "src/services/llm.ts", lines: "219-268" },
        ],
        codeSource:
          "CHARACTER: name (sexType) + NICKNAMES + SEXUAL ORIENTATION\nROLE\nCONTROL + LOCATION + MOOD\n...",
        fields: [
          { label: "Name", status: "connected", detail: "Serialized in CHARACTER header." },
          { label: "Nicknames", status: "connected", detail: "Serialized when non-empty." },
          {
            label: "Age",
            status: "missing",
            detail: "Character.age exists but is not included in CAST serialization.",
            issueType: "MISSING FILE",
            recommendation: "Add age to CAST block so age-sensitive narration is grounded.",
          },
          { label: "Sex / Identity (sexType)", status: "connected", detail: "Serialized in CHARACTER header." },
          {
            label: "Sexual Orientation",
            status: "connected",
            detail: "Serialized when non-empty.",
          },
          { label: "Controlled By", status: "connected", detail: "Serialized in CONTROL line." },
          { label: "Character Role", status: "connected", detail: "Serialized in ROLE line." },
          { label: "Location", status: "connected", detail: "Serialized when non-empty." },
          { label: "Current Mood", status: "connected", detail: "Serialized when non-empty." },
          {
            label: "Role Description",
            status: "missing",
            detail: "Field exists in Character model but not serialized in CAST block.",
            issueType: "MISSING FILE",
            recommendation: "Inject roleDescription for clearer narrative purpose anchoring.",
          },
          { label: "Tags", status: "connected", detail: "Serialized in TAGS line." },
        ],
      },
      {
        id: "character-physical",
        title: "Audit: Character Builder — Physical Appearance Container",
        description:
          "Physical base fields are currently omitted; only _extras rows are serialized.",
        fileRefs: [
          { path: "src/types.ts", lines: "159-172" },
          { path: "src/features/character-builder/utils/section-progress.ts", lines: "63-78" },
          { path: "src/services/llm.ts", lines: "227-236" },
        ],
        fields: [
          {
            label: "Hair Color",
            status: "partial",
            detail: "Base field not serialized; only _extras in ADDITIONAL ATTRIBUTES are sent.",
            issueType: "FORMAT MISMATCH",
            recommendation: "Serialize base physicalAppearance.hairColor in CAST payload.",
          },
          { label: "Eye Color", status: "partial", detail: "Base field omitted; _extras only.", issueType: "FORMAT MISMATCH", recommendation: "Serialize base eyeColor." },
          { label: "Build", status: "partial", detail: "Base field omitted; _extras only.", issueType: "FORMAT MISMATCH", recommendation: "Serialize base build." },
          { label: "Body Hair", status: "partial", detail: "Base field omitted; _extras only.", issueType: "FORMAT MISMATCH", recommendation: "Serialize base bodyHair." },
          { label: "Height", status: "partial", detail: "Base field omitted; _extras only.", issueType: "FORMAT MISMATCH", recommendation: "Serialize base height." },
          { label: "Breasts", status: "partial", detail: "Base field omitted (breastSize); _extras only.", issueType: "FORMAT MISMATCH", recommendation: "Serialize base breastSize." },
          { label: "Genitalia", status: "partial", detail: "Base field omitted; _extras only.", issueType: "FORMAT MISMATCH", recommendation: "Serialize base genitalia." },
          { label: "Skin Tone", status: "partial", detail: "Base field omitted; _extras only.", issueType: "FORMAT MISMATCH", recommendation: "Serialize base skinTone." },
          { label: "Makeup", status: "partial", detail: "Base field omitted; _extras only.", issueType: "FORMAT MISMATCH", recommendation: "Serialize base makeup." },
          { label: "Body Markings", status: "partial", detail: "Base field omitted; _extras only.", issueType: "FORMAT MISMATCH", recommendation: "Serialize base bodyMarkings." },
          { label: "Temporary Conditions", status: "partial", detail: "Base field omitted; _extras only.", issueType: "FORMAT MISMATCH", recommendation: "Serialize base temporaryConditions." },
          { label: "Custom rows (_extras)", status: "connected", detail: "Serialized into ADDITIONAL ATTRIBUTES." },
        ],
      },
      {
        id: "character-currently-wearing",
        title: "Audit: Character Builder — Currently Wearing Container",
        description:
          "Live clothing state fields are currently omitted except _extras rows.",
        fileRefs: [
          { path: "src/types.ts", lines: "174-180" },
          { path: "src/features/character-builder/utils/section-progress.ts", lines: "80-88" },
          { path: "src/services/llm.ts", lines: "232-236" },
        ],
        fields: [
          { label: "Top", status: "partial", detail: "Base field omitted; _extras only.", issueType: "FORMAT MISMATCH", recommendation: "Serialize currentlyWearing.top." },
          { label: "Bottom", status: "partial", detail: "Base field omitted; _extras only.", issueType: "FORMAT MISMATCH", recommendation: "Serialize currentlyWearing.bottom." },
          { label: "Undergarments", status: "partial", detail: "Base field omitted; _extras only.", issueType: "FORMAT MISMATCH", recommendation: "Serialize currentlyWearing.undergarments for line-of-sight reliability." },
          { label: "Miscellaneous", status: "partial", detail: "Base field omitted; _extras only.", issueType: "FORMAT MISMATCH", recommendation: "Serialize currentlyWearing.miscellaneous." },
          { label: "Custom rows (_extras)", status: "connected", detail: "Serialized into ADDITIONAL ATTRIBUTES." },
        ],
      },
      {
        id: "character-preferred-clothing",
        title: "Audit: Character Builder — Preferred Clothing Container",
        description:
          "Baseline clothing preference fields are currently omitted except _extras rows.",
        fileRefs: [
          { path: "src/types.ts", lines: "182-189" },
          { path: "src/features/character-builder/utils/section-progress.ts", lines: "90-99" },
          { path: "src/services/llm.ts", lines: "233-236" },
        ],
        fields: [
          { label: "Casual", status: "partial", detail: "Base field omitted; _extras only.", issueType: "FORMAT MISMATCH", recommendation: "Serialize preferredClothing.casual." },
          { label: "Work", status: "partial", detail: "Base field omitted; _extras only.", issueType: "FORMAT MISMATCH", recommendation: "Serialize preferredClothing.work." },
          { label: "Sleep", status: "partial", detail: "Base field omitted; _extras only.", issueType: "FORMAT MISMATCH", recommendation: "Serialize preferredClothing.sleep." },
          { label: "Undergarments", status: "partial", detail: "Base field omitted; _extras only.", issueType: "FORMAT MISMATCH", recommendation: "Serialize preferredClothing.undergarments." },
          { label: "Miscellaneous", status: "partial", detail: "Base field omitted; _extras only.", issueType: "FORMAT MISMATCH", recommendation: "Serialize preferredClothing.miscellaneous." },
          { label: "Custom rows (_extras)", status: "connected", detail: "Serialized into ADDITIONAL ATTRIBUTES." },
        ],
      },
      {
        id: "character-personality",
        title: "Audit: Character Builder — Personality Container",
        description:
          "Personality split/standard traits are serialized and used by trait adherence rules in instruction stack.",
        fileRefs: [
          { path: "src/components/chronicle/PersonalitySection.tsx" },
          { path: "src/services/llm.ts", lines: "145-201, 757-784" },
        ],
        fields: [
          {
            label: "Standard traits (label/value/flexibility/score/trend)",
            status: "connected",
            detail: "Serialized through personalityContext formatter.",
          },
          {
            label: "Split mode outward traits",
            status: "connected",
            detail: "Serialized and weighted with outward visibility bonus in code logic.",
          },
          {
            label: "Split mode inward traits",
            status: "connected",
            detail: "Serialized and weighted with inward suppression offset in code logic.",
          },
        ],
      },
      {
        id: "character-tone",
        title: "Audit: Character Builder — Tone Container",
        description:
          "Tone section currently serialized from extras rows. No dedicated example-dialogue field exists yet.",
        fileRefs: [
          { path: "src/features/character-builder/utils/section-progress.ts", lines: "112-115" },
          { path: "src/services/llm.ts", lines: "249-250, 769-774" },
        ],
        fields: [
          {
            label: "Tone rows (_extras)",
            status: "connected",
            detail: "Serialized via tone extras into TONE line.",
          },
          {
            label: "Example Dialogue field",
            status: "missing",
            detail: "Proposed field does not exist in current Character model or UI.",
            issueType: "MISSING FILE",
            recommendation:
              "Add optional exampleDialogue field and serialize into CAST for voice anchoring.",
          },
        ],
      },
      {
        id: "character-background",
        title: "Audit: Character Builder — Background Container",
        description:
          "Background core fields are serialized, plus extra rows.",
        fileRefs: [
          { path: "src/types.ts", lines: "193-205" },
          { path: "src/services/llm.ts", lines: "238-248" },
        ],
        fields: [
          { label: "Job / Occupation", status: "connected", detail: "Serialized in BACKGROUND line." },
          { label: "Education Level", status: "connected", detail: "Serialized in BACKGROUND line." },
          { label: "Residence", status: "connected", detail: "Serialized in BACKGROUND line." },
          { label: "Hobbies", status: "connected", detail: "Serialized in BACKGROUND line." },
          { label: "Financial Status", status: "connected", detail: "Serialized in BACKGROUND line." },
          { label: "Motivation", status: "connected", detail: "Serialized in BACKGROUND line." },
          { label: "Custom rows (_extras)", status: "connected", detail: "Serialized in BACKGROUND line." },
        ],
      },
      {
        id: "character-kle-relationships-secrets-fears",
        title: "Audit: Character Builder — KLE / Relationships / Secrets / Fears",
        description:
          "All four containers are currently serialized via extras rows.",
        fileRefs: [
          { path: "src/services/llm.ts", lines: "252-262" },
          { path: "src/features/character-builder/utils/section-progress.ts", lines: "128-142" },
        ],
        fields: [
          { label: "Key Life Events rows (_extras)", status: "connected", detail: "Serialized when non-empty." },
          { label: "Relationships rows (_extras)", status: "connected", detail: "Serialized when non-empty." },
          { label: "Secrets rows (_extras)", status: "connected", detail: "Serialized when non-empty." },
          { label: "Fears rows (_extras)", status: "connected", detail: "Serialized when non-empty." },
        ],
      },
      {
        id: "character-goals",
        title: "Audit: Character Builder — Goals & Desires Container",
        description:
          "Character goals are serialized with flexibility directives and step progress summary.",
        fileRefs: [
          { path: "src/components/chronicle/CharacterGoalsSection.tsx" },
          { path: "src/services/llm.ts", lines: "124-143" },
        ],
        fields: [
          { label: "Goal Name", status: "connected", detail: "Serialized from goal title." },
          { label: "Desired Outcome", status: "connected", detail: "Serialized when present." },
          {
            label: "Guidance Strength (rigid/normal/flexible)",
            status: "connected",
            detail: "Flexibility mapped to directive behavior text.",
          },
          { label: "Steps + completion state", status: "connected", detail: "Serialized with completion-derived progress." },
          {
            label: "currentStatus",
            status: "missing",
            detail: "CharacterGoal.currentStatus is not included in serialized goal lines.",
            issueType: "MISSING FILE",
            recommendation: "Serialize currentStatus to preserve explicit manual status context.",
          },
        ],
      },
      {
        id: "character-custom-content",
        title: "Audit: Character Builder — Custom Content Container",
        description:
          "Custom sections are serialized through legacy TRAITS mapping, but freeform section values are not currently emitted.",
        fileRefs: [
          { path: "src/types.ts", lines: "138-156" },
          { path: "src/services/llm.ts", lines: "220-221, 268" },
        ],
        fields: [
          {
            label: "Structured custom items (label=value)",
            status: "connected",
            detail: "Serialized via c.sections -> TRAITS mapping.",
          },
          {
            label: "Custom section freeformValue",
            status: "missing",
            detail: "freeformValue exists on CharacterTraitSection but is not serialized in TRAITS assembly.",
            issueType: "MISSING FILE",
            recommendation:
              "Include freeformValue in custom section serialization so authored text blocks are preserved.",
          },
        ],
      },
      {
        id: "side-characters-cast",
        title: "Audit: CAST Composition — Main/Side/User Control Coverage",
        description:
          "CAST block currently filters to AI-controlled characters only; user-controlled names are listed as exclusion guard.",
        fileRefs: [
          { path: "src/services/llm.ts", lines: "214-218, 647-649" },
          { path: "src/types.ts", lines: "227-231" },
        ],
        fields: [
          {
            label: "AI-controlled characters",
            status: "connected",
            detail: "Included in CAST via aiCharacters filter.",
          },
          {
            label: "User-controlled exclusion list",
            status: "connected",
            detail: "Names appended to DO NOT GENERATE FOR guard text.",
          },
          {
            label: "Side characters (context presence when not AI-controlled)",
            status: "missing",
            detail:
              "If side characters are user-controlled or otherwise excluded by AI filter, their card data is not represented in CAST context payload.",
            issueType: "MISSING CONTEXT",
            recommendation:
              "Inject lightweight side-character context block (name/role/location/summary) even when not AI-controlled, while preserving no-dialogue guardrails.",
          },
        ],
      },
    ],
  },
];
