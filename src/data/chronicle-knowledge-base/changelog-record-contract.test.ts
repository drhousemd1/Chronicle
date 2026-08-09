import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";
import { stringify as stringifyYaml } from "yaml";

import { canonicalJsonStringify } from "@/lib/quality-hub-changelog-migration";

import {
  LEGACY_PROVENANCE_LIMIT,
  buildChangelogRecordRegistry,
  computeLegacyPayloadHash,
  sha256HexSync,
  selectChangelogEntriesFromRegistry,
  validateChangelogRecordSources,
} from "./changelog-record-contract";

const AS_OF = "2026-08-01";
const SNAPSHOT_HASH = "a".repeat(64);
const SOURCE_REVISION = `sha256:${"c".repeat(64)}`;
const ACCEPTED_NARRATIVE = {
  problem: "The accepted fixture began with a verified narrative gap.",
  whyChangeWasNeeded:
    "Without the change, a future reader could not reconstruct the accepted work.",
  changes:
    "The fixture now stores the accepted problem, rationale, detailed changes, evidence summary, and evidence limits.",
  outcome: "The Community Gallery Knowledge Base pilot was accepted.",
  acceptedEvidenceSummary:
    "The named product-outcome proof and reciprocal archived work record were accepted.",
  acceptedEvidenceLimits:
    "The fixture does not prove unrelated runtime behavior or deployment state.",
} as const;
const LEGACY_PAYLOAD = {
  id: "cl-20260620-001",
  title: "Original Quality Hub title",
  summary: "Original summary",
  severity: "fix" as const,
  status: "completed" as const,
  problem: "Original problem",
  plan: "Original plan",
  changes: "Original changes",
  filesAffected: ["src/services/gallery-data.ts"],
  agent: "Lovable",
  relatedFindingIds: [],
  relatedRunIds: [],
  tags: ["gallery"],
  comments: [
    {
      id: "comment-1",
      author: "Chronicle owner",
      timestamp: "2026-06-20T12:00:00.000Z",
      text: "Original comment",
    },
  ],
  createdAt: "2026-06-20T12:00:00.000Z",
  updatedAt: "2026-06-20T12:00:00.000Z",
};

const changelogPath = (id: string) =>
  `docs/architecture-knowledge/changelog/entries/${id}.md`;

function body(
  id: string,
  title: string,
  headings: readonly string[],
  outcome = "This record has a bounded, source-readable outcome.",
  headingContent: Readonly<Record<string, string>> = {},
) {
  return `# ${id}: ${title}

## Outcome

${outcome}

## Provenance

The record names where its authority came from.

## Applicability

The affected Chronicle capabilities were positively reviewed.

${headings
  .map(
    (heading) => `## ${heading}

${headingContent[heading] ?? `This section preserves the required ${heading.toLowerCase()} detail.`}
`,
  )
  .join("\n")}`;
}

function acceptedFixture({
  id = "CG-CHANGE-001",
  title = "Community Gallery pilot accepted",
  changeDate = "2026-07-30",
  capabilities = ["community-gallery"],
}: {
  id?: string;
  title?: string;
  changeDate?: string;
  capabilities?: string[];
} = {}) {
  const sourcePath = changelogPath(id);
  return `---
record_type: changelog
variant: accepted_closeout
change_id: ${id}
title: ${title}
change_date: ${changeDate}
problem: ${ACCEPTED_NARRATIVE.problem}
why_change_was_needed: ${ACCEPTED_NARRATIVE.whyChangeWasNeeded}
changes: ${ACCEPTED_NARRATIVE.changes}
outcome: ${ACCEPTED_NARRATIVE.outcome}
accepted_evidence_summary: ${ACCEPTED_NARRATIVE.acceptedEvidenceSummary}
accepted_evidence_limits: ${ACCEPTED_NARRATIVE.acceptedEvidenceLimits}
provenance: accepted-closeout
affected_capabilities: [${capabilities.join(", ")}]
owning_capability: community-gallery
accepted_on: ${changeDate}
accepted_by: Chronicle owner
acceptance_ref: CG-EV-007
source_revision: ${SOURCE_REVISION}
archived_project_id: CG-WORK-001
archive_record: docs/current-work/archive/community-gallery/CG-WORK-001.md
archive_route: /style-guide/chronicle-knowledge-base/archive/CG-WORK-001
resolved_issue_ids: []
remaining_issue_ids: []
source_record: ${sourcePath}
---
# ${id}: ${title}

## Problem

${ACCEPTED_NARRATIVE.problem}

## Why the Change Was Needed

${ACCEPTED_NARRATIVE.whyChangeWasNeeded}

## Changes

${ACCEPTED_NARRATIVE.changes}

## Outcome

${ACCEPTED_NARRATIVE.outcome}

## Accepted Evidence Summary

${ACCEPTED_NARRATIVE.acceptedEvidenceSummary}

## Accepted Evidence Limits

${ACCEPTED_NARRATIVE.acceptedEvidenceLimits}

## Provenance

This accepted closeout is bound to the named proof and archived Current Work record.

## Applicability

The affected Chronicle capabilities were positively reviewed.

## Acceptance and Source State

The accepted date and source revision identify the reviewed result.

## Issue Disposition

Resolved and remaining Issue IDs are declared in the record.

## Preserved Work Record

The complete Current Work history remains available at the declared archive path.
`;
}

function legacyFixture({
  originalId = "cl-20260620-001",
  title = "Original Quality Hub title",
  changeDate = "2026-06-20",
  capabilities = ["community-gallery", "my-stories"],
}: {
  originalId?: string;
  title?: string;
  changeDate?: string;
  capabilities?: string[];
} = {}) {
  const id = `LEGACY-QH-${originalId}`;
  const sourcePath = changelogPath(id);
  const originalRecord = {
    ...LEGACY_PAYLOAD,
    id: originalId,
    title,
    updatedAt: `${changeDate}T12:00:00.000Z`,
  };
  const entryHash = computeLegacyPayloadHash(originalRecord);
  const applicabilityStatus = capabilities.length
    ? "capability-reviewed"
    : "gallery-reviewed-other-capabilities-unclassified";
  const galleryApplicability = capabilities.includes("community-gallery")
    ? "applicable"
    : "not_applicable";
  return `---
record_type: changelog
variant: legacy_import
change_id: ${id}
title: ${title}
change_date: ${changeDate}
outcome: ${originalRecord.summary}
provenance: historical-quality-hub
affected_capabilities: [${capabilities.join(", ")}]
legacy_source_id: ${originalId}
original_record:
  id: ${originalId}
  title: ${originalRecord.title}
  summary: ${originalRecord.summary}
  severity: fix
  status: completed
  problem: Original problem
  plan: Original plan
  changes: Original changes
  filesAffected: [src/services/gallery-data.ts]
  agent: Lovable
  relatedFindingIds: []
  relatedRunIds: []
  tags: [gallery]
  comments:
    - id: comment-1
      author: Chronicle owner
      timestamp: 2026-06-20T12:00:00.000Z
      text: Original comment
  createdAt: 2026-06-20T12:00:00.000Z
  updatedAt: ${originalRecord.updatedAt}
source_hash: ${entryHash}
migration_snapshot_hash: ${SNAPSHOT_HASH}
imported_on: 2026-08-01
source_lineage: [owner-db, repository-seed]
migration_receipt: docs/architecture-knowledge/changelog/migration-receipt.md
applicability_evidence: Reviewed against the original files and Community Gallery architecture.
applicability_status: ${applicabilityStatus}
gallery_applicability: ${galleryApplicability}
provenance_limit: ${LEGACY_PROVENANCE_LIMIT}
modern_acceptance: not_assessed
proof_status: not_reverified
source_record: ${sourcePath}
---
${body(
  id,
  title,
  [
    "Original Quality Hub Record",
    "Migration Lineage",
    "Modern Verification Status",
  ],
  originalRecord.summary,
)}`;
}

function privacyRedactedLegacyFixture() {
  const originalId = "cl-private-path";
  const preservedPayload = {
    ...LEGACY_PAYLOAD,
    id: originalId,
    changes: "Updated $HOME/Desktop/Chronicle/file.ts",
    filesAffected: ["$HOME/Desktop/Chronicle/file.ts"],
  };
  const baseHash = computeLegacyPayloadHash({
    ...LEGACY_PAYLOAD,
    id: originalId,
  });
  return legacyFixture({ originalId })
    .replace(
      "changes: Original changes",
      "changes: Updated $HOME/Desktop/Chronicle/file.ts",
    )
    .replace(
      "filesAffected: [src/services/gallery-data.ts]",
      "filesAffected: [$HOME/Desktop/Chronicle/file.ts]",
    )
    .replace(
      `source_hash: ${baseHash}`,
      `source_hash: ${"a".repeat(64)}\npreserved_record_hash: ${computeLegacyPayloadHash(preservedPayload)}\nprivacy_redactions:\n  - field: changes\n    transformation: home-directory-prefix-to-$HOME\n  - field: filesAffected[0]\n    transformation: home-directory-prefix-to-$HOME`,
    );
}

function correctionFixture({
  targetId = "LEGACY-QH-cl-20260620-001",
  sequence = 1,
  changeDate = "2026-08-01",
  capabilities = ["community-gallery"],
  clarified = "affected_capabilities: [community-gallery]",
  effectiveClarification,
}: {
  targetId?: string;
  sequence?: number;
  changeDate?: string;
  capabilities?: string[];
  clarified?: string;
  effectiveClarification?: string;
} = {}) {
  const suffix = String(sequence).padStart(3, "0");
  const id = `${targetId}-COR-${suffix}`;
  const sourcePath = changelogPath(id);
  const clarifiedYaml = clarified
    .split("\n")
    .map((line) => `  ${line}`)
    .join("\n");
  return `---
record_type: changelog
variant: correction
change_id: ${id}
title: Correct the verified capability mapping
change_date: ${changeDate}
outcome: The effective record now uses the reviewed capability mapping.
provenance: correction
affected_capabilities: [${capabilities.join(", ")}]
target_change_id: ${targetId}
correction_sequence: ${sequence}
corrected_on: ${changeDate}
correction_authority: Chronicle owner approval on 2026-08-01
correction_reason: Later source inspection narrowed the affected capability list.
source_revision: ${SOURCE_REVISION}
clarified_fields:
${clarifiedYaml}
source_record: ${sourcePath}
---
${body(
  id,
  "Correct the verified capability mapping",
  ["Correction Detail", "Authority and Reason", "Effective Clarification"],
  "The effective record now uses the reviewed capability mapping.",
  {
    "Authority and Reason": `### Correction Authority

Chronicle owner approval on 2026-08-01

### Correction Reason

Later source inspection narrowed the affected capability list.`,
    ...(effectiveClarification
      ? { "Effective Clarification": effectiveClarification }
      : {}),
  },
)}`;
}

function acceptedNarrativeCorrectionFixture() {
  const targetId = "CG-CHANGE-001";
  const id = `${targetId}-COR-001`;
  const sourcePath = changelogPath(id);
  return `---
record_type: changelog
variant: correction
change_id: ${id}
title: Correct the accepted narrative
change_date: 2026-08-01
outcome: The append-only correction clarifies the accepted narrative fields.
provenance: correction
affected_capabilities: [community-gallery]
target_change_id: ${targetId}
correction_sequence: 1
corrected_on: 2026-08-01
correction_authority: Chronicle owner approval on 2026-08-01
correction_reason: Later review supplied more precise accepted narrative wording.
source_revision: ${SOURCE_REVISION}
clarified_fields:
  problem: Corrected accepted problem
  why_change_was_needed: Corrected accepted rationale
  changes: Corrected accepted changes
  outcome: Corrected accepted outcome
  accepted_evidence_summary: Corrected accepted evidence summary
  accepted_evidence_limits: Corrected accepted evidence limits
source_record: ${sourcePath}
---
# ${id}: Correct the accepted narrative

## Outcome

The append-only correction clarifies the accepted narrative fields.

## Provenance

This correction remains separate from the accepted root record.

## Applicability

This correction applies to Community Gallery.

## Correction Detail

Six accepted narrative values are clarified without rewriting the root.

## Authority and Reason

### Correction Authority

Chronicle owner approval on 2026-08-01

### Correction Reason

Later review supplied more precise accepted narrative wording.

## Effective Clarification

### Problem

Corrected accepted problem

### Why the Change Was Needed

Corrected accepted rationale

### Changes

Corrected accepted changes

### Outcome

Corrected accepted outcome

### Accepted Evidence Summary

Corrected accepted evidence summary

### Accepted Evidence Limits

Corrected accepted evidence limits
`;
}

describe("shared Chronicle Changelog record contract", () => {
  it("computes the standard SHA-256 digest used for preserved legacy payloads", () => {
    expect(sha256HexSync("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
    const unicodePayload = {
      ...LEGACY_PAYLOAD,
      summary: `${LEGACY_PAYLOAD.summary} — source-backed résumé ${"x".repeat(96)}`,
    };
    expect(computeLegacyPayloadHash(unicodePayload)).toBe(
      createHash("sha256")
        .update(canonicalJsonStringify(unicodePayload))
        .digest("hex"),
    );
  });

  it("builds one deeply immutable empty global registry", () => {
    const registry = buildChangelogRecordRegistry({}, { asOf: AS_OF });
    expect(registry).toEqual({
      records: [],
      roots: [],
      corrections: [],
      effectiveEntries: [],
    });
    expect(Object.isFrozen(registry)).toBe(true);
    expect(Object.isFrozen(registry.effectiveEntries)).toBe(true);
  });

  it("accepts modern, legacy, and correction variants without relabeling legacy completion", () => {
    const legacyId = "LEGACY-QH-cl-20260620-001";
    const sources = {
      [changelogPath("CG-CHANGE-001")]: acceptedFixture(),
      [changelogPath(legacyId)]: legacyFixture(),
      [changelogPath(`${legacyId}-COR-001`)]: correctionFixture(),
    };
    const registry = buildChangelogRecordRegistry(sources, { asOf: AS_OF });

    expect(registry.records.map((record) => record.variant)).toEqual([
      "accepted_closeout",
      "legacy_import",
      "correction",
    ]);
    const legacy = registry.roots.find((record) => record.id === legacyId);
    expect(legacy?.variant).toBe("legacy_import");
    if (legacy?.variant !== "legacy_import") throw new Error("legacy fixture missing");
    expect(legacy.originalRecord.status).toBe("completed");
    expect(legacy.modernAcceptance).toBe("not_assessed");
    expect(legacy.proofStatus).toBe("not_reverified");
    expect(legacy.provenanceLimit).toBe(LEGACY_PROVENANCE_LIMIT);

    const accepted = registry.roots.find((record) => record.id === "CG-CHANGE-001");
    expect(accepted?.variant).toBe("accepted_closeout");
    if (accepted?.variant !== "accepted_closeout") {
      throw new Error("accepted fixture missing");
    }
    expect(accepted).toMatchObject({
      problem: ACCEPTED_NARRATIVE.problem,
      whyChangeWasNeeded: ACCEPTED_NARRATIVE.whyChangeWasNeeded,
      changes: ACCEPTED_NARRATIVE.changes,
      outcome: ACCEPTED_NARRATIVE.outcome,
      acceptedEvidenceSummary: ACCEPTED_NARRATIVE.acceptedEvidenceSummary,
      acceptedEvidenceLimits: ACCEPTED_NARRATIVE.acceptedEvidenceLimits,
    });
  });

  it.each([
    ["problem", `problem: ${ACCEPTED_NARRATIVE.problem}\n`],
    [
      "why_change_was_needed",
      `why_change_was_needed: ${ACCEPTED_NARRATIVE.whyChangeWasNeeded}\n`,
    ],
    ["changes", `changes: ${ACCEPTED_NARRATIVE.changes}\n`],
    [
      "accepted_evidence_summary",
      `accepted_evidence_summary: ${ACCEPTED_NARRATIVE.acceptedEvidenceSummary}\n`,
    ],
    [
      "accepted_evidence_limits",
      `accepted_evidence_limits: ${ACCEPTED_NARRATIVE.acceptedEvidenceLimits}\n`,
    ],
  ])("rejects an accepted closeout missing required %s", (_field, sourceLine) => {
    const result = validateChangelogRecordSources(
      {
        [changelogPath("CG-CHANGE-001")]: acceptedFixture().replace(sourceLine, ""),
      },
      { asOf: AS_OF },
    );

    expect(result.ok).toBe(false);
  });

  it.each([
    ["problem", `problem: ${ACCEPTED_NARRATIVE.problem}`, "problem: TBD - write this later"],
    ["problem without separator", `problem: ${ACCEPTED_NARRATIVE.problem}`, "problem: TBD write this later"],
    ["rationale", `why_change_was_needed: ${ACCEPTED_NARRATIVE.whyChangeWasNeeded}`, "why_change_was_needed: 'Pending: awaiting review'"],
    ["changes", `changes: ${ACCEPTED_NARRATIVE.changes}`, "changes: Unknown — add later"],
    ["outcome", `outcome: ${ACCEPTED_NARRATIVE.outcome}`, "outcome: TODO - write accepted result"],
    [
      "accepted evidence summary",
      `accepted_evidence_summary: ${ACCEPTED_NARRATIVE.acceptedEvidenceSummary}`,
      "accepted_evidence_summary: <placeholder>",
    ],
    [
      "accepted evidence limits",
      `accepted_evidence_limits: ${ACCEPTED_NARRATIVE.acceptedEvidenceLimits}`,
      "accepted_evidence_limits: N/A - not recorded yet",
    ],
  ])("rejects placeholder-only accepted %s", (_field, sourceLine, replacement) => {
    const result = validateChangelogRecordSources(
      {
        [changelogPath("CG-CHANGE-001")]: acceptedFixture().replace(
          sourceLine,
          replacement,
        ),
      },
      { asOf: AS_OF },
    );

    expect(result.errors.join("\n")).toContain(
      "must contain accepted content, not placeholder-only text",
    );
  });

  it("does not accept a required body heading hidden inside a fenced code block", () => {
    const result = validateChangelogRecordSources(
      {
        [changelogPath("CG-CHANGE-001")]: acceptedFixture().replace(
          `## Problem\n\n${ACCEPTED_NARRATIVE.problem}`,
          `\`\`\`markdown\n## Problem\n\n${ACCEPTED_NARRATIVE.problem}\n\`\`\``,
        ),
      },
      { asOf: AS_OF },
    );

    expect(result.errors.join("\n")).toContain(
      'expected exactly one "## Problem" section',
    );
  });

  it("does not accept a required body heading hidden inside an HTML comment", () => {
    const result = validateChangelogRecordSources(
      {
        [changelogPath("CG-CHANGE-001")]: acceptedFixture().replace(
          `## Problem\n\n${ACCEPTED_NARRATIVE.problem}`,
          `<!--\n## Problem\n\n${ACCEPTED_NARRATIVE.problem}\n-->`,
        ),
      },
      { asOf: AS_OF },
    );

    expect(result.errors.join("\n")).toContain(
      'expected exactly one "## Problem" section',
    );
  });

  it("does not accept required body headings hidden inside a raw HTML block", () => {
    const result = validateChangelogRecordSources(
      {
        [changelogPath("CG-CHANGE-001")]: acceptedFixture().replace(
          `## Problem\n\n${ACCEPTED_NARRATIVE.problem}`,
          `<script type="text/plain">\n## Problem\n\n${ACCEPTED_NARRATIVE.problem}\n</script>`,
        ),
      },
      { asOf: AS_OF },
    );

    expect(result.errors.join("\n")).toContain(
      'expected exactly one "## Problem" section',
    );
  });

  it.each([
    ["Problem", ACCEPTED_NARRATIVE.problem],
    ["Why the Change Was Needed", ACCEPTED_NARRATIVE.whyChangeWasNeeded],
    ["Changes", ACCEPTED_NARRATIVE.changes],
    ["Outcome", ACCEPTED_NARRATIVE.outcome],
    ["Accepted Evidence Summary", ACCEPTED_NARRATIVE.acceptedEvidenceSummary],
    ["Accepted Evidence Limits", ACCEPTED_NARRATIVE.acceptedEvidenceLimits],
  ])("rejects accepted frontmatter/body disagreement for %s", (heading, value) => {
    const result = validateChangelogRecordSources(
      {
        [changelogPath("CG-CHANGE-001")]: acceptedFixture().replace(
          `## ${heading}\n\n${value}`,
          `## ${heading}\n\nConflicting body value`,
        ),
      },
      { asOf: AS_OF },
    );

    expect(result.errors.join("\n")).toContain(
      `"## ${heading}" must exactly match`,
    );
  });

  it("applies corrections in order and returns each root only once", () => {
    const legacyId = "LEGACY-QH-cl-20260620-001";
    const sources = {
      [changelogPath(legacyId)]: legacyFixture(),
      [changelogPath(`${legacyId}-COR-001`)]: correctionFixture(),
      [changelogPath(`${legacyId}-COR-002`)]: correctionFixture({
        sequence: 2,
        clarified:
          "migration_receipt: docs/architecture-knowledge/changelog/corrected-migration-receipt.md",
      }),
    };
    const registry = buildChangelogRecordRegistry(sources, { asOf: AS_OF });
    const selected = selectChangelogEntriesFromRegistry(registry);

    expect(selected).toHaveLength(1);
    expect(selected[0]).toMatchObject({
      id: legacyId,
      title: "Original Quality Hub title",
      provenance: "correction",
      affectedCapabilities: ["community-gallery"],
    });
    expect(selected[0].appliedCorrections.map((record) => record.correctionSequence)).toEqual([
      1,
      2,
    ]);
    expect(Object.isFrozen(selected[0].appliedCorrections)).toBe(true);
    expect(selected[0].effectiveRecord.title).toBe("Original Quality Hub title");
    expect(selected[0].effectiveRecord.changeDate).toBe("2026-06-20");
    expect(selected[0].rootRecord.title).toBe("Original Quality Hub title");
  });

  it("derives corrected legacy title and summary projections from one corrected Quality Hub payload", () => {
    const legacyId = "LEGACY-QH-cl-20260620-001";
    const correctedPayload = {
      ...LEGACY_PAYLOAD,
      title: "Corrected Quality Hub title",
      summary: "Corrected Quality Hub summary",
      updatedAt: "2026-06-21T12:00:00.000Z",
    };
    const correctedPayloadYaml = stringifyYaml(correctedPayload)
      .trimEnd()
      .split("\n")
      .map((line) => `  ${line}`)
      .join("\n");
    const registry = buildChangelogRecordRegistry(
      {
        [changelogPath(legacyId)]: legacyFixture(),
        [changelogPath(`${legacyId}-COR-001`)]: correctionFixture({
          capabilities: ["community-gallery", "my-stories"],
          clarified: `original_record:\n${correctedPayloadYaml}\nsource_hash: ${computeLegacyPayloadHash(correctedPayload)}`,
          effectiveClarification: `### Title

Corrected Quality Hub title

### History Date

2026-06-21

### Outcome

Corrected Quality Hub summary`,
        }),
      },
      { asOf: AS_OF },
    );
    const entry = registry.effectiveEntries[0];

    expect(entry.effectiveRecord).toMatchObject({
      variant: "legacy_import",
      title: "Corrected Quality Hub title",
      changeDate: "2026-06-21",
      outcome: "Corrected Quality Hub summary",
    });
    expect(entry.rootRecord).toMatchObject({
      variant: "legacy_import",
      title: "Original Quality Hub title",
      outcome: "Original summary",
    });
  });

  it("rejects a legacy payload correction that hides its derived title, date, and summary from the readable clarification", () => {
    const legacyId = "LEGACY-QH-cl-20260620-001";
    const correctedPayload = {
      ...LEGACY_PAYLOAD,
      title: "Corrected Quality Hub title",
      summary: "Corrected Quality Hub summary",
      updatedAt: "2026-06-21T12:00:00.000Z",
    };
    const correctedPayloadYaml = stringifyYaml(correctedPayload)
      .trimEnd()
      .split("\n")
      .map((line) => `  ${line}`)
      .join("\n");
    const result = validateChangelogRecordSources(
      {
        [changelogPath(legacyId)]: legacyFixture(),
        [changelogPath(`${legacyId}-COR-001`)]: correctionFixture({
          capabilities: ["community-gallery", "my-stories"],
          clarified: `original_record:\n${correctedPayloadYaml}\nsource_hash: ${computeLegacyPayloadHash(correctedPayload)}`,
        }),
      },
      { asOf: AS_OF },
    );

    expect(result.errors.join("\n")).toContain(
      'expected exactly one "### Title" section',
    );
    expect(result.errors.join("\n")).toContain(
      'expected exactly one "### History Date" section',
    );
    expect(result.errors.join("\n")).toContain(
      'expected exactly one "### Outcome" section',
    );
  });

  it("rejects a legacy correction that changes only a projected title or summary", () => {
    const legacyId = "LEGACY-QH-cl-20260620-001";
    const titleDrift = validateChangelogRecordSources(
      {
        [changelogPath(legacyId)]: legacyFixture(),
        [changelogPath(`${legacyId}-COR-001`)]: correctionFixture({
          capabilities: ["community-gallery", "my-stories"],
          clarified: "title: Divergent projected title",
        }),
      },
      { asOf: AS_OF },
    );
    const summaryDrift = validateChangelogRecordSources(
      {
        [changelogPath(legacyId)]: legacyFixture(),
        [changelogPath(`${legacyId}-COR-001`)]: correctionFixture({
          capabilities: ["community-gallery", "my-stories"],
          clarified: "outcome: Divergent projected summary",
        }),
      },
      { asOf: AS_OF },
    );

    expect(titleDrift.errors.join("\n")).toContain(
      "corrected legacy title must match original_record.title",
    );
    expect(summaryDrift.errors.join("\n")).toContain(
      "corrected legacy summary projection must match original_record.summary",
    );
  });

  it("applies the complete accepted-closeout correction surface without rewriting the root", () => {
    const acceptedId = "CG-CHANGE-001";
    const correctionId = `${acceptedId}-COR-001`;
    const registry = buildChangelogRecordRegistry(
      {
        [changelogPath(acceptedId)]: acceptedFixture(),
        [changelogPath(correctionId)]: correctionFixture({
          targetId: acceptedId,
          capabilities: ["community-gallery"],
          clarified: `title: Corrected accepted title
change_date: 2026-07-31
accepted_on: 2026-07-31
accepted_by: Corrected Chronicle reviewer
acceptance_ref: CG-EV-008
source_revision: sha256:${"d".repeat(64)}
archived_project_id: CG-WORK-002
archive_record: docs/current-work/archive/community-gallery/CG-WORK-002.md
archive_route: /style-guide/chronicle-knowledge-base/archive/CG-WORK-002
remaining_issue_ids: [CG-ISSUE-001]`,
          effectiveClarification: `### Title

Corrected accepted title

### History Date

2026-07-31`,
        }),
      },
      { asOf: AS_OF },
    );
    const entry = registry.effectiveEntries[0];

    expect(entry.rootRecord.title).toBe("Community Gallery pilot accepted");
    expect(entry.effectiveRecord).toMatchObject({
      variant: "accepted_closeout",
      title: "Corrected accepted title",
      changeDate: "2026-07-31",
      acceptedOn: "2026-07-31",
      acceptedBy: "Corrected Chronicle reviewer",
      acceptanceRef: "CG-EV-008",
      archivedProjectId: "CG-WORK-002",
      remainingIssueIds: ["CG-ISSUE-001"],
    });
  });

  it("applies accepted narrative corrections without rewriting or revalidating the root body against effective values", () => {
    const registry = buildChangelogRecordRegistry(
      {
        [changelogPath("CG-CHANGE-001")]: acceptedFixture(),
        [changelogPath("CG-CHANGE-001-COR-001")]:
          acceptedNarrativeCorrectionFixture(),
      },
      { asOf: AS_OF },
    );
    const entry = registry.effectiveEntries[0];

    expect(entry.rootRecord.variant).toBe("accepted_closeout");
    expect(entry.rootRecord).toMatchObject({
      problem: ACCEPTED_NARRATIVE.problem,
      acceptedEvidenceLimits: ACCEPTED_NARRATIVE.acceptedEvidenceLimits,
    });
    expect(entry.effectiveRecord).toMatchObject({
      variant: "accepted_closeout",
      problem: "Corrected accepted problem",
      whyChangeWasNeeded: "Corrected accepted rationale",
      changes: "Corrected accepted changes",
      outcome: "Corrected accepted outcome",
      acceptedEvidenceSummary: "Corrected accepted evidence summary",
      acceptedEvidenceLimits: "Corrected accepted evidence limits",
    });
  });

  it("rejects correction frontmatter/body disagreement for an accepted narrative clarification", () => {
    const correction = acceptedNarrativeCorrectionFixture().replace(
      "### Accepted Evidence Limits\n\nCorrected accepted evidence limits",
      "### Accepted Evidence Limits\n\nConflicting correction body value",
    );
    const result = validateChangelogRecordSources(
      {
        [changelogPath("CG-CHANGE-001")]: acceptedFixture(),
        [changelogPath("CG-CHANGE-001-COR-001")]: correction,
      },
      { asOf: AS_OF },
    );

    expect(result.errors.join("\n")).toContain(
      '"### Accepted Evidence Limits" must exactly match',
    );
  });

  it("requires correction Authority and Reason subsections to match structured fields", () => {
    const correction = correctionFixture();
    const result = validateChangelogRecordSources(
      {
        [changelogPath("LEGACY-QH-cl-20260620-001")]: legacyFixture(),
        [changelogPath("LEGACY-QH-cl-20260620-001-COR-001")]:
          correction.replace(
            "### Correction Reason\n\nLater source inspection narrowed the affected capability list.",
            "### Correction Reason\n\nA conflicting readable reason.",
          ),
      },
      { asOf: AS_OF },
    );

    expect(result.errors.join("\n")).toContain(
      '"### Correction Reason" must exactly match frontmatter correction_reason',
    );
  });

  it("rejects placeholder-only corrected narratives and correction reasons", () => {
    const placeholderNarrative = validateChangelogRecordSources(
      {
        [changelogPath("CG-CHANGE-001")]: acceptedFixture(),
        [changelogPath("CG-CHANGE-001-COR-001")]:
          acceptedNarrativeCorrectionFixture().replace(
            "  problem: Corrected accepted problem",
            "  problem: Pending",
          ),
      },
      { asOf: AS_OF },
    );
    const placeholderReason = validateChangelogRecordSources(
      {
        [changelogPath("LEGACY-QH-cl-20260620-001")]: legacyFixture(),
        [changelogPath("LEGACY-QH-cl-20260620-001-COR-001")]:
          correctionFixture().replace(
            "correction_reason: Later source inspection narrowed the affected capability list.",
            "correction_reason: N/A",
          ),
      },
      { asOf: AS_OF },
    );

    expect(placeholderNarrative.errors.join("\n")).toContain(
      "must contain accepted content, not placeholder-only text",
    );
    expect(placeholderReason.errors.join("\n")).toContain(
      "must contain accepted content, not placeholder-only text",
    );
  });

  it("rejects clarified fields that do not change the effective record", () => {
    const result = validateChangelogRecordSources(
      {
        [changelogPath("LEGACY-QH-cl-20260620-001")]: legacyFixture(),
        [changelogPath("LEGACY-QH-cl-20260620-001-COR-001")]:
          correctionFixture({
            capabilities: ["my-stories", "community-gallery"],
            clarified:
              "affected_capabilities: [my-stories, community-gallery]",
          }),
      },
      { asOf: AS_OF },
    );

    expect(result.errors.join("\n")).toContain(
      "clarified field affectedCapabilities must change the effective record",
    );
  });

  it("selects global or capability-specific entries from the same registry", () => {
    const galleryLegacyId = "LEGACY-QH-cl-20260620-001";
    const accountLegacyId = "LEGACY-QH-cl-account-only";
    const registry = buildChangelogRecordRegistry(
      {
        [changelogPath(galleryLegacyId)]: legacyFixture(),
        [changelogPath(accountLegacyId)]: legacyFixture({
          originalId: "cl-account-only",
          title: "Account-only history",
          changeDate: "2026-07-01",
          capabilities: ["account"],
        }),
      },
      { asOf: AS_OF },
    );

    expect(selectChangelogEntriesFromRegistry(registry).map((entry) => entry.id)).toEqual([
      accountLegacyId,
      galleryLegacyId,
    ]);
    expect(
      selectChangelogEntriesFromRegistry(registry, "community-gallery").map((entry) => entry.id),
    ).toEqual([galleryLegacyId]);
    expect(selectChangelogEntriesFromRegistry(registry, "account").map((entry) => entry.id)).toEqual([
      accountLegacyId,
    ]);
  });

  it("moves a corrected legacy mapping between capability projections without duplicating the record", () => {
    const legacyId = "LEGACY-QH-cl-20260620-001";
    const registry = buildChangelogRecordRegistry(
      {
        [changelogPath(legacyId)]: legacyFixture({
          capabilities: ["community-gallery"],
        }),
        [changelogPath(`${legacyId}-COR-001`)]: correctionFixture({
          capabilities: ["account"],
          clarified: `affected_capabilities: [account]
gallery_applicability: not_applicable
applicability_evidence: Later source review assigned this record to Account only.`,
        }),
      },
      { asOf: AS_OF },
    );

    expect(selectChangelogEntriesFromRegistry(registry)).toHaveLength(1);
    expect(
      selectChangelogEntriesFromRegistry(registry, "community-gallery"),
    ).toHaveLength(0);
    expect(
      selectChangelogEntriesFromRegistry(registry, "account").map(
        (entry) => entry.id,
      ),
    ).toEqual([legacyId]);
  });

  it("keeps globally migrated non-Gallery legacy history truthful when other capability mapping is not yet reviewed", () => {
    const id = "LEGACY-QH-cl-global-unclassified";
    const registry = buildChangelogRecordRegistry(
      {
        [changelogPath(id)]: legacyFixture({
          originalId: "cl-global-unclassified",
          title: "Globally preserved unclassified history",
          capabilities: [],
        }),
      },
      { asOf: AS_OF },
    );
    const record = registry.roots[0];
    expect(record.variant).toBe("legacy_import");
    if (record.variant !== "legacy_import") throw new Error("legacy fixture missing");
    expect(record.affectedCapabilities).toEqual([]);
    expect(record.galleryApplicability).toBe("not_applicable");
    expect(record.applicabilityStatus).toBe(
      "gallery-reviewed-other-capabilities-unclassified",
    );
    expect(selectChangelogEntriesFromRegistry(registry)).toHaveLength(1);
    expect(
      selectChangelogEntriesFromRegistry(registry, "community-gallery"),
    ).toHaveLength(0);
  });

  it("keeps an unresolved Gallery applicability decision explicit and excluded", () => {
    const id = "LEGACY-QH-cl-gallery-pending";
    const source = legacyFixture({
      originalId: "cl-gallery-pending",
      capabilities: [],
    })
      .replace(
        "applicability_status: gallery-reviewed-other-capabilities-unclassified",
        "applicability_status: gallery-review-pending",
      )
      .replace(
        "gallery_applicability: not_applicable",
        "gallery_applicability: pending_excluded",
      );
    const registry = buildChangelogRecordRegistry(
      { [changelogPath(id)]: source },
      { asOf: AS_OF },
    );
    const record = registry.roots[0];
    expect(record.variant).toBe("legacy_import");
    if (record.variant !== "legacy_import") throw new Error("legacy fixture missing");
    expect(record.galleryApplicability).toBe("pending_excluded");
    expect(record.applicabilityStatus).toBe("gallery-review-pending");
    expect(selectChangelogEntriesFromRegistry(registry)).toHaveLength(1);
    expect(
      selectChangelogEntriesFromRegistry(registry, "community-gallery"),
    ).toHaveLength(0);
  });

  it("preserves the raw payload hash while replacing a private home-directory prefix", () => {
    const id = "LEGACY-QH-cl-private-path";
    const registry = buildChangelogRecordRegistry(
      { [changelogPath(id)]: privacyRedactedLegacyFixture() },
      { asOf: AS_OF },
    );
    const record = registry.roots[0];
    expect(record.variant).toBe("legacy_import");
    if (record.variant !== "legacy_import") throw new Error("legacy fixture missing");
    expect(record.originalRecord.filesAffected).toEqual([
      "$HOME/Desktop/Chronicle/file.ts",
    ]);
    expect(record.originalRecord.changes).toBe(
      "Updated $HOME/Desktop/Chronicle/file.ts",
    );
    expect(record.sourceHash).toBe("a".repeat(64));
    expect(record.preservedRecordHash).toBe(
      computeLegacyPayloadHash(record.originalRecord),
    );
    expect(record.privacyRedactions).toEqual([
      {
        field: "changes",
        transformation: "home-directory-prefix-to-$HOME",
      },
      {
        field: "filesAffected[0]",
        transformation: "home-directory-prefix-to-$HOME",
      },
    ]);
  });

  it("sorts effective entries newest first and breaks date ties by stable ID", () => {
    const firstId = "LEGACY-QH-cl-alpha";
    const secondId = "LEGACY-QH-cl-beta";
    const olderId = "LEGACY-QH-cl-older";
    const registry = buildChangelogRecordRegistry(
      {
        [changelogPath(firstId)]: legacyFixture({
          originalId: "cl-alpha",
          title: "Alpha",
          changeDate: "2026-07-01",
        }),
        [changelogPath(secondId)]: legacyFixture({
          originalId: "cl-beta",
          title: "Beta",
          changeDate: "2026-07-01",
        }),
        [changelogPath(olderId)]: legacyFixture({
          originalId: "cl-older",
          title: "Older",
          changeDate: "2026-06-01",
        }),
      },
      { asOf: AS_OF },
    );

    expect(selectChangelogEntriesFromRegistry(registry).map((entry) => entry.id)).toEqual([
      firstId,
      secondId,
      olderId,
    ]);
  });

  it("rejects capability-local paths, duplicate IDs, unknown variants, and cross-variant fields", () => {
    const accepted = acceptedFixture();
    const localPath = validateChangelogRecordSources(
      {
        "docs/architecture-knowledge/changelog/community-gallery/CG-CHANGE-001.md":
          accepted.replace(
            changelogPath("CG-CHANGE-001"),
            "docs/architecture-knowledge/changelog/community-gallery/CG-CHANGE-001.md",
          ),
      },
      { asOf: AS_OF },
    );
    expect(localPath.errors.join("\n")).toContain("canonical Changelog path must be");

    const duplicate = validateChangelogRecordSources(
      {
        [changelogPath("CG-CHANGE-001")]: accepted,
        [changelogPath("CG-CHANGE-002")]: accepted.replace(
          changelogPath("CG-CHANGE-001"),
          changelogPath("CG-CHANGE-002"),
        ),
      },
      { asOf: AS_OF },
    );
    expect(duplicate.errors.join("\n")).toContain("duplicate Changelog ID CG-CHANGE-001");

    const unknown = validateChangelogRecordSources(
      {
        [changelogPath("CG-CHANGE-001")]: accepted.replace(
          "variant: accepted_closeout",
          "variant: invented_variant",
        ),
      },
      { asOf: AS_OF },
    );
    expect(unknown.ok).toBe(false);

    const legacyWithArchive = validateChangelogRecordSources(
      {
        [changelogPath("LEGACY-QH-cl-20260620-001")]: legacyFixture().replace(
          "proof_status: not_reverified",
          "proof_status: not_reverified\narchived_project_id: CG-WORK-001",
        ),
      },
      { asOf: AS_OF },
    );
    expect(legacyWithArchive.errors.join("\n")).toContain("Unrecognized key");
  });

  it("rejects invalid accepted-closeout identity, ownership, archive, and date claims", () => {
    const wrongOwner = validateChangelogRecordSources(
      {
        [changelogPath("CG-CHANGE-001")]: acceptedFixture().replace(
          "affected_capabilities: [community-gallery]",
          "affected_capabilities: [my-stories]",
        ),
      },
      { asOf: AS_OF },
    );
    expect(wrongOwner.errors.join("\n")).toContain(
      "affected_capabilities must include owning_capability",
    );

    const wrongArchive = validateChangelogRecordSources(
      {
        [changelogPath("CG-CHANGE-001")]: acceptedFixture().replace(
          "archive_record: docs/current-work/archive/community-gallery/CG-WORK-001.md",
          "archive_record: docs/current-work/archive/community-gallery/CG-WORK-999.md",
        ),
      },
      { asOf: AS_OF },
    );
    expect(wrongArchive.errors.join("\n")).toContain("archive_record does not match");

    const wrongDate = validateChangelogRecordSources(
      {
        [changelogPath("CG-CHANGE-001")]: acceptedFixture().replace(
          "accepted_on: 2026-07-30",
          "accepted_on: 2026-07-29",
        ),
      },
      { asOf: AS_OF },
    );
    expect(wrongDate.errors.join("\n")).toContain("accepted_on must equal change_date");

    const duplicateCapability = validateChangelogRecordSources(
      {
        [changelogPath("CG-CHANGE-001")]: acceptedFixture().replace(
          "affected_capabilities: [community-gallery]",
          "affected_capabilities: [community-gallery, community-gallery]",
        ),
      },
      { asOf: AS_OF },
    );
    expect(duplicateCapability.errors.join("\n")).toContain(
      "contains duplicate capability community-gallery",
    );

    const invalidCapability = validateChangelogRecordSources(
      {
        [changelogPath("CG-CHANGE-001")]: acceptedFixture().replace(
          "affected_capabilities: [community-gallery]",
          "affected_capabilities: [community-gallery, invented-capability]",
        ),
      },
      { asOf: AS_OF },
    );
    expect(invalidCapability.ok).toBe(false);

    const vagueRevision = validateChangelogRecordSources(
      {
        [changelogPath("CG-CHANGE-001")]: acceptedFixture().replace(
          `source_revision: ${SOURCE_REVISION}`,
          "source_revision: current-worktree",
        ),
      },
      { asOf: AS_OF },
    );
    expect(vagueRevision.ok).toBe(false);

    const vagueReviewer = validateChangelogRecordSources(
      {
        [changelogPath("CG-CHANGE-001")]: acceptedFixture().replace(
          "accepted_by: Chronicle owner",
          "accepted_by: Pending final human review",
        ),
      },
      { asOf: AS_OF },
    );
    expect(vagueReviewer.errors.join("\n")).toContain(
      "must identify a real approval authority",
    );
  });

  it("rejects legacy identity drift, missing provenance, and duplicate lineage", () => {
    const wrongOriginal = validateChangelogRecordSources(
      {
        [changelogPath("LEGACY-QH-cl-20260620-001")]: legacyFixture().replace(
          "legacy_source_id: cl-20260620-001",
          "legacy_source_id: cl-different",
        ),
      },
      { asOf: AS_OF },
    );
    expect(wrongOriginal.errors.join("\n")).toContain(
      "legacy ID suffix must equal legacy_source_id",
    );

    const missingLimit = validateChangelogRecordSources(
      {
        [changelogPath("LEGACY-QH-cl-20260620-001")]: legacyFixture().replace(
          new RegExp(`provenance_limit: ${LEGACY_PROVENANCE_LIMIT}\\n`),
          "",
        ),
      },
      { asOf: AS_OF },
    );
    expect(missingLimit.ok).toBe(false);

    const duplicateLineage = validateChangelogRecordSources(
      {
        [changelogPath("LEGACY-QH-cl-20260620-001")]: legacyFixture().replace(
          "source_lineage: [owner-db, repository-seed]",
          "source_lineage: [owner-db, owner-db]",
        ),
      },
      { asOf: AS_OF },
    );
    expect(duplicateLineage.errors.join("\n")).toContain(
      "source_lineage must not contain duplicates",
    );

    const payloadHashMismatch = validateChangelogRecordSources(
      {
        [changelogPath("LEGACY-QH-cl-20260620-001")]: legacyFixture().replace(
          "summary: Original summary",
          "summary: Altered after the hash was recorded",
        ),
      },
      { asOf: AS_OF },
    );
    expect(payloadHashMismatch.errors.join("\n")).toContain(
      "source_hash does not match the canonical original_record payload",
    );
  });

  it("rejects missing correction targets, sequence gaps, date regression, and mapping drift", () => {
    const legacyId = "LEGACY-QH-cl-20260620-001";
    const missingTarget = validateChangelogRecordSources(
      {
        [changelogPath(`${legacyId}-COR-001`)]: correctionFixture(),
      },
      { asOf: AS_OF },
    );
    expect(missingTarget.errors.join("\n")).toContain(
      "must be an existing accepted or legacy record",
    );

    const sequenceGap = validateChangelogRecordSources(
      {
        [changelogPath(legacyId)]: legacyFixture(),
        [changelogPath(`${legacyId}-COR-002`)]: correctionFixture({ sequence: 2 }),
      },
      { asOf: AS_OF },
    );
    expect(sequenceGap.errors.join("\n")).toContain("must be contiguous from 1");

    const dateRegression = validateChangelogRecordSources(
      {
        [changelogPath(legacyId)]: legacyFixture(),
        [changelogPath(`${legacyId}-COR-001`)]: correctionFixture({
          changeDate: "2026-06-01",
        }),
      },
      { asOf: AS_OF },
    );
    expect(dateRegression.errors.join("\n")).toContain(
      "correction date cannot precede",
    );

    const mappingDrift = validateChangelogRecordSources(
      {
        [changelogPath(legacyId)]: legacyFixture(),
        [changelogPath(`${legacyId}-COR-001`)]: correctionFixture({
          capabilities: ["account"],
        }),
      },
      { asOf: AS_OF },
    );
    expect(mappingDrift.errors.join("\n")).toContain(
      "must state the effective capability mapping",
    );

    const acceptedId = "CG-CHANGE-001";
    const removesOwner = validateChangelogRecordSources(
      {
        [changelogPath(acceptedId)]: acceptedFixture({
          capabilities: ["community-gallery", "my-stories"],
        }),
        [changelogPath(`${acceptedId}-COR-001`)]: correctionFixture({
          targetId: acceptedId,
          capabilities: ["my-stories"],
          clarified: "affected_capabilities: [my-stories]",
        }),
      },
      { asOf: AS_OF },
    );
    expect(removesOwner.errors.join("\n")).toContain(
      "cannot remove the accepted closeout's owning capability",
    );

    const firstCorrectionId = `${legacyId}-COR-001`;
    const targetsCorrection = validateChangelogRecordSources(
      {
        [changelogPath(legacyId)]: legacyFixture(),
        [changelogPath(firstCorrectionId)]: correctionFixture(),
        [changelogPath(`${firstCorrectionId}-COR-001`)]: correctionFixture({
          targetId: firstCorrectionId,
        }),
      },
      { asOf: AS_OF },
    );
    expect(targetsCorrection.errors.join("\n")).toContain(
      "correction cannot target another correction",
    );

    const placeholderCorrectionAuthority = validateChangelogRecordSources(
      {
        [changelogPath(legacyId)]: legacyFixture(),
        [changelogPath(`${legacyId}-COR-001`)]: correctionFixture().replace(
          "correction_authority: Chronicle owner approval on 2026-08-01",
          "correction_authority: Awaiting final owner approval",
        ),
      },
      { asOf: AS_OF },
    );
    expect(placeholderCorrectionAuthority.errors.join("\n")).toContain(
      "must identify a real approval authority",
    );

    const legacyWithAcceptedField = validateChangelogRecordSources(
      {
        [changelogPath(legacyId)]: legacyFixture(),
        [changelogPath(`${legacyId}-COR-001`)]: correctionFixture({
          clarified: "accepted_by: Chronicle owner",
          capabilities: ["community-gallery", "my-stories"],
        }),
      },
      { asOf: AS_OF },
    );
    expect(legacyWithAcceptedField.errors.join("\n")).toContain(
      "clarified field acceptedBy does not apply to legacy_import records",
    );

    const legacyWithAcceptedNarrativeField =
      validateChangelogRecordSources(
        {
          [changelogPath(legacyId)]: legacyFixture(),
          [changelogPath(`${legacyId}-COR-001`)]: correctionFixture({
            clarified: "problem: A direct modern narrative override is invalid.",
            capabilities: ["community-gallery", "my-stories"],
          }).replace(
            "This section preserves the required effective clarification detail.",
            "### Problem\n\nA direct modern narrative override is invalid.",
          ),
        },
        { asOf: AS_OF },
      );
    expect(legacyWithAcceptedNarrativeField.errors.join("\n")).toContain(
      "clarified field problem does not apply to legacy_import records",
    );

    const acceptedWithLegacyField = validateChangelogRecordSources(
      {
        [changelogPath(acceptedId)]: acceptedFixture(),
        [changelogPath(`${acceptedId}-COR-001`)]: correctionFixture({
          targetId: acceptedId,
          clarified: `source_hash: ${"a".repeat(64)}`,
        }),
      },
      { asOf: AS_OF },
    );
    expect(acceptedWithLegacyField.errors.join("\n")).toContain(
      "clarified field sourceHash does not apply to accepted_closeout records",
    );

    const futureAcceptedDate = validateChangelogRecordSources(
      {
        [changelogPath(acceptedId)]: acceptedFixture(),
        [changelogPath(`${acceptedId}-COR-001`)]: correctionFixture({
          targetId: acceptedId,
          clarified: `change_date: 2099-01-01
accepted_on: 2099-01-01`,
        }),
      },
      { asOf: AS_OF },
    );
    expect(futureAcceptedDate.errors.join("\n")).toContain(
      `corrected change_date cannot be later than validation date ${AS_OF}`,
    );

    const futureLegacyDate = validateChangelogRecordSources(
      {
        [changelogPath(legacyId)]: legacyFixture(),
        [changelogPath(`${legacyId}-COR-001`)]: correctionFixture({
          clarified: "change_date: 2099-01-01",
          capabilities: ["community-gallery", "my-stories"],
        }),
      },
      { asOf: AS_OF },
    );
    expect(futureLegacyDate.errors.join("\n")).toContain(
      `corrected change_date cannot be later than validation date ${AS_OF}`,
    );
  });

  it("freezes every existing Changelog variant while permitting genuinely new roots", () => {
    const legacyId = "LEGACY-QH-cl-20260620-001";
    const acceptedId = "CG-CHANGE-001";
    const correctionId = `${legacyId}-COR-001`;
    const baseline = {
      [changelogPath(legacyId)]: legacyFixture(),
      [changelogPath(acceptedId)]: acceptedFixture(),
      [changelogPath(correctionId)]: correctionFixture(),
    };

    const appended = validateChangelogRecordSources(
      {
        ...baseline,
        [changelogPath("ACCT-CHANGE-001")]: acceptedFixture({
          id: "ACCT-CHANGE-001",
          title: "New accepted root",
        }),
        [changelogPath("LEGACY-QH-cl-new-root")]: legacyFixture({
          originalId: "cl-new-root",
          title: "New legacy root",
          capabilities: ["account"],
        }),
      },
      { asOf: AS_OF, baselineSources: baseline },
    );
    expect(appended.ok, appended.errors.join("\n")).toBe(true);

    const rewritten = validateChangelogRecordSources(
      {
        [changelogPath(legacyId)]: legacyFixture().replace(
          "Original summary",
          "Silently rewritten summary",
        ),
      },
      { asOf: AS_OF, baselineSources: baseline },
    );
    expect(rewritten.errors.join("\n")).toContain(
      "existing Changelog record was rewritten",
    );

    const rewrittenAccepted = validateChangelogRecordSources(
      {
        ...baseline,
        [changelogPath(acceptedId)]: acceptedFixture().replace(
          "Community Gallery Knowledge Base pilot was accepted",
          "Accepted root was silently rewritten",
        ),
      },
      { asOf: AS_OF, baselineSources: baseline },
    );
    expect(rewrittenAccepted.errors.join("\n")).toContain(
      "existing Changelog record was rewritten",
    );

    const rewrittenCorrection = validateChangelogRecordSources(
      {
        ...baseline,
        [changelogPath(correctionId)]: correctionFixture().replace(
          "Later source inspection narrowed",
          "Correction history was silently rewritten and narrowed",
        ),
      },
      { asOf: AS_OF, baselineSources: baseline },
    );
    expect(rewrittenCorrection.errors.join("\n")).toContain(
      "existing Changelog record was rewritten",
    );

    const removedAcceptedSources = { ...baseline };
    delete (
      removedAcceptedSources as Partial<typeof removedAcceptedSources>
    )[changelogPath(acceptedId)];
    const removed = validateChangelogRecordSources(removedAcceptedSources, {
      asOf: AS_OF,
      baselineSources: baseline,
    });
    expect(removed.errors.join("\n")).toContain(
      "existing Changelog record was removed",
    );

    const removedCorrectionSources = { ...baseline };
    delete (
      removedCorrectionSources as Partial<typeof removedCorrectionSources>
    )[changelogPath(correctionId)];
    const removedCorrection = validateChangelogRecordSources(
      removedCorrectionSources,
      { asOf: AS_OF, baselineSources: baseline },
    );
    expect(removedCorrection.errors.join("\n")).toContain(
      "existing Changelog record was removed",
    );
  });

  it("enforces global identity uniqueness even when duplicate IDs cross variant boundaries", () => {
    const legacyId = "LEGACY-QH-cl-20260620-001";
    const acceptedAtWrongPath = acceptedFixture({ id: "CG-CHANGE-999" })
      .split("CG-CHANGE-999")
      .join(legacyId);
    const result = validateChangelogRecordSources(
      {
        [changelogPath(legacyId)]: legacyFixture(),
        [changelogPath("CG-CHANGE-999")]: acceptedAtWrongPath,
      },
      { asOf: AS_OF },
    );

    expect(result.errors.join("\n")).toContain(
      `duplicate Changelog ID ${legacyId}`,
    );
  });
});
