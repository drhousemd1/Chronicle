

# Automatic Time Progression — Implementation Plan

This feature adds automatic time-of-day advancement on a configurable timer to the chat interface, with scenario-level defaults set in the Scenario Builder.

---

## Phase 1: Database Migration

Add two columns to the `conversations` table:

```sql
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS time_progression_mode text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS time_progression_interval integer NOT NULL DEFAULT 15;
```

No migration needed for `stories` — the `opening_dialog` column is already JSONB, so we just add new fields to the `OpeningDialog` TypeScript type and they'll persist automatically.

---

## Phase 2: Type Updates — `src/types.ts`

Add new type and extend two existing types:

```typescript
export type TimeProgressionMode = 'manual' | 'automatic';
```

Add to `Conversation`:
- `timeProgressionMode?: TimeProgressionMode`
- `timeProgressionInterval?: number`

Add to `OpeningDialog`:
- `timeProgressionMode?: TimeProgressionMode`
- `timeProgressionInterval?: number`

---

## Phase 3: Data Layer — `src/services/supabase-data.ts`

**`dbToConversation`** (line 269): Add mapping:
```typescript
timeProgressionMode: row.time_progression_mode || 'manual',
timeProgressionInterval: row.time_progression_interval || 15,
```

**`saveConversation`** (line 1009): Add to upsert payload:
```typescript
time_progression_mode: conversation.timeProgressionMode || 'manual',
time_progression_interval: conversation.timeProgressionInterval || 15,
```

**`fetchScenarioForPlay`** (line 435-441): Add to `OpeningDialog` parsing:
```typescript
timeProgressionMode: rawOpeningDialog?.timeProgressionMode ?? 'manual',
timeProgressionInterval: rawOpeningDialog?.timeProgressionInterval ?? 15,
```

Same for the other `openingDialog` construction at line 362-367.

---

## Phase 4: Scenario Builder — `src/components/chronicle/WorldTab.tsx`

Between the time phase buttons row (line ~970) and the HintBox (line ~973), insert:

1. **A new row** containing:
   - Label "Mode:" in `text-[10px] font-black text-zinc-400 uppercase tracking-widest`
   - A segmented toggle matching ArcModeToggle styling (`bg-zinc-900/50 rounded-lg border border-white/10`, two buttons "Manual" / "Automatic" with active state `bg-zinc-700 text-blue-400`)
   - When "Automatic" selected: an "Interval:" label + `<select>` dropdown with options 10/15/30/60 minutes, styled to match existing WorldTab selects (`bg-zinc-900/50 border-zinc-700 rounded-lg text-sm text-white`)

2. Wire to existing `onUpdateOpening` callback:
   ```typescript
   onUpdateOpening({ timeProgressionMode: mode })
   onUpdateOpening({ timeProgressionInterval: interval })
   ```

State is initialized from `openingDialog.timeProgressionMode ?? 'manual'` and `openingDialog.timeProgressionInterval ?? 15`.

---

## Phase 5: Chat Interface — `src/components/chronicle/ChatInterfaceTab.tsx`

### 5A: New State Variables (after line ~316)

```typescript
const [timeProgressionMode, setTimeProgressionMode] = useState<'manual' | 'automatic'>('manual');
const [timeProgressionInterval, setTimeProgressionInterval] = useState<number>(15);
const [timeRemaining, setTimeRemaining] = useState<number>(15 * 60); // seconds
const [pausedAt, setPausedAt] = useState<number | null>(null);
```

### 5B: Initialize from Conversation (extend effect at line ~863)

```typescript
setTimeProgressionMode((conversation as any).timeProgressionMode || 'manual');
setTimeProgressionInterval((conversation as any).timeProgressionInterval || 15);
setTimeRemaining(((conversation as any).timeProgressionInterval || 15) * 60);
```

### 5C: Auto-Advance Timer useEffect

```typescript
const TIME_SEQUENCE: TimeOfDay[] = ['sunrise', 'day', 'sunset', 'night'];

useEffect(() => {
  if (timeProgressionMode !== 'automatic') return;
  const tick = setInterval(() => {
    setTimeRemaining(prev => {
      if (prev <= 1) {
        // Advance time
        const currentIndex = TIME_SEQUENCE.indexOf(currentTimeOfDay);
        const nextIndex = (currentIndex + 1) % TIME_SEQUENCE.length;
        const nextTime = TIME_SEQUENCE[nextIndex];
        if (nextIndex === 0) {
          // Night → Sunrise = new day
          const newDay = currentDay + 1;
          setCurrentDay(newDay);
          setCurrentTimeOfDay(nextTime);
          handleDayTimeChange(newDay, nextTime);
        } else {
          setCurrentTimeOfDay(nextTime);
          handleDayTimeChange(currentDay, nextTime);
        }
        return timeProgressionInterval * 60;
      }
      return prev - 1;
    });
  }, 1000);
  return () => clearInterval(tick);
}, [timeProgressionMode, timeProgressionInterval, currentTimeOfDay, currentDay]);
```

### 5D: Visibility API useEffect

```typescript
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.hidden) {
      setPausedAt(Date.now());
    } else if (pausedAt) {
      const elapsed = Math.floor((Date.now() - pausedAt) / 1000);
      setTimeRemaining(prev => Math.max(0, prev - elapsed));
      setPausedAt(null);
    }
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, [pausedAt]);
```

### 5E: Manual Override — Modify `selectTime` (line 2152)

Reset the countdown when user manually clicks a time button:
```typescript
const selectTime = (time: TimeOfDay) => {
  setCurrentTimeOfDay(time);
  handleDayTimeChange(currentDay, time);
  setTimeRemaining(timeProgressionInterval * 60); // reset timer
};
```

### 5F: Day/Time Widget Updates (line ~3147-3196)

Above the existing widget section, add:
```
┌─────────────────────────────────────────┐
│ Manual (or Automatic)  ⓘ     [13:40]  │ ← small label + info icon + countdown pill
│ ┌─────────────────────────────────────┐ │
│ │  DAY [1] ▲▼   ☀ ☀ 🌅 🌙          │ │ ← existing widget, unchanged
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

- Top-left: "Manual" or "Automatic" in `text-[9px] font-black uppercase tracking-widest` + Info icon with tooltip "Change time settings in Chat Settings"
- Top-right (automatic only): MM:SS countdown in `bg-black/50 rounded-md px-2 py-0.5 text-xs font-mono`

### 5G: Chat Settings Modal — New Section (after line ~3941)

Add after the AI Behavior section closing `</div>`:

```
── border-t border-white/10 ──
TIME PROGRESSION
"Automatically advance the time of day while in a chat session"

Time Mode:    [Manual ←→ Automatic] (LabeledToggle, offLabel="Manual" onLabel="Automatic")

(if Automatic):
Advance every: [▼ 15 minutes]  (select dropdown: 10, 15, 30, 60)
```

When changed, persist to conversation via extending `handleDayTimeChange` or a new save function that updates the conversations table directly.

---

## Phase 6: Session Initialization — `src/pages/Index.tsx`

In `handlePlayScenario` (line ~627-635), read time progression defaults from the scenario's opening dialog and pass them into the new conversation:

```typescript
const timeProgressionMode = data.story?.openingDialog?.timeProgressionMode || 'manual';
const timeProgressionInterval = data.story?.openingDialog?.timeProgressionInterval || 15;

const newConv: Conversation = { 
  ...existing fields...,
  timeProgressionMode,
  timeProgressionInterval,
};
```

---

## Files Modified

| File | Change |
|------|--------|
| DB migration | Add `time_progression_mode`, `time_progression_interval` to `conversations` |
| `src/types.ts` | Add `TimeProgressionMode` type, extend `Conversation` and `OpeningDialog` |
| `src/services/supabase-data.ts` | Extend `dbToConversation`, `saveConversation`, `openingDialog` parsing |
| `src/components/chronicle/WorldTab.tsx` | Add Mode toggle + Interval dropdown in Opening Dialog section |
| `src/components/chronicle/ChatInterfaceTab.tsx` | Add timer logic, settings section, widget updates |
| `src/pages/Index.tsx` | Pass time progression defaults when creating new conversations |

## What Stays Unchanged

- Day counter up/down arrows behavior and styling
- Time phase button icons and click behavior (except adding timer reset)
- How day/time values are passed into AI API calls
- All other WorldTab sections
- HintBox at the bottom of Opening Dialog section

