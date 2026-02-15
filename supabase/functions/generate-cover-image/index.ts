// Edge function to generate cover images for scenarios
// Supports BYOK routing: uses Grok for grok models, Lovable Gateway for others

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getGateway(modelId: string): 'lovable' | 'xai' {
  if (modelId.startsWith('grok')) {
    return 'xai';
  }
  return 'lovable';
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
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(authHeader.replace('Bearer ', ''));
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { prompt, stylePrompt, negativePrompt, scenarioTitle, modelId } = await req.json();
    
    if (!prompt) {
      return new Response(JSON.stringify({ error: "prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build the full prompt with style and aspect ratio guidance
    let fullPrompt = `Portrait composition (2:3 aspect ratio), vertical orientation. ${prompt.trim()}`;
    
    if (stylePrompt) {
      fullPrompt += `. Style: ${stylePrompt}`;
    }
    
    if (negativePrompt) {
      fullPrompt += `. Avoid: ${negativePrompt}`;
    }

    console.log(`[generate-cover-image] Generating cover for "${scenarioTitle || 'scenario'}" with prompt (${fullPrompt.length} chars)`);

    // BYOK routing: determine gateway based on modelId
    const effectiveModelId = modelId || 'google/gemini-2.5-flash-image';
    const gateway = getGateway(effectiveModelId);

    let apiKey: string | undefined;
    let apiUrl: string;
    let requestBody: Record<string, any>;

    if (gateway === 'xai') {
      // Use xAI/Grok for image generation
      apiKey = Deno.env.get("XAI_API_KEY");
      if (!apiKey) {
        return new Response(JSON.stringify({ 
          error: "XAI_API_KEY not configured. Please add your Grok API key in settings." 
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      apiUrl = "https://api.x.ai/v1/images/generations";
      
      // Compress prompt for xAI's 1024 byte limit
      const encoder = new TextEncoder();
      let compressedPrompt = fullPrompt;
      if (encoder.encode(compressedPrompt).length > 900) {
        compressedPrompt = compressedPrompt.substring(0, 700);
      }
      
      requestBody = {
        model: "grok-2-image-1212",
        prompt: compressedPrompt,
        n: 1,
      };
      
      console.log(`[generate-cover-image] Using xAI gateway with model: grok-2-image-1212`);
    } else {
      // Use Lovable Gateway
      apiKey = Deno.env.get("LOVABLE_API_KEY");
      if (!apiKey) {
        throw new Error("LOVABLE_API_KEY not configured");
      }
      apiUrl = "https://ai.gateway.lovable.dev/v1/chat/completions";
      requestBody = {
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: fullPrompt }],
        modalities: ["image", "text"]
      };
      
      console.log(`[generate-cover-image] Using Lovable gateway with model: google/gemini-2.5-flash-image`);
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
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
    
    // Extract image URL from response - handle both gateway formats
    let imageUrl = null;
    
    // xAI format: data.data[0].url
    if (data.data?.[0]?.url) {
      imageUrl = data.data[0].url;
    } else if (data.data?.[0]?.b64_json) {
      imageUrl = `data:image/png;base64,${data.data[0].b64_json}`;
    }
    
    // Lovable/Gemini format
    if (!imageUrl) {
      const message = data.choices?.[0]?.message;
      if (message?.content) {
        if (typeof message.content === 'string' && message.content.startsWith('data:image')) {
          imageUrl = message.content;
        }
      }
      
      if (!imageUrl && message?.images?.[0]) {
        const img = message.images[0];
        if (img.image_url?.url) {
          imageUrl = img.image_url.url;
        } else if (img.url) {
          imageUrl = img.url;
        } else if (typeof img === 'string') {
          imageUrl = img;
        }
      }
      
      if (!imageUrl && message?.attachments?.[0]) {
        const att = message.attachments[0];
        if (att.url) {
          imageUrl = att.url;
        }
      }
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
