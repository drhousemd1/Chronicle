import { parse as parseYaml } from "yaml";
import { z } from "zod";

import { APPROVED_CAPABILITY_IDS } from "./capability-ids";
import {
  isChangelogSourcePath,
  validateChangelogRecordSources,
  type AcceptedCloseoutChangelogRecord,
  type ChangelogRecord,
  type ChangelogRecordRegistry,
  type ChangelogRootRecord,
} from "./changelog-record-contract";
import {
  assertOperationalIssueOwner,
  assertOperationalProjectOwner,
  canonicalIssueSourcePath,
  canonicalCurrentWorkSourcePath,
  getOperationalCapability,
  isOperationalIssueId,
  isOperationalNestedId,
  isOperationalProjectId,
  parseOperationalProjectId,
  type OperationalCapabilityId,
} from "./operational-capability-registry";

export { APPROVED_CAPABILITY_IDS } from "./capability-ids";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const CHANGE_ID = /^CG-CHANGE-\d{3}$/;

export const ISSUE_STATES = ["open", "resolved"] as const;

export const PROJECT_WORKFLOW_STATES = [
  "Investigating",
  "Planned",
  "Implementing",
  "Validating",
  "Blocked",
  "Paused",
  "Deferred",
  "Closeout pending",
  "Closed",
  "Superseded",
  "Cancelled",
] as const;

export const WORK_STEP_STATES = [
  "Not started",
  "In progress",
  "Blocked",
  "Awaiting proof",
  "Concluded",
  "Superseded",
] as const;

export const PROOF_RESULTS = [
  "Not run",
  "Passed",
  "Failed",
  "Error",
  "Needs re-verification",
  "Not applicable",
] as const;

export const PROOF_CLASSES = [
  "Planning complete",
  "Implementation present",
  "Live wiring complete",
  "Enforcement complete",
  "Structural validation complete",
  "Integrated validation complete",
  "Human behavior review complete",
  "Product outcome complete",
  "Current-source inspection",
] as const;

export const COMPLETION_REVIEW_MODES = [
  "Direct user review",
  "Evidence-based verification",
] as const;

export const LOG_ENTRY_TYPES = [
  "Investigation",
  "Attempt",
  "Decision",
  "Validation",
  "Playthrough",
  "Correction",
  "Handoff",
  "External Work",
] as const;

const PROJECT_ORIGINS = [
  "verified_issue",
  "approved_enhancement",
  "maintenance",
  "audit_follow_up",
  "documentation_architecture",
] as const;

type IssueState = (typeof ISSUE_STATES)[number];
export type ProjectWorkflowState = (typeof PROJECT_WORKFLOW_STATES)[number];
type WorkStepState = (typeof WORK_STEP_STATES)[number];
type ProofResult = (typeof PROOF_RESULTS)[number];
type ProofClass = (typeof PROOF_CLASSES)[number];
type CompletionReviewMode = (typeof COMPLETION_REVIEW_MODES)[number];
type LogEntryType = (typeof LOG_ENTRY_TYPES)[number];
type ProjectOrigin = (typeof PROJECT_ORIGINS)[number];
export type CurrentWorkVersion = 1 | 2;
export const CURRENT_WORKFLOW_ROUTES = [
  "presentation",
  "local-interaction",
  "capability-workflow",
  "system-critical",
] as const;
export type CurrentWorkflowRoute = (typeof CURRENT_WORKFLOW_ROUTES)[number];

export type OperationalRecordSourceMap = Readonly<Record<string, string>>;

type ParsedFrontmatter = {
  data: unknown;
  rawHeader: string;
  body: string;
};

type MarkdownSection = {
  heading: string;
  content: string;
  raw: string;
};

export type IssueRecord = Readonly<{
  kind: "issue";
  id: string;
  title: string;
  ownerCapability: OperationalCapabilityId;
  status: IssueState;
  discoveredOn: string;
  lastVerifiedOn: string;
  sourcePath: string;
  content: IssueContent;
  body: string;
}>;

export type IssueContent = Readonly<{
  expectedBehavior: string;
  currentBehavior: string;
  whyThisIsAProblem: string;
  supportingEvidence: string;
  whatThisEvidenceEstablishes: string;
  whatRemainsUnverified: string;
  resolution: string | null;
}>;

export type WorkStep = Readonly<{
  id: string;
  verticalResult: string;
  state: WorkStepState;
  mustObserve: string;
  mustNotOccur: string;
  deliveryPathAndHumanReview: string;
  result: string;
  proofIds: readonly string[];
}>;

export type ProofClaim = Readonly<{
  id: string;
  title: string;
  evidenceClass: ProofClass;
  result: ProofResult;
  sourceState: string;
  applicabilityScope: string;
  humanReviewerAndDate: string;
  completionReviewMode: CompletionReviewMode | null;
  completionAuthorityAndDate: string;
  evidenceBasedCompletionApproval: string;
  notApplicableApproval: string;
  raw: string;
}>;

type StandardAttemptLogEntry = Readonly<{
  id: string;
  type: Exclude<LogEntryType, "Handoff">;
  date: string;
  raw: string;
  references: readonly string[];
  correctionApproval: string;
}>;

export type HandoffLogEntry = Readonly<{
  id: string;
  type: "Handoff";
  date: string;
  raw: string;
  references: readonly string[];
  correctionApproval: "";
  sender: string;
  recipient: string;
  transferredSourceState: string;
  completedWork: string;
  stoppingPoint: string;
  remainingAuthorizedWork: string;
  evidenceLimits: string;
  blockers: string;
  nextAction: string;
  readingOrder: string;
  scopeGuard: string;
}>;

export type AttemptLogEntry = StandardAttemptLogEntry | HandoffLogEntry;

export type CurrentWorkResumeHere = Readonly<{
  projectStatus: ProjectWorkflowState;
  statusSince: string;
  lastRecordedActivity: string;
  currentCoordinatorTask: string;
  resumePriority: "Primary" | "Secondary";
  latestCompletedResult: string;
  whereWorkStopped: string;
  remainingWork: string;
  nextAction: string;
  bestCurrentEvidence: string;
  notYetProvenOrNeedingRecheck: string;
  blockingCondition: string;
  unblockCondition: string;
  externalDecisionAction: string;
  statusReason: string;
  controllingHistoryEntry: string;
  sourceStateToRecheck: string;
  readFirst: string;
  scopeGuard: string;
}>;

export type CurrentWorkCoreSummary = Readonly<{
  purpose: string;
  objectiveAndScope: string;
  currentStatusAndCoordinator: string;
  latestVerifiedResult: string;
  exactNextAction: string;
  blockerOrDecision: string;
  strongestEvidenceAndLimits: string;
  sourceStateAndReadingOrder: string;
}>;

export type ProjectCloseout = Readonly<{
  terminalState: "Closed" | "Cancelled" | "Superseded";
  previousWorkflowState: string;
  decisionLogId: string;
  archivedOn: string;
  changelogIds: readonly string[];
  replacementProjectId: string | null;
  issueDispositions: Readonly<Record<string, "resolved" | "remaining">>;
}>;

export type CurrentWorkRecord = Readonly<{
  kind: "current_work";
  id: string;
  title: string;
  origin: ProjectOrigin;
  ownerCapability: OperationalCapabilityId;
  relatedCapabilities: readonly string[];
  linkedIssueIds: readonly string[];
  approvedObjectiveRef: string;
  started: string;
  sourcePath: string;
  placement: "active" | "archive";
  currentWorkVersion: CurrentWorkVersion;
  workflowRoute: CurrentWorkflowRoute | null;
  coreSummary: CurrentWorkCoreSummary | null;
  presentModules: readonly string[];
  resumeHere: CurrentWorkResumeHere;
  workflowState: ProjectWorkflowState;
  statusSince: string;
  lastActivity: string;
  activeCoordinator: string;
  primaryResumeTarget: boolean;
  blockerAndUnblockCondition: string;
  stateReasonAndControllingLogEntry: string;
  needsStatusReview: boolean;
  steps: readonly WorkStep[];
  proofs: readonly ProofClaim[];
  logs: readonly AttemptLogEntry[];
  closeout: ProjectCloseout | null;
  body: string;
  rawBeforeAttemptLog: string;
}>;

export type OperationalRecordRegistry = Readonly<{
  asOf: string;
  issues: readonly IssueRecord[];
  activeProjects: readonly CurrentWorkRecord[];
  archivedProjects: readonly CurrentWorkRecord[];
  changelogEntries: readonly ChangelogRecord[];
  changelogRegistry: ChangelogRecordRegistry;
  openIssueCount: number;
}>;

export type OperationalRecordValidationResult = Readonly<{
  ok: boolean;
  errors: readonly string[];
  registry: OperationalRecordRegistry;
}>;

export type OperationalRecordValidationOptions = Readonly<{
  asOf: string;
  baselineSources?: OperationalRecordSourceMap;
}>;

export class OperationalRecordValidationError extends Error {
  readonly errors: readonly string[];

  constructor(errors: readonly string[]) {
    super(`Operational record validation failed:\n${errors.join("\n")}`);
    this.name = "OperationalRecordValidationError";
    this.errors = errors;
  }
}

const dateSchema = z
  .string()
  .regex(ISO_DATE, "must use YYYY-MM-DD")
  .refine(isRealIsoDate, "must be a real calendar date");

const issueFrontmatterSchema = z
  .object({
    record_type: z.literal("issue"),
    issue_id: z
      .string()
      .refine(isOperationalIssueId, "must identify an approved operational Issue"),
    title: z.string().trim().min(1),
    owner_capability: z
      .string()
      .refine(
        (value) => getOperationalCapability(value) !== null,
        "must identify an approved operational capability",
      ),
    status: z.enum(ISSUE_STATES),
    discovered_on: dateSchema,
    last_verified_on: dateSchema,
    source_record: z.string().trim().min(1),
  })
  .strict()
  .superRefine((value, context) => {
    try {
      assertOperationalIssueOwner(value.issue_id, value.owner_capability);
    } catch (error) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["owner_capability"],
        message: error instanceof Error ? error.message : "does not match Issue identity",
      });
    }
  });

const currentWorkFrontmatterSchema = z
  .object({
    record_type: z.literal("current_work"),
    project_id: z
      .string()
      .refine(isOperationalProjectId, "must identify an approved operational project"),
    title: z.string().trim().min(1),
    origin: z.enum(PROJECT_ORIGINS),
    owner_capability: z
      .string()
      .refine(
        (value) => getOperationalCapability(value) !== null,
        "must identify an approved operational capability",
      ),
    related_capabilities: z.array(z.string().trim().min(1)),
    linked_issue_ids: z.array(
      z.string().refine(isOperationalIssueId, "must identify an approved operational Issue"),
    ),
    approved_objective_ref: z.string().trim().min(1),
    started: dateSchema,
    source_record: z.string().trim().min(1),
    current_work_version: z.union([z.literal(1), z.literal(2)]).optional().default(1),
    workflow_route: z.enum(CURRENT_WORKFLOW_ROUTES).optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.current_work_version === 2 && !value.workflow_route) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["workflow_route"],
        message: "is required for Current Work version 2",
      });
    }
    if (value.current_work_version === 1 && value.workflow_route) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["workflow_route"],
        message: "is only allowed for Current Work version 2",
      });
    }
  });

const issueRequiredHeadings = [
  "Expected Behavior",
  "Problem",
  "Evidence and Verification",
] as const;

const issueProblemRequiredHeadings = [
  "Current Behavior",
  "Why This Is a Problem",
] as const;

const issueEvidenceRequiredHeadings = [
  "Supporting Evidence",
  "What This Evidence Establishes",
  "What Remains Unverified",
] as const;

const legacyIssueRequiredHeadings = [
  "Required Behavior",
  "Current Observed Behavior",
  "User Impact",
  "Evidence",
  "Discovery and Last Verification",
] as const;

const projectRequiredHeadings = [
  "Current State / Resume Here",
  "Versioned Outcome and Success Contract",
  "Current Verified State",
  "Scope and Decisions",
  "Traceability Chain",
  "Work Steps",
  "Proof Claims",
  "Attempt and Decision Log",
] as const;

const versionTwoCoreFields = [
  "Purpose",
  "Objective and scope",
  "Current status and coordinator",
  "Latest verified result",
  "Exact next action",
  "Blocker or decision",
  "Strongest evidence and limits",
  "Source state and reading order",
] as const;

const versionTwoOptionalModules = [
  "Versioned Outcome and Success Contract",
  "Current Verified State",
  "Scope and Decisions",
  "Traceability Chain",
  "Work Steps",
  "Proof Claims",
  "Attempt and Decision Log",
  "Closeout",
] as const;

const currentStateRequiredFields = [
  "Project status",
  "Status since",
  "Last recorded activity",
  "Current coordinator/task",
  "Resume priority",
  "Latest completed result",
  "Where work stopped",
  "Remaining work",
  "Next action",
  "Best current evidence",
  "Not yet proven or needing re-check",
  "Blocking condition",
  "Unblock condition",
  "External decision/action",
  "Status reason",
  "Controlling history entry",
  "Source state to re-check",
  "Read first",
  "Scope guard",
] as const;

const currentStateRequiredGroups = [
  "Project and Status",
  "Resume Point",
  "Evidence and Uncertainty",
  "Ownership and Blockers",
  "Source and Reading Order",
] as const;

const currentStateFieldsByGroup = {
  "Project and Status": [
    "Project status",
    "Status since",
    "Last recorded activity",
    "Current coordinator/task",
    "Resume priority",
  ],
  "Resume Point": [
    "Latest completed result",
    "Where work stopped",
    "Remaining work",
    "Next action",
  ],
  "Evidence and Uncertainty": [
    "Best current evidence",
    "Not yet proven or needing re-check",
  ],
  "Ownership and Blockers": [
    "Blocking condition",
    "Unblock condition",
    "External decision/action",
    "Status reason",
    "Controlling history entry",
  ],
  "Source and Reading Order": [
    "Source state to re-check",
    "Read first",
    "Scope guard",
  ],
} as const;

const legacyCurrentStateRequiredFields = [
  "Workflow state",
  "Status since",
  "Last activity",
  "Active coordinator/task",
  "Primary resume target",
  "Source state",
  "Strongest established proof",
  "Unproved or needs re-verification",
  "Stopping point",
  "Exact next action",
  "Blocker and unblock condition",
  "State reason and controlling log entry",
  "External action required",
  "Inspect first",
] as const;

const contractRequiredFields = [
  "Contract version",
  "Approval source and date",
  "Implementation authorization",
  "Governing manual section",
  "User-visible outcome",
  "Must observe",
  "Must not occur",
  "Must not regress",
] as const;

const verifiedStateRequiredFields = [
  "Linked Issue facts",
  "Current implementation facts",
  "Direct observations",
  "Inferences",
  "Unknowns",
] as const;

const traceabilityRows = [
  "User-visible outcome",
  "Current behavior or approved change",
  "Runtime owner",
  "Enforcement point",
  "Persistence/state effect",
  "Modes/branches",
  "Delivery surface",
  "Must observe",
  "Must not occur",
  "Required deterministic proof",
  "Required integrated proof",
  "Required human proof",
] as const;

const proofRequiredFields = [
  "Evidence class or completion level",
  "Result",
  "Evidence link",
  "Repository/external source state",
  "Applicability scope",
  "Positive assertion",
  "Negative assertion",
  "Proves",
  "Does not prove",
  "Human reviewer/date",
] as const;

const logRequiredFields = [
  "Authoring task/authority",
  "Related Issue/Step/Evidence IDs",
  "Source state",
  "Action and rationale",
  "Affected systems",
  "Result",
  "Proves",
  "Does not prove",
  "Consequence/next action",
  "Supersedes/Amends/Reopens",
] as const;

const handoffRequiredFields = [
  "Sender",
  "Recipient",
  "Transferred source state",
  "Completed work",
  "Stopping point",
  "Remaining authorized work",
  "Evidence limits",
  "Blockers",
  "Next action",
  "Reading order",
  "Scope guard",
] as const;

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

function normalizeSourcePath(sourcePath: string) {
  return sourcePath.split("\\").join("/").replace(/^\.\//, "");
}

function parseFrontmatter(source: string): ParsedFrontmatter {
  const normalized = source.split("\r\n").join("\n");
  if (!normalized.startsWith("---\n")) {
    throw new Error("missing opening YAML frontmatter delimiter");
  }

  const closingIndex = normalized.indexOf("\n---\n", 4);
  if (closingIndex < 0) {
    throw new Error("missing closing YAML frontmatter delimiter");
  }

  const yamlSource = normalized.slice(4, closingIndex);
  const body = normalized.slice(closingIndex + 5).trim();
  return { data: parseYaml(yamlSource), rawHeader: yamlSource, body };
}

function getHeadingSections(source: string, level: 1 | 2 | 3) {
  const prefix = "#".repeat(level);
  const pattern = new RegExp(`^${prefix} ([^\\n]+)$`, "gm");
  const matches = Array.from(source.matchAll(pattern));

  return matches.map<MarkdownSection>((match, index) => {
    const start = match.index ?? 0;
    const contentStart = start + match[0].length;
    const end = matches[index + 1]?.index ?? source.length;
    return {
      heading: match[1].trim(),
      content: source.slice(contentStart, end).trim(),
      raw: source.slice(start, end).trimEnd(),
    };
  });
}

function getSection(
  sections: readonly MarkdownSection[],
  heading: string,
  sourcePath: string,
  errors: string[],
  level: 2 | 3 = 2,
) {
  const matches = sections.filter((section) => section.heading === heading);
  if (matches.length !== 1) {
    errors.push(
      `${sourcePath}: expected exactly one "${"#".repeat(level)} ${heading}" section, found ${matches.length}`,
    );
    return null;
  }
  if (!matches[0].content.trim()) {
    errors.push(`${sourcePath}: "${"#".repeat(level)} ${heading}" cannot be empty`);
  }
  return matches[0];
}

function assertOnlyNamedSections(
  sections: readonly MarkdownSection[],
  allowedHeadings: readonly string[],
  sourcePath: string,
  level: 2 | 3,
  context: string,
  errors: string[],
) {
  const allowed = new Set(allowedHeadings);
  for (const section of sections) {
    if (!allowed.has(section.heading)) {
      errors.push(
        `${sourcePath}: ${context} contains unexpected "${"#".repeat(level)} ${section.heading}" section`,
      );
    }
  }
}

function assertNoUnlabeledContentBeforeSubsections(
  source: string,
  level: 3,
  sourcePath: string,
  sectionName: string,
  errors: string[],
) {
  const firstHeading = source.search(new RegExp(`^${"#".repeat(level)} `, "m"));
  const leadingContent = (firstHeading < 0 ? source : source.slice(0, firstHeading)).trim();
  if (leadingContent) {
    errors.push(
      `${sourcePath}: "## ${sectionName}" must place all content under its named subsections`,
    );
  }
}

function parseBulletFields(
  source: string,
  sourcePath?: string,
  sectionName?: string,
  errors?: string[],
) {
  const fields = new Map<string, string>();
  for (const match of source.matchAll(/^- ([^:\n]+):[ \t]*(.*)$/gm)) {
    const label = match[1].trim();
    if (fields.has(label)) {
      errors?.push(
        `${sourcePath ?? "record"}: "${sectionName ?? "structured section"}" contains duplicate "${label}" field`,
      );
      continue;
    }
    fields.set(label, match[2].trim());
  }
  return fields;
}

function requireFields(
  fields: ReadonlyMap<string, string>,
  requiredFields: readonly string[],
  sourcePath: string,
  sectionName: string,
  errors: string[],
) {
  for (const field of requiredFields) {
    if (!fields.get(field)?.trim()) {
      errors.push(
        `${sourcePath}: "${sectionName}" requires a non-empty "${field}" field`,
      );
    }
  }
}

function assertOnlyNamedFields(
  fields: ReadonlyMap<string, string>,
  allowedFields: readonly string[],
  sourcePath: string,
  sectionName: string,
  errors: string[],
) {
  const allowed = new Set(allowedFields);
  for (const field of fields.keys()) {
    if (!allowed.has(field)) {
      errors.push(
        `${sourcePath}: "${sectionName}" contains unexpected "${field}" field`,
      );
    }
  }
}

function parseMarkdownTable(
  source: string,
  sourcePath?: string,
  tableName?: string,
  errors?: string[],
) {
  const rows = source
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|") && line.endsWith("|"))
    .map((line) => line.slice(1, -1).split("|").map((cell) => cell.trim()));

  if (rows.length < 2) return [];
  const headers = rows[0];
  const duplicateHeaders = headers.filter(
    (header, index) => headers.indexOf(header) !== index,
  );
  if (duplicateHeaders.length > 0) {
    errors?.push(
      `${sourcePath ?? "record"}: "${tableName ?? "structured table"}" contains duplicate column label${duplicateHeaders.length === 1 ? "" : "s"}: ${[...new Set(duplicateHeaders)].join(", ")}`,
    );
  }
  const dataRows = rows.slice(1).filter(
    (row) => !row.every((cell) => /^:?-{3,}:?$/.test(cell)),
  );

  return dataRows.map((row) => {
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      if (!Object.prototype.hasOwnProperty.call(record, header)) {
        record[header] = row[index] ?? "";
      }
    });
    return record;
  });
}

function parseReferenceList(value: string) {
  if (!value || /^(none|n\/a|\[\])[.!]?$/i.test(value.trim())) return [];
  return value
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function daysBetween(earlier: string, later: string) {
  const earlierTime = Date.parse(`${earlier}T00:00:00Z`);
  const laterTime = Date.parse(`${later}T00:00:00Z`);
  return Math.floor((laterTime - earlierTime) / 86_400_000);
}

function formatZodErrors(error: z.ZodError) {
  return error.issues.map((issue) => {
    const field = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
    return `${field}${issue.message}`;
  });
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value as Record<string, unknown>).forEach((child) => {
      deepFreeze(child);
    });
  }
  return value;
}

function assertRecordHeading(
  body: string,
  expected: string,
  sourcePath: string,
  errors: string[],
) {
  const h1Sections = getHeadingSections(body, 1);
  if (h1Sections.length !== 1 || h1Sections[0].heading !== expected) {
    errors.push(
      `${sourcePath}: expected exactly one top-level heading "# ${expected}"`,
    );
  }
}

function assertRequiredHeadings(
  body: string,
  requiredHeadings: readonly string[],
  sourcePath: string,
  errors: string[],
) {
  const h2Sections = getHeadingSections(body, 2);
  for (const heading of requiredHeadings) {
    getSection(h2Sections, heading, sourcePath, errors);
  }
  return h2Sections;
}

function parseLegacyIssueContent(
  body: string,
  status: IssueState,
): IssueContent | null {
  const sections = getHeadingSections(body, 2);
  const requiredHeadings = [
    ...legacyIssueRequiredHeadings,
    ...(status === "resolved" ? (["Resolution"] as const) : []),
  ];
  if (
    sections.length !== requiredHeadings.length ||
    requiredHeadings.some(
      (heading) =>
        sections.filter((section) => section.heading === heading).length !== 1,
    )
  ) {
    return null;
  }
  const byHeading = new Map(sections.map((section) => [section.heading, section.content]));
  return deepFreeze({
    expectedBehavior: byHeading.get("Required Behavior") ?? "",
    currentBehavior: byHeading.get("Current Observed Behavior") ?? "",
    whyThisIsAProblem: byHeading.get("User Impact") ?? "",
    supportingEvidence: byHeading.get("Evidence") ?? "",
    whatThisEvidenceEstablishes: byHeading.get("Evidence") ?? "",
    whatRemainsUnverified: byHeading.get("Discovery and Last Verification") ?? "",
    resolution: status === "resolved" ? (byHeading.get("Resolution") ?? "") : null,
  });
}

function parseStructuredIssueContent(
  body: string,
  status: IssueState,
  sourcePath: string,
  errors: string[],
): IssueContent {
  const topLevelSections = getHeadingSections(body, 2);
  const topLevelHeadings = [
    ...issueRequiredHeadings,
    ...(status === "resolved" ? (["Resolution"] as const) : []),
  ];
  for (const heading of topLevelHeadings) {
    getSection(topLevelSections, heading, sourcePath, errors);
  }
  assertOnlyNamedSections(
    topLevelSections,
    topLevelHeadings,
    sourcePath,
    2,
    "Issue body",
    errors,
  );

  const expectedBehaviorSection = topLevelSections.find(
    (section) => section.heading === "Expected Behavior",
  );
  const problemSection = topLevelSections.find(
    (section) => section.heading === "Problem",
  );
  const evidenceSection = topLevelSections.find(
    (section) => section.heading === "Evidence and Verification",
  );
  const resolutionSection = topLevelSections.find(
    (section) => section.heading === "Resolution",
  );

  if (expectedBehaviorSection) {
    const unexpected = getHeadingSections(expectedBehaviorSection.content, 3);
    if (unexpected.length > 0) {
      errors.push(
        `${sourcePath}: "## Expected Behavior" cannot contain third-level subsections`,
      );
    }
  }
  if (resolutionSection) {
    const unexpected = getHeadingSections(resolutionSection.content, 3);
    if (unexpected.length > 0) {
      errors.push(
        `${sourcePath}: "## Resolution" cannot contain third-level subsections`,
      );
    }
  }

  const problemSubsections = problemSection
    ? getHeadingSections(problemSection.content, 3)
    : [];
  if (problemSection) {
    assertNoUnlabeledContentBeforeSubsections(
      problemSection.content,
      3,
      sourcePath,
      "Problem",
      errors,
    );
  }
  for (const heading of issueProblemRequiredHeadings) {
    getSection(problemSubsections, heading, sourcePath, errors, 3);
  }
  assertOnlyNamedSections(
    problemSubsections,
    issueProblemRequiredHeadings,
    sourcePath,
    3,
    '"## Problem"',
    errors,
  );

  const evidenceSubsections = evidenceSection
    ? getHeadingSections(evidenceSection.content, 3)
    : [];
  if (evidenceSection) {
    assertNoUnlabeledContentBeforeSubsections(
      evidenceSection.content,
      3,
      sourcePath,
      "Evidence and Verification",
      errors,
    );
  }
  for (const heading of issueEvidenceRequiredHeadings) {
    getSection(evidenceSubsections, heading, sourcePath, errors, 3);
  }
  assertOnlyNamedSections(
    evidenceSubsections,
    issueEvidenceRequiredHeadings,
    sourcePath,
    3,
    '"## Evidence and Verification"',
    errors,
  );

  const problemByHeading = new Map(
    problemSubsections.map((section) => [section.heading, section.content]),
  );
  const evidenceByHeading = new Map(
    evidenceSubsections.map((section) => [section.heading, section.content]),
  );
  return deepFreeze({
    expectedBehavior: expectedBehaviorSection?.content ?? "",
    currentBehavior: problemByHeading.get("Current Behavior") ?? "",
    whyThisIsAProblem: problemByHeading.get("Why This Is a Problem") ?? "",
    supportingEvidence: evidenceByHeading.get("Supporting Evidence") ?? "",
    whatThisEvidenceEstablishes:
      evidenceByHeading.get("What This Evidence Establishes") ?? "",
    whatRemainsUnverified:
      evidenceByHeading.get("What Remains Unverified") ?? "",
    resolution: status === "resolved" ? (resolutionSection?.content ?? "") : null,
  });
}

function parseIssueRecord(
  sourcePath: string,
  frontmatter: ParsedFrontmatter,
  asOf: string,
  errors: string[],
  allowLegacyBody = false,
): IssueRecord | null {
  const parsed = issueFrontmatterSchema.safeParse(frontmatter.data);
  if (!parsed.success) {
    formatZodErrors(parsed.error).forEach((error) =>
      errors.push(`${sourcePath}: ${error}`),
    );
    return null;
  }

  const metadata = parsed.data;
  const filenameIssueId = sourcePath.match(/\/([^/]+)\.md$/)?.[1];
  if (filenameIssueId && filenameIssueId !== metadata.issue_id) {
    errors.push(
      `${sourcePath}: filename ID ${filenameIssueId} does not match issue_id ${metadata.issue_id}`,
    );
  }
  const expectedSourcePath = canonicalIssueSourcePath(metadata.issue_id);
  if (sourcePath !== expectedSourcePath) {
    errors.push(
      `${sourcePath}: Issue ${metadata.issue_id} must use canonical path ${expectedSourcePath}`,
    );
  }
  if (metadata.source_record !== sourcePath) {
    errors.push(
      `${sourcePath}: source_record must exactly match the canonical source path`,
    );
  }

  assertRecordHeading(
    frontmatter.body,
    `${metadata.issue_id}: ${metadata.title}`,
    sourcePath,
    errors,
  );
  const legacyContent = allowLegacyBody
    ? parseLegacyIssueContent(frontmatter.body, metadata.status)
    : null;
  const content =
    legacyContent ??
    parseStructuredIssueContent(
      frontmatter.body,
      metadata.status,
      sourcePath,
      errors,
    );
  if (metadata.last_verified_on < metadata.discovered_on) {
    errors.push(`${sourcePath}: last_verified_on cannot be before discovered_on`);
  }
  if (metadata.discovered_on > asOf) {
    errors.push(
      `${sourcePath}: discovered_on ${metadata.discovered_on} cannot be after validation date ${asOf}`,
    );
  }
  if (metadata.last_verified_on > asOf) {
    errors.push(
      `${sourcePath}: last_verified_on ${metadata.last_verified_on} cannot be after validation date ${asOf}`,
    );
  }

  return deepFreeze({
    kind: "issue",
    id: metadata.issue_id,
    title: metadata.title,
    ownerCapability: metadata.owner_capability as OperationalCapabilityId,
    status: metadata.status,
    discoveredOn: metadata.discovered_on,
    lastVerifiedOn: metadata.last_verified_on,
    sourcePath,
    content,
    body: frontmatter.body,
  });
}

function parseProjectSteps(
  section: MarkdownSection | null,
  projectId: string,
  sourcePath: string,
  errors: string[],
) {
  if (!section) return [];
  const rows = parseMarkdownTable(
    section.content,
    sourcePath,
    "Work Steps",
    errors,
  );
  const steps: WorkStep[] = [];

  for (const row of rows) {
    const id = row["Step ID"] ?? "";
    const verticalResult = row["Vertical result"] ?? "";
    const state = row["Step state"] ?? "";
    const mustObserve = row["Must observe"] ?? "";
    const mustNotOccur = row["Must not occur"] ?? "";
    const deliveryPathAndHumanReview =
      row["Delivery path / human review"] ?? "";
    const result = row.Result ?? "";
    const proofIds = parseReferenceList(row["Proof IDs"] ?? "");

    if (!isOperationalNestedId(projectId, "STEP", id)) {
      errors.push(`${sourcePath}: Work Steps contains invalid Step ID "${id}"`);
      continue;
    }
    if (!WORK_STEP_STATES.includes(state as WorkStepState)) {
      errors.push(`${sourcePath}: ${id} uses unsupported Work Step state "${state}"`);
      continue;
    }
    for (const [label, value] of [
      ["Vertical result", verticalResult],
      ["Must observe", mustObserve],
      ["Must not occur", mustNotOccur],
      ["Delivery path / human review", deliveryPathAndHumanReview],
      ["Result", result],
    ] as const) {
      if (!isMeaningful(value)) {
        errors.push(`${sourcePath}: ${id} requires a meaningful ${label}`);
      }
    }
    if (
      ["Awaiting proof", "Concluded"].includes(state) &&
      proofIds.length === 0
    ) {
      errors.push(
        `${sourcePath}: ${id} requires at least one Proof ID when ${state}`,
      );
    }
    for (const proofId of proofIds) {
      if (!isOperationalNestedId(projectId, "EV", proofId)) {
        errors.push(`${sourcePath}: ${id} references invalid Evidence ID ${proofId}`);
      }
    }

    steps.push(
      deepFreeze({
        id,
        verticalResult,
        state: state as WorkStepState,
        mustObserve,
        mustNotOccur,
        deliveryPathAndHumanReview,
        result,
        proofIds,
      }),
    );
  }

  const inProgressCount = steps.filter((step) => step.state === "In progress").length;
  if (inProgressCount > 1) {
    errors.push(
      `${sourcePath}: at most one Work Step may be In progress; found ${inProgressCount}`,
    );
  }

  return steps;
}

function parseProjectProofs(
  section: MarkdownSection | null,
  projectId: string,
  sourcePath: string,
  asOf: string,
  errors: string[],
) {
  if (!section) return [];
  const proofSections = getHeadingSections(section.content, 3);
  const proofs: ProofClaim[] = [];
  const recordPrefix = parseOperationalProjectId(projectId).capability.recordPrefix;

  for (const proofSection of proofSections) {
    const headingMatch = proofSection.heading.match(
      new RegExp(`^(${recordPrefix}-EV-\\d{3}):\\s+(.+)$`),
    );
    if (!headingMatch) {
      errors.push(
        `${sourcePath}: invalid Proof Claim heading "### ${proofSection.heading}"`,
      );
      continue;
    }
    const fields = parseBulletFields(
      proofSection.content,
      sourcePath,
      proofSection.heading,
      errors,
    );
    requireFields(fields, proofRequiredFields, sourcePath, proofSection.heading, errors);
    const evidenceClass = fields.get("Evidence class or completion level") ?? "";
    if (!PROOF_CLASSES.includes(evidenceClass as ProofClass)) {
      errors.push(
        `${sourcePath}: ${headingMatch[1]} uses unsupported evidence class "${evidenceClass}"`,
      );
    }
    const result = fields.get("Result") ?? "";
    if (!PROOF_RESULTS.includes(result as ProofResult)) {
      errors.push(
        `${sourcePath}: ${headingMatch[1]} uses unsupported proof result "${result}"`,
      );
      continue;
    }
    const notApplicableApproval =
      fields.get("Not-applicable rationale/approval") ?? "";
    if (
      result === "Not applicable" &&
      !hasApprovedNotApplicableRationale(notApplicableApproval)
    ) {
      errors.push(
        `${sourcePath}: ${headingMatch[1]} requires Not-applicable rationale/approval`,
      );
    }
    const humanReviewerAndDate = fields.get("Human reviewer/date") ?? "";
    const completionReviewModeValue = fields.get("Completion review mode") ?? "";
    const completionReviewMode = COMPLETION_REVIEW_MODES.includes(
      completionReviewModeValue as CompletionReviewMode,
    )
      ? (completionReviewModeValue as CompletionReviewMode)
      : null;
    const completionAuthorityAndDate =
      fields.get("Completion authority/date") ?? "";
    const evidenceBasedCompletionApproval =
      fields.get("Evidence-based completion approval") ?? "";
    if (completionReviewModeValue && !completionReviewMode) {
      errors.push(
        `${sourcePath}: ${headingMatch[1]} uses unsupported Completion review mode "${completionReviewModeValue}"`,
      );
    }
    if (
      evidenceClass === "Human behavior review complete" &&
      result === "Passed"
    ) {
      const { reviewer, date: humanReviewDate } =
        parseHumanReviewerAndDate(humanReviewerAndDate);
      if (completionReviewMode === "Evidence-based verification") {
        errors.push(
          `${sourcePath}: ${headingMatch[1]} Human behavior review complete cannot use Evidence-based verification`,
        );
      }
      if (
        !isMeaningfulAuthority(reviewer) ||
        !humanReviewDate ||
        !isRealIsoDate(humanReviewDate)
      ) {
        errors.push(
          `${sourcePath}: ${headingMatch[1]} Passed ${evidenceClass} proof requires a meaningful Human reviewer and valid YYYY-MM-DD review date`,
        );
      } else if (humanReviewDate > asOf) {
        errors.push(
          `${sourcePath}: ${headingMatch[1]} Human reviewer date ${humanReviewDate} cannot be after validation date ${asOf}`,
        );
      }
    }
    if (evidenceClass === "Product outcome complete" && result === "Passed") {
      const usesEvidenceBasedCompletion =
        completionReviewMode === "Evidence-based verification";
      const authorityAndDate = usesEvidenceBasedCompletion
        ? completionAuthorityAndDate
        : humanReviewerAndDate;
      const { reviewer: completionAuthority, date: completionDate } =
        parseHumanReviewerAndDate(authorityAndDate);

      if (
        !isMeaningfulAuthority(completionAuthority) ||
        !completionDate ||
        !isRealIsoDate(completionDate)
      ) {
        errors.push(
          `${sourcePath}: ${headingMatch[1]} Passed Product outcome complete proof requires a meaningful completion authority and valid YYYY-MM-DD completion date`,
        );
      } else if (completionDate > asOf) {
        errors.push(
          `${sourcePath}: ${headingMatch[1]} Completion date ${completionDate} cannot be after validation date ${asOf}`,
        );
      }

      if (
        usesEvidenceBasedCompletion &&
        !hasAffirmativeApproval(evidenceBasedCompletionApproval)
      ) {
        errors.push(
          `${sourcePath}: ${headingMatch[1]} Evidence-based verification requires explicit evidence-based completion approval`,
        );
      }
    }

    proofs.push(
      deepFreeze({
        id: headingMatch[1],
        title: headingMatch[2],
        evidenceClass: PROOF_CLASSES.includes(evidenceClass as ProofClass)
          ? (evidenceClass as ProofClass)
          : "Current-source inspection",
        result: result as ProofResult,
        sourceState: fields.get("Repository/external source state") ?? "",
        applicabilityScope: fields.get("Applicability scope") ?? "",
        humanReviewerAndDate,
        completionReviewMode,
        completionAuthorityAndDate,
        evidenceBasedCompletionApproval,
        notApplicableApproval,
        raw: proofSection.raw,
      }),
    );
  }

  return proofs;
}

function parseProjectLogs(
  section: MarkdownSection | null,
  projectId: string,
  sourcePath: string,
  errors: string[],
) {
  if (!section) return [];
  const logSections = getHeadingSections(section.content, 3);
  const logs: AttemptLogEntry[] = [];
  const recordPrefix = parseOperationalProjectId(projectId).capability.recordPrefix;
  const headingPattern = new RegExp(
    `^(${recordPrefix}-LOG-\\d{3}) — (${LOG_ENTRY_TYPES.join("|")}) — (\\d{4}-\\d{2}-\\d{2})(?:T[^\\s]+)?$`,
  );

  for (const logSection of logSections) {
    const match = logSection.heading.match(headingPattern);
    if (!match) {
      errors.push(
        `${sourcePath}: invalid Attempt and Decision Log heading "### ${logSection.heading}"`,
      );
      continue;
    }
    if (!isRealIsoDate(match[3])) {
      errors.push(`${sourcePath}: ${match[1]} uses an invalid log date ${match[3]}`);
    }
    const fields = parseBulletFields(
      logSection.content,
      sourcePath,
      logSection.heading,
      errors,
    );
    const logType = match[2] as LogEntryType;
    if (logType === "Handoff") {
      requireFields(
        fields,
        handoffRequiredFields,
        sourcePath,
        logSection.heading,
        errors,
      );
      assertOnlyNamedFields(
        fields,
        handoffRequiredFields,
        sourcePath,
        logSection.heading,
        errors,
      );
      const sender = fields.get("Sender") ?? "";
      const recipient = fields.get("Recipient") ?? "";
      if (!isMeaningfulAuthority(sender)) {
        errors.push(`${sourcePath}: Handoff ${match[1]} requires a named Sender`);
      }
      if (!isMeaningfulAuthority(recipient)) {
        errors.push(`${sourcePath}: Handoff ${match[1]} requires a named Recipient`);
      }
      if (sender.trim() === recipient.trim()) {
        errors.push(
          `${sourcePath}: Handoff ${match[1]} Sender and Recipient must be different`,
        );
      }
      logs.push(
        deepFreeze({
          id: match[1],
          type: "Handoff" as const,
          date: match[3],
          raw: logSection.raw,
          references: [],
          correctionApproval: "" as const,
          sender,
          recipient,
          transferredSourceState:
            fields.get("Transferred source state") ?? "",
          completedWork: fields.get("Completed work") ?? "",
          stoppingPoint: fields.get("Stopping point") ?? "",
          remainingAuthorizedWork:
            fields.get("Remaining authorized work") ?? "",
          evidenceLimits: fields.get("Evidence limits") ?? "",
          blockers: fields.get("Blockers") ?? "",
          nextAction: fields.get("Next action") ?? "",
          readingOrder: fields.get("Reading order") ?? "",
          scopeGuard: fields.get("Scope guard") ?? "",
        }),
      );
      continue;
    }

    requireFields(fields, logRequiredFields, sourcePath, logSection.heading, errors);
    const references = parseReferenceList(
      fields.get("Supersedes/Amends/Reopens") ?? "",
    );
    const correctionApproval = fields.get("Correction approval") ?? "";
    if (match[2] === "Correction") {
      if (references.length === 0) {
        errors.push(`${sourcePath}: Correction ${match[1]} must name what it amends`);
      }
      if (!hasAffirmativeApproval(correctionApproval)) {
        errors.push(
          `${sourcePath}: Correction ${match[1]} requires meaningful Correction approval`,
        );
      }
    }
    references.forEach((reference) => {
      if (!isOperationalNestedId(projectId, "LOG", reference)) {
        errors.push(`${sourcePath}: ${match[1]} has invalid history reference ${reference}`);
      }
    });

    logs.push(
      deepFreeze({
        id: match[1],
        type: logType,
        date: match[3],
        raw: logSection.raw,
        references,
        correctionApproval,
      }),
    );
  }

  return logs;
}

function parseProjectCloseout(
  section: MarkdownSection | null,
  projectId: string,
  workflowState: ProjectWorkflowState,
  sourcePath: string,
  asOf: string,
  errors: string[],
): ProjectCloseout | null {
  if (!section) return null;
  const fields = parseBulletFields(section.content, sourcePath, "Closeout", errors);
  const required = [
    "Terminal state",
    "Previous workflow state",
    "Closeout decision log",
    "Archived on",
    "Changelog IDs",
    "Replacement project",
  ];
  requireFields(fields, required, sourcePath, "Closeout", errors);

  const terminalState = fields.get("Terminal state") ?? "";
  const previousWorkflowState = fields.get("Previous workflow state") ?? "";
  const decisionLogId = fields.get("Closeout decision log") ?? "";
  const archivedOn = fields.get("Archived on") ?? "";
  const changelogIds = parseReferenceList(fields.get("Changelog IDs") ?? "");
  const replacementValue = fields.get("Replacement project") ?? "";
  const replacementProjectId = /^(none|n\/a)$/i.test(replacementValue)
    ? null
    : replacementValue;

  if (!["Closed", "Cancelled", "Superseded"].includes(terminalState)) {
    errors.push(`${sourcePath}: unsupported Closeout terminal state ${terminalState}`);
    return null;
  }
  if (terminalState !== workflowState) {
    errors.push(
      `${sourcePath}: Closeout terminal state ${terminalState} does not match workflow state ${workflowState}`,
    );
  }
  if (!isOperationalNestedId(projectId, "LOG", decisionLogId)) {
    errors.push(`${sourcePath}: Closeout decision log must match the project prefix`);
  }
  if (!isRealIsoDate(archivedOn)) {
    errors.push(`${sourcePath}: Closeout archived date must use YYYY-MM-DD`);
  } else if (archivedOn > asOf) {
    errors.push(
      `${sourcePath}: Closeout archived date ${archivedOn} cannot be after validation date ${asOf}`,
    );
  }
  changelogIds.forEach((id) => {
    if (!CHANGE_ID.test(id)) {
      errors.push(`${sourcePath}: invalid Closeout Changelog ID ${id}`);
    }
  });
  if (terminalState === "Closed" && previousWorkflowState !== "Closeout pending") {
    errors.push(`${sourcePath}: Closed is reachable only through Closeout pending`);
  }
  if (terminalState === "Closed" && changelogIds.length === 0) {
    errors.push(`${sourcePath}: Closed archive requires at least one Changelog ID`);
  }
  if (
    terminalState === "Superseded" &&
    (!replacementProjectId || !isOperationalProjectId(replacementProjectId))
  ) {
    errors.push(`${sourcePath}: Superseded archive requires a replacement project`);
  }

  const dispositionSection = getHeadingSections(section.content, 3).find(
    (candidate) => candidate.heading === "Linked Issue Disposition",
  );
  if (!dispositionSection) {
    errors.push(`${sourcePath}: Closeout requires "### Linked Issue Disposition"`);
  }
  const issueDispositions: Record<string, "resolved" | "remaining"> = {};
  for (const row of parseMarkdownTable(
    dispositionSection?.content ?? "",
    sourcePath,
    "Closeout Linked Issue Disposition",
    errors,
  )) {
    const issueId = row["Issue ID"] ?? "";
    const disposition = (row.Disposition ?? "").toLowerCase();
    if (!isOperationalIssueId(issueId)) {
      errors.push(`${sourcePath}: invalid Closeout Issue ID ${issueId}`);
      continue;
    }
    if (disposition !== "resolved" && disposition !== "remaining") {
      errors.push(`${sourcePath}: ${issueId} has invalid Closeout disposition ${disposition}`);
      continue;
    }
    if (Object.prototype.hasOwnProperty.call(issueDispositions, issueId)) {
      errors.push(`${sourcePath}: Closeout contains duplicate Issue disposition ${issueId}`);
      continue;
    }
    issueDispositions[issueId] = disposition;
  }

  return deepFreeze({
    terminalState: terminalState as ProjectCloseout["terminalState"],
    previousWorkflowState,
    decisionLogId,
    archivedOn,
    changelogIds,
    replacementProjectId,
    issueDispositions,
  });
}

function isMeaningful(value: string) {
  return (
    Boolean(value.trim()) &&
    !/^(none|n\/a|unknown|not applicable)[.!]?$/i.test(value.trim())
  );
}

function isMeaningfulAuthority(value: string) {
  return (
    isMeaningful(value) &&
    !/^(?:no\s+one|nobody|not\b|without\b)/i.test(value.trim()) &&
    !/\b(?:none|n\/a|unknown|pending|awaiting|unassigned|tbd|to be determined|not\s+(?:yet\s+)?assessed|not applicable)\b/i.test(
      value,
    )
  );
}

function parseHumanReviewerAndDate(value: string) {
  const dates = value.match(/\d{4}-\d{2}-\d{2}/g) ?? [];
  const date = dates.length === 1 ? dates[0] : "";
  const reviewer = date
    ? value.replace(date, "").replace(/[,;:()\s-]+$/g, "").trim()
    : "";
  return { reviewer, date };
}

function hasAffirmativeApproval(value: string) {
  const namedAuthority =
    value.match(/\b(?:by|under)\s+(?:the\s+)?(.+)$/i)?.[1] ?? "";
  const hasNegativeApprovalLanguage =
    /\b(denied|declined|rejected|refused|revoked|withheld|disapproved|unapproved|unauthorized|pending|awaiting)\b/i.test(
      value,
    ) ||
    /\bnot\s+by\b|\bby\s+(?:no\s+one|nobody)\b/i.test(value) ||
    /\b(?:no|not|never|without)\b(?:\W+\w+){0,4}\W+\b(?:approval|approved|authorization|authorized|granted)\b/i.test(
      value,
    ) ||
    /\b(?:approval|authorization)\b(?:\W+\w+){0,4}\W+\bnot\s+granted\b/i.test(
      value,
    );
  return (
    isMeaningful(value) &&
    /\b(approv(?:e|ed|al)|authoriz(?:e|ed|ation))\b/i.test(value) &&
    !hasNegativeApprovalLanguage &&
    isMeaningfulAuthority(namedAuthority)
  );
}

function hasApprovedNotApplicableRationale(value: string) {
  return (
    hasAffirmativeApproval(value) &&
    /\bnot applicable\b/i.test(value) &&
    /\b(because|since|due to|outside|does not apply|not required)\b/i.test(value)
  );
}

function hasExplicitImplementationAuthorization(value: string) {
  const date = value.match(/\d{4}-\d{2}-\d{2}/)?.[0];
  return (
    hasAffirmativeApproval(value) &&
    Boolean(date && isRealIsoDate(date)) &&
    !/\b(pending|awaiting)\b/i.test(value)
  );
}

function parseLegacyCurrentStateFields(
  section: MarkdownSection,
  projectId: string,
): ReadonlyMap<string, string> | null {
  const fields = parseBulletFields(section.content);
  if (
    fields.size !== legacyCurrentStateRequiredFields.length ||
    legacyCurrentStateRequiredFields.some((field) => !fields.get(field)?.trim())
  ) {
    return null;
  }
  const blockerAndUnblock = fields.get("Blocker and unblock condition") ?? "";
  const stateReasonAndLog =
    fields.get("State reason and controlling log entry") ?? "";
  const recordPrefix = parseOperationalProjectId(projectId).capability.recordPrefix;
  const controllingHistoryEntry =
    stateReasonAndLog.match(new RegExp(`${recordPrefix}-LOG-\\d{3}`))?.[0] ??
    stateReasonAndLog;
  return new Map<string, string>([
    ["Project status", fields.get("Workflow state") ?? ""],
    ["Status since", fields.get("Status since") ?? ""],
    ["Last recorded activity", fields.get("Last activity") ?? ""],
    ["Current coordinator/task", fields.get("Active coordinator/task") ?? ""],
    [
      "Resume priority",
      fields.get("Primary resume target") === "Yes" ? "Primary" : "Secondary",
    ],
    [
      "Latest completed result",
      fields.get("Strongest established proof") ?? "",
    ],
    ["Where work stopped", fields.get("Stopping point") ?? ""],
    ["Remaining work", fields.get("Exact next action") ?? ""],
    ["Next action", fields.get("Exact next action") ?? ""],
    ["Best current evidence", fields.get("Strongest established proof") ?? ""],
    [
      "Not yet proven or needing re-check",
      fields.get("Unproved or needs re-verification") ?? "",
    ],
    ["Blocking condition", blockerAndUnblock],
    ["Unblock condition", blockerAndUnblock],
    ["External decision/action", fields.get("External action required") ?? ""],
    ["Status reason", stateReasonAndLog],
    ["Controlling history entry", controllingHistoryEntry],
    ["Source state to re-check", fields.get("Source state") ?? ""],
    ["Read first", fields.get("Inspect first") ?? ""],
    [
      "Scope guard",
      "Legacy Resume Here structure accepted only as a protected-write baseline.",
    ],
  ]);
}

function parseStructuredCurrentStateFields(
  section: MarkdownSection,
  sourcePath: string,
  errors: string[],
) {
  const groupSections = getHeadingSections(section.content, 3);
  assertNoUnlabeledContentBeforeSubsections(
    section.content,
    3,
    sourcePath,
    "Current State / Resume Here",
    errors,
  );
  for (const group of currentStateRequiredGroups) {
    getSection(groupSections, group, sourcePath, errors, 3);
  }
  assertOnlyNamedSections(
    groupSections,
    currentStateRequiredGroups,
    sourcePath,
    3,
    '"## Current State / Resume Here"',
    errors,
  );

  const allFields = new Map<string, string>();
  for (const group of currentStateRequiredGroups) {
    const groupSection = groupSections.find((section) => section.heading === group);
    const requiredFields = currentStateFieldsByGroup[group];
    const groupFields = parseBulletFields(
      groupSection?.content ?? "",
      sourcePath,
      group,
      errors,
    );
    requireFields(groupFields, requiredFields, sourcePath, group, errors);
    assertOnlyNamedFields(groupFields, requiredFields, sourcePath, group, errors);
    for (const [field, value] of groupFields) {
      if (allFields.has(field)) {
        errors.push(
          `${sourcePath}: Current State / Resume Here repeats "${field}" across groups`,
        );
      } else {
        allFields.set(field, value);
      }
    }
  }
  requireFields(
    allFields,
    currentStateRequiredFields,
    sourcePath,
    "Current State / Resume Here",
    errors,
  );
  return allFields;
}

function parseVersionTwoCurrentWorkRecord({
  sourcePath,
  frontmatter,
  metadata,
  placement,
  asOf,
  errors,
}: {
  sourcePath: string;
  frontmatter: ParsedFrontmatter;
  metadata: z.infer<typeof currentWorkFrontmatterSchema>;
  placement: "active" | "archive";
  asOf: string;
  errors: string[];
}): CurrentWorkRecord {
  const sections = getHeadingSections(frontmatter.body, 2).filter(
    (section) => section.heading !== `${metadata.project_id}: ${metadata.title}`,
  );
  if (sections[0]?.heading !== "Current State / Resume Here") {
    errors.push(`${sourcePath}: Current State / Resume Here must be the first substantive section`);
  }
  assertOnlyNamedSections(
    sections,
    ["Current State / Resume Here", ...versionTwoOptionalModules],
    sourcePath,
    2,
    "Current Work version 2",
    errors,
  );
  const summarySection = getSection(
    sections,
    "Current State / Resume Here",
    sourcePath,
    errors,
  );
  const fields = parseBulletFields(
    summarySection?.content ?? "",
    sourcePath,
    "Current State / Resume Here",
    errors,
  );
  requireFields(fields, versionTwoCoreFields, sourcePath, "Current State / Resume Here", errors);
  assertOnlyNamedFields(fields, versionTwoCoreFields, sourcePath, "Current State / Resume Here", errors);

  const summary = deepFreeze({
    purpose: fields.get("Purpose") ?? "",
    objectiveAndScope: fields.get("Objective and scope") ?? "",
    currentStatusAndCoordinator: fields.get("Current status and coordinator") ?? "",
    latestVerifiedResult: fields.get("Latest verified result") ?? "",
    exactNextAction: fields.get("Exact next action") ?? "",
    blockerOrDecision: fields.get("Blocker or decision") ?? "",
    strongestEvidenceAndLimits: fields.get("Strongest evidence and limits") ?? "",
    sourceStateAndReadingOrder: fields.get("Source state and reading order") ?? "",
  });
  for (const [field, value] of Object.entries(summary)) {
    if (!isMeaningful(value) && !(field === "blockerOrDecision" && /^none\b/i.test(value.trim()))) {
      errors.push(`${sourcePath}: Current Work version 2 ${field} must be explicit and resumable`);
    }
  }
  if (!/\bauthorized\s*:/i.test(summary.objectiveAndScope) || !/\boutside\s*:/i.test(summary.objectiveAndScope)) {
    errors.push(`${sourcePath}: Objective and scope must state both "Authorized:" and "Outside:" boundaries`);
  }

  const stateMatch = summary.currentStatusAndCoordinator.match(
    /^(Investigating|Planned|Implementing|Validating|Blocked|Paused|Deferred|Closeout pending|Closed|Cancelled|Superseded) since (\d{4}-\d{2}-\d{2}); last activity (\d{4}-\d{2}-\d{2}); coordinator (.+); resume priority (Primary|Secondary)\.?$/,
  );
  if (!stateMatch) {
    errors.push(
      `${sourcePath}: Current status and coordinator must use "STATE since YYYY-MM-DD; last activity YYYY-MM-DD; coordinator NAME; resume priority Primary|Secondary"`,
    );
  }
  const workflowState = (stateMatch?.[1] as ProjectWorkflowState | undefined) ?? "Investigating";
  const statusSince = stateMatch?.[2] ?? metadata.started;
  const lastActivity = stateMatch?.[3] ?? metadata.started;
  const coordinator = stateMatch?.[4]?.trim() ?? "";
  const resumePriority = stateMatch?.[5] === "Primary" ? "Primary" : "Secondary";
  for (const [label, date] of [["Status since", statusSince], ["Last activity", lastActivity]] as const) {
    if (!isRealIsoDate(date)) errors.push(`${sourcePath}: ${label} must use YYYY-MM-DD`);
    if (isRealIsoDate(date) && (date < metadata.started || date > asOf)) {
      errors.push(`${sourcePath}: ${label} must be between project start and validation date`);
    }
  }
  if (statusSince > lastActivity) {
    errors.push(`${sourcePath}: Status since cannot be after last activity`);
  }

  const presentModules = sections
    .map((section) => section.heading)
    .filter((heading) => (versionTwoOptionalModules as readonly string[]).includes(heading));
  if (metadata.workflow_route === "system-critical") {
    for (const heading of projectRequiredHeadings.slice(1)) {
      if (!presentModules.includes(heading)) {
        errors.push(`${sourcePath}: system-critical Current Work requires the ${heading} module`);
      }
    }
  }

  const contractSection = sections.find(
    (section) => section.heading === "Versioned Outcome and Success Contract",
  );
  const contractFields = contractSection
    ? parseBulletFields(
        contractSection.content,
        sourcePath,
        "Versioned Outcome and Success Contract",
        errors,
      )
    : new Map<string, string>();
  if (contractSection) {
    requireFields(
      contractFields,
      contractRequiredFields,
      sourcePath,
      "Versioned Outcome and Success Contract",
      errors,
    );
    assertOnlyNamedFields(
      contractFields,
      contractRequiredFields,
      sourcePath,
      "Versioned Outcome and Success Contract",
      errors,
    );
  }
  if (
    ["Implementing", "Validating", "Closeout pending", "Closed"].includes(
      workflowState,
    ) &&
    ![
      summary.objectiveAndScope,
      contractFields.get("Implementation authorization") ?? "",
    ].some(hasExplicitImplementationAuthorization)
  ) {
    errors.push(
      `${sourcePath}: ${workflowState} requires explicit dated implementation authorization in the core scope or optional success-contract module`,
    );
  }

  const verifiedStateSection = sections.find(
    (section) => section.heading === "Current Verified State",
  );
  if (verifiedStateSection) {
    const verifiedFields = parseBulletFields(
      verifiedStateSection.content,
      sourcePath,
      "Current Verified State",
      errors,
    );
    requireFields(
      verifiedFields,
      verifiedStateRequiredFields,
      sourcePath,
      "Current Verified State",
      errors,
    );
    assertOnlyNamedFields(
      verifiedFields,
      verifiedStateRequiredFields,
      sourcePath,
      "Current Verified State",
      errors,
    );
  }

  const scopeSection = sections.find(
    (section) => section.heading === "Scope and Decisions",
  );
  let settledDecisionRows: readonly Record<string, string>[] = [];
  if (scopeSection) {
    const scopeSubsections = getHeadingSections(scopeSection.content, 3);
    const requiredScopeHeadings = [
      "Included",
      "Excluded",
      "Dependencies and Related Capabilities",
      "Settled Decisions",
    ] as const;
    for (const heading of requiredScopeHeadings) {
      if (
        scopeSubsections.filter((candidate) => candidate.heading === heading)
          .length !== 1
      ) {
        errors.push(
          `${sourcePath}: Scope and Decisions requires exactly one "### ${heading}"`,
        );
      }
    }
    assertOnlyNamedSections(
      scopeSubsections,
      requiredScopeHeadings,
      sourcePath,
      3,
      '"## Scope and Decisions"',
      errors,
    );
    const settledSection = scopeSubsections.find(
      (section) => section.heading === "Settled Decisions",
    );
    settledDecisionRows = parseMarkdownTable(
      settledSection?.content ?? "",
      sourcePath,
      "Settled Decisions",
      errors,
    );
  }

  const traceabilitySection = sections.find(
    (section) => section.heading === "Traceability Chain",
  );
  if (traceabilitySection) {
    const traceability = new Map<string, string>();
    for (const row of parseMarkdownTable(
      traceabilitySection.content,
      sourcePath,
      "Traceability Chain",
      errors,
    )) {
      const label = row.Link ?? "";
      if (traceability.has(label)) {
        errors.push(
          `${sourcePath}: Traceability Chain contains duplicate "${label}" row`,
        );
      } else {
        traceability.set(label, row["Current answer"] ?? "");
      }
    }
    for (const row of traceabilityRows) {
      if (!traceability.has(row)) {
        errors.push(`${sourcePath}: Traceability Chain is missing "${row}"`);
      }
    }
    if (
      ["Planned", "Implementing", "Validating", "Closeout pending", "Closed"].includes(
        workflowState,
      )
    ) {
      for (const row of traceabilityRows) {
        if (!isMeaningful(traceability.get(row) ?? "")) {
          errors.push(
            `${sourcePath}: ${workflowState} requires a complete Traceability Chain; "${row}" is unresolved`,
          );
        }
      }
    }
  }

  const steps = presentModules.includes("Work Steps")
    ? parseProjectSteps(getSection(sections, "Work Steps", sourcePath, errors), metadata.project_id, sourcePath, errors)
    : [];
  const proofs = presentModules.includes("Proof Claims")
    ? parseProjectProofs(getSection(sections, "Proof Claims", sourcePath, errors), metadata.project_id, sourcePath, asOf, errors)
    : [];
  const logs = presentModules.includes("Attempt and Decision Log")
    ? parseProjectLogs(getSection(sections, "Attempt and Decision Log", sourcePath, errors), metadata.project_id, sourcePath, errors)
    : [];

  const nestedIds = new Set<string>();
  for (const entry of [...steps, ...proofs, ...logs]) {
    if (nestedIds.has(entry.id)) errors.push(`${sourcePath}: duplicate nested record ID ${entry.id}`);
    nestedIds.add(entry.id);
  }
  const proofIds = new Set(proofs.map((proof) => proof.id));
  for (const proofId of steps.flatMap((step) => step.proofIds)) {
    if (!proofIds.has(proofId)) errors.push(`${sourcePath}: Work Step references missing Proof Claim ${proofId}`);
  }
  for (let index = 1; index < logs.length; index += 1) {
    if (logs[index].date < logs[index - 1].date) {
      errors.push(`${sourcePath}: Attempt and Decision Log must remain chronological`);
      break;
    }
  }
  const logIds = new Set(logs.map((log) => log.id));
  for (const log of logs) {
    for (const reference of log.references) {
      if (!logIds.has(reference)) {
        errors.push(
          `${sourcePath}: ${log.id} references missing history entry ${reference}`,
        );
      }
    }
  }
  if (logs.length > 0 && lastActivity !== logs.at(-1)?.date) {
    errors.push(`${sourcePath}: last activity must match the latest optional history entry`);
  }

  if (metadata.workflow_route === "system-critical") {
    if (
      ["Planned", "Implementing", "Validating", "Closeout pending", "Closed"].includes(
        workflowState,
      ) &&
      (steps.length === 0 || proofs.length === 0 || logs.length === 0)
    ) {
      errors.push(
        `${sourcePath}: system-critical ${workflowState} work requires Work Steps, Proof Claims, and typed history`,
      );
    }
    const researchDecision = settledDecisionRows.find((row) =>
      /precedent research/i.test(row.Decision ?? ""),
    );
    const controllingLogId = researchDecision?.["Controlling log ID"] ?? "";
    const controllingLog = logs.find((log) => log.id === controllingLogId);
    if (!researchDecision || !isMeaningful(researchDecision.Decision ?? "")) {
      errors.push(
        `${sourcePath}: system-critical Current Work requires a settled precedent-research decision`,
      );
    } else if (!isOperationalNestedId(metadata.project_id, "LOG", controllingLogId)) {
      errors.push(
        `${sourcePath}: precedent-research decision requires a controlling project Log ID`,
      );
    } else if (!controllingLog || controllingLog.type !== "Decision") {
      errors.push(
        `${sourcePath}: precedent-research decision must point to a Decision history entry`,
      );
    }
  }

  const closeoutSection = sections.find((section) => section.heading === "Closeout") ?? null;
  const closeout = parseProjectCloseout(
    closeoutSection,
    metadata.project_id,
    workflowState,
    sourcePath,
    asOf,
    errors,
  );
  const terminal = ["Closed", "Cancelled", "Superseded"].includes(workflowState);
  if (placement === "active" && terminal) errors.push(`${sourcePath}: terminal project state belongs in the archive`);
  if (placement === "archive" && !terminal) errors.push(`${sourcePath}: archived project must use a terminal state`);
  if (placement === "archive" && (!closeout || steps.length === 0 || proofs.length === 0 || logs.length === 0)) {
    errors.push(`${sourcePath}: an archived version 2 project requires Closeout, Work Steps, Proof Claims, and history modules`);
  }
  if (placement === "active" && closeoutSection) errors.push(`${sourcePath}: active project cannot contain terminal Closeout data`);
  if (closeout) {
    const closeoutDecisionLog = logs.find(
      (log) => log.id === closeout.decisionLogId,
    );
    if (!closeoutDecisionLog) {
      errors.push(
        `${sourcePath}: Closeout references missing decision log ${closeout.decisionLogId}`,
      );
    } else if (closeoutDecisionLog.type !== "Decision") {
      errors.push(
        `${sourcePath}: Closeout decision log ${closeout.decisionLogId} must be a Decision entry`,
      );
    }
  }
  if (workflowState === "Closeout pending" || workflowState === "Closed") {
    for (const step of steps) {
      if (step.state !== "Concluded" && step.state !== "Superseded") {
        errors.push(
          `${sourcePath}: ${workflowState} requires every Work Step to be Concluded or Superseded; ${step.id} is ${step.state}`,
        );
      }
    }
    for (const proof of proofs) {
      if (proof.result !== "Passed" && proof.result !== "Not applicable") {
        errors.push(
          `${sourcePath}: ${workflowState} cannot retain ${proof.result} proof ${proof.id}`,
        );
      }
      if (
        proof.result === "Not applicable" &&
        !hasApprovedNotApplicableRationale(proof.notApplicableApproval)
      ) {
        errors.push(
          `${sourcePath}: ${workflowState} requires approved Not applicable proof ${proof.id}`,
        );
      }
    }
  }

  const attemptHeadingIndex = frontmatter.body.indexOf("## Attempt and Decision Log");
  const bodyBeforeAttemptLog = attemptHeadingIndex >= 0
    ? frontmatter.body.slice(0, attemptHeadingIndex).trimEnd()
    : frontmatter.body;
  const rawBeforeAttemptLog = `---\n${frontmatter.rawHeader}\n---\n${bodyBeforeAttemptLog}`;
  const needsStatusReview = placement === "active" && daysBetween(lastActivity, asOf) >= 14;
  const noneBlocker = /^none\b/i.test(summary.blockerOrDecision.trim());
  if (
    ["Blocked", "Paused", "Deferred", "Cancelled", "Superseded"].includes(
      workflowState,
    ) &&
    noneBlocker
  ) {
    errors.push(
      `${sourcePath}: ${workflowState} requires a meaningful blocker or decision in the core summary`,
    );
  }
  const latestLogId = logs.at(-1)?.id ?? "No history module is applicable to this bounded project.";
  const resumeHere = deepFreeze({
    projectStatus: workflowState,
    statusSince,
    lastRecordedActivity: lastActivity,
    currentCoordinatorTask: coordinator,
    resumePriority: resumePriority as "Primary" | "Secondary",
    latestCompletedResult: summary.latestVerifiedResult,
    whereWorkStopped: summary.latestVerifiedResult,
    remainingWork: summary.exactNextAction,
    nextAction: summary.exactNextAction,
    bestCurrentEvidence: summary.strongestEvidenceAndLimits,
    notYetProvenOrNeedingRecheck: summary.strongestEvidenceAndLimits,
    blockingCondition: noneBlocker ? "None." : summary.blockerOrDecision,
    unblockCondition: noneBlocker ? "None." : summary.blockerOrDecision,
    externalDecisionAction: noneBlocker ? "None." : summary.blockerOrDecision,
    statusReason: summary.blockerOrDecision,
    controllingHistoryEntry: latestLogId,
    sourceStateToRecheck: summary.sourceStateAndReadingOrder,
    readFirst: summary.sourceStateAndReadingOrder,
    scopeGuard: summary.objectiveAndScope,
  });

  return deepFreeze({
    kind: "current_work",
    id: metadata.project_id,
    title: metadata.title,
    origin: metadata.origin,
    ownerCapability: metadata.owner_capability as OperationalCapabilityId,
    relatedCapabilities: metadata.related_capabilities,
    linkedIssueIds: metadata.linked_issue_ids,
    approvedObjectiveRef: metadata.approved_objective_ref,
    started: metadata.started,
    sourcePath,
    placement,
    currentWorkVersion: 2,
    workflowRoute: metadata.workflow_route ?? null,
    coreSummary: summary,
    presentModules: deepFreeze([...presentModules]),
    resumeHere,
    workflowState,
    statusSince,
    lastActivity,
    activeCoordinator: coordinator,
    primaryResumeTarget: resumePriority === "Primary",
    blockerAndUnblockCondition: summary.blockerOrDecision,
    stateReasonAndControllingLogEntry: `${summary.blockerOrDecision}; ${latestLogId}`,
    needsStatusReview,
    steps,
    proofs,
    logs,
    closeout,
    body: frontmatter.body,
    rawBeforeAttemptLog,
  });
}

function parseCurrentWorkRecord(
  sourcePath: string,
  frontmatter: ParsedFrontmatter,
  asOf: string,
  errors: string[],
  allowLegacyCurrentState = false,
): CurrentWorkRecord | null {
  const parsed = currentWorkFrontmatterSchema.safeParse(frontmatter.data);
  if (!parsed.success) {
    formatZodErrors(parsed.error).forEach((error) =>
      errors.push(`${sourcePath}: ${error}`),
    );
    return null;
  }

  const metadata = parsed.data;
  const expectedActivePath = canonicalCurrentWorkSourcePath(
    "active",
    metadata.project_id,
  );
  const expectedArchivePath = canonicalCurrentWorkSourcePath(
    "archive",
    metadata.project_id,
  );
  const placement =
    sourcePath === expectedActivePath
      ? "active"
      : sourcePath === expectedArchivePath
        ? "archive"
        : null;
  if (!placement) {
    errors.push(
      `${sourcePath}: Current Work record does not match the canonical active or archive path for ${metadata.project_id}`,
    );
  }
  try {
    assertOperationalProjectOwner(
      metadata.project_id,
      metadata.owner_capability,
    );
  } catch (error) {
    errors.push(`${sourcePath}: ${(error as Error).message}`);
  }
  if (metadata.source_record !== sourcePath) {
    errors.push(
      `${sourcePath}: source_record must exactly match the canonical source path`,
    );
  }
  if (
    metadata.origin === "verified_issue" &&
    metadata.linked_issue_ids.length === 0
  ) {
    errors.push(`${sourcePath}: verified_issue origin requires at least one linked Issue`);
  }
  const duplicateRelatedCapabilities = metadata.related_capabilities.filter(
    (capabilityId, index) =>
      metadata.related_capabilities.indexOf(capabilityId) !== index,
  );
  if (duplicateRelatedCapabilities.length > 0) {
    errors.push(
      `${sourcePath}: related_capabilities contains duplicates: ${[...new Set(duplicateRelatedCapabilities)].join(", ")}`,
    );
  }
  for (const capabilityId of metadata.related_capabilities) {
    if (
      !APPROVED_CAPABILITY_IDS.includes(
        capabilityId as (typeof APPROVED_CAPABILITY_IDS)[number],
      )
    ) {
      errors.push(`${sourcePath}: unsupported related capability ${capabilityId}`);
    }
    if (capabilityId === metadata.owner_capability) {
      errors.push(`${sourcePath}: related capability cannot repeat owner ${capabilityId}`);
    }
  }
  const duplicateLinkedIssues = metadata.linked_issue_ids.filter(
    (issueId, index) => metadata.linked_issue_ids.indexOf(issueId) !== index,
  );
  if (duplicateLinkedIssues.length > 0) {
    errors.push(
      `${sourcePath}: linked_issue_ids contains duplicates: ${[...new Set(duplicateLinkedIssues)].join(", ")}`,
    );
  }

  assertRecordHeading(
    frontmatter.body,
    `${metadata.project_id}: ${metadata.title}`,
    sourcePath,
    errors,
  );
  if (!frontmatter.body.includes("Current Work is an operational companion")) {
    errors.push(`${sourcePath}: Current Work authority statement is missing`);
  }
  if (metadata.current_work_version === 2) {
    return parseVersionTwoCurrentWorkRecord({
      sourcePath,
      frontmatter,
      metadata,
      placement: placement ?? "active",
      asOf,
      errors,
    });
  }
  const sections = assertRequiredHeadings(
    frontmatter.body,
    projectRequiredHeadings,
    sourcePath,
    errors,
  );
  if (sections[0]?.heading !== "Current State / Resume Here") {
    errors.push(`${sourcePath}: Current State / Resume Here must be the first substantive section`);
  }

  const currentStateSection = getSection(
    sections,
    "Current State / Resume Here",
    sourcePath,
    [],
  );
  const legacyCurrentStateFields =
    allowLegacyCurrentState && currentStateSection
      ? parseLegacyCurrentStateFields(currentStateSection, metadata.project_id)
      : null;
  const currentStateFields =
    legacyCurrentStateFields ??
    (currentStateSection
      ? parseStructuredCurrentStateFields(currentStateSection, sourcePath, errors)
      : new Map<string, string>());

  const workflowStateValue = currentStateFields.get("Project status") ?? "";
  const workflowState = PROJECT_WORKFLOW_STATES.includes(
    workflowStateValue as ProjectWorkflowState,
  )
    ? (workflowStateValue as ProjectWorkflowState)
    : null;
  if (!workflowState) {
    errors.push(`${sourcePath}: unsupported workflow state "${workflowStateValue}"`);
  }
  const statusSince = currentStateFields.get("Status since") ?? "";
  const lastActivity = currentStateFields.get("Last recorded activity") ?? "";
  if (!isRealIsoDate(statusSince)) {
    errors.push(`${sourcePath}: Status since must use YYYY-MM-DD`);
  }
  if (!isRealIsoDate(lastActivity)) {
    errors.push(`${sourcePath}: Last recorded activity must use YYYY-MM-DD`);
  }
  if (isRealIsoDate(statusSince) && statusSince < metadata.started) {
    errors.push(`${sourcePath}: Status since cannot be before the project start date`);
  }
  if (isRealIsoDate(statusSince) && statusSince > asOf) {
    errors.push(
      `${sourcePath}: Status since ${statusSince} cannot be after validation date ${asOf}`,
    );
  }
  if (isRealIsoDate(lastActivity) && lastActivity < metadata.started) {
    errors.push(
      `${sourcePath}: Last recorded activity cannot be before the project start date`,
    );
  }
  if (isRealIsoDate(lastActivity) && lastActivity > asOf) {
    errors.push(
      `${sourcePath}: Last recorded activity cannot be after the validation date`,
    );
  }
  if (
    isRealIsoDate(statusSince) &&
    isRealIsoDate(lastActivity) &&
    statusSince > lastActivity
  ) {
    errors.push(
      `${sourcePath}: Status since ${statusSince} cannot be after Last recorded activity ${lastActivity}`,
    );
  }

  const resumePriority = currentStateFields.get("Resume priority") ?? "";
  if (resumePriority !== "Primary" && resumePriority !== "Secondary") {
    errors.push(`${sourcePath}: Resume priority must be Primary or Secondary`);
  }
  const primaryResumeTarget = resumePriority === "Primary";
  const blockingCondition = currentStateFields.get("Blocking condition") ?? "";
  const unblockCondition = currentStateFields.get("Unblock condition") ?? "";
  const statusReason = currentStateFields.get("Status reason") ?? "";
  const controllingHistoryEntry =
    currentStateFields.get("Controlling history entry") ?? "";

  const contractSection = getSection(
    sections,
    "Versioned Outcome and Success Contract",
    sourcePath,
    [],
  );
  const contractFields = parseBulletFields(
    contractSection?.content ?? "",
    sourcePath,
    "Versioned Outcome and Success Contract",
    errors,
  );
  requireFields(
    contractFields,
    contractRequiredFields,
    sourcePath,
    "Versioned Outcome and Success Contract",
    errors,
  );
  if (
    workflowState &&
    ["Implementing", "Validating", "Closeout pending", "Closed"].includes(
      workflowState,
    ) &&
    !hasExplicitImplementationAuthorization(
      contractFields.get("Implementation authorization") ?? "",
    )
  ) {
    errors.push(
      `${sourcePath}: ${workflowState} requires explicit dated implementation authorization`,
    );
  }

  const verifiedStateSection = getSection(
    sections,
    "Current Verified State",
    sourcePath,
    [],
  );
  requireFields(
    parseBulletFields(
      verifiedStateSection?.content ?? "",
      sourcePath,
      "Current Verified State",
      errors,
    ),
    verifiedStateRequiredFields,
    sourcePath,
    "Current Verified State",
    errors,
  );

  const scopeSection = getSection(sections, "Scope and Decisions", sourcePath, []);
  const scopeHeadings = getHeadingSections(scopeSection?.content ?? "", 3).map(
    (section) => section.heading,
  );
  for (const heading of [
    "Included",
    "Excluded",
    "Dependencies and Related Capabilities",
    "Settled Decisions",
  ]) {
    if (scopeHeadings.filter((candidate) => candidate === heading).length !== 1) {
      errors.push(`${sourcePath}: Scope and Decisions requires exactly one "### ${heading}"`);
    }
  }
  const settledDecisionsSection = getHeadingSections(
    scopeSection?.content ?? "",
    3,
  ).find((section) => section.heading === "Settled Decisions");
  const settledDecisionRows = parseMarkdownTable(
    settledDecisionsSection?.content ?? "",
    sourcePath,
    "Settled Decisions",
    errors,
  );

  const traceabilitySection = getSection(
    sections,
    "Traceability Chain",
    sourcePath,
    [],
  );
  const traceability = new Map<string, string>();
  for (const row of parseMarkdownTable(
    traceabilitySection?.content ?? "",
    sourcePath,
    "Traceability Chain",
    errors,
  )) {
    const label = row.Link ?? "";
    if (traceability.has(label)) {
      errors.push(`${sourcePath}: Traceability Chain contains duplicate "${label}" row`);
      continue;
    }
    traceability.set(label, row["Current answer"] ?? "");
  }
  for (const row of traceabilityRows) {
    if (!traceability.has(row)) {
      errors.push(`${sourcePath}: Traceability Chain is missing "${row}"`);
    }
  }
  if (
    workflowState &&
    ["Planned", "Implementing", "Validating", "Closeout pending", "Closed"].includes(
      workflowState,
    )
  ) {
    for (const row of traceabilityRows) {
      if (!isMeaningful(traceability.get(row) ?? "")) {
        errors.push(
          `${sourcePath}: ${workflowState} requires a complete Traceability Chain; "${row}" is unresolved`,
        );
      }
    }
  }

  const steps = parseProjectSteps(
    getSection(sections, "Work Steps", sourcePath, []),
    metadata.project_id,
    sourcePath,
    errors,
  );
  const proofs = parseProjectProofs(
    getSection(sections, "Proof Claims", sourcePath, []),
    metadata.project_id,
    sourcePath,
    asOf,
    errors,
  );
  const logs = parseProjectLogs(
    getSection(sections, "Attempt and Decision Log", sourcePath, []),
    metadata.project_id,
    sourcePath,
    errors,
  );

  if (workflowState === "Planned" || workflowState === "Implementing") {
    if (steps.length === 0) {
      errors.push(`${sourcePath}: ${workflowState} requires at least one Work Step`);
    }
    if (proofs.length === 0) {
      errors.push(`${sourcePath}: ${workflowState} requires at least one Proof Claim`);
    }
  }

  for (const duplicateGroup of [steps, proofs, logs]) {
    const seen = new Set<string>();
    for (const entry of duplicateGroup) {
      if (seen.has(entry.id)) {
        errors.push(`${sourcePath}: duplicate nested record ID ${entry.id}`);
      }
      seen.add(entry.id);
    }
  }
  const proofIds = new Set(proofs.map((proof) => proof.id));
  steps.flatMap((step) => step.proofIds).forEach((proofId) => {
    if (!proofIds.has(proofId)) {
      errors.push(`${sourcePath}: Work Step references missing Proof Claim ${proofId}`);
    }
  });
  const logIds = new Set(logs.map((log) => log.id));
  logs.forEach((log) => {
    log.references.forEach((reference) => {
      if (!logIds.has(reference)) {
        errors.push(`${sourcePath}: ${log.id} references missing history entry ${reference}`);
      }
    });
  });
  if (
    workflowState &&
    ["Planned", "Implementing", "Validating", "Closeout pending", "Closed"].includes(
      workflowState,
    )
  ) {
    const researchDecision = settledDecisionRows.find((row) =>
      /precedent research/i.test(row.Decision ?? ""),
    );
    const controllingLogId = researchDecision?.["Controlling log ID"] ?? "";
    const controllingLog = logs.find((log) => log.id === controllingLogId);
    if (!researchDecision || !isMeaningful(researchDecision.Decision ?? "")) {
      errors.push(
        `${sourcePath}: ${workflowState} requires a settled decision about whether precedent research is required`,
      );
    } else if (!isOperationalNestedId(metadata.project_id, "LOG", controllingLogId)) {
      errors.push(
        `${sourcePath}: precedent-research decision requires a controlling project Log ID`,
      );
    } else if (!controllingLog || controllingLog.type !== "Decision") {
      errors.push(
        `${sourcePath}: precedent-research decision must point to a Decision Attempt Log entry`,
      );
    }
  }
  for (let index = 1; index < logs.length; index += 1) {
    if (logs[index].date < logs[index - 1].date) {
      errors.push(`${sourcePath}: Attempt and Decision Log must remain chronological`);
      break;
    }
  }
  if (logs.length === 0) {
    errors.push(`${sourcePath}: Current Work requires at least one typed history entry`);
  } else if (lastActivity !== logs[logs.length - 1].date) {
    errors.push(
      `${sourcePath}: Last recorded activity ${lastActivity} does not match latest log date ${logs[logs.length - 1].date}`,
    );
  }

  const strongestProof = currentStateFields.get("Best current evidence") ?? "";
  const recordPrefix = parseOperationalProjectId(metadata.project_id).capability.recordPrefix;
  const strongestProofMatch = strongestProof.match(
    new RegExp(`${recordPrefix}-EV-\\d{3}`),
  )?.[0];
  if (strongestProofMatch && !proofIds.has(strongestProofMatch)) {
    errors.push(`${sourcePath}: Best current evidence references missing ${strongestProofMatch}`);
  }

  if (
    workflowState === "Blocked" &&
    (!isMeaningful(blockingCondition) || !isMeaningful(unblockCondition))
  ) {
    errors.push(
      `${sourcePath}: Blocked requires separate meaningful Blocking condition and Unblock condition fields`,
    );
  }
  if (workflowState && !isMeaningful(statusReason)) {
    errors.push(`${sourcePath}: ${workflowState} requires a meaningful Status reason`);
  }
  const controllingId = controllingHistoryEntry.trim();
  if (
    workflowState &&
    !isOperationalNestedId(metadata.project_id, "LOG", controllingId)
  ) {
    errors.push(
      `${sourcePath}: ${workflowState} requires Controlling history entry to contain one project Log ID`,
    );
  } else if (workflowState && !logIds.has(controllingId)) {
    errors.push(
      `${sourcePath}: Controlling history entry references missing log entry ${controllingId}`,
    );
  }
  if (workflowState === "Validating") {
    const testableStep = steps.find(
      (step) =>
        (step.state === "Awaiting proof" || step.state === "Concluded") &&
        isMeaningful(step.result) &&
        step.proofIds.length > 0,
    );
    if (!testableStep) {
      errors.push(
        `${sourcePath}: Validating requires an Awaiting proof or Concluded testable Work Step with a meaningful result and Proof ID`,
      );
    }
  }

  const closeoutSection = sections.find((section) => section.heading === "Closeout") ?? null;
  const closeout = workflowState
    ? parseProjectCloseout(
        closeoutSection,
        metadata.project_id,
        workflowState,
        sourcePath,
        asOf,
        errors,
      )
    : null;
  const terminalStates = ["Closed", "Cancelled", "Superseded"];
  if (placement === "active" && workflowState && terminalStates.includes(workflowState)) {
    errors.push(`${sourcePath}: terminal project state ${workflowState} belongs in the archive`);
  }
  if (placement === "archive" && workflowState && !terminalStates.includes(workflowState)) {
    errors.push(`${sourcePath}: archived project must be Closed, Cancelled, or Superseded`);
  }
  if (placement === "archive" && !closeout) {
    errors.push(`${sourcePath}: archived project requires a Closeout section`);
  }
  if (placement === "active" && closeoutSection) {
    errors.push(`${sourcePath}: active project cannot contain terminal Closeout data`);
  }
  if (closeout) {
    const closeoutDecisionLog = logs.find(
      (log) => log.id === closeout.decisionLogId,
    );
    if (!closeoutDecisionLog) {
      errors.push(
        `${sourcePath}: Closeout references missing decision log ${closeout.decisionLogId}`,
      );
    } else if (closeoutDecisionLog.type !== "Decision") {
      errors.push(
        `${sourcePath}: Closeout decision log ${closeout.decisionLogId} must be a Decision entry`,
      );
    }
  }
  if (closeout && closeout.archivedOn < lastActivity) {
    const postArchiveLogs = logs.filter((log) => log.date > closeout.archivedOn);
    if (
      postArchiveLogs.length === 0 ||
      postArchiveLogs.some((log) => log.type !== "Correction")
    ) {
      errors.push(
        `${sourcePath}: Last activity may advance past the archive date only for appended approved Correction entries`,
      );
    }
  }
  if (workflowState === "Closeout pending" || workflowState === "Closed") {
    if (steps.length === 0) {
      errors.push(`${sourcePath}: ${workflowState} requires project-specific Work Steps`);
    }
    for (const step of steps) {
      if (step.state !== "Concluded" && step.state !== "Superseded") {
        errors.push(
          `${sourcePath}: ${workflowState} requires every Work Step to be Concluded or Superseded; ${step.id} is ${step.state}`,
        );
      }
    }
    if (proofs.length === 0) {
      errors.push(`${sourcePath}: ${workflowState} requires project-specific Proof Claims`);
    }
    for (const proof of proofs) {
      if (proof.result !== "Passed" && proof.result !== "Not applicable") {
        errors.push(
          `${sourcePath}: ${workflowState} cannot retain ${proof.result} proof ${proof.id}`,
        );
      }
      if (
        proof.result === "Not applicable" &&
        !hasApprovedNotApplicableRationale(proof.notApplicableApproval)
      ) {
        errors.push(
          `${sourcePath}: ${workflowState} requires approved Not applicable proof ${proof.id}`,
        );
      }
    }
  }
  if (
    closeout &&
    (closeout.terminalState === "Cancelled" ||
      closeout.terminalState === "Superseded") &&
    Object.values(closeout.issueDispositions).includes("resolved")
  ) {
    const successfulProofPackage =
      proofs.length > 0 &&
      proofs.every(
        (proof) =>
          proof.result === "Passed" ||
          (proof.result === "Not applicable" &&
            hasApprovedNotApplicableRationale(proof.notApplicableApproval)),
      );
    if (closeout.changelogIds.length === 0 || !successfulProofPackage) {
      errors.push(
        `${sourcePath}: ${closeout.terminalState} cannot resolve linked Issues without a linked Changelog and successful proof package`,
      );
    }
  }

  const attemptHeadingIndex = frontmatter.body.indexOf("## Attempt and Decision Log");
  const bodyBeforeAttemptLog =
    attemptHeadingIndex >= 0
      ? frontmatter.body.slice(0, attemptHeadingIndex).trimEnd()
      : frontmatter.body;
  const rawBeforeAttemptLog = `---\n${frontmatter.rawHeader}\n---\n${bodyBeforeAttemptLog}`;
  const needsStatusReview =
    placement === "active" &&
    isRealIsoDate(lastActivity) &&
    daysBetween(lastActivity, asOf) >= 14;
  const resolvedWorkflowState = workflowState ?? "Investigating";
  const resumeHere = deepFreeze({
    projectStatus: resolvedWorkflowState,
    statusSince,
    lastRecordedActivity: lastActivity,
    currentCoordinatorTask:
      currentStateFields.get("Current coordinator/task") ?? "",
    resumePriority:
      resumePriority === "Primary" ? ("Primary" as const) : ("Secondary" as const),
    latestCompletedResult:
      currentStateFields.get("Latest completed result") ?? "",
    whereWorkStopped: currentStateFields.get("Where work stopped") ?? "",
    remainingWork: currentStateFields.get("Remaining work") ?? "",
    nextAction: currentStateFields.get("Next action") ?? "",
    bestCurrentEvidence: currentStateFields.get("Best current evidence") ?? "",
    notYetProvenOrNeedingRecheck:
      currentStateFields.get("Not yet proven or needing re-check") ?? "",
    blockingCondition,
    unblockCondition,
    externalDecisionAction:
      currentStateFields.get("External decision/action") ?? "",
    statusReason,
    controllingHistoryEntry,
    sourceStateToRecheck:
      currentStateFields.get("Source state to re-check") ?? "",
    readFirst: currentStateFields.get("Read first") ?? "",
    scopeGuard: currentStateFields.get("Scope guard") ?? "",
  });

  return deepFreeze({
    kind: "current_work",
    id: metadata.project_id,
    title: metadata.title,
    origin: metadata.origin,
    ownerCapability: metadata.owner_capability as OperationalCapabilityId,
    relatedCapabilities: metadata.related_capabilities,
    linkedIssueIds: metadata.linked_issue_ids,
    approvedObjectiveRef: metadata.approved_objective_ref,
    started: metadata.started,
    sourcePath,
    placement: placement ?? "active",
    currentWorkVersion: 1,
    workflowRoute: null,
    coreSummary: null,
    presentModules: deepFreeze(projectRequiredHeadings.slice(1)),
    resumeHere,
    workflowState: resolvedWorkflowState,
    statusSince,
    lastActivity,
    activeCoordinator: resumeHere.currentCoordinatorTask,
    primaryResumeTarget,
    blockerAndUnblockCondition: `${blockingCondition}; ${unblockCondition}`,
    stateReasonAndControllingLogEntry: `${statusReason}; ${controllingHistoryEntry}`,
    needsStatusReview,
    steps,
    proofs,
    logs,
    closeout,
    body: frontmatter.body,
    rawBeforeAttemptLog,
  });
}

type AnyOperationalRecord = IssueRecord | CurrentWorkRecord;

function parseOperationalSources(
  sources: OperationalRecordSourceMap,
  asOf: string,
  errors: string[],
  options: Readonly<{
    allowLegacyIssueBody?: boolean;
    allowLegacyCurrentState?: boolean;
  }> = {},
) {
  const records: AnyOperationalRecord[] = [];
  for (const [rawPath, rawSource] of Object.entries(sources).sort(([left], [right]) =>
    left.localeCompare(right),
  )) {
    const sourcePath = normalizeSourcePath(rawPath);
    let frontmatter: ParsedFrontmatter;
    try {
      frontmatter = parseFrontmatter(rawSource);
    } catch (error) {
      errors.push(
        `${sourcePath}: ${error instanceof Error ? error.message : "invalid frontmatter"}`,
      );
      continue;
    }

    const recordType =
      frontmatter.data && typeof frontmatter.data === "object"
        ? (frontmatter.data as Record<string, unknown>).record_type
        : undefined;
    let record: AnyOperationalRecord | null = null;
    if (recordType === "issue") {
      record = parseIssueRecord(
        sourcePath,
        frontmatter,
        asOf,
        errors,
        options.allowLegacyIssueBody,
      );
    } else if (recordType === "current_work") {
      record = parseCurrentWorkRecord(
        sourcePath,
        frontmatter,
        asOf,
        errors,
        options.allowLegacyCurrentState,
      );
    } else {
      errors.push(`${sourcePath}: unsupported or missing record_type`);
    }
    if (record) records.push(record);
  }
  return records;
}

function validateUniqueIds(records: readonly AnyOperationalRecord[], errors: string[]) {
  const byId = new Map<string, AnyOperationalRecord>();
  for (const record of records) {
    const previous = byId.get(record.id);
    if (previous) {
      errors.push(
        `duplicate record ID ${record.id}: ${previous.sourcePath} and ${record.sourcePath}`,
      );
    } else {
      byId.set(record.id, record);
    }
  }
}

function validateUniqueNestedIds(
  projects: readonly CurrentWorkRecord[],
  errors: string[],
) {
  const owners = new Map<string, CurrentWorkRecord>();
  for (const project of projects) {
    for (const entry of [...project.steps, ...project.proofs, ...project.logs]) {
      const previous = owners.get(entry.id);
      if (previous) {
        errors.push(
          `duplicate nested record ID ${entry.id}: ${previous.sourcePath} and ${project.sourcePath}`,
        );
      } else {
        owners.set(entry.id, project);
      }
    }
  }
}

const ACTIVE_PROJECT_STATE_ORDER: Readonly<Record<string, number>> = {
  Implementing: 0,
  Validating: 1,
  Investigating: 2,
  Planned: 3,
  Blocked: 4,
  Paused: 5,
  Deferred: 6,
  "Closeout pending": 7,
};

export function compareIssueRecords(left: IssueRecord, right: IssueRecord) {
  return (
    Number(left.status === "resolved") - Number(right.status === "resolved") ||
    right.lastVerifiedOn.localeCompare(left.lastVerifiedOn) ||
    left.id.localeCompare(right.id)
  );
}

export function compareCurrentWorkProjects(
  left: CurrentWorkRecord,
  right: CurrentWorkRecord,
) {
  return (
    Number(right.primaryResumeTarget) - Number(left.primaryResumeTarget) ||
    (ACTIVE_PROJECT_STATE_ORDER[left.workflowState] ?? Number.MAX_SAFE_INTEGER) -
      (ACTIVE_PROJECT_STATE_ORDER[right.workflowState] ?? Number.MAX_SAFE_INTEGER) ||
    right.lastActivity.localeCompare(left.lastActivity) ||
    left.id.localeCompare(right.id)
  );
}

export function getCurrentWorkBodyAfterResumeHere(source: string) {
  const resumeHeading = source.search(/^## Current State \/ Resume Here$/m);
  if (resumeHeading < 0) return "";
  const remainder = source.slice(resumeHeading + 1);
  const nextSectionOffset = remainder.search(/^## (?!Current State \/ Resume Here$).+$/m);
  return nextSectionOffset >= 0
    ? remainder.slice(nextSectionOffset).trim()
    : "";
}

function validateProjectLinks(
  issues: readonly IssueRecord[],
  activeProjects: readonly CurrentWorkRecord[],
  archivedProjects: readonly CurrentWorkRecord[],
  changelogEntries: readonly ChangelogRootRecord[],
  errors: string[],
) {
  const issueById = new Map(issues.map((issue) => [issue.id, issue]));
  const projects = [...activeProjects, ...archivedProjects];
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const acceptedChangelogEntries = changelogEntries.filter(
    (entry): entry is AcceptedCloseoutChangelogRecord =>
      entry.variant === "accepted_closeout",
  );
  const changelogById = new Map(
    acceptedChangelogEntries.map((entry) => [entry.id, entry]),
  );

  for (const project of projects) {
    for (const issueId of project.linkedIssueIds) {
      if (!issueById.has(issueId)) {
        errors.push(`${project.sourcePath}: linked Issue ${issueId} does not exist`);
      }
    }
    if (project.closeout) {
      const dispositionIds = Object.keys(project.closeout.issueDispositions).sort();
      const linkedIds = [...project.linkedIssueIds].sort();
      if (dispositionIds.join("|") !== linkedIds.join("|")) {
        errors.push(
          `${project.sourcePath}: Closeout Issue disposition must cover every linked Issue exactly once`,
        );
      }
      if (
        project.closeout.replacementProjectId &&
        project.closeout.replacementProjectId === project.id
      ) {
        errors.push(`${project.sourcePath}: replacement project cannot reference itself`);
      } else if (
        project.closeout.replacementProjectId &&
        !projectById.has(project.closeout.replacementProjectId)
      ) {
        errors.push(
          `${project.sourcePath}: replacement project ${project.closeout.replacementProjectId} does not exist`,
        );
      }
      for (const changelogId of project.closeout.changelogIds) {
        const changelog = changelogById.get(changelogId);
        if (!changelog) {
          errors.push(`${project.sourcePath}: Closeout Changelog ${changelogId} does not exist`);
        } else if (changelog.archivedProjectId !== project.id) {
          errors.push(
            `${project.sourcePath}: Closeout Changelog ${changelogId} points to ${changelog.archivedProjectId}`,
          );
        }
      }
    }
  }

  const objectiveOwners = new Map<string, CurrentWorkRecord>();
  const activeIssueOwners = new Map<string, CurrentWorkRecord>();
  for (const project of activeProjects) {
    const key = `${project.ownerCapability}:${project.approvedObjectiveRef}`;
    const previous = objectiveOwners.get(key);
    if (previous) {
      errors.push(
        `${project.sourcePath}: active objective duplicates ${previous.sourcePath}`,
      );
    } else {
      objectiveOwners.set(key, project);
    }
    for (const issueId of project.linkedIssueIds) {
      const previous = activeIssueOwners.get(issueId);
      if (previous) {
        errors.push(
          `${project.sourcePath}: linked Issue ${issueId} is already owned by active project ${previous.id}`,
        );
      } else {
        activeIssueOwners.set(issueId, project);
      }
    }
  }
  const primaryProjects = activeProjects.filter(
    (project) => project.primaryResumeTarget,
  );
  if (activeProjects.length > 1 && primaryProjects.length !== 1) {
    errors.push(
      `Chronicle operational registry: expected exactly one primary resume project, found ${primaryProjects.length}`,
    );
  }

  for (const changelog of acceptedChangelogEntries) {
    const archive = projectById.get(changelog.archivedProjectId);
    if (!archive || archive.placement !== "archive") {
      errors.push(
        `${changelog.sourcePath}: archived project ${changelog.archivedProjectId} does not exist`,
      );
      continue;
    }
    if (archive.sourcePath !== changelog.archiveRecord) {
      errors.push(
        `${changelog.sourcePath}: archive_record does not resolve to the archived project source`,
      );
    }
    if (!archive.closeout?.changelogIds.includes(changelog.id)) {
      errors.push(
        `${changelog.sourcePath}: archived project does not link back to ${changelog.id}`,
      );
    }
    if (archive.ownerCapability !== changelog.owningCapability) {
      errors.push(
        `${changelog.sourcePath}: owning_capability does not match the archived project`,
      );
    }
    const acceptanceProof = archive.proofs.find(
      (proof) => proof.id === changelog.acceptanceRef,
    );
    if (!acceptanceProof) {
      errors.push(
        `${changelog.sourcePath}: acceptance_ref ${changelog.acceptanceRef} does not resolve in the archived project`,
      );
    } else {
      if (acceptanceProof.result !== "Passed") {
        errors.push(
          `${changelog.sourcePath}: acceptance_ref ${changelog.acceptanceRef} must resolve to a Passed proof`,
        );
      }
      if (acceptanceProof.evidenceClass !== "Product outcome complete") {
        errors.push(
          `${changelog.sourcePath}: acceptance_ref ${changelog.acceptanceRef} must resolve to Product outcome complete proof`,
        );
      }
      const recordedSourceRevisions = Array.from(
        acceptanceProof.sourceState.matchAll(
          /(?:^|[^A-Za-z0-9])((?:git:[a-f0-9]{40}|sha256:[a-f0-9]{64}))(?=$|[^A-Za-z0-9])/g,
        ),
        (match) => match[1],
      );
      if (!recordedSourceRevisions.includes(changelog.sourceRevision)) {
        errors.push(
          `${changelog.sourcePath}: source_revision ${changelog.sourceRevision} must appear as an exact token in Repository/external source state for acceptance_ref ${changelog.acceptanceRef}`,
        );
      }
      const acceptanceAuthorityAndDate =
        acceptanceProof.completionReviewMode === "Evidence-based verification"
          ? acceptanceProof.completionAuthorityAndDate
          : acceptanceProof.humanReviewerAndDate;
      const { reviewer, date } = parseHumanReviewerAndDate(
        acceptanceAuthorityAndDate,
      );
      if (reviewer.toLocaleLowerCase() !== changelog.acceptedBy.toLocaleLowerCase()) {
        errors.push(
          `${changelog.sourcePath}: accepted_by must match the completion authority on acceptance_ref ${changelog.acceptanceRef}`,
        );
      }
      if (date !== changelog.acceptedOn) {
        errors.push(
          `${changelog.sourcePath}: accepted_on must match the completion date on acceptance_ref ${changelog.acceptanceRef}`,
        );
      }
    }

    const accountedIssues = [
      ...changelog.resolvedIssueIds,
      ...changelog.remainingIssueIds,
    ].sort();
    const projectIssues = [...archive.linkedIssueIds].sort();
    if (accountedIssues.join("|") !== projectIssues.join("|")) {
      errors.push(
        `${changelog.sourcePath}: Issue disposition must account for every archived-project Issue exactly once`,
      );
    }
    for (const issueId of changelog.resolvedIssueIds) {
      const issue = issueById.get(issueId);
      if (!issue) {
        errors.push(`${changelog.sourcePath}: resolved Issue ${issueId} does not exist`);
      } else if (issue.status !== "resolved") {
        errors.push(`${changelog.sourcePath}: ${issueId} is listed resolved but remains open`);
      }
      if (archive.closeout?.issueDispositions[issueId] !== "resolved") {
        errors.push(`${changelog.sourcePath}: ${issueId} conflicts with archive disposition`);
      }
    }
    for (const issueId of changelog.remainingIssueIds) {
      const issue = issueById.get(issueId);
      if (!issue) {
        errors.push(`${changelog.sourcePath}: remaining Issue ${issueId} does not exist`);
      } else if (issue.status !== "open") {
        errors.push(`${changelog.sourcePath}: ${issueId} is listed remaining but is resolved`);
      }
      if (archive.closeout?.issueDispositions[issueId] !== "remaining") {
        errors.push(`${changelog.sourcePath}: ${issueId} conflicts with archive disposition`);
      }
    }
  }

  for (const issue of issues) {
    if (issue.status !== "resolved") continue;
    const resolvingChanges = acceptedChangelogEntries.filter((entry) =>
      entry.resolvedIssueIds.includes(issue.id),
    );
    if (resolvingChanges.length === 0) {
      errors.push(
        `${issue.sourcePath}: resolved Issue ${issue.id} requires one matching accepted Changelog and archived-project disposition`,
      );
    } else if (resolvingChanges.length > 1) {
      errors.push(
        `${issue.sourcePath}: resolved Issue ${issue.id} is claimed by multiple accepted Changelog entries: ${resolvingChanges.map((entry) => entry.id).join(", ")}`,
      );
    }
  }

  for (const archive of archivedProjects) {
    if (archive.workflowState !== "Closed") continue;
    const linkedChangelog = acceptedChangelogEntries.filter(
      (entry) => entry.archivedProjectId === archive.id,
    );
    if (linkedChangelog.length === 0) {
      errors.push(`${archive.sourcePath}: Closed archive has no Changelog entry`);
    }
  }
}

function validateBaselineHistory(
  currentRecords: readonly AnyOperationalRecord[],
  baselineSources: OperationalRecordSourceMap,
  asOf: string,
  errors: string[],
) {
  const baselineErrors: string[] = [];
  const parsedBaselineRecords = parseOperationalSources(
    baselineSources,
    asOf,
    baselineErrors,
    { allowLegacyIssueBody: true, allowLegacyCurrentState: true },
  );
  const baselineRecords = parsedBaselineRecords.filter(
    (record): record is CurrentWorkRecord => record.kind === "current_work",
  );
  baselineErrors.forEach((error) => errors.push(`baseline ${error}`));
  const currentProjects = currentRecords.filter(
    (record): record is CurrentWorkRecord => record.kind === "current_work",
  );
  const currentById = new Map(currentProjects.map((project) => [project.id, project]));

  const baselineIssues = parsedBaselineRecords.filter(
    (record): record is IssueRecord => record.kind === "issue",
  );
  const currentIssues = currentRecords.filter(
    (record): record is IssueRecord => record.kind === "issue",
  );
  const currentIssueById = new Map(currentIssues.map((issue) => [issue.id, issue]));
  for (const baselineIssue of baselineIssues) {
    const currentIssue = currentIssueById.get(baselineIssue.id);
    if (!currentIssue) {
      errors.push(`${baselineIssue.sourcePath}: Issue was removed from the candidate source set`);
      continue;
    }
    if (currentIssue.discoveredOn !== baselineIssue.discoveredOn) {
      errors.push(
        `${currentIssue.sourcePath}: discovered_on cannot change after an Issue is created`,
      );
    }
    if (currentIssue.lastVerifiedOn < baselineIssue.lastVerifiedOn) {
      errors.push(
        `${currentIssue.sourcePath}: last_verified_on cannot move backward from ${baselineIssue.lastVerifiedOn}`,
      );
    }
  }

  const normalizeArchivedFrozenContent = (source: string) =>
    source.replace(
      /^- (?:Last activity|Last recorded activity):.*$/m,
      "- Last recorded activity: <derived from latest log>",
    );

  for (const baseline of baselineRecords) {
    const current = currentById.get(baseline.id);
    if (!current) {
      errors.push(`${baseline.sourcePath}: project or its history was removed from the candidate source set`);
      continue;
    }
    const currentLogs = new Map(current.logs.map((log) => [log.id, log]));
    const baselineIds = baseline.logs.map((log) => log.id);
    const currentPrefix = current.logs.slice(0, baseline.logs.length).map((log) => log.id);
    const appendedLogs = current.logs.slice(baseline.logs.length);
    if (baselineIds.join("|") !== currentPrefix.join("|")) {
      errors.push(`${current.sourcePath}: existing history order changed or entries were inserted before the end`);
    }
    for (const baselineLog of baseline.logs) {
      const currentLog = currentLogs.get(baselineLog.id);
      if (!currentLog) {
        errors.push(`${current.sourcePath}: existing history entry ${baselineLog.id} was removed`);
      } else if (currentLog.raw !== baselineLog.raw) {
        errors.push(`${current.sourcePath}: existing history entry ${baselineLog.id} was rewritten`);
      }
    }

    for (const baselineStep of baseline.steps) {
      if (!current.steps.some((step) => step.id === baselineStep.id)) {
        errors.push(
          `${current.sourcePath}: existing Work Step ${baselineStep.id} was removed`,
        );
      }
    }
    for (const baselineProof of baseline.proofs) {
      if (!current.proofs.some((proof) => proof.id === baselineProof.id)) {
        errors.push(
          `${current.sourcePath}: existing Proof Claim ${baselineProof.id} was removed`,
        );
      }
    }

    const appendedHandoffs = appendedLogs.filter(
      (log): log is HandoffLogEntry => log.type === "Handoff",
    );
    const coordinatorChanged =
      current.activeCoordinator !== baseline.activeCoordinator;
    if (coordinatorChanged && appendedHandoffs.length !== 1) {
      errors.push(
        `${current.sourcePath}: changing Current coordinator/task requires exactly one appended Handoff entry`,
      );
    }
    if (!coordinatorChanged && appendedHandoffs.length > 0) {
      errors.push(
        `${current.sourcePath}: an appended Handoff requires Current coordinator/task to change in the same protected update`,
      );
    }
    if (coordinatorChanged && appendedHandoffs.length === 1) {
      const handoff = appendedHandoffs[0];
      if (handoff.sender !== baseline.activeCoordinator) {
        errors.push(
          `${current.sourcePath}: Handoff ${handoff.id} Sender must match the previous coordinator`,
        );
      }
      if (handoff.recipient !== current.activeCoordinator) {
        errors.push(
          `${current.sourcePath}: Handoff ${handoff.id} Recipient must match the new coordinator`,
        );
      }
      if (
        handoff.transferredSourceState !==
        current.resumeHere.sourceStateToRecheck
      ) {
        errors.push(
          `${current.sourcePath}: Handoff ${handoff.id} Transferred source state must match Resume Here`,
        );
      }
    }

    if (
      baseline.placement === "active" &&
      current.rawBeforeAttemptLog !== baseline.rawBeforeAttemptLog &&
      appendedLogs.length === 0 &&
      (
        baseline.currentWorkVersion === 1 ||
        current.currentWorkVersion === 1 ||
        baseline.presentModules.includes("Attempt and Decision Log") ||
        current.presentModules.includes("Attempt and Decision Log")
      )
    ) {
      errors.push(
        `${current.sourcePath}: active project facts changed without an appended history entry`,
      );
    }

    if (baseline.placement === "active" && current.placement === "archive") {
      const baselineIssueIds = [...baseline.linkedIssueIds].sort();
      const archivedIssueIds = [...current.linkedIssueIds].sort();
      if (baselineIssueIds.join("|") !== archivedIssueIds.join("|")) {
        errors.push(
          `${current.sourcePath}: Closeout must preserve the active project's linked Issues exactly; change Issue ownership in a separate protected project update before closeout`,
        );
      }
      if (!current.closeout) {
        errors.push(
          `${current.sourcePath}: staged archive requires Closeout data for baseline transition validation`,
        );
      } else {
        if (current.closeout.previousWorkflowState !== baseline.workflowState) {
          errors.push(
            `${current.sourcePath}: Closeout previous workflow state ${current.closeout.previousWorkflowState} does not match baseline active state ${baseline.workflowState}`,
          );
        }
        if (
          current.closeout.terminalState === "Closed" &&
          baseline.workflowState !== "Closeout pending"
        ) {
          errors.push(
            `${current.sourcePath}: Closed is reachable only from an active Closeout pending baseline`,
          );
        }
      }
    }

    if (baseline.placement === "archive") {
      if (current.placement !== "archive") {
        errors.push(`${current.sourcePath}: archived project cannot move back to active without a reopen workflow`);
      }
      if (
        normalizeArchivedFrozenContent(current.rawBeforeAttemptLog) !==
        normalizeArchivedFrozenContent(baseline.rawBeforeAttemptLog)
      ) {
        errors.push(`${current.sourcePath}: archived content outside the history log was modified`);
      }
      for (const newLog of appendedLogs) {
        if (newLog.type !== "Correction") {
          errors.push(`${current.sourcePath}: archived history accepts only appended Correction entries`);
        }
      }
    }
  }
}

export function validateOperationalRecordSources(
  sources: OperationalRecordSourceMap,
  options: OperationalRecordValidationOptions,
): OperationalRecordValidationResult {
  const errors: string[] = [];
  if (!isRealIsoDate(options.asOf)) {
    errors.push(`validation asOf must use a real YYYY-MM-DD date`);
  }
  const asOf = isRealIsoDate(options.asOf) ? options.asOf : "1970-01-01";
  const changelogSources = Object.fromEntries(
    Object.entries(sources).filter(([sourcePath]) =>
      isChangelogSourcePath(sourcePath),
    ),
  );
  const nonChangelogSources = Object.fromEntries(
    Object.entries(sources).filter(
      ([sourcePath]) => !isChangelogSourcePath(sourcePath),
    ),
  );
  const baselineChangelogSources = options.baselineSources
    ? Object.fromEntries(
        Object.entries(options.baselineSources).filter(([sourcePath]) =>
          isChangelogSourcePath(sourcePath),
        ),
      )
    : undefined;
  const baselineOperationalSources = options.baselineSources
    ? Object.fromEntries(
        Object.entries(options.baselineSources).filter(
          ([sourcePath]) => !isChangelogSourcePath(sourcePath),
        ),
      )
    : undefined;
  const changelogResult = validateChangelogRecordSources(changelogSources, {
    asOf,
    baselineSources: baselineChangelogSources,
  });
  errors.push(...changelogResult.errors);

  const records = parseOperationalSources(nonChangelogSources, asOf, errors);
  validateUniqueIds(records, errors);

  const issues = records
    .filter((record): record is IssueRecord => record.kind === "issue")
    .sort(compareIssueRecords);
  const projects = records.filter(
    (record): record is CurrentWorkRecord => record.kind === "current_work",
  );
  validateUniqueNestedIds(projects, errors);
  const authoredActiveProjects = projects
    .filter((project) => project.placement === "active")
    .sort(compareCurrentWorkProjects);
  const archivedProjects = projects
    .filter((project) => project.placement === "archive")
    .sort((left, right) => left.id.localeCompare(right.id));
  const changelogEntries = changelogResult.registry.records;
  const effectiveChangelogRoots = changelogResult.registry.effectiveEntries.map(
    (entry) => entry.effectiveRecord,
  );

  validateProjectLinks(
    issues,
    authoredActiveProjects,
    archivedProjects,
    effectiveChangelogRoots,
    errors,
  );
  if (baselineOperationalSources) {
    validateBaselineHistory(records, baselineOperationalSources, asOf, errors);
  }

  const activeProjects =
    authoredActiveProjects.length === 1 &&
    !authoredActiveProjects[0].primaryResumeTarget
      ? [
          deepFreeze({
            ...authoredActiveProjects[0],
            primaryResumeTarget: true,
          }),
        ]
      : authoredActiveProjects;

  const registry = deepFreeze({
    asOf,
    issues,
    activeProjects,
    archivedProjects,
    changelogEntries,
    changelogRegistry: changelogResult.registry,
    openIssueCount: issues.filter((issue) => issue.status === "open").length,
  });
  const uniqueErrors = [...new Set(errors)].sort();
  return deepFreeze({
    ok: uniqueErrors.length === 0,
    errors: uniqueErrors,
    registry,
  });
}

export function buildOperationalRecordRegistry(
  sources: OperationalRecordSourceMap,
  options: OperationalRecordValidationOptions,
) {
  const result = validateOperationalRecordSources(sources, options);
  if (!result.ok) {
    throw new OperationalRecordValidationError(result.errors);
  }
  return result.registry;
}
