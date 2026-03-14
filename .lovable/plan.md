

## Plan: Freeform Section Labels, Multi-Entry Support, Expansion Fix, and Button Styling

### Problem
1. **Freeform sections** (large text field type) have no label above the textarea and only support a single text area — users want multiple labeled text areas per section
2. **New custom sections** are collapsed by default when added — should be expanded
3. **"Add Row" buttons** in custom sections still use the old dashed-outline style instead of the updated shadow-surface style
4. **WorldTab "Label..." placeholder** still uses lowercase and has `placeholder:normal-case` override

### Changes

#### 1. Freeform sections: add label + multi-entry support
**Files: `CharactersTab.tsx`, `CharacterEditModal.tsx`, `WorldTab.tsx`, `StoryCardView.tsx`**

Currently freeform sections store a single `freeformValue` string and render one textarea. Change to use the existing `items[]` array (same data structure as structured sections) but render values as large multi-line textareas instead of single-line descriptions.

- When rendering freeform: show each item as a **LABEL input** (same uppercase style) above a **large textarea** (rows=4), with a delete button
- Add an **"Add Text Field"** button at the bottom (same shadow-surface button style)
- For **backward compatibility**: if a freeform section has `freeformValue` but empty `items[]`, auto-migrate the freeformValue into `items[0]` with an empty label
- When creating a new freeform section, seed it with one empty item: `{ id, label: '', value: '' }`
- Update collapsed summary to iterate items instead of showing freeformValue

#### 2. New custom sections default to expanded
**Files: `CharactersTab.tsx`, `CharacterEditModal.tsx`**

When `handleAddSection` / `addNewSection` creates a new section, also set `expandedCustomSections[newSection.id] = true` in state. Currently the fallback `?? true` handles this, but the screenshots show they're collapsed — likely the toggle state is being set. Explicitly set expanded on creation.

#### 3. Fix "Add Row" / "Add Item" button styling
**Files: `CharactersTab.tsx` (line 1943-1949), `CharacterEditModal.tsx` (line 1807-1814), `WorldTab.tsx` (line 817-828, 848-855)**

Replace all remaining dashed-outline add buttons in custom sections with the updated shadow-surface style:
```
w-full h-10 text-xs font-bold text-blue-500 hover:text-blue-300 bg-[#3c3e47] rounded-xl 
shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] 
hover:brightness-110 transition-all
```

#### 4. Fix WorldTab "Label..." placeholder
**File: `WorldTab.tsx` (line 751-752)**

Change `placeholder="Label..."` to `placeholder="LABEL"` and remove `placeholder:normal-case placeholder:tracking-normal`.

### Files modified
- `src/components/chronicle/CharactersTab.tsx` — freeform rendering, add button, expansion
- `src/components/chronicle/CharacterEditModal.tsx` — freeform rendering, add button, expansion
- `src/components/chronicle/WorldTab.tsx` — freeform rendering, add button, label placeholder
- `src/components/chronicle/StoryCardView.tsx` — freeform rendering (already uses items pattern but needs label above textarea)
- `src/pages/Index.tsx` — seed freeform sections with one item instead of empty array

