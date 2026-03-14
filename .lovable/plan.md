

## Fix: Admin Panel Tile Hover Overlay

Same issue as the Image Library fix — the admin tile hover actions container on line 166 has `bg-black/30`, causing a full-card darkening on hover.

### Change in `src/pages/Admin.tsx`

**Line 166** — Remove `bg-black/30` from the hover actions container:

**From:**
```tsx
<div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/30 z-10 scale-90 group-hover:scale-100">
```

**To:**
```tsx
<div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 scale-90 group-hover:scale-100">
```

Single class removal, no other changes needed.

