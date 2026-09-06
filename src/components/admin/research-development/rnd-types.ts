import type { ComponentType, ReactNode } from "react";

export const RND_SCHEMA_VERSION = 1 as const;

export type PreviewBackground =
  | "charcoal"
  | "light"
  | "slate"
  | "paper"
  | "ink"
  | "checkerboard";

export type RndDocumentBlock =
  | { id: string; type: "text"; text: string }
  | { id: string; type: "image"; assetId: string };

export interface RndMockupRecord {
  schemaVersion: typeof RND_SCHEMA_VERSION;
  id: string;
  displayTitle: string;
  purpose: string;
  documentBlocks: RndDocumentBlock[];
  notes: string;
  createdAt: string;
  contentUpdatedAt: string;
  previewBackground: PreviewBackground;
  assetIds: string[];
}

export interface RndReferenceAsset {
  id: string;
  mockupId: string;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  blob: Blob;
}

export type RndUiReuseMethod =
  | "direct"
  | "presentational-adapter"
  | "shared-style-contract"
  | "new-pattern";

export interface RndUiPrecedent {
  element: string;
  sourcePath: string;
  reuseMethod: RndUiReuseMethod;
  note?: string;
}

export interface RndPrototypeSectionDefinition {
  id: string;
  title: string;
  createdAt: string;
  sourceUpdatedAt: string;
  sourcePath: string;
  uiPrecedents: readonly RndUiPrecedent[];
  Preview: ComponentType;
  details: ReactNode;
}

export interface RndPrototypeDefinition {
  id: string;
  defaultTitle: string;
  defaultPurpose: string;
  createdAt: string;
  sourceUpdatedAt: string;
  sourcePath: string;
  uiPrecedents: readonly RndUiPrecedent[];
  Preview: ComponentType;
  details: ReactNode;
  additionalSections?: readonly RndPrototypeSectionDefinition[];
}

export interface RndWorkspaceData {
  mockups: RndMockupRecord[];
  assets: RndReferenceAsset[];
}
