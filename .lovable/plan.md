

## Plan: Restyle Sidebar Theme Modal to Dark Theme

### What changes

**Single file: `src/components/chronicle/SidebarThemeModal.tsx`**

Replace the white Card-based layout with the standard dark modal pattern used by Chat Settings and other Chronicle modals.

**1. DialogContent** — Switch from `bg-transparent` + white `Card` wrapper to direct dark styling:
- `bg-zinc-900 border-white/10 shadow-[0_12px_32px_-2px_rgba(0,0,0,0.5)]`
- Remove the `Card` wrapper entirely

**2. Header** — Dark theme colors:
- Title: `text-white` instead of `text-slate-900`
- Border: `border-b border-white/10` instead of `border-slate-100`
- Icon stroke color inherits from white text

**3. Upload button** — Replace the ghost text link with a solid dark button matching the BackgroundPickerModal pattern:
- `bg-zinc-700 text-white hover:bg-zinc-600 font-black text-xs tracking-widest uppercase h-9 gap-1 px-3 rounded-lg`
- Dropdown menu: `bg-zinc-800 border-white/10` with items using `text-zinc-200 hover:bg-zinc-700`

**4. Recommended text** — `text-zinc-500` instead of `text-slate-400`

**5. Default tile** — Dark surface:
- Background: `bg-zinc-800/50` instead of `bg-slate-50`
- Border: `border-white/10` default, `ring-blue-400` when selected (consistent with brand)
- Ring offset color: `ring-offset-zinc-900` so offset matches dark bg
- Icon/text: `text-zinc-500` instead of `text-slate-300/400`

**6. Background tiles** — Same dark treatment:
- `bg-zinc-800/50 border-white/10`, selected: `ring-2 ring-blue-400 ring-offset-2 ring-offset-zinc-900`
- Delete button stays `bg-rose-500`

**7. Empty state** — `border-zinc-700 text-zinc-500` instead of slate-100/400

**8. Check badge** — Keep `bg-blue-500` (works on both themes)

No logic changes, no new dependencies. Pure cosmetic update to one file.

