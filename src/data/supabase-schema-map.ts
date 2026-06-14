/**
 * Supabase Schema Map — auto-generated typed projection of the live Lovable Cloud schema.
 *
 * Source: live introspection (pg_catalog + storage) at generatedAt.
 * Regenerate: ask Lovable to run the Supabase schema snapshot task; this file
 * mirrors /mnt/documents/supabase-schema-snapshot.json.
 *
 * Contains schema metadata only — no row contents, secrets, PII, or user data.
 * Function definitions (pg_get_functiondef) are included to enable security-definer audits.
 * Items the introspection could not confirm are marked `needs_verification`.
 */

export interface SchemaColumn {
  name: string;
  type: string;
  notNull: boolean;
  default: string | null;
  isIdentity: boolean;
  ordinal: number;
}

export interface SchemaForeignKey {
  name: string;
  columns: string[];
  refSchema: string;
  refTable: string;
  refColumns: string[];
  onUpdate: string;
  onDelete: string;
}

export interface SchemaConstraint {
  name: string;
  columns?: string[];
  expression?: string;
}

export interface SchemaPolicy {
  name: string;
  command: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL' | null;
  permissive: boolean;
  roles: string[] | null;
  using: string | null;
  withCheck: string | null;
}

export interface SchemaGrant {
  grantee: string;
  privileges: string[];
}

export interface SchemaTrigger {
  name: string;
  timing: 'BEFORE' | 'AFTER' | 'INSTEAD OF';
  events: string[];
  function: string;
}

export interface SchemaTable {
  name: string;
  comment: string | null;
  rlsEnabled: boolean;
  approxRowCount: number;
  columns: SchemaColumn[];
  primaryKey: string[] | null;
  foreignKeys: SchemaForeignKey[];
  uniqueConstraints: SchemaConstraint[];
  checkConstraints: SchemaConstraint[];
  policies: SchemaPolicy[];
  grants: SchemaGrant[];
  triggers: SchemaTrigger[];
}

export interface SchemaFunction {
  name: string;
  language: string;
  returnType: string;
  arguments: string;
  securityDefiner: boolean;
  volatility: 'IMMUTABLE' | 'STABLE' | 'VOLATILE';
  config: string[] | null;
  definition: string;
}

export interface SchemaEnum {
  name: string;
  values: string[];
}

export interface SchemaStorageBucket {
  id: string;
  name: string;
  public: boolean;
  fileSizeLimit: number | null;
  allowedMimeTypes: string[] | null;
  createdAt: string;
}

export interface SchemaStoragePolicy {
  name: string;
  command: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL' | null;
  roles: string[] | null;
  using: string | null;
  withCheck: string | null;
}

export interface SchemaEdgeFunction {
  name: string;
  path: string;
  status: 'present' | 'needs_verification';
}

export interface SupabaseSchemaSnapshot {
  generatedAt: string;
  sourceProjectRef: string;
  sourceSchema: string;
  generatorNotes: string;
  tables: SchemaTable[];
  functions: SchemaFunction[];
  enums: SchemaEnum[];
  storage: {
    buckets: SchemaStorageBucket[];
    policies: SchemaStoragePolicy[];
  };
  edgeFunctions: SchemaEdgeFunction[];
  verification: Record<string, number | string | boolean>;
}

export const supabaseSchemaMap: SupabaseSchemaSnapshot = {
  "generatedAt": "2026-06-07T05:49:06.838680Z",
  "sourceProjectRef": "gialzvvswxadxolnwots",
  "sourceSchema": "public",
  "generatorNotes": "Live introspection via psql against Lovable Cloud. Function definitions captured via pg_get_functiondef for security-definer audits. No row contents, secrets, PII, or user data included.",
  "tables": [
    {
      "name": "ad_spend",
      "grants": [
        {
          "grantee": "anon",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "authenticated",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "postgres",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "sandbox_exec",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "sandbox_exec_gialzvvswxadxolnwots",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "service_role",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        }
      ],
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "default": "gen_random_uuid()",
          "notNull": true,
          "ordinal": 1,
          "isIdentity": false
        },
        {
          "name": "platform",
          "type": "text",
          "default": null,
          "notNull": true,
          "ordinal": 2,
          "isIdentity": false
        },
        {
          "name": "campaign_name",
          "type": "text",
          "default": "''::text",
          "notNull": true,
          "ordinal": 3,
          "isIdentity": false
        },
        {
          "name": "amount",
          "type": "numeric(12,2)",
          "default": "0",
          "notNull": true,
          "ordinal": 4,
          "isIdentity": false
        },
        {
          "name": "currency",
          "type": "text",
          "default": "'USD'::text",
          "notNull": true,
          "ordinal": 5,
          "isIdentity": false
        },
        {
          "name": "period_start",
          "type": "date",
          "default": null,
          "notNull": true,
          "ordinal": 6,
          "isIdentity": false
        },
        {
          "name": "period_end",
          "type": "date",
          "default": null,
          "notNull": true,
          "ordinal": 7,
          "isIdentity": false
        },
        {
          "name": "notes",
          "type": "text",
          "default": "''::text",
          "notNull": true,
          "ordinal": 8,
          "isIdentity": false
        },
        {
          "name": "created_by",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 9,
          "isIdentity": false
        },
        {
          "name": "created_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": true,
          "ordinal": 10,
          "isIdentity": false
        },
        {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": true,
          "ordinal": 11,
          "isIdentity": false
        },
        {
          "name": "name",
          "type": "text",
          "default": null,
          "notNull": false,
          "ordinal": 12,
          "isIdentity": false
        },
        {
          "name": "description",
          "type": "text",
          "default": null,
          "notNull": false,
          "ordinal": 13,
          "isIdentity": false
        },
        {
          "name": "url",
          "type": "text",
          "default": null,
          "notNull": false,
          "ordinal": 14,
          "isIdentity": false
        },
        {
          "name": "status",
          "type": "text",
          "default": "'active'::text",
          "notNull": false,
          "ordinal": 15,
          "isIdentity": false
        },
        {
          "name": "recurring_cost",
          "type": "numeric(12,2)",
          "default": "0",
          "notNull": false,
          "ordinal": 16,
          "isIdentity": false
        },
        {
          "name": "cost_cadence",
          "type": "text",
          "default": "'mo'::text",
          "notNull": false,
          "ordinal": 17,
          "isIdentity": false
        },
        {
          "name": "start_date",
          "type": "date",
          "default": null,
          "notNull": false,
          "ordinal": 18,
          "isIdentity": false
        },
        {
          "name": "spent_override",
          "type": "numeric(12,2)",
          "default": null,
          "notNull": false,
          "ordinal": 19,
          "isIdentity": false
        }
      ],
      "comment": null,
      "policies": [
        {
          "name": "Admins can manage ad spend",
          "roles": [
            "authenticated"
          ],
          "using": "has_role(auth.uid(), 'admin'::app_role)",
          "command": "ALL",
          "withCheck": "has_role(auth.uid(), 'admin'::app_role)",
          "permissive": true
        }
      ],
      "triggers": [
        {
          "name": "trg_ad_spend_updated_at",
          "events": [
            "UPDATE"
          ],
          "timing": "BEFORE",
          "function": "set_updated_at_finance_live_tables"
        },
        {
          "name": "update_ad_spend_updated_at",
          "events": [
            "UPDATE"
          ],
          "timing": "BEFORE",
          "function": "update_updated_at_column"
        }
      ],
      "primaryKey": [
        "id"
      ],
      "rlsEnabled": true,
      "foreignKeys": [],
      "approxRowCount": -1,
      "checkConstraints": [],
      "uniqueConstraints": []
    },
    {
      "name": "admin_notes",
      "grants": [
        {
          "grantee": "anon",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "authenticated",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "postgres",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "sandbox_exec",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "sandbox_exec_gialzvvswxadxolnwots",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "service_role",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        }
      ],
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "default": "gen_random_uuid()",
          "notNull": true,
          "ordinal": 1,
          "isIdentity": false
        },
        {
          "name": "content",
          "type": "text",
          "default": "''::text",
          "notNull": true,
          "ordinal": 2,
          "isIdentity": false
        },
        {
          "name": "author_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 3,
          "isIdentity": false
        },
        {
          "name": "created_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": true,
          "ordinal": 4,
          "isIdentity": false
        },
        {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": true,
          "ordinal": 5,
          "isIdentity": false
        },
        {
          "name": "note_key",
          "type": "text",
          "default": null,
          "notNull": false,
          "ordinal": 6,
          "isIdentity": false
        },
        {
          "name": "content_html",
          "type": "text",
          "default": null,
          "notNull": false,
          "ordinal": 7,
          "isIdentity": false
        },
        {
          "name": "updated_by",
          "type": "uuid",
          "default": null,
          "notNull": false,
          "ordinal": 8,
          "isIdentity": false
        }
      ],
      "comment": null,
      "policies": [
        {
          "name": "Admins can manage admin notes",
          "roles": [
            "authenticated"
          ],
          "using": "has_role(auth.uid(), 'admin'::app_role)",
          "command": "ALL",
          "withCheck": "has_role(auth.uid(), 'admin'::app_role)",
          "permissive": true
        }
      ],
      "triggers": [
        {
          "name": "trg_admin_notes_updated_at",
          "events": [
            "UPDATE"
          ],
          "timing": "BEFORE",
          "function": "set_updated_at_finance_live_tables"
        },
        {
          "name": "update_admin_notes_updated_at",
          "events": [
            "UPDATE"
          ],
          "timing": "BEFORE",
          "function": "update_updated_at_column"
        }
      ],
      "primaryKey": [
        "id"
      ],
      "rlsEnabled": true,
      "foreignKeys": [],
      "approxRowCount": -1,
      "checkConstraints": [],
      "uniqueConstraints": []
    },
    {
      "name": "ai_usage_events",
      "grants": [
        {
          "grantee": "anon",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "authenticated",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "postgres",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "sandbox_exec",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "sandbox_exec_gialzvvswxadxolnwots",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "service_role",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        }
      ],
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "default": "gen_random_uuid()",
          "notNull": true,
          "ordinal": 1,
          "isIdentity": false
        },
        {
          "name": "user_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 2,
          "isIdentity": false
        },
        {
          "name": "event_type",
          "type": "text",
          "default": null,
          "notNull": true,
          "ordinal": 3,
          "isIdentity": false
        },
        {
          "name": "event_source",
          "type": "text",
          "default": "'client'::text",
          "notNull": false,
          "ordinal": 4,
          "isIdentity": false
        },
        {
          "name": "event_count",
          "type": "integer",
          "default": "1",
          "notNull": false,
          "ordinal": 5,
          "isIdentity": false
        },
        {
          "name": "metadata",
          "type": "jsonb",
          "default": "'{}'::jsonb",
          "notNull": false,
          "ordinal": 6,
          "isIdentity": false
        },
        {
          "name": "created_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": false,
          "ordinal": 7,
          "isIdentity": false
        }
      ],
      "comment": null,
      "policies": [
        {
          "name": "Admins can read all usage events",
          "roles": [
            "authenticated"
          ],
          "using": "has_role(auth.uid(), 'admin'::app_role)",
          "command": "SELECT",
          "withCheck": null,
          "permissive": true
        },
        {
          "name": "Users can insert their own usage events",
          "roles": [
            "authenticated"
          ],
          "using": null,
          "command": "INSERT",
          "withCheck": "(auth.uid() = user_id)",
          "permissive": true
        }
      ],
      "triggers": [],
      "primaryKey": [
        "id"
      ],
      "rlsEnabled": true,
      "foreignKeys": [],
      "approxRowCount": 1456,
      "checkConstraints": [],
      "uniqueConstraints": []
    },
    {
      "name": "ai_usage_test_events",
      "grants": [
        {
          "grantee": "anon",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "authenticated",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "postgres",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "sandbox_exec",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "sandbox_exec_gialzvvswxadxolnwots",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "service_role",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        }
      ],
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "default": "gen_random_uuid()",
          "notNull": true,
          "ordinal": 1,
          "isIdentity": false
        },
        {
          "name": "session_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 2,
          "isIdentity": false
        },
        {
          "name": "event_type",
          "type": "text",
          "default": "''::text",
          "notNull": true,
          "ordinal": 3,
          "isIdentity": false
        },
        {
          "name": "function_name",
          "type": "text",
          "default": "''::text",
          "notNull": true,
          "ordinal": 4,
          "isIdentity": false
        },
        {
          "name": "payload",
          "type": "jsonb",
          "default": "'{}'::jsonb",
          "notNull": false,
          "ordinal": 5,
          "isIdentity": false
        },
        {
          "name": "response_summary",
          "type": "text",
          "default": "''::text",
          "notNull": false,
          "ordinal": 6,
          "isIdentity": false
        },
        {
          "name": "latency_ms",
          "type": "integer",
          "default": null,
          "notNull": false,
          "ordinal": 7,
          "isIdentity": false
        },
        {
          "name": "status_code",
          "type": "integer",
          "default": null,
          "notNull": false,
          "ordinal": 8,
          "isIdentity": false
        },
        {
          "name": "error_message",
          "type": "text",
          "default": null,
          "notNull": false,
          "ordinal": 9,
          "isIdentity": false
        },
        {
          "name": "created_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": true,
          "ordinal": 10,
          "isIdentity": false
        },
        {
          "name": "user_id",
          "type": "uuid",
          "default": null,
          "notNull": false,
          "ordinal": 11,
          "isIdentity": false
        },
        {
          "name": "event_key",
          "type": "text",
          "default": null,
          "notNull": false,
          "ordinal": 12,
          "isIdentity": false
        },
        {
          "name": "api_call_group",
          "type": "text",
          "default": null,
          "notNull": false,
          "ordinal": 13,
          "isIdentity": false
        },
        {
          "name": "event_source",
          "type": "text",
          "default": "'client'::text",
          "notNull": false,
          "ordinal": 14,
          "isIdentity": false
        },
        {
          "name": "model_id",
          "type": "text",
          "default": null,
          "notNull": false,
          "ordinal": 15,
          "isIdentity": false
        },
        {
          "name": "input_chars",
          "type": "integer",
          "default": "0",
          "notNull": false,
          "ordinal": 16,
          "isIdentity": false
        },
        {
          "name": "output_chars",
          "type": "integer",
          "default": "0",
          "notNull": false,
          "ordinal": 17,
          "isIdentity": false
        },
        {
          "name": "input_tokens_est",
          "type": "integer",
          "default": "0",
          "notNull": false,
          "ordinal": 18,
          "isIdentity": false
        },
        {
          "name": "output_tokens_est",
          "type": "integer",
          "default": "0",
          "notNull": false,
          "ordinal": 19,
          "isIdentity": false
        },
        {
          "name": "total_tokens_est",
          "type": "integer",
          "default": "0",
          "notNull": false,
          "ordinal": 20,
          "isIdentity": false
        },
        {
          "name": "est_cost_usd",
          "type": "numeric(12,6)",
          "default": "0",
          "notNull": false,
          "ordinal": 21,
          "isIdentity": false
        },
        {
          "name": "metadata",
          "type": "jsonb",
          "default": "'{}'::jsonb",
          "notNull": false,
          "ordinal": 22,
          "isIdentity": false
        },
        {
          "name": "status",
          "type": "text",
          "default": "'ok'::text",
          "notNull": false,
          "ordinal": 23,
          "isIdentity": false
        }
      ],
      "comment": null,
      "policies": [
        {
          "name": "Admins can view all test events",
          "roles": [
            "authenticated"
          ],
          "using": "has_role(auth.uid(), 'admin'::app_role)",
          "command": "SELECT",
          "withCheck": null,
          "permissive": true
        },
        {
          "name": "Users can insert own test events",
          "roles": [
            "authenticated"
          ],
          "using": null,
          "command": "INSERT",
          "withCheck": "(auth.uid() = user_id)",
          "permissive": true
        },
        {
          "name": "Users can view own test events",
          "roles": [
            "authenticated"
          ],
          "using": "(auth.uid() = user_id)",
          "command": "SELECT",
          "withCheck": null,
          "permissive": true
        }
      ],
      "triggers": [],
      "primaryKey": [
        "id"
      ],
      "rlsEnabled": true,
      "foreignKeys": [
        {
          "name": "ai_usage_test_events_session_id_fkey",
          "columns": [
            "session_id"
          ],
          "onDelete": "CASCADE",
          "onUpdate": "NO ACTION",
          "refTable": "ai_usage_test_sessions",
          "refSchema": "public",
          "refColumns": [
            "id"
          ]
        }
      ],
      "approxRowCount": 1686,
      "checkConstraints": [],
      "uniqueConstraints": []
    },
    {
      "name": "ai_usage_test_sessions",
      "grants": [
        {
          "grantee": "anon",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "authenticated",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "postgres",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "sandbox_exec",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "sandbox_exec_gialzvvswxadxolnwots",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "service_role",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        }
      ],
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "default": "gen_random_uuid()",
          "notNull": true,
          "ordinal": 1,
          "isIdentity": false
        },
        {
          "name": "user_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 2,
          "isIdentity": false
        },
        {
          "name": "scenario_id",
          "type": "uuid",
          "default": null,
          "notNull": false,
          "ordinal": 3,
          "isIdentity": false
        },
        {
          "name": "scenario_name",
          "type": "text",
          "default": "''::text",
          "notNull": false,
          "ordinal": 4,
          "isIdentity": false
        },
        {
          "name": "conversation_id",
          "type": "uuid",
          "default": null,
          "notNull": false,
          "ordinal": 5,
          "isIdentity": false
        },
        {
          "name": "conversation_name",
          "type": "text",
          "default": "''::text",
          "notNull": false,
          "ordinal": 6,
          "isIdentity": false
        },
        {
          "name": "status",
          "type": "text",
          "default": "'active'::text",
          "notNull": false,
          "ordinal": 7,
          "isIdentity": false
        },
        {
          "name": "started_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": false,
          "ordinal": 8,
          "isIdentity": false
        },
        {
          "name": "ended_at",
          "type": "timestamp with time zone",
          "default": null,
          "notNull": false,
          "ordinal": 9,
          "isIdentity": false
        },
        {
          "name": "metadata",
          "type": "jsonb",
          "default": "'{}'::jsonb",
          "notNull": false,
          "ordinal": 10,
          "isIdentity": false
        },
        {
          "name": "created_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": false,
          "ordinal": 11,
          "isIdentity": false
        },
        {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": false,
          "ordinal": 12,
          "isIdentity": false
        }
      ],
      "comment": null,
      "policies": [
        {
          "name": "Admins can read all test sessions",
          "roles": [
            "authenticated"
          ],
          "using": "has_role(auth.uid(), 'admin'::app_role)",
          "command": "SELECT",
          "withCheck": null,
          "permissive": true
        },
        {
          "name": "Users can manage their own test sessions",
          "roles": [
            "authenticated"
          ],
          "using": "(auth.uid() = user_id)",
          "command": "ALL",
          "withCheck": "(auth.uid() = user_id)",
          "permissive": true
        }
      ],
      "triggers": [],
      "primaryKey": [
        "id"
      ],
      "rlsEnabled": true,
      "foreignKeys": [],
      "approxRowCount": -1,
      "checkConstraints": [],
      "uniqueConstraints": []
    },
    {
      "name": "app_settings",
      "grants": [
        {
          "grantee": "anon",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "authenticated",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "postgres",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "sandbox_exec",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "sandbox_exec_gialzvvswxadxolnwots",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "service_role",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        }
      ],
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "default": "gen_random_uuid()",
          "notNull": true,
          "ordinal": 1,
          "isIdentity": false
        },
        {
          "name": "setting_key",
          "type": "text",
          "default": null,
          "notNull": true,
          "ordinal": 2,
          "isIdentity": false
        },
        {
          "name": "setting_value",
          "type": "jsonb",
          "default": "'{}'::jsonb",
          "notNull": true,
          "ordinal": 3,
          "isIdentity": false
        },
        {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": false,
          "ordinal": 4,
          "isIdentity": false
        },
        {
          "name": "updated_by",
          "type": "uuid",
          "default": null,
          "notNull": false,
          "ordinal": 5,
          "isIdentity": false
        }
      ],
      "comment": null,
      "policies": [
        {
          "name": "Admin can insert settings",
          "roles": [
            "authenticated"
          ],
          "using": null,
          "command": "INSERT",
          "withCheck": "has_role(auth.uid(), 'admin'::app_role)",
          "permissive": true
        },
        {
          "name": "Admin can update settings",
          "roles": [
            "authenticated"
          ],
          "using": "has_role(auth.uid(), 'admin'::app_role)",
          "command": "UPDATE",
          "withCheck": null,
          "permissive": true
        },
        {
          "name": "Anyone authenticated can read settings",
          "roles": [
            "authenticated"
          ],
          "using": "true",
          "command": "SELECT",
          "withCheck": null,
          "permissive": true
        }
      ],
      "triggers": [],
      "primaryKey": [
        "id"
      ],
      "rlsEnabled": true,
      "foreignKeys": [
        {
          "name": "app_settings_updated_by_fkey",
          "columns": [
            "updated_by"
          ],
          "onDelete": "NO ACTION",
          "onUpdate": "NO ACTION",
          "refTable": "users",
          "refSchema": "auth",
          "refColumns": [
            "id"
          ]
        }
      ],
      "approxRowCount": 4,
      "checkConstraints": [],
      "uniqueConstraints": [
        {
          "name": "app_settings_setting_key_key",
          "columns": [
            "setting_key"
          ]
        }
      ]
    },
    {
      "name": "art_styles",
      "grants": [
        {
          "grantee": "anon",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "authenticated",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "postgres",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "sandbox_exec",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "sandbox_exec_gialzvvswxadxolnwots",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "service_role",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        }
      ],
      "columns": [
        {
          "name": "id",
          "type": "text",
          "default": null,
          "notNull": true,
          "ordinal": 1,
          "isIdentity": false
        },
        {
          "name": "display_name",
          "type": "text",
          "default": null,
          "notNull": true,
          "ordinal": 2,
          "isIdentity": false
        },
        {
          "name": "thumbnail_url",
          "type": "text",
          "default": "''::text",
          "notNull": true,
          "ordinal": 3,
          "isIdentity": false
        },
        {
          "name": "backend_prompt",
          "type": "text",
          "default": "''::text",
          "notNull": true,
          "ordinal": 4,
          "isIdentity": false
        },
        {
          "name": "backend_prompt_masculine",
          "type": "text",
          "default": null,
          "notNull": false,
          "ordinal": 5,
          "isIdentity": false
        },
        {
          "name": "backend_prompt_androgynous",
          "type": "text",
          "default": null,
          "notNull": false,
          "ordinal": 6,
          "isIdentity": false
        },
        {
          "name": "sort_order",
          "type": "integer",
          "default": "0",
          "notNull": true,
          "ordinal": 7,
          "isIdentity": false
        },
        {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": true,
          "ordinal": 8,
          "isIdentity": false
        }
      ],
      "comment": null,
      "policies": [
        {
          "name": "Admins can delete art styles",
          "roles": [
            "authenticated"
          ],
          "using": "has_role(auth.uid(), 'admin'::app_role)",
          "command": "DELETE",
          "withCheck": null,
          "permissive": true
        },
        {
          "name": "Admins can insert art styles",
          "roles": [
            "authenticated"
          ],
          "using": null,
          "command": "INSERT",
          "withCheck": "has_role(auth.uid(), 'admin'::app_role)",
          "permissive": true
        },
        {
          "name": "Admins can update art styles",
          "roles": [
            "authenticated"
          ],
          "using": "has_role(auth.uid(), 'admin'::app_role)",
          "command": "UPDATE",
          "withCheck": null,
          "permissive": true
        },
        {
          "name": "Anyone can read art styles",
          "roles": null,
          "using": "true",
          "command": "SELECT",
          "withCheck": null,
          "permissive": true
        }
      ],
      "triggers": [
        {
          "name": "update_art_styles_updated_at",
          "events": [
            "UPDATE"
          ],
          "timing": "BEFORE",
          "function": "update_updated_at_column"
        }
      ],
      "primaryKey": [
        "id"
      ],
      "rlsEnabled": true,
      "foreignKeys": [],
      "approxRowCount": -1,
      "checkConstraints": [],
      "uniqueConstraints": []
    },
    {
      "name": "character_session_states",
      "grants": [
        {
          "grantee": "anon",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "authenticated",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "postgres",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "sandbox_exec",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "sandbox_exec_gialzvvswxadxolnwots",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "service_role",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        }
      ],
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "default": "gen_random_uuid()",
          "notNull": true,
          "ordinal": 1,
          "isIdentity": false
        },
        {
          "name": "character_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 2,
          "isIdentity": false
        },
        {
          "name": "conversation_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 3,
          "isIdentity": false
        },
        {
          "name": "user_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 4,
          "isIdentity": false
        },
        {
          "name": "location",
          "type": "text",
          "default": "''::text",
          "notNull": false,
          "ordinal": 5,
          "isIdentity": false
        },
        {
          "name": "current_mood",
          "type": "text",
          "default": "''::text",
          "notNull": false,
          "ordinal": 6,
          "isIdentity": false
        },
        {
          "name": "physical_appearance",
          "type": "jsonb",
          "default": "'{}'::jsonb",
          "notNull": false,
          "ordinal": 7,
          "isIdentity": false
        },
        {
          "name": "currently_wearing",
          "type": "jsonb",
          "default": "'{}'::jsonb",
          "notNull": false,
          "ordinal": 8,
          "isIdentity": false
        },
        {
          "name": "created_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": false,
          "ordinal": 9,
          "isIdentity": false
        },
        {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": false,
          "ordinal": 10,
          "isIdentity": false
        },
        {
          "name": "name",
          "type": "text",
          "default": null,
          "notNull": false,
          "ordinal": 11,
          "isIdentity": false
        },
        {
          "name": "age",
          "type": "text",
          "default": null,
          "notNull": false,
          "ordinal": 12,
          "isIdentity": false
        },
        {
          "name": "sex_type",
          "type": "text",
          "default": null,
          "notNull": false,
          "ordinal": 13,
          "isIdentity": false
        },
        {
          "name": "role_description",
          "type": "text",
          "default": null,
          "notNull": false,
          "ordinal": 14,
          "isIdentity": false
        },
        {
          "name": "preferred_clothing",
          "type": "jsonb",
          "default": "'{}'::jsonb",
          "notNull": false,
          "ordinal": 15,
          "isIdentity": false
        },
        {
          "name": "custom_sections",
          "type": "jsonb",
          "default": "'[]'::jsonb",
          "notNull": false,
          "ordinal": 16,
          "isIdentity": false
        },
        {
          "name": "avatar_url",
          "type": "text",
          "default": null,
          "notNull": false,
          "ordinal": 17,
          "isIdentity": false
        },
        {
          "name": "avatar_position",
          "type": "jsonb",
          "default": "'{\"x\": 50, \"y\": 50}'::jsonb",
          "notNull": false,
          "ordinal": 18,
          "isIdentity": false
        },
        {
          "name": "controlled_by",
          "type": "text",
          "default": null,
          "notNull": false,
          "ordinal": 19,
          "isIdentity": false
        },
        {
          "name": "character_role",
          "type": "text",
          "default": null,
          "notNull": false,
          "ordinal": 20,
          "isIdentity": false
        },
        {
          "name": "nicknames",
          "type": "text",
          "default": "''::text",
          "notNull": false,
          "ordinal": 21,
          "isIdentity": false
        },
        {
          "name": "goals",
          "type": "jsonb",
          "default": "'[]'::jsonb",
          "notNull": false,
          "ordinal": 22,
          "isIdentity": false
        },
        {
          "name": "previous_names",
          "type": "text[]",
          "default": "'{}'::text[]",
          "notNull": false,
          "ordinal": 23,
          "isIdentity": false
        },
        {
          "name": "background",
          "type": "jsonb",
          "default": null,
          "notNull": false,
          "ordinal": 24,
          "isIdentity": false
        },
        {
          "name": "tone",
          "type": "jsonb",
          "default": null,
          "notNull": false,
          "ordinal": 25,
          "isIdentity": false
        },
        {
          "name": "key_life_events",
          "type": "jsonb",
          "default": null,
          "notNull": false,
          "ordinal": 26,
          "isIdentity": false
        },
        {
          "name": "relationships",
          "type": "jsonb",
          "default": null,
          "notNull": false,
          "ordinal": 27,
          "isIdentity": false
        },
        {
          "name": "secrets",
          "type": "jsonb",
          "default": null,
          "notNull": false,
          "ordinal": 28,
          "isIdentity": false
        },
        {
          "name": "fears",
          "type": "jsonb",
          "default": null,
          "notNull": false,
          "ordinal": 29,
          "isIdentity": false
        },
        {
          "name": "personality",
          "type": "jsonb",
          "default": null,
          "notNull": false,
          "ordinal": 30,
          "isIdentity": false
        },
        {
          "name": "sexual_orientation",
          "type": "text",
          "default": null,
          "notNull": false,
          "ordinal": 31,
          "isIdentity": false
        }
      ],
      "comment": null,
      "policies": [
        {
          "name": "Users can create own session states",
          "roles": null,
          "using": null,
          "command": "INSERT",
          "withCheck": "(auth.uid() = user_id)",
          "permissive": true
        },
        {
          "name": "Users can delete own session states",
          "roles": null,
          "using": "(auth.uid() = user_id)",
          "command": "DELETE",
          "withCheck": null,
          "permissive": true
        },
        {
          "name": "Users can update own session states",
          "roles": null,
          "using": "(auth.uid() = user_id)",
          "command": "UPDATE",
          "withCheck": null,
          "permissive": true
        },
        {
          "name": "Users can view own session states",
          "roles": null,
          "using": "(auth.uid() = user_id)",
          "command": "SELECT",
          "withCheck": null,
          "permissive": true
        }
      ],
      "triggers": [
        {
          "name": "update_character_session_states_updated_at",
          "events": [
            "UPDATE"
          ],
          "timing": "BEFORE",
          "function": "update_updated_at_column"
        }
      ],
      "primaryKey": [
        "id"
      ],
      "rlsEnabled": true,
      "foreignKeys": [
        {
          "name": "character_session_states_character_id_fkey",
          "columns": [
            "character_id"
          ],
          "onDelete": "CASCADE",
          "onUpdate": "NO ACTION",
          "refTable": "characters",
          "refSchema": "public",
          "refColumns": [
            "id"
          ]
        },
        {
          "name": "character_session_states_conversation_id_fkey",
          "columns": [
            "conversation_id"
          ],
          "onDelete": "CASCADE",
          "onUpdate": "NO ACTION",
          "refTable": "conversations",
          "refSchema": "public",
          "refColumns": [
            "id"
          ]
        }
      ],
      "approxRowCount": 11,
      "checkConstraints": [],
      "uniqueConstraints": [
        {
          "name": "character_session_states_character_id_conversation_id_key",
          "columns": [
            "character_id",
            "conversation_id"
          ]
        }
      ]
    },
    {
      "name": "character_state_message_snapshots",
      "grants": [
        {
          "grantee": "anon",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "authenticated",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "postgres",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "sandbox_exec",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "sandbox_exec_gialzvvswxadxolnwots",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "service_role",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        }
      ],
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "default": "gen_random_uuid()",
          "notNull": true,
          "ordinal": 1,
          "isIdentity": false
        },
        {
          "name": "user_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 2,
          "isIdentity": false
        },
        {
          "name": "conversation_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 3,
          "isIdentity": false
        },
        {
          "name": "character_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 4,
          "isIdentity": false
        },
        {
          "name": "source_message_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 5,
          "isIdentity": false
        },
        {
          "name": "source_generation_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 6,
          "isIdentity": false
        },
        {
          "name": "snapshot",
          "type": "jsonb",
          "default": "'{}'::jsonb",
          "notNull": true,
          "ordinal": 7,
          "isIdentity": false
        },
        {
          "name": "created_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": true,
          "ordinal": 8,
          "isIdentity": false
        }
      ],
      "comment": null,
      "policies": [
        {
          "name": "Users can delete own char state snapshots",
          "roles": null,
          "using": "(auth.uid() = user_id)",
          "command": "DELETE",
          "withCheck": null,
          "permissive": true
        },
        {
          "name": "Users can insert own char state snapshots",
          "roles": null,
          "using": null,
          "command": "INSERT",
          "withCheck": "(auth.uid() = user_id)",
          "permissive": true
        },
        {
          "name": "Users can update own char state snapshots",
          "roles": null,
          "using": "(auth.uid() = user_id)",
          "command": "UPDATE",
          "withCheck": null,
          "permissive": true
        },
        {
          "name": "Users can view own char state snapshots",
          "roles": null,
          "using": "(auth.uid() = user_id)",
          "command": "SELECT",
          "withCheck": null,
          "permissive": true
        }
      ],
      "triggers": [],
      "primaryKey": [
        "id"
      ],
      "rlsEnabled": true,
      "foreignKeys": [
        {
          "name": "character_state_message_snapshots_character_id_fkey",
          "columns": [
            "character_id"
          ],
          "onDelete": "CASCADE",
          "onUpdate": "NO ACTION",
          "refTable": "characters",
          "refSchema": "public",
          "refColumns": [
            "id"
          ]
        },
        {
          "name": "character_state_message_snapshots_conversation_id_fkey",
          "columns": [
            "conversation_id"
          ],
          "onDelete": "CASCADE",
          "onUpdate": "NO ACTION",
          "refTable": "conversations",
          "refSchema": "public",
          "refColumns": [
            "id"
          ]
        },
        {
          "name": "character_state_message_snapshots_source_message_id_fkey",
          "columns": [
            "source_message_id"
          ],
          "onDelete": "CASCADE",
          "onUpdate": "NO ACTION",
          "refTable": "messages",
          "refSchema": "public",
          "refColumns": [
            "id"
          ]
        }
      ],
      "approxRowCount": 219,
      "checkConstraints": [],
      "uniqueConstraints": []
    },
    {
      "name": "characters",
      "grants": [
        {
          "grantee": "anon",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "authenticated",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "postgres",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "sandbox_exec",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "sandbox_exec_gialzvvswxadxolnwots",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "service_role",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        }
      ],
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "default": "gen_random_uuid()",
          "notNull": true,
          "ordinal": 1,
          "isIdentity": false
        },
        {
          "name": "user_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 2,
          "isIdentity": false
        },
        {
          "name": "scenario_id",
          "type": "uuid",
          "default": null,
          "notNull": false,
          "ordinal": 3,
          "isIdentity": false
        },
        {
          "name": "name",
          "type": "text",
          "default": "''::text",
          "notNull": true,
          "ordinal": 4,
          "isIdentity": false
        },
        {
          "name": "sex_type",
          "type": "text",
          "default": "''::text",
          "notNull": false,
          "ordinal": 5,
          "isIdentity": false
        },
        {
          "name": "controlled_by",
          "type": "text",
          "default": "'AI'::text",
          "notNull": false,
          "ordinal": 6,
          "isIdentity": false
        },
        {
          "name": "character_role",
          "type": "text",
          "default": "'Main'::text",
          "notNull": false,
          "ordinal": 7,
          "isIdentity": false
        },
        {
          "name": "tags",
          "type": "text",
          "default": "''::text",
          "notNull": false,
          "ordinal": 8,
          "isIdentity": false
        },
        {
          "name": "avatar_url",
          "type": "text",
          "default": "''::text",
          "notNull": false,
          "ordinal": 9,
          "isIdentity": false
        },
        {
          "name": "avatar_position",
          "type": "jsonb",
          "default": "'{\"x\": 50, \"y\": 50}'::jsonb",
          "notNull": false,
          "ordinal": 10,
          "isIdentity": false
        },
        {
          "name": "sections",
          "type": "jsonb",
          "default": "'[]'::jsonb",
          "notNull": false,
          "ordinal": 11,
          "isIdentity": false
        },
        {
          "name": "is_library",
          "type": "boolean",
          "default": "false",
          "notNull": false,
          "ordinal": 12,
          "isIdentity": false
        },
        {
          "name": "created_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": false,
          "ordinal": 13,
          "isIdentity": false
        },
        {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": false,
          "ordinal": 14,
          "isIdentity": false
        },
        {
          "name": "age",
          "type": "text",
          "default": "''::text",
          "notNull": false,
          "ordinal": 15,
          "isIdentity": false
        },
        {
          "name": "location",
          "type": "text",
          "default": "''::text",
          "notNull": false,
          "ordinal": 16,
          "isIdentity": false
        },
        {
          "name": "current_mood",
          "type": "text",
          "default": "''::text",
          "notNull": false,
          "ordinal": 17,
          "isIdentity": false
        },
        {
          "name": "role_description",
          "type": "text",
          "default": "''::text",
          "notNull": false,
          "ordinal": 18,
          "isIdentity": false
        },
        {
          "name": "physical_appearance",
          "type": "jsonb",
          "default": "'{\"build\": \"\", \"height\": \"\", \"makeup\": \"\", \"body_hair\": \"\", \"eye_color\": \"\", \"genitalia\": \"\", \"skin_tone\": \"\", \"hair_color\": \"\", \"breast_size\": \"\", \"body_markings\": \"\", \"temporary_conditions\": \"\"}'::jsonb",
          "notNull": false,
          "ordinal": 19,
          "isIdentity": false
        },
        {
          "name": "currently_wearing",
          "type": "jsonb",
          "default": "'{\"top\": \"\", \"bottom\": \"\", \"miscellaneous\": \"\", \"undergarments\": \"\"}'::jsonb",
          "notNull": false,
          "ordinal": 20,
          "isIdentity": false
        },
        {
          "name": "preferred_clothing",
          "type": "jsonb",
          "default": "'{\"work\": \"\", \"sleep\": \"\", \"casual\": \"\", \"underwear\": \"\", \"miscellaneous\": \"\"}'::jsonb",
          "notNull": false,
          "ordinal": 21,
          "isIdentity": false
        },
        {
          "name": "nicknames",
          "type": "text",
          "default": "''::text",
          "notNull": false,
          "ordinal": 22,
          "isIdentity": false
        },
        {
          "name": "goals",
          "type": "jsonb",
          "default": "'[]'::jsonb",
          "notNull": false,
          "ordinal": 23,
          "isIdentity": false
        },
        {
          "name": "background",
          "type": "jsonb",
          "default": "'{}'::jsonb",
          "notNull": false,
          "ordinal": 24,
          "isIdentity": false
        },
        {
          "name": "tone",
          "type": "jsonb",
          "default": "'{}'::jsonb",
          "notNull": false,
          "ordinal": 25,
          "isIdentity": false
        },
        {
          "name": "key_life_events",
          "type": "jsonb",
          "default": "'{}'::jsonb",
          "notNull": false,
          "ordinal": 26,
          "isIdentity": false
        },
        {
          "name": "relationships",
          "type": "jsonb",
          "default": "'{}'::jsonb",
          "notNull": false,
          "ordinal": 27,
          "isIdentity": false
        },
        {
          "name": "secrets",
          "type": "jsonb",
          "default": "'{}'::jsonb",
          "notNull": false,
          "ordinal": 28,
          "isIdentity": false
        },
        {
          "name": "fears",
          "type": "jsonb",
          "default": "'{}'::jsonb",
          "notNull": false,
          "ordinal": 29,
          "isIdentity": false
        },
        {
          "name": "personality",
          "type": "jsonb",
          "default": null,
          "notNull": false,
          "ordinal": 30,
          "isIdentity": false
        },
        {
          "name": "sexual_orientation",
          "type": "text",
          "default": "''::text",
          "notNull": false,
          "ordinal": 31,
          "isIdentity": false
        }
      ],
      "comment": null,
      "policies": [
        {
          "name": "Users can create own characters",
          "roles": [
            "authenticated"
          ],
          "using": null,
          "command": "INSERT",
          "withCheck": "((auth.uid() = user_id) AND ((scenario_id IS NULL) OR (EXISTS ( SELECT 1\n   FROM stories s\n  WHERE ((s.id = characters.scenario_id) AND (s.user_id = auth.uid()))))))",
          "permissive": true
        },
        {
          "name": "Users can delete own characters",
          "roles": null,
          "using": "(auth.uid() = user_id)",
          "command": "DELETE",
          "withCheck": null,
          "permissive": true
        },
        {
          "name": "Users can update own characters",
          "roles": [
            "authenticated"
          ],
          "using": "(auth.uid() = user_id)",
          "command": "UPDATE",
          "withCheck": "((auth.uid() = user_id) AND ((scenario_id IS NULL) OR (EXISTS ( SELECT 1\n   FROM stories s\n  WHERE ((s.id = characters.scenario_id) AND (s.user_id = auth.uid()))))))",
          "permissive": true
        },
        {
          "name": "Users can view own or published characters",
          "roles": [
            "authenticated"
          ],
          "using": "((auth.uid() = user_id) OR (EXISTS ( SELECT 1\n   FROM published_scenarios ps\n  WHERE ((ps.scenario_id = characters.scenario_id) AND (ps.is_published = true) AND (ps.is_hidden = false)))))",
          "command": "SELECT",
          "withCheck": null,
          "permissive": true
        }
      ],
      "triggers": [
        {
          "name": "update_characters_updated_at",
          "events": [
            "UPDATE"
          ],
          "timing": "BEFORE",
          "function": "update_updated_at_column"
        }
      ],
      "primaryKey": [
        "id"
      ],
      "rlsEnabled": true,
      "foreignKeys": [
        {
          "name": "characters_scenario_id_fkey",
          "columns": [
            "scenario_id"
          ],
          "onDelete": "CASCADE",
          "onUpdate": "NO ACTION",
          "refTable": "stories",
          "refSchema": "public",
          "refColumns": [
            "id"
          ]
        },
        {
          "name": "characters_user_id_fkey",
          "columns": [
            "user_id"
          ],
          "onDelete": "CASCADE",
          "onUpdate": "NO ACTION",
          "refTable": "users",
          "refSchema": "auth",
          "refColumns": [
            "id"
          ]
        }
      ],
      "approxRowCount": 24,
      "checkConstraints": [
        {
          "name": "characters_character_role_check",
          "expression": "CHECK ((character_role = ANY (ARRAY['Main'::text, 'Side'::text])))"
        },
        {
          "name": "characters_controlled_by_check",
          "expression": "CHECK ((controlled_by = ANY (ARRAY['AI'::text, 'User'::text])))"
        }
      ],
      "uniqueConstraints": []
    },
    {
      "name": "codex_entries",
      "grants": [
        {
          "grantee": "anon",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "authenticated",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "postgres",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "sandbox_exec",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "sandbox_exec_gialzvvswxadxolnwots",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "service_role",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        }
      ],
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "default": "gen_random_uuid()",
          "notNull": true,
          "ordinal": 1,
          "isIdentity": false
        },
        {
          "name": "scenario_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 2,
          "isIdentity": false
        },
        {
          "name": "title",
          "type": "text",
          "default": "''::text",
          "notNull": true,
          "ordinal": 3,
          "isIdentity": false
        },
        {
          "name": "body",
          "type": "text",
          "default": "''::text",
          "notNull": false,
          "ordinal": 4,
          "isIdentity": false
        },
        {
          "name": "created_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": false,
          "ordinal": 5,
          "isIdentity": false
        },
        {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": false,
          "ordinal": 6,
          "isIdentity": false
        }
      ],
      "comment": null,
      "policies": [
        {
          "name": "Users can create codex via story",
          "roles": [
            "authenticated"
          ],
          "using": null,
          "command": "INSERT",
          "withCheck": "(EXISTS ( SELECT 1\n   FROM stories\n  WHERE ((stories.id = codex_entries.scenario_id) AND (stories.user_id = auth.uid()))))",
          "permissive": true
        },
        {
          "name": "Users can delete codex via story",
          "roles": [
            "authenticated"
          ],
          "using": "(EXISTS ( SELECT 1\n   FROM stories\n  WHERE ((stories.id = codex_entries.scenario_id) AND (stories.user_id = auth.uid()))))",
          "command": "DELETE",
          "withCheck": null,
          "permissive": true
        },
        {
          "name": "Users can update codex via story",
          "roles": [
            "authenticated"
          ],
          "using": "(EXISTS ( SELECT 1\n   FROM stories\n  WHERE ((stories.id = codex_entries.scenario_id) AND (stories.user_id = auth.uid()))))",
          "command": "UPDATE",
          "withCheck": null,
          "permissive": true
        },
        {
          "name": "Users can view codex via own or published story",
          "roles": [
            "authenticated"
          ],
          "using": "((EXISTS ( SELECT 1\n   FROM stories s\n  WHERE ((s.id = codex_entries.scenario_id) AND (s.user_id = auth.uid())))) OR (EXISTS ( SELECT 1\n   FROM published_scenarios ps\n  WHERE ((ps.scenario_id = codex_entries.scenario_id) AND (ps.is_published = true) AND (ps.is_hidden = false)))))",
          "command": "SELECT",
          "withCheck": null,
          "permissive": true
        }
      ],
      "triggers": [
        {
          "name": "update_codex_entries_updated_at",
          "events": [
            "UPDATE"
          ],
          "timing": "BEFORE",
          "function": "update_updated_at_column"
        }
      ],
      "primaryKey": [
        "id"
      ],
      "rlsEnabled": true,
      "foreignKeys": [
        {
          "name": "codex_entries_scenario_id_fkey",
          "columns": [
            "scenario_id"
          ],
          "onDelete": "CASCADE",
          "onUpdate": "NO ACTION",
          "refTable": "stories",
          "refSchema": "public",
          "refColumns": [
            "id"
          ]
        }
      ],
      "approxRowCount": -1,
      "checkConstraints": [],
      "uniqueConstraints": []
    },
    {
      "name": "content_themes",
      "grants": [
        {
          "grantee": "anon",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "authenticated",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "postgres",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "sandbox_exec",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "sandbox_exec_gialzvvswxadxolnwots",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "service_role",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        }
      ],
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "default": "gen_random_uuid()",
          "notNull": true,
          "ordinal": 1,
          "isIdentity": false
        },
        {
          "name": "scenario_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 2,
          "isIdentity": false
        },
        {
          "name": "character_types",
          "type": "text[]",
          "default": "'{}'::text[]",
          "notNull": false,
          "ordinal": 3,
          "isIdentity": false
        },
        {
          "name": "story_type",
          "type": "text",
          "default": null,
          "notNull": false,
          "ordinal": 4,
          "isIdentity": false
        },
        {
          "name": "genres",
          "type": "text[]",
          "default": "'{}'::text[]",
          "notNull": false,
          "ordinal": 5,
          "isIdentity": false
        },
        {
          "name": "origin",
          "type": "text[]",
          "default": "'{}'::text[]",
          "notNull": false,
          "ordinal": 6,
          "isIdentity": false
        },
        {
          "name": "trigger_warnings",
          "type": "text[]",
          "default": "'{}'::text[]",
          "notNull": false,
          "ordinal": 7,
          "isIdentity": false
        },
        {
          "name": "custom_tags",
          "type": "text[]",
          "default": "'{}'::text[]",
          "notNull": false,
          "ordinal": 8,
          "isIdentity": false
        },
        {
          "name": "created_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": false,
          "ordinal": 9,
          "isIdentity": false
        },
        {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": false,
          "ordinal": 10,
          "isIdentity": false
        }
      ],
      "comment": null,
      "policies": [
        {
          "name": "Anyone can view published story themes",
          "roles": [
            "authenticated"
          ],
          "using": "(EXISTS ( SELECT 1\n   FROM published_scenarios ps\n  WHERE ((ps.scenario_id = content_themes.scenario_id) AND (ps.is_published = true) AND (ps.is_hidden = false))))",
          "command": "SELECT",
          "withCheck": null,
          "permissive": true
        },
        {
          "name": "Users can CRUD own story themes",
          "roles": [
            "authenticated"
          ],
          "using": "(EXISTS ( SELECT 1\n   FROM stories s\n  WHERE ((s.id = content_themes.scenario_id) AND (s.user_id = auth.uid()))))",
          "command": "ALL",
          "withCheck": "(EXISTS ( SELECT 1\n   FROM stories s\n  WHERE ((s.id = content_themes.scenario_id) AND (s.user_id = auth.uid()))))",
          "permissive": true
        }
      ],
      "triggers": [
        {
          "name": "update_content_themes_updated_at",
          "events": [
            "UPDATE"
          ],
          "timing": "BEFORE",
          "function": "update_updated_at_column"
        }
      ],
      "primaryKey": [
        "id"
      ],
      "rlsEnabled": true,
      "foreignKeys": [
        {
          "name": "content_themes_scenario_id_fkey",
          "columns": [
            "scenario_id"
          ],
          "onDelete": "CASCADE",
          "onUpdate": "NO ACTION",
          "refTable": "stories",
          "refSchema": "public",
          "refColumns": [
            "id"
          ]
        }
      ],
      "approxRowCount": 5,
      "checkConstraints": [],
      "uniqueConstraints": [
        {
          "name": "content_themes_scenario_id_key",
          "columns": [
            "scenario_id"
          ]
        }
      ]
    },
    {
      "name": "conversation_api_call_traces",
      "grants": [
        {
          "grantee": "anon",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "authenticated",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "postgres",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "sandbox_exec",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "sandbox_exec_gialzvvswxadxolnwots",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "service_role",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        }
      ],
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "default": "gen_random_uuid()",
          "notNull": true,
          "ordinal": 1,
          "isIdentity": false
        },
        {
          "name": "user_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 2,
          "isIdentity": false
        },
        {
          "name": "conversation_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 3,
          "isIdentity": false
        },
        {
          "name": "source_message_id",
          "type": "uuid",
          "default": null,
          "notNull": false,
          "ordinal": 4,
          "isIdentity": false
        },
        {
          "name": "source_generation_id",
          "type": "uuid",
          "default": null,
          "notNull": false,
          "ordinal": 5,
          "isIdentity": false
        },
        {
          "name": "call_type",
          "type": "text",
          "default": null,
          "notNull": true,
          "ordinal": 6,
          "isIdentity": false
        },
        {
          "name": "status",
          "type": "text",
          "default": "'ok'::text",
          "notNull": true,
          "ordinal": 7,
          "isIdentity": false
        },
        {
          "name": "request_payload",
          "type": "jsonb",
          "default": null,
          "notNull": false,
          "ordinal": 8,
          "isIdentity": false
        },
        {
          "name": "response_payload",
          "type": "jsonb",
          "default": null,
          "notNull": false,
          "ordinal": 9,
          "isIdentity": false
        },
        {
          "name": "parsed_output",
          "type": "jsonb",
          "default": null,
          "notNull": false,
          "ordinal": 10,
          "isIdentity": false
        },
        {
          "name": "applied_changes",
          "type": "jsonb",
          "default": null,
          "notNull": false,
          "ordinal": 11,
          "isIdentity": false
        },
        {
          "name": "error",
          "type": "text",
          "default": null,
          "notNull": false,
          "ordinal": 12,
          "isIdentity": false
        },
        {
          "name": "created_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": true,
          "ordinal": 13,
          "isIdentity": false
        }
      ],
      "comment": null,
      "policies": [
        {
          "name": "Users can delete own conversation api call traces",
          "roles": null,
          "using": "(( SELECT auth.uid() AS uid) = user_id)",
          "command": "DELETE",
          "withCheck": null,
          "permissive": true
        },
        {
          "name": "Users can insert own conversation api call traces",
          "roles": null,
          "using": null,
          "command": "INSERT",
          "withCheck": "(( SELECT auth.uid() AS uid) = user_id)",
          "permissive": true
        },
        {
          "name": "Users can view own conversation api call traces",
          "roles": null,
          "using": "(( SELECT auth.uid() AS uid) = user_id)",
          "command": "SELECT",
          "withCheck": null,
          "permissive": true
        }
      ],
      "triggers": [],
      "primaryKey": [
        "id"
      ],
      "rlsEnabled": true,
      "foreignKeys": [
        {
          "name": "conversation_api_call_traces_conversation_id_fkey",
          "columns": [
            "conversation_id"
          ],
          "onDelete": "CASCADE",
          "onUpdate": "NO ACTION",
          "refTable": "conversations",
          "refSchema": "public",
          "refColumns": [
            "id"
          ]
        },
        {
          "name": "conversation_api_call_traces_source_message_id_fkey",
          "columns": [
            "source_message_id"
          ],
          "onDelete": "CASCADE",
          "onUpdate": "NO ACTION",
          "refTable": "messages",
          "refSchema": "public",
          "refColumns": [
            "id"
          ]
        }
      ],
      "approxRowCount": -1,
      "checkConstraints": [
        {
          "name": "conversation_api_call_traces_call_type_check",
          "expression": "CHECK ((call_type = ANY (ARRAY['api_call_1_generation'::text, 'post_turn_state_sync'::text, 'memory_extraction'::text, 'world_state_sync'::text, 'side_character_generation'::text, 'avatar_prompt_generation'::text])))"
        },
        {
          "name": "conversation_api_call_traces_status_check",
          "expression": "CHECK ((status = ANY (ARRAY['ok'::text, 'skipped'::text, 'error'::text])))"
        }
      ],
      "uniqueConstraints": []
    },
    {
      "name": "conversation_dialog_debug_comments",
      "grants": [
        {
          "grantee": "anon",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "authenticated",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "postgres",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "sandbox_exec",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "sandbox_exec_gialzvvswxadxolnwots",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "service_role",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        }
      ],
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "default": "gen_random_uuid()",
          "notNull": true,
          "ordinal": 1,
          "isIdentity": false
        },
        {
          "name": "user_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 2,
          "isIdentity": false
        },
        {
          "name": "conversation_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 3,
          "isIdentity": false
        },
        {
          "name": "message_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 4,
          "isIdentity": false
        },
        {
          "name": "generation_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 5,
          "isIdentity": false
        },
        {
          "name": "note",
          "type": "text",
          "default": "''::text",
          "notNull": true,
          "ordinal": 6,
          "isIdentity": false
        },
        {
          "name": "tags",
          "type": "text[]",
          "default": "'{}'::text[]",
          "notNull": true,
          "ordinal": 7,
          "isIdentity": false
        },
        {
          "name": "created_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": true,
          "ordinal": 8,
          "isIdentity": false
        },
        {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": true,
          "ordinal": 9,
          "isIdentity": false
        }
      ],
      "comment": null,
      "policies": [
        {
          "name": "Users can delete own conversation dialog debug comments",
          "roles": null,
          "using": "(auth.uid() = user_id)",
          "command": "DELETE",
          "withCheck": null,
          "permissive": true
        },
        {
          "name": "Users can insert own conversation dialog debug comments",
          "roles": null,
          "using": null,
          "command": "INSERT",
          "withCheck": "(auth.uid() = user_id)",
          "permissive": true
        },
        {
          "name": "Users can update own conversation dialog debug comments",
          "roles": null,
          "using": "(auth.uid() = user_id)",
          "command": "UPDATE",
          "withCheck": "(auth.uid() = user_id)",
          "permissive": true
        },
        {
          "name": "Users can view own conversation dialog debug comments",
          "roles": null,
          "using": "(auth.uid() = user_id)",
          "command": "SELECT",
          "withCheck": null,
          "permissive": true
        }
      ],
      "triggers": [
        {
          "name": "update_conversation_dialog_debug_comments_updated_at",
          "events": [
            "UPDATE"
          ],
          "timing": "BEFORE",
          "function": "update_updated_at_column"
        }
      ],
      "primaryKey": [
        "id"
      ],
      "rlsEnabled": true,
      "foreignKeys": [
        {
          "name": "conversation_dialog_debug_comments_conversation_id_fkey",
          "columns": [
            "conversation_id"
          ],
          "onDelete": "CASCADE",
          "onUpdate": "NO ACTION",
          "refTable": "conversations",
          "refSchema": "public",
          "refColumns": [
            "id"
          ]
        },
        {
          "name": "conversation_dialog_debug_comments_message_id_fkey",
          "columns": [
            "message_id"
          ],
          "onDelete": "CASCADE",
          "onUpdate": "NO ACTION",
          "refTable": "messages",
          "refSchema": "public",
          "refColumns": [
            "id"
          ]
        }
      ],
      "approxRowCount": 68,
      "checkConstraints": [],
      "uniqueConstraints": []
    },
    {
      "name": "conversation_state_change_events",
      "grants": [
        {
          "grantee": "anon",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "authenticated",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "postgres",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "sandbox_exec",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "sandbox_exec_gialzvvswxadxolnwots",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "service_role",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        }
      ],
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "default": "gen_random_uuid()",
          "notNull": true,
          "ordinal": 1,
          "isIdentity": false
        },
        {
          "name": "user_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 2,
          "isIdentity": false
        },
        {
          "name": "conversation_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 3,
          "isIdentity": false
        },
        {
          "name": "source_message_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 4,
          "isIdentity": false
        },
        {
          "name": "source_generation_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 5,
          "isIdentity": false
        },
        {
          "name": "entity_type",
          "type": "text",
          "default": null,
          "notNull": true,
          "ordinal": 6,
          "isIdentity": false
        },
        {
          "name": "entity_id",
          "type": "text",
          "default": null,
          "notNull": false,
          "ordinal": 7,
          "isIdentity": false
        },
        {
          "name": "entity_name",
          "type": "text",
          "default": null,
          "notNull": false,
          "ordinal": 8,
          "isIdentity": false
        },
        {
          "name": "field_path",
          "type": "text",
          "default": null,
          "notNull": true,
          "ordinal": 9,
          "isIdentity": false
        },
        {
          "name": "previous_value_preview",
          "type": "text",
          "default": null,
          "notNull": false,
          "ordinal": 10,
          "isIdentity": false
        },
        {
          "name": "next_value_preview",
          "type": "text",
          "default": null,
          "notNull": false,
          "ordinal": 11,
          "isIdentity": false
        },
        {
          "name": "story_day",
          "type": "integer",
          "default": null,
          "notNull": false,
          "ordinal": 12,
          "isIdentity": false
        },
        {
          "name": "time_of_day",
          "type": "text",
          "default": null,
          "notNull": false,
          "ordinal": 13,
          "isIdentity": false
        },
        {
          "name": "change_summary",
          "type": "text",
          "default": null,
          "notNull": false,
          "ordinal": 14,
          "isIdentity": false
        },
        {
          "name": "call_type",
          "type": "text",
          "default": "'post_turn_state_sync'::text",
          "notNull": true,
          "ordinal": 15,
          "isIdentity": false
        },
        {
          "name": "created_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": true,
          "ordinal": 16,
          "isIdentity": false
        }
      ],
      "comment": null,
      "policies": [
        {
          "name": "Users can delete own conversation state change events",
          "roles": null,
          "using": "(( SELECT auth.uid() AS uid) = user_id)",
          "command": "DELETE",
          "withCheck": null,
          "permissive": true
        },
        {
          "name": "Users can insert own conversation state change events",
          "roles": null,
          "using": null,
          "command": "INSERT",
          "withCheck": "(( SELECT auth.uid() AS uid) = user_id)",
          "permissive": true
        },
        {
          "name": "Users can view own conversation state change events",
          "roles": null,
          "using": "(( SELECT auth.uid() AS uid) = user_id)",
          "command": "SELECT",
          "withCheck": null,
          "permissive": true
        }
      ],
      "triggers": [],
      "primaryKey": [
        "id"
      ],
      "rlsEnabled": true,
      "foreignKeys": [
        {
          "name": "conversation_state_change_events_conversation_id_fkey",
          "columns": [
            "conversation_id"
          ],
          "onDelete": "CASCADE",
          "onUpdate": "NO ACTION",
          "refTable": "conversations",
          "refSchema": "public",
          "refColumns": [
            "id"
          ]
        },
        {
          "name": "conversation_state_change_events_source_message_id_fkey",
          "columns": [
            "source_message_id"
          ],
          "onDelete": "CASCADE",
          "onUpdate": "NO ACTION",
          "refTable": "messages",
          "refSchema": "public",
          "refColumns": [
            "id"
          ]
        }
      ],
      "approxRowCount": -1,
      "checkConstraints": [
        {
          "name": "conversation_state_change_events_entity_type_check",
          "expression": "CHECK ((entity_type = ANY (ARRAY['character'::text, 'side_character'::text, 'world'::text, 'story_goal'::text, 'memory'::text])))"
        }
      ],
      "uniqueConstraints": []
    },
    {
      "name": "conversation_world_state_snapshots",
      "grants": [
        {
          "grantee": "anon",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "authenticated",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "postgres",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "sandbox_exec",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "sandbox_exec_gialzvvswxadxolnwots",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "service_role",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        }
      ],
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "default": "gen_random_uuid()",
          "notNull": true,
          "ordinal": 1,
          "isIdentity": false
        },
        {
          "name": "user_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 2,
          "isIdentity": false
        },
        {
          "name": "conversation_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 3,
          "isIdentity": false
        },
        {
          "name": "source_message_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 4,
          "isIdentity": false
        },
        {
          "name": "source_generation_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 5,
          "isIdentity": false
        },
        {
          "name": "snapshot",
          "type": "jsonb",
          "default": "'{}'::jsonb",
          "notNull": true,
          "ordinal": 6,
          "isIdentity": false
        },
        {
          "name": "created_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": true,
          "ordinal": 7,
          "isIdentity": false
        },
        {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": true,
          "ordinal": 8,
          "isIdentity": false
        }
      ],
      "comment": null,
      "policies": [
        {
          "name": "Users can delete own conversation world state snapshots",
          "roles": null,
          "using": "(( SELECT auth.uid() AS uid) = user_id)",
          "command": "DELETE",
          "withCheck": null,
          "permissive": true
        },
        {
          "name": "Users can insert own conversation world state snapshots",
          "roles": null,
          "using": null,
          "command": "INSERT",
          "withCheck": "(( SELECT auth.uid() AS uid) = user_id)",
          "permissive": true
        },
        {
          "name": "Users can update own conversation world state snapshots",
          "roles": null,
          "using": "(( SELECT auth.uid() AS uid) = user_id)",
          "command": "UPDATE",
          "withCheck": "(( SELECT auth.uid() AS uid) = user_id)",
          "permissive": true
        },
        {
          "name": "Users can view own conversation world state snapshots",
          "roles": null,
          "using": "(( SELECT auth.uid() AS uid) = user_id)",
          "command": "SELECT",
          "withCheck": null,
          "permissive": true
        }
      ],
      "triggers": [
        {
          "name": "update_conversation_world_state_snapshots_updated_at",
          "events": [
            "UPDATE"
          ],
          "timing": "BEFORE",
          "function": "update_updated_at_column"
        }
      ],
      "primaryKey": [
        "id"
      ],
      "rlsEnabled": true,
      "foreignKeys": [
        {
          "name": "conversation_world_state_snapshots_conversation_id_fkey",
          "columns": [
            "conversation_id"
          ],
          "onDelete": "CASCADE",
          "onUpdate": "NO ACTION",
          "refTable": "conversations",
          "refSchema": "public",
          "refColumns": [
            "id"
          ]
        },
        {
          "name": "conversation_world_state_snapshots_source_message_id_fkey",
          "columns": [
            "source_message_id"
          ],
          "onDelete": "CASCADE",
          "onUpdate": "NO ACTION",
          "refTable": "messages",
          "refSchema": "public",
          "refColumns": [
            "id"
          ]
        }
      ],
      "approxRowCount": -1,
      "checkConstraints": [],
      "uniqueConstraints": [
        {
          "name": "conversation_world_state_snap_conversation_id_source_messag_key",
          "columns": [
            "conversation_id",
            "source_message_id",
            "source_generation_id"
          ]
        }
      ]
    },
    {
      "name": "conversations",
      "grants": [
        {
          "grantee": "anon",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "authenticated",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "postgres",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "sandbox_exec",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "sandbox_exec_gialzvvswxadxolnwots",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "service_role",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        }
      ],
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "default": "gen_random_uuid()",
          "notNull": true,
          "ordinal": 1,
          "isIdentity": false
        },
        {
          "name": "user_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 2,
          "isIdentity": false
        },
        {
          "name": "scenario_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 3,
          "isIdentity": false
        },
        {
          "name": "title",
          "type": "text",
          "default": "'Story Session'::text",
          "notNull": true,
          "ordinal": 4,
          "isIdentity": false
        },
        {
          "name": "created_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": false,
          "ordinal": 5,
          "isIdentity": false
        },
        {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": false,
          "ordinal": 6,
          "isIdentity": false
        },
        {
          "name": "current_day",
          "type": "integer",
          "default": "1",
          "notNull": false,
          "ordinal": 7,
          "isIdentity": false
        },
        {
          "name": "current_time_of_day",
          "type": "text",
          "default": "'day'::text",
          "notNull": false,
          "ordinal": 8,
          "isIdentity": false
        },
        {
          "name": "time_progression_mode",
          "type": "text",
          "default": "'manual'::text",
          "notNull": true,
          "ordinal": 9,
          "isIdentity": false
        },
        {
          "name": "time_progression_interval",
          "type": "integer",
          "default": "15",
          "notNull": true,
          "ordinal": 10,
          "isIdentity": false
        },
        {
          "name": "time_remaining",
          "type": "integer",
          "default": null,
          "notNull": false,
          "ordinal": 11,
          "isIdentity": false
        }
      ],
      "comment": null,
      "policies": [
        {
          "name": "Users can create own conversations",
          "roles": null,
          "using": null,
          "command": "INSERT",
          "withCheck": "(auth.uid() = user_id)",
          "permissive": true
        },
        {
          "name": "Users can delete own conversations",
          "roles": null,
          "using": "(auth.uid() = user_id)",
          "command": "DELETE",
          "withCheck": null,
          "permissive": true
        },
        {
          "name": "Users can update own conversations",
          "roles": null,
          "using": "(auth.uid() = user_id)",
          "command": "UPDATE",
          "withCheck": null,
          "permissive": true
        },
        {
          "name": "Users can view own conversations",
          "roles": null,
          "using": "(auth.uid() = user_id)",
          "command": "SELECT",
          "withCheck": null,
          "permissive": true
        }
      ],
      "triggers": [
        {
          "name": "update_conversations_updated_at",
          "events": [
            "UPDATE"
          ],
          "timing": "BEFORE",
          "function": "update_updated_at_column"
        }
      ],
      "primaryKey": [
        "id"
      ],
      "rlsEnabled": true,
      "foreignKeys": [
        {
          "name": "conversations_scenario_id_fkey",
          "columns": [
            "scenario_id"
          ],
          "onDelete": "CASCADE",
          "onUpdate": "NO ACTION",
          "refTable": "stories",
          "refSchema": "public",
          "refColumns": [
            "id"
          ]
        },
        {
          "name": "conversations_user_id_fkey",
          "columns": [
            "user_id"
          ],
          "onDelete": "CASCADE",
          "onUpdate": "NO ACTION",
          "refTable": "users",
          "refSchema": "auth",
          "refColumns": [
            "id"
          ]
        }
      ],
      "approxRowCount": 83,
      "checkConstraints": [],
      "uniqueConstraints": []
    },
    {
      "name": "creator_follows",
      "grants": [
        {
          "grantee": "anon",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "authenticated",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "postgres",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "sandbox_exec",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "sandbox_exec_gialzvvswxadxolnwots",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "service_role",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        }
      ],
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "default": "gen_random_uuid()",
          "notNull": true,
          "ordinal": 1,
          "isIdentity": false
        },
        {
          "name": "follower_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 2,
          "isIdentity": false
        },
        {
          "name": "creator_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 3,
          "isIdentity": false
        },
        {
          "name": "created_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": false,
          "ordinal": 4,
          "isIdentity": false
        }
      ],
      "comment": null,
      "policies": [
        {
          "name": "Users can follow creators",
          "roles": [
            "authenticated"
          ],
          "using": null,
          "command": "INSERT",
          "withCheck": "((follower_id = auth.uid()) AND (creator_id <> auth.uid()))",
          "permissive": true
        },
        {
          "name": "Users can unfollow",
          "roles": [
            "authenticated"
          ],
          "using": "(follower_id = auth.uid())",
          "command": "DELETE",
          "withCheck": null,
          "permissive": true
        },
        {
          "name": "Users can view own follows",
          "roles": [
            "authenticated"
          ],
          "using": "(follower_id = auth.uid())",
          "command": "SELECT",
          "withCheck": null,
          "permissive": true
        }
      ],
      "triggers": [],
      "primaryKey": [
        "id"
      ],
      "rlsEnabled": true,
      "foreignKeys": [],
      "approxRowCount": -1,
      "checkConstraints": [],
      "uniqueConstraints": [
        {
          "name": "creator_follows_follower_id_creator_id_key",
          "columns": [
            "follower_id",
            "creator_id"
          ]
        }
      ]
    },
    {
      "name": "finance_documents",
      "grants": [
        {
          "grantee": "anon",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "authenticated",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "postgres",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "sandbox_exec",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "sandbox_exec_gialzvvswxadxolnwots",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "service_role",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        }
      ],
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "default": "gen_random_uuid()",
          "notNull": true,
          "ordinal": 1,
          "isIdentity": false
        },
        {
          "name": "uploaded_by",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 2,
          "isIdentity": false
        },
        {
          "name": "file_name",
          "type": "text",
          "default": null,
          "notNull": true,
          "ordinal": 3,
          "isIdentity": false
        },
        {
          "name": "storage_path",
          "type": "text",
          "default": null,
          "notNull": true,
          "ordinal": 4,
          "isIdentity": false
        },
        {
          "name": "mime_type",
          "type": "text",
          "default": null,
          "notNull": true,
          "ordinal": 5,
          "isIdentity": false
        },
        {
          "name": "size_bytes",
          "type": "bigint",
          "default": null,
          "notNull": true,
          "ordinal": 6,
          "isIdentity": false
        },
        {
          "name": "category",
          "type": "text",
          "default": "'Uncategorized'::text",
          "notNull": true,
          "ordinal": 7,
          "isIdentity": false
        },
        {
          "name": "note",
          "type": "text",
          "default": "''::text",
          "notNull": true,
          "ordinal": 8,
          "isIdentity": false
        },
        {
          "name": "created_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": true,
          "ordinal": 9,
          "isIdentity": false
        },
        {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": true,
          "ordinal": 10,
          "isIdentity": false
        }
      ],
      "comment": null,
      "policies": [
        {
          "name": "Admins can manage finance documents",
          "roles": [
            "authenticated"
          ],
          "using": "has_role(auth.uid(), 'admin'::app_role)",
          "command": "ALL",
          "withCheck": "has_role(auth.uid(), 'admin'::app_role)",
          "permissive": true
        }
      ],
      "triggers": [
        {
          "name": "update_finance_documents_updated_at",
          "events": [
            "UPDATE"
          ],
          "timing": "BEFORE",
          "function": "update_updated_at_column"
        }
      ],
      "primaryKey": [
        "id"
      ],
      "rlsEnabled": true,
      "foreignKeys": [],
      "approxRowCount": -1,
      "checkConstraints": [],
      "uniqueConstraints": [
        {
          "name": "finance_documents_storage_path_key",
          "columns": [
            "storage_path"
          ]
        }
      ]
    },
    {
      "name": "goal_alignment_states",
      "grants": [
        {
          "grantee": "anon",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "authenticated",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "postgres",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "sandbox_exec",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "sandbox_exec_gialzvvswxadxolnwots",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "service_role",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        }
      ],
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "default": "gen_random_uuid()",
          "notNull": true,
          "ordinal": 1,
          "isIdentity": false
        },
        {
          "name": "user_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 2,
          "isIdentity": false
        },
        {
          "name": "conversation_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 3,
          "isIdentity": false
        },
        {
          "name": "goal_kind",
          "type": "text",
          "default": null,
          "notNull": true,
          "ordinal": 4,
          "isIdentity": false
        },
        {
          "name": "character_id",
          "type": "uuid",
          "default": null,
          "notNull": false,
          "ordinal": 5,
          "isIdentity": false
        },
        {
          "name": "character_scope_id",
          "type": "uuid",
          "default": "'00000000-0000-0000-0000-000000000000'::uuid",
          "notNull": true,
          "ordinal": 6,
          "isIdentity": false
        },
        {
          "name": "goal_id",
          "type": "text",
          "default": null,
          "notNull": true,
          "ordinal": 7,
          "isIdentity": false
        },
        {
          "name": "score",
          "type": "integer",
          "default": "50",
          "notNull": true,
          "ordinal": 8,
          "isIdentity": false
        },
        {
          "name": "status",
          "type": "text",
          "default": "'active'::text",
          "notNull": true,
          "ordinal": 9,
          "isIdentity": false
        },
        {
          "name": "trend",
          "type": "text",
          "default": "'stable'::text",
          "notNull": true,
          "ordinal": 10,
          "isIdentity": false
        },
        {
          "name": "support_count",
          "type": "integer",
          "default": "0",
          "notNull": true,
          "ordinal": 11,
          "isIdentity": false
        },
        {
          "name": "resistance_count",
          "type": "integer",
          "default": "0",
          "notNull": true,
          "ordinal": 12,
          "isIdentity": false
        },
        {
          "name": "drift_count",
          "type": "integer",
          "default": "0",
          "notNull": true,
          "ordinal": 13,
          "isIdentity": false
        },
        {
          "name": "last_signal",
          "type": "text",
          "default": "'not_applicable'::text",
          "notNull": true,
          "ordinal": 14,
          "isIdentity": false
        },
        {
          "name": "last_rationale",
          "type": "text",
          "default": null,
          "notNull": false,
          "ordinal": 15,
          "isIdentity": false
        },
        {
          "name": "last_evaluated_at",
          "type": "timestamp with time zone",
          "default": null,
          "notNull": false,
          "ordinal": 16,
          "isIdentity": false
        },
        {
          "name": "last_evaluated_day",
          "type": "integer",
          "default": null,
          "notNull": false,
          "ordinal": 17,
          "isIdentity": false
        },
        {
          "name": "last_evaluated_time_of_day",
          "type": "text",
          "default": null,
          "notNull": false,
          "ordinal": 18,
          "isIdentity": false
        },
        {
          "name": "source_message_id",
          "type": "uuid",
          "default": null,
          "notNull": false,
          "ordinal": 19,
          "isIdentity": false
        },
        {
          "name": "source_generation_id",
          "type": "uuid",
          "default": null,
          "notNull": false,
          "ordinal": 20,
          "isIdentity": false
        },
        {
          "name": "previous_state",
          "type": "jsonb",
          "default": null,
          "notNull": false,
          "ordinal": 21,
          "isIdentity": false
        },
        {
          "name": "created_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": true,
          "ordinal": 22,
          "isIdentity": false
        },
        {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": true,
          "ordinal": 23,
          "isIdentity": false
        }
      ],
      "comment": null,
      "policies": [
        {
          "name": "Users can delete own goal alignment states",
          "roles": null,
          "using": "((( SELECT auth.uid() AS uid) = user_id) AND (EXISTS ( SELECT 1\n   FROM conversations c\n  WHERE ((c.id = goal_alignment_states.conversation_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))))",
          "command": "DELETE",
          "withCheck": null,
          "permissive": true
        },
        {
          "name": "Users can insert own goal alignment states",
          "roles": null,
          "using": null,
          "command": "INSERT",
          "withCheck": "((( SELECT auth.uid() AS uid) = user_id) AND (EXISTS ( SELECT 1\n   FROM conversations c\n  WHERE ((c.id = goal_alignment_states.conversation_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))))",
          "permissive": true
        },
        {
          "name": "Users can update own goal alignment states",
          "roles": null,
          "using": "((( SELECT auth.uid() AS uid) = user_id) AND (EXISTS ( SELECT 1\n   FROM conversations c\n  WHERE ((c.id = goal_alignment_states.conversation_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))))",
          "command": "UPDATE",
          "withCheck": "((( SELECT auth.uid() AS uid) = user_id) AND (EXISTS ( SELECT 1\n   FROM conversations c\n  WHERE ((c.id = goal_alignment_states.conversation_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))))",
          "permissive": true
        },
        {
          "name": "Users can view own goal alignment states",
          "roles": null,
          "using": "((( SELECT auth.uid() AS uid) = user_id) AND (EXISTS ( SELECT 1\n   FROM conversations c\n  WHERE ((c.id = goal_alignment_states.conversation_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))))",
          "command": "SELECT",
          "withCheck": null,
          "permissive": true
        }
      ],
      "triggers": [
        {
          "name": "update_goal_alignment_states_updated_at",
          "events": [
            "UPDATE"
          ],
          "timing": "BEFORE",
          "function": "update_updated_at_column"
        }
      ],
      "primaryKey": [
        "id"
      ],
      "rlsEnabled": true,
      "foreignKeys": [
        {
          "name": "goal_alignment_states_character_id_fkey",
          "columns": [
            "character_id"
          ],
          "onDelete": "CASCADE",
          "onUpdate": "NO ACTION",
          "refTable": "characters",
          "refSchema": "public",
          "refColumns": [
            "id"
          ]
        },
        {
          "name": "goal_alignment_states_conversation_id_fkey",
          "columns": [
            "conversation_id"
          ],
          "onDelete": "CASCADE",
          "onUpdate": "NO ACTION",
          "refTable": "conversations",
          "refSchema": "public",
          "refColumns": [
            "id"
          ]
        },
        {
          "name": "goal_alignment_states_source_message_id_fkey",
          "columns": [
            "source_message_id"
          ],
          "onDelete": "SET NULL",
          "onUpdate": "NO ACTION",
          "refTable": "messages",
          "refSchema": "public",
          "refColumns": [
            "id"
          ]
        }
      ],
      "approxRowCount": -1,
      "checkConstraints": [
        {
          "name": "goal_alignment_scope_matches_kind",
          "expression": "CHECK ((((goal_kind = 'story'::text) AND (character_id IS NULL) AND (character_scope_id = '00000000-0000-0000-0000-000000000000'::uuid)) OR ((goal_kind = 'character'::text) AND (character_id IS NOT NULL) AND (character_scope_id = character_id))))"
        },
        {
          "name": "goal_alignment_states_goal_kind_check",
          "expression": "CHECK ((goal_kind = ANY (ARRAY['story'::text, 'character'::text])))"
        },
        {
          "name": "goal_alignment_states_last_signal_check",
          "expression": "CHECK ((last_signal = ANY (ARRAY['support'::text, 'resistance'::text, 'drift'::text, 'neutral'::text, 'not_applicable'::text])))"
        },
        {
          "name": "goal_alignment_states_score_check",
          "expression": "CHECK (((score >= 0) AND (score <= 100)))"
        },
        {
          "name": "goal_alignment_states_status_check",
          "expression": "CHECK ((status = ANY (ARRAY['active'::text, 'supported'::text, 'resisted'::text, 'drifting'::text, 'dormant'::text, 'dropped'::text])))"
        },
        {
          "name": "goal_alignment_states_trend_check",
          "expression": "CHECK ((trend = ANY (ARRAY['rising'::text, 'falling'::text, 'stable'::text])))"
        }
      ],
      "uniqueConstraints": []
    },
    {
      "name": "guide_documents",
      "grants": [
        {
          "grantee": "anon",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "authenticated",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "postgres",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "sandbox_exec",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "sandbox_exec_gialzvvswxadxolnwots",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "service_role",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        }
      ],
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "default": "gen_random_uuid()",
          "notNull": true,
          "ordinal": 1,
          "isIdentity": false
        },
        {
          "name": "title",
          "type": "text",
          "default": "'Untitled Document'::text",
          "notNull": true,
          "ordinal": 2,
          "isIdentity": false
        },
        {
          "name": "content",
          "type": "jsonb",
          "default": null,
          "notNull": false,
          "ordinal": 3,
          "isIdentity": false
        },
        {
          "name": "markdown",
          "type": "text",
          "default": null,
          "notNull": false,
          "ordinal": 4,
          "isIdentity": false
        },
        {
          "name": "created_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": true,
          "ordinal": 5,
          "isIdentity": false
        },
        {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": true,
          "ordinal": 6,
          "isIdentity": false
        },
        {
          "name": "sort_order",
          "type": "integer",
          "default": "0",
          "notNull": true,
          "ordinal": 7,
          "isIdentity": false
        }
      ],
      "comment": null,
      "policies": [
        {
          "name": "Admin can delete guide documents",
          "roles": [
            "authenticated"
          ],
          "using": "has_role(auth.uid(), 'admin'::app_role)",
          "command": "DELETE",
          "withCheck": null,
          "permissive": true
        },
        {
          "name": "Admin can insert guide documents",
          "roles": [
            "authenticated"
          ],
          "using": null,
          "command": "INSERT",
          "withCheck": "has_role(auth.uid(), 'admin'::app_role)",
          "permissive": true
        },
        {
          "name": "Admin can read guide documents",
          "roles": [
            "authenticated"
          ],
          "using": "has_role(auth.uid(), 'admin'::app_role)",
          "command": "SELECT",
          "withCheck": null,
          "permissive": true
        },
        {
          "name": "Admin can update guide documents",
          "roles": [
            "authenticated"
          ],
          "using": "has_role(auth.uid(), 'admin'::app_role)",
          "command": "UPDATE",
          "withCheck": null,
          "permissive": true
        }
      ],
      "triggers": [
        {
          "name": "update_guide_documents_updated_at",
          "events": [
            "UPDATE"
          ],
          "timing": "BEFORE",
          "function": "update_updated_at_column"
        }
      ],
      "primaryKey": [
        "id"
      ],
      "rlsEnabled": true,
      "foreignKeys": [],
      "approxRowCount": 15,
      "checkConstraints": [],
      "uniqueConstraints": []
    },
    {
      "name": "image_folders",
      "grants": [
        {
          "grantee": "anon",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "authenticated",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "postgres",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "sandbox_exec",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "sandbox_exec_gialzvvswxadxolnwots",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "service_role",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        }
      ],
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "default": "gen_random_uuid()",
          "notNull": true,
          "ordinal": 1,
          "isIdentity": false
        },
        {
          "name": "user_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 2,
          "isIdentity": false
        },
        {
          "name": "name",
          "type": "text",
          "default": "'New Folder'::text",
          "notNull": true,
          "ordinal": 3,
          "isIdentity": false
        },
        {
          "name": "description",
          "type": "text",
          "default": "''::text",
          "notNull": false,
          "ordinal": 4,
          "isIdentity": false
        },
        {
          "name": "thumbnail_image_id",
          "type": "uuid",
          "default": null,
          "notNull": false,
          "ordinal": 5,
          "isIdentity": false
        },
        {
          "name": "created_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": false,
          "ordinal": 6,
          "isIdentity": false
        },
        {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": false,
          "ordinal": 7,
          "isIdentity": false
        }
      ],
      "comment": null,
      "policies": [
        {
          "name": "Users can create own folders",
          "roles": null,
          "using": null,
          "command": "INSERT",
          "withCheck": "(auth.uid() = user_id)",
          "permissive": true
        },
        {
          "name": "Users can delete own folders",
          "roles": null,
          "using": "(auth.uid() = user_id)",
          "command": "DELETE",
          "withCheck": null,
          "permissive": true
        },
        {
          "name": "Users can update own folders",
          "roles": null,
          "using": "(auth.uid() = user_id)",
          "command": "UPDATE",
          "withCheck": null,
          "permissive": true
        },
        {
          "name": "Users can view own folders",
          "roles": null,
          "using": "(auth.uid() = user_id)",
          "command": "SELECT",
          "withCheck": null,
          "permissive": true
        }
      ],
      "triggers": [
        {
          "name": "update_image_folders_updated_at",
          "events": [
            "UPDATE"
          ],
          "timing": "BEFORE",
          "function": "update_updated_at_column"
        }
      ],
      "primaryKey": [
        "id"
      ],
      "rlsEnabled": true,
      "foreignKeys": [
        {
          "name": "fk_thumbnail_image",
          "columns": [
            "thumbnail_image_id"
          ],
          "onDelete": "SET NULL",
          "onUpdate": "NO ACTION",
          "refTable": "library_images",
          "refSchema": "public",
          "refColumns": [
            "id"
          ]
        }
      ],
      "approxRowCount": -1,
      "checkConstraints": [],
      "uniqueConstraints": []
    },
    {
      "name": "library_images",
      "grants": [
        {
          "grantee": "anon",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "authenticated",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "postgres",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "sandbox_exec",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "sandbox_exec_gialzvvswxadxolnwots",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "service_role",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        }
      ],
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "default": "gen_random_uuid()",
          "notNull": true,
          "ordinal": 1,
          "isIdentity": false
        },
        {
          "name": "user_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 2,
          "isIdentity": false
        },
        {
          "name": "folder_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 3,
          "isIdentity": false
        },
        {
          "name": "image_url",
          "type": "text",
          "default": null,
          "notNull": true,
          "ordinal": 4,
          "isIdentity": false
        },
        {
          "name": "filename",
          "type": "text",
          "default": "''::text",
          "notNull": false,
          "ordinal": 5,
          "isIdentity": false
        },
        {
          "name": "is_thumbnail",
          "type": "boolean",
          "default": "false",
          "notNull": false,
          "ordinal": 6,
          "isIdentity": false
        },
        {
          "name": "created_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": false,
          "ordinal": 7,
          "isIdentity": false
        },
        {
          "name": "tags",
          "type": "text[]",
          "default": "'{}'::text[]",
          "notNull": true,
          "ordinal": 8,
          "isIdentity": false
        },
        {
          "name": "title",
          "type": "text",
          "default": "''::text",
          "notNull": true,
          "ordinal": 9,
          "isIdentity": false
        },
        {
          "name": "image_path",
          "type": "text",
          "default": null,
          "notNull": false,
          "ordinal": 10,
          "isIdentity": false
        }
      ],
      "comment": null,
      "policies": [
        {
          "name": "Users can create own images",
          "roles": null,
          "using": null,
          "command": "INSERT",
          "withCheck": "(auth.uid() = user_id)",
          "permissive": true
        },
        {
          "name": "Users can delete own images",
          "roles": null,
          "using": "(auth.uid() = user_id)",
          "command": "DELETE",
          "withCheck": null,
          "permissive": true
        },
        {
          "name": "Users can update own images",
          "roles": null,
          "using": "(auth.uid() = user_id)",
          "command": "UPDATE",
          "withCheck": null,
          "permissive": true
        },
        {
          "name": "Users can view own images",
          "roles": null,
          "using": "(auth.uid() = user_id)",
          "command": "SELECT",
          "withCheck": null,
          "permissive": true
        }
      ],
      "triggers": [],
      "primaryKey": [
        "id"
      ],
      "rlsEnabled": true,
      "foreignKeys": [
        {
          "name": "library_images_folder_id_fkey",
          "columns": [
            "folder_id"
          ],
          "onDelete": "CASCADE",
          "onUpdate": "NO ACTION",
          "refTable": "image_folders",
          "refSchema": "public",
          "refColumns": [
            "id"
          ]
        }
      ],
      "approxRowCount": -1,
      "checkConstraints": [],
      "uniqueConstraints": []
    },
    {
      "name": "memories",
      "grants": [
        {
          "grantee": "anon",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "authenticated",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "postgres",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "sandbox_exec",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "sandbox_exec_gialzvvswxadxolnwots",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "service_role",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        }
      ],
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "default": "gen_random_uuid()",
          "notNull": true,
          "ordinal": 1,
          "isIdentity": false
        },
        {
          "name": "conversation_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 2,
          "isIdentity": false
        },
        {
          "name": "user_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 3,
          "isIdentity": false
        },
        {
          "name": "content",
          "type": "text",
          "default": null,
          "notNull": true,
          "ordinal": 4,
          "isIdentity": false
        },
        {
          "name": "day",
          "type": "integer",
          "default": null,
          "notNull": false,
          "ordinal": 5,
          "isIdentity": false
        },
        {
          "name": "time_of_day",
          "type": "text",
          "default": null,
          "notNull": false,
          "ordinal": 6,
          "isIdentity": false
        },
        {
          "name": "source",
          "type": "text",
          "default": "'user'::text",
          "notNull": false,
          "ordinal": 7,
          "isIdentity": false
        },
        {
          "name": "source_message_id",
          "type": "uuid",
          "default": null,
          "notNull": false,
          "ordinal": 8,
          "isIdentity": false
        },
        {
          "name": "created_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": false,
          "ordinal": 9,
          "isIdentity": false
        },
        {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": false,
          "ordinal": 10,
          "isIdentity": false
        },
        {
          "name": "entry_type",
          "type": "text",
          "default": "'bullet'::text",
          "notNull": true,
          "ordinal": 11,
          "isIdentity": false
        },
        {
          "name": "source_generation_id",
          "type": "uuid",
          "default": null,
          "notNull": false,
          "ordinal": 12,
          "isIdentity": false
        }
      ],
      "comment": null,
      "policies": [
        {
          "name": "Users can create own memories",
          "roles": null,
          "using": null,
          "command": "INSERT",
          "withCheck": "(auth.uid() = user_id)",
          "permissive": true
        },
        {
          "name": "Users can delete own memories",
          "roles": null,
          "using": "(auth.uid() = user_id)",
          "command": "DELETE",
          "withCheck": null,
          "permissive": true
        },
        {
          "name": "Users can update own memories",
          "roles": null,
          "using": "(auth.uid() = user_id)",
          "command": "UPDATE",
          "withCheck": null,
          "permissive": true
        },
        {
          "name": "Users can view own memories",
          "roles": null,
          "using": "(auth.uid() = user_id)",
          "command": "SELECT",
          "withCheck": null,
          "permissive": true
        }
      ],
      "triggers": [
        {
          "name": "update_memories_updated_at",
          "events": [
            "UPDATE"
          ],
          "timing": "BEFORE",
          "function": "update_updated_at_column"
        }
      ],
      "primaryKey": [
        "id"
      ],
      "rlsEnabled": true,
      "foreignKeys": [],
      "approxRowCount": 97,
      "checkConstraints": [],
      "uniqueConstraints": []
    },
    {
      "name": "messages",
      "grants": [
        {
          "grantee": "anon",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "authenticated",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "postgres",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "sandbox_exec",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "sandbox_exec_gialzvvswxadxolnwots",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "service_role",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        }
      ],
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "default": "gen_random_uuid()",
          "notNull": true,
          "ordinal": 1,
          "isIdentity": false
        },
        {
          "name": "conversation_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 2,
          "isIdentity": false
        },
        {
          "name": "role",
          "type": "text",
          "default": null,
          "notNull": true,
          "ordinal": 3,
          "isIdentity": false
        },
        {
          "name": "content",
          "type": "text",
          "default": null,
          "notNull": true,
          "ordinal": 4,
          "isIdentity": false
        },
        {
          "name": "created_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": false,
          "ordinal": 5,
          "isIdentity": false
        },
        {
          "name": "day",
          "type": "integer",
          "default": null,
          "notNull": false,
          "ordinal": 6,
          "isIdentity": false
        },
        {
          "name": "time_of_day",
          "type": "text",
          "default": null,
          "notNull": false,
          "ordinal": 7,
          "isIdentity": false
        },
        {
          "name": "generation_id",
          "type": "uuid",
          "default": "gen_random_uuid()",
          "notNull": true,
          "ordinal": 8,
          "isIdentity": false
        }
      ],
      "comment": null,
      "policies": [
        {
          "name": "Users can create messages via conversation",
          "roles": null,
          "using": null,
          "command": "INSERT",
          "withCheck": "(EXISTS ( SELECT 1\n   FROM conversations\n  WHERE ((conversations.id = messages.conversation_id) AND (conversations.user_id = auth.uid()))))",
          "permissive": true
        },
        {
          "name": "Users can delete messages via conversation",
          "roles": null,
          "using": "(EXISTS ( SELECT 1\n   FROM conversations\n  WHERE ((conversations.id = messages.conversation_id) AND (conversations.user_id = auth.uid()))))",
          "command": "DELETE",
          "withCheck": null,
          "permissive": true
        },
        {
          "name": "Users can update messages via conversation",
          "roles": null,
          "using": "(EXISTS ( SELECT 1\n   FROM conversations\n  WHERE ((conversations.id = messages.conversation_id) AND (conversations.user_id = auth.uid()))))",
          "command": "UPDATE",
          "withCheck": null,
          "permissive": true
        },
        {
          "name": "Users can view messages via conversation",
          "roles": null,
          "using": "(EXISTS ( SELECT 1\n   FROM conversations\n  WHERE ((conversations.id = messages.conversation_id) AND (conversations.user_id = auth.uid()))))",
          "command": "SELECT",
          "withCheck": null,
          "permissive": true
        }
      ],
      "triggers": [],
      "primaryKey": [
        "id"
      ],
      "rlsEnabled": true,
      "foreignKeys": [
        {
          "name": "messages_conversation_id_fkey",
          "columns": [
            "conversation_id"
          ],
          "onDelete": "CASCADE",
          "onUpdate": "NO ACTION",
          "refTable": "conversations",
          "refSchema": "public",
          "refColumns": [
            "id"
          ]
        }
      ],
      "approxRowCount": 566,
      "checkConstraints": [
        {
          "name": "messages_role_check",
          "expression": "CHECK ((role = ANY (ARRAY['system'::text, 'user'::text, 'assistant'::text])))"
        }
      ],
      "uniqueConstraints": []
    },
    {
      "name": "profiles",
      "grants": [
        {
          "grantee": "anon",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "authenticated",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "postgres",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "sandbox_exec",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "sandbox_exec_gialzvvswxadxolnwots",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "service_role",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        }
      ],
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 1,
          "isIdentity": false
        },
        {
          "name": "username",
          "type": "text",
          "default": null,
          "notNull": false,
          "ordinal": 2,
          "isIdentity": false
        },
        {
          "name": "avatar_url",
          "type": "text",
          "default": null,
          "notNull": false,
          "ordinal": 3,
          "isIdentity": false
        },
        {
          "name": "created_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": false,
          "ordinal": 4,
          "isIdentity": false
        },
        {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": false,
          "ordinal": 5,
          "isIdentity": false
        },
        {
          "name": "display_name",
          "type": "text",
          "default": null,
          "notNull": false,
          "ordinal": 6,
          "isIdentity": false
        },
        {
          "name": "about_me",
          "type": "text",
          "default": "''::text",
          "notNull": false,
          "ordinal": 7,
          "isIdentity": false
        },
        {
          "name": "preferred_genres",
          "type": "text[]",
          "default": "'{}'::text[]",
          "notNull": false,
          "ordinal": 8,
          "isIdentity": false
        },
        {
          "name": "hide_published_works",
          "type": "boolean",
          "default": "false",
          "notNull": false,
          "ordinal": 9,
          "isIdentity": false
        },
        {
          "name": "hide_profile_details",
          "type": "boolean",
          "default": "false",
          "notNull": false,
          "ordinal": 10,
          "isIdentity": false
        },
        {
          "name": "avatar_position",
          "type": "jsonb",
          "default": "'{\"x\": 50, \"y\": 50}'::jsonb",
          "notNull": false,
          "ordinal": 11,
          "isIdentity": false
        },
        {
          "name": "preferred_model",
          "type": "text",
          "default": null,
          "notNull": false,
          "ordinal": 12,
          "isIdentity": false
        }
      ],
      "comment": null,
      "policies": [
        {
          "name": "Users can view own profile",
          "roles": [
            "authenticated"
          ],
          "using": "(auth.uid() = id)",
          "command": "SELECT",
          "withCheck": null,
          "permissive": true
        },
        {
          "name": "Admins can view all profiles",
          "roles": [
            "authenticated"
          ],
          "using": "has_role(auth.uid(), 'admin'::app_role)",
          "command": "SELECT",
          "withCheck": null,
          "permissive": true
        },
        {
          "name": "Users can insert own profile",
          "roles": null,
          "using": null,
          "command": "INSERT",
          "withCheck": "(auth.uid() = id)",
          "permissive": true
        },
        {
          "name": "Users can update own profile",
          "roles": null,
          "using": "(auth.uid() = id)",
          "command": "UPDATE",
          "withCheck": null,
          "permissive": true
        }
      ],
      "triggers": [
        {
          "name": "update_profiles_updated_at",
          "events": [
            "UPDATE"
          ],
          "timing": "BEFORE",
          "function": "update_updated_at_column"
        }
      ],
      "primaryKey": [
        "id"
      ],
      "rlsEnabled": true,
      "foreignKeys": [
        {
          "name": "profiles_id_fkey",
          "columns": [
            "id"
          ],
          "onDelete": "CASCADE",
          "onUpdate": "NO ACTION",
          "refTable": "users",
          "refSchema": "auth",
          "refColumns": [
            "id"
          ]
        }
      ],
      "approxRowCount": -1,
      "checkConstraints": [],
      "uniqueConstraints": []
    },
    {
      "name": "published_scenarios",
      "grants": [
        {
          "grantee": "anon",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "authenticated",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "postgres",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "sandbox_exec",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "sandbox_exec_gialzvvswxadxolnwots",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "service_role",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        }
      ],
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "default": "gen_random_uuid()",
          "notNull": true,
          "ordinal": 1,
          "isIdentity": false
        },
        {
          "name": "scenario_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 2,
          "isIdentity": false
        },
        {
          "name": "publisher_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 3,
          "isIdentity": false
        },
        {
          "name": "allow_remix",
          "type": "boolean",
          "default": "false",
          "notNull": true,
          "ordinal": 4,
          "isIdentity": false
        },
        {
          "name": "tags",
          "type": "text[]",
          "default": "'{}'::text[]",
          "notNull": true,
          "ordinal": 5,
          "isIdentity": false
        },
        {
          "name": "like_count",
          "type": "integer",
          "default": "0",
          "notNull": true,
          "ordinal": 6,
          "isIdentity": false
        },
        {
          "name": "save_count",
          "type": "integer",
          "default": "0",
          "notNull": true,
          "ordinal": 7,
          "isIdentity": false
        },
        {
          "name": "play_count",
          "type": "integer",
          "default": "0",
          "notNull": true,
          "ordinal": 8,
          "isIdentity": false
        },
        {
          "name": "reported_count",
          "type": "integer",
          "default": "0",
          "notNull": true,
          "ordinal": 9,
          "isIdentity": false
        },
        {
          "name": "is_hidden",
          "type": "boolean",
          "default": "false",
          "notNull": true,
          "ordinal": 10,
          "isIdentity": false
        },
        {
          "name": "is_published",
          "type": "boolean",
          "default": "true",
          "notNull": true,
          "ordinal": 11,
          "isIdentity": false
        },
        {
          "name": "created_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": false,
          "ordinal": 12,
          "isIdentity": false
        },
        {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": false,
          "ordinal": 13,
          "isIdentity": false
        },
        {
          "name": "view_count",
          "type": "integer",
          "default": "0",
          "notNull": true,
          "ordinal": 14,
          "isIdentity": false
        },
        {
          "name": "review_count",
          "type": "integer",
          "default": "0",
          "notNull": true,
          "ordinal": 15,
          "isIdentity": false
        },
        {
          "name": "avg_rating",
          "type": "numeric(3,2)",
          "default": "0",
          "notNull": true,
          "ordinal": 16,
          "isIdentity": false
        }
      ],
      "comment": null,
      "policies": [
        {
          "name": "Anyone can view published scenarios",
          "roles": [
            "authenticated",
            "anon"
          ],
          "using": "((is_published = true AND is_hidden = false AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id = published_scenarios.publisher_id AND COALESCE(p.hide_published_works,false) = false)) OR publisher_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))",
          "command": "SELECT",
          "withCheck": null,
          "permissive": true
        },
        {
          "name": "Publishers can delete own publications",
          "roles": [
            "authenticated"
          ],
          "using": "(publisher_id = auth.uid())",
          "command": "DELETE",
          "withCheck": null,
          "permissive": true
        },
        {
          "name": "Publishers can insert own publications",
          "roles": [
            "authenticated"
          ],
          "using": null,
          "command": "INSERT",
          "withCheck": "((publisher_id = auth.uid()) AND (EXISTS ( SELECT 1\n   FROM stories s\n  WHERE ((s.id = published_scenarios.scenario_id) AND (s.user_id = auth.uid())))))",
          "permissive": true
        },
        {
          "name": "Publishers can update own publications",
          "roles": [
            "authenticated"
          ],
          "using": "(publisher_id = auth.uid())",
          "command": "UPDATE",
          "withCheck": "((publisher_id = auth.uid()) AND (EXISTS ( SELECT 1\n   FROM stories s\n  WHERE ((s.id = published_scenarios.scenario_id) AND (s.user_id = auth.uid())))))",
          "permissive": true
        }
      ],
      "triggers": [
        {
          "name": "update_published_scenarios_updated_at",
          "events": [
            "UPDATE"
          ],
          "timing": "BEFORE",
          "function": "update_updated_at_column"
        }
      ],
      "primaryKey": [
        "id"
      ],
      "rlsEnabled": true,
      "foreignKeys": [
        {
          "name": "published_scenarios_scenario_id_fkey",
          "columns": [
            "scenario_id"
          ],
          "onDelete": "CASCADE",
          "onUpdate": "NO ACTION",
          "refTable": "stories",
          "refSchema": "public",
          "refColumns": [
            "id"
          ]
        }
      ],
      "approxRowCount": 3,
      "checkConstraints": [],
      "uniqueConstraints": [
        {
          "name": "published_scenarios_scenario_id_key",
          "columns": [
            "scenario_id"
          ]
        }
      ]
    },
    {
      "name": "quality_hub_registries",
      "grants": [
        {
          "grantee": "anon",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "authenticated",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "postgres",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "sandbox_exec",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "sandbox_exec_gialzvvswxadxolnwots",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "service_role",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        }
      ],
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "default": "gen_random_uuid()",
          "notNull": true,
          "ordinal": 1,
          "isIdentity": false
        },
        {
          "name": "user_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 2,
          "isIdentity": false
        },
        {
          "name": "registry",
          "type": "jsonb",
          "default": null,
          "notNull": true,
          "ordinal": 3,
          "isIdentity": false
        },
        {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": false,
          "ordinal": 4,
          "isIdentity": false
        }
      ],
      "comment": null,
      "policies": [
        {
          "name": "Users can delete own registry",
          "roles": [
            "authenticated"
          ],
          "using": "(auth.uid() = user_id)",
          "command": "DELETE",
          "withCheck": null,
          "permissive": true
        },
        {
          "name": "Users can insert own registry",
          "roles": [
            "authenticated"
          ],
          "using": null,
          "command": "INSERT",
          "withCheck": "(auth.uid() = user_id)",
          "permissive": true
        },
        {
          "name": "Users can update own registry",
          "roles": [
            "authenticated"
          ],
          "using": "(auth.uid() = user_id)",
          "command": "UPDATE",
          "withCheck": null,
          "permissive": true
        },
        {
          "name": "Users can view own registry",
          "roles": [
            "authenticated"
          ],
          "using": "(auth.uid() = user_id)",
          "command": "SELECT",
          "withCheck": null,
          "permissive": true
        }
      ],
      "triggers": [],
      "primaryKey": [
        "id"
      ],
      "rlsEnabled": true,
      "foreignKeys": [],
      "approxRowCount": 1,
      "checkConstraints": [],
      "uniqueConstraints": [
        {
          "name": "quality_hub_registries_user_id_key",
          "columns": [
            "user_id"
          ]
        }
      ]
    },
    {
      "name": "remixed_scenarios",
      "grants": [
        {
          "grantee": "anon",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "authenticated",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "postgres",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "sandbox_exec",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "sandbox_exec_gialzvvswxadxolnwots",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "service_role",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        }
      ],
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "default": "gen_random_uuid()",
          "notNull": true,
          "ordinal": 1,
          "isIdentity": false
        },
        {
          "name": "original_published_id",
          "type": "uuid",
          "default": null,
          "notNull": false,
          "ordinal": 2,
          "isIdentity": false
        },
        {
          "name": "remixed_scenario_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 3,
          "isIdentity": false
        },
        {
          "name": "remixer_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 4,
          "isIdentity": false
        },
        {
          "name": "created_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": false,
          "ordinal": 5,
          "isIdentity": false
        }
      ],
      "comment": null,
      "policies": [
        {
          "name": "Users can insert own remixes",
          "roles": [
            "authenticated"
          ],
          "using": null,
          "command": "INSERT",
          "withCheck": "(remixer_id = auth.uid())",
          "permissive": true
        },
        {
          "name": "Users can view own remixes",
          "roles": [
            "authenticated"
          ],
          "using": "(remixer_id = auth.uid())",
          "command": "SELECT",
          "withCheck": null,
          "permissive": true
        }
      ],
      "triggers": [],
      "primaryKey": [
        "id"
      ],
      "rlsEnabled": true,
      "foreignKeys": [
        {
          "name": "remixed_scenarios_original_published_id_fkey",
          "columns": [
            "original_published_id"
          ],
          "onDelete": "SET NULL",
          "onUpdate": "NO ACTION",
          "refTable": "published_scenarios",
          "refSchema": "public",
          "refColumns": [
            "id"
          ]
        },
        {
          "name": "remixed_scenarios_remixed_scenario_id_fkey",
          "columns": [
            "remixed_scenario_id"
          ],
          "onDelete": "CASCADE",
          "onUpdate": "NO ACTION",
          "refTable": "stories",
          "refSchema": "public",
          "refColumns": [
            "id"
          ]
        }
      ],
      "approxRowCount": -1,
      "checkConstraints": [],
      "uniqueConstraints": []
    },
    {
      "name": "reports",
      "grants": [
        {
          "grantee": "anon",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "authenticated",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "postgres",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "sandbox_exec",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "sandbox_exec_gialzvvswxadxolnwots",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "service_role",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        }
      ],
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "default": "gen_random_uuid()",
          "notNull": true,
          "ordinal": 1,
          "isIdentity": false
        },
        {
          "name": "reporter",
          "type": "text",
          "default": null,
          "notNull": true,
          "ordinal": 2,
          "isIdentity": false
        },
        {
          "name": "accused",
          "type": "text",
          "default": null,
          "notNull": true,
          "ordinal": 3,
          "isIdentity": false
        },
        {
          "name": "reason",
          "type": "text",
          "default": null,
          "notNull": true,
          "ordinal": 4,
          "isIdentity": false
        },
        {
          "name": "story_id",
          "type": "text",
          "default": null,
          "notNull": false,
          "ordinal": 5,
          "isIdentity": false
        },
        {
          "name": "status",
          "type": "text",
          "default": "'open'::text",
          "notNull": true,
          "ordinal": 6,
          "isIdentity": false
        },
        {
          "name": "created_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": true,
          "ordinal": 7,
          "isIdentity": false
        },
        {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": true,
          "ordinal": 8,
          "isIdentity": false
        },
        {
          "name": "reporter_user_id",
          "type": "uuid",
          "default": null,
          "notNull": false,
          "ordinal": 9,
          "isIdentity": false
        },
        {
          "name": "accused_user_id",
          "type": "uuid",
          "default": null,
          "notNull": false,
          "ordinal": 10,
          "isIdentity": false
        },
        {
          "name": "note",
          "type": "text",
          "default": "''::text",
          "notNull": false,
          "ordinal": 11,
          "isIdentity": false
        },
        {
          "name": "reviewed_by",
          "type": "uuid",
          "default": null,
          "notNull": false,
          "ordinal": 12,
          "isIdentity": false
        }
      ],
      "comment": null,
      "policies": [
        {
          "name": "Admins can manage reports",
          "roles": [
            "authenticated"
          ],
          "using": "has_role(auth.uid(), 'admin'::app_role)",
          "command": "ALL",
          "withCheck": "has_role(auth.uid(), 'admin'::app_role)",
          "permissive": true
        },
        {
          "name": "Users can insert own reports",
          "roles": [
            "authenticated"
          ],
          "using": null,
          "command": "INSERT",
          "withCheck": "((reporter_user_id IS NOT NULL) AND (auth.uid() = reporter_user_id))",
          "permissive": true
        },
        {
          "name": "Users can view own submitted reports",
          "roles": [
            "authenticated"
          ],
          "using": "((reporter_user_id IS NOT NULL) AND (auth.uid() = reporter_user_id))",
          "command": "SELECT",
          "withCheck": null,
          "permissive": true
        }
      ],
      "triggers": [
        {
          "name": "trg_reports_updated_at",
          "events": [
            "UPDATE"
          ],
          "timing": "BEFORE",
          "function": "set_updated_at_finance_live_tables"
        },
        {
          "name": "update_reports_updated_at",
          "events": [
            "UPDATE"
          ],
          "timing": "BEFORE",
          "function": "update_updated_at_column"
        }
      ],
      "primaryKey": [
        "id"
      ],
      "rlsEnabled": true,
      "foreignKeys": [],
      "approxRowCount": -1,
      "checkConstraints": [],
      "uniqueConstraints": []
    },
    {
      "name": "saved_scenarios",
      "grants": [
        {
          "grantee": "anon",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "authenticated",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "postgres",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "sandbox_exec",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "sandbox_exec_gialzvvswxadxolnwots",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "service_role",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        }
      ],
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "default": "gen_random_uuid()",
          "notNull": true,
          "ordinal": 1,
          "isIdentity": false
        },
        {
          "name": "user_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 2,
          "isIdentity": false
        },
        {
          "name": "published_scenario_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 3,
          "isIdentity": false
        },
        {
          "name": "source_scenario_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 4,
          "isIdentity": false
        },
        {
          "name": "created_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": false,
          "ordinal": 5,
          "isIdentity": false
        }
      ],
      "comment": null,
      "policies": [
        {
          "name": "Users can delete own saves",
          "roles": [
            "authenticated"
          ],
          "using": "(user_id = auth.uid())",
          "command": "DELETE",
          "withCheck": null,
          "permissive": true
        },
        {
          "name": "Users can insert own saves",
          "roles": [
            "authenticated"
          ],
          "using": null,
          "command": "INSERT",
          "withCheck": "(user_id = auth.uid())",
          "permissive": true
        },
        {
          "name": "Users can view own saves",
          "roles": [
            "authenticated"
          ],
          "using": "(user_id = auth.uid())",
          "command": "SELECT",
          "withCheck": null,
          "permissive": true
        }
      ],
      "triggers": [],
      "primaryKey": [
        "id"
      ],
      "rlsEnabled": true,
      "foreignKeys": [
        {
          "name": "saved_scenarios_published_scenario_id_fkey",
          "columns": [
            "published_scenario_id"
          ],
          "onDelete": "CASCADE",
          "onUpdate": "NO ACTION",
          "refTable": "published_scenarios",
          "refSchema": "public",
          "refColumns": [
            "id"
          ]
        }
      ],
      "approxRowCount": -1,
      "checkConstraints": [],
      "uniqueConstraints": [
        {
          "name": "saved_scenarios_user_id_published_scenario_id_key",
          "columns": [
            "user_id",
            "published_scenario_id"
          ]
        }
      ]
    },
    {
      "name": "scenario_likes",
      "grants": [
        {
          "grantee": "anon",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "authenticated",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "postgres",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "sandbox_exec",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "sandbox_exec_gialzvvswxadxolnwots",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "service_role",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        }
      ],
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "default": "gen_random_uuid()",
          "notNull": true,
          "ordinal": 1,
          "isIdentity": false
        },
        {
          "name": "published_scenario_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 2,
          "isIdentity": false
        },
        {
          "name": "user_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 3,
          "isIdentity": false
        },
        {
          "name": "created_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": false,
          "ordinal": 4,
          "isIdentity": false
        }
      ],
      "comment": null,
      "policies": [
        {
          "name": "Anyone can view likes",
          "roles": [
            "authenticated"
          ],
          "using": "true",
          "command": "SELECT",
          "withCheck": null,
          "permissive": true
        },
        {
          "name": "Users can delete own likes",
          "roles": [
            "authenticated"
          ],
          "using": "(user_id = auth.uid())",
          "command": "DELETE",
          "withCheck": null,
          "permissive": true
        },
        {
          "name": "Users can insert own likes",
          "roles": [
            "authenticated"
          ],
          "using": null,
          "command": "INSERT",
          "withCheck": "(user_id = auth.uid())",
          "permissive": true
        }
      ],
      "triggers": [],
      "primaryKey": [
        "id"
      ],
      "rlsEnabled": true,
      "foreignKeys": [
        {
          "name": "scenario_likes_published_scenario_id_fkey",
          "columns": [
            "published_scenario_id"
          ],
          "onDelete": "CASCADE",
          "onUpdate": "NO ACTION",
          "refTable": "published_scenarios",
          "refSchema": "public",
          "refColumns": [
            "id"
          ]
        }
      ],
      "approxRowCount": -1,
      "checkConstraints": [],
      "uniqueConstraints": [
        {
          "name": "scenario_likes_published_scenario_id_user_id_key",
          "columns": [
            "published_scenario_id",
            "user_id"
          ]
        }
      ]
    },
    {
      "name": "scenario_reviews",
      "grants": [
        {
          "grantee": "anon",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "authenticated",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "postgres",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "sandbox_exec",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "sandbox_exec_gialzvvswxadxolnwots",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "service_role",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        }
      ],
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "default": "gen_random_uuid()",
          "notNull": true,
          "ordinal": 1,
          "isIdentity": false
        },
        {
          "name": "published_scenario_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 2,
          "isIdentity": false
        },
        {
          "name": "user_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 3,
          "isIdentity": false
        },
        {
          "name": "concept_strength",
          "type": "smallint",
          "default": null,
          "notNull": true,
          "ordinal": 4,
          "isIdentity": false
        },
        {
          "name": "initial_situation",
          "type": "smallint",
          "default": null,
          "notNull": true,
          "ordinal": 5,
          "isIdentity": false
        },
        {
          "name": "role_clarity",
          "type": "smallint",
          "default": null,
          "notNull": true,
          "ordinal": 6,
          "isIdentity": false
        },
        {
          "name": "motivation_tension",
          "type": "smallint",
          "default": null,
          "notNull": true,
          "ordinal": 7,
          "isIdentity": false
        },
        {
          "name": "tone_promise",
          "type": "smallint",
          "default": null,
          "notNull": true,
          "ordinal": 8,
          "isIdentity": false
        },
        {
          "name": "low_friction_start",
          "type": "smallint",
          "default": null,
          "notNull": true,
          "ordinal": 9,
          "isIdentity": false
        },
        {
          "name": "worldbuilding_vibe",
          "type": "smallint",
          "default": null,
          "notNull": true,
          "ordinal": 10,
          "isIdentity": false
        },
        {
          "name": "replayability",
          "type": "smallint",
          "default": null,
          "notNull": true,
          "ordinal": 11,
          "isIdentity": false
        },
        {
          "name": "character_details_complexity",
          "type": "smallint",
          "default": null,
          "notNull": true,
          "ordinal": 12,
          "isIdentity": false
        },
        {
          "name": "spice_level",
          "type": "smallint",
          "default": null,
          "notNull": true,
          "ordinal": 13,
          "isIdentity": false
        },
        {
          "name": "comment",
          "type": "text",
          "default": null,
          "notNull": false,
          "ordinal": 14,
          "isIdentity": false
        },
        {
          "name": "raw_weighted_score",
          "type": "numeric(4,3)",
          "default": null,
          "notNull": true,
          "ordinal": 15,
          "isIdentity": false
        },
        {
          "name": "created_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": false,
          "ordinal": 16,
          "isIdentity": false
        },
        {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": false,
          "ordinal": 17,
          "isIdentity": false
        }
      ],
      "comment": null,
      "policies": [
        {
          "name": "Anyone authenticated can view reviews",
          "roles": null,
          "using": "true",
          "command": "SELECT",
          "withCheck": null,
          "permissive": true
        },
        {
          "name": "Users can create own reviews",
          "roles": null,
          "using": null,
          "command": "INSERT",
          "withCheck": "(user_id = auth.uid())",
          "permissive": true
        },
        {
          "name": "Users can delete own reviews",
          "roles": null,
          "using": "(user_id = auth.uid())",
          "command": "DELETE",
          "withCheck": null,
          "permissive": true
        },
        {
          "name": "Users can update own reviews",
          "roles": null,
          "using": "(user_id = auth.uid())",
          "command": "UPDATE",
          "withCheck": null,
          "permissive": true
        }
      ],
      "triggers": [
        {
          "name": "update_review_aggregates_trigger",
          "events": [
            "INSERT",
            "DELETE",
            "UPDATE"
          ],
          "timing": "AFTER",
          "function": "update_review_aggregates"
        },
        {
          "name": "update_scenario_reviews_updated_at",
          "events": [
            "UPDATE"
          ],
          "timing": "BEFORE",
          "function": "update_updated_at_column"
        },
        {
          "name": "validate_review_ratings_trigger",
          "events": [
            "INSERT",
            "UPDATE"
          ],
          "timing": "BEFORE",
          "function": "validate_review_ratings"
        }
      ],
      "primaryKey": [
        "id"
      ],
      "rlsEnabled": true,
      "foreignKeys": [
        {
          "name": "scenario_reviews_published_scenario_id_fkey",
          "columns": [
            "published_scenario_id"
          ],
          "onDelete": "CASCADE",
          "onUpdate": "NO ACTION",
          "refTable": "published_scenarios",
          "refSchema": "public",
          "refColumns": [
            "id"
          ]
        }
      ],
      "approxRowCount": -1,
      "checkConstraints": [],
      "uniqueConstraints": [
        {
          "name": "scenario_reviews_published_scenario_id_user_id_key",
          "columns": [
            "published_scenario_id",
            "user_id"
          ]
        }
      ]
    },
    {
      "name": "scenario_views",
      "grants": [
        {
          "grantee": "anon",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "authenticated",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "postgres",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "sandbox_exec",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "sandbox_exec_gialzvvswxadxolnwots",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "service_role",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        }
      ],
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "default": "gen_random_uuid()",
          "notNull": true,
          "ordinal": 1,
          "isIdentity": false
        },
        {
          "name": "published_scenario_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 2,
          "isIdentity": false
        },
        {
          "name": "user_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 3,
          "isIdentity": false
        },
        {
          "name": "viewed_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": true,
          "ordinal": 4,
          "isIdentity": false
        }
      ],
      "comment": null,
      "policies": [
        {
          "name": "Users can insert own views",
          "roles": null,
          "using": null,
          "command": "INSERT",
          "withCheck": "(user_id = auth.uid())",
          "permissive": true
        },
        {
          "name": "Users can view own views",
          "roles": null,
          "using": "(user_id = auth.uid())",
          "command": "SELECT",
          "withCheck": null,
          "permissive": true
        }
      ],
      "triggers": [],
      "primaryKey": [
        "id"
      ],
      "rlsEnabled": true,
      "foreignKeys": [
        {
          "name": "scenario_views_published_scenario_id_fkey",
          "columns": [
            "published_scenario_id"
          ],
          "onDelete": "CASCADE",
          "onUpdate": "NO ACTION",
          "refTable": "published_scenarios",
          "refSchema": "public",
          "refColumns": [
            "id"
          ]
        }
      ],
      "approxRowCount": -1,
      "checkConstraints": [],
      "uniqueConstraints": []
    },
    {
      "name": "scenes",
      "grants": [
        {
          "grantee": "anon",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "authenticated",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "postgres",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "sandbox_exec",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "sandbox_exec_gialzvvswxadxolnwots",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "service_role",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        }
      ],
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "default": "gen_random_uuid()",
          "notNull": true,
          "ordinal": 1,
          "isIdentity": false
        },
        {
          "name": "scenario_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 2,
          "isIdentity": false
        },
        {
          "name": "image_url",
          "type": "text",
          "default": null,
          "notNull": true,
          "ordinal": 3,
          "isIdentity": false
        },
        {
          "name": "tag",
          "type": "text",
          "default": "''::text",
          "notNull": false,
          "ordinal": 4,
          "isIdentity": false
        },
        {
          "name": "is_starting_scene",
          "type": "boolean",
          "default": "false",
          "notNull": false,
          "ordinal": 5,
          "isIdentity": false
        },
        {
          "name": "created_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": false,
          "ordinal": 6,
          "isIdentity": false
        },
        {
          "name": "tags",
          "type": "text[]",
          "default": "'{}'::text[]",
          "notNull": false,
          "ordinal": 7,
          "isIdentity": false
        },
        {
          "name": "image_path",
          "type": "text",
          "default": null,
          "notNull": false,
          "ordinal": 8,
          "isIdentity": false
        }
      ],
      "comment": null,
      "policies": [
        {
          "name": "Users can create scenes via story",
          "roles": [
            "authenticated"
          ],
          "using": null,
          "command": "INSERT",
          "withCheck": "(EXISTS ( SELECT 1\n   FROM stories\n  WHERE ((stories.id = scenes.scenario_id) AND (stories.user_id = auth.uid()))))",
          "permissive": true
        },
        {
          "name": "Users can delete scenes via story",
          "roles": [
            "authenticated"
          ],
          "using": "(EXISTS ( SELECT 1\n   FROM stories\n  WHERE ((stories.id = scenes.scenario_id) AND (stories.user_id = auth.uid()))))",
          "command": "DELETE",
          "withCheck": null,
          "permissive": true
        },
        {
          "name": "Users can update scenes via story",
          "roles": [
            "authenticated"
          ],
          "using": "(EXISTS ( SELECT 1\n   FROM stories\n  WHERE ((stories.id = scenes.scenario_id) AND (stories.user_id = auth.uid()))))",
          "command": "UPDATE",
          "withCheck": null,
          "permissive": true
        },
        {
          "name": "Users can view scenes via own or published story",
          "roles": [
            "authenticated"
          ],
          "using": "((EXISTS ( SELECT 1\n   FROM stories s\n  WHERE ((s.id = scenes.scenario_id) AND (s.user_id = auth.uid())))) OR (EXISTS ( SELECT 1\n   FROM published_scenarios ps\n  WHERE ((ps.scenario_id = scenes.scenario_id) AND (ps.is_published = true) AND (ps.is_hidden = false)))))",
          "command": "SELECT",
          "withCheck": null,
          "permissive": true
        }
      ],
      "triggers": [],
      "primaryKey": [
        "id"
      ],
      "rlsEnabled": true,
      "foreignKeys": [
        {
          "name": "scenes_scenario_id_fkey",
          "columns": [
            "scenario_id"
          ],
          "onDelete": "CASCADE",
          "onUpdate": "NO ACTION",
          "refTable": "stories",
          "refSchema": "public",
          "refColumns": [
            "id"
          ]
        }
      ],
      "approxRowCount": 9,
      "checkConstraints": [],
      "uniqueConstraints": []
    },
    {
      "name": "side_character_message_snapshots",
      "grants": [
        {
          "grantee": "anon",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "authenticated",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "postgres",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "sandbox_exec",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "sandbox_exec_gialzvvswxadxolnwots",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "service_role",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        }
      ],
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "default": "gen_random_uuid()",
          "notNull": true,
          "ordinal": 1,
          "isIdentity": false
        },
        {
          "name": "user_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 2,
          "isIdentity": false
        },
        {
          "name": "conversation_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 3,
          "isIdentity": false
        },
        {
          "name": "side_character_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 4,
          "isIdentity": false
        },
        {
          "name": "source_message_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 5,
          "isIdentity": false
        },
        {
          "name": "source_generation_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 6,
          "isIdentity": false
        },
        {
          "name": "snapshot",
          "type": "jsonb",
          "default": "'{}'::jsonb",
          "notNull": true,
          "ordinal": 7,
          "isIdentity": false
        },
        {
          "name": "created_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": true,
          "ordinal": 8,
          "isIdentity": false
        }
      ],
      "comment": null,
      "policies": [
        {
          "name": "Users can delete own side char snapshots",
          "roles": null,
          "using": "(auth.uid() = user_id)",
          "command": "DELETE",
          "withCheck": null,
          "permissive": true
        },
        {
          "name": "Users can insert own side char snapshots",
          "roles": null,
          "using": null,
          "command": "INSERT",
          "withCheck": "(auth.uid() = user_id)",
          "permissive": true
        },
        {
          "name": "Users can update own side char snapshots",
          "roles": null,
          "using": "(auth.uid() = user_id)",
          "command": "UPDATE",
          "withCheck": null,
          "permissive": true
        },
        {
          "name": "Users can view own side char snapshots",
          "roles": null,
          "using": "(auth.uid() = user_id)",
          "command": "SELECT",
          "withCheck": null,
          "permissive": true
        }
      ],
      "triggers": [],
      "primaryKey": [
        "id"
      ],
      "rlsEnabled": true,
      "foreignKeys": [
        {
          "name": "side_character_message_snapshots_conversation_id_fkey",
          "columns": [
            "conversation_id"
          ],
          "onDelete": "CASCADE",
          "onUpdate": "NO ACTION",
          "refTable": "conversations",
          "refSchema": "public",
          "refColumns": [
            "id"
          ]
        },
        {
          "name": "side_character_message_snapshots_side_character_id_fkey",
          "columns": [
            "side_character_id"
          ],
          "onDelete": "CASCADE",
          "onUpdate": "NO ACTION",
          "refTable": "side_characters",
          "refSchema": "public",
          "refColumns": [
            "id"
          ]
        },
        {
          "name": "side_character_message_snapshots_source_message_id_fkey",
          "columns": [
            "source_message_id"
          ],
          "onDelete": "CASCADE",
          "onUpdate": "NO ACTION",
          "refTable": "messages",
          "refSchema": "public",
          "refColumns": [
            "id"
          ]
        }
      ],
      "approxRowCount": -1,
      "checkConstraints": [],
      "uniqueConstraints": []
    },
    {
      "name": "side_characters",
      "grants": [
        {
          "grantee": "anon",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "authenticated",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "postgres",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "sandbox_exec",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "sandbox_exec_gialzvvswxadxolnwots",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "service_role",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        }
      ],
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "default": "gen_random_uuid()",
          "notNull": true,
          "ordinal": 1,
          "isIdentity": false
        },
        {
          "name": "conversation_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 2,
          "isIdentity": false
        },
        {
          "name": "user_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 3,
          "isIdentity": false
        },
        {
          "name": "name",
          "type": "text",
          "default": null,
          "notNull": true,
          "ordinal": 4,
          "isIdentity": false
        },
        {
          "name": "age",
          "type": "text",
          "default": "''::text",
          "notNull": false,
          "ordinal": 5,
          "isIdentity": false
        },
        {
          "name": "sex_type",
          "type": "text",
          "default": "''::text",
          "notNull": false,
          "ordinal": 6,
          "isIdentity": false
        },
        {
          "name": "location",
          "type": "text",
          "default": "''::text",
          "notNull": false,
          "ordinal": 7,
          "isIdentity": false
        },
        {
          "name": "current_mood",
          "type": "text",
          "default": "''::text",
          "notNull": false,
          "ordinal": 8,
          "isIdentity": false
        },
        {
          "name": "role_description",
          "type": "text",
          "default": "''::text",
          "notNull": false,
          "ordinal": 9,
          "isIdentity": false
        },
        {
          "name": "physical_appearance",
          "type": "jsonb",
          "default": "'{\"build\": \"\", \"height\": \"\", \"makeup\": \"\", \"body_hair\": \"\", \"eye_color\": \"\", \"genitalia\": \"\", \"skin_tone\": \"\", \"hair_color\": \"\", \"breast_size\": \"\", \"body_markings\": \"\", \"temporary_conditions\": \"\"}'::jsonb",
          "notNull": false,
          "ordinal": 10,
          "isIdentity": false
        },
        {
          "name": "currently_wearing",
          "type": "jsonb",
          "default": "'{\"top\": \"\", \"bottom\": \"\", \"miscellaneous\": \"\", \"undergarments\": \"\"}'::jsonb",
          "notNull": false,
          "ordinal": 11,
          "isIdentity": false
        },
        {
          "name": "preferred_clothing",
          "type": "jsonb",
          "default": "'{\"work\": \"\", \"sleep\": \"\", \"casual\": \"\", \"underwear\": \"\", \"miscellaneous\": \"\"}'::jsonb",
          "notNull": false,
          "ordinal": 12,
          "isIdentity": false
        },
        {
          "name": "background",
          "type": "jsonb",
          "default": "'{\"origin\": \"\", \"backstory\": \"\", \"occupation\": \"\", \"relationships\": \"\"}'::jsonb",
          "notNull": false,
          "ordinal": 13,
          "isIdentity": false
        },
        {
          "name": "personality",
          "type": "jsonb",
          "default": "'{\"traits\": \"\", \"mannerisms\": \"\", \"motivations\": \"\", \"speech_style\": \"\"}'::jsonb",
          "notNull": false,
          "ordinal": 14,
          "isIdentity": false
        },
        {
          "name": "avatar_url",
          "type": "text",
          "default": "''::text",
          "notNull": false,
          "ordinal": 15,
          "isIdentity": false
        },
        {
          "name": "avatar_position",
          "type": "jsonb",
          "default": "'{\"x\": 50, \"y\": 50}'::jsonb",
          "notNull": false,
          "ordinal": 16,
          "isIdentity": false
        },
        {
          "name": "first_mentioned_in",
          "type": "text",
          "default": "''::text",
          "notNull": false,
          "ordinal": 17,
          "isIdentity": false
        },
        {
          "name": "extracted_traits",
          "type": "jsonb",
          "default": "'[]'::jsonb",
          "notNull": false,
          "ordinal": 18,
          "isIdentity": false
        },
        {
          "name": "created_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": false,
          "ordinal": 19,
          "isIdentity": false
        },
        {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": false,
          "ordinal": 20,
          "isIdentity": false
        },
        {
          "name": "controlled_by",
          "type": "text",
          "default": "'AI'::text",
          "notNull": false,
          "ordinal": 21,
          "isIdentity": false
        },
        {
          "name": "character_role",
          "type": "text",
          "default": "'Side'::text",
          "notNull": false,
          "ordinal": 22,
          "isIdentity": false
        },
        {
          "name": "nicknames",
          "type": "text",
          "default": "''::text",
          "notNull": false,
          "ordinal": 23,
          "isIdentity": false
        },
        {
          "name": "sexual_orientation",
          "type": "text",
          "default": "''::text",
          "notNull": false,
          "ordinal": 24,
          "isIdentity": false
        },
        {
          "name": "custom_sections",
          "type": "jsonb",
          "default": "'[]'::jsonb",
          "notNull": true,
          "ordinal": 25,
          "isIdentity": false
        }
      ],
      "comment": null,
      "policies": [
        {
          "name": "Users can create own side characters",
          "roles": null,
          "using": null,
          "command": "INSERT",
          "withCheck": "(auth.uid() = user_id)",
          "permissive": true
        },
        {
          "name": "Users can delete own side characters",
          "roles": null,
          "using": "(auth.uid() = user_id)",
          "command": "DELETE",
          "withCheck": null,
          "permissive": true
        },
        {
          "name": "Users can update own side characters",
          "roles": null,
          "using": "(auth.uid() = user_id)",
          "command": "UPDATE",
          "withCheck": null,
          "permissive": true
        },
        {
          "name": "Users can view own side characters",
          "roles": null,
          "using": "(auth.uid() = user_id)",
          "command": "SELECT",
          "withCheck": null,
          "permissive": true
        }
      ],
      "triggers": [
        {
          "name": "update_side_characters_updated_at",
          "events": [
            "UPDATE"
          ],
          "timing": "BEFORE",
          "function": "update_updated_at_column"
        }
      ],
      "primaryKey": [
        "id"
      ],
      "rlsEnabled": true,
      "foreignKeys": [
        {
          "name": "side_characters_conversation_id_fkey",
          "columns": [
            "conversation_id"
          ],
          "onDelete": "CASCADE",
          "onUpdate": "NO ACTION",
          "refTable": "conversations",
          "refSchema": "public",
          "refColumns": [
            "id"
          ]
        }
      ],
      "approxRowCount": 0,
      "checkConstraints": [],
      "uniqueConstraints": []
    },
    {
      "name": "sidebar_backgrounds",
      "grants": [
        {
          "grantee": "anon",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "authenticated",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "postgres",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "sandbox_exec",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "sandbox_exec_gialzvvswxadxolnwots",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "service_role",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        }
      ],
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "default": "gen_random_uuid()",
          "notNull": true,
          "ordinal": 1,
          "isIdentity": false
        },
        {
          "name": "user_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 2,
          "isIdentity": false
        },
        {
          "name": "image_url",
          "type": "text",
          "default": null,
          "notNull": true,
          "ordinal": 3,
          "isIdentity": false
        },
        {
          "name": "is_selected",
          "type": "boolean",
          "default": "false",
          "notNull": false,
          "ordinal": 4,
          "isIdentity": false
        },
        {
          "name": "created_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": false,
          "ordinal": 5,
          "isIdentity": false
        },
        {
          "name": "overlay_color",
          "type": "text",
          "default": "'black'::text",
          "notNull": true,
          "ordinal": 6,
          "isIdentity": false
        },
        {
          "name": "overlay_opacity",
          "type": "integer",
          "default": "10",
          "notNull": true,
          "ordinal": 7,
          "isIdentity": false
        },
        {
          "name": "category",
          "type": "text",
          "default": "'Uncategorized'::text",
          "notNull": true,
          "ordinal": 8,
          "isIdentity": false
        },
        {
          "name": "sort_order",
          "type": "integer",
          "default": "0",
          "notNull": true,
          "ordinal": 9,
          "isIdentity": false
        }
      ],
      "comment": null,
      "policies": [
        {
          "name": "Users can delete own sidebar backgrounds",
          "roles": null,
          "using": "(auth.uid() = user_id)",
          "command": "DELETE",
          "withCheck": null,
          "permissive": true
        },
        {
          "name": "Users can insert own sidebar backgrounds",
          "roles": null,
          "using": null,
          "command": "INSERT",
          "withCheck": "(auth.uid() = user_id)",
          "permissive": true
        },
        {
          "name": "Users can update own sidebar backgrounds",
          "roles": null,
          "using": "(auth.uid() = user_id)",
          "command": "UPDATE",
          "withCheck": null,
          "permissive": true
        },
        {
          "name": "Users can view own sidebar backgrounds",
          "roles": null,
          "using": "(auth.uid() = user_id)",
          "command": "SELECT",
          "withCheck": null,
          "permissive": true
        }
      ],
      "triggers": [],
      "primaryKey": [
        "id"
      ],
      "rlsEnabled": true,
      "foreignKeys": [],
      "approxRowCount": 7,
      "checkConstraints": [],
      "uniqueConstraints": []
    },
    {
      "name": "stories",
      "grants": [
        {
          "grantee": "anon",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "authenticated",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "postgres",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "sandbox_exec",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "sandbox_exec_gialzvvswxadxolnwots",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "service_role",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        }
      ],
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "default": "gen_random_uuid()",
          "notNull": true,
          "ordinal": 1,
          "isIdentity": false
        },
        {
          "name": "user_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 2,
          "isIdentity": false
        },
        {
          "name": "title",
          "type": "text",
          "default": "'Untitled Story'::text",
          "notNull": true,
          "ordinal": 3,
          "isIdentity": false
        },
        {
          "name": "description",
          "type": "text",
          "default": "''::text",
          "notNull": false,
          "ordinal": 4,
          "isIdentity": false
        },
        {
          "name": "cover_image_url",
          "type": "text",
          "default": "''::text",
          "notNull": false,
          "ordinal": 5,
          "isIdentity": false
        },
        {
          "name": "tags",
          "type": "text[]",
          "default": "'{}'::text[]",
          "notNull": false,
          "ordinal": 6,
          "isIdentity": false
        },
        {
          "name": "world_core",
          "type": "jsonb",
          "default": "'{}'::jsonb",
          "notNull": true,
          "ordinal": 7,
          "isIdentity": false
        },
        {
          "name": "ui_settings",
          "type": "jsonb",
          "default": "'{\"darkMode\": false, \"showBackgrounds\": true, \"transparentBubbles\": false}'::jsonb",
          "notNull": false,
          "ordinal": 8,
          "isIdentity": false
        },
        {
          "name": "opening_dialog",
          "type": "jsonb",
          "default": "'{\"text\": \"\", \"enabled\": true}'::jsonb",
          "notNull": false,
          "ordinal": 9,
          "isIdentity": false
        },
        {
          "name": "selected_model",
          "type": "text",
          "default": "'grok-4-1-fast-reasoning'::text",
          "notNull": false,
          "ordinal": 10,
          "isIdentity": false
        },
        {
          "name": "version",
          "type": "integer",
          "default": "3",
          "notNull": false,
          "ordinal": 11,
          "isIdentity": false
        },
        {
          "name": "created_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": false,
          "ordinal": 12,
          "isIdentity": false
        },
        {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": false,
          "ordinal": 13,
          "isIdentity": false
        },
        {
          "name": "cover_image_position",
          "type": "jsonb",
          "default": "'{\"x\": 50, \"y\": 50}'::jsonb",
          "notNull": false,
          "ordinal": 14,
          "isIdentity": false
        },
        {
          "name": "selected_art_style",
          "type": "text",
          "default": "'cinematic-2-5d'::text",
          "notNull": false,
          "ordinal": 15,
          "isIdentity": false
        },
        {
          "name": "is_draft",
          "type": "boolean",
          "default": "false",
          "notNull": true,
          "ordinal": 16,
          "isIdentity": false
        },
        {
          "name": "nav_button_images",
          "type": "jsonb",
          "default": "'{}'::jsonb",
          "notNull": false,
          "ordinal": 17,
          "isIdentity": false
        }
      ],
      "comment": null,
      "policies": [
        {
          "name": "Users can create own stories",
          "roles": [
            "authenticated"
          ],
          "using": null,
          "command": "INSERT",
          "withCheck": "(auth.uid() = user_id)",
          "permissive": true
        },
        {
          "name": "Users can delete own stories",
          "roles": [
            "authenticated"
          ],
          "using": "(auth.uid() = user_id)",
          "command": "DELETE",
          "withCheck": null,
          "permissive": true
        },
        {
          "name": "Users can update own stories",
          "roles": [
            "authenticated"
          ],
          "using": "(auth.uid() = user_id)",
          "command": "UPDATE",
          "withCheck": null,
          "permissive": true
        },
        {
          "name": "Users can view own or published stories",
          "roles": [
            "authenticated"
          ],
          "using": "((auth.uid() = user_id) OR (EXISTS ( SELECT 1\n   FROM published_scenarios ps\n  WHERE ((ps.scenario_id = stories.id) AND (ps.is_published = true) AND (ps.is_hidden = false)))))",
          "command": "SELECT",
          "withCheck": null,
          "permissive": true
        }
      ],
      "triggers": [
        {
          "name": "update_scenarios_updated_at",
          "events": [
            "UPDATE"
          ],
          "timing": "BEFORE",
          "function": "update_updated_at_column"
        }
      ],
      "primaryKey": [
        "id"
      ],
      "rlsEnabled": true,
      "foreignKeys": [
        {
          "name": "scenarios_user_id_fkey",
          "columns": [
            "user_id"
          ],
          "onDelete": "CASCADE",
          "onUpdate": "NO ACTION",
          "refTable": "users",
          "refSchema": "auth",
          "refColumns": [
            "id"
          ]
        }
      ],
      "approxRowCount": 7,
      "checkConstraints": [],
      "uniqueConstraints": []
    },
    {
      "name": "story_goal_step_derivations",
      "grants": [
        {
          "grantee": "anon",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "authenticated",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "postgres",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "sandbox_exec",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "sandbox_exec_gialzvvswxadxolnwots",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "service_role",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        }
      ],
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "default": "gen_random_uuid()",
          "notNull": true,
          "ordinal": 1,
          "isIdentity": false
        },
        {
          "name": "user_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 2,
          "isIdentity": false
        },
        {
          "name": "conversation_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 3,
          "isIdentity": false
        },
        {
          "name": "source_message_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 4,
          "isIdentity": false
        },
        {
          "name": "source_generation_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 5,
          "isIdentity": false
        },
        {
          "name": "goal_id",
          "type": "text",
          "default": null,
          "notNull": true,
          "ordinal": 6,
          "isIdentity": false
        },
        {
          "name": "step_id",
          "type": "text",
          "default": null,
          "notNull": true,
          "ordinal": 7,
          "isIdentity": false
        },
        {
          "name": "completed",
          "type": "boolean",
          "default": "true",
          "notNull": true,
          "ordinal": 8,
          "isIdentity": false
        },
        {
          "name": "day",
          "type": "integer",
          "default": null,
          "notNull": false,
          "ordinal": 9,
          "isIdentity": false
        },
        {
          "name": "time_of_day",
          "type": "text",
          "default": null,
          "notNull": false,
          "ordinal": 10,
          "isIdentity": false
        },
        {
          "name": "created_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": true,
          "ordinal": 11,
          "isIdentity": false
        }
      ],
      "comment": null,
      "policies": [
        {
          "name": "Users can delete own goal step derivations",
          "roles": null,
          "using": "(auth.uid() = user_id)",
          "command": "DELETE",
          "withCheck": null,
          "permissive": true
        },
        {
          "name": "Users can insert own goal step derivations",
          "roles": null,
          "using": null,
          "command": "INSERT",
          "withCheck": "(auth.uid() = user_id)",
          "permissive": true
        },
        {
          "name": "Users can update own goal step derivations",
          "roles": null,
          "using": "(auth.uid() = user_id)",
          "command": "UPDATE",
          "withCheck": null,
          "permissive": true
        },
        {
          "name": "Users can view own goal step derivations",
          "roles": null,
          "using": "(auth.uid() = user_id)",
          "command": "SELECT",
          "withCheck": null,
          "permissive": true
        }
      ],
      "triggers": [],
      "primaryKey": [
        "id"
      ],
      "rlsEnabled": true,
      "foreignKeys": [
        {
          "name": "story_goal_step_derivations_conversation_id_fkey",
          "columns": [
            "conversation_id"
          ],
          "onDelete": "CASCADE",
          "onUpdate": "NO ACTION",
          "refTable": "conversations",
          "refSchema": "public",
          "refColumns": [
            "id"
          ]
        },
        {
          "name": "story_goal_step_derivations_source_message_id_fkey",
          "columns": [
            "source_message_id"
          ],
          "onDelete": "CASCADE",
          "onUpdate": "NO ACTION",
          "refTable": "messages",
          "refSchema": "public",
          "refColumns": [
            "id"
          ]
        }
      ],
      "approxRowCount": -1,
      "checkConstraints": [],
      "uniqueConstraints": []
    },
    {
      "name": "user_backgrounds",
      "grants": [
        {
          "grantee": "anon",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "authenticated",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "postgres",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "sandbox_exec",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "sandbox_exec_gialzvvswxadxolnwots",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "service_role",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        }
      ],
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "default": "gen_random_uuid()",
          "notNull": true,
          "ordinal": 1,
          "isIdentity": false
        },
        {
          "name": "user_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 2,
          "isIdentity": false
        },
        {
          "name": "image_url",
          "type": "text",
          "default": null,
          "notNull": true,
          "ordinal": 3,
          "isIdentity": false
        },
        {
          "name": "is_selected",
          "type": "boolean",
          "default": "false",
          "notNull": false,
          "ordinal": 4,
          "isIdentity": false
        },
        {
          "name": "created_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": false,
          "ordinal": 5,
          "isIdentity": false
        },
        {
          "name": "image_library_selected",
          "type": "boolean",
          "default": "false",
          "notNull": false,
          "ordinal": 6,
          "isIdentity": false
        },
        {
          "name": "overlay_color",
          "type": "text",
          "default": "'black'::text",
          "notNull": true,
          "ordinal": 7,
          "isIdentity": false
        },
        {
          "name": "overlay_opacity",
          "type": "integer",
          "default": "10",
          "notNull": true,
          "ordinal": 8,
          "isIdentity": false
        },
        {
          "name": "category",
          "type": "text",
          "default": "'Uncategorized'::text",
          "notNull": true,
          "ordinal": 9,
          "isIdentity": false
        },
        {
          "name": "sort_order",
          "type": "integer",
          "default": "0",
          "notNull": true,
          "ordinal": 10,
          "isIdentity": false
        }
      ],
      "comment": null,
      "policies": [
        {
          "name": "Users can delete own backgrounds",
          "roles": null,
          "using": "(auth.uid() = user_id)",
          "command": "DELETE",
          "withCheck": null,
          "permissive": true
        },
        {
          "name": "Users can insert own backgrounds",
          "roles": null,
          "using": null,
          "command": "INSERT",
          "withCheck": "(auth.uid() = user_id)",
          "permissive": true
        },
        {
          "name": "Users can update own backgrounds",
          "roles": null,
          "using": "(auth.uid() = user_id)",
          "command": "UPDATE",
          "withCheck": null,
          "permissive": true
        },
        {
          "name": "Users can view own backgrounds",
          "roles": null,
          "using": "(auth.uid() = user_id)",
          "command": "SELECT",
          "withCheck": null,
          "permissive": true
        }
      ],
      "triggers": [],
      "primaryKey": [
        "id"
      ],
      "rlsEnabled": true,
      "foreignKeys": [],
      "approxRowCount": 1,
      "checkConstraints": [],
      "uniqueConstraints": []
    },
    {
      "name": "user_roles",
      "grants": [
        {
          "grantee": "anon",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "authenticated",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "postgres",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "sandbox_exec",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "sandbox_exec_gialzvvswxadxolnwots",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "service_role",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        }
      ],
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "default": "gen_random_uuid()",
          "notNull": true,
          "ordinal": 1,
          "isIdentity": false
        },
        {
          "name": "user_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 2,
          "isIdentity": false
        },
        {
          "name": "role",
          "type": "app_role",
          "default": null,
          "notNull": true,
          "ordinal": 3,
          "isIdentity": false
        }
      ],
      "comment": null,
      "policies": [
        {
          "name": "Admins can view all roles",
          "roles": [
            "authenticated"
          ],
          "using": "has_role(auth.uid(), 'admin'::app_role)",
          "command": "SELECT",
          "withCheck": null,
          "permissive": true
        },
        {
          "name": "Users can view own roles",
          "roles": [
            "authenticated"
          ],
          "using": "(user_id = auth.uid())",
          "command": "SELECT",
          "withCheck": null,
          "permissive": true
        }
      ],
      "triggers": [],
      "primaryKey": [
        "id"
      ],
      "rlsEnabled": true,
      "foreignKeys": [
        {
          "name": "user_roles_user_id_fkey",
          "columns": [
            "user_id"
          ],
          "onDelete": "CASCADE",
          "onUpdate": "NO ACTION",
          "refTable": "users",
          "refSchema": "auth",
          "refColumns": [
            "id"
          ]
        }
      ],
      "approxRowCount": -1,
      "checkConstraints": [],
      "uniqueConstraints": [
        {
          "name": "user_roles_user_id_role_key",
          "columns": [
            "user_id",
            "role"
          ]
        }
      ]
    },
    {
      "name": "user_strikes",
      "grants": [
        {
          "grantee": "anon",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "authenticated",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "postgres",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        },
        {
          "grantee": "sandbox_exec",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "sandbox_exec_gialzvvswxadxolnwots",
          "privileges": [
            "INSERT",
            "SELECT"
          ]
        },
        {
          "grantee": "service_role",
          "privileges": [
            "DELETE",
            "INSERT",
            "MAINTAIN",
            "REFERENCES",
            "SELECT",
            "TRIGGER",
            "TRUNCATE",
            "UPDATE"
          ]
        }
      ],
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "default": "gen_random_uuid()",
          "notNull": true,
          "ordinal": 1,
          "isIdentity": false
        },
        {
          "name": "user_id",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 2,
          "isIdentity": false
        },
        {
          "name": "reason",
          "type": "text",
          "default": null,
          "notNull": true,
          "ordinal": 3,
          "isIdentity": false
        },
        {
          "name": "issued_by",
          "type": "uuid",
          "default": null,
          "notNull": true,
          "ordinal": 4,
          "isIdentity": false
        },
        {
          "name": "expires_at",
          "type": "timestamp with time zone",
          "default": null,
          "notNull": false,
          "ordinal": 5,
          "isIdentity": false
        },
        {
          "name": "created_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": true,
          "ordinal": 6,
          "isIdentity": false
        },
        {
          "name": "report_id",
          "type": "uuid",
          "default": null,
          "notNull": false,
          "ordinal": 7,
          "isIdentity": false
        },
        {
          "name": "points",
          "type": "integer",
          "default": "1",
          "notNull": false,
          "ordinal": 8,
          "isIdentity": false
        },
        {
          "name": "note",
          "type": "text",
          "default": "''::text",
          "notNull": false,
          "ordinal": 9,
          "isIdentity": false
        },
        {
          "name": "status",
          "type": "text",
          "default": "'active'::text",
          "notNull": false,
          "ordinal": 10,
          "isIdentity": false
        },
        {
          "name": "issued_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": false,
          "ordinal": 11,
          "isIdentity": false
        },
        {
          "name": "falls_off_at",
          "type": "date",
          "default": null,
          "notNull": false,
          "ordinal": 12,
          "isIdentity": false
        },
        {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "default": "now()",
          "notNull": false,
          "ordinal": 13,
          "isIdentity": false
        }
      ],
      "comment": null,
      "policies": [
        {
          "name": "Admins can manage user strikes",
          "roles": [
            "authenticated"
          ],
          "using": "has_role(auth.uid(), 'admin'::app_role)",
          "command": "ALL",
          "withCheck": "has_role(auth.uid(), 'admin'::app_role)",
          "permissive": true
        },
        {
          "name": "Users can view own strikes",
          "roles": [
            "authenticated"
          ],
          "using": "(auth.uid() = user_id)",
          "command": "SELECT",
          "withCheck": null,
          "permissive": true
        }
      ],
      "triggers": [
        {
          "name": "trg_user_strikes_updated_at",
          "events": [
            "UPDATE"
          ],
          "timing": "BEFORE",
          "function": "set_updated_at_finance_live_tables"
        }
      ],
      "primaryKey": [
        "id"
      ],
      "rlsEnabled": true,
      "foreignKeys": [],
      "approxRowCount": -1,
      "checkConstraints": [],
      "uniqueConstraints": []
    }
  ],
  "functions": [
    {
      "name": "fetch_gallery_scenarios",
      "config": [
        "search_path=public"
      ],
      "language": "plpgsql",
      "arguments": "p_search_text text DEFAULT NULL::text, p_search_tags text[] DEFAULT NULL::text[], p_sort_by text DEFAULT 'recent'::text, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0, p_story_types text[] DEFAULT NULL::text[], p_genres text[] DEFAULT NULL::text[], p_origins text[] DEFAULT NULL::text[], p_trigger_warnings text[] DEFAULT NULL::text[], p_custom_tags text[] DEFAULT NULL::text[], p_publisher_ids uuid[] DEFAULT NULL::uuid[]",
      "definition": "CREATE OR REPLACE FUNCTION public.fetch_gallery_scenarios(p_search_text text DEFAULT NULL::text, p_search_tags text[] DEFAULT NULL::text[], p_sort_by text DEFAULT 'recent'::text, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0, p_story_types text[] DEFAULT NULL::text[], p_genres text[] DEFAULT NULL::text[], p_origins text[] DEFAULT NULL::text[], p_trigger_warnings text[] DEFAULT NULL::text[], p_custom_tags text[] DEFAULT NULL::text[], p_publisher_ids uuid[] DEFAULT NULL::uuid[])\n RETURNS json\n LANGUAGE plpgsql\n STABLE SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\nDECLARE\n  v_result json;\nBEGIN\n  SELECT json_agg(row_data)\n  INTO v_result\n  FROM (\n    SELECT json_build_object(\n      'id', ps.id,\n      'scenario_id', ps.scenario_id,\n      'publisher_id', ps.publisher_id,\n      'allow_remix', ps.allow_remix,\n      'tags', ps.tags,\n      'like_count', ps.like_count,\n      'save_count', ps.save_count,\n      'play_count', ps.play_count,\n      'view_count', ps.view_count,\n      'avg_rating', ps.avg_rating,\n      'review_count', ps.review_count,\n      'is_published', ps.is_published,\n      'created_at', ps.created_at,\n      'updated_at', ps.updated_at,\n      'scenario', json_build_object(\n        'id', s.id,\n        'title', s.title,\n        'description', s.description,\n        'cover_image_url', s.cover_image_url,\n        'cover_image_position', s.cover_image_position\n      ),\n      'publisher', json_build_object(\n        'username', p.username,\n        'avatar_url', p.avatar_url,\n        'display_name', p.display_name\n      ),\n      'contentThemes', CASE WHEN ct.id IS NOT NULL THEN json_build_object(\n        'characterTypes', COALESCE(ct.character_types, ARRAY[]::text[]),\n        'storyType', ct.story_type,\n        'genres', COALESCE(ct.genres, ARRAY[]::text[]),\n        'origin', COALESCE(ct.origin, ARRAY[]::text[]),\n        'triggerWarnings', COALESCE(ct.trigger_warnings, ARRAY[]::text[]),\n        'customTags', COALESCE(ct.custom_tags, ARRAY[]::text[])\n      ) ELSE NULL END\n    ) AS row_data\n    FROM published_scenarios ps\n    JOIN stories s ON s.id = ps.scenario_id\n    LEFT JOIN profiles p ON p.id = ps.publisher_id\n    LEFT JOIN content_themes ct ON ct.scenario_id = ps.scenario_id\n    WHERE ps.is_published = true\n      AND ps.is_hidden = false\n      AND (COALESCE(p.hide_published_works,false) = false OR ps.publisher_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))\n      AND (p_search_tags IS NULL OR ps.tags && p_search_tags)\n      AND (p_publisher_ids IS NULL OR ps.publisher_id = ANY(p_publisher_ids))\n      AND (p_story_types IS NULL OR ct.story_type = ANY(p_story_types))\n      AND (p_genres IS NULL OR ct.genres && p_genres)\n      AND (p_origins IS NULL OR ct.origin && p_origins)\n      AND (p_trigger_warnings IS NULL OR ct.trigger_warnings && p_trigger_warnings)\n      AND (p_custom_tags IS NULL OR ct.custom_tags && p_custom_tags)\n      AND (\n        p_search_text IS NULL\n        OR p_search_text = ''\n        OR to_tsvector('english', COALESCE(s.title, '') || ' ' || COALESCE(s.description, '')) @@ plainto_tsquery('english', p_search_text)\n        OR s.title ILIKE '%' || p_search_text || '%'\n        OR s.description ILIKE '%' || p_search_text || '%'\n      )\n    ORDER BY\n      CASE WHEN p_sort_by = 'liked' THEN ps.like_count END DESC NULLS LAST,\n      CASE WHEN p_sort_by = 'saved' THEN ps.save_count END DESC NULLS LAST,\n      CASE WHEN p_sort_by = 'played' THEN ps.play_count END DESC NULLS LAST,\n      CASE WHEN p_sort_by IN ('recent', 'all') THEN ps.created_at END DESC NULLS LAST,\n      ps.created_at DESC\n    LIMIT p_limit\n    OFFSET p_offset\n  ) sub;\n\n  RETURN COALESCE(v_result, '[]'::json);\nEND;\n$function$\n",
      "returnType": "json",
      "volatility": "STABLE",
      "securityDefiner": true
    },
    {
      "name": "get_creator_stats",
      "config": [
        "search_path=public"
      ],
      "language": "plpgsql",
      "arguments": "creator_user_id uuid",
      "definition": "// See migration 20260614 (profile-privacy-enforcement). plpgsql STABLE SECURITY DEFINER. Returns zeros for published_count/total_likes/total_saves/total_views/total_plays when target profile.hide_published_works = true and caller is not owner/admin; follower_count remains public. Otherwise returns aggregate counts from published_scenarios where is_published AND NOT is_hidden plus follower_count from creator_follows.",
      "returnType": "TABLE(published_count bigint, total_likes bigint, total_saves bigint, total_views bigint, total_plays bigint, follower_count bigint)",
      "volatility": "STABLE",
      "securityDefiner": true
    },
    {
      "name": "get_public_profiles",
      "config": [
        "search_path=public"
      ],
      "language": "sql",
      "arguments": "p_user_ids uuid[]",
      "definition": "STABLE SECURITY DEFINER. Returns id, username, display_name, avatar_url, avatar_position, hide_profile_details, hide_published_works for the requested user ids. Username/display_name/avatar_url/avatar_position are nulled out when hide_profile_details = true. EXECUTE revoked from PUBLIC and granted to authenticated and anon. Added by 20260614 profile-privacy-enforcement migration.",
      "returnType": "TABLE(id uuid, username text, display_name text, avatar_url text, avatar_position jsonb, hide_profile_details boolean, hide_published_works boolean)",
      "volatility": "STABLE",
      "securityDefiner": true
    },
    {
      "name": "get_public_creator_profile",
      "config": [
        "search_path=public"
      ],
      "language": "plpgsql",
      "arguments": "p_user_id uuid",
      "definition": "STABLE SECURITY DEFINER. Returns a single jsonb document for the requested creator. Owner and admin always receive the full profile plus a works array. When hide_profile_details = true and caller is not owner/admin, returns only {id, hide_profile_details:true, hide_published_works:true}. When hide_published_works = true and caller is not owner/admin, returns the profile shell with works = []. Otherwise returns profile (id, username, display_name, avatar_url, avatar_position, about_me, preferred_genres, hide_profile_details, hide_published_works) plus jsonb_agg of public works (id, scenario_id, like_count, save_count, play_count, view_count, allow_remix, created_at, scenario_title, scenario_description, scenario_cover_image_url, scenario_cover_image_position, story_type). EXECUTE revoked from PUBLIC and granted to authenticated and anon. Added by 20260614 profile-privacy-enforcement migration.",
      "returnType": "jsonb",
      "volatility": "STABLE",
      "securityDefiner": true
    },
    {
      "name": "get_folders_with_details",
      "config": [
        "search_path=public"
      ],
      "language": "sql",
      "arguments": "",
      "definition": "CREATE OR REPLACE FUNCTION public.get_folders_with_details()\n RETURNS TABLE(id uuid, user_id uuid, name text, description text, thumbnail_image_id uuid, thumbnail_url text, image_count bigint, created_at timestamp with time zone, updated_at timestamp with time zone)\n LANGUAGE sql\n STABLE SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\n  SELECT\n    f.id,\n    f.user_id,\n    f.name,\n    f.description,\n    f.thumbnail_image_id,\n    COALESCE(\n      thumb.image_url,\n      first_img.image_url\n    ) AS thumbnail_url,\n    COALESCE(cnt.c, 0) AS image_count,\n    f.created_at,\n    f.updated_at\n  FROM image_folders f\n  LEFT JOIN library_images thumb\n    ON thumb.id = f.thumbnail_image_id\n  LEFT JOIN LATERAL (\n    SELECT li.image_url\n    FROM library_images li\n    WHERE li.folder_id = f.id\n    ORDER BY li.created_at ASC\n    LIMIT 1\n  ) first_img ON f.thumbnail_image_id IS NULL\n  LEFT JOIN LATERAL (\n    SELECT count(*) AS c\n    FROM library_images li\n    WHERE li.folder_id = f.id\n  ) cnt ON true\n  WHERE f.user_id = auth.uid()\n  ORDER BY f.updated_at DESC;\n$function$\n",
      "returnType": "TABLE(id uuid, user_id uuid, name text, description text, thumbnail_image_id uuid, thumbnail_url text, image_count bigint, created_at timestamp with time zone, updated_at timestamp with time zone)",
      "volatility": "STABLE",
      "securityDefiner": true
    },
    {
      "name": "get_folders_with_details",
      "config": [
        "search_path=public"
      ],
      "language": "sql",
      "arguments": "p_user_id uuid",
      "definition": "CREATE OR REPLACE FUNCTION public.get_folders_with_details(p_user_id uuid)\n RETURNS TABLE(id uuid, user_id uuid, name text, description text, thumbnail_image_id uuid, thumbnail_url text, image_count bigint, created_at timestamp with time zone, updated_at timestamp with time zone)\n LANGUAGE sql\n STABLE SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\n  SELECT\n    f.id,\n    f.user_id,\n    f.name,\n    f.description,\n    f.thumbnail_image_id,\n    COALESCE(\n      thumb.image_url,\n      first_img.image_url\n    ) AS thumbnail_url,\n    COALESCE(cnt.c, 0) AS image_count,\n    f.created_at,\n    f.updated_at\n  FROM image_folders f\n  LEFT JOIN library_images thumb\n    ON thumb.id = f.thumbnail_image_id\n  LEFT JOIN LATERAL (\n    SELECT li.image_url\n    FROM library_images li\n    WHERE li.folder_id = f.id\n    ORDER BY li.created_at ASC\n    LIMIT 1\n  ) first_img ON f.thumbnail_image_id IS NULL\n  LEFT JOIN LATERAL (\n    SELECT count(*) AS c\n    FROM library_images li\n    WHERE li.folder_id = f.id\n  ) cnt ON true\n  WHERE f.user_id = p_user_id\n  ORDER BY f.updated_at DESC;\n$function$\n",
      "returnType": "TABLE(id uuid, user_id uuid, name text, description text, thumbnail_image_id uuid, thumbnail_url text, image_count bigint, created_at timestamp with time zone, updated_at timestamp with time zone)",
      "volatility": "STABLE",
      "securityDefiner": true
    },
    {
      "name": "handle_new_user",
      "config": [
        "search_path=public"
      ],
      "language": "plpgsql",
      "arguments": "",
      "definition": "CREATE OR REPLACE FUNCTION public.handle_new_user()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\nDECLARE\n  random_name text;\nBEGIN\n  random_name := 'User' || substr(md5(random()::text), 1, 8);\n  INSERT INTO public.profiles (id, username, display_name)\n  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'username', random_name);\n  RETURN NEW;\nEND;\n$function$\n",
      "returnType": "trigger",
      "volatility": "VOLATILE",
      "securityDefiner": true
    },
    {
      "name": "has_role",
      "config": [
        "search_path=public"
      ],
      "language": "sql",
      "arguments": "_user_id uuid, _role app_role",
      "definition": "CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)\n RETURNS boolean\n LANGUAGE sql\n STABLE SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\n  SELECT EXISTS (\n    SELECT 1 FROM public.user_roles\n    WHERE user_id = _user_id AND role = _role\n  )\n$function$\n",
      "returnType": "boolean",
      "volatility": "STABLE",
      "securityDefiner": true
    },
    {
      "name": "can_read_scene_storage_object",
      "config": [
        "search_path=public"
      ],
      "language": "plpgsql",
      "arguments": "p_path text",
      "definition": "STABLE SECURITY DEFINER predicate added by migrations 20260614100132 and 20260614110123. Returns true when caller is the owner segment of the path, OR caller has app_role 'admin', OR there exists a public.scenes row with image_path = p_path whose parent scenario is published (is_published=true AND is_hidden=false) and whose publisher's profile does not have hide_published_works=true. Used exclusively by the 'Owners admins or published scenes can view' storage.objects policy on the private scenes bucket to gate signed-URL minting and direct object reads.",
      "returnType": "boolean",
      "volatility": "STABLE",
      "securityDefiner": true
    },
    {
      "name": "record_scenario_view",
      "config": [
        "search_path=public"
      ],
      "language": "plpgsql",
      "arguments": "p_published_scenario_id uuid",
      "definition": "CREATE OR REPLACE FUNCTION public.record_scenario_view(p_published_scenario_id uuid)\n RETURNS void\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\nDECLARE\n  v_user_id uuid := auth.uid();\nBEGIN\n  IF v_user_id IS NULL THEN\n    RAISE EXCEPTION 'Unauthorized';\n  END IF;\n\n  -- Check if user viewed this in the last 24 hours\n  IF EXISTS (\n    SELECT 1 FROM scenario_views\n    WHERE published_scenario_id = p_published_scenario_id\n      AND user_id = v_user_id\n      AND viewed_at > now() - interval '24 hours'\n  ) THEN\n    RETURN; -- Already viewed recently, do nothing\n  END IF;\n\n  -- Insert new view record\n  INSERT INTO scenario_views (published_scenario_id, user_id)\n  VALUES (p_published_scenario_id, v_user_id);\n\n  -- Increment the count\n  UPDATE published_scenarios\n  SET view_count = view_count + 1, updated_at = now()\n  WHERE id = p_published_scenario_id;\nEND;\n$function$\n",
      "returnType": "void",
      "volatility": "VOLATILE",
      "securityDefiner": true
    },
    {
      "name": "record_scenario_play",
      "config": ["search_path=public"],
      "language": "plpgsql",
      "arguments": "p_published_scenario_id uuid",
      "definition": "CREATE OR REPLACE FUNCTION public.record_scenario_play(p_published_scenario_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$ DECLARE v_user_id uuid := auth.uid(); BEGIN IF v_user_id IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF; IF NOT EXISTS (SELECT 1 FROM public.published_scenarios WHERE id = p_published_scenario_id AND is_published = true AND is_hidden = false) THEN RAISE EXCEPTION 'Scenario not available'; END IF; IF EXISTS (SELECT 1 FROM public.scenario_plays WHERE published_scenario_id = p_published_scenario_id AND user_id = v_user_id AND played_at > now() - interval '5 minutes') THEN RETURN; END IF; INSERT INTO public.scenario_plays (published_scenario_id, user_id) VALUES (p_published_scenario_id, v_user_id); END; $function$",
      "returnType": "void",
      "volatility": "VOLATILE",
      "securityDefiner": true
    },
    {
      "name": "sync_published_scenario_like_count",
      "config": ["search_path=public"],
      "language": "plpgsql",
      "arguments": "",
      "definition": "Trigger function: AFTER INSERT OR DELETE on public.scenario_likes; sets published_scenarios.like_count = count(*) from scenario_likes for the affected published_scenario_id.",
      "returnType": "trigger",
      "volatility": "VOLATILE",
      "securityDefiner": true
    },
    {
      "name": "sync_published_scenario_save_count",
      "config": ["search_path=public"],
      "language": "plpgsql",
      "arguments": "",
      "definition": "Trigger function: AFTER INSERT OR DELETE on public.saved_scenarios; sets published_scenarios.save_count = count(*) from saved_scenarios for the affected published_scenario_id.",
      "returnType": "trigger",
      "volatility": "VOLATILE",
      "securityDefiner": true
    },
    {
      "name": "sync_published_scenario_play_count",
      "config": ["search_path=public"],
      "language": "plpgsql",
      "arguments": "",
      "definition": "Trigger function: AFTER INSERT OR DELETE on public.scenario_plays; sets published_scenarios.play_count = count(*) from scenario_plays for the affected published_scenario_id.",
      "returnType": "trigger",
      "volatility": "VOLATILE",
      "securityDefiner": true
    },
    {
      "name": "save_scenario_atomic",
      "config": [
        "search_path=public"
      ],
      "language": "plpgsql",
      "arguments": "p_scenario_id uuid, p_user_id uuid, p_story jsonb, p_characters jsonb DEFAULT '[]'::jsonb, p_codex_entries jsonb DEFAULT '[]'::jsonb, p_scenes jsonb DEFAULT '[]'::jsonb",
      "definition": "CREATE OR REPLACE FUNCTION public.save_scenario_atomic(p_scenario_id uuid, p_user_id uuid, p_story jsonb, p_characters jsonb DEFAULT '[]'::jsonb, p_codex_entries jsonb DEFAULT '[]'::jsonb, p_scenes jsonb DEFAULT '[]'::jsonb)\n RETURNS void\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\nDECLARE\n  char_record jsonb;\n  codex_record jsonb;\n  scene_record jsonb;\n  incoming_char_ids uuid[];\n  incoming_codex_ids uuid[];\n  incoming_scene_ids uuid[];\n  v_story_existed boolean := false;\n  v_rows integer;\n  v_id uuid;\nBEGIN\n  -- Auth gate\n  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN\n    RAISE EXCEPTION 'Unauthorized';\n  END IF;\n\n  -- Pre-flight: reject if scenario exists and belongs to another user\n  PERFORM 1 FROM public.stories\n    WHERE id = p_scenario_id AND user_id <> p_user_id;\n  IF FOUND THEN\n    RAISE EXCEPTION 'Unauthorized: scenario owned by another user';\n  END IF;\n\n  -- Track whether story already existed (owned by caller)\n  SELECT EXISTS(\n    SELECT 1 FROM public.stories WHERE id = p_scenario_id AND user_id = p_user_id\n  ) INTO v_story_existed;\n\n  -- 1. Upsert the story record (guarded)\n  INSERT INTO stories (\n    id, user_id, title, description, cover_image_url, cover_image_position,\n    tags, world_core, ui_settings, opening_dialog, selected_model,\n    selected_art_style, version, is_draft, nav_button_images\n  ) VALUES (\n    p_scenario_id,\n    p_user_id,\n    COALESCE(p_story->>'title', 'Untitled Story'),\n    COALESCE(p_story->>'description', ''),\n    COALESCE(p_story->>'cover_image_url', ''),\n    COALESCE((p_story->'cover_image_position')::jsonb, '{\"x\":50,\"y\":50}'::jsonb),\n    COALESCE(ARRAY(SELECT jsonb_array_elements_text(p_story->'tags')), '{}'::text[]),\n    COALESCE((p_story->'world_core')::jsonb, '{}'::jsonb),\n    COALESCE((p_story->'ui_settings')::jsonb, '{\"darkMode\":false,\"showBackgrounds\":true,\"transparentBubbles\":false}'::jsonb),\n    COALESCE((p_story->'opening_dialog')::jsonb, '{\"text\":\"\",\"enabled\":true}'::jsonb),\n    p_story->>'selected_model',\n    COALESCE(p_story->>'selected_art_style', 'cinematic-2-5d'),\n    COALESCE((p_story->>'version')::int, 3),\n    COALESCE((p_story->>'is_draft')::boolean, false),\n    COALESCE((p_story->'nav_button_images')::jsonb, '{}'::jsonb)\n  )\n  ON CONFLICT (id) DO UPDATE SET\n    title = EXCLUDED.title,\n    description = EXCLUDED.description,\n    cover_image_url = EXCLUDED.cover_image_url,\n    cover_image_position = EXCLUDED.cover_image_position,\n    tags = EXCLUDED.tags,\n    world_core = EXCLUDED.world_core,\n    ui_settings = EXCLUDED.ui_settings,\n    opening_dialog = EXCLUDED.opening_dialog,\n    selected_model = EXCLUDED.selected_model,\n    selected_art_style = EXCLUDED.selected_art_style,\n    version = EXCLUDED.version,\n    is_draft = EXCLUDED.is_draft,\n    nav_button_images = EXCLUDED.nav_button_images,\n    updated_at = now()\n  WHERE public.stories.user_id = p_user_id;\n\n  GET DIAGNOSTICS v_rows = ROW_COUNT;\n  IF v_story_existed AND v_rows = 0 THEN\n    RAISE EXCEPTION 'Unauthorized: story ownership guard blocked update for scenario %', p_scenario_id;\n  END IF;\n\n  -- 2. Sync characters: delete removed, upsert current (guarded)\n  SELECT ARRAY(SELECT (elem->>'id')::uuid FROM jsonb_array_elements(p_characters) AS elem)\n    INTO incoming_char_ids;\n\n  DELETE FROM characters\n    WHERE scenario_id = p_scenario_id\n    AND id != ALL(incoming_char_ids);\n\n  FOR char_record IN SELECT * FROM jsonb_array_elements(p_characters) LOOP\n    v_id := (char_record->>'id')::uuid;\n    INSERT INTO characters (\n      id, user_id, scenario_id, name, nicknames, age, sex_type, sexual_orientation,\n      location, current_mood, controlled_by, character_role, role_description,\n      tags, avatar_url, avatar_position, physical_appearance, currently_wearing,\n      preferred_clothing, personality, goals, background, tone, key_life_events,\n      relationships, secrets, fears, sections, is_library\n    ) VALUES (\n      v_id,\n      p_user_id,\n      p_scenario_id,\n      COALESCE(char_record->>'name', ''),\n      COALESCE(char_record->>'nicknames', ''),\n      COALESCE(char_record->>'age', ''),\n      char_record->>'sex_type',\n      COALESCE(char_record->>'sexual_orientation', ''),\n      COALESCE(char_record->>'location', ''),\n      COALESCE(char_record->>'current_mood', ''),\n      char_record->>'controlled_by',\n      char_record->>'character_role',\n      COALESCE(char_record->>'role_description', ''),\n      char_record->>'tags',\n      char_record->>'avatar_url',\n      COALESCE((char_record->'avatar_position')::jsonb, '{\"x\":50,\"y\":50}'::jsonb),\n      COALESCE((char_record->'physical_appearance')::jsonb, '{}'::jsonb),\n      COALESCE((char_record->'currently_wearing')::jsonb, '{}'::jsonb),\n      COALESCE((char_record->'preferred_clothing')::jsonb, '{}'::jsonb),\n      (char_record->'personality')::jsonb,\n      COALESCE((char_record->'goals')::jsonb, '[]'::jsonb),\n      COALESCE((char_record->'background')::jsonb, '{}'::jsonb),\n      COALESCE((char_record->'tone')::jsonb, '{}'::jsonb),\n      COALESCE((char_record->'key_life_events')::jsonb, '{}'::jsonb),\n      COALESCE((char_record->'relationships')::jsonb, '{}'::jsonb),\n      COALESCE((char_record->'secrets')::jsonb, '{}'::jsonb),\n      COALESCE((char_record->'fears')::jsonb, '{}'::jsonb),\n      COALESCE((char_record->'sections')::jsonb, '[]'::jsonb),\n      COALESCE((char_record->>'is_library')::boolean, false)\n    )\n    ON CONFLICT (id) DO UPDATE SET\n      name = EXCLUDED.name,\n      nicknames = EXCLUDED.nicknames,\n      age = EXCLUDED.age,\n      sex_type = EXCLUDED.sex_type,\n      sexual_orientation = EXCLUDED.sexual_orientation,\n      location = EXCLUDED.location,\n      current_mood = EXCLUDED.current_mood,\n      controlled_by = EXCLUDED.controlled_by,\n      character_role = EXCLUDED.character_role,\n      role_description = EXCLUDED.role_description,\n      tags = EXCLUDED.tags,\n      avatar_url = EXCLUDED.avatar_url,\n      avatar_position = EXCLUDED.avatar_position,\n      physical_appearance = EXCLUDED.physical_appearance,\n      currently_wearing = EXCLUDED.currently_wearing,\n      preferred_clothing = EXCLUDED.preferred_clothing,\n      personality = EXCLUDED.personality,\n      goals = EXCLUDED.goals,\n      background = EXCLUDED.background,\n      tone = EXCLUDED.tone,\n      key_life_events = EXCLUDED.key_life_events,\n      relationships = EXCLUDED.relationships,\n      secrets = EXCLUDED.secrets,\n      fears = EXCLUDED.fears,\n      sections = EXCLUDED.sections,\n      is_library = EXCLUDED.is_library,\n      updated_at = now()\n    WHERE public.characters.user_id = p_user_id\n      AND public.characters.scenario_id = p_scenario_id;\n\n    GET DIAGNOSTICS v_rows = ROW_COUNT;\n    IF v_rows = 0 THEN\n      RAISE EXCEPTION 'Unauthorized: characters row % blocked by ownership guard', v_id;\n    END IF;\n  END LOOP;\n\n  -- 3. Sync codex entries: delete removed, upsert current (guarded)\n  SELECT ARRAY(SELECT (elem->>'id')::uuid FROM jsonb_array_elements(p_codex_entries) AS elem)\n    INTO incoming_codex_ids;\n\n  DELETE FROM codex_entries\n    WHERE scenario_id = p_scenario_id\n    AND id != ALL(incoming_codex_ids);\n\n  FOR codex_record IN SELECT * FROM jsonb_array_elements(p_codex_entries) LOOP\n    v_id := (codex_record->>'id')::uuid;\n    INSERT INTO codex_entries (id, scenario_id, title, body)\n    VALUES (\n      v_id,\n      p_scenario_id,\n      COALESCE(codex_record->>'title', ''),\n      COALESCE(codex_record->>'body', '')\n    )\n    ON CONFLICT (id) DO UPDATE SET\n      title = EXCLUDED.title,\n      body = EXCLUDED.body,\n      updated_at = now()\n    WHERE public.codex_entries.scenario_id = p_scenario_id;\n\n    GET DIAGNOSTICS v_rows = ROW_COUNT;\n    IF v_rows = 0 THEN\n      RAISE EXCEPTION 'Unauthorized: codex_entries row % blocked by ownership guard', v_id;\n    END IF;\n  END LOOP;\n\n  -- 4. Sync scenes: delete removed, upsert current (guarded)\n  SELECT ARRAY(SELECT (elem->>'id')::uuid FROM jsonb_array_elements(p_scenes) AS elem)\n    INTO incoming_scene_ids;\n\n  DELETE FROM scenes\n    WHERE scenario_id = p_scenario_id\n    AND id != ALL(incoming_scene_ids);\n\n  FOR scene_record IN SELECT * FROM jsonb_array_elements(p_scenes) LOOP\n    v_id := (scene_record->>'id')::uuid;\n    INSERT INTO scenes (id, scenario_id, image_url, tags, is_starting_scene)\n    VALUES (\n      v_id,\n      p_scenario_id,\n      scene_record->>'image_url',\n      COALESCE(ARRAY(SELECT jsonb_array_elements_text(scene_record->'tags')), '{}'::text[]),\n      COALESCE((scene_record->>'is_starting_scene')::boolean, false)\n    )\n    ON CONFLICT (id) DO UPDATE SET\n      image_url = EXCLUDED.image_url,\n      tags = EXCLUDED.tags,\n      is_starting_scene = EXCLUDED.is_starting_scene\n    WHERE public.scenes.scenario_id = p_scenario_id;\n\n    GET DIAGNOSTICS v_rows = ROW_COUNT;\n    IF v_rows = 0 THEN\n      RAISE EXCEPTION 'Unauthorized: scenes row % blocked by ownership guard', v_id;\n    END IF;\n  END LOOP;\nEND;\n$function$\n\n",
      "returnType": "void",
      "volatility": "VOLATILE",
      "securityDefiner": true
    },
    {
      "name": "set_admin_access",
      "config": [
        "search_path=public"
      ],
      "language": "plpgsql",
      "arguments": "_target_user_id uuid, _enabled boolean",
      "definition": "CREATE OR REPLACE FUNCTION public.set_admin_access(_target_user_id uuid, _enabled boolean)\n RETURNS void\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\nBEGIN\n  IF NOT public.has_role(auth.uid(), 'admin') THEN\n    RAISE EXCEPTION 'Only admins can modify admin access';\n  END IF;\n\n  IF _enabled THEN\n    INSERT INTO public.user_roles (user_id, role)\n    VALUES (_target_user_id, 'admin')\n    ON CONFLICT (user_id, role) DO NOTHING;\n  ELSE\n    DELETE FROM public.user_roles\n    WHERE user_id = _target_user_id\n      AND role = 'admin';\n  END IF;\n\n  INSERT INTO public.app_settings (setting_key, setting_value, updated_by)\n  VALUES ('user_admin_access_' || _target_user_id::text, to_jsonb(_enabled), auth.uid())\n  ON CONFLICT (setting_key) DO UPDATE\n  SET setting_value = EXCLUDED.setting_value,\n      updated_by = EXCLUDED.updated_by,\n      updated_at = now();\nEND;\n$function$\n",
      "returnType": "void",
      "volatility": "VOLATILE",
      "securityDefiner": true
    },
    {
      "name": "set_updated_at_finance_live_tables",
      "config": [
        "search_path=public"
      ],
      "language": "plpgsql",
      "arguments": "",
      "definition": "CREATE OR REPLACE FUNCTION public.set_updated_at_finance_live_tables()\n RETURNS trigger\n LANGUAGE plpgsql\n SET search_path TO 'public'\nAS $function$\nBEGIN\n  NEW.updated_at = now();\n  RETURN NEW;\nEND;\n$function$\n",
      "returnType": "trigger",
      "volatility": "VOLATILE",
      "securityDefiner": false
    },
    {
      "name": "update_review_aggregates",
      "config": [
        "search_path=public"
      ],
      "language": "plpgsql",
      "arguments": "",
      "definition": "CREATE OR REPLACE FUNCTION public.update_review_aggregates()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\nDECLARE\n  target_id uuid;\nBEGIN\n  IF TG_OP = 'DELETE' THEN\n    target_id := OLD.published_scenario_id;\n  ELSE\n    target_id := NEW.published_scenario_id;\n  END IF;\n\n  UPDATE published_scenarios\n  SET\n    review_count = (SELECT COUNT(*) FROM scenario_reviews WHERE published_scenario_id = target_id),\n    avg_rating = COALESCE((SELECT AVG(raw_weighted_score) FROM scenario_reviews WHERE published_scenario_id = target_id), 0),\n    updated_at = now()\n  WHERE id = target_id;\n\n  IF TG_OP = 'DELETE' THEN\n    RETURN OLD;\n  END IF;\n  RETURN NEW;\nEND;\n$function$\n",
      "returnType": "trigger",
      "volatility": "VOLATILE",
      "securityDefiner": true
    },
    {
      "name": "update_updated_at_column",
      "config": [
        "search_path=public"
      ],
      "language": "plpgsql",
      "arguments": "",
      "definition": "CREATE OR REPLACE FUNCTION public.update_updated_at_column()\n RETURNS trigger\n LANGUAGE plpgsql\n SET search_path TO 'public'\nAS $function$\nBEGIN\n  NEW.updated_at = NOW();\n  RETURN NEW;\nEND;\n$function$\n",
      "returnType": "trigger",
      "volatility": "VOLATILE",
      "securityDefiner": false
    },
    {
      "name": "validate_review_ratings",
      "config": [
        "search_path=public"
      ],
      "language": "plpgsql",
      "arguments": "",
      "definition": "CREATE OR REPLACE FUNCTION public.validate_review_ratings()\n RETURNS trigger\n LANGUAGE plpgsql\n SET search_path TO 'public'\nAS $function$\nBEGIN\n  IF NEW.concept_strength < 1 OR NEW.concept_strength > 5\n    OR NEW.initial_situation < 1 OR NEW.initial_situation > 5\n    OR NEW.role_clarity < 1 OR NEW.role_clarity > 5\n    OR NEW.motivation_tension < 1 OR NEW.motivation_tension > 5\n    OR NEW.tone_promise < 1 OR NEW.tone_promise > 5\n    OR NEW.low_friction_start < 1 OR NEW.low_friction_start > 5\n    OR NEW.worldbuilding_vibe < 1 OR NEW.worldbuilding_vibe > 5\n    OR NEW.replayability < 1 OR NEW.replayability > 5\n    OR NEW.character_details_complexity < 1 OR NEW.character_details_complexity > 5\n    OR NEW.spice_level < 1 OR NEW.spice_level > 5\n  THEN\n    RAISE EXCEPTION 'All ratings must be between 1 and 5';\n  END IF;\n  RETURN NEW;\nEND;\n$function$\n",
      "returnType": "trigger",
      "volatility": "VOLATILE",
      "securityDefiner": false
    }
  ],
  "enums": [
    {
      "name": "app_role",
      "values": [
        "admin",
        "moderator",
        "user"
      ]
    }
  ],
  "storage": {
    "buckets": [
      {
        "id": "avatars",
        "name": "avatars",
        "public": true,
        "createdAt": "2026-01-16T06:02:07.392815+00:00",
        "fileSizeLimit": null,
        "allowedMimeTypes": null
      },
      {
        "id": "backgrounds",
        "name": "backgrounds",
        "public": true,
        "createdAt": "2026-01-17T10:54:49.094765+00:00",
        "fileSizeLimit": null,
        "allowedMimeTypes": null
      },
      {
        "id": "covers",
        "name": "covers",
        "public": true,
        "createdAt": "2026-01-16T07:40:08.009965+00:00",
        "fileSizeLimit": null,
        "allowedMimeTypes": null
      },
      {
        "id": "finance_documents",
        "name": "finance_documents",
        "public": false,
        "createdAt": "2026-04-04T03:31:44.706989+00:00",
        "fileSizeLimit": null,
        "allowedMimeTypes": null
      },
      {
        "id": "guide_images",
        "name": "guide_images",
        "public": true,
        "createdAt": "2026-02-22T08:35:06.613503+00:00",
        "fileSizeLimit": null,
        "allowedMimeTypes": null
      },
      {
        "id": "image_library",
        "name": "image_library",
        "public": false,
        "createdAt": "2026-01-29T06:15:59.051603+00:00",
        "fileSizeLimit": null,
        "allowedMimeTypes": null
      },
      {
        "id": "scenes",
        "name": "scenes",
        "public": false,
        "createdAt": "2026-01-16T06:02:07.392815+00:00",
        "fileSizeLimit": null,
        "allowedMimeTypes": null
      }
    ],
    "policies": [
      {
        "name": "Admins can delete finance docs",
        "roles": [
          "authenticated"
        ],
        "using": "((bucket_id = 'finance_documents'::text) AND has_role(auth.uid(), 'admin'::app_role))",
        "command": "DELETE",
        "withCheck": null
      },
      {
        "name": "Admins can read finance docs",
        "roles": [
          "authenticated"
        ],
        "using": "((bucket_id = 'finance_documents'::text) AND has_role(auth.uid(), 'admin'::app_role))",
        "command": "SELECT",
        "withCheck": null
      },
      {
        "name": "Admins can update finance docs",
        "roles": [
          "authenticated"
        ],
        "using": "((bucket_id = 'finance_documents'::text) AND has_role(auth.uid(), 'admin'::app_role))",
        "command": "UPDATE",
        "withCheck": null
      },
      {
        "name": "Admins can upload finance docs",
        "roles": [
          "authenticated"
        ],
        "using": null,
        "command": "INSERT",
        "withCheck": "((bucket_id = 'finance_documents'::text) AND has_role(auth.uid(), 'admin'::app_role))"
      },
      {
        "name": "Anyone can read guide images",
        "roles": null,
        "using": "(bucket_id = 'guide_images'::text)",
        "command": "SELECT",
        "withCheck": null
      },
      {
        "name": "Anyone can view avatars",
        "roles": null,
        "using": "(bucket_id = 'avatars'::text)",
        "command": "SELECT",
        "withCheck": null
      },
      {
        "name": "Anyone can view backgrounds",
        "roles": null,
        "using": "(bucket_id = 'backgrounds'::text)",
        "command": "SELECT",
        "withCheck": null
      },
      {
        "name": "Owners admins or published scenes can view",
        "roles": null,
        "using": "((bucket_id = 'scenes'::text) AND can_read_scene_storage_object(name))",
        "command": "SELECT",
        "withCheck": null
      },
      {
        "name": "Authenticated users can delete own guide images",
        "roles": [
          "authenticated"
        ],
        "using": "((bucket_id = 'guide_images'::text) AND ((auth.uid())::text = (storage.foldername(name))[1]))",
        "command": "DELETE",
        "withCheck": null
      },
      {
        "name": "Authenticated users can upload guide images",
        "roles": [
          "authenticated"
        ],
        "using": null,
        "command": "INSERT",
        "withCheck": "(bucket_id = 'guide_images'::text)"
      },
      {
        "name": "Public can view covers",
        "roles": null,
        "using": "(bucket_id = 'covers'::text)",
        "command": "SELECT",
        "withCheck": null
      },
      {
        "name": "Users can delete own avatars",
        "roles": null,
        "using": "((bucket_id = 'avatars'::text) AND ((auth.uid())::text = (storage.foldername(name))[1]))",
        "command": "DELETE",
        "withCheck": null
      },
      {
        "name": "Users can delete own backgrounds",
        "roles": null,
        "using": "((bucket_id = 'backgrounds'::text) AND ((auth.uid())::text = (storage.foldername(name))[1]))",
        "command": "DELETE",
        "withCheck": null
      },
      {
        "name": "Users can delete own image_library files",
        "roles": null,
        "using": "((bucket_id = 'image_library'::text) AND ((auth.uid())::text = (storage.foldername(name))[1]))",
        "command": "DELETE",
        "withCheck": null
      },
      {
        "name": "Users can delete own scenes",
        "roles": null,
        "using": "((bucket_id = 'scenes'::text) AND ((auth.uid())::text = (storage.foldername(name))[1]))",
        "command": "DELETE",
        "withCheck": null
      },
      {
        "name": "Users can delete their covers",
        "roles": [
          "authenticated"
        ],
        "using": "((bucket_id = 'covers'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text))",
        "command": "DELETE",
        "withCheck": null
      },
      {
        "name": "Users can update own avatars",
        "roles": null,
        "using": "((bucket_id = 'avatars'::text) AND ((auth.uid())::text = (storage.foldername(name))[1]))",
        "command": "UPDATE",
        "withCheck": null
      },
      {
        "name": "Users can update own backgrounds",
        "roles": null,
        "using": "((bucket_id = 'backgrounds'::text) AND ((auth.uid())::text = (storage.foldername(name))[1]))",
        "command": "UPDATE",
        "withCheck": null
      },
      {
        "name": "Users can update own scenes",
        "roles": null,
        "using": "((bucket_id = 'scenes'::text) AND ((auth.uid())::text = (storage.foldername(name))[1]))",
        "command": "UPDATE",
        "withCheck": null
      },
      {
        "name": "Users can update their covers",
        "roles": [
          "authenticated"
        ],
        "using": "((bucket_id = 'covers'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text))",
        "command": "UPDATE",
        "withCheck": null
      },
      {
        "name": "Users can upload avatars",
        "roles": null,
        "using": null,
        "command": "INSERT",
        "withCheck": "((bucket_id = 'avatars'::text) AND ((auth.uid())::text = (storage.foldername(name))[1]))"
      },
      {
        "name": "Users can upload backgrounds",
        "roles": null,
        "using": null,
        "command": "INSERT",
        "withCheck": "((bucket_id = 'backgrounds'::text) AND ((auth.uid())::text = (storage.foldername(name))[1]))"
      },
      {
        "name": "Users can upload covers",
        "roles": [
          "authenticated"
        ],
        "using": null,
        "command": "INSERT",
        "withCheck": "((bucket_id = 'covers'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text))"
      },
      {
        "name": "Users can upload scenes",
        "roles": null,
        "using": null,
        "command": "INSERT",
        "withCheck": "((bucket_id = 'scenes'::text) AND ((auth.uid())::text = (storage.foldername(name))[1]))"
      },
      {
        "name": "Users can upload to image_library",
        "roles": null,
        "using": null,
        "command": "INSERT",
        "withCheck": "((bucket_id = 'image_library'::text) AND ((auth.uid())::text = (storage.foldername(name))[1]))"
      },
      {
        "name": "Owners can view own image_library",
        "roles": null,
        "using": "((bucket_id = 'image_library'::text) AND (((auth.uid())::text = (storage.foldername(name))[1]) OR has_role(auth.uid(), 'admin'::app_role)))",
        "command": "SELECT",
        "withCheck": null
      }
    ]
  },
  "edgeFunctions": [
    {
      "name": "admin-ai-usage-summary",
      "path": "supabase/functions/admin-ai-usage-summary/index.ts",
      "status": "present"
    },
    {
      "name": "admin-ai-usage-timeseries",
      "path": "supabase/functions/admin-ai-usage-timeseries/index.ts",
      "status": "present"
    },
    {
      "name": "admin-api-usage-test-report",
      "path": "supabase/functions/admin-api-usage-test-report/index.ts",
      "status": "present"
    },
    {
      "name": "api-usage-test-session",
      "path": "supabase/functions/api-usage-test-session/index.ts",
      "status": "present"
    },
    {
      "name": "chat",
      "path": "supabase/functions/chat/index.ts",
      "status": "present"
    },
    {
      "name": "check-shared-keys",
      "path": "supabase/functions/check-shared-keys/index.ts",
      "status": "present"
    },
    {
      "name": "compress-day-memories",
      "path": "supabase/functions/compress-day-memories/index.ts",
      "status": "present"
    },
    {
      "name": "evaluate-goal-alignment",
      "path": "supabase/functions/evaluate-goal-alignment/index.ts",
      "status": "present"
    },
    {
      "name": "evaluate-goal-progress",
      "path": "supabase/functions/evaluate-goal-progress/index.ts",
      "status": "present"
    },
    {
      "name": "extract-character-updates",
      "path": "supabase/functions/extract-character-updates/index.ts",
      "status": "present"
    },
    {
      "name": "extract-memory-events",
      "path": "supabase/functions/extract-memory-events/index.ts",
      "status": "present"
    },
    {
      "name": "generate-cover-image",
      "path": "supabase/functions/generate-cover-image/index.ts",
      "status": "present"
    },
    {
      "name": "generate-scene-image",
      "path": "supabase/functions/generate-scene-image/index.ts",
      "status": "present"
    },
    {
      "name": "generate-side-character",
      "path": "supabase/functions/generate-side-character/index.ts",
      "status": "present"
    },
    {
      "name": "generate-side-character-avatar",
      "path": "supabase/functions/generate-side-character-avatar/index.ts",
      "status": "present"
    },
    {
      "name": "migrate-base64-images",
      "path": "supabase/functions/migrate-base64-images/index.ts",
      "status": "present"
    },
    {
      "name": "sync-guide-to-github",
      "path": "supabase/functions/sync-guide-to-github/index.ts",
      "status": "present"
    },
    {
      "name": "track-ai-usage",
      "path": "supabase/functions/track-ai-usage/index.ts",
      "status": "present"
    },
    {
      "name": "track-api-usage-test",
      "path": "supabase/functions/track-api-usage-test/index.ts",
      "status": "present"
    },
    {
      "name": "xai-billing-balance",
      "path": "supabase/functions/xai-billing-balance/index.ts",
      "status": "present"
    }
  ],
  "verification": {
    "tablesCount": 43,
    "functionsCount": 19,
    "enumsCount": 1,
    "storageBucketsCount": 7,
    "storagePoliciesCount": 26,
    "edgeFunctionsCount": 20,
    "rowCountsNote": "approxRowCount from pg_class.reltuples; -1 means never analyzed (needs_verification)",
    "grantsCount": 258,
    "functionDefinitionsIncluded": true
  }
} as const;
