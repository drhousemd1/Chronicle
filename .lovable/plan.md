
What went wrong:
- The issue is not a context-window problem. The problem is scope and component drift.
- The last pass mostly changed container spacing classes, but the actual inconsistency is deeper: the builders are using different field primitives, different row wrappers, and different alignment rules.
- So even after spacing was standardized, many text inputs still looked mismatched.

What I found in the code:
- There are 3 separate auto-resizing textarea implementations:
  - shared `src/components/chronicle/AutoResizeTextarea.tsx`
  - local one inside `CharactersTab.tsx`
  - local one inside `StoryCardView.tsx`
- `StoryCardView.tsx` also mixes `Input`, `Textarea`, and a local auto-resize textarea, so it cannot stay visually consistent with the builder pages.
- Row wrappers are inconsistent:
  - `WorldTab.tsx` still uses `flex items-start gap-3`
  - `CharactersTab.tsx` mostly uses `flex items-center gap-2`
  - some delete/lock actions still rely on manual `pt-2` / `mt-2`
- That means the fields can have matching padding but still look like different heights because the rows and action slots are aligned differently.

Plan to fix it thoroughly:
1. Normalize the field primitive first
- Use the shared `src/components/chronicle/AutoResizeTextarea.tsx` as the single source of truth.
- Remove the duplicated local textarea implementations in `CharactersTab.tsx` and `StoryCardView.tsx`.
- Add a consistent builder baseline for single-line, label, description, and freeform text fields so height, padding, line-height, and radius all match.

2. Standardize all side-by-side builder rows
- Apply one row pattern everywhere relevant:
  - row wrapper: consistent flex alignment and gap
  - label column: `w-2/5 min-w-0`
  - description/value column: `flex-1 min-w-0`
  - action slot: fixed-width centered container
- Remove leftover manual offsets like `pt-2` / `mt-2` where the centered action slot should handle alignment.

3. Audit and update every editable text field on both builder pages
- Story Builder / `WorldTab.tsx`
  - Story Name
  - Brief Description
  - Story Premise
  - Primary Locations
  - Custom structured rows
  - Custom freeform blocks
  - Opening Dialog
  - Custom AI Rules
  - Additional Entries text areas
- Character Builder / `CharactersTab.tsx`
  - Basics fields
  - all `HardcodedRow` value fields
  - all `ExtraRow` label/value rows
  - below-grid fields
  - custom structured rows
  - custom freeform rows
  - custom section subheading/title fields

4. Fix `StoryCardView.tsx` so it stops drifting from the main builders
- Replace the mismatched `Input`/`Textarea` styling with the same builder field rules used in the main pages.
- Align locations, custom structured rows, and freeform blocks to the same row-height and spacing standard.

5. QA against the actual complaints
- Verify that:
  - description fields in custom rows visually match Primary Locations
  - label/description side-by-side rows look uniform across both pages
  - freeform blocks use the same visual sizing rules
  - action icons are vertically aligned
  - “Add Row” buttons have consistent breathing room below the last field

Files I would update:
- `src/components/chronicle/AutoResizeTextarea.tsx`
- `src/components/chronicle/WorldTab.tsx`
- `src/components/chronicle/CharactersTab.tsx`
- `src/components/chronicle/StoryCardView.tsx`

Expected result:
- No more “spacing fixed but fields still off” problem.
- The builders will share one consistent text-field system instead of several near-matching versions that drift apart.
- Future audits will be much easier because the styling will be centralized instead of scattered.
