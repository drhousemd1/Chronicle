

# Fix White Screen: Lazy-Load the App Guide Editor

## Problem
The BlockNote editor packages are large and cause the entire app to crash on startup because they're imported eagerly in `Admin.tsx` -- even though no regular user ever needs them.

## Fix (one file change)

**File: `src/pages/Admin.tsx`**

1. Remove the static import of `AppGuideTool` at the top of the file
2. Replace it with a `React.lazy()` dynamic import so it only loads when you click the App Guide tile
3. Wrap the render in `React.Suspense` with a simple "Loading editor..." fallback

This ensures the BlockNote packages are only fetched when you navigate to Admin and click the App Guide tile. The rest of the app is completely unaffected.

## Technical Detail

```text
// Before (crashes app on load):
import { AppGuideTool } from '@/components/admin/guide/AppGuideTool';

// After (loads only when needed):
const AppGuideTool = React.lazy(() =>
  import('@/components/admin/guide/AppGuideTool').then(m => ({ default: m.AppGuideTool }))
);

// Wrapped in Suspense when rendered:
<React.Suspense fallback={<div>Loading editor...</div>}>
  <AppGuideTool />
</React.Suspense>
```

No other files change. No new dependencies. No database changes.
