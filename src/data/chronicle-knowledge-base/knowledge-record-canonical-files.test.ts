import {
  chmod,
  link,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  symlink,
  truncate,
  unlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  applyCanonicalMutation as applyCanonicalMutationSource,
  CANONICAL_DIRECTORY_SWAP_LIMIT,
  CANONICAL_LEAF_ENTRY_RACE_LIMIT,
  canonicalBackupSourcePath,
  canonicalTemporarySourcePath,
  ensureNoCanonicalTemporaryFiles as ensureNoCanonicalTemporaryFilesSource,
  readCanonicalFileState,
  restoreCanonicalMutation as restoreCanonicalMutationSource,
  type CanonicalArtifactOwnershipProof,
  type CanonicalFileDependencies,
  type CanonicalFilesystemMutationEvent,
  type CanonicalFilesystemPrimitiveEvent,
  type CanonicalMutation,
} from "../../../scripts/knowledge-records/canonical-files";
import {
  APPROVED_RECORD_DIRECTORIES,
  canonicalRecordSourcePath,
} from "../../../scripts/knowledge-records/path-safety";

const TRANSACTION_ID = "kr-20260801T120000000Z-0011223344556677";
const temporaryRoots: string[] = [];
const durableProofsByRepository = new Map<
  string,
  CanonicalArtifactOwnershipProof[]
>();

function ownershipProofDependencies(
  repoRoot: string,
): Pick<
  CanonicalFileDependencies,
  "persistArtifactOwnershipProof" | "authorizeArtifactCleanup"
> {
  const proofs = durableProofsByRepository.get(repoRoot) ?? [];
  durableProofsByRepository.set(repoRoot, proofs);
  return {
    persistArtifactOwnershipProof(proof) {
      const exists = proofs.some(
        (candidate) => JSON.stringify(candidate) === JSON.stringify(proof),
      );
      if (!exists) proofs.push(proof);
    },
    authorizeArtifactCleanup(observed) {
      return proofs.some((durable) => {
        if (
          durable.operationIndex !== observed.operationIndex ||
          durable.artifactKind !== observed.artifactKind ||
          durable.artifactSourcePath !== observed.artifactSourcePath ||
          durable.identityDev !== observed.identityDev ||
          durable.identityIno !== observed.identityIno ||
          durable.identityUid !== observed.identityUid ||
          durable.identityBirthtimeNs !== observed.identityBirthtimeNs
        ) {
          return false;
        }
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
      });
    },
  };
}

function canonicalDependencies(
  repoRoot: string,
  dependencies: CanonicalFileDependencies = {},
): CanonicalFileDependencies {
  return {
    ...dependencies,
    ...ownershipProofDependencies(repoRoot),
  };
}

async function applyCanonicalMutation(
  repoRoot: string,
  transactionId: string,
  operation: CanonicalMutation,
  dependencies: CanonicalFileDependencies = {},
) {
  return applyCanonicalMutationSource(
    repoRoot,
    transactionId,
    operation,
    canonicalDependencies(repoRoot, dependencies),
  );
}

async function restoreCanonicalMutation(
  repoRoot: string,
  transactionId: string,
  operation: CanonicalMutation,
  dependencies: CanonicalFileDependencies = {},
) {
  return restoreCanonicalMutationSource(
    repoRoot,
    transactionId,
    operation,
    canonicalDependencies(repoRoot, dependencies),
  );
}

async function ensureNoCanonicalTemporaryFiles(
  repoRoot: string,
  transactionId: string,
  operations: readonly CanonicalMutation[],
  dependencies: CanonicalFileDependencies = {},
) {
  return ensureNoCanonicalTemporaryFilesSource(
    repoRoot,
    transactionId,
    operations,
    canonicalDependencies(repoRoot, dependencies),
  );
}

async function makeRepositoryFixture() {
  const created = await mkdtemp(path.join(tmpdir(), "chronicle-canonical-mutation-"));
  const repoRoot = await realpath(created);
  temporaryRoots.push(repoRoot);
  for (const directory of Object.values(APPROVED_RECORD_DIRECTORIES)) {
    await mkdir(path.join(repoRoot, ...directory.split("/")), { recursive: true });
  }
  return repoRoot;
}

function updateFixtureOperation() {
  const sourcePath = canonicalRecordSourcePath(
    "active-current-work",
    "CG-WORK-001",
  );
  return {
    sourcePath,
    beforeBytes: Buffer.from("before\r\nCafé\r\n", "utf8"),
    afterBytes: Buffer.from("after\nCafé without final newline", "utf8"),
    operation: {
      index: 0,
      action: "update" as const,
      sourcePath,
      beforeBytes: Buffer.from("before\r\nCafé\r\n", "utf8"),
      beforeMode: 0o640,
      afterBytes: Buffer.from("after\nCafé without final newline", "utf8"),
      afterMode: 0o640,
    } satisfies CanonicalMutation,
  };
}

function fixtureOperation(action: CanonicalMutation["action"]): CanonicalMutation {
  if (action === "create") {
    return {
      index: 0,
      action,
      sourcePath: canonicalRecordSourcePath("changelog", "LEGACY-QH-primitive"),
      beforeBytes: null,
      beforeMode: null,
      afterBytes: Buffer.from("created\r\nCafé without final newline", "utf8"),
      afterMode: 0o644,
    };
  }
  if (action === "remove") {
    return {
      index: 0,
      action,
      sourcePath: canonicalRecordSourcePath("issue", "CG-ISSUE-001"),
      beforeBytes: Buffer.from("removed\r\nCafé without final newline", "utf8"),
      beforeMode: 0o640,
      afterBytes: null,
      afterMode: null,
    };
  }
  return updateFixtureOperation().operation;
}

function artifactSourcePaths(operation: CanonicalMutation) {
  const afterStage = canonicalTemporarySourcePath(
    operation.sourcePath,
    TRANSACTION_ID,
    operation.index,
  );
  const stem = afterStage.slice(0, -4);
  return {
    afterStage,
    afterPartial: `${afterStage}.partial`,
    beforeStage: `${stem}.restore`,
    beforePartial: `${stem}.restore.partial`,
    beforeAnchor: `${stem}.before`,
    afterAnchor: `${stem}.after`,
    capture: `${stem}.capture`,
  };
}

function absoluteSourcePath(repoRoot: string, sourcePath: string) {
  return path.join(repoRoot, ...sourcePath.split("/"));
}

async function setupOperationFixture(
  action: CanonicalMutation["action"],
) {
  const repoRoot = await makeRepositoryFixture();
  const operation = fixtureOperation(action);
  if (operation.beforeBytes !== null) {
    await installBeforeState(repoRoot, operation);
  }
  return { repoRoot, operation };
}

async function prepareArtifactsForStandaloneCleanup(
  repoRoot: string,
  operation: CanonicalMutation,
) {
  if (operation.action === "remove") {
    await applyCanonicalMutation(repoRoot, TRANSACTION_ID, operation);
    return;
  }
  let interrupted = false;
  await expect(
    applyCanonicalMutation(repoRoot, TRANSACTION_ID, operation, {
      afterFilesystemMutation(event) {
        if (!interrupted && event.stage === "canonical-published") {
          interrupted = true;
          throw new Error("stop before automatic cleanup");
        }
      },
    }),
  ).rejects.toThrow(/stop before automatic cleanup/);
  expect(interrupted).toBe(true);
}

async function installBeforeState(
  repoRoot: string,
  operation: CanonicalMutation,
) {
  if (operation.beforeBytes === null || operation.beforeMode === null) {
    throw new Error("fixture requires a present before state");
  }
  const absolutePath = path.join(repoRoot, ...operation.sourcePath.split("/"));
  await writeFile(absolutePath, operation.beforeBytes);
  await chmod(absolutePath, operation.beforeMode);
}

async function expectExactState(
  repoRoot: string,
  operation: CanonicalMutation,
  expected: "before" | "after",
) {
  const state = await readCanonicalFileState(repoRoot, operation.sourcePath);
  const bytes = expected === "before" ? operation.beforeBytes : operation.afterBytes;
  const mode = expected === "before" ? operation.beforeMode : operation.afterMode;
  if (bytes === null) {
    expect(state.state).toBe("absent");
    return;
  }
  expect(state.state).toBe("present");
  if (state.state !== "present") throw new Error("expected canonical file");
  expect(state.bytes.equals(bytes)).toBe(true);
  expect(state.mode).toBe(mode);
}

async function expectNoOwnedArtifacts(
  repoRoot: string,
  operation: CanonicalMutation,
) {
  const directory = path.join(
    repoRoot,
    ...path.posix.dirname(operation.sourcePath).split("/"),
  );
  const prefix = `.chronicle-knowledge-${TRANSACTION_ID}-${String(operation.index).padStart(4, "0")}`;
  expect((await readdir(directory)).filter((name) => name.startsWith(prefix))).toEqual([]);
}

function eventKey(event: CanonicalFilesystemMutationEvent) {
  return `${event.phase}:${event.stage}:${event.artifactRole}:${path.posix.basename(event.artifactSourcePath)}`;
}

type FilesystemBoundary =
  | Readonly<{
      kind: "primitive";
      event: CanonicalFilesystemPrimitiveEvent;
    }>
  | Readonly<{
      kind: "durable";
      event: CanonicalFilesystemMutationEvent;
    }>;

function boundaryDependencies(
  trace: FilesystemBoundary[],
  stopAt: number | null = null,
  authorizeRemoval = false,
): CanonicalFileDependencies {
  let boundaryIndex = 0;
  const visit = (
    boundary: FilesystemBoundary,
  ) => {
    trace.push(boundary);
    if (stopAt === boundaryIndex) {
      throw new Error(`simulated boundary interruption ${boundaryIndex}`);
    }
    boundaryIndex += 1;
  };
  return {
    // One-byte requests make every successful write length deterministic. A
    // legitimate short write cannot be smaller than one byte, while a zero-byte
    // write remains the production error path.
    writeChunkBytes: 1,
    afterFilesystemPrimitive(event) {
      visit({ kind: "primitive", event });
    },
    afterFilesystemMutation(event) {
      visit({ kind: "durable", event });
    },
    authorizeCompletedRemoval() {
      return authorizeRemoval;
    },
  };
}

function durableBoundary(
  operation: CanonicalMutation,
  phase: CanonicalFilesystemMutationEvent["phase"],
  stage: CanonicalFilesystemMutationEvent["stage"],
  artifactRole: CanonicalFilesystemMutationEvent["artifactRole"],
  artifactSourcePath: string,
): FilesystemBoundary {
  return {
    kind: "durable",
    event: {
      phase,
      stage,
      artifactRole,
      sourcePath: operation.sourcePath,
      artifactSourcePath,
    },
  };
}

function primitiveBoundary(
  operation: CanonicalMutation,
  phase: CanonicalFilesystemMutationEvent["phase"],
  stage: CanonicalFilesystemMutationEvent["stage"],
  artifactRole: CanonicalFilesystemMutationEvent["artifactRole"],
  artifactSourcePath: string,
  primitive: CanonicalFilesystemPrimitiveEvent["primitive"],
  primitiveSourcePath: string,
  primitiveDestinationPath?: string,
  write?: Readonly<{
    offset: number;
    length: number;
    total: number;
    ordinal: number;
  }>,
): FilesystemBoundary {
  return {
    kind: "primitive",
    event: {
      phase,
      stage,
      artifactRole,
      sourcePath: operation.sourcePath,
      artifactSourcePath,
      primitive,
      primitiveSourcePath,
      ...(primitiveDestinationPath === undefined
        ? {}
        : { primitiveDestinationPath }),
      ...(write === undefined
        ? {}
        : {
            writeOffset: write.offset,
            writeLength: write.length,
            writeTotalBytes: write.total,
            writeOrdinal: write.ordinal,
          }),
    },
  };
}

function stageBoundaries(
  operation: CanonicalMutation,
  phase: "apply" | "restore",
  side: "after" | "before",
): FilesystemBoundary[] {
  const artifacts = artifactSourcePaths(operation);
  const ready = side === "after" ? artifacts.afterStage : artifacts.beforeStage;
  const partial = side === "after" ? artifacts.afterPartial : artifacts.beforePartial;
  const role = side === "after" ? "after-stage" : "before-stage";
  const bytes = side === "after" ? operation.afterBytes : operation.beforeBytes;
  if (!bytes) throw new Error(`Fixture ${side} bytes are absent.`);
  const expected: FilesystemBoundary[] = [
    primitiveBoundary(
      operation,
      phase,
      "partial-created",
      role,
      partial,
      "create",
      partial,
    ),
    durableBoundary(operation, phase, "partial-created", role, partial),
    primitiveBoundary(
      operation,
      phase,
      "partial-created",
      role,
      partial,
      "chmod",
      partial,
    ),
  ];
  let offset = 0;
  let ordinal = 0;
  while (offset < bytes.byteLength) {
    const length = 1;
    expected.push(
      primitiveBoundary(
        operation,
        phase,
        "payload-written",
        role,
        partial,
        "write",
        partial,
        undefined,
        { offset, length, total: bytes.byteLength, ordinal },
      ),
    );
    offset += length;
    ordinal += 1;
  }
  expected.push(
    durableBoundary(operation, phase, "payload-written", role, partial),
    primitiveBoundary(
      operation,
      phase,
      "mode-set",
      role,
      partial,
      "chmod",
      partial,
    ),
    durableBoundary(operation, phase, "mode-set", role, partial),
    primitiveBoundary(
      operation,
      phase,
      "artifact-ready",
      role,
      ready,
      "link",
      partial,
      ready,
    ),
    durableBoundary(operation, phase, "artifact-ready", role, ready),
    ...artifactRemovalBoundaries(operation, phase, role, partial),
  );
  return expected;
}

function captureBoundaries(
  operation: CanonicalMutation,
  phase: "apply" | "restore",
  anchorRole: "before-anchor" | "after-anchor",
): FilesystemBoundary[] {
  const artifacts = artifactSourcePaths(operation);
  const anchor =
    anchorRole === "before-anchor" ? artifacts.beforeAnchor : artifacts.afterAnchor;
  return [
    primitiveBoundary(
      operation,
      phase,
      "anchor-created",
      anchorRole,
      anchor,
      "link",
      operation.sourcePath,
      anchor,
    ),
    durableBoundary(operation, phase, "anchor-created", anchorRole, anchor),
    primitiveBoundary(
      operation,
      phase,
      "canonical-captured",
      "capture",
      artifacts.capture,
      "rename",
      operation.sourcePath,
      artifacts.capture,
    ),
    durableBoundary(
      operation,
      phase,
      "canonical-captured",
      "capture",
      artifacts.capture,
    ),
  ];
}

function publishBoundaries(
  operation: CanonicalMutation,
  phase: "apply" | "restore",
  role: "after-stage" | "before-stage" | "before-anchor",
  artifactSourcePath: string,
): FilesystemBoundary[] {
  return [
    primitiveBoundary(
      operation,
      phase,
      "canonical-published",
      role,
      artifactSourcePath,
      "link",
      artifactSourcePath,
      operation.sourcePath,
    ),
    durableBoundary(
      operation,
      phase,
      "canonical-published",
      role,
      artifactSourcePath,
    ),
  ];
}

function artifactRemovalBoundaries(
  operation: CanonicalMutation,
  phase: CanonicalFilesystemMutationEvent["phase"],
  role: CanonicalFilesystemMutationEvent["artifactRole"],
  artifactSourcePath: string,
): FilesystemBoundary[] {
  return [
    primitiveBoundary(
      operation,
      phase,
      "artifact-removed",
      role,
      artifactSourcePath,
      "unlink",
      artifactSourcePath,
    ),
    durableBoundary(
      operation,
      phase,
      "artifact-removed",
      role,
      artifactSourcePath,
    ),
  ];
}

function captureCleanupBoundaries(
  operation: CanonicalMutation,
  phase: CanonicalFilesystemMutationEvent["phase"],
): FilesystemBoundary[] {
  const capture = artifactSourcePaths(operation).capture;
  return [
    primitiveBoundary(
      operation,
      phase,
      "capture-cleaned",
      "capture",
      capture,
      "unlink",
      capture,
    ),
    durableBoundary(
      operation,
      phase,
      "capture-cleaned",
      "capture",
      capture,
    ),
  ];
}

function expectedBoundaryMatrix(operation: CanonicalMutation) {
  const artifacts = artifactSourcePaths(operation);
  if (operation.action === "create") {
    return {
      apply: [
        ...stageBoundaries(operation, "apply", "after"),
        ...publishBoundaries(operation, "apply", "after-stage", artifacts.afterStage),
        ...artifactRemovalBoundaries(
          operation,
          "apply",
          "after-stage",
          artifacts.afterStage,
        ),
      ],
      restore: [
        ...captureBoundaries(operation, "restore", "after-anchor"),
        ...captureCleanupBoundaries(operation, "restore"),
        ...artifactRemovalBoundaries(
          operation,
          "restore",
          "after-anchor",
          artifacts.afterAnchor,
        ),
      ],
      cleanup: artifactRemovalBoundaries(
        operation,
        "cleanup",
        "after-stage",
        artifacts.afterStage,
      ),
    } as const;
  }
  if (operation.action === "remove") {
    return {
      apply: captureBoundaries(operation, "apply", "before-anchor"),
      restore: [
        ...publishBoundaries(
          operation,
          "restore",
          "before-anchor",
          artifacts.beforeAnchor,
        ),
        ...captureCleanupBoundaries(operation, "restore"),
        ...artifactRemovalBoundaries(
          operation,
          "restore",
          "before-anchor",
          artifacts.beforeAnchor,
        ),
      ],
      cleanup: [
        ...captureCleanupBoundaries(operation, "cleanup"),
        ...artifactRemovalBoundaries(
          operation,
          "cleanup",
          "before-anchor",
          artifacts.beforeAnchor,
        ),
      ],
    } as const;
  }
  return {
    apply: [
      ...stageBoundaries(operation, "apply", "after"),
      ...captureBoundaries(operation, "apply", "before-anchor"),
      ...publishBoundaries(operation, "apply", "after-stage", artifacts.afterStage),
      ...captureCleanupBoundaries(operation, "apply"),
      ...artifactRemovalBoundaries(
        operation,
        "apply",
        "after-stage",
        artifacts.afterStage,
      ),
      ...artifactRemovalBoundaries(
        operation,
        "apply",
        "before-anchor",
        artifacts.beforeAnchor,
      ),
    ],
    restore: [
      ...captureBoundaries(operation, "restore", "after-anchor"),
      ...stageBoundaries(operation, "restore", "before"),
      ...publishBoundaries(
        operation,
        "restore",
        "before-stage",
        artifacts.beforeStage,
      ),
      ...captureCleanupBoundaries(operation, "restore"),
      ...artifactRemovalBoundaries(
        operation,
        "restore",
        "after-anchor",
        artifacts.afterAnchor,
      ),
      ...artifactRemovalBoundaries(
        operation,
        "restore",
        "before-stage",
        artifacts.beforeStage,
      ),
    ],
    cleanup: [
      ...captureCleanupBoundaries(operation, "cleanup"),
      ...artifactRemovalBoundaries(
        operation,
        "cleanup",
        "after-stage",
        artifacts.afterStage,
      ),
      ...artifactRemovalBoundaries(
        operation,
        "cleanup",
        "before-anchor",
        artifacts.beforeAnchor,
      ),
    ],
  } as const;
}

afterEach(async () => {
  durableProofsByRepository.clear();
  await Promise.all(
    temporaryRoots.splice(0).map((temporaryRoot) =>
      rm(temporaryRoot, { recursive: true, force: true }),
    ),
  );
});

describe("canonical Knowledge record mutations", () => {
  it("applies and exactly restores create, update, and remove operations", async () => {
    const repoRoot = await makeRepositoryFixture();
    const createPath = canonicalRecordSourcePath(
      "changelog",
      "LEGACY-QH-created",
    );
    const updatePath = canonicalRecordSourcePath(
      "active-current-work",
      "CG-WORK-001",
    );
    const removePath = canonicalRecordSourcePath("issue", "CG-ISSUE-001");
    const beforeUpdate = Buffer.from("before\r\nCafé\r\n", "utf8");
    const afterUpdate = Buffer.from("after\nCafé", "utf8");
    const beforeRemove = Buffer.from("remove me without a final newline", "utf8");
    const afterCreate = Buffer.from("new record\r\n", "utf8");
    await writeFile(path.join(repoRoot, ...updatePath.split("/")), beforeUpdate);
    await chmod(path.join(repoRoot, ...updatePath.split("/")), 0o640);
    await writeFile(path.join(repoRoot, ...removePath.split("/")), beforeRemove);

    const operations: CanonicalMutation[] = [
      {
        index: 0,
        action: "create",
        sourcePath: createPath,
        beforeBytes: null,
        beforeMode: null,
        afterBytes: afterCreate,
        afterMode: 0o644,
      },
      {
        index: 1,
        action: "update",
        sourcePath: updatePath,
        beforeBytes: beforeUpdate,
        beforeMode: 0o640,
        afterBytes: afterUpdate,
        afterMode: 0o640,
      },
      {
        index: 2,
        action: "remove",
        sourcePath: removePath,
        beforeBytes: beforeRemove,
        beforeMode: 0o644,
        afterBytes: null,
        afterMode: null,
      },
    ];

    for (const operation of operations) {
      await applyCanonicalMutation(repoRoot, TRANSACTION_ID, operation);
    }
    expect(
      await readFile(path.join(repoRoot, ...createPath.split("/"))),
    ).toEqual(afterCreate);
    expect(
      await readFile(path.join(repoRoot, ...updatePath.split("/"))),
    ).toEqual(afterUpdate);
    expect((await readCanonicalFileState(repoRoot, removePath)).state).toBe(
      "absent",
    );

    for (const operation of [...operations].reverse()) {
      await restoreCanonicalMutation(repoRoot, TRANSACTION_ID, operation);
    }
    expect((await readCanonicalFileState(repoRoot, createPath)).state).toBe(
      "absent",
    );
    const restoredUpdate = await readCanonicalFileState(repoRoot, updatePath);
    expect(restoredUpdate.state).toBe("present");
    if (restoredUpdate.state !== "present") throw new Error("update missing");
    expect(restoredUpdate.bytes.equals(beforeUpdate)).toBe(true);
    expect(restoredUpdate.mode).toBe(0o640);
    expect(
      await readFile(path.join(repoRoot, ...removePath.split("/"))),
    ).toEqual(beforeRemove);
  });

  it("refuses to overwrite unfamiliar bytes during recovery", async () => {
    const repoRoot = await makeRepositoryFixture();
    const sourcePath = canonicalRecordSourcePath(
      "active-current-work",
      "CG-WORK-001",
    );
    const absolutePath = path.join(repoRoot, ...sourcePath.split("/"));
    const beforeBytes = Buffer.from("before", "utf8");
    const afterBytes = Buffer.from("after", "utf8");
    await writeFile(absolutePath, beforeBytes);
    const operation: CanonicalMutation = {
      index: 0,
      action: "update",
      sourcePath,
      beforeBytes,
      beforeMode: 0o644,
      afterBytes,
      afterMode: 0o644,
    };
    await applyCanonicalMutation(repoRoot, TRANSACTION_ID, operation);
    await writeFile(absolutePath, "outside edit");

    await expect(
      restoreCanonicalMutation(repoRoot, TRANSACTION_ID, operation),
    ).rejects.toThrow(/match neither the recorded before nor after state/);
    expect(await readFile(absolutePath, "utf8")).toBe("outside edit");
  });

  it("treats a mode-only change as a conflict before apply and during recovery", async () => {
    const repoRoot = await makeRepositoryFixture();
    const sourcePath = canonicalRecordSourcePath(
      "active-current-work",
      "CG-WORK-001",
    );
    const absolutePath = path.join(repoRoot, ...sourcePath.split("/"));
    const beforeBytes = Buffer.from("before", "utf8");
    const afterBytes = Buffer.from("after", "utf8");
    const operation: CanonicalMutation = {
      index: 0,
      action: "update",
      sourcePath,
      beforeBytes,
      beforeMode: 0o644,
      afterBytes,
      afterMode: 0o644,
    };
    await writeFile(absolutePath, beforeBytes);
    await chmod(absolutePath, 0o600);

    await expect(
      applyCanonicalMutation(repoRoot, TRANSACTION_ID, operation),
    ).rejects.toThrow(/does not match the transaction's before state/);
    let current = await readCanonicalFileState(repoRoot, sourcePath);
    expect(current.state).toBe("present");
    if (current.state !== "present") throw new Error("update missing");
    expect(current.bytes.equals(beforeBytes)).toBe(true);
    expect(current.mode).toBe(0o600);

    await chmod(absolutePath, 0o644);
    await applyCanonicalMutation(repoRoot, TRANSACTION_ID, operation);
    await chmod(absolutePath, 0o600);

    await expect(
      restoreCanonicalMutation(repoRoot, TRANSACTION_ID, operation),
    ).rejects.toThrow(/match neither the recorded before nor after state/);
    current = await readCanonicalFileState(repoRoot, sourcePath);
    expect(current.state).toBe("present");
    if (current.state !== "present") throw new Error("update missing");
    expect(current.bytes.equals(afterBytes)).toBe(true);
    expect(current.mode).toBe(0o600);
  });

  it("preserves regular files and symlinks introduced at the capture destination", async () => {
    for (const phase of ["apply", "restore"] as const) {
      for (const kind of ["regular", "symlink"] as const) {
        const { repoRoot, operation } = await setupOperationFixture("update");
        if (phase === "restore") {
          await applyCanonicalMutation(repoRoot, TRANSACTION_ID, operation);
        }
        const outsideBytes = Buffer.from(`${phase}-${kind}-capture`, "utf8");
        let inserted = false;

        const run = () =>
          (phase === "apply"
            ? applyCanonicalMutation
            : restoreCanonicalMutation)(repoRoot, TRANSACTION_ID, operation, {
            async beforeFilesystemMutation(event) {
              if (
                !inserted &&
                event.phase === phase &&
                event.stage === "canonical-captured"
              ) {
                inserted = true;
                const capturePath = absoluteSourcePath(
                  repoRoot,
                  event.artifactSourcePath,
                );
                if (kind === "regular") {
                  await writeFile(capturePath, outsideBytes);
                  await chmod(capturePath, 0o600);
                } else {
                  const targetPath = `${capturePath}.outside-target`;
                  await writeFile(targetPath, outsideBytes);
                  await symlink(targetPath, capturePath);
                }
              }
            },
          });

        await expect(run()).rejects.toThrow(
          kind === "regular" ? /capture appeared before/ : /not a regular file/,
        );
        expect(inserted).toBe(true);
        await expectExactState(
          repoRoot,
          operation,
          phase === "apply" ? "before" : "after",
        );
        const capturePath = absoluteSourcePath(
          repoRoot,
          artifactSourcePaths(operation).capture,
        );
        if (kind === "regular") {
          expect(await readFile(capturePath)).toEqual(outsideBytes);
        } else {
          expect((await lstat(capturePath)).isSymbolicLink()).toBe(true);
        }
      }
    }
  });

  it("treats a completed update followed by an outside deletion as a recovery conflict", async () => {
    const { repoRoot, operation } = await setupOperationFixture("update");
    await applyCanonicalMutation(repoRoot, TRANSACTION_ID, operation);
    await unlink(absoluteSourcePath(repoRoot, operation.sourcePath));

    await expect(
      restoreCanonicalMutation(repoRoot, TRANSACTION_ID, operation),
    ).rejects.toThrow(/absence is not owned by this transaction/);
    expect((await readCanonicalFileState(repoRoot, operation.sourcePath)).state).toBe(
      "absent",
    );
  });

  it("does not resurrect bytes deleted in the recovery capture hook", async () => {
    const { repoRoot, operation } = await setupOperationFixture("update");
    await applyCanonicalMutation(repoRoot, TRANSACTION_ID, operation);
    const canonicalPath = absoluteSourcePath(repoRoot, operation.sourcePath);
    let deleted = false;

    await expect(
      restoreCanonicalMutation(repoRoot, TRANSACTION_ID, operation, {
        async beforeFilesystemMutation(event) {
          if (!deleted && event.stage === "canonical-captured") {
            deleted = true;
            await unlink(canonicalPath);
          }
        },
      }),
    ).rejects.toThrow(/no quarantine was performed/);
    expect(deleted).toBe(true);
    await expect(
      restoreCanonicalMutation(repoRoot, TRANSACTION_ID, operation),
    ).rejects.toThrow(/absence is not owned by this transaction/);
    expect((await readCanonicalFileState(repoRoot, operation.sourcePath)).state).toBe(
      "absent",
    );
  });

  it("rechecks the publication artifact after hooks for apply and restore", async () => {
    const tamperKinds = ["truncate", "chmod", "replace", "symlink"] as const;
    for (const phase of ["apply", "restore"] as const) {
      for (const tamperKind of tamperKinds) {
        const { repoRoot, operation } = await setupOperationFixture("update");
        if (phase === "restore") {
          await applyCanonicalMutation(repoRoot, TRANSACTION_ID, operation);
        }
        let tampered = false;

        const run = () =>
          (phase === "apply"
            ? applyCanonicalMutation
            : restoreCanonicalMutation)(repoRoot, TRANSACTION_ID, operation, {
            async beforeFilesystemMutation(event) {
              if (
                tampered ||
                event.phase !== phase ||
                event.stage !== "canonical-published"
              ) {
                return;
              }
              tampered = true;
              const artifactPath = absoluteSourcePath(
                repoRoot,
                event.artifactSourcePath,
              );
              if (tamperKind === "truncate") {
                await truncate(artifactPath, 1);
              } else if (tamperKind === "chmod") {
                await chmod(artifactPath, 0o600);
              } else if (tamperKind === "replace") {
                const replacementPath = `${artifactPath}.outside-replacement`;
                const bytes = await readFile(artifactPath);
                const mode = (await lstat(artifactPath)).mode & 0o7777;
                await writeFile(replacementPath, bytes);
                await chmod(replacementPath, mode);
                await rename(replacementPath, artifactPath);
              } else {
                const targetPath = `${artifactPath}.outside-target`;
                await writeFile(targetPath, "outside symlink target");
                await unlink(artifactPath);
                await symlink(targetPath, artifactPath);
              }
            },
          });

        await expect(run()).rejects.toThrow(
          tamperKind === "symlink"
            ? /not a regular file/
            : /publication artifact changed/,
        );
        expect(tampered).toBe(true);
        expect((await readCanonicalFileState(repoRoot, operation.sourcePath)).state).toBe(
          "absent",
        );
        const artifactPath = absoluteSourcePath(
          repoRoot,
          phase === "apply"
            ? artifactSourcePaths(operation).afterStage
            : artifactSourcePaths(operation).beforeStage,
        );
        if (tamperKind === "symlink") {
          expect((await lstat(artifactPath)).isSymbolicLink()).toBe(true);
        } else {
          expect((await lstat(artifactPath)).isFile()).toBe(true);
        }
      }
    }
  });

  it("cleans a known create temp after a durable link and rejects an unfamiliar temp", async () => {
    const repoRoot = await makeRepositoryFixture();
    const sourcePath = canonicalRecordSourcePath(
      "changelog",
      "LEGACY-QH-interrupted-create",
    );
    const absolutePath = path.join(repoRoot, ...sourcePath.split("/"));
    const afterBytes = Buffer.from("created bytes", "utf8");
    const operation: CanonicalMutation = {
      index: 0,
      action: "create",
      sourcePath,
      beforeBytes: null,
      beforeMode: null,
      afterBytes,
      afterMode: 0o644,
    };
    const temporarySourcePath = canonicalTemporarySourcePath(
      sourcePath,
      TRANSACTION_ID,
      operation.index,
    );
    const temporaryPath = path.join(
      repoRoot,
      ...temporarySourcePath.split("/"),
    );

    await writeFile(temporaryPath, afterBytes);
    await chmod(temporaryPath, 0o644);
    await link(temporaryPath, absolutePath);

    await expect(
      restoreCanonicalMutation(repoRoot, TRANSACTION_ID, operation),
    ).resolves.toBe("restored");
    await expect(readFile(temporaryPath)).rejects.toMatchObject({ code: "ENOENT" });
    await expect(readFile(absolutePath)).rejects.toMatchObject({ code: "ENOENT" });

    await writeFile(temporaryPath, "unfamiliar bytes");
    await expect(
      restoreCanonicalMutation(repoRoot, TRANSACTION_ID, operation),
    ).rejects.toThrow(/has unfamiliar bytes or mode/);
    expect(await readFile(temporaryPath, "utf8")).toBe("unfamiliar bytes");
    await expect(readFile(absolutePath)).rejects.toMatchObject({ code: "ENOENT" });
  });

  it(
    "recovers after interruption at every apply staging, capture, publication, and cleanup mutation",
    async () => {
      const { operation } = updateFixtureOperation();
      const temporaryName = path.posix.basename(
        canonicalTemporarySourcePath(
          operation.sourcePath,
          TRANSACTION_ID,
          operation.index,
        ),
      );
      const stem = temporaryName.slice(0, -4);
      const interruptionPoints = [
        `apply:partial-created:after-stage:${temporaryName}.partial`,
        `apply:payload-written:after-stage:${temporaryName}.partial`,
        `apply:mode-set:after-stage:${temporaryName}.partial`,
        `apply:artifact-ready:after-stage:${temporaryName}`,
        `apply:artifact-removed:after-stage:${temporaryName}.partial`,
        `apply:anchor-created:before-anchor:${stem}.before`,
        `apply:canonical-captured:capture:${stem}.capture`,
        `apply:capture-cleaned:capture:${stem}.capture`,
        `apply:canonical-published:after-stage:${temporaryName}`,
        `apply:artifact-removed:after-stage:${temporaryName}`,
        `apply:artifact-removed:before-anchor:${stem}.before`,
      ];

      for (const interruptionPoint of interruptionPoints) {
        const repoRoot = await makeRepositoryFixture();
        await installBeforeState(repoRoot, operation);
        let interrupted = false;
        const dependencies: CanonicalFileDependencies = {
          afterFilesystemMutation(event) {
            if (!interrupted && eventKey(event) === interruptionPoint) {
              interrupted = true;
              throw new Error(`simulated interruption at ${interruptionPoint}`);
            }
          },
        };

        await expect(
          applyCanonicalMutation(
            repoRoot,
            TRANSACTION_ID,
            operation,
            dependencies,
          ),
        ).rejects.toThrow(/simulated interruption/);
        expect(interrupted, `missing hook ${interruptionPoint}`).toBe(true);

        await restoreCanonicalMutation(repoRoot, TRANSACTION_ID, operation);
        await expectExactState(repoRoot, operation, "before");
        await ensureNoCanonicalTemporaryFiles(repoRoot, TRANSACTION_ID, [operation]);
        await expectNoOwnedArtifacts(repoRoot, operation);
      }
    },
    30_000,
  );

  it(
    "finishes recovery after interruption at every restoration mutation",
    async () => {
      const { operation } = updateFixtureOperation();
      const temporaryName = path.posix.basename(
        canonicalTemporarySourcePath(
          operation.sourcePath,
          TRANSACTION_ID,
          operation.index,
        ),
      );
      const stem = temporaryName.slice(0, -4);
      const interruptionPoints = [
        `restore:anchor-created:after-anchor:${stem}.after`,
        `restore:canonical-captured:capture:${stem}.capture`,
        `restore:capture-cleaned:capture:${stem}.capture`,
        `restore:partial-created:before-stage:${stem}.restore.partial`,
        `restore:payload-written:before-stage:${stem}.restore.partial`,
        `restore:mode-set:before-stage:${stem}.restore.partial`,
        `restore:artifact-ready:before-stage:${stem}.restore`,
        `restore:artifact-removed:before-stage:${stem}.restore.partial`,
        `restore:canonical-published:before-stage:${stem}.restore`,
        `restore:artifact-removed:after-anchor:${stem}.after`,
        `restore:artifact-removed:before-stage:${stem}.restore`,
      ];

      for (const interruptionPoint of interruptionPoints) {
        const repoRoot = await makeRepositoryFixture();
        await installBeforeState(repoRoot, operation);
        await applyCanonicalMutation(repoRoot, TRANSACTION_ID, operation);
        let interrupted = false;
        const dependencies: CanonicalFileDependencies = {
          afterFilesystemMutation(event) {
            if (!interrupted && eventKey(event) === interruptionPoint) {
              interrupted = true;
              throw new Error(`simulated interruption at ${interruptionPoint}`);
            }
          },
        };

        await expect(
          restoreCanonicalMutation(
            repoRoot,
            TRANSACTION_ID,
            operation,
            dependencies,
          ),
        ).rejects.toThrow(/simulated interruption/);
        expect(interrupted, `missing hook ${interruptionPoint}`).toBe(true);

        await restoreCanonicalMutation(repoRoot, TRANSACTION_ID, operation);
        await expectExactState(repoRoot, operation, "before");
        await ensureNoCanonicalTemporaryFiles(repoRoot, TRANSACTION_ID, [operation]);
        await expectNoOwnedArtifacts(repoRoot, operation);
      }
    },
    30_000,
  );

  it(
    "recovers at every primitive-before-fsync and durable boundary for create, update, and remove",
    async () => {
      const observedPrimitives = new Set<CanonicalFilesystemPrimitiveEvent["primitive"]>();
      for (const action of ["create", "update", "remove"] as const) {
        for (const phase of ["apply", "restore", "cleanup"] as const) {
          const collected: FilesystemBoundary[] = [];
          const collectedFixture = await setupOperationFixture(action);
          const expected = expectedBoundaryMatrix(collectedFixture.operation)[phase];
          if (phase === "restore") {
            await applyCanonicalMutation(
              collectedFixture.repoRoot,
              TRANSACTION_ID,
              collectedFixture.operation,
            );
            await restoreCanonicalMutation(
              collectedFixture.repoRoot,
              TRANSACTION_ID,
              collectedFixture.operation,
              boundaryDependencies(collected),
            );
          } else if (phase === "cleanup") {
            await prepareArtifactsForStandaloneCleanup(
              collectedFixture.repoRoot,
              collectedFixture.operation,
            );
            await ensureNoCanonicalTemporaryFiles(
              collectedFixture.repoRoot,
              TRANSACTION_ID,
              [collectedFixture.operation],
              boundaryDependencies(collected, null, action === "remove"),
            );
          } else {
            await applyCanonicalMutation(
              collectedFixture.repoRoot,
              TRANSACTION_ID,
              collectedFixture.operation,
              boundaryDependencies(collected),
            );
          }

          expect(collected, `${action} ${phase} clean trace`).toEqual(expected);
          expect(
            collected.some((boundary) => boundary.kind === "primitive"),
          ).toBe(true);
          expect(
            collected.some((boundary) => boundary.kind === "durable"),
          ).toBe(true);
          for (const boundary of collected) {
            if (boundary.kind === "primitive") {
              observedPrimitives.add(boundary.event.primitive);
            }
          }

          for (let boundaryIndex = 0; boundaryIndex < expected.length; boundaryIndex += 1) {
            const replay = await setupOperationFixture(action);
            const replayTrace: FilesystemBoundary[] = [];
            if (phase === "restore") {
              await applyCanonicalMutation(
                replay.repoRoot,
                TRANSACTION_ID,
                replay.operation,
              );
              await expect(
                restoreCanonicalMutation(
                  replay.repoRoot,
                  TRANSACTION_ID,
                  replay.operation,
                  boundaryDependencies(replayTrace, boundaryIndex),
                ),
              ).rejects.toThrow(/simulated boundary interruption/);
              await restoreCanonicalMutation(
                replay.repoRoot,
                TRANSACTION_ID,
                replay.operation,
              );
              await expectExactState(replay.repoRoot, replay.operation, "before");
            } else if (phase === "cleanup") {
              await prepareArtifactsForStandaloneCleanup(
                replay.repoRoot,
                replay.operation,
              );
              await expect(
                ensureNoCanonicalTemporaryFiles(
                  replay.repoRoot,
                  TRANSACTION_ID,
                  [replay.operation],
                  boundaryDependencies(
                    replayTrace,
                    boundaryIndex,
                    action === "remove",
                  ),
                ),
              ).rejects.toThrow(/simulated boundary interruption/);
              await ensureNoCanonicalTemporaryFiles(
                replay.repoRoot,
                TRANSACTION_ID,
                [replay.operation],
                action === "remove"
                  ? { authorizeCompletedRemoval: () => true }
                  : {},
              );
              await expectExactState(replay.repoRoot, replay.operation, "after");
            } else {
              await expect(
                applyCanonicalMutation(
                  replay.repoRoot,
                  TRANSACTION_ID,
                  replay.operation,
                  boundaryDependencies(replayTrace, boundaryIndex),
                ),
              ).rejects.toThrow(/simulated boundary interruption/);
              await restoreCanonicalMutation(
                replay.repoRoot,
                TRANSACTION_ID,
                replay.operation,
              );
              await expectExactState(replay.repoRoot, replay.operation, "before");
            }
            expect(replayTrace, `${action} ${phase} interrupted prefix`).toEqual(
              expected.slice(0, boundaryIndex + 1),
            );
            await ensureNoCanonicalTemporaryFiles(
              replay.repoRoot,
              TRANSACTION_ID,
              [replay.operation],
              phase === "cleanup" && action === "remove"
                ? { authorizeCompletedRemoval: () => true }
                : {},
            );
            await expectNoOwnedArtifacts(replay.repoRoot, replay.operation);
          }
        }
      }

      expect([...observedPrimitives].sort()).toEqual([
        "chmod",
        "create",
        "link",
        "rename",
        "unlink",
        "write",
      ]);
    },
    120_000,
  );

  it("preserves an outside editor save introduced immediately before capture", async () => {
    const repoRoot = await makeRepositoryFixture();
    const { operation } = updateFixtureOperation();
    await installBeforeState(repoRoot, operation);
    const absolutePath = path.join(repoRoot, ...operation.sourcePath.split("/"));
    const editorPath = `${absolutePath}.editor-save`;
    const outsideBytes = Buffer.from("outside editor replacement", "utf8");
    let replaced = false;

    await expect(
      applyCanonicalMutation(repoRoot, TRANSACTION_ID, operation, {
        async beforeFilesystemMutation(event) {
          if (!replaced && event.stage === "canonical-captured") {
            replaced = true;
            await writeFile(editorPath, outsideBytes);
            await chmod(editorPath, 0o600);
            await rename(editorPath, absolutePath);
          }
        },
      }),
    ).rejects.toThrow(/changed after the capture hook/);

    const current = await readCanonicalFileState(repoRoot, operation.sourcePath);
    expect(current.state).toBe("present");
    if (current.state !== "present") throw new Error("outside edit missing");
    expect(current.bytes.equals(outsideBytes)).toBe(true);
    expect(current.mode).toBe(0o600);
    const capturePath = path.join(
      repoRoot,
      ...canonicalTemporarySourcePath(
        operation.sourcePath,
        TRANSACTION_ID,
        operation.index,
      )
        .replace(/\.tmp$/, ".capture")
        .split("/"),
    );
    await expect(readFile(capturePath)).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("does not resurrect old bytes when the canonical file is deleted in the capture hook", async () => {
    const repoRoot = await makeRepositoryFixture();
    const { operation } = updateFixtureOperation();
    await installBeforeState(repoRoot, operation);
    const absolutePath = path.join(repoRoot, ...operation.sourcePath.split("/"));
    let deleted = false;

    await expect(
      applyCanonicalMutation(repoRoot, TRANSACTION_ID, operation, {
        async beforeFilesystemMutation(event) {
          if (!deleted && event.stage === "canonical-captured") {
            deleted = true;
            await unlink(absolutePath);
          }
        },
      }),
    ).rejects.toThrow(/no quarantine was performed/);
    expect(deleted).toBe(true);
    expect((await readCanonicalFileState(repoRoot, operation.sourcePath)).state).toBe(
      "absent",
    );

    await expect(
      restoreCanonicalMutation(repoRoot, TRANSACTION_ID, operation),
    ).rejects.toThrow(/absence is not owned by this transaction/);
    expect((await readCanonicalFileState(repoRoot, operation.sourcePath)).state).toBe(
      "absent",
    );
  });

  it("preserves an outside editor save introduced immediately before publication", async () => {
    const repoRoot = await makeRepositoryFixture();
    const { operation } = updateFixtureOperation();
    await installBeforeState(repoRoot, operation);
    const absolutePath = path.join(repoRoot, ...operation.sourcePath.split("/"));
    const outsideBytes = Buffer.from("outside editor publication", "utf8");
    let replaced = false;

    await expect(
      applyCanonicalMutation(repoRoot, TRANSACTION_ID, operation, {
        async beforeFilesystemMutation(event) {
          if (!replaced && event.stage === "canonical-published") {
            replaced = true;
            await writeFile(absolutePath, outsideBytes);
            await chmod(absolutePath, 0o600);
          }
        },
      }),
    ).rejects.toThrow(/created or edited before publication|created or edited during publication/);

    const current = await readCanonicalFileState(repoRoot, operation.sourcePath);
    expect(current.state).toBe("present");
    if (current.state !== "present") throw new Error("outside edit missing");
    expect(current.bytes.equals(outsideBytes)).toBe(true);
    expect(current.mode).toBe(0o600);
  });

  it("preserves an outside editor save introduced immediately before recovery publication", async () => {
    const repoRoot = await makeRepositoryFixture();
    const { operation } = updateFixtureOperation();
    await installBeforeState(repoRoot, operation);
    await applyCanonicalMutation(repoRoot, TRANSACTION_ID, operation);
    const absolutePath = path.join(repoRoot, ...operation.sourcePath.split("/"));
    const outsideBytes = Buffer.from("outside editor during recovery", "utf8");
    let replaced = false;

    await expect(
      restoreCanonicalMutation(repoRoot, TRANSACTION_ID, operation, {
        async beforeFilesystemMutation(event) {
          if (
            !replaced &&
            event.phase === "restore" &&
            event.stage === "canonical-published"
          ) {
            replaced = true;
            await writeFile(absolutePath, outsideBytes);
            await chmod(absolutePath, 0o600);
          }
        },
      }),
    ).rejects.toThrow(/created or edited before publication|created or edited during publication/);
    expect(replaced).toBe(true);

    const current = await readCanonicalFileState(repoRoot, operation.sourcePath);
    expect(current.state).toBe("present");
    if (current.state !== "present") throw new Error("outside edit missing");
    expect(current.bytes.equals(outsideBytes)).toBe(true);
    expect(current.mode).toBe(0o600);
  });

  it("preserves regular files and symlinks that replace an artifact immediately before cleanup", async () => {
    for (const kind of ["regular", "symlink"] as const) {
      const { repoRoot, operation } = await setupOperationFixture("update");
      await prepareArtifactsForStandaloneCleanup(repoRoot, operation);
      const outsideBytes = Buffer.from(`outside-${kind}-before-cleanup`, "utf8");
      let replaced = false;

      await expect(
        ensureNoCanonicalTemporaryFiles(repoRoot, TRANSACTION_ID, [operation], {
          async beforeFilesystemMutation(event) {
            if (!replaced && event.stage === "capture-cleaned") {
              replaced = true;
              const artifactPath = absoluteSourcePath(
                repoRoot,
                event.artifactSourcePath,
              );
              await unlink(artifactPath);
              if (kind === "regular") {
                await writeFile(artifactPath, outsideBytes);
                await chmod(artifactPath, 0o600);
              } else {
                const targetPath = `${artifactPath}.outside-target`;
                await writeFile(targetPath, outsideBytes);
                await symlink(targetPath, artifactPath);
              }
            }
          },
        }),
      ).rejects.toThrow(
        kind === "regular" ? /changed before cleanup/ : /not a regular file/,
      );
      expect(replaced).toBe(true);
      await expectExactState(repoRoot, operation, "after");
      const capturePath = absoluteSourcePath(
        repoRoot,
        artifactSourcePaths(operation).capture,
      );
      if (kind === "regular") {
        expect(await readFile(capturePath)).toEqual(outsideBytes);
      } else {
        expect((await lstat(capturePath)).isSymbolicLink()).toBe(true);
      }
    }
  });

  it("preserves an atomic same-bytes replacement immediately before cleanup", async () => {
    const { repoRoot, operation } = await setupOperationFixture("update");
    await prepareArtifactsForStandaloneCleanup(repoRoot, operation);
    let replaced = false;

    await expect(
      ensureNoCanonicalTemporaryFiles(repoRoot, TRANSACTION_ID, [operation], {
        async beforeFilesystemMutation(event) {
          if (!replaced && event.stage === "capture-cleaned") {
            replaced = true;
            const artifactPath = absoluteSourcePath(
              repoRoot,
              event.artifactSourcePath,
            );
            const replacementPath = `${artifactPath}.same-bytes-replacement`;
            await writeFile(replacementPath, operation.beforeBytes as Buffer);
            await chmod(replacementPath, operation.beforeMode as number);
            await rename(replacementPath, artifactPath);
          }
        },
      }),
    ).rejects.toThrow(/identity changed before cleanup/);
    expect(replaced).toBe(true);
    await expectExactState(repoRoot, operation, "after");
    const capturePath = absoluteSourcePath(
      repoRoot,
      artifactSourcePaths(operation).capture,
    );
    expect(await readFile(capturePath)).toEqual(operation.beforeBytes);
    expect((await lstat(capturePath)).mode & 0o7777).toBe(operation.beforeMode);
  });

  it("preserves a same-bytes after-stage inode replacement made at canonical publication", async () => {
    const { repoRoot, operation } = await setupOperationFixture("update");
    const stageSourcePath = artifactSourcePaths(operation).afterStage;
    const stagePath = absoluteSourcePath(repoRoot, stageSourcePath);
    let replaced = false;
    let originalIno: bigint | null = null;

    await expect(
      applyCanonicalMutation(repoRoot, TRANSACTION_ID, operation, {
        async afterFilesystemMutation(event) {
          if (replaced || event.stage !== "canonical-published") return;
          replaced = true;
          originalIno = (await lstat(stagePath, { bigint: true })).ino;
          const outsidePath = `${stagePath}.outside`;
          await writeFile(outsidePath, operation.afterBytes!, { mode: operation.afterMode! });
          await chmod(outsidePath, operation.afterMode!);
          await rename(outsidePath, stagePath);
        },
      }),
    ).rejects.toThrow(/no prior ownership proof or surviving hard-link witness/);

    expect(replaced).toBe(true);
    const replacement = await lstat(stagePath, { bigint: true });
    expect(replacement.ino).not.toBe(originalIno);
    expect(await readFile(stagePath)).toEqual(operation.afterBytes);
    expect((replacement.mode & 0o7777n)).toBe(BigInt(operation.afterMode!));
    await expectExactState(repoRoot, operation, "after");
  });

  it("preserves regular files and symlinks recreated after a cleanup unlink", async () => {
    for (const kind of ["regular", "symlink"] as const) {
      const { repoRoot, operation } = await setupOperationFixture("update");
      await prepareArtifactsForStandaloneCleanup(repoRoot, operation);
      const outsideBytes = Buffer.from(`outside-${kind}-after-unlink`, "utf8");
      let recreated = false;

      await expect(
        ensureNoCanonicalTemporaryFiles(repoRoot, TRANSACTION_ID, [operation], {
          async afterFilesystemPrimitive(event) {
            if (
              !recreated &&
              event.phase === "cleanup" &&
              event.primitive === "unlink"
            ) {
              recreated = true;
              const artifactPath = absoluteSourcePath(
                repoRoot,
                event.primitiveSourcePath,
              );
              if (kind === "regular") {
                await writeFile(artifactPath, outsideBytes);
                await chmod(artifactPath, 0o600);
              } else {
                const targetPath = `${artifactPath}.outside-target`;
                await writeFile(targetPath, outsideBytes);
                await symlink(targetPath, artifactPath);
              }
            }
          },
        }),
      ).rejects.toThrow(
        kind === "regular" ? /recreated during cleanup/ : /not a regular file/,
      );
      expect(recreated).toBe(true);
      await expectExactState(repoRoot, operation, "after");
      const capturePath = absoluteSourcePath(
        repoRoot,
        artifactSourcePaths(operation).capture,
      );
      if (kind === "regular") {
        expect(await readFile(capturePath)).toEqual(outsideBytes);
      } else {
        expect((await lstat(capturePath)).isSymbolicLink()).toBe(true);
      }
    }
  });

  it("preserves regular files and symlinks that replace a partial immediately before cleanup", async () => {
    for (const kind of ["regular", "symlink"] as const) {
      const { repoRoot, operation } = await setupOperationFixture("update");
      let staged = false;
      await expect(
        applyCanonicalMutation(repoRoot, TRANSACTION_ID, operation, {
          afterFilesystemMutation(event) {
            if (!staged && event.stage === "payload-written") {
              staged = true;
              throw new Error("stop with a complete restrictive partial");
            }
          },
        }),
      ).rejects.toThrow(/complete restrictive partial/);
      expect(staged).toBe(true);
      const partialSourcePath = artifactSourcePaths(operation).afterPartial;
      const partialPath = absoluteSourcePath(repoRoot, partialSourcePath);
      let replaced = false;

      await expect(
        restoreCanonicalMutation(repoRoot, TRANSACTION_ID, operation, {
          async beforeFilesystemMutation(event) {
            if (
              !replaced &&
              event.stage === "artifact-removed" &&
              event.artifactSourcePath === partialSourcePath
            ) {
              replaced = true;
              if (kind === "regular") {
                const replacementPath = `${partialPath}.outside-replacement`;
                await writeFile(replacementPath, operation.afterBytes as Buffer);
                await chmod(replacementPath, 0o600);
                await rename(replacementPath, partialPath);
              } else {
                const targetPath = `${partialPath}.outside-target`;
                await writeFile(targetPath, operation.afterBytes as Buffer);
                await unlink(partialPath);
                await symlink(targetPath, partialPath);
              }
            }
          },
        }),
      ).rejects.toThrow(
        kind === "regular" ? /changed before cleanup/ : /not a regular file/,
      );
      expect(replaced).toBe(true);
      await expectExactState(repoRoot, operation, "before");
      if (kind === "regular") {
        expect(await readFile(partialPath)).toEqual(operation.afterBytes);
      } else {
        expect((await lstat(partialPath)).isSymbolicLink()).toBe(true);
      }
    }
  });

  it("preserves regular files and symlinks recreated after a partial cleanup unlink", async () => {
    for (const kind of ["regular", "symlink"] as const) {
      const { repoRoot, operation } = await setupOperationFixture("update");
      let staged = false;
      await expect(
        applyCanonicalMutation(repoRoot, TRANSACTION_ID, operation, {
          afterFilesystemMutation(event) {
            if (!staged && event.stage === "payload-written") {
              staged = true;
              throw new Error("stop with a complete restrictive partial");
            }
          },
        }),
      ).rejects.toThrow(/complete restrictive partial/);
      expect(staged).toBe(true);
      const partialSourcePath = artifactSourcePaths(operation).afterPartial;
      const partialPath = absoluteSourcePath(repoRoot, partialSourcePath);
      let recreated = false;

      await expect(
        restoreCanonicalMutation(repoRoot, TRANSACTION_ID, operation, {
          async afterFilesystemPrimitive(event) {
            if (
              !recreated &&
              event.primitive === "unlink" &&
              event.primitiveSourcePath === partialSourcePath
            ) {
              recreated = true;
              if (kind === "regular") {
                await writeFile(partialPath, operation.afterBytes as Buffer);
                await chmod(partialPath, 0o600);
              } else {
                const targetPath = `${partialPath}.outside-target`;
                await writeFile(targetPath, operation.afterBytes as Buffer);
                await symlink(targetPath, partialPath);
              }
            }
          },
        }),
      ).rejects.toThrow(
        kind === "regular" ? /recreated during cleanup/ : /not a regular file/,
      );
      expect(recreated).toBe(true);
      await expectExactState(repoRoot, operation, "before");
      if (kind === "regular") {
        expect(await readFile(partialPath)).toEqual(operation.afterBytes);
      } else {
        expect((await lstat(partialPath)).isSymbolicLink()).toBe(true);
      }
    }
  });

  it("preserves an unfamiliar backup mode and an unfamiliar partial payload", async () => {
    const repoRoot = await makeRepositoryFixture();
    const { operation } = updateFixtureOperation();
    await installBeforeState(repoRoot, operation);
    const backupSourcePath = canonicalBackupSourcePath(
      operation.sourcePath,
      TRANSACTION_ID,
      operation.index,
    );
    const backupPath = path.join(repoRoot, ...backupSourcePath.split("/"));
    await writeFile(backupPath, operation.beforeBytes as Buffer);
    await chmod(backupPath, 0o600);

    await expect(
      applyCanonicalMutation(repoRoot, TRANSACTION_ID, operation),
    ).rejects.toThrow(/anchor has unfamiliar bytes or mode/);
    expect(await readFile(backupPath)).toEqual(operation.beforeBytes);
    expect((await readCanonicalFileState(repoRoot, operation.sourcePath)).state).toBe(
      "present",
    );

    await rm(backupPath);
    const partialPath = path.join(
      repoRoot,
      ...`${canonicalTemporarySourcePath(
        operation.sourcePath,
        TRANSACTION_ID,
        operation.index,
      )}.partial`.split("/"),
    );
    await writeFile(partialPath, "not a prefix of the intended payload");
    await chmod(partialPath, 0o600);
    await expect(
      restoreCanonicalMutation(repoRoot, TRANSACTION_ID, operation),
    ).rejects.toThrow(/partial artifact has unfamiliar bytes or mode/);
    expect(await readFile(partialPath, "utf8")).toBe(
      "not a prefix of the intended payload",
    );
  });

  it("recovers a restrictive-umask partial and rejects a partial that exposes extra permissions", async () => {
    const { repoRoot, operation } = await setupOperationFixture("update");
    let interrupted = false;
    await expect(
      applyCanonicalMutation(repoRoot, TRANSACTION_ID, operation, {
        async afterFilesystemPrimitive(event) {
          if (!interrupted && event.primitive === "create") {
            interrupted = true;
            await chmod(
              absoluteSourcePath(repoRoot, event.primitiveSourcePath),
              0o000,
            );
            throw new Error("simulated restrictive umask create interruption");
          }
        },
      }),
    ).rejects.toThrow(/restrictive umask create interruption/);
    expect(interrupted).toBe(true);
    const partialPath = absoluteSourcePath(
      repoRoot,
      artifactSourcePaths(operation).afterPartial,
    );
    const restrictivePartial = await lstat(partialPath);
    expect(restrictivePartial.mode & 0o7777).toBe(0o000);
    expect(restrictivePartial.size).toBe(0);

    await restoreCanonicalMutation(repoRoot, TRANSACTION_ID, operation);
    await expectExactState(repoRoot, operation, "before");
    await expectNoOwnedArtifacts(repoRoot, operation);

    await writeFile(partialPath, (operation.afterBytes as Buffer).subarray(0, 5));
    await chmod(partialPath, 0o644);
    await expect(
      restoreCanonicalMutation(repoRoot, TRANSACTION_ID, operation),
    ).rejects.toThrow(/partial artifact has unfamiliar bytes or mode/);
    expect(await readFile(partialPath)).toEqual(
      (operation.afterBytes as Buffer).subarray(0, 5),
    );
    expect((await lstat(partialPath)).mode & 0o7777).toBe(0o644);
  });

  it("requires explicit durable authorization to recover a remove after its proof artifacts are cleaned", async () => {
    const { repoRoot, operation } = await setupOperationFixture("remove");
    await applyCanonicalMutation(repoRoot, TRANSACTION_ID, operation);
    await ensureNoCanonicalTemporaryFiles(repoRoot, TRANSACTION_ID, [operation]);
    await expectNoOwnedArtifacts(repoRoot, operation);

    await expect(
      restoreCanonicalMutation(repoRoot, TRANSACTION_ID, operation),
    ).rejects.toThrow(/absence is not owned by this transaction/);
    const authorizationRequests: string[] = [];
    await expect(
      restoreCanonicalMutation(repoRoot, TRANSACTION_ID, operation, {
        authorizeCompletedRemoval(request) {
          authorizationRequests.push(
            `${request.phase}:${request.transactionId}:${request.operationIndex}:${request.sourcePath}`,
          );
          return true;
        },
      }),
    ).resolves.toBe("restored");
    await expectExactState(repoRoot, operation, "before");
    expect(authorizationRequests).toEqual([
      `restore:${TRANSACTION_ID}:0:${operation.sourcePath}`,
    ]);
  });

  it("preflights every cleanup artifact before removing owned remove evidence", async () => {
    const { repoRoot, operation } = await setupOperationFixture("remove");
    await applyCanonicalMutation(repoRoot, TRANSACTION_ID, operation);
    const artifacts = artifactSourcePaths(operation);
    const capturePath = absoluteSourcePath(repoRoot, artifacts.capture);
    const beforeAnchorPath = absoluteSourcePath(repoRoot, artifacts.beforeAnchor);
    const unexpectedAfterStagePath = absoluteSourcePath(
      repoRoot,
      artifacts.afterStage,
    );
    const captureBefore = await lstat(capturePath);
    const anchorBefore = await lstat(beforeAnchorPath);
    const captureBytes = await readFile(capturePath);
    const anchorBytes = await readFile(beforeAnchorPath);
    const outsideBytes = Buffer.from("outside inapplicable after-stage", "utf8");
    await writeFile(unexpectedAfterStagePath, outsideBytes);
    await chmod(unexpectedAfterStagePath, 0o644);

    await expect(
      ensureNoCanonicalTemporaryFiles(repoRoot, TRANSACTION_ID, [operation]),
    ).rejects.toThrow(/after stage is not applicable and was preserved/);
    expect(await readFile(unexpectedAfterStagePath)).toEqual(outsideBytes);

    const captureAfter = await lstat(capturePath);
    const anchorAfter = await lstat(beforeAnchorPath);
    expect(captureAfter.dev).toBe(captureBefore.dev);
    expect(captureAfter.ino).toBe(captureBefore.ino);
    expect(captureAfter.mode).toBe(captureBefore.mode);
    expect(captureAfter.nlink).toBe(captureBefore.nlink);
    expect(anchorAfter.dev).toBe(anchorBefore.dev);
    expect(anchorAfter.ino).toBe(anchorBefore.ino);
    expect(anchorAfter.mode).toBe(anchorBefore.mode);
    expect(anchorAfter.nlink).toBe(anchorBefore.nlink);
    expect(captureAfter.dev).toBe(anchorAfter.dev);
    expect(captureAfter.ino).toBe(anchorAfter.ino);
    expect(await readFile(capturePath)).toEqual(captureBytes);
    expect(await readFile(beforeAnchorPath)).toEqual(anchorBytes);

    await unlink(unexpectedAfterStagePath);
    await expect(
      restoreCanonicalMutation(repoRoot, TRANSACTION_ID, operation),
    ).resolves.toBe("restored");
    await expectExactState(repoRoot, operation, "before");
    await expectNoOwnedArtifacts(repoRoot, operation);
  });

  it("preserves a same-bytes later artifact replacement made after cleanup preflight", async () => {
    const { repoRoot, operation } = await setupOperationFixture("remove");
    await applyCanonicalMutation(repoRoot, TRANSACTION_ID, operation);
    const artifacts = artifactSourcePaths(operation);
    const beforeAnchorPath = absoluteSourcePath(repoRoot, artifacts.beforeAnchor);
    const replacementPath = `${beforeAnchorPath}.outside-replacement`;
    await writeFile(replacementPath, operation.beforeBytes as Buffer);
    await chmod(replacementPath, operation.beforeMode as number);
    const replacementIdentity = await lstat(replacementPath);
    let replaced = false;

    await expect(
      ensureNoCanonicalTemporaryFiles(repoRoot, TRANSACTION_ID, [operation], {
        async beforeFilesystemMutation(event) {
          if (!replaced && event.stage === "capture-cleaned") {
            replaced = true;
            await rename(replacementPath, beforeAnchorPath);
          }
        },
      }),
    ).rejects.toThrow(/identity changed after cleanup preflight/);
    expect(replaced).toBe(true);
    const preserved = await lstat(beforeAnchorPath);
    expect(preserved.dev).toBe(replacementIdentity.dev);
    expect(preserved.ino).toBe(replacementIdentity.ino);
    expect(await readFile(beforeAnchorPath)).toEqual(operation.beforeBytes);
    expect(preserved.mode & 0o7777).toBe(operation.beforeMode);
    expect((await readCanonicalFileState(repoRoot, operation.sourcePath)).state).toBe(
      "absent",
    );

    await unlink(beforeAnchorPath);
    await expect(
      restoreCanonicalMutation(repoRoot, TRANSACTION_ID, operation, {
        authorizeCompletedRemoval: () => true,
      }),
    ).resolves.toBe("restored");
    await expectExactState(repoRoot, operation, "before");
    await expectNoOwnedArtifacts(repoRoot, operation);
  });

  it("does not treat an outside deletion as a completed remove", async () => {
    const { repoRoot, operation } = await setupOperationFixture("remove");
    await unlink(absoluteSourcePath(repoRoot, operation.sourcePath));

    await expect(
      applyCanonicalMutation(repoRoot, TRANSACTION_ID, operation),
    ).rejects.toThrow(/absent without transaction-owned removal evidence/);
    expect((await readCanonicalFileState(repoRoot, operation.sourcePath)).state).toBe(
      "absent",
    );
  });

  it("documents the irreducible Node and macOS parent-directory swap limit", () => {
    expect(CANONICAL_DIRECTORY_SWAP_LIMIT).toContain("Node on macOS");
    expect(CANONICAL_DIRECTORY_SWAP_LIMIT).toContain("directory-descriptor-relative");
    expect(CANONICAL_DIRECTORY_SWAP_LIMIT).toContain("same-user process");
    expect(CANONICAL_LEAF_ENTRY_RACE_LIMIT).toContain("Node on macOS");
    expect(CANONICAL_LEAF_ENTRY_RACE_LIMIT).toContain("O_NOFOLLOW");
    expect(CANONICAL_LEAF_ENTRY_RACE_LIMIT).toContain("same-user process");
    expect(CANONICAL_LEAF_ENTRY_RACE_LIMIT).toContain("between that final check and the syscall");
  });

  it("rejects a parent-directory replacement that remains in place across a mutation", async () => {
    const repoRoot = await makeRepositoryFixture();
    const { operation } = updateFixtureOperation();
    await installBeforeState(repoRoot, operation);
    const parentPath = path.dirname(
      path.join(repoRoot, ...operation.sourcePath.split("/")),
    );
    const displacedParentPath = `${parentPath}.displaced`;
    let replaced = false;

    await expect(
      applyCanonicalMutation(repoRoot, TRANSACTION_ID, operation, {
        async beforeFilesystemMutation(event) {
          if (!replaced && event.stage === "canonical-published") {
            replaced = true;
            await rename(parentPath, displacedParentPath);
            await mkdir(parentPath);
          }
        },
      }),
    ).rejects.toThrow(/publication artifact changed|parent directory identity changed/);
    expect(replaced).toBe(true);
  });
});
