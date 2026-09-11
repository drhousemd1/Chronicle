import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import path from "node:path";

import {
  getRepositoryGraphRuntimeStatus,
  printableRepositoryGraphError,
  type RepositoryGraphRuntimeStatus,
} from "./cli";
import { captureRepositoryGraphCorpus } from "./corpus";
import { loadRepositoryGraphLensPolicy } from "./lens-policy";

type RuntimeAccessDependencies = Readonly<{
  readStatus: (repositoryRoot: string) => Promise<RepositoryGraphRuntimeStatus>;
  build: (repositoryRoot: string) => Promise<unknown>;
  sourceKey: (repositoryRoot: string) => Promise<string>;
}>;

type CheckoutState = {
  statusRead?: Promise<RepositoryGraphRuntimeStatus>;
  sourceRead?: Promise<string>;
  building?: Promise<void>;
  refreshing?: RepositoryGraphRuntimeStatus;
  failure?: Readonly<{ sourceKey: string | null; reason: string }>;
};

/** Extraction uses synchronous subprocesses internally, so keep the whole CLI off Vite's event loop. */
export function runRepositoryGraphUpdateProcess(repositoryRoot: string, spawnProcess = spawn): Promise<void> {
  const root = path.resolve(repositoryRoot);
  return new Promise((resolve, reject) => {
    const child = spawnProcess(process.execPath, [
      path.join(root, "node_modules/vite-node/vite-node.mjs"),
      "--script",
      path.join(root, "scripts/chronicle-repository-graph/cli-entry.ts"),
      "update",
    ], {
      cwd: root,
      shell: false,
      stdio: ["ignore", "ignore", "pipe"],
      windowsHide: true,
    });
    // The CLI already sanitizes failures. Drain stderr, retaining only a bounded
    // tail so startup noise cannot hide its final actionable error.
    let stderr = Buffer.alloc(0);
    child.stderr?.on("data", (chunk: Buffer | string) => {
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      stderr = Buffer.concat([stderr, bytes.subarray(-8192)]).subarray(-8192);
    });
    child.once("error", (error) => {
      reject(new Error(`Repository graph automatic update could not start: ${printableRepositoryGraphError(error)}`));
    });
    child.once("close", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }
      const output = stderr.toString("utf8").trim();
      const reason = output.length > 1800 ? `[earlier update output omitted] ${output.slice(-1800)}` : output;
      reject(new Error(
        `Repository graph automatic update failed (exit ${code ?? "none"}${signal ? `, signal ${signal}` : ""}).` +
        (reason ? ` ${printableRepositoryGraphError(reason)}` : " The update process produced no error detail."),
      ));
    });
  });
}

async function sourceKey(repositoryRoot: string) {
  const [capture, lensPolicy] = await Promise.all([
    captureRepositoryGraphCorpus(repositoryRoot),
    loadRepositoryGraphLensPolicy(repositoryRoot),
  ]);
  return createHash("sha256").update(JSON.stringify({
    corpus: capture.fingerprintSha256,
    corpusPolicy: capture.policySha256,
    lensPolicy: lensPolicy.sha256,
    head: capture.repositoryHead,
    dirty: capture.dirty,
  })).digest("hex");
}

/** One local server coordinator; the existing custody lock also excludes other processes. */
export function createRepositoryGraphRuntimeAccess(dependencies: RuntimeAccessDependencies = {
  readStatus: getRepositoryGraphRuntimeStatus,
  build: runRepositoryGraphUpdateProcess,
  sourceKey,
}) {
  const checkouts = new Map<string, CheckoutState>();

  function readSourceKey(repositoryRoot: string, entry: CheckoutState) {
    if (!entry.sourceRead) {
      const pending = Promise.resolve().then(() => dependencies.sourceKey(repositoryRoot));
      entry.sourceRead = pending;
      const clear = () => { if (entry.sourceRead === pending) entry.sourceRead = undefined; };
      void pending.then(clear, clear);
    }
    return entry.sourceRead;
  }

  return async function readRuntimeStatus(repositoryRoot: string, allowRefresh = true): Promise<RepositoryGraphRuntimeStatus> {
    const root = path.resolve(repositoryRoot);
    const entry = checkouts.get(root) ?? {};
    checkouts.set(root, entry);
    if (entry.building && entry.refreshing) return entry.refreshing;

    if (!entry.statusRead) {
      const pending = Promise.resolve().then(() => dependencies.readStatus(root));
      entry.statusRead = pending;
      const clear = () => { if (entry.statusRead === pending) entry.statusRead = undefined; };
      void pending.then(clear, clear);
    }
    const status = await entry.statusRead;
    if (status.state === "ready-current") entry.failure = undefined;
    if (!allowRefresh || (status.state !== "ready-stale" && status.state !== "unavailable")) return status;
    if (entry.building && entry.refreshing) return entry.refreshing;

    let capturedKey: string | null = null;
    if (entry.failure) {
      try {
        capturedKey = await readSourceKey(root, entry);
      } catch (error) {
        return { ...status, state: "error", reasons: [printableRepositoryGraphError(error)] };
      }
      if (entry.building && entry.refreshing) return entry.refreshing;
      if (entry.failure?.sourceKey === capturedKey) {
        return { ...status, state: "error", reasons: [entry.failure.reason] };
      }
    }

    entry.refreshing = { ...status, state: "refreshing", buildId: null, reasons: [] };
    // Do not await extraction in an HTTP request. Other views share this promise,
    // and an unchanged failing source gets only one build attempt per server run.
    entry.building = Promise.resolve().then(async () => {
      try {
        capturedKey ??= await readSourceKey(root, entry);
        await dependencies.build(root);
        entry.failure = undefined;
      } catch (error) {
        entry.failure = { sourceKey: capturedKey, reason: printableRepositoryGraphError(error) };
      } finally {
        entry.building = undefined;
        entry.refreshing = undefined;
      }
    });
    return entry.refreshing;
  };
}

export const getRepositoryGraphAutoRefreshStatus = createRepositoryGraphRuntimeAccess();
