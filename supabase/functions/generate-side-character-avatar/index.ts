// Edge function to generate avatar for side character
// Uses Lovable AI image generation model

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
    const { avatarPrompt, characterName } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    if (!avatarPrompt) {
      return new Response(JSON.stringify({ error: "avatarPrompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fullPrompt = `Professional character portrait for a roleplaying game. ${avatarPrompt}. High quality digital art, centered composition, clear facial features, portrait orientation, soft lighting, detailed face.`;

    console.log(`Generating avatar for ${characterName}:`, fullPrompt);

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
      console.error("Image generation error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Image generation failed", details: errorText }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    
    // Extract image URL from response
    // The format may vary - check multiple possible locations
    let imageUrl = null;
    
    // Check for inline image data
    const message = data.choices?.[0]?.message;
    if (message?.content) {
      // Sometimes the image is in the content as a data URL or base64
      if (typeof message.content === 'string' && message.content.startsWith('data:image')) {
        imageUrl = message.content;
      }
    }
    
    // Check for images array
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
    
    // Check for attachments
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

    console.log(`Avatar generated for ${characterName}`);

    return new Response(JSON.stringify({ imageUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    console.error("generate-avatar error:", e);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
