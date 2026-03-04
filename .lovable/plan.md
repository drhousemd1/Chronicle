

## Replace Character Navigation with a Modal Popup

### Current behavior
Clicking "Add Character" in the Scenario Builder navigates to `tab === "characters"` -- a full blank page with header buttons (Cancel, Import from Library, + New Character). This is redundant since characters are already visible in the Scenario Builder sidebar.

### New behavior
Instead of navigating away, show a **modal popup** (similar to the Enhancement Style modal) with:
- Title: **"Character Creation"**
- Subtitle: **"Select or import a character from Library or Create New"**
- Two cards side-by-side:
  1. **Import from Library** -- opens the existing CharacterPickerWithRefresh
  2. **+ New Character** -- creates a new character inline and selects it

### Files to change

**1. Create `src/components/chronicle/CharacterCreationModal.tsx`**
- New Dialog component styled like the existing `EnhanceModeModal` (dark theme, two side-by-side option cards, rounded-2xl borders)
- Props: `open`, `onClose`, `onImportFromLibrary`, `onCreateNew`
- Uses `Users` and `Plus` icons from lucide-react for the two cards

**2. Edit `src/components/chronicle/WorldTab.tsx`**
- Replace `onNavigateToCharacters` callback in `AddCharacterPlaceholder` with opening the new modal
- Add state: `isCharacterCreationOpen`
- Add new props: `onCreateCharacter` (creates new character + selects it) and `onOpenLibraryPicker` (opens the library picker)
- Render `CharacterCreationModal` inside WorldTab
- Remove `onNavigateToCharacters` prop

**3. Edit `src/pages/Index.tsx`**
- Remove `onNavigateToCharacters` prop from WorldTab
- Add `onCreateCharacter` and `onOpenLibraryPicker` props to WorldTab
- `onCreateCharacter`: calls `handleCreateCharacter()` (already exists) and stays on world tab
- `onOpenLibraryPicker`: sets `isCharacterPickerOpen(true)` (already exists)
- The blank characters page (when `!selectedCharacterId && tab === "characters"`) remains intact for the library tab flow but is no longer the primary entry point from WorldTab

### Visual design (matching EnhanceModeModal)
- `bg-zinc-900 border-white/10` dialog
- Two cards: left = "Import from Library" (book icon, blue accent), right = "+ New Character" (plus icon, purple accent)
- Same card hover states as EnhanceModeModal

