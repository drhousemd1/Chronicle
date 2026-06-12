// ============================================================================
// GROK ONLY -- All memory compression uses xAI Grok. No Gemini. No OpenAI.
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { callXaiResponses, extractXaiResponsesText, getXaiResponsesBodyError } from "../_shared/xai-responses.ts";

const DAY_SYNOPSIS_MAX_CHARS = 900;
const SUPPORT_REASONING_EFFORT = "medium" as const;
const SUPPORT_STORE = false;

function trimAtWordBoundary(value: string, maxChars: number): string {
  if (value.length <= maxChars) return value;
  const clipped = value.slice(0, Math.max(0, maxChars - 3)).trimEnd();
  const lastSpace = clipped.lastIndexOf(" ");
  const base = lastSpace > 160 ? clipped.slice(0, lastSpace).trimEnd() : clipped;
  return `${base}...`;
}

function normalizeSynopsis(value: string): string {
  const withoutListMarkers = value
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[-*]\s+/, "").trim())
    .filter(Boolean)
    .join(" ");
  const collapsed = withoutListMarkers.replace(/\s+/g, " ").trim();
  const sentences = collapsed.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [collapsed];
  const limitedSentences = sentences.slice(0, 3).join(" ").replace(/\s+/g, " ").trim();
  return trimAtWordBoundary(limitedSentences, DAY_SYNOPSIS_MAX_CHARS);
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

    const { bullets, day, conversationId, debugTrace = false } = await req.json();

    if (!bullets || !Array.isArray(bullets) || bullets.length === 0) {
      return new Response(
        JSON.stringify({ error: 'bullets array is required and must not be empty' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GROK ONLY -- use xAI API key
    const XAI_API_KEY = Deno.env.get("XAI_API_KEY");
    if (!XAI_API_KEY) {
      throw new Error("XAI_API_KEY is not configured");
    }

    const systemPrompt = `You are compressing a list of story memory bullet points from a single day of roleplay into a brief narrative synopsis for long-term storage.

INPUT: An array of bullet point strings from one day.
OUTPUT: A single plain-text synopsis of 2-3 sentences maximum.

Rules:
- Capture only changes, revelations, decisions, and events with future impact.
- Distill the narrative essence of the day.
- Use past tense.
- No bullet points or formatting -- plain prose only.
- Return ONLY the synopsis text, nothing else.`;

    const userMessage = `Compress these Day ${day} memory bullets into a 2-3 sentence synopsis:\n\n${bullets.map((b: string) => `- ${b}`).join('\n')}`;

    const result = await callXaiResponses({
      apiKey: XAI_API_KEY,
      model: "grok-4.3",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.3,
      maxOutputTokens: 350,
      store: SUPPORT_STORE,
      reasoningEffort: SUPPORT_REASONING_EFFORT,
    });
    const debugPayload = debugTrace === true
      ? {
          modelRequest: result.modelRequest,
        }
      : null;

    if (!result.ok) {
      console.error("xAI Responses error:", result.status, result.errorText);
      return new Response(
        JSON.stringify({
          error: "Failed to compress day memories",
          providerBodyError: `xAI Responses HTTP ${result.status}`,
          ...(debugPayload ? { chronicle_debug_payload: debugPayload } : {}),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await result.response.json();
    const bodyError = getXaiResponsesBodyError(data, { requireOutputText: true });
    if (bodyError) {
      console.error("xAI Responses body error:", bodyError);
      return new Response(
        JSON.stringify({
          error: "Failed to compress day memories",
          providerBodyError: bodyError,
          ...(debugPayload ? { chronicle_debug_payload: debugPayload } : {}),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const synopsis = normalizeSynopsis(extractXaiResponsesText(data) || '');

    if (!synopsis) {
      return new Response(
        JSON.stringify({
          error: "Empty synopsis returned from model",
          providerBodyError: "Empty synopsis returned from model",
          ...(debugPayload ? { chronicle_debug_payload: debugPayload } : {}),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[compress-day-memories] Compressed ${bullets.length} bullets from Day ${day} into synopsis`);

    return new Response(
      JSON.stringify({
        synopsis,
        ...(debugPayload ? { chronicle_debug_payload: debugPayload } : {}),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in compress-day-memories:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
