

# Fix Public Profile Tab Layout to Match Mockup

## Problem

The current Public Profile tab breaks the content into many separate stacked dark cards (avatar card, about me card, genres card, privacy card, stats card). The mockup shows a much simpler two-section layout.

## Target Layout (from mockup)

```text
+------------------------------------------------------------------+
| [Avatar]  | Hide Profile Details (checkbox)                      |
| (upload)  | Display Name  [________________________]             |
|           | About Me      [________________________]             |
|           | Preferred Genres [______________________]            |
+------------------------------------------------------------------+
|                                                                    |
| Published Works    Hide Published Works (checkbox)    Stats...    |
| +--------+ +--------+ +--------+ +--------+                      |
| |        | |        | |        | |        |                       |
| | card   | | card   | | card   | | card   |                       |
| |        | |        | |        | |        |                       |
| +--------+ +--------+ +--------+ +--------+                      |
+------------------------------------------------------------------+
```

## Changes to `src/components/account/PublicProfileTab.tsx`

Restructure the entire component layout into two main sections:

### Section 1: Profile Info (single card)
- Left column: Avatar with upload overlay (same size, ~24x24/96px)
- Right column, stacked vertically:
  - "Hide Profile Details" checkbox at the top
  - Display Name label + input (horizontal row)
  - About Me label + input (horizontal row)
  - Preferred Genres label + input (horizontal row)
- The labels sit to the left of inputs in a form-row pattern (like the mockup shows), not above them

### Section 2: Published Works (single card)
- Header row spans full width containing:
  - "Published Works" title (left)
  - "Hide Published Works" checkbox (center-left)
  - Stats counters inline (right side): Likes, Published, Saved, Views, Plays
- Below the header: a grid of published work cards (need to fetch these -- the current component doesn't show published works at all, but the CreatorProfile page does, so we'll add the same query here)
- Cards use the same 3:4 portrait ratio tile style

### Additional changes
- Remove the separate "Privacy Settings", "Creator Stats", and "About Me" cards
- Combine everything into the two-section structure
- Keep "Save Profile" button at the bottom
- Add published works fetching (reuse the same query pattern from CreatorProfile.tsx)

### Save button
Keep the save button below both sections.

## Files Modified

| File | Change |
|---|---|
| `src/components/account/PublicProfileTab.tsx` | Complete layout restructure to match the two-section mockup |

No database or routing changes needed -- this is purely a layout/UI fix.

