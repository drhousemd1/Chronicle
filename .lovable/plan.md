

## Fix Physical Appearance Container — Match HTML Reference

### Differences Found

| Element | HTML Reference | Current Code |
|---|---|---|
| **Outer container** | `bg-[#2a2a2f] rounded-[24px]` no border, complex `box-shadow` with inset highlights | Has `border border-[#4a5f7f]`, simpler shadow |
| **Section header** | `background: linear-gradient(180deg, #5a7292, #4a5f7f)`, `border-top: 1px solid rgba(255,255,255,0.20)`, no `border-bottom`, gloss `::after` overlay, `shadow-lg` | Flat `bg-[#4a5f7f]`, `border-b border-[#4a5f7f]`, no gradient, no gloss sheen |
| **Section header title** | `font-weight: 700` (bold), `letter-spacing: -0.015em` | `font-bold` (same), but missing negative tracking |
| **Inner card** | `bg-[#2e2e33] rounded-2xl` no border, complex inset box-shadow | Has `border border-[#4a5f7f]`, no inset shadows |
| **HardcodedRow label** | `bg-[#1c1c1f]` no border, `border-top: 1px solid rgba(0,0,0,0.35)`, `w-[40%]`, `font-size: 12px`, `font-weight: 700` | `bg-zinc-900/50 border border-[#4a5f7f]`, `w-2/5`, `text-xs font-bold` |
| **HardcodedRow input** | `bg-[#1c1c1f]` no border, `border-top: 1px solid rgba(0,0,0,0.35)`, `text-sm`, `placeholder: #52525b` | `bg-zinc-900/50 border border-[#4a5f7f]`, similar text styling |
| **Add Row button** | `bg-[#3c3e47]`, `border: none`, `rounded-xl`, `h-10`, `text-xs font-bold text-blue-500`, complex inset shadow | Dashed border style `border-2 border-dashed border-zinc-500`, no shadow surface |

### Changes to `src/components/chronicle/CharactersTab.tsx`

**1. HardcodedSection component (lines 409-433)**

Update outer container:
- Remove `border border-[#4a5f7f]`
- Add complex box-shadow: `shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)]`

Update header:
- Change from flat `bg-[#4a5f7f]` to gradient `bg-gradient-to-b from-[#5a7292] to-[#4a5f7f]`
- Remove `border-b border-[#4a5f7f]`, add `border-t border-white/20`
- Add gloss sheen `::after` pseudo-element (via an inner div since this is JSX): `absolute inset-0 bg-gradient-to-b from-white/[0.07] to-transparent pointer-events-none` stopping at 30%

Update inner card:
- Remove `border border-[#4a5f7f]`
- Add inset box-shadow: `shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)]`

**2. HardcodedRow component (lines 444-477)**

Update label:
- Change `bg-zinc-900/50 border border-[#4a5f7f]` to `bg-[#1c1c1f] border-t border-black/35 border-x-0 border-b-0`
- Keep `text-xs font-bold text-zinc-400 rounded-lg uppercase tracking-widest`

Update textarea/input:
- Change `bg-zinc-900/50 border border-[#4a5f7f]` to `bg-[#1c1c1f] border-t border-black/35 border-x-0 border-b-0`

**3. ExtraRow component (lines 486-520)**

Same label and input styling changes as HardcodedRow.

**4. Add Row button (line 1516)**

Change from dashed border style to shadow surface button:
- From: `border-2 border-dashed border-zinc-500 hover:border-blue-500 hover:bg-blue-500/5 rounded-xl`
- To: `bg-[#3c3e47] border-0 rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:brightness-115`

This same Add Row button change applies to all HardcodedSection instances (lines 1516, 1539, 1563, 1604, 1646, 1674, 1702, 1730, 1758).

