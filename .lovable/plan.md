

## Fix: Image Library Tile Hover Overlay

The Image Library folder tiles have a `bg-black/30` background on the hover action buttons container (line 496), which darkens the entire card on hover. The StoryHub and other pages removed this and use no background on that container, relying only on the always-visible bottom gradient.

### Change in `src/components/chronicle/ImageLibraryTab.tsx`

**Line 496** — Update the hover actions container:

**From:**
```tsx
<div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all bg-black/30">
```

**To:**
```tsx
<div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 scale-90 group-hover:scale-100">
```

This removes the `bg-black/30` full-card darkening and adds the matching `scale-90 group-hover:scale-100 duration-300 z-10` pop-in animation from StoryHub.

Single line change, no other modifications needed.

