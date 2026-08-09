import { spawn, type ChildProcess } from "node:child_process";
import { access, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { prepareKnowledgeRecordTransaction } from "../../../scripts/knowledge-records/engine";
import {
  acquireKnowledgeTransactionLock,
  markKnowledgeTransactionUnfinished,
  releaseKnowledgeTransactionLock,
} from "../../../scripts/knowledge-records/transaction-store";
import {
  KNOWLEDGE_TRANSACTION_FIXTURE_AS_OF,
  createKnowledgeRecordTransactionTestRepository,
  createProjectUpdateRequestPackage,
} from "./knowledge-record-transaction-test-fixtures";

const PROJECT_ROOT = process.cwd();
const VITE_NODE = path.join(PROJECT_ROOT, "node_modules/.bin/vite-node");
const RUNNER = path.join(
  PROJECT_ROOT,
  "scripts/run-with-knowledge-certification-lease.ts",
);
const WAITING_CHILD = `
const fs = require("node:fs");
const ready = process.argv[1];
const release = process.argv[2];
fs.writeFileSync(ready, "ready");
const timer = setInterval(() => {
  if (fs.existsSync(release)) {
    clearInterval(timer);
    process.exit(0);
  }
}, 10);
`;

type Cleanup = () => Promise<void>;
const cleanups: Cleanup[] = [];
const children = new Set<ChildProcess>();

afterEach(async () => {
  for (const child of children) {
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
  }
  children.clear();
  for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
});

async function waitForPath(filePath: string) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    try {
      await access(filePath);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
  }
  throw new Error(`Timed out waiting for ${path.basename(filePath)}.`);
}

function childResult(child: ChildProcess) {
  return new Promise<Readonly<{
    exitCode: number | null;
    signal: NodeJS.Signals | null;
    stdout: string;
    stderr: string;
  }>>((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    if (!child.stdout || !child.stderr) {
      reject(new Error("Certification test child has no output pipes."));
      return;
    }
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });
    child.once("error", reject);
    child.once("exit", (exitCode, signal) => {
      children.delete(child);
      resolve({ exitCode, signal, stdout, stderr });
    });
  });
}

function startWaitingCertification(
  repoRoot: string,
  name: string,
) {
  const readyPath = path.join(repoRoot, `${name}.ready`);
  const releasePath = path.join(repoRoot, `${name}.release`);
  const child = spawn(
    VITE_NODE,
    [
      RUNNER,
      name,
      "--",
      process.execPath,
      "-e",
      WAITING_CHILD,
      readyPath,
      releasePath,
    ],
    {
      cwd: repoRoot,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  children.add(child);
  return Object.freeze({
    child,
    readyPath,
    releasePath,
    result: childResult(child),
  });
}

async function fixtureRepository() {
  const repository = await createKnowledgeRecordTransactionTestRepository();
  cleanups.push(repository.cleanup);
  return repository;
}

describe("full-duration Knowledge certification runner", () => {
  it("blocks a writer for the entire protected child command", async () => {
    const repository = await fixtureRepository();
    const protectedCommand = startWaitingCertification(
      repository.repoRoot,
      "lease-duration",
    );
    await waitForPath(protectedCommand.readyPath);

    await expect(
      acquireKnowledgeTransactionLock({
        repoRoot: repository.repoRoot,
        command: "writer during certification",
      }),
    ).rejects.toThrow(/blocked by a live certification lease/);

    await writeFile(protectedCommand.releasePath, "release");
    await expect(protectedCommand.result).resolves.toMatchObject({
      exitCode: 0,
      signal: null,
      stderr: "",
    });

    const lock = await acquireKnowledgeTransactionLock({
      repoRoot: repository.repoRoot,
      command: "writer after certification",
    });
    await releaseKnowledgeTransactionLock(lock);
  });

  it("releases its certification lease after the protected command fails", async () => {
    const repository = await fixtureRepository();
    const failing = spawn(
      VITE_NODE,
      [
        RUNNER,
        "lease-failing-child",
        "--",
        process.execPath,
        "-e",
        "process.exit(7)",
      ],
      {
        cwd: repository.repoRoot,
        env: process.env,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    children.add(failing);
    await expect(childResult(failing)).resolves.toMatchObject({
      exitCode: 7,
      signal: null,
      stderr: "",
    });

    const lock = await acquireKnowledgeTransactionLock({
      repoRoot: repository.repoRoot,
      command: "writer after failed certification",
    });
    await releaseKnowledgeTransactionLock(lock);
  });

  it("waits for a briefly lingering protected process group before releasing its lease", async () => {
    const repository = await fixtureRepository();
    const lingeringProcess = [
      'const { spawn } = require("node:child_process");',
      'const child = spawn(process.execPath, ["-e", "setTimeout(() => process.exit(0), 250)"], { stdio: "ignore" });',
      "child.unref();",
    ].join("\n");
    const protectedCommand = spawn(
      VITE_NODE,
      [
        RUNNER,
        "lease-lingering-process-group",
        "--",
        process.execPath,
        "-e",
        lingeringProcess,
      ],
      {
        cwd: repository.repoRoot,
        env: process.env,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    children.add(protectedCommand);

    await expect(childResult(protectedCommand)).resolves.toMatchObject({
      exitCode: 0,
      signal: null,
      stderr: "",
    });

    const lock = await acquireKnowledgeTransactionLock({
      repoRoot: repository.repoRoot,
      command: "writer after lingering process group",
    });
    await releaseKnowledgeTransactionLock(lock);
  });

  it(
    "allows multiple protected readers while still blocking writers",
    async () => {
      const repository = await fixtureRepository();
      const first = startWaitingCertification(repository.repoRoot, "lease-reader-one");
      await waitForPath(first.readyPath);
      const second = startWaitingCertification(repository.repoRoot, "lease-reader-two");
      await waitForPath(second.readyPath);

      await expect(
        acquireKnowledgeTransactionLock({
          repoRoot: repository.repoRoot,
          command: "writer during two certifications",
        }),
      ).rejects.toThrow(/blocked by a live certification lease/);

      await Promise.all([
        writeFile(first.releasePath, "release"),
        writeFile(second.releasePath, "release"),
      ]);
      const results = await Promise.all([first.result, second.result]);
      expect(
        results.map((result) => result.exitCode),
        JSON.stringify(results),
      ).toEqual([0, 0]);
    },
    15_000,
  );

  it("registers simultaneous protected readers without transient lock failures", async () => {
    const repository = await fixtureRepository();
    const readers = Array.from({ length: 8 }, (_, index) => {
      const child = spawn(
        VITE_NODE,
        [
          RUNNER,
          `simultaneous-reader-${index + 1}`,
          "--",
          process.execPath,
          "-e",
          "setTimeout(() => process.exit(0), 100)",
        ],
        {
          cwd: repository.repoRoot,
          env: process.env,
          stdio: ["ignore", "pipe", "pipe"],
        },
      );
      children.add(child);
      return childResult(child);
    });

    const results = await Promise.all(readers);
    expect(
      results.map(({ exitCode, signal, stderr }) => ({
        exitCode,
        signal,
        stderr,
      })),
    ).toEqual(
      Array.from({ length: 8 }, () => ({
        exitCode: 0,
        signal: null,
        stderr: "",
      })),
    );
  }, 20_000);

  it(
    "does not start a protected command while a writer owns the lock",
    async () => {
      const repository = await fixtureRepository();
      const lock = await acquireKnowledgeTransactionLock({
        repoRoot: repository.repoRoot,
        command: "live writer fixture",
      });
      const protectedCommand = startWaitingCertification(
        repository.repoRoot,
        "lease-blocked-by-writer",
      );
      const result = await protectedCommand.result;
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toMatch(
        /writer lock is held by a live process|Timed out waiting for the knowledge transaction writer lock/,
      );
      await expect(access(protectedCommand.readyPath)).rejects.toThrow();
      await releaseKnowledgeTransactionLock(lock);
    },
    10_000,
  );

  it("keeps a killed runner's lease active until its protected command exits, then reclaims it", async () => {
    const repository = await fixtureRepository();
    const abandoned = startWaitingCertification(
      repository.repoRoot,
      "lease-abandoned",
    );
    await waitForPath(abandoned.readyPath);
    abandoned.child.kill("SIGKILL");
    const abandonedResult = await abandoned.result;
    expect(abandonedResult.signal).toBe("SIGKILL");

    const concurrentReader = spawn(
      VITE_NODE,
      [
        RUNNER,
        "lease-reader-after-runner-death",
        "--",
        process.execPath,
        "-e",
        "process.stdout.write('reader-ran')",
      ],
      {
        cwd: repository.repoRoot,
        env: process.env,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    children.add(concurrentReader);
    await expect(childResult(concurrentReader)).resolves.toMatchObject({
      exitCode: 0,
      signal: null,
      stdout: "reader-ran",
      stderr: "",
    });

    await expect(
      acquireKnowledgeTransactionLock({
        repoRoot: repository.repoRoot,
        command: "writer while orphaned protected command is alive",
        recoveryCapable: true,
      }),
    ).rejects.toThrow(/live certification lease|protected process is alive/);

    await writeFile(abandoned.releasePath, "release");
    let replacementWriter: Awaited<
      ReturnType<typeof acquireKnowledgeTransactionLock>
    > | null = null;
    let lastError: unknown = null;
    for (let attempt = 0; attempt < 100 && !replacementWriter; attempt += 1) {
      try {
        replacementWriter = await acquireKnowledgeTransactionLock({
          repoRoot: repository.repoRoot,
          command: "writer after orphaned protected command exits",
          recoveryCapable: true,
        });
      } catch (error) {
        lastError = error;
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
    }
    expect(replacementWriter, String(lastError)).not.toBeNull();
    if (replacementWriter) await releaseKnowledgeTransactionLock(replacementWriter);
  });

  it("refuses to run the child while a canonical transaction needs recovery", async () => {
    const repository = await fixtureRepository();
    const request = await createProjectUpdateRequestPackage();
    cleanups.push(request.cleanup);
    const prepared = await prepareKnowledgeRecordTransaction({
      repoRoot: repository.repoRoot,
      requestPath: request.requestPath,
      expectedKind: "project-update",
      dependencies: { today: () => KNOWLEDGE_TRANSACTION_FIXTURE_AS_OF },
    });
    const lock = await acquireKnowledgeTransactionLock({
      repoRoot: repository.repoRoot,
      command: "mark unfinished fixture",
      transactionId: prepared.transactionId,
    });
    await markKnowledgeTransactionUnfinished({
      lock,
      transactionId: prepared.transactionId,
      phase: "apply",
    });
    await releaseKnowledgeTransactionLock(lock);

    const protectedCommand = startWaitingCertification(
      repository.repoRoot,
      "lease-unfinished",
    );
    const result = await protectedCommand.result;
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain(`recovery is required for ${prepared.transactionId}`);
    await expect(access(protectedCommand.readyPath)).rejects.toThrow();
  });
});
