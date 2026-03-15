
Goal: make Chat Interface tile image expand/collapse behavior identical to Story Builder tile behavior and remove the “shoot up then bounce back” effect.

1) Root cause found (line-by-line diff)
- Story Builder (`src/components/chronicle/WorldTab.tsx`, CharacterRosterTile image):
  - Uses `transition-[height,object-fit] duration-300`
  - Expanded: `h-auto object-contain object-top`
  - Collapsed: `h-full object-cover`
  - `objectPosition` applied only when collapsed
- Chat Interface (`src/components/chronicle/ChatInterfaceTab.tsx`, `renderCharacterCard` image):
  - Uses `transition-all duration-300` (this animates `object-position`)
  - Expanded only uses `h-auto` (not matching Story Builder)
  - Collapsed uses `h-full object-cover object-top`
- This mismatch is exactly why collapse can visually overshoot/bounce before settling.

2) Minimal implementation (no redesign, no new systems)
- File: `src/components/chronicle/ChatInterfaceTab.tsx`
- In `renderCharacterCard`, replace the `<img>` class logic with the Story Builder class string pattern exactly:
  - from: `transition-all duration-300 ...`
  - to: `transition-[height,object-fit] duration-300 ...`
  - use expanded/collapsed branches identical to Story Builder:
    - expanded: `h-auto object-contain object-top`
    - collapsed: `h-full object-cover`
- Keep existing `style={isExpanded ? undefined : { objectPosition: ... }}` behavior.
- Do not touch tile mapping math, persistence, dropdown actions, or card controls.

3) Why this is the correct “non-guessing” fix
- It is the exact behavior pattern already proven on Story Builder.
- It directly addresses the bounce mechanism by preventing `object-position` animation while still animating height/object-fit.

4) Technical details
- No backend/database/auth changes.
- No RLS or schema changes.
- No component extraction/refactor.
- Single behavioral patch in one render block.

5) Validation checklist (focused)
- In Chat Interface, on a main character tile:
  - Expand → collapse repeatedly (5–10 times): no upward “shoot then bounce.”
  - Focus point after collapse stays stable and matches Story Builder for same character.
- Verify on at least:
  - portrait avatar
  - landscape avatar
- Confirm repositioned tiles still keep their saved focus after expand/collapse.

6) Documentation update (required by project guide rules)
- Update `docs/guides/chat-interface-page-structure-guide.md` in-place:
  - Section 9 (Styling): note that chat character tile image now uses `transition-[height,object-fit]` and does not animate object-position.
  - Section 12 (Known Issues): add RESOLVED entry for tile bounce/refocus regression with date and fix summary.
  - Update “Last updated” line.
