
I hear you. You’re right: the Personality section is still visually inconsistent with the updated Basics/Physical Appearance containers in three concrete places (outer border, split toggle style, add button style). I’ll fix that by making Personality reuse the same visual tokens/patterns already used in `CharactersTab` hardcoded sections.

## Scope (only this component)
- File: `src/components/chronicle/PersonalitySection.tsx`
- No behavior/model changes, styling-only parity updates.

## Implementation plan

1. Remove the remaining outer border from the Personality container
- Update the root wrapper class to match `HardcodedSection` shell behavior.
- Specifically remove `border border-[#4a5f7f]` from the outer container.
- Keep the same rounded corners and inset+drop shadow stack already in place.

2. Replace the current split toggle with the same segmented control styling used in Basics
- Update the split toggle wrapper from:
  - `bg-zinc-900/50 ... border border-[#4a5f7f]`
- To the Basics segmented shell:
  - `flex p-1.5 bg-[#3c3e47] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)]`
- Update each toggle button to match Basics active/inactive treatment:
  - Active: `bg-[#3b82f6] text-white shadow-[0_2px_8px_rgba(59,130,246,0.35)]`
  - Inactive: `bg-[#3f3f46] text-[#a1a1aa] hover:text-zinc-300`
- Keep current click handlers and split-mode logic unchanged.

3. Replace the dashed “Add Trait” button with the same “Add Row” button style used in adjacent containers
- Update from dashed-outline style to:
  - `w-full h-10 text-xs font-bold text-blue-500 hover:text-blue-300 bg-[#3c3e47] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:brightness-110 transition-all`
- Keep label as “Add Trait” (functionality remains add personality trait row).

4. Preserve all functional behavior
- No changes to:
  - enhance AI actions
  - trait CRUD logic
  - split vs standard data mapping
  - readOnly rendering rules

## Technical details (exact parity targets)
- Reference patterns in `src/components/chronicle/CharactersTab.tsx`:
  - Segmented control visuals (Basics: Controlled By / Character Role)
  - Add button visuals (`Add Row` buttons in hardcoded sections)
  - Borderless section shell style (`HardcodedSection`)
- Personality component impact:
  - This also affects any other place rendering `PersonalitySection` (including modal usage), ensuring consistency app-wide without duplicate style forks.

## Validation checklist
- Personality container no longer shows the outer border ring.
- Split toggle visually matches Basics segmented controls (same shell, active blue state, inactive dark state).
- “Add Trait” visually matches “Add Row” style from other containers.
- Split toggle and Add Trait still work end-to-end.
