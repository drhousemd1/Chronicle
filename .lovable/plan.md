

# Unify Toggle Styles to Match Avatar Panel

## What Changes

Two toggles need to be restyled to match the avatar panel's segmented button look (Image 2):

1. **ArcModeToggle** (Simple/Advanced in Story Arc) - currently a pill with blue highlight
2. **Personality split toggle** (Switch component) - currently a sliding switch with text label

Both will be changed to match the avatar panel style: a dark rounded container with two segmented buttons, where the active one gets a `bg-zinc-700` highlight.

## Changes

### File 1: `src/components/chronicle/arc/ArcModeToggle.tsx`

Replace the current pill-style toggle with the avatar panel segmented style:

```
Container: flex p-1 bg-zinc-900/50 rounded-lg border border-white/10
Buttons: flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded transition-all
Active: bg-zinc-700 text-blue-400 shadow-sm
Inactive: text-zinc-500 hover:text-zinc-300
```

Labels remain "Simple" and "Advanced".

### File 2: `src/components/chronicle/PersonalitySection.tsx`

Replace the `<Switch>` + text label with the same segmented toggle style. Two buttons: "Standard" (when `splitMode = false`) and "Split" (when `splitMode = true`).

The active button uses `bg-zinc-700 text-blue-400 shadow-sm`, inactive uses `text-zinc-500 hover:text-zinc-300`. Remove the Switch import since it's no longer needed.

## Files to Modify

| File | Change |
|------|--------|
| `src/components/chronicle/arc/ArcModeToggle.tsx` | Restyle from pill to segmented button toggle |
| `src/components/chronicle/PersonalitySection.tsx` | Replace Switch with segmented "Standard / Split" toggle |

