// ============================================================================
// GROK ONLY -- Cover image generation uses xAI Grok exclusively.
// Image model: grok-2-image-1212. No Gemini. No OpenAI. No Lovable gateway.
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const { prompt, stylePrompt, negativePrompt, scenarioTitle } = await req.json();
    
    if (!prompt) {
      return new Response(JSON.stringify({ error: "prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build the full prompt
    let fullPrompt = `Portrait composition (2:3 aspect ratio), vertical orientation. ${prompt.trim()}`;
    
    if (stylePrompt) {
      fullPrompt += `. Style: ${stylePrompt}`;
    }
    
    if (negativePrompt) {
      fullPrompt += `. Avoid: ${negativePrompt}`;
    }

    console.log(`[generate-cover-image] Generating cover for "${scenarioTitle || 'scenario'}" with prompt (${fullPrompt.length} chars)`);

    // GROK ONLY -- use xAI API
    const XAI_API_KEY = Deno.env.get("XAI_API_KEY");
    if (!XAI_API_KEY) {
      return new Response(JSON.stringify({ 
        error: "XAI_API_KEY not configured. Please add your Grok API key in settings." 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Compress prompt for xAI's 1024 byte limit
    const encoder = new TextEncoder();
    let compressedPrompt = fullPrompt;
    if (encoder.encode(compressedPrompt).length > 900) {
      compressedPrompt = compressedPrompt.substring(0, 700);
    }

    console.log(`[generate-cover-image] Using xAI with model: grok-2-image-1212`);

    const response = await fetch("https://api.x.ai/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${XAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "grok-2-image-1212", // GROK ONLY
        prompt: compressedPrompt,
        n: 1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Image generation error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Image generation failed", details: errorText }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    
    let imageUrl = null;
    
    if (data.data?.[0]?.url) {
      imageUrl = data.data[0].url;
    } else if (data.data?.[0]?.b64_json) {
      imageUrl = `data:image/png;base64,${data.data[0].b64_json}`;
    }

    if (!imageUrl) {
      console.error("No image URL found in response:", JSON.stringify(data, null, 2));
      return new Response(JSON.stringify({ 
        error: "No image generated",
        debug: data 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[generate-cover-image] Cover image generated successfully`);

    return new Response(JSON.stringify({ imageUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    console.error("generate-cover-image error:", e);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
