import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import {
  assertActiveKnowledgeCertificationContext,
  assertNoUnfinishedKnowledgeTransaction,
} from "./knowledge-record-transaction-guard.mjs";

const repoRoot = process.cwd();
assertActiveKnowledgeCertificationContext({
  repoRoot,
  expectedCommand: "knowledge-check",
});
assertNoUnfinishedKnowledgeTransaction({ repoRoot });
const knowledgeRoot = path.join(repoRoot, "docs", "architecture-knowledge");
const manifestPath = path.join(knowledgeRoot, "manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const errors = [];
const notes = [];

const expectedApplicationTabs = [
  "Overview",
  "Community Gallery",
  "My Stories",
  "Character Library",
  "My Images",
  "Story Builder",
  "Character Builder",
  "Chat Interface",
  "Chat History",
  "Public Profile",
  "Account Settings",
  "Admin Panel",
];

const expectedApplicationTabIds = [
  "overview",
  "community-gallery",
  "my-stories",
  "character-library",
  "my-images",
  "story-builder",
  "character-builder",
  "chat-interface",
  "chat-history",
  "public-profile",
  "account",
  "admin",
];

const expectedCapabilities = [
  {
    id: "community-gallery",
    label: "Community Gallery",
    description:
      "How people discover, evaluate, save, play, review, remix, and publish shared stories.",
  },
  {
    id: "my-stories",
    label: "My Stories",
    description:
      "How drafts, saved community stories, published work, imports, exports, and play entry are managed.",
  },
  {
    id: "character-library",
    label: "Character Library",
    description:
      "How reusable global characters are created, edited, selected, copied into stories, and kept separate from story-owned characters.",
  },
  {
    id: "my-images",
    label: "My Images",
    description:
      "How private images are uploaded, organized, viewed, copied into consuming features, and deleted.",
  },
  {
    id: "story-builder",
    label: "Story Builder",
    description:
      "How a story's world, direction, cast, opening state, media, and publication readiness are assembled.",
  },
  {
    id: "character-builder",
    label: "Character Builder",
    description:
      "How story and library characters are authored, enhanced, validated, and persisted.",
  },
  {
    id: "chat-interface",
    label: "Chat Interface",
    description:
      "The complete live roleplay lifecycle from player action through response construction, commit, support work, and evidence.",
  },
  {
    id: "chat-history",
    label: "Chat History",
    description:
      "How conversations are listed, resumed, paginated, identified, and deleted.",
  },
  {
    id: "public-profile",
    label: "Public Profile",
    description:
      "How creators edit their identity and how other users view, follow, and enter published work.",
  },
  {
    id: "account",
    label: "Account Settings",
    description:
      "How authentication, account settings, subscription visibility, sessions, and account actions work.",
  },
  {
    id: "admin",
    label: "Admin Panel",
    description:
      "How privileged operators enter the Admin hub and use specialist tools without confusing documentation, diagnostics, validation, and operations.",
  },
  {
    id: "shared-systems",
    label: "Shared Systems",
    description:
      "The shell, navigation, authentication, persistence, private media, caching, and shared state used across Chronicle.",
  },
  {
    id: "ai-api-services",
    label: "AI & API Services",
    description:
      "Shared provider transport, AI operations, support calls, usage accounting, and service-level failure boundaries.",
  },
  {
    id: "app-architecture-reference",
    label: "App Architecture Reference",
    description:
      "The exhaustive generated repository lookup that supports, but does not replace, the capability manuals.",
  },
];
const expectedCapabilityIds = expectedCapabilities.map(
  (capability) => capability.id,
);

const expectedGalleryTabs = [
  "Overview",
  "UI Elements and Functions",
  "App Architecture",
  "Issues",
  "Current Work",
  "Supabase Tables",
  "Changelog",
];

const expectedDefaultTabs = ["Overview", "Architecture", "Supabase Tables"];
const allowedContentKinds = new Set([
  "blank",
  "issue-records",
  "current-work-records",
  "changelog-records",
  "markdown-section",
  "shared-supabase",
]);
const operationalContentKinds = new Set([
  "issue-records",
  "current-work-records",
  "changelog-records",
]);

const expectedAssets = new Map([
  [
    "src/assets/architecture-knowledge-hub/community-gallery-overview.png",
    "161c0e5efc0b888da689a76c1681f26951db1c2b9461f42fe378e9a04684e3cc",
  ],
  [
    "src/assets/architecture-knowledge-hub/admin-panel-overview.png",
    "e4673e6a12705376bd6e2f8782b1e3fcd437a329def922fad0042804fa8b5d14",
  ],
]);

function addError(message) {
  errors.push(message);
}

function sha256File(filePath) {
  return crypto
    .createHash("sha256")
    .update(fs.readFileSync(filePath))
    .digest("hex");
}

function sameOrder(actual, expected) {
  return (
    actual.length === expected.length &&
    actual.every((value, index) => value === expected[index])
  );
}

function parseTopLevelHeadings(source) {
  return Array.from(
    source.matchAll(/^# ([^\r\n]+)\r?$/gm),
    (match) => match[1].trim(),
  );
}

function getTopLevelSection(source, heading) {
  const matches = Array.from(source.matchAll(/^# ([^\r\n]+)\r?$/gm));
  const matchIndex = matches.findIndex((match) => match[1].trim() === heading);
  if (matchIndex < 0) return "";

  const match = matches[matchIndex];
  const start = (match.index ?? 0) + match[0].length;
  const end = matches[matchIndex + 1]?.index ?? source.length;
  return source.slice(start, end).trim();
}

function collectManifestSections() {
  return [manifest.applicationMap, ...manifest.capabilities];
}

function readKnowledgeDocument(documentName, owner) {
  const filePath = path.join(knowledgeRoot, documentName);
  if (!fs.existsSync(filePath)) {
    addError(`${owner}: missing document ${documentName}`);
    return "";
  }
  return fs.readFileSync(filePath, "utf8");
}

function checkTabMetadata(owner, tab) {
  if (!tab.id || !tab.label || !tab.contentKind) {
    addError(`${owner}: every tab needs id, label, and contentKind`);
  }

  if (!allowedContentKinds.has(tab.contentKind)) {
    addError(`${owner}/${tab.id}: unsupported contentKind ${tab.contentKind}`);
  }

  for (const [field, value] of [
    ["reviewed", tab.reviewed],
    ["updated", tab.updated],
  ]) {
    if (value !== undefined && !/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
      addError(`${owner}/${tab.id}: ${field} must use MM/DD/YYYY`);
    }
  }

  if (tab.contentKind === "markdown-section" && !tab.heading) {
    addError(`${owner}/${tab.id}: markdown-section needs a heading`);
  }

  if (
    operationalContentKinds.has(tab.contentKind) &&
    (tab.heading || tab.reviewed || tab.updated || tab.issues)
  ) {
    addError(
      `${owner}/${tab.id}: operational tabs must derive content and dates from separate records`,
    );
  }

  if (tab.contentKind === "blank" && (tab.heading || tab.issues)) {
    addError(`${owner}/${tab.id}: blank tabs cannot carry hidden content`);
  }
}

function checkUniqueIds(owner, records) {
  const seen = new Set();
  for (const record of records) {
    if (seen.has(record.id)) addError(`${owner}: duplicate id ${record.id}`);
    seen.add(record.id);
  }
}

function checkMarkdownRouteLinks(owner, source, registeredRoutes) {
  for (const match of source.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const href = match[1].trim();
    if (!href.startsWith("/style-guide/")) continue;
    const route = href.split(/[?#]/)[0];
    if (!registeredRoutes.has(route)) {
      addError(`${owner}: unregistered internal route ${href}`);
    }
  }
}

if (manifest.version !== 1) {
  addError("Manifest version must remain 1 until a deliberate schema migration.");
}

if (!/^[0-9a-f]{40}$/.test(manifest.reviewedCommit ?? "")) {
  addError("Manifest reviewedCommit must be a full Git commit.");
}

const applicationTabLabels = manifest.applicationMap?.tabs?.map(
  (tab) => tab.label,
) ?? [];
if (!sameOrder(applicationTabLabels, expectedApplicationTabs)) {
  addError("Chronicle Overview tabs do not match the registered Knowledge Base order.");
}
const applicationTabIds = manifest.applicationMap?.tabs?.map(
  (tab) => tab.id,
) ?? [];
if (!sameOrder(applicationTabIds, expectedApplicationTabIds)) {
  addError("Chronicle Overview tab IDs do not match the registered Knowledge Base contract.");
}

const capabilityIds = manifest.capabilities?.map((section) => section.id) ?? [];
if (!sameOrder(capabilityIds, expectedCapabilityIds)) {
  addError("Capability order does not match the registered Knowledge Base contract.");
}
for (const expected of expectedCapabilities) {
  const actual = manifest.capabilities?.find(
    (capability) => capability.id === expected.id,
  );
  if (
    !actual ||
    actual.label !== expected.label ||
    actual.description !== expected.description
  ) {
    addError(
      `${expected.id}: capability identity or description does not match the registered Knowledge Base contract.`,
    );
  }
}

const gallery = manifest.capabilities?.find(
  (section) => section.id === "community-gallery",
);
if (!gallery) {
  addError("Community Gallery capability is missing.");
} else if (
  !sameOrder(
    gallery.tabs?.map((tab) => tab.label) ?? [],
    expectedGalleryTabs,
  )
) {
  addError("Community Gallery tabs do not match the approved seven-tab order.");
}

if (
  !sameOrder(
    manifest.defaultCapabilityTabs?.map((tab) => tab.label) ?? [],
    expectedDefaultTabs,
  )
) {
  addError("Default capability tabs must be Overview, Architecture, Supabase Tables.");
}

checkUniqueIds("knowledge sections", collectManifestSections());
checkUniqueIds("Chronicle Overview tabs", manifest.applicationMap.tabs ?? []);
checkUniqueIds("default capability tabs", manifest.defaultCapabilityTabs ?? []);

for (const tab of manifest.applicationMap.tabs ?? []) {
  checkTabMetadata(manifest.applicationMap.id, tab);
}

for (const section of manifest.capabilities ?? []) {
  const tabs = section.tabs ?? manifest.defaultCapabilityTabs ?? [];
  checkUniqueIds(`${section.id} tabs`, tabs);
  for (const tab of tabs) checkTabMetadata(section.id, tab);
}

const documents = new Map();
for (const section of collectManifestSections()) {
  if (!section.document) continue;
  if (!documents.has(section.document)) {
    documents.set(
      section.document,
      readKnowledgeDocument(section.document, section.id),
    );
  }
}

for (const documentName of Object.values(manifest.sharedDocuments ?? {})) {
  if (!documents.has(documentName)) {
    documents.set(
      documentName,
      readKnowledgeDocument(documentName, "sharedDocuments"),
    );
  }
}

for (const section of collectManifestSections()) {
  const tabs = section.tabs ?? manifest.defaultCapabilityTabs ?? [];
  const source = section.document ? documents.get(section.document) ?? "" : "";
  const headings = new Set(parseTopLevelHeadings(source));

  for (const tab of tabs) {
    if (tab.contentKind === "markdown-section" && !headings.has(tab.heading)) {
      addError(
        `${section.id}/${tab.id}: document ${section.document} is missing top-level heading "${tab.heading}"`,
      );
    }
  }
}

const overviewSource = documents.get("chronicle-overview.md") ?? "";
const gallerySource = documents.get("community-gallery.md") ?? "";
const supabaseSource = documents.get("supabase-tables.md") ?? "";
const roughDraftSource =
  documents.get("chronicle-application-manual-writer-rough-draft.md") ?? "";

if (overviewSource.length < 50_000) {
  addError("Chronicle Overview migration is unexpectedly short.");
}
if (!overviewSource.includes("Adult and NSFW Material Is First-Class Story Data")) {
  addError("Chronicle Overview is missing its adult-content product contract.");
}
if (!overviewSource.includes("knowledge-asset:admin-panel-overview")) {
  addError("Chronicle Overview is missing the migrated Admin Panel image.");
}
if (gallerySource.length < 35_000) {
  addError("Community Gallery migration is unexpectedly short.");
}
if (!gallerySource.includes("knowledge-asset:community-gallery-overview")) {
  addError("Community Gallery is missing its migrated overview image.");
}
if (!gallerySource.includes("UI Elements and Functions")) {
  addError("Community Gallery is missing its UI Elements and Functions source.");
}
const galleryArchitectureSource = getTopLevelSection(
  gallerySource,
  "App Architecture",
);
if (
  galleryArchitectureSource.length < 35_000 ||
  !galleryArchitectureSource.includes("Delivery Boundary and Runtime Entry") ||
  !galleryArchitectureSource.includes("State, Authority, and Persistence Map") ||
  !galleryArchitectureSource.includes("Current Test and Evidence Map") ||
  !galleryArchitectureSource.includes(
    "d9a3fa6adfd84ab896289e03d82283f676a1695e",
  )
) {
  addError(
    "Community Gallery App Architecture is missing its substantive source-backed runtime account or review metadata.",
  );
}
for (const operationalHeading of ["Current Work", "Supabase Tables", "Changelog"]) {
  if (parseTopLevelHeadings(gallerySource).includes(operationalHeading)) {
    addError(
      `Community Gallery stable manual still contains the operational placeholder heading "${operationalHeading}".`,
    );
  }
}
if (
  !supabaseSource.includes(
    "](/style-guide/supabase-schema-reference)",
  ) ||
  !supabaseSource.includes(
    "Anything that cannot be verified through the reference or by Lovable must be identified as unverified rather than guessed.",
  )
) {
  addError("Shared Supabase directions or their application link are incomplete.");
}
if (!roughDraftSource.includes("Chronicle Application Manual Writer")) {
  addError("The visible rough-draft reference is missing.");
}

const activeKnowledgeText = [
  overviewSource,
  gallerySource,
  supabaseSource,
  roughDraftSource,
].join("\n");
if (
  activeKnowledgeText.includes("Workflow Failure Analysis and Knowledge Manual Requirements") ||
  activeKnowledgeText.includes("Preview accordion")
) {
  addError("The removed Preview audit has returned to active knowledge content.");
}

for (const [relativePath, expectedHash] of expectedAssets) {
  const filePath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(filePath)) {
    addError(`Missing migrated asset ${relativePath}`);
    continue;
  }
  const actualHash = sha256File(filePath);
  if (actualHash !== expectedHash) {
    addError(`${relativePath}: checked-in asset hash does not match the registered repository digest`);
  }
}

const appSource = fs.readFileSync(path.join(repoRoot, "src", "App.tsx"), "utf8");
const adminSource = fs.readFileSync(
  path.join(repoRoot, "src", "pages", "Admin.tsx"),
  "utf8",
);
const pageSource = fs.readFileSync(
  path.join(
    repoRoot,
    "src",
    "pages",
    "style-guide",
    "chronicle-knowledge-base.tsx",
  ),
  "utf8",
);
const manifestLoaderSource = fs.readFileSync(
  path.join(
    repoRoot,
    "src",
    "data",
    "chronicle-knowledge-base",
    "manifest.ts",
  ),
  "utf8",
);

const registeredRoutes = new Set(
  Array.from(
    appSource.matchAll(/<Route\s+path=["']([^"']+)["']/g),
    (match) => match[1],
  ),
);

for (const route of [
  "/style-guide/chronicle-knowledge-base",
  "/style-guide/supabase-schema-reference",
]) {
  if (!registeredRoutes.has(route)) addError(`Missing registered route ${route}`);
}

for (const route of [
  "/style-guide/app-architecture",
  "/style-guide/api-inspector",
]) {
  if (registeredRoutes.has(route)) addError(`Retired route is still registered: ${route}`);
}

if (
  !appSource.includes(
    '<Route path="/style-guide/chronicle-knowledge-base" element={<AdminOnlyRoute><ChronicleKnowledgeBasePage /></AdminOnlyRoute>} />',
  )
) {
  addError("Chronicle Knowledge Base route is not protected by AdminOnlyRoute.");
}

if (
  !adminSource.includes("id: 'chronicle_knowledge_base'") ||
  !adminSource.includes("navigate('/style-guide/chronicle-knowledge-base')")
) {
  addError("Admin tile or Chronicle Knowledge Base navigation is missing.");
}

for (const toolId of ["app_architecture", "roleplay_pipeline"]) {
  const toolIdPattern = new RegExp(`id:\\s*["']${toolId}["']`);
  if (toolIdPattern.test(adminSource)) {
    addError(`Retired Admin tool ID is still present: ${toolId}`);
  }
}

if (
  pageSource.includes("dangerouslySetInnerHTML") ||
  pageSource.includes("<iframe")
) {
  addError("Chronicle Knowledge Base must be a React renderer, not raw HTML injection.");
}

if (
  !manifestLoaderSource.includes(
    "galleryOperationalRecordRegistry.openIssueCount",
  )
) {
  addError("Issue counter must derive from the operational-record registry.");
}

if (!pageSource.includes("OperationalRecordContent")) {
  addError("Operational tabs must render from their separate record sources.");
}

for (const [documentName, source] of documents) {
  checkMarkdownRouteLinks(documentName, source, registeredRoutes);
}

if (errors.length > 0) {
  console.error("Chronicle Knowledge Base validation failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(
  `Chronicle Knowledge Base validation passed: ${expectedCapabilityIds.length} capabilities, ${expectedGalleryTabs.length} Gallery tabs, ${expectedAssets.size} checked-in assets${notes.length > 0 ? ` (${notes.join("; ")})` : ""}.`,
);
