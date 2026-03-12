

# Fix Slate Blue Banners to Match Story Builder

**File: `src/components/chronicle/StoryDetailModal.tsx`**

Change the banner background from `bg-[#4a5f7f]/30` to solid `bg-[#4a5f7f]` on all 6 heading banners. Also add `rounded-xl` to match the Story Builder's pill-shaped style, and add `shadow-sm` for consistency.

### Lines to update
- **Line 475** — Synopsis banner
- **Line 489** — Genre banner
- **Line 497** — Character Types banner
- **Line 505** — Story Origin banner
- **Line 516** — Trigger Warnings banner
- **Line 537** — Characters banner

### Change pattern
From:
```tsx
<div className="bg-[#4a5f7f]/30 rounded px-3 py-1.5 mb-3 inline-block">
```
To:
```tsx
<div className="bg-[#4a5f7f] rounded-xl px-4 py-2 mb-3 inline-block shadow-sm">
```

This matches the Story Builder's sidebar section headers (e.g., "Main Characters", "Side Characters") which use `bg-[#4a5f7f] px-4 py-2 rounded-xl shadow-sm`.

