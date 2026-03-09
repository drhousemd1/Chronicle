

## Style Guide Edits System

### Overview
Add an "Edits" workflow to the Style Guide that lets you mark any card for review, attach comments about what needs changing, and build a list that can be referenced later.

### Components to Create/Modify

**1. New file: `src/components/admin/styleguide/StyleGuideEditsModal.tsx`**

Two modals in one file:

- **KeepOrEditModal** — Small dialog that appears when you click the edit overlay on a card. Shows the card name + 2 buttons: "Keep" and "Edit". Keep marks it with a green pill. Edit opens the detail modal.

- **EditDetailModal** — Shows all the current details of the card (name, color, size, purpose, locations, etc.) as read-only fields, plus a textarea for comments. Save button adds it to the edits list in localStorage.

- **EditsListModal** — The main "Edits" button modal (like DraftsModal). Shows all items marked for editing with their comments. Each row has: card name, comment preview, timestamp, edit (pencil) and delete (trash) icons. Clicking edit re-opens EditDetailModal to update the comment.

**2. Edits State Management**
- localStorage key: `styleguide_edits_registry`
- Each entry: `{ id: string, cardType: string, cardName: string, details: Record<string, string>, comment: string, savedAt: number }`
- localStorage key: `styleguide_keeps` — Set of card names marked as "Keep"
- Helper functions: `getEditsRegistry()`, `upsertEdit()`, `removeEdit()`, `getKeeps()`, `toggleKeep()`

**3. Modify `StyleGuideTool.tsx`**
- Add `onRegisterEdits` prop (same pattern as `onRegisterDownload`) to register the edits modal opener
- Wrap each V2 card component (SwatchCardV2, TypoCardV2, ButtonCardV2, EntryCard) with hover overlay logic:
  - On hover, show a semi-transparent overlay with a pencil icon button
  - On click, open KeepOrEditModal with that card's data
- If card is in "keeps" list, show a small green "Keep" pill in top-right corner
- If card is in "edits" list, show a small amber "Edit" pill in top-right corner
- Pass card details (all props) to the modal so it can display them

**4. Modify `src/pages/Index.tsx`**
- Add `styleGuideEditsRef` (same pattern as download ref)
- Add edits count state, read from localStorage on mount
- Add "Edits" button to the left of the Download button in the style_guide header section, with counter badge (same style as Drafts button)
- Pass `onRegisterEdits` through AdminPage to StyleGuideTool

**5. Modify `src/pages/Admin.tsx`**
- Add `onRegisterStyleGuideEdits` prop, pass through to `LazyStyleGuide`

### Card Wrapper Approach
Rather than modifying every individual card component, create a `<StyleGuideCardWrapper>` component that wraps any card child with:
- `position: relative` container
- Hover state that shows an edit icon overlay
- Keep/Edit pill badges in top-right
- onClick handler that opens the KeepOrEditModal with the card's extracted data

Each card usage would become: `<StyleGuideCardWrapper cardType="swatch" cardName="Near Black" details={{...}}><SwatchCardV2 .../></StyleGuideCardWrapper>`

### Data Flow
```text
Card hover → Edit icon overlay → Click → KeepOrEditModal
  → "Keep" → adds to keeps localStorage, shows green pill
  → "Edit" → EditDetailModal (shows card details + comment textarea)
    → Save → adds to edits localStorage, shows amber pill

Header "Edits" button → EditsListModal (list of all edit entries)
  → Pencil icon → re-opens EditDetailModal to update comment
  → Trash icon → removes from edits list
```

### Implementation Order
1. Create `StyleGuideEditsModal.tsx` with all three modals + localStorage helpers
2. Create `StyleGuideCardWrapper` component in `StyleGuideTool.tsx`
3. Wrap all V2 card instances with the wrapper
4. Add header button + prop plumbing in Admin.tsx and Index.tsx

