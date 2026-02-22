

# Fix Admin Page Loading

## Problem
`React.lazy(() => import("@/pages/Admin"))` fails with "Failed to fetch dynamically imported module" because the Vite dev server times out serving the module. This causes the white screen every time you click the Admin link.

## Solution
Reverse the lazy-loading strategy: import `AdminPage` directly in `Index.tsx` (it was working before), but lazy-load the heavy sub-tools *inside* `Admin.tsx` so they don't bloat the initial load.

## Changes

### 1. `src/pages/Index.tsx`
- Replace `React.lazy(() => import("@/pages/Admin"))` with a direct import: `import { AdminPage } from "@/pages/Admin"`
- Remove the `React.Suspense` wrapper around `<AdminPage />`

### 2. `src/pages/Admin.tsx`
- Remove the direct imports of `AppGuideTool` and `ImageGenerationTool` from the top of the file
- Lazy-load them inside the component using `React.lazy`:
  - `const LazyAppGuide = React.lazy(() => import("@/components/admin/guide/AppGuideTool").then(m => ({ default: m.AppGuideTool })))`
  - `const LazyImageGen = React.lazy(() => import("@/components/admin/ImageGenerationTool").then(m => ({ default: m.ImageGenerationTool })))`
- Wrap their render locations in `React.Suspense` with a loading fallback
- The main Admin card grid (which is what loads first) stays lightweight -- it's just divs and a Sparkles icon

### Why This Works
- The Admin card grid loads instantly with no heavy dependencies
- `AppGuideTool` (which pulls in Separator, ScrollArea) only loads when you click "App Guide"
- `ImageGenerationTool` (which pulls in Collapsible, Input, Textarea) only loads when you click "Image Generation"
- No dynamic import at the `Index.tsx` level, so no fetch failure on the main page

