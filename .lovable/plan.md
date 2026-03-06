

## Plan: Always-visible interval dropdown with label

### Change in `src/components/chronicle/WorldTab.tsx` (lines 975-1018)

1. Restructure the Mode group layout: keep the "MODE" label over the toggle, and add a separate "TIME INTERVAL" label + dropdown group next to it
2. The dropdown is always rendered (remove the `{openingDialog.timeProgressionMode === 'automatic' && ...}` conditional)
3. When mode is `'manual'`, apply `opacity-40 pointer-events-none` to the dropdown to gray it out
4. Add a "TIME INTERVAL" label above the dropdown in the same `text-[10px] font-black text-zinc-400 uppercase tracking-widest` style

The result will look like:

```
STARTING DAY & TIME          MODE                    TIME INTERVAL
[DAY 1 ▲▼] [☀ ☀ 🌅 🌙]    [MANUAL | AUTOMATIC]    [15 min ▼]
```

When Manual is selected, the "TIME INTERVAL" label and dropdown remain visible but appear grayed out (reduced opacity, non-interactive).

