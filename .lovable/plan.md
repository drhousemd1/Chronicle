

# Restore Story Card Header to Match Other Container Headers

All other container headers (World Core, Opening Dialog, Scene Gallery, etc.) use `text-xl font-bold tracking-tight`. The Story Card header currently has `text-sm font-semibold` from the previous change.

## File: `src/components/chronicle/WorldTab.tsx`

**Line 513** — restore to match sibling headers:

```tsx
// From:
<h2 className="text-white text-sm font-semibold">Story Card</h2>

// To:
<h2 className="text-white text-xl font-bold tracking-tight">Story Card</h2>
```

Also restore the icon on line 512 to match the other headers (18px, strokeWidth 2.5):

```tsx
// From:
<svg ... width="20" height="20" ... strokeWidth="2" ... className="text-white/90">

// To:
<svg ... width="18" height="18" ... strokeWidth="2.5" ... className="text-white">
```

