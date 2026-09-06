import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { hostname } from "node:os";
import { closeSync, existsSync, fsyncSync, openSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { chmod, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import { parseRepositoryGraphEnvelope, type RepositoryGraphEnvelope } from "../../src/data/chronicle-knowledge-base/repository-graph-contract";
import { captureRepositoryGraphCorpus } from "./corpus";
import { loadRepositoryGraphLensPolicy } from "./lens-policy";

const RECOVERY_TARGET_LIMIT = 3;
const RETIRED_MIGRATION_LIMIT = 1;

export type RepositoryGraphLock = Readonly<{
  schemaVersion: 1;
  buildId: string;
  pid: number;
  hostname: string;
  startedAt: string;
  initialCorpusFingerprintSha256: string;
}>;

function assertBuildId(value: string) {
  if (!/^[a-z0-9][a-z0-9._-]{0,99}$/i.test(value)) throw new Error(`Invalid repository graph build ID ${JSON.stringify(value)}.`);
}

function sha256(bytes: Buffer | string) {
  return createHash("sha256").update(bytes).digest("hex");
}

function syncFile(filePath: string) {
  const descriptor = openSync(filePath, "r");
  try {
    fsyncSync(descriptor);
  } finally {
    closeSync(descriptor);
  }
}

function syncDirectory(directoryPath: string) {
  const descriptor = openSync(directoryPath, "r");
  try {
    fsyncSync(descriptor);
  } finally {
    closeSync(descriptor);
  }
}

export function resolveRepositoryGraphCustodyRoot(repositoryRoot: string) {
  const gitPath = execFileSync("git", ["rev-parse", "--git-path", "chronicle-repository-graph"], {
    cwd: repositoryRoot,
    encoding: "utf8",
  }).trim();
  return path.resolve(repositoryRoot, gitPath);
}

export async function ensureRepositoryGraphCustody(repositoryRoot: string) {
  const root = resolveRepositoryGraphCustodyRoot(repositoryRoot);
  const directories = [root, path.join(root, "staging"), path.join(root, "receipts"), path.join(root, "recovery")];
  for (const directory of directories) {
    await mkdir(directory, { recursive: true, mode: 0o700 });
    await chmod(directory, 0o700);
  }
  for (const file of [path.join(root, "current.json"), path.join(root, "lock.json")]) {
    if (existsSync(file)) await chmod(file, 0o600);
  }
  return root;
}

function parseLock(source: string): RepositoryGraphLock {
  const value = JSON.parse(source) as Partial<RepositoryGraphLock>;
  if (
    value.schemaVersion !== 1 ||
    typeof value.buildId !== "string" ||
    typeof value.pid !== "number" ||
    !Number.isInteger(value.pid) ||
    value.pid < 1 ||
    typeof value.hostname !== "string" ||
    typeof value.startedAt !== "string" ||
    Number.isNaN(Date.parse(value.startedAt)) ||
    typeof value.initialCorpusFingerprintSha256 !== "string" ||
    !/^[a-f0-9]{64}$/.test(value.initialCorpusFingerprintSha256)
  ) {
    throw new Error("Repository graph lock is malformed and cannot be reclaimed automatically.");
  }
  assertBuildId(value.buildId);
  return value as RepositoryGraphLock;
}

function processIsAlive(pid: number) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return !(
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "ESRCH"
    );
  }
}

export async function acquireRepositoryGraphLock(
  repositoryRoot: string,
  lock: Readonly<{ buildId: string; initialCorpusFingerprintSha256: string }>,
) {
  assertBuildId(lock.buildId);
  const root = await ensureRepositoryGraphCustody(repositoryRoot);
  const lockPath = path.join(root, "lock.json");
  if (existsSync(lockPath)) {
    const existing = parseLock(await readFile(lockPath, "utf8"));
    if (existing.hostname !== hostname()) {
      throw new Error(`Repository graph build ${existing.buildId} is locked by another host and cannot be reclaimed automatically.`);
    }
    if (processIsAlive(existing.pid)) {
      throw new Error(`Repository graph build ${existing.buildId} is already running on PID ${existing.pid}.`);
    }
    const staleReceipt = path.join(root, "recovery", `stale-lock-${existing.buildId}.json`);
    const staleReceiptBytes = `${JSON.stringify(existing, null, 2)}\n`;
    if (existsSync(staleReceipt)) {
      if ((await readFile(staleReceipt, "utf8")) !== staleReceiptBytes) {
        throw new Error("Existing stale-lock recovery evidence does not match the dead lock.");
      }
    } else {
      await writeFile(staleReceipt, staleReceiptBytes, { flag: "wx", mode: 0o600 });
    }
    const stagingRoot = path.resolve(root, "staging");
    const staleStage = path.resolve(stagingRoot, existing.buildId);
    if (!staleStage.startsWith(`${stagingRoot}${path.sep}`)) {
      throw new Error("Stale repository graph stage escaped the private staging root.");
    }
    await rm(staleStage, { recursive: true, force: true });
    for (const entry of await readdir(root)) {
      if (new RegExp(`^recover-[a-f0-9]{12}-${existing.buildId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\.tmp$`).test(entry)) {
        await rm(path.join(root, entry), { force: true });
      }
    }
    const recoveryRoot = path.join(root, "recovery");
    for (const entry of await readdir(recoveryRoot)) {
      if (entry.endsWith(`.tmp-${existing.buildId}`)) await rm(path.join(recoveryRoot, entry), { force: true });
    }
    unlinkSync(lockPath);
  }
  const receipt: RepositoryGraphLock = Object.freeze({
    schemaVersion: 1,
    buildId: lock.buildId,
    pid: process.pid,
    hostname: hostname(),
    startedAt: new Date().toISOString(),
    initialCorpusFingerprintSha256: lock.initialCorpusFingerprintSha256,
  });
  const descriptor = openSync(lockPath, "wx", 0o600);
  try {
    writeFileSync(descriptor, `${JSON.stringify(receipt, null, 2)}\n`);
    fsyncSync(descriptor);
  } finally {
    closeSync(descriptor);
  }
  syncDirectory(root);
  return Object.freeze({ root, lockPath, receipt });
}

export async function releaseRepositoryGraphLock(lockPath: string, buildId: string) {
  const current = parseLock(await readFile(lockPath, "utf8"));
  if (current.buildId !== buildId || current.pid !== process.pid || current.hostname !== hostname()) {
    throw new Error("Repository graph lock ownership changed; refusing to remove another builder's lock.");
  }
  unlinkSync(lockPath);
  syncDirectory(path.dirname(lockPath));
}

export async function readCurrentRepositoryGraph(repositoryRoot: string): Promise<RepositoryGraphEnvelope | null> {
  const currentPath = path.join(resolveRepositoryGraphCustodyRoot(repositoryRoot), "current.json");
  if (!existsSync(currentPath)) return null;
  return parseRepositoryGraphEnvelope(JSON.parse(await readFile(currentPath, "utf8")));
}

export async function publishRepositoryGraph(
  repositoryRoot: string,
  buildId: string,
  envelope: RepositoryGraphEnvelope,
  expectedSource: Readonly<{
    corpusFingerprintSha256: string;
    corpusPolicySha256: string;
    lensPolicySha256: string;
    dirty: boolean;
    repositoryHead: string;
  }>,
) {
  assertBuildId(buildId);
  const root = await ensureRepositoryGraphCustody(repositoryRoot);
  const lock = parseLock(await readFile(path.join(root, "lock.json"), "utf8"));
  if (lock.buildId !== buildId || lock.pid !== process.pid || lock.hostname !== hostname()) {
    throw new Error("Repository graph publication requires the current graph-only lock.");
  }
  const validated = parseRepositoryGraphEnvelope(envelope);
  const stage = path.join(root, "staging", buildId);
  await mkdir(stage, { recursive: true, mode: 0o700 });
  const candidateTemp = path.join(stage, "candidate.json.tmp");
  const candidatePath = path.join(stage, "candidate.json");
  const currentPath = path.join(root, "current.json");
  const bytes = `${JSON.stringify(validated, null, 2)}\n`;
  await writeFile(candidateTemp, bytes, { flag: "wx", mode: 0o600 });
  syncFile(candidateTemp);
  renameSync(candidateTemp, candidatePath);
  syncDirectory(stage);
  let previousGraphId: string | null = null;
  let retiredUnverifiedBytes: Buffer | null = null;
  if (existsSync(currentPath)) {
    const previousBytes = readFileSync(currentPath);
    try {
      const previous = parseRepositoryGraphEnvelope(JSON.parse(previousBytes.toString("utf8")));
      await preserveRecoverySnapshot(root, buildId, previousBytes, previous);
      previousGraphId = previous.graphId;
    } catch {
      // A stricter envelope contract can intentionally make the previous graph
      // non-recoverable. Keep its exact private bytes as migration evidence,
      // but never expose or recover them as a current Chronicle graph.
      retiredUnverifiedBytes = previousBytes;
    }
  }
  const [liveSource, liveLensPolicy] = await Promise.all([
    captureRepositoryGraphCorpus(repositoryRoot),
    loadRepositoryGraphLensPolicy(repositoryRoot),
  ]);
  if (
    liveSource.fingerprintSha256 !== expectedSource.corpusFingerprintSha256 ||
    liveSource.policySha256 !== expectedSource.corpusPolicySha256 ||
    liveSource.dirty !== expectedSource.dirty ||
    liveSource.repositoryHead !== expectedSource.repositoryHead ||
    liveLensPolicy.sha256 !== expectedSource.lensPolicySha256
  ) {
    throw new Error("Repository graph source changed during the build; the candidate was not published.");
  }
  if (retiredUnverifiedBytes) {
    const retiredPath = path.join(root, "recovery", `retired-unverified-${sha256(retiredUnverifiedBytes)}.json`);
    if (!existsSync(retiredPath)) {
      await writeFile(retiredPath, retiredUnverifiedBytes, { flag: "wx", mode: 0o600 });
      syncFile(retiredPath);
      syncDirectory(path.dirname(retiredPath));
    }
  }
  renameSync(candidatePath, currentPath);
  syncDirectory(root);
  await pruneRecoverySnapshots(root, previousGraphId ? [previousGraphId] : []);
  return validated;
}

type RecoveryPointer = Readonly<{
  schemaVersion: 1;
  graphId: string;
  snapshotSha256: string;
  snapshotFile: string;
}>;

function recoveryPointerPath(root: string, graphId: string) {
  return path.join(root, "recovery", `latest-${graphId.replace(":", "-")}.json`);
}

async function preserveRecoverySnapshot(
  root: string,
  buildId: string,
  bytes: Buffer,
  envelope: RepositoryGraphEnvelope,
) {
  const snapshotSha256 = sha256(bytes);
  const snapshotFile = `${envelope.graphId.replace(":", "-")}-${snapshotSha256}.json`;
  const snapshotPath = path.join(root, "recovery", snapshotFile);
  if (!existsSync(snapshotPath)) {
    await writeFile(snapshotPath, bytes, { flag: "wx", mode: 0o600 });
    syncFile(snapshotPath);
  }
  const pointer: RecoveryPointer = Object.freeze({
    schemaVersion: 1,
    graphId: envelope.graphId,
    snapshotSha256,
    snapshotFile,
  });
  const pointerPath = recoveryPointerPath(root, envelope.graphId);
  const pointerTemp = `${pointerPath}.tmp-${buildId}`;
  await writeFile(pointerTemp, `${JSON.stringify(pointer, null, 2)}\n`, { flag: "wx", mode: 0o600 });
  syncFile(pointerTemp);
  renameSync(pointerTemp, pointerPath);
  syncDirectory(path.dirname(pointerPath));
  return pointer;
}

function parseRecoveryPointer(source: string, requestedGraphId: string): RecoveryPointer {
  const value = JSON.parse(source) as Partial<RecoveryPointer>;
  if (
    value.schemaVersion !== 1 ||
    value.graphId !== requestedGraphId ||
    typeof value.snapshotSha256 !== "string" ||
    !/^[a-f0-9]{64}$/.test(value.snapshotSha256) ||
    typeof value.snapshotFile !== "string" ||
    value.snapshotFile !== `${requestedGraphId.replace(":", "-")}-${value.snapshotSha256}.json`
  ) {
    throw new Error("Repository graph recovery pointer is malformed or does not match the requested graph.");
  }
  return value as RecoveryPointer;
}

export async function pruneRecoverySnapshots(root: string, protectedGraphIds: readonly string[] = []) {
  const recoveryRoot = path.join(root, "recovery");
  const entries = await readdir(recoveryRoot, { withFileTypes: true });
  const pointers: Array<{ pointer: RecoveryPointer; pointerPath: string; mtimeMs: number }> = [];
  for (const entry of entries) {
    if (!entry.isFile() || !/^latest-graph-[a-f0-9]{64}\.json$/.test(entry.name)) continue;
    const pointerPath = path.join(recoveryRoot, entry.name);
    const source = await readFile(pointerPath, "utf8");
    const graphId = (JSON.parse(source) as { graphId?: unknown }).graphId;
    if (typeof graphId !== "string") throw new Error(`Repository graph recovery pointer ${entry.name} is malformed.`);
    const pointer = parseRecoveryPointer(source, graphId);
    pointers.push({ pointer, pointerPath, mtimeMs: (await stat(pointerPath)).mtimeMs });
  }
  const protectedIds = new Set(protectedGraphIds);
  const ordered = pointers.sort((left, right) => {
    const protectedOrder = Number(protectedIds.has(right.pointer.graphId)) - Number(protectedIds.has(left.pointer.graphId));
    return protectedOrder || right.mtimeMs - left.mtimeMs || left.pointer.graphId.localeCompare(right.pointer.graphId);
  });
  const keep = new Set(ordered.slice(0, Math.max(RECOVERY_TARGET_LIMIT, protectedIds.size)).map((entry) => entry.pointer.graphId));
  const keptSnapshots = new Set(ordered.filter((entry) => keep.has(entry.pointer.graphId)).map((entry) => entry.pointer.snapshotFile));
  for (const entry of ordered) {
    if (!keep.has(entry.pointer.graphId)) await rm(entry.pointerPath, { force: true });
  }
  for (const entry of entries) {
    if (!entry.isFile() || !/^graph-[a-f0-9]{64}-[a-f0-9]{64}\.json$/.test(entry.name)) continue;
    if (!keptSnapshots.has(entry.name)) await rm(path.join(recoveryRoot, entry.name), { force: true });
  }
  const retired = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && /^retired-unverified-[a-f0-9]{64}\.json$/.test(entry.name))
      .map(async (entry) => ({ entry, mtimeMs: (await stat(path.join(recoveryRoot, entry.name))).mtimeMs })),
  );
  retired.sort((left, right) => right.mtimeMs - left.mtimeMs || left.entry.name.localeCompare(right.entry.name));
  for (const old of retired.slice(RETIRED_MIGRATION_LIMIT)) {
    await rm(path.join(recoveryRoot, old.entry.name), { force: true });
  }
  syncDirectory(recoveryRoot);
  return Object.freeze({ retainedTargets: keep.size, limit: RECOVERY_TARGET_LIMIT, retiredMigrationFiles: Math.min(retired.length, RETIRED_MIGRATION_LIMIT) });
}

export async function recoverRepositoryGraph(repositoryRoot: string, buildId: string, graphId: string) {
  assertBuildId(buildId);
  if (!/^graph:[a-f0-9]{64}$/.test(graphId)) throw new Error("Recovery requires a valid graph ID.");
  const root = await ensureRepositoryGraphCustody(repositoryRoot);
  const lock = parseLock(await readFile(path.join(root, "lock.json"), "utf8"));
  if (lock.buildId !== buildId || lock.pid !== process.pid || lock.hostname !== hostname()) {
    throw new Error("Repository graph recovery requires the current graph-only lock.");
  }
  const pointer = parseRecoveryPointer(await readFile(recoveryPointerPath(root, graphId), "utf8"), graphId);
  const recoveryPath = path.join(root, "recovery", pointer.snapshotFile);
  const recoveredBytes = await readFile(recoveryPath);
  if (sha256(recoveredBytes) !== pointer.snapshotSha256) throw new Error("Repository graph recovery snapshot bytes do not match their recorded identity.");
  const recovered = parseRepositoryGraphEnvelope(JSON.parse(recoveredBytes.toString("utf8")));
  if (recovered.graphId !== graphId) throw new Error("Repository graph recovery snapshot does not match the requested graph ID.");
  const tempPath = path.join(root, `recover-${graphId.slice(6, 18)}-${buildId}.tmp`);
  let priorGraphId: string | null = null;
  try {
    await writeFile(tempPath, recoveredBytes, { flag: "wx", mode: 0o600 });
    syncFile(tempPath);
    const currentPath = path.join(root, "current.json");
    if (existsSync(currentPath)) {
      const currentBytes = readFileSync(currentPath);
      const current = parseRepositoryGraphEnvelope(JSON.parse(currentBytes.toString("utf8")));
      await preserveRecoverySnapshot(root, buildId, currentBytes, current);
      priorGraphId = current.graphId;
    }
    renameSync(tempPath, currentPath);
    syncDirectory(root);
    await pruneRecoverySnapshots(root, [graphId, ...(priorGraphId ? [priorGraphId] : [])]);
  } finally {
    if (existsSync(tempPath)) unlinkSync(tempPath);
  }
  return recovered;
}

export async function repositoryGraphCustodyStatus(repositoryRoot: string) {
  const root = resolveRepositoryGraphCustodyRoot(repositoryRoot);
  const currentPath = path.join(root, "current.json");
  const lockPath = path.join(root, "lock.json");
  let current: RepositoryGraphEnvelope | null = null;
  let error: string | null = null;
  if (existsSync(currentPath)) {
    try {
      current = parseRepositoryGraphEnvelope(JSON.parse(await readFile(currentPath, "utf8")));
    } catch (caught) {
      error = caught instanceof Error ? caught.message : String(caught);
    }
  }
  let lock: RepositoryGraphLock | null = null;
  if (existsSync(lockPath)) {
    try {
      lock = parseLock(await readFile(lockPath, "utf8"));
      if (lock.hostname === hostname() && !processIsAlive(lock.pid)) {
        error = `Repository graph build ${lock.buildId} stopped unexpectedly and requires stale-build recovery.`;
      }
    } catch (caught) {
      error = caught instanceof Error ? caught.message : String(caught);
    }
  }
  return Object.freeze({ root, current, lock, error });
}
