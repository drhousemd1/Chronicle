import { createHash } from "node:crypto";
import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  APPROVED_RECORD_DIRECTORIES,
  CANONICAL_RECORD_DIRECTORY_ENTRIES,
  CHANGELOG_MIGRATION_RECEIPT_LOCATION,
  CHANGELOG_MIGRATION_RECEIPT_RECORD_ID,
  CHANGELOG_MIGRATION_RECEIPT_SOURCE_PATH,
  canonicalRecordSourcePath,
  deriveCorrectionChangeId,
  generateTransactionId,
  inspectCanonicalRecordTarget,
  isChangelogRootId,
  isLegacyChangeId,
  normalizeStrictRelativePath,
  parseCanonicalRecordId,
  parseCanonicalRecordFileName,
  parseCanonicalRecordSourcePath,
  parseTransactionId,
} from "../../../scripts/knowledge-records/path-safety";
import { parseKnowledgeRecordRequest } from "../../../scripts/knowledge-records/request-contract";
import {
  assertCanonicalInventoryMatches,
  assertInventoryPathsAbsent,
  compareCanonicalSourceInventories,
  inventoryToCanonicalSourceMap,
  inventoryToOperationalSourceMap,
  readCanonicalSourceInventory,
} from "../../../scripts/knowledge-records/source-set";

const temporaryRoots: string[] = [];

async function makeTemporaryRoot() {
  const created = await mkdtemp(path.join(tmpdir(), "chronicle-record-foundations-"));
  const physical = await realpath(created);
  temporaryRoots.push(physical);
  return physical;
}

async function makeRepositoryFixture() {
  const repoRoot = await makeTemporaryRoot();
  for (const directory of new Set(
    CANONICAL_RECORD_DIRECTORY_ENTRIES.map((entry) => entry.directory),
  )) {
    await mkdir(path.join(repoRoot, ...directory.split("/")), { recursive: true });
  }
  return repoRoot;
}

function frontmatter(fields: readonly [string, string | number][], body = "# Fixture\n") {
  const header = fields.map(([key, value]) => `${key}: ${value}`).join("\n");
  return Buffer.from(`---\n${header}\n---\n${body}`, "utf8");
}

function currentWorkContent(projectId: string, sourcePath: string) {
  return frontmatter([
    ["record_type", "current_work"],
    ["project_id", projectId],
    ["source_record", sourcePath],
  ]);
}

function issueContent(issueId: string, sourcePath: string) {
  return frontmatter([
    ["record_type", "issue"],
    ["issue_id", issueId],
    ["source_record", sourcePath],
  ]);
}

function changelogContent(
  variant: "legacy_import" | "correction" | "accepted_closeout" | "accepted_update",
  changeId: string,
  sourcePath: string,
  extra: readonly [string, string | number][] = [],
) {
  return frontmatter([
    ["record_type", "changelog"],
    ["variant", variant],
    ["change_id", changeId],
    ["source_record", sourcePath],
    ...extra,
  ]);
}

const FOUNDATION_MIGRATION_SNAPSHOT_HASH = "a".repeat(64);
const FOUNDATION_LEGACY_SELECTED_HASH = "b".repeat(64);
const FOUNDATION_SOURCE_HASH = "c".repeat(64);

function legacyChangelogContent(changeId: string) {
  const sourcePath = canonicalRecordSourcePath("changelog", changeId);
  const legacySourceId = changeId.slice("LEGACY-QH-".length);
  return frontmatter([
    ["record_type", "changelog"],
    ["variant", "legacy_import"],
    ["change_id", changeId],
    ["legacy_source_id", legacySourceId],
    ["source_hash", FOUNDATION_LEGACY_SELECTED_HASH],
    ["migration_snapshot_hash", FOUNDATION_MIGRATION_SNAPSHOT_HASH],
    ["imported_on", "2026-08-01"],
    ["source_lineage", "[owner-db, local-storage, repository-seed]"],
    ["migration_receipt", CHANGELOG_MIGRATION_RECEIPT_SOURCE_PATH],
    ["applicability_evidence", "Foundation fixture review."],
    ["gallery_applicability", "applicable"],
    ["affected_capabilities", "[community-gallery]"],
    ["source_record", sourcePath],
  ]);
}

function migrationReceiptContent(changeIds: readonly string[]) {
  const entries = changeIds
    .map((changeId) => ({
      changeId,
      legacySourceId: changeId.slice("LEGACY-QH-".length),
      generatedMarkdownSha256: createHash("sha256")
        .update(legacyChangelogContent(changeId))
        .digest("hex"),
    }))
    .sort((left, right) => left.legacySourceId.localeCompare(right.legacySourceId));
  const selectedIdsHash = createHash("sha256")
    .update(JSON.stringify(entries.map((entry) => entry.legacySourceId)))
    .digest("hex");
  const ledger = entries
    .map(
      (entry) => `  - legacy_source_id: ${entry.legacySourceId}
    canonical_change_id: ${entry.changeId}
    owner_db_hash: ${FOUNDATION_LEGACY_SELECTED_HASH}
    local_storage_hash: ${FOUNDATION_LEGACY_SELECTED_HASH}
    repository_seed_hash: ${FOUNDATION_LEGACY_SELECTED_HASH}
    selected_hash: ${FOUNDATION_LEGACY_SELECTED_HASH}
    preserved_record_hash: ${FOUNDATION_LEGACY_SELECTED_HASH}
    generated_markdown_sha256: ${entry.generatedMarkdownSha256}
    source_lineage: [owner-db, local-storage, repository-seed]
    source_difference: exact
    conflict_resolution: identical-across-all-captured-sources
    source_resolution_rationale: All captured foundation sources contain identical payload bytes.
    differing_fields: []
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: applicable
    affected_capabilities: [community-gallery]
    rationale: Foundation fixture review.
    reviewer: Foundation fixture owner
    import_status: imported`,
    )
    .join("\n");
  return Buffer.from(`---
record_type: changelog_migration_receipt
receipt_version: 1
migration_id: foundation-fixture
source_package_type: chronicle-quality-hub-changelog-migration
source_package_version: 1
source_package_sha256: ${FOUNDATION_MIGRATION_SNAPSHOT_HASH}
source_revision: foundation-source
source_fingerprint: ${FOUNDATION_SOURCE_HASH}
source_authority: foundation-authority
source_authority_ref: foundation-authority-ref
source_authority_approved_on: 2026-08-01
imported_on: 2026-08-01
provenance_limit: post_incident_union_original_170_membership_unknown
source_counts:
  ownerDb: ${entries.length}
  localStorage: ${entries.length}
  repositorySeed: ${entries.length}
source_changelog_hashes:
  ownerDb: ${FOUNDATION_SOURCE_HASH}
  localStorage: ${FOUNDATION_SOURCE_HASH}
  repositorySeed: ${FOUNDATION_SOURCE_HASH}
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
# Foundation migration receipt
`, "utf8");
}

function legacyImportContents(changeIds: readonly string[]) {
  return {
    [`${CHANGELOG_MIGRATION_RECEIPT_RECORD_ID}.md`]:
      migrationReceiptContent(changeIds),
    ...Object.fromEntries(
      changeIds.map((changeId) => [
        `${changeId}.md`,
        legacyChangelogContent(changeId),
      ]),
    ),
  };
}

async function makeRequestPackage(
  request: Record<string, unknown>,
  contents: Readonly<Record<string, Buffer>>,
) {
  const packageRoot = await makeTemporaryRoot();
  const contentDirectory = path.join(packageRoot, "content");
  await mkdir(contentDirectory);
  for (const [fileName, bytes] of Object.entries(contents)) {
    await writeFile(path.join(contentDirectory, fileName), bytes);
  }
  const requestPath = path.join(packageRoot, "request.json");
  await writeFile(requestPath, JSON.stringify(request));
  return { packageRoot, requestPath, contentDirectory };
}

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map((temporaryRoot) =>
      rm(temporaryRoot, { recursive: true, force: true }),
    ),
  );
});

describe("knowledge record path safety", () => {
  it("generates and parses a strict transaction ID", () => {
    const id = generateTransactionId({
      now: new Date("2026-08-01T12:34:56.789Z"),
      entropy: Buffer.from("0011223344556677", "hex"),
    });
    expect(id).toBe("kr-20260801T123456789Z-0011223344556677");
    expect(parseTransactionId(id)).toBe(id);
    expect(() => parseTransactionId("kr-20260231T123456789Z-0011223344556677"))
      .toThrow(/Invalid transaction ID/);
  });

  it("derives only bounded root-record corrections", () => {
    expect(deriveCorrectionChangeId("CG-CHANGE-001", 2)).toBe(
      "CG-CHANGE-001-COR-002",
    );
    expect(deriveCorrectionChangeId("LEGACY-QH-first", 1)).toBe(
      "LEGACY-QH-first-COR-001",
    );
    expect(deriveCorrectionChangeId("CG-UPDATE-001", 1)).toBe(
      "CG-UPDATE-001-COR-001",
    );
    expect(() => deriveCorrectionChangeId("CG-CHANGE-001-COR-001", 2)).toThrow(
      /accepted or legacy root/,
    );
    expect(() => deriveCorrectionChangeId("LEGACY-QH-first-COR-001", 2)).toThrow(
      /accepted or legacy root/,
    );
    expect(() => deriveCorrectionChangeId("CG-CHANGE-001", 0)).toThrow(
      /1 through 999/,
    );
  });

  it("keeps legacy root IDs disjoint from correction IDs", () => {
    expect(isChangelogRootId("CG-UPDATE-001")).toBe(true);
    expect(
      parseCanonicalRecordId("changelog", "CG-UPDATE-001-COR-001"),
    ).toBe("CG-UPDATE-001-COR-001");
    expect(isLegacyChangeId("LEGACY-QH-first")).toBe(true);
    expect(isChangelogRootId("LEGACY-QH-first")).toBe(true);
    expect(parseCanonicalRecordId("changelog", "LEGACY-QH-first")).toBe(
      "LEGACY-QH-first",
    );

    expect(isLegacyChangeId("LEGACY-QH-first-COR-001")).toBe(false);
    expect(isChangelogRootId("LEGACY-QH-first-COR-001")).toBe(false);
    expect(isLegacyChangeId("LEGACY-QH-COR-001")).toBe(false);
    expect(isChangelogRootId("LEGACY-QH-COR-001")).toBe(false);
    expect(() =>
      parseCanonicalRecordId("changelog", "LEGACY-QH-COR-001"),
    ).toThrow(/Invalid changelog record ID/);
    expect(() =>
      parseCanonicalRecordId(
        "changelog",
        "LEGACY-QH-first-COR-001-COR-002",
      ),
    ).toThrow(/Invalid changelog record ID/);
  });

  it("rejects traversal, absolute paths, backslashes, and wrong record names", () => {
    expect(() => normalizeStrictRelativePath("../CG-WORK-001.md")).toThrow();
    expect(() => normalizeStrictRelativePath("/tmp/CG-WORK-001.md")).toThrow();
    expect(() => normalizeStrictRelativePath("content\\CG-WORK-001.md")).toThrow();
    expect(() =>
      parseCanonicalRecordFileName("active-current-work", "CG-CHANGE-001.md"),
    ).toThrow(/Invalid active-current-work record ID/);
  });

  it("recognizes only the one canonical migration-receipt identity", () => {
    expect(
      canonicalRecordSourcePath(
        CHANGELOG_MIGRATION_RECEIPT_LOCATION,
        CHANGELOG_MIGRATION_RECEIPT_RECORD_ID,
      ),
    ).toBe(CHANGELOG_MIGRATION_RECEIPT_SOURCE_PATH);
    expect(
      parseCanonicalRecordSourcePath(
        CHANGELOG_MIGRATION_RECEIPT_SOURCE_PATH,
      ),
    ).toMatchObject({
      location: CHANGELOG_MIGRATION_RECEIPT_LOCATION,
      recordId: CHANGELOG_MIGRATION_RECEIPT_RECORD_ID,
    });
    expect(() =>
      parseCanonicalRecordId(
        CHANGELOG_MIGRATION_RECEIPT_LOCATION,
        "another-receipt",
      ),
    ).toThrow(/Invalid changelog-migration-receipt record ID/);
  });

  it("binds Current Work prefixes to the approved owner directories", () => {
    expect(
      canonicalRecordSourcePath("active-current-work", "KS-WORK-001"),
    ).toBe("docs/current-work/active/knowledge-system/KS-WORK-001.md");
    expect(
      canonicalRecordSourcePath("archived-current-work", "KS-WORK-001"),
    ).toBe("docs/current-work/archive/knowledge-system/KS-WORK-001.md");
    expect(
      parseCanonicalRecordSourcePath(
        "docs/current-work/active/knowledge-system/KS-WORK-001.md",
      ),
    ).toMatchObject({
      location: "active-current-work",
      recordId: "KS-WORK-001",
    });
    expect(() =>
      parseCanonicalRecordSourcePath(
        "docs/current-work/active/community-gallery/KS-WORK-001.md",
      ),
    ).toThrow(/does not belong/);
    expect(() =>
      parseCanonicalRecordSourcePath(
        "docs/current-work/active/knowledge-system/CG-WORK-001.md",
      ),
    ).toThrow(/does not belong/);
    expect(() =>
      parseCanonicalRecordId("active-current-work", "XY-WORK-001"),
    ).toThrow(/Invalid active-current-work record ID/);
  });

  it("binds capability Issue prefixes to their canonical directories", () => {
    expect(canonicalRecordSourcePath("issue", "MS-ISSUE-001")).toBe(
      "docs/architecture-knowledge/issues/my-stories/MS-ISSUE-001.md",
    );
    expect(
      parseCanonicalRecordSourcePath(
        "docs/architecture-knowledge/issues/character-builder/CB-ISSUE-002.md",
      ),
    ).toMatchObject({ location: "issue", recordId: "CB-ISSUE-002" });
    expect(() =>
      parseCanonicalRecordSourcePath(
        "docs/architecture-knowledge/issues/my-stories/CB-ISSUE-002.md",
      ),
    ).toThrow(/does not belong/);
  });

  it("rejects a symbolic-link canonical target", async () => {
    const repoRoot = await makeRepositoryFixture();
    const outside = path.join(repoRoot, "outside.md");
    await writeFile(outside, "outside");
    const target = path.join(
      repoRoot,
      APPROVED_RECORD_DIRECTORIES["active-current-work"],
      "CG-WORK-001.md",
    );
    await symlink(outside, target);
    await expect(
      inspectCanonicalRecordTarget(repoRoot, "active-current-work", "CG-WORK-001"),
    ).rejects.toThrow(/symbolic link/);
  });
});

describe("canonical source inventory", () => {
  it("preserves exact bytes, hashes, modes, and stable membership", async () => {
    const repoRoot = await makeRepositoryFixture();
    const sourcePath = canonicalRecordSourcePath("issue", "CG-ISSUE-001");
    const bytes = Buffer.from("---\r\nrecord_type: issue\r\n---\r\nCaf\u00e9\r\n", "utf8");
    const absolutePath = path.join(repoRoot, ...sourcePath.split("/"));
    await writeFile(absolutePath, bytes);
    await chmod(absolutePath, 0o640);

    const inventory = await readCanonicalSourceInventory(repoRoot);
    expect(inventory.membership).toEqual([sourcePath]);
    expect(inventory.entries[0].bytes.equals(bytes)).toBe(true);
    expect(inventory.entries[0].sha256).toBe(
      createHash("sha256").update(bytes).digest("hex"),
    );
    expect(inventory.entries[0].mode).toBe(0o640);
    expect(Buffer.from(await readFile(absolutePath)).equals(bytes)).toBe(true);
    expect(inventoryToOperationalSourceMap(inventory)[sourcePath]).toContain("Caf\u00e9\r\n");
  });

  it("inventories the receipt for stale-state protection but excludes it from operational parsing", async () => {
    const repoRoot = await makeRepositoryFixture();
    const receiptBytes = Buffer.from("supporting migration receipt", "utf8");
    const receiptPath = path.join(
      repoRoot,
      ...CHANGELOG_MIGRATION_RECEIPT_SOURCE_PATH.split("/"),
    );
    await writeFile(receiptPath, receiptBytes, { mode: 0o640 });

    const inventory = await readCanonicalSourceInventory(repoRoot);
    expect(inventory.membership).toEqual([
      CHANGELOG_MIGRATION_RECEIPT_SOURCE_PATH,
    ]);
    expect(
      inventoryToCanonicalSourceMap(inventory)[
        CHANGELOG_MIGRATION_RECEIPT_SOURCE_PATH
      ],
    ).toBe("supporting migration receipt");
    expect(inventoryToOperationalSourceMap(inventory)).not.toHaveProperty(
      CHANGELOG_MIGRATION_RECEIPT_SOURCE_PATH,
    );
  });

  it("detects membership, byte, and mode drift", async () => {
    const repoRoot = await makeRepositoryFixture();
    const issuePath = canonicalRecordSourcePath("issue", "CG-ISSUE-001");
    const issueAbsolute = path.join(repoRoot, ...issuePath.split("/"));
    await writeFile(issueAbsolute, "before");
    const expected = await readCanonicalSourceInventory(repoRoot);

    await writeFile(issueAbsolute, "after");
    await chmod(issueAbsolute, 0o600);
    const addedPath = canonicalRecordSourcePath("changelog", "LEGACY-QH-new-entry");
    await writeFile(path.join(repoRoot, ...addedPath.split("/")), "new");
    const current = await readCanonicalSourceInventory(repoRoot);
    const difference = compareCanonicalSourceInventories(expected, current);

    expect(difference.matches).toBe(false);
    expect(difference.added).toEqual([addedPath]);
    expect(difference.changed.map((entry) => entry.sourcePath)).toEqual([issuePath]);
    expect(difference.modeChanged.map((entry) => entry.sourcePath)).toEqual([issuePath]);
    expect(() => assertCanonicalInventoryMatches(expected, current)).toThrow(
      /Canonical source inventory drifted/,
    );
    expect(() => assertInventoryPathsAbsent(current, [addedPath])).toThrow(
      /already exist/,
    );
  });

  it("rejects symlinks in a canonical record directory", async () => {
    const repoRoot = await makeRepositoryFixture();
    const outside = path.join(repoRoot, "outside.md");
    await writeFile(outside, "outside");
    await symlink(
      outside,
      path.join(
        repoRoot,
        APPROVED_RECORD_DIRECTORIES.changelog,
        "LEGACY-QH-linked.md",
      ),
    );
    await expect(readCanonicalSourceInventory(repoRoot)).rejects.toThrow(
      /Symbolic links are not allowed/,
    );
  });
});

describe("strict knowledge record requests", () => {
  it("normalizes one valid protected project create", async () => {
    const projectId = "CG-WORK-002";
    const target = canonicalRecordSourcePath("active-current-work", projectId);
    const { requestPath } = await makeRequestPackage(
      {
        version: 1,
        kind: "project-create",
        as_of: "2026-08-01",
        project_id: projectId,
        content_file: `content/${projectId}.md`,
      },
      { [`${projectId}.md`]: currentWorkContent(projectId, target) },
    );

    const parsed = await parseKnowledgeRecordRequest(requestPath);
    expect(parsed.kind).toBe("project-create");
    expect(parsed.operations).toHaveLength(1);
    expect(parsed.operations[0]).toMatchObject({
      order: 0,
      action: "create",
      location: "active-current-work",
      recordId: projectId,
      targetSourcePath: target,
      expectedState: "absent",
    });
  });

  it("normalizes a supplied Accepted Update ID and rejects unregistered ownership", async () => {
    const changeId = "CG-UPDATE-001";
    const target = canonicalRecordSourcePath("changelog", changeId);
    const validContent = changelogContent(
      "accepted_update",
      changeId,
      target,
      [
        ["provenance", "accepted-update"],
        ["owning_capability", "community-gallery"],
      ],
    );
    const valid = await makeRequestPackage(
      {
        version: 1,
        kind: "accepted-update",
        as_of: "2026-08-21",
        change_id: changeId,
        owner_capability: "community-gallery",
        content_file: `content/${changeId}.md`,
      },
      { [`${changeId}.md`]: validContent },
    );
    const parsed = await parseKnowledgeRecordRequest(valid.requestPath);
    expect(parsed.kind).toBe("accepted-update");
    expect(parsed.operations).toEqual([
      expect.objectContaining({
        action: "create",
        recordId: changeId,
        targetSourcePath: target,
        expectedState: "absent",
      }),
    ]);

    const wrongOwner = await makeRequestPackage(
      {
        version: 1,
        kind: "accepted-update",
        as_of: "2026-08-21",
        change_id: changeId,
        owner_capability: "chat-interface",
        content_file: `content/${changeId}.md`,
      },
      { [`${changeId}.md`]: validContent },
    );
    await expect(
      parseKnowledgeRecordRequest(wrongOwner.requestPath),
    ).rejects.toThrow("belongs to community-gallery, not chat-interface");

    const unsupportedPrefix = await makeRequestPackage(
      {
        version: 1,
        kind: "accepted-update",
        as_of: "2026-08-21",
        change_id: "KS-UPDATE-001",
        owner_capability: "knowledge-system",
        content_file: "content/KS-UPDATE-001.md",
      },
      {
        "KS-UPDATE-001.md": changelogContent(
          "accepted_update",
          "KS-UPDATE-001",
          "docs/architecture-knowledge/changelog/entries/KS-UPDATE-001.md",
          [
            ["provenance", "accepted-update"],
            ["owning_capability", "knowledge-system"],
          ],
        ),
      },
    );
    await expect(
      parseKnowledgeRecordRequest(unsupportedPrefix.requestPath),
    ).rejects.toThrow("must identify a registered Accepted Update ID");
  });

  it("normalizes an explicitly identified Knowledge System project without allocating an ID", async () => {
    const projectId = "KS-WORK-001";
    const target = canonicalRecordSourcePath("active-current-work", projectId);
    const valid = await makeRequestPackage(
      {
        version: 1,
        kind: "project-create",
        as_of: "2026-08-19",
        project_id: projectId,
        content_file: `content/${projectId}.md`,
      },
      { [`${projectId}.md`]: currentWorkContent(projectId, target) },
    );
    const parsed = await parseKnowledgeRecordRequest(valid.requestPath);
    expect(parsed.operations[0]).toMatchObject({
      recordId: projectId,
      targetSourcePath: target,
    });

    const missingId = await makeRequestPackage(
      {
        version: 1,
        kind: "project-create",
        as_of: "2026-08-19",
        content_file: `content/${projectId}.md`,
      },
      { [`${projectId}.md`]: currentWorkContent(projectId, target) },
    );
    await expect(parseKnowledgeRecordRequest(missingId.requestPath)).rejects.toThrow(
      /project_id/,
    );

    const fabricatedPrefix = await makeRequestPackage(
      {
        version: 1,
        kind: "project-create",
        as_of: "2026-08-19",
        project_id: "XY-WORK-001",
        content_file: "content/XY-WORK-001.md",
      },
      {
        "XY-WORK-001.md": currentWorkContent(
          "XY-WORK-001",
          "docs/current-work/active/knowledge-system/XY-WORK-001.md",
        ),
      },
    );
    await expect(
      parseKnowledgeRecordRequest(fabricatedPrefix.requestPath),
    ).rejects.toThrow(/approved operational project/);
  });

  it("rejects project-create destination overrides and identity mismatches", async () => {
    const projectId = "CG-WORK-002";
    const target = canonicalRecordSourcePath("active-current-work", projectId);
    const withDestinationOverride = await makeRequestPackage(
      {
        version: 1,
        kind: "project-create",
        as_of: "2026-08-01",
        project_id: projectId,
        content_file: `content/${projectId}.md`,
        target_path: "docs/current-work/active/community-gallery/arbitrary.md",
      },
      { [`${projectId}.md`]: currentWorkContent(projectId, target) },
    );
    await expect(
      parseKnowledgeRecordRequest(withDestinationOverride.requestPath),
    ).rejects.toThrow(/target_path/);

    const mismatchedFilename = await makeRequestPackage(
      {
        version: 1,
        kind: "project-create",
        as_of: "2026-08-01",
        project_id: projectId,
        content_file: "content/CG-WORK-003.md",
      },
      { "CG-WORK-003.md": currentWorkContent(projectId, target) },
    );
    await expect(
      parseKnowledgeRecordRequest(mismatchedFilename.requestPath),
    ).rejects.toThrow(/Content filename must match record ID/);

    const mismatchedFrontmatter = await makeRequestPackage(
      {
        version: 1,
        kind: "project-create",
        as_of: "2026-08-01",
        project_id: projectId,
        content_file: `content/${projectId}.md`,
      },
      {
        [`${projectId}.md`]: currentWorkContent(
          "CG-WORK-003",
          target,
        ),
      },
    );
    await expect(
      parseKnowledgeRecordRequest(mismatchedFrontmatter.requestPath),
    ).rejects.toThrow(/mismatched project_id/);
  });

  it("normalizes one valid project update", async () => {
    const projectId = "CG-WORK-001";
    const target = canonicalRecordSourcePath("active-current-work", projectId);
    const expectedSourceSha256 = "a".repeat(64);
    const { requestPath } = await makeRequestPackage(
      {
        version: 1,
        kind: "project-update",
        as_of: "2026-08-01",
        project_id: projectId,
        expected_source_sha256: expectedSourceSha256,
        content_file: `content/${projectId}.md`,
      },
      { [`${projectId}.md`]: currentWorkContent(projectId, target) },
    );
    const parsed = await parseKnowledgeRecordRequest(requestPath);
    expect(parsed.kind).toBe("project-update");
    expect(parsed.requestByteSize).toBe((await readFile(requestPath)).length);
    expect(parsed.requestSha256).toBe(
      createHash("sha256").update(await readFile(requestPath)).digest("hex"),
    );
    expect(parsed.operations).toHaveLength(1);
    expect(parsed.operations[0]).toMatchObject({
      order: 0,
      action: "update",
      targetSourcePath: target,
      expectedState: "present",
      expectedSourceSha256,
    });
  });

  it.each([
    { kind: "issue-create" as const, action: "create" as const, issueId: "CG-ISSUE-002" },
    { kind: "issue-create" as const, action: "create" as const, issueId: "MS-ISSUE-002" },
    { kind: "issue-create" as const, action: "create" as const, issueId: "CL-ISSUE-002" },
    { kind: "issue-create" as const, action: "create" as const, issueId: "MI-ISSUE-002" },
    { kind: "issue-create" as const, action: "create" as const, issueId: "SB-ISSUE-002" },
    { kind: "issue-create" as const, action: "create" as const, issueId: "CB-ISSUE-002" },
    { kind: "issue-update" as const, action: "update" as const, issueId: "CG-ISSUE-001" },
  ])("normalizes one protected $kind request", async ({ kind, action, issueId }) => {
    const target = canonicalRecordSourcePath("issue", issueId);
    const expectedSourceSha256 = "b".repeat(64);
    const { requestPath } = await makeRequestPackage(
      {
        version: 1,
        kind,
        as_of: "2026-08-01",
        issue_id: issueId,
        ...(kind === "issue-update"
          ? { expected_source_sha256: expectedSourceSha256 }
          : {}),
        content_file: `content/${issueId}.md`,
      },
      { [`${issueId}.md`]: issueContent(issueId, target) },
    );

    const parsed = await parseKnowledgeRecordRequest(requestPath);
    expect(parsed.kind).toBe(kind);
    expect(parsed.operations).toHaveLength(1);
    expect(parsed.operations[0]).toMatchObject({
      order: 0,
      action,
      location: "issue",
      targetSourcePath: target,
      expectedState: action === "create" ? "absent" : "present",
      ...(action === "update" ? { expectedSourceSha256 } : {}),
    });
  });

  it.each([
    { kind: "project-update", idField: "project_id", id: "CG-WORK-001" },
    { kind: "issue-update", idField: "issue_id", id: "CG-ISSUE-001" },
  ])(
    "rejects $kind without the editor-read source hash",
    async ({ kind, idField, id }) => {
      const target = canonicalRecordSourcePath(
        kind === "project-update" ? "active-current-work" : "issue",
        id,
      );
      const { requestPath } = await makeRequestPackage(
        {
          version: 1,
          kind,
          as_of: "2026-08-01",
          [idField]: id,
          content_file: `content/${id}.md`,
        },
        {
          [`${id}.md`]: kind === "project-update"
            ? currentWorkContent(id, target)
            : issueContent(id, target),
        },
      );

      await expect(parseKnowledgeRecordRequest(requestPath)).rejects.toThrow(
        /expected_source_sha256/,
      );
    },
  );

  it("rejects a malformed editor-read source hash", async () => {
    const projectId = "CG-WORK-001";
    const target = canonicalRecordSourcePath("active-current-work", projectId);
    const { requestPath } = await makeRequestPackage(
      {
        version: 1,
        kind: "project-update",
        as_of: "2026-08-01",
        project_id: projectId,
        expected_source_sha256: "not-a-sha256",
        content_file: `content/${projectId}.md`,
      },
      { [`${projectId}.md`]: currentWorkContent(projectId, target) },
    );

    await expect(parseKnowledgeRecordRequest(requestPath)).rejects.toThrow(
      /expected_source_sha256/,
    );
  });

  it("normalizes multiple legacy creates without arbitrary destinations", async () => {
    const ids = ["LEGACY-QH-first", "LEGACY-QH-second"];
    const { requestPath } = await makeRequestPackage(
      {
        version: 1,
        kind: "legacy-import",
        as_of: "2026-08-01",
        receipt_content_file: `content/${CHANGELOG_MIGRATION_RECEIPT_RECORD_ID}.md`,
        records: ids.map((changeId) => ({
          change_id: changeId,
          content_file: `content/${changeId}.md`,
        })),
      },
      legacyImportContents(ids),
    );
    const parsed = await parseKnowledgeRecordRequest(requestPath);
    expect(parsed.operations.map((operation) => operation.targetSourcePath)).toEqual(
      [
        ...ids.map((id) => canonicalRecordSourcePath("changelog", id)),
        CHANGELOG_MIGRATION_RECEIPT_SOURCE_PATH,
      ],
    );
    expect(parsed.operations.every((operation) => operation.action === "create")).toBe(true);
  });

  it("rejects a receipt whose identity, counts, or selected package do not match the import", async () => {
    const legacyId = "LEGACY-QH-first";
    const request = {
      version: 1,
      kind: "legacy-import",
      as_of: "2026-08-01",
      receipt_content_file: `content/${CHANGELOG_MIGRATION_RECEIPT_RECORD_ID}.md`,
      records: [
        {
          change_id: legacyId,
          content_file: `content/${legacyId}.md`,
        },
      ],
    };

    const mismatchedCount = legacyImportContents([legacyId]);
    mismatchedCount[`${CHANGELOG_MIGRATION_RECEIPT_RECORD_ID}.md`] = Buffer.from(
      mismatchedCount[`${CHANGELOG_MIGRATION_RECEIPT_RECORD_ID}.md`]
        .toString("utf8")
        .replace("  ownerDb: 1", "  ownerDb: 2"),
      "utf8",
    );
    const countPackage = await makeRequestPackage(request, mismatchedCount);
    await expect(parseKnowledgeRecordRequest(countPackage.requestPath)).rejects.toThrow(
      /source counts do not match/,
    );

    const mismatchedSnapshot = legacyImportContents([legacyId]);
    mismatchedSnapshot[`${legacyId}.md`] = Buffer.from(
      mismatchedSnapshot[`${legacyId}.md`]
        .toString("utf8")
        .replace(
          `migration_snapshot_hash: ${FOUNDATION_MIGRATION_SNAPSHOT_HASH}`,
          `migration_snapshot_hash: ${"d".repeat(64)}`,
      ),
      "utf8",
    );
    const snapshotRecordHash = createHash("sha256")
      .update(mismatchedSnapshot[`${legacyId}.md`])
      .digest("hex");
    mismatchedSnapshot[`${CHANGELOG_MIGRATION_RECEIPT_RECORD_ID}.md`] =
      Buffer.from(
        mismatchedSnapshot[
          `${CHANGELOG_MIGRATION_RECEIPT_RECORD_ID}.md`
        ]
          .toString("utf8")
          .replace(
            /generated_markdown_sha256: [a-f0-9]{64}/,
            `generated_markdown_sha256: ${snapshotRecordHash}`,
          ),
        "utf8",
      );
    const snapshotPackage = await makeRequestPackage(request, mismatchedSnapshot);
    await expect(
      parseKnowledgeRecordRequest(snapshotPackage.requestPath),
    ).rejects.toThrow(/mismatched migration_snapshot_hash/);

    const mismatchedGeneratedHash = legacyImportContents([legacyId]);
    mismatchedGeneratedHash[`${CHANGELOG_MIGRATION_RECEIPT_RECORD_ID}.md`] =
      Buffer.from(
        mismatchedGeneratedHash[
          `${CHANGELOG_MIGRATION_RECEIPT_RECORD_ID}.md`
        ]
          .toString("utf8")
          .replace(
            /generated_markdown_sha256: [a-f0-9]{64}/,
            `generated_markdown_sha256: ${"e".repeat(64)}`,
          ),
        "utf8",
      );
    const generatedHashPackage = await makeRequestPackage(
      request,
      mismatchedGeneratedHash,
    );
    await expect(
      parseKnowledgeRecordRequest(generatedHashPackage.requestPath),
    ).rejects.toThrow(/generated Markdown hash does not match/);

    const wrongReceiptIdentity = legacyImportContents([legacyId]);
    wrongReceiptIdentity[`${CHANGELOG_MIGRATION_RECEIPT_RECORD_ID}.md`] = Buffer.from(
      wrongReceiptIdentity[`${CHANGELOG_MIGRATION_RECEIPT_RECORD_ID}.md`]
        .toString("utf8")
        .replace(
          `source_record: ${CHANGELOG_MIGRATION_RECEIPT_SOURCE_PATH}`,
          "source_record: docs/architecture-knowledge/changelog/other.md",
        ),
      "utf8",
    );
    const identityPackage = await makeRequestPackage(request, wrongReceiptIdentity);
    await expect(parseKnowledgeRecordRequest(identityPackage.requestPath)).rejects.toThrow(
      /source_record/,
    );
  });

  it.each(["LEGACY-QH-first-COR-001", "LEGACY-QH-COR-001"])(
    "rejects correction-shaped legacy import root %s",
    async (changeId) => {
      const { requestPath } = await makeRequestPackage(
        {
          version: 1,
          kind: "legacy-import",
          as_of: "2026-08-01",
          receipt_content_file: `content/${CHANGELOG_MIGRATION_RECEIPT_RECORD_ID}.md`,
          records: [
            {
              change_id: changeId,
              content_file: `content/${changeId}.md`,
            },
          ],
        },
        {
          [`${changeId}.md`]: changelogContent(
            "legacy_import",
            changeId,
            `docs/architecture-knowledge/changelog/entries/${changeId}.md`,
          ),
        },
      );

      await expect(parseKnowledgeRecordRequest(requestPath)).rejects.toThrow(
        /records\.0\.change_id: must identify a legacy Changelog root ID/,
      );
    },
  );

  it("normalizes one correction create and verifies the declared target", async () => {
    const targetId = "LEGACY-QH-first";
    const changeId = "LEGACY-QH-first-COR-001";
    const { requestPath } = await makeRequestPackage(
      {
        version: 1,
        kind: "correction",
        as_of: "2026-08-01",
        target_change_id: targetId,
        correction_sequence: 1,
        content_file: `content/${changeId}.md`,
      },
      {
        [`${changeId}.md`]: changelogContent(
          "correction",
          changeId,
          canonicalRecordSourcePath("changelog", changeId),
          [
            ["target_change_id", targetId],
            ["correction_sequence", 1],
          ],
        ),
      },
    );
    const parsed = await parseKnowledgeRecordRequest(requestPath);
    expect(parsed.operations[0]).toMatchObject({
      action: "create",
      recordId: changeId,
    });
  });

  it("emits closeout in engine-controlled create, create, remove order", async () => {
    const projectId = "CG-WORK-001";
    const changeId = "CG-CHANGE-001";
    const archivePath = canonicalRecordSourcePath("archived-current-work", projectId);
    const changePath = canonicalRecordSourcePath("changelog", changeId);
    const { requestPath } = await makeRequestPackage(
      {
        version: 1,
        kind: "closeout",
        as_of: "2026-08-01",
        project_id: projectId,
        change_id: changeId,
        expected_project_sha256: "c".repeat(64),
        archive_content_file: `content/${projectId}.md`,
        changelog_content_file: `content/${changeId}.md`,
      },
      {
        [`${projectId}.md`]: currentWorkContent(projectId, archivePath),
        [`${changeId}.md`]: changelogContent(
          "accepted_closeout",
          changeId,
          changePath,
          [
            ["archived_project_id", projectId],
            ["archive_record", archivePath],
          ],
        ),
      },
    );
    const parsed = await parseKnowledgeRecordRequest(requestPath);
    expect(parsed.operations.map((operation) => ({
      order: operation.order,
      action: operation.action,
      targetSourcePath: operation.targetSourcePath,
      ...(operation.action === "remove"
        ? { expectedSourceSha256: operation.expectedSourceSha256 }
        : {}),
    }))).toEqual([
      { order: 0, action: "create", targetSourcePath: archivePath },
      { order: 1, action: "create", targetSourcePath: changePath },
      {
        order: 2,
        action: "remove",
        targetSourcePath: canonicalRecordSourcePath("active-current-work", projectId),
        expectedSourceSha256: "c".repeat(64),
      },
    ]);
  });

  it("carries editor-read hashes for closeout Issue updates and project removal", async () => {
    const projectId = "CG-WORK-001";
    const issueId = "CG-ISSUE-001";
    const changeId = "CG-CHANGE-001";
    const archivePath = canonicalRecordSourcePath("archived-current-work", projectId);
    const issuePath = canonicalRecordSourcePath("issue", issueId);
    const changePath = canonicalRecordSourcePath("changelog", changeId);
    const issueHash = "d".repeat(64);
    const projectHash = "e".repeat(64);
    const { requestPath } = await makeRequestPackage(
      {
        version: 1,
        kind: "closeout",
        as_of: "2026-08-01",
        project_id: projectId,
        change_id: changeId,
        expected_project_sha256: projectHash,
        archive_content_file: `content/${projectId}.md`,
        changelog_content_file: `content/${changeId}.md`,
        issue_updates: [
          {
            issue_id: issueId,
            expected_source_sha256: issueHash,
            content_file: `content/${issueId}.md`,
          },
        ],
      },
      {
        [`${issueId}.md`]: issueContent(issueId, issuePath),
        [`${projectId}.md`]: currentWorkContent(projectId, archivePath),
        [`${changeId}.md`]: changelogContent(
          "accepted_closeout",
          changeId,
          changePath,
          [
            ["archived_project_id", projectId],
            ["archive_record", archivePath],
          ],
        ),
      },
    );

    const parsed = await parseKnowledgeRecordRequest(requestPath);
    expect(parsed.operations[0]).toMatchObject({
      action: "update",
      recordId: issueId,
      expectedSourceSha256: issueHash,
    });
    expect(parsed.operations.at(-1)).toMatchObject({
      action: "remove",
      recordId: projectId,
      expectedSourceSha256: projectHash,
    });
  });

  it("rejects traversal, wrong variants, duplicate targets, bad dates, and extra files", async () => {
    const legacyId = "LEGACY-QH-first";
    const legacyPath = canonicalRecordSourcePath("changelog", legacyId);

    const traversal = await makeRequestPackage(
      {
        version: 1,
        kind: "legacy-import",
        as_of: "2026-08-01",
        receipt_content_file: `content/${CHANGELOG_MIGRATION_RECEIPT_RECORD_ID}.md`,
        records: [{ change_id: legacyId, content_file: "../outside.md" }],
      },
      { [`${legacyId}.md`]: changelogContent("legacy_import", legacyId, legacyPath) },
    );
    await expect(parseKnowledgeRecordRequest(traversal.requestPath)).rejects.toThrow(
      /content_file/,
    );

    const wrongVariant = await makeRequestPackage(
      {
        version: 1,
        kind: "legacy-import",
        as_of: "2026-08-01",
        receipt_content_file: `content/${CHANGELOG_MIGRATION_RECEIPT_RECORD_ID}.md`,
        records: [{ change_id: legacyId, content_file: `content/${legacyId}.md` }],
      },
      {
        [`${CHANGELOG_MIGRATION_RECEIPT_RECORD_ID}.md`]:
          migrationReceiptContent([legacyId]),
        [`${legacyId}.md`]: changelogContent(
          "accepted_closeout",
          legacyId,
          legacyPath,
        ),
      },
    );
    await expect(parseKnowledgeRecordRequest(wrongVariant.requestPath)).rejects.toThrow(
      /mismatched variant/,
    );

    const duplicate = await makeRequestPackage(
      {
        version: 1,
        kind: "legacy-import",
        as_of: "2026-08-01",
        receipt_content_file: `content/${CHANGELOG_MIGRATION_RECEIPT_RECORD_ID}.md`,
        records: [1, 2].map(() => ({
          change_id: legacyId,
          content_file: `content/${legacyId}.md`,
        })),
      },
      legacyImportContents([legacyId]),
    );
    await expect(parseKnowledgeRecordRequest(duplicate.requestPath)).rejects.toThrow(
      /same content file more than once/,
    );

    const badDate = await makeRequestPackage(
      {
        version: 1,
        kind: "legacy-import",
        as_of: "2026-02-31",
        receipt_content_file: `content/${CHANGELOG_MIGRATION_RECEIPT_RECORD_ID}.md`,
        records: [{ change_id: legacyId, content_file: `content/${legacyId}.md` }],
      },
      { [`${legacyId}.md`]: changelogContent("legacy_import", legacyId, legacyPath) },
    );
    await expect(parseKnowledgeRecordRequest(badDate.requestPath)).rejects.toThrow(
      /real calendar date/,
    );

    const extra = await makeRequestPackage(
      {
        version: 1,
        kind: "legacy-import",
        as_of: "2026-08-01",
        receipt_content_file: `content/${CHANGELOG_MIGRATION_RECEIPT_RECORD_ID}.md`,
        records: [{ change_id: legacyId, content_file: `content/${legacyId}.md` }],
      },
      {
        ...legacyImportContents([legacyId]),
        "LEGACY-QH-extra.md": Buffer.from("extra"),
      },
    );
    await expect(parseKnowledgeRecordRequest(extra.requestPath)).rejects.toThrow(
      /missing or extra files/,
    );

    const missing = await makeRequestPackage(
      {
        version: 1,
        kind: "legacy-import",
        as_of: "2026-08-01",
        receipt_content_file: `content/${CHANGELOG_MIGRATION_RECEIPT_RECORD_ID}.md`,
        records: [{ change_id: legacyId, content_file: `content/${legacyId}.md` }],
      },
      {},
    );
    await expect(parseKnowledgeRecordRequest(missing.requestPath)).rejects.toThrow(
      /missing or extra files/,
    );

    const wrongPrefix = await makeRequestPackage(
      {
        version: 1,
        kind: "legacy-import",
        as_of: "2026-08-01",
        receipt_content_file: `content/${CHANGELOG_MIGRATION_RECEIPT_RECORD_ID}.md`,
        records: [
          { change_id: "CG-CHANGE-001", content_file: "content/CG-CHANGE-001.md" },
        ],
      },
      {
        "CG-CHANGE-001.md": changelogContent(
          "legacy_import",
          "CG-CHANGE-001",
          canonicalRecordSourcePath("changelog", "CG-CHANGE-001"),
        ),
      },
    );
    await expect(parseKnowledgeRecordRequest(wrongPrefix.requestPath)).rejects.toThrow(
      /records\.0\.change_id/,
    );

    const unknownKey = await makeRequestPackage(
      {
        version: 1,
        kind: "legacy-import",
        as_of: "2026-08-01",
        receipt_content_file: `content/${CHANGELOG_MIGRATION_RECEIPT_RECORD_ID}.md`,
        records: [{ change_id: legacyId, content_file: `content/${legacyId}.md` }],
        destination: legacyPath,
      },
      { [`${legacyId}.md`]: changelogContent("legacy_import", legacyId, legacyPath) },
    );
    await expect(parseKnowledgeRecordRequest(unknownKey.requestPath)).rejects.toThrow(
      /Unrecognized key/,
    );
  });

  it("rejects a symbolic-link request content file", async () => {
    const legacyId = "LEGACY-QH-linked";
    const packageRoot = await makeTemporaryRoot();
    const contentDirectory = path.join(packageRoot, "content");
    await mkdir(contentDirectory);
    await writeFile(
      path.join(
        contentDirectory,
        `${CHANGELOG_MIGRATION_RECEIPT_RECORD_ID}.md`,
      ),
      migrationReceiptContent([legacyId]),
    );
    const outside = path.join(packageRoot, "outside.md");
    await writeFile(
      outside,
      changelogContent(
        "legacy_import",
        legacyId,
        canonicalRecordSourcePath("changelog", legacyId),
      ),
    );
    await symlink(outside, path.join(contentDirectory, `${legacyId}.md`));
    const requestPath = path.join(packageRoot, "request.json");
    await writeFile(
      requestPath,
      JSON.stringify({
        version: 1,
        kind: "legacy-import",
        as_of: "2026-08-01",
        receipt_content_file: `content/${CHANGELOG_MIGRATION_RECEIPT_RECORD_ID}.md`,
        records: [
          { change_id: legacyId, content_file: `content/${legacyId}.md` },
        ],
      }),
    );

    await expect(parseKnowledgeRecordRequest(requestPath)).rejects.toThrow(
      /Symbolic links are not allowed/,
    );
  });
});
