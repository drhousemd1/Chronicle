import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { chmod, lstat, mkdir, readFile, realpath, writeFile } from "node:fs/promises";
import path from "node:path";

import { z } from "zod";

import { isSafeRepositoryGraphPath, stableRepositoryGraphJson } from "../../src/data/chronicle-knowledge-base/repository-graph-contract";

const corpusPolicySchema = z
  .object({
    schema_version: z.literal(1),
    include_roots: z.array(z.string().min(1)),
    include_root_files: z.array(z.string().min(1)),
    include_extensions: z.array(z.string().regex(/^\.[a-z0-9]+$/)),
    exclude_prefixes: z.array(z.string().min(1)),
    max_file_bytes: z.number().int().positive(),
    graphify_version: z.literal("0.9.52"),
    normalizer_version: z.string().min(1),
  })
  .strict();

export type RepositoryGraphCorpusPolicy = z.infer<typeof corpusPolicySchema>;
export type RepositoryGraphSourceEntry = Readonly<{
  path: string;
  sha256: string | null;
  state: "present" | "deleted";
  bytes: number;
  mode: number | null;
}>;

const secretCanary = ["CHRONICLE", "GRAPH", "SECRET", "CANARY"].join("_");
const secretPatterns = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\bAKIA[0-9A-Z]{16}\b/,
  new RegExp(`\\b${secretCanary}\\b`),
  /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/,
] as const;

function sha256(bytes: Buffer | string) {
  return createHash("sha256").update(bytes).digest("hex");
}

function gitNullList(repositoryRoot: string, args: readonly string[]) {
  const value = execFileSync("git", args, { cwd: repositoryRoot });
  return value
    .toString("utf8")
    .split("\0")
    .filter(Boolean)
    .map((entry) => entry.split("\\").join("/"));
}

export async function loadRepositoryGraphCorpusPolicy(repositoryRoot: string) {
  const source = await readFile(path.join(repositoryRoot, "config/chronicle-repository-graph-policy.json"), "utf8");
  const policy = corpusPolicySchema.parse(JSON.parse(source));
  return Object.freeze({ policy, sha256: sha256(source) });
}

export function repositoryGraphPolicyAllowsPath(
  repositoryPath: string,
  policy: RepositoryGraphCorpusPolicy,
) {
  if (!isSafeRepositoryGraphPath(repositoryPath)) return false;
  if (policy.exclude_prefixes.some((prefix) => repositoryPath === prefix || repositoryPath.startsWith(prefix))) return false;
  if (policy.include_root_files.includes(repositoryPath)) return true;
  if (!policy.include_roots.some((root) => repositoryPath.startsWith(root))) return false;
  return policy.include_extensions.includes(path.posix.extname(repositoryPath));
}

export function assertSourceContainsNoSecrets(repositoryPath: string, bytes: Buffer) {
  const source = bytes.toString("utf8");
  for (const pattern of secretPatterns) {
    if (pattern.test(source)) throw new Error(`Secret-like content is not allowed in the repository graph corpus: ${repositoryPath}.`);
  }
}

export async function captureRepositoryGraphCorpus(repositoryRoot: string) {
  const { policy, sha256: policySha256 } = await loadRepositoryGraphCorpusPolicy(repositoryRoot);
  const presentCandidates = gitNullList(repositoryRoot, ["ls-files", "--cached", "--others", "--exclude-standard", "-z"]);
  const deletedCandidates = new Set(gitNullList(repositoryRoot, ["ls-files", "--deleted", "-z"]));
  const selected = [...new Set([...presentCandidates, ...deletedCandidates])]
    .filter((repositoryPath) => repositoryGraphPolicyAllowsPath(repositoryPath, policy))
    .sort();
  const entries: RepositoryGraphSourceEntry[] = [];
  for (const repositoryPath of selected) {
    if (deletedCandidates.has(repositoryPath)) {
      entries.push(Object.freeze({ path: repositoryPath, sha256: null, state: "deleted", bytes: 0, mode: null }));
      continue;
    }
    const absolute = path.join(repositoryRoot, repositoryPath);
    const state = await lstat(absolute);
    if (state.isSymbolicLink()) throw new Error(`Repository graph corpus rejects symlinks: ${repositoryPath}.`);
    if (!state.isFile()) throw new Error(`Repository graph corpus requires regular files: ${repositoryPath}.`);
    if (state.size > policy.max_file_bytes) throw new Error(`Repository graph corpus file exceeds ${policy.max_file_bytes} bytes: ${repositoryPath}.`);
    const bytes = await readFile(absolute);
    const finalState = await lstat(absolute);
    if (
      finalState.isSymbolicLink() ||
      !finalState.isFile() ||
      finalState.dev !== state.dev ||
      finalState.ino !== state.ino ||
      finalState.size !== state.size ||
      finalState.mtimeMs !== state.mtimeMs
    ) {
      throw new Error(`Repository graph source changed while it was being captured: ${repositoryPath}.`);
    }
    assertSourceContainsNoSecrets(repositoryPath, bytes);
    entries.push(
      Object.freeze({
        path: repositoryPath,
        sha256: sha256(bytes),
        state: "present",
        bytes: bytes.byteLength,
        mode: state.mode,
      }),
    );
  }
  const fingerprintSha256 = sha256(stableRepositoryGraphJson({ policySha256, entries }));
  const repositoryHead = execFileSync("git", ["rev-parse", "HEAD"], { cwd: repositoryRoot, encoding: "utf8" }).trim();
  const dirtyTracked = gitNullList(repositoryRoot, ["diff", "--name-only", "-z", "HEAD", "--"]).some((repositoryPath) =>
    repositoryGraphPolicyAllowsPath(repositoryPath, policy),
  );
  const dirtyUntracked = gitNullList(repositoryRoot, ["ls-files", "--others", "--exclude-standard", "-z"]).some((repositoryPath) =>
    repositoryGraphPolicyAllowsPath(repositoryPath, policy),
  );
  const dirty = dirtyTracked || dirtyUntracked;
  return Object.freeze({
    policy,
    policySha256,
    fingerprintSha256,
    repositoryHead,
    dirty,
    entries: Object.freeze(entries),
  });
}

export async function stageRepositoryGraphCorpus(
  repositoryRoot: string,
  stageRoot: string,
  capture: Awaited<ReturnType<typeof captureRepositoryGraphCorpus>>,
) {
  await mkdir(stageRoot, { recursive: false, mode: 0o700 });
  await chmod(stageRoot, 0o700);
  const canonicalStageRoot = await realpath(stageRoot);
  for (const entry of capture.entries) {
    if (entry.state !== "present") continue;
    const sourcePath = path.join(repositoryRoot, entry.path);
    const targetPath = path.join(stageRoot, entry.path);
    if (!path.resolve(targetPath).startsWith(`${path.resolve(stageRoot)}${path.sep}`)) {
      throw new Error(`Repository graph staging path escaped its root: ${entry.path}.`);
    }
    const initialState = await lstat(sourcePath);
    if (initialState.isSymbolicLink() || !initialState.isFile()) throw new Error(`Repository graph staging requires a stable regular source file: ${entry.path}.`);
    const bytes = await readFile(sourcePath);
    const finalState = await lstat(sourcePath);
    if (
      finalState.isSymbolicLink() ||
      !finalState.isFile() ||
      finalState.dev !== initialState.dev ||
      finalState.ino !== initialState.ino ||
      finalState.size !== initialState.size ||
      finalState.mtimeMs !== initialState.mtimeMs
    ) {
      throw new Error(`Repository graph source changed while it was being staged: ${entry.path}.`);
    }
    if (sha256(bytes) !== entry.sha256) throw new Error(`Repository graph source changed before staging: ${entry.path}.`);
    await mkdir(path.dirname(targetPath), { recursive: true });
    const canonicalParent = await realpath(path.dirname(targetPath));
    if (canonicalParent !== canonicalStageRoot && !canonicalParent.startsWith(`${canonicalStageRoot}${path.sep}`)) {
      throw new Error(`Repository graph staging parent escaped through a symlink: ${entry.path}.`);
    }
    await writeFile(targetPath, bytes, { flag: "wx" });
    await chmod(targetPath, (entry.mode ?? 0o644) & 0o777);
  }
  return Object.freeze({ stagedFiles: capture.entries.filter((entry) => entry.state === "present").length });
}
