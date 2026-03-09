

## Add Visible Count Badge to Edits Button

The Edits button at line 1929-1933 already has a count badge, but it uses `bg-white/15` which is nearly invisible against the dark surface. The DRAFTS button (line 1794-1797) has the same invisible styling.

Looking at your screenshot, the DRAFTS badge shows a solid, clearly visible counter pill. The code currently renders both badges with `bg-white/15` — far too transparent.

### Fix

**File: `src/pages/Index.tsx`**

**Line 1930** — Edits badge: Change `bg-white/15` to `bg-zinc-600` (solid, visible pill matching your screenshot).

**Line 1795** — Drafts badge (for consistency, since your screenshot shows it solid too): Same change from `bg-white/15` to `bg-zinc-600`.

Both badges keep the same size/shape (`h-4 min-w-[16px] rounded-full text-[9px] font-bold px-1`), just with a visible background.

