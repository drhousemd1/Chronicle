
# Clip Zoomed Image Behind the Gray Footer

## The Problem

The image zoom effect (`group-hover:scale-110`) causes the image to scale beyond its container and visually overflow into the gray title/aspect-ratio footer below it. The `overflow-hidden` on the outer card wrapper clips at the card border, but doesn't prevent the image from covering the footer area inside the card.

## The Fix

**File:** `src/components/chronicle/ImageLibraryTab.tsx`, line 691

Add `overflow-hidden` to the image container div so the zoomed image is clipped within the square image area, not spilling over the footer.

Change:
```
<div className="relative aspect-square bg-slate-100">
```
To:
```
<div className="relative aspect-square bg-slate-100 overflow-hidden">
```

This is the same pattern used by story tiles in `ScenarioHub.tsx`, where the image container has `overflow-hidden` to keep the zoom effect contained.
