export type GuideTruthLevel = "code-verified" | "mixed" | "inferred";

export interface GuideFreshnessMeta {
  lastReviewedAt: string | null;
  staleAfterDays: number;
  truthLevel: GuideTruthLevel;
  reviewedBy: string | null;
}

export interface GuideFreshnessState {
  kind: "fresh" | "aging" | "stale" | "unknown";
  label: string;
  detail: string;
  referenceAt: string | null;
  daysSinceReference: number | null;
  staleAfterDays: number;
  truthLevel: GuideTruthLevel;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_STALE_DAYS = 21;

function toValidIso(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value !== "number") return null;
  if (!Number.isFinite(value)) return null;
  return value;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeTruthLevel(value: unknown): GuideTruthLevel {
  if (value === "code-verified" || value === "mixed" || value === "inferred") {
    return value;
  }
  return "inferred";
}

function toObjectRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

export function normalizeFreshnessMeta(content: unknown): GuideFreshnessMeta {
  const root = toObjectRecord(content);
  const freshness = toObjectRecord(root.freshness);
  const staleAfterRaw = toFiniteNumber(freshness.staleAfterDays);

  return {
    lastReviewedAt: toValidIso(freshness.lastReviewedAt),
    staleAfterDays: staleAfterRaw == null ? DEFAULT_STALE_DAYS : clamp(Math.floor(staleAfterRaw), 1, 365),
    truthLevel: normalizeTruthLevel(freshness.truthLevel),
    reviewedBy: typeof freshness.reviewedBy === "string" && freshness.reviewedBy.trim() ? freshness.reviewedBy.trim() : null,
  };
}

export function patchFreshnessMeta(
  content: unknown,
  patch: Partial<GuideFreshnessMeta>,
): Record<string, unknown> {
  const root = toObjectRecord(content);
  const freshness = toObjectRecord(root.freshness);

  const nextFreshness: Record<string, unknown> = {
    ...freshness,
    ...patch,
  };

  if ("staleAfterDays" in patch && typeof patch.staleAfterDays === "number") {
    nextFreshness.staleAfterDays = clamp(Math.floor(patch.staleAfterDays), 1, 365);
  }
  if ("lastReviewedAt" in patch) {
    nextFreshness.lastReviewedAt = patch.lastReviewedAt ? toValidIso(patch.lastReviewedAt) : null;
  }
  if ("reviewedBy" in patch) {
    nextFreshness.reviewedBy = patch.reviewedBy && patch.reviewedBy.trim() ? patch.reviewedBy.trim() : null;
  }

  return {
    ...root,
    freshness: nextFreshness,
  };
}

export function buildGuideFreshness(meta: GuideFreshnessMeta, updatedAt?: string | null): GuideFreshnessState {
  const fallbackUpdatedAt = toValidIso(updatedAt);
  const referenceAt = meta.lastReviewedAt ?? fallbackUpdatedAt;

  if (!referenceAt) {
    return {
      kind: "unknown",
      label: "Unknown",
      detail: "No review timestamp is recorded yet.",
      referenceAt: null,
      daysSinceReference: null,
      staleAfterDays: meta.staleAfterDays,
      truthLevel: meta.truthLevel,
    };
  }

  const referenceTime = new Date(referenceAt).getTime();
  const daysSinceReference = Math.max(0, Math.floor((Date.now() - referenceTime) / DAY_MS));
  const agingThreshold = Math.max(1, Math.floor(meta.staleAfterDays * 0.66));

  if (daysSinceReference > meta.staleAfterDays) {
    return {
      kind: "stale",
      label: "Stale",
      detail: `Last reviewed ${daysSinceReference} day${daysSinceReference === 1 ? "" : "s"} ago.`,
      referenceAt,
      daysSinceReference,
      staleAfterDays: meta.staleAfterDays,
      truthLevel: meta.truthLevel,
    };
  }

  if (daysSinceReference >= agingThreshold) {
    return {
      kind: "aging",
      label: "Aging",
      detail: `Review is ${daysSinceReference} day${daysSinceReference === 1 ? "" : "s"} old and nearing stale threshold.`,
      referenceAt,
      daysSinceReference,
      staleAfterDays: meta.staleAfterDays,
      truthLevel: meta.truthLevel,
    };
  }

  return {
    kind: "fresh",
    label: "Fresh",
    detail: `Reviewed ${daysSinceReference} day${daysSinceReference === 1 ? "" : "s"} ago.`,
    referenceAt,
    daysSinceReference,
    staleAfterDays: meta.staleAfterDays,
    truthLevel: meta.truthLevel,
  };
}

export function formatFreshnessTimestamp(value: string | null): string {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleString();
}

export function getTruthLevelLabel(level: GuideTruthLevel): string {
  switch (level) {
    case "code-verified":
      return "Code-verified";
    case "mixed":
      return "Mixed";
    default:
      return "Inferred";
  }
}
