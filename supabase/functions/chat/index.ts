// ============================================================================
// GROK ONLY -- All chat calls go to xAI. No Gemini. No OpenAI.
// This edge function exclusively uses the xAI API for all chat completions.
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { checkRateLimit, getRateLimitHeaders } from "../_shared/rate-limit.ts";

type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type ChatRequest = {
  messages: Message[];
  modelId: string;
  stream?: boolean;
  max_tokens?: number;
};

type XAIResult = { ok: true; response: Response } | { ok: false; status: number; errorText: string };

const CONTENT_REDIRECT_DIRECTIVE = `[CONTENT REDIRECT] The previous user message touched on content the model cannot engage with directly. Continue the roleplay naturally by:
1. Having the character(s) take a CONCRETE, IMMEDIATE action that pivots the scene — NOT a deflection or subject change
2. Maintain the current scene's tone and momentum
3. Do NOT reference the filter or moderation — stay fully in-character
4. Move the story forward with a specific present-tense event (e.g., a character does something physical, makes a decision, initiates a new activity)
5. FORBIDDEN: Postponement language ("we'll talk later," "let's discuss this soon," "another time"). Act NOW.
6. FORBIDDEN: Vague redirects ("let's change the subject," "how about we..."). Be specific and decisive.`;

const DEBUG_CHAT_LOGS = Deno.env.get("DEBUG_CHAT_LOGS") === "true";

function debugLog(message: string) {
  if (DEBUG_CHAT_LOGS) {
    console.debug(message);
  }
}

function warnLog(message: string) {
  if (DEBUG_CHAT_LOGS) {
    console.warn(message);
  }
}

// GROK ONLY -- All models route to xAI
async function callXAI(messages: Message[], modelId: string, stream: boolean, maxTokens: number = 4096): Promise<XAIResult> {
  const XAI_API_KEY = Deno.env.get("XAI_API_KEY");
  if (!XAI_API_KEY) {
    throw new Error("XAI_API_KEY is not configured. Please add your Grok API key in settings.");
  }

  debugLog(`[chat] Calling xAI/Grok with model: ${modelId}, stream: ${stream}`);

  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${XAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelId,
      messages,
      stream,
      temperature: 0.9,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    // Do not log provider payload text in standard mode to avoid leaking user content.
    console.error(`[chat] xAI/Grok error: ${response.status}`);
    debugLog(`[chat] xAI/Grok error detail: ${errorText.slice(0, 500)}`);
    return { ok: false, status: response.status, errorText };
  }

  return { ok: true, response };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }
  const corsHeaders = getCorsHeaders(req);

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const rateDecision = checkRateLimit({
      scope: "chat",
      key: user.id,
      windowMs: 60_000,
      max: 40,
    });
    if (!rateDecision.allowed) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded. Please wait before sending more messages.",
          retryAfterSeconds: rateDecision.retryAfterSeconds,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            ...getRateLimitHeaders(rateDecision),
            "Content-Type": "application/json",
          },
        },
      );
    }
    const rateHeaders = getRateLimitHeaders(rateDecision);

    const body: ChatRequest = await req.json();
    const { messages, stream = true, max_tokens: maxTokens = 4096 } = body;
    
    // Only grok-4-1-fast-reasoning is used app-wide; reject anything else
    const VALID_GROK_MODELS = ['grok-4-1-fast-reasoning'];
    const modelId = VALID_GROK_MODELS.includes(body.modelId) ? body.modelId : 'grok-4-1-fast-reasoning';
    
    if (body.modelId !== modelId) {
      warnLog(`[chat] Rejected non-Grok model "${body.modelId}", using "${modelId}" instead`);
    }

    if (!messages || !modelId) {
        return new Response(
          JSON.stringify({ error: "Missing required fields: messages and modelId" }),
          { status: 400, headers: { ...corsHeaders, ...rateHeaders, "Content-Type": "application/json" } }
        );
      }

    debugLog(`[chat] Request received for model: ${modelId}, messages: ${messages.length}`);

    // GROK ONLY -- all requests go to xAI
    const result = await callXAI(messages, modelId, stream, maxTokens);

    if (result.ok) {
      if (stream) {
        return new Response(result.response.body, {
          headers: {
            ...corsHeaders,
            ...rateHeaders,
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
          },
        });
      } else {
        const data = await result.response.json();
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, ...rateHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // If 403 (content safety), retry with redirect directive
    if (result.status === 403) {
      debugLog(`[chat] Got 403 content safety rejection, retrying with redirect directive...`);

      // Inject redirect directive as a system message before the last user message
      const redirectMessages: Message[] = [
        ...messages.slice(0, -1),
        { role: 'system' as const, content: CONTENT_REDIRECT_DIRECTIVE },
        messages[messages.length - 1],
      ];

      const retryResult = await callXAI(redirectMessages, modelId, stream, maxTokens);

      if (retryResult.ok) {
        debugLog(`[chat] Redirect retry succeeded`);
        if (stream) {
          return new Response(retryResult.response.body, {
            headers: {
              ...corsHeaders,
              ...rateHeaders,
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
              "Connection": "keep-alive",
            },
          });
        } else {
          const data = await retryResult.response.json();
          return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, ...rateHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // Both attempts failed -- return content_filtered
      debugLog(`[chat] Redirect retry also failed (${retryResult.status}), returning content_filtered`);
      return new Response(
        JSON.stringify({ error: "Content filtered by safety system", error_type: "content_filtered" }),
        { status: 422, headers: { ...corsHeaders, ...rateHeaders, "Content-Type": "application/json" } }
      );
    }

    // Non-403 error -- throw to be caught below
    throw new Error(`xAI/Grok error: ${result.status}`);

  } catch (error) {
    console.error("[chat] Error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const status = errorMessage.includes("not configured") ? 400 : 500;
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
