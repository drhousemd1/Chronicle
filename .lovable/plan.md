

# Rebuild CharacterPicker: Tile Cards + Search Bar + Chooser Border Fix

## Three issues to fix

### 1. Search bar — must match the page header pill style
**Source of truth**: `src/pages/Index.tsx:1871`
- Wrapper: `bg-[#2b2b2e] rounded-full p-1 border border-[#2b2b2e]`
- Input: `h-7 w-full px-3 py-1 text-xs font-bold rounded-full bg-transparent text-white placeholder:text-zinc-500 focus:outline-none`

Currently the CharacterPicker search uses a rectangular `bg-[#1c1c1f] border border-black/35 rounded-lg` input. Replace with the pill-shaped search bar.

### 2. Character cards — must match the Story Builder roster tiles
**Source of truth**: `src/components/chronicle/WorldTab.tsx:175-239`

Current cards are flat horizontal rows with small avatar thumbnails and text. They need to become image-first tiles matching the WorldTab roster:

- **Outer**: `group relative overflow-hidden rounded-2xl bg-black h-[140px] border border-[#4a5f7f]` with click-to-expand full image
- **Image**: `w-full h-full object-cover` using `objectPosition` from `avatarPosition`
- **Hover overlay**: `bg-black/0 group-hover:bg-black/25`
- **Name**: Bottom-left overlay — `text-sm font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]` (no User/AI badge)
- **Import button**: Top-right, styled like the "Done" reposition button from `CharactersTab.tsx:1468`:
  `rounded-md bg-black/55 border border-white/20 px-2 py-1 text-[9px] font-bold text-white hover:bg-black/70`
  Label: "Import"
- **Click-to-expand**: Same pattern — click tile to toggle between `h-[140px]` cropped and `h-auto object-contain` full view
- **No-avatar fallback**: `bg-gradient-to-br from-zinc-800 to-zinc-900 font-black text-5xl italic uppercase text-slate-500` with first letter

### 3. ChooserModal hover borders — all must use blue-500
**Files**: `CharacterCreationModal.tsx:25`, `CustomContentTypeModal.tsx:25`, `EnhanceModeModal.tsx:26`, `StyleGuideEditsModal.tsx:128`

All options currently set `hoverColor: 'purple-500'` on the right-side option. Change every instance to `'blue-500'` (or remove `hoverColor` since blue-500 is the default).

## Files to edit
1. **`src/components/chronicle/CharacterPicker.tsx`** — Replace search bar markup and completely rebuild the character card grid to use image-first tiles with expand/collapse
2. **`src/components/chronicle/CharacterCreationModal.tsx`** — Remove `hoverColor: 'purple-500'`
3. **`src/components/chronicle/CustomContentTypeModal.tsx`** — Remove `hoverColor: 'purple-500'`
4. **`src/components/chronicle/EnhanceModeModal.tsx`** — Remove `hoverColor: 'purple-500'`
5. **`src/components/admin/styleguide/StyleGuideEditsModal.tsx`** — Remove `hoverColor: 'purple-500'`

