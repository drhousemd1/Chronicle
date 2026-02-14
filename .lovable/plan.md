

# Fix Inline Edit: Layout Overlap and Cursor Jumping

## Bug 1: Text Box Extends Over Avatar

The contentEditable div is a block element sitting alongside a `float-left` avatar. Without a new block formatting context, the div's box (and its focus ring) extends under/over the floated avatar.

**Fix**: Add `overflow-hidden` to the text container div (line 2947). This creates a new block formatting context that automatically stays beside the float rather than extending behind it.

```
// Line 2947: change
<div className={showAvatar ? "pt-1 antialiased" : "antialiased"}>
// to
<div className={showAvatar ? "pt-1 antialiased overflow-hidden" : "antialiased"}>
```

## Bug 2: Cursor Jumps to Start on Space Bar

When pressing space in a contentEditable element, browsers insert `\u00a0` (non-breaking space) instead of a regular space. The `onInput` handler reads `innerText`, which preserves `\u00a0`, but `tokensToStyledHtml` outputs regular spaces. This character mismatch causes `setCaretCharOffset` to miscalculate the position, jumping the cursor to position 0.

**Fix**: In the `onInput` handler, normalize all `\u00a0` characters to regular spaces before processing:

```typescript
onInput={(e) => {
  const el = e.currentTarget as HTMLDivElement;
  const rawText = el.innerText.replace(/\u00a0/g, ' ');
  const caretPos = getCaretCharOffset(el);
  el.innerHTML = tokensToStyledHtml(parseMessageTokens(rawText), dynamicText);
  setCaretCharOffset(el, caretPos);
  setInlineEditText(rawText);
}}
```

## Summary

- **File**: `src/components/chronicle/ChatInterfaceTab.tsx`
- **Change 1** (line 2947): Add `overflow-hidden` to the text wrapper div
- **Change 2** (line 2968): Normalize `\u00a0` to regular space in `onInput`
- Two small edits, no new files or dependencies

