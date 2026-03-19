

# Rename "World Codex" → "Custom AI Rules"

## Changes

### 1. Update section header in WorldTab.tsx
- Rename "World Codex" → "Custom AI Rules"
- Change the database/cylinder icon to a more fitting icon (e.g., `BrainCog` or `Wand2` from lucide)

### 2. Rename the text field
- Change "Additional Formatting Rules (Optional)" → "Custom Rules (Optional)"
- Update placeholder from "Add any custom formatting preferences here..." → "e.g. Characters can only use items in their inventory..."

### 3. Keep everything else as-is
- The locked "Dialog Formatting" section stays untouched
- The "Additional Entries" codex entries below stay (if they exist)
- No data model changes needed — `dialogFormatting` field on `WorldCore` still holds the value, just the label changes

### 4. Update any references
- Search for "World Codex" in comments/labels across the codebase and rename to "Custom AI Rules"
- Update any guide docs that reference "World Codex"

### Files Modified
- `src/components/chronicle/WorldTab.tsx` — header text, field label, placeholder, icon
- Any docs/guides referencing "World Codex"

