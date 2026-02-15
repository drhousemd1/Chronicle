// ============================================================================
// GROK ONLY -- All chat calls go to xAI. No Gemini. No OpenAI.
// This edge function exclusively uses the xAI API for all chat completions.
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

// GROK ONLY -- All models route to xAI
async function callXAI(messages: Message[], modelId: string, stream: boolean, maxTokens: number = 4096): Promise<Response> {
  const XAI_API_KEY = Deno.env.get("XAI_API_KEY");
  if (!XAI_API_KEY) {
    throw new Error("XAI_API_KEY is not configured. Please add your Grok API key in settings.");
  }

  console.log(`[chat] Calling xAI/Grok with model: ${modelId}, stream: ${stream}`);

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
    console.error(`[chat] xAI/Grok error: ${response.status} - ${errorText}`);
    throw new Error(`xAI/Grok error: ${response.status}`);
  }

  return response;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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

    const body: ChatRequest = await req.json();
    const { messages, stream = true, max_tokens: maxTokens = 4096 } = body;
    
    // GROK ONLY -- Force any non-Grok model to grok-3-mini
    const VALID_GROK_MODELS = ['grok-3', 'grok-3-mini', 'grok-2'];
    const modelId = VALID_GROK_MODELS.includes(body.modelId) ? body.modelId : 'grok-3-mini';
    
    if (body.modelId !== modelId) {
      console.warn(`[chat] Rejected non-Grok model "${body.modelId}", using "${modelId}" instead`);
    }

    if (!messages || !modelId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: messages and modelId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[chat] Request received for model: ${modelId}, messages: ${messages.length}`);

    // GROK ONLY -- all requests go to xAI
    const response = await callXAI(messages, modelId, stream, maxTokens);

    if (stream) {
      return new Response(response.body, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    } else {
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
