// Edge function to generate avatar for side character
// Uses a two-step approach: LLM writes optimized prompt, then image API generates

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
  'grok-3': 'grok-2-image-1212',
  'grok-3-mini': 'grok-2-image-1212',
  'grok-2': 'grok-2-image-1212',
};

// Map for text models used in prompt generation step
const TEXT_MODEL_MAP: Record<string, string> = {
  'grok-3': 'grok-3-mini',
  'grok-3-mini': 'grok-3-mini',
  'grok-2': 'grok-3-mini',
};

function getImageModelAndGateway(textModelId: string): { imageModel: string; gateway: 'lovable' | 'xai' } {
  const imageModel = IMAGE_MODEL_MAP[textModelId] || 'google/gemini-2.5-flash-image';
  const gateway = imageModel.startsWith('grok') ? 'xai' : 'lovable';
  return { imageModel, gateway };
}

function getTextModelForPromptGeneration(textModelId: string, gateway: 'lovable' | 'xai'): string {
  if (gateway === 'xai') {
    return TEXT_MODEL_MAP[textModelId] || 'grok-3-mini';
  }
  // For Lovable gateway, use a fast model
  return 'google/gemini-2.5-flash';
}

// Step 1: Generate optimized image prompt using LLM
async function generateOptimizedPrompt(
  characterName: string,
  avatarPrompt: string,
  stylePrompt: string | null,
  negativePrompt: string | null,
  gateway: 'lovable' | 'xai',
  textModel: string
): Promise<string> {
  const maxLength = gateway === 'xai' ? 700 : 1500; // xAI has strict 1024 byte limit
  
  const systemPrompt = `You are a concise image prompt writer. Your task is to write a SHORT, focused character portrait prompt.

STRICT RULES:
1. Output ONLY the prompt text - no explanations, no quotes, no prefixes
2. Keep the prompt under ${maxLength} characters
3. Focus on: face, expression, lighting, composition, art style
4. Prioritize the most visually distinctive features
5. Use comma-separated descriptors, not sentences
6. If style info is provided, incorporate it briefly`;

  const userPrompt = `Write an image generation prompt for a character portrait.

Character: ${characterName}
Description: ${avatarPrompt}
${stylePrompt ? `Style: ${stylePrompt.split('.')[0]}` : ''}
${negativePrompt ? `Avoid: ${negativePrompt}` : ''}

Write a focused prompt under ${maxLength} characters:`;

  if (gateway === 'xai') {
    const XAI_API_KEY = Deno.env.get("XAI_API_KEY");
    if (!XAI_API_KEY) throw new Error("XAI_API_KEY not configured");

    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${XAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: textModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 300,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[generateOptimizedPrompt] xAI error:", errorText);
      throw new Error("Failed to generate prompt via xAI");
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || avatarPrompt;
  } else {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: textModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 300,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[generateOptimizedPrompt] Lovable error:", errorText);
      throw new Error("Failed to generate prompt via Lovable");
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || avatarPrompt;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { avatarPrompt, characterName, modelId, stylePrompt, negativePrompt } = await req.json();
    
    if (!avatarPrompt) {
      return new Response(JSON.stringify({ error: "avatarPrompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine which image model and gateway to use
    const effectiveTextModel = modelId || 'google/gemini-3-flash-preview';
    const { imageModel, gateway } = getImageModelAndGateway(effectiveTextModel);
    const textModelForPrompt = getTextModelForPromptGeneration(effectiveTextModel, gateway);
    
    console.log(`[generate-avatar] Text model: ${effectiveTextModel}, Image model: ${imageModel}, Gateway: ${gateway}`);

    // Step 1: Generate optimized prompt using LLM
    let optimizedPrompt: string;
    try {
      optimizedPrompt = await generateOptimizedPrompt(
        characterName,
        avatarPrompt,
        stylePrompt || null,
        negativePrompt || null,
        gateway,
        textModelForPrompt
      );
      console.log(`[generate-avatar] Optimized prompt (${optimizedPrompt.length} chars):`, optimizedPrompt);
    } catch (err) {
      console.error("[generate-avatar] Prompt generation failed, using fallback:", err);
      // Fallback: create a simple truncated prompt
      optimizedPrompt = `Portrait of ${characterName}. ${avatarPrompt}`.substring(0, 700);
    }

    // For xAI, enforce strict byte limit
    if (gateway === 'xai') {
      const encoder = new TextEncoder();
      let bytes = encoder.encode(optimizedPrompt);
      if (bytes.length > 950) {
        // Truncate to stay under 1024 bytes
        let truncated = optimizedPrompt;
        while (encoder.encode(truncated).length > 950 && truncated.length > 0) {
          truncated = truncated.slice(0, -10);
        }
        optimizedPrompt = truncated.trim() + '...';
        console.log(`[generate-avatar] Truncated prompt to ${encoder.encode(optimizedPrompt).length} bytes`);
      }
    }

    // Step 2: Generate image using optimized prompt
    if (gateway === 'xai') {
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
          prompt: optimizedPrompt,
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
      // Use Lovable AI Gateway for image generation
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
          messages: [{ role: "user", content: optimizedPrompt }],
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
