
# Fix Creator Rating Position, Review Card Layout, and Modal Text Sizes

## Issue 1: Creator Rating Alignment

**Problem**: The star rating and "5.0 (1 review)" text appears centered under the avatar circle. It should be left-aligned with the "by Dr. House" text line -- positioned as a second line within the text column, not under the avatar.

**Current structure** (lines 414-424 of ScenarioDetailModal.tsx):
The creator rating `<div>` is inside the correct parent `<div>` (the text column next to the avatar), but the parent button uses `items-center` which centers everything vertically. The rating needs to stay in the text column and align left with the "by" text.

**Fix**: The button wrapping the avatar+text currently has `items-center`. The rating div is already inside the text column div. The real issue is that the outer container may be centering things. Change the button's alignment from `items-center` to `items-start` so the text column aligns to the top-left of the avatar, and the rating naturally falls below the "by" line, left-aligned with it.

**File**: `src/components/chronicle/ScenarioDetailModal.tsx`, line ~399
- Change `items-center` to `items-start` on the publisher button element

---

## Issue 2: Review Card -- Move Story/Spice Ratings to Top-Right

**Problem**: The "Story [stars] Spice [peppers]" row currently sits below the reviewer name and timestamp, taking up a full row. User wants it positioned in the top-right corner of the review card, on the same row as the reviewer name/timestamp.

**Current structure** (lines 574-601):
```
<div card>
  <div row> avatar | name | timestamp </div>
  <div row> Story [stars] | Spice [peppers] </div>
  <p> comment </p>
</div>
```

**New structure**:
```
<div card>
  <div row justify-between>
    <div> avatar | name | timestamp </div>
    <div> Story [stars] | Spice [peppers] </div>   <!-- moved to right -->
  </div>
  <p> comment </p>
</div>
```

**File**: `src/components/chronicle/ScenarioDetailModal.tsx`, lines 574-601
- Wrap the reviewer info and ratings in a single flex row with `justify-between`
- Move the Story/Spice ratings div into the same row, right-aligned
- Remove the `mb-2` from the reviewer info since the ratings row is now merged
- Remove the `mb-1` from the ratings div since it's now inline

---

## Issue 3: ReviewModal Description Text Still Too Small

**Problem**: The category descriptions (e.g., "Is the scenario idea compelling, specific, and interesting?") are `text-xs` (12px). Compared to the rest of the app's body text at `text-sm` (14px), they look noticeably smaller and require squinting.

**Fix**: Increase ALL description text in the ReviewModal from `text-xs` to `text-sm`:

**File**: `src/components/chronicle/ReviewModal.tsx`
- Line 94: Category descriptions -- `text-xs text-white/40` to `text-sm text-white/40`
- Line 110: Spice Level description -- `text-xs text-white/40` to `text-sm text-white/40`

---

## Summary of Changes

| File | Line(s) | Change |
|------|---------|--------|
| ScenarioDetailModal.tsx | ~399 | Publisher button: `items-center` to `items-start` |
| ScenarioDetailModal.tsx | 574-601 | Restructure review card: merge reviewer info and Story/Spice into one `justify-between` row |
| ReviewModal.tsx | 94 | Category description: `text-xs` to `text-sm` |
| ReviewModal.tsx | 110 | Spice description: `text-xs` to `text-sm` |
