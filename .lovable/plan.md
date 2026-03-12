

# Soften the Slide-Up Overlay Top Edge

Replace the solid `bg-black/70` on the hover slide-up overlay with a vertical gradient so the top edge fades in gradually instead of a harsh line.

## Change

**File**: `src/components/chronicle/StoryHub.tsx` — the hover slide-up overlay div

Replace `bg-black/70` with `bg-gradient-to-b from-transparent to-black/70`. Everything else (dynamic top position, animation, z-index) stays the same.

