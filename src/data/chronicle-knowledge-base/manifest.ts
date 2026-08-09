import rawManifest from "../../../docs/architecture-knowledge/manifest.json";
import chronicleOverviewSource from "../../../docs/architecture-knowledge/chronicle-overview.md?raw";
import communityGallerySource from "../../../docs/architecture-knowledge/community-gallery.md?raw";
import roughDraftSource from "../../../docs/architecture-knowledge/chronicle-application-manual-writer-rough-draft.md?raw";
import supabaseTablesSource from "../../../docs/architecture-knowledge/supabase-tables.md?raw";
import { galleryOperationalRecordRegistry } from "./operational-record-sources";

export type KnowledgeContentKind =
  | "blank"
  | "issue-records"
  | "current-work-records"
  | "changelog-records"
  | "markdown-section"
  | "shared-supabase";

export type KnowledgeTab = {
  id: string;
  label: string;
  contentKind: KnowledgeContentKind;
  heading?: string;
  reviewed?: string;
  updated?: string;
  openIssueCount?: number;
};

export type KnowledgeSection = {
  id: string;
  label: string;
  description: string;
  document?: string;
  tabs: KnowledgeTab[];
};

type ManifestCapability = Omit<KnowledgeSection, "tabs"> & {
  tabs?: KnowledgeTab[];
};

export type ChronicleKnowledgeBaseManifest = {
  version: number;
  reviewedCommit: string;
  applicationMap: KnowledgeSection;
  capabilities: ManifestCapability[];
  defaultCapabilityTabs: KnowledgeTab[];
  sharedDocuments: {
    supabase: string;
    roughDraft: string;
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
  "community-gallery.md": communityGallerySource,
  "chronicle-application-manual-writer-rough-draft.md": roughDraftSource,
  "supabase-tables.md": supabaseTablesSource,
};

function cloneTabs(tabs: KnowledgeTab[], sectionId: string) {
  return tabs.map((tab) => ({
    ...tab,
    openIssueCount:
      sectionId === "community-gallery" && tab.contentKind === "issue-records"
        ? galleryOperationalRecordRegistry.openIssueCount
        : undefined,
  }));
}

export const chronicleKnowledgeSections: KnowledgeSection[] = [
  {
    ...chronicleKnowledgeBaseManifest.applicationMap,
    tabs: cloneTabs(
      chronicleKnowledgeBaseManifest.applicationMap.tabs,
      chronicleKnowledgeBaseManifest.applicationMap.id,
    ),
  },
  ...chronicleKnowledgeBaseManifest.capabilities.map((capability) => ({
    ...capability,
    tabs: cloneTabs(
      capability.tabs ?? chronicleKnowledgeBaseManifest.defaultCapabilityTabs,
      capability.id,
    ),
  })),
];

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

export const chronicleKnowledgeRoughDraft = getKnowledgeDocumentSource(
  chronicleKnowledgeBaseManifest.sharedDocuments.roughDraft,
);
