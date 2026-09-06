// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import fs from "node:fs";
import path from "node:path";
import { cleanup, fireEvent, render, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ADMIN_TOOL_SECTION_IDS } from "@/data/chronicle-knowledge-base/admin-tool-ids";
import { isChronicleCapabilityId } from "@/data/chronicle-knowledge-base/capability-ids";
import {
  chronicleAdminToolSections,
  chronicleKnowledgeSections,
  chronicleWorkManualSection,
  getKnowledgeDocumentSource,
  getKnowledgeTabMarkdown,
  parseKnowledgeDocument,
} from "@/data/chronicle-knowledge-base/manifest";
import { buildKnowledgeBaseTabHref } from "@/data/chronicle-knowledge-base/knowledge-routes";
import { loadRepositoryGraphCorpusPolicy, repositoryGraphPolicyAllowsPath } from "../../../scripts/chronicle-repository-graph/corpus";
import ChronicleKnowledgeBasePage from "./chronicle-knowledge-base";

vi.mock("@/components/admin/knowledge-base/RepositoryGraphView", () => ({
  RepositoryGraphView: ({ capabilityId }: { capabilityId: string | null }) => <div data-testid={`graph-${capabilityId ?? "global"}`}>Repository graph</div>,
}));
afterEach(cleanup);

function renderPage(href = "/style-guide/chronicle-knowledge-base") {
  return render(<MemoryRouter initialEntries={[href]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><ChronicleKnowledgeBasePage /></MemoryRouter>);
}

describe("Administration and Maintenance manuals", () => {
  it("registers all eight complete manuals without creating operational capabilities", () => {
    expect(chronicleAdminToolSections.map(({ id }) => id)).toEqual(ADMIN_TOOL_SECTION_IDS);
    for (const section of chronicleAdminToolSections) {
      expect(isChronicleCapabilityId(section.id)).toBe(false);
      expect(section.tabs.map(({ label }) => label)).toEqual(["Overview", "UI Elements and Functions", "App Architecture", "Issues", "Current Work", "Supabase Tables", "Changelog"]);
      expect(parseKnowledgeDocument(getKnowledgeDocumentSource(section.document!)).headings).toEqual(["Overview", "UI Elements and Functions", "App Architecture", "Supabase Tables"]);
      for (const link of getKnowledgeDocumentSource(section.document!).matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
        const url = new URL(link[1], "http://localhost/style-guide/chronicle-knowledge-base");
        if (url.pathname !== "/style-guide/chronicle-knowledge-base" || !url.searchParams.has("section")) continue;
        const target = chronicleKnowledgeSections.find(({ id }) => id === url.searchParams.get("section"));
        expect(target, `${section.id}: ${link[1]}`).toBeDefined();
        if (url.searchParams.has("tab")) expect(target!.tabs.some(({ id }) => id === url.searchParams.get("tab")), link[1]).toBe(true);
      }
      for (const tab of section.tabs) {
        if (["issues", "current-work", "changelog"].includes(tab.id)) {
          expect(tab.contentKind).toBe("shared-records");
          expect(tab.openIssueCount).toBeUndefined();
        } else {
          expect(getKnowledgeTabMarkdown(section, tab).trim().length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("renders every manual heading in all content tabs and puts its graph before architecture prose", () => {
    renderPage();
    for (const section of chronicleAdminToolSections) {
      const element = document.getElementById(section.id)!;
      expect(element).not.toBeNull();
      for (const tab of section.tabs.filter(({ contentKind }) => contentKind === "markdown-section")) {
        fireEvent.click(within(element).getByRole("tab", { name: tab.label }));
        const panel = within(element).getByRole("tabpanel");
        for (const match of getKnowledgeTabMarkdown(section, tab).matchAll(/^## (.+)$/gm)) {
          expect(within(panel).getByRole("heading", { name: match[1] })).toBeInTheDocument();
        }
        if (tab.id === "app-architecture") {
          const graph = within(panel).getByTestId(`graph-${section.id}`);
          const manual = panel.querySelector(".knowledge-architecture-source__manual")!;
          expect(graph.compareDocumentPosition(manual) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        }
      }
    }
  }, 30_000);

  it("opens an administrative architecture deep link and keeps every tool in the standard section layout", () => {
    renderPage(buildKnowledgeBaseTabHref("research-development", "app-architecture"));
    const section = document.getElementById("research-development")!;
    expect(within(section).getByRole("tab", { name: "App Architecture" })).toHaveAttribute("aria-selected", "true");
    expect(within(section).getByTestId("graph-research-development")).toBeInTheDocument();
    expect(document.querySelector(".knowledge-admin-tools-directory")).not.toBeInTheDocument();
    expect(document.getElementById("administration-maintenance-heading")).not.toBeInTheDocument();
    const gallery = document.getElementById("community-gallery")!;
    for (const tool of chronicleAdminToolSections) {
      const element = document.getElementById(tool.id)!;
      expect(element.className).toBe(gallery.className);
      expect(element.parentElement).toBe(gallery.parentElement);
      expect(element.previousElementSibling).toHaveClass("knowledge-switcher");
      expect(element.querySelector(".knowledge-section-title")).toHaveTextContent(tool.label);
      expect(within(element).getByRole("tablist")).toHaveClass("knowledge-tab-rail");
      expect(within(element).getAllByRole("tab")).toHaveLength(7);
      expect(within(element).getByRole("tabpanel")).toHaveClass("knowledge-content-panel");
    }
  });

  it("links shared records to their real destinations instead of claiming empty tool registries", () => {
    renderPage();
    for (const section of chronicleAdminToolSections) {
      const element = document.getElementById(section.id)!;
      fireEvent.click(within(element).getByRole("tab", { name: "Issues" }));
      expect(within(element).getByRole("link", { name: "Open Admin Panel Issues" })).toHaveAttribute("href", buildKnowledgeBaseTabHref("admin", "issues"));
      fireEvent.click(within(element).getByRole("tab", { name: "Current Work" }));
      expect(within(element).getByRole("link", { name: "Open Admin Panel Current Work" })).toHaveAttribute("href", buildKnowledgeBaseTabHref("admin", "current-work"));
      const manualLink = within(element).getByRole("link", { name: "Work Manual’s record rules" }).getAttribute("href")!;
      expect(chronicleWorkManualSection.tabs.some(({ id }) => id === new URL(manualLink, "http://localhost").searchParams.get("tab"))).toBe(true);
      fireEvent.click(within(element).getByRole("tab", { name: "Changelog" }));
      expect(within(element).getByRole("link", { name: "Open the canonical Changelog" })).toHaveAttribute("href", "/style-guide/ui-audit?view=changelog");
    }
  }, 30_000);

  it("maps each source-backed lens while keeping R&D prototype code and artifacts outside the private production graph", async () => {
    const root = process.cwd();
    const { policy } = await loadRepositoryGraphCorpusPolicy(root);
    const lenses = JSON.parse(fs.readFileSync(path.join(root, "config/chronicle-repository-graph-lenses.json"), "utf8"));
    for (const section of chronicleAdminToolSections) {
      const lens = lenses.capabilities.find((entry: { capability_id: string }) => entry.capability_id === section.id);
      expect(lens?.manual_path).toBe(`docs/architecture-knowledge/${section.document}`);
      const source = getKnowledgeTabMarkdown(section, section.tabs.find(({ id }) => id === "app-architecture")!);
      const paths = source.match(/### Inspected Source Paths\s+```text\n([\s\S]+?)\n```/)?.[1].split("\n");
      expect(paths?.length).toBeGreaterThan(0);
      for (const entry of paths ?? []) expect(fs.existsSync(path.join(root, entry)), entry).toBe(true);
      expect(repositoryGraphPolicyAllowsPath(lens.manual_path, policy)).toBe(true);
    }
    expect(repositoryGraphPolicyAllowsPath("src/components/admin/research-development/ResearchDevelopmentTool.tsx", policy)).toBe(true);
    expect(repositoryGraphPolicyAllowsPath("src/components/admin/research-development/prototypes/graphify-chronicle-map/GraphifyChronicleMapPreview.tsx", policy)).toBe(false);
    expect(repositoryGraphPolicyAllowsPath("docs/research-development/generated/graphify/graph.json", policy)).toBe(false);
    expect(repositoryGraphPolicyAllowsPath("docs/research-development/mockups/example/mockup.json", policy)).toBe(false);
  });
});
