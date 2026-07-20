export type ManualArchitectureFilter =
  | "all"
  | "service"
  | "hook"
  | "context"
  | "component"
  | "feature"
  | "code-logic"
  | "context-injection"
  | "data-block"
  | "db-table"
  | "db-migration"
  | "edge-fn"
  | "integration"
  | "documentation"
  | "tooling"
  | "script"
  | "test"
  | "api-call"
  | "security";

export type ManualArchitectureBadgeClass =
  | "component"
  | "feature"
  | "code-logic"
  | "data-block"
  | "context-injection"
  | "edge-fn"
  | "db-table"
  | "integration"
  | "api-call"
  | "hook"
  | "context"
  | "documentation"
  | "tooling"
  | "script"
  | "test"
  | "db-migration";

export type ManualArchitectureDetailKind =
  | "files"
  | "tables"
  | "rpcs"
  | "edges"
  | "buckets"
  | "plain";

export type ManualArchitectureDetail = {
  label: string;
  values: string[];
  kind: ManualArchitectureDetailKind;
};

export type ManualArchitectureRow = {
  id: string;
  title: string;
  summary: string;
  badgeLabel: string;
  badgeClass: ManualArchitectureBadgeClass;
  details: ManualArchitectureDetail[];
  signal?: "refactor" | "issue";
  note?: string;
  security?: boolean;
};

export type ManualArchitectureHeader = {
  label:
    | "TOOLING"
    | "SERVICE"
    | "HOOK"
    | "CONTEXT PROVIDER"
    | "REACT COMPONENT"
    | "INTEGRATION"
    | "DOCUMENTATION"
    | "SCRIPT"
    | "TEST"
    | "EDGE FUNCTION"
    | "DB MIGRATION"
    | "CODE LOGIC"
    | "ASSET";
  className:
    | "tooling"
    | "service"
    | "hook"
    | "context"
    | "component"
    | "integration"
    | "documentation"
    | "script"
    | "test"
    | "edge-fn"
    | "db-migration"
    | "code-logic";
  filterValue: ManualArchitectureFilter;
  navAccent:
    | "tooling"
    | "service"
    | "hook"
    | "context"
    | "component"
    | "integration"
    | "documentation"
    | "script"
    | "test"
    | "edge-fn"
    | "db-migration"
    | "code-logic";
};

export type ManualArchitectureFile = {
  path: `/${string}`;
  header: ManualArchitectureHeader;
  metric: string;
  metricDescription: string;
  description: string;
  rows: ManualArchitectureRow[];
  reviewedSource: string;
};

export function defineManualArchitectureFiles(
  files: readonly ManualArchitectureFile[],
): readonly ManualArchitectureFile[] {
  return files;
}
