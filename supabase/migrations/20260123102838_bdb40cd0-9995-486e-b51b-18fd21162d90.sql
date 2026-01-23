-- Create memories table for storing key story events
CREATE TABLE public.memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  day integer,
  time_of_day text,
  source text DEFAULT 'user',
  source_message_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own memories" 
ON public.memories 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own memories" 
ON public.memories 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memories" 
ON public.memories 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own memories" 
ON public.memories 
FOR DELETE 
USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_memories_conversation_id ON public.memories(conversation_id);
CREATE INDEX idx_memories_user_id ON public.memories(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_memories_updated_at
BEFORE UPDATE ON public.memories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();