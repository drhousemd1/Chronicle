

## Plan: Draft Auto-Save, Save & Close Validation, and Dual Character Placeholders

### Understanding the Current Behavior

- **"Save" button** currently writes to the database (same as "Save and Close" but without navigating to hub)
- **"Save and Close"** writes to DB then navigates to My Stories hub
- There's already a `handleNavigateAway` that stashes drafts to `localStorage` as a safety net
- Publish validation exists in `publish-validation.ts` but is only used for the Publish flow

### What Changes

#### 1. Make "Save" a Local Draft Save (not DB)
Change the "Save" button to only persist to `localStorage` (like `handleNavigateAway` already does with `draft_{id}`). Show a toast confirming "Draft saved locally." This protects against page refreshes and tab switches without committing to "My Stories."

On story builder load, check for a matching `draft_{id}` in localStorage and restore it (this path may already exist via `handleNavigateAway` — need to verify and ensure it's wired for the "new story" flow too).

#### 2. Add Validation to "Save and Close" 
Before writing to the database, run validation checks matching the publish flow. Specifically:
- Story title required
- At least 1 AI character (`controlledBy === 'AI'`)
- At least 1 User character (`controlledBy === 'User'`)

If validation fails: block the save, switch to the World tab, and display errors (red borders + messages) — same UX as publish validation.

#### 3. Update Validation Logic (`publish-validation.ts`)
- Replace `noCharacters` with `noAICharacter` and `noUserCharacter`
- Check `characters.some(c => c.controlledBy === 'AI')` and `characters.some(c => c.controlledBy === 'User')`
- Update `PublishValidationErrors` interface accordingly

#### 4. Add Second "Add/Create" Placeholder in Main Characters (`WorldTab.tsx`)
- Split the single placeholder into two: "AI Character" and "User Character"
- Each shows its respective error when validation fails
- Both open the same character creation modal

#### 5. Update All References to `noCharacters`
Any code referencing `publishErrors.noCharacters` needs updating to reference the two new fields.

### Files to Change
- `src/utils/publish-validation.ts` — split character check into AI + User
- `src/pages/Index.tsx` — change "Save" to localStorage-only; add validation to "Save and Close"
- `src/components/chronicle/WorldTab.tsx` — dual character placeholders + updated error display

### Draft Restore on Load
The existing `draft_{id}` localStorage pattern from `handleNavigateAway` will be extended so that when a user opens a story, it checks for a local draft and offers to restore it (or auto-restores it silently).

