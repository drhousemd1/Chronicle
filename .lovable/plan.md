

## Add Light/Dark Mode Toggle to App Guide

A small sun/moon toggle button will be added to the left of the "Save" button in the App Guide header. It controls the theme for the entire guide tool (sidebar, editor, search bar) without affecting the rest of the app.

### Changes

**1. `src/pages/Index.tsx`**
- Add a `guideTheme` state (`'dark' | 'light'`, default `'dark'`)
- Render a toggle button (Sun/Moon icon) to the left of the Save button inside the `tab === "admin" && adminActiveTool === "app_guide"` block
- Pass `guideTheme` down through `AdminPage` props

**2. `src/pages/Admin.tsx`**
- Accept and forward `guideTheme` prop to `AppGuideTool`

**3. `src/components/admin/guide/AppGuideTool.tsx`**
- Accept `theme` prop, pass it to both `GuideSidebar` and `GuideEditor`
- Update the page header bar colors to be theme-conditional (black vs white bg, matching text/border)

**4. `src/components/admin/guide/GuideSidebar.tsx`**
- Accept `theme` prop
- Swap all hardcoded dark hex colors for conditional values:
  - Background: `#111` (dark) / `#f5f5f5` (light)
  - Text: `#9CA3AF` / `#6B7280` (dark) / `#374151` / `#6B7280` (light)
  - Active item: `#2a2a2a` bg (dark) / `#e5e7eb` bg (light)
  - Borders and dividers adjust accordingly

**5. `src/components/admin/guide/GuideEditor.tsx`**
- Accept `theme` prop
- Create two sets of `markdownComponents` (or make them theme-aware):
  - **Light mode**: black/gray text on white, light borders, light code backgrounds
  - **Dark mode**: current styling (unchanged)
- Title bar: `bg-black` / `bg-white`, text colors flip
- Edit mode textarea: `bg-[#0d0d0d]` / `bg-white`, text color flips
- Line gutter: `bg-[#1e1e1e]` / `bg-gray-100`
- Search bar: backgrounds and text colors flip
- Empty state: colors flip
- Import both `highlight.js/styles/github-dark.css` and `highlight.js/styles/github.css`, apply the correct one via a wrapper class (e.g., `.guide-light pre` vs `.guide-dark pre`)

**6. `src/index.css`**
- Add scoped highlight.js theme overrides so light/dark code blocks render correctly based on a parent class

### Technical Notes
- Theme is local state (not persisted) -- defaults to dark each session
- No external dependencies needed
- The toggle uses Lucide `Sun` and `Moon` icons already available in the project

