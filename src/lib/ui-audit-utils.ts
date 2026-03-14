import type {
  UiAuditConfidence,
  UiAuditFinding,
  UiAuditReviewUnit,
  UiAuditReviewStatus,
  UiAuditSeverity,
} from "@/lib/ui-audit-schema";

const severityOrder: Record<UiAuditSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  stylistic: 4,
};

const confidenceOrder: Record<UiAuditConfidence, number> = {
  confirmed: 0,
  likely: 1,
  preference: 2,
};

export function sortFindings(findings: UiAuditFinding[]): UiAuditFinding[] {
  return [...findings].sort((a, b) => {
    const severityDelta = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDelta !== 0) return severityDelta;

    const confidenceDelta = confidenceOrder[a.confidence] - confidenceOrder[b.confidence];
    if (confidenceDelta !== 0) return confidenceDelta;

    return a.id.localeCompare(b.id);
  });
}

export function groupFindingsBy<T extends string>(
  findings: UiAuditFinding[],
  selector: (finding: UiAuditFinding) => T,
): Record<T, UiAuditFinding[]> {
  const grouped = {} as Record<T, UiAuditFinding[]>;
  findings.forEach((finding) => {
    const key = selector(finding);
    grouped[key] ??= [];
    grouped[key].push(finding);
  });

  (Object.keys(grouped) as T[]).forEach((key) => {
    grouped[key] = sortFindings(grouped[key]);
  });

  return grouped;
}

export function countBySeverity(findings: UiAuditFinding[]): Record<UiAuditSeverity, number> {
  return findings.reduce(
    (acc, finding) => {
      acc[finding.severity] += 1;
      return acc;
    },
    { critical: 0, high: 0, medium: 0, low: 0, stylistic: 0 } as Record<UiAuditSeverity, number>,
  );
}

export function countByConfidence(findings: UiAuditFinding[]): Record<UiAuditConfidence, number> {
  return findings.reduce(
    (acc, finding) => {
      acc[finding.confidence] += 1;
      return acc;
    },
    { confirmed: 0, likely: 0, preference: 0 } as Record<UiAuditConfidence, number>,
  );
}

export function getReviewedVsUnreviewed(units: UiAuditReviewUnit[]): {
  reviewed: UiAuditReviewUnit[];
  unreviewed: UiAuditReviewUnit[];
} {
  return units.reduce(
    (acc, unit) => {
      if (unit.status === "reviewed") acc.reviewed.push(unit);
      else acc.unreviewed.push(unit);
      return acc;
    },
    { reviewed: [], unreviewed: [] } as {
      reviewed: UiAuditReviewUnit[];
      unreviewed: UiAuditReviewUnit[];
    },
  );
}

export function countReviewStatus(
  units: UiAuditReviewUnit[],
): Record<UiAuditReviewStatus, number> {
  return units.reduce(
    (acc, unit) => {
      acc[unit.status] += 1;
      return acc;
    },
    { reviewed: 0, "in-progress": 0, pending: 0 } as Record<UiAuditReviewStatus, number>,
  );
}

export function getSystemicFindings(findings: UiAuditFinding[]): UiAuditFinding[] {
  return sortFindings(findings.filter((finding) => finding.designSystemLevel));
}

export function getQuickWins(findings: UiAuditFinding[]): UiAuditFinding[] {
  return sortFindings(
    findings.filter(
      (finding) =>
        finding.implementationDifficulty === "small" &&
        (finding.severity === "critical" || finding.severity === "high" || finding.severity === "medium"),
    ),
  );
}

export function getRequiresDesignDecision(findings: UiAuditFinding[]): UiAuditFinding[] {
  return sortFindings(
    findings.filter(
      (finding) =>
        finding.confidence === "preference" ||
        finding.implementationDifficulty === "unknown" ||
        (finding.designSystemLevel && !finding.batchable),
    ),
  );
}

export function getBatchableFindings(findings: UiAuditFinding[]): UiAuditFinding[] {
  return sortFindings(findings.filter((finding) => finding.batchable));
}
