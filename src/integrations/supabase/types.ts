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
      character_session_states: {
        Row: {
          character_id: string
          conversation_id: string
          created_at: string | null
          current_mood: string | null
          currently_wearing: Json | null
          id: string
          location: string | null
          physical_appearance: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          character_id: string
          conversation_id: string
          created_at?: string | null
          current_mood?: string | null
          currently_wearing?: Json | null
          id?: string
          location?: string | null
          physical_appearance?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          character_id?: string
          conversation_id?: string
          created_at?: string | null
          current_mood?: string | null
          currently_wearing?: Json | null
          id?: string
          location?: string | null
          physical_appearance?: Json | null
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
          character_role: string | null
          controlled_by: string | null
          created_at: string | null
          current_mood: string | null
          currently_wearing: Json | null
          id: string
          is_library: boolean | null
          location: string | null
          name: string
          physical_appearance: Json | null
          preferred_clothing: Json | null
          role_description: string | null
          scenario_id: string | null
          sections: Json | null
          sex_type: string | null
          tags: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          age?: string | null
          avatar_position?: Json | null
          avatar_url?: string | null
          character_role?: string | null
          controlled_by?: string | null
          created_at?: string | null
          current_mood?: string | null
          currently_wearing?: Json | null
          id?: string
          is_library?: boolean | null
          location?: string | null
          name?: string
          physical_appearance?: Json | null
          preferred_clothing?: Json | null
          role_description?: string | null
          scenario_id?: string | null
          sections?: Json | null
          sex_type?: string | null
          tags?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          age?: string | null
          avatar_position?: Json | null
          avatar_url?: string | null
          character_role?: string | null
          controlled_by?: string | null
          created_at?: string | null
          current_mood?: string | null
          currently_wearing?: Json | null
          id?: string
          is_library?: boolean | null
          location?: string | null
          name?: string
          physical_appearance?: Json | null
          preferred_clothing?: Json | null
          role_description?: string | null
          scenario_id?: string | null
          sections?: Json | null
          sex_type?: string | null
          tags?: string | null
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
          avatar_url: string | null
          created_at: string | null
          id: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      scenarios: {
        Row: {
          cover_image_position: Json | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          id: string
          opening_dialog: Json | null
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
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url: string
          is_starting_scene?: boolean | null
          scenario_id: string
          tag?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string
          is_starting_scene?: boolean | null
          scenario_id?: string
          tag?: string | null
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
          conversation_id: string
          created_at: string | null
          current_mood: string | null
          currently_wearing: Json | null
          extracted_traits: Json | null
          first_mentioned_in: string | null
          id: string
          location: string | null
          name: string
          personality: Json | null
          physical_appearance: Json | null
          preferred_clothing: Json | null
          role_description: string | null
          sex_type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          age?: string | null
          avatar_position?: Json | null
          avatar_url?: string | null
          background?: Json | null
          conversation_id: string
          created_at?: string | null
          current_mood?: string | null
          currently_wearing?: Json | null
          extracted_traits?: Json | null
          first_mentioned_in?: string | null
          id?: string
          location?: string | null
          name: string
          personality?: Json | null
          physical_appearance?: Json | null
          preferred_clothing?: Json | null
          role_description?: string | null
          sex_type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          age?: string | null
          avatar_position?: Json | null
          avatar_url?: string | null
          background?: Json | null
          conversation_id?: string
          created_at?: string | null
          current_mood?: string | null
          currently_wearing?: Json | null
          extracted_traits?: Json | null
          first_mentioned_in?: string | null
          id?: string
          location?: string | null
          name?: string
          personality?: Json | null
          physical_appearance?: Json | null
          preferred_clothing?: Json | null
          role_description?: string | null
          sex_type?: string | null
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
      user_backgrounds: {
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
