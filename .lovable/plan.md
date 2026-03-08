

# Plan: Add "App Style Restructuring" Page to Style Guide Sidebar

## What
Add a new navigation button in the Style Guide's left sidebar called **"App Style Restructuring"** that switches the main content area to a blank page — a dedicated space for documenting styling progress, consolidating changes, and planning next steps.

## Changes

### `src/components/admin/styleguide/StyleGuideTool.tsx`

1. **Add state**: `activePage: 'guide' | 'restructuring'` (default `'guide'`) to toggle between the style guide content and the new blank page.

2. **Sidebar button** (desktop nav, after the section buttons but before the "Design System v1.0" footer, ~line 285): Add a divider line and an "App Style Restructuring" button styled consistently with existing nav items but visually distinct (e.g. different icon dot color or a small document icon). Clicking sets `activePage` to `'restructuring'`.

3. **Main content area** (~line 292): Wrap the existing header + content in a conditional `{activePage === 'guide' && ...}`. Add a new branch `{activePage === 'restructuring' && ...}` that renders a blank page with:
   - Same slate-blue header bar (`#4a5f7f`) with title "App Style Restructuring"
   - A subtitle like "Document progress, consolidate changes, and plan next steps"
   - Empty content area with a placeholder message: "No notes yet. This page will be used to track styling progress across sessions."

4. **Narrow/mobile nav** (~line 246): Add the same button to the horizontal scrollable nav for consistency.

5. **Active section highlight**: When on the restructuring page, deselect all section buttons (set `activeSection` to empty/null).

No database changes needed — this is purely a UI page for now.

