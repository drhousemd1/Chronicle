
Goal: remove location/function labels from typography “Name” and make that field show the actual font family identity only.

What I found in code:
- `TypoCardV2` currently renders `Name:` from `name` (line ~177 in `StyleGuideTool.tsx`), and many values are function/location labels (“Card Title”, “Speech Text”, etc.).
- Community Gallery + Chat Interface were converted to `TypoCardV2`, but still using those location/function labels as `name`.
- Remaining typography sections still use `TypeTile`, which also uses location/function naming patterns.
- No custom font files or font-family overrides are configured in Tailwind/theme for app UI text; typography is using the default sans stack behavior (plus explicit mono only for code-like fields).

Implementation plan:
1) Redefine typography card identity
- Update `TypoV2Props`:
  - Replace `name` with `fontName` (required).
  - Keep `locations` as the only place for functional usage/location descriptions.
- In `TypoCardV2` UI:
  - Change label from `Name:` to `Font Name:`.
  - Render `fontName` value only.
  - Keep technical rows (size, weight, spacing, transform, color, line-height) unchanged.

2) Standardize font identity values
- Use real family identity instead of role/location labels.
- For these cards, set font name to the actual app text family identity (default sans stack), not “Card Title / Action Text / etc.”
- Keep all role/function wording strictly inside `Locations`.

3) Fix the already-converted sections
- Community Gallery:
  - Replace `name="Card Title" | "Card Description" | "Card Stats" | "Search Placeholder"` with `fontName="..."` technical font family value.
- Chat Interface:
  - Replace `name="Speech Text" | "Action Text" | "Character Label"` with `fontName="..."` technical font family value.
- Keep existing `locations` text (already the correct place for role/location).

4) Complete consistency across all typography sections
- Convert remaining `TypeTile` entries (My Stories, Chat History, Account, Global Sidebar, Character Builder, Model Settings) to `TypoCardV2` using the same rule:
  - `fontName` = actual font family identity
  - `locations` = usage/function/location explanation
- Remove old `TypeTile` usage from Typography section once fully migrated.

5) Cleanup + guardrails
- Search check to ensure no typography card uses function/location words as identity fields.
- Ensure no duplicated “location as name” pattern remains.
- Keep typography card structure uniform across all subsections.

Technical details:
- Files touched: `src/components/admin/styleguide/StyleGuideTool.tsx` only.
- Key refactor points:
  - `interface TypoV2Props` (`name` → `fontName`)
  - `TypoCardV2` render label/value (`Name:` → `Font Name:`)
  - All `<TypoCardV2 ...>` call sites in Typography section
  - Remaining `<TypeTile ...>` call sites converted
- No backend/database/auth changes required.

Acceptance criteria:
- Every typography card shows `Font Name` as a real font family identity (not role/location).
- Terms like “Card Title”, “Speech Text”, “Action Text”, “Character Label”, etc. appear only in `Locations`, never as the card identity field.
- Community Gallery and Chat Interface specifically follow this rule.
- Typography section is fully standardized to `TypoCardV2` with no lingering legacy naming pattern.
