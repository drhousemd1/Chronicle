

# Content Themes UI Enhancement

## Changes

### 1. Add dark background containers behind tag groups

Wrap the tag badges (and the "+ Add custom" button) in each `CategorySelector` and `StoryTypeSelector` with a darker recessed container using the same styling as the HintBox: `bg-zinc-900 rounded-xl p-4 border border-white/5`.

Currently, the tags sit directly on the `#2a2a2f` background. Adding this container creates visual separation and makes the tag badges pop.

### 2. Unify Custom Tags section with other sections

Replace the current Custom Tags UI (text input + "Add" button) with the same pattern used by all other sections: a dark `bg-zinc-900` container showing existing tags (with X remove buttons) and a `+ Add custom` dashed button that reveals an inline input on click. This makes all six subsections visually identical.

## Technical Details

### File: `src/components/chronicle/ContentThemesSection.tsx`

**CategorySelector component (lines 72-155)**:
- Wrap the `flex flex-wrap gap-2` div (line 78) containing tags and the Add custom button inside a new `bg-zinc-900 rounded-xl p-4 border border-white/5` container

**StoryTypeSelector component (lines 158-192)**:
- Wrap the `flex gap-2` div (line 169) containing SFW/NSFW buttons inside the same `bg-zinc-900 rounded-xl p-4 border border-white/5` container

**CustomTagsSection component (lines 196-262)**:
- Remove the text input + "Add" button layout entirely
- Replace with a `bg-zinc-900 rounded-xl p-4 border border-white/5` container that shows:
  - Existing custom tags as removable badges (same as current)
  - A `+ Add custom` dashed button (matching the other sections) that toggles an inline text input on click

This is a single-file change with no logic changes -- purely wrapping elements in background containers and restyling the Custom Tags input to match the other sections.

