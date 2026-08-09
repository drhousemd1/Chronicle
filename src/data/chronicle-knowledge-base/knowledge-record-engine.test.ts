import { spawnSync, type SpawnSyncReturns } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  applyKnowledgeRecordTransaction,
  getKnowledgeRecordEngineStatus,
  prepareKnowledgeRecordTransaction,
  recoverKnowledgeRecordTransaction,
  type KnowledgeRecordEngineDependencies,
} from "../../../scripts/knowledge-records/engine";
import {
  validateStoredKnowledgeRecordCandidate,
  type CandidateOperation,
} from "../../../scripts/knowledge-records/candidate";
import {
  canonicalTemporarySourcePath,
  readCanonicalFileState,
} from "../../../scripts/knowledge-records/canonical-files";
import {
  CHANGELOG_MIGRATION_RECEIPT_RECORD_ID,
  CHANGELOG_MIGRATION_RECEIPT_SOURCE_PATH,
  canonicalRecordSourcePath,
} from "../../../scripts/knowledge-records/path-safety";
import {
  readCanonicalSourceInventory,
  type CanonicalSourceInventory,
} from "../../../scripts/knowledge-records/source-set";
import {
  acquireKnowledgeCertificationLease,
  acquireKnowledgeTransactionLock,
  appendKnowledgeTransactionJournalEvent,
  createPreparedKnowledgeTransaction,
  generateKnowledgeTransactionId,
  getKnowledgeTransactionStatus,
  openVerifiedKnowledgeTransaction,
  readKnowledgeTransactionJournal,
  releaseKnowledgeCertificationLease,
  releaseKnowledgeTransactionLock,
  type KnowledgeTransactionOperationInput,
  type KnowledgeTransactionSnapshot,
} from "../../../scripts/knowledge-records/transaction-store";
import {
  KNOWLEDGE_TRANSACTION_FIXTURE_AS_OF,
  KNOWLEDGE_TRANSACTION_FIXTURE_CHANGE_ID,
  KNOWLEDGE_TRANSACTION_FIXTURE_CORRECTION_ID,
  KNOWLEDGE_TRANSACTION_FIXTURE_CREATED_ISSUE_ID,
  KNOWLEDGE_TRANSACTION_FIXTURE_CREATED_PROJECT_ID,
  KNOWLEDGE_TRANSACTION_FIXTURE_ISSUE_ID,
  KNOWLEDGE_TRANSACTION_FIXTURE_LEGACY_ID,
  KNOWLEDGE_TRANSACTION_FIXTURE_PROJECT_ID,
  createCloseoutRequestPackage,
  createCorrectionRequestPackage,
  createIssueCreateRequestPackage,
  createIssueUpdateRequestPackage,
  createKnowledgeRecordTransactionTestRepository,
  createLegacyImportRequestPackage,
  createProjectCreateRequestPackage,
  createProjectUpdateRequestPackage,
  createResolvedIssueCloseoutRequestPackage,
  installCorrectionTarget,
  installProjectCreateBaseline,
  type KnowledgeRecordRequestPackage,
  type KnowledgeRecordTransactionTestRepository,
} from "./knowledge-record-transaction-test-fixtures";

const PROJECT_ROOT = process.cwd();
const ESBUILD = path.join(PROJECT_ROOT, "node_modules/.bin/esbuild");
const KNOWLEDGE_RECORDS_CLI = path.join(
  PROJECT_ROOT,
  "scripts/knowledge-records.ts",
);
const KNOWLEDGE_TRANSACTION_GUARD = path.join(
  PROJECT_ROOT,
  "scripts/assert-no-unfinished-knowledge-transaction.mjs",
);
const ARCHIVED_PROJECT_PATH = canonicalRecordSourcePath(
  "archived-current-work",
  KNOWLEDGE_TRANSACTION_FIXTURE_PROJECT_ID,
);
const ACCEPTED_CHANGE_PATH = canonicalRecordSourcePath(
  "changelog",
  KNOWLEDGE_TRANSACTION_FIXTURE_CHANGE_ID,
);
const LEGACY_CHANGE_PATH = canonicalRecordSourcePath(
  "changelog",
  KNOWLEDGE_TRANSACTION_FIXTURE_LEGACY_ID,
);

type Cleanup = () => Promise<void>;

const cleanups: Cleanup[] = [];

function track<T extends Readonly<{ cleanup: Cleanup }>>(resource: T): T {
  cleanups.push(resource.cleanup);
  return resource;
}

afterEach(async () => {
  for (const cleanup of cleanups.splice(0).reverse()) {
    await cleanup();
  }
});

function engineDependencies(
  overrides: Partial<KnowledgeRecordEngineDependencies> = {},
): KnowledgeRecordEngineDependencies {
  return {
    today: () => KNOWLEDGE_TRANSACTION_FIXTURE_AS_OF,
    ...overrides,
  };
}

function absoluteCanonicalPath(repoRoot: string, sourcePath: string) {
  return path.join(repoRoot, ...sourcePath.split("/"));
}

async function fileMode(absolutePath: string) {
  return (await stat(absolutePath)).mode & 0o777;
}

function expectInventoriesIdentical(
  actual: CanonicalSourceInventory,
  expected: CanonicalSourceInventory,
) {
  expect(actual.membership).toEqual(expected.membership);
  expect(actual.entries).toHaveLength(expected.entries.length);
  for (const [index, expectedEntry] of expected.entries.entries()) {
    const actualEntry = actual.entries[index];
    expect(actualEntry.sourcePath).toBe(expectedEntry.sourcePath);
    expect(actualEntry.mode).toBe(expectedEntry.mode);
    expect(actualEntry.sha256).toBe(expectedEntry.sha256);
    expect(actualEntry.bytes.equals(expectedEntry.bytes)).toBe(true);
  }
}

async function storedCloseoutOperations(
  inventory: CanonicalSourceInventory,
  requestPackage: KnowledgeRecordRequestPackage,
  includeIssueUpdate: boolean,
): Promise<readonly CandidateOperation[]> {
  const byPath = new Map(
    inventory.entries.map((entry) => [entry.sourcePath, entry]),
  );
  const activeEntry = byPath.get(
    canonicalRecordSourcePath(
      "active-current-work",
      KNOWLEDGE_TRANSACTION_FIXTURE_PROJECT_ID,
    ),
  );
  const issueEntry = byPath.get(
    canonicalRecordSourcePath(
      "issue",
      KNOWLEDGE_TRANSACTION_FIXTURE_ISSUE_ID,
    ),
  );
  if (!activeEntry || !issueEntry) {
    throw new Error("Stored-closeout fixture is missing its active source state.");
  }
  const operations: CandidateOperation[] = [];
  if (includeIssueUpdate) {
    operations.push({
      index: operations.length,
      action: "update",
      sourcePath: issueEntry.sourcePath,
      beforeBytes: issueEntry.bytes,
      beforeMode: issueEntry.mode,
      afterBytes: await readFile(
        requestPackage.contentPaths[
          `${KNOWLEDGE_TRANSACTION_FIXTURE_ISSUE_ID}.md`
        ],
      ),
      afterMode: issueEntry.mode,
    });
  }
  operations.push(
    {
      index: operations.length,
      action: "create",
      sourcePath: ARCHIVED_PROJECT_PATH,
      beforeBytes: null,
      beforeMode: null,
      afterBytes: await readFile(
        requestPackage.contentPaths[
          `${KNOWLEDGE_TRANSACTION_FIXTURE_PROJECT_ID}.md`
        ],
      ),
      afterMode: 0o644,
    },
    {
      index: operations.length + 1,
      action: "create",
      sourcePath: ACCEPTED_CHANGE_PATH,
      beforeBytes: null,
      beforeMode: null,
      afterBytes: await readFile(
        requestPackage.contentPaths[
          `${KNOWLEDGE_TRANSACTION_FIXTURE_CHANGE_ID}.md`
        ],
      ),
      afterMode: 0o644,
    },
    {
      index: operations.length + 2,
      action: "remove",
      sourcePath: activeEntry.sourcePath,
      beforeBytes: activeEntry.bytes,
      beforeMode: activeEntry.mode,
      afterBytes: null,
      afterMode: null,
    },
  );
  return operations;
}

function runCli(
  cliPath: string,
  repoRoot: string,
  args: readonly string[],
  extraEnvironment: NodeJS.ProcessEnv = {},
  timeoutMs = 30_000,
): SpawnSyncReturns<string> {
  const environment: NodeJS.ProcessEnv = {
    ...process.env,
    NODE_ENV: "test",
    CHRONICLE_KNOWLEDGE_TEST_MODE: "1",
    CHRONICLE_KNOWLEDGE_TEST_REPO_ROOT: repoRoot,
  };
  delete environment.CHRONICLE_KNOWLEDGE_TEST_CRASH_PHASE;
  delete environment.CHRONICLE_KNOWLEDGE_TEST_CRASH_AFTER_MUTATION;
  delete environment.CHRONICLE_KNOWLEDGE_TEST_CRASH_AFTER_CANONICAL_MUTATION;
  delete environment.CHRONICLE_KNOWLEDGE_TEST_CRASH_AFTER_CANONICAL_PRIMITIVE;
  delete environment.CHRONICLE_KNOWLEDGE_TEST_CRASH_AFTER_STORE_MUTATION;
  Object.assign(environment, extraEnvironment);
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd: PROJECT_ROOT,
    env: environment,
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024,
    timeout: timeoutMs,
  });
}

async function createCliBundle() {
  const physicalTemporaryRoot = await realpath(tmpdir());
  const bundleRoot = await mkdtemp(
    path.join(physicalTemporaryRoot, "chronicle-knowledge-cli-fixture-"),
  );
  const cliPath = path.join(bundleRoot, "knowledge-records-cli.cjs");
  const bundled = spawnSync(ESBUILD, [
    KNOWLEDGE_RECORDS_CLI,
    "--bundle",
    "--platform=node",
    "--target=node24",
    "--format=cjs",
    `--outfile=${cliPath}`,
    "--log-level=silent",
  ], {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
  });
  if (bundled.error || bundled.status !== 0) {
    await rm(bundleRoot, { recursive: true, force: true });
    throw new Error(
      `Could not bundle the Knowledge records CLI fixture: ${bundled.error?.message ?? bundled.stderr}`,
    );
  }
  return Object.freeze({
    cliPath,
    cleanup: () => rm(bundleRoot, { recursive: true, force: true }),
  });
}

function expectCliStarted(result: SpawnSyncReturns<string>) {
  expect(result.error).toBeUndefined();
  expect(result.signal).toBeNull();
}

function runRepositoryGuard(repoRoot: string) {
  return spawnSync(process.execPath, [KNOWLEDGE_TRANSACTION_GUARD, repoRoot], {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
    maxBuffer: 1024 * 1024,
    timeout: 30_000,
  });
}

function expectRepositoryGuardBlocked(repoRoot: string, transactionId: string) {
  const guarded = runRepositoryGuard(repoRoot);
  expectCliStarted(guarded);
  expect(guarded.status).toBe(1);
  expect(guarded.stdout).toBe("");
  expect(guarded.stderr).toContain("Knowledge record checks are blocked");
  expect(guarded.stderr).toContain(`recovery is required for ${transactionId}`);
  expect(guarded.stderr).not.toContain(repoRoot);
}

function expectRepositoryGuardPassed(repoRoot: string) {
  const guarded = runRepositoryGuard(repoRoot);
  expectCliStarted(guarded);
  expect(guarded.status).toBe(0);
  expect(guarded.stderr).toBe("");
}

async function expectTransactionUnfinished(
  repoRoot: string,
  transactionId: string,
) {
  expect(
    (await getKnowledgeRecordEngineStatus({ repoRoot })).unfinishedTransactionIds,
  ).toEqual([transactionId]);
  expect(
    await getKnowledgeTransactionStatus({ repoRoot, transactionId }),
  ).toMatchObject({ unfinished: true, terminalOutcome: null });
}

async function closeoutFileStates(
  repository: KnowledgeRecordTransactionTestRepository,
) {
  return {
    archive: (
      await readCanonicalFileState(
        repository.repoRoot,
        ARCHIVED_PROJECT_PATH,
      )
    ).state,
    changelog: (
      await readCanonicalFileState(
        repository.repoRoot,
        ACCEPTED_CHANGE_PATH,
      )
    ).state,
    active: (
      await readCanonicalFileState(
        repository.repoRoot,
        repository.activeProjectPath,
      )
    ).state,
  };
}

async function createPreparedCloseoutFixture() {
  const repository = track(
    await createKnowledgeRecordTransactionTestRepository(),
  );
  const requestPackage = track(await createCloseoutRequestPackage());
  const activePath = absoluteCanonicalPath(
    repository.repoRoot,
    repository.activeProjectPath,
  );
  await chmod(activePath, 0o640);
  const baseline = await readCanonicalSourceInventory(repository.repoRoot);
  const prepared = await prepareKnowledgeRecordTransaction({
    repoRoot: repository.repoRoot,
    requestPath: requestPackage.requestPath,
    expectedKind: "closeout",
    dependencies: engineDependencies(),
  });
  return { repository, requestPackage, activePath, baseline, prepared };
}

async function createPreparedProjectUpdateFixture() {
  const repository = track(
    await createKnowledgeRecordTransactionTestRepository(),
  );
  const requestPackage = track(await createProjectUpdateRequestPackage());
  const activePath = absoluteCanonicalPath(
    repository.repoRoot,
    repository.activeProjectPath,
  );
  await chmod(activePath, 0o640);
  const baseline = await readCanonicalSourceInventory(repository.repoRoot);
  const prepared = await prepareProjectUpdate(repository, requestPackage);
  return { repository, requestPackage, activePath, baseline, prepared };
}

async function createPreparedProjectCreateFixture() {
  const repository = track(
    await createKnowledgeRecordTransactionTestRepository(),
  );
  await installProjectCreateBaseline(repository.repoRoot);
  const requestPackage = track(await createProjectCreateRequestPackage());
  const projectPath = absoluteCanonicalPath(
    repository.repoRoot,
    canonicalRecordSourcePath(
      "active-current-work",
      KNOWLEDGE_TRANSACTION_FIXTURE_CREATED_PROJECT_ID,
    ),
  );
  const baseline = await readCanonicalSourceInventory(repository.repoRoot);
  const prepared = await prepareKnowledgeRecordTransaction({
    repoRoot: repository.repoRoot,
    requestPath: requestPackage.requestPath,
    expectedKind: "project-create",
    dependencies: engineDependencies(),
  });
  return { repository, requestPackage, projectPath, baseline, prepared };
}

function abruptEnvironment(
  phase: "apply" | "recover",
  mutationCount: number,
): NodeJS.ProcessEnv {
  return {
    CHRONICLE_KNOWLEDGE_TEST_CRASH_PHASE: phase,
    CHRONICLE_KNOWLEDGE_TEST_CRASH_AFTER_MUTATION: String(mutationCount),
  };
}

function abruptCanonicalEnvironment(failpoint: string): NodeJS.ProcessEnv {
  return {
    CHRONICLE_KNOWLEDGE_TEST_CRASH_AFTER_CANONICAL_MUTATION: failpoint,
  };
}

function abruptCanonicalPrimitiveEnvironment(failpoint: string): NodeJS.ProcessEnv {
  return {
    CHRONICLE_KNOWLEDGE_TEST_CRASH_AFTER_CANONICAL_PRIMITIVE: failpoint,
  };
}

function expectAbruptCliExit(result: SpawnSyncReturns<string>) {
  expect(result.error).toBeUndefined();
  expect(result.status, result.stderr).toBe(86);
  expect(result.signal).toBeNull();
  expect(result.stdout).toBe("");
  expect(result.stderr).toBe("");
}

const APPLY_CANONICAL_CRASH_POINTS = [
  "apply:partial-created:after-stage:1",
  "apply:payload-written:after-stage:1",
  "apply:mode-set:after-stage:1",
  "apply:artifact-ready:after-stage:1",
  "apply:artifact-removed:after-stage:1",
  "apply:canonical-published:after-stage:1",
  "apply:artifact-removed:after-stage:2",
  "apply:anchor-created:before-anchor:1",
  "apply:canonical-captured:capture:1",
  "cleanup:capture-cleaned:capture:1",
  "cleanup:artifact-removed:before-anchor:1",
] as const;

const RESTORE_CANONICAL_CRASH_POINTS = [
  "restore:canonical-published:before-anchor:1",
  "restore:capture-cleaned:capture:1",
  "restore:artifact-removed:before-anchor:1",
  "restore:anchor-created:after-anchor:1",
  "restore:canonical-captured:capture:1",
  "restore:capture-cleaned:capture:2",
  "restore:artifact-removed:after-anchor:1",
] as const;

const CLOSEOUT_APPLY_PRIMITIVE_CRASH_POINTS = [
  "apply:create:partial-created:after-stage:1",
  "apply:chmod:partial-created:after-stage:1",
  "apply:write:payload-written:after-stage:1",
  "apply:chmod:mode-set:after-stage:1",
  "apply:link:artifact-ready:after-stage:1",
  "apply:unlink:artifact-removed:after-stage:1",
  "apply:link:canonical-published:after-stage:1",
  "apply:unlink:artifact-removed:after-stage:2",
  "apply:link:anchor-created:before-anchor:1",
  "apply:rename:canonical-captured:capture:1",
  "cleanup:unlink:capture-cleaned:capture:1",
  "cleanup:unlink:artifact-removed:before-anchor:1",
] as const;

const CLOSEOUT_RESTORE_PRIMITIVE_CRASH_POINTS = [
  "restore:link:canonical-published:before-anchor:1",
  "restore:unlink:capture-cleaned:capture:1",
  "restore:unlink:artifact-removed:before-anchor:1",
  "restore:link:anchor-created:after-anchor:1",
  "restore:rename:canonical-captured:capture:1",
  "restore:unlink:capture-cleaned:capture:2",
  "restore:unlink:artifact-removed:after-anchor:1",
] as const;

const UPDATE_APPLY_PRIMITIVE_CRASH_POINTS = [
  "apply:create:partial-created:after-stage:1",
  "apply:chmod:partial-created:after-stage:1",
  "apply:write:payload-written:after-stage:1",
  "apply:chmod:mode-set:after-stage:1",
  "apply:link:artifact-ready:after-stage:1",
  "apply:unlink:artifact-removed:after-stage:1",
  "apply:link:anchor-created:before-anchor:1",
  "apply:rename:canonical-captured:capture:1",
  "apply:link:canonical-published:after-stage:1",
  "apply:unlink:capture-cleaned:capture:1",
  "apply:unlink:artifact-removed:after-stage:2",
  "apply:unlink:artifact-removed:before-anchor:1",
] as const;

const UPDATE_RESTORE_PRIMITIVE_CRASH_POINTS = [
  "restore:link:anchor-created:after-anchor:1",
  "restore:rename:canonical-captured:capture:1",
  "restore:create:partial-created:before-stage:1",
  "restore:chmod:partial-created:before-stage:1",
  "restore:write:payload-written:before-stage:1",
  "restore:chmod:mode-set:before-stage:1",
  "restore:link:artifact-ready:before-stage:1",
  "restore:unlink:artifact-removed:before-stage:1",
  "restore:link:canonical-published:before-stage:1",
  "restore:unlink:capture-cleaned:capture:1",
  "restore:unlink:artifact-removed:after-anchor:1",
  "restore:unlink:artifact-removed:before-stage:2",
] as const;

async function prepareProjectUpdate(
  repository: KnowledgeRecordTransactionTestRepository,
  requestPackage: KnowledgeRecordRequestPackage,
) {
  return prepareKnowledgeRecordTransaction({
    repoRoot: repository.repoRoot,
    requestPath: requestPackage.requestPath,
    expectedKind: "project-update",
    dependencies: engineDependencies(),
  });
}

describe("knowledge record transaction engine", () => {
  const prepareCases = [
    {
      kind: "project-create" as const,
      operationCount: 1,
      installBaseline: installProjectCreateBaseline,
      createPackage: createProjectCreateRequestPackage,
    },
    {
      kind: "project-update" as const,
      operationCount: 1,
      installBaseline: async (_repoRoot: string) => undefined,
      createPackage: createProjectUpdateRequestPackage,
    },
    {
      kind: "issue-create" as const,
      operationCount: 1,
      installBaseline: async (_repoRoot: string) => undefined,
      createPackage: createIssueCreateRequestPackage,
    },
    {
      kind: "issue-update" as const,
      operationCount: 1,
      installBaseline: async (_repoRoot: string) => undefined,
      createPackage: createIssueUpdateRequestPackage,
    },
    {
      kind: "legacy-import" as const,
      operationCount: 2,
      installBaseline: async (_repoRoot: string) => undefined,
      createPackage: createLegacyImportRequestPackage,
    },
    {
      kind: "correction" as const,
      operationCount: 1,
      installBaseline: installCorrectionTarget,
      createPackage: createCorrectionRequestPackage,
    },
    {
      kind: "closeout" as const,
      operationCount: 3,
      installBaseline: async (_repoRoot: string) => undefined,
      createPackage: createCloseoutRequestPackage,
    },
  ];

  it("reports an active writer as a safe status blocker without inspecting transaction contents", async () => {
    const repository = track(
      await createKnowledgeRecordTransactionTestRepository(),
    );
    const lock = await acquireKnowledgeTransactionLock({
      repoRoot: repository.repoRoot,
      command: "status writer fixture",
      recoveryCapable: true,
    });

    try {
      await expect(
        getKnowledgeRecordEngineStatus({ repoRoot: repository.repoRoot }),
      ).resolves.toEqual({
        transactions: [],
        unfinishedTransactionIds: [],
        transactionInventoryReadable: false,
        control: {
          writerLockPresent: true,
          activeCertificationLeaseCount: 0,
          recoveryArtifactsPresent: false,
          blocker: "A Knowledge record writer is active or requires recovery.",
        },
      });
    } finally {
      await releaseKnowledgeTransactionLock(lock);
    }
  });

  it("reports active read-only certification without treating it as unfinished recovery", async () => {
    const repository = track(
      await createKnowledgeRecordTransactionTestRepository(),
    );
    const lease = await acquireKnowledgeCertificationLease({
      repoRoot: repository.repoRoot,
      command: "status certification fixture",
      recoveryCapable: true,
    });

    try {
      const status = await getKnowledgeRecordEngineStatus({
        repoRoot: repository.repoRoot,
      });
      expect(status.transactionInventoryReadable).toBe(true);
      expect(status.control).toEqual({
        writerLockPresent: false,
        activeCertificationLeaseCount: 1,
        recoveryArtifactsPresent: false,
        blocker: null,
      });
    } finally {
      await releaseKnowledgeCertificationLease(lease, {
        recoveryCapable: true,
      });
    }
  });

  it("reports an interrupted recovery artifact without exposing private control paths", async () => {
    const repository = track(
      await createKnowledgeRecordTransactionTestRepository(),
    );
    const transactionRoot = path.join(
      repository.gitDirectory,
      "chronicle-knowledge-transactions",
    );
    await mkdir(transactionRoot, { recursive: true, mode: 0o700 });
    await chmod(transactionRoot, 0o700);
    await mkdir(
      path.join(
        transactionRoot,
        `.reclaimed-writer-lock-${"a".repeat(32)}-999999-${"b".repeat(16)}`,
      ),
      {
        mode: 0o700,
      },
    );

    const status = await getKnowledgeRecordEngineStatus({
      repoRoot: repository.repoRoot,
    });
    expect(status).toEqual({
      transactions: [],
      unfinishedTransactionIds: [],
      transactionInventoryReadable: false,
      control: {
        writerLockPresent: false,
        activeCertificationLeaseCount: 0,
        recoveryArtifactsPresent: true,
        blocker: "Transaction control recovery must finish before records can be inspected.",
      },
    });
    expect(JSON.stringify(status)).not.toContain(repository.repoRoot);
    expect(JSON.stringify(status)).not.toContain(repository.gitDirectory);
  });

  it.each(prepareCases)(
    "prepares $kind without mutating canonical records",
    async ({ kind, operationCount, installBaseline, createPackage }) => {
      const repository = track(
        await createKnowledgeRecordTransactionTestRepository(),
      );
      await installBaseline(repository.repoRoot);
      const requestPackage = track(await createPackage());
      const before = await readCanonicalSourceInventory(repository.repoRoot);

      const prepared = await prepareKnowledgeRecordTransaction({
        repoRoot: repository.repoRoot,
        requestPath: requestPackage.requestPath,
        expectedKind: kind,
        dependencies: engineDependencies(),
      });

      expect(prepared).toMatchObject({ kind, operationCount });
      expectInventoriesIdentical(
        await readCanonicalSourceInventory(repository.repoRoot),
        before,
      );
      expect(
        await readKnowledgeTransactionJournal({
          repoRoot: repository.repoRoot,
          transactionId: prepared.transactionId,
        }),
      ).toMatchObject({ events: [], tornFinalLine: false });
    },
  );

  it.each([
    {
      kind: "project-update" as const,
      sourcePath: canonicalRecordSourcePath(
        "active-current-work",
        KNOWLEDGE_TRANSACTION_FIXTURE_PROJECT_ID,
      ),
      contentName: `${KNOWLEDGE_TRANSACTION_FIXTURE_PROJECT_ID}.md`,
      createPackage: createProjectUpdateRequestPackage,
    },
    {
      kind: "issue-update" as const,
      sourcePath: canonicalRecordSourcePath(
        "issue",
        KNOWLEDGE_TRANSACTION_FIXTURE_ISSUE_ID,
      ),
      contentName: `${KNOWLEDGE_TRANSACTION_FIXTURE_ISSUE_ID}.md`,
      createPackage: createIssueUpdateRequestPackage,
    },
  ])(
    "rejects a $kind draft whose editor-read source became stale before prepare",
    async ({ kind, sourcePath, contentName, createPackage }) => {
      const repository = track(
        await createKnowledgeRecordTransactionTestRepository(),
      );
      const requestPackage = track(await createPackage());
      await writeFile(
        absoluteCanonicalPath(repository.repoRoot, sourcePath),
        await readFile(requestPackage.contentPaths[contentName]),
      );

      await expect(
        prepareKnowledgeRecordTransaction({
          repoRoot: repository.repoRoot,
          requestPath: requestPackage.requestPath,
          expectedKind: kind,
          dependencies: engineDependencies(),
        }),
      ).rejects.toThrow(/already stale when this request was prepared/);
    },
  );

  it("rejects a closeout that tries to update an Issue not linked by the active project", async () => {
    const repository = track(
      await createKnowledgeRecordTransactionTestRepository(),
    );
    const requestPackage = track(
      await createResolvedIssueCloseoutRequestPackage(),
    );
    const activePath = absoluteCanonicalPath(
      repository.repoRoot,
      repository.activeProjectPath,
    );
    await writeFile(
      activePath,
      (await readFile(activePath, "utf8"))
        .replace("origin: verified_issue", "origin: documentation_architecture")
        .replace(
          `linked_issue_ids: [${KNOWLEDGE_TRANSACTION_FIXTURE_ISSUE_ID}]`,
          "linked_issue_ids: []",
        ),
      "utf8",
    );
    const inventory = await readCanonicalSourceInventory(repository.repoRoot);
    const activeEntry = inventory.entries.find(
      (entry) => entry.sourcePath === repository.activeProjectPath,
    );
    if (!activeEntry) throw new Error("Missing active-project fixture source.");
    const request = JSON.parse(
      await readFile(requestPackage.requestPath, "utf8"),
    ) as Record<string, unknown>;
    request.expected_project_sha256 = activeEntry.sha256;
    await writeFile(
      requestPackage.requestPath,
      `${JSON.stringify(request, null, 2)}\n`,
      "utf8",
    );

    await expect(
      prepareKnowledgeRecordTransaction({
        repoRoot: repository.repoRoot,
        requestPath: requestPackage.requestPath,
        expectedKind: "closeout",
        dependencies: engineDependencies(),
      }),
    ).rejects.toThrow(/only Issues linked by the active project/);
  });

  it("rejects a closeout that adds an Issue to the archived project", async () => {
    const repository = track(
      await createKnowledgeRecordTransactionTestRepository(),
    );
    const requestPackage = track(await createCloseoutRequestPackage());
    const activePath = absoluteCanonicalPath(
      repository.repoRoot,
      repository.activeProjectPath,
    );
    await writeFile(
      activePath,
      (await readFile(activePath, "utf8"))
        .replace("origin: verified_issue", "origin: documentation_architecture")
        .replace(
          `linked_issue_ids: [${KNOWLEDGE_TRANSACTION_FIXTURE_ISSUE_ID}]`,
          "linked_issue_ids: []",
        ),
      "utf8",
    );
    const inventory = await readCanonicalSourceInventory(repository.repoRoot);
    const activeEntry = inventory.entries.find(
      (entry) => entry.sourcePath === repository.activeProjectPath,
    );
    if (!activeEntry) throw new Error("Missing active-project fixture source.");
    const request = JSON.parse(
      await readFile(requestPackage.requestPath, "utf8"),
    ) as Record<string, unknown>;
    request.expected_project_sha256 = activeEntry.sha256;
    await writeFile(
      requestPackage.requestPath,
      `${JSON.stringify(request, null, 2)}\n`,
      "utf8",
    );

    await expect(
      prepareKnowledgeRecordTransaction({
        repoRoot: repository.repoRoot,
        requestPath: requestPackage.requestPath,
        expectedKind: "closeout",
        dependencies: engineDependencies(),
      }),
    ).rejects.toThrow(/must preserve the active project's linked Issues exactly/);
  });

  it("rejects a closeout candidate whose accepted Changelog narrative is incomplete", async () => {
    const repository = track(
      await createKnowledgeRecordTransactionTestRepository(),
    );
    const requestPackage = track(await createCloseoutRequestPackage());
    const changelogContentPath =
      requestPackage.contentPaths[`${KNOWLEDGE_TRANSACTION_FIXTURE_CHANGE_ID}.md`];
    const incompleteChangelog = (await readFile(changelogContentPath, "utf8")).replace(
      /^accepted_evidence_limits:.*\n/m,
      "",
    );
    await writeFile(changelogContentPath, incompleteChangelog, "utf8");
    const before = await readCanonicalSourceInventory(repository.repoRoot);

    await expect(
      prepareKnowledgeRecordTransaction({
        repoRoot: repository.repoRoot,
        requestPath: requestPackage.requestPath,
        expectedKind: "closeout",
        dependencies: engineDependencies(),
      }),
    ).rejects.toThrow(/accepted_evidence_limits/);
    expectInventoriesIdentical(
      await readCanonicalSourceInventory(repository.repoRoot),
      before,
    );
  });

  it.each([
    {
      name: "unlinked Issue update",
      includeIssueUpdate: true,
      createPackage: createResolvedIssueCloseoutRequestPackage,
      message: /only Issues linked by the active project/,
    },
    {
      name: "archive-only Issue ownership change",
      includeIssueUpdate: false,
      createPackage: createCloseoutRequestPackage,
      message: /must preserve the active project's linked Issues exactly/,
    },
  ])(
    "revalidates $name from a stored closeout before apply",
    async ({ includeIssueUpdate, createPackage, message }) => {
      const repository = track(
        await createKnowledgeRecordTransactionTestRepository(),
      );
      const requestPackage = track(await createPackage());
      const activePath = absoluteCanonicalPath(
        repository.repoRoot,
        repository.activeProjectPath,
      );
      await writeFile(
        activePath,
        (await readFile(activePath, "utf8"))
          .replace("origin: verified_issue", "origin: documentation_architecture")
          .replace(
            `linked_issue_ids: [${KNOWLEDGE_TRANSACTION_FIXTURE_ISSUE_ID}]`,
            "linked_issue_ids: []",
          ),
        "utf8",
      );
      const inventory = await readCanonicalSourceInventory(repository.repoRoot);
      const operations = await storedCloseoutOperations(
        inventory,
        requestPackage,
        includeIssueUpdate,
      );

      expect(() =>
        validateStoredKnowledgeRecordCandidate(
          inventory,
          KNOWLEDGE_TRANSACTION_FIXTURE_AS_OF,
          operations,
          "closeout",
        ),
      ).toThrow(message);
    },
  );

  it("rejects a closeout whose active-project source became stale before prepare", async () => {
    const repository = track(
      await createKnowledgeRecordTransactionTestRepository(),
    );
    const closeoutPackage = track(await createCloseoutRequestPackage());
    const projectUpdatePackage = track(await createProjectUpdateRequestPackage());
    await writeFile(
      absoluteCanonicalPath(repository.repoRoot, repository.activeProjectPath),
      await readFile(
        projectUpdatePackage.contentPaths[
          `${KNOWLEDGE_TRANSACTION_FIXTURE_PROJECT_ID}.md`
        ],
      ),
    );
    const before = await readCanonicalSourceInventory(repository.repoRoot);

    await expect(
      prepareKnowledgeRecordTransaction({
        repoRoot: repository.repoRoot,
        requestPath: closeoutPackage.requestPath,
        expectedKind: "closeout",
        dependencies: engineDependencies(),
      }),
    ).rejects.toThrow(/already stale when this request was prepared/);
    expectInventoriesIdentical(
      await readCanonicalSourceInventory(repository.repoRoot),
      before,
    );
  });

  it("rejects a closeout whose linked-Issue source became stale before prepare", async () => {
    const repository = track(
      await createKnowledgeRecordTransactionTestRepository(),
    );
    const closeoutPackage = track(
      await createResolvedIssueCloseoutRequestPackage(),
    );
    const issueUpdatePackage = track(await createIssueUpdateRequestPackage());
    await writeFile(
      absoluteCanonicalPath(repository.repoRoot, repository.issuePath),
      await readFile(
        issueUpdatePackage.contentPaths[
          `${KNOWLEDGE_TRANSACTION_FIXTURE_ISSUE_ID}.md`
        ],
      ),
    );
    const before = await readCanonicalSourceInventory(repository.repoRoot);

    await expect(
      prepareKnowledgeRecordTransaction({
        repoRoot: repository.repoRoot,
        requestPath: closeoutPackage.requestPath,
        expectedKind: "closeout",
        dependencies: engineDependencies(),
      }),
    ).rejects.toThrow(/already stale when this request was prepared/);
    expectInventoriesIdentical(
      await readCanonicalSourceInventory(repository.repoRoot),
      before,
    );
  });

  it("applies a project update once and treats a repeated apply as idempotent", async () => {
    const repository = track(
      await createKnowledgeRecordTransactionTestRepository(),
    );
    const requestPackage = track(await createProjectUpdateRequestPackage());
    const activePath = absoluteCanonicalPath(
      repository.repoRoot,
      repository.activeProjectPath,
    );
    await chmod(activePath, 0o640);
    const expectedBytes = await readFile(
      requestPackage.contentPaths[`${KNOWLEDGE_TRANSACTION_FIXTURE_PROJECT_ID}.md`],
    );
    const prepared = await prepareProjectUpdate(repository, requestPackage);

    const applied = await applyKnowledgeRecordTransaction({
      repoRoot: repository.repoRoot,
      transactionId: prepared.transactionId,
      dependencies: engineDependencies(),
    });
    const firstJournal = await readKnowledgeTransactionJournal({
      repoRoot: repository.repoRoot,
      transactionId: prepared.transactionId,
    });

    expect(applied.outcome).toBe("applied");
    expect((await readFile(activePath)).equals(expectedBytes)).toBe(true);
    expect(await fileMode(activePath)).toBe(0o640);

    const repeated = await applyKnowledgeRecordTransaction({
      repoRoot: repository.repoRoot,
      transactionId: prepared.transactionId,
      dependencies: engineDependencies(),
    });
    const repeatedJournal = await readKnowledgeTransactionJournal({
      repoRoot: repository.repoRoot,
      transactionId: prepared.transactionId,
    });

    expect(repeated).toEqual({
      transactionId: prepared.transactionId,
      outcome: "already-applied",
      validationSha256: applied.validationSha256,
    });
    expect(repeatedJournal.events).toEqual(firstJournal.events);
    expect((await readFile(activePath)).equals(expectedBytes)).toBe(true);
    expect(await fileMode(activePath)).toBe(0o640);
  });

  it.each([
    {
      kind: "project-create" as const,
      recordId: KNOWLEDGE_TRANSACTION_FIXTURE_CREATED_PROJECT_ID,
      location: "active-current-work" as const,
      installBaseline: installProjectCreateBaseline,
      createPackage: createProjectCreateRequestPackage,
    },
    {
      kind: "issue-create" as const,
      recordId: KNOWLEDGE_TRANSACTION_FIXTURE_CREATED_ISSUE_ID,
      location: "issue" as const,
      installBaseline: async (_repoRoot: string): Promise<void> => undefined,
      createPackage: createIssueCreateRequestPackage,
    },
    {
      kind: "issue-update" as const,
      recordId: KNOWLEDGE_TRANSACTION_FIXTURE_ISSUE_ID,
      location: "issue" as const,
      installBaseline: async (_repoRoot: string): Promise<void> => undefined,
      createPackage: createIssueUpdateRequestPackage,
    },
  ])("applies one protected $kind and treats a repeated apply as idempotent", async ({
    kind,
    recordId,
    location,
    installBaseline,
    createPackage,
  }) => {
    const repository = track(
      await createKnowledgeRecordTransactionTestRepository(),
    );
    await installBaseline(repository.repoRoot);
    const requestPackage = track(await createPackage());
    const recordPath = absoluteCanonicalPath(
      repository.repoRoot,
      canonicalRecordSourcePath(location, recordId),
    );
    const expectedBytes = await readFile(
      requestPackage.contentPaths[`${recordId}.md`],
    );
    const prepared = await prepareKnowledgeRecordTransaction({
      repoRoot: repository.repoRoot,
      requestPath: requestPackage.requestPath,
      expectedKind: kind,
      dependencies: engineDependencies(),
    });

    const applied = await applyKnowledgeRecordTransaction({
      repoRoot: repository.repoRoot,
      transactionId: prepared.transactionId,
      dependencies: engineDependencies(),
    });
    expect(applied.outcome).toBe("applied");
    expect((await readFile(recordPath)).equals(expectedBytes)).toBe(true);

    const repeated = await applyKnowledgeRecordTransaction({
      repoRoot: repository.repoRoot,
      transactionId: prepared.transactionId,
      dependencies: engineDependencies(),
    });
    expect(repeated).toEqual({
      transactionId: prepared.transactionId,
      outcome: "already-applied",
      validationSha256: applied.validationSha256,
    });
  });

  it("rejects project-create when its canonical destination already exists", async () => {
    const repository = track(
      await createKnowledgeRecordTransactionTestRepository(),
    );
    await installProjectCreateBaseline(repository.repoRoot);
    const requestPackage = track(await createProjectCreateRequestPackage());
    const projectPath = absoluteCanonicalPath(
      repository.repoRoot,
      canonicalRecordSourcePath(
        "active-current-work",
        KNOWLEDGE_TRANSACTION_FIXTURE_CREATED_PROJECT_ID,
      ),
    );
    await writeFile(
      projectPath,
      await readFile(
        requestPackage.contentPaths[
          `${KNOWLEDGE_TRANSACTION_FIXTURE_CREATED_PROJECT_ID}.md`
        ],
      ),
      { mode: 0o644 },
    );

    await expect(
      prepareKnowledgeRecordTransaction({
        repoRoot: repository.repoRoot,
        requestPath: requestPackage.requestPath,
        expectedKind: "project-create",
        dependencies: engineDependencies(),
      }),
    ).rejects.toThrow(/already exists|expected.*absent/i);
  });

  it("rejects a project-create candidate that would leave two explicit Primary projects", async () => {
    const repository = track(
      await createKnowledgeRecordTransactionTestRepository(),
    );
    await installProjectCreateBaseline(repository.repoRoot);
    const existingProjectPath = absoluteCanonicalPath(
      repository.repoRoot,
      repository.activeProjectPath,
    );
    await writeFile(
      existingProjectPath,
      (await readFile(existingProjectPath, "utf8")).replace(
        "- Resume priority: Secondary",
        "- Resume priority: Primary",
      ),
      "utf8",
    );
    const requestPackage = track(await createProjectCreateRequestPackage());

    await expect(
      prepareKnowledgeRecordTransaction({
        repoRoot: repository.repoRoot,
        requestPath: requestPackage.requestPath,
        expectedKind: "project-create",
        dependencies: engineDependencies(),
      }),
    ).rejects.toThrow(/expected exactly one primary resume project, found 2/);
  });

  it.each([
    {
      label: "uses an update instead of a create",
      build: async (repository: KnowledgeRecordTransactionTestRepository) => {
        const sourcePath = repository.activeProjectPath;
        const beforeBytes = await readFile(
          absoluteCanonicalPath(repository.repoRoot, sourcePath),
        );
        return {
          snapshotSources: [
            {
              path: sourcePath,
              state: "present" as const,
              sha256: createHash("sha256").update(beforeBytes).digest("hex"),
              mode: await fileMode(
                absoluteCanonicalPath(repository.repoRoot, sourcePath),
              ),
            },
          ],
          operations: [
            {
              action: "update" as const,
              path: sourcePath,
              beforeBytes,
              afterBytes: Buffer.concat([beforeBytes, Buffer.from("\nupdated\n")]),
            },
          ],
        };
      },
    },
    {
      label: "targets an Issue instead of active Current Work",
      build: async (_repository: KnowledgeRecordTransactionTestRepository) => {
        const sourcePath = canonicalRecordSourcePath("issue", "CG-ISSUE-002");
        return {
          snapshotSources: [{ path: sourcePath, state: "absent" as const }],
          operations: [
            {
              action: "create" as const,
              path: sourcePath,
              afterBytes: Buffer.from("wrong canonical location", "utf8"),
            },
          ],
        };
      },
    },
    {
      label: "contains more than one create operation",
      build: async (_repository: KnowledgeRecordTransactionTestRepository) => {
        const sourcePaths = ["CG-WORK-002", "CG-WORK-003"].map((projectId) =>
          canonicalRecordSourcePath("active-current-work", projectId),
        );
        return {
          snapshotSources: sourcePaths.map((sourcePath) => ({
            path: sourcePath,
            state: "absent" as const,
          })),
          operations: sourcePaths.map((sourcePath) => ({
            action: "create" as const,
            path: sourcePath,
            afterBytes: Buffer.from(`unexpected extra create: ${sourcePath}`, "utf8"),
          })),
        };
      },
    },
  ])(
    "rejects a stored project-create before mutation when it $label",
    async ({ build }) => {
      const repository = track(
        await createKnowledgeRecordTransactionTestRepository(),
      );
      const baseline = await readCanonicalSourceInventory(repository.repoRoot);
      const malformed = await build(repository);
      const transactionId = generateKnowledgeTransactionId();
      const lock = await acquireKnowledgeTransactionLock({
        repoRoot: repository.repoRoot,
        command: "prepare malformed project-create fixture",
        transactionId,
      });
      const snapshot: KnowledgeTransactionSnapshot = {
        validationAsOf: KNOWLEDGE_TRANSACTION_FIXTURE_AS_OF,
        requestSha256: "f".repeat(64),
        packageSha256: null,
        sources: malformed.snapshotSources,
      };
      try {
        await createPreparedKnowledgeTransaction({
          lock,
          transactionId,
          kind: "project-create",
          snapshot,
          operations:
            malformed.operations as KnowledgeTransactionOperationInput[],
        });
      } finally {
        await releaseKnowledgeTransactionLock(lock);
      }

      await expect(
        applyKnowledgeRecordTransaction({
          repoRoot: repository.repoRoot,
          transactionId,
          dependencies: engineDependencies(),
        }),
      ).rejects.toThrow(/project-create transaction shape is invalid/);
      expectInventoriesIdentical(
        await readCanonicalSourceInventory(repository.repoRoot),
        baseline,
      );
      expect(
        await readKnowledgeTransactionJournal({
          repoRoot: repository.repoRoot,
          transactionId,
        }),
      ).toMatchObject({ events: [], tornFinalLine: false });

      await expect(
        recoverKnowledgeRecordTransaction({
          repoRoot: repository.repoRoot,
          transactionId,
          dependencies: engineDependencies(),
        }),
      ).rejects.toThrow(/project-create transaction shape is invalid/);
      expectInventoriesIdentical(
        await readCanonicalSourceInventory(repository.repoRoot),
        baseline,
      );
      expect(
        await readKnowledgeTransactionJournal({
          repoRoot: repository.repoRoot,
          transactionId,
        }),
      ).toMatchObject({ events: [], tornFinalLine: false });
    },
  );

  it("automatically restores project-create after a caught failure, then permits apply", async () => {
    const { repository, requestPackage, projectPath, baseline, prepared } =
      await createPreparedProjectCreateFixture();
    const hook = vi.fn(
      (event: Parameters<NonNullable<KnowledgeRecordEngineDependencies["afterCanonicalMutation"]>>[0]) => {
        if (event.phase === "apply" && event.mutationCount === 1) {
          throw new Error("injected project-create failure");
        }
      },
    );

    await expect(
      applyKnowledgeRecordTransaction({
        repoRoot: repository.repoRoot,
        transactionId: prepared.transactionId,
        dependencies: engineDependencies({ afterCanonicalMutation: hook }),
      }),
    ).rejects.toThrow("injected project-create failure");
    expectInventoriesIdentical(
      await readCanonicalSourceInventory(repository.repoRoot),
      baseline,
    );
    await expect(readFile(projectPath)).rejects.toMatchObject({ code: "ENOENT" });

    const reapplied = await applyKnowledgeRecordTransaction({
      repoRoot: repository.repoRoot,
      transactionId: prepared.transactionId,
      dependencies: engineDependencies(),
    });
    expect(reapplied.outcome).toBe("applied");
    expect((await readFile(projectPath)).equals(
      await readFile(
        requestPackage.contentPaths[
          `${KNOWLEDGE_TRANSACTION_FIXTURE_CREATED_PROJECT_ID}.md`
        ],
      ),
    )).toBe(true);
  });

  it("updates a resolved Issue in the same guarded closeout that creates its archive and Changelog record", async () => {
    const repository = track(
      await createKnowledgeRecordTransactionTestRepository(),
    );
    const requestPackage = track(
      await createResolvedIssueCloseoutRequestPackage(),
    );
    const prepared = await prepareKnowledgeRecordTransaction({
      repoRoot: repository.repoRoot,
      requestPath: requestPackage.requestPath,
      expectedKind: "closeout",
      dependencies: engineDependencies(),
    });
    const stored = await openVerifiedKnowledgeTransaction({
      repoRoot: repository.repoRoot,
      transactionId: prepared.transactionId,
    });

    expect(stored.operations.map(({ action, path: sourcePath }) => ({
      action,
      sourcePath,
    }))).toEqual([
      { action: "update", sourcePath: repository.issuePath },
      { action: "create", sourcePath: ARCHIVED_PROJECT_PATH },
      { action: "create", sourcePath: ACCEPTED_CHANGE_PATH },
      { action: "remove", sourcePath: repository.activeProjectPath },
    ]);

    const applied = await applyKnowledgeRecordTransaction({
      repoRoot: repository.repoRoot,
      transactionId: prepared.transactionId,
      dependencies: engineDependencies(),
    });
    expect(applied.outcome).toBe("applied");
    expect(
      (
        await readFile(
          absoluteCanonicalPath(repository.repoRoot, repository.issuePath),
        )
      ).equals(
        await readFile(
          requestPackage.contentPaths[
            `${KNOWLEDGE_TRANSACTION_FIXTURE_ISSUE_ID}.md`
          ],
        ),
      ),
    ).toBe(true);
    expect(await closeoutFileStates(repository)).toEqual({
      archive: "present",
      changelog: "present",
      active: "absent",
    });
  });

  it("applies the migration receipt and its legacy record in one transaction", async () => {
    const repository = track(
      await createKnowledgeRecordTransactionTestRepository(),
    );
    const requestPackage = track(await createLegacyImportRequestPackage());
    const receiptPath = absoluteCanonicalPath(
      repository.repoRoot,
      CHANGELOG_MIGRATION_RECEIPT_SOURCE_PATH,
    );
    const legacyPath = absoluteCanonicalPath(
      repository.repoRoot,
      LEGACY_CHANGE_PATH,
    );
    const expectedReceipt = await readFile(
      requestPackage.contentPaths[`${CHANGELOG_MIGRATION_RECEIPT_RECORD_ID}.md`],
    );
    const expectedLegacy = await readFile(
      requestPackage.contentPaths[`${KNOWLEDGE_TRANSACTION_FIXTURE_LEGACY_ID}.md`],
    );
    const prepared = await prepareKnowledgeRecordTransaction({
      repoRoot: repository.repoRoot,
      requestPath: requestPackage.requestPath,
      expectedKind: "legacy-import",
      dependencies: engineDependencies(),
    });

    const applied = await applyKnowledgeRecordTransaction({
      repoRoot: repository.repoRoot,
      transactionId: prepared.transactionId,
      dependencies: engineDependencies(),
    });

    expect(applied.outcome).toBe("applied");
    expect((await readFile(receiptPath)).equals(expectedReceipt)).toBe(true);
    expect((await readFile(legacyPath)).equals(expectedLegacy)).toBe(true);

    const repeated = await applyKnowledgeRecordTransaction({
      repoRoot: repository.repoRoot,
      transactionId: prepared.transactionId,
      dependencies: engineDependencies(),
    });
    expect(repeated).toEqual({
      transactionId: prepared.transactionId,
      outcome: "already-applied",
      validationSha256: applied.validationSha256,
    });
  });

  it(
    "removes both migration files when apply is interrupted after creating the final receipt",
    async () => {
      const repository = track(
        await createKnowledgeRecordTransactionTestRepository(),
      );
      const requestPackage = track(await createLegacyImportRequestPackage());
      const receiptPath = absoluteCanonicalPath(
        repository.repoRoot,
        CHANGELOG_MIGRATION_RECEIPT_SOURCE_PATH,
      );
      const legacyPath = absoluteCanonicalPath(
        repository.repoRoot,
        LEGACY_CHANGE_PATH,
      );
      const before = await readCanonicalSourceInventory(repository.repoRoot);
      const prepared = await prepareKnowledgeRecordTransaction({
        repoRoot: repository.repoRoot,
        requestPath: requestPackage.requestPath,
        expectedKind: "legacy-import",
        dependencies: engineDependencies(),
      });
      const hook = vi.fn(
        (event: Parameters<NonNullable<KnowledgeRecordEngineDependencies["afterCanonicalMutation"]>>[0]) => {
          if (event.phase === "apply" && event.mutationCount === 2) {
            throw new Error("injected receipt-create failure");
          }
        },
      );

      await expect(
        applyKnowledgeRecordTransaction({
          repoRoot: repository.repoRoot,
          transactionId: prepared.transactionId,
          dependencies: engineDependencies({ afterCanonicalMutation: hook }),
        }),
      ).rejects.toThrow("injected receipt-create failure");

      expectInventoriesIdentical(
        await readCanonicalSourceInventory(repository.repoRoot),
        before,
      );
      await expect(readFile(receiptPath)).rejects.toMatchObject({ code: "ENOENT" });
      await expect(readFile(legacyPath)).rejects.toMatchObject({ code: "ENOENT" });
      expect(
        await getKnowledgeTransactionStatus({
          repoRoot: repository.repoRoot,
          transactionId: prepared.transactionId,
        }),
      ).toMatchObject({ unfinished: false, terminalOutcome: "recovered" });
      expect(hook).toHaveBeenCalledWith({
        phase: "apply",
        operationIndex: 1,
        mutationCount: 2,
      });
      expect(hook).toHaveBeenCalledWith({
        phase: "rollback",
        operationIndex: 1,
        mutationCount: 1,
      });
      expect(hook).toHaveBeenCalledWith({
        phase: "rollback",
        operationIndex: 0,
        mutationCount: 2,
      });

      const reapplied = await applyKnowledgeRecordTransaction({
        repoRoot: repository.repoRoot,
        transactionId: prepared.transactionId,
        dependencies: engineDependencies(),
      });
      expect(reapplied.outcome).toBe("applied");
      await expect(readFile(receiptPath)).resolves.toBeInstanceOf(Buffer);
      await expect(readFile(legacyPath)).resolves.toBeInstanceOf(Buffer);
    },
    30_000,
  );

  it(
    "maps 203-record boundaries, recovers after receipt-edge process death, and applies all 204 operations",
    async () => {
      const repository = track(
        await createKnowledgeRecordTransactionTestRepository(),
      );
      const requestPackage = track(
        await createLegacyImportRequestPackage(203),
      );
      const cliBundle = track(await createCliBundle());
      const baseline = await readCanonicalSourceInventory(repository.repoRoot);
      const request = JSON.parse(
        await readFile(requestPackage.requestPath, "utf8"),
      ) as {
        records: Array<{ change_id: string }>;
      };
      const legacyChangeIds = request.records.map((record) => record.change_id);
      const legacyDirectoryPrefix = `${path.posix.dirname(
        canonicalRecordSourcePath("changelog", legacyChangeIds[0]),
      )}/`;
      const prepared = await prepareKnowledgeRecordTransaction({
        repoRoot: repository.repoRoot,
        requestPath: requestPackage.requestPath,
        expectedKind: "legacy-import",
        dependencies: engineDependencies(),
      });
      const stored = await openVerifiedKnowledgeTransaction({
        repoRoot: repository.repoRoot,
        transactionId: prepared.transactionId,
      });
      const expectedBoundaryPaths = [
        canonicalRecordSourcePath("changelog", legacyChangeIds[0]),
        canonicalRecordSourcePath("changelog", legacyChangeIds[101]),
        canonicalRecordSourcePath("changelog", legacyChangeIds[202]),
        CHANGELOG_MIGRATION_RECEIPT_SOURCE_PATH,
      ];
      const receiptPath = absoluteCanonicalPath(
        repository.repoRoot,
        CHANGELOG_MIGRATION_RECEIPT_SOURCE_PATH,
      );

      expect(legacyChangeIds).toHaveLength(203);
      expect(new Set(legacyChangeIds).size).toBe(203);
      expect(prepared.operationCount).toBe(204);
      expect(stored.operations).toHaveLength(204);
      expect(
        stored.operations.slice(0, 203).map((operation) => operation.action),
      ).toEqual(Array.from({ length: 203 }, () => "create"));
      expect(
        new Set(
          stored.operations
            .slice(0, 203)
            .map((operation) => operation.path),
        ).size,
      ).toBe(203);
      expect(
        [0, 101, 202, 203].map((index) => stored.operations[index].path),
      ).toEqual(expectedBoundaryPaths);
      expect(stored.operations[203]).toMatchObject({
        index: 203,
        action: "create",
        path: CHANGELOG_MIGRATION_RECEIPT_SOURCE_PATH,
      });

      const crashed = runCli(
        cliBundle.cliPath,
        repository.repoRoot,
        ["apply", "--transaction", prepared.transactionId],
        abruptEnvironment("apply", 204),
        120_000,
      );
      expectAbruptCliExit(crashed);
      await expectTransactionUnfinished(
        repository.repoRoot,
        prepared.transactionId,
      );
      expectRepositoryGuardBlocked(repository.repoRoot, prepared.transactionId);
      const interruptedInventory = await readCanonicalSourceInventory(
        repository.repoRoot,
      );
      expect(
        interruptedInventory.membership.filter((sourcePath) =>
          sourcePath.startsWith(legacyDirectoryPrefix),
        ),
      ).toHaveLength(203);
      expect(interruptedInventory.membership).toContain(
        CHANGELOG_MIGRATION_RECEIPT_SOURCE_PATH,
      );

      const recovered = runCli(
        cliBundle.cliPath,
        repository.repoRoot,
        ["recover", "--transaction", prepared.transactionId],
        {},
        120_000,
      );
      expectCliStarted(recovered);
      expect(recovered.status, recovered.stderr).toBe(0);
      expect(recovered.stderr).toBe("");
      expect(recovered.stdout).toContain(
        `Transaction ${prepared.transactionId}: recovered`,
      );
      expectInventoriesIdentical(
        await readCanonicalSourceInventory(repository.repoRoot),
        baseline,
      );
      await expect(readFile(receiptPath)).rejects.toMatchObject({ code: "ENOENT" });
      expectRepositoryGuardPassed(repository.repoRoot);

      const applied = runCli(
        cliBundle.cliPath,
        repository.repoRoot,
        ["apply", "--transaction", prepared.transactionId],
        {},
        120_000,
      );
      expectCliStarted(applied);
      expect(applied.status, applied.stderr).toBe(0);
      expect(applied.stderr).toBe("");
      expect(applied.stdout).toContain(
        `Transaction ${prepared.transactionId}: applied`,
      );

      const finalInventory = await readCanonicalSourceInventory(
        repository.repoRoot,
      );
      expect(
        finalInventory.membership.filter((sourcePath) =>
          sourcePath.startsWith(legacyDirectoryPrefix),
        ),
      ).toHaveLength(203);
      expect(finalInventory.membership).toContain(
        CHANGELOG_MIGRATION_RECEIPT_SOURCE_PATH,
      );
      for (const changeId of legacyChangeIds) {
        const actual = await readFile(
          absoluteCanonicalPath(
            repository.repoRoot,
            canonicalRecordSourcePath("changelog", changeId),
          ),
        );
        const expected = await readFile(
          requestPackage.contentPaths[`${changeId}.md`],
        );
        expect(actual.equals(expected), changeId).toBe(true);
      }
      expect(
        (
          await readFile(
            absoluteCanonicalPath(
              repository.repoRoot,
              CHANGELOG_MIGRATION_RECEIPT_SOURCE_PATH,
            ),
          )
        ).equals(
          await readFile(
            requestPackage.contentPaths[
              `${CHANGELOG_MIGRATION_RECEIPT_RECORD_ID}.md`
            ],
          ),
        ),
      ).toBe(true);
      expectRepositoryGuardPassed(repository.repoRoot);
    },
    300_000,
  );

  it(
    "automatically restores exact bytes and mode after a thrown post-mutation hook, then permits apply after recovery",
    async () => {
      const repository = track(
        await createKnowledgeRecordTransactionTestRepository(),
      );
      const requestPackage = track(await createProjectUpdateRequestPackage());
      const activePath = absoluteCanonicalPath(
        repository.repoRoot,
        repository.activeProjectPath,
      );
      await chmod(activePath, 0o640);
      const before = await readCanonicalSourceInventory(repository.repoRoot);
      const beforeBytes = await readFile(activePath);
      const prepared = await prepareProjectUpdate(repository, requestPackage);
      const hook = vi.fn(
        (event: Parameters<NonNullable<KnowledgeRecordEngineDependencies["afterCanonicalMutation"]>>[0]) => {
          if (event.phase === "apply" && event.mutationCount === 1) {
            throw new Error("injected post-mutation failure");
          }
        },
      );

      await expect(
        applyKnowledgeRecordTransaction({
          repoRoot: repository.repoRoot,
          transactionId: prepared.transactionId,
          dependencies: engineDependencies({ afterCanonicalMutation: hook }),
        }),
      ).rejects.toThrow("injected post-mutation failure");

      expectInventoriesIdentical(
        await readCanonicalSourceInventory(repository.repoRoot),
        before,
      );
      expect((await readFile(activePath)).equals(beforeBytes)).toBe(true);
      expect(await fileMode(activePath)).toBe(0o640);
      expect(
        await getKnowledgeTransactionStatus({
          repoRoot: repository.repoRoot,
          transactionId: prepared.transactionId,
        }),
      ).toMatchObject({ unfinished: false, terminalOutcome: "recovered" });
      expect(hook).toHaveBeenCalledWith({
        phase: "apply",
        operationIndex: 0,
        mutationCount: 1,
      });
      expect(hook).toHaveBeenCalledWith({
        phase: "rollback",
        operationIndex: 0,
        mutationCount: 1,
      });

      const reapplied = await applyKnowledgeRecordTransaction({
        repoRoot: repository.repoRoot,
        transactionId: prepared.transactionId,
        dependencies: engineDependencies(),
      });
      const expectedBytes = await readFile(
        requestPackage.contentPaths[`${KNOWLEDGE_TRANSACTION_FIXTURE_PROJECT_ID}.md`],
      );
      expect(reapplied.outcome).toBe("applied");
      expect((await readFile(activePath)).equals(expectedBytes)).toBe(true);
      expect(await fileMode(activePath)).toBe(0o640);
    },
    30_000,
  );

  it.each([1, 2, 3])(
    "automatically rolls back a caught closeout failure after apply mutation %i",
    async (mutationPosition) => {
      const { repository, activePath, baseline, prepared } =
        await createPreparedCloseoutFixture();
      const hook = vi.fn(
        (event: Parameters<NonNullable<KnowledgeRecordEngineDependencies["afterCanonicalMutation"]>>[0]) => {
          if (
            event.phase === "apply" &&
            event.mutationCount === mutationPosition
          ) {
            throw new Error(
              `caught closeout failure after mutation ${mutationPosition}`,
            );
          }
        },
      );

      await expect(
        applyKnowledgeRecordTransaction({
          repoRoot: repository.repoRoot,
          transactionId: prepared.transactionId,
          dependencies: engineDependencies({ afterCanonicalMutation: hook }),
        }),
      ).rejects.toThrow(
        `caught closeout failure after mutation ${mutationPosition}`,
      );

      expect(hook).toHaveBeenCalledWith({
        phase: "apply",
        operationIndex: mutationPosition - 1,
        mutationCount: mutationPosition,
      });
      expectInventoriesIdentical(
        await readCanonicalSourceInventory(repository.repoRoot),
        baseline,
      );
      expect(await fileMode(activePath)).toBe(0o640);
      expect(
        await getKnowledgeTransactionStatus({
          repoRoot: repository.repoRoot,
          transactionId: prepared.transactionId,
        }),
      ).toMatchObject({ unfinished: false, terminalOutcome: "recovered" });
      expectRepositoryGuardPassed(repository.repoRoot);

      if (mutationPosition === 3) {
        const reapplied = await applyKnowledgeRecordTransaction({
          repoRoot: repository.repoRoot,
          transactionId: prepared.transactionId,
          dependencies: engineDependencies(),
        });
        expect(reapplied.outcome).toBe("applied");
        expect(await closeoutFileStates(repository)).toEqual({
          archive: "present",
          changelog: "present",
          active: "absent",
        });
      }
    },
    30_000,
  );

  it(
    "recovers exact canonical bytes after abrupt process death at every apply filesystem stage",
    async () => {
      const cliBundle = track(await createCliBundle());
      for (const failpoint of APPLY_CANONICAL_CRASH_POINTS) {
        const { repository, activePath, baseline, prepared } =
          await createPreparedCloseoutFixture();
        const crashed = runCli(
          cliBundle.cliPath,
          repository.repoRoot,
          ["apply", "--transaction", prepared.transactionId],
          abruptCanonicalEnvironment(failpoint),
        );
        expectAbruptCliExit(crashed);
        await expectTransactionUnfinished(
          repository.repoRoot,
          prepared.transactionId,
        );

        const recovered = runCli(cliBundle.cliPath, repository.repoRoot, [
          "recover",
          "--transaction",
          prepared.transactionId,
        ]);
        expectCliStarted(recovered);
        expect(recovered.status, `${failpoint}: ${recovered.stderr}`).toBe(0);
        expect(recovered.stderr).toBe("");
        expectInventoriesIdentical(
          await readCanonicalSourceInventory(repository.repoRoot),
          baseline,
        );
        expect(await fileMode(activePath)).toBe(0o640);
        expectRepositoryGuardPassed(repository.repoRoot);
      }
    },
    120_000,
  );

  it(
    "resumes exact recovery after abrupt process death at every restore filesystem stage",
    async () => {
      const cliBundle = track(await createCliBundle());
      for (const failpoint of RESTORE_CANONICAL_CRASH_POINTS) {
        const { repository, activePath, baseline, prepared } =
          await createPreparedCloseoutFixture();
        const interruptedApply = runCli(
          cliBundle.cliPath,
          repository.repoRoot,
          ["apply", "--transaction", prepared.transactionId],
          abruptEnvironment("apply", 3),
        );
        expectAbruptCliExit(interruptedApply);

        const interruptedRecovery = runCli(
          cliBundle.cliPath,
          repository.repoRoot,
          ["recover", "--transaction", prepared.transactionId],
          abruptCanonicalEnvironment(failpoint),
        );
        expectAbruptCliExit(interruptedRecovery);
        await expectTransactionUnfinished(
          repository.repoRoot,
          prepared.transactionId,
        );

        const recovered = runCli(cliBundle.cliPath, repository.repoRoot, [
          "recover",
          "--transaction",
          prepared.transactionId,
        ]);
        expectCliStarted(recovered);
        expect(recovered.status, `${failpoint}: ${recovered.stderr}`).toBe(0);
        expect(recovered.stderr).toBe("");
        expectInventoriesIdentical(
          await readCanonicalSourceInventory(repository.repoRoot),
          baseline,
        );
        expect(await fileMode(activePath)).toBe(0o640);
        expectRepositoryGuardPassed(repository.repoRoot);
      }
    },
    120_000,
  );

  it(
    "recovers closeout create and remove operations after every raw filesystem primitive",
    async () => {
      const cliBundle = track(await createCliBundle());
      for (const failpoint of CLOSEOUT_APPLY_PRIMITIVE_CRASH_POINTS) {
        const { repository, activePath, baseline, prepared } =
          await createPreparedCloseoutFixture();
        const crashed = runCli(
          cliBundle.cliPath,
          repository.repoRoot,
          ["apply", "--transaction", prepared.transactionId],
          abruptCanonicalPrimitiveEnvironment(failpoint),
        );
        expectAbruptCliExit(crashed);

        const recovered = runCli(cliBundle.cliPath, repository.repoRoot, [
          "recover",
          "--transaction",
          prepared.transactionId,
        ]);
        expectCliStarted(recovered);
        expect(recovered.status, `${failpoint}: ${recovered.stderr}`).toBe(0);
        expectInventoriesIdentical(
          await readCanonicalSourceInventory(repository.repoRoot),
          baseline,
        );
        expect(await fileMode(activePath)).toBe(0o640);
        expectRepositoryGuardPassed(repository.repoRoot);
      }
    },
    180_000,
  );

  it(
    "resumes closeout create and remove restoration after every raw filesystem primitive",
    async () => {
      const cliBundle = track(await createCliBundle());
      for (const failpoint of CLOSEOUT_RESTORE_PRIMITIVE_CRASH_POINTS) {
        const { repository, activePath, baseline, prepared } =
          await createPreparedCloseoutFixture();
        const interruptedApply = runCli(
          cliBundle.cliPath,
          repository.repoRoot,
          ["apply", "--transaction", prepared.transactionId],
          abruptEnvironment("apply", 3),
        );
        expectAbruptCliExit(interruptedApply);

        const interruptedRecovery = runCli(
          cliBundle.cliPath,
          repository.repoRoot,
          ["recover", "--transaction", prepared.transactionId],
          abruptCanonicalPrimitiveEnvironment(failpoint),
        );
        expectAbruptCliExit(interruptedRecovery);

        const recovered = runCli(cliBundle.cliPath, repository.repoRoot, [
          "recover",
          "--transaction",
          prepared.transactionId,
        ]);
        expectCliStarted(recovered);
        expect(recovered.status, `${failpoint}: ${recovered.stderr}`).toBe(0);
        expectInventoriesIdentical(
          await readCanonicalSourceInventory(repository.repoRoot),
          baseline,
        );
        expect(await fileMode(activePath)).toBe(0o640);
        expectRepositoryGuardPassed(repository.repoRoot);
      }
    },
    180_000,
  );

  it(
    "recovers project updates after every raw apply filesystem primitive",
    async () => {
      const cliBundle = track(await createCliBundle());
      for (const failpoint of UPDATE_APPLY_PRIMITIVE_CRASH_POINTS) {
        const { repository, activePath, baseline, prepared } =
          await createPreparedProjectUpdateFixture();
        const crashed = runCli(
          cliBundle.cliPath,
          repository.repoRoot,
          ["apply", "--transaction", prepared.transactionId],
          abruptCanonicalPrimitiveEnvironment(failpoint),
        );
        expectAbruptCliExit(crashed);

        const recovered = runCli(cliBundle.cliPath, repository.repoRoot, [
          "recover",
          "--transaction",
          prepared.transactionId,
        ]);
        expectCliStarted(recovered);
        expect(recovered.status, `${failpoint}: ${recovered.stderr}`).toBe(0);
        expectInventoriesIdentical(
          await readCanonicalSourceInventory(repository.repoRoot),
          baseline,
        );
        expect(await fileMode(activePath)).toBe(0o640);
        expectRepositoryGuardPassed(repository.repoRoot);
      }
    },
    180_000,
  );

  it(
    "resumes project-update restoration after every raw filesystem primitive",
    async () => {
      const cliBundle = track(await createCliBundle());
      for (const failpoint of UPDATE_RESTORE_PRIMITIVE_CRASH_POINTS) {
        const { repository, activePath, baseline, prepared } =
          await createPreparedProjectUpdateFixture();
        const interruptedApply = runCli(
          cliBundle.cliPath,
          repository.repoRoot,
          ["apply", "--transaction", prepared.transactionId],
          abruptEnvironment("apply", 1),
        );
        expectAbruptCliExit(interruptedApply);

        const interruptedRecovery = runCli(
          cliBundle.cliPath,
          repository.repoRoot,
          ["recover", "--transaction", prepared.transactionId],
          abruptCanonicalPrimitiveEnvironment(failpoint),
        );
        expectAbruptCliExit(interruptedRecovery);

        const recovered = runCli(cliBundle.cliPath, repository.repoRoot, [
          "recover",
          "--transaction",
          prepared.transactionId,
        ]);
        expectCliStarted(recovered);
        expect(recovered.status, `${failpoint}: ${recovered.stderr}`).toBe(0);
        expectInventoriesIdentical(
          await readCanonicalSourceInventory(repository.repoRoot),
          baseline,
        );
        expect(await fileMode(activePath)).toBe(0o640);
        expectRepositoryGuardPassed(repository.repoRoot);
      }
    },
    180_000,
  );

  it("reconstructs durable artifact ownership after a process restart", async () => {
    const cliBundle = track(await createCliBundle());
    const { repository, activePath, baseline, prepared } =
      await createPreparedProjectUpdateFixture();
    const crashed = runCli(
      cliBundle.cliPath,
      repository.repoRoot,
      ["apply", "--transaction", prepared.transactionId],
      abruptCanonicalEnvironment("apply:canonical-published:after-stage:1"),
    );
    expectAbruptCliExit(crashed);
    const interruptedJournal = await readKnowledgeTransactionJournal({
      repoRoot: repository.repoRoot,
      transactionId: prepared.transactionId,
    });
    expect(
      interruptedJournal.events.some(
        (event) =>
          event.event === "artifact-ownership-recorded" &&
          event.operationIndex === 0 &&
          event.artifactKind === "after-stage",
      ),
    ).toBe(true);

    const recovered = runCli(cliBundle.cliPath, repository.repoRoot, [
      "recover",
      "--transaction",
      prepared.transactionId,
    ]);
    expectCliStarted(recovered);
    expect(recovered.status, recovered.stderr).toBe(0);
    expectInventoriesIdentical(
      await readCanonicalSourceInventory(repository.repoRoot),
      baseline,
    );
    expect(await fileMode(activePath)).toBe(0o640);
    expectRepositoryGuardPassed(repository.repoRoot);
  });

  it("rejects a journal ownership proof whose valid-looking kind and path do not match its operation", async () => {
    const { repository, baseline, prepared } =
      await createPreparedProjectUpdateFixture();
    const lock = await acquireKnowledgeTransactionLock({
      repoRoot: repository.repoRoot,
      command: "inject malformed ownership proof",
      transactionId: prepared.transactionId,
    });
    try {
      const artifactSourcePath = canonicalTemporarySourcePath(
        repository.activeProjectPath,
        prepared.transactionId,
        0,
      );
      await appendKnowledgeTransactionJournalEvent({
        lock,
        transactionId: prepared.transactionId,
        event: {
          event: "artifact-ownership-recorded",
          operationIndex: 0,
          canonicalSourcePath: repository.activeProjectPath,
          artifactRole: "before-stage",
          artifactKind: "before-stage",
          artifactSourcePath,
          identityDev: "1",
          identityIno: "2",
          identityUid: "501",
          identityBirthtimeNs: null,
          byteLength: "0",
          sha256:
            "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          mode: 0o600,
        },
      });
    } finally {
      await releaseKnowledgeTransactionLock(lock);
    }

    await expect(
      applyKnowledgeRecordTransaction({
        repoRoot: repository.repoRoot,
        transactionId: prepared.transactionId,
        dependencies: engineDependencies(),
      }),
    ).rejects.toThrow(/ownership proof is malformed or out of scope/);
    expectInventoriesIdentical(
      await readCanonicalSourceInventory(repository.repoRoot),
      baseline,
    );
  });

  it("does not let injected canonical callbacks replace journal-owned proof authority", async () => {
    const { repository, prepared } = await createPreparedProjectUpdateFixture();
    const injectedPersist = vi.fn(() => {
      throw new Error("injected persistence must not run");
    });
    const injectedAuthorize = vi.fn(() => true);
    await expect(
      applyKnowledgeRecordTransaction({
        repoRoot: repository.repoRoot,
        transactionId: prepared.transactionId,
        dependencies: engineDependencies({
          canonicalFiles: {
            persistArtifactOwnershipProof: injectedPersist,
            authorizeArtifactCleanup: injectedAuthorize,
          },
        }),
      }),
    ).resolves.toMatchObject({ outcome: "applied" });
    expect(injectedPersist).not.toHaveBeenCalled();
    expect(injectedAuthorize).not.toHaveBeenCalled();
  });

  it("rejects stale canonical bytes before any engine mutation", async () => {
    const repository = track(
      await createKnowledgeRecordTransactionTestRepository(),
    );
    const requestPackage = track(await createProjectUpdateRequestPackage());
    const prepared = await prepareProjectUpdate(repository, requestPackage);
    const activePath = absoluteCanonicalPath(
      repository.repoRoot,
      repository.activeProjectPath,
    );
    const externallyChanged = Buffer.concat([
      await readFile(activePath),
      Buffer.from("\nExternal edit after prepare.\n", "utf8"),
    ]);
    await writeFile(activePath, externallyChanged);
    const hook = vi.fn();

    await expect(
      applyKnowledgeRecordTransaction({
        repoRoot: repository.repoRoot,
        transactionId: prepared.transactionId,
        dependencies: engineDependencies({ afterCanonicalMutation: hook }),
      }),
    ).rejects.toThrow(/Canonical source changed after preparation/);

    expect(hook).not.toHaveBeenCalled();
    expect((await readFile(activePath)).equals(externallyChanged)).toBe(true);
    expect(
      await readKnowledgeTransactionJournal({
        repoRoot: repository.repoRoot,
        transactionId: prepared.transactionId,
      }),
    ).toMatchObject({ events: [], tornFinalLine: false });
  });

  it("rejects a stale canonical mode before any engine mutation", async () => {
    const repository = track(
      await createKnowledgeRecordTransactionTestRepository(),
    );
    const requestPackage = track(await createProjectUpdateRequestPackage());
    const prepared = await prepareProjectUpdate(repository, requestPackage);
    const activePath = absoluteCanonicalPath(
      repository.repoRoot,
      repository.activeProjectPath,
    );
    await chmod(activePath, 0o600);
    const hook = vi.fn();

    await expect(
      applyKnowledgeRecordTransaction({
        repoRoot: repository.repoRoot,
        transactionId: prepared.transactionId,
        dependencies: engineDependencies({ afterCanonicalMutation: hook }),
      }),
    ).rejects.toThrow(/Canonical source changed after preparation/);

    expect(hook).not.toHaveBeenCalled();
    expect(await fileMode(activePath)).toBe(0o600);
    expect(
      await readKnowledgeTransactionJournal({
        repoRoot: repository.repoRoot,
        transactionId: prepared.transactionId,
      }),
    ).toMatchObject({ events: [], tornFinalLine: false });
  });

  it("rejects stale canonical membership before any engine mutation", async () => {
    const repository = track(
      await createKnowledgeRecordTransactionTestRepository(),
    );
    const requestPackage = track(await createProjectUpdateRequestPackage());
    const prepared = await prepareProjectUpdate(repository, requestPackage);
    const externallyInstalled = await installCorrectionTarget(repository.repoRoot);
    const hook = vi.fn();

    await expect(
      applyKnowledgeRecordTransaction({
        repoRoot: repository.repoRoot,
        transactionId: prepared.transactionId,
        dependencies: engineDependencies({ afterCanonicalMutation: hook }),
      }),
    ).rejects.toThrow(/Canonical source membership changed after this transaction was prepared/);

    expect(hook).not.toHaveBeenCalled();
    expect(
      await readFile(
        absoluteCanonicalPath(repository.repoRoot, externallyInstalled.targetPath),
        "utf8",
      ),
    ).toBe(externallyInstalled.targetSource);
    expect(
      await readKnowledgeTransactionJournal({
        repoRoot: repository.repoRoot,
        transactionId: prepared.transactionId,
      }),
    ).toMatchObject({ events: [], tornFinalLine: false });
  });

  it("rejects an expected-absent destination that appeared after prepare", async () => {
    const repository = track(
      await createKnowledgeRecordTransactionTestRepository(),
    );
    const requestPackage = track(await createLegacyImportRequestPackage());
    const prepared = await prepareKnowledgeRecordTransaction({
      repoRoot: repository.repoRoot,
      requestPath: requestPackage.requestPath,
      expectedKind: "legacy-import",
      dependencies: engineDependencies(),
    });
    const externalBytes = await readFile(
      requestPackage.contentPaths[`${KNOWLEDGE_TRANSACTION_FIXTURE_LEGACY_ID}.md`],
    );
    const destination = absoluteCanonicalPath(
      repository.repoRoot,
      LEGACY_CHANGE_PATH,
    );
    await writeFile(destination, externalBytes, { mode: 0o644 });
    const hook = vi.fn();

    await expect(
      applyKnowledgeRecordTransaction({
        repoRoot: repository.repoRoot,
        transactionId: prepared.transactionId,
        dependencies: engineDependencies({ afterCanonicalMutation: hook }),
      }),
    ).rejects.toThrow(/Canonical source membership changed|Expected-absent canonical source/);

    expect(hook).not.toHaveBeenCalled();
    expect((await readFile(destination)).equals(externalBytes)).toBe(true);
    expect(
      await readKnowledgeTransactionJournal({
        repoRoot: repository.repoRoot,
        transactionId: prepared.transactionId,
      }),
    ).toMatchObject({ events: [], tornFinalLine: false });
  });

  it("rejects a second writer while the global lock is held", async () => {
    const repository = track(
      await createKnowledgeRecordTransactionTestRepository(),
    );
    const requestPackage = track(await createProjectUpdateRequestPackage());
    const before = await readCanonicalSourceInventory(repository.repoRoot);
    const lock = await acquireKnowledgeTransactionLock({
      repoRoot: repository.repoRoot,
      command: "fixture contention",
    });
    try {
      await expect(
        prepareProjectUpdate(repository, requestPackage),
      ).rejects.toThrow(/writer lock is held by a live process/);
    } finally {
      await releaseKnowledgeTransactionLock(lock);
    }
    expectInventoriesIdentical(
      await readCanonicalSourceInventory(repository.repoRoot),
      before,
    );
  });

  it.each([1, 2, 3])(
    "explicitly recovers an abrupt CLI closeout apply after mutation %i",
    async (mutationPosition) => {
      const { repository, activePath, baseline, prepared } =
        await createPreparedCloseoutFixture();
      const cliBundle = track(await createCliBundle());

      const crashed = runCli(
        cliBundle.cliPath,
        repository.repoRoot,
        ["apply", "--transaction", prepared.transactionId],
        abruptEnvironment("apply", mutationPosition),
      );
      expectAbruptCliExit(crashed);
      await expectTransactionUnfinished(
        repository.repoRoot,
        prepared.transactionId,
      );
      expectRepositoryGuardBlocked(
        repository.repoRoot,
        prepared.transactionId,
      );

      const expectedPartialStates = [
        { archive: "present", changelog: "absent", active: "present" },
        { archive: "present", changelog: "present", active: "present" },
        { archive: "present", changelog: "present", active: "absent" },
      ];
      expect(await closeoutFileStates(repository)).toEqual(
        expectedPartialStates[mutationPosition - 1],
      );

      const recovered = runCli(cliBundle.cliPath, repository.repoRoot, [
        "recover",
        "--transaction",
        prepared.transactionId,
      ]);
      expectCliStarted(recovered);
      expect(recovered.status).toBe(0);
      expect(recovered.stderr).toBe("");
      expect(recovered.stdout).toContain(
        `Transaction ${prepared.transactionId}: recovered`,
      );
      expectInventoriesIdentical(
        await readCanonicalSourceInventory(repository.repoRoot),
        baseline,
      );
      expect(await fileMode(activePath)).toBe(0o640);
      expectRepositoryGuardPassed(repository.repoRoot);

      const repeatedRecovery = runCli(cliBundle.cliPath, repository.repoRoot, [
        "recover",
        "--transaction",
        prepared.transactionId,
      ]);
      expectCliStarted(repeatedRecovery);
      expect(repeatedRecovery.status).toBe(0);
      expect(repeatedRecovery.stderr).toBe("");
      expect(repeatedRecovery.stdout).toContain(
        `Transaction ${prepared.transactionId}: already-recovered`,
      );

      if (mutationPosition === 3) {
        const appliedAfterRecovery = await applyKnowledgeRecordTransaction({
          repoRoot: repository.repoRoot,
          transactionId: prepared.transactionId,
          dependencies: engineDependencies(),
        });
        expect(appliedAfterRecovery.outcome).toBe("applied");
        expect(await closeoutFileStates(repository)).toEqual({
          archive: "present",
          changelog: "present",
          active: "absent",
        });
        const recoverApplied = runCli(cliBundle.cliPath, repository.repoRoot, [
          "recover",
          "--transaction",
          prepared.transactionId,
        ]);
        expectCliStarted(recoverApplied);
        expect(recoverApplied.status).toBe(0);
        expect(recoverApplied.stderr).toBe("");
        expect(recoverApplied.stdout).toContain(
          `Transaction ${prepared.transactionId}: already-applied`,
        );
      }
    },
    30_000,
  );

  it.each([1, 2, 3])(
    "resumes explicit recovery after abrupt CLI termination at restoration %i",
    async (restorationPosition) => {
      const { repository, activePath, baseline, prepared } =
        await createPreparedCloseoutFixture();
      const cliBundle = track(await createCliBundle());

      const interruptedApply = runCli(
        cliBundle.cliPath,
        repository.repoRoot,
        ["apply", "--transaction", prepared.transactionId],
        abruptEnvironment("apply", 3),
      );
      expectAbruptCliExit(interruptedApply);
      await expectTransactionUnfinished(
        repository.repoRoot,
        prepared.transactionId,
      );

      const interruptedRecover = runCli(
        cliBundle.cliPath,
        repository.repoRoot,
        ["recover", "--transaction", prepared.transactionId],
        abruptEnvironment("recover", restorationPosition),
      );
      expectAbruptCliExit(interruptedRecover);
      await expectTransactionUnfinished(
        repository.repoRoot,
        prepared.transactionId,
      );
      expectRepositoryGuardBlocked(
        repository.repoRoot,
        prepared.transactionId,
      );

      const expectedPartialStates = [
        { archive: "present", changelog: "present", active: "present" },
        { archive: "present", changelog: "absent", active: "present" },
        { archive: "absent", changelog: "absent", active: "present" },
      ];
      expect(await closeoutFileStates(repository)).toEqual(
        expectedPartialStates[restorationPosition - 1],
      );
      expect(await fileMode(activePath)).toBe(0o640);

      const recovered = runCli(cliBundle.cliPath, repository.repoRoot, [
        "recover",
        "--transaction",
        prepared.transactionId,
      ]);
      expectCliStarted(recovered);
      expect(recovered.status).toBe(0);
      expect(recovered.stderr).toBe("");
      expect(recovered.stdout).toContain(
        `Transaction ${prepared.transactionId}: recovered`,
      );
      expectInventoriesIdentical(
        await readCanonicalSourceInventory(repository.repoRoot),
        baseline,
      );
      expect(await fileMode(activePath)).toBe(0o640);
      expect(
        await getKnowledgeTransactionStatus({
          repoRoot: repository.repoRoot,
          transactionId: prepared.transactionId,
        }),
      ).toMatchObject({ unfinished: false, terminalOutcome: "recovered" });
      expectRepositoryGuardPassed(repository.repoRoot);
    },
    30_000,
  );

  it(
    "does not let an older recovered receipt hide a later crashed reapply",
    async () => {
      const { repository, activePath, baseline, prepared } =
        await createPreparedCloseoutFixture();
      const cliBundle = track(await createCliBundle());

      const firstApply = runCli(
        cliBundle.cliPath,
        repository.repoRoot,
        ["apply", "--transaction", prepared.transactionId],
        abruptEnvironment("apply", 3),
      );
      expectAbruptCliExit(firstApply);
      const firstRecovery = runCli(cliBundle.cliPath, repository.repoRoot, [
        "recover",
        "--transaction",
        prepared.transactionId,
      ]);
      expectCliStarted(firstRecovery);
      expect(firstRecovery.status, firstRecovery.stderr).toBe(0);
      expect(firstRecovery.stdout).toContain(": recovered");

      const crashedReapply = runCli(
        cliBundle.cliPath,
        repository.repoRoot,
        ["apply", "--transaction", prepared.transactionId],
        abruptEnvironment("apply", 2),
      );
      expectAbruptCliExit(crashedReapply);
      await expectTransactionUnfinished(
        repository.repoRoot,
        prepared.transactionId,
      );

      const secondRecovery = runCli(cliBundle.cliPath, repository.repoRoot, [
        "recover",
        "--transaction",
        prepared.transactionId,
      ]);
      expectCliStarted(secondRecovery);
      expect(secondRecovery.status, secondRecovery.stderr).toBe(0);
      expect(secondRecovery.stdout).toContain(": recovered");
      expectInventoriesIdentical(
        await readCanonicalSourceInventory(repository.repoRoot),
        baseline,
      );
      expect(await fileMode(activePath)).toBe(0o640);
      expectRepositoryGuardPassed(repository.repoRoot);
    },
    30_000,
  );

  it("applies closeout in archive, Changelog, then active-removal order and records that order in the journal", async () => {
    const repository = track(
      await createKnowledgeRecordTransactionTestRepository(),
    );
    const requestPackage = track(await createCloseoutRequestPackage());
    const prepared = await prepareKnowledgeRecordTransaction({
      repoRoot: repository.repoRoot,
      requestPath: requestPackage.requestPath,
      expectedKind: "closeout",
      dependencies: engineDependencies(),
    });
    const observations: Array<{
      mutationCount: number;
      operationIndex: number;
      archive: string;
      changelog: string;
      active: string;
    }> = [];

    const applied = await applyKnowledgeRecordTransaction({
      repoRoot: repository.repoRoot,
      transactionId: prepared.transactionId,
      dependencies: engineDependencies({
        afterCanonicalMutation: async (event) => {
          if (event.phase !== "apply") return;
          observations.push({
            mutationCount: event.mutationCount,
            operationIndex: event.operationIndex,
            archive: (
              await readCanonicalFileState(
                repository.repoRoot,
                ARCHIVED_PROJECT_PATH,
              )
            ).state,
            changelog: (
              await readCanonicalFileState(
                repository.repoRoot,
                ACCEPTED_CHANGE_PATH,
              )
            ).state,
            active: (
              await readCanonicalFileState(
                repository.repoRoot,
                repository.activeProjectPath,
              )
            ).state,
          });
        },
      }),
    });
    expect(applied.outcome).toBe("applied");
    expect(observations).toEqual([
      {
        mutationCount: 1,
        operationIndex: 0,
        archive: "present",
        changelog: "absent",
        active: "present",
      },
      {
        mutationCount: 2,
        operationIndex: 1,
        archive: "present",
        changelog: "present",
        active: "present",
      },
      {
        mutationCount: 3,
        operationIndex: 2,
        archive: "present",
        changelog: "present",
        active: "absent",
      },
    ]);

    const transaction = await openVerifiedKnowledgeTransaction({
      repoRoot: repository.repoRoot,
      transactionId: prepared.transactionId,
    });
    expect(
      transaction.operations.map(({ action, path: sourcePath }) => ({
        action,
        sourcePath,
      })),
    ).toEqual([
      { action: "create", sourcePath: ARCHIVED_PROJECT_PATH },
      { action: "create", sourcePath: ACCEPTED_CHANGE_PATH },
      { action: "remove", sourcePath: repository.activeProjectPath },
    ]);

    const journal = await readKnowledgeTransactionJournal({
      repoRoot: repository.repoRoot,
      transactionId: prepared.transactionId,
    });
    expect(
      journal.events
        .filter((entry) => entry.event !== "artifact-ownership-recorded")
        .map(({ event, operationIndex }) => ({
          event,
          operationIndex,
        })),
    ).toEqual([
      { event: "apply-started", operationIndex: undefined },
      { event: "mutation-intent", operationIndex: 0 },
      { event: "mutation-completed", operationIndex: 0 },
      { event: "mutation-intent", operationIndex: 1 },
      { event: "mutation-completed", operationIndex: 1 },
      { event: "mutation-intent", operationIndex: 2 },
      { event: "mutation-completed", operationIndex: 2 },
      { event: "apply-completed", operationIndex: undefined },
    ]);
    expect(
      journal.events
        .filter((entry) => entry.event === "artifact-ownership-recorded")
        .map((entry) => entry.operationIndex),
    ).toEqual([0, 0, 1, 1, 2, 2]);

    const expectedArchive = await readFile(
      requestPackage.contentPaths[`${KNOWLEDGE_TRANSACTION_FIXTURE_PROJECT_ID}.md`],
    );
    const expectedChangelog = await readFile(
      requestPackage.contentPaths[`${KNOWLEDGE_TRANSACTION_FIXTURE_CHANGE_ID}.md`],
    );
    const archivePath = absoluteCanonicalPath(
      repository.repoRoot,
      ARCHIVED_PROJECT_PATH,
    );
    const changelogPath = absoluteCanonicalPath(
      repository.repoRoot,
      ACCEPTED_CHANGE_PATH,
    );
    expect((await readFile(archivePath)).equals(expectedArchive)).toBe(true);
    expect((await readFile(changelogPath)).equals(expectedChangelog)).toBe(true);
    expect(await fileMode(archivePath)).toBe(0o644);
    expect(await fileMode(changelogPath)).toBe(0o644);
  });

  it("prepares project-create through the CLI without exposing private request content", async () => {
    const repository = track(
      await createKnowledgeRecordTransactionTestRepository(),
    );
    await installProjectCreateBaseline(repository.repoRoot);
    const requestPackage = track(await createProjectCreateRequestPackage());
    const cliBundle = track(await createCliBundle());

    const prepared = runCli(cliBundle.cliPath, repository.repoRoot, [
      "prepare",
      "project-create",
      "--request",
      requestPackage.requestPath,
    ]);
    expectCliStarted(prepared);
    expect(prepared.status, prepared.stderr).toBe(0);
    expect(prepared.stderr).toBe("");
    expect(prepared.stdout).toMatch(
      /^Prepared project-create transaction kr-[A-Za-z0-9-]+ with 1 operation\(s\)\.\n$/,
    );
    expect(prepared.stdout).not.toContain(requestPackage.packageRoot);
    expect(prepared.stdout).not.toContain(requestPackage.requestPath);
    expect(prepared.stdout).not.toContain("Gallery guarded project-create fixture");
  });

  it("rejects unsupported CLI arguments and keeps request paths and record contents out of CLI output", async () => {
    const repository = track(
      await createKnowledgeRecordTransactionTestRepository(),
    );
    const requestPackage = track(await createProjectUpdateRequestPackage());
    const cliBundle = track(await createCliBundle());
    const privateRecordPhrase =
      "Append a source-backed project update without rewriting prior history.";

    const prepared = runCli(cliBundle.cliPath, repository.repoRoot, [
      "prepare",
      "project-update",
      "--request",
      requestPackage.requestPath,
    ]);
    expectCliStarted(prepared);
    expect(prepared.status, prepared.stderr).toBe(0);
    expect(prepared.stderr).toBe("");
    expect(prepared.stdout).toMatch(
      /^Prepared project-update transaction kr-[A-Za-z0-9-]+ with 1 operation\(s\)\.\n$/,
    );
    expect(prepared.stdout).not.toContain(requestPackage.packageRoot);
    expect(prepared.stdout).not.toContain(requestPackage.requestPath);
    expect(prepared.stdout).not.toContain(privateRecordPhrase);

    const status = runCli(cliBundle.cliPath, repository.repoRoot, ["status"]);
    expectCliStarted(status);
    expect(status.status).toBe(0);
    expect(status.stderr).toBe("");
    expect(status.stdout).not.toContain(requestPackage.packageRoot);
    expect(status.stdout).not.toContain(requestPackage.requestPath);
    expect(status.stdout).not.toContain(privateRecordPhrase);

    const privateArgument = "do-not-echo-this-private-argument";
    const rejected = runCli(cliBundle.cliPath, repository.repoRoot, [
      "prepare",
      "project-update",
      "--request",
      requestPackage.requestPath,
      "--unsupported",
      privateArgument,
    ]);
    expectCliStarted(rejected);
    expect(rejected.status).toBe(1);
    expect(rejected.stdout).toBe("");
    expect(rejected.stderr).toContain("Unsupported command arguments.");
    expect(rejected.stderr).not.toContain(privateArgument);
    expect(rejected.stderr).not.toContain(requestPackage.requestPath);

    const unauthorizedOverride = runCli(
      cliBundle.cliPath,
      repository.repoRoot,
      ["status"],
      { NODE_ENV: "production", CHRONICLE_KNOWLEDGE_TEST_MODE: "0" },
    );
    expectCliStarted(unauthorizedOverride);
    expect(unauthorizedOverride.status).toBe(1);
    expect(unauthorizedOverride.stdout).toBe("");
    expect(unauthorizedOverride.stderr).toContain(
      "repository override is test-only",
    );
    expect(unauthorizedOverride.stderr).not.toContain(repository.repoRoot);

    const productionEnvironment: NodeJS.ProcessEnv = {
      ...process.env,
      NODE_ENV: "production",
      CHRONICLE_KNOWLEDGE_TEST_MODE: "0",
      CHRONICLE_KNOWLEDGE_TEST_CRASH_AFTER_CANONICAL_PRIMITIVE:
        "apply:create:partial-created:after-stage:1",
    };
    delete productionEnvironment.CHRONICLE_KNOWLEDGE_TEST_REPO_ROOT;
    const unauthorizedPrimitiveFailpoint = spawnSync(
      process.execPath,
      [cliBundle.cliPath, "status"],
      {
        cwd: PROJECT_ROOT,
        env: productionEnvironment,
        encoding: "utf8",
        maxBuffer: 1024 * 1024,
        timeout: 30_000,
      },
    );
    expectCliStarted(unauthorizedPrimitiveFailpoint);
    expect(unauthorizedPrimitiveFailpoint.status).toBe(1);
    expect(unauthorizedPrimitiveFailpoint.stdout).toBe("");
    expect(unauthorizedPrimitiveFailpoint.stderr).toContain(
      "Invalid or unauthorized Knowledge record crash failpoint.",
    );
    expect(unauthorizedPrimitiveFailpoint.stderr).not.toContain(PROJECT_ROOT);
    expect(unauthorizedPrimitiveFailpoint.stderr).not.toContain(
      repository.repoRoot,
    );
  }, 30_000);
});
