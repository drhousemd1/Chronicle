

# Redesign Scenario Detail Modal Header Layout

## Overview

Restructure the right column header of the ScenarioDetailModal to match the mockup: title on its own row, cumulative story/spice ratings below it, stat counters below that, then the creator section with slate blue stars.

## Current Layout (Right Column Top)

```text
[Title]  [view] [like] [save] [play]    (all on one row)
[Avatar] by [Name]
         [gold stars] 5.0 (1 review)     (creator rating)
```

## New Layout (Per Mockup)

```text
[Title]
Story [gold stars]   Spice [red chilis]    (cumulative scenario ratings)
[view] [like] [save] [play]

[Avatar]  Created by: [Name]
          Creator rating: [slate blue stars] 4.5 (3 reviews)
```

---

## Changes Required

### 1. Add `avg_rating` and `review_count` props to ScenarioDetailModal

Pass these from the published scenario data so the modal can show cumulative story ratings without extra queries.

**File**: `ScenarioDetailModal.tsx` -- Add two optional props:
- `avgRating?: number`
- `reviewCount?: number`

**File**: `GalleryHub.tsx` -- Pass them:
- `avgRating={liveData.avg_rating}`
- `reviewCount={liveData.review_count}`

Also update the gallery fetch query if `avg_rating`/`review_count` aren't already selected (they are in the DB but need to be in the select).

### 2. Compute cumulative average spice from reviews

In the modal, compute the average spice level from the loaded `reviews` array:

```typescript
const avgSpice = reviews.length > 0
  ? reviews.reduce((sum, r) => sum + r.spice_level, 0) / reviews.length
  : 0;
```

This gives a simple average rounded for display.

### 3. Restructure the right-column header

**Title**: Stays as its own block, no longer in a flex row with stats.

**Cumulative Story + Spice row** (new): Below the title, show:
- "Story" label + gold StarRating using `avgRating` prop
- "Spice" label + red SpiceRating using computed `avgSpice`
- Only shown when `reviewCount > 0`

**Stats row**: Move the view/like/save/play counters to their own row below the ratings (no longer inline with title).

**Creator section**: Restructure to:
- Line 1: Avatar + "Created by: [Name]" (changed from "by")
- Line 2: "Creator rating:" text + slate blue StarRating + "4.5 (3 reviews)" text
- Stars use a **slate blue color** (`text-[#4a5f7f] fill-[#4a5f7f]`) instead of gold to visually distinguish from story ratings

### 4. Create a slate blue star variant

Add a `color` prop to `StarRating` component to support custom colors (default remains amber/gold). When `color="slate"` is passed, use `text-[#4a5f7f] fill-[#4a5f7f]` instead of `text-amber-400 fill-amber-400`.

### 5. Add spacing between stats row and creator section

Add `mt-4` or similar spacing between the counters row and the creator avatar/name block to create visual separation.

---

## Technical File Changes

| File | Change |
|------|--------|
| `src/components/chronicle/StarRating.tsx` | Add optional `color` prop (`"amber"` default, `"slate"` for blue) |
| `src/components/chronicle/ScenarioDetailModal.tsx` | Add `avgRating`/`reviewCount` props; restructure header: title alone, cumulative ratings row, stats row, creator section with "Created by:" and "Creator rating:" labels; compute `avgSpice` from reviews |
| `src/components/chronicle/GalleryHub.tsx` | Pass `avgRating` and `reviewCount` props to the modal |
| `src/services/gallery-data.ts` | Ensure `avg_rating` and `review_count` are included in gallery fetch queries |

---

## Detailed Layout Structure (JSX Pseudocode)

```text
<div className="flex flex-col gap-1">
  <!-- Title -->
  <h1>Title</h1>

  <!-- Cumulative Story + Spice (only if reviews exist) -->
  <div className="flex items-center gap-4">
    <span>Story</span> <StarRating rating={avgRating} />
    <span>Spice</span> <SpiceRating rating={avgSpice} />
  </div>

  <!-- Stats row -->
  <div className="flex items-center gap-4">
    [Eye] 60   [Heart] 0   [Bookmark] 0   [Play] 1
  </div>

  <!-- Spacing -->
  <div className="mt-4">
    <!-- Creator block -->
    <button className="flex items-start gap-2">
      <Avatar />
      <div>
        <p>Created by: <span class="text-[#4a5f7f]">Dr. House</span></p>
        <div>
          Creator rating: <StarRating color="slate" /> 5.0 (1 review)
        </div>
      </div>
    </button>
  </div>
</div>
```
