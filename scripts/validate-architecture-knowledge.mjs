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
  "Chronicle",
  "Community Gallery",
  "My Stories",
  "Character Library",
  "Image Library",
  "Story Builder",
  "Character Builder",
  "Chat Interface",
  "Roleplay Pipeline",
  "Chat History",
  "Public Profile",
  "Account & Subscription",
  "Admin Panel",
  "Shared Application Systems",
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
  "roleplay-pipeline",
  "chat-history",
  "public-profile",
  "account",
  "admin",
  "shared-systems",
];

const expectedWorkManualTabs = [
  ["overview", "Overview", ["Overview"]],
  ["start-here", "Start Here", ["1. Start Here"]],
  [
    "work-types",
    "Work Types",
    [
      "2. Routine Local Work",
      "3. Connected Feature Work",
      "4. Multi-System Program Work",
    ],
  ],
  [
    "tests-tools-audits",
    "Tests, Tools, and Audits",
    [
      "11. Checks, Delivery, and Reporting",
      "10. Subagents, Research, and Independent Review",
    ],
  ],
  [
    "safeguards-systems",
    "Safeguards and Systems",
    [
      "5. Expansion and Approval Rules",
      "6. Risk Safeguards",
      "9. Chronicle-Specific Systems",
    ],
  ],
  [
    "evidence-records-stopping",
    "Evidence, Records, and Stopping",
    ["7. Evidence and Human Review", "8. Records and Continuity"],
  ],
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
      "How people organize owned, draft, published, and saved stories before editing, removing, or starting a new playthrough.",
  },
  {
    id: "character-library",
    label: "Character Library",
    description:
      "How reusable global characters are created, edited, selected, copied into stories, and kept separate from story-owned characters.",
  },
  {
    id: "my-images",
    label: "Image Library",
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
      "How reusable and story-owned character profiles are authored, assisted, copied, and saved without losing lifecycle ownership.",
  },
  {
    id: "chat-interface",
    label: "Chat Interface",
    description:
      "How the visible play screen presents a conversation, accepts user actions, exposes local controls, and hands an opaque turn request to the separate Roleplay Pipeline.",
  },
  {
    id: "roleplay-pipeline",
    label: "Roleplay Pipeline",
    description:
      "How a Chat Interface action becomes a model request, a current accepted response, and saved state for later turns.",
  },
  {
    id: "chat-history",
    label: "Chat History",
    description:
      "How saved conversations are listed, resumed, paginated, identified, and deleted without becoming the active play interface.",
  },
  {
    id: "public-profile",
    label: "Public Profile",
    description:
      "How creators edit their public identity and how other people view, follow, evaluate, and enter their published work.",
  },
  {
    id: "account",
    label: "Account & Subscription",
    description:
      "How a signed-in user views private account facts, changes credentials, and understands the current subscription and available plans.",
  },
  {
    id: "admin",
    label: "Admin Panel",
    description:
      "How privileged operators enter the Admin hub and reach each registered specialist tool while preserving the boundary between the hub and the tools it launches.",
  },
  {
    id: "shared-systems",
    label: "Shared Application Systems",
    description:
      "How Chronicle's shell, navigation, authentication, common persistence adapters, private media, shared configuration, and cross-capability state support the application without absorbing feature ownership.",
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

const expectedSevenTabContract = [
  {
    id: "overview",
    label: "Overview",
    contentKind: "markdown-section",
    heading: "Overview",
  },
  {
    id: "ui-elements-functions",
    label: "UI Elements and Functions",
    contentKind: "markdown-section",
    heading: "UI Elements and Functions",
  },
  {
    id: "app-architecture",
    label: "App Architecture",
    contentKind: "markdown-section",
    heading: "App Architecture",
  },
  {
    id: "issues",
    label: "Issues",
    contentKind: "issue-records",
    heading: null,
  },
  {
    id: "current-work",
    label: "Current Work",
    contentKind: "current-work-records",
    heading: null,
  },
  {
    id: "supabase-tables",
    label: "Supabase Tables",
    contentKind: "shared-supabase",
    heading: null,
  },
  {
    id: "changelog",
    label: "Changelog",
    contentKind: "changelog-records",
    heading: null,
  },
];
const expectedMyStoriesTabs = expectedSevenTabContract;
const expectedCharacterLibraryTabs = expectedSevenTabContract;
const expectedMyImagesTabs = expectedSevenTabContract;
const expectedStoryBuilderTabs = expectedSevenTabContract;
const expectedCharacterBuilderTabs = expectedSevenTabContract;

const allowedContentKinds = new Set([
  "blank",
  "issue-records",
  "current-work-records",
  "changelog-records",
  "shared-records",
  "markdown-section",
  "work-manual-chapter",
  "shared-supabase",
]);
const operationalContentKinds = new Set([
  "issue-records",
  "current-work-records",
  "changelog-records",
  "shared-records",
]);
const operationalCapabilityIds = expectedCapabilityIds;

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

function parseLevelTwoHeadings(source) {
  return Array.from(
    source.matchAll(/^## ([^\r\n]+)\r?$/gm),
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
  return [manifest.applicationMap, manifest.workManual, ...manifest.capabilities, ...(manifest.adminTools ?? [])];
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
    tab.contentKind === "work-manual-chapter" &&
    !tab.heading &&
    !tab.headings?.length
  ) {
    addError(`${owner}/${tab.id}: work-manual-chapter needs headings`);
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


if (
  manifest.workManual?.id !== "chronicle-work-manual" ||
  manifest.workManual?.label !== "Chronicle Work Manual" ||
  manifest.workManual?.document !== "chronicle-work-manual.md"
) {
  addError("Work Manual must be registered as the canonical top-level Knowledge document.");
} else {
  const actualTabs = (manifest.workManual.tabs ?? []).map((tab) => [
    tab.id,
    tab.label,
    tab.headings,
  ]);
  if (JSON.stringify(actualTabs) !== JSON.stringify(expectedWorkManualTabs)) {
    addError("Work Manual chapters do not match the registered source order.");
  }
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
    continue;
  }

  const actualTabContract = (actual.tabs ?? []).map((tab) => ({
    id: tab.id,
    label: tab.label,
    contentKind: tab.contentKind,
    heading: tab.heading ?? null,
  }));
  if (
    JSON.stringify(actualTabContract) !==
    JSON.stringify(expected.id === "roleplay-pipeline"
      ? expectedSevenTabContract.filter((tab) => tab.id !== "ui-elements-functions").map((tab) => tab.id === "supabase-tables" ? { ...tab, contentKind: "markdown-section", heading: "Supabase Tables" } : tab)
      : expectedSevenTabContract)
  ) {
    addError(
      `${expected.id}: capability tabs must match its approved tab contract.`,
    );
  }
  if (!actual.document) {
    addError(`${expected.id}: capability must load a direct stable manual.`);
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

const myStories = manifest.capabilities?.find(
  (section) => section.id === "my-stories",
);
if (!myStories) {
  addError("My Stories capability is missing.");
} else {
  const actualTabContract = (myStories.tabs ?? []).map((tab) => ({
    id: tab.id,
    label: tab.label,
    contentKind: tab.contentKind,
    heading: tab.heading ?? null,
  }));
  if (JSON.stringify(actualTabContract) !== JSON.stringify(expectedMyStoriesTabs)) {
    addError(
      "My Stories tabs must match the approved seven-tab capability contract.",
    );
  }
  if (myStories.document !== "my-stories.md") {
    addError("My Stories must load its stable manual from my-stories.md.");
  }

  const supabaseTab = (myStories.tabs ?? []).find(
    (tab) => tab.id === "supabase-tables",
  );
  if (
    supabaseTab?.reviewed !== "08/21/2026" ||
    supabaseTab?.updated !== "07/31/2026"
  ) {
    addError(
      "My Stories Supabase Tables metadata must distinguish the 08/21/2026 review from the shared source's 07/31/2026 update.",
    );
  }
}

const characterLibrary = manifest.capabilities?.find(
  (section) => section.id === "character-library",
);
if (!characterLibrary) {
  addError("Character Library capability is missing.");
} else {
  const actualTabContract = (characterLibrary.tabs ?? []).map((tab) => ({
    id: tab.id,
    label: tab.label,
    contentKind: tab.contentKind,
    heading: tab.heading ?? null,
  }));
  if (
    JSON.stringify(actualTabContract) !==
    JSON.stringify(expectedCharacterLibraryTabs)
  ) {
    addError(
      "Character Library tabs must match the approved seven-tab capability contract.",
    );
  }
  if (characterLibrary.document !== "character-library.md") {
    addError(
      "Character Library must load its stable manual from character-library.md.",
    );
  }

  const supabaseTab = (characterLibrary.tabs ?? []).find(
    (tab) => tab.id === "supabase-tables",
  );
  if (
    supabaseTab?.reviewed !== "08/22/2026" ||
    supabaseTab?.updated !== "07/31/2026"
  ) {
    addError(
      "Character Library Supabase Tables metadata must distinguish the 08/22/2026 review from the shared source's 07/31/2026 update.",
    );
  }
}

const myImages = manifest.capabilities?.find(
  (section) => section.id === "my-images",
);
if (!myImages) {
  addError("My Images capability is missing.");
} else {
  const actualTabContract = (myImages.tabs ?? []).map((tab) => ({
    id: tab.id,
    label: tab.label,
    contentKind: tab.contentKind,
    heading: tab.heading ?? null,
  }));
  if (
    JSON.stringify(actualTabContract) !==
    JSON.stringify(expectedMyImagesTabs)
  ) {
    addError(
      "My Images tabs must match the approved seven-tab capability contract.",
    );
  }
  if (myImages.document !== "my-images.md") {
    addError("My Images must load its stable manual from my-images.md.");
  }

  const supabaseTab = (myImages.tabs ?? []).find(
    (tab) => tab.id === "supabase-tables",
  );
  if (
    supabaseTab?.reviewed !== "08/22/2026" ||
    supabaseTab?.updated !== "07/31/2026"
  ) {
    addError(
      "My Images Supabase Tables metadata must distinguish the 08/22/2026 review from the shared source's 07/31/2026 update.",
    );
  }
}

const storyBuilder = manifest.capabilities?.find(
  (section) => section.id === "story-builder",
);
if (!storyBuilder) {
  addError("Story Builder capability is missing.");
} else {
  const actualTabContract = (storyBuilder.tabs ?? []).map((tab) => ({
    id: tab.id,
    label: tab.label,
    contentKind: tab.contentKind,
    heading: tab.heading ?? null,
  }));
  if (
    JSON.stringify(actualTabContract) !==
    JSON.stringify(expectedStoryBuilderTabs)
  ) {
    addError(
      "Story Builder tabs must match the approved seven-tab capability contract.",
    );
  }
  if (storyBuilder.document !== "story-builder.md") {
    addError("Story Builder must load its stable manual from story-builder.md.");
  }

  const supabaseTab = (storyBuilder.tabs ?? []).find(
    (tab) => tab.id === "supabase-tables",
  );
  if (
    supabaseTab?.reviewed !== "08/22/2026" ||
    supabaseTab?.updated !== "07/31/2026"
  ) {
    addError(
      "Story Builder Supabase Tables metadata must distinguish the 08/22/2026 review from the shared source's 07/31/2026 update.",
    );
  }
}

const characterBuilder = manifest.capabilities?.find(
  (section) => section.id === "character-builder",
);
if (!characterBuilder) {
  addError("Character Builder capability is missing.");
} else {
  const actualTabContract = (characterBuilder.tabs ?? []).map((tab) => ({
    id: tab.id,
    label: tab.label,
    contentKind: tab.contentKind,
    heading: tab.heading ?? null,
  }));
  if (
    JSON.stringify(actualTabContract) !==
    JSON.stringify(expectedCharacterBuilderTabs)
  ) {
    addError(
      "Character Builder tabs must match the approved seven-tab capability contract.",
    );
  }
  if (characterBuilder.document !== "character-builder.md") {
    addError("Character Builder must load its stable manual from character-builder.md.");
  }

  const supabaseTab = (characterBuilder.tabs ?? []).find(
    (tab) => tab.id === "supabase-tables",
  );
  if (
    supabaseTab?.reviewed !== "08/22/2026" ||
    supabaseTab?.updated !== "07/31/2026"
  ) {
    addError(
      "Character Builder Supabase Tables metadata must distinguish the 08/22/2026 review from the shared source's 07/31/2026 update.",
    );
  }
}

for (const capabilityId of operationalCapabilityIds) {
  const issueDirectory = path.join(
    knowledgeRoot,
    "issues",
    capabilityId,
  );
  if (!fs.existsSync(issueDirectory)) {
    addError(`${capabilityId}: canonical Issue directory is missing.`);
    continue;
  }
  const actualIssueIds = fs
    .readdirSync(issueDirectory)
    .filter((fileName) => fileName.endsWith(".md"))
    .map((fileName) => fileName.slice(0, -3))
    .sort();
  for (const issueId of actualIssueIds) {
    const sourcePath = path.join(issueDirectory, `${issueId}.md`);
    if (!fs.existsSync(sourcePath)) continue;
    const source = fs.readFileSync(sourcePath, "utf8");
    for (const requiredText of [
      "record_type: issue",
      `issue_id: ${issueId}`,
      `owner_capability: ${capabilityId}`,
      "## Expected Behavior",
      "### Current Behavior",
      "### Why This Is a Problem",
      "### Supporting Evidence",
      "### What This Evidence Establishes",
      "### What Remains Unverified",
    ]) {
      if (!source.includes(requiredText)) {
        addError(`${issueId}: missing required capability-local Issue content ${JSON.stringify(requiredText)}.`);
      }
    }
    if (!/^status: (?:open|resolved)$/m.test(source)) {
      addError(`${issueId}: capability-local Issue status must be open or resolved.`);
    }
  }
}

checkUniqueIds("knowledge sections", collectManifestSections());
checkUniqueIds("Chronicle Overview tabs", manifest.applicationMap.tabs ?? []);
checkUniqueIds("Chronicle Work Manual chapters", manifest.workManual?.tabs ?? []);

for (const tab of manifest.applicationMap.tabs ?? []) {
  checkTabMetadata(manifest.applicationMap.id, tab);
}

for (const tab of manifest.workManual?.tabs ?? []) {
  checkTabMetadata(manifest.workManual.id, tab);
}

for (const section of [...(manifest.capabilities ?? []), ...(manifest.adminTools ?? [])]) {
  const tabs = section.tabs ?? [];
  checkUniqueIds(`${section.id} tabs`, tabs);
  for (const tab of tabs) checkTabMetadata(section.id, tab);
}

const expectedAdminTools = ["knowledge-base-system", "schema-reference", "quality-hub", "validation-evidence-ledger", "finance-dashboard", "research-development", "image-generation", "app-dashboard"];
if (!sameOrder((manifest.adminTools ?? []).map((section) => section.id), expectedAdminTools)) {
  addError("Administrative tool manual order does not match the registered contract.");
}
for (const section of manifest.adminTools ?? []) {
  if (!['admin', 'knowledge-system'].includes(section.recordScope)) addError(`${section.id}: shared record scope must name an existing owner.`);
  const expectedTabs = ['overview', 'ui-elements-and-functions', 'app-architecture', 'issues', 'current-work', 'supabase-tables', 'changelog'];
  if (!sameOrder(section.tabs.map((tab) => tab.id), expectedTabs)) addError(`${section.id}: administrative manual tabs are incomplete or reordered.`);
  for (const tab of section.tabs) {
    const expectedKind = ['issues', 'current-work', 'changelog'].includes(tab.id) ? 'shared-records' : 'markdown-section';
    if (tab.contentKind !== expectedKind) addError(`${section.id}/${tab.id}: must use ${expectedKind} without creating a new record authority.`);
  }
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
  const tabs = section.tabs ?? [];
  const source = section.document ? documents.get(section.document) ?? "" : "";
  const headings = new Set(parseTopLevelHeadings(source));
  const levelTwoHeadings = new Set(parseLevelTwoHeadings(source));

  for (const tab of tabs) {
    if (tab.contentKind === "markdown-section" && !headings.has(tab.heading)) {
      addError(
        `${section.id}/${tab.id}: document ${section.document} is missing top-level heading "${tab.heading}"`,
      );
    }
    if (
      tab.contentKind === "work-manual-chapter" &&
      !(tab.headings ?? [tab.heading]).every((heading) =>
        levelTwoHeadings.has(heading),
      )
    ) {
      addError(
        `${section.id}/${tab.id}: document ${section.document} is missing one or more registered level-two headings`,
      );
    }
  }
}

const overviewSource = documents.get("chronicle-overview.md") ?? "";
const workManualSource = documents.get("chronicle-work-manual.md") ?? "";
const gallerySource = documents.get("community-gallery.md") ?? "";
const myStoriesSource = documents.get("my-stories.md") ?? "";
const characterLibrarySource = documents.get("character-library.md") ?? "";
const myImagesSource = documents.get("my-images.md") ?? "";
const storyBuilderSource = documents.get("story-builder.md") ?? "";
const characterBuilderSource = documents.get("character-builder.md") ?? "";
const chatInterfaceSource = documents.get("chat-interface.md") ?? "";
const chatHistorySource = documents.get("chat-history.md") ?? "";
const publicProfileSource = documents.get("public-profile.md") ?? "";
const accountSource = documents.get("account.md") ?? "";
const adminPanelSource = documents.get("admin-panel.md") ?? "";
const sharedApplicationSystemsSource =
  documents.get("shared-application-systems.md") ?? "";
const supabaseSource = documents.get("supabase-tables.md") ?? "";

if (overviewSource.length < 50_000) {
  addError("Chronicle Overview migration is unexpectedly short.");
}
if (workManualSource.length < 60_000) {
  addError("Chronicle Work Manual is unexpectedly short.");
}
if (
  !workManualSource.includes("manual_version: 0.2.3-provisional") ||
  !workManualSource.includes("status: active-provisional") ||
  !workManualSource.includes(
    "canonical_path: docs/architecture-knowledge/chronicle-work-manual.md",
  )
) {
  addError("Chronicle Work Manual active metadata is missing or stale.");
}
if (workManualSource.includes("Inactive Phase C draft")) {
  addError("Chronicle Work Manual still presents itself as an inactive draft.");
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

const myStoriesHeadings = parseTopLevelHeadings(myStoriesSource);
if (
  !sameOrder(myStoriesHeadings, [
    "Overview",
    "UI Elements and Functions",
    "App Architecture",
  ])
) {
  addError(
    "My Stories source must contain exactly one raw level-one heading for each registered stable Markdown section.",
  );
}

const myStoriesOverviewSource = getTopLevelSection(myStoriesSource, "Overview");
const myStoriesUiSource = getTopLevelSection(
  myStoriesSource,
  "UI Elements and Functions",
);
const myStoriesArchitectureSource = getTopLevelSection(
  myStoriesSource,
  "App Architecture",
);
if (
  myStoriesOverviewSource.length < 10_000 ||
  !myStoriesOverviewSource.includes("My Stories at a Glance") ||
  !myStoriesOverviewSource.includes("Loading, Empty, Failure, and Recovery Expectations") ||
  !myStoriesOverviewSource.includes("Story Builder owns authored changes")
) {
  addError(
    "My Stories Overview is missing substantive purpose, lifecycle, recovery, or ownership content.",
  );
}
if (
  myStoriesUiSource.length < 10_000 ||
  !myStoriesUiSource.includes("Workspace Entry and Header") ||
  !myStoriesUiSource.includes("Story Grid and Cards") ||
  !myStoriesUiSource.includes("Select from Image Library") ||
  !myStoriesUiSource.includes("The confirming action must describe creating the copy")
) {
  addError(
    "My Stories UI Elements and Functions is missing substantive controls, states, consequences, or recovery expectations.",
  );
}
if (
  myStoriesArchitectureSource.length < 30_000 ||
  !myStoriesArchitectureSource.includes("Delivery Boundary and Runtime Entry") ||
  !myStoriesArchitectureSource.includes("Current Implementation Limitations") ||
  !myStoriesArchitectureSource.includes("does not read `content_themes`") ||
  !myStoriesArchitectureSource.includes("defaultContentThemes") ||
  !myStoriesArchitectureSource.includes("Chat History resume depends on the current source") ||
  !myStoriesArchitectureSource.includes("internally inconsistent") ||
  !myStoriesArchitectureSource.includes(
    "The Chronicle Work Manual governs any later task that needs a live comparison",
  ) ||
  !myStoriesArchitectureSource.includes("src/hooks/use-index-scenario-persistence.ts") ||
  !myStoriesArchitectureSource.includes("Inspected-source count: **34 paths**") ||
  myStoriesArchitectureSource.includes("SOURCE_COMPOSITE_PENDING_FINAL_TEST_EDITS")
) {
  addError(
    "My Stories App Architecture is missing its substantive runtime, limitation, Supabase-boundary, source-map, or review evidence account.",
  );
}

for (const misplacedDefectText of [
  "The current visible behavior is narrower",
  "visible handoff happens before the conversation save is confirmed",
]) {
  if (myStoriesOverviewSource.includes(misplacedDefectText)) {
    addError(
      `My Stories Overview contains delivered-defect narration that belongs in App Architecture: ${misplacedDefectText}`,
    );
  }
}
for (const misplacedDefectText of [
  "until a broader application reload",
  "shared confirmation currently labels its affirmative action",
  "There is no visible close button in this dialog",
  "visually transparent",
  "no toast, inline error, or Retry control",
]) {
  if (myStoriesUiSource.includes(misplacedDefectText)) {
    addError(
      `My Stories UI Elements and Functions contains delivered-defect narration that belongs in App Architecture: ${misplacedDefectText}`,
    );
  }
}

for (const operationalHeading of ["Issues", "Current Work", "Changelog"]) {
  if (myStoriesHeadings.includes(operationalHeading)) {
    addError(
      `My Stories stable manual contains unregistered capability-local operational content under "${operationalHeading}".`,
    );
  }
}

const applicationMapMyStoriesSource = getTopLevelSection(
  overviewSource,
  "My Stories",
);
if (
  applicationMapMyStoriesSource.length < 2_500 ||
  !applicationMapMyStoriesSource.includes("What My Stories receives") ||
  !applicationMapMyStoriesSource.includes("What My Stories produces") ||
  !applicationMapMyStoriesSource.includes("Responsibility transfers after the choice is made")
) {
  addError(
    "Chronicle Overview's My Stories application-map tab is missing substantive purpose, input, output, or ownership-transfer content.",
  );
}

const characterLibraryHeadings = parseTopLevelHeadings(
  characterLibrarySource,
);
if (
  !sameOrder(characterLibraryHeadings, [
    "Overview",
    "UI Elements and Functions",
    "App Architecture",
  ])
) {
  addError(
    "Character Library source must contain exactly one raw level-one heading for each registered stable Markdown section.",
  );
}

const characterLibraryOverviewSource = getTopLevelSection(
  characterLibrarySource,
  "Overview",
);
const characterLibraryUiSource = getTopLevelSection(
  characterLibrarySource,
  "UI Elements and Functions",
);
const characterLibraryArchitectureSource = getTopLevelSection(
  characterLibrarySource,
  "App Architecture",
);
if (
  characterLibraryOverviewSource.length < 10_000 ||
  !characterLibraryOverviewSource.includes("Character Library at a Glance") ||
  !characterLibraryOverviewSource.includes("Ownership, Reuse, and Lifecycle") ||
  !characterLibraryOverviewSource.includes(
    "Loading, Empty, Failure, and Recovery Expectations",
  ) ||
  !characterLibraryOverviewSource.includes("The practical rule is copy independence")
) {
  addError(
    "Character Library Overview is missing substantive purpose, lifecycle, recovery, or ownership content.",
  );
}
if (
  characterLibraryUiSource.length < 15_000 ||
  !characterLibraryUiSource.includes("Workspace Entry and Page Header") ||
  !characterLibraryUiSource.includes("Collection Grid and Character Cards") ||
  !characterLibraryUiSource.includes("Character Editor Frame and Section Navigation") ||
  !characterLibraryUiSource.includes("Use all details currently in character card") ||
  !characterLibraryUiSource.includes("Generate Avatar") ||
  !characterLibraryUiSource.includes("Add Text Field")
) {
  addError(
    "Character Library UI Elements and Functions is missing substantive controls, states, consequences, or recovery expectations.",
  );
}
if (
  characterLibraryArchitectureSource.length < 30_000 ||
  !characterLibraryArchitectureSource.includes("Ordered Runtime and Data Flows") ||
  !characterLibraryArchitectureSource.includes(
    "State Authority and Conflict Precedence",
  ) ||
  !characterLibraryArchitectureSource.includes("Diagnostics Versus Enforcement") ||
  !characterLibraryArchitectureSource.includes("Current Implementation Limitations") ||
  !characterLibraryArchitectureSource.includes(
    "deep-clones the profile without assigning a new UUID",
  ) ||
  !characterLibraryArchitectureSource.includes("handleDeleteAvatar()") ||
  !characterLibraryArchitectureSource.includes("get_public_art_styles") ||
  !characterLibraryArchitectureSource.includes("Unauthorized: characters row") ||
  !characterLibraryArchitectureSource.includes(
    "The architecture review inspected these 59 existing paths",
  )
) {
  addError(
    "Character Library App Architecture is missing its substantive runtime, limitation, security, source-map, or review evidence account.",
  );
}

for (const misplacedDefectText of [
  "deep-clones the profile without assigning a new UUID",
  "console-only",
]) {
  if (characterLibraryOverviewSource.includes(misplacedDefectText)) {
    addError(
      `Character Library Overview contains delivered-defect narration that belongs in App Architecture: ${misplacedDefectText}`,
    );
  }
}
for (const misplacedDefectText of [
  "The editor's **Back** callback clears only `selectedCharacterId`",
  "has `tabIndex={-1}`",
]) {
  if (characterLibraryUiSource.includes(misplacedDefectText)) {
    addError(
      `Character Library UI Elements and Functions contains delivered-defect narration that belongs in App Architecture: ${misplacedDefectText}`,
    );
  }
}

for (const operationalHeading of ["Issues", "Current Work", "Changelog"]) {
  if (characterLibraryHeadings.includes(operationalHeading)) {
    addError(
      `Character Library stable manual contains unregistered capability-local operational content under "${operationalHeading}".`,
    );
  }
}

const sourcePathMarker =
  "The architecture review inspected these 59 existing paths in this exact order:\n\n```text\n";
const sourcePathStart = characterLibraryArchitectureSource.indexOf(
  sourcePathMarker,
);
if (sourcePathStart < 0) {
  addError("Character Library App Architecture is missing its exact source-path block.");
} else {
  const sourcePathTail = characterLibraryArchitectureSource.slice(
    sourcePathStart + sourcePathMarker.length,
  );
  const sourcePathEnd = sourcePathTail.indexOf("\n```");
  if (sourcePathEnd < 0) {
    addError("Character Library source-path block is not terminated.");
  } else {
    const inspectedPaths = sourcePathTail.slice(0, sourcePathEnd).split("\n");
    if (inspectedPaths.length !== 59) {
      addError(
        `Character Library inspected-source list must contain 59 paths, found ${inspectedPaths.length}.`,
      );
    } else {
      const sourceListing = [];
      for (const relativePath of inspectedPaths) {
        if (!/^(src|supabase)\//.test(relativePath)) {
          addError(
            `Character Library inspected source uses an unsupported path: ${relativePath}`,
          );
          continue;
        }
        const absolutePath = path.join(repoRoot, relativePath);
        if (!fs.existsSync(absolutePath)) {
          addError(`Character Library inspected source is missing: ${relativePath}`);
          continue;
        }
        sourceListing.push(`${sha256File(absolutePath)}  ${relativePath}\n`);
      }
      if (sourceListing.length === inspectedPaths.length) {
        const sourceComposite = crypto
          .createHash("sha256")
          .update(sourceListing.join(""))
          .digest("hex");
        if (!characterLibraryArchitectureSource.includes(sourceComposite)) {
          addError(
            "Character Library inspected-source composite does not match the current listed files.",
          );
        }
      }
    }
  }
}

const applicationMapCharacterLibraryTab = manifest.applicationMap.tabs?.find(
  (tab) => tab.id === "character-library",
);
if (
  applicationMapCharacterLibraryTab?.contentKind !== "markdown-section" ||
  applicationMapCharacterLibraryTab?.heading !== "Character Library" ||
  applicationMapCharacterLibraryTab?.reviewed !== "08/22/2026" ||
  applicationMapCharacterLibraryTab?.updated !== "08/22/2026"
) {
  addError(
    "Chronicle Overview's Character Library tab must register the reviewed Character Library Markdown section.",
  );
}
const applicationMapCharacterLibrarySource = getTopLevelSection(
  overviewSource,
  "Character Library",
);
if (
  applicationMapCharacterLibrarySource.length < 1_500 ||
  !applicationMapCharacterLibrarySource.includes(
    "Character Library is the account's reusable character source",
  ) ||
  !applicationMapCharacterLibrarySource.includes("What Character Library receives") ||
  !applicationMapCharacterLibrarySource.includes("What Character Library produces") ||
  !applicationMapCharacterLibrarySource.includes(
    "Ownership transfers at the copy boundary",
  )
) {
  addError(
    "Chronicle Overview's Character Library application-map tab is missing substantive purpose, input, output, or ownership-transfer content.",
  );
}

const myImagesHeadings = parseTopLevelHeadings(myImagesSource);
if (
  !sameOrder(myImagesHeadings, [
    "Overview",
    "UI Elements and Functions",
    "App Architecture",
  ])
) {
  addError(
    "My Images source must contain exactly one raw level-one heading for each registered stable Markdown section.",
  );
}

const myImagesOverviewSource = getTopLevelSection(myImagesSource, "Overview");
const myImagesUiSource = getTopLevelSection(
  myImagesSource,
  "UI Elements and Functions",
);
const myImagesArchitectureSource = getTopLevelSection(
  myImagesSource,
  "App Architecture",
);
if (
  myImagesOverviewSource.length < 10_000 ||
  !myImagesOverviewSource.includes("My Images at a Glance") ||
  !myImagesOverviewSource.includes("Ownership and Media Lifecycle") ||
  !myImagesOverviewSource.includes(
    "Loading, Empty, Failure, and Recovery Expectations",
  ) ||
  !myImagesOverviewSource.includes(
    "A handoff creates an independent destination copy",
  )
) {
  addError(
    "My Images Overview is missing substantive purpose, lifecycle, recovery, or copy-ownership content.",
  );
}
if (
  myImagesUiSource.length < 14_000 ||
  !myImagesUiSource.includes("Workspace Entry and Shared Header") ||
  !myImagesUiSource.includes("Folder Library") ||
  !myImagesUiSource.includes("Image Details Editor") ||
  !myImagesUiSource.includes("Image Library Background") ||
  !myImagesUiSource.includes("Select from Image Library Consumer Picker") ||
  !myImagesUiSource.includes("Migration pending — re-upload required") ||
  !myImagesUiSource.includes("Could not use that image. Please try again.")
) {
  addError(
    "My Images UI Elements and Functions is missing substantive controls, states, consequences, or recovery expectations.",
  );
}
if (
  myImagesArchitectureSource.length < 30_000 ||
  !myImagesArchitectureSource.includes("Ordered Runtime and Data Flows") ||
  !myImagesArchitectureSource.includes(
    "State Authority and Conflict Precedence",
  ) ||
  !myImagesArchitectureSource.includes("Diagnostics Versus Enforcement") ||
  !myImagesArchitectureSource.includes("Current Implementation Limitations") ||
  !myImagesArchitectureSource.includes("get_folders_with_details") ||
  !myImagesArchitectureSource.includes(
    "PublicProfileTab.uploadAvatarFromUrl()",
  ) ||
  !myImagesArchitectureSource.includes(
    "The architecture review inspected these **47 existing paths**",
  )
) {
  addError(
    "My Images App Architecture is missing its substantive runtime, limitation, security, handoff, source-map, or review evidence account.",
  );
}

for (const misplacedDefectText of [
  "hasLoadedRef",
  "fixed black ten-percent overlay",
  "console-only",
]) {
  if (myImagesOverviewSource.includes(misplacedDefectText)) {
    addError(
      `My Images Overview contains delivered-defect narration that belongs in App Architecture: ${misplacedDefectText}`,
    );
  }
}
for (const misplacedDefectText of [
  "hasLoadedRef",
  "fixed black ten-percent overlay",
  "PublicProfileTab.uploadAvatarFromUrl()",
]) {
  if (myImagesUiSource.includes(misplacedDefectText)) {
    addError(
      `My Images UI Elements and Functions contains delivered-defect narration that belongs in App Architecture: ${misplacedDefectText}`,
    );
  }
}

for (const operationalHeading of ["Issues", "Current Work", "Changelog"]) {
  if (myImagesHeadings.includes(operationalHeading)) {
    addError(
      `My Images stable manual contains unregistered capability-local operational content under "${operationalHeading}".`,
    );
  }
}

const myImagesSourcePathMarker =
  "The architecture review inspected these **47 existing paths** in this exact order:\n\n```text\n";
const myImagesSourcePathStart = myImagesArchitectureSource.indexOf(
  myImagesSourcePathMarker,
);
if (myImagesSourcePathStart < 0) {
  addError("My Images App Architecture is missing its exact source-path block.");
} else {
  const sourcePathTail = myImagesArchitectureSource.slice(
    myImagesSourcePathStart + myImagesSourcePathMarker.length,
  );
  const sourcePathEnd = sourcePathTail.indexOf("\n```");
  if (sourcePathEnd < 0) {
    addError("My Images source-path block is not terminated.");
  } else {
    const inspectedPaths = sourcePathTail.slice(0, sourcePathEnd).split("\n");
    if (inspectedPaths.length !== 47) {
      addError(
        `My Images inspected-source list must contain 47 paths, found ${inspectedPaths.length}.`,
      );
    } else {
      const sourceListing = [];
      for (const relativePath of inspectedPaths) {
        if (!/^(src|supabase)\//.test(relativePath)) {
          addError(
            `My Images inspected source uses an unsupported path: ${relativePath}`,
          );
          continue;
        }
        const absolutePath = path.join(repoRoot, relativePath);
        if (!fs.existsSync(absolutePath)) {
          addError(`My Images inspected source is missing: ${relativePath}`);
          continue;
        }
        sourceListing.push(`${sha256File(absolutePath)}  ${relativePath}\n`);
      }
      if (sourceListing.length === inspectedPaths.length) {
        const sourceComposite = crypto
          .createHash("sha256")
          .update(sourceListing.join(""))
          .digest("hex");
        if (!myImagesArchitectureSource.includes(sourceComposite)) {
          addError(
            "My Images inspected-source composite does not match the current listed files.",
          );
        }
      }
    }
  }
}

const applicationMapMyImagesTab = manifest.applicationMap.tabs?.find(
  (tab) => tab.id === "my-images",
);
if (
  applicationMapMyImagesTab?.contentKind !== "markdown-section" ||
  applicationMapMyImagesTab?.heading !== "Image Library" ||
  applicationMapMyImagesTab?.reviewed !== "08/22/2026" ||
  applicationMapMyImagesTab?.updated !== "08/22/2026"
) {
  addError(
    "Chronicle Overview's Image Library tab must register the reviewed Image Library Markdown section.",
  );
}
const applicationMapMyImagesSource = getTopLevelSection(
  overviewSource,
  "Image Library",
);
if (
  applicationMapMyImagesSource.length < 2_500 ||
  !applicationMapMyImagesSource.includes(
    "Image Library is the account's private reusable media source",
  ) ||
  !applicationMapMyImagesSource.includes("What Image Library receives") ||
  !applicationMapMyImagesSource.includes("What Image Library produces") ||
  !applicationMapMyImagesSource.includes(
    "Ownership transfers at the destination-copy boundary",
  )
) {
  addError(
    "Chronicle Overview's My Images application-map tab is missing substantive purpose, input, output, or ownership-transfer content.",
  );
}

const storyBuilderHeadings = parseTopLevelHeadings(storyBuilderSource);
if (
  !sameOrder(storyBuilderHeadings, [
    "Overview",
    "UI Elements and Functions",
    "App Architecture",
  ])
) {
  addError(
    "Story Builder source must contain exactly one raw level-one heading for each registered stable Markdown section.",
  );
}

const storyBuilderOverviewSource = getTopLevelSection(
  storyBuilderSource,
  "Overview",
);
const storyBuilderUiSource = getTopLevelSection(
  storyBuilderSource,
  "UI Elements and Functions",
);
const storyBuilderArchitectureSource = getTopLevelSection(
  storyBuilderSource,
  "App Architecture",
);
if (
  storyBuilderOverviewSource.length < 15_000 ||
  !storyBuilderOverviewSource.includes("Story Builder at a Glance") ||
  !storyBuilderOverviewSource.includes("Ownership and Story Lifecycle") ||
  !storyBuilderOverviewSource.includes("Complete Authoring Workflows") ||
  !storyBuilderOverviewSource.includes(
    "Loading, Empty, Failure, and Recovery Expectations",
  ) ||
  !storyBuilderOverviewSource.includes("Handoffs to the Rest of Chronicle")
) {
  addError(
    "Story Builder Overview is missing substantive purpose, lifecycle, workflow, recovery, or handoff content.",
  );
}
if (
  storyBuilderUiSource.length < 14_000 ||
  !storyBuilderUiSource.includes("Workspace Frame and Header Actions") ||
  !storyBuilderUiSource.includes("Character Roster and Character Creation") ||
  !storyBuilderUiSource.includes("World Core and Custom World Content") ||
  !storyBuilderUiSource.includes("Opening Dialog and Starting Clock") ||
  !storyBuilderUiSource.includes("Scene Gallery") ||
  !storyBuilderUiSource.includes("Content Themes") ||
  !storyBuilderUiSource.includes("Share Your Story and Publication Controls") ||
  !storyBuilderUiSource.includes("Coercion / Manipulation")
) {
  addError(
    "Story Builder UI Elements and Functions is missing substantive controls, states, consequences, or recovery expectations.",
  );
}
if (
  storyBuilderArchitectureSource.length < 30_000 ||
  !storyBuilderArchitectureSource.includes("Ordered Runtime and Data Flows") ||
  !storyBuilderArchitectureSource.includes(
    "State Authority and Conflict Precedence",
  ) ||
  !storyBuilderArchitectureSource.includes("Responsibility and Ownership Map") ||
  !storyBuilderArchitectureSource.includes("Diagnostics Versus Enforcement") ||
  !storyBuilderArchitectureSource.includes("Current Implementation Limitations") ||
  !storyBuilderArchitectureSource.includes("save_scenario_atomic") ||
  !storyBuilderArchitectureSource.includes("get_public_art_styles") ||
  !storyBuilderArchitectureSource.includes("saveDraftInBackground()") ||
  !storyBuilderArchitectureSource.includes("does not load or persist the source `content_themes`") ||
  !storyBuilderArchitectureSource.includes("does not await conversation persistence") ||
  !storyBuilderArchitectureSource.includes(
    "The architecture review inspected these **92 existing paths**",
  ) ||
  storyBuilderArchitectureSource.includes(
    "SOURCE_COMPOSITE_PENDING_FINAL_TEST_EDITS",
  )
) {
  addError(
    "Story Builder App Architecture is missing its substantive runtime, persistence, limitation, security, handoff, source-map, or review evidence account.",
  );
}

for (const misplacedDefectText of [
  "save_scenario_atomic",
  "console-only",
  "SOURCE_COMPOSITE_PENDING_FINAL_TEST_EDITS",
]) {
  if (storyBuilderOverviewSource.includes(misplacedDefectText)) {
    addError(
      `Story Builder Overview contains delivered implementation narration that belongs in App Architecture: ${misplacedDefectText}`,
    );
  }
  if (storyBuilderUiSource.includes(misplacedDefectText)) {
    addError(
      `Story Builder UI Elements and Functions contains delivered implementation narration that belongs in App Architecture: ${misplacedDefectText}`,
    );
  }
}

for (const operationalHeading of ["Issues", "Current Work", "Changelog"]) {
  if (storyBuilderHeadings.includes(operationalHeading)) {
    addError(
      `Story Builder stable manual contains unregistered capability-local operational content under "${operationalHeading}".`,
    );
  }
}

const storyBuilderSourcePathMarker =
  "The architecture review inspected these **92 existing paths** in this exact order:\n\n```text\n";
const storyBuilderSourcePathStart = storyBuilderArchitectureSource.indexOf(
  storyBuilderSourcePathMarker,
);
if (storyBuilderSourcePathStart < 0) {
  addError("Story Builder App Architecture is missing its exact source-path block.");
} else {
  const sourcePathTail = storyBuilderArchitectureSource.slice(
    storyBuilderSourcePathStart + storyBuilderSourcePathMarker.length,
  );
  const sourcePathEnd = sourcePathTail.indexOf("\n```");
  if (sourcePathEnd < 0) {
    addError("Story Builder source-path block is not terminated.");
  } else {
    const inspectedPaths = sourcePathTail.slice(0, sourcePathEnd).split("\n");
    if (inspectedPaths.length !== 92) {
      addError(
        `Story Builder inspected-source list must contain 92 paths, found ${inspectedPaths.length}.`,
      );
    } else {
      const sourceListing = [];
      for (const relativePath of inspectedPaths) {
        if (!/^(src|supabase)\//.test(relativePath)) {
          addError(
            `Story Builder inspected source uses an unsupported path: ${relativePath}`,
          );
          continue;
        }
        const absolutePath = path.join(repoRoot, relativePath);
        if (!fs.existsSync(absolutePath)) {
          addError(`Story Builder inspected source is missing: ${relativePath}`);
          continue;
        }
        sourceListing.push(`${sha256File(absolutePath)}  ${relativePath}\n`);
      }
      if (sourceListing.length === inspectedPaths.length) {
        const sourceComposite = crypto
          .createHash("sha256")
          .update(sourceListing.join(""))
          .digest("hex");
        if (!storyBuilderArchitectureSource.includes(sourceComposite)) {
          addError(
            "Story Builder inspected-source composite does not match the current listed files.",
          );
        }
      }
    }
  }
}

const applicationMapStoryBuilderTab = manifest.applicationMap.tabs?.find(
  (tab) => tab.id === "story-builder",
);
if (
  applicationMapStoryBuilderTab?.contentKind !== "markdown-section" ||
  applicationMapStoryBuilderTab?.heading !== "Story Builder" ||
  applicationMapStoryBuilderTab?.reviewed !== "08/22/2026" ||
  applicationMapStoryBuilderTab?.updated !== "08/22/2026"
) {
  addError(
    "Chronicle Overview's Story Builder tab must register the reviewed Story Builder Markdown section.",
  );
}
const applicationMapStoryBuilderSource = getTopLevelSection(
  overviewSource,
  "Story Builder",
);
if (
  applicationMapStoryBuilderSource.length < 2_500 ||
  !applicationMapStoryBuilderSource.includes(
    "Story Builder is Chronicle's story-source authoring owner",
  ) ||
  !applicationMapStoryBuilderSource.includes("What Story Builder receives") ||
  !applicationMapStoryBuilderSource.includes("What Story Builder produces") ||
  !applicationMapStoryBuilderSource.includes(
    "Ownership transfers at save, publication, and play",
  )
) {
  addError(
    "Chronicle Overview's Story Builder application-map tab is missing substantive purpose, input, output, or ownership-transfer content.",
  );
}

const characterBuilderHeadings = parseTopLevelHeadings(characterBuilderSource);
if (
  !sameOrder(characterBuilderHeadings, [
    "Overview",
    "UI Elements and Functions",
    "App Architecture",
  ])
) {
  addError(
    "Character Builder source must contain exactly one raw level-one heading for each registered stable Markdown section.",
  );
}

const characterBuilderOverviewSource = getTopLevelSection(
  characterBuilderSource,
  "Overview",
);
const characterBuilderUiSource = getTopLevelSection(
  characterBuilderSource,
  "UI Elements and Functions",
);
const characterBuilderArchitectureSource = getTopLevelSection(
  characterBuilderSource,
  "App Architecture",
);
if (
  characterBuilderOverviewSource.length < 20_000 ||
  !characterBuilderOverviewSource.includes("Character Builder at a Glance") ||
  !characterBuilderOverviewSource.includes(
    "Entry, Preconditions, and Editing Contexts",
  ) ||
  !characterBuilderOverviewSource.includes(
    "Character Identity and Authoring Model",
  ) ||
  !characterBuilderOverviewSource.includes("Complete Character Workflows") ||
  !characterBuilderOverviewSource.includes(
    "Loading, Empty, Failure, and Recovery Expectations",
  ) ||
  !characterBuilderOverviewSource.includes("Handoffs to the Rest of Chronicle")
) {
  addError(
    "Character Builder Overview is missing substantive purpose, ownership, workflow, recovery, or handoff content.",
  );
}
if (
  characterBuilderUiSource.length < 17_000 ||
  !characterBuilderUiSource.includes("Entry Surfaces and Context-Aware Actions") ||
  !characterBuilderUiSource.includes("Collection Grid and Editor Frame") ||
  !characterBuilderUiSource.includes("Basics and Avatar Controls") ||
  !characterBuilderUiSource.includes("Personality, Voice, and Background") ||
  !characterBuilderUiSource.includes("Character Goals") ||
  !characterBuilderUiSource.includes("Custom Content") ||
  !characterBuilderUiSource.includes("AI-Assisted Text Actions") ||
  !characterBuilderUiSource.includes("Global Character Library") ||
  !characterBuilderUiSource.includes("Generate Avatar") ||
  !characterBuilderUiSource.includes("Add New Goal")
) {
  addError(
    "Character Builder UI Elements and Functions is missing substantive controls, states, consequences, or recovery expectations.",
  );
}
if (
  characterBuilderArchitectureSource.length < 40_000 ||
  !characterBuilderArchitectureSource.includes("Ordered Runtime and Data Flows") ||
  !characterBuilderArchitectureSource.includes(
    "State Authority and Conflict Precedence",
  ) ||
  !characterBuilderArchitectureSource.includes(
    "Responsibility and Ownership Map",
  ) ||
  !characterBuilderArchitectureSource.includes("Diagnostics Versus Enforcement") ||
  !characterBuilderArchitectureSource.includes("Current Implementation Limitations") ||
  !characterBuilderArchitectureSource.includes("save_scenario_atomic") ||
  !characterBuilderArchitectureSource.includes("get_public_art_styles") ||
  !characterBuilderArchitectureSource.includes("characterInLibrary") ||
  !characterBuilderArchitectureSource.includes("handleDeleteAvatar()") ||
  !characterBuilderArchitectureSource.includes("Inspected-source count: **74 paths**") ||
  characterBuilderArchitectureSource.includes("PENDING_AFTER_INTEGRATION")
) {
  addError(
    "Character Builder App Architecture is missing its substantive runtime, persistence, limitation, security, handoff, source-map, or review evidence account.",
  );
}

for (const misplacedDefectText of [
  "save_scenario_atomic",
  "console-only",
  "handleDeleteAvatar()",
  "PENDING_AFTER_INTEGRATION",
]) {
  if (characterBuilderOverviewSource.includes(misplacedDefectText)) {
    addError(
      `Character Builder Overview contains delivered implementation narration that belongs in App Architecture: ${misplacedDefectText}`,
    );
  }
  if (characterBuilderUiSource.includes(misplacedDefectText)) {
    addError(
      `Character Builder UI Elements and Functions contains delivered implementation narration that belongs in App Architecture: ${misplacedDefectText}`,
    );
  }
}

for (const operationalHeading of ["Issues", "Current Work", "Changelog"]) {
  if (characterBuilderHeadings.includes(operationalHeading)) {
    addError(
      `Character Builder stable manual contains unregistered capability-local operational content under "${operationalHeading}".`,
    );
  }
}

const characterBuilderSourcePathMarker =
  "The architecture review inspected these source and focused-test paths in this exact order:\n\n```text\n";
const characterBuilderSourcePathStart =
  characterBuilderArchitectureSource.indexOf(characterBuilderSourcePathMarker);
if (characterBuilderSourcePathStart < 0) {
  addError("Character Builder App Architecture is missing its exact source-path block.");
} else {
  const sourcePathTail = characterBuilderArchitectureSource.slice(
    characterBuilderSourcePathStart + characterBuilderSourcePathMarker.length,
  );
  const sourcePathEnd = sourcePathTail.indexOf("\n```");
  if (sourcePathEnd < 0) {
    addError("Character Builder source-path block is not terminated.");
  } else {
    const inspectedPaths = sourcePathTail.slice(0, sourcePathEnd).split("\n");
    if (inspectedPaths.length !== 74) {
      addError(
        `Character Builder inspected-source list must contain 74 paths, found ${inspectedPaths.length}.`,
      );
    } else {
      const sourceListing = [];
      for (const relativePath of inspectedPaths) {
        if (!/^(src|supabase)\//.test(relativePath)) {
          addError(
            `Character Builder inspected source uses an unsupported path: ${relativePath}`,
          );
          continue;
        }
        const absolutePath = path.join(repoRoot, relativePath);
        if (!fs.existsSync(absolutePath)) {
          addError(`Character Builder inspected source is missing: ${relativePath}`);
          continue;
        }
        sourceListing.push(`${sha256File(absolutePath)}  ${relativePath}\n`);
      }
      if (sourceListing.length === inspectedPaths.length) {
        const sourceComposite = crypto
          .createHash("sha256")
          .update(sourceListing.join(""))
          .digest("hex");
        if (!characterBuilderArchitectureSource.includes(sourceComposite)) {
          addError(
            "Character Builder inspected-source composite does not match the current listed files.",
          );
        }
      }
    }
  }
}

const applicationMapCharacterBuilderTab = manifest.applicationMap.tabs?.find(
  (tab) => tab.id === "character-builder",
);
if (
  applicationMapCharacterBuilderTab?.contentKind !== "markdown-section" ||
  applicationMapCharacterBuilderTab?.heading !== "Character Builder" ||
  applicationMapCharacterBuilderTab?.reviewed !== "08/22/2026" ||
  applicationMapCharacterBuilderTab?.updated !== "08/22/2026"
) {
  addError(
    "Chronicle Overview's Character Builder tab must register the reviewed Character Builder Markdown section.",
  );
}
const applicationMapCharacterBuilderSource = getTopLevelSection(
  overviewSource,
  "Character Builder",
);
if (
  applicationMapCharacterBuilderSource.length < 3_000 ||
  !applicationMapCharacterBuilderSource.includes(
    "Character Builder is Chronicle's shared profile-authoring workspace",
  ) ||
  !applicationMapCharacterBuilderSource.includes("What Character Builder receives") ||
  !applicationMapCharacterBuilderSource.includes("What Character Builder produces") ||
  !applicationMapCharacterBuilderSource.includes(
    "Ownership transfers at the caller's save boundary",
  )
) {
  addError(
    "Chronicle Overview's Character Builder application-map tab is missing substantive purpose, input, output, or ownership-transfer content.",
  );
}

const completedCapabilityDocuments = [
  {
    id: "chat-interface",
    documentName: "chat-interface.md",
    source: chatInterfaceSource,
    overviewHeading: "Chat Interface",
    markers: [
      "Chat Interface at a Glance",
      "Active Session Layout",
      "Opaque Roleplay Boundary",
    ],
  },
  {
    id: "chat-history",
    documentName: "chat-history.md",
    source: chatHistorySource,
    overviewHeading: "Chat History",
    markers: [
      "Chat History at a Glance",
      "Saved Session List",
      "Resume and Message Paging",
    ],
  },
  {
    id: "public-profile",
    documentName: "public-profile.md",
    source: publicProfileSource,
    overviewHeading: "Public Profile",
    markers: [
      "Public Profile at a Glance",
      "Visitor-Facing Creator Page",
      "Privacy Boundary",
    ],
  },
  {
    id: "account",
    documentName: "account.md",
    source: accountSource,
    overviewHeading: "Account & Subscription",
    markers: [
      "Account & Subscription at a Glance",
      "Subscription Cards",
      "Subscription Configuration Boundary",
    ],
  },
  {
    id: "admin",
    documentName: "admin-panel.md",
    source: adminPanelSource,
    overviewHeading: "Admin Panel",
    markers: [
      "Admin Panel at a Glance",
      "Current Tool Destinations",
      "Protected Dedicated Routes",
    ],
  },
  {
    id: "shared-systems",
    documentName: "shared-application-systems.md",
    source: sharedApplicationSystemsSource,
    overviewHeading: "Shared Application Systems",
    markers: [
      "Shared Application Systems at a Glance",
      "Shared Loading and Fallback Behavior",
      "Capability Ownership Rule",
    ],
  },
];

for (const contract of completedCapabilityDocuments) {
  const headings = parseTopLevelHeadings(contract.source);
  if (
    !sameOrder(headings, [
      "Overview",
      "UI Elements and Functions",
      "App Architecture",
    ])
  ) {
    addError(
      `${contract.id}: stable manual must contain exactly the three registered Markdown sections.`,
    );
  }
  if (contract.source.length < 8_000) {
    addError(`${contract.id}: stable manual is unexpectedly short.`);
  }
  for (const heading of headings) {
    if (getTopLevelSection(contract.source, heading).length < 800) {
      addError(`${contract.id}/${heading}: stable manual section is unexpectedly short.`);
    }
  }
  for (const marker of contract.markers) {
    if (!contract.source.includes(marker)) {
      addError(`${contract.id}: stable manual is missing ${JSON.stringify(marker)}.`);
    }
  }
  for (const operationalHeading of ["Issues", "Current Work", "Changelog"]) {
    if (headings.includes(operationalHeading)) {
      addError(
        `${contract.id}: stable manual contains operational records under ${operationalHeading}.`,
      );
    }
  }

  const sourceBlock = contract.source.match(
    /### Inspected Source Paths\s+```text\n([\s\S]*?)\n```/,
  );
  if (!sourceBlock) {
    addError(`${contract.id}: App Architecture is missing its source-path block.`);
  } else {
    const paths = sourceBlock[1].split("\n").filter(Boolean);
    if (paths.length < 5) {
      addError(`${contract.id}: source-path block is unexpectedly short.`);
    }
    for (const relativePath of paths) {
      if (!/^(src|supabase)\//.test(relativePath)) {
        addError(`${contract.id}: unsupported inspected path ${relativePath}.`);
        continue;
      }
      if (!fs.existsSync(path.join(repoRoot, relativePath))) {
        addError(`${contract.id}: inspected source is missing: ${relativePath}.`);
      }
    }
  }

  const overviewTab = manifest.applicationMap.tabs?.find(
    (tab) => tab.id === contract.id,
  );
  const overviewSection = getTopLevelSection(
    overviewSource,
    contract.overviewHeading,
  );
  if (
    overviewTab?.contentKind !== "markdown-section" ||
    overviewTab.heading !== contract.overviewHeading ||
    overviewTab.reviewed !== "09/04/2026" ||
    overviewTab.updated !== "09/04/2026" ||
    overviewSection.length < 500
  ) {
    addError(
      `${contract.id}: Chronicle Overview application-map entry is missing or incomplete.`,
    );
  }
}

if (
  !chatInterfaceSource.includes(
    "This manual deliberately does not describe the internal Roleplay Pipeline",
  ) ||
  !chatInterfaceSource.includes(
    "Provider selection, prompt composition, staged support calls, token accounting, internal retry strategy, and post-turn reasoning belong to the separate Roleplay Pipeline section and are excluded here.",
  )
) {
  addError(
    "Chat Interface must preserve the explicit opaque Roleplay Pipeline boundary.",
  );
}

if (
  !supabaseSource.includes(
    "](/style-guide/supabase-schema-reference)",
  ) ||
  !supabaseSource.includes(
    "This page supplies reference and handoff mechanics; it does not decide when a Chronicle task requires",
  ) ||
  !supabaseSource.includes(
    "identify anything that cannot be verified as unverified rather than guessing",
  )
) {
  addError("Shared Supabase directions or their application link are incomplete.");
}
const activeKnowledgeText = [
  overviewSource,
  gallerySource,
  myStoriesSource,
  characterLibrarySource,
  myImagesSource,
  storyBuilderSource,
  characterBuilderSource,
  chatInterfaceSource,
  chatHistorySource,
  publicProfileSource,
  accountSource,
  adminPanelSource,
  sharedApplicationSystemsSource,
  supabaseSource,
].join("\n");
if (
  activeKnowledgeText.includes("Workflow Failure Analysis and Knowledge Manual Requirements") ||
  activeKnowledgeText.includes("Preview accordion")
) {
  addError("The removed Preview audit has returned to active knowledge content.");
}
if (/AI (?:&|and) API Services/i.test(activeKnowledgeText)) {
  addError("The removed AI & API Services placeholder has returned to active Knowledge content.");
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
  "/style-guide/chronicle-knowledge-base/work-manual",
  "/style-guide/chronicle-knowledge-base/work-manual/:chapterId",
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
  !appSource.includes(
    '<Route path="/style-guide/chronicle-knowledge-base/work-manual" element={<AdminOnlyRoute><ChronicleKnowledgeBasePage /></AdminOnlyRoute>} />',
  ) ||
  !appSource.includes(
    '<Route path="/style-guide/chronicle-knowledge-base/work-manual/:chapterId" element={<AdminOnlyRoute><ChronicleKnowledgeBasePage /></AdminOnlyRoute>} />',
  )
) {
  addError("Chronicle Work Manual routes are missing AdminOnlyRoute protection.");
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
  !manifestLoaderSource.includes("getCapabilityOperationalRecordRegistry") ||
  !manifestLoaderSource.includes("operationalRegistry.openIssueCount")
) {
  addError("Every operational capability Issue counter must derive from its isolated operational-record registry.");
}

if (
  !manifestLoaderSource.includes("chronicle-work-manual.md?raw") ||
  !manifestLoaderSource.includes("chronicleWorkManualSource") ||
  !manifestLoaderSource.includes("chronicleWorkManualSection,") ||
  !pageSource.includes('section.id === chronicleWorkManualSection.id') ||
  !pageSource.includes("knowledge-work-manual-source") ||
  !pageSource.includes("data-reviewed-chapters-sha256") ||
  pageSource.includes("knowledge-work-manual-entry") ||
  pageSource.includes("knowledge-work-manual-view")
) {
  addError("Chronicle Work Manual shared-section canonical-source delivery wiring is incomplete.");
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
  `Chronicle Knowledge Base validation passed: ${expectedCapabilityIds.length} capabilities, ${expectedAdminTools.length} administrative tool manuals, ${expectedGalleryTabs.length} Gallery tabs, ${expectedAssets.size} checked-in assets${notes.length > 0 ? ` (${notes.join("; ")})` : ""}.`,
);
