
You’re right to be angry. Here’s the clean restart plan based on what the code actually has right now.

1) Root cause (what exists today)
- A standalone auth route is still explicitly mounted in `src/App.tsx`:
  - `path="/auth" element={<Auth />`
- The old standalone screen still exists in `src/pages/Auth.tsx` and still uses the legacy purple/slate styling.
- The real app flow uses `AuthModal` on `Index.tsx` (via `setAuthModalOpen(true)`), so `/auth` is effectively a legacy path that was never removed.
- Style guide sections still document that legacy `/auth` page, which is why you’re seeing colors/styles that don’t belong to your current auth UX.

2) Start-over implementation plan (single cleanup pass)
A. Remove standalone auth UI from product flow
- Replace `/auth` page usage with modal-only auth:
  - Remove `Auth` import + `/auth` page route in `App.tsx`.
  - Add a tiny route shim for backward compatibility (`/auth` → redirect to `/` with auth intent), so old links/bookmarks don’t break.
- Add auth-intent handling in `Index.tsx`:
  - If URL indicates auth intent, open `AuthModal` immediately.
  - Clear intent from URL after opening so refresh behavior is clean.
- Delete `src/pages/Auth.tsx` after references are fully removed.

B. Remove orphaned auth references
- Search and replace any `navigate('/auth')` or hard references to standalone auth.
- Update dead/legacy pages (e.g. `Gallery.tsx` redirect logic) so nothing points to `/auth`.
- Run global search to confirm no remaining runtime dependency on `src/pages/Auth.tsx`.

C. Correct the Style Guide to source-of-truth auth UI only
- In `StyleGuideTool.tsx`, replace the current “Auth Page” legacy block with “Auth Modal / Auth Entry” based on real current UI.
- Remove legacy auth-only entries (purple gradient/slate glass/purple button/toggle) from auth sections.
- Add/keep only colors actually present in current auth modal and current auth entry points.
- Update Buttons/Inputs/Panels auth subsections to match modal implementation (including eye-toggle placement/state).
- Remove stale Auth inconsistency notes that are tied to deleted standalone page.

D. Fix `ALL_SWATCHES` integrity
- Reconcile `ALL_SWATCHES` against real current style-guide usage:
  - Remove colors that only existed because of legacy standalone auth.
  - Keep purple tokens that are still genuinely used elsewhere in app/style guide (do not blindly purge all purple globally).
- Confirm Edit Detail Modal “Change to” dropdown shows only active style-guide colors.

E. Location image synchronization (strict)
- For every auth swatch/detail whose “Locations” text changes:
  - Capture fresh screenshots from actual running UI locations (modal + live components only).
  - Upload to `guide_images` and wire each into matching `locationImages`.
  - Remove image entries for removed locations.
- Remove accidental local screenshot artifacts that are not used as style-guide location sources.

3) Verification checklist (must pass before done)
- `/auth` no longer renders a standalone page.
- Visiting `/auth` redirects into the real modal-based auth experience.
- No code path references `src/pages/Auth.tsx`.
- Style Guide auth sections match current UI exactly (no fabricated or legacy colors).
- Each changed auth location has a valid matching `locationImages` entry and real screenshot source.
- Edit modal color dropdown contains no stale auth-only legacy colors.

4) Scope discipline for this pass
- This pass is strictly: remove orphan standalone auth flow + synchronize style guide and swatch registry to current truth.
- No speculative redesign, no generated/mock imagery, no extra feature work.
