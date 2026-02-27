

# Fix Plan: Scenario Builder Auto-Fill + Chat Sidebar Character Clipping

## Issue 1: Scenario Builder Pre-Fills With Active Story Data

### Problem
When you're in the chat interface playing a story, the sidebar "Scenario Builder" button runs: `if (activeId) setTab("world")`. Since `activeData` is already populated from the playing scenario, the builder renders with that story's full data. This is wrong for end users playing someone else's story — they'd see/edit data that isn't theirs.

### Root Cause
In `src/pages/Index.tsx` (line 1471-1474), the Scenario Builder sidebar click handler:
```
onClick={() => {
  if (activeId) setTab("world");
  else handleCreateNewScenario();
}}
```
When coming from the chat interface, `activeId` is still set to the playing scenario's ID. The builder blindly shows whatever `activeData` is loaded.

### Fix
When clicking the Scenario Builder sidebar button while a conversation is playing (`playingConversationId` is set), treat it as a fresh scenario creation rather than editing the playing story's data. The click handler will be updated to:
- If currently playing a conversation, call `handleCreateNewScenario()` (fresh blank builder)
- Otherwise, if `activeId` exists, navigate to `world` tab (existing behavior for editing own scenarios)
- Otherwise, create new scenario

This ensures the builder is always fresh unless the user explicitly clicked "Edit" on a tile card from the hub.

**File:** `src/pages/Index.tsx` (lines 1471-1474)

---

## Issue 2: Chat Sidebar Character Cards Clipped / No Scrolling

### Problem
The chat sidebar shows only ~2.75 character cards when there are 4+ main characters. The third card is cut off and there's no way to scroll to see the fourth.

### Root Cause
In `src/components/chronicle/ChatInterfaceTab.tsx`, the sidebar content container (line 3001) is `flex-1 flex flex-col p-4 gap-4 overflow-hidden`. Inside it:
- The Day/Time panel is `flex-shrink-0` (fixed height)
- The Main Characters section (line 3054) is `flex-shrink-0` with a `ScrollableSection maxHeight="400px"`
- The Side Characters section (line 3087) is `flex-1`

The problem is that `flex-shrink-0` on the Main Characters section prevents it from shrinking when space is tight. Combined with the Day/Time panel and the Side Characters header, the 400px max-height exceeds available space, causing clipping since the parent has `overflow-hidden`.

### Fix
Two changes:
1. Remove `flex-shrink-0` from the Main Characters section so it can shrink when needed.
2. Change the parent container (line 3001) from `overflow-hidden` to `overflow-y-auto` so the entire sidebar content area becomes scrollable when content exceeds viewport height. This way all character cards are always reachable.

Alternatively, reduce the Main Characters `ScrollableSection maxHeight` from `400px` to a more responsive value and ensure the parent allows scrolling.

**File:** `src/components/chronicle/ChatInterfaceTab.tsx` (lines 3001, 3054)

---

## Summary of Changes

| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Update Scenario Builder sidebar click handler to not reuse playing scenario data |
| `src/components/chronicle/ChatInterfaceTab.tsx` | Fix sidebar layout so all character cards are visible and scrollable |

No database changes. No edge function changes.
