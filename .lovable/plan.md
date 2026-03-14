

## Move Controlled By / Character Role Toggles Next to Avatar

The toggles currently sit below the avatar grid in the "below grid" section. They should move into the right column next to the avatar image, below the Age / Sex row, filling the empty space highlighted in the mockup.

### Changes in `src/components/chronicle/CharactersTab.tsx`

1. **Cut** the `grid grid-cols-2 gap-3` block containing Controlled By and Character Role toggles (lines 1430-1465) from the "below grid" section.

2. **Paste** that block into the right column (after the Age/Sex grid at line 1411, before the closing `</div>` at line 1412), so it appears below Age/Sex and still next to the avatar.

No styling changes needed — the existing `grid grid-cols-2 gap-3` layout will work in the new position.

