

# Fix Chat Interface Layout — Restore Correct Breakpoint

## Problem
The Codex changes changed the responsive breakpoint from `lg` (1024px) to `xl` (1280px) across all three main screens. Your preview viewport is 1130px wide, which is above `lg` but below `xl`, so the sidebar now stacks vertically on top of the chat instead of sitting beside it.

## What Changed
All `xl:` responsive classes need to revert to `lg:` in three files:

### 1. `src/components/chronicle/ChatInterfaceTab.tsx`
- Line 4187: `flex-col xl:flex-row` → `flex-col lg:flex-row`
- Line 4191: All `xl:` prefixes → `lg:` (width, max-height, height, border)

### 2. `src/features/story-builder/StoryBuilderScreen.tsx`
- Line 435: `flex-col xl:flex-row` → `flex-col lg:flex-row`

### 3. `src/features/story-builder/sidebar/StoryRosterSidebar.tsx`
- Line 42: All `xl:` prefixes → `lg:` (width, height, max-height)

### 4. `src/features/character-builder/CharacterBuilderScreen.tsx`
- Line 873: `flex-col xl:flex-row` → `flex-col lg:flex-row`
- Line 875: All `xl:` prefixes → `lg:`

## Result
Sidebar returns to left-side vertical layout at 1024px+ (covers your 1130px viewport). Below 1024px it still stacks for true mobile/tablet.

