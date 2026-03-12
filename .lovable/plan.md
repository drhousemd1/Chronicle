

# Update Remaining Inside Elements of Story Card to Slate Blue

Two `border-ghost-white` references remain inside the Story Card container that were not updated:

## Changes: `src/components/chronicle/WorldTab.tsx`

1. **Line 511** — Section header bottom border (`border-b border-ghost-white` on the slate blue header bar) → `border-b border-[#4a5f7f]`

2. **Line 539** — Cover image solid border when an image is present (`border-2 border-ghost-white`) → `border-2 border-[#4a5f7f]`

Both are inside the Story Card section (lines 509-634). No other sections are touched.

