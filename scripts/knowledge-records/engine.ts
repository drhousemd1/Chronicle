import { createHash } from "node:crypto";

import { validateOperationalRecordSources } from "../../src/data/chronicle-knowledge-base/operational-record-contract";
import { inspectKnowledgeTransactionGuard } from "../knowledge-record-transaction-guard.mjs";

import {
  applyCanonicalMutation,
  ensureNoCanonicalTemporaryFiles,
  restoreCanonicalMutation,
  assertCanonicalArtifactOwnershipProof,
  type CanonicalArtifactOwnershipProof,
  type CanonicalFileDependencies,
  type CanonicalMutation,
} from "./canonical-files";
import {
  candidateSourceDigest,
  validateKnowledgeRecordCandidate,
  validateStoredKnowledgeRecordCandidate,
  type CandidateOperation,
  type ValidatedKnowledgeRecordCandidate,
} from "./candidate";
import {
  CHANGELOG_MIGRATION_RECEIPT_LOCATION,
  isAcceptedChangeId,
  isLegacyChangeId,
  parseCanonicalRecordSourcePath,
} from "./path-safety";
import {
  parseKnowledgeRecordRequest,
  type KnowledgeRecordRequestKind,
  type NormalizedKnowledgeRecordRequest,
} from "./request-contract";
import {
  inventoryToCanonicalSourceMap,
  inventoryToOperationalSourceMap,
  readCanonicalSourceInventory,
  sha256Buffer,
  type CanonicalSourceInventory,
} from "./source-set";
import {
  acquireKnowledgeCertificationLease,
  acquireKnowledgeTransactionLock,
  appendKnowledgeTransactionJournalEvent,
  clearKnowledgeTransactionUnfinished,
  createPreparedKnowledgeTransaction,
  generateKnowledgeTransactionId,
  getKnowledgeTransactionStatus,
  listKnowledgeTransactionStatuses,
  listUnfinishedKnowledgeTransactionIds,
  markKnowledgeTransactionUnfinished,
  openVerifiedKnowledgeTransaction,
  readKnowledgeTransactionJournal,
  releaseKnowledgeCertificationLease,
  releaseKnowledgeTransactionLock,
  truncateTornKnowledgeTransactionJournal,
  writeKnowledgeTransactionTerminalReceipt,
  type KnowledgeTransactionOperationInput,
  type KnowledgeTransactionSnapshot,
  type KnowledgeTransactionStatus,
  type TransactionStoreDependencies,
  type VerifiedKnowledgeTransaction,
} from "./transaction-store";

export type KnowledgeRecordMutationPhase = "apply" | "rollback" | "recover";

export type KnowledgeRecordEngineDependencies = Readonly<{
  store?: TransactionStoreDependencies;
  canonicalFiles?: CanonicalFileDependencies;
  today?: () => string;
  afterCanonicalMutation?: (event: Readonly<{
    phase: KnowledgeRecordMutationPhase;
    operationIndex: number;
    mutationCount: number;
  }>) => void | Promise<void>;
}>;

export type PreparedKnowledgeRecordTransaction = Readonly<{
  transactionId: string;
  kind: KnowledgeRecordRequestKind;
  operationCount: number;
  candidateSha256: string;
}>;

export type AppliedKnowledgeRecordTransaction = Readonly<{
  transactionId: string;
  outcome: "applied" | "already-applied";
  validationSha256: string;
}>;

export type RecoveredKnowledgeRecordTransaction = Readonly<{
  transactionId: string;
  outcome: "recovered" | "already-recovered" | "prepared" | "already-applied";
  validationSha256: string | null;
}>;

export type KnowledgeRecordEngineStatus = Readonly<{
  transactions: readonly KnowledgeTransactionStatus[];
  unfinishedTransactionIds: readonly string[];
  transactionInventoryReadable: boolean;
  control: Readonly<{
    writerLockPresent: boolean;
    activeCertificationLeaseCount: number;
    recoveryArtifactsPresent: boolean;
    blocker: string | null;
  }>;
}>;

class KnowledgeRecordAutomaticRecoveryError extends Error {
  readonly applyError: unknown;
  readonly recoveryError: unknown;

  constructor(
    transactionId: string,
    applyError: unknown,
    recoveryError: unknown,
  ) {
    super(
      `Transaction ${transactionId} failed and automatic recovery did not finish. Run recover.`,
    );
    this.name = "KnowledgeRecordAutomaticRecoveryError";
    this.applyError = applyError;
    this.recoveryError = recoveryError;
  }
}

function defaultToday() {
  return new Date().toISOString().slice(0, 10);
}

function assertAsOfNotFuture(asOf: string, today: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(today)) {
    throw new Error("Knowledge record engine today() must return YYYY-MM-DD.");
  }
  if (asOf > today) {
    throw new Error(`Knowledge record request date ${asOf} is in the future.`);
  }
}

function transactionPackageSha256(request: NormalizedKnowledgeRecordRequest) {
  const hash = createHash("sha256");
  hash.update(`request:${request.requestSha256}\n`);
  for (const operation of request.operations) {
    hash.update(`${operation.order}:${operation.action}:${operation.targetSourcePath}\n`);
    if ("content" in operation) {
      hash.update(`${operation.content.sha256}:${operation.content.bytes.length}\n`);
    }
  }
  return hash.digest("hex");
}

function buildTransactionSnapshot(
  inventory: CanonicalSourceInventory,
  request: NormalizedKnowledgeRecordRequest,
): KnowledgeTransactionSnapshot {
  const sources: KnowledgeTransactionSnapshot["sources"] = [
    ...inventory.entries.map((entry) => ({
      path: entry.sourcePath,
      state: "present" as const,
      sha256: entry.sha256,
      mode: entry.mode,
    })),
    ...request.operations
      .filter((operation) => operation.action === "create")
      .map((operation) => ({
        path: operation.targetSourcePath,
        state: "absent" as const,
      })),
  ].sort((left, right) => left.path.localeCompare(right.path));

  return Object.freeze({
    validationAsOf: request.asOf,
    requestSha256: request.requestSha256,
    packageSha256: transactionPackageSha256(request),
    sources,
  });
}

function candidateToStoreOperations(
  operations: readonly CandidateOperation[],
): KnowledgeTransactionOperationInput[] {
  return operations.map((operation) => {
    if (operation.action === "create") {
      if (!operation.afterBytes) {
        throw new Error(`Prepared create has no staged bytes: ${operation.sourcePath}.`);
      }
      return {
        action: "create" as const,
        path: operation.sourcePath,
        afterBytes: operation.afterBytes,
      };
    }
    if (!operation.beforeBytes) {
      throw new Error(`Prepared ${operation.action} has no before bytes: ${operation.sourcePath}.`);
    }
    if (operation.action === "update") {
      if (!operation.afterBytes) {
        throw new Error(`Prepared update has no staged bytes: ${operation.sourcePath}.`);
      }
      return {
        action: "update" as const,
        path: operation.sourcePath,
        beforeBytes: operation.beforeBytes,
        afterBytes: operation.afterBytes,
      };
    }
    return {
      action: "remove" as const,
      path: operation.sourcePath,
      beforeBytes: operation.beforeBytes,
    };
  });
}

function snapshotByPath(transaction: VerifiedKnowledgeTransaction) {
  return new Map(transaction.snapshot.sources.map((entry) => [entry.path, entry]));
}

function storedTransactionToCandidateOperations(
  transaction: VerifiedKnowledgeTransaction,
): readonly CandidateOperation[] {
  const snapshot = snapshotByPath(transaction);
  return Object.freeze(
    transaction.operations.map((operation, position) => {
      if (operation.index !== position) {
        throw new Error("Transaction operations are not in canonical zero-based order.");
      }
      if (operation.action === "move") {
        throw new Error("Chronicle Knowledge record transactions do not support move operations.");
      }
      if (!operation.path) {
        throw new Error(`Transaction operation ${position} has no canonical path.`);
      }
      parseCanonicalRecordSourcePath(operation.path);
      const captured = snapshot.get(operation.path);
      if (!captured) {
        throw new Error(`Transaction snapshot does not include ${operation.path}.`);
      }
      if (operation.action === "create") {
        if (captured.state !== "absent" || !operation.afterBytes || operation.beforeBytes) {
          throw new Error(`Stored create operation ${position} is inconsistent.`);
        }
        return Object.freeze({
          index: position,
          action: "create" as const,
          sourcePath: operation.path,
          beforeBytes: null,
          beforeMode: null,
          afterBytes: operation.afterBytes,
          afterMode: 0o644,
        });
      }
      if (captured.state !== "present" || !operation.beforeBytes) {
        throw new Error(`Stored ${operation.action} operation ${position} is inconsistent.`);
      }
      if (operation.action === "update") {
        if (!operation.afterBytes) {
          throw new Error(`Stored update operation ${position} has no staged bytes.`);
        }
        return Object.freeze({
          index: position,
          action: "update" as const,
          sourcePath: operation.path,
          beforeBytes: operation.beforeBytes,
          beforeMode: captured.mode,
          afterBytes: operation.afterBytes,
          afterMode: captured.mode,
        });
      }
      return Object.freeze({
        index: position,
        action: "remove" as const,
        sourcePath: operation.path,
        beforeBytes: operation.beforeBytes,
        beforeMode: captured.mode,
        afterBytes: null,
        afterMode: null,
      });
    }),
  );
}

function assertChronicleTransactionShape(
  transaction: VerifiedKnowledgeTransaction,
  operations: readonly CandidateOperation[],
) {
  for (const entry of transaction.snapshot.sources) {
    parseCanonicalRecordSourcePath(entry.path);
  }
  const absentSnapshotPaths = transaction.snapshot.sources
    .filter((entry) => entry.state === "absent")
    .map((entry) => entry.path)
    .sort();
  const createdPaths = operations
    .filter((operation) => operation.action === "create")
    .map((operation) => operation.sourcePath)
    .sort();
  if (absentSnapshotPaths.join("\0") !== createdPaths.join("\0")) {
    throw new Error("Transaction expected-absent paths do not exactly match its creates.");
  }

  const identities = operations.map((operation) =>
    parseCanonicalRecordSourcePath(operation.sourcePath),
  );
  if (transaction.kind === "project-create" || transaction.kind === "project-update") {
    const expectedAction = transaction.kind === "project-create" ? "create" : "update";
    if (
      operations.length !== 1 ||
      operations[0].action !== expectedAction ||
      identities[0].location !== "active-current-work"
    ) {
      throw new Error(`${transaction.kind} transaction shape is invalid.`);
    }
    return;
  }
  if (transaction.kind === "issue-create" || transaction.kind === "issue-update") {
    const expectedAction = transaction.kind === "issue-create" ? "create" : "update";
    if (
      operations.length !== 1 ||
      operations[0].action !== expectedAction ||
      identities[0].location !== "issue"
    ) {
      throw new Error(`${transaction.kind} transaction shape is invalid.`);
    }
    return;
  }
  if (transaction.kind === "legacy-import") {
    if (
      operations.length < 2 ||
      operations.at(-1)?.action !== "create" ||
      identities.at(-1)?.location !== CHANGELOG_MIGRATION_RECEIPT_LOCATION ||
      operations.slice(0, -1).some(
        (operation, index) =>
          operation.action !== "create" ||
          identities[index].location !== "changelog" ||
          !isLegacyChangeId(identities[index].recordId),
      )
    ) {
      throw new Error(
        "Legacy import must create only legacy Changelog records and create the migration receipt last.",
      );
    }
    return;
  }
  if (transaction.kind === "correction") {
    if (
      operations.length !== 1 ||
      operations[0].action !== "create" ||
      identities[0].location !== "changelog" ||
      !/-COR-\d{3}$/.test(identities[0].recordId)
    ) {
      throw new Error("Correction transaction shape is invalid.");
    }
    return;
  }
  const closeoutOffset = operations.length - 3;
  const issueUpdates = operations.slice(0, closeoutOffset);
  const archiveOperation = operations[closeoutOffset];
  const changelogOperation = operations[closeoutOffset + 1];
  const activeRemoval = operations[closeoutOffset + 2];
  const archiveIdentity = identities[closeoutOffset];
  const changelogIdentity = identities[closeoutOffset + 1];
  const activeIdentity = identities[closeoutOffset + 2];
  if (
    operations.length < 3 ||
    issueUpdates.some(
      (operation, index) =>
        operation.action !== "update" || identities[index].location !== "issue",
    ) ||
    archiveOperation?.action !== "create" ||
    archiveIdentity?.location !== "archived-current-work" ||
    changelogOperation?.action !== "create" ||
    changelogIdentity?.location !== "changelog" ||
    !isAcceptedChangeId(changelogIdentity.recordId) ||
    activeRemoval?.action !== "remove" ||
    activeIdentity?.location !== "active-current-work" ||
    archiveIdentity?.recordId !== activeIdentity?.recordId
  ) {
    throw new Error(
      "Closeout may update linked Issues first, then must create the archive, create the accepted Changelog record, and remove the matching active project last.",
    );
  }
}

function assertInventoryMatchesSnapshot(
  inventory: CanonicalSourceInventory,
  transaction: VerifiedKnowledgeTransaction,
) {
  const actual = new Map(inventory.entries.map((entry) => [entry.sourcePath, entry]));
  const expectedPresent = transaction.snapshot.sources.filter(
    (entry) => entry.state === "present",
  );
  const actualMembership = [...actual.keys()].sort();
  const expectedMembership = expectedPresent.map((entry) => entry.path).sort();
  if (actualMembership.join("\0") !== expectedMembership.join("\0")) {
    throw new Error("Canonical source membership changed after this transaction was prepared.");
  }
  for (const expected of expectedPresent) {
    const entry = actual.get(expected.path);
    if (
      !entry ||
      entry.sha256 !== expected.sha256 ||
      entry.mode !== expected.mode
    ) {
      throw new Error(`Canonical source changed after preparation: ${expected.path}.`);
    }
  }
  for (const expected of transaction.snapshot.sources) {
    if (expected.state === "absent" && actual.has(expected.path)) {
      throw new Error(`Expected-absent canonical source now exists: ${expected.path}.`);
    }
  }
}

function expectedFinalState(
  transaction: VerifiedKnowledgeTransaction,
  operations: readonly CandidateOperation[],
) {
  const expected = new Map<
    string,
    Readonly<{ sha256: string; mode: number }>
  >();
  for (const entry of transaction.snapshot.sources) {
    if (entry.state === "present") {
      expected.set(entry.path, { sha256: entry.sha256, mode: entry.mode });
    }
  }
  for (const operation of operations) {
    if (operation.action === "remove") {
      expected.delete(operation.sourcePath);
    } else {
      if (!operation.afterBytes || operation.afterMode === null) {
        throw new Error(`Operation ${operation.index} has no final file state.`);
      }
      expected.set(operation.sourcePath, {
        sha256: sha256Buffer(operation.afterBytes),
        mode: operation.afterMode,
      });
    }
  }
  return expected;
}

function assertInventoryMatchesFinalState(
  inventory: CanonicalSourceInventory,
  transaction: VerifiedKnowledgeTransaction,
  operations: readonly CandidateOperation[],
) {
  const expected = expectedFinalState(transaction, operations);
  const actual = new Map(inventory.entries.map((entry) => [entry.sourcePath, entry]));
  if ([...expected.keys()].sort().join("\0") !== [...actual.keys()].sort().join("\0")) {
    throw new Error("Canonical source membership does not match the transaction's final state.");
  }
  for (const [sourcePath, expectedEntry] of expected) {
    const actualEntry = actual.get(sourcePath);
    if (
      !actualEntry ||
      actualEntry.sha256 !== expectedEntry.sha256 ||
      actualEntry.mode !== expectedEntry.mode
    ) {
      throw new Error(`Canonical source does not match the transaction's final state: ${sourcePath}.`);
    }
  }
}

function validateFinalInventory(
  inventory: CanonicalSourceInventory,
  transaction: VerifiedKnowledgeTransaction,
  baselineSources: Readonly<Record<string, string>>,
) {
  const finalSources = inventoryToOperationalSourceMap(inventory);
  const validation = validateOperationalRecordSources(finalSources, {
    asOf: transaction.snapshot.validationAsOf,
    baselineSources,
  });
  if (!validation.ok) {
    throw new Error(
      `Final Knowledge record source set is invalid:\n${validation.errors
        .map((error) => `- ${error}`)
        .join("\n")}`,
    );
  }
  return candidateSourceDigest(inventoryToCanonicalSourceMap(inventory));
}

function baselineDigest(inventory: CanonicalSourceInventory) {
  return candidateSourceDigest(inventoryToCanonicalSourceMap(inventory));
}

async function assertNoOtherUnfinished(repoRoot: string, allowedId?: string) {
  const unfinished = await listUnfinishedKnowledgeTransactionIds({ repoRoot });
  const blocking = unfinished.filter((transactionId) => transactionId !== allowedId);
  if (blocking.length > 0) {
    throw new Error(
      `Another Knowledge record transaction requires recovery: ${blocking.join(", ")}.`,
    );
  }
  return unfinished;
}

async function notifyAfterMutation(
  dependencies: KnowledgeRecordEngineDependencies,
  phase: KnowledgeRecordMutationPhase,
  operationIndex: number,
  mutationCount: number,
) {
  await dependencies.afterCanonicalMutation?.({
    phase,
    operationIndex,
    mutationCount,
  });
}

async function hasDurableCompletedRemoval({
  repoRoot,
  transactionId,
  operationIndex,
}: {
  repoRoot: string;
  transactionId: string;
  operationIndex: number;
}) {
  const journal = await readKnowledgeTransactionJournal({
    repoRoot,
    transactionId,
  });
  if (journal.tornFinalLine) return false;
  let latestApplyStart = -1;
  journal.events.forEach((event, index) => {
    if (event.event === "apply-started") latestApplyStart = index;
  });
  if (latestApplyStart === -1) return false;

  let completedRemoval = false;
  for (const event of journal.events.slice(latestApplyStart + 1)) {
    if (
      event.event === "mutation-completed" &&
      event.operationIndex === operationIndex
    ) {
      completedRemoval = true;
      continue;
    }
    if (
      (event.event === "rollback-completed" &&
        event.operationIndex === operationIndex) ||
      event.event === "recovery-completed"
    ) {
      completedRemoval = false;
    }
  }
  return completedRemoval;
}

function artifactProofKey(proof: CanonicalArtifactOwnershipProof) {
  return `${proof.operationIndex}\0${proof.artifactKind}\0${proof.artifactSourcePath}`;
}

function journalEventToArtifactProof(
  event: Awaited<ReturnType<typeof readKnowledgeTransactionJournal>>["events"][number],
): CanonicalArtifactOwnershipProof {
  if (event.event !== "artifact-ownership-recorded") {
    throw new Error("Journal event is not an artifact ownership proof.");
  }
  return Object.freeze({
    transactionId: event.transactionId,
    operationIndex: event.operationIndex!,
    sourcePath: event.canonicalSourcePath!,
    artifactRole: event.artifactRole!,
    artifactKind: event.artifactKind!,
    artifactSourcePath: event.artifactSourcePath!,
    identityDev: event.identityDev!,
    identityIno: event.identityIno!,
    identityUid: event.identityUid!,
    identityBirthtimeNs: event.identityBirthtimeNs!,
    byteLength: event.byteLength!,
    sha256: event.sha256!,
    mode: event.mode!,
  });
}

function durableArtifactProofMatches(
  durable: CanonicalArtifactOwnershipProof,
  observed: CanonicalArtifactOwnershipProof,
) {
  const identityMatches =
    durable.identityDev === observed.identityDev &&
    durable.identityIno === observed.identityIno &&
    durable.identityUid === observed.identityUid &&
    durable.identityBirthtimeNs === observed.identityBirthtimeNs;
  if (!identityMatches) return false;
  if (
    observed.artifactKind === "after-partial" ||
    observed.artifactKind === "before-partial"
  ) {
    return true;
  }
  return (
    durable.byteLength === observed.byteLength &&
    durable.sha256 === observed.sha256 &&
    durable.mode === observed.mode
  );
}

async function canonicalDependenciesForTransaction(
  repoRoot: string,
  transactionId: string,
  lock: Awaited<ReturnType<typeof acquireKnowledgeTransactionLock>>,
  storeDependencies: TransactionStoreDependencies | undefined,
  injected: CanonicalFileDependencies | undefined,
  operations: readonly CandidateOperation[],
): Promise<CanonicalFileDependencies> {
  const removalByIndex = new Map(
    operations
      .filter((operation) => operation.action === "remove")
      .map((operation) => [operation.index, operation.sourcePath]),
  );
  const operationByIndex = new Map(
    operations.map((operation) => [operation.index, operation]),
  );
  const journal = await readKnowledgeTransactionJournal({ repoRoot, transactionId });
  if (journal.tornFinalLine) {
    throw new Error("Artifact ownership cannot be reconstructed from a torn journal.");
  }
  const durableProofs = new Map<string, CanonicalArtifactOwnershipProof[]>();
  for (const event of journal.events) {
    if (event.event !== "artifact-ownership-recorded") continue;
    const proof = journalEventToArtifactProof(event);
    const operation = operationByIndex.get(proof.operationIndex);
    if (!operation) {
      throw new Error("Artifact ownership proof names an unknown operation.");
    }
    assertCanonicalArtifactOwnershipProof(
      proof,
      transactionId,
      operation as CanonicalMutation,
    );
    const key = artifactProofKey(proof);
    durableProofs.set(key, [...(durableProofs.get(key) ?? []), proof]);
  }
  return Object.freeze({
    ...injected,
    authorizeCompletedRemoval: async (request) => {
      if (
        request.transactionId !== transactionId ||
        removalByIndex.get(request.operationIndex) !== request.sourcePath
      ) {
        return false;
      }
      return hasDurableCompletedRemoval({
        repoRoot,
        transactionId,
        operationIndex: request.operationIndex,
      });
    },
    persistArtifactOwnershipProof: async (proof) => {
      const operation = operationByIndex.get(proof.operationIndex);
      if (!operation) {
        throw new Error("Artifact ownership proof names an unknown operation.");
      }
      assertCanonicalArtifactOwnershipProof(
        proof,
        transactionId,
        operation as CanonicalMutation,
      );
      if (
        (durableProofs.get(artifactProofKey(proof)) ?? []).some((durable) =>
          durableArtifactProofMatches(durable, proof),
        )
      ) {
        return;
      }
      const stored = await appendKnowledgeTransactionJournalEvent({
        lock,
        transactionId,
        event: {
          event: "artifact-ownership-recorded",
          operationIndex: proof.operationIndex,
          canonicalSourcePath: proof.sourcePath,
          artifactRole: proof.artifactRole,
          artifactKind: proof.artifactKind,
          artifactSourcePath: proof.artifactSourcePath,
          identityDev: proof.identityDev,
          identityIno: proof.identityIno,
          identityUid: proof.identityUid,
          identityBirthtimeNs: proof.identityBirthtimeNs,
          byteLength: proof.byteLength,
          sha256: proof.sha256,
          mode: proof.mode,
        },
        dependencies: storeDependencies,
      });
      const durable = journalEventToArtifactProof(stored);
      const key = artifactProofKey(durable);
      durableProofs.set(key, [...(durableProofs.get(key) ?? []), durable]);
    },
    authorizeArtifactCleanup: async (proof) => {
      const operation = operationByIndex.get(proof.operationIndex);
      if (!operation) return false;
      try {
        assertCanonicalArtifactOwnershipProof(
          proof,
          transactionId,
          operation as CanonicalMutation,
        );
      } catch {
        return false;
      }
      return (durableProofs.get(artifactProofKey(proof)) ?? []).some((durable) =>
        durableArtifactProofMatches(durable, proof),
      );
    },
  });
}

async function rollbackAppliedOperations({
  repoRoot,
  transaction,
  operations,
  lock,
  dependencies,
  reasonCode,
}: {
  repoRoot: string;
  transaction: VerifiedKnowledgeTransaction;
  operations: readonly CandidateOperation[];
  lock: Awaited<ReturnType<typeof acquireKnowledgeTransactionLock>>;
  dependencies: KnowledgeRecordEngineDependencies;
  reasonCode: string;
}) {
  const canonicalDependencies = await canonicalDependenciesForTransaction(
    repoRoot,
    transaction.transactionId,
    lock,
    dependencies.store,
    dependencies.canonicalFiles,
    operations,
  );
  await appendKnowledgeTransactionJournalEvent({
    lock,
    transactionId: transaction.transactionId,
    event: { event: "rollback-started", reasonCode },
    dependencies: dependencies.store,
  });
  let mutationCount = 0;
  for (const operation of [...operations].reverse()) {
    await appendKnowledgeTransactionJournalEvent({
      lock,
      transactionId: transaction.transactionId,
      event: { event: "rollback-intent", operationIndex: operation.index },
      dependencies: dependencies.store,
    });
    const result = await restoreCanonicalMutation(
      repoRoot,
      transaction.transactionId,
      operation as CanonicalMutation,
      canonicalDependencies,
    );
    if (result === "restored") {
      mutationCount += 1;
      await notifyAfterMutation(
        dependencies,
        "rollback",
        operation.index,
        mutationCount,
      );
    }
    await appendKnowledgeTransactionJournalEvent({
      lock,
      transactionId: transaction.transactionId,
      event: { event: "rollback-completed", operationIndex: operation.index },
      dependencies: dependencies.store,
    });
  }
  await ensureNoCanonicalTemporaryFiles(
    repoRoot,
    transaction.transactionId,
    operations as readonly CanonicalMutation[],
    canonicalDependencies,
  );
  const restored = await readCanonicalSourceInventory(repoRoot);
  assertInventoryMatchesSnapshot(restored, transaction);
  const validationSha256 = baselineDigest(restored);
  await appendKnowledgeTransactionJournalEvent({
    lock,
    transactionId: transaction.transactionId,
    event: { event: "recovery-completed", reasonCode },
    dependencies: dependencies.store,
  });
  await writeKnowledgeTransactionTerminalReceipt({
    lock,
    transactionId: transaction.transactionId,
    outcome: "recovered",
    validationSha256,
    dependencies: dependencies.store,
  });
  await clearKnowledgeTransactionUnfinished({
    lock,
    transactionId: transaction.transactionId,
    expectedOutcome: "recovered",
  });
  return validationSha256;
}

export async function prepareKnowledgeRecordTransaction({
  repoRoot,
  requestPath,
  expectedKind,
  dependencies = {},
}: {
  repoRoot: string;
  requestPath: string;
  expectedKind: KnowledgeRecordRequestKind;
  dependencies?: KnowledgeRecordEngineDependencies;
}): Promise<PreparedKnowledgeRecordTransaction> {
  const request = await parseKnowledgeRecordRequest(requestPath);
  if (request.kind !== expectedKind) {
    throw new Error(
      `Request kind ${request.kind} does not match prepare command ${expectedKind}.`,
    );
  }
  assertAsOfNotFuture(request.asOf, (dependencies.today ?? defaultToday)());
  const transactionId = generateKnowledgeTransactionId(dependencies.store);
  const lock = await acquireKnowledgeTransactionLock({
    repoRoot,
    command: `prepare ${expectedKind}`,
    transactionId,
    recoveryCapable: true,
    dependencies: dependencies.store,
  });
  try {
    await assertNoOtherUnfinished(repoRoot);
    const baseline = await readCanonicalSourceInventory(repoRoot);
    const candidate = validateKnowledgeRecordCandidate(baseline, request);
    const recaptured = await readCanonicalSourceInventory(repoRoot);
    if (
      baseline.membership.join("\0") !== recaptured.membership.join("\0") ||
      baseline.entries.some((entry, index) => {
        const other = recaptured.entries[index];
        return (
          !other ||
          other.sourcePath !== entry.sourcePath ||
          other.sha256 !== entry.sha256 ||
          other.mode !== entry.mode
        );
      })
    ) {
      throw new Error("Canonical sources changed while the transaction was prepared.");
    }
    const prepared = await createPreparedKnowledgeTransaction({
      lock,
      transactionId,
      kind: request.kind,
      snapshot: buildTransactionSnapshot(baseline, request),
      operations: candidateToStoreOperations(candidate.operations),
      dependencies: dependencies.store,
    });
    const storedOperations = storedTransactionToCandidateOperations(prepared);
    assertChronicleTransactionShape(prepared, storedOperations);
    return Object.freeze({
      transactionId,
      kind: request.kind,
      operationCount: prepared.operationCount,
      candidateSha256: candidate.candidateSha256,
    });
  } finally {
    await releaseKnowledgeTransactionLock(lock);
  }
}

export async function applyKnowledgeRecordTransaction({
  repoRoot,
  transactionId,
  dependencies = {},
}: {
  repoRoot: string;
  transactionId: string;
  dependencies?: KnowledgeRecordEngineDependencies;
}): Promise<AppliedKnowledgeRecordTransaction> {
  const lock = await acquireKnowledgeTransactionLock({
    repoRoot,
    command: "apply transaction",
    transactionId,
    dependencies: dependencies.store,
  });
  try {
    const unfinished = await assertNoOtherUnfinished(repoRoot, transactionId);
    const transaction = await openVerifiedKnowledgeTransaction({ repoRoot, transactionId });
    const operations = storedTransactionToCandidateOperations(transaction);
    assertChronicleTransactionShape(transaction, operations);
    const status = await getKnowledgeTransactionStatus({ repoRoot, transactionId });
    if (status.unfinished || unfinished.includes(transactionId)) {
      throw new Error(`Transaction ${transactionId} is unfinished and must be recovered before apply.`);
    }
    if (status.terminalOutcome === "applied") {
      const current = await readCanonicalSourceInventory(repoRoot);
      assertInventoryMatchesFinalState(current, transaction, operations);
      const validationSha256 = validateFinalInventory(
        current,
        transaction,
        Object.freeze({}),
      );
      return { transactionId, outcome: "already-applied", validationSha256 };
    }

    const baseline = await readCanonicalSourceInventory(repoRoot);
    assertInventoryMatchesSnapshot(baseline, transaction);
    const candidate: ValidatedKnowledgeRecordCandidate =
      validateStoredKnowledgeRecordCandidate(
        baseline,
        transaction.snapshot.validationAsOf,
        operations,
        transaction.kind,
      );
    const canonicalDependencies = await canonicalDependenciesForTransaction(
      repoRoot,
      transactionId,
      lock,
      dependencies.store,
      dependencies.canonicalFiles,
      operations,
    );
    await markKnowledgeTransactionUnfinished({
      lock,
      transactionId,
      phase: "apply",
      dependencies: dependencies.store,
    });
    await appendKnowledgeTransactionJournalEvent({
      lock,
      transactionId,
      event: { event: "apply-started" },
      dependencies: dependencies.store,
    });

    let mutationCount = 0;
    try {
      for (const operation of operations) {
        await appendKnowledgeTransactionJournalEvent({
          lock,
          transactionId,
          event: { event: "mutation-intent", operationIndex: operation.index },
          dependencies: dependencies.store,
        });
        await applyCanonicalMutation(
          repoRoot,
          transactionId,
          operation as CanonicalMutation,
          canonicalDependencies,
        );
        mutationCount += 1;
        await notifyAfterMutation(
          dependencies,
          "apply",
          operation.index,
          mutationCount,
        );
        await appendKnowledgeTransactionJournalEvent({
          lock,
          transactionId,
          event: { event: "mutation-completed", operationIndex: operation.index },
          dependencies: dependencies.store,
        });
      }

      await ensureNoCanonicalTemporaryFiles(
        repoRoot,
        transactionId,
        operations as readonly CanonicalMutation[],
        canonicalDependencies,
      );
      const finalInventory = await readCanonicalSourceInventory(repoRoot);
      assertInventoryMatchesFinalState(finalInventory, transaction, operations);
      const validationSha256 = validateFinalInventory(
        finalInventory,
        transaction,
        candidate.baselineSources,
      );
      if (validationSha256 !== candidate.candidateSha256) {
        throw new Error("Final Knowledge record validation hash does not match the prepared candidate.");
      }
      await appendKnowledgeTransactionJournalEvent({
        lock,
        transactionId,
        event: { event: "apply-completed" },
        dependencies: dependencies.store,
      });
      await writeKnowledgeTransactionTerminalReceipt({
        lock,
        transactionId,
        outcome: "applied",
        validationSha256,
        dependencies: dependencies.store,
      });
      await clearKnowledgeTransactionUnfinished({
        lock,
        transactionId,
        expectedOutcome: "applied",
      });
      return { transactionId, outcome: "applied", validationSha256 };
    } catch (applyError) {
      try {
        await rollbackAppliedOperations({
          repoRoot,
          transaction,
          operations,
          lock,
          dependencies,
          reasonCode: "apply-error",
        });
      } catch (rollbackError) {
        throw new KnowledgeRecordAutomaticRecoveryError(
          transactionId,
          applyError,
          rollbackError,
        );
      }
      throw applyError;
    }
  } finally {
    await releaseKnowledgeTransactionLock(lock);
  }
}

export async function recoverKnowledgeRecordTransaction({
  repoRoot,
  transactionId,
  dependencies = {},
}: {
  repoRoot: string;
  transactionId: string;
  dependencies?: KnowledgeRecordEngineDependencies;
}): Promise<RecoveredKnowledgeRecordTransaction> {
  const lock = await acquireKnowledgeTransactionLock({
    repoRoot,
    command: "recover transaction",
    transactionId,
    recoveryCapable: true,
    dependencies: dependencies.store,
  });
  try {
    await assertNoOtherUnfinished(repoRoot, transactionId);
    await truncateTornKnowledgeTransactionJournal({ lock, transactionId });
    const transaction = await openVerifiedKnowledgeTransaction({ repoRoot, transactionId });
    const operations = storedTransactionToCandidateOperations(transaction);
    assertChronicleTransactionShape(transaction, operations);
    const status = await getKnowledgeTransactionStatus({ repoRoot, transactionId });
    const canonicalDependencies = await canonicalDependenciesForTransaction(
      repoRoot,
      transactionId,
      lock,
      dependencies.store,
      dependencies.canonicalFiles,
      operations,
    );

    if (!status.unfinished) {
      if (status.terminalOutcome === "applied") {
        const current = await readCanonicalSourceInventory(repoRoot);
        assertInventoryMatchesFinalState(current, transaction, operations);
        return {
          transactionId,
          outcome: "already-applied",
          validationSha256: validateFinalInventory(current, transaction, Object.freeze({})),
        };
      }
      const current = await readCanonicalSourceInventory(repoRoot);
      assertInventoryMatchesSnapshot(current, transaction);
      return {
        transactionId,
        outcome: status.terminalOutcome === "recovered" ? "already-recovered" : "prepared",
        validationSha256:
          status.terminalOutcome === "recovered" ? baselineDigest(current) : null,
      };
    }

    if (status.terminalOutcome === "applied") {
      const current = await readCanonicalSourceInventory(repoRoot);
      assertInventoryMatchesFinalState(current, transaction, operations);
      const validationSha256 = validateFinalInventory(current, transaction, Object.freeze({}));
      await clearKnowledgeTransactionUnfinished({
        lock,
        transactionId,
        expectedOutcome: "applied",
      });
      return { transactionId, outcome: "already-applied", validationSha256 };
    }
    if (status.terminalOutcome === "recovered") {
      const current = await readCanonicalSourceInventory(repoRoot);
      assertInventoryMatchesSnapshot(current, transaction);
      const validationSha256 = baselineDigest(current);
      await clearKnowledgeTransactionUnfinished({
        lock,
        transactionId,
        expectedOutcome: "recovered",
      });
      return { transactionId, outcome: "already-recovered", validationSha256 };
    }

    const journal = await readKnowledgeTransactionJournal({ repoRoot, transactionId });
    if (journal.tornFinalLine) {
      throw new Error(`Transaction ${transactionId} journal remains torn after repair.`);
    }
    await appendKnowledgeTransactionJournalEvent({
      lock,
      transactionId,
      event: { event: "recovery-started", reasonCode: "explicit-recovery" },
      dependencies: dependencies.store,
    });
    let mutationCount = 0;
    for (const operation of [...operations].reverse()) {
      await appendKnowledgeTransactionJournalEvent({
        lock,
        transactionId,
        event: { event: "rollback-intent", operationIndex: operation.index },
        dependencies: dependencies.store,
      });
      const result = await restoreCanonicalMutation(
        repoRoot,
        transactionId,
        operation as CanonicalMutation,
        canonicalDependencies,
      );
      if (result === "restored") {
        mutationCount += 1;
        await notifyAfterMutation(
          dependencies,
          "recover",
          operation.index,
          mutationCount,
        );
      }
      await appendKnowledgeTransactionJournalEvent({
        lock,
        transactionId,
        event: { event: "rollback-completed", operationIndex: operation.index },
        dependencies: dependencies.store,
      });
    }
    await ensureNoCanonicalTemporaryFiles(
      repoRoot,
      transactionId,
      operations as readonly CanonicalMutation[],
      canonicalDependencies,
    );
    const restored = await readCanonicalSourceInventory(repoRoot);
    assertInventoryMatchesSnapshot(restored, transaction);
    const validationSha256 = baselineDigest(restored);
    await appendKnowledgeTransactionJournalEvent({
      lock,
      transactionId,
      event: { event: "recovery-completed", reasonCode: "explicit-recovery" },
      dependencies: dependencies.store,
    });
    await writeKnowledgeTransactionTerminalReceipt({
      lock,
      transactionId,
      outcome: "recovered",
      validationSha256,
      dependencies: dependencies.store,
    });
    await clearKnowledgeTransactionUnfinished({
      lock,
      transactionId,
      expectedOutcome: "recovered",
    });
    return { transactionId, outcome: "recovered", validationSha256 };
  } finally {
    await releaseKnowledgeTransactionLock(lock);
  }
}

export async function getKnowledgeRecordEngineStatus({
  repoRoot,
}: {
  repoRoot: string;
}): Promise<KnowledgeRecordEngineStatus> {
  const unsafeStatus = (
    blocker: string,
    control: Partial<KnowledgeRecordEngineStatus["control"]> = {},
    unfinishedTransactionIds: readonly string[] = [],
  ): KnowledgeRecordEngineStatus => Object.freeze({
    transactions: Object.freeze([]),
    unfinishedTransactionIds: Object.freeze([...unfinishedTransactionIds]),
    transactionInventoryReadable: false,
    control: Object.freeze({
      writerLockPresent: control.writerLockPresent ?? false,
      activeCertificationLeaseCount:
        control.activeCertificationLeaseCount ?? 0,
      recoveryArtifactsPresent: control.recoveryArtifactsPresent ?? true,
      blocker,
    }),
  });

  let guardStatus: ReturnType<typeof inspectKnowledgeTransactionGuard>;
  try {
    guardStatus = inspectKnowledgeTransactionGuard({ repoRoot });
  } catch {
    return unsafeStatus(
      "Transaction control contains an unsafe or unrecognized artifact.",
    );
  }

  const inventoryReadable =
    !guardStatus.writerLockPresent && !guardStatus.recoveryArtifactsPresent;
  if (!inventoryReadable) {
    return unsafeStatus(
      guardStatus.writerLockPresent
        ? "A Knowledge record writer is active or requires recovery."
        : "Transaction control recovery must finish before records can be inspected.",
      {
        writerLockPresent: guardStatus.writerLockPresent,
        activeCertificationLeaseCount:
          guardStatus.activeCertificationLeaseCount,
        recoveryArtifactsPresent: guardStatus.recoveryArtifactsPresent,
      },
      guardStatus.unfinishedTransactionIds,
    );
  }

  let lease: Awaited<ReturnType<typeof acquireKnowledgeCertificationLease>>;
  try {
    lease = await acquireKnowledgeCertificationLease({
      repoRoot,
      command: "knowledge records status",
      recoveryCapable: false,
    });
  } catch {
    try {
      const racedStatus = inspectKnowledgeTransactionGuard({ repoRoot });
      return unsafeStatus(
        racedStatus.writerLockPresent
          ? "A Knowledge record writer is active or requires recovery."
          : "Transaction control changed before records could be inspected.",
        {
          writerLockPresent: racedStatus.writerLockPresent,
          activeCertificationLeaseCount:
            racedStatus.activeCertificationLeaseCount,
          recoveryArtifactsPresent:
            racedStatus.recoveryArtifactsPresent ||
            !racedStatus.writerLockPresent,
        },
        racedStatus.unfinishedTransactionIds,
      );
    } catch {
      return unsafeStatus(
        "Transaction control contains an unsafe or unrecognized artifact.",
      );
    }
  }

  let result: KnowledgeRecordEngineStatus;
  try {
    const leasedGuardStatus = inspectKnowledgeTransactionGuard({ repoRoot });
    if (
      leasedGuardStatus.writerLockPresent ||
      leasedGuardStatus.recoveryArtifactsPresent
    ) {
      result = unsafeStatus(
        "Transaction control changed before records could be inspected.",
        {
          writerLockPresent: leasedGuardStatus.writerLockPresent,
          activeCertificationLeaseCount: Math.max(
            0,
            leasedGuardStatus.activeCertificationLeaseCount - 1,
          ),
          recoveryArtifactsPresent: true,
        },
        leasedGuardStatus.unfinishedTransactionIds,
      );
    } else {
      const [transactions, unfinishedTransactionIds] = await Promise.all([
        listKnowledgeTransactionStatuses({ repoRoot }),
        listUnfinishedKnowledgeTransactionIds({ repoRoot }),
      ]);
      result = Object.freeze({
        transactions: Object.freeze(transactions),
        unfinishedTransactionIds: Object.freeze(unfinishedTransactionIds),
        transactionInventoryReadable: true,
        control: Object.freeze({
          writerLockPresent: false,
          activeCertificationLeaseCount: Math.max(
            0,
            leasedGuardStatus.activeCertificationLeaseCount - 1,
          ),
          recoveryArtifactsPresent: false,
          blocker: null,
        }),
      });
    }
  } catch {
    result = unsafeStatus(
      "Transaction control contains an unsafe or unrecognized artifact.",
    );
  }

  try {
    await releaseKnowledgeCertificationLease(lease, {
      recoveryCapable: true,
    });
  } catch {
    return unsafeStatus(
      "Transaction control recovery must finish before records can be inspected.",
    );
  }
  return result;
}
