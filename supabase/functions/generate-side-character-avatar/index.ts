// Edge function to generate avatar for side character
// Uses the user's selected model for image generation

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Map text models to their provider's image generation model
const IMAGE_MODEL_MAP: Record<string, string> = {
  // Google models -> Gemini image model
  'google/gemini-3-flash-preview': 'google/gemini-2.5-flash-image',
  'google/gemini-3-pro-preview': 'google/gemini-2.5-flash-image',
  'google/gemini-2.5-flash': 'google/gemini-2.5-flash-image',
  'google/gemini-2.5-pro': 'google/gemini-2.5-flash-image',
  // OpenAI models -> Gemini image model (via Lovable gateway)
  'openai/gpt-5': 'google/gemini-2.5-flash-image',
  'openai/gpt-5-mini': 'google/gemini-2.5-flash-image',
  // Grok models -> Grok image model
  'grok-3': 'grok-2-image',
  'grok-3-mini': 'grok-2-image',
  'grok-2': 'grok-2-image',
};

function getImageModelAndGateway(textModelId: string): { imageModel: string; gateway: 'lovable' | 'xai' } {
  const imageModel = IMAGE_MODEL_MAP[textModelId] || 'google/gemini-2.5-flash-image';
  const gateway = imageModel.startsWith('grok') ? 'xai' : 'lovable';
  return { imageModel, gateway };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { avatarPrompt, characterName, modelId } = await req.json();
    
    if (!avatarPrompt) {
      return new Response(JSON.stringify({ error: "avatarPrompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine which image model and gateway to use based on user's selected text model
    const effectiveTextModel = modelId || 'google/gemini-3-flash-preview';
    const { imageModel, gateway } = getImageModelAndGateway(effectiveTextModel);
    
    console.log(`[generate-avatar] Text model: ${effectiveTextModel}, Image model: ${imageModel}, Gateway: ${gateway}`);

    const fullPrompt = `Professional character portrait for a roleplaying game. ${avatarPrompt}. High quality digital art, centered composition, clear facial features, portrait orientation, soft lighting, detailed face.`;

    console.log(`Generating avatar for ${characterName}:`, fullPrompt);

    if (gateway === 'xai') {
      // Use xAI/Grok for image generation
      const XAI_API_KEY = Deno.env.get("XAI_API_KEY");
      if (!XAI_API_KEY) {
        throw new Error("XAI_API_KEY not configured. Please add your Grok API key in settings.");
      }

      const response = await fetch("https://api.x.ai/v1/images/generations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${XAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: imageModel,
          prompt: fullPrompt,
          n: 1,
          response_format: "url"
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("xAI image generation error:", response.status, errorText);
        return new Response(JSON.stringify({ error: "Image generation failed", details: errorText }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await response.json();
      const imageUrl = data.data?.[0]?.url;

      if (!imageUrl) {
        console.error("No image URL in xAI response:", JSON.stringify(data, null, 2));
        return new Response(JSON.stringify({ 
          error: "No image generated",
          debug: data 
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`Avatar generated for ${characterName} via xAI`);

      return new Response(JSON.stringify({ imageUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else {
      // Use Lovable AI Gateway (Gemini) for image generation
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) {
        throw new Error("LOVABLE_API_KEY not configured");
      }

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: imageModel,
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

      console.log(`Avatar generated for ${characterName} via Lovable AI`);

      return new Response(JSON.stringify({ imageUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    console.error("generate-avatar error:", e);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
