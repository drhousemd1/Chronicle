import type { ApiInspectorReview } from "@/data/api-inspector-review";

export interface PipelineExportFileRef {
  path: string;
  lines?: string;
  note?: string;
}

export interface PipelineExportDetail {
  id: string;
  label: string;
  text: string;
}

export interface PipelineExportCrossRef {
  badge: string;
  targetId: string;
  label: string;
  tooltip: string;
}

export interface PipelineExportItem {
  id: string;
  title: string;
  summary: string;
  whyItExists?: string;
  problemSolved?: string;
  tag: string;
  settingsGate?: string;
  ownerPath: string;
  ownerFolderPath: string;
  ownerFileName: string;
  fileRefs: PipelineExportFileRef[];
  details: PipelineExportDetail[];
  dataSource?: string;
  codeSource?: string;
  codeSourceLabel?: string;
  promptViewEnabled?: boolean;
  crossRefs?: PipelineExportCrossRef[];
  review?: ApiInspectorReview;
  meta?: string[];
}

export interface PipelineExportGroup {
  id: string;
  title: string;
  description: string;
  defaultOpen: boolean;
  items: PipelineExportItem[];
}

export interface PipelineExportPhase {
  id: string;
  title: string;
  subtitle: string;
  defaultOpen: boolean;
  groups: PipelineExportGroup[];
}

export interface PipelineExportShell {
  id: string;
  kicker: string;
  title: string;
  subtitle: string;
  navLabel: string;
  navSubtitle: string;
  phases: PipelineExportPhase[];
}

export interface PipelineExportModel {
  shells: PipelineExportShell[];
}

const TAG_LABELS: Record<string, string> = {
  "code-logic": "Code Logic",
  "context-injection": "Context Injection",
  "core-prompt": "Core Prompt",
  "data-block": "Data Block",
  validation: "Validation Check",
  "validation-check": "Validation Check",
  service: "Service Call",
  "edge-function": "Edge Function",
  storage: "Storage Lane",
  rpc: "RPC",
  database: "Database",
  "api-call": "API Call",
};

function normalizeMarkdownText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function appendMarkdownDetail(lines: string[], label: string, value?: string) {
  const text = value ? normalizeMarkdownText(value) : "";
  if (!text) return;
  lines.push(`- ${label}: ${text}`);
}

function appendMarkdownSourceBlock(lines: string[], title: string, source: string) {
  const text = source.trim();
  if (!text) return;
  const longestBacktickRun = Math.max(2, ...Array.from(text.matchAll(/`+/g), (match) => match[0].length));
  const fence = "`".repeat(longestBacktickRun + 1);

  lines.push("");
  lines.push(`###### ${title}`);
  lines.push("");
  lines.push(`${fence}text`);
  lines.push(text);
  lines.push(fence);
}

function mergeIntervals(intervals: Array<[number, number]>) {
  if (intervals.length === 0) return intervals;
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [sorted[0]];

  for (let index = 1; index < sorted.length; index += 1) {
    const [start, end] = sorted[index];
    const last = merged[merged.length - 1];
    if (start <= last[1] + 1) {
      last[1] = Math.max(last[1], end);
    } else {
      merged.push([start, end]);
    }
  }

  return merged;
}

function extractIntervals(spec?: string): Array<[number, number]> {
  if (!spec) return [];
  const intervals: Array<[number, number]> = [];
  const rangeMatches = spec.matchAll(/~?(\d+)\s*-\s*~?(\d+)/g);
  for (const match of rangeMatches) {
    const start = Number(match[1]);
    const end = Number(match[2]);
    if (Number.isNaN(start) || Number.isNaN(end)) continue;
    intervals.push([Math.min(start, end), Math.max(start, end)]);
  }
  if (intervals.length > 0) return intervals;
  if (spec.includes("~")) return [];

  const singleMatches = spec.matchAll(/\b(\d+)\b/g);
  for (const match of singleMatches) {
    const line = Number(match[1]);
    if (Number.isNaN(line)) continue;
    intervals.push([line, line]);
  }

  return intervals;
}

function getItemReferencedLineCount(fileRefs: PipelineExportFileRef[]): number | null {
  const grouped = new Map<string, Array<[number, number]>>();

  fileRefs.forEach((fileRef) => {
    const intervals = extractIntervals(fileRef.lines);
    if (intervals.length === 0) return;
    const path = fileRef.path.startsWith("/") ? fileRef.path : `/${fileRef.path}`;
    const next = grouped.get(path) ?? [];
    next.push(...intervals);
    grouped.set(path, next);
  });

  if (grouped.size === 0) return null;

  let total = 0;
  grouped.forEach((intervals) => {
    total += mergeIntervals(intervals).reduce((sum, [start, end]) => sum + (end - start + 1), 0);
  });

  return total > 0 ? total : null;
}

function formatLineCountLabel(lineCount: number) {
  return `${lineCount.toLocaleString()} ${lineCount === 1 ? "line" : "lines"}`;
}

function formatFileRef(fileRef: PipelineExportFileRef) {
  if (fileRef.lines && fileRef.note) return `${fileRef.path} - ${fileRef.lines} - ${fileRef.note}`;
  if (fileRef.lines) return `${fileRef.path} - ${fileRef.lines}`;
  if (fileRef.note) return `${fileRef.path} - ${fileRef.note}`;
  return fileRef.path;
}

function getSourceViewLabel(item: Pick<PipelineExportItem, "codeSourceLabel" | "promptViewEnabled">) {
  return item.codeSourceLabel ?? (item.promptViewEnabled ? "Prompt / Source View" : "Source Snapshot");
}

function formatReviewDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

function formatReviewMeta(review: ApiInspectorReview) {
  const reviewedBy = review.reviewedBy ? ` by ${review.reviewedBy}` : "";
  return `${formatReviewDate(review.lastReviewedAt)}${reviewedBy}`;
}

export function buildRoleplayPipelineMarkdown(model: PipelineExportModel) {
  const lines: string[] = [
    "# Chronicle Roleplay Pipeline",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "This document is generated from the same Roleplay Pipeline data rendered in the style-guide inspector. It is meant to be a readable review export for the live roleplay flow, support systems, adjacent calls, coverage audits, source references, and prompt/source snapshots exposed by the inspector cards.",
    "",
    "## Contents",
    "",
  ];

  model.shells.forEach((shell) => {
    lines.push(`- ${shell.title}`);
    shell.phases.forEach((phase) => {
      lines.push(`  - ${phase.title}`);
    });
  });

  model.shells.forEach((shell) => {
    lines.push("");
    lines.push(`## ${shell.title}`);
    lines.push("");
    appendMarkdownDetail(lines, "Kicker", shell.kicker);
    appendMarkdownDetail(lines, "Navigation label", shell.navLabel);
    appendMarkdownDetail(lines, "Navigation subtitle", shell.navSubtitle);
    appendMarkdownDetail(lines, "Description", shell.subtitle);

    shell.phases.forEach((phase) => {
      lines.push("");
      lines.push(`### ${phase.title}`);
      lines.push("");
      appendMarkdownDetail(lines, "Description", phase.subtitle);

      phase.groups.forEach((group) => {
        lines.push("");
        lines.push(`#### ${group.title}`);
        lines.push("");
        appendMarkdownDetail(lines, "Description", group.description);
        appendMarkdownDetail(lines, "Blocks", String(group.items.length));

        group.items.forEach((item) => {
          const lineCount = getItemReferencedLineCount(item.fileRefs);

          lines.push("");
          lines.push(`##### ${item.title}`);
          lines.push("");
          appendMarkdownDetail(lines, "Type", TAG_LABELS[item.tag] ?? item.tag);
          appendMarkdownDetail(lines, "What It Does", item.summary);
          appendMarkdownDetail(lines, "Why It Exists", item.whyItExists);
          appendMarkdownDetail(lines, "Problem / Risk It Covers", item.problemSolved);
          appendMarkdownDetail(lines, "Settings Gate", item.settingsGate);
          appendMarkdownDetail(lines, "Data Source", item.dataSource);
          appendMarkdownDetail(lines, "Owner Path", item.ownerPath);
          appendMarkdownDetail(lines, "Referenced Lines", lineCount ? formatLineCountLabel(lineCount) : undefined);

          if (item.details.length > 0) {
            lines.push("");
            lines.push("Details:");
            item.details.forEach((detail) => {
              appendMarkdownDetail(lines, detail.label, detail.text);
            });
          }

          if (item.crossRefs?.length) {
            lines.push("");
            lines.push("Cross References:");
            item.crossRefs.forEach((ref) => {
              lines.push(`- ${ref.badge}: ${ref.label} -> ${ref.targetId}. ${normalizeMarkdownText(ref.tooltip)}`);
            });
          }

          if (item.meta?.length) {
            lines.push("");
            lines.push("Meta:");
            item.meta.forEach((entry) => {
              lines.push(`- ${entry}`);
            });
          }

          if (item.fileRefs.length > 0) {
            lines.push("");
            lines.push("Source References:");
            item.fileRefs.forEach((fileRef) => {
              lines.push(`- ${formatFileRef(fileRef)}`);
            });
          }

          if (item.review) {
            lines.push("");
            lines.push("Review:");
            appendMarkdownDetail(lines, "Last reviewed", formatReviewMeta(item.review));
            appendMarkdownDetail(lines, "Review run", item.review.runId);
          }

          if (item.codeSource) {
            appendMarkdownSourceBlock(lines, getSourceViewLabel(item), item.codeSource);
          }
        });
      });
    });
  });

  return `${lines.join("\n").replace(/\n{3,}/g, "\n\n")}\n`;
}
