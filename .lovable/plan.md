

# Fix Save Button for Title Edits + Add Sidebar Title Tooltips

## Issue 1: Save button ignores title changes
Currently, the Save button only activates when you type in the markdown body. Editing the document title follows a completely separate code path that never flags unsaved changes. We need to unify these so:
- Typing in the title field marks the document as having unsaved changes (enables the Save button)
- Clicking Save saves both the title and the markdown content together
- The title still auto-saves on blur/Enter as it does now (as a convenience)

## Issue 2: Truncated sidebar document titles
Document names get cut off with "..." and there's no way to see the full name. We'll add a native tooltip (title attribute) to each document button so hovering shows the complete title.

---

## Technical Details

### File: `src/components/admin/guide/GuideEditor.tsx`

**Make title edits trigger unsaved state:**
- In the title `onChange` handler, also call `setHasUnsaved(true)` so the parent Save button enables
- Update `handleSave` to also save the title (call `onTitleChange` if title differs from `docTitle`)
- After a successful save, sync the title change to the parent

Specifically:
- Change the title input `onChange` (line 208) from just `setTitle(e.target.value)` to also set `setHasUnsaved(true)`
- In `handleSave` (around line 147), after updating markdown, also check if `title !== docTitle` and call `onTitleChange(docId, title)` if so

### File: `src/components/admin/guide/GuideSidebar.tsx`

**Add tooltip to document items:**
- Add `title={doc.title}` to the document button element (line 64-68) so hovering reveals the full name

Two files change, minimal edits each.

