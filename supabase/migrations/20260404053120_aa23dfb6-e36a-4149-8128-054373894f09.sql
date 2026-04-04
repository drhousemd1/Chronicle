-- Idempotent hardening: ensure columns referenced by earlier repair UPDATE statements exist.
-- All use ADD COLUMN IF NOT EXISTS so this is a no-op on databases where they already exist.

ALTER TABLE public.ad_spend
  ADD COLUMN IF NOT EXISTS campaign_name text DEFAULT '',
  ADD COLUMN IF NOT EXISTS platform text,
  ADD COLUMN IF NOT EXISTS amount numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS period_start date,
  ADD COLUMN IF NOT EXISTS period_end date,
  ADD COLUMN IF NOT EXISTS notes text DEFAULT '';

ALTER TABLE public.admin_notes
  ADD COLUMN IF NOT EXISTS content text DEFAULT '',
  ADD COLUMN IF NOT EXISTS author_id uuid;

ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS reporter text DEFAULT '',
  ADD COLUMN IF NOT EXISTS accused text DEFAULT '',
  ADD COLUMN IF NOT EXISTS story_id uuid;

ALTER TABLE public.ai_usage_test_events
  ADD COLUMN IF NOT EXISTS event_type text,
  ADD COLUMN IF NOT EXISTS function_name text DEFAULT '',
  ADD COLUMN IF NOT EXISTS payload jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS response_summary text DEFAULT '',
  ADD COLUMN IF NOT EXISTS status_code integer,
  ADD COLUMN IF NOT EXISTS error_message text;