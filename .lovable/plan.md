

# Ghost White Swatch Consolidation + StyleGuideTool Preview Cleanup

## Problem
1. The `white/10` → `ghost-white` migration IS app-wide and complete — zero remaining instances in application code outside `StyleGuideTool.tsx`.
2. Inside `StyleGuideTool.tsx`, there are **~10 duplicate Ghost White swatches** scattered across page sections that need consolidating into single per-section entries.
3. The `StyleGuideTool.tsx` panel preview strings still contain ~122 stale `white/10` references in JSX preview elements.
4. `ALL_SWATCHES` contains `Ghost White (Border)` with value `rgba(255,255,255,0.05)` — this is actually `white/5`, a different color. It's being mislabeled as Ghost White.

## Plan

### A. Consolidate Ghost White swatches per section

Each page section should have **at most 1** Ghost White swatch that lists ALL locations for that section. Merge duplicates:

**Story Builder** (lines 1077 + 1120 → 1 swatch):
- Merge locations: text/bg uses + border uses into one card with combined locations and locationImages.

**Community Gallery** (lines 1306 + 1329 → 1 swatch):
- Merge card text + filter/border locations into one card.

**Chat Interface** (lines 1405 stays, line 1400 renamed):
- Line 1400 uses `rgba(255,255,255,0.05)` / `border-white/5` — this is NOT Ghost White. Rename to **"Faint White Border"** or similar to distinguish it.

**Chat History** (lines 1561 rename, 1604 + 1610 → 1 swatch):
- Line 1561 also uses `rgba(255,255,255,0.05)` — same rename treatment.
- Lines 1604 + 1610 both use `rgba(248,250,252,0.3)` — merge into one.

**Account Page** (lines 1704 + 1709 → 1 swatch):
- Merge border + text locations.

**Creator Profile** (lines 1744 rename, 1745 stays):
- Line 1744 uses `rgba(255,255,255,0.05)` — rename, not Ghost White.

### B. Fix ALL_SWATCHES

- Rename `Ghost White (Border)` (line 780, `rgba(255,255,255,0.05)`) to `Whisper White` or `Faint Border` — it is `white/5`, a genuinely different color still in use.

### C. Update panel preview strings

- Replace remaining `border-white/10`, `bg-white/10`, `border-white/20` in preview JSX strings within `StyleGuideTool.tsx` with `border-ghost-white` / `bg-ghost-white`.

### Files Modified
- `src/components/admin/styleguide/StyleGuideTool.tsx` — consolidate swatches, rename misnamed entries, fix preview strings

