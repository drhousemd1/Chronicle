

# Fix Save Button Placement, Styling, and Visibility

## What's Happening Now
The save button exists but has two problems:
1. It's buried inside the editor's internal 40px title bar, not in the main page header where buttons typically go in this app
2. It appears disabled/invisible most of the time because it only enables after typing -- there's no auto-save, so edits can be lost if you don't manually save

## What We'll Change

### 1. Add a proper page header to `AppGuideTool.tsx`
The App Guide currently renders as just a sidebar + editor with no page-level header. We'll add a header bar across the top (matching the pattern used elsewhere) that contains:
- A "Back" button (or the tool title) on the left
- The **Save** button on the right, using the standard Shadow Surface style

### 2. Move save responsibility up to `AppGuideTool.tsx`
- Add an `onSave` callback prop to `GuideEditor` so the parent can trigger saves
- Expose `hasUnsaved` and `isSaving` state to the parent (via a callback or by lifting state)
- Simpler approach: just expose a `ref` with a `save()` method, or pass `hasUnsaved`/`isSaving` up via a render callback

**Simplest approach**: Keep save logic inside `GuideEditor` but expose it via `React.useImperativeHandle` so the parent header button can call it. The editor will also pass `hasUnsaved` up via a new `onUnsavedChange` callback.

### 3. Remove the save button from the editor's internal title bar
The internal title bar keeps only the document title and "last saved" timestamp. The save button moves to the page header.

### Technical Details

**File: `src/components/admin/guide/GuideEditor.tsx`**
- Add `React.forwardRef` and `useImperativeHandle` to expose a `save()` method
- Add `onUnsavedChange?: (unsaved: boolean) => void` prop, called whenever `hasUnsaved` changes
- Remove the save button from the internal title bar (line 213-220)
- Keep the "Saved at..." timestamp in the title bar

**File: `src/components/admin/guide/AppGuideTool.tsx`**
- Add a header bar at the top of the layout: `h-[52px]` with border-bottom, dark background
- Place the Save button on the right side of this header using the standard style:
  ```
  h-10 px-6 rounded-xl
  border-[hsl(var(--ui-border))]
  bg-[hsl(var(--ui-surface-2))]
  text-[hsl(var(--ui-text))]
  shadow-[0_10px_30px_rgba(0,0,0,0.35)]
  text-[10px] font-bold uppercase tracking-wider
  hover:brightness-125 active:brightness-150
  disabled:opacity-50 disabled:pointer-events-none
  ```
- Track `hasUnsaved` state from the editor via the new callback
- Call `editorRef.current.save()` when the button is clicked
- Ctrl+S shortcut continues to work from inside the editor

Two files change: `GuideEditor.tsx` and `AppGuideTool.tsx`.
