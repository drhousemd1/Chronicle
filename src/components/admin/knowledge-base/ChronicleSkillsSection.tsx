import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import catalog from "@/data/chronicle-knowledge-base/codex-skills.generated.json";
import type { KnowledgeSection } from "@/data/chronicle-knowledge-base/manifest";
import { KnowledgeSwitcher } from "./KnowledgeSwitcher";

type InstructionFile = {
  id?: string;
  path: string;
  relativePath: string;
  text: string;
  sha256: string;
  words: number;
};

export type ChronicleSkillEntry = {
  id: string;
  displayName: string;
  classification: string;
  identifier: string;
  purpose: string;
  usage: string;
  sourceVersion: string | null;
  source: InstructionFile;
  supportingFiles: InstructionFile[];
};

function displayMarkdown(source: string) {
  return source.replace(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/, (_, metadata: string) => `\`\`\`yaml\n${metadata}\n\`\`\`\n\n`);
}

function instructionUrl(relativePath: string) {
  return new URL(relativePath, "https://skill-source.invalid/package/skill/SKILL.md");
}

function SkillMarkdown({ entry, file }: { entry: ChronicleSkillEntry; file: InstructionFile }) {
  if (!/\.(?:md|markdown)$/i.test(file.relativePath)) return <pre><code>{file.text}</code></pre>;
  return <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
    a: ({ href, children }) => {
      if (!href) return <span>{children}</span>;
      if (/^https?:\/\//i.test(href) || href.startsWith("mailto:")) return <a href={href} rel="noreferrer">{children}</a>;
      const targetUrl = new URL(href, instructionUrl(file.relativePath));
      const target = entry.supportingFiles.find((support) => instructionUrl(support.relativePath).pathname === targetUrl.pathname);
      if (target) {
        const id = `skill-${entry.id}-support-${target.id}`;
        return <a href={`#${id}`} onClick={(event) => {
          event.preventDefault();
          const element = document.getElementById(id) as HTMLDetailsElement | null;
          if (element) { element.open = true; element.scrollIntoView?.({ block: "nearest" }); element.querySelector("summary")?.focus(); }
        }}>{children}</a>;
      }
      return <span>{children} <code className="knowledge-skill-source-link">({href})</code></span>;
    },
    img: ({ alt, src }) => <span>{alt ?? "Source image"}{src ? <code className="knowledge-skill-source-link"> ({src})</code> : null}</span>,
  }}>{displayMarkdown(file.text)}</ReactMarkdown>;
}

export function ChronicleSkillsSection({
  entries = catalog.entries,
  syncedAt = catalog.syncedAt,
  exportAllTabs = false,
}: {
  entries?: ChronicleSkillEntry[];
  syncedAt?: string;
  exportAllTabs?: boolean;
}) {
  const section = useMemo<KnowledgeSection>(() => ({
    id: "codex-skills-for-chronicle",
    label: "Codex Skills for Chronicle",
    description: "Chronicle-specific and shared skills for tasks that match their stated usage. Shared skills are optional; inclusion here does not make them required for every Chronicle task.",
    tabs: entries.map((entry) => ({ id: entry.id, label: entry.displayName, contentKind: "markdown-section" })),
  }), [entries]);
  const byId = useMemo(() => new Map(entries.map((entry) => [entry.id, entry])), [entries]);

  if (!entries.length) return <section className="knowledge-switcher" id={section.id}>
    <h1 className="knowledge-section-title">{section.label}</h1>
    <p className="knowledge-section-description">{section.description}</p>
    <div className="knowledge-content-panel"><article className="knowledge-content"><p>The approved skills catalog has not been synchronized.</p></article></div>
  </section>;

  return <KnowledgeSwitcher section={section} exportAllTabs={exportAllTabs}
    renderMetadata={(tab) => {
      const entry = byId.get(tab.id)!;
      return <div className="knowledge-content-metadata">
        <span className="knowledge-metadata-pill">{entry.classification}</span>
        <span className="knowledge-metadata-pill">Skill: {entry.source.words.toLocaleString("en-US")} words</span>
        <span className="knowledge-metadata-pill">Synced: {syncedAt.slice(0, 10)}</span>
      </div>;
    }}
    renderContent={(tab) => {
      const entry = byId.get(tab.id)!;
      return <div className="knowledge-skill-entry" data-skill-id={entry.id} data-source-sha256={entry.source.sha256}>
        <h1>{entry.displayName}</h1>
        <p>{entry.purpose}</p>
        {entry.usage !== entry.purpose ? <p>{entry.usage}</p> : null}
        <p className="knowledge-skill-provenance"><strong>Source:</strong> <code>{entry.source.path}</code><br />
          <strong>Identifier:</strong> <code>{entry.identifier}</code>{entry.sourceVersion ? <> · Version {entry.sourceVersion}</> : null}
        </p>
        <p className="knowledge-skill-reading-note">This reading copy contains the complete skill text. The source files remain authoritative; synchronization checks detect changes.</p>
        <div className="knowledge-skill-full-text" aria-label="Complete skill text">
          <SkillMarkdown entry={entry} file={entry.source} />
        </div>
        {entry.supportingFiles.length > 0 ? <section className="knowledge-skill-support" aria-label="Supporting instruction files">
          <h2>Supporting instructions</h2>
          {entry.supportingFiles.map((file) => <details key={file.id} id={`skill-${entry.id}-support-${file.id}`}>
            <summary>{file.relativePath} <span>({file.words.toLocaleString("en-US")} words)</span></summary>
            <SkillMarkdown entry={entry} file={file} />
          </details>)}
        </section> : null}
      </div>;
    }}
  />;
}
