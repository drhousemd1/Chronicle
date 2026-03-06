

## Plan: Fix Automatic Time Progression Persistence Bugs

### Root Cause Analysis

I traced through the full data flow and found two interacting bugs:

**Bug 1 — Stale closure in the auto-advance timer.** The timer `useEffect` (line 904) captures `handleDayTimeChange` in its closure. `handleDayTimeChange` reads `appData.conversations` from the render when the effect was created. When the timer fires, it calls `handleDayTimeChange` which spreads `...c` from a potentially stale `appData.conversations` — this can write back an older `timeProgressionInterval` value, overwriting the user's change.

**Bug 2 — Indirect save path for settings changes.** `handleTimeProgressionChange` saves settings by going through `onSaveScenario`, which chains: `saveNewMessages().then(updateConversationMeta())`. This indirection means:
- The save depends on message-saving succeeding first
- Race conditions between rapid `onSaveScenario` calls can cause earlier calls to overwrite later ones

### Changes (single file: `ChatInterfaceTab.tsx`)

**1. Direct DB persist for time progression settings.**
In `handleTimeProgressionChange`, add a direct `supabaseData.updateConversationMeta()` call that immediately persists `timeProgressionMode`, `timeProgressionInterval`, and `timeRemaining` to the database — bypassing the message-chained save path entirely.

**2. Direct DB persist for auto-advance time changes.**
In `handleDayTimeChange`, add a direct `supabaseData.updateConversationMeta()` call for `currentDay` and `currentTimeOfDay`. This eliminates the stale closure problem because the function only passes the explicit day/time values received as arguments, not values read from a potentially stale `appData`.

**3. Use refs for timer-critical values.**
Add `timeProgressionIntervalRef` and keep it synced with state. Use the ref inside the timer's `setTimeRemaining` callback (line 923: `return timeProgressionIntervalRef.current * 60`) so the reset always uses the latest interval, regardless of when the effect closure was created.

### What stays the same
- The `onUpdate` + `onSaveScenario` calls remain for local state consistency
- The visibility API pause/resume logic is unaffected
- The sync effect on `[conversation?.id]` for initial load stays as-is
- All existing timer behavior (TIME_SEQUENCE cycling, day advancement) unchanged

