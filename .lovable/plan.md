

# Fix: Center "NORMAL" Label and Extend Hint Box

## Problem 1: "NORMAL" label not centered under its dot
The labels use `flex justify-between` which distributes three items at left, center, and right edges. But each label's text starts at its position rather than being centered on it. "RIGID" looks correct because it's left-aligned at the left edge, and "FLEXIBLE" looks correct because it's right-aligned at the right edge, but "NORMAL" appears shifted left because its text starts at center rather than being centered on center.

## Solution 1
Give each label explicit text alignment:
- RIGID (first): `text-left`
- NORMAL (middle): `text-center`
- FLEXIBLE (last): `text-right`

And make each label a `flex-1` item so they have equal widths to align with, rather than being auto-sized.

```tsx
<div className="flex mt-1">
  {LEVELS.map((level, idx) => (
    <span
      key={level.value}
      className={cn(
        "flex-1 text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer",
        idx === 0 ? "text-left" : idx === 1 ? "text-center" : "text-right",
        value === level.value ? "text-blue-400" : "text-zinc-600"
      )}
      onClick={() => onChange(level.value)}
    >
      {level.label}
    </span>
  ))}
</div>
```

## Problem 2: Hint box not full width
The hint box has internal padding (`px-5`) but the box itself doesn't extend to the container edges -- there's a visible gap on the right side.

## Solution 2
Remove the `mt-2` (the parent `space-y-2` already handles spacing) and ensure the box stretches properly with `w-full`.

## File Changed

| File | Change |
|------|--------|
| `src/components/chronicle/GuidanceStrengthSlider.tsx` | Fix label alignment with flex-1 + text alignment per position; ensure hint box is full width |

