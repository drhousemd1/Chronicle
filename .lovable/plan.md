

# Make Your Stories Filter Bar Visually Identical to Community Gallery

## Problem
The Gallery toggle uses transparent colors (`bg-white/10`, `border-white/10`) that only look correct on its dark `#121214` background. On the Your Stories page, the header is white (`bg-white`), so these same transparent classes render almost invisibly.

## Solution
Replace the transparent classes on the Your Stories toggle with the **solid hex equivalents** -- the actual colors you'd see if you used a color picker on the Gallery. No other UI changes (no header color changes, no title changes).

## Technical Details

**File:** `src/pages/Index.tsx`, line 1427 only (the toggle container and its buttons)

**Resolved colors from Gallery (transparent on #121214):**

| Element | Gallery class (transparent) | Resolved solid hex |
|---|---|---|
| Track background | `bg-white/10` | `#2b2b2e` |
| Track border | `border-white/10` | `#2b2b2e` |
| Active pill | `bg-[#4a5f7f]` | `#4a5f7f` (no change) |
| Active text | `text-white` | `#FFFFFF` (no change) |
| Inactive text | `text-zinc-400` | `#a1a1aa` |
| Inactive hover | `hover:text-zinc-200` | `#e4e4e7` |

**Changes (line 1427 outer div only):**
- `bg-white/10` becomes `bg-[#2b2b2e]`
- `border border-white/10` becomes `border border-[#2b2b2e]`

**Button active state (lines 1433, 1444, 1455, 1466) -- no change needed**, already `bg-[#4a5f7f] text-white shadow-sm`.

**Button inactive state (lines 1434, 1445, 1456, 1467):**
- `text-zinc-400 hover:text-zinc-200` becomes `text-[#a1a1aa] hover:text-[#e4e4e7]`

This is the minimal set of class swaps -- nothing else on the page changes.
