import { execFileSync } from "node:child_process";
import { constants as fsConstants } from "node:fs";
import {
  closeSync,
  fstatSync,
  lstatSync,
  openSync,
  readFileSync,
  readdirSync,
  realpathSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  KNOWLEDGE_CERTIFICATION_LEASE_ENVIRONMENT_KEY,
  KNOWLEDGE_CERTIFICATION_LEASE_ID_PATTERN,
  KNOWLEDGE_CONTROL_LIMITS,
  KNOWLEDGE_CONTROL_NAMES,
  KNOWLEDGE_PAYLOAD_NAME_PATTERN,
  KNOWLEDGE_TERMINAL_RECEIPT_NAME_PATTERN,
  assertKnowledgeCertificationLeaseMetadata,
  assertKnowledgeControlCommand,
  assertKnowledgeUnfinishedMarker,
  assertKnowledgeWriterLockMetadata,
  isKnowledgeTransactionId,
  knowledgeControlHostFingerprint,
  parseKnowledgeCertificationLeaseDirectoryName,
  parseKnowledgeCertificationLeaseTransitionName,
  parseKnowledgePendingFileName,
  parseKnowledgeTransactionStagingName,
  parseKnowledgeWriterLockRecoveryName,
  parseKnowledgeWriterLockStagingName,
} from "./knowledge-record-control-contract.mjs";

const ACTIVE_CONTEXT_ERROR =
  "Knowledge certification context is missing or invalid. Run the protected package command for this entry point.";

function ordinaryRealDirectory(directoryPath, label, expectedMode = null) {
  let information;
  let physicalPath;
  try {
    information = lstatSync(directoryPath);
    physicalPath = realpathSync(directoryPath);
  } catch {
    throw new Error(`${label} is missing or unsafe.`);
  }
  if (information.isSymbolicLink() || !information.isDirectory()) {
    throw new Error(`${label} must be an ordinary directory, not a symbolic link.`);
  }
  const resolved = path.resolve(directoryPath);
  if (physicalPath !== resolved) {
    throw new Error(`${label} must not contain symbolic-link path components.`);
  }
  if (expectedMode !== null && (information.mode & 0o777) !== expectedMode) {
    throw new Error(`${label} must use mode ${expectedMode.toString(8)}.`);
  }
  return resolved;
}

function resolveGitDirectory(repoRoot) {
  const repositoryRoot = ordinaryRealDirectory(
    path.resolve(repoRoot),
    "Repository root",
  );
  let gitDirectory;
  try {
    gitDirectory = execFileSync("git", ["rev-parse", "--absolute-git-dir"], {
      cwd: repositoryRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    throw new Error("Repository root is not inside a Git worktree.");
  }
  if (!path.isAbsolute(gitDirectory)) {
    throw new Error("Git returned a non-absolute metadata directory.");
  }
  return {
    repositoryRoot,
    gitDirectory: ordinaryRealDirectory(
      gitDirectory,
      "Git metadata directory",
    ),
  };
}

function entryInformation(parent, entryName) {
  try {
    return lstatSync(path.join(parent, entryName));
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw new Error("Knowledge transaction control could not be inspected safely.");
  }
}

function inspectPrivateFile(filePath, label, maximumBytes) {
  let descriptor;
  try {
    descriptor = openSync(
      filePath,
      fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW,
    );
    const information = fstatSync(descriptor);
    if (
      !information.isFile() ||
      (information.mode & 0o777) !== 0o600 ||
      information.size > maximumBytes
    ) {
      throw new Error();
    }
    return descriptor;
  } catch {
    if (descriptor !== undefined) closeSync(descriptor);
    throw new Error(`${label} is unsafe.`);
  }
}

function assertPrivateFile(filePath, label, maximumBytes) {
  const descriptor = inspectPrivateFile(filePath, label, maximumBytes);
  closeSync(descriptor);
}

function readPrivateJson(filePath, label, maximumBytes) {
  const descriptor = inspectPrivateFile(filePath, label, maximumBytes);
  try {
    return JSON.parse(readFileSync(descriptor, "utf8"));
  } catch {
    throw new Error(`${label} is malformed.`);
  } finally {
    closeSync(descriptor);
  }
}

function isPidAlive(pid) {
  if (!Number.isSafeInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error?.code !== "ESRCH";
  }
}

function isProcessGroupAlive(processGroupId) {
  if (!Number.isSafeInteger(processGroupId) || processGroupId <= 0) return false;
  try {
    process.kill(-processGroupId, 0);
    return true;
  } catch (error) {
    return error?.code !== "ESRCH";
  }
}

function isLiveLocalOwner(owner) {
  return (
    owner.hostnameHash === knowledgeControlHostFingerprint(os.hostname()) &&
    isPidAlive(owner.pid)
  );
}

function inspectPendingEntry({
  directoryPath,
  entry,
  allowed,
  label,
  maximumBytes,
}) {
  let pending;
  try {
    pending = parseKnowledgePendingFileName(entry.name);
  } catch {
    throw new Error(`${label} contains a malformed pending file.`);
  }
  if (!pending) return null;
  if (
    !entry.isFile() ||
    !allowed.some(
      ({ mode, test }) => mode === pending.mode && test(pending.finalName),
    )
  ) {
    throw new Error(`${label} contains an unsafe pending file.`);
  }
  assertPrivateFile(
    path.join(directoryPath, entry.name),
    `${label} pending file`,
    maximumBytes,
  );
  return Object.freeze({
    pending,
    recoveryRequired: !isLiveLocalOwner(pending.owner),
  });
}

function inspectWriterLock(transactionRoot) {
  const lockDirectory = ordinaryRealDirectory(
    path.join(transactionRoot, KNOWLEDGE_CONTROL_NAMES.writerLock),
    "Knowledge transaction writer lock",
    0o700,
  );
  const inventory = readdirSync(lockDirectory);
  if (
    inventory.length !== 1 ||
    inventory[0] !== KNOWLEDGE_CONTROL_NAMES.writerLockMetadata
  ) {
    throw new Error("Knowledge transaction writer lock inventory is malformed.");
  }
  const metadata = assertKnowledgeWriterLockMetadata(
    readPrivateJson(
      path.join(lockDirectory, KNOWLEDGE_CONTROL_NAMES.writerLockMetadata),
      "Knowledge transaction writer lock metadata",
      KNOWLEDGE_CONTROL_LIMITS.metadataBytes,
    ),
  );
  const ownerIsProvablyDead =
    metadata.hostname === os.hostname() && !isPidAlive(metadata.pid);
  return Object.freeze({ metadata, recoveryRequired: ownerIsProvablyDead });
}

function inspectCertificationLeaseRoot(transactionRoot) {
  const leaseRoot = ordinaryRealDirectory(
    path.join(transactionRoot, KNOWLEDGE_CONTROL_NAMES.certificationLeaseRoot),
    "Knowledge certification lease root",
    0o700,
  );
  const leases = new Map();
  let recoveryArtifactsPresent = false;
  for (const entry of readdirSync(leaseRoot, { withFileTypes: true })) {
    const transition = parseKnowledgeCertificationLeaseTransitionName(
      entry.name,
    );
    if (transition) {
      if (
        !entry.isDirectory() ||
        transition.owner.lockId !== transition.leaseId
      ) {
        throw new Error("Knowledge certification lease transition is unsafe.");
      }
      ordinaryRealDirectory(
        path.join(leaseRoot, entry.name),
        "Knowledge certification lease transition",
        0o700,
      );
      recoveryArtifactsPresent = true;
      continue;
    }

    const leaseId = parseKnowledgeCertificationLeaseDirectoryName(entry.name);
    if (!leaseId || !entry.isDirectory()) {
      throw new Error(
        "Knowledge certification lease root contains an unrecognized artifact.",
      );
    }
    const leaseDirectory = ordinaryRealDirectory(
      path.join(leaseRoot, entry.name),
      "Knowledge certification lease",
      0o700,
    );
    let metadataPresent = false;
    let pendingCount = 0;
    let leaseRecoveryRequired = false;
    for (const child of readdirSync(leaseDirectory, { withFileTypes: true })) {
      if (child.name === KNOWLEDGE_CONTROL_NAMES.certificationLeaseMetadata) {
        if (!child.isFile() || metadataPresent) {
          throw new Error("Knowledge certification lease inventory is malformed.");
        }
        metadataPresent = true;
        continue;
      }
      const pending = inspectPendingEntry({
        directoryPath: leaseDirectory,
        entry: child,
        allowed: [
          {
            mode: "replace",
            test: (name) =>
              name === KNOWLEDGE_CONTROL_NAMES.certificationLeaseMetadata,
          },
        ],
        label: "Knowledge certification lease",
        maximumBytes: KNOWLEDGE_CONTROL_LIMITS.metadataBytes,
      });
      if (!pending) {
        throw new Error("Knowledge certification lease inventory is malformed.");
      }
      pendingCount += 1;
      if (pendingCount > 1) {
        throw new Error("Knowledge certification lease inventory is malformed.");
      }
      leaseRecoveryRequired ||= pending.recoveryRequired;
    }
    if (!metadataPresent) {
      throw new Error("Knowledge certification lease inventory is malformed.");
    }
    const metadata = assertKnowledgeCertificationLeaseMetadata(
      readPrivateJson(
        path.join(
          leaseDirectory,
          KNOWLEDGE_CONTROL_NAMES.certificationLeaseMetadata,
        ),
        "Knowledge certification lease metadata",
        KNOWLEDGE_CONTROL_LIMITS.metadataBytes,
      ),
    );
    if (metadata.leaseId !== leaseId || leases.has(leaseId)) {
      throw new Error(
        "Knowledge certification lease identity does not match its directory.",
      );
    }
    if (
      metadata.hostname === os.hostname() &&
      !isPidAlive(metadata.pid) &&
      (metadata.protectedChildPid === null ||
        !isPidAlive(metadata.protectedChildPid)) &&
      (metadata.protectedProcessGroupId === null ||
        !isProcessGroupAlive(metadata.protectedProcessGroupId))
    ) {
      leaseRecoveryRequired = true;
    }
    recoveryArtifactsPresent ||= leaseRecoveryRequired;
    leases.set(
      leaseId,
      Object.freeze({ metadata, recoveryRequired: leaseRecoveryRequired }),
    );
  }
  return Object.freeze({ leases, recoveryArtifactsPresent });
}

function inspectArtifactDirectory({
  directoryPath,
  label,
  artifactPattern,
  maximumBytes,
}) {
  let recoveryArtifactsPresent = false;
  for (const entry of readdirSync(directoryPath, { withFileTypes: true })) {
    if (artifactPattern.test(entry.name)) {
      if (!entry.isFile()) {
        throw new Error(`${label} inventory is malformed.`);
      }
      assertPrivateFile(
        path.join(directoryPath, entry.name),
        `${label} artifact`,
        maximumBytes,
      );
      continue;
    }
    const pending = inspectPendingEntry({
      directoryPath,
      entry,
      allowed: [{ mode: "create", test: (name) => artifactPattern.test(name) }],
      label,
      maximumBytes,
    });
    if (!pending) throw new Error(`${label} inventory is malformed.`);
    recoveryArtifactsPresent ||= pending.recoveryRequired;
  }
  return recoveryArtifactsPresent;
}

function inspectCommittedTransaction(transactionRoot, transactionId) {
  const transactionDirectory = ordinaryRealDirectory(
    path.join(transactionRoot, transactionId),
    "Knowledge transaction",
    0o700,
  );
  const required = new Map([
    [KNOWLEDGE_CONTROL_NAMES.manifest, "file"],
    [KNOWLEDGE_CONTROL_NAMES.journal, "file"],
    [KNOWLEDGE_CONTROL_NAMES.payloadDirectory, "directory"],
    [KNOWLEDGE_CONTROL_NAMES.terminalReceiptDirectory, "directory"],
  ]);
  let unfinished = false;
  let recoveryArtifactsPresent = false;
  for (const entry of readdirSync(transactionDirectory, { withFileTypes: true })) {
    const expectedKind = required.get(entry.name);
    if (expectedKind) {
      if (
        (expectedKind === "file" && !entry.isFile()) ||
        (expectedKind === "directory" && !entry.isDirectory())
      ) {
        throw new Error("Knowledge transaction inventory is malformed.");
      }
      required.delete(entry.name);
      continue;
    }
    if (entry.name === KNOWLEDGE_CONTROL_NAMES.unfinishedMarker) {
      if (!entry.isFile() || unfinished) {
        throw new Error("Knowledge transaction unfinished marker is unsafe.");
      }
      unfinished = true;
      continue;
    }
    const pending = inspectPendingEntry({
      directoryPath: transactionDirectory,
      entry,
      allowed: [
        {
          mode: "replace",
          test: (name) => name === KNOWLEDGE_CONTROL_NAMES.journal,
        },
        {
          mode: "create",
          test: (name) => name === KNOWLEDGE_CONTROL_NAMES.unfinishedMarker,
        },
      ],
      label: "Knowledge transaction",
      maximumBytes: KNOWLEDGE_CONTROL_LIMITS.journalBytes,
    });
    if (!pending) {
      throw new Error("Knowledge transaction inventory is malformed.");
    }
    recoveryArtifactsPresent ||= pending.recoveryRequired;
  }
  if (required.size > 0) {
    throw new Error("Knowledge transaction inventory is malformed.");
  }

  assertPrivateFile(
    path.join(transactionDirectory, KNOWLEDGE_CONTROL_NAMES.manifest),
    "Knowledge transaction manifest",
    KNOWLEDGE_CONTROL_LIMITS.manifestBytes,
  );
  assertPrivateFile(
    path.join(transactionDirectory, KNOWLEDGE_CONTROL_NAMES.journal),
    "Knowledge transaction journal",
    KNOWLEDGE_CONTROL_LIMITS.journalBytes,
  );
  const payloadDirectory = ordinaryRealDirectory(
    path.join(transactionDirectory, KNOWLEDGE_CONTROL_NAMES.payloadDirectory),
    "Knowledge transaction payload directory",
    0o700,
  );
  const receiptDirectory = ordinaryRealDirectory(
    path.join(
      transactionDirectory,
      KNOWLEDGE_CONTROL_NAMES.terminalReceiptDirectory,
    ),
    "Knowledge transaction terminal receipt directory",
    0o700,
  );
  const payloadRecoveryRequired = inspectArtifactDirectory({
    directoryPath: payloadDirectory,
    label: "Knowledge transaction payload",
    artifactPattern: KNOWLEDGE_PAYLOAD_NAME_PATTERN,
    maximumBytes: KNOWLEDGE_CONTROL_LIMITS.manifestBytes,
  });
  const receiptRecoveryRequired = inspectArtifactDirectory({
    directoryPath: receiptDirectory,
    label: "Knowledge transaction terminal receipt",
    artifactPattern: KNOWLEDGE_TERMINAL_RECEIPT_NAME_PATTERN,
    maximumBytes: KNOWLEDGE_CONTROL_LIMITS.metadataBytes,
  });
  recoveryArtifactsPresent ||=
    payloadRecoveryRequired || receiptRecoveryRequired;
  if (unfinished) {
    assertKnowledgeUnfinishedMarker(
      readPrivateJson(
        path.join(transactionDirectory, KNOWLEDGE_CONTROL_NAMES.unfinishedMarker),
        "Knowledge transaction unfinished marker",
        KNOWLEDGE_CONTROL_LIMITS.metadataBytes,
      ),
      transactionId,
    );
  }
  return Object.freeze({ unfinished, recoveryArtifactsPresent });
}

function inspectKnowledgeTransactionControl({ repoRoot }) {
  const { repositoryRoot, gitDirectory } = resolveGitDirectory(repoRoot);
  const transactionRoot = path.join(
    gitDirectory,
    KNOWLEDGE_CONTROL_NAMES.transactionRoot,
  );
  const rootInformation = entryInformation(
    gitDirectory,
    KNOWLEDGE_CONTROL_NAMES.transactionRoot,
  );
  if (!rootInformation) {
    return {
      repositoryRoot,
      gitDirectory,
      transactionRoot,
      writerLockPresent: false,
      activeCertificationLeaseCount: 0,
      unfinishedTransactionIds: [],
      recoveryArtifactsPresent: false,
      certificationLeases: new Map(),
    };
  }
  ordinaryRealDirectory(
    transactionRoot,
    "Knowledge transaction root",
    0o700,
  );

  let writerLockPresent = false;
  let activeCertificationLeaseCount = 0;
  let recoveryArtifactsPresent = false;
  let certificationLeases = new Map();
  const unfinishedTransactionIds = [];
  for (const entry of readdirSync(transactionRoot, { withFileTypes: true })) {
    if (entry.name === KNOWLEDGE_CONTROL_NAMES.writerLock) {
      if (!entry.isDirectory() || writerLockPresent) {
        throw new Error("Knowledge transaction writer lock is unsafe.");
      }
      const writer = inspectWriterLock(transactionRoot);
      writerLockPresent = true;
      recoveryArtifactsPresent ||= writer.recoveryRequired;
      continue;
    }
    if (entry.name === KNOWLEDGE_CONTROL_NAMES.certificationLeaseRoot) {
      if (!entry.isDirectory() || certificationLeases.size > 0) {
        throw new Error("Knowledge certification lease root is unsafe.");
      }
      const inspected = inspectCertificationLeaseRoot(transactionRoot);
      certificationLeases = inspected.leases;
      activeCertificationLeaseCount = certificationLeases.size;
      recoveryArtifactsPresent ||= inspected.recoveryArtifactsPresent;
      continue;
    }

    const writerStaging = parseKnowledgeWriterLockStagingName(entry.name);
    const writerRecovery = parseKnowledgeWriterLockRecoveryName(entry.name);
    const transactionStaging = parseKnowledgeTransactionStagingName(entry.name);
    if (writerStaging || writerRecovery || transactionStaging) {
      if (!entry.isDirectory()) {
        throw new Error("Knowledge transaction recovery artifact is unsafe.");
      }
      ordinaryRealDirectory(
        path.join(transactionRoot, entry.name),
        "Knowledge transaction recovery artifact",
        0o700,
      );
      recoveryArtifactsPresent = true;
      continue;
    }

    if (!entry.isDirectory() || !isKnowledgeTransactionId(entry.name)) {
      throw new Error(
        "Knowledge transaction root contains an unrecognized artifact.",
      );
    }
    const transaction = inspectCommittedTransaction(
      transactionRoot,
      entry.name,
    );
    if (transaction.unfinished) unfinishedTransactionIds.push(entry.name);
    recoveryArtifactsPresent ||= transaction.recoveryArtifactsPresent;
  }
  unfinishedTransactionIds.sort();
  return {
    repositoryRoot,
    gitDirectory,
    transactionRoot,
    writerLockPresent,
    activeCertificationLeaseCount,
    unfinishedTransactionIds,
    recoveryArtifactsPresent,
    certificationLeases,
  };
}

export function inspectKnowledgeTransactionGuard({ repoRoot }) {
  const control = inspectKnowledgeTransactionControl({ repoRoot });
  return Object.freeze({
    ok:
      !control.writerLockPresent &&
      !control.recoveryArtifactsPresent &&
      control.unfinishedTransactionIds.length === 0,
    repositoryRoot: control.repositoryRoot,
    gitDirectory: control.gitDirectory,
    transactionRoot: control.transactionRoot,
    writerLockPresent: control.writerLockPresent,
    activeCertificationLeaseCount: control.activeCertificationLeaseCount,
    unfinishedTransactionIds: Object.freeze([
      ...control.unfinishedTransactionIds,
    ]),
    recoveryArtifactsPresent: control.recoveryArtifactsPresent,
  });
}

export function assertActiveKnowledgeCertificationContext({
  repoRoot,
  expectedCommand,
}) {
  try {
    assertKnowledgeControlCommand(expectedCommand);
    const leaseId = process.env[KNOWLEDGE_CERTIFICATION_LEASE_ENVIRONMENT_KEY];
    if (
      typeof leaseId !== "string" ||
      !KNOWLEDGE_CERTIFICATION_LEASE_ID_PATTERN.test(leaseId)
    ) {
      throw new Error();
    }
    const control = inspectKnowledgeTransactionControl({ repoRoot });
    if (
      control.writerLockPresent ||
      control.recoveryArtifactsPresent ||
      control.unfinishedTransactionIds.length > 0
    ) {
      throw new Error();
    }
    const lease = control.certificationLeases.get(leaseId);
    if (!lease || lease.recoveryRequired) throw new Error();
    const metadata = lease.metadata;
    if (
      metadata.leaseId !== leaseId ||
      metadata.command !== expectedCommand ||
      metadata.hostname !== os.hostname() ||
      metadata.protectedChildPid !== process.ppid ||
      metadata.protectedProcessGroupId === null ||
      !isPidAlive(metadata.pid) ||
      !isPidAlive(metadata.protectedChildPid) ||
      !isProcessGroupAlive(metadata.protectedProcessGroupId)
    ) {
      throw new Error();
    }
    return Object.freeze({
      repositoryRoot: control.repositoryRoot,
      leaseId,
      command: metadata.command,
    });
  } catch {
    throw new Error(ACTIVE_CONTEXT_ERROR);
  }
}

export function assertNoUnfinishedKnowledgeTransaction({ repoRoot }) {
  const status = inspectKnowledgeTransactionGuard({ repoRoot });
  if (status.ok) return status;
  const reasons = [];
  if (status.writerLockPresent) {
    reasons.push("a transaction writer lock is active");
  }
  if (status.unfinishedTransactionIds.length > 0) {
    reasons.push(
      `recovery is required for ${status.unfinishedTransactionIds.join(", ")}`,
    );
  }
  if (status.recoveryArtifactsPresent) {
    reasons.push("an interrupted transaction-control artifact is present");
  }
  throw new Error(
    `Knowledge record checks are blocked because ${reasons.join("; ")}.`,
  );
}
