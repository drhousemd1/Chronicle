
CREATE OR REPLACE FUNCTION public.set_updated_at_finance_live_tables()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
