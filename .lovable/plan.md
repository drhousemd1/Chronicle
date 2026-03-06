

## Spacing Audit Results & Fix Plan

Here's what I found for every heading you listed — the gap between label and the content below it:

| Heading | Current spacing | How |
|---|---|---|
| Story Name | `mb-1` (4px) on FieldLabel, no `mt` on textarea | **4px** |
| Brief Description | `mb-1` (4px) on FieldLabel, no `mt` on textarea | **4px** |
| Story Premise | `mb-1` (4px) on FieldLabel, no `mt` on textarea | **4px** |
| Primary Locations | `mb-1` (4px) on label, fields in `space-y-3` below | **4px** |
| Custom content title | No margin between title and items (both in `space-y-4` parent) | **16px** (from parent `space-y-4`) |
| Story Arc Title | `mb-2` (8px) on label, `mt-1` (4px) on textarea | **12px** |
| Desired Outcome | `mb-2` (8px) on label row, `mt-1` (4px) on textarea | **12px** |
| Goal Name (Phase) | `mb-2` (8px) on label, `mt-1` (4px) on textarea | **12px** |
| Desired Outcome (Phase) | `mb-2` (8px) on label row, `mt-1` (4px) on textarea | **12px** |
| Opening Dialog | `mb-1` (4px) on label (via flex), no `mt` on textarea | **4px** |
| Starting Day & Time | In `space-y-3` (12px) parent, label then controls in `space-y-3` | **12px** |
| Scene Gallery Photos | `mb-1` on header row (label+buttons together), `mt-1` on grid | Title is vertically centered in tall button row — visually much larger gap |
| Dialog Formatting | `block` label, then HintBox in `space-y-4` parent | **16px** |
| Additional Formatting Rules | `mb-1` (4px) on label, no `mt` on textarea | **4px** |
| Character Types | `space-y-3` (12px) between h4 and content box | **12px** |
| Story Type | `space-y-3` (12px) | **12px** |
| Genre | `space-y-3` (12px) | **12px** |
| Origin | `space-y-3` (12px) | **12px** |
| Trigger Warnings | `space-y-3` (12px) | **12px** |
| Custom Tags | `space-y-3` (12px) | **12px** |

### The standard to match: 4px

Story Name, Brief Description, Story Premise, Primary Locations, Opening Dialog, and Additional Formatting Rules all use **4px** — label with `mb-1`, no top margin on the input. These look good to you.

### Changes needed

**1. StoryGoalsSection.tsx** — Story Arc Title & Desired Outcome
- Line 318: `mb-2` → `mb-1` on "Story Arc Title" label
- Line 323: remove `mt-1` from textarea class
- Line 351: `mb-2` → `mb-1` on "Desired Outcome" label row  
- Line 368: remove `mt-1` from textarea class

**2. ArcPhaseCard.tsx** — Goal Name & Desired Outcome (Phase)
- Line 199: `mb-2` → `mb-1` on "Goal Name" label
- Line 204: remove `mt-1` from textarea class
- Line 220: `mb-2` → `mb-1` on "Desired Outcome" label row
- Line 237 (approx): remove `mt-1` from textarea class

**3. WorldTab.tsx** — Scene Gallery Photos
- Line 992: Change `items-center` to `items-end` on the header row. This anchors the label text to the bottom of the row so it sits 4px above the content, while the buttons stay in their current position.

**4. WorldTab.tsx** — Starting Day & Time
- Line 912-913: Change from being inside `space-y-3` to using `mb-1` on the label directly, matching the 4px standard.

**5. WorldTab.tsx** — Dialog Formatting
- Line 1176: Add `mb-1` to the label and ensure the HintBox follows with no extra gap (change parent from `space-y-4` to explicit margins).

**6. WorldTab.tsx** — Custom content section titles
- Line 699-700: The custom section titles sit in a `space-y-4` container. Add `mb-1` to the title row and reduce the gap so the first item row is 4px below the title.

**7. ContentThemesSection.tsx** — All category headings
- Line 75: Change `space-y-3` to `space-y-1` in the CategorySelector wrapper (affects Character Types, Genre, Origin, Trigger Warnings)
- StoryTypeSelector wrapper: same change `space-y-3` → `space-y-1`
- CustomTagsSection wrapper: same change `space-y-3` → `space-y-1`

All changes standardize every heading to **4px gap** between the bottom of the label text and the top of the content/input below it.

