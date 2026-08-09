import { defineManualArchitectureFiles } from "./types";

const toolingHeader = {
  label: "TOOLING" as const,
  className: "tooling" as const,
  filterValue: "tooling" as const,
  navAccent: "tooling" as const,
};

const scriptHeader = {
  label: "SCRIPT" as const,
  className: "script" as const,
  filterValue: "script" as const,
  navAccent: "script" as const,
};

const testHeader = {
  label: "TEST" as const,
  className: "test" as const,
  filterValue: "test" as const,
  navAccent: "test" as const,
};

const codeHeader = {
  label: "CODE LOGIC" as const,
  className: "code-logic" as const,
  filterValue: "code-logic" as const,
  navAccent: "code-logic" as const,
};

export const repositoryEntrypointAndScriptArchitectureFiles = defineManualArchitectureFiles([
  {
    path: "/.githooks/pre-push",
    header: toolingHeader,
    metric: "9 lines",
    metricDescription: "Git pre-push quality gate.",
    description:
      "Changes to the repository root, moves there, and runs Chronicle's ship-check before Git is allowed to push. Because the shell uses strict error handling, a failed typecheck, lint, or production build stops the push instead of allowing a knowingly broken revision onto the remote.",
    rows: [],
    reviewedSource: "Manual review of repository resolution, strict shell flags, ship-check invocation, and failure behavior.",
  },
  {
    path: "/e2e/smoke.spec.ts",
    header: testHeader,
    metric: "11 lines",
    metricDescription: "Minimal Playwright application-shell smoke test.",
    description:
      "Loads the application root through Chronicle's shared Playwright fixture and verifies that the Chronicle brand and Community Gallery navigation are visible. This catches a completely broken app shell or primary-navigation render, but it does not exercise authentication, story editing, roleplay, persistence, or admin tools.",
    rows: [],
    reviewedSource: "Manual review of the single Playwright scenario and both visible assertions.",
  },
  {
    path: "/scripts/reconcile-validation-evidence.ts",
    header: scriptHeader,
    metric: "28 lines",
    metricDescription: "Local legacy-evidence reconciliation command.",
    description:
      "Finds the old public validation ledger when present or falls back to the archived local copy, classifies its legacy rows through the validation-evidence reconciliation service, rebuilds the local ledger snapshot for the current source identity, and prints matched, orphaned, malformed, duplicate, and missing-report totals. It exits unsuccessfully only for malformed rows, duplicate IDs, or missing referenced reports.",
    rows: [],
    reviewedSource: "Manual review of source selection, reconciliation call, snapshot rebuild, printed classifications, and exit criteria.",
  },
  {
    path: "/scripts/record-validation-manual-review.ts",
    header: scriptHeader,
    metric: "46 lines",
    metricDescription: "Restricted CLI for append-only manual validation decisions.",
    description:
      "Accepts only gate, approved-or-rejected outcome, reviewer, notes, and repeatable evidence-reference arguments. It validates the complete argument set, appends a manual-review record through the local evidence writer, rebuilds the derived ledger snapshot, and prints the new review identity. It cannot execute a test gate or accept arbitrary command text.",
    rows: [
      {
        id: "manual-review-cli-validation",
        title: "Argument and outcome guard",
        summary:
          "Rejects unsupported switches, missing required values, and outcomes outside approved or rejected before any record is written.",
        badgeLabel: "INPUT GUARD",
        badgeClass: "code-logic",
        details: [],
      },
      {
        id: "manual-review-cli-write",
        title: "Append and refresh",
        summary:
          "Delegates immutable review creation to ledger-file.ts and then regenerates the local derived view using the current source identity.",
        badgeLabel: "EVIDENCE WRITE",
        badgeClass: "data-block",
        details: [],
      },
    ],
    reviewedSource: "Manual review of CLI parsing, allowlist, required fields, append operation, and snapshot refresh.",
  },
  {
    path: "/scripts/refresh-architecture-paths.mjs",
    header: scriptHeader,
    metric: "906 lines",
    metricDescription: "Static inventory and relationship refresh command for App Architecture.",
    description:
      "Walks repository source, documentation, script, test, public, and Supabase files, including non-ignored files not yet committed; measures text line counts; parses TypeScript and JavaScript ASTs; resolves imports; and detects explicit Supabase tables, RPCs, edge functions, storage operations, and browser-storage access. It rewrites the four generated architecture path, metric, and relationship datasets. It deliberately does not understand product purpose and must not generate or overwrite manual file descriptions.",
    rows: [
      {
        id: "architecture-refresh-inventory",
        title: "Tracked-file inventory and metrics",
        summary:
          "Filters the filesystem through Git's tracked and non-ignored paths, separates src from extra architecture files, and writes deterministic path lists and text line counts.",
        badgeLabel: "INVENTORY",
        badgeClass: "script",
        details: [],
      },
      {
        id: "architecture-refresh-analysis",
        title: "Static relationship extraction",
        summary:
          "Uses AST and targeted source-pattern analysis to capture imports, reverse consumers, database operations, edge calls, storage access, and browser-state access without executing application code.",
        badgeLabel: "STATIC ANALYSIS",
        badgeClass: "code-logic",
        details: [],
      },
      {
        id: "architecture-refresh-boundary",
        title: "Manual documentation boundary",
        summary:
          "Writes measured evidence only. File categories, responsibilities, operational status, risks, and explanations remain manually reviewed content.",
        badgeLabel: "NO AUTOFILL",
        badgeClass: "documentation",
        details: [],
      },
    ],
    reviewedSource: "Manual review of filesystem traversal, Git filtering, AST extraction, import resolution, relationship detection, and all four generated outputs.",
  },
  {
    path: "/scripts/validate-architecture-knowledge.mjs",
    header: scriptHeader,
    metric: "579 lines",
    metricDescription: "Read-only repository and structural validator for Chronicle Knowledge Base.",
    description:
      "Loads the repository manifest and source-readable documents; verifies exact section identities, labels, descriptions and tab order against the registered Knowledge Base contract, plus content kinds, date formats, populated headings, substantive Gallery App Architecture and review metadata, required Supabase instructions, removed Preview exclusion, checked-in asset hashes, Admin tile and protected route registration, separate global App Architecture preservation, React-only rendering, and derived issue counts. It reports defects but never rewrites the manual.",
    rows: [
      {
        id: "architecture-knowledge-validation",
        title: "Knowledge Base contract and manifest integrity gate",
        summary:
          "Prevents lost or reordered registered sections, broken specialist routes, truncated prose, changed image files, duplicated IDs, hidden content in blank tabs, manual issue counters, and accidental replacement of App Architecture from reaching the renderer.",
        badgeLabel: "VALIDATION",
        badgeClass: "script",
        details: [],
      },
    ],
    reviewedSource: "Manual review of all expected identities, content and date checks, source hash behavior, document and link resolution, asset digests, route and tile assertions, renderer guardrails, accumulated failures, and success output.",
  },
  {
    path: "/scripts/validate-chronicle-operational-records.ts",
    header: scriptHeader,
    metric: "87 lines",
    metricDescription: "Read-only repository check for Community Gallery operational records and protected history.",
    description:
      "Loads the four Community Gallery operational-record directories, reads tracked baseline records from Git when available, and runs the shared lifecycle validator. It reports record counts and diagnostics but never creates, edits, closes, archives, or deletes a record.",
    rows: [
      {
        id: "operational-record-validator-current-state",
        title: "Current record-set validation",
        summary:
          "Checks the working record set for valid Markdown contracts, canonical placement, unique ownership, cross-record links, primary resume state, and complete terminal closeout.",
        badgeLabel: "VALIDATION",
        badgeClass: "test",
        details: [],
      },
      {
        id: "operational-record-validator-baseline",
        title: "Tracked-history comparison",
        summary:
          "Compares current append-only history and archived records with their Git baseline so removed or rewritten events are reported instead of silently accepted.",
        badgeLabel: "HISTORY GUARD",
        badgeClass: "code-logic",
        details: [],
      },
    ],
    reviewedSource: "Manual review of filesystem loading, Git baseline reads, validation dispatch, diagnostics, record counts, and read-only behavior.",
  },
  {
    path: "/scripts/assert-no-unfinished-knowledge-transaction.mjs",
    header: scriptHeader,
    metric: "15 lines",
    metricDescription: "Package-script stop gate for unfinished Knowledge record transactions.",
    description:
      "Runs the read-only transaction guard against the supplied repository root or current working directory, prints one short safe-state message when no writer is active and no recovery is pending, and exits unsuccessfully with the guard's diagnostic otherwise. It does not prepare, apply, recover, inspect record contents, or change transaction state.",
    rows: [],
    reviewedSource: "Manual review of repository-root selection, guard invocation, success output, error output, and exit behavior.",
  },
  {
    path: "/scripts/knowledge-certification-child-supervisor.mjs",
    header: scriptHeader,
    metric: "78 lines",
    metricDescription: "Detached process supervisor for a lease-protected repository check.",
    description:
      "Waits for a single validated start message from the certification wrapper, starts the requested child without a shell, forwards terminal signals, and remains the protected process-group owner until that child exits. Because the supervisor is detached and recorded in the lease before the command starts, killing only the wrapper cannot make an active check look finished and allow a writer to begin over it.",
    rows: [],
    reviewedSource: "Manual review of IPC readiness and start validation, shell-free child launch, signal forwarding, disconnect behavior, and exit propagation.",
  },
  {
    path: "/scripts/knowledge-record-control-contract.d.mts",
    header: codeHeader,
    metric: "109 lines",
    metricDescription: "Type declarations for shared Knowledge transaction-control metadata.",
    description:
      "Declares the writer-lock, certification-lease, unfinished-marker, owner-token, and parser shapes exported by the JavaScript control contract so TypeScript callers use the same identifiers and metadata fields as the runtime guard. It supplies compile-time agreement only; the JavaScript contract performs the actual runtime validation.",
    rows: [],
    reviewedSource: "Manual review of declared metadata, constants, identity patterns, parser results, and exported validation signatures against the JavaScript implementation.",
  },
  {
    path: "/scripts/knowledge-record-control-contract.mjs",
    header: codeHeader,
    metric: "353 lines",
    metricDescription: "Shared runtime contract for transaction locks, leases, markers, and temporary artifacts.",
    description:
      "Defines one versioned vocabulary for the TypeScript transaction store and the JavaScript read-only guard, including exact directory names, size limits, identity formats, metadata hashes, writer locks, protected certification leases, unfinished markers, and recognized transition artifacts. Keeping this rulebook shared prevents the reader and writer from silently interpreting the same on-disk control state differently.",
    rows: [
      {
        id: "knowledge-control-shared-contract",
        title: "One control-state vocabulary",
        summary:
          "Rejects unsupported metadata fields, malformed or mismatched hashes, unsafe identities, and unfamiliar temporary names before either the writer or a protected check may trust the transaction directory.",
        badgeLabel: "SHARED CONTRACT",
        badgeClass: "code-logic",
        details: [],
      },
    ],
    reviewedSource: "Manual review of canonical JSON hashing, exact-key validation, lock and lease schemas, transaction and owner identities, artifact-name parsers, and metadata limits.",
  },
  {
    path: "/scripts/knowledge-record-transaction-guard.d.mts",
    header: codeHeader,
    metric: "29 lines",
    metricDescription: "Type declarations for the read-only transaction guard.",
    description:
      "Declares the safe status and active certification-context results returned by the JavaScript guard. It lets TypeScript entry points verify that they are running inside the exact live lease created for their package command without duplicating the guard's runtime inspection logic.",
    rows: [],
    reviewedSource: "Manual review of guard status, active-context, and exported assertion signatures against the JavaScript implementation.",
  },
  {
    path: "/scripts/knowledge-record-transaction-guard.mjs",
    header: scriptHeader,
    metric: "647 lines",
    metricDescription: "Read-only transaction-state guard shared by repository checks.",
    description:
      "Resolves the real Git metadata directory, inspects the private Knowledge transaction root, and blocks checks when a writer lock, an unfinished transaction marker, or an interrupted control-state operation exists. Direct Knowledge validators and architecture refresh also require a matching live certification lease whose recorded command, parent process, protected process group, host, and environment identity all agree. The guard validates but never reclaims or repairs state; explicit recovery remains the only repair path.",
    rows: [
      {
        id: "knowledge-transaction-guard-boundary",
        title: "Fail-closed repository gate",
        summary:
          "Treats unfamiliar files, unsafe links, invalid identities, active writes, and incomplete recovery as reasons not to certify the repository instead of assuming the record set is safe.",
        badgeLabel: "STOP GATE",
        badgeClass: "code-logic",
        details: [],
      },
    ],
    reviewedSource: "Manual review of Git-directory resolution, transaction-root inventory, mode and symlink checks, unfinished-marker detection, protected lease-context validation, safe diagnostics, and read-only failure behavior.",
  },
  {
    path: "/scripts/knowledge-records.ts",
    header: scriptHeader,
    metric: "269 lines",
    metricDescription: "Strict command-line entry point for guarded Knowledge record updates.",
    description:
      "Accepts only status, four named prepare commands, apply, and recover with their exact required arguments, then delegates the work to the transaction engine. Status reports identities and outcomes without printing staged record contents, while test repository overrides and forced-crash hooks are enabled only under the explicit test environment. Applying or recovering through this command can change canonical Markdown; preparing only validates and stages a private transaction.",
    rows: [
      {
        id: "knowledge-records-cli-command-surface",
        title: "Bounded operator command surface",
        summary:
          "Rejects extra or missing arguments and keeps project update, legacy import, correction, and closeout as distinct request kinds rather than accepting arbitrary filesystem operations.",
        badgeLabel: "CLI GUARD",
        badgeClass: "script",
        details: [],
      },
      {
        id: "knowledge-records-cli-test-failpoint",
        title: "Test-only process-crash hook",
        summary:
          "Allows integration tests to terminate the command after a selected engine mutation, raw filesystem primitive, durable filesystem boundary, or control-store operation only when both test-only environment gates are present; production invocations reject every failpoint before command execution.",
        badgeLabel: "TEST ONLY",
        badgeClass: "test",
        details: [],
      },
    ],
    reviewedSource: "Manual review of command grammar, option matching, engine dispatch, sanitized output, repository override restrictions, crash-hook restrictions, and failure exit handling.",
  },
  {
    path: "/scripts/knowledge-records/path-safety.ts",
    header: scriptHeader,
    metric: "333 lines",
    metricDescription: "Canonical record identity, path containment, and symlink-safety rules.",
    description:
      "Defines the only Issue, active Current Work, archived Current Work, and global Changelog directories that the record command may address; validates each record-ID family and transaction ID; and resolves normalized repository-relative paths without traversal, aliases, symbolic links, or unexpected file types. It establishes where a record may live and what it may be called, but it does not parse Markdown semantics or mutate files.",
    rows: [],
    reviewedSource: "Manual review of allowlisted directories, ID patterns, correction-ID derivation, transaction-ID generation and parsing, path normalization and containment, symlink checks, and canonical-target inspection.",
  },
  {
    path: "/scripts/knowledge-records/source-set.ts",
    header: scriptHeader,
    metric: "336 lines",
    metricDescription: "Exact working-tree inventory for canonical operational records.",
    description:
      "Reads every Markdown file in the four approved record directories as exact bytes, records its SHA-256 hash and file mode, confirms directory membership stayed stable during the read, and compares later inventories for additions, removals, byte changes, or mode changes. It captures the current working tree rather than Git HEAD and can decode that snapshot for semantic validation; it does not decide lifecycle correctness by itself.",
    rows: [],
    reviewedSource: "Manual review of deterministic directory reads, double-read stability checks, exact-byte hashing, UTF-8 conversion, membership and mode comparison, and expected-absent assertions.",
  },
  {
    path: "/scripts/knowledge-records/request-contract.ts",
    header: scriptHeader,
    metric: "628 lines",
    metricDescription: "Strict external request-package parser for four Knowledge record operations.",
    description:
      "Validates one versioned JSON request plus an exact content directory, rejects extra keys and files, enforces size and record-count limits, verifies record IDs and required frontmatter identities, and converts the request into create, update, or remove operations with fixed canonical destinations. Closeout order is generated as archive creation, accepted-Changelog creation, and active-project removal last. This module only normalizes a proposed package; full lifecycle validation and canonical writes occur later.",
    rows: [],
    reviewedSource: "Manual review of all four strict request schemas, package containment, exact content membership, stable reads, resource limits, frontmatter identity checks, operation normalization, duplicate-target rejection, and closeout ordering.",
  },
  {
    path: "/scripts/knowledge-records/candidate.ts",
    header: scriptHeader,
    metric: "266 lines",
    metricDescription: "In-memory candidate construction and full operational-record validation.",
    description:
      "Combines a normalized request with the exact current source inventory, rejects case-insensitive path collisions, missing or pre-existing targets, unchanged updates, incorrect stored modes, and malformed stored before/after states, then validates the complete proposed record set against Chronicle's lifecycle contract. It returns deterministic candidate and baseline data for the engine without writing canonical files.",
    rows: [],
    reviewedSource: "Manual review of candidate source construction, create/update/remove state rules, collision and no-op checks, stored-operation reconstruction, shared operational validation, and deterministic source digest.",
  },
  {
    path: "/scripts/knowledge-records/transaction-store.ts",
    header: scriptHeader,
    metric: "4,291 lines",
    metricDescription: "Private transaction store, global writer lock, journal, marker, and receipts.",
    description:
      "Stores exact before and after payloads beneath the repository's real Git metadata directory using owner-only directories and files, while keeping record bytes out of manifests, journals, receipts, and status output. It verifies hashes, inventory limits, lock ownership, snapshots, payloads, temporary-file and directory identity, append-only journal entries, unfinished markers, and sequenced terminal receipts. It also records the exact filesystem identity and content proof for every canonical temporary artifact before cleanup may trust it. Read-only inventory scans retry only the brief missing-file, live-transition, and temporary lease-replacement states produced by concurrent certification readers; a persistent malformed inventory still fails closed. Dead-lock reclamation or torn-tail repair requires an explicit recovery-capable lock; the store never mutates canonical Markdown itself.",
    rows: [
      {
        id: "knowledge-transaction-store-private-state",
        title: "Private prepared state",
        summary:
          "Captures exact payload bytes and a full source snapshot in a private Git-metadata directory so a prepared change can be rechecked without exposing record contents in routine status output.",
        badgeLabel: "PRIVATE STORE",
        badgeClass: "data-block",
        details: [],
        security: true,
      },
      {
        id: "knowledge-transaction-store-recovery-proof",
        title: "Durable recovery evidence",
        summary:
          "Fsyncs lifecycle and artifact-ownership journal events, retains an unfinished marker until a matching terminal receipt exists, and preserves recovered and later applied outcomes as separate receipt history.",
        badgeLabel: "RECOVERY",
        badgeClass: "code-logic",
        details: [],
      },
      {
        id: "knowledge-transaction-store-publication-identity",
        title: "Identity-checked private publication",
        summary:
          "Rechecks the exact pending file, destination, staging root, and prepared child-directory identities around publication and cleanup so an outside same-looking replacement is preserved and reported instead of removed or adopted.",
        badgeLabel: "IDENTITY GUARD",
        badgeClass: "code-logic",
        details: [],
        security: true,
      },
    ],
    reviewedSource: "Manual review of Git metadata resolution, private permissions, lock and lease acquisition and dead-process recovery, narrowly bounded concurrent inventory retries, persistent malformed-inventory refusal, pending and directory identity checks, snapshot and payload validation, ownership-proof journal schema, unfinished markers, sequenced receipts, status enumeration, and resource limits on August 5, 2026.",
  },
  {
    path: "/scripts/knowledge-records/canonical-files.ts",
    header: scriptHeader,
    metric: "2,851 lines",
    metricDescription: "Exact single-file mutation and reverse-restoration primitives.",
    description:
      "Applies one allowlisted create, update, or remove only when the target's exact bytes and mode match the recorded before state, then uses no-follow inspection, same-directory private artifacts, hard links, directory synchronization, and exact post-operation verification. Before an artifact can lose its last trustworthy witness, it records a transaction-, operation-, role-, path-, inode-, content-, and mode-bound ownership proof in the durable journal. Cleanup preflights the complete artifact set, refuses unfamiliar replacements, and removes nothing whose ownership is uncertain. Recovery reverses only recognized before or after states. Multi-file completion remains logically recoverable rather than one physically indivisible filesystem action.",
    rows: [
      {
        id: "knowledge-canonical-artifact-proof",
        title: "Durable temporary-file ownership",
        summary:
          "A matching journal proof or surviving same-inode hard-link witness is required before cleanup; a same-bytes and same-mode replacement with a different identity is preserved and stops the operation.",
        badgeLabel: "OWNERSHIP PROOF",
        badgeClass: "code-logic",
        details: [],
      },
      {
        id: "knowledge-canonical-platform-limit",
        title: "Fail-closed operating-system limit",
        summary:
          "Standard Node on macOS cannot make every path check and unlink one descriptor-relative conditional syscall. Chronicle narrows and retests that window; if a crash strands an unproved partial or identity becomes uncertain, recovery preserves it and requires intervention instead of guessing.",
        badgeLabel: "KNOWN LIMIT",
        badgeClass: "data-block",
        details: [],
      },
    ],
    reviewedSource: "Manual review of no-follow reads, before/after comparisons, exclusive partial creation, hard-link topology, proof persistence, link/rename/unlink ordering, full cleanup preflight, directory synchronization, reverse restoration, same-looking replacement refusal, and fail-closed residual platform limits.",
  },
  {
    path: "/scripts/knowledge-records/engine.ts",
    header: scriptHeader,
    metric: "1,274 lines",
    metricDescription: "Coordinator for prepare, apply, recovery, and status lifecycles.",
    description:
      "Coordinates the guarded record workflow from a strict request through a full current-working-tree snapshot, semantic candidate validation, private preparation, locked apply, final validation, terminal receipt, and idempotent status. It owns canonical-artifact authority: proof callbacks supplied by tests or callers cannot replace the journal-backed implementation, and a restarted process reconstructs ownership only from validated proof events. Before every record mutation it appends and syncs intent; ordinary failures roll back in reverse order, while explicit recovery resumes interrupted restoration. It enforces closeout's archive, Changelog, then active-removal order without claiming that several filesystem writes are physically indivisible.",
    rows: [
      {
        id: "knowledge-record-engine-preparation",
        title: "Prepare without canonical mutation",
        summary:
          "Rejects future-dated or semantically invalid requests, proves the source inventory did not change during preparation, and records the exact proposed result privately before apply is allowed.",
        badgeLabel: "PREPARE",
        badgeClass: "code-logic",
        details: [],
      },
      {
        id: "knowledge-record-engine-apply-recover",
        title: "Apply, verify, or restore",
        summary:
          "Holds one global lock from stale-state recheck through mutation, final validation, receipt, and marker removal; recovery restores the captured working-tree state and refuses unrelated outside edits.",
        badgeLabel: "GUARDED WRITE",
        badgeClass: "script",
        details: [],
      },
    ],
    reviewedSource: "Manual review of snapshot and package digests, transaction-shape checks, prepare recapture, stale-state refusal, lifecycle and ownership-proof journaling, non-overridable proof authority, canonical mutation order, final semantic validation, automatic rollback, restart recovery, idempotent terminal handling, and status reporting.",
  },
  {
    path: "/scripts/run-with-knowledge-certification-lease.ts",
    header: scriptHeader,
    metric: "265 lines",
    metricDescription: "Full-duration read-only certification wrapper for protected repository commands.",
    description:
      "Acquires a shared certification lease before a supported package check starts, refuses to launch while recovery is required, records a detached protected process group, and keeps the lease until that command actually exits. Multiple readers may run together, but a transaction writer cannot begin over them. If the wrapper dies, the recorded supervisor and process group keep the lease active until the protected work ends, after which a later safe operation can reclaim it.",
    rows: [
      {
        id: "knowledge-certification-full-duration",
        title: "Protection for the entire check",
        summary:
          "The child command starts only after its supervisor identity is durably attached to the lease, preventing a gap where a writer could mistake an active build, test, lint, or validator for a finished reader.",
        badgeLabel: "READ LEASE",
        badgeClass: "code-logic",
        details: [],
      },
    ],
    reviewedSource: "Manual review of argument parsing, lease acquisition, unfinished-state gate, detached supervisor handshake, protected PID and process-group attachment, concurrent-reader retry, signal forwarding, lease release, and exit propagation.",
  },
  {
    path: "/scripts/stage-quality-hub-changelog-migration.mjs",
    header: scriptHeader,
    metric: "394 lines",
    metricDescription: "Private staging command for authenticated Quality Hub Changelog migration exports.",
    description:
      "Validates a downloaded version-one Changelog migration package and its SHA-256 companion, rejects repository-local, linked, aliased, oversized, changed, or malformed inputs, and copies the exact bytes into a unique owner-only directory under macOS Application Support. It verifies the staged files after writing, never overwrites an earlier capture, preserves the source download, and removes incomplete staging output when a safe rollback is possible.",
    rows: [
      {
        id: "quality-hub-migration-private-staging",
        title: "Verified external staging boundary",
        summary:
          "Consumes the JSON and checksum produced by the Quality Hub migration-capture component, proves their byte identity before copying, and keeps the private raw evidence outside the Git repository for later reconciliation.",
        badgeLabel: "PRIVATE STAGING",
        badgeClass: "script",
        details: [
          {
            label: "Producer",
            values: ["/src/features/quality-hub/quality-hub-changelog-migration-capture.tsx"],
            kind: "files",
          },
          {
            label: "Output Modes",
            values: ["directory 0700", "files 0600", "source retained"],
            kind: "plain",
          },
        ],
        security: true,
      },
    ],
    reviewedSource: "Manual review of package and checksum validation, canonical path and symlink rejection, size limits, exclusive owner-only writes, post-write byte verification, source re-read, rollback, CLI output, and failure handling.",
  },
  {
    path: "/scripts/stage-quality-hub-changelog-migration.test.mjs",
    header: testHeader,
    metric: "257 lines",
    metricDescription: "Node integration coverage for private Changelog migration staging.",
    description:
      "Executes the staging CLI against isolated temporary homes and downloads to prove exact-byte copying, owner-only permissions, explicit and adjacent checksum support, repeatable non-overwriting runs, and source preservation. It also verifies fail-closed behavior for repository-local or symbolic-link inputs, checksum mismatches, unsafe directory modes, malformed or unsupported packages, missing companions, and oversized export or checksum files.",
    rows: [],
    reviewedSource: "Manual review of all temporary filesystem fixtures, CLI invocations, success assertions, security and size rejection cases, repeated-run behavior, cleanup, and source-preservation checks.",
  },
  {
    path: "/scripts/reconcile-quality-hub-changelog-migration.ts",
    header: scriptHeader,
    metric: "1,443 lines",
    metricDescription: "Strict reconciliation, privacy-safe transcription, receipt, and verification command for the captured Quality Hub history.",
    description:
      "Reads one exact authenticated migration package outside Git, proves its checksum and captured-source structure, reconciles all 203 identities under the approved owner-union decision, records every seed difference without silently replacing it, classifies Community Gallery applicability, shortens private home-directory prefixes, and prepares one guarded import package containing the legacy Markdown records plus a final receipt. Its verify command compares every canonical byte and filtered Gallery identity back to the approved source package.",
    rows: [],
    reviewedSource: "Manual review of strict package parsing, source-hash comparison, applicability policy, privacy transformation, generated-record validation, receipt binding, private preparation, idempotency, and canonical verification on August 4, 2026.",
  },
  {
    path: "/scripts/run-quality-hub-scan.mjs",
    header: scriptHeader,
    metric: "48 lines",
    metricDescription: "Sequential local quality-scan runner.",
    description:
      "Runs lint, TypeScript, unit tests, the production build, and a production-dependency audit in order with direct process spawning. It stops at the first failed check, prints start and finish times plus per-check results, and exits unsuccessfully when any stage fails. It reports repository health; it does not update Quality Hub findings automatically.",
    rows: [],
    reviewedSource: "Manual review of check list, shell-free process spawning, sequential stop behavior, summary output, and exit code.",
  },
  {
    path: "/scripts/run-validation-gate.ts",
    header: scriptHeader,
    metric: "47 lines",
    metricDescription: "Restricted local entry point for predefined validation-evidence gates.",
    description:
      "Provides a small Node localStorage shim, resolves Chronicle's repository and local evidence roots, accepts one predefined gate ID through the guarded CLI parser, rejects unknown, inactive, and manual gates, and dispatches either the approved Batch 0/Batch 1 fixture runner or the restricted command runner. It preserves the gate result in the process exit code and never accepts an arbitrary shell command.",
    rows: [
      {
        id: "validation-gate-selection",
        title: "Predefined-gate enforcement",
        summary:
          "Loads the registered gate definition and refuses identities or lifecycle states that are not eligible for automated execution.",
        badgeLabel: "GATE LOOKUP",
        badgeClass: "code-logic",
        details: [],
      },
      {
        id: "validation-gate-dispatch",
        title: "Fixture and command dispatch",
        summary:
          "Routes fixture gates to their owned batch harness and command gates to the restricted process runner, records evidence beneath the local evidence root, and propagates failure to the caller.",
        badgeLabel: "LOCAL RUNNER",
        badgeClass: "script",
        details: [],
      },
    ],
    reviewedSource: "Manual review of environment shim, path resolution, CLI parsing, gate guards, fixture dispatch, command dispatch, and exit-code handling.",
  },
  {
    path: "/scripts/verify-prompt-serialization.ts",
    header: scriptHeader,
    metric: "299 lines",
    metricDescription: "Human-readable prompt serialization probe.",
    description:
      "Builds representative story, main-character, user-character, side-character, and custom-section data, calls the real getSystemInstruction renderer, prints selected prompt blocks, and checks that required story, custom-world, character-card, side-character, and user-control content appears. It is a focused development diagnostic with explicit sample data, not a live provider call or full roleplay regression suite.",
    rows: [
      {
        id: "prompt-serialization-fixture",
        title: "Representative prompt fixture",
        summary:
          "Constructs detailed supported fields and freeform sections specifically to make serialization omissions visible in the rendered prompt.",
        badgeLabel: "LOCAL FIXTURE",
        badgeClass: "test",
        details: [],
      },
      {
        id: "prompt-serialization-assertions",
        title: "Required-content assertions",
        summary:
          "Checks section headings, custom-world rows, hardcoded and custom character facts, side-character inclusion, and the user-controlled generation boundary, then exits nonzero if any marker is absent.",
        badgeLabel: "PROMPT CHECK",
        badgeClass: "code-logic",
        details: [],
      },
    ],
    reviewedSource: "Manual review of all fixture builders, prompt extraction, printed blocks, required markers, and failure count.",
  },
  {
    path: "/scripts/write-roleplay-batch0-validation-ledger.ts",
    header: scriptHeader,
    metric: "22 lines",
    metricDescription: "Legacy all-gates Batch 0 evidence writer.",
    description:
      "Adds a Node localStorage shim, invokes the complete Batch 0 roleplay validation harness, prints its pass total, and exits unsuccessfully if any fixture fails. Unlike the per-gate runner, this command executes the whole Batch 0 fixture set and writes its local evidence records through the harness.",
    rows: [],
    reviewedSource: "Manual review of environment shim, Batch 0 invocation, summary output, and failure exit behavior.",
  },
  {
    path: "/scripts/write-roleplay-batch1-validation-ledger.ts",
    header: scriptHeader,
    metric: "22 lines",
    metricDescription: "Legacy all-gates Batch 1 evidence writer.",
    description:
      "Adds a Node localStorage shim, invokes the complete Batch 1 roleplay validation harness, prints its pass total, and exits unsuccessfully if any fixture fails. Unlike the per-gate runner, this command executes the whole Batch 1 fixture set and writes its local evidence records through the harness.",
    rows: [],
    reviewedSource: "Manual review of environment shim, Batch 1 invocation, summary output, and failure exit behavior.",
  },
  {
    path: "/src/App.css",
    header: toolingHeader,
    metric: "42 lines",
    metricDescription: "Unused Vite starter stylesheet retained in the repository.",
    description:
      "Contains the original Vite demo root constraint, logo hover animation, card padding, and read-the-docs color. No source file imports it, so it has no current effect on Chronicle's rendered UI and should not be confused with the active global stylesheet in index.css.",
    rows: [],
    reviewedSource: "Manual review of every selector plus a repository-wide import search confirming no current consumer.",
  },
  {
    path: "/src/pages/style-guide/chronicle-knowledge-base.css",
    header: toolingHeader,
    metric: "453 lines",
    metricDescription: "Scoped responsive presentation for Chronicle Knowledge Base.",
    description:
      "Defines the Knowledge Base's black manual surface, compact tab rails, fixed-height internally scrolling content panels, review metadata, chapter hierarchy, imported-image presentation, source-backed tables, rough-draft box, and responsive behavior. All selectors are scoped beneath the Knowledge Base page so the route does not alter Chronicle runtime screens.",
    rows: [
      {
        id: "knowledge-base-responsive-layout",
        title: "Responsive reading and interaction boundaries",
        summary:
          "Keeps a 1,720-pixel outer layout and 1,080-pixel reading column, scales page and content gutters, moves tabs into a horizontally scrollable row below 760 pixels, preserves horizontally readable source tables, and left-aligns metadata below 460 pixels.",
        badgeLabel: "RESPONSIVE CSS",
        badgeClass: "code-logic",
        details: [],
      },
    ],
    reviewedSource: "Manual review of page scoping, header, layout widths, tabs, panels, metadata, prose, images, tables, rough draft, focus states, and all three responsive breakpoints.",
  },
  {
    path: "/src/components/admin/knowledge-base/changelog-record-list.css",
    header: toolingHeader,
    metric: "127 lines",
    metricDescription: "Shared responsive row layout for canonical Changelog history.",
    description:
      "Styles the same Changelog renderer inside the Chronicle Knowledge Base and Quality Hub. It provides compact date, identity, provenance, title, and outcome columns; visually distinct loading and validation-error states; bounded multi-line outcomes; and a single-column narrow-width layout without creating cards, accordions, progress controls, or a second navigation system.",
    rows: [
      {
        id: "canonical-changelog-responsive-rows",
        title: "Readable shared projection",
        summary:
          "Keeps identifiers on one line at ordinary widths, lets content columns shrink without horizontal page overflow, and stacks each row below 900 pixels while preserving its record order and provenance.",
        badgeLabel: "RESPONSIVE CSS",
        badgeClass: "code-logic",
        details: [
          {
            label: "Consumer",
            values: ["/src/components/admin/knowledge-base/ChangelogRecordList.tsx"],
            kind: "files",
          },
        ],
      },
    ],
    reviewedSource: "Manual review of summary, count, load states, responsive grid, identifier and outcome wrapping, provenance, row separators, and narrow-width behavior on August 5, 2026.",
  },
  {
    path: "/src/App.test.tsx",
    header: testHeader,
    metric: "20 lines",
    metricDescription: "Source-level authorization guard for internal admin routes.",
    description:
      "Reads App.tsx as text and verifies that the shared AdminOnlyRoute exists, checks admin access, caches the result, redirects unauthenticated and unauthorized users, and wraps each standalone Style Guide operator route. This guards route wiring against accidental removal; it does not perform a browser login or prove backend RLS.",
    rows: [],
    reviewedSource: "Manual review of the source fixture and every required authorization and route assertion.",
  },
  {
    path: "/src/App.admin-only-route.test.tsx",
    header: testHeader,
    metric: "138 lines",
    metricDescription: "Behavioral authorization tests for the shared Admin-only route boundary.",
    description:
      "Mounts the same AdminOnlyRoute used by Chronicle's internal tools and verifies that logged-out visitors and authenticated non-admins are redirected, archive content remains withheld during authentication and role resolution, and only a confirmed administrator can render the protected route. It proves the client-side route guard's decisions with mocked authentication and role services; it does not establish backend data secrecy or RLS.",
    rows: [],
    reviewedSource: "Manual review of the authentication states, unresolved role promise, redirect destinations, protected-content assertions, mocked service calls, and Admin success path on August 6, 2026.",
  },
  {
    path: "/src/App.tsx",
    header: {
      label: "REACT COMPONENT",
      className: "component",
      filterValue: "component",
      navAccent: "component",
    },
    metric: "94 lines",
    metricDescription: "Top-level provider, router, and internal-route authorization component.",
    description:
      "Creates the shared React Query client, mounts art-style and tooltip providers, defines public application routes, lazy-loads internal admin documentation pages, and installs the global Sonner toast host. Its AdminOnlyRoute waits for authentication, checks the user's admin role through the app-settings service, caches the result, and redirects non-admin users before rendering Style Guide tools.",
    rows: [
      {
        id: "app-provider-stack",
        title: "Application provider stack",
        summary:
          "Places React Query, art-style state, tooltip behavior, browser routing, suspense, and toast delivery around every route so feature screens share one application shell.",
        badgeLabel: "APP ROOT",
        badgeClass: "component",
        details: [],
      },
      {
        id: "app-admin-routing",
        title: "Admin-only tool boundary",
        summary:
          "Protects Quality Hub, Roleplay Pipeline, App Architecture, Chronicle Knowledge Base, Validation Evidence Ledger, and Supabase Schema Reference routes with the same asynchronous admin-role decision.",
        badgeLabel: "ROUTE GUARD",
        badgeClass: "code-logic",
        details: [],
        security: true,
      },
    ],
    reviewedSource: "Manual review of imports, provider nesting, AdminOnlyRoute state/effect branches, all routes, lazy boundaries, and toast host.",
  },
  {
    path: "/src/constants.tsx",
    header: codeHeader,
    metric: "56 lines",
    metricDescription: "Application model constants and small shared SVG icon components.",
    description:
      "Defines Chronicle's persisted application storage key and version, restricts text generation to the Grok model vocabulary, maps every supported text model to grok-imagine-image, and exports small Users, Globe, MessageSquare, Database, Plus, and Trash icons used by builder and library surfaces. The gateway helpers intentionally return xAI only.",
    rows: [
      {
        id: "constants-model-policy",
        title: "Global model policy",
        summary:
          "Provides the model list and deterministic text-to-image and model-to-gateway helpers consumed by settings, persistence defaults, and normalization code.",
        badgeLabel: "MODEL CONFIG",
        badgeClass: "data-block",
        details: [],
      },
      {
        id: "constants-inline-icons",
        title: "Legacy shared icons",
        summary:
          "Exports six hand-authored SVG React components still consumed by Story Builder, Character Builder, gallery, theme, and image-library controls.",
        badgeLabel: "ICON SET",
        badgeClass: "component",
        details: [],
      },
    ],
    reviewedSource: "Manual review of storage constants, model contract, mapping helpers, and every exported icon component plus current consumers.",
  },
  {
    path: "/src/index.css",
    header: toolingHeader,
    metric: "159 lines",
    metricDescription: "Active global Tailwind entry point and shared design tokens.",
    description:
      "Loads Tailwind's base, component, and utility layers; defines light and dark color tokens plus Chronicle's dark-panel variables; applies global border, background, and text defaults; and provides shared utilities for hidden scrollbars, the animated day/time background, guide-editor syntax colors, and guide table striping. main.tsx imports this file, so its tokens and base rules affect the entire application.",
    rows: [
      {
        id: "index-css-tokens",
        title: "Global design tokens",
        summary:
          "Defines the CSS custom properties used by Tailwind-backed components for backgrounds, text, cards, controls, borders, sidebars, and Chronicle-specific dark UI panels in both themes.",
        badgeLabel: "DESIGN TOKENS",
        badgeClass: "data-block",
        details: [],
      },
      {
        id: "index-css-utilities",
        title: "Shared behavioral styling",
        summary:
          "Owns cross-screen scrollbar suppression, day/time animation, and scoped App Guide editor and table presentation that would otherwise be duplicated in components.",
        badgeLabel: "GLOBAL CSS",
        badgeClass: "code-logic",
        details: [],
      },
    ],
    reviewedSource: "Manual review of Tailwind layers, all token groups, global base rules, custom utilities, animation, and guide-specific scopes.",
  },
  {
    path: "/src/main.tsx",
    header: codeHeader,
    metric: "10 lines",
    metricDescription: "Browser bootstrap entry point.",
    description:
      "Imports the active global stylesheet, finds the root element created by index.html, creates the React 18 root, and renders App inside StrictMode. It is the first application-owned code executed by the browser bundle and contains no routes or business logic itself.",
    rows: [],
    reviewedSource: "Manual review of imports, root lookup, StrictMode wrapper, and render call.",
  },
  {
    path: "/src/test/setup.ts",
    header: testHeader,
    metric: "15 lines",
    metricDescription: "Vitest browser-environment setup.",
    description:
      "Loads Testing Library's DOM matchers and installs a stable matchMedia mock with both modern and legacy listener methods. This prevents component tests from failing merely because jsdom does not implement browser media-query APIs.",
    rows: [],
    reviewedSource: "Manual review of matcher import and the complete matchMedia compatibility object.",
  },
  {
    path: "/src/vite-env.d.ts",
    header: toolingHeader,
    metric: "1 line",
    metricDescription: "Vite ambient TypeScript declarations.",
    description:
      "References Vite's client type definitions so TypeScript understands import.meta environment values and asset-module imports throughout the frontend. It contributes compile-time types only and emits no runtime code.",
    rows: [],
    reviewedSource: "Manual review of the single Vite client type reference.",
  },
  {
    path: "/scripts/generate-roleplay-artifact-identity.mjs",
    header: scriptHeader,
    metric: "126 lines",
    metricDescription: "Build-time generator for frontend and edge roleplay artifact manifests.",
    description:
      "Hashes the exact frontend and Supabase edge-function source files that define the roleplay pipeline, binds those hashes to the latest terminal migration and contract versions, and writes deterministic manifests for runtime identity checks. Check mode compares generated output without changing files, while normal mode refreshes both frontend and edge manifests.",
    rows: [],
    reviewedSource: "Manual review of source ownership lists, SHA-256 generation, terminal-migration lookup, deterministic module serialization, check-only behavior, and both generated destinations.",
  },
]);
