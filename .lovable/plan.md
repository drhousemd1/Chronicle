
# Add Persistent Save Button to Guide Editor

## What's Happening Now
The Guide Editor has a save button, but it only appears after you start typing (when there are unsaved changes). It also uses a small blue button style that doesn't match the rest of the app.

## What We'll Change

### File: `src/components/admin/guide/GuideEditor.tsx`

Replace the conditional save button in the title bar with a persistent "Save" button that:
- Is always visible when a document is open
- Uses the app's standard button style (rounded-xl, shadow surface, uppercase tracking)
- Is disabled when there are no unsaved changes (grayed out)
- Shows "Saving..." text while saving is in progress
- Includes the Save icon

The button style will match what's used throughout the rest of the app:
```
inline-flex items-center justify-center h-10 px-6 rounded-xl
border border-[hsl(var(--ui-border))]
bg-[hsl(var(--ui-surface-2))]
text-[hsl(var(--ui-text))]
shadow-[0_10px_30px_rgba(0,0,0,0.35)]
hover:brightness-125 active:brightness-150
text-[10px] font-bold leading-none uppercase tracking-wider
disabled:opacity-50 disabled:pointer-events-none
```

### Technical Details

In the title bar section of `GuideEditor.tsx` (around lines 152-170), replace the current conditional save button:

```tsx
// Current: only shows when hasUnsaved is true, small blue style
{hasUnsaved && (
  <button onClick={handleSave} className="px-3 py-1 bg-blue-600 ...">
    <Save /> Save
  </button>
)}
```

With:

```tsx
// New: always visible, standard app style, disabled when no changes
<button
  onClick={handleSave}
  disabled={!hasUnsaved || isSaving}
  className="inline-flex items-center justify-center h-10 px-6 rounded-xl border border-[hsl(var(--ui-border))] bg-[hsl(var(--ui-surface-2))] text-[hsl(var(--ui-text))] shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:brightness-125 active:brightness-150 transition-all active:scale-95 text-[10px] font-bold leading-none uppercase tracking-wider disabled:opacity-50 disabled:pointer-events-none"
>
  <Save className="w-3.5 h-3.5" />
  {isSaving ? 'Saving...' : 'Save'}
</button>
```

We'll also add an `isSaving` state variable to show loading feedback during saves, consistent with how save buttons work elsewhere in the app.

Only one file changes: `GuideEditor.tsx`.
