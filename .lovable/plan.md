

## Plan: Remove Dark Mode Toggle & Fix LabeledToggle Text Colors

Two issues to fix:

### 1. Remove Dark Mode toggle
**`src/components/chronicle/ChatInterfaceTab.tsx`** (lines 3779-3786) — Delete the entire Dark Mode toggle block from the Interface Settings grid.

### 2. Fix LabeledToggle text colors for dark backgrounds
**`src/components/ui/labeled-toggle.tsx`** — The off label uses `text-slate-900` (near-black) when unchecked, which is invisible on the dark `bg-zinc-800/50` rows. The unchecked track also uses `bg-slate-300` which looks out of place.

| Element | Current | Fix |
|---------|---------|-----|
| Off label (when OFF) | `text-slate-900` (black) | `text-zinc-200` (visible white) |
| Off label (when ON) | `text-slate-400` | `text-zinc-500` (dimmed) |
| On label (when ON) | `text-blue-500` | Keep as-is |
| On label (when OFF) | `text-slate-400` | `text-zinc-500` |
| Track (OFF) | `bg-slate-300` | `bg-zinc-600` |
| Track (locked) | `bg-slate-400` | `bg-zinc-500` |
| Lock icon | `text-slate-400` | `text-zinc-500` |

This ensures: when a toggle is OFF, the "Off" text is bright/readable and "On" is dimmed. When ON, "On" is blue and "Off" is dimmed. Both states are legible on dark backgrounds.

Two files changed, minimal edits.

