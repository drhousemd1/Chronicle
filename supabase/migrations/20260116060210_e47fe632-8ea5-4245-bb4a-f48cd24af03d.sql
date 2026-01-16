-- =============================================
-- PHASE 1: CREATE TABLES
-- =============================================

-- Profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scenarios table (replaces ScenarioMetadata + ScenarioData.world)
CREATE TABLE public.scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled Scenario',
  description TEXT DEFAULT '',
  cover_image_url TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  world_core JSONB NOT NULL DEFAULT '{}',
  ui_settings JSONB DEFAULT '{"showBackgrounds": true, "transparentBubbles": false, "darkMode": false}',
  opening_dialog JSONB DEFAULT '{"enabled": true, "text": ""}',
  selected_model TEXT DEFAULT 'gemini-3-flash-preview',
  version INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Characters table (for both scenario characters and library)
CREATE TABLE public.characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  scenario_id UUID REFERENCES public.scenarios(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  sex_type TEXT DEFAULT '',
  controlled_by TEXT CHECK (controlled_by IN ('AI', 'User')) DEFAULT 'AI',
  character_role TEXT CHECK (character_role IN ('Main', 'Side')) DEFAULT 'Main',
  tags TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  avatar_position JSONB DEFAULT '{"x": 50, "y": 50}',
  sections JSONB DEFAULT '[]',
  is_library BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Codex entries for world building
CREATE TABLE public.codex_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID REFERENCES public.scenarios(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  body TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scenes (background images for scenarios)
CREATE TABLE public.scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID REFERENCES public.scenarios(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  tag TEXT DEFAULT '',
  is_starting_scene BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations (chat sessions)
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  scenario_id UUID REFERENCES public.scenarios(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Story Session',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages (individual chat messages)
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('system', 'user', 'assistant')) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PHASE 2: ENABLE RLS ON ALL TABLES
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.codex_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PHASE 3: CREATE RLS POLICIES
-- =============================================

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Scenarios policies (full CRUD for own scenarios)
CREATE POLICY "Users can view own scenarios" ON public.scenarios FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own scenarios" ON public.scenarios FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own scenarios" ON public.scenarios FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own scenarios" ON public.scenarios FOR DELETE USING (auth.uid() = user_id);

-- Characters policies
CREATE POLICY "Users can view own characters" ON public.characters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own characters" ON public.characters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own characters" ON public.characters FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own characters" ON public.characters FOR DELETE USING (auth.uid() = user_id);

-- Codex entries policies (access via scenario ownership)
CREATE POLICY "Users can view codex via scenario" ON public.codex_entries FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.scenarios WHERE id = scenario_id AND user_id = auth.uid()));
CREATE POLICY "Users can create codex via scenario" ON public.codex_entries FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.scenarios WHERE id = scenario_id AND user_id = auth.uid()));
CREATE POLICY "Users can update codex via scenario" ON public.codex_entries FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.scenarios WHERE id = scenario_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete codex via scenario" ON public.codex_entries FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.scenarios WHERE id = scenario_id AND user_id = auth.uid()));

-- Scenes policies (access via scenario ownership)
CREATE POLICY "Users can view scenes via scenario" ON public.scenes FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.scenarios WHERE id = scenario_id AND user_id = auth.uid()));
CREATE POLICY "Users can create scenes via scenario" ON public.scenes FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.scenarios WHERE id = scenario_id AND user_id = auth.uid()));
CREATE POLICY "Users can update scenes via scenario" ON public.scenes FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.scenarios WHERE id = scenario_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete scenes via scenario" ON public.scenes FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.scenarios WHERE id = scenario_id AND user_id = auth.uid()));

-- Conversations policies
CREATE POLICY "Users can view own conversations" ON public.conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own conversations" ON public.conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own conversations" ON public.conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own conversations" ON public.conversations FOR DELETE USING (auth.uid() = user_id);

-- Messages policies (access via conversation ownership)
CREATE POLICY "Users can view messages via conversation" ON public.messages FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.conversations WHERE id = conversation_id AND user_id = auth.uid()));
CREATE POLICY "Users can create messages via conversation" ON public.messages FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.conversations WHERE id = conversation_id AND user_id = auth.uid()));
CREATE POLICY "Users can update messages via conversation" ON public.messages FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.conversations WHERE id = conversation_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete messages via conversation" ON public.messages FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.conversations WHERE id = conversation_id AND user_id = auth.uid()));

-- =============================================
-- PHASE 4: CREATE TRIGGERS FOR AUTO-UPDATES
-- =============================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scenarios_updated_at BEFORE UPDATE ON public.scenarios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_characters_updated_at BEFORE UPDATE ON public.characters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_codex_entries_updated_at BEFORE UPDATE ON public.codex_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- PHASE 5: CREATE AUTO-PROFILE TRIGGER
-- =============================================

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'username');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for auto-creating profiles
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- PHASE 6: CREATE STORAGE BUCKETS
-- =============================================

INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('scenes', 'scenes', true);

-- Storage policies for avatars bucket
CREATE POLICY "Users can upload avatars" ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own avatars" ON storage.objects FOR UPDATE 
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own avatars" ON storage.objects FOR DELETE 
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT 
  USING (bucket_id = 'avatars');

-- Storage policies for scenes bucket
CREATE POLICY "Users can upload scenes" ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'scenes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own scenes" ON storage.objects FOR UPDATE 
  USING (bucket_id = 'scenes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own scenes" ON storage.objects FOR DELETE 
  USING (bucket_id = 'scenes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view scenes" ON storage.objects FOR SELECT 
  USING (bucket_id = 'scenes');

-- =============================================
-- PHASE 7: CREATE INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX idx_scenarios_user_id ON public.scenarios(user_id);
CREATE INDEX idx_characters_user_id ON public.characters(user_id);
CREATE INDEX idx_characters_scenario_id ON public.characters(scenario_id);
CREATE INDEX idx_characters_is_library ON public.characters(is_library);
CREATE INDEX idx_codex_entries_scenario_id ON public.codex_entries(scenario_id);
CREATE INDEX idx_scenes_scenario_id ON public.scenes(scenario_id);
CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX idx_conversations_scenario_id ON public.conversations(scenario_id);
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);