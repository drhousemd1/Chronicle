

# Fix: Restore Text Wrapping Under Avatar

## Problem

The `overflow-hidden` class added to the text container div (line 2947) in the last fix creates a new block formatting context. While this fixed the editor focus ring overlapping the avatar, it also prevents text from naturally wrapping underneath the floated avatar in **all** states (not just edit mode). Text now stays rigidly to the right of the avatar.

## Solution

Remove `overflow-hidden` from the outer text container div (restoring the original wrapping behavior). Instead, apply `overflow-hidden` only to the `contentEditable` div itself when in edit mode, so the editor box stays beside the avatar without affecting normal message display.

**File: `src/components/chronicle/ChatInterfaceTab.tsx`**

**Change 1 -- Line 2947: Remove `overflow-hidden` from the wrapper div:**
```
// Revert to:
<div className={showAvatar ? "pt-1 antialiased" : "antialiased"}>
```

**Change 2 -- The contentEditable div (around line 2949): Add `overflow-hidden` to its own className:**
Add `overflow-hidden` to the contentEditable div's className so only the edit box itself creates a block formatting context and avoids overlapping the avatar. Normal (non-editing) text continues to wrap freely under the avatar.

## Summary
- 1 file modified: `ChatInterfaceTab.tsx`
- 2 small className changes
- Normal messages wrap under the avatar as before
- Edit mode editor box stays contained beside the avatar
