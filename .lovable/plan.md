

# Fix: Deleting Bookmarked Scenarios from Your Stories Tab

## Problem Identified

When a user tries to delete a bookmarked story from the "Bookmarked" section:

1. The delete confirmation popup appears and user clicks OK
2. `handleDeleteScenario(id)` is called with the **original scenario's ID** (not the user's own)
3. This calls `supabaseData.deleteScenario(id)` which tries to delete from the `scenarios` table
4. RLS correctly blocks deletion since the user doesn't own the original scenario
5. The operation fails silently - the story remains in the list

**Root Cause**: The delete handler doesn't distinguish between owned scenarios and bookmarked (saved) scenarios. For bookmarked scenarios, it should remove the entry from `saved_scenarios` table, not try to delete the original scenario.

---

## Solution

Modify `handleDeleteScenario` to check if the scenario being deleted is a bookmarked scenario (owned by someone else). If so, remove it from `saved_scenarios` instead of trying to delete the original scenario.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Index.tsx` | Update `handleDeleteScenario()` to detect bookmarked scenarios and call `unsaveScenario()` instead |

---

## Technical Implementation

### Update `handleDeleteScenario()` in Index.tsx

```typescript
async function handleDeleteScenario(id: string) {
  // Check if this is a bookmarked scenario (not owned by user)
  const savedScenario = savedScenarios.find(s => s.source_scenario_id === id);
  const isBookmarked = savedScenario && !registry.some(r => r.id === id);
  
  if (isBookmarked) {
    // This is a bookmarked scenario - ask to remove from collection
    if (!confirm("Remove this story from your bookmarks?")) return;
    
    try {
      await unsaveScenario(savedScenario.published_scenario_id, user!.id);
      
      // Refresh saved scenarios
      const savedScens = await fetchSavedScenarios(user!.id);
      setSavedScenarios(savedScens);
      
      toast({ title: "Removed from bookmarks" });
    } catch (e: any) {
      toast({ title: "Failed to remove bookmark", description: e.message, variant: "destructive" });
    }
  } else {
    // This is the user's own scenario - delete it entirely
    if (!confirm("Delete this entire scenario? This cannot be undone.")) return;
    
    try {
      await supabaseData.deleteScenario(id);
      const updatedRegistry = await supabaseData.fetchMyScenarios(user!.id);
      setRegistry(updatedRegistry);
      
      const updatedConvRegistry = await supabaseData.fetchConversationRegistry();
      setConversationRegistry(updatedConvRegistry);
      
      if (activeId === id) {
        setActiveId(null);
        setActiveData(null);
        setSelectedCharacterId(null);
        setPlayingConversationId(null);
        setTab("hub");
      }
    } catch (e: any) {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    }
  }
}
```

---

## Data Flow After Fix

```
User clicks Delete on bookmarked story
            |
handleDeleteScenario(id)
            |
Check: Is this in savedScenarios but NOT in registry?
            |
     +------+------+
     |             |
   Yes (Bookmarked)   No (Own Scenario)
     |             |
"Remove from bookmarks?"  "Delete this scenario?"
     |             |
unsaveScenario()   deleteScenario()
     |             |
Refresh savedScenarios  Refresh registry
     |             |
Card disappears    Card disappears
```

---

## Import Addition

Add `unsaveScenario` to the imports from `gallery-data.ts`:

```typescript
import { fetchSavedScenarios, SavedScenario, unsaveScenario } from "@/services/gallery-data";
```

---

## Edge Cases Handled

| Case | Behavior |
|------|----------|
| Delete own scenario | Full deletion from `scenarios` table |
| Delete bookmarked scenario | Removes from `saved_scenarios` table only |
| Scenario exists in both (remixed) | Treated as own scenario since it's in registry |
| Cancel confirmation | No action taken |

---

## Result

After this fix:
- Deleting a bookmarked story removes it from the user's saved collection
- The original creator's content is never affected
- Different confirmation message for bookmarks vs owned scenarios
- Success toast confirms the action
- The card immediately disappears from the bookmarked list

