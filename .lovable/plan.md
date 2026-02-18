
# Remove Sidebar Save/Back Buttons and Add Back Arrow to Scenario Builder Heading

## Changes

### 1. Remove sidebar "Save Scenario" and "Back to Stories" buttons
Delete the entire conditional block (lines 1303-1335) that renders the save and back buttons at the bottom of the sidebar when in the scenario builder. The "Save and Close" and "Save" buttons in the top-right header already handle this.

### 2. Add back arrow to "Scenario Builder" heading
Currently the back arrow only appears when `tab === "characters"` (to go back to the world tab). Change this so:
- A back arrow **always** shows next to "Scenario Builder" when on the `world` or `characters` tab
- When on `world` tab: clicking the arrow navigates back to Your Stories (`setActiveId(null); setActiveData(null); setTab("hub")`)
- When on `characters` tab: clicking the arrow goes back to `world` tab (existing behavior, deselects character)

This matches the back-arrow pattern already used on the Character Library and Image Library pages.

## Technical Details

### File: `src/pages/Index.tsx`

**Remove lines 1303-1335** -- the sidebar save/back button block:
```tsx
{activeId && (tab === "world" || tab === "characters") && (
  <div className={`p-4 border-t border-white/10 space-y-2 ...`}>
    ...Save Scenario / Back to Stories buttons...
  </div>
)}
```

**Update lines 1384-1404** -- always show the back arrow in the heading:
```tsx
{(tab === "world" || tab === "characters") && (
  <div className="flex items-center gap-3">
    <button 
      onClick={() => {
        if (tab === "characters") {
          setSelectedCharacterId(null);
          setTab("world");
        } else {
          setActiveId(null);
          setActiveData(null);
          setTab("hub");
        }
      }} 
      className="p-2 hover:bg-slate-100 rounded-full transition-colors"
    >
      <svg ...chevron icon... />
    </button>
    <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">
      Scenario Builder
    </h1>
  </div>
)}
```

## Files Modified
| File | Change |
|---|---|
| `src/pages/Index.tsx` | Remove sidebar save/back buttons (lines 1303-1335), update heading back arrow to always show (lines 1384-1404) |
