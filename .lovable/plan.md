

## Plan: Darken Header Buttons to Inner Tray Color

Change the background color of the four Story Builder header buttons (Import, Export, Finalize and Close, Save Draft) from `#3c3e47` to `#2e2e33`, and update hover/active to `#363639`. All other styling (shadows, text color, border-0, rounded-xl, etc.) stays identical.

### Edits (all in `src/pages/Index.tsx`)

Four buttons — swap `bg-[#3c3e47]` → `bg-[#2e2e33]` and `hover:bg-[#44464f] active:bg-[#44464f]` → `hover:bg-[#363639] active:bg-[#363639]`.

