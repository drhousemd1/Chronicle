// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { chronicleKnowledgeBaseManifest, getKnowledgeTabMarkdown } from "@/data/chronicle-knowledge-base/manifest";
import ChronicleKnowledgeBasePage from "./chronicle-knowledge-base";

vi.mock("@/components/admin/knowledge-base/RepositoryGraphView", () => ({
  RepositoryGraphView: ({ capabilityId }: { capabilityId: string }) => (
    <div data-testid={`graph-${capabilityId}`}>Shared graph preview</div>
  ),
}));

const section = chronicleKnowledgeBaseManifest.capabilities.find((item) => item.id === "roleplay-pipeline")!;
const stageIds = [
  "pipeline-stage-begin-turn", "pipeline-stage-assemble-request",
  "pipeline-stage-generate-narrative", "pipeline-stage-accept-save", "pipeline-stage-extract-update",
];

function renderPipeline(tab = "app-architecture") {
  render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={[`/style-guide/chronicle-knowledge-base?section=roleplay-pipeline&tab=${tab}`]}>
    <ChronicleKnowledgeBasePage />
  </MemoryRouter>);
  return document.getElementById("roleplay-pipeline")!;
}

describe("Approved Roleplay Pipeline manual transfer", () => {
  it("keeps its five remaining tabs and uses real records instead of mockup specimens", () => {
    expect(section.tabs.map(({ id, contentKind }) => [id, contentKind])).toEqual([
      ["overview", "markdown-section"], ["app-architecture", "markdown-section"],
      ["issues", "issue-records"],
      ["supabase-tables", "markdown-section"], ["changelog", "changelog-records"],
    ]);
  });

  it("renders the complete canonical architecture below the shared capability graph", () => {
    const root = renderPipeline();
    const manual = root.querySelector<HTMLElement>(".knowledge-roleplay-document")!;
    const expected = document.createElement("div");
    expected.innerHTML = getKnowledgeTabMarkdown(section, section.tabs[1]);
    expect(manual.innerHTML).toBe(expected.innerHTML);
    expect(manual).toHaveAttribute("data-manual-source", "docs/architecture-knowledge/roleplay-pipeline.md");
    expect(within(root).getByTestId("graph-roleplay-pipeline").compareDocumentPosition(manual) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(Array.from(manual.querySelectorAll(".pipeline-stage"), (stage) => stage.id)).toEqual(stageIds);
    expect(within(manual).getByRole("heading", { name: "Send" })).toBeInTheDocument();
    expect(within(manual).getByRole("heading", { name: "Retry" })).toBeInTheDocument();
    expect(within(manual).getByRole("heading", { name: "Continue" })).toBeInTheDocument();
    expect(manual.querySelector("#pipeline-later-turn-feedback")).toBeInTheDocument();
    expect(manual.textContent).not.toMatch(/Pipeline Source Paths|Change impact|Focused tests|Source owners and handoffs/);
  });

  it("opens the architecture from an Overview stage link and scrolls to that stage", async () => {
    const scroll = vi.fn();
    const prior = HTMLElement.prototype.scrollIntoView;
    HTMLElement.prototype.scrollIntoView = scroll;
    try {
      const root = renderPipeline("overview");
      fireEvent.click(within(root).getByRole("link", { name: /Stage 3.*Generate narrative/ }));
      expect(within(root).getByRole("tab", { name: "App Architecture" })).toHaveAttribute("aria-selected", "true");
      expect(root.querySelector("#pipeline-stage-generate-narrative")).toBeInTheDocument();
      await waitFor(() => expect(scroll).toHaveBeenCalled());
      fireEvent.click(within(root).getByRole("tab", { name: "Supabase Tables" }));
      expect(within(root).getByRole("heading", { name: "Roleplay Pipeline Supabase Tables" })).toBeInTheDocument();
      expect(root.querySelector(".knowledge-roleplay-document table")).toBeInTheDocument();
    } finally {
      HTMLElement.prototype.scrollIntoView = prior;
    }
  });

  it("keeps the authored HTML passive, its jump targets resolvable, and narrow table labels complete", () => {
    const all = document.createElement("div");
    all.innerHTML = section.tabs.map((tab) => getKnowledgeTabMarkdown(section, tab)).join("\n");
    expect(all.querySelector("script,style,iframe,object,embed,form")).toBeNull();
    expect(all.querySelector(".rp-specimen")).toBeNull();
    const ids = Array.from(all.querySelectorAll("[id]"), (node) => node.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const node of all.querySelectorAll("*")) {
      expect(Array.from(node.attributes).some(({ name }) => /^on/i.test(name))).toBe(false);
    }
    for (const link of all.querySelectorAll<HTMLAnchorElement>("a[href]")) {
      const href = link.getAttribute("href")!;
      expect(href).not.toMatch(/^(javascript:|data:|file:)/i);
      if (href.includes("section=roleplay-pipeline") && href.includes("#")) {
        expect(ids).toContain(href.split("#")[1]);
      }
    }
    for (const cell of all.querySelectorAll("td")) expect(cell.getAttribute("data-label")).toBeTruthy();
  });
});
