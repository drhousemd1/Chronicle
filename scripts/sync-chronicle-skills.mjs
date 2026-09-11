import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, realpathSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultManifest = path.join(repositoryRoot, "docs/codex-skills/catalog-manifest.json");
const defaultOutput = path.join(repositoryRoot, "src/data/chronicle-knowledge-base/codex-skills.generated.json");
const hash = (value) => createHash("sha256").update(value).digest("hex");

function inside(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

function readTextFile(root, relativePath) {
  if (typeof relativePath !== "string" || !relativePath || path.isAbsolute(relativePath)) {
    throw new Error("Instruction file paths must be relative to their source package.");
  }
  const canonicalRoot = realpathSync(root);
  const canonicalFile = realpathSync(path.resolve(root, relativePath));
  if (!inside(canonicalRoot, canonicalFile)) throw new Error(`Instruction path escapes its source package: ${relativePath}`);
  const info = statSync(canonicalFile);
  if (!info.isFile() || info.size > 2_000_000) throw new Error(`Instruction source is not a bounded ordinary file: ${relativePath}`);
  const bytes = readFileSync(canonicalFile);
  const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  return { path: canonicalFile, text, sha256: hash(bytes), words: text.match(/\S+/g)?.length ?? 0 };
}

export function loadInstalledPlugins(codexBinary = "/Applications/ChatGPT.app/Contents/Resources/codex") {
  return JSON.parse(execFileSync(codexBinary, ["plugin", "list", "--json"], {
    encoding: "utf8", timeout: 30_000, maxBuffer: 8_000_000,
  }));
}

export function buildSkillCatalog(manifest, { codexHome = path.join(homedir(), ".codex"), installedPlugins, syncedAt = new Date().toISOString() } = {}) {
  if (manifest?.schemaVersion !== 1 || !Array.isArray(manifest.skills) || !manifest.skills.length) {
    throw new Error("A version 1 manifest with approved skills is required.");
  }
  const ids = new Set();
  const entries = manifest.skills.map((skill) => {
    if (typeof skill?.id !== "string" || !/^[a-z0-9][a-z0-9-]*$/.test(skill.id) || ids.has(skill.id)) throw new Error(`Invalid or duplicate skill ID: ${skill?.id}`);
    ids.add(skill.id);
    if (!["Chronicle", "Shared"].includes(skill.classification)) throw new Error(`Unapproved classification: ${skill.id}`);
    if (typeof skill.displayName !== "string" || !skill.displayName.trim()) throw new Error(`Missing display name: ${skill.id}`);
    if (typeof skill.usage !== "string" || !skill.usage.trim()) throw new Error(`Missing usage boundary: ${skill.id}`);
    if (!skill.source || typeof skill.source !== "object") throw new Error(`Missing skill source: ${skill.id}`);
    let root;
    let sourceVersion = null;
    if (skill.source.kind === "personal") {
      root = path.join(codexHome, "skills", skill.source.directory);
      if (!inside(path.join(codexHome, "skills"), root)) throw new Error(`Invalid personal source: ${skill.id}`);
    } else if (skill.source.kind === "system") {
      root = path.join(codexHome, "skills", ".system", skill.source.directory);
      if (!inside(path.join(codexHome, "skills", ".system"), root)) throw new Error(`Invalid system source: ${skill.id}`);
    } else if (skill.source.kind === "plugin") {
      const matches = installedPlugins?.installed?.filter((plugin) => plugin.pluginId === skill.source.pluginId && plugin.installed);
      if (matches?.length !== 1) throw new Error(`Installed plugin identity is missing or ambiguous: ${skill.source.pluginId}`);
      const plugin = matches[0];
      for (const value of [plugin.marketplaceName, plugin.name, plugin.version]) {
        if (typeof value !== "string" || !value || value.includes("/") || value.includes("\\") || value === "..") throw new Error("Invalid installed plugin path segment.");
      }
      root = path.join(codexHome, "plugins", "cache", plugin.marketplaceName, plugin.name, plugin.version);
      sourceVersion = plugin.version;
    } else {
      throw new Error(`Unsupported skill source: ${skill.id}`);
    }
    const main = readTextFile(root, skill.source.entrypoint ?? "SKILL.md");
    const frontmatter = main.text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
    if (!frontmatter) throw new Error(`Missing skill metadata: ${skill.id}`);
    const metadata = parse(frontmatter[1]);
    if (typeof metadata?.name !== "string" || typeof metadata?.description !== "string") throw new Error(`Invalid skill metadata: ${skill.id}`);
    const files = skill.supportingFiles ?? [];
    if (!Array.isArray(files) || new Set(files).size !== files.length) throw new Error(`Duplicate supporting instruction: ${skill.id}`);
    const supportPaths = new Set([main.path]);
    const supportingFiles = files.map((relativePath) => {
      const file = readTextFile(root, relativePath);
      if (supportPaths.has(file.path)) throw new Error(`Duplicate canonical instruction: ${skill.id} ${relativePath}`);
      supportPaths.add(file.path);
      return { ...file, relativePath: path.relative(path.dirname(main.path), file.path).split(path.sep).join("/"), id: hash(relativePath).slice(0, 16) };
    });
    return {
      id: skill.id, displayName: skill.displayName, classification: skill.classification,
      identifier: skill.source.pluginId ? `${skill.source.pluginId.split("@")[0]}:${metadata.name}` : metadata.name,
      purpose: metadata.description, usage: skill.usage, sourceVersion,
      source: { ...main, relativePath: "SKILL.md" }, supportingFiles,
    };
  });
  return { schemaVersion: 1, syncedAt, manifestSha256: hash(JSON.stringify(manifest)), entries };
}

export function compareSkillCatalog(expected, actual) {
  const errors = [];
  if (actual?.schemaVersion !== expected.schemaVersion) errors.push("Catalog schema is stale.");
  if (actual?.manifestSha256 !== expected.manifestSha256) errors.push("Catalog manifest has changed; synchronize it.");
  const actualEntries = new Map((actual?.entries ?? []).map((entry) => [entry.id, entry]));
  if (JSON.stringify(actual?.entries?.map((entry) => entry.id)) !== JSON.stringify(expected.entries.map((entry) => entry.id))) errors.push("Catalog skill membership or order has changed.");
  if (actualEntries.size !== actual?.entries?.length) errors.push("Catalog contains duplicate entries.");
  for (const entry of expected.entries) {
    const previous = actualEntries.get(entry.id);
    if (!previous) errors.push(`Missing approved skill: ${entry.id}`);
    else if (JSON.stringify(previous) !== JSON.stringify(entry)) errors.push(`Stale skill content or metadata: ${entry.id}`);
    actualEntries.delete(entry.id);
  }
  for (const id of actualEntries.keys()) errors.push(`Unexpected catalog skill: ${id}`);
  if (!Number.isFinite(Date.parse(actual?.syncedAt))) errors.push("Catalog synchronization date is missing or invalid.");
  return errors;
}

function main() {
  const args = process.argv.slice(2);
  const value = (flag, fallback) => {
    const index = args.indexOf(flag);
    if (index < 0) return fallback;
    if (!args[index + 1] || args[index + 1].startsWith("--")) throw new Error(`Missing value for ${flag}`);
    return path.resolve(args[index + 1]);
  };
  const manifestPath = value("--manifest", defaultManifest);
  const outputPath = value("--output", defaultOutput);
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const needsPlugins = manifest.skills.some((skill) => skill.source.kind === "plugin");
  const inventoryPath = value("--installed-plugins", null);
  const installedPlugins = needsPlugins ? (inventoryPath ? JSON.parse(readFileSync(inventoryPath, "utf8")) : loadInstalledPlugins()) : undefined;
  const expected = buildSkillCatalog(manifest, { installedPlugins });
  if (args.includes("--check")) {
    const actual = JSON.parse(readFileSync(outputPath, "utf8"));
    const errors = compareSkillCatalog(expected, actual);
    if (errors.length) throw new Error(errors.join("\n"));
    console.log(`Chronicle skills parity passed: ${expected.entries.length} approved skills and their supporting instructions.${inventoryPath ? " Plugin identities were resolved from the supplied inventory snapshot." : ""}`);
  } else {
    writeFileSync(outputPath, `${JSON.stringify(expected, null, 2)}\n`);
    console.log(`Synchronized ${expected.entries.length} Chronicle skills from their authoritative sources.${inventoryPath ? " Plugin identities were resolved from the supplied inventory snapshot." : ""}`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(`Chronicle skills synchronization failed: ${error.message}`); process.exitCode = 1; }
}
