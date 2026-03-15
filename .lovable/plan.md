

## Fix: Tab Key Should Only Navigate Between Text Fields

### Problem
The previous attempt added `tabIndex={-1}` to some icon buttons, but missed many others across WorldTab, CharactersTab, and sub-components. Even worse, this approach is fragile — every new button added in the future would need manual `tabIndex={-1}`, and toggle buttons like "Controlled By AI/User", section collapse buttons, category selector chips in ContentThemesSection, and many trash/delete/plus buttons were all missed.

### Root Cause
Relying on `tabIndex={-1}` on individual buttons is a whack-a-mole approach. The codebase has 100+ buttons across these two pages, and more get added regularly.

### Solution: Keyboard-Level Tab Override
Instead of hunting down every button, create a **single wrapper component** that intercepts Tab/Shift+Tab keypresses and programmatically jumps focus to the next/previous `<textarea>` or `<input type="text">` element within the container. This is a one-time fix that covers all current and future buttons.

### Implementation

**1. Create `src/components/chronicle/TabFieldNavigator.tsx`** (~30 lines)
- A simple wrapper `<div>` that listens for `onKeyDown` at the container level
- When `Tab` is pressed:
  - Query all `textarea, input:not([type=hidden]):not([type=file]):not([type=checkbox])` elements inside the container
  - Find the currently focused element's index
  - Focus the next (or previous if Shift+Tab) text field
  - Call `e.preventDefault()` to skip the default browser tab behavior
- This component takes `children` and renders a plain `<div>`

**2. Wrap WorldTab's main content area** in `<TabFieldNavigator>`
- Wrap the scrollable content div (the `<div className="flex-1 overflow-y-auto">` at line ~664) with `<TabFieldNavigator>`
- This covers: Story Card fields, World Core fields, locations, custom sections, Opening Dialog, Content Themes, and all their nested buttons

**3. Wrap CharactersTab's main content area** in `<TabFieldNavigator>`
- Wrap the scrollable content div (the `<div className="flex-1 overflow-y-auto scrollbar-thin bg-[#1a1b20]">` at line ~1387) with `<TabFieldNavigator>`
- This covers: Profile fields, Physical Appearance, Currently Wearing, Preferred Clothing, Personality, Tone, Background, Key Life Events, Relationships, Secrets, Fears, Character Goals, and all custom sections

### Why This Works
- Zero maintenance: new buttons are automatically skipped
- No need to audit every `<button>` or `<Button>` across 10+ component files
- Only applies to these two tabs (as requested)
- Does not affect mouse/touch — buttons remain fully clickable
- Standard pattern used by form-heavy applications

### What Changes
- 1 new file: `TabFieldNavigator.tsx` (~30 lines)
- 2 edits: wrap content areas in WorldTab.tsx and CharactersTab.tsx (2-line change each)

