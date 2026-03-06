

## Plan: Persist Timer Remaining Across Navigation

### Problem
When the user navigates away from chat and returns, `timeRemaining` is reset to the full interval (line 875: `setTimeRemaining((conversation.timeProgressionInterval || 15) * 60)`). The remaining seconds are never saved to the database.

### Solution

**1. Add `time_remaining` column to `conversations` table** (migration)

```sql
ALTER TABLE public.conversations ADD COLUMN time_remaining integer DEFAULT NULL;
```

`NULL` means "use full interval" (backward-compatible with existing conversations).

**2. Save `timeRemaining` on navigation away** (`ChatInterfaceTab.tsx`)

Add a `beforeunload` + cleanup effect that writes the current `timeRemaining` to the DB when the component unmounts or the page is about to close. Use the existing `updateConversationMeta` function.

```tsx
// On unmount / navigation away, persist remaining time
useEffect(() => {
  return () => {
    if (timeProgressionMode === 'automatic' && conversationId) {
      supabaseData.updateConversationMeta(conversationId, { timeRemaining: timeRemainingRef.current });
    }
  };
}, [conversationId, timeProgressionMode]);
```

A `useRef` mirror of `timeRemaining` is needed since the cleanup function captures stale state. Add `timeRemainingRef` that syncs via a small effect.

Also add a `beforeunload` listener for hard page closes.

**3. Restore `timeRemaining` on load** (`ChatInterfaceTab.tsx`, line 875)

```tsx
setTimeRemaining(
  conversation.timeRemaining != null 
    ? conversation.timeRemaining 
    : (conversation.timeProgressionInterval || 15) * 60
);
```

**4. Expand `updateConversationMeta`** (`supabase-data.ts`)

Add `timeRemaining` to the patch type and map it to `time_remaining`.

**5. Map `time_remaining` in data loading** (`supabase-data.ts`)

Wherever conversations are loaded and mapped to the app's `Conversation` type, include `time_remaining` → `timeRemaining`.

**6. Update types** (`src/types.ts`)

Add `timeRemaining?: number` to the `Conversation` type.

**7. Documentation** — update known issues in chat guide.

### What this achieves
- Timer pauses on navigate-away, persists remaining seconds to DB
- On return, timer resumes from where it left off
- Works for all interval lengths (10, 15, 30, 60 min)
- Backward-compatible: existing conversations without `time_remaining` default to full interval

