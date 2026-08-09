import { randomBytes } from "node:crypto";
import {
  lstat,
  realpath,
} from "node:fs/promises";
import path from "node:path";

export const APPROVED_RECORD_DIRECTORIES = Object.freeze({
  issue: "docs/architecture-knowledge/issues/community-gallery",
  "active-current-work": "docs/current-work/active/community-gallery",
  "archived-current-work": "docs/current-work/archive/community-gallery",
  changelog: "docs/architecture-knowledge/changelog/entries",
} as const);

export const CHANGELOG_MIGRATION_RECEIPT_LOCATION =
  "changelog-migration-receipt" as const;
export const CHANGELOG_MIGRATION_RECEIPT_RECORD_ID =
  "migration-receipt" as const;
export const CHANGELOG_MIGRATION_RECEIPT_SOURCE_PATH =
  "docs/architecture-knowledge/changelog/migration-receipt.md" as const;

export type CanonicalRecordLocation =
  | keyof typeof APPROVED_RECORD_DIRECTORIES
  | typeof CHANGELOG_MIGRATION_RECEIPT_LOCATION;

export type CanonicalRecordIdentity = Readonly<{
  location: CanonicalRecordLocation;
  recordId: string;
  fileName: string;
  sourcePath: string;
}>;

export type CanonicalRecordTarget = CanonicalRecordIdentity &
  Readonly<{
    absolutePath: string;
    state: "present" | "absent";
    mode: number | null;
  }>;

const ISSUE_ID = /^CG-ISSUE-\d{3}$/;
const CURRENT_WORK_ID = /^CG-WORK-\d{3}$/;
const ACCEPTED_CHANGE_ID = /^CG-CHANGE-\d{3}$/;
const LEGACY_CHANGE_ID = /^LEGACY-QH-[A-Za-z0-9][A-Za-z0-9._-]*$/;
const CORRECTION_SUFFIX = /^(.*)-COR-(?:00[1-9]|0[1-9]\d|[1-9]\d{2})$/;

export const TRANSACTION_ID_PATTERN =
  /^kr-(\d{8}T\d{9}Z)-([a-f0-9]{16})$/;

function safeValueLabel(value: unknown) {
  return typeof value === "string" && value.length <= 120
    ? JSON.stringify(value)
    : "the supplied value";
}

function isRealTransactionTimestamp(compact: string) {
  const iso = `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6, 8)}T${compact.slice(9, 11)}:${compact.slice(11, 13)}:${compact.slice(13, 15)}.${compact.slice(15, 18)}Z`;
  const parsed = new Date(iso);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString() === iso;
}

export function generateTransactionId(options: Readonly<{
  now?: Date;
  entropy?: Buffer;
}> = {}) {
  const now = options.now ?? new Date();
  if (Number.isNaN(now.valueOf())) {
    throw new Error("Transaction time must be a valid date.");
  }
  const entropy = options.entropy ?? randomBytes(8);
  if (!Buffer.isBuffer(entropy) || entropy.length !== 8) {
    throw new Error("Transaction entropy must be exactly 8 bytes.");
  }
  const compactTime = now.toISOString().replace(/[-:.]/g, "");
  return `kr-${compactTime}-${entropy.toString("hex")}`;
}

export function parseTransactionId(value: unknown) {
  if (typeof value !== "string") {
    throw new Error("Transaction ID must be a string.");
  }
  const match = value.match(TRANSACTION_ID_PATTERN);
  if (!match || !isRealTransactionTimestamp(match[1])) {
    throw new Error(`Invalid transaction ID ${safeValueLabel(value)}.`);
  }
  return value;
}

export function normalizeStrictRelativePath(value: unknown) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error("Relative path must be a non-empty string.");
  }
  if (value.includes("\0")) {
    throw new Error("Relative path must not contain NUL bytes.");
  }
  if (value.includes("\\")) {
    throw new Error("Relative path must use forward slashes only.");
  }
  if (
    path.posix.isAbsolute(value) ||
    path.win32.isAbsolute(value) ||
    /^[A-Za-z]:/.test(value)
  ) {
    throw new Error("Absolute paths are not allowed.");
  }
  const segments = value.split("/");
  if (
    segments.some(
      (segment) =>
        segment.length === 0 ||
        segment === "." ||
        segment === ".." ||
        Array.from(segment).some((character) => {
          const codePoint = character.codePointAt(0) ?? 0;
          return codePoint <= 0x1f || codePoint === 0x7f;
        }),
    )
  ) {
    throw new Error("Relative path contains an empty, dot, or control-character segment.");
  }
  return segments.join("/");
}

export function resolveContainedPath(root: string, relativePath: string) {
  if (!path.isAbsolute(root)) {
    throw new Error("Containment root must be absolute.");
  }
  const normalized = normalizeStrictRelativePath(relativePath);
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(resolvedRoot, ...normalized.split("/"));
  const relation = path.relative(resolvedRoot, resolved);
  if (
    relation.length === 0 ||
    relation === ".." ||
    relation.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relation)
  ) {
    throw new Error("Resolved path is outside its containment root.");
  }
  return resolved;
}

export async function assertRealDirectory(directoryPath: string, label: string) {
  if (!path.isAbsolute(directoryPath)) {
    throw new Error(`${label} must be an absolute path.`);
  }
  const resolved = path.resolve(directoryPath);
  let stat;
  try {
    stat = await lstat(resolved);
  } catch {
    throw new Error(`${label} does not exist.`);
  }
  if (stat.isSymbolicLink()) {
    throw new Error(`${label} must not be a symbolic link.`);
  }
  if (!stat.isDirectory()) {
    throw new Error(`${label} must be a real directory.`);
  }
  const physicalPath = await realpath(resolved);
  if (physicalPath !== resolved) {
    throw new Error(`${label} must not use a filesystem alias or symbolic-link component.`);
  }
  return resolved;
}

export async function assertNoSymlinkComponents(
  root: string,
  relativePath: string,
  options: Readonly<{ allowMissingLeaf?: boolean }> = {},
) {
  const resolvedRoot = await assertRealDirectory(root, "Containment root");
  const normalized = normalizeStrictRelativePath(relativePath);
  const segments = normalized.split("/");
  let cursor = resolvedRoot;
  for (let index = 0; index < segments.length; index += 1) {
    cursor = path.join(cursor, segments[index]);
    let stat;
    try {
      stat = await lstat(cursor);
    } catch {
      if (options.allowMissingLeaf && index === segments.length - 1) {
        return cursor;
      }
      throw new Error(`Path component does not exist: ${segments.slice(0, index + 1).join("/")}.`);
    }
    if (stat.isSymbolicLink()) {
      throw new Error(`Symbolic links are not allowed: ${segments.slice(0, index + 1).join("/")}.`);
    }
    if (index < segments.length - 1 && !stat.isDirectory()) {
      throw new Error(`Path component is not a directory: ${segments.slice(0, index + 1).join("/")}.`);
    }
  }
  return cursor;
}

export async function assertCanonicalRecordDirectories(repoRoot: string) {
  const resolvedRoot = await assertRealDirectory(repoRoot, "Repository root");
  for (const relativeDirectory of Object.values(APPROVED_RECORD_DIRECTORIES)) {
    const absoluteDirectory = resolveContainedPath(resolvedRoot, relativeDirectory);
    await assertNoSymlinkComponents(resolvedRoot, relativeDirectory);
    await assertRealDirectory(absoluteDirectory, `Canonical directory ${relativeDirectory}`);
  }
  const receiptDirectory = path.posix.dirname(
    CHANGELOG_MIGRATION_RECEIPT_SOURCE_PATH,
  );
  const absoluteReceiptDirectory = resolveContainedPath(
    resolvedRoot,
    receiptDirectory,
  );
  await assertNoSymlinkComponents(resolvedRoot, receiptDirectory);
  await assertRealDirectory(
    absoluteReceiptDirectory,
    `Canonical directory ${receiptDirectory}`,
  );
  return resolvedRoot;
}

function isValidRecordId(location: CanonicalRecordLocation, recordId: string) {
  if (location === CHANGELOG_MIGRATION_RECEIPT_LOCATION) {
    return recordId === CHANGELOG_MIGRATION_RECEIPT_RECORD_ID;
  }
  if (location === "issue") return ISSUE_ID.test(recordId);
  if (location === "active-current-work" || location === "archived-current-work") {
    return CURRENT_WORK_ID.test(recordId);
  }
  return (
    ACCEPTED_CHANGE_ID.test(recordId) ||
    isLegacyChangeId(recordId) ||
    isCorrectionChangeId(recordId)
  );
}

export function parseCanonicalRecordId(
  location: CanonicalRecordLocation,
  value: unknown,
) {
  if (typeof value !== "string" || !isValidRecordId(location, value)) {
    throw new Error(`Invalid ${location} record ID ${safeValueLabel(value)}.`);
  }
  return value;
}

export function isAcceptedChangeId(value: string) {
  return ACCEPTED_CHANGE_ID.test(value);
}

export function isLegacyChangeId(value: string) {
  if (!LEGACY_CHANGE_ID.test(value)) return false;
  const originalId = value.slice("LEGACY-QH-".length);
  return !/(?:^|-)COR-(?:00[1-9]|0[1-9]\d|[1-9]\d{2})$/.test(originalId);
}

function isCorrectionChangeId(value: string) {
  const match = value.match(CORRECTION_SUFFIX);
  if (!match) return false;
  return isAcceptedChangeId(match[1]) || isLegacyChangeId(match[1]);
}

export function isChangelogRootId(value: string) {
  return isAcceptedChangeId(value) || isLegacyChangeId(value);
}

export function deriveCorrectionChangeId(targetChangeId: string, sequence: number) {
  if (!isChangelogRootId(targetChangeId)) {
    throw new Error("Correction target must be an accepted or legacy root Changelog ID.");
  }
  if (!Number.isInteger(sequence) || sequence < 1 || sequence > 999) {
    throw new Error("Correction sequence must be an integer from 1 through 999.");
  }
  return `${targetChangeId}-COR-${String(sequence).padStart(3, "0")}`;
}

export function canonicalRecordSourcePath(
  location: CanonicalRecordLocation,
  recordId: string,
) {
  const parsedId = parseCanonicalRecordId(location, recordId);
  if (location === CHANGELOG_MIGRATION_RECEIPT_LOCATION) {
    return CHANGELOG_MIGRATION_RECEIPT_SOURCE_PATH;
  }
  return `${APPROVED_RECORD_DIRECTORIES[location]}/${parsedId}.md`;
}

export function parseCanonicalRecordFileName(
  location: CanonicalRecordLocation,
  fileName: unknown,
): CanonicalRecordIdentity {
  if (
    typeof fileName !== "string" ||
    fileName.includes("/") ||
    fileName.includes("\\") ||
    fileName.includes("\0") ||
    !fileName.endsWith(".md")
  ) {
    throw new Error(`Invalid ${location} Markdown filename.`);
  }
  const recordId = parseCanonicalRecordId(location, fileName.slice(0, -3));
  return Object.freeze({
    location,
    recordId,
    fileName,
    sourcePath: canonicalRecordSourcePath(location, recordId),
  });
}

export function parseCanonicalRecordSourcePath(
  sourcePath: unknown,
): CanonicalRecordIdentity {
  const normalized = normalizeStrictRelativePath(sourcePath);
  if (normalized === CHANGELOG_MIGRATION_RECEIPT_SOURCE_PATH) {
    return parseCanonicalRecordFileName(
      CHANGELOG_MIGRATION_RECEIPT_LOCATION,
      `${CHANGELOG_MIGRATION_RECEIPT_RECORD_ID}.md`,
    );
  }
  for (const [location, directory] of Object.entries(
    APPROVED_RECORD_DIRECTORIES,
  ) as [CanonicalRecordLocation, string][]) {
    const prefix = `${directory}/`;
    if (normalized.startsWith(prefix)) {
      const fileName = normalized.slice(prefix.length);
      if (fileName.includes("/")) break;
      return parseCanonicalRecordFileName(location, fileName);
    }
  }
  throw new Error("Path is not a canonical Chronicle operational-record source path.");
}

export async function inspectCanonicalRecordTarget(
  repoRoot: string,
  location: CanonicalRecordLocation,
  recordId: string,
): Promise<CanonicalRecordTarget> {
  const resolvedRoot = await assertCanonicalRecordDirectories(repoRoot);
  const sourcePath = canonicalRecordSourcePath(location, recordId);
  const absolutePath = resolveContainedPath(resolvedRoot, sourcePath);
  let stat;
  try {
    stat = await lstat(absolutePath);
  } catch {
    return Object.freeze({
      location,
      recordId,
      fileName: `${recordId}.md`,
      sourcePath,
      absolutePath,
      state: "absent" as const,
      mode: null,
    });
  }
  if (stat.isSymbolicLink()) {
    throw new Error(`Canonical target is a symbolic link: ${sourcePath}.`);
  }
  if (!stat.isFile()) {
    throw new Error(`Canonical target is not a regular file: ${sourcePath}.`);
  }
  return Object.freeze({
    location,
    recordId,
    fileName: `${recordId}.md`,
    sourcePath,
    absolutePath,
    state: "present" as const,
    mode: stat.mode & 0o7777,
  });
}
