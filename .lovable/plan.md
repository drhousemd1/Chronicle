

# Phase 3: Row Layout for Hard-Coded Character Containers

## What This Changes

The three hard-coded character sections -- **Physical Appearance**, **Currently Wearing**, and **Preferred Clothing** -- currently display each field as a label stacked above an input (the `HardcodedInput` component). This phase converts them to a **horizontal row layout** matching the custom category style, and adds an **"+ Add Row"** button at the bottom of each section so users can add their own custom fields.

## Current Layout (label above input)
```text
Hair Color
[_________________________]

Eye Color
[_________________________]
```

## New Layout (label beside value, matching custom categories)
```text
[Hair Color     ] [sparkle] [value field                    ]
[Eye Color      ] [sparkle] [value field                    ]
[Build          ] [sparkle] [value field                    ]
... (system rows - labels are read-only styled boxes)
[user label     ]           [user value                     ] [X]
[+ Add Row]
```

---

## Technical Plan

### 1. Add `CharacterExtraRow` type and `_extras` to types (`src/types.ts`)

Add a new type:
```typescript
export type CharacterExtraRow = {
  id: string;
  label: string;
  value: string;
};
```

Add `_extras?: CharacterExtraRow[]` as an optional field to `PhysicalAppearance`, `CurrentlyWearing`, and `PreferredClothing` types. Since it's optional, existing saved data loads without errors.

### 2. Replace `HardcodedInput` with a new `HardcodedRow` component (`src/components/chronicle/CharactersTab.tsx`)

Create a new `HardcodedRow` component that renders a single horizontal row:
- Left side: read-only label displayed in a styled box (same width ratio as custom categories: `w-2/5`)
- Middle: sparkle (AI enhance) button
- Right side: editable `AutoResizeTextarea` value field (`flex-1`)
- No delete button on system rows (they are permanent)

### 3. Create an `ExtraRow` component for user-added rows

Same horizontal layout as `HardcodedRow` but:
- Label field is editable (both label and value are `AutoResizeTextarea`)
- Has a red X delete button on the right
- No sparkle button (user-created extras don't have AI enhance)

### 4. Add "+ Add Row" button at the bottom of each section

A dashed-border button matching the existing custom category "Add Row" style:
- `border-dashed border-blue-500/30 hover:border-blue-400`
- Text: `+ Add Row`
- On click: appends a new `{ id, label: '', value: '' }` entry to the section's `_extras` array

### 5. Wire up extras state management in `CharactersTab.tsx`

Add handler functions:
- `handleAddExtra(section, field)` -- adds a blank row to `_extras`
- `handleUpdateExtra(section, id, patch)` -- updates label or value of an extra
- `handleDeleteExtra(section, id)` -- removes an extra row

These update the character via `onUpdate()` just like existing field handlers.

### 6. Update collapsed views to include extras

The `CollapsedPhysicalAppearance`, `CollapsedCurrentlyWearing`, and `CollapsedPreferredClothing` components will also render any filled `_extras` rows in their condensed summary view.

### 7. Update `CharacterEditModal.tsx` with same row layout

The chat modal's character edit view uses the same `HardcodedInput` pattern. It will be updated to use the same row layout and extras support for consistency.

### 8. Update `llm.ts` to include extras in prompt

When building the character context, extras from `_extras` will be appended after the system fields for each section, so the AI is aware of user-defined attributes.

### 9. Update `extract-character-updates` edge function

Add `_extras` to the TRACKABLE FIELDS documentation so the AI extraction service knows it can write new rows into these containers rather than creating separate custom sections.

---

## Files Affected

| File | Changes |
|------|---------|
| `src/types.ts` | Add `CharacterExtraRow` type; add `_extras?` to `PhysicalAppearance`, `CurrentlyWearing`, `PreferredClothing` |
| `src/components/chronicle/CharactersTab.tsx` | Replace `HardcodedInput` with `HardcodedRow`; add `ExtraRow` component; add "+ Add Row" buttons; add extras handlers; update collapsed views |
| `src/components/chronicle/CharacterEditModal.tsx` | Same row layout changes for the chat modal view |
| `src/services/llm.ts` | Include `_extras` when building character appearance/clothing context |
| `supabase/functions/extract-character-updates/index.ts` | Add `_extras` to TRACKABLE FIELDS for appearance and clothing sections |
| `src/services/supabase-data.ts` | Ensure `_extras` is preserved during save/load |

