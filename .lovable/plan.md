
# Remove Tags from Gallery Scenario Cards

## Overview

Remove the tags display from the top-right corner of Community Gallery scenario cards. Users can still view tags when opening the detail modal.

---

## File to Modify

| File | Changes |
|------|---------|
| `src/components/chronicle/GalleryScenarioCard.tsx` | Delete the Tags section (lines 94-106) |

---

## Detailed Changes

### Remove Tags Section (lines 94-106)

**Delete this entire block:**
```tsx
{/* Tags */}
{published.tags.length > 0 && (
  <div className="absolute top-4 right-4 flex flex-wrap gap-1.5 max-w-[120px] justify-end">
    {published.tags.slice(0, 3).map((tag) => (
      <span
        key={tag}
        className="px-2 py-0.5 bg-black/50 backdrop-blur-sm rounded-full text-[10px] text-white/80 font-medium"
      >
        #{tag}
      </span>
    ))}
  </div>
)}
```

---

## Result

- Gallery scenario cards will no longer show tags in the top-right corner
- The "REMIXABLE" badge will remain visible when applicable
- Tags are still accessible in the scenario detail modal when users click on a card
