

# Plan: Add "Confirmed" Checkmark Badge to Style Guide Components

## Concept
Add a checkmark confirmation system to the Style Guide's `EntryCard` and `SwatchCard` components. When a component/color has been audited and confirmed as the official styling, a purple checkmark badge (the uploaded SVG) appears in the bottom-right corner of its card. Confirmation state is persisted in localStorage so it survives refreshes.

## Changes

### 1. Copy the SVG asset
Copy `user-uploads://download.svg` → `public/images/confirmed-check.svg`

### 2. `src/components/admin/styleguide/StyleGuideTool.tsx`

**A. Add confirmation state management** (near top of main component):
- `useState<Set<string>>` for confirmed IDs, initialized from `localStorage`
- `toggleConfirmed(id)` function that updates state + persists to localStorage
- Key format: `"swatch::{name}"` or `"entry::{name}"` to uniquely identify each card

**B. Update `EntryCard`** — add optional `confirmed` boolean + `onToggleConfirm` callback props:
- When `confirmed` is true, render the purple checkmark SVG (as an `<img>`) positioned `absolute` bottom-right of the card container (the outer div needs `position: relative`)
- Add a small click target (e.g. a subtle button) to toggle confirmation on/off

**C. Update `SwatchCard`** — same pattern: `confirmed` + `onToggleConfirm` props, absolute-positioned checkmark bottom-right

**D. Pass props from parent** — wherever `EntryCard` and `SwatchCard` are used, pass `confirmed={confirmedSet.has(id)}` and `onToggleConfirm={() => toggleConfirmed(id)}`

### 3. Add note on the App Style Restructuring page
On the blank white workspace, add a brief legend/note explaining the checkmark system: "Purple checkmark = confirmed & finalized styling. Click any card's checkmark area to toggle."

## Visual Details
- Checkmark SVG rendered at ~28×28px, positioned `absolute bottom-2 right-2`
- Slight opacity treatment on unconfirmed cards (the check only appears when confirmed)
- Click the bottom-right corner area to toggle

