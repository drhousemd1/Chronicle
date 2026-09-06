import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { z } from "zod";

import {
  isSafeRepositoryGraphPath,
  parseRepositoryGraphEnvelope,
  stableRepositoryGraphJson,
  type CapabilityGraphLens,
  type RepositoryGraphEnvelope,
} from "../../src/data/chronicle-knowledge-base/repository-graph-contract";

const repositoryPathSchema = z.string().refine(isSafeRepositoryGraphPath, {
  message: "must be a normalized repository-relative POSIX path",
});

export const repositoryGraphLensPolicySchema = z
  .object({
    schema_version: z.literal(1),
    capabilities: z.array(
      z
        .object({
          capability_id: z.string().trim().min(1).max(100),
          label: z.string().trim().min(1).max(200),
          manual_path: repositoryPathSchema,
          source_heading: z.string().trim().min(1).max(300),
          source_format: z.enum(["text-fence", "inline-code-list"]),
        })
        .strict(),
    ),
  })
  .strict()
  .superRefine((value, context) => {
    const ids = new Set<string>();
    for (const capability of value.capabilities) {
      if (ids.has(capability.capability_id)) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: `duplicate capability ${capability.capability_id}` });
      }
      ids.add(capability.capability_id);
    }
  });

export type RepositoryGraphLensPolicy = z.infer<typeof repositoryGraphLensPolicySchema>;

export async function loadRepositoryGraphLensPolicy(repositoryRoot: string) {
  const source = await readFile(path.join(repositoryRoot, "config/chronicle-repository-graph-lenses.json"), "utf8");
  const policy = repositoryGraphLensPolicySchema.parse(JSON.parse(source));
  const sha256 = createHash("sha256").update(source).digest("hex");
  return Object.freeze({ policy, sha256 });
}

function findConfiguredSection(source: string, heading: string) {
  const marker = `### ${heading}`;
  const lines = source.split(/\r?\n/);
  const matches = lines.flatMap((line, index) => (line.trim() === marker ? [index] : []));
  if (matches.length !== 1) throw new Error(`Capability lens requires exactly one ${JSON.stringify(marker)} heading.`);
  const start = matches[0] + 1;
  let end = lines.length;
  for (let index = start; index < lines.length; index += 1) {
    if (/^#{1,3}\s+/.test(lines[index])) {
      end = index;
      break;
    }
  }
  return lines.slice(start, end);
}

function parseConfiguredPaths(lines: readonly string[], format: "text-fence" | "inline-code-list") {
  let paths: string[];
  if (format === "text-fence") {
    const fences: string[][] = [];
    let active: string[] | null = null;
    for (const line of lines) {
      if (line.trim() === "```text") {
        if (active) throw new Error("Capability lens source list contains a nested text fence.");
        active = [];
        continue;
      }
      if (line.trim() === "```" && active) {
        fences.push(active);
        active = null;
        continue;
      }
      if (active) active.push(line);
    }
    if (active) throw new Error("Capability lens source list contains an unterminated text fence.");
    if (fences.length !== 1) throw new Error("Capability lens requires exactly one text-fence source list.");
    paths = fences[0].map((line) => line.trim()).filter(Boolean);
  } else {
    const candidates = lines.filter((line) => /^\s*-\s+`/.test(line));
    paths = candidates.map((line) => {
      const match = line.match(/^\s*-\s+`([^`]+)`\s*$/);
      if (!match) throw new Error(`Capability lens inline source path has unsupported formatting: ${line.trim()}.`);
      return match[1];
    });
    if (paths.length === 0) throw new Error("Capability lens inline source list is empty.");
  }
  const seen = new Set<string>();
  for (const repositoryPath of paths) {
    if (!isSafeRepositoryGraphPath(repositoryPath)) throw new Error(`Capability lens contains an unsafe source path: ${repositoryPath}.`);
    if (seen.has(repositoryPath)) throw new Error(`Capability lens contains duplicate source path: ${repositoryPath}.`);
    seen.add(repositoryPath);
  }
  return Object.freeze(paths);
}

export async function loadCapabilityLensSourceSets(repositoryRoot: string) {
  const { policy } = await loadRepositoryGraphLensPolicy(repositoryRoot);
  const sourceSets = [];
  for (const capability of policy.capabilities) {
    const manualSource = await readFile(path.join(repositoryRoot, capability.manual_path), "utf8");
    const section = findConfiguredSection(manualSource, capability.source_heading);
    const sourcePaths = parseConfiguredPaths(section, capability.source_format);
    sourceSets.push(Object.freeze({
      capabilityId: capability.capability_id,
      label: capability.label,
      manualPath: capability.manual_path,
      sourcePaths,
    }));
  }
  return Object.freeze(sourceSets);
}

export function deriveCapabilityGraphLenses(
  graph: RepositoryGraphEnvelope,
  sourceSets: Awaited<ReturnType<typeof loadCapabilityLensSourceSets>>,
) {
  const graphSourcePaths = new Set(graph.source.paths.filter((entry) => entry.state === "present").map((entry) => entry.path));
  const nodesByPath = new Map<string, string[]>();
  for (const node of graph.graph.nodes) {
    const ids = nodesByPath.get(node.sourcePath) ?? [];
    ids.push(node.id);
    nodesByPath.set(node.sourcePath, ids);
  }
  const lenses: CapabilityGraphLens[] = sourceSets.map((sourceSet) => {
    const sourcePaths = sourceSet.sourcePaths.filter((sourcePath) => graphSourcePaths.has(sourcePath)).sort();
    const unresolvedSourcePaths = sourceSet.sourcePaths.filter((sourcePath) => !graphSourcePaths.has(sourcePath)).sort();
    const coreNodeIds = [...new Set(sourcePaths.flatMap((sourcePath) => nodesByPath.get(sourcePath) ?? []))].sort();
    const coreSet = new Set(coreNodeIds);
    const edgeIds: string[] = [];
    for (const edge of graph.graph.edges) {
      if (!coreSet.has(edge.source) || !coreSet.has(edge.target)) continue;
      edgeIds.push(edge.id);
    }
    return {
      capabilityId: sourceSet.capabilityId,
      label: sourceSet.label,
      sourcePaths,
      unresolvedSourcePaths,
      coreNodeIds,
      contextNodeIds: [],
      edgeIds: edgeIds.sort(),
    };
  });
  return Object.freeze(lenses.sort((left, right) => left.capabilityId.localeCompare(right.capabilityId)));
}

export function applyCapabilityGraphLenses(
  graph: RepositoryGraphEnvelope,
  lenses: readonly CapabilityGraphLens[],
) {
  const base = {
    schemaVersion: graph.schemaVersion,
    generator: graph.generator,
    source: graph.source,
    graph: graph.graph,
    lenses: [...lenses],
  };
  const graphId = `graph:${createHash("sha256").update(stableRepositoryGraphJson(base)).digest("hex")}`;
  return parseRepositoryGraphEnvelope({ ...base, graphId, generatedAt: graph.generatedAt });
}
