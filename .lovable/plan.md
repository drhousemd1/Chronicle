

# Fix Custom Section Title: Navy Banner Instead of Left Border

## Problem
The custom world content sections currently use a thin left-border accent (`border-l-2 border-blue-500/30 pl-5`) which is not what was requested. The mockup shows:
- The section title should sit inside a full-width navy blue banner bar (dark navy background, rounded, same width as the location input rows)
- The content rows below should align at the same width/indentation as Primary Locations rows
- The delete button sits to the right of the banner, outside it

## Changes (single file: `src/components/chronicle/WorldTab.tsx`)

### Lines 587-610: Replace the custom section wrapper and title area

**Current:**
- Outer div: `border-l-2 border-blue-500/30 pl-5 space-y-4`
- Title: bare `AutoResizeTextarea` with transparent background and tiny uppercase text
- Delete button: inline next to title

**New:**
- Outer div: remove the left border and left padding entirely (`space-y-4` only)
- Title row: wrap in a `flex items-center gap-3` container matching the location row pattern
  - The title input sits inside a navy background bar: `flex-1 bg-[#1e293b] rounded-xl border border-white/5 px-4 py-3` — this creates the banner effect
  - The `AutoResizeTextarea` inside uses uppercase tracking styling (`text-[10px] font-black text-zinc-400 uppercase tracking-widest`) on a transparent background within the navy bar
  - Delete button sits outside the bar to the right (same position as location trash icons)
- Content rows below remain unchanged in structure — they already use the same `flex items-start gap-3` pattern with `w-2/5` and `flex-1` widths

### Technical Details

The key visual change is replacing:
```
<div className="border-l-2 border-blue-500/30 pl-5 space-y-4">
  <div className="flex items-center justify-between">
    <AutoResizeTextarea ... className="bg-transparent ..." />
    <button>delete</button>
  </div>
```

With:
```
<div className="space-y-4">
  <div className="flex items-center gap-3">
    <div className="flex-1 bg-[#1e293b] rounded-xl border border-white/5 px-4 py-3">
      <AutoResizeTextarea ... className="bg-transparent ..." />
    </div>
    <button>delete</button>
  </div>
```

This matches the mockup: a navy bar spanning the full row width (minus the delete button column), with the title text rendered inside as an editable field. The rows below stay at the same indentation as location rows since the left border padding is removed.

No other files are affected. This is a purely visual/layout fix within WorldTab.tsx.
