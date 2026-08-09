import { createHash } from "node:crypto";
import { constants as fileSystemConstants } from "node:fs";
import {
  lstat,
  open,
  readdir,
} from "node:fs/promises";
import path from "node:path";

import {
  APPROVED_RECORD_DIRECTORIES,
  CHANGELOG_MIGRATION_RECEIPT_LOCATION,
  CHANGELOG_MIGRATION_RECEIPT_RECORD_ID,
  CHANGELOG_MIGRATION_RECEIPT_SOURCE_PATH,
  assertCanonicalRecordDirectories,
  canonicalRecordSourcePath,
  parseCanonicalRecordFileName,
  parseCanonicalRecordSourcePath,
  resolveContainedPath,
  type CanonicalRecordLocation,
} from "./path-safety";

type DirectoryRecordLocation = keyof typeof APPROVED_RECORD_DIRECTORIES;

export type CanonicalSourceEntry = Readonly<{
  location: CanonicalRecordLocation;
  recordId: string;
  sourcePath: string;
  absolutePath: string;
  bytes: Buffer;
  sha256: string;
  mode: number;
}>;

export type CanonicalSourceInventory = Readonly<{
  repoRoot: string;
  entries: readonly CanonicalSourceEntry[];
  membership: readonly string[];
}>;

export type CanonicalInventoryDifference = Readonly<{
  matches: boolean;
  added: readonly string[];
  removed: readonly string[];
  changed: readonly Readonly<{
    sourcePath: string;
    expectedSha256: string;
    actualSha256: string;
  }>[];
  modeChanged: readonly Readonly<{
    sourcePath: string;
    expectedMode: number;
    actualMode: number;
  }>[];
}>;

export function sha256Buffer(bytes: Buffer) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function readOrdinaryFileWithoutFollowingLinks(
  entryPath: string,
  sourcePath: string,
) {
  const initialPathStat = await lstat(entryPath);
  if (initialPathStat.isSymbolicLink() || !initialPathStat.isFile()) {
    throw new Error(`Canonical Markdown is not a regular file: ${sourcePath}.`);
  }

  let handle;
  try {
    handle = await open(
      entryPath,
      fileSystemConstants.O_RDONLY | fileSystemConstants.O_NOFOLLOW,
    );
    const openedStat = await handle.stat();
    if (
      !openedStat.isFile() ||
      openedStat.dev !== initialPathStat.dev ||
      openedStat.ino !== initialPathStat.ino
    ) {
      throw new Error(`Canonical Markdown changed while it was being opened: ${sourcePath}.`);
    }

    const bytes = Buffer.from(await handle.readFile());
    const finalHandleStat = await handle.stat();
    const finalPathStat = await lstat(entryPath);
    if (
      finalPathStat.isSymbolicLink() ||
      !finalPathStat.isFile() ||
      finalHandleStat.dev !== openedStat.dev ||
      finalHandleStat.ino !== openedStat.ino ||
      finalHandleStat.mode !== openedStat.mode ||
      finalHandleStat.size !== openedStat.size ||
      finalHandleStat.mtimeMs !== openedStat.mtimeMs ||
      finalPathStat.dev !== openedStat.dev ||
      finalPathStat.ino !== openedStat.ino ||
      finalPathStat.mode !== openedStat.mode ||
      finalPathStat.size !== openedStat.size ||
      finalPathStat.mtimeMs !== openedStat.mtimeMs
    ) {
      throw new Error(`Canonical Markdown changed while it was being read: ${sourcePath}.`);
    }

    return {
      bytes,
      mode: openedStat.mode & 0o7777,
    };
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as NodeJS.ErrnoException).code === "ELOOP"
    ) {
      throw new Error(`Symbolic links are not allowed for canonical Markdown: ${sourcePath}.`);
    }
    throw error;
  } finally {
    await handle?.close();
  }
}

async function readDirectoryEntries(
  repoRoot: string,
  location: DirectoryRecordLocation,
) {
  const relativeDirectory = APPROVED_RECORD_DIRECTORIES[location];
  const absoluteDirectory = resolveContainedPath(repoRoot, relativeDirectory);
  const names = (await readdir(absoluteDirectory)).sort((left, right) =>
    left.localeCompare(right),
  );
  const entries: CanonicalSourceEntry[] = [];

  for (const name of names) {
    const entryPath = path.join(absoluteDirectory, name);
    const stat = await lstat(entryPath);
    if (stat.isSymbolicLink()) {
      throw new Error(`Symbolic links are not allowed in ${relativeDirectory}: ${name}.`);
    }
    if (name === ".gitkeep") {
      if (!stat.isFile()) {
        throw new Error(`${relativeDirectory}/.gitkeep must be a regular file.`);
      }
      continue;
    }
    if (!name.endsWith(".md")) {
      throw new Error(`Unexpected entry in canonical record directory: ${relativeDirectory}/${name}.`);
    }
    if (!stat.isFile()) {
      throw new Error(`Canonical Markdown entry is not a regular file: ${relativeDirectory}/${name}.`);
    }

    const identity = parseCanonicalRecordFileName(location, name);
    const stableFile = await readOrdinaryFileWithoutFollowingLinks(
      entryPath,
      identity.sourcePath,
    );
    entries.push(
      Object.freeze({
        location,
        recordId: identity.recordId,
        sourcePath: identity.sourcePath,
        absolutePath: entryPath,
        bytes: stableFile.bytes,
        sha256: sha256Buffer(stableFile.bytes),
        mode: stableFile.mode,
      }),
    );
  }

  return entries;
}

async function readMigrationReceiptEntry(
  repoRoot: string,
): Promise<CanonicalSourceEntry | null> {
  const sourcePath = canonicalRecordSourcePath(
    CHANGELOG_MIGRATION_RECEIPT_LOCATION,
    CHANGELOG_MIGRATION_RECEIPT_RECORD_ID,
  );
  const absolutePath = resolveContainedPath(repoRoot, sourcePath);
  let stat;
  try {
    stat = await lstat(absolutePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
  if (stat.isSymbolicLink() || !stat.isFile()) {
    throw new Error(
      `Canonical migration receipt is not a regular file: ${CHANGELOG_MIGRATION_RECEIPT_SOURCE_PATH}.`,
    );
  }
  const stableFile = await readOrdinaryFileWithoutFollowingLinks(
    absolutePath,
    sourcePath,
  );
  return Object.freeze({
    location: CHANGELOG_MIGRATION_RECEIPT_LOCATION,
    recordId: CHANGELOG_MIGRATION_RECEIPT_RECORD_ID,
    sourcePath,
    absolutePath,
    bytes: stableFile.bytes,
    sha256: sha256Buffer(stableFile.bytes),
    mode: stableFile.mode,
  });
}

function sameOptionalEntry(
  initial: CanonicalSourceEntry | null,
  final: CanonicalSourceEntry | null,
) {
  if (initial === null || final === null) return initial === final;
  return (
    initial.sourcePath === final.sourcePath &&
    initial.sha256 === final.sha256 &&
    initial.mode === final.mode
  );
}

export async function readCanonicalSourceInventory(
  repoRoot: string,
): Promise<CanonicalSourceInventory> {
  const resolvedRoot = await assertCanonicalRecordDirectories(repoRoot);
  const entries: CanonicalSourceEntry[] = [];
  const initialDirectoryMembership = new Map<DirectoryRecordLocation, readonly string[]>();
  for (const location of Object.keys(
    APPROVED_RECORD_DIRECTORIES,
  ) as DirectoryRecordLocation[]) {
    const absoluteDirectory = resolveContainedPath(
      resolvedRoot,
      APPROVED_RECORD_DIRECTORIES[location],
    );
    initialDirectoryMembership.set(
      location,
      (await readdir(absoluteDirectory)).sort((left, right) => left.localeCompare(right)),
    );
    entries.push(...(await readDirectoryEntries(resolvedRoot, location)));
  }
  const initialReceipt = await readMigrationReceiptEntry(resolvedRoot);
  if (initialReceipt) entries.push(initialReceipt);
  entries.sort((left, right) => left.sourcePath.localeCompare(right.sourcePath));

  const seenPaths = new Set<string>();
  for (const entry of entries) {
    if (seenPaths.has(entry.sourcePath)) {
      throw new Error(`Duplicate canonical source path: ${entry.sourcePath}.`);
    }
    seenPaths.add(entry.sourcePath);
  }

  for (const location of Object.keys(
    APPROVED_RECORD_DIRECTORIES,
  ) as DirectoryRecordLocation[]) {
    const absoluteDirectory = resolveContainedPath(
      resolvedRoot,
      APPROVED_RECORD_DIRECTORIES[location],
    );
    const finalMembership = (await readdir(absoluteDirectory)).sort((left, right) =>
      left.localeCompare(right),
    );
    if (
      finalMembership.join("\0") !==
      (initialDirectoryMembership.get(location) ?? []).join("\0")
    ) {
      throw new Error(
        `Canonical directory membership changed while it was being read: ${APPROVED_RECORD_DIRECTORIES[location]}.`,
      );
    }
  }
  const finalReceipt = await readMigrationReceiptEntry(resolvedRoot);
  if (!sameOptionalEntry(initialReceipt, finalReceipt)) {
    throw new Error(
      `Canonical supporting file changed while it was being read: ${CHANGELOG_MIGRATION_RECEIPT_SOURCE_PATH}.`,
    );
  }

  return Object.freeze({
    repoRoot: resolvedRoot,
    entries: Object.freeze(entries),
    membership: Object.freeze(entries.map((entry) => entry.sourcePath)),
  });
}

export function inventoryToOperationalSourceMap(
  inventory: CanonicalSourceInventory,
) {
  const allSources = inventoryToCanonicalSourceMap(inventory);
  return Object.freeze(
    Object.fromEntries(
      Object.entries(allSources).filter(
        ([sourcePath]) => sourcePath !== CHANGELOG_MIGRATION_RECEIPT_SOURCE_PATH,
      ),
    ),
  );
}

export function inventoryToCanonicalSourceMap(
  inventory: CanonicalSourceInventory,
) {
  const decoder = new TextDecoder("utf-8", { fatal: true });
  return Object.freeze(
    Object.fromEntries(
      inventory.entries.map((entry) => {
        let source: string;
        try {
          source = decoder.decode(entry.bytes);
        } catch {
          throw new Error(`Canonical Markdown is not valid UTF-8: ${entry.sourcePath}.`);
        }
        return [entry.sourcePath, source];
      }),
    ),
  );
}

export function compareCanonicalSourceInventories(
  expected: CanonicalSourceInventory,
  current: CanonicalSourceInventory,
): CanonicalInventoryDifference {
  const expectedByPath = new Map(
    expected.entries.map((entry) => [entry.sourcePath, entry]),
  );
  const currentByPath = new Map(
    current.entries.map((entry) => [entry.sourcePath, entry]),
  );
  const added = current.membership.filter((sourcePath) => !expectedByPath.has(sourcePath));
  const removed = expected.membership.filter((sourcePath) => !currentByPath.has(sourcePath));
  const changed: Array<{
    sourcePath: string;
    expectedSha256: string;
    actualSha256: string;
  }> = [];
  const modeChanged: Array<{
    sourcePath: string;
    expectedMode: number;
    actualMode: number;
  }> = [];

  for (const sourcePath of expected.membership) {
    const expectedEntry = expectedByPath.get(sourcePath);
    const currentEntry = currentByPath.get(sourcePath);
    if (!expectedEntry || !currentEntry) continue;
    if (expectedEntry.sha256 !== currentEntry.sha256) {
      changed.push({
        sourcePath,
        expectedSha256: expectedEntry.sha256,
        actualSha256: currentEntry.sha256,
      });
    }
    if (expectedEntry.mode !== currentEntry.mode) {
      modeChanged.push({
        sourcePath,
        expectedMode: expectedEntry.mode,
        actualMode: currentEntry.mode,
      });
    }
  }

  return Object.freeze({
    matches:
      added.length === 0 &&
      removed.length === 0 &&
      changed.length === 0 &&
      modeChanged.length === 0,
    added: Object.freeze(added),
    removed: Object.freeze(removed),
    changed: Object.freeze(changed.map((entry) => Object.freeze(entry))),
    modeChanged: Object.freeze(modeChanged.map((entry) => Object.freeze(entry))),
  });
}

export function assertCanonicalInventoryMatches(
  expected: CanonicalSourceInventory,
  current: CanonicalSourceInventory,
) {
  const difference = compareCanonicalSourceInventories(expected, current);
  if (!difference.matches) {
    const categories = [
      difference.added.length > 0 ? `added ${difference.added.join(", ")}` : "",
      difference.removed.length > 0 ? `removed ${difference.removed.join(", ")}` : "",
      difference.changed.length > 0
        ? `changed ${difference.changed.map((entry) => entry.sourcePath).join(", ")}`
        : "",
      difference.modeChanged.length > 0
        ? `mode changed ${difference.modeChanged.map((entry) => entry.sourcePath).join(", ")}`
        : "",
    ].filter(Boolean);
    throw new Error(`Canonical source inventory drifted: ${categories.join("; ")}.`);
  }
  return difference;
}

export function assertInventoryPathsAbsent(
  inventory: CanonicalSourceInventory,
  sourcePaths: readonly string[],
) {
  sourcePaths.forEach((sourcePath) => parseCanonicalRecordSourcePath(sourcePath));
  const present = new Set(inventory.membership);
  const duplicates = sourcePaths.filter(
    (sourcePath, index) => sourcePaths.indexOf(sourcePath) !== index,
  );
  if (duplicates.length > 0) {
    throw new Error(`Expected-absent path list contains duplicates: ${[...new Set(duplicates)].join(", ")}.`);
  }
  const conflicts = sourcePaths.filter((sourcePath) => present.has(sourcePath));
  if (conflicts.length > 0) {
    throw new Error(`Expected-absent canonical targets already exist: ${conflicts.join(", ")}.`);
  }
}
