

# Plan: Audit and Correct Style Guide Content

## Goal
Go through every section of the Style Guide, replace approximated values with source-verified ones, render previews using real Tailwind classes, and remove unnecessary dark preview backgrounds per the user's feedback.

## Dark Background Rule
Only use `previewDark` when the previewed element is pure white or near-white and would be invisible on white. All other previews (dark buttons, colored elements, dark panels, icons with color) render directly on the white/light background.

## Changes (all in `StyleGuideTool.tsx`)

### Pass 1: Colors + Typography

**Colors (lines 304-343)**
- Fix "Button Background" swatch: change `#2F3137` to document the actual Shadow Surface token (`bg-[hsl(var(--ui-surface-2))]` / `hsl(240 6% 18%)` ≈ `#2a2b30`). The `#2F3137` value was from a screenshot approximation.
- Fix "Button Text Color" swatch: the actual token is `text-[hsl(var(--ui-text))]`, not a raw hex.
- Remaining 29 swatches verified correct — no changes needed.

**Typography (lines 345-430)**
- Verify Page Title specs against the actual header in `ChronicleApp.tsx` / story builder pages.
- Verify Panel Header Title `20px/700/-0.5px` against `text-xl font-bold tracking-tight` in source.
- Verify Field Label `10px/700/uppercase` against `text-[10px] font-bold uppercase tracking-wider` in source.
- Convert example text renders from inline styles to `className` strings where possible.
- Remove `previewDark` / use `exampleBg` only for tiles showing white text (which needs dark bg to be visible). Tiles showing dark text on light bg need no dark wrapper.

### Pass 2: Buttons + Forms + Badges

**Buttons (lines 432-512)**
- **Header Action Button**: Fix from `bg: #2F3137` to actual Shadow Surface pattern: `h-10 px-6 rounded-xl bg-[hsl(var(--ui-surface-2))] border border-[hsl(var(--ui-border))] shadow-[0_10px_30px_rgba(0,0,0,0.35)] text-[10px] font-bold uppercase tracking-wider leading-none`.
- **All 5 button entries**: Remove `previewDark` — these buttons have their own dark/colored backgrounds and are visible on white.
- **Modal Footer buttons (line 748-754)**: Same — Cancel/Save/Delete have dark/red backgrounds, visible on white. Remove `previewDark`.
- Update code blocks to show actual Tailwind class strings, not just CSS properties.

**Form Inputs (lines 517-534)**
- Keep `previewDark` — dark inputs with dark borders genuinely need contrast background to be visible.

**Badges (lines 538-579)**
- Tag chips and SFW/NSFW badges have dark backgrounds — remove `previewDark` if currently set (they use `previewPlain` already, so no change needed here).

### Pass 3: Panels + Modals + Icons

**Panels (lines 584-643)**
- Panel Container preview: dark panel on dark bg — the panel itself IS dark, so it's visible on white. Remove `previewDark`.
- Panel Header Bar: already `previewPlain` — correct.
- Story Card: already `previewPlain` with no preview — add a rendered preview showing the card shape with gradient overlay.

**Modals (lines 648-776)**
- **Backdrop** (line 651): Keep `previewDark` — shows layered transparency effect that needs context.
- **Container** (line 674): Remove `previewDark` — dark modal containers are visible on white.
- **Header** (line 709): Remove `previewDark` — dark header containers are visible on white.
- **Footer** (line 745): Remove `previewDark` — dark buttons are visible on white (matches user's screenshot feedback exactly).

**Icons (lines 782-908)**
- **Size Scale**: Remove `previewDark` — gray squares are visible on white. But the white icon color swatch won't be visible. For that one entry, use a subtle light gray bg or just note it.
- **Icon Colors**: Keep `previewDark` only for this one — it shows a white swatch that would be invisible on white.
- **Icon Containers**: Remove `previewDark` — colored containers are visible on white.

## Summary of `previewDark` Changes

| Entry | Current | Change |
|-------|---------|--------|
| Header Action Button | dark | → remove |
| AI Generate Button | dark | → remove |
| Dashed Add Button | dark | → remove |
| Card Hover Buttons | dark | → remove |
| Tab Pills | dark | → remove |
| Text Input/Textarea | dark | → keep (dark inputs invisible on white) |
| Modal Backdrop | dark | → keep (transparency effect needs context) |
| Modal Container | dark | → remove |
| Modal Header | dark | → remove |
| Modal Footer | dark | → remove |
| Icon Size Scale | dark | → remove |
| Icon Colors | dark | → keep (white swatch) |
| Icon Containers | dark | → remove |

## Execution
Three passes, each verified before proceeding:
1. Colors + Typography corrections
2. Buttons + Forms + Badges corrections + dark bg cleanup
3. Panels + Modals + Icons corrections + dark bg cleanup

