export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ad_spend: {
        Row: {
          amount: number
          campaign_name: string
          cost_cadence: string | null
          created_at: string
          created_by: string
          currency: string
          description: string | null
          id: string
          name: string | null
          notes: string
          period_end: string
          period_start: string
          platform: string
          recurring_cost: number | null
          spent_override: number | null
          start_date: string | null
          status: string | null
          updated_at: string
          url: string | null
        }
        Insert: {
          amount?: number
          campaign_name?: string
          cost_cadence?: string | null
          created_at?: string
          created_by: string
          currency?: string
          description?: string | null
          id?: string
          name?: string | null
          notes?: string
          period_end: string
          period_start: string
          platform: string
          recurring_cost?: number | null
          spent_override?: number | null
          start_date?: string | null
          status?: string | null
          updated_at?: string
          url?: string | null
        }
        Update: {
          amount?: number
          campaign_name?: string
          cost_cadence?: string | null
          created_at?: string
          created_by?: string
          currency?: string
          description?: string | null
          id?: string
          name?: string | null
          notes?: string
          period_end?: string
          period_start?: string
          platform?: string
          recurring_cost?: number | null
          spent_override?: number | null
          start_date?: string | null
          status?: string | null
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      admin_notes: {
        Row: {
          author_id: string
          content: string
          content_html: string | null
          created_at: string
          id: string
          note_key: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          author_id: string
          content?: string
          content_html?: string | null
          created_at?: string
          id?: string
          note_key?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          content_html?: string | null
          created_at?: string
          id?: string
          note_key?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      ai_usage_events: {
        Row: {
          created_at: string | null
          event_count: number | null
          event_source: string | null
          event_type: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_count?: number | null
          event_source?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_count?: number | null
          event_source?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      ai_usage_test_events: {
        Row: {
          api_call_group: string | null
          created_at: string
          error_message: string | null
          est_cost_usd: number | null
          event_key: string | null
          event_source: string | null
          event_type: string
          function_name: string
          id: string
          input_chars: number | null
          input_tokens_est: number | null
          latency_ms: number | null
          metadata: Json | null
          model_id: string | null
          output_chars: number | null
          output_tokens_est: number | null
          payload: Json | null
          response_summary: string | null
          session_id: string
          status: string | null
          status_code: number | null
          total_tokens_est: number | null
          user_id: string | null
        }
        Insert: {
          api_call_group?: string | null
          created_at?: string
          error_message?: string | null
          est_cost_usd?: number | null
          event_key?: string | null
          event_source?: string | null
          event_type?: string
          function_name?: string
          id?: string
          input_chars?: number | null
          input_tokens_est?: number | null
          latency_ms?: number | null
          metadata?: Json | null
          model_id?: string | null
          output_chars?: number | null
          output_tokens_est?: number | null
          payload?: Json | null
          response_summary?: string | null
          session_id: string
          status?: string | null
          status_code?: number | null
          total_tokens_est?: number | null
          user_id?: string | null
        }
        Update: {
          api_call_group?: string | null
          created_at?: string
          error_message?: string | null
          est_cost_usd?: number | null
          event_key?: string | null
          event_source?: string | null
          event_type?: string
          function_name?: string
          id?: string
          input_chars?: number | null
          input_tokens_est?: number | null
          latency_ms?: number | null
          metadata?: Json | null
          model_id?: string | null
          output_chars?: number | null
          output_tokens_est?: number | null
          payload?: Json | null
          response_summary?: string | null
          session_id?: string
          status?: string | null
          status_code?: number | null
          total_tokens_est?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_test_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_test_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage_test_sessions: {
        Row: {
          conversation_id: string | null
          conversation_name: string | null
          created_at: string | null
          ended_at: string | null
          id: string
          metadata: Json | null
          scenario_id: string | null
          scenario_name: string | null
          started_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id?: string | null
          conversation_name?: string | null
          created_at?: string | null
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          scenario_id?: string | null
          scenario_name?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string | null
          conversation_name?: string | null
          created_at?: string | null
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          scenario_id?: string | null
          scenario_name?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      art_styles: {
        Row: {
          backend_prompt: string
          backend_prompt_androgynous: string | null
          backend_prompt_masculine: string | null
          display_name: string
          id: string
          sort_order: number
          thumbnail_url: string
          updated_at: string
        }
        Insert: {
          backend_prompt?: string
          backend_prompt_androgynous?: string | null
          backend_prompt_masculine?: string | null
          display_name: string
          id: string
          sort_order?: number
          thumbnail_url?: string
          updated_at?: string
        }
        Update: {
          backend_prompt?: string
          backend_prompt_androgynous?: string | null
          backend_prompt_masculine?: string | null
          display_name?: string
          id?: string
          sort_order?: number
          thumbnail_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      character_session_states: {
        Row: {
          age: string | null
          avatar_position: Json | null
          avatar_url: string | null
          background: Json | null
          character_id: string
          character_role: string | null
          controlled_by: string | null
          conversation_id: string
          created_at: string | null
          current_mood: string | null
          currently_wearing: Json | null
          custom_sections: Json | null
          fears: Json | null
          goals: Json | null
          id: string
          key_life_events: Json | null
          location: string | null
          name: string | null
          nicknames: string | null
          personality: Json | null
          physical_appearance: Json | null
          preferred_clothing: Json | null
          previous_names: string[] | null
          relationships: Json | null
          role_description: string | null
          secrets: Json | null
          sex_type: string | null
          sexual_orientation: string | null
          tone: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          age?: string | null
          avatar_position?: Json | null
          avatar_url?: string | null
          background?: Json | null
          character_id: string
          character_role?: string | null
          controlled_by?: string | null
          conversation_id: string
          created_at?: string | null
          current_mood?: string | null
          currently_wearing?: Json | null
          custom_sections?: Json | null
          fears?: Json | null
          goals?: Json | null
          id?: string
          key_life_events?: Json | null
          location?: string | null
          name?: string | null
          nicknames?: string | null
          personality?: Json | null
          physical_appearance?: Json | null
          preferred_clothing?: Json | null
          previous_names?: string[] | null
          relationships?: Json | null
          role_description?: string | null
          secrets?: Json | null
          sex_type?: string | null
          sexual_orientation?: string | null
          tone?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          age?: string | null
          avatar_position?: Json | null
          avatar_url?: string | null
          background?: Json | null
          character_id?: string
          character_role?: string | null
          controlled_by?: string | null
          conversation_id?: string
          created_at?: string | null
          current_mood?: string | null
          currently_wearing?: Json | null
          custom_sections?: Json | null
          fears?: Json | null
          goals?: Json | null
          id?: string
          key_life_events?: Json | null
          location?: string | null
          name?: string | null
          nicknames?: string | null
          personality?: Json | null
          physical_appearance?: Json | null
          preferred_clothing?: Json | null
          previous_names?: string[] | null
          relationships?: Json | null
          role_description?: string | null
          secrets?: Json | null
          sex_type?: string | null
          sexual_orientation?: string | null
          tone?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_session_states_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_session_states_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      character_state_message_snapshots: {
        Row: {
          character_id: string
          conversation_id: string
          created_at: string
          id: string
          snapshot: Json
          source_generation_id: string
          source_message_id: string
          user_id: string
        }
        Insert: {
          character_id: string
          conversation_id: string
          created_at?: string
          id?: string
          snapshot?: Json
          source_generation_id: string
          source_message_id: string
          user_id: string
        }
        Update: {
          character_id?: string
          conversation_id?: string
          created_at?: string
          id?: string
          snapshot?: Json
          source_generation_id?: string
          source_message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_state_message_snapshots_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_state_message_snapshots_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_state_message_snapshots_source_message_id_fkey"
            columns: ["source_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      characters: {
        Row: {
          age: string | null
          avatar_position: Json | null
          avatar_url: string | null
          background: Json | null
          character_role: string | null
          controlled_by: string | null
          created_at: string | null
          current_mood: string | null
          currently_wearing: Json | null
          fears: Json | null
          goals: Json | null
          id: string
          is_library: boolean | null
          key_life_events: Json | null
          location: string | null
          name: string
          nicknames: string | null
          personality: Json | null
          physical_appearance: Json | null
          preferred_clothing: Json | null
          relationships: Json | null
          role_description: string | null
          scenario_id: string | null
          secrets: Json | null
          sections: Json | null
          sex_type: string | null
          sexual_orientation: string | null
          tags: string | null
          tone: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          age?: string | null
          avatar_position?: Json | null
          avatar_url?: string | null
          background?: Json | null
          character_role?: string | null
          controlled_by?: string | null
          created_at?: string | null
          current_mood?: string | null
          currently_wearing?: Json | null
          fears?: Json | null
          goals?: Json | null
          id?: string
          is_library?: boolean | null
          key_life_events?: Json | null
          location?: string | null
          name?: string
          nicknames?: string | null
          personality?: Json | null
          physical_appearance?: Json | null
          preferred_clothing?: Json | null
          relationships?: Json | null
          role_description?: string | null
          scenario_id?: string | null
          secrets?: Json | null
          sections?: Json | null
          sex_type?: string | null
          sexual_orientation?: string | null
          tags?: string | null
          tone?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          age?: string | null
          avatar_position?: Json | null
          avatar_url?: string | null
          background?: Json | null
          character_role?: string | null
          controlled_by?: string | null
          created_at?: string | null
          current_mood?: string | null
          currently_wearing?: Json | null
          fears?: Json | null
          goals?: Json | null
          id?: string
          is_library?: boolean | null
          key_life_events?: Json | null
          location?: string | null
          name?: string
          nicknames?: string | null
          personality?: Json | null
          physical_appearance?: Json | null
          preferred_clothing?: Json | null
          relationships?: Json | null
          role_description?: string | null
          scenario_id?: string | null
          secrets?: Json | null
          sections?: Json | null
          sex_type?: string | null
          sexual_orientation?: string | null
          tags?: string | null
          tone?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "characters_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      codex_entries: {
        Row: {
          body: string | null
          created_at: string | null
          id: string
          scenario_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          id?: string
          scenario_id: string
          title?: string
          updated_at?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string | null
          id?: string
          scenario_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "codex_entries_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      content_themes: {
        Row: {
          character_types: string[] | null
          created_at: string | null
          custom_tags: string[] | null
          genres: string[] | null
          id: string
          origin: string[] | null
          scenario_id: string
          story_type: string | null
          trigger_warnings: string[] | null
          updated_at: string | null
        }
        Insert: {
          character_types?: string[] | null
          created_at?: string | null
          custom_tags?: string[] | null
          genres?: string[] | null
          id?: string
          origin?: string[] | null
          scenario_id: string
          story_type?: string | null
          trigger_warnings?: string[] | null
          updated_at?: string | null
        }
        Update: {
          character_types?: string[] | null
          created_at?: string | null
          custom_tags?: string[] | null
          genres?: string[] | null
          id?: string
          origin?: string[] | null
          scenario_id?: string
          story_type?: string | null
          trigger_warnings?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_themes_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: true
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          current_day: number | null
          current_time_of_day: string | null
          id: string
          scenario_id: string
          time_progression_interval: number
          time_progression_mode: string
          time_remaining: number | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_day?: number | null
          current_time_of_day?: string | null
          id?: string
          scenario_id: string
          time_progression_interval?: number
          time_progression_mode?: string
          time_remaining?: number | null
          title?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_day?: number | null
          current_time_of_day?: string | null
          id?: string
          scenario_id?: string
          time_progression_interval?: number
          time_progression_mode?: string
          time_remaining?: number | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_follows: {
        Row: {
          created_at: string | null
          creator_id: string
          follower_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          creator_id: string
          follower_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          creator_id?: string
          follower_id?: string
          id?: string
        }
        Relationships: []
      }
      finance_documents: {
        Row: {
          category: string
          created_at: string
          file_name: string
          id: string
          mime_type: string
          note: string
          size_bytes: number
          storage_path: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          category?: string
          created_at?: string
          file_name: string
          id?: string
          mime_type: string
          note?: string
          size_bytes: number
          storage_path: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          category?: string
          created_at?: string
          file_name?: string
          id?: string
          mime_type?: string
          note?: string
          size_bytes?: number
          storage_path?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: []
      }
      guide_documents: {
        Row: {
          content: Json | null
          created_at: string
          id: string
          markdown: string | null
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          content?: Json | null
          created_at?: string
          id?: string
          markdown?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Update: {
          content?: Json | null
          created_at?: string
          id?: string
          markdown?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      image_folders: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          thumbnail_image_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          thumbnail_image_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          thumbnail_image_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_thumbnail_image"
            columns: ["thumbnail_image_id"]
            isOneToOne: false
            referencedRelation: "library_images"
            referencedColumns: ["id"]
          },
        ]
      }
      library_images: {
        Row: {
          created_at: string | null
          filename: string | null
          folder_id: string
          id: string
          image_url: string
          is_thumbnail: boolean | null
          tags: string[]
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          filename?: string | null
          folder_id: string
          id?: string
          image_url: string
          is_thumbnail?: boolean | null
          tags?: string[]
          title?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          filename?: string | null
          folder_id?: string
          id?: string
          image_url?: string
          is_thumbnail?: boolean | null
          tags?: string[]
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "library_images_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "image_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      memories: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          day: number | null
          entry_type: string
          id: string
          source: string | null
          source_generation_id: string | null
          source_message_id: string | null
          time_of_day: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          day?: number | null
          entry_type?: string
          id?: string
          source?: string | null
          source_generation_id?: string | null
          source_message_id?: string | null
          time_of_day?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          day?: number | null
          entry_type?: string
          id?: string
          source?: string | null
          source_generation_id?: string | null
          source_message_id?: string | null
          time_of_day?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          day: number | null
          generation_id: string
          id: string
          role: string
          time_of_day: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          day?: number | null
          generation_id?: string
          id?: string
          role: string
          time_of_day?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          day?: number | null
          generation_id?: string
          id?: string
          role?: string
          time_of_day?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      character_state_message_snapshots: {
        Row: {
          character_id: string
          conversation_id: string
          created_at: string
          id: string
          snapshot: Json
          source_generation_id: string
          source_message_id: string
          user_id: string
        }
        Insert: {
          character_id: string
          conversation_id: string
          created_at?: string
          id?: string
          snapshot?: Json
          source_generation_id: string
          source_message_id: string
          user_id: string
        }
        Update: {
          character_id?: string
          conversation_id?: string
          created_at?: string
          id?: string
          snapshot?: Json
          source_generation_id?: string
          source_message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_state_message_snapshots_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_state_message_snapshots_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_state_message_snapshots_source_message_id_fkey"
            columns: ["source_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      side_character_message_snapshots: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          side_character_id: string
          snapshot: Json
          source_generation_id: string
          source_message_id: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          side_character_id: string
          snapshot?: Json
          source_generation_id: string
          source_message_id: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          side_character_id?: string
          snapshot?: Json
          source_generation_id?: string
          source_message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "side_character_message_snapshots_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "side_character_message_snapshots_side_character_id_fkey"
            columns: ["side_character_id"]
            isOneToOne: false
            referencedRelation: "side_characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "side_character_message_snapshots_source_message_id_fkey"
            columns: ["source_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      story_goal_step_derivations: {
        Row: {
          completed: boolean
          conversation_id: string
          created_at: string
          day: number | null
          goal_id: string
          id: string
          source_generation_id: string
          source_message_id: string
          step_id: string
          time_of_day: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean
          conversation_id: string
          created_at?: string
          day?: number | null
          goal_id: string
          id?: string
          source_generation_id: string
          source_message_id: string
          step_id: string
          time_of_day?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean
          conversation_id?: string
          created_at?: string
          day?: number | null
          goal_id?: string
          id?: string
          source_generation_id?: string
          source_message_id?: string
          step_id?: string
          time_of_day?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_goal_step_derivations_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_goal_step_derivations_source_message_id_fkey"
            columns: ["source_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          about_me: string | null
          avatar_position: Json | null
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          hide_profile_details: boolean | null
          hide_published_works: boolean | null
          id: string
          preferred_genres: string[] | null
          preferred_model: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          about_me?: string | null
          avatar_position?: Json | null
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          hide_profile_details?: boolean | null
          hide_published_works?: boolean | null
          id: string
          preferred_genres?: string[] | null
          preferred_model?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          about_me?: string | null
          avatar_position?: Json | null
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          hide_profile_details?: boolean | null
          hide_published_works?: boolean | null
          id?: string
          preferred_genres?: string[] | null
          preferred_model?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      published_scenarios: {
        Row: {
          allow_remix: boolean
          avg_rating: number
          created_at: string | null
          id: string
          is_hidden: boolean
          is_published: boolean
          like_count: number
          play_count: number
          publisher_id: string
          reported_count: number
          review_count: number
          save_count: number
          scenario_id: string
          tags: string[]
          updated_at: string | null
          view_count: number
        }
        Insert: {
          allow_remix?: boolean
          avg_rating?: number
          created_at?: string | null
          id?: string
          is_hidden?: boolean
          is_published?: boolean
          like_count?: number
          play_count?: number
          publisher_id: string
          reported_count?: number
          review_count?: number
          save_count?: number
          scenario_id: string
          tags?: string[]
          updated_at?: string | null
          view_count?: number
        }
        Update: {
          allow_remix?: boolean
          avg_rating?: number
          created_at?: string | null
          id?: string
          is_hidden?: boolean
          is_published?: boolean
          like_count?: number
          play_count?: number
          publisher_id?: string
          reported_count?: number
          review_count?: number
          save_count?: number
          scenario_id?: string
          tags?: string[]
          updated_at?: string | null
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "published_scenarios_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: true
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      quality_hub_registries: {
        Row: {
          id: string
          registry: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          registry: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          registry?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      remixed_scenarios: {
        Row: {
          created_at: string | null
          id: string
          original_published_id: string | null
          remixed_scenario_id: string
          remixer_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          original_published_id?: string | null
          remixed_scenario_id: string
          remixer_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          original_published_id?: string | null
          remixed_scenario_id?: string
          remixer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "remixed_scenarios_original_published_id_fkey"
            columns: ["original_published_id"]
            isOneToOne: false
            referencedRelation: "published_scenarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "remixed_scenarios_remixed_scenario_id_fkey"
            columns: ["remixed_scenario_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          accused: string
          accused_user_id: string | null
          created_at: string
          id: string
          note: string | null
          reason: string
          reporter: string
          reporter_user_id: string | null
          reviewed_by: string | null
          status: string
          story_id: string | null
          updated_at: string
        }
        Insert: {
          accused: string
          accused_user_id?: string | null
          created_at?: string
          id?: string
          note?: string | null
          reason: string
          reporter: string
          reporter_user_id?: string | null
          reviewed_by?: string | null
          status?: string
          story_id?: string | null
          updated_at?: string
        }
        Update: {
          accused?: string
          accused_user_id?: string | null
          created_at?: string
          id?: string
          note?: string | null
          reason?: string
          reporter?: string
          reporter_user_id?: string | null
          reviewed_by?: string | null
          status?: string
          story_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      saved_scenarios: {
        Row: {
          created_at: string | null
          id: string
          published_scenario_id: string
          source_scenario_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          published_scenario_id: string
          source_scenario_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          published_scenario_id?: string
          source_scenario_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_scenarios_published_scenario_id_fkey"
            columns: ["published_scenario_id"]
            isOneToOne: false
            referencedRelation: "published_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      scenario_likes: {
        Row: {
          created_at: string | null
          id: string
          published_scenario_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          published_scenario_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          published_scenario_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scenario_likes_published_scenario_id_fkey"
            columns: ["published_scenario_id"]
            isOneToOne: false
            referencedRelation: "published_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      scenario_reviews: {
        Row: {
          character_details_complexity: number
          comment: string | null
          concept_strength: number
          created_at: string | null
          id: string
          initial_situation: number
          low_friction_start: number
          motivation_tension: number
          published_scenario_id: string
          raw_weighted_score: number
          replayability: number
          role_clarity: number
          spice_level: number
          tone_promise: number
          updated_at: string | null
          user_id: string
          worldbuilding_vibe: number
        }
        Insert: {
          character_details_complexity: number
          comment?: string | null
          concept_strength: number
          created_at?: string | null
          id?: string
          initial_situation: number
          low_friction_start: number
          motivation_tension: number
          published_scenario_id: string
          raw_weighted_score: number
          replayability: number
          role_clarity: number
          spice_level: number
          tone_promise: number
          updated_at?: string | null
          user_id: string
          worldbuilding_vibe: number
        }
        Update: {
          character_details_complexity?: number
          comment?: string | null
          concept_strength?: number
          created_at?: string | null
          id?: string
          initial_situation?: number
          low_friction_start?: number
          motivation_tension?: number
          published_scenario_id?: string
          raw_weighted_score?: number
          replayability?: number
          role_clarity?: number
          spice_level?: number
          tone_promise?: number
          updated_at?: string | null
          user_id?: string
          worldbuilding_vibe?: number
        }
        Relationships: [
          {
            foreignKeyName: "scenario_reviews_published_scenario_id_fkey"
            columns: ["published_scenario_id"]
            isOneToOne: false
            referencedRelation: "published_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      scenario_views: {
        Row: {
          id: string
          published_scenario_id: string
          user_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          published_scenario_id: string
          user_id: string
          viewed_at?: string
        }
        Update: {
          id?: string
          published_scenario_id?: string
          user_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scenario_views_published_scenario_id_fkey"
            columns: ["published_scenario_id"]
            isOneToOne: false
            referencedRelation: "published_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      scenes: {
        Row: {
          created_at: string | null
          id: string
          image_url: string
          is_starting_scene: boolean | null
          scenario_id: string
          tag: string | null
          tags: string[] | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url: string
          is_starting_scene?: boolean | null
          scenario_id: string
          tag?: string | null
          tags?: string[] | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string
          is_starting_scene?: boolean | null
          scenario_id?: string
          tag?: string | null
          tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "scenes_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      side_character_message_snapshots: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          side_character_id: string
          snapshot: Json
          source_generation_id: string
          source_message_id: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          side_character_id: string
          snapshot?: Json
          source_generation_id: string
          source_message_id: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          side_character_id?: string
          snapshot?: Json
          source_generation_id?: string
          source_message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "side_character_message_snapshots_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "side_character_message_snapshots_side_character_id_fkey"
            columns: ["side_character_id"]
            isOneToOne: false
            referencedRelation: "side_characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "side_character_message_snapshots_source_message_id_fkey"
            columns: ["source_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      side_characters: {
        Row: {
          age: string | null
          avatar_position: Json | null
          avatar_url: string | null
          background: Json | null
          character_role: string | null
          controlled_by: string | null
          conversation_id: string
          created_at: string | null
          current_mood: string | null
          currently_wearing: Json | null
          custom_sections: Json
          extracted_traits: Json | null
          first_mentioned_in: string | null
          id: string
          location: string | null
          name: string
          nicknames: string | null
          personality: Json | null
          physical_appearance: Json | null
          preferred_clothing: Json | null
          role_description: string | null
          sex_type: string | null
          sexual_orientation: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          age?: string | null
          avatar_position?: Json | null
          avatar_url?: string | null
          background?: Json | null
          character_role?: string | null
          controlled_by?: string | null
          conversation_id: string
          created_at?: string | null
          current_mood?: string | null
          currently_wearing?: Json | null
          custom_sections?: Json
          extracted_traits?: Json | null
          first_mentioned_in?: string | null
          id?: string
          location?: string | null
          name: string
          nicknames?: string | null
          personality?: Json | null
          physical_appearance?: Json | null
          preferred_clothing?: Json | null
          role_description?: string | null
          sex_type?: string | null
          sexual_orientation?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          age?: string | null
          avatar_position?: Json | null
          avatar_url?: string | null
          background?: Json | null
          character_role?: string | null
          controlled_by?: string | null
          conversation_id?: string
          created_at?: string | null
          current_mood?: string | null
          currently_wearing?: Json | null
          custom_sections?: Json
          extracted_traits?: Json | null
          first_mentioned_in?: string | null
          id?: string
          location?: string | null
          name?: string
          nicknames?: string | null
          personality?: Json | null
          physical_appearance?: Json | null
          preferred_clothing?: Json | null
          role_description?: string | null
          sex_type?: string | null
          sexual_orientation?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "side_characters_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      sidebar_backgrounds: {
        Row: {
          category: string
          created_at: string | null
          id: string
          image_url: string
          is_selected: boolean | null
          overlay_color: string
          overlay_opacity: number
          sort_order: number
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string | null
          id?: string
          image_url: string
          is_selected?: boolean | null
          overlay_color?: string
          overlay_opacity?: number
          sort_order?: number
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          image_url?: string
          is_selected?: boolean | null
          overlay_color?: string
          overlay_opacity?: number
          sort_order?: number
          user_id?: string
        }
        Relationships: []
      }
      stories: {
        Row: {
          cover_image_position: Json | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          id: string
          is_draft: boolean
          nav_button_images: Json | null
          opening_dialog: Json | null
          selected_art_style: string | null
          selected_model: string | null
          tags: string[] | null
          title: string
          ui_settings: Json | null
          updated_at: string | null
          user_id: string
          version: number | null
          world_core: Json
        }
        Insert: {
          cover_image_position?: Json | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_draft?: boolean
          nav_button_images?: Json | null
          opening_dialog?: Json | null
          selected_art_style?: string | null
          selected_model?: string | null
          tags?: string[] | null
          title?: string
          ui_settings?: Json | null
          updated_at?: string | null
          user_id: string
          version?: number | null
          world_core?: Json
        }
        Update: {
          cover_image_position?: Json | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_draft?: boolean
          nav_button_images?: Json | null
          opening_dialog?: Json | null
          selected_art_style?: string | null
          selected_model?: string | null
          tags?: string[] | null
          title?: string
          ui_settings?: Json | null
          updated_at?: string | null
          user_id?: string
          version?: number | null
          world_core?: Json
        }
        Relationships: []
      }
      story_goal_step_derivations: {
        Row: {
          completed: boolean
          conversation_id: string
          created_at: string
          day: number | null
          goal_id: string
          id: string
          source_generation_id: string
          source_message_id: string
          step_id: string
          time_of_day: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean
          conversation_id: string
          created_at?: string
          day?: number | null
          goal_id: string
          id?: string
          source_generation_id: string
          source_message_id: string
          step_id: string
          time_of_day?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean
          conversation_id?: string
          created_at?: string
          day?: number | null
          goal_id?: string
          id?: string
          source_generation_id?: string
          source_message_id?: string
          step_id?: string
          time_of_day?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_goal_step_derivations_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_goal_step_derivations_source_message_id_fkey"
            columns: ["source_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      user_backgrounds: {
        Row: {
          category: string
          created_at: string | null
          id: string
          image_library_selected: boolean | null
          image_url: string
          is_selected: boolean | null
          overlay_color: string
          overlay_opacity: number
          sort_order: number
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string | null
          id?: string
          image_library_selected?: boolean | null
          image_url: string
          is_selected?: boolean | null
          overlay_color?: string
          overlay_opacity?: number
          sort_order?: number
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          image_library_selected?: boolean | null
          image_url?: string
          is_selected?: boolean | null
          overlay_color?: string
          overlay_opacity?: number
          sort_order?: number
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_strikes: {
        Row: {
          created_at: string
          expires_at: string | null
          falls_off_at: string | null
          id: string
          issued_at: string | null
          issued_by: string
          note: string | null
          points: number | null
          reason: string
          report_id: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          falls_off_at?: string | null
          id?: string
          issued_at?: string | null
          issued_by: string
          note?: string | null
          points?: number | null
          reason: string
          report_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          falls_off_at?: string | null
          id?: string
          issued_at?: string | null
          issued_by?: string
          note?: string | null
          points?: number | null
          reason?: string
          report_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decrement_like_count: {
        Args: { published_id: string }
        Returns: undefined
      }
      decrement_save_count: {
        Args: { published_id: string }
        Returns: undefined
      }
      fetch_gallery_scenarios: {
        Args: {
          p_custom_tags?: string[]
          p_genres?: string[]
          p_limit?: number
          p_offset?: number
          p_origins?: string[]
          p_publisher_ids?: string[]
          p_search_tags?: string[]
          p_search_text?: string
          p_sort_by?: string
          p_story_types?: string[]
          p_trigger_warnings?: string[]
        }
        Returns: Json
      }
      get_creator_stats: {
        Args: { creator_user_id: string }
        Returns: {
          follower_count: number
          published_count: number
          total_likes: number
          total_plays: number
          total_saves: number
          total_views: number
        }[]
      }
      get_folders_with_details:
        | {
            Args: never
            Returns: {
              created_at: string
              description: string
              id: string
              image_count: number
              name: string
              thumbnail_image_id: string
              thumbnail_url: string
              updated_at: string
              user_id: string
            }[]
          }
        | {
            Args: { p_user_id: string }
            Returns: {
              created_at: string
              description: string
              id: string
              image_count: number
              name: string
              thumbnail_image_id: string
              thumbnail_url: string
              updated_at: string
              user_id: string
            }[]
          }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_like_count: {
        Args: { published_id: string }
        Returns: undefined
      }
      increment_play_count: {
        Args: { published_id: string }
        Returns: undefined
      }
      increment_save_count: {
        Args: { published_id: string }
        Returns: undefined
      }
      increment_view_count: {
        Args: { published_id: string }
        Returns: undefined
      }
      record_scenario_view: {
        Args: { p_published_scenario_id: string }
        Returns: undefined
      }
      save_scenario_atomic: {
        Args: {
          p_characters?: Json
          p_codex_entries?: Json
          p_scenario_id: string
          p_scenes?: Json
          p_story: Json
          p_user_id: string
        }
        Returns: undefined
      }
      set_admin_access: {
        Args: { _enabled: boolean; _target_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
