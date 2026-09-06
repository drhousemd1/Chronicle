import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  mkdir,
  mkdtemp,
  realpath,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  CANONICAL_RECORD_DIRECTORY_ENTRIES,
  CHANGELOG_MIGRATION_RECEIPT_RECORD_ID,
  CHANGELOG_MIGRATION_RECEIPT_SOURCE_PATH,
  canonicalRecordSourcePath,
} from "../../../scripts/knowledge-records/path-safety";
import {
  LEGACY_PROVENANCE_LIMIT,
  computeLegacyPayloadHash,
  type LegacyQualityHubPayload,
} from "./changelog-record-contract";
import {
  validateOperationalRecordSources,
  type OperationalRecordSourceMap,
} from "./operational-record-contract";

export const KNOWLEDGE_TRANSACTION_FIXTURE_AS_OF = "2026-08-01";
export const KNOWLEDGE_TRANSACTION_FIXTURE_ISSUE_ID = "CG-ISSUE-001";
export const KNOWLEDGE_TRANSACTION_FIXTURE_CREATED_ISSUE_ID = "CG-ISSUE-002";
export const KNOWLEDGE_TRANSACTION_FIXTURE_PROJECT_ID = "CG-WORK-001";
export const KNOWLEDGE_TRANSACTION_FIXTURE_CREATED_PROJECT_ID = "CG-WORK-002";
export const KNOWLEDGE_TRANSACTION_FIXTURE_KS_PROJECT_ID = "KS-WORK-001";
export const KNOWLEDGE_TRANSACTION_FIXTURE_CHANGE_ID = "CG-CHANGE-001";
export const KNOWLEDGE_TRANSACTION_FIXTURE_ACCEPTED_UPDATE_ID = "CG-UPDATE-001";
export const KNOWLEDGE_TRANSACTION_FIXTURE_LEGACY_ID =
  "LEGACY-QH-cl-fixture-import";
export const KNOWLEDGE_TRANSACTION_FIXTURE_CORRECTION_TARGET_ID =
  "LEGACY-QH-cl-fixture-correction-root";
export const KNOWLEDGE_TRANSACTION_FIXTURE_CORRECTION_ID =
  `${KNOWLEDGE_TRANSACTION_FIXTURE_CORRECTION_TARGET_ID}-COR-001`;

const ISSUE_PATH = canonicalRecordSourcePath(
  "issue",
  KNOWLEDGE_TRANSACTION_FIXTURE_ISSUE_ID,
);
const ACTIVE_PROJECT_PATH = canonicalRecordSourcePath(
  "active-current-work",
  KNOWLEDGE_TRANSACTION_FIXTURE_PROJECT_ID,
);
const ARCHIVED_PROJECT_PATH = canonicalRecordSourcePath(
  "archived-current-work",
  KNOWLEDGE_TRANSACTION_FIXTURE_PROJECT_ID,
);
const ACCEPTED_CHANGE_PATH = canonicalRecordSourcePath(
  "changelog",
  KNOWLEDGE_TRANSACTION_FIXTURE_CHANGE_ID,
);
const SOURCE_REVISION = `sha256:${"c".repeat(64)}`;
const MIGRATION_SNAPSHOT_HASH = "a".repeat(64);
const MIGRATION_SOURCE_HASH = "b".repeat(64);
const ACCEPTED_PROBLEM =
  "The guarded-transaction fixture began with an unresolved structural result.";
const ACCEPTED_WHY_CHANGE_WAS_NEEDED =
  "A guarded closeout must preserve enough narrative to explain why the accepted change was necessary.";
const ACCEPTED_CHANGES =
  "The fixture creates reciprocal accepted-change and archived-work records through the guarded transaction.";
const ACCEPTED_OUTCOME =
  "The disposable guarded-transaction fixture reached its accepted structural result.";
const ACCEPTED_EVIDENCE_SUMMARY =
  "The fixture Product outcome complete proof and reciprocal archive relationship passed validation.";
const ACCEPTED_EVIDENCE_LIMITS =
  "The fixture does not establish unrelated runtime behavior, deployment, or production state.";

function sha256Source(source: string) {
  return createHash("sha256").update(source, "utf8").digest("hex");
}

export type KnowledgeRecordRequestPackage = Readonly<{
  packageRoot: string;
  requestPath: string;
  contentPaths: Readonly<Record<string, string>>;
  cleanup: () => Promise<void>;
}>;

export type KnowledgeRecordTransactionTestRepository = Readonly<{
  repoRoot: string;
  gitDirectory: string;
  issuePath: typeof ISSUE_PATH;
  activeProjectPath: typeof ACTIVE_PROJECT_PATH;
  baselineSources: OperationalRecordSourceMap;
  cleanup: () => Promise<void>;
}>;

function issueFixture({
  id = KNOWLEDGE_TRANSACTION_FIXTURE_ISSUE_ID,
  status = "open",
  lastVerifiedOn = "2026-07-30",
}: {
  id?: string;
  status?: "open" | "resolved";
  lastVerifiedOn?: string;
} = {}) {
  const sourcePath = canonicalRecordSourcePath("issue", id);
  const resolution = status === "resolved"
    ? `
## Resolution

The accepted closeout proves that the required behavior now matches the delivered behavior.
`
    : "";
  return `---
record_type: issue
issue_id: ${id}
title: Gallery transaction fixture discrepancy
owner_capability: community-gallery
status: ${status}
discovered_on: 2026-07-20
last_verified_on: ${lastVerifiedOn}
source_record: ${sourcePath}
---
# ${id}: Gallery transaction fixture discrepancy

## Expected Behavior

The stable Gallery contract requires a visible failure state.

## Problem

### Current Behavior

The fixture records a verified mismatch.

### Why This Is a Problem

The mismatch can mislead the user.

## Evidence and Verification

### Supporting Evidence

Source inspection and a representative delivery-path observation support this fixture.

### What This Evidence Establishes

The named source path contains the verified mismatch.

### What Remains Unverified

Live frequency and any future repair remain unverified.
${resolution}
`;
}

type ProjectFixtureVariant = "baseline" | "project-update" | "closeout";

function projectFixture(
  variant: ProjectFixtureVariant,
  { resolveIssue = false }: { resolveIssue?: boolean } = {},
) {
  const isClosed = variant === "closeout";
  const hasSecondLog = variant !== "baseline";
  const sourcePath = isClosed ? ARCHIVED_PROJECT_PATH : ACTIVE_PROJECT_PATH;
  const workflowState = isClosed ? "Closed" : "Closeout pending";
  const lastActivity = hasSecondLog ? "2026-08-01" : "2026-07-30";
  const secondLog = !hasSecondLog
    ? ""
    : `
### CG-LOG-002 — ${isClosed ? "Decision" : "Validation"} — 2026-08-01

- Authoring task/authority: Phase 4 transaction fixture
- Related Issue/Step/Evidence IDs: CG-ISSUE-001, CG-STEP-001, CG-EV-001
- Source state: fixture-source-state-2
- Action and rationale: ${isClosed ? "Close the fixture through the guarded transaction." : "Append a source-backed project update without rewriting prior history."}
- Affected systems: Disposable operational-record fixture only.
- Result: ${isClosed ? "The accepted result is represented by reciprocal archive and Changelog records." : "The active project now records the next verified transaction step."}
- Proves: The candidate contains an appended history entry and the expected lifecycle facts.
- Does not prove: Chronicle runtime behavior, a real migration, or user acceptance.
- Consequence/next action: ${isClosed ? "Retain the archived fixture as read-only test evidence." : "Continue with the next named fixture validation."}
- Supersedes/Amends/Reopens: None
`;
  const closeout = !isClosed
    ? ""
    : `
## Closeout

- Terminal state: Closed
- Previous workflow state: Closeout pending
- Closeout decision log: CG-LOG-002
- Archived on: 2026-08-01
- Changelog IDs: ${KNOWLEDGE_TRANSACTION_FIXTURE_CHANGE_ID}
- Replacement project: None

### Linked Issue Disposition

| Issue ID | Disposition | Evidence |
|---|---|---|
| ${KNOWLEDGE_TRANSACTION_FIXTURE_ISSUE_ID} | ${resolveIssue ? "resolved" : "remaining"} | CG-EV-001 |
`;

  return `---
record_type: current_work
project_id: ${KNOWLEDGE_TRANSACTION_FIXTURE_PROJECT_ID}
title: Gallery guarded-transaction fixture
origin: verified_issue
owner_capability: community-gallery
related_capabilities: []
linked_issue_ids: [${KNOWLEDGE_TRANSACTION_FIXTURE_ISSUE_ID}]
approved_objective_ref: issue:${KNOWLEDGE_TRANSACTION_FIXTURE_ISSUE_ID}
started: 2026-07-20
source_record: ${sourcePath}
---
# ${KNOWLEDGE_TRANSACTION_FIXTURE_PROJECT_ID}: Gallery guarded-transaction fixture

> Current Work is an operational companion. It does not define intended product behavior or prove that a linked Issue is resolved.

## Current State / Resume Here

### Project and Status

- Project status: ${workflowState}
- Status since: ${isClosed ? "2026-08-01" : "2026-07-25"}
- Last recorded activity: ${lastActivity}
- Current coordinator/task: fixture-coordinator
- Resume priority: ${isClosed ? "Secondary" : "Primary"}

### Resume Point

- Latest completed result: ${isClosed ? "The disposable project has been archived by the tested closeout." : "The disposable project is ready for a guarded transaction."}
- Where work stopped: ${isClosed ? "The guarded closeout completed." : "The disposable project is ready for a guarded transaction."}
- Remaining work: ${isClosed ? "Preserve this archive as test evidence." : "Apply only the next prepared fixture request."}
- Next action: ${isClosed ? "Preserve this archive as test evidence." : "Apply only the next prepared fixture request."}

### Evidence and Uncertainty

- Best current evidence: CG-EV-001
- Not yet proven or needing re-check: This fixture does not establish Chronicle runtime behavior.

### Ownership and Blockers

- Blocking condition: None
- Unblock condition: None
- External decision/action: None
- Status reason: The fixture remains in its explicit transaction state.
- Controlling history entry: ${hasSecondLog ? "CG-LOG-002" : "CG-LOG-001"}

### Source and Reading Order

- Source state to re-check: ${hasSecondLog ? "fixture-source-state-2" : "fixture-source-state-1"}
- Read first: This fixture source and CG-EV-001.
- Scope guard: Do not use this disposable transaction fixture as Chronicle runtime proof.

## Versioned Outcome and Success Contract

- Contract version: 1
- Approval source and date: Phase 4 fixture contract, 2026-07-20
- Implementation authorization: Authorized by the approved governing plan, 2026-07-20
- Governing manual section: Community Gallery operational records
- User-visible outcome: Records remain separate, readable, and truthful.
- Must observe: One authoritative source per record.
- Must not occur: No automatic or partial completion.
- Must not regress: Issue, Current Work, archive, and Changelog authority remain separate.

## Current Verified State

- Linked Issue facts: ${KNOWLEDGE_TRANSACTION_FIXTURE_ISSUE_ID} ${resolveIssue ? "is resolved by the accepted closeout" : "remains open"}.
- Current implementation facts: The fixture exists only in a disposable Git repository.
- Direct observations: The contract parser receives these exact fixture bytes.
- Inferences: None.
- Unknowns: Chronicle runtime behavior is outside this fixture.

## Scope and Decisions

### Included

- Record parsing, guarded updates, and exact recovery.

### Excluded

- Runtime repair, Supabase changes, and production records.

### Dependencies and Related Capabilities

- No external dependency is required.

### Settled Decisions

| Decision | Controlling log ID | Approval authority | Reopen only if |
|---|---|---|---|
| Precedent research is not required for this source-faithful fixture. | CG-LOG-001 | Phase 4 fixture contract | The operational-record contract changes. |

## Traceability Chain

| Link | Current answer |
|---|---|
| User-visible outcome | Accurate operational records. |
| Current behavior or approved change | Approved guarded-transaction contract. |
| Runtime owner | Transaction engine and pure record parser. |
| Enforcement point | Candidate and registry validation. |
| Persistence/state effect | Disposable Markdown fixtures only. |
| Modes/branches | Update, import, correction, and closeout. |
| Delivery surface | Focused filesystem tests. |
| Must observe | Valid sources produce one registry. |
| Must not occur | Invalid or partial sources cannot pass. |
| Required deterministic proof | Failure-injection fixture validation. |
| Required integrated proof | Deferred until the complete command test. |
| Required human proof | Not required for disposable structural fixtures. |

## Work Steps

| Step ID | Vertical result | Step state | Must observe | Must not occur | Delivery path / human review | Result | Proof IDs |
|---|---|---|---|---|---|---|---|
| CG-STEP-001 | Exercise one guarded record transaction. | Concluded | Exact bytes remain recoverable. | No partial source set is certified. | Focused filesystem test; human review is not required. | Fixture result recorded. | CG-EV-001 |

## Proof Claims

### CG-EV-001: The guarded-transaction fixture is structurally valid

- Evidence class or completion level: Product outcome complete
- Result: Passed
- Evidence link: Disposable Phase 4 transaction fixture.
- Repository/external source state: fixture-source-state-1 at ${SOURCE_REVISION}
- Applicability scope: Disposable operational-record fixtures only.
- Positive assertion: The named structure is present and accepted for this fixture.
- Negative assertion: No Chronicle product-runtime claim is made.
- Proves: The parser can enforce the tested structural contract.
- Does not prove: Gallery runtime correctness, a real migration, or final product acceptance.
- Human reviewer/date: Fixture owner, 2026-07-30
- Not-applicable rationale/approval: None.
${closeout}
## Attempt and Decision Log

### CG-LOG-001 — Decision — 2026-07-30

- Authoring task/authority: Phase 4 transaction fixture
- Related Issue/Step/Evidence IDs: CG-ISSUE-001, CG-STEP-001, CG-EV-001
- Source state: fixture-source-state-1
- Action and rationale: Establish one valid precursor record for guarded transaction tests.
- Affected systems: Disposable operational-record fixture only.
- Result: The source is ready for a prepared candidate.
- Proves: The fixture contains the required lifecycle structure.
- Does not prove: Chronicle runtime behavior, a real migration, or user acceptance.
- Consequence/next action: Exercise the requested transaction kind.
- Supersedes/Amends/Reopens: None
${secondLog}`;
}

function projectCreateBaselineFixture() {
  return projectFixture("baseline")
    .replace("origin: verified_issue", "origin: documentation_architecture")
    .replace(
      `linked_issue_ids: [${KNOWLEDGE_TRANSACTION_FIXTURE_ISSUE_ID}]`,
      "linked_issue_ids: []",
    )
    .replace(
      `approved_objective_ref: issue:${KNOWLEDGE_TRANSACTION_FIXTURE_ISSUE_ID}`,
      "approved_objective_ref: fixture:documentation-project",
    )
    .replace("- Resume priority: Primary", "- Resume priority: Secondary")
    .replace(
      `- Linked Issue facts: ${KNOWLEDGE_TRANSACTION_FIXTURE_ISSUE_ID} remains open.`,
      "- Linked Issue facts: This documentation fixture has no linked runtime Issue.",
    );
}

function createdProjectFixture() {
  const projectId = KNOWLEDGE_TRANSACTION_FIXTURE_CREATED_PROJECT_ID;
  return projectFixture("baseline")
    .split(KNOWLEDGE_TRANSACTION_FIXTURE_PROJECT_ID)
    .join(projectId)
    .split("Gallery guarded-transaction fixture")
    .join("Gallery guarded project-create fixture")
    .split("CG-STEP-001")
    .join("CG-STEP-002")
    .split("CG-EV-001")
    .join("CG-EV-002")
    .split("CG-LOG-001")
    .join("CG-LOG-002");
}

function createdKnowledgeSystemProjectFixture() {
  const projectId = KNOWLEDGE_TRANSACTION_FIXTURE_KS_PROJECT_ID;
  const projectPath = canonicalRecordSourcePath("active-current-work", projectId);
  return projectCreateBaselineFixture()
    .split(ACTIVE_PROJECT_PATH)
    .join(projectPath)
    .split(KNOWLEDGE_TRANSACTION_FIXTURE_PROJECT_ID)
    .join(projectId)
    .split("Gallery guarded-transaction fixture")
    .join("Chronicle Knowledge System guarded-transaction fixture")
    .replace("owner_capability: community-gallery", "owner_capability: knowledge-system")
    .replace("related_capabilities: []", "related_capabilities: [community-gallery]")
    .replace("- Resume priority: Secondary", "- Resume priority: Primary")
    .split("CG-STEP-001")
    .join("KS-STEP-001")
    .split("CG-EV-001")
    .join("KS-EV-001")
    .split("CG-LOG-001")
    .join("KS-LOG-001");
}

const LEGACY_PAYLOAD_BASE: LegacyQualityHubPayload = {
  id: "cl-fixture-import",
  title: "Historical Quality Hub fixture",
  summary: "Original fixture summary",
  severity: "fix",
  status: "completed",
  problem: "Original fixture problem",
  plan: "Original fixture plan",
  changes: "Original fixture changes",
  filesAffected: ["src/services/gallery-data.ts"],
  agent: "Fixture agent",
  relatedFindingIds: [],
  relatedRunIds: [],
  tags: ["gallery"],
  comments: [
    {
      id: "fixture-comment-1",
      author: "Fixture owner",
      timestamp: "2026-06-20T12:00:00.000Z",
      text: "Original fixture comment",
    },
  ],
  createdAt: "2026-06-20T12:00:00.000Z",
  updatedAt: "2026-06-20T12:00:00.000Z",
};

function changelogBody(
  id: string,
  title: string,
  headings: readonly string[],
  outcome = "This record has a bounded, source-readable fixture outcome.",
) {
  return `# ${id}: ${title}

## Outcome

${outcome}

## Provenance

The record names the fixture authority that produced it.

## Applicability

The fixture applies only to Community Gallery transaction tests.

${headings
  .map(
    (heading) => `## ${heading}

This section preserves the required ${heading.toLowerCase()} detail.
`,
  )
  .join("\n")}`;
}

function legacyFixture(
  changeId = KNOWLEDGE_TRANSACTION_FIXTURE_LEGACY_ID,
) {
  const originalId = changeId.slice("LEGACY-QH-".length);
  const sourcePath = canonicalRecordSourcePath("changelog", changeId);
  const originalRecord: LegacyQualityHubPayload = {
    ...LEGACY_PAYLOAD_BASE,
    id: originalId,
  };
  const sourceHash = computeLegacyPayloadHash(originalRecord);

  return `---
record_type: changelog
variant: legacy_import
change_id: ${changeId}
title: Historical Quality Hub fixture
change_date: 2026-06-20
outcome: Original fixture summary
provenance: historical-quality-hub
affected_capabilities: [community-gallery]
legacy_source_id: ${originalId}
original_record:
  id: ${originalId}
  title: Historical Quality Hub fixture
  summary: Original fixture summary
  severity: fix
  status: completed
  problem: Original fixture problem
  plan: Original fixture plan
  changes: Original fixture changes
  filesAffected: [src/services/gallery-data.ts]
  agent: Fixture agent
  relatedFindingIds: []
  relatedRunIds: []
  tags: [gallery]
  comments:
    - id: fixture-comment-1
      author: Fixture owner
      timestamp: 2026-06-20T12:00:00.000Z
      text: Original fixture comment
  createdAt: 2026-06-20T12:00:00.000Z
  updatedAt: 2026-06-20T12:00:00.000Z
source_hash: ${sourceHash}
migration_snapshot_hash: ${MIGRATION_SNAPSHOT_HASH}
imported_on: 2026-08-01
source_lineage: [owner-db, local-storage, repository-seed]
migration_receipt: ${CHANGELOG_MIGRATION_RECEIPT_SOURCE_PATH}
applicability_evidence: Reviewed against the synthetic fixture source and Community Gallery contract.
applicability_status: capability-reviewed
gallery_applicability: applicable
provenance_limit: ${LEGACY_PROVENANCE_LIMIT}
modern_acceptance: not_assessed
proof_status: not_reverified
source_record: ${sourcePath}
---
  ${changelogBody(changeId, "Historical Quality Hub fixture", [
    "Original Quality Hub Record",
    "Migration Lineage",
    "Modern Verification Status",
  ], originalRecord.summary)}`;
}

function migrationReceiptFixture(
  changeIds: readonly string[] = [KNOWLEDGE_TRANSACTION_FIXTURE_LEGACY_ID],
) {
  const entries = changeIds
    .map((changeId) => {
      const legacySourceId = changeId.slice("LEGACY-QH-".length);
      const originalRecord: LegacyQualityHubPayload = {
        ...LEGACY_PAYLOAD_BASE,
        id: legacySourceId,
      };
      const selectedHash = computeLegacyPayloadHash(originalRecord);
      const generatedMarkdownSha256 = createHash("sha256")
        .update(legacyFixture(changeId), "utf8")
        .digest("hex");
      return {
        legacySourceId,
        changeId,
        selectedHash,
        generatedMarkdownSha256,
      };
    })
    .sort((left, right) => left.legacySourceId.localeCompare(right.legacySourceId));
  const selectedIdsHash = createHash("sha256")
    .update(JSON.stringify(entries.map((entry) => entry.legacySourceId)))
    .digest("hex");
  const ledger = entries
    .map(
      (entry) => `  - legacy_source_id: ${entry.legacySourceId}
    canonical_change_id: ${entry.changeId}
    owner_db_hash: ${entry.selectedHash}
    local_storage_hash: ${entry.selectedHash}
    repository_seed_hash: ${entry.selectedHash}
    selected_hash: ${entry.selectedHash}
    preserved_record_hash: ${entry.selectedHash}
    generated_markdown_sha256: ${entry.generatedMarkdownSha256}
    source_lineage: [owner-db, local-storage, repository-seed]
    source_difference: exact
    conflict_resolution: identical-across-all-captured-sources
    source_resolution_rationale: All captured fixture sources contain identical payload bytes.
    differing_fields: []
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: applicable
    affected_capabilities: [community-gallery]
    rationale: Reviewed against the synthetic fixture source and Community Gallery contract.
    reviewer: Fixture owner
    import_status: imported`,
    )
    .join("\n");
  return `---
record_type: changelog_migration_receipt
receipt_version: 1
migration_id: qhcm-fixture
source_package_type: chronicle-quality-hub-changelog-migration
source_package_version: 1
source_package_sha256: ${MIGRATION_SNAPSHOT_HASH}
source_revision: fixture-source-revision
source_fingerprint: ${"c".repeat(64)}
source_authority: fixture-owner-review
source_authority_ref: fixture-authority
source_authority_approved_on: 2026-08-01
imported_on: 2026-08-01
provenance_limit: ${LEGACY_PROVENANCE_LIMIT}
source_counts:
  ownerDb: ${entries.length}
  localStorage: ${entries.length}
  repositorySeed: ${entries.length}
source_changelog_hashes:
  ownerDb: ${MIGRATION_SOURCE_HASH}
  localStorage: ${MIGRATION_SOURCE_HASH}
  repositorySeed: ${MIGRATION_SOURCE_HASH}
selected_legacy_ids_sha256: ${selectedIdsHash}
global_legacy_count: ${entries.length}
community_gallery_count: ${entries.length}
non_gallery_count: 0
pending_gallery_count: 0
identical_across_sources_count: ${entries.length}
normalized_optional_difference_count: 0
reviewed_reference_difference_count: 0
reviewed_substantive_collision_count: 0
import_status: imported
entries:
${ledger}
source_record: ${CHANGELOG_MIGRATION_RECEIPT_SOURCE_PATH}
---
# Quality Hub Changelog Legacy Migration Receipt

## Source Authority and Known Limitation

This disposable receipt accounts for every legacy fixture record in one transaction.
`;
}

function correctionFixture() {
  const id = KNOWLEDGE_TRANSACTION_FIXTURE_CORRECTION_ID;
  const sourcePath = canonicalRecordSourcePath("changelog", id);
  const correctedOriginalRecord: LegacyQualityHubPayload = {
    ...LEGACY_PAYLOAD_BASE,
    id: KNOWLEDGE_TRANSACTION_FIXTURE_CORRECTION_TARGET_ID.slice(
      "LEGACY-QH-".length,
    ),
    summary: "The corrected fixture summary remains historical and not reverified.",
  };
  const correctedSourceHash = computeLegacyPayloadHash(correctedOriginalRecord);
  return `---
record_type: changelog
variant: correction
change_id: ${id}
title: Clarify the historical fixture outcome
change_date: 2026-08-01
outcome: The effective legacy fixture now uses the clarified outcome.
provenance: correction
affected_capabilities: [community-gallery]
target_change_id: ${KNOWLEDGE_TRANSACTION_FIXTURE_CORRECTION_TARGET_ID}
correction_sequence: 1
corrected_on: 2026-08-01
correction_authority: Fixture owner approval on 2026-08-01
correction_reason: A later fixture review clarified the outcome wording.
source_revision: ${SOURCE_REVISION}
clarified_fields:
  outcome: The corrected fixture summary remains historical and not reverified.
  original_record:
    id: ${correctedOriginalRecord.id}
    title: ${correctedOriginalRecord.title}
    summary: ${correctedOriginalRecord.summary}
    severity: fix
    status: completed
    problem: Original fixture problem
    plan: Original fixture plan
    changes: Original fixture changes
    filesAffected: [src/services/gallery-data.ts]
    agent: Fixture agent
    relatedFindingIds: []
    relatedRunIds: []
    tags: [gallery]
    comments:
      - id: fixture-comment-1
        author: Fixture owner
        timestamp: 2026-06-20T12:00:00.000Z
        text: Original fixture comment
    createdAt: 2026-06-20T12:00:00.000Z
    updatedAt: 2026-06-20T12:00:00.000Z
  source_hash: ${correctedSourceHash}
source_record: ${sourcePath}
---
# ${id}: Clarify the historical fixture outcome

## Outcome

The effective legacy fixture now uses the clarified outcome.

## Provenance

This append-only fixture correction retains the historical root record.

## Applicability

The fixture applies only to Community Gallery transaction tests.

## Correction Detail

The effective historical outcome receives clarified wording.

## Authority and Reason

### Correction Authority

Fixture owner approval on 2026-08-01

### Correction Reason

A later fixture review clarified the outcome wording.

## Effective Clarification

### Outcome

The corrected fixture summary remains historical and not reverified.
`;
}

function acceptedCloseoutFixture(resolveIssue = false) {
  return `---
record_type: changelog
variant: accepted_closeout
change_id: ${KNOWLEDGE_TRANSACTION_FIXTURE_CHANGE_ID}
title: Gallery guarded-transaction fixture accepted
change_date: 2026-07-30
problem: ${ACCEPTED_PROBLEM}
why_change_was_needed: ${ACCEPTED_WHY_CHANGE_WAS_NEEDED}
changes: ${ACCEPTED_CHANGES}
outcome: ${ACCEPTED_OUTCOME}
accepted_evidence_summary: ${ACCEPTED_EVIDENCE_SUMMARY}
accepted_evidence_limits: ${ACCEPTED_EVIDENCE_LIMITS}
provenance: accepted-closeout
affected_capabilities: [community-gallery]
owning_capability: community-gallery
accepted_on: 2026-07-30
accepted_by: Fixture owner
acceptance_ref: CG-EV-001
source_revision: ${SOURCE_REVISION}
archived_project_id: ${KNOWLEDGE_TRANSACTION_FIXTURE_PROJECT_ID}
archive_record: ${ARCHIVED_PROJECT_PATH}
archive_route: /style-guide/chronicle-knowledge-base/archive/${KNOWLEDGE_TRANSACTION_FIXTURE_PROJECT_ID}
resolved_issue_ids: ${resolveIssue ? `[${KNOWLEDGE_TRANSACTION_FIXTURE_ISSUE_ID}]` : "[]"}
remaining_issue_ids: ${resolveIssue ? "[]" : `[${KNOWLEDGE_TRANSACTION_FIXTURE_ISSUE_ID}]`}
source_record: ${ACCEPTED_CHANGE_PATH}
---
# ${KNOWLEDGE_TRANSACTION_FIXTURE_CHANGE_ID}: Gallery guarded-transaction fixture accepted

## Problem

${ACCEPTED_PROBLEM}

## Why the Change Was Needed

${ACCEPTED_WHY_CHANGE_WAS_NEEDED}

## Changes

${ACCEPTED_CHANGES}

## Outcome

${ACCEPTED_OUTCOME}

## Accepted Evidence Summary

${ACCEPTED_EVIDENCE_SUMMARY}

## Accepted Evidence Limits

${ACCEPTED_EVIDENCE_LIMITS}

## Provenance

This accepted closeout is bound to its guarded transaction fixture.

## Applicability

The fixture applies only to Community Gallery transaction tests.

## Acceptance and Source State

The accepted date, proof, and source revision identify the reviewed fixture result.

## Issue Disposition

Resolved and remaining fixture Issues are declared without overlap.

## Preserved Work Record

The complete fixture project is preserved at ${ARCHIVED_PROJECT_PATH}.
`;
}

function acceptedUpdateFixture() {
  const id = KNOWLEDGE_TRANSACTION_FIXTURE_ACCEPTED_UPDATE_ID;
  const sourcePath = canonicalRecordSourcePath("changelog", id);
  return `---
record_type: changelog
variant: accepted_update
change_id: ${id}
title: Bounded Gallery interaction accepted
change_date: 2026-08-01
why_change_was_needed: The bounded Gallery interaction needed clearer accepted behavior.
changes: The interaction now uses the reviewed bounded behavior.
outcome: The bounded interaction was accepted at the named source state.
accepted_evidence_summary: Focused deterministic checks and direct visual review passed.
accepted_evidence_limits: The evidence covers only this interaction and not unrelated Gallery behavior.
provenance: accepted-update
affected_capabilities: [community-gallery]
owning_capability: community-gallery
accepted_on: 2026-08-01
accepted_by: Chronicle owner
review_method: Focused deterministic checks plus direct visual acceptance.
source_revision: ${SOURCE_REVISION}
workflow_record_context: no_issue_current_work_archive_or_proof_matrix
source_record: ${sourcePath}
---
# ${id}: Bounded Gallery interaction accepted

## Why the Change Was Needed

The bounded Gallery interaction needed clearer accepted behavior.

## Changes

The interaction now uses the reviewed bounded behavior.

## Outcome

The bounded interaction was accepted at the named source state.

## Accepted Evidence Summary

Focused deterministic checks and direct visual review passed.

## Accepted Evidence Limits

The evidence covers only this interaction and not unrelated Gallery behavior.

## Review Method

Focused deterministic checks plus direct visual acceptance.

## Acceptance and Source State

Chronicle owner accepted source revision ${SOURCE_REVISION} on 2026-08-01.

## Operational Record Context

This bounded update did not require or create a Chronicle Issue, Current Work project, proof matrix, archived work record, or closeout transaction.

## Provenance

This is a bounded Accepted Update, not an accepted closeout.

## Applicability

Affected capabilities: community-gallery.
`;
}

function assertValidOperationalSources(
  sources: OperationalRecordSourceMap,
  baselineSources?: OperationalRecordSourceMap,
) {
  const result = validateOperationalRecordSources(sources, {
    asOf: KNOWLEDGE_TRANSACTION_FIXTURE_AS_OF,
    baselineSources,
  });
  if (!result.ok) {
    throw new Error(
      `Invalid Knowledge transaction test fixture:\n${result.errors
        .map((error) => `- ${error}`)
        .join("\n")}`,
    );
  }
}

function baselineSources(): OperationalRecordSourceMap {
  return Object.freeze({
    [ISSUE_PATH]: issueFixture(),
    [ACTIVE_PROJECT_PATH]: projectFixture("baseline"),
  });
}

function projectCreateBaselineSources(): OperationalRecordSourceMap {
  return Object.freeze({
    [ISSUE_PATH]: issueFixture(),
    [ACTIVE_PROJECT_PATH]: projectCreateBaselineFixture(),
  });
}

async function createRequestPackage(
  request: Readonly<Record<string, unknown>>,
  contents: Readonly<Record<string, string>>,
): Promise<KnowledgeRecordRequestPackage> {
  const physicalTemporaryRoot = await realpath(tmpdir());
  const packageRoot = await mkdtemp(
    path.join(physicalTemporaryRoot, "chronicle-knowledge-request-fixture-"),
  );
  const contentDirectory = path.join(packageRoot, "content");
  await mkdir(contentDirectory, { mode: 0o700 });
  const contentPaths: Record<string, string> = {};
  for (const [fileName, source] of Object.entries(contents)) {
    const contentPath = path.join(contentDirectory, fileName);
    await writeFile(contentPath, source, { encoding: "utf8", mode: 0o600 });
    contentPaths[fileName] = contentPath;
  }
  const requestPath = path.join(packageRoot, "request.json");
  await writeFile(requestPath, `${JSON.stringify(request, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });

  return Object.freeze({
    packageRoot,
    requestPath,
    contentPaths: Object.freeze(contentPaths),
    cleanup: () => rm(packageRoot, { recursive: true, force: true }),
  });
}

export async function createKnowledgeRecordTransactionTestRepository(): Promise<KnowledgeRecordTransactionTestRepository> {
  const physicalTemporaryRoot = await realpath(tmpdir());
  const repoRoot = await mkdtemp(
    path.join(physicalTemporaryRoot, "chronicle-knowledge-transaction-fixture-"),
  );
  execFileSync("git", ["init", "-q"], { cwd: repoRoot });
  for (const directory of new Set(
    CANONICAL_RECORD_DIRECTORY_ENTRIES.map((entry) => entry.directory),
  )) {
    await mkdir(path.join(repoRoot, ...directory.split("/")), {
      recursive: true,
    });
  }

  const sources = baselineSources();
  assertValidOperationalSources(sources);
  for (const [sourcePath, source] of Object.entries(sources)) {
    await writeFile(path.join(repoRoot, ...sourcePath.split("/")), source, {
      encoding: "utf8",
      mode: 0o644,
    });
  }

  return Object.freeze({
    repoRoot,
    gitDirectory: path.join(repoRoot, ".git"),
    issuePath: ISSUE_PATH,
    activeProjectPath: ACTIVE_PROJECT_PATH,
    baselineSources: sources,
    cleanup: () => rm(repoRoot, { recursive: true, force: true }),
  });
}

export async function createProjectUpdateRequestPackage() {
  const baseline = baselineSources();
  const updatedProject = projectFixture("project-update");
  assertValidOperationalSources(
    { ...baseline, [ACTIVE_PROJECT_PATH]: updatedProject },
    baseline,
  );
  return createRequestPackage(
    {
      version: 1,
      kind: "project-update",
      as_of: KNOWLEDGE_TRANSACTION_FIXTURE_AS_OF,
      project_id: KNOWLEDGE_TRANSACTION_FIXTURE_PROJECT_ID,
      expected_source_sha256: sha256Source(baseline[ACTIVE_PROJECT_PATH]),
      content_file: `content/${KNOWLEDGE_TRANSACTION_FIXTURE_PROJECT_ID}.md`,
    },
    {
      [`${KNOWLEDGE_TRANSACTION_FIXTURE_PROJECT_ID}.md`]: updatedProject,
    },
  );
}

export async function installProjectCreateBaseline(repoRoot: string) {
  const sources = projectCreateBaselineSources();
  assertValidOperationalSources(sources);
  await writeFile(
    path.join(repoRoot, ...ACTIVE_PROJECT_PATH.split("/")),
    sources[ACTIVE_PROJECT_PATH],
    { encoding: "utf8", mode: 0o644 },
  );
}

export async function createProjectCreateRequestPackage() {
  const baseline = projectCreateBaselineSources();
  const projectId = KNOWLEDGE_TRANSACTION_FIXTURE_CREATED_PROJECT_ID;
  const projectPath = canonicalRecordSourcePath("active-current-work", projectId);
  const createdProject = createdProjectFixture();
  assertValidOperationalSources(
    { ...baseline, [projectPath]: createdProject },
    baseline,
  );
  return createRequestPackage(
    {
      version: 1,
      kind: "project-create",
      as_of: KNOWLEDGE_TRANSACTION_FIXTURE_AS_OF,
      project_id: projectId,
      content_file: `content/${projectId}.md`,
    },
    { [`${projectId}.md`]: createdProject },
  );
}

export async function createKnowledgeSystemProjectCreateRequestPackage() {
  const baseline = projectCreateBaselineSources();
  const projectId = KNOWLEDGE_TRANSACTION_FIXTURE_KS_PROJECT_ID;
  const projectPath = canonicalRecordSourcePath("active-current-work", projectId);
  const createdProject = createdKnowledgeSystemProjectFixture();
  assertValidOperationalSources(
    { ...baseline, [projectPath]: createdProject },
    baseline,
  );
  return createRequestPackage(
    {
      version: 1,
      kind: "project-create",
      as_of: KNOWLEDGE_TRANSACTION_FIXTURE_AS_OF,
      project_id: projectId,
      content_file: `content/${projectId}.md`,
    },
    { [`${projectId}.md`]: createdProject },
  );
}

export async function createIssueCreateRequestPackage() {
  const baseline = baselineSources();
  const issueId = KNOWLEDGE_TRANSACTION_FIXTURE_CREATED_ISSUE_ID;
  const issuePath = canonicalRecordSourcePath("issue", issueId);
  const createdIssue = issueFixture({ id: issueId });
  assertValidOperationalSources(
    { ...baseline, [issuePath]: createdIssue },
    baseline,
  );
  return createRequestPackage(
    {
      version: 1,
      kind: "issue-create",
      as_of: KNOWLEDGE_TRANSACTION_FIXTURE_AS_OF,
      issue_id: issueId,
      content_file: `content/${issueId}.md`,
    },
    { [`${issueId}.md`]: createdIssue },
  );
}

export async function createAcceptedUpdateRequestPackage() {
  const baseline = baselineSources();
  const changeId = KNOWLEDGE_TRANSACTION_FIXTURE_ACCEPTED_UPDATE_ID;
  const changePath = canonicalRecordSourcePath("changelog", changeId);
  const source = acceptedUpdateFixture();
  assertValidOperationalSources(
    { ...baseline, [changePath]: source },
    baseline,
  );
  return createRequestPackage(
    {
      version: 1,
      kind: "accepted-update",
      as_of: KNOWLEDGE_TRANSACTION_FIXTURE_AS_OF,
      change_id: changeId,
      owner_capability: "community-gallery",
      content_file: `content/${changeId}.md`,
    },
    { [`${changeId}.md`]: source },
  );
}

export async function createIssueUpdateRequestPackage() {
  const baseline = baselineSources();
  const updatedIssue = issueFixture({ lastVerifiedOn: "2026-08-01" }).replace(
    "Live frequency and any future repair remain unverified.",
    "Live frequency and any future repair remain unverified; the protected update retains this boundary.",
  );
  assertValidOperationalSources(
    { ...baseline, [ISSUE_PATH]: updatedIssue },
    baseline,
  );
  return createRequestPackage(
    {
      version: 1,
      kind: "issue-update",
      as_of: KNOWLEDGE_TRANSACTION_FIXTURE_AS_OF,
      issue_id: KNOWLEDGE_TRANSACTION_FIXTURE_ISSUE_ID,
      expected_source_sha256: sha256Source(baseline[ISSUE_PATH]),
      content_file: `content/${KNOWLEDGE_TRANSACTION_FIXTURE_ISSUE_ID}.md`,
    },
    { [`${KNOWLEDGE_TRANSACTION_FIXTURE_ISSUE_ID}.md`]: updatedIssue },
  );
}

export async function createIssueUpdateRequestPackageForSource({
  issueId,
  currentSource,
  verificationNote,
}: {
  issueId: string;
  currentSource: string;
  verificationNote: string;
}) {
  const updatedIssue = currentSource
    .replace("last_verified_on: 2026-07-30", "last_verified_on: 2026-08-01")
    .replace(
      "Live frequency and any future repair remain unverified.",
      `Live frequency and any future repair remain unverified; ${verificationNote}`,
    );
  if (updatedIssue === currentSource) {
    throw new Error("Issue update fixture did not change its source.");
  }
  return createRequestPackage(
    {
      version: 1,
      kind: "issue-update",
      as_of: KNOWLEDGE_TRANSACTION_FIXTURE_AS_OF,
      issue_id: issueId,
      expected_source_sha256: sha256Source(currentSource),
      content_file: `content/${issueId}.md`,
    },
    { [`${issueId}.md`]: updatedIssue },
  );
}

function legacyImportFixtureChangeIds(recordCount: number) {
  if (!Number.isInteger(recordCount) || recordCount < 1 || recordCount > 500) {
    throw new Error("Legacy import fixture record count must be an integer from 1 through 500.");
  }
  if (recordCount === 1) {
    return [KNOWLEDGE_TRANSACTION_FIXTURE_LEGACY_ID] as const;
  }
  return Array.from(
    { length: recordCount },
    (_, index) =>
      `${KNOWLEDGE_TRANSACTION_FIXTURE_LEGACY_ID}-${String(index + 1).padStart(3, "0")}`,
  );
}

export async function createLegacyImportRequestPackage(recordCount = 1) {
  const baseline = baselineSources();
  const changeIds = legacyImportFixtureChangeIds(recordCount);
  const legacySources = Object.fromEntries(
    changeIds.map((changeId) => [
      canonicalRecordSourcePath("changelog", changeId),
      legacyFixture(changeId),
    ]),
  );
  const receipt = migrationReceiptFixture(changeIds);
  assertValidOperationalSources(
    { ...baseline, ...legacySources },
    baseline,
  );
  const records = changeIds.map((changeId) => ({
    change_id: changeId,
    content_file: `content/${changeId}.md`,
  }));
  const contents = Object.fromEntries([
    [`${CHANGELOG_MIGRATION_RECEIPT_RECORD_ID}.md`, receipt],
    ...changeIds.map(
      (changeId) => [`${changeId}.md`, legacySources[
        canonicalRecordSourcePath("changelog", changeId)
      ]] as const,
    ),
  ]);
  return createRequestPackage(
    {
      version: 1,
      kind: "legacy-import",
      as_of: KNOWLEDGE_TRANSACTION_FIXTURE_AS_OF,
      receipt_content_file: `content/${CHANGELOG_MIGRATION_RECEIPT_RECORD_ID}.md`,
      records,
    },
    contents,
  );
}

export async function installCorrectionTarget(repoRoot: string) {
  const targetSource = legacyFixture(
    KNOWLEDGE_TRANSACTION_FIXTURE_CORRECTION_TARGET_ID,
  );
  const targetPath = canonicalRecordSourcePath(
    "changelog",
    KNOWLEDGE_TRANSACTION_FIXTURE_CORRECTION_TARGET_ID,
  );
  const sources = { ...baselineSources(), [targetPath]: targetSource };
  assertValidOperationalSources(sources, baselineSources());
  await writeFile(path.join(repoRoot, ...targetPath.split("/")), targetSource, {
    encoding: "utf8",
    mode: 0o644,
    flag: "wx",
  });
  return Object.freeze({ targetPath, targetSource });
}

export async function createCorrectionRequestPackage() {
  const baseline = baselineSources();
  const targetPath = canonicalRecordSourcePath(
    "changelog",
    KNOWLEDGE_TRANSACTION_FIXTURE_CORRECTION_TARGET_ID,
  );
  const targetSource = legacyFixture(
    KNOWLEDGE_TRANSACTION_FIXTURE_CORRECTION_TARGET_ID,
  );
  const correctionPath = canonicalRecordSourcePath(
    "changelog",
    KNOWLEDGE_TRANSACTION_FIXTURE_CORRECTION_ID,
  );
  const correction = correctionFixture();
  const correctionBaseline = { ...baseline, [targetPath]: targetSource };
  assertValidOperationalSources(
    { ...correctionBaseline, [correctionPath]: correction },
    correctionBaseline,
  );
  return createRequestPackage(
    {
      version: 1,
      kind: "correction",
      as_of: KNOWLEDGE_TRANSACTION_FIXTURE_AS_OF,
      target_change_id: KNOWLEDGE_TRANSACTION_FIXTURE_CORRECTION_TARGET_ID,
      correction_sequence: 1,
      content_file: `content/${KNOWLEDGE_TRANSACTION_FIXTURE_CORRECTION_ID}.md`,
    },
    {
      [`${KNOWLEDGE_TRANSACTION_FIXTURE_CORRECTION_ID}.md`]: correction,
    },
  );
}

export async function createCloseoutRequestPackage() {
  const baseline = baselineSources();
  const archivedProject = projectFixture("closeout");
  const acceptedChange = acceptedCloseoutFixture();
  assertValidOperationalSources(
    {
      [ISSUE_PATH]: baseline[ISSUE_PATH],
      [ARCHIVED_PROJECT_PATH]: archivedProject,
      [ACCEPTED_CHANGE_PATH]: acceptedChange,
    },
    baseline,
  );
  return createRequestPackage(
    {
      version: 1,
      kind: "closeout",
      as_of: KNOWLEDGE_TRANSACTION_FIXTURE_AS_OF,
      project_id: KNOWLEDGE_TRANSACTION_FIXTURE_PROJECT_ID,
      change_id: KNOWLEDGE_TRANSACTION_FIXTURE_CHANGE_ID,
      expected_project_sha256: sha256Source(baseline[ACTIVE_PROJECT_PATH]),
      archive_content_file: `content/${KNOWLEDGE_TRANSACTION_FIXTURE_PROJECT_ID}.md`,
      changelog_content_file: `content/${KNOWLEDGE_TRANSACTION_FIXTURE_CHANGE_ID}.md`,
    },
    {
      [`${KNOWLEDGE_TRANSACTION_FIXTURE_PROJECT_ID}.md`]: archivedProject,
      [`${KNOWLEDGE_TRANSACTION_FIXTURE_CHANGE_ID}.md`]: acceptedChange,
    },
  );
}

export async function createResolvedIssueCloseoutRequestPackage() {
  const baseline = baselineSources();
  const resolvedIssue = issueFixture({
    status: "resolved",
    lastVerifiedOn: "2026-08-01",
  });
  const archivedProject = projectFixture("closeout", { resolveIssue: true });
  const acceptedChange = acceptedCloseoutFixture(true);
  assertValidOperationalSources(
    {
      [ISSUE_PATH]: resolvedIssue,
      [ARCHIVED_PROJECT_PATH]: archivedProject,
      [ACCEPTED_CHANGE_PATH]: acceptedChange,
    },
    baseline,
  );
  return createRequestPackage(
    {
      version: 1,
      kind: "closeout",
      as_of: KNOWLEDGE_TRANSACTION_FIXTURE_AS_OF,
      project_id: KNOWLEDGE_TRANSACTION_FIXTURE_PROJECT_ID,
      change_id: KNOWLEDGE_TRANSACTION_FIXTURE_CHANGE_ID,
      expected_project_sha256: sha256Source(baseline[ACTIVE_PROJECT_PATH]),
      archive_content_file: `content/${KNOWLEDGE_TRANSACTION_FIXTURE_PROJECT_ID}.md`,
      changelog_content_file: `content/${KNOWLEDGE_TRANSACTION_FIXTURE_CHANGE_ID}.md`,
      issue_updates: [
        {
          issue_id: KNOWLEDGE_TRANSACTION_FIXTURE_ISSUE_ID,
          expected_source_sha256: sha256Source(baseline[ISSUE_PATH]),
          content_file: `content/${KNOWLEDGE_TRANSACTION_FIXTURE_ISSUE_ID}.md`,
        },
      ],
    },
    {
      [`${KNOWLEDGE_TRANSACTION_FIXTURE_ISSUE_ID}.md`]: resolvedIssue,
      [`${KNOWLEDGE_TRANSACTION_FIXTURE_PROJECT_ID}.md`]: archivedProject,
      [`${KNOWLEDGE_TRANSACTION_FIXTURE_CHANGE_ID}.md`]: acceptedChange,
    },
  );
}
