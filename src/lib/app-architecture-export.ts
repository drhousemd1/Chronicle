export interface AppArchitectureExportDetail {
  label: string;
  values: string[];
}

export interface AppArchitectureExportRow {
  title: string;
  type: string;
  summary: string;
  note?: string;
  signal?: string;
  security?: boolean;
  details: AppArchitectureExportDetail[];
}

export interface AppArchitectureExportFile {
  path: string;
  name: string;
  type: string;
  description: string;
  metric: string;
  metricDescription: string;
  fileNote?: string;
  fileSignal?: string;
  imports: string[];
  importedBy: string[];
  tables: string[];
  tableReads: string[];
  tableWrites: string[];
  rpcs: string[];
  edgeFunctions: string[];
  storageBuckets: string[];
  storageReads: string[];
  storageWrites: string[];
  browserStorageReads: string[];
  browserStorageWrites: string[];
  rows: AppArchitectureExportRow[];
}

export interface AppArchitectureExportNavSection {
  title: string;
  path?: string;
  entries: string[];
}

export interface AppArchitectureExportSchemaColumn {
  name: string;
  type: string;
  nullable: boolean;
  default: string | null;
  primaryKey?: boolean;
}

export interface AppArchitectureExportSchemaPolicy {
  name: string;
  command?: string;
}

export interface AppArchitectureExportSchemaTable {
  name: string;
  columns: AppArchitectureExportSchemaColumn[];
  indexes: string[];
  policies: AppArchitectureExportSchemaPolicy[];
  usedBy: string[];
}

export interface AppArchitectureExportSchemaFunction {
  name: string;
  returns?: string;
  language?: string;
  usedBy: string[];
}

export interface AppArchitectureExportSchemaBucket {
  name: string;
  public?: boolean;
  usedBy: string[];
}

export interface AppArchitectureExportSchemaEdgeFunction {
  name: string;
  tablesReferenced: string[];
  usedBy: string[];
  paidAiPath?: boolean;
}

export interface AppArchitectureExportModel {
  generatedAt: string;
  repoName: string;
  rootPath: string;
  sourcePathCount: number;
  staticPaths: string[];
  navSections: AppArchitectureExportNavSection[];
  files: AppArchitectureExportFile[];
  schema: {
    exportedAt: string;
    tables: AppArchitectureExportSchemaTable[];
    databaseFunctions: AppArchitectureExportSchemaFunction[];
    storageBuckets: AppArchitectureExportSchemaBucket[];
    edgeFunctions: AppArchitectureExportSchemaEdgeFunction[];
  };
}

function compactText(value: string | undefined | null) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function pushMarkdownDetail(lines: string[], label: string, value: string | undefined | null) {
  const text = compactText(value);
  if (!text) return;
  lines.push(`- ${label}: ${text}`);
}

function pushMarkdownValues(lines: string[], label: string, values: string[]) {
  const clean = values.map(compactText).filter(Boolean);
  if (clean.length === 0) return;
  lines.push(`- ${label}: ${clean.join("; ")}`);
}

function formatBoolean(value: boolean | undefined) {
  if (value === undefined) return undefined;
  return value ? "yes" : "no";
}

function heading(level: number, text: string) {
  return `${"#".repeat(level)} ${text}`;
}

export function buildAppArchitectureMarkdown(model: AppArchitectureExportModel) {
  const lines: string[] = [
    "# Chronicle App Architecture",
    "",
    `Generated: ${model.generatedAt}`,
    "",
    "This document is generated from the same App Architecture data rendered in the Chronicle style-guide architecture page. It is intended as a pasteable text export for codebase review, LLM research packets, and architecture audits.",
    "",
    "## Snapshot",
    "",
  ];

  pushMarkdownDetail(lines, "Repo", model.repoName);
  pushMarkdownDetail(lines, "Root path", model.rootPath);
  pushMarkdownDetail(lines, "Source path count", String(model.sourcePathCount));
  pushMarkdownDetail(lines, "Exported backend schema date", model.schema.exportedAt);
  pushMarkdownDetail(lines, "Files exported", String(model.files.length));
  pushMarkdownDetail(lines, "Database tables", String(model.schema.tables.length));
  pushMarkdownDetail(lines, "Database functions", String(model.schema.databaseFunctions.length));
  pushMarkdownDetail(lines, "Storage buckets", String(model.schema.storageBuckets.length));
  pushMarkdownDetail(lines, "Edge functions", String(model.schema.edgeFunctions.length));

  if (model.staticPaths.length > 0) {
    lines.push("");
    lines.push("## Static Root And Tooling Paths");
    lines.push("");
    model.staticPaths.forEach((path) => lines.push(`- ${path}`));
  }

  if (model.navSections.length > 0) {
    lines.push("");
    lines.push("## Curated Navigation");
    model.navSections.forEach((section) => {
      lines.push("");
      lines.push(heading(3, section.title));
      pushMarkdownDetail(lines, "Path", section.path);
      section.entries.forEach((entry) => lines.push(`- ${entry}`));
    });
  }

  lines.push("");
  lines.push("## File Architecture");

  model.files.forEach((file) => {
    lines.push("");
    lines.push(heading(3, file.path));
    lines.push("");
    pushMarkdownDetail(lines, "Name", file.name);
    pushMarkdownDetail(lines, "Type", file.type);
    pushMarkdownDetail(lines, "Metric", file.metric);
    pushMarkdownDetail(lines, "Metric meaning", file.metricDescription);
    pushMarkdownDetail(lines, "File signal", file.fileSignal);
    pushMarkdownDetail(lines, "File note", file.fileNote);
    pushMarkdownDetail(lines, "Description", file.description);
    pushMarkdownValues(lines, "Imports", file.imports);
    pushMarkdownValues(lines, "Imported by", file.importedBy);
    pushMarkdownValues(lines, "Tables", file.tables);
    pushMarkdownValues(lines, "Table reads", file.tableReads);
    pushMarkdownValues(lines, "Table writes", file.tableWrites);
    pushMarkdownValues(lines, "RPCs", file.rpcs);
    pushMarkdownValues(lines, "Edge functions", file.edgeFunctions);
    pushMarkdownValues(lines, "Storage buckets", file.storageBuckets);
    pushMarkdownValues(lines, "Storage reads", file.storageReads);
    pushMarkdownValues(lines, "Storage writes", file.storageWrites);
    pushMarkdownValues(lines, "Browser storage reads", file.browserStorageReads);
    pushMarkdownValues(lines, "Browser storage writes", file.browserStorageWrites);

    if (file.rows.length > 0) {
      lines.push("");
      lines.push("Architecture rows:");
      file.rows.forEach((row) => {
        lines.push("");
        lines.push(`#### ${row.title}`);
        pushMarkdownDetail(lines, "Type", row.type);
        pushMarkdownDetail(lines, "Summary", row.summary);
        pushMarkdownDetail(lines, "Signal", row.signal);
        pushMarkdownDetail(lines, "Security-sensitive", formatBoolean(row.security));
        pushMarkdownDetail(lines, "Note", row.note);
        row.details.forEach((detail) => pushMarkdownValues(lines, detail.label, detail.values));
      });
    }
  });

  lines.push("");
  lines.push("## Backend Schema Inventory");
  lines.push("");
  lines.push("This section is generated from the App Architecture schema snapshot. If Lovable changes backend tables, policies, functions, or storage, refresh the schema inventory before treating this section as current.");

  lines.push("");
  lines.push("### Tables");
  model.schema.tables.forEach((table) => {
    lines.push("");
    lines.push(`#### ${table.name}`);
    pushMarkdownDetail(lines, "Columns", String(table.columns.length));
    pushMarkdownDetail(lines, "Indexes", String(table.indexes.length));
    pushMarkdownDetail(lines, "RLS policies", String(table.policies.length));
    pushMarkdownValues(lines, "Used by", table.usedBy);
    table.columns.forEach((column) => {
      const meta = [
        column.primaryKey ? "primary key" : "",
        column.nullable ? "nullable" : "required",
        column.default ? `default ${column.default}` : "",
      ].filter(Boolean).join(", ");
      lines.push(`- ${column.name}: ${column.type}${meta ? ` (${meta})` : ""}`);
    });
    if (table.indexes.length > 0) {
      pushMarkdownValues(lines, "Indexes", table.indexes);
    }
    if (table.policies.length > 0) {
      pushMarkdownValues(
        lines,
        "Policies",
        table.policies.map((policy) => policy.command ? `${policy.name} (${policy.command})` : policy.name),
      );
    }
  });

  lines.push("");
  lines.push("### Database Functions");
  model.schema.databaseFunctions.forEach((fn) => {
    lines.push("");
    lines.push(`#### ${fn.name}`);
    pushMarkdownDetail(lines, "Returns", fn.returns);
    pushMarkdownDetail(lines, "Language", fn.language);
    pushMarkdownValues(lines, "Used by", fn.usedBy);
  });

  lines.push("");
  lines.push("### Storage Buckets");
  model.schema.storageBuckets.forEach((bucket) => {
    lines.push("");
    lines.push(`#### ${bucket.name}`);
    pushMarkdownDetail(lines, "Public", formatBoolean(bucket.public));
    pushMarkdownValues(lines, "Used by", bucket.usedBy);
  });

  lines.push("");
  lines.push("### Edge Functions");
  model.schema.edgeFunctions.forEach((edgeFunction) => {
    lines.push("");
    lines.push(`#### ${edgeFunction.name}`);
    pushMarkdownDetail(lines, "Paid AI path", formatBoolean(edgeFunction.paidAiPath));
    pushMarkdownValues(lines, "Tables referenced", edgeFunction.tablesReferenced);
    pushMarkdownValues(lines, "Used by", edgeFunction.usedBy);
  });

  return `${lines.join("\n").replace(/\n{3,}/g, "\n\n")}\n`;
}
