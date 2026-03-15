

## Fix: Match Header Buttons to Add/Create Tile Exactly

The Add/Create tile uses `bg-[#3a3a3f]/40 hover:bg-[#3a3a3f]/60`. The header buttons use `bg-[#3c3e47] hover:bg-[#44464f]` — a completely different color. The fix is to use the exact same Tailwind classes from the source tile. No math, no approximation.

### Changes

**File:** `src/pages/Index.tsx` — Lines 2025, 2034, 2068, 2099

On all four buttons (Import, Export, Finalize and Close, Save Draft), replace:
- `bg-[#3c3e47]` → `bg-[#3a3a3f]/40`
- `hover:bg-[#44464f]` → `hover:bg-[#3a3a3f]/60`
- `active:bg-[#44464f]` → `active:bg-[#3a3a3f]/60`

Everything else stays identical — same shadow stack, same rounded-xl, same text color, same font, same focus ring.

