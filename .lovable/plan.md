

## Fix: Buttons Turning White on Save Draft

### Problem
When you click "Save Draft", the `isSaving` state is set to `true`. The Import, Export, and Finalize buttons all include `isSaving` in their `disabled` condition, which triggers `disabled:opacity-50` — making them look washed out / white. Only the Save Draft button should visually change.

### Fix
**File: `src/pages/Index.tsx`**

Remove `isSaving` from the `disabled` prop of three buttons:

1. **Import button** (line ~2063): `disabled={!activeData || isSavingAndClosing}` (remove `|| isSaving`)
2. **Export button** (line ~2072): `disabled={!activeData || isSavingAndClosing}` (remove `|| isSaving`)
3. **Finalize and Close button** (line ~2106): `disabled={isSavingAndClosing}` (remove `|| isSaving`)

The Save Draft button itself (line ~2183) keeps `disabled={isSaving || isSavingAndClosing}` so it still shows its "Saving…" / "Draft Saved!" state correctly.

This way only the Save Draft button reacts visually when saving a draft. The other buttons stay normal.

