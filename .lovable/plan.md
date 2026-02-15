
# Fix: Separate Save and Save-and-Close Button States

## Problem

Both "Save" and "Save and Close" buttons share the single `isSaving` state. When either is clicked, `setIsSaving(true)` fires and BOTH buttons simultaneously show "Saving..." text and get the disabled styling, making it look like both are pressed.

## Solution

Introduce a second state variable `isSavingAndClosing` so each button tracks its own saving state independently.

### File: `src/pages/Index.tsx`

**A. Add new state variable** (near existing `isSaving` declaration):
```typescript
const [isSavingAndClosing, setIsSavingAndClosing] = useState(false);
```

**B. Update the "Save and Close" button** (line 1486-1493):
- Instead of calling `handleSave(true)`, give it its own inline handler that uses `isSavingAndClosing`
- `disabled={isSavingAndClosing}` instead of `disabled={isSaving}`
- Text: `isSavingAndClosing ? 'Saving...' : 'Save and Close'`

```typescript
<button
  type="button"
  onClick={async () => {
    setIsSavingAndClosing(true);
    try {
      await handleSaveWithData(null, true);
    } finally {
      setIsSavingAndClosing(false);
    }
  }}
  disabled={isSavingAndClosing || isSaving}
  ...
>
  {isSavingAndClosing ? 'Saving...' : 'Save and Close'}
</button>
```

**C. Update the "Save" button** (line 1494-1501):
- Keep using `isSaving` as before
- Disable if either save is in progress: `disabled={isSaving || isSavingAndClosing}`
- Text stays: `isSaving ? 'Saving...' : 'Save'`

**D. Remove `setIsSaving` from `handleSaveWithData` when called with `navigateToHub=true`**:
- Actually, the cleaner approach: keep `isSaving` only for the "Save" (no-close) path. The "Save and Close" button will bypass `isSaving` entirely by wrapping the call with its own `isSavingAndClosing` state.
- To avoid double-state changes, modify the "Save" button's onClick to set `isSaving` around the call, and remove `setIsSaving` from inside `handleSaveWithData` itself. Instead, each caller manages its own loading state.

### Refined approach (cleanest):

**Move `setIsSaving` out of `handleSaveWithData`** (remove lines 690 and 734). Let callers control their own state:

- "Save" button onClick:
  ```typescript
  onClick={async () => {
    setIsSaving(true);
    try { await handleSave(false); } finally { setIsSaving(false); }
  }}
  ```

- "Save and Close" button onClick:
  ```typescript
  onClick={async () => {
    setIsSavingAndClosing(true);
    try { await handleSave(true); } finally { setIsSavingAndClosing(false); }
  }}
  ```

- Sidebar save button also wraps its call with `setIsSaving`.

Each button only shows "Saving..." and disabled state when IT is the one saving.

## Files Modified

1. **`src/pages/Index.tsx`** -- Add `isSavingAndClosing` state, remove `setIsSaving` from `handleSaveWithData`, wrap each save button with its own state management
