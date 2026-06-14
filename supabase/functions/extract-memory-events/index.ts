// ============================================================================
// GROK ONLY -- All memory extraction uses xAI Grok. No Gemini. No OpenAI.
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { shouldReturnAdminDebugTrace } from "../_shared/admin-debug.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { checkRateLimit, getRateLimitHeaders } from "../_shared/rate-limit.ts";
import { recordServerAiUsage } from "../_shared/server-usage.ts";
import { callXaiResponses, extractXaiResponsesText, getXaiResponsesBodyError } from "../_shared/xai-responses.ts";

const MEMORY_POINT_MAX_CHARS = 140;
const SUPPORT_REASONING_EFFORT = "medium" as const;
const SUPPORT_STORE = false;
const SUPPORT_RATE_LIMIT_WINDOW_MS = 60_000;
const SUPPORT_RATE_LIMIT_MAX = 30;

function trimAtWordBoundary(value: string, maxChars: number): string {
  if (value.length <= maxChars) return value;
  const clipped = value.slice(0, Math.max(0, maxChars - 3)).trimEnd();
  const lastSpace = clipped.lastIndexOf(" ");
  const base = lastSpace > 80 ? clipped.slice(0, lastSpace).trimEnd() : clipped;
  return `${base}...`;
}

function normalizeMemoryPoint(value: string): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  return trimAtWordBoundary(normalized, MEMORY_POINT_MAX_CHARS);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(req) });
  }
  const corsHeaders = getCorsHeaders(req);

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const rateDecision = checkRateLimit({ scope: "extract-memory-events", key: user.id, windowMs: SUPPORT_RATE_LIMIT_WINDOW_MS, max: SUPPORT_RATE_LIMIT_MAX });
    if (!rateDecision.allowed) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded. Please wait before retrying memory extraction.",
          retryAfterSeconds: rateDecision.retryAfterSeconds,
        }),
        { status: 429, headers: { ...corsHeaders, ...getRateLimitHeaders(rateDecision), "Content-Type": "application/json" } }
      );
    }
    const rateHeaders = getRateLimitHeaders(rateDecision);
    const responseHeadersBase = { ...corsHeaders, ...rateHeaders };

    const { messageText, userMessage, aiResponse, characterNames, recentExistingMemories = [], modelId, debugTrace = false } = await req.json();
    const debugTraceAllowed = await shouldReturnAdminDebugTrace(supabase, user.id, debugTrace, "[extract-memory-events]");
    const existingMemoryText = Array.isArray(recentExistingMemories) && recentExistingMemories.length > 0
      ? recentExistingMemories
          .filter((entry: unknown): entry is string => typeof entry === "string" && entry.trim().length > 0)
          .slice(-20)
          .map((entry) => `- ${entry.trim()}`)
          .join("\n")
      : "(none)";
    const exchangeText = [
      userMessage ? `USER MESSAGE:\n${userMessage}` : '',
      aiResponse ? `AI RESPONSE:\n${aiResponse}` : '',
      !userMessage && !aiResponse && messageText ? `MESSAGE:\n${messageText}` : '',
    ].filter(Boolean).join('\n\n---\n\n');
    
    if (!exchangeText) {
      return new Response(
        JSON.stringify({ error: 'userMessage, aiResponse, or messageText is required' }),
        { status: 400, headers: { ...responseHeadersBase, 'Content-Type': 'application/json' } }
      );
    }

    // GROK ONLY -- use xAI API key
    const XAI_API_KEY = Deno.env.get("XAI_API_KEY");
    if (!XAI_API_KEY) {
      throw new Error("XAI_API_KEY is not configured");
    }

    const systemPrompt = `You are a story memory curator for an adult roleplay. Your job is to identify only durable events from the latest user+AI exchange that will affect future scenes and narrative consistency.

CHARACTERS: ${characterNames?.join(', ') || 'Unknown'}

RECENT SAVED MEMORIES:
${existingMemoryText}

--- EXTRACT ---
- Extract only durable facts that would cause future inconsistency if forgotten.
- Include durable facts introduced by the USER even if the AI response did not repeat them.
- Use past tense and include character names.

--- IGNORE ---
- Minor gestures, routine actions, mood-only moments, atmosphere, flirting/buildup without consequence, or lines that do not reveal new information.
- Any event already captured by a recent saved memory, even if the wording is different.

--- RULES ---
- Return 0-3 events maximum.
- Empty array is valid when nothing durable happened.
- Keep each point under 140 characters when possible, but preserve why the fact matters.
- For preferences, intentions, rules, or secrets, state who they belong to.
- If a recent saved memory already preserves the same durable fact, do not return it again.

Return ONLY JSON matching the requested schema.
Empty events are acceptable.`;

    const effectiveModel = modelId === "grok-4.3" ? modelId : "grok-4.3";
    const messages = [
      { role: "system" as const, content: systemPrompt },
      { role: "user" as const, content: `Extract durable story-memory events from this latest exchange:\n\n${exchangeText}` },
    ];
    const responseFormat = {
      type: "json_schema",
      json_schema: {
        name: "chronicle_memory_events",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            events: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["events"],
        },
      },
    };
    const result = await callXaiResponses({
      apiKey: XAI_API_KEY,
      model: effectiveModel,
      messages,
      temperature: 0.3,
      maxOutputTokens: 1024,
      store: SUPPORT_STORE,
      reasoningEffort: SUPPORT_REASONING_EFFORT,
      textFormat: responseFormat,
    });
    const debugPayload = debugTraceAllowed
      ? {
          modelRequest: result.modelRequest,
        }
      : null;

    if (!result.ok) {
      if (result.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later.", ...(debugPayload ? { chronicle_debug_payload: debugPayload } : {}) }),
          { status: 429, headers: { ...responseHeadersBase, "Content-Type": "application/json" } }
        );
      }
      console.error("xAI Responses error:", result.status, result.errorText);
      throw new Error("Failed to extract memory events");
    }

    const data = await result.response.json();
    const bodyError = getXaiResponsesBodyError(data, { requireOutputText: true });
    if (bodyError) {
      console.error("xAI Responses body error:", bodyError);
      return new Response(
        JSON.stringify({
          extractedEvents: [],
          providerBodyError: bodyError,
          ...(debugPayload ? { chronicle_debug_payload: debugPayload } : {}),
        }),
        { headers: { ...responseHeadersBase, 'Content-Type': 'application/json' } }
      );
    }
    const content = extractXaiResponsesText(data);
    
    let extractedEvents: string[] = [];
    let parseError: string | null = null;
    let malformedContent = "";
    try {
      const objectMatch = content.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        const parsed = JSON.parse(objectMatch[0]);
        if (Array.isArray(parsed.events)) {
          extractedEvents = parsed.events;
        } else {
          parseError = "events_not_array";
          malformedContent = content;
        }
      } else {
        parseError = "missing_json_object";
        malformedContent = content;
      }
    } catch (_parseError) {
      console.error("Failed to parse extraction response:", content);
      extractedEvents = [];
      parseError = "parse_error";
      malformedContent = content;
    }

    extractedEvents = extractedEvents
      .filter((e: any) => typeof e === 'string' && e.trim().length > 0)
      .map((e: string) => normalizeMemoryPoint(e))
      .filter((e: string) => e.length > 0)
      .slice(0, 3);

    console.log(`[extract-memory-events] Extracted ${extractedEvents.length} events from latest exchange`);

    await recordServerAiUsage({
      userId: user.id,
      eventType: "memory_extraction_call",
      functionName: "extract-memory-events",
      metadata: {
        modelId: effectiveModel,
        status: parseError ? "parsed_with_rejections" : "success",
        extractedEventCount: extractedEvents.length,
      },
    });
    if (extractedEvents.length > 0) {
      await recordServerAiUsage({
        userId: user.id,
        eventType: "memory_events_extracted",
        functionName: "extract-memory-events",
        count: extractedEvents.length,
        metadata: {
          modelId: effectiveModel,
          status: "success",
        },
      });
    }

    return new Response(
      JSON.stringify({
        extractedEvents,
        ...(parseError ? {
          parseError,
          rejectedEvents: [{
            index: 0,
            accepted: false,
            reason: parseError,
            value: malformedContent.replace(/\s+/g, " ").trim().slice(0, 260),
          }],
        } : {}),
        ...(debugPayload ? { chronicle_debug_payload: debugPayload } : {}),
      }),
      { headers: { ...responseHeadersBase, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in extract-memory-events:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
