

# Character Library Page -- Bug Fixes and Improvements (6 Items)

This plan addresses the issues you identified, incorporating your feedback on each.

---

## What You'll Notice After This

- A search bar in the header lets you find characters by name, nickname, description, or any keyword in their profile
- The redundant "Save" button is removed -- "Update Character" handles saving while keeping you in the editor
- Cancel no longer deletes already-saved characters from the library
- The editor background is solid black instead of semi-transparent
- Adding a character to the library from the Scenario Builder no longer removes it from the scenario
- The app guide is updated with all changes documented inline

---

## 1. Fix Cancel button behavior (was removing saved characters)

**The problem:** `handleCancelCharacterEdit()` always removes the character from the `library` state array, even if that character was already persisted in the database. This means clicking Cancel on an existing character you were editing would remove it from view (though it would reappear on next page load since it's still in the DB).

**The fix:** Only remove the character if it was newly created and never saved. We can detect this by checking if the character exists in the database (i.e., whether `characterInLibrary[id]` is true or whether the character was loaded from the initial fetch). For the library tab specifically:
- If the character was already persisted (existed before this session), Cancel should just deselect and return to the grid without removing
- If the character was just created via "New Character" and never saved, Cancel removes it (current behavior, which is correct for new unsaved entries)

We'll track newly-created-but-unsaved character IDs with a small Set in state so Cancel knows whether to remove or just deselect.

**Files:** `src/pages/Index.tsx`

---

## 2. Add search bar to Character Library

**The fix:** Add a search input in the header bar, to the right of the "Character Library" title. The search will filter the card grid by matching against:
- Character name
- Nicknames
- Role description (the text shown on the card)
- Tags
- All hardcoded section values (physical appearance fields, clothing, etc.)

This is a client-side filter since the full library is already loaded in memory. No database changes needed. The search will be case-insensitive and match partial strings.

Regarding your concern about breadth: since library characters are already fully loaded in memory (all fields), searching across all fields adds zero latency. It's just string matching on objects already in state. No extra database calls, no performance impact. So broadening the search to include nicknames, role description, and profile fields like you described (the "Ashley, mom" example) is the right call.

**Files:** `src/pages/Index.tsx` (header area, add search state and pass filtered list), `src/components/chronicle/CharactersTab.tsx` (no changes needed -- it already renders whatever characters are passed to it)

---

## 3. Remove redundant Save button, keep Update Character

**The problem:** There are two save buttons when editing a library character:
- "Save" -- saves to DB and deselects (navigates back to grid)
- "Update Character" -- saves to DB and stays in the editor

The user wants to remove the "Save" button since "Update Character" already covers the save functionality, and the back arrow in the header provides navigation back to the grid.

**The fix:** When `tab === "library"` and a character is selected, hide the "Save" button. The "Update Character" button remains as the sole save action. The Cancel button will be renamed to just navigate back (see item 1 -- it will deselect without removing for saved characters).

For the **Scenario Builder** (`tab === "characters"`), the Save button remains unchanged as it serves a different purpose there (saving the entire scenario).

**Files:** `src/pages/Index.tsx`

---

## 4. Fix empty state (already has skeleton card, just fix grammar)

**Current state:** Looking at the code, when `onAddNew` is provided (which it is for the library tab), the skeleton card always appears. The grammar issue ("Select import a character") only shows when `onAddNew` is NOT provided, which is the Scenario Builder's character grid -- not the library.

**The fix:** Fix the grammar in the Scenario Builder's empty state text from "Select import a character" to "Select or import a character from Library or Create New". The library page itself already shows the correct skeleton card as shown in your screenshot.

**Files:** `src/components/chronicle/CharactersTab.tsx` (line 589)

---

## 5. Make editor background fully opaque black

**The problem:** When editing a character in the library, the background page (`bg-black` on the container div) is being overlaid by the editor content, but the user noticed some text/content bleeding through from behind, making it look unintentional.

**The fix:** Ensure the library editor view's container div has a solid `bg-black` background that fully covers any underlying content. The current `p-10 overflow-y-auto h-full bg-black` on the library container (line 1873 in Index.tsx) should already be opaque. The issue may be from the `overflow-y-auto` allowing content from the main area to bleed. We'll add `relative z-10` to ensure full coverage, or investigate if there's a transparency in the parent.

After checking: the library tab renders inside the main content area which has `bg-slate-50/50`. The library div itself has `bg-black` which IS opaque. The bleed-through the user sees is likely from the white header bar and its shadow. We'll ensure the editor view's black background extends fully and there's no gap.

**Files:** `src/pages/Index.tsx` (library container styling)

---

## 6. Fix "Add to Character Library" removing character from scenario

**The problem:** This is the most significant bug. When you click "+ Character Library" in the Scenario Builder, `saveCharacterToLibrary` calls `characterToDb(char, userId, undefined, true)` which upserts with `scenario_id = null` and `is_library = true`. Since both the scenario character and the library entry share the same UUID, this **overwrites** the scenario character row, effectively removing it from the scenario.

**The fix:** When saving to library from the Scenario Builder, create a **copy** of the character with a new UUID for the library entry, rather than upsert with the same ID. This way:
- The scenario keeps its original character row (same ID, `scenario_id` set, `is_library = false`)
- The library gets a new independent row (new ID, `scenario_id = null`, `is_library = true`)
- We track the mapping between scenario character ID and library character ID so the "Update Character" button knows to update the existing library copy

We'll need to:
1. In `handleSaveToLibrary`, when saving from the Scenario Builder (not already in library), generate a new UUID for the library copy
2. Store the mapping (scenario char ID -> library char ID) in `characterInLibrary` state (change from `Record<string, boolean>` to `Record<string, string>` where value is the library character's ID)
3. When updating an existing library entry from the Scenario Builder, use the mapped library ID

**Files:** `src/pages/Index.tsx`, `src/services/supabase-data.ts` (add a `saveCharacterCopyToLibrary` function that creates with a new ID)

---

## Items NOT being changed (per your feedback)

- **Drag-to-reorder**: Skipping this. The search bar addresses the findability concern.
- **Extras row key collisions**: Not a real issue. The `uid()` function generates unique IDs. No fix needed.

---

## Technical Details

### Files Modified

- **`src/pages/Index.tsx`**
  - Add `librarySearchQuery` state and filter logic
  - Add search input to the library header bar
  - Track unsaved new character IDs to fix Cancel behavior
  - Hide "Save" button when `tab === "library"`
  - Fix `handleSaveToLibrary` to create a copy with new UUID when saving from Scenario Builder
  - Change `characterInLibrary` from `Record<string, boolean>` to `Record<string, string | boolean>` to track library copy IDs
  - Ensure library container has solid opaque background

- **`src/components/chronicle/CharactersTab.tsx`**
  - Fix empty state grammar: "Select or import a character" (line 589)

- **`src/services/supabase-data.ts`**
  - Add `saveCharacterCopyToLibrary(char, userId, newId)` function that inserts (not upserts) with a new ID and `is_library = true`

### App Guide Update

Update the "Character Library Page (Structure Guide)" document:
- Remove all 7 items from the Known Issues section (section 12)
- Document the search bar feature in the Layout section
- Document the simplified button layout (Update Character only, no Save)
- Document the Cancel behavior rules (remove only if unsaved new character)
- Document the library copy mechanism (separate ID from scenario character)
- Note the solid black background fix
- Note the grammar fix in the Scenario Builder empty state

