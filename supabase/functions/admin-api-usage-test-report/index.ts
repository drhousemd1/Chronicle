import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

type ValidationStatus = "pass" | "fail" | "blank";

function toNum(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    const normalized = item.trim();
    if (!normalized) continue;
    out.push(normalized);
  }
  return Array.from(new Set(out));
}

function applyValidationStatus(current: ValidationStatus, next: ValidationStatus): ValidationStatus {
  if (current === "fail" || next === "fail") return "fail";
  if (current === "pass" || next === "pass") return "pass";
  return "blank";
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

    const body = await req.json().catch(() => ({}));
    const limit = Math.min(200, Math.max(5, Number(body?.limit) || 50));
    const requestedValidationRows = normalizeStringArray(body?.validationRowIds);

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

    const { data: isAdmin } = await authClient.rpc("has_role", {
      _user_id: userResult.user.id,
      _role: "admin",
    });
    if (isAdmin !== true) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: sessions, error: sessionsError } = await serviceClient
      .from("ai_usage_test_sessions")
      .select("id, user_id, scenario_name, conversation_name, status, started_at, ended_at")
      .order("started_at", { ascending: false })
      .limit(limit);

    if (sessionsError) {
      return new Response(JSON.stringify({ error: "Failed to load test sessions" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sessionIds = (sessions || []).map((s) => s.id);
    if (sessionIds.length === 0) {
      const emptyValidationSummary = {
        overall: { pass: 0, fail: 0, blank: requestedValidationRows.length },
        bySession: {},
      };
      return new Response(JSON.stringify({
        fetchedAt: new Date().toISOString(),
        rows: [],
        validationRows: requestedValidationRows,
        validationStatusBySession: {},
        validationSummary: emptyValidationSummary,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: events, error: eventsError } = await serviceClient
      .from("ai_usage_test_events")
      .select("session_id, event_key, event_source, created_at, input_chars, output_chars, total_tokens_est, est_cost_usd, status_code, error_message, metadata")
      .in("session_id", sessionIds);

    if (eventsError) {
      return new Response(JSON.stringify({ error: "Failed to load test events" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const eventsBySession = new Map<string, any[]>();
    for (const row of events || []) {
      const list = eventsBySession.get(row.session_id) || [];
      list.push(row);
      eventsBySession.set(row.session_id, list);
    }

    const validationStatusBySession: Record<string, Record<string, ValidationStatus>> = {};
    for (const session of sessions || []) {
      validationStatusBySession[session.id] = Object.fromEntries(
        requestedValidationRows.map((rowId) => [rowId, "blank" as ValidationStatus])
      );
    }

    for (const sessionEvent of events || []) {
      const metadata = (sessionEvent.metadata && typeof sessionEvent.metadata === "object")
        ? (sessionEvent.metadata as Record<string, unknown>)
        : null;
      if (!metadata || metadata.validationSnapshot !== true) continue;
      const sessionMap = validationStatusBySession[sessionEvent.session_id];
      if (!sessionMap) continue;

      const sentIds = normalizeStringArray(metadata.sentIds);
      const missingIds = normalizeStringArray(metadata.missingIds);

      for (const rowId of sentIds) {
        if (!(rowId in sessionMap)) continue;
        sessionMap[rowId] = applyValidationStatus(sessionMap[rowId], "pass");
      }
      for (const rowId of missingIds) {
        if (!(rowId in sessionMap)) continue;
        sessionMap[rowId] = applyValidationStatus(sessionMap[rowId], "fail");
      }
    }

    const validationSummaryBySession = Object.fromEntries(
      Object.entries(validationStatusBySession).map(([sessionId, map]) => {
        const statuses = Object.values(map);
        const pass = statuses.filter((status) => status === "pass").length;
        const fail = statuses.filter((status) => status === "fail").length;
        const blank = statuses.filter((status) => status === "blank").length;
        return [sessionId, { pass, fail, blank, triggered: pass + fail }];
      })
    );

    const overallValidationSummary = Object.values(validationSummaryBySession).reduce(
      (acc, row) => ({
        pass: acc.pass + row.pass,
        fail: acc.fail + row.fail,
        blank: acc.blank + row.blank,
      }),
      { pass: 0, fail: 0, blank: 0 }
    );

    const isServerAuthoritativeEvent = (event: any): boolean =>
      typeof event?.event_source === "string" && event.event_source.startsWith("server:");

    const isValidationSnapshotEvent = (event: any): boolean => {
      const metadata = event?.metadata;
      return Boolean(
        metadata &&
        typeof metadata === "object" &&
        (metadata as Record<string, unknown>).validationSnapshot === true
      );
    };

    const eventKeyOf = (event: any): string =>
      typeof event?.event_key === "string" ? event.event_key : "";

    const countFromEvent = (event: any): number => {
      const metadata = event?.metadata;
      const count = metadata && typeof metadata === "object" ? toNum((metadata as Record<string, unknown>).eventCount) : 0;
      return count > 0 ? count : 1;
    };

    const statusFromEvent = (event: any): string => {
      const metadata = event?.metadata;
      if (!metadata || typeof metadata !== "object") return "";
      const status = (metadata as Record<string, unknown>).status;
      return typeof status === "string" ? status : "";
    };

    const isSuccessfulGeneratedEvent = (event: any): boolean => {
      if (event?.error_message) return false;
      if (typeof event?.status_code === "number" && event.status_code !== 200) return false;
      const status = statusFromEvent(event);
      const successStatus = !status || status === "success" || status === "fallback_success" || status === "server_authoritative";
      if (!successStatus) return false;

      // Browser diagnostics can outnumber server rows when a request fails before
      // server telemetry is available. Treat client-only chat rows as generated
      // only when they captured assistant output.
      if (!isServerAuthoritativeEvent(event) && eventKeyOf(event) === "chat_call_1") {
        const metadata = event?.metadata && typeof event.metadata === "object"
          ? event.metadata as Record<string, unknown>
          : {};
        return toNum(event?.output_chars) > 0 || toNum(metadata.outputChars) > 0;
      }

      return true;
    };

    const sortByCreatedAt = (a: any, b: any): number => {
      const aTime = Date.parse(typeof a?.created_at === "string" ? a.created_at : "");
      const bTime = Date.parse(typeof b?.created_at === "string" ? b.created_at : "");
      return (Number.isFinite(aTime) ? aTime : 0) - (Number.isFinite(bTime) ? bTime : 0);
    };

    const buildMetricEvents = (sessionEvents: any[]): any[] => {
      const serverEvents = sessionEvents.filter(isServerAuthoritativeEvent);
      const clientEvents = sessionEvents
        .filter((event) => !isServerAuthoritativeEvent(event) && !isValidationSnapshotEvent(event))
        .sort(sortByCreatedAt);
      const serverCountsByKey = new Map<string, number>();
      for (const event of serverEvents) {
        const key = eventKeyOf(event);
        if (!key) continue;
        serverCountsByKey.set(key, (serverCountsByKey.get(key) || 0) + countFromEvent(event));
      }

      const clientCountsSeenByKey = new Map<string, number>();
      const fallbackClientEvents: any[] = [];
      for (const event of clientEvents) {
        const key = eventKeyOf(event);
        if (!key) {
          fallbackClientEvents.push(event);
          continue;
        }

        const eventCount = countFromEvent(event);
        const seenBefore = clientCountsSeenByKey.get(key) || 0;
        const seenAfter = seenBefore + eventCount;
        clientCountsSeenByKey.set(key, seenAfter);

        const trustedServerCount = serverCountsByKey.get(key) || 0;
        if (seenAfter > trustedServerCount) {
          fallbackClientEvents.push(event);
        }
      }

      return [...serverEvents, ...fallbackClientEvents];
    };

    const rows = (sessions || []).map((session) => {
      const sessionEvents = eventsBySession.get(session.id) || [];
      const metricEvents = buildMetricEvents(sessionEvents);
      const totalTokens = metricEvents.reduce((sum, e) => sum + toNum(e.total_tokens_est), 0);
      const totalCost = metricEvents.reduce((sum, e) => sum + toNum(e.est_cost_usd), 0);
      const serverEventCount = sessionEvents.filter(isServerAuthoritativeEvent).length;
      const clientDiagnosticEventCount = sessionEvents.filter((event) =>
        !isServerAuthoritativeEvent(event) && !isValidationSnapshotEvent(event)
      ).length;
      const costedEventCount = metricEvents.filter((event) => toNum(event.est_cost_usd) > 0).length;
      const clientFallbackEventCount = metricEvents.filter((event) => !isServerAuthoritativeEvent(event)).length;

      const countByEventKey = (eventKey: string, options: { successOnly?: boolean } = {}): number =>
        metricEvents
          .filter((event) => event.event_key === eventKey)
          .filter((event) => !options.successOnly || isSuccessfulGeneratedEvent(event))
          .reduce((sum, event) => sum + countFromEvent(event), 0);

      const messagesSent = countByEventKey("chat_call_1");
      const messagesGenerated = metricEvents
        .filter((event) => event.event_key === "chat_call_1" && isSuccessfulGeneratedEvent(event))
        .reduce((sum, event) => sum + countFromEvent(event), 0);

      const sceneImagesGenerated = countByEventKey("scene_image_generated", { successOnly: true });
      const coverImagesGenerated = countByEventKey("cover_image_generated", { successOnly: true });
      const sideCharacterAvatarsGenerated = countByEventKey("side_character_avatar_generated", { successOnly: true });
      const characterAvatarsGenerated = countByEventKey("character_avatar_generated", { successOnly: true });
      const imagesGenerated = sceneImagesGenerated + coverImagesGenerated + sideCharacterAvatarsGenerated + characterAvatarsGenerated;

      return {
        sessionId: session.id,
        sessionName: session.scenario_name || session.conversation_name || "Untitled Session",
        createdAt: session.started_at,
        endedAt: session.ended_at,
        status: session.status || "unknown",
        eventAccountingMode: serverEventCount > 0
          ? clientFallbackEventCount > 0 ? "server_authoritative_with_client_fallback" : "server_authoritative"
          : "client_diagnostic_estimate",
        serverEventCount,
        clientDiagnosticEventCount,
        costedEventCount,
        messagesSent,
        messagesGenerated,
        imagesGenerated,
        aiFillClicks: countByEventKey("character_ai_fill"),
        aiUpdateClicks: countByEventKey("character_card_ai_update"),
        aiEnhanceClicks:
          countByEventKey("character_ai_enhance_precise") +
          countByEventKey("character_ai_enhance_detailed") +
          countByEventKey("world_ai_enhance_precise") +
          countByEventKey("world_ai_enhance_detailed"),
        aiCharacterCards: countByEventKey("side_character_card_generated", { successOnly: true }),
        aiAvatars: sideCharacterAvatarsGenerated + characterAvatarsGenerated,
        cardUpdateCalls: countByEventKey("character_cards_update_call"),
        cardsUpdated: countByEventKey("character_cards_updated"),
        memoryExtractCalls: countByEventKey("memory_extraction_call"),
        memoryEvents: countByEventKey("memory_events_extracted"),
        memoryCompressed: countByEventKey("memory_day_compression_call"),
        memoryBullets: countByEventKey("memory_bullets_compressed"),
        totalTokensEst: totalTokens,
        totalCostEstUsd: Number(totalCost.toFixed(6)),
      };
    });

    return new Response(JSON.stringify({
      fetchedAt: new Date().toISOString(),
      rows,
      validationRows: requestedValidationRows,
      validationStatusBySession,
      validationSummary: {
        overall: overallValidationSummary,
        bySession: validationSummaryBySession,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[admin-api-usage-test-report] Error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
