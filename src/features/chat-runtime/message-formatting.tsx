import React, { useMemo, useRef } from 'react';

import {
  parseMessageTokens,
  tokensToStyledHtml,
  type PlainTextMode,
} from './message-formatting-utils';

function getCaretCharOffset(el: HTMLElement): number {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return 0;
  const range = sel.getRangeAt(0).cloneRange();
  range.selectNodeContents(el);
  range.setEnd(sel.getRangeAt(0).endContainer, sel.getRangeAt(0).endOffset);
  return range.toString().length;
}

function setCaretCharOffset(el: HTMLElement, offset: number) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let charCount = 0;
  let lastNode: Text | null = null;
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    lastNode = node;
    if (charCount + node.length >= offset) {
      const range = document.createRange();
      range.setStart(node, offset - charCount);
      range.collapse(true);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
      return;
    }
    charCount += node.length;
  }

  if (lastNode) {
    const range = document.createRange();
    range.setStart(lastNode, lastNode.length);
    range.collapse(true);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  }
}

export const FormattedMessage: React.FC<{ text: string; dynamicText?: boolean; plainTextMode?: PlainTextMode }> = ({
  text,
  dynamicText = true,
  plainTextMode = 'default',
}) => {
  const tokens = useMemo(() => parseMessageTokens(text), [text]);

  return (
    <div className="whitespace-pre-wrap">
      {tokens.map((token, i) => {
        if (!dynamicText) {
          if (token.type === 'speech') {
            return (
              <span key={i} className="text-white font-medium">
                &ldquo;{token.content}&rdquo;{token.trailing || ''}
              </span>
            );
          }
          if (token.type === 'plain' && plainTextMode === 'action') {
            return (
              <span key={i} className="text-slate-400 italic">
                {token.content}
              </span>
            );
          }
          return (
            <span key={i} className="text-white font-medium">
              {token.content}
            </span>
          );
        }

        if (token.type === 'speech') {
          return (
            <span key={i} className="text-white font-medium">
              &ldquo;{token.content}&rdquo;{token.trailing || ''}
            </span>
          );
        }
        if (token.type === 'action') {
          return (
            <span key={i} className="text-slate-400 italic">
               {token.content}
            </span>
          );
        }
        if (token.type === 'thought') {
          return (
            <span
              key={i}
              className="text-indigo-200/90 italic tracking-tight animate-in fade-in zoom-in-95 duration-500"
              style={{
                textShadow: '0 0 8px rgba(129, 140, 248, 0.6), 0 0 16px rgba(129, 140, 248, 0.4), 0 0 24px rgba(129, 140, 248, 0.2)'
              }}
            >
              {token.content}
            </span>
          );
        }
        if (plainTextMode === 'action') {
          return (
            <span key={i} className="text-slate-400 italic">
              {token.content}
            </span>
          );
        }
        return (
          <span key={i} className="text-slate-300">
            {token.content}
          </span>
        );
      })}
    </div>
  );
};

// Guardrail: chat message editing must stay visually in-place inside the bubble.
// Do not replace this with a plain textarea/modal flow unless the replacement
// preserves avatar wrapping, bubble sizing, and dialogue/action/thought styling.
export const InlineFormattedMessageEditor: React.FC<{
  value: string;
  dynamicText: boolean;
  plainTextMode?: PlainTextMode;
  autoFocus?: boolean;
  onChange: (value: string) => void;
}> = ({ value, dynamicText, plainTextMode = 'default', autoFocus = false, onChange }) => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const hasInitializedRef = useRef(false);

  React.useLayoutEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const nextHtml = tokensToStyledHtml(parseMessageTokens(value, true), dynamicText, plainTextMode);
    if (editor.innerHTML !== nextHtml) {
      editor.innerHTML = nextHtml;
    }

    if (!hasInitializedRef.current && autoFocus) {
      hasInitializedRef.current = true;
      editor.focus();
      setCaretCharOffset(editor, editor.innerText.length);
    }
  }, [autoFocus, dynamicText, plainTextMode, value]);

  return (
    <div
      ref={editorRef}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-label="Edit message"
      aria-multiline="true"
      spellCheck
      className="min-h-[1.5rem] whitespace-pre-wrap break-words rounded-md -mx-1 px-1 py-1 text-[15px] leading-relaxed font-normal outline-none"
      onBlur={(e) => {
        onChange(e.currentTarget.innerText.replace(/\u00a0/g, ' '));
      }}
      onInput={(e) => {
        const editor = e.currentTarget;
        const rawText = editor.innerText.replace(/\u00a0/g, ' ');
        const caretPos = getCaretCharOffset(editor);
        editor.innerHTML = tokensToStyledHtml(parseMessageTokens(rawText, true), dynamicText, plainTextMode);
        setCaretCharOffset(editor, caretPos);
        onChange(rawText);
      }}
    />
  );
};
