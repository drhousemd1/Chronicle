import React, { useState, useCallback } from 'react';
import { Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered, Code, Table, Minus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface GuideEditorToolbarProps {
  editorRef: React.RefObject<HTMLDivElement>;
  onInput: () => void;
}

const execCmd = (command: string, value?: string) => {
  document.execCommand(command, false, value);
};

const ToolButton: React.FC<{
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
}> = ({ icon, title, onClick }) => (
  <button
    type="button"
    title={title}
    onMouseDown={(e) => {
      e.preventDefault(); // preserve selection in contentEditable
      onClick();
    }}
    className="p-1.5 rounded hover:bg-white/10 text-[hsl(var(--ui-text-muted))] hover:text-[hsl(var(--ui-text))] transition-colors"
  >
    {icon}
  </button>
);

function generateTableHTML(cols: number, rows: number): string {
  const headerCells = Array.from({ length: cols }, (_, i) => `<th>Col ${i + 1}</th>`).join('');
  const dataRow = Array.from({ length: cols }, () => '<td>&nbsp;</td>').join('');
  const dataRows = Array.from({ length: rows }, () => `<tr>${dataRow}</tr>`).join('');
  return `<table><thead><tr>${headerCells}</tr></thead><tbody>${dataRows}</tbody></table><p><br></p>`;
}

const TableGrid: React.FC<{ onSelect: (cols: number, rows: number) => void }> = ({ onSelect }) => {
  const [hoverCol, setHoverCol] = useState(0);
  const [hoverRow, setHoverRow] = useState(0);
  const maxCols = 5;
  const maxRows = 5;

  return (
    <div className="p-2">
      <p className="text-xs text-[hsl(var(--ui-text-muted))] mb-2 text-center">
        {hoverCol > 0 && hoverRow > 0 ? `${hoverCol} × ${hoverRow}` : 'Select size'}
      </p>
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${maxCols}, 1fr)` }}>
        {Array.from({ length: maxRows }, (_, row) =>
          Array.from({ length: maxCols }, (_, col) => (
            <button
              key={`${row}-${col}`}
              type="button"
              className={`w-6 h-6 rounded-sm border transition-colors ${
                col < hoverCol && row < hoverRow
                  ? 'bg-blue-500 border-blue-400'
                  : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
              onMouseEnter={() => { setHoverCol(col + 1); setHoverRow(row + 1); }}
              onMouseDown={(e) => { e.preventDefault(); onSelect(col + 1, row + 1); }}
            />
          ))
        )}
      </div>
    </div>
  );
};

export const GuideEditorToolbar: React.FC<GuideEditorToolbarProps> = ({ editorRef, onInput }) => {
  const [tableOpen, setTableOpen] = useState(false);

  const focusEditor = useCallback(() => {
    editorRef.current?.focus();
  }, [editorRef]);

  const handleFormat = useCallback((command: string, value?: string) => {
    focusEditor();
    execCmd(command, value);
    onInput();
  }, [focusEditor, onInput]);

  const handleCodeBlock = useCallback(() => {
    focusEditor();
    const sel = window.getSelection();
    const text = sel?.toString() || 'code';
    const pre = document.createElement('pre');
    const code = document.createElement('code');
    code.textContent = text;
    pre.appendChild(code);
    
    // Delete current selection and insert the pre block
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(pre);
      // Move cursor after the pre block
      range.setStartAfter(pre);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    }
    onInput();
  }, [focusEditor, onInput]);

  const handleTableSelect = useCallback((cols: number, rows: number) => {
    setTableOpen(false);
    focusEditor();
    execCmd('insertHTML', generateTableHTML(cols, rows));
    onInput();
  }, [focusEditor, onInput]);

  const s = 14;

  return (
    <div className="flex items-center gap-0.5 px-4 py-1.5 border-b border-white/10 bg-white/[0.02] shrink-0">
      <ToolButton icon={<Bold size={s} />} title="Bold" onClick={() => handleFormat('bold')} />
      <ToolButton icon={<Italic size={s} />} title="Italic" onClick={() => handleFormat('italic')} />
      <div className="w-px h-4 bg-white/10 mx-1" />
      <ToolButton icon={<Heading1 size={s} />} title="Heading 1" onClick={() => handleFormat('formatBlock', 'h1')} />
      <ToolButton icon={<Heading2 size={s} />} title="Heading 2" onClick={() => handleFormat('formatBlock', 'h2')} />
      <ToolButton icon={<Heading3 size={s} />} title="Heading 3" onClick={() => handleFormat('formatBlock', 'h3')} />
      <div className="w-px h-4 bg-white/10 mx-1" />
      <ToolButton icon={<List size={s} />} title="Bullet List" onClick={() => handleFormat('insertUnorderedList')} />
      <ToolButton icon={<ListOrdered size={s} />} title="Numbered List" onClick={() => handleFormat('insertOrderedList')} />
      <div className="w-px h-4 bg-white/10 mx-1" />
      <ToolButton icon={<Code size={s} />} title="Code Block" onClick={handleCodeBlock} />

      <Popover open={tableOpen} onOpenChange={setTableOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            title="Insert Table"
            onMouseDown={(e) => e.preventDefault()}
            className="p-1.5 rounded hover:bg-white/10 text-[hsl(var(--ui-text-muted))] hover:text-[hsl(var(--ui-text))] transition-colors"
          >
            <Table size={s} />
          </button>
        </PopoverTrigger>
        <PopoverContent side="bottom" align="start" className="w-auto bg-[#1a1a1a] border-white/10 p-0">
          <TableGrid onSelect={handleTableSelect} />
        </PopoverContent>
      </Popover>

      <ToolButton icon={<Minus size={s} />} title="Horizontal Rule" onClick={() => handleFormat('insertHorizontalRule')} />
    </div>
  );
};
