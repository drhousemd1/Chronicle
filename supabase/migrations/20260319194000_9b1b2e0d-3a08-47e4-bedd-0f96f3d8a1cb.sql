-- Remove vulnerable legacy overload that accepted caller-selected user IDs.
DROP FUNCTION IF EXISTS public.get_folders_with_details(uuid);

-- Keep execution scoped to authenticated callers and service-role automation only.
REVOKE ALL ON FUNCTION public.get_folders_with_details() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_folders_with_details() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_folders_with_details() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_folders_with_details() TO service_role;
