

# Custom Content: Mixed Types per Item + Subheading Labels

## Summary
Three changes to custom content sections in the Character Builder:
1. **"Add Row" button** (both freeform and structured) now opens the Content Type chooser modal instead of directly adding an item — so users can mix freeform and structured items within one section.
2. **Rename** the freeform "Add Text Field" button to **"Add Row"** for consistency.
3. **Add a subheading input** above each item (both types) so users can label individual rows within a section.

## Changes

### 1. `src/types.ts` — Add per-item fields to `CharacterTraitItem`
Add two optional fields:
- `type?: 'structured' | 'freeform'` — per-item type (falls back to `section.type` for legacy data)
- `subheading?: string` — optional label displayed above the item

### 2. `src/components/chronicle/CharactersTab.tsx`

**a) New state + modal routing for "Add Row" clicks**
- Add `pendingAddRowSectionId` state to track which section's "Add Row" was clicked
- Add a second `CustomContentTypeModal` instance (or reuse with conditional handler) that, on selection, calls `handleAddItem` with the chosen type and clears the pending state

**b) Update `handleAddItem` to accept a `type` parameter**
- New item gets `type` set to `'structured'` or `'freeform'` based on the modal selection

**c) Both "Add Row" buttons → open modal**
- **Freeform section** (line 2080-2089): Change `onClick` to set `pendingAddRowSectionId` and open the modal. Rename "Add Text Field" to "Add Row".
- **Structured section** (line 2177-2183): Change `onClick` to set `pendingAddRowSectionId` and open the modal.

**d) Per-item type rendering**
- Instead of branching on `section.type` to render ALL items one way, iterate `section.items` and render each based on `item.type ?? section.type`:
  - `'freeform'`: subheading input + AutoResizeTextarea (rows=4) + centered trash icon
  - `'structured'`: subheading input + label/sparkle/description row + centered trash icon

**e) Subheading input above each item**
- Render an editable input styled like existing labels: `text-xs font-bold uppercase tracking-widest text-zinc-500 bg-[#1c1c1f] border border-black/35 rounded-lg px-3 py-2`
- Placeholder: `"SUBHEADING (OPTIONAL)"`
- Bound to `item.subheading`, updated via `handleUpdateSection`

**f) Backward compatibility**
- Items without a `type` field inherit from `section.type` at render time — no migration needed.

## Files Modified
- `src/types.ts` — 2 new optional fields on `CharacterTraitItem`
- `src/components/chronicle/CharactersTab.tsx` — Modal routing, per-item rendering, subheading inputs, button rename

