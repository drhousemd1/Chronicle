

# Fix ArcModeToggle Spacing

## Problem
The Simple/Advanced toggle buttons lack horizontal padding, making the text appear cramped inside the container. The personality toggle already has `px-3.5` but the arc toggle only has `py-1.5`.

## Fix

### File: `src/components/chronicle/arc/ArcModeToggle.tsx`

Add `px-3.5` to both button class strings, changing from:
```
flex-1 py-1.5 text-[10px] ...
```
to:
```
flex-1 px-3.5 py-1.5 text-[10px] ...
```

This matches the personality toggle's button styling exactly.

| File | Change |
|------|--------|
| `src/components/chronicle/arc/ArcModeToggle.tsx` | Add `px-3.5` to both buttons |

