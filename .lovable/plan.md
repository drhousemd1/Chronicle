## Plan (Option B, convention-aligned): DB-only migration — `public.goal_alignment_states`

### Convention-alignment changes vs. your original SQL

1. **`user_id` is a plain `uuid NOT NULL` with NO FK to `auth.users`.** Matches project rule "NEVER use a foreign key reference to `auth.users`" and matches the three tables added in the prior migration. Ownership is enforced by RLS only.
2. **All `auth.uid()` calls in RLS policies are wrapped as `(SELECT auth.uid())`.** Avoids new `auth_rls_initplan` lint warnings; matches the recent migration's policy style.

Everything else is identical to your spec.

### Guardrail confirmations

- ✅ **Only one new table:** `public.goal_alignment_states`. No other tables created/altered/dropped/renamed.
- ✅ **No frontend/client edits.** No changes to `src/**`, `supabase/functions/**`, or `supabase/config.toml`. (`src/integrations/supabase/types.ts` auto-regenerates — that is automatic, not an edit.)
- ✅ **No edge function changes.**
- ✅ **No existing migration removed or rewritten.** New timestamped file only.
- ✅ **`conversation_id`** → `REFERENCES public.conversations(id) ON DELETE CASCADE`.
- ✅ **`source_message_id`** → `REFERENCES public.messages(id) ON DELETE SET NULL` (nullable).
- ✅ **`character_id`** → `REFERENCES public.characters(id) ON DELETE CASCADE` (nullable; required only when `goal_kind='character'`).
- ✅ **RLS enabled** on the new table.
- ✅ **All four policies (SELECT/INSERT/UPDATE/DELETE)** require BOTH `(SELECT auth.uid()) = user_id` AND an `EXISTS` check that the conversation belongs to `(SELECT auth.uid())`. UPDATE has both USING and WITH CHECK.
- ✅ **Story/character scope CHECK** (`goal_alignment_scope_matches_kind`) included verbatim.
- ✅ **Unique index** `uq_goal_alignment_state_scope` on `(conversation_id, goal_kind, character_scope_id, goal_id)`.
- ✅ **Two secondary indexes:** `idx_goal_alignment_states_conversation (conversation_id, goal_kind, updated_at DESC)` and `idx_goal_alignment_states_source (conversation_id, source_message_id, source_generation_id)`.
- ✅ **`previous_state JSONB`** column included (nullable) for rollback.
- ✅ **`updated_at` trigger:** `update_goal_alignment_states_updated_at BEFORE UPDATE FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()`. Reuses existing function. Created via `DROP TRIGGER IF EXISTS` then `CREATE TRIGGER`.
- ✅ **All other CHECKs verbatim:** `goal_kind IN ('story','character')`, `score BETWEEN 0 AND 100`, `status IN ('active','supported','resisted','drifting','dormant','dropped')`, `trend IN ('rising','falling','stable')`, `last_signal IN ('support','resistance','drift','neutral','not_applicable')`.
- ✅ **Defaults verbatim:** `score=50`, `status='active'`, `trend='stable'`, counts=0, `last_signal='not_applicable'`, `character_scope_id='00000000-0000-0000-0000-000000000000'`, timestamps `now()`.
- ✅ **Idempotent:** `CREATE TABLE IF NOT EXISTS`, `CREATE [UNIQUE] INDEX IF NOT EXISTS`, `DO $$ ... pg_policies guard ... $$` per policy, trigger drop-then-create.

### Column summary

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | uuid | NO | gen_random_uuid() | PK |
| user_id | uuid | NO | — | RLS scope, **no FK** |
| conversation_id | uuid | NO | — | FK conversations CASCADE |
| goal_kind | text | NO | — | CHECK story/character |
| character_id | uuid | YES | — | FK characters CASCADE |
| character_scope_id | uuid | NO | `'00000000-...'` | equals character_id for character-kind |
| goal_id | text | NO | — | |
| score | int | NO | 50 | 0–100 |
| status | text | NO | 'active' | CHECK list |
| trend | text | NO | 'stable' | CHECK list |
| support_count / resistance_count / drift_count | int | NO | 0 | |
| last_signal | text | NO | 'not_applicable' | CHECK list |
| last_rationale | text | YES | — | |
| last_evaluated_at | timestamptz | YES | — | |
| last_evaluated_day | int | YES | — | |
| last_evaluated_time_of_day | text | YES | — | |
| source_message_id | uuid | YES | — | FK messages SET NULL |
| source_generation_id | uuid | YES | — | |
| previous_state | jsonb | YES | — | rollback payload |
| created_at / updated_at | timestamptz | NO | now() | trigger maintains updated_at |

### Exact SQL to be executed (when you approve)

```sql
CREATE TABLE IF NOT EXISTS public.goal_alignment_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  goal_kind TEXT NOT NULL CHECK (goal_kind IN ('story', 'character')),
  character_id UUID REFERENCES public.characters(id) ON DELETE CASCADE,
  character_scope_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  goal_id TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 50 CHECK (score >= 0 AND score <= 100),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','supported','resisted','drifting','dormant','dropped')),
  trend TEXT NOT NULL DEFAULT 'stable' CHECK (trend IN ('rising','falling','stable')),
  support_count INTEGER NOT NULL DEFAULT 0,
  resistance_count INTEGER NOT NULL DEFAULT 0,
  drift_count INTEGER NOT NULL DEFAULT 0,
  last_signal TEXT NOT NULL DEFAULT 'not_applicable' CHECK (last_signal IN ('support','resistance','drift','neutral','not_applicable')),
  last_rationale TEXT,
  last_evaluated_at TIMESTAMPTZ,
  last_evaluated_day INTEGER,
  last_evaluated_time_of_day TEXT,
  source_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  source_generation_id UUID,
  previous_state JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT goal_alignment_scope_matches_kind CHECK (
    (goal_kind = 'story'
      AND character_id IS NULL
      AND character_scope_id = '00000000-0000-0000-0000-000000000000'::uuid)
    OR
    (goal_kind = 'character'
      AND character_id IS NOT NULL
      AND character_scope_id = character_id)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_goal_alignment_state_scope
  ON public.goal_alignment_states (conversation_id, goal_kind, character_scope_id, goal_id);

CREATE INDEX IF NOT EXISTS idx_goal_alignment_states_conversation
  ON public.goal_alignment_states (conversation_id, goal_kind, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_goal_alignment_states_source
  ON public.goal_alignment_states (conversation_id, source_message_id, source_generation_id);

ALTER TABLE public.goal_alignment_states ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='goal_alignment_states' AND policyname='Users can view own goal alignment states') THEN
    CREATE POLICY "Users can view own goal alignment states"
      ON public.goal_alignment_states FOR SELECT
      USING (
        (SELECT auth.uid()) = user_id
        AND EXISTS (
          SELECT 1 FROM public.conversations c
          WHERE c.id = goal_alignment_states.conversation_id
            AND c.user_id = (SELECT auth.uid())
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='goal_alignment_states' AND policyname='Users can insert own goal alignment states') THEN
    CREATE POLICY "Users can insert own goal alignment states"
      ON public.goal_alignment_states FOR INSERT
      WITH CHECK (
        (SELECT auth.uid()) = user_id
        AND EXISTS (
          SELECT 1 FROM public.conversations c
          WHERE c.id = goal_alignment_states.conversation_id
            AND c.user_id = (SELECT auth.uid())
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='goal_alignment_states' AND policyname='Users can update own goal alignment states') THEN
    CREATE POLICY "Users can update own goal alignment states"
      ON public.goal_alignment_states FOR UPDATE
      USING (
        (SELECT auth.uid()) = user_id
        AND EXISTS (
          SELECT 1 FROM public.conversations c
          WHERE c.id = goal_alignment_states.conversation_id
            AND c.user_id = (SELECT auth.uid())
        )
      )
      WITH CHECK (
        (SELECT auth.uid()) = user_id
        AND EXISTS (
          SELECT 1 FROM public.conversations c
          WHERE c.id = goal_alignment_states.conversation_id
            AND c.user_id = (SELECT auth.uid())
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='goal_alignment_states' AND policyname='Users can delete own goal alignment states') THEN
    CREATE POLICY "Users can delete own goal alignment states"
      ON public.goal_alignment_states FOR DELETE
      USING (
        (SELECT auth.uid()) = user_id
        AND EXISTS (
          SELECT 1 FROM public.conversations c
          WHERE c.id = goal_alignment_states.conversation_id
            AND c.user_id = (SELECT auth.uid())
        )
      );
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_goal_alignment_states_updated_at ON public.goal_alignment_states;
CREATE TRIGGER update_goal_alignment_states_updated_at
BEFORE UPDATE ON public.goal_alignment_states
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

### Post-apply verification (raw output returned to you)

1. `information_schema.tables` row for `goal_alignment_states`.
2. Full `information_schema.columns` dump (name, type, nullable, default).
3. `pg_indexes` rows (indexname, indexdef) — expect PK + 1 unique + 2 secondary.
4. `pg_constraint` rows (conname, contype, `pg_get_constraintdef`) — expect PK, 2 FKs (conversations, characters; messages = 3rd FK), 6 CHECKs (5 column-level + `goal_alignment_scope_matches_kind`). **No FK to `auth.users`.**
5. `pg_class.relrowsecurity` → true.
6. `pg_policies` rows for all 4 policies with full `qual` / `with_check` showing `(SELECT auth.uid())` form.
7. `pg_trigger` row for `update_goal_alignment_states_updated_at` (`pg_get_triggerdef`).
8. `supabase--linter` raw output, each warning tagged **new** vs **pre-existing**. Expectation: zero new warnings.

### Out of scope
- No edits to `src/**`, `supabase/functions/**`, `supabase/config.toml`, or any application code.
- No data inserts/updates/deletes.
- No changes to existing tables, policies, functions, or triggers.
- No memory file updates.

### Awaiting your "proceed"
I will not invoke `supabase--migration` until you explicitly approve.