

## Remove "Drag to Refocus" Badge from Avatar Reposition Overlay

The chat interface reposition mode only changes the cursor — it doesn't show a badge or crosshair guides. The current avatar reposition overlay has crosshair lines and a "Drag to Refocus" badge that should be removed.

### Change

**File: `src/components/chronicle/CharactersTab.tsx`** — Lines 1327-1332

Remove the inner div containing the crosshair guides and "Drag to Refocus" badge:
```tsx
{/* DELETE this entire block */}
<div className="absolute inset-0 pointer-events-none flex items-center justify-center">
  <div className="w-full h-[1px] bg-blue-500/30 absolute" />
  <div className="h-full w-[1px] bg-blue-500/30 absolute" />
  <div className="bg-blue-500 text-white text-[9px] font-black uppercase px-2 py-1 rounded absolute bottom-2 tracking-widest">Drag to Refocus</div>
</div>
```

Keep only the outer reposition div (with `cursor-move`) and the "Done" button. The cursor change is sufficient to indicate reposition mode.

