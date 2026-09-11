import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { marked, type Tokens } from "marked";
import catalog from "../../../docs/ui-guide/catalog.json";
import assets from "../../../docs/ui-guide/story-builder.assets.json";
import migration from "../../../docs/ui-guide/story-builder.migration.json";
import { parseUiGuide, renderUiGuideHtml, withoutSupportingSource } from "./document";

const raw = fs.readFileSync(catalog[0].source, "utf8");
const sections = parseUiGuide(raw, catalog[0]);
const hash = (text: string | Buffer) => crypto.createHash("sha256").update(text).digest("hex");

describe("Chronicle UI Guide shared content", () => {
  it("preserves all seven sections and all 39 migrated construction/source blocks", () => {
    expect(sections.map(section => section.id)).toEqual(["overview", "colors", "typography", "buttons", "fields", "panels", "mockups"]);
    // Lex each source disclosure's Markdown as well as ordinary top-level Markdown.
    const unwrapped = raw.replace(/<\/?details[^>]*>/g, "").replace(/<summary>.*?<\/summary>/g, "");
    const blocks = marked.lexer(unwrapped).filter((token): token is Tokens.Code => token.type === "code").map(token => token.text);
    expect(blocks).toHaveLength(migration.sourceBlocks.length);
    for (let index = 0; index < blocks.length; index++) {
      expect([hash(blocks[index]), hash(blocks[index] + "\n")], `source block ${index}`).toContain(migration.sourceBlocks[index].sha256);
    }
  });

  it("keeps every registered image byte-identical to its migrated reference", () => {
    expect(assets).toHaveLength(migration.uniqueImages);
    for (const asset of assets) {
      const bytes = fs.readFileSync(path.resolve(path.dirname(catalog[0].source), asset.path));
      expect(bytes.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
      expect(hash(bytes)).toBe(asset.sha256);
      expect(bytes.readUInt32BE(16)).toBe(asset.width);
      expect(bytes.readUInt32BE(20)).toBe(asset.height);
    }
  });

  it("omits supporting implementations while retaining exact field construction and state guidance", () => {
    const fields = withoutSupportingSource(sections.find(section => section.id === "fields")!.markdown);
    expect(fields).toContain("focus:ring-blue-500/20 focus:border-blue-500");
    expect(fields).toContain("Focused invalid field");
    expect(fields).toContain("does not currently forward");
    expect(fields).not.toContain("const observerTarget = parent ?? textarea");
    expect(fields).not.toContain("<details");
  });

  it("renders all sections, original figures, source disclosures and responsive tables without jump links", () => {
    const resolveImage = (source: string) => {
      expect(assets.some(asset => asset.path === source)).toBe(true);
      return source.replace("../../src", "/assets");
    };
    const html = sections.map(section => renderUiGuideHtml(section.markdown, resolveImage)).join("");
    expect((html.match(/<figure\b/g) || []).length).toBe(migration.figureCount);
    expect((html.match(/<(?:img|source)\b/g) || []).length).toBe(migration.imageReferences);
    expect(html).toContain('<details class="implementation">');
    expect(html).toContain('data-label="');
    expect((html.match(/class="manual-entry"/g) || []).length).toBe(31);
    expect((html.match(/class="reuse-recipe"/g) || []).length).toBe(25);
    expect(html).not.toMatch(/<h[12]\b/);
    expect(html).not.toMatch(/<a\b/);
    expect(html).not.toContain("In this tab");
  });

  it("rejects unknown/repeated section boundaries and active HTML while allowing quoted JSX", () => {
    expect(() => parseUiGuide(raw + "\n## Undocumented\n", catalog[0])).toThrow("Unknown or repeated");
    expect(() => parseUiGuide(raw + "\n## Overview\n", catalog[0])).toThrow("Unknown or repeated");
    expect(() => renderUiGuideHtml('<img src="image.png" onerror="alert(1)">', source => source)).toThrow("Active HTML");
    expect(() => renderUiGuideHtml('```tsx\n<button onClick={save}>Save</button>\n```', source => source)).not.toThrow();
  });
});

describe("Chronicle UI Guide agent reader", () => {
  it.each(catalog.filter(guide => guide.id !== "story-builder"))("delivers $id through the same seven sections and direct-image reader", definition => {
    const source = fs.readFileSync(definition.source, "utf8");
    const parsed = parseUiGuide(source, definition);
    expect(parsed.map(section => section.id)).toEqual(sections.map(section => section.id));
    const output = execFileSync("node_modules/.bin/vite-node", ["scripts/read-chronicle-ui-guide.mjs", definition.id, "--images", "--json"], { encoding: "utf8", maxBuffer: 2 * 1024 * 1024 });
    const result = JSON.parse(output);
    expect(result.sourceSha256).toBe(hash(source));
    expect(result.sections).toEqual(parsed.map(section => section.id));
    expect(result.markdown).toContain("Use in a New Design");
    expect(result.markdown).toContain("Source:");
    expect(result.markdown).not.toMatch(/<(?:details|figure|section)\b/);
    const manifest = JSON.parse(fs.readFileSync(definition.assets, "utf8"));
    expect(result.images.length).toBe(manifest.length);
    for (const image of result.images) {
      expect(path.isAbsolute(image.path)).toBe(true);
      expect(image.caption.length).toBeGreaterThan(0);
      const bytes = fs.readFileSync(image.path);
      const record = manifest.find((asset: { path: string }) => path.resolve(path.dirname(definition.source), asset.path) === image.path);
      expect(hash(bytes)).toBe(record.sha256);
      expect(bytes.readUInt32BE(16)).toBe(record.width);
      expect(bytes.readUInt32BE(20)).toBe(record.height);
    }
    const html = parsed.map(section => renderUiGuideHtml(section.markdown, source => source)).join("");
    expect(html).toContain('class="manual-entry"');
    expect(html).toContain('class="reuse-recipe"');
    expect(html).toContain('class="source-line"');
    expect(html).not.toMatch(/<a\b|In this tab/);
  }, 15_000);

  it("returns the same guide's foundations, requested content, captions and local image paths without frontend access", () => {
    const output = execFileSync("node_modules/.bin/vite-node", ["scripts/read-chronicle-ui-guide.mjs", "story-builder", "--section", "fields", "--images", "--json"], { encoding: "utf8" });
    const result = JSON.parse(output);
    expect(result.sections).toEqual(["overview", "colors", "typography", "fields"]);
    expect(result.sourceSha256).toBe(hash(raw));
    expect(result.markdown).toContain("Focused invalid field");
    expect(result.markdown).toContain("Focus Belongs to the Control Family");
    expect(result.markdown).not.toContain("<figure");
    expect(result.markdown).not.toContain("Complete matching excerpt");
    expect(result.markdown).not.toContain("const observerTarget = parent ?? textarea");
    expect(result.images.length).toBeGreaterThan(0);
    for (const image of result.images) {
      expect(path.isAbsolute(image.path)).toBe(true);
      expect(fs.existsSync(image.path)).toBe(true);
      expect(image.caption).not.toBe("");
    }
  }, 15_000);

  it("fails explicitly for an unknown guide or section", () => {
    for (const args of [["../private"], ["story-builder", "--section", "missing"]]) {
      const result = spawnSync("node_modules/.bin/vite-node", ["scripts/read-chronicle-ui-guide.mjs", ...args], { encoding: "utf8" });
      expect(result.status).toBe(1);
      expect(result.stderr).toContain("Unknown");
      expect(result.stdout).toBe("");
    }
  }, 15_000);

  it("includes every code block and original image when full supporting source is requested", () => {
    const output = execFileSync("node_modules/.bin/vite-node", ["scripts/read-chronicle-ui-guide.mjs", "story-builder", "--full-source", "--images", "--json"], { encoding: "utf8", maxBuffer: 2 * 1024 * 1024 });
    const result = JSON.parse(output);
    const blocks = marked.lexer(result.markdown).filter((token): token is Tokens.Code => token.type === "code");
    expect(blocks).toHaveLength(39);
    expect(result.sections).toEqual(sections.map(section => section.id));
    expect(result.images).toHaveLength(34);
    expect(result.includesSupportingSource).toBe(true);
    expect(result.markdown).toContain("const observerTarget = parent ?? textarea");
  }, 15_000);
});
