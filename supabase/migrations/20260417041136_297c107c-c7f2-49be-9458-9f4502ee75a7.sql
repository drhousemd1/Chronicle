
-- =========================================================================
-- Chronicle Backend Alignment Migration
-- =========================================================================

-- 1. messages.generation_id
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS generation_id UUID NOT NULL DEFAULT gen_random_uuid();

CREATE INDEX IF NOT EXISTS idx_messages_conversation_generation
  ON public.messages (conversation_id, generation_id);

-- 2. memories.source_generation_id
ALTER TABLE public.memories
  ADD COLUMN IF NOT EXISTS source_generation_id UUID;

CREATE INDEX IF NOT EXISTS idx_memories_source_message_generation
  ON public.memories (source_message_id, source_generation_id);

-- =========================================================================
-- 3. character_state_message_snapshots
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.character_state_message_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  source_message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  source_generation_id UUID NOT NULL,
  snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_char_state_snapshot_msg_gen
  ON public.character_state_message_snapshots (character_id, source_message_id, source_generation_id);

CREATE INDEX IF NOT EXISTS idx_char_state_snapshot_lookup
  ON public.character_state_message_snapshots (conversation_id, character_id, source_message_id);

ALTER TABLE public.character_state_message_snapshots ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='character_state_message_snapshots' AND policyname='Users can view own char state snapshots') THEN
    CREATE POLICY "Users can view own char state snapshots"
      ON public.character_state_message_snapshots FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='character_state_message_snapshots' AND policyname='Users can insert own char state snapshots') THEN
    CREATE POLICY "Users can insert own char state snapshots"
      ON public.character_state_message_snapshots FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='character_state_message_snapshots' AND policyname='Users can update own char state snapshots') THEN
    CREATE POLICY "Users can update own char state snapshots"
      ON public.character_state_message_snapshots FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='character_state_message_snapshots' AND policyname='Users can delete own char state snapshots') THEN
    CREATE POLICY "Users can delete own char state snapshots"
      ON public.character_state_message_snapshots FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END$$;

-- =========================================================================
-- 4. side_character_message_snapshots
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.side_character_message_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  side_character_id UUID NOT NULL REFERENCES public.side_characters(id) ON DELETE CASCADE,
  source_message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  source_generation_id UUID NOT NULL,
  snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_side_char_snapshot_msg_gen
  ON public.side_character_message_snapshots (side_character_id, source_message_id, source_generation_id);

CREATE INDEX IF NOT EXISTS idx_side_char_snapshot_lookup
  ON public.side_character_message_snapshots (conversation_id, side_character_id, source_message_id);

ALTER TABLE public.side_character_message_snapshots ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='side_character_message_snapshots' AND policyname='Users can view own side char snapshots') THEN
    CREATE POLICY "Users can view own side char snapshots"
      ON public.side_character_message_snapshots FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='side_character_message_snapshots' AND policyname='Users can insert own side char snapshots') THEN
    CREATE POLICY "Users can insert own side char snapshots"
      ON public.side_character_message_snapshots FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='side_character_message_snapshots' AND policyname='Users can update own side char snapshots') THEN
    CREATE POLICY "Users can update own side char snapshots"
      ON public.side_character_message_snapshots FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='side_character_message_snapshots' AND policyname='Users can delete own side char snapshots') THEN
    CREATE POLICY "Users can delete own side char snapshots"
      ON public.side_character_message_snapshots FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END$$;

-- =========================================================================
-- 5. story_goal_step_derivations
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.story_goal_step_derivations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  source_message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  source_generation_id UUID NOT NULL,
  goal_id TEXT NOT NULL,
  step_id TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT true,
  day INTEGER,
  time_of_day TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_goal_step_derivation
  ON public.story_goal_step_derivations (conversation_id, source_message_id, source_generation_id, goal_id, step_id);

CREATE INDEX IF NOT EXISTS idx_goal_step_derivation_lookup
  ON public.story_goal_step_derivations (conversation_id, goal_id, step_id);

ALTER TABLE public.story_goal_step_derivations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='story_goal_step_derivations' AND policyname='Users can view own goal step derivations') THEN
    CREATE POLICY "Users can view own goal step derivations"
      ON public.story_goal_step_derivations FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='story_goal_step_derivations' AND policyname='Users can insert own goal step derivations') THEN
    CREATE POLICY "Users can insert own goal step derivations"
      ON public.story_goal_step_derivations FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='story_goal_step_derivations' AND policyname='Users can update own goal step derivations') THEN
    CREATE POLICY "Users can update own goal step derivations"
      ON public.story_goal_step_derivations FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='story_goal_step_derivations' AND policyname='Users can delete own goal step derivations') THEN
    CREATE POLICY "Users can delete own goal step derivations"
      ON public.story_goal_step_derivations FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END$$;
