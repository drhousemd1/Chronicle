

# Fix Character Library Trash Button Styling

## Problem
The Character Library page (`CharactersTab.tsx` line 1251) uses the old circular, muted trash button pattern — identical to what we just fixed on the Image Library.

Current: `rounded-full bg-black/40 text-[rgba(248,250,252,0.3)] hover:text-rose-500 hover:bg-black/60 hover:rotate-12`

## Fix
**File**: `src/components/chronicle/CharactersTab.tsx`, line 1251

Change to: `rounded-xl bg-black/40 text-white hover:text-rose-400 hover:bg-black/60 transition-all duration-300`

This matches the standardized pattern we applied to the Image Library:
- `rounded-full` → `rounded-xl` (square padding)
- `text-[rgba(248,250,252,0.3)]` → `text-white` (vibrant icon)
- Remove `hover:rotate-12`

One line change in one file.

