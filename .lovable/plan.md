

## Plan: Redesign Art Style Preference Selection Layout

### What changes

Replace the current HintBox inside the Art Style Preference section with:
1. A darker inner container (matching input field backgrounds like `bg-zinc-900/50` or `bg-[hsl(var(--ui-surface))]`) that wraps just the style selection grid
2. A label row above that container with text like "ART STYLE SELECTION" (matching the `FieldLabel` uppercase styling pattern) plus an Info tooltip icon containing the current hint text
3. Proper padding/overflow handling so the blue selection ring (`ring-2 ring-blue-400`) is never clipped

### File: `src/components/chronicle/WorldTab.tsx` (lines 1118-1160)

**Current structure:**
```
<div class="p-6">                          ← outer padding
  <div class="p-6 bg-[#3a3a3f]/30 ...">   ← medium gray container
    <HintBox ... />                         ← dark hint text block
    <div class="mt-6 grid ...">             ← style cards grid
  </div>
</div>
```

**New structure:**
```
<div class="p-6 space-y-1">                              ← outer padding
  <div class="flex items-center gap-2 mb-1">             ← label row
    <span class="text-xs font-bold uppercase ...">       ← "ART STYLE SELECTION"
      Art Style Selection
    </span>
    <Tooltip>                                             ← info icon with hint
      <TooltipTrigger><Info .../></TooltipTrigger>
      <TooltipContent>Select an art style...</TooltipContent>
    </Tooltip>
  </div>
  <div class="p-3 bg-zinc-900/50 rounded-xl border border-zinc-700">  ← darker container
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"> ← style cards
      ...                                                               (unchanged)
    </div>
  </div>
</div>
```

Key details:
- The darker container uses `p-3` with `overflow-visible` or sufficient internal padding so the `ring-2 ring-blue-400` selection highlight (which adds ~2px outside the button boundary) is not clipped
- Remove the old `bg-[#3a3a3f]/30` wrapper and HintBox entirely
- The label + Info icon follows the exact pattern already used for "Dialog Formatting" and "Starting Day & Time" tooltips
- Need to add `Info` to the lucide-react imports if not already present, and `Tooltip`/`TooltipTrigger`/`TooltipContent` (already imported)

