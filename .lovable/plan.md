
I hear you. The code currently explains exactly why you still don’t see it:

1) The button is gated behind `draftCount > 0`, so it is completely hidden when count is 0.  
2) `draftCount` only reads `draft_registry`; older/legacy `draft_*` entries (or auto-stashed drafts) may exist without registry entries, so the UI thinks there are no drafts.

## Plan

### 1) Make the Drafts button always visible in Story Builder header
- In `src/pages/Index.tsx`, remove the `draftCount > 0` wrapper around the Drafts button.
- Keep it placed left of **Save and Close**.
- Keep badge visible only when `draftCount > 0`.

### 2) Harden draft counting so it reflects real saved drafts
- Add a single `refreshDraftCount()` helper in `Index.tsx`.
- It will:
  - read `draft_registry`
  - if empty/incomplete, scan localStorage keys matching `draft_*`
  - normalize/migrate those into registry entries (id/title/savedAt) so they appear in modal
  - set `draftCount` from the normalized registry length

### 3) Ensure count refreshes at the right times
- Call `refreshDraftCount()` on:
  - initial mount
  - after **Save Draft**
  - after modal close
  - after deleting/loading drafts
  - when switching into the `world` tab (so the header is always up to date)

### 4) Keep modal behavior simple and reliable
- Keep current dark modal (`DraftsModal`) with Edit + Trash.
- Edit loads draft into builder.
- Trash deletes both `draft_{id}` and registry entry (already present).

## Technical details
- Files:
  - `src/pages/Index.tsx` (primary fix: rendering + sync logic)
  - `src/components/chronicle/DraftsModal.tsx` (minor optional update only if parent count callback is needed after delete)
- No backend/database changes required.
- This preserves current local draft flow and fixes the visibility/discovery bug directly.
