

# Fix: Enable Editing of Bookmarked Scenarios via Automatic Cloning

## Problem Identified

When a user clicks "Edit" on a bookmarked (remixable) scenario, they can view the data but cannot save changes. The error occurs because:

1. The `handleEditScenario` function loads the **original scenario** with its original IDs
2. When the user tries to save (e.g., changing a character name), `saveScenario()` attempts to UPSERT with the original owner's IDs
3. RLS correctly blocks this because `user_id` doesn't match the current user

The user expects bookmarking to work like "downloading" - they should be able to freely edit their saved copy without affecting the original.

---

## Solution

Implement automatic cloning when editing a scenario that the user doesn't own. The system will:

1. **Detect ownership** when `handleEditScenario` is called
2. **If not owned**: Clone the scenario with new IDs (scenario, characters, codex entries, scenes) and set the current user as owner
3. **Track the remix** in the `remixed_scenarios` table for attribution
4. **All edits go to the clone** - the original remains untouched

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/services/supabase-data.ts` | Add `cloneScenarioForRemix()` function that creates a full copy with new IDs |
| `src/pages/Index.tsx` | Update `handleEditScenario()` to detect ownership and trigger cloning when needed |

---

## Technical Implementation

### 1. Add `cloneScenarioForRemix()` to supabase-data.ts

```typescript
export async function cloneScenarioForRemix(
  originalScenarioId: string,
  newScenarioId: string,
  userId: string,
  originalData: ScenarioData,
  originalCoverImage: string,
  originalCoverPosition: { x: number; y: number }
): Promise<ScenarioData> {
  // Generate new IDs for all entities
  const characterIdMap = new Map<string, string>();
  const codexIdMap = new Map<string, string>();
  const sceneIdMap = new Map<string, string>();
  
  // Clone characters with new IDs
  const clonedCharacters = originalData.characters.map(char => {
    const newId = uuid();
    characterIdMap.set(char.id, newId);
    return { ...char, id: newId, createdAt: Date.now(), updatedAt: Date.now() };
  });
  
  // Clone codex entries with new IDs
  const clonedCodexEntries = originalData.world.entries.map(entry => {
    const newId = uuid();
    codexIdMap.set(entry.id, newId);
    return { ...entry, id: newId, createdAt: Date.now(), updatedAt: Date.now() };
  });
  
  // Clone scenes with new IDs
  const clonedScenes = originalData.scenes.map(scene => {
    const newId = uuid();
    sceneIdMap.set(scene.id, newId);
    return { ...scene, id: newId, createdAt: Date.now() };
  });
  
  // Build cloned data (without conversations - start fresh)
  const clonedData: ScenarioData = {
    ...originalData,
    characters: clonedCharacters,
    world: {
      ...originalData.world,
      entries: clonedCodexEntries
    },
    scenes: clonedScenes,
    conversations: [], // Start fresh for remixes
    sideCharacters: []
  };
  
  // Save the cloned scenario
  const metadata = {
    title: originalData.world.core.scenarioName || 'Remixed Scenario',
    description: originalData.world.core.briefDescription || '',
    coverImage: originalCoverImage,
    coverImagePosition: originalCoverPosition,
    tags: ['Remix']
  };
  
  await saveScenario(newScenarioId, clonedData, metadata, userId);
  
  return clonedData;
}

// Helper to check scenario ownership
export async function getScenarioOwner(scenarioId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('scenarios')
    .select('user_id')
    .eq('id', scenarioId)
    .maybeSingle();
    
  if (error || !data) return null;
  return data.user_id;
}
```

### 2. Update `handleEditScenario()` in Index.tsx

```typescript
async function handleEditScenario(id: string) {
  try {
    const result = await supabaseData.fetchScenarioById(id);
    if (!result) {
      toast({ title: "Scenario not found", variant: "destructive" });
      return;
    }
    const { data, coverImage, coverImagePosition } = result;
    
    // Check if this is someone else's scenario
    const ownerId = await supabaseData.getScenarioOwner(id);
    const isOwnScenario = ownerId === user?.id;
    
    if (!isOwnScenario && user) {
      // This is a bookmarked/remixed scenario - create a clone
      const newScenarioId = uuid();
      
      toast({ 
        title: "Creating your copy...", 
        description: "You'll be editing your own version of this story." 
      });
      
      const clonedData = await supabaseData.cloneScenarioForRemix(
        id,
        newScenarioId,
        user.id,
        data,
        coverImage,
        coverImagePosition
      );
      
      // Track the remix for attribution
      const savedScenario = savedScenarios.find(s => s.source_scenario_id === id);
      if (savedScenario?.published_scenario_id) {
        await trackRemix(savedScenario.published_scenario_id, newScenarioId, user.id);
      }
      
      // Refresh registry to show the new clone
      const updatedRegistry = await supabaseData.fetchMyScenarios(user.id);
      setRegistry(updatedRegistry);
      
      // Switch to editing the CLONE
      setActiveId(newScenarioId);
      setActiveData(clonedData);
      setActiveCoverImage(coverImage);
      setActiveCoverPosition(coverImagePosition);
      
      toast({ 
        title: "Your copy is ready!", 
        description: "Edit freely - your changes won't affect the original." 
      });
    } else {
      // Own scenario - edit directly
      setActiveId(id);
      setActiveData(data);
      setActiveCoverImage(coverImage);
      setActiveCoverPosition(coverImagePosition);
    }
    
    setTab("world");
    setSelectedCharacterId(null);
    setPlayingConversationId(null);
  } catch (e: any) {
    toast({ title: "Failed to edit scenario", description: e.message, variant: "destructive" });
  }
}
```

---

## Data Flow After Fix

```
User clicks "Edit" on bookmarked story
            ↓
handleEditScenario(originalId)
            ↓
Fetch original scenario data (RLS allows SELECT)
            ↓
Check ownership: ownerId !== user.id
            ↓
Generate new UUIDs for everything
            ↓
cloneScenarioForRemix() → Creates copy in DB
            ↓
Track remix for attribution
            ↓
activeId = newScenarioId (the clone)
            ↓
User edits the CLONE freely
            ↓
All saves work (user owns the clone)
```

---

## Security & UX Considerations

1. **Original content is NEVER modified** - The clone has completely new IDs
2. **Attribution preserved** - The `remixed_scenarios` table links the clone to the original
3. **User feedback** - Toast messages explain what's happening
4. **Clone appears in "My Stories"** - After cloning, it shows in their registry
5. **Fresh start for conversations** - Clones don't copy previous play sessions

---

## Edge Cases Handled

| Case | Behavior |
|------|----------|
| User edits their own scenario | Direct edit (no clone) |
| User edits bookmarked scenario | Auto-clone on first edit |
| User clicks Edit again on same bookmarked story | Creates another clone (or we could detect existing clone) |
| Scenario has no cover image | Clone inherits empty cover |

---

## Result

After this fix:
- Clicking "Edit" on a bookmarked story creates YOUR personal copy
- You can change character names, traits, world settings - anything
- The original creator's content is never touched
- Your remixed version appears in "My Stories"
- All saves work without RLS errors

