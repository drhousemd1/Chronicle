import { execFileSync } from "node:child_process";
import { constants as fsConstants, type Stats } from "node:fs";
import {
  chmod,
  lstat,
  mkdir,
  open,
  readdir,
  realpath,
  rename,
  rmdir,
  rm,
  stat,
  link,
  unlink,
} from "node:fs/promises";
import { createHash, randomBytes as secureRandomBytes } from "node:crypto";
import os from "node:os";
import path from "node:path";

import {
  KNOWLEDGE_CERTIFICATION_LEASE_ID_PATTERN,
  KNOWLEDGE_CONTROL_LIMITS,
  KNOWLEDGE_CONTROL_NAMES,
  KNOWLEDGE_CONTROL_STORE_VERSION,
  KNOWLEDGE_TRANSACTION_ID_PATTERN as SHARED_KNOWLEDGE_TRANSACTION_ID_PATTERN,
  assertKnowledgeCertificationLeaseMetadata,
  assertKnowledgeControlCommand,
  assertKnowledgeScopedWriterMetadata,
  assertKnowledgeUnfinishedMarker,
  assertKnowledgeWriterLockMetadata,
  canonicalKnowledgeControlJson,
  knowledgeControlHostFingerprint,
  knowledgeControlMetadataWithHash,
  parseKnowledgeCertificationLeaseTransitionName,
  parseKnowledgePendingFileName,
  parseKnowledgeScopedWriterDirectoryName,
  parseKnowledgeScopedWriterTransitionName,
  parseKnowledgeTransactionStagingName,
  parseKnowledgeWriterLockRecoveryName,
  parseKnowledgeWriterLockStagingName,
  knowledgeScopedWriterDirectoryName,
  knowledgeScopedWriterTransitionName,
} from "../knowledge-record-control-contract.mjs";

import {
  deriveKnowledgeTransactionProtection,
  knowledgeProtectionMatchesScopes,
  knowledgeProtectionScopesOverlap,
  parseKnowledgeProtectionScope,
  serializeKnowledgeProtectionScope,
  type KnowledgeProtectionScope,
} from "./protection-model";

import {
  generateTransactionId,
  normalizeStrictRelativePath,
  parseTransactionId,
} from "./path-safety";

export const KNOWLEDGE_TRANSACTION_ID_PATTERN =
  SHARED_KNOWLEDGE_TRANSACTION_ID_PATTERN;
export const MAX_TRANSACTION_OPERATIONS = 5_000;
export const MAX_TRANSACTION_PAYLOAD_BYTES = 16 * 1024 * 1024;
export const MAX_TRANSACTION_TOTAL_BYTES = 256 * 1024 * 1024;
export const MAX_TRANSACTION_SNAPSHOT_ENTRIES = 25_000;

const STORE_VERSION = KNOWLEDGE_CONTROL_STORE_VERSION;
const TRANSACTION_ROOT_NAME = KNOWLEDGE_CONTROL_NAMES.transactionRoot;
const LOCK_DIRECTORY_NAME = KNOWLEDGE_CONTROL_NAMES.writerLock;
const LOCK_METADATA_NAME = KNOWLEDGE_CONTROL_NAMES.writerLockMetadata;
const SCOPED_WRITER_ROOT_NAME = KNOWLEDGE_CONTROL_NAMES.scopedWriterRoot;
const SCOPED_WRITER_METADATA_NAME = KNOWLEDGE_CONTROL_NAMES.scopedWriterMetadata;
const CERTIFICATION_LEASE_ROOT_NAME =
  KNOWLEDGE_CONTROL_NAMES.certificationLeaseRoot;
const CERTIFICATION_LEASE_METADATA_NAME =
  KNOWLEDGE_CONTROL_NAMES.certificationLeaseMetadata;
const MANIFEST_NAME = KNOWLEDGE_CONTROL_NAMES.manifest;
const PAYLOAD_DIRECTORY_NAME = KNOWLEDGE_CONTROL_NAMES.payloadDirectory;
const JOURNAL_NAME = KNOWLEDGE_CONTROL_NAMES.journal;
const UNFINISHED_MARKER_NAME = KNOWLEDGE_CONTROL_NAMES.unfinishedMarker;
const TERMINAL_RECEIPT_DIRECTORY_NAME =
  KNOWLEDGE_CONTROL_NAMES.terminalReceiptDirectory;
const MAX_MANIFEST_BYTES = KNOWLEDGE_CONTROL_LIMITS.manifestBytes;
const MAX_JOURNAL_BYTES = KNOWLEDGE_CONTROL_LIMITS.journalBytes;
const MAX_SAFE_PATH_BYTES = 1_024;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const LOCK_ID_PATTERN = KNOWLEDGE_CERTIFICATION_LEASE_ID_PATTERN;
const CERTIFICATION_LEASE_ID_PATTERN =
  KNOWLEDGE_CERTIFICATION_LEASE_ID_PATTERN;
const JOURNAL_EVENTS = new Set([
  "apply-started",
  "mutation-intent",
  "mutation-completed",
  "rollback-started",
  "rollback-intent",
  "rollback-completed",
  "recovery-started",
  "recovery-completed",
  "apply-completed",
  "artifact-ownership-recorded",
]);

const CANONICAL_ARTIFACT_ROLES = new Set([
  "after-stage",
  "before-stage",
  "before-anchor",
  "after-anchor",
  "capture",
]);
const CANONICAL_ARTIFACT_KINDS = new Set([
  "after-partial",
  "after-stage",
  "before-partial",
  "before-stage",
  "before-anchor",
  "after-anchor",
  "capture",
]);
const UNSIGNED_DECIMAL_PATTERN = /^(?:0|[1-9][0-9]{0,39})$/;

export type KnowledgeTransactionKind =
  | "project-create"
  | "project-update"
  | "issue-create"
  | "issue-update"
  | "accepted-update"
  | "legacy-import"
  | "correction"
  | "closeout";

export type KnowledgeTransactionSnapshotEntry =
  | {
      path: string;
      state: "present";
      sha256: string;
      mode: number;
    }
  | {
      path: string;
      state: "absent";
    };

export type KnowledgeTransactionSnapshot = {
  validationAsOf: string;
  requestSha256: string;
  packageSha256: string | null;
  sources: KnowledgeTransactionSnapshotEntry[];
};

export type KnowledgeTransactionOperationInput =
  | {
      action: "create";
      path: string;
      afterBytes: Buffer;
    }
  | {
      action: "update";
      path: string;
      beforeBytes: Buffer;
      afterBytes: Buffer;
    }
  | {
      action: "remove";
      path: string;
      beforeBytes: Buffer;
    }
  | {
      action: "move";
      sourcePath: string;
      destinationPath: string;
      beforeBytes: Buffer;
      afterBytes: Buffer;
    };

export type KnowledgeArtifactOwnershipJournalEventInput = Readonly<{
  event: "artifact-ownership-recorded";
  operationIndex: number;
  canonicalSourcePath: string;
  artifactRole:
    | "after-stage"
    | "before-stage"
    | "before-anchor"
    | "after-anchor"
    | "capture";
  artifactKind:
    | "after-partial"
    | "after-stage"
    | "before-partial"
    | "before-stage"
    | "before-anchor"
    | "after-anchor"
    | "capture";
  artifactSourcePath: string;
  identityDev: string;
  identityIno: string;
  identityUid: string;
  identityBirthtimeNs: string | null;
  byteLength: string;
  sha256: string;
  mode: number;
}>;

export type KnowledgeTransactionJournalEventInput =
  | {
      event:
        | "apply-started"
        | "mutation-intent"
        | "mutation-completed"
        | "rollback-started"
        | "rollback-intent"
        | "rollback-completed"
        | "recovery-started"
        | "recovery-completed"
        | "apply-completed";
      operationIndex?: number;
      reasonCode?: string;
    }
  | KnowledgeArtifactOwnershipJournalEventInput;

export type TransactionStoreDependencies = {
  now?: () => Date;
  randomBytes?: (size: number) => Buffer;
  hostname?: () => string;
  pid?: number;
  isPidAlive?: (pid: number) => boolean;
  isProcessGroupAlive?: (processGroupId: number) => boolean;
  afterStoreMutation?: (event: TransactionStoreMutationEvent) => void | Promise<void>;
};

export type TransactionStoreMutationEvent = Readonly<{
  kind:
    | "directory-created"
    | "directory-publication-ready"
    | "directory-renamed-unsynced"
    | "directory-published"
    | "directory-quarantine-ready"
    | "directory-quarantined"
    | "directory-removal-started"
    | "directory-unlink-ready"
    | "directory-unlinked-unsynced"
    | "directory-removed"
    | "temporary-file-synced"
    | "file-published-unsynced"
    | "file-published"
    | "file-removal-ready"
    | "file-unlinked-unsynced"
    | "temporary-file-removed"
    | "file-removed"
    | "journal-appended"
    | "journal-truncated";
  scope:
    | "writer-lock"
    | "scoped-writer"
    | "transaction-prepare"
    | "transaction-control"
    | "certification-lease"
    | "journal";
  artifact: string;
}>;

export type KnowledgeTransactionPaths = {
  repositoryRoot: string;
  gitDirectory: string;
  transactionRoot: string;
  lockDirectory: string;
};

export type KnowledgeCertificationLease = Readonly<{
  repositoryRoot: string;
  transactionRoot: string;
  leaseDirectory: string;
  leaseId: string;
  command: string;
}>;

export type KnowledgeTransactionLock = {
  readonly repositoryRoot: string;
  readonly gitDirectory: string;
  readonly transactionRoot: string;
  readonly lockDirectory: string;
  readonly lockId: string;
  readonly command: string;
  readonly transactionId: string | null;
  readonly recoveryCapable: boolean;
};

export type KnowledgeScopedWriterLock = Readonly<{
  repositoryRoot: string;
  gitDirectory: string;
  transactionRoot: string;
  scopedRoot: string;
  lockDirectory: string;
  lockId: string;
  command: string;
  transactionId: string;
  scopes: readonly KnowledgeProtectionScope[];
}>;

type StoredPayload = {
  artifact: string;
  sha256: string;
  bytes: number;
};

type StoredOperation = {
  index: number;
  action: KnowledgeTransactionOperationInput["action"];
  path?: string;
  sourcePath?: string;
  destinationPath?: string;
  expectedSourceSha256?: string;
  expectedDestinationState?: "absent";
  before?: StoredPayload;
  after?: StoredPayload;
};

type StoredManifestBase = {
  storeVersion: number;
  transactionId: string;
  kind: KnowledgeTransactionKind;
  command: string;
  createdAt: string;
  operationCount: number;
  totalPayloadBytes: number;
  snapshot: KnowledgeTransactionSnapshot;
  snapshotSha256: string;
  operations: StoredOperation[];
};

type StoredManifest = StoredManifestBase & {
  metadataSha256: string;
};

export type VerifiedKnowledgeTransactionOperation = StoredOperation & {
  beforeBytes?: Buffer;
  afterBytes?: Buffer;
};

export type VerifiedKnowledgeTransaction = {
  transactionId: string;
  kind: KnowledgeTransactionKind;
  command: string;
  createdAt: string;
  operationCount: number;
  totalPayloadBytes: number;
  snapshot: KnowledgeTransactionSnapshot;
  snapshotSha256: string;
  metadataSha256: string;
  operations: VerifiedKnowledgeTransactionOperation[];
  transactionDirectory: string;
};

type StoredJournalEventBase = {
  storeVersion: number;
  transactionId: string;
  sequence: number;
  timestamp: string;
  event: KnowledgeTransactionJournalEventInput["event"];
  operationIndex?: number;
  reasonCode?: string;
  canonicalSourcePath?: string;
  artifactRole?: KnowledgeArtifactOwnershipJournalEventInput["artifactRole"];
  artifactKind?: KnowledgeArtifactOwnershipJournalEventInput["artifactKind"];
  artifactSourcePath?: string;
  identityDev?: string;
  identityIno?: string;
  identityUid?: string;
  identityBirthtimeNs?: string | null;
  byteLength?: string;
  sha256?: string;
  mode?: number;
};

export type StoredJournalEvent = StoredJournalEventBase & {
  metadataSha256: string;
};

export type KnowledgeTransactionJournal = {
  events: StoredJournalEvent[];
  tornFinalLine: boolean;
};

export type KnowledgeTransactionStatus = {
  transactionId: string;
  kind: KnowledgeTransactionKind;
  createdAt: string;
  operationCount: number;
  totalPayloadBytes: number;
  unfinished: boolean;
  terminalOutcome: "applied" | "recovered" | null;
  journalEventCount: number;
  tornFinalJournalLine: boolean;
};

type ActiveLockRecord = {
  lockId: string;
  lockDirectory: string;
  transactionRoot: string;
  recoveryCapable: boolean;
  pid: number;
  hostname: string;
  dependencies: Required<TransactionStoreDependencies>;
};

type StoredScopedWriter = {
  storeVersion: number;
  lockId: string;
  pid: number;
  hostname: string;
  startedAt: string;
  command: string;
  transactionId: string;
  scopes: readonly string[];
  metadataSha256: string;
};

type ActiveCertificationLeaseRecord = {
  leaseId: string;
  leaseDirectory: string;
  leaseRoot: string;
  repositoryRoot: string;
  command: string;
};

type StoredCertificationLease = {
  storeVersion: number;
  leaseId: string;
  pid: number;
  hostname: string;
  startedAt: string;
  command: string;
  protectedChildPid: number | null;
  protectedProcessGroupId: number | null;
  metadataSha256: string;
};

type StoreArtifactOwner = Readonly<{
  lockId: string;
  pid: number;
  hostname: string;
}>;

const activeLocks = new WeakMap<object, ActiveLockRecord>();
const activeScopedWriters = new WeakMap<
  object,
  Readonly<{
    lockId: string;
    lockDirectory: string;
    scopedRoot: string;
    repositoryRoot: string;
    transactionRoot: string;
    pid: number;
    hostname: string;
    transactionId: string;
    scopes: readonly KnowledgeProtectionScope[];
    dependencies: Required<TransactionStoreDependencies>;
  }>
>();
const activeCertificationLeases = new WeakMap<object, ActiveCertificationLeaseRecord>();

class InjectedStoreInterruptionError extends Error {
  readonly cause: unknown;

  constructor(cause: unknown) {
    super("Injected transaction-store interruption.");
    this.name = "InjectedStoreInterruptionError";
    this.cause = cause;
  }
}

class StoreArtifactIdentityChangedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StoreArtifactIdentityChangedError";
  }
}

type StoreFilesystemIdentity = Readonly<{
  dev: number;
  ino: number;
  mode: number;
  size: number;
  nlink: number;
  uid: number;
  kind: "file" | "directory";
}>;

type PrivateFileSnapshot = Readonly<{
  bytes: Buffer;
  identity: StoreFilesystemIdentity;
}>;

type ExpectedPublishedDirectory = Readonly<{
  relativePath: string;
  identity: StoreFilesystemIdentity;
}>;

function filesystemIdentity(
  info: Stats,
  expectedKind: StoreFilesystemIdentity["kind"],
  label: string,
): StoreFilesystemIdentity {
  const kind = info.isFile() ? "file" : info.isDirectory() ? "directory" : null;
  if (kind !== expectedKind) {
    throw new StoreArtifactIdentityChangedError(
      `${label} is no longer the expected ${expectedKind}.`,
    );
  }
  return Object.freeze({
    dev: info.dev,
    ino: info.ino,
    mode: info.mode,
    size: info.size,
    nlink: info.nlink,
    uid: info.uid,
    kind,
  });
}

function sameFilesystemIdentity(
  actual: StoreFilesystemIdentity,
  expected: StoreFilesystemIdentity,
  options: { ignoreLinkCount?: boolean; ignoreSize?: boolean } = {},
): boolean {
  return (
    actual.dev === expected.dev &&
    actual.ino === expected.ino &&
    actual.mode === expected.mode &&
    (options.ignoreSize || actual.size === expected.size) &&
    (options.ignoreLinkCount || actual.nlink === expected.nlink) &&
    actual.uid === expected.uid &&
    actual.kind === expected.kind
  );
}

function assertFilesystemIdentity(
  actual: StoreFilesystemIdentity,
  expected: StoreFilesystemIdentity,
  label: string,
  options: { ignoreLinkCount?: boolean; ignoreSize?: boolean } = {},
): void {
  if (!sameFilesystemIdentity(actual, expected, options)) {
    throw new StoreArtifactIdentityChangedError(`${label} identity changed.`);
  }
}

function isStoreArtifactIdentityChanged(error: unknown): boolean {
  return error instanceof StoreArtifactIdentityChangedError;
}

function sha256(bytes: Buffer | string): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function canonicalJson(value: unknown): string {
  return canonicalKnowledgeControlJson(value);
}

function metadataWithHash<T extends Record<string, unknown>>(
  value: T,
): T & { metadataSha256: string } {
  return { ...knowledgeControlMetadataWithHash(value) };
}

function assertMetadataHash(
  value: Record<string, unknown>,
  label: string,
): void {
  const storedHash = value.metadataSha256;
  if (typeof storedHash !== "string" || !SHA256_PATTERN.test(storedHash)) {
    throw new Error(`${label} has no valid metadata hash.`);
  }
  const { metadataSha256: _omitted, ...base } = value;
  const actualHash = sha256(canonicalJson(base));
  if (actualHash !== storedHash) {
    throw new Error(`${label} metadata hash does not match its contents.`);
  }
}

function assertExactKeys(
  value: Record<string, unknown>,
  expectedKeys: readonly string[],
  label: string,
): void {
  const actual = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  if (
    actual.length !== expected.length ||
    actual.some((key, index) => key !== expected[index])
  ) {
    throw new Error(`${label} contains unsupported fields.`);
  }
}

function assertIsoTimestamp(value: unknown, label: string): asserts value is string {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) ||
    Number.isNaN(Date.parse(value))
  ) {
    throw new Error(`${label} must be a valid UTC timestamp.`);
  }
}

function assertSafeCommand(command: string): void {
  assertKnowledgeControlCommand(command);
}

function assertTransactionId(transactionId: string): void {
  parseTransactionId(transactionId);
}

function assertSafeRelativePath(relativePath: string, label = "path"): void {
  if (Buffer.byteLength(relativePath, "utf8") > MAX_SAFE_PATH_BYTES) {
    throw new Error(`Transaction ${label} must be a normalized repository-relative path.`);
  }
  try {
    if (normalizeStrictRelativePath(relativePath) !== relativePath) throw new Error();
  } catch {
    throw new Error(`Transaction ${label} must be a normalized repository-relative path.`);
  }
}

function assertSha256(value: string, label: string): void {
  if (!SHA256_PATTERN.test(value)) {
    throw new Error(`${label} must be a lowercase SHA-256 hash.`);
  }
}

function assertOwnerOnlyMode(mode: number, expected: number, label: string): void {
  if ((mode & 0o777) !== expected) {
    throw new Error(`${label} must use mode ${expected.toString(8)}.`);
  }
}

function hostFingerprint(hostname: string): string {
  return knowledgeControlHostFingerprint(hostname);
}

function artifactOwnerToken(owner: StoreArtifactOwner): string {
  if (!LOCK_ID_PATTERN.test(owner.lockId)) {
    throw new Error("Store artifact owner has an invalid lock identifier.");
  }
  if (!Number.isSafeInteger(owner.pid) || owner.pid <= 0) {
    throw new Error("Store artifact owner has an invalid PID.");
  }
  let hostnameHash: string;
  try {
    hostnameHash = hostFingerprint(owner.hostname);
  } catch {
    throw new Error("Store artifact owner has an invalid hostname.");
  }
  return `${owner.lockId}-${owner.pid}-${hostnameHash}`;
}

function assertRecoverableOwner(
  owner: Readonly<{ pid: number; hostnameHash: string }>,
  dependencies: Required<TransactionStoreDependencies>,
  label: string,
): void {
  if (owner.hostnameHash !== hostFingerprint(dependencies.hostname())) {
    throw new Error(`${label} belongs to another or unknown host.`);
  }
  if (dependencies.isPidAlive(owner.pid)) {
    throw new Error(`${label} still belongs to a live process.`);
  }
}

async function notifyStoreMutation(
  dependencies: Required<TransactionStoreDependencies>,
  event: TransactionStoreMutationEvent,
): Promise<void> {
  try {
    await dependencies.afterStoreMutation(event);
  } catch (error) {
    throw new InjectedStoreInterruptionError(error);
  }
}

function isInjectedStoreInterruption(error: unknown): boolean {
  return error instanceof InjectedStoreInterruptionError;
}

async function assertRealDirectory(
  directoryPath: string,
  label: string,
  expectedMode?: number,
): Promise<string> {
  const info = await lstat(directoryPath);
  if (info.isSymbolicLink() || !info.isDirectory()) {
    throw new Error(`${label} must be an ordinary directory, not a symbolic link.`);
  }
  const canonicalPath = await realpath(directoryPath);
  if (canonicalPath !== path.resolve(directoryPath)) {
    throw new Error(`${label} must not contain symbolic-link path components.`);
  }
  if (expectedMode !== undefined) {
    assertOwnerOnlyMode(info.mode, expectedMode, label);
  }
  return canonicalPath;
}

async function fsyncDirectory(directoryPath: string): Promise<void> {
  const handle = await open(directoryPath, fsConstants.O_RDONLY);
  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function createPrivateDirectory(
  directoryPath: string,
  dependencies: Required<TransactionStoreDependencies>,
  scope: TransactionStoreMutationEvent["scope"],
  artifact: string,
): Promise<StoreFilesystemIdentity> {
  await mkdir(directoryPath, { mode: 0o700 });
  const createdIdentity = filesystemIdentity(
    await lstat(directoryPath),
    "directory",
    `Store directory ${artifact}`,
  );
  await chmod(directoryPath, 0o700);
  await assertRealDirectory(directoryPath, directoryPath, 0o700);
  const securedIdentity = filesystemIdentity(
    await lstat(directoryPath),
    "directory",
    `Store directory ${artifact}`,
  );
  assertFilesystemIdentity(
    securedIdentity,
    { ...createdIdentity, mode: securedIdentity.mode },
    `Store directory ${artifact}`,
    { ignoreLinkCount: true, ignoreSize: true },
  );
  await fsyncDirectory(path.dirname(directoryPath));
  // Once mkdir succeeds, a later failure deliberately leaves the private
  // directory in place. Its owner-bearing caller artifact is recoverable;
  // recursively erasing it here would make a mid-cleanup death ambiguous.
  await notifyStoreMutation(dependencies, {
    kind: "directory-created",
    scope,
    artifact,
  });
  const finalIdentity = filesystemIdentity(
    await lstat(directoryPath),
    "directory",
    `Store directory ${artifact}`,
  );
  assertFilesystemIdentity(
    finalIdentity,
    securedIdentity,
    `Store directory ${artifact}`,
    { ignoreLinkCount: true, ignoreSize: true },
  );
  return securedIdentity;
}

function privatePendingFileName(
  fileName: string,
  owner: StoreArtifactOwner,
  mode: "create" | "replace" = "create",
): string {
  const encodedName = Buffer.from(fileName, "utf8").toString("base64url");
  return `.pending-${mode}-${encodedName}-${artifactOwnerToken(owner)}.tmp`;
}

function parsePrivatePendingFileName(fileName: string): Readonly<{
  finalName: string;
  mode: "create" | "replace";
  owner: Readonly<{ lockId: string; pid: number; hostnameHash: string }>;
}> | null {
  try {
    return parseKnowledgePendingFileName(fileName);
  } catch {
    throw new Error("Store pending publication has malformed target metadata.");
  }
}

async function writePrivateFileAtomicExclusive({
  filePath,
  bytes,
  owner,
  dependencies,
  scope,
}: {
  filePath: string;
  bytes: Buffer | string;
  owner: StoreArtifactOwner;
  dependencies: Required<TransactionStoreDependencies>;
  scope: TransactionStoreMutationEvent["scope"];
}): Promise<void> {
  const parentDirectory = path.dirname(filePath);
  const finalName = path.basename(filePath);
  const temporaryName = privatePendingFileName(finalName, owner, "create");
  const temporaryPath = path.join(parentDirectory, temporaryName);
  const handle = await open(
    temporaryPath,
    fsConstants.O_CREAT |
      fsConstants.O_EXCL |
      fsConstants.O_WRONLY |
      fsConstants.O_NOFOLLOW,
    0o600,
  );
  let closed = false;
  let stagedIdentity: StoreFilesystemIdentity | null = null;
  const expectedBytes = Buffer.isBuffer(bytes) ? Buffer.from(bytes) : Buffer.from(bytes);
  try {
    await handle.writeFile(expectedBytes);
    await handle.sync();
    await handle.chmod(0o600);
    await handle.sync();
    stagedIdentity = filesystemIdentity(
      await handle.stat(),
      "file",
      `Store pending file ${temporaryName}`,
    );
    assertOwnerOnlyMode(stagedIdentity.mode, 0o600, `Store pending file ${temporaryName}`);
    if (stagedIdentity.size !== expectedBytes.byteLength || stagedIdentity.nlink !== 1) {
      throw new StoreArtifactIdentityChangedError(
        `Store pending file ${temporaryName} identity changed.`,
      );
    }
    await handle.close();
    closed = true;
    await fsyncDirectory(parentDirectory);
    await notifyStoreMutation(dependencies, {
      kind: "temporary-file-synced",
      scope,
      artifact: finalName,
    });
    const stagedAfterHook = await readPrivateFileSnapshot(
      temporaryPath,
      `Store pending file ${temporaryName}`,
      expectedBytes.byteLength,
    );
    assertFilesystemIdentity(
      stagedAfterHook.identity,
      stagedIdentity,
      `Store pending file ${temporaryName}`,
    );
    if (!stagedAfterHook.bytes.equals(expectedBytes)) {
      throw new StoreArtifactIdentityChangedError(
        `Store pending file ${temporaryName} contents changed.`,
      );
    }
    await link(temporaryPath, filePath);
    const published = await readPrivateFileSnapshot(
      filePath,
      `Published store file ${finalName}`,
      expectedBytes.byteLength,
    );
    assertFilesystemIdentity(
      published.identity,
      stagedIdentity,
      `Published store file ${finalName}`,
      { ignoreLinkCount: true },
    );
    if (!published.bytes.equals(expectedBytes)) {
      throw new StoreArtifactIdentityChangedError(
        `Published store file ${finalName} contents changed.`,
      );
    }
    await notifyStoreMutation(dependencies, {
      kind: "file-published-unsynced",
      scope,
      artifact: finalName,
    });
    await fsyncDirectory(parentDirectory);
    await notifyStoreMutation(dependencies, {
      kind: "file-published",
      scope,
      artifact: finalName,
    });
    const removedStagingFile = await unlinkPrivateFileIfOwned(
      temporaryPath,
      stagedIdentity,
      {
        ignoreLinkCount: true,
      },
    );
    if (!removedStagingFile) {
      throw new StoreArtifactIdentityChangedError(
        `Store pending file ${temporaryName} identity changed.`,
      );
    }
    await fsyncDirectory(parentDirectory);
    await notifyStoreMutation(dependencies, {
      kind: "temporary-file-removed",
      scope,
      artifact: finalName,
    });
  } catch (error) {
    if (!closed) await handle.close().catch(() => undefined);
    if (!isInjectedStoreInterruption(error) && stagedIdentity) {
      await unlinkPrivateFileIfOwned(temporaryPath, stagedIdentity).catch(
        () => undefined,
      );
      await fsyncDirectory(parentDirectory).catch(() => undefined);
    }
    throw error;
  }
}

async function writePrivateFileAtomicReplace({
  filePath,
  bytes,
  expectedDestination,
  owner,
  dependencies,
  scope,
}: {
  filePath: string;
  bytes: Buffer | string;
  expectedDestination: PrivateFileSnapshot;
  owner: StoreArtifactOwner;
  dependencies: Required<TransactionStoreDependencies>;
  scope: TransactionStoreMutationEvent["scope"];
}): Promise<void> {
  const parentDirectory = path.dirname(filePath);
  const finalName = path.basename(filePath);
  const temporaryName = privatePendingFileName(finalName, owner, "replace");
  const temporaryPath = path.join(parentDirectory, temporaryName);
  const handle = await open(
    temporaryPath,
    fsConstants.O_CREAT |
      fsConstants.O_EXCL |
      fsConstants.O_WRONLY |
      fsConstants.O_NOFOLLOW,
    0o600,
  );
  let closed = false;
  let stagedIdentity: StoreFilesystemIdentity | null = null;
  const expectedBytes = Buffer.isBuffer(bytes) ? Buffer.from(bytes) : Buffer.from(bytes);
  try {
    await handle.writeFile(expectedBytes);
    await handle.sync();
    await handle.chmod(0o600);
    await handle.sync();
    stagedIdentity = filesystemIdentity(
      await handle.stat(),
      "file",
      `Store pending file ${temporaryName}`,
    );
    assertOwnerOnlyMode(stagedIdentity.mode, 0o600, `Store pending file ${temporaryName}`);
    if (stagedIdentity.size !== expectedBytes.byteLength || stagedIdentity.nlink !== 1) {
      throw new StoreArtifactIdentityChangedError(
        `Store pending file ${temporaryName} identity changed.`,
      );
    }
    await handle.close();
    closed = true;
    await fsyncDirectory(parentDirectory);
    await notifyStoreMutation(dependencies, {
      kind: "temporary-file-synced",
      scope,
      artifact: finalName,
    });
    const stagedAfterHook = await readPrivateFileSnapshot(
      temporaryPath,
      `Store pending file ${temporaryName}`,
      expectedBytes.byteLength,
    );
    assertFilesystemIdentity(
      stagedAfterHook.identity,
      stagedIdentity,
      `Store pending file ${temporaryName}`,
    );
    if (!stagedAfterHook.bytes.equals(expectedBytes)) {
      throw new StoreArtifactIdentityChangedError(
        `Store pending file ${temporaryName} contents changed.`,
      );
    }
    const destinationBeforeRename = await readPrivateFileSnapshot(
      filePath,
      `Store replacement destination ${finalName}`,
      expectedDestination.bytes.byteLength,
    );
    assertFilesystemIdentity(
      destinationBeforeRename.identity,
      expectedDestination.identity,
      `Store replacement destination ${finalName}`,
    );
    if (!destinationBeforeRename.bytes.equals(expectedDestination.bytes)) {
      throw new StoreArtifactIdentityChangedError(
        `Store replacement destination ${finalName} contents changed.`,
      );
    }
    // Node/macOS does not expose a descriptor-relative compare-and-swap rename.
    // The exact destination and staged identities are rechecked immediately
    // above; a malicious same-user swap in the syscall-sized gap remains an
    // operating-system/API limitation.
    await rename(temporaryPath, filePath);
    const published = await readPrivateFileSnapshot(
      filePath,
      `Published store file ${finalName}`,
      expectedBytes.byteLength,
    );
    assertFilesystemIdentity(
      published.identity,
      stagedIdentity,
      `Published store file ${finalName}`,
    );
    if (!published.bytes.equals(expectedBytes)) {
      throw new StoreArtifactIdentityChangedError(
        `Published store file ${finalName} contents changed.`,
      );
    }
    await notifyStoreMutation(dependencies, {
      kind: "file-published-unsynced",
      scope,
      artifact: finalName,
    });
    await fsyncDirectory(parentDirectory);
    await notifyStoreMutation(dependencies, {
      kind: "file-published",
      scope,
      artifact: finalName,
    });
  } catch (error) {
    if (!closed) await handle.close().catch(() => undefined);
    if (!isInjectedStoreInterruption(error) && stagedIdentity) {
      await unlinkPrivateFileIfOwned(temporaryPath, stagedIdentity).catch(
        () => undefined,
      );
      await fsyncDirectory(parentDirectory).catch(() => undefined);
    }
    throw error;
  }
}

async function unlinkPrivateFileIfOwned(
  filePath: string,
  expectedIdentity: StoreFilesystemIdentity,
  options: { ignoreLinkCount?: boolean } = {},
): Promise<boolean> {
  const currentInfo = await lstat(filePath).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (!currentInfo) return false;
  const currentIdentity = filesystemIdentity(
    currentInfo,
    "file",
    `Store pending file ${path.basename(filePath)}`,
  );
  if (!sameFilesystemIdentity(currentIdentity, expectedIdentity, options)) return false;
  // Node/macOS has no unlinkat equivalent that conditions unlinking on an
  // already-open descriptor. This final identity check prevents deterministic
  // replacement cleanup; a same-user swap in the syscall-sized gap is the same
  // irreducible platform limit documented for publication.
  await unlink(filePath);
  return true;
}

async function readPrivateFileSnapshot(
  filePath: string,
  label: string,
  maximumBytes: number,
): Promise<PrivateFileSnapshot> {
  const handle = await open(
    filePath,
    fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW,
  );
  try {
    const beforeIdentity = filesystemIdentity(await handle.stat(), "file", label);
    assertOwnerOnlyMode(beforeIdentity.mode, 0o600, label);
    if (beforeIdentity.size > maximumBytes) {
      throw new Error(`${label} exceeds its maximum allowed size.`);
    }
    const bytes = await handle.readFile();
    const afterIdentity = filesystemIdentity(await handle.stat(), "file", label);
    assertFilesystemIdentity(afterIdentity, beforeIdentity, label);
    if (bytes.byteLength !== beforeIdentity.size) {
      throw new StoreArtifactIdentityChangedError(`${label} contents changed while read.`);
    }
    return Object.freeze({ bytes, identity: beforeIdentity });
  } finally {
    await handle.close();
  }
}

async function readPrivateFile(
  filePath: string,
  label: string,
  maximumBytes: number,
): Promise<Buffer> {
  return (await readPrivateFileSnapshot(filePath, label, maximumBytes)).bytes;
}

async function publishPrivateDirectory({
  stagingDirectory,
  finalDirectory,
  parentDirectory,
  dependencies,
  scope,
  artifact,
  expectedDirectories,
}: {
  stagingDirectory: string;
  finalDirectory: string;
  parentDirectory: string;
  dependencies: Required<TransactionStoreDependencies>;
  scope: TransactionStoreMutationEvent["scope"];
  artifact: string;
  expectedDirectories: readonly ExpectedPublishedDirectory[];
}): Promise<void> {
  await fsyncDirectory(stagingDirectory);
  const expectedRoot = expectedDirectories.find(
    (directory) => directory.relativePath === "",
  );
  if (!expectedRoot) {
    throw new Error(`Store staging artifact has no retained identity: ${artifact}`);
  }
  const assertExpectedDirectories = async (baseDirectory: string) => {
    for (const expected of expectedDirectories) {
      const directoryPath = expected.relativePath
        ? path.join(baseDirectory, expected.relativePath)
        : baseDirectory;
      const actual = filesystemIdentity(
        await lstat(directoryPath),
        "directory",
        `Store staging directory ${expected.relativePath || artifact}`,
      );
      assertFilesystemIdentity(
        actual,
        expected.identity,
        `Store staging directory ${expected.relativePath || artifact}`,
        { ignoreLinkCount: true, ignoreSize: true },
      );
    }
  };
  await assertExpectedDirectories(stagingDirectory);
  const assertFinalAbsent = async () => {
    const existing = await lstat(finalDirectory).catch(
      (error: NodeJS.ErrnoException) => {
        if (error.code === "ENOENT") return null;
        throw error;
      },
    );
    if (!existing) return;
    const conflict = new Error(`Store artifact already exists: ${artifact}`) as NodeJS.ErrnoException;
    conflict.code = "EEXIST";
    throw conflict;
  };
  await assertFinalAbsent();
  await notifyStoreMutation(dependencies, {
    kind: "directory-publication-ready",
    scope,
    artifact,
  });
  // Node on macOS does not expose renameatx_np(RENAME_EXCL). Rechecking at the
  // deterministic hook boundary closes normal editor/test races. A malicious
  // same-user process could still create the target in the syscall-sized gap.
  await assertExpectedDirectories(stagingDirectory);
  await assertFinalAbsent();
  try {
    await rename(stagingDirectory, finalDirectory);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOTEMPTY") {
      const normalized = new Error(`Store artifact already exists: ${artifact}`) as NodeJS.ErrnoException;
      normalized.code = "EEXIST";
      throw normalized;
    }
    throw error;
  }
  await notifyStoreMutation(dependencies, {
    kind: "directory-renamed-unsynced",
    scope,
    artifact,
  });
  await fsyncDirectory(parentDirectory);
  await assertExpectedDirectories(finalDirectory);
  await notifyStoreMutation(dependencies, {
    kind: "directory-published",
    scope,
    artifact,
  });
}

function assertPrivateRecoveryFileMode(mode: number, label: string): void {
  const permissions = mode & 0o777;
  if ((permissions & 0o077) !== 0 || (permissions & 0o100) !== 0) {
    throw new Error(`${label} is not an owner-only recovery file.`);
  }
}

function isAllowedRecoveryEntry({
  scope,
  relativePath,
  isDirectory,
}: {
  scope: TransactionStoreMutationEvent["scope"];
  relativePath: string;
  isDirectory: boolean;
}): boolean {
  const segments = relativePath.split("/");
  const name = segments.at(-1)!;
  const parent = segments.slice(0, -1).join("/");
  if (scope === "writer-lock") {
    if (isDirectory) return false;
    if (relativePath === LOCK_METADATA_NAME) return true;
    const pending = parsePrivatePendingFileName(name);
    return parent === "" && pending?.finalName === LOCK_METADATA_NAME;
  }
  if (scope === "certification-lease") {
    if (isDirectory) return false;
    if (relativePath === CERTIFICATION_LEASE_METADATA_NAME) return true;
    const pending = parsePrivatePendingFileName(name);
    return parent === "" && pending?.finalName === CERTIFICATION_LEASE_METADATA_NAME;
  }
  if (scope === "scoped-writer") {
    if (isDirectory) return false;
    if (relativePath === SCOPED_WRITER_METADATA_NAME) return true;
    const pending = parsePrivatePendingFileName(name);
    return parent === "" && pending?.finalName === SCOPED_WRITER_METADATA_NAME;
  }
  if (scope === "transaction-prepare") {
    if (isDirectory) {
      return (
        relativePath === PAYLOAD_DIRECTORY_NAME ||
        relativePath === TERMINAL_RECEIPT_DIRECTORY_NAME
      );
    }
    if (
      parent === "" &&
      (name === MANIFEST_NAME || name === JOURNAL_NAME)
    ) {
      return true;
    }
    if (
      parent === PAYLOAD_DIRECTORY_NAME &&
      /^operation-\d{4}\.(before|after)\.bin$/.test(name)
    ) {
      return true;
    }
    const pending = parsePrivatePendingFileName(name);
    if (!pending) return false;
    return (
      (parent === "" &&
        (pending.finalName === MANIFEST_NAME || pending.finalName === JOURNAL_NAME)) ||
      (parent === PAYLOAD_DIRECTORY_NAME &&
        /^operation-\d{4}\.(before|after)\.bin$/.test(pending.finalName))
    );
  }
  return false;
}

async function removePrivateDirectoryTree({
  directoryPath,
  rootDirectory,
  parentDirectory,
  dependencies,
  scope,
  artifact,
}: {
  directoryPath: string;
  rootDirectory: string;
  parentDirectory: string;
  dependencies: Required<TransactionStoreDependencies>;
  scope: TransactionStoreMutationEvent["scope"];
  artifact: string;
}): Promise<void> {
  for (let removalPass = 0; removalPass < 16; removalPass += 1) {
    const entries = (await readdir(directoryPath, { withFileTypes: true })).sort(
      (left, right) => left.name.localeCompare(right.name),
    );
    for (const entry of entries) {
      const entryPath = path.join(directoryPath, entry.name);
      const relativePath = path.relative(rootDirectory, entryPath).split(path.sep).join("/");
      const info = await lstat(entryPath).catch((error: NodeJS.ErrnoException) => {
        if (error.code === "ENOENT") return null;
        throw error;
      });
      if (!info) continue;
      if (info.isSymbolicLink() || (!info.isDirectory() && !info.isFile())) {
        throw new Error(`Store recovery artifact contains an unsafe entry: ${relativePath}`);
      }
      if (
        !isAllowedRecoveryEntry({
          scope,
          relativePath,
          isDirectory: info.isDirectory(),
        })
      ) {
        throw new Error(`Store recovery artifact contains an unfamiliar entry: ${relativePath}`);
      }
      if (info.isDirectory()) {
        assertOwnerOnlyMode(info.mode, 0o700, `Store recovery directory ${relativePath}`);
        await removePrivateDirectoryTree({
          directoryPath: entryPath,
          rootDirectory,
          parentDirectory: directoryPath,
          dependencies,
          scope,
          artifact,
        });
        continue;
      }
      assertPrivateRecoveryFileMode(info.mode, `Store recovery file ${relativePath}`);
      await notifyStoreMutation(dependencies, {
        kind: "file-removal-ready",
        scope,
        artifact: `${artifact}/${relativePath}`,
      });
      const finalInfo = await lstat(entryPath).catch(
        (error: NodeJS.ErrnoException) => {
          if (error.code === "ENOENT") return null;
          throw error;
        },
      );
      if (!finalInfo) continue;
      if (
        finalInfo.dev !== info.dev ||
        finalInfo.ino !== info.ino ||
        finalInfo.isSymbolicLink() ||
        !finalInfo.isFile()
      ) {
        throw new Error(`Store recovery entry identity changed: ${relativePath}`);
      }
      await unlink(entryPath);
      await notifyStoreMutation(dependencies, {
        kind: "file-unlinked-unsynced",
        scope,
        artifact: `${artifact}/${relativePath}`,
      });
      await fsyncDirectory(directoryPath);
      await notifyStoreMutation(dependencies, {
        kind: "file-removed",
        scope,
        artifact: `${artifact}/${relativePath}`,
      });
    }
    await notifyStoreMutation(dependencies, {
      kind: "directory-unlink-ready",
      scope,
      artifact: path.relative(rootDirectory, directoryPath) || artifact,
    });
    if ((await readdir(directoryPath)).length !== 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, 1));
      continue;
    }
    try {
      await rmdir(directoryPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOTEMPTY") {
        await new Promise<void>((resolve) => setTimeout(resolve, 1));
        continue;
      }
      throw error;
    }
    await notifyStoreMutation(dependencies, {
      kind: "directory-unlinked-unsynced",
      scope,
      artifact: path.relative(rootDirectory, directoryPath) || artifact,
    });
    await fsyncDirectory(parentDirectory);
    await notifyStoreMutation(dependencies, {
      kind: "directory-removed",
      scope,
      artifact: path.relative(rootDirectory, directoryPath) || artifact,
    });
    return;
  }
  throw new Error("Store recovery directory kept changing during removal.");
}

async function removePrivateDirectory({
  directoryPath,
  parentDirectory,
  dependencies,
  scope,
  artifact,
}: {
  directoryPath: string;
  parentDirectory: string;
  dependencies: Required<TransactionStoreDependencies>;
  scope: TransactionStoreMutationEvent["scope"];
  artifact: string;
}): Promise<void> {
  await notifyStoreMutation(dependencies, {
    kind: "directory-removal-started",
    scope,
    artifact,
  });
  await assertRealDirectory(directoryPath, `Store recovery artifact ${artifact}`, 0o700);
  await removePrivateDirectoryTree({
    directoryPath,
    rootDirectory: directoryPath,
    parentDirectory,
    dependencies,
    scope,
    artifact,
  });
}

async function quarantinePrivateDirectory({
  directoryPath,
  quarantinePath,
  parentDirectory,
  dependencies,
  scope,
  artifact,
}: {
  directoryPath: string;
  quarantinePath: string;
  parentDirectory: string;
  dependencies: Required<TransactionStoreDependencies>;
  scope: TransactionStoreMutationEvent["scope"];
  artifact: string;
}): Promise<void> {
  const initial = await lstat(directoryPath);
  if (initial.isSymbolicLink() || !initial.isDirectory()) {
    throw new Error(`Store directory cannot be quarantined safely: ${artifact}`);
  }
  const assertQuarantineAbsent = async () => {
    const existing = await lstat(quarantinePath).catch(
      (error: NodeJS.ErrnoException) => {
        if (error.code === "ENOENT") return null;
        throw error;
      },
    );
    if (existing) {
      throw new Error(`Store recovery artifact already exists: ${path.basename(quarantinePath)}`);
    }
  };
  await assertQuarantineAbsent();
  await notifyStoreMutation(dependencies, {
    kind: "directory-quarantine-ready",
    scope,
    artifact: path.basename(quarantinePath),
  });
  await assertQuarantineAbsent();
  const final = await lstat(directoryPath);
  if (
    final.dev !== initial.dev ||
    final.ino !== initial.ino ||
    final.isSymbolicLink() ||
    !final.isDirectory()
  ) {
    throw new Error(`Store directory identity changed before quarantine: ${artifact}`);
  }
  // As with directory publication, Node/macOS has no descriptor-relative
  // conditional rename. The deterministic race is closed above; a malicious
  // same-user replacement in the syscall-sized gap remains an OS/API limit.
  await rename(directoryPath, quarantinePath);
  await notifyStoreMutation(dependencies, {
    kind: "directory-renamed-unsynced",
    scope,
    artifact: path.basename(quarantinePath),
  });
  await fsyncDirectory(parentDirectory);
  await notifyStoreMutation(dependencies, {
    kind: "directory-quarantined",
    scope,
    artifact: path.basename(quarantinePath),
  });
}

function defaultIsPidAlive(pid: number): boolean {
  if (!Number.isSafeInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    return code !== "ESRCH";
  }
}

function defaultIsProcessGroupAlive(processGroupId: number): boolean {
  if (!Number.isSafeInteger(processGroupId) || processGroupId <= 0) return false;
  try {
    process.kill(-processGroupId, 0);
    return true;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    return code !== "ESRCH";
  }
}

function resolvedDependencies(
  dependencies: TransactionStoreDependencies = {},
): Required<TransactionStoreDependencies> {
  return {
    now: dependencies.now ?? (() => new Date()),
    randomBytes: dependencies.randomBytes ?? secureRandomBytes,
    hostname: dependencies.hostname ?? os.hostname,
    pid: dependencies.pid ?? process.pid,
    isPidAlive: dependencies.isPidAlive ?? defaultIsPidAlive,
    isProcessGroupAlive:
      dependencies.isProcessGroupAlive ?? defaultIsProcessGroupAlive,
    afterStoreMutation: dependencies.afterStoreMutation ?? (() => undefined),
  };
}

async function gitDirectoryFor(repositoryRoot: string): Promise<string> {
  let result: string;
  try {
    result = execFileSync("git", ["rev-parse", "--absolute-git-dir"], {
      cwd: repositoryRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    throw new Error("Repository root is not inside a Git worktree.");
  }
  if (!path.isAbsolute(result)) {
    throw new Error("Git returned a non-absolute metadata directory.");
  }
  return assertRealDirectory(result, "Git metadata directory");
}

export async function resolveKnowledgeTransactionPaths(
  repoRoot: string,
  options: { createTransactionRoot?: boolean } = {},
): Promise<KnowledgeTransactionPaths> {
  const repositoryRoot = await assertRealDirectory(
    path.resolve(repoRoot),
    "Repository root",
  );
  const gitDirectory = await gitDirectoryFor(repositoryRoot);
  const transactionRoot = path.join(gitDirectory, TRANSACTION_ROOT_NAME);
  const existing = await lstat(transactionRoot).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (existing) {
    await assertRealDirectory(transactionRoot, "Knowledge transaction root", 0o700);
  } else if (options.createTransactionRoot) {
    try {
      await createPrivateDirectory(
        transactionRoot,
        resolvedDependencies(),
        "transaction-control",
        TRANSACTION_ROOT_NAME,
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      await assertRealDirectory(transactionRoot, "Knowledge transaction root", 0o700);
    }
  }
  return {
    repositoryRoot,
    gitDirectory,
    transactionRoot,
    lockDirectory: path.join(transactionRoot, LOCK_DIRECTORY_NAME),
  };
}

function assertSafeLockMetadata(value: unknown): asserts value is {
  storeVersion: number;
  lockId: string;
  pid: number;
  hostname: string;
  startedAt: string;
  command: string;
  transactionId: string | null;
  metadataSha256: string;
} {
  assertKnowledgeWriterLockMetadata(value);
}

async function readExistingLock(lockDirectory: string) {
  await assertRealDirectory(lockDirectory, "Knowledge transaction writer lock", 0o700);
  const inventory = (await readdir(lockDirectory)).sort();
  if (inventory.length !== 1 || inventory[0] !== LOCK_METADATA_NAME) {
    throw new Error("Knowledge transaction writer lock inventory is malformed.");
  }
  const bytes = await readPrivateFile(
    path.join(lockDirectory, LOCK_METADATA_NAME),
    "Knowledge transaction writer lock metadata",
    64 * 1024,
  );
  let parsed: unknown;
  try {
    parsed = JSON.parse(bytes.toString("utf8"));
  } catch {
    throw new Error("Knowledge transaction writer lock metadata is malformed.");
  }
  assertSafeLockMetadata(parsed);
  return parsed;
}

function writerLockStagingName(owner: StoreArtifactOwner): string {
  return `.preparing-writer-lock-${artifactOwnerToken(owner)}`;
}

function parseWriterLockStagingName(
  name: string,
): Readonly<{ lockId: string; pid: number; hostnameHash: string }> | null {
  return parseKnowledgeWriterLockStagingName(name);
}

function writerLockRecoveryName(
  phase: "reclaimed" | "removing",
  owner: StoreArtifactOwner,
): string {
  return `.${phase}-writer-lock-${artifactOwnerToken(owner)}`;
}

function parseWriterLockRecoveryName(name: string): Readonly<{
  phase: "reclaimed" | "removing";
  owner: Readonly<{ lockId: string; pid: number; hostnameHash: string }>;
}> | null {
  return parseKnowledgeWriterLockRecoveryName(name);
}

async function clearInterruptedWriterLockPublications(
  paths: KnowledgeTransactionPaths,
  recoveryCapable: boolean,
  dependencies: Required<TransactionStoreDependencies>,
): Promise<void> {
  const entries = await readdir(paths.transactionRoot, { withFileTypes: true });
  const candidates = entries
    .filter((entry) => entry.name.startsWith(".preparing-writer-lock-"))
    .sort((left, right) => left.name.localeCompare(right.name));
  for (const entry of candidates) {
    const owner = parseWriterLockStagingName(entry.name);
    if (!owner || !entry.isDirectory()) {
      throw new Error("Knowledge transaction root contains an unsafe writer-lock publication.");
    }
    assertRecoverableOwner(owner, dependencies, "Interrupted writer-lock publication");
    if (!recoveryCapable) {
      throw new Error("An interrupted writer-lock publication requires explicit recovery.");
    }
    const stagingDirectory = path.join(paths.transactionRoot, entry.name);
    await assertRealDirectory(
      stagingDirectory,
      "Interrupted writer-lock publication",
      0o700,
    );
    await removePrivateDirectory({
      directoryPath: stagingDirectory,
      parentDirectory: paths.transactionRoot,
      dependencies,
      scope: "writer-lock",
      artifact: entry.name,
    });
  }
}

function assertCertificationLeaseMetadata(
  value: unknown,
): asserts value is StoredCertificationLease {
  assertKnowledgeCertificationLeaseMetadata(value);
}

function certificationLeaseDirectoryName(leaseId: string): string {
  if (!CERTIFICATION_LEASE_ID_PATTERN.test(leaseId)) {
    throw new Error("Knowledge certification lease identifier is invalid.");
  }
  return `lease-${leaseId}`;
}

function certificationLeaseTransitionName(
  phase: "preparing" | "releasing",
  leaseId: string,
  owner: StoreArtifactOwner,
): string {
  return `.${phase}-certification-lease-${leaseId}-${artifactOwnerToken(owner)}`;
}

function parseCertificationLeaseTransitionName(name: string): Readonly<{
  phase: "preparing" | "releasing";
  leaseId: string;
  owner: Readonly<{ lockId: string; pid: number; hostnameHash: string }>;
}> | null {
  return parseKnowledgeCertificationLeaseTransitionName(name);
}

async function readCertificationLease(
  leaseDirectory: string,
): Promise<StoredCertificationLease> {
  return (await readCertificationLeaseWithSnapshot(leaseDirectory)).lease;
}

async function readCertificationLeaseWithSnapshot(
  leaseDirectory: string,
): Promise<Readonly<{
  lease: StoredCertificationLease;
  snapshot: PrivateFileSnapshot;
}>> {
  await assertRealDirectory(
    leaseDirectory,
    "Knowledge certification lease",
    0o700,
  );
  const inventory = (await readdir(leaseDirectory)).sort();
  if (
    inventory.length !== 1 ||
    inventory[0] !== CERTIFICATION_LEASE_METADATA_NAME
  ) {
    throw new Error("Knowledge certification lease inventory is malformed.");
  }
  const snapshot = await readPrivateFileSnapshot(
    path.join(leaseDirectory, CERTIFICATION_LEASE_METADATA_NAME),
    "Knowledge certification lease metadata",
    64 * 1024,
  );
  let parsed: unknown;
  try {
    parsed = JSON.parse(snapshot.bytes.toString("utf8"));
  } catch {
    throw new Error("Knowledge certification lease metadata is malformed.");
  }
  assertCertificationLeaseMetadata(parsed);
  return Object.freeze({ lease: parsed, snapshot });
}

function throwTransientCertificationLeaseChange(error: unknown): never {
  if ((error as NodeJS.ErrnoException)?.code === "ENOENT") {
    throw new Error(
      "Interrupted certification lease transition still belongs to a live process.",
    );
  }
  throw error;
}

async function inspectCertificationLeases({
  paths,
  recoveryCapable,
  allowLiveLeases,
  dependencies,
}: {
  paths: KnowledgeTransactionPaths;
  recoveryCapable: boolean;
  allowLiveLeases: boolean;
  dependencies: Required<TransactionStoreDependencies>;
}): Promise<void> {
  const leaseRoot = path.join(paths.transactionRoot, CERTIFICATION_LEASE_ROOT_NAME);
  const rootInfo = await lstat(leaseRoot).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (!rootInfo) return;
  await assertRealDirectory(leaseRoot, "Knowledge certification lease root", 0o700);
  const entries = (await readdir(leaseRoot, { withFileTypes: true })).sort((left, right) =>
    left.name.localeCompare(right.name),
  );
  for (const entry of entries) {
    const transition = parseCertificationLeaseTransitionName(entry.name);
    if (transition) {
      if (
        !entry.isDirectory() ||
        transition.owner.lockId !== transition.leaseId
      ) {
        throw new Error("Knowledge certification lease transition is unsafe.");
      }
      assertRecoverableOwner(
        transition.owner,
        dependencies,
        "Interrupted certification lease transition",
      );
      if (!recoveryCapable) {
        throw new Error("An interrupted certification lease transition requires explicit recovery.");
      }
      const transitionDirectory = path.join(leaseRoot, entry.name);
      await assertRealDirectory(
        transitionDirectory,
        "Interrupted certification lease transition",
        0o700,
      );
      await removePrivateDirectory({
        directoryPath: transitionDirectory,
        parentDirectory: leaseRoot,
        dependencies,
        scope: "certification-lease",
        artifact: entry.name,
      });
      continue;
    }
    const finalMatch = entry.name.match(/^lease-([a-f0-9]{32})$/);
    if (!finalMatch || !entry.isDirectory()) {
      throw new Error("Knowledge certification lease root contains an unsafe artifact.");
    }
    const leaseDirectory = path.join(leaseRoot, entry.name);
    try {
      await clearPendingPrivateFiles({
        directoryPath: leaseDirectory,
        recoveryCapable,
        dependencies,
      });
    } catch (error) {
      throwTransientCertificationLeaseChange(error);
    }
    const lease = await readCertificationLease(leaseDirectory).catch((error) => {
      if ((error as NodeJS.ErrnoException)?.code === "ENOENT") {
        throwTransientCertificationLeaseChange(error);
      }
      throw new Error(
        `Knowledge certification lease cannot be proven safe: ${(error as Error).message}`,
      );
    });
    if (lease.leaseId !== finalMatch[1]) {
      throw new Error("Knowledge certification lease identity does not match its directory.");
    }
    const sameHost = lease.hostname === dependencies.hostname();
    const ownerLive = sameHost && dependencies.isPidAlive(lease.pid);
    const protectedChildLive =
      sameHost &&
      lease.protectedChildPid !== null &&
      dependencies.isPidAlive(lease.protectedChildPid);
    const protectedProcessGroupLive =
      sameHost &&
      lease.protectedProcessGroupId !== null &&
      dependencies.isProcessGroupAlive(lease.protectedProcessGroupId);
    const live = ownerLive || protectedChildLive || protectedProcessGroupLive;
    if (sameHost && !live) {
      if (!recoveryCapable) {
        throw new Error("A dead certification lease requires explicit recovery.");
      }
      const owner = {
        lockId: lease.leaseId,
        pid: lease.pid,
        hostname: lease.hostname,
      } satisfies StoreArtifactOwner;
      const transitionName = certificationLeaseTransitionName(
        "releasing",
        lease.leaseId,
        owner,
      );
      const transitionDirectory = path.join(leaseRoot, transitionName);
      await quarantinePrivateDirectory({
        directoryPath: leaseDirectory,
        quarantinePath: transitionDirectory,
        parentDirectory: leaseRoot,
        dependencies,
        scope: "certification-lease",
        artifact: entry.name,
      });
      await removePrivateDirectory({
        directoryPath: transitionDirectory,
        parentDirectory: leaseRoot,
        dependencies,
        scope: "certification-lease",
        artifact: transitionName,
      });
      continue;
    }
    if (!allowLiveLeases) {
      throw new Error(
        sameHost
          ? "Knowledge transaction writes are blocked by a live certification lease."
          : "Knowledge transaction writes are blocked by a certification lease from another or unknown host.",
      );
    }
  }
}

async function ensureScopedWriterRoot(
  transactionRoot: string,
  dependencies: Required<TransactionStoreDependencies>,
) {
  const scopedRoot = path.join(transactionRoot, SCOPED_WRITER_ROOT_NAME);
  const existing = await lstat(scopedRoot).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (existing) {
    await assertRealDirectory(scopedRoot, "Knowledge scoped writer root", 0o700);
  } else {
    await createPrivateDirectory(
      scopedRoot,
      dependencies,
      "scoped-writer",
      SCOPED_WRITER_ROOT_NAME,
    );
  }
  return scopedRoot;
}

async function readScopedWriter(
  lockDirectory: string,
): Promise<StoredScopedWriter> {
  await assertRealDirectory(lockDirectory, "Knowledge scoped writer lock", 0o700);
  const inventory = (await readdir(lockDirectory)).sort();
  if (
    inventory.length !== 1 ||
    inventory[0] !== SCOPED_WRITER_METADATA_NAME
  ) {
    throw new Error("Knowledge scoped writer lock inventory is malformed.");
  }
  const bytes = await readPrivateFile(
    path.join(lockDirectory, SCOPED_WRITER_METADATA_NAME),
    "Knowledge scoped writer lock metadata",
    KNOWLEDGE_CONTROL_LIMITS.metadataBytes,
  );
  let parsed: unknown;
  try {
    parsed = JSON.parse(bytes.toString("utf8"));
  } catch {
    throw new Error("Knowledge scoped writer lock metadata is malformed.");
  }
  return assertKnowledgeScopedWriterMetadata(parsed) as StoredScopedWriter;
}

async function inspectScopedWriters({
  paths,
  recoveryCapable,
  allowLiveWriters,
  dependencies,
}: {
  paths: KnowledgeTransactionPaths;
  recoveryCapable: boolean;
  allowLiveWriters: boolean;
  dependencies: Required<TransactionStoreDependencies>;
}): Promise<StoredScopedWriter[]> {
  const scopedRoot = path.join(paths.transactionRoot, SCOPED_WRITER_ROOT_NAME);
  const rootInfo = await lstat(scopedRoot).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (!rootInfo) return [];
  await assertRealDirectory(scopedRoot, "Knowledge scoped writer root", 0o700);
  const live: StoredScopedWriter[] = [];
  const entries = (await readdir(scopedRoot, { withFileTypes: true })).sort(
    (left, right) => left.name.localeCompare(right.name),
  );
  for (const entry of entries) {
    const transition = parseKnowledgeScopedWriterTransitionName(entry.name);
    if (transition) {
      if (
        !entry.isDirectory() ||
        transition.owner.lockId !== transition.lockId
      ) {
        throw new Error("Knowledge scoped writer transition is unsafe.");
      }
      assertRecoverableOwner(
        transition.owner,
        dependencies,
        "Interrupted scoped writer transition",
      );
      if (!recoveryCapable) {
        throw new Error(
          "An interrupted scoped writer transition requires explicit recovery.",
        );
      }
      const transitionDirectory = path.join(scopedRoot, entry.name);
      await assertRealDirectory(
        transitionDirectory,
        "Interrupted scoped writer transition",
        0o700,
      );
      await removePrivateDirectory({
        directoryPath: transitionDirectory,
        parentDirectory: scopedRoot,
        dependencies,
        scope: "scoped-writer",
        artifact: entry.name,
      });
      continue;
    }

    const lockId = parseKnowledgeScopedWriterDirectoryName(entry.name);
    if (!lockId || !entry.isDirectory()) {
      throw new Error("Knowledge scoped writer root contains an unsafe artifact.");
    }
    const lockDirectory = path.join(scopedRoot, entry.name);
    const stored = await readScopedWriter(lockDirectory).catch((error) => {
      throw new Error(
        `Knowledge scoped writer cannot be proven safe: ${(error as Error).message}`,
      );
    });
    if (stored.lockId !== lockId) {
      throw new Error("Knowledge scoped writer identity does not match its directory.");
    }
    const scopes = stored.scopes.map(parseKnowledgeProtectionScope);
    if (
      scopes.map(serializeKnowledgeProtectionScope).join("\0") !==
      stored.scopes.join("\0")
    ) {
      throw new Error("Knowledge scoped writer contains an unsupported scope.");
    }
    const sameHost = stored.hostname === dependencies.hostname();
    const ownerLive = sameHost && dependencies.isPidAlive(stored.pid);
    if (sameHost && !ownerLive) {
      if (!recoveryCapable) {
        throw new Error("A dead scoped writer requires explicit recovery.");
      }
      const owner = {
        lockId: stored.lockId,
        pid: stored.pid,
        hostname: stored.hostname,
      } satisfies StoreArtifactOwner;
      const transitionName = knowledgeScopedWriterTransitionName(
        "reclaimed",
        stored.lockId,
        owner,
      );
      const transitionDirectory = path.join(scopedRoot, transitionName);
      await quarantinePrivateDirectory({
        directoryPath: lockDirectory,
        quarantinePath: transitionDirectory,
        parentDirectory: scopedRoot,
        dependencies,
        scope: "scoped-writer",
        artifact: entry.name,
      });
      await removePrivateDirectory({
        directoryPath: transitionDirectory,
        parentDirectory: scopedRoot,
        dependencies,
        scope: "scoped-writer",
        artifact: transitionName,
      });
      continue;
    }
    if (!allowLiveWriters) {
      throw new Error(
        sameHost
          ? "Knowledge transaction writes are blocked by a live scoped writer."
          : "Knowledge transaction writes are blocked by a scoped writer from another or unknown host.",
      );
    }
    live.push(stored);
  }
  return live;
}

async function createLockDirectory(
  paths: KnowledgeTransactionPaths,
  command: string,
  transactionId: string | null,
  recoveryCapable: boolean,
  dependencies: Required<TransactionStoreDependencies>,
): Promise<KnowledgeTransactionLock> {
  const lockId = dependencies.randomBytes(16).toString("hex");
  if (!LOCK_ID_PATTERN.test(lockId)) {
    throw new Error("Secure random source returned an invalid lock identifier.");
  }
  const hostname = dependencies.hostname();
  const owner = { lockId, pid: dependencies.pid, hostname } satisfies StoreArtifactOwner;
  const stagingName = writerLockStagingName(owner);
  const stagingDirectory = path.join(paths.transactionRoot, stagingName);
  let published = false;
  try {
    const stagingIdentity = await createPrivateDirectory(
      stagingDirectory,
      dependencies,
      "writer-lock",
      stagingName,
    );
    const metadata = metadataWithHash({
      storeVersion: STORE_VERSION,
      lockId,
      pid: dependencies.pid,
      hostname,
      startedAt: dependencies.now().toISOString(),
      command,
      transactionId,
    });
    await writePrivateFileAtomicExclusive({
      filePath: path.join(stagingDirectory, LOCK_METADATA_NAME),
      bytes: `${canonicalJson(metadata)}\n`,
      owner,
      dependencies,
      scope: "writer-lock",
    });
    await publishPrivateDirectory({
      stagingDirectory,
      finalDirectory: paths.lockDirectory,
      parentDirectory: paths.transactionRoot,
      dependencies,
      scope: "writer-lock",
      artifact: LOCK_DIRECTORY_NAME,
      expectedDirectories: [{ relativePath: "", identity: stagingIdentity }],
    });
    published = true;
  } catch (error) {
    if (
      !published &&
      !isInjectedStoreInterruption(error) &&
      !isStoreArtifactIdentityChanged(error)
    ) {
      await removePrivateDirectory({
        directoryPath: stagingDirectory,
        parentDirectory: paths.transactionRoot,
        dependencies,
        scope: "writer-lock",
        artifact: stagingName,
      }).catch((cleanupError: NodeJS.ErrnoException) => {
        if (cleanupError.code !== "ENOENT") throw cleanupError;
      });
    }
    throw error;
  }

  const lock: KnowledgeTransactionLock = Object.freeze({
    repositoryRoot: paths.repositoryRoot,
    gitDirectory: paths.gitDirectory,
    transactionRoot: paths.transactionRoot,
    lockDirectory: paths.lockDirectory,
    lockId,
    command,
    transactionId,
    recoveryCapable,
  });
  activeLocks.set(lock, {
    lockId,
    lockDirectory: paths.lockDirectory,
    transactionRoot: paths.transactionRoot,
    recoveryCapable,
    pid: dependencies.pid,
    hostname,
    dependencies,
  });
  return lock;
}

async function clearProvablyDeadReclaimedLocks(
  paths: KnowledgeTransactionPaths,
  recoveryCapable: boolean,
  dependencies: Required<TransactionStoreDependencies>,
): Promise<void> {
  const entries = await readdir(paths.transactionRoot, { withFileTypes: true });
  const recoveryEntries = entries
    .filter(
      (entry) =>
        entry.name.startsWith(".reclaimed-writer-lock-") ||
        entry.name.startsWith(".removing-writer-lock-"),
    )
    .sort((left, right) => left.name.localeCompare(right.name));
  if (recoveryEntries.length === 0) return;
  for (const entry of recoveryEntries) {
    const parsed = parseWriterLockRecoveryName(entry.name);
    if (!parsed || !entry.isDirectory()) {
      throw new Error("Knowledge transaction root contains an unsafe recovery artifact.");
    }
    assertRecoverableOwner(
      parsed.owner,
      dependencies,
      "Interrupted writer-lock recovery",
    );
    if (!recoveryCapable) {
      throw new Error("An interrupted writer-lock recovery requires explicit recovery.");
    }
    const quarantine = path.join(paths.transactionRoot, entry.name);
    await assertRealDirectory(
      quarantine,
      "Interrupted writer-lock recovery",
      0o700,
    );
    const inventory = await readdir(quarantine);
    if (inventory.length > 0) {
      const metadata = await readExistingLock(quarantine).catch((error) => {
        throw new Error(
          `Interrupted writer-lock recovery cannot be proven safe: ${(error as Error).message}`,
        );
      });
      if (
        metadata.lockId !== parsed.owner.lockId ||
        metadata.pid !== parsed.owner.pid ||
        hostFingerprint(metadata.hostname) !== parsed.owner.hostnameHash
      ) {
        throw new Error("Interrupted writer-lock recovery identity does not match its directory.");
      }
    }
    await removePrivateDirectory({
      directoryPath: quarantine,
      parentDirectory: paths.transactionRoot,
      dependencies,
      scope: "writer-lock",
      artifact: entry.name,
    });
  }
}

type AcquireKnowledgeTransactionLockInput = {
  repoRoot: string;
  command: string;
  transactionId?: string | null;
  recoveryCapable?: boolean;
  dependencies?: TransactionStoreDependencies;
};

async function assertRecognizedTransactionRootInventory(
  paths: KnowledgeTransactionPaths,
): Promise<void> {
  const entries = await readdir(paths.transactionRoot, { withFileTypes: true });
  for (const entry of entries) {
    const recognizedDirectory =
      entry.name === LOCK_DIRECTORY_NAME ||
      entry.name === CERTIFICATION_LEASE_ROOT_NAME ||
      entry.name === SCOPED_WRITER_ROOT_NAME ||
      KNOWLEDGE_TRANSACTION_ID_PATTERN.test(entry.name) ||
      parseWriterLockStagingName(entry.name) !== null ||
      parseWriterLockRecoveryName(entry.name) !== null ||
      parseTransactionStagingName(entry.name) !== null;
    if (!recognizedDirectory || !entry.isDirectory()) {
      throw new Error("Knowledge transaction root contains an unrecognized artifact.");
    }
  }
}

async function recoverStoreArtifactsWhileWriterIsHeld({
  paths,
  recoveryCapable,
  allowLiveCertificationLeases,
  allowLiveScopedWriters,
  waitForTransientArtifacts,
  dependencies,
}: {
  paths: KnowledgeTransactionPaths;
  recoveryCapable: boolean;
  allowLiveCertificationLeases: boolean;
  allowLiveScopedWriters: boolean;
  waitForTransientArtifacts: boolean;
  dependencies: Required<TransactionStoreDependencies>;
}): Promise<void> {
  const runPass = async () => {
    await clearInterruptedWriterLockPublications(paths, recoveryCapable, dependencies);
    await clearProvablyDeadReclaimedLocks(paths, recoveryCapable, dependencies);
    await inspectCertificationLeases({
      paths,
      recoveryCapable,
      allowLiveLeases: allowLiveCertificationLeases,
      dependencies,
    });
    await inspectScopedWriters({
      paths,
      recoveryCapable,
      allowLiveWriters: allowLiveScopedWriters,
      dependencies,
    });
    await clearInterruptedTransactionArtifacts(paths, recoveryCapable, dependencies);
    // A recovery routine can itself be interrupted or race with an outside
    // editor. Rescanning at the end prevents returning a usable writer while a
    // recovery artifact or unknown root entry remains visible.
    await clearInterruptedWriterLockPublications(paths, recoveryCapable, dependencies);
    await clearProvablyDeadReclaimedLocks(paths, recoveryCapable, dependencies);
    await assertRecognizedTransactionRootInventory(paths);
  };
  let lastTransientError = "unknown live transition";
  for (let attempt = 0; attempt < (waitForTransientArtifacts ? 200 : 1); attempt += 1) {
    try {
      await runPass();
      return;
    } catch (error) {
      if (
        !waitForTransientArtifacts ||
        !/interrupted .* still belongs to a live process/i.test(
          (error as Error).message,
        )
      ) {
        throw error;
      }
      lastTransientError = (error as Error).message;
      await new Promise<void>((resolve) => setTimeout(resolve, 10));
    }
  }
  throw new Error(
    `Timed out waiting for a live store transition to finish: ${lastTransientError}`,
  );
}

async function acquireKnowledgeTransactionLockInternal({
  repoRoot,
  command,
  transactionId = null,
  recoveryCapable = false,
  dependencies: injectedDependencies,
}: AcquireKnowledgeTransactionLockInput,
allowLiveCertificationLeases: boolean,
waitForTransientWriter = false,
allowLiveScopedWriters = false,
): Promise<KnowledgeTransactionLock> {
  assertSafeCommand(command);
  if (transactionId !== null) assertTransactionId(transactionId);
  const dependencies = resolvedDependencies(injectedDependencies);
  if (!Number.isSafeInteger(dependencies.pid) || dependencies.pid <= 0) {
    throw new Error("Knowledge transaction lock PID is invalid.");
  }
  try {
    hostFingerprint(dependencies.hostname());
  } catch {
    throw new Error("Knowledge transaction lock hostname is invalid.");
  }
  const paths = await resolveKnowledgeTransactionPaths(repoRoot, {
    createTransactionRoot: true,
  });

  const maximumAttempts = waitForTransientWriter ? 200 : 3;
  const waitAndRetry = async () => {
    const delay = 5 + (dependencies.pid % 17);
    await new Promise<void>((resolve) => setTimeout(resolve, delay));
  };
  for (let attempt = 0; attempt < maximumAttempts; attempt += 1) {
    await assertRecognizedTransactionRootInventory(paths);
    const visibleLock = await lstat(paths.lockDirectory).catch(
      (error: NodeJS.ErrnoException) => {
        if (error.code === "ENOENT") return null;
        throw error;
      },
    );
    if (visibleLock) {
      let existing;
      try {
        existing = await readExistingLock(paths.lockDirectory);
      } catch (readError) {
        if (
          waitForTransientWriter &&
          (readError as NodeJS.ErrnoException).code === "ENOENT"
        ) {
          await waitAndRetry();
          continue;
        }
        throw new Error(
          `Knowledge transaction writer lock exists but cannot be proven safe: ${(readError as Error).message}`,
        );
      }
      if (existing.hostname !== dependencies.hostname()) {
        throw new Error("Knowledge transaction writer lock belongs to another or unknown host.");
      }
      if (dependencies.isPidAlive(existing.pid)) {
        if (waitForTransientWriter) {
          await waitAndRetry();
          continue;
        }
        throw new Error("Knowledge transaction writer lock is held by a live process.");
      }
      if (!recoveryCapable) {
        throw new Error(
          "Knowledge transaction writer lock belongs to a dead process and requires explicit recovery.",
        );
      }
      const abandonedOwner = {
        lockId: existing.lockId,
        pid: existing.pid,
        hostname: existing.hostname,
      } satisfies StoreArtifactOwner;
      try {
        await quarantinePrivateDirectory({
          directoryPath: paths.lockDirectory,
          quarantinePath: path.join(
            paths.transactionRoot,
            writerLockRecoveryName("reclaimed", abandonedOwner),
          ),
          parentDirectory: paths.transactionRoot,
          dependencies,
          scope: "writer-lock",
          artifact: LOCK_DIRECTORY_NAME,
        });
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
      continue;
    }
    try {
      const lock = await createLockDirectory(
        paths,
        command,
        transactionId,
        recoveryCapable,
        dependencies,
      );
      try {
        await recoverStoreArtifactsWhileWriterIsHeld({
          paths,
          recoveryCapable,
          allowLiveCertificationLeases,
          allowLiveScopedWriters,
          waitForTransientArtifacts: waitForTransientWriter,
          dependencies,
        });
        return lock;
      } catch (error) {
        if (!isInjectedStoreInterruption(error)) {
          await releaseKnowledgeTransactionLock(lock).catch(() => undefined);
        }
        throw error;
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") {
        if (
          waitForTransientWriter &&
          /writer-lock.*live process|writer lock.*live process|interrupted .* still belongs to a live process/i.test(
            (error as Error).message,
          )
        ) {
          await waitAndRetry();
          continue;
        }
        throw error;
      }
      let existing;
      try {
        existing = await readExistingLock(paths.lockDirectory);
      } catch (readError) {
        if (
          waitForTransientWriter &&
          (readError as NodeJS.ErrnoException).code === "ENOENT"
        ) {
          await waitAndRetry();
          continue;
        }
        throw new Error(
          `Knowledge transaction writer lock exists but cannot be proven safe: ${(readError as Error).message}`,
        );
      }
      if (existing.hostname !== dependencies.hostname()) {
        throw new Error("Knowledge transaction writer lock belongs to another or unknown host.");
      }
      if (dependencies.isPidAlive(existing.pid)) {
        if (waitForTransientWriter) {
          await waitAndRetry();
          continue;
        }
        throw new Error("Knowledge transaction writer lock is held by a live process.");
      }
      if (!recoveryCapable) {
        throw new Error(
          "Knowledge transaction writer lock belongs to a dead process and requires explicit recovery.",
        );
      }

      const abandonedOwner = {
        lockId: existing.lockId,
        pid: existing.pid,
        hostname: existing.hostname,
      } satisfies StoreArtifactOwner;
      const quarantine = path.join(
        paths.transactionRoot,
        writerLockRecoveryName("reclaimed", abandonedOwner),
      );
      try {
        await quarantinePrivateDirectory({
          directoryPath: paths.lockDirectory,
          quarantinePath: quarantine,
          parentDirectory: paths.transactionRoot,
          dependencies,
          scope: "writer-lock",
          artifact: LOCK_DIRECTORY_NAME,
        });
      } catch (renameError) {
        if ((renameError as NodeJS.ErrnoException).code === "ENOENT") continue;
        throw renameError;
      }
      // Loop back through the normal acquisition path. The replacement writer
      // serializes cleanup, and the mandatory rescan above prevents a caller
      // from receiving it while the reclaimed directory still exists.
      continue;
    }
  }
  throw new Error(
    waitForTransientWriter
      ? "Timed out waiting for the knowledge transaction writer lock."
      : "Could not acquire the knowledge transaction writer lock.",
  );
}

export async function acquireKnowledgeTransactionLock(
  input: AcquireKnowledgeTransactionLockInput,
): Promise<KnowledgeTransactionLock> {
  return acquireKnowledgeTransactionLockInternal(input, false, false, false);
}

export async function acquireKnowledgeTransactionCommitLock(
  {
    scopedWriterLock,
    command,
  }: {
    scopedWriterLock: KnowledgeScopedWriterLock;
    command: string;
  },
): Promise<KnowledgeTransactionLock> {
  assertSafeCommand(command);
  const active = assertActiveScopedWriter(scopedWriterLock);
  await assertScopedWriterStillOwned(scopedWriterLock);
  const lock = await acquireKnowledgeTransactionLockInternal(
    {
      repoRoot: active.repositoryRoot,
      command,
      transactionId: active.transactionId,
      dependencies: active.dependencies,
    },
    false,
    true,
    true,
  );
  try {
    const transaction = await openVerifiedKnowledgeTransaction({
      repoRoot: active.repositoryRoot,
      transactionId: active.transactionId,
    });
    const protection = deriveKnowledgeTransactionProtection(
      transaction.kind,
      transaction.operations,
    );
    if (!knowledgeProtectionMatchesScopes(protection, active.scopes)) {
      throw new Error(
        "Knowledge scoped writer protection no longer matches its stored transaction.",
      );
    }
    return lock;
  } catch (error) {
    await releaseKnowledgeTransactionLock(lock);
    throw error;
  }
}

function assertActiveLock(lock: KnowledgeTransactionLock): ActiveLockRecord {
  const active = activeLocks.get(lock);
  if (!active || active.lockId !== lock.lockId) {
    throw new Error("Knowledge transaction writer lock is not active in this process.");
  }
  return active;
}

async function assertLockStillOwned(lock: KnowledgeTransactionLock): Promise<void> {
  const active = assertActiveLock(lock);
  const metadata = await readExistingLock(active.lockDirectory);
  if (metadata.lockId !== active.lockId) {
    throw new Error("Knowledge transaction writer lock ownership changed.");
  }
}

export async function releaseKnowledgeTransactionLock(
  lock: KnowledgeTransactionLock,
): Promise<void> {
  const active = assertActiveLock(lock);
  await assertLockStillOwned(lock);
  const owner = {
    lockId: active.lockId,
    pid: active.pid,
    hostname: active.hostname,
  } satisfies StoreArtifactOwner;
  const recoveryName = writerLockRecoveryName("removing", owner);
  const recoveryPath = path.join(active.transactionRoot, recoveryName);
  await quarantinePrivateDirectory({
    directoryPath: active.lockDirectory,
    quarantinePath: recoveryPath,
    parentDirectory: active.transactionRoot,
    dependencies: active.dependencies,
    scope: "writer-lock",
    artifact: LOCK_DIRECTORY_NAME,
  });
  await removePrivateDirectory({
    directoryPath: recoveryPath,
    parentDirectory: active.transactionRoot,
    dependencies: active.dependencies,
    scope: "writer-lock",
    artifact: recoveryName,
  });
  activeLocks.delete(lock);
}

function assertActiveScopedWriter(
  lock: KnowledgeScopedWriterLock,
) {
  const active = activeScopedWriters.get(lock);
  if (!active || active.lockId !== lock.lockId) {
    throw new Error("Knowledge scoped writer lock is not active in this process.");
  }
  return active;
}

async function assertScopedWriterStillOwned(
  lock: KnowledgeScopedWriterLock,
) {
  const active = assertActiveScopedWriter(lock);
  const stored = await readScopedWriter(active.lockDirectory);
  if (
    stored.lockId !== active.lockId ||
    stored.transactionId !== active.transactionId ||
    stored.hostname !== active.hostname ||
    stored.pid !== active.pid ||
    stored.scopes.join("\0") !==
      active.scopes.map(serializeKnowledgeProtectionScope).join("\0")
  ) {
    throw new Error("Knowledge scoped writer lock ownership changed.");
  }
}

export async function acquireKnowledgeScopedWriterLock({
  repoRoot,
  command,
  transactionId,
  recoveryCapable = false,
  dependencies: injectedDependencies,
}: {
  repoRoot: string;
  command: string;
  transactionId: string;
  recoveryCapable?: boolean;
  dependencies?: TransactionStoreDependencies;
}): Promise<KnowledgeScopedWriterLock> {
  assertSafeCommand(command);
  assertTransactionId(transactionId);
  const transaction = await openVerifiedKnowledgeTransaction({
    repoRoot,
    transactionId,
  });
  const protection = deriveKnowledgeTransactionProtection(
    transaction.kind,
    transaction.operations,
  );
  if (protection.mode !== "scoped") {
    throw new Error(
      `Knowledge transaction ${transactionId} requires global writer protection.`,
    );
  }
  const canonicalScopes = Object.freeze(
    [...protection.scopes]
      .map((scope) =>
        parseKnowledgeProtectionScope(serializeKnowledgeProtectionScope(scope)),
      )
      .sort((left, right) =>
        serializeKnowledgeProtectionScope(left).localeCompare(
          serializeKnowledgeProtectionScope(right),
        ),
      ),
  );
  if (
    new Set(canonicalScopes.map(serializeKnowledgeProtectionScope)).size !==
    canonicalScopes.length
  ) {
    throw new Error("Knowledge scoped writer contains duplicate scopes.");
  }
  const dependencies = resolvedDependencies(injectedDependencies);
  const gate = await acquireKnowledgeTransactionLockInternal(
    {
      repoRoot,
      command: "scoped writer register",
      transactionId,
      recoveryCapable,
      dependencies,
    },
    false,
    true,
    true,
  );
  let interrupted = false;
  const lockId = dependencies.randomBytes(16).toString("hex");
  if (!LOCK_ID_PATTERN.test(lockId)) {
    await releaseKnowledgeTransactionLock(gate);
    throw new Error("Secure random source returned an invalid scoped writer identifier.");
  }
  const owner = {
    lockId,
    pid: dependencies.pid,
    hostname: dependencies.hostname(),
  } satisfies StoreArtifactOwner;
  let scopedRoot = "";
  let stagingDirectory = "";
  let lockDirectory = "";
  let published = false;
  try {
    const paths: KnowledgeTransactionPaths = {
      repositoryRoot: gate.repositoryRoot,
      gitDirectory: gate.gitDirectory,
      transactionRoot: gate.transactionRoot,
      lockDirectory: gate.lockDirectory,
    };
    const existing = await inspectScopedWriters({
      paths,
      recoveryCapable,
      allowLiveWriters: true,
      dependencies,
    });
    for (const writer of existing) {
      const writerScopes = writer.scopes.map(parseKnowledgeProtectionScope);
      if (knowledgeProtectionScopesOverlap(canonicalScopes, writerScopes)) {
        throw new Error(
          `Knowledge scoped writer conflicts with transaction ${writer.transactionId}.`,
        );
      }
    }
    scopedRoot = await ensureScopedWriterRoot(gate.transactionRoot, dependencies);
    const transitionName = knowledgeScopedWriterTransitionName(
      "preparing",
      lockId,
      owner,
    );
    stagingDirectory = path.join(scopedRoot, transitionName);
    lockDirectory = path.join(
      scopedRoot,
      knowledgeScopedWriterDirectoryName(lockId),
    );
    const stagingIdentity = await createPrivateDirectory(
      stagingDirectory,
      dependencies,
      "scoped-writer",
      transitionName,
    );
    const metadata = metadataWithHash({
      storeVersion: STORE_VERSION,
      lockId,
      pid: dependencies.pid,
      hostname: dependencies.hostname(),
      startedAt: dependencies.now().toISOString(),
      command,
      transactionId,
      scopes: canonicalScopes.map(serializeKnowledgeProtectionScope),
    });
    await writePrivateFileAtomicExclusive({
      filePath: path.join(stagingDirectory, SCOPED_WRITER_METADATA_NAME),
      bytes: `${canonicalJson(metadata)}\n`,
      owner,
      dependencies,
      scope: "scoped-writer",
    });
    await publishPrivateDirectory({
      stagingDirectory,
      finalDirectory: lockDirectory,
      parentDirectory: scopedRoot,
      dependencies,
      scope: "scoped-writer",
      artifact: knowledgeScopedWriterDirectoryName(lockId),
      expectedDirectories: [{ relativePath: "", identity: stagingIdentity }],
    });
    published = true;
  } catch (error) {
    interrupted = isInjectedStoreInterruption(error);
    if (
      stagingDirectory &&
      !published &&
      !interrupted &&
      !isStoreArtifactIdentityChanged(error)
    ) {
      await removePrivateDirectory({
        directoryPath: stagingDirectory,
        parentDirectory: scopedRoot,
        dependencies,
        scope: "scoped-writer",
        artifact: path.basename(stagingDirectory),
      }).catch(() => undefined);
    }
    throw error;
  } finally {
    if (!interrupted) await releaseKnowledgeTransactionLock(gate);
  }

  const lock: KnowledgeScopedWriterLock = Object.freeze({
    repositoryRoot: gate.repositoryRoot,
    gitDirectory: gate.gitDirectory,
    transactionRoot: gate.transactionRoot,
    scopedRoot,
    lockDirectory,
    lockId,
    command,
    transactionId,
    scopes: canonicalScopes,
  });
  activeScopedWriters.set(lock, {
    lockId,
    lockDirectory,
    scopedRoot,
    repositoryRoot: gate.repositoryRoot,
    transactionRoot: gate.transactionRoot,
    pid: dependencies.pid,
    hostname: dependencies.hostname(),
    transactionId,
    scopes: canonicalScopes,
    dependencies,
  });
  return lock;
}

export async function releaseKnowledgeScopedWriterLock(
  lock: KnowledgeScopedWriterLock,
): Promise<void> {
  const active = assertActiveScopedWriter(lock);
  await assertScopedWriterStillOwned(lock);
  const gate = await acquireKnowledgeTransactionLockInternal(
    {
      repoRoot: active.repositoryRoot,
      command: "scoped writer release",
      transactionId: active.transactionId,
      dependencies: active.dependencies,
    },
    false,
    true,
    true,
  );
  let interrupted = false;
  try {
    await assertScopedWriterStillOwned(lock);
    const owner = {
      lockId: active.lockId,
      pid: active.pid,
      hostname: active.hostname,
    } satisfies StoreArtifactOwner;
    const transitionName = knowledgeScopedWriterTransitionName(
      "removing",
      active.lockId,
      owner,
    );
    const transitionDirectory = path.join(active.scopedRoot, transitionName);
    await quarantinePrivateDirectory({
      directoryPath: active.lockDirectory,
      quarantinePath: transitionDirectory,
      parentDirectory: active.scopedRoot,
      dependencies: active.dependencies,
      scope: "scoped-writer",
      artifact: path.basename(active.lockDirectory),
    });
    await removePrivateDirectory({
      directoryPath: transitionDirectory,
      parentDirectory: active.scopedRoot,
      dependencies: active.dependencies,
      scope: "scoped-writer",
      artifact: transitionName,
    });
  } catch (error) {
    interrupted = isInjectedStoreInterruption(error);
    throw error;
  } finally {
    if (!interrupted) await releaseKnowledgeTransactionLock(gate);
  }
  activeScopedWriters.delete(lock);
}

async function ensureCertificationLeaseRoot(
  transactionRoot: string,
  dependencies: Required<TransactionStoreDependencies>,
): Promise<string> {
  const leaseRoot = path.join(transactionRoot, CERTIFICATION_LEASE_ROOT_NAME);
  const existing = await lstat(leaseRoot).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (existing) {
    await assertRealDirectory(leaseRoot, "Knowledge certification lease root", 0o700);
  } else {
    await createPrivateDirectory(
      leaseRoot,
      dependencies,
      "certification-lease",
      CERTIFICATION_LEASE_ROOT_NAME,
    );
  }
  return leaseRoot;
}

export async function acquireKnowledgeCertificationLease({
  repoRoot,
  command,
  recoveryCapable = false,
  dependencies: injectedDependencies,
}: {
  repoRoot: string;
  command: string;
  recoveryCapable?: boolean;
  dependencies?: TransactionStoreDependencies;
}): Promise<KnowledgeCertificationLease> {
  assertSafeCommand(command);
  const dependencies = resolvedDependencies(injectedDependencies);
  const leaseId = dependencies.randomBytes(16).toString("hex");
  if (!CERTIFICATION_LEASE_ID_PATTERN.test(leaseId)) {
    throw new Error("Secure random source returned an invalid certification lease identifier.");
  }
  const lock = await acquireKnowledgeTransactionLockInternal(
    {
      repoRoot,
      command: "certification lease register",
      recoveryCapable,
      dependencies,
    },
    true,
    true,
  );
  let interrupted = false;
  const owner = {
    lockId: leaseId,
    pid: dependencies.pid,
    hostname: dependencies.hostname(),
  } satisfies StoreArtifactOwner;
  let leaseRoot = "";
  let stagingDirectory = "";
  let leaseDirectory = "";
  let published = false;
  try {
    leaseRoot = await ensureCertificationLeaseRoot(
      lock.transactionRoot,
      dependencies,
    );
    const stagingName = certificationLeaseTransitionName(
      "preparing",
      leaseId,
      owner,
    );
    stagingDirectory = path.join(leaseRoot, stagingName);
    leaseDirectory = path.join(
      leaseRoot,
      certificationLeaseDirectoryName(leaseId),
    );
    const stagingIdentity = await createPrivateDirectory(
      stagingDirectory,
      dependencies,
      "certification-lease",
      stagingName,
    );
    const metadata = metadataWithHash({
      storeVersion: STORE_VERSION,
      leaseId,
      pid: dependencies.pid,
      hostname: dependencies.hostname(),
      startedAt: dependencies.now().toISOString(),
      command,
      protectedChildPid: null,
      protectedProcessGroupId: null,
    });
    await writePrivateFileAtomicExclusive({
      filePath: path.join(stagingDirectory, CERTIFICATION_LEASE_METADATA_NAME),
      bytes: `${canonicalJson(metadata)}\n`,
      owner,
      dependencies,
      scope: "certification-lease",
    });
    await publishPrivateDirectory({
      stagingDirectory,
      finalDirectory: leaseDirectory,
      parentDirectory: leaseRoot,
      dependencies,
      scope: "certification-lease",
      artifact: certificationLeaseDirectoryName(leaseId),
      expectedDirectories: [{ relativePath: "", identity: stagingIdentity }],
    });
    published = true;
  } catch (error) {
    interrupted = isInjectedStoreInterruption(error);
    if (
      stagingDirectory &&
      !published &&
      !interrupted &&
      !isStoreArtifactIdentityChanged(error)
    ) {
      await removePrivateDirectory({
        directoryPath: stagingDirectory,
        parentDirectory: leaseRoot,
        dependencies,
        scope: "certification-lease",
        artifact: path.basename(stagingDirectory),
      }).catch(() => undefined);
    }
    throw error;
  } finally {
    if (!interrupted) await releaseKnowledgeTransactionLock(lock);
  }

  const lease: KnowledgeCertificationLease = Object.freeze({
    repositoryRoot: lock.repositoryRoot,
    transactionRoot: lock.transactionRoot,
    leaseDirectory,
    leaseId,
    command,
  });
  activeCertificationLeases.set(lease, {
    leaseId,
    leaseDirectory,
    leaseRoot,
    repositoryRoot: lock.repositoryRoot,
    command,
  });
  return lease;
}

export async function attachKnowledgeCertificationLeaseProtectedProcess({
  lease,
  protectedChildPid,
  protectedProcessGroupId = null,
  recoveryCapable = false,
  dependencies: injectedDependencies,
}: {
  lease: KnowledgeCertificationLease;
  protectedChildPid: number;
  protectedProcessGroupId?: number | null;
  recoveryCapable?: boolean;
  dependencies?: TransactionStoreDependencies;
}): Promise<void> {
  const active = activeCertificationLeases.get(lease);
  if (!active || active.leaseId !== lease.leaseId) {
    throw new Error("Knowledge certification lease is not active in this process.");
  }
  if (!Number.isSafeInteger(protectedChildPid) || protectedChildPid <= 0) {
    throw new Error("Protected certification child PID is invalid.");
  }
  if (
    protectedProcessGroupId !== null &&
    (!Number.isSafeInteger(protectedProcessGroupId) || protectedProcessGroupId <= 0)
  ) {
    throw new Error("Protected certification process-group identifier is invalid.");
  }
  const dependencies = resolvedDependencies(injectedDependencies);
  const lock = await acquireKnowledgeTransactionLockInternal(
    {
      repoRoot: active.repositoryRoot,
      command: "certification lease attach child",
      recoveryCapable,
      dependencies,
    },
    true,
    true,
  );
  let interrupted = false;
  try {
    const currentLease = await readCertificationLeaseWithSnapshot(
      active.leaseDirectory,
    );
    const stored = currentLease.lease;
    if (
      stored.leaseId !== active.leaseId ||
      stored.hostname !== dependencies.hostname() ||
      stored.pid !== dependencies.pid
    ) {
      throw new Error("Knowledge certification lease ownership changed.");
    }
    if (
      stored.protectedChildPid !== null &&
      (stored.protectedChildPid !== protectedChildPid ||
        stored.protectedProcessGroupId !== protectedProcessGroupId)
    ) {
      throw new Error("Knowledge certification lease already protects a different process.");
    }
    if (
      stored.protectedChildPid === protectedChildPid &&
      stored.protectedProcessGroupId === protectedProcessGroupId
    ) {
      return;
    }
    const updated = metadataWithHash({
      storeVersion: stored.storeVersion,
      leaseId: stored.leaseId,
      pid: stored.pid,
      hostname: stored.hostname,
      startedAt: stored.startedAt,
      command: stored.command,
      protectedChildPid,
      protectedProcessGroupId,
    });
    const writer = assertActiveLock(lock);
    await writePrivateFileAtomicReplace({
      filePath: path.join(active.leaseDirectory, CERTIFICATION_LEASE_METADATA_NAME),
      bytes: `${canonicalJson(updated)}\n`,
      expectedDestination: currentLease.snapshot,
      owner: {
        lockId: writer.lockId,
        pid: writer.pid,
        hostname: writer.hostname,
      },
      dependencies,
      scope: "certification-lease",
    });
  } catch (error) {
    interrupted = isInjectedStoreInterruption(error);
    throw error;
  } finally {
    if (!interrupted) await releaseKnowledgeTransactionLock(lock);
  }
}

export async function releaseKnowledgeCertificationLease(
  lease: KnowledgeCertificationLease,
  options: {
    recoveryCapable?: boolean;
    dependencies?: TransactionStoreDependencies;
  } = {},
): Promise<void> {
  const active = activeCertificationLeases.get(lease);
  if (!active || active.leaseId !== lease.leaseId) {
    throw new Error("Knowledge certification lease is not active in this process.");
  }
  const dependencies = resolvedDependencies(options.dependencies);
  const lock = await acquireKnowledgeTransactionLockInternal(
    {
      repoRoot: active.repositoryRoot,
      command: "certification lease release",
      recoveryCapable: options.recoveryCapable ?? false,
      dependencies,
    },
    true,
    true,
  );
  let interrupted = false;
  try {
    const stored = await readCertificationLease(active.leaseDirectory);
    if (
      stored.leaseId !== active.leaseId ||
      stored.hostname !== dependencies.hostname() ||
      stored.pid !== dependencies.pid
    ) {
      throw new Error("Knowledge certification lease ownership changed.");
    }
    if (
      (stored.protectedChildPid !== null &&
        dependencies.isPidAlive(stored.protectedChildPid)) ||
      (stored.protectedProcessGroupId !== null &&
        dependencies.isProcessGroupAlive(stored.protectedProcessGroupId))
    ) {
      throw new Error(
        "Knowledge certification lease cannot be released while its protected process is alive.",
      );
    }
    const owner = {
      lockId: active.leaseId,
      pid: stored.pid,
      hostname: stored.hostname,
    } satisfies StoreArtifactOwner;
    const transitionName = certificationLeaseTransitionName(
      "releasing",
      active.leaseId,
      owner,
    );
    const transitionDirectory = path.join(active.leaseRoot, transitionName);
    await quarantinePrivateDirectory({
      directoryPath: active.leaseDirectory,
      quarantinePath: transitionDirectory,
      parentDirectory: active.leaseRoot,
      dependencies,
      scope: "certification-lease",
      artifact: certificationLeaseDirectoryName(active.leaseId),
    });
    await removePrivateDirectory({
      directoryPath: transitionDirectory,
      parentDirectory: active.leaseRoot,
      dependencies,
      scope: "certification-lease",
      artifact: transitionName,
    });
    activeCertificationLeases.delete(lease);
  } catch (error) {
    interrupted = isInjectedStoreInterruption(error);
    throw error;
  } finally {
    if (!interrupted) await releaseKnowledgeTransactionLock(lock);
  }
}

export function generateKnowledgeTransactionId(
  dependencies: TransactionStoreDependencies = {},
): string {
  const resolved = resolvedDependencies(dependencies);
  return generateTransactionId({
    now: resolved.now(),
    entropy: resolved.randomBytes(8),
  });
}

function validateSnapshot(
  snapshot: KnowledgeTransactionSnapshot,
): KnowledgeTransactionSnapshot {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    throw new Error("Transaction snapshot is malformed.");
  }
  assertExactKeys(
    snapshot as unknown as Record<string, unknown>,
    ["validationAsOf", "requestSha256", "packageSha256", "sources"],
    "Transaction snapshot",
  );
  if (!DATE_PATTERN.test(snapshot.validationAsOf)) {
    throw new Error("Transaction snapshot validationAsOf must be YYYY-MM-DD.");
  }
  assertSha256(snapshot.requestSha256, "Transaction request hash");
  if (snapshot.packageSha256 !== null) {
    assertSha256(snapshot.packageSha256, "Transaction package hash");
  }
  if (
    !Array.isArray(snapshot.sources) ||
    snapshot.sources.length > MAX_TRANSACTION_SNAPSHOT_ENTRIES
  ) {
    throw new Error("Transaction snapshot exceeds the maximum source count.");
  }
  let previousPath = "";
  const normalizedSources = snapshot.sources.map((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new Error("Transaction snapshot entry is malformed.");
    }
    assertExactKeys(
      entry as unknown as Record<string, unknown>,
      entry.state === "present"
        ? ["path", "state", "sha256", "mode"]
        : ["path", "state"],
      `Transaction snapshot entry ${entry.path}`,
    );
    assertSafeRelativePath(entry.path, "snapshot path");
    if (entry.path <= previousPath) {
      throw new Error("Transaction snapshot paths must be strictly sorted and unique.");
    }
    previousPath = entry.path;
    if (entry.state === "present") {
      assertSha256(entry.sha256, `Snapshot hash for ${entry.path}`);
      if (!Number.isSafeInteger(entry.mode) || entry.mode < 0 || entry.mode > 0o777) {
        throw new Error(`Snapshot mode for ${entry.path} is invalid.`);
      }
      return { ...entry };
    }
    if (entry.state === "absent") return { ...entry };
    throw new Error("Transaction snapshot contains an invalid source state.");
  });
  return {
    validationAsOf: snapshot.validationAsOf,
    requestSha256: snapshot.requestSha256,
    packageSha256: snapshot.packageSha256,
    sources: normalizedSources,
  };
}

function validatePayload(buffer: Buffer, label: string): void {
  if (!Buffer.isBuffer(buffer)) throw new Error(`${label} must be a Buffer.`);
  if (buffer.byteLength > MAX_TRANSACTION_PAYLOAD_BYTES) {
    throw new Error(`${label} exceeds the maximum payload size.`);
  }
}

function artifactName(index: number, phase: "before" | "after"): string {
  return `${PAYLOAD_DIRECTORY_NAME}/operation-${String(index).padStart(4, "0")}.${phase}.bin`;
}

function validateOperations(
  operations: KnowledgeTransactionOperationInput[],
  snapshot: KnowledgeTransactionSnapshot,
): { stored: StoredOperation[]; totalBytes: number } {
  if (operations.length === 0 || operations.length > MAX_TRANSACTION_OPERATIONS) {
    throw new Error("Transaction operation count is outside the supported range.");
  }
  const snapshotByPath = new Map(snapshot.sources.map((entry) => [entry.path, entry]));
  let totalBytes = 0;
  const touchedPaths = new Set<string>();

  const registerPath = (candidate: string) => {
    assertSafeRelativePath(candidate, "operation path");
    if (touchedPaths.has(candidate)) {
      throw new Error(`Transaction path is touched more than once: ${candidate}`);
    }
    touchedPaths.add(candidate);
  };
  const requirePresent = (candidate: string, bytes: Buffer) => {
    const entry = snapshotByPath.get(candidate);
    if (!entry || entry.state !== "present" || entry.sha256 !== sha256(bytes)) {
      throw new Error(`Transaction snapshot does not match before bytes for ${candidate}.`);
    }
  };
  const requireAbsent = (candidate: string) => {
    const entry = snapshotByPath.get(candidate);
    if (!entry || entry.state !== "absent") {
      throw new Error(`Transaction snapshot must record ${candidate} as absent.`);
    }
  };

  const stored = operations.map((operation, offset): StoredOperation => {
    const index = offset;
    if (operation.action === "create") {
      registerPath(operation.path);
      validatePayload(operation.afterBytes, `Operation ${index} after payload`);
      requireAbsent(operation.path);
      totalBytes += operation.afterBytes.byteLength;
      return {
        index,
        action: operation.action,
        path: operation.path,
        expectedDestinationState: "absent",
        after: {
          artifact: artifactName(index, "after"),
          sha256: sha256(operation.afterBytes),
          bytes: operation.afterBytes.byteLength,
        },
      };
    }
    if (operation.action === "update") {
      registerPath(operation.path);
      validatePayload(operation.beforeBytes, `Operation ${index} before payload`);
      validatePayload(operation.afterBytes, `Operation ${index} after payload`);
      requirePresent(operation.path, operation.beforeBytes);
      totalBytes += operation.beforeBytes.byteLength + operation.afterBytes.byteLength;
      return {
        index,
        action: operation.action,
        path: operation.path,
        expectedSourceSha256: sha256(operation.beforeBytes),
        before: {
          artifact: artifactName(index, "before"),
          sha256: sha256(operation.beforeBytes),
          bytes: operation.beforeBytes.byteLength,
        },
        after: {
          artifact: artifactName(index, "after"),
          sha256: sha256(operation.afterBytes),
          bytes: operation.afterBytes.byteLength,
        },
      };
    }
    if (operation.action === "remove") {
      registerPath(operation.path);
      validatePayload(operation.beforeBytes, `Operation ${index} before payload`);
      requirePresent(operation.path, operation.beforeBytes);
      totalBytes += operation.beforeBytes.byteLength;
      return {
        index,
        action: operation.action,
        path: operation.path,
        expectedSourceSha256: sha256(operation.beforeBytes),
        before: {
          artifact: artifactName(index, "before"),
          sha256: sha256(operation.beforeBytes),
          bytes: operation.beforeBytes.byteLength,
        },
      };
    }
    registerPath(operation.sourcePath);
    registerPath(operation.destinationPath);
    validatePayload(operation.beforeBytes, `Operation ${index} before payload`);
    validatePayload(operation.afterBytes, `Operation ${index} after payload`);
    requirePresent(operation.sourcePath, operation.beforeBytes);
    requireAbsent(operation.destinationPath);
    totalBytes += operation.beforeBytes.byteLength + operation.afterBytes.byteLength;
    return {
      index,
      action: operation.action,
      sourcePath: operation.sourcePath,
      destinationPath: operation.destinationPath,
      expectedSourceSha256: sha256(operation.beforeBytes),
      expectedDestinationState: "absent",
      before: {
        artifact: artifactName(index, "before"),
        sha256: sha256(operation.beforeBytes),
        bytes: operation.beforeBytes.byteLength,
      },
      after: {
        artifact: artifactName(index, "after"),
        sha256: sha256(operation.afterBytes),
        bytes: operation.afterBytes.byteLength,
      },
    };
  });

  if (totalBytes > MAX_TRANSACTION_TOTAL_BYTES) {
    throw new Error("Transaction exceeds the maximum total payload size.");
  }
  return { stored, totalBytes };
}

function bytesForOperation(
  operation: KnowledgeTransactionOperationInput,
): { before?: Buffer; after?: Buffer } {
  switch (operation.action) {
    case "create":
      return { after: operation.afterBytes };
    case "update":
    case "move":
      return { before: operation.beforeBytes, after: operation.afterBytes };
    case "remove":
      return { before: operation.beforeBytes };
  }
}

function transactionStagingName(
  transactionId: string,
  owner: StoreArtifactOwner,
): string {
  assertTransactionId(transactionId);
  return `.preparing-transaction-${transactionId}-${artifactOwnerToken(owner)}`;
}

function parseTransactionStagingName(name: string): Readonly<{
  transactionId: string;
  owner: Readonly<{ lockId: string; pid: number; hostnameHash: string }>;
}> | null {
  return parseKnowledgeTransactionStagingName(name);
}

async function clearPendingPrivateFiles({
  directoryPath,
  recoveryCapable,
  dependencies,
}: {
  directoryPath: string;
  recoveryCapable: boolean;
  dependencies: Required<TransactionStoreDependencies>;
}): Promise<void> {
  const directoryInfo = await lstat(directoryPath).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (!directoryInfo) return;
  await assertRealDirectory(directoryPath, "Transaction store directory", 0o700);
  const entries = (await readdir(directoryPath, { withFileTypes: true }))
    .filter((entry) => entry.name.startsWith(".pending-"))
    .sort((left, right) => left.name.localeCompare(right.name));
  for (const entry of entries) {
    const pending = parsePrivatePendingFileName(entry.name);
    if (!pending || !entry.isFile()) {
      throw new Error("Transaction store contains an unsafe pending file publication.");
    }
    assertRecoverableOwner(
      pending.owner,
      dependencies,
      "Interrupted file publication",
    );
    if (!recoveryCapable) {
      throw new Error("An interrupted file publication requires explicit recovery.");
    }
    const pendingPath = path.join(directoryPath, entry.name);
    const pendingInfo = await lstat(pendingPath);
    if (pendingInfo.isSymbolicLink() || !pendingInfo.isFile()) {
      throw new Error("Transaction store pending publication is unsafe.");
    }
    assertOwnerOnlyMode(pendingInfo.mode, 0o600, "Transaction store pending publication");
    const finalPath = path.join(directoryPath, pending.finalName);
    const finalInfo = await lstat(finalPath).catch((error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") return null;
      throw error;
    });
    if (finalInfo) {
      if (finalInfo.isSymbolicLink() || !finalInfo.isFile()) {
        throw new Error("Interrupted file publication target is unsafe.");
      }
      assertOwnerOnlyMode(finalInfo.mode, 0o600, "Interrupted file publication target");
      if (pending.mode === "create") {
        const [pendingIdentity, finalIdentity] = await Promise.all([
          stat(pendingPath),
          stat(finalPath),
        ]);
        if (
          pendingIdentity.dev !== finalIdentity.dev ||
          pendingIdentity.ino !== finalIdentity.ino
        ) {
          throw new Error("Interrupted file publication target does not match its temporary file.");
        }
      }
    }
    await notifyStoreMutation(dependencies, {
      kind: "file-removal-ready",
      scope: "transaction-control",
      artifact: entry.name,
    });
    const finalPendingInfo = await lstat(pendingPath);
    if (
      finalPendingInfo.dev !== pendingInfo.dev ||
      finalPendingInfo.ino !== pendingInfo.ino ||
      finalPendingInfo.isSymbolicLink() ||
      !finalPendingInfo.isFile()
    ) {
      throw new Error("Transaction store pending publication identity changed.");
    }
    await unlink(pendingPath);
    await notifyStoreMutation(dependencies, {
      kind: "file-unlinked-unsynced",
      scope: "transaction-control",
      artifact: entry.name,
    });
    await fsyncDirectory(directoryPath);
    await notifyStoreMutation(dependencies, {
      kind: "temporary-file-removed",
      scope: "transaction-control",
      artifact: pending.finalName,
    });
  }
}

async function clearInterruptedTransactionArtifacts(
  paths: KnowledgeTransactionPaths,
  recoveryCapable: boolean,
  dependencies: Required<TransactionStoreDependencies>,
): Promise<void> {
  const entries = (await readdir(paths.transactionRoot, { withFileTypes: true })).sort(
    (left, right) => left.name.localeCompare(right.name),
  );
  for (const entry of entries) {
    if (entry.name.startsWith(".preparing-transaction-")) {
      const staged = parseTransactionStagingName(entry.name);
      if (!staged || !entry.isDirectory()) {
        throw new Error("Knowledge transaction root contains an unsafe preparation artifact.");
      }
      assertRecoverableOwner(
        staged.owner,
        dependencies,
        "Interrupted transaction preparation",
      );
      if (!recoveryCapable) {
        throw new Error("An interrupted transaction preparation requires explicit recovery.");
      }
      const stagingDirectory = path.join(paths.transactionRoot, entry.name);
      await assertRealDirectory(
        stagingDirectory,
        "Interrupted transaction preparation",
        0o700,
      );
      await removePrivateDirectory({
        directoryPath: stagingDirectory,
        parentDirectory: paths.transactionRoot,
        dependencies,
        scope: "transaction-prepare",
        artifact: entry.name,
      });
      continue;
    }
    if (!entry.isDirectory() || !KNOWLEDGE_TRANSACTION_ID_PATTERN.test(entry.name)) {
      continue;
    }
    assertTransactionId(entry.name);
    const transactionDirectory = path.join(paths.transactionRoot, entry.name);
    await clearPendingPrivateFiles({
      directoryPath: transactionDirectory,
      recoveryCapable,
      dependencies,
    });
    await clearPendingPrivateFiles({
      directoryPath: path.join(transactionDirectory, PAYLOAD_DIRECTORY_NAME),
      recoveryCapable,
      dependencies,
    });
    await clearPendingPrivateFiles({
      directoryPath: path.join(transactionDirectory, TERMINAL_RECEIPT_DIRECTORY_NAME),
      recoveryCapable,
      dependencies,
    });
  }
}

export async function createPreparedKnowledgeTransaction({
  lock,
  transactionId,
  kind,
  snapshot: rawSnapshot,
  operations,
  dependencies: injectedDependencies,
}: {
  lock: KnowledgeTransactionLock;
  transactionId: string;
  kind: KnowledgeTransactionKind;
  snapshot: KnowledgeTransactionSnapshot;
  operations: KnowledgeTransactionOperationInput[];
  dependencies?: TransactionStoreDependencies;
}): Promise<VerifiedKnowledgeTransaction> {
  await assertLockStillOwned(lock);
  assertTransactionId(transactionId);
  if (lock.transactionId !== transactionId) {
    throw new Error("Prepare requires a writer lock scoped to the same transaction ID.");
  }
  if (!(["project-create", "project-update", "issue-create", "issue-update", "accepted-update", "legacy-import", "correction", "closeout"] as string[]).includes(kind)) {
    throw new Error("Knowledge transaction kind is invalid.");
  }
  const dependencies = resolvedDependencies(injectedDependencies);
  const snapshot = validateSnapshot(rawSnapshot);
  const { stored, totalBytes } = validateOperations(operations, snapshot);

  const transactionDirectory = path.join(lock.transactionRoot, transactionId);
  const active = assertActiveLock(lock);
  const owner = {
    lockId: active.lockId,
    pid: active.pid,
    hostname: active.hostname,
  } satisfies StoreArtifactOwner;
  const stagingName = transactionStagingName(transactionId, owner);
  const stagingDirectory = path.join(lock.transactionRoot, stagingName);
  let published = false;

  try {
    const stagingIdentity = await createPrivateDirectory(
      stagingDirectory,
      dependencies,
      "transaction-prepare",
      stagingName,
    );
    const payloadDirectory = path.join(stagingDirectory, PAYLOAD_DIRECTORY_NAME);
    const payloadIdentity = await createPrivateDirectory(
      payloadDirectory,
      dependencies,
      "transaction-prepare",
      PAYLOAD_DIRECTORY_NAME,
    );
    const terminalReceiptIdentity = await createPrivateDirectory(
      path.join(stagingDirectory, TERMINAL_RECEIPT_DIRECTORY_NAME),
      dependencies,
      "transaction-prepare",
      TERMINAL_RECEIPT_DIRECTORY_NAME,
    );
    for (let offset = 0; offset < operations.length; offset += 1) {
      const storedOperation = stored[offset];
      const payloads = bytesForOperation(operations[offset]);
      if (payloads.before && storedOperation.before) {
        await writePrivateFileAtomicExclusive({
          filePath: path.join(stagingDirectory, storedOperation.before.artifact),
          bytes: payloads.before,
          owner,
          dependencies,
          scope: "transaction-prepare",
        });
      }
      if (payloads.after && storedOperation.after) {
        await writePrivateFileAtomicExclusive({
          filePath: path.join(stagingDirectory, storedOperation.after.artifact),
          bytes: payloads.after,
          owner,
          dependencies,
          scope: "transaction-prepare",
        });
      }
    }
    await writePrivateFileAtomicExclusive({
      filePath: path.join(stagingDirectory, JOURNAL_NAME),
      bytes: "",
      owner,
      dependencies,
      scope: "transaction-prepare",
    });
    const manifestBase: StoredManifestBase = {
      storeVersion: STORE_VERSION,
      transactionId,
      kind,
      command: lock.command,
      createdAt: dependencies.now().toISOString(),
      operationCount: stored.length,
      totalPayloadBytes: totalBytes,
      snapshot,
      snapshotSha256: sha256(canonicalJson(snapshot)),
      operations: stored,
    };
    const manifest = metadataWithHash(manifestBase);
    const manifestBytes = Buffer.from(`${canonicalJson(manifest)}\n`, "utf8");
    if (manifestBytes.byteLength > MAX_MANIFEST_BYTES) {
      throw new Error("Transaction manifest exceeds the maximum allowed size.");
    }
    await writePrivateFileAtomicExclusive({
      filePath: path.join(stagingDirectory, MANIFEST_NAME),
      bytes: manifestBytes,
      owner,
      dependencies,
      scope: "transaction-prepare",
    });
    await publishPrivateDirectory({
      stagingDirectory,
      finalDirectory: transactionDirectory,
      parentDirectory: lock.transactionRoot,
      dependencies,
      scope: "transaction-prepare",
      artifact: transactionId,
      expectedDirectories: [
        { relativePath: "", identity: stagingIdentity },
        { relativePath: PAYLOAD_DIRECTORY_NAME, identity: payloadIdentity },
        {
          relativePath: TERMINAL_RECEIPT_DIRECTORY_NAME,
          identity: terminalReceiptIdentity,
        },
      ],
    });
    published = true;
  } catch (error) {
    if (
      !published &&
      !isInjectedStoreInterruption(error) &&
      !isStoreArtifactIdentityChanged(error)
    ) {
      await removePrivateDirectory({
        directoryPath: stagingDirectory,
        parentDirectory: lock.transactionRoot,
        dependencies,
        scope: "transaction-prepare",
        artifact: stagingName,
      }).catch(() => undefined);
    }
    throw error;
  }
  return openVerifiedKnowledgeTransaction({
    repoRoot: lock.repositoryRoot,
    transactionId,
  });
}

function assertStoredManifest(value: unknown): asserts value is StoredManifest {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Knowledge transaction manifest is malformed.");
  }
  const manifest = value as Record<string, unknown>;
  assertExactKeys(
    manifest,
    [
      "storeVersion",
      "transactionId",
      "kind",
      "command",
      "createdAt",
      "operationCount",
      "totalPayloadBytes",
      "snapshot",
      "snapshotSha256",
      "operations",
      "metadataSha256",
    ],
    "Knowledge transaction manifest",
  );
  assertMetadataHash(manifest, "Knowledge transaction manifest");
  if (
    manifest.storeVersion !== STORE_VERSION ||
    typeof manifest.transactionId !== "string" ||
    !KNOWLEDGE_TRANSACTION_ID_PATTERN.test(manifest.transactionId) ||
    !(["project-create", "project-update", "issue-create", "issue-update", "accepted-update", "legacy-import", "correction", "closeout"] as unknown[]).includes(manifest.kind) ||
    typeof manifest.command !== "string" ||
    typeof manifest.createdAt !== "string" ||
    !Number.isSafeInteger(manifest.operationCount) ||
    !Number.isSafeInteger(manifest.totalPayloadBytes) ||
    !Array.isArray(manifest.operations) ||
    typeof manifest.snapshotSha256 !== "string" ||
    !SHA256_PATTERN.test(manifest.snapshotSha256)
  ) {
    throw new Error("Knowledge transaction manifest is malformed.");
  }
  assertIsoTimestamp(manifest.createdAt, "Knowledge transaction manifest createdAt");
  assertSafeCommand(manifest.command);
}

function validateStoredOperation(
  value: unknown,
  expectedIndex: number,
): asserts value is StoredOperation {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Transaction operation ${expectedIndex} is malformed.`);
  }
  const operation = value as Record<string, unknown>;
  if (
    operation.index !== expectedIndex ||
    !["create", "update", "remove", "move"].includes(String(operation.action))
  ) {
    throw new Error(`Transaction operation ${expectedIndex} is malformed.`);
  }
  const action = operation.action as StoredOperation["action"];
  const expectedOperationKeys =
    action === "create"
      ? ["index", "action", "path", "expectedDestinationState", "after"]
      : action === "update"
        ? ["index", "action", "path", "expectedSourceSha256", "before", "after"]
        : action === "remove"
          ? ["index", "action", "path", "expectedSourceSha256", "before"]
          : [
              "index",
              "action",
              "sourcePath",
              "destinationPath",
              "expectedSourceSha256",
              "expectedDestinationState",
              "before",
              "after",
            ];
  assertExactKeys(
    operation,
    expectedOperationKeys,
    `Transaction operation ${expectedIndex}`,
  );
  if (action === "move") {
    if (
      typeof operation.sourcePath !== "string" ||
      typeof operation.destinationPath !== "string"
    ) {
      throw new Error(`Transaction operation ${expectedIndex} is malformed.`);
    }
    assertSafeRelativePath(operation.sourcePath, "operation source path");
    assertSafeRelativePath(operation.destinationPath, "operation destination path");
  } else {
    if (typeof operation.path !== "string") {
      throw new Error(`Transaction operation ${expectedIndex} is malformed.`);
    }
    assertSafeRelativePath(operation.path, "operation path");
  }
  for (const phase of ["before", "after"] as const) {
    const payload = operation[phase];
    if (payload === undefined) continue;
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      throw new Error(`Transaction operation ${expectedIndex} ${phase} payload is malformed.`);
    }
    const storedPayload = payload as Record<string, unknown>;
    assertExactKeys(
      storedPayload,
      ["artifact", "sha256", "bytes"],
      `Transaction operation ${expectedIndex} ${phase} payload`,
    );
    if (
      storedPayload.artifact !== artifactName(expectedIndex, phase) ||
      typeof storedPayload.sha256 !== "string" ||
      !SHA256_PATTERN.test(storedPayload.sha256) ||
      !Number.isSafeInteger(storedPayload.bytes) ||
      (storedPayload.bytes as number) < 0 ||
      (storedPayload.bytes as number) > MAX_TRANSACTION_PAYLOAD_BYTES
    ) {
      throw new Error(`Transaction operation ${expectedIndex} ${phase} payload is malformed.`);
    }
  }
  const before = operation.before as StoredPayload | undefined;
  const after = operation.after as StoredPayload | undefined;
  const expectedSourceSha256 = operation.expectedSourceSha256;
  const expectedDestinationState = operation.expectedDestinationState;
  if (action === "create") {
    if (
      before !== undefined ||
      after === undefined ||
      expectedSourceSha256 !== undefined ||
      expectedDestinationState !== "absent" ||
      operation.sourcePath !== undefined ||
      operation.destinationPath !== undefined
    ) {
      throw new Error(`Transaction operation ${expectedIndex} create state is malformed.`);
    }
  } else if (action === "update") {
    if (
      before === undefined ||
      after === undefined ||
      expectedSourceSha256 !== before.sha256 ||
      expectedDestinationState !== undefined ||
      operation.sourcePath !== undefined ||
      operation.destinationPath !== undefined
    ) {
      throw new Error(`Transaction operation ${expectedIndex} update state is malformed.`);
    }
  } else if (action === "remove") {
    if (
      before === undefined ||
      after !== undefined ||
      expectedSourceSha256 !== before.sha256 ||
      expectedDestinationState !== undefined ||
      operation.sourcePath !== undefined ||
      operation.destinationPath !== undefined
    ) {
      throw new Error(`Transaction operation ${expectedIndex} remove state is malformed.`);
    }
  } else if (
    before === undefined ||
    after === undefined ||
    expectedSourceSha256 !== before.sha256 ||
    expectedDestinationState !== "absent" ||
    operation.path !== undefined
  ) {
    throw new Error(`Transaction operation ${expectedIndex} move state is malformed.`);
  }
}

async function readAndVerifyPayload(
  transactionDirectory: string,
  payload: StoredPayload,
): Promise<Buffer> {
  const bytes = await readPrivateFile(
    path.join(transactionDirectory, payload.artifact),
    `Transaction payload ${payload.artifact}`,
    MAX_TRANSACTION_PAYLOAD_BYTES,
  );
  if (bytes.byteLength !== payload.bytes || sha256(bytes) !== payload.sha256) {
    throw new Error(`Transaction payload ${payload.artifact} failed integrity verification.`);
  }
  return bytes;
}

export async function openVerifiedKnowledgeTransaction({
  repoRoot,
  transactionId,
}: {
  repoRoot: string;
  transactionId: string;
}): Promise<VerifiedKnowledgeTransaction> {
  assertTransactionId(transactionId);
  const paths = await resolveKnowledgeTransactionPaths(repoRoot);
  const transactionDirectory = path.join(paths.transactionRoot, transactionId);
  await assertRealDirectory(transactionDirectory, `Transaction ${transactionId}`, 0o700);
  const rootInventory = (await readdir(transactionDirectory, { withFileTypes: true })).sort(
    (left, right) => left.name.localeCompare(right.name),
  );
  const allowedRootEntries = new Set<string>([
    MANIFEST_NAME,
    JOURNAL_NAME,
    PAYLOAD_DIRECTORY_NAME,
    TERMINAL_RECEIPT_DIRECTORY_NAME,
    UNFINISHED_MARKER_NAME,
  ]);
  if (
    rootInventory.some((entry) => !allowedRootEntries.has(entry.name)) ||
    !rootInventory.some((entry) => entry.name === MANIFEST_NAME && entry.isFile()) ||
    !rootInventory.some((entry) => entry.name === JOURNAL_NAME && entry.isFile()) ||
    !rootInventory.some(
      (entry) => entry.name === PAYLOAD_DIRECTORY_NAME && entry.isDirectory(),
    ) ||
    !rootInventory.some(
      (entry) =>
        entry.name === TERMINAL_RECEIPT_DIRECTORY_NAME && entry.isDirectory(),
    ) ||
    rootInventory.some(
      (entry) =>
        (entry.name === MANIFEST_NAME ||
          entry.name === JOURNAL_NAME ||
          entry.name === UNFINISHED_MARKER_NAME) &&
        !entry.isFile(),
    ) ||
    rootInventory.some(
      (entry) =>
        (entry.name === PAYLOAD_DIRECTORY_NAME ||
          entry.name === TERMINAL_RECEIPT_DIRECTORY_NAME) &&
        !entry.isDirectory(),
    )
  ) {
    throw new Error(`Transaction ${transactionId} root inventory is malformed.`);
  }
  await assertRealDirectory(
    path.join(transactionDirectory, PAYLOAD_DIRECTORY_NAME),
    `Transaction ${transactionId} payload directory`,
    0o700,
  );
  await assertRealDirectory(
    path.join(transactionDirectory, TERMINAL_RECEIPT_DIRECTORY_NAME),
    `Transaction ${transactionId} terminal receipt directory`,
    0o700,
  );
  const manifestBytes = await readPrivateFile(
    path.join(transactionDirectory, MANIFEST_NAME),
    `Transaction ${transactionId} manifest`,
    MAX_MANIFEST_BYTES,
  );
  let parsed: unknown;
  try {
    parsed = JSON.parse(manifestBytes.toString("utf8"));
  } catch {
    throw new Error(`Transaction ${transactionId} manifest is not valid JSON.`);
  }
  assertStoredManifest(parsed);
  const manifest = parsed as StoredManifest;
  if (manifest.transactionId !== transactionId) {
    throw new Error(`Transaction ${transactionId} manifest identity does not match its directory.`);
  }
  if (
    manifest.operationCount !== manifest.operations.length ||
    manifest.operationCount === 0 ||
    manifest.operationCount > MAX_TRANSACTION_OPERATIONS ||
    manifest.totalPayloadBytes < 0 ||
    manifest.totalPayloadBytes > MAX_TRANSACTION_TOTAL_BYTES
  ) {
    throw new Error(`Transaction ${transactionId} manifest resource counts are invalid.`);
  }
  const snapshot = validateSnapshot(manifest.snapshot);
  if (sha256(canonicalJson(snapshot)) !== manifest.snapshotSha256) {
    throw new Error(`Transaction ${transactionId} snapshot hash does not match.`);
  }

  let totalBytes = 0;
  const expectedArtifacts = new Set<string>();
  const operations: VerifiedKnowledgeTransactionOperation[] = [];
  const operationInputs: KnowledgeTransactionOperationInput[] = [];
  for (let offset = 0; offset < manifest.operations.length; offset += 1) {
    const operation = manifest.operations[offset];
    validateStoredOperation(operation, offset);
    let beforeBytes: Buffer | undefined;
    let afterBytes: Buffer | undefined;
    if (operation.before) {
      expectedArtifacts.add(path.basename(operation.before.artifact));
      beforeBytes = await readAndVerifyPayload(transactionDirectory, operation.before);
      totalBytes += beforeBytes.byteLength;
    }
    if (operation.after) {
      expectedArtifacts.add(path.basename(operation.after.artifact));
      afterBytes = await readAndVerifyPayload(transactionDirectory, operation.after);
      totalBytes += afterBytes.byteLength;
    }
    operations.push({ ...operation, beforeBytes, afterBytes });
    if (operation.action === "create") {
      operationInputs.push({
        action: "create",
        path: operation.path!,
        afterBytes: afterBytes!,
      });
    } else if (operation.action === "update") {
      operationInputs.push({
        action: "update",
        path: operation.path!,
        beforeBytes: beforeBytes!,
        afterBytes: afterBytes!,
      });
    } else if (operation.action === "remove") {
      operationInputs.push({
        action: "remove",
        path: operation.path!,
        beforeBytes: beforeBytes!,
      });
    } else {
      operationInputs.push({
        action: "move",
        sourcePath: operation.sourcePath!,
        destinationPath: operation.destinationPath!,
        beforeBytes: beforeBytes!,
        afterBytes: afterBytes!,
      });
    }
  }
  const actualArtifacts = await readdir(path.join(transactionDirectory, PAYLOAD_DIRECTORY_NAME));
  if (
    actualArtifacts.length !== expectedArtifacts.size ||
    actualArtifacts.some((entry) => !expectedArtifacts.has(entry))
  ) {
    throw new Error(`Transaction ${transactionId} payload inventory does not match its manifest.`);
  }
  if (totalBytes !== manifest.totalPayloadBytes) {
    throw new Error(`Transaction ${transactionId} payload total does not match its manifest.`);
  }
  const rebuilt = validateOperations(operationInputs, snapshot);
  if (canonicalJson(rebuilt.stored) !== canonicalJson(manifest.operations)) {
    throw new Error(`Transaction ${transactionId} operation metadata is inconsistent.`);
  }
  await readKnowledgeTransactionJournal({ repoRoot, transactionId });
  await readTerminalReceipts(transactionDirectory, transactionId);
  await readUnfinishedMarkerIfPresent(transactionDirectory, transactionId);
  return {
    transactionId,
    kind: manifest.kind,
    command: manifest.command,
    createdAt: manifest.createdAt,
    operationCount: manifest.operationCount,
    totalPayloadBytes: manifest.totalPayloadBytes,
    snapshot,
    snapshotSha256: manifest.snapshotSha256,
    metadataSha256: manifest.metadataSha256,
    operations,
    transactionDirectory,
  };
}

function transactionDirectoryFor(lock: KnowledgeTransactionLock, transactionId: string): string {
  assertTransactionId(transactionId);
  return path.join(lock.transactionRoot, transactionId);
}

async function assertTransactionWriter(
  lock: KnowledgeTransactionLock,
  transactionId: string,
): Promise<string> {
  await assertLockStillOwned(lock);
  if (lock.transactionId && lock.transactionId !== transactionId) {
    throw new Error("Writer lock is scoped to a different transaction.");
  }
  const transactionDirectory = transactionDirectoryFor(lock, transactionId);
  await assertRealDirectory(transactionDirectory, `Transaction ${transactionId}`, 0o700);
  return transactionDirectory;
}

function validateJournalEvent(value: unknown, transactionId: string, sequence: number): StoredJournalEvent {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Transaction ${transactionId} journal line ${sequence} is malformed.`);
  }
  const event = value as Record<string, unknown>;
  const ownershipEvent = event.event === "artifact-ownership-recorded";
  assertExactKeys(
    event,
    [
      "storeVersion",
      "transactionId",
      "sequence",
      "timestamp",
      "event",
      ...(event.operationIndex === undefined ? [] : ["operationIndex"]),
      ...(event.reasonCode === undefined ? [] : ["reasonCode"]),
      ...(ownershipEvent
        ? [
            "canonicalSourcePath",
            "artifactRole",
            "artifactKind",
            "artifactSourcePath",
            "identityDev",
            "identityIno",
            "identityUid",
            "identityBirthtimeNs",
            "byteLength",
            "sha256",
            "mode",
          ]
        : []),
      "metadataSha256",
    ],
    `Transaction ${transactionId} journal line ${sequence}`,
  );
  assertMetadataHash(event, `Transaction ${transactionId} journal line ${sequence}`);
  if (
    event.storeVersion !== STORE_VERSION ||
    event.transactionId !== transactionId ||
    event.sequence !== sequence ||
    typeof event.timestamp !== "string" ||
    typeof event.event !== "string" ||
    !JOURNAL_EVENTS.has(event.event)
  ) {
    throw new Error(`Transaction ${transactionId} journal line ${sequence} is malformed.`);
  }
  if (ownershipEvent) {
    if (
      !Number.isSafeInteger(event.operationIndex) ||
      (event.operationIndex as number) < 0 ||
      (event.operationIndex as number) > 9999 ||
      typeof event.canonicalSourcePath !== "string" ||
      typeof event.artifactSourcePath !== "string" ||
      typeof event.artifactRole !== "string" ||
      !CANONICAL_ARTIFACT_ROLES.has(event.artifactRole) ||
      typeof event.artifactKind !== "string" ||
      !CANONICAL_ARTIFACT_KINDS.has(event.artifactKind) ||
      typeof event.identityDev !== "string" ||
      !UNSIGNED_DECIMAL_PATTERN.test(event.identityDev) ||
      typeof event.identityIno !== "string" ||
      !UNSIGNED_DECIMAL_PATTERN.test(event.identityIno) ||
      typeof event.identityUid !== "string" ||
      !UNSIGNED_DECIMAL_PATTERN.test(event.identityUid) ||
      !(
        event.identityBirthtimeNs === null ||
        (typeof event.identityBirthtimeNs === "string" &&
          UNSIGNED_DECIMAL_PATTERN.test(event.identityBirthtimeNs))
      ) ||
      typeof event.byteLength !== "string" ||
      !UNSIGNED_DECIMAL_PATTERN.test(event.byteLength) ||
      typeof event.sha256 !== "string" ||
      !SHA256_PATTERN.test(event.sha256) ||
      !Number.isInteger(event.mode) ||
      (event.mode as number) < 0 ||
      (event.mode as number) > 0o7777 ||
      event.reasonCode !== undefined
    ) {
      throw new Error(
        `Transaction ${transactionId} journal line ${sequence} has malformed artifact ownership proof.`,
      );
    }
    assertSafeRelativePath(event.canonicalSourcePath, "canonical ownership source path");
    assertSafeRelativePath(event.artifactSourcePath, "canonical ownership artifact path");
  } else if (
    event.canonicalSourcePath !== undefined ||
    event.artifactRole !== undefined ||
    event.artifactKind !== undefined ||
    event.artifactSourcePath !== undefined ||
    event.identityDev !== undefined ||
    event.identityIno !== undefined ||
    event.identityUid !== undefined ||
    event.identityBirthtimeNs !== undefined ||
    event.byteLength !== undefined ||
    event.sha256 !== undefined ||
    event.mode !== undefined
  ) {
    throw new Error(
      `Transaction ${transactionId} journal line ${sequence} has unexpected artifact ownership fields.`,
    );
  }
  assertIsoTimestamp(event.timestamp, `Transaction ${transactionId} journal timestamp`);
  if (
    event.operationIndex !== undefined &&
    (!Number.isSafeInteger(event.operationIndex) || (event.operationIndex as number) < 0)
  ) {
    throw new Error(`Transaction ${transactionId} journal line ${sequence} has an invalid operation index.`);
  }
  if (
    event.reasonCode !== undefined &&
    (typeof event.reasonCode !== "string" ||
      !/^[a-z0-9][a-z0-9:_-]{0,63}$/.test(event.reasonCode))
  ) {
    throw new Error(`Transaction ${transactionId} journal line ${sequence} has an invalid reason code.`);
  }
  return event as StoredJournalEvent;
}

function parseKnowledgeTransactionJournal(
  bytes: Buffer,
  transactionId: string,
): KnowledgeTransactionJournal {
  const text = bytes.toString("utf8");
  const tornFinalLine = text.length > 0 && !text.endsWith("\n");
  const parts = text.split("\n");
  if (parts.at(-1) === "") parts.pop();
  if (tornFinalLine) parts.pop();
  const events = parts.map((line, offset) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(line);
    } catch {
      throw new Error(`Transaction ${transactionId} journal line ${offset + 1} is corrupt.`);
    }
    return validateJournalEvent(parsed, transactionId, offset + 1);
  });
  return { events, tornFinalLine };
}

async function readKnowledgeTransactionJournalWithSnapshot({
  repoRoot,
  transactionId,
}: {
  repoRoot: string;
  transactionId: string;
}): Promise<Readonly<{
  journal: KnowledgeTransactionJournal;
  snapshot: PrivateFileSnapshot;
}>> {
  assertTransactionId(transactionId);
  const paths = await resolveKnowledgeTransactionPaths(repoRoot);
  const transactionDirectory = path.join(paths.transactionRoot, transactionId);
  await assertRealDirectory(transactionDirectory, `Transaction ${transactionId}`, 0o700);
  const snapshot = await readPrivateFileSnapshot(
    path.join(transactionDirectory, JOURNAL_NAME),
    `Transaction ${transactionId} journal`,
    MAX_JOURNAL_BYTES,
  );
  return Object.freeze({
    journal: parseKnowledgeTransactionJournal(snapshot.bytes, transactionId),
    snapshot,
  });
}

export async function readKnowledgeTransactionJournal({
  repoRoot,
  transactionId,
}: {
  repoRoot: string;
  transactionId: string;
}): Promise<KnowledgeTransactionJournal> {
  return (
    await readKnowledgeTransactionJournalWithSnapshot({ repoRoot, transactionId })
  ).journal;
}

export async function truncateTornKnowledgeTransactionJournal({
  lock,
  transactionId,
  dependencies: injectedDependencies,
}: {
  lock: KnowledgeTransactionLock;
  transactionId: string;
  dependencies?: TransactionStoreDependencies;
}): Promise<KnowledgeTransactionJournal> {
  const active = assertActiveLock(lock);
  if (!active.recoveryCapable || lock.transactionId !== transactionId) {
    throw new Error(
      "Truncating a torn journal requires a recovery-capable lock scoped to the transaction.",
    );
  }
  const transactionDirectory = await assertTransactionWriter(lock, transactionId);
  const currentRead = await readKnowledgeTransactionJournalWithSnapshot({
    repoRoot: lock.repositoryRoot,
    transactionId,
  });
  const current = currentRead.journal;
  if (!current.tornFinalLine) return current;

  const journalPath = path.join(transactionDirectory, JOURNAL_NAME);
  const bytes = currentRead.snapshot.bytes;
  const lastCompleteNewline = bytes.lastIndexOf(0x0a);
  const truncateTo = lastCompleteNewline < 0 ? 0 : lastCompleteNewline + 1;
  const dependencies = resolvedDependencies(injectedDependencies);
  const activeOwner = assertActiveLock(lock);
  await writePrivateFileAtomicReplace({
    filePath: journalPath,
    bytes: bytes.subarray(0, truncateTo),
    expectedDestination: currentRead.snapshot,
    owner: {
      lockId: activeOwner.lockId,
      pid: activeOwner.pid,
      hostname: activeOwner.hostname,
    },
    dependencies,
    scope: "journal",
  });
  await notifyStoreMutation(dependencies, {
    kind: "journal-truncated",
    scope: "journal",
    artifact: JOURNAL_NAME,
  });
  const repaired = await readKnowledgeTransactionJournal({
    repoRoot: lock.repositoryRoot,
    transactionId,
  });
  if (repaired.tornFinalLine) {
    throw new Error(`Transaction ${transactionId} torn journal could not be repaired.`);
  }
  return repaired;
}

export async function appendKnowledgeTransactionJournalEvent({
  lock,
  transactionId,
  event,
  dependencies: injectedDependencies,
}: {
  lock: KnowledgeTransactionLock;
  transactionId: string;
  event: KnowledgeTransactionJournalEventInput;
  dependencies?: TransactionStoreDependencies;
}): Promise<StoredJournalEvent> {
  const transactionDirectory = await assertTransactionWriter(lock, transactionId);
  if (!JOURNAL_EVENTS.has(event.event)) throw new Error("Journal event type is invalid.");
  if (
    event.operationIndex !== undefined &&
    (!Number.isSafeInteger(event.operationIndex) || event.operationIndex < 0)
  ) {
    throw new Error("Journal operation index is invalid.");
  }
  if (event.event === "artifact-ownership-recorded") {
    validateJournalEvent(
      metadataWithHash({
        storeVersion: STORE_VERSION,
        transactionId,
        sequence: 1,
        timestamp: (injectedDependencies?.now ?? (() => new Date()))().toISOString(),
        ...event,
      }),
      transactionId,
      1,
    );
  }
  const reasonCode = "reasonCode" in event ? event.reasonCode : undefined;
  if (
    reasonCode !== undefined &&
    !/^[a-z0-9][a-z0-9:_-]{0,63}$/.test(reasonCode)
  ) {
    throw new Error("Journal reason code is invalid.");
  }
  const currentRead = await readKnowledgeTransactionJournalWithSnapshot({
    repoRoot: lock.repositoryRoot,
    transactionId,
  });
  const journal = currentRead.journal;
  if (journal.tornFinalLine) {
    throw new Error("Transaction journal has a torn final line and requires recovery.");
  }
  const dependencies = resolvedDependencies(injectedDependencies);
  const base: StoredJournalEventBase = {
    storeVersion: STORE_VERSION,
    transactionId,
    sequence: journal.events.length + 1,
    timestamp: dependencies.now().toISOString(),
    event: event.event,
    ...(event.operationIndex === undefined ? {} : { operationIndex: event.operationIndex }),
    ...(reasonCode === undefined ? {} : { reasonCode }),
    ...(event.event !== "artifact-ownership-recorded"
      ? {}
      : {
          canonicalSourcePath: event.canonicalSourcePath,
          artifactRole: event.artifactRole,
          artifactKind: event.artifactKind,
          artifactSourcePath: event.artifactSourcePath,
          identityDev: event.identityDev,
          identityIno: event.identityIno,
          identityUid: event.identityUid,
          identityBirthtimeNs: event.identityBirthtimeNs,
          byteLength: event.byteLength,
          sha256: event.sha256,
          mode: event.mode,
        }),
  };
  const stored = metadataWithHash(base);
  const journalPath = path.join(transactionDirectory, JOURNAL_NAME);
  const journalBytes = currentRead.snapshot.bytes;
  const eventBytes = Buffer.from(`${canonicalJson(stored)}\n`, "utf8");
  if (journalBytes.byteLength + eventBytes.byteLength > MAX_JOURNAL_BYTES) {
    throw new Error("Transaction journal exceeds its maximum allowed size.");
  }
  const activeOwner = assertActiveLock(lock);
  await writePrivateFileAtomicReplace({
    filePath: journalPath,
    bytes: Buffer.concat([journalBytes, eventBytes]),
    expectedDestination: currentRead.snapshot,
    owner: {
      lockId: activeOwner.lockId,
      pid: activeOwner.pid,
      hostname: activeOwner.hostname,
    },
    dependencies,
    scope: "journal",
  });
  await notifyStoreMutation(dependencies, {
    kind: "journal-appended",
    scope: "journal",
    artifact: JOURNAL_NAME,
  });
  return stored;
}

function assertMarker(value: unknown, transactionId: string): void {
  assertKnowledgeUnfinishedMarker(value, transactionId);
}

async function readUnfinishedMarkerIfPresent(
  transactionDirectory: string,
  transactionId: string,
): Promise<Record<string, unknown> | null> {
  const markerPath = path.join(transactionDirectory, UNFINISHED_MARKER_NAME);
  const info = await lstat(markerPath).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (!info) return null;
  if (info.isSymbolicLink() || !info.isFile()) {
    throw new Error(`Transaction ${transactionId} unfinished marker is unsafe.`);
  }
  assertOwnerOnlyMode(
    info.mode,
    0o600,
    `Transaction ${transactionId} unfinished marker`,
  );
  const bytes = await readPrivateFile(
    markerPath,
    `Transaction ${transactionId} unfinished marker`,
    64 * 1024,
  );
  let parsed: unknown;
  try {
    parsed = JSON.parse(bytes.toString("utf8"));
  } catch {
    throw new Error(`Transaction ${transactionId} unfinished marker is malformed.`);
  }
  assertMarker(parsed, transactionId);
  return parsed as Record<string, unknown>;
}

export async function markKnowledgeTransactionUnfinished({
  lock,
  transactionId,
  phase,
  dependencies: injectedDependencies,
}: {
  lock: KnowledgeTransactionLock;
  transactionId: string;
  phase: "apply" | "recover";
  dependencies?: TransactionStoreDependencies;
}): Promise<void> {
  const transactionDirectory = await assertTransactionWriter(lock, transactionId);
  const markerPath = path.join(transactionDirectory, UNFINISHED_MARKER_NAME);
  const existing = await readUnfinishedMarkerIfPresent(
    transactionDirectory,
    transactionId,
  );
  if (existing) {
    return;
  }
  const dependencies = resolvedDependencies(injectedDependencies);
  const marker = metadataWithHash({
    storeVersion: STORE_VERSION,
    transactionId,
    phase,
    createdAt: dependencies.now().toISOString(),
  });
  const activeOwner = assertActiveLock(lock);
  await writePrivateFileAtomicExclusive({
    filePath: markerPath,
    bytes: `${canonicalJson(marker)}\n`,
    owner: {
      lockId: activeOwner.lockId,
      pid: activeOwner.pid,
      hostname: activeOwner.hostname,
    },
    dependencies,
    scope: "transaction-control",
  });
}

type StoredTerminalReceipt = {
  storeVersion: number;
  transactionId: string;
  outcome: "applied" | "recovered";
  completedAt: string;
  validationSha256: string;
  journalHeadSha256: string;
  metadataSha256: string;
};

function assertTerminalReceipt(value: unknown, transactionId: string): asserts value is StoredTerminalReceipt {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Transaction ${transactionId} terminal receipt is malformed.`);
  }
  const receipt = value as Record<string, unknown>;
  assertExactKeys(
    receipt,
    [
      "storeVersion",
      "transactionId",
      "outcome",
      "completedAt",
      "validationSha256",
      "journalHeadSha256",
      "metadataSha256",
    ],
    `Transaction ${transactionId} terminal receipt`,
  );
  assertMetadataHash(receipt, `Transaction ${transactionId} terminal receipt`);
  if (
    receipt.storeVersion !== STORE_VERSION ||
    receipt.transactionId !== transactionId ||
    !["applied", "recovered"].includes(String(receipt.outcome)) ||
    typeof receipt.completedAt !== "string" ||
    typeof receipt.validationSha256 !== "string" ||
    !SHA256_PATTERN.test(receipt.validationSha256) ||
    typeof receipt.journalHeadSha256 !== "string" ||
    !SHA256_PATTERN.test(receipt.journalHeadSha256)
  ) {
    throw new Error(`Transaction ${transactionId} terminal receipt is malformed.`);
  }
  assertIsoTimestamp(receipt.completedAt, `Transaction ${transactionId} terminal receipt completedAt`);
}

async function readTerminalReceipts(
  transactionDirectory: string,
  transactionId: string,
): Promise<StoredTerminalReceipt[]> {
  const receiptDirectory = path.join(
    transactionDirectory,
    TERMINAL_RECEIPT_DIRECTORY_NAME,
  );
  await assertRealDirectory(
    receiptDirectory,
    `Transaction ${transactionId} terminal receipt directory`,
    0o700,
  );
  const entries = (await readdir(receiptDirectory)).sort();
  const receipts: StoredTerminalReceipt[] = [];
  for (let offset = 0; offset < entries.length; offset += 1) {
    const expectedPrefix = `receipt-${String(offset + 1).padStart(4, "0")}-`;
    const entry = entries[offset];
    if (
      !entry.startsWith(expectedPrefix) ||
      !/receipt-\d{4}-(applied|recovered)\.json$/.test(entry)
    ) {
      throw new Error(`Transaction ${transactionId} terminal receipt inventory is malformed.`);
    }
    const bytes = await readPrivateFile(
      path.join(receiptDirectory, entry),
      `Transaction ${transactionId} terminal receipt ${offset + 1}`,
      64 * 1024,
    );
    let parsed: unknown;
    try {
      parsed = JSON.parse(bytes.toString("utf8"));
    } catch {
      throw new Error(`Transaction ${transactionId} terminal receipt ${offset + 1} is malformed.`);
    }
    assertTerminalReceipt(parsed, transactionId);
    if (!entry.endsWith(`-${parsed.outcome}.json`)) {
      throw new Error(`Transaction ${transactionId} terminal receipt filename and outcome disagree.`);
    }
    receipts.push(parsed);
  }
  return receipts;
}

export async function writeKnowledgeTransactionTerminalReceipt({
  lock,
  transactionId,
  outcome,
  validationSha256,
  dependencies: injectedDependencies,
}: {
  lock: KnowledgeTransactionLock;
  transactionId: string;
  outcome: "applied" | "recovered";
  validationSha256: string;
  dependencies?: TransactionStoreDependencies;
}): Promise<void> {
  assertSha256(validationSha256, "Terminal validation hash");
  const transactionDirectory = await assertTransactionWriter(lock, transactionId);
  const journal = await readKnowledgeTransactionJournal({
    repoRoot: lock.repositoryRoot,
    transactionId,
  });
  if (journal.tornFinalLine || journal.events.length === 0) {
    throw new Error("Terminal receipt requires a complete terminal journal event.");
  }
  const terminalEvent = outcome === "applied" ? "apply-completed" : "recovery-completed";
  const journalHead = journal.events.at(-1)!;
  if (journalHead.event !== terminalEvent) {
    throw new Error(`Terminal receipt requires ${terminalEvent} as the journal head.`);
  }
  const existingReceipts = await readTerminalReceipts(
    transactionDirectory,
    transactionId,
  );
  const matchingReceipt = existingReceipts.find(
    (receipt) =>
      receipt.outcome === outcome &&
      receipt.journalHeadSha256 === journalHead.metadataSha256 &&
      receipt.validationSha256 === validationSha256,
  );
  if (matchingReceipt) return;
  const dependencies = resolvedDependencies(injectedDependencies);
  const receipt = metadataWithHash({
    storeVersion: STORE_VERSION,
    transactionId,
    outcome,
    completedAt: dependencies.now().toISOString(),
    validationSha256,
    journalHeadSha256: journalHead.metadataSha256,
  });
  const activeOwner = assertActiveLock(lock);
  await writePrivateFileAtomicExclusive({
    filePath: path.join(
      transactionDirectory,
      TERMINAL_RECEIPT_DIRECTORY_NAME,
      `receipt-${String(existingReceipts.length + 1).padStart(4, "0")}-${outcome}.json`,
    ),
    bytes: `${canonicalJson(receipt)}\n`,
    owner: {
      lockId: activeOwner.lockId,
      pid: activeOwner.pid,
      hostname: activeOwner.hostname,
    },
    dependencies,
    scope: "transaction-control",
  });
}

export async function clearKnowledgeTransactionUnfinished({
  lock,
  transactionId,
  expectedOutcome,
}: {
  lock: KnowledgeTransactionLock;
  transactionId: string;
  expectedOutcome: "applied" | "recovered";
}): Promise<void> {
  const transactionDirectory = await assertTransactionWriter(lock, transactionId);
  const markerPath = path.join(transactionDirectory, UNFINISHED_MARKER_NAME);
  const markerBytes = await readPrivateFile(
    markerPath,
    `Transaction ${transactionId} unfinished marker`,
    64 * 1024,
  );
  let marker: unknown;
  try {
    marker = JSON.parse(markerBytes.toString("utf8"));
  } catch {
    throw new Error(`Transaction ${transactionId} unfinished marker is malformed.`);
  }
  assertMarker(marker, transactionId);
  const receipts = await readTerminalReceipts(transactionDirectory, transactionId);
  const receipt = receipts.at(-1);
  if (!receipt || receipt.outcome !== expectedOutcome) {
    throw new Error(`Transaction ${transactionId} has no matching terminal receipt.`);
  }
  const journal = await readKnowledgeTransactionJournal({
    repoRoot: lock.repositoryRoot,
    transactionId,
  });
  const terminalEvent = expectedOutcome === "applied" ? "apply-completed" : "recovery-completed";
  const head = journal.events.at(-1);
  if (
    journal.tornFinalLine ||
    !head ||
    head.event !== terminalEvent ||
    head.metadataSha256 !== receipt.journalHeadSha256
  ) {
    throw new Error(`Transaction ${transactionId} terminal journal proof does not match its receipt.`);
  }
  const active = assertActiveLock(lock);
  await notifyStoreMutation(active.dependencies, {
    kind: "file-removal-ready",
    scope: "transaction-control",
    artifact: UNFINISHED_MARKER_NAME,
  });
  const finalMarker = await readUnfinishedMarkerIfPresent(
    transactionDirectory,
    transactionId,
  );
  if (!finalMarker) {
    throw new Error(`Transaction ${transactionId} unfinished marker disappeared before removal.`);
  }
  await unlink(markerPath);
  await notifyStoreMutation(active.dependencies, {
    kind: "file-unlinked-unsynced",
    scope: "transaction-control",
    artifact: UNFINISHED_MARKER_NAME,
  });
  await fsyncDirectory(transactionDirectory);
  await notifyStoreMutation(active.dependencies, {
    kind: "file-removed",
    scope: "transaction-control",
    artifact: UNFINISHED_MARKER_NAME,
  });
}

async function transactionRootEntries(repoRoot: string): Promise<{
  paths: KnowledgeTransactionPaths;
  transactionIds: string[];
}> {
  const paths = await resolveKnowledgeTransactionPaths(repoRoot);
  const rootExists = await lstat(paths.transactionRoot).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (!rootExists) return { paths, transactionIds: [] };
  const dependencies = resolvedDependencies();
  let lastTransientError = "unknown live transition";
  for (let attempt = 0; attempt < 200; attempt += 1) {
    try {
      const entries = await readdir(paths.transactionRoot, { withFileTypes: true });
      const writerEntry = entries.find((entry) => entry.name === LOCK_DIRECTORY_NAME);
      let liveWriterOwnsRecovery = false;
      if (writerEntry) {
        if (!writerEntry.isDirectory()) {
          throw new Error("Knowledge transaction root contains an unrecognized artifact.");
        }
        const writer = await readExistingLock(paths.lockDirectory);
        liveWriterOwnsRecovery =
          writer.hostname === dependencies.hostname() && dependencies.isPidAlive(writer.pid);
      }

      const transactionIds: string[] = [];
      for (const entry of entries) {
        if (entry.name === LOCK_DIRECTORY_NAME) continue;
        if (entry.name === CERTIFICATION_LEASE_ROOT_NAME) {
          if (!entry.isDirectory()) {
            throw new Error("Knowledge transaction root contains an unrecognized artifact.");
          }
          await inspectCertificationLeases({
            paths,
            recoveryCapable: false,
            allowLiveLeases: true,
            dependencies,
          });
          continue;
        }
        if (entry.name === SCOPED_WRITER_ROOT_NAME) {
          if (!entry.isDirectory()) {
            throw new Error("Knowledge transaction root contains an unrecognized artifact.");
          }
          await inspectScopedWriters({
            paths,
            recoveryCapable: false,
            allowLiveWriters: true,
            dependencies,
          });
          continue;
        }
        if (
          entry.name.startsWith(".reclaimed-writer-lock-") ||
          entry.name.startsWith(".removing-writer-lock-")
        ) {
          const recovery = parseWriterLockRecoveryName(entry.name);
          if (!recovery || !entry.isDirectory()) {
            throw new Error("Knowledge transaction root contains an unsafe recovery artifact.");
          }
          if (liveWriterOwnsRecovery) {
            throw new Error("Interrupted writer-lock recovery still belongs to a live process.");
          }
          assertRecoverableOwner(
            recovery.owner,
            dependencies,
            "Interrupted writer-lock recovery",
          );
          throw new Error("An interrupted writer-lock recovery requires explicit recovery.");
        }
        if (entry.name.startsWith(".preparing-writer-lock-")) {
          const owner = parseWriterLockStagingName(entry.name);
          if (!owner || !entry.isDirectory()) {
            throw new Error("Knowledge transaction root contains an unsafe writer-lock publication.");
          }
          assertRecoverableOwner(
            owner,
            dependencies,
            "Interrupted writer-lock publication",
          );
          throw new Error("An interrupted writer-lock publication requires explicit recovery.");
        }
        if (entry.name.startsWith(".preparing-transaction-")) {
          const preparation = parseTransactionStagingName(entry.name);
          if (!preparation || !entry.isDirectory()) {
            throw new Error("Knowledge transaction root contains an unsafe preparation artifact.");
          }
          assertRecoverableOwner(
            preparation.owner,
            dependencies,
            "Interrupted transaction preparation",
          );
          throw new Error("An interrupted transaction preparation requires explicit recovery.");
        }
        if (!entry.isDirectory() || !KNOWLEDGE_TRANSACTION_ID_PATTERN.test(entry.name)) {
          throw new Error("Knowledge transaction root contains an unrecognized artifact.");
        }
        try {
          assertTransactionId(entry.name);
        } catch {
          throw new Error("Knowledge transaction root contains an unrecognized artifact.");
        }
        transactionIds.push(entry.name);
      }
      return { paths, transactionIds: transactionIds.sort() };
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      const message = (error as Error).message;
      const transientConcurrentRead =
        code === "ENOENT" ||
        /interrupted .* still belongs to a live process/i.test(message) ||
        message ===
          "Knowledge certification lease cannot be proven safe: Knowledge certification lease inventory is malformed.";
      if (!transientConcurrentRead) {
        throw error;
      }
      lastTransientError = message;
      await new Promise<void>((resolve) => setTimeout(resolve, 10));
    }
  }
  throw new Error(
    `Timed out waiting for a live store transition to finish: ${lastTransientError}`,
  );
}

export async function listUnfinishedKnowledgeTransactionIds({
  repoRoot,
}: {
  repoRoot: string;
}): Promise<string[]> {
  const { transactionIds } = await transactionRootEntries(repoRoot);
  const unfinished: string[] = [];
  for (const transactionId of transactionIds) {
    const transaction = await openVerifiedKnowledgeTransaction({
      repoRoot,
      transactionId,
    });
    if (
      await readUnfinishedMarkerIfPresent(
        transaction.transactionDirectory,
        transactionId,
      )
    ) {
      unfinished.push(transactionId);
    }
  }
  return unfinished;
}

export async function getKnowledgeTransactionStatus({
  repoRoot,
  transactionId,
}: {
  repoRoot: string;
  transactionId: string;
}): Promise<KnowledgeTransactionStatus> {
  const transaction = await openVerifiedKnowledgeTransaction({ repoRoot, transactionId });
  const journal = await readKnowledgeTransactionJournal({ repoRoot, transactionId });
  const marker = await readUnfinishedMarkerIfPresent(
    transaction.transactionDirectory,
    transactionId,
  );
  const receipts = await readTerminalReceipts(
    transaction.transactionDirectory,
    transactionId,
  );
  const journalHead = journal.tornFinalLine ? undefined : journal.events.at(-1);
  const receipt = journalHead
    ? [...receipts].reverse().find(
        (candidate) => candidate.journalHeadSha256 === journalHead.metadataSha256,
      )
    : undefined;
  return {
    transactionId,
    kind: transaction.kind,
    createdAt: transaction.createdAt,
    operationCount: transaction.operationCount,
    totalPayloadBytes: transaction.totalPayloadBytes,
    unfinished: Boolean(marker),
    terminalOutcome: receipt?.outcome ?? null,
    journalEventCount: journal.events.length,
    tornFinalJournalLine: journal.tornFinalLine,
  };
}

export async function listKnowledgeTransactionStatuses({
  repoRoot,
}: {
  repoRoot: string;
}): Promise<KnowledgeTransactionStatus[]> {
  const { transactionIds } = await transactionRootEntries(repoRoot);
  return Promise.all(
    transactionIds.map((transactionId) =>
      getKnowledgeTransactionStatus({ repoRoot, transactionId }),
    ),
  );
}
