import {
  Fragment,
  useEffect,
  useMemo,
  type ComponentPropsWithoutRef,
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
import { ChronicleSkillsSection } from "@/components/admin/knowledge-base/ChronicleSkillsSection";
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
  getKnowledgeTabMarkdown,
  type KnowledgeSection,
  type KnowledgeTab,
} from "@/data/chronicle-knowledge-base/manifest";
import type { OperationalRecordRegistry } from "@/data/chronicle-knowledge-base/operational-record-contract";
import { getOperationalCapability } from "@/data/chronicle-knowledge-base/operational-capability-registry";
import {
  buildKnowledgeBaseTabHref,
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
};

function SharedToolRecords({ section, tab }: { section: KnowledgeSection; tab: KnowledgeTab }) {
  if (tab.id === "changelog") {
    return <>
      <h2>{section.label} — Recorded History</h2>
      <p>Accepted changes remain in the canonical Chronicle Changelog. This tool manual does not keep a second history or turn an unfinished feature into an accepted result.</p>
      <p><Link to="/style-guide/ui-audit?view=changelog">Open the canonical Changelog</Link>. Use the record’s title, scope, and supporting evidence to identify changes to {section.label}; the shared history also includes other Chronicle work.</p>
    </>;
  }

  return <>
    <h2>{section.label} — Issues</h2>
    <p>Verified administrative tool findings belong to the existing Admin Panel Issue records. Current limitations are explained in this manual, but prose describing an unfinished control is not automatically a registered Issue or permission to fix it.</p>
    <p><Link to={buildKnowledgeBaseTabHref("admin", "issues")}>Open Admin Panel Issues</Link>. This shared register covers other Admin tools as well, so its count is not presented as a count for {section.label}.</p>
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
          backLabel="Back to Admin Panel"
          onBack={onBack}
        />
        <main className="chronicle-knowledge-main">
          <section className="knowledge-archive-view knowledge-archive-view--missing">
            <h1>Historical work record not found</h1>
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
        backLabel="Back to Admin Panel"
        onBack={onBack}
      />
      <main className="chronicle-knowledge-main">
        <section className="knowledge-archive-view">
          <div className="knowledge-archive-view__introduction">
            <h1>Historical work record</h1>
            <p>
              This preserved {projectCapabilityLabel} work record is historical reference.
              Its workflow instructions and resume points are retired, not current
              assignments. The recorded state is retained; archiving does not mean
              unfinished work was completed.
            </p>
            <dl className="knowledge-archive-view__metadata">
              <div>
                <dt>Project ID</dt>
                <dd>{project.id}</dd>
              </div>
              <div>
                <dt>Recorded state</dt>
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
  const { projectId } = useParams<{ projectId?: string }>();
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
  useEffect(() => {
    if (!requestedSectionId || !isAdminToolSectionId(requestedSectionId)) {
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
    location.hash,
    requestedSectionId,
    requestedTabId,
  ]);

  if (projectId) {
    return (
      <ArchivedCurrentWorkView
        projectId={projectId}
        registry={resolvedOperationalRegistry}
        onBack={() => navigate("/?tab=admin")}
      />
    );
  }

  if (requestedSectionId === "app-architecture-reference") {
    return (
      <Navigate
        replace
        to={`${buildKnowledgeBaseTabHref("chronicle-overview", "overview")}#chronicle-repository-map`}
      />
    );
  }

  if (requestedTabId === "current-work") {
    const section = chronicleKnowledgeSections.find((entry) => entry.id === requestedSectionId);
    const sectionId = (section?.id ?? "chronicle-overview") as Parameters<typeof buildKnowledgeBaseTabHref>[0];
    return <Navigate replace to={buildKnowledgeBaseTabHref(sectionId, "overview")} />;
  }

  const updateTabAddress = (section: KnowledgeSection, tab: KnowledgeTab) => {
    if (section.id === "roleplay-pipeline" || isAdminToolSectionId(section.id)) {
      navigate(buildKnowledgeBaseTabHref(section.id, tab.id), { replace: true });
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
              {section.id === "chronicle-overview" ? (
                <ChronicleSkillsSection exportAllTabs={exportAllTabs} />
              ) : null}
            </Fragment>
          );
        })}
      </main>
    </div>
  );
}

export default ChronicleKnowledgeBasePage;
