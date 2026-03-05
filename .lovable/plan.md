

## Plan: Three Changes

### 1. Character Roster Card — Remove Sex, Restructure to 3 Rows
**File:** `src/components/chronicle/WorldTab.tsx` lines 81-88

Replace the current layout with:
- Row 1: `Name: {char.name}`
- Row 2: `Age: {char.age}`
- Row 3: `Controlled by: {char.controlledBy}`

Remove the split header layout and the Sex line entirely.

### 2. Sidebar Subtitle — Use Only Story Name
**File:** `src/pages/Index.tsx` lines 806-807

Change `derivedTitle` to:
```
const derivedTitle = dataToSave.world.core.scenarioName || "New Story";
```
No more fallback to character names.

### 3. Mandatory Story Name on Save
**File:** `src/pages/Index.tsx` (save handler, ~line 805)  
**File:** `src/components/chronicle/WorldTab.tsx` (Story Name input field)

- Before saving, check if `world.core.scenarioName` is empty/whitespace
- If empty: set a `storyNameError` state flag, switch to the World tab, and skip the save
- In WorldTab, accept a `storyNameError` prop and apply a red ring (`ring-2 ring-red-500`) to the Story Name input when the flag is true
- Clear the error when the user types in the field
- No toasts — inline red text below the field saying "Story name is required"

