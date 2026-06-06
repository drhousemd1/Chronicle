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
        { label: "Primary chat model", value: "grok-4.3" },
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
          value: "System prompt assembly is large; instruction drift can occur when adaptive guidance is weak or missing.",
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
                "Creates the user turn, applies established-fact note preservation, increments session message counter, appends any adaptive style guidance to the final user payload, and streams the response while preserving a one-retry repair path.",
              whyItExists:
                "Chronicle needs one authoritative send path that assembles live turn state before any paid narrative request leaves the browser.",
              problemSolved:
                "Prevents established-fact wrappers, session position, adaptive style guidance, and hidden repair retries from being applied inconsistently across normal sends.",
              fileRefs: [
	                {
	                  path: "src/components/chronicle/ChatInterfaceTab.tsx",
			                  lines: "5281-5661",
	                },
              ],
              subItems: [
                {
                  id: "item-handle-send-sub-1",
	                  title: "Established-fact note pre-processing",
                  description:
	                    "`buildEstablishedFactNote` prepends an established-fact guard string when the user wrote AI-character content inside their message.",
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
	                    "Streams model chunks into the UI, retries once when a repair directive is truly warranted, then normalizes placeholder names and commits the accepted assistant message.",
                },
              ],
              crossRefs: [
                {
                  badge: "1",
                  targetItemId: "item-final-user-wrapper",
	                  label: "Session/style wrapper",
                  tooltip: "Values created here are injected into the final user message payload.",
                },
                {
                  badge: "2",
                  targetItemId: "item-final-user-wrapper",
                  label: "Adaptive guidance in final user message",
                  tooltip: "Adaptive style guidance produced here is appended inside the final user message when triggered.",
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
              whyItExists:
                "Regenerate and Continue are not normal sends, so they need dedicated history slicing and control-specific prompt shaping.",
              problemSolved:
                "Prevents regenerate from replaying the same user turn twice and prevents continue from drifting outside AI-controlled character scope.",
              settingsGate:
                "Conditional entry lane. This only runs when the user clicked Regenerate or Continue instead of a normal Send.",
              fileRefs: [
	                {
	                  path: "src/components/chronicle/ChatInterfaceTab.tsx",
			                  lines: "5663-5895, 5897-6163",
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
              id: "item-core-role-logic",
              title: "Core role logic",
              tagType: "core-prompt",
              icon: "📝",
              purpose:
                "Defines the opening roleplay framing before any world, cast, memory, or chat-setting blocks are appended.",
              whyItExists:
                "The chat runtime needs explicit collaborative-fiction framing before world state and cast rules are layered in.",
              problemSolved:
                "Keeps the model in Chronicle's roleplay posture instead of treating the turn like a generic assistant conversation.",
              fileRefs: [
                { path: "src/services/llm.ts", lines: "566" },
              ],
              codeSourceLabel: "`renderCoreRoleLogic` prompt section",
              promptViewEnabled: true,
              codeSource: `--- COLLABORATIVE FICTION CONTEXT ---\n\n- Your role is to continue a dynamic adult collaborative-fiction scene by writing AI-controlled characters' dialogue, visible actions, and internal thoughts, using the story and character context below.\n- You will be responsible for AI characters' dialogue, actions, and internal thoughts.\n- Stories may include mature, erotic, taboo, dark, or intense scenes when the narrative calls for them.\n- Situations involving sexual, non-consensual, dark, taboo, power-dynamic, violent, coercive, or other extreme/intense themes may be part of the selected story context...`,
              crossRefs: [
                {
                  badge: "3",
                  targetItemId: "item-chat-messages-array",
                  label: "Injected as first system message",
                  tooltip: "This section becomes part of systemInstruction, then message[0] in API Call 1 payload.",
                },
              ],
            },
            {
              id: "item-world-context-data",
              title: "World context data block",
              tagType: "data-block",
              icon: "📦",
              purpose:
                "Builds SECTION 2 - STORY AND WORLD CONTEXT from source story fields: story name, brief description, story premise, structured locations, custom world sections, story goals, lore entries, and selected story themes.",
              whyItExists:
                "Story Builder data lives across multiple authored containers, so the runtime needs one normalized world block before dispatch.",
              problemSolved:
                "Prevents important story framing, location, and goal context from silently dropping out of API Call 1.",
              fileRefs: [
                { path: "src/services/llm.ts", lines: "568-586" },
              ],
              codeSourceLabel: "SECTION 2 story/world assembly",
              promptViewEnabled: true,
              codeSource: `SECTION 2 - STORY AND WORLD CONTEXT:\nSTORY NAME, BRIEF DESCRIPTION, STORY PREMISE, LOCATIONS, CUSTOM WORLD CONTENT, MAIN STORY GOALS, ADDITIONAL LORE ENTRIES, STORY THEMES\n(assembled directly from source appData.world/core fields plus selected contentThemes).`,
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
              id: "item-goal-flexibility-directives",
              title: "Story and character goal flexibility directives",
              tagType: "core-prompt",
              icon: "📝",
              purpose:
                "Serializes story goals and character goals with rigid, normal, or flexible guidance so the writer sees how strongly each goal should steer the next response.",
              whyItExists:
                "Goal strength is one of the main levers that prevents passive roleplay while still allowing user-driven deviation when the story supports it.",
              problemSolved:
                "Prevents goal context from becoming a flat checklist where rigid goals, normal goals, and flexible suggestions all look equally important to the model.",
              fileRefs: [
                { path: "src/services/llm.ts", lines: "291-340" },
                { path: "src/types.ts", lines: "72-108, 219" },
              ],
              codeSourceLabel: "Goal flexibility prompt serialization",
              promptViewEnabled: true,
              codeSource: `STORY/CHARACTER GOAL:
- Long-range direction: ...
- Current progress: ...
- Current open milestone: ...
- Goal strength: Rigid | Normal | Flexible
- Current alignment: ...
- Use this goal as background direction for realistic long-term progression.`,
              subItems: [
                {
                  id: "item-goal-flexibility-directives-sub-1",
                  title: "Story goals are global",
                  description:
                    "Story goals are serialized as narrative direction for all characters, with desired outcome, current status, step list, and progress percentage.",
                },
                {
                  id: "item-goal-flexibility-directives-sub-2",
                  title: "Character goals are local motivation",
                  description:
                    "Character goals are serialized inside each character profile, so they influence that character's choices without automatically overriding the whole story.",
                },
                {
                  id: "item-goal-flexibility-directives-sub-3",
                  title: "This is guidance, not the post-turn ledger",
                  description:
                    "API Call 1 uses goal flexibility to steer the writer. API Call 2 separately checks whether story-goal steps were actually completed.",
                },
              ],
              crossRefs: [
                {
                  badge: "7",
                  targetItemId: "item-evaluate-goals",
                  label: "Post-turn goal completion check",
                  tooltip: "API Call 2 evaluates whether pending story-goal steps were completed after the response lands.",
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
              whyItExists:
                "The runtime must know who may speak, what day/time it is, and which continuity facts still matter before generating the next turn.",
              problemSolved:
                "Prevents speaking for user-controlled characters and reduces continuity loss around memories, temporal state, and cast ownership.",
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
              id: "item-trait-serialization",
              title: "Personality trait serialization",
              tagType: "data-block",
              icon: "📦",
              purpose:
                "Serializes populated personality fields into character-card reference text, including split outward/inward traits, legacy flat traits, and fallback personality fields.",
              whyItExists:
                "Chronicle needs character psychology visible to API Call 1 without inventing a scoring layer that the current runtime does not apply.",
              problemSolved:
                "Keeps personality context present while avoiding false documentation about score weighting, visibility offsets, or trend brackets.",
              fileRefs: [
                { path: "src/services/llm.ts", lines: "346-350, 396-427" },
                { path: "src/services/persistence/shared.ts", lines: "56-73" },
                { path: "src/types.ts", lines: "75-84" },
              ],
              codeSourceLabel: "Personality field prompt serialization",
              promptViewEnabled: true,
              codeSource: `Personality prompt serialization:
- Split personality mode renders OUTWARD PERSONALITY and INWARD PERSONALITY sections when populated.
- Legacy flat personality traits still render as character-card reference lines.
- Other populated personality fields render as labeled fallback rows.
- The current API Call 1 prompt path does not apply a numeric personality-weighting layer.`,
              subItems: [
                {
                  id: "item-trait-serialization-sub-1",
                  title: "Split personality groups",
                  description:
                    "Outward and inward trait groups render under separate headings when the character card uses split personality mode.",
                },
                {
                  id: "item-trait-serialization-sub-2",
                  title: "Legacy trait fallback",
                  description:
                    "Older flat trait arrays still render into the personality block so legacy character cards do not lose personality context.",
                },
                {
                  id: "item-trait-serialization-sub-3",
                  title: "No hidden score layer",
                  description:
                    "The prompt currently renders stored personality text directly; it does not calculate impact tiers or score trends before the chat call.",
                },
              ],
            },
            {
              id: "item-instruction-stack",
              title: "Sectioned roleplay rules and formatting stack",
              tagType: "core-prompt",
              icon: "📝",
              purpose:
                "Encodes the sectioned roleplay rules for character initiative, user authorship, formatting, physical continuity, internal thoughts, and setting-specific response behavior.",
              whyItExists:
                "Chronicle needs one stable system-prompt rule area so control, continuity, and formatting constraints do not become implicit or inconsistent.",
              problemSolved:
                "Guards against speaker/avatar drift, unsupported participation, malformed formatting, and user-authorship violations in live dialogue.",
              fileRefs: [
                { path: "src/services/llm.ts", lines: "599-707" },
              ],
              codeSourceLabel: "SECTION 7 roleplay rules stack",
              promptViewEnabled: true,
              codeSource: `SECTION 7 - DIALOG FORMATTING AND ROLEPLAY RULES\n--- NATURAL ROLEPLAY AND CHARACTER INITIATIVE ---\n--- DIALOG FORMATTING RULES ---\n--- INTERNAL THOUGHTS ---\n--- PHYSICAL LOGIC, VISIBILITY, AND CONTINUITY ---`,
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
                "Composes ordered message array: systemInstruction -> up to 5 prior roleplay messages -> final wrapped user message.",
              whyItExists:
                "The edge runtime depends on strict ordering so system rules, the capped recent transcript, adaptive style text, the final user turn, and the compact execution brief land in the right lane without bloating the context window.",
              problemSolved:
                "Prevents wrappers, adaptive style text, and the execution brief from being buried in the wrong message slot or omitted from the outbound payload.",
              fileRefs: [
                { path: "src/services/llm.ts", lines: "132-163" },
              ],
              codeSourceLabel: "`messages` assembly in `generateRoleplayResponseStream`",
              promptViewEnabled: true,
              codeSource: `const historyMessages = conversation.messages\n  .filter((message) => !isLocalRoleplayNoticeMessage(message))\n  .slice(-API_CALL_1_PRIOR_HISTORY_MESSAGE_LIMIT);\nconst appTurnControls = [optional SESSION, current scene snapshot, optional adaptive/repair directive, optional regeneration directive, EXECUTION_BRIEF_TEXT]\n  .filter(Boolean)\n  .join('\\n\\n');\nconst finalUserContent = [\n  appTurnControls ? \`[APP TURN CONTROLS]\\n\${appTurnControls}\` : '',\n  playerTurn ? \`[PLAYER TURN]\\n\${playerTurn}\` : '',\n].filter(Boolean).join('\\n\\n');\nmessages.push({ role: 'user', content: finalUserContent });`,
            },
            {
              id: "item-runtime-directive-message",
              title: "Adaptive style directive",
              tagType: "context-injection",
              icon: "📥",
              purpose:
                "Injects a narrow one-turn style directive into the final user wrapper only when recent assistant turns repeat the same length band, block cadence, exact block shape, short dialogue phrasing, or collapse below the selected detailed response setting.",
              whyItExists:
                "The live writer needs a small corrective nudge when repetition is detected, but Chronicle should not add random style prompts or permanent extra rule blocks every turn.",
              problemSolved:
                "Prevents repeated response shape from continuing while keeping the intervention scoped to objective repetition signals.",
              settingsGate:
                "Conditional final-user wrapper text. It is only present when the runtime detects repetition or when detailed output has collapsed across recent assistant turns.",
              fileRefs: [
                { path: "src/services/llm.ts", lines: "144-163" },
                { path: "src/lib/assistant-style-directive.ts", lines: "245-460" },
                { path: "src/components/chronicle/ChatInterfaceTab.tsx", lines: "1507-1520, 5339-5364, 5714-5735, 5946-5969" },
              ],
              codeSourceLabel: "Adaptive style directive text",
              promptViewEnabled: true,
              codeSource: "[STYLE ADJUSTMENT FOR THIS TURN]\nRecent assistant responses are repeating: ...\nUse recent assistant messages for story state, not as a style template.\nUse established details as causes or consequences when descriptive/topic repetition is detected.\nMove into purposeful external dialogue when low-dialogue output is detected.\n\n[OUTPUT REVISION REQUIRED]\nThe draft needs revision because: ...\nAdd concrete AI-controlled development instead of repeating or asking the user to carry the scene.",
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
                "Wraps the outbound user turn into labeled app-control and player-turn blocks so runtime instructions do not read like player-authored roleplay prose.",
              whyItExists:
                "Chronicle uses lightweight one-turn wrappers for session position, special turn behavior, repair guidance, and immediate-scene priority without mutating stored transcript history.",
              problemSolved:
                "Prevents regenerate/session metadata from being lost while keeping app-generated instructions visibly separated from the player's actual turn.",
              fileRefs: [
                { path: "src/services/llm.ts", lines: "144-163" },
                { path: "src/components/chronicle/ChatInterfaceTab.tsx", lines: "5281-5364, 5663-5738, 5897-5979" },
              ],
              codeSourceLabel: "Final user wrapper expression",
              promptViewEnabled: true,
              codeSource: "[APP TURN CONTROLS]\\n[optional SESSION]\\noptional current scene snapshot\\noptional adaptive/repair directive\\noptional REGENERATION_DIRECTIVE_TEXT\\nEXECUTION_BRIEF_TEXT\\n\\n[PLAYER TURN]\\nuserMessage",
              crossRefs: [
                {
                  badge: "1",
                  targetItemId: "item-handle-send",
                  label: "Inputs originate in send pipeline",
                  tooltip: "Session counter and adaptive style decisions originate in ChatInterfaceTab handleSend.",
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
              whyItExists:
                "The browser must go through the Chronicle edge gateway so auth, pipeline selection, and debug tracing stay centralized.",
              problemSolved:
                "Prevents the frontend from bypassing Chronicle-specific runtime logic or calling the provider directly without app-level safeguards.",
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
                "Rejects missing/invalid auth token and forces model usage to `grok-4.3` when unsupported models are requested.",
              whyItExists:
                "The edge relay has to enforce auth and supported-model policy before any provider call is made.",
              problemSolved:
                "Prevents unauthorized chat calls and model drift away from the supported Chronicle runtime lane.",
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
              whyItExists:
                "All Chronicle chat passes ultimately need one normalized provider request contract once the edge runtime decides which path to run.",
              problemSolved:
                "Prevents frontend/backend payload drift and keeps xAI request shape consistent across direct, planner, and writer passes.",
              fileRefs: [
                { path: "supabase/functions/chat/index.ts", lines: "33-54" },
              ],
              codeSourceLabel: "`callXAI` request body",
              promptViewEnabled: true,
              codeSource: `fetch("https://api.x.ai/v1/chat/completions", {\n  body: JSON.stringify({ model, messages, stream, temperature, max_tokens })\n})`,
            },
            {
              id: "item-content-redirect-retry",
              title: "403 content redirect retry",
              tagType: "validation-check",
              icon: "✓",
              purpose:
                "When xAI returns 403, injects `CONTENT_REDIRECT_DIRECTIVE` as system message and retries once before returning a structured content-filter notice if both requests are blocked.",
              whyItExists:
                "Chronicle needs one narrow recovery path for content-filter interruptions instead of immediately dead-ending the response.",
              problemSolved:
                "Gives direct-mode fallback one chance to preserve scene momentum after a 403 block without looping forever.",
              settingsGate:
                "Failure-only fallback. This retry path only runs after a 403 content-filter block in direct mode.",
              fileRefs: [
                { path: "supabase/functions/chat/index.ts", lines: "24-30, 124-162" },
              ],
              codeSourceLabel: "CONTENT_REDIRECT_DIRECTIVE",
              promptViewEnabled: true,
              codeSource: `[CONTENT REDIRECT]\nThe provider blocked the previous request...\nPreserve the current scene, established facts, character knowledge, and user-control boundaries.\nIf the blocked wording cannot be continued directly, continue through a believable in-character response.`,
            },
            {
              id: "item-stream-pass-through",
              title: "SSE streaming pass-through",
              tagType: "code-logic",
              icon: "🔧",
              purpose:
                "Streams xAI response body through edge function and frontend parser to render token-by-token narrative output.",
              whyItExists:
                "Live roleplay UX depends on streamed turn delivery rather than waiting for one opaque final blob.",
              problemSolved:
                "Prevents dead-feeling wait states and keeps SSE-compatible debug handling aligned with visible text streaming.",
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
              whyItExists:
                "Chronicle still needs state reconciliation after each turn, but that work cannot sit on the visible response hot path.",
              problemSolved:
                "Keeps chat responsive while still updating memories, goals, character state, and new-character side effects in the background.",
              fileRefs: [
                { path: "src/components/chronicle/ChatInterfaceTab.tsx", lines: "5190-5201" },
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
              whyItExists:
                "Post-turn branches can finish after regenerate or a newer turn, so every async write needs branch-awareness.",
              problemSolved:
                "Prevents stale memories, goals, or character updates from overwriting the currently active generation.",
              fileRefs: [
                { path: "src/components/chronicle/ChatInterfaceTab.tsx", lines: "3233-3247, 3457-3472, 4830-4915" },
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
                "Curates only plot-relevant memory events from the latest exchange while comparing against recent saved memories.",
              whyItExists:
                "The memory lane exists to keep durable continuity facts without promoting every line of scene prose into long-term memory.",
              problemSolved:
                "Prevents prompt bloat, skips repeated memory facts, and stops low-value flavor text from polluting the continuity layer.",
              fileRefs: [
                { path: "src/components/chronicle/ChatInterfaceTab.tsx", lines: "5116-5283" },
                { path: "supabase/functions/extract-memory-events/index.ts", lines: "69-121, 153-189" },
              ],
              codeSourceLabel: "Memory curator system prompt",
              promptViewEnabled: true,
              codeSource: `You are a story memory curator...\nExtract only durable facts that would cause future inconsistency if forgotten.\nInclude durable facts introduced by the USER even if the AI response did not repeat them.\nReturn 0-3 events maximum, normalized to short past-tense memory points.`,
            },
            {
              id: "item-compress-day-memories",
              title: "Day memory compression",
              tagType: "core-prompt",
              icon: "📝",
              purpose:
                "When day increments, compresses bullet memories for prior day into 2-3 sentence synopsis for long-term memory storage.",
              whyItExists:
                "Older day-level memory bullets need to collapse into a smaller continuity summary once they are no longer the active scene day.",
              problemSolved:
                "Prevents old bullet memories from endlessly accumulating and bloating future prompt context.",
              settingsGate:
                "Conditional maintenance lane. It runs only when the tracked day advanced and completed-day bullet memories exist.",
              fileRefs: [
                { path: "src/components/chronicle/ChatInterfaceTab.tsx", lines: "893-920" },
                { path: "supabase/functions/compress-day-memories/index.ts", lines: "64-92, 101-112" },
              ],
              codeSourceLabel: "Memory compression prompt",
              promptViewEnabled: true,
              codeSource: `You are compressing a list of story memory bullet points...\nOUTPUT: single plain-text synopsis (2-3 sentences).\nmax_tokens: 350, then deterministic cleanup caps output to 3 sentences and 900 characters.`,
            },
          ],
        },
        {
          id: "section-api2-goals",
          title: "API 2B - Goal Evaluation and Alignment",
          description: "Separates binary story-step completion from goal-alignment diagnostics. Goal alignment is still shadow-mode review data in the live app.",
          items: [
            {
              id: "item-evaluate-goals",
              title: "evaluate-goal-progress edge function",
              tagType: "core-prompt",
              icon: "📝",
              purpose:
                "Builds goal-scoped pending-step context and timeline context, then classifies each pending story-goal step with result, evidence, confidence, and completion status.",
              whyItExists:
                "Story goals need a dedicated post-turn classifier instead of relying on the main response text to update saved progress correctly.",
              problemSolved:
                "Keeps completed goal steps tied to evidence-gated post-turn evaluation rather than loose prose interpretation alone.",
              fileRefs: [
                { path: "src/components/chronicle/ChatInterfaceTab.tsx", lines: "3447-3684" },
                { path: "supabase/functions/evaluate-goal-progress/index.ts", lines: "154-181, 243-305" },
              ],
              codeSourceLabel: "Goal classification prompt",
              promptViewEnabled: true,
              codeSource: `You are a story goal progress evaluator...\nThe client sends only the current open milestone for each incomplete story goal.\nReturn no_progress, partial_progress, completed, or unsupported with evidence and confidence. The client only persists accepted completions.`,
              subItems: [
                {
                  id: "item-evaluate-goals-sub-1",
                  title: "Input scope",
                  description:
                    "The client sends the latest user message, assistant response, pending goal steps with their parent goal context, current day, current time of day, and each step's guidance strength.",
                },
                {
                  id: "item-evaluate-goals-sub-2",
                  title: "Evidence-gated persistence",
                  description:
                    "The edge function returns result, evidence, confidence, and completed status. The client persists only known-step completions with completed result, adequate confidence, and non-placeholder evidence.",
                },
                {
                  id: "item-evaluate-goals-sub-3",
                  title: "Scope boundary",
                  description:
                    "This call should not decide whether the user is receptive to a goal over time. It only checks whether an authored story step was clearly completed.",
                },
              ],
              crossRefs: [
                {
                  badge: "7",
                  targetItemId: "item-post-response-fanout",
                  label: "Triggered by post-response fanout",
                  tooltip: "Goal classification invocation is launched after assistant response commit.",
                },
              ],
            },
            {
              id: "item-evaluate-goal-alignment",
              title: "evaluate-goal-alignment edge function",
              tagType: "core-prompt",
              icon: "📝",
              purpose:
                "Classifies the latest exchange as support, resistance, drift, neutral, or not-applicable for each active story and AI-character goal.",
              whyItExists:
                "Goal strength needs a real feedback loop eventually, but the classifier must be validated before it can change live prompt pressure.",
              problemSolved:
                "Collects alignment diagnostics for review without letting unproven scores steer live generation while shadow mode is enabled.",
              fileRefs: [
                { path: "src/components/chronicle/ChatInterfaceTab.tsx", lines: "3686-3902" },
                { path: "supabase/functions/evaluate-goal-alignment/index.ts", lines: "1-272" },
                { path: "src/lib/goal-alignment.ts", lines: "1-211" },
              ],
              codeSourceLabel: "Goal alignment prompt",
              promptViewEnabled: true,
              codeSource: `You are the post-turn GOAL ALIGNMENT evaluator...
Classify each active goal as support, resistance, drift, neutral, or not_applicable.
Shadow mode keeps these results diagnostic-only until the lane is explicitly enabled.`,
              subItems: [
                {
                  id: "item-evaluate-goal-alignment-sub-1",
                  title: "Scoring owner",
                  description:
                    "Grok classifies the evidence, but Chronicle code applies the numeric score changes so the model cannot invent arbitrary weights.",
                },
                {
                  id: "item-evaluate-goal-alignment-sub-2",
                  title: "Shadow mode",
                  description:
                    "Current evaluations are attached to the debug export but are not persisted or injected into API Call 1 while the lane is being validated.",
                },
              ],
            },
            {
              id: "item-story-goal-derivation-ledger",
              title: "Story goal derivation ledger",
              tagType: "data-block",
              icon: "📦",
              purpose:
                "Persists completed story-goal steps as message-scoped derivations tied to the exact assistant message and generation that caused the completion.",
              whyItExists:
                "Goal progress has to survive refresh/regenerate correctly without permanently mutating the base Story Builder goal definitions in the wrong branch.",
              problemSolved:
                "Prevents stale or regenerated turns from checking off goals that no longer belong to the current conversation branch.",
              fileRefs: [
                { path: "src/components/chronicle/ChatInterfaceTab.tsx", lines: "2753-2775" },
                { path: "src/services/persistence/conversations.ts", lines: "667-729" },
                { path: "src/types.ts", lines: "512-523" },
              ],
              codeSourceLabel: "story_goal_step_derivations write contract",
              promptViewEnabled: true,
              codeSource: `story_goal_step_derivations:
- conversation_id
- goal_id
- step_id
- source_message_id
- source_generation_id
- completed
- day
- time_of_day

Only completed steps are persisted. Each row is tied to the source assistant generation.`,
              crossRefs: [
                {
                  badge: "7",
                  targetItemId: "item-evaluate-goals",
                  label: "Consumes goal classifier completions",
                  tooltip: "Only completed rows returned by evaluate-goal-progress are written into the derivation ledger.",
                },
              ],
            },
            {
              id: "item-goal-alignment-ledger",
              title: "Goal alignment state ledger",
              tagType: "data-block",
              icon: "📦",
              purpose:
                "Defines the durable 0-100 alignment score, trend, status, counters, and source message lineage for story and character goals when the shadow-mode lane is enabled.",
              whyItExists:
                "The live app does not inject this snapshot while shadow mode is enabled; the ledger exists for the future adaptive-goal path.",
              problemSolved:
                "Provides the persistence contract for adaptive goal guidance once the diagnostic lane is proven safe to enable.",
              fileRefs: [
                { path: "supabase/migrations/20260521044256_424aa268-34cd-41aa-a2ea-dc2779b01344.sql", lines: "1-113" },
                { path: "src/services/persistence/conversations.ts", lines: "817-905" },
                { path: "src/services/llm.ts", lines: "217-240" },
              ],
              codeSourceLabel: "goal_alignment_states write contract",
              promptViewEnabled: true,
              codeSource: `goal_alignment_states:
- conversation_id
- goal_kind
- character_id / character_scope_id
- goal_id
- score, status, trend
- support_count, resistance_count, drift_count
- last_signal, last_rationale
- source_message_id, source_generation_id`,
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
              whyItExists:
                "Character reconciliation is heavier and more structured than the hot-path writer, so the client has to package that context separately after the turn lands.",
              problemSolved:
                "Prevents every assistant turn from blindly mutating character state without an explicit eligibility and context pass.",
              fileRefs: [
                { path: "src/components/chronicle/ChatInterfaceTab.tsx", lines: "4113-4441" },
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
              title: "Compact character state-sync prompt",
              tagType: "core-prompt",
              icon: "📝",
              purpose:
                "Extractor prompt compares the latest exchange against eligible saved character cards and returns only supported material deltas.",
              whyItExists:
                "The follow-up call should keep durable character state current without adding a second writing system or broad psychological lecture.",
              problemSolved:
                "Reduces stale cards, speculative rewrites, fake field paths, and prompt bloat in the post-turn state-sync pass.",
              fileRefs: [
                { path: "supabase/functions/extract-character-updates/index.ts", lines: "821-883" },
              ],
              codeSourceLabel: "extract-character-updates system prompt (abridged)",
              promptViewEnabled: true,
              codeSource: `--- CURRENT STORY CLOCK ---\n--- CURRENT CHARACTER STATE ---\n--- SUPPORTED FIELD PATHS ---\n--- CORE TASK ---\n--- FIELD GUIDANCE ---\n--- CHARACTER GOALS ---\n--- CONSERVATIVE UPDATE RULES ---\n--- OUTPUT JSON ---`,
            },
            {
              id: "item-character-extractor-depth-lifecycle",
              title: "Field guidance and goal limits",
              tagType: "core-prompt",
              icon: "📝",
              purpose:
                "Documents the extractor's bounded field rules: update supported fields, refine existing entries, and keep character goals limited and non-duplicative.",
              whyItExists:
                "Character cards still need durable evolution, but the follow-up worker should behave like a conservative state reconciler rather than a free-form author.",
              problemSolved:
                "Prevents unsupported custom containers, duplicate traits/goals, runaway step lists, weak evidence, evidence that does not appear in the latest exchange, and low-confidence edits from becoming saved state.",
              fileRefs: [
                { path: "supabase/functions/extract-character-updates/index.ts", lines: "835-877" },
              ],
              codeSourceLabel: "Character extractor field guidance",
              promptViewEnabled: true,
	              codeSource: `Field guidance:
- currentMood: short emotional state only
- location: broad place, updated only after actual arrival/entry/exit/relocation
- scenePosition: short factual snapshot of the character's immediate physical situation inside the current location
- structured sections use Label: Description
- custom sections only when no structured field fits

Character goals:
- sustained goals only
- update existing goals over duplicates
- brand-new goals only when the latest exchange clearly establishes a sustained objective
- new steps must be durable milestone stages, not current-scene logistics
- completed steps receive app-owned story-clock metadata`,
              subItems: [
                {
                  id: "item-character-extractor-depth-lifecycle-sub-1",
                  title: "Conservative state reconciliation",
                  description:
                    "The extractor can update durable character state, but empty updates are valid and preferred when the exchange does not clearly change a supported field.",
                },
                {
                  id: "item-character-extractor-depth-lifecycle-sub-2",
                  title: "Supported fields only",
                  description:
                    "The prompt and client allowlist reject fake containers such as `sections.Goals.*` when the dedicated `goals.*` field path exists.",
                },
                {
                  id: "item-character-extractor-depth-lifecycle-sub-3",
                  title: "Goal cleanup",
                  description:
                    "Character goals can be updated, completed, removed, or created, but the prompt caps new goal creation and step count to avoid runaway generated checklists.",
                },
              ],
            },
            {
              id: "item-character-extractor-validation",
              title: "Field allowlist + structured reconciliation",
              tagType: "validation-check",
              icon: "✓",
              purpose:
                "Filters unsupported fields, sanitizes mood content, reconciles structured updates to avoid duplicate semantic entries, and supports safe retry on 403.",
              whyItExists:
                "Extractor output still needs deterministic cleanup and allowlist enforcement before it can touch saved character state.",
              problemSolved:
                "Prevents unsupported fields, duplicate structured values, and malformed retry outputs from corrupting saved character data.",
              fileRefs: [
                { path: "supabase/functions/extract-character-updates/index.ts", lines: "118-209, 357-445, 454-555, 887-1099" },
                { path: "src/components/chronicle/ChatInterfaceTab.tsx", lines: "4156-4283, 4312-4397, 4977-5114" },
              ],
              codeSourceLabel: "Validation/reconciliation checkpoints",
              promptViewEnabled: true,
              codeSource: `isAllowedUpdateField(...)\nevidenceAppearsInLatestExchange(...)\nreconcileStructuredUpdates(...)\nsanitizeCurrentMood(...)\n403 -> safe extraction retry prompt`,
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
              whyItExists:
                "Character Builder helper actions need an explicit UI dispatcher so field-level refine requests always know which mode the user chose.",
              problemSolved:
                "Prevents builder enhance actions from firing without clear mode context or bypassing the intended precise/detailed split.",
              settingsGate:
                "Builder-helper lane. It only fires when the user clicks a Character Builder AI enhance control and chooses a mode.",
              fileRefs: [
                { path: "src/features/character-builder/CharacterBuilderScreen.tsx", lines: "443-469, 1272-1585, 1958-1973" },
                { path: "src/components/chronicle/EnhanceModeModal.tsx", lines: "1-44" },
              ],
            },
            {
              id: "item-character-enhance-prompt",
              title: "Character field prompt resolver",
              tagType: "core-prompt",
              icon: "📝",
              purpose:
                "Resolves field-specific instructions and builds mode-aware prompts using full world context + character self-context.",
              whyItExists:
                "Different character fields need tailored prompt instructions instead of one generic enhancement template.",
              problemSolved:
                "Prevents vague, one-size-fits-all enhancements and keeps precise/detailed output aligned to the selected field.",
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
              whyItExists:
                "Chronicle separates 'fill what is missing' from 'generate broader content' so authoring helpers do not behave like one blunt tool.",
              problemSolved:
                "Prevents fill actions from overwriting authored content or generate actions from running without a controlled JSON patch contract.",
              settingsGate:
                "Builder-helper lane. It runs only when the user explicitly invokes AI Fill or AI Generate in the character builder.",
              fileRefs: [
                { path: "src/services/character-ai.ts", lines: "711-980, 981-1320" },
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
              whyItExists:
                "Model helper responses are not always pristine JSON, so the builder needs a tolerant extraction chain before giving up.",
              problemSolved:
                "Prevents character helper flows from collapsing on fenced, wrapped, or slightly malformed JSON responses.",
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
              whyItExists:
                "Story Builder world fields span multiple shapes, so the UI needs one dispatcher that normalizes them before AI enhancement.",
              problemSolved:
                "Prevents the wrong world field or goal-step path from being enhanced when the user triggers a Story Builder helper action.",
              settingsGate:
                "Builder-helper lane. It only runs when a Story Builder world-field sparkle or enhance control is used.",
              fileRefs: [
                { path: "src/features/story-builder/StoryBuilderScreen.tsx", lines: "161-205, 360-405, 560-585, 1031-1042" },
              ],
            },
            {
              id: "item-world-enhance-prompt",
              title: "World field prompt builder",
              tagType: "core-prompt",
              icon: "📝",
              purpose:
                "Builds structured world-field enhancement prompt with per-field instruction sets and mode-specific output constraints.",
              whyItExists:
                "World-building content needs a different instruction contract than character-field enhancement.",
              problemSolved:
                "Prevents character-style enhancement rules from being misapplied to premise, location, goal, or custom world text.",
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
              whyItExists:
                "World enhancement still rides the shared chat backend, so this lane owns the non-stream invoke contract and post-processing for builder-safe output.",
              problemSolved:
                "Prevents world-field helper responses from returning raw chat output that is not normalized for precise-mode builder insertion.",
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
              whyItExists:
                "Scene-image generation has to translate chat context into a smaller visual prompt contract before calling the image model.",
              problemSolved:
                "Prevents chat-driven image requests from overflowing prompt budgets or losing core scene/cast descriptors.",
              settingsGate:
                "Optional image lane. This only fires when the user asks the chat interface to generate a scene image.",
              fileRefs: [
                { path: "src/components/chronicle/ChatInterfaceTab.tsx", lines: "6375-6460" },
                { path: "supabase/functions/generate-scene-image/index.ts", lines: "34-140, 218-321, 327-474" },
              ],
              codeSourceLabel: "Scene image analysis prompt",
              promptViewEnabled: true,
              codeSource: `You are an Image Prompt Optimizer...\nOutput JSON schema with sparse visual fields, relevant visible weighted traits, neutral fallbacks, and no private nonvisual inference.`,
            },
            {
              id: "item-cover-image-pipeline",
              title: "Cover image generation",
              tagType: "code-logic",
              icon: "🔧",
              purpose:
                "Builds portrait-oriented prompt with optional style/negative modifiers, enforces byte budget, and generates via `grok-imagine-image`.",
              whyItExists:
                "Cover art generation has its own prompt shape and byte budget that differ from the live narrative request path.",
              problemSolved:
                "Prevents Story Builder cover generation from sending oversized or wrongly formatted image prompts.",
              settingsGate:
                "Optional image lane. This only runs when cover art generation is launched from story-builder media tools.",
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
              whyItExists:
                "Avatar generation needs an optimization step because portrait prompts are short, storage-limited, and reused across character surfaces.",
              problemSolved:
                "Prevents weak raw avatar prompts and handles image-model output/storage edge cases without breaking onboarding flows.",
              settingsGate:
                "Optional image lane. This runs for manual avatar generation and side-character onboarding, not for the default chat path.",
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
      id: "changelog-2026-04-25-01",
      timestamp: "2026-04-25T00:00:00.000Z",
      title: "Documented goal direction and extractor lifecycle systems",
      author: "ChatGPT Codex",
      problem:
        "API Inspector did not make several active roleplay-control systems obvious enough, especially goal flexibility, personality prompt serialization, goal-step derivations, and deep character extractor lifecycle rules.",
      previousAttempt:
        "The systems were partly visible through scattered prompt/card details, but their purpose and relationship to API Call 1 and API Call 2 were easy to miss during dialogue debugging.",
      changeMade:
        "Added explicit API Inspector items for story/character goal flexibility directives, personality trait serialization, story-goal derivation persistence, and deep psychology/goal lifecycle extraction.",
      filesTouched: [
        "src/data/api-inspector-code-truth-registry.ts",
      ],
      expectedOutcome:
        "Agents can audit the live roleplay request and post-turn extraction flow without forgetting how goal strength, personality serialization, goal completion, and character evolution feed into dialogue behavior.",
      actualOutcome:
        "API Inspector now surfaces these systems in the existing detail-card flow with purpose, why-it-exists, problem-risk coverage, source paths, and prompt/source snippets.",
    },
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
