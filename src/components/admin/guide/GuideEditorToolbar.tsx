import React, { useState, useCallback } from 'react';
import { Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered, Code, Table, Minus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface GuideEditorToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  value: string;
  onChange: (newValue: string) => void;
}

type FormatAction = (textarea: HTMLTextAreaElement, value: string) => { newValue: string; cursorPos: number };

const wrapSelection: (before: string, after: string) => FormatAction = (before, after) => (textarea, value) => {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = value.slice(start, end);
  const replacement = `${before}${selected || 'text'}${after}`;
  const newValue = value.slice(0, start) + replacement + value.slice(end);
  const cursorPos = selected ? start + replacement.length : start + before.length + 4;
  return { newValue, cursorPos };
};

const prependLine: (prefix: string) => FormatAction = (prefix) => (textarea, value) => {
  const start = textarea.selectionStart;
  const lineStart = value.lastIndexOf('\n', start - 1) + 1;
  const newValue = value.slice(0, lineStart) + prefix + value.slice(lineStart);
  return { newValue, cursorPos: start + prefix.length };
};

const insertAtCursor: (text: string) => FormatAction = (text) => (textarea, value) => {
  const start = textarea.selectionStart;
  const newValue = value.slice(0, start) + text + value.slice(start);
  return { newValue, cursorPos: start + text.length };
};

const codeBlockAction: FormatAction = (textarea, value) => {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = value.slice(start, end);
  const block = `\n\`\`\`\n${selected || 'code'}\n\`\`\`\n`;
  const newValue = value.slice(0, start) + block + value.slice(end);
  const cursorPos = selected ? start + block.length : start + 5;
  return { newValue, cursorPos };
};

function generateTable(cols: number, rows: number): string {
  const header = '| ' + Array.from({ length: cols }, (_, i) => `Col ${i + 1}`).join(' | ') + ' |';
  const separator = '| ' + Array.from({ length: cols }, () => '---').join(' | ') + ' |';
  const emptyRow = '| ' + Array.from({ length: cols }, () => '   ').join(' | ') + ' |';
  const dataRows = Array.from({ length: rows }, () => emptyRow).join('\n');
  return `\n${header}\n${separator}\n${dataRows}\n`;
}

const ToolButton: React.FC<{
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
}> = ({ icon, title, onClick }) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    className="p-1.5 rounded hover:bg-white/10 text-[hsl(var(--ui-text-muted))] hover:text-[hsl(var(--ui-text))] transition-colors"
  >
    {icon}
  </button>
);

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
              onClick={() => onSelect(col + 1, row + 1)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export const GuideEditorToolbar: React.FC<GuideEditorToolbarProps> = ({ textareaRef, value, onChange }) => {
  const [tableOpen, setTableOpen] = useState(false);

  const applyAction = useCallback((action: FormatAction) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { newValue, cursorPos } = action(textarea, value);
    onChange(newValue);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorPos, cursorPos);
    });
  }, [textareaRef, value, onChange]);

  const handleTableSelect = useCallback((cols: number, rows: number) => {
    setTableOpen(false);
    applyAction(insertAtCursor(generateTable(cols, rows)));
  }, [applyAction]);

  const s = 14;

  return (
    <div className="flex items-center gap-0.5 px-4 py-1.5 border-b border-white/10 bg-white/[0.02] shrink-0">
      <ToolButton icon={<Bold size={s} />} title="Bold" onClick={() => applyAction(wrapSelection('**', '**'))} />
      <ToolButton icon={<Italic size={s} />} title="Italic" onClick={() => applyAction(wrapSelection('*', '*'))} />
      <div className="w-px h-4 bg-white/10 mx-1" />
      <ToolButton icon={<Heading1 size={s} />} title="Heading 1" onClick={() => applyAction(prependLine('# '))} />
      <ToolButton icon={<Heading2 size={s} />} title="Heading 2" onClick={() => applyAction(prependLine('## '))} />
      <ToolButton icon={<Heading3 size={s} />} title="Heading 3" onClick={() => applyAction(prependLine('### '))} />
      <div className="w-px h-4 bg-white/10 mx-1" />
      <ToolButton icon={<List size={s} />} title="Bullet List" onClick={() => applyAction(prependLine('- '))} />
      <ToolButton icon={<ListOrdered size={s} />} title="Numbered List" onClick={() => applyAction(prependLine('1. '))} />
      <div className="w-px h-4 bg-white/10 mx-1" />
      <ToolButton icon={<Code size={s} />} title="Code Block" onClick={() => applyAction(codeBlockAction)} />

      <Popover open={tableOpen} onOpenChange={setTableOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            title="Insert Table"
            className="p-1.5 rounded hover:bg-white/10 text-[hsl(var(--ui-text-muted))] hover:text-[hsl(var(--ui-text))] transition-colors"
          >
            <Table size={s} />
          </button>
        </PopoverTrigger>
        <PopoverContent side="bottom" align="start" className="w-auto bg-[#1a1a1a] border-white/10 p-0">
          <TableGrid onSelect={handleTableSelect} />
        </PopoverContent>
      </Popover>

      <ToolButton icon={<Minus size={s} />} title="Horizontal Rule" onClick={() => applyAction(insertAtCursor('\n---\n'))} />
    </div>
  );
};
