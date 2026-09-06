import { useEffect, useRef, type MouseEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  chronicleKnowledgeBaseManifest,
  getKnowledgeTabMarkdown,
  type KnowledgeTab,
} from "@/data/chronicle-knowledge-base/manifest";
import "./RoleplayPipelineDocument.css";

const section = chronicleKnowledgeBaseManifest.capabilities.find(
  (capability) => capability.id === "roleplay-pipeline",
)!;

/**
 * Render only the registered, checked-in manual's authored HTML. This is not
 * an HTML renderer for user input, imported documents, or network responses.
 * Keeping the prose in one canonical file preserves the approved mockup's
 * stage/branch hierarchy without a second independently maintained text copy.
 */
export function RoleplayPipelineDocument({ tab }: { tab: KnowledgeTab }) {
  const content = getKnowledgeTabMarkdown(section, tab);
  const root = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!location.hash) return;
    let anchor: string;
    try {
      anchor = decodeURIComponent(location.hash.slice(1));
    } catch {
      return;
    }
    const target = anchor === section.id
      ? root.current?.closest<HTMLElement>(`#${section.id}`)
      : Array.from(root.current?.querySelectorAll<HTMLElement>("[id]") ?? [])
        .find((element) => element.id === anchor);
    if (!target) return;
    // The shared tab panel resets its scroll in a parent effect. Position after
    // that reset, and once more if the graph above the manual finishes loading.
    let frame = requestAnimationFrame(() => target.scrollIntoView?.({ block: "start" }));
    const architecture = root.current?.closest(".knowledge-architecture-source");
    const observer = new MutationObserver(() => {
      if (architecture?.querySelector('.repository-graph-view[aria-busy="true"]')) return;
      observer.disconnect();
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => target.scrollIntoView?.({ block: "start" }));
    });
    if (architecture?.querySelector('.repository-graph-view[aria-busy="true"]')) {
      observer.observe(architecture, { childList: true, subtree: true, attributes: true, attributeFilter: ["aria-busy"] });
    }
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [content, location.hash, location.key]);

  function followInternalLink(event: MouseEvent<HTMLDivElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = (event.target as Element).closest<HTMLAnchorElement>("a[href]");
    const href = anchor?.getAttribute("href");
    if (!href?.startsWith("/style-guide/") || anchor?.target === "_blank") return;
    event.preventDefault();
    navigate(href);
  }

  return (
    <div
      ref={root}
      className="knowledge-roleplay-document"
      data-manual-source="docs/architecture-knowledge/roleplay-pipeline.md"
      onClick={followInternalLink}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
