

# Fix App Guide Tool Loading

## Status Check
The App Guide code is real, functional code -- not placeholder examples. The database table, RLS policies, editor, and sidebar are all properly implemented and will work once the loading issue is resolved.

The white screen issue for the main app should already be fixed by the lazy loading change. The remaining problem is that when you click the App Guide tile, the BlockNote editor packages time out during loading in the dev environment.

## Plan

### 1. Add an error boundary around the lazy-loaded App Guide
Wrap the `React.Suspense` in an error boundary so that if BlockNote fails to load, it shows a friendly error message with a "Retry" button instead of crashing.

**File: `src/components/admin/guide/GuideLoadErrorBoundary.tsx`** (new file)
- Simple React error boundary component
- Shows "Failed to load editor" message with a retry button
- Catches the dynamic import failure gracefully

### 2. Update Admin.tsx to use the error boundary
**File: `src/pages/Admin.tsx`**
- Wrap the `React.Suspense` block in the new error boundary
- This way if the editor fails to load on first try, you can click "Retry" instead of being stuck

### 3. Verify the app loads without white screen
The main app (Index page) should load fine since BlockNote is fully isolated behind `React.lazy()`. The App Guide only loads its heavy dependencies when you actually open it.

## Technical Notes
- The `guide_documents` table is correctly set up with: id (UUID), title, content (JSONB for BlockNote blocks), markdown (text for AI-readable export), sort_order, timestamps
- RLS policies correctly restrict access to admin users via `has_role()`
- The `update_updated_at_column` trigger is in place
- The editor saves both BlockNote JSON (for editing) and markdown (for you to reference later) -- exactly what you described wanting

