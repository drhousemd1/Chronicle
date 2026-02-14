

# Live-Styled Inline Editing with contentEditable

## Problem
When editing a message, the contentEditable div currently shows plain unstyled text. The user loses all visual formatting (white speech, gray italic actions, purple glowing thoughts), making it hard to spot the exact issue they wanted to fix.

## Solution: Render Styled HTML Inside the contentEditable div

Instead of setting `el.innerText` (plain text), we set `el.innerHTML` with the same styled `<span>` elements that `FormattedMessage` produces. Since the contentEditable div preserves HTML, the user sees styled text and can edit it directly. On save, we read back `innerText` (which strips all HTML) to get the raw markup text.

### How It Works
1. Extract the token-parsing logic from `FormattedMessage` into a standalone utility function (e.g., `parseMessageTokens`)
2. Create a second utility `tokensToStyledHtml` that converts those tokens into an HTML string with inline styles matching the current CSS classes (white + font-medium for speech, slate-400 + italic for actions, indigo glow for thoughts, slate-300 for plain)
3. In the contentEditable ref initializer, use `el.innerHTML = tokensToStyledHtml(...)` instead of `el.innerText = inlineEditText`
4. On every `onInput`, re-parse the current `innerText`, regenerate styled HTML, and update `innerHTML` -- while preserving the cursor position
5. On save, read `innerText` which gives back the clean raw text (with `*`, `"`, `()` markers intact since they're included in the HTML output)

### Key Design Decisions
- **Include markup characters in the HTML output**: Speech shows as `"text"`, actions as `*text*`, thoughts as `(text)` -- so the user can see and edit the delimiters
- **Cursor preservation**: Before updating innerHTML, save the cursor offset (counting text characters), then after setting innerHTML, walk the text nodes to restore the cursor to the same character position
- **Inline styles over classes**: Since contentEditable can strip class-based styles on edit, we use inline `style` attributes for the colored spans to ensure they persist

### Technical Details

**File: `src/components/chronicle/ChatInterfaceTab.tsx`**

**Change 1 -- Extract parsing logic (around line 69-100):**
Move the token parsing from inside `FormattedMessage` into a standalone function:
```typescript
function parseMessageTokens(text: string): { type: string; content: string }[] {
  const cleanRaw = text.replace(/\[SCENE:\s*.*?\]/g, '').trim();
  const regex = /(\*.*?\*)|(".*?")|(\(.*?\))/g;
  // ... same parsing logic ...
  return parts;
}
```

`FormattedMessage` then calls `parseMessageTokens` internally (no behavior change).

**Change 2 -- Add HTML generator function:**
```typescript
function tokensToStyledHtml(tokens: { type: string; content: string }[], dynamicText: boolean): string {
  return tokens.map(token => {
    if (token.type === 'speech') {
      return `<span style="color:white;font-weight:500">\u201C${escapeHtml(token.content)}\u201D</span>`;
    }
    if (token.type === 'action' && dynamicText) {
      return `<span style="color:rgb(148,163,184);font-style:italic">*${escapeHtml(token.content)}*</span>`;
    }
    if (token.type === 'thought' && dynamicText) {
      return `<span style="color:rgba(199,210,254,0.9);font-style:italic;letter-spacing:-0.025em;text-shadow:0 0 8px rgba(129,140,248,0.6),0 0 16px rgba(129,140,248,0.4)">(${escapeHtml(token.content)})</span>`;
    }
    // plain or non-dynamic
    return `<span style="color:rgb(203,213,225)">${escapeHtml(token.content)}</span>`;
  }).join('');
}

function escapeHtml(str: string): string {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
```

**Change 3 -- Update contentEditable initialization (line 2900-2918):**
- Use `el.innerHTML = tokensToStyledHtml(parseMessageTokens(inlineEditText), dynamicText)` instead of `el.innerText`

**Change 4 -- Live re-styling on input:**
In the `onInput` handler:
1. Read `el.innerText` to get the current raw text
2. Save cursor position (character offset from start)
3. Re-parse and set `el.innerHTML`
4. Restore cursor to saved character offset
5. Update React state with `setInlineEditText(rawText)`

**Change 5 -- Cursor preservation helper:**
```typescript
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
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
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
}
```

## Summary
- 1 file modified: `ChatInterfaceTab.tsx`
- No database changes
- New utility functions: `parseMessageTokens`, `tokensToStyledHtml`, `escapeHtml`, `getCaretCharOffset`, `setCaretCharOffset`
- `FormattedMessage` refactored to use `parseMessageTokens` (no visual change)
- Edit mode now shows live-styled text that updates formatting as you type

