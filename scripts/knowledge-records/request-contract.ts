import { createHash } from "node:crypto";
import { lstat, readFile, readdir, realpath } from "node:fs/promises";
import path from "node:path";

import { parse as parseYaml } from "yaml";
import { z } from "zod";

import {
  CHANGELOG_MIGRATION_RECEIPT_LOCATION,
  CHANGELOG_MIGRATION_RECEIPT_RECORD_ID,
  CHANGELOG_MIGRATION_RECEIPT_SOURCE_PATH,
  assertNoSymlinkComponents,
  assertRealDirectory,
  canonicalRecordSourcePath,
  deriveCorrectionChangeId,
  isAcceptedChangeId,
  isAcceptedUpdateId,
  isLegacyChangeId,
  normalizeStrictRelativePath,
  parseCanonicalRecordId,
  resolveContainedPath,
  type CanonicalRecordLocation,
} from "./path-safety";
import { sha256Buffer } from "./source-set";
import {
  isOperationalIssueId,
  isOperationalProjectId,
} from "../../src/data/chronicle-knowledge-base/operational-capability-registry";
import { assertAcceptedUpdateOwner } from "../../src/data/chronicle-knowledge-base/accepted-update-capability-registry";

export const KNOWLEDGE_RECORD_REQUEST_VERSION = 1 as const;
export const MAX_REQUEST_BYTES = 1024 * 1024;
export const MAX_CONTENT_FILE_BYTES = 8 * 1024 * 1024;
export const MAX_TOTAL_CONTENT_BYTES = 128 * 1024 * 1024;
export const MAX_REQUEST_RECORDS = 500;

export type KnowledgeRecordRequestKind =
  | "project-create"
  | "project-update"
  | "issue-create"
  | "issue-update"
  | "accepted-update"
  | "legacy-import"
  | "correction"
  | "closeout";

export type LoadedRequestContent = Readonly<{
  requestRelativePath: string;
  absolutePath: string;
  bytes: Buffer;
  sha256: string;
  mode: number;
}>;

type CreateOperation = Readonly<{
  order: number;
  action: "create";
  location: CanonicalRecordLocation;
  recordId: string;
  targetSourcePath: string;
  expectedState: "absent";
  content: LoadedRequestContent;
}>;

type UpdateOperation = Readonly<{
  order: number;
  action: "update";
  location: "active-current-work" | "issue";
  recordId: string;
  targetSourcePath: string;
  expectedState: "present";
  expectedSourceSha256: string;
  content: LoadedRequestContent;
}>;

type RemoveOperation = Readonly<{
  order: number;
  action: "remove";
  location: "active-current-work";
  recordId: string;
  targetSourcePath: string;
  expectedState: "present";
  expectedSourceSha256: string;
}>;

export type NormalizedRecordOperation =
  | CreateOperation
  | UpdateOperation
  | RemoveOperation;

export type NormalizedKnowledgeRecordRequest = Readonly<{
  version: typeof KNOWLEDGE_RECORD_REQUEST_VERSION;
  kind: KnowledgeRecordRequestKind;
  asOf: string;
  requestPath: string;
  requestSha256: string;
  requestByteSize: number;
  packageRoot: string;
  operations: readonly NormalizedRecordOperation[];
}>;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const GALLERY_PROJECT_ID = /^CG-WORK-\d{3}$/;
const GALLERY_ISSUE_ID = /^CG-ISSUE-\d{3}$/;
const ACCEPTED_CHANGE_ID = /^CG-CHANGE-\d{3}$/;
const CONTENT_FILE = /^content\/[^/]+\.md$/;
const SHA256 = /^[a-f0-9]{64}$/;
const LEGACY_SOURCE_LINEAGE = [
  "owner-db",
  "local-storage",
  "repository-seed",
] as const;

const dateSchema = z
  .string()
  .regex(ISO_DATE, "must use YYYY-MM-DD")
  .refine(isRealIsoDate, "must be a real calendar date");
const contentFileSchema = z.string().regex(
  CONTENT_FILE,
  "must name one direct Markdown file under content/",
);
const operationalProjectIdSchema = z
  .string()
  .refine(isOperationalProjectId, "must identify an approved operational project");
const operationalIssueIdSchema = z
  .string()
  .refine(isOperationalIssueId, "must identify an approved operational Issue");

const baseSchema = z.object({
  version: z.literal(KNOWLEDGE_RECORD_REQUEST_VERSION),
  as_of: dateSchema,
});

const projectUpdateSchema = baseSchema
  .extend({
    kind: z.literal("project-update"),
    project_id: operationalProjectIdSchema,
    expected_source_sha256: z.string().regex(SHA256),
    content_file: contentFileSchema,
  })
  .strict();

const projectCreateSchema = baseSchema
  .extend({
    kind: z.literal("project-create"),
    project_id: operationalProjectIdSchema,
    content_file: contentFileSchema,
  })
  .strict();

const issueCreateSchema = baseSchema
  .extend({
    kind: z.literal("issue-create"),
    issue_id: operationalIssueIdSchema,
    content_file: contentFileSchema,
  })
  .strict();

const issueUpdateSchema = baseSchema
  .extend({
    kind: z.literal("issue-update"),
    issue_id: operationalIssueIdSchema,
    expected_source_sha256: z.string().regex(SHA256),
    content_file: contentFileSchema,
  })
  .strict();

const acceptedUpdateSchema = baseSchema
  .extend({
    kind: z.literal("accepted-update"),
    change_id: z
      .string()
      .refine(isAcceptedUpdateId, "must identify a registered Accepted Update ID"),
    owner_capability: z.string().trim().min(1),
    content_file: contentFileSchema,
  })
  .strict();

const legacyImportSchema = baseSchema
  .extend({
    kind: z.literal("legacy-import"),
    receipt_content_file: contentFileSchema,
    records: z
      .array(
        z
          .object({
            change_id: z
              .string()
              .refine(
                isLegacyChangeId,
                "must identify a legacy Changelog root ID",
              ),
            content_file: contentFileSchema,
          })
          .strict(),
      )
      .min(1)
      .max(MAX_REQUEST_RECORDS),
  })
  .strict();

const migrationSourceCountsSchema = z
  .object({
    ownerDb: z.number().int().nonnegative(),
    localStorage: z.number().int().nonnegative(),
    repositorySeed: z.number().int().nonnegative(),
  })
  .strict();

const migrationSourceHashesSchema = z
  .object({
    ownerDb: z.string().regex(SHA256),
    localStorage: z.string().regex(SHA256),
    repositorySeed: z.string().regex(SHA256),
  })
  .strict();

const migrationReceiptEntrySchema = z
  .object({
    legacy_source_id: z.string().trim().min(1),
    canonical_change_id: z
      .string()
      .refine(isLegacyChangeId, "must identify a legacy Changelog root ID"),
    owner_db_hash: z.string().regex(SHA256),
    local_storage_hash: z.string().regex(SHA256),
    repository_seed_hash: z.string().regex(SHA256),
    selected_hash: z.string().regex(SHA256),
    preserved_record_hash: z.string().regex(SHA256),
    generated_markdown_sha256: z.string().regex(SHA256),
    source_lineage: z.array(z.enum(LEGACY_SOURCE_LINEAGE)).min(1),
    source_difference: z.enum([
      "exact",
      "normalized-empty-optional-field",
      "reviewed-reference-difference",
      "reviewed-substantive-collision",
    ]),
    conflict_resolution: z.string().trim().min(1),
    source_resolution_rationale: z.string().trim().min(1),
    differing_fields: z.array(z.string().trim().min(1)),
    semantic_duplicate_ids: z.array(z.string().trim().min(1)),
    privacy_redactions: z.array(
      z
        .object({
          field: z.string().trim().min(1),
          transformation: z.literal("home-directory-prefix-to-$HOME"),
        })
        .strict(),
    ),
    gallery_classification: z.enum([
      "applicable",
      "not_applicable",
      "pending_excluded",
    ]),
    affected_capabilities: z.array(z.string().trim().min(1)),
    rationale: z.string().trim().min(1),
    reviewer: z.string().trim().min(1),
    import_status: z.literal("imported"),
  })
  .strict();

const migrationReceiptSchema = z
  .object({
    record_type: z.literal("changelog_migration_receipt"),
    receipt_version: z.literal(1),
    migration_id: z.string().trim().min(1),
    source_package_type: z.literal(
      "chronicle-quality-hub-changelog-migration",
    ),
    source_package_version: z.literal(1),
    source_package_sha256: z.string().regex(SHA256),
    source_revision: z.string().trim().min(1),
    source_fingerprint: z.string().trim().min(1),
    source_authority: z.string().trim().min(1),
    source_authority_ref: z.string().trim().min(1),
    source_authority_approved_on: dateSchema,
    imported_on: dateSchema,
    provenance_limit: z.literal(
      "post_incident_union_original_170_membership_unknown",
    ),
    source_counts: migrationSourceCountsSchema,
    source_changelog_hashes: migrationSourceHashesSchema,
    selected_legacy_ids_sha256: z.string().regex(SHA256),
    global_legacy_count: z.number().int().positive().max(MAX_REQUEST_RECORDS),
    community_gallery_count: z.number().int().nonnegative(),
    non_gallery_count: z.number().int().nonnegative(),
    pending_gallery_count: z.number().int().nonnegative(),
    identical_across_sources_count: z.number().int().nonnegative(),
    normalized_optional_difference_count: z.number().int().nonnegative(),
    reviewed_reference_difference_count: z.number().int().nonnegative(),
    reviewed_substantive_collision_count: z.number().int().nonnegative(),
    import_status: z.literal("imported"),
    entries: z
      .array(migrationReceiptEntrySchema)
      .min(1)
      .max(MAX_REQUEST_RECORDS),
    source_record: z.literal(CHANGELOG_MIGRATION_RECEIPT_SOURCE_PATH),
  })
  .strict();

type MigrationReceipt = z.infer<typeof migrationReceiptSchema>;

const correctionSchema = baseSchema
  .extend({
    kind: z.literal("correction"),
    target_change_id: z
      .string()
      .refine(
        (value) => isAcceptedChangeId(value) || isLegacyChangeId(value),
        "must identify an accepted or legacy root Changelog record",
      ),
    correction_sequence: z.number().int().min(1).max(999),
    content_file: contentFileSchema,
  })
  .strict();

const closeoutSchema = baseSchema
  .extend({
    kind: z.literal("closeout"),
    project_id: z.string().regex(GALLERY_PROJECT_ID),
    change_id: z.string().regex(ACCEPTED_CHANGE_ID),
    expected_project_sha256: z.string().regex(SHA256),
    archive_content_file: contentFileSchema,
    changelog_content_file: contentFileSchema,
    issue_updates: z
      .array(
        z
          .object({
            issue_id: z.string().regex(GALLERY_ISSUE_ID),
            expected_source_sha256: z.string().regex(SHA256),
            content_file: contentFileSchema,
          })
          .strict(),
      )
      .max(100)
      .default([]),
  })
  .strict();

const requestSchema = z.discriminatedUnion("kind", [
  projectCreateSchema,
  projectUpdateSchema,
  issueCreateSchema,
  issueUpdateSchema,
  acceptedUpdateSchema,
  legacyImportSchema,
  correctionSchema,
  closeoutSchema,
]);

type ParsedRequest = z.infer<typeof requestSchema>;

function isRealIsoDate(value: string) {
  if (!ISO_DATE.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function formatZodError(error: z.ZodError) {
  return error.issues
    .map((issue) => {
      const location = issue.path.length > 0 ? issue.path.join(".") : "request";
      return `${location}: ${issue.message}`;
    })
    .join("; ");
}

function parseFrontmatterMetadata(bytes: Buffer, relativePath: string) {
  let source: string;
  try {
    source = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error(`Request content is not valid UTF-8: ${relativePath}.`);
  }
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) {
    throw new Error(`Request content is missing valid YAML frontmatter: ${relativePath}.`);
  }
  let data: unknown;
  try {
    data = parseYaml(match[1]);
  } catch {
    throw new Error(`Request content has invalid YAML frontmatter: ${relativePath}.`);
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error(`Request content frontmatter must be an object: ${relativePath}.`);
  }
  return data as Record<string, unknown>;
}

function requireMetadataValue(
  metadata: Record<string, unknown>,
  key: string,
  expected: string | number,
  relativePath: string,
) {
  if (metadata[key] !== expected) {
    throw new Error(`Request content ${relativePath} has a mismatched ${key}.`);
  }
}

function parseMigrationReceipt(
  bytes: Buffer,
  relativePath: string,
): MigrationReceipt {
  const metadata = parseFrontmatterMetadata(bytes, relativePath);
  const result = migrationReceiptSchema.safeParse(metadata);
  if (!result.success) {
    throw new Error(
      `Migration receipt ${relativePath} is invalid: ${formatZodError(result.error)}.`,
    );
  }
  return result.data;
}

function stringArray(value: unknown, label: string) {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
    throw new Error(`${label} must be a string array.`);
  }
  return value as string[];
}

function sameOrderedStrings(left: readonly string[], right: readonly string[]) {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function selectedLegacyIdsSha256(legacySourceIds: readonly string[]) {
  return createHash("sha256")
    .update(JSON.stringify([...legacySourceIds].sort((left, right) =>
      left.localeCompare(right),
    )))
    .digest("hex");
}

export type LegacyImportBundleRecord = Readonly<{
  changeId: string;
  bytes: Buffer;
  relativePath: string;
}>;

export function validateLegacyImportReceiptBundle(
  receiptBytes: Buffer,
  receiptRelativePath: string,
  records: readonly LegacyImportBundleRecord[],
  asOf: string,
) {
  const receipt = parseMigrationReceipt(receiptBytes, receiptRelativePath);
  if (receipt.imported_on !== asOf) {
    throw new Error("Migration receipt imported_on must match the request as_of date.");
  }

  const requestedIds = records
    .map((record) => record.changeId)
    .sort((left, right) => left.localeCompare(right));
  if (new Set(requestedIds).size !== requestedIds.length) {
    throw new Error("Legacy import bundle contains duplicate Changelog identities.");
  }
  const receiptIds = receipt.entries
    .map((entry) => entry.canonical_change_id)
    .sort((left, right) => left.localeCompare(right));
  if (!sameOrderedStrings(requestedIds, receiptIds)) {
    throw new Error(
      "Migration receipt identities do not exactly match the legacy import request.",
    );
  }
  if (
    receipt.global_legacy_count !== records.length ||
    receipt.entries.length !== records.length
  ) {
    throw new Error(
      "Migration receipt global count does not match the legacy import request.",
    );
  }
  if (
    receipt.source_counts.ownerDb !== records.length ||
    receipt.source_counts.localStorage !== records.length ||
    receipt.source_counts.repositorySeed !== records.length
  ) {
    throw new Error(
      "Migration receipt source counts do not match the imported legacy identity count.",
    );
  }

  const receiptLegacyIds = receipt.entries
    .map((entry) => entry.legacy_source_id)
    .sort((left, right) => left.localeCompare(right));
  if (new Set(receiptLegacyIds).size !== receiptLegacyIds.length) {
    throw new Error("Migration receipt contains duplicate legacy source identities.");
  }
  if (
    receipt.selected_legacy_ids_sha256 !==
    selectedLegacyIdsSha256(receiptLegacyIds)
  ) {
    throw new Error(
      "Migration receipt selected legacy identity hash does not match its ledger.",
    );
  }

  const galleryCount = receipt.entries.filter(
    (entry) => entry.gallery_classification === "applicable",
  ).length;
  const pendingCount = receipt.entries.filter(
    (entry) => entry.gallery_classification === "pending_excluded",
  ).length;
  const normalizedDifferenceCount = receipt.entries.filter(
    (entry) => entry.source_difference === "normalized-empty-optional-field",
  ).length;
  const referenceDifferenceCount = receipt.entries.filter(
    (entry) => entry.source_difference === "reviewed-reference-difference",
  ).length;
  const substantiveCollisionCount = receipt.entries.filter(
    (entry) => entry.source_difference === "reviewed-substantive-collision",
  ).length;
  if (
    receipt.community_gallery_count !== galleryCount ||
    receipt.non_gallery_count !==
      receipt.entries.length - galleryCount - pendingCount ||
    receipt.pending_gallery_count !== pendingCount ||
    receipt.identical_across_sources_count !==
      receipt.entries.length -
        normalizedDifferenceCount -
        referenceDifferenceCount -
        substantiveCollisionCount ||
    receipt.normalized_optional_difference_count !== normalizedDifferenceCount ||
    receipt.reviewed_reference_difference_count !== referenceDifferenceCount ||
    receipt.reviewed_substantive_collision_count !== substantiveCollisionCount
  ) {
    throw new Error(
      "Migration receipt summary counts do not match its per-record ledger.",
    );
  }

  const receiptById = new Map(
    receipt.entries.map((entry) => [entry.canonical_change_id, entry]),
  );
  for (const entry of receipt.entries) {
    if (`LEGACY-QH-${entry.legacy_source_id}` !== entry.canonical_change_id) {
      throw new Error(
        `Migration receipt legacy identity does not match ${entry.canonical_change_id}.`,
      );
    }
    if (new Set(entry.source_lineage).size !== entry.source_lineage.length) {
      throw new Error(
        `Migration receipt source lineage contains duplicates for ${entry.canonical_change_id}.`,
      );
    }
    const sourceHashes = {
      "owner-db": entry.owner_db_hash,
      "local-storage": entry.local_storage_hash,
      "repository-seed": entry.repository_seed_hash,
    } as const;
    const matchingSources = LEGACY_SOURCE_LINEAGE.filter(
      (source) => sourceHashes[source] === entry.selected_hash,
    );
    if (!sameOrderedStrings(entry.source_lineage, matchingSources)) {
      throw new Error(
        `Migration receipt source lineage does not match the selected payload for ${entry.canonical_change_id}.`,
      );
    }
    const isExact = new Set(Object.values(sourceHashes)).size === 1;
    if ((entry.source_difference === "exact") !== isExact) {
      throw new Error(
        `Migration receipt source difference does not match source hashes for ${entry.canonical_change_id}.`,
      );
    }
  }

  for (const record of records) {
    const ledgerEntry = receiptById.get(record.changeId);
    if (!ledgerEntry) {
      throw new Error(`Migration receipt does not account for ${record.changeId}.`);
    }
    const metadata = parseFrontmatterMetadata(record.bytes, record.relativePath);
    const generatedMarkdownSha256 = createHash("sha256")
      .update(record.bytes)
      .digest("hex");
    if (ledgerEntry.generated_markdown_sha256 !== generatedMarkdownSha256) {
      throw new Error(
        `Migration receipt generated Markdown hash does not match ${record.changeId}.`,
      );
    }
    requireMetadataValue(
      metadata,
      "migration_receipt",
      CHANGELOG_MIGRATION_RECEIPT_SOURCE_PATH,
      record.relativePath,
    );
    requireMetadataValue(
      metadata,
      "migration_snapshot_hash",
      receipt.source_package_sha256,
      record.relativePath,
    );
    requireMetadataValue(
      metadata,
      "legacy_source_id",
      ledgerEntry.legacy_source_id,
      record.relativePath,
    );
    requireMetadataValue(
      metadata,
      "source_hash",
      ledgerEntry.selected_hash,
      record.relativePath,
    );
    const expectedPreservedHash =
      typeof metadata.preserved_record_hash === "string"
        ? metadata.preserved_record_hash
        : ledgerEntry.selected_hash;
    if (ledgerEntry.preserved_record_hash !== expectedPreservedHash) {
      throw new Error(
        `Migration receipt preserved-record hash does not match ${record.changeId}.`,
      );
    }
    requireMetadataValue(
      metadata,
      "imported_on",
      receipt.imported_on,
      record.relativePath,
    );
    requireMetadataValue(
      metadata,
      "applicability_evidence",
      ledgerEntry.rationale,
      record.relativePath,
    );
    const recordLineage = stringArray(
      metadata.source_lineage,
      `${record.relativePath} source_lineage`,
    );
    if (!sameOrderedStrings(recordLineage, ledgerEntry.source_lineage)) {
      throw new Error(
        `Migration receipt lineage does not match ${record.changeId}.`,
      );
    }
    const affectedCapabilities = stringArray(
      metadata.affected_capabilities,
      `${record.relativePath} affected_capabilities`,
    );
    if (
      !sameOrderedStrings(
        affectedCapabilities,
        ledgerEntry.affected_capabilities,
      )
    ) {
      throw new Error(
        `Migration receipt capability mapping does not match ${record.changeId}.`,
      );
    }
    const expectedGalleryApplicability =
      ledgerEntry.gallery_classification === "applicable"
        ? "applicable"
        : ledgerEntry.gallery_classification;
    requireMetadataValue(
      metadata,
      "gallery_applicability",
      expectedGalleryApplicability,
      record.relativePath,
    );
  }
  return receipt;
}

function requireContentFileName(contentFile: string, recordId: string) {
  const normalized = normalizeStrictRelativePath(contentFile);
  const expected = `content/${recordId}.md`;
  if (normalized !== expected) {
    throw new Error(`Content filename must match record ID ${recordId}.`);
  }
  return normalized;
}

function requestedContentFiles(request: ParsedRequest) {
  if (
    request.kind === "project-create" ||
    request.kind === "project-update" ||
    request.kind === "issue-create" ||
    request.kind === "issue-update" ||
    request.kind === "accepted-update" ||
    request.kind === "correction"
  ) {
    return [request.content_file];
  }
  if (request.kind === "legacy-import") {
    return [
      request.receipt_content_file,
      ...request.records.map((record) => record.content_file),
    ];
  }
  return [
    request.archive_content_file,
    request.changelog_content_file,
    ...request.issue_updates.map((update) => update.content_file),
  ];
}

async function assertExactContentMembership(
  packageRoot: string,
  expectedRelativePaths: readonly string[],
) {
  const contentDirectory = resolveContainedPath(packageRoot, "content");
  await assertNoSymlinkComponents(packageRoot, "content");
  await assertRealDirectory(contentDirectory, "Request content directory");
  const expectedNames = expectedRelativePaths
    .map((relativePath) => path.posix.basename(relativePath))
    .sort((left, right) => left.localeCompare(right));
  const actualNames = (await readdir(contentDirectory)).sort((left, right) =>
    left.localeCompare(right),
  );
  if (new Set(expectedNames).size !== expectedNames.length) {
    throw new Error("Request refers to the same content file more than once.");
  }
  if (
    expectedNames.length !== actualNames.length ||
    expectedNames.some((name, index) => name !== actualNames[index])
  ) {
    throw new Error("Request content directory has missing or extra files.");
  }
}

async function loadRequestContent(
  packageRoot: string,
  requestRelativePath: string,
): Promise<LoadedRequestContent> {
  const normalized = normalizeStrictRelativePath(requestRelativePath);
  if (!CONTENT_FILE.test(normalized)) {
    throw new Error("Request content must be a direct Markdown file under content/.");
  }
  const absolutePath = resolveContainedPath(packageRoot, normalized);
  await assertNoSymlinkComponents(packageRoot, normalized);
  const stat = await lstat(absolutePath);
  if (stat.isSymbolicLink() || !stat.isFile()) {
    throw new Error(`Request content must be a regular file: ${normalized}.`);
  }
  if (stat.size > MAX_CONTENT_FILE_BYTES) {
    throw new Error(`Request content exceeds the per-file size limit: ${normalized}.`);
  }
  const bytes = Buffer.from(await readFile(absolutePath));
  const verificationBytes = Buffer.from(await readFile(absolutePath));
  const verificationStat = await lstat(absolutePath);
  if (
    bytes.length !== stat.size ||
    verificationStat.isSymbolicLink() ||
    !verificationStat.isFile() ||
    verificationStat.dev !== stat.dev ||
    verificationStat.ino !== stat.ino ||
    verificationStat.mode !== stat.mode ||
    verificationStat.size !== stat.size ||
    verificationStat.mtimeMs !== stat.mtimeMs ||
    !verificationBytes.equals(bytes)
  ) {
    throw new Error(`Request content changed while it was being read: ${normalized}.`);
  }
  return Object.freeze({
    requestRelativePath: normalized,
    absolutePath,
    bytes,
    sha256: sha256Buffer(bytes),
    mode: stat.mode & 0o7777,
  });
}

async function assertLoadedRequestContentUnchanged(
  content: LoadedRequestContent,
) {
  const stat = await lstat(content.absolutePath);
  if (stat.isSymbolicLink() || !stat.isFile()) {
    throw new Error(
      `Request content changed after validation: ${content.requestRelativePath}.`,
    );
  }
  const bytes = await readFile(content.absolutePath);
  if (
    (stat.mode & 0o7777) !== content.mode ||
    bytes.length !== content.bytes.length ||
    !bytes.equals(content.bytes) ||
    sha256Buffer(bytes) !== content.sha256
  ) {
    throw new Error(
      `Request content changed after validation: ${content.requestRelativePath}.`,
    );
  }
}

function createOperation(
  order: number,
  location: CanonicalRecordLocation,
  recordId: string,
  content: LoadedRequestContent,
): CreateOperation {
  return Object.freeze({
    order,
    action: "create" as const,
    location,
    recordId,
    targetSourcePath: canonicalRecordSourcePath(location, recordId),
    expectedState: "absent" as const,
    content,
  });
}

function updateOperation(
  order: number,
  location: "active-current-work" | "issue",
  recordId: string,
  expectedSourceSha256: string,
  content: LoadedRequestContent,
): UpdateOperation {
  return Object.freeze({
    order,
    action: "update" as const,
    location,
    recordId,
    targetSourcePath: canonicalRecordSourcePath(location, recordId),
    expectedState: "present" as const,
    expectedSourceSha256,
    content,
  });
}

function removeOperation(
  order: number,
  recordId: string,
  expectedSourceSha256: string,
): RemoveOperation {
  return Object.freeze({
    order,
    action: "remove" as const,
    location: "active-current-work" as const,
    recordId,
    targetSourcePath: canonicalRecordSourcePath("active-current-work", recordId),
    expectedState: "present" as const,
    expectedSourceSha256,
  });
}

function validateOperationTargets(operations: readonly NormalizedRecordOperation[]) {
  const targetPaths = operations.map((operation) => operation.targetSourcePath);
  const duplicateTargets = targetPaths.filter(
    (target, index) => targetPaths.indexOf(target) !== index,
  );
  if (duplicateTargets.length > 0) {
    throw new Error(`Request contains duplicate canonical targets: ${[...new Set(duplicateTargets)].join(", ")}.`);
  }
}

async function normalizeOperations(
  request: ParsedRequest,
  packageRoot: string,
): Promise<readonly NormalizedRecordOperation[]> {
  if (request.kind === "project-create" || request.kind === "project-update") {
    const projectId = parseCanonicalRecordId(
      "active-current-work",
      request.project_id,
    );
    const contentPath = requireContentFileName(request.content_file, projectId);
    const content = await loadRequestContent(packageRoot, contentPath);
    const metadata = parseFrontmatterMetadata(content.bytes, contentPath);
    requireMetadataValue(metadata, "record_type", "current_work", contentPath);
    requireMetadataValue(metadata, "project_id", projectId, contentPath);
    requireMetadataValue(
      metadata,
      "source_record",
      canonicalRecordSourcePath("active-current-work", projectId),
      contentPath,
    );
    return Object.freeze([
      request.kind === "project-create"
        ? createOperation(0, "active-current-work", projectId, content)
        : updateOperation(
            0,
            "active-current-work",
            projectId,
            request.expected_source_sha256,
            content,
          ),
    ]);
  }

  if (request.kind === "issue-create" || request.kind === "issue-update") {
    const issueId = parseCanonicalRecordId("issue", request.issue_id);
    const contentPath = requireContentFileName(request.content_file, issueId);
    const content = await loadRequestContent(packageRoot, contentPath);
    const metadata = parseFrontmatterMetadata(content.bytes, contentPath);
    requireMetadataValue(metadata, "record_type", "issue", contentPath);
    requireMetadataValue(metadata, "issue_id", issueId, contentPath);
    requireMetadataValue(
      metadata,
      "source_record",
      canonicalRecordSourcePath("issue", issueId),
      contentPath,
    );
    return Object.freeze([
      request.kind === "issue-create"
        ? createOperation(0, "issue", issueId, content)
        : updateOperation(
            0,
            "issue",
            issueId,
            request.expected_source_sha256,
            content,
          ),
    ]);
  }

  if (request.kind === "accepted-update") {
    const changeId = parseCanonicalRecordId("changelog", request.change_id);
    assertAcceptedUpdateOwner(changeId, request.owner_capability);
    const contentPath = requireContentFileName(request.content_file, changeId);
    const content = await loadRequestContent(packageRoot, contentPath);
    const metadata = parseFrontmatterMetadata(content.bytes, contentPath);
    requireMetadataValue(metadata, "record_type", "changelog", contentPath);
    requireMetadataValue(metadata, "variant", "accepted_update", contentPath);
    requireMetadataValue(metadata, "provenance", "accepted-update", contentPath);
    requireMetadataValue(metadata, "change_id", changeId, contentPath);
    requireMetadataValue(
      metadata,
      "owning_capability",
      request.owner_capability,
      contentPath,
    );
    requireMetadataValue(
      metadata,
      "source_record",
      canonicalRecordSourcePath("changelog", changeId),
      contentPath,
    );
    return Object.freeze([createOperation(0, "changelog", changeId, content)]);
  }

  if (request.kind === "legacy-import") {
    const receiptContentPath = requireContentFileName(
      request.receipt_content_file,
      CHANGELOG_MIGRATION_RECEIPT_RECORD_ID,
    );
    const receiptContent = await loadRequestContent(
      packageRoot,
      receiptContentPath,
    );
    const recordContents: Array<{
      changeId: string;
      content: LoadedRequestContent;
    }> = [];
    for (const [index, record] of request.records.entries()) {
      if (!isLegacyChangeId(record.change_id)) {
        throw new Error(`Legacy import record ${index + 1} has an invalid change ID.`);
      }
      const changeId = parseCanonicalRecordId("changelog", record.change_id);
      const contentPath = requireContentFileName(record.content_file, changeId);
      const content = await loadRequestContent(packageRoot, contentPath);
      const metadata = parseFrontmatterMetadata(content.bytes, contentPath);
      requireMetadataValue(metadata, "record_type", "changelog", contentPath);
      requireMetadataValue(metadata, "variant", "legacy_import", contentPath);
      requireMetadataValue(metadata, "change_id", changeId, contentPath);
      requireMetadataValue(
        metadata,
        "source_record",
        canonicalRecordSourcePath("changelog", changeId),
        contentPath,
      );
      recordContents.push({ changeId, content });
    }
    validateLegacyImportReceiptBundle(
      receiptContent.bytes,
      receiptContentPath,
      recordContents.map(({ changeId, content }) => ({
        changeId,
        bytes: content.bytes,
        relativePath: content.requestRelativePath,
      })),
      request.as_of,
    );
    const operations: CreateOperation[] = [
      ...recordContents.map(({ changeId, content }, index) =>
        createOperation(index, "changelog", changeId, content),
      ),
      createOperation(
        recordContents.length,
        CHANGELOG_MIGRATION_RECEIPT_LOCATION,
        CHANGELOG_MIGRATION_RECEIPT_RECORD_ID,
        receiptContent,
      ),
    ];
    validateOperationTargets(operations);
    return Object.freeze(operations);
  }

  if (request.kind === "correction") {
    const changeId = deriveCorrectionChangeId(
      request.target_change_id,
      request.correction_sequence,
    );
    const contentPath = requireContentFileName(request.content_file, changeId);
    const content = await loadRequestContent(packageRoot, contentPath);
    const metadata = parseFrontmatterMetadata(content.bytes, contentPath);
    requireMetadataValue(metadata, "record_type", "changelog", contentPath);
    requireMetadataValue(metadata, "variant", "correction", contentPath);
    requireMetadataValue(metadata, "change_id", changeId, contentPath);
    requireMetadataValue(
      metadata,
      "target_change_id",
      request.target_change_id,
      contentPath,
    );
    requireMetadataValue(
      metadata,
      "correction_sequence",
      request.correction_sequence,
      contentPath,
    );
    requireMetadataValue(
      metadata,
      "source_record",
      canonicalRecordSourcePath("changelog", changeId),
      contentPath,
    );
    return Object.freeze([createOperation(0, "changelog", changeId, content)]);
  }

  const projectId = parseCanonicalRecordId(
    "archived-current-work",
    request.project_id,
  );
  if (!isAcceptedChangeId(request.change_id)) {
    throw new Error("Closeout change_id must be a Community Gallery accepted-change ID.");
  }
  const changeId = parseCanonicalRecordId("changelog", request.change_id);
  const archiveContentPath = requireContentFileName(
    request.archive_content_file,
    projectId,
  );
  const changelogContentPath = requireContentFileName(
    request.changelog_content_file,
    changeId,
  );
  const archiveContent = await loadRequestContent(packageRoot, archiveContentPath);
  const changelogContent = await loadRequestContent(
    packageRoot,
    changelogContentPath,
  );
  const archiveMetadata = parseFrontmatterMetadata(
    archiveContent.bytes,
    archiveContentPath,
  );
  requireMetadataValue(
    archiveMetadata,
    "record_type",
    "current_work",
    archiveContentPath,
  );
  requireMetadataValue(archiveMetadata, "project_id", projectId, archiveContentPath);
  requireMetadataValue(
    archiveMetadata,
    "source_record",
    canonicalRecordSourcePath("archived-current-work", projectId),
    archiveContentPath,
  );
  const changelogMetadata = parseFrontmatterMetadata(
    changelogContent.bytes,
    changelogContentPath,
  );
  requireMetadataValue(
    changelogMetadata,
    "record_type",
    "changelog",
    changelogContentPath,
  );
  requireMetadataValue(
    changelogMetadata,
    "variant",
    "accepted_closeout",
    changelogContentPath,
  );
  requireMetadataValue(changelogMetadata, "change_id", changeId, changelogContentPath);
  requireMetadataValue(
    changelogMetadata,
    "archived_project_id",
    projectId,
    changelogContentPath,
  );
  requireMetadataValue(
    changelogMetadata,
    "archive_record",
    canonicalRecordSourcePath("archived-current-work", projectId),
    changelogContentPath,
  );
  requireMetadataValue(
    changelogMetadata,
    "source_record",
    canonicalRecordSourcePath("changelog", changeId),
    changelogContentPath,
  );

  const issueUpdates = await Promise.all(
    request.issue_updates.map(async (update, index) => {
      const issueId = parseCanonicalRecordId("issue", update.issue_id);
      const contentPath = requireContentFileName(update.content_file, issueId);
      const content = await loadRequestContent(packageRoot, contentPath);
      const metadata = parseFrontmatterMetadata(content.bytes, contentPath);
      requireMetadataValue(metadata, "record_type", "issue", contentPath);
      requireMetadataValue(metadata, "issue_id", issueId, contentPath);
      requireMetadataValue(
        metadata,
        "source_record",
        canonicalRecordSourcePath("issue", issueId),
        contentPath,
      );
      return updateOperation(
        index,
        "issue",
        issueId,
        update.expected_source_sha256,
        content,
      );
    }),
  );
  const closeoutStart = issueUpdates.length;
  const operations = Object.freeze([
    ...issueUpdates,
    createOperation(
      closeoutStart,
      "archived-current-work",
      projectId,
      archiveContent,
    ),
    createOperation(closeoutStart + 1, "changelog", changeId, changelogContent),
    removeOperation(
      closeoutStart + 2,
      projectId,
      request.expected_project_sha256,
    ),
  ]);
  validateOperationTargets(operations);
  return operations;
}

export async function parseKnowledgeRecordRequest(
  requestPath: string,
): Promise<NormalizedKnowledgeRecordRequest> {
  const absoluteRequestPath = path.resolve(requestPath);
  const packageRoot = await assertRealDirectory(
    path.dirname(absoluteRequestPath),
    "Request package directory",
  );
  const requestName = path.basename(absoluteRequestPath);
  if (!requestName.endsWith(".json")) {
    throw new Error("Knowledge record request must be a JSON file.");
  }
  const requestStat = await lstat(absoluteRequestPath);
  if (requestStat.isSymbolicLink() || !requestStat.isFile()) {
    throw new Error("Knowledge record request must be a regular file, not a symbolic link.");
  }
  if ((await realpath(absoluteRequestPath)) !== absoluteRequestPath) {
    throw new Error("Knowledge record request must not use a filesystem alias.");
  }
  if (requestStat.size > MAX_REQUEST_BYTES) {
    throw new Error("Knowledge record request exceeds the request-size limit.");
  }
  const requestBytes = await readFile(absoluteRequestPath);
  const verificationRequestBytes = await readFile(absoluteRequestPath);
  const verificationRequestStat = await lstat(absoluteRequestPath);
  if (
    requestBytes.length !== requestStat.size ||
    verificationRequestStat.isSymbolicLink() ||
    !verificationRequestStat.isFile() ||
    verificationRequestStat.dev !== requestStat.dev ||
    verificationRequestStat.ino !== requestStat.ino ||
    verificationRequestStat.mode !== requestStat.mode ||
    verificationRequestStat.size !== requestStat.size ||
    verificationRequestStat.mtimeMs !== requestStat.mtimeMs ||
    !verificationRequestBytes.equals(requestBytes)
  ) {
    throw new Error("Knowledge record request changed while it was being read.");
  }

  let rawRequest: unknown;
  try {
    rawRequest = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(requestBytes));
  } catch {
    throw new Error("Knowledge record request is not valid UTF-8 JSON.");
  }
  const parsedResult = requestSchema.safeParse(rawRequest);
  if (!parsedResult.success) {
    throw new Error(`Invalid knowledge record request: ${formatZodError(parsedResult.error)}.`);
  }
  const request = parsedResult.data;
  const expectedFiles = requestedContentFiles(request).map(normalizeStrictRelativePath);
  await assertExactContentMembership(packageRoot, expectedFiles);
  const operations = await normalizeOperations(request, packageRoot);
  await assertExactContentMembership(packageRoot, expectedFiles);
  for (const operation of operations) {
    if ("content" in operation) {
      await assertLoadedRequestContentUnchanged(operation.content);
    }
  }
  validateOperationTargets(operations);
  const totalContentBytes = operations.reduce(
    (total, operation) =>
      total + ("content" in operation ? operation.content.bytes.length : 0),
    0,
  );
  if (totalContentBytes > MAX_TOTAL_CONTENT_BYTES) {
    throw new Error("Knowledge record request exceeds the total content-size limit.");
  }
  const finalRequestBytes = await readFile(absoluteRequestPath);
  if (!finalRequestBytes.equals(requestBytes)) {
    throw new Error("Knowledge record request changed after validation.");
  }

  return Object.freeze({
    version: KNOWLEDGE_RECORD_REQUEST_VERSION,
    kind: request.kind,
    asOf: request.as_of,
    requestPath: absoluteRequestPath,
    requestSha256: sha256Buffer(requestBytes),
    requestByteSize: requestBytes.length,
    packageRoot,
    operations,
  });
}
