import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  chmod,
  lstat,
  mkdtemp,
  mkdir,
  readFile,
  realpath,
  rm,
  stat,
  symlink,
  truncate,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const SCRIPT_PATH = fileURLToPath(new URL("./stage-quality-hub-changelog-migration.mjs", import.meta.url));
const REPOSITORY_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");

function hash(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function exportBytes(overrides = {}) {
  return Buffer.from(JSON.stringify({
    packageType: "chronicle-quality-hub-changelog-migration",
    packageVersion: 1,
    exportedAt: "2026-08-01T12:00:00.000Z",
    authenticatedUserFingerprint: "must-not-appear-in-output",
    sources: { ownerDatabase: { entries: [] } },
    ...overrides,
  }, null, 2));
}

function parseOutput(stdout) {
  return Object.fromEntries(
    stdout.trim().split("\n").map((line) => {
      const separator = line.indexOf(": ");
      return [line.slice(0, separator), line.slice(separator + 2)];
    }),
  );
}

async function createFixture() {
  const canonicalTemporaryRoot = await realpath(os.tmpdir());
  const root = await mkdtemp(path.join(canonicalTemporaryRoot, "chronicle-migration-stage-test-"));
  const home = path.join(root, "home");
  const downloads = path.join(root, "downloads");
  await mkdir(home, { mode: 0o700 });
  await mkdir(downloads, { mode: 0o700 });
  return { root, home, downloads };
}

async function writeExport(downloads, name = "capture.json", overrides = {}) {
  const sourcePath = path.join(downloads, name);
  const bytes = exportBytes(overrides);
  await writeFile(sourcePath, bytes, { mode: 0o600 });
  return { sourcePath, bytes };
}

async function writeChecksum(sourcePath, bytes, checksumPath = `${sourcePath}.sha256`) {
  const checksumBytes = Buffer.from(`${hash(bytes)}  ${path.basename(sourcePath)}\n`, "utf8");
  await writeFile(checksumPath, checksumBytes, { mode: 0o600 });
  return { checksumPath, checksumBytes };
}

function runCli(home, sourcePath, checksumPath = null) {
  const args = [SCRIPT_PATH, sourcePath];
  if (checksumPath) args.push(checksumPath);
  return spawnSync(process.execPath, args, {
    cwd: REPOSITORY_ROOT,
    encoding: "utf8",
    env: { ...process.env, HOME: home },
  });
}

async function mode(filePath) {
  return (await stat(filePath)).mode & 0o777;
}

test("stages exact bytes outside Git with private modes and preserves the source", async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, { recursive: true, force: true }));
  const { sourcePath, bytes } = await writeExport(fixture.downloads);
  const expectedHash = hash(bytes);
  const { checksumBytes } = await writeChecksum(sourcePath, bytes);

  const result = runCli(fixture.home, sourcePath);
  assert.equal(result.status, 0, result.stderr);
  const output = parseOutput(result.stdout);
  assert.equal(output.status, "staged");
  assert.equal(output.sha256, expectedHash);
  assert.equal(output.source_deleted, "no");
  assert.equal(result.stdout.includes("must-not-appear-in-output"), false);
  assert.equal(await mode(output.staging_directory), 0o700);
  assert.equal(await mode(output.export_file), 0o600);
  assert.equal(await mode(output.checksum_file), 0o600);
  assert.deepEqual(await readFile(output.export_file), bytes);
  assert.deepEqual(await readFile(output.checksum_file), checksumBytes);
  assert.deepEqual(await readFile(sourcePath), bytes);
});

test("accepts a valid checksum supplied as the explicit second argument", async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, { recursive: true, force: true }));
  const { sourcePath, bytes } = await writeExport(fixture.downloads);
  const checksumPath = path.join(fixture.downloads, "owner-capture-checksum.txt");
  const { checksumBytes } = await writeChecksum(sourcePath, bytes, checksumPath);

  const result = runCli(fixture.home, sourcePath, checksumPath);
  assert.equal(result.status, 0, result.stderr);
  const output = parseOutput(result.stdout);
  assert.deepEqual(await readFile(output.export_file), bytes);
  assert.deepEqual(await readFile(output.checksum_file), checksumBytes);
});

test("rejects an export stored anywhere inside the Chronicle Git root", async (t) => {
  const fixture = await createFixture();
  const insideDirectory = await mkdtemp(path.join(REPOSITORY_ROOT, "node_modules", ".migration-stage-test-"));
  t.after(() => Promise.all([
    rm(fixture.root, { recursive: true, force: true }),
    rm(insideDirectory, { recursive: true, force: true }),
  ]));
  const sourcePath = path.join(insideDirectory, "capture.json");
  await writeFile(sourcePath, exportBytes(), { mode: 0o600 });

  const result = runCli(fixture.home, sourcePath);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /outside the Chronicle Git repository/);
  assert.equal(await readFile(sourcePath, "utf8").then(Boolean), true);
});

test("rejects a checksum mismatch before creating the staging root", async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, { recursive: true, force: true }));
  const { sourcePath, bytes } = await writeExport(fixture.downloads);
  const checksumPath = path.join(fixture.downloads, "capture.sha256");
  await writeFile(checksumPath, `${"0".repeat(64)}  capture.json\n`, { mode: 0o600 });

  const result = runCli(fixture.home, sourcePath, checksumPath);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /does not match its SHA-256 checksum/);
  assert.deepEqual(await readFile(sourcePath), bytes);
  await assert.rejects(
    lstat(path.join(fixture.home, "Library", "Application Support", "Chronicle Knowledge Migration")),
    { code: "ENOENT" },
  );
});

test("repeated staging creates a new directory and never overwrites the first result", async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, { recursive: true, force: true }));
  const { sourcePath, bytes } = await writeExport(fixture.downloads);
  await writeChecksum(sourcePath, bytes);

  const first = runCli(fixture.home, sourcePath);
  const firstOutput = parseOutput(first.stdout);
  const firstStat = await stat(firstOutput.export_file);
  const second = runCli(fixture.home, sourcePath);
  const secondOutput = parseOutput(second.stdout);

  assert.equal(first.status, 0, first.stderr);
  assert.equal(second.status, 0, second.stderr);
  assert.notEqual(firstOutput.staging_directory, secondOutput.staging_directory);
  assert.deepEqual(await readFile(firstOutput.export_file), bytes);
  assert.deepEqual(await readFile(secondOutput.export_file), bytes);
  assert.equal((await stat(firstOutput.export_file)).ino, firstStat.ino);
  assert.deepEqual(await readFile(sourcePath), bytes);
});

test("rejects symbolic-link input and a staging root with non-private permissions", async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, { recursive: true, force: true }));
  const { sourcePath } = await writeExport(fixture.downloads);
  const linkedPath = path.join(fixture.downloads, "linked.json");
  await symlink(sourcePath, linkedPath);

  const linkedResult = runCli(fixture.home, linkedPath);
  assert.notEqual(linkedResult.status, 0);
  assert.match(linkedResult.stderr, /regular file, not a link/);

  const stagingRoot = path.join(fixture.home, "Library", "Application Support", "Chronicle Knowledge Migration");
  const sourceBytes = await readFile(sourcePath);
  await writeChecksum(sourcePath, sourceBytes);
  await mkdir(stagingRoot, { recursive: true, mode: 0o755 });
  await chmod(stagingRoot, 0o755);
  const permissionResult = runCli(fixture.home, sourcePath);
  assert.notEqual(permissionResult.status, 0);
  assert.match(permissionResult.stderr, /owner-only permissions/);
});

test("rejects malformed JSON and unsupported package identity", async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, { recursive: true, force: true }));
  const malformedPath = path.join(fixture.downloads, "malformed.json");
  await writeFile(malformedPath, "{", { mode: 0o600 });
  const wrongPackage = await writeExport(fixture.downloads, "wrong.json", { packageVersion: 2 });

  const malformedResult = runCli(fixture.home, malformedPath);
  assert.notEqual(malformedResult.status, 0);
  assert.match(malformedResult.stderr, /not valid UTF-8 JSON/);

  const wrongResult = runCli(fixture.home, wrongPackage.sourcePath);
  assert.notEqual(wrongResult.status, 0);
  assert.match(wrongResult.stderr, /type or version is not supported/);
});

test("requires an explicit or exact adjacent checksum before creating staging output", async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, { recursive: true, force: true }));
  const { sourcePath } = await writeExport(fixture.downloads);

  const result = runCli(fixture.home, sourcePath);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /checksum companion is required/);
  await assert.rejects(
    lstat(path.join(fixture.home, "Library", "Application Support", "Chronicle Knowledge Migration")),
    { code: "ENOENT" },
  );
});

test("rejects an oversized migration export from stat before reading or staging", async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, { recursive: true, force: true }));
  const sourcePath = path.join(fixture.downloads, "oversized.json");
  await writeFile(sourcePath, "", { mode: 0o600 });
  await truncate(sourcePath, 134_217_729);

  const result = runCli(fixture.home, sourcePath);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /migration export exceeds the maximum allowed size/);
  await assert.rejects(
    lstat(path.join(fixture.home, "Library", "Application Support", "Chronicle Knowledge Migration")),
    { code: "ENOENT" },
  );
});

test("rejects an oversized checksum companion from stat before reading or staging", async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, { recursive: true, force: true }));
  const { sourcePath, bytes } = await writeExport(fixture.downloads);
  const { checksumPath } = await writeChecksum(sourcePath, bytes);
  await truncate(checksumPath, 4_097);

  const result = runCli(fixture.home, sourcePath);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /checksum companion exceeds the maximum allowed size/);
  await assert.rejects(
    lstat(path.join(fixture.home, "Library", "Application Support", "Chronicle Knowledge Migration")),
    { code: "ENOENT" },
  );
});
