
# Fix Text Sizing and Creator Rating Alignment

## Problem
Text throughout the review system is too small to read comfortably. Multiple elements use `text-[10px]` which requires squinting. The creator rating stars are also misaligned -- they sit below the avatar instead of inline with the "by CreatorName" text.

## Changes

### 1. ReviewModal.tsx -- Increase text sizes

- Category descriptions: `text-[10px]` to `text-xs` (lines 94, 110)
- Spice Level description: same change
- Overall score label and value: `text-xs` to `text-sm`, star size from 14 to 16 (lines 125-127)
- Star icons in rating rows: size from 18 to 22 for better tap targets
- Spice icons: size from 18 to 22

### 2. ScenarioDetailModal.tsx -- Review cards text sizes

- Reviewer avatar fallback text: `text-[10px]` to `text-xs` (line 580)
- Reviewer name: `text-xs` to `text-sm` (line 585)
- Timestamp: `text-[10px]` to `text-xs` (line 586)
- "Story" and "Spice" labels: `text-[10px]` to `text-sm` (lines 590, 594)
- Star/chili icons in review cards: size from 12 to 16 (lines 591, 595)
- Comment text: `text-xs` to `text-sm` (line 599)

### 3. ScenarioDetailModal.tsx -- Creator rating alignment

Move the creator rating out of the nested `<div>` under the avatar and inline it with the "by CreatorName" line. The stars and "5.0 (1 review)" text should appear on the same line as "by Dr. House", or directly below it but aligned with the text (not the avatar).

Current structure (lines 414-424):
```text
<div>
  <p>by <span>Dr. House</span></p>
  <div>  // creator rating -- sits under avatar
    <StarRating size={12} />
    <span text-[10px]>5.0 (1 review)</span>
  </div>
</div>
```

New structure:
```text
<div>
  <p>by <span>Dr. House</span></p>
  <div className="flex items-center gap-1.5 mt-0.5">
    <StarRating size={16} />
    <span className="text-sm text-white/50">5.0 (1 review)</span>
  </div>
</div>
```

Key changes:
- Star size: 12 to 16
- Rating text: `text-[10px] text-white/40` to `text-sm text-white/50`
- The `<div>` containing the rating stays inside the text column (right of avatar), so it aligns with the "by" line, not under the avatar image

### Summary of size changes

| Element | Before | After |
|---------|--------|-------|
| Review modal descriptions | text-[10px] | text-xs |
| Review modal star/chili size | 18px | 22px |
| Overall score stars | 14px | 16px |
| Overall score text | text-xs | text-sm |
| Review card reviewer name | text-xs | text-sm |
| Review card timestamp | text-[10px] | text-xs |
| Review card labels (Story/Spice) | text-[10px] | text-sm |
| Review card star/chili size | 12px | 16px |
| Review card comment | text-xs | text-sm |
| Creator rating stars | 12px | 16px |
| Creator rating text | text-[10px] | text-sm |
