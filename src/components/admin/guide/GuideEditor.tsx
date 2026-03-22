import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import 'highlight.js/styles/github.css';
import { Pencil, Eye, Save, Search, X, ChevronUp, ChevronDown } from 'lucide-react';
import type { TocEntry } from './GuideSidebar';

interface GuideEditorProps {
  docId: string | null;
  docTitle: string;
  docMarkdown: string;
  onTitleChange: (id: string, newTitle: string) => void;
  onTocUpdate: (entries: TocEntry[]) => void;
  onMarkdownChange?: (markdown: string) => void;
  theme?: 'dark' | 'light';
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

// --- Theme-aware Markdown components ---

function createMarkdownComponents(isDark: boolean): Record<string, React.FC<any>> {
  const text = isDark ? '#e2e2e2' : '#374151';
  const heading = isDark ? '#ffffff' : '#111827';
  const mutedHeading = isDark ? '#9CA3AF' : '#6B7280';
  const border = isDark ? '#333333' : '#d1d5db';
  const codeBg = isDark ? '#1e1e1e' : '#f3f4f6';
  const inlineCodeBg = isDark ? '#1e293b' : '#e2e8f0';
  const theadBg = isDark ? '#1e293b' : '#e2e8f0';
  const thText = isDark ? '#94a3b8' : '#1e293b';
  const linkColor = isDark ? '#3b82f6' : '#3b82f6';
  const blockquoteBorder = isDark ? '#00F0FF' : '#3b82f6';
  const blockquoteText = isDark ? '#9CA3AF' : '#6B7280';
  const bold = isDark ? '#ffffff' : '#111827';
  const h2Border = isDark ? '#00F0FF' : '#3b82f6';
  const tableClass = isDark ? 'guide-table-dark' : 'guide-table-light';

  return {
    h1: ({ children }) => <h1 style={{ color: heading }} className="text-3xl font-bold mt-6 mb-3">{children}</h1>,
    h2: ({ children }) => <h2 style={{ color: heading, borderBottomColor: h2Border }} className="text-2xl font-bold mt-5 mb-2 pb-2 border-b">{children}</h2>,
    h3: ({ children }) => <h3 style={{ color: heading }} className="text-xl font-semibold mt-4 mb-2">{children}</h3>,
    h4: ({ children }) => <h4 style={{ color: mutedHeading }} className="text-base font-semibold mt-3 mb-1">{children}</h4>,
    p: ({ children }) => <p style={{ color: text }} className="text-sm leading-relaxed mb-3">{children}</p>,
    strong: ({ children }) => <strong style={{ color: bold }} className="font-bold">{children}</strong>,
    em: ({ children }) => <em style={{ color: text }} className="italic">{children}</em>,
    a: ({ href, children }) => <a href={href} style={{ color: linkColor }} className="underline hover:opacity-80" target="_blank" rel="noopener noreferrer">{children}</a>,
    blockquote: ({ children }) => <blockquote style={{ borderLeftColor: blockquoteBorder, color: blockquoteText }} className="border-l-4 pl-4 italic my-3">{children}</blockquote>,
    ul: ({ children }) => <ul style={{ color: text }} className="pl-6 my-2 list-disc">{children}</ul>,
    ol: ({ children }) => <ol style={{ color: text }} className="pl-6 my-2 list-decimal">{children}</ol>,
    li: ({ children }) => <li className="mb-1 text-sm">{children}</li>,
    hr: () => <hr style={{ borderColor: border }} className="my-4" />,
    pre: ({ children }) => <pre style={{ background: codeBg, borderColor: border }} className="rounded-lg p-4 overflow-x-auto my-3 border">{children}</pre>,
    code: ({ className, children, ...props }: any) => {
      const isInline = !className;
      if (isInline) {
        return <code style={{ color: text, background: inlineCodeBg }} className="rounded px-1 py-0.5 text-xs font-mono">{children}</code>;
      }
      return <code className={`${className || ''} font-mono text-sm`} {...props}>{children}</code>;
    },
    table: ({ children }) => (
      <div className={`overflow-x-auto my-3 ${tableClass}`}>
        <table style={{ borderColor: border }} className="w-full border-collapse border">{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead style={{ background: theadBg }}>{children}</thead>,
    th: ({ children }) => <th style={{ borderColor: border, color: thText }} className="border px-3 py-2 text-left text-xs font-semibold">{children}</th>,
    td: ({ children }) => <td style={{ borderColor: border, color: text }} className="border px-3 py-2 text-xs">{children}</td>,
    tr: ({ children, ...props }: any) => <tr {...props}>{children}</tr>,
  };
}

// --- Search Component ---

const SearchBar: React.FC<{
  searchQuery: string;
  onSearchChange: (q: string) => void;
  matchCount: number;
  currentMatch: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  isDark: boolean;
}> = ({ searchQuery, onSearchChange, matchCount, currentMatch, onNext, onPrev, onClose, isDark }) => (
  <div
    className="flex items-center gap-2 px-4 py-2 border-b transition-colors"
    style={{
      background: isDark ? '#1a1a1a' : '#f9fafb',
      borderBottomColor: isDark ? '#333333' : '#d1d5db',
    }}
  >
    <Search size={14} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
    <input
      autoFocus
      value={searchQuery}
      onChange={(e) => onSearchChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          if (e.shiftKey) onPrev();
          else onNext();
        }
        if (e.key === 'Escape') onClose();
      }}
      placeholder="Search..."
      className="bg-transparent text-sm outline-none flex-1"
      style={{ color: isDark ? '#ffffff' : '#111827' }}
    />
    {searchQuery && (
      <span className="text-xs shrink-0" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
        {matchCount > 0 ? `${currentMatch + 1}/${matchCount}` : '0 results'}
      </span>
    )}
    <button onClick={onPrev} className="p-1 rounded transition-colors" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}><ChevronUp size={14} /></button>
    <button onClick={onNext} className="p-1 rounded transition-colors" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}><ChevronDown size={14} /></button>
    <button onClick={onClose} className="p-1 rounded transition-colors" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}><X size={14} /></button>
  </div>
);

// --- Line Numbers Gutter ---

const LineNumberGutter: React.FC<{ lineCount: number; scrollTop: number; isDark: boolean }> = ({ lineCount, scrollTop, isDark }) => {
  const lines = useMemo(() => Array.from({ length: lineCount }, (_, i) => i + 1), [lineCount]);
  return (
    <div
      className="font-mono text-xs text-right pr-2 w-12 select-none overflow-hidden shrink-0 pt-4 transition-colors"
      style={{
        marginTop: -scrollTop,
        background: isDark ? '#1e1e1e' : '#f3f4f6',
        color: isDark ? '#555555' : '#9CA3AF',
      }}
    >
      {lines.map((n) => (
        <div key={n} style={{ height: '1.5rem', lineHeight: '1.5rem' }}>{n}</div>
      ))}
    </div>
  );
};

// --- Main Component ---

export const GuideEditor: React.FC<GuideEditorProps> = ({
  docId,
  docTitle,
  docMarkdown,
  onTitleChange,
  onTocUpdate,
  onMarkdownChange,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';

  const [title, setTitle] = useState(docTitle);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editBuffer, setEditBuffer] = useState('');
  const [scrollTop, setScrollTop] = useState(0);

  // Search state
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMatch, setCurrentMatch] = useState(0);

  const titleRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);

  const markdownComponents = useMemo(() => createMarkdownComponents(isDark), [isDark]);

  // Strip the AI instruction blockquote from view mode only
  const displayMarkdown = useMemo(() => {
    const lines = docMarkdown.split('\n');
    const result: string[] = [];
    let skipping = false;
    for (const line of lines) {
      if (!skipping && line.match(/^>\s*\*\*INSTRUCTIONS FOR LOVABLE \/ AI AGENTS\*\*/)) {
        skipping = true;
        continue;
      }
      if (skipping) {
        if (line.startsWith('>') || line.trim() === '') continue;
        skipping = false;
      }
      result.push(line);
    }
    return result.join('\n');
  }, [docMarkdown]);

  useEffect(() => { setTitle(docTitle); }, [docTitle]);
  useEffect(() => { onTocUpdate(extractTocFromMarkdown(docMarkdown)); }, [docMarkdown, onTocUpdate]);

  // Reset mode when doc changes
  useEffect(() => {
    setIsEditMode(false);
    setShowSearch(false);
    setSearchQuery('');
  }, [docId]);

  // Keyboard shortcut for search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setShowSearch(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Search match count
  const matchCount = useMemo(() => {
    if (!searchQuery) return 0;
    const text = docMarkdown.toLowerCase();
    const q = searchQuery.toLowerCase();
    let count = 0;
    let idx = -1;
    while ((idx = text.indexOf(q, idx + 1)) !== -1) count++;
    return count;
  }, [docMarkdown, searchQuery]);

  const navigateMatch = useCallback((direction: 'next' | 'prev') => {
    if (matchCount === 0) return;
    setCurrentMatch((prev) => {
      if (direction === 'next') return (prev + 1) % matchCount;
      return (prev - 1 + matchCount) % matchCount;
    });
  }, [matchCount]);

  const enterEditMode = useCallback(() => {
    setEditBuffer(docMarkdown);
    setIsEditMode(true);
    setScrollTop(0);
  }, [docMarkdown]);

  const enterViewMode = useCallback(() => {
    setIsEditMode(false);
  }, []);

  const handleSave = useCallback(() => {
    if (onMarkdownChange) {
      onMarkdownChange(editBuffer);
    }
    setIsEditMode(false);
  }, [editBuffer, onMarkdownChange]);

  const handleTextareaScroll = useCallback(() => {
    if (textareaRef.current) {
      setScrollTop(textareaRef.current.scrollTop);
    }
  }, []);

  const commitTitle = () => {
    setIsEditingTitle(false);
    if (docId && title !== docTitle) onTitleChange(docId, title);
  };

  const lineCount = useMemo(() => editBuffer.split('\n').length, [editBuffer]);

  // Theme-dependent colors
  const pageBg = isDark ? '#000000' : '#ffffff';
  const titleBarBorder = isDark ? '#222' : '#e5e7eb';
  const titleColor = isDark ? '#ffffff' : '#111827';
  const titleHover = isDark ? '#00F0FF' : '#3b82f6';
  const btnBg = isDark ? '#1a1a1a' : '#f3f4f6';
  const btnBorder = isDark ? '#333' : '#d1d5db';
  const btnText = isDark ? '#9CA3AF' : '#6B7280';
  const emptyText = isDark ? '#6B7280' : '#9CA3AF';
  const textareaBg = isDark ? '#0d0d0d' : '#ffffff';
  const textareaColor = isDark ? '#e2e2e2' : '#111827';

  if (!docId) {
    return (
      <div className="flex-1 flex items-center justify-center h-full transition-colors" style={{ background: pageBg }}>
        <span className="text-sm" style={{ color: emptyText }}>Select or create a document</span>
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col h-full min-w-0 transition-colors ${isDark ? 'guide-hljs-dark' : 'guide-hljs-light'}`} style={{ background: pageBg }}>
      {/* Title bar */}
      <div className="flex items-center justify-between px-4 shrink-0 transition-colors" style={{ height: 40, borderBottom: `1px solid ${titleBarBorder}` }}>
        <div className="flex-1 min-w-0">
          {isEditingTitle ? (
            <input
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => e.key === 'Enter' && commitTitle()}
              className="bg-transparent text-sm font-medium outline-none w-full"
              style={{ color: titleColor }}
              autoFocus
            />
          ) : (
            <button
              onClick={() => setIsEditingTitle(true)}
              className="text-sm font-medium truncate transition-colors text-left"
              style={{ color: titleColor }}
              onMouseEnter={(e) => { e.currentTarget.style.color = titleHover; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = titleColor; }}
            >
              {title}
            </button>
          )}
        </div>

        {/* View/Edit toggle + Save */}
        {onMarkdownChange && (
          <div className="flex items-center gap-2 ml-2 shrink-0">
            {isEditMode ? (
              <>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                >
                  <Save size={12} />
                  Save
                </button>
                <button
                  onClick={enterViewMode}
                  className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium border transition-colors"
                  style={{ background: btnBg, borderColor: btnBorder, color: btnText }}
                >
                  <Eye size={12} />
                  View
                </button>
              </>
            ) : (
              <button
                onClick={enterEditMode}
                className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium border transition-colors"
                style={{ background: btnBg, borderColor: btnBorder, color: btnText }}
              >
                <Pencil size={12} />
                Edit
              </button>
            )}
          </div>
        )}
      </div>

      {/* Search bar */}
      {showSearch && (
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={(q) => { setSearchQuery(q); setCurrentMatch(0); }}
          matchCount={matchCount}
          currentMatch={currentMatch}
          onNext={() => navigateMatch('next')}
          onPrev={() => navigateMatch('prev')}
          onClose={() => { setShowSearch(false); setSearchQuery(''); }}
          isDark={isDark}
        />
      )}

      {/* Content area */}
      {isEditMode ? (
        <div className="flex-1 flex min-h-0 overflow-hidden">
          <div className="overflow-hidden shrink-0">
            <LineNumberGutter lineCount={lineCount} scrollTop={scrollTop} isDark={isDark} />
          </div>
          <textarea
            ref={textareaRef}
            value={editBuffer}
            onChange={(e) => setEditBuffer(e.target.value)}
            onScroll={handleTextareaScroll}
            spellCheck={false}
            className="flex-1 font-mono text-sm p-4 w-full h-full resize-none border-none outline-none leading-6 transition-colors"
            style={{ background: textareaBg, color: textareaColor }}
          />
        </div>
      ) : (
        <div ref={viewRef} className="flex-1 overflow-y-auto min-h-0">
          <div className="max-w-4xl p-6">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={markdownComponents}
            >
              {displayMarkdown}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};
