## BF-08 v2: Restrict raw `scenario_reviews` access; expose curated public reviews via RPC

### Current state

**Live RLS on `public.scenario_reviews`** (verified via `pg_policies`):
- SELECT: `"Anyone authenticated can view reviews"` USING `true` — every authenticated user reads every row including per-axis scores and reviewer `user_id`.
- INSERT: `"Users can create own reviews"` — `auth.uid() = user_id`.
- UPDATE: `"Users can update own reviews"` — own-row.
- DELETE: `"Users can delete own reviews"` — own-row.
- No admin policy. Admin tooling reads via service role.

**Frontend raw-table reads:**
| Location | Purpose | Fields actually used |
|---|---|---|
| `gallery-data.ts` `fetchScenarioReviews` (`.select('*')`) | Story Detail review list + spice avg | `id`, `created_at`, `raw_weighted_score`, `spice_level`, `comment`, reviewer display fields |
| `gallery-data.ts` `fetchUserReview` (`.select('*')`) | Pre-fill ReviewModal for author | Full editable field set (own-row) |
| `gallery-data.ts` `fetchCreatorOverallRating` (`.select('raw_weighted_score').in(...)`) | Aggregate on CreatorProfile | aggregate only |
| `gallery-data.ts` `submitReview` / `deleteReview` | Author writes | own-row writes, unchanged |

`StoryDetailModal` consumes only `id`, `created_at`, `raw_weighted_score`, `spice_level`, `comment`, and `reviewer.{display_name,username,avatar_url}` — it does NOT use `user_id`. `CreatorProfile` consumes only the aggregate.

### Proposed migration (single file)

```sql
-- 1) Sanitized public RPC: no reviewer user_id, no per-axis scores, hard-capped pagination
CREATE OR REPLACE FUNCTION public.get_public_scenario_reviews(
  p_published_scenario_id uuid,
  p_limit int DEFAULT 5,
  p_offset int DEFAULT 0
) RETURNS TABLE (
  id uuid,
  raw_weighted_score numeric,
  spice_level int,
  comment text,
  created_at timestamptz,
  reviewer_username text,
  reviewer_display_name text,
  reviewer_avatar_url text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    r.id,
    r.raw_weighted_score,
    r.spice_level,
    r.comment,
    r.created_at,
    CASE WHEN COALESCE(p.hide_profile_details,false) THEN NULL ELSE p.username END,
    CASE WHEN COALESCE(p.hide_profile_details,false) THEN NULL ELSE p.display_name END,
    CASE WHEN COALESCE(p.hide_profile_details,false) THEN NULL ELSE p.avatar_url END
  FROM public.scenario_reviews r
  JOIN public.published_scenarios ps ON ps.id = r.published_scenario_id
  JOIN public.profiles pub ON pub.id = ps.publisher_id
  LEFT JOIN public.profiles p ON p.id = r.user_id
  WHERE r.published_scenario_id = p_published_scenario_id
    AND ps.is_published = true
    AND ps.is_hidden = false
    AND COALESCE(pub.hide_published_works, false) = false
  ORDER BY r.created_at DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 5), 0), 50)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
$$;

-- 2) Sanitized creator aggregate RPC
CREATE OR REPLACE FUNCTION public.get_creator_overall_rating(p_publisher_id uuid)
RETURNS TABLE (rating numeric, total_reviews bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_caller uuid := auth.uid();
        v_is_owner boolean := (v_caller IS NOT NULL AND v_caller = p_publisher_id);
        v_is_admin boolean := (v_caller IS NOT NULL AND public.has_role(v_caller,'admin'));
        v_hide boolean;
BEGIN
  SELECT COALESCE(hide_published_works,false) INTO v_hide
    FROM public.profiles WHERE id = p_publisher_id;
  IF v_hide AND NOT v_is_owner AND NOT v_is_admin THEN
    RETURN QUERY SELECT 0::numeric, 0::bigint; RETURN;
  END IF;
  RETURN QUERY
  SELECT COALESCE(AVG(r.raw_weighted_score),0)::numeric,
         COUNT(*)::bigint
  FROM public.scenario_reviews r
  JOIN public.published_scenarios ps ON ps.id = r.published_scenario_id
  WHERE ps.publisher_id = p_publisher_id
    AND ps.is_published = true
    AND ps.is_hidden = false
    AND r.raw_weighted_score IS NOT NULL;
END; $$;

GRANT EXECUTE ON FUNCTION public.get_public_scenario_reviews(uuid,int,int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_creator_overall_rating(uuid)         TO anon, authenticated;

-- 3) Tighten RLS: drop the verified permissive SELECT, keep own-row writes, add own-row SELECT + admin
DROP POLICY "Anyone authenticated can view reviews" ON public.scenario_reviews;

CREATE POLICY "Users can view own reviews"
  ON public.scenario_reviews FOR SELECT
  TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins can view all reviews"
  ON public.scenario_reviews FOR SELECT
  TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Admins can update reviews"
  ON public.scenario_reviews FOR UPDATE
  TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Admins can delete reviews"
  ON public.scenario_reviews FOR DELETE
  TO authenticated USING (public.has_role(auth.uid(),'admin'));
-- INSERT/UPDATE/DELETE own-row policies are retained unchanged.
```

The aggregate trigger `update_review_aggregates` is SECURITY DEFINER and continues to work.

### Frontend changes (`src/services/gallery-data.ts` only)

- **New display type** `PublicScenarioReview` (no `user_id`, no per-axis fields):
  ```ts
  export interface PublicScenarioReview {
    id: string;
    raw_weighted_score: number | null;
    spice_level: number | null;
    comment: string | null;
    created_at: string;
    reviewer: { username: string | null; display_name: string | null; avatar_url: string | null } | null;
  }
  ```
  `fetchScenarioReviews` returns `PublicScenarioReview[]`, built directly from `get_public_scenario_reviews` rows (reviewer object assembled from `reviewer_*` columns, or `null` if all are null due to profile privacy). No synthesized `user_id`.
- **`fetchUserReview`** unchanged — direct own-row `.from('scenario_reviews').select('*')`, still returns full `ScenarioReview` for ReviewModal editing (now allowed by the new own-row SELECT policy).
- **`fetchCreatorOverallRating`** → calls `supabase.rpc('get_creator_overall_rating', { p_publisher_id })`, preserves `{ rating, totalReviews }` return contract (with existing `Math.round(x*2)/2` rounding kept).
- **`submitReview` / `deleteReview`** unchanged.
- `ScenarioReview` interface kept for the author/admin path; the public path uses `PublicScenarioReview`.

**`src/components/chronicle/StoryDetailModal.tsx`** — update the `reviews` state type and import from `PublicScenarioReview`. The render code already only touches the fields above; no JSX changes required beyond the type swap.

### Source-of-truth refresh

- `src/integrations/supabase/types.ts` — auto-regenerated after migration approval (two new RPC signatures, no reviewer `user_id` in `get_public_scenario_reviews`).
- `src/data/supabase-schema-map.ts` — replace `scenario_reviews` SELECT policy with own-row + 3 admin policies; append two new functions.
- `src/data/database-schema-inventory.ts` — same deltas.
- `src/data/ui-audit-findings.ts` — append change-log `cl-20260619-002`; mark BF-08 resolved with evidence (policy drop, new RPCs, frontend migration, no public `user_id`).
- `src/data/architecture-file-analysis.ts` — add `get_public_scenario_reviews`, `get_creator_overall_rating` to `gallery-data.ts` rpcs.

### Files that will change

- new `supabase/migrations/<timestamp>_bf08_sanitize_scenario_reviews.sql`
- `src/services/gallery-data.ts`
- `src/components/chronicle/StoryDetailModal.tsx` (type swap only)
- `src/integrations/supabase/types.ts` (auto-regen)
- `src/data/supabase-schema-map.ts`
- `src/data/database-schema-inventory.ts`
- `src/data/ui-audit-findings.ts`
- `src/data/architecture-file-analysis.ts`

### Validation

1. **Public display renders** — Story Detail modal on a visible scenario shows reviewer name/avatar, date, story/spice ratings, comment. Probe: `rpc('get_public_scenario_reviews', { p_published_scenario_id })` returns expected rows; result has no `user_id` column.
2. **No public `user_id` leak** — Inspect RPC return columns and confirm absence of `user_id`/per-axis fields in the response.
3. **Raw rows denied** — Non-author non-admin probe: `from('scenario_reviews').select('id,user_id').neq('user_id', auth.uid())` returns 0 rows.
4. **Author own-row read** — Logged-in author: `fetchUserReview` returns the row; ReviewModal pre-fills correctly.
5. **Admin raw access** — Admin probe: `from('scenario_reviews').select('*')` returns all rows.
6. **Visibility gating** — RPC against unpublished / hidden / publisher-hidden scenario returns empty.
7. **Pagination cap** — `rpc('get_public_scenario_reviews', { p_published_scenario_id, p_limit: 9999, p_offset: -5 })` returns ≤50 rows starting at offset 0.
8. **Writes still work** — submit + delete review flows succeed.
9. **Linter** — run `supabase--linter`; resolve migration-tied findings.
10. **Snapshots** — `types.ts` shows new RPC signatures; schema map + inventory show updated policies/functions.

### Out of scope (explicit)

Batch C (reports / user_strikes / BF-10), Batch D (media buckets), and any unrelated table or surface.
