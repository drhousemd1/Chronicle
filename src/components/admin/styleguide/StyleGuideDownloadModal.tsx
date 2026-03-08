import React from 'react';
import { Download, FileText, Code2, Braces, X } from 'lucide-react';

const sg = {
  primary: '#4a5f7f',
};

type FormatOption = 'html' | 'markdown' | 'json';

interface StyleGuideDownloadModalProps {
  open: boolean;
  onClose: () => void;
  contentRef: React.RefObject<HTMLDivElement>;
}

const FORMAT_OPTIONS: { id: FormatOption; label: string; desc: string; icon: React.ReactNode }[] = [
  { id: 'html', label: 'HTML', desc: 'Full visual layout with inline styles. Best for humans & multimodal LLMs.', icon: <FileText size={22} /> },
  { id: 'markdown', label: 'Markdown', desc: 'Clean text format. Token-efficient for LLM chat contexts.', icon: <Code2 size={22} /> },
  { id: 'json', label: 'JSON', desc: 'Structured machine-readable data for automated tooling.', icon: <Braces size={22} /> },
];

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
}

function generateHTML(contentEl: HTMLDivElement): string {
  const clone = contentEl.cloneNode(true) as HTMLDivElement;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Chronicle Style Guide</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter','Segoe UI',system-ui,-apple-system,sans-serif; background: #f3f4f6; color: #0f172a; line-height: 1.5; padding: 36px 42px 84px; max-width: 1400px; }
  code, pre { font-family: 'SF Mono','Fira Code','JetBrains Mono',monospace; }
</style>
</head>
<body>
${clone.innerHTML}
</body>
</html>`;
}

function generateMarkdown(contentEl: HTMLDivElement): string {
  const lines: string[] = ['# Chronicle Style Guide', '', 'Every color, font size, border radius, and spacing value below was extracted from the live Chronicle source code.', ''];

  const sections = contentEl.querySelectorAll('section[id^="sg-"]');
  sections.forEach(section => {
    const h2 = section.querySelector('h2');
    if (h2) lines.push(`## ${h2.textContent?.trim()}`, '');

    const desc = section.querySelector(':scope > p');
    if (desc) lines.push(desc.textContent?.trim() || '', '');

    // Subheadings
    const subheadings = section.querySelectorAll('div');
    const processedCards = new Set<Element>();

    section.querySelectorAll('h2, [style*="text-transform: uppercase"]').forEach(el => {
      // Skip if already processed as section title
      if (el.tagName === 'H2') return;
    });

    // Process swatch cards and entry cards by walking the DOM
    const allCards = section.querySelectorAll('[style*="border: 2px solid"]');
    allCards.forEach(card => {
      if (processedCards.has(card)) return;
      processedCards.add(card);

      const name = card.querySelector('[style*="font-weight: 700"], [style*="font-weight: 800"]');
      const cardTitle = name?.textContent?.trim() || 'Untitled';

      lines.push(`### ${cardTitle}`, '');

      // Extract all text rows
      const rows = card.querySelectorAll('[style*="grid-template-columns"]');
      rows.forEach(row => {
        const label = row.querySelector('span')?.textContent?.trim();
        const value = row.querySelectorAll('span')[1]?.textContent?.trim();
        if (label && value) {
          lines.push(`- **${label}**: \`${value}\``);
        }
      });

      // Extract code blocks
      const codeBlock = card.querySelector('[style*="SF Mono"]');
      if (codeBlock && codeBlock.textContent?.trim()) {
        lines.push('', '```', codeBlock.textContent.trim(), '```');
      }

      // Extract specs paragraphs
      const specsPara = card.querySelector('p[style*="color"]');
      if (specsPara?.textContent?.trim()) {
        lines.push('', specsPara.textContent.trim());
      }

      lines.push('');
    });

    // Process inconsistency notes
    const warnings = section.querySelectorAll('[style*="background: rgb(255, 251, 235)"], [style*="#fffbeb"]');
    warnings.forEach(warn => {
      lines.push('> ⚠️ **Inconsistencies Found**', '');
      const items = warn.querySelectorAll('[style*="grid-template-columns"]');
      items.forEach(item => {
        const spans = item.querySelectorAll('span');
        if (spans.length >= 2) {
          lines.push(`> - **${spans[0].textContent?.trim()}**: ${spans[1].textContent?.trim()}`);
        }
      });
      lines.push('');
    });

    lines.push('---', '');
  });

  return lines.join('\n');
}

function generateJSON(contentEl: HTMLDivElement): string {
  const data: Record<string, any> = { title: 'Chronicle Style Guide', sections: [] };

  const sections = contentEl.querySelectorAll('section[id^="sg-"]');
  sections.forEach(section => {
    const h2 = section.querySelector('h2');
    const sectionData: Record<string, any> = {
      id: section.id.replace('sg-', ''),
      title: h2?.textContent?.trim() || '',
      entries: [],
    };

    const allCards = section.querySelectorAll('[style*="border: 2px solid"]');
    allCards.forEach(card => {
      const name = card.querySelector('[style*="font-weight: 700"], [style*="font-weight: 800"]');
      const entry: Record<string, any> = { name: name?.textContent?.trim() || 'Untitled', properties: {} };

      const rows = card.querySelectorAll('[style*="grid-template-columns"]');
      rows.forEach(row => {
        const label = row.querySelector('span')?.textContent?.trim();
        const value = row.querySelectorAll('span')[1]?.textContent?.trim();
        if (label && value) entry.properties[label.toLowerCase().replace(/[:\s]/g, '_')] = value;
      });

      const codeBlock = card.querySelector('[style*="SF Mono"]');
      if (codeBlock?.textContent?.trim()) entry.code = codeBlock.textContent.trim();

      const specsPara = card.querySelector('p[style*="color"]');
      if (specsPara?.textContent?.trim()) entry.specs = specsPara.textContent.trim();

      sectionData.entries.push(entry);
    });

    data.sections.push(sectionData);
  });

  return JSON.stringify(data, null, 2);
}

export const StyleGuideDownloadModal: React.FC<StyleGuideDownloadModalProps> = ({ open, onClose, contentRef }) => {
  if (!open) return null;

  const handleDownload = (format: FormatOption) => {
    const el = contentRef.current;
    if (!el) return;

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `chronicle-style-guide-${timestamp}`;

    switch (format) {
      case 'html': {
        const html = generateHTML(el);
        triggerDownload(new Blob([html], { type: 'text/html' }), `${filename}.html`);
        break;
      }
      case 'markdown': {
        const md = generateMarkdown(el);
        triggerDownload(new Blob([md], { type: 'text/markdown' }), `${filename}.md`);
        break;
      }
      case 'json': {
        const json = generateJSON(el);
        triggerDownload(new Blob([json], { type: 'application/json' }), `${filename}.json`);
        break;
      }
    }

    onClose();
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16,
          padding: 28, width: 520, maxWidth: '90vw', position: 'relative',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 14, right: 14, background: 'none', border: 'none',
            color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 4,
          }}
        >
          <X size={18} />
        </button>

        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <Download size={18} style={{ color: sg.primary }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Download Style Guide</h3>
        </div>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 22 }}>
          Choose a format to export the full style guide for external use.
        </p>

        {/* Format cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {FORMAT_OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => handleDownload(opt.id)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                padding: '20px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.04)', color: '#fff', cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(74,95,127,0.2)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(74,95,127,0.4)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)';
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(74,95,127,0.2)',
              }}>
                {opt.icon}
              </div>
              <span style={{ fontSize: 14, fontWeight: 700 }}>{opt.label}</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 1.4 }}>{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
