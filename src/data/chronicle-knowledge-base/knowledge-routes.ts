import type { ChronicleCapabilityId } from "./capability-ids";
import type { AdminToolSectionId } from "./admin-tool-ids";

export type ChronicleKnowledgeSectionId =
  | ChronicleCapabilityId
  | AdminToolSectionId
  | "chronicle-overview";

export const CHRONICLE_KNOWLEDGE_ROUTE_REGISTRY = Object.freeze({
  knowledgeBase: "/style-guide/chronicle-knowledge-base",
  qualityHub: "/style-guide/ui-audit",
  changelogRecord: "/style-guide/changelog",
} as const);

function changelogHash(recordId?: string) {
  return recordId ? `#changelog-${encodeURIComponent(recordId)}` : "";
}

export function buildKnowledgeBaseTabHref(
  section: ChronicleKnowledgeSectionId,
  tab: string,
  recordId?: string,
) {
  const query = new URLSearchParams({ section, tab });
  return `${CHRONICLE_KNOWLEDGE_ROUTE_REGISTRY.knowledgeBase}?${query.toString()}${changelogHash(recordId)}`;
}

export function buildQualityHubChangelogHref(
  capability?: ChronicleCapabilityId,
  recordId?: string,
) {
  const query = new URLSearchParams({ view: "changelog" });
  if (capability) query.set("capability", capability);
  return `${CHRONICLE_KNOWLEDGE_ROUTE_REGISTRY.qualityHub}?${query.toString()}${changelogHash(recordId)}`;
}

export function buildQualityHubOverviewHref(recordId?: string) {
  return `${CHRONICLE_KNOWLEDGE_ROUTE_REGISTRY.qualityHub}${changelogHash(recordId)}`;
}

export function buildChangelogRecordPath(recordId: string) {
  return `${CHRONICLE_KNOWLEDGE_ROUTE_REGISTRY.changelogRecord}/${encodeURIComponent(recordId)}`;
}

export function buildArchivedCurrentWorkHref(projectId: string) {
  return `${CHRONICLE_KNOWLEDGE_ROUTE_REGISTRY.knowledgeBase}/archive/${encodeURIComponent(projectId)}`;
}
