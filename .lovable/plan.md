

# Fix: Cursor Jump on Empty Text + Remove Focus Ring

Two changes in one file: `src/components/chronicle/ChatInterfaceTab.tsx`.

## Change 1 -- Remove Focus Ring (line 2952)

Remove `focus:ring-1 focus:ring-blue-500/30` from the `contentEditable` div's className. The checkmark/X buttons already indicate edit mode, so the ring is redundant and visually overlaps the avatar.

```
// Before:
className="text-[15px] leading-relaxed font-normal whitespace-pre-wrap outline-none focus:ring-1 focus:ring-blue-500/30 rounded-md -mx-1 px-1"

// After:
className="text-[15px] leading-relaxed font-normal whitespace-pre-wrap outline-none rounded-md -mx-1 px-1"
```

## Change 2 -- Fix Cursor Jumping (lines 135-151)

When you delete all the text and start retyping, the `setCaretCharOffset` function walks through text nodes to restore the cursor position. If the saved offset exceeds the total character count in the new HTML (which happens after clearing and retyping short text), the function exits without placing the cursor, and the browser defaults to position 0 -- the beginning.

Fix: add a fallback at the end of `setCaretCharOffset` that places the cursor at the end of the last text node when the offset can't be reached.

```typescript
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
  // Fallback: offset exceeded total text -- place cursor at end
  if (lastNode) {
    const range = document.createRange();
    range.setStart(lastNode, lastNode.length);
    range.collapse(true);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  }
}
```

## Summary

- 1 file modified, 2 changes
- Focus ring removed -- cleaner look, no overlap with avatar
- Cursor no longer jumps to start when clearing text and retyping

