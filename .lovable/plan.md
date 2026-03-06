
I re-traced this specifically for the “5 minutes keeps becoming 10” symptom (not the countdown behavior itself), and the likely issue is an interval-state overwrite + invalid countdown restore.

## What is actually wrong

1. `time_progression_interval` and `time_remaining` can become inconsistent (example now in DB: interval=5, remaining=550s), which makes the UI look like a 10-minute timer even when 5 is selected.
2. `ChatInterfaceTab` still updates conversations from `appData.conversations` snapshots in timer-related paths, so stale values can be reintroduced during day/time transitions.
3. `Index.tsx` generic chat save path still writes `timeProgressionInterval`/`timeProgressionMode` from whichever conversation snapshot it receives, which can overwrite the latest setting.

## Implementation plan

### 1) Stop generic chat-save from overwriting timer settings (`src/pages/Index.tsx`)
- In `onSaveScenario` metadata patch, remove:
  - `timeProgressionMode`
  - `timeProgressionInterval`
- Keep that path for message/title/day/time only.
- Timer settings remain owned by direct conversation-meta updates from chat settings.

### 2) Make timer settings path authoritative and atomic (`src/components/chronicle/ChatInterfaceTab.tsx`)
- In `handleTimeProgressionChange`:
  - Immediately sync refs (`timeProgressionIntervalRef`, `timeRemainingRef`) before async work.
  - Include `timeRemaining` in local conversation patch (`onUpdate`) so in-memory state matches persisted state.
  - Persist via `updateConversationMeta` only for mode/interval/timeRemaining.

### 3) Prevent stale interval reintroduction on day/time ticks (`ChatInterfaceTab.tsx`)
- In `handleDayTimeChange`, when updating local conversation array, explicitly preserve current timer config from refs/state (not from stale `...c` snapshot).
- Keep direct `updateConversationMeta` for day/time.
- Do not let this path re-save old interval values through stale payloads.

### 4) Normalize bad restored countdown values (`ChatInterfaceTab.tsx`)
- On conversation load/sync, compute `maxSeconds = interval * 60`.
- If persisted `timeRemaining > maxSeconds`, clamp it to `maxSeconds` and persist corrected value once.
- This removes “looks like 10-minute countdown” when interval is 5.

## Why this targets your exact bug
- It removes the overwrite path that can silently flip interval data.
- It repairs already-corrupted countdown state (e.g., 09:43 while interval=5).
- It keeps the countdown behavior itself intact while making the interval value stable.

## Verification steps after patch
1. Set Automatic + 5 minutes.
2. Let it cross multiple phase transitions (sunrise/day/sunset/night).
3. Leave browser in background/overlapped, return, confirm it still respects 5-minute window.
4. Refresh and resume from history; confirm both dropdown value and countdown are consistent with 5 minutes.
