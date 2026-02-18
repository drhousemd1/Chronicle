

# Fix: Save Button Stuck + Remove Toasts

## Root Cause

The "Save" button stays stuck because `handleSaveWithData` awaits **everything sequentially** before returning:

1. `saveScenario()` -- up to 10 sequential Supabase API calls (upsert scenario, fetch existing chars, delete removed chars, upsert chars, same for codex, same for scenes)
2. `withTimeout(fetchMyScenarios(...), 10000, ...)` -- up to 10s
3. `withTimeout(fetchConversationRegistry(), 10000, ...)` -- up to 10s

The button's `finally { setIsSaving(false) }` only runs after ALL of this resolves. On a slow connection (especially iPad over WiFi), the total wait can be 20-30+ seconds or hang indefinitely if any Supabase call never resolves.

"Save and Close" appears to work because it navigates to the hub tab after save, so the stuck button disappears from view. The underlying hang is the same for both.

## The Fix

Make the registry refreshes **fire-and-forget** after the save completes. The save has already succeeded at that point -- the registry refresh is just a UI convenience to keep the scenario hub list up to date. There's no reason to block the button on it.

### File: `src/pages/Index.tsx`

**Change lines 721-731** from awaited calls to fire-and-forget:

```tsx
// Before (blocks button until refresh completes or times out):
const updatedRegistry = await withTimeout(
  supabaseData.fetchMyScenarios(user.id), 10000, registry, 'fetchMyScenarios'
);
setRegistry(updatedRegistry);
const updatedConvRegistry = await withTimeout(
  supabaseData.fetchConversationRegistry(), 10000, conversationRegistry, 'fetchConversationRegistry'
);
setConversationRegistry(updatedConvRegistry);

// After (fire-and-forget -- button resets immediately after save):
supabaseData.fetchMyScenarios(user.id)
  .then(r => setRegistry(r))
  .catch(e => console.warn('Registry refresh failed:', e));
supabaseData.fetchConversationRegistry()
  .then(r => setConversationRegistry(r))
  .catch(e => console.warn('Conversation registry refresh failed:', e));
```

**Remove toasts** from all three save button onClick handlers (lines 1490, 1504, 1620) -- these were already removed in the last diff but confirming they stay removed.

## Result

After save completes (the actual database writes), `handleSaveWithData` returns immediately. The button's `finally` runs right away, resetting the "Saving..." state. Registry data refreshes in the background without blocking the UI.

## Files Modified
| File | Change |
|---|---|
| `src/pages/Index.tsx` | Make post-save registry refreshes fire-and-forget instead of awaited |

