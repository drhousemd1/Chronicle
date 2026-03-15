

## Implementation Plan: Story Builder Tile Cards + Chat Interface Border Fix

This is a direct transfer from a ChatGPT Codex sandbox. Two files are changed: `WorldTab.tsx` and `ChatInterfaceTab.tsx`.

---

### Phase 1: WorldTab.tsx — Replace CharacterButton with CharacterRosterTile

**Step 1a: Update import**
- Line 2: Add `useMemo` to the React import.

**Step 1b: Replace CharacterButton component (lines 68-105)**
- Remove the entire `CharacterButton` component.
- Insert the new code block from the guide (sections 2.1-2.2):
  - `clampPercent`, constants (`CHARACTER_AVATAR_PREVIEW_SIZE`, `STORY_ROSTER_TILE_HEIGHT`, `STORY_ROSTER_TILE_WIDTH`), `Size2D` type, `avatarNaturalSizeCache` map.
  - `mapObjectPositionFromPreviewToTile` function.
  - Full `CharacterRosterTile` component with expand/collapse, natural image size caching, position mapping, overlays, edit button, name/badge placement.

**Step 1c: Add state + cleanup effect (inside WorldTab component, around line 152)**
- Add `expandedRosterTileId` state.
- Add cleanup `useEffect` that resets expanded tile if character is removed.

**Step 1d: Widen sidebar (line 471)**
- Change `w-[260px]` → `w-[300px]`.

**Step 1e: Replace character mapping blocks (lines 482, 494)**
- Replace `mainCharacters.map(char => <CharacterButton ...>)` with `<CharacterRosterTile>` usage including `isExpanded` and `onToggleExpand` props.
- Same for `sideCharacters.map`.
- Keep Add/Create placeholders unchanged.

---

### Phase 2: ChatInterfaceTab.tsx — Slate blue border

**Step 2a: Update border class (line 3388)**
- Replace `${!sidebarBgIsLight ? 'border-transparent hover:border-white/20' : 'border-transparent hover:border-white/25'}` with `border-[#4a5f7f] hover:border-[#4a5f7f]`.

---

### Validation Checklist
1. Story Builder sidebar is 300px wide.
2. Character tiles are image-first, 140px collapsed, expandable.
3. Edit icon top-right, AI/User badge bottom-right, name bottom-left.
4. Avatar framing matches Character Builder preview (position mapping).
5. No expand/collapse jump (cached natural dimensions + fixed tile width).
6. Red border validation still works on tiles with errors.
7. Add/Create placeholders unchanged.
8. Chat Interface tiles have fixed slate blue border on idle and hover.

