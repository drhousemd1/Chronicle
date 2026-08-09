import { createHash } from "node:crypto";

import { validateOperationalRecordSources } from "../../src/data/chronicle-knowledge-base/operational-record-contract";

import {
  CHANGELOG_MIGRATION_RECEIPT_LOCATION,
  CHANGELOG_MIGRATION_RECEIPT_SOURCE_PATH,
  isLegacyChangeId,
  parseCanonicalRecordSourcePath,
} from "./path-safety";
import {
  validateLegacyImportReceiptBundle,
} from "./request-contract";
import {
  inventoryToCanonicalSourceMap,
  inventoryToOperationalSourceMap,
  type CanonicalSourceEntry,
  type CanonicalSourceInventory,
} from "./source-set";
import type {
  KnowledgeRecordRequestKind,
  NormalizedKnowledgeRecordRequest,
  NormalizedRecordOperation,
} from "./request-contract";

export type CandidateOperation = Readonly<{
  index: number;
  action: "create" | "update" | "remove";
  sourcePath: string;
  beforeBytes: Buffer | null;
  beforeMode: number | null;
  afterBytes: Buffer | null;
  afterMode: number | null;
}>;

export type ValidatedKnowledgeRecordCandidate = Readonly<{
  baselineSources: Readonly<Record<string, string>>;
  candidateSources: Readonly<Record<string, string>>;
  operations: readonly CandidateOperation[];
  candidateSha256: string;
}>;

function decodeMarkdown(bytes: Buffer, sourcePath: string) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error(`Knowledge record is not valid UTF-8: ${sourcePath}.`);
  }
}

export function candidateSourceDigest(sources: Readonly<Record<string, string>>) {
  const hash = createHash("sha256");
  for (const [sourcePath, source] of Object.entries(sources).sort(([left], [right]) =>
    left.localeCompare(right),
  )) {
    hash.update(sourcePath);
    hash.update("\0");
    hash.update(source, "utf8");
    hash.update("\0");
  }
  return hash.digest("hex");
}

function entryBySourcePath(inventory: CanonicalSourceInventory) {
  return new Map<string, CanonicalSourceEntry>(
    inventory.entries.map((entry) => [entry.sourcePath, entry]),
  );
}

function operationalSources(
  canonicalSources: Readonly<Record<string, string>>,
) {
  return Object.freeze(
    Object.fromEntries(
      Object.entries(canonicalSources).filter(
        ([sourcePath]) => sourcePath !== CHANGELOG_MIGRATION_RECEIPT_SOURCE_PATH,
      ),
    ),
  );
}

function validateCloseoutOperationScope(
  baselineSources: Readonly<Record<string, string>>,
  asOf: string,
  operations: readonly CandidateOperation[],
) {
  const baselineValidation = validateOperationalRecordSources(
    operationalSources(baselineSources),
    { asOf },
  );
  if (!baselineValidation.ok) {
    throw new Error(
      `Canonical Knowledge records were invalid before closeout validation:\n${baselineValidation.errors
        .map((error) => `- ${error}`)
        .join("\n")}`,
    );
  }
  const activeRemoval = operations.find(
    (operation) =>
      operation.action === "remove" &&
      parseCanonicalRecordSourcePath(operation.sourcePath).location ===
        "active-current-work",
  );
  const activeRemovalIdentity = activeRemoval
    ? parseCanonicalRecordSourcePath(activeRemoval.sourcePath)
    : undefined;
  const activeProject = baselineValidation.registry.activeProjects.find(
    (project) => project.id === activeRemovalIdentity?.recordId,
  );
  if (!activeProject) {
    throw new Error("Closeout source project is not an active Current Work record.");
  }
  const linkedIssueIds = new Set(activeProject.linkedIssueIds);
  const unlinkedIssueIds = operations
    .filter(
      (operation) =>
        operation.action === "update" &&
        parseCanonicalRecordSourcePath(operation.sourcePath).location === "issue",
    )
    .map(
      (operation) => parseCanonicalRecordSourcePath(operation.sourcePath).recordId,
    )
    .filter((issueId) => !linkedIssueIds.has(issueId));
  if (unlinkedIssueIds.length > 0) {
    throw new Error(
      `Closeout may update only Issues linked by the active project: ${unlinkedIssueIds.join(", ")}.`,
    );
  }
}

function validateReceiptBundleInCandidate(
  operations: readonly CandidateOperation[],
  asOf: string,
) {
  const receiptOperations = operations.filter((operation) => {
    const identity = parseCanonicalRecordSourcePath(operation.sourcePath);
    return identity.location === CHANGELOG_MIGRATION_RECEIPT_LOCATION;
  });
  if (receiptOperations.length === 0) return;
  if (
    receiptOperations.length !== 1 ||
    operations.at(-1) !== receiptOperations[0] ||
    receiptOperations[0].action !== "create" ||
    !receiptOperations[0].afterBytes
  ) {
    throw new Error(
      "A legacy migration receipt must be the final and only receipt create operation.",
    );
  }
  const legacyRecords = operations.slice(0, -1).map((operation) => {
    const identity = parseCanonicalRecordSourcePath(operation.sourcePath);
    if (
      operation.action !== "create" ||
      identity.location !== "changelog" ||
      !isLegacyChangeId(identity.recordId) ||
      !operation.afterBytes
    ) {
      throw new Error(
        "A migration-receipt candidate may contain only legacy Changelog creates before the receipt.",
      );
    }
    return {
      changeId: identity.recordId,
      bytes: operation.afterBytes,
      relativePath: operation.sourcePath,
    };
  });
  if (legacyRecords.length === 0) {
    throw new Error("A migration receipt must account for at least one legacy record.");
  }
  validateLegacyImportReceiptBundle(
    receiptOperations[0].afterBytes,
    receiptOperations[0].sourcePath,
    legacyRecords,
    asOf,
  );
}

function assertNoCaseInsensitiveCollision(
  inventory: CanonicalSourceInventory,
  operations: readonly NormalizedRecordOperation[],
) {
  const seen = new Map<string, string>();
  for (const sourcePath of inventory.membership) {
    const key = sourcePath.toLocaleLowerCase("en-US");
    const previous = seen.get(key);
    if (previous && previous !== sourcePath) {
      throw new Error(
        `Canonical source inventory contains a case-insensitive collision: ${previous} and ${sourcePath}.`,
      );
    }
    seen.set(key, sourcePath);
  }
  for (const operation of operations) {
    const key = operation.targetSourcePath.toLocaleLowerCase("en-US");
    const previous = seen.get(key);
    if (
      operation.action === "create" &&
      previous &&
      previous !== operation.targetSourcePath
    ) {
      throw new Error(
        `Canonical target collides by case with an existing source: ${operation.targetSourcePath}.`,
      );
    }
    seen.set(key, operation.targetSourcePath);
  }
}

function normalizeCandidateOperation(
  operation: NormalizedRecordOperation,
  existingEntry: CanonicalSourceEntry | undefined,
): CandidateOperation {
  if (operation.action === "create") {
    if (existingEntry) {
      throw new Error(`Create target already exists: ${operation.targetSourcePath}.`);
    }
    return Object.freeze({
      index: operation.order,
      action: "create" as const,
      sourcePath: operation.targetSourcePath,
      beforeBytes: null,
      beforeMode: null,
      afterBytes: operation.content.bytes,
      afterMode: 0o644,
    });
  }
  if (!existingEntry) {
    throw new Error(`${operation.action} target does not exist: ${operation.targetSourcePath}.`);
  }
  if (existingEntry.sha256 !== operation.expectedSourceSha256) {
    throw new Error(
      `Canonical source was already stale when this request was prepared: ${operation.targetSourcePath}.`,
    );
  }
  if (operation.action === "update") {
    if (existingEntry.bytes.equals(operation.content.bytes)) {
      throw new Error(`Update does not change canonical bytes: ${operation.targetSourcePath}.`);
    }
    return Object.freeze({
      index: operation.order,
      action: "update" as const,
      sourcePath: operation.targetSourcePath,
      beforeBytes: existingEntry.bytes,
      beforeMode: existingEntry.mode,
      afterBytes: operation.content.bytes,
      afterMode: existingEntry.mode,
    });
  }
  return Object.freeze({
    index: operation.order,
    action: "remove" as const,
    sourcePath: operation.targetSourcePath,
    beforeBytes: existingEntry.bytes,
    beforeMode: existingEntry.mode,
    afterBytes: null,
    afterMode: null,
  });
}

export function validateKnowledgeRecordCandidate(
  inventory: CanonicalSourceInventory,
  request: NormalizedKnowledgeRecordRequest,
): ValidatedKnowledgeRecordCandidate {
  assertNoCaseInsensitiveCollision(inventory, request.operations);
  const baselineSources = inventoryToOperationalSourceMap(inventory);
  const candidateSources: Record<string, string> = {
    ...inventoryToCanonicalSourceMap(inventory),
  };
  const existingByPath = entryBySourcePath(inventory);
  const operations = request.operations.map((operation) => {
    const normalized = normalizeCandidateOperation(
      operation,
      existingByPath.get(operation.targetSourcePath),
    );
    if (operation.action === "remove") {
      delete candidateSources[operation.targetSourcePath];
    } else {
      candidateSources[operation.targetSourcePath] = decodeMarkdown(
        operation.content.bytes,
        operation.targetSourcePath,
      );
    }
    return normalized;
  });

  if (request.kind === "closeout") {
    validateCloseoutOperationScope(baselineSources, request.asOf, operations);
  }

  validateReceiptBundleInCandidate(operations, request.asOf);

  const validation = validateOperationalRecordSources(
    operationalSources(candidateSources),
    {
      asOf: request.asOf,
      baselineSources,
    },
  );
  if (!validation.ok) {
    throw new Error(
      `Prepared Knowledge record candidate is invalid:\n${validation.errors
        .map((error) => `- ${error}`)
        .join("\n")}`,
    );
  }

  return Object.freeze({
    baselineSources,
    candidateSources: Object.freeze(candidateSources),
    operations: Object.freeze(operations),
    candidateSha256: candidateSourceDigest(candidateSources),
  });
}

export function validateStoredKnowledgeRecordCandidate(
  inventory: CanonicalSourceInventory,
  asOf: string,
  operations: readonly CandidateOperation[],
  kind?: KnowledgeRecordRequestKind,
): ValidatedKnowledgeRecordCandidate {
  const baselineSources = inventoryToOperationalSourceMap(inventory);
  const candidateSources: Record<string, string> = {
    ...inventoryToCanonicalSourceMap(inventory),
  };
  const existingByPath = entryBySourcePath(inventory);
  const seenTargets = new Set<string>();

  for (const [position, operation] of operations.entries()) {
    if (operation.index !== position) {
      throw new Error("Stored Knowledge record operations are not in canonical order.");
    }
    if (seenTargets.has(operation.sourcePath)) {
      throw new Error(`Stored transaction repeats target ${operation.sourcePath}.`);
    }
    seenTargets.add(operation.sourcePath);
    const existing = existingByPath.get(operation.sourcePath);
    if (operation.action === "create") {
      if (
        existing ||
        !operation.afterBytes ||
        operation.beforeBytes !== null ||
        operation.beforeMode !== null ||
        operation.afterMode !== 0o644
      ) {
        throw new Error(`Stored create operation has an invalid source state: ${operation.sourcePath}.`);
      }
      candidateSources[operation.sourcePath] = decodeMarkdown(
        operation.afterBytes,
        operation.sourcePath,
      );
      continue;
    }
    if (
      !existing ||
      !operation.beforeBytes ||
      operation.beforeMode === null ||
      operation.beforeMode !== existing.mode
    ) {
      throw new Error(`Stored ${operation.action} target is missing: ${operation.sourcePath}.`);
    }
    if (!existing.bytes.equals(operation.beforeBytes)) {
      throw new Error(`Stored before bytes do not match ${operation.sourcePath}.`);
    }
    if (operation.action === "update") {
      if (
        !operation.afterBytes ||
        operation.afterBytes.equals(operation.beforeBytes) ||
        operation.afterMode === null ||
        operation.afterMode !== operation.beforeMode
      ) {
        throw new Error(`Stored update operation has no staged result: ${operation.sourcePath}.`);
      }
      candidateSources[operation.sourcePath] = decodeMarkdown(
        operation.afterBytes,
        operation.sourcePath,
      );
    } else if (operation.action === "remove") {
      if (operation.afterBytes !== null || operation.afterMode !== null) {
        throw new Error(`Stored remove operation contains unexpected after bytes: ${operation.sourcePath}.`);
      }
      delete candidateSources[operation.sourcePath];
    } else {
      throw new Error(`Stored transaction has an unsupported action at ${operation.sourcePath}.`);
    }
  }

  if (kind === "closeout") {
    validateCloseoutOperationScope(baselineSources, asOf, operations);
  }

  validateReceiptBundleInCandidate(operations, asOf);

  const validation = validateOperationalRecordSources(
    operationalSources(candidateSources),
    {
      asOf,
      baselineSources,
    },
  );
  if (!validation.ok) {
    throw new Error(
      `Stored Knowledge record candidate is invalid:\n${validation.errors
        .map((error) => `- ${error}`)
        .join("\n")}`,
    );
  }
  return Object.freeze({
    baselineSources,
    candidateSources: Object.freeze(candidateSources),
    operations,
    candidateSha256: candidateSourceDigest(candidateSources),
  });
}
