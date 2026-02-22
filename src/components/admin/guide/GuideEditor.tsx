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

// --- Image compression & upload utility ---

async function compressImage(file: File, maxWidth = 1024, quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = img.width > maxWidth ? maxWidth / img.width : 1;
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))),
        'image/jpeg',
        quality,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

async function uploadGuideImage(file: File): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const compressed = await compressImage(file);
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  const path = `${user.id}/${ts}-${rand}.jpg`;

  const { error } = await supabase.storage
    .from('guide_images')
    .upload(path, compressed, { contentType: 'image/jpeg', upsert: false });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('guide_images')
    .getPublicUrl(path);

  return publicUrl;
}

function insertImageAtCursor(editorEl: HTMLDivElement, url: string) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) {
    // Fallback: append at end
    const img = document.createElement('img');
    img.src = url;
    img.alt = '';
    img.style.maxWidth = '100%';
    editorEl.appendChild(img);
    return;
  }
  const range = sel.getRangeAt(0);
  // Ensure range is inside editor
  if (!editorEl.contains(range.commonAncestorContainer)) {
    const img = document.createElement('img');
    img.src = url;
    img.alt = '';
    img.style.maxWidth = '100%';
    editorEl.appendChild(img);
    return;
  }
  range.deleteContents();
  const img = document.createElement('img');
  img.src = url;
  img.alt = '';
  img.style.maxWidth = '100%';
  range.insertNode(img);
  // Move cursor after image
  range.setStartAfter(img);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
}

// --- Component ---

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
  const [isDragOver, setIsDragOver] = useState(false);
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

  // --- Paste handler ---
  const handlePaste = useCallback(async (e: React.ClipboardEvent<HTMLDivElement>) => {
    if (!editorRef.current || !onMarkdownChange) return;

    const clipboardData = e.clipboardData;

    // Check for image files in clipboard (screenshots, copied images)
    const imageFile = Array.from(clipboardData.files).find(f => f.type.startsWith('image/'));
    if (imageFile) {
      e.preventDefault();
      try {
        const url = await uploadGuideImage(imageFile);
        insertImageAtCursor(editorRef.current, url);
        handleInput();
      } catch (err) {
        console.error('Failed to upload pasted image:', err);
      }
      return;
    }

    // Also check for image items (some browsers use items instead of files)
    const imageItem = Array.from(clipboardData.items).find(item => item.type.startsWith('image/'));
    if (imageItem) {
      const file = imageItem.getAsFile();
      if (file) {
        e.preventDefault();
        try {
          const url = await uploadGuideImage(file);
          insertImageAtCursor(editorRef.current, url);
          handleInput();
        } catch (err) {
          console.error('Failed to upload pasted image:', err);
        }
        return;
      }
    }

    // Text paste: strip formatting, insert as plain text
    const plainText = clipboardData.getData('text/plain');
    if (plainText) {
      e.preventDefault();
      document.execCommand('insertText', false, plainText);
      // handleInput fires via onInput event from execCommand
    }
  }, [onMarkdownChange, handleInput]);

  // --- Drop handler ---
  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    setIsDragOver(false);
    if (!editorRef.current || !onMarkdownChange) return;

    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length === 0) return; // Let default handle non-image drops

    e.preventDefault();
    e.stopPropagation();

    for (const file of files) {
      try {
        const url = await uploadGuideImage(file);
        insertImageAtCursor(editorRef.current, url);
      } catch (err) {
        console.error('Failed to upload dropped image:', err);
      }
    }
    handleInput();
  }, [onMarkdownChange, handleInput]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    const hasImages = Array.from(e.dataTransfer.types).includes('Files');
    if (hasImages) {
      e.preventDefault();
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

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
          onPaste={handlePaste}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`guide-preview max-w-4xl p-6 outline-none min-h-full transition-all ${
            isDragOver ? 'ring-2 ring-[#00F0FF] ring-inset bg-[#00F0FF]/5' : ''
          }`}
          suppressContentEditableWarning
          spellCheck={false}
        />
      </div>
    </div>
  );
};
