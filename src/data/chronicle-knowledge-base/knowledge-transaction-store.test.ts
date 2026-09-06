import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  appendFile,
  chmod,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  readdir,
  rename,
  rm,
  stat,
  symlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

import {
  canonicalKnowledgeControlJson,
  knowledgeControlMetadataWithHash,
} from "../../../scripts/knowledge-record-control-contract.mjs";

import {
  MAX_TRANSACTION_OPERATIONS,
  MAX_TRANSACTION_PAYLOAD_BYTES,
  acquireKnowledgeCertificationLease,
  acquireKnowledgeScopedWriterLock,
  acquireKnowledgeTransactionCommitLock,
  acquireKnowledgeTransactionLock,
  attachKnowledgeCertificationLeaseProtectedProcess,
  appendKnowledgeTransactionJournalEvent,
  clearKnowledgeTransactionUnfinished,
  createPreparedKnowledgeTransaction,
  generateKnowledgeTransactionId,
  getKnowledgeTransactionStatus,
  listUnfinishedKnowledgeTransactionIds,
  markKnowledgeTransactionUnfinished,
  openVerifiedKnowledgeTransaction,
  readKnowledgeTransactionJournal,
  releaseKnowledgeCertificationLease,
  releaseKnowledgeScopedWriterLock,
  releaseKnowledgeTransactionLock,
  resolveKnowledgeTransactionPaths,
  truncateTornKnowledgeTransactionJournal,
  writeKnowledgeTransactionTerminalReceipt,
  type KnowledgeTransactionOperationInput,
  type KnowledgeTransactionSnapshot,
  type TransactionStoreDependencies,
  type TransactionStoreMutationEvent,
} from "../../../scripts/knowledge-records/transaction-store";
import { inspectKnowledgeTransactionGuard } from "../../../scripts/knowledge-record-transaction-guard.mjs";

const roots: string[] = [];
const NOW = new Date("2026-08-01T12:34:56.789Z");
const REQUEST_HASH = createHash("sha256").update("fixture request").digest("hex");
const VALIDATION_HASH = createHash("sha256").update("fixture validation").digest("hex");
const EXCLUSIVE_FILE_EVENT_KINDS = [
  "temporary-file-synced",
  "file-published-unsynced",
  "file-published",
  "temporary-file-removed",
] as const;
const REPLACE_FILE_EVENT_KINDS = [
  "temporary-file-synced",
  "file-published-unsynced",
  "file-published",
] as const;
const DIRECTORY_PUBLICATION_EVENT_KINDS = [
  "directory-publication-ready",
  "directory-renamed-unsynced",
  "directory-published",
] as const;
const DIRECTORY_REMOVAL_EVENT_KINDS = [
  "directory-quarantine-ready",
  "directory-renamed-unsynced",
  "directory-quarantined",
  "directory-removal-started",
  "file-removal-ready",
  "file-unlinked-unsynced",
  "file-removed",
  "directory-unlink-ready",
  "directory-unlinked-unsynced",
  "directory-removed",
] as const;

function digest(bytes: Buffer | string) {
  return createHash("sha256").update(bytes).digest("hex");
}

function fixtureOwnerToken(lockId: string, pid: number, hostname = "fixture-host") {
  return `${lockId}-${pid}-${digest(hostname).slice(0, 16)}`;
}

async function mode(target: string) {
  return (await stat(target)).mode & 0o777;
}

async function exists(target: string) {
  return Boolean(
    await lstat(target).catch((error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") return null;
      throw error;
    }),
  );
}

function failAtMutation(
  scope: TransactionStoreMutationEvent["scope"],
  target: number,
) {
  let seen = 0;
  return (event: TransactionStoreMutationEvent) => {
    if (event.scope !== scope) return;
    seen += 1;
    if (seen === target) throw new Error(`interrupt ${scope} ${target}`);
  };
}

async function createGitFixture() {
  const temporaryRoot = await realpath(os.tmpdir());
  const root = await mkdtemp(path.join(temporaryRoot, "chronicle-knowledge-store-"));
  roots.push(root);
  execFileSync("git", ["init", "-q"], { cwd: root });
  return root;
}

function dependencies(overrides: Partial<TransactionStoreDependencies> = {}) {
  return {
    now: () => NOW,
    hostname: () => "fixture-host",
    pid: 42_424,
    isPidAlive: () => true,
    ...overrides,
  } satisfies TransactionStoreDependencies;
}

function updateFixture(secret = "private-before-bytes") {
  const beforeBytes = Buffer.from(secret, "utf8");
  const afterBytes = Buffer.from("private-after-bytes", "utf8");
  const sourcePath = "docs/current-work/active/community-gallery/CG-WORK-001.md";
  const snapshot: KnowledgeTransactionSnapshot = {
    validationAsOf: "2026-08-01",
    requestSha256: REQUEST_HASH,
    packageSha256: null,
    sources: [
      {
        path: sourcePath,
        state: "present",
        sha256: digest(beforeBytes),
        mode: 0o644,
      },
    ],
  };
  const operations: KnowledgeTransactionOperationInput[] = [
    { action: "update", path: sourcePath, beforeBytes, afterBytes },
  ];
  return { beforeBytes, afterBytes, sourcePath, snapshot, operations };
}

async function prepareFixture(
  root: string,
  options: { secret?: string; dependencies?: TransactionStoreDependencies } = {},
) {
  const injected = options.dependencies ?? dependencies();
  const transactionId = generateKnowledgeTransactionId(injected);
  const lock = await acquireKnowledgeTransactionLock({
    repoRoot: root,
    command: "prepare project-update",
    transactionId,
    dependencies: injected,
  });
  const fixture = updateFixture(options.secret);
  const transaction = await createPreparedKnowledgeTransaction({
    lock,
    transactionId,
    kind: "project-update",
    snapshot: fixture.snapshot,
    operations: fixture.operations,
    dependencies: injected,
  });
  return { ...fixture, injected, transactionId, lock, transaction };
}

async function prepareScopedIssueTransaction(
  root: string,
  issueId: string,
  injected: TransactionStoreDependencies = dependencies(),
) {
  const beforeBytes = Buffer.from(`before-${issueId}`, "utf8");
  const afterBytes = Buffer.from(`after-${issueId}`, "utf8");
  const sourcePath =
    `docs/architecture-knowledge/issues/community-gallery/${issueId}.md`;
  const transactionId = generateKnowledgeTransactionId(injected);
  const lock = await acquireKnowledgeTransactionLock({
    repoRoot: root,
    command: "prepare issue-update",
    transactionId,
    dependencies: injected,
  });
  await createPreparedKnowledgeTransaction({
    lock,
    transactionId,
    kind: "issue-update",
    snapshot: {
      validationAsOf: "2026-08-01",
      requestSha256: REQUEST_HASH,
      packageSha256: null,
      sources: [
        {
          path: sourcePath,
          state: "present",
          sha256: digest(beforeBytes),
          mode: 0o644,
        },
      ],
    },
    operations: [
      { action: "update", path: sourcePath, beforeBytes, afterBytes },
    ],
    dependencies: injected,
  });
  await releaseKnowledgeTransactionLock(lock);
  return transactionId;
}

async function prepareScopedProjectTransaction(
  root: string,
  sourcePath: string,
  injected: TransactionStoreDependencies = dependencies(),
) {
  const beforeBytes = Buffer.from(`before-${sourcePath}`, "utf8");
  const afterBytes = Buffer.from(`after-${sourcePath}`, "utf8");
  const transactionId = generateKnowledgeTransactionId(injected);
  const lock = await acquireKnowledgeTransactionLock({
    repoRoot: root,
    command: "prepare project-update",
    transactionId,
    dependencies: injected,
  });
  await createPreparedKnowledgeTransaction({
    lock,
    transactionId,
    kind: "project-update",
    snapshot: {
      validationAsOf: "2026-08-01",
      requestSha256: REQUEST_HASH,
      packageSha256: null,
      sources: [
        {
          path: sourcePath,
          state: "present",
          sha256: digest(beforeBytes),
          mode: 0o644,
        },
      ],
    },
    operations: [
      { action: "update", path: sourcePath, beforeBytes, afterBytes },
    ],
    dependencies: injected,
  });
  await releaseKnowledgeTransactionLock(lock);
  return transactionId;
}

type KilledStoreScenario =
  | "writer-release"
  | "scoped-release"
  | "certification-release"
  | "marker-publish"
  | "marker-clear"
  | "journal-truncate";

async function runKilledStoreScenario({
  root,
  scenario,
  scope,
  kind,
  occurrence = 1,
}: {
  root: string;
  scenario: KilledStoreScenario;
  scope: TransactionStoreMutationEvent["scope"];
  kind: TransactionStoreMutationEvent["kind"];
  occurrence?: number;
}) {
  const scriptPath = path.join(root, `killed-store-${scenario}-${kind}.ts`);
  const eventPath = path.join(root, `killed-store-${scenario}-${kind}.jsonl`);
  const identityPath = path.join(root, `killed-store-${scenario}-${kind}.id`);
  const moduleUrl = pathToFileURL(
    path.resolve(process.cwd(), "scripts/knowledge-records/transaction-store.ts"),
  ).href;
  const source = `
import { appendFileSync, closeSync, fsyncSync, openSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  acquireKnowledgeCertificationLease,
  acquireKnowledgeScopedWriterLock,
  acquireKnowledgeTransactionLock,
  appendKnowledgeTransactionJournalEvent,
  clearKnowledgeTransactionUnfinished,
  createPreparedKnowledgeTransaction,
  generateKnowledgeTransactionId,
  markKnowledgeTransactionUnfinished,
  releaseKnowledgeCertificationLease,
  releaseKnowledgeScopedWriterLock,
  releaseKnowledgeTransactionLock,
  truncateTornKnowledgeTransactionJournal,
  writeKnowledgeTransactionTerminalReceipt,
} from ${JSON.stringify(moduleUrl)};

const root = ${JSON.stringify(root)};
const eventPath = ${JSON.stringify(eventPath)};
const identityPath = ${JSON.stringify(identityPath)};
const expectedScope = ${JSON.stringify(scope)};
const expectedKind = ${JSON.stringify(kind)};
const expectedOccurrence = ${occurrence};
let armed = false;
let matching = 0;
const dependencies = {
  now: () => new Date("2026-08-01T12:34:56.789Z"),
  hostname: () => "fixture-host",
  pid: process.pid,
  isPidAlive: (pid) => pid === process.pid,
  afterStoreMutation(event) {
    if (!armed || event.scope !== expectedScope) return;
    appendFileSync(eventPath, JSON.stringify(event) + "\\n", { mode: 0o600 });
    if (event.kind === expectedKind) {
      matching += 1;
      if (matching === expectedOccurrence) process.kill(process.pid, "SIGKILL");
    }
  },
};
const digest = (value) => createHash("sha256").update(value).digest("hex");
async function prepare(recoveryCapable = false) {
  const beforeBytes = Buffer.from("private-before-bytes");
  const afterBytes = Buffer.from("private-after-bytes");
  const transactionId = generateKnowledgeTransactionId(dependencies);
  const sourcePath = "docs/current-work/active/community-gallery/CG-WORK-001.md";
  const lock = await acquireKnowledgeTransactionLock({
    repoRoot: root,
    command: "prepare project-update",
    transactionId,
    recoveryCapable,
    dependencies,
  });
  await createPreparedKnowledgeTransaction({
    lock,
    transactionId,
    kind: "project-update",
    snapshot: {
      validationAsOf: "2026-08-01",
      requestSha256: digest("fixture request"),
      packageSha256: null,
      sources: [{ path: sourcePath, state: "present", sha256: digest(beforeBytes), mode: 0o644 }],
    },
    operations: [{ action: "update", path: sourcePath, beforeBytes, afterBytes }],
    dependencies,
  });
  writeFileSync(identityPath, transactionId, { mode: 0o600 });
  return { lock, transactionId };
}
async function prepareIssue() {
  const beforeBytes = Buffer.from("private-issue-before-bytes");
  const afterBytes = Buffer.from("private-issue-after-bytes");
  const transactionId = generateKnowledgeTransactionId(dependencies);
  const sourcePath = "docs/architecture-knowledge/issues/community-gallery/CG-ISSUE-001.md";
  const lock = await acquireKnowledgeTransactionLock({
    repoRoot: root,
    command: "prepare issue-update",
    transactionId,
    dependencies,
  });
  await createPreparedKnowledgeTransaction({
    lock,
    transactionId,
    kind: "issue-update",
    snapshot: {
      validationAsOf: "2026-08-01",
      requestSha256: digest("fixture request"),
      packageSha256: null,
      sources: [{ path: sourcePath, state: "present", sha256: digest(beforeBytes), mode: 0o644 }],
    },
    operations: [{ action: "update", path: sourcePath, beforeBytes, afterBytes }],
    dependencies,
  });
  await releaseKnowledgeTransactionLock(lock);
  return transactionId;
}

switch (${JSON.stringify(scenario)}) {
  case "writer-release": {
    const lock = await acquireKnowledgeTransactionLock({
      repoRoot: root,
      command: "prepare correction",
      dependencies,
    });
    armed = true;
    await releaseKnowledgeTransactionLock(lock);
    break;
  }
  case "scoped-release": {
    const transactionId = await prepareIssue();
    const lock = await acquireKnowledgeScopedWriterLock({
      repoRoot: root,
      command: "apply issue-update",
      transactionId,
      dependencies,
    });
    armed = true;
    await releaseKnowledgeScopedWriterLock(lock);
    break;
  }
  case "certification-release": {
    const lease = await acquireKnowledgeCertificationLease({
      repoRoot: root,
      command: "knowledge check",
      dependencies,
    });
    armed = true;
    await releaseKnowledgeCertificationLease(lease, { dependencies });
    break;
  }
  case "marker-publish": {
    const prepared = await prepare();
    armed = true;
    await markKnowledgeTransactionUnfinished({
      lock: prepared.lock,
      transactionId: prepared.transactionId,
      phase: "apply",
      dependencies,
    });
    break;
  }
  case "marker-clear": {
    const prepared = await prepare();
    await markKnowledgeTransactionUnfinished({
      lock: prepared.lock,
      transactionId: prepared.transactionId,
      phase: "recover",
      dependencies,
    });
    await appendKnowledgeTransactionJournalEvent({
      lock: prepared.lock,
      transactionId: prepared.transactionId,
      event: { event: "recovery-started" },
      dependencies,
    });
    await appendKnowledgeTransactionJournalEvent({
      lock: prepared.lock,
      transactionId: prepared.transactionId,
      event: { event: "recovery-completed" },
      dependencies,
    });
    await writeKnowledgeTransactionTerminalReceipt({
      lock: prepared.lock,
      transactionId: prepared.transactionId,
      outcome: "recovered",
      validationSha256: digest("fixture validation"),
      dependencies,
    });
    armed = true;
    await clearKnowledgeTransactionUnfinished({
      lock: prepared.lock,
      transactionId: prepared.transactionId,
      expectedOutcome: "recovered",
    });
    break;
  }
  case "journal-truncate": {
    const prepared = await prepare(true);
    await appendKnowledgeTransactionJournalEvent({
      lock: prepared.lock,
      transactionId: prepared.transactionId,
      event: { event: "apply-started" },
      dependencies,
    });
    const journalPath = prepared.lock.transactionRoot + "/" + prepared.transactionId + "/journal.jsonl";
    const fd = openSync(journalPath, "a");
    appendFileSync(fd, '{"partial"');
    fsyncSync(fd);
    closeSync(fd);
    armed = true;
    await truncateTornKnowledgeTransactionJournal({
      lock: prepared.lock,
      transactionId: prepared.transactionId,
      dependencies,
    });
    break;
  }
}
`;
  await writeFile(scriptPath, source, { mode: 0o600 });
  const result = spawnSync(
    path.join(process.cwd(), "node_modules", ".bin", "vite-node"),
    [scriptPath],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      timeout: 15_000,
    },
  );
  if (result.signal !== "SIGKILL") {
    throw new Error(
      `Killed-child scenario ${scenario}/${kind} did not reach its failpoint. status=${result.status} signal=${result.signal}\n${result.stderr}`,
    );
  }
  const events = (await readFile(eventPath, "utf8"))
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as TransactionStoreMutationEvent);
  const transactionId = await readFile(identityPath, "utf8").catch(
    (error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") return null;
      throw error;
    },
  );
  return { events, transactionId: transactionId?.trim() ?? null };
}

afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

describe("knowledge transaction private store", () => {
  it("stores exact buffers privately while keeping record contents out of metadata and status", async () => {
    const root = await createGitFixture();
    const prepared = await prepareFixture(root, { secret: "do-not-leak-this-record" });
    const paths = await resolveKnowledgeTransactionPaths(root);
    const transactionDirectory = prepared.transaction.transactionDirectory;

    expect(await mode(paths.transactionRoot)).toBe(0o700);
    expect(await mode(prepared.lock.lockDirectory)).toBe(0o700);
    expect(await mode(path.join(prepared.lock.lockDirectory, "lock.json"))).toBe(0o600);
    expect(await mode(transactionDirectory)).toBe(0o700);
    expect(await mode(path.join(transactionDirectory, "payloads"))).toBe(0o700);
    expect(await mode(path.join(transactionDirectory, "terminal-receipts"))).toBe(0o700);
    expect(await mode(path.join(transactionDirectory, "manifest.json"))).toBe(0o600);
    expect(await mode(path.join(transactionDirectory, "journal.jsonl"))).toBe(0o600);
    expect(
      await mode(path.join(transactionDirectory, "payloads", "operation-0000.before.bin")),
    ).toBe(0o600);

    const manifestText = await readFile(
      path.join(transactionDirectory, "manifest.json"),
      "utf8",
    );
    expect(manifestText).not.toContain("do-not-leak-this-record");
    const statusText = JSON.stringify(
      await getKnowledgeTransactionStatus({
        repoRoot: root,
        transactionId: prepared.transactionId,
      }),
    );
    expect(statusText).not.toContain("do-not-leak-this-record");

    const reopened = await openVerifiedKnowledgeTransaction({
      repoRoot: root,
      transactionId: prepared.transactionId,
    });
    expect(reopened.operations[0].beforeBytes).toEqual(prepared.beforeBytes);
    expect(reopened.operations[0].afterBytes).toEqual(prepared.afterBytes);
    expect(reopened.snapshot).toEqual(prepared.snapshot);
    await releaseKnowledgeTransactionLock(prepared.lock);
  });

  it("stores and reopens a protected project-create transaction", async () => {
    const root = await createGitFixture();
    const injected = dependencies();
    const transactionId = generateKnowledgeTransactionId(injected);
    const lock = await acquireKnowledgeTransactionLock({
      repoRoot: root,
      command: "prepare project-create",
      transactionId,
      dependencies: injected,
    });
    const sourcePath =
      "docs/current-work/active/community-gallery/CG-WORK-002.md";
    const afterBytes = Buffer.from("private project-create bytes", "utf8");
    const snapshot: KnowledgeTransactionSnapshot = {
      validationAsOf: "2026-08-01",
      requestSha256: REQUEST_HASH,
      packageSha256: null,
      sources: [{ path: sourcePath, state: "absent" }],
    };

    await createPreparedKnowledgeTransaction({
      lock,
      transactionId,
      kind: "project-create",
      snapshot,
      operations: [{ action: "create", path: sourcePath, afterBytes }],
      dependencies: injected,
    });
    await releaseKnowledgeTransactionLock(lock);

    const reopened = await openVerifiedKnowledgeTransaction({
      repoRoot: root,
      transactionId,
    });
    expect(reopened.kind).toBe("project-create");
    expect(reopened.snapshot).toEqual(snapshot);
    expect(reopened.operations).toHaveLength(1);
    expect(reopened.operations[0]).toMatchObject({
      action: "create",
      path: sourcePath,
      afterBytes,
    });
    expect(reopened.operations[0].beforeBytes).toBeUndefined();
  });

  it("rejects traversal identities, operation paths, and overwriting an existing transaction", async () => {
    const root = await createGitFixture();
    await expect(
      openVerifiedKnowledgeTransaction({ repoRoot: root, transactionId: "../../escape" }),
    ).rejects.toThrow(/Invalid transaction ID|Transaction ID/);

    const injected = dependencies();
    const transactionId = generateKnowledgeTransactionId(injected);
    const lock = await acquireKnowledgeTransactionLock({
      repoRoot: root,
      command: "prepare project-update",
      transactionId,
      dependencies: injected,
    });
    const bytes = Buffer.from("before");
    const unsafeSnapshot: KnowledgeTransactionSnapshot = {
      validationAsOf: "2026-08-01",
      requestSha256: REQUEST_HASH,
      packageSha256: null,
      sources: [
        { path: "../outside.md", state: "present", sha256: digest(bytes), mode: 0o644 },
      ],
    };
    await expect(
      createPreparedKnowledgeTransaction({
        lock,
        transactionId,
        kind: "project-update",
        snapshot: unsafeSnapshot,
        operations: [
          { action: "update", path: "../outside.md", beforeBytes: bytes, afterBytes: bytes },
        ],
      }),
    ).rejects.toThrow(/repository-relative path/);

    const fixture = updateFixture();
    await createPreparedKnowledgeTransaction({
      lock,
      transactionId,
      kind: "project-update",
      snapshot: fixture.snapshot,
      operations: fixture.operations,
    });
    await expect(
      createPreparedKnowledgeTransaction({
        lock,
        transactionId,
        kind: "project-update",
        snapshot: fixture.snapshot,
        operations: fixture.operations,
      }),
    ).rejects.toMatchObject({ code: "EEXIST" });
    await releaseKnowledgeTransactionLock(lock);
  });

  it("enforces one live writer and only reclaims a proven dead same-host lock through recovery", async () => {
    const liveRoot = await createGitFixture();
    const liveDependencies = dependencies({ isPidAlive: () => true });
    const liveId = generateKnowledgeTransactionId(liveDependencies);
    const liveLock = await acquireKnowledgeTransactionLock({
      repoRoot: liveRoot,
      command: "prepare correction",
      transactionId: liveId,
      dependencies: liveDependencies,
    });
    await expect(
      acquireKnowledgeTransactionLock({
        repoRoot: liveRoot,
        command: "prepare correction",
        transactionId: liveId,
        recoveryCapable: true,
        dependencies: liveDependencies,
      }),
    ).rejects.toThrow(/live process/);
    await releaseKnowledgeTransactionLock(liveLock);

    const deadRoot = await createGitFixture();
    const originalDependencies = dependencies({ isPidAlive: () => true });
    const deadId = generateKnowledgeTransactionId(originalDependencies);
    await acquireKnowledgeTransactionLock({
      repoRoot: deadRoot,
      command: "prepare closeout",
      transactionId: deadId,
      dependencies: originalDependencies,
    });
    const observerDependencies = dependencies({ isPidAlive: () => false, pid: 55_555 });
    await expect(
      acquireKnowledgeTransactionLock({
        repoRoot: deadRoot,
        command: "apply",
        transactionId: deadId,
        dependencies: observerDependencies,
      }),
    ).rejects.toThrow(/requires explicit recovery/);
    const recoveredLock = await acquireKnowledgeTransactionLock({
      repoRoot: deadRoot,
      command: "recover",
      transactionId: deadId,
      recoveryCapable: true,
      dependencies: observerDependencies,
    });
    await releaseKnowledgeTransactionLock(recoveredLock);
  });

  it("never reclaims a lock from another host", async () => {
    const root = await createGitFixture();
    const original = dependencies({ hostname: () => "host-a", isPidAlive: () => false });
    const transactionId = generateKnowledgeTransactionId(original);
    await acquireKnowledgeTransactionLock({
      repoRoot: root,
      command: "prepare legacy-import",
      transactionId,
      dependencies: original,
    });
    await expect(
      acquireKnowledgeTransactionLock({
        repoRoot: root,
        command: "recover",
        transactionId,
        recoveryCapable: true,
        dependencies: dependencies({ hostname: () => "host-b", isPidAlive: () => false }),
      }),
    ).rejects.toThrow(/another or unknown host/);
  });

  it("fails closed instead of replacing a partial final writer-lock directory", async () => {
    const root = await createGitFixture();
    const paths = await resolveKnowledgeTransactionPaths(root, {
      createTransactionRoot: true,
    });
    await mkdir(paths.lockDirectory, { mode: 0o700 });
    await expect(
      acquireKnowledgeTransactionLock({
        repoRoot: root,
        command: "recover",
        recoveryCapable: true,
        dependencies: dependencies({ isPidAlive: () => false }),
      }),
    ).rejects.toThrow(/cannot be proven safe/);
    expect(await readdir(paths.lockDirectory)).toEqual([]);
  });

  it("does not replace a writer-lock target introduced at the pre-rename boundary", async () => {
    const root = await createGitFixture();
    const paths = await resolveKnowledgeTransactionPaths(root, {
      createTransactionRoot: true,
    });
    let outsideIdentity: { dev: number; ino: number } | null = null;
    await expect(
      acquireKnowledgeTransactionLock({
        repoRoot: root,
        command: "prepare correction",
        dependencies: dependencies({
          afterStoreMutation: async (event) => {
            if (event.scope !== "writer-lock" || event.kind !== "directory-publication-ready") {
              return;
            }
            await mkdir(paths.lockDirectory, { mode: 0o700 });
            const info = await stat(paths.lockDirectory);
            outsideIdentity = { dev: info.dev, ino: info.ino };
          },
        }),
      }),
    ).rejects.toThrow(/cannot be proven safe|inventory is malformed/);
    const finalIdentity = await stat(paths.lockDirectory);
    expect({ dev: finalIdentity.dev, ino: finalIdentity.ino }).toEqual(outsideIdentity);
    expect(await readdir(paths.lockDirectory)).toEqual([]);
  });

  it("rejects a same-byte replacement of an exclusive pending file and preserves the outside inode", async () => {
    const root = await createGitFixture();
    const prepared = await prepareFixture(root);
    let outsidePath = "";
    let outsideIdentity: { dev: number; ino: number } | null = null;
    let outsideBytes = Buffer.alloc(0);

    await expect(
      markKnowledgeTransactionUnfinished({
        lock: prepared.lock,
        transactionId: prepared.transactionId,
        phase: "apply",
        dependencies: dependencies({
          afterStoreMutation: async (event) => {
            if (
              event.scope !== "transaction-control" ||
              event.kind !== "temporary-file-synced"
            ) {
              return;
            }
            const names = await readdir(prepared.transaction.transactionDirectory);
            const pendingName = names.find((name) =>
              name.startsWith(".pending-create-"),
            );
            if (!pendingName) throw new Error("exclusive pending file was not found");
            outsidePath = path.join(
              prepared.transaction.transactionDirectory,
              pendingName,
            );
            outsideBytes = await readFile(outsidePath);
            const replacementPath = `${outsidePath}.outside`;
            await writeFile(replacementPath, outsideBytes, { mode: 0o600 });
            const info = await stat(replacementPath);
            outsideIdentity = { dev: info.dev, ino: info.ino };
            await rename(replacementPath, outsidePath);
          },
        }),
      }),
    ).rejects.toThrow(/identity changed/);

    expect(await readFile(outsidePath)).toEqual(outsideBytes);
    const preserved = await stat(outsidePath);
    expect({ dev: preserved.dev, ino: preserved.ino }).toEqual(outsideIdentity);
    expect(
      await exists(
        path.join(prepared.transaction.transactionDirectory, "unfinished.json"),
      ),
    ).toBe(false);
    await rm(outsidePath);
    await releaseKnowledgeTransactionLock(prepared.lock);
  });

  it("rejects a same-byte replacement of a replace pending file and preserves the outside inode", async () => {
    const root = await createGitFixture();
    const prepared = await prepareFixture(root);
    let outsidePath = "";
    let outsideIdentity: { dev: number; ino: number } | null = null;
    let outsideBytes = Buffer.alloc(0);

    await expect(
      appendKnowledgeTransactionJournalEvent({
        lock: prepared.lock,
        transactionId: prepared.transactionId,
        event: { event: "apply-started" },
        dependencies: dependencies({
          afterStoreMutation: async (event) => {
            if (event.scope !== "journal" || event.kind !== "temporary-file-synced") {
              return;
            }
            const names = await readdir(prepared.transaction.transactionDirectory);
            const pendingName = names.find((name) =>
              name.startsWith(".pending-replace-"),
            );
            if (!pendingName) throw new Error("replace pending file was not found");
            outsidePath = path.join(
              prepared.transaction.transactionDirectory,
              pendingName,
            );
            outsideBytes = await readFile(outsidePath);
            const replacementPath = `${outsidePath}.outside`;
            await writeFile(replacementPath, outsideBytes, { mode: 0o600 });
            const info = await stat(replacementPath);
            outsideIdentity = { dev: info.dev, ino: info.ino };
            await rename(replacementPath, outsidePath);
          },
        }),
      }),
    ).rejects.toThrow(/identity changed/);

    expect(await readFile(outsidePath)).toEqual(outsideBytes);
    const preserved = await stat(outsidePath);
    expect({ dev: preserved.dev, ino: preserved.ino }).toEqual(outsideIdentity);
    expect(
      await readKnowledgeTransactionJournal({
        repoRoot: root,
        transactionId: prepared.transactionId,
      }),
    ).toMatchObject({ events: [], tornFinalLine: false });
    await rm(outsidePath);
    await releaseKnowledgeTransactionLock(prepared.lock);
  });

  it("rejects a same-byte replacement of the replace destination and preserves the outside inode", async () => {
    const root = await createGitFixture();
    const prepared = await prepareFixture(root);
    const journalPath = path.join(
      prepared.transaction.transactionDirectory,
      "journal.jsonl",
    );
    let outsideIdentity: { dev: number; ino: number } | null = null;

    await expect(
      appendKnowledgeTransactionJournalEvent({
        lock: prepared.lock,
        transactionId: prepared.transactionId,
        event: { event: "apply-started" },
        dependencies: dependencies({
          afterStoreMutation: async (event) => {
            if (event.scope !== "journal" || event.kind !== "temporary-file-synced") {
              return;
            }
            const replacementPath = path.join(
              prepared.transaction.transactionDirectory,
              ".outside-journal-replacement",
            );
            await writeFile(replacementPath, await readFile(journalPath), {
              mode: 0o600,
            });
            const replacement = await stat(replacementPath);
            outsideIdentity = { dev: replacement.dev, ino: replacement.ino };
            await rename(replacementPath, journalPath);
          },
        }),
      }),
    ).rejects.toThrow(/replacement destination journal\.jsonl identity changed/);

    const preserved = await stat(journalPath);
    expect({ dev: preserved.dev, ino: preserved.ino }).toEqual(outsideIdentity);
    expect(
      await readKnowledgeTransactionJournal({
        repoRoot: root,
        transactionId: prepared.transactionId,
      }),
    ).toMatchObject({ events: [], tornFinalLine: false });
    await releaseKnowledgeTransactionLock(prepared.lock);
  });

  it("rejects a replacement of a newly created staging directory and preserves the outside directory", async () => {
    const root = await createGitFixture();
    const paths = await resolveKnowledgeTransactionPaths(root, {
      createTransactionRoot: true,
    });
    let outsidePath = "";
    let outsideIdentity: { dev: number; ino: number } | null = null;

    await expect(
      acquireKnowledgeTransactionLock({
        repoRoot: root,
        command: "prepare correction",
        dependencies: dependencies({
          afterStoreMutation: async (event) => {
            if (event.scope !== "writer-lock" || event.kind !== "directory-created") {
              return;
            }
            outsidePath = path.join(paths.transactionRoot, event.artifact);
            const replacementPath = path.join(
              paths.transactionRoot,
              ".outside-staging-directory",
            );
            await mkdir(replacementPath, { mode: 0o700 });
            const replacement = await stat(replacementPath);
            outsideIdentity = { dev: replacement.dev, ino: replacement.ino };
            await rm(outsidePath, { recursive: true });
            await rename(replacementPath, outsidePath);
          },
        }),
      }),
    ).rejects.toThrow(/Store directory .* identity changed/);

    const preserved = await stat(outsidePath);
    expect({ dev: preserved.dev, ino: preserved.ino }).toEqual(outsideIdentity);
    expect(await readdir(outsidePath)).toEqual([]);
  });

  it("retains prepared child-directory identities through final transaction publication", async () => {
    const root = await createGitFixture();
    const injected = dependencies();
    const transactionId = generateKnowledgeTransactionId(injected);
    const lock = await acquireKnowledgeTransactionLock({
      repoRoot: root,
      command: "prepare project-update",
      transactionId,
      dependencies: injected,
    });
    const fixture = updateFixture();
    let outsidePath = "";
    let outsideIdentity: { dev: number; ino: number } | null = null;

    await expect(
      createPreparedKnowledgeTransaction({
        lock,
        transactionId,
        kind: "project-update",
        snapshot: fixture.snapshot,
        operations: fixture.operations,
        dependencies: dependencies({
          afterStoreMutation: async (event) => {
            if (
              event.scope !== "transaction-prepare" ||
              event.kind !== "directory-created" ||
              event.artifact !== "payloads"
            ) {
              return;
            }
            const stagingName = (
              await readdir(lock.transactionRoot)
            ).find((name) => name.startsWith(".preparing-transaction-"));
            if (!stagingName) throw new Error("transaction staging directory was not found");
            const stagingPath = path.join(lock.transactionRoot, stagingName);
            outsidePath = path.join(stagingPath, "payloads");
            const replacementPath = path.join(stagingPath, ".outside-payloads");
            await mkdir(replacementPath, { mode: 0o700 });
            const replacement = await stat(replacementPath);
            outsideIdentity = { dev: replacement.dev, ino: replacement.ino };
            await rm(outsidePath, { recursive: true });
            await rename(replacementPath, outsidePath);
          },
        }),
      }),
    ).rejects.toThrow(/Store directory payloads identity changed/);

    const preserved = await stat(outsidePath);
    expect({ dev: preserved.dev, ino: preserved.ino }).toEqual(outsideIdentity);
    expect(await readdir(outsidePath)).toEqual([]);
    await releaseKnowledgeTransactionLock(lock);
  });

  it("blocks unknown root artifacts and malformed writer-lock inventories without deleting them", async () => {
    const unknownRoot = await createGitFixture();
    const unknownPaths = await resolveKnowledgeTransactionPaths(unknownRoot, {
      createTransactionRoot: true,
    });
    const unknownPath = path.join(unknownPaths.transactionRoot, "outside-notes.txt");
    await writeFile(unknownPath, "keep me", { mode: 0o600 });
    await expect(
      acquireKnowledgeTransactionLock({
        repoRoot: unknownRoot,
        command: "recover",
        recoveryCapable: true,
        dependencies: dependencies({ isPidAlive: () => false }),
      }),
    ).rejects.toThrow(/unrecognized artifact/);
    expect(await readFile(unknownPath, "utf8")).toBe("keep me");

    const lockRoot = await createGitFixture();
    const lock = await acquireKnowledgeTransactionLock({
      repoRoot: lockRoot,
      command: "prepare correction",
      dependencies: dependencies(),
    });
    const extraPath = path.join(lock.lockDirectory, "outside.txt");
    await writeFile(extraPath, "keep me", { mode: 0o600 });
    await expect(
      acquireKnowledgeTransactionLock({
        repoRoot: lockRoot,
        command: "recover",
        recoveryCapable: true,
        dependencies: dependencies({ pid: 52_525, isPidAlive: () => false }),
      }),
    ).rejects.toThrow(/cannot be proven safe.*inventory is malformed/);
    expect(await readFile(extraPath, "utf8")).toBe("keep me");
  });

  it("requires recovery to clear a provably dead interrupted lock-reclaim artifact", async () => {
    const root = await createGitFixture();
    const original = dependencies({ isPidAlive: () => true });
    const transactionId = generateKnowledgeTransactionId(original);
    const abandoned = await acquireKnowledgeTransactionLock({
      repoRoot: root,
      command: "prepare closeout",
      transactionId,
      dependencies: original,
    });
    await rename(
      abandoned.lockDirectory,
      path.join(
        abandoned.transactionRoot,
        `.reclaimed-writer-lock-${fixtureOwnerToken(abandoned.lockId, 42_424)}`,
      ),
    );
    const recoveryDependencies = dependencies({ pid: 77_777, isPidAlive: () => false });
    await expect(
      acquireKnowledgeTransactionLock({
        repoRoot: root,
        command: "apply",
        transactionId,
        dependencies: recoveryDependencies,
      }),
    ).rejects.toThrow(/requires explicit recovery/);
    const recoveryLock = await acquireKnowledgeTransactionLock({
      repoRoot: root,
      command: "recover",
      transactionId,
      recoveryCapable: true,
      dependencies: recoveryDependencies,
    });
    expect(
      (await readdir(recoveryLock.transactionRoot)).filter((name) =>
        name.startsWith(".reclaimed-writer-lock-"),
      ),
    ).toEqual([]);
    await releaseKnowledgeTransactionLock(recoveryLock);
  });

  it("rescans recovery artifacts before returning a replacement writer", async () => {
    const root = await createGitFixture();
    const abandoned = await acquireKnowledgeTransactionLock({
      repoRoot: root,
      command: "prepare closeout",
      dependencies: dependencies({ pid: 71_717 }),
    });
    const ownerToken = fixtureOwnerToken(abandoned.lockId, 71_717);
    const reclaimedName = `.reclaimed-writer-lock-${ownerToken}`;
    const reclaimedPath = path.join(abandoned.transactionRoot, reclaimedName);
    await rename(abandoned.lockDirectory, reclaimedPath);
    let injectedSecondArtifact = false;
    const recovery = await acquireKnowledgeTransactionLock({
      repoRoot: root,
      command: "recover",
      recoveryCapable: true,
      dependencies: dependencies({
        pid: 72_727,
        isPidAlive: () => false,
        afterStoreMutation: async (event) => {
          if (
            injectedSecondArtifact ||
            event.scope !== "writer-lock" ||
            event.kind !== "directory-removal-started" ||
            event.artifact !== reclaimedName
          ) {
            return;
          }
          injectedSecondArtifact = true;
          const secondPath = path.join(
            abandoned.transactionRoot,
            `.removing-writer-lock-${ownerToken}`,
          );
          await mkdir(secondPath, { mode: 0o700 });
          await writeFile(
            path.join(secondPath, "lock.json"),
            await readFile(path.join(reclaimedPath, "lock.json")),
            { mode: 0o600 },
          );
        },
      }),
    });
    expect(injectedSecondArtifact).toBe(true);
    expect(
      (await readdir(recovery.transactionRoot)).filter(
        (name) =>
          name.startsWith(".reclaimed-writer-lock-") ||
          name.startsWith(".removing-writer-lock-"),
      ),
    ).toEqual([]);
    await releaseKnowledgeTransactionLock(recovery);
  });

  it("detects payload tampering before returning exact bytes", async () => {
    const root = await createGitFixture();
    const prepared = await prepareFixture(root);
    const payloadPath = path.join(
      prepared.transaction.transactionDirectory,
      "payloads",
      "operation-0000.before.bin",
    );
    await writeFile(payloadPath, "tampered");
    await chmod(payloadPath, 0o600);
    await expect(
      openVerifiedKnowledgeTransaction({
        repoRoot: root,
        transactionId: prepared.transactionId,
      }),
    ).rejects.toThrow(/integrity verification/);
  });

  it("requires an exact transaction inventory and a valid owner-only unfinished marker", async () => {
    const extraRoot = await createGitFixture();
    const extra = await prepareFixture(extraRoot);
    const extraPath = path.join(extra.transaction.transactionDirectory, "outside.txt");
    await writeFile(extraPath, "keep me", { mode: 0o600 });
    await expect(
      openVerifiedKnowledgeTransaction({
        repoRoot: extraRoot,
        transactionId: extra.transactionId,
      }),
    ).rejects.toThrow(/root inventory is malformed/);
    expect(await readFile(extraPath, "utf8")).toBe("keep me");

    const noJournalRoot = await createGitFixture();
    const noJournal = await prepareFixture(noJournalRoot);
    await rm(path.join(noJournal.transaction.transactionDirectory, "journal.jsonl"));
    await expect(
      openVerifiedKnowledgeTransaction({
        repoRoot: noJournalRoot,
        transactionId: noJournal.transactionId,
      }),
    ).rejects.toThrow(/root inventory is malformed/);

    const markerRoot = await createGitFixture();
    const marker = await prepareFixture(markerRoot);
    await markKnowledgeTransactionUnfinished({
      lock: marker.lock,
      transactionId: marker.transactionId,
      phase: "apply",
    });
    const markerPath = path.join(marker.transaction.transactionDirectory, "unfinished.json");
    await chmod(markerPath, 0o644);
    await expect(
      listUnfinishedKnowledgeTransactionIds({ repoRoot: markerRoot }),
    ).rejects.toThrow(/mode 600/);
    await chmod(markerPath, 0o600);
    await writeFile(markerPath, "{}\n", { mode: 0o600 });
    await expect(
      getKnowledgeTransactionStatus({
        repoRoot: markerRoot,
        transactionId: marker.transactionId,
      }),
    ).rejects.toThrow(/metadata hash|malformed|unsupported fields/);
  });

  it("reports and recovery-truncates only a torn final journal line", async () => {
    const root = await createGitFixture();
    const prepared = await prepareFixture(root);
    await appendKnowledgeTransactionJournalEvent({
      lock: prepared.lock,
      transactionId: prepared.transactionId,
      event: { event: "apply-started" },
    });
    const journalPath = path.join(prepared.transaction.transactionDirectory, "journal.jsonl");
    await appendFile(journalPath, '{"partial"');
    const torn = await readKnowledgeTransactionJournal({
      repoRoot: root,
      transactionId: prepared.transactionId,
    });
    expect(torn.events).toHaveLength(1);
    expect(torn.tornFinalLine).toBe(true);
    await expect(
      appendKnowledgeTransactionJournalEvent({
        lock: prepared.lock,
        transactionId: prepared.transactionId,
        event: { event: "mutation-intent", operationIndex: 0 },
      }),
    ).rejects.toThrow(/torn final line/);
    await releaseKnowledgeTransactionLock(prepared.lock);

    const recoveryLock = await acquireKnowledgeTransactionLock({
      repoRoot: root,
      command: "recover",
      transactionId: prepared.transactionId,
      recoveryCapable: true,
      dependencies: dependencies(),
    });
    const repaired = await truncateTornKnowledgeTransactionJournal({
      lock: recoveryLock,
      transactionId: prepared.transactionId,
    });
    expect(repaired.tornFinalLine).toBe(false);
    expect(repaired.events.map((event) => event.event)).toEqual(["apply-started"]);
    await releaseKnowledgeTransactionLock(recoveryLock);
  });

  it("treats a malformed complete journal line before a torn tail as corruption", async () => {
    const root = await createGitFixture();
    const prepared = await prepareFixture(root);
    const journalPath = path.join(prepared.transaction.transactionDirectory, "journal.jsonl");
    await writeFile(journalPath, "not-json\npartial");
    await chmod(journalPath, 0o600);
    await expect(
      readKnowledgeTransactionJournal({
        repoRoot: root,
        transactionId: prepared.transactionId,
      }),
    ).rejects.toThrow(/line 1 is corrupt/);
  });

  it("strictly validates artifact ownership journal schema, paths, kinds, and identities", async () => {
    const root = await createGitFixture();
    const prepared = await prepareFixture(root);
    const validProof = {
      event: "artifact-ownership-recorded" as const,
      operationIndex: 0,
      canonicalSourcePath: prepared.sourcePath,
      artifactRole: "after-stage" as const,
      artifactKind: "after-stage" as const,
      artifactSourcePath:
        "docs/current-work/active/community-gallery/.chronicle-knowledge-kr-20260801T123456789Z-0011223344556677-0000.tmp",
      identityDev: "16777234",
      identityIno: "123456789012345",
      identityUid: "501",
      identityBirthtimeNs: "1785587696789000000",
      byteLength: String(prepared.afterBytes.byteLength),
      sha256: digest(prepared.afterBytes),
      mode: 0o644,
    };
    await appendKnowledgeTransactionJournalEvent({
      lock: prepared.lock,
      transactionId: prepared.transactionId,
      event: validProof,
    });
    const stored = await readKnowledgeTransactionJournal({
      repoRoot: root,
      transactionId: prepared.transactionId,
    });
    expect(stored.events[0]).toMatchObject(validProof);

    for (const invalid of [
      { ...validProof, artifactSourcePath: "../outside.md" },
      { ...validProof, artifactKind: "unknown-kind" },
      { ...validProof, identityIno: "1.5" },
      { ...validProof, identityUid: "-1" },
      { ...validProof, identityBirthtimeNs: "not-a-number" },
    ]) {
      await expect(
        appendKnowledgeTransactionJournalEvent({
          lock: prepared.lock,
          transactionId: prepared.transactionId,
          event: invalid as typeof validProof,
        }),
      ).rejects.toThrow(/ownership proof|safe relative path|normalized repository-relative path/);
    }

    const journalPath = path.join(
      prepared.transaction.transactionDirectory,
      "journal.jsonl",
    );
    const line = JSON.parse((await readFile(journalPath, "utf8")).trim()) as Record<
      string,
      unknown
    >;
    const { metadataSha256: _oldHash, ...base } = line;
    const tampered = knowledgeControlMetadataWithHash({
      ...base,
      unexpectedOwnershipField: "outside",
    });
    await writeFile(journalPath, `${canonicalKnowledgeControlJson(tampered)}\n`, {
      mode: 0o600,
    });
    await expect(
      readKnowledgeTransactionJournal({
        repoRoot: root,
        transactionId: prepared.transactionId,
      }),
    ).rejects.toThrow(/unsupported fields/);
  });

  it("retains recovered and later applied terminal history and safely clears either marker", async () => {
    const root = await createGitFixture();
    const prepared = await prepareFixture(root);
    await markKnowledgeTransactionUnfinished({
      lock: prepared.lock,
      transactionId: prepared.transactionId,
      phase: "recover",
    });
    expect(
      await mode(
        path.join(prepared.transaction.transactionDirectory, "unfinished.json"),
      ),
    ).toBe(0o600);
    expect(await listUnfinishedKnowledgeTransactionIds({ repoRoot: root })).toEqual([
      prepared.transactionId,
    ]);
    await appendKnowledgeTransactionJournalEvent({
      lock: prepared.lock,
      transactionId: prepared.transactionId,
      event: { event: "recovery-started" },
    });
    await appendKnowledgeTransactionJournalEvent({
      lock: prepared.lock,
      transactionId: prepared.transactionId,
      event: { event: "recovery-completed" },
    });
    await writeKnowledgeTransactionTerminalReceipt({
      lock: prepared.lock,
      transactionId: prepared.transactionId,
      outcome: "recovered",
      validationSha256: VALIDATION_HASH,
    });
    await clearKnowledgeTransactionUnfinished({
      lock: prepared.lock,
      transactionId: prepared.transactionId,
      expectedOutcome: "recovered",
    });

    await markKnowledgeTransactionUnfinished({
      lock: prepared.lock,
      transactionId: prepared.transactionId,
      phase: "apply",
    });
    await appendKnowledgeTransactionJournalEvent({
      lock: prepared.lock,
      transactionId: prepared.transactionId,
      event: { event: "apply-started" },
    });
    await appendKnowledgeTransactionJournalEvent({
      lock: prepared.lock,
      transactionId: prepared.transactionId,
      event: { event: "apply-completed" },
    });
    expect(
      await getKnowledgeTransactionStatus({
        repoRoot: root,
        transactionId: prepared.transactionId,
      }),
    ).toMatchObject({ unfinished: true, terminalOutcome: null });
    await writeKnowledgeTransactionTerminalReceipt({
      lock: prepared.lock,
      transactionId: prepared.transactionId,
      outcome: "applied",
      validationSha256: VALIDATION_HASH,
    });
    expect((await getKnowledgeTransactionStatus({ repoRoot: root, transactionId: prepared.transactionId })).unfinished).toBe(true);
    await clearKnowledgeTransactionUnfinished({
      lock: prepared.lock,
      transactionId: prepared.transactionId,
      expectedOutcome: "applied",
    });
    const status = await getKnowledgeTransactionStatus({
      repoRoot: root,
      transactionId: prepared.transactionId,
    });
    expect(status).toMatchObject({
      unfinished: false,
      terminalOutcome: "applied",
      journalEventCount: 4,
    });
    expect(
      await readdir(path.join(prepared.transaction.transactionDirectory, "terminal-receipts")),
    ).toEqual(["receipt-0001-recovered.json", "receipt-0002-applied.json"]);
    expect(
      await mode(
        path.join(
          prepared.transaction.transactionDirectory,
          "terminal-receipts",
          "receipt-0002-applied.json",
        ),
      ),
    ).toBe(0o600);
    await releaseKnowledgeTransactionLock(prepared.lock);
  });

  it("recovers every interrupted writer-lock metadata publication without accepting a partial lock", async () => {
    const baselineRoot = await createGitFixture();
    const baselineEvents: TransactionStoreMutationEvent[] = [];
    const baselineLock = await acquireKnowledgeTransactionLock({
      repoRoot: baselineRoot,
      command: "prepare correction",
      dependencies: dependencies({
        afterStoreMutation: (event) => {
          if (event.scope === "writer-lock") baselineEvents.push(event);
        },
      }),
    });
    const publicationMutations = baselineEvents.length;
    expect(baselineEvents.map((event) => event.kind)).toEqual([
      "directory-created",
      ...EXCLUSIVE_FILE_EVENT_KINDS,
      ...DIRECTORY_PUBLICATION_EVENT_KINDS,
    ]);
    await releaseKnowledgeTransactionLock(baselineLock);
    expect(publicationMutations).toBe(8);

    for (let target = 1; target <= publicationMutations; target += 1) {
      const root = await createGitFixture();
      await expect(
        acquireKnowledgeTransactionLock({
          repoRoot: root,
          command: "prepare correction",
          dependencies: dependencies({
            pid: 50_000 + target,
            afterStoreMutation: failAtMutation("writer-lock", target),
          }),
        }),
      ).rejects.toThrow(/Injected transaction-store interruption/);

      const recoveryDependencies = dependencies({
        pid: 60_000 + target,
        isPidAlive: () => false,
      });
      await expect(
        acquireKnowledgeTransactionLock({
          repoRoot: root,
          command: "status",
          dependencies: recoveryDependencies,
        }),
      ).rejects.toThrow(/explicit recovery|dead process/);
      const recovered = await acquireKnowledgeTransactionLock({
        repoRoot: root,
        command: "recover",
        recoveryCapable: true,
        dependencies: recoveryDependencies,
      });
      expect(
        (await readdir(recovered.transactionRoot)).some((name) =>
          name.startsWith(".preparing-writer-lock-"),
        ),
      ).toBe(false);
      await releaseKnowledgeTransactionLock(recovered);
    }
  }, 15_000);

  it("recovers a killed writer release at every explicit deletion boundary", async () => {
    for (let target = 0; target < DIRECTORY_REMOVAL_EVENT_KINDS.length; target += 1) {
      const root = await createGitFixture();
      const killed = await runKilledStoreScenario({
        root,
        scenario: "writer-release",
        scope: "writer-lock",
        kind: DIRECTORY_REMOVAL_EVENT_KINDS[target],
      });
      expect(killed.events.map((event) => event.kind)).toEqual(
        DIRECTORY_REMOVAL_EVENT_KINDS.slice(0, target + 1),
      );
      const recovered = await acquireKnowledgeTransactionLock({
        repoRoot: root,
        command: "recover",
        recoveryCapable: true,
        dependencies: dependencies({
          pid: 120_000 + target,
          isPidAlive: () => false,
        }),
      });
      expect(
        (await readdir(recovered.transactionRoot)).filter(
          (name) =>
            name.startsWith(".reclaimed-writer-lock-") ||
            name.startsWith(".removing-writer-lock-") ||
            name.startsWith(".preparing-writer-lock-"),
        ),
      ).toEqual([]);
      await releaseKnowledgeTransactionLock(recovered);
    }
  }, 60_000);

  it("recovers killed lease cleanup, pending publication, marker removal, and torn-journal repair", async () => {
    const leaseRoot = await createGitFixture();
    const killedLease = await runKilledStoreScenario({
      root: leaseRoot,
      scenario: "certification-release",
      scope: "certification-lease",
      kind: "file-unlinked-unsynced",
    });
    expect(killedLease.events.map((event) => event.kind)).toEqual(
      DIRECTORY_REMOVAL_EVENT_KINDS.slice(
        0,
        DIRECTORY_REMOVAL_EVENT_KINDS.indexOf("file-unlinked-unsynced") + 1,
      ),
    );
    const leaseRecovery = await acquireKnowledgeTransactionLock({
      repoRoot: leaseRoot,
      command: "recover",
      recoveryCapable: true,
      dependencies: dependencies({ pid: 130_001, isPidAlive: () => false }),
    });
    const leasePaths = await resolveKnowledgeTransactionPaths(leaseRoot);
    expect(
      await readdir(path.join(leasePaths.transactionRoot, "certification-leases")),
    ).toEqual([]);
    await releaseKnowledgeTransactionLock(leaseRecovery);

    const pendingRoot = await createGitFixture();
    const killedPending = await runKilledStoreScenario({
      root: pendingRoot,
      scenario: "marker-publish",
      scope: "transaction-control",
      kind: "file-published-unsynced",
    });
    expect(killedPending.transactionId).not.toBeNull();
    expect(killedPending.events.map((event) => event.kind)).toEqual([
      "temporary-file-synced",
      "file-published-unsynced",
    ]);
    const pendingRecovery = await acquireKnowledgeTransactionLock({
      repoRoot: pendingRoot,
      command: "recover",
      transactionId: killedPending.transactionId!,
      recoveryCapable: true,
      dependencies: dependencies({ pid: 130_002, isPidAlive: () => false }),
    });
    expect(await listUnfinishedKnowledgeTransactionIds({ repoRoot: pendingRoot })).toEqual([
      killedPending.transactionId,
    ]);
    const pendingTransaction = await openVerifiedKnowledgeTransaction({
      repoRoot: pendingRoot,
      transactionId: killedPending.transactionId!,
    });
    expect(
      (await readdir(pendingTransaction.transactionDirectory)).some((name) =>
        name.startsWith(".pending-"),
      ),
    ).toBe(false);
    await releaseKnowledgeTransactionLock(pendingRecovery);

    const markerRoot = await createGitFixture();
    const killedMarker = await runKilledStoreScenario({
      root: markerRoot,
      scenario: "marker-clear",
      scope: "transaction-control",
      kind: "file-unlinked-unsynced",
    });
    expect(killedMarker.events.map((event) => event.kind)).toEqual([
      "file-removal-ready",
      "file-unlinked-unsynced",
    ]);
    const markerRecovery = await acquireKnowledgeTransactionLock({
      repoRoot: markerRoot,
      command: "recover",
      transactionId: killedMarker.transactionId!,
      recoveryCapable: true,
      dependencies: dependencies({ pid: 130_003, isPidAlive: () => false }),
    });
    expect(
      await getKnowledgeTransactionStatus({
        repoRoot: markerRoot,
        transactionId: killedMarker.transactionId!,
      }),
    ).toMatchObject({ unfinished: false, terminalOutcome: "recovered" });
    await releaseKnowledgeTransactionLock(markerRecovery);

    const journalRoot = await createGitFixture();
    const killedJournal = await runKilledStoreScenario({
      root: journalRoot,
      scenario: "journal-truncate",
      scope: "journal",
      kind: "file-published-unsynced",
    });
    expect(killedJournal.events.map((event) => event.kind)).toEqual([
      "temporary-file-synced",
      "file-published-unsynced",
    ]);
    const journalRecovery = await acquireKnowledgeTransactionLock({
      repoRoot: journalRoot,
      command: "recover",
      transactionId: killedJournal.transactionId!,
      recoveryCapable: true,
      dependencies: dependencies({ pid: 130_004, isPidAlive: () => false }),
    });
    expect(
      await readKnowledgeTransactionJournal({
        repoRoot: journalRoot,
        transactionId: killedJournal.transactionId!,
      }),
    ).toMatchObject({ tornFinalLine: false });
    await releaseKnowledgeTransactionLock(journalRecovery);
  }, 60_000);

  it("recovers every interrupted transaction preparation without exposing an incomplete final transaction", async () => {
    const baselineRoot = await createGitFixture();
    const baselineDependencies = dependencies();
    const baselineId = generateKnowledgeTransactionId(baselineDependencies);
    const baselineLock = await acquireKnowledgeTransactionLock({
      repoRoot: baselineRoot,
      command: "prepare project-update",
      transactionId: baselineId,
      dependencies: baselineDependencies,
    });
    const baselineEvents: TransactionStoreMutationEvent[] = [];
    const baselineFixture = updateFixture();
    await createPreparedKnowledgeTransaction({
      lock: baselineLock,
      transactionId: baselineId,
      kind: "project-update",
      snapshot: baselineFixture.snapshot,
      operations: baselineFixture.operations,
      dependencies: dependencies({
        afterStoreMutation: (event) => {
          if (event.scope === "transaction-prepare") baselineEvents.push(event);
        },
      }),
    });
    await releaseKnowledgeTransactionLock(baselineLock);
    expect(baselineEvents.map((event) => event.kind)).toEqual([
      "directory-created",
      "directory-created",
      "directory-created",
      ...EXCLUSIVE_FILE_EVENT_KINDS,
      ...EXCLUSIVE_FILE_EVENT_KINDS,
      ...EXCLUSIVE_FILE_EVENT_KINDS,
      ...EXCLUSIVE_FILE_EVENT_KINDS,
      ...DIRECTORY_PUBLICATION_EVENT_KINDS,
    ]);

    for (let target = 1; target <= baselineEvents.length; target += 1) {
      const root = await createGitFixture();
      const originalDependencies = dependencies({ pid: 70_000 + target });
      const transactionId = generateKnowledgeTransactionId(originalDependencies);
      const lock = await acquireKnowledgeTransactionLock({
        repoRoot: root,
        command: "prepare project-update",
        transactionId,
        dependencies: originalDependencies,
      });
      const fixture = updateFixture();
      await expect(
        createPreparedKnowledgeTransaction({
          lock,
          transactionId,
          kind: "project-update",
          snapshot: fixture.snapshot,
          operations: fixture.operations,
          dependencies: dependencies({
            pid: 70_000 + target,
            afterStoreMutation: failAtMutation("transaction-prepare", target),
          }),
        }),
      ).rejects.toThrow(/Injected transaction-store interruption/);
      await releaseKnowledgeTransactionLock(lock);

      const paths = await resolveKnowledgeTransactionPaths(root);
      const hasPreparationArtifact = (await readdir(paths.transactionRoot)).some((name) =>
        name.startsWith(".preparing-transaction-"),
      );
      const recoveryDependencies = dependencies({
        pid: 80_000 + target,
        isPidAlive: () => false,
      });
      if (hasPreparationArtifact) {
        await expect(
          acquireKnowledgeTransactionLock({
            repoRoot: root,
            command: "status",
            dependencies: recoveryDependencies,
          }),
        ).rejects.toThrow(/explicit recovery/);
      }
      const recoveryLock = await acquireKnowledgeTransactionLock({
        repoRoot: root,
        command: "recover",
        transactionId,
        recoveryCapable: true,
        dependencies: recoveryDependencies,
      });
      expect(
        (await readdir(paths.transactionRoot)).some((name) =>
          name.startsWith(".preparing-transaction-"),
        ),
      ).toBe(false);
      const transactionDirectory = path.join(paths.transactionRoot, transactionId);
      if (await exists(transactionDirectory)) {
        await expect(
          openVerifiedKnowledgeTransaction({ repoRoot: root, transactionId }),
        ).resolves.toMatchObject({ transactionId });
      }
      await releaseKnowledgeTransactionLock(recoveryLock);
    }
  }, 20_000);

  it("atomically publishes control files and restores a readable journal after every interruption point", async () => {
    const markerEventKinds = EXCLUSIVE_FILE_EVENT_KINDS;
    const journalEventKinds = [...REPLACE_FILE_EVENT_KINDS, "journal-appended"] as const;
    const receiptEventKinds = EXCLUSIVE_FILE_EVENT_KINDS;

    for (let target = 1; target <= markerEventKinds.length; target += 1) {
      const root = await createGitFixture();
      const prepared = await prepareFixture(root, {
        dependencies: dependencies({ pid: 90_000 + target }),
      });
      await expect(
        markKnowledgeTransactionUnfinished({
          lock: prepared.lock,
          transactionId: prepared.transactionId,
          phase: "apply",
          dependencies: dependencies({
            pid: 90_000 + target,
            afterStoreMutation: failAtMutation("transaction-control", target),
          }),
        }),
      ).rejects.toThrow(/Injected transaction-store interruption/);
      await releaseKnowledgeTransactionLock(prepared.lock);
      const recoveryLock = await acquireKnowledgeTransactionLock({
        repoRoot: root,
        command: "recover",
        transactionId: prepared.transactionId,
        recoveryCapable: true,
        dependencies: dependencies({
          pid: 91_000 + target,
          isPidAlive: () => false,
        }),
      });
      expect(
        await listUnfinishedKnowledgeTransactionIds({ repoRoot: root }),
      ).toEqual(target === 1 ? [] : [prepared.transactionId]);
      await releaseKnowledgeTransactionLock(recoveryLock);
    }

    for (let target = 1; target <= journalEventKinds.length; target += 1) {
      const root = await createGitFixture();
      const prepared = await prepareFixture(root, {
        dependencies: dependencies({ pid: 92_000 + target }),
      });
      await expect(
        appendKnowledgeTransactionJournalEvent({
          lock: prepared.lock,
          transactionId: prepared.transactionId,
          event: { event: "apply-started" },
          dependencies: dependencies({
            pid: 92_000 + target,
            afterStoreMutation: failAtMutation("journal", target),
          }),
        }),
      ).rejects.toThrow(/Injected transaction-store interruption/);
      await releaseKnowledgeTransactionLock(prepared.lock);
      const recoveryLock = await acquireKnowledgeTransactionLock({
        repoRoot: root,
        command: "recover",
        transactionId: prepared.transactionId,
        recoveryCapable: true,
        dependencies: dependencies({
          pid: 93_000 + target,
          isPidAlive: () => false,
        }),
      });
      const journal = await readKnowledgeTransactionJournal({
        repoRoot: root,
        transactionId: prepared.transactionId,
      });
      expect(journal.tornFinalLine).toBe(false);
      expect(journal.events).toHaveLength(target === 1 ? 0 : 1);
      await releaseKnowledgeTransactionLock(recoveryLock);
    }

    for (let target = 1; target <= receiptEventKinds.length; target += 1) {
      const root = await createGitFixture();
      const prepared = await prepareFixture(root, {
        dependencies: dependencies({ pid: 94_000 + target }),
      });
      await appendKnowledgeTransactionJournalEvent({
        lock: prepared.lock,
        transactionId: prepared.transactionId,
        event: { event: "recovery-started" },
      });
      await appendKnowledgeTransactionJournalEvent({
        lock: prepared.lock,
        transactionId: prepared.transactionId,
        event: { event: "recovery-completed" },
      });
      await expect(
        writeKnowledgeTransactionTerminalReceipt({
          lock: prepared.lock,
          transactionId: prepared.transactionId,
          outcome: "recovered",
          validationSha256: VALIDATION_HASH,
          dependencies: dependencies({
            pid: 94_000 + target,
            afterStoreMutation: failAtMutation("transaction-control", target),
          }),
        }),
      ).rejects.toThrow(/Injected transaction-store interruption/);
      await releaseKnowledgeTransactionLock(prepared.lock);
      const recoveryLock = await acquireKnowledgeTransactionLock({
        repoRoot: root,
        command: "recover",
        transactionId: prepared.transactionId,
        recoveryCapable: true,
        dependencies: dependencies({
          pid: 95_000 + target,
          isPidAlive: () => false,
        }),
      });
      expect(
        await getKnowledgeTransactionStatus({
          repoRoot: root,
          transactionId: prepared.transactionId,
        }),
      ).toMatchObject({ terminalOutcome: target === 1 ? null : "recovered" });
      await releaseKnowledgeTransactionLock(recoveryLock);
    }
  }, 20_000);

  it("coordinates multiple certification leases and fails closed for dead, cross-host, and partial leases", async () => {
    const root = await createGitFixture();
    const certifier = dependencies({ pid: 101_001, isPidAlive: () => true });
    const first = await acquireKnowledgeCertificationLease({
      repoRoot: root,
      command: "knowledge check",
      dependencies: certifier,
    });
    const second = await acquireKnowledgeCertificationLease({
      repoRoot: root,
      command: "typecheck",
      dependencies: certifier,
    });
    await expect(
      acquireKnowledgeTransactionLock({
        repoRoot: root,
        command: "prepare correction",
        dependencies: certifier,
      }),
    ).rejects.toThrow(/live certification lease/);
    await releaseKnowledgeCertificationLease(first, { dependencies: certifier });
    await expect(
      acquireKnowledgeTransactionLock({
        repoRoot: root,
        command: "prepare correction",
        dependencies: certifier,
      }),
    ).rejects.toThrow(/live certification lease/);
    await releaseKnowledgeCertificationLease(second, { dependencies: certifier });
    const writer = await acquireKnowledgeTransactionLock({
      repoRoot: root,
      command: "prepare correction",
      dependencies: certifier,
    });
    await releaseKnowledgeTransactionLock(writer);

    const deadRoot = await createGitFixture();
    await acquireKnowledgeCertificationLease({
      repoRoot: deadRoot,
      command: "knowledge check",
      dependencies: dependencies({ pid: 102_001, isPidAlive: () => true }),
    });
    const deadObserver = dependencies({ pid: 102_002, isPidAlive: () => false });
    await expect(
      acquireKnowledgeTransactionLock({
        repoRoot: deadRoot,
        command: "status",
        dependencies: deadObserver,
      }),
    ).rejects.toThrow(/dead certification lease requires explicit recovery/);
    const recoveredWriter = await acquireKnowledgeTransactionLock({
      repoRoot: deadRoot,
      command: "recover",
      recoveryCapable: true,
      dependencies: deadObserver,
    });
    await releaseKnowledgeTransactionLock(recoveredWriter);

    const crossHostRoot = await createGitFixture();
    const crossHostLease = await acquireKnowledgeCertificationLease({
      repoRoot: crossHostRoot,
      command: "knowledge check",
      dependencies: dependencies({
        hostname: () => "host-a",
        pid: 103_001,
        isPidAlive: () => true,
      }),
    });
    await expect(
      acquireKnowledgeTransactionLock({
        repoRoot: crossHostRoot,
        command: "recover",
        recoveryCapable: true,
        dependencies: dependencies({
          hostname: () => "host-b",
          pid: 103_002,
          isPidAlive: () => false,
        }),
      }),
    ).rejects.toThrow(/another or unknown host/);
    await releaseKnowledgeCertificationLease(crossHostLease, {
      dependencies: dependencies({
        hostname: () => "host-a",
        pid: 103_001,
        isPidAlive: () => true,
      }),
    });

    const partialRoot = await createGitFixture();
    const partialPaths = await resolveKnowledgeTransactionPaths(partialRoot, {
      createTransactionRoot: true,
    });
    const leaseRoot = path.join(partialPaths.transactionRoot, "certification-leases");
    await mkdir(leaseRoot, { mode: 0o700 });
    await mkdir(path.join(leaseRoot, `lease-${"a".repeat(32)}`), { mode: 0o700 });
    await expect(
      acquireKnowledgeTransactionLock({
        repoRoot: partialRoot,
        command: "recover",
        recoveryCapable: true,
        dependencies: dependencies({ isPidAlive: () => false }),
      }),
    ).rejects.toThrow(/cannot be proven safe/);
    await expect(
      acquireKnowledgeCertificationLease({
        repoRoot: partialRoot,
        command: "knowledge check",
        recoveryCapable: true,
        dependencies: dependencies({ isPidAlive: () => false }),
      }),
    ).rejects.toThrow(/cannot be proven safe/);
    expect(await readdir(path.join(leaseRoot, `lease-${"a".repeat(32)}`))).toEqual([]);
  });

  it("durably protects a certification child PID and process group after its runner dies", async () => {
    const childRoot = await createGitFixture();
    const ownerPid = 140_001;
    const childPid = 140_002;
    const ownerDependencies = dependencies({
      pid: ownerPid,
      isPidAlive: (pid) => pid === ownerPid || pid === childPid,
      isProcessGroupAlive: () => false,
    });
    const childLease = await acquireKnowledgeCertificationLease({
      repoRoot: childRoot,
      command: "knowledge check",
      dependencies: ownerDependencies,
    });
    await attachKnowledgeCertificationLeaseProtectedProcess({
      lease: childLease,
      protectedChildPid: childPid,
      dependencies: ownerDependencies,
    });
    const childMetadata = JSON.parse(
      await readFile(path.join(childLease.leaseDirectory, "lease.json"), "utf8"),
    );
    expect(childMetadata).toMatchObject({
      protectedChildPid: childPid,
      protectedProcessGroupId: null,
    });
    await expect(
      releaseKnowledgeCertificationLease(childLease, {
        dependencies: ownerDependencies,
      }),
    ).rejects.toThrow(/protected process is alive/);
    await expect(
      acquireKnowledgeTransactionLock({
        repoRoot: childRoot,
        command: "recover",
        recoveryCapable: true,
        dependencies: dependencies({
          pid: 140_003,
          isPidAlive: (pid) => pid === childPid,
          isProcessGroupAlive: () => false,
        }),
      }),
    ).rejects.toThrow(/live certification lease/);
    const childCleanup = await acquireKnowledgeTransactionLock({
      repoRoot: childRoot,
      command: "recover",
      recoveryCapable: true,
      dependencies: dependencies({
        pid: 140_004,
        isPidAlive: () => false,
        isProcessGroupAlive: () => false,
      }),
    });
    await releaseKnowledgeTransactionLock(childCleanup);

    const groupRoot = await createGitFixture();
    const groupOwnerPid = 141_001;
    const groupChildPid = 141_002;
    const processGroupId = 141_003;
    const groupOwner = dependencies({
      pid: groupOwnerPid,
      isPidAlive: (pid) => pid === groupOwnerPid,
      isProcessGroupAlive: () => false,
    });
    const groupLease = await acquireKnowledgeCertificationLease({
      repoRoot: groupRoot,
      command: "typecheck",
      dependencies: groupOwner,
    });
    await attachKnowledgeCertificationLeaseProtectedProcess({
      lease: groupLease,
      protectedChildPid: groupChildPid,
      protectedProcessGroupId: processGroupId,
      dependencies: groupOwner,
    });
    await expect(
      acquireKnowledgeTransactionLock({
        repoRoot: groupRoot,
        command: "recover",
        recoveryCapable: true,
        dependencies: dependencies({
          pid: 141_004,
          isPidAlive: () => false,
          isProcessGroupAlive: (groupId) => groupId === processGroupId,
        }),
      }),
    ).rejects.toThrow(/live certification lease/);
    const groupCleanup = await acquireKnowledgeTransactionLock({
      repoRoot: groupRoot,
      command: "recover",
      recoveryCapable: true,
      dependencies: dependencies({
        pid: 141_005,
        isPidAlive: () => false,
        isProcessGroupAlive: () => false,
      }),
    });
    await releaseKnowledgeTransactionLock(groupCleanup);
  });

  it("serializes simultaneous certification registration and release without false recovery failures", async () => {
    const root = await createGitFixture();
    const pids = Array.from({ length: 12 }, (_, index) => 150_000 + index);
    const leaseDependencies = pids.map((pid) =>
      dependencies({
        pid,
        isPidAlive: (candidate) => pids.includes(candidate),
        isProcessGroupAlive: () => false,
      }),
    );
    const leases = await Promise.all(
      leaseDependencies.map((injected, index) =>
        acquireKnowledgeCertificationLease({
          repoRoot: root,
          command: index % 2 === 0 ? "knowledge check" : "typecheck",
          dependencies: injected,
        }),
      ),
    );
    const paths = await resolveKnowledgeTransactionPaths(root);
    expect(
      (await readdir(path.join(paths.transactionRoot, "certification-leases"))).filter(
        (name) => name.startsWith("lease-"),
      ),
    ).toHaveLength(12);
    await Promise.all(
      leases.map((lease, index) =>
        releaseKnowledgeCertificationLease(lease, {
          dependencies: leaseDependencies[index],
        }),
      ),
    );
    expect(
      await readdir(path.join(paths.transactionRoot, "certification-leases")),
    ).toEqual([]);
  }, 30_000);

  it("fails closed when a certification lease inventory remains malformed", async () => {
    const root = await createGitFixture();
    const leaseDependencies = dependencies({
      pid: 150_100,
      isPidAlive: (candidate) => candidate === 150_100,
    });
    const lease = await acquireKnowledgeCertificationLease({
      repoRoot: root,
      command: "knowledge check",
      dependencies: leaseDependencies,
    });
    const paths = await resolveKnowledgeTransactionPaths(root);
    const leaseDirectory = path.join(
      paths.transactionRoot,
      "certification-leases",
      `lease-${lease.leaseId}`,
    );
    const extraPath = path.join(leaseDirectory, "persistent-extra-file");
    await writeFile(extraPath, "keep me", { mode: 0o600 });

    await expect(
      listUnfinishedKnowledgeTransactionIds({ repoRoot: root }),
    ).rejects.toThrow(/lease inventory is malformed/);
    expect(await readFile(extraPath, "utf8")).toBe("keep me");

    await rm(extraPath);
    await releaseKnowledgeCertificationLease(lease, {
      dependencies: leaseDependencies,
    });
  }, 10_000);

  it("waits for a live writer publication before certifying the unfinished inventory", async () => {
    const root = await createGitFixture();
    let releasePublication!: () => void;
    let reportPublicationReady!: () => void;
    const publicationBlocked = new Promise<void>((resolve) => {
      releasePublication = resolve;
    });
    const publicationReady = new Promise<void>((resolve) => {
      reportPublicationReady = resolve;
    });
    const leasePromise = acquireKnowledgeCertificationLease({
      repoRoot: root,
      command: "knowledge check",
      dependencies: {
        afterStoreMutation: async (event) => {
          if (
            event.scope === "writer-lock" &&
            event.kind === "directory-publication-ready"
          ) {
            reportPublicationReady();
            await publicationBlocked;
          }
        },
      },
    });
    await publicationReady;
    const unfinishedPromise = listUnfinishedKnowledgeTransactionIds({ repoRoot: root });
    try {
      const earlyResult = await Promise.race([
        unfinishedPromise.then(() => "settled" as const),
        new Promise<"pending">((resolve) => setTimeout(() => resolve("pending"), 30)),
      ]);
      expect(earlyResult).toBe("pending");
    } finally {
      releasePublication();
    }
    const lease = await leasePromise;
    await expect(unfinishedPromise).resolves.toEqual([]);
    await releaseKnowledgeCertificationLease(lease, { recoveryCapable: true });
  });

  it("recovers every interrupted certification-lease publication without guessing ownership", async () => {
    const baselineRoot = await createGitFixture();
    const baselineEvents: TransactionStoreMutationEvent[] = [];
    const baselineDependencies = dependencies({
      pid: 104_001,
      afterStoreMutation: (event) => {
        if (event.scope === "certification-lease") baselineEvents.push(event);
      },
    });
    const baselineLease = await acquireKnowledgeCertificationLease({
      repoRoot: baselineRoot,
      command: "knowledge check",
      dependencies: baselineDependencies,
    });
    const publicationMutations = baselineEvents.length;
    expect(baselineEvents.map((event) => event.kind)).toEqual([
      "directory-created",
      "directory-created",
      ...EXCLUSIVE_FILE_EVENT_KINDS,
      ...DIRECTORY_PUBLICATION_EVENT_KINDS,
    ]);
    await releaseKnowledgeCertificationLease(baselineLease, {
      dependencies: dependencies({ pid: 104_001 }),
    });
    expect(publicationMutations).toBe(9);

    for (let target = 1; target <= publicationMutations; target += 1) {
      const root = await createGitFixture();
      await expect(
        acquireKnowledgeCertificationLease({
          repoRoot: root,
          command: "knowledge check",
          dependencies: dependencies({
            pid: 105_000 + target,
            afterStoreMutation: failAtMutation("certification-lease", target),
          }),
        }),
      ).rejects.toThrow(/Injected transaction-store interruption/);
      const recoveryLock = await acquireKnowledgeTransactionLock({
        repoRoot: root,
        command: "recover",
        recoveryCapable: true,
        dependencies: dependencies({
          pid: 106_000 + target,
          isPidAlive: () => false,
        }),
      });
      const paths = await resolveKnowledgeTransactionPaths(root);
      const leaseRoot = path.join(paths.transactionRoot, "certification-leases");
      if (await exists(leaseRoot)) {
        expect(await readdir(leaseRoot)).toEqual([]);
      }
      await releaseKnowledgeTransactionLock(recoveryLock);
    }
  });

  it(
    "recovers every interrupted certification-lease release without leaving a false blocker",
    async () => {
      const baselineRoot = await createGitFixture();
      const baselineOwner = dependencies({ pid: 107_001 });
      const baselineLease = await acquireKnowledgeCertificationLease({
        repoRoot: baselineRoot,
        command: "knowledge check",
        dependencies: baselineOwner,
      });
      const baselineEvents: TransactionStoreMutationEvent[] = [];
      await releaseKnowledgeCertificationLease(baselineLease, {
        dependencies: dependencies({
          pid: 107_001,
          afterStoreMutation: (event) => {
            if (event.scope === "certification-lease") baselineEvents.push(event);
          },
        }),
      });
      expect(baselineEvents.map((event) => event.kind)).toEqual(
        DIRECTORY_REMOVAL_EVENT_KINDS,
      );

      for (let target = 1; target <= baselineEvents.length; target += 1) {
        const root = await createGitFixture();
        const owner = dependencies({ pid: 108_000 + target });
        const lease = await acquireKnowledgeCertificationLease({
          repoRoot: root,
          command: "knowledge check",
          dependencies: owner,
        });
        await expect(
          releaseKnowledgeCertificationLease(lease, {
            dependencies: dependencies({
              pid: 108_000 + target,
              afterStoreMutation: failAtMutation("certification-lease", target),
            }),
          }),
        ).rejects.toThrow(/Injected transaction-store interruption/);
        const recoveryLock = await acquireKnowledgeTransactionLock({
          repoRoot: root,
          command: "recover",
          recoveryCapable: true,
          dependencies: dependencies({
            pid: 109_000 + target,
            isPidAlive: () => false,
          }),
        });
        const paths = await resolveKnowledgeTransactionPaths(root);
        const leaseRoot = path.join(paths.transactionRoot, "certification-leases");
        expect(await readdir(leaseRoot)).toEqual([]);
        await releaseKnowledgeTransactionLock(recoveryLock);
      }
    },
    15_000,
  );

  it("rejects operation-count and per-payload resource exhaustion", async () => {
    const root = await createGitFixture();
    const injected = dependencies();
    const transactionId = generateKnowledgeTransactionId(injected);
    const lock = await acquireKnowledgeTransactionLock({
      repoRoot: root,
      command: "prepare project-update",
      transactionId,
      dependencies: injected,
    });
    const fixture = updateFixture();
    await expect(
      createPreparedKnowledgeTransaction({
        lock,
        transactionId,
        kind: "project-update",
        snapshot: fixture.snapshot,
        operations: Array.from(
          { length: MAX_TRANSACTION_OPERATIONS + 1 },
          () => fixture.operations[0],
        ),
      }),
    ).rejects.toThrow(/operation count/);
    await expect(
      createPreparedKnowledgeTransaction({
        lock,
        transactionId,
        kind: "project-update",
        snapshot: {
          ...fixture.snapshot,
          sources: [
            {
              path: fixture.sourcePath,
              state: "absent",
            },
          ],
        },
        operations: [
          {
            action: "create",
            path: fixture.sourcePath,
            afterBytes: Buffer.alloc(MAX_TRANSACTION_PAYLOAD_BYTES + 1),
          },
        ],
      }),
    ).rejects.toThrow(/maximum payload size/);

    const sharedMaximumPayload = Buffer.alloc(MAX_TRANSACTION_PAYLOAD_BYTES);
    const totalLimitSources: KnowledgeTransactionSnapshot["sources"] = Array.from(
      { length: 17 },
      (_, index) => ({
        path: `docs/architecture-knowledge/changelog/entries/CG-CHANGE-${String(index + 1).padStart(3, "0")}.md`,
        state: "absent" as const,
      }),
    );
    const totalLimitOperations: KnowledgeTransactionOperationInput[] =
      totalLimitSources.map((entry) => ({
        action: "create",
        path: entry.path,
        afterBytes: sharedMaximumPayload,
      }));
    await expect(
      createPreparedKnowledgeTransaction({
        lock,
        transactionId,
        kind: "project-update",
        snapshot: {
          validationAsOf: "2026-08-01",
          requestSha256: REQUEST_HASH,
          packageSha256: null,
          sources: totalLimitSources,
        },
        operations: totalLimitOperations,
      }),
    ).rejects.toThrow(/maximum total payload size/);
    await releaseKnowledgeTransactionLock(lock);
  });
});

describe("scoped Knowledge writer control", () => {
  it("rejects a stored global-kind transaction before publishing scoped ownership", async () => {
    const root = await createGitFixture();
    const injected = dependencies();
    const transactionId = generateKnowledgeTransactionId(injected);
    const lock = await acquireKnowledgeTransactionLock({
      repoRoot: root,
      command: "prepare correction",
      transactionId,
      dependencies: injected,
    });
    const fixture = updateFixture();
    await createPreparedKnowledgeTransaction({
      lock,
      transactionId,
      kind: "correction",
      snapshot: fixture.snapshot,
      operations: fixture.operations,
      dependencies: injected,
    });
    await releaseKnowledgeTransactionLock(lock);

    await expect(
      acquireKnowledgeScopedWriterLock({
        repoRoot: root,
        command: "apply correction",
        transactionId,
        dependencies: injected,
      }),
    ).rejects.toThrow(/requires global writer protection/i);
    expect(inspectKnowledgeTransactionGuard({ repoRoot: root })).toMatchObject({
      activeScopedWriterCount: 0,
      recoveryArtifactsPresent: false,
    });
  });

  it("allows unrelated Issue and project updates while rejecting the same target", async () => {
    const root = await createGitFixture();
    const injected = dependencies();
    const firstTransactionId = await prepareScopedIssueTransaction(
      root,
      "CG-ISSUE-001",
      injected,
    );
    const secondTransactionId = await prepareScopedIssueTransaction(
      root,
      "CG-ISSUE-002",
      injected,
    );
    const conflictingTransactionId = await prepareScopedIssueTransaction(
      root,
      "CG-ISSUE-001",
      dependencies({ pid: 42_425 }),
    );
    const firstProjectPath =
      "docs/current-work/active/community-gallery/CG-WORK-001.md";
    const secondProjectPath =
      "docs/current-work/active/my-stories/MS-WORK-001.md";
    const firstProjectTransactionId = await prepareScopedProjectTransaction(
      root,
      firstProjectPath,
      injected,
    );
    const secondProjectTransactionId = await prepareScopedProjectTransaction(
      root,
      secondProjectPath,
      injected,
    );
    const conflictingProjectTransactionId = await prepareScopedProjectTransaction(
      root,
      firstProjectPath,
      dependencies({ pid: 42_426 }),
    );
    const first = await acquireKnowledgeScopedWriterLock({
      repoRoot: root,
      command: "apply issue-update",
      transactionId: firstTransactionId,
      dependencies: injected,
    });
    const second = await acquireKnowledgeScopedWriterLock({
      repoRoot: root,
      command: "apply issue-update",
      transactionId: secondTransactionId,
      dependencies: injected,
    });
    const firstProject = await acquireKnowledgeScopedWriterLock({
      repoRoot: root,
      command: "apply project-update",
      transactionId: firstProjectTransactionId,
      dependencies: injected,
    });
    const secondProject = await acquireKnowledgeScopedWriterLock({
      repoRoot: root,
      command: "apply project-update",
      transactionId: secondProjectTransactionId,
      dependencies: injected,
    });
    expect(inspectKnowledgeTransactionGuard({ repoRoot: root })).toMatchObject({
      activeScopedWriterCount: 4,
      ok: false,
    });

    await expect(
      acquireKnowledgeScopedWriterLock({
        repoRoot: root,
        command: "apply issue-update",
        transactionId: conflictingTransactionId,
        dependencies: injected,
      }),
    ).rejects.toThrow(/conflicts with transaction/i);
    await expect(
      acquireKnowledgeScopedWriterLock({
        repoRoot: root,
        command: "apply project-update",
        transactionId: conflictingProjectTransactionId,
        dependencies: injected,
      }),
    ).rejects.toThrow(/conflicts with transaction/i);

    await releaseKnowledgeScopedWriterLock(secondProject);
    await releaseKnowledgeScopedWriterLock(firstProject);
    await releaseKnowledgeScopedWriterLock(second);
    await releaseKnowledgeScopedWriterLock(first);
    expect(inspectKnowledgeTransactionGuard({ repoRoot: root })).toMatchObject({
      activeScopedWriterCount: 0,
      ok: true,
    });
  });

  it("blocks certification in both start orders and permits only the integrated commit gate", async () => {
    const root = await createGitFixture();
    const injected = dependencies();
    const transactionId = await prepareScopedIssueTransaction(
      root,
      "CG-ISSUE-001",
      injected,
    );
    const secondTransactionId = await prepareScopedIssueTransaction(
      root,
      "CG-ISSUE-002",
      injected,
    );
    const scoped = await acquireKnowledgeScopedWriterLock({
      repoRoot: root,
      command: "apply issue-update",
      transactionId,
      dependencies: injected,
    });
    await expect(
      acquireKnowledgeCertificationLease({
        repoRoot: root,
        command: "knowledge check",
        dependencies: injected,
      }),
    ).rejects.toThrow(/scoped writer/i);
    await expect(
      acquireKnowledgeTransactionLock({
        repoRoot: root,
        command: "apply transaction",
        transactionId,
        dependencies: injected,
      }),
    ).rejects.toThrow(/scoped writer/i);
    await expect(
      acquireKnowledgeTransactionCommitLock({
        scopedWriterLock: { ...scoped },
        command: "apply scoped commit",
      }),
    ).rejects.toThrow(/not active in this process/i);
    const commit = await acquireKnowledgeTransactionCommitLock({
      scopedWriterLock: scoped,
      command: "apply scoped commit",
    });
    await releaseKnowledgeTransactionLock(commit);
    await releaseKnowledgeScopedWriterLock(scoped);

    const lease = await acquireKnowledgeCertificationLease({
      repoRoot: root,
      command: "knowledge check",
      dependencies: injected,
    });
    await expect(
      acquireKnowledgeScopedWriterLock({
        repoRoot: root,
        command: "apply issue-update",
        transactionId: secondTransactionId,
        dependencies: injected,
      }),
    ).rejects.toThrow(/certification lease/i);
    await releaseKnowledgeCertificationLease(lease, { dependencies: injected });

    const global = await acquireKnowledgeTransactionLock({
      repoRoot: root,
      command: "apply closeout",
      dependencies: injected,
    });
    await expect(
      acquireKnowledgeScopedWriterLock({
        repoRoot: root,
        command: "apply issue-update",
        transactionId: secondTransactionId,
        dependencies: injected,
      }),
    ).rejects.toThrow(/writer|lock/i);
    await releaseKnowledgeTransactionLock(global);
  }, 15_000);

  it("recovers every interrupted scoped-lock publication without accepting partial ownership", async () => {
    const baselineRoot = await createGitFixture();
    const baselineEvents: TransactionStoreMutationEvent[] = [];
    const baselineDependencies = dependencies({
      afterStoreMutation: (event) => {
        if (event.scope === "scoped-writer") baselineEvents.push(event);
      },
    });
    const baselineTransactionId = await prepareScopedIssueTransaction(
      baselineRoot,
      "CG-ISSUE-001",
      baselineDependencies,
    );
    const baseline = await acquireKnowledgeScopedWriterLock({
      repoRoot: baselineRoot,
      command: "apply issue-update",
      transactionId: baselineTransactionId,
      dependencies: baselineDependencies,
    });
    const publicationMutations = baselineEvents.length;
    expect(publicationMutations).toBeGreaterThan(0);
    await releaseKnowledgeScopedWriterLock(baseline);

    for (let target = 1; target <= publicationMutations; target += 1) {
      const root = await createGitFixture();
      const interrupted = dependencies({
        pid: 170_000 + target,
        afterStoreMutation: failAtMutation("scoped-writer", target),
      });
      const transactionId = await prepareScopedIssueTransaction(
        root,
        "CG-ISSUE-001",
        dependencies({ pid: 169_000 + target }),
      );
      await expect(
        acquireKnowledgeScopedWriterLock({
          repoRoot: root,
          command: "apply issue-update",
          transactionId,
          dependencies: interrupted,
        }),
      ).rejects.toThrow(/Injected transaction-store interruption/);

      await expect(
        acquireKnowledgeTransactionLock({
          repoRoot: root,
          command: "status",
          dependencies: dependencies({
            pid: 171_000 + target,
            isPidAlive: () => false,
          }),
        }),
      ).rejects.toThrow(/explicit recovery|dead process|control recovery/i);
      const recovered = await acquireKnowledgeTransactionLock({
        repoRoot: root,
        command: "recover",
        recoveryCapable: true,
        dependencies: dependencies({
          pid: 172_000 + target,
          isPidAlive: () => false,
        }),
      });
      await releaseKnowledgeTransactionLock(recovered);
      expect(inspectKnowledgeTransactionGuard({ repoRoot: root })).toMatchObject({
        activeScopedWriterCount: 0,
        recoveryArtifactsPresent: false,
      });
    }
  }, 30_000);

  it("recovers a killed scoped-lock release at every explicit deletion boundary", async () => {
    for (let target = 0; target < DIRECTORY_REMOVAL_EVENT_KINDS.length; target += 1) {
      const root = await createGitFixture();
      const killed = await runKilledStoreScenario({
        root,
        scenario: "scoped-release",
        scope: "scoped-writer",
        kind: DIRECTORY_REMOVAL_EVENT_KINDS[target],
      });
      expect(killed.events.map((event) => event.kind)).toEqual(
        DIRECTORY_REMOVAL_EVENT_KINDS.slice(0, target + 1),
      );
      const recovered = await acquireKnowledgeTransactionLock({
        repoRoot: root,
        command: "recover",
        recoveryCapable: true,
        dependencies: dependencies({
          pid: 173_000 + target,
          isPidAlive: () => false,
        }),
      });
      await releaseKnowledgeTransactionLock(recovered);
      expect(inspectKnowledgeTransactionGuard({ repoRoot: root })).toMatchObject({
        activeScopedWriterCount: 0,
        recoveryArtifactsPresent: false,
      });
    }
  }, 60_000);

  it("fails closed on malformed, tampered, wrongly-permissioned, and unknown scoped artifacts", async () => {
    const root = await createGitFixture();
    const injected = dependencies();
    const transactionId = await prepareScopedIssueTransaction(
      root,
      "CG-ISSUE-001",
      injected,
    );
    const scoped = await acquireKnowledgeScopedWriterLock({
      repoRoot: root,
      command: "apply issue-update",
      transactionId,
      dependencies: injected,
    });
    const metadataPath = path.join(scoped.lockDirectory, "lock.json");
    const original = await readFile(metadataPath);
    await chmod(metadataPath, 0o644);
    expect(() => inspectKnowledgeTransactionGuard({ repoRoot: root })).toThrow(
      /unsafe|malformed/i,
    );
    await chmod(metadataPath, 0o600);
    const parsed = JSON.parse(original.toString("utf8"));
    await writeFile(
      metadataPath,
      `${JSON.stringify({ ...parsed, command: "tampered" })}\n`,
      { mode: 0o600 },
    );
    expect(() => inspectKnowledgeTransactionGuard({ repoRoot: root })).toThrow(
      /hash|safe/i,
    );
    const otherTransactionId = generateKnowledgeTransactionId(
      dependencies({ pid: 62_001 }),
    );
    const mismatchedIdentity = knowledgeControlMetadataWithHash({
      ...parsed,
      transactionId: otherTransactionId,
      metadataSha256: undefined,
    });
    await writeFile(
      metadataPath,
      `${canonicalKnowledgeControlJson(mismatchedIdentity)}\n`,
      { mode: 0o600 },
    );
    await expect(releaseKnowledgeScopedWriterLock(scoped)).rejects.toThrow(
      /ownership changed/i,
    );
    const unsupportedScope = knowledgeControlMetadataWithHash({
      ...parsed,
      scopes: ["record:docs/architecture-knowledge/issues/other/OTHER-001.md"],
      metadataSha256: undefined,
    });
    await writeFile(
      metadataPath,
      `${canonicalKnowledgeControlJson(unsupportedScope)}\n`,
      { mode: 0o600 },
    );
    expect(() => inspectKnowledgeTransactionGuard({ repoRoot: root })).toThrow(
      /malformed/i,
    );
    await writeFile(metadataPath, original, { mode: 0o600 });
    const unknown = path.join(scoped.scopedRoot, "unknown");
    await mkdir(unknown, { mode: 0o700 });
    expect(() => inspectKnowledgeTransactionGuard({ repoRoot: root })).toThrow(
      /unrecognized/i,
    );
    await rm(unknown, { recursive: true, force: true });
    await releaseKnowledgeScopedWriterLock(scoped);
  });

  it("rejects a symlinked scoped-writer control root", async () => {
    const root = await createGitFixture();
    const transactionId = await prepareScopedIssueTransaction(
      root,
      "CG-ISSUE-001",
    );
    const paths = await resolveKnowledgeTransactionPaths(root, {
      createTransactionRoot: true,
    });
    const outside = await mkdtemp(path.join(await realpath(os.tmpdir()), "scoped-outside-"));
    roots.push(outside);
    await chmod(outside, 0o700);
    const scopedRoot = path.join(paths.transactionRoot, "scoped-writers");
    await symlink(outside, scopedRoot, "dir");

    await expect(
      acquireKnowledgeScopedWriterLock({
        repoRoot: root,
        command: "apply issue-update",
        transactionId,
        dependencies: dependencies(),
      }),
    ).rejects.toThrow(/real directory|symbolic link|unsafe|unrecognized/i);
    expect(() => inspectKnowledgeTransactionGuard({ repoRoot: root })).toThrow(
      /directory|symbolic link|unsafe|unrecognized/i,
    );
  });

  it("requires explicit recovery for a dead scoped owner and removes it exactly", async () => {
    const root = await createGitFixture();
    const live = dependencies({ pid: 61_001, isPidAlive: () => true });
    const transactionId = await prepareScopedIssueTransaction(
      root,
      "CG-ISSUE-001",
      live,
    );
    await acquireKnowledgeScopedWriterLock({
      repoRoot: root,
      command: "apply issue-update",
      transactionId,
      dependencies: live,
    });
    const dead = dependencies({ pid: 61_002, isPidAlive: () => false });
    await expect(
      acquireKnowledgeTransactionLock({
        repoRoot: root,
        command: "recover transaction",
        recoveryCapable: false,
        dependencies: dead,
      }),
    ).rejects.toThrow(/dead scoped writer requires explicit recovery/i);
    const recovery = await acquireKnowledgeTransactionLock({
      repoRoot: root,
      command: "recover transaction",
      recoveryCapable: true,
      dependencies: dead,
    });
    await releaseKnowledgeTransactionLock(recovery);
    expect(inspectKnowledgeTransactionGuard({ repoRoot: root })).toMatchObject({
      activeScopedWriterCount: 0,
      recoveryArtifactsPresent: false,
    });
  });
});

describe("knowledge transaction Git metadata resolution", () => {
  it("uses the real Git metadata directory when a worktree has a .git file", async () => {
    const root = await createGitFixture();
    execFileSync("git", ["-c", "user.name=Fixture", "-c", "user.email=fixture@example.com", "commit", "--allow-empty", "-m", "fixture", "-q"], { cwd: root });
    const worktree = `${root}-worktree`;
    roots.push(worktree);
    execFileSync("git", ["worktree", "add", "-q", "-b", "fixture-worktree", worktree], {
      cwd: root,
    });
    expect((await lstat(path.join(worktree, ".git"))).isFile()).toBe(true);
    const resolved = await resolveKnowledgeTransactionPaths(worktree, {
      createTransactionRoot: true,
    });
    expect(resolved.gitDirectory).not.toBe(path.join(worktree, ".git"));
    expect(resolved.transactionRoot).toBe(
      path.join(resolved.gitDirectory, "chronicle-knowledge-transactions"),
    );
  });
});
