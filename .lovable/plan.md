

# Community Gallery Tile Border Update

## What's changing

Add the slate blue border to the Community Gallery scenario tiles, replacing the current subtle ring styling -- matching all other tile pages.

## Technical Details

**File:** `src/components/chronicle/GalleryScenarioCard.tsx`, line 68

**Current:**
```
ring-1 ring-slate-900/5
```

**New:**
```
border border-[#4a5f7f]
```

Single class swap on one line. Completes the slate blue border unification across all tile cards in the app.

