import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { marked } from 'marked';
import { JSDOM } from 'jsdom';
import TurndownService from 'turndown';
import { parseUiGuide, withoutSupportingSource } from '../src/data/chronicle-ui-guide/document.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { gfm } = require('turndown-plugin-gfm');

async function main() {
  const catalog = JSON.parse(await fs.readFile(path.join(root, 'docs/ui-guide/catalog.json'), 'utf8'));
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--list')) {
    process.stdout.write(JSON.stringify(catalog.map(({ id, title, source, sections }) => ({ id, title, source, sections })), null, 2) + '\n');
    return;
  }
  const pageId = args.shift();
  const selectedIds = [];
  let fullSource = false, includeImages = false, json = false;
  while (args.length) {
    const arg = args.shift();
    if (arg === '--section') {
      const value = args.shift();
      if (!value || value.startsWith('--')) throw new Error('--section requires a section ID');
      selectedIds.push(...value.split(','));
    } else if (arg === '--full-source') fullSource = true;
    else if (arg === '--images') includeImages = true;
    else if (arg === '--json') json = true;
    else throw new Error(`Unknown option: ${arg}`);
  }
  const definition = catalog.find(guide => guide.id === pageId);
  if (!definition) throw new Error(`Unknown UI guide: ${pageId}. Run with --list for available guides.`);
  for (const id of selectedIds) {
    if (!definition.sections.some(section => section.id === id)) throw new Error(`Unknown section for ${pageId}: ${id}`);
  }
  const sourcePath = path.join(root, definition.source);
  const raw = await fs.readFile(sourcePath, 'utf8');
  const sections = parseUiGuide(raw, definition).filter(section => !selectedIds.length || ['overview', 'colors', 'typography', ...selectedIds].includes(section.id));
  const markdown = sections.map(section => `## ${section.label}\n\n${fullSource ? section.markdown : withoutSupportingSource(section.markdown)}`).join('\n');
  const document = new JSDOM(marked.parse(markdown)).window.document;
  const imageManifest = JSON.parse(await fs.readFile(path.join(root, definition.assets), 'utf8'));
  const images = [];
  for (const element of document.querySelectorAll('img[src],source[srcset]')) {
    const relative = element.getAttribute('src') ?? element.getAttribute('srcset');
    const record = imageManifest.find(image => image.path === relative);
    if (!record) throw new Error(`Unregistered reference image: ${relative}`);
    const absolute = path.resolve(path.dirname(sourcePath), relative);
    if (!absolute.startsWith(path.join(root, 'src/assets/ui-guide') + path.sep)) throw new Error(`Image is outside the guide assets: ${relative}`);
    const bytes = await fs.readFile(absolute);
    if (crypto.createHash('sha256').update(bytes).digest('hex') !== record.sha256) throw new Error(`Reference image changed; review and update its manifest: ${relative}`);
    if (!images.some(image => image.path === absolute)) images.push({ path: absolute, caption: element.closest('figure')?.querySelector('figcaption')?.textContent ?? element.getAttribute('alt') ?? '', variant: element.tagName === 'SOURCE' ? 'narrow' : 'default', width: record.width, height: record.height });
    element.setAttribute(element.hasAttribute('src') ? 'src' : 'srcset', absolute);
  }
  const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', bulletListMarker: '-' });
  td.use(gfm);
  td.addRule('code', { filter: 'pre', replacement: (_content, node) => {
    const source = node.textContent;
    const fence = '`'.repeat(Math.max(3, ...[...source.matchAll(/`+/g)].map(match => match[0].length + 1)));
    return `\n\n${fence}tsx\n${source}\n${fence}\n\n`;
  } });
  td.addRule('referenceFigure', { filter: 'figure', replacement: (_content, node) => {
    const caption = node.querySelector('figcaption')?.textContent ?? 'Reference image';
    return '\n\n' + [...node.querySelectorAll('img,source')].map(image => {
      const suffix = image.tagName === 'SOURCE' ? ' — narrow layout' : '';
      return `![${(caption + suffix).replaceAll('[', '\\[').replaceAll(']', '\\]')}](<${image.getAttribute('src') ?? image.getAttribute('srcset')}>)`;
    }).join('\n\n') + '\n\n';
  } });
  const text = `# ${definition.title}\n\n${definition.description}\n\nReviewed: ${definition.reviewedOn}. Source: ${definition.source}.\n\n${td.turndown(document.body.innerHTML)}\n`;
  const result = { page: pageId, source: sourcePath, sourceSha256: crypto.createHash('sha256').update(raw).digest('hex'), sections: sections.map(section => section.id), includesSupportingSource: fullSource, markdown: text, ...(includeImages ? { images } : {}) };
  process.stdout.write(json ? JSON.stringify(result, null, 2) + '\n' : text + (includeImages ? '\n## Image files for direct image-tool loading\n\n' + images.map(image => `- ${image.path} (${image.width}×${image.height}; ${image.variant})`).join('\n') + '\n' : ''));
}

main().catch(error => { process.stderr.write(`Chronicle UI Guide: ${error.message}\n`); process.exitCode = 1; });
