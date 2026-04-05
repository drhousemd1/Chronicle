

# Add `custom_sections` Column to `side_characters`

## Change
One database migration adding a single column to the existing `side_characters` table, backfilling NULLs, then enforcing NOT NULL.

## SQL
```sql
ALTER TABLE public.side_characters
  ADD COLUMN IF NOT EXISTS custom_sections jsonb DEFAULT '[]'::jsonb;

UPDATE public.side_characters
  SET custom_sections = '[]'::jsonb
  WHERE custom_sections IS NULL;

ALTER TABLE public.side_characters
  ALTER COLUMN custom_sections SET NOT NULL;
```

## Scope
- No other tables touched
- No RLS policy changes
- No column renames or removals

## Files changed
- **New migration** — adds `custom_sections jsonb NOT NULL DEFAULT '[]'` to `side_characters`
- `src/integrations/supabase/types.ts` — auto-regenerated

## Acceptance criteria
- `public.side_characters.custom_sections` exists
- Type is `jsonb`
- Default is `'[]'::jsonb`
- Existing rows backfilled (no NULLs)
- Column is `NOT NULL`
- No unrelated schema changes

