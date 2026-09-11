import { marked, Renderer, type Token } from "marked";

export interface UiGuideSectionDefinition { id: string; label: string }
export interface UiGuideDefinition {
  id: string;
  title: string;
  description: string;
  source: string;
  assets: string;
  reviewedOn: string;
  updatedOn: string;
  sections: UiGuideSectionDefinition[];
}
export interface UiGuideSection extends UiGuideSectionDefinition { markdown: string }

/** Markdown headings inside code fences never become guide sections. */
export function parseUiGuide(markdown: string, definition: UiGuideDefinition): UiGuideSection[] {
  const sections: UiGuideSection[] = [];
  let current: UiGuideSection | undefined;
  for (const token of marked.lexer(markdown)) {
    if (token.type === "heading" && token.depth === 2) {
      const section = definition.sections.find(item => item.label === token.text);
      if (!section || sections.some(item => item.id === section.id)) {
        throw new Error(`Unknown or repeated UI guide section: ${token.text}`);
      }
      current = { ...section, markdown: "" };
      sections.push(current);
    } else if (current) {
      current.markdown += token.raw;
    }
  }
  if (sections.map(item => item.id).join() !== definition.sections.map(item => item.id).join()) {
    throw new Error(`UI guide sections do not match the catalog: ${definition.id}`);
  }
  return sections;
}

/** Only the explicitly labelled source disclosures are omitted, never recipes or construction blocks. */
export function withoutSupportingSource(markdown: string): string {
  let depth = 0;
  return marked.lexer(markdown).filter((token: Token) => {
    const wasInside = depth > 0;
    if (token.type === "html") {
      depth += (token.raw.match(/<details\b/g) || []).length;
      depth -= (token.raw.match(/<\/details>/g) || []).length;
    }
    return !wasInside && depth === 0;
  }).map(token => token.raw).join("");
}

const escapeAttribute = (value: string) => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Renders maintained repository content, never user-entered or remotely fetched Markdown. */
export function renderUiGuideHtml(markdown: string, resolveImage: (source: string) => string): string {
  const renderer = new Renderer();
  renderer.heading = function ({ depth, tokens }) {
    // The application title and guide title already occupy h1 and h2.
    const level = Math.max(3, depth);
    return `<h${level}>${this.parser.parseInline(tokens)}</h${level}>\n`;
  };
  // Pattern names are prose; the reference has no jump navigation.
  renderer.link = function ({ tokens }) { return this.parser.parseInline(tokens); };
  renderer.table = function ({ header, rows }) {
    const labels = header.map(cell => cell.text.replace(/<[^>]*>/g, "").replace(/`/g, ""));
    const head = header.map(cell => `<th scope="col">${this.parser.parseInline(cell.tokens)}</th>`).join("");
    const body = rows.map(row => `<tr>${row.map((cell, index) => `<td data-label="${escapeAttribute(labels[index])}">${this.parser.parseInline(cell.tokens)}</td>`).join("")}</tr>`).join("");
    return `<div class="table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>\n`;
  };
  let html = marked.parse(markdown, { renderer, async: false });
  html = html.replace(/\b(src|srcset)="([^"]+)"/g, (_match, attribute: string, source: string) => `${attribute}="${escapeAttribute(resolveImage(source))}"`);
  // Rich reference formatting permits figures, swatches and source disclosures only.
  const tags = html.match(/<[^>]*>/g) || [];
  if (tags.some(tag => /<\/?(?:script|iframe|object|embed|form|input|button|style|link|meta|base|a)\b/i.test(tag) || /\son\w+\s*=/i.test(tag))) {
    throw new Error("Active HTML is not supported in a UI guide");
  }
  return html;
}
