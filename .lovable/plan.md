

# Fix Plan: Toggle, Personality Layout, and Slider

## Fix 1: Switch Toggle Colors

**Problem:** The Switch component uses CSS variable colors (`bg-primary` when on, `bg-input` when off) which render as white-on-white in the dark theme.

**Solution:** Override the Switch colors inline where it's used in `PersonalitySection.tsx` via className. Use `#60A5FA` (blue-400, same blue used for "+ Add Trait" button text) for the checked state and a dark background for unchecked.

**File: `src/components/chronicle/PersonalitySection.tsx` (line 226-228)**
- Add className to the Switch: `className="data-[state=unchecked]:bg-zinc-700 data-[state=checked]:bg-[#60A5FA]"`
- This ensures: Off = white thumb on dark zinc background, On = white thumb on blue background

This className approach keeps the base Switch component untouched (it's used elsewhere) and only overrides in the Personality context.

---

## Fix 2: Personality Trait Input Layout

**Problem:** The `AutoResizeTextarea` component concatenates `w-full` (from its base class) with the passed `w-1/3` className using plain string concatenation instead of `cn()`/`twMerge`. Since both set `width`, Tailwind's CSS cascade makes the result unpredictable -- the label textarea ends up taking too much space and the description textarea gets squeezed to a few pixels wide, causing vertical letter stacking.

**Solution:** Change `AutoResizeTextarea` to use `cn()` for merging class names, so `w-1/3` properly overrides `w-full`.

**File: `src/components/chronicle/PersonalitySection.tsx` (line 64)**

Change:
```tsx
className={`w-full min-w-0 resize-none overflow-hidden whitespace-pre-wrap break-words ${className}`}
```
To:
```tsx
className={cn("w-full min-w-0 resize-none overflow-hidden whitespace-pre-wrap break-words", className)}
```

This ensures `w-1/3` properly overrides `w-full` via Tailwind Merge, giving the label 1/3 width and the description the remaining space.

---

## Fix 3: Guidance Strength Slider Positioning

**Problem:** The current slider uses three equal `flex-1` zones, placing thumbs at the CENTER of each third (roughly 16%, 50%, 83%). But the mockup shows: Rigid at the LEFT edge, Normal at CENTER, Flexible at the RIGHT edge (0%, 50%, 100%).

**Solution:** Replace the flex-zone approach with absolute-positioned thumb dots at fixed percentages (0%, 50%, 100%). Show all three dot positions as small circles, with the active one being larger and highlighted.

**File: `src/components/chronicle/GuidanceStrengthSlider.tsx` (lines 36-59)**

Replace the slider track section with:
- A gradient track bar (keep existing)
- Three absolutely-positioned clickable dots at `left: 0%`, `left: 50%`, `left: 100%`
- Inactive dots: small outlined circles (matching mockup image 5 which shows hollow circles at endpoints)
- Active dot: larger filled white circle with blue border and glow (matching current active style)

```tsx
{/* Slider track */}
<div className="relative pt-2 pb-1">
  <div className="h-2.5 rounded-full overflow-hidden"
    style={{ background: 'linear-gradient(to right, #1a2a4a, #2563eb, #60a5fa)' }}
  />
  {/* Thumb positions at 0%, 50%, 100% */}
  {LEVELS.map((level, idx) => {
    const leftPercent = idx === 0 ? '0%' : idx === 1 ? '50%' : '100%';
    const isActive = activeIdx === idx;
    return (
      <button
        key={level.value}
        type="button"
        onClick={() => onChange(level.value)}
        className="absolute top-1/2 -translate-y-1/2 mt-[1px]"
        style={{ left: leftPercent, transform: `translateX(-50%) translateY(-50%)` }}
        aria-label={level.label}
      >
        {isActive ? (
          <div className="w-5 h-5 rounded-full bg-white border-2 border-blue-500 shadow-lg shadow-blue-500/30" />
        ) : (
          <div className="w-3.5 h-3.5 rounded-full border-2 border-zinc-500 bg-zinc-800" />
        )}
      </button>
    );
  })}
</div>
```

---

## Files Changed

| File | Changes |
|------|---------|
| `src/components/chronicle/PersonalitySection.tsx` | Use `cn()` in AutoResizeTextarea; add Switch color overrides |
| `src/components/chronicle/GuidanceStrengthSlider.tsx` | Rewrite thumb positioning to use absolute 0%/50%/100% with inactive dot indicators |

Both components are shared -- PersonalitySection is used in CharactersTab and CharacterEditModal; GuidanceStrengthSlider is used in CharacterGoalsSection and StoryGoalsSection. Fixing these two files covers all locations.

