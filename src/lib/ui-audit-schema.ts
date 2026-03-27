export const QUALITY_HUB_VERSION = "quality-hub-v1" as const;

export const QUALITY_SEVERITIES = [
  "critical",
  "high",
  "medium",
  "low",
  "stylistic",
] as const;

export const QUALITY_CONFIDENCE = ["confirmed", "likely", "preference"] as const;

export const QUALITY_DOMAINS = [
  "ui-ux",
  "functionality",
  "orphan-code",
  "cleanup",
  "accessibility",
  "performance",
  "security",
  "tests",
  "build",
  "data-integrity",
  "documentation",
] as const;

export const QUALITY_FINDING_STATUS = [
  "open",
  "in-progress",
  "fixed",
  "verified",
  "deferred",
  "rejected",
] as const;

export const QUALITY_VERIFICATION_STATUS = [
  "unverified",
  "retest-required",
  "verified",
] as const;

export const QUALITY_FIX_LEVEL = [
  "design-system",
  "shared-component",
  "feature-module",
  "page-level",
  "data-layer",
  "build-tooling",
  "infrastructure",
  "unknown",
] as const;

export const QUALITY_IMPLEMENTATION_DIFFICULTY = [
  "small",
  "medium",
  "large",
  "unknown",
] as const;

export const QUALITY_SOURCE_KIND = [
  "agent-scan",
  "automated-check",
  "manual-review",
  "imported-external",
] as const;

export const QUALITY_RUN_PROFILE = ["quick", "standard", "deep"] as const;

export const QUALITY_RUN_STATUS = ["completed", "failed", "partial"] as const;

export const CHANGE_LOG_SEVERITY = [
  "patch",
  "fix",
  "refactor",
  "feature",
  "breaking",
] as const;

export const CHANGE_LOG_STATUS = [
  "planned",
  "in-progress",
  "completed",
] as const;

export const QUALITY_REVIEW_STATUS = ["pending", "in-progress", "reviewed"] as const;

export const QUALITY_MODULE_STATUS = [
  "not-started",
  "in-progress",
  "completed",
  "blocked",
] as const;

export type QualitySeverity = (typeof QUALITY_SEVERITIES)[number];
export type QualityConfidence = (typeof QUALITY_CONFIDENCE)[number];
export type QualityDomain = (typeof QUALITY_DOMAINS)[number];
export type QualityFindingStatus = (typeof QUALITY_FINDING_STATUS)[number];
export type QualityVerificationStatus = (typeof QUALITY_VERIFICATION_STATUS)[number];
export type QualityFixLevel = (typeof QUALITY_FIX_LEVEL)[number];
export type QualityImplementationDifficulty =
  (typeof QUALITY_IMPLEMENTATION_DIFFICULTY)[number];
export type QualitySourceKind = (typeof QUALITY_SOURCE_KIND)[number];
export type QualityRunProfile = (typeof QUALITY_RUN_PROFILE)[number];
export type QualityRunStatus = (typeof QUALITY_RUN_STATUS)[number];
export type QualityReviewStatus = (typeof QUALITY_REVIEW_STATUS)[number];
export type QualityModuleStatus = (typeof QUALITY_MODULE_STATUS)[number];
export type ChangeLogSeverity = (typeof CHANGE_LOG_SEVERITY)[number];
export type ChangeLogStatus = (typeof CHANGE_LOG_STATUS)[number];

export interface QualityAgent {
  id: string;
  agentName: string;
  modelName: string;
  platform: string;
}

export interface QualityAgentStamp {
  agent: QualityAgent;
  runId: string;
  timestamp: string;
}

export interface QualityFindingComment {
  id: string;
  author: string;
  timestamp: string;
  text: string;
}

export interface QualityFinding {
  id: string;
  title: string;
  severity: QualitySeverity;
  confidence: QualityConfidence;
  domain: QualityDomain;
  category: string;
  status: QualityFindingStatus;
  verificationStatus: QualityVerificationStatus;
  page: string;
  route?: string;
  component?: string;
  files: string[];
  tags: string[];
  evidence: string[];
  currentState: string;
  problem: string;
  whyItMatters: string;
  userImpact: string;
  recommendation: string;
  reproSteps: string[];
  expectedBehavior: string;
  actualBehavior: string;
  sourceKind: QualitySourceKind;
  fixLevel: QualityFixLevel;
  implementationDifficulty: QualityImplementationDifficulty;
  batchable: boolean;
  designSystemLevel: boolean;
  foundBy: QualityAgentStamp;
  verifiedBy?: QualityAgentStamp;
  contributors: QualityAgent[];
  relatedFindingIds: string[];
  comments: QualityFindingComment[];
  createdAt: string;
  updatedAt: string;
}

export interface QualityReviewUnit {
  id: string;
  name: string;
  route?: string;
  files: string[];
  notes: string;
  status: QualityReviewStatus;
  lastRunId?: string;
}

export interface QualityScanModule {
  id: string;
  name: string;
  description: string;
  status: QualityModuleStatus;
  priority: "high" | "medium" | "low";
  lastRunId?: string;
  notes?: string;
}

export interface QualityRunSummary {
  findingsTotal: number;
  newFindings: number;
  critical: number;
  high: number;
  open: number;
  verified: number;
}

export interface QualityScanRun {
  id: string;
  name: string;
  profile: QualityRunProfile;
  status: QualityRunStatus;
  startedAt: string;
  finishedAt: string;
  agent: QualityAgent;
  scope: string[];
  summary: QualityRunSummary;
  notes: string;
  importedFrom?: string;
}

export interface QualityHubMeta {
  version: typeof QUALITY_HUB_VERSION;
  registryVersion?: number;
  project: string;
  createdAt: string;
  lastUpdatedAt: string;
  lastRunId?: string;
}

export interface ChangeLogEntry {
  id: string;
  title: string;
  summary: string;
  severity: ChangeLogSeverity;
  status: ChangeLogStatus;
  problem: string;
  plan: string;
  changes: string;
  filesAffected: string[];
  agent: string;
  relatedFindingIds: string[];
  tags: string[];
  comments: QualityFindingComment[];
  createdAt: string;
  updatedAt: string;
}

export interface QualityHubRegistry {
  meta: QualityHubMeta;
  scanModules: QualityScanModule[];
  runs: QualityScanRun[];
  findings: QualityFinding[];
  reviewUnits: QualityReviewUnit[];
  changeLog: ChangeLogEntry[];
  handoffNotes: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isQualityHubRegistry(input: unknown): input is QualityHubRegistry {
  if (!isRecord(input)) return false;
  if (!isRecord(input.meta)) return false;
  if (!Array.isArray(input.scanModules) || !Array.isArray(input.runs) || !Array.isArray(input.findings) || !Array.isArray(input.reviewUnits)) return false;
  if (typeof input.meta.version !== "string" || typeof input.meta.project !== "string") return false;
  // changeLog may be absent in older exports — that's OK
  if (input.changeLog !== undefined && !Array.isArray(input.changeLog)) return false;
  return true;
}

export function makeAgentId(agentName: string, modelName: string): string {
  return `${agentName}:${modelName}`.toLowerCase().replace(/\s+/g, "-");
}
