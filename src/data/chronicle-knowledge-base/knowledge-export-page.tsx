import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { ChronicleKnowledgeBasePage } from "@/pages/style-guide/chronicle-knowledge-base";
import { chronicleOperationalRecordRegistry } from "./operational-record-sources";
import { chronicleKnowledgeSections } from "./manifest";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

/** Mount the actual page, not an export-specific reconstruction of its design. */
export async function captureKnowledgePage(): Promise<HTMLElement> {
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.inert = true;
  host.style.cssText = `position:fixed;left:-100000px;top:0;width:${document.documentElement.clientWidth || window.innerWidth}px;pointer-events:none;`;
  document.body.append(host);
  const root = createRoot(host, { identifierPrefix: "knowledge-export-" });
  try {
    root.render(<MemoryRouter initialEntries={["/style-guide/chronicle-knowledge-base"]}>
      <ChronicleKnowledgeBasePage exportAllTabs operationalRegistry={chronicleOperationalRecordRegistry} />
      <DropdownMenu open modal={false}>
        <DropdownMenuTrigger style={{ display: "none" }}>Download</DropdownMenuTrigger>
        <DropdownMenuContent data-export-menu="true" style={{ visibility: "hidden" }}
          onCloseAutoFocus={event => event.preventDefault()}>
          <DropdownMenuItem data-export-format="html">HTML</DropdownMenuItem>
          <DropdownMenuItem data-export-format="markdown">Markdown</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </MemoryRouter>);
    const expectedPanels = chronicleKnowledgeSections.reduce((count, section) => count + section.tabs.length, 0);
    const deadline = Date.now() + 30_000;
    // Effects load the same read-only graph/record views used by the live page.
    // Never serialize an unfinished loading placeholder as a completed export.
    while (true) {
      await new Promise(resolve => window.setTimeout(resolve, 50));
      const complete = host.querySelectorAll('.knowledge-content-panel[role="tabpanel"]').length === expectedPanels;
      if (complete && !host.querySelector('[aria-busy="true"], [data-changelog-status="loading"]')) break;
      if (Date.now() > deadline) throw new Error("The Knowledge Base is still loading. Please wait and try the HTML download again.");
    }
    const page = host.querySelector<HTMLElement>(".chronicle-knowledge-base-page")!;
    const copy = page.cloneNode(true) as HTMLElement;
    const menu = document.querySelector<HTMLElement>('[data-export-menu="true"]')?.cloneNode(true) as HTMLElement | undefined;
    const actions = copy.querySelector<HTMLElement>(".chronicle-knowledge-header-actions");
    if (!menu || !actions) throw new Error("The download controls could not be copied. Please retry the HTML download.");
    menu.id = "knowledge-export-download-menu";
    menu.hidden = true;
    menu.style.cssText = "position:absolute;right:0;top:calc(100% + 4px);";
    menu.removeAttribute("aria-labelledby");
    menu.removeAttribute("data-state");
    actions.style.position = "relative";
    actions.append(menu);
    const trigger = actions.querySelector<HTMLElement>(".chronicle-knowledge-download-button")!;
    trigger.setAttribute("aria-controls", menu.id);
    trigger.setAttribute("aria-expanded", "false");
    // Preserve the user's selected Knowledge Base tabs without changing them.
    for (const section of copy.querySelectorAll<HTMLElement>(".knowledge-switcher")) {
      const live = document.getElementById(section.id);
      const selectedId = live && !host.contains(live)
        ? live.querySelector('[role="tab"][aria-selected="true"]')?.id : undefined;
      if (!selectedId) continue;
      for (const tab of section.querySelectorAll<HTMLElement>('[role="tab"]')) {
        const selected = tab.id === selectedId;
        tab.setAttribute("aria-selected", String(selected));
        tab.tabIndex = selected ? 0 : -1;
        const panel = [...section.querySelectorAll<HTMLElement>('[role="tabpanel"]')]
          .find(candidate => candidate.id === tab.getAttribute("aria-controls"));
        if (panel) {
          panel.hidden = !selected;
          const livePanel = selected ? live?.querySelector<HTMLElement>('[role="tabpanel"]') : null;
          if (livePanel && !livePanel.querySelector('[aria-busy="true"], [data-changelog-status="loading"]')) {
            // Match expanded records, selected map state, and other visible
            // details already being inspected, not just their initial defaults.
            panel.replaceChildren(...[...livePanel.childNodes].map(node => node.cloneNode(true)));
          }
        }
      }
    }
    return copy;
  } finally {
    root.unmount();
    host.remove();
  }
}
