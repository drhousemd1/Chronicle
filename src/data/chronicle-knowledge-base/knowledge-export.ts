import { marked } from "marked";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";
import baseStyles from "@/index.css?inline";
import changelogStyles from "@/components/admin/knowledge-base/changelog-record-list.css?inline";
import adminOverview from "@/assets/architecture-knowledge-hub/admin-panel-overview.png";
import galleryOverview from "@/assets/architecture-knowledge-hub/community-gallery-overview.png";
import pageStyles from "@/pages/style-guide/chronicle-knowledge-base.css?inline";
import pipelineStyles from "@/components/admin/knowledge-base/RoleplayPipelineDocument.css?inline";
import {
  chronicleKnowledgeBaseManifest,
  chronicleKnowledgeSections,
  getKnowledgeDocumentSource,
  type KnowledgeSection,
} from "./manifest";
import { chronicleOperationalRecordSources } from "./operational-record-sources";
import { sha256HexSync } from "./changelog-record-contract";
import { KNOWLEDGE_EXPORT_SCRIPT } from "./knowledge-export-navigation";
import { knowledgeFileDetails, type KnowledgeExportFormat } from "@/components/admin/knowledge-base/knowledge-file-save";

type ExportDocument = { id: string; title: string; path: string; source: string };
export type KnowledgeSnapshot = {
  generatedAt: string;
  reviewedRevision: string;
  sections: readonly KnowledgeSection[];
  documents: ExportDocument[];
};

export const EXPORT_SCOPE = "This is a read-only snapshot of all registered Knowledge Base manuals, the shared table reference, and repository Issue, historical work, and Changelog documents. It includes content from inactive tabs. Interactive Graphify maps, live application/database data, and the contents of separately linked tools or external files are not included. This download is a reference copy, not a new editable authority. Review private material before sharing it.";

const assets: Record<string, string> = {
  "knowledge-asset:admin-panel-overview": adminOverview,
  "knowledge-asset:community-gallery-overview": galleryOverview,
};

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[char]!);
const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/[\s-]+/g, "-");
const sourceId = (path: string) => `source-${slug(path)}`;

export function createKnowledgeSnapshot(now = new Date()): KnowledgeSnapshot {
  const documents = new Map<string, ExportDocument>();
  for (const section of chronicleKnowledgeSections) {
    if (!section.document) continue;
    const path = `docs/architecture-knowledge/${section.document}`;
    if (!documents.has(path)) documents.set(path, {
      id: section.id, title: section.label, path,
      source: getKnowledgeDocumentSource(section.document),
    });
  }
  const sharedName = chronicleKnowledgeBaseManifest.sharedDocuments.supabase;
  const sharedPath = `docs/architecture-knowledge/${sharedName}`;
  if (!documents.has(sharedPath)) documents.set(sharedPath, {
    id: "shared-table-reference", title: "Shared Supabase Table Reference",
    path: sharedPath, source: getKnowledgeDocumentSource(sharedName),
  });
  for (const [path, source] of Object.entries(chronicleOperationalRecordSources).sort(([a], [b]) => a.localeCompare(b))) {
    documents.set(path, { id: sourceId(path), title: path.split("/").at(-1)!.replace(/\.md$/, ""), path, source });
  }
  return {
    generatedAt: now.toISOString(),
    reviewedRevision: chronicleKnowledgeBaseManifest.reviewedCommit,
    sections: chronicleKnowledgeSections,
    documents: [...documents.values()],
  };
}

function displaySource(source: string) {
  // Retain frontmatter as readable metadata instead of treating YAML as prose.
  return source.replace(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/, (_, yaml: string) => `\n\n\`\`\`yaml\n${yaml}\n\`\`\`\n\n`);
}

function recordGroup(path: string) {
  if (path.includes("/issues/")) return "issues";
  if (path.includes("/current-work/")) return "historical-work";
  if (path.includes("/changelog/")) return "changelog";
  return null;
}

function tabTarget(section: KnowledgeSection, tabId: string, snapshot: KnowledgeSnapshot) {
  const tab = section.tabs.find(tab => tab.id === tabId);
  const doc = snapshot.documents.find(doc => doc.path === `docs/architecture-knowledge/${section.document}`);
  if (!tab || !doc) return doc?.id ?? "contents";
  if (tab.contentKind === "shared-supabase") return "shared-table-reference";
  if (tab.contentKind === "shared-records" || tab.contentKind.endsWith("-records")) return `records-${tab.id}`;
  const heading = tab.heading;
  return heading ? `${doc.id}--${slug(heading)}` : doc.id;
}

function localLink(href: string, doc: ExportDocument, snapshot: KnowledgeSnapshot, origin: string) {
  if (href.startsWith("#")) return `#${doc.id}--${href.slice(1)}`;
  let url: URL;
  try { url = new URL(href, `${origin}/${doc.path}`); } catch { return ""; }
  if (!["http:", "https:", "mailto:"].includes(url.protocol)) return "";
  if (url.origin !== origin) return href;
  if (url.pathname === "/style-guide/chronicle-knowledge-base") {
    const section = snapshot.sections.find(section => section.id === url.searchParams.get("section"));
    if (!section) return "#contents";
    if (url.hash && url.hash !== `#${section.id}`) return `#${section.id}--${url.hash.slice(1)}`;
    return `#${tabTarget(section, url.searchParams.get("tab") ?? "overview", snapshot)}`;
  }
  if (url.pathname.startsWith("/style-guide/chronicle-knowledge-base/archive/") || url.pathname.startsWith("/style-guide/changelog/")) {
    const id = decodeURIComponent(url.pathname.split("/").at(-1)!);
    const record = snapshot.documents.find(candidate => candidate.path.endsWith(`/${id}.md`));
    if (record) return `#${record.id}`;
  }
  if (url.pathname === "/style-guide/ui-audit" && url.searchParams.get("view") === "changelog") return "#records-changelog";
  const target = snapshot.documents.find(candidate => candidate.path === url.pathname.replace(/^\//, ""));
  if (target) return `#${target.id}${url.hash ? `--${url.hash.slice(1)}` : ""}`;
  // A separately linked application/source is not part of this static snapshot.
  return url.href;
}

function renderDocument(doc: ExportDocument) {
  const content = doc.path.endsWith("/roleplay-pipeline.md")
    ? doc.source.replace(/^# (.+)$/gm, (_, heading: string) => `<h1>${escapeHtml(heading)}</h1>`)
    : marked.parse(displaySource(doc.source), { async: false, gfm: true });
  const parsed = new DOMParser().parseFromString(content, "text/html");
  // Inert document only: preserve authored prose/tables, never active app code.
  parsed.querySelectorAll("script,style,iframe,object,embed,form,input,button,link,meta,base").forEach(element => element.remove());
  for (const element of parsed.body.querySelectorAll("*")) {
    for (const attribute of [...element.attributes]) {
      if (/^on/i.test(attribute.name) || ["srcdoc", "style", "srcset"].includes(attribute.name)) element.removeAttribute(attribute.name);
    }
  }
  const ids = new Set<string>();
  const originalIds = new Map<string, string>();
  for (const element of parsed.querySelectorAll("[id],h1,h2,h3,h4,h5,h6")) {
    const base = element.id || slug(element.textContent ?? "heading");
    let id = `${doc.id}--${base}`;
    let duplicate = 1;
    while (ids.has(id)) id = `${doc.id}--${base}-${duplicate++}`;
    if (element.id) originalIds.set(element.id, id);
    element.id = id;
    ids.add(id);
  }
  for (const element of parsed.querySelectorAll("[aria-labelledby],[aria-describedby]")) {
    for (const attribute of ["aria-labelledby", "aria-describedby"]) {
      const value = element.getAttribute(attribute);
      if (value) element.setAttribute(attribute, value.split(/\s+/).map(id => originalIds.get(id) ?? id).join(" "));
    }
  }
  return parsed;
}

async function embedAssets() {
  return Object.fromEntries(await Promise.all(Object.entries(assets).map(async ([key, path]) => {
    const response = await fetch(path);
    if (!response.ok) throw new Error("A reference image could not be loaded. Please retry the HTML download.");
    const blob = await response.blob();
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("A reference image could not be embedded."));
      reader.readAsDataURL(blob);
    });
    return [key, data];
  })));
}

function contents(snapshot: KnowledgeSnapshot) {
  return snapshot.documents.map(doc => `<li><a href="#${doc.id}">${escapeHtml(doc.title)}</a></li>`).join("\n");
}

function recordIndexes(snapshot: KnowledgeSnapshot) {
  return ["issues", "historical-work", "changelog"].map(group => {
    const documents = snapshot.documents.filter(doc => recordGroup(doc.path) === group);
    return `<section id="records-${group}"><h2>${{ issues: "Issues", "historical-work": "Historical Work Records", changelog: "Canonical Changelog" }[group]}</h2>
      <p>Original repository records are retained below, including their status, ownership, evidence limits, and any correction relationships. Inclusion does not make unfinished work accepted history.</p>
      ${documents.length ? `<ul>${documents.map(doc => `<li><a href="#${doc.id}">${escapeHtml(doc.path)}</a></li>`).join("")}</ul>` : "<p>No repository records in this snapshot.</p>"}</section>`;
  }).join("\n");
}

async function buildKnowledgeReferenceHtml(snapshot: KnowledgeSnapshot, origin: string, embeddedAssets?: Record<string, string>) {
  const imageData = embeddedAssets ?? await embedAssets();
  const body = snapshot.documents.map(doc => {
    const parsed = renderDocument(doc);
    parsed.querySelectorAll<HTMLAnchorElement>("a[href]").forEach(anchor => {
      const href = localLink(anchor.getAttribute("href")!, doc, snapshot, origin);
      if (href) anchor.setAttribute("href", href);
      else anchor.removeAttribute("href");
      if (href.startsWith(origin)) anchor.title = "Application or source link; requires access to the original application.";
    });
    parsed.querySelectorAll("img").forEach(image => {
      const embedded = imageData[image.getAttribute("src") ?? ""];
      if (embedded) image.setAttribute("src", embedded);
      else image.replaceWith(parsed.createTextNode(`[Image: ${image.alt || "reference image"}; not embedded]`));
    });
    const section = snapshot.sections.find(section => section.id === doc.id);
    const tabs = section ? `<nav aria-label="${escapeHtml(section.label)} contents">${section.tabs.map(tab => `<a href="#${tabTarget(section, tab.id, snapshot)}">${escapeHtml(tab.label)}</a>`).join(" · ")}</nav>` : "";
    return `<section class="export-document" id="${doc.id}" data-source-path="${escapeHtml(doc.path)}"><header><h1>${escapeHtml(doc.title)}</h1><p>Source: <code>${escapeHtml(doc.path)}</code></p>${tabs}</header><article class="knowledge-content${doc.path.endsWith("/roleplay-pipeline.md") ? " knowledge-roleplay-document" : ""}">${parsed.body.innerHTML}</article></section>`;
  }).join("\n");
  const result = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
    <title>Chronicle Knowledge Base — ${escapeHtml(snapshot.generatedAt.slice(0, 10))}</title>
    <style>${pageStyles}\n${pipelineStyles}\n
      body { margin:0; font-family:Arial,Helvetica,sans-serif; line-height:1.65; }
      .export-summary, .export-document { margin:32px auto; width:calc(100% - 48px); max-width:1400px; }
      .export-document > header { padding:20px 0; } .export-document > header h1 { font-size:28px; margin:0; }
      .export-document > header p { margin:6px 0; } nav { line-height:2; }
      .export-document article { background:#1f1f1f; color:#ddd; border-radius:12px; padding:clamp(20px,4vw,52px); }
      .export-document article h1,.export-document article h2,.export-document article h3 { color:#fff; }
      .export-document article a { color:#adc9ef; } a { color:#4a5f7f; overflow-wrap:anywhere; }
      .export-document img { max-width:100%; height:auto; } .export-document pre { white-space:pre-wrap; overflow-wrap:anywhere; }
      .export-document table { display:table; width:100%; table-layout:fixed; border-collapse:collapse; overflow:visible; }
      .export-document th,.export-document td { border:1px solid #555; padding:10px; overflow-wrap:anywhere; }
      .export-document [id] { scroll-margin-top:20px; } .export-document code { overflow-wrap:anywhere; }
      .export-document article, .export-document .pipeline-stage, .export-document .pipeline-branch { max-height:none; overflow:visible; }
      @media print { .export-document { width:100%; break-before:page; } .export-document article { background:white; color:black; } .export-document article h1,.export-document article h2,.export-document article h3 { color:black; } }
    </style></head><body class="chronicle-knowledge-base-page"><main>
    <header class="export-summary"><h1>Chronicle Knowledge Base</h1><p>Exported: ${escapeHtml(snapshot.generatedAt)}</p><p>${EXPORT_SCOPE}</p><p>Manifest reviewed revision: <code>${escapeHtml(snapshot.reviewedRevision)}</code> (documentation metadata, not a live Git HEAD check).</p></header>
    <nav class="export-summary" id="contents" aria-label="Document contents"><h2>Contents</h2><ul>${contents(snapshot)}</ul></nav>
    <div class="export-summary">${recordIndexes(snapshot)}</div>${body}</main></body></html>`;
  // Some historical source hashes differ from current heading IDs. Keep those
  // links usable at their included document rather than exporting dead anchors.
  const finalDocument = new DOMParser().parseFromString(result, "text/html");
  for (const anchor of finalDocument.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')) {
    const id = anchor.getAttribute("href")!.slice(1);
    if (!finalDocument.getElementById(id)) anchor.href = `#${id.split("--")[0]}`;
  }
  return `<!DOCTYPE html>\n${finalDocument.documentElement.outerHTML}`;
}

export async function buildKnowledgeHtml(snapshot: KnowledgeSnapshot, origin: string, embeddedAssets?: Record<string, string>) {
  const imageData = embeddedAssets ?? await embedAssets();
  const { captureKnowledgePage } = await import("./knowledge-export-page");
  const page = await captureKnowledgePage();
  page.id = "knowledge-base-top";
  const parsed = document.implementation.createHTMLDocument("Chronicle Knowledge Base");
  parsed.body.append(parsed.importNode(page, true));

  // Preserve every canonical source without adding a new report/contents wall to
  // the page. Linked archives open this appendix only when explicitly followed.
  const sourceReference = new DOMParser().parseFromString(
    await buildKnowledgeReferenceHtml(snapshot, origin, imageData), "text/html",
  );
  const sources = parsed.createElement("aside");
  sources.id = "knowledge-export-sources";
  sources.hidden = true;
  sources.className = "chronicle-knowledge-main";
  sources.dataset.exportSources = "true";
  for (const source of sourceReference.querySelectorAll<HTMLElement>(".export-document")) {
    source.id = `export-${source.id}`;
    source.className = "knowledge-switcher";
    source.querySelector("nav")?.remove();
    const article = source.querySelector("article")!;
    const panel = sourceReference.createElement("section");
    panel.className = "knowledge-content-panel";
    article.replaceWith(panel);
    panel.append(article);
    sources.append(parsed.importNode(source, true));
  }
  parsed.body.append(sources);
  const markdownCopy = parsed.createElement("template");
  markdownCopy.id = "knowledge-export-markdown";
  const markdownText = parsed.createElement("pre");
  markdownText.textContent = await buildKnowledgeMarkdown(snapshot, origin);
  markdownCopy.content.append(markdownText);
  parsed.body.append(markdownCopy);

  // Inactive tabs can repeat authored anchors (e.g. shared table references).
  // Give each duplicate a scoped identity and preserve its local references.
  const used = new Set<string>();
  for (const element of parsed.querySelectorAll<HTMLElement>("[id]")) {
    const original = element.id;
    if (used.has(original)) {
      const scope = element.closest('[role="tabpanel"], [data-source-path]');
      let replacement = `${scope?.id ?? "export"}--${original}`;
      while (used.has(replacement)) replacement += "-copy";
      element.id = replacement;
      for (const linked of scope?.querySelectorAll<HTMLElement>("[href], [aria-labelledby], [aria-describedby]") ?? []) {
        if (linked.getAttribute("href") === `#${original}`) linked.setAttribute("href", `#${replacement}`);
        for (const attr of ["aria-labelledby", "aria-describedby"]) {
          if (linked.hasAttribute(attr)) linked.setAttribute(attr, linked.getAttribute(attr)!.split(/\s+/).map(id => id === original ? replacement : id).join(" "));
        }
      }
    }
    used.add(element.id);
  }

  for (const anchor of parsed.querySelectorAll<HTMLAnchorElement>("a[href]")) {
    const href = anchor.getAttribute("href")!;
    let url: URL;
    try { url = new URL(href, origin); } catch { anchor.removeAttribute("href"); continue; }
    if (!["http:", "https:", "mailto:"].includes(url.protocol)) { anchor.removeAttribute("href"); continue; }
    if (href.startsWith("#")) {
      const id = href.slice(1);
      if (!parsed.getElementById(id)) anchor.href = `#${parsed.getElementById(`export-${id}`) ? `export-${id}` : "knowledge-base-top"}`;
    } else if (url.origin === origin && url.pathname === "/style-guide/chronicle-knowledge-base") {
      const section = snapshot.sections.find(section => section.id === url.searchParams.get("section"));
      const tab = section?.tabs.find(tab => tab.id === url.searchParams.get("tab"));
      const target = url.hash.slice(1);
      anchor.href = `#${target && parsed.getElementById(target) ? target : section ? tab ? `${section.id}-panel-${tab.id}` : section.id : "knowledge-base-top"}`;
    } else {
      const record = snapshot.documents.find(doc => url.pathname.endsWith(`/${doc.path.split("/").at(-1)!.replace(/\.md$/, "")}`) || url.pathname === `/${doc.path}`);
      anchor.href = record ? `#export-${record.id}` : url.href;
    }
  }
  for (const image of parsed.querySelectorAll<HTMLImageElement>("img")) {
    if (image.getAttribute("src")?.startsWith("data:")) continue;
    const src = new URL(image.getAttribute("src") ?? "", origin).pathname;
    const asset = Object.entries(assets).find(([, path]) => new URL(path, origin).pathname === src);
    if (!asset || !imageData[asset[0]]) throw new Error("A reference image could not be embedded. Please retry the HTML download.");
    image.src = imageData[asset[0]];
    image.removeAttribute("srcset");
  }
  parsed.querySelectorAll("script,iframe,object,embed,link,meta,base").forEach(element => element.remove());
  for (const element of parsed.querySelectorAll("*")) {
    for (const attribute of [...element.attributes]) {
      if (/^on/i.test(attribute.name) || attribute.name === "srcdoc") element.removeAttribute(attribute.name);
    }
  }
  // Keep the real page CSS (including the app's base/utility styles). No export
  // typography, replacement cards, or altered panel dimensions are introduced.
  const liveStyles = [...document.styleSheets].flatMap(sheet => {
    try { return [...sheet.cssRules].map(rule => rule.cssText); } catch { return []; }
  }).join("\n");
  const scriptHash = btoa(String.fromCharCode(...sha256HexSync(KNOWLEDGE_EXPORT_SCRIPT).match(/../g)!.map(byte => parseInt(byte, 16))));
  const styles = `${baseStyles}\n${pageStyles}\n${pipelineStyles}\n${changelogStyles}\n${liveStyles}\n[hidden] { display: none !important; }`;
  return `<!DOCTYPE html>\n<html lang="en" class="${escapeHtml(document.documentElement.className)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="exported-at" content="${escapeHtml(snapshot.generatedAt)}"><meta name="source-revision" content="${escapeHtml(snapshot.reviewedRevision)}"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; script-src 'sha256-${scriptHash}'; base-uri 'none'; form-action 'none'"><title>Chronicle Knowledge Base</title><style>${styles.replace(/<\/style/gi, "<\\/style")}</style></head><body>${parsed.body.innerHTML}<script>${KNOWLEDGE_EXPORT_SCRIPT}</script></body></html>`;
}

export async function buildKnowledgeMarkdown(snapshot: KnowledgeSnapshot, origin: string) {
  const converter = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced" });
  converter.use(gfm);
  converter.addRule("sourceAnchors", {
    filter: element => !!element.id,
    replacement: (content, node) => {
      const element = node as HTMLElement;
      const heading = /^H[1-6]$/.test(element.tagName) ? `${"#".repeat(Number(element.tagName[1]))} ` : "";
      return `\n\n<a id="${element.id}"></a>\n\n${heading}${content}\n\n`;
    },
  });
  converter.addRule("referenceImages", {
    filter: "img",
    replacement: (_, node) => `[Image: ${(node as HTMLImageElement).alt || "reference image"} — included in the HTML download.]`,
  });
  // Reuse precisely the same complete document and local link mapping. The
  // text version never fetches/embeds image bytes or reads the visible DOM.
  const imagePlaceholders = Object.fromEntries(Object.keys(assets).map(key => [key, "data:image/png;base64,"]));
  const html = await buildKnowledgeReferenceHtml(snapshot, origin, imagePlaceholders);
  const parsed = new DOMParser().parseFromString(html, "text/html");
  return `${converter.turndown(parsed.body.innerHTML)}\n`;
}

export async function prepareKnowledgeDownload(format: KnowledgeExportFormat, now = new Date()) {
  const snapshot = createKnowledgeSnapshot(now);
  const text = format === "html"
    ? await buildKnowledgeHtml(snapshot, window.location.origin)
    : await buildKnowledgeMarkdown(snapshot, window.location.origin);
  const file = knowledgeFileDetails(format, now);
  return { name: file.name, blob: new Blob([text], { type: `${file.mime};charset=utf-8` }) };
}
