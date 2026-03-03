

# Fix Test A Color Scheme to Match App Theme

## Problem
The Test A mockup uses shadcn CSS variable tokens (`bg-card`, `border-input`, `text-muted-foreground`) which don't resolve to the correct dark colors in this app. The app uses direct Tailwind color values for its dark UI.

## Changes
**File:** `src/components/chronicle/CharactersTab.tsx` (lines 1192-1234)

Replace the shadcn tokens with the app's actual dark theme colors:

| Element | Current (wrong) | Updated (correct) |
|---------|-----------------|-------------------|
| Card shell | `bg-card text-card-foreground border` | `bg-[#1c1c1e] border border-white/10 text-white` |
| Card header border | none | `border-b border-white/10` on header div |
| Title | inherits card-foreground | `text-white` |
| Subtitle | `text-muted-foreground` | `text-zinc-500` |
| Label pills | `border-input bg-transparent text-muted-foreground` | `border-white/10 bg-zinc-900/50 text-zinc-400 uppercase font-bold tracking-widest text-xs` |
| Value fields | `border-input dark:bg-input/30 text-foreground` | `border-white/10 bg-zinc-900/30 text-zinc-300` |
| Sparkle + Lock icons | `text-muted-foreground` | `text-zinc-500` |
| Add Row button | `border-input text-muted-foreground hover:bg-accent` | `border-white/10 text-zinc-500 hover:border-zinc-400 hover:text-zinc-300` |

These values match the existing hardcoded section styling used throughout the character builder (per the guide: `bg-[#2a2a2f]`, `border-white/10`, `text-zinc-400` labels). The card background is slightly darker (`#1c1c1e`) to match the screenshot reference.

