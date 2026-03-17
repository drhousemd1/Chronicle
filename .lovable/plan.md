

# Fix CharacterPicker Search Bar Contrast

## Problem
The search bar wrapper uses `bg-[#2b2b2e]` with `border border-[#2b2b2e]`, which is virtually the same shade as the modal body (`bg-[#2a2a2f]`). This makes it invisible against the padding area.

## Fix
In `src/components/chronicle/CharacterPicker.tsx` line 70, change the search wrapper from:
- `bg-[#2b2b2e] rounded-full p-1 border border-[#2b2b2e]`

To:
- `bg-[#1c1c1f] rounded-full p-1 border border-black/35`

This uses the standard dark input surface (`bg-[#1c1c1f]` with `border border-black/35`) from the builder input spec, providing clear contrast against the `bg-[#2a2a2f]` modal body.

One line change in one file.

