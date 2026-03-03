

# Fix Test A Mockup to Match Screenshot Exactly

## Problem
The outer card wrapper uses hardcoded colors (`bg-[#1c1c1e]`, `border-white/10`, `text-white`, `text-zinc-500`) instead of the standard shadcn card tokens. The screenshot shows the base shadcn card style in dark mode, which the app already supports via CSS custom properties.

## Changes

**File:** `src/components/chronicle/TestAMockup.tsx`

Replace the outer card wrapper styling to use shadcn tokens exactly:

| Line | Current | Corrected |
|------|---------|-----------|
| 27 (card shell) | `border border-white/10 bg-[#1c1c1e] text-white` | `border bg-card text-card-foreground` |
| 28 (header div) | `border-b border-white/10` | `border-b` (inherits border color) |
| 29 (title h3) | `text-white` | remove -- inherits from `text-card-foreground` |
| 30 (subtitle p) | `text-zinc-500` | `text-muted-foreground` |

Everything else (row grid, label pills, input fields, icons, Add Row button) stays exactly as-is -- those already use the correct `border-input`, `dark:bg-input/30`, and `text-muted-foreground` tokens matching the user's provided code and screenshot.

