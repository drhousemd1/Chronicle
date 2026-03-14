

## Add Three-Dot Menu to Avatar — Match Chat Interface Pattern

Replace the standalone "Reposition" / "Save Position" button with a three-dot (`MoreVertical`) dropdown menu in the top-right corner of the avatar display area, exactly matching the chat interface's pattern.

### Changes in `src/components/chronicle/CharactersTab.tsx`

**1. Remove the standalone reposition button** (lines 1311-1319)
Delete the entire `{selected.avatarDataUrl && (<button ... REPOSITION / Save Position ... />)}` block.

**2. Add three-dot dropdown menu inside the avatar container** (after the generating spinner, before the reposition crosshair overlay — around line 1293)

Add a `MoreVertical` dropdown in the top-right corner of the avatar, only when `selected.avatarDataUrl` exists and NOT repositioning:

```tsx
{selected.avatarDataUrl && !isRepositioning && (
  <div className="absolute top-2 right-2 z-30">
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-1.5 rounded-lg transition-colors bg-black/30 hover:bg-black/50 text-white/70 hover:text-white">
          <MoreVertical className="w-4 h-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="shadow-lg z-50 bg-zinc-800 border-ghost-white text-zinc-200">
        <DropdownMenuItem onClick={() => setIsRepositioning(true)} className="hover:!bg-zinc-700 focus:!bg-zinc-700 focus:!text-white">
          <Move className="w-4 h-4 mr-2" />
          Reposition image
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
)}
```

**3. Add "Done" button in the top-left corner when repositioning** (matching chat interface exactly)

Replace the current crosshair overlay (lines 1287-1293) to also include a Done button in top-left:

```tsx
{isRepositioning && (
  <div className="absolute inset-0 z-[18] touch-none cursor-move pointer-events-auto">
    <button
      type="button"
      className="absolute left-2 top-2 rounded-md bg-black/55 border border-white/20 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-white hover:bg-black/70 pointer-events-auto z-20"
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        setIsRepositioning(false);
      }}
    >
      Done
    </button>
    {/* Keep the crosshair guides */}
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      <div className="w-full h-[1px] bg-blue-500/30 absolute" />
      <div className="h-full w-[1px] bg-blue-500/30 absolute" />
      <div className="bg-blue-500 text-white text-[9px] font-black uppercase px-2 py-1 rounded absolute bottom-2 tracking-widest">Drag to Refocus</div>
    </div>
  </div>
)}
```

**4. Ensure imports** — `MoreVertical` and `Move` from lucide-react, and `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem` are already imported (verify and add if missing).

### Summary of UX Change
- **Before**: Separate "REPOSITION" / "Save Position" button below the avatar
- **After**: Three-dot menu (top-right of avatar) → "Reposition image" menu item → drag mode with "Done" button (top-left) — identical to chat interface

