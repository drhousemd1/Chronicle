
## Goal
Restore the Community Gallery story tiles to the same “card code” and visual language as **Your Stories** tiles, while bringing back the elements that were removed:
- SFW/NSFW badge back in the **top-right**
- Engagement counters back on the tile: **Views, Likes, Saves (bookmarks), Plays**
- Remove the “chat-looking icon” (MessageCircle) and use the correct metric icons

## What’s currently wrong (confirmed in code)
In `src/components/chronicle/GalleryScenarioCard.tsx`:
- The tile uses `aspect-[3/4]`, `rounded-2xl`, different shadows, and different layout than `ScenarioHub`’s `ScenarioCard`
- The stats row only shows **likes** and **plays** and uses **MessageCircle** for plays (appears like a chat icon)
- The SFW/NSFW tag is shown in the bottom row (and sometimes missing visually), not in the **top-right**
- **Views** and **Saves** counters are not rendered at all (even though `published.view_count` and `published.save_count` exist)

## Implementation approach
We will make `GalleryScenarioCard` structurally match the `ScenarioHub` card (Your Stories), then layer gallery-specific elements on top:
- Keep the same base container, aspect ratio, hover lift, shadow, gradient overlay, and bottom fixed-height info block
- Keep the gallery hover overlay actions (Like / Save / Play)
- Add back top badges:
  - Remixable badge (top-left) stays
  - SFW/NSFW badge returns to top-right with the charcoal styling you’ve standardized
- Add the full metrics row with correct icons:
  - Eye = views (`published.view_count`)
  - Heart = likes (`published.like_count`)
  - Bookmark = saves (`published.save_count`)
  - Play = plays (`published.play_count`)
- Remove MessageCircle entirely from the card (this is the “chat icon” you’re seeing)

## Exact file changes

### 1) Update the gallery tile to match “Your Stories” card code
**File:** `src/components/chronicle/GalleryScenarioCard.tsx`

**Change the card container to match `ScenarioHub`**
- Replace:
  - `aspect-[3/4] ... rounded-2xl ... shadow-xl ... border ...`
- With (matching ScenarioHub):
  - `aspect-[2/3] w-full overflow-hidden rounded-[2rem] bg-slate-200 !shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)] transition-all duration-300 group-hover:-translate-y-3 group-hover:shadow-2xl ring-1 ring-slate-900/5 relative`

**Change the cover image block to match ScenarioHub**
- Use:
  - `className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"`
- And the same fallback initial-letter panel styling

**Change the gradient overlay to match ScenarioHub**
- Use:
  - `bg-gradient-to-t from-slate-950 via-slate-900/20 to-transparent opacity-90 group-hover:opacity-95 transition-opacity`

### 2) Restore the top-right SFW/NSFW badge
Still in `GalleryScenarioCard.tsx`:
- Add a top-right badge when `published.contentThemes?.storyType` is present:
  - Position: `absolute top-4 right-4 z-10`
  - Background: solid charcoal style (ex: `bg-[#2a2a2f]/90` with subtle border)
  - Text color:
    - SFW: `text-blue-400`
    - NSFW: `text-red-400`

This returns the “SFW/NSFW in top right corner” behavior.

### 3) Restore the full engagement metrics row (Views / Likes / Saves / Plays) and remove the chat icon
Still in `GalleryScenarioCard.tsx`:
- Update imports:
  - Remove `MessageCircle`
  - Add `Eye`
- Add a metrics row in the bottom info section that shows:
  - `published.view_count`
  - `published.like_count`
  - `published.save_count`
  - `published.play_count`
- Use icons: `Eye`, `Heart`, `Bookmark`, `Play`
- Keep it minimal and consistent with your existing typography (tiny font, muted white/gray)

### 4) Reinstate the “Your Stories” bottom info alignment behavior
To match the grid alignment on Your Stories, the bottom info container should use a **fixed height** like ScenarioHub:
- Use something like:
  - `absolute inset-x-0 bottom-0 h-28 p-6 pointer-events-none flex flex-col`
- Because we now need title + description + metrics, we will slightly adjust height if needed (likely `h-32`), while preserving the core idea: titles align across the grid.

## Acceptance criteria (what should be true after)
1) Community Gallery tiles look like Your Stories tiles:
   - 2:3 aspect ratio
   - rounded-[2rem]
   - lift-on-hover (-translate-y-3)
   - same shadow/ring/gradient treatment
2) SFW/NSFW badge is back in the **top-right** of each tile
3) Metrics row is back and includes:
   - Views, Likes, Saves, Plays
4) No “chat-looking icon” appears on the tile
5) Hover overlay actions (Like/Save/Play) still work and don’t interfere with tile clicks

## Notes / risks
- This is a purely UI restoration on the tile card; the counts already exist in `PublishedScenario` and are being updated in `GalleryHub` when a detail modal is opened (views) and when play/save/like actions occur.
- If the metrics row becomes cramped at smaller sizes, we’ll keep the exact same styling but allow a slightly taller fixed bottom area (still fixed-height for consistent alignment).

## Files touched
- `src/components/chronicle/GalleryScenarioCard.tsx` (only)
