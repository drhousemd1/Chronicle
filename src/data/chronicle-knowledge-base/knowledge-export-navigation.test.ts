// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { createRequire } from "node:module";
import { KNOWLEDGE_EXPORT_SCRIPT } from "./knowledge-export-navigation";

type TestDocument = { window: Window & typeof globalThis };
// The existing jsdom dependency has no installed TypeScript declarations.
// Keep this test-only boundary narrow without adding a package for the export.
const { JSDOM } = createRequire(import.meta.url)("jsdom") as {
  JSDOM: new (html: string, options: { url: string; runScripts: "outside-only" }) => TestDocument;
};
let fixture: TestDocument | undefined;

function section(id: string) {
  return `<section class="knowledge-switcher" id="${id}">
    <div class="knowledge-tab-rail" role="tablist">
      <button role="tab" id="${id}-overview-tab" aria-controls="${id}-overview" aria-selected="true" tabindex="0">Overview</button>
      <button role="tab" id="${id}-architecture-tab" aria-controls="${id}-architecture" aria-selected="false" tabindex="-1">App Architecture</button>
      <button role="tab" id="${id}-issues-tab" aria-controls="${id}-issues" aria-selected="false" tabindex="-1">Issues</button>
    </div>
    <section class="knowledge-content-panel" role="tabpanel" id="${id}-overview" aria-labelledby="${id}-overview-tab"><h1>Overview content</h1></section>
    <section class="knowledge-content-panel" role="tabpanel" id="${id}-architecture" aria-labelledby="${id}-architecture-tab"><h1 id="${id}-stage">Architecture content</h1></section>
    <section class="knowledge-content-panel" role="tabpanel" id="${id}-issues" aria-labelledby="${id}-issues-tab"><h1>Issues content</h1></section>
  </section>`;
}

function setup(hash = "", configure?: (window: Window & typeof globalThis) => void) {
  fixture = new JSDOM(`<!doctype html><html><head><meta name="exported-at" content="2026-09-05T12:00:00.000Z"></head><body><div id="knowledge-base-top"><header class="chronicle-knowledge-header"><button class="chronicle-knowledge-back">Back</button>Chronicle Knowledge Base
    <div class="chronicle-knowledge-header-actions"><button class="chronicle-knowledge-download-button" aria-busy="true" disabled>Download</button>
      <div id="knowledge-export-download-menu" data-export-menu hidden role="menu"><button role="menuitem" data-export-format="html">HTML</button><button role="menuitem" data-export-format="markdown">Markdown</button></div>
    </div></header></div>
    <a id="deep-link" href="#gallery-stage">Go to architecture</a>
    <a id="appendix-link" href="#source-record">Complete source</a>
    <a id="unknown-link" href="#missing">Unknown</a>
    <a id="external-link" href="https://example.invalid/#gallery-stage">External</a>
    <a id="new-tab-link" href="#gallery-stage" target="_blank">New tab</a>
    ${section("gallery")}${section("manual")}
    <aside id="source-appendix" data-export-sources="true" hidden><details id="sources"><summary>Source documents</summary><details id="source-detail"><summary>Record</summary><h2 id="source-record">Complete source text</h2></details></details></aside>
    <template id="knowledge-export-markdown"><pre># Chronicle fixture\n\nSaved source &amp; text.</pre></template>
    </body></html>`, { url: `https://offline.example/knowledge.html${hash}`, runScripts: "outside-only" });
  const { window } = fixture;
  const scroll = vi.fn();
  Object.defineProperty(window.HTMLElement.prototype, "scrollIntoView", { value: scroll, configurable: true });
  configure?.(window);
  // Execute only this constant trusted script in the isolated test document.
  window.eval(KNOWLEDGE_EXPORT_SCRIPT);
  window.document.dispatchEvent(new window.Event("DOMContentLoaded"));
  return { window, document: window.document, scroll };
}

function readBlob(window: Window & typeof globalThis, blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new window.FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

function fallbackSpies(window: Window & typeof globalThis) {
  const createObjectURL = vi.fn().mockReturnValue("blob:https://offline.example/saved-copy");
  const revokeObjectURL = vi.fn();
  Object.defineProperty(window.URL, "createObjectURL", { value: createObjectURL, configurable: true });
  Object.defineProperty(window.URL, "revokeObjectURL", { value: revokeObjectURL, configurable: true });
  const click = vi.spyOn(window.HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
  const alert = vi.spyOn(window, "alert").mockImplementation(() => undefined);
  return { createObjectURL, revokeObjectURL, click, alert };
}

afterEach(() => {
  fixture?.window.close();
  fixture = undefined;
});

describe("offline Knowledge Base navigation", () => {
  it("defaults each section to its first tab while retaining every inactive panel's content", () => {
    const { document } = setup();
    for (const id of ["gallery", "manual"]) {
      expect(document.getElementById(`${id}-overview`)!.hidden).toBe(false);
      expect(document.getElementById(`${id}-architecture`)!.hidden).toBe(true);
      expect(document.getElementById(`${id}-issues`)!.hidden).toBe(true);
      expect(document.getElementById(`${id}-architecture`)!.textContent).toContain("Architecture content");
      expect(document.querySelectorAll(`#${id} [aria-selected="true"]`)).toHaveLength(1);
    }
  });

  it("selects tabs by mouse only within their section and resets the newly shown panel", () => {
    const { document } = setup();
    const panel = document.getElementById("gallery-architecture")!;
    panel.scrollTop = 82;
    document.getElementById("gallery-architecture-tab")!.click();
    expect(panel.hidden).toBe(false);
    expect(panel.scrollTop).toBe(0);
    expect(document.getElementById("gallery-overview")!.hidden).toBe(true);
    expect(document.getElementById("gallery-architecture-tab")!.tabIndex).toBe(0);
    expect(document.getElementById("gallery-overview-tab")!.tabIndex).toBe(-1);
    expect(document.getElementById("manual-overview")!.hidden).toBe(false);
  });

  it("supports arrow wrapping, Home, End, and keyboard focus without intercepting unrelated keys", () => {
    const { window, document } = setup();
    const key = (id: string, value: string) => {
      const event = new window.KeyboardEvent("keydown", { key: value, bubbles: true, cancelable: true });
      document.getElementById(id)!.dispatchEvent(event);
      return event;
    };
    expect(key("gallery-overview-tab", "ArrowLeft").defaultPrevented).toBe(true);
    expect(document.activeElement?.id).toBe("gallery-issues-tab");
    key("gallery-issues-tab", "ArrowRight");
    expect(document.activeElement?.id).toBe("gallery-overview-tab");
    key("gallery-overview-tab", "End");
    expect(document.activeElement?.id).toBe("gallery-issues-tab");
    key("gallery-issues-tab", "Home");
    expect(document.activeElement?.id).toBe("gallery-overview-tab");
    expect(key("gallery-overview-tab", "Escape").defaultPrevented).toBe(false);
  });

  it("opens a deep-linked tab before scrolling and honors an initial deep link", () => {
    const { document, window, scroll } = setup("#manual-stage");
    expect(document.getElementById("manual-architecture")!.hidden).toBe(false);
    expect(scroll).toHaveBeenLastCalledWith({ block: "start" });
    document.getElementById("deep-link")!.click();
    expect(window.location.hash).toBe("#gallery-stage");
    expect(document.getElementById("gallery-architecture")!.hidden).toBe(false);
    expect(scroll.mock.contexts.at(-1)).toBe(document.getElementById("gallery-stage"));
    document.getElementById("gallery-overview-tab")!.click();
    document.getElementById("deep-link")!.click();
    expect(document.getElementById("gallery-architecture")!.hidden).toBe(false);
  });

  it("reveals hidden tab targets on hashchange and history navigation", () => {
    const { document, window } = setup();
    window.history.replaceState(null, "", "#gallery-stage");
    window.dispatchEvent(new window.HashChangeEvent("hashchange"));
    expect(document.getElementById("gallery-architecture")!.hidden).toBe(false);
    window.history.replaceState(null, "", "#manual-stage");
    window.dispatchEvent(new window.PopStateEvent("popstate"));
    expect(document.getElementById("manual-architecture")!.hidden).toBe(false);
  });

  it("opens all enclosing source disclosures before scrolling to a complete record", () => {
    const { document, scroll } = setup();
    expect(document.getElementById("source-appendix")!.hidden).toBe(true);
    document.getElementById("appendix-link")!.click();
    expect(document.getElementById("source-appendix")!.hidden).toBe(false);
    expect((document.getElementById("sources") as HTMLDetailsElement).open).toBe(true);
    expect((document.getElementById("source-detail") as HTMLDetailsElement).open).toBe(true);
    expect(scroll.mock.contexts.at(-1)).toBe(document.getElementById("source-record"));
  });

  it("makes the copied header back button return to this document's top without opening the app", () => {
    const { document, window, scroll } = setup("#gallery-stage");
    const previousUrl = window.location.href;
    document.querySelector<HTMLButtonElement>(".chronicle-knowledge-back")!.click();
    expect(scroll.mock.contexts.at(-1)).toBe(document.getElementById("knowledge-base-top"));
    expect(window.location.href).toBe(previousUrl);
  });

  it("leaves unknown hashes, external links, modified clicks, and new-tab links safe", () => {
    const { window, document } = setup();
    for (const hash of ["#missing", "#%E0%A4%A"]) {
      window.history.replaceState(null, "", hash);
      expect(() => window.dispatchEvent(new window.HashChangeEvent("hashchange"))).not.toThrow();
    }
    for (const [id, modifiers] of [["external-link", {}], ["new-tab-link", {}], ["deep-link", { metaKey: true }]] as const) {
      const event = new window.MouseEvent("click", { bubbles: true, cancelable: true, ...modifiers });
      // Avoid invoking jsdom's unrelated navigation default after inspecting ours.
      document.addEventListener("click", laterEvent => {
        expect(laterEvent.defaultPrevented).toBe(false);
        laterEvent.preventDefault();
      }, { once: true });
      document.getElementById(id)!.dispatchEvent(event);
    }
    expect(document.getElementById("gallery-overview")!.hidden).toBe(false);
    expect(document.getElementById("manual-overview")!.hidden).toBe(false);
  });

  it("opens the copied Download menu by mouse or keyboard and closes it with restored trigger focus", () => {
    const { window, document } = setup();
    const trigger = document.querySelector<HTMLButtonElement>(".chronicle-knowledge-download-button")!;
    const menu = document.querySelector<HTMLElement>("[data-export-menu]")!;
    const items = [...menu.querySelectorAll<HTMLElement>("[data-export-format]")];
    expect(trigger.disabled).toBe(false);
    expect(trigger.getAttribute("aria-busy")).toBe("false");
    trigger.click();
    expect(menu.hidden).toBe(false);
    expect(document.activeElement).toBe(items[0]);
    items[0].dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(items[1]);
    items[1].dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(items[0]);
    items[0].dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(items[1]);
    document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
    expect(menu.hidden).toBe(true);
    expect(document.activeElement).toBe(trigger);
    trigger.dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(items[1]);
    document.getElementById("gallery-stage")!.click();
    expect(menu.hidden).toBe(true);
    expect(document.activeElement).toBe(trigger);
  });

  it("downloads an HTML copy with the menu closed when no native picker is available", async () => {
    const { window, document } = setup();
    const spies = fallbackSpies(window);
    document.querySelector<HTMLButtonElement>(".chronicle-knowledge-download-button")!.click();
    document.querySelector<HTMLButtonElement>('[data-export-format="html"]')!.click();
    expect(spies.createObjectURL).toHaveBeenCalledOnce();
    const [blob] = spies.createObjectURL.mock.calls[0] as [Blob];
    expect(blob.type).toBe("text/html;charset=utf-8");
    const text = await readBlob(window, blob);
    expect(text.startsWith("<!DOCTYPE html>\n")).toBe(true);
    const copy = new window.DOMParser().parseFromString(text, "text/html");
    expect(copy.querySelector<HTMLElement>("[data-export-menu]")!.hidden).toBe(true);
    expect(copy.querySelector(".chronicle-knowledge-download-button")!.getAttribute("aria-expanded")).toBe("false");
    expect(copy.getElementById("source-record")?.textContent).toBe("Complete source text");
    expect((spies.click.mock.contexts[0] as HTMLAnchorElement).download).toBe("chronicle-knowledge-base-2026-09-05T12-00-00-000Z.html");
    expect(document.querySelector("a[download]")).toBeNull();
    expect(spies.revokeObjectURL).not.toHaveBeenCalled();
    expect(spies.alert).not.toHaveBeenCalled();
  });

  it("downloads the exact embedded Markdown through keyboard selection without fetching or HTML conversion", async () => {
    const { window, document } = setup();
    const spies = fallbackSpies(window);
    const fetch = vi.fn();
    Object.defineProperty(window, "fetch", { value: fetch, configurable: true });
    document.querySelector<HTMLButtonElement>(".chronicle-knowledge-download-button")!.click();
    document.querySelector<HTMLButtonElement>('[data-export-format="markdown"]')!.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
    const [blob] = spies.createObjectURL.mock.calls[0] as [Blob];
    expect(blob.type).toBe("text/markdown;charset=utf-8");
    expect(await readBlob(window, blob)).toBe("# Chronicle fixture\n\nSaved source & text.");
    expect((spies.click.mock.contexts[0] as HTMLAnchorElement).download).toMatch(/\.md$/);
    expect(fetch).not.toHaveBeenCalled();
    expect(spies.alert).not.toHaveBeenCalled();
  });

  it("requests native Save As before serializing HTML and writes the chosen file once", async () => {
    let accept!: (value: unknown) => void;
    const selection = new Promise(resolve => { accept = resolve; });
    const picker = vi.fn().mockReturnValue(selection);
    const { window, document } = setup("", target => {
      Object.defineProperty(target, "showSaveFilePicker", { value: picker, configurable: true });
    });
    const spies = fallbackSpies(window);
    const serialize = vi.spyOn(document.documentElement, "outerHTML", "get");
    document.querySelector<HTMLButtonElement>(".chronicle-knowledge-download-button")!.click();
    document.querySelector<HTMLButtonElement>('[data-export-format="html"]')!.click();
    expect(picker).toHaveBeenCalledOnce();
    expect(picker.mock.calls[0][0].types[0].accept).toEqual({ "text/html": [".html"] });
    expect(serialize).not.toHaveBeenCalled();
    const writable = { write: vi.fn().mockResolvedValue(undefined), close: vi.fn().mockResolvedValue(undefined) };
    const createWritable = vi.fn().mockResolvedValue(writable);
    accept({ createWritable });
    await vi.waitFor(() => expect(writable.close).toHaveBeenCalledOnce());
    expect(serialize).toHaveBeenCalledOnce();
    expect(writable.write).toHaveBeenCalledOnce();
    expect(await readBlob(window, writable.write.mock.calls[0][0])).toContain("Chronicle Knowledge Base");
    expect(spies.createObjectURL).not.toHaveBeenCalled();
    expect(spies.alert).not.toHaveBeenCalled();
  });

  it("treats native Save As cancellation as cancellation without a fallback download or error", async () => {
    const picker = vi.fn().mockRejectedValue(new DOMException("Cancelled", "AbortError"));
    const { window, document } = setup("", target => {
      Object.defineProperty(target, "showSaveFilePicker", { value: picker, configurable: true });
    });
    const spies = fallbackSpies(window);
    document.querySelector<HTMLButtonElement>(".chronicle-knowledge-download-button")!.click();
    document.querySelector<HTMLButtonElement>('[data-export-format="markdown"]')!.click();
    await Promise.resolve();
    await Promise.resolve();
    expect(document.querySelector<HTMLElement>("[data-export-menu]")!.hidden).toBe(true);
    expect(spies.createObjectURL).not.toHaveBeenCalled();
    expect(spies.alert).not.toHaveBeenCalled();
  });

  it("reports a native write failure and aborts the unfinished write without claiming success", async () => {
    const writable = { write: vi.fn().mockRejectedValue(new Error("Disk write failed")), close: vi.fn(), abort: vi.fn().mockResolvedValue(undefined) };
    const picker = vi.fn().mockResolvedValue({ createWritable: vi.fn().mockResolvedValue(writable) });
    const { window, document } = setup("", target => {
      Object.defineProperty(target, "showSaveFilePicker", { value: picker, configurable: true });
    });
    const spies = fallbackSpies(window);
    document.querySelector<HTMLButtonElement>(".chronicle-knowledge-download-button")!.click();
    document.querySelector<HTMLButtonElement>('[data-export-format="html"]')!.click();
    await vi.waitFor(() => expect(spies.alert).toHaveBeenCalledOnce());
    expect(writable.abort).toHaveBeenCalledOnce();
    expect(writable.close).not.toHaveBeenCalled();
    expect(spies.alert.mock.calls[0][0]).toContain("Disk write failed");
    expect(spies.createObjectURL).not.toHaveBeenCalled();
  });
});
