ALTER TABLE public.character_session_states
  ADD COLUMN IF NOT EXISTS avatar_path text;

COMMENT ON COLUMN public.character_session_states.avatar_path IS
  'Batch D Stage C: bucket-relative path in character_avatars_private for in-session avatar override. When set, avatar_url should be NULL or a storage:// sentinel; renderers hydrate via signed URL.';

-- Extend the lockdown trigger function so user_backgrounds / sidebar_backgrounds
-- rules already encoded continue to apply; character_session_states is excluded
-- from URL=NULL enforcement during the transition (Stage E will tighten).
-- No trigger attachments here.