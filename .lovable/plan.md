

# Convert Community Gallery Swatches to SwatchCardV2

## Scope
File: `src/components/admin/styleguide/StyleGuideTool.tsx`, lines 459-467

Replace 7 `SwatchCard` calls with `SwatchCardV2`, applying the same clean data standards.

## All 7 swatches — cleaned values

| # | Current Name | Clean Name | Clean Locations | Value | Token | Page? | App? |
|---|---|---|---|---|---|:---:|:---:|
| 1 | Gallery Page Background | Gallery Background | GalleryHub main wrapper, Account page background | #121214 | bg-[#121214] | ✓ | |
| 2 | Gallery Header Glass | Header Glass | Gallery sticky header | rgba(18,18,20,0.8) | bg-[#121214]/80 | ✓ | |
| 3 | Gallery Search Input BG | Search Input BG | Gallery search input background | rgba(58,58,63,0.5) | bg-[#3a3a3f]/50 | ✓ | |
| 4 | Category Sidebar BG | Sidebar BG | Gallery category filter sidebar | #18181b | bg-[#18181b] | ✓ | |
| 5 | Yellow Accent Border | Yellow 400 | Category sidebar accent bar | #facc15 | bg-yellow-400 | ✓ | |
| 6 | Blue Filter Tag BG | Blue 500/20 | Active story type filter chip background | rgba(59,130,246,0.2) | bg-blue-500/20 | ✓ | |
| 7 | Purple Genre Filter BG | Purple 500/20 | Active genre filter chip background | rgba(168,85,247,0.2) | bg-purple-500/20 | ✓ | |

### Data cleanup applied
- **Names**: Pure color identity only — no "Gallery" prefix or "BG" suffix where it's a location concern
- **Locations**: UI areas only — removed "(280px)" dimension from sidebar, removed "2px" from accent bar, removed "purple-400 text" implementation detail
- **Values**: Raw CSS color values, no CSS property names mixed in
- Semi-transparent swatches (Search Input BG, Blue/Purple filters) get `extraPreviewStyle={{ border: '1px dashed #999' }}`

