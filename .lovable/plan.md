

# Fix Reposition Button Border Opacity

## Problem
The Reposition buttons on both Character Builder and Story Builder use `border-[hsl(0_0%_100%_/_0.10)]` (10% opacity white), while the Upload Image button next to them uses `border-[hsl(var(--ui-border))]` which resolves to `--ui-border: 210 33% 98% / 0.30` (30% opacity). The borders should match.

## Changes

### 1. `src/components/chronicle/CharactersTab.tsx` (line 749)
Change `border-[hsl(0_0%_100%_/_0.10)]` → `border-[hsl(var(--ui-border))]`

### 2. `src/components/chronicle/WorldTab.tsx` (line 608)
Same change: `border-[hsl(0_0%_100%_/_0.10)]` → `border-[hsl(var(--ui-border))]`

Two files, one token swap each. Everything else stays identical.

