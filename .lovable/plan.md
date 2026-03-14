

## Tile Card Visual Updates — 4 Files

Identical pattern applied to each file: remove full-card `bg-black/40` overlay, replace with always-visible bottom gradient, make subtext white.

---

### 1. StoryHub.tsx (ScenarioCard)

**Line 107**: Remove `<div className="absolute inset-0 bg-black/40 pointer-events-none" />`

**Lines 109-115**: Replace the hover-animated gradient overlay with an always-visible one:
```tsx
<div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70 pointer-events-none z-[1]" />
```
(Remove the `overlayTop` state, `useLayoutEffect` measuring logic, and the conditional render — lines 38-52 and 109-115.)

**Line 142**: Add `z-[2]` to bottom info div (already has it).

**Lines 146, 150, 176**: Change `text-[rgba(248,250,252,0.7)]` to `text-white` on description, stats row, and "Created by" text.

---

### 2. GalleryStoryCard.tsx

**Line 84**: Remove `<div className="absolute inset-0 bg-black/40 pointer-events-none" />`

**After line 83** (where overlay was): Add always-visible gradient:
```tsx
<div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70 pointer-events-none z-[1]" />
```

**Line 141**: Add `z-[2]` to bottom info div.

**Lines 145, 148, 166**: Change `text-[rgba(248,250,252,0.7)]` to `text-white`.

---

### 3. CharactersTab.tsx (tile grid)

**Line 1079**: Remove `<div className="absolute inset-0 bg-black/40 pointer-events-none" />`

**Replace with**: Always-visible gradient:
```tsx
<div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70 pointer-events-none z-[1]" />
```

**Line 1081**: Add `z-[2]` to bottom info div.

**Line 1093**: Change `text-white/70` to `text-white`.

---

### 4. ImageLibraryTab.tsx (folder tiles)

**Line 477**: Remove `<div className="absolute inset-0 bg-black/40 pointer-events-none" />`

**Replace with**: Always-visible gradient:
```tsx
<div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70 pointer-events-none z-[1]" />
```

**Line 479**: Add `z-[2]` to bottom info div.

**Line 489**: Change `text-white/70` to `text-white`.

---

### StoryHub cleanup

Remove the now-unused `overlayTop` state and `useLayoutEffect` measuring block (lines 38-52 in ScenarioCard), plus the `infoRef` and `cardRef` refs since they only served the animated overlay. The `infoRef` on the bottom info div can be removed too.

No layout, spacing, or interaction changes beyond the overlay swap and text color update.

