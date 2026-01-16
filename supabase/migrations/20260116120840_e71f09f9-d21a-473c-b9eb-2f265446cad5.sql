-- Add temporal tracking columns to conversations table
ALTER TABLE conversations 
ADD COLUMN current_day INTEGER DEFAULT 1,
ADD COLUMN current_time_of_day TEXT DEFAULT 'day';

-- Add temporal tracking columns to messages table
ALTER TABLE messages
ADD COLUMN day INTEGER,
ADD COLUMN time_of_day TEXT;