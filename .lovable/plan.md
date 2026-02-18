

# Fix: Character Library Button White on iPad

## Problem

The "Save to Character Library" button still uses `hover:bg-white/5 active:bg-white/10`, the same classes that caused the white-on-white issue on the other save buttons. It also lacks `disabled:pointer-events-none`.

## The Fix

Apply the identical fix already applied to the other three save buttons.

## Technical Details

### File: `src/pages/Index.tsx` (line 1661)

Change:
```
hover:bg-white/5 active:bg-white/10 disabled:opacity-50
```

To:
```
hover:brightness-125 active:brightness-150 disabled:opacity-50 disabled:pointer-events-none
```

## Files Modified
| File | Change |
|---|---|
| `src/pages/Index.tsx` | Replace white overlay classes with brightness filters on the Character Library button (line 1661) |

