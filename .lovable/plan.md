

# Add "AI Update" Button and Goals Section to Character Edit Modal

## Summary

Three changes to the `CharacterEditModal`:
1. Add the `CharacterGoalsSection` component so goals are visible and editable in the chat session modal
2. Add an **"AI Update"** button in the modal header with the premium iridescent styling (matching AI Generate buttons elsewhere) and a tooltip reading "Run additional scan of dialog to update character card"
3. Wire `goals` into the save logic so edits persist

---

## What Changes

### 1. CharacterEditModal.tsx

**New imports:**
- `CharacterGoalsSection` from `./CharacterGoalsSection`
- `CharacterGoal` from `@/types`
- `Sparkles` from `lucide-react`
- `Tooltip, TooltipContent, TooltipTrigger, TooltipProvider` from `@/components/ui/tooltip`
- `uid, now` from `@/utils`

**New props on the component interface:**
- `conversationId?: string` -- needed to fetch message history for the deep scan
- `allCharacters?: (Character | SideCharacter)[]` -- for context during extraction
- `onDeepScanComplete?: (draft: CharacterEditDraft) => void` -- optional callback

**CharacterEditDraft type update:**
- Add `goals?: CharacterGoal[]` field

**New state:**
- `isDeepScanning` (boolean) -- loading state for the AI Update button

**Draft initialization (useEffect):**
- When initializing the draft from the character, also copy `goals`:
  ```
  goals: ('goals' in character) ? character.goals?.map(g => ({ ...g })) || [] : []
  ```

**Expanded sections default:**
- Add `goals: true` to the `expandedSections` initial state

**Modal header update:**
- The current header is a simple black bar with "Edit Character" title and subtitle
- Add the "AI Update" iridescent button to the right side of the header, wrapped in a Tooltip
- The button uses the exact same 9-layer iridescent design from `AvatarActionButtons.tsx` (lines 74-176): shimmer border, #2B2D33 inner mask, teal/purple color blooms, Sparkles icon
- Button label: **"AI Update"** (changes to "Analyzing..." with spinner during processing)
- Tooltip text: **"Run additional scan of dialog to update character card"**
- The header layout becomes a flex row: title/subtitle on the left, AI Update button on the right

**"AI Update" handler (`handleDeepScan`):**
1. Set `isDeepScanning = true`
2. Fetch the most recent ~50 messages from the `messages` table for the current `conversationId`, ordered by `created_at desc`, limited to 50
3. Concatenate messages into a dialogue string (alternating user/assistant labels)
4. Call the existing `extract-character-updates` edge function with:
   - The concatenated dialogue as context
   - The current character's state (from the draft)
   - The model ID
5. Parse the returned updates array
6. Merge each update into the `draft` state (same field-path logic as `applyExtractedUpdates` in ChatInterfaceTab, but applied to the local draft):
   - `physicalAppearance.*` fields
   - `currentlyWearing.*` fields
   - `preferredClothing.*` fields
   - `location`, `currentMood`, `nicknames`
   - `sections.*` (custom categories)
   - `goals.*` (parsed from "status | progress: XX" format)
7. Set `isDeepScanning = false`
8. Show toast: "Character card updated from dialogue"

**Goals section in the modal body:**
- Add `CharacterGoalsSection` between the "Preferred Clothing" section and the custom categories section (matching Scenario Builder layout)
- Wire it with:
  - `goals={draft.goals || []}`
  - `onChange={(goals) => setDraft(prev => ({ ...prev, goals }))}`
  - `isExpanded={expandedSections.goals}`
  - `onToggle={() => toggleSection('goals')}`

---

### 2. ChatInterfaceTab.tsx

**Pass new props to CharacterEditModal:**
- Add `conversationId={conversationId}` prop
- Add `allCharacters={allCharactersForDisplay}` prop

**Update `handleSaveMainCharacterEdit`:**
- Add `goals: draft.goals` to the `updateSessionState` patch (line ~1983-1999)

---

## Button Styling Detail

The "AI Update" button replicates the exact iridescent button architecture used throughout the app (from AvatarActionButtons, CoverImageActionButtons, etc.):

- Layer 1: Iridescent outer border ring (teal-to-purple gradient with white accents)
- Layer 2: #2B2D33 mask creating 2px border effect
- Layer 3: Subtle teal/purple gradient surface
- Layer 4: Soft top sheen
- Layer 5: Diagonal border highlight
- Layer 6: Teal bloom (top-left radial gradient)
- Layer 7: Purple bloom (bottom-right radial gradient)
- Layer 8: Crisp inner edge box-shadow
- Content: Sparkles icon (cyan-200 with glow filter) + "AI Update" text

The button is wrapped in `TooltipProvider > Tooltip > TooltipTrigger` with `TooltipContent` showing "Run additional scan of dialog to update character card".

During loading state, the Sparkles icon is replaced with a spinning Loader2 icon and the text changes to "Analyzing..."

---

## Files Modified

| File | Changes |
|------|---------|
| `src/components/chronicle/CharacterEditModal.tsx` | Add goals to draft type, add CharacterGoalsSection, add AI Update iridescent button with tooltip and deep scan logic |
| `src/components/chronicle/ChatInterfaceTab.tsx` | Pass conversationId and allCharacters to modal, add goals to save handler |

---

## What This Does NOT Change

- No changes to the edge function -- we reuse the existing `extract-character-updates` function
- No changes to the database schema -- the `goals` column already exists
- No changes to the data services -- goals wiring was already done in the previous update
- No new components -- reuses existing `CharacterGoalsSection` and tooltip components
- The iridescent button is built inline (matching the pattern in AvatarActionButtons) rather than creating a shared component, staying consistent with how it's done elsewhere in the codebase

