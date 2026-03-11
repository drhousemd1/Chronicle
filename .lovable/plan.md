

# Plan: Uniform Card Heights with "Show More" Toggle

## Problem
All V2 cards in the Style Guide have varying numbers of metadata fields, causing staggered heights in the grid. This makes it hard to scan at a glance.

## Solution
Add a collapsible metadata section to each V2 card type. Each card will show only the **preview strip + name + a fixed-height summary area** by default, with a "Show more" toggle at the bottom that expands to reveal all metadata fields. Cards without extra content to reveal will have a same-height invisible placeholder so all cards in a row are identical height.

## Implementation

### 1. Create a shared `CollapsibleCardBody` wrapper component

A new internal component used inside every V2 card. It receives:
- `alwaysVisible`: The fields that always show (Name + Locations — the two most useful at-a-glance fields)
- `collapsibleContent`: The remaining metadata fields (Value, Token, Background, Border, etc.)
- Renders a "Show more" / "Show less" text toggle with a small chevron icon at the bottom
- The toggle only renders if `collapsibleContent` is non-empty, but the space for the toggle row is **always reserved** (a fixed-height div) so collapsed cards with and without the toggle are the same height
- Uses CSS `max-height` transition for smooth expand/collapse animation

### 2. Update all 6 V2 card components

For each card type, split the metadata into "always visible" and "collapsible":

**SwatchCardV2**: Always show Color Name + Locations. Collapse: Value, Token, Effect, Page/App checkboxes.

**TypoCardV2**: Always show Font Name + Locations. Collapse: Font Family, Font Size, Font Weight, Letter Spacing, Text Transform, Color, Line Height, Page/App checkboxes.

**ButtonCardV2**: Always show Button Name + Locations. Collapse: Button Color, Text Color, Size, Purpose, Visual Effects, Page/App checkboxes.

**InputCardV2**: Always show Input Name + Locations. Collapse: Background, Border, Border Radius, Text Color, Placeholder Color, Focus Style, Font Size, Padding, Purpose, Notes, Page/App checkboxes.

**BadgeCardV2**: Always show Badge Name + Locations. Collapse: Background, Text Color, Size, Border Radius, Padding, Purpose, States, Notes, Page/App checkboxes.

**PanelCardV2**: Always show Panel Name + Locations. Collapse: Background, Border, Border Radius, Shadow, Purpose, Notes, Page/App checkboxes.

### 3. Uniform collapsed height

Each card in collapsed state will have:
- Preview strip (existing, variable per card type)
- Name field (always)
- Locations field (always, clamped to 2 lines with `overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2` when collapsed)
- Toggle row placeholder (fixed 28px height, either showing "Show more ▾" or empty)

This ensures all collapsed cards in a grid row are the same height within their card type section.

### 4. No changes to CardEditOverlay or grid layout

The `alignSelf: 'start'` on `CardEditOverlay` already exists. With uniform collapsed heights, the grid will naturally align. When a card is expanded, it grows and only that card in its column extends — this is expected and acceptable behavior.

### File changed
- `src/components/admin/styleguide/StyleGuideTool.tsx` — Add `CollapsibleCardBody` component (~40 lines), update 6 card components to use it

