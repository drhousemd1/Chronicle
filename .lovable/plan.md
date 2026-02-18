

# Fix: Save Button Color on iPad

## Problem

On iPad (and touch devices generally), the CSS `:active` pseudo-class gets "stuck" after a tap. The save buttons use `active:bg-white/10` which overrides the dark `bg-[hsl(var(--ui-surface-2))]` background. Combined with `disabled:opacity-50`, this makes the button appear bright white with near-invisible light text while in the "Saving..." state.

## The Fix

Remove `hover:bg-white/5` and `active:bg-white/10` from the disabled state, and add explicit disabled styling that keeps the dark surface color. Apply this to all three save buttons.

The key change: add `disabled:bg-[hsl(var(--ui-surface-2))]` to force the dark background when disabled, and `disabled:hover:bg-[hsl(var(--ui-surface-2))]` / `disabled:active:bg-[hsl(var(--ui-surface-2))]` to override any stuck hover/active states on touch devices.

Also add `disabled:pointer-events-none` so that touch interactions can't trigger hover/active states while the button is disabled.

## Technical Details

### File: `src/pages/Index.tsx`

**Three buttons to update:**

1. **Scenario Builder "Save and Close"** (line 1494) -- add `disabled:pointer-events-none` (already has `disabled:opacity-50`)

2. **Scenario Builder "Save"** (line 1508) -- same change

3. **Character Builder "Save"** (line 1624-1630) -- same change

All three buttons already have `disabled:opacity-50`. Adding `disabled:pointer-events-none` prevents the stuck `:active` state entirely because the browser won't register touch/mouse events on a disabled+pointer-events-none element.

The className for the Scenario Builder buttons (lines 1494, 1508) changes from:
```
...transition-all active:scale-95 text-[10px] font-bold leading-none uppercase tracking-wider disabled:opacity-50
```
to:
```
...transition-all active:scale-95 text-[10px] font-bold leading-none uppercase tracking-wider disabled:opacity-50 disabled:pointer-events-none disabled:active:bg-transparent
```

The Character Builder button (line 1628) changes from:
```
hover:bg-white/5 active:bg-white/10 disabled:opacity-50
```
to:
```
hover:bg-white/5 active:bg-white/10 disabled:opacity-50 disabled:pointer-events-none disabled:active:bg-transparent
```

## Files Modified
| File | Change |
|---|---|
| `src/pages/Index.tsx` | Add `disabled:pointer-events-none disabled:active:bg-transparent` to all 3 save buttons |
