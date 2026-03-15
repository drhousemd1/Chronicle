

## Fix: Header Buttons Should Use Standard Shadow-Surface Style

The header buttons (Import, Export, Finalize and Close, Save Draft) use `bg-[#303035]` — a color that exists nowhere else in the app's button system. Every other action button on the Story Builder page uses the established shadow-surface shell:

```
bg-[#3c3e47]  hover:bg-[#44464f]  active:bg-[#44464f]
```

This is documented in memory as the unified button standard and is used in:
- CoverImageActionButtons (Upload Image)
- StoryCardView (Add Row, Add Text Field)
- StoryGoalsSection (Add Phase, Add Goal)
- ArcBranchLane (Add Step)

### Changes

**File:** `src/pages/Index.tsx` — Lines 2025, 2034, 2068, 2099

On all four buttons, replace:
- `bg-[#303035]` → `bg-[#3c3e47]`
- `hover:bg-[#343439] active:bg-[#343439]` → `hover:bg-[#44464f] active:bg-[#44464f]`

Everything else (shadow stack, rounded-xl, text color, font, focus ring, scale) stays identical.

