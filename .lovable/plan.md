

## Plan: Fix Image Library Loading Flash

**Problem:** The Image Library tab is the only tab that shows a loading spinner on every visit. Other tabs (My Stories, Chat History, Characters) don't do this -- they render their content immediately and fetch data silently. The Image Library is the outlier because it initializes `isLoading = true` and re-sets it to `true` on every `loadFolders` call, gating the entire UI behind a spinner.

**Fix:** Match the behavior of other tabs by not showing a blocking spinner. Two lines in one file:

**File: `src/components/chronicle/ImageLibraryTab.tsx`**

1. **Line 47:** Change `useState(true)` → `useState(false)` -- don't start with a spinner
2. **Line 111:** Remove `setIsLoading(true)` from `loadFolders` -- don't re-trigger the spinner on subsequent loads

The grid will render immediately (empty for a brief moment), then folders appear when the fetch completes (~100ms). This matches how every other tab behaves.

