

# Fix Toggle Off-State Background Color

## Problem
The `LabeledToggle` component uses `bg-zinc-600` (#52525b) for the off-state track — a light gray. The HTML design document specifies `background:#1c1c1f` — a much darker, near-black tone with an inset shadow (`inset 0 1px 3px rgba(0,0,0,0.4)`).

## Fix

**File: `src/components/ui/labeled-toggle.tsx`** (line 44)

Change the off-state track background from `bg-zinc-600` to `bg-[#1c1c1f]` and add the inset shadow from the design document.

| Property | Current | Design Doc |
|----------|---------|------------|
| Off-state track bg | `bg-zinc-600` (#52525b) | `bg-[#1c1c1f]` |
| Track shadow (off) | none | `shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]` |
| Track shadow (on) | none | `shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)]` |

Also adjust track dimensions to match: `w-10 h-[22px]` (40×22px per HTML) vs current `w-9 h-5` (36×20px), and thumb to 16×16 with proper positioning.

No functional changes — only visual styling on the toggle track.

