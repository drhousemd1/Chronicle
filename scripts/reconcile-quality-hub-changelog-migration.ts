#!/usr/bin/env node

import { createHash, randomUUID } from "node:crypto";
import { constants as fsConstants } from "node:fs";
import {
  lstat,
  mkdir,
  open,
  readFile,
  readdir,
  realpath,
} from "node:fs/promises";
import path from "node:path";

import { stringify as stringifyYaml } from "yaml";

import {
  buildChangelogRecordRegistry,
  computeLegacyPayloadHash,
  LEGACY_PROVENANCE_LIMIT,
  selectChangelogEntriesFromRegistry,
  type LegacyPrivacyRedaction,
  type LegacyQualityHubPayload,
} from "../src/data/chronicle-knowledge-base/changelog-record-contract";
import type { ChronicleCapabilityId } from "../src/data/chronicle-knowledge-base/capability-ids";
import { qualityHubInitialRegistry } from "../src/data/ui-audit-findings";
import {
  canonicalJsonStringify,
  CHANGELOG_MIGRATION_PACKAGE_TYPE,
  CHANGELOG_MIGRATION_PACKAGE_VERSION,
  projectQualityHubChangeLog,
  type ChangelogMigrationEnvelopeV1,
} from "../src/lib/quality-hub-changelog-migration";

const RECEIPT_SOURCE_PATH =
  "docs/architecture-knowledge/changelog/migration-receipt.md";
const CHANGELOG_DIRECTORY = "docs/architecture-knowledge/changelog/entries";
const REQUIRED_DIRECTORY_MODE = 0o700;
const REQUIRED_FILE_MODE = 0o600;
const MAX_SOURCE_BYTES = 134_217_728;
const REVIEWER =
  "User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04";
const SOURCE_AUTHORITY =
  "authenticated-owner-and-matching-local-storage-post-incident-union";
const SOURCE_AUTHORITY_REF = "CG-LOG-022";

type ImportStatus = "prepared" | "imported";
type GalleryClassification =
  | "applicable"
  | "not_applicable"
  | "pending_excluded";

type SourceDifference =
  | "exact"
  | "normalized-empty-optional-field"
  | "reviewed-reference-difference"
  | "reviewed-substantive-collision";

type GalleryApplicabilityRule = Readonly<{
  classification: GalleryClassification;
  rationale: string;
}>;

export type ReconciliationPolicy = Readonly<{
  expectedEntryCount: number;
  applicable: Readonly<Record<string, string>>;
  pendingExcluded: Readonly<Record<string, string>>;
}>;

const GALLERY_APPLICABLE_RATIONALES = Object.freeze({
  "cl-20260620-001":
    "The record changes Gallery publish and unpublish cover handling through src/services/gallery-data.ts and the public cover used by Gallery cards.",
  "cl-20260619-003":
    "The record changes published-scenario access and the Gallery data service used by saved and published story surfaces.",
  "cl-20260619-002":
    "The record changes public scenario-review reads and the Story Detail review surface opened from Community Gallery.",
  "cl-20260619-001":
    "The record changes Gallery likes, view and play guards, published-story visibility, and shared Gallery request paths.",
  "cl-20260614-005":
    "The record changes the Gallery RPC and published-work privacy rules that determine which creator stories Community Gallery may expose.",
  "cl-20260614-004":
    "The record changes Community Gallery like, save, and play counters and their backing ledger and trigger behavior.",
  "cl-20260614-003":
    "The record changes ownership enforcement for published_scenarios, the durable publication rows consumed by Community Gallery.",
  "cl-20260613-003":
    "The record changes ReviewModal failure logging for the review workflow launched from Community Gallery story details.",
  "cl-20260417-008":
    "The record directly changes Community Gallery adult-content gating for the toggle and masked story cards.",
  "cl-20260417-007":
    "The record moves Gallery Play and editable-copy handoffs into use-index-scenario-lifecycle.ts, the runtime owner that receives Community Gallery story selections.",
  "cl-20260417-005":
    "The record moves authentication-dialog state used when signed-out Gallery visitors attempt protected Like, Save, and Review actions.",
  "cl-20260417-003":
    "The record moves guest-workspace protection into use-index-shell-bootstrap.ts, including the branch that returns signed-out users from protected Chronicle workspaces to Community Gallery.",
  "cl-20260417-002":
    "The record moves the Community Gallery feed selector and adult-content control into AppShellTopBar.tsx.",
  "cl-20260417-001":
    "The selected owner record is a direct Community Gallery adult-content gating change; the same-ID seed collision is separately disclosed in the migration receipt.",
  "cl-20260411-002":
    "The record directly adds Community Gallery adult-content preference, confirmation, masking, and service behavior.",
  "cl-20260410-001":
    "The record directly changes the Community Gallery discovery shell, category rail, search, and filters.",
  "cl-20260405-002":
    "The record changes the review modal and Story Detail review flow shared by Community Gallery and My Stories.",
  "cl-20260405-001":
    "The record changes the Story Detail modal and review call to action used by Community Gallery and My Stories.",
  "cl-20260404-004":
    "The record changes Gallery container refs and pre-auth request behavior on the delivered Gallery shell.",
  "cl-20260330-001":
    "The record changes GalleryStoryCard ref behavior as part of a cross-surface runtime-stability pass.",
  "cl-20260327-006":
    "The record changes the initial and incremental loading presentation used by Community Gallery.",
  "cl-20260327-001":
    "The record repairs ShareStoryModal startup, which owns the Publish, Allow Edits, and Unpublish commands that create or remove Community Gallery publications.",
} satisfies Record<string, string>);

const GALLERY_PENDING_RATIONALES = Object.freeze({
  "cl-20260331-005":
    "The record mentions Community Gallery guide maintenance inside a broader tooling-integrity sweep, but the approved review found no stronger evidence of a Community Gallery product or runtime change. It remains globally preserved and excluded from the Gallery projection pending stronger evidence.",
} satisfies Record<string, string>);

export const DEFAULT_RECONCILIATION_POLICY: ReconciliationPolicy = Object.freeze({
  expectedEntryCount: 203,
  applicable: GALLERY_APPLICABLE_RATIONALES,
  pendingExcluded: GALLERY_PENDING_RATIONALES,
});

export type ReconciledLegacyEntry = Readonly<{
  legacySourceId: string;
  canonicalChangeId: string;
  originalRecord: LegacyQualityHubPayload;
  title: string;
  outcome: string;
  changeDate: string;
  sourceHash: string;
  preservedRecordHash?: string;
  privacyRedactions: readonly LegacyPrivacyRedaction[];
  ownerDbHash: string;
  localStorageHash: string;
  repositorySeedHash: string;
  sourceLineage: readonly ("owner-db" | "local-storage" | "repository-seed")[];
  sourceDifference: SourceDifference;
  conflictResolution:
    | "identical-across-all-captured-sources"
    | "normalized-optional-empty-array-under-reviewed-owner-union"
    | "selected-reviewed-owner-union-for-reference-difference"
    | "selected-reviewed-owner-union-for-substantive-collision";
  sourceResolutionRationale: string;
  differingFields: readonly string[];
  semanticDuplicateIds: readonly string[];
  affectedCapabilities: readonly ChronicleCapabilityId[];
  galleryClassification: GalleryClassification;
  galleryApplicability: "applicable" | "not_applicable" | "pending_excluded";
  applicabilityStatus:
    | "capability-reviewed"
    | "gallery-reviewed-other-capabilities-unclassified"
    | "gallery-review-pending";
  applicabilityEvidence: string;
  reviewer: string;
}>;

export type QualityHubReconciliation = Readonly<{
  sourcePackageSha256: string;
  sourceCaptureId: string;
  sourceRevision: string;
  sourceFingerprint: string;
  sourceHashes: Readonly<{
    ownerDb: string;
    localStorage: string;
    repositorySeed: string;
  }>;
  sourceCounts: Readonly<{
    ownerDb: number;
    localStorage: number;
    repositorySeed: number;
  }>;
  selectedLegacyIdsSha256: string;
  entries: readonly ReconciledLegacyEntry[];
  identicalCount: number;
  normalizedEquivalentCount: number;
  reviewedReferenceDifferenceCount: number;
  reviewedSubstantiveCollisionCount: number;
  galleryCount: number;
  nonGalleryCount: number;
  pendingExcludedCount: number;
  importedOn: string;
}>;

function sha256Bytes(value: Buffer | string) {
  return createHash("sha256").update(value).digest("hex");
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireRecord(value: unknown, label: string) {
  if (!isPlainRecord(value)) throw new Error(`${label} must be an object.`);
  return value;
}

function requireString(value: unknown, label: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }
  return value;
}

function requireInteger(value: unknown, label: string) {
  if (!Number.isSafeInteger(value) || Number(value) < 0) {
    throw new Error(`${label} must be a non-negative safe integer.`);
  }
  return Number(value);
}

function requireSha256(value: unknown, label: string) {
  const digest = requireString(value, label);
  if (!/^[a-f0-9]{64}$/.test(digest)) {
    throw new Error(`${label} must be a lowercase SHA-256 digest.`);
  }
  return digest;
}

function requireIsoTimestamp(value: unknown, label: string) {
  const timestamp = requireString(value, label);
  const parsed = new Date(timestamp);
  const isExplicitUtc =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|\+00:00)$/.test(
      timestamp,
    );
  if (Number.isNaN(parsed.valueOf()) || !isExplicitUtc) {
    throw new Error(`${label} must be an exact ISO-8601 UTC timestamp.`);
  }
  return timestamp;
}

function assertExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
  label: string,
) {
  const actual = Object.keys(value).sort((left, right) => left.localeCompare(right));
  const canonicalExpected = [...expected].sort((left, right) =>
    left.localeCompare(right),
  );
  if (actual.join("\0") !== canonicalExpected.join("\0")) {
    throw new Error(`${label} contains missing or unsupported fields.`);
  }
}

function isRealIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function normalizeDisplayText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function sanitizeLegacyPayload(payload: LegacyQualityHubPayload) {
  const privacyRedactions: LegacyPrivacyRedaction[] = [];
  const sanitize = (value: string, field: string) => {
    const sanitized = value.replace(/\/Users\/[^/\s"']+\//g, "$HOME/");
    if (sanitized !== value) {
      privacyRedactions.push({
        field,
        transformation: "home-directory-prefix-to-$HOME",
      });
    }
    return sanitized;
  };
  const sanitizeArray = (values: readonly string[], field: string) =>
    Object.freeze(values.map((value, index) => sanitize(value, `${field}[${index}]`)));
  const originalRecord = Object.freeze({
    ...payload,
    title: sanitize(payload.title, "title"),
    summary: sanitize(payload.summary, "summary"),
    problem: sanitize(payload.problem, "problem"),
    plan: sanitize(payload.plan, "plan"),
    changes: sanitize(payload.changes, "changes"),
    filesAffected: sanitizeArray(payload.filesAffected, "filesAffected"),
    agent: sanitize(payload.agent, "agent"),
    relatedFindingIds: sanitizeArray(
      payload.relatedFindingIds,
      "relatedFindingIds",
    ),
    ...(payload.relatedRunIds
      ? { relatedRunIds: sanitizeArray(payload.relatedRunIds, "relatedRunIds") }
      : {}),
    tags: sanitizeArray(payload.tags, "tags"),
    comments: Object.freeze(
      payload.comments.map((comment, index) =>
        Object.freeze({
          id: sanitize(comment.id, `comments[${index}].id`),
          author: sanitize(comment.author, `comments[${index}].author`),
          timestamp: sanitize(comment.timestamp, `comments[${index}].timestamp`),
          text: sanitize(comment.text, `comments[${index}].text`),
        }),
      ),
    ),
    createdAt: sanitize(payload.createdAt, "createdAt"),
    updatedAt: sanitize(payload.updatedAt, "updatedAt"),
  }) satisfies LegacyQualityHubPayload;
  return Object.freeze({
    originalRecord,
    privacyRedactions: Object.freeze(privacyRedactions),
    preservedRecordHash:
      privacyRedactions.length > 0
        ? computeLegacyPayloadHash(originalRecord)
        : undefined,
  });
}

function differingPayloadFields(
  owner: LegacyQualityHubPayload,
  seed: LegacyQualityHubPayload,
) {
  const canonicalField = (value: unknown) =>
    value === undefined ? "__CHRONICLE_MISSING_OPTIONAL_FIELD__" : canonicalJsonStringify(value);
  return [...new Set([...Object.keys(owner), ...Object.keys(seed)])]
    .sort((left, right) => left.localeCompare(right))
    .filter(
      (key) =>
        canonicalField(owner[key as keyof LegacyQualityHubPayload]) !==
        canonicalField(seed[key as keyof LegacyQualityHubPayload]),
    );
}

function classifySourceDifference(
  owner: LegacyQualityHubPayload,
  seed: LegacyQualityHubPayload,
  differingFields: readonly string[],
): SourceDifference {
  if (differingFields.length === 0) return "exact";
  if (
    differingFields.length === 1 &&
    differingFields[0] === "relatedRunIds" &&
    Array.isArray(owner.relatedRunIds) &&
    owner.relatedRunIds.length === 0 &&
    seed.relatedRunIds === undefined
  ) {
    return "normalized-empty-optional-field";
  }
  if (
    differingFields.every((field) =>
      ["relatedFindingIds", "relatedRunIds"].includes(field),
    )
  ) {
    return "reviewed-reference-difference";
  }
  return "reviewed-substantive-collision";
}

function semanticLegacyPayloadKey(payload: LegacyQualityHubPayload) {
  const { id: _id, relatedRunIds: _relatedRunIds, ...rest } = payload;
  return canonicalJsonStringify(rest);
}

function exactIdMap(
  entries: readonly LegacyQualityHubPayload[],
  label: string,
) {
  const map = new Map<string, LegacyQualityHubPayload>();
  for (const entry of entries) {
    if (map.has(entry.id)) throw new Error(`${label} contains duplicate ID ${entry.id}.`);
    map.set(entry.id, entry);
  }
  return map;
}

function assertSameMembership(
  expected: ReadonlyMap<string, LegacyQualityHubPayload>,
  actual: ReadonlyMap<string, LegacyQualityHubPayload>,
  actualLabel: string,
) {
  const missing = [...expected.keys()].filter((id) => !actual.has(id));
  const extra = [...actual.keys()].filter((id) => !expected.has(id));
  if (missing.length > 0 || extra.length > 0) {
    throw new Error(
      `${actualLabel} identity membership differs from the approved owner union: ` +
        `${missing.length} missing and ${extra.length} extra IDs.`,
    );
  }
}

function projectedCapturedSource(
  value: unknown,
  label: string,
  expectedSource: "owner-db" | "local-storage" | "repository-seed",
) {
  const record = requireRecord(value, label);
  assertExactKeys(
    record,
    [
      "presence",
      "source",
      "capturedAt",
      "registryVersion",
      "fullRegistryHash",
      "changeLogHash",
      "changeLogCount",
      "changeLog",
    ],
    label,
  );
  if (record.presence !== "captured") {
    throw new Error(`${label} must be present in the approved Phase 5 package.`);
  }
  if (record.source !== expectedSource) {
    throw new Error(`${label}.source must be ${expectedSource}.`);
  }
  const capturedAt = requireIsoTimestamp(record.capturedAt, `${label}.capturedAt`);
  if (record.registryVersion !== null) {
    requireInteger(record.registryVersion, `${label}.registryVersion`);
  }
  const fullRegistryHash = requireSha256(
    record.fullRegistryHash,
    `${label}.fullRegistryHash`,
  );
  const entries = projectQualityHubChangeLog(record.changeLog) as LegacyQualityHubPayload[];
  const declaredCount = requireInteger(record.changeLogCount, `${label}.changeLogCount`);
  if (declaredCount !== entries.length) {
    throw new Error(`${label} count does not match its captured entries.`);
  }
  const declaredHash = requireSha256(record.changeLogHash, `${label}.changeLogHash`);
  const computedHash = sha256Bytes(canonicalJsonStringify(entries));
  if (declaredHash !== computedHash) {
    throw new Error(`${label} hash does not match its captured entries.`);
  }
  return Object.freeze({
    entries,
    count: declaredCount,
    hash: declaredHash,
    fullRegistryHash,
    capturedAt,
    registryVersion: record.registryVersion,
  });
}

function ruleForEntry(
  id: string,
  seedIds: ReadonlySet<string>,
  policy: ReconciliationPolicy,
): GalleryApplicabilityRule {
  if (!seedIds.has(id)) {
    throw new Error(
      `Owner-only legacy ID ${id} has no approved Community Gallery applicability decision.`,
    );
  }
  if (Object.prototype.hasOwnProperty.call(policy.applicable, id)) {
    return Object.freeze({
      classification: "applicable",
      rationale: policy.applicable[id],
    });
  }
  if (Object.prototype.hasOwnProperty.call(policy.pendingExcluded, id)) {
    return Object.freeze({
      classification: "pending_excluded",
      rationale: policy.pendingExcluded[id],
    });
  }
  return Object.freeze({
    classification: "not_applicable",
    rationale:
      "The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.",
  });
}

function assertPolicyMembership(
  ownerIds: ReadonlySet<string>,
  policy: ReconciliationPolicy,
) {
  const policyIds = [
    ...Object.keys(policy.applicable),
    ...Object.keys(policy.pendingExcluded),
  ];
  const duplicatePolicyIds = policyIds.filter(
    (id, index) => policyIds.indexOf(id) !== index,
  );
  if (duplicatePolicyIds.length > 0) {
    throw new Error(`Applicability policy repeats ${duplicatePolicyIds[0]}.`);
  }
  const missing = policyIds.filter((id) => !ownerIds.has(id));
  if (missing.length > 0) {
    throw new Error(
      `Approved applicability record ${missing[0]} is absent from the migration source.`,
    );
  }
}

export function reconcileQualityHubMigrationEnvelope(
  envelopeValue: unknown,
  options: Readonly<{
    sourcePackageSha256: string;
    importedOn: string;
    policy?: ReconciliationPolicy;
    currentRepositorySeed?: readonly LegacyQualityHubPayload[];
  }>,
): QualityHubReconciliation {
  if (!/^[a-f0-9]{64}$/.test(options.sourcePackageSha256)) {
    throw new Error("Source package SHA-256 must be a lowercase 64-character digest.");
  }
  if (!isRealIsoDate(options.importedOn)) {
    throw new Error("Import date must use a real YYYY-MM-DD date.");
  }
  const policy = options.policy ?? DEFAULT_RECONCILIATION_POLICY;
  const envelope = requireRecord(envelopeValue, "Migration package");
  assertExactKeys(
    envelope,
    [
      "packageType",
      "packageVersion",
      "captureId",
      "capturedAt",
      "qualityHub",
      "authenticatedOwner",
      "sources",
    ],
    "Migration package",
  );
  if (
    envelope.packageType !== CHANGELOG_MIGRATION_PACKAGE_TYPE ||
    envelope.packageVersion !== CHANGELOG_MIGRATION_PACKAGE_VERSION
  ) {
    throw new Error("Migration package type or version is not supported.");
  }
  const captureId = requireString(envelope.captureId, "Migration package captureId");
  requireIsoTimestamp(envelope.capturedAt, "Migration package capturedAt");
  const qualityHub = requireRecord(envelope.qualityHub, "Migration package qualityHub");
  assertExactKeys(
    qualityHub,
    [
      "contractVersion",
      "repositorySeedRegistryVersion",
      "applicationVersion",
      "sourceRevision",
      "sourceFingerprintAlgorithm",
      "sourceFingerprintScope",
      "sourceFingerprint",
    ],
    "Migration package qualityHub",
  );
  requireString(qualityHub.contractVersion, "Migration package qualityHub.contractVersion");
  if (qualityHub.repositorySeedRegistryVersion !== null) {
    requireInteger(
      qualityHub.repositorySeedRegistryVersion,
      "Migration package qualityHub.repositorySeedRegistryVersion",
    );
  }
  requireString(
    qualityHub.applicationVersion,
    "Migration package qualityHub.applicationVersion",
  );
  const sourceRevision = requireString(
    qualityHub.sourceRevision,
    "Migration package qualityHub.sourceRevision",
  );
  const sourceFingerprint = requireString(
    qualityHub.sourceFingerprint,
    "Migration package qualityHub.sourceFingerprint",
  );
  if (qualityHub.sourceFingerprintAlgorithm !== "SHA-256") {
    throw new Error("Migration package source fingerprint algorithm is unsupported.");
  }
  requireString(
    qualityHub.sourceFingerprintScope,
    "Migration package qualityHub.sourceFingerprintScope",
  );
  requireSha256(
    sourceFingerprint,
    "Migration package qualityHub.sourceFingerprint",
  );
  const authenticatedOwner = requireRecord(
    envelope.authenticatedOwner,
    "Migration package authenticatedOwner",
  );
  assertExactKeys(
    authenticatedOwner,
    [
      "fingerprintAlgorithm",
      "fingerprintDomain",
      "fingerprintSalt",
      "userFingerprint",
      "initialDatabaseUpdatedAt",
      "finalDatabaseUpdatedAt",
      "initialFullRegistryHash",
      "finalFullRegistryHash",
      "initialChangeLogHash",
      "finalChangeLogHash",
    ],
    "Migration package authenticatedOwner",
  );
  if (authenticatedOwner.fingerprintAlgorithm !== "SHA-256") {
    throw new Error("Migration package owner fingerprint algorithm is unsupported.");
  }
  requireString(
    authenticatedOwner.fingerprintDomain,
    "Migration package authenticatedOwner.fingerprintDomain",
  );
  requireString(
    authenticatedOwner.fingerprintSalt,
    "Migration package authenticatedOwner.fingerprintSalt",
  );
  requireSha256(
    authenticatedOwner.userFingerprint,
    "Migration package authenticatedOwner.userFingerprint",
  );
  requireIsoTimestamp(
    authenticatedOwner.initialDatabaseUpdatedAt,
    "Migration package authenticatedOwner.initialDatabaseUpdatedAt",
  );
  requireIsoTimestamp(
    authenticatedOwner.finalDatabaseUpdatedAt,
    "Migration package authenticatedOwner.finalDatabaseUpdatedAt",
  );
  const initialFullRegistryHash = requireSha256(
    authenticatedOwner.initialFullRegistryHash,
    "Migration package authenticatedOwner.initialFullRegistryHash",
  );
  const finalFullRegistryHash = requireSha256(
    authenticatedOwner.finalFullRegistryHash,
    "Migration package authenticatedOwner.finalFullRegistryHash",
  );
  const initialChangeLogHash = requireSha256(
    authenticatedOwner.initialChangeLogHash,
    "Migration package authenticatedOwner.initialChangeLogHash",
  );
  const finalChangeLogHash = requireSha256(
    authenticatedOwner.finalChangeLogHash,
    "Migration package authenticatedOwner.finalChangeLogHash",
  );
  const sources = requireRecord(envelope.sources, "Migration package sources");
  assertExactKeys(
    sources,
    ["ownerDb", "localStorage", "repositorySeed"],
    "Migration package sources",
  );
  const ownerDb = projectedCapturedSource(sources.ownerDb, "ownerDb", "owner-db");
  const localStorage = projectedCapturedSource(
    sources.localStorage,
    "localStorage",
    "local-storage",
  );
  const repositorySeed = projectedCapturedSource(
    sources.repositorySeed,
    "repositorySeed",
    "repository-seed",
  );

  if (
    initialFullRegistryHash !== finalFullRegistryHash ||
    finalFullRegistryHash !== ownerDb.fullRegistryHash ||
    initialChangeLogHash !== finalChangeLogHash ||
    finalChangeLogHash !== ownerDb.hash
  ) {
    throw new Error(
      "Authenticated owner hashes do not prove one stable database read during capture.",
    );
  }
  const currentRepositorySeed =
    options.currentRepositorySeed ??
    (projectQualityHubChangeLog(
      qualityHubInitialRegistry.changeLog,
    ) as LegacyQualityHubPayload[]);
  if (
    canonicalJsonStringify(currentRepositorySeed) !==
    canonicalJsonStringify(repositorySeed.entries)
  ) {
    throw new Error(
      "Captured repository seed no longer matches the current Chronicle seed source.",
    );
  }

  if (ownerDb.count !== policy.expectedEntryCount) {
    throw new Error(
      `Approved owner union has ${ownerDb.count} entries; expected ${policy.expectedEntryCount}.`,
    );
  }
  if (canonicalJsonStringify(ownerDb.entries) !== canonicalJsonStringify(localStorage.entries)) {
    throw new Error(
      "Owner database and local-storage copies differ; the approved post-incident union is not stable.",
    );
  }

  const ownerMap = exactIdMap(ownerDb.entries, "ownerDb");
  const localMap = exactIdMap(localStorage.entries, "localStorage");
  const seedMap = exactIdMap(repositorySeed.entries, "repositorySeed");
  assertSameMembership(ownerMap, localMap, "localStorage");
  assertSameMembership(ownerMap, seedMap, "repositorySeed");
  assertPolicyMembership(new Set(ownerMap.keys()), policy);

  const seedIds = new Set(seedMap.keys());
  const semanticDuplicateGroups = new Map<string, string[]>();
  for (const [id, payload] of ownerMap) {
    const key = semanticLegacyPayloadKey(payload);
    const group = semanticDuplicateGroups.get(key) ?? [];
    group.push(id);
    semanticDuplicateGroups.set(key, group);
  }
  const entries = [...ownerMap.keys()]
    .sort((left, right) => left.localeCompare(right))
    .map((legacySourceId): ReconciledLegacyEntry => {
      const originalRecord = ownerMap.get(legacySourceId);
      const localRecord = localMap.get(legacySourceId);
      const seedRecord = seedMap.get(legacySourceId);
      if (!originalRecord || !localRecord || !seedRecord) {
        throw new Error(`Legacy ID ${legacySourceId} is missing from a captured source.`);
      }
      const ownerCanonical = canonicalJsonStringify(originalRecord);
      const localCanonical = canonicalJsonStringify(localRecord);
      const seedCanonical = canonicalJsonStringify(seedRecord);
      if (ownerCanonical !== localCanonical) {
        throw new Error(`Legacy ID ${legacySourceId} differs between owner and local copies.`);
      }
      const ownerHash = sha256Bytes(ownerCanonical);
      const localHash = sha256Bytes(localCanonical);
      const seedHash = sha256Bytes(seedCanonical);
      const differingFields = differingPayloadFields(originalRecord, seedRecord);
      const sourceDifference = classifySourceDifference(
        originalRecord,
        seedRecord,
        differingFields,
      );
      const rule = ruleForEntry(legacySourceId, seedIds, policy);
      const affectedCapabilities: ChronicleCapabilityId[] =
        rule.classification === "applicable" ? ["community-gallery"] : [];
      const datePrefix = originalRecord.updatedAt.slice(0, 10);
      if (!isRealIsoDate(datePrefix)) {
        throw new Error(`Legacy ID ${legacySourceId} has an invalid updatedAt date.`);
      }
      const sanitized = sanitizeLegacyPayload(originalRecord);
      const semanticDuplicateIds = (
        semanticDuplicateGroups.get(semanticLegacyPayloadKey(originalRecord)) ?? []
      )
        .filter((id) => id !== legacySourceId)
        .sort((left, right) => left.localeCompare(right));
      const conflictResolution =
        sourceDifference === "exact"
          ? "identical-across-all-captured-sources"
          : sourceDifference === "normalized-empty-optional-field"
            ? "normalized-optional-empty-array-under-reviewed-owner-union"
            : sourceDifference === "reviewed-reference-difference"
              ? "selected-reviewed-owner-union-for-reference-difference"
              : "selected-reviewed-owner-union-for-substantive-collision";
      const sourceResolutionRationale =
        sourceDifference === "exact"
          ? "Owner database, local storage, and repository seed contain the same exact canonical payload."
          : sourceDifference === "normalized-empty-optional-field"
            ? "CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage."
            : sourceDifference === "reviewed-reference-difference"
              ? `CG-LOG-022 selects the exact owner union. Owner and local storage are identical; the seed differs only in ${differingFields.join(", ")}. All variant hashes and differing fields remain recorded without timestamp-based precedence.`
              : `CG-LOG-022 selects the exact owner union. Owner and local storage are identical; the seed contains a substantive same-ID variant across ${differingFields.join(", ")}. Both variant hashes and the discarded seed-field set remain recorded, and no timestamp-based precedence was used.`;
      return Object.freeze({
        legacySourceId,
        canonicalChangeId: `LEGACY-QH-${legacySourceId}`,
        originalRecord: sanitized.originalRecord,
        title: normalizeDisplayText(sanitized.originalRecord.title),
        outcome: normalizeDisplayText(sanitized.originalRecord.summary),
        changeDate: datePrefix,
        sourceHash: computeLegacyPayloadHash(originalRecord),
        preservedRecordHash: sanitized.preservedRecordHash,
        privacyRedactions: sanitized.privacyRedactions,
        ownerDbHash: ownerHash,
        localStorageHash: localHash,
        repositorySeedHash: seedHash,
        sourceLineage: sourceDifference === "exact"
          ? (["owner-db", "local-storage", "repository-seed"] as const)
          : (["owner-db", "local-storage"] as const),
        sourceDifference,
        conflictResolution,
        sourceResolutionRationale,
        differingFields: Object.freeze(differingFields),
        semanticDuplicateIds: Object.freeze(semanticDuplicateIds),
        affectedCapabilities: Object.freeze(affectedCapabilities),
        galleryClassification: rule.classification,
        galleryApplicability:
          rule.classification === "applicable"
            ? "applicable"
            : rule.classification === "pending_excluded"
              ? "pending_excluded"
              : "not_applicable",
        applicabilityStatus:
          rule.classification === "applicable"
            ? "capability-reviewed"
            : rule.classification === "pending_excluded"
              ? "gallery-review-pending"
              : "gallery-reviewed-other-capabilities-unclassified",
        applicabilityEvidence: rule.rationale,
        reviewer: REVIEWER,
      });
    });

  const identicalCount = entries.filter(
    (entry) => entry.sourceDifference === "exact",
  ).length;
  const normalizedEquivalentCount = entries.filter(
    (entry) => entry.sourceDifference === "normalized-empty-optional-field",
  ).length;
  const reviewedReferenceDifferenceCount = entries.filter(
    (entry) => entry.sourceDifference === "reviewed-reference-difference",
  ).length;
  const reviewedSubstantiveCollisionCount = entries.filter(
    (entry) => entry.sourceDifference === "reviewed-substantive-collision",
  ).length;
  const galleryCount = entries.filter(
    (entry) => entry.galleryClassification === "applicable",
  ).length;
  const pendingExcludedCount = entries.filter(
    (entry) => entry.galleryClassification === "pending_excluded",
  ).length;
  return Object.freeze({
    sourcePackageSha256: options.sourcePackageSha256,
    sourceCaptureId: captureId,
    sourceRevision,
    sourceFingerprint,
    sourceHashes: Object.freeze({
      ownerDb: ownerDb.hash,
      localStorage: localStorage.hash,
      repositorySeed: repositorySeed.hash,
    }),
    sourceCounts: Object.freeze({
      ownerDb: ownerDb.count,
      localStorage: localStorage.count,
      repositorySeed: repositorySeed.count,
    }),
    selectedLegacyIdsSha256: sha256Bytes(
      canonicalJsonStringify(entries.map((entry) => entry.legacySourceId)),
    ),
    entries: Object.freeze(entries),
    identicalCount,
    normalizedEquivalentCount,
    reviewedReferenceDifferenceCount,
    reviewedSubstantiveCollisionCount,
    galleryCount,
    nonGalleryCount: entries.length - galleryCount - pendingExcludedCount,
    pendingExcludedCount,
    importedOn: options.importedOn,
  });
}

function renderYamlFrontmatter(value: unknown) {
  return stringifyYaml(value, { lineWidth: 0 }).trimEnd();
}

function markdownInline(value: string) {
  return value.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

export function renderLegacyChangelogRecord(
  entry: ReconciledLegacyEntry,
  reconciliation: QualityHubReconciliation,
) {
  const sourceRecord = `${CHANGELOG_DIRECTORY}/${entry.canonicalChangeId}.md`;
  const frontmatter = {
    record_type: "changelog",
    variant: "legacy_import",
    change_id: entry.canonicalChangeId,
    title: entry.title,
    change_date: entry.changeDate,
    outcome: entry.outcome,
    provenance: "historical-quality-hub",
    affected_capabilities: [...entry.affectedCapabilities],
    legacy_source_id: entry.legacySourceId,
    original_record: entry.originalRecord,
    source_hash: entry.sourceHash,
    ...(entry.preservedRecordHash
      ? { preserved_record_hash: entry.preservedRecordHash }
      : {}),
    ...(entry.privacyRedactions.length > 0
      ? { privacy_redactions: [...entry.privacyRedactions] }
      : {}),
    migration_snapshot_hash: reconciliation.sourcePackageSha256,
    imported_on: reconciliation.importedOn,
    source_lineage: [...entry.sourceLineage],
    migration_receipt: RECEIPT_SOURCE_PATH,
    applicability_evidence: entry.applicabilityEvidence,
    applicability_status: entry.applicabilityStatus,
    gallery_applicability: entry.galleryApplicability,
    provenance_limit: LEGACY_PROVENANCE_LIMIT,
    modern_acceptance: "not_assessed",
    proof_status: "not_reverified",
    source_record: sourceRecord,
  };
  const lineage = entry.sourceLineage.join(", ");
  const classification =
    entry.galleryClassification === "pending_excluded"
      ? "Community Gallery applicability remains pending and the record is excluded from that projection."
      : entry.galleryApplicability === "applicable"
        ? "Community Gallery applicability is positively verified for this pilot. Other capability mappings remain outside this review."
        : "Community Gallery applicability was not positively verified. Other capability mappings remain outside this review."
  const preservation =
    entry.privacyRedactions.length > 0
      ? "The historical payload is preserved under `original_record` with only its absolute local home-directory prefix replaced by `$HOME/`. The exact pre-redaction payload remains in the private approved package and is bound here by `source_hash`; `preserved_record_hash` binds the repository-safe transcription."
      : "The complete selected Quality Hub payload is preserved in the frontmatter of this record under `original_record` and bound by `source_hash`.";
  return `---\n${renderYamlFrontmatter(frontmatter)}\n---\n# ${entry.canonicalChangeId}: ${entry.title}\n\n## Outcome\n\n${entry.outcome}\n\n## Provenance\n\nThis is a historical Quality Hub record. Its original status is preserved as historical data and is not modern Chronicle acceptance.\n\n## Applicability\n\n${classification} ${entry.applicabilityEvidence}\n\n## Original Quality Hub Record\n\n${preservation}\n\n## Migration Lineage\n\nSelected from the user-approved post-incident union recorded in ${SOURCE_AUTHORITY_REF}. Matching source lineage: ${lineage}. The exact pre-incident 170-entry membership remains unknown. Source comparison: ${entry.sourceDifference}; reviewed resolution: ${entry.conflictResolution}.\n\n## Modern Verification Status\n\nModern acceptance was not assessed and the historical result was not reverified during migration.\n`;
}

function receiptEntry(
  entry: ReconciledLegacyEntry,
  reconciliation: QualityHubReconciliation,
  importStatus: ImportStatus,
) {
  return {
    legacy_source_id: entry.legacySourceId,
    canonical_change_id: entry.canonicalChangeId,
    owner_db_hash: entry.ownerDbHash,
    local_storage_hash: entry.localStorageHash,
    repository_seed_hash: entry.repositorySeedHash,
    selected_hash: entry.sourceHash,
    preserved_record_hash: entry.preservedRecordHash ?? entry.sourceHash,
    generated_markdown_sha256: sha256Bytes(
      renderLegacyChangelogRecord(entry, reconciliation),
    ),
    source_lineage: [...entry.sourceLineage],
    source_difference: entry.sourceDifference,
    conflict_resolution: entry.conflictResolution,
    source_resolution_rationale: entry.sourceResolutionRationale,
    differing_fields: [...entry.differingFields],
    semantic_duplicate_ids: [...entry.semanticDuplicateIds],
    privacy_redactions: [...entry.privacyRedactions],
    gallery_classification: entry.galleryClassification,
    affected_capabilities: [...entry.affectedCapabilities],
    rationale: entry.applicabilityEvidence,
    reviewer: entry.reviewer,
    import_status: importStatus,
  };
}

export function renderMigrationReceipt(
  reconciliation: QualityHubReconciliation,
  importStatus: ImportStatus,
) {
  const ledger = reconciliation.entries.map((entry) =>
    receiptEntry(entry, reconciliation, importStatus),
  );
  const frontmatter = {
    record_type: "changelog_migration_receipt",
    receipt_version: 1,
    migration_id: reconciliation.sourceCaptureId,
    source_package_type: CHANGELOG_MIGRATION_PACKAGE_TYPE,
    source_package_version: CHANGELOG_MIGRATION_PACKAGE_VERSION,
    source_package_sha256: reconciliation.sourcePackageSha256,
    source_revision: reconciliation.sourceRevision,
    source_fingerprint: reconciliation.sourceFingerprint,
    source_authority: SOURCE_AUTHORITY,
    source_authority_ref: SOURCE_AUTHORITY_REF,
    source_authority_approved_on: "2026-08-01",
    imported_on: reconciliation.importedOn,
    provenance_limit: LEGACY_PROVENANCE_LIMIT,
    source_counts: reconciliation.sourceCounts,
    source_changelog_hashes: reconciliation.sourceHashes,
    selected_legacy_ids_sha256: reconciliation.selectedLegacyIdsSha256,
    global_legacy_count: reconciliation.entries.length,
    community_gallery_count: reconciliation.galleryCount,
    non_gallery_count: reconciliation.nonGalleryCount,
    pending_gallery_count: reconciliation.pendingExcludedCount,
    identical_across_sources_count: reconciliation.identicalCount,
    normalized_optional_difference_count:
      reconciliation.normalizedEquivalentCount,
    reviewed_reference_difference_count:
      reconciliation.reviewedReferenceDifferenceCount,
    reviewed_substantive_collision_count:
      reconciliation.reviewedSubstantiveCollisionCount,
    import_status: importStatus,
    entries: ledger,
    source_record: RECEIPT_SOURCE_PATH,
  };
  const rows = ledger
    .map(
      (entry) =>
        `| ${markdownInline(entry.legacy_source_id)} | ${entry.owner_db_hash} | ${entry.local_storage_hash} | ${entry.repository_seed_hash} | ${entry.selected_hash} | ${entry.preserved_record_hash} | ${entry.generated_markdown_sha256} | ${entry.source_difference} | ${entry.conflict_resolution} | ${markdownInline(entry.source_resolution_rationale)} | ${entry.source_lineage.join(", ")} | ${entry.gallery_classification} | ${markdownInline(entry.rationale)} | ${markdownInline(entry.reviewer)} | ${entry.import_status} | ${entry.canonical_change_id} |`,
    )
    .join("\n");
  return `---\n${renderYamlFrontmatter(frontmatter)}\n---\n# Quality Hub Changelog Legacy Migration Receipt\n\n## Source Authority and Known Limitation\n\nThe exact authenticated 203-entry post-incident owner union is the approved migration source under ${SOURCE_AUTHORITY_REF}. The earlier 170-ID membership could not be recovered, so no row is presented as proof that it belonged to that unavailable earlier set. The captured seed remains comparison evidence; it is not silently substituted for the approved owner history.\n\n## Reconciliation Summary\n\nAll three captured sources contain ${reconciliation.entries.length} unique IDs. The authenticated owner and local-storage copies are identical. ${reconciliation.identicalCount} records are exactly identical to the seed, ${reconciliation.normalizedEquivalentCount} differ only by the reviewed optional empty-array representation, ${reconciliation.reviewedReferenceDifferenceCount} contain reviewed reference differences, and ${reconciliation.reviewedSubstantiveCollisionCount} contain reviewed substantive same-ID collisions. Every nonexact row retains all source hashes, the selected lineage, differing fields, and the authority and rationale for preserving the approved owner payload. Cross-ID duplicate events remain visible rather than being deleted.\n\n## Privacy Preservation\n\nThe private approved package retains the exact selected payload. Repository records replace only absolute local home-directory prefixes with \`$HOME/\`; each affected field, exact pre-redaction hash, privacy-safe preserved hash, and generated Markdown hash is recorded below.\n\n## Community Gallery Applicability\n\n${reconciliation.galleryCount} records are positively verified for Community Gallery. ${reconciliation.pendingExcludedCount} record remains explicitly pending and excluded. The remaining ${reconciliation.nonGalleryCount} records stay in global history without guessing other capability mappings.\n\n## Per-record Ledger\n\n| Legacy ID | Owner DB hash | Local storage hash | Repository seed hash | Selected raw hash | Preserved record hash | Generated Markdown hash | Source difference | Reviewed resolution | Source-resolution rationale | Source lineage | Gallery classification | Applicability rationale | Reviewer | Import status | Canonical ID |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|\n${rows}\n`;
}

function scanGeneratedSources(
  sources: Readonly<Record<string, string>>,
  envelope: ChangelogMigrationEnvelopeV1,
) {
  const prohibitedExactValues = [
    envelope.authenticatedOwner.userFingerprint,
    envelope.authenticatedOwner.fingerprintSalt,
  ].filter((value) => typeof value === "string" && value.length > 0);
  const secretPatterns = [
    /[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
    /AKIA[0-9A-Z]{16}/,
    /sk_(?:live|test)_[A-Za-z0-9]{16,}/,
    /sk-[A-Za-z0-9_-]{20,}/,
    /sb_(?:secret|publishable)_[A-Za-z0-9_-]{16,}/,
    /gh[pousr]_[A-Za-z0-9]{20,}/,
    /\bBearer\s+[A-Za-z0-9._~-]{16,}/i,
    /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
    /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/,
    /\/Users\/[^/\s"']+\//,
  ];
  for (const [sourcePath, source] of Object.entries(sources)) {
    for (const value of prohibitedExactValues) {
      if (source.includes(value)) {
        throw new Error(`${sourcePath} contains private migration identity material.`);
      }
    }
    if (secretPatterns.some((pattern) => pattern.test(source))) {
      throw new Error(`${sourcePath} contains a credential or private-identity pattern.`);
    }
  }
}

async function writeExclusivePrivateFile(filePath: string, bytes: Buffer) {
  const handle = await open(
    filePath,
    fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_EXCL,
    REQUIRED_FILE_MODE,
  );
  try {
    await handle.writeFile(bytes);
    await handle.sync();
  } finally {
    await handle.close();
  }
}

function isWithin(candidate: string, parent: string) {
  const relative = path.relative(parent, candidate);
  return (
    relative === "" ||
    (relative !== ".." &&
      !relative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relative))
  );
}

async function readVerifiedMigrationPackage(
  sourcePath: string,
  expectedSha256: string,
  repoRoot: string,
) {
  const absolutePath = path.resolve(sourcePath);
  const canonicalPath = await realpath(absolutePath);
  const canonicalRepoRoot = await realpath(repoRoot);
  if (canonicalPath !== absolutePath || isWithin(canonicalPath, canonicalRepoRoot)) {
    throw new Error("Migration source must be a real file outside the Chronicle repository.");
  }
  const pathStat = await lstat(canonicalPath);
  if (pathStat.isSymbolicLink() || !pathStat.isFile() || pathStat.size > MAX_SOURCE_BYTES) {
    throw new Error("Migration source must be a bounded regular file.");
  }
  const handle = await open(canonicalPath, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW);
  let bytes: Buffer;
  try {
    const openedStat = await handle.stat();
    if (
      openedStat.dev !== pathStat.dev ||
      openedStat.ino !== pathStat.ino ||
      openedStat.size !== pathStat.size
    ) {
      throw new Error("Migration source changed while it was opened.");
    }
    bytes = Buffer.from(await handle.readFile());
  } finally {
    await handle.close();
  }
  const actualSha256 = sha256Bytes(bytes);
  if (actualSha256 !== expectedSha256) {
    throw new Error("Migration source does not match the approved SHA-256 digest.");
  }
  let envelope: ChangelogMigrationEnvelopeV1;
  try {
    envelope = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    throw new Error("Migration source is not valid UTF-8 JSON.");
  }
  return Object.freeze({ canonicalPath, bytes, envelope, sha256: actualSha256 });
}

async function preparePrivateImportPackage(
  sourcePath: string,
  expectedSha256: string,
  importedOn: string,
  repoRoot: string,
) {
  const source = await readVerifiedMigrationPackage(
    sourcePath,
    expectedSha256,
    repoRoot,
  );
  const reconciliation = reconcileQualityHubMigrationEnvelope(source.envelope, {
    sourcePackageSha256: source.sha256,
    importedOn,
  });
  const renderedSources: Record<string, string> = Object.fromEntries(
    reconciliation.entries.map((entry) => [
      `${CHANGELOG_DIRECTORY}/${entry.canonicalChangeId}.md`,
      renderLegacyChangelogRecord(entry, reconciliation),
    ]),
  );
  scanGeneratedSources(renderedSources, source.envelope);
  const registry = buildChangelogRecordRegistry(renderedSources, {
    asOf: importedOn,
  });
  if (
    registry.roots.length !== reconciliation.entries.length ||
    selectChangelogEntriesFromRegistry(registry, "community-gallery").length !==
      reconciliation.galleryCount
  ) {
    throw new Error("Generated Changelog registry does not match reconciliation counts.");
  }

  const preparedReceipt = renderMigrationReceipt(reconciliation, "prepared");
  const importedReceipt = renderMigrationReceipt(reconciliation, "imported");
  scanGeneratedSources(
    {
      "migration-receipt.prepared.md": preparedReceipt,
      "migration-receipt.imported.md": importedReceipt,
    },
    source.envelope,
  );
  const canonicalState = await inspectCanonicalMigrationState(
    repoRoot,
    renderedSources,
    importedReceipt,
  );
  if (canonicalState === "complete") {
    return Object.freeze({
      alreadyMigrated: true as const,
      reconciliation,
    });
  }

  const outputRoot = path.join(
    path.dirname(source.canonicalPath),
    `phase5-reconciliation-${new Date().toISOString().replace(/[-:.]/g, "")}-${randomUUID()}`,
  );
  await mkdir(outputRoot, { mode: REQUIRED_DIRECTORY_MODE });
  const contentDirectory = path.join(outputRoot, "content");
  await mkdir(contentDirectory, { mode: REQUIRED_DIRECTORY_MODE });
  for (const entry of reconciliation.entries) {
    await writeExclusivePrivateFile(
      path.join(contentDirectory, `${entry.canonicalChangeId}.md`),
      Buffer.from(renderedSources[`${CHANGELOG_DIRECTORY}/${entry.canonicalChangeId}.md`], "utf8"),
    );
  }
  await writeExclusivePrivateFile(
    path.join(contentDirectory, "migration-receipt.md"),
    Buffer.from(importedReceipt, "utf8"),
  );
  const request = {
    version: 1,
    kind: "legacy-import",
    as_of: importedOn,
    receipt_content_file: "content/migration-receipt.md",
    records: reconciliation.entries.map((entry) => ({
      change_id: entry.canonicalChangeId,
      content_file: `content/${entry.canonicalChangeId}.md`,
    })),
  };
  await writeExclusivePrivateFile(
    path.join(outputRoot, "request.json"),
    Buffer.from(`${JSON.stringify(request, null, 2)}\n`, "utf8"),
  );
  await writeExclusivePrivateFile(
    path.join(outputRoot, "migration-receipt.prepared.md"),
    Buffer.from(preparedReceipt, "utf8"),
  );
  await writeExclusivePrivateFile(
    path.join(outputRoot, "migration-receipt.imported.md"),
    Buffer.from(importedReceipt, "utf8"),
  );
  await writeExclusivePrivateFile(
    path.join(outputRoot, "reconciliation-summary.json"),
    Buffer.from(
      `${JSON.stringify(
        {
          sourcePackageSha256: reconciliation.sourcePackageSha256,
          sourceCaptureId: reconciliation.sourceCaptureId,
          selectedLegacyIdsSha256: reconciliation.selectedLegacyIdsSha256,
          sourceCounts: reconciliation.sourceCounts,
          identicalCount: reconciliation.identicalCount,
          normalizedEquivalentCount: reconciliation.normalizedEquivalentCount,
          reviewedReferenceDifferenceCount:
            reconciliation.reviewedReferenceDifferenceCount,
          reviewedSubstantiveCollisionCount:
            reconciliation.reviewedSubstantiveCollisionCount,
          galleryCount: reconciliation.galleryCount,
          pendingExcludedCount: reconciliation.pendingExcludedCount,
          requestSha256: sha256Bytes(`${JSON.stringify(request, null, 2)}\n`),
          preparedReceiptSha256: sha256Bytes(preparedReceipt),
          importedReceiptSha256: sha256Bytes(importedReceipt),
        },
        null,
        2,
      )}\n`,
      "utf8",
    ),
  );
  return Object.freeze({
    alreadyMigrated: false as const,
    outputRoot,
    requestPath: path.join(outputRoot, "request.json"),
    canonicalReceiptCandidatePath: path.join(
      contentDirectory,
      "migration-receipt.md",
    ),
    preparedReceiptPath: path.join(outputRoot, "migration-receipt.prepared.md"),
    importedReceiptPath: path.join(outputRoot, "migration-receipt.imported.md"),
    reconciliation,
  });
}

async function readCanonicalChangelogSources(repoRoot: string) {
  const directory = path.join(repoRoot, CHANGELOG_DIRECTORY);
  const names = await readdir(directory);
  const sources: Record<string, string> = {};
  for (const name of names.sort((left, right) => left.localeCompare(right))) {
    if (name === ".gitkeep") continue;
    if (!name.endsWith(".md")) {
      throw new Error(`Unexpected Changelog directory entry ${name}.`);
    }
    const absolutePath = path.join(directory, name);
    const fileStat = await lstat(absolutePath);
    if (fileStat.isSymbolicLink() || !fileStat.isFile()) {
      throw new Error(`Canonical Changelog source ${name} is not a regular file.`);
    }
    sources[`${CHANGELOG_DIRECTORY}/${name}`] = await readFile(absolutePath, "utf8");
  }
  return sources;
}

async function readOptionalRegularFile(filePath: string, label: string) {
  try {
    const fileStat = await lstat(filePath);
    if (fileStat.isSymbolicLink() || !fileStat.isFile()) {
      throw new Error(`${label} is not a regular file.`);
    }
    return await readFile(filePath, "utf8");
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      return null;
    }
    throw error;
  }
}

async function inspectCanonicalMigrationState(
  repoRoot: string,
  expectedSources: Readonly<Record<string, string>>,
  expectedReceipt: string,
) {
  const actualSources = await readCanonicalChangelogSources(repoRoot);
  const expectedPaths = Object.keys(expectedSources).sort((left, right) =>
    left.localeCompare(right),
  );
  const actualLegacyPaths = Object.keys(actualSources)
    .filter((sourcePath) =>
      path.posix.basename(sourcePath).startsWith("LEGACY-QH-"),
    )
    .sort((left, right) => left.localeCompare(right));
  const receipt = await readOptionalRegularFile(
    path.join(repoRoot, RECEIPT_SOURCE_PATH),
    "Canonical migration receipt",
  );
  if (actualLegacyPaths.length === 0 && receipt === null) return "empty" as const;
  if (
    actualLegacyPaths.length === expectedPaths.length &&
    actualLegacyPaths.every((sourcePath, index) => sourcePath === expectedPaths[index]) &&
    expectedPaths.every(
      (sourcePath) => actualSources[sourcePath] === expectedSources[sourcePath],
    ) &&
    receipt === expectedReceipt
  ) {
    return "complete" as const;
  }
  throw new Error(
    "Canonical Changelog is in a partial or inconsistent migration state; recover or reconcile it before preparing another import.",
  );
}

async function verifyCanonicalMigration(
  sourcePath: string,
  expectedSha256: string,
  importedOn: string,
  repoRoot: string,
) {
  const source = await readVerifiedMigrationPackage(
    sourcePath,
    expectedSha256,
    repoRoot,
  );
  const reconciliation = reconcileQualityHubMigrationEnvelope(source.envelope, {
    sourcePackageSha256: source.sha256,
    importedOn,
  });
  const canonicalSources = await readCanonicalChangelogSources(repoRoot);
  const registry = buildChangelogRecordRegistry(canonicalSources, {
    asOf: importedOn,
  });
  const expectedIds = new Set(
    reconciliation.entries.map((entry) => entry.canonicalChangeId),
  );
  const actualLegacyRoots = registry.roots.filter(
    (record) => record.variant === "legacy_import",
  );
  if (
    actualLegacyRoots.length !== expectedIds.size ||
    actualLegacyRoots.some((record) => !expectedIds.has(record.id))
  ) {
    throw new Error("Canonical legacy identity membership does not match the receipt source.");
  }
  for (const entry of reconciliation.entries) {
    const sourcePathForEntry = `${CHANGELOG_DIRECTORY}/${entry.canonicalChangeId}.md`;
    const expectedSource = renderLegacyChangelogRecord(entry, reconciliation);
    if (canonicalSources[sourcePathForEntry] !== expectedSource) {
      throw new Error(`Canonical legacy record differs from reconciliation: ${entry.canonicalChangeId}.`);
    }
  }
  const galleryLegacyIds = selectChangelogEntriesFromRegistry(
    registry,
    "community-gallery",
  )
    .filter((entry) => entry.variant === "legacy_import")
    .map((entry) => entry.id)
    .sort((left, right) => left.localeCompare(right));
  const expectedGalleryIds = reconciliation.entries
    .filter((entry) => entry.galleryApplicability === "applicable")
    .map((entry) => entry.canonicalChangeId)
    .sort((left, right) => left.localeCompare(right));
  if (canonicalJsonStringify(galleryLegacyIds) !== canonicalJsonStringify(expectedGalleryIds)) {
    throw new Error("Community Gallery legacy projection does not match the reviewed mapping.");
  }
  const receiptPath = path.join(repoRoot, RECEIPT_SOURCE_PATH);
  const receiptStat = await lstat(receiptPath);
  if (receiptStat.isSymbolicLink() || !receiptStat.isFile()) {
    throw new Error("Canonical migration receipt is not a regular file.");
  }
  const receiptSource = await readFile(receiptPath, "utf8");
  const expectedReceipt = renderMigrationReceipt(reconciliation, "imported");
  if (receiptSource !== expectedReceipt) {
    throw new Error("Canonical migration receipt does not match the imported reconciliation.");
  }
  scanGeneratedSources(
    { ...canonicalSources, [RECEIPT_SOURCE_PATH]: receiptSource },
    source.envelope,
  );
  return Object.freeze({
    legacyCount: actualLegacyRoots.length,
    galleryCount: expectedGalleryIds.length,
    receiptSha256: sha256Bytes(receiptSource),
    selectedLegacyIdsSha256: reconciliation.selectedLegacyIdsSha256,
  });
}

function optionValue(args: readonly string[], name: string) {
  const index = args.indexOf(name);
  if (index < 0 || index === args.length - 1 || args.indexOf(name, index + 1) >= 0) {
    throw new Error(`Missing or repeated ${name}.`);
  }
  return args[index + 1];
}

async function runCli() {
  const args = process.argv.slice(2);
  const command = args[0];
  if (command !== "prepare" && command !== "verify") {
    throw new Error(
      "Usage: reconcile-quality-hub-changelog-migration.ts <prepare|verify> --source <json> --expected-sha256 <digest> --imported-on <YYYY-MM-DD> [--repo-root <path>]",
    );
  }
  const sourcePath = optionValue(args, "--source");
  const expectedSha256 = optionValue(args, "--expected-sha256");
  const importedOn = optionValue(args, "--imported-on");
  const repoRoot = path.resolve(
    args.includes("--repo-root") ? optionValue(args, "--repo-root") : process.cwd(),
  );
  const expectedLength = args.includes("--repo-root") ? 9 : 7;
  if (args.length !== expectedLength) {
    throw new Error("Unsupported reconciliation command arguments.");
  }
  if (command === "prepare") {
    const result = await preparePrivateImportPackage(
      sourcePath,
      expectedSha256,
      importedOn,
      repoRoot,
    );
    const summary = {
      alreadyMigrated: result.alreadyMigrated,
      legacyCount: result.reconciliation.entries.length,
      galleryCount: result.reconciliation.galleryCount,
      pendingExcludedCount: result.reconciliation.pendingExcludedCount,
      nonGalleryCount: result.reconciliation.nonGalleryCount,
      normalizedEquivalentCount:
        result.reconciliation.normalizedEquivalentCount,
      reviewedReferenceDifferenceCount:
        result.reconciliation.reviewedReferenceDifferenceCount,
      reviewedSubstantiveCollisionCount:
        result.reconciliation.reviewedSubstantiveCollisionCount,
      selectedLegacyIdsSha256: result.reconciliation.selectedLegacyIdsSha256,
    };
    process.stdout.write(
      `${JSON.stringify(
        result.alreadyMigrated
          ? summary
          : {
              ...summary,
              outputRoot: result.outputRoot,
              requestPath: result.requestPath,
              canonicalReceiptCandidatePath:
                result.canonicalReceiptCandidatePath,
              preparedReceiptPath: result.preparedReceiptPath,
              importedReceiptPath: result.importedReceiptPath,
            },
        null,
        2,
      )}\n`,
    );
    return;
  }
  const result = await verifyCanonicalMigration(
    sourcePath,
    expectedSha256,
    importedOn,
    repoRoot,
  );
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.env.CHRONICLE_QUALITY_HUB_RECONCILE_CLI === "1") {
  runCli().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
