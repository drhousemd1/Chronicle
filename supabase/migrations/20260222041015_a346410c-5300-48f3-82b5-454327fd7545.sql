
CREATE TABLE public.guide_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT 'Untitled Document',
  content JSONB,
  markdown TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sort_order INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.guide_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can read guide documents"
ON public.guide_documents
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can insert guide documents"
ON public.guide_documents
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update guide documents"
ON public.guide_documents
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete guide documents"
ON public.guide_documents
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_guide_documents_updated_at
BEFORE UPDATE ON public.guide_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
