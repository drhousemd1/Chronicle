

# Fix Published Works Cards to Match Gallery Cards

## Problem

The Published Works cards in the Public Profile tab are a simplified, incomplete version that's missing most of the visual elements and data that the Community Gallery cards have. Specifically:

- No SFW/NSFW badge
- No remix (pencil) badge
- Only 2 stats icons (Heart, Play) instead of all 4 (Eye, Heart, Bookmark, Play)
- No "Written by:" author row
- Wrong aspect ratio and border radius
- No brand border color (#4a5f7f)
- Weak gradient overlay causing text clipping
- Missing shadow and hover effects
- Data query doesn't fetch view_count, save_count, allow_remix, or content themes

## Solution

Rewrite the Published Works card rendering to match `GalleryScenarioCard.tsx` exactly, and expand the data query to fetch the missing fields.

## Technical Changes

### 1. `src/components/account/PublicProfileTab.tsx` -- Expand the data query

Update the `published_scenarios` select query (line 75-78) to also fetch `view_count`, `save_count`, and `allow_remix`:

```sql
id, scenario_id, like_count, play_count, view_count, save_count, allow_remix,
scenarios!inner (title, description, cover_image_url, cover_image_position)
```

### 2. `src/components/account/PublicProfileTab.tsx` -- Update the PublishedWork interface

Add the missing fields to the `PublishedWork` interface (lines 34-42):

```ts
interface PublishedWork {
  id: string;
  scenario_id: string;
  like_count: number;
  play_count: number;
  view_count: number;
  save_count: number;
  allow_remix: boolean;
  scenario: { ... } | null;
}
```

### 3. `src/components/account/PublicProfileTab.tsx` -- Fetch content themes

After the main query, also fetch content themes for each work's scenario_id (using the existing `content_themes` table), and attach the `storyType` to each work so the SFW/NSFW badge can render.

### 4. `src/components/account/PublicProfileTab.tsx` -- Rewrite the card rendering (lines 352-380)

Replace the current simplified card with the full gallery-style card structure:

- **Container**: `aspect-[2/3]` with `rounded-[2rem]`, `border border-[#4a5f7f]`, heavy box shadow
- **Gradient overlay**: `from-slate-950 via-slate-900/60 to-transparent`
- **SFW/NSFW badge**: Top-right corner, red for NSFW, blue for SFW
- **Pencil badge**: Top-left corner when `allow_remix` is true
- **Bottom info section** (4-row stack):
  1. Title -- `text-lg font-black`, single line truncate
  2. Description -- `text-xs italic`, 2-line clamp with `min-h-[2.5rem]`
  3. Stats row -- Eye, Heart, Bookmark, Play with counts
  4. "Written by:" row with the user's display name
- **Hover effects**: scale-up on image, translate-y on card

### 5. Add missing imports

Add `Bookmark`, `Eye`, `Pencil` to the lucide-react import (some may already be imported for the stats header).

## What stays the same

- The stats header row at the top of the Published Works section (already correct)
- The grid layout (`grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`)
- No interactive Like/Save/Play buttons on these cards (this is a profile view, not the gallery)
- The `GalleryScenarioCard` component itself is not modified
