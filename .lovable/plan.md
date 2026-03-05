

## Plan: Convert Chat Settings Modal to Dark Theme

The Chat Settings modal and the Delete Character dialog are the only remaining light-themed components. Every other modal/panel in the app uses the dark theme palette (`bg-zinc-900`, `bg-zinc-800/50`, `border-white/10`, `text-white`).

### Color Mapping

| Current (light) | Replace with (dark) |
|---|---|
| `bg-white` | `bg-zinc-900` |
| `bg-slate-50` (setting rows) | `bg-zinc-800/50` |
| `border-slate-200`, `border-slate-100` | `border-white/10` |
| `text-slate-900` (headings) | `text-white` |
| `text-slate-700` (labels) | `text-zinc-200` |
| `text-slate-500` (descriptions) | `text-zinc-400` |
| `text-slate-400` (footer) | `text-zinc-500` |
| `bg-slate-200 text-slate-600 hover:bg-slate-300` (inactive buttons) | `bg-zinc-700 text-zinc-300 hover:bg-zinc-600` |
| `shadow-[0_12px_32px...]` | `shadow-[0_12px_32px_-2px_rgba(0,0,0,0.5)]` (darker shadow) |

### File: `src/components/chronicle/ChatInterfaceTab.tsx`

**Chat Settings Modal (lines 3743-3944)**
- `DialogContent`: `bg-white border-slate-200` → `bg-zinc-900 border-white/10`
- `DialogHeader`: `border-slate-100` → `border-white/10`
- `DialogTitle`: `text-slate-900` → `text-white`
- Section headings (`h3`): `text-slate-900` → `text-white`
- All setting row containers: `bg-slate-50` → `bg-zinc-800/50`
- All setting labels: `text-slate-700` → `text-zinc-200`
- All description text: `text-slate-500` → `text-zinc-400`
- Divider: `border-slate-200` → `border-white/10`
- Inactive segmented buttons (POV, Verbosity): `bg-slate-200 text-slate-600 hover:bg-slate-300` → `bg-zinc-700 text-zinc-300 hover:bg-zinc-600`
- Footer note: `text-slate-400 border-slate-100` → `text-zinc-500 border-white/10`

**Delete Character Dialog (lines 3947-3973)**
- `AlertDialogContent`: `bg-white` → `bg-zinc-900`
- Title: `text-slate-900` → `text-white`
- Description: `text-slate-600` → `text-zinc-400`
- Cancel button: `bg-slate-100 text-slate-900 hover:bg-slate-200` → `bg-zinc-800 text-zinc-200 hover:bg-zinc-700 border-white/10`

All changes are in one file, purely class string replacements.

