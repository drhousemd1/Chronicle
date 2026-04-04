ALTER TABLE public.ai_usage_test_events
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'ok';