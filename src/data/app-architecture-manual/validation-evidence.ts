import { defineManualArchitectureFiles } from "./types";

const codeLogicHeader = {
  label: "CODE LOGIC" as const,
  className: "code-logic" as const,
  filterValue: "code-logic" as const,
  navAccent: "code-logic" as const,
};

const integrationHeader = {
  label: "INTEGRATION" as const,
  className: "integration" as const,
  filterValue: "integration" as const,
  navAccent: "integration" as const,
};

const testHeader = {
  label: "TEST" as const,
  className: "test" as const,
  filterValue: "test" as const,
  navAccent: "test" as const,
};

export const validationEvidenceArchitectureFiles = defineManualArchitectureFiles([
  {
    path: "/src/features/validation-evidence/roleplay-gates.ts",
    header: codeLogicHeader,
    metric: "942 lines",
    metricDescription: "Repository-owned catalog of allowed roleplay validation gates.",
    description:
      "Defines every fixture, command, and manual-review gate that the local Validation Evidence system may execute or display. Each gate binds a stable ID to one issue and validation phase, expected result, lifecycle, manual remainder, and a predefined shell-free runner configuration; callers may choose a gate but cannot supply an arbitrary command, path, environment, or fixture.",
    rows: [
      {
        id: "validation-gate-contract",
        title: "Gate definition contract",
        summary:
          "Separates evidence kind, expectation, lifecycle, issue ownership, and runner configuration so validation state can be derived without treating a command, fixture, or human review as interchangeable.",
        badgeLabel: "GATE CATALOG",
        badgeClass: "data-block",
        details: [
          { label: "Evidence Kinds", values: ["fixture", "command", "manual"], kind: "plain" },
          { label: "Expectations", values: ["pass", "fail for expected-red checkpoints"], kind: "plain" },
          { label: "Lifecycle", values: ["active", "blocked", "superseded"], kind: "plain" },
          { label: "Command Limits", values: ["fixed executable and arguments", "fixed working directory", "timeout", "report destination", "environment allowlist"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of gate types, fixture seeds, generated definitions from authored seeds, command builders, manual gates, Issue #22/#26 special gates, uniqueness map, and active-gate listing.",
  },
  {
    path: "/src/features/validation-evidence/roleplay-gates.test.ts",
    header: testHeader,
    metric: "61 lines",
    metricDescription: "Integrity tests for the predefined roleplay gate catalog.",
    description:
      "Verifies stable unique gate IDs, active formal coverage for every roleplay issue, shell-free predefined command runners, independent manual-review gates, and separate live-database review for terminal structured-mood removal.",
    rows: [],
    reviewedSource: "Manual review of all five gate-catalog tests.",
  },
  {
    path: "/src/features/validation-evidence/ledger.ts",
    header: codeLogicHeader,
    metric: "255 lines",
    metricDescription: "Evidence record contracts and derived validation status engine.",
    description:
      "Defines immutable automated executions, independent manual reviews, orphaned legacy evidence, freshness, and the derived status shown by the ledger page. It stores only pass, fail, or error executions; derives Not Run from an active gate with no execution; preserves expected-red failures as failures while displaying a demonstrated checkpoint; and counts current gate coverage rather than rerun history volume.",
    rows: [
      {
        id: "validation-ledger-record-types",
        title: "Execution and manual-review records",
        summary:
          "Keeps machine execution identity, exit code, failure cause, raw-report reference, tested revision, and timing separate from reviewer identity, decision, notes, and attachments.",
        badgeLabel: "EVIDENCE MODEL",
        badgeClass: "data-block",
        details: [
          { label: "Execution Results", values: ["pass", "fail", "error"], kind: "plain" },
          { label: "Manual Results", values: ["approved", "rejected"], kind: "plain" },
          { label: "Freshness", values: ["current only for the exact proven clean revision", "stale for another revision", "unknown when revision cannot be proven"], kind: "plain" },
        ],
      },
      {
        id: "validation-ledger-derived-status",
        title: "Derived gate status",
        summary:
          "Combines the active definition with its latest execution or manual review and expected result, while retaining the full historical record list behind the current display state.",
        badgeLabel: "DERIVATION",
        badgeClass: "code-logic",
        details: [
          { label: "States", values: ["not_run", "passing", "failing", "error", "expected_red_demonstrated", "unexpected_pass", "manual_pending", "manual_approved", "manual_rejected", "blocked", "superseded"], kind: "plain" },
          { label: "Count Rule", values: ["summary totals count definitions, not the number of execution files"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of all evidence and derived-state contracts, sorting, freshness rules, expected-red handling, manual independence, derivation, and summary counts.",
  },
  {
    path: "/src/features/validation-evidence/ledger.test.ts",
    header: testHeader,
    metric: "190 lines",
    metricDescription: "Regression coverage for truthful derived validation state.",
    description:
      "Proves derived Not Run without fake execution rows, expected-red demonstration from a real failed execution, latest-run selection with preserved history, independent manual review, and gate-definition counts unaffected by rerun volume.",
    rows: [],
    reviewedSource: "Manual review of all five ledger derivation tests.",
  },
  {
    path: "/src/features/validation-evidence/ledger-file.ts",
    header: codeLogicHeader,
    metric: "231 lines",
    metricDescription: "Append-only local storage and current-snapshot builder for validation evidence.",
    description:
      "Stores immutable execution, manual-review, raw-report, and reconciliation files beneath .validation-evidence/roleplay-pipeline, then atomically regenerates the current ledger snapshot from tracked gate definitions plus local history. It validates gate identity and result vocabulary, rejects absolute and escaping paths, ignores malformed history when building the view, and never overwrites an earlier execution record.",
    rows: [
      {
        id: "validation-ledger-file-layout",
        title: "Local evidence directories",
        summary:
          "Separates execution records, manual reviews, raw reports, reconciliation reports, and the replaceable current view while keeping all evidence outside the public production bundle.",
        badgeLabel: "LOCAL STORAGE",
        badgeClass: "data-block",
        details: [
          { label: "Root", values: [".validation-evidence/roleplay-pipeline"], kind: "plain" },
          { label: "Immutable", values: ["executions/*.json", "manual-reviews/*.json", "reports/*.json", "reconciliation history"], kind: "plain" },
          { label: "Generated View", values: ["generated/current-ledger.json written through an atomic temporary-file rename"], kind: "plain" },
        ],
      },
      {
        id: "validation-ledger-path-security",
        title: "Evidence path boundary",
        summary:
          "Resolves every read and write under the evidence root and rejects absolute paths, traversal, unsafe record IDs, unknown gates, or report identities that do not match the requested execution.",
        badgeLabel: "PATH GUARD",
        badgeClass: "code-logic",
        details: [],
        security: true,
      },
    ],
    reviewedSource: "Manual review of directory constants, path resolution, immutable and atomic writes, normalization, read helpers, execution/manual append, report/reconciliation writing, ledger snapshot generation, and report identity checks.",
  },
  {
    path: "/src/features/validation-evidence/ledger-file.test.ts",
    header: testHeader,
    metric: "67 lines",
    metricDescription: "Regression coverage for append-only evidence storage and path containment.",
    description:
      "Verifies reruns append instead of replacing prior evidence, immutable execution files cannot be overwritten, and absolute or escaping paths are rejected.",
    rows: [],
    reviewedSource: "Manual review of all three ledger-file tests.",
  },
  {
    path: "/src/features/validation-evidence/source-identity.ts",
    header: codeLogicHeader,
    metric: "23 lines",
    metricDescription: "Git-based source revision and working-tree identity for evidence freshness.",
    description:
      "Reads the current Git revision and working-tree status without a shell. A clean checkout returns its exact revision, a modified or untracked tree returns dirty with no revision claim, and Git failure returns unknown so the ledger cannot present unproven evidence as current.",
    rows: [],
    reviewedSource: "Manual review of fixed git executable use, status and revision calls, clean/dirty/unknown outcomes, and failure fallback.",
  },
  {
    path: "/src/features/validation-evidence/runner.ts",
    header: codeLogicHeader,
    metric: "240 lines",
    metricDescription: "Restricted local executor for predefined validation gates.",
    description:
      "Runs only active command gates from the repository-owned catalog or records results for active fixture gates. It uses direct process spawning without a shell, fixed arguments and working directory, an environment allowlist, output sanitization and size limits, timeout termination, real exit-code preservation, source-revision capture, raw-report writing, and append-only execution records.",
    rows: [
      {
        id: "validation-runner-command-boundary",
        title: "Predefined command execution",
        summary:
          "Accepts exactly one gate ID, looks up its fixed runner, and gives callers no mechanism to inject additional commands, arguments, paths, or environment secrets.",
        badgeLabel: "RESTRICTED RUNNER",
        badgeClass: "code-logic",
        details: [
          { label: "Process", values: ["direct spawn without shell", "current Node executable", "fixed cwd", "gate timeout", "SIGTERM then forced stop after grace period"], kind: "plain" },
          { label: "Captured Output", values: ["ANSI removed", "secret-like assignments redacted", "size capped", "full local raw report referenced by execution"], kind: "plain" },
          { label: "Result", values: ["exit 0 is pass", "nonzero exit is fail", "spawn/timeout/malformed runner outcome is error"], kind: "plain" },
        ],
        security: true,
      },
      {
        id: "validation-runner-fixture-recording",
        title: "Fixture execution recording",
        summary:
          "Accepts a completed local fixture result only when its gate is active and fixture-owned, then records a synthetic 0/1 exit code while retaining error as a separate no-exit-code outcome.",
        badgeLabel: "FIXTURE WRITER",
        badgeClass: "code-logic",
        details: [],
      },
    ],
    reviewedSource: "Manual review of execution IDs, sanitization, command formatting, environment allowlist, spawn specification, CLI parsing, fixture recording, command process lifecycle, timeout handling, exit-code mapping, source identity, raw reports, and execution append.",
  },
  {
    path: "/src/features/validation-evidence/runner.test.ts",
    header: testHeader,
    metric: "68 lines",
    metricDescription: "Security and behavior coverage for the restricted gate runner.",
    description:
      "Verifies exact gate-ID CLI parsing, rejection of unknown/manual/fixture gates by the command runner, path-traversal rejection, fixed Node execution with a restricted environment, and forced termination of a timed-out child process.",
    rows: [],
    reviewedSource: "Manual review of all five restricted-runner tests.",
  },
  {
    path: "/src/features/validation-evidence/reconciliation.ts",
    header: codeLogicHeader,
    metric: "194 lines",
    metricDescription: "One-time importer and classifier for the prior public validation ledger.",
    description:
      "Reads the legacy JSON ledger and report directory, validates each row, matches only rows whose stable fixture identity and issue metadata agree with a current gate, and imports supported rows as immutable local executions. Missing timestamps and revisions remain null, unmatched rows remain orphaned, duplicate or malformed evidence is reported, and file modification time is never invented as execution time.",
    rows: [
      {
        id: "legacy-reconciliation-classification",
        title: "Legacy evidence classification",
        summary:
          "Produces matched, orphaned, duplicate, malformed, and missing-report categories without creating artificial gate definitions to absorb unsupported rows.",
        badgeLabel: "RECONCILIATION",
        badgeClass: "code-logic",
        details: [
          { label: "Matching Evidence", values: ["stable gate ID", "issue number and title", "validation phase", "fixture identity", "readable report when referenced"], kind: "plain" },
          { label: "Preserved Unknowns", values: ["execution timestamp null when absent", "source revision null when absent", "freshness derived as unknown"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of legacy row normalization, fixture metadata matching, report reading, duplicate identity detection, classification, nullable import fields, append behavior, and reconciliation summary output.",
  },
  {
    path: "/src/features/validation-evidence/reconciliation.test.ts",
    header: testHeader,
    metric: "76 lines",
    metricDescription: "Regression coverage for truthful legacy-evidence import.",
    description:
      "Proves supported rows match, absent timestamps and revisions remain null, and unmatched evidence stays orphaned instead of being forced into a current gate.",
    rows: [],
    reviewedSource: "Manual review of the complete legacy-reconciliation fixture.",
  },
  {
    path: "/src/features/validation-evidence/dev-middleware.ts",
    header: integrationHeader,
    metric: "68 lines",
    metricDescription: "Read-only loopback Vite endpoints for the local ledger page.",
    description:
      "Adds development-only endpoints for the generated roleplay ledger snapshot and an execution's raw report. It serves only GET requests from loopback hosts, validates report identity through the evidence file layer, passes unrelated routes to Vite, and exposes no mutation endpoint or production evidence asset.",
    rows: [],
    reviewedSource: "Manual review of route constants, loopback check, JSON response handling, method rejection, ledger snapshot serving, report query parsing, and error responses.",
  },
  {
    path: "/src/features/validation-evidence/dev-middleware.test.ts",
    header: testHeader,
    metric: "85 lines",
    metricDescription: "Security coverage for the local evidence middleware.",
    description:
      "Verifies mutation methods are rejected before evidence reads, traversal-shaped execution IDs cannot reach report files, and unrelated routes continue through Vite without evidence exposure.",
    rows: [],
    reviewedSource: "Manual review of all three development-middleware tests.",
  },
  {
    path: "/src/features/validation-evidence/test-recorder.ts",
    header: codeLogicHeader,
    metric: "56 lines",
    metricDescription: "In-memory execution collector for validation-runner tests.",
    description:
      "Provides test suites with the same recordExecution callback shape as the real fixture writer, converts internal pass/fail/error results into human-readable rows, and returns synthetic AutomatedExecutionRecord objects without writing the local evidence directory.",
    rows: [],
    reviewedSource: "Manual review of collector state, gate lookup, display-row mapping, synthetic execution records, and returned callback contract.",
  },
  {
    path: "/src/features/validation-evidence/roleplay-artifact-identity.ts",
    header: codeLogicHeader,
    metric: "106 lines",
    metricDescription: "Shared contracts and comparisons for deployed roleplay artifact identity.",
    description:
      "Defines source-file hashes, source revision and state, contract versions, terminal migration, artifact comparisons, and aggregate integrity reports. Frontend identity is built from the generated manifest, while comparisons distinguish exact matches, mismatches, and identity that cannot be proven.",
    rows: [],
    reviewedSource: "Manual review of identity contracts, frontend manifest conversion, field-by-field comparison, source checks, artifact integrity, and report vocabulary.",
  },
  {
    path: "/src/features/validation-evidence/roleplay-artifact-identity.test.ts",
    header: testHeader,
    metric: "62 lines",
    metricDescription: "Contract coverage for roleplay artifact identity comparison.",
    description:
      "Verifies generated frontend identity construction, exact identity agreement, and mismatch reasons for source revision, digest, terminal migration, contract versions, and source-file hashes so freshness cannot be inferred from revision text alone.",
    rows: [],
    reviewedSource: "Manual review of frontend identity and comparison test cases with every mismatch dimension.",
  },
  {
    path: "/src/features/validation-evidence/roleplay-artifact-identity-node.ts",
    header: codeLogicHeader,
    metric: "217 lines",
    metricDescription: "Node-side verification of generated manifests against repository and runtime artifacts.",
    description:
      "Reads the current source files and terminal migration, recalculates artifact digests, compares observed runtime identities with generated manifests, detects missing or mismatched files and duplicate identities, and derives current only when the repository revision is known and every runtime artifact matches.",
    rows: [],
    reviewedSource: "Manual review of path confinement, hashing, terminal-migration discovery, manifest inspection, identity comparison, reason aggregation, and report-state derivation.",
  },
  {
    path: "/src/features/validation-evidence/roleplay-artifact-identity-node.test.ts",
    header: testHeader,
    metric: "132 lines",
    metricDescription: "Regression coverage for Node-side artifact-integrity reports.",
    description:
      "Exercises current, unknown, and mismatch reports across clean and dirty source identity, missing or changed files, terminal-migration drift, absent, duplicate, or mismatched runtime identities, and generated-revision disagreement.",
    rows: [],
    reviewedSource: "Manual review of artifact manifest checks, runtime identity fixtures, and all report-state assertions.",
  },
  {
    path: "/src/generated/roleplay-artifact-identity.ts",
    header: codeLogicHeader,
    metric: "46 lines",
    metricDescription: "Generated source-identity manifest for the frontend roleplay artifact.",
    description:
      "Stores the deterministic source digest, individual source-file hashes, terminal migration, and contract versions for the frontend roleplay bundle. The build generator owns this file, and validation reads it to compare the inspected source and observed runtime artifact without inventing freshness.",
    rows: [],
    reviewedSource: "Manual review of generator ownership, frontend artifact name, source list, digest fields, migration identity, and contract-version fields.",
  },
]);
