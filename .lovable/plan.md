

# Plan: Standardize Story Builder Color Swatches

## Problem
The Story Builder color swatches have inconsistent labeling — some use "HEX", others "VALUE", "HSL", "COMPUTED", "CSS VAR" — and the label text is faint gray. The user wants a uniform format with checkboxes.

## New Swatch Format
Every swatch will display exactly:
1. **Color Name** (card title, bold)
2. **Locations:** where it's used
3. **Hex:** the hex/rgba value
4. **Token:** the Tailwind token
5. **Page Specific Color:** checkbox
6. **App Wide Color:** checkbox

Labels will use `#334155` (slate-700) instead of the current faint `#94a3b8`. Font: Inter (already the app font).

## Changes

### File: `src/components/admin/styleguide/StyleGuideTool.tsx`

**1. Create a new `SwatchCardV2` component** (replacing `SwatchCard` usage for Story Builder section only)
- Props: `color`, `name`, `locations`, `hex`, `token`, `pageSpecific`, `appWide`, plus optional `extraPreviewStyle`
- Consistent row layout: label column at ~90px, bold `#334155` labels, `13px Inter` for values
- Two checkbox rows at the bottom using native `<input type="checkbox" checked disabled />` (read-only display)

**2. Replace all ~22 Story Builder SwatchCard calls** (lines 352-373) with `SwatchCardV2` using the standardized props.

**3. Classification of each color:**

| Color | Page Specific | App Wide |
|-------|:---:|:---:|
| Chronicle Blue (#4a5f7f) | | ✓ |
| Panel Body (#2a2a2f) | | ✓ |
| Icon Sidebar (#1a1a1a) | ✓ | |
| Shadow Surface Button BG | | ✓ |
| Header Bar (#ffffff) | | ✓ |
| Content Area Background | ✓ | |
| Slate 900 / Title Text | | ✓ |
| Slate 500 / Subtitle | | ✓ |
| Input Background | | ✓ |
| Zinc 700 / Input Border | | ✓ |
| Blue 400 / Link Blue | | ✓ |
| Blue 500 / Checkmark | | ✓ |
| Zinc 400 / Muted Text | | ✓ |
| Zinc 500 / Dashed Borders | | ✓ |
| Zinc 800 / Tag Chip BG | | ✓ |
| UI Text Color | | ✓ |
| Slate 200 / Header Border | | ✓ |
| Guidance Box Surface | ✓ | |
| Zinc 300 / Body Text | | ✓ |
| White/10% Subtle Border | | ✓ |
| White/20% Panel Header Border | | ✓ |

Only the Story Builder section swatches are changed in this pass. Other page sections remain untouched for now.

