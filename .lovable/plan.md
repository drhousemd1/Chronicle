

## Plan: Fix World Section Title Placeholder Size + Add Content Type Picker to Character Builder

### Fix 1: World Core section title placeholder too small
In `WorldTab.tsx` line 654, the title input uses `text-[10px]` which makes the placeholder text tiny. Change to a larger size (e.g. `text-sm`) and make placeholder uppercase to match the filled-in style. Keep the faint ghost color.

**File:** `src/components/chronicle/WorldTab.tsx` line 654
- Change `text-[10px]` to `text-sm` (or similar readable size)
- Change `placeholder:normal-case` to `placeholder:uppercase` and `placeholder:tracking-widest`

### Fix 2: Add Content Type picker to Character Builder's "Add Category" button
Reuse the existing `CustomContentTypeModal` when clicking "+ Add Category" on the character builder page.

**Changes needed:**

1. **`src/types.ts`** — Add `type?: 'structured' | 'freeform'` and `freeformValue?: string` to `CharacterTraitSection`

2. **`src/components/chronicle/CharactersTab.tsx`**:
   - Import `CustomContentTypeModal`
   - Add state `showCategoryTypeModal` 
   - Change `onClick={handleAddSection}` to open the modal instead
   - Update `handleAddSection` to accept a type parameter, setting freeform sections with no items
   - Render freeform sections as title + single textarea (no "Add Item" button, no label/value rows)

3. **`src/components/chronicle/CharacterEditModal.tsx`** — Mirror the same freeform rendering for custom sections so the edit modal also supports it

Three files modified, no new files needed since `CustomContentTypeModal` already exists.

