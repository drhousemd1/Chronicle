// Edge function to generate scene images during roleplay
// Uses structured JSON output and byte-aware prompt assembly for Grok compatibility
// Implements gender-variant style selection based on character presentation

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type GenderPresentation = 'feminine' | 'masculine' | 'androgynous';

interface CharacterPromptData {
  name: string;
  genderPresentation: GenderPresentation;
  weightedTraits?: string;
  bodyDescription: string;
  pose: string;
  expression: string;
  clothing: string;
}

interface StructuredPromptData {
  characters: CharacterPromptData[];
  scene: string;
  cameraAngle: string;
}

// ============================================================================
// STYLE BLOCKS - Revision 17 variants
// ============================================================================

const STYLE_BLOCKS = {
  'cinematic-2-5d': {
    feminine: "Polished 2.5-D semi-realistic digital illustration, clean digital paintover, smooth airbrushed skin textures, airbrushed gradients and seamless clean transitions, simplified textures with no photographic microtexture, illustrative highlight shapes on metal and skin, refined feminine features with realistic facial proportions and natural eye size, consistent warm skin tone, no lineart, no cel shading, clean high-detail finish, soft background blur, warm rim light glow, high contrast soft pastel palette.",
    masculine: "Polished 2.5-D semi-realistic digital illustration, clean digital paintover, smooth airbrushed skin textures, airbrushed gradients and seamless clean transitions, simplified textures with no photographic microtexture, illustrative highlight shapes on metal and skin, refined masculine features with realistic facial proportions and defined jawline, consistent skin tone, no lineart, no cel shading, clean high-detail finish, soft background blur, warm rim light glow, high contrast palette.",
    androgynous: "Polished 2.5-D semi-realistic digital illustration, clean digital paintover, smooth airbrushed skin textures, airbrushed gradients and seamless clean transitions, simplified textures with no photographic microtexture, illustrative highlight shapes on metal and skin, refined features with realistic facial proportions and natural eye size, consistent skin tone, no lineart, no cel shading, clean high-detail finish, soft background blur, warm rim light glow, high contrast soft palette."
  }
} as const;

// Fallback for other styles - use provided artStylePrompt
function getStyleBlock(styleId: string, gender: GenderPresentation, fallbackPrompt?: string): string {
  const styleBlock = STYLE_BLOCKS[styleId as keyof typeof STYLE_BLOCKS];
  if (styleBlock) {
    return styleBlock[gender] || styleBlock.feminine;
  }
  return fallbackPrompt || STYLE_BLOCKS['cinematic-2-5d'].feminine;
}

// ============================================================================
// MODEL ROUTING
// ============================================================================

const IMAGE_MODEL_MAP: Record<string, string> = {
  'google/gemini-3-flash-preview': 'google/gemini-2.5-flash-image',
  'google/gemini-3-pro-preview': 'google/gemini-2.5-flash-image',
  'google/gemini-2.5-flash': 'google/gemini-2.5-flash-image',
  'google/gemini-2.5-pro': 'google/gemini-2.5-flash-image',
  'openai/gpt-5': 'google/gemini-2.5-flash-image',
  'openai/gpt-5-mini': 'google/gemini-2.5-flash-image',
  'grok-3': 'grok-2-image-1212',
  'grok-3-mini': 'grok-2-image-1212',
  'grok-2': 'grok-2-image-1212',
};

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

// ============================================================================
// STRUCTURED ANALYSIS PROMPT
// ============================================================================

function buildAnalysisPrompt(characterDescriptions: string, dialogueContext: string, sceneLocation: string): string {
  return `You are an Image Prompt Optimizer. Analyze the character data and dialogue, then output structured JSON.

===== CHARACTER DATA =====
${characterDescriptions || 'No character data provided.'}

===== SCENE LOCATION =====
${sceneLocation || 'unspecified location'}

===== RECENT DIALOGUE =====
${dialogueContext}

===== OUTPUT JSON SCHEMA =====
{
  "characters": [
    {
      "name": "string",
      "genderPresentation": "feminine" | "masculine" | "androgynous",
      "weightedTraits": "string with (trait:weight) format for physical/sexual traits only, or null if none",
      "bodyDescription": "short phrase: age, hair color, skin tone, figure type - under 30 chars",
      "pose": "body position inferred from dialogue actions - under 25 chars",
      "expression": "facial expression inferred from dialogue emotion - under 15 chars",
      "clothing": "what they're wearing, simplified - under 40 chars"
    }
  ],
  "scene": "one or two words for location",
  "cameraAngle": "medium shot" | "full body" | "close-up"
}

===== WEIGHTING RULES (MANDATORY) =====
Add weights ONLY to physical/sexual traits. Use (trait:weight) format.
- Large breasts: (extreme bust size:1.4) (very large bust:1.3) (heavy breasts:1.2)
- Small breasts: (petite bust:1.3) (small chest:1.2) (flat chest:1.3)
- Hips/waist: (wide hips:1.2) (slim waist:1.1) (hourglass figure:1.15)
- Muscles: (muscular build:1.2) (toned physique:1.15) (broad shoulders:1.2)
- Use 1.3-1.4 for exaggerated features, 1.1-1.2 for subtle emphasis
- If character has NO notable physical/sexual traits mentioned, set weightedTraits to null

===== GENDER PRESENTATION RULES =====
Analyze the character's PHYSICAL DESCRIPTION, not just their sex field.
- "feminine": breasts mentioned, soft features, curves, long hair, feminine clothing, developing female traits
- "masculine": flat chest, defined muscles, facial hair, short hair, masculine clothing, broad build
- "androgynous": mixed traits, non-binary presentation, or traits are unclear/unspecified
A character with sex="male" but developing breasts/feminine traits = "feminine"
A character with sex="female" but muscular/masculine presentation = "masculine"

===== INFERENCE RULES =====
If character data is sparse:
- Infer reasonable defaults (adult, average build unless stated otherwise)
- Do NOT invent sexual traits not mentioned - only weight what exists
- bodyDescription should capture the essence in minimal words

If character data is verbose:
- Condense multiple sentences about one trait into 1-2 weighted phrases
- Prioritize the most emphasized traits
- Remove redundant adjectives

Respond ONLY with valid JSON. No markdown, no explanation, no code blocks.`;
}

// ============================================================================
// BYTE-AWARE PROMPT ASSEMBLY
// ============================================================================

function assemblePromptWithByteLimit(data: StructuredPromptData, styleBlock: string): string {
  const encoder = new TextEncoder();
  const TARGET_BYTES = 980; // Safety margin below Grok's 1024 limit
  
  // Calculate style block size
  const stylePart = `\n\nImage styling: ${styleBlock}`;
  const styleBytes = encoder.encode(stylePart).length;
  const availableForContent = TARGET_BYTES - styleBytes - 20; // 20 for "Image components: "
  
  console.log(`[generate-scene-image] Style block: ${styleBytes} bytes, available for content: ${availableForContent} bytes`);
  
  const contentParts: string[] = [];
  
  // PRIORITY 1: Character identity + weighted traits (protected - never cut)
  for (const char of data.characters) {
    let charPart = char.bodyDescription;
    if (char.weightedTraits) {
      charPart += `, ${char.weightedTraits}`;
    }
    contentParts.push(charPart);
  }
  
  let content = contentParts.join('. ');
  let currentBytes = encoder.encode(content).length;
  console.log(`[generate-scene-image] After identity+traits: ${currentBytes} bytes`);
  
  // PRIORITY 2: Add pose if room
  const pose = data.characters[0]?.pose;
  if (pose && currentBytes < availableForContent - 50) {
    content += `. ${pose}`;
    currentBytes = encoder.encode(content).length;
    console.log(`[generate-scene-image] After pose: ${currentBytes} bytes`);
  }
  
  // PRIORITY 3: Add expression if room
  const expr = data.characters[0]?.expression;
  if (expr && currentBytes < availableForContent - 30) {
    content += `, ${expr}`;
    currentBytes = encoder.encode(content).length;
    console.log(`[generate-scene-image] After expression: ${currentBytes} bytes`);
  }
  
  // PRIORITY 4: Add clothing if room
  const clothing = data.characters[0]?.clothing;
  if (clothing && currentBytes < availableForContent - 60) {
    content += `. Wearing ${clothing}`;
    currentBytes = encoder.encode(content).length;
    console.log(`[generate-scene-image] After clothing: ${currentBytes} bytes`);
  }
  
  // PRIORITY 5: Add scene if room (first to be dropped)
  if (data.scene && currentBytes < availableForContent - 25) {
    content += `. In ${data.scene}`;
    currentBytes = encoder.encode(content).length;
    console.log(`[generate-scene-image] After scene: ${currentBytes} bytes`);
  }
  
  const finalPrompt = `Image components: ${content.trim()}${stylePart}`;
  const finalBytes = encoder.encode(finalPrompt).length;
  console.log(`[generate-scene-image] Final prompt: ${finalBytes} bytes`);
  
  return finalPrompt;
}

// ============================================================================
// LLM CALLS
// ============================================================================

async function callAnalysisLLM(
  prompt: string, 
  gateway: 'lovable' | 'xai', 
  modelId: string
): Promise<string> {
  if (gateway === 'xai') {
    const XAI_API_KEY = Deno.env.get("XAI_API_KEY");
    if (!XAI_API_KEY) {
      throw new Error("XAI_API_KEY not configured");
    }

    const textModel = TEXT_MODEL_MAP[modelId] || 'grok-3';
    
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${XAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: textModel,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3, // Lower temp for more consistent JSON output
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("xAI analysis error:", response.status, errorText);
      throw new Error("Failed to analyze scene");
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  } else {
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
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI analysis error:", response.status, errorText);
      throw new Error("Failed to analyze scene");
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  }
}

async function generateImageWithGrok(prompt: string, imageModel: string): Promise<string> {
  const XAI_API_KEY = Deno.env.get("XAI_API_KEY");
  if (!XAI_API_KEY) {
    throw new Error("XAI_API_KEY not configured");
  }

  console.log(`[generate-scene-image] Sending to Grok (${imageModel}), prompt length: ${prompt.length} chars`);

  const response = await fetch("https://api.x.ai/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${XAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: imageModel,
      prompt: prompt,
      n: 1,
      response_format: "url"
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Grok image generation error:", response.status, errorText);
    throw new Error("Image generation failed");
  }

  const data = await response.json();
  
  // Log revised prompt if available (for learning)
  if (data.data?.[0]?.revised_prompt) {
    console.log("[generate-scene-image] Grok revised prompt:", data.data[0].revised_prompt.slice(0, 200) + "...");
  }
  
  return data.data?.[0]?.url || null;
}

async function generateImageWithLovable(prompt: string, imageModel: string): Promise<string | null> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY not configured");
  }

  console.log(`[generate-scene-image] Sending to Lovable AI (${imageModel})`);

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: imageModel,
      messages: [{ role: "user", content: prompt }],
      modalities: ["image", "text"]
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Lovable AI image generation error:", response.status, errorText);
    throw new Error("Image generation failed");
  }

  const imageData = await response.json();
  
  // Extract image URL from various response formats
  const message = imageData.choices?.[0]?.message;
  let imageUrl: string | null = null;
  
  // Format 1: content is a base64 data URL string
  if (message?.content) {
    if (typeof message.content === 'string' && message.content.startsWith('data:image')) {
      imageUrl = message.content;
    }
    // Format 2: content is an array with image parts
    else if (Array.isArray(message.content)) {
      for (const part of message.content) {
        if (part.type === 'image' && part.image_url?.url) {
          imageUrl = part.image_url.url;
          break;
        }
        if (part.type === 'image_url' && part.image_url?.url) {
          imageUrl = part.image_url.url;
          break;
        }
        if (part.inline_data?.data && part.inline_data?.mime_type) {
          imageUrl = `data:${part.inline_data.mime_type};base64,${part.inline_data.data}`;
          break;
        }
      }
    }
  }
  
  // Format 3: images array
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
  
  // Format 4: attachments array
  if (!imageUrl && message?.attachments?.[0]?.url) {
    imageUrl = message.attachments[0].url;
  }
  
  // Format 5: data array at response level
  if (!imageUrl && imageData.data?.[0]) {
    const dataItem = imageData.data[0];
    if (dataItem.url) {
      imageUrl = dataItem.url;
    } else if (dataItem.b64_json) {
      imageUrl = `data:image/png;base64,${dataItem.b64_json}`;
    }
  }

  return imageUrl;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

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

    // Build character descriptions
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
      
      return `- ${c.name} (sex: ${c.sexType || 'unspecified'}, age: ${c.age || 'adult'}): ${appearanceDetails}. Currently wearing: ${wearingDetails}`;
    }).join('\n');

    // Build dialogue context
    const dialogueContext = recentMessages.map((m: any) => 
      `[${m.role}]: ${m.text.slice(0, 500)}`
    ).join('\n');

    // Step 1: Get structured analysis from LLM
    const analysisPrompt = buildAnalysisPrompt(characterDescriptions, dialogueContext, sceneLocation || 'unspecified');
    
    console.log("[generate-scene-image] Calling analysis LLM...");
    const analysisResponse = await callAnalysisLLM(analysisPrompt, gateway, effectiveTextModel);
    
    console.log("[generate-scene-image] Raw analysis response:", analysisResponse.slice(0, 500));

    // Parse JSON response
    let promptData: StructuredPromptData;
    try {
      // Clean up response - remove markdown code blocks if present
      let cleanedResponse = analysisResponse.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.slice(7);
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.slice(3);
      }
      if (cleanedResponse.endsWith('```')) {
        cleanedResponse = cleanedResponse.slice(0, -3);
      }
      cleanedResponse = cleanedResponse.trim();
      
      promptData = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error("[generate-scene-image] Failed to parse JSON:", parseError);
      console.error("[generate-scene-image] Response was:", analysisResponse);
      
      // Fallback: create a basic structure from character data
      promptData = {
        characters: (characters || []).map((c: any) => ({
          name: c.name || 'character',
          genderPresentation: 'feminine' as GenderPresentation,
          weightedTraits: null,
          bodyDescription: `adult ${c.sexType || 'person'}`,
          pose: 'standing',
          expression: 'neutral',
          clothing: 'casual attire'
        })),
        scene: sceneLocation || 'indoor setting',
        cameraAngle: 'medium shot'
      };
    }

    console.log("[generate-scene-image] Parsed prompt data:", JSON.stringify(promptData, null, 2));

    // Step 2: Determine primary gender presentation (from first character or default)
    const primaryGender = promptData.characters[0]?.genderPresentation || 'feminine';
    console.log(`[generate-scene-image] Primary gender presentation: ${primaryGender}`);

    // Step 3: Get appropriate style block
    // Detect style ID from artStylePrompt or default to cinematic-2-5d
    let styleId = 'cinematic-2-5d';
    if (artStylePrompt) {
      // Check if it's one of the known style prompts
      if (artStylePrompt.includes('graphic novel') || artStylePrompt.includes('Comic')) {
        styleId = 'comic-book';
      } else if (artStylePrompt.includes('photorealistic') || artStylePrompt.includes('8K')) {
        styleId = 'hyper-realism';
      } else if (artStylePrompt.includes('anime') || artStylePrompt.includes('cel shading')) {
        styleId = 'modern-anime';
      } else if (artStylePrompt.includes('35mm') || artStylePrompt.includes('DSLR')) {
        styleId = 'photo-realism';
      }
    }
    
    const styleBlock = getStyleBlock(styleId, primaryGender, artStylePrompt);
    console.log(`[generate-scene-image] Using style: ${styleId} (${primaryGender})`);

    // Step 4: Assemble prompt with byte awareness
    const fullPrompt = assemblePromptWithByteLimit(promptData, styleBlock);
    
    console.log("[generate-scene-image] Final prompt preview:", fullPrompt.slice(0, 300) + "...");

    // Step 5: Generate image
    let imageUrl: string | null = null;

    if (imageGateway === 'xai') {
      imageUrl = await generateImageWithGrok(fullPrompt, imageModel);
    } else {
      imageUrl = await generateImageWithLovable(fullPrompt, imageModel);
    }

    if (!imageUrl) {
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
