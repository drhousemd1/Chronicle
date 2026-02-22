import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

export interface GuideDocument {
  id: string;
  title: string;
  sort_order: number;
}

export interface TocEntry {
  id: string;
  text: string;
  level: number;
}

interface GuideSidebarProps {
  documents: GuideDocument[];
  activeDocId: string | null;
  tocEntries: TocEntry[];
  onSelectDoc: (id: string) => void;
  onNewDoc: () => void;
  onDeleteDoc: (id: string) => void;
  onTocClick: (blockId: string) => void;
}

export const GuideSidebar: React.FC<GuideSidebarProps> = ({
  documents,
  activeDocId,
  tocEntries,
  onSelectDoc,
  onNewDoc,
  onDeleteDoc,
  onTocClick,
}) => {
  return (
    <div className="w-60 shrink-0 flex flex-col h-full" style={{ background: '#111111' }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <span className="text-[10px] uppercase tracking-[0.15em] text-[#9CA3AF] font-semibold">
          App Guide
        </span>
      </div>

      {/* Documents section */}
      <div className="px-3 pt-2 pb-1">
        <span className="text-[10px] uppercase tracking-[0.12em] text-[#6B7280] font-medium">
          Documents
        </span>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="px-2 pb-2 flex flex-col gap-0.5">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className={`group flex items-center gap-1 rounded transition-colors ${
                activeDocId === doc.id ? 'text-white' : 'text-[#9CA3AF] hover:text-white'
              }`}
              style={
                activeDocId === doc.id
                  ? { background: '#2a2a2a', borderLeft: '2px solid #00F0FF' }
                  : { borderLeft: '2px solid transparent' }
              }
            >
              <button
                onClick={() => onSelectDoc(doc.id)}
                className="flex-1 text-left px-3 py-1.5 text-xs truncate min-w-0"
              >
                {doc.title}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteDoc(doc.id); }}
                className="p-1 mr-1 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all shrink-0"
                title="Delete document"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
        <div className="px-2 pb-3">
          <button
            onClick={onNewDoc}
            className="flex items-center gap-1.5 text-[10px] text-[#6B7280] hover:text-white transition-colors px-3 py-1.5 w-full"
          >
            <Plus className="w-3 h-3" />
            New Document
          </button>
        </div>
      </div>

      <div className="h-px w-full bg-[#333]" />

      {/* TOC section */}
      <div className="px-3 pt-3 pb-1">
        <span className="text-[10px] uppercase tracking-[0.12em] text-[#6B7280] font-medium">
          On This Page
        </span>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="px-2 pb-4 flex flex-col gap-0.5">
          {tocEntries.map((entry) => (
            <button
              key={entry.id}
              onClick={() => onTocClick(entry.id)}
              className={`w-full text-left text-xs text-[#9CA3AF] hover:text-white transition-colors truncate py-0.5 ${
                entry.level === 2 ? 'ml-3' : entry.level === 3 ? 'ml-6' : ''
              }`}
              style={{ paddingLeft: entry.level === 1 ? '12px' : undefined }}
            >
              {entry.text}
            </button>
          ))}
          {tocEntries.length === 0 && (
            <span className="text-[10px] text-[#4B5563] px-3 italic">No headings yet</span>
          )}
        </div>
      </div>
    </div>
  );
};
