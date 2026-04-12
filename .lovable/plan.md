
Fix the App Architecture back button by copying the exact chevron already used in your app, not a Lucide arrow.

What I verified
- `src/pages/style-guide/app-architecture.tsx` currently uses `ArrowLeft` from `lucide-react`.
- Your existing back-chevron pattern is the inline SVG chevron used in:
  - `src/pages/Index.tsx`
  - `src/pages/style-guide/ui-audit.tsx`

Exact change
- File: `src/pages/style-guide/app-architecture.tsx`
- Replace the current `ArrowLeft` icon inside the back button with the exact same inline SVG chevron markup used in `Index.tsx` / `ui-audit.tsx`:
  ```tsx
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 18-6-6 6-6" />
  </svg>
  ```
- Keep the existing button placement and navigation target:
  - `onClick={() => navigate("/?tab=admin&adminTool=style_guide")}`
- Remove the `ArrowLeft` import if it becomes unused.

Scope
- One file only: `src/pages/style-guide/app-architecture.tsx`

Expected result
- The App Architecture header will use the exact same visible chevron shape already used elsewhere in your app, instead of a different arrow icon.
