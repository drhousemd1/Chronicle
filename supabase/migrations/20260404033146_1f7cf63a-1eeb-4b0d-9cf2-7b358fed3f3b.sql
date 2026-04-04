
-- ============================================================
-- Finance Dashboard Stabilization — Combined Migration
-- ============================================================

-- 1. ai_usage_test_events
CREATE TABLE IF NOT EXISTS public.ai_usage_test_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.ai_usage_test_sessions(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  function_name text NOT NULL DEFAULT '',
  payload jsonb DEFAULT '{}'::jsonb,
  response_summary text DEFAULT '',
  latency_ms integer,
  status_code integer,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_test_events_session ON public.ai_usage_test_events(session_id, created_at DESC);
ALTER TABLE public.ai_usage_test_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert own test events" ON public.ai_usage_test_events;
CREATE POLICY "Users can insert own test events" ON public.ai_usage_test_events
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ai_usage_test_sessions s
      WHERE s.id = ai_usage_test_events.session_id AND s.user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "Admins can read all test events" ON public.ai_usage_test_events;
CREATE POLICY "Admins can read all test events" ON public.ai_usage_test_events
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- 2. set_admin_access function
CREATE OR REPLACE FUNCTION public.set_admin_access(_user_id uuid, _enabled boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _enabled THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    DELETE FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin';
  END IF;

  -- Sync the "View Admin UI" app_setting
  INSERT INTO public.app_settings (setting_key, setting_value, updated_by)
  VALUES (
    'user_admin_access_' || _user_id::text,
    to_jsonb(_enabled),
    auth.uid()
  )
  ON CONFLICT (setting_key) DO UPDATE
  SET setting_value = to_jsonb(_enabled),
      updated_by = auth.uid(),
      updated_at = now();
END;
$$;

-- Admin can view all roles (needed for user management)
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- 3. ad_spend
CREATE TABLE IF NOT EXISTS public.ad_spend (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  campaign_name text NOT NULL DEFAULT '',
  amount numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  period_start date NOT NULL,
  period_end date NOT NULL,
  notes text NOT NULL DEFAULT '',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ad_spend ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage ad spend" ON public.ad_spend;
CREATE POLICY "Admins can manage ad spend" ON public.ad_spend
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE OR REPLACE TRIGGER update_ad_spend_updated_at
  BEFORE UPDATE ON public.ad_spend
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. admin_notes
CREATE TABLE IF NOT EXISTS public.admin_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL DEFAULT '',
  author_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage notes" ON public.admin_notes;
CREATE POLICY "Admins can manage notes" ON public.admin_notes
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE OR REPLACE TRIGGER update_admin_notes_updated_at
  BEFORE UPDATE ON public.admin_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. reports
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter text NOT NULL,
  accused text NOT NULL,
  reason text NOT NULL,
  story_id text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage reports" ON public.reports;
CREATE POLICY "Admins can manage reports" ON public.reports
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Allow authenticated users to insert reports (file a report)
DROP POLICY IF EXISTS "Authenticated users can file reports" ON public.reports;
CREATE POLICY "Authenticated users can file reports" ON public.reports
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE OR REPLACE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. user_strikes
CREATE TABLE IF NOT EXISTS public.user_strikes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  reason text NOT NULL,
  issued_by uuid NOT NULL,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_strikes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage strikes" ON public.user_strikes;
CREATE POLICY "Admins can manage strikes" ON public.user_strikes
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- 7. finance_documents
CREATE TABLE IF NOT EXISTS public.finance_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by uuid NOT NULL,
  file_name text NOT NULL,
  storage_path text NOT NULL UNIQUE,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL,
  category text NOT NULL DEFAULT 'Uncategorized',
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_finance_docs_created ON public.finance_documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_finance_docs_user ON public.finance_documents(uploaded_by, created_at DESC);
ALTER TABLE public.finance_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage finance documents" ON public.finance_documents;
CREATE POLICY "Admins can manage finance documents" ON public.finance_documents
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE OR REPLACE TRIGGER update_finance_documents_updated_at
  BEFORE UPDATE ON public.finance_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Storage bucket for finance documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('finance_documents', 'finance_documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for finance_documents bucket
DROP POLICY IF EXISTS "Admins can read finance docs" ON storage.objects;
CREATE POLICY "Admins can read finance docs" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'finance_documents' AND has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can upload finance docs" ON storage.objects;
CREATE POLICY "Admins can upload finance docs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'finance_documents' AND has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update finance docs" ON storage.objects;
CREATE POLICY "Admins can update finance docs" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'finance_documents' AND has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete finance docs" ON storage.objects;
CREATE POLICY "Admins can delete finance docs" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'finance_documents' AND has_role(auth.uid(), 'admin'));

-- 9. Enable realtime for reports
ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;
