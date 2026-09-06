import { randomBytes } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import type { RepositoryGraphEnvelope } from "../../src/data/chronicle-knowledge-base/repository-graph-contract";
import { captureRepositoryGraphCorpus, stageRepositoryGraphCorpus } from "./corpus";
import {
  acquireRepositoryGraphLock,
  publishRepositoryGraph,
  recoverRepositoryGraph,
  releaseRepositoryGraphLock,
  repositoryGraphCustodyStatus,
} from "./custody";
import { runPinnedGraphifyExtraction } from "./graphify-adapter";
import {
  applyCapabilityGraphLenses,
  deriveCapabilityGraphLenses,
  loadCapabilityLensSourceSets,
  loadRepositoryGraphLensPolicy,
} from "./lens-policy";
import { normalizeGraphifyOutput } from "./normalize";
import { explainRepositoryGraphNode, queryRepositoryGraph, shortestRepositoryGraphPath } from "./query";

export type RepositoryGraphRuntimeState =
  | "ready-current"
  | "ready-stale"
  | "refreshing"
  | "unavailable"
  | "error";

export type RepositoryGraphRuntimeStatus = Readonly<{
  state: RepositoryGraphRuntimeState;
  graph: RepositoryGraphEnvelope | null;
  buildId: string | null;
  reasons: readonly string[];
}>;

function createBuildId(prefix: "build" | "recover") {
  return `${prefix}-${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}-${randomBytes(6).toString("hex")}`;
}

function printableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message
    .split(process.cwd()).join("<repository>")
    .replace(/\/Users\/[^/]+/g, "/Users/<redacted>")
    .slice(0, 2000);
}

async function safelyRemoveBuildStage(root: string, buildId: string) {
  const stagingRoot = path.resolve(root, "staging");
  const target = path.resolve(stagingRoot, buildId);
  if (!target.startsWith(`${stagingRoot}${path.sep}`)) throw new Error("Repository graph cleanup escaped the staging root.");
  await rm(target, { recursive: true, force: true });
}

async function writeBuildReceipt(
  root: string,
  buildId: string,
  value: Readonly<Record<string, unknown>>,
) {
  const receiptPath = path.join(root, "receipts", `${buildId}.json`);
  await writeFile(receiptPath, `${JSON.stringify({ schemaVersion: 1, buildId, ...value }, null, 2)}\n`, {
    flag: "wx",
    mode: 0o600,
  });
}

export async function getRepositoryGraphRuntimeStatus(repositoryRoot: string): Promise<RepositoryGraphRuntimeStatus> {
  const custody = await repositoryGraphCustodyStatus(repositoryRoot);
  if (custody.error) {
    return Object.freeze({ state: "error", graph: custody.current, buildId: custody.lock?.buildId ?? null, reasons: [custody.error] });
  }
  if (custody.lock) {
    return Object.freeze({ state: "refreshing", graph: custody.current, buildId: custody.lock.buildId, reasons: [] });
  }
  try {
    const [capture, lensPolicy] = await Promise.all([
      captureRepositoryGraphCorpus(repositoryRoot),
      loadRepositoryGraphLensPolicy(repositoryRoot),
    ]);
    if (!custody.current) {
      return Object.freeze({ state: "unavailable", graph: null, buildId: null, reasons: [] });
    }
    const reasons: string[] = [];
    if (capture.fingerprintSha256 !== custody.current.source.corpusFingerprintSha256) reasons.push("source corpus changed");
    if (capture.policySha256 !== custody.current.generator.corpusPolicySha256) reasons.push("corpus policy changed");
    if (lensPolicy.sha256 !== custody.current.generator.lensPolicySha256) reasons.push("capability lens policy changed");
    if (capture.repositoryHead !== custody.current.source.repositoryHead) reasons.push("repository HEAD changed");
    if (capture.dirty !== custody.current.source.dirty) reasons.push("source dirty state changed");
    return Object.freeze({
      state: reasons.length === 0 ? "ready-current" : "ready-stale",
      graph: custody.current,
      buildId: null,
      reasons: Object.freeze(reasons),
    });
  } catch (error) {
    return Object.freeze({ state: "error", graph: custody.current, buildId: null, reasons: [printableError(error)] });
  }
}

export async function requireCurrentRepositoryGraph(repositoryRoot: string) {
  const status = await getRepositoryGraphRuntimeStatus(repositoryRoot);
  if (status.state !== "ready-current" || !status.graph) {
    throw new Error(`Repository graph query requires ready-current state; current state is ${status.state}${status.reasons.length ? ` (${status.reasons.join(", ")})` : ""}.`);
  }
  return status.graph;
}

export async function buildRepositoryGraph(repositoryRoot: string) {
  const initial = await captureRepositoryGraphCorpus(repositoryRoot);
  const initialLensPolicy = await loadRepositoryGraphLensPolicy(repositoryRoot);
  const buildId = createBuildId("build");
  const lock = await acquireRepositoryGraphLock(repositoryRoot, {
    buildId,
    initialCorpusFingerprintSha256: initial.fingerprintSha256,
  });
  const stageRoot = path.join(lock.root, "staging", buildId);
  const corpusRoot = path.join(stageRoot, "corpus");
  const privateWorkRoot = path.join(stageRoot, "private");
  let cleanupError: unknown = null;
  let operationError: unknown = null;
  let operationFailed = false;
  let publishedResult: RepositoryGraphEnvelope | null = null;
  try {
    await mkdir(stageRoot, { recursive: false, mode: 0o700 });
    const staged = await stageRepositoryGraphCorpus(repositoryRoot, corpusRoot, initial);
    await mkdir(privateWorkRoot, { recursive: false, mode: 0o700 });
    const graphify = await runPinnedGraphifyExtraction({ repositoryRoot, stagedCorpusRoot: corpusRoot, privateWorkRoot });
    const normalized = normalizeGraphifyOutput({
      extraction: graphify.extraction,
      clustered: graphify.clustered,
      generatedAt: new Date().toISOString(),
      repositoryHead: initial.repositoryHead,
      dirty: initial.dirty,
      sourceEntries: initial.entries,
      corpusFingerprintSha256: initial.fingerprintSha256,
      corpusPolicySha256: initial.policySha256,
      lensPolicySha256: initialLensPolicy.sha256,
      toolchainIdentitySha256: graphify.toolchainIdentitySha256,
      normalizerVersion: initial.policy.normalizer_version,
      lenses: [],
    });
    const sourceSets = await loadCapabilityLensSourceSets(repositoryRoot);
    const candidate = applyCapabilityGraphLenses(
      normalized,
      deriveCapabilityGraphLenses(normalized, sourceSets),
    );
    const published = await publishRepositoryGraph(repositoryRoot, buildId, candidate, {
      corpusFingerprintSha256: initial.fingerprintSha256,
      corpusPolicySha256: initial.policySha256,
      lensPolicySha256: initialLensPolicy.sha256,
      dirty: initial.dirty,
      repositoryHead: initial.repositoryHead,
    });
    await writeBuildReceipt(lock.root, buildId, {
      result: "published",
      graphId: published.graphId,
      sourceFingerprintSha256: initial.fingerprintSha256,
      corpusPolicySha256: initial.policySha256,
      lensPolicySha256: initialLensPolicy.sha256,
      toolchainIdentitySha256: published.generator.toolchainIdentitySha256,
      repositoryHead: initial.repositoryHead,
      sourceDirty: initial.dirty,
      stagedFiles: staged.stagedFiles,
      nodes: published.graph.nodes.length,
      edges: published.graph.edges.length,
      communities: published.graph.communities.length,
      extractionProcess: graphify.receipts.extraction,
      clusterProcess: graphify.receipts.cluster,
    });
    publishedResult = published;
  } catch (error) {
    operationFailed = true;
    operationError = error;
    await writeBuildReceipt(lock.root, buildId, {
      result: "failed",
      reason: printableError(error),
      sourceFingerprintSha256: initial.fingerprintSha256,
      corpusPolicySha256: initial.policySha256,
      lensPolicySha256: initialLensPolicy.sha256,
    });
  } finally {
    try {
      await safelyRemoveBuildStage(lock.root, buildId);
    } catch (error) {
      cleanupError = error;
    }
    await releaseRepositoryGraphLock(lock.lockPath, buildId);
  }
  if (operationFailed) throw operationError;
  if (cleanupError) throw cleanupError;
  if (!publishedResult) throw new Error("Repository graph build finished without a published graph.");
  return publishedResult;
}

export async function restoreRepositoryGraph(repositoryRoot: string, graphId: string) {
  const capture = await captureRepositoryGraphCorpus(repositoryRoot);
  const buildId = createBuildId("recover");
  const lock = await acquireRepositoryGraphLock(repositoryRoot, {
    buildId,
    initialCorpusFingerprintSha256: capture.fingerprintSha256,
  });
  try {
    const recovered = await recoverRepositoryGraph(repositoryRoot, buildId, graphId);
    await writeBuildReceipt(lock.root, buildId, {
      result: "recovered",
      graphId: recovered.graphId,
      sourceFingerprintSha256: capture.fingerprintSha256,
    });
    return recovered;
  } finally {
    await releaseRepositoryGraphLock(lock.lockPath, buildId);
  }
}

function argumentValue(args: readonly string[], flag: string) {
  const index = args.indexOf(flag);
  if (index < 0 || index === args.length - 1) throw new Error(`Missing ${flag} argument.`);
  return args[index + 1];
}

export async function runRepositoryGraphCommand(repositoryRoot: string, commandArgs: readonly string[]) {
  const [command = "status", ...args] = commandArgs;
  if (command === "status") {
    const status = await getRepositoryGraphRuntimeStatus(repositoryRoot);
    console.log(JSON.stringify({
      state: status.state,
      graphId: status.graph?.graphId ?? null,
      generatedAt: status.graph?.generatedAt ?? null,
      buildId: status.buildId,
      reasons: status.reasons,
      counts: status.graph
        ? { nodes: status.graph.graph.nodes.length, edges: status.graph.graph.edges.length, communities: status.graph.graph.communities.length }
        : null,
    }, null, 2));
    return;
  }
  if (command === "build" || command === "update") {
    const graph = await buildRepositoryGraph(repositoryRoot);
    console.log(JSON.stringify({ result: "published", graphId: graph.graphId, nodes: graph.graph.nodes.length, edges: graph.graph.edges.length, communities: graph.graph.communities.length }, null, 2));
    return;
  }
  if (command === "query") {
    const graph = await requireCurrentRepositoryGraph(repositoryRoot);
    console.log(JSON.stringify(queryRepositoryGraph(graph, args.join(" ")), null, 2));
    return;
  }
  if (command === "path") {
    const graph = await requireCurrentRepositoryGraph(repositoryRoot);
    console.log(JSON.stringify(shortestRepositoryGraphPath(graph, argumentValue(args, "--from"), argumentValue(args, "--to")), null, 2));
    return;
  }
  if (command === "explain") {
    const graph = await requireCurrentRepositoryGraph(repositoryRoot);
    if (args.length !== 1) throw new Error("Repository graph explain requires exactly one node ID.");
    console.log(JSON.stringify(explainRepositoryGraphNode(graph, args[0]), null, 2));
    return;
  }
  if (command === "recover") {
    if (args.length !== 1) throw new Error("Repository graph recover requires exactly one graph ID.");
    const graph = await restoreRepositoryGraph(repositoryRoot, args[0]);
    console.log(JSON.stringify({ result: "recovered", graphId: graph.graphId }, null, 2));
    return;
  }
  throw new Error(`Unknown repository graph command ${JSON.stringify(command)}.`);
}

export { printableError as printableRepositoryGraphError };
