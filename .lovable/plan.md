

# Make Chronicle Responsive for Desktop and Tablet (768px+)

No mobile phone support -- minimum viewport is 768px (iPad portrait).

## What Changes

### 1. Sidebar Auto-Collapse on Tablets

**File: `src/pages/Index.tsx`** (line 1242)

When the viewport is between 768px and 1024px, automatically collapse the sidebar to its 72px icon-only mode. This uses the existing `sidebarCollapsed` state -- just set it to `true` on mount/resize when the window is narrow.

- Add a `useEffect` that listens to a `(max-width: 1024px)` media query
- When it matches, call `setSidebarCollapsed(true)`
- When it stops matching, restore previous state (or leave as-is so user choice is respected on desktop)

### 2. Responsive Header

**File: `src/pages/Index.tsx`** (line 1356)

- Change `px-8` to `px-4 lg:px-8`
- Filter pill bars (Your Stories, Community Gallery): wrap in a container with `overflow-x-auto scrollbar-none flex-shrink-0` so they scroll horizontally instead of overflowing on narrower screens

### 3. Responsive Content Padding and Grid Gaps

**File: `src/components/chronicle/ScenarioHub.tsx`** (line 210)
- `p-10` becomes `p-4 lg:p-10`
- `gap-8` becomes `gap-4 lg:gap-8`

**File: `src/components/chronicle/GalleryHub.tsx`** (line 393)
- `gap-8` becomes `gap-4 lg:gap-8`
- Outer padding (if `p-10` exists) becomes `p-4 lg:p-10`

**File: `src/components/chronicle/ImageLibraryTab.tsx`** (lines 440, 605)
- `gap-8` becomes `gap-4 lg:gap-8`
- `gap-6` becomes `gap-4 lg:gap-6`
- Any `p-10` becomes `p-4 lg:p-10`

**File: `src/components/chronicle/WorldTab.tsx`** (line 395)
- `p-10` becomes `p-4 lg:p-10`
- `gap-8` becomes `gap-6 lg:gap-8`

**File: `src/components/chronicle/CharacterEditModal.tsx`** (line 1213)
- Already uses `lg:grid-cols-3` -- no change needed

### 4. Responsive Text Sizes

Light touch -- only where headings are oversized for tablets:

- Header `h1` elements: already `text-lg` which is fine
- WorldTab `text-4xl` heading (line 397): change to `text-2xl lg:text-4xl`

## Summary of All Edits

| File | Change |
|---|---|
| `src/pages/Index.tsx` | Auto-collapse sidebar at 1024px; header `px-4 lg:px-8`; pill bars get `overflow-x-auto` |
| `src/components/chronicle/ScenarioHub.tsx` | `p-4 lg:p-10`, `gap-4 lg:gap-8` |
| `src/components/chronicle/GalleryHub.tsx` | `p-4 lg:p-10`, `gap-4 lg:gap-8` |
| `src/components/chronicle/ImageLibraryTab.tsx` | `gap-4 lg:gap-8`, `gap-4 lg:gap-6`, responsive padding |
| `src/components/chronicle/WorldTab.tsx` | `p-4 lg:p-10`, `gap-6 lg:gap-8`, heading `text-2xl lg:text-4xl` |

### Technical Detail: Sidebar Auto-Collapse

```typescript
// In Index.tsx, near existing sidebar state
useEffect(() => {
  const mql = window.matchMedia('(max-width: 1024px)');
  const onChange = (e: MediaQueryListEvent | MediaQueryList) => {
    if (e.matches) setSidebarCollapsed(true);
  };
  onChange(mql); // check on mount
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}, []);
```

This preserves all existing desktop behavior -- the sidebar toggle still works manually, and all grid breakpoints (`sm:`, `lg:`, `xl:`, `2xl:`) already handle column counts. The changes are purely spacing and the sidebar auto-collapse.

