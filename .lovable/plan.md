

# Unify "Add" Button Styling Across All Sections

## Summary

Two groups of buttons need to meet in the middle:

- **Physical Appearance, Currently Wearing, Preferred Clothing, Personality** -- their `+ Add Row` / `+ Add Trait` buttons currently use a thin, faint dashed border (`border border-blue-500/30`). These will be updated to use the heavier, more visible dashed outline from the Goals section (`border-2 border-dashed border-zinc-500`).

- **Goals and Desires (Character + Story)** -- their `+ Add New Goal` / `+ Add Story Goal` buttons currently use larger text and icons. These will be updated to use the smaller `text-sm` size and `w-4 h-4` icons matching the other sections.

## What the unified button will look like

All "add" buttons will share this style:
```
border-2 border-dashed border-zinc-500 text-blue-400 hover:border-blue-400
text-sm font-medium py-2.5 rounded-xl
```

## Changes

### 1. `src/components/chronicle/CharactersTab.tsx`

Update the four `+ Add Row` buttons (Physical Appearance, Currently Wearing, Preferred Clothing, Custom Categories) from:
- `border border-dashed border-blue-500/30`

To:
- `border-2 border-dashed border-zinc-500`

### 2. `src/components/chronicle/PersonalitySection.tsx`

Update the `+ Add Trait` button from:
- `border border-dashed border-blue-500/30`

To:
- `border-2 border-dashed border-zinc-500`

### 3. `src/components/chronicle/CharacterGoalsSection.tsx`

Update the `+ Add New Goal` button:
- Reduce text from default size to `text-sm`
- Reduce icon from `h-5 w-5` to `w-4 h-4`
- Change padding from `py-3` to `py-2.5`
- Keep the existing `border-2 border-dashed border-zinc-500` (already correct)

### 4. `src/components/chronicle/StoryGoalsSection.tsx`

Same changes as CharacterGoalsSection -- reduce text to `text-sm`, icon to `w-4 h-4`, padding to `py-2.5`.

### 5. `src/components/chronicle/CharacterEditModal.tsx`

Update the four `+ Add Row` buttons in the modal to match the heavier border (`border-2 border-dashed border-zinc-500`), keeping them consistent with the main tab.

---

No structural or logic changes -- purely class name updates on existing buttons.
