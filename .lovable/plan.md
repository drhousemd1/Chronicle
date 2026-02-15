
# Scenario Builder & Character Builder Improvements

This is a large set of changes across multiple files. Here's everything organized by area.

---

## 1. Scenario Builder Header: Add "Save" and "Save and Close" Buttons

**File: `src/pages/Index.tsx`**

Add two buttons to the right side of the header when on the Scenario Builder page (`tab === "world"` or `tab === "characters"` without a selected character).

- **"Save and Close"** (left): Calls `handleSave(true)` which saves and navigates back to the hub.
- **"Save"** (right): Calls `handleSave(false)` which saves but stays on the current page.

Both use the Shadow Surface button style (`rounded-xl`, `bg-[hsl(var(--ui-surface-2))]`, `border-[hsl(var(--ui-border))]`, `shadow-[0_10px_30px_rgba(0,0,0,0.35)]`).

These appear in the header's right side `div` (around line 1514) when `tab === "world"` or when `tab === "characters" && !selectedCharacterId`.

---

## 2. Fix "Import from Library" Showing Empty

**File: `src/pages/Index.tsx`**

The `CharacterPicker` is rendered at line 1910 with `library={library}`. The `library` state is loaded from `supabaseData.fetchCharacterLibrary()` at startup. The issue is that on the Characters tab within a scenario, the "Import from Library" button only appears when `!selectedCharacterId` (line 1697-1701), and the picker modal opens fine.

The `library` array is being populated on load. However, the `CharacterPicker` component filters by name/tags and renders cards. If the library is empty (no characters saved to library yet), it shows "No matching characters found."

**Root cause investigation**: The library is populated with `fetchCharacterLibrary()` but characters are only synced to library on save (line 716-735 in `handleSaveWithData`). If a user has never explicitly saved, the library could be empty. Additionally, `handleSaveWithData` checks `!existingLibraryChar` by name match -- if names collide, it skips the save.

The fix: Ensure `library` state is refreshed when the picker opens, in case new characters were added since initial load. Add a `useEffect` or inline refresh when `isCharacterPickerOpen` becomes true.

---

## 3. Update "Import from Library" and "+ New Character" Button Styling

**File: `src/pages/Index.tsx`**

Currently these buttons (line 1699-1700) use the old `Button` component with `variant="secondary"` and `variant="primary"`. Update both to use the Shadow Surface button style to match the rest of the UI.

---

## 4. Remove AI Generate Button from Character Builder Header

**File: `src/pages/Index.tsx`**

Remove the entire "AI Generate" button block (lines 1614-1656) and its associated state/handler (`isAiGenerating`, `aiGenerateCharacter`). Keep the AI Fill button. Optionally remove the `aiGenerateCharacter` import and `isAiGenerating` state if no longer used elsewhere.

---

## 5. Add "Save" Button to Character Builder Header

**File: `src/pages/Index.tsx`**

Add a "Save" button (quick save) in the character builder header. The button order from left to right should be:
1. AI Fill (existing)
2. Save (new -- calls `handleSave(false)`)
3. Cancel (existing)
4. +Character Library (existing)

Use the Shadow Surface button style matching Cancel.

---

## 6. Add Per-Row AI Fill Sparkle Icons to All Missing Containers

This is the biggest change. The sparkle icon (Sparkles) for per-row AI fill currently exists on hardcoded rows in Physical Appearance, Currently Wearing, Preferred Clothing, and Background (via `HardcodedRow` component and custom section items). It's missing on user-added extra rows (`ExtraRow` component) and in several extras-only sections.

### 6a. Add sparkle to `ExtraRow` component

**File: `src/components/chronicle/CharactersTab.tsx`**

Modify the `ExtraRow` component to accept optional `onEnhance` and `isEnhancing` props, and render the sparkle button between the label and value fields (same pattern as `HardcodedRow`). Then wire up `onEnhance` for every `ExtraRow` usage across all sections: Physical Appearance extras, Currently Wearing extras, Preferred Clothing extras, Background extras, Tone extras, Key Life Events extras, Relationships extras, Secrets extras, Fears extras.

### 6b. Add sparkle to PersonalitySection `TraitRow`

**File: `src/components/chronicle/PersonalitySection.tsx`**

Add `onEnhance` and `isEnhancing` optional props to `TraitRow`. Render sparkle icon between label and value. Pass through from `TraitList`, which gets it from `PersonalitySection`. The `PersonalitySection` needs new props for `onEnhanceField` callback and `enhancingField` state. This applies to both split mode (outward/inward) and non-split mode.

`CharactersTab.tsx` needs to pass these props when rendering `PersonalitySection`.

### 6c. Add sparkle to avatar container after "Role Description" field

**File: `src/components/chronicle/CharactersTab.tsx`**

Add a sparkle button next to the Role Description textarea in the avatar panel (around line 755).

### 6d. Add sparkle to CharacterGoalsSection (Desired Outcome + Steps)

**File: `src/components/chronicle/CharacterGoalsSection.tsx`**

Add sparkle icons next to the "Desired Outcome" textarea and next to each step's description textarea. The component needs new props: `onEnhanceField` callback and `enhancingField` string. Wire from `CharactersTab.tsx`.

### 6e. Add sparkle to custom section items (already partially done)

**File: `src/components/chronicle/CharactersTab.tsx`**

The sparkle icon on custom section items (line 1100-1123) currently only shows when `item.label` is non-empty. This is correct behavior -- the AI needs to know what the field is about before it can fill it. No change needed here.

---

## 7. Rename "Story Goals and Desires" to "Story Goals"

**File: `src/components/chronicle/StoryGoalsSection.tsx`**

Change the heading text from "Story Goals and Desires" to "Story Goals" (line 109).

---

## 8. Add Per-Row AI Fill Sparkle to StoryGoalsSection

**File: `src/components/chronicle/StoryGoalsSection.tsx`**

Add sparkle icons next to "Desired Outcome" textarea and each step description. The component needs `onEnhanceField` and `enhancingField` props, which get passed from `WorldTab.tsx`.

**File: `src/components/chronicle/WorldTab.tsx`**

Add `handleEnhanceField` logic (similar to CharactersTab) and wire it into the StoryGoalsSection. Also add sparkle icons to Custom World Content section rows.

---

## 9. Add Per-Row AI Fill to World Custom Content Sections

**File: `src/components/chronicle/WorldTab.tsx`**

Add sparkle buttons next to each custom world content item's value field (around line 627-638). The sparkle should check the section title for context and use all available scenario data. This requires adding an `enhancingField` state and an `aiEnhanceWorldField`-style handler to WorldTab.

---

## Technical Summary

### Files Modified:
1. **`src/pages/Index.tsx`** -- Save/Save and Close buttons, button styling, remove AI Generate, add Save to character header, refresh library on picker open, wire enhancement props
2. **`src/components/chronicle/CharactersTab.tsx`** -- Add sparkle to ExtraRow, wire enhancement to PersonalitySection and CharacterGoalsSection, add sparkle to Role Description
3. **`src/components/chronicle/PersonalitySection.tsx`** -- Add sparkle to TraitRow (both split and non-split modes)
4. **`src/components/chronicle/CharacterGoalsSection.tsx`** -- Add sparkle to Desired Outcome and Steps
5. **`src/components/chronicle/StoryGoalsSection.tsx`** -- Rename to "Story Goals", add sparkle to Desired Outcome and Steps
6. **`src/components/chronicle/WorldTab.tsx`** -- Add sparkle to custom world content rows, wire StoryGoalsSection enhancement

### AI Enhancement Context Strategy:
When any per-row sparkle is clicked, the AI enhancement function gathers:
- All character card data for all characters in the scenario
- Full scenario/world context (name, premise, factions, locations, etc.)
- The section title and field label for targeted generation
- The current field value (if any) for enhancement rather than replacement

This uses the existing `aiEnhanceCharacterField` service for character fields and `aiEnhanceWorldField` for world/story fields, both of which already accept world context parameters.
