

# Restyle Chooser Modals to Match Premium Dark Theme

## Problem
Four "chooser" modals use the old `bg-zinc-900 border-ghost-white` flat styling with colored icon backgrounds. They need to match the premium dark theme used across all other restyled modals.

## Reference (from HTML mockup, lines 1209-1271)
The updated design uses:
- **Outer shell**: `bg-[#2a2a2f]`, `rounded-3xl`, borderless, multi-layer shadow stack
- **Header**: Slate blue gradient (`from-[#5a7292] to-[#4a5f7f]`) with gloss sheen overlay, uppercase title with `tracking-widest font-black text-[13px]`
- **Option cards**: `bg-[#2e2e33]`, `rounded-2xl`, inner shadow stack, `border-2 border-transparent` at rest, `border-2 border-blue-500` when clicked/hovered (blue accent) or `border-2 border-purple-500` (purple accent)
- **Icon containers**: Recessed dark treatment — `bg-[#1c1c1f]`, `rounded-[14px]`, `w-12 h-12`, inset shadow, white icons instead of colored tinted backgrounds
- **No subtitle text** under the header (the "Select an option" line is removed; the header alone is sufficient)
- Default Radix close button hidden (already done)

## Affected Files (4 modals)

| File | Modal Title |
|------|-------------|
| `CharacterCreationModal.tsx` | Character Creation |
| `CustomContentTypeModal.tsx` | Content Type |
| `EnhanceModeModal.tsx` | Enhancement Style |
| `StyleGuideEditsModal.tsx` | KeepOrEditModal |

All four share the exact same structure: a header with title + subtitle, then a 2-column grid of option buttons. Each gets the same treatment.

## Changes Per Modal

1. **DialogContent** — replace `sm:max-w-md bg-zinc-900 border-ghost-white p-0 gap-0` with premium shell: `sm:max-w-[520px] bg-[#2a2a2f] border-0 rounded-3xl p-0 gap-0 shadow-[0_20px_50px_rgba(0,0,0,0.55),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)] overflow-hidden`

2. **Header** — replace plain `px-6 pt-5 pb-3` div with slate blue gradient header bar (same pattern as AI generation modals), with `text-[13px] font-black uppercase tracking-widest` title. Remove subtitle paragraph.

3. **Option cards** — replace `border border-ghost-white bg-zinc-800/50 hover:border-blue-500/50 hover:bg-blue-500/10` with `bg-[#2e2e33] border-2 border-transparent hover:border-blue-500` (or purple) + inner shadow stack. Update padding from `p-5 rounded-2xl` to `p-5 rounded-2xl` (keep radius, add shadow).

4. **Icon containers** — replace colored tint backgrounds (`bg-blue-500/20`) with recessed dark treatment: `w-12 h-12 rounded-[14px] bg-[#1c1c1f] border-t border-black/35 shadow-[inset_0_2px_6px_rgba(0,0,0,0.40)]`. Icons change to `text-white` instead of `text-blue-500`/`text-purple-400`.

5. **Grid container** — update from `px-6 pb-6` to `p-4` with `gap-3`.

