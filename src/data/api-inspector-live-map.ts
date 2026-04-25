export type ApiInspectorFamily =
  | "all"
  | "call-1"
  | "call-2"
  | "images"
  | "ai-enhance"
  | "admin"
  | "data";

export type ApiInspectorTag =
  | "code-logic"
  | "context-injection"
  | "core-prompt"
  | "data-block"
  | "validation"
  | "service"
  | "edge-function"
  | "storage"
  | "rpc"
  | "database";

export type ApiInspectorOwnerTone = "component" | "service" | "edge" | "storage" | "database";

export interface ApiInspectorFileRef {
  path: string;
  locator?: string;
}

export interface ApiInspectorBullet {
  label: string;
  text: string;
}

export interface ApiInspectorItem {
  id: string;
  title: string;
  tag: ApiInspectorTag;
  summary: string;
  whyItExists?: string;
  problemSolved?: string;
  settingsGate?: string;
  fileRefs: ApiInspectorFileRef[];
  bullets: ApiInspectorBullet[];
  meta?: string[];
}

export interface ApiInspectorGroup {
  id: string;
  title: string;
  description: string;
  ownerTone: ApiInspectorOwnerTone;
  primaryRef: ApiInspectorFileRef;
  items: ApiInspectorItem[];
}

export interface ApiInspectorPhase {
  id: string;
  title: string;
  subtitle: string;
  groups: ApiInspectorGroup[];
}

export interface ApiInspectorSection {
  id: string;
  family: Exclude<ApiInspectorFamily, "all">;
  navLabel: string;
  navSubtitle: string;
  kicker: string;
  title: string;
  description: string;
  phases: ApiInspectorPhase[];
}

export const API_INSPECTOR_FILTERS: Array<{
  value: ApiInspectorFamily;
  label: string;
}> = [
  { value: "all", label: "All Flows" },
  { value: "call-1", label: "API Call 1" },
  { value: "call-2", label: "API Call 2" },
  { value: "images", label: "Image Generation" },
  { value: "ai-enhance", label: "AI Enhance" },
  { value: "admin", label: "Admin + Telemetry" },
  { value: "data", label: "Data + Storage" },
];

export const API_INSPECTOR_SOURCE_NOTE =
  "Code-truth rebuild. This map is derived from the live Chronicle repo instead of the older HTML guide template, so it now tracks the real request chain across chat, post-turn extractors, image generation, AI helpers, finance/API-usage indexing, admin tooling, and the broader Supabase persistence lanes that sit across the rest of the application.";

const ref = (path: string, locator?: string): ApiInspectorFileRef => ({ path, locator });
const bullet = (label: string, text: string): ApiInspectorBullet => ({ label, text });

export const apiInspectorLiveSections: ApiInspectorSection[] = [
  {
    id: "api-call-1",
    family: "call-1",
    navLabel: "API Call 1",
    navSubtitle: "Paid narrative request path",
    kicker: "API Call 1",
    title: "Narrative Request Path",
    description:
      "Primary paid roleplay request from chat action through prompt assembly, edge orchestration, planner/writer runtime, and streaming response return.",
    phases: [
      {
        id: "api-call-1-pre-send",
        title: "Phase 1: Pre-Send Entry",
        subtitle: "Chat action, turn shaping, and one-turn runtime corrections before the paid request leaves the client.",
        groups: [
          {
            id: "api-call-1-chat-entrypoints",
            title: "ChatInterfaceTab.tsx",
            description: "Visible chat actions and turn-level runtime preparation.",
            ownerTone: "component",
            primaryRef: ref("/src/components/chronicle/ChatInterfaceTab.tsx"),
            items: [
              {
                id: "call1-entrypoints",
                title: "Send, Continue, and Regenerate entrypoints",
                tag: "code-logic",
                summary:
                  "The chat tab decides which conversation slice, user input, and active runtime state get turned into the next LLM request.",
                fileRefs: [
                  ref("/src/components/chronicle/ChatInterfaceTab.tsx", "handleSend"),
                  ref("/src/components/chronicle/ChatInterfaceTab.tsx", "handleRegenerateMessage"),
                  ref("/src/components/chronicle/ChatInterfaceTab.tsx", "handleContinueConversation"),
                ],
                bullets: [
                  bullet("Send", "Appends the user message locally, builds effective scenario data, and starts the streaming generator for the next assistant turn."),
                  bullet("Regenerate", "Slices conversation history so the triggering user turn is not double-fed, then asks for a different take on the same beat."),
                  bullet("Continue", "Builds a goal-aware continuation instruction that explicitly limits output to AI-controlled characters."),
                  bullet("Shared state", "All three paths read the active conversation, effective canonical character state, temporal context, scene scope, and current model selection."),
                ],
                meta: ["chat ui", "conversation slice", "roleplay entry"],
              },
              {
                id: "call1-turn-wrappers",
                title: "Canon note, session counter, and anti-loop directives",
                tag: "context-injection",
                summary:
                  "Before the paid request is assembled, the chat layer can add one-turn wrappers that preserve canon or break repetitive response patterns.",
                fileRefs: [
                  ref("/src/components/chronicle/ChatInterfaceTab.tsx", "buildCanonNote"),
                  ref("/src/components/chronicle/ChatInterfaceTab.tsx", "getAntiLoopDirective"),
                  ref("/src/components/chronicle/ChatInterfaceTab.tsx", "sessionMessageCountRef"),
                  ref("/src/services/llm.ts", "generateRoleplayResponseStream"),
                ],
                bullets: [
                  bullet("Canon carry-forward", "Prepends a guard note when the user typed AI-character dialogue in their own message so regenerate/continue does not overwrite it as fresh canon."),
                  bullet("Session counter", "Adds [SESSION: Message N of current session] to the final outbound user content so the model gets turn-position context."),
                  bullet("Anti-loop lane", "Only emits a runtime directive when recent turns show repetitive patterns; the directive is injected as a dedicated system message, not buried in user prose."),
                  bullet("Length and regenerate wrappers", "Optional response-length text and the regenerate directive are composed only for the turn types that need them."),
                ],
                meta: ["canon note", "runtime directive", "session wrapper"],
              },
            ],
          },
        ],
      },
      {
        id: "api-call-1-client-assembly",
        title: "Phase 2: Prompt Assembly and Client Envelope",
        subtitle: "System instruction, ordered message array, call-1 telemetry, and roleplay context payload built in llm.ts.",
        groups: [
          {
            id: "api-call-1-llm-client",
            title: "llm.ts",
            description: "Prompt assembly, browser-side request envelope, and SSE client parser.",
            ownerTone: "service",
            primaryRef: ref("/src/services/llm.ts"),
            items: [
              {
                id: "call1-system-instruction",
                title: "System instruction assembly",
                tag: "core-prompt",
                summary:
                  "getSystemInstruction() serializes the collaborative-fiction preamble, world state, codex, cast cards, scene scope, memories, and instruction hierarchy into the first system message.",
                fileRefs: [
                  ref("/src/services/llm.ts", "getSystemInstruction"),
                  ref("/src/services/llm.ts", "sandboxContext / coreMission"),
                  ref("/src/constants/tag-injection-registry.ts", "content-theme injection"),
                ],
                bullets: [
                  bullet("World state", "Pulls story name, brief, premise, locations, dialog formatting, custom world sections, and story goals from canonical world core."),
                  bullet("Cast state", "Serializes AI-controlled characters, user-controlled exclusions, side characters, and active-scene context into the same instruction body."),
                  bullet("Continuity blocks", "Includes temporal state, memories, and content-theme directives so the paid call sees the current narrative frame."),
                  bullet("Instruction stack", "Adds control rules, scene presence, line-of-sight rules, formatting rules, and naming constraints before the request is dispatched."),
                ],
                meta: ["system prompt", "world context", "cast serialization"],
              },
              {
                id: "call1-final-envelope",
                title: "Final message array, roleplayContext, and chat request body",
                tag: "data-block",
                summary:
                  "The browser posts a normalized message envelope to /functions/v1/chat with stream intent, selected model, pipeline=roleplay_v2, debugTrace, and roleplayContext metadata.",
                fileRefs: [
                  ref("/src/services/llm.ts", "generateRoleplayResponseStream"),
                  ref("/src/integrations/supabase/client.ts", "auth session"),
                ],
                bullets: [
                  bullet("Message order", "The final array is: system instruction, existing conversation history, optional one-turn runtime directive, then the final wrapped user message."),
                  bullet("Context metadata", "roleplayContext carries conversation id, day, time of day, active scene title/tags, and AI-vs-user character name lists."),
                  bullet("Streaming contract", "The request uses fetch() directly against the Supabase edge function because the client expects an SSE response body."),
                  bullet("Pipeline selection", "Live chat explicitly targets roleplay_v2 from the browser, while other one-shot helpers can still invoke chat in direct mode."),
                ],
                meta: ["/functions/v1/chat", "stream=true", "pipeline=roleplay_v2"],
              },
              {
                id: "call1-telemetry-validation",
                title: "Call-1 usage telemetry and payload validation snapshots",
                tag: "validation",
                summary:
                  "Before the request leaves the browser, llm.ts records usage cost estimates and payload-presence snapshots for admin trace/reporting tools.",
                fileRefs: [
                  ref("/src/services/llm.ts", "emitCall1Trace"),
                  ref("/src/services/api-usage-validation.ts", "buildCall1ValidationPresence"),
                  ref("/src/services/api-usage-validation.ts", "trackApiValidationSnapshot"),
                  ref("/src/services/usage-tracking.ts", "trackAiUsageEvent"),
                ],
                bullets: [
                  bullet("Usage event", "Tracks chat_call_1 with estimated input/output chars, token counts, cost, latency, and status."),
                  bullet("Validation snapshot", "Sends a field-presence map that checks whether world, cast, and wrapper blocks actually landed in the outgoing system instruction."),
                  bullet("Admin-only visibility", "These traces feed test sessions and admin diagnostics without changing the visible chat response for players."),
                ],
                meta: ["usage tracing", "payload coverage", "admin diagnostics"],
              },
            ],
          },
        ],
      },
      {
        id: "api-call-1-edge-runtime",
        title: "Phase 3: Edge Runtime",
        subtitle: "Supabase chat relay validates the request, chooses the runtime path, and orchestrates the planner/writer pipeline.",
        groups: [
          {
            id: "api-call-1-chat-edge",
            title: "supabase/functions/chat/index.ts",
            description: "Edge relay, planner/writer orchestration, direct fallback, and stream normalization.",
            ownerTone: "edge",
            primaryRef: ref("/supabase/functions/chat/index.ts"),
            items: [
              {
                id: "call1-edge-ingress",
                title: "Ingress guards and provider gate",
                tag: "validation",
                summary:
                  "The relay validates auth, CORS, rate limits, model choice, and stream settings before any provider request leaves the backend.",
                fileRefs: [
                  ref("/supabase/functions/chat/index.ts", "serve() request handler"),
                  ref("/supabase/functions/_shared/cors.ts", "getCorsHeaders"),
                  ref("/supabase/functions/_shared/rate-limit.ts", "checkRateLimit / getRateLimitHeaders"),
                ],
                bullets: [
                  bullet("Auth", "Requires a valid bearer token and resolves the signed-in user through Supabase auth before continuing."),
                  bullet("Model gate", "Rejects unsupported models and keeps Chronicle chat on the xAI/Grok provider lane."),
                  bullet("Runtime switch", "Accepts direct or roleplay_v2, but the live roleplay browser path sends roleplay_v2 by default."),
                  bullet("Debug contract", "Can attach a structured chronicle_debug_trace to SSE or JSON responses when debugTrace is requested by an admin client."),
                ],
                meta: ["auth", "rate limit", "xAI only"],
              },
              {
                id: "call1-planner-pass",
                title: "Supporting excerpt selection and planner pass",
                tag: "code-logic",
                summary:
                  "roleplay_v2 first trims the transcript into recent and supporting windows, then asks a planner pass for focus, direct questions, continuity notes, and must-avoid beats.",
                fileRefs: [
                  ref("/supabase/functions/chat/index.ts", "RECENT_HISTORY_WINDOW / SUPPORTING_HISTORY_WINDOW"),
                  ref("/supabase/functions/chat/index.ts", "runRoleplayV2"),
                  ref("/supabase/functions/chat/index.ts", "callXAIForJson"),
                ],
                bullets: [
                  bullet("Recent window", "The latest 16 messages remain on the hot path."),
                  bullet("Supporting canon", "Up to 8 older excerpts are scored for bridge continuity, unresolved questions, character references, and scene-tag relevance."),
                  bullet("Planner output", "The JSON plan drives focusCharacter, directQuestionsToAnswer, mustInclude, mustAvoid, continuityNotes, sceneStateFacts, and formattingNotes."),
                  bullet("Failure behavior", "If the planner call or JSON parse fails, the relay falls back to a minimal safe plan instead of dropping out of roleplay_v2 immediately."),
                ],
                meta: ["recent=16", "supporting=8", "planner json"],
              },
              {
                id: "call1-writer-cleanup",
                title: "Writer pass and deterministic cleanup",
                tag: "core-prompt",
                summary:
                  "The writer receives the system messages, planner injection, supporting excerpts, and recent transcript, then Chronicle applies deterministic cleanup instead of a second blocking validator model pass.",
                fileRefs: [
                  ref("/supabase/functions/chat/index.ts", "writerPlanInjection / writerInput"),
                  ref("/supabase/functions/chat/index.ts", "callXAI"),
                  ref("/supabase/functions/chat/index.ts", "normalizeFinalText / collectPolicyViolations"),
                ],
                bullets: [
                  bullet("Writer input", "System messages are preserved, the planner JSON is injected as a high-priority plan, supporting excerpts are marked [earlier], and recent history stays in natural order."),
                  bullet("Runtime temps", "The planner runs colder than the writer; direct mode keeps its own temperature lane."),
                  bullet("Deterministic cleanup", "Normalization strips leaked separator lines, wrapper tags, and banned trope labels, then records policy-violation notes inside the debug trace."),
                  bullet("No extra blocking validator call", "The current runtime intentionally avoids the slower model-validator hot path and instead uses planner + writer + deterministic cleanup."),
                ],
                meta: ["planner -> writer", "deterministic cleanup", "no blocking validator pass"],
              },
              {
                id: "call1-direct-fallback",
                title: "Direct fallback path and 403 content redirect retry",
                tag: "validation",
                summary:
                  "If roleplay_v2 cannot produce usable text, the relay falls back to the legacy direct lane, which still includes Chronicle's one-time content redirect retry for 403 responses.",
                settingsGate:
                  "Failure-only fallback. This path runs only when roleplay_v2 fails or direct mode hits a 403 content redirect case.",
                fileRefs: [
                  ref("/supabase/functions/chat/index.ts", "runDirectPipeline"),
                  ref("/supabase/functions/chat/index.ts", "CONTENT_REDIRECT_DIRECTIVE"),
                  ref("/supabase/functions/chat/index.ts", "callXAI"),
                ],
                bullets: [
                  bullet("Roleplay_v2 fallback", "Writer failure, parse failure, or empty normalized output can drop the request to direct mode instead of returning a hard error."),
                  bullet("403 redirect retry", "In direct mode only, a 403 can trigger one retry with CONTENT_REDIRECT_DIRECTIVE inserted just before the final user message."),
                  bullet("Stop condition", "If the retry still fails, the relay returns a content_filtered style error rather than looping forever."),
                ],
                meta: ["direct fallback", "403 retry", "content redirect"],
              },
            ],
          },
        ],
      },
      {
        id: "api-call-1-return-path",
        title: "Phase 4: Stream Return and Turn Commit",
        subtitle: "The browser parses SSE chunks, attaches optional debug trace data, and only then commits the assistant message plus downstream work.",
        groups: [
          {
            id: "api-call-1-stream-return",
            title: "llm.ts + ChatInterfaceTab.tsx",
            description: "SSE client parser, visible streaming UI, final normalization, and handoff into post-turn orchestration.",
            ownerTone: "service",
            primaryRef: ref("/src/services/llm.ts", "SSE parser"),
            items: [
              {
                id: "call1-sse-parser",
                title: "SSE parser and debug trace intake",
                tag: "code-logic",
                summary:
                  "llm.ts reads text/event-stream chunks line by line, forwards content deltas to the UI, and intercepts chronicle_debug_trace packets separately.",
                fileRefs: [
                  ref("/src/services/llm.ts", "ReadableStream parser"),
                  ref("/src/features/chat-debug/types.ts", "ChatDebugTrace"),
                ],
                bullets: [
                  bullet("Chunk contract", "Expected content arrives in Grok-style delta chunks; debug trace payloads are emitted as separate SSE events and do not become visible prose."),
                  bullet("Streaming UI", "Each text delta is yielded back to ChatInterfaceTab so the in-flight assistant message can render token by token."),
                  bullet("Admin trace hook", "When debugTrace is enabled for an admin user, the client keeps the trace object alongside the final message for session-log export."),
                ],
                meta: ["SSE", "chronicle_debug_trace", "stream parser"],
              },
              {
                id: "call1-turn-commit",
                title: "Assistant message commit, sanitization, and call-2 handoff",
                tag: "code-logic",
                summary:
                  "After streaming finishes, the chat tab sanitizes the output, persists the assistant message, stores debug trace data, and launches post-turn background work.",
                fileRefs: [
                  ref("/src/components/chronicle/ChatInterfaceTab.tsx", "sanitizeAssistantOutput / normalizePlaceholderNames"),
                  ref("/src/components/chronicle/ChatInterfaceTab.tsx", "saveChatDebugTrace"),
                  ref("/src/components/chronicle/ChatInterfaceTab.tsx", "queueAssistantDerivedWork"),
                  ref("/src/services/persistence/conversations.ts", "saveNewMessages"),
                ],
                bullets: [
                  bullet("Output cleanup", "Frontend sanitization strips legacy artifacts such as stray separator lines or malformed speaker markers before the final assistant message is saved."),
                  bullet("Persistence", "The completed assistant message is written to the messages table with generation_id support for stale-result protection downstream."),
                  bullet("Debug export", "Admin debug trace data is attached to the committed assistant message so Download Session Log can emit the same trace later."),
                  bullet("Downstream launch", "Only after the assistant turn is stable does the client queue post-turn extraction, goal evaluation, memories, and any other call-2 work."),
                ],
                meta: ["message commit", "frontend sanitize", "call-2 launch"],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "api-call-2",
    family: "call-2",
    navLabel: "API Call 2",
    navSubtitle: "Async post-turn reconciliation",
    kicker: "API Call 2",
    title: "Post-Response Stateful Extraction",
    description:
      "Non-blocking post-turn work that only starts after the assistant reply is committed, so memories, goal steps, and character state can be updated without slowing visible chat.",
    phases: [
      {
        id: "api-call-2-fanout",
        title: "Phase 1: Post-Turn Fanout",
        subtitle: "The chat layer launches secondary work only after the visible assistant message is finalized.",
        groups: [
          {
            id: "api-call-2-chat-fanout",
            title: "ChatInterfaceTab.tsx",
            description: "Orchestrates the post-turn fanout and guards stale async writes.",
            ownerTone: "component",
            primaryRef: ref("/src/components/chronicle/ChatInterfaceTab.tsx"),
            items: [
              {
                id: "call2-fanout",
                title: "queueAssistantDerivedWork fanout",
                tag: "code-logic",
                summary:
                  "The chat tab fans out memory extraction, goal evaluation, and character extraction in parallel after the assistant reply is already stable on screen.",
                fileRefs: [
                  ref("/src/components/chronicle/ChatInterfaceTab.tsx", "queueAssistantDerivedWork"),
                  ref("/src/components/chronicle/ChatInterfaceTab.tsx", "queueAssistantMemoryExtraction"),
                  ref("/src/components/chronicle/ChatInterfaceTab.tsx", "evaluateGoalProgress"),
                  ref("/src/components/chronicle/ChatInterfaceTab.tsx", "extractCharacterUpdatesFromDialogue"),
                ],
                bullets: [
                  bullet("Critical-path split", "Post-turn work is intentionally launched after message persistence so the assistant response stays fast for the end user."),
                  bullet("Parallel branches", "Memory extraction, goal-step evaluation, and character-state extraction do not wait on one another."),
                  bullet("Heuristic gate", "Character extraction only runs when the turn looks worth reconciling or when the periodic backstop forces a deeper pass."),
                ],
                meta: ["post-turn", "parallel fanout", "async background"],
              },
              {
                id: "call2-stale-guard",
                title: "Stale-result guard by message id and generation id",
                tag: "validation",
                summary:
                  "Async results are accepted only if they still belong to the latest active turn for that message, preventing older branches from overwriting newer canon.",
                fileRefs: [
                  ref("/src/components/chronicle/ChatInterfaceTab.tsx", "isMessageGenerationStillCurrent"),
                  ref("/src/services/persistence/conversations.ts", "messages.generation_id writes"),
                ],
                bullets: [
                  bullet("What it checks", "The guard compares the source message id and generation id attached to the async request against the latest persisted message state."),
                  bullet("Where it applies", "Memory extraction, goal updates, and character snapshot persistence all check freshness before mutating state."),
                  bullet("Why it matters", "This is what makes heavy post-turn concurrency safe across regenerate, delete, and quick user follow-up turns."),
                ],
                meta: ["stale write protection", "generation ledger", "async safety"],
              },
            ],
          },
        ],
      },
      {
        id: "api-call-2-memory",
        title: "Phase 2: Memory Lifecycle",
        subtitle: "Event extraction keeps only durable story facts, then day rollover can compress old bullet memories into a synopsis.",
        groups: [
          {
            id: "api-call-2-memory-branch",
            title: "Memory extraction branch",
            description: "Assistant text -> extracted events -> memory records.",
            ownerTone: "edge",
            primaryRef: ref("/supabase/functions/extract-memory-events/index.ts"),
            items: [
              {
                id: "call2-memory-extract",
                title: "extract-memory-events edge call",
                tag: "core-prompt",
                summary:
                  "The memory extractor uses the final assistant message plus character-name context to keep only lasting narrative facts instead of every line of scene prose.",
                fileRefs: [
                  ref("/src/components/chronicle/ChatInterfaceTab.tsx", "queueAssistantMemoryExtraction"),
                  ref("/supabase/functions/extract-memory-events/index.ts", "serve()"),
                ],
                bullets: [
                  bullet("Inputs", "Receives messageText, known characterNames, and the active model id from the chat tab."),
                  bullet("Output", "Returns extractedEvents that the client converts into one memory record or a bullet list, depending on count."),
                  bullet("Write-back", "handleCreateMemory persists the extracted content to the memories table with source message and generation metadata."),
                ],
                meta: ["extract-memory-events", "memories table", "story continuity"],
              },
            ],
          },
          {
            id: "api-call-2-memory-compress",
            title: "Day rollover compression",
            description: "Completed-day bullets are collapsed into a synopsis when the day increments.",
            ownerTone: "edge",
            primaryRef: ref("/supabase/functions/compress-day-memories/index.ts"),
            items: [
              {
                id: "call2-memory-compress",
                title: "compress-day-memories edge call",
                tag: "code-logic",
                summary:
                  "When the tracked day increments, Chronicle compresses the completed day's bullet memories into a synopsis and deletes the original bullet rows.",
                settingsGate:
                  "Day-rollover lane. This only runs when the day advanced and compressible bullet memories exist for the completed day.",
                fileRefs: [
                  ref("/src/components/chronicle/ChatInterfaceTab.tsx", "day-change memory compression effect"),
                  ref("/supabase/functions/compress-day-memories/index.ts", "serve()"),
                  ref("/src/services/persistence/conversations.ts", "createMemory / deleteMemory"),
                ],
                bullets: [
                  bullet("Trigger", "Runs only when the current day increases and completed-day bullet memories exist."),
                  bullet("Result", "The edge function returns one synopsis string; the client saves it as a synopsis memory and removes the previous bullet entries."),
                  bullet("Why it matters", "This keeps memory context compact so older days do not keep bloating future call-1 prompts."),
                ],
                meta: ["day rollover", "memory compression", "prompt size control"],
              },
            ],
          },
        ],
      },
      {
        id: "api-call-2-goals",
        title: "Phase 3: Goal Progress Derivation",
        subtitle: "Pending story-goal steps are classified from the latest user/assistant turn and persisted as per-message derivations.",
        groups: [
          {
            id: "api-call-2-goal-branch",
            title: "Goal evaluation branch",
            description: "Pending goal steps are checked off the latest turn without blocking chat.",
            ownerTone: "edge",
            primaryRef: ref("/supabase/functions/evaluate-goal-progress/index.ts"),
            items: [
              {
                id: "call2-goal-eval",
                title: "evaluate-goal-progress edge call",
                tag: "core-prompt",
                summary:
                  "The goal evaluator receives the last user turn, the assistant response, pending goal steps, and temporal context to classify which steps just became complete.",
                settingsGate:
                  "Conditional branch. This only fires when the story still has pending goal steps worth evaluating.",
                fileRefs: [
                  ref("/src/components/chronicle/ChatInterfaceTab.tsx", "evaluateGoalProgress"),
                  ref("/supabase/functions/evaluate-goal-progress/index.ts", "serve()"),
                ],
                bullets: [
                  bullet("Inputs", "userMessage, aiResponse, pendingSteps, flexibility, currentDay, and currentTimeOfDay."),
                  bullet("Output", "stepUpdates with completed=true/false; the client keeps only the completed rows that map back to known pending steps."),
                  bullet("Guard", "Results are discarded if the source assistant message is no longer current."),
                ],
                meta: ["evaluate-goal-progress", "pending steps", "completion classifier"],
              },
              {
                id: "call2-goal-persist",
                title: "Story-goal derivation persistence",
                tag: "database",
                summary:
                  "Completed step updates are written as source-message derivations instead of mutating the original goal definitions blindly.",
                fileRefs: [
                  ref("/src/services/persistence/conversations.ts", "upsertStoryGoalStepDerivations"),
                  ref("/src/services/persistence/conversations.ts", "fetchStoryGoalStepDerivations"),
                ],
                bullets: [
                  bullet("Ledger table", "story_goal_step_derivations records goal id, step id, completed state, day/time, source message id, and source generation id."),
                  bullet("Why ledgered", "This makes regenerate and stale-result rejection safer because each completion is tied back to the exact assistant turn that produced it."),
                ],
                meta: ["story_goal_step_derivations", "source generation", "goal ledger"],
              },
            ],
          },
        ],
      },
      {
        id: "api-call-2-character-state",
        title: "Phase 4: Character-State Reconciliation",
        subtitle: "Chronicle extracts allowed state updates from the latest dialogue and persists them as per-message snapshots for main and side characters.",
        groups: [
          {
            id: "api-call-2-character-extract",
            title: "Character update extraction",
            description: "Latest dialogue + recent context + eligible cast -> structured update proposals.",
            ownerTone: "edge",
            primaryRef: ref("/supabase/functions/extract-character-updates/index.ts"),
            items: [
              {
                id: "call2-character-extract",
                title: "extract-character-updates edge call",
                tag: "core-prompt",
                summary:
                  "The extractor reads the current user/assistant exchange, recent filtered context, and eligible characters, then proposes only supported field updates.",
                settingsGate:
                  "Conditional branch. Character-state extraction only runs when the turn qualifies for reconciliation or when the periodic backstop forces a deeper pass.",
                fileRefs: [
                  ref("/src/components/chronicle/ChatInterfaceTab.tsx", "extractCharacterUpdatesFromDialogue"),
                  ref("/supabase/functions/extract-character-updates/index.ts", "serve()"),
                ],
                bullets: [
                  bullet("Scoped input", "The client sends recentContext, allCharacters payload, eligibleCharacters, and the current turn so the extractor has both local beat context and stable reference cards."),
                  bullet("Allowlist", "Unsupported fields are filtered both server-side and client-side before anything can touch canonical state."),
                  bullet("Safety retry", "The edge function has its own 403 safe-extraction retry path for cases where the first pass is blocked."),
                ],
                meta: ["extract-character-updates", "eligible characters", "field allowlist"],
              },
              {
                id: "call2-character-apply",
                title: "Effective-state merge and canonical snapshot persistence",
                tag: "database",
                summary:
                  "Accepted updates are merged into effective main/side character snapshots, diffed against the previous effective state, and only then persisted as source-message snapshots.",
                fileRefs: [
                  ref("/src/components/chronicle/ChatInterfaceTab.tsx", "applyExtractedUpdates"),
                  ref("/src/components/chronicle/ChatInterfaceTab.tsx", "applyUpdatesToCharacterSnapshot"),
                  ref("/src/components/chronicle/ChatInterfaceTab.tsx", "applyUpdatesToSideCharacterSnapshot"),
                  ref("/src/services/persistence/conversations.ts", "upsertCharacterStateMessageSnapshot"),
                  ref("/src/services/persistence/side-characters.ts", "upsertSideCharacterMessageSnapshot"),
                ],
                bullets: [
                  bullet("Main characters", "character_state_message_snapshots stores the next effective state payload keyed by character, source message, and source generation."),
                  bullet("Side characters", "side_character_message_snapshots mirrors the same pattern for generated side-cast state."),
                  bullet("Delta-only", "If the next effective payload matches the previous one, Chronicle skips the write entirely."),
                ],
                meta: ["snapshot tables", "effective state", "delta-only persist"],
              },
            ],
          },
        ],
      },
      {
        id: "api-call-2-side-cast",
        title: "Phase 5: Side-Cast Onboarding",
        subtitle: "When the latest dialogue introduces a new character, Chronicle can generate a side-character profile and then optionally chain into avatar generation.",
        groups: [
          {
            id: "api-call-2-side-character",
            title: "ChatInterfaceTab.tsx + generate-side-character",
            description: "New-name detection, side-character profile generation, and optional avatar kickoff.",
            ownerTone: "edge",
            primaryRef: ref("/supabase/functions/generate-side-character/index.ts"),
            items: [
              {
                id: "call2-side-character-profile",
                title: "Auto-generated side-character profile lane",
                tag: "service",
                summary:
                  "After new-name detection, the chat tab can request a detailed side-character profile from dialogue context, then persist it into side_characters.",
                settingsGate:
                  "Optional follow-up lane. This runs only when response processing decides a new named character should be promoted into durable side-cast state.",
                fileRefs: [
                  ref("/src/components/chronicle/ChatInterfaceTab.tsx", "generateSideCharacterDetailsAsync"),
                  ref("/supabase/functions/generate-side-character/index.ts", "serve()"),
                  ref("/src/services/persistence/side-characters.ts", "updateSideCharacter"),
                ],
                bullets: [
                  bullet("Trigger", "Runs when the response-processing layer decides a new named character should be promoted into durable side-cast state."),
                  bullet("Inputs", "name, dialogContext, extractedTraits scaffold, worldContext, and model id."),
                  bullet("Follow-up", "If the returned profile includes avatarPrompt, the same lane can immediately chain into the avatar generator."),
                ],
                meta: ["generate-side-character", "side cast", "follow-up avatar"],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "image-generation",
    family: "images",
    navLabel: "Images",
    navSubtitle: "Scene, cover, and avatar calls",
    kicker: "Image Generation",
    title: "Image Generation Lanes",
    description:
      "Dedicated image calls for covers, chat scene images, and character avatars, including their prompt-prep logic, provider calls, rate limits, and storage behavior.",
    phases: [
      {
        id: "image-cover-flow",
        title: "Phase 1: Cover Images",
        subtitle: "Story Builder and cover modal launchers call the edge function that talks directly to xAI image generation.",
        groups: [
          {
            id: "image-cover-launchers",
            title: "Story Builder media launchers",
            description: "Frontend launch points that collect prompt/style data and record admin validation traces.",
            ownerTone: "component",
            primaryRef: ref("/src/features/story-builder/hooks/use-story-builder-media.ts"),
            items: [
              {
                id: "image-cover-launch",
                title: "Cover image request launchers",
                tag: "service",
                summary:
                  "Story Builder and CoverImageGenerationModal collect prompt, style prompt, and optional negative prompt, then invoke generate-cover-image.",
                settingsGate:
                  "Optional image lane. This only fires when a user explicitly requests cover art generation.",
                fileRefs: [
                  ref("/src/features/story-builder/hooks/use-story-builder-media.ts", "generate cover invoke"),
                  ref("/src/components/chronicle/CoverImageGenerationModal.tsx", "generate-cover-image invoke"),
                ],
                bullets: [
                  bullet("Inputs", "prompt, stylePrompt, negativePrompt, scenarioTitle, and model context for usage/validation logging."),
                  bullet("After success", "Returned imageUrl is written back into story builder state and later persisted through the scenario save lane."),
                ],
                meta: ["generate-cover-image", "story builder", "cover art"],
              },
            ],
          },
          {
            id: "image-cover-edge",
            title: "supabase/functions/generate-cover-image/index.ts",
            description: "Auth, rate limiting, prompt compaction, xAI image request, and covers bucket upload fallback.",
            ownerTone: "edge",
            primaryRef: ref("/supabase/functions/generate-cover-image/index.ts"),
            items: [
              {
                id: "image-cover-provider",
                title: "Cover image provider and storage path",
                tag: "edge-function",
                summary:
                  "The edge function authenticates the user, rate-limits cover generation, compacts the prompt for byte limits, and calls xAI's images endpoint.",
                settingsGate:
                  "Optional image lane. This backend path runs only for cover-art requests, not for standard chat turns.",
                fileRefs: [
                  ref("/supabase/functions/generate-cover-image/index.ts", "serve()"),
                  ref("/supabase/functions/_shared/rate-limit.ts", "cover generation window"),
                ],
                bullets: [
                  bullet("Provider call", "POST https://api.x.ai/v1/images/generations with model=grok-imagine-image."),
                  bullet("Byte pressure", "Cover prompts are shortened when needed before sending them upstream."),
                  bullet("Storage behavior", "If xAI returns base64 instead of a URL, the image is uploaded to the covers bucket and a public URL is returned to the client."),
                ],
                meta: ["xAI image", "covers bucket", "rate limited"],
              },
            ],
          },
        ],
      },
      {
        id: "image-scene-flow",
        title: "Phase 2: Chat Scene Images",
        subtitle: "The chat interface can generate a scene image from recent dialogue, scene location, and compacted character descriptors.",
        groups: [
          {
            id: "image-scene-launch",
            title: "ChatInterfaceTab.tsx",
            description: "Collects recent messages, visible cast context, and art style before invoking scene-image generation.",
            ownerTone: "component",
            primaryRef: ref("/src/components/chronicle/ChatInterfaceTab.tsx", "generate-scene-image invoke"),
            items: [
              {
                id: "image-scene-request",
                title: "Scene image request assembly",
                tag: "data-block",
                summary:
                  "Chat scene-image generation builds a compact request from recent dialogue, mentioned characters, scene location, time of day, and active art style.",
                settingsGate:
                  "Optional image lane. This only runs when the chat interface scene-image tool is invoked.",
                fileRefs: [
                  ref("/src/components/chronicle/ChatInterfaceTab.tsx", "generate-scene-image invoke"),
                ],
                bullets: [
                  bullet("Dialogue slice", "Uses recentMessages instead of the full conversation so the image request stays focused on the current beat."),
                  bullet("Character context", "Only mentioned or relevant characters are serialized with physicalAppearance and currentlyWearing snippets."),
                  bullet("After success", "The returned imageUrl is wrapped as an assistant image message and appended to the current conversation."),
                ],
                meta: ["generate-scene-image", "chat scene art", "image message"],
              },
            ],
          },
          {
            id: "image-scene-edge",
            title: "supabase/functions/generate-scene-image/index.ts",
            description: "Two-step scene analysis and image generation with byte-aware prompt assembly.",
            ownerTone: "edge",
            primaryRef: ref("/supabase/functions/generate-scene-image/index.ts"),
            items: [
              {
                id: "image-scene-provider",
                title: "Structured analysis -> byte-aware image prompt -> xAI image call",
                tag: "edge-function",
                summary:
                  "Scene image generation first asks xAI for structured JSON about characters/scene, then compresses that structure into an image prompt that stays inside xAI byte limits.",
                settingsGate:
                  "Optional image lane. This backend path only exists for chat scene-image generation requests.",
                fileRefs: [
                  ref("/supabase/functions/generate-scene-image/index.ts", "buildAnalysisPrompt"),
                  ref("/supabase/functions/generate-scene-image/index.ts", "assemblePromptWithByteLimit"),
                  ref("/supabase/functions/generate-scene-image/index.ts", "generateImage"),
                ],
                bullets: [
                  bullet("Analysis pass", "Uses chat/completions to infer character presentation, weighted traits, pose, expression, clothing, scene, and camera angle."),
                  bullet("Prompt assembly", "assemblePromptWithByteLimit keeps the final image prompt below the target byte budget after style prompt injection."),
                  bullet("Provider call", "The final image request hits grok-imagine-image and returns a URL for chat display."),
                ],
                meta: ["analysis + image", "byte-aware prompt", "grok-imagine-image"],
              },
            ],
          },
        ],
      },
      {
        id: "image-avatar-flow",
        title: "Phase 3: Avatar Images",
        subtitle: "Manual avatar generation and side-character onboarding both use the avatar edge function, which optimizes the portrait prompt before image generation.",
        groups: [
          {
            id: "image-avatar-launchers",
            title: "Avatar launchers",
            description: "Manual avatar tools and side-character onboarding both land on the same avatar edge function.",
            ownerTone: "component",
            primaryRef: ref("/src/components/chronicle/AvatarGenerationModal.tsx"),
            items: [
              {
                id: "image-avatar-launch",
                title: "Avatar request launchers",
                tag: "service",
                summary:
                  "AvatarGenerationModal, CharacterEditorModalScreen, and the side-character onboarding lane all invoke generate-side-character-avatar.",
                settingsGate:
                  "Optional image lane. This runs for manual avatar tools or side-character onboarding, not for the baseline chat flow.",
                fileRefs: [
                  ref("/src/components/chronicle/AvatarGenerationModal.tsx", "generate-side-character-avatar invoke"),
                  ref("/src/features/character-editor-modal/CharacterEditorModalScreen.tsx", "generate-side-character-avatar invoke"),
                  ref("/src/components/chronicle/ChatInterfaceTab.tsx", "side-character avatar follow-up"),
                ],
                bullets: [
                  bullet("Inputs", "avatarPrompt, characterName, modelId, stylePrompt, and optional negativePrompt."),
                  bullet("Launch families", "The same edge function supports manual avatar edits and automatic side-character onboarding."),
                ],
                meta: ["generate-side-character-avatar", "manual + auto avatar"],
              },
            ],
          },
          {
            id: "image-avatar-edge",
            title: "supabase/functions/generate-side-character-avatar/index.ts",
            description: "Prompt optimization chat pass, byte-limit trimming, xAI image generation, and avatars bucket upload fallback.",
            ownerTone: "edge",
            primaryRef: ref("/supabase/functions/generate-side-character-avatar/index.ts"),
            items: [
              {
                id: "image-avatar-provider",
                title: "Optimized portrait prompt and avatar storage",
                tag: "edge-function",
                summary:
                  "The avatar edge function first asks Grok to condense the portrait description, then calls grok-imagine-image and uploads base64 responses to the avatars bucket if needed.",
                settingsGate:
                  "Optional image lane. This backend path only runs for avatar-generation requests.",
                fileRefs: [
                  ref("/supabase/functions/generate-side-character-avatar/index.ts", "generateOptimizedPrompt"),
                  ref("/supabase/functions/generate-side-character-avatar/index.ts", "serve()"),
                ],
                bullets: [
                  bullet("Optimizer pass", "generateOptimizedPrompt uses chat/completions to rewrite the portrait prompt into a shorter comma-heavy image prompt."),
                  bullet("Byte guard", "Prompt text is trimmed to stay inside xAI's stricter byte ceiling before image generation."),
                  bullet("Storage behavior", "If the provider returns base64, Chronicle uploads it into the avatars bucket and returns the resulting public URL."),
                ],
                meta: ["optimizer pass", "avatars bucket", "portrait image"],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "ai-enhance",
    family: "ai-enhance",
    navLabel: "AI Enhance",
    navSubtitle: "Single-call helpers and field enrichers",
    kicker: "AI Enhance",
    title: "Single-Call AI Helpers",
    description:
      "Non-streaming helper calls that use the chat edge function for character-building and world-building tasks outside the main roleplay loop.",
    phases: [
      {
        id: "ai-enhance-character",
        title: "Phase 1: Character Builder Helpers",
        subtitle: "Character fields, fills, and generated profiles use dedicated prompt builders on top of the shared chat edge function.",
        groups: [
          {
            id: "ai-enhance-character-service",
            title: "character-ai.ts",
            description: "Shared context builders and character-focused chat helper calls.",
            ownerTone: "service",
            primaryRef: ref("/src/services/character-ai.ts"),
            items: [
              {
                id: "ai-enhance-character-field",
                title: "Per-field character enhancement",
                tag: "service",
                summary:
                  "Character field sparkles build field-specific prompts plus broader world/self context, then invoke the shared chat edge function in non-streaming mode.",
                settingsGate:
                  "Builder-helper lane. It only runs when the user clicks a Character Builder AI enhance control for a specific field.",
                fileRefs: [
                  ref("/src/services/character-ai.ts", "aiEnhanceCharacterField"),
                  ref("/src/services/character-ai.ts", "buildFullContext / buildCharacterSelfContext"),
                  ref("/src/services/character-ai.ts", "supabase.functions.invoke('chat')"),
                ],
                bullets: [
                  bullet("Context sources", "Prompts include world core, other characters, the target character's existing sections, and field-specific instructions."),
                  bullet("Validation", "Character helper lanes also emit admin validation snapshots before the invoke."),
                  bullet("Output", "Returns enhanced text only; the builder screen decides where to write it back."),
                ],
                meta: ["chat invoke", "character field enhance", "non-streaming"],
              },
              {
                id: "ai-enhance-character-fill-generate",
                title: "AI Fill and AI Generate full-character lanes",
                tag: "service",
                summary:
                  "Broader builder helpers use the same service to fill large empty sections or generate a fuller starter card from partial input.",
                settingsGate:
                  "Builder-helper lane. It only fires when the user explicitly invokes AI Fill or AI Generate in the character builder.",
                fileRefs: [
                  ref("/src/services/character-ai.ts", "aiFillCharacter"),
                  ref("/src/services/character-ai.ts", "aiGenerateCharacter"),
                ],
                bullets: [
                  bullet("AI Fill", "Completes partially built character cards from the surrounding scenario and existing sheet content."),
                  bullet("AI Generate", "Builds a new character profile from broader world context and the user's starter details."),
                ],
                meta: ["AI Fill", "AI Generate", "character builder"],
              },
            ],
          },
        ],
      },
      {
        id: "ai-enhance-world",
        title: "Phase 2: Story and World Helpers",
        subtitle: "World/story builder sparkles use targeted prompts for world fields and route through the same shared chat edge function.",
        groups: [
          {
            id: "ai-enhance-world-service",
            title: "world-ai.ts",
            description: "Field-specific world/story prompt builders with precise and detailed modes.",
            ownerTone: "service",
            primaryRef: ref("/src/services/world-ai.ts"),
            items: [
              {
                id: "ai-enhance-world-field",
                title: "World and story field enhancement",
                tag: "service",
                summary:
                  "aiEnhanceWorldField builds a prompt for scenario name, brief, premise, dialog formatting, custom content, or story-goal text, then invokes the shared chat edge in direct/non-streaming mode.",
                settingsGate:
                  "Builder-helper lane. It only runs when a Story Builder world/story field enhancement control is used.",
                fileRefs: [
                  ref("/src/services/world-ai.ts", "aiEnhanceWorldField"),
                  ref("/src/services/world-ai.ts", "FIELD_PROMPTS / buildPrompt"),
                ],
                bullets: [
                  bullet("Prompt modes", "Precise mode returns compressed key-point output while detailed mode returns short structured prose."),
                  bullet("Context", "Other non-empty world fields and custom world sections are injected so the helper stays grounded in the current scenario."),
                  bullet("Output", "The service trims quotes and minor formatting noise before returning the final text to the builder UI."),
                ],
                meta: ["world builder", "chat invoke", "precise/detailed"],
              },
            ],
          },
        ],
      },
      {
        id: "ai-enhance-helper-calls",
        title: "Phase 3: Smaller Helper Calls",
        subtitle: "Chronicle also has lighter one-shot chat helpers that do not belong to the main roleplay loop.",
        groups: [
          {
            id: "ai-enhance-helper-service",
            title: "llm.ts helper calls",
            description: "Small non-streaming chat helpers colocated with the main chat service.",
            ownerTone: "service",
            primaryRef: ref("/src/services/llm.ts"),
            items: [
              {
                id: "ai-enhance-brainstorm",
                title: "brainstormCharacterDetails",
                tag: "service",
                summary:
                  "A lightweight character-brainstorm helper sends a strict JSON request through the chat edge function and parses the returned character seed data.",
                settingsGate:
                  "Optional helper lane. This is a one-shot builder assist call, not part of the always-on narrative runtime.",
                fileRefs: [
                  ref("/src/services/llm.ts", "brainstormCharacterDetails"),
                ],
                bullets: [
                  bullet("Use case", "Used outside the streaming roleplay loop when the app wants a quick starter block for a new character."),
                  bullet("Contract", "The helper expects JSON-like content and extracts the first object it can parse from the response."),
                ],
                meta: ["brainstorm helper", "chat invoke", "json parse"],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "admin-telemetry",
    family: "admin",
    navLabel: "Admin + Telemetry",
    navSubtitle: "Usage, test sessions, settings, billing, guide sync",
    kicker: "Admin + Telemetry",
    title: "Admin, Observability, and Support Calls",
    description:
      "Admin-only or support-oriented APIs that mirror usage, collect validation traces, manage test sessions, check provider health, read billing, and sync guide documents.",
    phases: [
      {
        id: "admin-usage",
        title: "Phase 1: Usage and Validation Telemetry",
        subtitle: "Frontend helper services mirror request metadata into dedicated edge functions so the admin tools can inspect what the app actually sent.",
        groups: [
          {
            id: "admin-usage-trackers",
            title: "usage-tracking.ts + api-usage-validation.ts",
            description: "Client helpers that write usage events and validation snapshots into admin trace/reporting lanes.",
            ownerTone: "service",
            primaryRef: ref("/src/services/usage-tracking.ts"),
            items: [
              {
                id: "admin-track-usage",
                title: "track-ai-usage event mirror",
                tag: "service",
                summary:
                  "Client code can emit normalized usage events for chat, AI helpers, images, memories, goals, and side-character flows through one shared edge function.",
                fileRefs: [
                  ref("/src/services/usage-tracking.ts", "trackAiUsageEvent"),
                  ref("/supabase/functions/track-ai-usage/index.ts", "serve()"),
                ],
                bullets: [
                  bullet("Allowed events", "The edge function only accepts a known allowlist of event types."),
                  bullet("Test-session mirror", "If an admin trace session is active, usage events are also mirrored into ai_usage_test_events with token/cost estimates."),
                ],
                meta: ["track-ai-usage", "ai_usage_events", "test trace mirror"],
              },
              {
                id: "admin-track-validation",
                title: "track-api-usage-test validation snapshots",
                tag: "validation",
                summary:
                  "The validation service builds field-presence maps for important API calls and sends them to the admin test-report lane so prompt coverage can be inspected after the fact.",
                settingsGate:
                  "Admin diagnostics lane. This is only useful when admin validation and test-session tooling are enabled.",
                fileRefs: [
                  ref("/src/services/api-usage-validation.ts", "trackApiValidationSnapshot"),
                  ref("/src/data/api-usage-validation-registry.ts", "row definitions"),
                  ref("/supabase/functions/track-api-usage-test/index.ts", "snapshot ingest"),
                ],
                bullets: [
                  bullet("What it records", "Expected row ids, sent row ids, missing row ids, and lightweight diagnostics."),
                  bullet("Why it exists", "This is how the finance/admin tooling can show whether specific prompt blocks or payload fields were actually present."),
                ],
                meta: ["validation snapshot", "track-api-usage-test", "coverage map"],
              },
            ],
          },
        ],
      },
      {
        id: "admin-test-sessions",
        title: "Phase 2: Admin Test Sessions and Reports",
        subtitle: "Admin tooling can start scoped trace sessions and then query summary, timeseries, and validation reports from dedicated edge functions.",
        groups: [
          {
            id: "admin-test-session-service",
            title: "api-usage-test-session.ts + admin-usage-metrics.ts",
            description: "Service wrappers for admin trace sessions and reporting UIs.",
            ownerTone: "service",
            primaryRef: ref("/src/services/api-usage-test-session.ts"),
            items: [
              {
                id: "admin-test-session",
                title: "Active admin test-session lifecycle",
                tag: "service",
                summary:
                  "The admin UI can fetch, start, or stop an active ai_usage_test_session that scopes later usage and validation traces.",
                settingsGate:
                  "Admin-only lane. It only runs when an operator is actively using the test-session tooling.",
                fileRefs: [
                  ref("/src/services/api-usage-test-session.ts", "fetchActiveApiUsageTestSession / start / stop"),
                  ref("/supabase/functions/api-usage-test-session/index.ts", "serve()"),
                ],
                bullets: [
                  bullet("Admin gate", "The edge function checks auth plus has_role(admin) before letting anyone read or mutate sessions."),
                  bullet("Session scope", "Scenario and conversation ids are validated when possible and unresolved local ids are preserved in metadata for debugging."),
                ],
                meta: ["api-usage-test-session", "admin only", "trace scope"],
              },
              {
                id: "admin-usage-reports",
                title: "Usage summary, timeseries, and validation report APIs",
                tag: "service",
                summary:
                  "The finance/admin dashboard reads aggregated usage counters and validation coverage through three dedicated edge-report functions.",
                settingsGate:
                  "Admin-only lane. These report APIs run from dashboard tooling, not from the player-facing runtime.",
                fileRefs: [
                  ref("/src/services/admin-usage-metrics.ts", "fetchAdminUsageSummary"),
                  ref("/src/services/admin-usage-metrics.ts", "fetchAdminUsageTimeseries"),
                  ref("/src/services/admin-usage-metrics.ts", "fetchAdminApiUsageTestReport"),
                  ref("/supabase/functions/admin-ai-usage-summary/index.ts", "summary"),
                  ref("/supabase/functions/admin-ai-usage-timeseries/index.ts", "timeseries"),
                  ref("/supabase/functions/admin-api-usage-test-report/index.ts", "validation report"),
                ],
                bullets: [
                  bullet("Summary", "Aggregates usage counters across chat, AI helpers, images, memories, and extraction flows."),
                  bullet("Timeseries", "Builds period-based usage and cost charts from ai_usage_events plus related message/event tables."),
                  bullet("Validation report", "Joins stored validation snapshots into per-session pass/fail/blank status maps."),
                ],
                meta: ["admin-ai-usage-summary", "timeseries", "validation report"],
              },
            ],
          },
        ],
      },
      {
        id: "admin-support",
        title: "Phase 3: Settings, Provider Health, Billing, and Guide Sync",
        subtitle: "Support APIs for shared-key visibility, billing lookups, and guide publication sit beside the main observability tools.",
        groups: [
          {
            id: "admin-support-service",
            title: "Support and tooling calls",
            description: "Smaller admin utilities that inspect provider health or write documentation externally.",
            ownerTone: "service",
            primaryRef: ref("/src/services/app-settings.ts"),
            items: [
              {
                id: "admin-shared-keys",
                title: "Shared-key status and admin role checks",
                tag: "service",
                summary:
                  "App settings checks whether xAI shared keys are enabled and whether the current user is an admin before exposing admin-only controls.",
                settingsGate:
                  "Settings-driven admin lane. It runs when provider-health or shared-key settings need to be checked before showing admin controls.",
                fileRefs: [
                  ref("/src/services/app-settings.ts", "checkSharedKeyStatus / checkIsAdmin"),
                  ref("/supabase/functions/check-shared-keys/index.ts", "serve()"),
                ],
                bullets: [
                  bullet("Provider probe", "check-shared-keys hits xAI /models to verify that the configured provider key is actually reachable."),
                  bullet("Settings source", "Reads app_settings.shared_keys and combines that with live provider reachability."),
                  bullet("Role gate", "checkIsAdmin also calls the has_role RPC from the frontend service layer."),
                ],
                meta: ["check-shared-keys", "has_role", "provider health"],
              },
              {
                id: "admin-billing",
                title: "xAI billing summary lookup",
                tag: "edge-function",
                summary:
                  "The finance dashboard can fetch xAI billing from either the management API or the legacy API through a backend-only admin gate.",
                settingsGate:
                  "Admin-only lane. Billing lookup only runs from finance tooling and depends on which provider-management keys are configured.",
                fileRefs: [
                  ref("/src/services/xai-billing.ts", "fetchXaiBillingSummary"),
                  ref("/supabase/functions/xai-billing-balance/index.ts", "serve()"),
                ],
                bullets: [
                  bullet("Preferred lane", "Uses XAI_MANAGEMENT_KEY + XAI_TEAM_ID when available."),
                  bullet("Fallback lane", "Falls back to legacy billing endpoints if only the main API key is configured."),
                  bullet("Admin-only", "The edge function checks auth and has_role(admin) before exposing any billing data."),
                ],
                meta: ["xai-billing-balance", "management api", "admin only"],
              },
              {
                id: "admin-guide-sync",
                title: "Guide sync to GitHub",
                tag: "edge-function",
                summary:
                  "The App Guide tool can upsert or delete guide markdown in GitHub through an authenticated edge function that holds the PAT server-side.",
                settingsGate:
                  "Admin tooling lane. This only runs when someone explicitly syncs guide content to GitHub.",
                fileRefs: [
                  ref("/src/components/admin/guide/AppGuideTool.tsx", "sync-guide-to-github invoke"),
                  ref("/supabase/functions/sync-guide-to-github/index.ts", "serve()"),
                ],
                bullets: [
                  bullet("External boundary", "This is one of the few app APIs that leaves both Supabase and xAI, because it writes into GitHub's contents API."),
                  bullet("Auth", "The edge function requires a signed-in admin user before any repo write/delete action is attempted."),
                  bullet("Why it matters", "This tooling lane keeps long-form guide documents synchronized with the repo without exposing the GitHub PAT to the browser."),
                ],
                meta: ["sync-guide-to-github", "GitHub contents api", "admin only"],
              },
            ],
          },
        ],
      },
      {
        id: "admin-finance-dashboard",
        title: "Phase 4: Finance Dashboard as API Index and Ops Surface",
        subtitle: "The Finance Dashboard does not originate most calls, but it is the app-wide index that surfaces tracked AI pipelines plus several live admin CRUD lanes of its own.",
        groups: [
          {
            id: "admin-finance-dashboard-component",
            title: "FinanceDashboardTool.tsx",
            description: "API Usage index, finance operations, moderation, user management, and finance-document handling.",
            ownerTone: "component",
            primaryRef: ref("/src/components/admin/finance/FinanceDashboardTool.tsx"),
            items: [
              {
                id: "admin-finance-api-index",
                title: "API Usage page as the app-wide AI call index",
                tag: "service",
                summary:
                  "FinanceDashboardTool imports the validation-row registry and admin usage services so operators can inspect which tracked AI call families exist, how often they fire, and whether payload coverage passed or failed.",
                settingsGate:
                  "Admin dashboard lane. This runs only when the Finance Dashboard API Usage view is being used.",
                fileRefs: [
                  ref("/src/components/admin/finance/FinanceDashboardTool.tsx", "API Usage section / validationRows"),
                  ref("/src/data/api-usage-validation-registry.ts", "API_USAGE_VALIDATION_ROWS"),
                  ref("/src/services/admin-usage-metrics.ts", "fetchAdminUsageSummary / fetchAdminUsageTimeseries / fetchAdminApiUsageTestReport"),
                ],
                bullets: [
                  bullet("Checklist role", "This page is the runtime index of tracked AI call families like Call 1, Call 2, builder enhance helpers, and image generation."),
                  bullet("Not the source", "The dashboard points at these call families, but the originating logic still lives in chat, builder, image, and edge-function code elsewhere in the repo."),
                  bullet("Billing tie-in", "The same surface also reads xAI billing so the AI usage view can be compared against actual provider spend."),
                ],
                meta: ["api usage index", "validation rows", "admin dashboard"],
              },
              {
                id: "admin-finance-ops",
                title: "Finance tables, moderation tables, and document storage",
                tag: "database",
                summary:
                  "Outside the AI-usage index, the Finance Dashboard also owns several live admin data lanes for finance entries, moderation review, and uploaded documents.",
                settingsGate:
                  "Admin operations lane. These CRUD and document-storage paths only run from the Finance Dashboard tools.",
                fileRefs: [
                  ref("/src/components/admin/finance/FinanceDashboardTool.tsx", "ad_spend / admin_notes"),
                  ref("/src/components/admin/finance/FinanceDashboardTool.tsx", "reports / user_strikes"),
                  ref("/src/components/admin/finance/FinanceDashboardTool.tsx", "finance_documents"),
                ],
                bullets: [
                  bullet("Finance tables", "ad_spend and admin_notes power the finance planning and notes areas."),
                  bullet("Moderation tables", "reports and user_strikes drive review queues, strike history, and moderation outcomes."),
                  bullet("Document lane", "finance_documents uses both the finance_documents table and the finance_documents storage bucket for upload, delete, and signed-url preview flows."),
                ],
                meta: ["ad_spend", "admin_notes", "reports", "finance_documents"],
              },
              {
                id: "admin-finance-user-ops",
                title: "User access, tier overrides, and admin-access RPCs",
                tag: "rpc",
                summary:
                  "The Finance Dashboard's user-management tabs also read and write several non-AI admin settings and access-control surfaces.",
                settingsGate:
                  "Admin operations lane. These access-control and tier-setting paths only run from admin user-management tooling.",
                fileRefs: [
                  ref("/src/components/admin/finance/FinanceDashboardTool.tsx", "profiles / user_roles / stories / app_settings"),
                  ref("/src/components/admin/finance/FinanceDashboardTool.tsx", "set_admin_access"),
                  ref("/src/services/subscription-tier-config.ts", "loadSubscriptionTiersConfig / saveSubscriptionTiersConfig"),
                ],
                bullets: [
                  bullet("Read surfaces", "profiles, user_roles, stories, app_settings, reports, and user_strikes all feed the user-management and oversight views."),
                  bullet("Write surfaces", "Tier overrides persist into app_settings, subscription_tiers_v1 is updated through the shared config service, and admin UI access uses the set_admin_access RPC."),
                  bullet("Why it matters", "These are app-wide operational APIs that sit outside the chat pipeline but still belong in a full API inventory."),
                ],
                meta: ["profiles", "user_roles", "app_settings", "set_admin_access"],
              },
            ],
          },
        ],
      },
      {
        id: "admin-guide-quality",
        title: "Phase 5: Guide, Quality Hub, and Style Guide Registries",
        subtitle: "Chronicle's documentation and QA tools also have live persistence and sync lanes that should be visible in the API map.",
        groups: [
          {
            id: "admin-guide-component",
            title: "AppGuideTool.tsx",
            description: "Guide document CRUD, save/sync actions, and GitHub publication trigger points.",
            ownerTone: "component",
            primaryRef: ref("/src/components/admin/guide/AppGuideTool.tsx"),
            items: [
              {
                id: "admin-guide-doc-crud",
                title: "Guide document list, load, create, rename, save, delete, and bulk sync",
                tag: "database",
                summary:
                  "The App Guide surface performs direct guide_documents CRUD in the browser, then optionally fans successful edits out to the GitHub sync edge function.",
                settingsGate:
                  "Admin tooling lane. These document CRUD and sync paths only run when the App Guide editor is in use.",
                fileRefs: [
                  ref("/src/components/admin/guide/AppGuideTool.tsx", "fetchDocs / loadDoc"),
                  ref("/src/components/admin/guide/AppGuideTool.tsx", "handleNewDoc / handleDeleteDoc / handleTitleChange"),
                  ref("/src/components/admin/guide/AppGuideTool.tsx", "onRegisterSave / onRegisterSyncAll"),
                ],
                bullets: [
                  bullet("Primary table", "guide_documents is the live backing table for the App Guide editor, sidebar, freshness metadata, and sync-all workflow."),
                  bullet("Save path", "Single-document save updates guide_documents first, then dispatches an upsert sync to GitHub."),
                  bullet("Delete path", "Document deletion removes the row first and then dispatches a delete sync to GitHub."),
                ],
                meta: ["guide_documents", "save", "sync-all"],
              },
            ],
          },
          {
            id: "admin-quality-and-styleguide",
            title: "ui-audit.tsx + StyleGuideEditsModal.tsx + Admin.tsx",
            description: "Quality registry persistence plus admin/style-guide metadata stored in app_settings.",
            ownerTone: "database",
            primaryRef: ref("/src/pages/style-guide/ui-audit.tsx"),
            items: [
              {
                id: "admin-quality-hub-registry",
                title: "Quality Hub registry persistence",
                tag: "database",
                summary:
                  "Quality Hub is not just a local page; it loads and upserts a per-user registry row so findings, runs, and changelog state persist across sessions.",
                settingsGate:
                  "Admin tooling lane. This persistence path only runs when the Quality Hub is being used.",
                fileRefs: [
                  ref("/src/pages/style-guide/ui-audit.tsx", "quality_hub_registries load / upsert"),
                ],
                bullets: [
                  bullet("Primary table", "quality_hub_registries stores the serialized registry keyed by user_id."),
                  bullet("Save behavior", "The page keeps localStorage as a fallback, but authenticated sessions also debounce writes back into Supabase."),
                ],
                meta: ["quality_hub_registries", "registry save", "debounced upsert"],
              },
              {
                id: "admin-styleguide-settings",
                title: "Style Guide edit registries and admin tile metadata",
                tag: "database",
                summary:
                  "Several admin/style-guide surfaces persist lightweight configuration in app_settings rather than dedicated tables.",
                settingsGate:
                  "Settings-driven admin lane. These writes only run when style-guide or admin launcher settings are edited.",
                fileRefs: [
                  ref("/src/components/admin/styleguide/StyleGuideEditsModal.tsx", "readSetting / writeSetting"),
                  ref("/src/pages/Admin.tsx", "admin_tool_meta"),
                ],
                bullets: [
                  bullet("Style Guide keys", "styleguide_edits and styleguide_keeps are read and written through app_settings from the style-guide edit modal."),
                  bullet("Admin shell key", "admin_tool_meta stores the editable tile metadata for the main Admin dashboard launcher cards."),
                ],
                meta: ["app_settings", "styleguide_edits", "admin_tool_meta"],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "data-and-storage",
    family: "data",
    navLabel: "Data + Storage",
    navSubtitle: "Supabase tables, RPCs, storage buckets",
    kicker: "Data + Storage",
    title: "Supabase Data and Storage Lanes",
    description:
      "Direct Supabase table, RPC, and storage interactions that sit around the AI/edge flows and make Chronicle's builder, chat, gallery, and media systems persist correctly.",
    phases: [
      {
        id: "data-scenarios",
        title: "Phase 1: Scenario Persistence",
        subtitle: "Story Builder fetches and saves the canonical scenario graph through the persistence service layer.",
        groups: [
          {
            id: "data-scenarios-service",
            title: "persistence/scenarios.ts",
            description: "Scenario fetch/save, atomic RPC writes, and storage URL normalization.",
            ownerTone: "database",
            primaryRef: ref("/src/services/persistence/scenarios.ts"),
            items: [
              {
                id: "data-scenario-load",
                title: "Scenario graph fetch",
                tag: "database",
                summary:
                  "Scenario loading fans out across stories, characters, codex_entries, scenes, conversations, and message previews so builders and play mode can hydrate from one service boundary.",
                fileRefs: [
                  ref("/src/services/persistence/scenarios.ts", "fetchScenarioById / fetchScenarioForPlay"),
                ],
                bullets: [
                  bullet("Primary tables", "stories, characters, codex_entries, scenes, conversations, and messages."),
                  bullet("Why grouped", "This service layer is the main boundary between builder screens and raw Supabase table layouts."),
                ],
                meta: ["stories", "characters", "codex_entries", "scenes"],
              },
              {
                id: "data-scenario-save",
                title: "Atomic scenario save RPC",
                tag: "rpc",
                summary:
                  "saveScenario() normalizes asset URLs, converts builder state to database payloads, and then calls save_scenario_atomic for the heavy write.",
                fileRefs: [
                  ref("/src/services/persistence/scenarios.ts", "saveScenario"),
                  ref("/src/services/persistence/shared.ts", "ensureStorageUrl"),
                ],
                bullets: [
                  bullet("Pre-save normalization", "Base64 cover/avatar assets are pushed through storage normalization before the RPC runs."),
                  bullet("RPC lane", "save_scenario_atomic writes the story payload plus characters, codex entries, and scenes together."),
                  bullet("Why it matters", "This is the main non-edge write path that keeps the builder from scattering multi-table save logic across UI files."),
                ],
                meta: ["save_scenario_atomic", "atomic rpc", "asset normalization"],
              },
            ],
          },
        ],
      },
      {
        id: "data-conversations",
        title: "Phase 2: Conversation, Memory, and Snapshot Tables",
        subtitle: "Chat state, extracted memories, session states, and snapshot ledgers all persist through the conversation services.",
        groups: [
          {
            id: "data-conversations-service",
            title: "persistence/conversations.ts + persistence/side-characters.ts",
            description: "Conversation threads, messages, memories, session state, and snapshot ledgers.",
            ownerTone: "database",
            primaryRef: ref("/src/services/persistence/conversations.ts"),
            items: [
              {
                id: "data-conversation-threads",
                title: "Conversation fetch, message upsert, and meta updates",
                tag: "database",
                summary:
                  "Chronicle loads conversation threads, recent windows, older pages, and metadata through a persistence layer rather than directly from ChatInterfaceTab.",
                fileRefs: [
                  ref("/src/services/persistence/conversations.ts", "fetchConversationThread / fetchConversationThreadRecent"),
                  ref("/src/services/persistence/conversations.ts", "saveNewMessages / updateConversationMeta"),
                ],
                bullets: [
                  bullet("Message ledger", "saveNewMessages now writes generation_id alongside role, content, day, time, and created_at."),
                  bullet("Registry helpers", "Conversation registry enrichment also queries message counts and latest previews for hub screens."),
                ],
                meta: ["messages", "conversations", "generation_id"],
              },
              {
                id: "data-memory-snapshots",
                title: "Memories, session states, and snapshot tables",
                tag: "database",
                summary:
                  "The conversation services also own memories, character_session_states, character_state_message_snapshots, and story_goal_step_derivations.",
                fileRefs: [
                  ref("/src/services/persistence/conversations.ts", "fetchMemories / createMemory"),
                  ref("/src/services/persistence/conversations.ts", "fetchSessionStates / updateSessionState"),
                  ref("/src/services/persistence/conversations.ts", "upsertCharacterStateMessageSnapshot / upsertStoryGoalStepDerivations"),
                  ref("/src/services/persistence/side-characters.ts", "fetchSideCharacters / upsertSideCharacterMessageSnapshot"),
                ],
                bullets: [
                  bullet("Why this matters", "These are the tables that hold durable chat continuity outside the visible message log."),
                  bullet("Snapshot ownership", "Main-character and side-character per-message snapshots now have dedicated persistence methods instead of living in one giant data file."),
                ],
                meta: ["memories", "session states", "snapshot ledgers"],
              },
            ],
          },
        ],
      },
      {
        id: "data-media",
        title: "Phase 3: Shared Media Storage",
        subtitle: "Shared media helpers own bucket uploads and background-selection state outside the specialized image-generation edge functions.",
        groups: [
          {
            id: "data-media-service",
            title: "persistence/media-settings.ts",
            description: "Bucket uploads for manual assets plus background/profile/app_settings helpers.",
            ownerTone: "storage",
            primaryRef: ref("/src/services/persistence/media-settings.ts"),
            items: [
              {
                id: "data-media-buckets",
                title: "Shared storage bucket helpers",
                tag: "storage",
                summary:
                  "Manual uploads and persisted UI media use shared helpers for avatars, scenes, covers, backgrounds, and nav-button settings.",
                settingsGate:
                  "Optional media lane. These helper calls run when users upload media or change persisted UI/background settings.",
                fileRefs: [
                  ref("/src/services/persistence/media-settings.ts", "uploadAvatar / uploadSceneImage / uploadCoverImage / uploadBackgroundImage"),
                  ref("/src/services/persistence/media-settings.ts", "setSelectedBackground / loadNavButtonImages"),
                ],
                bullets: [
                  bullet("Buckets", "avatars, scenes, covers, and backgrounds."),
                  bullet("Related tables", "user_backgrounds, sidebar_backgrounds, profiles, stories, and app_settings."),
                  bullet("Why separate", "This keeps generic upload + background selection logic out of the image-generation edge functions."),
                ],
                meta: ["storage buckets", "backgrounds", "app settings"],
              },
            ],
          },
        ],
      },
      {
        id: "data-gallery",
        title: "Phase 4: Gallery and Community Data APIs",
        subtitle: "The gallery system uses direct tables plus RPC helpers for search, counts, likes, saves, reviews, and play/view tracking.",
        groups: [
          {
            id: "data-gallery-service",
            title: "gallery-data.ts",
            description: "Community-gallery fetches, table writes, and count/search RPCs.",
            ownerTone: "database",
            primaryRef: ref("/src/services/gallery-data.ts"),
            items: [
              {
                id: "data-gallery-rpcs",
                title: "Gallery query and interaction lanes",
                tag: "rpc",
                summary:
                  "Gallery data combines direct table reads/writes with dedicated RPCs for search and high-frequency counters.",
                fileRefs: [
                  ref("/src/services/gallery-data.ts", "fetchGalleryScenarios"),
                  ref("/src/services/gallery-data.ts", "toggleLike / saveScenarioToCollection"),
                  ref("/src/services/gallery-data.ts", "incrementPlayCount / recordView / submitReview"),
                ],
                bullets: [
                  bullet("Search RPC", "fetch_gallery_scenarios powers filtered search, sort, and pagination."),
                  bullet("Counter RPCs", "increment_like_count, decrement_like_count, increment_save_count, decrement_save_count, increment_play_count, and record_scenario_view."),
                  bullet("Direct tables", "published_scenarios, scenario_likes, saved_scenarios, scenario_reviews, remixed_scenarios, content_themes, and profiles."),
                ],
                meta: ["gallery rpc", "community tables", "play/view counts"],
              },
              {
                id: "data-gallery-surface-components",
                title: "GalleryHub and creator-facing community surfaces",
                tag: "database",
                summary:
                  "Beyond the shared service layer, the gallery/profile surfaces also maintain direct community state such as creator follows and realtime published-scenario refreshes.",
                fileRefs: [
                  ref("/src/components/chronicle/GalleryHub.tsx", "creator_follows / published_scenarios realtime"),
                  ref("/src/pages/CreatorProfile.tsx", "creator_follows / get_creator_stats"),
                  ref("/src/components/account/PublicProfileTab.tsx", "published_scenarios / get_creator_stats"),
                ],
                bullets: [
                  bullet("Follow graph", "creator_follows is read and written directly by gallery/profile surfaces for the Following feed and follow/unfollow actions."),
                  bullet("Realtime lane", "GalleryHub subscribes to published_scenarios INSERT/UPDATE/DELETE events so community views refresh when new stories are published or changed."),
                  bullet("Profile joins", "Creator pages also read published_scenarios plus get_creator_stats to build public profile counts and story shelves."),
                ],
                meta: ["creator_follows", "published_scenarios realtime", "creator stats"],
              },
            ],
          },
        ],
      },
      {
        id: "data-profiles",
        title: "Phase 5: Profiles, Creator Pages, and Account Preferences",
        subtitle: "Public profile pages and account settings have their own direct table, RPC, storage, and preference lanes outside the builder and chat services.",
        groups: [
          {
            id: "data-profile-pages",
            title: "PublicProfileTab.tsx + CreatorProfile.tsx",
            description: "Public creator identity, published-story shelves, follow state, and avatar uploads.",
            ownerTone: "component",
            primaryRef: ref("/src/components/account/PublicProfileTab.tsx"),
            items: [
              {
                id: "data-profile-reads",
                title: "Profile reads, creator stats RPC, and published-story joins",
                tag: "rpc",
                summary:
                  "The public-profile surfaces load identity rows, creator stats, published stories, and related content themes directly from Supabase when rendering profile and creator pages.",
                fileRefs: [
                  ref("/src/components/account/PublicProfileTab.tsx", "profiles / get_creator_stats / published_scenarios"),
                  ref("/src/pages/CreatorProfile.tsx", "profiles / get_creator_stats / published_scenarios"),
                ],
                bullets: [
                  bullet("Primary reads", "profiles plus published_scenarios build the visible creator card and published-story shelves."),
                  bullet("Stats RPC", "get_creator_stats is the aggregate RPC behind follower/story/review style counts on creator-facing pages."),
                  bullet("Theme joins", "Published stories can also pull content_themes so community cards keep their tags and filters."),
                ],
                meta: ["profiles", "get_creator_stats", "published_scenarios"],
              },
              {
                id: "data-profile-writes",
                title: "Follow graph, profile updates, and avatars bucket uploads",
                tag: "storage",
                summary:
                  "The same surfaces also mutate creator_follows, profile text/settings, and uploaded profile avatars.",
                settingsGate:
                  "Optional profile lane. These writes run only when someone edits a profile, uploads an avatar, or changes follow state.",
                fileRefs: [
                  ref("/src/components/account/PublicProfileTab.tsx", "profiles update / avatars upload"),
                  ref("/src/pages/CreatorProfile.tsx", "creator_follows insert / delete"),
                ],
                bullets: [
                  bullet("Profile writes", "display_name, about_me, avatar_position, and avatar_url are written back into profiles."),
                  bullet("Avatar upload path", "Optimized image blobs are uploaded into the avatars bucket and then the resulting public URL is written into profiles."),
                  bullet("Follow actions", "creator_follows insert/delete powers creator follow state and the Following gallery filter."),
                ],
                meta: ["avatars", "creator_follows", "profile update"],
              },
            ],
          },
        ],
      },
      {
        id: "data-image-library",
        title: "Phase 6: Image Library and Manual Media Flows",
        subtitle: "Image Library, picker modals, manual background uploads, and shared media helpers all use direct RPC/table/storage lanes outside the edge-image generators.",
        groups: [
          {
            id: "data-image-library-components",
            title: "ImageLibraryTab.tsx + ImageLibraryPickerModal.tsx",
            description: "Folder/browser UI for stored library assets.",
            ownerTone: "component",
            primaryRef: ref("/src/components/chronicle/ImageLibraryTab.tsx"),
            items: [
              {
                id: "data-image-library-core",
                title: "Folder RPC, library_images table, and image_library bucket",
                tag: "storage",
                summary:
                  "Chronicle's reusable image-library surfaces use a dedicated RPC plus direct table and bucket operations for folders, images, thumbnails, uploads, and deletes.",
                settingsGate:
                  "Optional media lane. This runs only when Image Library or picker flows are being used.",
                fileRefs: [
                  ref("/src/components/chronicle/ImageLibraryTab.tsx", "get_folders_with_details / image_folders / library_images"),
                  ref("/src/components/chronicle/ImageLibraryPickerModal.tsx", "get_folders_with_details"),
                ],
                bullets: [
                  bullet("RPC lane", "get_folders_with_details returns folder metadata, thumbnails, and image counts for both the main tab and picker modal."),
                  bullet("Primary tables", "image_folders and library_images hold the logical folder/image records."),
                  bullet("Bucket lane", "image_library stores the actual uploaded files that those records point at."),
                ],
                meta: ["get_folders_with_details", "image_folders", "image_library"],
              },
              {
                id: "data-image-library-upload-shaping",
                title: "Remote fetch, resize, and storage-path shaping before upload",
                tag: "code-logic",
                summary:
                  "Before browser uploads reach Supabase storage, the image-library surfaces often fetch optimized URLs back into blobs and normalize derived storage paths.",
                settingsGate:
                  "Optional media lane. This pre-upload shaping only runs during library upload or delete workflows.",
                fileRefs: [
                  ref("/src/components/chronicle/ImageLibraryTab.tsx", "fetch(optimized) / upload"),
                  ref("/src/utils.ts", "resizeImage"),
                ],
                bullets: [
                  bullet("Why it exists", "The tab can resize or re-fetch optimized data before persisting it into image_library."),
                  bullet("Delete behavior", "Delete flows derive storage paths back out of public URLs before removing the underlying object from the bucket."),
                ],
                meta: ["browser fetch", "blob upload", "storage path extraction"],
              },
            ],
          },
          {
            id: "data-manual-media-builder",
            title: "CharacterBuilderScreen.tsx + persistence/media-settings.ts",
            description: "Manual background uploads and user-selected background state.",
            ownerTone: "storage",
            primaryRef: ref("/src/services/persistence/media-settings.ts"),
            items: [
              {
                id: "data-background-media",
                title: "Background uploads, selected-background flags, and UI media settings",
                tag: "storage",
                summary:
                  "Manual media flows persist user-uploaded backgrounds and related selection state without going through the AI image generators.",
                settingsGate:
                  "Settings/media lane. This runs only when a user uploads backgrounds or changes persisted background selections.",
                fileRefs: [
                  ref("/src/features/character-builder/CharacterBuilderScreen.tsx", "backgrounds upload"),
                  ref("/src/services/persistence/media-settings.ts", "user_backgrounds / sidebar_backgrounds / stories / app_settings"),
                ],
                bullets: [
                  bullet("Bucket lane", "backgrounds stores user-uploaded background assets."),
                  bullet("Table lane", "user_backgrounds and sidebar_backgrounds persist selection state, ordering, and image-library linkage."),
                  bullet("UI settings", "stories.ui_settings, profiles, and app_settings also participate in persisted media/theme preferences."),
                ],
                meta: ["backgrounds", "user_backgrounds", "sidebar_backgrounds"],
              },
            ],
          },
        ],
      },
      {
        id: "data-settings-config",
        title: "Phase 7: Settings, Art Styles, and Realtime Config",
        subtitle: "Several non-chat surfaces read or persist app-wide configuration through app_settings, profiles, art_styles, RPC role checks, and realtime channels.",
        groups: [
          {
            id: "data-settings-services",
            title: "app-settings.ts + subscription-tier-config.ts + contexts",
            description: "Provider health, admin role checks, model preference, art styles, and subscription config.",
            ownerTone: "service",
            primaryRef: ref("/src/services/app-settings.ts"),
            items: [
              {
                id: "data-shared-settings",
                title: "Shared-key checks, admin role RPC, and model preference writes",
                tag: "service",
                summary:
                  "Account and admin surfaces use a shared settings layer to check provider availability, confirm admin access, and persist user model preferences.",
                settingsGate:
                  "Settings-driven lane. These calls run when provider health, admin access, or a user's preferred model setting must be checked or updated.",
                fileRefs: [
                  ref("/src/services/app-settings.ts", "checkSharedKeyStatus / checkIsAdmin / updateSharedKeySetting"),
                  ref("/src/contexts/ModelSettingsContext.tsx", "profiles.preferred_model"),
                ],
                bullets: [
                  bullet("Role RPC", "has_role is used from the browser service layer when the shell needs to know whether admin-only controls should render."),
                  bullet("Provider probe", "check-shared-keys verifies xAI provider reachability before admin model/provider status is trusted."),
                  bullet("Profile preference", "preferred_model is written into profiles from the model settings context."),
                ],
                meta: ["check-shared-keys", "has_role", "preferred_model"],
              },
              {
                id: "data-art-style-and-tier-config",
                title: "Art styles, subscription tiers, and realtime app_settings listeners",
                tag: "database",
                summary:
                  "Chronicle also stores editable image-style definitions and pricing/config metadata directly in Supabase-backed configuration surfaces.",
                settingsGate:
                  "Settings-driven lane. This config path is used when art styles, subscription tiers, admin metadata, or realtime config propagation are in play.",
                fileRefs: [
                  ref("/src/contexts/ArtStylesContext.tsx", "art_styles"),
                  ref("/src/components/admin/ImageGenerationTool.tsx", "art_styles / avatars"),
                  ref("/src/services/subscription-tier-config.ts", "app_settings.subscription_tiers_v1"),
                  ref("/src/pages/Admin.tsx", "app_settings.admin_tool_meta"),
                ],
                bullets: [
                  bullet("Art styles", "art_styles stores editable display names, thumbnail URLs, and backend prompts for avatar/image style selection."),
                  bullet("Tier config", "subscription_tiers_v1 lives in app_settings and is mirrored through a realtime channel so pricing/config updates can propagate."),
                  bullet("Admin metadata", "admin_tool_meta is another app_settings-backed config lane used by the Admin launcher surface."),
                ],
                meta: ["art_styles", "subscription_tiers_v1", "realtime config"],
              },
            ],
          },
        ],
      },
    ],
  },
];
