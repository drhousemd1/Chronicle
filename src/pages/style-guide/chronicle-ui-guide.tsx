import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AppShellHeader } from "@/components/app-shell/AppShellHeader";
import { getUiGuide, resolveUiGuideImage, uiGuideCatalog } from "@/data/chronicle-ui-guide";
import { renderUiGuideHtml } from "@/data/chronicle-ui-guide/document";
import "./chronicle-ui-guide.css";

const displayDate = (date: string) => date.replace(/^(\d{4})-(\d{2})-(\d{2})$/, "$2/$3/$1");

type Guide = NonNullable<ReturnType<typeof getUiGuide>>;

function GuideReference({ guide, requestedTab, onTabSelected }: {
  guide: Guide;
  requestedTab: string | null;
  onTabSelected: (id: string) => void;
}) {
  const content = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState(requestedTab ?? guide.sections[0].id);
  const selected = guide.sections.find(section => section.id === activeTab) ?? guide.sections[0];
  const rendered = useMemo(() => renderUiGuideHtml(selected.markdown, resolveUiGuideImage), [selected]);

  useEffect(() => {
    if (requestedTab) setActiveTab(requestedTab);
  }, [requestedTab]);

  useEffect(() => {
    content.current?.scrollTo({ top: 0 });
  }, [selected.id]);

  function selectTab(id: string) {
    setActiveTab(id);
    onTabSelected(id);
  }

  function moveTab(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = guide.sections.length - 1;
    const next = event.key === "ArrowRight" ? (index + 1) % (last + 1)
      : event.key === "ArrowLeft" ? (index + last) % (last + 1)
      : event.key === "Home" ? 0 : event.key === "End" ? last : null;
    if (next === null) return;
    event.preventDefault();
    const tab = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next];
    selectTab(guide.sections[next].id);
    tab?.focus();
    tab?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  return <section className="reference-section" aria-labelledby={`guide-title-${guide.id}`}>
    <div className="page-header"><h2 className="page-title" id={`guide-title-${guide.id}`}>{guide.title}</h2><p className="page-description">{guide.description}</p></div>
    <div className="tab-rail" role="tablist" aria-label={`${guide.title.replace(/ UI Reference$/, "")} reference sections`}>
      {guide.sections.map((section, index) => <button key={section.id} id={`guide-tab-${guide.id}-${section.id}`} type="button" role="tab" className="tab" aria-selected={section.id === selected.id} aria-controls={`guide-panel-${guide.id}`} tabIndex={section.id === selected.id ? 0 : -1} onClick={() => selectTab(section.id)} onKeyDown={event => moveTab(event, index)}>{section.label}</button>)}
    </div>
    <div className="content-panel" ref={content} role="tabpanel" id={`guide-panel-${guide.id}`} aria-labelledby={`guide-tab-${guide.id}-${selected.id}`} tabIndex={0}>
      <div className="metadata" aria-label="Reference revision dates"><span className="metadata-item">Last Reviewed: {displayDate(guide.reviewedOn)}</span><span className="metadata-item">Last Updated: {displayDate(guide.updatedOn)}</span></div>
      <div className="content" dangerouslySetInnerHTML={{ __html: rendered }} />
    </div>
  </section>;
}

export default function ChronicleUiGuidePage() {
  const navigate = useNavigate();
  const { pageId } = useParams();
  const [search] = useSearchParams();
  const guides = useMemo(() => uiGuideCatalog.map(entry => {
    const guide = getUiGuide(entry.id);
    if (!guide) throw new Error(`Missing registered UI reference: ${entry.id}`);
    return guide;
  }), []);
  // Older per-region addresses still show this same complete page.
  const requestedRegion = search.get("section") ?? pageId ?? "story-builder";

  return <div className="chronicle-ui-guide">
    <AppShellHeader visible leftContent={<>
      {/* Exact BackButton / SectionTitle presentation from AppShellTopBar. */}
      <button type="button" onClick={() => navigate("/?tab=admin")} aria-label="Back" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
      </button>
      <h1 className="text-lg font-black text-[hsl(var(--ui-surface-2))] uppercase tracking-tight">Chronicle UI Guide</h1>
    </>} />
    <main className="page"><div className="page-inner">
      {guides.map(guide => <GuideReference key={guide.id} guide={guide} requestedTab={requestedRegion === guide.id ? search.get("tab") : null} onTabSelected={id => navigate({ pathname: "/style-guide/chronicle-ui-guide", search: `?${new URLSearchParams({ section: guide.id, tab: id })}` }, { replace: true })} />)}
    </div></main>
  </div>;
}
