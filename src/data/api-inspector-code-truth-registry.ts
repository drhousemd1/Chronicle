import { ApiArchitectureMapRegistry } from "@/lib/api-inspector-schema";

export const apiInspectorCodeTruthRegistry: ApiArchitectureMapRegistry = {
  meta: {
    id: "chronicle-system-architecture-map-v2",
    name: "Chronicle System Architecture Map",
    project: "Chronicle",
    generatedAt: "2026-03-21T00:00:00.000Z",
    lastUpdatedAt: "2026-03-21T00:00:00.000Z",
    sourcePolicy:
      "Layout and styling follow the API Inspector rework guide, but all flow/content mappings are rebuilt from live code paths in this repository.",
  },
  legend: {
    title: "Legend",
    subtitle: "Tag semantics, required metadata, and map operating rules",
    rules: [
      {
        id: "legend-rule-1",
        title: "Code-truth precedence",
        body:
          "When guide content conflicts with runtime code, this map follows runtime code and records the mismatch in changelog.",
      },
      {
        id: "legend-rule-2",
        title: "Required item metadata",
        body:
          "Every item includes: tag type + icon, plain-English purpose, hidden file-ref metadata, and code-source snippets when prompt/data blocks are involved.",
      },
      {
        id: "legend-rule-3",
        title: "Tag semantics",
        body:
          "Core Prompt = instruction text sent to model. Data Block = structured context container. Context Injection = runtime field-level injection. Code Logic = orchestration logic not sent to model. Validation Check = guardrails/safety gates.",
      },
      {
        id: "legend-rule-4",
        title: "Colorblind-safe category colors",
        body:
          "Code logic uses gray, validation uses red, core prompt uses blue, data block uses teal, context injection uses orange. No green role-coloring is used for logic categories.",
      },
      {
        id: "legend-rule-5",
        title: "Cross-reference badges",
        body:
          "Purple numbered badges connect where data/instructions are created and where they land later in the lifecycle.",
      },
    ],
    examples: [
      {
        id: "legend-example-1",
        title: "Core Prompt item",
        body:
          "Represents literal system-instruction text sent to Grok. Includes hidden code-source and View Prompt modal.",
      },
      {
        id: "legend-example-2",
        title: "Data Block item",
        body:
          "Represents assembled world/character/memory context payload included in prompt assembly.",
      },
      {
        id: "legend-example-3",
        title: "Validation Check item",
        body:
          "Represents run-time checks that reject, sanitize, or retry behavior (auth checks, field allowlists, stale-result rejection, content safety retries).",
      },
    ],
  },
  grokReference: [
    {
      id: "grok-ref-a",
      title: "Layer A - Verified Integration Facts",
      description: "Concrete implementation facts traced directly from Chronicle code.",
      rows: [
        { label: "Primary chat endpoint", value: "https://api.x.ai/v1/chat/completions" },
        { label: "Primary chat model", value: "grok-4-1-fast-reasoning" },
        { label: "Scene/Cover/Avatar image model", value: "grok-imagine-image" },
        { label: "Chronicle frontend chat gateway", value: "Supabase edge function: /functions/v1/chat" },
        { label: "Fallback behavior", value: "403 content safety retries with explicit CONTENT_REDIRECT_DIRECTIVE in chat edge function" },
      ],
    },
    {
      id: "grok-ref-b",
      title: "Layer B - Operational Caveats",
      caveat:
        "These are implementation-oriented reminders from Chronicle behavior. Use as debugging heuristics, not external model guarantees.",
      rows: [
        {
          label: "Prompt size pressure",
          value: "System prompt assembly is large; instruction drift can occur when runtime directives are weak or missing.",
        },
        {
          label: "State drift risk",
          value: "Character-state extraction runs in parallel and can be stale; stale-result checks and field allowlists protect against corrupt writes.",
        },
        {
          label: "Image prompt byte limits",
          value: "Scene/avatar image pipelines explicitly enforce byte limits and prompt compression before Grok image calls.",
        },
      ],
      tables: [
        {
          title: "Debugging Playbook",
          columns: ["Symptom", "Check First", "Likely Fix Surface"],
          rows: [
            [
              "AI ignores control/scene-presence rules",
              "`getSystemInstruction` assembly + final message array order",
              "`src/services/llm.ts`",
            ],
            [
              "Character fields update incorrectly",
              "`extract-character-updates` allowlist + reconciliation",
              "`supabase/functions/extract-character-updates/index.ts`",
            ],
            [
              "AI enhance output is generic/off-target",
              "Field prompt resolver + mode (precise/detailed)",
              "`src/services/character-ai.ts`, `src/services/world-ai.ts`",
            ],
          ],
        },
      ],
    },
  ],
  llmInstructions: [
    {
      id: "llm-instruction-1",
      text: "Read all phases involved in the target bug before changing any prompt or extractor logic.",
    },
    {
      id: "llm-instruction-2",
      text: "Use hidden file-ref blocks to jump to exact source paths/lines; do not infer from stale HTML content.",
    },
    {
      id: "llm-instruction-3",
      text: "When changing map content, preserve tag semantics and add a changelog entry with required fields.",
    },
    {
      id: "llm-instruction-4",
      text: "For prompt/debug tasks, cross-check both this map and the corresponding edge function/frontend invocation path.",
    },
  ],
  phases: [
    {
      id: "phase-pre-send",
      title: "Phase 1 - Runtime Orchestration (Pre-send)",
      subtitle: "User action -> input shaping -> system prompt assembly",
      defaultOpen: true,
      sections: [
        {
          id: "section-send-entrypoints",
          title: "Send / Regenerate / Continue Entrypoints",
          description: "UI handlers that build message intent and runtime state before API Call 1.",
          defaultOpen: true,
          items: [
            {
              id: "item-handle-send",
              title: "handleSend builds turn payload",
              tagType: "code-logic",
              icon: "🔧",
              purpose:
                "Creates the user turn, applies canon-note preservation, increments session message counter, injects anti-loop runtime directives, and starts streaming narrative generation.",
              fileRefs: [
                {
                  path: "src/components/chronicle/ChatInterfaceTab.tsx",
                  lines: "3003-3133",
                },
              ],
              subItems: [
                {
                  id: "item-handle-send-sub-1",
                  title: "Canon note pre-processing",
                  description:
                    "`buildCanonNote` prepends a guard string when user authored AI-character content in-message.",
                },
                {
                  id: "item-handle-send-sub-2",
                  title: "Session counter",
                  description:
                    "`sessionMessageCountRef` increments and is later injected into the final user message wrapper.",
                },
                {
                  id: "item-handle-send-sub-3",
                  title: "Streaming lifecycle",
                  description:
                    "Streams chunks, normalizes placeholder names, strips legacy tags, then commits assistant message.",
                },
              ],
              crossRefs: [
                {
                  badge: "1",
                  targetItemId: "item-final-user-wrapper",
                  label: "Session/length/style wrapper",
                  tooltip: "Values created here are injected into the final user message payload.",
                },
                {
                  badge: "2",
                  targetItemId: "item-runtime-directive-message",
                  label: "Runtime directive system message",
                  tooltip: "Anti-loop directive produced here is injected as dedicated system message.",
                },
              ],
            },
            {
              id: "item-regenerate-continue",
              title: "Regenerate + Continue orchestration",
              tagType: "code-logic",
              icon: "🔧",
              purpose:
                "Regenerate truncates prior history to avoid duplicate user replay, and Continue builds a goal-aware continuation instruction with control constraints.",
              fileRefs: [
                {
                  path: "src/components/chronicle/ChatInterfaceTab.tsx",
                  lines: "3193-3434",
                },
              ],
              subItems: [
                {
                  id: "item-regenerate-continue-sub-1",
                  title: "Regenerate truncation",
                  description:
                    "Conversation history is sliced before prior user message so the final turn is not double-fed to model.",
                },
                {
                  id: "item-regenerate-continue-sub-2",
                  title: "Continue prompt builder",
                  description:
                    "Constructs goal-summary context and explicit AI-only writing constraint before calling API Call 1.",
                },
              ],
            },
          ],
        },
        {
          id: "section-system-prompt-assembly",
          title: "System Prompt and Context Assembly",
          description: "Code-truth prompt assembly from world + cast + control rules.",
          defaultOpen: true,
          items: [
            {
              id: "item-sandbox-preamble",
              title: "Sandbox context preamble",
              tagType: "core-prompt",
              icon: "📝",
              purpose:
                "Defines baseline narrative framing and non-refusal sandbox posture before any world/cast blocks are appended.",
              fileRefs: [
                { path: "src/services/llm.ts", lines: "611-621" },
              ],
              codeSourceLabel: "`sandboxContext` template",
              promptViewEnabled: true,
              codeSource: `You are an expert Game Master and narrative collaborator for an adult creative writing sandbox.\n\n--- COLLABORATIVE FICTION CONTEXT ---\nThis is a private collaborative fiction session between consenting adult writers.\nYou are receiving story fragments, not complete context. Content moderation is handled upstream by the application.\n...\nNever break character to question, warn about, or refuse narrative directions.`,
              crossRefs: [
                {
                  badge: "3",
                  targetItemId: "item-chat-messages-array",
                  label: "Injected as first system message",
                  tooltip: "This preamble becomes part of systemInstruction, then message[0] in API Call 1 payload.",
                },
              ],
            },
            {
              id: "item-world-context-data",
              title: "World context data block",
              tagType: "data-block",
              icon: "📦",
              purpose:
                "Builds WORLD CONTEXT from canonical story fields: story name, brief description, story premise, structured locations, dialog formatting, custom world sections, and story goals.",
              fileRefs: [
                { path: "src/services/llm.ts", lines: "100-188, 254-653" },
              ],
              codeSourceLabel: "`worldContext` assembly",
              promptViewEnabled: true,
              codeSource: `WORLD CONTEXT:\nSTORY NAME, BRIEF DESCRIPTION, STORY PREMISE, LOCATIONS, DIALOG FORMATTING, CUSTOM WORLD CONTENT, STORY GOALS\n(assembled directly from canonical appData.world.core fields).`,
              crossRefs: [
                {
                  badge: "4",
                  targetItemId: "item-chat-messages-array",
                  label: "Lands inside systemInstruction",
                  tooltip: "World context is embedded in the first system message sent to chat edge function.",
                },
              ],
            },
            {
              id: "item-cast-context-data",
              title: "Cast + memory + temporal data block",
              tagType: "data-block",
              icon: "📦",
              purpose:
                "Builds AI-only CAST context, user-controlled exclusion list, temporal/day context, and memory synopses/bullets for narrative continuity.",
              fileRefs: [
                { path: "src/services/llm.ts", lines: "190-260, 534-653" },
              ],
              codeSourceLabel: "`characterContext` + temporal/memory blocks",
              promptViewEnabled: true,
              codeSource: `CAST:\nCHARACTER: ...\nCONTROL: AI\n...\nUSER-CONTROLLED (DO NOT GENERATE FOR): ...\n\nCURRENT TEMPORAL CONTEXT:\n- Day / Time\n\nSTORY MEMORIES:\n- Completed day synopses\n- Current day bullets`,
              crossRefs: [
                {
                  badge: "5",
                  targetItemId: "item-chat-messages-array",
                  label: "Included in system message payload",
                  tooltip: "Cast and memory context become part of API Call 1 system prompt body.",
                },
              ],
            },
            {
              id: "item-instruction-stack",
              title: "Control hierarchy and formatting stack",
              tagType: "core-prompt",
              icon: "📝",
              purpose:
                "Encodes hard-priority constraints (control, forward momentum, scene presence, line-of-sight, formatting, tagging, naming, trait adherence).",
              fileRefs: [
                { path: "src/services/llm.ts", lines: "657-789" },
              ],
              codeSourceLabel: "INSTRUCTIONS stack (priority hierarchy)",
              promptViewEnabled: true,
              codeSource: `PRIORITY HIERARCHY:\n1. Control rules\n2. Forward Momentum + Anti-Loop\n3. Scene Presence\n4. Line of Sight\n...\nSTRICT FORMATTING RULES\nPARAGRAPH TAGGING\nCHARACTER NAMING RULES`,
            },
          ],
        },
        {
          id: "section-message-array",
          title: "Message Array Construction",
          description: "Final payload composition before API Call 1 is dispatched.",
          items: [
            {
              id: "item-chat-messages-array",
              title: "Frontend message array composition",
              tagType: "code-logic",
              icon: "🔧",
              purpose:
                "Composes ordered message array: systemInstruction -> conversation history -> optional runtime directive system message -> final wrapped user message.",
              fileRefs: [
                { path: "src/services/llm.ts", lines: "831-898" },
              ],
              codeSourceLabel: "`messages` assembly in `generateRoleplayResponseStream`",
              promptViewEnabled: true,
              codeSource: `const messages = [\n  { role: 'system', content: systemInstruction },\n  ...history,\n];\nif (runtimeDirectives) messages.push({ role: 'system', content: 'RUNTIME DIRECTIVES...' });\nmessages.push({ role: 'user', content: [SESSION ...] + lengthDirective + userMessage + regen + styleHint });`,
            },
            {
              id: "item-runtime-directive-message",
              title: "Runtime directive system message",
              tagType: "context-injection",
              icon: "📥",
              purpose:
                "Injects anti-loop/runtime constraints as a dedicated high-priority system message rather than burying in user text.",
              fileRefs: [
                { path: "src/services/llm.ts", lines: "862-865" },
                { path: "src/components/chronicle/ChatInterfaceTab.tsx", lines: "3032-3039, 3312-3316" },
              ],
              codeSourceLabel: "Runtime directive wrapper",
              promptViewEnabled: true,
              codeSource: "RUNTIME DIRECTIVES (HIGH PRIORITY — follow these for THIS response only):\n${runtimeDirectives}",
              crossRefs: [
                {
                  badge: "2",
                  targetItemId: "item-handle-send",
                  label: "Produced in send/regen/continue",
                  tooltip: "Directive text is computed in UI handlers and injected here.",
                },
              ],
            },
            {
              id: "item-final-user-wrapper",
              title: "Final user message wrapper",
              tagType: "context-injection",
              icon: "📥",
              purpose:
                "Wraps final user message with session counter, dynamic length directive, regeneration directive (when applicable), and randomized style hint.",
              fileRefs: [
                { path: "src/services/llm.ts", lines: "867, 792-829" },
                { path: "src/components/chronicle/ChatInterfaceTab.tsx", lines: "3030-3039" },
              ],
              codeSourceLabel: "Final user wrapper expression",
              promptViewEnabled: true,
              codeSource: "[SESSION: Message N] + lengthDirective + userMessage + REGENERATION_DIRECTIVE_TEXT + getRandomStyleHint(...)",
              crossRefs: [
                {
                  badge: "1",
                  targetItemId: "item-handle-send",
                  label: "Inputs originate in send pipeline",
                  tooltip: "Session counter and anti-loop decisions originate in ChatInterfaceTab handleSend.",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "phase-api-call-1",
      title: "API Call 1 - Narrative Chat Completion",
      subtitle: "Frontend /functions/v1/chat -> xAI chat completions",
      defaultOpen: true,
      sections: [
        {
          id: "section-chat-edge-gateway",
          title: "Supabase Chat Edge Gateway",
          description: "Auth, model gatekeeping, xAI request dispatch, stream proxying.",
          defaultOpen: true,
          items: [
            {
              id: "item-chat-front-to-edge",
              title: "Frontend fetch to chat edge function",
              tagType: "code-logic",
              icon: "🔧",
              purpose:
                "Sends message array and modelId to `/functions/v1/chat` with session bearer token and publishable key.",
              fileRefs: [
                { path: "src/services/llm.ts", lines: "885-898" },
              ],
            },
            {
              id: "item-chat-auth-model-gate",
              title: "Edge auth check + model allowlist",
              tagType: "validation-check",
              icon: "✓",
              purpose:
                "Rejects missing/invalid auth token and forces model usage to `grok-4-1-fast-reasoning` when unsupported models are requested.",
              fileRefs: [
                { path: "supabase/functions/chat/index.ts", lines: "71-92" },
              ],
            },
            {
              id: "item-chat-xai-request",
              title: "xAI chat request payload",
              tagType: "data-block",
              icon: "📦",
              purpose:
                "Forwards normalized model + messages + stream + max_tokens into xAI `chat/completions` API.",
              fileRefs: [
                { path: "supabase/functions/chat/index.ts", lines: "33-54" },
              ],
              codeSourceLabel: "`callXAI` request body",
              promptViewEnabled: true,
              codeSource: `fetch("https://api.x.ai/v1/chat/completions", {\n  body: JSON.stringify({ model, messages, stream, temperature: 0.9, max_tokens })\n})`,
            },
            {
              id: "item-content-redirect-retry",
              title: "403 content redirect retry",
              tagType: "validation-check",
              icon: "✓",
              purpose:
                "When xAI returns 403, injects `CONTENT_REDIRECT_DIRECTIVE` as system message and retries once before returning content_filtered.",
              fileRefs: [
                { path: "supabase/functions/chat/index.ts", lines: "24-30, 124-162" },
              ],
              codeSourceLabel: "CONTENT_REDIRECT_DIRECTIVE",
              promptViewEnabled: true,
              codeSource: `[CONTENT REDIRECT] ...\n1. Take a CONCRETE, IMMEDIATE action\n2. Maintain scene momentum\n...\n6. FORBIDDEN: vague redirects`,
            },
            {
              id: "item-stream-pass-through",
              title: "SSE streaming pass-through",
              tagType: "code-logic",
              icon: "🔧",
              purpose:
                "Streams xAI response body through edge function and frontend parser to render token-by-token narrative output.",
              fileRefs: [
                { path: "supabase/functions/chat/index.ts", lines: "106-121, 137-153" },
                { path: "src/services/llm.ts", lines: "915-964" },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "phase-api-call-2",
      title: "API Call 2 - Post-Response Stateful Extraction",
      subtitle: "Parallel extraction + validation + state reconciliation",
      defaultOpen: true,
      sections: [
        {
          id: "section-post-response-triggers",
          title: "Client-side Trigger Orchestration",
          description: "Non-blocking extraction pipeline launched after assistant text is committed.",
          items: [
            {
              id: "item-post-response-fanout",
              title: "Parallel extraction fanout",
              tagType: "code-logic",
              icon: "🔧",
              purpose:
                "After assistant response finalization, chat UI launches memory extraction, goal-step evaluation, character-state extraction, and new-character detection in non-blocking flows.",
              fileRefs: [
                { path: "src/components/chronicle/ChatInterfaceTab.tsx", lines: "3065-3125, 3408-3425" },
              ],
              crossRefs: [
                {
                  badge: "6",
                  targetItemId: "item-extract-memory-events",
                  label: "Memory extraction call",
                  tooltip: "Fanout triggers memory extraction edge function.",
                },
                {
                  badge: "7",
                  targetItemId: "item-evaluate-goals",
                  label: "Goal progress evaluation",
                  tooltip: "Fanout triggers goal-step classifier edge function.",
                },
                {
                  badge: "8",
                  targetItemId: "item-extract-character-updates",
                  label: "Character update extraction",
                  tooltip: "Fanout triggers structured character update extractor.",
                },
              ],
            },
            {
              id: "item-stale-result-guard",
              title: "Stale-result protection guard",
              tagType: "validation-check",
              icon: "✓",
              purpose:
                "Ensures extraction/classification results are discarded if a newer user turn already exists, preventing stale writes.",
              fileRefs: [
                { path: "src/components/chronicle/ChatInterfaceTab.tsx", lines: "1863-1877, 1913-1916, 2200-2203" },
              ],
            },
          ],
        },
        {
          id: "section-api2-memory",
          title: "API 2A - Memory Event Extraction",
          description: "Extract high-impact events for future consistency memory.",
          items: [
            {
              id: "item-extract-memory-events",
              title: "extract-memory-events edge function",
              tagType: "core-prompt",
              icon: "📝",
              purpose:
                "Curates only plot-relevant memory events (0-2 preferred, allows empty) from latest assistant response.",
              fileRefs: [
                { path: "src/components/chronicle/ChatInterfaceTab.tsx", lines: "3067-3084" },
                { path: "supabase/functions/extract-memory-events/index.ts", lines: "42-119" },
              ],
              codeSourceLabel: "Memory curator system prompt",
              promptViewEnabled: true,
              codeSource: `You are a story memory curator...\nWHAT TO EXTRACT: lasting consequences\nWHAT TO IGNORE: scene flavor\nReturn 0-2 events max as JSON array.`,
            },
            {
              id: "item-compress-day-memories",
              title: "Day memory compression",
              tagType: "core-prompt",
              icon: "📝",
              purpose:
                "When day increments, compresses bullet memories for prior day into 2-3 sentence synopsis for long-term memory storage.",
              fileRefs: [
                { path: "src/components/chronicle/ChatInterfaceTab.tsx", lines: "893-920" },
                { path: "supabase/functions/compress-day-memories/index.ts", lines: "42-70" },
              ],
              codeSourceLabel: "Memory compression prompt",
              promptViewEnabled: true,
              codeSource: `You are compressing a list of story memory bullet points...\nOUTPUT: single plain-text synopsis (2-3 sentences).`,
            },
          ],
        },
        {
          id: "section-api2-goals",
          title: "API 2B - Goal Step Evaluation",
          description: "Classifies pending story-goal steps as aligned/completed.",
          items: [
            {
              id: "item-evaluate-goals",
              title: "evaluate-goal-progress edge function",
              tagType: "core-prompt",
              icon: "📝",
              purpose:
                "Builds pending-step context + timeline context, then classifies each step as completed true/false with summary.",
              fileRefs: [
                { path: "src/components/chronicle/ChatInterfaceTab.tsx", lines: "1879-1938" },
                { path: "supabase/functions/evaluate-goal-progress/index.ts", lines: "64-149" },
              ],
              codeSourceLabel: "Goal classification prompt",
              promptViewEnabled: true,
              codeSource: `You are a story goal progress evaluator...\nClassify each pending step as ALIGNED or NOT_ALIGNED and return JSON classifications with completed boolean.`,
              crossRefs: [
                {
                  badge: "7",
                  targetItemId: "item-post-response-fanout",
                  label: "Triggered by post-response fanout",
                  tooltip: "Goal classification invocation is launched after assistant response commit.",
                },
              ],
            },
          ],
        },
        {
          id: "section-api2-character-state",
          title: "API 2C - Character State Extraction",
          description: "High-rigor structured state reconciliation for character records.",
          items: [
            {
              id: "item-extract-character-updates",
              title: "extract-character-updates invocation",
              tagType: "code-logic",
              icon: "🔧",
              purpose:
                "Builds eligible character set from latest exchange, packages recent context + structured character state, invokes edge extractor.",
              fileRefs: [
                { path: "src/components/chronicle/ChatInterfaceTab.tsx", lines: "2065-2207" },
              ],
              crossRefs: [
                {
                  badge: "8",
                  targetItemId: "item-post-response-fanout",
                  label: "Triggered by post-response fanout",
                  tooltip: "Character extraction call starts after assistant response commit.",
                },
              ],
            },
            {
              id: "item-character-extractor-prompt",
              title: "Character extractor 3-phase system prompt",
              tagType: "core-prompt",
              icon: "📝",
              purpose:
                "Extractor prompt enforces phase scan discipline, trackable field allowlist, goal lifecycle rules, and conservative update policy.",
              fileRefs: [
                { path: "supabase/functions/extract-character-updates/index.ts", lines: "407-767" },
              ],
              codeSourceLabel: "extract-character-updates system prompt (abridged)",
              promptViewEnabled: true,
              codeSource: `PHASE 1: extract material state deltas\nPHASE 2: review existing state\nPHASE 3: placeholder scan\nTRACKABLE FIELDS: ...\nDEFAULT TO NO UPDATE when no material change is present.`,
            },
            {
              id: "item-character-extractor-validation",
              title: "Field allowlist + structured reconciliation",
              tagType: "validation-check",
              icon: "✓",
              purpose:
                "Filters unsupported fields, sanitizes mood content, reconciles structured updates to avoid duplicate semantic entries, and supports safe retry on 403.",
              fileRefs: [
                { path: "supabase/functions/extract-character-updates/index.ts", lines: "55-75, 209-292, 830-913" },
                { path: "src/components/chronicle/ChatInterfaceTab.tsx", lines: "1957-1968, 2195-2203" },
              ],
              codeSourceLabel: "Validation/reconciliation checkpoints",
              promptViewEnabled: true,
              codeSource: `isAllowedUpdateField(...)\nreconcileStructuredUpdates(...)\nsanitizeCurrentMood(...)\n403 -> safe extraction retry prompt`,
            },
          ],
        },
      ],
    },
    {
      id: "phase-ai-enhance",
      title: "AI Enhance - Authoring Assist APIs",
      subtitle: "Per-field refine, fill-empty, and generate-new-content pathways",
      defaultOpen: true,
      sections: [
        {
          id: "section-ai-enhance-character",
          title: "Character Builder Enhance Flow",
          description: "Precise/detailed enhancement mode for field-level sparkle buttons.",
          items: [
            {
              id: "item-character-enhance-ui",
              title: "Enhance mode dispatch from Character Builder",
              tagType: "code-logic",
              icon: "🔧",
              purpose:
                "Field rows open EnhanceModeModal and dispatch `aiEnhanceCharacterField` with `precise` or `detailed` mode.",
              fileRefs: [
                { path: "src/features/character-builder/CharacterBuilderScreen.tsx", lines: "443-469, 1272-1585, 1958-1973" },
                { path: "src/components/chronicle/EnhanceModeModal.tsx", lines: "1-120" },
              ],
            },
            {
              id: "item-character-enhance-prompt",
              title: "Character field prompt resolver",
              tagType: "core-prompt",
              icon: "📝",
              purpose:
                "Resolves field-specific instructions and builds mode-aware prompts using full world context + character self-context.",
              fileRefs: [
                { path: "src/services/character-ai.ts", lines: "14-197, 214-384, 521-560" },
              ],
              codeSourceLabel: "`buildCharacterFieldPrompt` template",
              promptViewEnabled: true,
              codeSource: `You are enhancing a character field for an interactive roleplay...\nMode precise: semicolon key points only\nMode detailed: concise structured expansion with field-specific instruction`,
              crossRefs: [
                {
                  badge: "9",
                  targetItemId: "item-world-enhance-prompt",
                  label: "Shared mode pattern",
                  tooltip: "Character and world enhance flows both support precise/detailed branching.",
                },
              ],
            },
            {
              id: "item-character-fill-generate",
              title: "AI Fill + AI Generate pipelines",
              tagType: "data-block",
              icon: "📦",
              purpose:
                "AI Fill populates empty known fields only; AI Generate fills empty fields plus can create/add sections. Both rely on robust JSON extraction and patch application.",
              fileRefs: [
                { path: "src/services/character-ai.ts", lines: "711-980, 981-1320" },
                { path: "src/pages/Index.tsx", lines: "1605-1637" },
              ],
              codeSourceLabel: "AI Fill/Generate JSON contract",
              promptViewEnabled: true,
              codeSource: `Return JSON with: emptyFieldsFill, newSections, existingSectionAdditions, customFieldsFill\nIMPORTANT: Only fill EMPTY fields.`,
            },
            {
              id: "item-character-json-validation",
              title: "JSON extraction fallback chain",
              tagType: "validation-check",
              icon: "✓",
              purpose:
                "Character fill/generate parsing uses fenced-code stripping, direct parse, regex extraction, and balanced-brace fallback before rejecting malformed output.",
              fileRefs: [
                { path: "src/services/character-ai.ts", lines: "981-1028" },
              ],
              codeSourceLabel: "`extractJsonFromResponse` strategies",
              promptViewEnabled: true,
              codeSource: "1) strip markdown fences -> 2) direct JSON parse -> 3) regex object extract -> 4) manual balanced-brace extraction",
            },
          ],
        },
        {
          id: "section-ai-enhance-world",
          title: "Story Builder Enhance Flow",
          description: "World/goal/custom field enhancement path.",
          items: [
            {
              id: "item-world-enhance-ui",
              title: "Story Builder field-mode dispatcher",
              tagType: "code-logic",
              icon: "🔧",
              purpose:
                "Maps Story Builder field keys (including goal outcomes/steps and arc phase outcomes) into `EnhanceableWorldFields` and dispatches world enhance requests.",
              fileRefs: [
                { path: "src/features/story-builder/StoryBuilderScreen.tsx", lines: "186-228, 666-890, 1558-1590" },
              ],
            },
            {
              id: "item-world-enhance-prompt",
              title: "World field prompt builder",
              tagType: "core-prompt",
              icon: "📝",
              purpose:
                "Builds structured world-field enhancement prompt with per-field instruction sets and mode-specific output constraints.",
              fileRefs: [
                { path: "src/services/world-ai.ts", lines: "13-138" },
              ],
              codeSourceLabel: "`buildPrompt` in world-ai",
              promptViewEnabled: true,
              codeSource: `Mode precise -> 3-6 semicolon points only\nMode detailed -> concise structured expansion, max sentences by field config`,
              crossRefs: [
                {
                  badge: "9",
                  targetItemId: "item-character-enhance-prompt",
                  label: "Shared mode pattern",
                  tooltip: "World and character enhancement share the same precise/detailed UX pattern.",
                },
              ],
            },
            {
              id: "item-world-enhance-call",
              title: "World enhance chat invocation",
              tagType: "code-logic",
              icon: "🔧",
              purpose:
                "Invokes chat edge function in non-stream mode and post-processes precise mode punctuation cleanup before applying field update.",
              fileRefs: [
                { path: "src/services/world-ai.ts", lines: "143-187" },
              ],
              codeSourceLabel: "world-ai invoke call",
              promptViewEnabled: true,
              codeSource: "supabase.functions.invoke('chat', { messages:[system,user], modelId, stream:false }) -> trim and normalize precise-mode separators",
            },
          ],
        },
      ],
    },
    {
      id: "phase-supporting-apis",
      title: "Supporting Lifecycle APIs",
      subtitle: "Image generation and avatar pathways tied to story/character builders",
      defaultOpen: false,
      sections: [
        {
          id: "section-supporting-image",
          title: "Scene/Cover/Avatar Generation",
          description: "Supplemental Grok image pipelines used by chat, world, and character workflows.",
          items: [
            {
              id: "item-scene-image-pipeline",
              title: "Scene image generation (chat context)",
              tagType: "core-prompt",
              icon: "📝",
              purpose:
                "Analyzes recent dialogue and character descriptors into structured JSON, then assembles byte-limited image prompt for `grok-imagine-image`.",
              fileRefs: [
                { path: "src/components/chronicle/ChatInterfaceTab.tsx", lines: "3436-3498" },
                { path: "supabase/functions/generate-scene-image/index.ts", lines: "47-162, 168-236" },
              ],
              codeSourceLabel: "Scene image analysis prompt",
              promptViewEnabled: true,
              codeSource: `You are an Image Prompt Optimizer...\nOutput JSON schema with characters/bodyDescription/pose/expression/clothing/scene/cameraAngle`,
            },
            {
              id: "item-cover-image-pipeline",
              title: "Cover image generation",
              tagType: "code-logic",
              icon: "🔧",
              purpose:
                "Builds portrait-oriented prompt with optional style/negative modifiers, enforces byte budget, and generates via `grok-imagine-image`.",
              fileRefs: [
                { path: "supabase/functions/generate-cover-image/index.ts", lines: "28-128" },
                { path: "src/components/chronicle/CoverImageGenerationModal.tsx", lines: "1-140" },
              ],
            },
            {
              id: "item-avatar-image-pipeline",
              title: "Avatar generation with prompt optimization",
              tagType: "data-block",
              icon: "📦",
              purpose:
                "Runs two-step flow: optimize short portrait prompt via chat model, then call image model; includes byte-limiting and storage upload fallback for base64 response.",
              fileRefs: [
                { path: "supabase/functions/generate-side-character-avatar/index.ts", lines: "11-187" },
                { path: "src/components/chronicle/AvatarGenerationModal.tsx", lines: "1-140" },
              ],
              codeSourceLabel: "Avatar optimizer + image call flow",
              promptViewEnabled: true,
              codeSource: `Step 1: systemPrompt -> concise portrait prompt under byte budget\nStep 2: POST to /v1/images/generations model=grok-imagine-image`,
            },
          ],
        },
      ],
    },
  ],
  changelog: [
    {
      id: "changelog-2026-03-21-01",
      timestamp: "2026-03-21T00:00:00.000Z",
      title: "React-only API Inspector rebuild baseline",
      author: "ChatGPT Codex",
      problem:
        "Previous inspector depended on a static HTML iframe/postMessage shell and drifted from live code behavior.",
      previousAttempt:
        "Legacy HTML inspector was manually edited over time, causing stale mappings, random/nonexistent table references, and weak handoff reliability.",
      changeMade:
        "Replaced inspector with typed React architecture map, rebuilt all mapped sections from live code paths, and added validators/import-export/changelog operations.",
      filesTouched: [
        "src/pages/style-guide/api-inspector.tsx",
        "src/lib/api-inspector-schema.ts",
        "src/lib/api-inspector-utils.ts",
        "src/data/api-inspector-map-registry.ts",
      ],
      expectedOutcome:
        "A stable in-app source of truth for API Call 1, API Call 2, and AI Enhance paths that agents can extend without re-explaining system architecture.",
      actualOutcome:
        "Baseline React map initialized with code-truth lifecycle mapping, hidden machine-readable source metadata, and integrity validation.",
    },
    {
      id: "changelog-2026-03-21-02",
      timestamp: "2026-03-21T00:00:00.000Z",
      title: "Guide/content mismatch logged",
      author: "ChatGPT Codex",
      problem:
        "Guide HTML content was built from older repository state and contained stale references that no longer matched runtime code.",
      previousAttempt:
        "Treating old HTML content as functional truth produced incorrect mappings (nonexistent containers/tables and wrong extraction surfaces).",
      changeMade:
        "Used guide file only for layout/visual language. Re-audited current `llm.ts`, `ChatInterfaceTab.tsx`, edge functions, and AI services to rebuild map content from code truth.",
      filesTouched: [
        "src/data/api-inspector-map-registry.ts",
      ],
      expectedOutcome:
        "Map structure remains familiar while all behavior descriptions and file refs align to current implementation.",
      actualOutcome:
        "Current map now points to live source paths and active runtime flows across chat, extraction, and enhance pipelines.",
    },
  ],
};
