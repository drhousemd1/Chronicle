import { describe, expect, it } from "vitest";

import { resolveVerifiedChangelogArchiveRoute } from "./changelog-archive-route";
import {
  buildOperationalRecordRegistry,
  compareIssueRecords,
  PROOF_CLASSES,
  PROJECT_WORKFLOW_STATES,
  validateOperationalRecordSources,
  type ProjectWorkflowState,
} from "./operational-record-contract";

const AS_OF = "2026-07-31";
const CHANGE_SOURCE_REVISION = `sha256:${"c".repeat(64)}`;

const issuePath = (id = "CG-ISSUE-001") =>
  `docs/architecture-knowledge/issues/community-gallery/${id}.md`;
const projectOwnerPath = (id: string) =>
  id.startsWith("KS-") ? "knowledge-system" : "community-gallery";
const activePath = (id = "CG-WORK-001") =>
  `docs/current-work/active/${projectOwnerPath(id)}/${id}.md`;
const archivePath = (id = "CG-WORK-001") =>
  `docs/current-work/archive/${projectOwnerPath(id)}/${id}.md`;
const changePath = (id = "CG-CHANGE-001") =>
  `docs/architecture-knowledge/changelog/entries/${id}.md`;

function issueFixture({
  id = "CG-ISSUE-001",
  status = "open",
  discoveredOn = "2026-07-20",
  lastVerifiedOn = "2026-07-30",
  title = "Gallery fixture discrepancy",
}: {
  id?: string;
  status?: "open" | "resolved";
  discoveredOn?: string;
  lastVerifiedOn?: string;
  title?: string;
} = {}) {
  const resolution =
    status === "resolved"
      ? "\n## Resolution\n\nReverification established that the required behavior now matches the current behavior.\n"
      : "";
  return `---
record_type: issue
issue_id: ${id}
title: ${title}
owner_capability: community-gallery
status: ${status}
discovered_on: ${discoveredOn}
last_verified_on: ${lastVerifiedOn}
source_record: ${issuePath(id)}
---
# ${id}: ${title}

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
${resolution}`;
}

type ProjectFixtureOptions = {
  id?: string;
  placement?: "active" | "archive";
  state?: ProjectWorkflowState;
  objective?: string;
  linkedIssueIds?: string[];
  primary?: boolean;
  started?: string;
  statusSince?: string;
  lastActivity?: string;
  logDate?: string;
  proofResult?:
    | "Not run"
    | "Passed"
    | "Failed"
    | "Error"
    | "Needs re-verification"
    | "Not applicable";
  stepState?:
    | "Not started"
    | "In progress"
    | "Blocked"
    | "Awaiting proof"
    | "Concluded"
    | "Superseded";
  replacementProjectId?: string;
  changelogIds?: string[];
  issueDisposition?: "resolved" | "remaining";
  blocker?: string;
  stateReason?: string;
  relatedCapabilities?: string[];
  implementationAuthorization?: string;
  proofClass?: string;
  proofSourceState?: string;
  humanReviewerAndDate?: string;
  completionReviewMode?:
    | "Direct user review"
    | "Evidence-based verification";
  completionAuthorityAndDate?: string;
  evidenceBasedCompletionApproval?: string;
  logType?:
    | "Investigation"
    | "Attempt"
    | "Decision"
    | "Validation"
    | "Playthrough"
    | "Correction"
    | "Handoff"
    | "External Work";
  ownerCapability?: "community-gallery" | "knowledge-system";
};

function projectFixture({
  id = "CG-WORK-001",
  placement = "active",
  state = "Investigating",
  objective = `documentation:${id.toLowerCase()}`,
  linkedIssueIds = [],
  primary = placement === "active",
  started = "2026-07-20",
  statusSince = "2026-07-25",
  lastActivity = "2026-07-30",
  logDate = lastActivity,
  proofResult = "Passed",
  stepState = "Concluded",
  replacementProjectId,
  changelogIds = state === "Closed" ? ["CG-CHANGE-001"] : [],
  issueDisposition = state === "Closed" ? "resolved" : "remaining",
  blocker = state === "Blocked"
    ? "Waiting for named evidence; resume when that evidence is available."
    : "None",
  stateReason = [
    "Blocked",
    "Paused",
    "Deferred",
    "Superseded",
    "Cancelled",
  ].includes(state)
    ? `${state} under controlling entry CG-LOG-001.`
    : `The fixture remains ${state} while its named validation is evaluated.`,
  relatedCapabilities = [],
  implementationAuthorization = [
    "Implementing",
    "Validating",
    "Closeout pending",
    "Closed",
  ].includes(state)
    ? "Authorized by the approved governing plan, 2026-07-20"
    : "Pending explicit implementation authorization.",
  proofClass = state === "Closed"
    ? "Product outcome complete"
    : "Structural validation complete",
  proofSourceState = state === "Closed"
    ? CHANGE_SOURCE_REVISION
    : "fixture-source-state",
  humanReviewerAndDate = state === "Closed"
    ? "Fixture owner, 2026-07-30"
    : "None",
  completionReviewMode,
  completionAuthorityAndDate = "",
  evidenceBasedCompletionApproval = "",
  logType = [
    "Planned",
    "Implementing",
    "Validating",
    "Closeout pending",
    "Closed",
    "Cancelled",
    "Superseded",
  ].includes(state)
    ? "Decision"
    : "Investigation",
  ownerCapability = id.startsWith("KS-")
    ? "knowledge-system"
    : "community-gallery",
}: ProjectFixtureOptions = {}) {
  const sourcePath = placement === "archive" ? archivePath(id) : activePath(id);
  const suffix = id.slice(-3);
  const recordPrefix = id.slice(0, 2);
  const stepId = `${recordPrefix}-STEP-${suffix}`;
  const proofId = `${recordPrefix}-EV-${suffix}`;
  const logId = `${recordPrefix}-LOG-${suffix}`;
  const linkedIssuesYaml = linkedIssueIds.length
    ? `[${linkedIssueIds.join(", ")}]`
    : "[]";
  const proofRationale =
    proofResult === "Not applicable"
      ? "Approved as not applicable by the user because this proof class is outside the structural fixture."
      : "None";
  const closeout =
    placement === "archive"
      ? `
## Closeout

- Terminal state: ${state}
- Previous workflow state: ${state === "Closed" ? "Closeout pending" : "Implementing"}
- Closeout decision log: ${logId}
- Archived on: 2026-07-30
- Changelog IDs: ${changelogIds.length ? changelogIds.join(", ") : "None"}
- Replacement project: ${replacementProjectId ?? "None"}

### Linked Issue Disposition

| Issue ID | Disposition | Evidence |
|---|---|---|
${linkedIssueIds.map((issueId) => `| ${issueId} | ${issueDisposition} | ${proofId} |`).join("\n")}
`
      : "";

  return `---
record_type: current_work
project_id: ${id}
title: Gallery operational-record fixture ${id}
origin: ${linkedIssueIds.length ? "verified_issue" : "documentation_architecture"}
owner_capability: ${ownerCapability}
related_capabilities: [${relatedCapabilities.join(", ")}]
linked_issue_ids: ${linkedIssuesYaml}
approved_objective_ref: ${linkedIssueIds.length ? `issue:${linkedIssueIds[0]}` : objective}
started: ${started}
source_record: ${sourcePath}
---
# ${id}: Gallery operational-record fixture ${id}

> Current Work is an operational companion. It does not define intended product behavior or prove that a linked Issue is resolved.

## Current State / Resume Here

### Project and Status

- Project status: ${state}
- Status since: ${statusSince}
- Last recorded activity: ${lastActivity}
- Current coordinator/task: fixture-coordinator
- Resume priority: ${primary ? "Primary" : "Secondary"}

### Resume Point

- Latest completed result: The fixture record has reached its stated lifecycle condition.
- Where work stopped: The fixture record has reached its stated lifecycle condition.
- Remaining work: Run the next named validation without changing project state automatically.
- Next action: Run the next named validation without changing project state automatically.

### Evidence and Uncertainty

- Best current evidence: ${proofId}
- Not yet proven or needing re-check: Human acceptance remains outside this fixture.

### Ownership and Blockers

- Blocking condition: ${blocker}
- Unblock condition: ${blocker}
- External decision/action: None
- Status reason: ${stateReason.replace("CG-LOG-001", logId)}
- Controlling history entry: ${logId}

### Source and Reading Order

- Source state to re-check: fixture-source-state
- Read first: This fixture source and ${proofId}.
- Scope guard: Do not use this fixture as proof of Chronicle runtime behavior.

## Versioned Outcome and Success Contract

- Contract version: 1
- Approval source and date: Governing plan, 2026-07-20
- Implementation authorization: ${implementationAuthorization}
- Governing manual section: Community Gallery operational records
- User-visible outcome: Records remain separate, readable, and truthful.
- Must observe: One authoritative source per record.
- Must not occur: No automatic completion.
- Must not regress: Seven-tab ownership remains separate.

## Current Verified State

- Linked Issue facts: ${linkedIssueIds.length ? linkedIssueIds.join(", ") : "No linked Issues."}
- Current implementation facts: The fixture exists only in memory.
- Direct observations: The parser receives this exact source.
- Inferences: None.
- Unknowns: Runtime Gallery behavior is outside this fixture.

## Scope and Decisions

### Included

- Record parsing and validation.

### Excluded

- Runtime repair and production records.

### Dependencies and Related Capabilities

- No external dependency is required.

### Settled Decisions

| Decision | Controlling log ID | Approval authority | Reopen only if |
|---|---|---|---|
| Precedent research is not required for this source-faithful fixture. | ${logId} | Governing plan | The governing contract changes. |

## Traceability Chain

| Link | Current answer |
|---|---|
| User-visible outcome | Accurate operational records. |
| Current behavior or approved change | Approved item-6 contract. |
| Runtime owner | Pure record parser. |
| Enforcement point | Registry validation. |
| Persistence/state effect | None; sources are read-only inputs. |
| Modes/branches | Issue, active, archive, Changelog. |
| Delivery surface | Focused unit test. |
| Must observe | Valid sources produce one registry. |
| Must not occur | Invalid sources cannot pass. |
| Required deterministic proof | Fixture validation. |
| Required integrated proof | Deferred until tab wiring. |
| Required human proof | Deferred until pilot acceptance. |

## Work Steps

| Step ID | Vertical result | Step state | Must observe | Must not occur | Delivery path / human review | Result | Proof IDs |
|---|---|---|---|---|---|---|---|
| ${stepId} | Parse the fixture lifecycle. | ${stepState} | Registry state remains separate. | No automatic project transition. | Focused unit test; human review is not required for this structural fixture. | Fixture result recorded. | ${proofId} |

## Proof Claims

### ${proofId}: The fixture contract is structurally valid

- Evidence class or completion level: ${proofClass}
- Result: ${proofResult}
- Evidence link: operational-record-contract.test.ts
- Repository/external source state: ${proofSourceState}
- Applicability scope: In-memory operational-record fixtures only.
- Positive assertion: The named structure is present.
- Negative assertion: No product-runtime claim is made.
- Proves: The parser enforces the tested structural contract.
- Does not prove: Gallery runtime correctness or user acceptance.
- Human reviewer/date: ${humanReviewerAndDate}
${completionReviewMode ? `- Completion review mode: ${completionReviewMode}\n` : ""}${completionAuthorityAndDate ? `- Completion authority/date: ${completionAuthorityAndDate}\n` : ""}${evidenceBasedCompletionApproval ? `- Evidence-based completion approval: ${evidenceBasedCompletionApproval}\n` : ""}- Not-applicable rationale/approval: ${proofRationale}
${closeout}
## Attempt and Decision Log

### ${logId} — ${logType} — ${logDate}

- Authoring task/authority: item-6 fixture
- Related Issue/Step/Evidence IDs: ${stepId}, ${proofId}
- Source state: fixture-source-state
- Action and rationale: Exercise one bounded lifecycle state.
- Affected systems: In-memory fixture only.
- Result: Fixture state recorded.
- Proves: The lifecycle parser received the named state.
- Does not prove: Product behavior or completion.
- Consequence/next action: Evaluate the registry result.
- Supersedes/Amends/Reopens: None
${logType === "Correction" ? "- Correction approval: Approved by the governing authority, 2026-07-30\n" : ""}
`;
}

function appendHandoff(
  source: string,
  {
    sender = "fixture-coordinator",
    recipient = "replacement-coordinator",
    transferredSourceState = "fixture-transferred-source-state",
  }: {
    sender?: string;
    recipient?: string;
    transferredSourceState?: string;
  } = {},
) {
  return source
    .replace(
      "- Last recorded activity: 2026-07-30",
      "- Last recorded activity: 2026-07-31",
    )
    .replace(
      "- Current coordinator/task: fixture-coordinator",
      `- Current coordinator/task: ${recipient}`,
    )
    .replace(
      "- Source state to re-check: fixture-source-state",
      `- Source state to re-check: ${transferredSourceState}`,
    )
    .replace(
      "- Controlling history entry: CG-LOG-001",
      "- Controlling history entry: CG-LOG-002",
    )
    .concat(`
### CG-LOG-002 — Handoff — 2026-07-31

- Sender: ${sender}
- Recipient: ${recipient}
- Transferred source state: ${transferredSourceState}
- Completed work: The first fixture investigation is complete.
- Stopping point: Work stopped after the first fixture result.
- Remaining authorized work: Run the second fixture validation only.
- Evidence limits: Product behavior and human acceptance remain unproved.
- Blockers: None
- Next action: Run the second fixture validation.
- Reading order: Read Resume Here, then CG-LOG-001, then this Handoff.
- Scope guard: Do not change Chronicle runtime behavior.
`);
}

function changelogFixture({
  projectId = "CG-WORK-001",
  resolvedIssueIds = ["CG-ISSUE-001"],
  remainingIssueIds = [] as string[],
}: {
  projectId?: string;
  resolvedIssueIds?: string[];
  remainingIssueIds?: string[];
} = {}) {
  const proofId = `CG-EV-${projectId.slice(-3)}`;
  return `---
record_type: changelog
variant: accepted_closeout
change_id: CG-CHANGE-001
title: Gallery operational-record fixture completed
change_date: 2026-07-30
problem: The operational fixture began with an unresolved structural discrepancy.
why_change_was_needed: Closing the fixture without resolving that discrepancy would leave the accepted result unsupported.
changes: The fixture records reciprocal archive, proof, and Issue disposition relationships.
outcome: The structural fixture closed without claiming untested runtime behavior.
accepted_evidence_summary: The named Product outcome complete proof and reciprocal archive relationship passed.
accepted_evidence_limits: The fixture does not establish untested runtime behavior or deployment state.
provenance: accepted-closeout
affected_capabilities: [community-gallery]
owning_capability: community-gallery
accepted_on: 2026-07-30
accepted_by: Fixture owner
acceptance_ref: ${proofId}
source_revision: ${CHANGE_SOURCE_REVISION}
archived_project_id: ${projectId}
archive_record: ${archivePath(projectId)}
archive_route: /style-guide/chronicle-knowledge-base/archive/${projectId}
resolved_issue_ids: [${resolvedIssueIds.join(", ")}]
remaining_issue_ids: [${remainingIssueIds.join(", ")}]
source_record: ${changePath()}
---
# CG-CHANGE-001: Gallery operational-record fixture completed

## Problem

The operational fixture began with an unresolved structural discrepancy.

## Why the Change Was Needed

Closing the fixture without resolving that discrepancy would leave the accepted result unsupported.

## Changes

The fixture records reciprocal archive, proof, and Issue disposition relationships.

## Outcome

The structural fixture closed without claiming untested runtime behavior.

## Accepted Evidence Summary

The named Product outcome complete proof and reciprocal archive relationship passed.

## Accepted Evidence Limits

The fixture does not establish untested runtime behavior or deployment state.

## Provenance

This is a modern accepted closeout under the Current Work workflow.

## Applicability

This fixture applies to Community Gallery.

## Acceptance and Source State

The named product-outcome proof passed for the recorded source state.

## Issue Disposition

Resolved and remaining Issue IDs are declared in the record identity.

## Evidence and Source State

CG-EV-001 applies only to the in-memory fixture source state.

## Preserved Work Record

The full project is preserved at ${archivePath(projectId)}.
`;
}

function acceptedCorrectionFixture({
  clarifiedSourceRevision,
}: {
  clarifiedSourceRevision?: string;
} = {}) {
  const id = "CG-CHANGE-001-COR-001";
  return `---
record_type: changelog
variant: correction
change_id: ${id}
title: Correct the accepted reviewer
change_date: 2026-07-31
outcome: The effective closeout now names the reviewer recorded by the accepted proof.
provenance: correction
affected_capabilities: [community-gallery]
target_change_id: CG-CHANGE-001
correction_sequence: 1
corrected_on: 2026-07-31
correction_authority: Chronicle owner approval on 2026-07-31
correction_reason: The original closeout named the wrong reviewer.
source_revision: ${CHANGE_SOURCE_REVISION}
clarified_fields:
  accepted_by: Fixture owner
${clarifiedSourceRevision ? `  source_revision: ${clarifiedSourceRevision}\n` : ""}source_record: ${changePath(id)}
---
# ${id}: Correct the accepted reviewer

## Outcome

The effective accepted closeout now matches its proof.

## Provenance

This append-only record corrects one structured field without rewriting history.

## Applicability

This correction applies to Community Gallery.

## Correction Detail

The accepted reviewer is corrected.

## Authority and Reason

### Correction Authority

Chronicle owner approval on 2026-07-31

### Correction Reason

The original closeout named the wrong reviewer.

## Effective Clarification

The effective accepted reviewer is Fixture owner.
`;
}

function validClosedSources() {
  return {
    [issuePath()]: issueFixture({ status: "resolved" }),
    [archivePath()]: projectFixture({
      placement: "archive",
      state: "Closed",
      linkedIssueIds: ["CG-ISSUE-001"],
      primary: false,
    }),
    [changePath()]: changelogFixture(),
  };
}

function smallCurrentWorkFixture({
  route = "local-interaction",
  omitField,
  state = "Implementing",
  blockerOrDecision = "None.",
}: {
  route?: "presentation" | "local-interaction" | "capability-workflow" | "system-critical";
  omitField?: string;
  state?: ProjectWorkflowState;
  blockerOrDecision?: string;
} = {}) {
  const fields = [
    ["Purpose", "Preserve a bounded interaction change long enough for another reader to resume it."],
    ["Objective and scope", "Authorized: update and verify one Gallery interaction under implementation authorization granted on 2026-07-30 by Chronicle owner. Outside: Supabase, deployment, and unrelated Gallery behavior."],
    ["Current status and coordinator", `${state} since 2026-07-30; last activity 2026-07-30; coordinator Main Work; resume priority Primary.`],
    ["Latest verified result", "Source inspection established the exact bounded interaction path."],
    ["Exact next action", "Implement the bounded change and run its focused deterministic checks."],
    ["Blocker or decision", blockerOrDecision],
    ["Strongest evidence and limits", "Source inspection identifies the current path; product behavior is not yet accepted."],
    ["Source state and reading order", "Re-read this record, then inspect the named interaction source before changing it."],
  ].filter(([label]) => label !== omitField);
  return `---
record_type: current_work
current_work_version: 2
workflow_route: ${route}
project_id: CG-WORK-900
title: Bounded Gallery interaction
origin: approved_enhancement
owner_capability: community-gallery
related_capabilities: []
linked_issue_ids: []
approved_objective_ref: approved:bounded-gallery-interaction
started: 2026-07-30
source_record: ${activePath("CG-WORK-900")}
---
# CG-WORK-900: Bounded Gallery interaction

Current Work is an operational companion. Stable capability behavior remains in the Chronicle Knowledge Base manual.

## Current State / Resume Here

${fields.map(([label, value]) => `- ${label}: ${value}`).join("\n")}
`;
}

function systemCriticalCurrentWorkV2Fixture(
  options: ProjectFixtureOptions = {},
) {
  const state = options.state ?? "Implementing";
  const placement = options.placement ?? "active";
  const statusSince = options.statusSince ?? "2026-07-25";
  const lastActivity = options.lastActivity ?? "2026-07-30";
  const primary = options.primary ?? placement === "active";
  const blockerOrDecision = [
    "Blocked",
    "Paused",
    "Deferred",
    "Closed",
    "Cancelled",
    "Superseded",
  ].includes(state)
    ? `The controlling decision placed this project in ${state}.`
    : "None.";
  const fullRecord = projectFixture({ ...options, state, placement }).replace(
    "record_type: current_work\n",
    "record_type: current_work\ncurrent_work_version: 2\nworkflow_route: system-critical\n",
  );
  const resumeStart = fullRecord.indexOf("## Current State / Resume Here");
  const contractStart = fullRecord.indexOf(
    "## Versioned Outcome and Success Contract",
    resumeStart,
  );
  const coreSummary = `## Current State / Resume Here

- Purpose: Preserve the complete system-critical workflow while reducing copied current-state prose.
- Objective and scope: Authorized: validate the complete Route 4 record contract. Outside: product runtime, Supabase, and deployment.
- Current status and coordinator: ${state} since ${statusSince}; last activity ${lastActivity}; coordinator fixture-coordinator; resume priority ${primary ? "Primary" : "Secondary"}.
- Latest verified result: The complete deep modules remain present for validation.
- Exact next action: Run the deep contract and relationship checks.
- Blocker or decision: ${blockerOrDecision}
- Strongest evidence and limits: Structural fixtures cover the record contract but do not prove product behavior.
- Source state and reading order: Read this core summary, then the contract, steps, proofs, and history in order.

`;
  return `${fullRecord.slice(0, resumeStart)}${coreSummary}${fullRecord.slice(contractStart)}`;
}

function appendVersionTwoHandoff(source: string) {
  return source
    .replace(
      "last activity 2026-07-30; coordinator fixture-coordinator",
      "last activity 2026-07-31; coordinator replacement-coordinator",
    )
    .replace(
      "- Source state and reading order: Read this core summary, then the contract, steps, proofs, and history in order.",
      "- Source state and reading order: fixture-transferred-source-state",
    )
    .concat(`

### CG-LOG-002 — Handoff — 2026-07-31

- Sender: fixture-coordinator
- Recipient: replacement-coordinator
- Transferred source state: fixture-transferred-source-state
- Completed work: The first system-critical fixture validation is complete.
- Stopping point: Work stopped after the first fixture result.
- Remaining authorized work: Run the second system-critical fixture validation only.
- Evidence limits: Product behavior and human acceptance remain unproved.
- Blockers: None
- Next action: Run the second system-critical fixture validation.
- Reading order: Read the core summary, CG-LOG-001, then this Handoff.
- Scope guard: Do not change Chronicle runtime behavior.
`);
}

function appendVersionTwoCloseoutDecision(source: string) {
  return source
    .replace(
      "- Closeout decision log: CG-LOG-001",
      "- Closeout decision log: CG-LOG-002",
    )
    .concat(`

### CG-LOG-002 — Decision — 2026-07-30

- Authoring task/authority: item-6 fixture
- Related Issue/Step/Evidence IDs: CG-STEP-001, CG-EV-001
- Source state: fixture-source-state
- Action and rationale: Accept the complete deep fixture closeout.
- Affected systems: In-memory fixture only.
- Result: The deep version 2 project moved into its reciprocal archive.
- Proves: The version 2 archive retains its complete closeout history.
- Does not prove: Product behavior or deployment.
- Consequence/next action: Read the accepted Changelog record for the bounded result.
- Supersedes/Amends/Reopens: None
`);
}

describe("Chronicle operational-record contract", () => {
  it("builds a deterministic, deeply read-only empty registry", () => {
    const registry = buildOperationalRecordRegistry({}, { asOf: AS_OF });

    expect(registry).toEqual({
      asOf: AS_OF,
      issues: [],
      activeProjects: [],
      archivedProjects: [],
      changelogEntries: [],
      changelogRegistry: {
        records: [],
        roots: [],
        corrections: [],
        effectiveEntries: [],
      },
      openIssueCount: 0,
    });
    expect(Object.isFrozen(registry)).toBe(true);
    expect(Object.isFrozen(registry.activeProjects)).toBe(true);
  });

  it("parses the smaller version 2 Current Work core without inventing optional modules", () => {
    const registry = buildOperationalRecordRegistry(
      { [activePath("CG-WORK-900")]: smallCurrentWorkFixture() },
      { asOf: AS_OF },
    );
    const project = registry.activeProjects[0];
    expect(project.currentWorkVersion).toBe(2);
    expect(project.workflowRoute).toBe("local-interaction");
    expect(project.presentModules).toEqual([]);
    expect(project.steps).toEqual([]);
    expect(project.proofs).toEqual([]);
    expect(project.logs).toEqual([]);
    expect(project.coreSummary).toMatchObject({
      purpose: expect.stringContaining("bounded interaction"),
      blockerOrDecision: "None.",
      exactNextAction: expect.stringContaining("focused deterministic checks"),
    });
  });

  it("allows a presentation route only when a separate continuity trigger justified Current Work", () => {
    const registry = buildOperationalRecordRegistry(
      {
        [activePath("CG-WORK-900")]: smallCurrentWorkFixture({
          route: "presentation",
        }),
      },
      { asOf: AS_OF },
    );

    expect(registry.activeProjects[0].workflowRoute).toBe("presentation");
    expect(registry.activeProjects[0].presentModules).toEqual([]);
  });

  it.each(["Paused", "Deferred"] satisfies ProjectWorkflowState[])(
    "keeps %s available in the smaller version 2 contract with an explicit decision",
    (state) => {
      const registry = buildOperationalRecordRegistry(
        {
          [activePath("CG-WORK-900")]: smallCurrentWorkFixture({
            state,
            blockerOrDecision:
              "The product owner deferred this bounded change until the related design decision is settled.",
          }),
        },
        { asOf: AS_OF },
      );

      expect(registry.activeProjects[0].workflowState).toBe(state);
    },
  );

  it("rejects a paused smaller project with no recorded reason", () => {
    const result = validateOperationalRecordSources(
      {
        [activePath("CG-WORK-900")]: smallCurrentWorkFixture({ state: "Paused" }),
      },
      { asOf: AS_OF },
    );

    expect(result.errors.join("\n")).toContain(
      "Paused requires a meaningful blocker or decision in the core summary",
    );
  });

  it("rejects a supposedly resumable small record that omits a core meaning", () => {
    const result = validateOperationalRecordSources(
      {
        [activePath("CG-WORK-900")]: smallCurrentWorkFixture({
          omitField: "Exact next action",
        }),
      },
      { asOf: AS_OF },
    );
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toContain(
      "exactNextAction must be explicit and resumable",
    );
  });

  it("does not let a smaller Implementing project omit dated implementation authority", () => {
    const result = validateOperationalRecordSources(
      {
        [activePath("CG-WORK-900")]: smallCurrentWorkFixture().replace(
          " under implementation authorization granted on 2026-07-30 by Chronicle owner",
          "",
        ),
      },
      { asOf: AS_OF },
    );

    expect(result.errors.join("\n")).toContain(
      "Implementing requires explicit dated implementation authorization in the core scope or optional success-contract module",
    );
  });

  it("does not let a system-critical version 2 project discard its deep modules", () => {
    const result = validateOperationalRecordSources(
      {
        [activePath("CG-WORK-900")]: smallCurrentWorkFixture({
          route: "system-critical",
        }),
      },
      { asOf: AS_OF },
    );
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toContain(
      "system-critical Current Work requires the Work Steps module",
    );
  });

  it("keeps the complete deep contract available to a version 2 system-critical project", () => {
    const registry = buildOperationalRecordRegistry(
      {
        [activePath("CG-WORK-001")]: systemCriticalCurrentWorkV2Fixture(),
      },
      { asOf: AS_OF },
    );
    const project = registry.activeProjects[0];
    expect(project.currentWorkVersion).toBe(2);
    expect(project.workflowRoute).toBe("system-critical");
    expect(project.presentModules).toEqual([
      "Versioned Outcome and Success Contract",
      "Current Verified State",
      "Scope and Decisions",
      "Traceability Chain",
      "Work Steps",
      "Proof Claims",
      "Attempt and Decision Log",
    ]);
    expect(project.steps).toHaveLength(1);
    expect(project.proofs).toHaveLength(1);
    expect(project.logs).toHaveLength(1);
  });

  it("preserves the specialized Handoff contract in a deep version 2 project", () => {
    const baseline = systemCriticalCurrentWorkV2Fixture();
    const result = validateOperationalRecordSources(
      {
        [activePath("CG-WORK-001")]: appendVersionTwoHandoff(baseline),
      },
      {
        asOf: AS_OF,
        baselineSources: { [activePath("CG-WORK-001")]: baseline },
      },
    );

    expect(result.ok, result.errors.join("\n")).toBe(true);
    expect(result.registry.activeProjects[0].activeCoordinator).toBe(
      "replacement-coordinator",
    );
    expect(result.registry.activeProjects[0].logs.at(-1)).toMatchObject({
      type: "Handoff",
      sender: "fixture-coordinator",
      recipient: "replacement-coordinator",
      transferredSourceState: "fixture-transferred-source-state",
    });
  });

  it("keeps a deep version 2 project readable through accepted closeout and archive", () => {
    const active = systemCriticalCurrentWorkV2Fixture({
      state: "Closeout pending",
    });
    const archive = appendVersionTwoCloseoutDecision(
      systemCriticalCurrentWorkV2Fixture({
        placement: "archive",
        state: "Closed",
        primary: false,
      }),
    );
    const result = validateOperationalRecordSources(
      {
        [archivePath("CG-WORK-001")]: archive,
        [changePath()]: changelogFixture({
          resolvedIssueIds: [],
          remainingIssueIds: [],
        }),
      },
      {
        asOf: AS_OF,
        baselineSources: { [activePath("CG-WORK-001")]: active },
      },
    );

    expect(result.ok, result.errors.join("\n")).toBe(true);
    expect(result.registry.archivedProjects[0]).toMatchObject({
      currentWorkVersion: 2,
      workflowRoute: "system-critical",
      workflowState: "Closed",
    });
    const acceptedChange = result.registry.changelogEntries[0];
    expect(acceptedChange.variant).toBe("accepted_closeout");
    if (acceptedChange.variant !== "accepted_closeout") {
      throw new Error("Accepted closeout fixture did not parse");
    }
    expect(acceptedChange.archivedProjectId).toBe("CG-WORK-001");
  });

  it("lets a bounded version 2 project refresh its canonical summary without inventing history", () => {
    const baseline = smallCurrentWorkFixture();
    const current = baseline
      .replace(
        "Source inspection established the exact bounded interaction path.",
        "Focused checks established the bounded interaction result.",
      )
      .replace(
        "Implement the bounded change and run its focused deterministic checks.",
        "Record the accepted bounded update if the owner accepts the result.",
      );
    const result = validateOperationalRecordSources(
      { [activePath("CG-WORK-900")]: current },
      {
        asOf: AS_OF,
        baselineSources: { [activePath("CG-WORK-900")]: baseline },
      },
    );

    expect(result.ok).toBe(true);
  });

  it("still requires a Handoff when the coordinator of a small project changes", () => {
    const baseline = smallCurrentWorkFixture();
    const current = baseline.replace(
      "coordinator Main Work",
      "coordinator Review Work",
    );
    const result = validateOperationalRecordSources(
      { [activePath("CG-WORK-900")]: current },
      {
        asOf: AS_OF,
        baselineSources: { [activePath("CG-WORK-900")]: baseline },
      },
    );

    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toContain(
      "changing Current coordinator/task requires exactly one appended Handoff entry",
    );
  });

  it("recognizes separate Issue, active Current Work, archive, and Changelog sources", () => {
    const sources = {
      ...validClosedSources(),
      [activePath("CG-WORK-002")]: projectFixture({
        id: "CG-WORK-002",
        objective: "documentation:second-fixture",
      }),
    };

    const registry = buildOperationalRecordRegistry(sources, { asOf: AS_OF });

    expect(registry.issues.map((record) => record.id)).toEqual(["CG-ISSUE-001"]);
    expect(registry.activeProjects.map((record) => record.id)).toEqual([
      "CG-WORK-002",
    ]);
    expect(registry.archivedProjects.map((record) => record.id)).toEqual([
      "CG-WORK-001",
    ]);
    expect(registry.changelogEntries.map((record) => record.id)).toEqual([
      "CG-CHANGE-001",
    ]);
    expect(registry.openIssueCount).toBe(0);
  });

  it("returns an archive route only from a validated reciprocal closeout", () => {
    const registry = buildOperationalRecordRegistry(validClosedSources(), {
      asOf: AS_OF,
    });
    const entry = registry.changelogRegistry.effectiveEntries[0];

    expect(resolveVerifiedChangelogArchiveRoute(entry, registry)).toBe(
      "/style-guide/chronicle-knowledge-base/archive/CG-WORK-001",
    );
    expect(
      resolveVerifiedChangelogArchiveRoute(entry, {
        ...registry,
        archivedProjects: [],
      }),
    ).toBeNull();
  });

  it("parses the approved Issue hierarchy into named content fields", () => {
    const registry = buildOperationalRecordRegistry(
      { [issuePath()]: issueFixture() },
      { asOf: AS_OF },
    );

    expect(registry.issues[0].content).toEqual({
      expectedBehavior: "The stable Gallery contract requires a visible failure state.",
      currentBehavior: "The fixture records a verified mismatch.",
      whyThisIsAProblem: "The mismatch can mislead the user.",
      supportingEvidence:
        "Source inspection and a representative delivery-path observation support this fixture.",
      whatThisEvidenceEstablishes:
        "The named source path contains the verified mismatch.",
      whatRemainsUnverified: "Live frequency and any future repair remain unverified.",
      resolution: null,
    });
  });

  it("rejects unlabeled, unexpected, or status-inappropriate Issue sections", () => {
    const unlabeledProblem = validateOperationalRecordSources(
      {
        [issuePath()]: issueFixture().replace(
          "## Problem\n\n### Current Behavior",
          "## Problem\n\nUnlabeled explanation.\n\n### Current Behavior",
        ),
      },
      { asOf: AS_OF },
    );
    expect(unlabeledProblem.errors).toContain(
      `${issuePath()}: "## Problem" must place all content under its named subsections`,
    );

    const unexpectedSubsection = validateOperationalRecordSources(
      {
        [issuePath()]: issueFixture().replace(
          "### What Remains Unverified",
          "### Confidence\n\nHigh.\n\n### What Remains Unverified",
        ),
      },
      { asOf: AS_OF },
    );
    expect(unexpectedSubsection.errors).toContain(
      `${issuePath()}: "## Evidence and Verification" contains unexpected "### Confidence" section`,
    );

    const openResolution = validateOperationalRecordSources(
      {
        [issuePath()]: `${issueFixture()}\n## Resolution\n\nNot accepted.\n`,
      },
      { asOf: AS_OF },
    );
    expect(openResolution.errors).toContain(
      `${issuePath()}: Issue body contains unexpected "## Resolution" section`,
    );
  });

  it("rejects Issue dates after the validation date", () => {
    const futureDiscovery = validateOperationalRecordSources(
      {
        [issuePath()]: issueFixture({
          discoveredOn: "2099-01-01",
          lastVerifiedOn: "2099-01-01",
        }),
      },
      { asOf: AS_OF },
    );
    expect(futureDiscovery.errors).toContain(
      `${issuePath()}: discovered_on 2099-01-01 cannot be after validation date ${AS_OF}`,
    );
    expect(futureDiscovery.errors).toContain(
      `${issuePath()}: last_verified_on 2099-01-01 cannot be after validation date ${AS_OF}`,
    );
  });

  it("orders open Issues before resolved Issues, then by latest verification and stable ID", () => {
    const olderOpen = buildOperationalRecordRegistry(
      {
        [issuePath("CG-ISSUE-002")]: issueFixture({
          id: "CG-ISSUE-002",
          lastVerifiedOn: "2026-07-28",
        }),
      },
      { asOf: AS_OF },
    ).issues[0];
    const newerOpen = buildOperationalRecordRegistry(
      {
        [issuePath("CG-ISSUE-003")]: issueFixture({
          id: "CG-ISSUE-003",
          lastVerifiedOn: "2026-07-30",
        }),
      },
      { asOf: AS_OF },
    ).issues[0];
    const resolved = buildOperationalRecordRegistry(validClosedSources(), {
      asOf: AS_OF,
    }).issues[0];

    expect(
      [olderOpen, resolved, newerOpen]
        .sort(compareIssueRecords)
        .map((issue) => issue.id),
    ).toEqual(["CG-ISSUE-003", "CG-ISSUE-002", "CG-ISSUE-001"]);
  });

  it("parses the grouped Resume Here fields without copying project identity", () => {
    const registry = buildOperationalRecordRegistry(
      { [activePath()]: projectFixture() },
      { asOf: AS_OF },
    );

    expect(registry.activeProjects[0].resumeHere).toEqual({
      projectStatus: "Investigating",
      statusSince: "2026-07-25",
      lastRecordedActivity: "2026-07-30",
      currentCoordinatorTask: "fixture-coordinator",
      resumePriority: "Primary",
      latestCompletedResult:
        "The fixture record has reached its stated lifecycle condition.",
      whereWorkStopped:
        "The fixture record has reached its stated lifecycle condition.",
      remainingWork:
        "Run the next named validation without changing project state automatically.",
      nextAction:
        "Run the next named validation without changing project state automatically.",
      bestCurrentEvidence: "CG-EV-001",
      notYetProvenOrNeedingRecheck:
        "Human acceptance remains outside this fixture.",
      blockingCondition: "None",
      unblockCondition: "None",
      externalDecisionAction: "None",
      statusReason:
        "The fixture remains Investigating while its named validation is evaluated.",
      controllingHistoryEntry: "CG-LOG-001",
      sourceStateToRecheck: "fixture-source-state",
      readFirst: "This fixture source and CG-EV-001.",
      scopeGuard:
        "Do not use this fixture as proof of Chronicle runtime behavior.",
    });
    expect(registry.activeProjects[0].resumeHere).not.toHaveProperty("projectId");
    expect(registry.activeProjects[0].resumeHere).not.toHaveProperty("title");
  });

  it("rejects missing, misplaced, or invented Resume Here fields and groups", () => {
    const missingField = validateOperationalRecordSources(
      {
        [activePath()]: projectFixture().replace(
          "- Remaining work: Run the next named validation without changing project state automatically.\n",
          "",
        ),
      },
      { asOf: AS_OF },
    );
    expect(missingField.errors).toContain(
      `${activePath()}: "Resume Point" requires a non-empty "Remaining work" field`,
    );

    const inventedIdentity = validateOperationalRecordSources(
      {
        [activePath()]: projectFixture().replace(
          "- Project status: Investigating",
          "- Project status: Investigating\n- Project ID: CG-WORK-001",
        ),
      },
      { asOf: AS_OF },
    );
    expect(inventedIdentity.errors).toContain(
      `${activePath()}: "Project and Status" contains unexpected "Project ID" field`,
    );

    const unexpectedGroup = validateOperationalRecordSources(
      {
        [activePath()]: projectFixture().replace(
          "### Resume Point",
          "### Progress Dashboard",
        ),
      },
      { asOf: AS_OF },
    );
    expect(unexpectedGroup.errors).toContain(
      `${activePath()}: "## Current State / Resume Here" contains unexpected "### Progress Dashboard" section`,
    );
  });

  it.each([
    "Investigating",
    "Planned",
    "Implementing",
    "Validating",
    "Blocked",
    "Paused",
    "Deferred",
    "Closeout pending",
  ] satisfies ProjectWorkflowState[])("accepts active %s without changing its state", (state) => {
    const source = projectFixture({ state });
    const registry = buildOperationalRecordRegistry(
      { [activePath()]: source },
      { asOf: AS_OF },
    );
    expect(registry.activeProjects[0].workflowState).toBe(state);
  });

  it("accepts Cancelled and Superseded archive paths without treating them as success", () => {
    const sources = {
      [archivePath()]: projectFixture({
        placement: "archive",
        state: "Cancelled",
        primary: false,
      }),
      [archivePath("CG-WORK-002")]: projectFixture({
        id: "CG-WORK-002",
        placement: "archive",
        state: "Superseded",
        replacementProjectId: "CG-WORK-003",
        primary: false,
      }),
      [activePath("CG-WORK-003")]: projectFixture({
        id: "CG-WORK-003",
        objective: "documentation:replacement",
      }),
    };

    const registry = buildOperationalRecordRegistry(sources, { asOf: AS_OF });
    expect(registry.archivedProjects.map((project) => project.workflowState)).toEqual([
      "Cancelled",
      "Superseded",
    ]);
    expect(registry.changelogEntries).toHaveLength(0);
  });

  it("derives Needs status review at fourteen days without changing workflow state", () => {
    const thirteenDays = buildOperationalRecordRegistry(
      {
        [activePath()]: projectFixture({
          state: "Paused",
          started: "2026-07-01",
          statusSince: "2026-07-18",
          lastActivity: "2026-07-18",
          logDate: "2026-07-18",
        }),
      },
      { asOf: AS_OF },
    );
    const fourteenDays = buildOperationalRecordRegistry(
      {
        [activePath()]: projectFixture({
          state: "Paused",
          started: "2026-07-01",
          statusSince: "2026-07-17",
          lastActivity: "2026-07-17",
          logDate: "2026-07-17",
        }),
      },
      { asOf: AS_OF },
    );

    expect(thirteenDays.activeProjects[0].needsStatusReview).toBe(false);
    expect(fourteenDays.activeProjects[0].needsStatusReview).toBe(true);
    expect(fourteenDays.activeProjects[0].workflowState).toBe("Paused");
  });

  it("rejects future Status since values and status changes after the last recorded activity", () => {
    const futureStatus = validateOperationalRecordSources(
      {
        [activePath()]: projectFixture().replace(
          "- Status since: 2026-07-25",
          "- Status since: 2099-01-01",
        ),
      },
      { asOf: AS_OF },
    );
    expect(futureStatus.errors).toContain(
      `${activePath()}: Status since 2099-01-01 cannot be after validation date ${AS_OF}`,
    );

    const statusAfterActivity = validateOperationalRecordSources(
      {
        [activePath()]: projectFixture().replace(
          "- Status since: 2026-07-25",
          "- Status since: 2026-07-31",
        ),
      },
      { asOf: AS_OF },
    );
    expect(statusAfterActivity.errors).toContain(
      `${activePath()}: Status since 2026-07-31 cannot be after Last recorded activity 2026-07-30`,
    );
  });

  it("keeps stale proof separate from project and Issue state", () => {
    const sources = {
      [issuePath()]: issueFixture({ status: "open" }),
      [activePath()]: projectFixture({
        linkedIssueIds: ["CG-ISSUE-001"],
        proofResult: "Needs re-verification",
      }),
    };
    const registry = buildOperationalRecordRegistry(sources, { asOf: AS_OF });

    expect(registry.issues[0].status).toBe("open");
    expect(registry.activeProjects[0].workflowState).toBe("Investigating");
    expect(registry.activeProjects[0].proofs[0].result).toBe(
      "Needs re-verification",
    );
  });

  it.each([
    {
      name: "filename and identity disagreement",
      sources: { [issuePath("CG-ISSUE-002")]: issueFixture() },
      error: "filename ID CG-ISSUE-002 does not match issue_id CG-ISSUE-001",
    },
    {
      name: "missing required Issue heading",
      sources: {
        [issuePath()]: issueFixture().replace(
          "### Why This Is a Problem",
          "### Impact",
        ),
      },
      error: 'expected exactly one "### Why This Is a Problem" section',
    },
    {
      name: "duplicate Resume Here section",
      sources: {
        [activePath()]: projectFixture().replace(
          "## Versioned Outcome and Success Contract",
          "## Current State / Resume Here\n\n- Duplicate: yes\n\n## Versioned Outcome and Success Contract",
        ),
      },
      error: 'expected exactly one "## Current State / Resume Here" section',
    },
    {
      name: "invalid active terminal placement",
      sources: { [activePath()]: projectFixture({ state: "Closed" }) },
      error: "terminal project state Closed belongs in the archive",
    },
    {
      name: "invalid archived nonterminal placement",
      sources: {
        [archivePath()]: projectFixture({
          placement: "archive",
          state: "Deferred",
          primary: false,
        }),
      },
      error: "archived project must be Closed, Cancelled, or Superseded",
    },
    {
      name: "Blocked without an unblock condition",
      sources: {
        [activePath()]: projectFixture({ state: "Blocked", blocker: "None" }),
      },
      error:
        "Blocked requires separate meaningful Blocking condition and Unblock condition fields",
    },
    {
      name: "Cancelled without a reason and controlling entry",
      sources: {
        [archivePath()]: projectFixture({
          placement: "archive",
          state: "Cancelled",
          primary: false,
          stateReason: "None",
        }),
      },
      error: "Cancelled requires a meaningful Status reason",
    },
    {
      name: "unsupported Work Step state",
      sources: {
        [activePath()]: projectFixture().replace(
          "| CG-STEP-001 | Parse the fixture lifecycle. | Concluded |",
          "| CG-STEP-001 | Parse the fixture lifecycle. | Done |",
        ),
      },
      error: 'unsupported Work Step state "Done"',
    },
    {
      name: "unsupported proof result",
      sources: {
        [activePath()]: projectFixture().replace(
          "- Result: Passed",
          "- Result: Complete",
        ),
      },
      error: 'unsupported proof result "Complete"',
    },
  ])("rejects $name", ({ sources, error }) => {
    const result = validateOperationalRecordSources(sources, { asOf: AS_OF });
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toContain(error);
  });

  it("rejects missing linked Issues and overlapping active objectives", () => {
    const missingIssue = validateOperationalRecordSources(
      {
        [activePath()]: projectFixture({ linkedIssueIds: ["CG-ISSUE-001"] }),
      },
      { asOf: AS_OF },
    );
    expect(missingIssue.errors.join("\n")).toContain(
      "linked Issue CG-ISSUE-001 does not exist",
    );

    const duplicateObjective = validateOperationalRecordSources(
      {
        [activePath()]: projectFixture({ objective: "documentation:same" }),
        [activePath("CG-WORK-002")]: projectFixture({
          id: "CG-WORK-002",
          objective: "documentation:same",
          primary: false,
        }),
      },
      { asOf: AS_OF },
    );
    expect(duplicateObjective.errors.join("\n")).toContain(
      "active objective duplicates",
    );
  });

  it("rejects incomplete or contradictory successful closeout packages", () => {
    const noChangelogSources = validClosedSources();
    delete (noChangelogSources as Partial<typeof noChangelogSources>)[changePath()];
    const noChangelog = validateOperationalRecordSources(noChangelogSources, {
      asOf: AS_OF,
    });
    expect(noChangelog.errors.join("\n")).toContain(
      "Closed archive has no Changelog entry",
    );

    const noArchive = validateOperationalRecordSources(
      {
        [issuePath()]: issueFixture({ status: "resolved" }),
        [changePath()]: changelogFixture(),
      },
      { asOf: AS_OF },
    );
    expect(noArchive.errors.join("\n")).toContain(
      "archived project CG-WORK-001 does not exist",
    );

    const wrongIssueState = validateOperationalRecordSources(
      {
        ...validClosedSources(),
        [issuePath()]: issueFixture({ status: "open" }),
      },
      { asOf: AS_OF },
    );
    expect(wrongIssueState.errors.join("\n")).toContain(
      "CG-ISSUE-001 is listed resolved but remains open",
    );

    const interrupted = validateOperationalRecordSources(
      {
        [activePath()]: projectFixture({ state: "Closeout pending" }),
        [changePath()]: changelogFixture({ resolvedIssueIds: [] }),
      },
      { asOf: AS_OF },
    );
    expect(interrupted.registry.activeProjects[0].workflowState).toBe(
      "Closeout pending",
    );
    expect(interrupted.errors.join("\n")).toContain(
      "archived project CG-WORK-001 does not exist",
    );

    const nonDecisionCloseout = validateOperationalRecordSources(
      {
        ...validClosedSources(),
        [archivePath()]: projectFixture({
          placement: "archive",
          state: "Closed",
          linkedIssueIds: ["CG-ISSUE-001"],
          primary: false,
          logType: "Validation",
        }),
      },
      { asOf: AS_OF },
    );
    expect(nonDecisionCloseout.errors.join("\n")).toContain(
      "Closeout decision log CG-LOG-001 must be a Decision entry",
    );

    const missingBackLink = validateOperationalRecordSources(
      {
        ...validClosedSources(),
        [archivePath()]: projectFixture({
          placement: "archive",
          state: "Closed",
          linkedIssueIds: ["CG-ISSUE-001"],
          primary: false,
        }).replace(
          "- Changelog IDs: CG-CHANGE-001",
          "- Changelog IDs: CG-CHANGE-002",
        ),
      },
      { asOf: AS_OF },
    );
    expect(missingBackLink.errors.join("\n")).toContain(
      "archived project does not link back to CG-CHANGE-001",
    );

    const wrongArchiveOwner = validateOperationalRecordSources(
      {
        ...validClosedSources(),
        [changePath()]: changelogFixture()
          .replace(
            "affected_capabilities: [community-gallery]",
            "affected_capabilities: [account]",
          )
          .replace(
            "owning_capability: community-gallery",
            "owning_capability: account",
          )
          .replace(
            "archive_record: docs/current-work/archive/community-gallery/CG-WORK-001.md",
            "archive_record: docs/current-work/archive/account/CG-WORK-001.md",
          ),
      },
      { asOf: AS_OF },
    );
    expect(wrongArchiveOwner.errors.join("\n")).toContain(
      "archive_record does not resolve to the archived project source",
    );
    expect(wrongArchiveOwner.errors.join("\n")).toContain(
      "owning_capability does not match the archived project",
    );
  });

  it("rejects a future archive date relative to the validation date", () => {
    const futureArchive = validateOperationalRecordSources(
      {
        ...validClosedSources(),
        [archivePath()]: validClosedSources()[archivePath()].replace(
          "- Archived on: 2026-07-30",
          "- Archived on: 2099-01-01",
        ),
      },
      { asOf: AS_OF },
    );

    expect(futureArchive.errors).toContain(
      `${archivePath()}: Closeout archived date 2099-01-01 cannot be after validation date ${AS_OF}`,
    );
  });

  it("requires the accepted Changelog reference to resolve to a Passed product-outcome proof", () => {
    const unresolved = validateOperationalRecordSources(
      {
        ...validClosedSources(),
        [changePath()]: changelogFixture().replace(
          "acceptance_ref: CG-EV-001",
          "acceptance_ref: CG-EV-999",
        ),
      },
      { asOf: AS_OF },
    );
    expect(unresolved.errors.join("\n")).toContain(
      "acceptance_ref CG-EV-999 does not resolve in the archived project",
    );

    const failed = validateOperationalRecordSources(
      {
        ...validClosedSources(),
        [archivePath()]: projectFixture({
          placement: "archive",
          state: "Closed",
          linkedIssueIds: ["CG-ISSUE-001"],
          primary: false,
          proofResult: "Failed",
        }),
      },
      { asOf: AS_OF },
    );
    expect(failed.errors.join("\n")).toContain(
      "acceptance_ref CG-EV-001 must resolve to a Passed proof",
    );

    const wrongClass = validateOperationalRecordSources(
      {
        ...validClosedSources(),
        [archivePath()]: projectFixture({
          placement: "archive",
          state: "Closed",
          linkedIssueIds: ["CG-ISSUE-001"],
          primary: false,
          proofClass: "Structural validation complete",
        }),
      },
      { asOf: AS_OF },
    );
    expect(wrongClass.errors.join("\n")).toContain(
      "acceptance_ref CG-EV-001 must resolve to Product outcome complete proof",
    );

    const noHumanAcceptance = validateOperationalRecordSources(
      {
        ...validClosedSources(),
        [archivePath()]: projectFixture({
          placement: "archive",
          state: "Closed",
          linkedIssueIds: ["CG-ISSUE-001"],
          primary: false,
          humanReviewerAndDate: "Pending final human review, 2026-07-30",
        }),
      },
      { asOf: AS_OF },
    );
    expect(noHumanAcceptance.errors.join("\n")).toContain(
      "Passed Product outcome complete proof requires a meaningful completion authority and valid YYYY-MM-DD completion date",
    );

    const reviewerMismatch = validateOperationalRecordSources(
      {
        ...validClosedSources(),
        [changePath()]: changelogFixture().replace(
          "accepted_by: Fixture owner",
          "accepted_by: Another reviewer",
        ),
      },
      { asOf: AS_OF },
    );
    expect(reviewerMismatch.errors.join("\n")).toContain(
      "accepted_by must match the completion authority on acceptance_ref CG-EV-001",
    );

    const dateMismatch = validateOperationalRecordSources(
      {
        ...validClosedSources(),
        [changePath()]: changelogFixture()
          .replace("change_date: 2026-07-30", "change_date: 2026-07-29")
          .replace("accepted_on: 2026-07-30", "accepted_on: 2026-07-29"),
      },
      { asOf: AS_OF },
    );
    expect(dateMismatch.errors.join("\n")).toContain(
      "accepted_on must match the completion date on acceptance_ref CG-EV-001",
    );

    const revisionMismatch = validateOperationalRecordSources(
      {
        ...validClosedSources(),
        [archivePath()]: projectFixture({
          placement: "archive",
          state: "Closed",
          linkedIssueIds: ["CG-ISSUE-001"],
          primary: false,
          proofSourceState: `sha256:${"d".repeat(64)}`,
        }),
      },
      { asOf: AS_OF },
    );
    expect(revisionMismatch.errors.join("\n")).toContain(
      `source_revision ${CHANGE_SOURCE_REVISION} must appear as an exact token in Repository/external source state for acceptance_ref CG-EV-001`,
    );

    const correctedAcceptance = buildOperationalRecordRegistry(
      {
        ...validClosedSources(),
        [changePath()]: changelogFixture().replace(
          "accepted_by: Fixture owner",
          "accepted_by: Earlier incorrect reviewer",
        ),
        [changePath("CG-CHANGE-001-COR-001")]: acceptedCorrectionFixture(),
      },
      { asOf: AS_OF },
    );
    const effectiveAccepted =
      correctedAcceptance.changelogRegistry.effectiveEntries[0].effectiveRecord;
    expect(effectiveAccepted.variant).toBe("accepted_closeout");
    if (effectiveAccepted.variant !== "accepted_closeout") {
      throw new Error("accepted fixture missing");
    }
    expect(effectiveAccepted.acceptedBy).toBe("Fixture owner");

    const correctedRevision = `sha256:${"d".repeat(64)}`;
    const correctedRevisionMismatch = validateOperationalRecordSources(
      {
        ...validClosedSources(),
        [changePath()]: changelogFixture().replace(
          "accepted_by: Fixture owner",
          "accepted_by: Earlier incorrect reviewer",
        ),
        [changePath("CG-CHANGE-001-COR-001")]: acceptedCorrectionFixture({
          clarifiedSourceRevision: correctedRevision,
        }),
      },
      { asOf: AS_OF },
    );
    expect(correctedRevisionMismatch.errors.join("\n")).toContain(
      `source_revision ${correctedRevision} must appear as an exact token in Repository/external source state for acceptance_ref CG-EV-001`,
    );

    const correctedRevisionMatch = buildOperationalRecordRegistry(
      {
        ...validClosedSources(),
        [archivePath()]: projectFixture({
          placement: "archive",
          state: "Closed",
          linkedIssueIds: ["CG-ISSUE-001"],
          primary: false,
          proofSourceState: `accepted source ${correctedRevision}`,
        }),
        [changePath()]: changelogFixture().replace(
          "accepted_by: Fixture owner",
          "accepted_by: Earlier incorrect reviewer",
        ),
        [changePath("CG-CHANGE-001-COR-001")]: acceptedCorrectionFixture({
          clarifiedSourceRevision: correctedRevision,
        }),
      },
      { asOf: AS_OF },
    );
    const correctedRevisionRecord =
      correctedRevisionMatch.changelogRegistry.effectiveEntries[0]
        .effectiveRecord;
    expect(correctedRevisionRecord.variant).toBe("accepted_closeout");
    if (correctedRevisionRecord.variant !== "accepted_closeout") {
      throw new Error("accepted fixture missing");
    }
    expect(correctedRevisionRecord.sourceRevision).toBe(correctedRevision);
  });

  it("protects existing history with a pure baseline comparison while permitting append-only entries", () => {
    const baseline = { [activePath()]: projectFixture() };
    const appended = projectFixture()
      .replace(
        "- Last recorded activity: 2026-07-30",
        "- Last recorded activity: 2026-07-31",
      )
      .concat(`
### CG-LOG-002 — Validation — 2026-07-31

- Authoring task/authority: item-6 fixture
- Related Issue/Step/Evidence IDs: CG-STEP-001, CG-EV-001
- Source state: fixture-source-state
- Action and rationale: Append a new validation result.
- Affected systems: In-memory fixture only.
- Result: New history appended.
- Proves: Earlier history remains intact.
- Does not prove: Product behavior.
- Consequence/next action: Continue from the new stopping point.
- Supersedes/Amends/Reopens: None
`);
    const appendResult = validateOperationalRecordSources(
      { [activePath()]: appended },
      { asOf: AS_OF, baselineSources: baseline },
    );
    expect(appendResult.ok, appendResult.errors.join("\n")).toBe(true);

    const rewritten = projectFixture().replace(
      "- Result: Fixture state recorded.",
      "- Result: Rewritten old result.",
    );
    const rewriteResult = validateOperationalRecordSources(
      { [activePath()]: rewritten },
      { asOf: AS_OF, baselineSources: baseline },
    );
    expect(rewriteResult.errors.join("\n")).toContain(
      "existing history entry CG-LOG-001 was rewritten",
    );

    const removed = projectFixture().replace(/CG-LOG-001/g, "CG-LOG-002");
    const removalResult = validateOperationalRecordSources(
      { [activePath()]: removed },
      { asOf: AS_OF, baselineSources: baseline },
    );
    expect(removalResult.errors.join("\n")).toContain(
      "existing history entry CG-LOG-001 was removed",
    );
  });

  it("keeps an existing Issue identity date fixed and verification date monotonic", () => {
    const baseline = { [issuePath()]: issueFixture() };
    const changedDiscovery = validateOperationalRecordSources(
      {
        [issuePath()]: issueFixture({ discoveredOn: "2026-07-21" }),
      },
      { asOf: AS_OF, baselineSources: baseline },
    );
    expect(changedDiscovery.errors).toContain(
      `${issuePath()}: discovered_on cannot change after an Issue is created`,
    );

    const olderVerification = validateOperationalRecordSources(
      {
        [issuePath()]: issueFixture({ lastVerifiedOn: "2026-07-29" }),
      },
      { asOf: AS_OF, baselineSources: baseline },
    );
    expect(olderVerification.errors).toContain(
      `${issuePath()}: last_verified_on cannot move backward from 2026-07-30`,
    );

    const newerVerification = validateOperationalRecordSources(
      {
        [issuePath()]: issueFixture({ lastVerifiedOn: "2026-07-31" }),
      },
      { asOf: AS_OF, baselineSources: baseline },
    );
    expect(newerVerification.ok, newerVerification.errors.join("\n")).toBe(true);
  });

  it("requires coordinator changes and specialized Handoff entries to occur together", () => {
    const baseline = { [activePath()]: projectFixture() };
    const validTransfer = validateOperationalRecordSources(
      { [activePath()]: appendHandoff(projectFixture()) },
      { asOf: AS_OF, baselineSources: baseline },
    );
    expect(validTransfer.ok, validTransfer.errors.join("\n")).toBe(true);
    const handoff = validTransfer.registry.activeProjects[0].logs.at(-1);
    expect(handoff?.type).toBe("Handoff");
    if (!handoff || handoff.type !== "Handoff") {
      throw new Error("Handoff fixture did not parse");
    }
    expect(handoff).toMatchObject({
      sender: "fixture-coordinator",
      recipient: "replacement-coordinator",
      transferredSourceState: "fixture-transferred-source-state",
      completedWork: "The first fixture investigation is complete.",
      remainingAuthorizedWork: "Run the second fixture validation only.",
      nextAction: "Run the second fixture validation.",
    });

    const changedWithoutHandoff = validateOperationalRecordSources(
      {
        [activePath()]: projectFixture().replace(
          "- Current coordinator/task: fixture-coordinator",
          "- Current coordinator/task: replacement-coordinator",
        ),
      },
      { asOf: AS_OF, baselineSources: baseline },
    );
    expect(changedWithoutHandoff.errors).toContain(
      `${activePath()}: changing Current coordinator/task requires exactly one appended Handoff entry`,
    );

    const handoffWithoutChange = validateOperationalRecordSources(
      {
        [activePath()]: appendHandoff(projectFixture()).replace(
          "- Current coordinator/task: replacement-coordinator",
          "- Current coordinator/task: fixture-coordinator",
        ),
      },
      { asOf: AS_OF, baselineSources: baseline },
    );
    expect(handoffWithoutChange.errors).toContain(
      `${activePath()}: an appended Handoff requires Current coordinator/task to change in the same protected update`,
    );
  });

  it("binds a Handoff sender, recipient, and transferred source state to Resume Here", () => {
    const baseline = { [activePath()]: projectFixture() };
    const wrongSender = validateOperationalRecordSources(
      {
        [activePath()]: appendHandoff(projectFixture(), {
          sender: "different-sender",
        }),
      },
      { asOf: AS_OF, baselineSources: baseline },
    );
    expect(wrongSender.errors).toContain(
      `${activePath()}: Handoff CG-LOG-002 Sender must match the previous coordinator`,
    );

    const mismatchedSource = validateOperationalRecordSources(
      {
        [activePath()]: appendHandoff(projectFixture()).replace(
          "- Transferred source state: fixture-transferred-source-state",
          "- Transferred source state: stale-source-state",
        ),
      },
      { asOf: AS_OF, baselineSources: baseline },
    );
    expect(mismatchedSource.errors).toContain(
      `${activePath()}: Handoff CG-LOG-002 Transferred source state must match Resume Here`,
    );

    const missingReadingOrder = validateOperationalRecordSources(
      {
        [activePath()]: appendHandoff(projectFixture()).replace(
          "- Reading order: Read Resume Here, then CG-LOG-001, then this Handoff.\n",
          "",
        ),
      },
      { asOf: AS_OF, baselineSources: baseline },
    );
    expect(missingReadingOrder.errors).toContain(
      `${activePath()}: "CG-LOG-002 — Handoff — 2026-07-31" requires a non-empty "Reading order" field`,
    );
  });

  it("validates a staged Closed archive against the actual active baseline state", () => {
    const result = validateOperationalRecordSources(validClosedSources(), {
      asOf: AS_OF,
      baselineSources: {
        [activePath()]: projectFixture({ state: "Implementing" }),
      },
    });

    expect(result.errors).toContain(
      `${archivePath()}: Closeout previous workflow state Closeout pending does not match baseline active state Implementing`,
    );
    expect(result.errors).toContain(
      `${archivePath()}: Closed is reachable only from an active Closeout pending baseline`,
    );
  });

  it("does not mutate project state when every Work Step is Concluded", () => {
    const registry = buildOperationalRecordRegistry(
      { [activePath()]: projectFixture({ state: "Implementing" }) },
      { asOf: AS_OF },
    );
    expect(registry.activeProjects[0].steps[0].state).toBe("Concluded");
    expect(registry.activeProjects[0].workflowState).toBe("Implementing");
  });

  it("enforces globally unique Step, Evidence, and Log IDs across projects", () => {
    const duplicateNestedIds = projectFixture({
      id: "CG-WORK-002",
      objective: "documentation:second-fixture",
      primary: false,
    })
      .replace(/CG-STEP-002/g, "CG-STEP-001")
      .replace(/CG-EV-002/g, "CG-EV-001")
      .replace(/CG-LOG-002/g, "CG-LOG-001");

    const result = validateOperationalRecordSources(
      {
        [activePath()]: projectFixture(),
        [activePath("CG-WORK-002")]: duplicateNestedIds,
      },
      { asOf: AS_OF },
    );

    expect(result.errors.join("\n")).toContain(
      "duplicate nested record ID CG-STEP-001",
    );
    expect(result.errors.join("\n")).toContain(
      "duplicate nested record ID CG-EV-001",
    );
    expect(result.errors.join("\n")).toContain(
      "duplicate nested record ID CG-LOG-001",
    );
  });

  it("validates related capability identity and exclusive active Issue ownership", () => {
    const invalidRelated = validateOperationalRecordSources(
      {
        [activePath()]: projectFixture({
          relatedCapabilities: [
            "community-gallery",
            "chat-interface",
            "chat-interface",
            "fabricated-capability",
          ],
        }),
      },
      { asOf: AS_OF },
    );
    expect(invalidRelated.errors.join("\n")).toContain(
      "related capability cannot repeat owner community-gallery",
    );
    expect(invalidRelated.errors.join("\n")).toContain(
      "related_capabilities contains duplicates: chat-interface",
    );
    expect(invalidRelated.errors.join("\n")).toContain(
      "unsupported related capability fabricated-capability",
    );

    const duplicateIssueOwner = validateOperationalRecordSources(
      {
        [issuePath()]: issueFixture(),
        [activePath()]: projectFixture({ linkedIssueIds: ["CG-ISSUE-001"] }),
        [activePath("CG-WORK-002")]: projectFixture({
          id: "CG-WORK-002",
          linkedIssueIds: ["CG-ISSUE-001"],
          primary: false,
        }).replace(
          "approved_objective_ref: issue:CG-ISSUE-001",
          "approved_objective_ref: audit:duplicate-owner-fixture",
        ),
      },
      { asOf: AS_OF },
    );
    expect(duplicateIssueOwner.errors.join("\n")).toContain(
      "linked Issue CG-ISSUE-001 is already owned by active project CG-WORK-001",
    );
  });

  it("accepts a Secondary documentation project beside one Primary verified-Issue project", () => {
    const registry = buildOperationalRecordRegistry(
      {
        [issuePath()]: issueFixture(),
        [activePath()]: projectFixture({
          objective: "documentation:community-gallery-pilot",
          primary: false,
        }),
        [activePath("CG-WORK-002")]: projectFixture({
          id: "CG-WORK-002",
          state: "Planned",
          linkedIssueIds: ["CG-ISSUE-001"],
          primary: true,
          proofResult: "Not run",
          stepState: "Not started",
        }),
      },
      { asOf: AS_OF },
    );

    expect(registry.activeProjects.map((project) => project.id)).toEqual([
      "CG-WORK-002",
      "CG-WORK-001",
    ]);
    expect(registry.activeProjects[0]).toMatchObject({
      id: "CG-WORK-002",
      primaryResumeTarget: true,
      linkedIssueIds: ["CG-ISSUE-001"],
    });
  });

  it("validates one Primary Knowledge System project beside the Secondary Gallery pilot", () => {
    const ksProjectId = "KS-WORK-001";
    const result = validateOperationalRecordSources(
      {
        [activePath("CG-WORK-001")]: projectFixture({
          id: "CG-WORK-001",
          primary: false,
        }),
        [activePath(ksProjectId)]: projectFixture({
          id: ksProjectId,
          state: "Planned",
          stepState: "Not started",
          proofResult: "Not run",
          primary: true,
          relatedCapabilities: ["community-gallery"],
        }),
      },
      { asOf: AS_OF },
    );

    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.registry.activeProjects.map((project) => project.id)).toEqual([
      "KS-WORK-001",
      "CG-WORK-001",
    ]);
    expect(result.registry.activeProjects[0]).toMatchObject({
      ownerCapability: "knowledge-system",
      primaryResumeTarget: true,
    });
    expect(result.registry.activeProjects[1]).toMatchObject({
      ownerCapability: "community-gallery",
      primaryResumeTarget: false,
    });
  });

  it("rejects unsupported, wrong-prefix, wrong-owner, and wrong-path Knowledge System records", () => {
    const validKs = projectFixture({
      id: "KS-WORK-001",
      state: "Planned",
      stepState: "Not started",
      proofResult: "Not run",
      relatedCapabilities: ["community-gallery"],
    });

    const wrongOwner = validateOperationalRecordSources(
      {
        [activePath("KS-WORK-001")]: validKs.replace(
          "owner_capability: knowledge-system",
          "owner_capability: community-gallery",
        ),
      },
      { asOf: AS_OF },
    );
    expect(wrongOwner.ok).toBe(false);
    expect(wrongOwner.errors.join("\n")).toMatch(/belongs to knowledge-system/);

    const wrongNestedPrefix = validateOperationalRecordSources(
      {
        [activePath("KS-WORK-001")]: validKs
          .split("KS-STEP-001")
          .join("CG-STEP-001"),
      },
      { asOf: AS_OF },
    );
    expect(wrongNestedPrefix.ok).toBe(false);
    expect(wrongNestedPrefix.errors.join("\n")).toMatch(/invalid Step ID/);

    const wrongPath = validateOperationalRecordSources(
      {
        "docs/current-work/active/community-gallery/KS-WORK-001.md": validKs,
      },
      { asOf: AS_OF },
    );
    expect(wrongPath.ok).toBe(false);
    expect(wrongPath.errors.join("\n")).toMatch(/does not match the canonical/);

    const unsupported = validateOperationalRecordSources(
      {
        "docs/current-work/active/knowledge-system/XY-WORK-001.md": validKs
          .split("KS-WORK-001")
          .join("XY-WORK-001")
          .split("KS-STEP-001")
          .join("XY-STEP-001")
          .split("KS-EV-001")
          .join("XY-EV-001")
          .split("KS-LOG-001")
          .join("XY-LOG-001"),
      },
      { asOf: AS_OF },
    );
    expect(unsupported.ok).toBe(false);
    expect(unsupported.errors.join("\n")).toMatch(/approved operational project/);
  });

  it("rejects the same Knowledge System project ID in active and archive paths", () => {
    const projectId = "KS-WORK-001";
    const result = validateOperationalRecordSources(
      {
        [activePath(projectId)]: projectFixture({
          id: projectId,
          state: "Planned",
          stepState: "Not started",
          proofResult: "Not run",
          primary: true,
          relatedCapabilities: ["community-gallery"],
        }),
        [archivePath(projectId)]: projectFixture({
          id: projectId,
          placement: "archive",
          state: "Cancelled",
          primary: false,
          relatedCapabilities: ["community-gallery"],
        }),
      },
      { asOf: AS_OF },
    );

    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toContain(
      `duplicate record ID ${projectId}`,
    );
  });

  it("treats one active project as implicitly primary and orders multiple projects deterministically", () => {
    const singleton = buildOperationalRecordRegistry(
      { [activePath()]: projectFixture({ primary: false }) },
      { asOf: AS_OF },
    );
    expect(singleton.activeProjects).toHaveLength(1);
    expect(singleton.activeProjects[0].primaryResumeTarget).toBe(true);

    const ordered = buildOperationalRecordRegistry(
      {
        [activePath()]: projectFixture({
          state: "Paused",
          primary: true,
          statusSince: "2026-07-20",
          lastActivity: "2026-07-20",
          logDate: "2026-07-20",
        }),
        [activePath("CG-WORK-002")]: projectFixture({
          id: "CG-WORK-002",
          state: "Implementing",
          primary: false,
          lastActivity: "2026-07-28",
          logDate: "2026-07-28",
        }),
        [activePath("CG-WORK-003")]: projectFixture({
          id: "CG-WORK-003",
          state: "Validating",
          primary: false,
          lastActivity: "2026-07-29",
          logDate: "2026-07-29",
        }),
        [activePath("CG-WORK-004")]: projectFixture({
          id: "CG-WORK-004",
          state: "Investigating",
          primary: false,
          lastActivity: "2026-07-30",
          logDate: "2026-07-30",
        }),
      },
      { asOf: AS_OF },
    );
    expect(ordered.activeProjects.map((project) => project.id)).toEqual([
      "CG-WORK-001",
      "CG-WORK-002",
      "CG-WORK-003",
      "CG-WORK-004",
    ]);

    const noExplicitPrimary = validateOperationalRecordSources(
      {
        [activePath()]: projectFixture({ primary: false }),
        [activePath("CG-WORK-002")]: projectFixture({
          id: "CG-WORK-002",
          primary: false,
        }),
      },
      { asOf: AS_OF },
    );
    expect(noExplicitPrimary.errors.join("\n")).toContain(
      "expected exactly one primary resume project, found 0",
    );
  });

  it("uses the complete approved Current Work state order after the primary project", () => {
    const orderedStates = [
      "Implementing",
      "Validating",
      "Investigating",
      "Planned",
      "Blocked",
      "Paused",
      "Deferred",
      "Closeout pending",
    ] satisfies ProjectWorkflowState[];
    const sources = Object.fromEntries(
      orderedStates.map((state, index) => {
        const suffix = String(index + 1).padStart(3, "0");
        const id = `CG-WORK-${suffix}`;
        return [
          activePath(id),
          projectFixture({
            id,
            state,
            primary: state === "Closeout pending",
          }),
        ];
      }),
    );

    const registry = buildOperationalRecordRegistry(sources, { asOf: AS_OF });
    expect(registry.activeProjects.map((project) => project.workflowState)).toEqual([
      "Closeout pending",
      "Implementing",
      "Validating",
      "Investigating",
      "Planned",
      "Blocked",
      "Paused",
      "Deferred",
    ]);
  });

  it("uses most recent Last Activity and then stable ID within the same state", () => {
    const registry = buildOperationalRecordRegistry(
      {
        [activePath()]: projectFixture({
          state: "Paused",
          primary: true,
          statusSince: "2026-07-20",
          lastActivity: "2026-07-20",
          logDate: "2026-07-20",
        }),
        [activePath("CG-WORK-002")]: projectFixture({
          id: "CG-WORK-002",
          primary: false,
          lastActivity: "2026-07-29",
          logDate: "2026-07-29",
        }),
        [activePath("CG-WORK-003")]: projectFixture({
          id: "CG-WORK-003",
          primary: false,
          lastActivity: "2026-07-30",
          logDate: "2026-07-30",
        }),
        [activePath("CG-WORK-004")]: projectFixture({
          id: "CG-WORK-004",
          primary: false,
          lastActivity: "2026-07-29",
          logDate: "2026-07-29",
        }),
      },
      { asOf: AS_OF },
    );

    expect(registry.activeProjects.map((project) => project.id)).toEqual([
      "CG-WORK-001",
      "CG-WORK-003",
      "CG-WORK-002",
      "CG-WORK-004",
    ]);
  });

  it("requires complete vertical Work Step rows and permits only one In progress step", () => {
    const incomplete = validateOperationalRecordSources(
      {
        [activePath()]: projectFixture().replace(
          "| CG-STEP-001 | Parse the fixture lifecycle. |",
          "| CG-STEP-001 | None |",
        ),
      },
      { asOf: AS_OF },
    );
    expect(incomplete.errors.join("\n")).toContain(
      "CG-STEP-001 requires a meaningful Vertical result",
    );

    const twoInProgress = projectFixture({ stepState: "In progress" }).replace(
      "| CG-STEP-001 | Parse the fixture lifecycle. | In progress | Registry state remains separate. | No automatic project transition. | Focused unit test; human review is not required for this structural fixture. | Fixture result recorded. | CG-EV-001 |",
      `| CG-STEP-001 | Parse the fixture lifecycle. | In progress | Registry state remains separate. | No automatic project transition. | Focused unit test; human review is not required for this structural fixture. | Fixture result recorded. | CG-EV-001 |
| CG-STEP-002 | Render the fixture lifecycle. | In progress | The second result is visible. | No implicit completion. | Renderer check; human review remains pending. | Rendering is underway. | CG-EV-001 |`,
    );
    const inProgressResult = validateOperationalRecordSources(
      { [activePath()]: twoInProgress },
      { asOf: AS_OF },
    );
    expect(inProgressResult.errors.join("\n")).toContain(
      "at most one Work Step may be In progress; found 2",
    );
  });

  it("allows pre-evidence steps without Proof IDs but requires them when proof is pending or concluded", () => {
    for (const stepState of ["Not started", "Blocked", "Superseded"] as const) {
      const source = projectFixture({ stepState }).replace(
        `| ${stepState} | Registry state remains separate. | No automatic project transition. | Focused unit test; human review is not required for this structural fixture. | Fixture result recorded. | CG-EV-001 |`,
        `| ${stepState} | Registry state remains separate. | No automatic project transition. | Focused unit test; human review is not required for this structural fixture. | Fixture result recorded. | None |`,
      );
      const registry = buildOperationalRecordRegistry(
        { [activePath()]: source },
        { asOf: AS_OF },
      );
      expect(registry.activeProjects[0].steps[0].proofIds).toEqual([]);
    }

    for (const stepState of ["Awaiting proof", "Concluded"] as const) {
      const source = projectFixture({ stepState }).replace(
        `| ${stepState} | Registry state remains separate. | No automatic project transition. | Focused unit test; human review is not required for this structural fixture. | Fixture result recorded. | CG-EV-001 |`,
        `| ${stepState} | Registry state remains separate. | No automatic project transition. | Focused unit test; human review is not required for this structural fixture. | Fixture result recorded. | None |`,
      );
      const result = validateOperationalRecordSources(
        { [activePath()]: source },
        { asOf: AS_OF },
      );
      expect(result.errors.join("\n")).toContain(
        `CG-STEP-001 requires at least one Proof ID when ${stepState}`,
      );
    }
  });

  it("enforces the Planned, Implementing, and Validating transition gates", () => {
    const noResearchDecision = validateOperationalRecordSources(
      {
        [activePath()]: projectFixture({ state: "Planned" }).replace(
          "Precedent research is not required",
          "Source inspection is complete",
        ),
      },
      { asOf: AS_OF },
    );
    expect(noResearchDecision.errors.join("\n")).toContain(
      "requires a settled decision about whether precedent research is required",
    );

    const wrongDecisionLogType = validateOperationalRecordSources(
      {
        [activePath()]: projectFixture({ state: "Planned" }).replace(
          "CG-LOG-001 — Decision",
          "CG-LOG-001 — Investigation",
        ),
      },
      { asOf: AS_OF },
    );
    expect(wrongDecisionLogType.errors.join("\n")).toContain(
      "precedent-research decision must point to a Decision Attempt Log entry",
    );

    const unauthorizedImplementation = validateOperationalRecordSources(
      {
        [activePath()]: projectFixture({
          state: "Implementing",
          implementationAuthorization: "Pending authorization.",
        }),
      },
      { asOf: AS_OF },
    );
    expect(unauthorizedImplementation.errors.join("\n")).toContain(
      "Implementing requires explicit dated implementation authorization",
    );

    for (const deniedAuthorization of [
      "Authorization denied by the user, 2026-07-20",
      "Not yet approved by the user, 2026-07-20",
      "No approval was granted by the user, 2026-07-20",
      "Approval withheld by the user, 2026-07-20",
    ]) {
      const deniedImplementation = validateOperationalRecordSources(
        {
          [activePath()]: projectFixture({
            state: "Implementing",
            implementationAuthorization: deniedAuthorization,
          }),
        },
        { asOf: AS_OF },
      );
      expect(deniedImplementation.errors.join("\n")).toContain(
        "Implementing requires explicit dated implementation authorization",
      );
    }

    const noTestableStep = validateOperationalRecordSources(
      {
        [activePath()]: projectFixture({
          state: "Validating",
          stepState: "In progress",
        }),
      },
      { asOf: AS_OF },
    );
    expect(noTestableStep.errors.join("\n")).toContain(
      "Validating requires an Awaiting proof or Concluded testable Work Step",
    );
  });

  it("requires Planned and Implementing records to name Work Steps and Proof Claims", () => {
    for (const state of ["Planned", "Implementing"] satisfies ProjectWorkflowState[]) {
      const emptyWork = projectFixture({ state })
        .replace(/^\| CG-STEP-001 .*\n/m, "")
        .replace(/### CG-EV-001:[\s\S]*?(?=\n## Attempt and Decision Log)/, "");
      const result = validateOperationalRecordSources(
        { [activePath()]: emptyWork },
        { asOf: AS_OF },
      );
      expect(result.errors.join("\n")).toContain(
        `${state} requires at least one Work Step`,
      );
      expect(result.errors.join("\n")).toContain(
        `${state} requires at least one Proof Claim`,
      );
    }
  });

  it("gates Closeout pending and Closed on concluded steps and successful proofs", () => {
    const approvedNotApplicable = buildOperationalRecordRegistry(
      {
        [activePath()]: projectFixture({
          state: "Closeout pending",
          proofResult: "Not applicable",
        }),
      },
      { asOf: AS_OF },
    );
    expect(approvedNotApplicable.activeProjects[0].workflowState).toBe(
      "Closeout pending",
    );

    const deniedNotApplicable = validateOperationalRecordSources(
      {
        [activePath()]: projectFixture({
          state: "Closeout pending",
          proofResult: "Not applicable",
        }).replace(
          "Approved as not applicable by the user because this proof class is outside the structural fixture.",
          "Approval denied by the user, 2026-07-30.",
        ),
      },
      { asOf: AS_OF },
    );
    expect(deniedNotApplicable.errors.join("\n")).toContain(
      "CG-EV-001 requires Not-applicable rationale/approval",
    );

    for (const incompleteApproval of ["Approved.", "Approved by the user."]) {
      const incompleteNotApplicable = validateOperationalRecordSources(
        {
          [activePath()]: projectFixture({
            state: "Closeout pending",
            proofResult: "Not applicable",
          }).replace(
            "Approved as not applicable by the user because this proof class is outside the structural fixture.",
            incompleteApproval,
          ),
        },
        { asOf: AS_OF },
      );
      expect(incompleteNotApplicable.errors.join("\n")).toContain(
        "CG-EV-001 requires Not-applicable rationale/approval",
      );
    }

    const unfinishedStep = validateOperationalRecordSources(
      {
        [activePath()]: projectFixture({
          state: "Closeout pending",
          stepState: "Awaiting proof",
        }),
      },
      { asOf: AS_OF },
    );
    expect(unfinishedStep.errors.join("\n")).toContain(
      "Closeout pending requires every Work Step to be Concluded or Superseded",
    );

    const failedProof = validateOperationalRecordSources(
      {
        ...validClosedSources(),
        [archivePath()]: projectFixture({
          placement: "archive",
          state: "Closed",
          linkedIssueIds: ["CG-ISSUE-001"],
          primary: false,
          proofResult: "Failed",
        }),
      },
      { asOf: AS_OF },
    );
    expect(failedProof.errors.join("\n")).toContain(
      "Closed cannot retain Failed proof CG-EV-001",
    );
  });

  it("enforces the approved proof classes and completion attribution", () => {
    const unsupportedClass = validateOperationalRecordSources(
      {
        [activePath()]: projectFixture({ proofClass: "Looks good" }),
      },
      { asOf: AS_OF },
    );
    expect(unsupportedClass.errors.join("\n")).toContain(
      'uses unsupported evidence class "Looks good"',
    );

    const missingHumanField = validateOperationalRecordSources(
      {
        [activePath()]: projectFixture().replace(
          "- Human reviewer/date: None\n",
          "",
        ),
      },
      { asOf: AS_OF },
    );
    expect(missingHumanField.errors.join("\n")).toContain(
      'requires a non-empty "Human reviewer/date" field',
    );

    const missingHumanAttribution = validateOperationalRecordSources(
      {
        [activePath()]: projectFixture({
          proofClass: "Human behavior review complete",
          humanReviewerAndDate: "None",
        }),
      },
      { asOf: AS_OF },
    );
    expect(missingHumanAttribution.errors.join("\n")).toContain(
      "Passed Human behavior review complete proof requires a meaningful Human reviewer and valid YYYY-MM-DD review date",
    );

    const passedHumanReview = buildOperationalRecordRegistry(
      {
        [activePath()]: projectFixture({
          proofClass: "Human behavior review complete",
          humanReviewerAndDate: "Thomas Hall, 2026-07-30",
        }),
      },
      { asOf: AS_OF },
    );
    expect(passedHumanReview.activeProjects[0].proofs[0].evidenceClass).toBe(
      "Human behavior review complete",
    );

    const passedEvidenceBasedCompletion = buildOperationalRecordRegistry(
      {
        [activePath()]: projectFixture({
          proofClass: "Product outcome complete",
          humanReviewerAndDate: "Not applicable under evidence-based completion.",
          completionReviewMode: "Evidence-based verification",
          completionAuthorityAndDate: "Codex verification workflow, 2026-07-30",
          evidenceBasedCompletionApproval:
            "Approved by Thomas Hall on 2026-07-30 because this nonvisual fixture is verified through its evidence package.",
        }),
      },
      { asOf: AS_OF },
    );
    expect(
      passedEvidenceBasedCompletion.activeProjects[0].proofs[0]
        .completionReviewMode,
    ).toBe("Evidence-based verification");

    const evidenceBasedWithoutApproval = validateOperationalRecordSources(
      {
        [activePath()]: projectFixture({
          proofClass: "Product outcome complete",
          humanReviewerAndDate: "Not applicable under evidence-based completion.",
          completionReviewMode: "Evidence-based verification",
          completionAuthorityAndDate: "Codex verification workflow, 2026-07-30",
        }),
      },
      { asOf: AS_OF },
    );
    expect(evidenceBasedWithoutApproval.errors.join("\n")).toContain(
      "Evidence-based verification requires explicit evidence-based completion approval",
    );

    const humanProofUsingEvidenceBasedCompletion =
      validateOperationalRecordSources(
        {
          [activePath()]: projectFixture({
            proofClass: "Human behavior review complete",
            humanReviewerAndDate: "Thomas Hall, 2026-07-30",
            completionReviewMode: "Evidence-based verification",
            completionAuthorityAndDate: "Codex verification workflow, 2026-07-30",
            evidenceBasedCompletionApproval:
              "Approved by Thomas Hall on 2026-07-30 because the fixture is nonvisual.",
          }),
        },
        { asOf: AS_OF },
      );
    expect(humanProofUsingEvidenceBasedCompletion.errors.join("\n")).toContain(
      "Human behavior review complete cannot use Evidence-based verification",
    );

    const futureHumanReview = validateOperationalRecordSources(
      {
        [activePath()]: projectFixture({
          proofClass: "Human behavior review complete",
          humanReviewerAndDate: "Thomas Hall, 2099-01-01",
        }),
      },
      { asOf: AS_OF },
    );
    expect(futureHumanReview.errors).toContain(
      `${activePath()}: CG-EV-001 Human reviewer date 2099-01-01 cannot be after validation date ${AS_OF}`,
    );

    const futureProductReview = validateOperationalRecordSources(
      {
        [activePath()]: projectFixture({
          proofClass: "Product outcome complete",
          humanReviewerAndDate: "Thomas Hall, 2099-01-01",
        }),
      },
      { asOf: AS_OF },
    );
    expect(futureProductReview.errors).toContain(
      `${activePath()}: CG-EV-001 Completion date 2099-01-01 cannot be after validation date ${AS_OF}`,
    );

    const ambiguousProductReview = validateOperationalRecordSources(
      {
        [activePath()]: projectFixture({
          proofClass: "Product outcome complete",
          humanReviewerAndDate:
            "Thomas Hall, 2026-07-30; scheduled reviewer date 2099-01-01",
        }),
      },
      { asOf: AS_OF },
    );
    expect(ambiguousProductReview.errors.join("\n")).toContain(
      "Passed Product outcome complete proof requires a meaningful completion authority and valid YYYY-MM-DD completion date",
    );
  });

  it("links an accepted closeout to an approved evidence-based completion authority", () => {
    const sources = validClosedSources();
    const archive = projectFixture({
      placement: "archive",
      state: "Closed",
      linkedIssueIds: ["CG-ISSUE-001"],
      primary: false,
      humanReviewerAndDate: "Not applicable under evidence-based completion.",
      completionReviewMode: "Evidence-based verification",
      completionAuthorityAndDate: "Codex verification workflow, 2026-07-30",
      evidenceBasedCompletionApproval:
        "Approved by Thomas Hall on 2026-07-30 because this nonvisual fixture is verified through its evidence package.",
    });
    const changelog = changelogFixture().replace(
      "accepted_by: Fixture owner",
      "accepted_by: Codex verification workflow",
    );

    const result = validateOperationalRecordSources(
      {
        ...sources,
        [archivePath()]: archive,
        [changePath()]: changelog,
      },
      { asOf: AS_OF },
    );

    expect(result.errors).toEqual([]);

    const mismatchedAuthority = validateOperationalRecordSources(
      {
        ...sources,
        [archivePath()]: archive,
        [changePath()]: changelog.replace(
          "accepted_by: Codex verification workflow",
          "accepted_by: Another authority",
        ),
      },
      { asOf: AS_OF },
    );
    expect(mismatchedAuthority.errors.join("\n")).toContain(
      "accepted_by must match the completion authority on acceptance_ref CG-EV-001",
    );
  });

  it("requires approved append-only archive corrections while keeping reopen deferred", () => {
    const baselineSource = projectFixture({
      placement: "archive",
      state: "Cancelled",
      primary: false,
    });
    const approvedCorrection = baselineSource
      .replace(
        "- Last recorded activity: 2026-07-30",
        "- Last recorded activity: 2026-07-31",
      )
      .concat(`
### CG-LOG-002 — Correction — 2026-07-31

- Authoring task/authority: archive correction fixture
- Related Issue/Step/Evidence IDs: CG-STEP-001, CG-EV-001
- Source state: fixture-source-state
- Action and rationale: Correct a factual statement without rewriting archive history.
- Affected systems: Archived fixture only.
- Result: The correction is appended.
- Proves: Archive corrections retain the prior entry.
- Does not prove: Product behavior.
- Consequence/next action: Treat the correction as the current factual authority.
- Supersedes/Amends/Reopens: CG-LOG-001
- Correction approval: Approved by the governing authority, 2026-07-31
`);
    const correctionResult = validateOperationalRecordSources(
      { [archivePath()]: approvedCorrection },
      { asOf: AS_OF, baselineSources: { [archivePath()]: baselineSource } },
    );
    expect(correctionResult.ok, correctionResult.errors.join("\n")).toBe(true);

    const noApproval = validateOperationalRecordSources(
      {
        [archivePath()]: approvedCorrection.replace(
          "- Correction approval: Approved by the governing authority, 2026-07-31",
          "- Correction approval: None",
        ),
      },
      { asOf: AS_OF, baselineSources: { [archivePath()]: baselineSource } },
    );
    expect(noApproval.errors.join("\n")).toContain(
      "Correction CG-LOG-002 requires meaningful Correction approval",
    );

    const deniedApproval = validateOperationalRecordSources(
      {
        [archivePath()]: approvedCorrection.replace(
          "- Correction approval: Approved by the governing authority, 2026-07-31",
          "- Correction approval: Approval denied by the governing authority, 2026-07-31",
        ),
      },
      { asOf: AS_OF, baselineSources: { [archivePath()]: baselineSource } },
    );
    expect(deniedApproval.errors.join("\n")).toContain(
      "Correction CG-LOG-002 requires meaningful Correction approval",
    );

    for (const rejectedApproval of [
      "Approved, but not by the governing authority, 2026-07-31",
      "Approved by no one, 2026-07-31",
    ]) {
      const rejected = validateOperationalRecordSources(
        {
          [archivePath()]: approvedCorrection.replace(
            "- Correction approval: Approved by the governing authority, 2026-07-31",
            `- Correction approval: ${rejectedApproval}`,
          ),
        },
        { asOf: AS_OF, baselineSources: { [archivePath()]: baselineSource } },
      );
      expect(rejected.errors.join("\n")).toContain(
        "Correction CG-LOG-002 requires meaningful Correction approval",
      );
    }

    const rewrittenArchive = approvedCorrection.replace(
      "Records remain separate, readable, and truthful.",
      "Archived facts were silently rewritten.",
    );
    const rewriteResult = validateOperationalRecordSources(
      { [archivePath()]: rewrittenArchive },
      { asOf: AS_OF, baselineSources: { [archivePath()]: baselineSource } },
    );
    expect(rewriteResult.errors.join("\n")).toContain(
      "archived content outside the history log was modified",
    );

    const reopenCandidate = projectFixture({ primary: false });
    const reopenResult = validateOperationalRecordSources(
      { [activePath()]: reopenCandidate },
      { asOf: AS_OF, baselineSources: { [archivePath()]: baselineSource } },
    );
    expect(reopenResult.errors.join("\n")).toContain(
      "archived project cannot move back to active without a reopen workflow",
    );
  });

  it("does not let non-success archives resolve Issues without a successful change package", () => {
    const unsupportedResolution = validateOperationalRecordSources(
      {
        [issuePath()]: issueFixture({ status: "resolved" }),
        [archivePath()]: projectFixture({
          placement: "archive",
          state: "Cancelled",
          linkedIssueIds: ["CG-ISSUE-001"],
          issueDisposition: "resolved",
          primary: false,
        }),
      },
      { asOf: AS_OF },
    );
    expect(unsupportedResolution.errors.join("\n")).toContain(
      "Cancelled cannot resolve linked Issues without a linked Changelog and successful proof package",
    );

    const unsupportedSupersededResolution = validateOperationalRecordSources(
      {
        [issuePath()]: issueFixture({ status: "resolved" }),
        [archivePath()]: projectFixture({
          placement: "archive",
          state: "Superseded",
          linkedIssueIds: ["CG-ISSUE-001"],
          issueDisposition: "resolved",
          replacementProjectId: "CG-WORK-002",
          primary: false,
        }),
        [activePath("CG-WORK-002")]: projectFixture({
          id: "CG-WORK-002",
          primary: false,
        }),
      },
      { asOf: AS_OF },
    );
    expect(unsupportedSupersededResolution.errors.join("\n")).toContain(
      "Superseded cannot resolve linked Issues without a linked Changelog and successful proof package",
    );

    const separatelyProvedChange = buildOperationalRecordRegistry(
      {
        [issuePath()]: issueFixture({ status: "resolved" }),
        [archivePath()]: projectFixture({
          placement: "archive",
          state: "Cancelled",
          linkedIssueIds: ["CG-ISSUE-001"],
          issueDisposition: "resolved",
          changelogIds: ["CG-CHANGE-001"],
          primary: false,
          proofClass: "Product outcome complete",
          proofSourceState: CHANGE_SOURCE_REVISION,
          humanReviewerAndDate: "Fixture owner, 2026-07-30",
        }),
        [changePath()]: changelogFixture(),
      },
      { asOf: AS_OF },
    );
    expect(separatelyProvedChange.issues[0].status).toBe("resolved");
  });

  it("rejects duplicate structured labels instead of silently choosing the last value", () => {
    const duplicateLabel = projectFixture().replace(
      "- Project status: Investigating",
      "- Project status: Investigating\n- Project status: Closed",
    );
    const result = validateOperationalRecordSources(
      { [activePath()]: duplicateLabel },
      { asOf: AS_OF },
    );
    expect(result.errors.join("\n")).toContain(
      '"Project and Status" contains duplicate "Project status" field',
    );

    const duplicateTableColumn = projectFixture().replace(
      "| Step ID | Vertical result | Step state |",
      "| Step ID | Vertical result | Step state | Step state |",
    );
    const tableResult = validateOperationalRecordSources(
      { [activePath()]: duplicateTableColumn },
      { asOf: AS_OF },
    );
    expect(tableResult.errors.join("\n")).toContain(
      '"Work Steps" contains duplicate column label: Step state',
    );
  });

  it("requires appended history for active fact changes while the later guarded-write lock remains deferred", () => {
    // The contract compares a supplied baseline deterministically. The
    // exclusive coordinator lock and expected-hash writer remain deliberately
    // deferred; the pilot uses the documented manual base-state safeguard.
    const baseline = { [activePath()]: projectFixture() };
    const silentChange = projectFixture().replace(
      "Records remain separate, readable, and truthful.",
      "The active contract changed without a history entry.",
    );
    const silentResult = validateOperationalRecordSources(
      { [activePath()]: silentChange },
      { asOf: AS_OF, baselineSources: baseline },
    );
    expect(silentResult.errors.join("\n")).toContain(
      "active project facts changed without an appended history entry",
    );

    const removedStepAndProof = projectFixture()
      .replace(/^\| CG-STEP-001 .*\n/m, "")
      .replace(/### CG-EV-001:[\s\S]*?(?=\n## Attempt and Decision Log)/, "");
    const removalResult = validateOperationalRecordSources(
      { [activePath()]: removedStepAndProof },
      { asOf: AS_OF, baselineSources: baseline },
    );
    expect(removalResult.errors.join("\n")).toContain(
      "existing Work Step CG-STEP-001 was removed",
    );
    expect(removalResult.errors.join("\n")).toContain(
      "existing Proof Claim CG-EV-001 was removed",
    );
  });

  it("exports exactly the approved project workflow vocabulary", () => {
    expect(PROJECT_WORKFLOW_STATES).toEqual([
      "Investigating",
      "Planned",
      "Implementing",
      "Validating",
      "Blocked",
      "Paused",
      "Deferred",
      "Closeout pending",
      "Closed",
      "Superseded",
      "Cancelled",
    ]);
  });

  it("exports exactly the approved proof-class vocabulary", () => {
    expect(PROOF_CLASSES).toEqual([
      "Planning complete",
      "Implementation present",
      "Live wiring complete",
      "Enforcement complete",
      "Structural validation complete",
      "Integrated validation complete",
      "Human behavior review complete",
      "Product outcome complete",
      "Current-source inspection",
    ]);
  });
});
