import React, { useEffect, useMemo, useRef, useState } from 'react';

import { cn } from '@/lib/utils';
import {
  buildSpellOverlaySegments,
  buildChatSpellAllowlist,
  extractMisspelledRanges,
  getSpellingSuggestions,
  loadEnglishSpellDictionary,
  type MisspelledRange,
  type SpellcheckDictionary,
} from '@/lib/chat-spellcheck';

type ChatSpellcheckTextareaProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  allowlistEntries?: Array<string | null | undefined>;
  className?: string;
};

type SuggestionMenuState = {
  range: MisspelledRange;
  suggestions: string[];
  x: number;
  y: number;
};

export function ChatSpellcheckTextarea({
  value,
  onChange,
  placeholder,
  onSubmit,
  allowlistEntries = [],
  className,
}: ChatSpellcheckTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [dictionary, setDictionary] = useState<SpellcheckDictionary | null>(null);
  const [menu, setMenu] = useState<SuggestionMenuState | null>(null);

  useEffect(() => {
    let active = true;

    loadEnglishSpellDictionary()
      .then((loaded) => {
        if (active) {
          setDictionary(loaded);
        }
      })
      .catch(() => {
        if (active) {
          setDictionary(null);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [value]);

  useEffect(() => {
    setMenu(null);
  }, [value]);

  useEffect(() => {
    function handleOutsidePointerDown(event: MouseEvent) {
      if (!menu) return;
      const target = event.target as Node | null;
      if (target && overlayRef.current?.contains(target)) return;
      setMenu(null);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenu(null);
      }
    }

    document.addEventListener('mousedown', handleOutsidePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsidePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [menu]);

  const allowlist = useMemo(
    () => buildChatSpellAllowlist(allowlistEntries),
    [allowlistEntries],
  );

  const misspellings = useMemo(() => {
    if (!dictionary || !value) return [];
    return extractMisspelledRanges(value, dictionary, allowlist);
  }, [allowlist, dictionary, value]);

  const overlaySegments = useMemo(
    () => buildSpellOverlaySegments(value, misspellings),
    [misspellings, value],
  );

  const openSuggestionMenu = (
    event: React.MouseEvent<HTMLSpanElement>,
    range: MisspelledRange,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    if (!dictionary || !overlayRef.current) return;

    const suggestions = getSpellingSuggestions(range.word, dictionary, allowlist);
    const overlayRect = overlayRef.current.getBoundingClientRect();
    const wordRect = event.currentTarget.getBoundingClientRect();

    setMenu({
      range,
      suggestions,
      x: Math.max(8, wordRect.left - overlayRect.left),
      y: wordRect.bottom - overlayRect.top + 8,
    });
  };

  const handleSuggestionApply = (replacement: string) => {
    if (!menu) return;

    const nextValue = `${value.slice(0, menu.range.start)}${replacement}${value.slice(menu.range.end)}`;
    onChange(nextValue);
    setMenu(null);

    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const nextCaret = menu.range.start + replacement.length;
      textarea.focus();
      textarea.setSelectionRange(nextCaret, nextCaret);
    });
  };

  return (
    <div className={cn('relative', className)}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={3}
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        autoComplete="off"
        onKeyDown={(event) => {
          if (menu && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
            event.preventDefault();
            return;
          }

          if (event.key === 'Enter' && !event.shiftKey && onSubmit) {
            event.preventDefault();
            onSubmit();
          }
        }}
        className="block w-full resize-none overflow-hidden rounded-xl border border-white/[0.10] bg-[#3c3e47] px-4 py-3 text-sm leading-6 text-[#eaedf1] placeholder:text-[#8f95a3] outline-none transition-all focus:border-[#6e89ad] focus:ring-2 focus:ring-[#4a5f7f]/60"
      />

      {dictionary && value.length > 0 && (
        <div
          ref={overlayRef}
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl px-4 py-3 text-sm leading-6 whitespace-pre-wrap break-words"
          aria-hidden="true"
        >
          {overlaySegments.map((segment, index) => (
            segment.kind === 'misspelled' ? (
              <span
                key={`${segment.range.start}-${segment.range.end}-${index}`}
                className="pointer-events-auto cursor-pointer text-transparent decoration-[#ef4444] decoration-wavy [text-decoration-line:underline] [text-underline-offset:3px]"
                onMouseDown={(event) => event.preventDefault()}
                onClick={(event) => openSuggestionMenu(event, segment.range)}
                onContextMenu={(event) => openSuggestionMenu(event, segment.range)}
              >
                {segment.text}
              </span>
            ) : (
              <span key={`plain-${index}`} className="text-transparent">
                {segment.text}
              </span>
            )
          ))}

          {menu && (
            <div
              className="pointer-events-auto absolute z-20 min-w-[180px] rounded-xl border border-white/10 bg-[#22242b] p-1.5 shadow-[0_14px_40px_rgba(0,0,0,0.48),inset_0_1px_0_rgba(255,255,255,0.06)]"
              style={{ left: menu.x, top: menu.y }}
            >
              {menu.suggestions.length > 0 ? (
                menu.suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSuggestionApply(suggestion)}
                    className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-[#eaedf1] transition-colors hover:bg-white/8"
                  >
                    {suggestion}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-xs text-[#a0a6b2]">
                  No suggestions for &ldquo;{menu.range.word}&rdquo;
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
