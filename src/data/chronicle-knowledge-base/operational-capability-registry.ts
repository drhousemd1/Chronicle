export const OPERATIONAL_CAPABILITIES = Object.freeze([
  Object.freeze({
    id: "community-gallery",
    displayName: "Community Gallery",
    recordPrefix: "CG",
    activePath: "docs/current-work/active/community-gallery",
    archivePath: "docs/current-work/archive/community-gallery",
  }),
  Object.freeze({
    id: "my-stories",
    displayName: "My Stories",
    recordPrefix: "MS",
    activePath: "docs/current-work/active/my-stories",
    archivePath: "docs/current-work/archive/my-stories",
  }),
  Object.freeze({
    id: "character-library",
    displayName: "Character Library",
    recordPrefix: "CL",
    activePath: "docs/current-work/active/character-library",
    archivePath: "docs/current-work/archive/character-library",
  }),
  Object.freeze({
    id: "my-images",
    displayName: "Image Library",
    recordPrefix: "MI",
    activePath: "docs/current-work/active/my-images",
    archivePath: "docs/current-work/archive/my-images",
  }),
  Object.freeze({
    id: "story-builder",
    displayName: "Story Builder",
    recordPrefix: "SB",
    activePath: "docs/current-work/active/story-builder",
    archivePath: "docs/current-work/archive/story-builder",
  }),
  Object.freeze({
    id: "character-builder",
    displayName: "Character Builder",
    recordPrefix: "CB",
    activePath: "docs/current-work/active/character-builder",
    archivePath: "docs/current-work/archive/character-builder",
  }),
  Object.freeze({
    id: "chat-interface",
    displayName: "Chat Interface",
    recordPrefix: "CI",
    activePath: "docs/current-work/active/chat-interface",
    archivePath: "docs/current-work/archive/chat-interface",
  }),
  Object.freeze({
    id: "roleplay-pipeline",
    displayName: "Roleplay Pipeline",
    recordPrefix: "RP",
    activePath: "docs/current-work/active/roleplay-pipeline",
    archivePath: "docs/current-work/archive/roleplay-pipeline",
  }),
  Object.freeze({
    id: "chat-history",
    displayName: "Chat History",
    recordPrefix: "CH",
    activePath: "docs/current-work/active/chat-history",
    archivePath: "docs/current-work/archive/chat-history",
  }),
  Object.freeze({
    id: "public-profile",
    displayName: "Public Profile",
    recordPrefix: "PP",
    activePath: "docs/current-work/active/public-profile",
    archivePath: "docs/current-work/archive/public-profile",
  }),
  Object.freeze({
    id: "account",
    displayName: "Account & Subscription",
    recordPrefix: "AC",
    activePath: "docs/current-work/active/account",
    archivePath: "docs/current-work/archive/account",
  }),
  Object.freeze({
    id: "admin",
    displayName: "Admin Panel",
    recordPrefix: "AD",
    activePath: "docs/current-work/active/admin",
    archivePath: "docs/current-work/archive/admin",
  }),
  Object.freeze({
    id: "shared-systems",
    displayName: "Shared Application Systems",
    recordPrefix: "SA",
    activePath: "docs/current-work/active/shared-systems",
    archivePath: "docs/current-work/archive/shared-systems",
  }),
  Object.freeze({
    id: "knowledge-system",
    displayName: "Chronicle Knowledge System",
    recordPrefix: "KS",
    activePath: "docs/current-work/active/knowledge-system",
    archivePath: "docs/current-work/archive/knowledge-system",
  }),
] as const);

export type OperationalCapabilityId =
  (typeof OPERATIONAL_CAPABILITIES)[number]["id"];
export type OperationalRecordPrefix =
  (typeof OPERATIONAL_CAPABILITIES)[number]["recordPrefix"];
export type OperationalCapability =
  (typeof OPERATIONAL_CAPABILITIES)[number];

export const ISSUE_OPERATIONAL_CAPABILITIES = Object.freeze(
  OPERATIONAL_CAPABILITIES.filter(
    (capability) => capability.id !== "knowledge-system",
  ),
);

const CAPABILITY_BY_ID = new Map<OperationalCapabilityId, OperationalCapability>(
  OPERATIONAL_CAPABILITIES.map((entry) => [entry.id, entry]),
);
const CAPABILITY_BY_PREFIX = new Map<
  OperationalRecordPrefix,
  OperationalCapability
>(OPERATIONAL_CAPABILITIES.map((entry) => [entry.recordPrefix, entry]));
const ISSUE_CAPABILITY_BY_PREFIX = new Map<
  OperationalRecordPrefix,
  OperationalCapability
>(
  ISSUE_OPERATIONAL_CAPABILITIES.map((entry) => [entry.recordPrefix, entry]),
);

const PROJECT_ID = /^([A-Z]{2})-WORK-(\d{3})$/;
const ISSUE_ID = /^([A-Z]{2})-ISSUE-(\d{3})$/;

export function getOperationalCapability(
  capabilityId: string,
): OperationalCapability | null {
  return (
    CAPABILITY_BY_ID.get(capabilityId as OperationalCapabilityId) ?? null
  );
}

export function getOperationalCapabilityByPrefix(
  prefix: string,
): OperationalCapability | null {
  return (
    CAPABILITY_BY_PREFIX.get(prefix as OperationalRecordPrefix) ?? null
  );
}

export function parseOperationalProjectId(projectId: string) {
  const match = projectId.match(PROJECT_ID);
  const capability = match
    ? getOperationalCapabilityByPrefix(match[1])
    : null;
  if (!match || !capability) {
    throw new Error(`Unsupported Chronicle Current Work project ID ${JSON.stringify(projectId)}.`);
  }
  return Object.freeze({
    projectId,
    sequence: match[2],
    capability,
  });
}

export function isOperationalProjectId(projectId: string) {
  try {
    parseOperationalProjectId(projectId);
    return true;
  } catch {
    return false;
  }
}

export function parseOperationalIssueId(issueId: string) {
  const match = issueId.match(ISSUE_ID);
  const capability = match
    ? ISSUE_CAPABILITY_BY_PREFIX.get(match[1] as OperationalRecordPrefix)
    : null;
  if (!match || !capability) {
    throw new Error(`Unsupported Chronicle Issue ID ${JSON.stringify(issueId)}.`);
  }
  return Object.freeze({
    issueId,
    sequence: match[2],
    capability,
  });
}

export function isOperationalIssueId(issueId: string) {
  try {
    parseOperationalIssueId(issueId);
    return true;
  } catch {
    return false;
  }
}

export function canonicalIssueSourcePath(issueId: string) {
  const parsed = parseOperationalIssueId(issueId);
  return `docs/architecture-knowledge/issues/${parsed.capability.id}/${parsed.issueId}.md`;
}

export function assertOperationalIssueOwner(
  issueId: string,
  ownerCapability: string,
) {
  const parsed = parseOperationalIssueId(issueId);
  if (parsed.capability.id !== ownerCapability) {
    throw new Error(
      `${issueId} belongs to ${parsed.capability.id}, not ${ownerCapability}.`,
    );
  }
  return parsed.capability;
}

export function canonicalCurrentWorkSourcePath(
  placement: "active" | "archive",
  projectId: string,
) {
  const parsed = parseOperationalProjectId(projectId);
  const directory =
    placement === "active"
      ? parsed.capability.activePath
      : parsed.capability.archivePath;
  return `${directory}/${parsed.projectId}.md`;
}

export function operationalNestedIdPattern(
  projectId: string,
  kind: "STEP" | "EV" | "LOG",
) {
  const { capability } = parseOperationalProjectId(projectId);
  return new RegExp(`^${capability.recordPrefix}-${kind}-\\d{3}$`);
}

export function isOperationalNestedId(
  projectId: string,
  kind: "STEP" | "EV" | "LOG",
  value: string,
) {
  return operationalNestedIdPattern(projectId, kind).test(value);
}

export function assertOperationalProjectOwner(
  projectId: string,
  ownerCapability: string,
) {
  const parsed = parseOperationalProjectId(projectId);
  if (parsed.capability.id !== ownerCapability) {
    throw new Error(
      `${projectId} belongs to ${parsed.capability.id}, not ${ownerCapability}.`,
    );
  }
  return parsed.capability;
}
