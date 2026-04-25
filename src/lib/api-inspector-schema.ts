export const API_ARCHITECTURE_PACKAGE_TYPE = "chronicle-api-architecture-map" as const;
export const API_ARCHITECTURE_PACKAGE_VERSION = 1 as const;

export const API_MAP_TAG_TYPES = [
  "code-logic",
  "validation-check",
  "core-prompt",
  "data-block",
  "context-injection",
] as const;

export type ApiMapTagType = (typeof API_MAP_TAG_TYPES)[number];

export interface ApiMapFileRef {
  path: string;
  lines?: string;
  note?: string;
}

export interface ApiMapSubItem {
  id: string;
  title: string;
  description: string;
}

export interface ApiMapCrossRef {
  badge: string;
  targetItemId: string;
  label: string;
  tooltip: string;
}

export interface ApiMapItem {
  id: string;
  title: string;
  tagType: ApiMapTagType;
  icon: string;
  purpose: string;
  whyItExists?: string;
  problemSolved?: string;
  settingsGate?: string;
  dataSource?: string;
  fileRefs: ApiMapFileRef[];
  codeSource?: string;
  codeSourceLabel?: string;
  promptViewEnabled?: boolean;
  subItems?: ApiMapSubItem[];
  crossRefs?: ApiMapCrossRef[];
}

export interface ApiMapSection {
  id: string;
  title: string;
  description: string;
  defaultOpen?: boolean;
  items: ApiMapItem[];
}

export interface ApiMapPhase {
  id: string;
  title: string;
  subtitle: string;
  defaultOpen?: boolean;
  sections: ApiMapSection[];
}

export interface GrokReferenceRow {
  label: string;
  value: string;
}

export interface GrokReferenceTable {
  title: string;
  columns: string[];
  rows: string[][];
}

export interface GrokReferenceSection {
  id: string;
  title: string;
  description?: string;
  rows?: GrokReferenceRow[];
  tables?: GrokReferenceTable[];
  caveat?: string;
}

export interface ApiMapLegendRule {
  id: string;
  title: string;
  body: string;
}

export interface ApiMapLegendExample {
  id: string;
  title: string;
  body: string;
}

export interface ApiMapLegend {
  title: string;
  subtitle: string;
  rules: ApiMapLegendRule[];
  examples: ApiMapLegendExample[];
}

export interface ApiMapLLMInstruction {
  id: string;
  text: string;
}

export interface ApiMapChangelogEntry {
  id: string;
  timestamp: string;
  title: string;
  author: string;
  problem: string;
  previousAttempt: string;
  changeMade: string;
  filesTouched: string[];
  expectedOutcome: string;
  actualOutcome: string;
}

export interface ApiMapMeta {
  id: string;
  name: string;
  project: string;
  generatedAt: string;
  lastUpdatedAt: string;
  sourcePolicy: string;
}

export interface ApiArchitectureMapRegistry {
  meta: ApiMapMeta;
  legend: ApiMapLegend;
  grokReference: GrokReferenceSection[];
  llmInstructions: ApiMapLLMInstruction[];
  phases: ApiMapPhase[];
  changelog: ApiMapChangelogEntry[];
}

export interface ApiArchitectureMapPackage {
  packageType: typeof API_ARCHITECTURE_PACKAGE_TYPE;
  packageVersion: typeof API_ARCHITECTURE_PACKAGE_VERSION;
  exportedAt: string;
  registry: ApiArchitectureMapRegistry;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isApiArchitectureMapRegistry(value: unknown): value is ApiArchitectureMapRegistry {
  if (!isRecord(value)) return false;
  if (!isRecord(value.meta)) return false;

  return (
    typeof value.meta.id === "string" &&
    typeof value.meta.name === "string" &&
    typeof value.meta.project === "string" &&
    Array.isArray(value.phases) &&
    Array.isArray(value.changelog) &&
    Array.isArray(value.llmInstructions)
  );
}

export function isApiArchitectureMapPackage(value: unknown): value is ApiArchitectureMapPackage {
  if (!isRecord(value)) return false;
  if (value.packageType !== API_ARCHITECTURE_PACKAGE_TYPE) return false;
  if (value.packageVersion !== API_ARCHITECTURE_PACKAGE_VERSION) return false;
  return isApiArchitectureMapRegistry(value.registry);
}
