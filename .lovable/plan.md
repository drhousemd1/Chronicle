

# Apply Style Guide Edits: Dim White + Faint White → Ghost White

## Edits to Apply

From the Style Guide Edits modal:

| # | Swatch | Current Value | Token | Target |
|---|--------|---------------|-------|--------|
| 1 | **Dim White** | `rgba(255,255,255,0.2)` | `white/20` | Ghost White `rgba(248,250,252,0.3)` |
| 2 | **Faint White** | `rgba(255,255,255,0.1)` | `white/10` | Ghost White `rgba(248,250,252,0.3)` |

## Scope Assessment

This is an extremely large change:
- `white/10` appears **~956 times** across **42 files** (borders, backgrounds, hover states)
- `white/20` appears **~246 times** across **20 files** (borders, backgrounds, hover states)
- CSS variable `--ui-border: 0 0% 100% / 0.10` is white/10 under the hood, used via `hsl(var(--ui-border))` in **260 places** across 14 files
- CSS variable `--ui-border-hover: 0 0% 100% / 0.16` is a related opacity variant

### Usage breakdown for white/10:
- `border-white/10` — 693 matches (panel borders, modal borders, card borders, input borders)
- `bg-white/10` — 270 matches (button hovers, toggle pills, active states, backgrounds)
- `hover:bg-white/10` — 135 matches (interactive hover states)
- `text-white/10` — 30 matches (watermark placeholder letters on cover images)
- Also used in: `active:bg-white/10`, `focus:bg-white/10`, compound classes

### Usage breakdown for white/20:
- `border-white/20` — 145 matches (panel header bottom borders, avatar borders, hover borders)
- `bg-white/20` — 40 matches (filter badges, scene buttons, tag chips)
- `hover:border-white/20` — appears in hover states (sidebar theme modal, chat bubbles)
- `focus-visible:ring-white/20` — focus rings on buttons

## Implementation Strategy

**Step 1 — Update CSS custom property** (`src/index.css`):
- Change `--ui-border: 0 0% 100% / 0.10` → Ghost White HSL equivalent at 0.3 opacity: `210 33% 98% / 0.30`
- This automatically updates all 260 `hsl(var(--ui-border))` uses without touching component files

**Step 2 — Replace all Tailwind `white/10` classes** across ~42 files:
- `border-white/10` → `border-[rgba(248,250,252,0.3)]`
- `bg-white/10` → `bg-[rgba(248,250,252,0.3)]`
- `hover:bg-white/10` → `hover:bg-[rgba(248,250,252,0.3)]`
- `active:bg-white/10` → `active:bg-[rgba(248,250,252,0.3)]`
- `focus:bg-white/10` → `focus:bg-[rgba(248,250,252,0.3)]`
- `text-white/10` → `text-[rgba(248,250,252,0.3)]`

**Step 3 — Replace all Tailwind `white/20` classes** across ~20 files:
- `border-white/20` → `border-[rgba(248,250,252,0.3)]`
- `bg-white/20` → `bg-[rgba(248,250,252,0.3)]`
- `hover:bg-white/20` → `hover:bg-[rgba(248,250,252,0.3)]`
- `hover:border-white/20` → `hover:border-[rgba(248,250,252,0.3)]`
- `focus-visible:ring-white/20` → `focus-visible:ring-[rgba(248,250,252,0.3)]`

**Step 4 — Update Style Guide** (`StyleGuideTool.tsx`):
- Remove all "Dim White" swatch cards (replace with Ghost White location references)
- Remove all "Faint White" swatch cards (merge locations into existing Ghost White cards)
- Update Ghost White swatch cards to include the merged locations
- Remove `Dim White`, `Faint White`, `Dim White (Hover)` from `ALL_SWATCHES`
- Update `locationImages` arrays for any Ghost White swatches with changed locations

**Step 5 — Clear processed edits** from database (`styleguide_edits` → empty after applying)

## Files Modified
- `src/index.css` — update `--ui-border` CSS variable
- ~42 component/page files — replace `white/10` and `white/20` Tailwind classes
- `src/components/admin/styleguide/StyleGuideTool.tsx` — remove Dim/Faint White swatches, update ALL_SWATCHES, merge locations into Ghost White

## Visual Impact Warning
- Borders will become **3x more visible** (10% → 30% opacity) and shift from pure white to slight blue-tint
- Background hover/active states will be **2-3x more visible**
- Watermark text on cover images (`text-white/10`) will become much more readable
- All progressive states (`hover:white/5 → active:white/10`) will have a larger jump to the active state since white/5 remains unchanged

