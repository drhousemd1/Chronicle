

# Fix: Space Bar Not Working After Clearing Text

## Root Cause

In `parseMessageTokens` (line 70), the very first thing the function does is `.trim()` the input text:

```typescript
const cleanRaw = text.replace(/\[SCENE:\s*.*?\]/g, '').trim();
```

During editing, every keystroke triggers `onInput`, which:
1. Reads `innerText` ("Ashley: " with trailing space)
2. Saves cursor position (8)
3. Runs `parseMessageTokens` which **trims the trailing space** -> "Ashley:" (7 chars)
4. Rebuilds HTML from trimmed text (no space)
5. Restores cursor to end of 7-char text

The space you typed is stripped on every keystroke, so it appears the spacebar does nothing.

## Fix

Add an optional `preserveWhitespace` parameter to `parseMessageTokens`. When called from the `onInput` handler during editing, pass `true` to skip the `.trim()`. Normal message display continues to trim as before.

**File: `src/components/chronicle/ChatInterfaceTab.tsx`**

### Change 1 -- Update `parseMessageTokens` signature (line 69)

```typescript
// Before:
function parseMessageTokens(text: string): { type: string; content: string }[] {
  const cleanRaw = text.replace(/\[SCENE:\s*.*?\]/g, '').trim();

// After:
function parseMessageTokens(text: string, preserveWhitespace = false): { type: string; content: string }[] {
  let cleanRaw = text.replace(/\[SCENE:\s*.*?\]/g, '');
  if (!preserveWhitespace) cleanRaw = cleanRaw.trim();
```

### Change 2 -- Pass `true` from the `onInput` handler (line 2981)

```typescript
// Before:
el.innerHTML = tokensToStyledHtml(parseMessageTokens(rawText), dynamicText);

// After:
el.innerHTML = tokensToStyledHtml(parseMessageTokens(rawText, true), dynamicText);
```

## Summary

- 1 file, 2 small edits
- Trailing spaces are preserved during editing so the spacebar works
- Normal message display still trims whitespace as before

