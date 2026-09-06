import {
  Fragment,
  useEffect,
  useMemo,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import ReactMarkdown, {
  defaultUrlTransform,
  type Components,
} from "react-markdown";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import remarkGfm from "remark-gfm";

import adminPanelOverview from "@/assets/architecture-knowledge-hub/admin-panel-overview.png";
import communityGalleryOverview from "@/assets/architecture-knowledge-hub/community-gallery-overview.png";
import { CapabilityArchitecture } from "@/components/admin/knowledge-base/CapabilityArchitecture";
import { KnowledgeSwitcher } from "@/components/admin/knowledge-base/KnowledgeSwitcher";
import { KnowledgeDownloadMenu } from "@/components/admin/knowledge-base/KnowledgeDownloadMenu";
import { OperationalRecordContent } from "@/components/admin/knowledge-base/OperationalRecordContent";
import { RoleplayPipelineDocument } from "@/components/admin/knowledge-base/RoleplayPipelineDocument";
import { RepositoryGraphView } from "@/components/admin/knowledge-base/RepositoryGraphView";
import { buildChangelogRecordHref } from "@/components/admin/knowledge-base/changelog-record-route";
import type {
  EffectiveChangelogEntry,
} from "@/data/chronicle-knowledge-base/changelog-record-contract";
import type { ChangelogRegistryLoader } from "@/data/chronicle-knowledge-base/changelog-record-sources";
import {
  chronicleKnowledgeSections,
  chronicleWorkManualMetadata,
  chronicleWorkManualSection,
  chronicleWorkManualSource,
  getKnowledgeTabMarkdown,
  getWorkManualPreface,
  type KnowledgeSection,
  type KnowledgeTab,
} from "@/data/chronicle-knowledge-base/manifest";
import type { OperationalRecordRegistry } from "@/data/chronicle-knowledge-base/operational-record-contract";
import { getOperationalCapability } from "@/data/chronicle-knowledge-base/operational-capability-registry";
import {
  buildKnowledgeBaseTabHref,
  buildWorkManualHref,
  CHRONICLE_KNOWLEDGE_ROUTE_REGISTRY,
} from "@/data/chronicle-knowledge-base/knowledge-routes";
import { isChronicleCapabilityId } from "@/data/chronicle-knowledge-base/capability-ids";
import { isAdminToolSectionId } from "@/data/chronicle-knowledge-base/admin-tool-ids";
import {
  chronicleOperationalRecordRegistry,
  selectCapabilityOperationalRecordRegistry,
} from "@/data/chronicle-knowledge-base/operational-record-sources";

import "./chronicle-knowledge-base.css";

const knowledgeAssets: Record<string, string> = {
  "knowledge-asset:admin-panel-overview": adminPanelOverview,
  "knowledge-asset:community-gallery-overview": communityGalleryOverview,
};

const capabilityArchitectureEntrySources: Record<string, string> = {
  "community-gallery": "src/components/chronicle/GalleryHub.tsx",
  "my-stories": "src/components/chronicle/StoryHub.tsx",
  "character-library": "src/features/character-builder/CharacterBuilderScreen.tsx",
  "my-images": "src/components/chronicle/ImageLibraryTab.tsx",
  "story-builder": "src/features/story-builder/StoryBuilderScreen.tsx",
  "character-builder": "src/features/character-builder/CharacterBuilderScreen.tsx",
  "chat-interface": "src/components/chronicle/ChatInterfaceTab.tsx",
  "roleplay-pipeline": "src/components/chronicle/ChatInterfaceTab.tsx",
  "chat-history": "src/components/chronicle/ConversationsTab.tsx",
  "public-profile": "src/components/account/PublicProfileTab.tsx",
  account: "src/components/account/AccountSettingsTab.tsx",
  admin: "src/pages/Admin.tsx",
  "shared-systems": "src/App.tsx",
  "knowledge-base-system": "src/pages/style-guide/chronicle-knowledge-base.tsx",
  "schema-reference": "src/pages/style-guide/supabase-schema-reference.tsx",
  "quality-hub": "src/pages/style-guide/ui-audit.tsx",
  "validation-evidence-ledger": "src/pages/style-guide/validation-evidence-ledger.tsx",
  "finance-dashboard": "src/components/admin/finance/FinanceDashboardTool.tsx",
  "research-development": "src/components/admin/research-development/ResearchDevelopmentTool.tsx",
  "image-generation": "src/components/admin/ImageGenerationTool.tsx",
  "app-dashboard": "src/components/admin/styleguide/StyleGuideTool.tsx",
};

function SharedToolRecords({ section, tab }: { section: KnowledgeSection; tab: KnowledgeTab }) {
  const knowledgeScope = section.recordScope === "knowledge-system";
  if (tab.id === "changelog") {
    return <>
      <h2>{section.label} — Recorded History</h2>
      <p>Accepted changes remain in the canonical Chronicle Changelog. This tool manual does not keep a second history or turn an unfinished feature into an accepted result.</p>
      <p><Link to="/style-guide/ui-audit?view=changelog">Open the canonical Changelog</Link>. Use the record’s title, scope, and supporting evidence to identify changes to {section.label}; the shared history also includes other Chronicle work.</p>
    </>;
  }
  if (tab.id === "current-work") {
    return <>
      <h2>{section.label} — Current Work</h2>
      <p>This tool uses existing project records rather than a new per-tool project register. Administrative interface work is held with Admin Panel; Knowledge infrastructure work retains its Knowledge System owner.</p>
      <p><Link to={buildKnowledgeBaseTabHref("admin", "current-work")}>Open Admin Panel Current Work</Link>.</p>
      {knowledgeScope && <p>Knowledge System projects are maintained in <code>docs/current-work/active/knowledge-system/</code>, with retained closeouts in <code>docs/current-work/archive/knowledge-system/</code>. Their scope and resume point remain in those canonical records; this reference does not duplicate or change them.</p>}
      <p>The <Link to={buildWorkManualHref("evidence-records-stopping")}>Work Manual’s record rules</Link> determine when a project is required. Documenting this tool alone does not start or close one.</p>
    </>;
  }
  return <>
    <h2>{section.label} — Issues</h2>
    <p>Verified administrative tool findings belong to the existing Admin Panel Issue records. Current limitations are explained in this manual, but prose describing an unfinished control is not automatically a registered Issue or permission to fix it.</p>
    <p><Link to={buildKnowledgeBaseTabHref("admin", "issues")}>Open Admin Panel Issues</Link>. This shared register covers other Admin tools as well, so its count is not presented as a count for {section.label}.</p>
    {knowledgeScope && <p>Findings affecting Knowledge infrastructure must retain the scope and record relationships specified by the canonical Work Manual, rather than being recast as an ordinary interface defect.</p>}
  </>;
}

function transformKnowledgeUrl(value: string) {
  return Object.prototype.hasOwnProperty.call(knowledgeAssets, value)
    ? value
    : defaultUrlTransform(value);
}

function KnowledgeLink({
  href,
  children,
  ...props
}: ComponentPropsWithoutRef<"a">) {
  if (href?.startsWith("/")) {
    return (
      <Link to={href} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
}

function KnowledgeImage({
  src,
  alt,
  ...props
}: ComponentPropsWithoutRef<"img">) {
  const resolvedSource = src ? (knowledgeAssets[src] ?? src) : undefined;

  return (
    <img
      src={resolvedSource}
      alt={alt ?? ""}
      loading="lazy"
      decoding="async"
      {...props}
    />
  );
}

const manualSectionHeadings: Components = {
  h2: ({ children, ...props }) => <h1 {...props}>{children}</h1>,
  h3: ({ children, ...props }) => <h2 {...props}>{children}</h2>,
  h4: ({ children, ...props }) => <h3 {...props}>{children}</h3>,
};

const archivedDocumentHeadings: Components = {
  h1: ({ children, ...props }) => <h2 {...props}>{children}</h2>,
  h2: ({ children, ...props }) => <h3 {...props}>{children}</h3>,
  h3: ({ children, ...props }) => <h4 {...props}>{children}</h4>,
  h4: ({ children, ...props }) => <h5 {...props}>{children}</h5>,
  h5: ({ children, ...props }) => <h6 {...props}>{children}</h6>,
};

function KnowledgeMarkdown({
  source,
  preserveDocumentHierarchy = false,
}: {
  source: string;
  preserveDocumentHierarchy?: boolean;
}) {
  if (!source) return null;

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      urlTransform={transformKnowledgeUrl}
      components={{
        a: KnowledgeLink,
        img: KnowledgeImage,
        pre: ({ children }) => (
          <pre className="knowledge-code-block">{children}</pre>
        ),
        ...(preserveDocumentHierarchy
          ? archivedDocumentHeadings
          : manualSectionHeadings),
      }}
    >
      {source}
    </ReactMarkdown>
  );
}

function workManualHeadingId(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function getHeadingText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) return node.map(getHeadingText).join("");
  if (node && typeof node === "object" && "props" in node) {
    return getHeadingText(
      (node as { props?: { children?: ReactNode } }).props?.children,
    );
  }
  return "";
}

const workManualAnchorTargets = (() => {
  const chapterIdsByHeading = new Map<string, string>();
  for (const tab of chronicleWorkManualSection.tabs) {
    const headings = tab.headings?.length
      ? tab.headings
      : tab.heading
        ? [tab.heading]
        : [];
    for (const heading of headings) chapterIdsByHeading.set(heading, tab.id);
  }
  const targets = new Map<string, { tabId: string; anchor: string }>();
  let currentTabId = chronicleWorkManualSection.tabs[0]?.id ?? "start-here";

  for (const match of chronicleWorkManualSource.matchAll(
    /^(#{2,6}) ([^\r\n]+)\r?$/gm,
  )) {
    const [, hashes, heading] = match;
    if (hashes.length === 2) {
      currentTabId = chapterIdsByHeading.get(heading.trim()) ?? currentTabId;
    }
    const anchor = workManualHeadingId(heading);
    targets.set(`#${anchor}`, { tabId: currentTabId, anchor });
  }

  return targets;
})();

function WorkManualLink({
  href,
  children,
  ...props
}: ComponentPropsWithoutRef<"a">) {
  const target = href ? workManualAnchorTargets.get(href) : undefined;
  if (target) {
    return (
      <Link to={buildWorkManualHref(target.tabId, target.anchor)} {...props}>
        {children}
      </Link>
    );
  }
  return <KnowledgeLink href={href} {...props}>{children}</KnowledgeLink>;
}

function WorkManualMarkdown({ source }: { source: string }) {
  if (!source) return null;
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      urlTransform={transformKnowledgeUrl}
      components={{
        a: WorkManualLink,
        img: KnowledgeImage,
        pre: ({ children }) => (
          <pre className="knowledge-code-block">{children}</pre>
        ),
        h2: ({ children, ...props }) => (
          <h1 id={workManualHeadingId(getHeadingText(children))} {...props}>
            {children}
          </h1>
        ),
        h3: ({ children, ...props }) => (
          <h2 id={workManualHeadingId(getHeadingText(children))} {...props}>
            {children}
          </h2>
        ),
        h4: ({ children, ...props }) => (
          <h3 id={workManualHeadingId(getHeadingText(children))} {...props}>
            {children}
          </h3>
        ),
        h5: ({ children, ...props }) => (
          <h4 id={workManualHeadingId(getHeadingText(children))} {...props}>
            {children}
          </h4>
        ),
        h6: ({ children, ...props }) => (
          <h5 id={workManualHeadingId(getHeadingText(children))} {...props}>
            {children}
          </h5>
        ),
      }}
    >
      {source}
    </ReactMarkdown>
  );
}

function WorkManualContent({ tab }: { tab: KnowledgeTab }) {
  const groupedChapters = getKnowledgeTabMarkdown(
    chronicleWorkManualSection,
    tab,
  );
  const preface =
    tab.id === "start-here"
      ? `${getWorkManualPreface(chronicleWorkManualSource)}\n\n`
      : "";
  const source = `${preface}${groupedChapters}`;

  return (
    <div
      className="knowledge-work-manual-source"
      data-work-manual-version={chronicleWorkManualMetadata.manualVersion}
      data-work-manual-authority-epoch={
        chronicleWorkManualMetadata.authorityEpoch
      }
      data-work-manual-source={chronicleWorkManualMetadata.canonicalPath}
      data-reviewed-chapters-sha256={
        chronicleWorkManualMetadata.reviewedChaptersSha256
      }
    >
      <WorkManualMarkdown source={source} />
      {tab.id === "overview" ? (
        <section
          className="knowledge-work-manual-status"
          aria-label="Chronicle Work Manual status"
        >
          <h2>Manual status</h2>
          <p>
            <strong>Version:</strong> {chronicleWorkManualMetadata.manualVersion}
            {" · "}
            <strong>Status:</strong> {chronicleWorkManualMetadata.status}
          </p>
          <p>
            <strong>Canonical source:</strong>{" "}
            <code>{chronicleWorkManualMetadata.canonicalPath}</code>
          </p>
          <p>
            <strong>Reviewed source identity:</strong>{" "}
            <code>{chronicleWorkManualMetadata.reviewedChaptersSha256}</code>
          </p>
        </section>
      ) : null}
    </div>
  );
}

function ChronicleKnowledgeHeader({
  backLabel,
  onBack,
}: {
  backLabel: string;
  onBack: () => void;
}) {
  return (
    <header className="chronicle-knowledge-header">
      <button
        type="button"
        className="chronicle-knowledge-back"
        onClick={onBack}
        aria-label={backLabel}
        title={backLabel}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>
      <h1>Chronicle Knowledge Base</h1>
      <KnowledgeDownloadMenu />
    </header>
  );
}

function archiveChangelogEntries(
  registry: OperationalRecordRegistry,
  changelogIds: readonly string[],
) {
  const effectiveById = new Map(
    registry.changelogRegistry.effectiveEntries.map((entry) => [entry.id, entry]),
  );

  return changelogIds.flatMap((changeId) => {
    const entry = effectiveById.get(changeId);
    return entry?.effectiveRecord.variant === "accepted_closeout"
      ? [entry]
      : [];
  }) as EffectiveChangelogEntry[];
}

function ArchivedCurrentWorkView({
  projectId,
  registry,
  onBack,
}: {
  projectId: string;
  registry: OperationalRecordRegistry;
  onBack: () => void;
}) {
  const project = registry.archivedProjects.find(
    (candidate) => candidate.id === projectId,
  );

  if (!project) {
    return (
      <div className="chronicle-knowledge-base-page">
        <ChronicleKnowledgeHeader
          backLabel="Back to Chronicle Knowledge Base"
          onBack={onBack}
        />
        <main className="chronicle-knowledge-main">
          <section className="knowledge-archive-view knowledge-archive-view--missing">
            <h1>Archived Current Work not found</h1>
            <p>
              No canonical archived Chronicle project matches this address.
              Nothing was inferred from active work or Changelog history.
            </p>
            <p>
              <Link to="/style-guide/chronicle-knowledge-base">
                Return to Chronicle Knowledge Base
              </Link>
            </p>
          </section>
        </main>
      </div>
    );
  }

  const closeout = project.closeout;
  const projectCapability = getOperationalCapability(project.ownerCapability);
  const projectCapabilityLabel =
    projectCapability?.displayName ?? project.ownerCapability;
  const changelogScope = isChronicleCapabilityId(project.ownerCapability)
    ? project.ownerCapability
    : "global";
  const acceptedChanges = archiveChangelogEntries(
    registry,
    closeout?.changelogIds ?? [],
  );

  return (
    <div className="chronicle-knowledge-base-page">
      <ChronicleKnowledgeHeader
        backLabel="Back to Chronicle Knowledge Base"
        onBack={onBack}
      />
      <main className="chronicle-knowledge-main">
        <section className="knowledge-archive-view">
          <div className="knowledge-archive-view__introduction">
            <h1>Archived Current Work</h1>
            <p>
              This is the complete preserved work record for a finished{" "}
              {projectCapabilityLabel} project. It remains separate from the
              stable capability manual and from the concise Changelog summary.
            </p>
            <dl className="knowledge-archive-view__metadata">
              <div>
                <dt>Project ID</dt>
                <dd>{project.id}</dd>
              </div>
              <div>
                <dt>Terminal state</dt>
                <dd>{project.workflowState}</dd>
              </div>
              <div>
                <dt>Archived on</dt>
                <dd>{closeout?.archivedOn ?? "Not recorded"}</dd>
              </div>
              <div>
                <dt>Source record</dt>
                <dd>{project.sourcePath}</dd>
              </div>
            </dl>

            {acceptedChanges.length > 0 ? (
              <div className="knowledge-archive-view__changelog-links">
                <h2>
                  {acceptedChanges.length === 1
                    ? "Accepted Changelog record"
                    : "Accepted Changelog records"}
                </h2>
                <ul>
                  {acceptedChanges.map((entry) => (
                    <li key={entry.id}>
                      <Link
                        to={buildChangelogRecordHref(
                          entry.id,
                          changelogScope,
                          changelogScope === "global" ? "quality-hub" : "archive",
                        )}
                      >
                        Open the complete {entry.id} Changelog record
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="knowledge-archive-view__no-accepted-change">
                This archived project does not identify a modern accepted
                Changelog record.
              </p>
            )}
          </div>

          <article
            className="knowledge-content knowledge-archive-view__document"
            data-source-record={project.sourcePath}
          >
            <KnowledgeMarkdown
              source={project.body}
              preserveDocumentHierarchy
            />
          </article>
        </section>
      </main>
    </div>
  );
}

function renderKnowledgeContent(
  section: KnowledgeSection,
  tab: KnowledgeTab,
  operationalRegistry: OperationalRecordRegistry,
  changelogLoader?: ChangelogRegistryLoader,
) {
  if (tab.contentKind === "blank") return null;
  if (tab.contentKind === "shared-records") return <SharedToolRecords section={section} tab={tab} />;
  const operationalCapabilityId = isChronicleCapabilityId(section.id)
    ? section.id
    : null;

  if (tab.contentKind === "issue-records") {
    if (!operationalCapabilityId) throw new Error(`${section.id} cannot own Issues.`);
    return (
      <OperationalRecordContent
        kind="issues"
        capabilityId={operationalCapabilityId}
        capabilityLabel={section.label}
        registry={operationalRegistry}
        renderMarkdown={(source) => <KnowledgeMarkdown source={source} />}
      />
    );
  }

  if (tab.contentKind === "current-work-records") {
    if (!operationalCapabilityId) throw new Error(`${section.id} cannot own Current Work.`);
    return (
      <OperationalRecordContent
        kind="current-work"
        capabilityId={operationalCapabilityId}
        capabilityLabel={section.label}
        registry={operationalRegistry}
        renderMarkdown={(source) => <KnowledgeMarkdown source={source} />}
      />
    );
  }

  if (tab.contentKind === "changelog-records") {
    if (!operationalCapabilityId) throw new Error(`${section.id} cannot own Changelog.`);
    return (
      <OperationalRecordContent
        kind="changelog"
        capabilityId={operationalCapabilityId}
        capabilityLabel={section.label}
        registry={operationalRegistry}
        changelogLoader={changelogLoader}
        renderMarkdown={(source) => <KnowledgeMarkdown source={source} />}
      />
    );
  }

  if (tab.contentKind === "work-manual-chapter") {
    return <WorkManualContent tab={tab} />;
  }

  const markdown = section.id === "roleplay-pipeline" ? (
    <RoleplayPipelineDocument tab={tab} />
  ) : (
    <KnowledgeMarkdown source={getKnowledgeTabMarkdown(section, tab)} />
  );

  if (section.id === "chronicle-overview" && tab.id === "overview") {
    return (
      <div className="knowledge-architecture-source" data-source-owner="chronicle-overview-and-private-canonical-repository-graph">
        <div className="knowledge-architecture-source__overview">{markdown}</div>
        <div className="knowledge-architecture-source__global-map">
          <RepositoryGraphView
            mode="global"
            capabilityId={null}
            capabilityLabel="the complete Chronicle application"
            preferredSourcePath="src/App.tsx"
            initialView="chronicle-areas"
            historianLoader={changelogLoader}
          />
        </div>
      </div>
    );
  }

  const architectureEntrySource = capabilityArchitectureEntrySources[section.id];
  if ((isChronicleCapabilityId(section.id) || isAdminToolSectionId(section.id)) && architectureEntrySource && tab.id === "app-architecture") {
    return (
      <CapabilityArchitecture
        capabilityId={section.id}
        capabilityLabel={section.label}
        preferredSourcePath={architectureEntrySource}
        sourceOwner={section.document ?? "registered capability manual"}
      >
        {markdown}
      </CapabilityArchitecture>
    );
  }

  return markdown;
}

export type ChronicleKnowledgeBasePageProps = {
  operationalRegistry?: OperationalRecordRegistry;
  exportAllTabs?: boolean;
};

export function ChronicleKnowledgeBasePage({
  operationalRegistry,
  exportAllTabs = false,
}: ChronicleKnowledgeBasePageProps = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId, chapterId } = useParams<{
    projectId?: string;
    chapterId?: string;
  }>();
  const resolvedOperationalRegistry =
    operationalRegistry ?? chronicleOperationalRecordRegistry;
  const injectedChangelogLoader = useMemo<
    ChangelogRegistryLoader | undefined
  >(
    () =>
      operationalRegistry
        ? async () => ({
            status: "ready" as const,
            registry: operationalRegistry.changelogRegistry,
          })
        : undefined,
    [operationalRegistry],
  );
  const searchParams = new URLSearchParams(location.search);
  const requestedSectionId = searchParams.get("section") ?? undefined;
  const requestedTabId = searchParams.get("tab") ?? undefined;
  const legacyWorkManualPath =
    location.pathname === CHRONICLE_KNOWLEDGE_ROUTE_REGISTRY.workManual ||
    location.pathname.startsWith(
      `${CHRONICLE_KNOWLEDGE_ROUTE_REGISTRY.workManual}/`,
    );
  const requestedManualTab = chronicleWorkManualSection.tabs.find(
    (tab) =>
      tab.id === requestedTabId || tab.legacyIds?.includes(requestedTabId ?? ""),
  );
  const requestedManualTabId = requestedManualTab?.id;
  const requestedLegacyTabIndex = requestedManualTab?.legacyIds?.indexOf(
    requestedTabId ?? "",
  );

  useEffect(() => {
    if (
      legacyWorkManualPath ||
      (!requestedSectionId || (requestedSectionId !== chronicleWorkManualSection.id && !isAdminToolSectionId(requestedSectionId)))
    ) {
      return;
    }

    const targetId = location.hash
      ? decodeURIComponent(location.hash.slice(1))
      : requestedSectionId;
    let attempt = 0;
    let timer = 0;
    const scrollToTarget = () => {
      const target = document.getElementById(targetId);
      if (target) {
        if (typeof target.scrollIntoView === "function") {
          target.scrollIntoView({ block: "start" });
        }
        return;
      }
      attempt += 1;
      if (attempt < 5) timer = window.setTimeout(scrollToTarget, 0);
    };

    timer = window.setTimeout(scrollToTarget, 0);
    return () => window.clearTimeout(timer);
  }, [
    legacyWorkManualPath,
    location.hash,
    requestedSectionId,
    requestedTabId,
  ]);

  if (projectId) {
    return (
      <ArchivedCurrentWorkView
        projectId={projectId}
        registry={resolvedOperationalRegistry}
        onBack={() => navigate("/style-guide/chronicle-knowledge-base")}
      />
    );
  }

  if (legacyWorkManualPath) {
    const legacyChapterTab = chronicleWorkManualSection.tabs.find(
      (tab) =>
        tab.id === chapterId || tab.legacyIds?.includes(chapterId ?? ""),
    );
    const legacyChapterId =
      legacyChapterTab?.id ?? chronicleWorkManualSection.tabs[0]?.id;
    const legacyChapterIndex = legacyChapterTab?.legacyIds?.indexOf(
      chapterId ?? "",
    );
    const legacyAnchor =
      location.hash.slice(1) ||
      (legacyChapterIndex !== undefined && legacyChapterIndex >= 0
        ? workManualHeadingId(
            legacyChapterTab?.headings?.[legacyChapterIndex] ?? "",
          )
        : undefined);
    return (
      <Navigate
        replace
        to={buildWorkManualHref(
          legacyChapterId ?? "start-here",
          legacyAnchor || undefined,
        )}
      />
    );
  }

  if (
    requestedSectionId === chronicleWorkManualSection.id &&
    requestedTabId &&
    !requestedManualTab
  ) {
    return <Navigate replace to={buildWorkManualHref()} />;
  }

  if (requestedSectionId === "app-architecture-reference") {
    return (
      <Navigate
        replace
        to={`${buildKnowledgeBaseTabHref("chronicle-overview", "overview")}#chronicle-repository-map`}
      />
    );
  }

  if (
    requestedSectionId === chronicleWorkManualSection.id &&
    requestedTabId &&
    requestedManualTabId &&
    requestedTabId !== requestedManualTabId
  ) {
    const existingAnchor = location.hash.slice(1);
    const chapterAnchor =
      requestedLegacyTabIndex !== undefined && requestedLegacyTabIndex >= 0
        ? workManualHeadingId(
            requestedManualTab?.headings?.[requestedLegacyTabIndex] ?? "",
          )
        : undefined;
    return (
      <Navigate
        replace
        to={buildWorkManualHref(
          requestedManualTabId,
          !existingAnchor || existingAnchor === chronicleWorkManualSection.id
            ? chapterAnchor
            : existingAnchor,
        )}
      />
    );
  }

  const updateTabAddress = (section: KnowledgeSection, tab: KnowledgeTab) => {
    if (section.id === "roleplay-pipeline" || isAdminToolSectionId(section.id)) {
      navigate(buildKnowledgeBaseTabHref(section.id, tab.id), { replace: true });
      return;
    }
    if (section.id === chronicleWorkManualSection.id) {
      navigate(buildWorkManualHref(tab.id));
      return;
    }

    const nextParams = new URLSearchParams(location.search);

    if (tab.id === "changelog") {
      nextParams.set("section", section.id);
      nextParams.set("tab", "changelog");
    } else {
      nextParams.delete("section");
      nextParams.delete("tab");
    }

    const nextSearch = nextParams.toString();
    navigate(
      {
        pathname: CHRONICLE_KNOWLEDGE_ROUTE_REGISTRY.knowledgeBase,
        search: nextSearch ? `?${nextSearch}` : "",
        hash: "",
      },
      { replace: true },
    );
  };

  return (
    <div className="chronicle-knowledge-base-page">
      <ChronicleKnowledgeHeader
        backLabel="Back to Admin Panel"
        onBack={() => navigate("/?tab=admin")}
      />

      <main className="chronicle-knowledge-main">
        {chronicleKnowledgeSections.map((section) => {
          const operationalCapability = getOperationalCapability(section.id);
          const sectionRegistry = operationalCapability
            ? selectCapabilityOperationalRecordRegistry(
                resolvedOperationalRegistry,
                operationalCapability.id,
              )
            : resolvedOperationalRegistry;
          return (
            <Fragment key={section.id}>
              <KnowledgeSwitcher
                section={section}
                exportAllTabs={exportAllTabs}
                renderContent={(tab) =>
                  renderKnowledgeContent(
                    section,
                    tab,
                    sectionRegistry,
                    injectedChangelogLoader,
                  )
                }
                requestedTabId={
                  section.id === requestedSectionId
                    ? requestedTabId
                    : undefined
                }
                onTabSelected={(tab) => updateTabAddress(section, tab)}
              />
              {section.id === "chronicle-work-manual" ? (
                <section className="knowledge-switcher" id="codex-skills-for-chronicle">
                  <h1 className="knowledge-section-title">Codex Skills for Chronicle</h1>
                  <p className="knowledge-section-description">
                    Approved Codex skills to be used in the Chronicle project.
                  </p>
                  <div className="knowledge-tab-rail knowledge-tab-rail--empty" aria-hidden="true" />
                  <div className="knowledge-content-panel" aria-hidden="true" />
                </section>
              ) : null}
            </Fragment>
          );
        })}
      </main>
    </div>
  );
}

export default ChronicleKnowledgeBasePage;
