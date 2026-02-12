

# Fix: Nested Input Styling and Scrolling on Scenario Builder

## Problem
Every text field on the Scenario Builder page shows "a box inside a box" -- a styled rectangle container with another styled input element inside it. Text areas also scroll instead of expanding downward.

## Root Cause
The `Input` and `TextArea` components in `UI.tsx` apply `className` to BOTH a wrapper `<div>` AND the inner element. When WorldTab passes dark-theme classes like `bg-zinc-900/50 border-zinc-700`, both the wrapper div and the inner input render with borders and backgrounds, creating the nested bubble effect. The inner input also has hardcoded light-theme base styles (`bg-slate-50`, `border-slate-200`, `rounded-2xl`) that clash with the dark theme.

The Character Builder works correctly because it uses `AutoResizeTextarea` -- a plain `<textarea>` with no wrapper div.

## Solution
Replace `Input` and `TextArea` from UI.tsx with `AutoResizeTextarea` in WorldTab.tsx for all inline table fields (locations, custom content items, section titles). For the larger text areas (Scenario, Setting Overview, Opening Dialog), add `autoResize` prop to existing `TextArea` calls so they expand instead of scrolling.

### Detailed Changes

**File: `src/components/chronicle/WorldTab.tsx`**

1. **Locations section (lines 511-531)**: Replace `Input` for location label and `TextArea` for location description with `AutoResizeTextarea` styled identically to CharactersTab's custom sections.

2. **Custom World Content sections (lines 566-612)**: Replace `Input` for section title, `Input` for item label, and `TextArea` for item value with `AutoResizeTextarea`.

3. **Large text areas -- Scenario, Setting Overview, Opening Dialog (lines 496, 500, 690)**: Add `autoResize` prop to `TextArea` calls so they expand vertically instead of scrolling.

4. **Scenario Name input (line 442)**: Replace `Input` with `AutoResizeTextarea` styled as a single-line field.

5. **Brief Description textarea (line 446)**: Add `autoResize` to the `TextArea` call.

6. **Add a local `AutoResizeTextarea` component** to WorldTab.tsx (same pattern as CharactersTab) -- a simple `<textarea>` with auto-height behavior, using `cn()` for class merging, and no wrapper div.

### What This Fixes
- Eliminates the double-border/double-background "bubble in bubble" effect
- Text areas expand downward as the user types instead of scrolling
- Matches the visual consistency of the Character Builder page
- Label/description proportions work correctly since there's no wrapper div interfering with width classes

### Files Changed

| File | Change |
|------|--------|
| `src/components/chronicle/WorldTab.tsx` | Add local AutoResizeTextarea; replace Input/TextArea with AutoResizeTextarea for inline fields; add autoResize to large TextAreas |

