

# Fix Blank White Screen on Story Start/Resume

## Root Cause Found

The blank white screen is caused by a **render gap** in Index.tsx.

When the user clicks "Play" or "Resume", the code immediately sets `tab = "chat_interface"`, but the ChatInterfaceTab render condition on line 1791 requires ALL of these to be truthy:

```
tab === "chat_interface" && activeId && activeData && playingConversationId
```

The problem is that `activeData` remains `null` during the fetch. Since no tab condition matches, **the entire main content area renders nothing** -- a blank white screen. The loading skeleton inside ChatInterfaceTab never shows because the component itself is never mounted.

This is the timeline of what happens:

```text
1. User clicks "Play"
2. setActiveId(id)               -- activeId = "abc-123"
3. setPlayingConversationId("loading")  -- set
4. setTab("chat_interface")      -- tab switches
5. RENDER: tab=chat_interface, activeId=set, activeData=NULL, convId="loading"
   --> Condition fails because activeData is null
   --> BLANK WHITE SCREEN
6. ...fetch runs for 5-60 seconds...
7. setActiveData(data)           -- finally set
8. RENDER: everything truthy now --> ChatInterfaceTab renders
```

## Fix

Remove `activeData` from the outer render gate. The ChatInterfaceTab already handles the `conversationId === "loading"` state internally with a spinner. The component just needs to mount so it can show that spinner.

### Changes

**File: `src/pages/Index.tsx`**

Change the render condition from:
```
{tab === "chat_interface" && activeId && activeData && playingConversationId && (
```
to:
```
{tab === "chat_interface" && activeId && playingConversationId && (
```

Then inside the ChatInterfaceTab props, pass `activeData` with a fallback empty state so the component can render its loading UI without crashing on null access:

```
appData={activeData || emptyScenarioData}
```

Where `emptyScenarioData` is a minimal stub:
```typescript
const emptyScenarioData: ScenarioData = {
  version: 3,
  characters: [],
  sideCharacters: [],
  world: { core: { ... }, entries: [] },
  story: { openingDialog: { enabled: false, text: '', startingDay: 1, startingTimeOfDay: 'day' } },
  scenes: [],
  uiSettings: { showBackgrounds: true, transparentBubbles: false, darkMode: false },
  conversations: [],
  selectedModel: '',
  selectedArtStyle: ''
};
```

The ChatInterfaceTab already has this early return for the loading state (line 837):
```
if (conversationId === "loading" || (!conversation && conversationId !== "loading")) {
  return <loading spinner>;
}
```

So once it mounts, it will immediately show the loading spinner while data fetches in the background.

### Secondary Fix: Save Performance

The `onSaveScenario` callback has a compounding performance problem:

1. Line 1807: `saveNewMessages(modifiedConv.id, modifiedConv.messages)` sends ALL messages (could be 60+), not just the 1-2 new ones
2. Line 1827: `handleSaveWithData(...)` triggers a FULL scenario save (upserts scenario, characters, codex, scenes) plus refreshes the entire registry and syncs characters to library -- all on every single chat message

Fix: Remove the `handleSaveWithData` call from the chat save path. The incremental `saveNewMessages` + `updateConversationMeta` is sufficient for normal chat. The full save is only needed when leaving the scenario builder.

---

## Summary of Changes

| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Remove `activeData` from the chat_interface render condition; pass fallback empty data; remove the `handleSaveWithData` call from the chat save callback |

## Technical Details

The fix is exactly 3 small edits in one file:

1. Add an `emptyScenarioData` constant (or use `createDefaultScenarioData()` which already exists in utils.ts)
2. Change line 1791 render condition to not require `activeData`
3. Pass `activeData || emptyScenarioData` as the `appData` prop
4. Remove line 1827 (`handleSaveWithData(...)`) from the `onSaveScenario` callback -- the `saveNewMessages` + `updateConversationMeta` on lines 1807-1815 already handles persistence correctly

