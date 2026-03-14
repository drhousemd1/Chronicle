

## Fix: Apply avatar position to nav bar thumbnail

The nav bar character preview tile (line 1148) renders the avatar image with `object-cover` but doesn't apply the `avatarPosition` crop offset. The main avatar view uses `objectPosition: ${avatarPos.x}% ${avatarPos.y}%` to respect repositioning, but the nav bar thumbnail ignores it entirely.

**File**: `src/components/chronicle/CharactersTab.tsx`

**Change**: Update the nav bar `<img>` at line 1148 to include the `style` prop with `objectPosition` derived from `selected.avatarPosition`, matching how the main avatar and other thumbnails handle it.

```tsx
// Line 1148 — before:
<img src={selected.avatarDataUrl} alt={selected.name || 'Character'} className="w-full h-full object-cover" />

// After:
<img
  src={selected.avatarDataUrl}
  alt={selected.name || 'Character'}
  className="w-full h-full object-cover"
  style={{ objectPosition: `${selected.avatarPosition?.x ?? 50}% ${selected.avatarPosition?.y ?? 50}%` }}
/>
```

Single line change. This ensures the nav bar thumbnail reflects both the current avatar image and its user-set crop position.

