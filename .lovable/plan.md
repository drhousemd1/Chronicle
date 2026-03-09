

## Fix Chat Interface Button Cards

Three problems plus a removal:

### 1. Remove "Memory Quick Save" (lines 1450-1466)
`MemoryQuickSaveButton` is imported but **never rendered** in `ChatInterfaceTab`. Delete this entry entirely.

### 2. Fix "Chat Send Button" (lines 1338-1354)
**Wrong**: Shown as `h-10 w-10` square icon buttons with `▶` play icon.
**Actual code** (line 3898-3904): It's a **text button** — `rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest` that displays the word **"Send"** (or "..." when streaming). Not square, not an icon.

Fix `size` to `"rounded-xl px-4 py-2 — text-[10px] font-bold uppercase tracking-widest"` and fix preview to show two text buttons labeled "SEND" — one active (`bg-[#4a5f7f] text-white`) and one inactive (`bg-[hsl(var(--ui-surface-2))] opacity-50`).

### 3. Fix "Day Counter +/− Arrows" (lines 1430-1449)
**Wrong**: Shown as horizontal `rounded-full` pill with `◀ Day 1 ▶` triangles.
**Actual code** (lines 3374-3395): Vertical layout — white `rounded-lg border border-black shadow-sm` container with number on left (`px-3 py-1.5 font-bold text-sm`) and a `border-l border-black` divider, then **vertical** `ChevronUp` / `ChevronDown` stacked on the right (`px-1.5 py-0.5`). There's also a "Day" label above it.

Fix `size` to `"rounded-lg border border-black — vertical ChevronUp/ChevronDown"` and fix preview to match the actual vertical stepper layout.

### 4. Fix "Time of Day Selectors" preview (lines 1411-1429)
Preview uses emoji (🌅☀️🌇🌙) but actual code uses **Lucide icons** (`Sunrise`, `Sun`, `Sunset`, `Moon` via `getTimeIcon()`). Replace emoji with text labels or simple unicode that better represents the actual icon appearance. Also the data is correct but the container in actual code has no background — remove the `rgba(0,0,0,0.2)` wrapper since these sit on the sky-image panel, not a styled container.

### Summary of line changes in `StyleGuideTool.tsx`
- Lines 1338-1354: Rewrite Send button card with correct text-button preview
- Lines 1411-1429: Fix Time of Day preview icons and remove fake background
- Lines 1430-1449: Rewrite Day Counter with vertical stepper preview
- Lines 1450-1466: Delete Memory Quick Save entry entirely

