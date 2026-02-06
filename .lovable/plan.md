

# Fix Button Styling and Collapsed Goals View

## Summary

Two fixes needed:
1. Change "+ Character Library" button from slate blue to dark surface styling (matching Cancel button)
2. Update Character Goals collapsed view to match other sections' format with proper labels and text colors

---

## Files to Modify

- `src/pages/Index.tsx` - Button styling fix
- `src/components/chronicle/CharacterGoalsSection.tsx` - Collapsed view redesign

---

## Technical Changes

### 1. Fix "+ Character Library" Button Styling

**Location:** `src/pages/Index.tsx` (lines 1537-1554)

**Current styling:**
```tsx
className="flex h-10 px-6 items-center justify-center gap-2
  rounded-xl border border-[#5a6f8f] 
  bg-[#4a5f7f] shadow-[0_10px_30px_rgba(0,0,0,0.35)]
  text-white ..."
```

**Updated styling (matching Cancel button):**
```tsx
className="flex h-10 px-6 items-center justify-center gap-2
  rounded-xl border border-[hsl(var(--ui-border))] 
  bg-[hsl(var(--ui-surface-2))] shadow-[0_10px_30px_rgba(0,0,0,0.35)]
  text-[hsl(var(--ui-text))] text-[10px] font-bold leading-none uppercase tracking-wider
  hover:bg-white/5 active:bg-white/10 disabled:opacity-50
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20
  transition-colors"
```

---

### 2. Redesign CollapsedGoalsView Component

**Location:** `src/components/chronicle/CharacterGoalsSection.tsx` (lines 237-261)

**Current implementation:**
- Only shows goal title and progress bar
- Text is `text-zinc-200` (bright white)
- No field labels for Desired Outcome or Current Status Summary

**Updated implementation:**
Match the pattern from `CollapsedFieldRow` in CharactersTab:
- Show each goal with three labeled fields vertically stacked
- Labels: "Goal Name", "Desired Outcome", "Current Status Summary"
- Label styling: `text-[10px] font-bold text-zinc-500 uppercase tracking-widest`
- Value styling: `text-sm text-zinc-400`
- For Current Status Summary: show "None" if empty (instead of hiding)
- Add `space-y-4` between goals for separation

**New CollapsedGoalsView structure:**

```tsx
const CollapsedGoalsView = () => {
  if (goals.length === 0) {
    return <p className="text-zinc-500 text-sm italic">No goals defined</p>;
  }
  return (
    <div className="space-y-6">
      {goals.map((goal) => (
        <div key={goal.id} className="space-y-4">
          {/* Goal Name */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">
              Goal Name
            </span>
            <p className="text-sm text-zinc-400">
              {goal.title || 'Untitled goal'}
            </p>
          </div>
          
          {/* Desired Outcome - only show if has value */}
          {goal.desiredOutcome && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">
                Desired Outcome
              </span>
              <p className="text-sm text-zinc-400">
                {goal.desiredOutcome}
              </p>
            </div>
          )}
          
          {/* Current Status Summary - show "None" if empty */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">
              Current Status Summary
            </span>
            <p className="text-sm text-zinc-400">
              {goal.currentStatus || 'None'}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
```

---

## Summary of Changes

| Element | Current | Updated |
|---------|---------|---------|
| + Character Library button | Slate blue bg (`#4a5f7f`) | Dark surface (`ui-surface-2`) matching Cancel |
| Collapsed Goals - Labels | None (only title shown) | Proper labels: "Goal Name", "Desired Outcome", "Current Status Summary" |
| Collapsed Goals - Text color | Bright (`text-zinc-200`) | Muted (`text-zinc-400`) matching other sections |
| Collapsed Goals - Label color | N/A | `text-zinc-500` matching other sections |
| Collapsed Goals - Empty status | Hidden | Shows "None" placeholder |

