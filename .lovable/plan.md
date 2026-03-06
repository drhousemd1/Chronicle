

## Fix Pause/Play Icon Visibility by Time of Day

The pause/play icon next to the timer uses `text-white` which is invisible on light backgrounds (sunrise, day, sunset). It should be black for those three times and white only for night.

### Changes

**File: `src/components/chronicle/ChatInterfaceTab.tsx`** (lines 3304-3306)

Update the Play/Pause icon color to use `getTimeTextColor(currentTimeOfDay)` instead of hardcoded `text-white`:

```tsx
{isTimerPaused
  ? <Play className={`w-3.5 h-3.5 ${getTimeTextColor(currentTimeOfDay)} ${currentTimeOfDay !== 'night' ? 'fill-black' : 'fill-white'}`} />
  : <Pause className={`w-3.5 h-3.5 ${getTimeTextColor(currentTimeOfDay)}`} />}
```

This uses the existing `getTimeTextColor()` helper which returns `text-white` for night and `text-black` otherwise — already used for the AUTOMATIC/DAY/TIME labels.

