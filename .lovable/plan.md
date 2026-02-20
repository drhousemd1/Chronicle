
# Add Review Count to Header and Paginate Reviews

## Overview

Add a review count next to the "Reviews" heading, and paginate reviews to show only 5 at a time with a "See more reviews" button. This avoids loading hundreds of reviews at once.

## Changes

### 1. Update `fetchScenarioReviews` to support pagination

**File**: `src/services/gallery-data.ts` (lines 590-612)

Add `limit` and `offset` parameters:

```typescript
export async function fetchScenarioReviews(
  publishedScenarioId: string,
  limit: number = 5,
  offset: number = 0
): Promise<ScenarioReview[]> {
```

Add `.range(offset, offset + limit - 1)` to the query before the `.order()` call. This way only 5 reviews are fetched initially, and 5 more each time the user clicks "See more".

### 2. Add pagination state and logic in `ScenarioDetailModal.tsx`

**File**: `src/components/chronicle/ScenarioDetailModal.tsx`

- Add state: `reviewsPage` (number, starts at 0), `hasMoreReviews` (boolean), `loadingMoreReviews` (boolean)
- Update `loadReviews` to call `fetchScenarioReviews(id, 5, 0)` on initial load and append results on subsequent pages
- Determine `hasMoreReviews` by checking if the returned batch has exactly 5 items (if fewer, no more to load)
- Add a `loadMoreReviews` function that increments the offset and appends new reviews to existing ones
- Reset pagination state when the modal opens or the scenario changes

### 3. Update "Reviews" heading to show count

**File**: `src/components/chronicle/ScenarioDetailModal.tsx` (line 573)

Change:
```
Reviews
```
To:
```
Reviews ({reviewCount})
```

Using the `reviewCount` prop already passed to the modal (from `published_scenarios.review_count`).

### 4. Add "See more reviews" button

**File**: `src/components/chronicle/ScenarioDetailModal.tsx` (after line 620, the reviews map)

After the reviews list, conditionally render a button:
- Only shown when `hasMoreReviews` is true (i.e., there are more than 5 total and we haven't loaded them all)
- Shows a loading spinner while fetching
- Styled as a subtle centered text button matching the existing UI

```
<button onClick={loadMoreReviews}>
  See more reviews
</button>
```

## Technical Summary

| File | Change |
|------|--------|
| `gallery-data.ts` | Add `limit`/`offset` params to `fetchScenarioReviews` |
| `ScenarioDetailModal.tsx` | Add pagination state, show count in heading, add "See more reviews" button |
