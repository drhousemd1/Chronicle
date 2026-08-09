import {
  CHANGE_LOG_SEVERITY,
  CHANGE_LOG_STATUS,
  QUALITY_HUB_VERSION,
  type ChangeLogEntry,
  type QualityHubRegistry,
} from "@/lib/ui-audit-schema";

export const CHANGELOG_MIGRATION_PACKAGE_TYPE =
  "chronicle-quality-hub-changelog-migration" as const;
export const CHANGELOG_MIGRATION_PACKAGE_VERSION = 1 as const;

export const CHANGELOG_MIGRATION_LIMITS = Object.freeze({
  maxEntries: 10_000,
  maxCommentsPerEntry: 10_000,
  maxArrayItemsPerField: 10_000,
  maxStringBytes: 1_048_576,
  maxProjectedChangeLogBytes: 33_554_432,
  maxFullRegistryBytes: 67_108_864,
  maxExportBytes: 134_217_728,
});

const USER_FINGERPRINT_DOMAIN =
  "chronicle-quality-hub-changelog-migration/v1/authenticated-owner";
const SOURCE_FINGERPRINT_SCOPE =
  "git-tracked-and-untracked-nonignored-file-bytes-v1";
const encoder = new TextEncoder();
const severityValues = new Set<string>(CHANGE_LOG_SEVERITY);
const statusValues = new Set<string>(CHANGE_LOG_STATUS);
const sourceValues = new Set<ChangelogMigrationSource>([
  "owner-db",
  "local-storage",
  "repository-seed",
]);

export type ChangelogMigrationSource =
  | "owner-db"
  | "local-storage"
  | "repository-seed";

export type ChangelogMigrationErrorCode =
  | "INSECURE_CONTEXT"
  | "CRYPTO_UNAVAILABLE"
  | "INVALID_INPUT"
  | "LIMIT_EXCEEDED"
  | "OWNER_IDENTITY_CHANGED"
  | "OWNER_UPDATED_AT_CHANGED"
  | "OWNER_REGISTRY_CHANGED"
  | "LOCAL_STORAGE_CHANGED"
  | "SENSITIVE_VALUE_FOUND";

export class ChangelogMigrationError extends Error {
  readonly code: ChangelogMigrationErrorCode;

  constructor(code: ChangelogMigrationErrorCode, message: string) {
    super(message);
    this.name = "ChangelogMigrationError";
    this.code = code;
  }
}

export interface MigrationCryptoRuntime {
  isSecureContext: boolean;
  subtle?: Pick<SubtleCrypto, "digest">;
  getRandomValues?: (target: Uint8Array) => Uint8Array;
}

export interface AuthenticatedOwnerSnapshot {
  authenticatedUserId: string;
  authenticatedUserEmail: string | null;
  databaseUpdatedAt: string;
  readAt: string;
  registry: unknown;
}

export type LocalStorageMigrationSnapshot =
  | { presence: "captured"; capturedAt: string; registry: unknown }
  | { presence: "absent"; capturedAt: string; registry: null };

export interface ApplicationBuildIdentity {
  applicationVersion: string;
  sourceRevision: string;
  sourceFingerprint: string;
}

export interface CapturedChangelogVariant {
  presence: "captured";
  source: ChangelogMigrationSource;
  capturedAt: string;
  registryVersion: number | null;
  fullRegistryHash: string;
  changeLogHash: string;
  changeLogCount: number;
  changeLog: ChangeLogEntry[];
}

export interface AbsentChangelogVariant {
  presence: "absent";
  source: "local-storage";
  capturedAt: string;
  registryVersion: null;
  fullRegistryHash: null;
  changeLogHash: null;
  changeLogCount: 0;
  changeLog: [];
}

export interface ChangelogMigrationEnvelopeV1 {
  packageType: typeof CHANGELOG_MIGRATION_PACKAGE_TYPE;
  packageVersion: typeof CHANGELOG_MIGRATION_PACKAGE_VERSION;
  captureId: string;
  capturedAt: string;
  qualityHub: {
    contractVersion: typeof QUALITY_HUB_VERSION;
    repositorySeedRegistryVersion: number | null;
    applicationVersion: string;
    sourceRevision: string;
    sourceFingerprintAlgorithm: "SHA-256";
    sourceFingerprintScope: typeof SOURCE_FINGERPRINT_SCOPE;
    sourceFingerprint: string;
  };
  authenticatedOwner: {
    fingerprintAlgorithm: "SHA-256";
    fingerprintDomain: typeof USER_FINGERPRINT_DOMAIN;
    fingerprintSalt: string;
    userFingerprint: string;
    initialDatabaseUpdatedAt: string;
    finalDatabaseUpdatedAt: string;
    initialFullRegistryHash: string;
    finalFullRegistryHash: string;
    initialChangeLogHash: string;
    finalChangeLogHash: string;
  };
  sources: {
    ownerDb: CapturedChangelogVariant;
    localStorage: CapturedChangelogVariant | AbsentChangelogVariant;
    repositorySeed: CapturedChangelogVariant;
  };
}

export interface CreateChangelogMigrationExportInput {
  authenticatedOwnerInitial: AuthenticatedOwnerSnapshot;
  authenticatedOwnerFinal: AuthenticatedOwnerSnapshot;
  localStorageInitial: LocalStorageMigrationSnapshot;
  localStorageFinal: LocalStorageMigrationSnapshot;
  repositorySeedRegistry: unknown;
  capturedAt: string;
  applicationBuild: ApplicationBuildIdentity;
}

export interface SerializedChangelogMigrationExport {
  envelope: ChangelogMigrationEnvelopeV1;
  json: string;
  bytes: Uint8Array;
  sha256: string;
  filename: string;
  checksumFilename: string;
  checksumText: string;
}

function invalid(message: string): never {
  throw new ChangelogMigrationError("INVALID_INPUT", message);
}

function limitExceeded(message: string): never {
  throw new ChangelogMigrationError("LIMIT_EXCEEDED", message);
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function assertPlainRecord(value: unknown, path: string): Record<string, unknown> {
  if (!isPlainRecord(value)) invalid(`${path} must be a plain object.`);
  if (Object.getOwnPropertySymbols(value).length > 0) {
    invalid(`${path} contains unsupported symbol keys.`);
  }
  return value;
}

function assertExactKeys(
  record: Record<string, unknown>,
  required: readonly string[],
  optional: readonly string[],
  path: string,
): void {
  const allowed = new Set([...required, ...optional]);
  for (const key of Object.keys(record)) {
    if (!allowed.has(key)) invalid(`${path} contains unknown field ${key}.`);
  }
  for (const key of required) {
    if (!Object.prototype.hasOwnProperty.call(record, key)) {
      invalid(`${path} is missing required field ${key}.`);
    }
  }
}

function utf8Length(value: string): number {
  return encoder.encode(value).byteLength;
}

function readString(value: unknown, path: string, allowEmpty = true): string {
  if (typeof value !== "string") invalid(`${path} must be a string.`);
  if (!allowEmpty && value.length === 0) invalid(`${path} must not be empty.`);
  if (utf8Length(value) > CHANGELOG_MIGRATION_LIMITS.maxStringBytes) {
    limitExceeded(`${path} exceeds the migration string-size limit.`);
  }
  return value;
}

function readStringArray(value: unknown, path: string): string[] {
  if (!Array.isArray(value)) invalid(`${path} must be an array.`);
  if (value.length > CHANGELOG_MIGRATION_LIMITS.maxArrayItemsPerField) {
    limitExceeded(`${path} exceeds the migration array-item limit.`);
  }
  const result: string[] = [];
  for (let index = 0; index < value.length; index += 1) {
    if (!(index in value)) invalid(`${path} must not contain sparse array slots.`);
    result.push(readString(value[index], `${path}[${index}]`));
  }
  return result;
}

const commentRequiredKeys = ["id", "author", "timestamp", "text"] as const;

function projectComment(value: unknown, path: string): ChangeLogEntry["comments"][number] {
  const record = assertPlainRecord(value, path);
  assertExactKeys(record, commentRequiredKeys, [], path);
  return {
    id: readString(record.id, `${path}.id`, false),
    author: readString(record.author, `${path}.author`),
    timestamp: readString(record.timestamp, `${path}.timestamp`, false),
    text: readString(record.text, `${path}.text`),
  };
}

const entryRequiredKeys = [
  "id",
  "title",
  "summary",
  "severity",
  "status",
  "problem",
  "plan",
  "changes",
  "filesAffected",
  "agent",
  "relatedFindingIds",
  "tags",
  "comments",
  "createdAt",
  "updatedAt",
] as const;
const entryOptionalKeys = ["relatedRunIds"] as const;

function projectChangeLogEntry(value: unknown, path: string): ChangeLogEntry {
  const record = assertPlainRecord(value, path);
  assertExactKeys(record, entryRequiredKeys, entryOptionalKeys, path);

  const severity = readString(record.severity, `${path}.severity`, false);
  if (!severityValues.has(severity)) invalid(`${path}.severity is not an allowed value.`);
  const status = readString(record.status, `${path}.status`, false);
  if (!statusValues.has(status)) invalid(`${path}.status is not an allowed value.`);

  if (!Array.isArray(record.comments)) invalid(`${path}.comments must be an array.`);
  if (record.comments.length > CHANGELOG_MIGRATION_LIMITS.maxCommentsPerEntry) {
    limitExceeded(`${path}.comments exceeds the migration comment limit.`);
  }
  const comments: ChangeLogEntry["comments"] = [];
  for (let index = 0; index < record.comments.length; index += 1) {
    if (!(index in record.comments)) {
      invalid(`${path}.comments must not contain sparse array slots.`);
    }
    comments.push(projectComment(record.comments[index], `${path}.comments[${index}]`));
  }

  const projected: ChangeLogEntry = {
    id: readString(record.id, `${path}.id`, false),
    title: readString(record.title, `${path}.title`),
    summary: readString(record.summary, `${path}.summary`),
    severity: severity as ChangeLogEntry["severity"],
    status: status as ChangeLogEntry["status"],
    problem: readString(record.problem, `${path}.problem`),
    plan: readString(record.plan, `${path}.plan`),
    changes: readString(record.changes, `${path}.changes`),
    filesAffected: readStringArray(record.filesAffected, `${path}.filesAffected`),
    agent: readString(record.agent, `${path}.agent`),
    relatedFindingIds: readStringArray(
      record.relatedFindingIds,
      `${path}.relatedFindingIds`,
    ),
    tags: readStringArray(record.tags, `${path}.tags`),
    comments,
    createdAt: readString(record.createdAt, `${path}.createdAt`, false),
    updatedAt: readString(record.updatedAt, `${path}.updatedAt`, false),
  };
  if (Object.prototype.hasOwnProperty.call(record, "relatedRunIds")) {
    projected.relatedRunIds = readStringArray(
      record.relatedRunIds,
      `${path}.relatedRunIds`,
    );
  }
  return projected;
}

export function projectQualityHubChangeLog(value: unknown): ChangeLogEntry[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) invalid("registry.changeLog must be an array.");
  if (value.length > CHANGELOG_MIGRATION_LIMITS.maxEntries) {
    limitExceeded("registry.changeLog exceeds the migration entry-count limit.");
  }
  const projected: ChangeLogEntry[] = [];
  for (let index = 0; index < value.length; index += 1) {
    if (!(index in value)) invalid("registry.changeLog must not contain sparse array slots.");
    projected.push(projectChangeLogEntry(value[index], `registry.changeLog[${index}]`));
  }
  return projected;
}

function canonicalize(value: unknown, path: string, ancestors: Set<object>): string {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) invalid(`${path} contains a non-finite number.`);
    return JSON.stringify(value);
  }
  if (typeof value !== "object") {
    invalid(`${path} contains a value that JSON cannot represent.`);
  }
  if (ancestors.has(value)) invalid(`${path} contains a circular reference.`);
  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      const parts: string[] = [];
      for (let index = 0; index < value.length; index += 1) {
        if (!(index in value)) invalid(`${path} contains a sparse array slot.`);
        parts.push(canonicalize(value[index], `${path}[${index}]`, ancestors));
      }
      return `[${parts.join(",")}]`;
    }
    const record = assertPlainRecord(value, path);
    const keys = Object.keys(record).sort();
    const parts = keys.map(
      (key) =>
        `${JSON.stringify(key)}:${canonicalize(record[key], `${path}.${key}`, ancestors)}`,
    );
    return `{${parts.join(",")}}`;
  } finally {
    ancestors.delete(value);
  }
}

export function canonicalJsonStringify(value: unknown): string {
  return canonicalize(value, "$", new Set<object>());
}

export function assertBoundedJsonGraph(value: unknown, maxEstimatedBytes: number): void {
  if (!Number.isSafeInteger(maxEstimatedBytes) || maxEstimatedBytes < 1) {
    invalid("maxEstimatedBytes must be a positive safe integer.");
  }
  const ancestors = new Set<object>();
  let estimatedBytes = 0;
  let visitedNodes = 0;
  const maxNodes = Math.min(maxEstimatedBytes, 2_000_000);

  const visit = (current: unknown, path: string): void => {
    visitedNodes += 1;
    if (visitedNodes > maxNodes) limitExceeded(`${path} exceeds the migration node limit.`);
    if (current === null || typeof current === "boolean") {
      estimatedBytes += 5;
    } else if (typeof current === "number") {
      if (!Number.isFinite(current)) invalid(`${path} contains a non-finite number.`);
      estimatedBytes += 32;
    } else if (typeof current === "string") {
      estimatedBytes += utf8Length(current) + 2;
    } else if (typeof current === "object") {
      if (ancestors.has(current)) invalid(`${path} contains a circular reference.`);
      ancestors.add(current);
      try {
        if (Array.isArray(current)) {
          if (current.length > maxNodes) limitExceeded(`${path} exceeds the migration node limit.`);
          estimatedBytes += current.length + 2;
          for (let index = 0; index < current.length; index += 1) {
            if (!(index in current)) invalid(`${path} contains a sparse array slot.`);
            visit(current[index], `${path}[${index}]`);
          }
        } else {
          const record = assertPlainRecord(current, path);
          const keys = Object.keys(record);
          if (keys.length > maxNodes) limitExceeded(`${path} exceeds the migration node limit.`);
          estimatedBytes += keys.length + 2;
          for (const key of keys) {
            estimatedBytes += utf8Length(key) + 3;
            visit(record[key], `${path}.${key}`);
          }
        }
      } finally {
        ancestors.delete(current);
      }
    } else {
      invalid(`${path} contains a value that JSON cannot represent.`);
    }
    if (estimatedBytes > maxEstimatedBytes) {
      limitExceeded(`${path} exceeds the migration size limit.`);
    }
  };

  visit(value, "$.");
}

function assertCryptoRuntime(runtime: MigrationCryptoRuntime): Required<MigrationCryptoRuntime> {
  if (runtime.isSecureContext !== true) {
    throw new ChangelogMigrationError(
      "INSECURE_CONTEXT",
      "A secure browser context is required for migration capture.",
    );
  }
  if (!runtime.subtle || typeof runtime.subtle.digest !== "function") {
    throw new ChangelogMigrationError(
      "CRYPTO_UNAVAILABLE",
      "Web Crypto SubtleCrypto is unavailable; migration capture is blocked.",
    );
  }
  if (typeof runtime.getRandomValues !== "function") {
    throw new ChangelogMigrationError(
      "CRYPTO_UNAVAILABLE",
      "Web Crypto secure randomness is unavailable; migration capture is blocked.",
    );
  }
  return runtime as Required<MigrationCryptoRuntime>;
}

export function getBrowserMigrationCryptoRuntime(): MigrationCryptoRuntime {
  const browserCrypto = globalThis.crypto;
  return {
    isSecureContext: globalThis.isSecureContext === true,
    subtle: browserCrypto?.subtle,
    getRandomValues:
      browserCrypto && typeof browserCrypto.getRandomValues === "function"
        ? (target) => browserCrypto.getRandomValues(target)
        : undefined,
  };
}

function toBytes(value: string | Uint8Array): Uint8Array {
  return typeof value === "string" ? encoder.encode(value) : value;
}

export async function sha256Hex(
  value: string | Uint8Array,
  runtime: MigrationCryptoRuntime = getBrowserMigrationCryptoRuntime(),
): Promise<string> {
  const secureRuntime = assertCryptoRuntime(runtime);
  const bytes = toBytes(value);
  const digest = await secureRuntime.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function secureRandomHex(length: number, runtime: MigrationCryptoRuntime): string {
  const secureRuntime = assertCryptoRuntime(runtime);
  const bytes = new Uint8Array(length);
  secureRuntime.getRandomValues(bytes);
  return bytesToHex(bytes);
}

function readRegistryVersion(registry: Record<string, unknown>): number | null {
  const meta = assertPlainRecord(registry.meta, "registry.meta");
  const value = meta.registryVersion;
  if (value === undefined) return null;
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    invalid("registry.meta.registryVersion must be a non-negative safe integer when present.");
  }
  return value as number;
}

function assertIsoTimestamp(value: string, path: string): void {
  if (!value || Number.isNaN(Date.parse(value))) invalid(`${path} must be a valid timestamp.`);
}

function assertSafeBuildIdentity(value: ApplicationBuildIdentity): ApplicationBuildIdentity {
  const applicationVersion = readString(
    value.applicationVersion,
    "applicationBuild.applicationVersion",
    false,
  );
  if (applicationVersion.length > 128 || !/^[A-Za-z0-9][A-Za-z0-9._+-]*$/.test(applicationVersion)) {
    invalid("applicationBuild.applicationVersion is not a safe version label.");
  }
  const sourceRevision = readString(
    value.sourceRevision,
    "applicationBuild.sourceRevision",
    false,
  );
  if (sourceRevision !== "unavailable" && !/^[a-f0-9]{40}$/.test(sourceRevision)) {
    invalid("applicationBuild.sourceRevision must be a full Git revision or unavailable.");
  }
  const sourceFingerprint = readString(
    value.sourceFingerprint,
    "applicationBuild.sourceFingerprint",
    false,
  );
  if (sourceFingerprint !== "unavailable" && !/^[a-f0-9]{64}$/.test(sourceFingerprint)) {
    invalid("applicationBuild.sourceFingerprint must be a SHA-256 hash or unavailable.");
  }
  return { applicationVersion, sourceRevision, sourceFingerprint };
}

export async function analyzeQualityHubRegistrySource(
  registryValue: unknown,
  source: ChangelogMigrationSource,
  capturedAt: string,
  runtime: MigrationCryptoRuntime = getBrowserMigrationCryptoRuntime(),
): Promise<CapturedChangelogVariant> {
  assertCryptoRuntime(runtime);
  assertIsoTimestamp(capturedAt, "capturedAt");
  if (!sourceValues.has(source)) invalid("source is not an allowed migration source label.");
  const registry = assertPlainRecord(registryValue, "registry");
  const changeLog = projectQualityHubChangeLog(registry.changeLog);
  assertBoundedJsonGraph(registry, CHANGELOG_MIGRATION_LIMITS.maxFullRegistryBytes);
  const fullRegistryJson = canonicalJsonStringify(registry);
  const fullRegistryBytes = encoder.encode(fullRegistryJson);
  if (fullRegistryBytes.byteLength > CHANGELOG_MIGRATION_LIMITS.maxFullRegistryBytes) {
    limitExceeded("The full Quality Hub registry exceeds the migration size limit.");
  }
  const changeLogJson = canonicalJsonStringify(changeLog);
  const changeLogBytes = encoder.encode(changeLogJson);
  if (changeLogBytes.byteLength > CHANGELOG_MIGRATION_LIMITS.maxProjectedChangeLogBytes) {
    limitExceeded("The projected Quality Hub Changelog exceeds the migration size limit.");
  }
  const [fullRegistryHash, changeLogHash] = await Promise.all([
    sha256Hex(fullRegistryBytes, runtime),
    sha256Hex(changeLogBytes, runtime),
  ]);
  return {
    presence: "captured",
    source,
    capturedAt,
    registryVersion: readRegistryVersion(registry),
    fullRegistryHash,
    changeLogHash,
    changeLogCount: changeLog.length,
    changeLog,
  };
}

function absentLocalStorageVariant(capturedAt: string): AbsentChangelogVariant {
  return {
    presence: "absent",
    source: "local-storage",
    capturedAt,
    registryVersion: null,
    fullRegistryHash: null,
    changeLogHash: null,
    changeLogCount: 0,
    changeLog: [],
  };
}

function validateAuthenticatedOwnerSnapshot(
  snapshot: AuthenticatedOwnerSnapshot,
  path: string,
): void {
  readString(snapshot.authenticatedUserId, `${path}.authenticatedUserId`, false);
  if (snapshot.authenticatedUserEmail !== null) {
    readString(snapshot.authenticatedUserEmail, `${path}.authenticatedUserEmail`, false);
  }
  readString(snapshot.databaseUpdatedAt, `${path}.databaseUpdatedAt`, false);
  assertIsoTimestamp(snapshot.databaseUpdatedAt, `${path}.databaseUpdatedAt`);
  readString(snapshot.readAt, `${path}.readAt`, false);
  assertIsoTimestamp(snapshot.readAt, `${path}.readAt`);
}

function assertLocalStorageSnapshot(
  snapshot: LocalStorageMigrationSnapshot,
  path: string,
): void {
  if (snapshot.presence !== "captured" && snapshot.presence !== "absent") {
    invalid(`${path}.presence is not allowed.`);
  }
  assertIsoTimestamp(readString(snapshot.capturedAt, `${path}.capturedAt`, false), `${path}.capturedAt`);
  if (snapshot.presence === "absent" && snapshot.registry !== null) {
    invalid(`${path}.registry must be null when local storage is absent.`);
  }
}

function stringsIn(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(stringsIn);
  if (!isPlainRecord(value)) return [];
  return Object.values(value).flatMap(stringsIn);
}

function assertNoSensitiveChangelogValues(
  variants: readonly CapturedChangelogVariant[],
  ownerIds: readonly string[],
  ownerEmails: readonly string[],
): void {
  const normalizedEmails = ownerEmails.map((value) => value.toLowerCase());
  const emailPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
  for (const variant of variants) {
    for (const value of stringsIn(variant.changeLog)) {
      const lower = value.toLowerCase();
      if (
        ownerIds.some((ownerId) => value.includes(ownerId)) ||
        normalizedEmails.some((email) => lower.includes(email)) ||
        emailPattern.test(value)
      ) {
        throw new ChangelogMigrationError(
          "SENSITIVE_VALUE_FOUND",
          `The ${variant.source} Changelog contains an owner identifier or email address; export was cancelled.`,
        );
      }
    }
  }
}

export async function createChangelogMigrationExport(
  input: CreateChangelogMigrationExportInput,
  runtime: MigrationCryptoRuntime = getBrowserMigrationCryptoRuntime(),
): Promise<SerializedChangelogMigrationExport> {
  assertCryptoRuntime(runtime);
  assertIsoTimestamp(input.capturedAt, "capturedAt");
  validateAuthenticatedOwnerSnapshot(input.authenticatedOwnerInitial, "authenticatedOwnerInitial");
  validateAuthenticatedOwnerSnapshot(input.authenticatedOwnerFinal, "authenticatedOwnerFinal");
  assertLocalStorageSnapshot(input.localStorageInitial, "localStorageInitial");
  assertLocalStorageSnapshot(input.localStorageFinal, "localStorageFinal");
  if (
    input.authenticatedOwnerInitial.authenticatedUserId !==
    input.authenticatedOwnerFinal.authenticatedUserId
  ) {
    throw new ChangelogMigrationError(
      "OWNER_IDENTITY_CHANGED",
      "The authenticated owner changed during capture; export was cancelled.",
    );
  }
  if (
    input.authenticatedOwnerInitial.databaseUpdatedAt !==
    input.authenticatedOwnerFinal.databaseUpdatedAt
  ) {
    throw new ChangelogMigrationError(
      "OWNER_UPDATED_AT_CHANGED",
      "The owner database row changed during capture; export was cancelled.",
    );
  }

  if (input.localStorageInitial.presence !== input.localStorageFinal.presence) {
    throw new ChangelogMigrationError(
      "LOCAL_STORAGE_CHANGED",
      "The local Quality Hub history changed during capture; export was cancelled.",
    );
  }

  const [ownerInitial, ownerFinal, localStorageInitial, localStorageFinal, repositorySeed] = await Promise.all([
    analyzeQualityHubRegistrySource(
      input.authenticatedOwnerInitial.registry,
      "owner-db",
      input.authenticatedOwnerInitial.readAt,
      runtime,
    ),
    analyzeQualityHubRegistrySource(
      input.authenticatedOwnerFinal.registry,
      "owner-db",
      input.authenticatedOwnerFinal.readAt,
      runtime,
    ),
    input.localStorageInitial.presence === "absent"
      ? Promise.resolve(absentLocalStorageVariant(input.localStorageInitial.capturedAt))
      : analyzeQualityHubRegistrySource(
          input.localStorageInitial.registry,
          "local-storage",
          input.localStorageInitial.capturedAt,
          runtime,
        ),
    input.localStorageFinal.presence === "absent"
      ? Promise.resolve(absentLocalStorageVariant(input.localStorageFinal.capturedAt))
      : analyzeQualityHubRegistrySource(
          input.localStorageFinal.registry,
          "local-storage",
          input.localStorageFinal.capturedAt,
          runtime,
        ),
    analyzeQualityHubRegistrySource(
      input.repositorySeedRegistry,
      "repository-seed",
      input.capturedAt,
      runtime,
    ),
  ]);

  if (ownerInitial.fullRegistryHash !== ownerFinal.fullRegistryHash) {
    throw new ChangelogMigrationError(
      "OWNER_REGISTRY_CHANGED",
      "The owner database registry changed during capture; export was cancelled.",
    );
  }

  if (
    localStorageInitial.presence !== localStorageFinal.presence ||
    localStorageInitial.fullRegistryHash !== localStorageFinal.fullRegistryHash ||
    localStorageInitial.changeLogHash !== localStorageFinal.changeLogHash
  ) {
    throw new ChangelogMigrationError(
      "LOCAL_STORAGE_CHANGED",
      "The local Quality Hub history changed during capture; export was cancelled.",
    );
  }

  assertNoSensitiveChangelogValues(
    [ownerInitial, ownerFinal, repositorySeed].concat(
      localStorageInitial.presence === "captured" ? [localStorageInitial] : [],
    ),
    [
      input.authenticatedOwnerInitial.authenticatedUserId,
      input.authenticatedOwnerFinal.authenticatedUserId,
    ],
    [
      input.authenticatedOwnerInitial.authenticatedUserEmail,
      input.authenticatedOwnerFinal.authenticatedUserEmail,
    ].filter((value): value is string => value !== null),
  );

  const applicationBuild = assertSafeBuildIdentity(input.applicationBuild);
  const captureId = `qhcm-${secureRandomHex(16, runtime)}`;
  const fingerprintSalt = secureRandomHex(32, runtime);
  const userFingerprint = await sha256Hex(
    `${USER_FINGERPRINT_DOMAIN}\u0000${fingerprintSalt}\u0000${input.authenticatedOwnerInitial.authenticatedUserId}`,
    runtime,
  );

  const envelope: ChangelogMigrationEnvelopeV1 = {
    packageType: CHANGELOG_MIGRATION_PACKAGE_TYPE,
    packageVersion: CHANGELOG_MIGRATION_PACKAGE_VERSION,
    captureId,
    capturedAt: input.capturedAt,
    qualityHub: {
      contractVersion: QUALITY_HUB_VERSION,
      repositorySeedRegistryVersion: repositorySeed.registryVersion,
      applicationVersion: applicationBuild.applicationVersion,
      sourceRevision: applicationBuild.sourceRevision,
      sourceFingerprintAlgorithm: "SHA-256",
      sourceFingerprintScope: SOURCE_FINGERPRINT_SCOPE,
      sourceFingerprint: applicationBuild.sourceFingerprint,
    },
    authenticatedOwner: {
      fingerprintAlgorithm: "SHA-256",
      fingerprintDomain: USER_FINGERPRINT_DOMAIN,
      fingerprintSalt,
      userFingerprint,
      initialDatabaseUpdatedAt: input.authenticatedOwnerInitial.databaseUpdatedAt,
      finalDatabaseUpdatedAt: input.authenticatedOwnerFinal.databaseUpdatedAt,
      initialFullRegistryHash: ownerInitial.fullRegistryHash,
      finalFullRegistryHash: ownerFinal.fullRegistryHash,
      initialChangeLogHash: ownerInitial.changeLogHash,
      finalChangeLogHash: ownerFinal.changeLogHash,
    },
    sources: {
      ownerDb: ownerFinal,
      localStorage: localStorageInitial,
      repositorySeed,
    },
  };

  const json = canonicalJsonStringify(envelope);
  const bytes = encoder.encode(json);
  if (bytes.byteLength > CHANGELOG_MIGRATION_LIMITS.maxExportBytes) {
    limitExceeded("The complete migration export exceeds the migration size limit.");
  }
  const sha256 = await sha256Hex(bytes, runtime);
  const timestampForFilename = input.capturedAt.replace(/[^0-9]/g, "").slice(0, 17);
  const filename = `${CHANGELOG_MIGRATION_PACKAGE_TYPE}-v1-${timestampForFilename}-${captureId}.json`;
  const checksumFilename = `${filename}.sha256`;
  const checksumText = `${sha256}  ${filename}\n`;
  return { envelope, json, bytes, sha256, filename, checksumFilename, checksumText };
}

export type { QualityHubRegistry };
