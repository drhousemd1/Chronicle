import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { hostname } from "node:os";
import { mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";

import { afterEach, describe, expect, it } from "vitest";

import { getRepositoryGraphRuntimeStatus, requireCurrentRepositoryGraph } from "../../../scripts/chronicle-repository-graph/cli";
import { captureRepositoryGraphCorpus, stageRepositoryGraphCorpus } from "../../../scripts/chronicle-repository-graph/corpus";
import {
  acquireRepositoryGraphLock,
  publishRepositoryGraph,
  readCurrentRepositoryGraph,
  recoverRepositoryGraph,
  releaseRepositoryGraphLock,
  resolveRepositoryGraphCustodyRoot,
} from "../../../scripts/chronicle-repository-graph/custody";
import {
  applyCapabilityGraphLenses,
  deriveCapabilityGraphLenses,
  loadCapabilityLensSourceSets,
  loadRepositoryGraphLensPolicy,
} from "../../../scripts/chronicle-repository-graph/lens-policy";
import { normalizeGraphifyOutput } from "../../../scripts/chronicle-repository-graph/normalize";
import { GRAPHIFY_ENVIRONMENT_IDENTITY_SHA256 } from "../../../scripts/chronicle-repository-graph/verify-toolchain";
import { explainRepositoryGraphNode, queryRepositoryGraph, shortestRepositoryGraphPath } from "../../../scripts/chronicle-repository-graph/query";

const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

async function createRepository() {
  const root = await mkdtemp(path.join(tmpdir(), "chronicle-repository-graph-test-"));
  temporaryRoots.push(root);
  await mkdir(path.join(root, "src/excluded"), { recursive: true });
  await mkdir(path.join(root, "config"), { recursive: true });
  await writeFile(path.join(root, "src/a.ts"), "export function a() { return 1; }\n");
  await writeFile(path.join(root, "src/deleted.ts"), "export const deleted = true;\n");
  await writeFile(path.join(root, "src/excluded/ignored.ts"), "export const ignored = true;\n");
  await writeFile(
    path.join(root, "config/chronicle-repository-graph-policy.json"),
    `${JSON.stringify({
      schema_version: 1,
      include_roots: ["src/"],
      include_root_files: [],
      include_extensions: [".ts"],
      exclude_prefixes: ["src/excluded/"],
      max_file_bytes: 100000,
      graphify_version: "0.9.52",
      normalizer_version: "1",
    }, null, 2)}\n`,
  );
  await writeFile(
    path.join(root, "config/chronicle-repository-graph-lenses.json"),
    `${JSON.stringify({ schema_version: 1, capabilities: [] }, null, 2)}\n`,
  );
  execFileSync("git", ["init", "-q"], { cwd: root });
  execFileSync("git", ["config", "user.email", "graph-test@example.invalid"], { cwd: root });
  execFileSync("git", ["config", "user.name", "Graph Test"], { cwd: root });
  execFileSync("git", ["add", "."], { cwd: root });
  execFileSync("git", ["commit", "-qm", "fixture"], { cwd: root });
  return root;
}

function rawGraphs() {
  const nodes = [
    { id: "1", label: "a", file_type: "typescript", source_file: "src/a.ts", source_location: "L1", _callable: true, _origin: "ast", community: 0 },
    { id: "2", label: "b", file_type: "typescript", source_file: "src/a.ts", source_location: "L2", _callable: true, _origin: "ast", community: 0 },
  ];
  return {
    extraction: {
      nodes: nodes.map(({ community: _community, ...node }) => node),
      edges: [{ source: "1", target: "2", relation: "CALLS", source_file: "src/a.ts", source_location: "L1", _origin: "ast", weight: 1 }],
      hyperedges: [],
    },
    clustered: { nodes, links: [] },
  };
}

async function normalizedGraph(root: string, labelSuffix = "") {
  const capture = await captureRepositoryGraphCorpus(root);
  const lensPolicy = await loadRepositoryGraphLensPolicy(root);
  const raw = rawGraphs();
  if (labelSuffix) {
    raw.extraction.nodes[1].label += labelSuffix;
    raw.clustered.nodes[1].label += labelSuffix;
  }
  return normalizeGraphifyOutput({
    ...raw,
    generatedAt: "2026-08-30T00:00:00.000Z",
    repositoryHead: capture.repositoryHead,
    dirty: capture.dirty,
    sourceEntries: capture.entries,
    corpusFingerprintSha256: capture.fingerprintSha256,
    corpusPolicySha256: capture.policySha256,
    lensPolicySha256: lensPolicy.sha256,
    toolchainIdentitySha256: GRAPHIFY_ENVIRONMENT_IDENTITY_SHA256,
    normalizerVersion: capture.policy.normalizer_version,
  });
}

async function expectedSource(root: string, capture: Awaited<ReturnType<typeof captureRepositoryGraphCorpus>>) {
  const lensPolicy = await loadRepositoryGraphLensPolicy(root);
  return {
    corpusFingerprintSha256: capture.fingerprintSha256,
    corpusPolicySha256: capture.policySha256,
    lensPolicySha256: lensPolicy.sha256,
    dirty: capture.dirty,
    repositoryHead: capture.repositoryHead,
  };
}

describe("repository graph source capture", () => {
  it("captures dirty tracked, untracked, and deleted allowlisted files while excluding unrelated paths", async () => {
    const root = await createRepository();
    await writeFile(path.join(root, "src/a.ts"), "export function a() { return 2; }\n");
    await writeFile(path.join(root, "src/new.ts"), "export const fresh = true;\n");
    await rm(path.join(root, "src/deleted.ts"));
    await writeFile(path.join(root, "src/excluded/new.ts"), `${["CHRONICLE", "GRAPH", "SECRET", "CANARY"].join("_")}\n`);
    const capture = await captureRepositoryGraphCorpus(root);
    expect(capture.dirty).toBe(true);
    expect(capture.entries.map((entry) => [entry.path, entry.state])).toEqual([
      ["src/a.ts", "present"],
      ["src/deleted.ts", "deleted"],
      ["src/new.ts", "present"],
    ]);
    const stageRoot = path.join(root, ".git/stage-test");
    await stageRepositoryGraphCorpus(root, stageRoot, capture);
    expect(await readFile(path.join(stageRoot, "src/a.ts"), "utf8")).toContain("return 2");
    expect(await readFile(path.join(stageRoot, "src/new.ts"), "utf8")).toContain("fresh");
  });

  it("rejects source changes between capture and staging", async () => {
    const root = await createRepository();
    const capture = await captureRepositoryGraphCorpus(root);
    await writeFile(path.join(root, "src/a.ts"), "export function a() { return 3; }\n");
    await expect(stageRepositoryGraphCorpus(root, path.join(root, ".git/stage-changed"), capture)).rejects.toThrow("changed before staging");
  });

  it("rejects secret canaries and symlinks in the allowlisted corpus", async () => {
    const root = await createRepository();
    await writeFile(path.join(root, "src/canary.ts"), `${["CHRONICLE", "GRAPH", "SECRET", "CANARY"].join("_")}\n`);
    await expect(captureRepositoryGraphCorpus(root)).rejects.toThrow("Secret-like content");
    await rm(path.join(root, "src/canary.ts"));
    await symlink(path.join(root, "src/a.ts"), path.join(root, "src/link.ts"));
    await expect(captureRepositoryGraphCorpus(root)).rejects.toThrow("rejects symlinks");
  });
});

describe("repository graph normalization and queries", () => {
  it("keeps direction, structural communities, deterministic IDs, and bounded explanation", async () => {
    const root = await createRepository();
    const first = await normalizedGraph(root);
    const second = normalizeGraphifyOutput({
      ...rawGraphs(),
      generatedAt: "2026-08-30T01:00:00.000Z",
      repositoryHead: first.source.repositoryHead,
      dirty: first.source.dirty,
      sourceEntries: first.source.paths,
      corpusFingerprintSha256: first.source.corpusFingerprintSha256,
      corpusPolicySha256: first.generator.corpusPolicySha256,
      lensPolicySha256: first.generator.lensPolicySha256,
      toolchainIdentitySha256: first.generator.toolchainIdentitySha256,
      normalizerVersion: first.generator.normalizerVersion,
    });
    expect(second.graphId).toBe(first.graphId);
    expect(first.graph.communities).toHaveLength(1);
    const source = first.graph.nodes.find((node) => node.label === "a")!;
    const target = first.graph.nodes.find((node) => node.label === "b")!;
    expect(shortestRepositoryGraphPath(first, source.id, target.id)).not.toBeNull();
    expect(shortestRepositoryGraphPath(first, target.id, source.id)).toBeNull();
    expect(queryRepositoryGraph(first, "src/a")).toHaveLength(2);
    expect(explainRepositoryGraphNode(first, source.id).edges).toHaveLength(1);
    expect(() => queryRepositoryGraph(first, "a")).toThrow("2 to 200");
    expect(() => shortestRepositoryGraphPath(first, source.id, target.id, { maxDepth: 21 })).toThrow("between 1 and 20");
  });

  it("rejects raw private paths and forbidden source-body fields", async () => {
    const root = await createRepository();
    const capture = await captureRepositoryGraphCorpus(root);
    const lensPolicy = await loadRepositoryGraphLensPolicy(root);
    const base = {
      generatedAt: "2026-08-30T00:00:00.000Z",
      repositoryHead: capture.repositoryHead,
      dirty: capture.dirty,
      sourceEntries: capture.entries,
      corpusFingerprintSha256: capture.fingerprintSha256,
      corpusPolicySha256: capture.policySha256,
      lensPolicySha256: lensPolicy.sha256,
      toolchainIdentitySha256: GRAPHIFY_ENVIRONMENT_IDENTITY_SHA256,
      normalizerVersion: capture.policy.normalizer_version,
    };
    const absolute = rawGraphs();
    absolute.extraction.nodes[0].label = "/Users/example/private";
    expect(() => normalizeGraphifyOutput({ ...base, ...absolute })).toThrow("forbidden private value");
    const body = rawGraphs() as unknown as { extraction: { nodes: Array<Record<string, unknown>> }; clustered: unknown };
    body.extraction.nodes[0].source_code = "export const secret = true";
    expect(() => normalizeGraphifyOutput({ ...base, ...body })).toThrow("forbidden field");
  });

  it("omits Graphify external placeholders that have no staged repository source", async () => {
    const root = await createRepository();
    const capture = await captureRepositoryGraphCorpus(root);
    const lensPolicy = await loadRepositoryGraphLensPolicy(root);
    const raw = rawGraphs() as unknown as {
      extraction: { nodes: Array<Record<string, unknown>>; edges: Array<Record<string, unknown>> };
      clustered: { nodes: Array<Record<string, unknown>>; links: unknown[] };
    };
    const external = { id: "external", label: "react", file_type: "package", source_file: "", source_location: null };
    raw.extraction.nodes.push({ ...external });
    raw.clustered.nodes.push({ ...external, community: 9 });
    raw.extraction.edges.push({
      source: "1",
      target: "external",
      relation: "depends_on",
      source_file: null,
      source_location: null,
    });
    const graph = normalizeGraphifyOutput({
      ...raw,
      generatedAt: "2026-08-30T00:00:00.000Z",
      repositoryHead: capture.repositoryHead,
      dirty: capture.dirty,
      sourceEntries: capture.entries,
      corpusFingerprintSha256: capture.fingerprintSha256,
      corpusPolicySha256: capture.policySha256,
      lensPolicySha256: lensPolicy.sha256,
      toolchainIdentitySha256: GRAPHIFY_ENVIRONMENT_IDENTITY_SHA256,
      normalizerVersion: capture.policy.normalizer_version,
    });
    expect(graph.graph.nodes.map((node) => node.label).sort()).toEqual(["a", "b"]);
    expect(graph.graph.edges).toHaveLength(1);
    expect(graph.graph.communities).toHaveLength(1);
  });
});

describe("repository graph capability lenses", () => {
  it("parses all reviewed capability and administrative source lists without inventing membership", async () => {
    const sourceSets = await loadCapabilityLensSourceSets(process.cwd());
    expect(sourceSets.map((sourceSet) => [sourceSet.capabilityId, sourceSet.sourcePaths.length])).toEqual([
      ["community-gallery", 36],
      ["my-stories", 34],
      ["character-library", 59],
      ["my-images", 47],
      ["story-builder", 92],
      ["character-builder", 74],
      ["chat-interface", 11],
      ["chat-history", 9],
      ["public-profile", 12],
      ["account", 10],
      ["admin", 13],
      ["shared-systems", 18],
      ["roleplay-pipeline", 16],
      ["knowledge-base-system", 13],
      ["schema-reference", 6],
      ["quality-hub", 13],
      ["validation-evidence-ledger", 24],
      ["finance-dashboard", 30],
      ["research-development", 13],
      ["image-generation", 11],
    ]);
    const expectedEntryPointByCapability = {
      "community-gallery": "src/components/chronicle/GalleryHub.tsx",
      "my-stories": "src/components/chronicle/StoryHub.tsx",
      "character-library": "src/features/character-builder/CharacterBuilderScreen.tsx",
      "my-images": "src/components/chronicle/ImageLibraryTab.tsx",
      "story-builder": "src/features/story-builder/StoryBuilderScreen.tsx",
      "character-builder": "src/features/character-builder/CharacterBuilderScreen.tsx",
      "chat-interface": "src/components/chronicle/ChatInterfaceTab.tsx",
      "roleplay-pipeline": "src/components/chronicle/ChatInterfaceTab.tsx",
      "chat-history": "src/components/chronicle/ConversationsTab.tsx",
      "public-profile": "src/pages/CreatorProfile.tsx",
      account: "src/components/account/AccountSettingsTab.tsx",
      admin: "src/pages/Admin.tsx",
      "shared-systems": "src/components/app-shell/AppShellTopBar.tsx",
      "knowledge-base-system": "src/pages/style-guide/chronicle-knowledge-base.tsx",
      "schema-reference": "src/pages/style-guide/supabase-schema-reference.tsx",
      "quality-hub": "src/pages/style-guide/ui-audit.tsx",
      "validation-evidence-ledger": "src/pages/style-guide/validation-evidence-ledger.tsx",
      "finance-dashboard": "src/components/admin/finance/FinanceDashboardTool.tsx",
      "research-development": "src/components/admin/research-development/ResearchDevelopmentTool.tsx",
      "image-generation": "src/components/admin/ImageGenerationTool.tsx",
    } as const;
    for (const sourceSet of sourceSets) {
      expect(new Set(sourceSet.sourcePaths).size).toBe(sourceSet.sourcePaths.length);
      expect(sourceSet.sourcePaths).toContain(
        expectedEntryPointByCapability[
          sourceSet.capabilityId as keyof typeof expectedEntryPointByCapability
        ],
      );
    }
  });

  it("parses the configured manual section and derives a deterministic manual-source lens", async () => {
    const root = await createRepository();
    await mkdir(path.join(root, "docs"), { recursive: true });
    await writeFile(
      path.join(root, "docs/manual.md"),
      ["# Manual", "", "### Sources", "", "- `src/a.ts`", "- `src/not-in-corpus.ts`", "", "### Limit", "None", ""].join("\n"),
    );
    await writeFile(
      path.join(root, "config/chronicle-repository-graph-lenses.json"),
      `${JSON.stringify({
        schema_version: 1,
        capabilities: [{
          capability_id: "fixture",
          label: "Fixture",
          manual_path: "docs/manual.md",
          source_heading: "Sources",
          source_format: "inline-code-list",
        }],
      }, null, 2)}\n`,
    );
    const graph = await normalizedGraph(root);
    const sourceSets = await loadCapabilityLensSourceSets(root);
    const lenses = deriveCapabilityGraphLenses(graph, sourceSets);
    const withLenses = applyCapabilityGraphLenses(graph, lenses);
    expect(withLenses.lenses).toHaveLength(1);
    expect(withLenses.lenses[0].sourcePaths).toEqual(["src/a.ts"]);
    expect(withLenses.lenses[0].unresolvedSourcePaths).toEqual(["src/not-in-corpus.ts"]);
    expect(withLenses.lenses[0].coreNodeIds).toHaveLength(2);
    expect(withLenses.lenses[0].contextNodeIds).toEqual([]);
    expect(withLenses.lenses[0].edgeIds).toHaveLength(1);
    expect(withLenses.graphId).not.toBe(graph.graphId);
  });
});

describe("repository graph custody and state", () => {
  it("enforces one builder and safely reclaims a same-host dead lock", async () => {
    const root = await createRepository();
    const capture = await captureRepositoryGraphCorpus(root);
    const first = await acquireRepositoryGraphLock(root, { buildId: "build-first", initialCorpusFingerprintSha256: capture.fingerprintSha256 });
    await expect(acquireRepositoryGraphLock(root, { buildId: "build-second", initialCorpusFingerprintSha256: capture.fingerprintSha256 })).rejects.toThrow("already running");
    await releaseRepositoryGraphLock(first.lockPath, "build-first");
    const custodyRoot = resolveRepositoryGraphCustodyRoot(root);
    await writeFile(path.join(custodyRoot, "lock.json"), `${JSON.stringify({
      schemaVersion: 1,
      buildId: "dead-build",
      pid: 999999,
      hostname: hostname(),
      startedAt: "2026-08-30T00:00:00.000Z",
      initialCorpusFingerprintSha256: capture.fingerprintSha256,
    })}\n`, { mode: 0o600 });
    await mkdir(path.join(custodyRoot, "staging/dead-build"), { recursive: true });
    await writeFile(path.join(custodyRoot, "staging/dead-build/raw-source.ts"), "private staged bytes\n");
    await writeFile(path.join(custodyRoot, "recover-0123456789ab-dead-build.tmp"), "interrupted recovery bytes\n");
    expect((await getRepositoryGraphRuntimeStatus(root)).state).toBe("error");
    const reclaimed = await acquireRepositoryGraphLock(root, { buildId: "build-reclaimed", initialCorpusFingerprintSha256: capture.fingerprintSha256 });
    expect(await readFile(path.join(custodyRoot, "recovery/stale-lock-dead-build.json"), "utf8")).toContain("dead-build");
    expect(existsSync(path.join(custodyRoot, "staging/dead-build"))).toBe(false);
    expect(existsSync(path.join(custodyRoot, "recover-0123456789ab-dead-build.tmp"))).toBe(false);
    await releaseRepositoryGraphLock(reclaimed.lockPath, "build-reclaimed");
  });

  it("publishes atomically, preserves last good history, and requires a lock for recovery", async () => {
    const root = await createRepository();
    const capture = await captureRepositoryGraphCorpus(root);
    const firstGraph = await normalizedGraph(root);
    const firstLock = await acquireRepositoryGraphLock(root, { buildId: "publish-first", initialCorpusFingerprintSha256: capture.fingerprintSha256 });
    await publishRepositoryGraph(root, "publish-first", firstGraph, await expectedSource(root, capture));
    await releaseRepositoryGraphLock(firstLock.lockPath, "publish-first");
    const secondGraph = await normalizedGraph(root, "Changed");
    const secondLock = await acquireRepositoryGraphLock(root, { buildId: "publish-second", initialCorpusFingerprintSha256: capture.fingerprintSha256 });
    await publishRepositoryGraph(root, "publish-second", secondGraph, await expectedSource(root, capture));
    await releaseRepositoryGraphLock(secondLock.lockPath, "publish-second");
    expect((await readCurrentRepositoryGraph(root))?.graphId).toBe(secondGraph.graphId);
    await expect(recoverRepositoryGraph(root, "missing-lock", firstGraph.graphId)).rejects.toThrow();
    const recoveryLock = await acquireRepositoryGraphLock(root, { buildId: "recover-first", initialCorpusFingerprintSha256: capture.fingerprintSha256 });
    await writeFile(path.join(resolveRepositoryGraphCustodyRoot(root), `recover-${firstGraph.graphId.slice(6, 18)}-prior-crash.tmp`), "stale interrupted bytes\n");
    await recoverRepositoryGraph(root, "recover-first", firstGraph.graphId);
    await releaseRepositoryGraphLock(recoveryLock.lockPath, "recover-first");
    expect((await readCurrentRepositoryGraph(root))?.graphId).toBe(firstGraph.graphId);
    const invalidLock = await acquireRepositoryGraphLock(root, { buildId: "invalid-publish", initialCorpusFingerprintSha256: capture.fingerprintSha256 });
    const invalid = structuredClone(secondGraph) as typeof secondGraph & { graph: { edges: Array<{ target: string }> } };
    invalid.graph.edges[0].target = `node:${"9".repeat(24)}`;
    await expect(publishRepositoryGraph(root, "invalid-publish", invalid, await expectedSource(root, capture))).rejects.toThrow();
    await releaseRepositoryGraphLock(invalidLock.lockPath, "invalid-publish");
    expect((await readCurrentRepositoryGraph(root))?.graphId).toBe(firstGraph.graphId);
  });

  it("keeps only three recent recovery targets while preserving the immediately previous graph", async () => {
    const root = await createRepository();
    const capture = await captureRepositoryGraphCorpus(root);
    const graphs = [];
    for (let index = 0; index < 6; index += 1) {
      const graph = await normalizedGraph(root, `-${index}`);
      graphs.push(graph);
      const buildId = `retention-${index}`;
      const lock = await acquireRepositoryGraphLock(root, { buildId, initialCorpusFingerprintSha256: capture.fingerprintSha256 });
      await publishRepositoryGraph(root, buildId, graph, await expectedSource(root, capture));
      await releaseRepositoryGraphLock(lock.lockPath, buildId);
    }
    const recoveryRoot = path.join(resolveRepositoryGraphCustodyRoot(root), "recovery");
    const entries = await readdir(recoveryRoot);
    expect(entries.filter((entry) => entry.startsWith("latest-graph-"))).toHaveLength(3);
    expect(entries.filter((entry) => /^graph-[a-f0-9]{64}-[a-f0-9]{64}\.json$/.test(entry))).toHaveLength(3);

    const prior = graphs.at(-2)!;
    const recoveryLock = await acquireRepositoryGraphLock(root, { buildId: "retention-recover", initialCorpusFingerprintSha256: capture.fingerprintSha256 });
    await recoverRepositoryGraph(root, "retention-recover", prior.graphId);
    await releaseRepositoryGraphLock(recoveryLock.lockPath, "retention-recover");
    expect((await readCurrentRepositoryGraph(root))?.graphId).toBe(prior.graphId);
    const afterRecovery = await readdir(recoveryRoot);
    expect(afterRecovery.filter((entry) => entry.startsWith("latest-graph-"))).toHaveLength(3);
    expect(afterRecovery.filter((entry) => /^graph-[a-f0-9]{64}-[a-f0-9]{64}\.json$/.test(entry))).toHaveLength(3);
  });

  it("replaces a pre-contract graph while preserving its exact bytes as non-recoverable migration evidence", async () => {
    const root = await createRepository();
    const capture = await captureRepositoryGraphCorpus(root);
    const oldGraph = structuredClone(await normalizedGraph(root, "-old")) as Record<string, unknown> & {
      generator: Record<string, unknown>;
    };
    delete oldGraph.generator.toolchainIdentitySha256;
    const oldBytes = Buffer.from(`${JSON.stringify(oldGraph, null, 2)}\n`);
    const candidate = await normalizedGraph(root, "-new");
    const lock = await acquireRepositoryGraphLock(root, { buildId: "contract-upgrade", initialCorpusFingerprintSha256: capture.fingerprintSha256 });
    const custodyRoot = resolveRepositoryGraphCustodyRoot(root);
    await writeFile(path.join(custodyRoot, "current.json"), oldBytes, { mode: 0o600 });
    await publishRepositoryGraph(root, "contract-upgrade", candidate, await expectedSource(root, capture));
    await releaseRepositoryGraphLock(lock.lockPath, "contract-upgrade");
    expect((await readCurrentRepositoryGraph(root))?.graphId).toBe(candidate.graphId);
    const retained = (await readdir(path.join(custodyRoot, "recovery"))).find((entry) => entry.startsWith("retired-unverified-"));
    expect(retained).toBeTruthy();
    expect(await readFile(path.join(custodyRoot, "recovery", retained!))).toEqual(oldBytes);

    const secondOldGraph = structuredClone(await normalizedGraph(root, "-second-old")) as Record<string, unknown> & {
      generator: Record<string, unknown>;
    };
    delete secondOldGraph.generator.toolchainIdentitySha256;
    const secondOldBytes = Buffer.from(`${JSON.stringify(secondOldGraph, null, 2)}\n`);
    const secondCandidate = await normalizedGraph(root, "-second-new");
    const secondLock = await acquireRepositoryGraphLock(root, { buildId: "contract-upgrade-two", initialCorpusFingerprintSha256: capture.fingerprintSha256 });
    await writeFile(path.join(custodyRoot, "current.json"), secondOldBytes, { mode: 0o600 });
    await publishRepositoryGraph(root, "contract-upgrade-two", secondCandidate, await expectedSource(root, capture));
    await releaseRepositoryGraphLock(secondLock.lockPath, "contract-upgrade-two");
    const retiredFiles = (await readdir(path.join(custodyRoot, "recovery"))).filter((entry) => entry.startsWith("retired-unverified-"));
    expect(retiredFiles).toHaveLength(1);
    expect(await readFile(path.join(custodyRoot, "recovery", retiredFiles[0]))).toEqual(secondOldBytes);
  });

  it("distinguishes current from stale and refuses queries against stale data", async () => {
    const root = await createRepository();
    const capture = await captureRepositoryGraphCorpus(root);
    const graph = await normalizedGraph(root);
    const lock = await acquireRepositoryGraphLock(root, { buildId: "status-publish", initialCorpusFingerprintSha256: capture.fingerprintSha256 });
    await publishRepositoryGraph(root, "status-publish", graph, await expectedSource(root, capture));
    await releaseRepositoryGraphLock(lock.lockPath, "status-publish");
    expect((await getRepositoryGraphRuntimeStatus(root)).state).toBe("ready-current");
    await expect(requireCurrentRepositoryGraph(root)).resolves.toMatchObject({ graphId: graph.graphId });
    await writeFile(path.join(root, "src/a.ts"), "export function a() { return 9; }\n");
    expect((await getRepositoryGraphRuntimeStatus(root)).state).toBe("ready-stale");
    await expect(requireCurrentRepositoryGraph(root)).rejects.toThrow("ready-stale");
  });

  it("treats repository identity and dirty-state changes as stale even when allowlisted bytes do not change", async () => {
    const root = await createRepository();
    const capture = await captureRepositoryGraphCorpus(root);
    const graph = await normalizedGraph(root);
    const lock = await acquireRepositoryGraphLock(root, { buildId: "identity-publish", initialCorpusFingerprintSha256: capture.fingerprintSha256 });
    await publishRepositoryGraph(root, "identity-publish", graph, await expectedSource(root, capture));
    await releaseRepositoryGraphLock(lock.lockPath, "identity-publish");
    await writeFile(path.join(root, "src/excluded/ignored.ts"), "export const ignored = 2;\n");
    execFileSync("git", ["add", "src/excluded/ignored.ts"], { cwd: root });
    execFileSync("git", ["commit", "-qm", "excluded-only commit"], { cwd: root });
    const headStatus = await getRepositoryGraphRuntimeStatus(root);
    expect(headStatus.state).toBe("ready-stale");
    expect(headStatus.reasons).toContain("repository HEAD changed");
    await writeFile(path.join(root, "src/a.ts"), "export function a() { return 7; }\n");
    const dirtyStatus = await getRepositoryGraphRuntimeStatus(root);
    expect(dirtyStatus.reasons).toContain("source dirty state changed");
  });

  it("refuses publication after a HEAD-only source-state change and preserves current bytes", async () => {
    const root = await createRepository();
    const capture = await captureRepositoryGraphCorpus(root);
    const currentGraph = await normalizedGraph(root);
    const firstLock = await acquireRepositoryGraphLock(root, { buildId: "head-first", initialCorpusFingerprintSha256: capture.fingerprintSha256 });
    await publishRepositoryGraph(root, "head-first", currentGraph, await expectedSource(root, capture));
    await releaseRepositoryGraphLock(firstLock.lockPath, "head-first");
    const currentPath = path.join(resolveRepositoryGraphCustodyRoot(root), "current.json");
    const beforeBytes = await readFile(currentPath);
    const recoveryRoot = path.join(resolveRepositoryGraphCustodyRoot(root), "recovery");
    const interruptedSnapshot = `graph-${"8".repeat(64)}-${"7".repeat(64)}.json`;
    await writeFile(path.join(recoveryRoot, interruptedSnapshot), "interrupted cleanup evidence\n");
    const candidate = await normalizedGraph(root, "Candidate");
    const secondLock = await acquireRepositoryGraphLock(root, { buildId: "head-second", initialCorpusFingerprintSha256: capture.fingerprintSha256 });
    await writeFile(path.join(root, "src/excluded/ignored.ts"), "export const ignored = 3;\n");
    execFileSync("git", ["add", "src/excluded/ignored.ts"], { cwd: root });
    execFileSync("git", ["commit", "-qm", "change repository identity"], { cwd: root });
    await expect(publishRepositoryGraph(root, "head-second", candidate, await expectedSource(root, capture))).rejects.toThrow("source changed during the build");
    await releaseRepositoryGraphLock(secondLock.lockPath, "head-second");
    expect(await readFile(currentPath)).toEqual(beforeBytes);
    expect(existsSync(path.join(recoveryRoot, interruptedSnapshot))).toBe(true);
  });
});
