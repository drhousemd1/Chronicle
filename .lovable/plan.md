

# Restyle "Remove from Gallery" Button to Match Standard Button Spec

The current "Remove from Gallery" button uses a ghost-white, low-contrast style. It needs to match the "Publish to Gallery" button from WorldTab, which follows the standard Shadow Surface button spec.

## File: `src/components/chronicle/StoryDetailModal.tsx` (line 360)

Replace the current className:
```
w-full h-10 bg-ghost-white hover:bg-ghost-white border border-ghost-white text-[rgba(248,250,252,0.3)] hover:text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-2
```

With the standard Shadow Surface spec (matching WorldTab's "Publish to Gallery"):
```
w-full h-10 flex items-center justify-center gap-2 px-4 rounded-xl border border-[hsl(var(--ui-border))] bg-[hsl(var(--ui-surface-2))] shadow-[0_10px_30px_rgba(0,0,0,0.35)] text-[hsl(var(--ui-text))] text-[10px] font-bold leading-none hover:bg-ghost-white active:bg-ghost-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent-teal))]/40 transition-colors disabled:opacity-50 mt-2
```

Also update the Style Guide entry for this button (line ~2240 in `StyleGuideTool.tsx`) to reflect the new styling.

