import { defineManualArchitectureFiles } from "./types";

const componentHeader = {
  label: "REACT COMPONENT" as const,
  className: "component" as const,
  filterValue: "component" as const,
  navAccent: "component" as const,
};

export const chronicleChatInterfaceArchitectureFiles = defineManualArchitectureFiles([
  {
    path: "/src/components/chronicle/ChatInterfaceTab.tsx",
    header: componentHeader,
    metric: "8,623 lines",
    metricDescription: "Active roleplay session UI and browser-side runtime orchestrator.",
    description:
      "Runs Chronicle's in-session roleplay workspace. It renders the transcript, character sidebar, composer, session settings, time controls, message tools, and admin review controls while coordinating effective story state, Normal Send, Retry, Continue, deleted-assistant recovery, assistant commit guards, post-turn support work, character and memory persistence, dynamic side-character registration, scene-image requests, and debug exports. Domain-specific contracts live in imported chat-runtime modules, but this component is the browser boundary that assembles those contracts around the currently open conversation.",
    rows: [
      {
        id: "chat-session-hydration-effective-state",
        title: "Session hydration and effective state",
        summary:
          "Loads session overrides, message-scoped character snapshots, side-character snapshots, goal derivations, goal-alignment records, the full message identity index, memories, debug comments, and sidebar backgrounds, then derives the state used by both the visible UI and later response jobs.",
        badgeLabel: "STATE OWNER",
        badgeClass: "feature",
        details: [
          { label: "Loads", values: ["character session states", "character and side-character message snapshots", "story-goal step derivations", "goal-alignment states", "conversation message identity index", "memories", "dialogue debug comments", "sidebar backgrounds"], kind: "plain" },
          { label: "Derives", values: ["current generation map", "active memories", "effective world core", "effective main and side characters", "active scene for display", "canonical scene for API Call 1"], kind: "plain" },
          { label: "Generation Safety", values: ["deleted or superseded generations are excluded by the identity index and effective-state helpers", "fresh refs are used by asynchronous persistence paths to avoid stale React closures"], kind: "plain" },
          { label: "Failure Guard", values: ["response generation is disabled when canonical derivations fail to load rather than silently using incomplete state"], kind: "plain" },
        ],
      },
      {
        id: "chat-response-job-dispatch",
        title: "Response-job dispatch for Send, Retry, and Continue",
        summary:
          "Builds an explicit RoleplayResponseJob for the selected action and delegates request assembly, provider transport, response cleanup, placeholder handling, and debug capture to collectRoleplayResponse.",
        badgeLabel: "API CALL 1",
        badgeClass: "api-call",
        details: [
          { label: "Normal Send", values: ["creates and displays the user message first", "uses normal_send with the raw player turn, established-fact note, current-state digest, response detail, and support-readiness snapshot"], kind: "plain" },
          { label: "Retry", values: ["finds the nearest prior user message", "removes that turn and the rejected assistant response from history", "uses retry_regenerate with rejected-attempt text and a meaningfully-different response instruction", "replaces the same assistant message ID with a new generation ID"], kind: "plain" },
          { label: "Continue", values: ["uses continue_assistant_tail only when the visible tail is an accepted assistant generation", "anchors the job to the assistant message and accepted text tail"], kind: "plain" },
          { label: "Deleted-Assistant Recovery", values: ["when deletion leaves a user-authored tail, uses the separate normal_send recovery builder", "reuses the existing user row and does not insert a dummy user message"], kind: "plain" },
          { label: "Delegates To", values: ["/src/features/chat-runtime/roleplay-response-job.ts", "/src/features/chat-runtime/continue-tail-action.ts", "/src/features/chat-runtime/collect-roleplay-response.ts"], kind: "files" },
        ],
      },
      {
        id: "chat-generation-commit-boundary",
        title: "Message commit and generation-lineage guard",
        summary:
          "Commits an assistant result only if the source user message, retry target, or Continue tail still has the generation identity captured when the request began.",
        badgeLabel: "COMMIT GUARD",
        badgeClass: "code-logic",
        details: [
          { label: "Prevents", values: ["late responses attaching to an edited or deleted user turn", "stale Retry results overwriting a newer generation", "Continue results appending after the conversation tail changed"], kind: "plain" },
          { label: "Message Mutations", values: ["new Send and Continue responses append new assistant message IDs", "Retry preserves the message ID and assigns a new generation ID", "manual edits assign a new generation ID", "deletion removes the message identity and records a possible deleted-assistant recovery marker"], kind: "plain" },
          { label: "Errors", values: ["content filters and provider failures become local notice messages only when the triggering lineage is still current", "local notices are excluded from roleplay style and scene evidence"], kind: "plain" },
          { label: "Persistence", values: ["new messages are saved before post-turn workers run", "message edits and deletions call their dedicated persistence helpers"], kind: "plain" },
        ],
      },
      {
        id: "chat-post-turn-support",
        title: "Post-turn support-worker coordination",
        summary:
          "Starts assistant-derived work only after the visible assistant source message has been saved, tracks each worker from queued through persistence, and keeps support results unavailable to the response that triggered them.",
        badgeLabel: "API CALL 2",
        badgeClass: "integration",
        details: [
          { label: "Workers", values: ["memory extraction", "goal-progress evaluation", "goal-alignment evaluation in shadow mode", "character-state review and persistence", "day-memory compression after day rollover"], kind: "plain" },
          { label: "Lifecycle Evidence", values: ["support readiness records", "pending and finalized RoleplaySupportReviewEnvelope records", "request and response bodies", "provider debug payloads", "persistence status, target IDs, reasons, and context gaps"], kind: "plain" },
          { label: "Stale Handling", values: ["checks source message and generation before use and again around persistence", "marks superseded work stale or excludes written stale rows from effective prompt state"], kind: "plain" },
          { label: "Queue Owner", values: ["/src/features/chat-runtime/use-post-turn-support-queue.ts"], kind: "files" },
        ],
      },
      {
        id: "chat-reviewed-character-state",
        title: "Reviewed character-state persistence",
        summary:
          "Scopes character-state extraction to explicitly eligible characters, accepts only reviewed supported fields with concrete evidence and sufficient confidence, and writes canonical message-scoped snapshots rather than mutating base character cards.",
        badgeLabel: "PERSISTENCE",
        badgeClass: "integration",
        details: [
          { label: "Inputs", values: ["latest user and assistant exchange", "ten-message context slice", "current effective main and side-character records", "deterministic eligibility rows", "story clock and source lineage"], kind: "plain" },
          { label: "Accepted Domains", values: ["identity and role fields", "location and scene position", "appearance and clothing", "personality and supported sections", "durable goals and goal steps"], kind: "plain" },
          { label: "Rejects", values: ["ineligible characters", "unsupported fields", "goal removal", "low-confidence candidates", "generic or missing evidence", "unreviewed raw model candidates", "no-op state changes"], kind: "plain" },
          { label: "Writes", values: ["character state message snapshots", "side-character message snapshots", "field-change metadata", "per-candidate apply receipts"], kind: "plain" },
        ],
      },
      {
        id: "chat-memory-goal-persistence",
        title: "Memory, goal, and day-compression persistence",
        summary:
          "Maintains user-editable memories and applies reviewed assistant-derived candidates, accepted goal-step completions, and row-safe day-rollover compression to future effective state.",
        badgeLabel: "DURABLE STATE",
        badgeClass: "data-block",
        details: [
          { label: "Memory Review", values: ["reviews each extracted candidate against user and accepted-assistant source authority", "filters near duplicates", "persists accepted candidates individually with their source message and generation"], kind: "plain" },
          { label: "Goal Progress", values: ["evaluates only the current open step of eligible story goals", "requires completed result, at least 0.75 confidence, and specific exchange evidence", "writes message-scoped step derivations"], kind: "plain" },
          { label: "Goal Alignment", values: ["currently runs in diagnostic shadow mode", "captures evaluations for review but does not persist or inject them into API Call 1"], kind: "plain" },
          { label: "Day Compression", values: ["runs when the day increments", "reviews accepted, rejected, and omitted input memory row IDs", "persists the synopsis before deleting only accepted source rows", "records cleanup gaps without deleting unaccepted rows"], kind: "plain" },
        ],
      },
      {
        id: "chat-dynamic-side-characters",
        title: "Dynamic side-character registration and enrichment",
        summary:
          "Detects newly named speakers in an accepted assistant response, creates and publishes minimal side-character records before state review, then enriches their profile and avatar asynchronously.",
        badgeLabel: "CHARACTER LIFECYCLE",
        badgeClass: "feature",
        details: [
          { label: "Ordering", values: ["detect against current main and side-character names", "publish to the live ref", "await the minimal database row", "allow character-state review to include the new character", "start optional profile and avatar enrichment"], kind: "plain" },
          { label: "Profile Call", values: ["generate-side-character receives name, dialogue context, world premise, model ID, and optional debug trace"], kind: "plain" },
          { label: "Avatar Call", values: ["generate-side-character-avatar receives the sanitized avatar prompt plus art-style ID", "the edge function resolves the private style prompt"], kind: "plain" },
          { label: "Guardrails", values: ["generated profile fields are source-sanitized", "image requests receive visual character data rather than private card fields", "failures do not remove the already registered minimal character"], kind: "plain" },
        ],
      },
      {
        id: "chat-session-ui-tools",
        title: "Transcript, character sidebar, and session controls",
        summary:
          "Owns the fixed split-pane session interface and routes user actions for messages, character cards, memory tools, themes, scene images, story time, and response settings.",
        badgeLabel: "USER INTERFACE",
        badgeClass: "component",
        details: [
          { label: "Transcript", values: ["formatted multi-speaker bubbles", "inline message editing", "copy, delete, Retry, and Continue controls", "streaming and typing indicators", "scroll-preserving older-message pagination"], kind: "plain" },
          { label: "Characters", values: ["effective main and side-character cards", "session-scoped main-character edits", "side-character edits and deletion", "main-character session-reset deletion", "avatar crop and tile repositioning"], kind: "plain" },
          { label: "Session Settings", values: ["background visibility", "bubble transparency and offset", "dark and dynamic text", "narrative point of view", "NSFW intensity", "realism", "response detail", "chat colors", "manual or automatic time progression"], kind: "plain" },
          { label: "Adjacent Media", values: ["scene-image generation uses five recent non-notice messages, mentioned-character visual data, active display scene, time of day, art-style ID, and model ID", "the resulting image is appended as an assistant image message"], kind: "plain" },
        ],
      },
      {
        id: "chat-admin-debug-review",
        title: "Admin debug capture and review export",
        summary:
          "Keeps request traces, support-call records, retry history, action events, state-change summaries, and message-level tester comments aligned to message and generation identities for an exported playthrough review.",
        badgeLabel: "DEBUG ONLY",
        badgeClass: "tooling",
        details: [
          { label: "Captures", values: ["API Call 1 request and response trace", "support-call requests and reviewed results", "local style telemetry", "support readiness", "Retry attempts", "Continue and regenerate action events", "post-turn state changes"], kind: "plain" },
          { label: "Tester Comments", values: ["admin-only issue tags and freeform notes", "merged local and database copies", "never sent to the model and never treated as story state"], kind: "plain" },
          { label: "Export", values: ["downloads a self-contained HTML session log containing the conversation, debug records, comments, retries, actions, and post-turn effects"], kind: "plain" },
          { label: "Boundary", values: ["debug surfaces explain runtime behavior but do not alter the accepted assistant response or trigger hidden retries"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of imports, state and refs, conversation hydration, effective-state derivation, all response modes, generation guards, message mutation, support workers, reviewed persistence, memory and goal handling, day compression, side-character registration, scene media, session controls, and admin export flow.",
  },
]);
