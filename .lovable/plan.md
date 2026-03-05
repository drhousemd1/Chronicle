

## Two Quick Fixes

### 1. Update helper text in `CharacterCreationModal.tsx`
Line 34: Change `"Select or import a character from Library or Create New."` to `"Select an option below to continue."`

### 2. Restyle `CharacterPicker.tsx` to dark theme
The entire picker uses light colors (white backgrounds, slate borders, light text). Every class needs to flip to match the app's dark theme:

- **Outer container** (line 38): `bg-white` → `bg-zinc-900`, `border-slate-200` → `border-white/10`
- **Header** (line 39): `border-slate-100` → `border-white/10`, title `text-slate-900` → `text-white`, subtitle `text-slate-500` → `text-zinc-400`, close button colors → `text-zinc-400 hover:text-white`
- **Search bar area** (line 49): `bg-slate-50` → `bg-zinc-800/50`, `border-slate-100` → `border-white/10`, input `!bg-white` → `!bg-zinc-800 !text-white !border-white/10`
- **Character cards** (line 64): `bg-white border-slate-200` → `bg-zinc-800/50 border-white/10`, hover → `hover:border-blue-500/30`, avatar fallback bg → `bg-zinc-700`
- **Card text**: name `text-slate-900` → `text-white`, tags `text-slate-500` → `text-zinc-400`, "Import →" `text-slate-400` → `text-zinc-500`
- **Empty state** (line 90): `text-slate-400` → `text-zinc-500`
- **Loading spinner** (line 125): `bg-white` → `bg-zinc-900`, text → `text-zinc-400`

Total: 2 files, cosmetic changes only.

