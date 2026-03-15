

## Fix: Chat Tile Image Positioning

### Problem
Chat sidebar tiles use a naive `storedY - 50` formula for Y positioning, while WorldTab/CharactersTab use `mapObjectPositionFromPreviewToTile` which accounts for natural image dimensions and tile aspect ratios. The fix is to use the same mapping function.

### Changes — Single File: `ChatInterfaceTab.tsx`

**1. Add constants, types, cache, and the mapping function (replace lines 291-293)**
- Copy from WorldTab: `CHARACTER_AVATAR_PREVIEW_SIZE`, `CHAT_TILE_HEIGHT`, `CHAT_TILE_WIDTH`, `Size2D`, `avatarNaturalSizeCache`, and `mapObjectPositionFromPreviewToTile`
- Remove `storedAvatarYToTileY` and `tileYToStoredAvatarY`

**2. Add image size loading state + effect**
- Add a `useState<Record<string, Size2D>>` for character natural image sizes
- Add a `useEffect` that loops over `appData.characters`, checks cache, loads natural sizes for any with `avatarDataUrl` — same pattern as `CharacterRosterTile` but at parent level since `renderCharacterCard` is a plain function

**3. Update `getTileAvatarPosition` (~line 3253)**
- Instead of `storedAvatarYToTileY`, use `mapObjectPositionFromPreviewToTile(stored, naturalSize, { width: CHAT_TILE_WIDTH, height: CHAT_TILE_HEIGHT })` when natural size is available, fall back to raw stored position when not

**4. Update `persistMainCharacterTilePosition` (~line 3270)**
- Replace `tileYToStoredAvatarY` with the reverse mapping (convert tile-space coordinates back to preview-space coordinates using the inverse of the mapping function)

This reuses the exact same mapping logic as WorldTab — no new algorithm, no new component.

