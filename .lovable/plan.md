

# Restore Progress Indicator in Collapsed Goals View

## Summary

Add back the progress indicator to the collapsed view of the Character Goals section. The progress bar was accidentally removed when redesigning the collapsed view to match the labeled field format.

---

## File to Modify

`src/components/chronicle/CharacterGoalsSection.tsx`

---

## Technical Changes

### Update CollapsedGoalsView (Lines 236-280)

Add a grid layout to display the labeled fields on the left and a compact progress ring on the right for each goal.

**Current structure:**
```tsx
<div className="space-y-6">
  {goals.map((goal) => (
    <div key={goal.id} className="space-y-4">
      {/* Goal Name, Desired Outcome, Current Status Summary */}
    </div>
  ))}
</div>
```

**Updated structure:**
```tsx
<div className="space-y-6">
  {goals.map((goal) => (
    <div key={goal.id} className="grid grid-cols-12 gap-4">
      {/* Left side - Labels and values (col-span-9) */}
      <div className="col-span-9 space-y-4">
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
      
      {/* Right side - Progress Ring (col-span-3) */}
      <div className="col-span-3 flex items-start justify-center pt-2">
        <CircularProgress 
          value={goal.progress} 
          size={64} 
          strokeWidth={5} 
          variant="dark" 
        />
      </div>
    </div>
  ))}
</div>
```

### Add Import for CircularProgress

Add the import at the top of the file:
```tsx
import { CircularProgress } from './CircularProgress';
```

---

## Visual Result

The collapsed goals view will now show:
- **Left side (75% width)**: Labeled fields for Goal Name, Desired Outcome, and Current Status Summary
- **Right side (25% width)**: Compact circular progress indicator (64x64 size) showing the goal's progress percentage

This restores the progress visibility while maintaining the new labeled field format that matches other sections.

