

# Fix SidebarThemeModal Drag-and-Drop Bugs

## Root Cause
The `onDrop` handler persists category changes to the database but never tells the parent (`ChatInterfaceTab`) to update its `sidebarBackgrounds` state. Since `effectiveRows` is derived from the `backgrounds` prop, tiles appear in both old and new locations (duplication), and new categories can only hold one tile before the stale prop data overrides everything.

## Fix

### File: `src/components/chronicle/SidebarThemeModal.tsx`
- Add a **local state mirror** of backgrounds (`localBackgrounds`) initialized from the `backgrounds` prop via `useEffect`
- Derive `effectiveRows` from `localBackgrounds` instead of `backgrounds`
- On drop: update `localBackgrounds` directly (move tile between categories, update sort orders) AND persist to DB
- Remove the `extraRows` state — no longer needed since `localBackgrounds` is the source of truth and new categories are represented by updating a tile's `category` field
- On rename: update `localBackgrounds` category fields directly

### File: `src/components/chronicle/ChatInterfaceTab.tsx`
- Add an `onReorder` callback prop that the modal calls after a successful drop, passing the updated backgrounds array back to the parent so `sidebarBackgrounds` stays in sync
- This ensures that closing and reopening the modal doesn't revert changes

## Result
- Dragging a tile removes it from the source row and places it in the target — no duplication
- New categories can hold multiple tiles
- Changes persist across page refreshes (DB) and modal close/reopen (parent state sync)

