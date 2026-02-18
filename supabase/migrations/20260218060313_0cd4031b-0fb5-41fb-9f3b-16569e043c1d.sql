
ALTER TABLE public.characters ADD COLUMN sexual_orientation text DEFAULT '' ;
ALTER TABLE public.character_session_states ADD COLUMN sexual_orientation text;
ALTER TABLE public.side_characters ADD COLUMN sexual_orientation text DEFAULT '' ;
