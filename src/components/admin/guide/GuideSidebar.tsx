import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { GuideFreshnessState } from './guide-freshness';

export interface GuideDocument {
  id: string;
  title: string;
  sort_order: number;
  updated_at: string;
  content: unknown;
  freshness: GuideFreshnessState;
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
  theme?: 'dark' | 'light';
}

export const GuideSidebar: React.FC<GuideSidebarProps> = ({
  documents,
  activeDocId,
  tocEntries,
  onSelectDoc,
  onNewDoc,
  onDeleteDoc,
  onTocClick,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';

  const bg = isDark ? '#111111' : '#f5f5f5';
  const headerText = isDark ? '#9CA3AF' : '#6B7280';
  const sectionLabel = isDark ? '#6B7280' : '#9CA3AF';
  const itemText = isDark ? '#9CA3AF' : '#6B7280';
  const itemTextHover = isDark ? '#ffffff' : '#111827';
  const activeText = isDark ? '#ffffff' : '#111827';
  const activeBg = isDark ? '#2a2a2a' : '#e5e7eb';
  const divider = isDark ? '#333' : '#d1d5db';
  const tocText = isDark ? '#9CA3AF' : '#6B7280';
  const tocEmptyText = isDark ? '#4B5563' : '#9CA3AF';
  const newDocText = isDark ? '#6B7280' : '#9CA3AF';

  const getFreshnessStyles = (kind: GuideFreshnessState['kind']) => {
    switch (kind) {
      case 'fresh':
        return { bg: '#16a34a', text: '#dcfce7' };
      case 'aging':
        return { bg: '#f59e0b', text: '#fef3c7' };
      case 'stale':
        return { bg: '#ef4444', text: '#fee2e2' };
      default:
        return { bg: '#64748b', text: '#e2e8f0' };
    }
  };

  return (
    <div className="w-60 shrink-0 flex flex-col h-full transition-colors" style={{ background: bg }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <span className="text-[10px] uppercase tracking-[0.15em] font-semibold" style={{ color: headerText }}>
          App Guide
        </span>
      </div>

      {/* Documents section */}
      <div className="px-3 pt-2 pb-1">
        <span className="text-[10px] uppercase tracking-[0.12em] font-medium" style={{ color: sectionLabel }}>
          Documents
        </span>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="px-2 pb-2 flex flex-col gap-0.5">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="group flex items-center gap-1 rounded transition-colors"
              style={
                activeDocId === doc.id
                  ? { background: activeBg, borderLeft: '2px solid #00F0FF', color: activeText }
                  : { borderLeft: '2px solid transparent', color: itemText }
              }
              onMouseEnter={(e) => { if (activeDocId !== doc.id) e.currentTarget.style.color = itemTextHover; }}
              onMouseLeave={(e) => { if (activeDocId !== doc.id) e.currentTarget.style.color = itemText; }}
            >
              <button
                onClick={() => onSelectDoc(doc.id)}
                className="flex-1 text-left px-3 py-1.5 text-xs truncate min-w-0"
                title={doc.title}
                style={{ color: 'inherit' }}
              >
                {doc.title}
              </button>
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.08em] px-1.5 py-0.5 rounded shrink-0"
                style={{
                  background: getFreshnessStyles(doc.freshness.kind).bg,
                  color: getFreshnessStyles(doc.freshness.kind).text,
                }}
                title={`${doc.freshness.label}: ${doc.freshness.detail}`}
              >
                {doc.freshness.label}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteDoc(doc.id); }}
                className="p-1 mr-1 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all shrink-0"
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
            className="flex items-center gap-1.5 text-[10px] transition-colors px-3 py-1.5 w-full"
            style={{ color: newDocText }}
            onMouseEnter={(e) => { e.currentTarget.style.color = itemTextHover; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = newDocText; }}
          >
            <Plus className="w-3 h-3" />
            New Document
          </button>
        </div>
      </div>

      <div className="h-px w-full" style={{ background: divider }} />

      {/* TOC section */}
      <div className="px-3 pt-3 pb-1">
        <span className="text-[10px] uppercase tracking-[0.12em] font-medium" style={{ color: sectionLabel }}>
          On This Page
        </span>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="px-2 pb-4 flex flex-col gap-0.5">
          {tocEntries.map((entry) => (
            <button
              key={entry.id}
              onClick={() => onTocClick(entry.id)}
              className={`w-full text-left text-xs transition-colors truncate py-0.5 ${
                entry.level === 2 ? 'ml-3' : entry.level === 3 ? 'ml-6' : ''
              }`}
              style={{ color: tocText, paddingLeft: entry.level === 1 ? '12px' : undefined }}
              onMouseEnter={(e) => { e.currentTarget.style.color = itemTextHover; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = tocText; }}
            >
              {entry.text}
            </button>
          ))}
          {tocEntries.length === 0 && (
            <span className="text-[10px] px-3 italic" style={{ color: tocEmptyText }}>No headings yet</span>
          )}
        </div>
      </div>
    </div>
  );
};
