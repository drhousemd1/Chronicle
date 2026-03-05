

## Plan: Move Validation Before Modal Opens

**Problem:** Validation currently runs inside the ShareScenarioModal when clicking the internal "Publish to Gallery" button. The user wants validation to run when clicking the "Publish to Gallery" button at the bottom of the WorldTab page -- if there are errors, the modal should NOT open and errors should be shown inline on the page and on character cards.

### Changes

**`src/components/chronicle/WorldTab.tsx`**
- Replace the button's `onClick={() => setShowShareModal(true)}` with a new handler that:
  1. Runs `validateForPublish(...)` with all the story data
  2. Sets `publishErrors` state with the result
  3. Only calls `setShowShareModal(true)` if `hasPublishErrors()` returns false
  4. If errors exist, show the error summary directly below the "Publish to Gallery" button (inside the Share section card), using the same red panel style
- Character-level error highlights on the sidebar cards remain as already implemented

**`src/components/chronicle/ShareStoryModal.tsx`**
- Remove the validation logic from `handlePublish` -- the modal should assume data is already valid since validation gates the modal opening
- Remove `validationErrors` state and the error summary panel from the modal
- Remove the `onPublishValidationErrors` callback prop (no longer needed from inside the modal)
- Keep `characters`, `world`, `openingDialog`, `contentThemes` props only if needed for display; otherwise remove them too

**Result:** Clicking "Publish to Gallery" at the bottom of the page either shows inline errors + character highlights (blocking the modal), or opens a clean modal ready to publish.

