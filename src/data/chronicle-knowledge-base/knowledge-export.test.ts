// @vitest-environment jsdom
import { createHash } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { marked } from "marked";
import { chronicleKnowledgeSections, getKnowledgeDocumentSource } from "./manifest";
import { chronicleOperationalRecordSources } from "./operational-record-sources";
import { KNOWLEDGE_EXPORT_SCRIPT } from "./knowledge-export-navigation";
import skillCatalog from "./codex-skills.generated.json";
import { buildKnowledgeHtml, buildKnowledgeMarkdown, createKnowledgeSnapshot, type KnowledgeSnapshot } from "./knowledge-export";

const origin = "http://127.0.0.1:8080";
const images = {
  "knowledge-asset:admin-panel-overview": "data:image/png;base64,YQ==",
  "knowledge-asset:community-gallery-overview": "data:image/png;base64,Yg==",
};
const snapshot = createKnowledgeSnapshot(new Date("2026-09-05T12:00:00Z"));
const offlineFetch = vi.fn().mockRejectedValue(new Error("Offline export test: private graph unavailable."));
const normalizedText = (node: Node) => (node.textContent ?? "").replace(/\s+/g, " ").trim();
let html: string;
let markdown: string;
let exported: Document;

beforeAll(async () => {
  // Real page components must settle honestly when the private graph is absent;
  // provided image bytes keep this fixture independent of all network access.
  vi.stubGlobal("fetch", offlineFetch);
  html = await buildKnowledgeHtml(snapshot, origin, images);
  markdown = await buildKnowledgeMarkdown(snapshot, origin);
  exported = new DOMParser().parseFromString(html, "text/html");
}, 30_000);

afterAll(() => vi.unstubAllGlobals());

describe("complete Knowledge Base downloads", () => {
  it("copies the actual Knowledge Base header and every section's tabbed reading surface", () => {
    const page = exported.getElementById("knowledge-base-top")!;
    expect(page.matches(".chronicle-knowledge-base-page")).toBe(true);
    expect(page.querySelector(".chronicle-knowledge-header h1")?.textContent).toBe("Chronicle Knowledge Base");
    expect(page.querySelector(".chronicle-knowledge-back")).not.toBeNull();
    expect(page.querySelector(".chronicle-knowledge-download-button")).not.toBeNull();
    expect(page.querySelectorAll(".knowledge-switcher")).toHaveLength(chronicleKnowledgeSections.length + 1);
    const skills = page.querySelector("#codex-skills-for-chronicle")!;
    expect(skills.previousElementSibling?.id).toBe("chronicle-overview");
    expect(skills.nextElementSibling?.id).toBe("community-gallery");
    expect(skills.querySelector(".knowledge-section-title")?.textContent).toBe("Codex Skills for Chronicle");
    expect(skills.querySelectorAll('[role="tab"]')).toHaveLength(skillCatalog.entries.length);
    expect(skills.querySelectorAll('[data-skill-id]')).toHaveLength(skillCatalog.entries.length);
    expect(page.querySelector(".chronicle-knowledge-main > .knowledge-switcher")?.id).toBe("chronicle-overview");
    expect(page.querySelector(".export-summary, .export-document")).toBeNull();
    expect(page.querySelector('[role="tab"][id$="-tab-current-work"]')).toBeNull();
    expect(page.querySelector("[data-current-work-id]")).toBeNull();
    expect(snapshot.documents.some(doc => doc.path.startsWith("docs/current-work/active/"))).toBe(false);

    for (const section of chronicleKnowledgeSections) {
      const surface = page.querySelector<HTMLElement>(`#${section.id}`)!;
      expect(surface.querySelector(".knowledge-section-title")?.textContent).toBe(section.label);
      expect(surface.querySelector(".knowledge-section-description")?.textContent).toBe(section.description);
      const rail = surface.querySelector('[role="tablist"].knowledge-tab-rail')!;
      expect(rail.querySelectorAll('[role="tab"]')).toHaveLength(section.tabs.length);
      expect(surface.querySelectorAll('.knowledge-content-panel[role="tabpanel"]')).toHaveLength(section.tabs.length);
      for (const tab of section.tabs) {
        const control = exported.getElementById(`${section.id}-tab-${tab.id}`)!;
        expect(control.textContent).toContain(tab.label);
        const panel = exported.getElementById(control.getAttribute("aria-controls")!)!;
        expect(panel).not.toBeNull();
        expect(panel.getAttribute("aria-labelledby")).toBe(control.id);
        expect(panel.querySelector("article.knowledge-content")).not.toBeNull();
        const recordTab = tab.contentKind.endsWith("-records") || tab.contentKind === "shared-records";
        expect(panel.querySelectorAll(".knowledge-metadata-pill")).toHaveLength(recordTab ? 0 : 2);
      }
    }
    expect(page.querySelector('[aria-busy="true"], [data-changelog-status="loading"]')).toBeNull();
    expect(page.textContent).toContain("Local map could not be loaded");
  });

  it("retains every complete canonical source once in the hidden source appendix", () => {
    const appendix = exported.querySelector<HTMLElement>("#knowledge-export-sources[data-export-sources]")!;
    expect(appendix.hidden).toBe(true);
    expect(new Set(snapshot.documents.map(doc => doc.path)).size).toBe(snapshot.documents.length);
    expect(appendix.querySelectorAll("[data-source-path]")).toHaveLength(snapshot.documents.length);
    for (const doc of snapshot.documents) {
      const sourceCopy = appendix.querySelector<HTMLElement>(`#export-${doc.id}`)!;
      expect(sourceCopy).not.toBeNull();
      expect(sourceCopy.dataset.sourcePath).toBe(doc.path);
      expect(sourceCopy.querySelector(".knowledge-content-panel article.knowledge-content")).not.toBeNull();
      expect(markdown).toContain(doc.path);
    }
    for (const section of chronicleKnowledgeSections) {
      const doc = snapshot.documents.find(doc => doc.path === `docs/architecture-knowledge/${section.document}`)!;
      expect(doc.source).toBe(getKnowledgeDocumentSource(section.document!));
    }
    for (const [path, source] of Object.entries(chronicleOperationalRecordSources)) {
      expect(snapshot.documents.filter(doc => doc.path === path)).toHaveLength(1);
      expect(snapshot.documents.find(doc => doc.path === path)?.source).toBe(source);
    }
  });

  it("preserves pipeline prose and tables in real tabs", () => {
    const source = getKnowledgeDocumentSource("roleplay-pipeline.md");
    // This canonical document intentionally contains authored HTML. Passing it
    // through Markdown first would turn indented HTML into code and hide loss.
    const original = new DOMParser().parseFromString(source, "text/html");
    const pipelineViews = [...exported.querySelectorAll("#roleplay-pipeline .knowledge-roleplay-document")];
    const pipelineText = pipelineViews.map(normalizedText).join(" ");
    const pipelineIndex = snapshot.documents.findIndex(doc => doc.id === "roleplay-pipeline");
    const pipelineMarkdown = markdown.slice(
      markdown.indexOf('<a id="roleplay-pipeline"></a>'),
      markdown.indexOf(`<a id="${snapshot.documents[pipelineIndex + 1].id}"></a>`),
    );
    const markdownDocument = new DOMParser().parseFromString(marked.parse(pipelineMarkdown, { async: false }), "text/html");
    const markdownText = normalizedText(markdownDocument.body);
    for (const paragraph of original.querySelectorAll("p,th,td")) {
      const text = normalizedText(paragraph);
      if (!text) continue;
      expect(pipelineText.includes(text), `Missing pipeline paragraph: ${text}`).toBe(true);
      expect(markdownText.includes(text), `Missing Markdown paragraph: ${text}`).toBe(true);
    }
    expect(pipelineViews.reduce((count, view) => count + view.querySelectorAll("table").length, 0)).toBe(original.querySelectorAll("table").length);
    expect(markdownDocument.querySelectorAll("table").length).toBe(original.querySelectorAll("table").length);
    expect(pipelineText).toContain("buildNormalSendResponseJob");
    expect(exported.getElementById("chronicle-work-manual")).toBeNull();
    expect(snapshot.documents.some(doc => doc.path.endsWith("/chronicle-work-manual.md"))).toBe(false);
  });

  it("has unique identities and resolved internal navigation and accessibility references", () => {
    for (const content of [html, marked.parse(markdown, { async: false })]) {
      const parsed = new DOMParser().parseFromString(content, "text/html");
      const ids = [...parsed.querySelectorAll("[id]")].map(element => element.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const link of parsed.querySelectorAll('a[href^="#"]')) {
        let id: string;
        try { id = decodeURIComponent(link.getAttribute("href")!.slice(1)); }
        catch { id = link.getAttribute("href")!.slice(1); }
        expect(parsed.getElementById(id), link.outerHTML).not.toBeNull();
      }
      for (const element of parsed.querySelectorAll("[aria-labelledby],[aria-describedby],[aria-controls]")) {
        for (const attribute of ["aria-labelledby", "aria-describedby", "aria-controls"]) {
          for (const id of (element.getAttribute(attribute) ?? "").split(/\s+/).filter(Boolean)) {
            expect(parsed.getElementById(id), `${attribute}=${id}`).not.toBeNull();
          }
        }
      }
      expect(parsed.querySelectorAll('a[href^="/style-guide/"]')).toHaveLength(0);
    }
  });

  it("embeds all visible and appendix images and permits only the trusted offline script", () => {
    const visibleImages = [...exported.querySelectorAll<HTMLImageElement>("#knowledge-base-top img")];
    expect(visibleImages).toHaveLength(Object.keys(images).length);
    for (const image of exported.querySelectorAll<HTMLImageElement>("img")) {
      expect(Object.values(images)).toContain(image.getAttribute("src"));
    }
    expect(markdown).not.toContain("base64,");
    expect(markdown).toContain("included in the HTML download");
    const scripts = [...exported.querySelectorAll("script")];
    expect(scripts).toHaveLength(1);
    expect(scripts[0].textContent).toBe(KNOWLEDGE_EXPORT_SCRIPT);
    expect(scripts[0].hasAttribute("src")).toBe(false);
    const scriptHash = createHash("sha256").update(KNOWLEDGE_EXPORT_SCRIPT).digest("base64");
    const policy = exported.querySelector('meta[http-equiv="Content-Security-Policy"]')!.getAttribute("content")!;
    expect(policy).toContain("default-src 'none'");
    expect(policy).toContain(`script-src 'sha256-${scriptHash}'`);
    expect(exported.querySelectorAll("iframe,object,embed,link[rel=stylesheet]")).toHaveLength(0);
    expect(exported.querySelector('meta[name="exported-at"]')?.getAttribute("content")).toBe(snapshot.generatedAt);
  });

  it("removes source-provided executable markup without dropping the source's ordinary text", async () => {
    const fixture: KnowledgeSnapshot = {
      ...snapshot,
      sections: [],
      documents: [{ id: "safe", title: "A <title>", path: "docs/safe.md", source: '<h1>Safe</h1><p onclick="alert(1)">Keep this text.</p><script>alert(1)</script><a href="javascript:alert(1)">Unsafe link</a><img src="https://external.invalid/tracker.png" onerror="alert(1)" alt="Reference">' }],
    };
    const result = new DOMParser().parseFromString(await buildKnowledgeHtml(fixture, origin, images), "text/html");
    expect(result.querySelectorAll("script")).toHaveLength(1);
    expect(result.querySelector("script")!.textContent).toBe(KNOWLEDGE_EXPORT_SCRIPT);
    expect(result.querySelectorAll("[onclick],[onerror],a[href^='javascript:'],img[src^='https:']")).toHaveLength(0);
    const retained = result.getElementById("export-safe")!;
    expect(retained.textContent).toContain("Keep this text.");
    expect(retained.textContent).toContain("A <title>");
  }, 30_000);

  it("reports an image-load failure instead of silently producing an incomplete HTML file", async () => {
    offlineFetch.mockResolvedValueOnce({ ok: false });
    await expect(buildKnowledgeHtml(snapshot, origin)).rejects.toThrow("reference image could not be loaded");
  });
});
