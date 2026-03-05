

## Plan: Show All Validation Errors at Once with Inline Field Highlighting

**Problem:** The error summary list at the bottom works, but the actual input fields throughout the page don't get red borders/highlights. The user wants every failing field to visually turn red so the end-user can see all issues at a glance without scrolling to the bottom.

### Changes

**`src/components/chronicle/WorldTab.tsx`**

Add red border highlighting to each input field that has a corresponding `publishErrors` entry. The `publishErrors` state is already computed and stored -- we just need to wire it into each field's className:

1. **Story Name** (line ~551) -- already has `storyNameError` pattern; extend to also check `publishErrors.storyTitle`
2. **Story Premise** textarea (line ~608) -- add conditional `border-red-500` when `publishErrors.storyPremise` is set, plus a `<p>` error message below
3. **Opening Dialog** textarea -- find and add conditional red border when `publishErrors.openingDialog` is set
4. **Tags section** -- add a red border around the tags panel when `publishErrors.tags` is set
5. **SFW/NSFW selector** -- add red indicator when `publishErrors.storyType` is set
6. **Location section** -- add red border when `publishErrors.location` is set
7. **Story Arc section** -- add red border when `publishErrors.storyArc` is set

For each, the pattern is the same:
- Add `publishErrors.fieldName ? 'border-red-500' : 'border-zinc-700'` to the existing className
- Add a small `{publishErrors.fieldName && <p className="text-xs text-red-400 mt-1">{publishErrors.fieldName}</p>}` below the field

Character card highlighting is already implemented and will continue to work.

**Auto-scroll:** After setting errors, scroll the first errored field into view so the user immediately sees the red highlights rather than only the summary at the bottom.

### No other files change
- `publish-validation.ts` already returns all errors simultaneously
- `ShareStoryModal.tsx` unchanged

