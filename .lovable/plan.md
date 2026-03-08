

# Plan: Make Style Guide Header Scroll with Content

Remove `position: sticky` and `top: 0` from the Style Guide header in `src/components/admin/styleguide/StyleGuideTool.tsx` so it scrolls naturally with the page content instead of staying fixed.

### File: `src/components/admin/styleguide/StyleGuideTool.tsx`
- Remove `position: 'sticky'`, `top: 0`, and `zIndex: 60` from the header div's inline style object

