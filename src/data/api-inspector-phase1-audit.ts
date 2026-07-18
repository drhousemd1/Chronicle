import {
  ROLEPLAY_PIPELINE_REVIEW_20260515,
  type ApiInspectorReview,
} from "./api-inspector-review";

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
  review?: ApiInspectorReview;
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
          "Scenario identity fields on the Story Builder page. Both fields are serialized directly into API Call 1 WORLD CONTEXT.",
        fileRefs: [
          { path: "src/features/story-builder/StoryBuilderScreen.tsx" },
          { path: "src/types.ts", lines: "113-124" },
          { path: "src/services/llm.ts", lines: "462-471, 660-671" },
        ],
        codeSource:
          "WORLD CONTEXT includes STORY NAME + BRIEF DESCRIPTION + STORY PREMISE in the primary system message.",
        review: ROLEPLAY_PIPELINE_REVIEW_20260515,
        fields: [
          {
            label: "Story Name (scenarioName)",
            status: "connected",
            detail:
              "Serialized into WORLD CONTEXT as STORY NAME.",
          },
          {
            label: "Brief Description",
            status: "connected",
            detail:
              "Serialized into WORLD CONTEXT as BRIEF DESCRIPTION.",
          },
        ],
      },
      {
        id: "story-details",
        title: "Audit: Story Details (World Core) Container",
        description:
          "Primary world-building payload currently serialized under SECTION 2 - STORY AND WORLD CONTEXT.",
        fileRefs: [
          { path: "src/features/story-builder/StoryBuilderScreen.tsx" },
          { path: "src/types.ts", lines: "113-124" },
          { path: "src/services/llm.ts", lines: "173-756" },
        ],
        codeSource:
          "STORY PREMISE\nLOCATIONS (structuredLocations)\nCUSTOM WORLD CONTENT (structured + freeform)\nSTORY GOALS (title/outcome/currentStatus/steps)\nADDITIONAL LORE ENTRIES\nSTORY THEMES (selected tags only)",
        review: ROLEPLAY_PIPELINE_REVIEW_20260515,
        fields: [
          {
            label: "Story Premise",
            status: "connected",
            detail: "Serialized under SECTION 2 - STORY AND WORLD CONTEXT.",
          },
          {
            label: "Primary Locations (structured)",
            status: "connected",
            detail:
              "Structured locations are serialized as label/description pairs in WORLD CONTEXT.",
          },
          {
            label: "Dialog Formatting",
            status: "connected",
            detail:
              "Baseline formatting rules and world.core.dialogFormatting are serialized together under SECTION 7 - DIALOG FORMATTING AND ROLEPLAY RULES.",
          },
          {
            label: "Custom World Content (structured items)",
            status: "connected",
            detail: "customWorldSections[].items label/value pairs are serialized.",
          },
          {
            label: "Custom World Content (freeformValue)",
            status: "connected",
            detail:
              "freeformValue is normalized into section rows and serialized in CUSTOM WORLD CONTENT.",
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
          { path: "src/services/llm.ts", lines: "263-289, 462-471" },
        ],
        codeSource:
          "[RIGID|NORMAL|FLEXIBLE] Goal + Desired Outcome + Steps + computed Progress + directive text",
        review: ROLEPLAY_PIPELINE_REVIEW_20260515,
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
            status: "connected",
            detail:
              "StoryGoal.currentStatus is serialized when present.",
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
          { path: "src/services/llm.ts", lines: "439-457" },
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
          { path: "src/services/llm.ts", lines: "423-435, 660-671" },
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
            status: "connected",
            detail:
              "Prompt injects ACTIVE SCENE CONTEXT including active scene tag + scene title + all tags.",
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
          { path: "src/services/llm.ts", lines: "485-604" },
          { path: "src/types.ts", lines: "113-124" },
        ],
        fields: [
          {
            label: "Critical formatting wrappers (\"\", **, ())",
            status: "connected",
            detail: "Injected directly in SECTION 7 - DIALOG FORMATTING AND ROLEPLAY RULES.",
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
          { path: "src/services/llm.ts", lines: "462" },
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
          { path: "src/services/llm.ts", lines: "324-358" },
        ],
        codeSource:
          "CHARACTER: name (sexType) + NICKNAMES + SEXUAL ORIENTATION\nROLE\nCONTROL + LOCATION\n...",
        review: ROLEPLAY_PIPELINE_REVIEW_20260515,
        fields: [
          { label: "Name", status: "connected", detail: "Serialized in CHARACTER header." },
          { label: "Nicknames", status: "connected", detail: "Serialized when non-empty." },
          {
            label: "Age",
            status: "connected",
            detail: "Serialized in CAST profile as AGE.",
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
          {
            label: "Role Description",
            status: "connected",
            detail: "Serialized in CAST profile as ROLE DESCRIPTION when present.",
          },
          { label: "Tags", status: "connected", detail: "Serialized in TAGS line." },
        ],
      },
      {
        id: "character-physical",
        title: "Audit: Character Builder — Physical Appearance Container",
        description:
          "Physical appearance base fields and custom rows are serialized in CAST profile.",
        fileRefs: [
          { path: "src/types.ts", lines: "159-172" },
          { path: "src/features/character-builder/utils/section-progress.ts", lines: "63-78" },
          { path: "src/services/llm.ts", lines: "345-347" },
        ],
        fields: [
          {
            label: "Hair Color",
            status: "connected",
            detail: "Base field serialized via labeled pair formatter.",
          },
          { label: "Eye Color", status: "connected", detail: "Base field serialized via labeled pair formatter." },
          { label: "Build", status: "connected", detail: "Base field serialized via labeled pair formatter." },
          { label: "Body Hair", status: "connected", detail: "Base field serialized via labeled pair formatter." },
          { label: "Height", status: "connected", detail: "Base field serialized via labeled pair formatter." },
          { label: "Breasts", status: "connected", detail: "Base field (`breastSize`) serialized via labeled pair formatter." },
          { label: "Genitalia", status: "connected", detail: "Base field serialized via labeled pair formatter." },
          { label: "Skin Tone", status: "connected", detail: "Base field serialized via labeled pair formatter." },
          { label: "Makeup", status: "connected", detail: "Base field serialized via labeled pair formatter." },
          { label: "Body Markings", status: "connected", detail: "Base field serialized via labeled pair formatter." },
          { label: "Temporary Conditions", status: "connected", detail: "Base field serialized via labeled pair formatter." },
          { label: "Custom rows (_extras)", status: "connected", detail: "Serialized into ADDITIONAL ATTRIBUTES." },
        ],
      },
      {
        id: "character-currently-wearing",
        title: "Audit: Character Builder — Currently Wearing Container",
        description:
          "Live clothing state base fields and custom rows are serialized in CAST profile.",
        fileRefs: [
          { path: "src/types.ts", lines: "174-180" },
          { path: "src/features/character-builder/utils/section-progress.ts", lines: "80-88" },
          { path: "src/services/llm.ts", lines: "345-347" },
        ],
        fields: [
          { label: "Top", status: "connected", detail: "Base field serialized via labeled pair formatter." },
          { label: "Bottom", status: "connected", detail: "Base field serialized via labeled pair formatter." },
          { label: "Undergarments", status: "connected", detail: "Base field serialized via labeled pair formatter." },
          { label: "Miscellaneous", status: "connected", detail: "Base field serialized via labeled pair formatter." },
          { label: "Custom rows (_extras)", status: "connected", detail: "Serialized into ADDITIONAL ATTRIBUTES." },
        ],
      },
      {
        id: "character-preferred-clothing",
        title: "Audit: Character Builder — Preferred Clothing Container",
        description:
          "Preferred clothing base fields and custom rows are serialized in CAST profile.",
        fileRefs: [
          { path: "src/types.ts", lines: "182-189" },
          { path: "src/features/character-builder/utils/section-progress.ts", lines: "90-99" },
          { path: "src/services/llm.ts", lines: "345-347" },
        ],
        fields: [
          { label: "Casual", status: "connected", detail: "Base field serialized via labeled pair formatter." },
          { label: "Work", status: "connected", detail: "Base field serialized via labeled pair formatter." },
          { label: "Sleep", status: "connected", detail: "Base field serialized via labeled pair formatter." },
          { label: "Undergarments", status: "connected", detail: "Base field serialized via labeled pair formatter." },
          { label: "Miscellaneous", status: "connected", detail: "Base field serialized via labeled pair formatter." },
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
          { path: "src/services/llm.ts", lines: "291-321, 348" },
        ],
        fields: [
          {
            label: "Standard traits (label/value/flexibility/score/trend)",
            status: "connected",
            detail: "Serialized through renderPersonalityBlock.",
          },
          {
            label: "Split mode outward traits",
            status: "connected",
            detail: "Serialized when present in outward personality rows.",
          },
          {
            label: "Split mode inward traits",
            status: "connected",
            detail: "Serialized when present in inward personality rows.",
          },
        ],
      },
      {
        id: "character-tone",
        title: "Audit: Character Builder — Tone Container",
        description:
          "Tone section is serialized from authored rows; there is no separate dedicated example-dialogue field in current schema.",
        fileRefs: [
          { path: "src/features/character-builder/utils/section-progress.ts", lines: "112-115" },
          { path: "src/services/llm.ts", lines: "349" },
        ],
        fields: [
          {
            label: "Tone rows (_extras)",
            status: "connected",
            detail: "Serialized via tone extras into TONE line.",
          },
          {
            label: "Example Dialogue field",
            status: "code-handled",
            detail:
              "Not a dedicated field in the current Character Builder schema. API Inspector tracks only live UI/runtime fields.",
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
          { path: "src/services/llm.ts", lines: "350" },
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
          { path: "src/services/llm.ts", lines: "351-354" },
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
          { path: "src/services/llm.ts", lines: "324-358" },
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
            status: "connected",
            detail: "CharacterGoal.currentStatus is serialized when present.",
          },
        ],
        review: ROLEPLAY_PIPELINE_REVIEW_20260515,
      },
      {
        id: "character-custom-content",
        title: "Audit: Character Builder — Custom Content Container",
        description:
          "Custom sections (structured + freeform) are serialized through the custom traits/context mapping.",
        fileRefs: [
          { path: "src/types.ts", lines: "138-156" },
          { path: "src/services/llm.ts", lines: "328-339, 342-357" },
        ],
        fields: [
          {
            label: "Structured custom items (label=value)",
            status: "connected",
            detail: "Serialized via c.sections -> TRAITS mapping.",
          },
          {
            label: "Custom section freeformValue",
            status: "connected",
            detail: "freeformValue is normalized into rows and serialized in custom traits/context blocks.",
          },
        ],
      },
      {
        id: "side-characters-cast",
        title: "Audit: CAST Composition — Main/Side/User Control Coverage",
        description:
          "CAST block currently filters to AI-controlled characters only; user-controlled names are listed as exclusion guard.",
        fileRefs: [
          { path: "src/services/llm.ts", lines: "401-420, 568-575" },
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
            status: "connected",
            detail:
              "Side character profiles are serialized in dedicated SIDE CHARACTER CONTEXT while preserving control guardrails.",
          },
        ],
        review: ROLEPLAY_PIPELINE_REVIEW_20260515,
      },
    ],
  },
];
