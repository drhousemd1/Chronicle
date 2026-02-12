

# Fix: Guidance Strength Slider Alignment

## Problems
1. Circles not vertically centered on the gradient bar
2. Labels ("RIGID", "NORMAL", "FLEXIBLE") too far from the bar -- they look attached to the hint box
3. Hint box has side padding creating unused space

## Solution

Rewrite the slider section of `GuidanceStrengthSlider.tsx` to match the mockup's approach:

### Track + Dots
Use the mockup's pattern: a container with `flex items-center` and `h-8`, with the gradient track as an absolute background, and dots overlaid via a second absolute `flex justify-between` div. This naturally centers everything vertically.

```tsx
{/* Slider track */}
<div className="relative flex items-center h-8">
  {/* Gradient track */}
  <div className="absolute w-full h-2.5 rounded-full"
    style={{ background: 'linear-gradient(to right, #1a2a4a, #2563eb, #60a5fa)' }}
  />
  {/* Dot positions */}
  <div className="absolute inset-0 flex items-center justify-between">
    {LEVELS.map((level, idx) => {
      const isActive = activeIdx === idx;
      return (
        <button key={level.value} type="button" onClick={() => onChange(level.value)} ...>
          {isActive ? (
            <div className="w-[18px] h-[18px] rounded-full bg-white border-2 border-blue-500 shadow-lg shadow-blue-500/30" />
          ) : (
            <div className="w-[14px] h-[14px] rounded-full border-2 border-zinc-500 bg-zinc-800" />
          )}
        </button>
      );
    })}
  </div>
</div>
```

This is exactly how the mockup positions dots -- `justify-between` puts them at 0%, 50%, 100% and `items-center` keeps them on the bar.

### Labels closer to bar
Remove the `pb-6` spacer and reduce gap. Change outer `space-y-3` to `space-y-2`. Labels div gets `mt-1` instead of being separated by the large padding.

### Hint box wider
Change `px-4` to `px-5` and `rounded-xl` to `rounded-lg` to match mockup. Add `mt-2` for small gap from labels.

## File Changed

| File | Change |
|------|--------|
| `src/components/chronicle/GuidanceStrengthSlider.tsx` | Rewrite slider track to use flex-based centering matching mockup; tighten label spacing; widen hint box |

Single file fix -- this component is shared across all goal sections.

