-- Allow admins to read role assignments in the finance dashboard
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin-only role sync helper for dashboard tier changes.
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
END;
$$;

REVOKE ALL ON FUNCTION public.set_admin_access(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_admin_access(uuid, boolean) TO authenticated;
