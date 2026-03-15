

## Plan: Preload Nav Button Images to Eliminate Pop-in

### Problem
Nav button images load inside `CharactersTab` on mount via a `useEffect` that fetches from the database. When you navigate to the Character Builder tab, the buttons render empty first, then the images appear after the async fetch completes.

### Solution
Lift the `loadNavButtonImages()` call to `Index.tsx` so it runs once on app startup. Pass the loaded data as a prop to `CharactersTab`. By the time you navigate to the Characters tab, the data is already in memory.

### Changes

**1. `src/pages/Index.tsx`**
- Import `loadNavButtonImages` from `supabase-data`
- Add state: `navButtonImages` with `useState<Record<string, any>>({})`
- Add a `useEffect` on mount that calls `loadNavButtonImages()` and sets state
- Pass `navButtonImages` and `setNavButtonImages` as props to both `CharactersTab` instances (library + characters tabs)

**2. `src/components/chronicle/CharactersTab.tsx`**
- Add `navButtonImages` and `onNavButtonImagesChange` to `CharactersTabProps`
- Remove the internal `navButtonImages` state and the `useEffect` that loads it
- Use the prop directly instead of local state
- In `handleSaveNavImage`, call `onNavButtonImagesChange(updatedImages)` instead of `setNavButtonImages`

This way the fetch happens once at app startup, and the images are ready before the tab renders — no blank-then-pop-in.

