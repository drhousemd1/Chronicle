
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Shared updated_at trigger helper
CREATE OR REPLACE FUNCTION public.set_updated_at_finance_live_tables()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ad_spend: UNION schema
ALTER TABLE public.ad_spend
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS url text,
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS recurring_cost numeric(12,2),
  ADD COLUMN IF NOT EXISTS cost_cadence text,
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS spent_override numeric(12,2);

UPDATE public.ad_spend
SET
  name = COALESCE(NULLIF(name, ''), NULLIF(campaign_name, ''), NULLIF(platform, ''), 'Untitled'),
  description = COALESCE(description, notes, ''),
  url = COALESCE(url, ''),
  status = CASE WHEN status IN ('active','cancelled') THEN status ELSE 'active' END,
  recurring_cost = COALESCE(recurring_cost, amount, 0),
  cost_cadence = CASE WHEN cost_cadence IN ('mo','yr') THEN cost_cadence ELSE 'mo' END;

ALTER TABLE public.ad_spend
  ALTER COLUMN status SET DEFAULT 'active',
  ALTER COLUMN recurring_cost SET DEFAULT 0,
  ALTER COLUMN cost_cadence SET DEFAULT 'mo';

CREATE INDEX IF NOT EXISTS ad_spend_status_idx ON public.ad_spend (status, created_at DESC);
CREATE INDEX IF NOT EXISTS ad_spend_created_by_idx ON public.ad_spend (created_by, created_at DESC);

DROP TRIGGER IF EXISTS trg_ad_spend_updated_at ON public.ad_spend;
CREATE TRIGGER trg_ad_spend_updated_at
BEFORE UPDATE ON public.ad_spend
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_finance_live_tables();

DROP POLICY IF EXISTS "Admins can manage ad spend" ON public.ad_spend;
DROP POLICY IF EXISTS "Admins can view ad spend" ON public.ad_spend;
DROP POLICY IF EXISTS "Admins can insert ad spend" ON public.ad_spend;
DROP POLICY IF EXISTS "Admins can update ad spend" ON public.ad_spend;
DROP POLICY IF EXISTS "Admins can delete ad spend" ON public.ad_spend;

CREATE POLICY "Admins can manage ad spend"
ON public.ad_spend
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- admin_notes: UNION schema
ALTER TABLE public.admin_notes
  ADD COLUMN IF NOT EXISTS note_key text,
  ADD COLUMN IF NOT EXISTS content_html text,
  ADD COLUMN IF NOT EXISTS updated_by uuid;

UPDATE public.admin_notes
SET
  content_html = COALESCE(content_html, content, ''),
  note_key = COALESCE(NULLIF(note_key, ''), 'note_' || id::text);

CREATE UNIQUE INDEX IF NOT EXISTS admin_notes_note_key_idx ON public.admin_notes (note_key);

DROP TRIGGER IF EXISTS trg_admin_notes_updated_at ON public.admin_notes;
CREATE TRIGGER trg_admin_notes_updated_at
BEFORE UPDATE ON public.admin_notes
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_finance_live_tables();

DROP POLICY IF EXISTS "Admins can manage notes" ON public.admin_notes;
DROP POLICY IF EXISTS "Admins can manage admin notes" ON public.admin_notes;
DROP POLICY IF EXISTS "Admins can view admin notes" ON public.admin_notes;
DROP POLICY IF EXISTS "Admins can insert admin notes" ON public.admin_notes;
DROP POLICY IF EXISTS "Admins can update admin notes" ON public.admin_notes;
DROP POLICY IF EXISTS "Admins can delete admin notes" ON public.admin_notes;

CREATE POLICY "Admins can manage admin notes"
ON public.admin_notes
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- reports: UNION schema
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS reporter_user_id uuid,
  ADD COLUMN IF NOT EXISTS accused_user_id uuid,
  ADD COLUMN IF NOT EXISTS note text,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid;

UPDATE public.reports
SET
  note = COALESCE(note, ''),
  reporter = COALESCE(NULLIF(reporter, ''), reporter_user_id::text, ''),
  accused = COALESCE(NULLIF(accused, ''), accused_user_id::text, '');

ALTER TABLE public.reports
  ALTER COLUMN note SET DEFAULT '';

CREATE INDEX IF NOT EXISTS reports_status_idx ON public.reports (status, created_at DESC);
CREATE INDEX IF NOT EXISTS reports_accused_idx ON public.reports (accused_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS reports_reporter_idx ON public.reports (reporter_user_id, created_at DESC);

DROP TRIGGER IF EXISTS trg_reports_updated_at ON public.reports;
CREATE TRIGGER trg_reports_updated_at
BEFORE UPDATE ON public.reports
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_finance_live_tables();

DROP POLICY IF EXISTS "Admins can manage reports" ON public.reports;
DROP POLICY IF EXISTS "Admins can view reports" ON public.reports;
DROP POLICY IF EXISTS "Admins can update reports" ON public.reports;
DROP POLICY IF EXISTS "Admins can delete reports" ON public.reports;
DROP POLICY IF EXISTS "Users can insert own reports" ON public.reports;
DROP POLICY IF EXISTS "Authenticated users can file reports" ON public.reports;
DROP POLICY IF EXISTS "Users can view own submitted reports" ON public.reports;

CREATE POLICY "Admins can manage reports"
ON public.reports
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own reports"
ON public.reports
FOR INSERT TO authenticated
WITH CHECK (reporter_user_id IS NOT NULL AND auth.uid() = reporter_user_id);

CREATE POLICY "Users can view own submitted reports"
ON public.reports
FOR SELECT TO authenticated
USING (reporter_user_id IS NOT NULL AND auth.uid() = reporter_user_id);

-- user_strikes: UNION schema
ALTER TABLE public.user_strikes
  ADD COLUMN IF NOT EXISTS report_id uuid,
  ADD COLUMN IF NOT EXISTS points integer,
  ADD COLUMN IF NOT EXISTS note text,
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS issued_at timestamptz,
  ADD COLUMN IF NOT EXISTS falls_off_at date,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

UPDATE public.user_strikes
SET
  points = COALESCE(points, 1),
  note = COALESCE(note, ''),
  status = CASE WHEN status IN ('active','reversed') THEN status ELSE 'active' END,
  issued_at = COALESCE(issued_at, created_at, now()),
  falls_off_at = COALESCE(falls_off_at, (expires_at AT TIME ZONE 'UTC')::date),
  updated_at = COALESCE(updated_at, now());

ALTER TABLE public.user_strikes
  ALTER COLUMN points SET DEFAULT 1,
  ALTER COLUMN note SET DEFAULT '',
  ALTER COLUMN status SET DEFAULT 'active',
  ALTER COLUMN issued_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

CREATE INDEX IF NOT EXISTS user_strikes_user_idx ON public.user_strikes (user_id, issued_at DESC);
CREATE INDEX IF NOT EXISTS user_strikes_status_idx ON public.user_strikes (status, issued_at DESC);

DROP TRIGGER IF EXISTS trg_user_strikes_updated_at ON public.user_strikes;
CREATE TRIGGER trg_user_strikes_updated_at
BEFORE UPDATE ON public.user_strikes
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_finance_live_tables();

DROP POLICY IF EXISTS "Admins can manage strikes" ON public.user_strikes;
DROP POLICY IF EXISTS "Admins can manage user strikes" ON public.user_strikes;
DROP POLICY IF EXISTS "Admins can view user strikes" ON public.user_strikes;
DROP POLICY IF EXISTS "Admins can insert user strikes" ON public.user_strikes;
DROP POLICY IF EXISTS "Admins can update user strikes" ON public.user_strikes;
DROP POLICY IF EXISTS "Admins can delete user strikes" ON public.user_strikes;
DROP POLICY IF EXISTS "Users can view own strikes" ON public.user_strikes;

CREATE POLICY "Admins can manage user strikes"
ON public.user_strikes
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own strikes"
ON public.user_strikes
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- ai_usage_test_events: UNION schema for edge functions
ALTER TABLE public.ai_usage_test_events
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS event_key text,
  ADD COLUMN IF NOT EXISTS api_call_group text,
  ADD COLUMN IF NOT EXISTS event_source text,
  ADD COLUMN IF NOT EXISTS model_id text,
  ADD COLUMN IF NOT EXISTS input_chars integer,
  ADD COLUMN IF NOT EXISTS output_chars integer,
  ADD COLUMN IF NOT EXISTS input_tokens_est integer,
  ADD COLUMN IF NOT EXISTS output_tokens_est integer,
  ADD COLUMN IF NOT EXISTS total_tokens_est integer,
  ADD COLUMN IF NOT EXISTS est_cost_usd numeric(12,6),
  ADD COLUMN IF NOT EXISTS metadata jsonb;

UPDATE public.ai_usage_test_events e
SET user_id = s.user_id
FROM public.ai_usage_test_sessions s
WHERE e.session_id = s.id
  AND e.user_id IS NULL;

UPDATE public.ai_usage_test_events
SET
  event_key = COALESCE(NULLIF(event_key, ''), NULLIF(event_type, ''), 'unknown_event'),
  event_type = COALESCE(NULLIF(event_type, ''), NULLIF(event_key, ''), 'unknown_event'),
  event_source = COALESCE(NULLIF(event_source, ''), 'client'),
  input_chars = COALESCE(input_chars, 0),
  output_chars = COALESCE(output_chars, 0),
  input_tokens_est = COALESCE(input_tokens_est, 0),
  output_tokens_est = COALESCE(output_tokens_est, 0),
  total_tokens_est = COALESCE(total_tokens_est, GREATEST(COALESCE(input_tokens_est,0) + COALESCE(output_tokens_est,0), 0), 0),
  est_cost_usd = COALESCE(est_cost_usd, 0),
  metadata = COALESCE(metadata, payload, '{}'::jsonb);

ALTER TABLE public.ai_usage_test_events
  ALTER COLUMN event_source SET DEFAULT 'client',
  ALTER COLUMN input_chars SET DEFAULT 0,
  ALTER COLUMN output_chars SET DEFAULT 0,
  ALTER COLUMN input_tokens_est SET DEFAULT 0,
  ALTER COLUMN output_tokens_est SET DEFAULT 0,
  ALTER COLUMN total_tokens_est SET DEFAULT 0,
  ALTER COLUMN est_cost_usd SET DEFAULT 0,
  ALTER COLUMN metadata SET DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS ai_usage_test_events_session_idx ON public.ai_usage_test_events (session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_usage_test_events_user_idx ON public.ai_usage_test_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_usage_test_events_event_key_idx ON public.ai_usage_test_events (event_key, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_usage_test_events_call_group_idx ON public.ai_usage_test_events (api_call_group, created_at DESC);

DROP POLICY IF EXISTS "Users can insert own test events" ON public.ai_usage_test_events;
DROP POLICY IF EXISTS "Users can view own test events" ON public.ai_usage_test_events;
DROP POLICY IF EXISTS "Admins can read all test events" ON public.ai_usage_test_events;
DROP POLICY IF EXISTS "Admins can view all test events" ON public.ai_usage_test_events;

CREATE POLICY "Users can insert own test events"
ON public.ai_usage_test_events
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own test events"
ON public.ai_usage_test_events
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all test events"
ON public.ai_usage_test_events
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- set_admin_access: DROP old then recreate with correct arg name
DROP FUNCTION IF EXISTS public.set_admin_access(uuid, boolean);

CREATE OR REPLACE FUNCTION public.set_admin_access(_target_user_id uuid, _enabled boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can modify admin access';
  END IF;

  IF _enabled THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_target_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    DELETE FROM public.user_roles
    WHERE user_id = _target_user_id
      AND role = 'admin';
  END IF;

  INSERT INTO public.app_settings (setting_key, setting_value, updated_by)
  VALUES ('user_admin_access_' || _target_user_id::text, to_jsonb(_enabled), auth.uid())
  ON CONFLICT (setting_key) DO UPDATE
  SET setting_value = EXCLUDED.setting_value,
      updated_by = EXCLUDED.updated_by,
      updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.set_admin_access(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_admin_access(uuid, boolean) TO authenticated;

-- storage policies for finance_documents
DROP POLICY IF EXISTS "Admins can read finance docs" ON storage.objects;
CREATE POLICY "Admins can read finance docs"
ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'finance_documents' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can upload finance docs" ON storage.objects;
CREATE POLICY "Admins can upload finance docs"
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'finance_documents' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update finance docs" ON storage.objects;
CREATE POLICY "Admins can update finance docs"
ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'finance_documents' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete finance docs" ON storage.objects;
CREATE POLICY "Admins can delete finance docs"
ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'finance_documents' AND public.has_role(auth.uid(), 'admin'));

-- realtime on reports
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;
