
# Fix: Touch Repositioning + Save Button State Bugs

## Issue 1: Image Repositioning Doesn't Work on iPad/Touch Devices

The avatar repositioning in `CharactersTab.tsx` only uses mouse events (`onMouseDown`, `onMouseMove`, `onMouseUp`, `onMouseLeave`). Touch devices (iPad) fire touch events, not mouse events, so the drag never starts. The page scrolls instead because the browser's default touch behavior isn't prevented.

**Fix**: Add `onTouchStart`, `onTouchMove`, `onTouchEnd` handlers to the avatar container that mirror the mouse handlers but use `e.touches[0]` for coordinates. Also call `e.preventDefault()` on `touchMove` when repositioning is active to prevent page scrolling.

### File: `src/components/chronicle/CharactersTab.tsx`

Add three new handlers:
```tsx
const handleTouchStart = (e: React.TouchEvent) => {
  if (!isRepositioning || !selected) return;
  e.preventDefault();
  const touch = e.touches[0];
  setDragStart({
    x: touch.clientX,
    y: touch.clientY,
    pos: selected.avatarPosition || { x: 50, y: 50 }
  });
};

const handleTouchMove = useCallback((e: React.TouchEvent) => {
  if (!dragStart || !selected || !avatarContainerRef.current) return;
  e.preventDefault();
  const touch = e.touches[0];
  const rect = avatarContainerRef.current.getBoundingClientRect();
  const deltaX = ((touch.clientX - dragStart.x) / rect.width) * 100;
  const deltaY = ((touch.clientY - dragStart.y) / rect.height) * 100;
  onUpdate(selected.id, {
    avatarPosition: {
      x: clamp(dragStart.pos.x - deltaX, 0, 100),
      y: clamp(dragStart.pos.y - deltaY, 0, 100)
    }
  });
}, [dragStart, selected, onUpdate]);

const handleTouchEnd = () => {
  setDragStart(null);
};
```

Add these to the avatar container div (line ~591):
```tsx
onTouchStart={handleTouchStart}
onTouchMove={handleTouchMove}
onTouchEnd={handleTouchEnd}
```

Also add `touch-action: none` CSS to the container when repositioning is active, to prevent the browser from intercepting the touch for scrolling:
```tsx
style={isRepositioning ? { touchAction: 'none' } : undefined}
```

---

## Issue 2: Save Buttons Stay in "Saving..." / Don't Show Feedback

Two separate locations have this issue:

### A. Character Builder Save Button (line ~1608-1621)
The "Save" button on the character builder page calls `handleSave(false)` directly without wrapping it in `setIsSaving(true)` / `finally { setIsSaving(false) }`. So:
- It never shows "Saving..." text (the `isSaving` state is never set to true)
- If `handleSave` throws, there's no error recovery

**Fix**: Wrap in async with proper state management, matching the pattern used by the Scenario Builder buttons above:
```tsx
onClick={async () => {
  setIsSaving(true);
  try { await handleSave(false); } finally { setIsSaving(false); }
}}
```

### B. Scenario Builder Save/Save-and-Close Buttons (lines ~1485-1505)
These buttons DO correctly set `isSaving`/`isSavingAndClosing`, but the `handleSaveWithData` function has an empty `finally {}` block (line 748-749). The function itself looks correct -- it returns true/false and shouldn't hang. However, if there's a network timeout or an unhandled error in the registry refresh calls (`fetchMyScenarios`, `fetchConversationRegistry`), the `try` block would throw and the buttons would remain disabled because the state is set in the button's `onClick`, not inside `handleSaveWithData`.

The button-level `finally` blocks should handle this correctly, but let me also add a toast success message after save completes so the user gets clear feedback that it worked:
```tsx
onClick={async () => {
  setIsSaving(true);
  try {
    const success = await handleSave(false);
    if (success) toast({ title: "Saved!" });
  } finally { setIsSaving(false); }
}}
```

Same pattern for "Save and Close".

## Files Modified
| File | Change |
|---|---|
| `src/components/chronicle/CharactersTab.tsx` | Add touch event handlers for avatar repositioning |
| `src/pages/Index.tsx` | Fix Character Builder save button state management; add toast feedback to Scenario Builder save buttons |
