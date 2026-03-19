

# Next Batch of Fixes — 5 Issues

Here are the next five issues to tackle, prioritized by impact. Each one is explained in plain language.

---

## 1. Security: Anyone could view another user's image folders (Critical)
**Finding:** `qh-sec-20260318-009`

**What's wrong:** The function that loads your image library folders accepts a user ID as input from whoever calls it. Because it runs with elevated database privileges, it doesn't check whether the person asking is actually that user. This means someone could theoretically pass in a different user's ID and see their folder names, thumbnail images, and image counts.

**Why it matters:** This is a privacy issue. Users' private library data should only be visible to them.

**Fix:** Create a new version of the database function that ignores the caller-provided ID entirely and instead looks up the authenticated user automatically. Update the two frontend files that call it (`ImageLibraryTab.tsx` and `ImageLibraryPickerModal.tsx`) to stop passing the user ID parameter.

---

## 2. Security: migrate-base64-images already has auth — mark it fixed (Critical)
**Finding:** `qh-sec-20260318-005`

**What's wrong:** This was flagged as having no authentication check, but looking at the current code, an auth guard was already added. The finding is outdated and just needs its status updated with documentation of what was done.

**Why it matters:** Keeps the Quality Hub accurate so we're not wasting time re-investigating resolved issues.

**Fix:** Update the finding to `status: "fixed"` with a comment explaining the auth guard is already present.

---

## 3. Orphan Code: Remove 3 dead files nobody uses (Low — but easy wins)
**Findings:** `qh-orphan-20260318-001`, `qh-orphan-20260318-002`, `qh-orphan-20260318-003`

**What's wrong:** Three files sit in the codebase doing nothing:
- **ChronicleApp.tsx** — A placeholder component from a migration that was never completed. Nothing imports it.
- **DraftsModal.tsx** — A draft management popup that was replaced when drafts moved to the database. The import is commented out.
- **storage.ts** — An old helper for saving data to the browser. Nothing in the app uses it anymore.

**Why it matters:** Dead code is confusing. Future developers (or AI agents) might accidentally start using these files, thinking they're active. Removing them keeps the project clean and makes it easier to navigate.

**Fix:** Delete all three files. Remove the leftover comment referencing DraftsModal in `Index.tsx`. Mark all three findings as fixed with documentation.

---

## 4. Build: Image Library has a circular dependency (Medium)
**Finding:** `qh-build-20260318-007`

**What's wrong:** Two files depend on each other in a loop: `ImageLibraryTab.tsx` exports a type called `ImageFolder`, and `FolderEditModal.tsx` imports that type — but `ImageLibraryTab.tsx` also imports `FolderEditModal`. This circular reference can cause subtle issues with hot-reload during development and makes the code harder to maintain.

**Why it matters:** Circular dependencies are a code smell that can lead to hard-to-debug issues, especially as the project grows.

**Fix:** Move the `ImageFolder` type into a new file (`image-library-types.ts`), then update both files to import from there instead.

---

## 5. Registry housekeeping

After all fixes, bump `registryVersion` from `5` to `6` so the Quality Hub UI refreshes and shows the updated statuses. Each fixed finding will include:
- Status set to `"fixed"` and `verificationStatus: "verified"`
- A comment explaining exactly what was changed
- Updated `expectedBehavior` and `actualBehavior` fields

---

### Files changed
- **New migration SQL** — Rewrite `get_folders_with_details` to use `auth.uid()` instead of `p_user_id`
- `src/components/chronicle/ImageLibraryTab.tsx` — Update RPC call (no user ID param), move `ImageFolder` type out
- `src/components/chronicle/ImageLibraryPickerModal.tsx` — Update RPC call
- **New file:** `src/components/chronicle/image-library-types.ts` — Shared `ImageFolder` type
- `src/components/chronicle/FolderEditModal.tsx` — Import from new types file
- **Delete:** `src/components/chronicle/ChronicleApp.tsx`
- **Delete:** `src/components/chronicle/DraftsModal.tsx`
- **Delete:** `src/services/storage.ts`
- `src/pages/Index.tsx` — Remove DraftsModal comment lines
- `src/data/ui-audit-findings.ts` — Mark 6 findings as fixed with full documentation, bump registry version

