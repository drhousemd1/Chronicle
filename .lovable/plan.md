

# Add "View" + Location Screenshots for My Stories Page Swatches

## Scope
Add `locationImages` props and the View/modal functionality to all 6 swatches in the "My Stories Page" section, using section-level screenshots captured from the My Stories page.

## Screenshots to Capture (4 distinct images)

| Filename | What's visible | Swatches served |
|---|---|---|
| `my-stories-full.png` | Full My Stories page — header, cards, new story card | Frosted White (page bg), Half Black (card shadow) |
| `my-stories-card-hover.png` | Card hover state showing EDIT/DELETE/PLAY buttons | Bright Red (DELETE button) |
| `my-stories-tabs-header.png` | Tight view of header bar with tab pills | Slate Blue (active "All" pill) |
| `my-stories-cards-badges.png` | Story cards showing PUBLISHED/SFW/NSFW badges and the NEW STORY dashed card | Dark Charcoal (badge bg), Slate Blue (card border), Ash Gray (new story border) |

## Capture Strategy
1. Navigate to My Stories at 1280×720
2. Take full page screenshot → `my-stories-full.png`
3. Hover over a story card → capture hover state with DELETE button → `my-stories-card-hover.png`
4. Resize viewport to ~800×400 to tightly frame header/tabs → `my-stories-tabs-header.png`
5. Resize to show card grid with badges and new story card → `my-stories-cards-badges.png`
6. Save all as `src/assets/guide-screenshots/my-stories-*.png`

## Code Changes (single file: `StyleGuideTool.tsx`, lines 1112-1123)

Add `locationImages` to each of the 6 `SwatchCardV2` entries using static imports:

```tsx
import myStoriesFull from '@/assets/guide-screenshots/my-stories-full.png';
import myStoriesCardHover from '@/assets/guide-screenshots/my-stories-card-hover.png';
import myStoriesTabsHeader from '@/assets/guide-screenshots/my-stories-tabs-header.png';
import myStoriesCardsBadges from '@/assets/guide-screenshots/my-stories-cards-badges.png';
```

Then for each swatch:

1. **Frosted White** → `my-stories-full.png` — "Full page background behind the story card grid"
2. **Slate Blue** → `my-stories-tabs-header.png` (active tab pill) + `my-stories-cards-badges.png` (card border)
3. **Dark Charcoal** → `my-stories-cards-badges.png` — "Dark background behind SFW/NSFW badge text on story cards"
4. **Bright Red** → `my-stories-card-hover.png` — "DELETE button on card hover state" + `my-stories-cards-badges.png` — "NSFW badge text color"
5. **Ash Gray** → `my-stories-cards-badges.png` — "Dashed border on the 'Create New Story' skeleton card"
6. **Half Black** → `my-stories-full.png` — "Drop shadow on story cards (shadow-[0_12px_32px_-2px_rgba(0,0,0,0.5)])"

## Files Changed
- `src/components/admin/styleguide/StyleGuideTool.tsx` — add imports + `locationImages` props to 6 swatches
- `src/assets/guide-screenshots/my-stories-full.png` — new asset
- `src/assets/guide-screenshots/my-stories-card-hover.png` — new asset
- `src/assets/guide-screenshots/my-stories-tabs-header.png` — new asset
- `src/assets/guide-screenshots/my-stories-cards-badges.png` — new asset

