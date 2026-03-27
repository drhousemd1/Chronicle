import {
  QualityAgent,
  QualityFinding,
  QualityHubRegistry,
  QualityRunSummary,
  QualitySeverity,
} from "@/lib/ui-audit-schema";

const severityRank: Record<QualitySeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  stylistic: 4,
};

const statusRank: Record<QualityFinding["status"], number> = {
  "in-progress": 0,
  open: 1,
  fixed: 2,
  verified: 3,
  deferred: 4,
  rejected: 5,
};

const confidenceRank: Record<QualityFinding["confidence"], number> = {
  confirmed: 0,
  likely: 1,
  preference: 2,
};

const toMillis = (value: string | undefined): number => {
  if (!value) return 0;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? 0 : ms;
};

const uniqueStrings = (values: string[]): string[] =>
  Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));

const uniqueAgents = (values: QualityAgent[]): QualityAgent[] => {
  const byId = new Map<string, QualityAgent>();
  values.forEach((agent) => {
    byId.set(agent.id, agent);
  });
  return Array.from(byId.values());
};

export function sortFindings(findings: QualityFinding[]): QualityFinding[] {
  return [...findings].sort((a, b) => {
    const severityDelta = severityRank[a.severity] - severityRank[b.severity];
    if (severityDelta !== 0) return severityDelta;

    const statusDelta = statusRank[a.status] - statusRank[b.status];
    if (statusDelta !== 0) return statusDelta;

    const confidenceDelta = confidenceRank[a.confidence] - confidenceRank[b.confidence];
    if (confidenceDelta !== 0) return confidenceDelta;

    return toMillis(b.updatedAt) - toMillis(a.updatedAt);
  });
}

export function groupFindingsBy(
  findings: QualityFinding[],
  selector: (finding: QualityFinding) => string,
): Record<string, QualityFinding[]> {
  const grouped: Record<string, QualityFinding[]> = {};
  findings.forEach((finding) => {
    const key = selector(finding) || "unspecified";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(finding);
  });

  Object.keys(grouped).forEach((key) => {
    grouped[key] = sortFindings(grouped[key]);
  });

  return grouped;
}

export function countBySeverity(findings: QualityFinding[]): Record<QualitySeverity, number> {
  return findings.reduce(
    (acc, finding) => {
      acc[finding.severity] += 1;
      return acc;
    },
    { critical: 0, high: 0, medium: 0, low: 0, stylistic: 0 } as Record<QualitySeverity, number>,
  );
}

export function countByStatus(
  findings: QualityFinding[],
): Record<QualityFinding["status"], number> {
  return findings.reduce(
    (acc, finding) => {
      acc[finding.status] += 1;
      return acc;
    },
    {
      open: 0,
      "in-progress": 0,
      fixed: 0,
      verified: 0,
      deferred: 0,
      rejected: 0,
    } as Record<QualityFinding["status"], number>,
  );
}

export function countByDomain(
  findings: QualityFinding[],
): Record<QualityFinding["domain"], number> {
  return findings.reduce(
    (acc, finding) => {
      acc[finding.domain] += 1;
      return acc;
    },
    {
      "ui-ux": 0,
      functionality: 0,
      "orphan-code": 0,
      cleanup: 0,
      accessibility: 0,
      performance: 0,
      security: 0,
      tests: 0,
      build: 0,
      "data-integrity": 0,
      documentation: 0,
    } as Record<QualityFinding["domain"], number>,
  );
}

export function summarizeRun(findings: QualityFinding[], newFindings = 0): QualityRunSummary {
  const severity = countBySeverity(findings);
  const status = countByStatus(findings);

  return {
    findingsTotal: findings.length,
    newFindings,
    critical: severity.critical,
    high: severity.high,
    open: status.open + status["in-progress"],
    verified: status.verified,
  };
}

function mergeComments(
  a: QualityFinding["comments"],
  b: QualityFinding["comments"],
): QualityFinding["comments"] {
  const byId = new Map<string, QualityFinding["comments"][number]>();
  [...a, ...b].forEach((comment) => {
    byId.set(comment.id, comment);
  });

  return Array.from(byId.values()).sort((x, y) => toMillis(x.timestamp) - toMillis(y.timestamp));
}

function mergeFinding(existing: QualityFinding, incoming: QualityFinding): QualityFinding {
  const canonical = toMillis(incoming.updatedAt) >= toMillis(existing.updatedAt) ? incoming : existing;
  const createdAt =
    toMillis(existing.createdAt) <= toMillis(incoming.createdAt)
      ? existing.createdAt
      : incoming.createdAt;

  return {
    ...canonical,
    createdAt,
    updatedAt:
      toMillis(existing.updatedAt) >= toMillis(incoming.updatedAt)
        ? existing.updatedAt
        : incoming.updatedAt,
    files: uniqueStrings([...existing.files, ...incoming.files]),
    tags: uniqueStrings([...existing.tags, ...incoming.tags]),
    evidence: uniqueStrings([...existing.evidence, ...incoming.evidence]),
    reproSteps: uniqueStrings([...existing.reproSteps, ...incoming.reproSteps]),
    relatedFindingIds: uniqueStrings([...existing.relatedFindingIds, ...incoming.relatedFindingIds]),
    relatedRunIds: uniqueStrings([...(existing.relatedRunIds ?? []), ...(incoming.relatedRunIds ?? [])]),
    relatedChangeLogIds: uniqueStrings([...(existing.relatedChangeLogIds ?? []), ...(incoming.relatedChangeLogIds ?? [])]),
    comments: mergeComments(existing.comments, incoming.comments),
    contributors: uniqueAgents([...existing.contributors, ...incoming.contributors]),
  };
}

export function mergeRegistries(
  current: QualityHubRegistry,
  incoming: QualityHubRegistry,
): QualityHubRegistry {
  const findingMap = new Map<string, QualityFinding>();
  current.findings.forEach((finding) => {
    findingMap.set(finding.id, finding);
  });

  incoming.findings.forEach((finding) => {
    const existing = findingMap.get(finding.id);
    if (!existing) {
      findingMap.set(finding.id, finding);
      return;
    }
    findingMap.set(finding.id, mergeFinding(existing, finding));
  });

  const runMap = new Map<string, QualityHubRegistry["runs"][number]>();
  current.runs.forEach((run) => runMap.set(run.id, run));
  incoming.runs.forEach((run) => runMap.set(run.id, run));

  const moduleMap = new Map<string, QualityHubRegistry["scanModules"][number]>();
  current.scanModules.forEach((module) => moduleMap.set(module.id, module));
  incoming.scanModules.forEach((module) => {
    const existing = moduleMap.get(module.id);
    moduleMap.set(module.id, existing ? { ...existing, ...module } : module);
  });

  const reviewMap = new Map<string, QualityHubRegistry["reviewUnits"][number]>();
  current.reviewUnits.forEach((unit) => reviewMap.set(unit.id, unit));
  incoming.reviewUnits.forEach((unit) => {
    const existing = reviewMap.get(unit.id);
    reviewMap.set(unit.id, existing ? { ...existing, ...unit } : unit);
  });

  const nowIso = new Date().toISOString();

  // Merge change log entries by id
  const changeLogMap = new Map<string, QualityHubRegistry["changeLog"][number]>();
  (current.changeLog || []).forEach((e) => changeLogMap.set(e.id, e));
  (incoming.changeLog || []).forEach((e) => {
    const existing = changeLogMap.get(e.id);
    if (!existing) {
      changeLogMap.set(e.id, e);
      return;
    }
    changeLogMap.set(e.id, {
      ...existing,
      ...e,
      comments: mergeComments(existing.comments, e.comments),
      relatedFindingIds: uniqueStrings([...(existing.relatedFindingIds ?? []), ...(e.relatedFindingIds ?? [])]),
      relatedRunIds: uniqueStrings([...(existing.relatedRunIds ?? []), ...(e.relatedRunIds ?? [])]),
    });
  });

  return {
    meta: {
      ...current.meta,
      version: current.meta.version,
      lastUpdatedAt: nowIso,
      lastRunId: incoming.meta.lastRunId || current.meta.lastRunId,
    },
    scanModules: Array.from(moduleMap.values()),
    runs: Array.from(runMap.values()).sort(
      (a, b) => toMillis(b.finishedAt) - toMillis(a.finishedAt),
    ),
    findings: sortFindings(Array.from(findingMap.values())),
    reviewUnits: Array.from(reviewMap.values()),
    changeLog: Array.from(changeLogMap.values()).sort(
      (a, b) => toMillis(b.updatedAt) - toMillis(a.updatedAt),
    ),
    handoffNotes: [current.handoffNotes, incoming.handoffNotes].filter(Boolean).join("\n\n---\n\n"),
  };
}

export function toCompactIso(date = new Date()): string {
  return date.toISOString().replace(/[:.]/g, "-");
}

export function newId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}
