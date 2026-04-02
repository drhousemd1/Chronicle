import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

type Action = "start" | "stop" | "get";

type StartPayload = {
  scenarioId?: string | null;
  scenarioName?: string | null;
  conversationId?: string | null;
  conversationName?: string | null;
  metadata?: Record<string, unknown>;
};

type StopPayload = {
  sessionId?: string | null;
};

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function normalizeMetadata(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  return input as Record<string, unknown>;
}

function mapSession(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    scenarioId: row.scenario_id,
    scenarioName: row.scenario_name,
    conversationId: row.conversation_id,
    conversationName: row.conversation_name,
    status: row.status,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    metadata: row.metadata || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(req) });
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Supabase env not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const accessToken = authHeader.replace("Bearer ", "");
    const { data: userResult, error: userError } = await authClient.auth.getUser(accessToken);
    if (userError || !userResult?.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user = userResult.user;
    const { data: isAdmin, error: roleError } = await authClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (roleError || !isAdmin) {
      if (roleError) {
        console.error("[api-usage-test-session] Role check failed:", roleError);
      }
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const action = (typeof body?.action === "string" ? body.action : "get") as Action;

    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    if (action === "get") {
      const { data, error } = await serviceClient
        .from("ai_usage_test_sessions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("[api-usage-test-session] Failed to fetch active session:", error);
        return new Response(JSON.stringify({
          error: "Failed to fetch active session",
          details: error.message ?? null,
          code: error.code ?? null,
          hint: error.details ?? null,
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ session: data ? mapSession(data) : null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "stop") {
      const payload = body as StopPayload;
      const sessionId = typeof payload.sessionId === "string" ? payload.sessionId : null;

      let targetId = sessionId;
      if (!targetId) {
        const { data: active, error: activeError } = await serviceClient
          .from("ai_usage_test_sessions")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "active")
          .order("started_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (activeError) {
          console.error("[api-usage-test-session] Failed to resolve active session for stop:", activeError);
          return new Response(JSON.stringify({
            error: "Failed to resolve active session",
            details: activeError.message ?? null,
            code: activeError.code ?? null,
            hint: activeError.details ?? null,
          }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        targetId = active?.id ?? null;
      }

      if (!targetId) {
        return new Response(JSON.stringify({ ok: true, session: null }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: updated, error: updateError } = await serviceClient
        .from("ai_usage_test_sessions")
        .update({ status: "ended", ended_at: new Date().toISOString() })
        .eq("id", targetId)
        .eq("user_id", user.id)
        .select("*")
        .maybeSingle();

      if (updateError) {
        console.error("[api-usage-test-session] Failed to stop test session:", updateError);
        return new Response(JSON.stringify({
          error: "Failed to stop test session",
          details: updateError.message ?? null,
          code: updateError.code ?? null,
          hint: updateError.details ?? null,
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ ok: true, session: updated ? mapSession(updated) : null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "start") {
      const payload = body as StartPayload;
      const incomingScenarioId = typeof payload.scenarioId === "string" && payload.scenarioId.trim()
        ? payload.scenarioId.trim()
        : null;
      const incomingScenarioName = (payload.scenarioName || "").slice(0, 200);
      const incomingConversationId = typeof payload.conversationId === "string" && payload.conversationId.trim()
        ? payload.conversationId.trim()
        : null;
      const incomingConversationName = (payload.conversationName || "").slice(0, 200);
      const incomingMetadata = normalizeMetadata(payload.metadata);
      const localScenarioId = incomingScenarioId && !isUuid(incomingScenarioId) ? incomingScenarioId : null;
      const localConversationId = incomingConversationId && !isUuid(incomingConversationId) ? incomingConversationId : null;

      let resolvedScenarioId: string | null = null;
      if (incomingScenarioId && isUuid(incomingScenarioId)) {
        const { data: scenarioRow, error: scenarioError } = await serviceClient
          .from("stories")
          .select("id")
          .eq("id", incomingScenarioId)
          .maybeSingle();
        if (scenarioError) {
          console.error("[api-usage-test-session] Failed to validate scenario id:", scenarioError);
        } else if (scenarioRow?.id) {
          resolvedScenarioId = scenarioRow.id;
        }
      }

      let resolvedConversationId: string | null = null;
      if (incomingConversationId && isUuid(incomingConversationId)) {
        const { data: conversationRow, error: conversationError } = await serviceClient
          .from("conversations")
          .select("id")
          .eq("id", incomingConversationId)
          .maybeSingle();
        if (conversationError) {
          console.error("[api-usage-test-session] Failed to validate conversation id:", conversationError);
        } else if (conversationRow?.id) {
          resolvedConversationId = conversationRow.id;
        }
      }

      const enrichedMetadata: Record<string, unknown> = {
        ...incomingMetadata,
      };
      if (localScenarioId) {
        enrichedMetadata.localScenarioId = localScenarioId;
      }
      if (localConversationId) {
        enrichedMetadata.localConversationId = localConversationId;
      }
      if (incomingScenarioId && !resolvedScenarioId && isUuid(incomingScenarioId)) {
        enrichedMetadata.unresolvedScenarioId = incomingScenarioId;
      }
      if (incomingConversationId && !resolvedConversationId && isUuid(incomingConversationId)) {
        enrichedMetadata.unresolvedConversationId = incomingConversationId;
      }

      // Resolve any active session first so we can resume by scenario when appropriate.
      const { data: activeSession, error: activeSessionError } = await serviceClient
        .from("ai_usage_test_sessions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeSessionError) {
        console.error("[api-usage-test-session] Failed to resolve active session:", activeSessionError);
        return new Response(JSON.stringify({
          error: "Failed to resolve active session",
          details: activeSessionError.message ?? null,
          code: activeSessionError.code ?? null,
          hint: activeSessionError.details ?? null,
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Resume the current session when the same scenario is already active.
      const activeMetadata = normalizeMetadata(activeSession?.metadata || {});
      const activeLocalScenarioId = typeof activeMetadata.localScenarioId === "string"
        ? activeMetadata.localScenarioId
        : null;
      const sameScenario = Boolean(
        activeSession &&
        (
          (resolvedScenarioId && activeSession.scenario_id === resolvedScenarioId) ||
          (!resolvedScenarioId && localScenarioId && activeSession.scenario_id === null && activeLocalScenarioId === localScenarioId)
        )
      );

      if (sameScenario && activeSession) {
        const mergedMetadata = { ...activeMetadata, ...enrichedMetadata };
        const shouldUpdateConversation =
          activeSession.conversation_id !== resolvedConversationId ||
          activeSession.conversation_name !== incomingConversationName;
        const shouldUpdateMetadata = JSON.stringify(activeSession.metadata || {}) !== JSON.stringify(mergedMetadata);
        const shouldUpdateScenarioName = activeSession.scenario_name !== incomingScenarioName;

        if (shouldUpdateConversation || shouldUpdateMetadata || shouldUpdateScenarioName) {
          const { data: updated, error: updateError } = await serviceClient
            .from("ai_usage_test_sessions")
            .update({
              scenario_name: incomingScenarioName || activeSession.scenario_name,
              conversation_id: resolvedConversationId,
              conversation_name: incomingConversationName,
              metadata: mergedMetadata,
            })
            .eq("id", activeSession.id)
            .eq("user_id", user.id)
            .select("*")
            .single();

          if (updateError) {
            console.error("[api-usage-test-session] Failed to refresh active session context:", updateError);
            return new Response(JSON.stringify({
              error: "Failed to refresh active session context",
              details: updateError.message ?? null,
              code: updateError.code ?? null,
              hint: updateError.details ?? null,
            }), {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          return new Response(JSON.stringify({ ok: true, session: mapSession(updated) }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ ok: true, session: mapSession(activeSession) }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Different active scenario: close it before starting a fresh test trace.
      if (activeSession) {
        await serviceClient
          .from("ai_usage_test_sessions")
          .update({ status: "ended", ended_at: new Date().toISOString() })
          .eq("id", activeSession.id)
          .eq("user_id", user.id);
      }

      const insertPayload = {
        user_id: user.id,
        scenario_id: resolvedScenarioId,
        scenario_name: incomingScenarioName,
        conversation_id: resolvedConversationId,
        conversation_name: incomingConversationName,
        status: "active",
        metadata: enrichedMetadata,
      };

      const { data: created, error: createError } = await serviceClient
        .from("ai_usage_test_sessions")
        .insert(insertPayload)
        .select("*")
        .single();

      if (createError) {
        console.error("[api-usage-test-session] Failed to start test session:", createError);
        return new Response(JSON.stringify({
          error: "Failed to start test session",
          details: createError.message ?? null,
          code: createError.code ?? null,
          hint: createError.details ?? null,
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ ok: true, session: mapSession(created) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unsupported action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[api-usage-test-session] Error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
