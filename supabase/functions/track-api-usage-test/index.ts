import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

type TraceEventPayload = {
  sessionId?: string | null;
  eventKey: string;
  apiCallGroup?: string | null;
  eventSource?: string;
  modelId?: string | null;
  inputChars?: number;
  outputChars?: number;
  inputTokensEst?: number;
  outputTokensEst?: number;
  totalTokensEst?: number;
  estCostUsd?: number;
  latencyMs?: number | null;
  status?: string;
  metadata?: Record<string, unknown>;
};

const MAX_EVENT_KEY = 80;
const MAX_CALL_GROUP = 40;
const MAX_SOURCE = 64;
const MAX_MODEL = 80;

function toNonNegativeInt(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.floor(num));
}

function toNonNegativeFloat(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, num);
}

function normalizeMetadata(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  return input as Record<string, unknown>;
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
    const body = (await req.json().catch(() => ({}))) as Partial<TraceEventPayload>;

    const eventKey = typeof body.eventKey === "string" ? body.eventKey.trim().slice(0, MAX_EVENT_KEY) : "";
    if (!eventKey) {
      return new Response(JSON.stringify({ error: "eventKey is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    let resolvedSessionId = typeof body.sessionId === "string" && body.sessionId.trim() ? body.sessionId.trim() : null;

    if (!resolvedSessionId) {
      const { data: active } = await serviceClient
        .from("ai_usage_test_sessions")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      resolvedSessionId = active?.id ?? null;
    }

    // No active test session = no-op (intended behavior)
    if (!resolvedSessionId) {
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: "no_active_session" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: sessionRow, error: sessionError } = await serviceClient
      .from("ai_usage_test_sessions")
      .select("id, status, user_id")
      .eq("id", resolvedSessionId)
      .maybeSingle();

    if (sessionError || !sessionRow || sessionRow.user_id !== user.id || sessionRow.status !== "active") {
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: "invalid_or_inactive_session" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const inputTokensEst = toNonNegativeInt(body.inputTokensEst);
    const outputTokensEst = toNonNegativeInt(body.outputTokensEst);
    const totalTokensEst = body.totalTokensEst != null
      ? toNonNegativeInt(body.totalTokensEst)
      : inputTokensEst + outputTokensEst;

    const apiCallGroup =
      typeof body.apiCallGroup === "string" && body.apiCallGroup.trim()
        ? body.apiCallGroup.trim().slice(0, MAX_CALL_GROUP)
        : null;
    const eventSource =
      typeof body.eventSource === "string" && body.eventSource.trim()
        ? body.eventSource.trim().slice(0, MAX_SOURCE)
        : "client";
    const modelId =
      typeof body.modelId === "string" && body.modelId.trim()
        ? body.modelId.trim().slice(0, MAX_MODEL)
        : null;
    const status =
      typeof body.status === "string" && body.status.trim()
        ? body.status.trim().slice(0, 32)
        : "ok";

    const insertPayload = {
      session_id: resolvedSessionId,
      user_id: user.id,
      event_key: eventKey,
      api_call_group: apiCallGroup,
      event_source: eventSource,
      model_id: modelId,
      input_chars: toNonNegativeInt(body.inputChars),
      output_chars: toNonNegativeInt(body.outputChars),
      input_tokens_est: inputTokensEst,
      output_tokens_est: outputTokensEst,
      total_tokens_est: totalTokensEst,
      est_cost_usd: toNonNegativeFloat(body.estCostUsd),
      latency_ms: body.latencyMs == null ? null : toNonNegativeInt(body.latencyMs),
      status,
      metadata: normalizeMetadata(body.metadata),
    };

    const { error: insertError } = await serviceClient
      .from("ai_usage_test_events")
      .insert(insertPayload);

    if (insertError) {
      console.error("[track-api-usage-test] Insert failed:", insertError);
      return new Response(JSON.stringify({ error: "Failed to insert trace event" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, skipped: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[track-api-usage-test] Error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
