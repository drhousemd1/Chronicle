

## Fix: Button Corner Radius in DeleteConfirmDialog

The buttons in the delete confirmation dialog use `rounded-2xl` (16px radius), but the app standard is `rounded-xl` (12px radius) — as seen in FolderEditModal, ImageLibraryTab, and the uploaded reference image (Image 1).

### Change

**File: `src/components/chronicle/DeleteConfirmDialog.tsx`**

- Line 40: Change `rounded-2xl` → `rounded-xl` on the Cancel button
- Line 45: Change `rounded-2xl` → `rounded-xl` on the Delete button

No other changes needed. The rest of the styling (colors, text size, uppercase tracking) already matches.

