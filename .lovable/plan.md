

# Chronicle Visual Style Guide — Implementation Plan

## What This Is

A dedicated Visual Style Guide tool inside the Admin Panel that serves as a comprehensive, living reference for every design token (colors, typography, buttons, inputs, badges, panels, modals, icons) used across Chronicle. It replicates the layout and content of the HTML mockup you created, organized by page (Story Builder, My Stories) with visual previews and exact specs.

## Why

You've been spending the majority of your time correcting styling inconsistencies. This gives both you and the AI a single visual source of truth to reference, preventing drift.

## Architecture

The style guide will be a new admin tool (like Image Generation or App Guide), **not** a separate route. It lives inside the existing admin panel infrastructure:

- **Tool ID**: `style_guide`
- **Accessed via**: Admin Panel hub → Style Guide card
- **Component**: `src/components/admin/styleguide/StyleGuideTool.tsx` (lazy-loaded)

### Component Structure

```text
StyleGuideTool.tsx          — Main container (sidebar + header + content)
├── StyleGuideNav.tsx       — Fixed 260px sidebar with scroll-spy nav
├── StyleGuideHeader.tsx    — Sticky header with title/badge/description
└── sections/
    ├── ColorsSection.tsx       — Color swatches by page
    ├── TypographySection.tsx   — Typography tiles (2-col grid)
    ├── ButtonsSection.tsx      — Button entries with live previews + code
    ├── FormInputsSection.tsx   — Input/textarea specs
    ├── BadgesTagsSection.tsx   — Badge and tag chip specs
    ├── PanelsSection.tsx       — Panel container specs
    ├── ModalsSection.tsx       — Modal specs (extracted from source)
    └── IconsSection.tsx        — Icon sizing/color specs (extracted from source)
```

## Phased Build Strategy

Each phase produces a complete, testable section. Verification between phases.

### Phase 1: Skeleton + Route Setup
- Create `StyleGuideTool.tsx` with the light-bg layout (`#f3f4f6`), fixed sidebar (260px), sticky header, scroll-spy navigation
- Add tool to `DEFAULT_TOOLS` in `Admin.tsx` with lazy loading
- Create 8 section placeholders with heading + description
- Responsive breakpoints at 1024px (horizontal nav), 1100px, 640px
- CSS variables matching the mockup (`--sg-primary`, `--sg-bg`, etc.)

### Phase 2: Colors Section
- Swatch card grid: `repeat(auto-fit, minmax(220px, 1fr))`, 14px gap
- Cards: white bg, 2px black border, 10px radius, 78px color preview
- Detail rows: label (9px/700/uppercase/#94a3b8) + value (11px/monospace/#334155)
- Dark gradient page subheadings for "Story Builder Page" / "My Stories Page"
- All 31 swatches (20 Story Builder + 11 My Stories) with exact hex/token/location data from the mockup

### Phase 3: Typography Section
- Two-column grid with equal-height tiles
- Each tile: title bar (#f8fafc), example area (light or dark bg with actual rendered text), specs row (monospace), locations row
- 13 tiles total (8 Story Builder + 5 My Stories) with exact specs from the mockup

### Phase 4: Buttons Section
- Same two-column entry card layout as Typography
- Live rendered button previews using inline styles matching the mockup CSS classes
- Code blocks with exact CSS properties
- 5 entries: Header Action, AI Generate, Dashed Add, Card Hover Buttons, Tab Pills

### Phase 5: Form Inputs + Badges & Tags
- Form Inputs: 1 entry (Text Input/Textarea) with dark preview area
- Badges: 2 entries (Content Theme Tag Chips, SFW/NSFW Badges)

### Phase 6: Panels Section + Polish
- 4 panel entries (Panel Container, Panel Header Bar, Character Roster Sidebar, Story Card)
- Panel Header includes rendered preview with gear icon
- Final polish: hover effects on cards, smooth scrolling, scroll-margin-top

### Phase 7: Modals + Icons (extracted from source code)
- Modals: Extract specs from existing modal components (backdrop, container bg/border/radius, header typography, button row)
- Icons: Extract icon sizes, colors, stroke weights, and containers from source
- Build using same entry card format

## Files Modified

| File | Change |
|------|--------|
| `src/pages/Admin.tsx` | Add `style_guide` tool to `DEFAULT_TOOLS`, add lazy import and conditional render |
| `src/components/admin/styleguide/StyleGuideTool.tsx` | New — main container |
| `src/components/admin/styleguide/StyleGuideNav.tsx` | New — sidebar nav |
| `src/components/admin/styleguide/StyleGuideHeader.tsx` | New — sticky header |
| `src/components/admin/styleguide/sections/*.tsx` | New — 8 section components |

## Key Rules (from your document)

- This is a **read-only reference page**, not an interactive playground
- Content grouped by page with gradient subheadings — never listed generically
- All values come from the HTML mockup (Sections 1–6) or source code extraction (Sections 7–8)
- No auto-replacing colors across the codebase — the guide identifies canonical values; cleanup is separate
- Visual verification between each phase before proceeding

