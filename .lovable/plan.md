

# Fix Story Builder Swatch Names & Locations

## Problem
Color names still contain location info (e.g., "Slate 900 / Title Text", "Zinc 700 / Input Border"). Every name needs to be JUST the color identity. Locations need to describe WHERE the color appears.

## All 22 swatches — corrected values

| # | Current `name` | Fixed `name` | Fixed `locations` |
|---|---|---|---|
| 1 | Chronicle Blue | Chronicle Blue | Panel header bars, MAIN CHARACTERS pill |
| 2 | Panel Body / Dark Surface | Panel Body | Panel containers, Character Roster sidebar, character cards |
| 3 | Icon Sidebar | Sidebar Black | Left icon navigation sidebar |
| 4 | Shadow Surface Button BG | Shadow Surface | DRAFTS, SAVE AND CLOSE, SAVE DRAFT, Upload Image buttons |
| 5 | Header Bar | White | Top header bar background |
| 6 | Content Area Background | Slate 50 (30%) | Main content area behind panels |
| 7 | Slate 900 / Title Text | Slate 900 | "Story Setup" heading, "STORY BUILDER" header title |
| 8 | Slate 500 / Subtitle | Slate 500 | Subtitle text below page headings |
| 9 | Input Background | Zinc 900 (50%) | Text inputs, textareas, bullet-list containers |
| 10 | Zinc 700 / Input Border | Zinc 700 | Input borders, textarea borders, tag chip borders |
| 11 | Blue 400 / Link Blue | Blue 400 | "+ Add Location" links, "+ Add custom" text, SFW badge |
| 12 | Blue 500 / Checkmark | Blue 500 | Art Style checkmark badge, guidance box border |
| 13 | Zinc 400 / Muted Text | Zinc 400 | Trash icons, tag chip text, inactive tab text |
| 14 | Zinc 500 / Dashed Borders | Zinc 500 | Dashed "add" button borders, inactive slider labels |
| 15 | Zinc 800 / Tag Chip BG | Zinc 800 | Genre/Origin/Type tag chips, art style cards, character avatar |
| 16 | UI Text Color | UI Text | Shadow Surface button text, dark panel text |
| 17 | Slate 200 / Header Border | Slate 200 | Header bar bottom border |
| 18 | Guidance Box Surface | Guidance Surface | Story Arc guidance description box |
| 19 | Zinc 300 / Body Text | Zinc 300 | Bullet list text in World Codex |
| 20 | White / 10% — Subtle Border | White 10% | Button borders, panel outer borders, character card borders |
| 21 | White / 20% — Panel Header Border | White 20% | Panel header bar bottom border |

## Scope
- File: `src/components/admin/styleguide/StyleGuideTool.tsx`, lines 412-432
- Update `name` and `locations` props on each `SwatchCardV2` call
- No structural or component changes

