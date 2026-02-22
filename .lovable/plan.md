
# Add Save Button to White Header for App Guide Tool

## Problem
The Save button disappeared when the Guide Editor was converted to a read-only markdown viewer. The user wants it back, but placed in the **white header bar** (right side), and it should **only appear when the App Guide tool is active** within the Admin panel.

## Changes

### 1. `src/pages/Index.tsx`
Add a conditional Save button in the right-side actions area of the white header (around line 1499), matching this pattern:

```
{tab === "admin" && adminActiveTool === "app_guide" && (
  <button ...>Save</button>
)}
```

The button will use the same styling as other header buttons (the dark rounded-xl pill style used by "Save and Close", "Save", "Delete All", etc.).

### 2. Wire a save callback
- `AppGuideTool` will expose a save function via a ref (using `useImperativeHandle`) or via a callback prop
- `Index.tsx` will hold a ref to the AppGuideTool and call its save method when the header Save button is clicked
- The save function will re-persist the current document's title and markdown to the database (confirming current state is saved)
- A toast will confirm "Document saved" on success

### 3. `src/components/admin/guide/AppGuideTool.tsx`
- Accept an `onRegisterSave` prop (a function that receives the save callback) -- this avoids needing `forwardRef` on a lazy-loaded component
- When the active document changes, register a save function that persists the current title to the database
- Alternatively, expose a `saveRef` that `Index.tsx` can call

### 4. `src/pages/Admin.tsx`
- Pass through the save registration prop from `Index.tsx` to `AppGuideTool`

## Technical Details

**Approach:** Use a ref-based pattern. `Index.tsx` creates a `useRef` for the guide save function. When `AdminPage` renders `AppGuideTool`, it passes a callback that sets this ref. The white header Save button calls `guideToolSaveRef.current?.()`.

**Files modified:**
- `src/pages/Index.tsx` -- Add Save button in header right-side actions, create save ref
- `src/pages/Admin.tsx` -- Pass `onRegisterSave` prop through to `AppGuideTool`
- `src/components/admin/guide/AppGuideTool.tsx` -- Accept `onRegisterSave`, register save callback that persists current doc

**Button visibility:** Only when `tab === "admin" && adminActiveTool === "app_guide"`

**Button styling:** Matches existing header buttons:
```
className="inline-flex items-center justify-center h-10 px-6 rounded-xl border border-[hsl(var(--ui-border))] bg-[hsl(var(--ui-surface-2))] text-[hsl(var(--ui-text))] shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:brightness-125 active:brightness-150 transition-all active:scale-95 text-[10px] font-bold leading-none uppercase tracking-wider"
```
