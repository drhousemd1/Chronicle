import rawManifest from "../../../docs/architecture-knowledge/manifest.json";
import chronicleOverviewSource from "../../../docs/architecture-knowledge/chronicle-overview.md?raw";
import chronicleWorkManualDocumentSource from "../../../docs/architecture-knowledge/chronicle-work-manual.md?raw";
import communityGallerySource from "../../../docs/architecture-knowledge/community-gallery.md?raw";
import myStoriesSource from "../../../docs/architecture-knowledge/my-stories.md?raw";
import characterLibrarySource from "../../../docs/architecture-knowledge/character-library.md?raw";
import myImagesSource from "../../../docs/architecture-knowledge/my-images.md?raw";
import storyBuilderSource from "../../../docs/architecture-knowledge/story-builder.md?raw";
import characterBuilderSource from "../../../docs/architecture-knowledge/character-builder.md?raw";
import chatInterfaceSource from "../../../docs/architecture-knowledge/chat-interface.md?raw";
import roleplayPipelineSource from "../../../docs/architecture-knowledge/roleplay-pipeline.md?raw";
import chatHistorySource from "../../../docs/architecture-knowledge/chat-history.md?raw";
import publicProfileSource from "../../../docs/architecture-knowledge/public-profile.md?raw";
import accountSource from "../../../docs/architecture-knowledge/account.md?raw";
import adminPanelSource from "../../../docs/architecture-knowledge/admin-panel.md?raw";
import sharedApplicationSystemsSource from "../../../docs/architecture-knowledge/shared-application-systems.md?raw";
import supabaseTablesSource from "../../../docs/architecture-knowledge/supabase-tables.md?raw";
import knowledgeBaseSystemSource from "../../../docs/architecture-knowledge/knowledge-base-system.md?raw";
import schemaReferenceSource from "../../../docs/architecture-knowledge/schema-reference.md?raw";
import qualityHubSource from "../../../docs/architecture-knowledge/quality-hub.md?raw";
import validationEvidenceLedgerSource from "../../../docs/architecture-knowledge/validation-evidence-ledger.md?raw";
import financeDashboardSource from "../../../docs/architecture-knowledge/finance-dashboard.md?raw";
import researchDevelopmentSource from "../../../docs/architecture-knowledge/research-development.md?raw";
import imageGenerationSource from "../../../docs/architecture-knowledge/image-generation.md?raw";
import appDashboardSource from "../../../docs/architecture-knowledge/app-dashboard.md?raw";
import { getOperationalCapability } from "./operational-capability-registry";
import { getCapabilityOperationalRecordRegistry } from "./operational-record-sources";

export type KnowledgeContentKind =
  | "blank"
  | "issue-records"
  | "current-work-records"
  | "changelog-records"
  | "shared-records"
  | "markdown-section"
  | "work-manual-chapter"
  | "shared-supabase";

export type KnowledgeTab = {
  id: string;
  label: string;
  contentKind: KnowledgeContentKind;
  heading?: string;
  headings?: string[];
  legacyIds?: string[];
  reviewed?: string;
  updated?: string;
  openIssueCount?: number;
};

export type KnowledgeSection = {
  id: string;
  label: string;
  description: string;
  document?: string;
  recordScope?: "admin" | "knowledge-system";
  tabs: KnowledgeTab[];
};

export type ChronicleKnowledgeBaseManifest = {
  version: number;
  reviewedCommit: string;
  applicationMap: KnowledgeSection;
  workManual: KnowledgeSection;
  capabilities: KnowledgeSection[];
  adminTools: KnowledgeSection[];
  sharedDocuments: {
    supabase: string;
  };
};

export type ParsedKnowledgeDocument = {
  headings: string[];
  contentByHeading: Map<string, string>;
};

export const chronicleKnowledgeBaseManifest =
  rawManifest as ChronicleKnowledgeBaseManifest;

const markdownDocuments: Record<string, string> = {
  "chronicle-overview.md": chronicleOverviewSource,
  "chronicle-work-manual.md": chronicleWorkManualDocumentSource,
  "community-gallery.md": communityGallerySource,
  "my-stories.md": myStoriesSource,
  "character-library.md": characterLibrarySource,
  "my-images.md": myImagesSource,
  "story-builder.md": storyBuilderSource,
  "character-builder.md": characterBuilderSource,
  "chat-interface.md": chatInterfaceSource,
  "roleplay-pipeline.md": roleplayPipelineSource,
  "chat-history.md": chatHistorySource,
  "public-profile.md": publicProfileSource,
  "account.md": accountSource,
  "admin-panel.md": adminPanelSource,
  "shared-application-systems.md": sharedApplicationSystemsSource,
  "supabase-tables.md": supabaseTablesSource,
  "knowledge-base-system.md": knowledgeBaseSystemSource,
  "schema-reference.md": schemaReferenceSource,
  "quality-hub.md": qualityHubSource,
  "validation-evidence-ledger.md": validationEvidenceLedgerSource,
  "finance-dashboard.md": financeDashboardSource,
  "research-development.md": researchDevelopmentSource,
  "image-generation.md": imageGenerationSource,
  "app-dashboard.md": appDashboardSource,
};

function cloneTabs(tabs: KnowledgeTab[], sectionId: string) {
  const operationalCapability = getOperationalCapability(sectionId);
  const operationalRegistry = operationalCapability
    ? getCapabilityOperationalRecordRegistry(operationalCapability.id)
    : null;
  return tabs.map((tab) => ({
    ...tab,
    openIssueCount:
      operationalRegistry && tab.contentKind === "issue-records"
        ? operationalRegistry.openIssueCount
        : undefined,
  }));
}

export const chronicleWorkManualSection: KnowledgeSection = {
  ...chronicleKnowledgeBaseManifest.workManual,
  tabs: cloneTabs(
    chronicleKnowledgeBaseManifest.workManual.tabs,
    chronicleKnowledgeBaseManifest.workManual.id,
  ),
};

export const chronicleAdminToolSections: KnowledgeSection[] =
  chronicleKnowledgeBaseManifest.adminTools.map((section) => ({
    ...section,
    tabs: cloneTabs(section.tabs, section.id),
  }));

export const chronicleKnowledgeSections: KnowledgeSection[] = [
  {
    ...chronicleKnowledgeBaseManifest.applicationMap,
    tabs: cloneTabs(
      chronicleKnowledgeBaseManifest.applicationMap.tabs,
      chronicleKnowledgeBaseManifest.applicationMap.id,
    ),
  },
  chronicleWorkManualSection,
  ...chronicleKnowledgeBaseManifest.capabilities.map((capability) => ({
    ...capability,
    tabs: cloneTabs(capability.tabs, capability.id),
  })),
  ...chronicleAdminToolSections,
];

export const chronicleWorkManualSource = chronicleWorkManualDocumentSource;

export type ChronicleWorkManualDisplayMetadata = Readonly<{
  manualVersion: string;
  status: string;
  authorityEpoch: string;
  reviewedOn: string;
  reviewedRepositoryHead: string;
  reviewedChaptersSha256: string;
  canonicalPath: string;
}>;

function parseSimpleFrontmatter(source: string) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) throw new Error("Chronicle Work Manual is missing frontmatter.");
  const values = new Map<string, string>();
  for (const line of match[1].split(/\r?\n/)) {
    const field = line.match(/^([a-z0-9_]+):\s*(.+)$/i);
    if (field) values.set(field[1], field[2].trim());
  }
  return values;
}

export const chronicleWorkManualMetadata: ChronicleWorkManualDisplayMetadata = (() => {
  const metadata = parseSimpleFrontmatter(chronicleWorkManualDocumentSource);
  return Object.freeze({
    manualVersion: metadata.get("manual_version") ?? "Unknown",
    status: metadata.get("status") ?? "Unknown",
    authorityEpoch: metadata.get("authority_epoch") ?? "Unknown",
    reviewedOn: metadata.get("reviewed_on") ?? "Unknown",
    reviewedRepositoryHead:
      metadata.get("reviewed_repository_head") ?? "Unknown",
    reviewedChaptersSha256:
      metadata.get("reviewed_chapters_sha256") ?? "Unknown",
    canonicalPath: metadata.get("canonical_path") ?? "Unknown",
  });
})();

export function parseKnowledgeDocument(source: string): ParsedKnowledgeDocument {
  const headingPattern = /^# ([^\r\n]+)\r?$/gm;
  const matches = Array.from(source.matchAll(headingPattern));
  const contentByHeading = new Map<string, string>();

  matches.forEach((match, index) => {
    const heading = match[1].trim();
    const start = (match.index ?? 0) + match[0].length;
    const end = matches[index + 1]?.index ?? source.length;
    contentByHeading.set(heading, source.slice(start, end).trim());
  });

  return {
    headings: matches.map((match) => match[1].trim()),
    contentByHeading,
  };
}

export function parseWorkManualDocument(
  source: string,
): ParsedKnowledgeDocument {
  const headingPattern = /^## ([^\r\n]+)\r?$/gm;
  const matches = Array.from(source.matchAll(headingPattern));
  const contentByHeading = new Map<string, string>();

  matches.forEach((match, index) => {
    const heading = match[1].trim();
    const start = (match.index ?? 0) + match[0].length;
    const end = matches[index + 1]?.index ?? source.length;
    contentByHeading.set(heading, source.slice(start, end).trim());
  });

  return {
    headings: matches.map((match) => match[1].trim()),
    contentByHeading,
  };
}

export function getWorkManualPreface(source: string) {
  const withoutFrontmatter = source.replace(
    /^---\r?\n[\s\S]*?\r?\n---\r?\n/,
    "",
  );
  const firstChapterIndex = withoutFrontmatter.search(/^## /m);
  const preface = (
    firstChapterIndex >= 0
      ? withoutFrontmatter.slice(0, firstChapterIndex)
      : withoutFrontmatter
  ).trim();

  return preface.replace(/^# Chronicle Work Manual\r?\n+/, "").trim();
}

export function getKnowledgeDocumentSource(documentName: string) {
  const source = markdownDocuments[documentName];

  if (typeof source !== "string") {
    throw new Error(`Missing Chronicle Knowledge Base document: ${documentName}`);
  }

  return source;
}

export function getKnowledgeTabMarkdown(
  section: KnowledgeSection,
  tab: KnowledgeTab,
) {
  if (tab.contentKind === "shared-supabase") {
    return getKnowledgeDocumentSource(
      chronicleKnowledgeBaseManifest.sharedDocuments.supabase,
    );
  }

  if (
    tab.contentKind === "work-manual-chapter" &&
    section.document &&
    (tab.headings?.length || tab.heading)
  ) {
    const parsed = parseWorkManualDocument(
      getKnowledgeDocumentSource(section.document),
    );
    const headings = tab.headings?.length
      ? tab.headings
      : tab.heading
        ? [tab.heading]
        : [];

    return headings
      .map((heading) => {
        const content = parsed.contentByHeading.get(heading) ?? "";
        return `## ${heading}\n\n${content}`;
      })
      .join("\n\n");
  }

  if (tab.contentKind !== "markdown-section" || !section.document || !tab.heading) {
    return "";
  }

  return (
    parseKnowledgeDocument(
      getKnowledgeDocumentSource(section.document),
    ).contentByHeading.get(tab.heading) ?? ""
  );
}

export function getKnowledgeIssueCount(tab: KnowledgeTab) {
  return tab.contentKind === "issue-records" ? (tab.openIssueCount ?? 0) : 0;
}
