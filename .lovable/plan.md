
# Fix: Remove `overflow-hidden` From Edit Mode

## Problem

The `overflow-hidden` class on the `contentEditable` div creates a new block formatting context, which prevents text from flowing underneath the floated avatar. This causes all text to shift right and stay in a column beside the avatar instead of wrapping naturally under it.

## Solution

Simply remove `overflow-hidden` from the `contentEditable` div's className. The edit mode should use exactly the same layout as the normal view -- no extra formatting rules, no layout shifts. The text container stays as-is and becomes editable in place.

**File: `src/components/chronicle/ChatInterfaceTab.tsx`, line 2952**

Remove `overflow-hidden` from the className:

```
// Before:
className="text-[15px] leading-relaxed font-normal whitespace-pre-wrap outline-none focus:ring-1 focus:ring-blue-500/30 rounded-md -mx-1 px-1 overflow-hidden"

// After:
className="text-[15px] leading-relaxed font-normal whitespace-pre-wrap outline-none focus:ring-1 focus:ring-blue-500/30 rounded-md -mx-1 px-1"
```

One line, one class removed. Text will wrap under the avatar in edit mode just like it does in normal view.
