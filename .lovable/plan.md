

# Re-capture My Stories Screenshots — Localized Section Crops

## Problem
The current My Stories screenshots are full 1280×720 viewport captures. They need to match the Story Builder quality — smaller viewport, scrolled to the specific element.

## Capture Plan (same technique as Story Builder)

I'll use the same approach that worked for Story Builder: shrink the viewport and scroll to isolate each element.

| Screenshot | Viewport | Scroll/Setup | Target Element |
|---|---|---|---|
| `my-stories-tabs-header.png` | 800×200 | Top of page | Just the header bar with "MY STORIES" title + filter tab pills (Slate Blue active pill) |
| `my-stories-cards-badges.png` | 600×400 | Scroll to show 1-2 cards with badges | SFW/NSFW badge (Dark Charcoal bg), Published badge, card border (Slate Blue) |
| `my-stories-card-hover.png` | 400×500 | Hover a single card | Single card hover state showing EDIT/DELETE(red)/PLAY buttons tightly framed |
| `my-stories-new-story.png` | 400×500 | Scroll to show just the "New Story" dashed card | Dashed border skeleton card (Ash Gray border) |
| `my-stories-shadow.png` | 600×400 | Show 1-2 cards with visible drop shadow | Card shadow area (Half Black) |

## Execution
1. Navigate to My Stories page
2. For each capture: resize viewport small → scroll to target → screenshot → upload to `guide_images/my-stories/` (overwriting the old broad images)
3. Update the `locationImages` URLs in `StyleGuideTool.tsx` for all 6 swatches to point to the correct new images

## File Changes
- **`src/components/admin/styleguide/StyleGuideTool.tsx`** — update `locationImages` URLs on lines 1113-1134
- **Supabase storage** — upload 5 new cropped images to `guide_images/my-stories/`, replacing the 3 existing broad ones

