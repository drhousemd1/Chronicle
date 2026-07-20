import { defineManualArchitectureFiles } from "./types";

const codeLogicHeader = {
  label: "CODE LOGIC" as const,
  className: "code-logic" as const,
  filterValue: "code-logic" as const,
  navAccent: "code-logic" as const,
};

const testHeader = {
  label: "TEST" as const,
  className: "test" as const,
  filterValue: "test" as const,
  navAccent: "test" as const,
};

export const chatDebugArchitectureFiles = defineManualArchitectureFiles([
  {
    path: "/src/features/chat-debug/response-job-summary.ts",
    header: codeLogicHeader,
    metric: "106 lines",
    metricDescription: "HTML formatter for captured RoleplayResponseJob metadata.",
    description:
      "Reads responseJob from a captured API Call 1 request and renders a compact escaped-HTML summary of mode, purpose, history policy, response detail, mode-specific fields, and every final-user lane. It is used by review exports and regression validation; it never builds or changes the runtime response job.",
    rows: [],
    reviewedSource: "Manual review of response-job extraction, lane inventory, mode-specific fields, HTML escaping, and empty-state behavior.",
  },
  {
    path: "/src/features/chat-debug/retry-history.ts",
    header: codeLogicHeader,
    metric: "187 lines",
    metricDescription: "Session-debug history for superseded assistant generations.",
    description:
      "Appends the visible assistant message being replaced by Retry to a parent-message attempt history and later builds an ordered lineage record for the final generation. The contract explicitly marks this history as session-debug-only and prohibits it from re-entering the live prompt.",
    rows: [],
    reviewedSource: "Manual review of attempt numbering, generation identity, captured text and time metadata, ordering, child-segment links, debug-record attachment, and no-attempt behavior.",
  },
  {
    path: "/src/features/chat-debug/retry-history.test.ts",
    header: testHeader,
    metric: "179 lines",
    metricDescription: "Regression coverage for retry-attempt storage and final lineage.",
    description:
      "Proves that replaced assistant generations append without mutating prior history, that final-parent lineage is ordered and explicitly debug-only, and that a message with no replaced attempts produces no lineage record.",
    rows: [],
    reviewedSource: "Manual review of all three retry-history test cases and their lineage assertions.",
  },
  {
    path: "/src/features/chat-debug/review-metrics.ts",
    header: codeLogicHeader,
    metric: "716 lines",
    metricDescription: "Deterministic transcript, response-detail, and source-overlap diagnostics.",
    description:
      "Computes local debugging measurements from saved roleplay text and available application state. It parses action, dialogue, internal-thought, and plain-text segments; measures length and repetition; compares output terms with potential input sources; carries history and source-authority receipts; and produces warnings for review without changing the response or making a quality decision.",
    rows: [
      {
        id: "review-metrics-segment-analysis",
        title: "Per-segment roleplay diagnostics",
        summary:
          "Builds one metrics record for each rendered speaker segment, covering text shape, modality balance, repetition, source overlap, recent-history treatment, state-authority decisions, and character-card copy evidence.",
        badgeLabel: "DETERMINISTIC",
        badgeClass: "code-logic",
        details: [
          { label: "Text Metrics", values: ["word and sentence counts", "modality counts and sequence", "dialogue-to-narration ratio", "repeated terms and two-to-five-word phrases"], kind: "plain" },
          { label: "Evidence Carried", values: ["recent-history receipts", "suppressed style anchors", "user-state authority decisions", "captured character prompt facts"], kind: "plain" },
          { label: "Source Comparison", values: ["latest user message", "recent chat history", "character card", "story card", "goal data", "current state"], kind: "plain" },
          { label: "Boundary", values: ["term overlap is a debugging hint, not proof of causation or model reasoning"], kind: "plain" },
        ],
      },
      {
        id: "review-metrics-thought-diagnostics",
        title: "Internal-thought diagnostics",
        summary:
          "Flags possible multi-concern thoughts, adjacent thought chains, visible-action echoes, and unsupported-fact risk by deterministic text comparison only.",
        badgeLabel: "REVIEW SIGNAL",
        badgeClass: "code-logic",
        details: [
          { label: "Signals", values: ["concern categories", "sentence count", "adjacent thought count", "shared action terms", "nearby/source anchoring"], kind: "plain" },
          { label: "Negative Guarantee", values: ["does not rewrite output", "does not claim access to hidden model reasoning", "does not automatically reject a response"], kind: "plain" },
        ],
      },
      {
        id: "review-metrics-parent-response-detail",
        title: "Parent-message response-detail review",
        summary:
          "Measures the complete assistant parent message before it is split into speaker cards and records diagnostic warnings for underdeveloped detailed responses, repeated phrases, or suspiciously uniform child-card sizes.",
        badgeLabel: "PARENT METRIC",
        badgeClass: "code-logic",
        details: [
          { label: "Inputs", values: ["raw parent text", "rendered child word counts", "latest player turn", "effective response-detail setting"], kind: "plain" },
          { label: "Escape Reasons", values: ["brief player turn", "scene-transition turn"], kind: "plain" },
          { label: "Output", values: ["ParentMessageResponseDetailMetrics with warnings and counts"], kind: "plain" },
        ],
      },
      {
        id: "review-metrics-transcript-summary",
        title: "Whole-transcript summary",
        summary:
          "Aggregates assistant/user block counts, assistant length distribution, repeated terms, repeated phrases, and similar-length warnings across all exported segments except local provider notices.",
        badgeLabel: "SESSION METRIC",
        badgeClass: "code-logic",
        details: [
          { label: "Schema", values: ["chronicle-session-deterministic-metrics-v1"], kind: "plain" },
          { label: "Negative Guarantee", values: ["local notices are excluded from assistant roleplay metrics", "results are diagnostic hints rather than quality judgments"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of tokenization, word/phrase counting, source-corpus construction, source overlap, thought diagnostics, segment metrics, parent response-detail warnings, transcript aggregation, and public schema output.",
  },
  {
    path: "/src/features/chat-debug/review-metrics.test.ts",
    header: testHeader,
    metric: "467 lines",
    metricDescription: "Regression coverage for deterministic roleplay review metrics.",
    description:
      "Exercises modality counts, repetition, source overlap, recent-history evidence, thought warnings, local-notice exclusion, generation-captured fact precedence, and full-parent response-detail diagnostics including the naturally brief-turn escape case.",
    rows: [],
    reviewedSource: "Manual review of both buildReviewDebugMetrics and buildParentMessageResponseDetailMetrics suites and their six behavioral cases.",
  },
  {
    path: "/src/features/chat-debug/review-export.ts",
    header: codeLogicHeader,
    metric: "2,539 lines",
    metricDescription: "Self-contained HTML roleplay session review and evidence export.",
    description:
      "Builds the downloadable Chronicle Session Log from the saved conversation, current character metadata, tester comments, retry history, state-change evidence, pruning reports, API Call 1 capture, support-call captures, and deterministic review metrics. It groups each saved message as one parent, renders speaker-aware child cards beneath it, and embeds the complete machine-readable review payload in the HTML without changing runtime state.",
    rows: [
      {
        id: "review-export-message-model",
        title: "Saved-parent and rendered-child model",
        summary:
          "Keeps database message ownership at the parent level while splitting the display into speaker-aware child cards, preventing debug evidence and tester comments from being duplicated across rendered segments.",
        badgeLabel: "EXPORT MODEL",
        badgeClass: "data-block",
        details: [
          { label: "Parent Owns", values: ["message and generation IDs", "raw text", "day/time", "image", "Continue/Retry markers", "tester comment", "state changes", "pruning reports", "debug record", "retry lineage"], kind: "plain" },
          { label: "Child Owns", values: ["review ID", "segment number", "resolved speaker", "speaker control/role/avatar", "rendered text"], kind: "plain" },
          { label: "Speaker Resolution", values: ["raw speaker labels", "paragraph splitting", "narrative inference", "role-based fallback", "merge by rendered speaker"], kind: "plain" },
        ],
      },
      {
        id: "review-export-runtime-evidence",
        title: "API Call 1 and response-job evidence",
        summary:
          "Renders the captured browser request, provider request blocks, response-job mode and lane summary, recent-history treatment, source receipts, source shaping, provider/source boundaries, goal exposure, response detail, and character prompt facts.",
        badgeLabel: "CALL 1 EVIDENCE",
        badgeClass: "api-call",
        details: [
          { label: "Evidence Inputs", values: ["StoredChatDebugTrace.call1Request", "RoleplayResponseJob requestBody", "modelRequest/modelRequests", "runtime receipt fields carried on ChatDebugRequestRecord"], kind: "plain" },
          { label: "Boundary", values: ["the export displays captured evidence; it does not reconstruct or resend the provider request"], kind: "plain" },
        ],
      },
      {
        id: "review-export-support-evidence",
        title: "Support-worker and persistence evidence",
        summary:
          "Renders each captured support call with its review envelope, readiness record, model request, response, accepted/rejected projections, and applied-update or day-compression evidence.",
        badgeLabel: "SUPPORT EVIDENCE",
        badgeClass: "integration",
        details: [
          { label: "Support Coverage", values: ["memory extraction", "goal progress and alignment", "character-state review", "side-character work", "day compression", "other captured support endpoints"], kind: "plain" },
          { label: "Review Boundary", values: ["accepted, rejected, skipped, failed, and persisted outcomes remain distinct", "empty frontend accepted updates are not repopulated from an earlier edge result"], kind: "plain" },
        ],
      },
      {
        id: "review-export-session-review",
        title: "Tester and deterministic review surface",
        summary:
          "Adds tagged tester comments, issue-category totals, transcript metrics, internal-thought diagnostics, retry attempts, parser diagnostics, and source-state evidence to the same portable file.",
        badgeLabel: "QA EXPORT",
        badgeClass: "feature",
        details: [
          { label: "Embedded Schemas", values: ["chronicle-session-review-v2", "chronicle-session-retry-lineage-v1", "chronicle-session-deterministic-metrics-v1"], kind: "plain" },
          { label: "Output", values: ["escaped static HTML", "inline CSS", "application/json data scripts for comments and complete review data"], kind: "plain" },
          { label: "Negative Guarantee", values: ["tester notes are not sent to the roleplay model", "debug data is not saved story state", "the export has no persistence side effects"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of export types, speaker and parent grouping, response-job/source/support evidence renderers, retry and state evidence, deterministic metrics integration, comments and issue summary, HTML/CSS generation, and embedded JSON payload.",
  },
  {
    path: "/src/features/chat-debug/review-export.test.ts",
    header: testHeader,
    metric: "1,613 lines",
    metricDescription: "End-to-end fixture coverage for the static session review export.",
    description:
      "Builds representative exports and asserts parent/child ownership, compression decisions, empty accepted updates, speaker merging, tagged comments, retry lineage, response-job and history metadata, generation-specific action markers, pruning reports, goal receipts, and internal-thought diagnostics.",
    rows: [],
    reviewedSource: "Manual review of all twelve buildChatReviewHtml cases and the evidence each fixture is intended to preserve.",
  },
  {
    path: "/src/features/chat-debug/session-log.ts",
    header: codeLogicHeader,
    metric: "154 lines",
    metricDescription: "Markdown formatter for the older planner/writer ChatDebugTrace shape.",
    description:
      "Converts a StoredChatDebugTrace into Markdown lines describing the older planner, writer, validator, normalization, timing, source-excerpt, and scene-state trace contract. No current runtime source imports this formatter; it remains a dormant formatter for the legacy trace shape rather than the active HTML session-export path.",
    rows: [],
    reviewedSource: "Manual review of trace availability handling, final-path labels, timing, roleplay context, planner fields, supporting excerpts, writer/validator fields, notes, and current import search showing no runtime consumer.",
  },
  {
    path: "/src/features/chat-debug/storage.ts",
    header: codeLogicHeader,
    metric: "154 lines",
    metricDescription: "Session-storage repository for per-generation chat debug captures.",
    description:
      "Loads and persists the current scenario/conversation debug map under chronicle.chat-debug.v1, keys entries by message plus stable generation ID, and upserts API Call 1, support calls, or complete traces without allowing storage failure to break chat. Replacing a generation removes stale records for the same message so the visible generation owns the current trace.",
    rows: [
      {
        id: "chat-debug-storage-identity",
        title: "Message and generation identity",
        summary:
          "Uses messageId:generationId as the stable unit for debug traces and dialogue-comment keys, falling back to message ID only when a generation ID is unavailable.",
        badgeLabel: "BROWSER STATE",
        badgeClass: "data-block",
        details: [
          { label: "Storage Key", values: ["chronicle.chat-debug.v1:{scenarioId}:{conversationId}"], kind: "plain" },
          { label: "Record Contents", values: ["trace", "API Call 1 request", "support calls", "capture time"], kind: "plain" },
          { label: "Upsert Rules", values: ["support calls merge by call ID", "missing fields preserve existing captures", "a new generation evicts another generation for the same message"], kind: "plain" },
          { label: "Failure Policy", values: ["unavailable, invalid, or full sessionStorage returns an empty store or silently skips persistence so chat continues"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of storage key construction, safe loading/persistence, trace and call upserts, generation replacement, retrieval helpers, and sessionStorage failure policy.",
  },
  {
    path: "/src/features/chat-debug/types.ts",
    header: codeLogicHeader,
    metric: "215 lines",
    metricDescription: "Shared contracts for chat traces, request captures, tester comments, and runtime receipts.",
    description:
      "Defines the browser-debug record vocabulary consumed by chat capture, storage, review export, response services, and persistence. ChatDebugRequestRecord is the central carrier for literal request/response data plus source, state, history, response-detail, support-envelope, and readiness evidence; StoredChatDebugTrace binds those captures to one message generation.",
    rows: [
      {
        id: "chat-debug-request-contract",
        title: "Captured request and evidence contract",
        summary:
          "Separates browser requestBody, provider modelRequest/modelRequests, responseBody, status, errors, and notes while attaching structured roleplay evidence as explicitly named optional fields.",
        badgeLabel: "TYPE CONTRACT",
        badgeClass: "data-block",
        details: [
          { label: "Request Groups", values: ["call_1", "call_2", "support"], kind: "plain" },
          { label: "Roleplay Evidence", values: ["source receipts and coverage", "duplicate metrics", "source shaping and budget", "user-state authority", "character facts", "knowledge visibility", "goal exposure", "effective response detail", "support review and readiness"], kind: "plain" },
          { label: "Provider Evidence", values: ["endpoint", "method", "literal requestBody", "capture time", "usage", "reasoning summaries", "stream error"], kind: "plain" },
        ],
      },
      {
        id: "chat-debug-comment-contract",
        title: "Tester comment and issue-tag contract",
        summary:
          "Provides an ordered, validated issue-tag vocabulary and stores one note against an exact message generation with created and updated timestamps.",
        badgeLabel: "QA CONTRACT",
        badgeClass: "data-block",
        details: [
          { label: "Tags", values: ["Scene Logic", "Character Control", "Speaker Flow", "Follow-Through", "Repetition", "Dialogue Quality", "Formatting", "Prompt Leakage", "Memory / State", "Context Use", "Other"], kind: "plain" },
          { label: "Normalization", values: ["drops unknown tags", "deduplicates selected tags", "returns tags in the canonical display order"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of issue tags, tester comments, legacy trace shape, request capture fields, roleplay evidence imports, stored trace identity, and map contracts.",
  },
]);
