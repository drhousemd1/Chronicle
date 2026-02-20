

# Scenario Reviews and Creator Rating System

## Overview

This adds a full review system where users can rate published scenarios on 9 quality categories (5-star scale) plus a subjective "Spice Level" (chili pepper scale), leave an optional text comment, and see aggregated results. Creators also get an overall rating tag displayed beneath their avatar in the scenario detail modal.

---

## Part 1: Database Schema

### New Table: `scenario_reviews`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default gen_random_uuid() |
| published_scenario_id | uuid | NOT NULL, references the published scenario |
| user_id | uuid | NOT NULL, the reviewer |
| concept_strength | smallint | 1-5 |
| initial_situation | smallint | 1-5 |
| role_clarity | smallint | 1-5 |
| motivation_tension | smallint | 1-5 |
| tone_promise | smallint | 1-5 |
| low_friction_start | smallint | 1-5 |
| worldbuilding_vibe | smallint | 1-5 |
| replayability | smallint | 1-5 |
| character_details_complexity | smallint | 1-5 |
| spice_level | smallint | 1-5 (chili peppers) |
| comment | text | Optional free-text review |
| raw_weighted_score | numeric(4,3) | Computed weighted average (stored) |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

**Constraints:**
- UNIQUE on (published_scenario_id, user_id) -- one review per user per scenario
- All rating columns validated 1-5 via trigger

**RLS Policies:**
- SELECT: Anyone authenticated can view reviews (public reviews)
- INSERT: user_id = auth.uid() (users can create own reviews)
- UPDATE: user_id = auth.uid() (users can edit own reviews)
- DELETE: user_id = auth.uid() (users can delete own reviews)

### Aggregation Columns on `published_scenarios`

Add two new columns:
- `review_count` (integer, default 0)
- `avg_rating` (numeric(3,2), default 0) -- average raw_weighted_score across all reviews

A database trigger on scenario_reviews INSERT/UPDATE/DELETE will automatically recompute these aggregates.

---

## Part 2: Review Rating Logic (Frontend Utility)

### New file: `src/services/review-ratings.ts`

Contains the TypeScript types and computation logic the user provided:

- `CreatorReviewRatings` type (9 rating fields)
- `REVIEW_WEIGHTS` constant with the specified weights
- `computeOverallRating()` function returning `{ raw, display }` (display = nearest half-star)
- `getStarBreakdown(display)` helper returning `{ fullStars, halfStars, emptyStars }`
- `REVIEW_CATEGORIES` constant array with label, key, and description for each of the 9 categories + spice level

---

## Part 3: "Leave a Review" Modal

### New file: `src/components/chronicle/ReviewModal.tsx`

A dialog modal that opens when clicking "Leave a Review". Contains:

- **Header**: "Rate This Scenario"
- **9 rating rows**: Each row shows the category name, a brief description tooltip/subtitle, and 5 clickable star icons (gold filled stars). Categories:
  1. Concept Strength
  2. Initial Situation
  3. Role Clarity
  4. Motivation/Tension
  5. Tone Promise
  6. Low-Friction Start
  7. Worldbuilding and Vibe
  8. Replayability
  9. Character Details and Complexity
- **Spice Level row**: 5 clickable chili pepper icons (red when filled) with label "Spice Level"
- **Comment textarea**: Optional, placeholder "Share your thoughts... (optional)"
- **Overall Score preview**: Shows the computed weighted score as stars in real-time as user rates
- **Submit button**: Saves to database, closes modal
- **Styling**: Dark theme matching existing modals (bg-[#121214], rounded-2xl, border-white/10)

---

## Part 4: Reviews Section in ScenarioDetailModal

### Placement
Inside the right-column ScrollArea, **below the Characters section**, add:

1. A horizontal divider line (gradient from slate blue #4a5f7f, matching the app's brand)
2. A header row: "REVIEWS" label (matching other section headers) + "Leave a Review" button (right-aligned, small pill button in slate blue)
3. Review cards stacked vertically showing:
   - Reviewer avatar (small circle) + display name + relative timestamp (e.g., "6h ago")
   - "Story Rating" with star icons showing their overall weighted score
   - "Spice Level" with chili pepper icons
   - Comment text (if any)
4. If no reviews yet: "No reviews yet. Be the first!" italic text

### Data fetching
New function `fetchScenarioReviews(publishedScenarioId)` in `gallery-data.ts` that:
- Queries `scenario_reviews` joined with `profiles` for reviewer info
- Orders by created_at descending
- Returns array of reviews with reviewer profile data

This is fetched when the modal opens (alongside characters).

---

## Part 5: Creator Overall Rating Tag

### In ScenarioDetailModal
Below the publisher's avatar and "by CreatorName" text, add a small tag showing the creator's aggregate rating across ALL their published scenarios.

**Computation**: Average the `avg_rating` from all `published_scenarios` where `publisher_id` matches and `review_count > 0`.

New function `fetchCreatorOverallRating(publisherId)` in `gallery-data.ts` that:
- Queries `published_scenarios` for that publisher where review_count > 0
- Computes average of avg_rating
- Returns `{ rating: number, totalReviews: number }` or null

**Display**: A small inline element like:
```
[star icon] 4.5 (23 reviews)
```
Shown in muted text beneath the "by CreatorName" line. Only shown when the creator has at least one reviewed scenario.

---

## Part 6: Star and Chili Pepper Rendering Components

### New file: `src/components/chronicle/StarRating.tsx`

Reusable component for rendering stars:
- Props: `rating` (number), `maxStars` (default 5), `size` (icon size), `interactive` (boolean), `onChange` (callback)
- Renders full stars (gold filled), half stars, and empty stars
- When interactive=true, clicking sets the rating

### New file: `src/components/chronicle/SpiceRating.tsx`

Same pattern but with chili pepper icons (using a simple SVG or emoji). Red filled vs gray empty.

---

## Technical Summary of File Changes

| File | Action |
|------|--------|
| **Database migration** | Create `scenario_reviews` table, add `review_count`/`avg_rating` to `published_scenarios`, create aggregation trigger |
| `src/services/review-ratings.ts` | NEW -- Rating weights, computation, category definitions |
| `src/components/chronicle/StarRating.tsx` | NEW -- Reusable star rating component |
| `src/components/chronicle/SpiceRating.tsx` | NEW -- Reusable chili pepper rating component |
| `src/components/chronicle/ReviewModal.tsx` | NEW -- "Leave a Review" modal with 9 categories + spice + comment |
| `src/components/chronicle/ScenarioDetailModal.tsx` | ADD reviews section below characters, add creator rating tag below publisher name |
| `src/services/gallery-data.ts` | ADD `fetchScenarioReviews()`, `submitReview()`, `fetchCreatorOverallRating()`, `fetchUserReview()` |
| `src/integrations/supabase/types.ts` | Auto-updated after migration |

