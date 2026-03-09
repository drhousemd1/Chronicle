

# Plan: Clean Up Story Builder & My Stories Swatch Data

## Problem
The swatches have three data quality issues:
1. **"Hex" label is wrong** for non-hex values (rgba, hsl) — rename to **"Value"** since it holds the raw CSS color value
2. **Locations contain CSS specs** like "2px dashed", "linear-gradient(...)", "1px solid", "border: blue-500/20" — locations should only name UI areas
3. **Token field has complex expressions** like full shadow declarations — should be a clean Tailwind class

## Component Change — SwatchCardV2

Rename the "Hex" label to **"Value"** in the component (line 114), and rename the prop from `hex` to `value` in the interface (line 82). This accurately describes what the field holds — the raw CSS color value, whether that's `#4a5f7f`, `rgba(255,255,255,0.1)`, or `hsl(228 7% 20%)`.

## Data Cleanup — Story Builder (lines 412-432)

| # | Name | Current `locations` problem | Fixed `locations` | Current `hex` | Notes |
|---|---|---|---|---|---|
| 14 | Sidebar Black | "Left icon navigation sidebar (72px wide)" | "Left icon navigation sidebar" | OK | Remove dimension |
| 15 | Shadow Surface | "...all header action buttons" | OK | `hsl(228 7% 20%)` | Fine as Value |
| 16 | White | "Top header bar background (64px height)" | "Top header bar background" | OK | Remove dimension |
| 23 | Blue 500 | "...guidance box border (at 20% opacity)" | "Art Style checkmark badge, guidance box border" | OK | Remove opacity detail |
| 29 | Guidance Surface | "...border: blue-500/20" | "Story Arc guidance description box" | OK | Remove CSS |

All other Story Builder swatches have clean locations already.

## Data Cleanup — My Stories (lines 441-451)

| # | Name | Current `locations` problem | Fixed `locations` |
|---|---|---|---|
| 2 | Chronicle Blue | "Active tab pill bg, story card border (1px solid)" | "Active tab pill, story card border" |
| 3 | Slate 950 | "Story card gradient bottom: linear-gradient(...)" | "Story card gradient overlay" |
| 8 | Zinc 600 | '"Create New Story" dashed card border (2px dashed)' | '"Create New Story" card border' |
| 11 | Black 50% | "Story card and panel box-shadow (0px 12px 32px -2px)" | "Story card and panel shadow" |
| 11 | Black 50% | token: `shadow-[0_12px_32px_-2px_rgba(0,0,0,0.5)]` | token: `shadow-custom` (or just note it as a shadow value — the full Tailwind arbitrary is the actual token used) |

## Scope
- **SwatchCardV2 component**: Rename `hex` prop → `value`, update label from "Hex:" → "Value:"
- **~8 location strings** cleaned across both sections (remove CSS specs, dimensions, formulas)
- **All existing SwatchCardV2 call sites**: Update `hex=` → `value=` (mechanical rename, ~32 calls across Story Builder + My Stories)
- No structural changes

