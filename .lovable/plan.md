

## Add Play/Pause Toggle for Auto-Timer

### What
Add a play/pause button to the left of the countdown timer. When the timer is running, it shows a "Play" icon (indicating active). Clicking it pauses the timer and switches to a "Pause" icon. Clicking again resumes.

### How

**File: `src/components/chronicle/ChatInterfaceTab.tsx`**

1. **New state**: Add `isTimerPaused` boolean state (default `false`). Reset to `false` when switching conversations or toggling mode.

2. **Timer effect** (line ~916): Add `isTimerPaused` to the guard — skip `setInterval` when paused:
   ```ts
   if (timeProgressionMode !== 'automatic' || isTimerPaused) return;
   ```

3. **UI** (lines 3295-3299): Add a clickable icon button to the left of the countdown span:
   ```tsx
   {timeProgressionMode === 'automatic' && (
     <div className="flex items-center gap-1">
       <button
         onClick={() => setIsTimerPaused(prev => !prev)}
         className="p-0.5 rounded hover:bg-black/30 transition-colors"
       >
         {isTimerPaused
           ? <Play className="w-3.5 h-3.5 text-white fill-white" />
           : <Pause className="w-3.5 h-3.5 text-white" />}
       </button>
       <span className="bg-black/50 rounded-md px-2 py-0.5 text-xs font-mono text-white">
         {formatCountdown(timeRemaining)}
       </span>
     </div>
   )}
   ```

4. **Imports**: Add `Play, Pause` to the lucide-react import.

5. **Reset on mode change**: In `handleTimeProgressionChange`, set `isTimerPaused(false)`.

6. **Persist on unmount**: No change needed — existing `saveTimeRemaining` already persists `timeRemainingRef.current`, so pausing mid-countdown preserves the correct remaining time.

