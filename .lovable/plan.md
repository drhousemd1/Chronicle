

# Update CharacterEditModal Header Title & Info Tooltip

## Color Verification

**Page header text color (verified)**:
- File: `src/pages/Index.tsx`, lines 1900, 1906, 1912, 1955, 1982, 1996, 2003
- Value: `text-[hsl(var(--ui-surface-2))]` (Graphite, hsl(228 7% 20%))
- Also: `font-black uppercase tracking-tight`
- Current CharacterEditModal (line 1054): `text-lg font-bold text-black` — wrong color, wrong weight, not uppercase

**Info icon pattern (verified)**:
- File: `src/components/chronicle/WorldTab.tsx`, line 1137
- Pattern: `<Info className="w-3.5 h-3.5 text-blue-500 cursor-help" />`
- Tooltip: `className="max-w-[300px] text-xs font-semibold leading-relaxed normal-case tracking-normal"`

## Changes — `src/components/chronicle/CharacterEditModal.tsx`

### Line 1054 — DialogTitle
Change from:
```
text-lg font-bold text-black
```
To:
```
text-lg font-black text-[hsl(var(--ui-surface-2))] uppercase tracking-tight
```

Update text content: `'Edit Character'` → `'EDIT CHARACTER'` (or rely on uppercase class).

### Lines 1057-1061 — Remove subtitle paragraph
Remove the `<p>` subtitle block entirely.

### Add Info icon with tooltip after the title
Add an `<Info>` icon next to the title with standard tooltip:
```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <Info className="w-3.5 h-3.5 text-blue-500 cursor-help" />
  </TooltipTrigger>
  <TooltipContent side="bottom" className="max-w-[300px] text-xs font-semibold leading-relaxed normal-case tracking-normal">
    Changes only apply to this playthrough and do not affect the creator's original story.
  </TooltipContent>
</Tooltip>
```

Ensure `Info` from `lucide-react` and `Tooltip/TooltipTrigger/TooltipContent` are imported.

### Also update "Scenario Card" text to uppercase
The ternary for `viewMode === 'character'` should output `'Edit Character'` / `'Scenario Card'` — the `uppercase` class handles casing.

### Files Changed
- `src/components/chronicle/CharacterEditModal.tsx`

