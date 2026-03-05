
Goal: make Image Library behave like the other tabs (instant on tab switch, no blank/flash).

What actually caused the issue:
- The prior change removed the spinner, but `ImageLibraryTab` still unmounts/remounts on every tab switch (`tab === "image_library"` conditional render in `Index.tsx`).
- On each remount, local state resets (`folders = []`), so you see an empty flash before data returns.
- `ImageLibraryTab` also runs its own auth hook, which adds extra delay before folder fetch starts.

Implementation plan (to match other pages):
1) Keep Image Library mounted (don’t unmount on tab switch)
- File: `src/pages/Index.tsx`
- Replace conditional rendering of the Image Library body with always-mounted rendering.
- Toggle visibility via class (`block`/`hidden`) based on `tab`, instead of mounting/unmounting.
- Result: folder state persists between tab switches, so no recurring blank flash.

2) Stop duplicate auth/session startup in Image Library
- File: `src/components/chronicle/ImageLibraryTab.tsx`
- Remove internal `useAuth()` usage in this component.
- Add a `userId` prop from parent (`Index`) and use that for all folder/image operations.
- Result: fetch can start immediately from already-known parent auth state.

3) Add one-time folder fetch guard
- File: `src/components/chronicle/ImageLibraryTab.tsx`
- Add `hasLoadedRef` + `fetchInProgressRef` guards in `loadFolders`.
- Depend on primitive `userId` in effects (not object identity).
- Prevent duplicate parallel fetches in dev/StrictMode and avoid reloading when unnecessary.

4) Keep current UX behavior where it matters
- Preserve existing folder/image CRUD behavior, search behavior, and header controls.
- Keep `onFolderChange` callback wiring intact so back/upload controls still work as today.

Validation checklist:
- Switch repeatedly between: My Stories → Image Library → Chat History → Image Library.
- Confirm Image Library shows previous content immediately (no blank frame, no loading icon flash).
- Confirm opening folder, uploading image, renaming/deleting folder still updates correctly.
- Confirm first app load still reaches populated Image Library quickly and subsequent switches are instant.
