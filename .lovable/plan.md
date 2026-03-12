

# Fix: Drafts Not Visible After Saving

## Root Cause

Two bugs in the filter logic in `src/pages/Index.tsx`:

1. **"All" filter excludes drafts** — Line 385 does `registry.filter(s => !s.isDraft)`, but per the original plan, "All" should include drafts.
2. **Default filter is "all"** — After saving a draft from the builder, the user returns to the hub which defaults to "all" (or stays on whatever filter they were on). Since drafts are excluded from both "My Stories" and "All", the draft is invisible unless the user manually clicks the "Drafts" pill.

The draft IS saving to the database successfully (no network errors). It just doesn't show due to filtering.

## Fix

**File: `src/pages/Index.tsx`**

1. **Include drafts in "My Stories" filter** — Remove the `!s.isDraft` exclusion from the "my" case. These are the user's stories regardless of draft status. This is more intuitive — users expect their own stories page to show everything they own.

2. **Include drafts in "All" filter** — Remove the `!s.isDraft` exclusion from the "all" case, matching the original plan.

3. **After saving a draft, auto-switch filter to "my"** — In the Save Draft button handler, after refreshing the registry, set `hubFilter` to `"my"` so the user immediately sees their draft card with the amber "Draft" badge.

The "Drafts" pill remains useful as a focused view showing only drafts.

