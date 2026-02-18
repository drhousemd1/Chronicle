

# Fix: Save Button Hang + Cover Image Touch Repositioning + Remove Toasts

## Three issues to fix in this update:

### 1. Save buttons stay stuck in "Saving..."

**Root cause**: In `handleSaveWithData` (Index.tsx lines 722-727), two registry refresh calls run without any timeout:
```
await supabaseData.fetchMyScenarios(user.id);
await supabaseData.fetchConversationRegistry();
```

The `withTimeout` helper already exists in the same file and is used during initial data load, but these post-save calls bypass it. If the network is slow, the save itself succeeds but these refreshes hang indefinitely, keeping `isSaving` true and the button grayed out.

**Fix**: Wrap both calls in `withTimeout` (10s), falling back to the current state values so the UI stays consistent even if the refresh times out.

### 2. Cover image repositioning broken on iPad (WorldTab.tsx)

The cover image container in `WorldTab.tsx` only has mouse event handlers (`onMouseDown`, `onMouseMove`, `onMouseUp`, `onMouseLeave`). No touch handlers exist, so iPad users can't reposition the cover image -- the page scrolls instead.

**Fix**: Add `handleCoverTouchStart`, `handleCoverTouchMove`, `handleCoverTouchEnd` handlers (mirroring the mouse handlers but using `e.touches[0]`), attach them to the cover container div, and add `touch-action: none` when repositioning is active. This mirrors the fix already applied to `CharactersTab.tsx`.

### 3. Remove toast notifications from save buttons

Three toast calls were added in the last edit that need to be removed:
- Scenario Builder "Save and Close" button (line 1490)
- Scenario Builder "Save" button (line 1504)
- Character Builder "Save" button (line 1620)

Each has `if (success) toast({ title: "Saved!" });` that will be removed.

## Technical Details

### File: `src/pages/Index.tsx`

**Save button hang fix** (lines 722-727):
```tsx
// Before
const updatedRegistry = await supabaseData.fetchMyScenarios(user.id);
setRegistry(updatedRegistry);
const updatedConvRegistry = await supabaseData.fetchConversationRegistry();
setConversationRegistry(updatedConvRegistry);

// After
const updatedRegistry = await withTimeout(
  supabaseData.fetchMyScenarios(user.id), 10000, registry, 'fetchMyScenarios'
);
setRegistry(updatedRegistry);
const updatedConvRegistry = await withTimeout(
  supabaseData.fetchConversationRegistry(), 10000, conversationRegistry, 'fetchConversationRegistry'
);
setConversationRegistry(updatedConvRegistry);
```

**Remove toasts** from three save button `onClick` handlers -- delete the `if (success) toast(...)` lines at lines 1490, 1504, and 1620.

### File: `src/components/chronicle/WorldTab.tsx`

**Add touch handlers** after `handleCoverMouseUp` (line 236):
```tsx
const handleCoverTouchStart = (e: React.TouchEvent) => {
  if (!isRepositioningCover) return;
  e.preventDefault();
  const touch = e.touches[0];
  setCoverDragStart({
    x: touch.clientX,
    y: touch.clientY,
    pos: coverImagePosition || { x: 50, y: 50 }
  });
};

const handleCoverTouchMove = useCallback((e: React.TouchEvent) => {
  if (!coverDragStart || !coverContainerRef.current) return;
  e.preventDefault();
  const touch = e.touches[0];
  const rect = coverContainerRef.current.getBoundingClientRect();
  const deltaX = ((touch.clientX - coverDragStart.x) / rect.width) * 100;
  const deltaY = ((touch.clientY - coverDragStart.y) / rect.height) * 100;
  onUpdateCoverPosition({
    x: clamp(coverDragStart.pos.x - deltaX, 0, 100),
    y: clamp(coverDragStart.pos.y - deltaY, 0, 100)
  });
}, [coverDragStart, onUpdateCoverPosition]);

const handleCoverTouchEnd = () => {
  setCoverDragStart(null);
};
```

**Attach to cover container div** (line 420):
```tsx
onTouchStart={handleCoverTouchStart}
onTouchMove={handleCoverTouchMove}
onTouchEnd={handleCoverTouchEnd}
style={isRepositioningCover ? { touchAction: 'none' } : undefined}
```

## Files Modified
| File | Change |
|---|---|
| `src/pages/Index.tsx` | Wrap post-save fetches in `withTimeout`; remove 3 toast calls |
| `src/components/chronicle/WorldTab.tsx` | Add touch event handlers for cover image repositioning |
