

# Redesign Typography Section — New TypoCardV2 Component

## Problem
The current `TypeTile` component uses a generic layout with "Specs:" as a dumped list and "Locations used:" with location text jammed into the header name (e.g., "Page Title (White header bar)"). The naming pattern mirrors the same mistake fixed in swatches — locations in the name field.

## Solution
Create a new `TypoCardV2` component matching the SwatchCardV2 pattern — clean labeled rows with consistent styling, proper field separation, and checkboxes.

### New `TypoCardV2` Props

```typescript
interface TypoV2Props {
  name: string;           // Descriptive type name: "Page Title", "Section Heading"
  exampleContent: React.ReactNode;  // Live rendered example
  exampleBg?: string;     // Background for example preview
  fontFamily?: string;    // e.g. "Inter (system default)"
  fontSize: string;       // e.g. "18px (text-lg)"
  fontWeight: string;     // e.g. "900 (font-black)"
  letterSpacing?: string; // e.g. "-0.5px (tracking-tight)"
  textTransform?: string; // e.g. "uppercase"
  color: string;          // e.g. "#0f172a (slate-900)"
  lineHeight?: string;    // e.g. "relaxed"
  locations: string;      // Where it's used
  pageSpecific: boolean;
  appWide: boolean;
}
```

### Card Layout (matches SwatchCardV2 visual pattern)
1. **Example preview** strip at top (like swatch color strip) — renders the actual text on its background
2. Below, labeled rows using the same `labelStyle`/`valueStyle` from SwatchCardV2:
   - **Name:** (e.g. "Page Title")
   - **Font Size:** (e.g. "18px")
   - **Font Weight:** (e.g. "900 (black)")
   - **Letter Spacing:** (optional, e.g. "-0.5px (tracking-tight)")
   - **Text Transform:** (optional, e.g. "uppercase")
   - **Color:** (e.g. "#0f172a (slate-900)")
   - **Line Height:** (optional)
   - **Locations:** 
   - **☑ Page Specific / ☑ App Wide** checkboxes

### Story Builder Page — 6 cards converted

| Name | Font Size | Weight | Spacing | Transform | Color | Page? | App? |
|---|---|---|---|---|---|:---:|:---:|
| Page Title | 18px (text-lg) | 900 (black) | -0.5px (tracking-tight) | uppercase | #0f172a (slate-900) | | ✓ |
| Section Heading | 36px | 900 (black) | -0.9px | — | #0f172a (slate-900) | ✓ | |
| Panel Header Title | 20px (text-xl) | 700 (bold) | -0.5px (tracking-tight) | — | #ffffff (white) | | ✓ |
| Field Label | 10px (text-[10px]) | 700 (bold) | 0.05em (tracking-wider) | uppercase | #ffffff (white) | | ✓ |
| Button Label | 10px (text-[10px]) | 700 (bold) | 0.05em (tracking-wider) | uppercase | hsl(210,20%,93%) (ui-text) | | ✓ |
| Character Name | 14px (text-sm) | 700 (bold) | normal | — | #ffffff (white) | ✓ | |

### Scope
- Create `TypoCardV2` component (reuses `labelStyle`/`valueStyle` from SwatchCardV2)
- Replace 6 Story Builder `TypeTile` calls with `TypoCardV2`
- Remove location info from `name` field — keep names clean descriptive type names
- Other page sections (My Stories, Gallery, Chat, etc.) unchanged for now

