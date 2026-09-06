import { buildChangelogRecordPath } from "@/data/chronicle-knowledge-base/knowledge-routes";
import type { ChronicleCapabilityId } from "@/data/chronicle-knowledge-base/capability-ids";

export type ChangelogRecordScope = "global" | ChronicleCapabilityId;

export type ChangelogRecordOrigin =
  | "knowledge-base"
  | "quality-hub"
  | "quality-hub-overview"
  | "archive";

const GLOBAL_CHANGELOG_ORIGINS: readonly ChangelogRecordOrigin[] = [
  "quality-hub",
  "quality-hub-overview",
];
const CAPABILITY_CHANGELOG_ORIGINS: readonly ChangelogRecordOrigin[] = [
  "knowledge-base",
  "quality-hub",
  "archive",
];

export function normalizeChangelogRecordOrigin(
  scope: ChangelogRecordScope,
  origin: string | null | undefined,
): ChangelogRecordOrigin {
  const compatibleOrigins: readonly ChangelogRecordOrigin[] =
    scope === "global" ? GLOBAL_CHANGELOG_ORIGINS : CAPABILITY_CHANGELOG_ORIGINS;
  if (
    origin &&
    compatibleOrigins.includes(origin as ChangelogRecordOrigin)
  ) {
    return origin as ChangelogRecordOrigin;
  }
  return scope === "global" ? "quality-hub" : "knowledge-base";
}

export function buildChangelogRecordHref(
  recordId: string,
  scope: ChangelogRecordScope,
  origin: ChangelogRecordOrigin,
) {
  const query = new URLSearchParams({
    scope,
    from: normalizeChangelogRecordOrigin(scope, origin),
  });
  return `${buildChangelogRecordPath(recordId)}?${query.toString()}`;
}
