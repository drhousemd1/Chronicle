
# Fix Title Rename Not Persisting in App Guide

## Root Cause
Two bugs in `AppGuideTool.tsx`:

1. **`handleTitleChange`** silently ignores database errors -- it updates local state optimistically but never checks if the DB write succeeded.
2. **`loadDoc`** fetches the document from the database and updates `activeDocTitle`, but does NOT update the `documents` array. This causes the sidebar to show the locally-cached (renamed) title while the editor title bar shows the actual DB value (e.g., "S").

## Changes

### `src/components/admin/guide/AppGuideTool.tsx`

**Fix 1: Add error handling to `handleTitleChange`**
- Check the `error` return from the `.update()` call
- If it fails, show a toast and do NOT update local state (so the UI stays consistent with the DB)
- Only update `activeDocTitle` and `documents` if the DB write succeeds

**Fix 2: Sync `documents` array in `loadDoc`**
- After fetching a document in `loadDoc`, also update the matching entry in the `documents` array with the title from the database
- This ensures the sidebar always reflects the actual persisted title, preventing stale local names from lingering

### Technical Details

```
handleTitleChange:
  const { error } = await supabase.from(...).update({ title }).eq('id', id);
  if (error) {
    toast({ title: 'Rename failed', description: error.message, variant: 'destructive' });
    return;  // Don't update local state
  }
  // Only then update local state
  setActiveDocTitle(newTitle);
  setDocuments(prev => prev.map(...));

loadDoc:
  if (data) {
    setActiveDocTitle(data.title);
    setActiveDocMarkdown(data.markdown || '');
    // Also sync the documents array
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, title: data.title } : d));
  }
```

**Files modified:** `src/components/admin/guide/AppGuideTool.tsx` only

These are small, targeted fixes -- no new files, no new dependencies, no structural changes.
