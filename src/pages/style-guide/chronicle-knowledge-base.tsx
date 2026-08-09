import { useMemo, type ComponentPropsWithoutRef } from "react";
import ReactMarkdown, {
  defaultUrlTransform,
  type Components,
} from "react-markdown";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import remarkGfm from "remark-gfm";

import adminPanelOverview from "@/assets/architecture-knowledge-hub/admin-panel-overview.png";
import communityGalleryOverview from "@/assets/architecture-knowledge-hub/community-gallery-overview.png";
import { CommunityGalleryArchitecture } from "@/components/admin/knowledge-base/CommunityGalleryArchitecture";
import { KnowledgeSwitcher } from "@/components/admin/knowledge-base/KnowledgeSwitcher";
import { OperationalRecordContent } from "@/components/admin/knowledge-base/OperationalRecordContent";
import { buildChangelogRecordHref } from "@/components/admin/knowledge-base/changelog-record-route";
import type {
  EffectiveChangelogEntry,
} from "@/data/chronicle-knowledge-base/changelog-record-contract";
import type { ChangelogRegistryLoader } from "@/data/chronicle-knowledge-base/changelog-record-sources";
import {
  chronicleKnowledgeRoughDraft,
  chronicleKnowledgeSections,
  getKnowledgeTabMarkdown,
  type KnowledgeSection,
  type KnowledgeTab,
} from "@/data/chronicle-knowledge-base/manifest";
import type { OperationalRecordRegistry } from "@/data/chronicle-knowledge-base/operational-record-contract";
import { galleryOperationalRecordRegistry } from "@/data/chronicle-knowledge-base/operational-record-sources";

import "./chronicle-knowledge-base.css";

const knowledgeAssets: Record<string, string> = {
  "knowledge-asset:admin-panel-overview": adminPanelOverview,
  "knowledge-asset:community-gallery-overview": communityGalleryOverview,
};

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
              No canonical archived Community Gallery project matches this
              address. Nothing was inferred from active work or Changelog
              history.
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
              This is the complete preserved work record for a finished
              Community Gallery project. It remains separate from the stable
              capability manual and from the concise Changelog summary.
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
                          "community-gallery",
                          "archive",
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

  if (tab.contentKind === "issue-records") {
    return (
      <OperationalRecordContent
        kind="issues"
        registry={operationalRegistry}
        renderMarkdown={(source) => <KnowledgeMarkdown source={source} />}
      />
    );
  }

  if (tab.contentKind === "current-work-records") {
    return (
      <OperationalRecordContent
        kind="current-work"
        registry={operationalRegistry}
        renderMarkdown={(source) => <KnowledgeMarkdown source={source} />}
      />
    );
  }

  if (tab.contentKind === "changelog-records") {
    return (
      <OperationalRecordContent
        kind="changelog"
        registry={operationalRegistry}
        changelogLoader={changelogLoader}
        renderMarkdown={(source) => <KnowledgeMarkdown source={source} />}
      />
    );
  }

  const markdown = (
    <KnowledgeMarkdown source={getKnowledgeTabMarkdown(section, tab)} />
  );

  if (section.id === "community-gallery" && tab.id === "app-architecture") {
    return (
      <CommunityGalleryArchitecture>{markdown}</CommunityGalleryArchitecture>
    );
  }

  return markdown;
}

export type ChronicleKnowledgeBasePageProps = {
  operationalRegistry?: OperationalRecordRegistry;
};

export function ChronicleKnowledgeBasePage({
  operationalRegistry,
}: ChronicleKnowledgeBasePageProps = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId } = useParams<{ projectId?: string }>();
  const resolvedOperationalRegistry =
    operationalRegistry ?? galleryOperationalRecordRegistry;
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
  const requestedGalleryTab =
    searchParams.get("section") === "community-gallery"
      ? searchParams.get("tab") ?? undefined
      : undefined;

  if (projectId) {
    return (
      <ArchivedCurrentWorkView
        projectId={projectId}
        registry={resolvedOperationalRegistry}
        onBack={() => navigate("/style-guide/chronicle-knowledge-base")}
      />
    );
  }

  const updateGalleryTabAddress = (tab: KnowledgeTab) => {
    const nextParams = new URLSearchParams(location.search);

    if (tab.id === "changelog") {
      nextParams.set("section", "community-gallery");
      nextParams.set("tab", "changelog");
    } else {
      nextParams.delete("section");
      nextParams.delete("tab");
    }

    const nextSearch = nextParams.toString();
    navigate(
      {
        pathname: location.pathname,
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
        <hr className="chronicle-knowledge-divider" />

        {chronicleKnowledgeSections.map((section) => (
          <KnowledgeSwitcher
            key={section.id}
            section={section}
            renderContent={(tab) =>
              renderKnowledgeContent(
                section,
                tab,
                resolvedOperationalRegistry,
                injectedChangelogLoader,
              )
            }
            requestedTabId={
              section.id === "community-gallery"
                ? requestedGalleryTab
                : undefined
            }
            onTabSelected={
              section.id === "community-gallery"
                ? updateGalleryTabAddress
                : undefined
            }
          />
        ))}

        <section className="knowledge-rough-draft">
          <h1>Chronicle Application Manual Writer — Rough Draft</h1>
          <div className="knowledge-rough-draft__box">
            <pre>{chronicleKnowledgeRoughDraft}</pre>
          </div>
        </section>
      </main>
    </div>
  );
}

export default ChronicleKnowledgeBasePage;
