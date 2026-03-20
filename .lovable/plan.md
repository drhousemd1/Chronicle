

# Fix Trash Can Placement, Field Height Matching, and Button Labels

## Problems Identified

### 1. Missing per-row trash cans (WorldTab)
- **Structured custom rows** (line 916): No trash icon per row — only the section-level trash exists. Users cannot delete individual label/description rows.
- **Freeform custom items** (line 1016): No trash icon next to each textarea. Users cannot remove individual freeform blocks.

### 2. Missing section-level trash (CharactersTab)
- **SECTION TITLE heading** (line 2032): Per-item subheading has no trash icon to delete the entire sub-item (heading + field). The section header (line 1999) has a trash to delete the whole custom section, but within the section, each item's "SECTION TITLE..." row lacks a delete control.

### 3. Trash alignment issues (CharactersTab)
- Freeform trash (line 2055): Uses `w-7 pt-2` but still looks misaligned because the container wrapping is `items-start` but the trash sits in a separate div that doesn't account for the subheading above.

### 4. Label vs Description height mismatch
- **Root cause**: Label fields use `text-xs` (12px / line-height 16px) while Description fields use `text-sm` (14px / line-height 20px). With AutoResizeTextarea calculating `scrollHeight`, different line-heights produce different rendered heights — even with identical `py-2` padding.
- **Fix**: Add `leading-5` (20px line-height) to all label fields so they match the description field's natural line-height. This keeps the smaller uppercase font but ensures identical single-line heights.
- **Affected**: Primary Locations and all structured custom rows in WorldTab, CharactersTab, and StoryCardView.

### 5. Button label changes
- WorldTab structured "Add Row" (line 998) → "Custom Content"
- WorldTab freeform "Add Row" (line 1043) → "Custom Content"
- CharactersTab "Add Row" (line 2161) → "Custom Content"
- StoryCardView "ADD ROW" (line 259) → "Custom Content"
- StoryCardView "ADD TEXT FIELD" (line 330) → "Custom Content"

---

## Changes by File

### 1. `src/components/chronicle/WorldTab.tsx`

**Structured custom rows (lines 915-987)**: Add a `w-7 pt-2` action slot with Trash2 icon after each description field, matching the Primary Locations pattern. Delete handler removes that single item from the section's items array.

**Freeform custom items (lines 1015-1031)**: Wrap each textarea in a `flex items-start gap-3` row with a `w-7 pt-2` Trash2 action slot on the right. Delete handler removes that item (or resets to one empty item if last).

**Primary Locations label field (line 837)**: Add `leading-5` class so line-height matches description field.

**Structured custom label field (line 928)**: Add `leading-5` class.

**Button labels (lines 998, 1043)**: Change "Add Row" to "Custom Content".

### 2. `src/components/chronicle/CharactersTab.tsx`

**Per-item SECTION TITLE row (lines 2031-2040)**: Wrap the subheading `<input>` in a `flex items-center gap-3` row with a Trash2 icon on the right. This trash deletes the entire item (heading + content). This gives parity with WorldTab's section-level trash pattern.

**Structured label field (line 2081)**: Add `leading-5` class.

**Freeform item layout**: The trash is already present but verify alignment uses the standard `w-7 pt-2` slot.

**Button label (line 2161)**: Change "Add Row" to "Custom Content".

### 3. `src/components/chronicle/StoryCardView.tsx`

**Location label field (line 125)**: Add `leading-5` class.

**Structured custom label field (line 220)**: Add `leading-5` class.

**Button labels (lines 259, 330)**: Change "ADD ROW" and "ADD TEXT FIELD" to "Custom Content".

---

## Summary

| Fix | WorldTab | CharactersTab | StoryCardView |
|-----|----------|---------------|---------------|
| Per-row trash on structured items | Add | Already present | Already present |
| Per-item trash on freeform items | Add | Already present | Already present |
| Section-level trash on SECTION TITLE | Already present | Add per-item | N/A (different layout) |
| Label `leading-5` for height match | Add to 2 fields | Add to 1 field | Add to 2 fields |
| Button → "Custom Content" | 2 buttons | 1 button | 2 buttons |

**Files modified**: `WorldTab.tsx`, `CharactersTab.tsx`, `StoryCardView.tsx`

