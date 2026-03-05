
Root cause is now clear and it is a frontend sync bug, not account bleed.

What I verified in code/guides:
- Character Library page (`tab === "library"`) renders from `library` state in `Index.tsx` (`filteredLibrary`).
- That `library` state is loaded once during app boot via `fetchCharacterLibrary()` wrapped in a 15s timeout fallback (`[]`), so a slow call can silently leave library empty.
- “Import from Library” modal does a fresh fetch every open via `CharacterPickerWithRefresh` -> `fetchCharacterLibrarySummaries()`.
- `CharacterPickerWithRefresh` currently ignores the `library` + `refreshLibrary` props from `Index.tsx`, so modal data and page data can diverge.
- Guides also expect one consistent library source and owner-scoped results.

Implementation plan (no DB schema change):
1) Unify library loading in `Index.tsx`
- Add a single `refreshCharacterLibrary` function that fetches from backend and updates `setLibrary`.
- Use this function:
  - during initial load (replace direct one-off library assignment path),
  - when entering `tab === "library"` (so the page self-heals from any stale/timeout state),
  - as the callback passed into picker.

2) Fix `CharacterPickerWithRefresh` to stop bypassing parent state
- Update `src/components/chronicle/CharacterPicker.tsx` so wrapper uses the provided `refreshLibrary` result (and/or provided `library` as immediate fallback) to build summaries.
- Remove the disconnected “always fetch summaries directly without syncing parent” behavior.
- Keep current UI/UX and search behavior in picker unchanged.

3) Enforce explicit owner filtering in service layer (defense-in-depth)
- In `src/services/supabase-data.ts`, update:
  - `fetchCharacterLibrary(...)`
  - `fetchCharacterLibrarySummaries(...)`
- Add explicit `user_id` filtering (using current user id passed from caller), so owner scoping is guaranteed at query level, not only by policy side effects.
- This aligns with your “no cross-account bleed” requirement and your architecture guide expectations.

4) Validation pass
- Repro flow on wife account:
  1. Open Story Builder -> Import from Library (note visible characters).
  2. Go to Character Library tab.
  3. Confirm same character set is visible.
- Also test after hard refresh/login to confirm initial-load timeout no longer leaves permanent empty library view.
- Confirm Community Gallery remains the only cross-user content surface.

Files to update:
- `src/pages/Index.tsx`
- `src/components/chronicle/CharacterPicker.tsx`
- `src/services/supabase-data.ts`

Technical note:
- No migration required.
- No policy changes required for this fix (RLS stays intact).
- This is a state synchronization + query scoping consistency fix.
