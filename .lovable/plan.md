

# Soften Character Tile No-Avatar Background

## Problem
When a character is added but has no avatar image, the tile background is `bg-slate-900` (line 595 in `CharactersTab.tsx`) — a harsh, flat near-black. The user wants it to match the softer gradient used by the "No Cover" and avatar placeholders: `bg-gradient-to-br from-zinc-800 to-zinc-900`.

## Change

**File**: `src/components/chronicle/CharactersTab.tsx`, line 595

Replace:
```
bg-slate-900
```
With:
```
bg-gradient-to-br from-zinc-800 to-zinc-900
```

Single class swap. The initial letter and centering remain unchanged.

