

# Add Hover Effect to AI Generate & AI Fill Buttons

## Problem
The premium 8-layer AI Generate buttons (Character Builder, Story Builder) and the AI Fill button (header) have no hover effect — they feel static and unresponsive.

## Approach
Add `hover:brightness-125` to the outer `<button>` element on all four instances. This brightens the entire layered stack on hover without needing to modify individual layers, and it matches the hover pattern already used on nearby buttons (e.g., the Save button at Index.tsx line 2159).

## Changes

### 1. `src/components/chronicle/AvatarActionButtons.tsx` (line 83)
Add `hover:brightness-125` to the button className.

### 2. `src/components/chronicle/CoverImageActionButtons.tsx` (line 83)
Same — add `hover:brightness-125`.

### 3. `src/components/chronicle/SceneGalleryActionButtons.tsx` (line 82)
Same — add `hover:brightness-125`.

### 4. `src/pages/Index.tsx` (line 2108)
Add `hover:brightness-125` to the AI Fill button className.

All four buttons get the same single-class addition. Nothing else changes.

