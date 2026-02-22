import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { TocEntry } from './GuideSidebar';

interface GuideEditorProps {
  docId: string | null;
  docTitle: string;
  docContent: any | null;
  onTitleChange: (id: string, newTitle: string) => void;
  onTocUpdate: (entries: TocEntry[]) => void;
}

export const GuideEditor: React.FC<GuideEditorProps> = ({
  docId,
  docTitle,
  docContent,
  onTitleChange,
  onTocUpdate,
}) => {
  const [title, setTitle] = useState(docTitle);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  const editor = useCreateBlockNote({
    initialContent: docContent || undefined,
  }, [docId]); // Re-create editor when doc changes

  // Sync title from props
  useEffect(() => {
    setTitle(docTitle);
  }, [docTitle]);

  // Extract TOC from editor content
  const extractToc = useCallback(() => {
    if (!editor) return;
    const blocks = editor.document;
    const entries: TocEntry[] = [];
    for (const block of blocks) {
      if (block.type === 'heading' && block.content) {
        const text = (block.content as any[])
          .map((c: any) => (typeof c === 'string' ? c : c.text || ''))
          .join('');
        if (text.trim()) {
          entries.push({
            id: block.id,
            text: text.trim(),
            level: (block.props as any)?.level || 1,
          });
        }
      }
    }
    onTocUpdate(entries);
  }, [editor, onTocUpdate]);

  // Update TOC on content change
  useEffect(() => {
    if (!editor) return;
    extractToc();
    const handler = () => {
      setHasUnsaved(true);
      extractToc();
    };
    editor.onChange(handler);
  }, [editor, extractToc]);

  // Save function
  const handleSave = useCallback(async () => {
    if (!docId || !editor) return;
    const blocks = editor.document;
    const markdown = await editor.blocksToMarkdownLossy(blocks);

    const { error } = await (supabase as any)
      .from('guide_documents')
      .update({
        content: blocks,
        markdown,
        updated_at: new Date().toISOString(),
      })
      .eq('id', docId);

    if (error) {
      toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
    } else {
      setHasUnsaved(false);
      setLastSaved(new Date());
      toast({ title: 'Guide saved' });
    }
  }, [docId, editor]);

  // Cmd/Ctrl+S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSave]);

  // Save title on blur/Enter
  const commitTitle = () => {
    setIsEditingTitle(false);
    if (docId && title !== docTitle) {
      onTitleChange(docId, title);
    }
  };

  if (!docId) {
    return (
      <div className="flex-1 flex items-center justify-center h-full" style={{ background: '#0d0d0d' }}>
        <span className="text-[#6B7280] text-sm">Select or create a document</span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full min-w-0" style={{ background: '#0d0d0d' }}>
      {/* Top bar */}
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
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors"
            >
              Save
            </button>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <BlockNoteView editor={editor} theme="dark" />
      </div>
    </div>
  );
};
