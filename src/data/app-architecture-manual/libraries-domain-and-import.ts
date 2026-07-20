import { defineManualArchitectureFiles } from "./types";

const codeHeader = {
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

export const domainAndImportLibraryArchitectureFiles = defineManualArchitectureFiles([
  {
    path: "/src/lib/assistant-style-directive.test.ts",
    header: testHeader,
    metric: "132 lines",
    metricDescription: "Regression tests for assistant-output style diagnostics.",
    description:
      "Proves style analysis compares assistant responses with prior assistant responses rather than the latest player message, stays inactive with insufficient history, and reports narration dominance, repeated wording, repeated cadence, offloading questions, and detailed-response collapse as diagnostic fields without generating hidden retry instructions.",
    rows: [],
    reviewedSource: "Manual review of every history, narration, repetition, cadence, question, and detail-collapse fixture.",
  },
  {
    path: "/src/lib/assistant-style-directive.ts",
    header: codeHeader,
    metric: "589 lines",
    metricDescription: "Local diagnostic analysis of visible assistant response style.",
    description:
      "Analyzes completed assistant text and recent assistant history for observable response-shape problems such as repeated openings, repeated descriptive or topic terms, near-duplicate phrasing, recurring action/dialogue/thought cadence, narration-heavy output, vague offloading questions, and response-detail collapse. It returns telemetry and review snippets only; it does not modify the visible response, create a prompt directive, or trigger another provider call.",
    rows: [
      {
        id: "assistant-style-history-analysis",
        title: "Recent assistant-history comparison",
        summary:
          "Extracts comparable assistant blocks, tokens, content terms, openings, and cadence markers, then measures repetition only when enough assistant history exists to support the comparison.",
        badgeLabel: "HISTORY ANALYSIS",
        badgeClass: "code-logic",
        details: [],
      },
      {
        id: "assistant-style-candidate-analysis",
        title: "Current response diagnostics",
        summary:
          "Measures visible dialogue versus narration, candidate phrase reuse, repetitive structure, unhelpful questions, and requested detail level, returning flags, counts, ratios, excerpts, and reasons for debug export.",
        badgeLabel: "STYLE TELEMETRY",
        badgeClass: "data-block",
        details: [],
      },
    ],
    reviewedSource: "Manual review of tokenization, speaker-block parsing, term and phrase comparison, cadence analysis, dialogue ratios, offloading-question rules, flag derivation, and telemetry output.",
  },
  {
    path: "/src/lib/canonical-field-registry.test.ts",
    header: testHeader,
    metric: "65 lines",
    metricDescription: "Idempotence and backfill tests for canonical world fields.",
    description:
      "Checks that older world-core shapes normalize into the current canonical fields without losing authored custom sections, that genuinely different stored rows request a backfill, and that running the migration repeatedly produces the same result.",
    rows: [],
    reviewedSource: "Manual review of normalization, backfill detection, custom-section preservation, and idempotence fixtures.",
  },
  {
    path: "/src/lib/canonical-field-registry.ts",
    header: codeHeader,
    metric: "271 lines",
    metricDescription: "Canonical world and character field vocabulary shared by storage and prompts.",
    description:
      "Defines Chronicle's supported world-core fields, character identity fields, and structured character section keys. It migrates legacy world keys into the current WorldCore shape, reports whether a stored row needs backfill, applies the same normalization to ScenarioData, and converts a Character into labeled canonical prompt sections without treating unknown fields as supported runtime state.",
    rows: [],
    reviewedSource: "Manual review of field registries, legacy key aliases, world migration, scenario migration, backfill comparison, and character prompt-section mapping.",
  },
  {
    path: "/src/lib/chat-spellcheck.test.ts",
    header: testHeader,
    metric: "146 lines",
    metricDescription: "Dictionary, range, overlay, suggestion, and slang tests for chat spellcheck.",
    description:
      "Verifies Chronicle and story-specific allowlisted names, word-only misspelling ranges, clickable overlay segmentation, bounded spelling suggestions, common inflections, expected chat profanity and slang, and ordinary scene prose that should not be over-flagged.",
    rows: [],
    reviewedSource: "Manual review of all dictionary, token, overlay, suggestion, inflection, slang, and prose fixtures.",
  },
  {
    path: "/src/lib/chat-spellcheck.ts",
    header: codeHeader,
    metric: "507 lines",
    metricDescription: "Client-side chat spelling dictionary and overlay analysis.",
    description:
      "Loads the public English word list once, supplements it with common chat words and an allowlist derived from current story names and terms, normalizes apostrophes and inflected forms, finds misspelled word ranges without altering the message, divides text into overlay segments, and ranks up to five close dictionary suggestions using bounded edit distance.",
    rows: [
      {
        id: "spellcheck-dictionary",
        title: "Dictionary and allowlist",
        summary:
          "Fetches the checked-in word list, caches the parsed set, accepts Chronicle's built-in conversational vocabulary, and adds current story-specific names supplied by the composer.",
        badgeLabel: "DICTIONARY",
        badgeClass: "data-block",
        details: [{ label: "Public Asset", values: ["/spellcheck/en-words.txt"], kind: "files" }],
      },
      {
        id: "spellcheck-analysis",
        title: "Non-destructive typo analysis",
        summary:
          "Identifies word ranges and overlay spans while preserving punctuation and original text, recognizes common inflected variants, and ranks suggestions without automatically replacing what the player typed.",
        badgeLabel: "TEXT ANALYSIS",
        badgeClass: "code-logic",
        details: [],
      },
    ],
    reviewedSource: "Manual review of word tokenization, built-in vocabulary, irregular and regular inflections, dictionary loading, correctness rules, ranges, overlays, edit-distance suggestions, and story allowlist.",
  },
  {
    path: "/src/lib/docx-import.test.ts",
    header: testHeader,
    metric: "124 lines",
    metricDescription: "DOCX extraction and import-size hardening tests.",
    description:
      "Checks ordinary Word paragraph extraction and every import limit: compressed file bytes, decompressed document XML, paragraph count, extracted text length, and early file-size rejection before expensive array-buffer or fallback-text reads.",
    rows: [],
    reviewedSource: "Manual review of normal extraction plus compressed, expanded, paragraph, output, and pre-read size rejection fixtures.",
  },
  {
    path: "/src/lib/docx-import.ts",
    header: codeHeader,
    metric: "293 lines",
    metricDescription: "Bounded plain-text extraction from Word and other story-import files.",
    description:
      "Reads DOCX as a ZIP, locates word/document.xml, converts Word paragraphs, tabs, breaks, and escaped entities into plain text, and enforces independent compressed-byte, decompressed-XML, paragraph, and output-character limits. The public file reader chooses DOCX extraction or bounded text reading from the supplied filename and MIME type and returns warnings and document metadata to the story importer.",
    rows: [
      {
        id: "docx-import-limits",
        title: "Import resource limits",
        summary:
          "Rejects oversized input before decompression and independently caps expanded XML, paragraph count, and extracted text so a small compressed archive cannot cause unbounded browser memory or parsing work.",
        badgeLabel: "FILE SAFETY",
        badgeClass: "code-logic",
        details: [],
        security: true,
      },
      {
        id: "docx-import-extraction",
        title: "Word paragraph extraction",
        summary:
          "Parses only the main Word document XML, reconstructs paragraph text with supported tabs and line breaks, decodes XML entities, removes empty runs, and returns plain text suitable for Chronicle's story-transfer parser.",
        badgeLabel: "DOCX PARSER",
        badgeClass: "code-logic",
        details: [],
      },
    ],
    reviewedSource: "Manual review of size constants and errors, ZIP entry checks, XML parsing, paragraph extraction, output bounds, file-type detection, and returned metadata.",
  },
  {
    path: "/src/lib/goal-alignment.test.ts",
    header: testHeader,
    metric: "188 lines",
    metricDescription: "Scoring, lifecycle, rollback, and prompt-visibility tests for goal alignment.",
    description:
      "Proves flexibility-sensitive score changes, resistance and drift thresholds, nonmovement on neutral evidence, dropped-goal hiding, user-supported revival for non-rigid goals, preservation of prior cumulative state for Retry rollback, and concise writer-facing alignment guidance.",
    rows: [],
    reviewedSource: "Manual review of all score, status, counter, rollback, revival, visibility, and prompt-description fixtures.",
  },
  {
    path: "/src/lib/goal-alignment.ts",
    header: codeHeader,
    metric: "259 lines",
    metricDescription: "Deterministic cumulative alignment state for story and character goals.",
    description:
      "Creates stable goal-scope identities, normalizes missing alignment state, and applies one reviewed support, resistance, drift, neutral, or not-applicable evaluation to the cumulative score and counters. Flexibility changes score sensitivity and drop thresholds; dropped non-rigid goals may later revive from strong user support; and every applied evaluation retains the previous state plus source message and generation identity for Retry-safe rollback and review.",
    rows: [
      {
        id: "goal-alignment-transition",
        title: "Alignment state transition",
        summary:
          "Transforms a prior score and counters using one source-backed evaluation, clamps values, derives active, drifting, or dropped status, records trend and rationale, and saves the full prior snapshot before changing the state.",
        badgeLabel: "STATE MACHINE",
        badgeClass: "code-logic",
        details: [],
      },
      {
        id: "goal-alignment-writer-visibility",
        title: "Writer-facing goal visibility",
        summary:
          "Prevents dropped goals from reaching API Call 1 and converts active alignment state into a short background-direction explanation rather than exposing internal scoring mechanics to the roleplay model.",
        badgeLabel: "PROMPT POLICY",
        badgeClass: "context-injection",
        details: [],
      },
    ],
    reviewedSource: "Manual review of identity keys, normalization, signal deltas, thresholds, status transitions, rollback snapshots, writer visibility, and review formatting.",
  },
  {
    path: "/src/lib/goal-state-guard.test.ts",
    header: testHeader,
    metric: "27 lines",
    metricDescription: "Regression tests for extractor goal-update parsing.",
    description:
      "Checks that new_steps and other extractor control fields cannot be mistaken for current goal status and that short immediate scene actions are recognized as task-level text while durable progress descriptions remain eligible state.",
    rows: [],
    reviewedSource: "Manual review of control-field separation and task-versus-durable text fixtures.",
  },
  {
    path: "/src/lib/goal-state-guard.ts",
    header: codeHeader,
    metric: "82 lines",
    metricDescription: "Safety parser for mixed-shape goal updates returned by extraction workers.",
    description:
      "Separates a goal's durable current-status text from completion flags, newly suggested steps, and other control keys when worker output arrives in inconsistent string, array, or object shapes. It also detects short action-level instructions that should not be persisted as long-term goal status.",
    rows: [],
    reviewedSource: "Manual review of accepted input shapes, control-key filtering, current-status extraction, new-step parsing, and task-level language rules.",
  },
  {
    path: "/src/lib/story-transfer.test.ts",
    header: testHeader,
    metric: "495 lines",
    metricDescription: "Round-trip and normalization coverage for Chronicle story transfer.",
    description:
      "Tests Markdown and Word exports, merge and rewrite imports, JSON package round trips, private scene path preservation, removed UI-setting cleanup, unsupported machine-character-field removal, conversation omission from default exports, and label-only custom rows surviving a Markdown round trip.",
    rows: [],
    reviewedSource: "Manual review of every text, Word, JSON, merge, rewrite, media, settings, character-field, conversation, and label-only-row fixture.",
  },
  {
    path: "/src/lib/story-transfer.ts",
    header: codeHeader,
    metric: "2,754 lines",
    metricDescription: "Canonical Chronicle story export, parsing, normalization, and merge engine.",
    description:
      "Converts ScenarioData into human-readable Markdown, machine-readable JSON, or an RTF Word document and imports text, HTML, RTF, DOCX-extracted text, Chronicle machine packages, and raw scenario JSON back into the editor. It preserves supported story, world, character, content-theme, scene, media-path, and optional editor-state fields while normalizing obsolete or unknown machine fields out of active domain state and keeping conversations excluded unless explicitly requested.",
    rows: [
      {
        id: "story-transfer-normalization",
        title: "Supported transfer shape",
        summary:
          "Builds clean main- and side-character copies, normalizes custom rows and sections, sanitizes UI settings, preserves durable private scene paths, and removes unsupported machine fields before either export or import can place them in ScenarioData.",
        badgeLabel: "NORMALIZATION",
        badgeClass: "code-logic",
        details: [],
      },
      {
        id: "story-transfer-exports",
        title: "Markdown, JSON, and Word exports",
        summary:
          "Writes the same canonical story sections across human-readable text and RTF, embeds a delimited machine package for lossless Chronicle re-import, and supports JSON with optional cover/editor-state/conversation inclusion controlled by the caller.",
        badgeLabel: "EXPORT",
        badgeClass: "documentation",
        details: [],
      },
      {
        id: "story-transfer-text-parser",
        title: "Human-readable text parser",
        summary:
          "Recognizes Chronicle headings and labeled rows, reconstructs world sections, characters, goals, scenes, content themes, and dialog settings, tracks skipped lines and warnings, and falls back to a plain story premise only when no structured Chronicle content can be recovered.",
        badgeLabel: "TEXT IMPORT",
        badgeClass: "code-logic",
        details: [],
      },
      {
        id: "story-transfer-merge",
        title: "Merge and rewrite behavior",
        summary:
          "Merge mode preserves populated scalar values and appends unique rich rows, sections, tags, scenes, and entries; rewrite mode replaces supported imported values. Both modes preserve Chronicle IDs where appropriate and create new IDs for newly imported rows.",
        badgeLabel: "IMPORT POLICY",
        badgeClass: "code-logic",
        details: [],
      },
      {
        id: "story-transfer-any",
        title: "Format selection and result reporting",
        summary:
          "Detects Chronicle packages, raw ScenarioData, JSON payloads, HTML, RTF, and plain text, selects the appropriate parser, applies the requested import mode, and returns the updated scenario with counts, warnings, skipped-line information, and imported editor metadata.",
        badgeLabel: "IMPORT ROUTER",
        badgeClass: "code-logic",
        details: [],
      },
    ],
    reviewedSource: "Manual review of transfer contracts, normalization, all export builders, machine payloads, text parsing, section and row merging, goal and character application, media paths, format detection, and result summaries.",
  },
  {
    path: "/src/lib/utils.ts",
    header: codeHeader,
    metric: "6 lines",
    metricDescription: "Tailwind-aware CSS class composition helper.",
    description:
      "Exports the shared cn helper used by shadcn-style components to combine conditional class values with clsx and resolve conflicting Tailwind utilities through tailwind-merge.",
    rows: [],
    reviewedSource: "Manual review of the single class-composition function and both dependencies.",
  },
]);
