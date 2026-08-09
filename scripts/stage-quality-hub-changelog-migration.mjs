#!/usr/bin/env node

import {
  constants,
  lstat,
  mkdir,
  open,
  realpath,
  rm,
} from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const MIGRATION_PACKAGE_TYPE = "chronicle-quality-hub-changelog-migration";
export const MIGRATION_PACKAGE_VERSION = 1;

const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = path.resolve(SCRIPT_DIRECTORY, "..");
const STAGING_DIRECTORY_NAME = "Chronicle Knowledge Migration";
const STAGED_EXPORT_NAME = "quality-hub-changelog-migration.json";
const REQUIRED_DIRECTORY_MODE = 0o700;
const REQUIRED_FILE_MODE = 0o600;
const NO_FOLLOW = constants.O_NOFOLLOW ?? 0;
export const MAX_MIGRATION_EXPORT_BYTES = 134_217_728;
export const MAX_CHECKSUM_COMPANION_BYTES = 4_096;

class StagingError extends Error {
  constructor(message) {
    super(message);
    this.name = "StagingError";
  }
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function permissionMode(fileStat) {
  return fileStat.mode & 0o777;
}

function isWithin(candidatePath, parentPath) {
  const relative = path.relative(parentPath, candidatePath);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

async function canonicalRepositoryRoot() {
  return realpath(REPOSITORY_ROOT);
}

async function readExactOpenedFile(handle, expectedSize, label) {
  const bytes = Buffer.allocUnsafe(expectedSize);
  let offset = 0;
  while (offset < expectedSize) {
    const { bytesRead } = await handle.read(bytes, offset, expectedSize - offset, offset);
    if (bytesRead === 0) {
      throw new StagingError(`${label} changed while it was being read.`);
    }
    offset += bytesRead;
  }

  const extraByte = Buffer.allocUnsafe(1);
  const { bytesRead: extraBytesRead } = await handle.read(extraByte, 0, 1, expectedSize);
  if (extraBytesRead !== 0) {
    throw new StagingError(`${label} changed while it was being read.`);
  }
  return bytes;
}

async function inspectRegularInput(inputPath, label, maximumBytes) {
  const resolvedPath = path.resolve(inputPath);
  let linkStat;
  let canonicalPath;

  try {
    linkStat = await lstat(resolvedPath);
    canonicalPath = await realpath(resolvedPath);
  } catch {
    throw new StagingError(`${label} is missing or cannot be read.`);
  }

  if (linkStat.isSymbolicLink() || !linkStat.isFile()) {
    throw new StagingError(`${label} must be a regular file, not a link or special path.`);
  }
  if (!Number.isSafeInteger(linkStat.size) || linkStat.size > maximumBytes) {
    throw new StagingError(`${label} exceeds the maximum allowed size.`);
  }
  if (canonicalPath !== resolvedPath) {
    throw new StagingError(`${label} must not use symbolic-link path components or aliases.`);
  }

  const repositoryRoot = await canonicalRepositoryRoot();
  if (isWithin(canonicalPath, repositoryRoot)) {
    throw new StagingError(`${label} must remain outside the Chronicle Git repository.`);
  }

  let handle;
  try {
    handle = await open(canonicalPath, constants.O_RDONLY | NO_FOLLOW);
    const openedStat = await handle.stat();
    if (
      !openedStat.isFile()
      || openedStat.dev !== linkStat.dev
      || openedStat.ino !== linkStat.ino
      || openedStat.size !== linkStat.size
    ) {
      throw new StagingError(`${label} changed while it was being opened.`);
    }
    if (!Number.isSafeInteger(openedStat.size) || openedStat.size > maximumBytes) {
      throw new StagingError(`${label} exceeds the maximum allowed size.`);
    }
    const bytes = await readExactOpenedFile(handle, openedStat.size, label);
    return { canonicalPath, bytes };
  } catch (error) {
    if (error instanceof StagingError) throw error;
    throw new StagingError(`${label} could not be read safely.`);
  } finally {
    await handle?.close();
  }
}

function parseMigrationPackage(bytes) {
  let parsed;
  try {
    const jsonText = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    parsed = JSON.parse(jsonText);
  } catch {
    throw new StagingError("The export is not valid UTF-8 JSON.");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new StagingError("The export package must be a JSON object.");
  }
  if (parsed.packageType !== MIGRATION_PACKAGE_TYPE || parsed.packageVersion !== MIGRATION_PACKAGE_VERSION) {
    throw new StagingError("The export package type or version is not supported.");
  }
}

function parseChecksum(bytes) {
  let checksumText;
  try {
    checksumText = new TextDecoder("utf-8", { fatal: true }).decode(bytes).trim();
  } catch {
    throw new StagingError("The checksum companion is not valid UTF-8 text.");
  }

  const lines = checksumText.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length !== 1) {
    throw new StagingError("The checksum companion must contain exactly one SHA-256 checksum.");
  }

  const match = /^([a-fA-F0-9]{64})(?:\s+\*?[^\r\n]+)?$/.exec(lines[0].trim());
  if (!match) {
    throw new StagingError("The checksum companion does not contain a valid SHA-256 checksum.");
  }
  return match[1].toLowerCase();
}

async function findChecksumPath(sourcePath, explicitChecksumPath) {
  if (explicitChecksumPath) return explicitChecksumPath;

  const adjacentPath = `${sourcePath}.sha256`;
  try {
    await lstat(adjacentPath);
    return adjacentPath;
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") return null;
    throw new StagingError("The adjacent checksum companion could not be inspected safely.");
  }
}

async function ensureOrdinaryDirectory(directoryPath, label, requiredMode = null) {
  let linkStat;
  let canonicalPath;
  try {
    linkStat = await lstat(directoryPath);
    canonicalPath = await realpath(directoryPath);
  } catch {
    throw new StagingError(`${label} could not be created or inspected safely.`);
  }

  if (linkStat.isSymbolicLink() || !linkStat.isDirectory() || canonicalPath !== directoryPath) {
    throw new StagingError(`${label} must be a real directory without path aliases.`);
  }
  if (requiredMode !== null && permissionMode(linkStat) !== requiredMode) {
    throw new StagingError(`${label} does not have the required owner-only permissions.`);
  }
  return canonicalPath;
}

async function prepareStagingRoot(homeDirectory) {
  if (!homeDirectory || !path.isAbsolute(homeDirectory)) {
    throw new StagingError("HOME must identify an absolute local directory.");
  }

  const resolvedHome = path.resolve(homeDirectory);
  const canonicalHome = await ensureOrdinaryDirectory(resolvedHome, "HOME");
  const appSupportPath = path.join(canonicalHome, "Library", "Application Support");
  const repositoryRoot = await canonicalRepositoryRoot();
  if (isWithin(appSupportPath, repositoryRoot)) {
    throw new StagingError("The migration staging location must remain outside the Chronicle Git repository.");
  }
  try {
    await mkdir(appSupportPath, { recursive: true });
  } catch {
    throw new StagingError("The application-support directory could not be created safely.");
  }
  await ensureOrdinaryDirectory(path.join(canonicalHome, "Library"), "The Library directory");
  await ensureOrdinaryDirectory(appSupportPath, "The application-support directory");

  const migrationRoot = path.join(appSupportPath, STAGING_DIRECTORY_NAME);
  try {
    await mkdir(migrationRoot, { mode: REQUIRED_DIRECTORY_MODE });
  } catch (error) {
    if (!error || typeof error !== "object" || error.code !== "EEXIST") {
      throw new StagingError("The migration staging root could not be created safely.");
    }
  }
  return ensureOrdinaryDirectory(migrationRoot, "The migration staging root", REQUIRED_DIRECTORY_MODE);
}

async function createUniqueStagingDirectory(stagingRoot) {
  const timestamp = new Date().toISOString().replace(/[-:.]/g, "");
  const directoryPath = path.join(stagingRoot, `${timestamp}-${randomUUID()}`);
  try {
    await mkdir(directoryPath, { mode: REQUIRED_DIRECTORY_MODE });
  } catch {
    throw new StagingError("A unique migration staging directory could not be created without overwriting data.");
  }
  return ensureOrdinaryDirectory(directoryPath, "The migration staging directory", REQUIRED_DIRECTORY_MODE);
}

async function verifyPrivateRegularFile(filePath, expectedBytes, expectedHash, label) {
  let linkStat;
  let canonicalPath;
  try {
    linkStat = await lstat(filePath);
    canonicalPath = await realpath(filePath);
  } catch {
    throw new StagingError(`${label} could not be verified.`);
  }

  if (
    linkStat.isSymbolicLink()
    || !linkStat.isFile()
    || canonicalPath !== filePath
    || permissionMode(linkStat) !== REQUIRED_FILE_MODE
  ) {
    throw new StagingError(`${label} failed its file-type or owner-only permission check.`);
  }

  let actualBytes;
  try {
    const handle = await open(filePath, constants.O_RDONLY | NO_FOLLOW);
    try {
      actualBytes = await handle.readFile();
    } finally {
      await handle.close();
    }
  } catch {
    throw new StagingError(`${label} could not be re-read safely.`);
  }

  if (!actualBytes.equals(expectedBytes) || sha256(actualBytes) !== expectedHash) {
    throw new StagingError(`${label} does not match the bytes that were staged.`);
  }
}

async function writeExclusivePrivateFile(filePath, bytes, label) {
  let handle;
  try {
    handle = await open(
      filePath,
      constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | NO_FOLLOW,
      REQUIRED_FILE_MODE,
    );
    await handle.writeFile(bytes);
    await handle.sync();
  } catch (error) {
    if (error && typeof error === "object" && error.code === "EEXIST") {
      throw new StagingError(`${label} already exists; no file was overwritten.`);
    }
    if (error instanceof StagingError) throw error;
    throw new StagingError(`${label} could not be written safely.`);
  } finally {
    await handle?.close();
  }
}

export async function stageQualityHubMigration({
  sourcePath,
  checksumPath = null,
  homeDirectory = process.env.HOME,
}) {
  if (!sourcePath) throw new StagingError("A downloaded migration export path is required.");

  const source = await inspectRegularInput(
    sourcePath,
    "The migration export",
    MAX_MIGRATION_EXPORT_BYTES,
  );
  parseMigrationPackage(source.bytes);
  const sourceHash = sha256(source.bytes);

  const selectedChecksumPath = await findChecksumPath(source.canonicalPath, checksumPath);
  if (!selectedChecksumPath) {
    throw new StagingError(
      "A checksum companion is required; provide one explicitly or place it beside the export as <json>.sha256.",
    );
  }
  const checksum = await inspectRegularInput(
    selectedChecksumPath,
    "The checksum companion",
    MAX_CHECKSUM_COMPANION_BYTES,
  );
  if (parseChecksum(checksum.bytes) !== sourceHash) {
    throw new StagingError("The migration export does not match its SHA-256 checksum.");
  }

  const stagingRoot = await prepareStagingRoot(homeDirectory);
  let stagingDirectory = null;
  try {
    stagingDirectory = await createUniqueStagingDirectory(stagingRoot);
    const exportPath = path.join(stagingDirectory, STAGED_EXPORT_NAME);
    const checksumOutputPath = `${exportPath}.sha256`;

    await writeExclusivePrivateFile(exportPath, source.bytes, "The staged migration export");
    await verifyPrivateRegularFile(exportPath, source.bytes, sourceHash, "The staged migration export");
    await writeExclusivePrivateFile(checksumOutputPath, checksum.bytes, "The staged checksum companion");
    await verifyPrivateRegularFile(
      checksumOutputPath,
      checksum.bytes,
      sha256(checksum.bytes),
      "The staged checksum companion",
    );

    const sourceAfter = await inspectRegularInput(
      source.canonicalPath,
      "The migration export",
      MAX_MIGRATION_EXPORT_BYTES,
    );
    if (!sourceAfter.bytes.equals(source.bytes) || sha256(sourceAfter.bytes) !== sourceHash) {
      throw new StagingError("The source export changed while it was being staged.");
    }

    return {
      status: "staged",
      stagingDirectory,
      exportPath,
      checksumPath: checksumOutputPath,
      sha256: sourceHash,
    };
  } catch (error) {
    if (stagingDirectory && isWithin(stagingDirectory, stagingRoot)) {
      try {
        await rm(stagingDirectory, { recursive: true, force: false });
      } catch {
        throw new StagingError("Staging failed and its incomplete private directory requires manual review.");
      }
    }
    throw error;
  }
}

function printSafeResult(result) {
  process.stdout.write([
    `status: ${result.status}`,
    `staging_directory: ${result.stagingDirectory}`,
    `export_file: ${result.exportPath}`,
    `checksum_file: ${result.checksumPath}`,
    `sha256: ${result.sha256}`,
    "source_deleted: no",
    "",
  ].join("\n"));
}

async function runCli() {
  const args = process.argv.slice(2);
  if (args.length < 1 || args.length > 2) {
    throw new StagingError("Usage: npm run quality-hub:migration:stage -- <downloaded-json> [checksum-file]");
  }
  const result = await stageQualityHubMigration({ sourcePath: args[0], checksumPath: args[1] ?? null });
  printSafeResult(result);
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : null;
if (invokedPath === import.meta.url) {
  runCli().catch((error) => {
    const reason = error instanceof StagingError ? error.message : "The migration export could not be staged safely.";
    process.stderr.write(`status: failed\nreason: ${reason}\n`);
    process.exitCode = 1;
  });
}
