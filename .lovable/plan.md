

# Fix: Trashcan Color, Title Color, Toggle Background, Tile Height

## Issues (4 items)

### 1. Red trashcans on custom section headers
**Modal (line 1150):** `text-red-500 hover:text-red-400 hover:bg-red-900/30`
**Builder (CharactersTab.tsx line 2026):** `text-white hover:text-red-400 hover:bg-white/10 transition-colors`

Fix: Match builder — white default, red on hover.

### 2. "Edit Character" title color
**Modal (line 1569):** `text-slate-900` — arbitrary choice on white header.
**Builder (Index.tsx):** Uses `text-[hsl(var(--ui-surface-2))]` which is Graphite (`hsl(228 7% 20%)`).

Fix: Change to `text-[hsl(var(--ui-surface-2))]` to match builder header title.

### 3. Toggle container background
**Modal (line 1584):** `bg-zinc-800 border border-zinc-700` — arbitrary.
**Builder:** `bg-[#2b2b2e] border border-[#2b2b2e]` (same color border, seamless dark pill).

Fix: Match builder exactly.

### 4. Tile height
**Modal (line 1352):** `height: 120`
**Builder:** `CHARACTER_HEADER_TILE_HEIGHT = 140`

Fix: Change to 140 to match builder.

## Files Changed
- `src/components/chronicle/CharacterEditModal.tsx` (4 line-level edits)

