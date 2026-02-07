

# Fix Session Resume and Add Scroll-Based Lazy Message Loading

## Problem

The current `handleResumeFromHistory` wraps `fetchScenarioForPlay` with a 15-second timeout. When the database is slow, this timeout fires and returns `null`, which triggers the "Scenario not found or timed out" toast and kicks the user back to the hub. Additionally, `fetchConversationThread` loads ALL messages at once, which is slow for long conversations. The save flow (`saveConversation`) also deletes and re-inserts all messages every time, which is destructive and slow.

## Solution

### 1. Navigate Immediately, Load in Background (Index.tsx)

Mirror the pattern already used by `handlePlayScenario` (line 468): immediately navigate to the chat tab with a `"loading"` skeleton state, then fetch data in the background. No timeout needed because the user already sees the chat UI. If the fetch fails, show a toast and navigate back.

### 2. Load Only Last 10 Messages Initially (supabase-data.ts)

Add a `fetchConversationThreadRecent(conversationId, limit=10)` function that fetches only the most recent N messages. This makes the initial resume nearly instant.

### 3. Scroll-Based Lazy Loading of Older Messages (ChatInterfaceTab.tsx)

When the user scrolls near the top of the chat, automatically fetch the next batch of older messages and prepend them. No loading indicators or banners -- just seamless prepending that preserves the user's scroll position. The scroll container's `onScroll` event checks if the user is near the top, and if so, triggers a fetch of the next 20 older messages.

### 4. Incremental Save (supabase-data.ts)

Add a `saveNewMessages(conversationId, messages)` function that uses `.upsert()` with `onConflict: 'id'` to only insert new messages. The existing `saveConversation` (delete-all + re-insert) is kept only for destructive operations like editing or deleting a message.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/services/supabase-data.ts` | Add `fetchConversationThreadRecent()`, `fetchOlderMessages()`, `saveNewMessages()` |
| `src/pages/Index.tsx` | Rewrite `handleResumeFromHistory` to navigate immediately then load in background; update save flow to use `saveNewMessages` for normal chat; add `loadOlderMessagesProgressively` helper |
| `src/components/chronicle/ChatInterfaceTab.tsx` | Add scroll-based lazy loading: detect scroll near top, call a new `onLoadOlderMessages` prop, prepend results while preserving scroll position |

---

## Technical Details

### New Functions in `supabase-data.ts`

**`fetchConversationThreadRecent(conversationId, limit = 10)`**
- Fetches conversation metadata + only the last N messages
- Uses `.order('created_at', { ascending: false }).limit(limit)` then reverses to chronological
- Returns `{ conversation, hasMore }` where `hasMore` indicates if there are older messages beyond the loaded batch

**`fetchOlderMessages(conversationId, beforeCreatedAt, limit = 20)`**
- Fetches a batch of messages created before a given ISO timestamp
- Uses `.lt('created_at', beforeCreatedAt).order('created_at', { ascending: false }).limit(limit)`
- Reverses to chronological order and maps to app `Message` types

**`saveNewMessages(conversationId, messages)`**
- Uses `.upsert(messages, { onConflict: 'id' })` to only insert/update new messages
- Much faster than delete-all + re-insert

### Updated `handleResumeFromHistory` in `Index.tsx`

```
1. setActiveId(scenarioId)
2. setPlayingConversationId("loading")  // shows loading skeleton immediately
3. setTab("chat_interface")             // navigate instantly
4. Background: fetch scenario + recent 10 messages + side chars in parallel
5. On success: set data + conversation, swap "loading" to real conversationId
6. On failure: toast error, navigate back to hub
7. If hasMore: start background progressive loading
```

### Scroll-Based Lazy Loading in `ChatInterfaceTab.tsx`

- Add a new prop `onLoadOlderMessages?: (conversationId: string, beforeCreatedAt: string) => Promise<Message[]>`
- Track `hasMoreMessages` and `isLoadingOlder` state
- On the existing `scrollRef` div, add an `onScroll` handler that checks if `scrollTop < 200` (near top)
- When triggered, call `onLoadOlderMessages`, prepend the returned messages to the conversation
- Preserve scroll position by measuring `scrollHeight` before and after prepend, then adjusting `scrollTop`
- Use a `useRef` flag to prevent concurrent fetches

### Save Flow Update in `Index.tsx`

In the `onSaveScenario` callback, replace the `saveConversation` call with `saveNewMessages` for normal chat operations. The full `saveConversation` is only needed when editing/deleting messages (which rewrites the conversation).

The `onSaveScenario` callback currently calls `saveConversation(modifiedConv, activeId, user.id)` which deletes ALL messages and re-inserts them. Change this to:
- Extract only the new messages (last 1-2 messages added since the last save)
- Call `saveNewMessages(conversationId, newMessages)` instead
- Also update conversation metadata (day, time) separately via upsert on the `conversations` table

### Auto-Scroll Behavior

The existing auto-scroll effect (`scrollRef.current.scrollTop = scrollRef.current.scrollHeight`) runs on `[conversation?.messages, streamingContent]`. When older messages are prepended, this would normally scroll to bottom. Fix by only auto-scrolling when the user is already near the bottom (within 100px), not when older messages are prepended at the top.

