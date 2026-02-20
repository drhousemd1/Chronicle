

# Fix Review Modal Scroll and Add Delete Review Button

## Problem 1: Scroll Not Working

The `ReviewModal` uses a `ScrollArea` component inside a custom dialog layout. The `ScrollArea` has `className="flex-1"` but lacks a concrete height constraint. Inside a `flex flex-col` container with `max-h-[90vh]`, the `flex-1` should work, but `ScrollArea` from Radix needs an explicit max-height or the content won't scroll. The fix is to add `overflow-hidden` on the `ScrollArea` wrapper and ensure the flex layout properly constrains it.

**File**: `src/components/chronicle/ReviewModal.tsx` (line 87)

Change the `ScrollArea` to have `overflow-hidden` and ensure it gets a bounded height:
```tsx
<ScrollArea className="flex-1 overflow-hidden">
```

Also ensure the outer container properly constrains with `min-h-0` on the flex child (line 78 area). The `flex-1` needs `min-h-0` to allow shrinking below content size in a flex column.

## Problem 2: Add Delete Review Button

When editing an existing review, show two side-by-side buttons in the footer: "Update Review" and "Delete Review".

### 2a. Add `deleteReview` function to `gallery-data.ts`

Add a new function after `submitReview`:
```typescript
export async function deleteReview(
  publishedScenarioId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('scenario_reviews')
    .delete()
    .eq('published_scenario_id', publishedScenarioId)
    .eq('user_id', userId);
  if (error) throw error;
}
```

### 2b. Update ReviewModal footer

**File**: `src/components/chronicle/ReviewModal.tsx`

- Import `deleteReview` from gallery-data
- Add `isDeleting` state
- Add `handleDelete` function with confirmation (using the app's DeleteConfirmDialog or a simple confirm)
- When `existingReview` exists, show two buttons side by side:
  - "Update Review" (existing blue button, now `flex-1`)
  - "Delete Review" (red/destructive styled button, `flex-1`)
- When no existing review, show single "Submit Review" button (unchanged)

Footer layout when editing:
```tsx
<div className="p-5 border-t border-white/10 flex gap-3">
  <button onClick={handleSubmit} className="flex-1 h-11 bg-[#4a5f7f] ...">
    Update Review
  </button>
  <button onClick={handleDelete} className="flex-1 h-11 bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600/30 ...">
    Delete Review
  </button>
</div>
```

### 2c. Add `onReviewDeleted` callback

The `ReviewModal` already has `onReviewSubmitted` which reloads reviews. We can reuse this same callback for deletion since it triggers a refresh of both the reviews list and the review count.

## Technical Summary

| File | Change |
|------|--------|
| `src/services/gallery-data.ts` | Add `deleteReview(publishedScenarioId, userId)` function |
| `src/components/chronicle/ReviewModal.tsx` | Fix scroll by adding `min-h-0` to flex child; add `deleteReview` import, `isDeleting` state, delete handler, and side-by-side footer buttons when editing |

