

# Localized Location Screenshots — Realistic Approach

## The Problem
All 21 swatches currently point to the same 5 full-page screenshots. Every "View" modal shows the same generic page view regardless of which color is being referenced.

## What I Can Do
Using the browser tool, I can:
- **Scroll to specific sections** (e.g., the Tags area, the Story Arcs section, the Art Style grid)
- **Resize the viewport small** (e.g., 800×500) to tightly frame a region
- **Take section-level screenshots** — e.g., just the "Content Themes" tag area, just the header bar, just the Art Style cards

This gives us ~12-15 **section-cropped** images instead of 5 full-page ones. Each swatch would point to the screenshot that most tightly frames where that color appears.

## What I Cannot Do
- Pixel-crop to a single DOM element (e.g., just one input border, just one tag chip)
- Programmatically add highlight overlays or arrows to screenshots

## Proposed Screenshot Set (~12 distinct captures)

| Screenshot | Viewport | What's visible | Swatches served |
|---|---|---|---|
| `header-bar.png` | 1280×300 | Just the STORY BUILDER header row + action buttons | Ghost White, Graphite, Light Steel, Cool Gray |
| `story-card-panel.png` | 800×500 | Story Card panel (name/description inputs) | Dark Charcoal, Smoke Black, Mid Charcoal, Faint White, Dim White |
| `form-labels.png` | 800×400 | Zoomed into STORY NAME / BRIEF DESCRIPTION labels + inputs | Ghost White (labels), Smoke Black (input bg) |
| `content-themes-tags.png` | 800×400 | Genre/Origin tag chips + add buttons | Dark Zinc, Silver Gray, Mid Charcoal, Stone Gray, True Blue |
| `art-style-grid.png` | 800×400 | Art Style Preference cards | Dark Zinc (card bg), True Blue (checkmark) |
| `story-arcs-section.png` | 800×500 | Story Arcs panel with guidance slider | Muted Charcoal, Stone Gray, True Blue |
| `character-roster.png` | 500×600 | Character Roster sidebar | Dark Charcoal, Faint White |
| `left-sidebar.png` | 300×600 | Left icon navigation bar | Soft Black |
| `world-codex-dialog.png` | 800×500 | World Codex section with bullet list | Light Zinc |
| `panel-header-closeup.png` | 800×200 | Single panel header bar (Slate Blue) | Slate Blue, Pale Silver |
| `add-links.png` | 800×300 | "+ Add Location" / "+ Add Custom" area | True Blue (text), Stone Gray (border) |

## Execution
1. Navigate to Story Builder in the browser
2. For each capture: resize viewport → scroll to target section → screenshot → upload to `guide_images/story-builder/` with descriptive filename
3. Update all 21 `locationImages` entries in `StyleGuideTool.tsx` to point to the correct section-cropped image

## Limitation Caveat
These will be **section-level** crops (showing the relevant area of the page), not **element-level** crops (showing only a single border or chip). If you want true element-level crops with annotations/arrows, those would need to be created manually in an image editor and uploaded — I could then wire them into the `locationImages` data.

**Single file changed:** `src/components/admin/styleguide/StyleGuideTool.tsx` (locationImages URLs updated)

