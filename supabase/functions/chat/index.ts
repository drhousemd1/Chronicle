import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
};

function getGateway(modelId: string): 'lovable' | 'xai' {
  if (modelId.startsWith('grok')) {
    return 'xai';
  }
  return 'lovable';
}

async function callLovableAI(messages: Message[], modelId: string, stream: boolean): Promise<Response> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY is not configured");
  }

  console.log(`[chat] Calling Lovable AI with model: ${modelId}, stream: ${stream}`);

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelId,
      messages,
      stream,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[chat] Lovable AI error: ${response.status} - ${errorText}`);
    throw new Error(`Lovable AI error: ${response.status}`);
  }

  return response;
}

async function callXAI(messages: Message[], modelId: string, stream: boolean): Promise<Response> {
  const XAI_API_KEY = Deno.env.get("XAI_API_KEY");
  if (!XAI_API_KEY) {
    throw new Error("XAI_API_KEY is not configured. Please add your Grok API key in settings.");
  }

  console.log(`[chat] Calling X/Grok with model: ${modelId}, stream: ${stream}`);

  // X/Grok uses OpenAI-compatible API
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
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[chat] X/Grok error: ${response.status} - ${errorText}`);
    throw new Error(`X/Grok error: ${response.status}`);
  }

  return response;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, modelId, stream = true }: ChatRequest = await req.json();

    if (!messages || !modelId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: messages and modelId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[chat] Request received for model: ${modelId}, messages: ${messages.length}`);

    const gateway = getGateway(modelId);
    let response: Response;

    if (gateway === 'xai') {
      response = await callXAI(messages, modelId, stream);
    } else {
      response = await callLovableAI(messages, modelId, stream);
    }

    // Pass through the response (streaming or not)
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
