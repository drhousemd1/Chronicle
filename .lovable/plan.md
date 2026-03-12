

# Update Add/Create Icon Box Background

## Problem
The `+` icon square inside the Add/Create character placeholders uses a flat `bg-[#1a1a1f]` background. It should use the same `bg-gradient-to-br from-zinc-800 to-zinc-900` gradient applied to the other placeholder elements.

## Change

**File**: `src/components/chronicle/WorldTab.tsx`, line 458

Replace `bg-[#1a1a1f]` with `bg-gradient-to-br from-zinc-800 to-zinc-900` on the icon container div.

