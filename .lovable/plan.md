

# Community Gallery Swatches — Full Audit + View Screenshots

## Current State (7 swatches)
1. Near Black (#121214) — "GalleryHub main wrapper, Account page background"
2. Glass Black (rgba(18,18,20,0.8)) — "Gallery sticky header"
3. Smoke Charcoal (rgba(58,58,63,0.5)) — "Gallery search input background"
4. Dark Zinc (#18181b) — "Gallery category filter sidebar"
5. Bright Yellow (#facc15) — "Category sidebar accent bar"
6. Faint Blue (rgba(59,130,246,0.2)) — "Active story type filter chip background"
7. Faint Purple (rgba(168,85,247,0.2)) — "Active genre filter chip background"

## Audit: Missing Colors (from source code)

### GalleryHub.tsx
| Color | Name | Location | Source |
|---|---|---|---|
| #4a5f7f | Slate Blue | Search button bg, Browse Categories button bg, search input focus ring | Lines 363, 374, 359 |
| #5a6f8f | Light Slate Blue | Browse Categories active/hover bg, Search button hover | Lines 374, 363 |
| rgba(255,255,255,0.1) | Faint White | Search input border, sidebar border-right | Line 359, sidebar line 180 |
| rgba(255,255,255,0.2) | Dim White | Filter count badge bg, search tag chip bg, text search chip bg | Lines 382, 415, 428 |
| rgb(59,130,246) | True Blue | Gradient divider center color | Line 393 |
| rgba(255,255,255,0.05) | Ghost White | Sidebar hover bg (hover:bg-white/5) | Sidebar line 105, 128 |
| rgba(59,130,246,0.2) / text-blue-500 | Blue 500 | Selected sidebar item bg + text | Sidebar line 127 |

### GalleryStoryCard.tsx
| Color | Name | Location | Source |
|---|---|---|---|
| #4a5f7f | Slate Blue | Card border | Line 65 |
| rgba(0,0,0,0.5) | Half Black | Card shadow | Line 65 |
| #2a2a2f | Dark Charcoal | SFW/NSFW badge bg, Remix badge bg | Lines 89, 100 |
| text-red-500 (#ef4444) | Bright Red | NSFW badge text | Line 91 |
| text-blue-500 (#3b82f6) | True Blue | SFW badge text, Play button bg | Lines 92, 134 |
| text-purple-400 (#c084fc) | Soft Purple | Remix pencil icon | Line 101 |
| bg-rose-500 (#f43f5e) | Rose | Like button active bg | Line 113 |
| bg-amber-500 (#f59e0b) | Amber | Save button active bg | Line 125 |
| bg-white/90 | Near White | Like/Save button inactive bg | Lines 115, 127 |
| text-blue-300 (#93c5fd) | Light Blue | Card title hover text | Line 142 |
| rgba(248,250,252,0.3) | Ghost White | Card description, stats, author text | Lines 145, 148, 166 |
| from-zinc-800/via-slate-900/60 | — | Card gradient overlay | Line 84 |
| from-slate-800 to-slate-900 | — | No-image fallback gradient | Line 76 |

### GalleryHub.tsx Filter Chips
| Color | Name | Location | Source |
|---|---|---|---|
| bg-green-500/20 | Faint Green | Active origin filter chip bg | Line 456 |
| text-green-400 | Green 400 | Active origin filter chip text | Line 456 |
| bg-amber-500/20 | Faint Amber | Active trigger warning chip bg | Line 464 |
| text-amber-400 | Amber 400 | Active trigger warning chip text | Line 464 |
| text-purple-400 | Purple 400 | Active genre filter chip text | Line 448 |
| text-blue-500 | Blue 500 | Active story type chip text (already covered) | Line 440 |

### Index.tsx Header (Gallery-specific)
| Color | Name | Location | Source |
|---|---|---|---|
| #2b2b2e | Warm Charcoal | Sort pill container bg | Line 1770 |
| #4a5f7f | Slate Blue | Active sort pill bg | Line 1785 |
| #a1a1aa | Silver Gray | Inactive sort pill text | Line 1786 |
| #e4e4e7 | Light Silver | Sort pill hover text | Line 1786 |

### StoryDetailModal.tsx (Gallery context)
| Color | Name | Location | Source |
|---|---|---|---|
| #121214 | Near Black | Modal bg | Line 240 |
| #2a2a2f | Dark Charcoal | Cover fallback bg, skeleton bg, character fallback bg | Lines 254, 263, 553, 573 |
| bg-rose-500/20 | Faint Rose | Like button active bg (modal) | Line 327 |
| bg-amber-500/20 | Faint Amber | Save button active bg (modal) | Line 341 |
| #3b82f6 | True Blue | Play button bg, "View All" link, character hover ring | Lines 312, 351, 543, 564 |
| #2d6fdb | Dark Blue | Play button hover | Lines 312, 352 |
| text-red-500 | Bright Red | NSFW badge text, Trigger Warnings text | Lines 279, 522 |
| #94a3b8 | Muted Slate | Stats row icons/text | Lines 406-421 |
| #4a5f7f | Slate Blue | Creator name color, review section divider, review button bg, avatar hover ring | Lines 452, 591, 598, 437 |
| #e2e8f0 | Light Steel | Synopsis text | Line 489 |
| bg-emerald-500/20 / text-emerald-400 | Emerald | PUBLISHED badge | Line 471 |
| bg-purple-500/20 / text-purple-400 | Soft Purple | EDITABLE badge | Line 478 |
| from-purple-500 to-blue-500 | — | Creator avatar gradient | Lines 437, 613 |
| bg-white/5 | — | Review card bg, action buttons bg | Lines 610, 304, 328, 342 |

## Plan

### Step 1: Add missing swatches to the Community Gallery section

Add these swatches (many are app-wide and already exist in other sections, but need Community Gallery listed as a location):

**New swatches to ADD to Community Gallery section:**
1. **Slate Blue** (#4a5f7f) — Search button, Browse Categories button, card border, sort pill active, detail modal accents
2. **Warm Charcoal** (#2b2b2e) — Sort pill container track
3. **Silver Gray** (#a1a1aa) — Inactive sort pill text
4. **Dark Charcoal** (#2a2a2f) — SFW/NSFW badge bg on cards + modal, cover fallback, character avatar fallback
5. **Bright Red** (#ef4444) — NSFW badge text (card), NSFW badge text (modal), Trigger Warnings text (modal)
6. **True Blue** (#3b82f6) — SFW badge text, Play button (card + modal), blue gradient divider, "View All" link, character hover ring
7. **Half Black** (rgba(0,0,0,0.5)) — Card drop shadow
8. **Rose** (#f43f5e) — Like button active (card + modal)
9. **Amber** (#f59e0b) — Save button active (card + modal)
10. **Faint Green** (rgba(34,197,94,0.2)) — Origin filter chip bg
11. **Faint Amber** (rgba(245,158,11,0.2)) — Trigger warning filter chip bg
12. **Ghost White** (rgba(248,250,252,0.3)) — Card description, stats, author text
13. **Muted Slate** (#94a3b8) — Detail modal stats row
14. **Emerald** (rgba(16,185,129,0.2) / text-emerald-400) — PUBLISHED badge in detail modal
15. **Soft Purple** (rgba(168,85,247,0.2) / text-purple-400) — EDITABLE badge + remix icon

### Step 2: Capture localized screenshots

For each swatch, capture tight viewport screenshots showing the specific element. Screenshots needed (~12-15 captures):

| Screenshot | Viewport | Element |
|---|---|---|
| gallery-search-bar.png | 800×150 | Search input + Search button + Browse Categories |
| gallery-sort-pills.png | 800×100 | Sort pill bar in header |
| gallery-card-badges.png | 414×600 | Single card showing SFW/NSFW badge + remix icon |
| gallery-card-hover.png | 414×600 | Card hover showing Like/Save/Play buttons |
| gallery-card-stats.png | 414×300 | Bottom of card showing title, stats, author |
| gallery-filter-chips.png | 800×100 | Active filter chips bar with multiple chip types |
| gallery-sidebar.png | 400×600 | Category sidebar with yellow accent bar |
| gallery-detail-cover.png | 500×600 | Detail modal left column — cover + action buttons |
| gallery-detail-content.png | 500×600 | Detail modal right column — title, stats, creator |
| gallery-detail-reviews.png | 500×400 | Detail modal reviews section |
| gallery-detail-characters.png | 500×300 | Detail modal characters row |
| gallery-empty-state.png | 600×400 | Empty state with Globe icon |

### Step 3: Update `locationImages` on all swatches

Every swatch gets a `locationImages` array with one entry per distinct location, each pointing to the relevant screenshot.

### Step 4: Update ALL_SWATCHES

Add any new color entries (Rose, Amber, Faint Green, Faint Amber, Emerald, Light Blue) that don't already exist.

### Step 5: Update existing swatches in other sections

For colors that are app-wide and already exist in other sections (Slate Blue, Dark Charcoal, etc.), add "Community Gallery" to their `locations` text.

## Files Changed
- `src/components/admin/styleguide/StyleGuideTool.tsx` — expand Community Gallery section from 7 to ~20 swatches, add locationImages, update ALL_SWATCHES
- ~12-15 new screenshot assets uploaded to Supabase storage `guide_images/community-gallery/`

