

# Update Style Guide Governance Rules

## What
Expand the "Instructions for Lovable" rules box (lines 1019–1024) with two new rules covering:
1. **Swatch dropdown/modal synchronization** — when colors are added or removed from the app, the `ALL_SWATCHES` registry and the "Change to" dropdown must be updated in lockstep.
2. **Location screenshot maintenance** — when a swatch's "Locations" text is modified (added, removed, or changed), the corresponding `locationImages` entries must be added, removed, or re-captured to stay in sync.

## Changes (single file: `StyleGuideTool.tsx`, lines 1019–1024)

Replace the current 4-rule `<ol>` with a 6-rule list:

1. *(existing)* Only use colors/tokens/components from this page. Never introduce variations.
2. *(existing)* Determine page-specific vs app-wide context before selecting tokens.
3. *(existing)* If a new feature needs a style not on this page, stop and confirm with the user.
4. *(existing, expanded)* When adding, removing, or reassigning a style in the application, update this page — including "Locations" on affected swatches. **Additionally, update the `ALL_SWATCHES` constant so the color selection dropdown in the Edit Detail Modal reflects the current registry. If a color is fully removed from the app, remove it from `ALL_SWATCHES`; if a new color is introduced, add it.**
5. *(new)* **Location image sync:** When a swatch's "Locations" text is modified — a location added, removed, or renamed — the corresponding `locationImages` array must be updated. New locations require a screenshot captured and uploaded to the `guide_images` storage bucket. Removed locations must have their image entry deleted. Changed locations require a re-captured screenshot if the UI element's appearance has changed.
6. *(new)* **Edit modal data integrity:** The "Change to" dropdown in the Edit Detail Modal must only display colors that currently exist in the style guide. Stale entries (colors no longer in use) must never appear as selectable options. The `ALL_SWATCHES` array is the single source for this dropdown.

No other files or components change — just the text content of the rules `<ol>`.

