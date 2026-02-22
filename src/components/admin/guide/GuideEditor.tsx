import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { TocEntry } from './GuideSidebar';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface GuideEditorProps {
  docId: string | null;
  docTitle: string;
  docMarkdown: string;
  onTitleChange: (id: string, newTitle: string) => void;
  onTocUpdate: (entries: TocEntry[]) => void;
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

export const GuideEditor: React.FC<GuideEditorProps> = ({
  docId,
  docTitle,
  docMarkdown,
  onTitleChange,
  onTocUpdate,
}) => {
  const [title, setTitle] = useState(docTitle);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setTitle(docTitle); }, [docTitle]);

  useEffect(() => {
    onTocUpdate(extractTocFromMarkdown(docMarkdown));
  }, [docMarkdown, onTocUpdate]);

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

      {/* Rendered markdown */}
      <div className="flex-1 overflow-y-auto min-h-0 p-6">
        <div className="guide-preview max-w-4xl">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {docMarkdown}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};
