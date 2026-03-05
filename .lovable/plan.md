

## Plan: Add Cover Image + Brief Description Validation & Live Error Clearing

Three problems to fix:

### 1. New validation checks: Cover Image and Brief Description

**`src/utils/publish-validation.ts`**
- Add `coverImage?: string` and `briefDescription?: string` to `PublishValidationErrors` interface
- Add `coverImage: string` and pass `briefDescription` (from `world.core.briefDescription`) to `validateForPublish` input
- New check: if `coverImage` is empty, set `errors.coverImage = 'Cover image is required'`
- New check: if `briefDescription` is empty, set `errors.briefDescription = 'Brief description is required'`

**`src/components/chronicle/WorldTab.tsx`**
- Pass `coverImage` to `validateForPublish` call (line ~1210)
- Add error display for cover image (red border on the cover preview container + error text)
- Add error styling to Brief Description field (same `border-red-500 ring-2 ring-red-500` pattern + error text below)
- Add both errors to the bottom summary panel list
- Add `data-publish-error` wrappers for auto-scroll

### 2. Live error clearing (the main UX problem)

Currently `publishErrors` is set once on "Publish" click and never updated. When users fix fields, errors stay red.

**`src/components/chronicle/WorldTab.tsx`**
- Add a `useEffect` that watches all validated inputs (`world`, `characters`, `openingDialog`, `contentThemes`, `coverImage`). When `publishErrors` is non-empty, re-run `validateForPublish` and update `publishErrors` with the new result. This clears errors as fields are filled.
- This single effect handles all fields: tags count updates, SFW/NSFW selection, story premise typing, etc.

### 3. Pass live tag count to ContentThemesSection error message

The tag count in the error message currently only updates on publish click. With the live re-validation effect above, the `publishErrors.tags` string will automatically re-compute with the correct count (e.g., "currently 3" instead of stuck at "currently 0").

### Technical summary

| File | Change |
|------|--------|
| `publish-validation.ts` | Add `coverImage` + `briefDescription` fields and checks |
| `WorldTab.tsx` | Pass new fields to validator, add error UI for cover + description, add `useEffect` for live re-validation |
| `WorldTab.tsx` bottom summary | Add cover image + brief description error lines |

