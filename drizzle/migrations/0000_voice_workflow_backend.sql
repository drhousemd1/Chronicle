-- Chronicle voice workflow backend (admin-only). Preserves voice_sample_sets and voice-samples.
CREATE TABLE public.voice_catalog_categories (
  id text PRIMARY KEY CHECK (id ~ '^[A-Za-z0-9_-]{1,128}$'),
  scope text NOT NULL CHECK (scope IN ('system','personal')),
  owner_id uuid,
  label text NOT NULL CHECK (length(btrim(label)) BETWEEN 1 AND 60),
  position integer NOT NULL DEFAULT 0,
  revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT voice_catalog_categories_scope_owner CHECK ((scope = 'system' AND owner_id IS NULL) OR (scope = 'personal' AND owner_id IS NOT NULL))
);
CREATE INDEX voice_catalog_categories_order ON public.voice_catalog_categories (scope, owner_id, position);

CREATE TABLE public.voice_catalog_entries (
  id text PRIMARY KEY CHECK (id ~ '^[A-Za-z0-9_-]{1,128}$'),
  scope text NOT NULL CHECK (scope IN ('system','personal')),
  owner_id uuid,
  category_id text REFERENCES public.voice_catalog_categories(id) ON DELETE SET NULL,
  position integer NOT NULL DEFAULT 0,
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 100),
  description text NOT NULL DEFAULT '' CHECK (length(description) <= 8000),
  presentation jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(presentation) = 'object'),
  revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
  removed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT voice_catalog_entries_scope_owner CHECK ((scope = 'system' AND owner_id IS NULL) OR (scope = 'personal' AND owner_id IS NOT NULL)),
  CONSTRAINT voice_catalog_entries_active_category CHECK (removed_at IS NOT NULL OR category_id IS NOT NULL)
);
CREATE INDEX voice_catalog_entries_order ON public.voice_catalog_entries (category_id, position);

CREATE TABLE public.voice_provider_settings (
  entry_id text PRIMARY KEY REFERENCES public.voice_catalog_entries(id),
  draft jsonb NOT NULL DEFAULT '{}'::jsonb,
  compiled jsonb NOT NULL DEFAULT '{}'::jsonb,
  identity jsonb,
  job_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.voice_admin_drafts (
  owner_id uuid NOT NULL,
  mode text NOT NULL CHECK (mode IN ('system','personal')),
  draft jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(draft) = 'object'),
  revision integer NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, mode)
);

CREATE TABLE public.voice_generation_jobs (
  id text PRIMARY KEY DEFAULT replace(gen_random_uuid()::text, '-', '') CHECK (id ~ '^[A-Za-z0-9_-]{1,128}$'),
  owner_id uuid NOT NULL,
  mode text NOT NULL CHECK (mode IN ('system','personal')),
  destination text NOT NULL CHECK (destination IN ('system','personal')),
  new_voice boolean NOT NULL DEFAULT false,
  idempotency_key text NOT NULL CHECK (length(idempotency_key) BETWEEN 8 AND 200),
  request_hash text NOT NULL,
  draft jsonb NOT NULL,
  compiled jsonb NOT NULL,
  fingerprint text NOT NULL,
  stage text NOT NULL CHECK (stage IN ('queued','voice_creating','voice_ready','speech_running','ready','error')),
  uncertain boolean NOT NULL DEFAULT false,
  message text NOT NULL DEFAULT '',
  provider_voice_id text,
  identity jsonb,
  audio_path text,
  stage_started_at timestamptz,
  deadline_at timestamptz,
  discarded_at timestamptz,
  committed_entry_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT voice_generation_jobs_owner_key UNIQUE (owner_id, idempotency_key)
);
CREATE UNIQUE INDEX voice_generation_jobs_one_active ON public.voice_generation_jobs (owner_id)
  WHERE stage IN ('queued','voice_creating','voice_ready','speech_running') AND discarded_at IS NULL;
CREATE INDEX voice_generation_jobs_owner_recent ON public.voice_generation_jobs (owner_id, created_at DESC);
CREATE INDEX voice_generation_jobs_fingerprint ON public.voice_generation_jobs (owner_id, fingerprint) WHERE provider_voice_id IS NOT NULL;

CREATE TABLE public.voice_provider_voices (
  id text PRIMARY KEY,
  name text NOT NULL DEFAULT '',
  info jsonb NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.voice_migration_ledger (
  migration_id text NOT NULL CHECK (length(migration_id) BETWEEN 1 AND 200),
  item_kind text NOT NULL,
  item_id text NOT NULL,
  outcome text NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (migration_id, item_kind, item_id)
);

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['voice_catalog_categories','voice_catalog_entries','voice_provider_settings','voice_admin_drafts','voice_generation_jobs','voice_provider_voices','voice_migration_ledger'] LOOP
    EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC, anon, authenticated', t);
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "Admins read %s" ON public.%I FOR SELECT TO authenticated USING ((SELECT public.has_role(auth.uid(), ''admin''::public.app_role)))', t, t);
  END LOOP;
END $$;

-- Buckets voice-images (3MB, private) and voice-generation (private) are created via the storage API.
CREATE POLICY "Admins read voice images" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'voice-images' AND (SELECT public.has_role(auth.uid(), 'admin'::public.app_role)));
CREATE POLICY "Admins upload voice images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'voice-images' AND lower(name) ~ '[.](png|jpe?g|webp)$' AND (SELECT public.has_role(auth.uid(), 'admin'::public.app_role)));
CREATE POLICY "Admins read voice generation audio" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'voice-generation' AND (SELECT public.has_role(auth.uid(), 'admin'::public.app_role)));

CREATE FUNCTION public.voice_assert_admin() RETURNS void LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE = 'VC403';
  END IF;
END $$;

CREATE FUNCTION public.voice_scope_owner(p_mode text) RETURNS uuid LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF p_mode = 'system' THEN RETURN NULL; END IF;
  IF p_mode = 'personal' THEN RETURN auth.uid(); END IF;
  RAISE EXCEPTION 'Mode must be system or personal' USING ERRCODE = 'VC400';
END $$;

CREATE FUNCTION public.voice_storage_exists(p_bucket text, p_path text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT p_path IS NOT NULL AND EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id = p_bucket AND name = p_path);
$$;

CREATE FUNCTION public.voice_valid_presentation(p jsonb) RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE k text; v text;
BEGIN
  IF p IS NULL THEN RETURN true; END IF;
  IF jsonb_typeof(p) <> 'object' THEN RETURN false; END IF;
  FOREACH k IN ARRAY ARRAY['image','image_path'] LOOP
    IF p ? k AND jsonb_typeof(p->k) NOT IN ('string','null') THEN RETURN false; END IF;
    v := p->>k;
    CONTINUE WHEN v IS NULL OR v = '';
    CONTINUE WHEN v IN ('/images/time-backgrounds/night.png','/images/time-backgrounds/sunrise.png','/images/time-backgrounds/sunset.png');
    IF v !~ '^[A-Za-z0-9_][A-Za-z0-9/_.-]{0,511}$' OR v ~ '\.\.' OR NOT public.voice_storage_exists('voice-images', v) THEN RETURN false; END IF;
  END LOOP;
  RETURN true;
END $$;

CREATE FUNCTION public.voice_draft_save(p_mode text, p_draft jsonb, p_expected_revision integer) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_rev integer;
BEGIN
  PERFORM public.voice_assert_admin();
  PERFORM public.voice_scope_owner(p_mode);
  IF p_draft IS NULL OR jsonb_typeof(p_draft) <> 'object' THEN RAISE EXCEPTION 'Draft must be an object' USING ERRCODE = 'VC400'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('voice_draft:' || auth.uid()::text || ':' || p_mode));
  SELECT revision INTO v_rev FROM public.voice_admin_drafts WHERE owner_id = auth.uid() AND mode = p_mode FOR UPDATE;
  v_rev := coalesce(v_rev, 0);
  IF v_rev <> coalesce(p_expected_revision, -1) THEN RAISE EXCEPTION 'Draft changed elsewhere' USING ERRCODE = 'VC409'; END IF;
  INSERT INTO public.voice_admin_drafts (owner_id, mode, draft, revision, updated_at) VALUES (auth.uid(), p_mode, p_draft, v_rev + 1, now())
  ON CONFLICT (owner_id, mode) DO UPDATE SET draft = excluded.draft, revision = excluded.revision, updated_at = now();
  RETURN jsonb_build_object('draft', p_draft, 'revision', v_rev + 1);
END $$;

CREATE FUNCTION public.voice_job_submit(p_mode text, p_destination text, p_new_voice boolean, p_key text, p_hash text,
  p_draft jsonb, p_compiled jsonb, p_fingerprint text, p_identity jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE j public.voice_generation_jobs;
BEGIN
  PERFORM public.voice_assert_admin();
  PERFORM public.voice_scope_owner(p_mode);
  PERFORM public.voice_scope_owner(p_destination);
  PERFORM pg_advisory_xact_lock(hashtext('voice_job:' || auth.uid()::text));
  SELECT * INTO j FROM public.voice_generation_jobs WHERE owner_id = auth.uid() AND idempotency_key = p_key;
  IF FOUND THEN
    IF j.request_hash <> p_hash THEN RAISE EXCEPTION 'Idempotency key was already used for a different request' USING ERRCODE = 'VC409'; END IF;
    RETURN jsonb_build_object('existing', true, 'job', to_jsonb(j));
  END IF;
  IF EXISTS (SELECT 1 FROM public.voice_generation_jobs WHERE owner_id = auth.uid() AND discarded_at IS NULL
             AND stage IN ('queued','voice_creating','voice_ready','speech_running')) THEN
    RAISE EXCEPTION 'Another generation is already in progress' USING ERRCODE = 'VC409';
  END IF;
  INSERT INTO public.voice_generation_jobs (owner_id, mode, destination, new_voice, idempotency_key, request_hash, draft, compiled, fingerprint,
    stage, provider_voice_id, identity, message)
  VALUES (auth.uid(), p_mode, p_destination, coalesce(p_new_voice, false), p_key, p_hash, p_draft, p_compiled, p_fingerprint,
    CASE WHEN p_identity IS NULL THEN 'queued' ELSE 'voice_ready' END, p_identity->>'provider_voice_id', p_identity,
    CASE WHEN p_identity IS NULL THEN 'Queued' ELSE 'Reusing saved voice identity' END)
  RETURNING * INTO j;
  RETURN jsonb_build_object('existing', false, 'job', to_jsonb(j));
END $$;

CREATE FUNCTION public.voice_job_claim(p_id text, p_from text, p_to text, p_deadline_seconds integer) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE j public.voice_generation_jobs;
BEGIN
  PERFORM public.voice_assert_admin();
  IF NOT ((p_from = 'queued' AND p_to = 'voice_creating') OR (p_from = 'voice_ready' AND p_to = 'speech_running')) THEN
    RAISE EXCEPTION 'Invalid stage transition' USING ERRCODE = 'VC400';
  END IF;
  UPDATE public.voice_generation_jobs SET stage = p_to, stage_started_at = now(),
    deadline_at = now() + make_interval(secs => least(greatest(p_deadline_seconds, 10), 150)),
    message = CASE WHEN p_to = 'voice_creating' THEN 'Creating voice' ELSE 'Generating sample' END, updated_at = now()
  WHERE id = p_id AND owner_id = auth.uid() AND stage = p_from AND discarded_at IS NULL
  RETURNING * INTO j;
  IF NOT FOUND THEN RETURN NULL; END IF;
  RETURN to_jsonb(j);
END $$;

CREATE FUNCTION public.voice_job_expire() RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE n integer;
BEGIN
  PERFORM public.voice_assert_admin();
  UPDATE public.voice_generation_jobs SET
    uncertain = (stage IN ('voice_creating','speech_running')),
    message = CASE WHEN stage = 'queued' THEN 'Generation never started; no paid request was sent.'
                   ELSE 'The provider request did not finish in time. Its outcome is uncertain and it was not retried.' END,
    stage = 'error', deadline_at = NULL, updated_at = now()
  WHERE owner_id = auth.uid() AND (
    (stage IN ('voice_creating','speech_running') AND deadline_at < now())
    OR (stage = 'queued' AND created_at < now() - interval '2 minutes'));
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

CREATE FUNCTION public.voice_job_discard(p_id text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE j public.voice_generation_jobs;
BEGIN
  PERFORM public.voice_assert_admin();
  SELECT * INTO j FROM public.voice_generation_jobs WHERE id = p_id AND owner_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Generation not found' USING ERRCODE = 'VC404'; END IF;
  IF j.discarded_at IS NOT NULL THEN RETURN to_jsonb(j); END IF;
  IF j.stage IN ('voice_creating','speech_running') THEN RAISE EXCEPTION 'A provider request is still running' USING ERRCODE = 'VC409'; END IF;
  IF j.committed_entry_id IS NOT NULL THEN RAISE EXCEPTION 'Generation is already saved' USING ERRCODE = 'VC409'; END IF;
  UPDATE public.voice_generation_jobs SET discarded_at = now(), updated_at = now() WHERE id = p_id RETURNING * INTO j;
  RETURN to_jsonb(j);
END $$;

CREATE FUNCTION public.voice_commit(p_mode text, p_entry_id text, p_expected_revision integer, p_name text, p_description text,
  p_presentation jsonb, p_samples jsonb, p_default_sample_id text, p_sample_revision integer, p_job_id text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_owner uuid; e public.voice_catalog_entries; j public.voice_generation_jobs; v_cat text; v_rev integer; item jsonb; ss public.voice_sample_sets;
BEGIN
  PERFORM public.voice_assert_admin();
  v_owner := public.voice_scope_owner(p_mode);
  PERFORM pg_advisory_xact_lock(hashtext('voice_catalog'));
  IF p_name IS NULL OR length(btrim(p_name)) NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Name must be 1-100 characters' USING ERRCODE = 'VC400'; END IF;
  IF p_description IS NOT NULL AND length(p_description) > 8000 THEN RAISE EXCEPTION 'Description is too long' USING ERRCODE = 'VC400'; END IF;
  IF NOT public.voice_valid_presentation(p_presentation) THEN
    RAISE EXCEPTION 'Presentation image must be a staged voice image or a built-in background' USING ERRCODE = 'VC400';
  END IF;

  IF p_job_id IS NOT NULL THEN
    SELECT * INTO j FROM public.voice_generation_jobs WHERE id = p_job_id AND owner_id = auth.uid() FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Generation not found' USING ERRCODE = 'VC404'; END IF;
    IF j.committed_entry_id IS NOT NULL THEN
      SELECT * INTO e FROM public.voice_catalog_entries WHERE id = j.committed_entry_id;
      SELECT * INTO ss FROM public.voice_sample_sets WHERE voice_id = e.id;
      RETURN jsonb_build_object('entry', to_jsonb(e), 'sample_set', to_jsonb(ss), 'idempotent', true);
    END IF;
    IF j.destination <> p_mode THEN RAISE EXCEPTION 'Generation destination does not match mode' USING ERRCODE = 'VC400'; END IF;
    IF j.stage <> 'ready' OR j.discarded_at IS NOT NULL THEN RAISE EXCEPTION 'Generation is not ready to save' USING ERRCODE = 'VC409'; END IF;
    IF EXISTS (SELECT 1 FROM public.voice_catalog_entries WHERE id = j.id) THEN RAISE EXCEPTION 'A voice with this id already exists' USING ERRCODE = 'VC409'; END IF;
    SELECT id INTO v_cat FROM public.voice_catalog_categories WHERE scope = p_mode AND owner_id IS NOT DISTINCT FROM v_owner ORDER BY position, created_at LIMIT 1;
    IF v_cat IS NULL THEN
      v_cat := replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.voice_catalog_categories (id, scope, owner_id, label, position) VALUES (v_cat, p_mode, v_owner, 'Voices', 0);
    END IF;
    INSERT INTO public.voice_catalog_entries (id, scope, owner_id, category_id, position, name, description, presentation)
    VALUES (j.id, p_mode, v_owner, v_cat,
      coalesce((SELECT max(position) + 1 FROM public.voice_catalog_entries WHERE category_id = v_cat AND removed_at IS NULL), 0),
      btrim(p_name), coalesce(p_description, ''), coalesce(p_presentation, '{}'::jsonb))
    RETURNING * INTO e;
    INSERT INTO public.voice_provider_settings (entry_id, draft, compiled, identity, job_id) VALUES (j.id, j.draft, j.compiled, j.identity, j.id);
    UPDATE public.voice_generation_jobs SET committed_entry_id = j.id, updated_at = now() WHERE id = j.id;
  ELSE
    SELECT * INTO e FROM public.voice_catalog_entries WHERE id = p_entry_id FOR UPDATE;
    IF NOT FOUND OR e.removed_at IS NOT NULL OR e.scope <> p_mode OR e.owner_id IS DISTINCT FROM v_owner THEN
      RAISE EXCEPTION 'Voice not found' USING ERRCODE = 'VC404';
    END IF;
    IF e.revision <> coalesce(p_expected_revision, -1) THEN RAISE EXCEPTION 'Voice changed elsewhere' USING ERRCODE = 'VC409'; END IF;
    UPDATE public.voice_catalog_entries SET name = btrim(p_name), description = coalesce(p_description, description),
      presentation = coalesce(p_presentation, presentation), revision = revision + 1, updated_at = now()
    WHERE id = e.id RETURNING * INTO e;
  END IF;

  IF p_samples IS NOT NULL THEN
    IF jsonb_typeof(p_samples) <> 'array' THEN RAISE EXCEPTION 'Samples must be an array' USING ERRCODE = 'VC400'; END IF;
    SELECT revision INTO v_rev FROM public.voice_sample_sets WHERE voice_id = e.id FOR UPDATE;
    IF coalesce(v_rev, 0) <> coalesce(p_sample_revision, 0) THEN RAISE EXCEPTION 'Samples changed elsewhere' USING ERRCODE = 'VC409'; END IF;
    FOR item IN SELECT value FROM jsonb_array_elements(p_samples) LOOP
      IF NOT public.voice_storage_exists('voice-samples', item->>'path') THEN RAISE EXCEPTION 'A sample file is missing from storage' USING ERRCODE = 'VC400'; END IF;
    END LOOP;
    INSERT INTO public.voice_sample_sets (voice_id, samples, default_sample_id, revision, updated_at)
    VALUES (e.id, p_samples, p_default_sample_id, coalesce(v_rev, 0) + 1, now())
    ON CONFLICT (voice_id) DO UPDATE SET samples = excluded.samples, default_sample_id = excluded.default_sample_id, revision = excluded.revision, updated_at = now();
  END IF;
  SELECT * INTO ss FROM public.voice_sample_sets WHERE voice_id = e.id;
  RETURN jsonb_build_object('entry', to_jsonb(e), 'sample_set', to_jsonb(ss), 'idempotent', false);
END $$;

CREATE FUNCTION public.voice_reorder_sections(p_scope text, p_owner uuid, p_ids text[]) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  UPDATE public.voice_catalog_categories c SET position = o.ord - 1, updated_at = now()
  FROM unnest(p_ids) WITH ORDINALITY AS o(id, ord) WHERE c.id = o.id AND c.scope = p_scope AND c.owner_id IS NOT DISTINCT FROM p_owner;
END $$;

CREATE FUNCTION public.voice_reorder_entries(p_category text, p_ids text[]) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  UPDATE public.voice_catalog_entries e SET position = o.ord - 1
  FROM unnest(p_ids) WITH ORDINALITY AS o(id, ord) WHERE e.id = o.id AND e.category_id = p_category;
END $$;

CREATE FUNCTION public.voice_section_add(p_mode text, p_id text, p_label text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_owner uuid; c public.voice_catalog_categories;
BEGIN
  PERFORM public.voice_assert_admin();
  v_owner := public.voice_scope_owner(p_mode);
  PERFORM pg_advisory_xact_lock(hashtext('voice_catalog'));
  IF p_label IS NULL OR length(btrim(p_label)) NOT BETWEEN 1 AND 60 THEN RAISE EXCEPTION 'Section label must be 1-60 characters' USING ERRCODE = 'VC400'; END IF;
  IF p_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.voice_catalog_categories WHERE id = p_id) THEN RAISE EXCEPTION 'Section id already exists' USING ERRCODE = 'VC409'; END IF;
  INSERT INTO public.voice_catalog_categories (id, scope, owner_id, label, position)
  VALUES (coalesce(p_id, replace(gen_random_uuid()::text, '-', '')), p_mode, v_owner, btrim(p_label),
    coalesce((SELECT max(position) + 1 FROM public.voice_catalog_categories WHERE scope = p_mode AND owner_id IS NOT DISTINCT FROM v_owner), 0))
  RETURNING * INTO c;
  RETURN to_jsonb(c);
END $$;

CREATE FUNCTION public.voice_section_update(p_mode text, p_id text, p_label text, p_expected_revision integer) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_owner uuid; c public.voice_catalog_categories;
BEGIN
  PERFORM public.voice_assert_admin();
  v_owner := public.voice_scope_owner(p_mode);
  PERFORM pg_advisory_xact_lock(hashtext('voice_catalog'));
  IF p_label IS NULL OR length(btrim(p_label)) NOT BETWEEN 1 AND 60 THEN RAISE EXCEPTION 'Section label must be 1-60 characters' USING ERRCODE = 'VC400'; END IF;
  SELECT * INTO c FROM public.voice_catalog_categories WHERE id = p_id AND scope = p_mode AND owner_id IS NOT DISTINCT FROM v_owner FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Section not found' USING ERRCODE = 'VC404'; END IF;
  IF c.revision <> coalesce(p_expected_revision, -1) THEN RAISE EXCEPTION 'Section changed elsewhere' USING ERRCODE = 'VC409'; END IF;
  UPDATE public.voice_catalog_categories SET label = btrim(p_label), revision = revision + 1, updated_at = now() WHERE id = p_id RETURNING * INTO c;
  RETURN to_jsonb(c);
END $$;

CREATE FUNCTION public.voice_section_remove(p_mode text, p_id text, p_expected_revision integer) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_owner uuid; c public.voice_catalog_categories; v_ids text[];
BEGIN
  PERFORM public.voice_assert_admin();
  v_owner := public.voice_scope_owner(p_mode);
  PERFORM pg_advisory_xact_lock(hashtext('voice_catalog'));
  SELECT * INTO c FROM public.voice_catalog_categories WHERE id = p_id AND scope = p_mode AND owner_id IS NOT DISTINCT FROM v_owner FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Section not found' USING ERRCODE = 'VC404'; END IF;
  IF c.revision <> coalesce(p_expected_revision, -1) THEN RAISE EXCEPTION 'Section changed elsewhere' USING ERRCODE = 'VC409'; END IF;
  IF EXISTS (SELECT 1 FROM public.voice_catalog_entries WHERE category_id = p_id AND removed_at IS NULL) THEN
    RAISE EXCEPTION 'Only empty sections can be removed' USING ERRCODE = 'VC409';
  END IF;
  DELETE FROM public.voice_catalog_categories WHERE id = p_id;
  SELECT array_agg(id ORDER BY position, created_at) INTO v_ids FROM public.voice_catalog_categories WHERE scope = p_mode AND owner_id IS NOT DISTINCT FROM v_owner;
  PERFORM public.voice_reorder_sections(p_mode, v_owner, coalesce(v_ids, '{}'));
END $$;

CREATE FUNCTION public.voice_section_move(p_mode text, p_id text, p_before_id text, p_expected_revision integer) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_owner uuid; c public.voice_catalog_categories; v_ids text[]; v_pos integer;
BEGIN
  PERFORM public.voice_assert_admin();
  v_owner := public.voice_scope_owner(p_mode);
  PERFORM pg_advisory_xact_lock(hashtext('voice_catalog'));
  SELECT * INTO c FROM public.voice_catalog_categories WHERE id = p_id AND scope = p_mode AND owner_id IS NOT DISTINCT FROM v_owner FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Section not found' USING ERRCODE = 'VC404'; END IF;
  IF c.revision <> coalesce(p_expected_revision, -1) THEN RAISE EXCEPTION 'Section changed elsewhere' USING ERRCODE = 'VC409'; END IF;
  IF p_before_id = p_id THEN RAISE EXCEPTION 'Invalid move target' USING ERRCODE = 'VC400'; END IF;
  SELECT coalesce(array_agg(id ORDER BY position, created_at), '{}') INTO v_ids FROM public.voice_catalog_categories
    WHERE scope = p_mode AND owner_id IS NOT DISTINCT FROM v_owner AND id <> p_id;
  IF p_before_id IS NULL THEN v_ids := v_ids || p_id;
  ELSE
    v_pos := array_position(v_ids, p_before_id);
    IF v_pos IS NULL THEN RAISE EXCEPTION 'Target section not found' USING ERRCODE = 'VC404'; END IF;
    v_ids := v_ids[1:v_pos - 1] || p_id || v_ids[v_pos:];
  END IF;
  PERFORM public.voice_reorder_sections(p_mode, v_owner, v_ids);
  UPDATE public.voice_catalog_categories SET revision = revision + 1 WHERE id = p_id;
END $$;

CREATE FUNCTION public.voice_entry_move(p_mode text, p_id text, p_section_id text, p_before_id text, p_expected_revision integer) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_owner uuid; e public.voice_catalog_entries; v_ids text[]; v_pos integer;
BEGIN
  PERFORM public.voice_assert_admin();
  v_owner := public.voice_scope_owner(p_mode);
  PERFORM pg_advisory_xact_lock(hashtext('voice_catalog'));
  SELECT * INTO e FROM public.voice_catalog_entries WHERE id = p_id AND scope = p_mode AND owner_id IS NOT DISTINCT FROM v_owner AND removed_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Voice not found' USING ERRCODE = 'VC404'; END IF;
  IF e.revision <> coalesce(p_expected_revision, -1) THEN RAISE EXCEPTION 'Voice changed elsewhere' USING ERRCODE = 'VC409'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.voice_catalog_categories WHERE id = p_section_id AND scope = p_mode AND owner_id IS NOT DISTINCT FROM v_owner) THEN
    RAISE EXCEPTION 'Target section not found' USING ERRCODE = 'VC404';
  END IF;
  IF p_before_id = p_id THEN RAISE EXCEPTION 'Invalid move target' USING ERRCODE = 'VC400'; END IF;
  UPDATE public.voice_catalog_entries SET category_id = p_section_id, revision = revision + 1, updated_at = now() WHERE id = p_id;
  SELECT coalesce(array_agg(id ORDER BY position, created_at), '{}') INTO v_ids FROM public.voice_catalog_entries
    WHERE category_id = p_section_id AND removed_at IS NULL AND id <> p_id;
  IF p_before_id IS NULL THEN v_ids := v_ids || p_id;
  ELSE
    v_pos := array_position(v_ids, p_before_id);
    IF v_pos IS NULL THEN RAISE EXCEPTION 'Target voice not found in section' USING ERRCODE = 'VC404'; END IF;
    v_ids := v_ids[1:v_pos - 1] || p_id || v_ids[v_pos:];
  END IF;
  PERFORM public.voice_reorder_entries(p_section_id, v_ids);
  IF e.category_id IS NOT NULL AND e.category_id <> p_section_id THEN
    SELECT coalesce(array_agg(id ORDER BY position, created_at), '{}') INTO v_ids FROM public.voice_catalog_entries WHERE category_id = e.category_id AND removed_at IS NULL;
    PERFORM public.voice_reorder_entries(e.category_id, v_ids);
  END IF;
END $$;

CREATE FUNCTION public.voice_entry_remove(p_mode text, p_id text, p_expected_revision integer) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_owner uuid; e public.voice_catalog_entries;
BEGIN
  PERFORM public.voice_assert_admin();
  v_owner := public.voice_scope_owner(p_mode);
  PERFORM pg_advisory_xact_lock(hashtext('voice_catalog'));
  SELECT * INTO e FROM public.voice_catalog_entries WHERE id = p_id AND scope = p_mode AND owner_id IS NOT DISTINCT FROM v_owner AND removed_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Voice not found' USING ERRCODE = 'VC404'; END IF;
  IF e.revision <> coalesce(p_expected_revision, -1) THEN RAISE EXCEPTION 'Voice changed elsewhere' USING ERRCODE = 'VC409'; END IF;
  UPDATE public.voice_catalog_entries SET removed_at = now(), revision = revision + 1, updated_at = now() WHERE id = p_id;
END $$;

CREATE FUNCTION public.voice_import(p_migration_id text, p_categories jsonb, p_entries jsonb, p_provider_voices jsonb, p_drafts jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE item jsonb; v_imported integer := 0; v_skipped integer := 0; v_failed jsonb := '[]'::jsonb; v_owner uuid; v_scope text; v_id text;
  s jsonb; v_ok boolean; v_mode text; n integer;
BEGIN
  PERFORM public.voice_assert_admin();
  IF p_migration_id IS NULL OR length(p_migration_id) NOT BETWEEN 1 AND 200 THEN RAISE EXCEPTION 'migration_id is required' USING ERRCODE = 'VC400'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('voice_catalog'));

  FOR item IN SELECT value FROM jsonb_array_elements(coalesce(p_categories, '[]'::jsonb)) LOOP
    v_id := item->>'id';
    IF EXISTS (SELECT 1 FROM public.voice_migration_ledger WHERE migration_id = p_migration_id AND item_kind = 'category' AND item_id = v_id) THEN v_skipped := v_skipped + 1; CONTINUE; END IF;
    v_scope := coalesce(item->>'scope', 'system');
    v_owner := CASE WHEN v_scope = 'personal' THEN coalesce((item->>'owner_id')::uuid, auth.uid()) END;
    INSERT INTO public.voice_catalog_categories (id, scope, owner_id, label, position)
    VALUES (v_id, v_scope, v_owner, btrim(item->>'label'), coalesce((item->>'position')::integer, 0)) ON CONFLICT (id) DO NOTHING;
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n > 0 THEN v_imported := v_imported + 1; ELSE v_skipped := v_skipped + 1; END IF;
    INSERT INTO public.voice_migration_ledger (migration_id, item_kind, item_id, outcome, created_by) VALUES (p_migration_id, 'category', v_id, CASE WHEN n > 0 THEN 'imported' ELSE 'skipped' END, auth.uid());
  END LOOP;

  FOR item IN SELECT value FROM jsonb_array_elements(coalesce(p_provider_voices, '[]'::jsonb)) LOOP
    v_id := item->>'id';
    IF v_id IS NULL OR EXISTS (SELECT 1 FROM public.voice_migration_ledger WHERE migration_id = p_migration_id AND item_kind = 'provider_voice' AND item_id = v_id) THEN v_skipped := v_skipped + 1; CONTINUE; END IF;
    INSERT INTO public.voice_provider_voices (id, name, info) VALUES (v_id, coalesce(item->>'name', ''), coalesce(item->'info', item)) ON CONFLICT (id) DO NOTHING;
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n > 0 THEN v_imported := v_imported + 1; ELSE v_skipped := v_skipped + 1; END IF;
    INSERT INTO public.voice_migration_ledger (migration_id, item_kind, item_id, outcome, created_by) VALUES (p_migration_id, 'provider_voice', v_id, CASE WHEN n > 0 THEN 'imported' ELSE 'skipped' END, auth.uid());
  END LOOP;

  FOR item IN SELECT value FROM jsonb_array_elements(coalesce(p_entries, '[]'::jsonb)) LOOP
    v_id := item->>'id';
    IF EXISTS (SELECT 1 FROM public.voice_migration_ledger WHERE migration_id = p_migration_id AND item_kind = 'entry' AND item_id = v_id) THEN v_skipped := v_skipped + 1; CONTINUE; END IF;
    v_scope := coalesce(item->>'scope', 'system');
    v_owner := CASE WHEN v_scope = 'personal' THEN coalesce((item->>'owner_id')::uuid, auth.uid()) END;
    v_ok := public.voice_valid_presentation(coalesce(item->'presentation', '{}'::jsonb))
      AND EXISTS (SELECT 1 FROM public.voice_catalog_categories WHERE id = item->>'category_id' AND scope = v_scope AND owner_id IS NOT DISTINCT FROM v_owner);
    IF v_ok AND jsonb_typeof(item->'samples') = 'array' AND NOT EXISTS (SELECT 1 FROM public.voice_sample_sets WHERE voice_id = v_id) THEN
      FOR s IN SELECT value FROM jsonb_array_elements(item->'samples') LOOP
        IF NOT public.voice_storage_exists('voice-samples', s->>'path') THEN v_ok := false; END IF;
      END LOOP;
    END IF;
    IF NOT v_ok THEN v_failed := v_failed || jsonb_build_object('kind', 'entry', 'id', v_id, 'reason', 'missing category or private media'); CONTINUE; END IF;
    INSERT INTO public.voice_catalog_entries (id, scope, owner_id, category_id, position, name, description, presentation)
    VALUES (v_id, v_scope, v_owner, item->>'category_id', coalesce((item->>'position')::integer, 0), btrim(item->>'name'),
      coalesce(item->>'description', ''), coalesce(item->'presentation', '{}'::jsonb)) ON CONFLICT (id) DO NOTHING;
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n > 0 THEN
      IF item ? 'draft' OR item ? 'compiled' OR item ? 'identity' OR item ? 'job_id' THEN
        INSERT INTO public.voice_provider_settings (entry_id, draft, compiled, identity, job_id)
        VALUES (v_id, coalesce(item->'draft', '{}'::jsonb), coalesce(item->'compiled', '{}'::jsonb), item->'identity', item->>'job_id') ON CONFLICT (entry_id) DO NOTHING;
      END IF;
      v_imported := v_imported + 1;
    ELSE v_skipped := v_skipped + 1; END IF;
    IF jsonb_typeof(item->'samples') = 'array' THEN
      INSERT INTO public.voice_sample_sets (voice_id, samples, default_sample_id, revision, updated_at)
      VALUES (v_id, item->'samples', item->>'default_sample_id', 1, now()) ON CONFLICT (voice_id) DO NOTHING;
    END IF;
    INSERT INTO public.voice_migration_ledger (migration_id, item_kind, item_id, outcome, created_by) VALUES (p_migration_id, 'entry', v_id, CASE WHEN n > 0 THEN 'imported' ELSE 'skipped' END, auth.uid());
  END LOOP;

  FOREACH v_mode IN ARRAY ARRAY['system','personal'] LOOP
    CONTINUE WHEN p_drafts IS NULL OR jsonb_typeof(p_drafts->v_mode) IS DISTINCT FROM 'object';
    IF EXISTS (SELECT 1 FROM public.voice_migration_ledger WHERE migration_id = p_migration_id AND item_kind = 'draft' AND item_id = v_mode || ':' || auth.uid()::text) THEN v_skipped := v_skipped + 1; CONTINUE; END IF;
    INSERT INTO public.voice_admin_drafts (owner_id, mode, draft, revision) VALUES (auth.uid(), v_mode, p_drafts->v_mode, 1) ON CONFLICT (owner_id, mode) DO NOTHING;
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n > 0 THEN v_imported := v_imported + 1; ELSE v_skipped := v_skipped + 1; END IF;
    INSERT INTO public.voice_migration_ledger (migration_id, item_kind, item_id, outcome, created_by) VALUES (p_migration_id, 'draft', v_mode || ':' || auth.uid()::text, CASE WHEN n > 0 THEN 'imported' ELSE 'skipped' END, auth.uid());
  END LOOP;

  RETURN jsonb_build_object('imported', v_imported, 'skipped', v_skipped, 'failed', v_failed);
END $$;

DO $$ DECLARE f text; BEGIN
  FOREACH f IN ARRAY ARRAY[
    'voice_assert_admin()','voice_scope_owner(text)','voice_storage_exists(text,text)','voice_valid_presentation(jsonb)',
    'voice_reorder_sections(text,uuid,text[])','voice_reorder_entries(text,text[])'] LOOP
    EXECUTE 'REVOKE ALL ON FUNCTION public.' || f || ' FROM PUBLIC, anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.' || f || ' TO service_role';
  END LOOP;
  FOREACH f IN ARRAY ARRAY[
    'voice_draft_save(text,jsonb,integer)','voice_job_submit(text,text,boolean,text,text,jsonb,jsonb,text,jsonb)',
    'voice_job_claim(text,text,text,integer)','voice_job_expire()','voice_job_discard(text)',
    'voice_commit(text,text,integer,text,text,jsonb,jsonb,text,integer,text)',
    'voice_section_add(text,text,text)','voice_section_update(text,text,text,integer)','voice_section_remove(text,text,integer)',
    'voice_section_move(text,text,text,integer)','voice_entry_move(text,text,text,text,integer)','voice_entry_remove(text,text,integer)',
    'voice_import(text,jsonb,jsonb,jsonb,jsonb)'] LOOP
    EXECUTE 'REVOKE ALL ON FUNCTION public.' || f || ' FROM PUBLIC, anon';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.' || f || ' TO authenticated, service_role';
  END LOOP;
END $$;