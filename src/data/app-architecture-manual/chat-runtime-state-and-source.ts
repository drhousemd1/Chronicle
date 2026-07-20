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

export const chatRuntimeStateAndSourceArchitectureFiles = defineManualArchitectureFiles([
  {
    path: "/src/features/chat-runtime/effective-state.ts",
    header: codeLogicHeader,
    metric: "500 lines",
    metricDescription: "Generation-safe reconstruction of the roleplay state used by the current turn.",
    description:
      "Builds effective world, goal, memory, character, and side-character state from base scenario data plus message-derived updates. It validates every derived record against the active message-generation map, preserves older valid snapshots through paginated transcript loading by using the full identity index, excludes deleted or superseded generations, and emits pruning reports explaining every inclusion or rejection.",
    rows: [
      {
        id: "effective-state-generation-selection",
        title: "Generation ownership and pruning",
        summary:
          "Uses message ID plus generation ID to prevent replaced assistant output from continuing to influence memory, goals, or snapshots while preserving manual and legacy records that have no generation lineage.",
        badgeLabel: "LINEAGE",
        badgeClass: "code-logic",
        details: [
          { label: "Inputs", values: ["full conversation identity index", "newly loaded messages", "message-derived records with source IDs and generation IDs"], kind: "plain" },
          { label: "Pruning Reasons", values: ["current generation", "stale generation", "deleted source message", "manual or legacy without generation"], kind: "plain" },
          { label: "Evidence", values: ["EffectiveStatePruningReport rows retain item type, source identity, inclusion, reason, and value preview"], kind: "plain" },
        ],
      },
      {
        id: "effective-state-world-goals-memory",
        title: "World, goal, and memory reconstruction",
        summary:
          "Applies active world overrides and visible-generation goal completions, alignment states, and memories without mutating the saved scenario core.",
        badgeLabel: "EFFECTIVE STATE",
        badgeClass: "data-block",
        details: [
          { label: "Outputs", values: ["effective WorldCore", "active goal completion IDs", "active goal-alignment map", "active memories plus pruning evidence"], kind: "plain" },
          { label: "Boundary", values: ["selection does not write to Supabase and does not alter historical source rows"], kind: "plain" },
        ],
      },
      {
        id: "effective-state-character-snapshots",
        title: "Character snapshot selection and application",
        summary:
          "Selects the latest valid main- and side-character snapshot by full message chronology, supports immutable upserts, and applies mutable state fields while protecting base identity and fallback values.",
        badgeLabel: "SNAPSHOTS",
        badgeClass: "data-block",
        details: [
          { label: "Main Character", values: ["latest valid CharacterStateMessageSnapshot per character"], kind: "plain" },
          { label: "Side Character", values: ["latest valid SideCharacterStateMessageSnapshot per side character"], kind: "plain" },
          { label: "Pagination Guard", values: ["a snapshot remains valid when its source body is outside the latest loaded message window but its identity remains in the full index"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of generation maps, identity-index merging, goal/memory filters, pruning reports, effective-world assembly, snapshot selection/upsert, and snapshot application.",
  },
  {
    path: "/src/features/chat-runtime/effective-state.test.ts",
    header: testHeader,
    metric: "636 lines",
    metricDescription: "Regression coverage for effective-state lineage, pagination, and snapshot application.",
    description:
      "Covers identity-index chronology, stale and deleted generation exclusion, goal and memory filtering, alignment fallback, world overrides, main and side snapshot selection, old valid snapshots outside the 30-message window, immutable upserts, protected fields, Retry-style generation replacement, and pruning-report truthfulness.",
    rows: [],
    reviewedSource: "Manual review of all eleven effective-state test cases.",
  },
  {
    path: "/src/features/chat-runtime/roleplay-character-card-facts.ts",
    header: codeLogicHeader,
    metric: "2,315 lines",
    metricDescription: "Policy compiler for character-card data entering API Call 1.",
    description:
      "Converts main- and side-character records into field-level CharacterPromptFact rows with explicit runtime use, authority, relevance, visibility, wording policy, model-facing disposition, and reason. It renders only permitted compact reference facts, suppresses exact duplicates, keeps mutable state and goals under their dedicated owners, and produces debug metrics for source duplication and suspicious verbatim copying in assistant output.",
    rows: [
      {
        id: "character-card-fact-compilation",
        title: "Field-level card policy",
        summary:
          "Classifies identity, description, voice, relationship, private, mutable, goal, and metadata fields instead of dumping the saved character object into the prompt.",
        badgeLabel: "CARD POLICY",
        badgeClass: "context-injection",
        details: [
          { label: "Included Owners", values: ["durable identity", "compact creator reference", "voice guidance", "relationship reference when permitted"], kind: "plain" },
          { label: "Delegated Owners", values: ["current state to effective-state/scene owners", "live goals to goal selector", "private facts to visibility policy", "metadata to debug only"], kind: "plain" },
          { label: "Wording", values: ["source values remain unchanged", "only the model-facing copy is compacted", "creator prose is not sanitized in storage"], kind: "plain" },
        ],
      },
      {
        id: "character-card-fact-rendering-review",
        title: "Rendering, deduplication, and copy review",
        summary:
          "Selects model-facing facts, suppresses normalized duplicate values, renders policy-grouped rows, and measures exact phrase or creator-label reuse in captured output without changing the response.",
        badgeLabel: "REVIEW EVIDENCE",
        badgeClass: "code-logic",
        details: [
          { label: "Outputs", values: ["compact provider text", "duplicate groups", "fact disposition totals", "output-copy metrics"], kind: "plain" },
          { label: "Negative Guarantee", values: ["copy metrics are diagnostic evidence, not automatic proof of causation or a response rewrite"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of fact vocabularies, all field append policies, selection and duplicate suppression, rendering, review summaries, and captured-output copy metrics.",
  },
  {
    path: "/src/features/chat-runtime/roleplay-character-card-facts.test.ts",
    header: testHeader,
    metric: "2,097 lines",
    metricDescription: "Regression coverage for character-card policy, rendering, and copy diagnostics.",
    description:
      "Verifies traceable fact creation, source-value preservation, field classification, exclusion of mutable/private/goal/metadata fields, compact rendering, duplicate suppression, duplicate-source summaries, and exact raw phrase or creator-label copy detection.",
    rows: [],
    reviewedSource: "Manual review of all character-card fact test cases.",
  },
  {
    path: "/src/features/chat-runtime/roleplay-knowledge-visibility.ts",
    header: codeLogicHeader,
    metric: "389 lines",
    metricDescription: "Availability and disposition policy for character knowledge and visible scene facts.",
    description:
      "Defines the KnowledgeVisibilityFact contract used to explain where a fact came from, who may know it, whether it is current, and whether it is included, withheld, downgraded, or debug-only. It converts resolved scene state, character-card facts, structured story references, and accepted support outputs into inspectable decisions without inventing observer graphs or promoting stored references into automatic character knowledge.",
    rows: [
      {
        id: "knowledge-visibility-current-scene",
        title: "Resolved current-scene facts",
        summary:
          "Includes current location, scene position, and visible clothing from effective state, while withholding temporary conditions that lack explicit observability evidence.",
        badgeLabel: "CURRENT SCENE",
        badgeClass: "context-injection",
        details: [],
      },
      {
        id: "knowledge-visibility-reference-policy",
        title: "Card and story reference classification",
        summary:
          "Keeps established identity available, routes private facts and goals to their dedicated owners, withholds stale saved state, and downgrades structured story references rather than claiming every character knows them.",
        badgeLabel: "REFERENCE POLICY",
        badgeClass: "code-logic",
        details: [],
      },
      {
        id: "knowledge-visibility-support-output",
        title: "Support-output classification",
        summary:
          "Treats persisted support memory as writer reference, keeps goal and debug output under their own owners, and leaves rejected or omitted candidates visible only as debug evidence.",
        badgeLabel: "SUPPORT REVIEW",
        badgeClass: "code-logic",
        details: [],
      },
    ],
    reviewedSource: "Manual review of source, availability, and disposition vocabularies plus current-scene, card, structured-source, and support-envelope classifiers.",
  },
  {
    path: "/src/features/chat-runtime/roleplay-knowledge-visibility.test.ts",
    header: testHeader,
    metric: "367 lines",
    metricDescription: "Regression coverage for visibility and character-knowledge boundaries.",
    description:
      "Locks the policy vocabularies and verifies immutable facts, current visible state, concealed clothing, stable creator references, withheld private/goal/stale state, conservative structured-story handling, and the rule that accepted support output does not automatically become character knowledge.",
    rows: [],
    reviewedSource: "Manual review of all ten KnowledgeVisibilityFact test cases.",
  },
  {
    path: "/src/features/chat-runtime/roleplay-goal-selector.ts",
    header: codeLogicHeader,
    metric: "837 lines",
    metricDescription: "Turn-local selection and rendering policy for story goals.",
    description:
      "Evaluates writer-visible goals against the current user turn and recent context, assigns each goal to active, background, or hidden-this-turn, and records deterministic evidence terms and reasons. It renders active goals fully, background goals compactly, hidden goals only in debug evidence, and uses the same decision contract for Normal Send, Retry, and Continue.",
    rows: [],
    reviewedSource: "Manual review of term normalization, goal evidence, flexibility, alignment visibility, tier decisions, receipt hashing, rendered prompt output, and debug exposure decisions.",
  },
  {
    path: "/src/features/chat-runtime/roleplay-goal-selector.test.ts",
    header: testHeader,
    metric: "758 lines",
    metricDescription: "Regression coverage for goal exposure tiers and mode consistency.",
    description:
      "Verifies deterministic active, background, and hidden decisions; identical exposure rules across all response modes; and full, compact, or omitted rendering for the respective tiers.",
    rows: [],
    reviewedSource: "Manual review of all three goal-selector fixtures.",
  },
  {
    path: "/src/features/chat-runtime/roleplay-recent-history.ts",
    header: codeLogicHeader,
    metric: "401 lines",
    metricDescription: "Mode-aware compiler for the provider's recent conversation history.",
    description:
      "Transforms saved conversation messages into the recent-history packet consumed by API Call 1. It prevents the active player turn and Continue anchor from appearing twice, excludes rejected Retry attempts, keeps exact accepted continuity where appropriate, suppresses repeated style anchors, and creates older assistant outcome summaries only from generation-matched source-authority decisions.",
    rows: [
      {
        id: "recent-history-mode-policy",
        title: "Response-mode history policy",
        summary:
          "Coordinates provider history with the higher-authority response-job lanes so Normal Send, Retry, and Continue each receive the correct conversation slice without duplicate active text.",
        badgeLabel: "HISTORY POLICY",
        badgeClass: "code-logic",
        details: [
          { label: "Normal Send", values: ["active player turn is represented by the response-job lane rather than repeated in provider history"], kind: "plain" },
          { label: "Retry", values: ["rejected generation is excluded and recorded as a suppressed style anchor"], kind: "plain" },
          { label: "Continue", values: ["accepted assistant tail is represented by continue_anchor rather than repeated as an ordinary history message"], kind: "plain" },
        ],
      },
      {
        id: "recent-history-assistant-shaping",
        title: "Accepted assistant history shaping",
        summary:
          "Keeps the latest accepted assistant continuity exact, removes repeated long fragments from older accepted history, and uses a structured outcome summary only when matching authority evidence supports it.",
        badgeLabel: "HISTORY SHAPING",
        badgeClass: "code-logic",
        details: [
          { label: "Receipts", values: ["message and generation identity", "source lane", "treatment", "provider inclusion", "reason", "suppressed anchor evidence", "authority classes used"], kind: "plain" },
          { label: "Negative Guarantee", values: ["no safe matched authority decision means no outcome_summary claim"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of history normalization, repeated-anchor detection, structured outcome summaries, response-job source matching, provider-message construction, and all receipt treatments.",
  },
  {
    path: "/src/features/chat-runtime/roleplay-recent-history.test.ts",
    header: testHeader,
    metric: "480 lines",
    metricDescription: "Regression coverage for recent-history authority and mode behavior.",
    description:
      "Covers active-player deduplication, same-ID text changes, exact user and latest-assistant continuity, generation-matched outcome summaries, safe fallback when authority evidence is absent, Retry rejection exclusion, preservation of accepted history beside a rejected attempt, and Continue-anchor deduplication.",
    rows: [],
    reviewedSource: "Manual review of all recent-history fixtures and receipt assertions.",
  },
  {
    path: "/src/features/chat-runtime/roleplay-source-receipts.ts",
    header: codeLogicHeader,
    metric: "1,119 lines",
    metricDescription: "Source inventory, duplication evidence, and provider-coverage audit for API Call 1.",
    description:
      "Creates one RoleplaySourceReceipt for each relevant system section, response-job lane, recent-history item, execution brief, and debug-only browser context. Each receipt identifies source surface, authority, text hash, disposition, model-facing status, and reason; companion checks measure exact duplication and confirm that every included receipt appears in the provider messages and every provider section has receipt ownership.",
    rows: [
      {
        id: "source-receipt-inventory",
        title: "Source receipt construction",
        summary:
          "Maps rendered prompt sections, final-user lanes, history treatments, controls, and debug context into one stable evidence vocabulary without changing any prompt content.",
        badgeLabel: "SOURCE RECEIPTS",
        badgeClass: "data-block",
        details: [
          { label: "Identity", values: ["receipt ID", "source surface and source ID", "authority", "content hash and preview", "disposition", "model-facing flag", "reason"], kind: "plain" },
          { label: "Owners Covered", values: ["roleplay core", "dialog and style rules", "character facts", "current state", "story and goals", "history", "response-job lanes", "execution brief", "debug-only context"], kind: "plain" },
        ],
      },
      {
        id: "source-receipt-coverage",
        title: "Duplicate and provider coverage checks",
        summary:
          "Groups exact normalized copies and compares receipts with literal provider messages in both directions so missing prompt evidence and unowned provider sections remain visible.",
        badgeLabel: "COVERAGE",
        badgeClass: "code-logic",
        details: [
          { label: "Receipt Coverage", values: ["included receipt found in provider messages", "missing receipt text", "debug-only receipt not required"], kind: "plain" },
          { label: "Provider Coverage", values: ["provider section matched to a receipt and expected source surface", "unmatched or mismatched section"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of source vocabularies, receipt hashing, system-section parsing, lane/history receipt creation, duplicate groups, and bidirectional provider coverage.",
  },
  {
    path: "/src/features/chat-runtime/roleplay-source-receipts.test.ts",
    header: testHeader,
    metric: "464 lines",
    metricDescription: "Regression coverage for source receipts, duplicate groups, and provider coverage.",
    description:
      "Verifies stable receipt construction and exact-text duplicate grouping, complete coverage across rendered sections/history/lanes/controls/debug context, and explicit failures for both receipt-only and provider-section-only gaps.",
    rows: [],
    reviewedSource: "Manual review of all RoleplaySourceReceipt tests.",
  },
  {
    path: "/src/features/chat-runtime/roleplay-source-shaping.ts",
    header: codeLogicHeader,
    metric: "663 lines",
    metricDescription: "Debug evidence for effective fields, prompt pressure, and a possible active-scene packet.",
    description:
      "Combines existing scene-roster, character-fact, user-authority, response-job, and receipt owners into field-level treatment evidence and source-budget summaries. It can create a debug-only active-scene packet candidate that drops lower-authority duplicates, but it does not replace the full prompt or introduce a second state-selection policy.",
    rows: [
      {
        id: "source-shaping-field-evidence",
        title: "Effective field evidence",
        summary:
          "Explains why roster locations and positions, character facts, and user-state decisions were selected, transformed, suppressed, downgraded, or kept debug-only.",
        badgeLabel: "FIELD EVIDENCE",
        badgeClass: "data-block",
        details: [],
      },
      {
        id: "source-shaping-budget-candidate",
        title: "Source-pressure summary and candidate packet",
        summary:
          "Measures included, suppressed, transformed, and duplicate source pressure, then records which receipts a hypothetical compact packet would include or omit without changing runtime prompt construction.",
        badgeLabel: "DEBUG ONLY",
        badgeClass: "code-logic",
        details: [
          { label: "Negative Guarantee", values: ["the candidate does not alter response-job mode, lanes, or full prompt rendering"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of field treatments, authority weighting, budget summary, active-scene candidate selection, duplicate omission, and receipt linking.",
  },
  {
    path: "/src/features/chat-runtime/roleplay-source-shaping.test.ts",
    header: testHeader,
    metric: "470 lines",
    metricDescription: "Regression coverage for non-mutating source-shaping evidence.",
    description:
      "Verifies field evidence from existing owners, duplicate-pressure summaries, a debug-only packet candidate that excludes lower-authority copies, and response-job receipt linking without changing modes or lanes.",
    rows: [],
    reviewedSource: "Manual review of all three source-shaping tests.",
  },
  {
    path: "/src/features/chat-runtime/roleplay-user-state-authority.ts",
    header: codeLogicHeader,
    metric: "281 lines",
    metricDescription: "Shared authority classifier for claims about the user-controlled character.",
    description:
      "Classifies user-state claims as raw user fact, accepted assistant observable change, assistant interpretation, or unsupported overreach. It uses source role, message and generation lineage, evidence basis, claim type, and intended use to decide whether a claim may be a prompt fact, an observation, an in-character interpretation, debug-only evidence, or rejected persistence.",
    rows: [
      {
        id: "user-state-authority-decision",
        title: "Claim authority and permitted use",
        summary:
          "Gives explicit user-authored state the highest authority, narrowly permits accepted visible bodily observations, preserves assistant interpretation only as interpretation, and fails closed on stale or unsupported claims.",
        badgeLabel: "AUTHORITY",
        badgeClass: "code-logic",
        details: [
          { label: "Prompt Projection", values: ["established facts", "observations", "character interpretations", "rejected/debug-only"], kind: "plain" },
          { label: "Persistence Boundary", values: ["assistant interpretations and unsupported overreach are rejected from persistence"], kind: "plain" },
          { label: "Debug Summary", values: ["selected, downgraded, rejected, and per-authority counts"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of authority and claim vocabularies, claim validation, assistant-generation checks, model-facing actions, prompt projection, and debug summary.",
  },
  {
    path: "/src/features/chat-runtime/roleplay-user-state-authority.test.ts",
    header: testHeader,
    metric: "358 lines",
    metricDescription: "Regression coverage for user-state authority and persistence boundaries.",
    description:
      "Locks the authority vocabulary and proves accepted visible observations, rejection of assistant-authored voluntary action, interpretation-only prompt handling, persistence rejection, stale-generation rejection, missing-lineage failure, and non-enforcing debug counts.",
    rows: [],
    reviewedSource: "Manual review of all six user-state authority test cases.",
  },
  {
    path: "/src/features/chat-runtime/roleplay-character-state-review.ts",
    header: codeLogicHeader,
    metric: "600 lines",
    metricDescription: "Reviewed contract between character-state extraction and persistence.",
    description:
      "Constrains post-turn character-state updates to the supported physical fields, determines which main and side characters were eligible for review, reconciles edge-accepted and rejected candidates with physical-state coverage, and exposes only reviewed persistence candidates. Separate apply receipts then record whether each candidate was inserted, skipped, stale, rejected, or failed.",
    rows: [
      {
        id: "character-state-review-eligibility",
        title: "Character review eligibility",
        summary:
          "Uses exact names, aliases, previous names, and explicit review context to record who was eligible without relying on pronoun-only inference.",
        badgeLabel: "ELIGIBILITY",
        badgeClass: "code-logic",
        details: [
          { label: "Evidence", values: ["character identity", "eligibility boolean", "reason", "matched name or alias", "source message and generation"], kind: "plain" },
        ],
      },
      {
        id: "character-state-review-contract",
        title: "Reviewed update contract",
        summary:
          "Accepts only supported location, scene-position, and visible-physical-state candidates with matching review coverage; preserves semantic rejections and unmatched candidates as diagnostic evidence.",
        badgeLabel: "REVIEW CONTRACT",
        badgeClass: "data-block",
        details: [
          { label: "Persistence Source", values: ["getRoleplayReviewedCharacterStatePersistenceCandidates output", "never raw worker updates"], kind: "plain" },
          { label: "Failure Policy", values: ["missing coverage fails closed", "ineligible and malformed candidates remain visible with reasons"], kind: "plain" },
        ],
      },
      {
        id: "character-state-apply-receipts",
        title: "Apply receipts",
        summary:
          "Records the terminal persistence outcome and destination for every reviewed candidate without equating worker acceptance with a successful write.",
        badgeLabel: "PERSISTENCE EVIDENCE",
        badgeClass: "data-block",
        details: [],
      },
    ],
    reviewedSource: "Manual review of supported fields, eligibility rules, candidate normalization, coverage reconciliation, persistence selection, and apply-receipt construction.",
  },
  {
    path: "/src/features/chat-runtime/roleplay-character-state-review.test.ts",
    header: testHeader,
    metric: "514 lines",
    metricDescription: "Unit coverage for reviewed character-state eligibility and persistence contracts.",
    description:
      "Verifies deterministic eligibility, previous-name matching, locked supported fields and outcomes, per-candidate receipts, accepted physical-state candidates, fail-closed missing coverage, and preserved diagnostic evidence for ineligible rows.",
    rows: [],
    reviewedSource: "Manual review of all character-state review unit tests.",
  },
  {
    path: "/src/features/chat-runtime/roleplay-character-state-runtime-wiring.test.ts",
    header: testHeader,
    metric: "99 lines",
    metricDescription: "Source-level checks for the reviewed character-state persistence path.",
    description:
      "Confirms the chat runtime builds the reviewed contract before selecting persistence candidates, never writes raw worker updates, records eligibility and missing-review evidence, emits terminal apply receipts, cleans rows from stale generations, and patches receipt evidence into the existing support debug record.",
    rows: [],
    reviewedSource: "Manual review of all runtime-wiring assertions against ChatInterfaceTab and its persistence helpers.",
  },
  {
    path: "/src/features/chat-runtime/roleplay-memory-user-state-review.ts",
    header: codeLogicHeader,
    metric: "667 lines",
    metricDescription: "Durability, provenance, and user-state review for memory extraction.",
    description:
      "Parses the structured MemoryExtractionResponseV1 contract and reviews every candidate before persistence. It requires a supported durability category, source classification, exact evidence, source message and generation, user-character identity when relevant, and the shared user-state authority decision; semantic rejections, duplicates, malformed rows, stale evidence, and orphaned authority reviews remain separately visible.",
    rows: [
      {
        id: "memory-candidate-taxonomy",
        title: "Memory candidate taxonomy",
        summary:
          "Separates durable relationship, behavior, status, preference, world, and interaction information from temporary scene state, static descriptors, unsupported interpretation, and other non-memory output.",
        badgeLabel: "MEMORY POLICY",
        badgeClass: "data-block",
        details: [
          { label: "Accepted Inputs Require", values: ["accepted decision", "durable category", "safe source classification", "evidence and reason", "source role and identity"], kind: "plain" },
          { label: "Separate Outcomes", values: ["accepted events", "rejected candidate reviews", "omitted duplicates or orphaned reviews"], kind: "plain" },
        ],
      },
      {
        id: "memory-source-authority-review",
        title: "Source and user-state authority",
        summary:
          "Matches each proposed memory to the cited user or accepted assistant source, verifies that evidence appears in that source, prevents user-character identity bypasses, and invokes the shared authority classifier before user-owned state can persist.",
        badgeLabel: "SOURCE AUTHORITY",
        badgeClass: "code-logic",
        details: [
          { label: "Fail-Closed Cases", values: ["missing or duplicate review", "event mismatch", "malformed evidence", "evidence absent from source", "misidentified user character", "unsupported assistant claim"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of candidate and review schemas, durability/source vocabularies, structured parsing, evidence matching, duplicate handling, user identity matching, authority classification, and all accepted/rejected/omitted outputs.",
  },
  {
    path: "/src/features/chat-runtime/roleplay-memory-user-state-review.test.ts",
    header: testHeader,
    metric: "307 lines",
    metricDescription: "Regression coverage for memory source authority and user-character protection.",
    description:
      "Covers explicit user facts, accepted bodily observations, assistant interpretations and unsupported actions, wrong or duplicate source evidence, attempts to bypass user-character ownership across Latin/non-Latin/symbol names, durable non-user events, duplicate omission, and the edge response's structured review contract.",
    rows: [],
    reviewedSource: "Manual review of all nine memory user-state review test cases.",
  },
  {
    path: "/src/features/chat-runtime/memory-extraction-candidates.test.ts",
    header: testHeader,
    metric: "253 lines",
    metricDescription: "Contract tests for MemoryExtractionResponseV1 candidate taxonomy.",
    description:
      "Verifies acceptance of a durable source-backed candidate, preservation of semantic rejection as a valid reviewed outcome, and fail-closed handling of malformed, temporary, unsafe, duplicate, or stale candidates.",
    rows: [],
    reviewedSource: "Manual review of all three structured memory-candidate fixtures.",
  },
  {
    path: "/src/features/chat-runtime/roleplay-memory-candidate-persistence.ts",
    header: codeLogicHeader,
    metric: "79 lines",
    metricDescription: "One-row-per-candidate persistence boundary for reviewed memories.",
    description:
      "Persists only accepted memory candidate reviews, records each destination row independently, and rechecks source-generation freshness before and after every awaited insert. A stale source stops later writes; individual failures do not hide later candidates; and each outcome distinguishes persisted, persisted-stale, skipped-stale, or failed.",
    rows: [],
    reviewedSource: "Manual review of accepted filtering, pre/post-write freshness checks, per-candidate writes, failure continuation, destination receipts, and aggregate result fields.",
  },
  {
    path: "/src/features/chat-runtime/roleplay-memory-candidate-persistence.test.ts",
    header: testHeader,
    metric: "194 lines",
    metricDescription: "Regression coverage for reviewed-memory writes and prompt re-entry.",
    description:
      "Proves one database row per accepted candidate, per-candidate failure visibility, cancellation of later writes after source staleness, and the rule that only persisted accepted text can appear in the next effective memory prompt.",
    rows: [],
    reviewedSource: "Manual review of all four memory-persistence tests.",
  },
  {
    path: "/src/features/chat-runtime/roleplay-day-compression.ts",
    header: codeLogicHeader,
    metric: "273 lines",
    metricDescription: "Row-identity-safe review and persistence for day-rollover memory compression.",
    description:
      "Turns source memories into traceable input rows, validates a compression response against exact row IDs, and checks row and source-generation freshness both before and after synopsis persistence. If evidence becomes stale during the save, it rolls back the new synopsis and deletes no source rows; rollback and later cleanup failures remain explicit outcomes.",
    rows: [
      {
        id: "day-compression-review",
        title: "Compression response review",
        summary:
          "Requires a non-empty synopsis and an explicit subset of known input row IDs while separating compressed, rejected, omitted, warning, and validation-error evidence.",
        badgeLabel: "ROW-ID CONTRACT",
        badgeClass: "data-block",
        details: [],
      },
      {
        id: "day-compression-persistence",
        title: "Synopsis-first persistence",
        summary:
          "Writes the micro-summary first and deletes only validated accepted row IDs afterward, preventing lossy cleanup when the review or synopsis insert fails.",
        badgeLabel: "SAFE DELETION",
        badgeClass: "code-logic",
        details: [
          { label: "Terminal Outcomes", values: ["rejected", "stale", "stale_with_rollback_gap", "persistence_failed", "persisted", "persisted_with_cleanup_gap"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of input-row construction, response normalization, row-ID validation, pre/post-persistence freshness barriers, stale-synopsis rollback, per-row deletion, and cleanup-gap reporting.",
  },
  {
    path: "/src/features/chat-runtime/roleplay-day-compression.test.ts",
    header: testHeader,
    metric: "320 lines",
    metricDescription: "Regression coverage for day-compression row identity and deletion safety.",
    description:
      "Proves traceable input rows, exact source-generation freshness, explicit accepted subsets, rejection of malformed row decisions, synopsis-before-delete ordering, rollback when evidence becomes stale during persistence, explicit rollback failure, and zero source deletion for every unsafe outcome.",
    rows: [],
    reviewedSource: "Manual review of the day-compression contract, stale-input, stale-during-save rollback, cleanup-gap, and immutable-batch regression cases.",
  },
  {
    path: "/src/features/chat-runtime/player-turn-visibility.ts",
    header: codeLogicHeader,
    metric: "133 lines",
    metricDescription: "Projection of player-private parentheticals out of model-visible scene text.",
    description:
      "Parses balanced parenthetical spans from user-authored turns, preserves them as traceable private evidence, and produces the visible text used by the response job, recent-history packet, scene-tag detection, and scene-image context. Unbalanced punctuation remains visible with warnings so malformed input is not silently deleted.",
    rows: [],
    reviewedSource: "Manual review of private-span projection, whitespace cleanup, history filtering, scene-tag lookup, and response-job lane replacement.",
  },
  {
    path: "/src/features/chat-runtime/player-turn-visibility.test.ts",
    header: testHeader,
    metric: "145 lines",
    metricDescription: "Regression coverage for player-turn visibility projection.",
    description:
      "Proves balanced and nested private spans are withheld without reordering visible action or dialogue, malformed delimiters stay visible with warnings, thought-only turns become empty model-facing lanes, assistant parentheticals remain untouched, and projected history backfills around hidden user rows.",
    rows: [],
    reviewedSource: "Manual review of all player-turn visibility projection, history, scene-tag, and response-job assertions.",
  },
  {
    path: "/src/features/chat-runtime/roleplay-player-visibility-runtime-wiring.test.ts",
    header: testHeader,
    metric: "43 lines",
    metricDescription: "Source-wiring guard for model-visible scene and request paths.",
    description:
      "Reads the active chat and LLM sources to verify canonical scene detection, generated scene-image context, and API Call 1 receipts all use the projected visible player text rather than bypassing the private-span boundary through raw conversation messages.",
    rows: [],
    reviewedSource: "Manual review of source-slice boundaries and assertions covering scene detection, image context, and request receipt wiring.",
  },
  {
    path: "/src/features/chat-runtime/roleplay-assistant-outcome.ts",
    header: codeLogicHeader,
    metric: "467 lines",
    metricDescription: "Generation-bound compiler for persisted consequences of older assistant turns.",
    description:
      "Builds compact outcome records from accepted character snapshots, side-character snapshots, memories, goal-step derivations, source-authority decisions, and support-review envelopes. Each fact remains bound to its assistant message and generation, while stale, unsupported, pending, or absent categories are reported instead of replaying older assistant prose.",
    rows: [],
    reviewedSource: "Manual review of category evidence builders, generation matching, support-envelope status, authority summaries, record construction, and rendered older-assistant outcome text.",
  },
  {
    path: "/src/features/chat-runtime/roleplay-assistant-outcome.test.ts",
    header: testHeader,
    metric: "200 lines",
    metricDescription: "Regression coverage for assistant-outcome compilation and rendering.",
    description:
      "Exercises accepted persisted consequences, stale and unsupported lineage, missing or pending worker output, authority-class summaries, duplicate suppression, category status, and compact rendering so recent history can replace old assistant prose without losing supported state changes.",
    rows: [],
    reviewedSource: "Manual review of the complete assistant-outcome fixture matrix and its positive and negative assertions.",
  },
  {
    path: "/src/features/chat-runtime/roleplay-assistant-outcome-runtime-wiring.test.ts",
    header: testHeader,
    metric: "38 lines",
    metricDescription: "Source-wiring guard for assistant-outcome history consumption.",
    description:
      "Checks that the chat runtime compiles generation-bound assistant outcomes and passes them into recent-history construction, and that the debug review export receives the same records rather than reconstructing a competing outcome path.",
    rows: [],
    reviewedSource: "Manual review of source assertions covering ChatInterface compilation, recent-history input, and review-export handoff.",
  },
]);
