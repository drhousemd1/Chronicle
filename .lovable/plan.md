

## Plan: Fix Persistent "Unsaved Draft" Label

**Problem:** The Chat History sidebar item bypasses `handleNavigateAway` and directly calls `setTab("conversations")`. This means `activeId` is never cleared when navigating to Chat History, so the subtitle `activeId ? (activeMeta?.title || "Unsaved Draft") : undefined` continues to show "Unsaved Draft" under the Story Builder button.

All other sidebar items (Community Gallery, My Stories, Character Library, Image Library) correctly use `handleNavigateAway`, which clears `activeId`, `activeData`, etc. Chat History is the odd one out.

**Fix:** One line change in `src/pages/Index.tsx`, line 1483.

Change the Chat History onClick from:
```typescript
onClick={() => { setTab("conversations"); }}
```
to:
```typescript
onClick={() => handleNavigateAway("conversations")}
```

This ensures navigating to Chat History stashes any draft and clears the active story state, just like every other sidebar item already does.

**Files to update:** `src/pages/Index.tsx` (1 line)

