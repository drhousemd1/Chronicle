

# Fix White Screen: Reduce Initial Module Load

## Problem
The app loads 150+ JavaScript modules on startup. The `Index.tsx` page directly imports `AdminPage`, which imports `AppGuideTool`, `GuideSidebar`, and their dependencies (including `@radix-ui/react-separator`). This creates a massive concurrent request waterfall that causes the Vite dev server to time out on some modules (504 errors), resulting in a white screen.

## Fix

### 1. Lazy-load AdminPage in Index.tsx
Change the direct import of `AdminPage` in `Index.tsx` to a `React.lazy()` dynamic import. This defers loading all admin-related code until the user actually navigates to the admin section.

```
// Before (loads admin code on every page visit):
import { AdminPage } from "@/pages/Admin";

// After (loads admin code only when needed):
const AdminPage = React.lazy(() =>
  import("@/pages/Admin").then(m => ({ default: m.AdminPage }))
);
```

### 2. Wrap AdminPage render in Suspense
Find where `<AdminPage ... />` is rendered in `Index.tsx` and wrap it in `React.Suspense` with a simple loading fallback.

## Why This Works
- The admin page is only used by admin users and only after they click the Admin tab
- Lazy loading removes ~10-15 modules from the initial load, reducing the request waterfall below the timeout threshold
- The App Guide editor itself is lightweight now (no BlockNote), so it will load quickly when actually needed
- No other files need to change

## Files Changed
- `src/pages/Index.tsx` -- lazy import + Suspense wrapper (2 small edits)

