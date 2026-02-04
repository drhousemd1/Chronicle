-- Create app_settings table for admin-controlled settings
CREATE TABLE public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read settings (for shared key status)
CREATE POLICY "Anyone authenticated can read settings"
  ON public.app_settings FOR SELECT
  TO authenticated
  USING (true);

-- Only the admin can update settings (hardcoded to your user ID)
CREATE POLICY "Admin can update settings"
  ON public.app_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = '98d690d7-ac5a-4b04-b15e-78b462f5eec6');

CREATE POLICY "Admin can insert settings"
  ON public.app_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = '98d690d7-ac5a-4b04-b15e-78b462f5eec6');

-- Insert default setting (XAI key sharing disabled by default)
INSERT INTO public.app_settings (setting_key, setting_value)
VALUES ('shared_keys', '{"xai": false}');