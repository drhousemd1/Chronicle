
CREATE OR REPLACE FUNCTION public.get_folders_with_details(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  name text,
  description text,
  thumbnail_image_id uuid,
  thumbnail_url text,
  image_count bigint,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    f.id,
    f.user_id,
    f.name,
    f.description,
    f.thumbnail_image_id,
    COALESCE(
      thumb.image_url,
      first_img.image_url
    ) AS thumbnail_url,
    COALESCE(cnt.c, 0) AS image_count,
    f.created_at,
    f.updated_at
  FROM image_folders f
  LEFT JOIN library_images thumb
    ON thumb.id = f.thumbnail_image_id
  LEFT JOIN LATERAL (
    SELECT li.image_url
    FROM library_images li
    WHERE li.folder_id = f.id
    ORDER BY li.created_at ASC
    LIMIT 1
  ) first_img ON f.thumbnail_image_id IS NULL
  LEFT JOIN LATERAL (
    SELECT count(*) AS c
    FROM library_images li
    WHERE li.folder_id = f.id
  ) cnt ON true
  WHERE f.user_id = p_user_id
  ORDER BY f.updated_at DESC;
$$;
