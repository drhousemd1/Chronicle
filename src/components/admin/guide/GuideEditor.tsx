import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { TocEntry } from './GuideSidebar';
import { GuideEditorToolbar } from './GuideEditorToolbar';
import { marked } from 'marked';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

interface GuideEditorProps {
  docId: string | null;
  docTitle: string;
  docMarkdown: string;
  onTitleChange: (id: string, newTitle: string) => void;
  onTocUpdate: (entries: TocEntry[]) => void;
  onMarkdownChange?: (markdown: string) => void;
}

// Configure turndown for HTML -> Markdown conversion
function createTurndown() {
  const td = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
  });
  td.use(gfm);
  return td;
}

const turndown = createTurndown();

function extractTocFromMarkdown(md: string): TocEntry[] {
  const entries: TocEntry[] = [];
  const lines = md.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^(#{1,3})\s+(.+)/);
    if (match) {
      entries.push({
        id: `line-${i}`,
        text: match[2].trim(),
        level: match[1].length,
      });
    }
  }
  return entries;
}

function markdownToHtml(md: string): string {
  return marked.parse(md, { async: false }) as string;
}

export const GuideEditor: React.FC<GuideEditorProps> = ({
  docId,
  docTitle,
  docMarkdown,
  onTitleChange,
  onTocUpdate,
  onMarkdownChange,
}) => {
  const [title, setTitle] = useState(docTitle);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const isInitializing = useRef(false);

  useEffect(() => { setTitle(docTitle); }, [docTitle]);

  useEffect(() => {
    onTocUpdate(extractTocFromMarkdown(docMarkdown));
  }, [docMarkdown, onTocUpdate]);

  // Set initial HTML content when doc changes
  useEffect(() => {
    if (editorRef.current && docMarkdown !== undefined) {
      isInitializing.current = true;
      editorRef.current.innerHTML = markdownToHtml(docMarkdown);
      isInitializing.current = false;
    }
  }, [docId]); // Only on doc switch, not on every markdown change

  const handleInput = useCallback(() => {
    if (isInitializing.current) return;
    if (!editorRef.current || !onMarkdownChange) return;
    const html = editorRef.current.innerHTML;
    const md = turndown.turndown(html);
    onMarkdownChange(md);
  }, [onMarkdownChange]);

  const commitTitle = () => {
    setIsEditingTitle(false);
    if (docId && title !== docTitle) onTitleChange(docId, title);
  };

  if (!docId) {
    return (
      <div className="flex-1 flex items-center justify-center h-full bg-black">
        <span className="text-[#6B7280] text-sm">Select or create a document</span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 bg-black">
      {/* Title bar */}
      <div className="flex items-center justify-between px-4 shrink-0" style={{ height: 40, borderBottom: '1px solid #222' }}>
        <div className="flex-1 min-w-0">
          {isEditingTitle ? (
            <input
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => e.key === 'Enter' && commitTitle()}
              className="bg-transparent text-white text-sm font-medium outline-none w-full"
              autoFocus
            />
          ) : (
            <button
              onClick={() => setIsEditingTitle(true)}
              className="text-white text-sm font-medium truncate hover:text-[#00F0FF] transition-colors text-left"
            >
              {title}
            </button>
          )}
        </div>
      </div>

      {/* Formatting toolbar */}
      {onMarkdownChange && (
        <GuideEditorToolbar
          editorRef={editorRef}
          onInput={handleInput}
        />
      )}

      {/* WYSIWYG editable area */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div
          ref={editorRef}
          contentEditable={!!onMarkdownChange}
          onInput={handleInput}
          className="guide-preview max-w-4xl p-6 outline-none min-h-full"
          suppressContentEditableWarning
          spellCheck={false}
        />
      </div>
    </div>
  );
};
