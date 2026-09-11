import { execFileSync } from "node:child_process";
import { copyFile, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  captureRepositoryGraphCorpus,
  loadRepositoryGraphCorpusPolicy,
  repositoryGraphPolicyAllowsPath,
} from "../../../scripts/chronicle-repository-graph/corpus";

const repositoryRoot = path.resolve(import.meta.dirname, "../../..");
const catalogPath = "src/data/chronicle-knowledge-base/codex-skills.generated.json";
const policyPath = "config/chronicle-repository-graph-policy.json";
const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

async function createRepository() {
  const root = await mkdtemp(path.join(tmpdir(), "chronicle-graph-catalog-policy-"));
  temporaryRoots.push(root);
  await mkdir(path.join(root, path.dirname(catalogPath)), { recursive: true });
  await mkdir(path.join(root, "config"), { recursive: true });
  await copyFile(path.join(repositoryRoot, policyPath), path.join(root, policyPath));
  await writeFile(path.join(root, "src/App.tsx"), "export const App = () => null;\n");
  execFileSync("git", ["init", "-q"], { cwd: root });
  execFileSync("git", ["add", "."], { cwd: root });
  execFileSync("git", [
    "-c", "user.email=graph-test@example.invalid",
    "-c", "user.name=Graph Test",
    "-c", "core.hooksPath=/dev/null",
    "-c", "commit.gpgsign=false",
    "commit", "-qm", "fixture",
  ], { cwd: root });
  return root;
}

describe("Repository graph generated skills catalog exclusion", () => {
  it("excludes the instructional catalog while retaining application and graph-view source", async () => {
    const { policy } = await loadRepositoryGraphCorpusPolicy(repositoryRoot);

    expect(repositoryGraphPolicyAllowsPath(catalogPath, policy)).toBe(false);
    expect(repositoryGraphPolicyAllowsPath("src/App.tsx", policy)).toBe(true);
    expect(repositoryGraphPolicyAllowsPath("src/components/admin/knowledge-base/RepositoryGraphView.tsx", policy)).toBe(true);
    expect(repositoryGraphPolicyAllowsPath("src/data/chronicle-knowledge-base/repository-graph-client.ts", policy)).toBe(true);
  });

  it("captures the corpus when the excluded catalog exceeds the real per-file limit", async () => {
    const root = await createRepository();
    const { policy } = await loadRepositoryGraphCorpusPolicy(root);
    await writeFile(path.join(root, catalogPath), JSON.stringify({ documentation: "x".repeat(policy.max_file_bytes) }));

    const capture = await captureRepositoryGraphCorpus(root);

    expect(capture.entries.map((entry) => entry.path)).toEqual(["src/App.tsx"]);
    expect(capture.dirty).toBe(false);
  });

  it("still rejects oversized application source instead of weakening the size guard", async () => {
    const root = await createRepository();
    const { policy } = await loadRepositoryGraphCorpusPolicy(root);
    await writeFile(path.join(root, "src/App.tsx"), "x".repeat(policy.max_file_bytes + 1));

    await expect(captureRepositoryGraphCorpus(root)).rejects.toThrow(
      `Repository graph corpus file exceeds ${policy.max_file_bytes} bytes: src/App.tsx.`,
    );
  });
});
