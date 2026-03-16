

# Style Redesign: CharacterEditModal Content to Match Builder Pages

## Color Verification Results

| Element | Modal File/Line | Current Value | Builder File/Line | Correct Value |
|---|---|---|---|---|
| Section outer border | CharacterEditModal.tsx:227 | `border border-ghost-white` | CharactersTab.tsx:458 | No border; uses inset shadow stack |
| Section outer shadow | :227 | `shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]` | :458 | `shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)]` |
| Section header bg | :229 | `bg-[#4a5f7f]` (flat) | :460 | `bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] border-t border-white/20` + gloss overlay |
| Header title tracking | :230 | `tracking-tight` | :463 | `tracking-[-0.015em] relative z-[1]` |
| Inner card bg | :241 | `bg-[#3a3a3f]/30 ... border border-ghost-white` | :474 | `bg-[#2e2e33] ... shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)]` |
| HardcodedRow label bg | :136 | `bg-zinc-900/50 border border-ghost-white` | CharactersTab.tsx:498 | `bg-[#1c1c1f] border-t border-black/35` |
| HardcodedRow value bg | :143 | `bg-zinc-900/50 border border-ghost-white` | :524 | `bg-[#1c1c1f] border-t border-black/35` |
| ModalExtraRow value bg | :168 | `bg-zinc-900/50 border border-ghost-white` | ExtraRow :571 | `bg-[#1c1c1f] border-t border-black/35` |
| Add Row button | :1488 | shadcn `variant="ghost"` + dashed border | :1703 | `bg-[#3c3e47] rounded-xl shadow-[0_8px_24px_...] text-blue-500` |
| FieldInput bg | :194 | `bg-zinc-900/50 border border-ghost-white` | N/A (builder equivalent) | `bg-[#1c1c1f] border-t border-black/35` |
| FieldTextarea bg | :214 | `bg-zinc-900/50 border-ghost-white` | N/A | `bg-[#1c1c1f] border-t border-black/35` |
| Toggle container | :1394 | `bg-zinc-900/50 ... border border-ghost-white` | builder-input-and-toggle-spec | `bg-[#1c1c1f]` with inset shadows |
| Toggle active pill | :1399 | `bg-zinc-700 text-blue-500` | builder-input-and-toggle-spec | `bg-blue-500 text-white` (#3b82f6) |

## Changes — `src/components/chronicle/CharacterEditModal.tsx`

### 1. Update `CollapsibleSection` component (lines 226-254)
- Outer: Remove `border border-ghost-white`, add inset shadow edges to shadow stack
- Header: Change from flat `bg-[#4a5f7f]` to gradient `bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] border-t border-white/20` + gloss sheen overlay div
- Title: Change `tracking-tight` to `tracking-[-0.015em] relative z-[1]`
- Chevron button: Add `relative z-[1]`
- Inner card: Change from `bg-[#3a3a3f]/30 ... border border-ghost-white` to `bg-[#2e2e33] ... shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)]`

### 2. Update `HardcodedRow` component (lines 128-148)
- Label: `bg-zinc-900/50 border border-ghost-white` → `bg-[#1c1c1f] border-t border-black/35`
- Value input: `bg-zinc-900/50 border border-ghost-white` → `bg-[#1c1c1f] border-t border-black/35`

### 3. Update `ModalExtraRow` component (lines 151-179)
- Value input: `bg-zinc-900/50 border border-ghost-white` → `bg-[#1c1c1f] border-t border-black/35`

### 4. Update `FieldInput` component (lines 182-197)
- Input: `bg-zinc-900/50 border border-ghost-white` → `bg-[#1c1c1f] border-t border-black/35`

### 5. Update `FieldTextarea` component (lines 199-217)
- Textarea: `bg-zinc-900/50 border-ghost-white` → `bg-[#1c1c1f] border-t border-black/35`

### 6. Update all "Add Row" buttons (lines 1488, 1514, 1542, 1567, 1599, 1615, 1631, 1647, 1663)
- Replace shadcn `<Button variant="ghost">` with dashed border → native `<button>` using builder standard: `w-full h-10 text-xs font-bold text-blue-500 hover:text-blue-300 bg-[#3c3e47] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:brightness-110 transition-all`

### 7. Update toggle controls (lines 1394-1444)
- Container: `bg-zinc-900/50 ... border border-ghost-white` → `bg-[#1c1c1f] rounded-lg shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]`
- Active pill: `bg-zinc-700 text-blue-500` → `bg-blue-500 text-white`
- Inactive pill: keep `text-zinc-500 hover:text-zinc-300`

### 8. Update custom section headers (line 1769)
- Match same gradient header as CollapsibleSection (from-[#5a7292] to-[#4a5f7f] with gloss overlay)

### 9. Update custom section inner card (line 1796)
- Same as CollapsibleSection inner card update

### Files Changed
- `src/components/chronicle/CharacterEditModal.tsx`

