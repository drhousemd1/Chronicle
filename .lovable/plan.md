

## Plan: Fix World Placeholder Size + Fix Character Builder Add Category

### Fix 1: World Core section title placeholder size
In `WorldTab.tsx` line 654, remove `placeholder:text-sm` so the placeholder inherits the same `text-[10px]` as the filled-in text.

### Fix 2: Character Builder "Add Category" ignores freeform selection
**Root cause:** Two problems working together:
1. In `CharactersTab.tsx` line 560-562, when `externalAddSection` exists (which it does — passed from `Index.tsx`), the type parameter is ignored and the external handler is called directly
2. In `Index.tsx` line 1414-1419, `handleAddSection()` always creates a plain structured section with no `type` field

**Fix:**
- Update `Index.tsx` `handleAddSection` to accept a `type` parameter and pass it through when creating the section (including `freeformValue` for freeform)
- Update `CharactersTab.tsx` to pass the type through to `externalAddSection` instead of ignoring it
- Update the `onAddSection` prop type to accept the type parameter

Two files changed: `src/pages/Index.tsx`, `src/components/chronicle/CharactersTab.tsx`, `src/components/chronicle/WorldTab.tsx`.

