

# Fix: Text Styling Lost After Saving Inline Edit

## Root Cause

The `tokensToStyledHtml` function replaces straight quotes (`"`) with curly/smart quotes (`\u201C` and `\u201D`) in the rendered HTML. When the user saves, the text is read back via `innerText`, which returns curly quotes instead of the original straight quotes. The saved text then contains curly quotes, and the parser regex only matches straight quotes (`"`), so speech is no longer detected -- it renders as plain text (muted gray instead of bright white).

## Fix

In `tokensToStyledHtml`, keep the original straight quotes `"` instead of replacing them with curly Unicode quotes. The `FormattedMessage` component already handles the curly-quote conversion at render time, so the stored text should always use straight quotes.

**File: `src/components/chronicle/ChatInterfaceTab.tsx`**

**Lines 108-114** -- Change `\u201C` and `\u201D` back to `"`:

```
// Before (broken):
return `<span style="...">\u201C${escapeHtml(token.content)}\u201D</span>`;

// After (fixed):
return `<span style="...">"${escapeHtml(token.content)}"</span>`;
```

This applies to both the `dynamicText` and non-`dynamicText` speech branches (lines 109 and 114).

This is a two-line change in a single file. No other modifications needed.

