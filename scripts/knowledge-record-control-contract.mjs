import { createHash } from "node:crypto";

export const KNOWLEDGE_CONTROL_STORE_VERSION = 1;
export const KNOWLEDGE_CERTIFICATION_LEASE_ENVIRONMENT_KEY =
  "CHRONICLE_KNOWLEDGE_CERTIFICATION_LEASE_ID";

export const KNOWLEDGE_CONTROL_NAMES = Object.freeze({
  transactionRoot: "chronicle-knowledge-transactions",
  writerLock: "writer-lock",
  writerLockMetadata: "lock.json",
  scopedWriterRoot: "scoped-writers",
  scopedWriterMetadata: "lock.json",
  certificationLeaseRoot: "certification-leases",
  certificationLeaseMetadata: "lease.json",
  manifest: "manifest.json",
  payloadDirectory: "payloads",
  journal: "journal.jsonl",
  unfinishedMarker: "unfinished.json",
  terminalReceiptDirectory: "terminal-receipts",
});

export const KNOWLEDGE_CONTROL_LIMITS = Object.freeze({
  metadataBytes: 64 * 1024,
  manifestBytes: 16 * 1024 * 1024,
  journalBytes: 64 * 1024 * 1024,
  commandCharacters: 80,
});

export const KNOWLEDGE_TRANSACTION_ID_PATTERN =
  /^kr-(\d{8}T\d{9}Z)-([a-f0-9]{16})$/;
export const KNOWLEDGE_ARTIFACT_OWNER_TOKEN_PATTERN =
  /^[a-f0-9]{32}-[1-9]\d*-[a-f0-9]{16}$/;
export const KNOWLEDGE_CERTIFICATION_LEASE_ID_PATTERN = /^[a-f0-9]{32}$/;
export const KNOWLEDGE_PAYLOAD_NAME_PATTERN =
  /^operation-\d{4}\.(before|after)\.bin$/;
export const KNOWLEDGE_TERMINAL_RECEIPT_NAME_PATTERN =
  /^receipt-\d{4}-(applied|recovered)\.json$/;

const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const COMMAND_PATTERN = /^[a-z0-9][a-z0-9:_ -]*$/;
const HOSTNAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,254}$/;

function isRecord(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, child]) => child !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, canonicalize(child)]),
    );
  }
  return value;
}

export function canonicalKnowledgeControlJson(value) {
  return JSON.stringify(canonicalize(value));
}

export function knowledgeControlMetadataWithHash(value) {
  if (!isRecord(value)) {
    throw new Error("Knowledge control metadata is malformed.");
  }
  return Object.freeze({
    ...value,
    metadataSha256: createHash("sha256")
      .update(canonicalKnowledgeControlJson(value))
      .digest("hex"),
  });
}

function assertExactKeys(value, expectedKeys, label) {
  const actual = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  if (
    actual.length !== expected.length ||
    actual.some((key, index) => key !== expected[index])
  ) {
    throw new Error(`${label} contains unsupported fields.`);
  }
}

function assertMetadataHash(value, label) {
  if (
    typeof value.metadataSha256 !== "string" ||
    !SHA256_PATTERN.test(value.metadataSha256)
  ) {
    throw new Error(`${label} has no valid metadata hash.`);
  }
  const { metadataSha256, ...base } = value;
  const actual = createHash("sha256")
    .update(canonicalKnowledgeControlJson(base))
    .digest("hex");
  if (actual !== metadataSha256) {
    throw new Error(`${label} metadata hash does not match its contents.`);
  }
}

function assertIsoTimestamp(value, label) {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) ||
    Number.isNaN(Date.parse(value))
  ) {
    throw new Error(`${label} must be a valid UTC timestamp.`);
  }
}

export function assertKnowledgeControlCommand(command) {
  if (
    typeof command !== "string" ||
    command.length === 0 ||
    command.length > KNOWLEDGE_CONTROL_LIMITS.commandCharacters ||
    !COMMAND_PATTERN.test(command)
  ) {
    throw new Error("Knowledge control command is malformed.");
  }
  return command;
}

export function isKnowledgeTransactionId(value) {
  if (typeof value !== "string") return false;
  const match = value.match(KNOWLEDGE_TRANSACTION_ID_PATTERN);
  if (!match) return false;
  const compact = match[1];
  const iso = `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6, 8)}T${compact.slice(9, 11)}:${compact.slice(11, 13)}:${compact.slice(13, 15)}.${compact.slice(15, 18)}Z`;
  const parsed = new Date(iso);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString() === iso;
}

export function assertKnowledgeTransactionId(value) {
  if (!isKnowledgeTransactionId(value)) {
    throw new Error("Knowledge transaction identifier is malformed.");
  }
  return value;
}

export function assertKnowledgeWriterLockMetadata(value) {
  const label = "Knowledge transaction writer lock";
  if (!isRecord(value)) throw new Error(`${label} metadata is malformed.`);
  assertExactKeys(
    value,
    [
      "storeVersion",
      "lockId",
      "pid",
      "hostname",
      "startedAt",
      "command",
      "transactionId",
      "metadataSha256",
    ],
    label,
  );
  assertMetadataHash(value, label);
  if (
    value.storeVersion !== KNOWLEDGE_CONTROL_STORE_VERSION ||
    typeof value.lockId !== "string" ||
    !KNOWLEDGE_CERTIFICATION_LEASE_ID_PATTERN.test(value.lockId) ||
    !Number.isSafeInteger(value.pid) ||
    value.pid <= 0 ||
    typeof value.hostname !== "string" ||
    !HOSTNAME_PATTERN.test(value.hostname) ||
    typeof value.startedAt !== "string" ||
    typeof value.command !== "string" ||
    (value.transactionId !== null && !isKnowledgeTransactionId(value.transactionId))
  ) {
    throw new Error(`${label} metadata is malformed.`);
  }
  assertIsoTimestamp(value.startedAt, `${label} startedAt`);
  assertKnowledgeControlCommand(value.command);
  return Object.freeze({ ...value });
}

export function assertKnowledgeScopedWriterMetadata(value) {
  const label = "Knowledge scoped writer lock";
  if (!isRecord(value)) throw new Error(`${label} metadata is malformed.`);
  assertExactKeys(
    value,
    [
      "storeVersion",
      "lockId",
      "pid",
      "hostname",
      "startedAt",
      "command",
      "transactionId",
      "scopes",
      "metadataSha256",
    ],
    label,
  );
  assertMetadataHash(value, label);
  if (
    value.storeVersion !== KNOWLEDGE_CONTROL_STORE_VERSION ||
    typeof value.lockId !== "string" ||
    !KNOWLEDGE_CERTIFICATION_LEASE_ID_PATTERN.test(value.lockId) ||
    !Number.isSafeInteger(value.pid) ||
    value.pid <= 0 ||
    typeof value.hostname !== "string" ||
    !HOSTNAME_PATTERN.test(value.hostname) ||
    typeof value.startedAt !== "string" ||
    typeof value.command !== "string" ||
    !isKnowledgeTransactionId(value.transactionId) ||
    !Array.isArray(value.scopes) ||
    value.scopes.length === 0 ||
    value.scopes.length > 8 ||
    value.scopes.some(
      (scope) =>
        typeof scope !== "string" ||
        scope.length === 0 ||
        scope.length > 512 ||
        !(
          /^record:docs\/architecture-knowledge\/issues\/(?:community-gallery\/CG|my-stories\/MS|character-library\/CL|my-images\/MI|story-builder\/SB|character-builder\/CB)-ISSUE-\d{3}\.md$/.test(
            scope,
          ) ||
          /^record:docs\/current-work\/active\/(?:community-gallery\/CG|my-stories\/MS|character-library\/CL|my-images\/MI|story-builder\/SB|character-builder\/CB|knowledge-system\/KS)-WORK-\d{3}\.md$/.test(
            scope,
          )
        ),
    ) ||
    new Set(value.scopes).size !== value.scopes.length ||
    [...value.scopes].sort().some((scope, index) => scope !== value.scopes[index])
  ) {
    throw new Error(`${label} metadata is malformed.`);
  }
  assertIsoTimestamp(value.startedAt, `${label} startedAt`);
  assertKnowledgeControlCommand(value.command);
  return Object.freeze({ ...value, scopes: Object.freeze([...value.scopes]) });
}

export function knowledgeScopedWriterDirectoryName(lockId) {
  if (
    typeof lockId !== "string" ||
    !KNOWLEDGE_CERTIFICATION_LEASE_ID_PATTERN.test(lockId)
  ) {
    throw new Error("Knowledge scoped writer identifier is malformed.");
  }
  return `writer-${lockId}`;
}

export function parseKnowledgeScopedWriterDirectoryName(name) {
  if (typeof name !== "string") return null;
  const match = name.match(/^writer-([a-f0-9]{32})$/);
  return match ? match[1] : null;
}

export function knowledgeScopedWriterTransitionName(mode, lockId, owner) {
  if (!["preparing", "removing", "reclaimed"].includes(mode)) {
    throw new Error("Knowledge scoped writer transition mode is invalid.");
  }
  knowledgeScopedWriterDirectoryName(lockId);
  const token = `${owner.lockId}-${owner.pid}-${knowledgeControlHostFingerprint(owner.hostname)}`;
  return `.${mode}-scoped-writer-${lockId}-${token}`;
}

export function parseKnowledgeScopedWriterTransitionName(name) {
  if (typeof name !== "string") return null;
  const match = name.match(
    /^\.(preparing|removing|reclaimed)-scoped-writer-([a-f0-9]{32})-([a-f0-9]{32}-[1-9]\d*-[a-f0-9]{16})$/,
  );
  if (!match) return null;
  return Object.freeze({
    mode: match[1],
    lockId: match[2],
    owner: parseKnowledgeArtifactOwnerToken(match[3]),
  });
}

export function assertKnowledgeCertificationLeaseMetadata(value) {
  const label = "Knowledge certification lease";
  if (!isRecord(value)) throw new Error(`${label} metadata is malformed.`);
  assertExactKeys(
    value,
    [
      "storeVersion",
      "leaseId",
      "pid",
      "hostname",
      "startedAt",
      "command",
      "protectedChildPid",
      "protectedProcessGroupId",
      "metadataSha256",
    ],
    label,
  );
  assertMetadataHash(value, label);
  if (
    value.storeVersion !== KNOWLEDGE_CONTROL_STORE_VERSION ||
    typeof value.leaseId !== "string" ||
    !KNOWLEDGE_CERTIFICATION_LEASE_ID_PATTERN.test(value.leaseId) ||
    !Number.isSafeInteger(value.pid) ||
    value.pid <= 0 ||
    typeof value.hostname !== "string" ||
    !HOSTNAME_PATTERN.test(value.hostname) ||
    typeof value.startedAt !== "string" ||
    typeof value.command !== "string" ||
    (value.protectedChildPid !== null &&
      (!Number.isSafeInteger(value.protectedChildPid) ||
        value.protectedChildPid <= 0)) ||
    (value.protectedProcessGroupId !== null &&
      (!Number.isSafeInteger(value.protectedProcessGroupId) ||
        value.protectedProcessGroupId <= 0)) ||
    (value.protectedProcessGroupId !== null && value.protectedChildPid === null)
  ) {
    throw new Error(`${label} metadata is malformed.`);
  }
  assertIsoTimestamp(value.startedAt, `${label} startedAt`);
  assertKnowledgeControlCommand(value.command);
  return Object.freeze({ ...value });
}

export function assertKnowledgeUnfinishedMarker(value, transactionId) {
  assertKnowledgeTransactionId(transactionId);
  const label = "Knowledge transaction unfinished marker";
  if (!isRecord(value)) throw new Error(`${label} is malformed.`);
  assertExactKeys(
    value,
    [
      "storeVersion",
      "transactionId",
      "phase",
      "createdAt",
      "metadataSha256",
    ],
    label,
  );
  assertMetadataHash(value, label);
  if (
    value.storeVersion !== KNOWLEDGE_CONTROL_STORE_VERSION ||
    value.transactionId !== transactionId ||
    !["apply", "recover"].includes(String(value.phase)) ||
    typeof value.createdAt !== "string"
  ) {
    throw new Error(`${label} is malformed.`);
  }
  assertIsoTimestamp(value.createdAt, `${label} createdAt`);
  return Object.freeze({ ...value });
}

export function knowledgeControlHostFingerprint(hostname) {
  if (typeof hostname !== "string" || !HOSTNAME_PATTERN.test(hostname)) {
    throw new Error("Knowledge control hostname is malformed.");
  }
  return createHash("sha256").update(hostname).digest("hex").slice(0, 16);
}

export function parseKnowledgeArtifactOwnerToken(token) {
  if (typeof token !== "string") {
    throw new Error("Knowledge control artifact owner is malformed.");
  }
  const match = token.match(
    /^([a-f0-9]{32})-([1-9]\d*)-([a-f0-9]{16})$/,
  );
  if (!match) throw new Error("Knowledge control artifact owner is malformed.");
  const pid = Number(match[2]);
  if (!Number.isSafeInteger(pid) || pid <= 0) {
    throw new Error("Knowledge control artifact owner is malformed.");
  }
  return Object.freeze({ lockId: match[1], pid, hostnameHash: match[3] });
}

export function parseKnowledgeWriterLockStagingName(name) {
  if (typeof name !== "string") return null;
  const match = name.match(
    /^\.preparing-writer-lock-([a-f0-9]{32}-[1-9]\d*-[a-f0-9]{16})$/,
  );
  return match ? parseKnowledgeArtifactOwnerToken(match[1]) : null;
}

export function parseKnowledgeWriterLockRecoveryName(name) {
  if (typeof name !== "string") return null;
  const match = name.match(
    /^\.(reclaimed|removing)-writer-lock-([a-f0-9]{32}-[1-9]\d*-[a-f0-9]{16})$/,
  );
  if (!match) return null;
  return Object.freeze({
    phase: match[1],
    owner: parseKnowledgeArtifactOwnerToken(match[2]),
  });
}

export function parseKnowledgeTransactionStagingName(name) {
  if (typeof name !== "string") return null;
  const match = name.match(
    /^\.preparing-transaction-(kr-\d{8}T\d{9}Z-[a-f0-9]{16})-([a-f0-9]{32}-[1-9]\d*-[a-f0-9]{16})$/,
  );
  if (!match) return null;
  if (!isKnowledgeTransactionId(match[1])) {
    throw new Error("Knowledge transaction preparation is malformed.");
  }
  return Object.freeze({
    transactionId: match[1],
    owner: parseKnowledgeArtifactOwnerToken(match[2]),
  });
}

export function parseKnowledgeCertificationLeaseDirectoryName(name) {
  if (typeof name !== "string") return null;
  const match = name.match(/^lease-([a-f0-9]{32})$/);
  return match ? match[1] : null;
}

export function parseKnowledgeCertificationLeaseTransitionName(name) {
  if (typeof name !== "string") return null;
  const match = name.match(
    /^\.(preparing|releasing)-certification-lease-([a-f0-9]{32})-([a-f0-9]{32}-[1-9]\d*-[a-f0-9]{16})$/,
  );
  if (!match) return null;
  return Object.freeze({
    phase: match[1],
    leaseId: match[2],
    owner: parseKnowledgeArtifactOwnerToken(match[3]),
  });
}

export function parseKnowledgePendingFileName(name) {
  if (typeof name !== "string") return null;
  const match = name.match(
    /^\.pending-(create|replace)-([A-Za-z0-9_-]+)-([a-f0-9]{32}-[1-9]\d*-[a-f0-9]{16})\.tmp$/,
  );
  if (!match) return null;
  let finalName;
  try {
    finalName = Buffer.from(match[2], "base64url").toString("utf8");
  } catch {
    throw new Error("Knowledge control pending file is malformed.");
  }
  if (
    Buffer.from(finalName, "utf8").toString("base64url") !== match[2] ||
    finalName.length === 0 ||
    finalName === "." ||
    finalName === ".." ||
    finalName.includes("/") ||
    finalName.includes("\\") ||
    finalName.includes("\0")
  ) {
    throw new Error("Knowledge control pending file is malformed.");
  }
  return Object.freeze({
    finalName,
    mode: match[1],
    owner: parseKnowledgeArtifactOwnerToken(match[3]),
  });
}
