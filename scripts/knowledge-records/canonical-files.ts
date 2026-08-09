import { constants } from "node:fs";
import { createHash } from "node:crypto";
import {
  chmod,
  link,
  lstat,
  open,
  realpath,
  rename,
  unlink,
} from "node:fs/promises";
import path from "node:path";

import {
  assertNoSymlinkComponents,
  parseCanonicalRecordSourcePath,
  parseTransactionId,
  resolveContainedPath,
} from "./path-safety";

const NO_FOLLOW = constants.O_NOFOLLOW ?? 0;
const WRITE_CHUNK_BYTES = 64 * 1024;

export const CANONICAL_DIRECTORY_SWAP_LIMIT =
  "Node on macOS does not expose directory-descriptor-relative link, rename, and unlink calls. " +
  "Chronicle verifies the parent directory identity before and after every mutation, but a malicious same-user process could swap a directory away and back entirely between those checks.";

export const CANONICAL_LEAF_ENTRY_RACE_LIMIT =
  "Node on macOS does not expose directory-descriptor-relative no-replace link, rename, and unlink calls. " +
  "Chronicle reopens leaf files with O_NOFOLLOW and rechecks device, inode, bytes, and mode immediately before path-based mutation, but a malicious same-user process could still replace a leaf entirely between that final check and the syscall.";

export type CanonicalFileState =
  | Readonly<{ state: "absent" }>
  | Readonly<{ state: "present"; bytes: Buffer; mode: number }>;

type InspectedFileState =
  | Readonly<{ state: "absent" }>
  | Readonly<{
      state: "present";
      bytes: Buffer;
      mode: number;
      dev: bigint | number;
      ino: bigint | number;
      uid: bigint | number;
      birthtimeNs: bigint | null;
    }>;

type PresentInspectedFileState = Extract<
  InspectedFileState,
  Readonly<{ state: "present" }>
>;

export type CanonicalMutation = Readonly<{
  index: number;
  action: "create" | "update" | "remove";
  sourcePath: string;
  beforeBytes: Buffer | null;
  beforeMode: number | null;
  afterBytes: Buffer | null;
  afterMode: number | null;
}>;

export type CanonicalFilesystemMutationEvent = Readonly<{
  phase: "apply" | "restore" | "cleanup";
  stage:
    | "partial-created"
    | "payload-written"
    | "mode-set"
    | "artifact-ready"
    | "anchor-created"
    | "canonical-captured"
    | "capture-cleaned"
    | "canonical-published"
    | "artifact-removed"
    | "unfamiliar-capture-restored";
  artifactRole:
    | "after-stage"
    | "before-stage"
    | "before-anchor"
    | "after-anchor"
    | "capture";
  sourcePath: string;
  artifactSourcePath: string;
}>;

export type CanonicalFilesystemPrimitiveEvent =
  CanonicalFilesystemMutationEvent &
    Readonly<{
      primitive: "create" | "write" | "chmod" | "link" | "rename" | "unlink";
      primitiveSourcePath: string;
      primitiveDestinationPath?: string;
      writeOffset?: number;
      writeLength?: number;
      writeTotalBytes?: number;
      writeOrdinal?: number;
    }>;

export type CanonicalRemovalAuthorizationRequest = Readonly<{
  phase: "apply" | "restore" | "cleanup";
  transactionId: string;
  operationIndex: number;
  sourcePath: string;
}>;

export type CanonicalArtifactKind =
  | "after-partial"
  | "after-stage"
  | "before-partial"
  | "before-stage"
  | "before-anchor"
  | "after-anchor"
  | "capture";

export type CanonicalArtifactOwnershipProof = Readonly<{
  transactionId: string;
  operationIndex: number;
  sourcePath: string;
  artifactRole: CanonicalFilesystemMutationEvent["artifactRole"];
  artifactKind: CanonicalArtifactKind;
  artifactSourcePath: string;
  identityDev: string;
  identityIno: string;
  identityUid: string;
  identityBirthtimeNs: string | null;
  byteLength: string;
  sha256: string;
  mode: number;
}>;

export type CanonicalFileDependencies = Readonly<{
  beforeFilesystemMutation?: (
    event: CanonicalFilesystemMutationEvent,
  ) => void | Promise<void>;
  afterFilesystemMutation?: (
    event: CanonicalFilesystemMutationEvent,
  ) => void | Promise<void>;
  afterFilesystemPrimitive?: (
    event: CanonicalFilesystemPrimitiveEvent,
  ) => void | Promise<void>;
  writeChunkBytes?: number;
  authorizeCompletedRemoval?: (
    request: CanonicalRemovalAuthorizationRequest,
  ) => boolean | Promise<boolean>;
  persistArtifactOwnershipProof?: (
    proof: CanonicalArtifactOwnershipProof,
  ) => void | Promise<void>;
  authorizeArtifactCleanup?: (
    proof: CanonicalArtifactOwnershipProof,
  ) => boolean | Promise<boolean>;
}>;

type DirectoryIdentity = Readonly<{
  absolutePath: string;
  relativePath: string;
  dev: bigint | number;
  ino: bigint | number;
}>;

type ArtifactRole = CanonicalFilesystemMutationEvent["artifactRole"];
type MutationPhase = CanonicalFilesystemMutationEvent["phase"];

type OperationArtifacts = Readonly<{
  afterStage: string;
  afterPartial: string;
  beforeStage: string;
  beforePartial: string;
  beforeAnchor: string;
  afterAnchor: string;
  capture: string;
}>;

const ARTIFACT_KIND_TO_ROLE: Readonly<Record<CanonicalArtifactKind, ArtifactRole>> =
  Object.freeze({
    "after-partial": "after-stage",
    "after-stage": "after-stage",
    "before-partial": "before-stage",
    "before-stage": "before-stage",
    "before-anchor": "before-anchor",
    "after-anchor": "after-anchor",
    capture: "capture",
  });

function isMissing(error: unknown): error is NodeJS.ErrnoException {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as NodeJS.ErrnoException).code === "ENOENT",
  );
}

function isAlreadyPresent(error: unknown): error is NodeJS.ErrnoException {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as NodeJS.ErrnoException).code === "EEXIST",
  );
}

function bytesDescription(expected: "before" | "after") {
  return `the transaction's ${expected} state`;
}

function assertMode(mode: number | null, label: string): asserts mode is number {
  if (!Number.isInteger(mode) || mode === null || mode < 0 || mode > 0o7777) {
    throw new Error(`${label} mode is invalid.`);
  }
}

function assertCanonicalMutationShape(operation: CanonicalMutation) {
  parseCanonicalRecordSourcePath(operation.sourcePath);
  if (!Number.isInteger(operation.index) || operation.index < 0 || operation.index > 9999) {
    throw new Error("Operation index is outside the supported range.");
  }
  if (operation.action === "create") {
    if (
      operation.beforeBytes !== null ||
      operation.beforeMode !== null ||
      operation.afterBytes === null
    ) {
      throw new Error(`Canonical create has an invalid recorded state: ${operation.sourcePath}.`);
    }
    assertMode(operation.afterMode, "Canonical create after");
    return;
  }
  if (operation.beforeBytes === null) {
    throw new Error(`Canonical ${operation.action} has no recorded before bytes.`);
  }
  assertMode(operation.beforeMode, `Canonical ${operation.action} before`);
  if (operation.action === "update") {
    if (operation.afterBytes === null) {
      throw new Error("Canonical update has no staged bytes.");
    }
    assertMode(operation.afterMode, "Canonical update after");
    return;
  }
  if (operation.afterBytes !== null || operation.afterMode !== null) {
    throw new Error(`Canonical remove has an invalid recorded after state: ${operation.sourcePath}.`);
  }
}

export function canonicalTemporarySourcePath(
  sourcePath: string,
  transactionId: string,
  operationIndex: number,
) {
  parseCanonicalRecordSourcePath(sourcePath);
  parseTransactionId(transactionId);
  if (!Number.isInteger(operationIndex) || operationIndex < 0 || operationIndex > 9999) {
    throw new Error("Operation index is outside the supported range.");
  }
  return `${path.posix.dirname(sourcePath)}/.chronicle-knowledge-${transactionId}-${String(operationIndex).padStart(4, "0")}.tmp`;
}

export function canonicalBackupSourcePath(
  sourcePath: string,
  transactionId: string,
  operationIndex: number,
) {
  return canonicalTemporarySourcePath(sourcePath, transactionId, operationIndex).replace(
    /\.tmp$/,
    ".before",
  );
}

function operationArtifacts(
  sourcePath: string,
  transactionId: string,
  operationIndex: number,
): OperationArtifacts {
  const afterStage = canonicalTemporarySourcePath(
    sourcePath,
    transactionId,
    operationIndex,
  );
  const stem = afterStage.slice(0, -4);
  return Object.freeze({
    afterStage,
    afterPartial: `${afterStage}.partial`,
    beforeStage: `${stem}.restore`,
    beforePartial: `${stem}.restore.partial`,
    beforeAnchor: `${stem}.before`,
    afterAnchor: `${stem}.after`,
    capture: `${stem}.capture`,
  });
}

function artifactSourcePathForKind(
  artifacts: OperationArtifacts,
  kind: CanonicalArtifactKind,
) {
  switch (kind) {
    case "after-partial":
      return artifacts.afterPartial;
    case "after-stage":
      return artifacts.afterStage;
    case "before-partial":
      return artifacts.beforePartial;
    case "before-stage":
      return artifacts.beforeStage;
    case "before-anchor":
      return artifacts.beforeAnchor;
    case "after-anchor":
      return artifacts.afterAnchor;
    case "capture":
      return artifacts.capture;
  }
}

export function assertCanonicalArtifactOwnershipProof(
  proof: CanonicalArtifactOwnershipProof,
  transactionId: string,
  operation: CanonicalMutation,
) {
  parseTransactionId(transactionId);
  assertCanonicalMutationShape(operation);
  const artifacts = operationArtifacts(
    operation.sourcePath,
    transactionId,
    operation.index,
  );
  if (
    proof.transactionId !== transactionId ||
    proof.operationIndex !== operation.index ||
    proof.sourcePath !== operation.sourcePath ||
    ARTIFACT_KIND_TO_ROLE[proof.artifactKind] !== proof.artifactRole ||
    artifactSourcePathForKind(artifacts, proof.artifactKind) !==
      proof.artifactSourcePath ||
    !/^(?:0|[1-9][0-9]{0,39})$/.test(proof.identityDev) ||
    !/^(?:0|[1-9][0-9]{0,39})$/.test(proof.identityIno) ||
    !/^(?:0|[1-9][0-9]{0,39})$/.test(proof.identityUid) ||
    !(
      proof.identityBirthtimeNs === null ||
      /^(?:0|[1-9][0-9]{0,39})$/.test(proof.identityBirthtimeNs)
    ) ||
    !/^(?:0|[1-9][0-9]{0,39})$/.test(proof.byteLength) ||
    !/^[a-f0-9]{64}$/.test(proof.sha256) ||
    !Number.isInteger(proof.mode) ||
    proof.mode < 0 ||
    proof.mode > 0o7777
  ) {
    throw new Error("Canonical artifact ownership proof is malformed or out of scope.");
  }
}

function ownershipProofFromState({
  transactionId,
  operation,
  artifactKind,
  state,
}: {
  transactionId: string;
  operation: CanonicalMutation;
  artifactKind: CanonicalArtifactKind;
  state: PresentInspectedFileState;
}): CanonicalArtifactOwnershipProof {
  const proof = Object.freeze({
    transactionId,
    operationIndex: operation.index,
    sourcePath: operation.sourcePath,
    artifactRole: ARTIFACT_KIND_TO_ROLE[artifactKind],
    artifactKind,
    artifactSourcePath: artifactSourcePathForKind(
      operationArtifacts(operation.sourcePath, transactionId, operation.index),
      artifactKind,
    ),
    identityDev: String(state.dev),
    identityIno: String(state.ino),
    identityUid: String(state.uid),
    identityBirthtimeNs:
      state.birthtimeNs === null || state.birthtimeNs === 0n
        ? null
        : state.birthtimeNs.toString(),
    byteLength: String(state.bytes.byteLength),
    sha256: createHash("sha256").update(state.bytes).digest("hex"),
    mode: state.mode,
  });
  assertCanonicalArtifactOwnershipProof(proof, transactionId, operation);
  return proof;
}

function proofMatchesState(
  proof: CanonicalArtifactOwnershipProof,
  state: PresentInspectedFileState,
  partial: boolean,
) {
  const identityMatches =
    proof.identityDev === String(state.dev) &&
    proof.identityIno === String(state.ino) &&
    proof.identityUid === String(state.uid) &&
    proof.identityBirthtimeNs ===
      (state.birthtimeNs === null || state.birthtimeNs === 0n
        ? null
        : state.birthtimeNs.toString());
  if (!identityMatches) return false;
  if (partial) return true;
  return (
    proof.byteLength === String(state.bytes.byteLength) &&
    proof.sha256 === createHash("sha256").update(state.bytes).digest("hex") &&
    proof.mode === state.mode
  );
}

async function persistOwnershipProof(
  dependencies: CanonicalFileDependencies,
  transactionId: string,
  operation: CanonicalMutation,
  artifactKind: CanonicalArtifactKind,
  state: PresentInspectedFileState,
) {
  const proof = ownershipProofFromState({
    transactionId,
    operation,
    artifactKind,
    state,
  });
  if (!dependencies.persistArtifactOwnershipProof) {
    throw new Error(
      `Canonical artifact ownership cannot be persisted: ${proof.artifactSourcePath}.`,
    );
  }
  await dependencies.persistArtifactOwnershipProof(proof);
  return proof;
}

async function persistEmptyPartialOwnershipProof(
  dependencies: CanonicalFileDependencies,
  transactionId: string,
  operation: CanonicalMutation,
  artifactKind: "after-partial" | "before-partial",
  handle: Awaited<ReturnType<typeof open>>,
) {
  const stat = await handle.stat({ bigint: true });
  if (!stat.isFile() || stat.size !== 0n) {
    throw new Error("New canonical partial is not an empty regular file.");
  }
  const state: PresentInspectedFileState = Object.freeze({
    state: "present",
    bytes: Buffer.alloc(0),
    mode: Number(stat.mode & 0o7777n),
    dev: stat.dev,
    ino: stat.ino,
    uid: stat.uid,
    birthtimeNs: stat.birthtimeNs > 0n ? stat.birthtimeNs : null,
  });
  await persistOwnershipProof(
    dependencies,
    transactionId,
    operation,
    artifactKind,
    state,
  );
}

async function captureDirectoryIdentity(
  repoRoot: string,
  sourcePath: string,
): Promise<DirectoryIdentity> {
  const relativePath = path.posix.dirname(sourcePath);
  await assertNoSymlinkComponents(repoRoot, relativePath);
  const absolutePath = resolveContainedPath(repoRoot, relativePath);
  const stat = await lstat(absolutePath);
  if (stat.isSymbolicLink() || !stat.isDirectory()) {
    throw new Error(`Canonical parent is not a real directory: ${relativePath}.`);
  }
  if ((await realpath(absolutePath)) !== absolutePath) {
    throw new Error(`Canonical parent uses a filesystem alias: ${relativePath}.`);
  }
  return Object.freeze({
    absolutePath,
    relativePath,
    dev: stat.dev,
    ino: stat.ino,
  });
}

async function assertDirectoryIdentity(identity: DirectoryIdentity) {
  const stat = await lstat(identity.absolutePath);
  if (
    stat.isSymbolicLink() ||
    !stat.isDirectory() ||
    stat.dev !== identity.dev ||
    stat.ino !== identity.ino ||
    (await realpath(identity.absolutePath)) !== identity.absolutePath
  ) {
    throw new Error(
      `Canonical parent directory identity changed: ${identity.relativePath}. ${CANONICAL_DIRECTORY_SWAP_LIMIT}`,
    );
  }
}

async function syncDirectory(identity: DirectoryIdentity) {
  await assertDirectoryIdentity(identity);
  const handle = await open(identity.absolutePath, constants.O_RDONLY | NO_FOLLOW);
  try {
    const stat = await handle.stat();
    if (!stat.isDirectory() || stat.dev !== identity.dev || stat.ino !== identity.ino) {
      throw new Error(`Canonical parent directory changed while opened: ${identity.relativePath}.`);
    }
    await handle.sync();
  } finally {
    await handle.close();
  }
  await assertDirectoryIdentity(identity);
}

async function notifyMutation(
  dependencies: CanonicalFileDependencies,
  phase: MutationPhase,
  stage: CanonicalFilesystemMutationEvent["stage"],
  artifactRole: ArtifactRole,
  sourcePath: string,
  artifactSourcePath: string,
) {
  await dependencies.afterFilesystemMutation?.({
    phase,
    stage,
    artifactRole,
    sourcePath,
    artifactSourcePath,
  });
}

async function notifyBeforeMutation(
  dependencies: CanonicalFileDependencies,
  phase: MutationPhase,
  stage: CanonicalFilesystemMutationEvent["stage"],
  artifactRole: ArtifactRole,
  sourcePath: string,
  artifactSourcePath: string,
) {
  await dependencies.beforeFilesystemMutation?.({
    phase,
    stage,
    artifactRole,
    sourcePath,
    artifactSourcePath,
  });
}

async function notifyPrimitiveMutation(
  dependencies: CanonicalFileDependencies,
  event: CanonicalFilesystemPrimitiveEvent,
) {
  await dependencies.afterFilesystemPrimitive?.(event);
}

async function isCompletedRemovalAuthorized(
  dependencies: CanonicalFileDependencies,
  request: CanonicalRemovalAuthorizationRequest,
) {
  return (await dependencies.authorizeCompletedRemoval?.(request)) === true;
}

async function readInspectedFileState(
  repoRoot: string,
  sourcePath: string,
  label: string,
): Promise<InspectedFileState> {
  const identity = await captureDirectoryIdentity(repoRoot, sourcePath);
  const absolutePath = resolveContainedPath(repoRoot, sourcePath);
  let initialStat;
  try {
    initialStat = await lstat(absolutePath, { bigint: true });
  } catch (error) {
    if (isMissing(error)) {
      await assertDirectoryIdentity(identity);
      return Object.freeze({ state: "absent" as const });
    }
    throw error;
  }
  if (initialStat.isSymbolicLink() || !initialStat.isFile()) {
    throw new Error(`${label} is not a regular file: ${sourcePath}.`);
  }
  const handle = await open(absolutePath, constants.O_RDONLY | NO_FOLLOW);
  try {
    const openedStat = await handle.stat({ bigint: true });
    if (
      !openedStat.isFile() ||
      openedStat.dev !== initialStat.dev ||
      openedStat.ino !== initialStat.ino ||
      openedStat.size !== initialStat.size ||
      openedStat.mode !== initialStat.mode ||
      openedStat.mtimeNs !== initialStat.mtimeNs
    ) {
      throw new Error(`${label} changed while it was opened: ${sourcePath}.`);
    }
    const bytes = Buffer.from(await handle.readFile());
    const finalStat = await handle.stat({ bigint: true });
    if (
      finalStat.dev !== openedStat.dev ||
      finalStat.ino !== openedStat.ino ||
      finalStat.size !== openedStat.size ||
      finalStat.mode !== openedStat.mode ||
      finalStat.mtimeNs !== openedStat.mtimeNs ||
      BigInt(bytes.length) !== openedStat.size
    ) {
      throw new Error(`${label} changed while it was read: ${sourcePath}.`);
    }
    await assertDirectoryIdentity(identity);
    return Object.freeze({
      state: "present" as const,
      bytes,
      mode: Number(openedStat.mode & 0o7777n),
      dev: openedStat.dev,
      ino: openedStat.ino,
      uid: openedStat.uid,
      birthtimeNs: openedStat.birthtimeNs > 0n ? openedStat.birthtimeNs : null,
    });
  } finally {
    await handle.close();
  }
}

async function readPartialArtifactState(
  repoRoot: string,
  sourcePath: string,
  label: string,
): Promise<InspectedFileState> {
  const identity = await captureDirectoryIdentity(repoRoot, sourcePath);
  const absolutePath = resolveContainedPath(repoRoot, sourcePath);
  let initialStat;
  try {
    initialStat = await lstat(absolutePath, { bigint: true });
  } catch (error) {
    if (isMissing(error)) {
      await assertDirectoryIdentity(identity);
      return Object.freeze({ state: "absent" as const });
    }
    throw error;
  }
  if (initialStat.isSymbolicLink() || !initialStat.isFile()) {
    throw new Error(`${label} is not a regular file: ${sourcePath}.`);
  }

  const mode = Number(initialStat.mode & 0o7777n);
  const currentUid = typeof process.getuid === "function" ? process.getuid() : null;
  const isEmptyRestrictiveCreate =
    initialStat.size === 0n &&
    initialStat.nlink === 1n &&
    currentUid !== null &&
    initialStat.uid === BigInt(currentUid) &&
    (mode & ~0o600) === 0;
  if (!isEmptyRestrictiveCreate) {
    return readInspectedFileState(repoRoot, sourcePath, label);
  }

  // A crash can occur after O_EXCL creates the partial but before the immediate
  // owner-only chmod. An umask may therefore leave an empty 000/0200 file that
  // cannot be reopened for verification. Empty bytes are an exact prefix, so a
  // same-owner, single-link, owner-only file can be identified without changing
  // its permissions. Non-empty unreadable files remain fail-closed.
  const finalStat = await lstat(absolutePath, { bigint: true });
  if (
    finalStat.isSymbolicLink() ||
    !finalStat.isFile() ||
    finalStat.dev !== initialStat.dev ||
    finalStat.ino !== initialStat.ino ||
    finalStat.size !== initialStat.size ||
    finalStat.mode !== initialStat.mode ||
    finalStat.mtimeNs !== initialStat.mtimeNs ||
    finalStat.nlink !== initialStat.nlink ||
    finalStat.uid !== initialStat.uid
  ) {
    throw new Error(`${label} changed while it was inspected: ${sourcePath}.`);
  }
  await assertDirectoryIdentity(identity);
  return Object.freeze({
    state: "present" as const,
    bytes: Buffer.alloc(0),
    mode,
    dev: finalStat.dev,
    ino: finalStat.ino,
    uid: finalStat.uid,
    birthtimeNs: finalStat.birthtimeNs > 0n ? finalStat.birthtimeNs : null,
  });
}

export async function readCanonicalFileState(
  repoRoot: string,
  sourcePath: string,
): Promise<CanonicalFileState> {
  parseCanonicalRecordSourcePath(sourcePath);
  const state = await readInspectedFileState(repoRoot, sourcePath, "Canonical target");
  if (state.state === "absent") return state;
  return Object.freeze({
    state: "present" as const,
    bytes: state.bytes,
    mode: state.mode,
  });
}

export function canonicalStateMatches(
  state: CanonicalFileState,
  bytes: Buffer | null,
  mode: number | null,
) {
  if (bytes === null) return mode === null && state.state === "absent";
  return (
    mode !== null &&
    state.state === "present" &&
    state.bytes.equals(bytes) &&
    state.mode === mode
  );
}

function inspectedStateMatches(
  state: InspectedFileState,
  bytes: Buffer | null,
  mode: number | null,
) {
  return canonicalStateMatches(state, bytes, mode);
}

function sameFileIdentity(left: InspectedFileState, right: InspectedFileState) {
  return (
    left.state === "present" &&
    right.state === "present" &&
    left.dev === right.dev &&
    left.ino === right.ino
  );
}

async function assertExpectedCanonicalState(
  repoRoot: string,
  operation: CanonicalMutation,
  expected: "before" | "after",
) {
  const state = await readCanonicalFileState(repoRoot, operation.sourcePath);
  const bytes = expected === "before" ? operation.beforeBytes : operation.afterBytes;
  const mode = expected === "before" ? operation.beforeMode : operation.afterMode;
  if (!canonicalStateMatches(state, bytes, mode)) {
    throw new Error(
      `Canonical target ${operation.sourcePath} does not match ${bytesDescription(expected)}.`,
    );
  }
}

async function mutateDirectoryEntry(
  identity: DirectoryIdentity,
  mutation: () => Promise<void>,
  dependencies: CanonicalFileDependencies,
  event: CanonicalFilesystemPrimitiveEvent,
  verifyAfterPrimitive?: () => Promise<void>,
) {
  await assertDirectoryIdentity(identity);
  await mutation();
  await verifyAfterPrimitive?.();
  // Proof/verification runs before the deterministic process-death hook. This
  // makes a successfully-created inode recoverable without pretending Node can
  // close the remaining check-to-syscall race described above.
  await notifyPrimitiveMutation(dependencies, event);
  // Recheck after the hook as well. Tests intentionally use this boundary to
  // model an outside writer racing the completed syscall; a proof recorded
  // before the hook must never turn that replacement into an owned artifact.
  await verifyAfterPrimitive?.();
  await syncDirectory(identity);
}

async function inspectExpectedArtifact(
  repoRoot: string,
  artifactSourcePath: string,
  bytes: Buffer,
  mode: number,
  label: string,
) {
  const state = await readInspectedFileState(repoRoot, artifactSourcePath, label);
  if (state.state === "absent") return state;
  if (!inspectedStateMatches(state, bytes, mode)) {
    throw new Error(`${label} has unfamiliar bytes or mode: ${artifactSourcePath}.`);
  }
  return state;
}

async function assertArtifactAbsent(
  repoRoot: string,
  artifactSourcePath: string,
  label: string,
) {
  const state = await readInspectedFileState(repoRoot, artifactSourcePath, label);
  if (state.state !== "absent") {
    throw new Error(`${label} is not applicable and was preserved: ${artifactSourcePath}.`);
  }
  return state;
}

async function removeExpectedArtifact(
  repoRoot: string,
  sourcePath: string,
  artifactSourcePath: string,
  bytes: Buffer,
  mode: number,
  phase: MutationPhase,
  role: ArtifactRole,
  dependencies: CanonicalFileDependencies,
  ownership: Readonly<{
    transactionId: string;
    operation: CanonicalMutation;
    artifacts: OperationArtifacts;
    kind: CanonicalArtifactKind;
  }>,
  requiredState?: InspectedFileState,
) {
  const state = await inspectExpectedArtifact(
    repoRoot,
    artifactSourcePath,
    bytes,
    mode,
    "Transaction artifact",
  );
  if (requiredState) {
    if (requiredState.state === "absent") {
      if (state.state === "present") {
        throw new Error(
          `Transaction artifact appeared after cleanup preflight: ${artifactSourcePath}.`,
        );
      }
      return false;
    }
    if (state.state === "absent" || !sameFileIdentity(state, requiredState)) {
      throw new Error(
        `Transaction artifact identity changed after cleanup preflight: ${artifactSourcePath}.`,
      );
    }
  }
  if (state.state === "absent") return false;
  await ensureArtifactCleanupAuthorized(
    repoRoot,
    ownership.transactionId,
    ownership.operation,
    ownership.artifacts,
    ownership.kind,
    state,
    dependencies,
  );
  const identity = await captureDirectoryIdentity(repoRoot, artifactSourcePath);
  await notifyBeforeMutation(
    dependencies,
    phase,
    role === "capture" ? "capture-cleaned" : "artifact-removed",
    role,
    sourcePath,
    artifactSourcePath,
  );
  const current = await readInspectedFileState(
    repoRoot,
    artifactSourcePath,
    "Transaction artifact",
  );
  if (!inspectedStateMatches(current, bytes, mode)) {
    throw new Error(`Transaction artifact changed before cleanup: ${artifactSourcePath}.`);
  }
  if (!sameFileIdentity(current, state)) {
    throw new Error(
      `Transaction artifact identity changed before cleanup: ${artifactSourcePath}.`,
    );
  }
  const stage = role === "capture" ? "capture-cleaned" : "artifact-removed";
  await mutateDirectoryEntry(
    identity,
    async () => {
      await unlink(resolveContainedPath(repoRoot, artifactSourcePath));
    },
    dependencies,
    {
      phase,
      stage,
      artifactRole: role,
      sourcePath,
      artifactSourcePath,
      primitive: "unlink",
      primitiveSourcePath: artifactSourcePath,
    },
    async () => {
      const afterUnlink = await readInspectedFileState(
        repoRoot,
        artifactSourcePath,
        "Transaction artifact after cleanup",
      );
      if (afterUnlink.state !== "absent") {
        throw new Error(
          `Transaction artifact path was recreated during cleanup and was preserved: ${artifactSourcePath}. ${CANONICAL_LEAF_ENTRY_RACE_LIMIT}`,
        );
      }
    },
  );
  await notifyMutation(
    dependencies,
    phase,
    stage,
    role,
    sourcePath,
    artifactSourcePath,
  );
  return true;
}

async function removeOwnedPartial(
  repoRoot: string,
  sourcePath: string,
  partialSourcePath: string,
  expectedBytes: Buffer,
  finalMode: number,
  phase: MutationPhase,
  role: ArtifactRole,
  dependencies: CanonicalFileDependencies,
  ownership: Readonly<{
    transactionId: string;
    operation: CanonicalMutation;
    artifacts: OperationArtifacts;
    kind: "after-partial" | "before-partial";
  }>,
  requiredState?: InspectedFileState,
) {
  const state = await inspectOwnedPartialArtifact(
    repoRoot,
    partialSourcePath,
    expectedBytes,
    finalMode,
  );
  if (requiredState) {
    if (requiredState.state === "absent") {
      if (state.state === "present") {
        throw new Error(
          `Transaction partial artifact appeared after cleanup preflight: ${partialSourcePath}.`,
        );
      }
      return false;
    }
    if (state.state === "absent" || !sameFileIdentity(state, requiredState)) {
      throw new Error(
        `Transaction partial artifact identity changed after cleanup preflight: ${partialSourcePath}.`,
      );
    }
  }
  if (state.state === "absent") return false;
  await ensureArtifactCleanupAuthorized(
    repoRoot,
    ownership.transactionId,
    ownership.operation,
    ownership.artifacts,
    ownership.kind,
    state,
    dependencies,
  );
  const identity = await captureDirectoryIdentity(repoRoot, partialSourcePath);
  await notifyBeforeMutation(
    dependencies,
    phase,
    "artifact-removed",
    role,
    sourcePath,
    partialSourcePath,
  );
  const rechecked = await readPartialArtifactState(
    repoRoot,
    partialSourcePath,
    "Transaction partial artifact",
  );
  if (
    rechecked.state !== "present" ||
    !rechecked.bytes.equals(state.bytes) ||
    rechecked.mode !== state.mode ||
    !sameFileIdentity(rechecked, state)
  ) {
    throw new Error(`Transaction partial artifact changed before cleanup: ${partialSourcePath}.`);
  }
  await mutateDirectoryEntry(
    identity,
    async () => {
      await unlink(resolveContainedPath(repoRoot, partialSourcePath));
    },
    dependencies,
    {
      phase,
      stage: "artifact-removed",
      artifactRole: role,
      sourcePath,
      artifactSourcePath: partialSourcePath,
      primitive: "unlink",
      primitiveSourcePath: partialSourcePath,
    },
    async () => {
      const afterUnlink = await readInspectedFileState(
        repoRoot,
        partialSourcePath,
        "Transaction partial artifact after cleanup",
      );
      if (afterUnlink.state !== "absent") {
        throw new Error(
          `Transaction partial artifact path was recreated during cleanup and was preserved: ${partialSourcePath}. ${CANONICAL_LEAF_ENTRY_RACE_LIMIT}`,
        );
      }
    },
  );
  await notifyMutation(
    dependencies,
    phase,
    "artifact-removed",
    role,
    sourcePath,
    partialSourcePath,
  );
  return true;
}

async function inspectOwnedPartialArtifact(
  repoRoot: string,
  partialSourcePath: string,
  expectedBytes: Buffer,
  finalMode: number,
) {
  const state = await readPartialArtifactState(
    repoRoot,
    partialSourcePath,
    "Transaction partial artifact",
  );
  if (state.state === "absent") return state;
  const isExpectedPrefix =
    state.bytes.length <= expectedBytes.length &&
    expectedBytes.subarray(0, state.bytes.length).equals(state.bytes);
  const isRestrictiveOwnerOnlyMode = (state.mode & ~0o600) === 0;
  if (
    !isExpectedPrefix ||
    (!isRestrictiveOwnerOnlyMode && state.mode !== finalMode)
  ) {
    throw new Error(
      `Transaction partial artifact has unfamiliar bytes or mode: ${partialSourcePath}.`,
    );
  }
  return state;
}

async function ensureReadyArtifact(
  repoRoot: string,
  transactionId: string,
  operation: CanonicalMutation,
  readySourcePath: string,
  partialSourcePath: string,
  bytes: Buffer,
  finalMode: number,
  phase: MutationPhase,
  role: ArtifactRole,
  dependencies: CanonicalFileDependencies,
) {
  const sourcePath = operation.sourcePath;
  const partialKind =
    role === "after-stage" ? "after-partial" : "before-partial";
  const readyKind = role === "after-stage" ? "after-stage" : "before-stage";
  const artifacts = operationArtifacts(
    operation.sourcePath,
    transactionId,
    operation.index,
  );
  const writeChunkBytes = dependencies.writeChunkBytes ?? WRITE_CHUNK_BYTES;
  if (
    !Number.isInteger(writeChunkBytes) ||
    writeChunkBytes < 1 ||
    writeChunkBytes > WRITE_CHUNK_BYTES
  ) {
    throw new Error(
      `Canonical writeChunkBytes must be an integer from 1 through ${WRITE_CHUNK_BYTES}.`,
    );
  }
  await removeOwnedPartial(
    repoRoot,
    sourcePath,
    partialSourcePath,
    bytes,
    finalMode,
    phase,
    role,
    dependencies,
    { transactionId, operation, artifacts, kind: partialKind },
  );
  const ready = await inspectExpectedArtifact(
    repoRoot,
    readySourcePath,
    bytes,
    finalMode,
    "Transaction ready artifact",
  );
  if (ready.state === "present") return;

  const identity = await captureDirectoryIdentity(repoRoot, partialSourcePath);
  const partialPath = resolveContainedPath(repoRoot, partialSourcePath);
  const handle = await open(
    partialPath,
    constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | NO_FOLLOW,
    0o600,
  );
  try {
    await persistEmptyPartialOwnershipProof(
      dependencies,
      transactionId,
      operation,
      partialKind,
      handle,
    );
    await notifyPrimitiveMutation(dependencies, {
      phase,
      stage: "partial-created",
      artifactRole: role,
      sourcePath,
      artifactSourcePath: partialSourcePath,
      primitive: "create",
      primitiveSourcePath: partialSourcePath,
    });
    await syncDirectory(identity);
    await notifyMutation(
      dependencies,
      phase,
      "partial-created",
      role,
      sourcePath,
      partialSourcePath,
    );
    await assertDirectoryIdentity(identity);

    // O_CREAT honors the process umask. Tighten the new inode to owner-only
    // access before any payload bytes are written so a permissive requested
    // final mode is never exposed during staging.
    await handle.chmod(0o600);
    await notifyPrimitiveMutation(dependencies, {
      phase,
      stage: "partial-created",
      artifactRole: role,
      sourcePath,
      artifactSourcePath: partialSourcePath,
      primitive: "chmod",
      primitiveSourcePath: partialSourcePath,
    });
    await handle.sync();
    await assertDirectoryIdentity(identity);

    let offset = 0;
    let writeOrdinal = 0;
    while (offset < bytes.length) {
      const requestedLength = Math.min(writeChunkBytes, bytes.length - offset);
      const { bytesWritten } = await handle.write(
        bytes,
        offset,
        requestedLength,
        offset,
      );
      if (bytesWritten <= 0) {
        throw new Error(`Transaction partial write made no progress: ${partialSourcePath}.`);
      }
      await notifyPrimitiveMutation(dependencies, {
        phase,
        stage: "payload-written",
        artifactRole: role,
        sourcePath,
        artifactSourcePath: partialSourcePath,
        primitive: "write",
        primitiveSourcePath: partialSourcePath,
        writeOffset: offset,
        writeLength: bytesWritten,
        writeTotalBytes: bytes.length,
        writeOrdinal,
      });
      offset += bytesWritten;
      writeOrdinal += 1;
    }
    await handle.sync();
    await assertDirectoryIdentity(identity);
    await notifyMutation(
      dependencies,
      phase,
      "payload-written",
      role,
      sourcePath,
      partialSourcePath,
    );
    await handle.chmod(finalMode);
    await notifyPrimitiveMutation(dependencies, {
      phase,
      stage: "mode-set",
      artifactRole: role,
      sourcePath,
      artifactSourcePath: partialSourcePath,
      primitive: "chmod",
      primitiveSourcePath: partialSourcePath,
    });
    await handle.sync();
    await assertDirectoryIdentity(identity);
    await notifyMutation(
      dependencies,
      phase,
      "mode-set",
      role,
      sourcePath,
      partialSourcePath,
    );
  } finally {
    await handle.close();
  }

  const partial = await inspectExpectedArtifact(
    repoRoot,
    partialSourcePath,
    bytes,
    finalMode,
    "Transaction completed partial artifact",
  );
  if (partial.state !== "present") {
    throw new Error(`Transaction partial artifact disappeared: ${partialSourcePath}.`);
  }
  try {
    await mutateDirectoryEntry(
      identity,
      async () => {
        await link(
          resolveContainedPath(repoRoot, partialSourcePath),
          resolveContainedPath(repoRoot, readySourcePath),
        );
      },
      dependencies,
      {
        phase,
        stage: "artifact-ready",
        artifactRole: role,
        sourcePath,
        artifactSourcePath: readySourcePath,
        primitive: "link",
        primitiveSourcePath: partialSourcePath,
        primitiveDestinationPath: readySourcePath,
      },
      async () => {
        const linkedReady = await readInspectedFileState(
          repoRoot,
          readySourcePath,
          "Transaction ready artifact",
        );
        const currentPartial = await readInspectedFileState(
          repoRoot,
          partialSourcePath,
          "Transaction completed partial artifact",
        );
        if (
          !inspectedStateMatches(linkedReady, bytes, finalMode) ||
          !sameFileIdentity(linkedReady, partial) ||
          !sameFileIdentity(currentPartial, partial)
        ) {
          throw new Error(
            `Transaction ready artifact changed before durability: ${readySourcePath}.`,
          );
        }
        if (linkedReady.state !== "present") {
          throw new Error(`Transaction ready artifact disappeared: ${readySourcePath}.`);
        }
        await persistOwnershipProof(
          dependencies,
          transactionId,
          operation,
          readyKind,
          linkedReady,
        );
      },
    );
  } catch (error) {
    if (!isAlreadyPresent(error)) throw error;
    const existingReady = await inspectExpectedArtifact(
      repoRoot,
      readySourcePath,
      bytes,
      finalMode,
      "Transaction ready artifact",
    );
    if (existingReady.state !== "present") throw error;
    const currentPartial = await readInspectedFileState(
      repoRoot,
      partialSourcePath,
      "Transaction completed partial artifact",
    );
    if (!sameFileIdentity(existingReady, currentPartial)) {
      throw new Error(
        `Existing ready artifact has no matching partial witness: ${readySourcePath}.`,
      );
    }
    await persistOwnershipProof(
      dependencies,
      transactionId,
      operation,
      readyKind,
      existingReady,
    );
  }
  await notifyMutation(
    dependencies,
    phase,
    "artifact-ready",
    role,
    sourcePath,
    readySourcePath,
  );
  await removeOwnedPartial(
    repoRoot,
    sourcePath,
    partialSourcePath,
    bytes,
    finalMode,
    phase,
    role,
    dependencies,
    { transactionId, operation, artifacts, kind: partialKind },
  );
}

async function restoreUnfamiliarCapture(
  repoRoot: string,
  sourcePath: string,
  captureSourcePath: string,
  phase: MutationPhase,
  dependencies: CanonicalFileDependencies,
) {
  const capture = await readInspectedFileState(
    repoRoot,
    captureSourcePath,
    "Unfamiliar transaction capture",
  );
  if (capture.state !== "present") {
    throw new Error(`Unfamiliar transaction capture is unavailable: ${captureSourcePath}.`);
  }
  const canonical = await readInspectedFileState(repoRoot, sourcePath, "Canonical target");
  if (canonical.state === "present") {
    if (!sameFileIdentity(canonical, capture)) {
      throw new Error(
        `Both the canonical target and an unfamiliar transaction capture are present: ${sourcePath}.`,
      );
    }
    return;
  }
  const identity = await captureDirectoryIdentity(repoRoot, sourcePath);
  await notifyBeforeMutation(
    dependencies,
    phase,
    "unfamiliar-capture-restored",
    "capture",
    sourcePath,
    captureSourcePath,
  );
  const currentCapture = await readInspectedFileState(
    repoRoot,
    captureSourcePath,
    "Unfamiliar transaction capture",
  );
  if (
    currentCapture.state !== "present" ||
    !sameFileIdentity(currentCapture, capture) ||
    !currentCapture.bytes.equals(capture.bytes) ||
    currentCapture.mode !== capture.mode
  ) {
    throw new Error(
      `Unfamiliar transaction capture changed before restoration: ${captureSourcePath}.`,
    );
  }
  const currentCanonical = await readInspectedFileState(
    repoRoot,
    sourcePath,
    "Canonical target",
  );
  if (currentCanonical.state !== "absent") {
    throw new Error(
      `Canonical target was recreated before an unfamiliar capture could be restored: ${sourcePath}.`,
    );
  }
  try {
    await mutateDirectoryEntry(
      identity,
      async () => {
        await link(
          resolveContainedPath(repoRoot, captureSourcePath),
          resolveContainedPath(repoRoot, sourcePath),
        );
      },
      dependencies,
      {
        phase,
        stage: "unfamiliar-capture-restored",
        artifactRole: "capture",
        sourcePath,
        artifactSourcePath: captureSourcePath,
        primitive: "link",
        primitiveSourcePath: captureSourcePath,
        primitiveDestinationPath: sourcePath,
      },
      async () => {
        const linkedCanonical = await readInspectedFileState(
          repoRoot,
          sourcePath,
          "Canonical target",
        );
        const linkedCapture = await readInspectedFileState(
          repoRoot,
          captureSourcePath,
          "Unfamiliar transaction capture",
        );
        if (
          !sameFileIdentity(linkedCanonical, capture) ||
          !sameFileIdentity(linkedCapture, capture)
        ) {
          throw new Error(
            `Unfamiliar capture restoration changed before durability: ${sourcePath}.`,
          );
        }
      },
    );
  } catch (error) {
    if (!isAlreadyPresent(error)) throw error;
    const current = await readInspectedFileState(repoRoot, sourcePath, "Canonical target");
    if (!sameFileIdentity(current, capture)) {
      throw new Error(
        `Canonical target was recreated while an unfamiliar capture was restored: ${sourcePath}.`,
      );
    }
  }
  await notifyMutation(
    dependencies,
    phase,
    "unfamiliar-capture-restored",
    "capture",
    sourcePath,
    captureSourcePath,
  );
}

type InspectedCapture =
  | Readonly<{ state: "absent" }>
  | Readonly<{
      state: "owned";
      capture: PresentInspectedFileState;
      ownership: "before" | "after";
    }>
  | Readonly<{
      state: "unfamiliar";
      capture: PresentInspectedFileState;
    }>;

async function inspectPendingCapture(
  repoRoot: string,
  operation: CanonicalMutation,
  artifacts: OperationArtifacts,
): Promise<InspectedCapture> {
  const capture = await readInspectedFileState(
    repoRoot,
    artifacts.capture,
    "Transaction capture",
  );
  if (capture.state === "absent") return capture;

  const possibleOwners = [
    operation.beforeBytes !== null && operation.beforeMode !== null
      ? {
          ownership: "before" as const,
          bytes: operation.beforeBytes,
          mode: operation.beforeMode,
          anchorSourcePath: artifacts.beforeAnchor,
        }
      : null,
    operation.afterBytes !== null && operation.afterMode !== null
      ? {
          ownership: "after" as const,
          bytes: operation.afterBytes,
          mode: operation.afterMode,
          anchorSourcePath: artifacts.afterAnchor,
        }
      : null,
  ].filter((owner): owner is NonNullable<typeof owner> => owner !== null);

  for (const owner of possibleOwners) {
    if (!inspectedStateMatches(capture, owner.bytes, owner.mode)) continue;
    const anchor = await readInspectedFileState(
      repoRoot,
      owner.anchorSourcePath,
      "Transaction anchor",
    );
    if (
      inspectedStateMatches(anchor, owner.bytes, owner.mode) &&
      sameFileIdentity(capture, anchor)
    ) {
      return Object.freeze({
        state: "owned" as const,
        capture,
        ownership: owner.ownership,
      });
    }
  }

  return Object.freeze({ state: "unfamiliar" as const, capture });
}

async function guardPendingCapture(
  repoRoot: string,
  operation: CanonicalMutation,
  artifacts: OperationArtifacts,
  phase: MutationPhase,
  dependencies: CanonicalFileDependencies,
) {
  const pending = await inspectPendingCapture(repoRoot, operation, artifacts);
  if (pending.state === "absent") return pending;
  if (pending.state === "unfamiliar") {
    await restoreUnfamiliarCapture(
      repoRoot,
      operation.sourcePath,
      artifacts.capture,
      phase,
      dependencies,
    );
    throw new Error(
      `Transaction capture contains an outside edit and was preserved: ${artifacts.capture}.`,
    );
  }
  return pending;
}

async function captureExpectedCanonical(
  repoRoot: string,
  transactionId: string,
  operation: CanonicalMutation,
  expectedBytes: Buffer,
  expectedMode: number,
  anchorSourcePath: string,
  anchorRole: "before-anchor" | "after-anchor",
  captureSourcePath: string,
  phase: MutationPhase,
  dependencies: CanonicalFileDependencies,
) {
  const artifacts = operationArtifacts(
    operation.sourcePath,
    transactionId,
    operation.index,
  );
  const existingCapture = await readInspectedFileState(
    repoRoot,
    captureSourcePath,
    "Transaction capture",
  );
  if (existingCapture.state === "present") {
    if (!inspectedStateMatches(existingCapture, expectedBytes, expectedMode)) {
      await restoreUnfamiliarCapture(
        repoRoot,
        operation.sourcePath,
        captureSourcePath,
        phase,
        dependencies,
      );
      throw new Error(
        `Transaction capture contains an outside edit and was preserved: ${captureSourcePath}.`,
      );
    }
    const anchor = await inspectExpectedArtifact(
      repoRoot,
      anchorSourcePath,
      expectedBytes,
      expectedMode,
      "Transaction anchor",
    );
    if (anchor.state !== "present" || !sameFileIdentity(anchor, existingCapture)) {
      throw new Error(`Transaction capture has no matching owned anchor: ${captureSourcePath}.`);
    }
    const canonical = await readInspectedFileState(
      repoRoot,
      operation.sourcePath,
      "Canonical target",
    );
    if (canonical.state === "present") {
      throw new Error(
        `Canonical target is present while a transaction capture is pending: ${operation.sourcePath}.`,
      );
    }
    return;
  }

  let canonical = await readInspectedFileState(
    repoRoot,
    operation.sourcePath,
    "Canonical target",
  );
  if (!inspectedStateMatches(canonical, expectedBytes, expectedMode)) {
    throw new Error(
      `Canonical target ${operation.sourcePath} does not match the state being captured.`,
    );
  }

  let anchor = await inspectExpectedArtifact(
    repoRoot,
    anchorSourcePath,
    expectedBytes,
    expectedMode,
    "Transaction anchor",
  );
  if (anchor.state === "present" && !sameFileIdentity(anchor, canonical)) {
    await removeExpectedArtifact(
      repoRoot,
      operation.sourcePath,
      anchorSourcePath,
      expectedBytes,
      expectedMode,
      phase,
      anchorRole,
      dependencies,
      { transactionId, operation, artifacts, kind: anchorRole },
    );
    anchor = { state: "absent" };
  }
  if (anchor.state === "absent") {
    const identity = await captureDirectoryIdentity(repoRoot, operation.sourcePath);
    await notifyBeforeMutation(
      dependencies,
      phase,
      "anchor-created",
      anchorRole,
      operation.sourcePath,
      anchorSourcePath,
    );
    try {
      await mutateDirectoryEntry(
        identity,
        async () => {
          await link(
            resolveContainedPath(repoRoot, operation.sourcePath),
            resolveContainedPath(repoRoot, anchorSourcePath),
          );
        },
        dependencies,
        {
          phase,
          stage: "anchor-created",
          artifactRole: anchorRole,
          sourcePath: operation.sourcePath,
          artifactSourcePath: anchorSourcePath,
          primitive: "link",
          primitiveSourcePath: operation.sourcePath,
          primitiveDestinationPath: anchorSourcePath,
        },
        async () => {
          const linkedCanonical = await readInspectedFileState(
            repoRoot,
            operation.sourcePath,
            "Canonical target",
          );
          const linkedAnchor = await readInspectedFileState(
            repoRoot,
            anchorSourcePath,
            "Transaction anchor",
          );
          if (
            !sameFileIdentity(linkedCanonical, canonical) ||
            !sameFileIdentity(linkedAnchor, canonical)
          ) {
            throw new Error(
              `Transaction anchor changed before durability: ${anchorSourcePath}.`,
            );
          }
          if (linkedAnchor.state !== "present") {
            throw new Error(`Transaction anchor disappeared: ${anchorSourcePath}.`);
          }
          await persistOwnershipProof(
            dependencies,
            transactionId,
            operation,
            anchorRole,
            linkedAnchor,
          );
        },
      );
    } catch (error) {
      if (!isAlreadyPresent(error)) throw error;
    }
    anchor = await inspectExpectedArtifact(
      repoRoot,
      anchorSourcePath,
      expectedBytes,
      expectedMode,
      "Transaction anchor",
    );
    if (anchor.state !== "present") {
      throw new Error(`Transaction anchor was not created: ${anchorSourcePath}.`);
    }
    await notifyMutation(
      dependencies,
      phase,
      "anchor-created",
      anchorRole,
      operation.sourcePath,
      anchorSourcePath,
    );
  }

  canonical = await readInspectedFileState(repoRoot, operation.sourcePath, "Canonical target");
  if (!sameFileIdentity(canonical, anchor)) {
    throw new Error(
      `Canonical target changed after its transaction anchor was created: ${operation.sourcePath}.`,
    );
  }
  if (anchor.state !== "present") {
    throw new Error(`Transaction anchor is absent: ${anchorSourcePath}.`);
  }
  await persistOwnershipProof(
    dependencies,
    transactionId,
    operation,
    anchorRole,
    anchor,
  );
  const capture = await readInspectedFileState(
    repoRoot,
    captureSourcePath,
    "Transaction capture",
  );
  if (capture.state === "present") {
    throw new Error(`Transaction capture unexpectedly exists: ${captureSourcePath}.`);
  }
  const identity = await captureDirectoryIdentity(repoRoot, operation.sourcePath);
  await notifyBeforeMutation(
    dependencies,
    phase,
    "canonical-captured",
    "capture",
    operation.sourcePath,
    captureSourcePath,
  );
  const captureAfterHook = await readInspectedFileState(
    repoRoot,
    captureSourcePath,
    "Transaction capture",
  );
  if (captureAfterHook.state !== "absent") {
    throw new Error(
      `Transaction capture appeared before canonical quarantine and was preserved: ${captureSourcePath}. ${CANONICAL_LEAF_ENTRY_RACE_LIMIT}`,
    );
  }
  const canonicalAfterHook = await readInspectedFileState(
    repoRoot,
    operation.sourcePath,
    "Canonical target",
  );
  const anchorAfterHook = await readInspectedFileState(
    repoRoot,
    anchorSourcePath,
    "Transaction anchor",
  );
  if (
    !inspectedStateMatches(canonicalAfterHook, expectedBytes, expectedMode) ||
    !inspectedStateMatches(anchorAfterHook, expectedBytes, expectedMode) ||
    !sameFileIdentity(canonicalAfterHook, anchorAfterHook)
  ) {
    throw new Error(
      `Canonical target changed after the capture hook; no quarantine was performed: ${operation.sourcePath}.`,
    );
  }
  await mutateDirectoryEntry(
    identity,
    async () => {
      await rename(
        resolveContainedPath(repoRoot, operation.sourcePath),
        resolveContainedPath(repoRoot, captureSourcePath),
      );
    },
    dependencies,
    {
      phase,
      stage: "canonical-captured",
      artifactRole: "capture",
      sourcePath: operation.sourcePath,
      artifactSourcePath: captureSourcePath,
      primitive: "rename",
      primitiveSourcePath: operation.sourcePath,
      primitiveDestinationPath: captureSourcePath,
    },
    async () => {
      const canonicalAfterRename = await readInspectedFileState(
        repoRoot,
        operation.sourcePath,
        "Canonical target after quarantine",
      );
      const captureAfterRename = await readInspectedFileState(
        repoRoot,
        captureSourcePath,
        "Transaction capture",
      );
      const anchorAfterRename = await readInspectedFileState(
        repoRoot,
        anchorSourcePath,
        "Transaction anchor",
      );
      if (
        canonicalAfterRename.state !== "absent" ||
        !sameFileIdentity(captureAfterRename, canonicalAfterHook) ||
        !sameFileIdentity(anchorAfterRename, canonicalAfterHook)
      ) {
        throw new Error(
          `Canonical quarantine changed before durability: ${operation.sourcePath}.`,
        );
      }
      if (captureAfterRename.state !== "present") {
        throw new Error(`Transaction capture disappeared: ${captureSourcePath}.`);
      }
      await persistOwnershipProof(
        dependencies,
        transactionId,
        operation,
        "capture",
        captureAfterRename,
      );
    },
  );
  await notifyMutation(
    dependencies,
    phase,
    "canonical-captured",
    "capture",
    operation.sourcePath,
    captureSourcePath,
  );

  const captured = await readInspectedFileState(
    repoRoot,
    captureSourcePath,
    "Transaction capture",
  );
  const finalAnchor = await readInspectedFileState(
    repoRoot,
    anchorSourcePath,
    "Transaction anchor",
  );
  if (
    !inspectedStateMatches(captured, expectedBytes, expectedMode) ||
    !sameFileIdentity(captured, finalAnchor)
  ) {
    await restoreUnfamiliarCapture(
      repoRoot,
      operation.sourcePath,
      captureSourcePath,
      phase,
      dependencies,
    );
    throw new Error(
      `Canonical target changed while it was quarantined; captured bytes were preserved: ${operation.sourcePath}.`,
    );
  }
}

async function publishExpectedArtifact(
  repoRoot: string,
  transactionId: string,
  operation: CanonicalMutation,
  artifactSourcePath: string,
  role: ArtifactRole,
  bytes: Buffer,
  mode: number,
  phase: MutationPhase,
  dependencies: CanonicalFileDependencies,
) {
  const artifact = await inspectExpectedArtifact(
    repoRoot,
    artifactSourcePath,
    bytes,
    mode,
    "Transaction publication artifact",
  );
  if (artifact.state !== "present") {
    throw new Error(`Transaction publication artifact is absent: ${artifactSourcePath}.`);
  }
  const canonical = await readInspectedFileState(
    repoRoot,
    operation.sourcePath,
    "Canonical target",
  );
  if (canonical.state === "present") {
    if (!inspectedStateMatches(canonical, bytes, mode)) {
      throw new Error(
        `Canonical target was created or edited before publication: ${operation.sourcePath}.`,
      );
    }
    return;
  }
  const identity = await captureDirectoryIdentity(repoRoot, operation.sourcePath);
  await notifyBeforeMutation(
    dependencies,
    phase,
    "canonical-published",
    role,
    operation.sourcePath,
    artifactSourcePath,
  );
  const artifactAfterHook = await readInspectedFileState(
    repoRoot,
    artifactSourcePath,
    "Transaction publication artifact",
  );
  if (
    !inspectedStateMatches(artifactAfterHook, bytes, mode) ||
    !sameFileIdentity(artifactAfterHook, artifact)
  ) {
    throw new Error(
      `Transaction publication artifact changed after the publication hook: ${artifactSourcePath}.`,
    );
  }
  const canonicalAfterHook = await readInspectedFileState(
    repoRoot,
    operation.sourcePath,
    "Canonical target",
  );
  if (canonicalAfterHook.state !== "absent") {
    throw new Error(
      `Canonical target was created or edited before publication: ${operation.sourcePath}.`,
    );
  }
  try {
    await mutateDirectoryEntry(
      identity,
      async () => {
        await link(
          resolveContainedPath(repoRoot, artifactSourcePath),
          resolveContainedPath(repoRoot, operation.sourcePath),
        );
      },
      dependencies,
      {
        phase,
        stage: "canonical-published",
        artifactRole: role,
        sourcePath: operation.sourcePath,
        artifactSourcePath,
        primitive: "link",
        primitiveSourcePath: artifactSourcePath,
        primitiveDestinationPath: operation.sourcePath,
      },
      async () => {
        const linkedArtifact = await readInspectedFileState(
          repoRoot,
          artifactSourcePath,
          "Transaction publication artifact",
        );
        const linkedCanonical = await readInspectedFileState(
          repoRoot,
          operation.sourcePath,
          "Canonical target",
        );
        if (
          !sameFileIdentity(linkedArtifact, artifactAfterHook) ||
          !sameFileIdentity(linkedCanonical, artifactAfterHook) ||
          !inspectedStateMatches(linkedCanonical, bytes, mode)
        ) {
          throw new Error(
            `Canonical publication changed before durability: ${operation.sourcePath}.`,
          );
        }
        if (linkedArtifact.state !== "present") {
          throw new Error(
            `Transaction publication artifact disappeared: ${artifactSourcePath}.`,
          );
        }
        const artifactKind =
          role === "after-stage"
            ? "after-stage"
            : role === "before-stage"
              ? "before-stage"
              : role;
        await persistOwnershipProof(
          dependencies,
          transactionId,
          operation,
          artifactKind,
          linkedArtifact,
        );
      },
    );
  } catch (error) {
    if (!isAlreadyPresent(error)) throw error;
    const current = await readInspectedFileState(
      repoRoot,
      operation.sourcePath,
      "Canonical target",
    );
    if (
      !inspectedStateMatches(current, bytes, mode) ||
      !sameFileIdentity(current, artifactAfterHook)
    ) {
      throw new Error(
        `Canonical target was created or edited during publication: ${operation.sourcePath}.`,
      );
    }
  }
  await notifyMutation(
    dependencies,
    phase,
    "canonical-published",
    role,
    operation.sourcePath,
    artifactSourcePath,
  );
}

function cleanupWitnessSourcePaths(
  operation: CanonicalMutation,
  artifacts: OperationArtifacts,
  kind: CanonicalArtifactKind,
) {
  switch (kind) {
    case "after-partial":
      return [artifacts.afterStage];
    case "after-stage":
      return [artifacts.afterPartial, operation.sourcePath, artifacts.afterAnchor];
    case "before-partial":
      return [artifacts.beforeStage];
    case "before-stage":
      return [artifacts.beforePartial, operation.sourcePath, artifacts.beforeAnchor];
    case "before-anchor":
      return [operation.sourcePath, artifacts.capture];
    case "after-anchor":
      return [operation.sourcePath, artifacts.capture];
    case "capture":
      return [artifacts.beforeAnchor, artifacts.afterAnchor];
  }
}

async function ensureArtifactCleanupAuthorized(
  repoRoot: string,
  transactionId: string,
  operation: CanonicalMutation,
  artifacts: OperationArtifacts,
  kind: CanonicalArtifactKind,
  state: InspectedFileState,
  dependencies: CanonicalFileDependencies,
) {
  if (state.state === "absent") return;
  const partial = kind === "after-partial" || kind === "before-partial";
  let observedProof = ownershipProofFromState({
    transactionId,
    operation,
    artifactKind: kind,
    state,
  });
  if ((await dependencies.authorizeArtifactCleanup?.(observedProof)) === true) {
    return;
  }

  let witnessed = false;
  for (const witnessSourcePath of cleanupWitnessSourcePaths(
    operation,
    artifacts,
    kind,
  )) {
    const witness = await readInspectedFileState(
      repoRoot,
      witnessSourcePath,
      "Canonical artifact ownership witness",
    );
    if (sameFileIdentity(state, witness)) {
      witnessed = true;
      break;
    }
  }
  if (!witnessed) {
    throw new Error(
      `Transaction artifact has no prior ownership proof or surviving hard-link witness and was preserved: ${observedProof.artifactSourcePath}.`,
    );
  }

  await persistOwnershipProof(
    dependencies,
    transactionId,
    operation,
    kind,
    state,
  );
  observedProof = ownershipProofFromState({
    transactionId,
    operation,
    artifactKind: kind,
    state,
  });
  if ((await dependencies.authorizeArtifactCleanup?.(observedProof)) !== true) {
    throw new Error(
      `Transaction artifact ownership proof was not durably authorized and was preserved: ${observedProof.artifactSourcePath}.`,
    );
  }

  // Partial proofs may have been recorded when the inode was first created,
  // before its expected prefix and final mode were complete. The authority
  // callback therefore matches their exact inode identity; the existing strict
  // prefix/mode inspection above remains the independent content gate.
  if (!partial && !proofMatchesState(observedProof, state, false)) {
    throw new Error(
      `Transaction artifact ownership proof does not match the cleanup state: ${observedProof.artifactSourcePath}.`,
    );
  }
}

async function preflightKnownArtifactCleanup(
  repoRoot: string,
  transactionId: string,
  operation: CanonicalMutation,
  artifacts: OperationArtifacts,
  dependencies: CanonicalFileDependencies,
) {
  const pendingCapture = await inspectPendingCapture(
    repoRoot,
    operation,
    artifacts,
  );
  if (pendingCapture.state === "unfamiliar") {
    throw new Error(
      `Transaction capture has unfamiliar bytes, mode, or ownership and was preserved: ${artifacts.capture}.`,
    );
  }

  let afterPartial: InspectedFileState;
  let afterStage: InspectedFileState;
  let afterAnchor: InspectedFileState;
  if (operation.afterBytes !== null && operation.afterMode !== null) {
    afterPartial = await inspectOwnedPartialArtifact(
      repoRoot,
      artifacts.afterPartial,
      operation.afterBytes,
      operation.afterMode,
    );
    afterStage = await inspectExpectedArtifact(
      repoRoot,
      artifacts.afterStage,
      operation.afterBytes,
      operation.afterMode,
      "Transaction after stage",
    );
    afterAnchor = await inspectExpectedArtifact(
      repoRoot,
      artifacts.afterAnchor,
      operation.afterBytes,
      operation.afterMode,
      "Transaction after anchor",
    );
  } else {
    afterPartial = await assertArtifactAbsent(
      repoRoot,
      artifacts.afterPartial,
      "Transaction after partial",
    );
    afterStage = await assertArtifactAbsent(
      repoRoot,
      artifacts.afterStage,
      "Transaction after stage",
    );
    afterAnchor = await assertArtifactAbsent(
      repoRoot,
      artifacts.afterAnchor,
      "Transaction after anchor",
    );
  }

  let beforePartial: InspectedFileState;
  let beforeStage: InspectedFileState;
  let beforeAnchor: InspectedFileState;
  if (operation.beforeBytes !== null && operation.beforeMode !== null) {
    beforePartial = await inspectOwnedPartialArtifact(
      repoRoot,
      artifacts.beforePartial,
      operation.beforeBytes,
      operation.beforeMode,
    );
    beforeStage = await inspectExpectedArtifact(
      repoRoot,
      artifacts.beforeStage,
      operation.beforeBytes,
      operation.beforeMode,
      "Transaction before stage",
    );
    beforeAnchor = await inspectExpectedArtifact(
      repoRoot,
      artifacts.beforeAnchor,
      operation.beforeBytes,
      operation.beforeMode,
      "Transaction before anchor",
    );
  } else {
    beforePartial = await assertArtifactAbsent(
      repoRoot,
      artifacts.beforePartial,
      "Transaction before partial",
    );
    beforeStage = await assertArtifactAbsent(
      repoRoot,
      artifacts.beforeStage,
      "Transaction before stage",
    );
    beforeAnchor = await assertArtifactAbsent(
      repoRoot,
      artifacts.beforeAnchor,
      "Transaction before anchor",
    );
  }

  // The entire set is inspected before any ownership proof is established or
  // any deletion begins. That preserves every artifact if a later path is
  // unfamiliar or inapplicable.
  await ensureArtifactCleanupAuthorized(
    repoRoot,
    transactionId,
    operation,
    artifacts,
    "after-partial",
    afterPartial,
    dependencies,
  );
  await ensureArtifactCleanupAuthorized(
    repoRoot,
    transactionId,
    operation,
    artifacts,
    "after-stage",
    afterStage,
    dependencies,
  );
  await ensureArtifactCleanupAuthorized(
    repoRoot,
    transactionId,
    operation,
    artifacts,
    "after-anchor",
    afterAnchor,
    dependencies,
  );
  await ensureArtifactCleanupAuthorized(
    repoRoot,
    transactionId,
    operation,
    artifacts,
    "before-partial",
    beforePartial,
    dependencies,
  );
  await ensureArtifactCleanupAuthorized(
    repoRoot,
    transactionId,
    operation,
    artifacts,
    "before-stage",
    beforeStage,
    dependencies,
  );
  await ensureArtifactCleanupAuthorized(
    repoRoot,
    transactionId,
    operation,
    artifacts,
    "before-anchor",
    beforeAnchor,
    dependencies,
  );
  await ensureArtifactCleanupAuthorized(
    repoRoot,
    transactionId,
    operation,
    artifacts,
    "capture",
    pendingCapture.state === "owned"
      ? pendingCapture.capture
      : { state: "absent" },
    dependencies,
  );

  return Object.freeze({
    pendingCapture,
    afterPartial,
    afterStage,
    afterAnchor,
    beforePartial,
    beforeStage,
    beforeAnchor,
  });
}

async function assertCleanupArtifactSetAbsent(
  repoRoot: string,
  artifacts: OperationArtifacts,
) {
  for (const artifactSourcePath of Object.values(artifacts)) {
    const state = await readInspectedFileState(
      repoRoot,
      artifactSourcePath,
      "Transaction artifact after cleanup",
    );
    if (state.state !== "absent") {
      throw new Error(
        `Transaction artifact appeared or remained after cleanup and was preserved: ${artifactSourcePath}.`,
      );
    }
  }
}

async function cleanupKnownArtifacts(
  repoRoot: string,
  transactionId: string,
  operation: CanonicalMutation,
  phase: MutationPhase,
  dependencies: CanonicalFileDependencies,
) {
  const artifacts = operationArtifacts(
    operation.sourcePath,
    transactionId,
    operation.index,
  );
  // Validate the complete cleanup set before deleting any entry. Without this
  // read-only gate, an early owned artifact could be removed before a later
  // unfamiliar or inapplicable path aborts cleanup, destroying the evidence
  // needed for a safe retry or rollback.
  const preflight = await preflightKnownArtifactCleanup(
    repoRoot,
    transactionId,
    operation,
    artifacts,
    dependencies,
  );
  if (preflight.pendingCapture.state === "owned") {
    await removeExpectedArtifact(
      repoRoot,
      operation.sourcePath,
      artifacts.capture,
      preflight.pendingCapture.capture.bytes,
      preflight.pendingCapture.capture.mode,
      phase,
      "capture",
      dependencies,
      {
        transactionId,
        operation,
        artifacts,
        kind: "capture",
      },
      preflight.pendingCapture.capture,
    );
  }
  if (operation.afterBytes !== null && operation.afterMode !== null) {
    await removeOwnedPartial(
      repoRoot,
      operation.sourcePath,
      artifacts.afterPartial,
      operation.afterBytes,
      operation.afterMode,
      phase,
      "after-stage",
      dependencies,
      {
        transactionId,
        operation,
        artifacts,
        kind: "after-partial",
      },
      preflight.afterPartial,
    );
    await removeExpectedArtifact(
      repoRoot,
      operation.sourcePath,
      artifacts.afterStage,
      operation.afterBytes,
      operation.afterMode,
      phase,
      "after-stage",
      dependencies,
      { transactionId, operation, artifacts, kind: "after-stage" },
      preflight.afterStage,
    );
    await removeExpectedArtifact(
      repoRoot,
      operation.sourcePath,
      artifacts.afterAnchor,
      operation.afterBytes,
      operation.afterMode,
      phase,
      "after-anchor",
      dependencies,
      { transactionId, operation, artifacts, kind: "after-anchor" },
      preflight.afterAnchor,
    );
  } else {
    await assertArtifactAbsent(
      repoRoot,
      artifacts.afterPartial,
      "Transaction after partial",
    );
    await assertArtifactAbsent(
      repoRoot,
      artifacts.afterStage,
      "Transaction after stage",
    );
    await assertArtifactAbsent(
      repoRoot,
      artifacts.afterAnchor,
      "Transaction after anchor",
    );
  }
  if (operation.beforeBytes !== null && operation.beforeMode !== null) {
    await removeOwnedPartial(
      repoRoot,
      operation.sourcePath,
      artifacts.beforePartial,
      operation.beforeBytes,
      operation.beforeMode,
      phase,
      "before-stage",
      dependencies,
      {
        transactionId,
        operation,
        artifacts,
        kind: "before-partial",
      },
      preflight.beforePartial,
    );
    await removeExpectedArtifact(
      repoRoot,
      operation.sourcePath,
      artifacts.beforeStage,
      operation.beforeBytes,
      operation.beforeMode,
      phase,
      "before-stage",
      dependencies,
      { transactionId, operation, artifacts, kind: "before-stage" },
      preflight.beforeStage,
    );
    await removeExpectedArtifact(
      repoRoot,
      operation.sourcePath,
      artifacts.beforeAnchor,
      operation.beforeBytes,
      operation.beforeMode,
      phase,
      "before-anchor",
      dependencies,
      { transactionId, operation, artifacts, kind: "before-anchor" },
      preflight.beforeAnchor,
    );
  } else {
    await assertArtifactAbsent(
      repoRoot,
      artifacts.beforePartial,
      "Transaction before partial",
    );
    await assertArtifactAbsent(
      repoRoot,
      artifacts.beforeStage,
      "Transaction before stage",
    );
    await assertArtifactAbsent(
      repoRoot,
      artifacts.beforeAnchor,
      "Transaction before anchor",
    );
  }
  await assertCleanupArtifactSetAbsent(repoRoot, artifacts);
}

export async function applyCanonicalMutation(
  repoRoot: string,
  transactionId: string,
  operation: CanonicalMutation,
  dependencies: CanonicalFileDependencies = {},
) {
  assertCanonicalMutationShape(operation);
  parseTransactionId(transactionId);
  const artifacts = operationArtifacts(
    operation.sourcePath,
    transactionId,
    operation.index,
  );
  const pendingCapture = await guardPendingCapture(
    repoRoot,
    operation,
    artifacts,
    "apply",
    dependencies,
  );

  if (operation.action !== "remove") {
    await ensureReadyArtifact(
      repoRoot,
      transactionId,
      operation,
      artifacts.afterStage,
      artifacts.afterPartial,
      operation.afterBytes as Buffer,
      operation.afterMode as number,
      "apply",
      "after-stage",
      dependencies,
    );
  }

  const canonical = await readInspectedFileState(
    repoRoot,
    operation.sourcePath,
    "Canonical target",
  );
  if (inspectedStateMatches(canonical, operation.afterBytes, operation.afterMode)) {
    const removalAuthorized =
      operation.action === "remove" &&
      (await isCompletedRemovalAuthorized(dependencies, {
        phase: "apply",
        transactionId,
        operationIndex: operation.index,
        sourcePath: operation.sourcePath,
      }));
    if (
      operation.action === "remove" &&
      !(
        pendingCapture.state === "owned" &&
        pendingCapture.ownership === "before"
      ) &&
      !removalAuthorized
    ) {
      throw new Error(
        `Canonical target is absent without transaction-owned removal evidence: ${operation.sourcePath}.`,
      );
    }
    if (operation.action === "remove") return;
    await cleanupKnownArtifacts(repoRoot, transactionId, operation, "apply", dependencies);
    return;
  }

  if (operation.beforeBytes === null) {
    if (canonical.state !== "absent") {
      throw new Error(
        `Canonical target ${operation.sourcePath} does not match the transaction's before state.`,
      );
    }
  } else if (canonical.state === "present") {
    if (!inspectedStateMatches(canonical, operation.beforeBytes, operation.beforeMode)) {
      throw new Error(
        `Canonical target ${operation.sourcePath} does not match the transaction's before state.`,
      );
    }
    await captureExpectedCanonical(
      repoRoot,
      transactionId,
      operation,
      operation.beforeBytes,
      operation.beforeMode as number,
      artifacts.beforeAnchor,
      "before-anchor",
      artifacts.capture,
      "apply",
      dependencies,
    );
  } else {
    if (
      !(
        pendingCapture.state === "owned" &&
        pendingCapture.ownership === "before"
      )
    ) {
      throw new Error(
        `Canonical target disappeared without a transaction-owned capture: ${operation.sourcePath}.`,
      );
    }
  }

  if (operation.afterBytes !== null && operation.afterMode !== null) {
    await publishExpectedArtifact(
      repoRoot,
      transactionId,
      operation,
      artifacts.afterStage,
      "after-stage",
      operation.afterBytes,
      operation.afterMode,
      "apply",
      dependencies,
    );
  }
  await assertExpectedCanonicalState(repoRoot, operation, "after");
  if (operation.action === "remove") return;
  await cleanupKnownArtifacts(repoRoot, transactionId, operation, "apply", dependencies);
}

export async function removeKnownCanonicalTemporaryFile(
  repoRoot: string,
  transactionId: string,
  operation: CanonicalMutation,
  dependencies: CanonicalFileDependencies = {},
) {
  assertCanonicalMutationShape(operation);
  parseTransactionId(transactionId);
  const artifacts = operationArtifacts(
    operation.sourcePath,
    transactionId,
    operation.index,
  );
  const pendingCapture = await guardPendingCapture(
    repoRoot,
    operation,
    artifacts,
    "cleanup",
    dependencies,
  );
  const canonical = await readInspectedFileState(
    repoRoot,
    operation.sourcePath,
    "Canonical target",
  );
  const matchesBefore = inspectedStateMatches(
    canonical,
    operation.beforeBytes,
    operation.beforeMode,
  );
  const matchesAfter = inspectedStateMatches(
    canonical,
    operation.afterBytes,
    operation.afterMode,
  );
  if (!matchesBefore && !matchesAfter) {
    throw new Error(
      `Canonical target is not in a recorded state during cleanup: ${operation.sourcePath}.`,
    );
  }
  if (
    operation.action === "remove" &&
    matchesAfter &&
    !(
      pendingCapture.state === "owned" &&
      pendingCapture.ownership === "before"
    ) &&
    !(await isCompletedRemovalAuthorized(dependencies, {
      phase: "cleanup",
      transactionId,
      operationIndex: operation.index,
      sourcePath: operation.sourcePath,
    }))
  ) {
    throw new Error(
      `Canonical target is absent without transaction-owned removal evidence: ${operation.sourcePath}.`,
    );
  }
  await cleanupKnownArtifacts(
    repoRoot,
    transactionId,
    operation,
    "cleanup",
    dependencies,
  );
}

export async function restoreCanonicalMutation(
  repoRoot: string,
  transactionId: string,
  operation: CanonicalMutation,
  dependencies: CanonicalFileDependencies = {},
) {
  assertCanonicalMutationShape(operation);
  parseTransactionId(transactionId);
  const artifacts = operationArtifacts(
    operation.sourcePath,
    transactionId,
    operation.index,
  );
  let pendingCapture: InspectedCapture = await guardPendingCapture(
    repoRoot,
    operation,
    artifacts,
    "restore",
    dependencies,
  );
  if (operation.afterBytes !== null && operation.afterMode !== null) {
    await removeOwnedPartial(
      repoRoot,
      operation.sourcePath,
      artifacts.afterPartial,
      operation.afterBytes,
      operation.afterMode,
      "restore",
      "after-stage",
      dependencies,
      {
        transactionId,
        operation,
        artifacts,
        kind: "after-partial",
      },
    );
  }
  if (operation.beforeBytes !== null && operation.beforeMode !== null) {
    await removeOwnedPartial(
      repoRoot,
      operation.sourcePath,
      artifacts.beforePartial,
      operation.beforeBytes,
      operation.beforeMode,
      "restore",
      "before-stage",
      dependencies,
      {
        transactionId,
        operation,
        artifacts,
        kind: "before-partial",
      },
    );
  }

  let canonical = await readInspectedFileState(
    repoRoot,
    operation.sourcePath,
    "Canonical target",
  );
  if (inspectedStateMatches(canonical, operation.beforeBytes, operation.beforeMode)) {
    await cleanupKnownArtifacts(repoRoot, transactionId, operation, "restore", dependencies);
    return "already-restored" as const;
  }
  if (canonical.state === "present") {
    if (!inspectedStateMatches(canonical, operation.afterBytes, operation.afterMode)) {
      throw new Error(
        `Recovery conflict at ${operation.sourcePath}; bytes or mode match neither the recorded before nor after state.`,
      );
    }
    if (pendingCapture.state === "owned") {
      await removeExpectedArtifact(
        repoRoot,
        operation.sourcePath,
        artifacts.capture,
        pendingCapture.capture.bytes,
        pendingCapture.capture.mode,
        "restore",
        "capture",
        dependencies,
        {
          transactionId,
          operation,
          artifacts,
          kind: "capture",
        },
        pendingCapture.capture,
      );
      pendingCapture = { state: "absent" };
    }
    await captureExpectedCanonical(
      repoRoot,
      transactionId,
      operation,
      operation.afterBytes as Buffer,
      operation.afterMode as number,
      artifacts.afterAnchor,
      "after-anchor",
      artifacts.capture,
      "restore",
      dependencies,
    );
    pendingCapture = await inspectPendingCapture(repoRoot, operation, artifacts);
    if (
      pendingCapture.state !== "owned" ||
      pendingCapture.ownership !== "after"
    ) {
      throw new Error(
        `Recovery did not establish transaction-owned absence: ${operation.sourcePath}.`,
      );
    }
  } else if (operation.beforeBytes === null) {
    await cleanupKnownArtifacts(repoRoot, transactionId, operation, "restore", dependencies);
    return "restored" as const;
  } else if (pendingCapture.state !== "owned") {
    const removalAuthorized =
      operation.action === "remove" &&
      (await isCompletedRemovalAuthorized(dependencies, {
        phase: "restore",
        transactionId,
        operationIndex: operation.index,
        sourcePath: operation.sourcePath,
      }));
    if (!removalAuthorized) {
      throw new Error(
        `Recovery conflict at ${operation.sourcePath}; absence is not owned by this transaction.`,
      );
    }
  }

  canonical = await readInspectedFileState(repoRoot, operation.sourcePath, "Canonical target");
  if (operation.beforeBytes === null) {
    if (canonical.state !== "absent") {
      throw new Error(`Recovery could not make the canonical target absent: ${operation.sourcePath}.`);
    }
  } else {
    let beforeAnchor = await inspectExpectedArtifact(
      repoRoot,
      artifacts.beforeAnchor,
      operation.beforeBytes,
      operation.beforeMode as number,
      "Transaction before anchor",
    );
    let publicationSourcePath = artifacts.beforeAnchor;
    if (beforeAnchor.state === "absent") {
      await ensureReadyArtifact(
        repoRoot,
        transactionId,
        operation,
        artifacts.beforeStage,
        artifacts.beforePartial,
        operation.beforeBytes,
        operation.beforeMode as number,
        "restore",
        "before-stage",
        dependencies,
      );
      beforeAnchor = await inspectExpectedArtifact(
        repoRoot,
        artifacts.beforeStage,
        operation.beforeBytes,
        operation.beforeMode as number,
        "Transaction before stage",
      );
      publicationSourcePath = artifacts.beforeStage;
    }
    if (beforeAnchor.state !== "present") {
      throw new Error(`Recovery has no verified before-state artifact: ${operation.sourcePath}.`);
    }
    await publishExpectedArtifact(
      repoRoot,
      transactionId,
      operation,
      publicationSourcePath,
      publicationSourcePath === artifacts.beforeAnchor
        ? "before-anchor"
        : "before-stage",
      operation.beforeBytes,
      operation.beforeMode as number,
      "restore",
      dependencies,
    );
  }

  await assertExpectedCanonicalState(repoRoot, operation, "before");
  await cleanupKnownArtifacts(repoRoot, transactionId, operation, "restore", dependencies);
  return "restored" as const;
}

export async function ensureNoCanonicalTemporaryFiles(
  repoRoot: string,
  transactionId: string,
  operations: readonly CanonicalMutation[],
  dependencies: CanonicalFileDependencies = {},
) {
  for (const operation of operations) {
    await removeKnownCanonicalTemporaryFile(
      repoRoot,
      transactionId,
      operation,
      dependencies,
    );
  }
}
