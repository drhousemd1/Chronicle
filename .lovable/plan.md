

# Fix White Screen: Install Missing @mantine/core Dependency

## Problem
The app crashes with a white screen because `@blocknote/mantine` (used by the App Guide editor) requires `@mantine/core` as a peer dependency, but it was never installed. The error is:

```
ENOENT: no such file or directory, open '@mantine/core/styles/ScrollArea.css'
```

This affects the entire app, not just the App Guide page, because Vite fails to resolve the CSS import at build time.

## Fix

**Install the missing dependency:**
- Add `@mantine/core` to `package.json`

That single addition will resolve the white screen. No code changes needed — the existing `@blocknote/mantine` imports will work once the peer dependency is available.
