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