import { defineManualArchitectureFiles } from "./types";

const serviceHeader = {
  label: "SERVICE" as const,
  className: "service" as const,
  filterValue: "service" as const,
  navAccent: "service" as const,
};

const testHeader = {
  label: "TEST" as const,
  className: "test" as const,
  filterValue: "test" as const,
  navAccent: "test" as const,
};

export const aiAndRuntimeServiceArchitectureFiles = defineManualArchitectureFiles([
  {
    path: "/src/services/character-ai.ts",
    header: serviceHeader,
    metric: "1,649 lines",
    metricDescription: "Character Builder prompt construction, AI field enhancement, fill, and generation.",
    description:
      "Owns the Character Builder's text-generation workflows. It assembles current story, world, content-theme, lore, scene, cast, and target-character context; generates field-specific prompts; invokes the chat edge function; and converts returned text or JSON into a guarded partial Character patch. Existing populated fields are not overwritten by AI Fill, while AI Generate may add genuinely missing custom sections and rows without duplicating existing section titles.",
    rows: [
      {
        id: "character-ai-context",
        title: "Scenario and target-character context",
        summary:
          "Compiles the creator's current world fields, structured locations, content-theme directives, opening dialog, lore, scenes, story goals, other-character summaries, and already-authored target-character details so generated additions remain consistent with the actual scenario.",
        badgeLabel: "PROMPT CONTEXT",
        badgeClass: "context-injection",
        details: [],
      },
      {
        id: "character-ai-field-enhancement",
        title: "Single-field enhancement",
        summary:
          "Maps supported character fields to specific writing instructions, supports precise and detailed modes, handles label-plus-value generation for empty custom rows, retries transient chat failures, and returns only the generated field text rather than mutating application state directly.",
        badgeLabel: "FIELD ENHANCE",
        badgeClass: "api-call",
        details: [{ label: "Edge Function", values: ["chat"], kind: "edges" }],
      },
      {
        id: "character-ai-fill",
        title: "Fill empty existing fields",
        summary:
          "Inventories empty canonical fields and empty custom-row values, requests structured JSON, tolerates limited malformed JSON formatting, and applies only values that were empty when the request began. It preserves existing text, row identities, timestamps, and section structure.",
        badgeLabel: "AI FILL",
        badgeClass: "code-logic",
        details: [],
      },
      {
        id: "character-ai-generate",
        title: "Generate missing character structure",
        summary:
          "Fills empty canonical values and may add missing section items or new custom sections. New rows receive Chronicle IDs and timestamps, while duplicate section titles and duplicate labels in an existing section are rejected before the patch is returned.",
        badgeLabel: "AI GENERATE",
        badgeClass: "code-logic",
        details: [],
      },
      {
        id: "character-ai-observability",
        title: "Creator-call telemetry and prompt coverage",
        summary:
          "Records nonblocking AI usage and admin test-session validation snapshots for enhancement, fill, and generation calls. These records describe the creator-assistance request and are separate from the live roleplay response pipeline.",
        badgeLabel: "DIAGNOSTICS",
        badgeClass: "data-block",
        details: [],
      },
    ],
    reviewedSource: "Manual review of context builders, field prompt registry, retry transport, JSON extraction, empty-field inventory, patch application, section creation, telemetry, and validation snapshots.",
  },
  {
    path: "/src/services/chat-edge-request-hardening.test.ts",
    header: testHeader,
    metric: "25 lines",
    metricDescription: "Source-contract check for browser-to-chat request limits.",
    description:
      "Guards the chat edge function's request boundary by checking that direct caller body size, message count, individual message length, and maximum provider output tokens are bounded before an xAI request can be sent.",
    rows: [],
    reviewedSource: "Manual review of the direct request-hardening assertions against the chat edge source.",
  },
  {
    path: "/src/services/extract-character-updates-completeness.test.ts",
    header: testHeader,
    metric: "79 lines",
    metricDescription: "Coverage tests for post-turn physical-state review rows.",
    description:
      "Proves that the character-state review detects eligible characters omitted by Grok, excludes malformed rows from coverage, and can merge a focused retry result to complete review coverage without fabricating a state update for a character whose evidence supports no change.",
    rows: [],
    reviewedSource: "Manual review of omission detection, malformed-row rejection, focused-retry merge, and no-update coverage assertions.",
  },
  {
    path: "/src/services/extract-character-updates-prompt.test.ts",
    header: testHeader,
    metric: "57 lines",
    metricDescription: "Source-contract checks for character-state extraction instructions.",
    description:
      "Checks that post-turn character-state prompts use structural output guidance, evaluate only latest-exchange evidence, require scene-position updates when placement is explicit, cover every eligible character, and generate concise positive goal milestones without embedding story-specific examples.",
    rows: [],
    reviewedSource: "Manual review of all prompt-guidance assertions against the extract-character-updates edge function.",
  },
  {
    path: "/src/services/field-enhance-prompts.test.ts",
    header: testHeader,
    metric: "173 lines",
    metricDescription: "Creator-assistance prompt coverage for character and world fields.",
    description:
      "Exercises the prompt builders behind sparkle-row enhancement. It proves character enhancements stay anchored to the selected label and full scenario context, world enhancements include cast and content-theme guidance, and empty structured world rows can request a separate generated label and description.",
    rows: [],
    reviewedSource: "Manual review of character-row, world-row, context, theme, and label-plus-description prompt assertions.",
  },
  {
    path: "/src/services/llm-canonical-coverage.test.ts",
    header: testHeader,
    metric: "1,395 lines",
    metricDescription: "Comprehensive deterministic coverage for API Call 1 prompt assembly.",
    description:
      "Validates the model-facing roleplay request built by llm.ts. The suite covers canonical story and character fields, compact current-state and scene-roster rendering, side-character control, card-fact selection, chat-setting branches, story-agnostic wording, goal exposure, five-message recent history, local-notice exclusion, history-treatment receipts, source-authority transformation, response-job final-user lanes, and omission of empty placeholders.",
    rows: [],
    reviewedSource: "Manual review of every test case and its relationship to system-instruction, history, goal, source-authority, and final-user-lane rendering.",
  },
  {
    path: "/src/services/llm.ts",
    header: serviceHeader,
    metric: "1,440 lines",
    metricDescription: "Primary browser-side roleplay request compiler and streaming transport client.",
    description:
      "Owns API Call 1 from Chronicle's prepared ScenarioData and RoleplayResponseJob to streamed assistant text. It compiles the long-lived system instruction, current-turn digest, bounded recent history, structured final-user lanes, goal exposure, response-detail policy, source receipts, and debug-only evidence; then sends one authenticated streaming request to the chat edge function and translates its server-sent events into visible text or explicit local error states.",
    rows: [
      {
        id: "llm-system-instruction",
        title: "System instruction and current-state context",
        summary:
          "Renders world facts, selected character-card facts, current scene roster, memories, temporal context, goal guidance, user-control boundaries, formatting rules, knowledge limits, continuity rules, narrative point of view, response detail, realism, and content-theme directives. The latest player message is explicitly authoritative when it conflicts with saved state.",
        badgeLabel: "SYSTEM CONTEXT",
        badgeClass: "context-injection",
        details: [],
      },
      {
        id: "llm-response-job-messages",
        title: "Response-job message assembly",
        summary:
          "Uses the authored response-job mode to compile recent provider history and render labeled final-user lanes for app controls, player text, current state, response detail, Retry, Continue, and source evidence. The legacy final-user renderer exists only as a fallback when no response job is supplied.",
        badgeLabel: "API CALL 1",
        badgeClass: "api-call",
        details: [],
      },
      {
        id: "llm-source-debug-evidence",
        title: "Source and review evidence",
        summary:
          "Builds source receipts, duplicate-source metrics, provider-section coverage, effective-field evidence, character-fact review summaries, knowledge-visibility facts, goal-exposure decisions, and the active-scene packet candidate. These structures are attached to the request only when debug tracing is enabled and do not become additional model-facing prompt text.",
        badgeLabel: "DEBUG EVIDENCE",
        badgeClass: "data-block",
        details: [],
      },
      {
        id: "llm-stream-transport",
        title: "Authenticated streaming transport",
        summary:
          "Obtains the current Supabase access token, applies a three-minute timeout, posts the normalized Responses request to the chat edge function, consumes SSE chunks, forwards only visible assistant deltas, captures backend debug and usage metadata, and turns content-filter, provider, HTTP, timeout, and session failures into distinct outcomes.",
        badgeLabel: "STREAMING",
        badgeClass: "integration",
        details: [{ label: "Edge Function", values: ["chat"], kind: "edges" }],
      },
      {
        id: "llm-call1-observability",
        title: "Call 1 telemetry and validation snapshot",
        summary:
          "Records request size, estimated and provider token usage, cost estimate, latency, transport settings, response status, and provider request count. It separately submits prompt-presence diagnostics for active admin test sessions without making telemetry success a requirement for the visible roleplay turn.",
        badgeLabel: "OBSERVABILITY",
        badgeClass: "data-block",
        details: [],
      },
      {
        id: "llm-character-brainstorm",
        title: "Legacy character brainstorm helper",
        summary:
          "Provides a small non-streaming character brainstorm call that asks for a five-field JSON object and returns an empty patch when transport or parsing fails. This helper is separate from the roleplay response-job path and still uses the explicit Chat Completions transport.",
        badgeLabel: "CREATOR HELPER",
        badgeClass: "api-call",
        details: [{ label: "Edge Function", values: ["chat"], kind: "edges" }],
      },
    ],
    reviewedSource: "Manual review of prompt sections, goal and state rendering, response-job/history compilation, source/debug evidence, authentication, request body, SSE parsing, telemetry, error classes, and brainstorm helper.",
  },
  {
    path: "/src/services/placeholder-name-guard.ts",
    header: serviceHeader,
    metric: "243 lines",
    metricDescription: "Deterministic replacement of generic generated character names.",
    description:
      "Finds placeholder names such as generic man, woman, stranger, guard, or role labels in generated side-character text and replaces each normalized placeholder consistently with a unique ordinary name. It selects a gendered or neutral name pool from the placeholder wording, avoids names already in the story, updates the requested text fields as one shared mapping, and can report whether unresolved placeholder patterns remain.",
    rows: [],
    reviewedSource: "Manual review of placeholder pattern groups, name-pool selection, uniqueness handling, shared replacement map, object-field normalization, and final detection.",
  },
  {
    path: "/src/services/roleplay-runtime-responses.behavior.test.ts",
    header: testHeader,
    metric: "846 lines",
    metricDescription: "Behavior tests for the browser-side Responses runtime contract.",
    description:
      "Runs generateRoleplayResponseStream with mocked authentication, fetch, telemetry, and debug callbacks. It verifies Responses request settings and SSE compatibility, response-job lane metadata, and separation of established-fact control text from the player-authored lane in the actual API Call 1 request body.",
    rows: [],
    reviewedSource: "Manual review of transport, debug-payload, lane-evidence, stream-output, and established-fact separation fixtures.",
  },
  {
    path: "/src/services/roleplay-runtime-responses.test.ts",
    header: testHeader,
    metric: "219 lines",
    metricDescription: "Cross-file source contracts for response-job modes and Responses transport.",
    description:
      "Checks that Normal Send, Retry, and Continue enter the shared collector with the correct first-class mode, stale guards protect committed output, rejected Retry text stays out of the live compatibility message, replaced generations remain debug evidence, the direct chat lane uses Responses, and unrelated creator helpers remain outside this transport migration.",
    rows: [],
    reviewedSource: "Manual review of all response-mode, stale-guard, retry-evidence, direct-transport, and out-of-scope helper assertions.",
  },
  {
    path: "/src/services/side-character-generator.test.ts",
    header: testHeader,
    metric: "63 lines",
    metricDescription: "Speaker-segmentation regression tests for generated roleplay text.",
    description:
      "Proves the parser removes leaked rendering separators, normalizes double-colon speaker tags, rejects pronoun-led and conjunction-bearing prose as character names, and still accepts valid title-cased multiword speaker names.",
    rows: [],
    reviewedSource: "Manual review of all five parseMessageSegments regression cases.",
  },
  {
    path: "/src/services/side-character-generator.ts",
    header: serviceHeader,
    metric: "537 lines",
    metricDescription: "Deterministic speaker parsing, character detection, and initial side-character creation.",
    description:
      "Processes completed roleplay text into speaker-tagged message segments and identifies genuinely new named participants. It resolves known names and nicknames, blocks obvious prose and system labels from becoming characters, prevents alias duplicates, extracts a small set of visible physical traits, creates a default SideCharacter record, and selects cast members relevant to recent conversation context.",
    rows: [
      {
        id: "side-character-speaker-parser",
        title: "Speaker-block parsing",
        summary:
          "Removes scene/update control tags and leaked writer separators, repairs malformed double colons, splits paragraphs by valid CharacterName tags, leaves untagged narration unassigned, and merges consecutive blocks from the same speaker for display.",
        badgeLabel: "MESSAGE PARSER",
        badgeClass: "code-logic",
        details: [],
      },
      {
        id: "side-character-detection",
        title: "New-character detection and alias defense",
        summary:
          "Compares speaker tags with main names, side-character names, nicknames, common false positives, and prefix-based aliases so one participant does not acquire duplicate cards under shortened or alternate names.",
        badgeLabel: "IDENTITY",
        badgeClass: "code-logic",
        details: [],
      },
      {
        id: "side-character-initial-record",
        title: "Initial side-character record",
        summary:
          "Creates an AI-controlled SideCharacter with Chronicle identity and timestamps, records the first conversation where it appeared, applies default domain sections, and seeds only physical traits that can be extracted deterministically from the character's dialog context.",
        badgeLabel: "DOMAIN RECORD",
        badgeClass: "data-block",
        details: [],
      },
      {
        id: "side-character-relevance",
        title: "Recent-context cast selection",
        summary:
          "Always retains main characters and adds side participants whose names appear in recent text. This helper reduces unrelated cast context for callers but does not decide the current scene roster used by API Call 1.",
        badgeLabel: "CONTEXT FILTER",
        badgeClass: "context-injection",
        details: [],
      },
    ],
    reviewedSource: "Manual review of name registries, paragraph parser, segment merge, trait patterns, record creation, alias detection, new-character filtering, and relevance selection.",
  },
  {
    path: "/src/services/support-call-hardening.test.ts",
    header: testHeader,
    metric: "99 lines",
    metricDescription: "Cross-function source contracts for post-turn support-call safety.",
    description:
      "Checks that support workers receive only the current goal milestone, ground character-state changes in the latest exchange, use durable-memory language and deterministic point cleanup, cap and normalize day summaries, sanitize schema-shaped side-character profiles, and ground scene-image analysis in established visible information.",
    rows: [],
    reviewedSource: "Manual review of all goal, character-state, memory, compression, side-character, and scene-analysis source assertions.",
  },
  {
    path: "/src/services/support-call-responses-migration.test.ts",
    header: testHeader,
    metric: "170 lines",
    metricDescription: "Transport and failure-contract tests for roleplay support workers.",
    description:
      "Verifies that core state workers use xAI Responses with store disabled, medium reasoning, JSON-schema output, bounded output tokens, and the same transport on focused retries. It also prevents malformed or failed Responses bodies from being treated as successful empty state, preserves out-of-scope creative helpers, and requires day-memory compression to appear in debug evidence.",
    rows: [],
    reviewedSource: "Manual review of all Responses settings, schema output, output cap, retry parity, failure handling, scope boundary, and debug-record assertions.",
  },
  {
    path: "/src/services/support-edge-rate-limits.test.ts",
    header: testHeader,
    metric: "62 lines",
    metricDescription: "Source-contract coverage for authenticated support-worker rate limits.",
    description:
      "Checks that each covered AI support edge function identifies the authenticated user and applies the shared support-call rate-limit window and maximum before invoking a provider.",
    rows: [],
    reviewedSource: "Manual review of the covered support-function list and per-function ingress assertions.",
  },
  {
    path: "/src/services/world-ai.ts",
    header: serviceHeader,
    metric: "439 lines",
    metricDescription: "Story Builder field enhancement with full scenario grounding.",
    description:
      "Owns AI enhancement for Story Builder world fields, custom rows, story goals, and arc-phase outcomes. It compiles current world content, opening dialog, content-theme directives, locations, lore, goals, and character summaries; produces precise, detailed, or generated label-plus-description prompts; invokes the non-streaming chat helper; and returns text for the calling editor to apply.",
    rows: [
      {
        id: "world-ai-scenario-context",
        title: "World and cast grounding",
        summary:
          "Builds one source context from canonical world fields, structured locations, custom sections, goals, opening timing, lore entries, content-theme directives, and concise character summaries so a single-row enhancement stays connected to the whole story.",
        badgeLabel: "PROMPT CONTEXT",
        badgeClass: "context-injection",
        details: [],
      },
      {
        id: "world-ai-enhance-modes",
        title: "Precise, detailed, and generate-both modes",
        summary:
          "Uses a field-specific instruction registry. Precise mode returns semicolon-separated facts, detailed mode returns concise narrative-relevant text, and generate-both mode returns a separately parsed label and description for an empty structured row.",
        badgeLabel: "FIELD ENHANCE",
        badgeClass: "code-logic",
        details: [],
      },
      {
        id: "world-ai-transport",
        title: "Creator-assistance request",
        summary:
          "Records nonblocking usage and prompt-presence diagnostics, invokes the chat edge function with the explicit Chat Completions helper transport, normalizes supported response-body shapes, and surfaces transport or empty-response failures to the editor.",
        badgeLabel: "SINGLE CALL",
        badgeClass: "api-call",
        details: [{ label: "Edge Function", values: ["chat"], kind: "edges" }],
      },
    ],
    reviewedSource: "Manual review of supported fields, context builder, all prompt modes, validation telemetry, chat invocation, response normalization, and post-processing.",
  },
  {
    path: "/src/services/xai-responses-adapter.test.ts",
    header: testHeader,
    metric: "320 lines",
    metricDescription: "Unit tests for the shared xAI Responses adapter contract.",
    description:
      "Covers normalization of browser messages into a Responses request, default store and reasoning settings, JSON-schema conversion to text.format, provider fetch behavior, visible-text extraction without reasoning leakage, non-stream body failures, and normalization of streaming text, reasoning, completion, and error events.",
    rows: [],
    reviewedSource: "Manual review of request construction, defaults, schema mapping, HTTP call, visible-output extraction, body failure, and stream event fixtures.",
  },
]);
