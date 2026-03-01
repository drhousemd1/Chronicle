import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { Pencil, Eye, Save, Search, X, ChevronUp, ChevronDown } from 'lucide-react';
import type { TocEntry } from './GuideSidebar';

interface GuideEditorProps {
  docId: string | null;
  docTitle: string;
  docMarkdown: string;
  onTitleChange: (id: string, newTitle: string) => void;
  onTocUpdate: (entries: TocEntry[]) => void;
  onMarkdownChange?: (markdown: string) => void;
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

// --- Markdown components for ReactMarkdown (dark theme) ---

const markdownComponents: Record<string, React.FC<any>> = {
  h1: ({ children }) => <h1 className="text-white text-3xl font-bold mt-6 mb-3">{children}</h1>,
  h2: ({ children }) => <h2 className="text-white text-2xl font-bold mt-5 mb-2 pb-2 border-b border-[#333333]">{children}</h2>,
  h3: ({ children }) => <h3 className="text-white text-xl font-semibold mt-4 mb-2">{children}</h3>,
  h4: ({ children }) => <h4 className="text-gray-400 text-base font-semibold mt-3 mb-1">{children}</h4>,
  p: ({ children }) => <p className="text-[#e2e2e2] text-sm leading-relaxed mb-3">{children}</p>,
  strong: ({ children }) => <strong className="text-white font-bold">{children}</strong>,
  em: ({ children }) => <em className="text-[#e2e2e2] italic">{children}</em>,
  a: ({ href, children }) => <a href={href} className="text-blue-400 underline hover:text-blue-300" target="_blank" rel="noopener noreferrer">{children}</a>,
  blockquote: ({ children }) => <blockquote className="border-l-4 border-[#444444] pl-4 text-gray-400 italic my-3">{children}</blockquote>,
  ul: ({ children }) => <ul className="text-[#e2e2e2] pl-6 my-2 list-disc">{children}</ul>,
  ol: ({ children }) => <ol className="text-[#e2e2e2] pl-6 my-2 list-decimal">{children}</ol>,
  li: ({ children }) => <li className="mb-1 text-sm">{children}</li>,
  hr: () => <hr className="border-[#333333] my-4" />,
  pre: ({ children }) => <pre className="bg-[#1e1e1e] rounded-lg p-4 overflow-x-auto my-3 border border-[#333333]">{children}</pre>,
  code: ({ className, children, ...props }: any) => {
    const isInline = !className;
    if (isInline) {
      return <code className="text-[#e2e2e2] bg-[#2a2a2a] rounded px-1 py-0.5 text-xs font-mono">{children}</code>;
    }
    return <code className={`${className || ''} font-mono text-sm`} {...props}>{children}</code>;
  },
  table: ({ children }) => (
    <div className="overflow-x-auto my-3">
      <table className="w-full border-collapse border border-[#333333]">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-[#1a1a1a]">{children}</thead>,
  th: ({ children }) => <th className="border border-[#333333] px-3 py-2 text-left text-white text-xs font-semibold">{children}</th>,
  td: ({ children }) => <td className="border border-[#333333] px-3 py-2 text-[#e2e2e2] text-xs">{children}</td>,
  tr: ({ children, ...props }: any) => <tr className="even:bg-[#111111]" {...props}>{children}</tr>,
};

// --- Search Component ---

const SearchBar: React.FC<{
  searchQuery: string;
  onSearchChange: (q: string) => void;
  matchCount: number;
  currentMatch: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}> = ({ searchQuery, onSearchChange, matchCount, currentMatch, onNext, onPrev, onClose }) => (
  <div className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border-b border-[#333333]">
    <Search size={14} className="text-gray-500 shrink-0" />
    <input
      autoFocus
      value={searchQuery}
      onChange={(e) => onSearchChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { e.shiftKey ? onPrev() : onNext(); }
        if (e.key === 'Escape') onClose();
      }}
      placeholder="Search..."
      className="bg-transparent text-white text-sm outline-none flex-1 placeholder-gray-500"
    />
    {searchQuery && (
      <span className="text-xs text-gray-400 shrink-0">
        {matchCount > 0 ? `${currentMatch + 1}/${matchCount}` : '0 results'}
      </span>
    )}
    <button onClick={onPrev} className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white"><ChevronUp size={14} /></button>
    <button onClick={onNext} className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white"><ChevronDown size={14} /></button>
    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white"><X size={14} /></button>
  </div>
);

// --- Line Numbers Gutter ---

const LineNumberGutter: React.FC<{ lineCount: number; scrollTop: number }> = ({ lineCount, scrollTop }) => {
  const lines = useMemo(() => Array.from({ length: lineCount }, (_, i) => i + 1), [lineCount]);
  return (
    <div
      className="bg-[#1e1e1e] text-[#555555] font-mono text-xs text-right pr-2 w-12 select-none overflow-hidden shrink-0 pt-4"
      style={{ marginTop: -scrollTop }}
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
}) => {
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

  // Search match count (simple text search in markdown)
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

  // Enter edit mode
  const enterEditMode = useCallback(() => {
    setEditBuffer(docMarkdown);
    setIsEditMode(true);
    setScrollTop(0);
  }, [docMarkdown]);

  // Enter view mode (discard unsaved changes)
  const enterViewMode = useCallback(() => {
    setIsEditMode(false);
  }, []);

  // Save from edit mode
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

        {/* View/Edit toggle + Save */}
        {onMarkdownChange && (
          <div className="flex items-center gap-2 ml-2 shrink-0">
            {isEditMode ? (
              <>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                >
                  <Save size={12} />
                  Save
                </button>
                <button
                  onClick={enterViewMode}
                  className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium bg-[#1a1a1a] border border-[#333] text-gray-400 hover:text-white transition-colors"
                >
                  <Eye size={12} />
                  View
                </button>
              </>
            ) : (
              <button
                onClick={enterEditMode}
                className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium bg-[#1a1a1a] border border-[#333] text-gray-400 hover:text-white transition-colors"
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
        />
      )}

      {/* Content area */}
      {isEditMode ? (
        /* Edit mode: raw markdown textarea with line numbers */
        <div className="flex-1 flex min-h-0 overflow-hidden">
          <div className="overflow-hidden shrink-0">
            <LineNumberGutter lineCount={lineCount} scrollTop={scrollTop} />
          </div>
          <textarea
            ref={textareaRef}
            value={editBuffer}
            onChange={(e) => setEditBuffer(e.target.value)}
            onScroll={handleTextareaScroll}
            spellCheck={false}
            className="flex-1 bg-[#0d0d0d] text-[#e2e2e2] font-mono text-sm p-4 w-full h-full resize-none border-none outline-none leading-6"
          />
        </div>
      ) : (
        /* View mode: rendered markdown */
        <div ref={viewRef} className="flex-1 overflow-y-auto min-h-0">
          <div className="max-w-4xl p-6">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={markdownComponents}
            >
              {docMarkdown}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};
