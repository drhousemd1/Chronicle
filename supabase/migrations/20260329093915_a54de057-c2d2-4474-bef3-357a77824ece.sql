-- Create ai_usage_events table for tracking AI usage
CREATE TABLE public.ai_usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  event_source text DEFAULT 'client',
  event_count integer DEFAULT 1,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.ai_usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own usage events"
  ON public.ai_usage_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all usage events"
  ON public.ai_usage_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_ai_usage_events_created_at ON public.ai_usage_events (created_at);
CREATE INDEX idx_ai_usage_events_user_id ON public.ai_usage_events (user_id);
CREATE INDEX idx_ai_usage_events_event_type ON public.ai_usage_events (event_type);

-- Create ai_usage_test_sessions table
CREATE TABLE public.ai_usage_test_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  scenario_id uuid,
  scenario_name text DEFAULT '',
  conversation_id uuid,
  conversation_name text DEFAULT '',
  status text DEFAULT 'active',
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.ai_usage_test_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own test sessions"
  ON public.ai_usage_test_sessions FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all test sessions"
  ON public.ai_usage_test_sessions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_ai_usage_test_sessions_user_status ON public.ai_usage_test_sessions (user_id, status);