

# Fix App Guide Title Corruption

## Root Cause

Two bugs working together to corrupt document titles:

1. **Race condition in `loadDoc`**: `setActiveDocId(id)` fires BEFORE the async database fetch completes. This immediately triggers a re-render where `activeDocId` points to the NEW document but `activeDocTitle` still holds the OLD document's title. The `onRegisterSave` effect creates a save function with this mismatched state -- saving the old title to the new document.

2. **Save function double-writes title**: The save button writes `activeDocTitle` to the database, but title renames are already handled by `handleTitleChange`. Two code paths writing the same field creates overwrite conflicts.

## Fix (2 changes in 1 file)

### `src/components/admin/guide/AppGuideTool.tsx`

**Fix 1: Move `setActiveDocId` AFTER the fetch completes in `loadDoc`**

```
Before:
  setActiveDocId(id);        // <-- triggers remount with stale title
  setTocEntries([]);
  const { data } = await fetch...
  if (data) { setActiveDocTitle(data.title); ... }

After:
  setTocEntries([]);
  const { data } = await fetch...
  if (data) {
    setActiveDocId(id);       // <-- only set after we have correct data
    setActiveDocTitle(data.title);
    setActiveDocMarkdown(data.markdown || '');
    setDocuments(prev => ...);
  }
```

This ensures `activeDocId`, `activeDocTitle`, and `activeDocMarkdown` are always consistent -- they all update together in a single React batch after the fetch completes.

**Fix 2: Remove `title` from the save function**

The save function should only persist `markdown` and `updated_at`, not `title`. Title changes already go through `handleTitleChange` which has its own database write. This eliminates the second code path that can overwrite a good title with a stale value.

```
Before: .update({ title: activeDocTitle, markdown: activeDocMarkdown, updated_at: ... })
After:  .update({ markdown: activeDocMarkdown, updated_at: ... })
```

No new files, no new dependencies. Two small, targeted changes.

