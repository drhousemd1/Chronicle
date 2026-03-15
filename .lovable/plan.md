

## Plan: Fix dark corner triangles on Add Character buttons

**Problem**: The `AddCharacterPlaceholder` buttons (line 603) have a large outer shadow (`0_8px_24px`). Their parent containers (lines 633, 651) use `overflow-hidden` for the collapse animation — this clips the shadow at the rounded corners, creating the dark triangle artifacts.

**Fix** in `src/components/chronicle/WorldTab.tsx`:

- **Line 633**: Change the expanded state to use `overflow-visible` instead of keeping `overflow-hidden`:
  ```
  overflow-hidden → ${mainCharsCollapsed ? 'max-h-0 opacity-0 overflow-hidden' : 'max-h-[2000px] opacity-100 overflow-visible'}
  ```

- **Line 651**: Same change for the side characters container:
  ```
  overflow-hidden → ${sideCharsCollapsed ? 'max-h-0 opacity-0 overflow-hidden' : 'max-h-[2000px] opacity-100 overflow-visible'}
  ```

This keeps `overflow-hidden` only when collapsing (where it's needed for animation) and switches to `overflow-visible` when expanded so the button shadows render cleanly.

