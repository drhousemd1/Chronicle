import { defineManualArchitectureFiles } from "./types";

const codeLogicHeader = {
  label: "CODE LOGIC" as const,
  className: "code-logic" as const,
  filterValue: "code-logic" as const,
  navAccent: "code-logic" as const,
};

const componentHeader = {
  label: "REACT COMPONENT" as const,
  className: "component" as const,
  filterValue: "component" as const,
  navAccent: "component" as const,
};

const hookHeader = {
  label: "HOOK" as const,
  className: "hook" as const,
  filterValue: "hook" as const,
  navAccent: "hook" as const,
};

const testHeader = {
  label: "TEST" as const,
  className: "test" as const,
  filterValue: "test" as const,
  navAccent: "test" as const,
};

export const chatRuntimeFoundationArchitectureFiles = defineManualArchitectureFiles([
  {
    path: "/src/features/chat-runtime/avatar-position.ts",
    header: codeLogicHeader,
    metric: "81 lines",
    metricDescription: "Avatar crop-coordinate conversion used by chat tiles and editor previews.",
    description:
      "Converts percentage-based avatar positioning between the square character preview and the wider chat portrait tile while accounting for each crop's actual overflow. It clamps saved positions, caches natural image dimensions, and centers an axis when the destination crop has no movable overflow.",
    rows: [],
    reviewedSource: "Manual review of preview and tile dimensions, overflow math, percent clamping, image-size caching, and both conversion directions.",
  },
  {
    path: "/src/features/chat-runtime/avatar-position.test.ts",
    header: testHeader,
    metric: "37 lines",
    metricDescription: "Regression coverage for chat avatar crop conversion.",
    description:
      "Proves percentage clamping, round-trip preservation on a crop axis with overflow, and automatic centering when the destination tile cannot pan along an axis.",
    rows: [],
    reviewedSource: "Manual review of all three avatar-position test cases.",
  },
  {
    path: "/src/features/chat-runtime/chat-colors.ts",
    header: codeLogicHeader,
    metric: "56 lines",
    metricDescription: "Validation and human-readable labeling for chat color values.",
    description:
      "Normalizes three- or six-digit hexadecimal color strings for persisted chat styling, rejects invalid in-progress color drafts without overwriting the prior value, and maps a valid color to the broad family label shown in the editor.",
    rows: [],
    reviewedSource: "Manual review of hexadecimal normalization, fallback behavior, draft validation, and RGB color-family thresholds.",
  },
  {
    path: "/src/features/chat-runtime/chat-colors.test.ts",
    header: testHeader,
    metric: "30 lines",
    metricDescription: "Regression coverage for chat color normalization and labels.",
    description:
      "Verifies valid and invalid hexadecimal handling, non-destructive typed-draft rejection, and the established broad color-family labels.",
    rows: [],
    reviewedSource: "Manual review of all chat-color test cases.",
  },
  {
    path: "/src/features/chat-runtime/collect-roleplay-response.ts",
    header: codeLogicHeader,
    metric: "182 lines",
    metricDescription: "Browser-side collector for one streamed roleplay response.",
    description:
      "Calls the shared roleplay stream service with the current scenario, response job, source-authority decisions, model, time, memory, and scene context. It accumulates stream chunks, optionally updates the visible draft, sanitizes the final assistant text, normalizes placeholder names, captures API Call 1 debug evidence, and attaches any partial request evidence to provider errors before rethrowing them.",
    rows: [
      {
        id: "collect-response-streaming-boundary",
        title: "Streaming and final-text boundary",
        summary:
          "Keeps the raw provider stream, optional incremental display, and final saved text distinct so partial rendering cannot bypass the final sanitizer and placeholder-name guard.",
        badgeLabel: "STREAM BOUNDARY",
        badgeClass: "code-logic",
        details: [
          { label: "Inputs", values: ["ScenarioData and conversation identity", "RoleplayResponseJob and authority decisions", "model, time, memory, and active scene", "output sanitizer and placeholder map"], kind: "plain" },
          { label: "Outputs", values: ["cleaned assistant text", "updated placeholder map", "ChatDebugTrace", "captured API Call 1 request"], kind: "plain" },
          { label: "Failure Rule", values: ["provider errors retain the trace and request captured before failure and are rethrown to the caller"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of stream option construction, chunk accumulation, optional UI callbacks, final sanitization, placeholder normalization, debug capture, and thrown-error enrichment.",
  },
  {
    path: "/src/features/chat-runtime/collect-roleplay-response.test.ts",
    header: testHeader,
    metric: "208 lines",
    metricDescription: "Regression coverage for streamed response collection and failure evidence.",
    description:
      "Verifies chunk collection, optional streaming callbacks, response-job forwarding, final sanitization and placeholder normalization, and recovery of captured or fallback debug metadata from provider failures.",
    rows: [],
    reviewedSource: "Manual review of the five collectRoleplayResponse test cases.",
  },
  {
    path: "/src/features/chat-runtime/continue-tail-action.ts",
    header: codeLogicHeader,
    metric: "109 lines",
    metricDescription: "Decision contract for Continue and deleted-assistant recovery.",
    description:
      "Examines the latest non-notice message and returns exactly one action: extend an accepted assistant tail, recover a deleted assistant reply from the still-visible user tail through Normal Send, or declare Continue unavailable. It supplies the accepted assistant generation and prior user boundary without treating an ordinary user-authored tail as Continue.",
    rows: [
      {
        id: "continue-tail-action-routing",
        title: "Tail-action routing",
        summary:
          "Protects the distinction between strict assistant-tail continuation and user-tail recovery after a specifically tracked assistant deletion.",
        badgeLabel: "MODE ROUTING",
        badgeClass: "code-logic",
        details: [
          { label: "Assistant Tail", values: ["returns continue_assistant_tail with message and generation identity plus the nearest prior user message"], kind: "plain" },
          { label: "Deleted Reply", values: ["returns normal_send_deleted_assistant_recovery only when the deletion marker points to the latest visible user message"], kind: "plain" },
          { label: "Excluded", values: ["local notices", "empty tail text", "ordinary latest user messages", "missing roleplay history"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of roleplay-tail filtering, prior-user lookup, assistant-tail identity, deleted-assistant marker matching, and unavailable reasons.",
  },
  {
    path: "/src/features/chat-runtime/continue-tail-action.test.ts",
    header: testHeader,
    metric: "85 lines",
    metricDescription: "Regression coverage for Continue and user-tail recovery selection.",
    description:
      "Proves strict assistant-tail Continue, deleted-assistant recovery through Normal Send, refusal to continue an ordinary user tail, and exclusion of local provider notices when determining the latest roleplay message.",
    rows: [],
    reviewedSource: "Manual review of all four continue-tail action fixtures.",
  },
  {
    path: "/src/features/chat-runtime/debug-support.ts",
    header: codeLogicHeader,
    metric: "89 lines",
    metricDescription: "Normalization helpers for edge and support-call debug evidence.",
    description:
      "Separates Chronicle's embedded edge debug payload from the response body shown to callers, normalizes thrown support-call errors, extracts response-body error text, and derives completed or error status while preserving edge-reported failures as the highest-priority signal.",
    rows: [],
    reviewedSource: "Manual review of edge-payload splitting, model-request extraction, error stringification, response error priority, and status construction.",
  },
  {
    path: "/src/features/chat-runtime/debug-support.test.ts",
    header: testHeader,
    metric: "94 lines",
    metricDescription: "Regression coverage for support-call debug normalization.",
    description:
      "Covers primitive and ordinary response bodies, removal of embedded edge debug metadata, thrown-error normalization, response-body error precedence, and completed-versus-error status selection.",
    rows: [],
    reviewedSource: "Manual review of the six debug-support test cases.",
  },
  {
    path: "/src/features/chat-runtime/dialog-debug-comments.ts",
    header: codeLogicHeader,
    metric: "139 lines",
    metricDescription: "Generation-aware browser storage for tester dialogue comments.",
    description:
      "Loads, normalizes, merges, compares, deletes, and saves admin tester comments keyed to an exact message generation. It converts the stored map into the visible-message map used by review export and treats malformed or unavailable localStorage as non-fatal debug-state loss rather than a chat failure.",
    rows: [],
    reviewedSource: "Manual review of storage keys, generation maps, last-update merge rules, deletion, equality, export projection, legacy normalization, and storage failure handling.",
  },
  {
    path: "/src/features/chat-runtime/dialog-debug-comments.test.ts",
    header: testHeader,
    metric: "181 lines",
    metricDescription: "Regression coverage for tester comment identity and persistence.",
    description:
      "Verifies storage namespace stability, message-generation keys, newest-comment merges, message deletion, order-independent comparison, export mapping, legacy normalization, malformed-storage recovery, and non-fatal save failures.",
    rows: [],
    reviewedSource: "Manual review of all dialog-debug-comment cases.",
  },
  {
    path: "/src/features/chat-runtime/local-notices.ts",
    header: codeLogicHeader,
    metric: "48 lines",
    metricDescription: "Local assistant-message builders for provider failures.",
    description:
      "Creates content-filter and provider-error messages that can appear in the chat transcript without being treated as model-authored roleplay. Each notice carries localNotice metadata, a stable assistant-shaped message identity, normalized display text, and no claim that a provider generation succeeded.",
    rows: [],
    reviewedSource: "Manual review of content-filter and provider-error message construction, fallbacks, identity, timestamps, and localNotice metadata.",
  },
  {
    path: "/src/features/chat-runtime/local-notices.test.ts",
    header: testHeader,
    metric: "40 lines",
    metricDescription: "Regression coverage for local provider notices.",
    description:
      "Proves fallback content-filter copy, provider-error normalization, assistant-shaped message fields, and the localNotice marker used to exclude these rows from roleplay-tail logic and quality metrics.",
    rows: [],
    reviewedSource: "Manual review of all local-notice tests.",
  },
  {
    path: "/src/features/chat-runtime/message-formatting-utils.ts",
    header: codeLogicHeader,
    metric: "198 lines",
    metricDescription: "Roleplay text sanitizer, tokenizer, escaping, and editor-HTML formatter.",
    description:
      "Removes known wrapper and planner-language artifacts from assistant text, normalizes roleplay punctuation, separates narration, quoted speech, asterisk actions, and parenthetical thoughts in original order, escapes unsafe HTML, and renders the same token vocabulary as styled HTML for the inline editor.",
    rows: [
      {
        id: "message-formatting-token-contract",
        title: "Roleplay token contract",
        summary:
          "Provides one parsing vocabulary shared by read-only chat rendering and in-place editing so action, speech, thought, and plain narration do not change meaning between modes.",
        badgeLabel: "FORMAT CONTRACT",
        badgeClass: "code-logic",
        details: [
          { label: "Sanitizes", values: ["render-artifact fence lines", "double speaker colons", "thoughts wrapped as actions", "known planner-language labels", "excess blank lines"], kind: "plain" },
          { label: "Parses", values: ["plain narration", "quoted speech with trailing punctuation", "asterisk actions", "parenthetical thoughts"], kind: "plain" },
          { label: "Security", values: ["editor HTML escapes ampersands and angle brackets before styling"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of sanitizer patterns, token parser order, scene-tag removal, HTML escaping, and styled token output.",
  },
  {
    path: "/src/features/chat-runtime/message-formatting.tsx",
    header: componentHeader,
    metric: "175 lines",
    metricDescription: "Read-only and editable roleplay-message presentation.",
    description:
      "Renders the shared roleplay token stream with distinct dialogue, action, thought, and narration styling. Its inline editor keeps editing inside the existing message bubble, rewrites styled content as the user types, preserves the caret across HTML replacement, and returns plain text to the caller instead of owning persistence.",
    rows: [
      {
        id: "message-formatting-read-mode",
        title: "FormattedMessage display",
        summary:
          "Maps parsed token types to the established visual treatment and supports a non-dynamic mode for user-authored or action-style plain text.",
        badgeLabel: "DISPLAY",
        badgeClass: "component",
        details: [],
      },
      {
        id: "message-formatting-edit-mode",
        title: "InlineFormattedMessageEditor",
        summary:
          "Uses contentEditable to preserve the bubble layout and token styling while keeping the text caret stable after every sanitized HTML refresh.",
        badgeLabel: "INLINE EDITOR",
        badgeClass: "component",
        details: [
          { label: "Owns", values: ["formatted editable DOM", "caret offset restoration", "plain-text onChange values", "optional initial focus"], kind: "plain" },
          { label: "Does Not Own", values: ["message save", "speaker reassignment", "database persistence"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of token rendering, dynamic/plain modes, editable HTML updates, caret traversal, input and blur behavior, and ownership boundaries.",
  },
  {
    path: "/src/features/chat-runtime/message-formatting.test.tsx",
    header: testHeader,
    metric: "80 lines",
    metricDescription: "Regression coverage for roleplay text cleanup and token styling.",
    description:
      "Verifies wrapper cleanup without rewriting normal prose, token ordering, scene-tag removal, speech punctuation retention, HTML escaping, and the established editor color treatments.",
    rows: [],
    reviewedSource: "Manual review of all message-formatting test fixtures.",
  },
  {
    path: "/src/features/chat-runtime/speaker-resolution.ts",
    header: codeLogicHeader,
    metric: "146 lines",
    metricDescription: "Canonical speaker attribution and inline-edit serialization.",
    description:
      "Resolves parsed message segments to main or side characters using explicit labels, names, nicknames, narrative prefixes, and controlled-character fallbacks. It merges adjacent segments rendered for the same character and round-trips visible edits without losing hidden scene/update tags stored in the original message.",
    rows: [
      {
        id: "speaker-resolution-display-identity",
        title: "Rendered speaker identity",
        summary:
          "Normalizes explicit and inferred speaker names through the caller's canonical-name resolver before adjacent segments are merged.",
        badgeLabel: "SPEAKER FLOW",
        badgeClass: "code-logic",
        details: [
          { label: "Resolution Order", values: ["explicit segment speaker", "narrative-leading character or nickname", "first AI-controlled character", "user character or You fallback"], kind: "plain" },
          { label: "Editing Boundary", values: ["system tags are extracted before editing and restored ahead of serialized visible segments"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of hidden-tag extraction, alias matching, explicit and inferred speaker resolution, adjacent merge behavior, and edit serialization.",
  },
  {
    path: "/src/features/chat-runtime/speaker-resolution.test.ts",
    header: testHeader,
    metric: "130 lines",
    metricDescription: "Regression coverage for speaker identity and edited-message round trips.",
    description:
      "Proves hidden-tag preservation, merging of explicit and inferred segments by canonical character identity, shared rendering/editing segmentation, and non-duplicating inline-edit serialization.",
    rows: [],
    reviewedSource: "Manual review of all speaker-resolution fixtures.",
  },
  {
    path: "/src/features/chat-runtime/roleplay-response-detail.ts",
    header: codeLogicHeader,
    metric: "48 lines",
    metricDescription: "Effective response-length policy and debug provenance.",
    description:
      "Resolves concise, balanced, or detailed output behavior from the requested UI setting, falls back to balanced for missing or invalid input, maps the result to a maximum output-token budget, and records a stable hash plus preview of the exact rendered instruction for debugging.",
    rows: [],
    reviewedSource: "Manual review of setting validation, fallback provenance, output-token limits, instruction hashing, and preview generation.",
  },
  {
    path: "/src/features/chat-runtime/roleplay-response-detail.test.ts",
    header: testHeader,
    metric: "30 lines",
    metricDescription: "Regression coverage for response-detail fallback and provenance.",
    description:
      "Proves that absent settings use the balanced fallback without pretending the user explicitly selected it, while preserving the resolved token budget and instruction evidence.",
    rows: [],
    reviewedSource: "Manual review of the resolveEffectiveResponseDetail test.",
  },
  {
    path: "/src/features/chat-runtime/roleplay-response-job.ts",
    header: codeLogicHeader,
    metric: "368 lines",
    metricDescription: "First-class request contract for Normal Send, Retry, Continue, and deleted-reply recovery.",
    description:
      "Defines the typed RoleplayResponseJob passed from chat controls to API Call 1. The contract preserves runtime mode, user-facing purpose, player-turn identity, current state, response detail, history policy, mode-specific metadata, source receipts, and separately labeled final-user lanes so provider rendering does not have to infer which text is player input versus state or control guidance.",
    rows: [
      {
        id: "response-job-normal-send",
        title: "Normal Send and deleted-reply recovery",
        summary:
          "Normal Send carries a real player-turn message plus optional established facts and shared context. Deleted-assistant recovery reuses the visible user tail without creating another user row and remains a Normal Send variant.",
        badgeLabel: "NORMAL SEND",
        badgeClass: "api-call",
        details: [
          { label: "History", values: ["standard_recent_history"], kind: "plain" },
          { label: "Final User Lanes", values: ["player_turn", "optional established_fact_note", "current_state", "response_detail"], kind: "plain" },
          { label: "Recovery Evidence", values: ["deleted assistant message and generation", "createsNewUserMessage=false", "assistant_reply_deleted_latest_user_tail reason"], kind: "plain" },
        ],
      },
      {
        id: "response-job-retry",
        title: "Retry regeneration",
        summary:
          "Carries the original player turn while excluding the rejected assistant generation from recent history and exposing only a controlled rejection summary, required difference, and preservation rule.",
        badgeLabel: "RETRY",
        badgeClass: "api-call",
        details: [
          { label: "History", values: ["exclude_rejected_attempt"], kind: "plain" },
          { label: "Final User Lanes", values: ["player_turn", "optional established_fact_note", "retry_rejection", "current_state", "response_detail"], kind: "plain" },
          { label: "Negative Guarantee", values: ["the full rejected assistant text is not placed in the player-turn lane"], kind: "plain" },
        ],
      },
      {
        id: "response-job-continue",
        title: "Assistant-tail Continue",
        summary:
          "Extends an accepted assistant generation from its text tail with no fabricated player turn and records the nearest prior user message only as boundary metadata.",
        badgeLabel: "CONTINUE",
        badgeClass: "api-call",
        details: [
          { label: "History", values: ["anchor_on_accepted_assistant_tail"], kind: "plain" },
          { label: "Final User Lanes", values: ["continue_anchor", "current_state", "response_detail"], kind: "plain" },
          { label: "Negative Guarantee", values: ["playerTurn is null", "Continue does not create a dummy user message"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of every response-job type, lane authority, history policy, mode data contract, and all four builders.",
  },
  {
    path: "/src/features/chat-runtime/roleplay-response-job.test.ts",
    header: testHeader,
    metric: "208 lines",
    metricDescription: "Contract coverage for every roleplay response mode and lane boundary.",
    description:
      "Verifies distinct Normal Send, Retry, and Continue jobs; deleted-assistant recovery without a dummy user row; separation of established facts from player input; and exclusion of rejected assistant text from Retry's player-turn lane.",
    rows: [],
    reviewedSource: "Manual review of all RoleplayResponseJob contract fixtures and lane assertions.",
  },
  {
    path: "/src/features/chat-runtime/roleplay-response-job-rendering.ts",
    header: codeLogicHeader,
    metric: "61 lines",
    metricDescription: "Provider-facing serialization and debug evidence for response-job lanes.",
    description:
      "Serializes one RoleplayResponseJob into the final labeled user content sent to the provider. It includes only model-facing lanes, preserves each lane's kind, source role, and authority in the rendered labels, appends the shared execution brief, and produces compact lane evidence for debug review without copying full source text into summaries.",
    rows: [],
    reviewedSource: "Manual review of execution-brief wording, lane labels, model-facing filtering, final content assembly, and evidence previews.",
  },
  {
    path: "/src/features/chat-runtime/roleplay-scene-roster.ts",
    header: codeLogicHeader,
    metric: "60 lines",
    metricDescription: "Canonical current-scene roster for main and side characters.",
    description:
      "Builds one immutable, uncapped roster from effective main characters followed by effective side characters. Every row records identity, control, role, and location; missing locations become Unknown, empty scene positions are omitted, and the rendered provider block introduces no observer graph or separate knowledge system.",
    rows: [],
    reviewedSource: "Manual review of row normalization, stable ordering, missing-value rules, immutability, and provider text rendering.",
  },
  {
    path: "/src/features/chat-runtime/roleplay-scene-roster.test.ts",
    header: testHeader,
    metric: "63 lines",
    metricDescription: "Regression coverage for scene-roster completeness and restraint.",
    description:
      "Proves uncapped stable ordering across main and side characters, explicit Unknown locations, omission of empty positions, and the absence of observer metadata.",
    rows: [],
    reviewedSource: "Manual review of all scene-roster tests.",
  },
  {
    path: "/src/features/chat-runtime/roleplay-side-character-registration.ts",
    header: codeLogicHeader,
    metric: "29 lines",
    metricDescription: "Same-turn registration barrier for dynamically introduced side characters.",
    description:
      "Publishes newly detected side characters to the current in-memory roster immediately, then waits only for each minimal database row before allowing same-turn state review to consume it. Failed inserts are removed from the published roster so later state persistence cannot target a character that does not exist in storage.",
    rows: [],
    reviewedSource: "Manual review of deduplication, immediate publish order, sequential minimal persistence, failure removal, and returned persisted set.",
  },
  {
    path: "/src/features/chat-runtime/roleplay-side-character-registration.test.ts",
    header: testHeader,
    metric: "42 lines",
    metricDescription: "Unit coverage for dynamic side-character registration ordering.",
    description:
      "Verifies immediate publication before the persistence promise resolves and removal of failed minimal rows before same-turn character-state work can use them.",
    rows: [],
    reviewedSource: "Manual review of both registration unit tests.",
  },
  {
    path: "/src/features/chat-runtime/roleplay-side-character-registration-runtime-wiring.test.ts",
    header: testHeader,
    metric: "37 lines",
    metricDescription: "Source-level wiring check for dynamic side-character ordering.",
    description:
      "Confirms the chat runtime publishes and minimally persists newly discovered side characters before it queues character-state review, rather than waiting for another render to expose them.",
    rows: [],
    reviewedSource: "Manual review of the runtime-wiring assertions against ChatInterfaceTab.",
  },
  {
    path: "/src/features/chat-runtime/use-chat-debug-trace.ts",
    header: hookHeader,
    metric: "84 lines",
    metricDescription: "Admin-only hook for saving response and support-call debug captures.",
    description:
      "Maintains the generation-aware chat debug store for the active scenario and conversation. Admin sessions can attach API Call 1 evidence to a message generation and merge support-call updates into the same record; non-admin sessions perform no debug persistence.",
    rows: [],
    reviewedSource: "Manual review of store loading on conversation changes, admin gates, generation identity, trace/request enrichment, support-call upserts, and persistence calls.",
  },
  {
    path: "/src/features/chat-runtime/use-chat-debug-trace.test.ts",
    header: testHeader,
    metric: "232 lines",
    metricDescription: "Hook coverage for admin debug capture and support-call merging.",
    description:
      "Proves that non-admin sessions do not write debug data, API Call 1 records are enriched from the model trace, and repeated support-call lifecycle updates merge without losing the original request body.",
    rows: [],
    reviewedSource: "Manual review of all useChatDebugTrace hook tests.",
  },
  {
    path: "/src/features/chat-runtime/structured-mood-removal.test.ts",
    header: testHeader,
    metric: "39 lines",
    metricDescription: "Terminal guard against reintroducing structured mood state.",
    description:
      "Scans active application code, scripts, and edge functions for retired structured-mood field names and provider-facing mood labels so future changes cannot silently restore the removed UI, prompt, worker, or persistence contract.",
    rows: [],
    reviewedSource: "Manual review of search roots, excluded historical/generated paths, forbidden patterns, and failure reporting.",
  },
]);
