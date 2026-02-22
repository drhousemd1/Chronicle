
ALTER TABLE user_backgrounds 
  ADD COLUMN overlay_color text NOT NULL DEFAULT 'black',
  ADD COLUMN overlay_opacity integer NOT NULL DEFAULT 10;

ALTER TABLE sidebar_backgrounds
  ADD COLUMN overlay_color text NOT NULL DEFAULT 'black',
  ADD COLUMN overlay_opacity integer NOT NULL DEFAULT 10;
