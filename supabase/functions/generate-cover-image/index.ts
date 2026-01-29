// Edge function to generate cover images for scenarios
// Uses Lovable AI Gateway for image generation with portrait aspect ratio

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, stylePrompt, negativePrompt, scenarioTitle } = await req.json();
    
    if (!prompt) {
      return new Response(JSON.stringify({ error: "prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
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

    // Use Lovable AI Gateway for image generation
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: fullPrompt }],
        modalities: ["image", "text"]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI image generation error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Image generation failed", details: errorText }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    
    // Extract image URL from response
    let imageUrl = null;
    
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
