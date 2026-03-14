import React from "react";
import { Link } from "react-router-dom";
import {
  uiAuditComponentVariantDriftMatrix,
  tokenDriftSnapshot,
  uiAuditColorConsolidationPlan,
  uiAuditFindings,
  uiAuditInteractionStateMatrix,
  uiAuditProgress,
  uiAuditScope,
  uiAuditTaxonomy,
} from "@/data/ui-audit-findings";
import {
  countByConfidence,
  countBySeverity,
  countReviewStatus,
  getBatchableFindings,
  getQuickWins,
  getRequiresDesignDecision,
  getReviewedVsUnreviewed,
  getSystemicFindings,
  groupFindingsBy,
  sortFindings,
} from "@/lib/ui-audit-utils";
import type {
  UiAuditComponentVariantDriftItem,
  UiAuditColorConsolidationItem,
  UiAuditFinding,
  UiAuditInteractionStateMatrixRow,
  UiAuditSeverity,
} from "@/lib/ui-audit-schema";

const severityBadgeClass: Record<UiAuditSeverity, string> = {
  critical: "bg-red-500/20 text-red-300 border border-red-500/30",
  high: "bg-orange-500/20 text-orange-300 border border-orange-500/30",
  medium: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
  low: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
  stylistic: "bg-zinc-500/20 text-zinc-300 border border-zinc-500/30",
};

const colorDecisionBadgeClass: Record<
  UiAuditColorConsolidationItem["decision"],
  string
> = {
  keep: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
  merge: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
  deprecate: "bg-rose-500/20 text-rose-300 border border-rose-500/30",
};

const interactionStateBadgeClass: Record<
  UiAuditInteractionStateMatrixRow["stateCoverage"]["rest"],
  string
> = {
  covered: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
  partial: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
  missing: "bg-rose-500/20 text-rose-300 border border-rose-500/30",
  "not-applicable": "bg-zinc-700/40 text-zinc-300 border border-zinc-600",
};

const interactionSemanticsBadgeClass: Record<
  UiAuditInteractionStateMatrixRow["semantics"],
  string
> = {
  semantic: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
  mixed: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
  "non-semantic": "bg-rose-500/20 text-rose-300 border border-rose-500/30",
};

const componentVariantClassificationBadgeClass: Record<
  UiAuditComponentVariantDriftItem["classification"],
  string
> = {
  shared: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
  "near-duplicate": "bg-blue-500/20 text-blue-300 border border-blue-500/30",
  "one-off": "bg-zinc-500/20 text-zinc-300 border border-zinc-500/30",
  conflicted: "bg-rose-500/20 text-rose-300 border border-rose-500/30",
};

const componentVariantFamilyBadgeClass: Record<
  UiAuditComponentVariantDriftItem["family"],
  string
> = {
  button: "bg-sky-500/20 text-sky-300 border border-sky-500/30",
  card: "bg-violet-500/20 text-violet-300 border border-violet-500/30",
  panel: "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30",
  modal: "bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30",
  input: "bg-teal-500/20 text-teal-300 border border-teal-500/30",
  "chip-badge": "bg-amber-500/20 text-amber-300 border border-amber-500/30",
  navigation: "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30",
  unknown: "bg-zinc-500/20 text-zinc-300 border border-zinc-500/30",
};

const sectionCardClass =
  "rounded-2xl border border-[#4a5f7f] bg-[#1e1e22] p-5 md:p-6 shadow-[0_12px_32px_-2px_rgba(0,0,0,0.35)]";

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={sectionCardClass}>
      <h2 className="text-white text-xl font-bold tracking-tight mb-4">{title}</h2>
      {children}
    </section>
  );
}

function FindingCard({ finding }: { finding: UiAuditFinding }) {
  return (
    <details className="rounded-xl border border-ghost-white bg-[#2a2a2f] p-4">
      <summary className="cursor-pointer list-none">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider font-black text-zinc-500">{finding.id}</span>
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${severityBadgeClass[finding.severity]}`}>
            {finding.severity}
          </span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-ghost-white text-white">
            {finding.confidence}
          </span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-zinc-800 text-zinc-300 border border-zinc-700">
            {finding.category}
          </span>
          <span className="text-sm font-bold text-white">{finding.title}</span>
        </div>
      </summary>

      <div className="mt-3 space-y-3 text-sm text-[rgba(248,250,252,0.8)]">
        <p>
          <span className="text-zinc-400 font-semibold">Page:</span> {finding.page}
          {finding.route ? ` (${finding.route})` : ""}
          {finding.component ? ` - ${finding.component}` : ""}
        </p>
        <p>
          <span className="text-zinc-400 font-semibold">Problem:</span> {finding.problem}
        </p>
        <p>
          <span className="text-zinc-400 font-semibold">Impact:</span> {finding.userImpact}
        </p>
        <p>
          <span className="text-zinc-400 font-semibold">Recommendation:</span> {finding.recommendation}
        </p>

        <div>
          <div className="text-zinc-400 font-semibold mb-1">Evidence</div>
          <ul className="list-disc pl-5 space-y-1">
            {finding.evidence.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="grid gap-2 md:grid-cols-2">
          <div>
            <div className="text-zinc-400 font-semibold">Files</div>
            <ul className="list-disc pl-5">
              {finding.files.map((file) => (
                <li key={file} className="font-mono text-xs break-all">
                  {file}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-zinc-400 font-semibold">Metadata</div>
            <p>Source: {finding.sourceOfTruth}</p>
            <p>Fix level: {finding.fixLevel}</p>
            <p>Difficulty: {finding.implementationDifficulty}</p>
            <p>Design-system level: {finding.designSystemLevel ? "yes" : "no"}</p>
            <p>Batchable: {finding.batchable ? "yes" : "no"}</p>
            <p>Status: {finding.status}</p>
          </div>
        </div>
      </div>
    </details>
  );
}

function ColorPlanCard({ item }: { item: UiAuditColorConsolidationItem }) {
  return (
    <details className="rounded-xl border border-ghost-white bg-[#2a2a2f] p-4">
      <summary className="cursor-pointer list-none">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider font-black text-zinc-500">{item.id}</span>
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${colorDecisionBadgeClass[item.decision]}`}
          >
            {item.decision}
          </span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-zinc-800 text-zinc-300 border border-zinc-700">
            {item.priority}
          </span>
          <span className="text-sm font-bold text-white">{item.semanticRole}</span>
        </div>
      </summary>

      <div className="mt-3 space-y-3 text-sm text-[rgba(248,250,252,0.8)]">
        <p>
          <span className="text-zinc-400 font-semibold">Source:</span>{" "}
          {item.sourceColors.map((color) => (
            <span key={color} className="inline-flex items-center mr-2">
              <span
                className="inline-block w-3 h-3 rounded-sm border border-white/20 mr-1 align-middle"
                style={{ backgroundColor: color }}
              />
              <span className="font-mono text-xs">{color}</span>
            </span>
          ))}
        </p>
        <p>
          <span className="text-zinc-400 font-semibold">Target:</span>{" "}
          <span className="inline-flex items-center">
            <span
              className="inline-block w-3 h-3 rounded-sm border border-white/20 mr-1 align-middle"
              style={{ backgroundColor: item.targetColor }}
            />
            <span className="font-mono text-xs">{item.targetColor}</span>
          </span>
        </p>
        <p>
          <span className="text-zinc-400 font-semibold">Scope:</span> {item.scope}
        </p>
        <p>
          <span className="text-zinc-400 font-semibold">Rationale:</span> {item.rationale}
        </p>

        <div>
          <div className="text-zinc-400 font-semibold mb-1">Evidence</div>
          <ul className="list-disc pl-5 space-y-1">
            {item.evidence.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>

        <div>
          <div className="text-zinc-400 font-semibold mb-1">Sample files</div>
          <ul className="list-disc pl-5">
            {item.sampleFiles.map((file) => (
              <li key={file} className="font-mono text-xs break-all">
                {file}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </details>
  );
}

function InteractionStatePill({
  label,
  value,
}: {
  label: string;
  value: UiAuditInteractionStateMatrixRow["stateCoverage"]["rest"];
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${interactionStateBadgeClass[value]}`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </span>
  );
}

function InteractionStateCard({
  row,
}: {
  row: UiAuditInteractionStateMatrixRow;
}) {
  return (
    <details className="rounded-xl border border-ghost-white bg-[#2a2a2f] p-4">
      <summary className="cursor-pointer list-none">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider font-black text-zinc-500">{row.id}</span>
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${severityBadgeClass[row.severity]}`}>
            {row.severity}
          </span>
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${interactionSemanticsBadgeClass[row.semantics]}`}>
            {row.semantics}
          </span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-zinc-800 text-zinc-300 border border-zinc-700">
            {row.confidence}
          </span>
          <span className="text-sm font-bold text-white">{row.pattern}</span>
        </div>
      </summary>

      <div className="mt-3 space-y-3 text-sm text-[rgba(248,250,252,0.8)]">
        <p>
          <span className="text-zinc-400 font-semibold">Page:</span> {row.page}
          {row.route ? ` (${row.route})` : ""}
          {row.component ? ` - ${row.component}` : ""}
        </p>

        <div className="flex flex-wrap gap-1.5">
          <InteractionStatePill label="rest" value={row.stateCoverage.rest} />
          <InteractionStatePill label="hover" value={row.stateCoverage.hover} />
          <InteractionStatePill label="focus" value={row.stateCoverage.focusVisible} />
          <InteractionStatePill label="active" value={row.stateCoverage.active} />
          <InteractionStatePill label="disabled" value={row.stateCoverage.disabled} />
          <InteractionStatePill label="loading" value={row.stateCoverage.loading} />
          <InteractionStatePill label="keyboard" value={row.keyboardParity} />
        </div>

        <p>
          <span className="text-zinc-400 font-semibold">Current state:</span> {row.currentState}
        </p>
        <p>
          <span className="text-zinc-400 font-semibold">Recommendation:</span> {row.recommendation}
        </p>

        <div>
          <div className="text-zinc-400 font-semibold mb-1">Evidence</div>
          <ul className="list-disc pl-5 space-y-1">
            {row.evidence.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div>
          <div className="text-zinc-400 font-semibold mb-1">Files</div>
          <ul className="list-disc pl-5">
            {row.files.map((file) => (
              <li key={file} className="font-mono text-xs break-all">
                {file}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </details>
  );
}

function ComponentVariantCard({
  item,
}: {
  item: UiAuditComponentVariantDriftItem;
}) {
  return (
    <details className="rounded-xl border border-ghost-white bg-[#2a2a2f] p-4">
      <summary className="cursor-pointer list-none">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider font-black text-zinc-500">{item.id}</span>
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${severityBadgeClass[item.severity]}`}>
            {item.severity}
          </span>
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${componentVariantClassificationBadgeClass[item.classification]}`}>
            {item.classification}
          </span>
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${componentVariantFamilyBadgeClass[item.family]}`}>
            {item.family}
          </span>
          <span className="text-sm font-bold text-white">{item.variantName}</span>
        </div>
      </summary>

      <div className="mt-3 space-y-3 text-sm text-[rgba(248,250,252,0.8)]">
        <p>
          <span className="text-zinc-400 font-semibold">Current state:</span> {item.currentState}
        </p>
        <p>
          <span className="text-zinc-400 font-semibold">Problem:</span> {item.problem}
        </p>
        <p>
          <span className="text-zinc-400 font-semibold">Recommendation:</span> {item.recommendation}
        </p>

        <div className="grid gap-2 md:grid-cols-2">
          <p>
            <span className="text-zinc-400 font-semibold">Confidence:</span> {item.confidence}
          </p>
          <p>
            <span className="text-zinc-400 font-semibold">Estimated reuse:</span> {item.estimatedReuseCount}
          </p>
          <p>
            <span className="text-zinc-400 font-semibold">Design-system candidate:</span>{" "}
            {item.designSystemCandidate ? "yes" : "no"}
          </p>
          <p>
            <span className="text-zinc-400 font-semibold">Fix level:</span> {item.fixLevel}
          </p>
        </div>

        <div>
          <div className="text-zinc-400 font-semibold mb-1">Evidence</div>
          <ul className="list-disc pl-5 space-y-1">
            {item.evidence.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>

        <div>
          <div className="text-zinc-400 font-semibold mb-1">Files</div>
          <ul className="list-disc pl-5">
            {item.files.map((file) => (
              <li key={file} className="font-mono text-xs break-all">
                {file}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </details>
  );
}

function GroupedFindings({
  groups,
  order,
}: {
  groups: Record<string, UiAuditFinding[]>;
  order?: string[];
}) {
  const keys = order ?? Object.keys(groups).sort((a, b) => a.localeCompare(b));
  return (
    <div className="space-y-4">
      {keys
        .filter((key) => (groups[key] ?? []).length > 0)
        .map((key) => (
          <div key={key} className="space-y-2">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              {key} ({groups[key].length})
            </h3>
            <div className="space-y-2">
              {groups[key].map((finding) => (
                <FindingCard key={finding.id} finding={finding} />
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}

function sortInteractionRows(rows: UiAuditInteractionStateMatrixRow[]) {
  const severityPriority: Record<UiAuditSeverity, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
    stylistic: 4,
  };

  const confidencePriority: Record<UiAuditInteractionStateMatrixRow["confidence"], number> = {
    confirmed: 0,
    likely: 1,
    preference: 2,
  };

  return [...rows].sort((a, b) => {
    const severityDelta = severityPriority[a.severity] - severityPriority[b.severity];
    if (severityDelta !== 0) return severityDelta;

    const confidenceDelta = confidencePriority[a.confidence] - confidencePriority[b.confidence];
    if (confidenceDelta !== 0) return confidenceDelta;

    return a.id.localeCompare(b.id);
  });
}

function groupInteractionRowsBy(
  rows: UiAuditInteractionStateMatrixRow[],
  selector: (row: UiAuditInteractionStateMatrixRow) => string,
) {
  return rows.reduce(
    (acc, row) => {
      const key = selector(row);
      acc[key] ??= [];
      acc[key].push(row);
      return acc;
    },
    {} as Record<string, UiAuditInteractionStateMatrixRow[]>,
  );
}

function GroupedInteractionRows({
  groups,
  order,
}: {
  groups: Record<string, UiAuditInteractionStateMatrixRow[]>;
  order?: string[];
}) {
  const keys = order ?? Object.keys(groups).sort((a, b) => a.localeCompare(b));
  return (
    <div className="space-y-4">
      {keys
        .filter((key) => (groups[key] ?? []).length > 0)
        .map((key) => (
          <div key={key} className="space-y-2">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              {key} ({groups[key].length})
            </h3>
            <div className="space-y-2">
              {sortInteractionRows(groups[key]).map((row) => (
                <InteractionStateCard key={row.id} row={row} />
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}

function sortComponentVariantItems(items: UiAuditComponentVariantDriftItem[]) {
  const severityPriority: Record<UiAuditSeverity, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
    stylistic: 4,
  };

  const confidencePriority: Record<UiAuditComponentVariantDriftItem["confidence"], number> = {
    confirmed: 0,
    likely: 1,
    preference: 2,
  };

  return [...items].sort((a, b) => {
    const severityDelta = severityPriority[a.severity] - severityPriority[b.severity];
    if (severityDelta !== 0) return severityDelta;

    const confidenceDelta = confidencePriority[a.confidence] - confidencePriority[b.confidence];
    if (confidenceDelta !== 0) return confidenceDelta;

    return a.id.localeCompare(b.id);
  });
}

function groupComponentVariantItemsBy(
  items: UiAuditComponentVariantDriftItem[],
  selector: (item: UiAuditComponentVariantDriftItem) => string,
) {
  return items.reduce(
    (acc, item) => {
      const key = selector(item);
      acc[key] ??= [];
      acc[key].push(item);
      return acc;
    },
    {} as Record<string, UiAuditComponentVariantDriftItem[]>,
  );
}

function GroupedComponentVariantItems({
  groups,
  order,
}: {
  groups: Record<string, UiAuditComponentVariantDriftItem[]>;
  order?: string[];
}) {
  const keys = order ?? Object.keys(groups).sort((a, b) => a.localeCompare(b));
  return (
    <div className="space-y-4">
      {keys
        .filter((key) => (groups[key] ?? []).length > 0)
        .map((key) => (
          <div key={key} className="space-y-2">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              {key} ({groups[key].length})
            </h3>
            <div className="space-y-2">
              {sortComponentVariantItems(groups[key]).map((item) => (
                <ComponentVariantCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}

export default function UiAuditPage() {
  const findings = sortFindings(uiAuditFindings);
  const severityCounts = countBySeverity(findings);
  const confidenceCounts = countByConfidence(findings);
  const progressCounts = countReviewStatus(uiAuditProgress);
  const { reviewed, unreviewed } = getReviewedVsUnreviewed(uiAuditProgress);

  const bySeverity = groupFindingsBy(findings, (finding) => finding.severity);
  const byConfidence = groupFindingsBy(findings, (finding) => finding.confidence);
  const byPage = groupFindingsBy(findings, (finding) => finding.page);
  const byComponent = groupFindingsBy(findings, (finding) => finding.component ?? "unspecified");
  const byCategory = groupFindingsBy(findings, (finding) => finding.category);

  const colorOrTokenFindings = findings.filter(
    (finding) => finding.category === "color" || finding.category === "token-drift",
  );
  const typographyFindings = findings.filter((finding) => finding.category === "typography");
  const spacingLayoutFindings = findings.filter(
    (finding) => finding.category === "spacing" || finding.category === "layout",
  );
  const componentConsistencyFindings = findings.filter(
    (finding) => finding.category === "component" || finding.category === "design-system",
  );
  const accessibilityFindings = findings.filter((finding) => finding.category === "accessibility");
  const responsiveFindings = findings.filter(
    (finding) => finding.category === "responsive" || finding.category === "interaction",
  );

  const systemicFindings = getSystemicFindings(findings);
  const quickWins = getQuickWins(findings);
  const requiresDecision = getRequiresDesignDecision(findings);
  const batchFixes = getBatchableFindings(findings);
  const colorPlanKeep = uiAuditColorConsolidationPlan.filter((item) => item.decision === "keep");
  const colorPlanMerge = uiAuditColorConsolidationPlan.filter((item) => item.decision === "merge");
  const colorPlanDeprecate = uiAuditColorConsolidationPlan.filter((item) => item.decision === "deprecate");
  const interactionRows = sortInteractionRows(uiAuditInteractionStateMatrix);
  const interactionRowsMissingFocus = interactionRows.filter(
    (row) => row.stateCoverage.focusVisible === "missing",
  );
  const interactionRowsMissingKeyboard = interactionRows.filter(
    (row) => row.keyboardParity === "missing",
  );
  const interactionRowsNonSemantic = interactionRows.filter(
    (row) => row.semantics === "non-semantic",
  );
  const interactionRowsWithLoadingGaps = interactionRows.filter(
    (row) => row.stateCoverage.loading === "missing" || row.stateCoverage.loading === "partial",
  );
  const interactionBySeverity = groupInteractionRowsBy(interactionRows, (row) => row.severity);
  const interactionByPage = groupInteractionRowsBy(interactionRows, (row) => row.page);
  const interactionByComponent = groupInteractionRowsBy(interactionRows, (row) => row.component);
  const componentVariantRows = sortComponentVariantItems(uiAuditComponentVariantDriftMatrix);
  const componentVariantSystemic = componentVariantRows.filter((item) => item.designSystemCandidate);
  const componentVariantHighRisk = componentVariantRows.filter(
    (item) => item.severity === "critical" || item.severity === "high" || item.classification === "conflicted",
  );
  const componentVariantByFamily = groupComponentVariantItemsBy(componentVariantRows, (item) => item.family);
  const componentVariantByClassification = groupComponentVariantItemsBy(
    componentVariantRows,
    (item) => item.classification,
  );
  const componentVariantBySeverity = groupComponentVariantItemsBy(componentVariantRows, (item) => item.severity);

  return (
    <div className="min-h-screen bg-[#121214] text-white">
      <header className="sticky top-0 z-50 border-b border-ghost-white bg-[#1a1a1a] px-6 py-4">
        <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight">UI Audit System</h1>
            <p className="text-sm text-[rgba(248,250,252,0.7)]">
              Discovery-only audit ledger for design-system drift, UX issues, and accessibility risk.
            </p>
          </div>
          <div className="text-sm">
            <Link
              to="/"
              className="inline-flex items-center rounded-xl border border-[#4a5f7f] bg-[#2a2a2f] px-4 py-2 font-semibold hover:bg-[#3a3a3f] transition-colors"
            >
              Back to App
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-6 space-y-5">
        <Section id="executive-summary" title="1. Executive Summary">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-[#4a5f7f] bg-[#2a2a2f] p-4">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Total Findings</div>
              <div className="text-3xl font-black">{findings.length}</div>
            </div>
            <div className="rounded-xl border border-[#4a5f7f] bg-[#2a2a2f] p-4">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Critical + High</div>
              <div className="text-3xl font-black">{severityCounts.critical + severityCounts.high}</div>
            </div>
            <div className="rounded-xl border border-[#4a5f7f] bg-[#2a2a2f] p-4">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Systemic Findings</div>
              <div className="text-3xl font-black">{systemicFindings.length}</div>
            </div>
          </div>
          <p className="mt-4 text-sm text-[rgba(248,250,252,0.8)]">{uiAuditScope.notes}</p>
        </Section>

        <Section id="scope" title="2. Audit Scope">
          <div className="space-y-2 text-sm text-[rgba(248,250,252,0.85)]">
            <p>
              <span className="text-zinc-400 font-semibold">Started:</span> {uiAuditScope.startedOn}
            </p>
            <p>
              <span className="text-zinc-400 font-semibold">Updated:</span> {uiAuditScope.updatedOn}
            </p>
            <div>
              <div className="text-zinc-400 font-semibold mb-1">Sources of truth</div>
              <ul className="list-disc pl-5 space-y-1">
                {uiAuditScope.sources.map((source) => (
                  <li key={source} className="font-mono text-xs break-all">
                    {source}
                  </li>
                ))}
              </ul>
            </div>
            <p>
              <span className="text-zinc-400 font-semibold">Taxonomy:</span> severities ({uiAuditTaxonomy.severities.join(", ")}),
              confidence ({uiAuditTaxonomy.confidence.join(", ")}), categories ({uiAuditTaxonomy.categories.length} defined).
            </p>
          </div>
        </Section>

        <Section id="progress-tracker" title="3. Audit Progress Tracker">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-ghost-white bg-[#2a2a2f] p-4">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Reviewed</div>
              <div className="text-2xl font-black">{progressCounts.reviewed}</div>
            </div>
            <div className="rounded-xl border border-ghost-white bg-[#2a2a2f] p-4">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">In Progress</div>
              <div className="text-2xl font-black">{progressCounts["in-progress"]}</div>
            </div>
            <div className="rounded-xl border border-ghost-white bg-[#2a2a2f] p-4">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Pending</div>
              <div className="text-2xl font-black">{progressCounts.pending}</div>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {uiAuditProgress.map((unit) => (
              <div key={unit.id} className="rounded-xl border border-ghost-white bg-[#2a2a2f] p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-white">{unit.name}</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider font-bold bg-[#4a5f7f] text-white">
                    {unit.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[rgba(248,250,252,0.75)]">{unit.notes}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section id="reviewed-unreviewed" title="4. Reviewed vs Unreviewed Pages">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-ghost-white bg-[#2a2a2f] p-4">
              <h3 className="text-sm font-black uppercase tracking-wider mb-2">Reviewed ({reviewed.length})</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-[rgba(248,250,252,0.85)]">
                {reviewed.map((unit) => (
                  <li key={unit.id}>{unit.name}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-ghost-white bg-[#2a2a2f] p-4">
              <h3 className="text-sm font-black uppercase tracking-wider mb-2">Unreviewed ({unreviewed.length})</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-[rgba(248,250,252,0.85)]">
                {unreviewed.map((unit) => (
                  <li key={unit.id}>
                    {unit.name} ({unit.status})
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        <Section id="findings-by-severity" title="5. Findings by Severity">
          <div className="mb-4 flex flex-wrap gap-2 text-xs">
            {Object.entries(severityCounts).map(([severity, count]) => (
              <span key={severity} className="px-2 py-1 rounded-md bg-[#2a2a2f] border border-ghost-white">
                {severity}: {count}
              </span>
            ))}
          </div>
          <GroupedFindings
            groups={bySeverity}
            order={["critical", "high", "medium", "low", "stylistic"]}
          />
        </Section>

        <Section id="findings-by-confidence" title="6. Findings by Confidence">
          <div className="mb-4 flex flex-wrap gap-2 text-xs">
            {Object.entries(confidenceCounts).map(([confidence, count]) => (
              <span key={confidence} className="px-2 py-1 rounded-md bg-[#2a2a2f] border border-ghost-white">
                {confidence}: {count}
              </span>
            ))}
          </div>
          <GroupedFindings
            groups={byConfidence}
            order={["confirmed", "likely", "preference"]}
          />
        </Section>

        <Section id="findings-by-page" title="7. Findings by Page">
          <GroupedFindings groups={byPage} />
        </Section>

        <Section id="findings-by-component" title="8. Findings by Component">
          <GroupedFindings groups={byComponent} />
        </Section>

        <Section id="findings-by-category" title="9. Findings by Category">
          <GroupedFindings groups={byCategory} />
        </Section>

        <Section id="token-drift" title="10. Design Token Drift">
          <div className="space-y-4 text-sm">
            <div className="rounded-xl border border-ghost-white bg-[#2a2a2f] p-4">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-2">Hardcoded Hex Hotspots</div>
              <ul className="list-disc pl-5 space-y-1">
                {tokenDriftSnapshot.hardcodedHexTopValues.map((entry) => (
                  <li key={entry.token}>
                    <span className="font-mono">{entry.token}</span>: {entry.occurrences} occurrences
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-ghost-white bg-[#2a2a2f] p-4">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-2">Radius Variants</div>
                <ul className="list-disc pl-5 space-y-1">
                  {tokenDriftSnapshot.radiusVariants.map((entry) => (
                    <li key={entry.token}>
                      <span className="font-mono">{entry.token}</span>: {entry.occurrences}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-ghost-white bg-[#2a2a2f] p-4">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-2">Micro Typography</div>
                <ul className="list-disc pl-5 space-y-1">
                  {tokenDriftSnapshot.typographyMicrosizes.map((entry) => (
                    <li key={entry.token}>
                      <span className="font-mono">{entry.token}</span>: {entry.occurrences}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Section>

        <Section id="color-consolidation" title="11. Color Consolidation Opportunities">
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-xl border border-ghost-white bg-[#2a2a2f] p-4">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Color Decisions</div>
                <div className="text-2xl font-black">{uiAuditColorConsolidationPlan.length}</div>
              </div>
              <div className="rounded-xl border border-ghost-white bg-[#2a2a2f] p-4">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Keep</div>
                <div className="text-2xl font-black">{colorPlanKeep.length}</div>
              </div>
              <div className="rounded-xl border border-ghost-white bg-[#2a2a2f] p-4">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Merge</div>
                <div className="text-2xl font-black">{colorPlanMerge.length}</div>
              </div>
              <div className="rounded-xl border border-ghost-white bg-[#2a2a2f] p-4">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Deprecate</div>
                <div className="text-2xl font-black">{colorPlanDeprecate.length}</div>
              </div>
            </div>

            <div className="rounded-xl border border-ghost-white bg-[#2a2a2f] p-4">
              <h3 className="text-sm font-black uppercase tracking-wider mb-3">Keep / Merge / Deprecate Map</h3>
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-300">
                  Keep ({colorPlanKeep.length})
                </h4>
                {colorPlanKeep.map((item) => (
                  <ColorPlanCard key={item.id} item={item} />
                ))}

                <h4 className="text-xs font-black uppercase tracking-wider text-blue-300 pt-2">
                  Merge ({colorPlanMerge.length})
                </h4>
                {colorPlanMerge.map((item) => (
                  <ColorPlanCard key={item.id} item={item} />
                ))}

                <h4 className="text-xs font-black uppercase tracking-wider text-rose-300 pt-2">
                  Deprecate ({colorPlanDeprecate.length})
                </h4>
                {colorPlanDeprecate.map((item) => (
                  <ColorPlanCard key={item.id} item={item} />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {sortFindings(colorOrTokenFindings).map((finding) => (
                <FindingCard key={finding.id} finding={finding} />
              ))}
            </div>
          </div>
        </Section>

        <Section id="typography-issues" title="12. Typography Issues">
          <div className="space-y-2">
            {sortFindings(typographyFindings).map((finding) => (
              <FindingCard key={finding.id} finding={finding} />
            ))}
          </div>
        </Section>

        <Section id="spacing-layout-issues" title="13. Spacing / Layout Issues">
          <div className="space-y-2">
            {sortFindings(spacingLayoutFindings).map((finding) => (
              <FindingCard key={finding.id} finding={finding} />
            ))}
          </div>
        </Section>

        <Section id="component-consistency" title="14. Component Consistency Findings">
          <div className="space-y-2">
            {sortFindings(componentConsistencyFindings).map((finding) => (
              <FindingCard key={finding.id} finding={finding} />
            ))}
          </div>
        </Section>

        <Section id="accessibility-findings" title="15. Accessibility Findings">
          <div className="space-y-2">
            {sortFindings(accessibilityFindings).map((finding) => (
              <FindingCard key={finding.id} finding={finding} />
            ))}
          </div>
        </Section>

        <Section id="responsive-tablet-findings" title="16. Responsive / Tablet Findings">
          <div className="space-y-2">
            {sortFindings(responsiveFindings).map((finding) => (
              <FindingCard key={finding.id} finding={finding} />
            ))}
          </div>
        </Section>

        <Section id="systemic-issues" title="17. Systemic Issues">
          <div className="space-y-2">
            {systemicFindings.map((finding) => (
              <FindingCard key={finding.id} finding={finding} />
            ))}
          </div>
        </Section>

        <Section id="quick-wins" title="18. Quick Wins">
          <div className="space-y-2">
            {quickWins.length === 0 ? (
              <p className="text-sm text-[rgba(248,250,252,0.75)]">No quick wins currently classified.</p>
            ) : (
              quickWins.map((finding) => <FindingCard key={finding.id} finding={finding} />)
            )}
          </div>
        </Section>

        <Section id="requires-design-decision" title="19. Requires Design Decision">
          <div className="space-y-2">
            {requiresDecision.length === 0 ? (
              <p className="text-sm text-[rgba(248,250,252,0.75)]">No findings currently marked as decision-gated.</p>
            ) : (
              requiresDecision.map((finding) => <FindingCard key={finding.id} finding={finding} />)
            )}
          </div>
        </Section>

        <Section id="safe-future-batch-fixes" title="20. Safe Future Batch Fixes">
          <div className="space-y-2">
            {batchFixes.length === 0 ? (
              <p className="text-sm text-[rgba(248,250,252,0.75)]">No batch-fix candidates identified.</p>
            ) : (
              batchFixes.map((finding) => <FindingCard key={finding.id} finding={finding} />)
            )}
          </div>
        </Section>

        <Section id="interaction-state-matrix" title="21. Interaction State Matrix">
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-5">
              <div className="rounded-xl border border-ghost-white bg-[#2a2a2f] p-4">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Patterns Audited</div>
                <div className="text-2xl font-black">{interactionRows.length}</div>
              </div>
              <div className="rounded-xl border border-ghost-white bg-[#2a2a2f] p-4">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Missing Focus</div>
                <div className="text-2xl font-black">{interactionRowsMissingFocus.length}</div>
              </div>
              <div className="rounded-xl border border-ghost-white bg-[#2a2a2f] p-4">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Missing Keyboard</div>
                <div className="text-2xl font-black">{interactionRowsMissingKeyboard.length}</div>
              </div>
              <div className="rounded-xl border border-ghost-white bg-[#2a2a2f] p-4">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Non-semantic</div>
                <div className="text-2xl font-black">{interactionRowsNonSemantic.length}</div>
              </div>
              <div className="rounded-xl border border-ghost-white bg-[#2a2a2f] p-4">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Loading Gaps</div>
                <div className="text-2xl font-black">{interactionRowsWithLoadingGaps.length}</div>
              </div>
            </div>

            <div className="rounded-xl border border-ghost-white bg-[#2a2a2f] p-4 space-y-3">
              <h3 className="text-sm font-black uppercase tracking-wider">High-risk State Gaps</h3>
              <div className="space-y-2">
                {sortInteractionRows(
                  interactionRows.filter(
                    (row) =>
                      row.severity === "critical" ||
                      row.keyboardParity === "missing" ||
                      row.stateCoverage.focusVisible === "missing",
                  ),
                ).map((row) => (
                  <InteractionStateCard key={row.id} row={row} />
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-ghost-white bg-[#2a2a2f] p-4 space-y-3">
              <h3 className="text-sm font-black uppercase tracking-wider">By Severity</h3>
              <GroupedInteractionRows
                groups={interactionBySeverity}
                order={["critical", "high", "medium", "low", "stylistic"]}
              />
            </div>

            <div className="rounded-xl border border-ghost-white bg-[#2a2a2f] p-4 space-y-3">
              <h3 className="text-sm font-black uppercase tracking-wider">By Page</h3>
              <GroupedInteractionRows groups={interactionByPage} />
            </div>

            <div className="rounded-xl border border-ghost-white bg-[#2a2a2f] p-4 space-y-3">
              <h3 className="text-sm font-black uppercase tracking-wider">By Component</h3>
              <GroupedInteractionRows groups={interactionByComponent} />
            </div>
          </div>
        </Section>

        <Section id="component-variant-drift-matrix" title="22. Component Variant Drift Matrix">
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-xl border border-ghost-white bg-[#2a2a2f] p-4">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Variants Audited</div>
                <div className="text-2xl font-black">{componentVariantRows.length}</div>
              </div>
              <div className="rounded-xl border border-ghost-white bg-[#2a2a2f] p-4">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Systemic Candidates</div>
                <div className="text-2xl font-black">{componentVariantSystemic.length}</div>
              </div>
              <div className="rounded-xl border border-ghost-white bg-[#2a2a2f] p-4">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">High-risk Variants</div>
                <div className="text-2xl font-black">{componentVariantHighRisk.length}</div>
              </div>
              <div className="rounded-xl border border-ghost-white bg-[#2a2a2f] p-4">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Conflicted Families</div>
                <div className="text-2xl font-black">
                  {componentVariantRows.filter((item) => item.classification === "conflicted").length}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-ghost-white bg-[#2a2a2f] p-4 space-y-3">
              <h3 className="text-sm font-black uppercase tracking-wider">High-risk Variant Drift</h3>
              <div className="space-y-2">
                {componentVariantHighRisk.map((item) => (
                  <ComponentVariantCard key={item.id} item={item} />
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-ghost-white bg-[#2a2a2f] p-4 space-y-3">
              <h3 className="text-sm font-black uppercase tracking-wider">By Family</h3>
              <GroupedComponentVariantItems
                groups={componentVariantByFamily}
                order={["button", "card", "panel", "modal", "input", "chip-badge", "navigation", "unknown"]}
              />
            </div>

            <div className="rounded-xl border border-ghost-white bg-[#2a2a2f] p-4 space-y-3">
              <h3 className="text-sm font-black uppercase tracking-wider">By Classification</h3>
              <GroupedComponentVariantItems
                groups={componentVariantByClassification}
                order={["conflicted", "near-duplicate", "shared", "one-off"]}
              />
            </div>

            <div className="rounded-xl border border-ghost-white bg-[#2a2a2f] p-4 space-y-3">
              <h3 className="text-sm font-black uppercase tracking-wider">By Severity</h3>
              <GroupedComponentVariantItems
                groups={componentVariantBySeverity}
                order={["critical", "high", "medium", "low", "stylistic"]}
              />
            </div>
          </div>
        </Section>
      </main>
    </div>
  );
}