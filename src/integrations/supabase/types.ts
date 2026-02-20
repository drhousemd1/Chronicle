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
            referencedRelation: "scenarios"
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
            referencedRelation: "scenarios"
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
            referencedRelation: "scenarios"
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
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
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
          user_id: string
        }
        Insert: {
          created_at?: string | null
          filename?: string | null
          folder_id: string
          id?: string
          image_url: string
          is_thumbnail?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          filename?: string | null
          folder_id?: string
          id?: string
          image_url?: string
          is_thumbnail?: boolean | null
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
          id: string
          source: string | null
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
          id?: string
          source?: string | null
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
          id?: string
          source?: string | null
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
          id: string
          role: string
          time_of_day: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          day?: number | null
          id?: string
          role: string
          time_of_day?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          day?: number | null
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
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      published_scenarios: {
        Row: {
          allow_remix: boolean
          created_at: string | null
          id: string
          is_hidden: boolean
          is_published: boolean
          like_count: number
          play_count: number
          publisher_id: string
          reported_count: number
          save_count: number
          scenario_id: string
          tags: string[]
          updated_at: string | null
          view_count: number
        }
        Insert: {
          allow_remix?: boolean
          created_at?: string | null
          id?: string
          is_hidden?: boolean
          is_published?: boolean
          like_count?: number
          play_count?: number
          publisher_id: string
          reported_count?: number
          save_count?: number
          scenario_id: string
          tags?: string[]
          updated_at?: string | null
          view_count?: number
        }
        Update: {
          allow_remix?: boolean
          created_at?: string | null
          id?: string
          is_hidden?: boolean
          is_published?: boolean
          like_count?: number
          play_count?: number
          publisher_id?: string
          reported_count?: number
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
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
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
      scenarios: {
        Row: {
          cover_image_position: Json | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          id: string
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
            referencedRelation: "scenarios"
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
          created_at: string | null
          id: string
          image_url: string
          is_selected: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url: string
          is_selected?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string
          is_selected?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      user_backgrounds: {
        Row: {
          created_at: string | null
          id: string
          image_library_selected: boolean | null
          image_url: string
          is_selected: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_library_selected?: boolean | null
          image_url: string
          is_selected?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          image_library_selected?: boolean | null
          image_url?: string
          is_selected?: boolean | null
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
