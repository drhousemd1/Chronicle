export type KnowledgeArtifactOwner = Readonly<{
  lockId: string;
  pid: number;
  hostnameHash: string;
}>;

export type KnowledgeWriterLockMetadata = Readonly<{
  storeVersion: number;
  lockId: string;
  pid: number;
  hostname: string;
  startedAt: string;
  command: string;
  transactionId: string | null;
  metadataSha256: string;
}>;

export type KnowledgeCertificationLeaseMetadata = Readonly<{
  storeVersion: number;
  leaseId: string;
  pid: number;
  hostname: string;
  startedAt: string;
  command: string;
  protectedChildPid: number | null;
  protectedProcessGroupId: number | null;
  metadataSha256: string;
}>;

export type KnowledgeUnfinishedMarker = Readonly<{
  storeVersion: number;
  transactionId: string;
  phase: "apply" | "recover";
  createdAt: string;
  metadataSha256: string;
}>;

export const KNOWLEDGE_CONTROL_STORE_VERSION: 1;
export const KNOWLEDGE_CERTIFICATION_LEASE_ENVIRONMENT_KEY:
  "CHRONICLE_KNOWLEDGE_CERTIFICATION_LEASE_ID";
export const KNOWLEDGE_CONTROL_NAMES: Readonly<{
  transactionRoot: "chronicle-knowledge-transactions";
  writerLock: "writer-lock";
  writerLockMetadata: "lock.json";
  certificationLeaseRoot: "certification-leases";
  certificationLeaseMetadata: "lease.json";
  manifest: "manifest.json";
  payloadDirectory: "payloads";
  journal: "journal.jsonl";
  unfinishedMarker: "unfinished.json";
  terminalReceiptDirectory: "terminal-receipts";
}>;
export const KNOWLEDGE_CONTROL_LIMITS: Readonly<{
  metadataBytes: number;
  manifestBytes: number;
  journalBytes: number;
  commandCharacters: number;
}>;
export const KNOWLEDGE_TRANSACTION_ID_PATTERN: RegExp;
export const KNOWLEDGE_ARTIFACT_OWNER_TOKEN_PATTERN: RegExp;
export const KNOWLEDGE_CERTIFICATION_LEASE_ID_PATTERN: RegExp;
export const KNOWLEDGE_PAYLOAD_NAME_PATTERN: RegExp;
export const KNOWLEDGE_TERMINAL_RECEIPT_NAME_PATTERN: RegExp;

export function canonicalKnowledgeControlJson(value: unknown): string;
export function knowledgeControlMetadataWithHash<T extends Record<string, unknown>>(
  value: T,
): Readonly<T & { metadataSha256: string }>;
export function assertKnowledgeControlCommand(command: unknown): string;
export function isKnowledgeTransactionId(value: unknown): value is string;
export function assertKnowledgeTransactionId(value: unknown): string;
export function assertKnowledgeWriterLockMetadata(
  value: unknown,
): KnowledgeWriterLockMetadata;
export function assertKnowledgeCertificationLeaseMetadata(
  value: unknown,
): KnowledgeCertificationLeaseMetadata;
export function assertKnowledgeUnfinishedMarker(
  value: unknown,
  transactionId: string,
): KnowledgeUnfinishedMarker;
export function knowledgeControlHostFingerprint(hostname: unknown): string;
export function parseKnowledgeArtifactOwnerToken(token: unknown): KnowledgeArtifactOwner;
export function parseKnowledgeWriterLockStagingName(
  name: unknown,
): KnowledgeArtifactOwner | null;
export function parseKnowledgeWriterLockRecoveryName(name: unknown): Readonly<{
  phase: "reclaimed" | "removing";
  owner: KnowledgeArtifactOwner;
}> | null;
export function parseKnowledgeTransactionStagingName(name: unknown): Readonly<{
  transactionId: string;
  owner: KnowledgeArtifactOwner;
}> | null;
export function parseKnowledgeCertificationLeaseDirectoryName(
  name: unknown,
): string | null;
export function parseKnowledgeCertificationLeaseTransitionName(
  name: unknown,
): Readonly<{
  phase: "preparing" | "releasing";
  leaseId: string;
  owner: KnowledgeArtifactOwner;
}> | null;
export function parseKnowledgePendingFileName(name: unknown): Readonly<{
  finalName: string;
  mode: "create" | "replace";
  owner: KnowledgeArtifactOwner;
}> | null;
