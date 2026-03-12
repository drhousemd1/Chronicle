

# Remove Solid Border from Cover Image Container When Empty

The cover image container at line 532-539 always applies `border-2 border-ghost-white` (solid border). The inner "No Cover" placeholder at line 561 also has `border-2 border-dashed border-zinc-600`. This creates the double-border effect.

## Fix: `src/components/chronicle/WorldTab.tsx`

**Lines 532-539** — Only apply the solid border when there IS a cover image. When empty, no border on the outer container (let the inner dashed border be the only one):

```tsx
className={cn(
  "relative w-full md:w-48 aspect-[2/3] rounded-2xl overflow-hidden transition-all duration-200",
  isRepositioningCover 
    ? 'ring-4 ring-blue-500 cursor-move shadow-xl shadow-blue-500/20' 
    : publishErrors.coverImage
      ? 'border-2 border-red-500 ring-2 ring-red-500'
      : coverImage
        ? 'border-2 border-ghost-white shadow-lg'
        : 'shadow-lg'
)}
```

This conditionally applies the solid border only when `coverImage` exists. When there's no cover, just the dashed placeholder border shows.

