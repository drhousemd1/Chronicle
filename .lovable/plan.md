
# Fix SFW/NSFW Badge Readability

## Issue

The current badge backgrounds use semi-transparent colored backgrounds (`bg-red-500/20` and `bg-blue-500/20`) which don't provide enough contrast against cover images, making the text hard to read.

## Solution

Change the badge backgrounds to a solid charcoal gray (`bg-[#2a2a2f]`) while keeping the vibrant colored text for SFW (blue-400) and NSFW (red-400).

---

## File to Modify

**`src/components/chronicle/GalleryScenarioCard.tsx`** (lines 88-93)

| Current | Updated |
|---------|---------|
| NSFW: `bg-red-500/20 text-red-400` | `bg-[#2a2a2f] text-red-400` |
| SFW: `bg-blue-500/20 text-blue-400` | `bg-[#2a2a2f] text-blue-400` |

### Updated Code

```tsx
{/* SFW/NSFW Badge */}
{published.contentThemes?.storyType && (
  <div className={cn(
    "absolute top-4 right-4 px-2.5 py-1 backdrop-blur-sm rounded-lg text-xs font-bold shadow-lg bg-[#2a2a2f]",
    published.contentThemes.storyType === 'NSFW'
      ? "text-red-400"
      : "text-blue-400"
  )}>
    {published.contentThemes.storyType}
  </div>
)}
```

---

## Visual Result

- **Background**: Solid charcoal gray (`#2a2a2f`) with `backdrop-blur-sm` for depth
- **SFW text**: Vibrant blue (`text-blue-400`)
- **NSFW text**: Vibrant red (`text-red-400`)
- **Padding**: Unchanged (`px-2.5 py-1`)

The charcoal background provides consistent contrast regardless of the cover image behind it.
