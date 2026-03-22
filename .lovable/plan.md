

# Fix Story Builder Sidebar Not Extending Full Height

## Problem
The WorldTab (Story Builder) is rendered directly inside `<main>` without a height-constraining wrapper. Compare:
- Characters tab: `<div className="h-full overflow-hidden"><CharactersTab ... /></div>` — works correctly
- World tab: `<WorldTab ... />` — no wrapper, so the sidebar's `lg:h-full` has no parent height to fill

The `StoryBuilderScreen` root div uses `flex flex-1 min-h-0` which needs a parent with defined height. Without it, the sidebar collapses to content height only.

## Fix

### `src/pages/Index.tsx` (~line 2547-2580)
Wrap the WorldTab in the same pattern used by the characters tab:

```
<div className="h-full overflow-hidden">
  <WorldTab ... />
</div>
```

This gives the flex container inside `StoryBuilderScreen` a defined height to fill, which lets the sidebar's `lg:h-full` stretch to the bottom of the page.

## Files Modified
- `src/pages/Index.tsx` — add `h-full overflow-hidden` wrapper around WorldTab

