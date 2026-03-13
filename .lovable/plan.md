
Goal: implement your confirmed UX decisions with minimal, targeted fixes:
1) rename “Save and Close” to “Finalize and Close”
2) drafts visible only in Drafts + All (not My Stories)
3) draft cards always show Draft badge and never show Play

What’s actually broken now (root cause)
- Draft status is stored correctly in backend (`stories.is_draft = true`), but paginated story loading drops that field.
- `fetchMyScenariosPaginated()` currently selects:
  `id, title, description, cover_image_url, cover_image_position, tags, created_at, updated_at`
  and does NOT select `is_draft`.
- Since `dbToScenarioMetadata` maps `isDraft: row.is_draft ?? false`, missing `is_draft` becomes `false`, which causes:
  - drafts leaking into “My Stories”
  - Draft badge disappearing
  - Play button appearing on draft cards

Implementation plan
1) Fix draft flag in paginated fetch (primary fix)
- File: `src/services/supabase-data.ts`
- Update `fetchMyScenariosPaginated()` select list to include `is_draft`.
- No schema change needed; column already exists and is populated.

2) Keep “My Stories” excluding drafts
- File: `src/pages/Index.tsx`
- Keep/confirm:
  `case "my": return registry.filter(s => !s.isDraft);`
- Keep Drafts and All behavior unchanged:
  - Drafts: draft-only
  - All: everything (including drafts + saved)

3) Ensure draft card behavior is enforced by real draft state
- File: `src/components/chronicle/StoryHub.tsx`
- Existing logic is already correct once `isDraft` is accurate:
  - Draft badge shown when `isDraft`
  - Play button hidden when `isDraft`
- I will only do a tiny visual text alignment update if needed (“Draft” label wording) without changing style system.

4) Rename top action button label
- File: `src/pages/Index.tsx`
- Change button text from `Save and Close` to `Finalize and Close`.
- Keep loading text (`Saving...`) and existing validation flow unchanged.

Technical details
- No backend migration needed.
- No auth or RLS changes needed.
- This is a frontend data-shape consistency fix plus one label update.
- Main code delta is small and isolated:
  - one query field addition (`is_draft`)
  - one label string change
  - optional tiny badge text copy tweak only if required

Validation checklist (end-to-end)
1) Save a story using Save Draft.
2) Go to My Stories tab:
   - draft should NOT appear.
3) Go to Drafts tab:
   - draft appears
   - top-left Draft badge visible (white text style)
   - hover actions show only Edit + Delete (no Play)
4) Go to All tab:
   - same draft appears with Draft badge
   - still no Play action
5) Open draft detail modal:
   - no Play button for owned draft
6) Confirm non-draft stories still show Play normally.
7) Confirm builder button now reads “Finalize and Close”.
