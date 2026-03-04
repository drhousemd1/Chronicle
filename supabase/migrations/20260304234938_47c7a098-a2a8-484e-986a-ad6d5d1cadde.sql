
-- Step 3: Insert admin role into user_roles
INSERT INTO public.user_roles (user_id, role)
VALUES ('98d690d7-ac5a-4b04-b15e-78b462f5eec6', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 3: Update app_settings RLS to use has_role() instead of hardcoded UUID
DROP POLICY IF EXISTS "Admin can insert settings" ON public.app_settings;
DROP POLICY IF EXISTS "Admin can update settings" ON public.app_settings;

CREATE POLICY "Admin can insert settings"
ON public.app_settings FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update settings"
ON public.app_settings FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Step 5: Add preferred_model column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_model text;
