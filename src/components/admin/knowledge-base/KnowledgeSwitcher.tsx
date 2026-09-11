import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import {
  getKnowledgeIssueCount,
  type KnowledgeSection,
  type KnowledgeTab,
} from "@/data/chronicle-knowledge-base/manifest";

const METADATA_PLACEHOLDER = "**/**/**";
const OPERATIONAL_CONTENT_KINDS = new Set([
  "issue-records",
  "changelog-records",
  "shared-records",
]);

type KnowledgeSwitcherProps = {
  section: KnowledgeSection;
  renderContent: (tab: KnowledgeTab) => ReactNode;
  renderMetadata?: (tab: KnowledgeTab) => ReactNode;
  requestedTabId?: string;
  onTabSelected?: (tab: KnowledgeTab) => void;
  /** Render the same panels together only while creating an offline snapshot. */
  exportAllTabs?: boolean;
};

export function KnowledgeSwitcher({
  section,
  renderContent,
  renderMetadata,
  requestedTabId,
  onTabSelected,
  exportAllTabs = false,
}: KnowledgeSwitcherProps) {
  const [activeTabId, setActiveTabId] = useState(() =>
    section.tabs.some((tab) => tab.id === requestedTabId)
      ? requestedTabId ?? ""
      : section.tabs[0]?.id ?? "",
  );
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const panelRef = useRef<HTMLElement | null>(null);
  const previousRequestedTabId = useRef(requestedTabId);

  const activeIndex = useMemo(() => {
    const selectedIndex = section.tabs.findIndex((tab) => tab.id === activeTabId);
    return selectedIndex >= 0 ? selectedIndex : 0;
  }, [activeTabId, section.tabs]);

  const activeTab = section.tabs[activeIndex];
  const panelId = `${section.id}-panel`;

  useEffect(() => {
    if (!section.tabs.some((tab) => tab.id === activeTabId)) {
      setActiveTabId(section.tabs[0]?.id ?? "");
    }
  }, [activeTabId, section.tabs]);

  useEffect(() => {
    if (previousRequestedTabId.current === requestedTabId) return;
    previousRequestedTabId.current = requestedTabId;

    if (requestedTabId && section.tabs.some((tab) => tab.id === requestedTabId)) {
      setActiveTabId(requestedTabId);
    }
  }, [requestedTabId, section.tabs]);

  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.scrollTop = 0;
    }
  }, [activeTabId]);

  const selectTab = (index: number, moveFocus = false) => {
    const nextTab = section.tabs[index];
    if (!nextTab) return;

    setActiveTabId(nextTab.id);
    onTabSelected?.(nextTab);

    if (moveFocus) {
      tabRefs.current[index]?.focus();
    }
  };

  const handleTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight") {
      nextIndex = (index + 1) % section.tabs.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (index - 1 + section.tabs.length) % section.tabs.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = section.tabs.length - 1;
    }

    if (nextIndex === null) return;

    event.preventDefault();
    selectTab(nextIndex, true);
  };

  if (!activeTab) return null;

  return (
    <section className="knowledge-switcher" id={section.id}>
      <h1 className="knowledge-section-title">{section.label}</h1>
      <p className="knowledge-section-description">{section.description}</p>

      <div
        className="knowledge-tab-rail"
        role="tablist"
        aria-label={`${section.label} knowledge views`}
      >
        {section.tabs.map((tab, index) => {
          const selected = index === activeIndex;
          const issueCount = getKnowledgeIssueCount(tab);
          const issueTab = tab.contentKind === "issue-records";
          const issueTabActive = issueTab && issueCount > 0;
          const tabId = `${section.id}-tab-${tab.id}`;
          const accessibleLabel = issueTabActive
            ? `${tab.label}, ${issueCount} open`
            : undefined;

          return (
            <button
              key={tab.id}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              type="button"
              id={tabId}
              role="tab"
              className={[
                "knowledge-tab",
                issueTab ? "knowledge-tab--issues" : "",
                issueTabActive ? "knowledge-tab--issues-active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-label={accessibleLabel}
              aria-selected={selected}
              aria-controls={exportAllTabs ? `${section.id}-panel-${tab.id}` : panelId}
              tabIndex={selected ? 0 : -1}
              onClick={() => selectTab(index)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
            >
              {tab.label}
              {issueTabActive ? (
                <span className="knowledge-tab__count" aria-hidden="true">
                  {issueCount}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {(exportAllTabs ? section.tabs : [activeTab]).map((panelTab) => <section
        key={exportAllTabs ? panelTab.id : "active-panel"}
        ref={panelTab.id === activeTab.id ? panelRef : undefined}
        id={exportAllTabs ? `${section.id}-panel-${panelTab.id}` : panelId}
        hidden={exportAllTabs && panelTab.id !== activeTab.id}
        className="knowledge-content-panel"
        role="tabpanel"
        aria-labelledby={`${section.id}-tab-${panelTab.id}`}
        tabIndex={0}
      >
        {renderMetadata ? renderMetadata(panelTab) : !OPERATIONAL_CONTENT_KINDS.has(panelTab.contentKind) ? (
          <div className="knowledge-content-metadata">
            <span className="knowledge-metadata-pill">
              Last Reviewed: {panelTab.reviewed ?? METADATA_PLACEHOLDER}
            </span>
            <span className="knowledge-metadata-pill">
              Last Updated: {panelTab.updated ?? METADATA_PLACEHOLDER}
            </span>
          </div>
        ) : null}
        <article className="knowledge-content">{renderContent(panelTab)}</article>
      </section>)}
    </section>
  );
}
