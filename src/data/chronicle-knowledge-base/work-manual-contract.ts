import { createHash } from "node:crypto";

import { parse as parseYaml } from "yaml";
import { z } from "zod";

export const CHRONICLE_WORK_MANUAL_PATH =
  "docs/architecture-knowledge/chronicle-work-manual.md";
export const CHRONICLE_WORK_MANUAL_VERSION = "0.2.3-provisional";
export const CHRONICLE_WORK_MANUAL_STATUS = "active-provisional";
export const CHRONICLE_WORK_MANUAL_EPOCH =
  "chronicle-work-manual-2026-08-29-01";
export const CHRONICLE_PHASE_C_SOURCE_SHA256 =
  "e8bfd449ac29fdfd492c03ec359b7abce05e80fe22dd7b6d88892b04ff2280dc";
export const CHRONICLE_REVIEWED_CHAPTERS_SHA256 =
  "643eb0e69b3ced28d71b090550d8c0d88b1fc68ab391cb2ef00a38521defc4d8";

export const CHRONICLE_WORK_MANUAL_CHAPTERS = Object.freeze([
  "1. Start Here",
  "2. Routine Local Work",
  "3. Connected Feature Work",
  "4. Multi-System Program Work",
  "5. Expansion and Approval Rules",
  "6. Risk Safeguards",
  "7. Evidence and Human Review",
  "8. Records and Continuity",
  "9. Chronicle-Specific Systems",
  "10. Subagents, Research, and Independent Review",
  "11. Checks, Delivery, and Reporting",
] as const);

const workManualMetadataSchema = z.object({
  title: z.literal("Chronicle Work Manual"),
  manual_version: z.literal(CHRONICLE_WORK_MANUAL_VERSION),
  status: z.literal(CHRONICLE_WORK_MANUAL_STATUS),
  authority_epoch: z.literal(CHRONICLE_WORK_MANUAL_EPOCH),
  activated_on: z.literal("2026-08-29"),
  controlling_project: z.literal("KS-WORK-001"),
  canonical_path: z.literal(CHRONICLE_WORK_MANUAL_PATH),
  reviewed_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reviewed_repository_head: z.string().regex(/^[0-9a-f]{40}$/),
  reviewed_route_policy: z.literal("0.2.0"),
  reviewed_source_count: z.literal(49),
  reviewed_migration_rule_count: z.literal(806),
  reviewed_plan_sha256: z.string().regex(/^[0-9a-f]{64}$/),
  reviewed_receipt_sha256: z.string().regex(/^[0-9a-f]{64}$/),
  reviewed_rules_sha256: z.string().regex(/^[0-9a-f]{64}$/),
  phase_c_source_sha256: z.literal(CHRONICLE_PHASE_C_SOURCE_SHA256),
  reviewed_chapters_sha256: z.literal(CHRONICLE_REVIEWED_CHAPTERS_SHA256),
});

export type WorkManualMetadata = z.infer<typeof workManualMetadataSchema>;

export type WorkManualValidationResult = Readonly<{
  ok: boolean;
  errors: readonly string[];
  metadata: WorkManualMetadata | null;
  wordCount: number;
  chaptersSha256: string;
  readingPathWordCounts: Readonly<{
    routine: number;
    connected: number;
    multiSystem: number;
  }>;
}>;

export type WorkManualPointerSource = Readonly<{
  label: string;
  source: string;
  enforceWordCeiling?: boolean;
}>;

export type WorkManualReadingPathSupplements = Readonly<{
  defaultSources?: readonly string[];
  routineSources?: readonly string[];
  connectedSources?: readonly string[];
  multiSystemSources?: readonly string[];
}>;

export type WorkManualReadingPathValidationResult = Readonly<{
  ok: boolean;
  errors: readonly string[];
  counts: WorkManualValidationResult["readingPathWordCounts"];
}>;

function parseFrontmatter(source: string) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error("missing valid YAML frontmatter");
  return { data: parseYaml(match[1]), body: match[2] };
}

function countExactHeading(source: string, level: number, heading: string) {
  const prefix = "#".repeat(level);
  return source
    .split(/\r?\n/)
    .filter((line) => line === `${prefix} ${heading}`).length;
}

function countWords(source: string) {
  return source.trim().split(/\s+/).filter(Boolean).length;
}

function sha256(source: string) {
  return createHash("sha256").update(source).digest("hex");
}

function chapterSource(source: string, heading: string) {
  const normalized = source.replace(/\r\n/g, "\n");
  const marker = `## ${heading}\n`;
  const start = normalized.indexOf(marker);
  if (start < 0) return "";
  const next = normalized.indexOf("\n## ", start + marker.length);
  return normalized.slice(start, next < 0 ? normalized.length : next);
}

export function getWorkManualNamedSectionSource(
  source: string,
  heading: string,
) {
  const normalized = source.replace(/\r\n/g, "\n");
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const marker = new RegExp(`^(#{2,6}) ${escapedHeading}$`, "m").exec(normalized);
  if (!marker || marker.index === undefined) return "";

  const level = marker[1].length;
  const bodyStart = marker.index + marker[0].length;
  const laterHeading = new RegExp(`^#{2,${level}} .+$`, "gm");
  laterHeading.lastIndex = bodyStart;
  const next = laterHeading.exec(normalized);
  return normalized.slice(marker.index, next?.index ?? normalized.length);
}

function supplementalWordCount(sources: readonly string[] | undefined) {
  return countWords((sources ?? []).join("\n"));
}

export function getWorkManualReadingPathWordCounts(
  source: string,
  supplements: WorkManualReadingPathSupplements = {},
) {
  const chapters = new Map<string, string>(
    CHRONICLE_WORK_MANUAL_CHAPTERS.map((heading) => [
      heading,
      chapterSource(source, heading),
    ]),
  );
  const combine = (headings: readonly string[]) =>
    countWords(headings.map((heading) => chapters.get(heading) ?? "").join("\n"));

  const defaultWords = supplementalWordCount(supplements.defaultSources);

  return Object.freeze({
    routine:
      combine(["1. Start Here", "2. Routine Local Work"]) +
      defaultWords +
      supplementalWordCount(supplements.routineSources),
    connected:
      combine([
        "1. Start Here",
        "3. Connected Feature Work",
        "7. Evidence and Human Review",
        "11. Checks, Delivery, and Reporting",
      ]) +
      defaultWords +
      supplementalWordCount(supplements.connectedSources),
    multiSystem:
      combine(CHRONICLE_WORK_MANUAL_CHAPTERS) +
      defaultWords +
      supplementalWordCount(supplements.multiSystemSources),
  });
}

export function validateWorkManualReadingPaths(
  source: string,
  supplements: WorkManualReadingPathSupplements = {},
): WorkManualReadingPathValidationResult {
  const errors: string[] = [];
  const counts = getWorkManualReadingPathWordCounts(source, supplements);

  for (const [label, actual, maximum] of [
    ["Routine", counts.routine, 4_000],
    ["Connected", counts.connected, 8_000],
    ["Multi-System", counts.multiSystem, 15_000],
  ] as const) {
    if (actual > maximum) {
      errors.push(
        `${label} Work Manual reading path exceeds the ${maximum.toLocaleString("en-US")}-word ceiling: ${actual}`,
      );
    }
  }

  return Object.freeze({
    ok: errors.length === 0,
    errors: Object.freeze(errors),
    counts,
  });
}

export function getReviewedChaptersSource(source: string) {
  const marker = "## 1. Start Here\n";
  const normalized = source.replace(/\r\n/g, "\n");
  const index = normalized.indexOf(marker);
  return index < 0 ? "" : normalized.slice(index);
}

export function validateWorkManualSource(
  source: string,
): WorkManualValidationResult {
  const errors: string[] = [];
  let metadata: WorkManualMetadata | null = null;
  let body = "";

  try {
    const parsed = parseFrontmatter(source);
    body = parsed.body;
    const result = workManualMetadataSchema.safeParse(parsed.data);
    if (!result.success) {
      errors.push(`invalid Work Manual metadata: ${result.error.message}`);
    } else {
      metadata = result.data;
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "invalid Work Manual source");
  }

  if (countExactHeading(body, 1, "Chronicle Work Manual") !== 1) {
    errors.push('expected exactly one level-one heading "Chronicle Work Manual"');
  }

  for (const heading of CHRONICLE_WORK_MANUAL_CHAPTERS) {
    const count = countExactHeading(body, 2, heading);
    if (count !== 1) {
      errors.push(
        `expected exactly one level-two heading "${heading}", found ${count}`,
      );
    }
  }

  const wordCount = countWords(source);
  if (wordCount > 25_000) {
    errors.push(`Work Manual exceeds the 25,000-word ceiling: ${wordCount}`);
  }

  const readingPathValidation = validateWorkManualReadingPaths(source);
  const readingPathWordCounts = readingPathValidation.counts;
  errors.push(...readingPathValidation.errors);

  const reviewedChapters = getReviewedChaptersSource(source);
  const chaptersSha256 = sha256(reviewedChapters);
  if (chaptersSha256 !== CHRONICLE_REVIEWED_CHAPTERS_SHA256) {
    errors.push(
      `reviewed chapter bytes changed: expected ${CHRONICLE_REVIEWED_CHAPTERS_SHA256}, found ${chaptersSha256}`,
    );
  }

  if (containsOverbroadChronicleGate(source)) {
    errors.push("Work Manual contains an overbroad Chronicle stop gate");
  }

  return Object.freeze({
    ok: errors.length === 0,
    errors,
    metadata,
    wordCount,
    chaptersSha256,
    readingPathWordCounts,
  });
}

function markerLines(source: string, prefix: string) {
  return source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith(prefix));
}

function duplicatesWorkflowAuthority(source: string) {
  const copiedChapters = CHRONICLE_WORK_MANUAL_CHAPTERS.filter(
    (heading) => countExactHeading(source, 2, heading) > 0,
  ).length;
  const copiedRuleIds = source.match(/\[WM-[A-Z0-9-]+\]/g)?.length ?? 0;
  const obsoleteRouteAuthority =
    /Chronicle route policy:|Route [1-4] —|Mandatory Route Selection/.test(source);
  return copiedChapters > 0 || copiedRuleIds > 0 || obsoleteRouteAuthority;
}

function containsOverbroadChronicleGate(source: string) {
  return [
    /stop all ordinary Chronicle work/i,
    /only a task explicitly requested to perform the read-only cutover authority proof may inspect/i,
    /must not classify, edit, test, delegate, or continue product work/i,
    /\b(?:all|every) Chronicle (?:task|thread)s? (?:must|should|shall) (?:stop|pause|wait)\b/i,
  ].some((pattern) => pattern.test(source));
}

export function validateWorkManualPointers(
  metadata: WorkManualMetadata,
  sources: readonly WorkManualPointerSource[],
) {
  const errors: string[] = [];
  const pathMarker = `Chronicle Work Manual: ${metadata.canonical_path}`;
  const versionMarker = `Chronicle Work Manual version: ${metadata.manual_version}`;

  for (const pointer of sources) {
    const pathMarkers = markerLines(pointer.source, "Chronicle Work Manual:");
    const versionMarkers = markerLines(
      pointer.source,
      "Chronicle Work Manual version:",
    );

    if (pathMarkers.length !== 1 || pathMarkers[0] !== pathMarker) {
      errors.push(
        `${pointer.label} must contain exactly one canonical Work Manual path marker`,
      );
    }
    if (versionMarkers.length !== 1 || versionMarkers[0] !== versionMarker) {
      errors.push(
        `${pointer.label} must contain exactly one current Work Manual version marker`,
      );
    }
    if (duplicatesWorkflowAuthority(pointer.source)) {
      errors.push(`${pointer.label} duplicates or revives Chronicle workflow authority`);
    }
    if (containsOverbroadChronicleGate(pointer.source)) {
      errors.push(`${pointer.label} contains an overbroad Chronicle stop gate`);
    }
    if (pointer.enforceWordCeiling !== false && countWords(pointer.source) > 250) {
      errors.push(`${pointer.label} exceeds the 250-word onboarding ceiling`);
    }
  }

  return Object.freeze({ ok: errors.length === 0, errors });
}
