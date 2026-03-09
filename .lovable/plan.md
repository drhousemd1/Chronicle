

# Convert Community Gallery & Chat Interface Typography to TypoCardV2

## Scope
Replace 7 `TypeTile` calls (4 Community Gallery + 3 Chat Interface) with `TypoCardV2` in `src/components/admin/styleguide/StyleGuideTool.tsx`, lines 777-817.

## Community Gallery — 4 cards

| Name | Font Size | Weight | Spacing | Transform | Color | Line Height | Page? | App? |
|---|---|---|---|---|---|---|:---:|:---:|
| Card Title | 18px (text-lg) | 900 (font-black) | tight (tracking-tight) | — | #ffffff (white) | tight (leading-tight) | ✓ | |
| Card Description | 12px (text-xs) | 400 (normal) | — | — | rgba(255,255,255,0.6) (white/60) | relaxed | ✓ | |
| Card Stats | 10px (text-[10px]) | 400 (normal) | — | — | rgba(255,255,255,0.5) (white/50) | — | ✓ | |
| Search Placeholder | 14px (text-sm) | 400 (normal) | — | — | #71717a (zinc-500) | — | ✓ | |

## Chat Interface — 3 cards

| Name | Font Size | Weight | Spacing | Transform | Color | Line Height | Page? | App? |
|---|---|---|---|---|---|---|:---:|:---:|
| Speech Text | 15px (text-[15px]) | 500 (font-medium) | — | — | #ffffff (white) | relaxed | ✓ | |
| Action Text | 15px (text-[15px]) | 400 (italic) | — | — | #94a3b8 (slate-400) | relaxed | ✓ | |
| Character Label | 9px (text-[9px]) | 900 (font-black) | widest (tracking-widest) | uppercase | #64748b (slate-500) | — | ✓ | |

## Changes
- Lines 779-798: Replace 4 `TypeTile` with 4 `TypoCardV2` (Community Gallery)
- Lines 803-817: Replace 3 `TypeTile` with 3 `TypoCardV2` (Chat Interface)
- Preserve existing dividers and subheadings

