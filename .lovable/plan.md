

## Analysis

The core bug: "Save Draft" stores to `draft_{activeId}` where `activeId` is a UUID created when the user clicked "Create New." When they navigate away and come back, clicking "Create New" generates a **new** UUID, so the old draft is never found. The restore logic only runs inside `handleEditScenario` (for existing DB stories), not for orphaned drafts.

## Recommendation: localStorage with a Draft Registry

Database storage is overkill here — drafts are temporary, pre-validation work that doesn't need cross-device sync. The fix is adding a **draft registry** (a simple localStorage key listing all saved drafts with metadata) so they can be discovered and loaded.

**Button name suggestion:** "Drafts" is cleaner and shorter than "Edit Drafts." A small badge showing the draft count would make it obvious when drafts exist.

## Plan

### 1. Draft Registry System (`src/pages/Index.tsx`)

Add a `draft_registry` localStorage key that tracks all saved drafts:
```ts
type DraftEntry = { id: string; title: string; savedAt: number; }
```

When "Save Draft" is clicked, also upsert an entry in the registry (title from `activeData.world.core.scenarioName || "Untitled"`).

### 2. Drafts Modal Component (new file: `src/components/chronicle/DraftsModal.tsx`)

Dark-themed modal matching existing style conventions:
- Simple list of drafts showing title + save date
- **Edit** button → loads draft into story builder (sets `activeId`, `activeData`, etc.)
- **Trash icon** → deletes draft from localStorage + registry
- Empty state when no drafts exist

### 3. "Drafts" Button (`src/pages/Index.tsx`)

Add a "Drafts" button to the left of "Save and Close" in the story builder header. Optionally show a count badge when drafts exist. Clicking opens the DraftsModal.

### 4. Clean Up on "Save and Close"

When a story is successfully saved to the database, remove its entry from the draft registry (already removes the `draft_{id}` key — just also clean the registry).

### Files to Change
- `src/pages/Index.tsx` — draft registry logic, "Drafts" button, load-from-draft handler
- `src/components/chronicle/DraftsModal.tsx` — new modal component

