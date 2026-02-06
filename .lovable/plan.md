

# Auto-Save for Scenario Builder Navigation

## Summary

Implement automatic saving of the scenario builder state when the user navigates away (to Hub, Gallery, Character Library, etc.) without manually clicking "Save Scenario". This prevents data loss that occurs when users forget to save before navigating.

---

## Problem Analysis

Currently when users navigate between scenario builder sections:
1. **WorldTab to CharactersTab**: Data persists in React state - works correctly
2. **CharactersTab to WorldTab**: Data persists - works correctly  
3. **Scenario Builder to Hub/Gallery/etc.**: `setActiveId(null)` clears all unsaved work

The sidebar navigation items (Hub, Gallery, Character Library, Image Library) all call `setActiveId(null)` which discards unsaved `activeData`.

---

## Proposed Solution

**Implement auto-save before navigation** - When navigating away from the scenario builder (world/characters tabs), automatically trigger a save operation before clearing the active scenario data.

---

## Technical Changes

### File to Modify: `src/pages/Index.tsx`

### 1. Create a Navigation Handler with Auto-Save

Create a new function that handles navigation with optional auto-save:

```typescript
const handleNavigateAway = useCallback(async (
  targetTab: TabKey | "library",
  clearActiveData: boolean = true
) => {
  // If we're in the scenario builder with unsaved data, auto-save first
  if (activeId && activeData && (tab === "world" || tab === "characters")) {
    try {
      await handleSaveWithData(activeData, false); // Save without navigating to hub
    } catch (e) {
      console.error("Auto-save failed:", e);
      // Continue with navigation even if save fails - user has manual save option
    }
  }
  
  // Now perform the navigation
  if (clearActiveData) {
    setActiveId(null);
    setActiveData(null);
  }
  setSelectedCharacterId(null);
  setPlayingConversationId(null);
  setTab(targetTab);
}, [activeId, activeData, tab, handleSaveWithData]);
```

### 2. Update Sidebar Navigation Items

Update the sidebar onClick handlers to use the new auto-save navigation:

**Current (lines 1183-1186):**
```tsx
<SidebarItem ... onClick={() => { setActiveId(null); setTab("gallery"); setPlayingConversationId(null); }} />
<SidebarItem ... onClick={() => { setActiveId(null); setTab("hub"); setPlayingConversationId(null); }} />
<SidebarItem ... onClick={() => { setActiveId(null); setTab("library"); setSelectedCharacterId(null); setPlayingConversationId(null); }} />
<SidebarItem ... onClick={() => { setActiveId(null); setTab("image_library"); setPlayingConversationId(null); }} />
```

**Updated:**
```tsx
<SidebarItem ... onClick={() => handleNavigateAway("gallery")} />
<SidebarItem ... onClick={() => handleNavigateAway("hub")} />
<SidebarItem ... onClick={() => handleNavigateAway("library")} />
<SidebarItem ... onClick={() => handleNavigateAway("image_library")} />
```

### 3. Optional: Add Visual Feedback

Show a brief toast notification when auto-save occurs:

```typescript
const handleNavigateAway = useCallback(async (...) => {
  if (activeId && activeData && (tab === "world" || tab === "characters")) {
    try {
      await handleSaveWithData(activeData, false);
      toast({ title: "Draft saved", description: "Your changes have been saved." });
    } catch (e) {
      console.error("Auto-save failed:", e);
      toast({ 
        title: "Auto-save failed", 
        description: "Your draft may not have been saved.", 
        variant: "destructive" 
      });
    }
  }
  // ... navigation logic
}, [...]);
```

---

## Alternative: Add a Header Save Button

If preferred over auto-save, we could add a prominent "Save" button to the Scenario Builder header (in addition to the sidebar save button):

**Location:** Lines 1289-1309 (header section for world/characters tabs)

```tsx
{(tab === "world" || tab === "characters") && (
  <div className="flex items-center gap-3">
    {/* ... existing back button logic ... */}
    <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">
      Scenario Builder
    </h1>
  </div>
)}

{/* Add header save button when in scenario builder */}
{(tab === "world" || tab === "characters") && activeId && (
  <Button 
    variant="primary" 
    onClick={() => handleSave(false)}
    disabled={isSaving}
    className="ml-auto"
  >
    {isSaving ? "Saving..." : "Save Draft"}
  </Button>
)}
```

---

## Recommended Approach

**Implement auto-save** as the primary solution because:
1. It prevents accidental data loss without requiring user action
2. The save operation is already fast (existing `handleSaveWithData` function)
3. Users don't need to remember to click a button
4. The "Save Scenario" button in the sidebar already exists for explicit saves

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Index.tsx` | Add `handleNavigateAway` function, update sidebar navigation onClick handlers |

---

## Implementation Order

1. Add the `handleNavigateAway` callback function (after `handleSaveWithData` around line 718)
2. Update the four sidebar navigation items to use the new handler (lines 1183-1186)
3. Test navigation from scenario builder to hub, gallery, character library, and image library
4. Verify that scenario data is persisted correctly after navigating away and back

