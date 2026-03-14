export const UI_AUDIT_SEVERITIES = [
  "critical",
  "high",
  "medium",
  "low",
  "stylistic",
] as const;

export const UI_AUDIT_CONFIDENCE = [
  "confirmed",
  "likely",
  "preference",
] as const;

export const UI_AUDIT_CATEGORIES = [
  "color",
  "typography",
  "spacing",
  "layout",
  "component",
  "accessibility",
  "responsive",
  "navigation",
  "forms",
  "interaction",
  "state",
  "design-system",
  "implementation",
  "content-ux",
  "token-drift",
] as const;

export const UI_AUDIT_SOURCE_OF_TRUTH = [
  "research-brief",
  "style-guide",
  "code-observation",
  "multi-source",
] as const;

export const UI_AUDIT_FIX_LEVEL = [
  "design-system",
  "shared-component",
  "page-level",
  "content-ux",
  "accessibility",
  "responsive",
  "unknown",
] as const;

export const UI_AUDIT_IMPLEMENTATION_DIFFICULTY = [
  "small",
  "medium",
  "large",
  "unknown",
] as const;

export const UI_AUDIT_STATUS = ["open", "reviewed", "deferred"] as const;

export const UI_AUDIT_REVIEW_STATUS = [
  "reviewed",
  "in-progress",
  "pending",
] as const;

export const UI_AUDIT_COLOR_DECISIONS = [
  "keep",
  "merge",
  "deprecate",
] as const;

export const UI_AUDIT_COLOR_PRIORITY = ["now", "next", "later"] as const;

export const UI_AUDIT_COLOR_SCOPE = [
  "app-wide",
  "page-specific",
  "mixed",
] as const;

export const UI_AUDIT_STATE_COVERAGE = [
  "covered",
  "partial",
  "missing",
  "not-applicable",
] as const;

export const UI_AUDIT_INTERACTION_SEMANTICS = [
  "semantic",
  "mixed",
  "non-semantic",
] as const;

export const UI_AUDIT_COMPONENT_FAMILIES = [
  "button",
  "card",
  "panel",
  "modal",
  "input",
  "chip-badge",
  "navigation",
  "unknown",
] as const;

export const UI_AUDIT_VARIANT_CLASSIFICATION = [
  "shared",
  "near-duplicate",
  "one-off",
  "conflicted",
] as const;

export type UiAuditSeverity = (typeof UI_AUDIT_SEVERITIES)[number];
export type UiAuditConfidence = (typeof UI_AUDIT_CONFIDENCE)[number];
export type UiAuditCategory = (typeof UI_AUDIT_CATEGORIES)[number];
export type UiAuditSourceOfTruth = (typeof UI_AUDIT_SOURCE_OF_TRUTH)[number];
export type UiAuditFixLevel = (typeof UI_AUDIT_FIX_LEVEL)[number];
export type UiAuditImplementationDifficulty =
  (typeof UI_AUDIT_IMPLEMENTATION_DIFFICULTY)[number];
export type UiAuditStatus = (typeof UI_AUDIT_STATUS)[number];
export type UiAuditReviewStatus = (typeof UI_AUDIT_REVIEW_STATUS)[number];
export type UiAuditColorDecision = (typeof UI_AUDIT_COLOR_DECISIONS)[number];
export type UiAuditColorPriority = (typeof UI_AUDIT_COLOR_PRIORITY)[number];
export type UiAuditColorScope = (typeof UI_AUDIT_COLOR_SCOPE)[number];
export type UiAuditStateCoverage = (typeof UI_AUDIT_STATE_COVERAGE)[number];
export type UiAuditInteractionSemantics =
  (typeof UI_AUDIT_INTERACTION_SEMANTICS)[number];
export type UiAuditComponentFamily = (typeof UI_AUDIT_COMPONENT_FAMILIES)[number];
export type UiAuditVariantClassification =
  (typeof UI_AUDIT_VARIANT_CLASSIFICATION)[number];

export interface UiAuditFinding {
  id: string;
  title: string;
  severity: UiAuditSeverity;
  confidence: UiAuditConfidence;
  category: UiAuditCategory;
  page: string;
  route?: string;
  component?: string;
  files: string[];
  evidence: string[];
  currentState: string;
  problem: string;
  whyItMatters: string;
  userImpact: string;
  recommendation: string;
  sourceOfTruth: UiAuditSourceOfTruth;
  fixLevel: UiAuditFixLevel;
  designSystemLevel: boolean;
  implementationDifficulty: UiAuditImplementationDifficulty;
  batchable: boolean;
  status: UiAuditStatus;
}

export interface UiAuditReviewUnit {
  id: string;
  name: string;
  route?: string;
  component?: string;
  files: string[];
  status: UiAuditReviewStatus;
  notes: string;
}

export interface UiAuditScope {
  sources: string[];
  startedOn: string;
  updatedOn: string;
  notes: string;
}

export interface UiAuditTaxonomy {
  severities: readonly UiAuditSeverity[];
  confidence: readonly UiAuditConfidence[];
  categories: readonly UiAuditCategory[];
}

export interface UiAuditColorConsolidationItem {
  id: string;
  decision: UiAuditColorDecision;
  sourceColors: string[];
  targetColor: string;
  semanticRole: string;
  scope: UiAuditColorScope;
  priority: UiAuditColorPriority;
  rationale: string;
  evidence: string[];
  sampleFiles: string[];
}

export interface UiAuditInteractionStateCoverage {
  rest: UiAuditStateCoverage;
  hover: UiAuditStateCoverage;
  focusVisible: UiAuditStateCoverage;
  active: UiAuditStateCoverage;
  disabled: UiAuditStateCoverage;
  loading: UiAuditStateCoverage;
}

export interface UiAuditInteractionStateMatrixRow {
  id: string;
  pattern: string;
  page: string;
  route?: string;
  component: string;
  files: string[];
  stateCoverage: UiAuditInteractionStateCoverage;
  keyboardParity: UiAuditStateCoverage;
  semantics: UiAuditInteractionSemantics;
  severity: UiAuditSeverity;
  confidence: UiAuditConfidence;
  systemic: boolean;
  evidence: string[];
  currentState: string;
  recommendation: string;
}

export interface UiAuditComponentVariantDriftItem {
  id: string;
  family: UiAuditComponentFamily;
  variantName: string;
  classification: UiAuditVariantClassification;
  severity: UiAuditSeverity;
  confidence: UiAuditConfidence;
  files: string[];
  evidence: string[];
  currentState: string;
  problem: string;
  recommendation: string;
  estimatedReuseCount: number;
  designSystemCandidate: boolean;
  fixLevel: UiAuditFixLevel;
}
