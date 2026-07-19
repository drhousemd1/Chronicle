// Generated from the live backend schema export.
// Refresh this file from the latest Lovable export when backend schema changes.
// Keep this as schema metadata only: no row contents, secrets, auth tokens,
// API keys, user emails, private chat/story text, images, or private NSFW user content.
export const databaseSchemaInventory = {
  "exported_at": "2026-04-05",
  "project": "Chronicle",
  "tables": {
    "ad_spend": {
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "nullable": false,
          "default": "gen_random_uuid()",
          "primary_key": true
        },
        {
          "name": "platform",
          "type": "text",
          "nullable": false,
          "default": null
        },
        {
          "name": "campaign_name",
          "type": "text",
          "nullable": false,
          "default": "''"
        },
        {
          "name": "amount",
          "type": "numeric",
          "nullable": false,
          "default": "0"
        },
        {
          "name": "currency",
          "type": "text",
          "nullable": false,
          "default": "'USD'"
        },
        {
          "name": "period_start",
          "type": "date",
          "nullable": false,
          "default": null
        },
        {
          "name": "period_end",
          "type": "date",
          "nullable": false,
          "default": null
        },
        {
          "name": "notes",
          "type": "text",
          "nullable": false,
          "default": "''"
        },
        {
          "name": "created_by",
          "type": "uuid",
          "nullable": false,
          "default": null
        },
        {
          "name": "created_at",
          "type": "timestamptz",
          "nullable": false,
          "default": "now()"
        },
        {
          "name": "updated_at",
          "type": "timestamptz",
          "nullable": false,
          "default": "now()"
        },
        {
          "name": "name",
          "type": "text",
          "nullable": true,
          "default": null
        },
        {
          "name": "description",
          "type": "text",
          "nullable": true,
          "default": null
        },
        {
          "name": "url",
          "type": "text",
          "nullable": true,
          "default": null
        },
        {
          "name": "status",
          "type": "text",
          "nullable": true,
          "default": "'active'"
        },
        {
          "name": "recurring_cost",
          "type": "numeric",
          "nullable": true,
          "default": "0"
        },
        {
          "name": "cost_cadence",
          "type": "text",
          "nullable": true,
          "default": "'mo'"
        },
        {
          "name": "start_date",
          "type": "date",
          "nullable": true,
          "default": null
        },
        {
          "name": "spent_override",
          "type": "numeric",
          "nullable": true,
          "default": null
        }
      ],
      "foreign_keys": [],
      "indexes": [
        "ad_spend_pkey (id)",
        "ad_spend_created_by_idx (created_by, created_at DESC)",
        "ad_spend_status_idx (status, created_at DESC)"
      ],
      "rls_policies": [
        {
          "name": "Admins can manage ad spend",
          "command": "ALL",
          "roles": "authenticated",
          "using": "has_role(auth.uid(), 'admin')",
          "with_check": "has_role(auth.uid(), 'admin')"
        }
      ]
    },
    "admin_notes": {
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "nullable": false,
          "default": "gen_random_uuid()",
          "primary_key": true
        },
        {
          "name": "content",
          "type": "text",
          "nullable": false,
          "default": "''"
        },
        {
          "name": "author_id",
          "type": "uuid",
          "nullable": false,
          "default": null
        },
        {
          "name": "created_at",
          "type": "timestamptz",
          "nullable": false,
          "default": "now()"
        },
        {
          "name": "updated_at",
          "type": "timestamptz",
          "nullable": false,
          "default": "now()"
        },
        {
          "name": "note_key",
          "type": "text",
          "nullable": true,
          "default": null
        },
        {
          "name": "content_html",
          "type": "text",
          "nullable": true,
          "default": null
        },
        {
          "name": "updated_by",
          "type": "uuid",
          "nullable": true,
          "default": null
        }
      ],
      "foreign_keys": [],
      "indexes": [
        "admin_notes_pkey (id)",
        "admin_notes_note_key_idx UNIQUE (note_key)"
      ],
      "rls_policies": [
        {
          "name": "Admins can manage admin notes",
          "command": "ALL",
          "roles": "authenticated",
          "using": "has_role(auth.uid(), 'admin')",
          "with_check": "has_role(auth.uid(), 'admin')"
        }
      ]
    },
    "ai_usage_events": {
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "nullable": false,
          "default": "gen_random_uuid()",
          "primary_key": true
        },
        {
          "name": "user_id",
          "type": "uuid",
          "nullable": false,
          "default": null
        },
        {
          "name": "event_type",
          "type": "text",
          "nullable": false,
          "default": null
        },
        {
          "name": "event_source",
          "type": "text",
          "nullable": true,
          "default": "'client'"
        },
        {
          "name": "event_count",
          "type": "integer",
          "nullable": true,
          "default": "1"
        },
        {
          "name": "metadata",
          "type": "jsonb",
          "nullable": true,
          "default": "'{}'"
        },
        {
          "name": "created_at",
          "type": "timestamptz",
          "nullable": true,
          "default": "now()"
        }
      ],
      "foreign_keys": [],
      "indexes": [
        "ai_usage_events_pkey (id)",
        "idx_ai_usage_events_user_id (user_id)",
        "idx_ai_usage_events_event_type (event_type)",
        "idx_ai_usage_events_created_at (created_at)"
      ],
      "rls_policies": [
        {
          "name": "Admins can read all usage events",
          "command": "SELECT",
          "roles": "authenticated",
          "using": "has_role(auth.uid(), 'admin')",
          "with_check": null
        },
        {
          "name": "Users can insert their own usage events",
          "command": "INSERT",
          "roles": "authenticated",
          "using": null,
          "with_check": "auth.uid() = user_id"
        }
      ]
    },
    "ai_usage_test_events": {
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "nullable": false,
          "default": "gen_random_uuid()",
          "primary_key": true
        },
        {
          "name": "session_id",
          "type": "uuid",
          "nullable": false,
          "default": null
        },
        {
          "name": "event_type",
          "type": "text",
          "nullable": false,
          "default": "''"
        },
        {
          "name": "function_name",
          "type": "text",
          "nullable": false,
          "default": "''"
        },
        {
          "name": "payload",
          "type": "jsonb",
          "nullable": true,
          "default": "'{}'"
        },
        {
          "name": "response_summary",
          "type": "text",
          "nullable": true,
          "default": "''"
        },
        {
          "name": "latency_ms",
          "type": "integer",
          "nullable": true,
          "default": null
        },
        {
          "name": "status_code",
          "type": "integer",
          "nullable": true,
          "default": null
        },
        {
          "name": "error_message",
          "type": "text",
          "nullable": true,
          "default": null
        },
        {
          "name": "created_at",
          "type": "timestamptz",
          "nullable": false,
          "default": "now()"
        },
        {
          "name": "input_chars",
          "type": "integer",
          "nullable": true,
          "default": "0"
        },
        {
          "name": "output_chars",
          "type": "integer",
          "nullable": true,
          "default": "0"
        },
        {
          "name": "input_tokens_est",
          "type": "integer",
          "nullable": true,
          "default": "0"
        },
        {
          "name": "output_tokens_est",
          "type": "integer",
          "nullable": true,
          "default": "0"
        },
        {
          "name": "total_tokens_est",
          "type": "integer",
          "nullable": true,
          "default": "0"
        },
        {
          "name": "est_cost_usd",
          "type": "numeric",
          "nullable": true,
          "default": "0"
        },
        {
          "name": "model_id",
          "type": "text",
          "nullable": true,
          "default": null
        },
        {
          "name": "event_source",
          "type": "text",
          "nullable": true,
          "default": "'client'"
        },
        {
          "name": "api_call_group",
          "type": "text",
          "nullable": true,
          "default": null
        },
        {
          "name": "event_key",
          "type": "text",
          "nullable": true,
          "default": null
        },
        {
          "name": "user_id",
          "type": "uuid",
          "nullable": true,
          "default": null
        },
        {
          "name": "status",
          "type": "text",
          "nullable": true,
          "default": "'ok'"
        },
        {
          "name": "metadata",
          "type": "jsonb",
          "nullable": true,
          "default": "'{}'"
        }
      ],
      "foreign_keys": [],
      "indexes": [
        "ai_usage_test_events_pkey (id)",
        "ai_usage_test_events_session_idx (session_id, created_at DESC)",
        "ai_usage_test_events_user_idx (user_id, created_at DESC)",
        "ai_usage_test_events_call_group_idx (api_call_group, created_at DESC)",
        "ai_usage_test_events_event_key_idx (event_key, created_at DESC)",
        "idx_ai_test_events_session (session_id, created_at DESC)"
      ],
      "rls_policies": [
        {
          "name": "Admins can view all test events",
          "command": "SELECT",
          "roles": "authenticated",
          "using": "has_role(auth.uid(), 'admin')",
          "with_check": null
        },
        {
          "name": "Users can insert own test events",
          "command": "INSERT",
          "roles": "authenticated",
          "using": null,
          "with_check": "auth.uid() = user_id"
        },
        {
          "name": "Users can view own test events",
          "command": "SELECT",
          "roles": "authenticated",
          "using": "auth.uid() = user_id",
          "with_check": null
        }
      ]
    },
    "ai_usage_test_sessions": {
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "nullable": false,
          "default": "gen_random_uuid()",
          "primary_key": true
        },
        {
          "name": "user_id",
          "type": "uuid",
          "nullable": false,
          "default": null
        },
        {
          "name": "scenario_id",
          "type": "uuid",
          "nullable": true,
          "default": null
        },
        {
          "name": "scenario_name",
          "type": "text",
          "nullable": true,
          "default": "''"
        },
        {
          "name": "conversation_id",
          "type": "uuid",
          "nullable": true,
          "default": null
        },
        {
          "name": "conversation_name",
          "type": "text",
          "nullable": true,
          "default": "''"
        },
        {
          "name": "status",
          "type": "text",
          "nullable": true,
          "default": "'active'"
        },
        {
          "name": "started_at",
          "type": "timestamptz",
          "nullable": true,
          "default": "now()"
        },
        {
          "name": "ended_at",
          "type": "timestamptz",
          "nullable": true,
          "default": null
        },
        {
          "name": "metadata",
          "type": "jsonb",
          "nullable": true,
          "default": "'{}'"
        },
        {
          "name": "created_at",
          "type": "timestamptz",
          "nullable": true,
          "default": "now()"
        },
        {
          "name": "updated_at",
          "type": "timestamptz",
          "nullable": true,
          "default": "now()"
        }
      ],
      "foreign_keys": [],
      "indexes": [
        "ai_usage_test_sessions_pkey (id)",
        "idx_ai_usage_test_sessions_user_status (user_id, status)"
      ],
      "rls_policies": [
        {
          "name": "Admins can read all test sessions",
          "command": "SELECT",
          "roles": "authenticated",
          "using": "has_role(auth.uid(), 'admin')",
          "with_check": null
        },
        {
          "name": "Users can manage their own test sessions",
          "command": "ALL",
          "roles": "authenticated",
          "using": "auth.uid() = user_id",
          "with_check": "auth.uid() = user_id"
        }
      ]
    },
    "app_settings": {
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "nullable": false,
          "default": "gen_random_uuid()",
          "primary_key": true
        },
        {
          "name": "setting_key",
          "type": "text",
          "nullable": false,
          "default": null
        },
        {
          "name": "setting_value",
          "type": "jsonb",
          "nullable": false,
          "default": "'{}'"
        },
        {
          "name": "updated_by",
          "type": "uuid",
          "nullable": true,
          "default": null
        },
        {
          "name": "updated_at",
          "type": "timestamptz",
          "nullable": true,
          "default": "now()"
        }
      ],
      "foreign_keys": [],
      "indexes": [
        "app_settings_pkey (id)",
        "app_settings_setting_key_key UNIQUE (setting_key)"
      ],
      "rls_policies": [
        {
          "name": "Admin can insert settings",
          "command": "INSERT",
          "roles": "authenticated",
          "using": null,
          "with_check": "has_role(auth.uid(), 'admin')"
        },
        {
          "name": "Admin can update settings",
          "command": "UPDATE",
          "roles": "authenticated",
          "using": "has_role(auth.uid(), 'admin')",
          "with_check": null
        },
        {
          "name": "Admins can read all settings",
          "command": "SELECT",
          "roles": "authenticated",
          "using": "has_role(auth.uid(), 'admin')",
          "with_check": null
        },
        {
          "name": "Auth can read public settings keys",
          "command": "SELECT",
          "roles": "authenticated",
          "using": "setting_key IN ('shared_keys','nav_button_images','subscription_tiers_v1')",
          "with_check": null
        }
      ]
    },
    "art_styles": {
      "columns": [
        {
          "name": "id",
          "type": "text",
          "nullable": false,
          "default": null,
          "primary_key": true
        },
        {
          "name": "display_name",
          "type": "text",
          "nullable": false,
          "default": null
        },
        {
          "name": "thumbnail_url",
          "type": "text",
          "nullable": false,
          "default": "''"
        },
        {
          "name": "backend_prompt",
          "type": "text",
          "nullable": false,
          "default": "''"
        },
        {
          "name": "backend_prompt_masculine",
          "type": "text",
          "nullable": true,
          "default": null
        },
        {
          "name": "backend_prompt_androgynous",
          "type": "text",
          "nullable": true,
          "default": null
        },
        {
          "name": "sort_order",
          "type": "integer",
          "nullable": false,
          "default": "0"
        },
        {
          "name": "updated_at",
          "type": "timestamptz",
          "nullable": false,
          "default": "now()"
        }
      ],
      "foreign_keys": [],
      "indexes": [
        "art_styles_pkey (id)"
      ],
      "rls_policies": [
        {
          "name": "Admins can read art styles",
          "command": "SELECT",
          "roles": "authenticated",
          "using": "has_role(auth.uid(), 'admin')",
          "with_check": null
        },
        {
          "name": "Admins can insert art styles",
          "command": "INSERT",
          "roles": "authenticated",
          "using": null,
          "with_check": "has_role(auth.uid(), 'admin')"
        },
        {
          "name": "Admins can update art styles",
          "command": "UPDATE",
          "roles": "authenticated",
          "using": "has_role(auth.uid(), 'admin')",
          "with_check": null
        },
        {
          "name": "Admins can delete art styles",
          "command": "DELETE",
          "roles": "authenticated",
          "using": "has_role(auth.uid(), 'admin')",
          "with_check": null
        }
      ]
    },
    "character_session_states": {
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "nullable": false,
          "default": "gen_random_uuid()",
          "primary_key": true
        },
        {
          "name": "character_id",
          "type": "uuid",
          "nullable": false,
          "default": null
        },
        {
          "name": "conversation_id",
          "type": "uuid",
          "nullable": false,
          "default": null
        },
        {
          "name": "user_id",
          "type": "uuid",
          "nullable": false,
          "default": null
        },
        {
          "name": "name",
          "type": "text",
          "nullable": true,
          "default": null
        },
        {
          "name": "age",
          "type": "text",
          "nullable": true,
          "default": null
        },
        {
          "name": "sex_type",
          "type": "text",
          "nullable": true,
          "default": null
        },
        {
          "name": "sexual_orientation",
          "type": "text",
          "nullable": true,
          "default": null
        },
        {
          "name": "nicknames",
          "type": "text",
          "nullable": true,
          "default": "''"
        },
        {
          "name": "character_role",
          "type": "text",
          "nullable": true,
          "default": null
        },
        {
          "name": "role_description",
          "type": "text",
          "nullable": true,
          "default": null
        },
        {
          "name": "controlled_by",
          "type": "text",
          "nullable": true,
          "default": null
        },
        {
          "name": "location",
          "type": "text",
          "nullable": true,
          "default": "''"
        },
        {
          "name": "avatar_url",
          "type": "text",
          "nullable": true,
          "default": null
        },
        {
          "name": "avatar_path",
          "type": "text",
          "nullable": true,
          "default": null
        },
        {
          "name": "avatar_position",
          "type": "jsonb",
          "nullable": true,
          "default": "'{\"x\":50,\"y\":50}'"
        },
        {
          "name": "physical_appearance",
          "type": "jsonb",
          "nullable": true,
          "default": "'{}'"
        },
        {
          "name": "currently_wearing",
          "type": "jsonb",
          "nullable": true,
          "default": "'{}'"
        },
        {
          "name": "preferred_clothing",
          "type": "jsonb",
          "nullable": true,
          "default": "'{}'"
        },
        {
          "name": "personality",
          "type": "jsonb",
          "nullable": true,
          "default": null
        },
        {
          "name": "goals",
          "type": "jsonb",
          "nullable": true,
          "default": "'[]'"
        },
        {
          "name": "background",
          "type": "jsonb",
          "nullable": true,
          "default": null
        },
        {
          "name": "tone",
          "type": "jsonb",
          "nullable": true,
          "default": null
        },
        {
          "name": "key_life_events",
          "type": "jsonb",
          "nullable": true,
          "default": null
        },
        {
          "name": "relationships",
          "type": "jsonb",
          "nullable": true,
          "default": null
        },
        {
          "name": "secrets",
          "type": "jsonb",
          "nullable": true,
          "default": null
        },
        {
          "name": "fears",
          "type": "jsonb",
          "nullable": true,
          "default": null
        },
        {
          "name": "previous_names",
          "type": "text[]",
          "nullable": true,
          "default": "'{}'"
        },
        {
          "name": "custom_sections",
          "type": "jsonb",
          "nullable": true,
          "default": "'[]'"
        },
        {
          "name": "created_at",
          "type": "timestamptz",
          "nullable": true,
          "default": "now()"
        },
        {
          "name": "updated_at",
          "type": "timestamptz",
          "nullable": true,
          "default": "now()"
        }
      ],
      "foreign_keys": [],
      "indexes": [
        "character_session_states_pkey (id)",
        "character_session_states_character_id_conversation_id_key UNIQUE (character_id, conversation_id)"
      ],
      "rls_policies": [
        {
          "name": "Users can create own session states",
          "command": "INSERT",
          "roles": "public",
          "using": null,
          "with_check": "auth.uid() = user_id"
        },
        {
          "name": "Users can view own session states",
          "command": "SELECT",
          "roles": "public",
          "using": "auth.uid() = user_id",
          "with_check": null
        },
        {
          "name": "Users can update own session states",
          "command": "UPDATE",
          "roles": "public",
          "using": "auth.uid() = user_id",
          "with_check": null
        },
        {
          "name": "Users can delete own session states",
          "command": "DELETE",
          "roles": "public",
          "using": "auth.uid() = user_id",
          "with_check": null
        }
      ]
    },
    "characters": {
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "nullable": false,
          "default": "gen_random_uuid()",
          "primary_key": true
        },
        {
          "name": "user_id",
          "type": "uuid",
          "nullable": false,
          "default": null
        },
        {
          "name": "scenario_id",
          "type": "uuid",
          "nullable": true,
          "default": null
        },
        {
          "name": "name",
          "type": "text",
          "nullable": false,
          "default": "''"
        },
        {
          "name": "nicknames",
          "type": "text",
          "nullable": true,
          "default": "''"
        },
        {
          "name": "age",
          "type": "text",
          "nullable": true,
          "default": "''"
        },
        {
          "name": "sex_type",
          "type": "text",
          "nullable": true,
          "default": "''"
        },
        {
          "name": "sexual_orientation",
          "type": "text",
          "nullable": true,
          "default": "''"
        },
        {
          "name": "character_role",
          "type": "text",
          "nullable": true,
          "default": "'Main'"
        },
        {
          "name": "role_description",
          "type": "text",
          "nullable": true,
          "default": "''"
        },
        {
          "name": "controlled_by",
          "type": "text",
          "nullable": true,
          "default": "'AI'"
        },
        {
          "name": "tags",
          "type": "text",
          "nullable": true,
          "default": "''"
        },
        {
          "name": "avatar_url",
          "type": "text",
          "nullable": true,
          "default": "''"
        },
        {
          "name": "avatar_position",
          "type": "jsonb",
          "nullable": true,
          "default": "'{\"x\":50,\"y\":50}'"
        },
        {
          "name": "location",
          "type": "text",
          "nullable": true,
          "default": "''"
        },
        {
          "name": "current_mood",
          "type": "text",
          "nullable": true,
          "default": "''"
        },
        {
          "name": "physical_appearance",
          "type": "jsonb",
          "nullable": true,
          "default": "'{}'"
        },
        {
          "name": "currently_wearing",
          "type": "jsonb",
          "nullable": true,
          "default": "'{}'"
        },
        {
          "name": "preferred_clothing",
          "type": "jsonb",
          "nullable": true,
          "default": "'{}'"
        },
        {
          "name": "personality",
          "type": "jsonb",
          "nullable": true,
          "default": null
        },
        {
          "name": "goals",
          "type": "jsonb",
          "nullable": true,
          "default": "'[]'"
        },
        {
          "name": "background",
          "type": "jsonb",
          "nullable": true,
          "default": "'{}'"
        },
        {
          "name": "tone",
          "type": "jsonb",
          "nullable": true,
          "default": "'{}'"
        },
        {
          "name": "key_life_events",
          "type": "jsonb",
          "nullable": true,
          "default": "'{}'"
        },
        {
          "name": "relationships",
          "type": "jsonb",
          "nullable": true,
          "default": "'{}'"
        },
        {
          "name": "secrets",
          "type": "jsonb",
          "nullable": true,
          "default": "'{}'"
        },
        {
          "name": "fears",
          "type": "jsonb",
          "nullable": true,
          "default": "'{}'"
        },
        {
          "name": "sections",
          "type": "jsonb",
          "nullable": true,
          "default": "'[]'"
        },
        {
          "name": "is_library",
          "type": "boolean",
          "nullable": true,
          "default": "false"
        },
        {
          "name": "created_at",
          "type": "timestamptz",
          "nullable": true,
          "default": "now()"
        },
        {
          "name": "updated_at",
          "type": "timestamptz",
          "nullable": true,
          "default": "now()"
        }
      ],
      "foreign_keys": [],
      "indexes": [
        "characters_pkey (id)",
        "idx_characters_user_id (user_id)",
        "idx_characters_scenario_id (scenario_id)",
        "idx_characters_is_library (is_library)"
      ],
      "rls_policies": [
        {
          "name": "Users can create own characters",
          "command": "INSERT",
          "roles": "authenticated",
          "using": null,
          "with_check": "(auth.uid() = user_id) AND (scenario_id IS NULL OR EXISTS(SELECT 1 FROM stories s WHERE s.id = characters.scenario_id AND s.user_id = auth.uid()))"
        },
        {
          "name": "Users can view own or visible published characters",
          "command": "SELECT",
          "roles": "authenticated",
          "using": "(auth.uid() = user_id) OR has_role(auth.uid(), 'admin') OR EXISTS(SELECT 1 FROM published_scenarios ps JOIN profiles p ON p.id = ps.publisher_id WHERE ps.scenario_id = characters.scenario_id AND ps.is_published = true AND ps.is_hidden = false AND COALESCE(p.hide_published_works,false) = false)",
          "with_check": null
        },
        {
          "name": "Users can update own characters",
          "command": "UPDATE",
          "roles": "authenticated",
          "using": "auth.uid() = user_id",
          "with_check": "(auth.uid() = user_id) AND (scenario_id IS NULL OR EXISTS(SELECT 1 FROM stories s WHERE s.id = characters.scenario_id AND s.user_id = auth.uid()))"
        },
        {
          "name": "Users can delete own characters",
          "command": "DELETE",
          "roles": "public",
          "using": "auth.uid() = user_id",
          "with_check": null
        }
      ]
    },
    "codex_entries": {
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "nullable": false,
          "default": "gen_random_uuid()",
          "primary_key": true
        },
        {
          "name": "scenario_id",
          "type": "uuid",
          "nullable": false,
          "default": null
        },
        {
          "name": "title",
          "type": "text",
          "nullable": false,
          "default": "''"
        },
        {
          "name": "body",
          "type": "text",
          "nullable": true,
          "default": "''"
        },
        {
          "name": "created_at",
          "type": "timestamptz",
          "nullable": true,
          "default": "now()"
        },
        {
          "name": "updated_at",
          "type": "timestamptz",
          "nullable": true,
          "default": "now()"
        }
      ],
      "foreign_keys": [],
      "indexes": [
        "codex_entries_pkey (id)",
        "idx_codex_entries_scenario_id (scenario_id)"
      ],
      "rls_policies": [
        {
          "name": "Users can create codex via story",
          "command": "INSERT",
          "roles": "authenticated",
          "using": null,
          "with_check": "EXISTS(SELECT 1 FROM stories WHERE stories.id = codex_entries.scenario_id AND stories.user_id = auth.uid())"
        },
        {
          "name": "Users can view codex via own or visible published story",
          "command": "SELECT",
          "roles": "authenticated",
          "using": "has_role(auth.uid(),'admin') OR EXISTS(own story) OR EXISTS(published_scenarios JOIN profiles ON profiles.id = publisher_id WHERE is_published AND NOT is_hidden AND COALESCE(profiles.hide_published_works,false) = false)",
          "with_check": null
        },
        {
          "name": "Users can update codex via story",
          "command": "UPDATE",
          "roles": "authenticated",
          "using": "EXISTS(SELECT 1 FROM stories WHERE stories.id = codex_entries.scenario_id AND stories.user_id = auth.uid())",
          "with_check": null
        },
        {
          "name": "Users can delete codex via story",
          "command": "DELETE",
          "roles": "authenticated",
          "using": "EXISTS(SELECT 1 FROM stories WHERE stories.id = codex_entries.scenario_id AND stories.user_id = auth.uid())",
          "with_check": null
        }
      ]
    },
    "content_themes": {
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "nullable": false,
          "default": "gen_random_uuid()",
          "primary_key": true
        },
        {
          "name": "scenario_id",
          "type": "uuid",
          "nullable": false,
          "default": null
        },
        {
          "name": "character_types",
          "type": "text[]",
          "nullable": true,
          "default": "'{}'"
        },
        {
          "name": "story_type",
          "type": "text",
          "nullable": true,
          "default": null
        },
        {
          "name": "genres",
          "type": "text[]",
          "nullable": true,
          "default": "'{}'"
        },
        {
          "name": "origin",
          "type": "text[]",
          "nullable": true,
          "default": "'{}'"
        },
        {
          "name": "trigger_warnings",
          "type": "text[]",
          "nullable": true,
          "default": "'{}'"
        },
        {
          "name": "custom_tags",
          "type": "text[]",
          "nullable": true,
          "default": "'{}'"
        },
        {
          "name": "created_at",
          "type": "timestamptz",
          "nullable": true,
          "default": "now()"
        },
        {
          "name": "updated_at",
          "type": "timestamptz",
          "nullable": true,
          "default": "now()"
        }
      ],
      "foreign_keys": [],
      "indexes": [
        "content_themes_pkey (id)",
        "content_themes_scenario_id_key UNIQUE (scenario_id)"
      ],
      "rls_policies": [
        {
          "name": "Anyone can view visible published story themes",
          "command": "SELECT",
          "roles": "authenticated",
          "using": "has_role(auth.uid(),'admin') OR EXISTS(own story) OR EXISTS(published_scenarios JOIN profiles ON profiles.id = publisher_id WHERE is_published AND NOT is_hidden AND COALESCE(profiles.hide_published_works,false) = false)",
          "with_check": null
        },
        {
          "name": "Users can CRUD own story themes",
          "command": "ALL",
          "roles": "authenticated",
          "using": "EXISTS(own story)",
          "with_check": "EXISTS(own story)"
        }
      ]
    },
    "conversations": {
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "nullable": false,
          "default": "gen_random_uuid()",
          "primary_key": true
        },
        {
          "name": "user_id",
          "type": "uuid",
          "nullable": false,
          "default": null
        },
        {
          "name": "scenario_id",
          "type": "uuid",
          "nullable": false,
          "default": null
        },
        {
          "name": "title",
          "type": "text",
          "nullable": false,
          "default": "'Story Session'"
        },
        {
          "name": "current_day",
          "type": "integer",
          "nullable": true,
          "default": "1"
        },
        {
          "name": "current_time_of_day",
          "type": "text",
          "nullable": true,
          "default": "'day'"
        },
        {
          "name": "time_remaining",
          "type": "integer",
          "nullable": true,
          "default": null
        },
        {
          "name": "time_progression_mode",
          "type": "text",
          "nullable": false,
          "default": "'manual'"
        },
        {
          "name": "time_progression_interval",
          "type": "integer",
          "nullable": false,
          "default": "15"
        },
        {
          "name": "created_at",
          "type": "timestamptz",
          "nullable": true,
          "default": "now()"
        },
        {
          "name": "updated_at",
          "type": "timestamptz",
          "nullable": true,
          "default": "now()"
        }
      ],
      "foreign_keys": [],
      "indexes": [
        "conversations_pkey (id)"
      ],
      "rls_policies": [
        {
          "name": "Users can create own conversations",
          "command": "INSERT",
          "roles": "public",
          "using": null,
          "with_check": "auth.uid() = user_id"
        },
        {
          "name": "Users can view own conversations",
          "command": "SELECT",
          "roles": "public",
          "using": "auth.uid() = user_id",
          "with_check": null
        },
        {
          "name": "Users can update own conversations",
          "command": "UPDATE",
          "roles": "public",
          "using": "auth.uid() = user_id",
          "with_check": null
        },
        {
          "name": "Users can delete own conversations",
          "command": "DELETE",
          "roles": "public",
          "using": "auth.uid() = user_id",
          "with_check": null
        }
      ]
    },
    "creator_follows": {
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "nullable": false,
          "default": "gen_random_uuid()",
          "primary_key": true
        },
        {
          "name": "follower_id",
          "type": "uuid",
          "nullable": false,
          "default": null
        },
        {
          "name": "creator_id",
          "type": "uuid",
          "nullable": false,
          "default": null
        },
        {
          "name": "created_at",
          "type": "timestamptz",
          "nullable": true,
          "default": "now()"
        }
      ],
      "foreign_keys": [],
      "indexes": [
        "creator_follows_pkey (id)",
        "creator_follows_follower_id_creator_id_key UNIQUE (follower_id, creator_id)"
      ],
      "rls_policies": [
        {
          "name": "Users can follow creators",
          "command": "INSERT",
          "roles": "authenticated",
          "using": null,
          "with_check": "follower_id = auth.uid() AND creator_id <> auth.uid()"
        },
        {
          "name": "Users can view own follows",
          "command": "SELECT",
          "roles": "authenticated",
          "using": "follower_id = auth.uid()",
          "with_check": null
        },
        {
          "name": "Users can unfollow",
          "command": "DELETE",
          "roles": "authenticated",
          "using": "follower_id = auth.uid()",
          "with_check": null
        }
      ]
    },
    "finance_documents": {
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "nullable": false,
          "default": "gen_random_uuid()",
          "primary_key": true
        },
        {
          "name": "uploaded_by",
          "type": "uuid",
          "nullable": false,
          "default": null
        },
        {
          "name": "file_name",
          "type": "text",
          "nullable": false,
          "default": null
        },
        {
          "name": "storage_path",
          "type": "text",
          "nullable": false,
          "default": null
        },
        {
          "name": "mime_type",
          "type": "text",
          "nullable": false,
          "default": null
        },
        {
          "name": "size_bytes",
          "type": "bigint",
          "nullable": false,
          "default": null
        },
        {
          "name": "category",
          "type": "text",
          "nullable": false,
          "default": "'Uncategorized'"
        },
        {
          "name": "note",
          "type": "text",
          "nullable": false,
          "default": "''"
        },
        {
          "name": "created_at",
          "type": "timestamptz",
          "nullable": false,
          "default": "now()"
        },
        {
          "name": "updated_at",
          "type": "timestamptz",
          "nullable": false,
          "default": "now()"
        }
      ],
      "foreign_keys": [],
      "indexes": [
        "finance_documents_pkey (id)"
      ],
      "rls_policies": [
        {
          "name": "Admins can manage finance documents",
          "command": "ALL",
          "roles": "authenticated",
          "using": "has_role(auth.uid(), 'admin')",
          "with_check": "has_role(auth.uid(), 'admin')"
        }
      ]
    },
    "guide_documents": {
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "nullable": false,
          "default": "gen_random_uuid()",
          "primary_key": true
        },
        {
          "name": "title",
          "type": "text",
          "nullable": false,
          "default": "'Untitled Document'"
        },
        {
          "name": "content",
          "type": "jsonb",
          "nullable": true,
          "default": null
        },
        {
          "name": "markdown",
          "type": "text",
          "nullable": true,
          "default": null
        },
        {
          "name": "sort_order",
          "type": "integer",
          "nullable": false,
          "default": "0"
        },
        {
          "name": "created_at",
          "type": "timestamptz",
          "nullable": false,
          "default": "now()"
        },
        {
          "name": "updated_at",
          "type": "timestamptz",
          "nullable": false,
          "default": "now()"
        }
      ],
      "foreign_keys": [],
      "indexes": [
        "guide_documents_pkey (id)"
      ],
      "rls_policies": [
        {
          "name": "Admin can read guide documents",
          "command": "SELECT",
          "roles": "authenticated",
          "using": "has_role(auth.uid(), 'admin')",
          "with_check": null
        },
        {
          "name": "Admin can insert guide documents",
          "command": "INSERT",
          "roles": "authenticated",
          "using": null,
          "with_check": "has_role(auth.uid(), 'admin')"
        },
        {
          "name": "Admin can update guide documents",
          "command": "UPDATE",
          "roles": "authenticated",
          "using": "has_role(auth.uid(), 'admin')",
          "with_check": null
        },
        {
          "name": "Admin can delete guide documents",
          "command": "DELETE",
          "roles": "authenticated",
          "using": "has_role(auth.uid(), 'admin')",
          "with_check": null
        }
      ]
    },
    "image_folders": {
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "nullable": false,
          "default": "gen_random_uuid()",
          "primary_key": true
        },
        {
          "name": "user_id",
          "type": "uuid",
          "nullable": false,
          "default": null
        },
        {
          "name": "name",
          "type": "text",
          "nullable": false,
          "default": "'New Folder'"
        },
        {
          "name": "description",
          "type": "text",
          "nullable": true,
          "default": "''"
        },
        {
          "name": "thumbnail_image_id",
          "type": "uuid",
          "nullable": true,
          "default": null
        },
        {
          "name": "created_at",
          "type": "timestamptz",
          "nullable": true,
          "default": "now()"
        },
        {
          "name": "updated_at",
          "type": "timestamptz",
          "nullable": true,
          "default": "now()"
        }
      ],
      "foreign_keys": [],
      "indexes": [
        "image_folders_pkey (id)"
      ],
      "rls_policies": [
        {
          "name": "Users can create own folders",
          "command": "INSERT",
          "roles": "public",
          "using": null,
          "with_check": "auth.uid() = user_id"
        },
        {
          "name": "Users can view own folders",
          "command": "SELECT",
          "roles": "public",
          "using": "auth.uid() = user_id",
          "with_check": null
        },
        {
          "name": "Users can update own folders",
          "command": "UPDATE",
          "roles": "public",
          "using": "auth.uid() = user_id",
          "with_check": null
        },
        {
          "name": "Users can delete own folders",
          "command": "DELETE",
          "roles": "public",
          "using": "auth.uid() = user_id",
          "with_check": null
        }
      ]
    },
    "library_images": {
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "nullable": false,
          "default": "gen_random_uuid()",
          "primary_key": true
        },
        {
          "name": "user_id",
          "type": "uuid",
          "nullable": false,
          "default": null
        },
        {
          "name": "folder_id",
          "type": "uuid",
          "nullable": false,
          "default": null
        },
        {
          "name": "image_url",
          "type": "text",
          "nullable": false,
          "default": null
        },
        {
          "name": "image_path",
          "type": "text",
          "nullable": true,
          "default": null
        },
        {
          "name": "filename",
          "type": "text",
          "nullable": true,
          "default": "''"
        },
        {
          "name": "title",
          "type": "text",
          "nullable": false,
          "default": "''"
        },
        {
          "name": "tags",
          "type": "text[]",
          "nullable": false,
          "default": "'{}'"
        },
        {
          "name": "is_thumbnail",
          "type": "boolean",
          "nullable": true,
          "default": "false"
        },
        {
          "name": "created_at",
          "type": "timestamptz",
          "nullable": true,
          "default": "now()"
        }
      ],
      "foreign_keys": [],
      "indexes": [
        "library_images_pkey (id)"
      ],
      "rls_policies": [
        {
          "name": "Users can create own images",
          "command": "INSERT",
          "roles": "public",
          "using": null,
          "with_check": "auth.uid() = user_id"
        },
        {
          "name": "Users can view own images",
          "command": "SELECT",
          "roles": "public",
          "using": "auth.uid() = user_id",
          "with_check": null
        },
        {
          "name": "Users can update own images",
          "command": "UPDATE",
          "roles": "public",
          "using": "auth.uid() = user_id",
          "with_check": null
        },
        {
          "name": "Users can delete own images",
          "command": "DELETE",
          "roles": "public",
          "using": "auth.uid() = user_id",
          "with_check": null
        }
      ]
    },
    "media_migration_errors": {
      "columns": [
        {"name":"id","type":"uuid","nullable":false,"default":"gen_random_uuid()","primary_key":true},
        {"name":"source_bucket","type":"text","nullable":false,"default":null},
        {"name":"target_bucket","type":"text","nullable":false,"default":null},
        {"name":"source_path","type":"text","nullable":true,"default":null},
        {"name":"target_path","type":"text","nullable":true,"default":null},
        {"name":"owner_user_id","type":"uuid","nullable":true,"default":null},
        {"name":"ref_table","type":"text","nullable":true,"default":null},
        {"name":"ref_id","type":"uuid","nullable":true,"default":null},
        {"name":"error_code","type":"text","nullable":true,"default":null},
        {"name":"error_message","type":"text","nullable":true,"default":null},
        {"name":"created_at","type":"timestamptz","nullable":false,"default":"now()"}
      ],
      "foreign_keys": [],
      "indexes": ["media_migration_errors_pkey (id)"],
      "rls_policies": [
        {"name":"Admins can read media migration errors","command":"SELECT","roles":"authenticated","using":"has_role(auth.uid(), 'admin')","with_check":null}
      ]
    },
    "memories": {
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "nullable": false,
          "default": "gen_random_uuid()",
          "primary_key": true
        },
        {
          "name": "conversation_id",
          "type": "uuid",
          "nullable": false,
          "default": null
        },
        {
          "name": "user_id",
          "type": "uuid",
          "nullable": false,
          "default": null
        },
        {
          "name": "content",
          "type": "text",
          "nullable": false,
          "default": null
        },
        {
          "name": "entry_type",
          "type": "text",
          "nullable": false,
          "default": "'bullet'"
        },
        {
          "name": "day",
          "type": "integer",
          "nullable": true,
          "default": null
        },
        {
          "name": "time_of_day",
          "type": "text",
          "nullable": true,
          "default": null
        },
        {
          "name": "source",
          "type": "text",
          "nullable": true,
          "default": "'user'"
        },
        {
          "name": "source_message_id",
          "type": "uuid",
          "nullable": true,
          "default": null
        },
        {
          "name": "created_at",
          "type": "timestamptz",
          "nullable": true,
          "default": "now()"
        },
        {
          "name": "updated_at",
          "type": "timestamptz",
          "nullable": true,
          "default": "now()"
        }
      ],
      "foreign_keys": [],
      "indexes": [
        "memories_pkey (id)"
      ],
      "rls_policies": [
        {
          "name": "Users can create own memories",
          "command": "INSERT",
          "roles": "public",
          "using": null,
          "with_check": "auth.uid() = user_id"
        },
        {
          "name": "Users can view own memories",
          "command": "SELECT",
          "roles": "public",
          "using": "auth.uid() = user_id",
          "with_check": null
        },
        {
          "name": "Users can update own memories",
          "command": "UPDATE",
          "roles": "public",
          "using": "auth.uid() = user_id",
          "with_check": null
        },
        {
          "name": "Users can delete own memories",
          "command": "DELETE",
          "roles": "public",
          "using": "auth.uid() = user_id",
          "with_check": null
        }
      ]
    },
    "messages": {
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "nullable": false,
          "default": "gen_random_uuid()",
          "primary_key": true
        },
        {
          "name": "conversation_id",
          "type": "uuid",
          "nullable": false,
          "default": null
        },
        {
          "name": "role",
          "type": "text",
          "nullable": false,
          "default": null
        },
        {
          "name": "content",
          "type": "text",
          "nullable": false,
          "default": null
        },
        {
          "name": "day",
          "type": "integer",
          "nullable": true,
          "default": null
        },
        {
          "name": "time_of_day",
          "type": "text",
          "nullable": true,
          "default": null
        },
        {
          "name": "created_at",
          "type": "timestamptz",
          "nullable": true,
          "default": "now()"
        }
      ],
      "foreign_keys": [],
      "indexes": [
        "messages_pkey (id)"
      ],
      "rls_policies": [
        {
          "name": "Users can create messages via conversation",
          "command": "INSERT",
          "roles": "public",
          "using": null,
          "with_check": "EXISTS(conversation owned by user)"
        },
        {
          "name": "Users can view messages via conversation",
          "command": "SELECT",
          "roles": "public",
          "using": "EXISTS(conversation owned by user)",
          "with_check": null
        },
        {
          "name": "Users can update messages via conversation",
          "command": "UPDATE",
          "roles": "public",
          "using": "EXISTS(conversation owned by user)",
          "with_check": null
        },
        {
          "name": "Users can delete messages via conversation",
          "command": "DELETE",
          "roles": "public",
          "using": "EXISTS(conversation owned by user)",
          "with_check": null
        }
      ]
    },
    "profiles": {
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "nullable": false,
          "default": null,
          "primary_key": true
        },
        {
          "name": "username",
          "type": "text",
          "nullable": true,
          "default": null
        },
        {
          "name": "display_name",
          "type": "text",
          "nullable": true,
          "default": null
        },
        {
          "name": "avatar_url",
          "type": "text",
          "nullable": true,
          "default": null
        },
        {
          "name": "avatar_position",
          "type": "jsonb",
          "nullable": true,
          "default": "'{\"x\":50,\"y\":50}'"
        },
        {
          "name": "about_me",
          "type": "text",
          "nullable": true,
          "default": "''"
        },
        {
          "name": "preferred_genres",
          "type": "text[]",
          "nullable": true,
          "default": "'{}'"
        },
        {
          "name": "preferred_model",
          "type": "text",
          "nullable": true,
          "default": null
        },
        {
          "name": "hide_published_works",
          "type": "boolean",
          "nullable": true,
          "default": "false"
        },
        {
          "name": "hide_profile_details",
          "type": "boolean",
          "nullable": true,
          "default": "false"
        },
        {
          "name": "created_at",
          "type": "timestamptz",
          "nullable": true,
          "default": "now()"
        },
        {
          "name": "updated_at",
          "type": "timestamptz",
          "nullable": true,
          "default": "now()"
        }
      ],
      "foreign_keys": [],
      "indexes": [
        "profiles_pkey (id)"
      ],
      "rls_policies": [
        {
          "name": "Users can view own profile",
          "command": "SELECT",
          "roles": "authenticated",
          "using": "auth.uid() = id",
          "with_check": null
        },
        {
          "name": "Admins can view all profiles",
          "command": "SELECT",
          "roles": "authenticated",
          "using": "has_role(auth.uid(), 'admin'::app_role)",
          "with_check": null
        },
        {
          "name": "Users can insert own profile",
          "command": "INSERT",
          "roles": "public",
          "using": null,
          "with_check": "auth.uid() = id"
        },
        {
          "name": "Users can update own profile",
          "command": "UPDATE",
          "roles": "public",
          "using": "auth.uid() = id",
          "with_check": null
        }
      ]
    },
    "published_scenarios": {
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "nullable": false,
          "default": "gen_random_uuid()",
          "primary_key": true
        },
        {
          "name": "scenario_id",
          "type": "uuid",
          "nullable": false,
          "default": null
        },
        {
          "name": "publisher_id",
          "type": "uuid",
          "nullable": false,
          "default": null
        },
        {
          "name": "allow_remix",
          "type": "boolean",
          "nullable": false,
          "default": "false"
        },
        {
          "name": "tags",
          "type": "text[]",
          "nullable": false,
          "default": "'{}'"
        },
        {
          "name": "like_count",
          "type": "integer",
          "nullable": false,
          "default": "0"
        },
        {
          "name": "save_count",
          "type": "integer",
          "nullable": false,
          "default": "0"
        },
        {
          "name": "play_count",
          "type": "integer",
          "nullable": false,
          "default": "0"
        },
        {
          "name": "view_count",
          "type": "integer",
          "nullable": false,
          "default": "0"
        },
        {
          "name": "avg_rating",
          "type": "numeric",
          "nullable": false,
          "default": "0"
        },
        {
          "name": "review_count",
          "type": "integer",
          "nullable": false,
          "default": "0"
        },
        {
          "name": "reported_count",
          "type": "integer",
          "nullable": false,
          "default": "0"
        },
        {
          "name": "is_published",
          "type": "boolean",
          "nullable": false,
          "default": "true"
        },
        {
          "name": "is_hidden",
          "type": "boolean",
          "nullable": false,
          "default": "false"
        },
        {
          "name": "created_at",
          "type": "timestamptz",
          "nullable": true,
          "default": "now()"
        },
        {
          "name": "updated_at",
          "type": "timestamptz",
          "nullable": true,
          "default": "now()"
        }
      ],
      "foreign_keys": [],
      "indexes": [
        "published_scenarios_pkey (id)",
        "published_scenarios_scenario_id_key UNIQUE (scenario_id)"
      ],
      "rls_policies": [
        {
          "name": "Owners can view own publications",
          "command": "SELECT",
          "roles": "authenticated",
          "using": "publisher_id = auth.uid()",
          "with_check": null
        },
        {
          "name": "Admins can view all publications",
          "command": "SELECT",
          "roles": "authenticated",
          "using": "has_role(auth.uid(), 'admin'::app_role)",
          "with_check": null
        },
        {
          "name": "Publishers can insert own publications",
          "command": "INSERT",
          "roles": "authenticated",
          "using": null,
          "with_check": "publisher_id = auth.uid() AND EXISTS(SELECT 1 FROM stories s WHERE s.id = published_scenarios.scenario_id AND s.user_id = auth.uid())"
        },
        {
          "name": "Publishers can update own publications",
          "command": "UPDATE",
          "roles": "authenticated",
          "using": "publisher_id = auth.uid()",
          "with_check": "publisher_id = auth.uid() AND EXISTS(SELECT 1 FROM stories s WHERE s.id = published_scenarios.scenario_id AND s.user_id = auth.uid())"
        },
        {
          "name": "Publishers can delete own publications",
          "command": "DELETE",
          "roles": "authenticated",
          "using": "publisher_id = auth.uid()",
          "with_check": null
        }
      ]
    },
    "quality_hub_registries": {
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "nullable": false,
          "default": "gen_random_uuid()",
          "primary_key": true
        },
        {
          "name": "user_id",
          "type": "uuid",
          "nullable": false,
          "default": null
        },
        {
          "name": "registry",
          "type": "jsonb",
          "nullable": false,
          "default": null
        },
        {
          "name": "updated_at",
          "type": "timestamptz",
          "nullable": true,
          "default": "now()"
        }
      ],
      "foreign_keys": [],
      "indexes": [
        "quality_hub_registries_pkey (id)"
      ],
      "rls_policies": [
        {
          "name": "Users can insert own registry",
          "command": "INSERT",
          "roles": "authenticated",
          "using": null,
          "with_check": "auth.uid() = user_id"
        },
        {
          "name": "Users can view own registry",
          "command": "SELECT",
          "roles": "authenticated",
          "using": "auth.uid() = user_id",
          "with_check": null
        },
        {
          "name": "Users can update own registry",
          "command": "UPDATE",
          "roles": "authenticated",
          "using": "auth.uid() = user_id",
          "with_check": null
        },
        {
          "name": "Users can delete own registry",
          "command": "DELETE",
          "roles": "authenticated",
          "using": "auth.uid() = user_id",
          "with_check": null
        }
      ]
    },
    "remixed_scenarios": {
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "nullable": false,
          "default": "gen_random_uuid()",
          "primary_key": true
        },
        {
          "name": "original_published_id",
          "type": "uuid",
          "nullable": true,
          "default": null
        },
        {
          "name": "remixed_scenario_id",
          "type": "uuid",
          "nullable": false,
          "default": null
        },
        {
          "name": "remixer_id",
          "type": "uuid",
          "nullable": false,
          "default": null
        },
        {
          "name": "created_at",
          "type": "timestamptz",
          "nullable": true,
          "default": "now()"
        }
      ],
      "foreign_keys": [],
      "indexes": [
        "remixed_scenarios_pkey (id)"
      ],
      "rls_policies": [
        {
          "name": "Users can insert own remixes",
          "command": "INSERT",
          "roles": "authenticated",
          "using": null,
          "with_check": "remixer_id = auth.uid()"
        },
        {
          "name": "Users can view own remixes",
          "command": "SELECT",
          "roles": "authenticated",
          "using": "remixer_id = auth.uid()",
          "with_check": null
        }
      ]
    },
    "reports": {
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "nullable": false,
          "default": "gen_random_uuid()",
          "primary_key": true
        },
        {
          "name": "reporter",
          "type": "text",
          "nullable": false,
          "default": null
        },
        {
          "name": "accused",
          "type": "text",
          "nullable": false,
          "default": null
        },
        {
          "name": "reason",
          "type": "text",
          "nullable": false,
          "default": null
        },
        {
          "name": "story_id",
          "type": "text",
          "nullable": true,
          "default": null
        },
        {
          "name": "status",
          "type": "text",
          "nullable": false,
          "default": "'open'"
        },
        {
          "name": "note",
          "type": "text",
          "nullable": true,
          "default": "''"
        },
        {
          "name": "reporter_user_id",
          "type": "uuid",
          "nullable": true,
          "default": null
        },
        {
          "name": "accused_user_id",
          "type": "uuid",
          "nullable": true,
          "default": null
        },
        {
          "name": "reviewed_by",
          "type": "uuid",
          "nullable": true,
          "default": null
        },
        {
          "name": "created_at",
          "type": "timestamptz",
          "nullable": false,
          "default": "now()"
        },
        {
          "name": "updated_at",
          "type": "timestamptz",
          "nullable": false,
          "default": "now()"
        }
      ],
      "foreign_keys": [],
      "indexes": [
        "reports_pkey (id)"
      ],
      "rls_policies": [
        {
          "name": "Admins can manage reports",
          "command": "ALL",
          "roles": "authenticated",
          "using": "has_role(auth.uid(), 'admin')",
          "with_check": "has_role(auth.uid(), 'admin')"
        },
        {
          "name": "Users can insert own reports",
          "command": "INSERT",
          "roles": "authenticated",
          "using": null,
          "with_check": "reporter_user_id IS NOT NULL AND auth.uid() = reporter_user_id"
        }
      ]
    },
    "saved_scenarios": {
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "nullable": false,
          "default": "gen_random_uuid()",
          "primary_key": true
        },
        {
          "name": "user_id",
          "type": "uuid",
          "nullable": false,
          "default": null
        },
        {
          "name": "published_scenario_id",
          "type": "uuid",
          "nullable": false,
          "default": null
        },
        {
          "name": "source_scenario_id",
          "type": "uuid",
          "nullable": false,
          "default": null
        },
        {
          "name": "created_at",
          "type": "timestamptz",
          "nullable": true,
          "default": "now()"
        }
      ],
      "foreign_keys": [],
      "indexes": [
        "saved_scenarios_pkey (id)",
        "saved_scenarios_user_id_published_scenario_id_key UNIQUE (user_id, published_scenario_id)"
      ],
      "rls_policies": [
        {
          "name": "Users can insert own saves",
          "command": "INSERT",
          "roles": "authenticated",
          "using": null,
          "with_check": "user_id = auth.uid()"
        },
        {
          "name": "Users can view own saves",
          "command": "SELECT",
          "roles": "authenticated",
          "using": "user_id = auth.uid()",
          "with_check": null
        },
        {
          "name": "Users can delete own saves",
          "command": "DELETE",
          "roles": "authenticated",
          "using": "user_id = auth.uid()",
          "with_check": null
        }
      ]
    },
    "scenario_likes": {
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "nullable": false,
          "default": "gen_random_uuid()",
          "primary_key": true
        },
        {
          "name": "user_id",
          "type": "uuid",
          "nullable": false,
          "default": null
        },
        {
          "name": "published_scenario_id",
          "type": "uuid",
          "nullable": false,
          "default": null
        },
        {
          "name": "created_at",
          "type": "timestamptz",
          "nullable": true,
          "default": "now()"
        }
      ],
      "foreign_keys": [],
      "indexes": [
        "scenario_likes_pkey (id)",
        "scenario_likes_user_id_published_scenario_id_key UNIQUE (user_id, published_scenario_id)"
      ],
      "rls_policies": [
        {
          "name": "Users can view own likes",
          "command": "SELECT",
          "roles": "authenticated",
          "using": "user_id = auth.uid() OR has_role(auth.uid(), 'admin')",
          "with_check": null
        },
        {
          "name": "Users can insert own likes",
          "command": "INSERT",
          "roles": "authenticated",
          "using": null,
          "with_check": "user_id = auth.uid()"
        },
        {
          "name": "Users can delete own likes",
          "command": "DELETE",
          "roles": "authenticated",
          "using": "user_id = auth.uid()",
          "with_check": null
        }
      ]
    },
    "scenario_reviews": {
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "nullable": false,
          "default": "gen_random_uuid()",
          "primary_key": true
        },
        {
          "name": "published_scenario_id",
          "type": "uuid",
          "nullable": false,
          "default": null
        },
        {
          "name": "user_id",
          "type": "uuid",
          "nullable": false,
          "default": null
        },
        {
          "name": "concept_strength",
          "type": "smallint",
          "nullable": false,
          "default": null
        },
        {
          "name": "initial_situation",
          "type": "smallint",
          "nullable": false,
          "default": null
        },
        {
          "name": "role_clarity",
          "type": "smallint",
          "nullable": false,
          "default": null
        },
        {
          "name": "motivation_tension",
          "type": "smallint",
          "nullable": false,
          "default": null
        },
        {
          "name": "tone_promise",
          "type": "smallint",
          "nullable": false,
          "default": null
        },
        {
          "name": "low_friction_start",
          "type": "smallint",
          "nullable": false,
          "default": null
        },
        {
          "name": "worldbuilding_vibe",
          "type": "smallint",
          "nullable": false,
          "default": null
        },
        {
          "name": "replayability",
          "type": "smallint",
          "nullable": false,
          "default": null
        },
        {
          "name": "character_details_complexity",
          "type": "smallint",
          "nullable": false,
          "default": null
        },
        {
          "name": "spice_level",
          "type": "smallint",
          "nullable": false,
          "default": null
        },
        {
          "name": "raw_weighted_score",
          "type": "numeric",
          "nullable": false,
          "default": null
        },
        {
          "name": "comment",
          "type": "text",
          "nullable": true,
          "default": null
        },
        {
          "name": "created_at",
          "type": "timestamptz",
          "nullable": true,
          "default": "now()"
        },
        {
          "name": "updated_at",
          "type": "timestamptz",
          "nullable": true,
          "default": "now()"
        }
      ],
      "foreign_keys": [],
      "indexes": [
        "scenario_reviews_pkey (id)",
        "scenario_reviews_published_scenario_id_user_id_key UNIQUE (published_scenario_id, user_id)"
      ],
      "rls_policies": [
        {
          "name": "Users can view own reviews",
          "command": "SELECT",
          "roles": "authenticated",
          "using": "user_id = auth.uid()",
          "with_check": null
        },
        {
          "name": "Admins can view all reviews",
          "command": "SELECT",
          "roles": "authenticated",
          "using": "has_role(auth.uid(), 'admin'::app_role)",
          "with_check": null
        },
        {
          "name": "Admins can update reviews",
          "command": "UPDATE",
          "roles": "authenticated",
          "using": "has_role(auth.uid(), 'admin'::app_role)",
          "with_check": null
        },
        {
          "name": "Admins can delete reviews",
          "command": "DELETE",
          "roles": "authenticated",
          "using": "has_role(auth.uid(), 'admin'::app_role)",
          "with_check": null
        },
        {
          "name": "Users can create own reviews",
          "command": "INSERT",
          "roles": "public",
          "using": null,
          "with_check": "user_id = auth.uid()"
        },
        {
          "name": "Users can update own reviews",
          "command": "UPDATE",
          "roles": "public",
          "using": "user_id = auth.uid()",
          "with_check": null
        },
        {
          "name": "Users can delete own reviews",
          "command": "DELETE",
          "roles": "public",
          "using": "user_id = auth.uid()",
          "with_check": null
        }
      ]
    },
    "scenario_views": {
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "nullable": false,
          "default": "gen_random_uuid()",
          "primary_key": true
        },
        {
          "name": "published_scenario_id",
          "type": "uuid",
          "nullable": false,
          "default": null
        },
        {
          "name": "user_id",
          "type": "uuid",
          "nullable": false,
          "default": null
        },
        {
          "name": "viewed_at",
          "type": "timestamptz",
          "nullable": false,
          "default": "now()"
        }
      ],
      "foreign_keys": [],
      "indexes": [
        "scenario_views_pkey (id)"
      ],
      "rls_policies": [
        {
          "name": "Users can insert own views",
          "command": "INSERT",
          "roles": "public",
          "using": null,
          "with_check": "user_id = auth.uid()"
        },
        {
          "name": "Users can view own views",
          "command": "SELECT",
          "roles": "public",
          "using": "user_id = auth.uid()",
          "with_check": null
        }
      ]
    },
    "scenario_plays": {
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "nullable": false,
          "default": "gen_random_uuid()",
          "primary_key": true
        },
        {
          "name": "published_scenario_id",
          "type": "uuid",
          "nullable": false,
          "default": null
        },
        {
          "name": "user_id",
          "type": "uuid",
          "nullable": false,
          "default": null
        },
        {
          "name": "played_at",
          "type": "timestamptz",
          "nullable": false,
          "default": "now()"
        }
      ],
      "foreign_keys": [
        "published_scenario_id -> published_scenarios.id ON DELETE CASCADE",
        "user_id -> auth.users.id ON DELETE CASCADE"
      ],
      "indexes": [
        "scenario_plays_pkey (id)",
        "idx_scenario_plays_user_scenario_played_at (user_id, published_scenario_id, played_at DESC)",
        "idx_scenario_plays_published_scenario_id (published_scenario_id)"
      ],
      "rls_policies": [
        {
          "name": "Users can view own plays",
          "command": "SELECT",
          "roles": "authenticated",
          "using": "user_id = auth.uid()",
          "with_check": null
        }
      ],
      "notes": "Per-user ledger of plays; inserts only via SECURITY DEFINER record_scenario_play RPC with a 5-minute throttle. Drives published_scenarios.play_count via sync_play_count trigger."
    },
    "scenes": {
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "nullable": false,
          "default": "gen_random_uuid()",
          "primary_key": true
        },
        {
          "name": "scenario_id",
          "type": "uuid",
          "nullable": false,
          "default": null
        },
        {
          "name": "image_url",
          "type": "text",
          "nullable": false,
          "default": null
        },
        {
          "name": "image_path",
          "type": "text",
          "nullable": true,
          "default": null
        },
        {
          "name": "tags",
          "type": "text[]",
          "nullable": true,
          "default": "'{}'"
        },
        {
          "name": "tag",
          "type": "text",
          "nullable": true,
          "default": "''"
        },
        {
          "name": "is_starting_scene",
          "type": "boolean",
          "nullable": true,
          "default": "false"
        },
        {
          "name": "created_at",
          "type": "timestamptz",
          "nullable": true,
          "default": "now()"
        }
      ],
      "foreign_keys": [],
      "indexes": [
        "scenes_pkey (id)",
        "idx_scenes_scenario_id (scenario_id)"
      ],
      "rls_policies": [
        {
          "name": "Users can create scenes via story",
          "command": "INSERT",
          "roles": "authenticated",
          "using": null,
          "with_check": "EXISTS(own story)"
        },
        {
          "name": "Users can view scenes via own or visible published story",
          "command": "SELECT",
          "roles": "authenticated",
          "using": "has_role(auth.uid(),'admin') OR EXISTS(own story) OR EXISTS(published_scenarios JOIN profiles ON profiles.id = publisher_id WHERE is_published AND NOT is_hidden AND COALESCE(profiles.hide_published_works,false) = false)",
          "with_check": null
        },
        {
          "name": "Users can update scenes via story",
          "command": "UPDATE",
          "roles": "authenticated",
          "using": "EXISTS(own story)",
          "with_check": null
        },
        {
          "name": "Users can delete scenes via story",
          "command": "DELETE",
          "roles": "authenticated",
          "using": "EXISTS(own story)",
          "with_check": null
        }
      ]
    },
    "side_characters": {
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "nullable": false,
          "default": "gen_random_uuid()",
          "primary_key": true
        },
        {
          "name": "conversation_id",
          "type": "uuid",
          "nullable": false,
          "default": null
        },
        {
          "name": "user_id",
          "type": "uuid",
          "nullable": false,
          "default": null
        },
        {
          "name": "name",
          "type": "text",
          "nullable": false,
          "default": null
        },
        {
          "name": "age",
          "type": "text",
          "nullable": true,
          "default": "''"
        },
        {
          "name": "sex_type",
          "type": "text",
          "nullable": true,
          "default": "''"
        },
        {
          "name": "sexual_orientation",
          "type": "text",
          "nullable": true,
          "default": "''"
        },
        {
          "name": "nicknames",
          "type": "text",
          "nullable": true,
          "default": "''"
        },
        {
          "name": "character_role",
          "type": "text",
          "nullable": true,
          "default": "'Side'"
        },
        {
          "name": "role_description",
          "type": "text",
          "nullable": true,
          "default": "''"
        },
        {
          "name": "controlled_by",
          "type": "text",
          "nullable": true,
          "default": "'AI'"
        },
        {
          "name": "location",
          "type": "text",
          "nullable": true,
          "default": "''"
        },
        {
          "name": "current_mood",
          "type": "text",
          "nullable": true,
          "default": "''"
        },
        {
          "name": "avatar_url",
          "type": "text",
          "nullable": true,
          "default": "''"
        },
        {
          "name": "avatar_path",
          "type": "text",
          "nullable": true,
          "default": null
        },
        {
          "name": "avatar_position",
          "type": "jsonb",
          "nullable": true,
          "default": "'{\"x\":50,\"y\":50}'"
        },
        {
          "name": "physical_appearance",
          "type": "jsonb",
          "nullable": true,
          "default": "(full default obj)"
        },
        {
          "name": "currently_wearing",
          "type": "jsonb",
          "nullable": true,
          "default": "(full default obj)"
        },
        {
          "name": "preferred_clothing",
          "type": "jsonb",
          "nullable": true,
          "default": "(full default obj)"
        },
        {
          "name": "personality",
          "type": "jsonb",
          "nullable": true,
          "default": "(full default obj)"
        },
        {
          "name": "background",
          "type": "jsonb",
          "nullable": true,
          "default": "(full default obj)"
        },
        {
          "name": "extracted_traits",
          "type": "jsonb",
          "nullable": true,
          "default": "'[]'"
        },
        {
          "name": "first_mentioned_in",
          "type": "text",
          "nullable": true,
          "default": "''"
        },
        {
          "name": "custom_sections",
          "type": "jsonb",
          "nullable": false,
          "default": "'[]'"
        },
        {
          "name": "created_at",
          "type": "timestamptz",
          "nullable": true,
          "default": "now()"
        },
        {
          "name": "updated_at",
          "type": "timestamptz",
          "nullable": true,
          "default": "now()"
        }
      ],
      "foreign_keys": [],
      "indexes": [
        "side_characters_pkey (id)"
      ],
      "rls_policies": [
        {
          "name": "Users can create own side characters",
          "command": "INSERT",
          "roles": "public",
          "using": null,
          "with_check": "auth.uid() = user_id"
        },
        {
          "name": "Users can view own side characters",
          "command": "SELECT",
          "roles": "public",
          "using": "auth.uid() = user_id",
          "with_check": null
        },
        {
          "name": "Users can update own side characters",
          "command": "UPDATE",
          "roles": "public",
          "using": "auth.uid() = user_id",
          "with_check": null
        },
        {
          "name": "Users can delete own side characters",
          "command": "DELETE",
          "roles": "public",
          "using": "auth.uid() = user_id",
          "with_check": null
        }
      ]
    },
    "sidebar_backgrounds": {
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "nullable": false,
          "default": "gen_random_uuid()",
          "primary_key": true
        },
        {
          "name": "user_id",
          "type": "uuid",
          "nullable": false,
          "default": null
        },
        {
          "name": "image_url",
          "type": "text",
          "nullable": false,
          "default": null
        },
        {
          "name": "category",
          "type": "text",
          "nullable": false,
          "default": "'Uncategorized'"
        },
        {
          "name": "sort_order",
          "type": "integer",
          "nullable": false,
          "default": "0"
        },
        {
          "name": "overlay_color",
          "type": "text",
          "nullable": false,
          "default": "'black'"
        },
        {
          "name": "overlay_opacity",
          "type": "integer",
          "nullable": false,
          "default": "10"
        },
        {
          "name": "is_selected",
          "type": "boolean",
          "nullable": true,
          "default": "false"
        },
        {
          "name": "created_at",
          "type": "timestamptz",
          "nullable": true,
          "default": "now()"
        },
        {
          "name": "image_path",
          "type": "text",
          "nullable": true,
          "default": null
        }
      ],
      "foreign_keys": [],
      "indexes": [
        "sidebar_backgrounds_pkey (id)"
      ],
      "rls_policies": [
        {
          "name": "Users can insert own sidebar backgrounds",
          "command": "INSERT",
          "roles": "public",
          "using": null,
          "with_check": "auth.uid() = user_id"
        },
        {
          "name": "Users can view own sidebar backgrounds",
          "command": "SELECT",
          "roles": "public",
          "using": "auth.uid() = user_id",
          "with_check": null
        },
        {
          "name": "Users can update own sidebar backgrounds",
          "command": "UPDATE",
          "roles": "public",
          "using": "auth.uid() = user_id",
          "with_check": null
        },
        {
          "name": "Users can delete own sidebar backgrounds",
          "command": "DELETE",
          "roles": "public",
          "using": "auth.uid() = user_id",
          "with_check": null
        }
      ]
    },
    "stories": {
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "nullable": false,
          "default": "gen_random_uuid()",
          "primary_key": true
        },
        {
          "name": "user_id",
          "type": "uuid",
          "nullable": false,
          "default": null
        },
        {
          "name": "title",
          "type": "text",
          "nullable": false,
          "default": "'Untitled Story'"
        },
        {
          "name": "description",
          "type": "text",
          "nullable": true,
          "default": "''"
        },
        {
          "name": "cover_image_url",
          "type": "text",
          "nullable": true,
          "default": "''"
        },
        {
          "name": "cover_image_path",
          "type": "text",
          "nullable": true,
          "default": null
        },
        {
          "name": "cover_image_position",
          "type": "jsonb",
          "nullable": true,
          "default": "'{\"x\":50,\"y\":50}'"
        },
        {
          "name": "tags",
          "type": "text[]",
          "nullable": true,
          "default": "'{}'"
        },
        {
          "name": "world_core",
          "type": "jsonb",
          "nullable": false,
          "default": "'{}'"
        },
        {
          "name": "ui_settings",
          "type": "jsonb",
          "nullable": true,
          "default": "(default obj)"
        },
        {
          "name": "opening_dialog",
          "type": "jsonb",
          "nullable": true,
          "default": "'{\"text\":\"\",\"enabled\":true}'"
        },
        {
          "name": "selected_model",
          "type": "text",
          "nullable": true,
          "default": "'grok-4.20-0309-reasoning'"
        },
        {
          "name": "selected_art_style",
          "type": "text",
          "nullable": true,
          "default": "'cinematic-2-5d'"
        },
        {
          "name": "version",
          "type": "integer",
          "nullable": true,
          "default": "3"
        },
        {
          "name": "is_draft",
          "type": "boolean",
          "nullable": false,
          "default": "false"
        },
        {
          "name": "nav_button_images",
          "type": "jsonb",
          "nullable": true,
          "default": "'{}'"
        },
        {
          "name": "created_at",
          "type": "timestamptz",
          "nullable": true,
          "default": "now()"
        },
        {
          "name": "updated_at",
          "type": "timestamptz",
          "nullable": true,
          "default": "now()"
        }
      ],
      "foreign_keys": [],
      "indexes": [
        "stories_pkey (id)",
        "idx_stories_user_id (user_id)"
      ],
      "rls_policies": [
        {
          "name": "Users can create own stories",
          "command": "INSERT",
          "roles": "authenticated",
          "using": null,
          "with_check": "auth.uid() = user_id"
        },
        {
          "name": "Users can view own or visible published stories",
          "command": "SELECT",
          "roles": "authenticated",
          "using": "(auth.uid() = user_id) OR has_role(auth.uid(),'admin') OR EXISTS(published_scenarios JOIN profiles ON profiles.id = publisher_id WHERE ps.scenario_id = stories.id AND is_published AND NOT is_hidden AND COALESCE(profiles.hide_published_works,false) = false)",
          "with_check": null
        },
        {
          "name": "Users can update own stories",
          "command": "UPDATE",
          "roles": "authenticated",
          "using": "auth.uid() = user_id",
          "with_check": null
        },
        {
          "name": "Users can delete own stories",
          "command": "DELETE",
          "roles": "authenticated",
          "using": "auth.uid() = user_id",
          "with_check": null
        }
      ]
    },
    "user_backgrounds": {
      "columns": [
        {"name":"id","type":"uuid","nullable":false,"default":"gen_random_uuid()","primary_key":true},
        {"name":"user_id","type":"uuid","nullable":false,"default":null},
        {"name":"image_url","type":"text","nullable":true,"default":null},
        {"name":"image_path","type":"text","nullable":true,"default":null},
        {"name":"is_selected","type":"boolean","nullable":true,"default":"false"},
        {"name":"image_library_selected","type":"boolean","nullable":true,"default":"false"},
        {"name":"category","type":"text","nullable":false,"default":"'Uncategorized'"},
        {"name":"sort_order","type":"integer","nullable":false,"default":"0"},
        {"name":"overlay_color","type":"text","nullable":false,"default":"'black'"},
        {"name":"overlay_opacity","type":"integer","nullable":false,"default":"10"},
        {"name":"created_at","type":"timestamptz","nullable":true,"default":"now()"}
      ],
      "foreign_keys": [],
      "indexes": ["user_backgrounds_pkey (id)"],
      "rls_policies": [
        {"name":"Users can view own user backgrounds","command":"SELECT","roles":"authenticated","using":"auth.uid() = user_id","with_check":null},
        {"name":"Users can insert own user backgrounds","command":"INSERT","roles":"authenticated","using":null,"with_check":"auth.uid() = user_id"},
        {"name":"Users can update own user backgrounds","command":"UPDATE","roles":"authenticated","using":"auth.uid() = user_id","with_check":null},
        {"name":"Users can delete own user backgrounds","command":"DELETE","roles":"authenticated","using":"auth.uid() = user_id","with_check":null}
      ]
    },
    "user_roles": {
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "nullable": false,
          "default": "gen_random_uuid()",
          "primary_key": true
        },
        {
          "name": "user_id",
          "type": "uuid",
          "nullable": false,
          "default": null
        },
        {
          "name": "role",
          "type": "app_role (enum: admin, moderator, user)",
          "nullable": false,
          "default": null
        }
      ],
      "foreign_keys": [
        {
          "column": "user_id",
          "references": "auth.users(id)",
          "on_delete": "CASCADE"
        }
      ],
      "indexes": [
        "user_roles_pkey (id)",
        "user_roles_user_id_role_key UNIQUE (user_id, role)"
      ],
      "rls_policies": []
    },
    "user_strikes": {
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "nullable": false,
          "default": "gen_random_uuid()",
          "primary_key": true
        },
        {
          "name": "user_id",
          "type": "uuid",
          "nullable": false,
          "default": null
        },
        {
          "name": "reason",
          "type": "text",
          "nullable": false,
          "default": null
        },
        {
          "name": "issued_by",
          "type": "uuid",
          "nullable": false,
          "default": null
        },
        {
          "name": "created_at",
          "type": "timestamptz",
          "nullable": false,
          "default": "now()"
        }
      ],
      "foreign_keys": [],
      "indexes": [
        "user_strikes_pkey (id)"
      ],
      "rls_policies": [
        {
          "name": "Admins can manage strikes",
          "command": "ALL",
          "roles": "authenticated",
          "using": "has_role(auth.uid(), 'admin')",
          "with_check": "has_role(auth.uid(), 'admin')"
        }
      ]
    }
  },
  "database_functions": [
    {
      "name": "handle_new_user",
      "touches": [
        "profiles"
      ],
      "security": "DEFINER",
      "description": "Trigger: creates profile row on auth.users INSERT"
    },
    {
      "name": "has_role",
      "touches": [
        "user_roles"
      ],
      "security": "DEFINER",
      "description": "Check if user has a specific app_role"
    },
    {
      "name": "set_admin_access",
      "touches": [
        "user_roles",
        "app_settings"
      ],
      "security": "DEFINER",
      "description": "Grant/revoke admin role"
    },
    {
      "name": "record_scenario_view",
      "touches": [
        "scenario_views",
        "published_scenarios"
      ],
      "security": "DEFINER",
      "description": "Insert view + increment count (24h dedup). Updated 2026-06-19 (BF-12): gates on published_scenarios.is_published AND NOT is_hidden AND publisher profile.hide_published_works = false before inserting/incrementing; raises 'Scenario not available' otherwise."
    },
    {
      "name": "record_scenario_play",
      "touches": [
        "scenario_plays"
      ],
      "security": "DEFINER",
      "description": "Insert a play row, throttled to once per scenario per 5 minutes per user. play_count is then maintained by sync_play_count trigger. Updated 2026-06-19 (BF-12): gates on published_scenarios.is_published AND NOT is_hidden AND publisher profile.hide_published_works = false; raises 'Scenario not available' otherwise."
    },
    {
      "name": "sync_published_scenario_like_count",
      "touches": [
        "published_scenarios",
        "scenario_likes"
      ],
      "security": "DEFINER",
      "description": "Trigger: keeps published_scenarios.like_count = count(*) from scenario_likes after INSERT/DELETE."
    },
    {
      "name": "sync_published_scenario_save_count",
      "touches": [
        "published_scenarios",
        "saved_scenarios"
      ],
      "security": "DEFINER",
      "description": "Trigger: keeps published_scenarios.save_count = count(*) from saved_scenarios after INSERT/DELETE."
    },
    {
      "name": "sync_published_scenario_play_count",
      "touches": [
        "published_scenarios",
        "scenario_plays"
      ],
      "security": "DEFINER",
      "description": "Trigger: keeps published_scenarios.play_count = count(*) from scenario_plays after INSERT/DELETE."
    },
    {
      "name": "update_review_aggregates",
      "touches": [
        "published_scenarios",
        "scenario_reviews"
      ],
      "security": "DEFINER",
      "description": "Trigger: update avg_rating/review_count on review change"
    },
    {
      "name": "validate_review_ratings",
      "touches": [
        "scenario_reviews"
      ],
      "security": "INVOKER",
      "description": "Trigger: ensure all ratings 1-5"
    },
    {
      "name": "fetch_gallery_scenarios",
      "touches": [
        "published_scenarios",
        "stories",
        "profiles",
        "content_themes"
      ],
      "security": "DEFINER",
      "description": "RPC: paginated gallery search with filters"
    },
    {
      "name": "get_creator_stats",
      "touches": [
        "published_scenarios",
        "creator_follows",
        "profiles"
      ],
      "security": "DEFINER",
      "description": "RPC: aggregate stats for a creator. Zeros public counters for non-owner/non-admin callers when target profile.hide_published_works = true; follower_count always public."
    },
    {
      "name": "get_public_profiles",
      "touches": [
        "profiles"
      ],
      "security": "DEFINER",
      "description": "RPC: minimal public profile chips for a list of user ids. Nulls out username/display_name/avatar when hide_profile_details = true. Anon-callable."
    },
    {
      "name": "get_public_creator_profile",
      "touches": [
        "profiles",
        "published_scenarios",
        "stories",
        "content_themes"
      ],
      "security": "DEFINER",
      "description": "RPC: redacting creator profile + works view. Enforces hide_profile_details and hide_published_works server-side; owner/admin bypass. Anon-callable."
    },
    {
      "name": "get_folders_with_details",
      "touches": [
        "image_folders",
        "library_images"
      ],
      "security": "DEFINER",
      "description": "RPC: folders with thumbnail + image count. Updated 2026-06-14 to also return thumbnail_path (library_images.image_path) for signed-URL minting against the private image_library bucket. BF-13 note (2026-06-19): two overloads exist in the live database — the no-arg overload filtered by auth.uid() (canonical, used by the client) and a deprecated p_user_id uuid overload retained for backward compatibility. No live DB change in Batch A; this entry documents the snapshot inconsistency so future audits do not flag it as drift."
    },
    {
      "name": "save_scenario_atomic",
      "touches": [
        "stories",
        "characters",
        "codex_entries",
        "scenes"
      ],
      "security": "DEFINER",
      "description": "RPC: atomic upsert of story + characters + codex + scenes; ownership-hardened (June 2026) with parent pre-flight, story-update WHERE guard + GET DIAGNOSTICS, and per-row guarded ON CONFLICT DO UPDATE branches for each child table. Updated 2026-06-14: scenes upsert now writes image_path = NULLIF(scene_record->>'image_path','') and ON CONFLICT DO UPDATE keeps it in sync."
    },
    {
      "name": "get_public_art_styles",
      "touches": [
        "art_styles"
      ],
      "security": "DEFINER",
      "description": "RPC added 2026-06-19 (BF-02). Returns only the safe public columns (id, display_name, thumbnail_url, sort_order) from public.art_styles. backend_prompt fields are never returned. EXECUTE granted to anon and authenticated. Source of art-style metadata for the browser; raw art_styles SELECT is admin-only."
    },
    {
      "name": "get_public_app_flags",
      "touches": [
        "app_settings"
      ],
      "security": "DEFINER",
      "description": "RPC added 2026-06-19 (BF-03). Returns a jsonb object containing only whitelisted public setting keys (currently 'shared_keys' and 'nav_button_images'). Other app_settings rows remain admin-only. EXECUTE granted to anon and authenticated."
    },
    {
      "name": "get_my_liked_scenarios",
      "touches": [
        "scenario_likes"
      ],
      "security": "DEFINER",
      "description": "RPC added 2026-06-19 (BF-09). Returns the subset of the supplied published_scenario_ids that the calling user has liked. Lets the gallery hydrate own-like state without a permissive public SELECT on scenario_likes (now own-row + admin only)."
    },
    {
      "name": "can_read_scene_storage_object",
      "touches": [
        "scenes",
        "published_scenarios",
        "profiles"
      ],
      "security": "DEFINER",
      "description": "Predicate added 2026-06-14 to gate SELECT on the private scenes storage bucket. Returns true when caller is the owner folder segment of p_path, OR caller has app_role 'admin', OR p_path matches a public.scenes.image_path whose scenario is published (is_published=true AND is_hidden=false) and whose publisher does not have profiles.hide_published_works=true. Used exclusively by the storage.objects policy 'Owners admins or published scenes can view'."
    },
    {
      "name": "update_updated_at_column",
      "touches": [],
      "security": "INVOKER",
      "description": "Generic trigger: set updated_at = now()"
    },
    {
      "name": "set_updated_at_finance_live_tables",
      "touches": [],
      "security": "INVOKER",
      "description": "Generic trigger: set updated_at for finance tables"
    },
    {
      "name": "get_saved_scenarios_for_user",
      "touches": [
        "saved_scenarios",
        "published_scenarios",
        "stories",
        "profiles"
      ],
      "security": "DEFINER",
      "description": "RPC added 2026-06-19 (BF-11). Returns the current auth.uid()'s saved-scenario cards as a flat row shape (id, ps_*, story_*). Omits moderation/internal fields such as reported_count. Replaces a previous direct-table JOIN read on published_scenarios from the Saved list."
    },
    {
      "name": "get_scenario_moderation_counters",
      "touches": [
        "published_scenarios"
      ],
      "security": "DEFINER",
      "description": "RPC added 2026-06-19 (BF-11). Returns the reported_count for a single published scenario, gated to (publisher_id = auth.uid() OR admin). Backend-ready; no frontend caller today."
    },
    {
      "name": "get_my_submitted_reports",
      "touches": [
        "reports"
      ],
      "security": "DEFINER",
      "description": "RPC added 2026-06-19 (BF-10). Returns the current auth.uid()'s submitted reports as a sanitized projection (id, story_id, reason, status, created_at). Omits note, reviewed_by, accused_user_id, accused, reporter. Backend-ready; no frontend caller today."
    },
    {
      "name": "get_my_account_status",
      "touches": [
        "user_strikes"
      ],
      "security": "DEFINER",
      "description": "RPC added 2026-06-19 (BF-10). Returns an aggregated account-status summary for the current auth.uid() (active_strike_count, total_points, latest_status, latest_falls_off_at). Omits issued_by, note, report_id, reason. Backend-ready; no frontend caller today."
    }
  ],
  "storage_buckets": [
    {
      "name": "avatars",
      "public": true
    },
    {
      "name": "scenes",
      "public": false,
      "notes": "Flipped to private 2026-06-14 (Stage B, qh-sec-20260607-003). SELECT gated by storage policy 'Owners admins or published scenes can view' which calls public.can_read_scene_storage_object(name): owner OR admin OR (image_path matches a published, non-hidden scene whose publisher does not have hide_published_works=true). All reads route through createSignedUrl via src/services/persistence/signed-media.ts."
    },
    {
      "name": "covers",
      "public": true
    },
    {
      "name": "backgrounds",
      "public": true
    },
    {
      "name": "image_library",
      "public": false,
      "notes": "Flipped to private 2026-06-14 (Stage B, qh-sec-20260607-003). SELECT gated by storage policy 'Owners can view own image_library': owner folder segment OR admin. Reads route through createSignedUrl via src/services/persistence/signed-media.ts. library-copy.ts copies bytes into a destination bucket when a library image is reused as a cover/avatar/background/scene."
    },
    {
      "name": "guide_images",
      "public": true,
      "notes": "Public READ remains intentional. Updated 2026-06-19 (BF-14): write/update/delete on the guide_images bucket are now admin-only — legacy 'Authenticated users can upload/delete own guide images' storage policies were replaced by 'Admins can upload/update/delete guide images' (has_role(auth.uid(),'admin'))."
    },
    {
      "name": "finance_documents",
      "public": false
    }
  ],
  "storage_policies": [
    {
      "bucket": "scenes",
      "policy": "Owners admins or published scenes can view",
      "command": "SELECT",
      "expression": "bucket_id = 'scenes' AND can_read_scene_storage_object(name)",
      "added": "2026-06-14",
      "replaces": "Anyone can view scenes",
      "notes": "Replaces the legacy permissive Anyone-can-view-scenes policy. Allows owner, admin, or anonymous reads of scenes attached to a published, non-hidden scenario whose publisher does not hide their works."
    },
    {
      "bucket": "image_library",
      "policy": "Owners can view own image_library",
      "command": "SELECT",
      "expression": "bucket_id = 'image_library' AND ((auth.uid())::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'admin'))",
      "added": "2026-06-14",
      "replaces": "Users can view image_library",
      "notes": "Owner-only (plus admin) SELECT on the private image_library bucket. Anonymous GETs return 400; signed-URL minting requires the owner JWT."
    },
    {
      "bucket": "guide_images",
      "policy": "Admins can upload guide images",
      "command": "INSERT",
      "expression": "bucket_id = 'guide_images' AND has_role(auth.uid(), 'admin')",
      "added": "2026-06-19",
      "replaces": "Authenticated users can upload guide images",
      "notes": "BF-14. Public SELECT on guide_images bucket is unchanged ('Anyone can read guide images')."
    },
    {
      "bucket": "guide_images",
      "policy": "Admins can update guide images",
      "command": "UPDATE",
      "expression": "bucket_id = 'guide_images' AND has_role(auth.uid(), 'admin')",
      "added": "2026-06-19",
      "replaces": null,
      "notes": "BF-14."
    },
    {
      "bucket": "guide_images",
      "policy": "Admins can delete guide images",
      "command": "DELETE",
      "expression": "bucket_id = 'guide_images' AND has_role(auth.uid(), 'admin')",
      "added": "2026-06-19",
      "replaces": "Authenticated users can delete own guide images",
      "notes": "BF-14."
    }
  ],
  "edge_functions": [
    {
      "name": "chat",
      "tables_referenced": [
        "conversations",
        "messages",
        "characters",
        "character_session_states",
        "side_characters",
        "memories",
        "stories",
        "scenes",
        "codex_entries"
      ]
    },
    {
      "name": "extract-memory-events",
      "tables_referenced": [
        "memories",
        "conversations"
      ]
    },
    {
      "name": "extract-character-updates",
      "tables_referenced": [
        "character_session_states",
        "side_characters",
        "conversations"
      ]
    },
    {
      "name": "compress-day-memories",
      "tables_referenced": [
        "memories",
        "conversations"
      ]
    },
    {
      "name": "evaluate-goal-progress",
      "tables_referenced": [
        "characters",
        "character_session_states",
        "conversations"
      ]
    },
    {
      "name": "generate-cover-image",
      "tables_referenced": [
        "stories"
      ]
    },
    {
      "name": "generate-scene-image",
      "tables_referenced": [
        "scenes",
        "stories"
      ]
    },
    {
      "name": "generate-side-character",
      "tables_referenced": [
        "side_characters",
        "conversations"
      ]
    },
    {
      "name": "generate-side-character-avatar",
      "tables_referenced": [
        "side_characters"
      ]
    },
    {
      "name": "track-ai-usage",
      "tables_referenced": [
        "ai_usage_events",
        "ai_usage_test_events",
        "ai_usage_test_sessions"
      ]
    },
    {
      "name": "track-api-usage-test",
      "tables_referenced": [
        "ai_usage_test_events",
        "ai_usage_test_sessions"
      ]
    },
    {
      "name": "api-usage-test-session",
      "tables_referenced": [
        "ai_usage_test_sessions"
      ]
    },
    {
      "name": "admin-ai-usage-summary",
      "tables_referenced": [
        "ai_usage_events"
      ]
    },
    {
      "name": "admin-ai-usage-timeseries",
      "tables_referenced": [
        "ai_usage_events",
        "messages"
      ]
    },
    {
      "name": "admin-api-usage-test-report",
      "tables_referenced": [
        "ai_usage_test_events",
        "ai_usage_test_sessions"
      ]
    },
    {
      "name": "check-shared-keys",
      "tables_referenced": [
        "app_settings"
      ]
    },
    {
      "name": "xai-billing-balance",
      "tables_referenced": []
    },
    {
      "name": "migrate-base64-images",
      "tables_referenced": [
        "characters",
        "side_characters"
      ]
    },
    {
      "name": "sync-guide-to-github",
      "tables_referenced": [
        "guide_documents"
      ]
    }
  ]
} as const;
