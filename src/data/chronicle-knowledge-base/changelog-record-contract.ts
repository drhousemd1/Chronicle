import { lexer, type Token, type Tokens } from "marked";
import { parse as parseYaml } from "yaml";
import { z } from "zod";

import { canonicalJsonStringify } from "@/lib/quality-hub-changelog-migration";

import {
  assertAcceptedUpdateOwner,
  isAcceptedUpdateId,
} from "./accepted-update-capability-registry";

import {
  APPROVED_CAPABILITY_IDS,
  isChronicleCapabilityId,
  type ChronicleCapabilityId,
} from "./capability-ids";
import {
  buildArchivedCurrentWorkHref,
  CHRONICLE_KNOWLEDGE_ROUTE_REGISTRY,
} from "./knowledge-routes";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const SOURCE_REVISION = /^(?:git:[a-f0-9]{40}|sha256:[a-f0-9]{64})$/;
const ACCEPTED_CHANGE_ID = /^[A-Z][A-Z0-9]{1,9}-CHANGE-\d{3}$/;
const LEGACY_CHANGE_ID = /^LEGACY-QH-([A-Za-z0-9][A-Za-z0-9._-]*)$/;
const CORRECTION_CHANGE_ID = /^(.+)-COR-(\d{3})$/;
const PROJECT_ID = /^[A-Z][A-Z0-9]{1,9}-WORK-\d{3}$/;
const PROOF_ID = /^[A-Z][A-Z0-9]{1,9}-EV-\d{3}$/;
const CHANGELOG_DIRECTORY = "docs/architecture-knowledge/changelog/entries";
const SHA256_ROUND_CONSTANTS = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
  0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
  0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
  0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
  0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
  0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
] as const;

function rotateRight(value: number, amount: number) {
  return (value >>> amount) | (value << (32 - amount));
}

export function sha256HexSync(value: string) {
  const bytes = new TextEncoder().encode(value);
  const paddedLength = Math.ceil((bytes.length + 9) / 64) * 64;
  const message = new Uint8Array(paddedLength);
  message.set(bytes);
  message[bytes.length] = 0x80;
  let bitLength = BigInt(bytes.length) * 8n;
  for (let index = 0; index < 8; index += 1) {
    message[paddedLength - 1 - index] = Number(bitLength & 0xffn);
    bitLength >>= 8n;
  }

  const hash = new Uint32Array([
    0x6a09e667,
    0xbb67ae85,
    0x3c6ef372,
    0xa54ff53a,
    0x510e527f,
    0x9b05688c,
    0x1f83d9ab,
    0x5be0cd19,
  ]);
  const words = new Uint32Array(64);
  const view = new DataView(message.buffer);

  for (let offset = 0; offset < message.length; offset += 64) {
    for (let index = 0; index < 16; index += 1) {
      words[index] = view.getUint32(offset + index * 4, false);
    }
    for (let index = 16; index < 64; index += 1) {
      const prior15 = words[index - 15];
      const prior2 = words[index - 2];
      const sigma0 =
        rotateRight(prior15, 7) ^
        rotateRight(prior15, 18) ^
        (prior15 >>> 3);
      const sigma1 =
        rotateRight(prior2, 17) ^
        rotateRight(prior2, 19) ^
        (prior2 >>> 10);
      words[index] =
        (words[index - 16] + sigma0 + words[index - 7] + sigma1) >>> 0;
    }

    let [a, b, c, d, e, f, g, h] = hash;
    for (let index = 0; index < 64; index += 1) {
      const upperSigma1 =
        rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
      const choice = (e & f) ^ (~e & g);
      const first =
        (h + upperSigma1 + choice + SHA256_ROUND_CONSTANTS[index] + words[index]) >>>
        0;
      const upperSigma0 =
        rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
      const majority = (a & b) ^ (a & c) ^ (b & c);
      const second = (upperSigma0 + majority) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + first) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (first + second) >>> 0;
    }

    hash[0] = (hash[0] + a) >>> 0;
    hash[1] = (hash[1] + b) >>> 0;
    hash[2] = (hash[2] + c) >>> 0;
    hash[3] = (hash[3] + d) >>> 0;
    hash[4] = (hash[4] + e) >>> 0;
    hash[5] = (hash[5] + f) >>> 0;
    hash[6] = (hash[6] + g) >>> 0;
    hash[7] = (hash[7] + h) >>> 0;
  }

  return Array.from(hash, (word) => word.toString(16).padStart(8, "0")).join("");
}

export function computeLegacyPayloadHash(payload: LegacyQualityHubPayload) {
  return sha256HexSync(canonicalJsonStringify(payload));
}

export const CHANGELOG_VARIANTS = [
  "accepted_closeout",
  "accepted_update",
  "legacy_import",
  "correction",
] as const;

export const CHANGELOG_PROVENANCE = [
  "accepted-closeout",
  "accepted-update",
  "historical-quality-hub",
  "correction",
] as const;

export const ACCEPTED_UPDATE_WORKFLOW_CONTEXT =
  "no_issue_current_work_archive_or_proof_matrix" as const;
export const ACCEPTED_UPDATE_CONTEXT_NARRATIVE =
  "This bounded update did not require or create a Chronicle Issue, Current Work project, proof matrix, archived work record, or closeout transaction." as const;

export const LEGACY_SOURCE_LINEAGE = [
  "owner-db",
  "local-storage",
  "repository-seed",
] as const;

export const LEGACY_PROVENANCE_LIMIT =
  "post_incident_union_original_170_membership_unknown" as const;

type ChangelogVariant = (typeof CHANGELOG_VARIANTS)[number];
export type ChangelogProvenance = (typeof CHANGELOG_PROVENANCE)[number];
type LegacySourceLineage = (typeof LEGACY_SOURCE_LINEAGE)[number];

export type ChangelogSourceMap = Readonly<Record<string, string>>;

type ParsedFrontmatter = Readonly<{
  data: unknown;
  body: string;
}>;

type ChangelogRecordBase = Readonly<{
  kind: "changelog";
  variant: ChangelogVariant;
  id: string;
  title: string;
  changeDate: string;
  outcome: string;
  provenance: ChangelogProvenance;
  affectedCapabilities: readonly ChronicleCapabilityId[];
  sourcePath: string;
  body: string;
  rawSource: string;
}>;

export type AcceptedCloseoutChangelogRecord = ChangelogRecordBase &
  Readonly<{
    variant: "accepted_closeout";
    provenance: "accepted-closeout";
    problem: string;
    whyChangeWasNeeded: string;
    changes: string;
    acceptedEvidenceSummary: string;
    acceptedEvidenceLimits: string;
    owningCapability: ChronicleCapabilityId;
    acceptedOn: string;
    acceptedBy: string;
    acceptanceRef: string;
    sourceRevision: string;
    archivedProjectId: string;
    archiveRecord: string;
    archiveRoute: string;
    resolvedIssueIds: readonly string[];
    remainingIssueIds: readonly string[];
  }>;

export type AcceptedUpdateChangelogRecord = ChangelogRecordBase &
  Readonly<{
    variant: "accepted_update";
    provenance: "accepted-update";
    whyChangeWasNeeded: string;
    changes: string;
    acceptedEvidenceSummary: string;
    acceptedEvidenceLimits: string;
    owningCapability: ChronicleCapabilityId;
    acceptedOn: string;
    acceptedBy: string;
    reviewMethod: string;
    sourceRevision: string;
    workflowRecordContext: typeof ACCEPTED_UPDATE_WORKFLOW_CONTEXT;
  }>;

export type LegacyQualityHubComment = Readonly<{
  id: string;
  author: string;
  timestamp: string;
  text: string;
}>;

export type LegacyQualityHubPayload = Readonly<{
  id: string;
  title: string;
  summary: string;
  severity: "patch" | "fix" | "refactor" | "feature" | "breaking";
  status: "planned" | "in-progress" | "completed";
  problem: string;
  plan: string;
  changes: string;
  filesAffected: readonly string[];
  agent: string;
  relatedFindingIds: readonly string[];
  relatedRunIds?: readonly string[];
  tags: readonly string[];
  comments: readonly LegacyQualityHubComment[];
  createdAt: string;
  updatedAt: string;
}>;

export type LegacyPrivacyRedaction = Readonly<{
  field: string;
  transformation: "home-directory-prefix-to-$HOME";
}>;

export type LegacyImportChangelogRecord = ChangelogRecordBase &
  Readonly<{
    variant: "legacy_import";
    provenance: "historical-quality-hub";
    legacySourceId: string;
    originalRecord: LegacyQualityHubPayload;
    sourceHash: string;
    preservedRecordHash?: string;
    privacyRedactions: readonly LegacyPrivacyRedaction[];
    migrationSnapshotHash: string;
    importedOn: string;
    sourceLineage: readonly LegacySourceLineage[];
    migrationReceipt: string;
    applicabilityEvidence: string;
    applicabilityStatus:
      | "capability-reviewed"
      | "gallery-reviewed-other-capabilities-unclassified"
      | "gallery-review-pending";
    galleryApplicability: "applicable" | "not_applicable" | "pending_excluded";
    provenanceLimit: typeof LEGACY_PROVENANCE_LIMIT;
    modernAcceptance: "not_assessed";
    proofStatus: "not_reverified";
  }>;

export type ChangelogClarifiedFields = Readonly<{
  title?: string;
  changeDate?: string;
  problem?: string;
  whyChangeWasNeeded?: string;
  changes?: string;
  outcome?: string;
  acceptedEvidenceSummary?: string;
  acceptedEvidenceLimits?: string;
  affectedCapabilities?: readonly ChronicleCapabilityId[];
  acceptedOn?: string;
  acceptedBy?: string;
  reviewMethod?: string;
  acceptanceRef?: string;
  sourceRevision?: string;
  archivedProjectId?: string;
  archiveRecord?: string;
  archiveRoute?: string;
  resolvedIssueIds?: readonly string[];
  remainingIssueIds?: readonly string[];
  originalRecord?: LegacyQualityHubPayload;
  sourceHash?: string;
  preservedRecordHash?: string;
  privacyRedactions?: readonly LegacyPrivacyRedaction[];
  migrationSnapshotHash?: string;
  importedOn?: string;
  sourceLineage?: readonly LegacySourceLineage[];
  migrationReceipt?: string;
  applicabilityEvidence?: string;
  applicabilityStatus?: LegacyImportChangelogRecord["applicabilityStatus"];
  galleryApplicability?: LegacyImportChangelogRecord["galleryApplicability"];
}>;

export type CorrectionChangelogRecord = ChangelogRecordBase &
  Readonly<{
    variant: "correction";
    provenance: "correction";
    targetChangeId: string;
    correctionSequence: number;
    correctedOn: string;
    correctionAuthority: string;
    correctionReason: string;
    sourceRevision: string;
    clarifiedFields: ChangelogClarifiedFields;
  }>;

export type ChangelogRecord =
  | AcceptedCloseoutChangelogRecord
  | AcceptedUpdateChangelogRecord
  | LegacyImportChangelogRecord
  | CorrectionChangelogRecord;

export type ChangelogRootRecord =
  | AcceptedCloseoutChangelogRecord
  | AcceptedUpdateChangelogRecord
  | LegacyImportChangelogRecord;

export type EffectiveChangelogEntry = Readonly<{
  id: string;
  variant: ChangelogRootRecord["variant"];
  title: string;
  changeDate: string;
  outcome: string;
  provenance: ChangelogProvenance;
  affectedCapabilities: readonly ChronicleCapabilityId[];
  sourcePath: string;
  body: string;
  rootRecord: ChangelogRootRecord;
  effectiveRecord: ChangelogRootRecord;
  appliedCorrections: readonly CorrectionChangelogRecord[];
}>;

export type ChangelogRecordRegistry = Readonly<{
  records: readonly ChangelogRecord[];
  roots: readonly ChangelogRootRecord[];
  corrections: readonly CorrectionChangelogRecord[];
  effectiveEntries: readonly EffectiveChangelogEntry[];
}>;

export type ChangelogRecordValidationResult = Readonly<{
  ok: boolean;
  errors: readonly string[];
  registry: ChangelogRecordRegistry;
}>;

export type ChangelogRecordValidationOptions = Readonly<{
  asOf: string;
  baselineSources?: ChangelogSourceMap;
}>;

export class ChangelogRecordValidationError extends Error {
  readonly errors: readonly string[];

  constructor(errors: readonly string[]) {
    super(`Changelog record validation failed:\n${errors.join("\n")}`);
    this.name = "ChangelogRecordValidationError";
    this.errors = errors;
  }
}

function isRealIsoDate(value: string) {
  if (!ISO_DATE.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

const dateSchema = z
  .string()
  .regex(ISO_DATE, "must use YYYY-MM-DD")
  .refine(isRealIsoDate, "must be a real calendar date");

const meaningfulAuthoritySchema = z
  .string()
  .trim()
  .min(1)
  .refine(
    (value) =>
      !/\b(?:none|n\/a|unknown|pending|awaiting|unassigned|tbd|to be determined|not\s+(?:yet\s+)?assessed|not applicable)\b/i.test(value),
    "must identify a real approval authority",
  );

function isAcceptedContent(value: string) {
  const normalized = value
    .trim()
    .toLocaleLowerCase()
    .replace(/^[\s[\](){}<>*_`"'.,;:-]+|[\s[\](){}<>*_`"'.,;:-]+$/g, "")
    .trim();
  if (/^(?:tbd|todo)(?:\b|$)/i.test(normalized)) return false;
  return !/^(?:(?:tbd|pending|unknown|n\/a|todo|placeholder(?:\s+(?:text|copy|value|content|here))?|to be determined)(?:\s*(?:[-:–—]|\.{3})\s*.*)?|(?:fill|replace)\s+(?:this|me)\s+in(?:\s*(?:[-:–—]|\.{3})\s*.*)?)$/i.test(
    normalized,
  );
}

const acceptedContentSchema = z
  .string()
  .trim()
  .min(1)
  .refine(isAcceptedContent, "must contain accepted content, not placeholder-only text");

const capabilitySchema = z.enum(APPROVED_CAPABILITY_IDS);

const capabilityListSchema = z
  .array(capabilitySchema)
  .superRefine((values, context) => {
    const seen = new Set<string>();
    values.forEach((value, index) => {
      if (seen.has(value)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `contains duplicate capability ${value}`,
          path: [index],
        });
      }
      seen.add(value);
    });
  });

const nonEmptyCapabilityListSchema = capabilityListSchema.refine(
  (values) => values.length > 0,
  "must contain at least one capability",
);

const commonSchema = z.object({
  record_type: z.literal("changelog"),
  variant: z.enum(CHANGELOG_VARIANTS),
  change_id: z.string().trim().min(1),
  title: z.string().trim().min(1),
  change_date: dateSchema,
  outcome: z.string().trim().min(1),
  provenance: z.enum(CHANGELOG_PROVENANCE),
  affected_capabilities: capabilityListSchema,
  source_record: z.string().trim().min(1),
});

const acceptedCloseoutSchema = commonSchema
  .extend({
    variant: z.literal("accepted_closeout"),
    provenance: z.literal("accepted-closeout"),
    title: acceptedContentSchema,
    problem: acceptedContentSchema,
    why_change_was_needed: acceptedContentSchema,
    changes: acceptedContentSchema,
    outcome: acceptedContentSchema,
    accepted_evidence_summary: acceptedContentSchema,
    accepted_evidence_limits: acceptedContentSchema,
    affected_capabilities: nonEmptyCapabilityListSchema,
    owning_capability: capabilitySchema,
    accepted_on: dateSchema,
    accepted_by: meaningfulAuthoritySchema,
    acceptance_ref: z.string().regex(PROOF_ID),
    source_revision: z.string().regex(SOURCE_REVISION),
    archived_project_id: z.string().regex(PROJECT_ID),
    archive_record: z.string().trim().min(1),
    archive_route: z
      .string()
      .startsWith(`${CHRONICLE_KNOWLEDGE_ROUTE_REGISTRY.knowledgeBase}/archive/`),
    resolved_issue_ids: z.array(z.string().trim().min(1)),
    remaining_issue_ids: z.array(z.string().trim().min(1)),
  })
  .strict();

const acceptedUpdateSchema = commonSchema
  .extend({
    variant: z.literal("accepted_update"),
    provenance: z.literal("accepted-update"),
    title: acceptedContentSchema,
    why_change_was_needed: acceptedContentSchema,
    changes: acceptedContentSchema,
    outcome: acceptedContentSchema,
    accepted_evidence_summary: acceptedContentSchema,
    accepted_evidence_limits: acceptedContentSchema,
    affected_capabilities: nonEmptyCapabilityListSchema,
    owning_capability: capabilitySchema,
    accepted_on: dateSchema,
    accepted_by: meaningfulAuthoritySchema,
    review_method: acceptedContentSchema,
    source_revision: z.string().regex(SOURCE_REVISION),
    workflow_record_context: z.literal(ACCEPTED_UPDATE_WORKFLOW_CONTEXT),
  })
  .strict();

const legacyCommentSchema = z
  .object({
    id: z.string().trim().min(1),
    author: z.string(),
    timestamp: z.string().trim().min(1),
    text: z.string(),
  })
  .strict();

const legacyPayloadSchema = z
  .object({
    id: z.string().trim().min(1),
    title: z.string(),
    summary: z.string(),
    severity: z.enum(["patch", "fix", "refactor", "feature", "breaking"]),
    status: z.enum(["planned", "in-progress", "completed"]),
    problem: z.string(),
    plan: z.string(),
    changes: z.string(),
    filesAffected: z.array(z.string()),
    agent: z.string(),
    relatedFindingIds: z.array(z.string()),
    relatedRunIds: z.array(z.string()).optional(),
    tags: z.array(z.string()),
    comments: z.array(legacyCommentSchema),
    createdAt: z.string().trim().min(1),
    updatedAt: z.string().trim().min(1),
  })
  .strict();

const legacyPrivacyRedactionSchema = z
  .object({
    field: z.string().regex(
      /^(?:title|summary|problem|plan|changes|agent|createdAt|updatedAt|filesAffected\[\d+\]|relatedFindingIds\[\d+\]|relatedRunIds\[\d+\]|tags\[\d+\]|comments\[\d+\]\.(?:id|author|timestamp|text))$/,
    ),
    transformation: z.literal("home-directory-prefix-to-$HOME"),
  })
  .strict();

const legacyImportSchema = commonSchema
  .extend({
    variant: z.literal("legacy_import"),
    provenance: z.literal("historical-quality-hub"),
    legacy_source_id: z.string().trim().min(1),
    original_record: legacyPayloadSchema,
    source_hash: z.string().regex(SHA256),
    preserved_record_hash: z.string().regex(SHA256).optional(),
    privacy_redactions: z.array(legacyPrivacyRedactionSchema).default([]),
    migration_snapshot_hash: z.string().regex(SHA256),
    imported_on: dateSchema,
    source_lineage: z.array(z.enum(LEGACY_SOURCE_LINEAGE)).min(1),
    migration_receipt: z.string().trim().min(1),
    applicability_evidence: z.string().trim().min(1),
    applicability_status: z.enum([
      "capability-reviewed",
      "gallery-reviewed-other-capabilities-unclassified",
      "gallery-review-pending",
    ]),
    gallery_applicability: z.enum([
      "applicable",
      "not_applicable",
      "pending_excluded",
    ]),
    provenance_limit: z.literal(LEGACY_PROVENANCE_LIMIT),
    modern_acceptance: z.literal("not_assessed"),
    proof_status: z.literal("not_reverified"),
  })
  .strict();

const clarifiedFieldsSchema = z
  .object({
    title: acceptedContentSchema.optional(),
    change_date: dateSchema.optional(),
    problem: acceptedContentSchema.optional(),
    why_change_was_needed: acceptedContentSchema.optional(),
    changes: acceptedContentSchema.optional(),
    outcome: acceptedContentSchema.optional(),
    accepted_evidence_summary: acceptedContentSchema.optional(),
    accepted_evidence_limits: acceptedContentSchema.optional(),
    affected_capabilities: capabilityListSchema.optional(),
    accepted_on: dateSchema.optional(),
    accepted_by: meaningfulAuthoritySchema.optional(),
    review_method: acceptedContentSchema.optional(),
    acceptance_ref: z.string().regex(PROOF_ID).optional(),
    source_revision: z.string().regex(SOURCE_REVISION).optional(),
    archived_project_id: z.string().regex(PROJECT_ID).optional(),
    archive_record: z.string().trim().min(1).optional(),
    archive_route: z
      .string()
      .startsWith(`${CHRONICLE_KNOWLEDGE_ROUTE_REGISTRY.knowledgeBase}/archive/`)
      .optional(),
    resolved_issue_ids: z.array(z.string().trim().min(1)).optional(),
    remaining_issue_ids: z.array(z.string().trim().min(1)).optional(),
    original_record: legacyPayloadSchema.optional(),
    source_hash: z.string().regex(SHA256).optional(),
    preserved_record_hash: z.string().regex(SHA256).optional(),
    privacy_redactions: z.array(legacyPrivacyRedactionSchema).optional(),
    migration_snapshot_hash: z.string().regex(SHA256).optional(),
    imported_on: dateSchema.optional(),
    source_lineage: z.array(z.enum(LEGACY_SOURCE_LINEAGE)).min(1).optional(),
    migration_receipt: z.string().trim().min(1).optional(),
    applicability_evidence: z.string().trim().min(1).optional(),
    applicability_status: z
      .enum([
        "capability-reviewed",
        "gallery-reviewed-other-capabilities-unclassified",
        "gallery-review-pending",
      ])
      .optional(),
    gallery_applicability: z
      .enum(["applicable", "not_applicable", "pending_excluded"])
      .optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "must identify at least one clarified field",
  });

const correctionSchema = commonSchema
  .extend({
    variant: z.literal("correction"),
    provenance: z.literal("correction"),
    title: acceptedContentSchema,
    outcome: acceptedContentSchema,
    target_change_id: z.string().trim().min(1),
    correction_sequence: z.number().int().positive(),
    corrected_on: dateSchema,
    correction_authority: meaningfulAuthoritySchema,
    correction_reason: acceptedContentSchema,
    source_revision: z.string().regex(SOURCE_REVISION),
    clarified_fields: clarifiedFieldsSchema,
  })
  .strict();

const changelogSchema = z.discriminatedUnion("variant", [
  acceptedCloseoutSchema,
  acceptedUpdateSchema,
  legacyImportSchema,
  correctionSchema,
]);

function formatZodErrors(error: z.ZodError) {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
    return `${path}${issue.message}`;
  });
}

function parseFrontmatter(source: string): ParsedFrontmatter {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
  if (!match) throw new Error("missing valid YAML frontmatter");
  return {
    data: parseYaml(match[1]),
    body: match[2].trim(),
  };
}

function normalizeSourcePath(sourcePath: string) {
  return sourcePath.replace(/\\/g, "/").replace(/^\.\//, "");
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value as Record<string, unknown>).forEach((child) =>
      deepFreeze(child),
    );
  }
  return value;
}

type MarkdownSection = Readonly<{
  heading: string;
  content: string;
}>;

function isHeadingToken(token: Token): token is Tokens.Heading {
  return token.type === "heading";
}

function getRenderedMarkdownTokens(source: string) {
  return lexer(source.replace(/\r\n?/g, "\n"), { gfm: true });
}

function getMarkdownSections(source: string, level: 2 | 3) {
  const tokens = getRenderedMarkdownTokens(source);
  const sections: MarkdownSection[] = [];
  tokens.forEach((token, index) => {
    if (!isHeadingToken(token) || token.depth !== level) return;
    const content: string[] = [];
    for (let cursor = index + 1; cursor < tokens.length; cursor += 1) {
      const next = tokens[cursor];
      if (isHeadingToken(next) && next.depth <= level) break;
      content.push(next.raw);
    }
    sections.push({
      heading: token.text.trim(),
      content: content.join("").trim(),
    });
  });
  return sections;
}

function normalizeAgreementText(value: string) {
  return value.replace(/\r\n?/g, "\n").trim();
}

function validateLegacyProjectionAgreement(
  title: string,
  outcome: string,
  changeDate: string,
  originalRecord: LegacyQualityHubPayload,
  sourcePath: string,
  errors: string[],
  prefix = "",
) {
  if (
    normalizeAgreementText(title) !==
    normalizeAgreementText(originalRecord.title)
  ) {
    errors.push(
      `${sourcePath}: ${prefix}legacy title must match original_record.title`,
    );
  }
  if (
    normalizeAgreementText(outcome) !==
    normalizeAgreementText(originalRecord.summary)
  ) {
    errors.push(
      `${sourcePath}: ${prefix}legacy summary projection must match original_record.summary`,
    );
  }
  if (changeDate !== originalRecord.updatedAt.slice(0, 10)) {
    errors.push(
      `${sourcePath}: ${prefix}legacy change date must match the date in original_record.updatedAt`,
    );
  }
}

function assertMarkdownSectionAgreement(
  sections: readonly MarkdownSection[],
  heading: string,
  expected: string,
  sourcePath: string,
  errors: string[],
  level: 2 | 3,
  fieldPath: string,
) {
  const matches = sections.filter((section) => section.heading === heading);
  const headingLabel = `${"#".repeat(level)} ${heading}`;
  if (matches.length !== 1) {
    errors.push(
      `${sourcePath}: expected exactly one "${headingLabel}" section for ${fieldPath}, found ${matches.length}`,
    );
    return;
  }
  if (
    normalizeAgreementText(matches[0].content) !==
    normalizeAgreementText(expected)
  ) {
    errors.push(
      `${sourcePath}: "${headingLabel}" must exactly match ${fieldPath}`,
    );
  }
}

function assertAcceptedNarrativeAgreement(
  body: string,
  metadata: {
    problem: string;
    why_change_was_needed: string;
    changes: string;
    outcome: string;
    accepted_evidence_summary: string;
    accepted_evidence_limits: string;
  },
  sourcePath: string,
  errors: string[],
) {
  const sections = getMarkdownSections(body, 2);
  const fields = [
    ["Problem", metadata.problem, "frontmatter problem"],
    [
      "Why the Change Was Needed",
      metadata.why_change_was_needed,
      "frontmatter why_change_was_needed",
    ],
    ["Changes", metadata.changes, "frontmatter changes"],
    ["Outcome", metadata.outcome, "frontmatter outcome"],
    [
      "Accepted Evidence Summary",
      metadata.accepted_evidence_summary,
      "frontmatter accepted_evidence_summary",
    ],
    [
      "Accepted Evidence Limits",
      metadata.accepted_evidence_limits,
      "frontmatter accepted_evidence_limits",
    ],
  ] as const;
  for (const [heading, expected, fieldPath] of fields) {
    assertMarkdownSectionAgreement(
      sections,
      heading,
      expected,
      sourcePath,
      errors,
      2,
      fieldPath,
    );
  }
}

function assertAcceptedUpdateNarrativeAgreement(
  body: string,
  metadata: {
    affected_capabilities: readonly string[];
    accepted_by: string;
    accepted_on: string;
    why_change_was_needed: string;
    changes: string;
    outcome: string;
    accepted_evidence_summary: string;
    accepted_evidence_limits: string;
    review_method: string;
    source_revision: string;
  },
  sourcePath: string,
  errors: string[],
) {
  const sections = getMarkdownSections(body, 2);
  const fields = [
    ["Why the Change Was Needed", metadata.why_change_was_needed, "frontmatter why_change_was_needed"],
    ["Changes", metadata.changes, "frontmatter changes"],
    ["Outcome", metadata.outcome, "frontmatter outcome"],
    ["Accepted Evidence Summary", metadata.accepted_evidence_summary, "frontmatter accepted_evidence_summary"],
    ["Accepted Evidence Limits", metadata.accepted_evidence_limits, "frontmatter accepted_evidence_limits"],
    ["Review Method", metadata.review_method, "frontmatter review_method"],
    [
      "Acceptance and Source State",
      `${metadata.accepted_by} accepted source revision ${metadata.source_revision} on ${metadata.accepted_on}.`,
      "frontmatter accepted_by, source_revision, and accepted_on",
    ],
    [
      "Provenance",
      "This is a bounded Accepted Update, not an accepted closeout.",
      "the Accepted Update provenance contract",
    ],
    [
      "Applicability",
      `Affected capabilities: ${metadata.affected_capabilities.join(", ")}.`,
      "frontmatter affected_capabilities",
    ],
  ] as const;
  for (const [heading, expected, fieldPath] of fields) {
    assertMarkdownSectionAgreement(
      sections,
      heading,
      expected,
      sourcePath,
      errors,
      2,
      fieldPath,
    );
  }
}

function assertCorrectionNarrativeAgreement(
  body: string,
  clarifiedFields: {
    title?: string;
    change_date?: string;
    problem?: string;
    why_change_was_needed?: string;
    changes?: string;
    outcome?: string;
    accepted_evidence_summary?: string;
    accepted_evidence_limits?: string;
    review_method?: string;
    original_record?: LegacyQualityHubPayload;
  },
  correctionAuthority: string,
  correctionReason: string,
  sourcePath: string,
  errors: string[],
) {
  const fields = [
    ["Title", clarifiedFields.title, "clarified_fields.title"],
    ["History Date", clarifiedFields.change_date, "clarified_fields.change_date"],
    ["Problem", clarifiedFields.problem, "clarified_fields.problem"],
    [
      "Why the Change Was Needed",
      clarifiedFields.why_change_was_needed,
      "clarified_fields.why_change_was_needed",
    ],
    ["Changes", clarifiedFields.changes, "clarified_fields.changes"],
    ["Outcome", clarifiedFields.outcome, "clarified_fields.outcome"],
    [
      "Accepted Evidence Summary",
      clarifiedFields.accepted_evidence_summary,
      "clarified_fields.accepted_evidence_summary",
    ],
    [
      "Accepted Evidence Limits",
      clarifiedFields.accepted_evidence_limits,
      "clarified_fields.accepted_evidence_limits",
    ],
    ["Review Method", clarifiedFields.review_method, "clarified_fields.review_method"],
  ] as const;
  const effectiveSections = getMarkdownSections(body, 2).filter(
    (section) => section.heading === "Effective Clarification",
  );
  if (effectiveSections.length !== 1) {
    errors.push(
      `${sourcePath}: expected exactly one "## Effective Clarification" section, found ${effectiveSections.length}`,
    );
    return;
  }
  const sections = getMarkdownSections(effectiveSections[0].content, 3);
  const optionalDerivedLegacyValues = clarifiedFields.original_record
    ? new Map<string, readonly [string, string]>([
        [
          "Title",
          [
            clarifiedFields.original_record.title,
            "clarified_fields.original_record.title",
          ],
        ],
        [
          "History Date",
          [
            clarifiedFields.original_record.updatedAt.slice(0, 10),
            "the date in clarified_fields.original_record.updatedAt",
          ],
        ],
        [
          "Outcome",
          [
            clarifiedFields.original_record.summary,
            "clarified_fields.original_record.summary",
          ],
        ],
      ])
    : null;

  for (const [heading, expected, fieldPath] of fields) {
    const matches = sections.filter((section) => section.heading === heading);
    if (expected === undefined) {
      const derived = optionalDerivedLegacyValues?.get(heading);
      if (derived && matches.length > 0) {
        assertMarkdownSectionAgreement(
          sections,
          heading,
          derived[0],
          sourcePath,
          errors,
          3,
          derived[1],
        );
        continue;
      }
      if (matches.length > 0) {
        errors.push(
          `${sourcePath}: "### ${heading}" requires matching ${fieldPath}`,
        );
      }
      continue;
    }
    assertMarkdownSectionAgreement(
      sections,
      heading,
      expected,
      sourcePath,
      errors,
      3,
      fieldPath,
    );
  }

  const authorityAndReasonSections = getMarkdownSections(body, 2).filter(
    (section) => section.heading === "Authority and Reason",
  );
  if (authorityAndReasonSections.length !== 1) {
    errors.push(
      `${sourcePath}: expected exactly one "## Authority and Reason" section, found ${authorityAndReasonSections.length}`,
    );
    return;
  }
  const authoritySections = getMarkdownSections(
    authorityAndReasonSections[0].content,
    3,
  );
  assertMarkdownSectionAgreement(
    authoritySections,
    "Correction Authority",
    correctionAuthority,
    sourcePath,
    errors,
    3,
    "frontmatter correction_authority",
  );
  assertMarkdownSectionAgreement(
    authoritySections,
    "Correction Reason",
    correctionReason,
    sourcePath,
    errors,
    3,
    "frontmatter correction_reason",
  );
}

function assertMarkdownStructure(
  body: string,
  id: string,
  title: string,
  variant: ChangelogVariant,
  sourcePath: string,
  errors: string[],
) {
  const headings = getRenderedMarkdownTokens(body).filter(isHeadingToken);
  const firstHeading = headings[0];
  if (
    !firstHeading ||
    firstHeading.depth !== 1 ||
    firstHeading.text.trim() !== `${id}: ${title}`
  ) {
    errors.push(`${sourcePath}: first heading must be "# ${id}: ${title}"`);
  }

  const commonHeadings = ["Outcome", "Provenance", "Applicability"];
  const variantHeadings: Record<ChangelogVariant, readonly string[]> = {
    accepted_closeout: [
      "Problem",
      "Why the Change Was Needed",
      "Changes",
      "Accepted Evidence Summary",
      "Accepted Evidence Limits",
      "Acceptance and Source State",
      "Issue Disposition",
      "Preserved Work Record",
    ],
    accepted_update: [
      "Why the Change Was Needed",
      "Changes",
      "Accepted Evidence Summary",
      "Accepted Evidence Limits",
      "Review Method",
      "Acceptance and Source State",
      "Operational Record Context",
    ],
    legacy_import: [
      "Original Quality Hub Record",
      "Migration Lineage",
      "Modern Verification Status",
    ],
    correction: ["Correction Detail", "Authority and Reason", "Effective Clarification"],
  };
  const levelTwoHeadings = headings
    .filter((heading) => heading.depth === 2)
    .map((heading) => heading.text.trim());
  for (const heading of [...commonHeadings, ...variantHeadings[variant]]) {
    if (!levelTwoHeadings.includes(heading)) {
      errors.push(`${sourcePath}: missing required heading "## ${heading}"`);
    }
  }
  if (variant === "accepted_update") {
    const allowed = new Set([...commonHeadings, ...variantHeadings.accepted_update]);
    for (const heading of levelTwoHeadings) {
      const count = levelTwoHeadings.filter((candidate) => candidate === heading).length;
      if (!allowed.has(heading)) {
        errors.push(
          `${sourcePath}: Accepted Update contains unexpected level-two heading "## ${heading}"`,
        );
      } else if (count !== 1) {
        errors.push(
          `${sourcePath}: Accepted Update requires exactly one "## ${heading}" heading, found ${count}`,
        );
      }
    }
  }
}

function expectedSourcePath(id: string) {
  return `${CHANGELOG_DIRECTORY}/${id}.md`;
}

function validateLegacyPayloadPreservation(
  payload: LegacyQualityHubPayload,
  sourceHash: string,
  preservedRecordHash: string | undefined,
  privacyRedactions: readonly LegacyPrivacyRedaction[],
  sourcePath: string,
  errors: string[],
  label = "",
) {
  const prefix = label ? `${label} ` : "";
  const computedPreservedHash = computeLegacyPayloadHash(payload);
  const serializedPayload = canonicalJsonStringify(payload);
  if (/\/Users\/[^/\s"']+\//.test(serializedPayload)) {
    errors.push(
      `${sourcePath}: ${prefix}original_record must not expose an absolute local home-directory path`,
    );
  }
  if (privacyRedactions.length === 0) {
    if (preservedRecordHash !== undefined) {
      errors.push(
        `${sourcePath}: ${prefix}preserved_record_hash is allowed only when privacy_redactions are recorded`,
      );
    }
    if (sourceHash !== computedPreservedHash) {
      errors.push(
        `${sourcePath}: ${prefix}source_hash does not match the canonical original_record payload`,
      );
    }
    return;
  }
  if (preservedRecordHash !== computedPreservedHash) {
    errors.push(
      `${sourcePath}: ${prefix}preserved_record_hash does not match the privacy-safe original_record payload`,
    );
  }
  if (sourceHash === computedPreservedHash) {
    errors.push(
      `${sourcePath}: ${prefix}source_hash must retain the pre-redaction payload hash when privacy_redactions are recorded`,
    );
  }
  const fields = new Set<string>();
  const valueAtField = (field: string) => {
    const arrayMatch = field.match(
      /^(filesAffected|relatedFindingIds|relatedRunIds|tags)\[(\d+)\]$/,
    );
    if (arrayMatch) {
      const collection = payload[
        arrayMatch[1] as
          | "filesAffected"
          | "relatedFindingIds"
          | "relatedRunIds"
          | "tags"
      ];
      return collection?.[Number(arrayMatch[2])];
    }
    const commentMatch = field.match(
      /^comments\[(\d+)\]\.(id|author|timestamp|text)$/,
    );
    if (commentMatch) {
      return payload.comments[Number(commentMatch[1])]?.[
        commentMatch[2] as keyof LegacyQualityHubComment
      ];
    }
    return payload[field as keyof LegacyQualityHubPayload];
  };
  for (const redaction of privacyRedactions) {
    if (fields.has(redaction.field)) {
      errors.push(`${sourcePath}: ${prefix}privacy_redactions must not repeat ${redaction.field}`);
      continue;
    }
    fields.add(redaction.field);
    const value = valueAtField(redaction.field);
    if (typeof value !== "string" || !value.includes("$HOME/")) {
      errors.push(
        `${sourcePath}: ${prefix}${redaction.field} must contain the documented $HOME/ replacement`,
      );
    }
  }
}

function parseChangelogRecord(
  sourcePath: string,
  rawSource: string,
  asOf: string,
  errors: string[],
): ChangelogRecord | null {
  let frontmatter: ParsedFrontmatter;
  try {
    frontmatter = parseFrontmatter(rawSource);
  } catch (error) {
    errors.push(
      `${sourcePath}: ${error instanceof Error ? error.message : "invalid frontmatter"}`,
    );
    return null;
  }

  const parsed = changelogSchema.safeParse(frontmatter.data);
  if (!parsed.success) {
    formatZodErrors(parsed.error).forEach((error) =>
      errors.push(`${sourcePath}: ${error}`),
    );
    return null;
  }

  const metadata = parsed.data;
  if (sourcePath !== expectedSourcePath(metadata.change_id)) {
    errors.push(
      `${sourcePath}: canonical Changelog path must be ${expectedSourcePath(metadata.change_id)}`,
    );
  }
  if (metadata.source_record !== sourcePath) {
    errors.push(`${sourcePath}: source_record must exactly match the canonical source path`);
  }
  if (metadata.change_date > asOf) {
    errors.push(`${sourcePath}: change_date cannot be later than validation date ${asOf}`);
  }

  assertMarkdownStructure(
    frontmatter.body,
    metadata.change_id,
    metadata.title,
    metadata.variant,
    sourcePath,
    errors,
  );

  const common = {
    kind: "changelog" as const,
    variant: metadata.variant,
    id: metadata.change_id,
    title: metadata.title,
    changeDate: metadata.change_date,
    outcome: metadata.outcome,
    provenance: metadata.provenance,
    affectedCapabilities: metadata.affected_capabilities,
    sourcePath,
    body: frontmatter.body,
    rawSource,
  };

  if (metadata.variant === "accepted_closeout") {
    assertAcceptedNarrativeAgreement(
      frontmatter.body,
      metadata,
      sourcePath,
      errors,
    );
    if (!ACCEPTED_CHANGE_ID.test(metadata.change_id)) {
      errors.push(`${sourcePath}: accepted closeout ID must use PREFIX-CHANGE-NNN`);
    }
    if (!metadata.affected_capabilities.includes(metadata.owning_capability)) {
      errors.push(`${sourcePath}: affected_capabilities must include owning_capability`);
    }
    if (metadata.accepted_on !== metadata.change_date) {
      errors.push(`${sourcePath}: accepted_on must equal change_date`);
    }
    if (
      metadata.archive_record !==
      `docs/current-work/archive/${metadata.owning_capability}/${metadata.archived_project_id}.md`
    ) {
      errors.push(`${sourcePath}: archive_record does not match the owning capability and project ID`);
    }
    if (
      metadata.archive_route !==
      buildArchivedCurrentWorkHref(metadata.archived_project_id)
    ) {
      errors.push(`${sourcePath}: archive_route does not match archived_project_id`);
    }
    const overlap = metadata.resolved_issue_ids.filter((id) =>
      metadata.remaining_issue_ids.includes(id),
    );
    if (overlap.length > 0) {
      errors.push(
        `${sourcePath}: Issue IDs cannot be both resolved and remaining: ${overlap.join(", ")}`,
      );
    }
    return deepFreeze({
      ...common,
      variant: "accepted_closeout",
      provenance: "accepted-closeout",
      problem: metadata.problem,
      whyChangeWasNeeded: metadata.why_change_was_needed,
      changes: metadata.changes,
      acceptedEvidenceSummary: metadata.accepted_evidence_summary,
      acceptedEvidenceLimits: metadata.accepted_evidence_limits,
      owningCapability: metadata.owning_capability,
      acceptedOn: metadata.accepted_on,
      acceptedBy: metadata.accepted_by,
      acceptanceRef: metadata.acceptance_ref,
      sourceRevision: metadata.source_revision,
      archivedProjectId: metadata.archived_project_id,
      archiveRecord: metadata.archive_record,
      archiveRoute: metadata.archive_route,
      resolvedIssueIds: metadata.resolved_issue_ids,
      remainingIssueIds: metadata.remaining_issue_ids,
    });
  }

  if (metadata.variant === "accepted_update") {
    assertAcceptedUpdateNarrativeAgreement(
      frontmatter.body,
      metadata,
      sourcePath,
      errors,
    );
    assertMarkdownSectionAgreement(
      getMarkdownSections(frontmatter.body, 2),
      "Operational Record Context",
      ACCEPTED_UPDATE_CONTEXT_NARRATIVE,
      sourcePath,
      errors,
      2,
      "workflow_record_context",
    );
    if (!isAcceptedUpdateId(metadata.change_id)) {
      errors.push(
        `${sourcePath}: accepted update ID must use an explicitly registered PREFIX-UPDATE-NNN identity`,
      );
    } else {
      try {
        assertAcceptedUpdateOwner(
          metadata.change_id,
          metadata.owning_capability,
        );
      } catch (error) {
        errors.push(`${sourcePath}: ${(error as Error).message}`);
      }
    }
    if (!metadata.affected_capabilities.includes(metadata.owning_capability)) {
      errors.push(`${sourcePath}: affected_capabilities must include owning_capability`);
    }
    if (metadata.accepted_on !== metadata.change_date) {
      errors.push(`${sourcePath}: accepted_on must equal change_date`);
    }
    return deepFreeze({
      ...common,
      variant: "accepted_update",
      provenance: "accepted-update",
      whyChangeWasNeeded: metadata.why_change_was_needed,
      changes: metadata.changes,
      acceptedEvidenceSummary: metadata.accepted_evidence_summary,
      acceptedEvidenceLimits: metadata.accepted_evidence_limits,
      owningCapability: metadata.owning_capability,
      acceptedOn: metadata.accepted_on,
      acceptedBy: metadata.accepted_by,
      reviewMethod: metadata.review_method,
      sourceRevision: metadata.source_revision,
      workflowRecordContext: metadata.workflow_record_context,
    });
  }

  if (metadata.variant === "legacy_import") {
    const idMatch = metadata.change_id.match(LEGACY_CHANGE_ID);
    if (!idMatch) {
      errors.push(`${sourcePath}: legacy import ID must use LEGACY-QH-<original-id>`);
    } else if (idMatch[1] !== metadata.legacy_source_id) {
      errors.push(`${sourcePath}: legacy ID suffix must equal legacy_source_id`);
    }
    if (metadata.original_record.id !== metadata.legacy_source_id) {
      errors.push(`${sourcePath}: original_record.id must equal legacy_source_id`);
    }
    validateLegacyProjectionAgreement(
      metadata.title,
      metadata.outcome,
      metadata.change_date,
      metadata.original_record,
      sourcePath,
      errors,
    );
    assertMarkdownSectionAgreement(
      getMarkdownSections(frontmatter.body, 2),
      "Outcome",
      metadata.outcome,
      sourcePath,
      errors,
      2,
      "frontmatter outcome (preserved Quality Hub summary)",
    );
    validateLegacyPayloadPreservation(
      metadata.original_record,
      metadata.source_hash,
      metadata.preserved_record_hash,
      metadata.privacy_redactions,
      sourcePath,
      errors,
    );
    if (metadata.imported_on > asOf) {
      errors.push(`${sourcePath}: imported_on cannot be later than validation date ${asOf}`);
    }
    if (new Set(metadata.source_lineage).size !== metadata.source_lineage.length) {
      errors.push(`${sourcePath}: source_lineage must not contain duplicates`);
    }
    const includesGallery = metadata.affected_capabilities.includes(
      "community-gallery",
    );
    if ((metadata.gallery_applicability === "applicable") !== includesGallery) {
      errors.push(
        `${sourcePath}: gallery_applicability must match the Community Gallery capability mapping`,
      );
    }
    if (
      metadata.applicability_status ===
        "gallery-reviewed-other-capabilities-unclassified" &&
      metadata.affected_capabilities.length !== 0
    ) {
      errors.push(
        `${sourcePath}: unclassified legacy applicability requires an empty affected_capabilities list`,
      );
    }
    if (
      metadata.applicability_status ===
        "gallery-reviewed-other-capabilities-unclassified" &&
      metadata.gallery_applicability !== "not_applicable"
    ) {
      errors.push(
        `${sourcePath}: unclassified legacy applicability must use gallery_applicability not_applicable`,
      );
    }
    if (
      metadata.applicability_status === "gallery-review-pending" &&
      (metadata.gallery_applicability !== "pending_excluded" ||
        metadata.affected_capabilities.length !== 0)
    ) {
      errors.push(
        `${sourcePath}: pending Gallery review must remain excluded with an empty affected_capabilities list`,
      );
    }
    if (
      metadata.applicability_status === "capability-reviewed" &&
      metadata.affected_capabilities.length === 0
    ) {
      errors.push(
        `${sourcePath}: capability-reviewed legacy applicability requires at least one affected capability`,
      );
    }
    return deepFreeze({
      ...common,
      variant: "legacy_import",
      provenance: "historical-quality-hub",
      legacySourceId: metadata.legacy_source_id,
      originalRecord: metadata.original_record,
      sourceHash: metadata.source_hash,
      preservedRecordHash: metadata.preserved_record_hash,
      privacyRedactions: metadata.privacy_redactions,
      migrationSnapshotHash: metadata.migration_snapshot_hash,
      importedOn: metadata.imported_on,
      sourceLineage: metadata.source_lineage,
      migrationReceipt: metadata.migration_receipt,
      applicabilityEvidence: metadata.applicability_evidence,
      applicabilityStatus: metadata.applicability_status,
      galleryApplicability: metadata.gallery_applicability,
      provenanceLimit: metadata.provenance_limit,
      modernAcceptance: metadata.modern_acceptance,
      proofStatus: metadata.proof_status,
    });
  }

  const correctionMatch = metadata.change_id.match(CORRECTION_CHANGE_ID);
  if (!correctionMatch) {
    errors.push(`${sourcePath}: correction ID must use <target-id>-COR-NNN`);
  } else {
    const idSequence = Number(correctionMatch[2]);
    if (correctionMatch[1] !== metadata.target_change_id) {
      errors.push(`${sourcePath}: correction ID target must equal target_change_id`);
    }
    if (idSequence !== metadata.correction_sequence) {
      errors.push(`${sourcePath}: correction ID sequence must equal correction_sequence`);
    }
  }
  if (metadata.corrected_on !== metadata.change_date) {
    errors.push(`${sourcePath}: corrected_on must equal change_date`);
  }
  assertCorrectionNarrativeAgreement(
    frontmatter.body,
    metadata.clarified_fields,
    metadata.correction_authority,
    metadata.correction_reason,
    sourcePath,
    errors,
  );
  return deepFreeze({
    ...common,
    variant: "correction",
    provenance: "correction",
    targetChangeId: metadata.target_change_id,
    correctionSequence: metadata.correction_sequence,
    correctedOn: metadata.corrected_on,
    correctionAuthority: metadata.correction_authority,
    correctionReason: metadata.correction_reason,
    sourceRevision: metadata.source_revision,
    clarifiedFields: {
      title: metadata.clarified_fields.title,
      changeDate: metadata.clarified_fields.change_date,
      problem: metadata.clarified_fields.problem,
      whyChangeWasNeeded: metadata.clarified_fields.why_change_was_needed,
      changes: metadata.clarified_fields.changes,
      outcome: metadata.clarified_fields.outcome,
      acceptedEvidenceSummary:
        metadata.clarified_fields.accepted_evidence_summary,
      acceptedEvidenceLimits:
        metadata.clarified_fields.accepted_evidence_limits,
      affectedCapabilities: metadata.clarified_fields.affected_capabilities,
      acceptedOn: metadata.clarified_fields.accepted_on,
      acceptedBy: metadata.clarified_fields.accepted_by,
      reviewMethod: metadata.clarified_fields.review_method,
      acceptanceRef: metadata.clarified_fields.acceptance_ref,
      sourceRevision: metadata.clarified_fields.source_revision,
      archivedProjectId: metadata.clarified_fields.archived_project_id,
      archiveRecord: metadata.clarified_fields.archive_record,
      archiveRoute: metadata.clarified_fields.archive_route,
      resolvedIssueIds: metadata.clarified_fields.resolved_issue_ids,
      remainingIssueIds: metadata.clarified_fields.remaining_issue_ids,
      originalRecord: metadata.clarified_fields.original_record,
      sourceHash: metadata.clarified_fields.source_hash,
      preservedRecordHash: metadata.clarified_fields.preserved_record_hash,
      privacyRedactions: metadata.clarified_fields.privacy_redactions,
      migrationSnapshotHash: metadata.clarified_fields.migration_snapshot_hash,
      importedOn: metadata.clarified_fields.imported_on,
      sourceLineage: metadata.clarified_fields.source_lineage,
      migrationReceipt: metadata.clarified_fields.migration_receipt,
      applicabilityEvidence: metadata.clarified_fields.applicability_evidence,
      applicabilityStatus: metadata.clarified_fields.applicability_status,
      galleryApplicability: metadata.clarified_fields.gallery_applicability,
    },
  });
}

function validateUniqueRecordIds(records: readonly ChangelogRecord[], errors: string[]) {
  const owners = new Map<string, ChangelogRecord>();
  for (const record of records) {
    const previous = owners.get(record.id);
    if (previous) {
      errors.push(
        `duplicate Changelog ID ${record.id}: ${previous.sourcePath} and ${record.sourcePath}`,
      );
    } else {
      owners.set(record.id, record);
    }
  }
}

function compareCorrectionOrder(
  left: CorrectionChangelogRecord,
  right: CorrectionChangelogRecord,
) {
  return left.changeDate.localeCompare(right.changeDate) || left.id.localeCompare(right.id);
}

const COMMON_CLARIFIED_FIELDS = new Set<keyof ChangelogClarifiedFields>([
  "title",
  "changeDate",
  "outcome",
  "affectedCapabilities",
]);

const ACCEPTED_CLARIFIED_FIELDS = new Set<keyof ChangelogClarifiedFields>([
  ...COMMON_CLARIFIED_FIELDS,
  "problem",
  "whyChangeWasNeeded",
  "changes",
  "acceptedEvidenceSummary",
  "acceptedEvidenceLimits",
  "acceptedOn",
  "acceptedBy",
  "acceptanceRef",
  "sourceRevision",
  "archivedProjectId",
  "archiveRecord",
  "archiveRoute",
  "resolvedIssueIds",
  "remainingIssueIds",
]);

const ACCEPTED_UPDATE_CLARIFIED_FIELDS = new Set<keyof ChangelogClarifiedFields>([
  ...COMMON_CLARIFIED_FIELDS,
  "whyChangeWasNeeded",
  "changes",
  "acceptedEvidenceSummary",
  "acceptedEvidenceLimits",
  "acceptedOn",
  "acceptedBy",
  "reviewMethod",
  "sourceRevision",
]);

const LEGACY_CLARIFIED_FIELDS = new Set<keyof ChangelogClarifiedFields>([
  ...COMMON_CLARIFIED_FIELDS,
  "originalRecord",
  "sourceHash",
  "preservedRecordHash",
  "privacyRedactions",
  "migrationSnapshotHash",
  "importedOn",
  "sourceLineage",
  "migrationReceipt",
  "applicabilityEvidence",
  "applicabilityStatus",
  "galleryApplicability",
]);

function sameStringSet(left: readonly string[], right: readonly string[]) {
  return [...left].sort().join("|") === [...right].sort().join("|");
}

function applyCorrectionToRoot(
  root: ChangelogRootRecord,
  correction: CorrectionChangelogRecord,
): ChangelogRootRecord {
  const clarified = correction.clarifiedFields;
  if (root.variant === "accepted_closeout") {
    return deepFreeze({
      ...root,
      variant: "accepted_closeout" as const,
      provenance: "accepted-closeout" as const,
      title: clarified.title ?? root.title,
      changeDate: clarified.changeDate ?? root.changeDate,
      problem: clarified.problem ?? root.problem,
      whyChangeWasNeeded:
        clarified.whyChangeWasNeeded ?? root.whyChangeWasNeeded,
      changes: clarified.changes ?? root.changes,
      outcome: clarified.outcome ?? root.outcome,
      acceptedEvidenceSummary:
        clarified.acceptedEvidenceSummary ?? root.acceptedEvidenceSummary,
      acceptedEvidenceLimits:
        clarified.acceptedEvidenceLimits ?? root.acceptedEvidenceLimits,
      affectedCapabilities:
        clarified.affectedCapabilities ?? root.affectedCapabilities,
      acceptedOn: clarified.acceptedOn ?? root.acceptedOn,
      acceptedBy: clarified.acceptedBy ?? root.acceptedBy,
      acceptanceRef: clarified.acceptanceRef ?? root.acceptanceRef,
      sourceRevision: clarified.sourceRevision ?? root.sourceRevision,
      archivedProjectId:
        clarified.archivedProjectId ?? root.archivedProjectId,
      archiveRecord: clarified.archiveRecord ?? root.archiveRecord,
      archiveRoute: clarified.archiveRoute ?? root.archiveRoute,
      resolvedIssueIds: clarified.resolvedIssueIds ?? root.resolvedIssueIds,
      remainingIssueIds:
        clarified.remainingIssueIds ?? root.remainingIssueIds,
    });
  }

  if (root.variant === "accepted_update") {
    return deepFreeze({
      ...root,
      variant: "accepted_update" as const,
      provenance: "accepted-update" as const,
      title: clarified.title ?? root.title,
      changeDate: clarified.changeDate ?? root.changeDate,
      whyChangeWasNeeded:
        clarified.whyChangeWasNeeded ?? root.whyChangeWasNeeded,
      changes: clarified.changes ?? root.changes,
      outcome: clarified.outcome ?? root.outcome,
      acceptedEvidenceSummary:
        clarified.acceptedEvidenceSummary ?? root.acceptedEvidenceSummary,
      acceptedEvidenceLimits:
        clarified.acceptedEvidenceLimits ?? root.acceptedEvidenceLimits,
      affectedCapabilities:
        clarified.affectedCapabilities ?? root.affectedCapabilities,
      acceptedOn: clarified.acceptedOn ?? root.acceptedOn,
      acceptedBy: clarified.acceptedBy ?? root.acceptedBy,
      reviewMethod: clarified.reviewMethod ?? root.reviewMethod,
      sourceRevision: clarified.sourceRevision ?? root.sourceRevision,
    });
  }

  return deepFreeze({
    ...root,
    variant: "legacy_import" as const,
    provenance: "historical-quality-hub" as const,
    title:
      clarified.title ?? clarified.originalRecord?.title ?? root.title,
    changeDate:
      clarified.changeDate ??
      clarified.originalRecord?.updatedAt.slice(0, 10) ??
      root.changeDate,
    outcome:
      clarified.outcome ?? clarified.originalRecord?.summary ?? root.outcome,
    affectedCapabilities:
      clarified.affectedCapabilities ?? root.affectedCapabilities,
    originalRecord: clarified.originalRecord ?? root.originalRecord,
    sourceHash: clarified.sourceHash ?? root.sourceHash,
    preservedRecordHash:
      clarified.preservedRecordHash ?? root.preservedRecordHash,
    privacyRedactions:
      clarified.privacyRedactions ?? root.privacyRedactions,
    migrationSnapshotHash:
      clarified.migrationSnapshotHash ?? root.migrationSnapshotHash,
    importedOn: clarified.importedOn ?? root.importedOn,
    sourceLineage: clarified.sourceLineage ?? root.sourceLineage,
    migrationReceipt: clarified.migrationReceipt ?? root.migrationReceipt,
    applicabilityEvidence:
      clarified.applicabilityEvidence ?? root.applicabilityEvidence,
    applicabilityStatus:
      clarified.applicabilityStatus ?? root.applicabilityStatus,
    galleryApplicability:
      clarified.galleryApplicability ?? root.galleryApplicability,
  });
}

function validateAcceptedEffectiveRecord(
  record: AcceptedCloseoutChangelogRecord,
  correction: CorrectionChangelogRecord,
  asOf: string,
  errors: string[],
) {
  for (const [field, value] of [
    ["title", record.title],
    ["problem", record.problem],
    ["why_change_was_needed", record.whyChangeWasNeeded],
    ["changes", record.changes],
    ["outcome", record.outcome],
    ["accepted_evidence_summary", record.acceptedEvidenceSummary],
    ["accepted_evidence_limits", record.acceptedEvidenceLimits],
  ] as const) {
    if (!isAcceptedContent(value)) {
      errors.push(
        `${correction.sourcePath}: corrected ${field} must contain accepted content, not placeholder-only text`,
      );
    }
  }
  if (record.changeDate > asOf) {
    errors.push(
      `${correction.sourcePath}: corrected change_date cannot be later than validation date ${asOf}`,
    );
  }
  if (record.affectedCapabilities.length === 0) {
    errors.push(
      `${correction.sourcePath}: an accepted closeout must retain at least one affected capability`,
    );
  }
  if (!record.affectedCapabilities.includes(record.owningCapability)) {
    errors.push(
      `${correction.sourcePath}: a correction cannot remove the accepted closeout's owning capability`,
    );
  }
  if (record.acceptedOn !== record.changeDate) {
    errors.push(
      `${correction.sourcePath}: corrected accepted_on must equal the effective change_date`,
    );
  }
  if (
    record.archiveRecord !==
    `docs/current-work/archive/${record.owningCapability}/${record.archivedProjectId}.md`
  ) {
    errors.push(
      `${correction.sourcePath}: corrected archive_record does not match the owning capability and project ID`,
    );
  }
  if (
    record.archiveRoute !==
    buildArchivedCurrentWorkHref(record.archivedProjectId)
  ) {
    errors.push(
      `${correction.sourcePath}: corrected archive_route does not match archived_project_id`,
    );
  }
  const overlap = record.resolvedIssueIds.filter((id) =>
    record.remainingIssueIds.includes(id),
  );
  if (overlap.length > 0) {
    errors.push(
      `${correction.sourcePath}: corrected Issue IDs cannot be both resolved and remaining: ${overlap.join(", ")}`,
    );
  }
}

function validateAcceptedUpdateEffectiveRecord(
  record: AcceptedUpdateChangelogRecord,
  correction: CorrectionChangelogRecord,
  asOf: string,
  errors: string[],
) {
  for (const [field, value] of [
    ["title", record.title],
    ["why_change_was_needed", record.whyChangeWasNeeded],
    ["changes", record.changes],
    ["outcome", record.outcome],
    ["accepted_evidence_summary", record.acceptedEvidenceSummary],
    ["accepted_evidence_limits", record.acceptedEvidenceLimits],
    ["review_method", record.reviewMethod],
  ] as const) {
    if (!isAcceptedContent(value)) {
      errors.push(
        `${correction.sourcePath}: corrected ${field} must contain accepted content, not placeholder-only text`,
      );
    }
  }
  if (record.changeDate > asOf) {
    errors.push(
      `${correction.sourcePath}: corrected change_date cannot be later than validation date ${asOf}`,
    );
  }
  if (record.affectedCapabilities.length === 0) {
    errors.push(
      `${correction.sourcePath}: an accepted update must retain at least one affected capability`,
    );
  }
  if (!record.affectedCapabilities.includes(record.owningCapability)) {
    errors.push(
      `${correction.sourcePath}: a correction cannot remove the accepted update's owning capability`,
    );
  }
  if (record.acceptedOn !== record.changeDate) {
    errors.push(
      `${correction.sourcePath}: corrected accepted_on must equal the effective change_date`,
    );
  }
}

function validateLegacyEffectiveRecord(
  record: LegacyImportChangelogRecord,
  correction: CorrectionChangelogRecord,
  asOf: string,
  errors: string[],
) {
  validateLegacyProjectionAgreement(
    record.title,
    record.outcome,
    record.changeDate,
    record.originalRecord,
    correction.sourcePath,
    errors,
    "corrected ",
  );
  if (record.changeDate > asOf) {
    errors.push(
      `${correction.sourcePath}: corrected change_date cannot be later than validation date ${asOf}`,
    );
  }
  if (record.originalRecord.id !== record.legacySourceId) {
    errors.push(
      `${correction.sourcePath}: corrected original_record.id must equal legacy_source_id`,
    );
  }
  validateLegacyPayloadPreservation(
    record.originalRecord,
    record.sourceHash,
    record.preservedRecordHash,
    record.privacyRedactions,
    correction.sourcePath,
    errors,
    "corrected",
  );
  if (record.importedOn > asOf) {
    errors.push(
      `${correction.sourcePath}: corrected imported_on cannot be later than validation date ${asOf}`,
    );
  }
  if (new Set(record.sourceLineage).size !== record.sourceLineage.length) {
    errors.push(
      `${correction.sourcePath}: corrected source_lineage must not contain duplicates`,
    );
  }
  const includesGallery = record.affectedCapabilities.includes(
    "community-gallery",
  );
  if ((record.galleryApplicability === "applicable") !== includesGallery) {
    errors.push(
      `${correction.sourcePath}: corrected gallery_applicability must match the Community Gallery capability mapping`,
    );
  }
  if (
    record.applicabilityStatus ===
      "gallery-reviewed-other-capabilities-unclassified" &&
    record.affectedCapabilities.length !== 0
  ) {
    errors.push(
      `${correction.sourcePath}: corrected unclassified legacy applicability requires an empty affected_capabilities list`,
    );
  }
  if (
    record.applicabilityStatus ===
      "gallery-reviewed-other-capabilities-unclassified" &&
    record.galleryApplicability !== "not_applicable"
  ) {
    errors.push(
      `${correction.sourcePath}: corrected unclassified legacy applicability must use gallery_applicability not_applicable`,
    );
  }
  if (
    record.applicabilityStatus === "gallery-review-pending" &&
    (record.galleryApplicability !== "pending_excluded" ||
      record.affectedCapabilities.length !== 0)
  ) {
    errors.push(
      `${correction.sourcePath}: corrected pending Gallery review must remain excluded with an empty affected_capabilities list`,
    );
  }
  if (
    record.applicabilityStatus === "capability-reviewed" &&
    record.affectedCapabilities.length === 0
  ) {
    errors.push(
      `${correction.sourcePath}: corrected capability-reviewed legacy applicability requires at least one affected capability`,
    );
  }
}

function validateLegacyDerivedProjectionNarrative(
  previous: LegacyImportChangelogRecord,
  effective: LegacyImportChangelogRecord,
  correction: CorrectionChangelogRecord,
  errors: string[],
) {
  if (correction.clarifiedFields.originalRecord === undefined) return;

  const derivedFields = [
    [
      "Title",
      correction.clarifiedFields.title === undefined &&
      effective.title !== previous.title
        ? effective.title
        : undefined,
      "clarified_fields.original_record.title",
    ],
    [
      "History Date",
      correction.clarifiedFields.changeDate === undefined &&
      effective.changeDate !== previous.changeDate
        ? effective.changeDate
        : undefined,
      "the date in clarified_fields.original_record.updatedAt",
    ],
    [
      "Outcome",
      correction.clarifiedFields.outcome === undefined &&
      effective.outcome !== previous.outcome
        ? effective.outcome
        : undefined,
      "clarified_fields.original_record.summary",
    ],
  ] as const;
  if (derivedFields.every(([, value]) => value === undefined)) return;

  const effectiveSections = getMarkdownSections(correction.body, 2).filter(
    (section) => section.heading === "Effective Clarification",
  );
  if (effectiveSections.length !== 1) {
    errors.push(
      `${correction.sourcePath}: expected exactly one "## Effective Clarification" section, found ${effectiveSections.length}`,
    );
    return;
  }
  const sections = getMarkdownSections(effectiveSections[0].content, 3);
  for (const [heading, expected, fieldPath] of derivedFields) {
    if (expected === undefined) continue;
    assertMarkdownSectionAgreement(
      sections,
      heading,
      expected,
      correction.sourcePath,
      errors,
      3,
      fieldPath,
    );
  }
}

function validateCorrectionFieldScope(
  root: ChangelogRootRecord,
  correction: CorrectionChangelogRecord,
  errors: string[],
) {
  const allowed =
    root.variant === "accepted_closeout"
      ? ACCEPTED_CLARIFIED_FIELDS
      : root.variant === "accepted_update"
        ? ACCEPTED_UPDATE_CLARIFIED_FIELDS
        : LEGACY_CLARIFIED_FIELDS;
  for (const [field, value] of Object.entries(correction.clarifiedFields)) {
    if (value !== undefined && !allowed.has(field as keyof ChangelogClarifiedFields)) {
      errors.push(
        `${correction.sourcePath}: clarified field ${field} does not apply to ${root.variant} records`,
      );
    }
  }
}

const SET_LIKE_CLARIFIED_FIELDS = new Set<keyof ChangelogClarifiedFields>([
  "affectedCapabilities",
  "resolvedIssueIds",
  "remainingIssueIds",
  "sourceLineage",
]);

function clarifiedValuesMatch(
  field: keyof ChangelogClarifiedFields,
  currentValue: unknown,
  clarifiedValue: unknown,
) {
  if (currentValue === undefined || clarifiedValue === undefined) return false;
  if (
    SET_LIKE_CLARIFIED_FIELDS.has(field) &&
    Array.isArray(currentValue) &&
    Array.isArray(clarifiedValue) &&
    currentValue.every((value) => typeof value === "string") &&
    clarifiedValue.every((value) => typeof value === "string")
  ) {
    return sameStringSet(currentValue, clarifiedValue);
  }
  return canonicalJsonStringify(currentValue) === canonicalJsonStringify(clarifiedValue);
}

function validateCorrectionChangesEffectiveValue(
  root: ChangelogRootRecord,
  correction: CorrectionChangelogRecord,
  errors: string[],
) {
  const allowed =
    root.variant === "accepted_closeout"
      ? ACCEPTED_CLARIFIED_FIELDS
      : root.variant === "accepted_update"
        ? ACCEPTED_UPDATE_CLARIFIED_FIELDS
        : LEGACY_CLARIFIED_FIELDS;
  const currentValues = root as unknown as Readonly<Record<string, unknown>>;
  for (const [rawField, clarifiedValue] of Object.entries(
    correction.clarifiedFields,
  )) {
    const field = rawField as keyof ChangelogClarifiedFields;
    if (
      clarifiedValue !== undefined &&
      allowed.has(field) &&
      clarifiedValuesMatch(field, currentValues[field], clarifiedValue)
    ) {
      errors.push(
        `${correction.sourcePath}: clarified field ${rawField} must change the effective record`,
      );
    }
  }
}

function applyCorrections(
  root: ChangelogRootRecord,
  corrections: readonly CorrectionChangelogRecord[],
): EffectiveChangelogEntry {
  let effectiveRecord = root;
  let changeDate = root.changeDate;

  for (const correction of corrections) {
    effectiveRecord = applyCorrectionToRoot(effectiveRecord, correction);
    changeDate = correction.changeDate;
  }

  return deepFreeze({
    id: root.id,
    variant: root.variant,
    title: effectiveRecord.title,
    changeDate,
    outcome: effectiveRecord.outcome,
    provenance: corrections.length > 0 ? "correction" : root.provenance,
    affectedCapabilities: effectiveRecord.affectedCapabilities,
    sourcePath: root.sourcePath,
    body: root.body,
    rootRecord: root,
    effectiveRecord,
    appliedCorrections: corrections,
  });
}

function validateCorrections(
  roots: readonly ChangelogRootRecord[],
  corrections: readonly CorrectionChangelogRecord[],
  asOf: string,
  errors: string[],
) {
  const rootById = new Map(roots.map((root) => [root.id, root]));
  const correctionIds = new Set(corrections.map((correction) => correction.id));
  const grouped = new Map<string, CorrectionChangelogRecord[]>();

  for (const correction of corrections) {
    if (correction.targetChangeId === correction.id) {
      errors.push(`${correction.sourcePath}: correction cannot target itself`);
    } else if (correctionIds.has(correction.targetChangeId)) {
      errors.push(`${correction.sourcePath}: correction cannot target another correction`);
    } else if (!rootById.has(correction.targetChangeId)) {
      errors.push(
        `${correction.sourcePath}: correction target ${correction.targetChangeId} must be an existing accepted or legacy record`,
      );
    }
    const targetCorrections = grouped.get(correction.targetChangeId) ?? [];
    targetCorrections.push(correction);
    grouped.set(correction.targetChangeId, targetCorrections);
  }

  for (const [targetId, targetCorrections] of grouped) {
    const root = rootById.get(targetId);
    const bySequence = [...targetCorrections].sort(
      (left, right) => left.correctionSequence - right.correctionSequence,
    );
    let effectiveRecord = root;
    let previousDate = root?.changeDate ?? "0000-00-00";

    bySequence.forEach((correction, index) => {
      const expectedSequence = index + 1;
      if (correction.correctionSequence !== expectedSequence) {
        errors.push(
          `${correction.sourcePath}: correction sequence for ${targetId} must be contiguous from 1; expected ${expectedSequence}`,
        );
      }
      if (correction.changeDate < previousDate) {
        errors.push(
          `${correction.sourcePath}: correction date cannot precede the root or an earlier correction`,
        );
      }
      if (effectiveRecord) {
        validateCorrectionFieldScope(effectiveRecord, correction, errors);
        validateCorrectionChangesEffectiveValue(
          effectiveRecord,
          correction,
          errors,
        );
        const previousRecord = effectiveRecord;
        effectiveRecord = applyCorrectionToRoot(previousRecord, correction);
        if (effectiveRecord.variant === "accepted_closeout") {
          validateAcceptedEffectiveRecord(
            effectiveRecord,
            correction,
            asOf,
            errors,
          );
        } else if (effectiveRecord.variant === "accepted_update") {
          validateAcceptedUpdateEffectiveRecord(
            effectiveRecord,
            correction,
            asOf,
            errors,
          );
        } else {
          if (previousRecord.variant === "legacy_import") {
            validateLegacyDerivedProjectionNarrative(
              previousRecord,
              effectiveRecord,
              correction,
              errors,
            );
          }
          validateLegacyEffectiveRecord(effectiveRecord, correction, asOf, errors);
        }
      }
      if (
        effectiveRecord &&
        !sameStringSet(
          correction.affectedCapabilities,
          effectiveRecord.affectedCapabilities,
        )
      ) {
        errors.push(
          `${correction.sourcePath}: affected_capabilities must state the effective capability mapping after this correction`,
        );
      }
      previousDate = correction.changeDate;
    });
  }
}

function buildEffectiveEntries(
  roots: readonly ChangelogRootRecord[],
  corrections: readonly CorrectionChangelogRecord[],
) {
  const correctionsByRoot = new Map<string, CorrectionChangelogRecord[]>();
  for (const correction of corrections) {
    const values = correctionsByRoot.get(correction.targetChangeId) ?? [];
    values.push(correction);
    correctionsByRoot.set(correction.targetChangeId, values);
  }

  return roots
    .map((root) =>
      applyCorrections(
        root,
        [...(correctionsByRoot.get(root.id) ?? [])].sort(compareCorrectionOrder),
      ),
    )
    .sort(
      (left, right) =>
        right.changeDate.localeCompare(left.changeDate) || left.id.localeCompare(right.id),
    );
}

function validateAppendOnlyBaseline(
  sources: ChangelogSourceMap,
  baselineSources: ChangelogSourceMap,
  errors: string[],
) {
  for (const [rawPath, baselineSource] of Object.entries(baselineSources)) {
    const sourcePath = normalizeSourcePath(rawPath);
    if (!sourcePath.startsWith(`${CHANGELOG_DIRECTORY}/`)) continue;
    const currentSource = sources[sourcePath];
    if (currentSource === undefined) {
      errors.push(`${sourcePath}: existing Changelog record was removed`);
    } else if (currentSource !== baselineSource) {
      errors.push(`${sourcePath}: existing Changelog record was rewritten; append a correction record instead`);
    }
  }
}

export function validateChangelogRecordSources(
  sources: ChangelogSourceMap,
  options: ChangelogRecordValidationOptions,
): ChangelogRecordValidationResult {
  const errors: string[] = [];
  if (!isRealIsoDate(options.asOf)) {
    errors.push("Changelog validation asOf must use a real YYYY-MM-DD date");
  }
  const asOf = isRealIsoDate(options.asOf) ? options.asOf : "1970-01-01";
  const normalizedSources: Record<string, string> = {};
  for (const [rawPath, source] of Object.entries(sources)) {
    const sourcePath = normalizeSourcePath(rawPath);
    if (Object.prototype.hasOwnProperty.call(normalizedSources, sourcePath)) {
      errors.push(`${sourcePath}: duplicate source path after normalization`);
      continue;
    }
    normalizedSources[sourcePath] = source;
  }
  const records = Object.entries(normalizedSources)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([sourcePath, source]) =>
      parseChangelogRecord(sourcePath, source, asOf, errors),
    )
    .filter((record): record is ChangelogRecord => record !== null);

  validateUniqueRecordIds(records, errors);
  const roots = records.filter(
    (record): record is ChangelogRootRecord => record.variant !== "correction",
  );
  const corrections = records
    .filter(
      (record): record is CorrectionChangelogRecord =>
        record.variant === "correction",
    )
    .sort(compareCorrectionOrder);
  validateCorrections(roots, corrections, asOf, errors);
  if (options.baselineSources) {
    validateAppendOnlyBaseline(
      normalizedSources,
      Object.fromEntries(
        Object.entries(options.baselineSources).map(([sourcePath, source]) => [
          normalizeSourcePath(sourcePath),
          source,
        ]),
      ),
      errors,
    );
  }

  const effectiveEntries = buildEffectiveEntries(roots, corrections);
  const registry = deepFreeze({
    records: [...records].sort((left, right) => left.id.localeCompare(right.id)),
    roots: [...roots].sort((left, right) => left.id.localeCompare(right.id)),
    corrections,
    effectiveEntries,
  });
  const uniqueErrors = [...new Set(errors)].sort();
  return deepFreeze({
    ok: uniqueErrors.length === 0,
    errors: uniqueErrors,
    registry,
  });
}

export function buildChangelogRecordRegistry(
  sources: ChangelogSourceMap,
  options: ChangelogRecordValidationOptions,
) {
  const result = validateChangelogRecordSources(sources, options);
  if (!result.ok) throw new ChangelogRecordValidationError(result.errors);
  return result.registry;
}

export function selectChangelogEntriesFromRegistry(
  registry: ChangelogRecordRegistry,
  capability?: ChronicleCapabilityId,
) {
  if (capability !== undefined && !isChronicleCapabilityId(capability)) {
    return deepFreeze([] as EffectiveChangelogEntry[]);
  }
  return deepFreeze(
    registry.effectiveEntries.filter(
      (entry) =>
        capability === undefined || entry.affectedCapabilities.includes(capability),
    ),
  );
}

export function isChangelogSourcePath(sourcePath: string) {
  return normalizeSourcePath(sourcePath).startsWith(
    "docs/architecture-knowledge/changelog/",
  );
}

export { CHANGELOG_DIRECTORY };
