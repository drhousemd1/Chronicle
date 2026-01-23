-- Add selected_art_style column to scenarios table
ALTER TABLE scenarios 
ADD COLUMN selected_art_style text DEFAULT 'cinematic-2-5d';