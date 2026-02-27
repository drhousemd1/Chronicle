

# Fix Character Card Name Visibility and Add Sex/Age Display

## Problem 1: Names invisible in non-hovered state
The character cards use `text-slate-800` for names on a `bg-white/30` (30% white) background over the dark sidebar. This creates extremely poor contrast -- the dark text is nearly invisible against the semi-transparent card. Only on hover (when background becomes solid `bg-white`) do names become readable, as shown in the James card in the second screenshot.

**Fix**: Change the name text color to `text-white` (matching the dark sidebar context), and switch to `text-slate-800` on hover when the card background becomes solid white. This mirrors how the "AI" badge is always readable.

## Problem 2: Add Sex and Age below the name
Both `Character` and `SideCharacter` types already have `age` and `sexType` fields. These need to be displayed below the name on each card.

## Changes

**File: `src/components/chronicle/ChatInterfaceTab.tsx`** -- `renderCharacterCard` function (~line 2906)

1. Change the name `div` from static `text-slate-800` to `text-white group-hover:text-slate-800` so it's readable on both the translucent default and solid white hover states (add `group` class to the card's root div).
2. Add a new line below the name showing Sex and Age in a smaller, muted style:
   - Format: `{char.sexType} · {char.age}` (only show separator and fields that have values)
   - Style: `text-[11px] text-white/70 group-hover:text-slate-500` for the same contrast-switching behavior

**File: `src/components/chronicle/SideCharacterCard.tsx`** -- same treatment

1. Add `group` to the card root div
2. Change name text to `text-white group-hover:text-slate-800`
3. Add Sex/Age line below name: `{character.sexType} · {character.age}`
4. Style: `text-[11px] text-white/70 group-hover:text-slate-500`

## Technical Notes
- The `group` class enables hover-state propagation from the card container to child text elements
- Fields that are empty strings will be filtered out so only populated data shows (e.g., if only age is set, no dangling separator)
- The Badge (AI/User) already uses solid background colors so it remains unaffected
