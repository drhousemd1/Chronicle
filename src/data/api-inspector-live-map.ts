import {
  ROLEPLAY_PIPELINE_REVIEW_20260515,
  type ApiInspectorReview,
} from "./api-inspector-review";

export type ApiInspectorFamily =
  | "all"
  | "live-chat"
  | "supporting"
  | "adjacent";

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
  review?: ApiInspectorReview;
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
  { value: "all", label: "All Roleplay Lanes" },
  { value: "live-chat", label: "Live Chat Flow" },
  { value: "supporting", label: "Supporting Systems" },
  { value: "adjacent", label: "Adjacent AI Calls" },
];

export const API_INSPECTOR_SOURCE_NOTE =
  "Code-truth rebuild. This page now tracks the roleplay runtime specifically: the live chat turn loop, the supporting systems that change how roleplay behaves, and the adjacent one-off AI calls that still touch the roleplay experience.";

const ref = (path: string, locator?: string): ApiInspectorFileRef => ({ path, locator });
const bullet = (label: string, text: string): ApiInspectorBullet => ({ label, text });

export const apiInspectorLiveSections: ApiInspectorSection[] = [
  {
    id: "live-chat-roleplay-flow",
    family: "live-chat",
    navLabel: "Live Chat Flow",
    navSubtitle: "Turn-by-turn runtime",
    kicker: "Live Chat Flow",
    title: "Live Chat Roleplay Flow",
    description:
      "The real runtime loop from send/regenerate/continue through prompt assembly, the streamed Grok call, and the post-turn state reconciliation that keeps continuity alive.",
    phases: [
      {
        id: "live-chat-entry-intent",
        title: "Phase 1: Chat Entry and Turn Intent",
        subtitle: "Player actions become the next roleplay turn, with regeneration and continuation using their own scoped wrappers.",
        groups: [
          {
            id: "live-chat-entrypoints",
            title: "ChatInterfaceTab.tsx",
            description: "Visible chat controls and the turn builders behind send, regenerate, and continue.",
            ownerTone: "component",
            primaryRef: ref("/src/components/chronicle/ChatInterfaceTab.tsx", "handleSend / handleRegenerateMessage / handleContinueConversation"),
            items: [
              {
                id: "entrypoints",
                title: "Send, regenerate, and continue entrypoints",
                tag: "code-logic",
                summary:
                  "The chat tab decides which conversation slice, user input, and active state become the next assistant turn.",
                fileRefs: [
                  ref("/src/components/chronicle/ChatInterfaceTab.tsx", "handleSend"),
                  ref("/src/components/chronicle/ChatInterfaceTab.tsx", "handleRegenerateMessage"),
                  ref("/src/components/chronicle/ChatInterfaceTab.tsx", "handleContinueConversation"),
                ],
                bullets: [
                  bullet("Send", "Appends the new user message locally, builds effective world and cast state, and starts the streamed generation request."),
	                  bullet("Regenerate", "Slices the transcript back to the triggering user turn so the assistant can try a different version of the same exchange without double-feeding later accepted story state."),
                  bullet("Continue", "Builds a constrained continue instruction that keeps the turn focused on AI-controlled characters instead of treating it like a normal user prompt."),
                ],
                meta: ["chat ui", "conversation slice", "roleplay entry"],
              },
              {
                id: "turn-wrappers",
	                title: "Established-fact note and session-position wrappers",
                tag: "context-injection",
                summary:
                  "The client still adds small turn-local wrappers, but the old runtime anti-loop system-message lane has been removed.",
                fileRefs: [
	                  ref("/src/components/chronicle/ChatInterfaceTab.tsx", "buildEstablishedFactNote"),
                  ref("/src/components/chronicle/ChatInterfaceTab.tsx", "sessionMessageCountRef"),
                  ref("/src/services/llm.ts", "generateRoleplayResponseStream"),
                ],
                bullets: [
	                  bullet("Established-fact carry-forward", "If the user typed AI-character dialogue directly, an established-fact note preserves that authored line so regenerate or continue does not overwrite it as if Grok invented it."),
                  bullet("Session counter", "The final outbound user content still gets a session-position wrapper so the model knows roughly where it is in the current session."),
                  bullet("Current state", "The old one-turn anti-loop runtime directive and extra system-message injection are no longer part of the live path."),
                ],
	                meta: ["established-fact note", "session wrapper", "no runtime directive"],
              },
              {
                id: "hidden-repair-retry",
                title: "Hidden repair retry capture",
                tag: "validation",
                summary:
                  "When the client detects a narrow repetition or response-shape failure after a completed draft, it can discard that draft, retry once with a repair instruction, and keep the discarded attempt visible in debug review data.",
                fileRefs: [
                  ref("/src/components/chronicle/ChatInterfaceTab.tsx", "hidden repair retry"),
                  ref("/src/lib/assistant-style-directive.ts", "candidate-output repetition analysis"),
                  ref("/src/features/chat-debug/review-export.ts", "hidden repair attempt rendering"),
                ],
                bullets: [
                  bullet("Runtime effect", "The visible chat only keeps the accepted retry, but the review export can still show the discarded draft and repair reason."),
                  bullet("Scope", "This is a one-attempt local repair path, not a durable state update and not a separate user-visible message."),
                ],
                meta: ["hidden repair", "debug export", "repetition guard"],
              },
            ],
          },
        ],
      },
      {
        id: "live-chat-prompt-assembly",
        title: "Phase 2: Prompt Assembly and Outbound Request",
        subtitle: "The browser assembles the roleplay prompt, serializes current state, and posts a direct streaming request to the chat edge function.",
        groups: [
          {
            id: "live-chat-llm-service",
            title: "llm.ts",
            description: "Prompt assembly, role framing, request envelope, and the browser-side SSE client.",
            ownerTone: "service",
            primaryRef: ref("/src/services/llm.ts", "getSystemInstruction / generateRoleplayResponseStream"),
            items: [
              {
                id: "system-instruction",
                title: "Roleplay system instruction assembly",
                tag: "core-prompt",
                summary:
                  "The first system message serializes story state, cast state, memories, time, scene context, and the current roleplay rules into one instruction block.",
                fileRefs: [
                  ref("/src/services/llm.ts", "getSystemInstruction"),
                  ref("/src/services/llm.ts", "core role logic / core mission"),
                  ref("/src/constants/tag-injection-registry.ts", "content theme injection registry"),
                ],
                bullets: [
                  bullet("Role framing", "The current local build frames Grok as continuing the scene through the AI-controlled characters instead of as a detached game master."),
                  bullet("State payload", "World context, structured locations, cast cards, goals, temporal state, and memories are serialized into the same recurring instruction body."),
                  bullet("Theme layer", "Content themes and dialog-formatting rules are injected here so the live call sees the current authored tone and formatting contract."),
                ],
                review: ROLEPLAY_PIPELINE_REVIEW_20260515,
                meta: ["system prompt", "world context", "cast serialization"],
              },
              {
                id: "final-envelope",
                title: "Direct message array and roleplayContext payload",
                tag: "data-block",
                summary:
                  "The browser sends a direct chat request with the system instruction, full current history slice, wrapped user turn, and roleplay metadata.",
                fileRefs: [
                  ref("/src/services/llm.ts", "generateRoleplayResponseStream"),
                  ref("/src/integrations/supabase/client.ts", "Supabase auth session"),
                ],
                bullets: [
                  bullet("Message order", "The current direct lane sends system instruction first, then the conversation history, then the final wrapped user message."),
                  bullet("Pipeline", "The local working tree now posts pipeline=direct instead of the older roleplay_v2 planner/writer lane."),
                  bullet("Metadata", "roleplayContext still carries conversation id, day, time of day, active scene, and AI-vs-user character ownership metadata."),
                ],
                review: ROLEPLAY_PIPELINE_REVIEW_20260515,
                meta: ["/functions/v1/chat", "stream=true", "pipeline=direct"],
              },
            ],
          },
        ],
      },
      {
        id: "live-chat-edge-relay",
        title: "Phase 3: Edge Relay and Streaming Response",
        subtitle: "The Supabase chat function validates the request, gates the model/provider, and streams the response back to the browser.",
        groups: [
          {
            id: "live-chat-chat-edge",
            title: "supabase/functions/chat/index.ts",
            description: "Auth gate, rate limiting, xAI dispatch, and the direct streaming relay.",
            ownerTone: "edge",
            primaryRef: ref("/supabase/functions/chat/index.ts", "serve / handleDirect"),
            items: [
              {
                id: "edge-ingress",
                title: "Ingress guards and provider dispatch",
                tag: "validation",
                summary:
                  "The relay verifies auth, rate limits, model choice, and stream mode before calling xAI.",
                fileRefs: [
                  ref("/supabase/functions/chat/index.ts", "request handler"),
                  ref("/supabase/functions/_shared/rate-limit.ts", "chat window limits"),
                ],
                bullets: [
                  bullet("Auth", "Requires a signed-in user and resolves that user through Supabase auth before any provider call leaves the backend."),
                  bullet("Model gate", "Chronicle chat is still pinned to the Grok lane rather than being allowed to fan out across unrelated providers."),
                  bullet("Streaming contract", "The edge function returns SSE so the client can reveal the turn as it is generated instead of waiting for one opaque blob."),
                ],
                meta: ["auth", "rate limit", "xAI relay"],
              },
              {
                id: "compat-alias",
                title: "Compatibility alias for the old pipeline label",
                tag: "code-logic",
                summary:
                  "The old roleplay_v2 pipeline name is still accepted for compatibility, but it now aliases directly into the direct lane.",
                fileRefs: [
                  ref("/supabase/functions/chat/index.ts", "normalizedPipeline alias"),
                ],
                bullets: [
                  bullet("Current truth", "The planner/writer orchestration path is not the active runtime in the local working tree."),
                  bullet("Why keep aliasing", "Compatibility aliasing prevents older callers or stale local clients from hard-failing while the page and the runtime are being cleaned up."),
                ],
                meta: ["roleplay_v2 alias", "direct mode"],
              },
              {
                id: "edge-normalization",
                title: "Provider stream normalization",
                tag: "code-logic",
                summary:
                  "The edge function reads the provider stream, applies deterministic cleanup to the generated text, and re-streams the normalized result to the browser.",
                fileRefs: [
                  ref("/supabase/functions/chat/index.ts", "deterministic cleanup / normalization"),
                  ref("/src/services/llm.ts", "SSE stream parser"),
                ],
                bullets: [
                  bullet("Why it matters", "The browser is not receiving a raw untouched provider stream; backend cleanup can affect the exact text that becomes the accepted assistant response."),
                  bullet("Debug trace", "The admin debug surface records that deterministic cleanup is part of the edge path, but it does not currently retain a raw-versus-cleaned text diff."),
                ],
                meta: ["normalization", "SSE relay", "debug trace"],
              },
              {
                id: "content-filter-notice",
                title: "Content-filter notice path",
                tag: "validation",
                summary:
                  "When the provider blocks both the primary request and the safer retry, the edge function emits a structured local-notice event instead of surfacing a runtime 422 to the chat UI.",
                fileRefs: [
                  ref("/supabase/functions/chat/index.ts", "chronicle_content_filter SSE event"),
                  ref("/src/services/llm.ts", "content-filter SSE handling"),
                  ref("/src/components/chronicle/ChatInterfaceTab.tsx", "local content-filter notice"),
                ],
                bullets: [
                  bullet("UI behavior", "The chat UI saves a local Chronicle notice for the user but excludes that notice from future roleplay history."),
                  bullet("Review behavior", "The provider block and retry path remain visible in debug data so testers can see what actually happened."),
                ],
                meta: ["content filter", "local notice", "history exclusion"],
              },
            ],
          },
        ],
      },
      {
        id: "live-chat-post-turn",
        title: "Phase 4: Post-Turn Reconciliation",
        subtitle: "After the assistant response lands, Chronicle runs the follow-up extractors that keep memory, goals, and state current.",
        groups: [
          {
            id: "live-chat-fanout",
            title: "ChatInterfaceTab.tsx",
            description: "Client-side fanout trigger that launches the post-turn work without blocking the visible reply.",
            ownerTone: "component",
            primaryRef: ref("/src/components/chronicle/ChatInterfaceTab.tsx", "queueAssistantDerivedWork / async follow-up lane"),
            items: [
              {
                id: "post-turn-fanout",
                title: "Async post-turn work queue",
                tag: "service",
                summary:
                  "The visible response can finish streaming while follow-up extractors continue in the background against the newly accepted turn.",
                fileRefs: [
                  ref("/src/components/chronicle/ChatInterfaceTab.tsx", "queueAssistantDerivedWork"),
                ],
                bullets: [
	                  bullet("Separate concern", "This is why API Call 2 matters: Chronicle can keep accepted story state fresh even when older dialogue falls out of the raw context window."),
	                  bullet("Generation-aware", "The queued work carries message and generation lineage so stale regenerate branches do not overwrite newer accepted story state."),
                ],
                review: ROLEPLAY_PIPELINE_REVIEW_20260515,
                meta: ["async follow-up", "generation-aware"],
              },
            ],
          },
          {
            id: "live-chat-extractors",
            title: "Post-turn edge extractors",
            description: "The dedicated calls that update long-lived continuity state after each accepted turn.",
            ownerTone: "edge",
            primaryRef: ref("/supabase/functions/extract-memory-events/index.ts", "serve"),
            items: [
              {
                id: "memory-extraction",
                title: "Memory extraction",
                tag: "edge-function",
                summary:
                  "The memory extractor converts the latest user+assistant exchange into a few durable continuity facts that would create future inconsistency if forgotten.",
                fileRefs: [
                  ref("/supabase/functions/extract-memory-events/index.ts", "serve"),
                  ref("/src/components/chronicle/ChatInterfaceTab.tsx", "queueAssistantMemoryExtraction"),
                ],
                bullets: [
                  bullet("Input scope", "This pass is intentionally narrow: it compares the newest exchange against recent saved memories and returns 0-3 short past-tense memory points."),
                  bullet("Purpose", "It keeps old but still relevant facts alive after the raw transcript window eventually stops carrying them, without saving routine prose as memory."),
                ],
                review: ROLEPLAY_PIPELINE_REVIEW_20260515,
                meta: ["memory extraction", "continuity"],
              },
              {
                id: "goal-evaluation",
                title: "Goal progress evaluation",
                tag: "edge-function",
                summary:
                  "The goal evaluator inspects the newest exchange against pending story-goal steps and records completed steps into a derivation ledger.",
                fileRefs: [
                  ref("/supabase/functions/evaluate-goal-progress/index.ts", "serve"),
                  ref("/src/components/chronicle/ChatInterfaceTab.tsx", "evaluateGoalProgress"),
                ],
                bullets: [
                  bullet("Ledgered output", "Completed steps are persisted with source message and source generation lineage instead of being treated like fuzzy ambient progress."),
                  bullet("Current open milestone", "The client sends only the first incomplete step for each writer-visible incomplete story goal, so the evaluator sees the active milestone without the full remaining checklist."),
                ],
                review: ROLEPLAY_PIPELINE_REVIEW_20260515,
                meta: ["goal derivation", "completion ledger"],
              },
              {
                id: "character-extraction",
                title: "Character-state extraction",
                tag: "edge-function",
                summary:
                  "The character extractor reads the latest exchange plus a small recent context slice and proposes only allowed state updates.",
                settingsGate:
                  "Runs after each accepted assistant response in the post-turn support lane.",
                fileRefs: [
                  ref("/supabase/functions/extract-character-updates/index.ts", "serve"),
                  ref("/src/components/chronicle/ChatInterfaceTab.tsx", "extractCharacterUpdatesFromDialogue"),
                ],
                bullets: [
                  bullet("Recent slice", "The local working tree currently rereads only the freshest 10 filtered messages instead of re-chewing a much larger transcript every turn."),
                  bullet("Allowlist", "Only supported character fields are allowed through, and model-claimed evidence must match text from the latest exchange before the edge accepts an update."),
                ],
                review: ROLEPLAY_PIPELINE_REVIEW_20260515,
                meta: ["state reconciliation", "last 10 messages", "allowlist"],
              },
            ],
          },
        ],
      },
      {
        id: "live-chat-state-persistence",
        title: "Phase 5: State Application and Continuity Persistence",
        subtitle: "Chronicle applies accepted updates into effective state and persists only the branch-valid continuity records.",
        groups: [
          {
            id: "live-chat-conversation-persistence",
            title: "Conversation persistence",
            description: "Messages, conversation meta, memories, and goal-step ledgers that directly affect future roleplay turns.",
            ownerTone: "database",
            primaryRef: ref("/src/services/persistence/conversations.ts", "saveNewMessages / upsertStoryGoalStepDerivations"),
            items: [
              {
                id: "message-ledger",
                title: "Messages, conversation meta, and generation lineage",
                tag: "database",
                summary:
                  "Conversation writes store role, content, created_at, generation id, and current day/time so the next turn can reconstruct the right branch of play.",
                fileRefs: [
                  ref("/src/services/persistence/conversations.ts", "saveNewMessages"),
                  ref("/src/services/persistence/conversations.ts", "updateConversationMeta"),
                ],
                bullets: [
                  bullet("Message truth", "The message ledger is the main source of truth for what was actually accepted into the conversation."),
                  bullet("Temporal truth", "Messages carry explicit day and time-of-day values, not just raw timestamps."),
                ],
                meta: ["messages", "generation_id", "day/time"],
              },
              {
                id: "memory-goal-ledgers",
                title: "Memories and story-goal step derivation ledger",
                tag: "storage",
                summary:
                  "Memories and completed goal steps are persisted as separate continuity ledgers keyed to the assistant generation that produced them.",
                fileRefs: [
                  ref("/src/services/persistence/conversations.ts", "upsertMemories / fetchMemories"),
                  ref("/src/services/persistence/conversations.ts", "upsertStoryGoalStepDerivations / fetchStoryGoalStepDerivations"),
                ],
                bullets: [
                  bullet("Memories", "These records keep continuity alive even after raw transcript text ages out of the prompt window."),
                  bullet("Goal steps", "The derivation ledger stores day, time, source message id, and source generation id for each completed step."),
                ],
                meta: ["memories", "goal ledger", "branch safe"],
              },
            ],
          },
          {
            id: "live-chat-snapshots",
            title: "Character and side-character snapshots",
            description: "Delta-only snapshot tables that persist effective state for main and side cast members.",
            ownerTone: "database",
            primaryRef: ref("/src/services/persistence/side-characters.ts", "upsertSideCharacterMessageSnapshot"),
            items: [
              {
                id: "snapshot-persistence",
                title: "Effective-state merge and snapshot persistence",
                tag: "database",
                summary:
                  "Accepted updates are merged into effective state first, diffed against the current snapshot, and only then persisted.",
                fileRefs: [
                  ref("/src/components/chronicle/ChatInterfaceTab.tsx", "applyExtractedUpdates"),
                  ref("/src/services/persistence/conversations.ts", "upsertCharacterStateMessageSnapshot"),
                  ref("/src/services/persistence/side-characters.ts", "upsertSideCharacterMessageSnapshot"),
                ],
                bullets: [
                  bullet("Delta only", "If nothing materially changed in effective state, Chronicle skips the snapshot write."),
                  bullet("Current gap", "Character snapshots rely on source lineage and created_at, but they do not yet store explicit day/time fields the way goal-step derivations do."),
                ],
                meta: ["snapshot tables", "delta-only", "temporal gap"],
              },
            ],
          },
        ],
      },
      {
        id: "live-chat-optional-followups",
        title: "Phase 6: Optional Runtime Follow-Ups",
        subtitle: "Extra live-chat follow-ups that only fire on specific conditions, like day rollover or new side-cast discovery.",
        groups: [
          {
            id: "live-chat-day-rollover",
            title: "Time and day rollover",
            description: "Compression and continuity maintenance when the session clock advances into a new day.",
            ownerTone: "component",
            primaryRef: ref("/src/components/chronicle/ChatInterfaceTab.tsx", "day rollover handlers"),
            items: [
              {
                id: "day-compression",
                title: "Prior-day memory compression",
                tag: "service",
                summary:
                  "When the day increments, Chronicle compresses older bullet memories into a shorter long-term summary instead of dragging every detail forever.",
                settingsGate:
                  "Only runs when day progression crosses into a new day and there are older bullet memories worth compressing.",
                fileRefs: [
                  ref("/src/components/chronicle/ChatInterfaceTab.tsx", "day rollover"),
                  ref("/supabase/functions/compress-day-memories/index.ts", "serve"),
                ],
                bullets: [
                  bullet("Why it exists", "This keeps the continuity store dense and useful without letting day-by-day memory payloads balloon forever."),
                ],
                meta: ["memory compression", "day rollover"],
              },
            ],
          },
          {
            id: "live-chat-side-cast",
            title: "Side-cast onboarding",
            description: "Optional promotion of newly introduced named characters into durable side-character records.",
            ownerTone: "edge",
            primaryRef: ref("/supabase/functions/generate-side-character/index.ts", "serve"),
            items: [
              {
                id: "side-cast-profile",
                title: "Side-character generation and optional avatar follow-up",
                tag: "edge-function",
                summary:
                  "When the app decides a newly introduced character should become durable side-cast state, it can generate a profile and optionally chain into avatar generation.",
                settingsGate:
                  "Only runs when chat-side character discovery decides a new named character should be promoted into saved side-cast state.",
                fileRefs: [
                  ref("/src/components/chronicle/ChatInterfaceTab.tsx", "generateSideCharacterDetailsAsync"),
                  ref("/supabase/functions/generate-side-character/index.ts", "serve"),
                  ref("/supabase/functions/generate-side-character-avatar/index.ts", "serve"),
                ],
                bullets: [
                  bullet("Inputs", "The generator uses dialogue context, extracted trait scaffolding, and world context for setting fit; private generated fields must be supported by first-appearance evidence and are rechecked before persistence."),
                  bullet("Why optional", "This is a conditional follow-up lane, not part of the baseline chat request path."),
                ],
                review: ROLEPLAY_PIPELINE_REVIEW_20260515,
                meta: ["side cast", "follow-up avatar"],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "supporting-roleplay-systems",
    family: "supporting",
    navLabel: "Supporting Systems",
    navSubtitle: "Weighting, gates, lineage, settings",
    kicker: "Supporting Systems",
    title: "Supporting Roleplay Systems",
    description:
      "Non-call systems that still materially change what Grok writes, what state gets preserved, and how regeneration or extraction stays branch-safe.",
    phases: [
      {
        id: "support-trait-serialization",
        title: "Support Group 1: Personality Trait Serialization",
        subtitle: "Traits are serialized as character-card reference text. The current prompt path does not apply a numeric personality-weighting layer.",
        groups: [
          {
            id: "support-trait-serialization-service",
            title: "llm.ts + persistence/shared.ts",
            description: "Trait normalization and the prompt-side wording that turns stored personality fields into live character-card reference text.",
            ownerTone: "service",
            primaryRef: ref("/src/services/llm.ts", "renderPersonalityBlock / buildTraitDescription"),
            items: [
              {
                id: "trait-serialization-rules",
                title: "Outward, inward, legacy, and fallback trait rendering",
                tag: "core-prompt",
                summary:
                  "Chronicle renders populated personality fields into prompt reference text without applying score brackets, visibility offsets, or trend shaping.",
                fileRefs: [
                  ref("/src/services/llm.ts", "personality trait serialization"),
                  ref("/src/services/persistence/shared.ts", "asPersonalityTraits"),
                  ref("/src/types.ts", "PersonalityTrait / scoreTrend / outwardTraits / inwardTraits"),
                ],
                bullets: [
                  bullet("Split mode", "Outward and inward traits render under separate headings when the card uses split personality mode."),
                  bullet("Legacy fallback", "Older flat trait arrays still render as personality reference text."),
                  bullet("No score math", "The current runtime renders trait fields directly before API Call 1 instead of converting them into numeric influence tiers."),
                ],
                review: ROLEPLAY_PIPELINE_REVIEW_20260515,
                meta: ["outward/inward headings", "legacy trait fallback", "no score math"],
              },
            ],
          },
        ],
      },
      {
        id: "support-goal-guidance",
        title: "Support Group 2: Goal Guidance and Alignment",
        subtitle: "Story goals and character goals use explicit guidance strength, but the write-time prompt and the post-turn evaluator are not perfectly symmetrical.",
        groups: [
          {
            id: "support-goal-guidance-prompt",
            title: "Guidance strength controls",
            description: "UI control plus prompt-side interpretation of rigid, normal, and flexible goal guidance.",
            ownerTone: "component",
            primaryRef: ref("/src/components/chronicle/GuidanceStrengthSlider.tsx", "GuidanceStrengthSlider"),
            items: [
              {
                id: "goal-flexibility-prompt",
                title: "Prompt-time goal flexibility steering",
                tag: "context-injection",
                summary:
                  "Rigid, normal, and flexible are real roleplay levers that change how strongly the prompt steers toward a goal.",
                fileRefs: [
                  ref("/src/components/chronicle/GuidanceStrengthSlider.tsx", "slider copy"),
                  ref("/src/services/llm.ts", "describeGoalFlexibility"),
                ],
                bullets: [
                  bullet("Rigid", "Treats the goal like a firm track the scene should keep moving toward unless the user clearly overrides it."),
                  bullet("Flexible", "Treats the goal more like a soft bias that should yield if the user's play keeps pushing elsewhere."),
                ],
                review: ROLEPLAY_PIPELINE_REVIEW_20260515,
                meta: ["guidance strength", "story goals", "character goals"],
              },
            ],
          },
          {
            id: "support-goal-guidance-evaluator",
            title: "Goal alignment evaluator",
            description: "Post-turn support now separates binary step completion from goal-alignment diagnostics. This lane is currently shadow-mode only: it is reviewed in debug output but does not tune API Call 1 yet.",
            ownerTone: "edge",
            primaryRef: ref("/supabase/functions/evaluate-goal-alignment/index.ts", "Goal alignment evaluator"),
            items: [
              {
                id: "goal-alignment-gradient",
                title: "Weighted alignment scoring",
                tag: "validation",
                summary:
                  "Grok classifies support, resistance, drift, neutral, or not-applicable signals for review. Chronicle has deterministic scoring code, but live persistence and API Call 1 steering are disabled while shadow mode remains on.",
                problemSolved:
                  "This lets us inspect whether the classifier is trustworthy before allowing it to change durable goal pressure.",
                fileRefs: [
                  ref("/supabase/functions/evaluate-goal-alignment/index.ts", "classification prompt"),
                  ref("/src/lib/goal-alignment.ts", "scoring algorithm"),
                  ref("/src/components/chronicle/ChatInterfaceTab.tsx", "evaluateGoalAlignment"),
                ],
                bullets: [
                  bullet("Rigid", "Moves slowly and does not auto-drop from repeated resistance."),
                  bullet("Normal", "Moves at a moderate rate and can drop only after sustained resistance or drift."),
                  bullet("Flexible", "Moves fastest and can drop earlier when the roleplay keeps carrying away from it."),
                ],
                review: ROLEPLAY_PIPELINE_REVIEW_20260515,
                meta: ["goal alignment", "adaptive scoring", "guidance strength"],
              },
              {
                id: "goal-progress-binary",
                title: "Step completion remains binary",
                tag: "validation",
                summary:
                  "The older goal-progress support call still owns story-step completion only. It is intentionally separate from goal alignment, which currently reports softer user-receptiveness signals for debug review.",
                fileRefs: [
                  ref("/supabase/functions/evaluate-goal-progress/index.ts", "completed true/false prompt rules"),
                  ref("/supabase/migrations/20260521044256_424aa268-34cd-41aa-a2ea-dc2779b01344.sql", "goal_alignment_states"),
                ],
                bullets: [
                  bullet("Progress", "A listed milestone is either completed or not completed."),
                  bullet("Alignment", "A goal can be supported, resisted, drifting, dormant, or dropped without pretending a milestone completed."),
                ],
                meta: ["step completion", "goal alignment state"],
              },
            ],
          },
        ],
      },
      {
        id: "support-extraction-lineage",
        title: "Support Group 3: Post-Turn Support Lane and Refresh Safety",
        subtitle: "Chronicle runs post-turn support work after accepted assistant responses, while generation lineage prevents stale regenerate branches from becoming active state.",
        groups: [
          {
            id: "support-extraction-gates",
            title: "ChatInterfaceTab.tsx",
            description: "Support-lane orchestration that queues memory extraction, goal progress, goal alignment diagnostics, and character extraction after accepted assistant output.",
            ownerTone: "component",
            primaryRef: ref("/src/components/chronicle/ChatInterfaceTab.tsx", "post-turn support lane / buildActiveGoalCompletionIds"),
            items: [
              {
                id: "extraction-gates",
                title: "Accepted-message support queue",
                tag: "code-logic",
                summary:
                  "After an assistant response is accepted, Chronicle queues support calls against that accepted message and its generation id instead of running them against drafts or stale branches.",
                fileRefs: [
                  ref("/src/components/chronicle/ChatInterfaceTab.tsx", "post-turn character extraction queue"),
                ],
                bullets: [
                  bullet("Queue", "The accepted assistant response schedules memory, goal, alignment, and character-state workers."),
                  bullet("State guard", "Character updates are applied only after the worker returns accepted updates for the same source message context."),
                ],
                review: ROLEPLAY_PIPELINE_REVIEW_20260515,
                meta: ["post-turn lane", "accepted message"],
              },
              {
                id: "generation-lineage",
                title: "Branch-aware refresh and regenerate safety",
                tag: "database",
                summary:
                  "Memories, goal completions, and character snapshots only count if their source generation still matches the currently accepted branch of that message slot.",
                fileRefs: [
                  ref("/src/components/chronicle/ChatInterfaceTab.tsx", "buildActiveGoalCompletionIds"),
                  ref("/src/components/chronicle/ChatInterfaceTab.tsx", "buildActiveCharacterSnapshotMap"),
                  ref("/src/components/chronicle/ChatInterfaceTab.tsx", "isMessageGenerationStillCurrent"),
                ],
                bullets: [
                  bullet("Why it matters", "If a user regenerates a reply, stale post-turn writes from the rejected branch should not poison the active continuity state."),
                  bullet("Implementation", "Chronicle filters continuity records by sourceMessageId plus sourceGenerationId instead of trusting arrival order alone."),
                ],
                review: ROLEPLAY_PIPELINE_REVIEW_20260515,
                meta: ["branch aware", "sourceGenerationId"],
              },
            ],
          },
        ],
      },
      {
        id: "support-canonical-overlay",
        title: "Support Group 4: Accepted State Overlay",
        subtitle: "The effective cast and world state used in play is layered from multiple sources, not read straight from the original authored cards.",
        groups: [
          {
            id: "support-overlay-merge",
            title: "Effective state builders",
            description: "Overlay logic that merges authored scenario data with valid session and snapshot state.",
            ownerTone: "component",
            primaryRef: ref("/src/components/chronicle/ChatInterfaceTab.tsx", "effectiveWorldCore / computeEffectiveCharacter"),
            items: [
              {
                id: "canonical-overlay",
                title: "Base authored state + session overrides + valid snapshots",
                tag: "data-block",
                summary:
                  "Chronicle builds effective roleplay state by overlaying current valid runtime updates on top of the original authored scenario graph.",
                fileRefs: [
                  ref("/src/components/chronicle/ChatInterfaceTab.tsx", "effectiveWorldCore"),
                  ref("/src/components/chronicle/ChatInterfaceTab.tsx", "computeEffectiveCharacter"),
                ],
                bullets: [
	                  bullet("World", "Live scene, day/time, and session-specific overrides can replace older base story fields when they are the current accepted story state."),
                  bullet("Characters", "Main and side characters are rebuilt from authored cards plus valid session and snapshot updates before the next turn is sent."),
                ],
                review: ROLEPLAY_PIPELINE_REVIEW_20260515,
	                meta: ["state overlay", "effective state"],
              },
            ],
          },
        ],
      },
      {
        id: "support-temporal-truth",
        title: "Support Group 5: Temporal and Snapshot Truth",
        subtitle: "Some continuity records already have first-class day/time lineage, while other roleplay records still rely on timestamps and message linkage instead.",
        groups: [
          {
            id: "support-temporal-ledgers",
            title: "Conversation persistence truth",
            description: "What the continuity ledgers store today, and where the remaining timestamp gap still exists.",
            ownerTone: "database",
            primaryRef: ref("/src/services/persistence/conversations.ts", "goal derivation + snapshot writes"),
            items: [
              {
                id: "temporal-truth",
                title: "Explicit day/time on messages and goal derivations",
                tag: "storage",
                summary:
                  "Messages and story-goal derivations carry explicit day and time-of-day values, which gives later turns durable temporal anchors.",
                fileRefs: [
                  ref("/src/services/persistence/conversations.ts", "saveNewMessages"),
                  ref("/src/services/persistence/conversations.ts", "upsertStoryGoalStepDerivations"),
                ],
                bullets: [
                  bullet("Messages", "Each saved message can carry the current day and time-of-day, not just a raw created_at timestamp."),
                  bullet("Goals", "Completed goal-step derivations also carry explicit day/time, source message id, and source generation id."),
                ],
                review: ROLEPLAY_PIPELINE_REVIEW_20260515,
                meta: ["day/time", "goal derivations"],
              },
              {
                id: "snapshot-time-gap",
                title: "Character snapshot temporal gap",
                tag: "validation",
                summary:
                  "Character snapshot rows are generation-safe, but they do not yet store the same explicit day/time fields that goal-step derivations do.",
                problemSolved:
                  "This matters because a future prompt or audit layer cannot cleanly answer 'this trait changed on day 3 at sunset' from snapshot rows alone.",
                fileRefs: [
                  ref("/src/services/persistence/conversations.ts", "upsertCharacterStateMessageSnapshot"),
                  ref("/src/services/persistence/side-characters.ts", "upsertSideCharacterMessageSnapshot"),
                ],
                bullets: [
                  bullet("Current truth", "Snapshots rely on sourceMessageId, sourceGenerationId, and created_at for lineage."),
                  bullet("Missing field", "They do not currently persist explicit currentDay/currentTimeOfDay values."),
                ],
                meta: ["snapshot gap", "needs explicit day/time"],
              },
            ],
          },
        ],
      },
      {
        id: "support-prompt-settings",
        title: "Support Group 6: Prompt-Affecting Settings",
        subtitle: "Several UI settings materially change the recurring roleplay prompt, even though they are not separate API calls.",
        groups: [
          {
            id: "support-settings-prompt",
            title: "Roleplay controls and context gates",
            description: "Visible settings and hidden prompt shaping that materially change how the next reply is written.",
            ownerTone: "service",
            primaryRef: ref("/src/services/llm.ts", "settings-sensitive prompt assembly"),
            items: [
              {
                id: "settings-prompt-controls",
                title: "POV, verbosity, realism, NSFW intensity, scene, and memory controls",
                tag: "context-injection",
                summary:
                  "The recurring prompt reads several live settings that directly change output shape, tone, and what continuity context gets sent.",
                fileRefs: [
                  ref("/src/services/llm.ts", "narrativePov / responseVerbosity / realismMode / nsfwIntensity"),
                  ref("/src/components/chronicle/ChatInterfaceTab.tsx", "activeScene / session settings"),
                ],
                bullets: [
                  bullet("Writing shape", "POV, verbosity, dialog formatting, and realism settings all alter the prompt contract before Grok writes anything."),
                  bullet("Continuity scope", "Memories enabled, active scene, and time progression settings change what state blocks are serialized into the next turn."),
                  bullet("Tone", "NSFW intensity and related content controls shape how explicit or restrained the live writing is allowed to be."),
                ],
                review: ROLEPLAY_PIPELINE_REVIEW_20260515,
                meta: ["POV", "verbosity", "realism", "NSFW", "memories", "active scene"],
              },
              {
                id: "settings-physical-locks",
                title: "Physical continuity and content-theme injections",
                tag: "core-prompt",
                summary:
	                  "Chronicle injects general physical-continuity safeguards and selected story-theme directives that affect how the current exchange should be rendered.",
                fileRefs: [
                  ref("/src/services/llm.ts", "physical logic / visibility / continuity rules"),
                  ref("/src/constants/tag-injection-registry.ts", "theme directive text"),
                ],
                bullets: [
                  bullet("Physical continuity", "The prompt includes general rules for visibility, covered/hidden details, object availability, environmental constraints, unfinished actions, and preserving the user's concrete action direction."),
                  bullet("Theme lane", "Content-theme injections convert only selected story themes into one STORY THEMES block without needing a separate API call."),
                ],
                review: ROLEPLAY_PIPELINE_REVIEW_20260515,
                meta: ["physical continuity", "theme injections"],
              },
            ],
          },
        ],
      },
      {
        id: "support-composer-spellcheck",
        title: "Support Group 7: Composer Input Assistance",
        subtitle: "The live chat composer suppresses native browser spellcheck and replaces it with a narrow Chronicle-specific spelling aid so custom names and lore terms are not constantly underlined.",
        groups: [
          {
            id: "support-composer-spellcheck-ui",
            title: "Chat composer spelling aid",
            description: "Client-side overlay logic that highlights likely misspellings, allows click or right-click correction, and keeps the allowlist narrowly scoped to roleplay-specific proper nouns and location labels.",
            ownerTone: "component",
            primaryRef: ref("/src/components/chronicle/ChatSpellcheckTextarea.tsx", "ChatSpellcheckTextarea"),
            items: [
              {
                id: "composer-spellcheck-overlay",
                title: "Custom misspelling overlay and scoped allowlist",
                tag: "code-logic",
                summary:
                  "The chat composer disables native browser spellcheck, loads a lightweight local dictionary, highlights likely misspellings, and offers in-app correction suggestions without adding grammar or punctuation rewriting.",
                fileRefs: [
                  ref("/src/components/chronicle/ChatSpellcheckTextarea.tsx", "ChatSpellcheckTextarea"),
                  ref("/src/lib/chat-spellcheck.ts", "loadEnglishSpellDictionary / extractMisspelledRanges / buildSpellOverlaySegments / getSpellingSuggestions / buildChatSpellAllowlist"),
                  ref("/src/components/chronicle/ChatInterfaceTab.tsx", "chatSpellAllowlistEntries"),
                ],
                bullets: [
                  bullet("Why Chronicle owns it", "Browser spellcheck is turned off so red squiggles do not fight the app's styling or wrongly flag custom fantasy names, tags, and setting-specific terms."),
                  bullet("Scope", "This is intentionally a narrow spelling aid, not a grammar or punctuation system. It only spots likely misspelled words and suggests replacements."),
                  bullet("Allowlist policy", "The allowlist is built from world and cast proper-noun style fields such as scenario name, scene labels, location labels, and character names rather than broad prose fields."),
                ],
                meta: ["composer only", "spellcheck=false", "custom dictionary", "right-click supported"],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "adjacent-one-off-ai-calls",
    family: "adjacent",
    navLabel: "Adjacent AI Calls",
    navSubtitle: "Optional chat-adjacent tools",
    kicker: "Adjacent AI Calls",
    title: "Adjacent One-Off AI Calls",
    description:
      "Optional AI surfaces that still touch the roleplay experience, but are not part of the turn-by-turn chat runtime. Builder-only helpers and admin tooling belong on App Architecture instead.",
    phases: [
      {
        id: "adjacent-scene-images",
        title: "Chat Scene Image Generation",
        subtitle: "A chat-adjacent image lane that uses recent dialogue and compact roleplay context, but does not participate in the core write/update loop.",
        groups: [
          {
            id: "adjacent-scene-images-launch",
            title: "ChatInterfaceTab.tsx",
            description: "Launch point that gathers the current scene slice and invokes the scene-image edge function.",
            ownerTone: "component",
            primaryRef: ref("/src/components/chronicle/ChatInterfaceTab.tsx", "generate-scene-image invoke"),
            items: [
              {
                id: "scene-image-request",
                title: "Scene image request assembly",
                tag: "data-block",
                summary:
                  "The chat image tool uses recent dialogue, scene location, time of day, art style, and compacted character descriptors to build a scene-image request.",
                settingsGate:
                  "Optional chat-adjacent lane. It only runs when the user explicitly asks for a scene image from the chat interface.",
                fileRefs: [
                  ref("/src/components/chronicle/ChatInterfaceTab.tsx", "generate-scene-image invoke"),
                ],
                bullets: [
                  bullet("Scoped context", "This lane uses a small recent message window and visual-only character descriptors rather than the full roleplay transcript or private character-card fields."),
                  bullet("Result", "A returned image URL is appended back into chat as an image message instead of changing the narrative state directly."),
                ],
                review: ROLEPLAY_PIPELINE_REVIEW_20260515,
                meta: ["scene image", "chat tool"],
              },
            ],
          },
          {
            id: "adjacent-scene-images-edge",
            title: "supabase/functions/generate-scene-image/index.ts",
            description: "Structured analysis plus byte-aware prompt compaction before the image model is called.",
            ownerTone: "edge",
            primaryRef: ref("/supabase/functions/generate-scene-image/index.ts", "buildAnalysisPrompt / generateImage"),
            items: [
              {
                id: "scene-image-edge",
                title: "Scene analysis and image generation",
                tag: "edge-function",
                summary:
                  "The scene-image function first asks for structured scene understanding, then compacts that into an image prompt that fits xAI's byte limits.",
                fileRefs: [
                  ref("/supabase/functions/generate-scene-image/index.ts", "buildAnalysisPrompt"),
                  ref("/supabase/functions/generate-scene-image/index.ts", "assemblePromptWithByteLimit"),
                  ref("/supabase/functions/generate-scene-image/index.ts", "generateImage"),
                ],
                bullets: [
                  bullet("Two-step lane", "It uses visual-field whitelisting and a schema-bound text-model analysis pass before the actual image-model request so the prompt can stay compact, visual, and scene-aware."),
                  bullet("Separation", "This lane is roleplay-adjacent, not part of the core chat turn loop that writes and reconciles dialogue."),
                ],
                review: ROLEPLAY_PIPELINE_REVIEW_20260515,
                meta: ["analysis + image", "byte-aware prompt"],
              },
              {
                id: "cover-image-edge",
                title: "Cover image generation",
                tag: "edge-function",
                summary:
                  "The cover-image lane creates a story/character cover asset from compact scenario context and image settings, separate from chat turn generation and scene-image chat tools.",
                fileRefs: [
                  ref("/supabase/functions/generate-cover-image/index.ts", "serve"),
                ],
                bullets: [
                  bullet("Separation", "This is an adjacent image call and should not be read as part of API Call 1 or API Call 2 roleplay state reconciliation."),
                  bullet("Result", "The returned image URL is used as media/cover output rather than a text-roleplay response."),
                ],
                review: ROLEPLAY_PIPELINE_REVIEW_20260515,
                meta: ["cover image", "adjacent AI call"],
              },
            ],
          },
        ],
      },
    ],
  },
];
