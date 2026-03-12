

# Move Creator Rating from View More Modal to Creator Profile Page

## Changes

### 1. `src/components/chronicle/StoryDetailModal.tsx` — Remove creator rating
- Remove the `creatorRating` state and the `useEffect` that calls `fetchCreatorOverallRating` (~lines 122, 174-178)
- Remove the `fetchCreatorOverallRating` import
- Remove the creator rating display block (~lines 454-460), keeping the "Created by" text

### 2. `src/pages/CreatorProfile.tsx` — Add creator rating
- Import `fetchCreatorOverallRating` from `@/services/gallery-data` and `StarRating` from `@/components/chronicle/StarRating`
- Add state for `creatorRating` and fetch it in the existing data-loading effect using the `userId` param
- Display the rating row in the info column (after the "Creator" display name row, ~line 224), using ghost white text color and slate blue stars:

```tsx
{creatorRating && (
  <div className="flex items-center gap-2">
    <span className="text-xs font-bold text-white/40 uppercase tracking-wider w-28 shrink-0">Rating</span>
    <div className="flex items-center gap-1.5">
      <StarRating rating={creatorRating.rating} size={16} color="slate" />
      <span className="text-sm text-ghost-white">
        {creatorRating.rating.toFixed(1)} ({creatorRating.totalReviews} review{creatorRating.totalReviews !== 1 ? 's' : ''})
      </span>
    </div>
  </div>
)}
```

Two files, straightforward move of the element.

