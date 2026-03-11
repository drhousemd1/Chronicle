

# Add "View" Link with Location Screenshots Modal (Slate Blue Test)

## What
Add a blue "View" text link next to the "Locations:" label on the Story Builder Slate Blue swatch card. Clicking it opens a dark modal with a carousel of screenshots -- one per location ("Panel header bars", "MAIN CHARACTERS pill") -- showing exactly where the color appears in the app. Uses the existing `guide_images` storage bucket.

## Architecture

### New component: `LocationViewerModal` (inside `StyleGuideTool.tsx`)
- Dark modal matching app modal standards (`bg-[hsl(240,6%,10%)]`, rounded-2xl)
- Image carousel with left/right arrows and dot indicators
- Below image: **Location:** text and **Function:** text
- Close button (X) top-right
- Props: `open`, `onClose`, `title` (color name), `images: Array<{ url: string; location: string; function: string }>`

### Props change: `SwatchCardV2`
- Add optional `locationImages?: Array<{ url: string; location: string; function: string }>` prop
- Only passed for the Story Builder "Slate Blue" card as a test

### `CollapsibleCardBody` change
- Add optional `onViewLocations?: () => void` prop
- When present, render a blue "View" text link inline next to "Locations:" label (same `#3b82f6` color as "Show more")
- Clicking it calls `onViewLocations` which opens the modal

### Screenshot capture workflow
- During implementation, I'll use the browser tool to navigate to the Story Builder page
- Capture screenshots of: (1) Panel header bars showing Slate Blue, (2) MAIN CHARACTERS pill
- Upload to `guide_images` storage bucket
- Reference the public URLs in the swatch data

## Files to edit
- `src/components/admin/styleguide/StyleGuideTool.tsx` -- add `LocationViewerModal`, update `CollapsibleCardBody` and `SwatchCardV2`, wire up for the one test swatch

## Data flow
```text
SwatchCardV2 (locationImages prop)
  → CollapsibleCardBody (onViewLocations callback)
    → "View" link next to "Locations:"
      → LocationViewerModal (carousel of screenshots)
        → Images from guide_images bucket
```

