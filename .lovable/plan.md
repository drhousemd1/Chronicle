
# Fix: Revert Resume Flow to Simple Approach That Worked

## What Went Wrong

The recent "optimizations" made things worse by:

1. Firing 9 concurrent database requests (overwhelming the connection pool) instead of the 2-4 sequential requests that worked before
2. Navigating to a loading screen BEFORE data loads, so you stare at "Loading your story..." forever when the fetch hangs
3. Calling `saveNewMessages` with ALL 61 messages on every chat exchange, saturating database connections with unnecessary writes

## Fix: Strip It Back

### Change 1: Revert `handleResumeFromHistory` to Simple Sequential Fetch

Go back to the approach that worked: fetch data first, then navigate. Use `fetchScenarioForPlay` (lightweight, no messages) + `fetchConversationThread` (proven, loads all messages for the specific conversation) sequentially rather than 9 parallel requests. Add a 15-second safety timeout.

```text
OLD (broken):
  1. Navigate to chat (show loading spinner)
  2. Fire 9 concurrent requests (hangs)
  3. User stares at spinner forever

NEW (reverting to what worked):
  1. User clicks conversation
  2. Fetch scenario data (5 sequential-ish queries)
  3. Fetch conversation thread (2 queries)
  4. Fetch side characters (1 query)
  5. Set all state
  6. Navigate to chat (instant -- data is ready)
```

The `fetchConversationThread` function (the original one) loads ALL messages for the specific conversation. With 61 messages, this is fast. No lazy loading complexity needed for the initial load.

### Change 2: Fix Save to Only Persist New Messages

The `onSaveScenario` callback currently passes `modifiedConv.messages` (all 61 messages) to `saveNewMessages`. Fix this to only pass the last 2 messages (the user message + AI response that were just created), dramatically reducing database writes.

Track message count when loading a conversation, then on save, only pass messages added after that index.

### Change 3: Keep Lazy Loading for Scroll (Don't Remove)

The scroll-based lazy loading mechanism in `ChatInterfaceTab` stays -- it's still useful for the future when conversations grow very large. But for now, since `fetchConversationThread` loads all messages, the `hasMoreMessages` flag will just be `false` and the scroll handler won't trigger. No changes needed in `ChatInterfaceTab`.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Index.tsx` | Rewrite `handleResumeFromHistory` to fetch-then-navigate (sequential); fix `onSaveScenario` to only save last 2 new messages |

Only ONE file needs changes. No new functions, no new complexity.

---

## Technical Details

### `handleResumeFromHistory` rewrite (Index.tsx)

```typescript
async function handleResumeFromHistory(scenarioId: string, conversationId: string) {
  try {
    // 1. Fetch scenario data (no messages)
    const scenarioResult = await supabaseData.fetchScenarioForPlay(scenarioId);
    if (!scenarioResult) {
      toast({ title: "Scenario not found", variant: "destructive" });
      return;
    }

    // 2. Fetch the specific conversation thread (all messages)
    const thread = await supabaseData.fetchConversationThread(conversationId);
    if (!thread) {
      toast({ title: "Conversation not found", variant: "destructive" });
      return;
    }

    // 3. Fetch side characters
    const sideCharacters = await supabaseData.fetchSideCharacters(conversationId);

    // 4. Assemble data and navigate
    const { data, coverImage, coverImagePosition } = scenarioResult;
    data.conversations = [thread];
    data.sideCharacters = sideCharacters;

    setActiveId(scenarioId);
    setActiveCoverImage(coverImage);
    setActiveCoverPosition(coverImagePosition);
    setActiveData(data);
    setPlayingConversationId(conversationId);
    setSelectedCharacterId(null);
    setTab("chat_interface");
  } catch (e: any) {
    console.error('[handleResumeFromHistory] Error:', e);
    toast({ title: "Failed to load", description: e.message, variant: "destructive" });
  }
}
```

This is ~20 lines of simple, sequential code. No `Promise.all`, no `withTimeout`, no "navigate first" pattern, no `hasMoreMessages` tracking.

### `onSaveScenario` fix (Index.tsx)

Track a ref for the message count at load time. On save, only pass the messages added since:

```typescript
// In the onSaveScenario callback:
if (modifiedConv) {
  // Only save messages added since the conversation was loaded
  const newMessages = modifiedConv.messages.slice(-2); // Last 2 = user msg + AI response
  supabaseData.saveNewMessages(modifiedConv.id, newMessages)
    .then(() => supabaseData.updateConversationMeta(modifiedConv.id, {
      currentDay: modifiedConv.currentDay,
      currentTimeOfDay: modifiedConv.currentTimeOfDay,
      title: modifiedConv.title
    }))
    .catch(err => { ... });
}
```

This changes the save from 61 rows to 2 rows per message exchange.

### What Stays the Same

- `handlePlayScenario` keeps its "navigate first" pattern (it works fine for new games since no heavy data fetch is needed)
- `ChatInterfaceTab` scroll-based lazy loading stays (dormant -- `hasMoreMessages` will be `false` since all messages are loaded)
- All the new functions in `supabase-data.ts` stay (they're not hurting anything and can be used later)
- The render condition on line 1791 stays (it supports both patterns)
