

# Fix: Textarea Bottom Padding (Actual Root Cause)

## The Real Problem

The `textarea` element is inline by default in browsers. Inline elements sit on the text baseline, leaving a few pixels of gap below for text descenders (letters like g, y, p). This gap sits between the textarea and the wrapper's bottom padding, making it look thicker at the bottom. The outer `p-2` is technically uniform, but the browser's baseline rendering adds invisible space below the textarea.

Every previous attempt changed the wrong thing (rows, min-height, padding values). None addressed the inline baseline gap.

## Fix

**File:** `src/components/chronicle/ChatInterfaceTab.tsx`

### 1. Add `block` to the textarea className (line 3147)
This eliminates the baseline gap. One word fixes the actual problem.

### 2. Revert previous incorrect changes
- Change `rows={1}` back to `rows={3}` (line 3144) -- the textarea was shrunk incorrectly over multiple attempts
- Remove `min-h-[2.5rem]` from the className (line 3147) -- this was added as a workaround for the wrong fix

### Result
The textarea className becomes:
```
block w-full bg-[#1e2028] text-white placeholder-[hsl(var(--ui-text-muted))] rounded-xl px-4 py-3 text-sm outline-none border-0 resize-none overflow-hidden focus:ring-1 focus:ring-[hsl(var(--accent-teal))]/30 transition-all
```

And `rows={3}` is restored so the input area returns to a comfortable typing size.

The wrapper's `p-2` padding will now be visually uniform on all four sides because the baseline gap is gone.

