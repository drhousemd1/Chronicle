import { defineManualArchitectureFiles } from "./types";

const codeLogicHeader = {
  label: "CODE LOGIC" as const,
  className: "code-logic" as const,
  filterValue: "code-logic" as const,
  navAccent: "code-logic" as const,
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

export const chatRuntimeSupportAndValidationArchitectureFiles = defineManualArchitectureFiles([
  {
    path: "/src/features/chat-runtime/use-post-turn-support-queue.ts",
    header: hookHeader,
    metric: "418 lines",
    metricDescription: "Persistence-gated scheduler for post-response support workers.",
    description:
      "Queues memory extraction, goal progress, goal alignment, and character-state review only after the assistant source message has been saved. It emits per-worker lifecycle events, preserves source-message and source-user identity, allows memory and goal-progress work to fan out, serializes goal alignment and character-state application, and keeps work bound to the conversation configuration that originally queued it.",
    rows: [
      {
        id: "post-turn-queue-persistence-gate",
        title: "Source-message persistence gate",
        summary:
          "Waits for the user and assistant rows to save before dispatching derived work; a save failure marks every worker skipped instead of allowing unsourced state to persist.",
        badgeLabel: "PERSIST FIRST",
        badgeClass: "code-logic",
        details: [
          { label: "Queued Workers", values: ["memory_extraction", "goal_progress", "goal_alignment", "character_state"], kind: "plain" },
          { label: "Failure Rule", values: ["source-message save failure emits skipped lifecycle events and starts no support worker"], kind: "plain" },
        ],
      },
      {
        id: "post-turn-queue-worker-ordering",
        title: "Worker concurrency and serialization",
        summary:
          "Runs independent memory and goal-progress work immediately, while ordering goal-alignment evaluations and character-state extraction/application so overlapping turns cannot race those stateful paths.",
        badgeLabel: "QUEUE OWNERSHIP",
        badgeClass: "hook",
        details: [
          { label: "Immediate", values: ["memory extraction", "goal progress"], kind: "plain" },
          { label: "Serialized", values: ["goal alignment", "character-state extraction followed by application"], kind: "plain" },
          { label: "Fresh Callbacks", values: ["refs provide the latest worker callbacks when queued work eventually starts", "conversation-specific snapshots prevent a later rerender from redirecting old work"], kind: "plain" },
        ],
      },
      {
        id: "post-turn-queue-lifecycle",
        title: "Per-worker lifecycle reporting",
        summary:
          "Emits queued, running, completed, failed, or skipped evidence for each worker independently and logs failures without freezing unrelated worker queues.",
        badgeLabel: "LIFECYCLE",
        badgeClass: "data-block",
        details: [],
      },
    ],
    reviewedSource: "Manual review of option refs, conversation snapshots, source-persistence ordering, worker dispatch, serial queues, character update application, lifecycle events, and failure isolation.",
  },
  {
    path: "/src/features/chat-runtime/use-post-turn-support-queue.test.ts",
    header: testHeader,
    metric: "658 lines",
    metricDescription: "Regression coverage for post-turn dispatch, ordering, and failure isolation.",
    description:
      "Proves the source-persistence gate, exact user-source forwarding, per-worker lifecycle states, persistence-failure skips, turn-order preservation, goal-alignment and character-state serialization, latest callback use, conversation ownership, empty-update behavior, and queue recovery after individual worker failures.",
    rows: [],
    reviewedSource: "Manual review of all thirteen post-turn support-queue tests.",
  },
  {
    path: "/src/features/chat-runtime/roleplay-support-readiness.ts",
    header: codeLogicHeader,
    metric: "301 lines",
    metricDescription: "Immutable lifecycle records for post-response worker availability.",
    description:
      "Defines when each support worker was queued, started, completed, failed, skipped, or made stale; records its persistence status; and identifies the first future turn that may consume successful output. The contract always marks support results unavailable to the response that triggered them and rejects impossible timestamp, lifecycle, persistence, source-generation, or duplicate-worker combinations.",
    rows: [
      {
        id: "support-readiness-record",
        title: "Worker readiness record",
        summary:
          "Keeps worker lifecycle separate from persistence status and future-turn eligibility so a completed API call cannot be mistaken for a successful write or immediate prompt availability.",
        badgeLabel: "READINESS",
        badgeClass: "data-block",
        details: [
          { label: "Lifecycle", values: ["queued", "running", "completed", "failed", "skipped", "stale"], kind: "plain" },
          { label: "Eligibility", values: ["requires completed lifecycle plus persisted or no_updates status", "first eligible turn must be a positive future-turn number"], kind: "plain" },
          { label: "Scope", values: ["session_debug_only", "unavailableToTriggeringResponse=true"], kind: "plain" },
        ],
      },
      {
        id: "support-readiness-snapshot",
        title: "Dispatch snapshot",
        summary:
          "Groups at most one record per worker against the exact previous assistant message and generation visible when the next response is dispatched.",
        badgeLabel: "DISPATCH EVIDENCE",
        badgeClass: "data-block",
        details: [],
      },
    ],
    reviewedSource: "Manual review of lifecycle and persistence invariants, timestamp ordering, record construction, dispatch snapshots, transitions, and future-turn eligibility.",
  },
  {
    path: "/src/features/chat-runtime/roleplay-support-readiness.test.ts",
    header: testHeader,
    metric: "290 lines",
    metricDescription: "Regression coverage for support lifecycle and future-turn invariants.",
    description:
      "Locks lifecycle vocabulary, proves persistence/readiness separation and optional ordered timing, rejects impossible states, verifies per-worker snapshots and immutable transitions, enforces source identity, and rejects duplicate worker records.",
    rows: [],
    reviewedSource: "Manual review of all nine support-readiness test cases.",
  },
  {
    path: "/src/features/chat-runtime/roleplay-support-review-envelope.ts",
    header: codeLogicHeader,
    metric: "258 lines",
    metricDescription: "Shared review, persistence, and future-prompt contract for post-turn workers.",
    description:
      "Defines RoleplaySupportReviewEnvelope for character state, memory extraction, goal progress, goal alignment, and day-memory compression. It keeps accepted, rejected, and omitted candidates separate from persistence and readiness, preserves source message and generation lineage, records context gaps, and permits future prompt re-entry only for accepted persisted output owned by an eligible worker.",
    rows: [
      {
        id: "support-review-outcomes",
        title: "Candidate review outcomes",
        summary:
          "Stores accepted, rejected, and omitted rows with their evidence, categories, source authority, user-character identity, and optional persistence outcome rather than flattening the worker response into one success flag.",
        badgeLabel: "REVIEW ENVELOPE",
        badgeClass: "data-block",
        details: [],
      },
      {
        id: "support-review-prompt-eligibility",
        title: "Future prompt eligibility",
        summary:
          "Allows re-entry only after accepted output is persisted and maps each eligible worker to memory, current-state, goal-state, or summary targets; goal alignment remains diagnostic-only.",
        badgeLabel: "REENTRY GATE",
        badgeClass: "code-logic",
        details: [
          { label: "Required", values: ["non-goal-alignment worker", "completed readiness", "persisted status", "at least one accepted item", "eligible target"], kind: "plain" },
          { label: "Blocked", values: ["pending", "failed", "stale", "source not persisted", "rejected-only", "no updates", "debug-only goal alignment"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of worker, readiness, persistence, prompt-target, item, and envelope contracts plus pending/finalized envelope invariants.",
  },
  {
    path: "/src/features/chat-runtime/roleplay-support-review-envelope.test.ts",
    header: testHeader,
    metric: "248 lines",
    metricDescription: "Regression coverage for the support-review envelope and re-entry gate.",
    description:
      "Locks the five real workers, keeps review/persistence/readiness/re-entry distinct, verifies pending and finalized envelopes, and proves that persisted compression may re-enter as a summary while preserving a source-row cleanup gap.",
    rows: [],
    reviewedSource: "Manual review of all five support-review envelope tests.",
  },
  {
    path: "/src/features/chat-runtime/roleplay-support-review-adapters.ts",
    header: codeLogicHeader,
    metric: "287 lines",
    metricDescription: "Adapters from worker-specific response shapes into the shared review envelope.",
    description:
      "Reads memory, character-state, goal-progress, goal-alignment, and day-compression response bodies and maps their accepted, rejected, omitted, persistence, stale, failure, and source-lineage evidence into RoleplaySupportReviewEnvelope. The adapter preserves worker-specific rows, prevents debug-only goal alignment from becoming prompt state, and keeps accepted-but-unpersisted output ineligible for future turns.",
    rows: [
      {
        id: "support-adapter-worker-shapes",
        title: "Worker-specific response mapping",
        summary:
          "Selects the reviewed rows owned by each worker rather than assuming that every support endpoint returns the same collection names or persistence semantics.",
        badgeLabel: "ADAPTERS",
        badgeClass: "code-logic",
        details: [
          { label: "Character State", values: ["accepted and rejected updates", "review coverage", "apply/persistence metadata"], kind: "plain" },
          { label: "Memory", values: ["candidate reviews", "extracted events", "omitted duplicates and source-authority metadata"], kind: "plain" },
          { label: "Goals", values: ["progress reviews and updates", "diagnostic-only alignment evaluations"], kind: "plain" },
          { label: "Compression", values: ["synopsis", "input/compressed/deleted row IDs", "rejected and omitted rows"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of legacy memory duplicate review, generic row normalization, every worker-specific row selector, persistence/readiness derivation, context gaps, and envelope construction.",
  },
  {
    path: "/src/features/chat-runtime/roleplay-support-review-adapters.test.ts",
    header: testHeader,
    metric: "285 lines",
    metricDescription: "Regression coverage for support-worker response adapters.",
    description:
      "Covers memory duplicates, character-state accepted/rejected and reviewed rows, source-authority metadata, debug-only goal alignment, stale output, request/parse failures, and prompt-eligible persisted day compression.",
    rows: [],
    reviewedSource: "Manual review of all nine support-review adapter tests.",
  },
  {
    path: "/src/features/chat-runtime/roleplay-support-review-projections.ts",
    header: codeLogicHeader,
    metric: "83 lines",
    metricDescription: "Read-model projections for support registry, prompt re-entry, and context gaps.",
    description:
      "Derives compact dashboard/export rows from a finalized support-review envelope. It summarizes lifecycle and outcome counts, emits prompt re-entry rows only when the envelope passes the shared eligibility invariant, and reports context gaps separately so missing evidence cannot become prompt material.",
    rows: [],
    reviewedSource: "Manual review of registry counts, re-entry target projection, accepted IDs, persistence targets, context-gap rows, and prompt-eligibility reuse.",
  },
  {
    path: "/src/features/chat-runtime/roleplay-support-review-projections.test.ts",
    header: testHeader,
    metric: "122 lines",
    metricDescription: "Regression coverage for support-review read models.",
    description:
      "Verifies accepted persisted re-entry, context-gap isolation, and rejection of a contradictory deserialized stale envelope even when its stored flag claims eligibility.",
    rows: [],
    reviewedSource: "Manual review of all three support-review projection tests.",
  },
  {
    path: "/src/features/chat-runtime/roleplay-support-review-runtime-wiring.test.ts",
    header: testHeader,
    metric: "96 lines",
    metricDescription: "Source-level checks for support-review lifecycle integration.",
    description:
      "Confirms mutating worker envelopes finalize after persistence, memory authority and duplicate review occurs before accepted outcomes are recorded, goal alignment stays diagnostic-only, source freshness is rechecked after writes, and partial day-compression cleanup remains truthfully reported.",
    rows: [],
    reviewedSource: "Manual review of all support-review runtime-wiring assertions.",
  },
  {
    path: "/src/features/chat-runtime/side-character-profile.ts",
    header: codeLogicHeader,
    metric: "191 lines",
    metricDescription: "Sanitization and visual projection for generated side-character profiles.",
    description:
      "Normalizes generated profile fields and requires exact normalized source support before accepting private or intimate values such as orientation, undergarments, secrets, desires, genitalia, or breast size. It builds a deduplicated avatar prompt, merges only meaningful generated section values, and projects the visual-only character fields used by scene-image generation.",
    rows: [
      {
        id: "side-profile-source-support",
        title: "Source-backed private fields",
        summary:
          "Requires each sensitive generated value to appear as one supported phrase in the source text rather than accepting scattered matching words or unsupported inference.",
        badgeLabel: "SOURCE GUARD",
        badgeClass: "code-logic",
        details: [],
      },
      {
        id: "side-profile-visual-projection",
        title: "Avatar and scene-image projection",
        summary:
          "Creates avatar prompts from supported visible traits and sends scene generation only visual appearance and outer-clothing fields, excluding private profile data.",
        badgeLabel: "IMAGE INPUT",
        badgeClass: "data-block",
        details: [],
      },
    ],
    reviewedSource: "Manual review of source-support normalization, sensitive-field sanitization, defaults, avatar-prompt construction, section merging, and scene-image field projection.",
  },
  {
    path: "/src/features/chat-runtime/side-character-profile.test.ts",
    header: testHeader,
    metric: "173 lines",
    metricDescription: "Regression coverage for generated side-character profile safety.",
    description:
      "Verifies visible-detail preservation, source support for private or intimate fields, whole-phrase evidence requirements, meaningful section merges, and visual-only scene-image character data.",
    rows: [],
    reviewedSource: "Manual review of all four side-character profile test cases.",
  },
  {
    path: "/src/features/chat-runtime/roleplay-regression-fixture.ts",
    header: codeLogicHeader,
    metric: "253 lines",
    metricDescription: "Provider-free fixture executor connected to predefined validation gates.",
    description:
      "Runs deterministic roleplay fixtures that create text artifacts, evaluates named positive and negative substring assertions, and records immutable pass, fail, or runner-error evidence through the restricted Validation Evidence writer. It rejects fixture IDs that are not part of the selected batch or whose issue, title, phase, and fixture identity do not match a predefined gate.",
    rows: [
      {
        id: "regression-fixture-proof-contract",
        title: "Fixture proof contract",
        summary:
          "Each fixture names its owning issue, validation phase, command, manual remainder, artifact builder, required evidence, and forbidden evidence.",
        badgeLabel: "FIXTURE",
        badgeClass: "test",
        details: [
          { label: "Positive Proof", values: ["artifact must include every named required string"], kind: "plain" },
          { label: "Negative Proof", values: ["artifact must exclude every named forbidden string"], kind: "plain" },
          { label: "Recorded Result", values: ["pass or fail for completed assertions", "error when artifact creation crashes", "raw report and execution ID returned by the shared writer"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of fixture and result contracts, assertion evaluation, gate lookup and metadata matching, error evidence, append-only execution recording, selection, and run summary.",
  },
  {
    path: "/src/features/chat-runtime/roleplay-regression-fixture.test.ts",
    header: testHeader,
    metric: "332 lines",
    metricDescription: "Regression coverage for fixture execution and evidence writing.",
    description:
      "Proves provider-free positive and negative assertions are sent to the shared execution writer with immutable results and that fixture crashes are recorded as execution errors before being rethrown.",
    rows: [],
    reviewedSource: "Manual review of both regression-fixture runner tests.",
  },
  {
    path: "/src/features/chat-runtime/roleplay-batch0-validation.ts",
    header: codeLogicHeader,
    metric: "923 lines",
    metricDescription: "Local deterministic validation campaign for Issues #1 and #24.",
    description:
      "Builds the predefined Batch 0 fixture set for the first-class response-job contract and the shared regression harness. It produces provider-free artifacts for mode contracts, rendered request snapshots, runtime integration, deleted-assistant recovery, debug export, source pressure, stale state, response detail, visibility, physical state, support outcomes, and command documentation, then delegates execution and ledger recording to the shared fixture runner.",
    rows: [
      {
        id: "batch0-issue1-gates",
        title: "Issue #1 response-job proof",
        summary:
          "Covers contract unit behavior, provider-free rendered messages, runtime wiring, deleted-assistant recovery, and exported response-job evidence.",
        badgeLabel: "ISSUE 1",
        badgeClass: "test",
        details: [
          { label: "Command", values: ["npm run validation:roleplay:batch0"], kind: "plain" },
          { label: "Provider Calls", values: ["none; artifacts are created from local contracts, snapshots, and saved debug fixtures"], kind: "plain" },
        ],
      },
      {
        id: "batch0-issue24-gates",
        title: "Issue #24 harness proof",
        summary:
          "Covers the harness command, state staleness and source pressure, detail/visibility/physical-state fixtures, response-mode separation, support/export evidence, and documented manual-review ordering.",
        badgeLabel: "ISSUE 24",
        badgeClass: "test",
        details: [],
      },
    ],
    reviewedSource: "Manual review of all Batch 0 artifact builders, eleven fixture definitions, assertions, manual remainders, selected-gate support, and shared runner invocation.",
  },
  {
    path: "/src/features/chat-runtime/roleplay-batch0-validation.test.ts",
    header: testHeader,
    metric: "179 lines",
    metricDescription: "Integration coverage for Batch 0 execution and package wiring.",
    description:
      "Verifies the Issue #1 and #24 fixtures record through the shared execution writer and confirms the package command invokes the file-backed ledger generation path.",
    rows: [],
    reviewedSource: "Manual review of both Batch 0 validation tests and their execution-record assertions.",
  },
  {
    path: "/src/features/chat-runtime/roleplay-batch1-validation.ts",
    header: codeLogicHeader,
    metric: "1,562 lines",
    metricDescription: "Local deterministic validation campaign for response modes, history, exports, and lane authority.",
    description:
      "Builds the predefined Batch 1 provider-free fixtures for Issues #2, #3, #4, #5, #22, #26, and #27. It checks Retry contracts and contrast evidence, superseded-generation pruning, strict Continue and deleted-reply recovery, structured final-user rendering, established-fact separation, parent-message export ownership, and recent-history mode policies before sending results to the shared fixture runner.",
    rows: [
      {
        id: "batch1-mode-and-lane-gates",
        title: "Mode, lane, and old-contract guards",
        summary:
          "Proves typed Retry, Continue, deleted-assistant recovery, and Normal Send rendering while checking that loose legacy user/state/regeneration inputs do not override response-job lanes.",
        badgeLabel: "REQUEST MODES",
        badgeClass: "test",
        details: [
          { label: "Owners", values: ["Issue #2 Retry", "Issue #4 Continue/recovery", "Issue #5 lane authority", "Issue #27 established-fact separation"], kind: "plain" },
          { label: "Command", values: ["npm run validation:roleplay:batch1"], kind: "plain" },
        ],
      },
      {
        id: "batch1-history-and-export-gates",
        title: "Generation, history, and export proof",
        summary:
          "Checks effective-memory pruning and its export evidence, parent-message versus child-card ownership, and recent-history behavior for standard, Retry, and Continue packets.",
        badgeLabel: "HISTORY / EXPORT",
        badgeClass: "test",
        details: [
          { label: "Owners", values: ["Issue #3 generation contamination", "Issue #22 export boundaries", "Issue #26 recent history"], kind: "plain" },
          { label: "Provider Calls", values: ["none; captured request/export fixtures and source checks are local"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of Batch 1 artifact builders, all 22 fixture definitions, assertions, manual remainders, command identity, and shared runner invocation.",
  },
  {
    path: "/src/features/chat-runtime/roleplay-batch1-validation.test.ts",
    header: testHeader,
    metric: "413 lines",
    metricDescription: "Integration coverage for Batch 1 ledger recording.",
    description:
      "Verifies Issue #5 final-user lane evidence and Issue #4 Continue/recovery evidence are recorded through the shared execution writer and that the Batch 1 package command points to the ledger-writing script.",
    rows: [],
    reviewedSource: "Manual review of all Batch 1 validation integration tests and their recorded gate assertions.",
  },
  {
    path: "/src/features/chat-runtime/roleplay-candidate-behavior.ts",
    header: codeLogicHeader,
    metric: "521 lines",
    metricDescription: "Deterministic review of generated roleplay candidate behavior.",
    description:
      "Evaluates Retry differentiation, Continue extension, player-action takeover, private-thought leakage, response development, repeated closing function, and thought-function quality using versioned thresholds and structured signals. Ambiguous cases remain review-required rather than being forced into a false pass or failure.",
    rows: [],
    reviewedSource: "Manual review of normalization, message-unit classification, overlap and function detectors, candidate evaluation, response-development review, thought-function review, and exported thresholds.",
  },
  {
    path: "/src/features/chat-runtime/roleplay-candidate-behavior.test.ts",
    header: testHeader,
    metric: "276 lines",
    metricDescription: "Calibration coverage for deterministic roleplay candidate review.",
    description:
      "Covers materially different Retry responses, near copies, reassurance loops, player-action takeover, Continue tail rewriting, exact and semantic private leakage, restatement-only output, concise valid development, repeated closing function, and the complete thought-function classification vocabulary.",
    rows: [],
    reviewedSource: "Manual review of all candidate-behavior calibration fixtures, boundary cases, and versioned-threshold assertions.",
  },
  {
    path: "/src/features/chat-runtime/roleplay-fixture-scenarios.ts",
    header: codeLogicHeader,
    metric: "336 lines",
    metricDescription: "Reusable scenario builder for cross-issue roleplay regression fixtures.",
    description:
      "Creates deterministic conversations containing main and side characters, goals, card facts, generation chains, messages, memories, snapshots, support results, private facts, and expected source outcomes. Callers can override stable defaults while retaining the minimum relationships needed by the shared regression categories.",
    rows: [],
    reviewedSource: "Manual review of every fixture type, stable default identity, scenario assembly, override behavior, side-character minimum, and source-linked artifacts.",
  },
  {
    path: "/src/features/chat-runtime/roleplay-fixture-scenarios.test.ts",
    header: testHeader,
    metric: "56 lines",
    metricDescription: "Contract coverage for reusable roleplay fixture scenarios.",
    description:
      "Verifies the default scenario contains every required regression category and enforces at least two side characters, protecting later tests from silently constructing an incomplete history, source, state, or support-worker fixture.",
    rows: [],
    reviewedSource: "Manual review of the scenario completeness and minimum-side-character assertions.",
  },
  {
    path: "/src/features/chat-runtime/roleplay-harness-contract-artifact.ts",
    header: codeLogicHeader,
    metric: "168 lines",
    metricDescription: "Inspectable contract artifact for the shared roleplay regression harness.",
    description:
      "Builds a structured inventory of required harness suites, source files, commands, fixture categories, and contract targets, then evaluates whether the assembled artifact covers each required surface. This makes missing regression ownership visible without executing a provider request.",
    rows: [],
    reviewedSource: "Manual review of target declarations, artifact construction, required suite and source inventories, command metadata, and completeness evaluation.",
  },
  {
    path: "/src/features/chat-runtime/roleplay-retry-generation-integration.test.ts",
    header: testHeader,
    metric: "200 lines",
    metricDescription: "Integration regression for delayed Retry generation replacement.",
    description:
      "Exercises two generations sharing one assistant message identity and proves a delayed rejected generation remains debug-only after the accepted Retry replaces it. The test covers queued source persistence, effective-state pruning, recent-history selection, and export ownership across the race.",
    rows: [],
    reviewedSource: "Manual review of delayed persistence orchestration, generation identities, accepted replacement, pruning assertions, history assertions, and debug-export evidence.",
  },
  {
    path: "/src/features/chat-runtime/roleplay-source-contracts.test.ts",
    header: testHeader,
    metric: "301 lines",
    metricDescription: "Cross-owner contract coverage for roleplay source candidates and receipts.",
    description:
      "Proves card, scene-visibility, and goal owners emit one candidate vocabulary; selection results remain complete while live shaping is disabled; field identities and exact multiline content survive; private and debug-only rows cannot become model eligible; and budgets are keyed by provider section.",
    rows: [],
    reviewedSource: "Manual review of source-candidate construction, shadow selection, receipt identity, content preservation, privacy invariants, and section-budget assertions.",
  },
]);
