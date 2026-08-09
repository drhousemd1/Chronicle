export type ChangelogRecordScope = "global" | "community-gallery";

export type ChangelogRecordOrigin =
  | "knowledge-base"
  | "quality-hub"
  | "quality-hub-overview"
  | "archive";

export const CHANGELOG_RECORD_ORIGINS_BY_SCOPE = {
  global: ["quality-hub", "quality-hub-overview"],
  "community-gallery": ["knowledge-base", "quality-hub", "archive"],
} as const satisfies Readonly<
  Record<ChangelogRecordScope, readonly ChangelogRecordOrigin[]>
>;

export function normalizeChangelogRecordOrigin(
  scope: ChangelogRecordScope,
  origin: string | null | undefined,
): ChangelogRecordOrigin {
  const compatibleOrigins: readonly ChangelogRecordOrigin[] =
    CHANGELOG_RECORD_ORIGINS_BY_SCOPE[scope];
  if (
    origin &&
    compatibleOrigins.includes(origin as ChangelogRecordOrigin)
  ) {
    return origin as ChangelogRecordOrigin;
  }
  return scope === "community-gallery" ? "knowledge-base" : "quality-hub";
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
  return `/style-guide/changelog/${encodeURIComponent(recordId)}?${query.toString()}`;
}
