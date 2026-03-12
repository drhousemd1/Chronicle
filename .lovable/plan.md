

# Unify Play Button to Match Like/Save/Remove Styling

The Play button (lines 304-310 and 344-350) still uses the old `h-12`, `text-sm font-semibold`, and `shadow-md` styling, while Like, Save, and Remove from Gallery now use the Shadow Surface spec (`h-10`, `text-[10px] font-bold uppercase tracking-wider`, `shadow-[0_10px_30px_rgba(0,0,0,0.35)]`).

## File: `src/components/chronicle/StoryDetailModal.tsx`

**Both Play button instances** (lines 304-310 and 344-350) — update className from:
```
flex-1 h-12 bg-[#3b82f6] hover:bg-[#2d6fdb] rounded-xl flex items-center justify-center gap-2 text-white shadow-md transition-colors
```
to:
```
flex-1 h-10 bg-[#3b82f6] hover:bg-[#2d6fdb] rounded-xl flex items-center justify-center gap-2 text-white shadow-[0_10px_30px_rgba(0,0,0,0.35)] text-[10px] font-bold leading-none uppercase tracking-wider transition-colors
```

Also change the icon from `w-5 h-5` to `w-4 h-4` and replace `<span className="text-sm font-semibold">Play</span>` with `<span>Play</span>` (typography now handled by parent className).

