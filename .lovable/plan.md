

## Fix Character Roster Card: Layout, Always-Visible Labels, Readable Font Size

### Problem
1. Sex and Age labels are conditionally hidden when values are empty -- user wants them always visible with blank values as placeholders.
2. Layout needs restructuring: name top-left, AI/User top-right, Sex on line 2, Age on line 3.
3. Font size `text-[10px]` is too small to read -- needs to match standard input field text size (`text-xs`).

### Changes

**File: `src/components/chronicle/WorldTab.tsx`** -- `CharacterButton` component (lines 79-89)

Replace the text content area with:

```jsx
<div className="min-w-0 flex-1">
  <div className="flex justify-between items-center">
    <div className="text-sm font-bold text-white truncate leading-tight group-hover:text-blue-300 transition-colors">{char.name}</div>
    <div className="text-xs font-black text-slate-400 uppercase tracking-wider shrink-0 ml-2">{char.controlledBy}</div>
  </div>
  <div className="text-xs text-slate-400 mt-0.5">Sex: {char.sexType || ''}</div>
  <div className="text-xs text-slate-400 mt-0.5">Age: {char.age || ''}</div>
</div>
```

Key changes:
- **Row 1**: Name (left) + AI/User badge (right) using `flex justify-between`
- **Row 2**: `Sex:` always shown, value blank if not set
- **Row 3**: `Age:` always shown, value blank if not set
- **Font size**: All metadata uses `text-xs` (12px) instead of `text-[10px]`
- Removed the conditional wrapper `{(char.sexType || char.age) &&` so labels always render

