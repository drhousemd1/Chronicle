

## Plan: Fix Blank Chat History

**Root cause:** The `fetchConversationRegistry()` function in `src/services/supabase-data.ts` (line 952) joins on `scenarios!inner(...)`, but the actual table name is `stories`. The `!inner` join means conversations without a matching join are excluded entirely -- which means ALL conversations are excluded because the table alias is wrong.

Every other query in `supabase-data.ts` uses `.from('stories' as any)` to reference this table, but this one query still uses the old `scenarios` alias in its join.

### Fix

**File:** `src/services/supabase-data.ts`, line 952

Change:
```
scenarios!inner(title, cover_image_url)
```
to:
```
stories!conversations_scenario_id_fkey(title, cover_image_url)
```

This uses the explicit foreign key name (from the types: `conversations_scenario_id_fkey`) to join to the `stories` table. Also update the two references to `conv.scenarios` on lines 963-964 to `conv.stories`.

**Files to update:** 1 file (`src/services/supabase-data.ts`)

