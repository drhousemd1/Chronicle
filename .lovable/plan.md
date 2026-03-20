

# Standardize Subheading-to-Input Spacing Across All Builders

## Problem
Every subheading label uses a different gap to the input field below it:
- `mb-1` (4px): Story Name, Brief Description, Story Premise, Primary Locations, Opening Dialog, all CharactersTab basics labels, Custom AI Rules labels
- `space-y-1.5` (6px): StoryCardView Scenario/Premise, Controlled By / Character Role toggles
- `space-y-3` (12px): WorldTab custom section titles, CharactersTab custom SECTION TITLE headings
- `space-y-6` (24px): Additional Entries heading

The user confirmed the StoryCardView `space-y-1.5` (6px) spacing is correct. All subheading-to-input gaps must be standardized to **6px** (`mb-1.5` or equivalent).

## Changes

### 1. WorldTab.tsx

**FieldLabel component (line 405)**: Change `mb-1` to `mb-1.5` on the wrapper div. This fixes Story Name, Brief Description, and Story Premise.

**Primary Locations label (line 821)**: Change `mb-1` to `mb-1.5`.

**Custom section title (lines 889-912)**: The title row is a sibling inside `space-y-3`, producing 12px gap. Restructure: remove `space-y-3` from the outer div, give the title row `mb-1.5`, and wrap the items + button in a new `div className="space-y-3"`.

**Opening Dialog label (line 1132)**: Change `mb-1` to `mb-1.5`.

**Starting Day & Time label (line 1165)**: Change `mb-1` to `mb-1.5`.

**Dialog Formatting label (line 1510)**: Change `mb-1` to `mb-1.5`.

**Custom Rules label (line 1526)**: Change `mb-1` to `mb-1.5`.

**Art Style Selection label (line 1445)**: Change `mb-1` to `mb-1.5`.

**Additional Entries heading (line 1539)**: Currently uses `<h3>` as a sibling in `space-y-6`. Change to have `mb-1.5` and remove from the spacing flow, or wrap the grid below separately.

### 2. CharactersTab.tsx

**All basics labels** — Name (line 1525), Nicknames (line 1529), Age (line 1534), Sex/Identity (line 1538), Sexual Orientation (line 1543), Location (line 1588), Current Mood (line 1592): Change `mb-1` to `mb-1.5`.

**Role Description label (line 1597)**: Change `mb-1` to `mb-1.5`.

**Custom SECTION TITLE rows (line 2030)**: Currently inside `space-y-3` producing 12px gap between title and content. Change the item wrapper from `space-y-3` to `space-y-1.5` so the gap between subheading and content is 6px. Then wrap the outer items list (line 2016) to maintain `space-y-3` between separate items.

### 3. StoryCardView.tsx

Already uses `space-y-1.5` for Scenario/Premise — no change needed there.

**Verify** all other label-to-input gaps in this file also use 6px.

## Summary

- **Standard**: 6px (`mb-1.5`) between every subheading label and the input field directly below it
- **Files**: `WorldTab.tsx`, `CharactersTab.tsx`, `StoryCardView.tsx`
- **Total label gaps to fix**: ~15 instances of `mb-1` → `mb-1.5`, plus 2 structural fixes where titles are siblings inside `space-y-3` containers

