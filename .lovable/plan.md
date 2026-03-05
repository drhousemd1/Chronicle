

## Plan: Publish-to-Gallery Validation

**Goal:** When a user clicks "Publish to Gallery" in the ShareScenarioModal, run a comprehensive validation check before allowing the publish action. This is publish-only -- saving to "My Stories" remains unaffected.

### Validation Rules

| # | Field | Rule |
|---|-------|------|
| 1 | Story title | Non-empty, "Untitled Story" doesn't count |
| 2 | Story premise | `world.core.storyPremise` non-empty |
| 3 | Opening dialog | `openingDialog.text` non-empty |
| 4 | Tags | At least 5 tags total across `contentThemes` categories (excluding storyType SFW/NSFW) -- sum of characterTypes + genres + origin + triggerWarnings + customTags >= 5 |
| 5 | SFW/NSFW | `contentThemes.storyType` must be 'SFW' or 'NSFW' |
| 6 | Characters | At least 1 character exists |
| 7 | Character names | Each character must have a non-empty name; "New Character" is treated as blank |
| 8 | Location | At least 1 `structuredLocations` entry with non-empty label and description |
| 9 | Story arc | At least 1 `storyGoals` entry with non-empty title and desiredOutcome |
| 10 | NSFW age check | If storyType is NSFW, every character with a numeric age < 18 gets flagged with "Characters in NSFW stories must be 18+" |

### Architecture

**New file: `src/utils/publish-validation.ts`**
- Pure function `validateForPublish(data)` that takes story data, characters, content themes, opening dialog, and returns a structured errors object.
- Each error field maps to a specific section/field so the UI can highlight the right spot.

**Modified: `src/components/chronicle/ShareStoryModal.tsx`**
- Add new props: `characters`, `world`, `openingDialog`, `contentThemes` (the modal currently only receives `scenarioId` and `scenarioTitle`).
- On clicking "Publish to Gallery" or "Update Publication", run `validateForPublish()` first.
- If errors exist, display them in a scrollable error summary list above the action buttons (red-bordered cards listing each issue).
- Block the publish call until all errors are resolved.

**Modified: `src/components/chronicle/WorldTab.tsx`**
- Pass the additional props (`characters`, `world`, `openingDialog`, `contentThemes`) down to `ShareScenarioModal`.
- Add publish validation error state that can highlight character roster items:
  - If "no characters" error: show red dashed border on the Add Character placeholder + red text "At least 1 character is required" below it.
  - If character name/age errors: show red border on the specific `CharacterButton` card with inline error text beneath.
- These error highlights appear only after a failed publish attempt and clear when the modal closes.

**Modified: Character roster (`CharacterButton` in WorldTab.tsx)**
- Accept optional `errors` prop (array of strings like "Name is required", "Age must be 18+ for NSFW").
- When errors present: add `border-red-500` to the card, render error messages below in `text-xs text-red-500`.
- Treat name === "New Character" or name === "" as missing name.

### Error Display Strategy

**Inside the ShareScenarioModal:** A compact error summary panel appears between the story title display and the action buttons, styled like the existing blue info box but with red (`bg-red-500/10 border-red-500/20`). Lists all issues with bullet points so the user knows exactly what to fix.

**In the sidebar character roster:** Red highlights on the character panel itself (matching the mockup images), with inline error text. This gives the user visual cues without needing to scroll through the main content area.

### What stays unchanged
- Saving to "My Stories" -- no validation changes, only the existing story name check.
- The "New Character" default name will be treated as blank for validation purposes only (not removed from the UI default), so the card still shows "New Character" but it won't pass publish validation.

### Files to create/modify
1. **Create** `src/utils/publish-validation.ts` -- validation logic
2. **Modify** `src/components/chronicle/ShareStoryModal.tsx` -- run validation, show error summary, accept new props
3. **Modify** `src/components/chronicle/WorldTab.tsx` -- pass new props to modal, display character-level validation errors in sidebar

