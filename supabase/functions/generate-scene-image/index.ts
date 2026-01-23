// Edge function to generate scene images during roleplay
// Analyzes recent dialogue and generates an image depicting the current moment
// Uses the user's selected model for both text analysis and image generation

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

// Map text models to their text API equivalent for scene analysis
const TEXT_MODEL_MAP: Record<string, string> = {
  'grok-3': 'grok-3',
  'grok-3-mini': 'grok-3-mini',
  'grok-2': 'grok-2',
};

function getGateway(modelId: string): 'lovable' | 'xai' {
  return modelId.startsWith('grok') ? 'xai' : 'lovable';
}

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
    const { 
      recentMessages, 
      characters, 
      sceneLocation, 
      timeOfDay,
      artStylePrompt,
      modelId 
    } = await req.json();

    if (!recentMessages || recentMessages.length === 0) {
      return new Response(JSON.stringify({ error: "recentMessages is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const effectiveTextModel = modelId || 'google/gemini-3-flash-preview';
    const gateway = getGateway(effectiveTextModel);
    const { imageModel, gateway: imageGateway } = getImageModelAndGateway(effectiveTextModel);
    
    console.log(`[generate-scene-image] Text model: ${effectiveTextModel}, Gateway: ${gateway}`);
    console.log(`[generate-scene-image] Image model: ${imageModel}, Image Gateway: ${imageGateway}`);

    // Build the character description for the prompt
    const characterDescriptions = (characters || []).map((c: any) => {
      const appearance = c.physicalAppearance || {};
      const wearing = c.currentlyWearing || {};
      
      const appearanceDetails = Object.entries(appearance)
        .filter(([_, v]) => v)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
      
      const wearingDetails = Object.entries(wearing)
        .filter(([_, v]) => v)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
      
      return `- ${c.name}: ${appearanceDetails}. Currently wearing: ${wearingDetails}`;
    }).join('\n');

    // Build dialogue context
    const dialogueContext = recentMessages.map((m: any) => 
      `[${m.role}]: ${m.text.slice(0, 500)}`
    ).join('\n');

    // Step 1: Use text model to analyze scene and write image prompt
    const analysisPrompt = `You are an expert at writing image generation prompts for AI art. Analyze this roleplay scene and write a detailed, vivid image generation prompt.

CHARACTERS IN SCENE:
${characterDescriptions || 'No specific character data provided.'}

LOCATION: ${sceneLocation || 'An indoor setting'}
TIME OF DAY: ${timeOfDay || 'day'}

RECENT DIALOGUE:
${dialogueContext}

Based on the dialogue and actions, write a detailed image prompt that captures this exact moment. Include:
1. The characters present, their positions, poses, and expressions
2. Their physical features (hair, eyes, build, skin tone)
3. What they're currently wearing
4. The action or emotion happening (from the dialogue)
5. Environment and setting details
6. Lighting appropriate for ${timeOfDay || 'day'}
7. A suitable camera angle and composition

Write ONLY the image prompt text. Be vivid and specific. Do not include any preamble or explanation.`;

    let sceneDescription = "";

    if (gateway === 'xai') {
      // Use xAI for text analysis
      const XAI_API_KEY = Deno.env.get("XAI_API_KEY");
      if (!XAI_API_KEY) {
        throw new Error("XAI_API_KEY not configured. Please add your Grok API key in settings.");
      }

      const textModel = TEXT_MODEL_MAP[effectiveTextModel] || 'grok-3';
      
      const analysisResponse = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${XAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: textModel,
          messages: [{ role: "user", content: analysisPrompt }],
        }),
      });

      if (!analysisResponse.ok) {
        const errorText = await analysisResponse.text();
        console.error("xAI text analysis error:", analysisResponse.status, errorText);
        throw new Error("Failed to analyze scene");
      }

      const analysisData = await analysisResponse.json();
      sceneDescription = analysisData.choices?.[0]?.message?.content || "";
      
    } else {
      // Use Lovable AI for text analysis
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) {
        throw new Error("LOVABLE_API_KEY not configured");
      }

      const analysisResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "user", content: analysisPrompt }],
        }),
      });

      if (!analysisResponse.ok) {
        const errorText = await analysisResponse.text();
        console.error("Lovable AI text analysis error:", analysisResponse.status, errorText);
        throw new Error("Failed to analyze scene");
      }

      const analysisData = await analysisResponse.json();
      sceneDescription = analysisData.choices?.[0]?.message?.content || "";
    }

    if (!sceneDescription) {
      throw new Error("Failed to generate scene description");
    }

    console.log("[generate-scene-image] Scene description:", sceneDescription.slice(0, 200) + "...");

    // Step 2: Combine with art style and generate image
    let fullPrompt = "";
    if (artStylePrompt) {
      fullPrompt = `${artStylePrompt}. ${sceneDescription}`;
    } else {
      fullPrompt = `High quality digital art illustration. ${sceneDescription}`;
    }

    console.log("[generate-scene-image] Full prompt length:", fullPrompt.length);

    let imageUrl = null;

    if (imageGateway === 'xai') {
      // Use xAI/Grok for image generation
      const XAI_API_KEY = Deno.env.get("XAI_API_KEY");
      if (!XAI_API_KEY) {
        throw new Error("XAI_API_KEY not configured");
      }

      const imageResponse = await fetch("https://api.x.ai/v1/images/generations", {
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

      if (!imageResponse.ok) {
        const errorText = await imageResponse.text();
        console.error("xAI image generation error:", imageResponse.status, errorText);
        throw new Error("Image generation failed");
      }

      const imageData = await imageResponse.json();
      imageUrl = imageData.data?.[0]?.url;

    } else {
      // Use Lovable AI Gateway for image generation
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) {
        throw new Error("LOVABLE_API_KEY not configured");
      }

      const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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

      if (!imageResponse.ok) {
        const errorText = await imageResponse.text();
        console.error("Lovable AI image generation error:", imageResponse.status, errorText);
        throw new Error("Image generation failed");
      }

      const imageData = await imageResponse.json();
      
      // Extract image URL from response (same logic as avatar function)
      const message = imageData.choices?.[0]?.message;
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
      console.error("[generate-scene-image] No image generated");
      throw new Error("No image generated");
    }

    console.log("[generate-scene-image] Image generated successfully");

    return new Response(JSON.stringify({ imageUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    console.error("generate-scene-image error:", e);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
