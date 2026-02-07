

# Fix: App Stuck on Loading Screen

## Root Cause

The loading screen is NOT caused by the CharacterEditModal changes. Those are type-safe and only render when a modal is open (not during initial load).

The real culprit is `fetchConversationRegistry()` in `src/services/supabase-data.ts` (lines 713-763). This function:

1. Fetches all conversations in one query (fine)
2. Then loops through EACH conversation and makes **2 more queries per conversation**:
   - A HEAD request to count messages
   - A GET request to fetch ALL messages just to get the last one

With many conversations, this creates dozens of sequential network requests that can hang or timeout, preventing `loadData()` from completing and leaving `isLoading` stuck at `true`.

## The Fix

Replace the N+1 loop in `fetchConversationRegistry` with a single efficient query approach:

### File: `src/services/supabase-data.ts`

**Replace the current `fetchConversationRegistry` function** (lines 713-763) with one that:

1. Fetches all conversations with their scenario data in one query (already does this)
2. Instead of looping and making 2 queries per conversation, fetches message counts and last messages in batch:
   - Use a single RPC or just skip the per-conversation message fetching during initial load
   - Set `messageCount: 0` and `lastMessage: ''` as defaults
   - Lazy-load the message preview data only when the Conversations tab is actually viewed

This eliminates the N+1 query bottleneck entirely.

### Additional Safety: Add a timeout wrapper

Wrap the `loadData()` Promise.all in Index.tsx with a per-function timeout so that if any single function takes too long, it fails gracefully instead of hanging forever.

## Files to Modify

| File | Change |
|------|--------|
| `src/services/supabase-data.ts` | Replace N+1 loop in `fetchConversationRegistry` with batch approach or deferred loading |
| `src/pages/Index.tsx` | Add error resilience to `loadData()` so individual failures don't block the entire app |

## What This Does NOT Change

- No changes to CharacterEditModal, ChatInterfaceTab, or the extraction system
- No changes to the goals wiring or AI Update button
- The previous patch's changes are preserved as-is

