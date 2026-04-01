// ============================================================================
// GROK ONLY -- Cover image generation uses xAI Grok exclusively.
// Image model: grok-imagine-image. No Gemini. No OpenAI. No Lovable gateway.
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { checkRateLimit, getRateLimitHeaders } from "../_shared/rate-limit.ts";

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
      scope: "generate-cover-image",
      key: user.id,
      windowMs: 60_000,
      max: 8,
    });
    if (!rateDecision.allowed) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded for cover image generation. Please try again shortly.",
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

    console.log(`[generate-cover-image] Generating cover for "${scenarioTitle || 'story'}" with prompt (${fullPrompt.length} chars)`);

    // GROK ONLY -- use xAI API
    const XAI_API_KEY = Deno.env.get("XAI_API_KEY");
    if (!XAI_API_KEY) {
      return new Response(JSON.stringify({ 
        error: "XAI_API_KEY not configured. Please add your Grok API key in settings." 
      }), {
        status: 400,
        headers: { ...corsHeaders, ...rateHeaders, "Content-Type": "application/json" },
      });
    }

    // Compress prompt for xAI's 1024 byte limit
    const encoder = new TextEncoder();
    let compressedPrompt = fullPrompt;
    if (encoder.encode(compressedPrompt).length > 900) {
      compressedPrompt = compressedPrompt.substring(0, 700);
    }

    console.log(`[generate-cover-image] Using xAI with model: grok-imagine-image`);

    const response = await fetch("https://api.x.ai/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${XAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "grok-imagine-image", // GROK ONLY
        prompt: compressedPrompt,
        n: 1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Image generation error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Image generation failed", details: errorText }), {
        status: 500,
        headers: { ...corsHeaders, ...rateHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    
    let imageUrl = null;
    
    if (data.data?.[0]?.url) {
      imageUrl = data.data[0].url;
    } else if (data.data?.[0]?.b64_json) {
      // Upload to storage instead of returning base64
      const raw = data.data[0].b64_json;
      const imageBytes = Uint8Array.from(atob(raw), c => c.charCodeAt(0));
      const filename = `${user.id}/cover-${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage.from('covers').upload(filename, imageBytes, { contentType: 'image/png', upsert: true });
      if (uploadError) {
        console.error('[generate-cover-image] Storage upload failed:', uploadError);
        throw uploadError;
      }
      const { data: urlData } = supabase.storage.from('covers').getPublicUrl(filename);
      imageUrl = urlData.publicUrl;
      console.log('[generate-cover-image] Uploaded b64 to storage:', imageUrl);
    }

    if (!imageUrl) {
      console.error("No image URL found in response:", JSON.stringify(data, null, 2));
      return new Response(JSON.stringify({ 
        error: "No image generated",
        debug: data 
      }), {
        status: 500,
        headers: { ...corsHeaders, ...rateHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[generate-cover-image] Cover image generated successfully`);

    return new Response(JSON.stringify({ imageUrl }), {
      headers: { ...corsHeaders, ...rateHeaders, "Content-Type": "application/json" },
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
