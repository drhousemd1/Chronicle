import { execFileSync, spawnSync } from "node:child_process";
import {
  access,
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

import {
  KNOWLEDGE_CERTIFICATION_LEASE_ENVIRONMENT_KEY,
  KNOWLEDGE_CONTROL_STORE_VERSION,
  knowledgeControlHostFingerprint,
  knowledgeControlMetadataWithHash,
} from "../../../scripts/knowledge-record-control-contract.mjs";
import { KNOWLEDGE_COMMAND_BOUNDARIES } from "../../../scripts/knowledge-command-boundaries";

const REPOSITORY_ROOT = process.cwd();
const GUARD_SCRIPT_PATH = path.resolve(
  REPOSITORY_ROOT,
  "scripts/assert-no-unfinished-knowledge-transaction.mjs",
);
const GUARD_MODULE_URL = pathToFileURL(
  path.resolve(
    REPOSITORY_ROOT,
    "scripts/knowledge-record-transaction-guard.mjs",
  ),
).href;
const PACKAGE_JSON_PATH = path.resolve(REPOSITORY_ROOT, "package.json");
const VITE_NODE = path.resolve(REPOSITORY_ROOT, "node_modules/.bin/vite-node");
const TRANSACTION_ID = "kr-20260801T123456789Z-0123456789abcdef";
const LEASE_ID = "a".repeat(32);
const OWNER_LOCK_ID = "b".repeat(32);
const FIXED_TIME = "2026-08-01T12:34:56.789Z";
const roots: string[] = [];

const EXPECTED_PACKAGE_SCRIPTS = Object.freeze(Object.fromEntries(
  KNOWLEDGE_COMMAND_BOUNDARIES.map(({ script, command }) => [script, command]),
));

const DIRECT_GUARDED_ENTRY_POINTS = [
  {
    sourcePath: "scripts/validate-architecture-knowledge.mjs",
    expectedCommand: "knowledge-check",
    firstProtectedWork: "fs.readFileSync(manifestPath",
    executable: process.execPath,
  },
  {
    sourcePath: "scripts/validate-chronicle-operational-records.ts",
    expectedCommand: "knowledge-operational-check",
    firstProtectedWork: "readCanonicalSourceInventory(process.cwd())",
    executable: VITE_NODE,
  },
  {
    sourcePath: "scripts/refresh-architecture-paths.mjs",
    expectedCommand: "architecture-refresh",
    firstProtectedWork: "fs.readdirSync",
    executable: process.execPath,
  },
  {
    sourcePath: "scripts/validate-chronicle-work-manual.ts",
    expectedCommand: "knowledge-work-manual-check",
    firstProtectedWork: "fs.readFileSync(filePath",
    executable: VITE_NODE,
  },
  {
    sourcePath: "scripts/run-quality-hub-scan.mjs",
    expectedCommand: "quality-scan",
    firstProtectedWork: "for (const check of checks)",
    executable: process.execPath,
  },
] as const;

async function createGitFixture() {
  const temporaryRoot = await realpath(os.tmpdir());
  const root = await mkdtemp(
    path.join(temporaryRoot, "chronicle-knowledge-guard-"),
  );
  roots.push(root);
  execFileSync("git", ["init", "-q"], { cwd: root });
  return root;
}

function withoutCertificationEnvironment() {
  const environment = { ...process.env };
  delete environment[KNOWLEDGE_CERTIFICATION_LEASE_ENVIRONMENT_KEY];
  return environment;
}

function runGuard(root: string) {
  return spawnSync(process.execPath, [GUARD_SCRIPT_PATH, root], {
    cwd: root,
    encoding: "utf8",
    env: withoutCertificationEnvironment(),
  });
}

function currentProcessGroupId() {
  const raw = execFileSync(
    "ps",
    ["-o", "pgid=", "-p", String(process.pid)],
    { encoding: "utf8" },
  ).trim();
  const processGroupId = Number(raw);
  if (!Number.isSafeInteger(processGroupId) || processGroupId <= 0) {
    throw new Error("Test process group could not be resolved.");
  }
  return processGroupId;
}

function ownerToken({
  lockId = OWNER_LOCK_ID,
  pid = process.pid,
  hostname = os.hostname(),
}: Readonly<{
  lockId?: string;
  pid?: number;
  hostname?: string;
}> = {}) {
  return `${lockId}-${pid}-${knowledgeControlHostFingerprint(hostname)}`;
}

async function ensureTransactionRoot(root: string) {
  const transactionRoot = path.join(
    root,
    ".git",
    "chronicle-knowledge-transactions",
  );
  await mkdir(transactionRoot, { recursive: true, mode: 0o700 });
  await chmod(transactionRoot, 0o700);
  return transactionRoot;
}

async function writePrivateJson(
  filePath: string,
  value: Record<string, unknown>,
) {
  await writeFile(filePath, `${JSON.stringify(value)}\n`, { mode: 0o600 });
  await chmod(filePath, 0o600);
}

async function createCommittedTransaction(
  root: string,
  marker: Record<string, unknown> | null = null,
) {
  const transactionRoot = await ensureTransactionRoot(root);
  const transactionDirectory = path.join(transactionRoot, TRANSACTION_ID);
  const payloadDirectory = path.join(transactionDirectory, "payloads");
  const receiptDirectory = path.join(
    transactionDirectory,
    "terminal-receipts",
  );
  await mkdir(payloadDirectory, { recursive: true, mode: 0o700 });
  await mkdir(receiptDirectory, { mode: 0o700 });
  await Promise.all([
    chmod(transactionDirectory, 0o700),
    chmod(payloadDirectory, 0o700),
    chmod(receiptDirectory, 0o700),
  ]);
  await writePrivateJson(
    path.join(transactionDirectory, "manifest.json"),
    {},
  );
  await writeFile(path.join(transactionDirectory, "journal.jsonl"), "", {
    mode: 0o600,
  });
  await chmod(path.join(transactionDirectory, "journal.jsonl"), 0o600);
  if (marker) {
    await writePrivateJson(
      path.join(transactionDirectory, "unfinished.json"),
      marker,
    );
  }
  return { transactionRoot, transactionDirectory };
}

function validUnfinishedMarker(
  overrides: Record<string, unknown> = {},
) {
  return knowledgeControlMetadataWithHash({
    storeVersion: KNOWLEDGE_CONTROL_STORE_VERSION,
    transactionId: TRANSACTION_ID,
    phase: "apply",
    createdAt: FIXED_TIME,
    ...overrides,
  });
}

async function writeWriterLock(
  root: string,
  metadata: Record<string, unknown> | null = null,
) {
  const transactionRoot = await ensureTransactionRoot(root);
  const lockDirectory = path.join(transactionRoot, "writer-lock");
  await mkdir(lockDirectory, { mode: 0o700 });
  await chmod(lockDirectory, 0o700);
  await writePrivateJson(
    path.join(lockDirectory, "lock.json"),
    metadata ??
      knowledgeControlMetadataWithHash({
        storeVersion: KNOWLEDGE_CONTROL_STORE_VERSION,
        lockId: OWNER_LOCK_ID,
        pid: process.pid,
        hostname: os.hostname(),
        startedAt: FIXED_TIME,
        command: "guard test writer",
        transactionId: null,
      }),
  );
}

async function writeScopedWriter(root: string) {
  const transactionRoot = await ensureTransactionRoot(root);
  const scopedRoot = path.join(transactionRoot, "scoped-writers");
  const lockDirectory = path.join(scopedRoot, `writer-${OWNER_LOCK_ID}`);
  await mkdir(lockDirectory, { recursive: true, mode: 0o700 });
  await Promise.all([chmod(scopedRoot, 0o700), chmod(lockDirectory, 0o700)]);
  await writePrivateJson(
    path.join(lockDirectory, "lock.json"),
    knowledgeControlMetadataWithHash({
      storeVersion: KNOWLEDGE_CONTROL_STORE_VERSION,
      lockId: OWNER_LOCK_ID,
      pid: process.pid,
      hostname: os.hostname(),
      startedAt: FIXED_TIME,
      command: "apply issue-update",
      transactionId: TRANSACTION_ID,
      scopes: [
        "record:docs/architecture-knowledge/issues/community-gallery/CG-ISSUE-001.md",
      ],
    }),
  );
}

async function writeCertificationLease(
  root: string,
  options: Readonly<{
    leaseId?: string;
    command?: string;
    ownerPid?: number;
    protectedChildPid?: number | null;
    protectedProcessGroupId?: number | null;
    metadata?: Record<string, unknown>;
  }> = {},
) {
  const leaseId = options.leaseId ?? LEASE_ID;
  const transactionRoot = await ensureTransactionRoot(root);
  const leaseRoot = path.join(transactionRoot, "certification-leases");
  const leaseDirectory = path.join(leaseRoot, `lease-${leaseId}`);
  await mkdir(leaseDirectory, { recursive: true, mode: 0o700 });
  await Promise.all([
    chmod(leaseRoot, 0o700),
    chmod(leaseDirectory, 0o700),
  ]);
  const metadata =
    options.metadata ??
    knowledgeControlMetadataWithHash({
      storeVersion: KNOWLEDGE_CONTROL_STORE_VERSION,
      leaseId,
      pid: options.ownerPid ?? process.pid,
      hostname: os.hostname(),
      startedAt: FIXED_TIME,
      command: options.command ?? "knowledge-check",
      protectedChildPid:
        options.protectedChildPid === undefined
          ? process.pid
          : options.protectedChildPid,
      protectedProcessGroupId:
        options.protectedProcessGroupId === undefined
          ? currentProcessGroupId()
          : options.protectedProcessGroupId,
    });
  await writePrivateJson(path.join(leaseDirectory, "lease.json"), metadata);
  return { leaseId, leaseDirectory };
}

function runContextProbe(
  root: string,
  expectedCommand: string,
  leaseId = LEASE_ID,
) {
  const source = [
    `import { assertActiveKnowledgeCertificationContext } from ${JSON.stringify(GUARD_MODULE_URL)};`,
    `assertActiveKnowledgeCertificationContext({ repoRoot: process.cwd(), expectedCommand: ${JSON.stringify(expectedCommand)} });`,
    'process.stdout.write("context-ok");',
  ].join("\n");
  return spawnSync(
    process.execPath,
    ["--input-type=module", "--eval", source],
    {
      cwd: root,
      encoding: "utf8",
      env: {
        ...withoutCertificationEnvironment(),
        [KNOWLEDGE_CERTIFICATION_LEASE_ENVIRONMENT_KEY]: leaseId,
      },
    },
  );
}

afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

describe("knowledge transaction package-script guard", () => {
  it("pins every classified package route to its exact command boundary", async () => {
    const packageJson = JSON.parse(
      await readFile(PACKAGE_JSON_PATH, "utf8"),
    ) as { scripts?: Record<string, string> };

    for (const [scriptName, expectedCommand] of Object.entries(
      EXPECTED_PACKAGE_SCRIPTS,
    )) {
      expect(packageJson.scripts?.[scriptName], scriptName).toBe(
        expectedCommand,
      );
    }
  });

  it("keeps the full builds and Knowledge-bearing checks protected without wrapping independent commands", () => {
    const byScript = new Map(
      KNOWLEDGE_COMMAND_BOUNDARIES.map((entry) => [entry.script, entry]),
    );
    for (const script of [
      "build",
      "build:dev",
      "architecture:refresh",
      "knowledge:check",
      "knowledge:operational:check",
      "knowledge:work-manual:check",
      "quality:scan",
      "test",
      "test:watch",
      "test:coverage",
      "test:e2e",
      "validation:gate",
      "graph:history",
      "graph:check",
    ]) {
      expect(byScript.get(script)?.protection, script).toBe("knowledge-certification");
      expect(byScript.get(script)?.command, script).toContain(
        "run-with-knowledge-certification-lease.ts",
      );
    }
    for (const entry of KNOWLEDGE_COMMAND_BOUNDARIES.filter(
      ({ protection }) => protection === "independent",
    )) {
      expect(entry.command, entry.script).not.toContain(
        "run-with-knowledge-certification-lease.ts",
      );
    }
    for (const entry of KNOWLEDGE_COMMAND_BOUNDARIES.filter(
      ({ protection }) => protection === "nested",
    )) {
      expect(entry.command, entry.script).not.toContain(
        "run-with-knowledge-certification-lease.ts",
      );
    }
  });

  it("keeps the Quality Hub scan on one outer Knowledge snapshot without nested certification leases", async () => {
    const source = await readFile(
      path.resolve(REPOSITORY_ROOT, "scripts/run-quality-hub-scan.mjs"),
      "utf8",
    );
    expect(source).toContain('["node_modules/vitest/vitest.mjs", "run"]');
    expect(source).toContain('["node_modules/vite/bin/vite.js", "build"]');
    expect(source).not.toContain('args: ["run", "test"]');
    expect(source).not.toContain('args: ["run", "build"]');
    expect(source).not.toContain("run-with-knowledge-certification-lease.ts");
  });

  it("requires the exact active context before the ordinary guard and protected work", async () => {
    for (const entryPoint of DIRECT_GUARDED_ENTRY_POINTS) {
      const source = await readFile(
        path.resolve(REPOSITORY_ROOT, entryPoint.sourcePath),
        "utf8",
      );
      const activeCallIndex = source.indexOf(
        "assertActiveKnowledgeCertificationContext(",
      );
      const commandIndex = source.indexOf(
        `expectedCommand: "${entryPoint.expectedCommand}"`,
      );
      const ordinaryCallIndex = source.indexOf(
        "assertNoUnfinishedKnowledgeTransaction(",
      );
      const protectedWorkIndex = source.indexOf(
        entryPoint.firstProtectedWork,
      );

      expect(activeCallIndex, entryPoint.sourcePath).toBeGreaterThanOrEqual(0);
      expect(commandIndex, entryPoint.sourcePath).toBeGreaterThan(
        activeCallIndex,
      );
      expect(ordinaryCallIndex, entryPoint.sourcePath).toBeGreaterThan(
        commandIndex,
      );
      expect(protectedWorkIndex, entryPoint.sourcePath).toBeGreaterThan(
        ordinaryCallIndex,
      );
    }
  });

  it.each(DIRECT_GUARDED_ENTRY_POINTS)(
    "rejects direct $sourcePath execution before repository work",
    async (entryPoint) => {
      const root = await createGitFixture();
      const result = spawnSync(
        entryPoint.executable,
        [path.resolve(REPOSITORY_ROOT, entryPoint.sourcePath)],
        {
          cwd: root,
          encoding: "utf8",
          env: withoutCertificationEnvironment(),
        },
      );
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain(
        "Knowledge certification context is missing or invalid.",
      );
      expect(result.stdout).not.toMatch(/passed|Generated/);
      await expect(access(path.join(root, "src"))).rejects.toThrow();
    },
  );
});

describe("active Knowledge certification context", () => {
  it("accepts one exact, attached, live lease owned by the runner parent", async () => {
    const root = await createGitFixture();
    await writeCertificationLease(root);
    const result = runContextProbe(root, "knowledge-check");
    expect(result.status).toBe(0);
    expect(result.stdout).toBe("context-ok");
    expect(result.stderr).toBe("");
  });

  it("rejects a wrong lease ID without disclosing it", async () => {
    const root = await createGitFixture();
    await writeCertificationLease(root);
    const wrongLeaseId = "c".repeat(32);
    const result = runContextProbe(root, "knowledge-check", wrongLeaseId);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(
      "Knowledge certification context is missing or invalid.",
    );
    expect(result.stderr).not.toContain(wrongLeaseId);
  });

  it("rejects a wrong command label without disclosing it", async () => {
    const root = await createGitFixture();
    await writeCertificationLease(root);
    const wrongCommand = "knowledge-operational-check";
    const result = runContextProbe(root, wrongCommand);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(
      "Knowledge certification context is missing or invalid.",
    );
    expect(result.stderr).not.toContain(wrongCommand);
  });

  it("rejects a live attached process that is not the direct parent", async () => {
    const root = await createGitFixture();
    await writeCertificationLease(root, {
      protectedChildPid: process.ppid,
    });
    const result = runContextProbe(root, "knowledge-check");
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(
      "Knowledge certification context is missing or invalid.",
    );
  });

  it("rejects self-hashed lease metadata with an extra field", async () => {
    const root = await createGitFixture();
    const malformed = knowledgeControlMetadataWithHash({
      storeVersion: KNOWLEDGE_CONTROL_STORE_VERSION,
      leaseId: LEASE_ID,
      pid: process.pid,
      hostname: os.hostname(),
      startedAt: FIXED_TIME,
      command: "knowledge-check",
      protectedChildPid: process.pid,
      protectedProcessGroupId: currentProcessGroupId(),
      extra: "unsupported",
    });
    await writeCertificationLease(root, { metadata: malformed });
    const result = runContextProbe(root, "knowledge-check");
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(
      "Knowledge certification context is missing or invalid.",
    );
    expect(result.stderr).not.toContain("unsupported");
  });

  it.each(["writer", "unfinished", "recovery"] as const)(
    "rejects an otherwise valid context when %s control state coexists",
    async (conflict) => {
      const root = await createGitFixture();
      await writeCertificationLease(root);
      if (conflict === "writer") {
        await writeWriterLock(root);
      } else if (conflict === "unfinished") {
        await createCommittedTransaction(root, validUnfinishedMarker());
      } else {
        const transactionRoot = await ensureTransactionRoot(root);
        const recoveryDirectory = path.join(
          transactionRoot,
          `.removing-writer-lock-${ownerToken()}`,
        );
        await mkdir(recoveryDirectory, { mode: 0o700 });
        await chmod(recoveryDirectory, 0o700);
      }
      const result = runContextProbe(root, "knowledge-check");
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain(
        "Knowledge certification context is missing or invalid.",
      );
    },
  );
});

describe("read-only Knowledge transaction control inspection", () => {
  it("passes without creating transaction storage when no work is unfinished", async () => {
    const root = await createGitFixture();
    const result = runGuard(root);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain(
      "no global or scoped writer and no unfinished transactions",
    );
    expect(result.stderr).toBe("");
    await expect(
      access(path.join(root, ".git", "chronicle-knowledge-transactions")),
    ).rejects.toThrow();
  });

  it("blocks on an exact, live writer lock", async () => {
    const root = await createGitFixture();
    await writeWriterLock(root);
    const result = runGuard(root);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("transaction writer lock is active");
  });

  it("blocks on an exact live scoped writer with a useful reason", async () => {
    const root = await createGitFixture();
    await writeScopedWriter(root);
    const result = runGuard(root);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("1 scoped record writer is active");
  });

  it("rejects self-hashed writer metadata with an unsupported field", async () => {
    const root = await createGitFixture();
    await writeWriterLock(
      root,
      knowledgeControlMetadataWithHash({
        storeVersion: KNOWLEDGE_CONTROL_STORE_VERSION,
        lockId: OWNER_LOCK_ID,
        pid: process.pid,
        hostname: os.hostname(),
        startedAt: FIXED_TIME,
        command: "guard test writer",
        transactionId: null,
        extra: "private-writer-bytes",
      }),
    );
    const result = runGuard(root);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("unsupported fields");
    expect(result.stderr).not.toContain("private-writer-bytes");
  });

  it("reports only a strictly valid unfinished transaction identity", async () => {
    const root = await createGitFixture();
    await createCommittedTransaction(root, validUnfinishedMarker());
    const result = runGuard(root);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(`recovery is required for ${TRANSACTION_ID}`);
    expect(result.stderr).not.toContain("createdAt");
  });

  it("rejects self-hashed unfinished metadata with unsupported fields", async () => {
    const root = await createGitFixture();
    await createCommittedTransaction(
      root,
      validUnfinishedMarker({ extra: "not allowed" }),
    );
    const result = runGuard(root);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("unsupported fields");
    expect(result.stderr).not.toContain("not allowed");
  });

  it("rejects unfinished metadata whose hash does not match its contents", async () => {
    const root = await createGitFixture();
    await createCommittedTransaction(root, {
      ...validUnfinishedMarker(),
      metadataSha256: "0".repeat(64),
    });
    const result = runGuard(root);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("metadata hash does not match");
  });

  it("rejects an unfinished marker whose identity does not match its directory", async () => {
    const root = await createGitFixture();
    await createCommittedTransaction(
      root,
      validUnfinishedMarker({
        transactionId: "kr-20260801T123456789Z-fedcba9876543210",
      }),
    );
    const result = runGuard(root);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("unfinished marker is malformed");
  });

  it("fails closed on unknown content inside a committed transaction", async () => {
    const root = await createGitFixture();
    const { transactionDirectory } = await createCommittedTransaction(root);
    await writeFile(path.join(transactionDirectory, "unknown-control.tmp"), "x", {
      mode: 0o600,
    });
    const result = runGuard(root);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("transaction inventory is malformed");
    expect(result.stderr).not.toContain("unknown-control.tmp");
  });

  it("fails closed on a symbolic-link transaction directory", async () => {
    const root = await createGitFixture();
    const transactionRoot = await ensureTransactionRoot(root);
    const outside = path.join(root, "outside");
    await mkdir(outside, { mode: 0o700 });
    await symlink(outside, path.join(transactionRoot, TRANSACTION_ID));
    const result = runGuard(root);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("unrecognized artifact");
  });

  it("fails closed on an owner-readable marker with the wrong mode", async () => {
    const root = await createGitFixture();
    const { transactionDirectory } = await createCommittedTransaction(
      root,
      validUnfinishedMarker(),
    );
    await chmod(path.join(transactionDirectory, "unfinished.json"), 0o640);
    const result = runGuard(root);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("unfinished marker is unsafe");
  });

  it.each(["reclaimed", "removing"])(
    "recognizes the current .%s-writer-lock owner format as recovery",
    async (phase) => {
      const root = await createGitFixture();
      const transactionRoot = await ensureTransactionRoot(root);
      const recoveryDirectory = path.join(
        transactionRoot,
        `.${phase}-writer-lock-${ownerToken()}`,
      );
      await mkdir(recoveryDirectory, { mode: 0o700 });
      await chmod(recoveryDirectory, 0o700);
      const result = runGuard(root);
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain(
        "interrupted transaction-control artifact",
      );
    },
  );

  it("rejects the stale pre-owner writer recovery name", async () => {
    const root = await createGitFixture();
    const transactionRoot = await ensureTransactionRoot(root);
    await mkdir(path.join(transactionRoot, `.reclaimed-${"d".repeat(32)}`), {
      mode: 0o700,
    });
    const result = runGuard(root);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("unrecognized artifact");
  });

  it("fails closed on a malformed current writer transition", async () => {
    const root = await createGitFixture();
    const transactionRoot = await ensureTransactionRoot(root);
    await mkdir(path.join(transactionRoot, ".preparing-writer-lock-invalid"), {
      mode: 0o700,
    });
    const result = runGuard(root);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("unrecognized artifact");
  });

  it("fails closed when a lease transition owner does not match its lease", async () => {
    const root = await createGitFixture();
    const transactionRoot = await ensureTransactionRoot(root);
    const leaseRoot = path.join(transactionRoot, "certification-leases");
    await mkdir(leaseRoot, { mode: 0o700 });
    await chmod(leaseRoot, 0o700);
    const transitionDirectory = path.join(
      leaseRoot,
      `.preparing-certification-lease-${LEASE_ID}-${ownerToken()}`,
    );
    await mkdir(transitionDirectory, { mode: 0o700 });
    await chmod(transitionDirectory, 0o700);
    const result = runGuard(root);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("lease transition is unsafe");
  });

  it("allows a recognized pending lease replacement only while its owner is live", async () => {
    const root = await createGitFixture();
    const { leaseDirectory } = await writeCertificationLease(root);
    const pendingName = `.pending-replace-${Buffer.from("lease.json").toString("base64url")}-${ownerToken()}.tmp`;
    await writeFile(path.join(leaseDirectory, pendingName), "pending", {
      mode: 0o600,
    });
    await chmod(path.join(leaseDirectory, pendingName), 0o600);
    const result = runGuard(root);
    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
  });

  it("requires recovery for a recognized pending lease replacement whose owner is dead", async () => {
    const root = await createGitFixture();
    const { leaseDirectory } = await writeCertificationLease(root);
    const pendingName = `.pending-replace-${Buffer.from("lease.json").toString("base64url")}-${ownerToken({ pid: 99_999_999 })}.tmp`;
    await writeFile(path.join(leaseDirectory, pendingName), "pending", {
      mode: 0o600,
    });
    await chmod(path.join(leaseDirectory, pendingName), 0o600);
    const result = runGuard(root);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(
      "interrupted transaction-control artifact",
    );
  });
});
