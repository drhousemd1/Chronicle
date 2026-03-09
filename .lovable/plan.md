

# Plan: Convert My Stories Page Swatches to SwatchCardV2 Format

## Problem
The My Stories section (lines 440-452) still uses the old `SwatchCard` component with inconsistent labeling (mixed "Value"/"Hex"/"Computed", location info in names like "Slate 950 / Card Gradient Bottom"). It needs to match the standardized `SwatchCardV2` format already implemented for Story Builder.

## Changes — `src/components/admin/styleguide/StyleGuideTool.tsx`

Replace all 11 `SwatchCard` calls in the My Stories section (lines 441-451) with `SwatchCardV2` calls using clean color names and proper field separation.

### All 11 swatches — converted values

| # | Old `name` | New `name` | `locations` | `hex` | `token` | Page Specific | App Wide |
|---|---|---|---|---|---|:---:|:---:|
| 1 | Page Background | Slate 50 (50%) | Full page background | rgba(248,250,252,0.5) | bg-slate-50/50 | | ✓ |
| 2 | Active Tab Pill / Card Border | Chronicle Blue | Active tab pill bg, story card border (1px solid) | #4a5f7f | bg-[#4a5f7f] | | ✓ |
| 3 | Slate 950 / Card Gradient Bottom | Slate 950 | Story card gradient bottom: linear-gradient(to top, #020617, slate-900/60, transparent) | #020617 | bg-slate-950 | ✓ | |
| 4 | Badge Background | Badge Dark | SFW/NSFW badge backgrounds on story cards | #2a2a2f | bg-[#2a2a2f] | | ✓ |
| 5 | Red 400 / NSFW Badge | Red 400 | NSFW badge text color | #f87171 | text-red-400 | | ✓ |
| 6 | Red 500 / Delete Button | Red 500 | Delete button background on card hover | #ef4444 | bg-[hsl(var(--destructive))] | | ✓ |
| 7 | Blue 600 / Play Button | Blue 600 | Play button background on card hover | #2563eb | bg-blue-600 | | ✓ |
| 8 | Zinc 600 / Create Card Border | Zinc 600 | "Create New Story" dashed card border (2px dashed) | #52525b | border-zinc-600 | ✓ | |
| 9 | White / 60% — Description Text | White 60% | Story card description text | rgba(255,255,255,0.6) | text-white/60 | ✓ | |
| 10 | White / 50% — Metadata Text | White 50% | "Created by" text, stat numbers on story cards | rgba(255,255,255,0.5) | text-white/50 | ✓ | |
| 11 | Card Shadow | Black 50% | Story card and panel box-shadow (0px 12px 32px -2px) | rgba(0,0,0,0.5) | shadow-[0_12px_32px_-2px_rgba(0,0,0,0.5)] | | ✓ |

### Scope
- Lines 441-451 in `StyleGuideTool.tsx` — replace 11 `SwatchCard` → `SwatchCardV2`
- No component or structural changes needed (SwatchCardV2 already exists)
- Semi-transparent swatches (White 60%, White 50%, Slate 50) get `extraPreviewStyle={{ border: '1px dashed #999' }}` or `#ccc` as before

