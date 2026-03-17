

# Rebuild CharacterPicker Modal to Match Builder Container Styling

## What's Wrong

The `CharacterPicker` modal (Global Character Library) in `src/components/chronicle/CharacterPicker.tsx` uses completely different styling from the builder containers:

| Element | Current (CharacterPicker) | Builder Source of Truth |
|---|---|---|
| **Outer shell** | `bg-zinc-900 rounded-3xl shadow-2xl border border-ghost-white` (line 38) | `bg-[#2a2a2f] rounded-[24px] overflow-hidden shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)]` |
| **Header** | `p-6 border-b border-ghost-white` with `font-black` (lines 39-46) | Slate-blue gradient `bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] border-t border-white/20 px-5 py-3 shadow-lg` with 60% gloss overlay, `font-bold tracking-[-0.015em]` |
| **Search bar area** | `bg-zinc-800/50 border-b border-ghost-white` with `!bg-zinc-800 !border-ghost-white` input (lines 49-56) | Should be `bg-[#1c1c1f] border border-black/35 rounded-lg focus:border-blue-500` |
| **Character cards** | `bg-zinc-800/50 border border-ghost-white rounded-2xl` (line 64) | `bg-[#2e2e33] rounded-2xl shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)]` |
| **Avatar frame** | `bg-zinc-700 border border-ghost-white rounded-xl` (line 66) | Should use `bg-[#1c1c1f] border border-black/35 rounded-xl` |
| **Close button** | Chronicle UI `Button variant="ghost"` with inline SVG | Should be a simple styled button matching builder patterns |
| **Loading state shell** | `bg-zinc-900 rounded-3xl shadow-2xl` (line 136) | Same builder shell as above |

The modal also doesn't use Radix Dialog at all — it's a raw `fixed inset-0` div, missing proper accessibility and animation.

## Plan

### Step 1: Rewrite `CharacterPicker` component
Replace the entire render with builder-matched markup:

- **Overlay**: Use Radix `Dialog` with `DialogContentBare` (no default surface styling) so the builder shell owns the surface
- **Outer shell**: `bg-[#2a2a2f] rounded-[24px] overflow-hidden shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)]`
- **Header**: Slate-blue gradient with gloss overlay, `font-bold tracking-[-0.015em]`, close X button positioned top-right
- **Search input**: Native `<input>` with `bg-[#1c1c1f] border border-black/35 rounded-lg focus:outline-none focus:border-blue-500` in a `p-4` wrapper area
- **Character cards**: `bg-[#2e2e33] rounded-2xl` with the standard inset shadow stack, `hover:border-blue-500/30` transition
- **Avatar thumbnails**: `bg-[#1c1c1f] border border-black/35 rounded-xl`
- **Text**: Name in `font-bold text-white`, tags in `text-xs text-zinc-400`, "Import" label in `text-[10px] text-zinc-500 uppercase tracking-wider font-bold`

### Step 2: Update loading state shell
The `CharacterPickerWithRefresh` loading fallback (line 134-141) gets the same builder shell treatment.

### Step 3: No consumer changes needed
The exported function signatures (`CharacterPicker`, `CharacterPickerWithRefresh`) and their props remain identical.

