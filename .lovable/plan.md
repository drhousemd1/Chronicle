

# Fix Scene Lightbox: Remove Black Bars and X Button

Two quick fixes to `src/components/chronicle/SceneTagEditorModal.tsx`:

## 1. Remove the black bar image wrapper (lines 72-78)

The image is wrapped in a `div` with `bg-black` which creates visible black letterbox bars. Replace the wrapper + img with a single `img` tag that has the sizing applied directly, matching the Image Library lightbox.

**Before:**
```tsx
<div className="w-full h-[50vh] bg-black rounded-lg overflow-hidden mb-3">
  <img src={scene.url} alt={...} className="w-full h-full object-contain" />
</div>
```

**After:**
```tsx
<img src={scene.url} alt={...} className="w-full max-h-[50vh] object-contain rounded-lg mb-3" />
```

## 2. Remove the X close button (lines 63-69)

The small X button in the top-right corner is redundant since there's already a Cancel button in the footer. Remove the entire button element and the unused `X` icon import from lucide (still used by tag pills, so keep the import).

## Files Changed

- `src/components/chronicle/SceneTagEditorModal.tsx` -- remove black wrapper div, remove X close button

