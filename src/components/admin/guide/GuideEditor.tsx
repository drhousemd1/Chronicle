import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { TocEntry } from './GuideSidebar';
import {
  Bold, Italic, Heading1, Heading2, Heading3, Code, Link, Image, Table, List, ListOrdered, Save,
} from 'lucide-react';

interface GuideEditorProps {
  docId: string | null;
  docTitle: string;
  docMarkdown: string;
  onTitleChange: (id: string, newTitle: string) => void;
  onTocUpdate: (entries: TocEntry[]) => void;
}

/* ── helpers ─────────────────────────────────────────────────── */

function insertAround(
  ta: HTMLTextAreaElement,
  before: string,
  after: string,
  setText: (v: string) => void,
) {
  const { selectionStart: s, selectionEnd: e, value } = ta;
  const selected = value.slice(s, e);
  const next = value.slice(0, s) + before + selected + after + value.slice(e);
  setText(next);
  requestAnimationFrame(() => {
    ta.focus();
    ta.selectionStart = s + before.length;
    ta.selectionEnd = e + before.length;
  });
}

function insertAtLineStart(
  ta: HTMLTextAreaElement,
  prefix: string,
  setText: (v: string) => void,
) {
  const { selectionStart: s, value } = ta;
  const lineStart = value.lastIndexOf('\n', s - 1) + 1;
  const next = value.slice(0, lineStart) + prefix + value.slice(lineStart);
  setText(next);
  requestAnimationFrame(() => {
    ta.focus();
    ta.selectionStart = ta.selectionEnd = s + prefix.length;
  });
}

function insertBlock(
  ta: HTMLTextAreaElement,
  block: string,
  setText: (v: string) => void,
) {
  const { selectionStart: s, value } = ta;
  const next = value.slice(0, s) + block + value.slice(s);
  setText(next);
  requestAnimationFrame(() => {
    ta.focus();
    ta.selectionStart = ta.selectionEnd = s + block.length;
  });
}

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

function countStats(md: string) {
  const trimmed = md.trim();
  if (!trimmed) return { words: 0, chars: 0, paragraphs: 0 };
  const words = trimmed.split(/\s+/).length;
  const chars = trimmed.length;
  const paragraphs = trimmed.split(/\n\s*\n/).filter(Boolean).length;
  return { words, chars, paragraphs };
}

/* ── toolbar button ──────────────────────────────────────────── */

const TB: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void }> = ({ icon, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    title={label}
    className="p-1.5 rounded hover:bg-[#333] text-[#9CA3AF] hover:text-white transition-colors"
  >
    {icon}
  </button>
);

/* ── component ───────────────────────────────────────────────── */

export const GuideEditor: React.FC<GuideEditorProps> = ({
  docId,
  docTitle,
  docMarkdown,
  onTitleChange,
  onTocUpdate,
}) => {
  const [title, setTitle] = useState(docTitle);
  const [markdown, setMarkdown] = useState(docMarkdown);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  // Sync from props
  useEffect(() => { setTitle(docTitle); }, [docTitle]);
  useEffect(() => { setMarkdown(docMarkdown); setHasUnsaved(false); }, [docMarkdown]);

  // Extract TOC whenever markdown changes
  useEffect(() => {
    onTocUpdate(extractTocFromMarkdown(markdown));
  }, [markdown, onTocUpdate]);

  const handleChange = (val: string) => {
    setMarkdown(val);
    setHasUnsaved(true);
  };

  // Save
  const handleSave = useCallback(async () => {
    if (!docId) return;
    const { error } = await (supabase as any)
      .from('guide_documents')
      .update({ markdown, updated_at: new Date().toISOString() })
      .eq('id', docId);

    if (error) {
      toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
    } else {
      setHasUnsaved(false);
      setLastSaved(new Date());
      toast({ title: 'Guide saved' });
    }
  }, [docId, markdown]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod || !taRef.current) return;
      if (e.key === 's') { e.preventDefault(); handleSave(); }
      if (e.key === 'b') { e.preventDefault(); insertAround(taRef.current, '**', '**', handleChange); }
      if (e.key === 'i') { e.preventDefault(); insertAround(taRef.current, '*', '*', handleChange); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSave]);

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

  const stats = countStats(markdown);
  const ta = taRef.current;

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
        <div className="flex items-center gap-3 shrink-0 ml-3">
          {lastSaved && (
            <span className="text-[10px] text-[#6B7280]">
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
          {hasUnsaved && (
            <button
              onClick={handleSave}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors flex items-center gap-1"
            >
              <Save className="w-3 h-3" /> Save
            </button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-3 py-1 shrink-0" style={{ borderBottom: '1px solid #222' }}>
        <TB icon={<Heading1 className="w-4 h-4" />} label="Heading 1" onClick={() => ta && insertAtLineStart(ta, '# ', handleChange)} />
        <TB icon={<Heading2 className="w-4 h-4" />} label="Heading 2" onClick={() => ta && insertAtLineStart(ta, '## ', handleChange)} />
        <TB icon={<Heading3 className="w-4 h-4" />} label="Heading 3" onClick={() => ta && insertAtLineStart(ta, '### ', handleChange)} />
        <div className="w-px h-4 bg-[#333] mx-1" />
        <TB icon={<Bold className="w-4 h-4" />} label="Bold (Ctrl+B)" onClick={() => ta && insertAround(ta, '**', '**', handleChange)} />
        <TB icon={<Italic className="w-4 h-4" />} label="Italic (Ctrl+I)" onClick={() => ta && insertAround(ta, '*', '*', handleChange)} />
        <TB icon={<Code className="w-4 h-4" />} label="Code Block" onClick={() => ta && insertBlock(ta, '\n```\n\n```\n', handleChange)} />
        <div className="w-px h-4 bg-[#333] mx-1" />
        <TB icon={<Link className="w-4 h-4" />} label="Link" onClick={() => ta && insertBlock(ta, '[text](url)', handleChange)} />
        <TB icon={<Image className="w-4 h-4" />} label="Image" onClick={() => ta && insertBlock(ta, '![alt](url)', handleChange)} />
        <TB icon={<Table className="w-4 h-4" />} label="Table" onClick={() => ta && insertBlock(ta, '\n| Header | Header |\n| ------ | ------ |\n| Cell   | Cell   |\n', handleChange)} />
        <div className="w-px h-4 bg-[#333] mx-1" />
        <TB icon={<List className="w-4 h-4" />} label="Bullet List" onClick={() => ta && insertAtLineStart(ta, '- ', handleChange)} />
        <TB icon={<ListOrdered className="w-4 h-4" />} label="Ordered List" onClick={() => ta && insertAtLineStart(ta, '1. ', handleChange)} />
      </div>

      {/* Editor textarea */}
      <div className="flex-1 overflow-y-auto min-h-0 p-4">
        <textarea
          ref={taRef}
          value={markdown}
          onChange={(e) => handleChange(e.target.value)}
          spellCheck
          className="w-full h-full min-h-[calc(100vh-200px)] bg-transparent text-[#E5E7EB] text-sm leading-relaxed resize-none outline-none"
          style={{ fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace' " }}
          placeholder="Start writing markdown..."
        />
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-4 px-4 py-1 shrink-0 text-[10px] text-[#6B7280]" style={{ borderTop: '1px solid #222' }}>
        <span>{stats.words} words</span>
        <span>{stats.chars} characters</span>
        <span>{stats.paragraphs} paragraphs</span>
      </div>
    </div>
  );
};
