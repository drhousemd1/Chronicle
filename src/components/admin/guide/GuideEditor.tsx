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

  // Custom rule: preserve <img> with width/style as raw HTML so size persists
  td.addRule('imgWithWidth', {
    filter: (node) => {
      return node.nodeName === 'IMG' && !!(
        (node as HTMLImageElement).getAttribute('width') ||
        (node as HTMLImageElement).style.width
      );
    },
    replacement: (_content, node) => {
      const img = node as HTMLImageElement;
      const src = img.getAttribute('src') || '';
      const alt = img.getAttribute('alt') || '';
      const width = img.getAttribute('width') || img.style.width;
      // Strip resize handles data attribute if present
      const widthAttr = width ? ` width="${width.replace('px', '')}"` : '';
      return `\n\n<img src="${src}" alt="${alt}"${widthAttr} style="max-width:100%" />\n\n`;
    },
  });

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
    const img = document.createElement('img');
    img.src = url;
    img.alt = '';
    img.style.maxWidth = '100%';
    editorEl.appendChild(img);
    return;
  }
  const range = sel.getRangeAt(0);
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
  range.setStartAfter(img);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
}

// --- Resize handles helpers ---

const HANDLE_SIZE = 8;
const HANDLE_POSITIONS = ['nw', 'ne', 'sw', 'se'] as const;
type HandlePos = typeof HANDLE_POSITIONS[number];

const HANDLE_CURSORS: Record<HandlePos, string> = {
  nw: 'nwse-resize',
  ne: 'nesw-resize',
  sw: 'nesw-resize',
  se: 'nwse-resize',
};

function createHandle(pos: HandlePos): HTMLDivElement {
  const h = document.createElement('div');
  h.dataset.resizeHandle = pos;
  h.style.cssText = `
    position:absolute; width:${HANDLE_SIZE}px; height:${HANDLE_SIZE}px;
    background:#3b82f6; border:1px solid #fff; border-radius:1px;
    cursor:${HANDLE_CURSORS[pos]}; z-index:10; touch-action:none;
  `;
  return h;
}

function positionHandles(wrapper: HTMLDivElement, img: HTMLImageElement) {
  const handles = wrapper.querySelectorAll<HTMLDivElement>('[data-resize-handle]');
  const w = img.offsetWidth;
  const h = img.offsetHeight;
  const half = HANDLE_SIZE / 2;
  handles.forEach((el) => {
    const pos = el.dataset.resizeHandle as HandlePos;
    switch (pos) {
      case 'nw': el.style.top = `${-half}px`; el.style.left = `${-half}px`; break;
      case 'ne': el.style.top = `${-half}px`; el.style.left = `${w - half}px`; break;
      case 'sw': el.style.top = `${h - half}px`; el.style.left = `${-half}px`; break;
      case 'se': el.style.top = `${h - half}px`; el.style.left = `${w - half}px`; break;
    }
  });
}

function removeResizeUI(editorEl: HTMLDivElement) {
  editorEl.querySelectorAll<HTMLDivElement>('[data-resize-wrapper]').forEach((w) => {
    const img = w.querySelector('img');
    if (img) {
      w.parentNode?.insertBefore(img, w);
    }
    w.remove();
  });
}

function wrapImageWithHandles(
  img: HTMLImageElement,
  editorEl: HTMLDivElement,
  onResizeEnd: () => void,
) {
  // Already wrapped?
  if (img.parentElement?.dataset.resizeWrapper) return;

  const wrapper = document.createElement('div');
  wrapper.dataset.resizeWrapper = '1';
  wrapper.style.cssText = 'position:relative; display:inline-block;';
  img.parentNode?.insertBefore(wrapper, img);
  wrapper.appendChild(img);

  // Outline on image
  img.style.outline = '2px solid #3b82f6';

  HANDLE_POSITIONS.forEach((pos) => {
    const handle = createHandle(pos);
    wrapper.appendChild(handle);

    const startResize = (startX: number, startY: number) => {
      const startWidth = img.offsetWidth;
      const aspectRatio = img.naturalHeight / img.naturalWidth || img.offsetHeight / img.offsetWidth;
      const maxWidth = editorEl.offsetWidth - 48; // padding

      const onMove = (cx: number, _cy: number) => {
        let deltaX = cx - startX;
        if (pos === 'nw' || pos === 'sw') deltaX = -deltaX;
        const newWidth = Math.max(50, Math.min(maxWidth, startWidth + deltaX));
        img.style.width = `${newWidth}px`;
        img.style.height = `${Math.round(newWidth * aspectRatio)}px`;
        img.setAttribute('width', String(Math.round(newWidth)));
        positionHandles(wrapper, img);
      };

      const onEnd = () => {
        document.removeEventListener('mousemove', mouseMove);
        document.removeEventListener('mouseup', mouseUp);
        document.removeEventListener('touchmove', touchMove);
        document.removeEventListener('touchend', touchEnd);
        onResizeEnd();
      };

      const mouseMove = (e: MouseEvent) => { e.preventDefault(); onMove(e.clientX, e.clientY); };
      const mouseUp = () => onEnd();
      const touchMove = (e: TouchEvent) => { e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY); };
      const touchEnd = () => onEnd();

      document.addEventListener('mousemove', mouseMove);
      document.addEventListener('mouseup', mouseUp);
      document.addEventListener('touchmove', touchMove, { passive: false });
      document.addEventListener('touchend', touchEnd);
    };

    handle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      startResize(e.clientX, e.clientY);
    });
    handle.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      startResize(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });
  });

  positionHandles(wrapper, img);
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
  const selectedImgRef = useRef<HTMLImageElement | null>(null);

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
  }, [docId]);

  const handleInput = useCallback(() => {
    if (isInitializing.current) return;
    if (!editorRef.current || !onMarkdownChange) return;
    // Strip resize wrappers before converting
    const clone = editorRef.current.cloneNode(true) as HTMLDivElement;
    clone.querySelectorAll('[data-resize-wrapper]').forEach((w) => {
      const img = w.querySelector('img');
      if (img) {
        img.style.outline = '';
        w.parentNode?.insertBefore(img, w);
      }
      w.remove();
    });
    clone.querySelectorAll('[data-resize-handle]').forEach((h) => h.remove());
    const html = clone.innerHTML;
    const md = turndown.turndown(html);
    onMarkdownChange(md);
  }, [onMarkdownChange]);

  // --- Image click-to-select for resize ---
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || !onMarkdownChange) return;

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Ignore clicks on handles
      if (target.dataset.resizeHandle) return;

      if (target.tagName === 'IMG') {
        const img = target as HTMLImageElement;
        if (selectedImgRef.current === img) return;

        // Remove existing handles
        removeResizeUI(editor);
        selectedImgRef.current = img;
        wrapImageWithHandles(img, editor, handleInput);
      } else {
        // Deselect
        if (selectedImgRef.current) {
          selectedImgRef.current.style.outline = '';
          selectedImgRef.current = null;
          removeResizeUI(editor);
        }
      }
    };

    editor.addEventListener('click', onClick);
    return () => editor.removeEventListener('click', onClick);
  }, [onMarkdownChange, handleInput]);

  // --- Paste handler ---
  const handlePaste = useCallback(async (e: React.ClipboardEvent<HTMLDivElement>) => {
    if (!editorRef.current || !onMarkdownChange) return;

    const clipboardData = e.clipboardData;

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

    const plainText = clipboardData.getData('text/plain');
    if (plainText) {
      e.preventDefault();
      document.execCommand('insertText', false, plainText);
    }
  }, [onMarkdownChange, handleInput]);

  // --- Drop handler ---
  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    setIsDragOver(false);
    if (!editorRef.current || !onMarkdownChange) return;

    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length === 0) return;

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
