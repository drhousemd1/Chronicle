
Goal: Make the two character-add buttons visually match the existing builder buttons and display exactly:
- (+) Main Character
- (+) Side Character

Implementation plan (single file: `src/components/chronicle/WorldTab.tsx`):

1) Normalize button style to the page’s standard builder variant  
- Update `AddCharacterPlaceholder` to reuse the same visual recipe as “Add Location”:
  - `h-10`, `rounded-xl`, `text-xs font-bold`
  - `bg-[#3c3e47]` + `hover:brightness-110`
  - shared shadow stack: `shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)]`
  - `transition-all active:scale-95`
- Keep red error treatment when publish validation fails (`border-red-500 ring-2 ring-red-500`).

2) Remove icon rendering ambiguity  
- Remove the Lucide `<Plus />` node from this placeholder.
- Render literal text labels so it can’t visually degrade into a dot/bullet:
  - `"(+) Main Character"`
  - `"(+) Side Character"`

3) Update call sites  
- Change the two uses of `AddCharacterPlaceholder` to pass the full final text (including `(+)`), instead of separate icon+label composition.
- Keep existing click behavior (`setIsCharacterCreationOpen(true)`) unchanged.

4) Quick consistency pass  
- Verify no leftover placeholder-specific styling remains (old dark mini-card styles, custom icon box, etc.).
- Ensure final buttons align with neighboring controls in spacing and typography in the roster column.

Technical note:
- This is a targeted style/markup correction only; no logic, data, or backend behavior changes are needed.
