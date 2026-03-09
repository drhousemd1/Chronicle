
Issue confirmed. The badge color was fixed, but the count source is stale.

What’s actually broken:
- `Index.tsx` renders the badge only when `styleGuideEditsCount > 0`.
- That state is only set once when `onRegisterStyleGuideEdits` is registered (mount-time of the style guide tool).
- After you add/edit/delete style-guide edits, `Index.tsx` is never notified, so count stays `0` even though cards show “Edit”.

Implementation plan:

1) Wire real-time count updates from Style Guide tool to header
- File: `src/components/admin/styleguide/StyleGuideTool.tsx`
- Add new optional prop: `onEditsCountChange?: (count: number) => void`.
- Update `refreshEditsState` to:
  - read registry once,
  - update local `editNames`,
  - call `onEditsCountChange(registry.length)`.
- Run an initial sync on mount (`useEffect`) so existing local edits immediately populate the header badge.
- Keep existing edit/keep flows; they already call `refreshEditsState`, so this will automatically propagate count updates.

2) Pass the count callback through Admin page
- File: `src/pages/Admin.tsx`
- Extend `AdminPageProps` with `onStyleGuideEditsCountChange?: (count: number) => void`.
- Pass it to `LazyStyleGuide` as `onEditsCountChange={onStyleGuideEditsCountChange}`.

3) Update Index to consume live count updates
- File: `src/pages/Index.tsx`
- When rendering `AdminPage`, pass:
  - `onStyleGuideEditsCountChange={(count) => setStyleGuideEditsCount(count)}`
- Keep existing `onRegisterStyleGuideEdits` ref registration for opening the edits modal.
- Keep badge rendering condition `styleGuideEditsCount > 0` (so it appears when there is at least one edit).

Why this fixes your exact screenshot case:
- The dark charcoal swatch edit already exists in local storage.
- On style guide mount, initial sync sets badge count immediately.
- Any new edit/delete updates the top “Edits” counter instantly without tab/tool remounts.

Validation checklist (end-to-end):
1. Open Admin → Style Guide with existing edits already saved: badge should show count immediately.
2. Add edit to a swatch (e.g., dark charcoal): count increments instantly.
3. Edit existing entry: count remains stable.
4. Delete entry in Edits list: count decrements instantly.
5. Refresh page: badge restores correctly from saved local data.
