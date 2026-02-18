

# Fix: Remove White Overlay States From Save Buttons

## Problem

On iPad, the CSS `:active` pseudo-class persists after a tap. The previous fix only addressed the disabled state (`disabled:active:bg-transparent`), but once the save completes and the button is re-enabled, `active:bg-white/10` kicks back in -- making the button appear white with white text.

## The Fix

Remove `hover:bg-white/5` and `active:bg-white/10` from all three save buttons entirely. Replace with surface-color-based hover/active states that maintain readability on all devices.

## Technical Details

### File: `src/pages/Index.tsx`

**All three save buttons** -- replace the white overlay classes:

Remove:
- `hover:bg-white/5`
- `active:bg-white/10`
- `disabled:active:bg-transparent` (no longer needed)

Replace with:
- `hover:brightness-125`
- `active:brightness-150`

This uses CSS `brightness` filter instead of white overlays. The button lightens slightly on hover/active but never turns white. Works identically on desktop and touch devices, and the `:active` state getting stuck on iPad is harmless since it just makes the button slightly brighter rather than turning it white.

**Buttons affected:**
1. Scenario Builder "Save and Close" (line ~1494)
2. Scenario Builder "Save" (line ~1508)
3. Character Builder "Save" (line ~1628)

The className changes from:
```
...hover:bg-white/5 active:bg-white/10 ...disabled:active:bg-transparent
```
to:
```
...hover:brightness-125 active:brightness-150
```

## Files Modified
| File | Change |
|---|---|
| `src/pages/Index.tsx` | Replace `hover:bg-white/5 active:bg-white/10` with `hover:brightness-125 active:brightness-150` on all 3 save buttons |

