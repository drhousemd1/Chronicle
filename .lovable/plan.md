

# Status: CharacterEditModal Rebuild is Complete

The previous (cancelled) sessions actually did complete the full rebuild. The file at 1715 lines now contains:

- Sidebar navigation with `activeTraitSection` routing and `ModalNavButton` components
- Builder-matched `CollapsibleSection` with gradient headers (`from-[#5a7292] to-[#4a5f7f]`), gloss overlay, and inset shadow stack
- Builder-matched `HardcodedRow` / `ModalExtraRow` with `bg-[#1c1c1f] border-t border-black/35` and aligned Lock icons
- Basics section with 2-column grid, `120px 1fr` age/identity sub-grid, builder toggle trays
- `AddRowButton` using `bg-[#3c3e47]` builder surface
- All 12 built-in sections + custom sections routed through sidebar
- No legacy tokens remain (`border-ghost-white`, `bg-zinc-900/50`, `bg-[hsl(var(--ui` — all cleared)

## Remaining Fix: Console Ref Warning

There are two `Function components cannot be given refs` warnings:

1. **`ChangeNameModal`** (line 1698) — `ChangeNameModal` is a function component rendered as a child of `Dialog`. Radix Dialog tries to pass a ref to direct children. Fix: wrap with `React.forwardRef` in `ChangeNameModal.tsx`.

2. **`Dialog` ref on `CharacterEditModal`** — same pattern, the parent renders `<CharacterEditModal>` where Radix tries to forward a ref.

### Fix — `src/components/chronicle/ChangeNameModal.tsx`
Wrap the component export with `React.forwardRef` so Radix can attach its ref without warning.

### Files Changed
- `src/components/chronicle/ChangeNameModal.tsx` (add forwardRef)

