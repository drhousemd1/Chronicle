
# Match Your Stories Filter Bar to Community Gallery

## What's changing

The filter bar on the Your Stories page will be updated to use the **exact same classes** as the Community Gallery's sort filter toggle. Only two class values on the outer `div` need to change -- the button classes already match.

## Technical Details

**File:** `src/pages/Index.tsx`, line 1427

**Outer container class change:**
- Current: `bg-slate-800 rounded-full p-1 gap-0.5` (no border)
- Gallery's exact classes: `bg-white/10 rounded-full p-1 gap-0.5 border border-white/10`

**Active button class change (lines 1433, 1444, 1455, 1466):**
- Current: `bg-slate-600 text-white shadow-sm`
- Gallery's exact: `bg-[#4a5f7f] text-white shadow-sm`

**Inactive button class change (lines 1434, 1445, 1456, 1467):**
- Current: `text-slate-400 hover:text-slate-300`
- Gallery's exact: `text-zinc-400 hover:text-zinc-200`

The button structure (`px-4 py-1.5 rounded-full text-xs font-bold transition-all`) is already identical -- no changes needed there.
