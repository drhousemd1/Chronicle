
You’re right. I audited the repo and confirmed the current Community Gallery screenshots are synthetic (not captured from your app). The files in `src/assets/guide-screenshots/gallery-*.png` contain AI-looking artifacts/gibberish text, and those same images are what your swatches are pointing to. That is the core issue.

## Fix Plan (no shortcuts)

### 1) Hard reset the Community Gallery evidence set
- Replace all Community Gallery location screenshots with real captures from the live UI only.
- Remove every synthetic gallery image reference from `locationImages` entries in `StyleGuideTool.tsx`.
- Keep only screenshot files captured from actual app states.

### 2) Re-audit source-of-truth colors from code (not screenshots)
I will re-derive swatches/locations directly from:
- `src/components/chronicle/GalleryHub.tsx`
- `src/components/chronicle/GalleryStoryCard.tsx`
- `src/components/chronicle/GalleryCategorySidebar.tsx`
- `src/components/chronicle/StoryDetailModal.tsx`
- `src/pages/Index.tsx` (gallery sort pills)

Then I will correct:
- missing swatches,
- wrong swatch-location mappings,
- wrong location descriptions,
- wrong app-wide/page-specific flags.

### 3) Enforce 1:1 mapping: every location gets its own screenshot
For each swatch location listed, there will be a corresponding `locationImages` item (no bundling multiple locations under one vague image).
- If a swatch has 6 listed locations, it will have 6 location image entries.
- If a location is removed/renamed, its image entry is removed/updated in the same edit.

### 4) Capture real, zoomed screenshots from actual UI states
I’ll recapture with tight viewports and real interactions for:
- header/search/buttons,
- sort pills,
- sidebar states,
- card default state,
- card hover controls,
- active like/save states,
- detail modal cover/actions/content/reviews/characters,
- active filter chips,
- empty state.
No generated imagery, no placeholders, no synthetic text.

### 5) Repair registry integrity (`ALL_SWATCHES`)
- Rebuild `ALL_SWATCHES` to match currently valid swatches only.
- Remove stale/duplicate entries.
- Ensure “Change to” dropdown only contains active registry colors.

### 6) Add validation guardrails so this cannot drift again
I will add strict validation in the style guide layer:
- detect location/list mismatch (locations vs `locationImages` count),
- detect swatches used in cards but missing from `ALL_SWATCHES`,
- detect `ALL_SWATCHES` entries that no longer exist in rendered swatch registry.
This makes bad sync visible immediately.

## Deliverables
- Corrected Community Gallery swatches in `src/components/admin/styleguide/StyleGuideTool.tsx`
- Replaced real screenshot assets in `src/assets/guide-screenshots/` and corresponding storage URLs
- Synced `locationImages` (1:1 with locations)
- Clean `ALL_SWATCHES` list with no stale options

## Acceptance checks
I will verify before handoff:
1. No synthetic/gibberish screenshot remains in Community Gallery swatches.
2. Every listed location opens a matching real screenshot via View.
3. Every screenshot visibly matches actual UI code/state.
4. `ALL_SWATCHES` exactly reflects active style-guide swatches and dropdown options.
