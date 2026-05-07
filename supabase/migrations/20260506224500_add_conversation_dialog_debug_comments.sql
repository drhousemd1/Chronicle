CREATE TABLE IF NOT EXISTS public.conversation_dialog_debug_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  generation_id UUID NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}'::text[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_conversation_dialog_debug_comment_generation
  ON public.conversation_dialog_debug_comments (conversation_id, message_id, generation_id);

CREATE INDEX IF NOT EXISTS idx_conversation_dialog_debug_comments_lookup
  ON public.conversation_dialog_debug_comments (conversation_id, message_id, updated_at DESC);

ALTER TABLE public.conversation_dialog_debug_comments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'conversation_dialog_debug_comments'
      AND policyname = 'Users can view own conversation dialog debug comments'
  ) THEN
    CREATE POLICY "Users can view own conversation dialog debug comments"
      ON public.conversation_dialog_debug_comments FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'conversation_dialog_debug_comments'
      AND policyname = 'Users can insert own conversation dialog debug comments'
  ) THEN
    CREATE POLICY "Users can insert own conversation dialog debug comments"
      ON public.conversation_dialog_debug_comments FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'conversation_dialog_debug_comments'
      AND policyname = 'Users can update own conversation dialog debug comments'
  ) THEN
    CREATE POLICY "Users can update own conversation dialog debug comments"
      ON public.conversation_dialog_debug_comments FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'conversation_dialog_debug_comments'
      AND policyname = 'Users can delete own conversation dialog debug comments'
  ) THEN
    CREATE POLICY "Users can delete own conversation dialog debug comments"
      ON public.conversation_dialog_debug_comments FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_conversation_dialog_debug_comments_updated_at ON public.conversation_dialog_debug_comments;
CREATE TRIGGER update_conversation_dialog_debug_comments_updated_at
BEFORE UPDATE ON public.conversation_dialog_debug_comments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
