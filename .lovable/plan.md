

## Plan: Update Chat Interface character roster headers to match Story Builder styling

**File**: `src/components/chronicle/ChatInterfaceTab.tsx`

### Current (Chat Interface — lines 3717 and 3770)
Both headers use a flat `h3` element:
```
text-[11px] font-bold text-white bg-[#4a5f7f] px-4 py-1.5 rounded-lg mb-3 tracking-tight uppercase flex items-center justify-between cursor-pointer select-none shadow-lg
```

### Target (matching WorldTab)
A `div` wrapper with gradient, gloss sheen, and the title/chevron in a nested structure:
```
relative overflow-hidden bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] border-t border-white/20 px-4 py-1.5 rounded-lg mb-3 shadow-lg cursor-pointer select-none
```
- Gloss sheen child: `absolute inset-0 z-0 bg-gradient-to-tr from-white/10 to-transparent opacity-40` with `height: 60%`
- Title + chevron in `flex items-center justify-between relative z-[1]`

**Key constraint**: Keeping `px-4 py-1.5 rounded-lg` (current chat sizing) — only adding the gradient, border-t highlight, and gloss sheen overlay.

### Changes

1. **Line 3716-3722** — Replace the `h3` for "Main Characters" with the 3D styled `div` structure (gradient + gloss sheen + z-layered title), preserving `px-4 py-1.5 rounded-lg` and all existing click/collapse behavior.

2. **Line 3769-3775** — Same replacement for the "Side Characters" header.

