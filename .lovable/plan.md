

# Change StoryDetailModal Border & Divider to Slate Blue

## Problem
The "View More" detail modal uses `border-ghost-white` (white/30%) for both its outer border and the vertical divider between the cover image and content columns. Per the brand system, these should use Slate Blue (#4a5f7f).

## Changes

**File: `src/components/chronicle/StoryDetailModal.tsx`**

1. **Line 240** — Outer modal border: change `border border-ghost-white` to `border border-[#4a5f7f]`
2. **Line 380** — Vertical divider (right column border-left): change `md:border-l border-ghost-white` to `md:border-l border-[#4a5f7f]`

Two single-token swaps, no other elements affected.

