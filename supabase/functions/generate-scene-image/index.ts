// ============================================================================
// GROK ONLY -- Scene image generation uses xAI Grok exclusively.
// Text analysis: grok-3 / grok-3-mini. Image generation: grok-2-image-1212.
// Do NOT add Gemini or OpenAI.
// ============================================================================

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

function getStyleBlock(styleId: string, gender: GenderPresentation, fallbackPrompt?: string): string {
  const styleBlock = STYLE_BLOCKS[styleId as keyof typeof STYLE_BLOCKS];
  if (styleBlock) {
    return styleBlock[gender] || styleBlock.feminine;
  }
  return fallbackPrompt || STYLE_BLOCKS['cinematic-2-5d'].feminine;
}

// ============================================================================
// GROK ONLY -- Model routing
// ============================================================================

const TEXT_MODEL_MAP: Record<string, string> = {
  'grok-3': 'grok-3',
  'grok-3-mini': 'grok-3-mini',
  'grok-2': 'grok-2',
};

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
  const TARGET_BYTES = 980;
  
  const stylePart = `\n\nImage styling: ${styleBlock}`;
  const styleBytes = encoder.encode(stylePart).length;
  const availableForContent = TARGET_BYTES - styleBytes - 20;
  
  console.log(`[generate-scene-image] Style block: ${styleBytes} bytes, available for content: ${availableForContent} bytes`);
  
  const contentParts: string[] = [];
  
  for (const char of data.characters) {
    let charPart = char.bodyDescription;
    if (char.weightedTraits) {
      charPart += `, ${char.weightedTraits}`;
    }
    contentParts.push(charPart);
  }
  
  let content = contentParts.join('. ');
  let currentBytes = encoder.encode(content).length;
  
  const pose = data.characters[0]?.pose;
  if (pose && currentBytes < availableForContent - 50) {
    content += `. ${pose}`;
    currentBytes = encoder.encode(content).length;
  }
  
  const expr = data.characters[0]?.expression;
  if (expr && currentBytes < availableForContent - 30) {
    content += `, ${expr}`;
    currentBytes = encoder.encode(content).length;
  }
  
  const clothing = data.characters[0]?.clothing;
  if (clothing && currentBytes < availableForContent - 60) {
    content += `. Wearing ${clothing}`;
    currentBytes = encoder.encode(content).length;
  }
  
  if (data.scene && currentBytes < availableForContent - 25) {
    content += `. In ${data.scene}`;
    currentBytes = encoder.encode(content).length;
  }
  
  const finalPrompt = `Image components: ${content.trim()}${stylePart}`;
  const finalBytes = encoder.encode(finalPrompt).length;
  console.log(`[generate-scene-image] Final prompt: ${finalBytes} bytes`);
  
  return finalPrompt;
}

// ============================================================================
// GROK ONLY -- LLM CALLS (all go to xAI)
// ============================================================================

async function callAnalysisLLM(prompt: string, modelId: string): Promise<string> {
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
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("xAI analysis error:", response.status, errorText);
    throw new Error("Failed to analyze scene");
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

// GROK ONLY -- image generation always uses grok-2-image-1212
async function generateImage(prompt: string): Promise<string> {
  const XAI_API_KEY = Deno.env.get("XAI_API_KEY");
  if (!XAI_API_KEY) {
    throw new Error("XAI_API_KEY not configured");
  }

  console.log(`[generate-scene-image] Sending to Grok (grok-2-image-1212), prompt length: ${prompt.length} chars`);

  const response = await fetch("https://api.x.ai/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${XAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: 'grok-2-image-1212', // GROK ONLY
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
  
  if (data.data?.[0]?.revised_prompt) {
    console.log("[generate-scene-image] Grok revised prompt:", data.data[0].revised_prompt.slice(0, 200) + "...");
  }
  
  return data.data?.[0]?.url || null;
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

    // GROK ONLY -- always use xAI
    const effectiveTextModel = modelId || 'grok-3';
    
    console.log(`[generate-scene-image] Text model: ${effectiveTextModel} (xAI only)`);
    console.log(`[generate-scene-image] Image model: grok-2-image-1212 (xAI only)`);

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
      
      return `${c.name || 'Unknown'}: sex=${c.sexType || 'unknown'}, age=${c.age || 'adult'}, appearance=[${appearanceDetails}], wearing=[${wearingDetails}], mood=${c.currentMood || 'neutral'}`;
    }).join('\n');

    // Build dialogue context from recent messages
    const dialogueContext = recentMessages
      .slice(-6)
      .map((m: any) => `${m.role === 'user' ? 'Player' : 'AI'}: ${m.content.slice(0, 500)}`)
      .join('\n');

    // Step 1: Analyze scene with Grok
    const analysisPrompt = buildAnalysisPrompt(characterDescriptions, dialogueContext, sceneLocation || '');
    
    let structuredData: StructuredPromptData;
    try {
      const analysisResult = await callAnalysisLLM(analysisPrompt, effectiveTextModel);
      
      let cleanResult = analysisResult.trim();
      if (cleanResult.startsWith('```json')) cleanResult = cleanResult.slice(7);
      else if (cleanResult.startsWith('```')) cleanResult = cleanResult.slice(3);
      if (cleanResult.endsWith('```')) cleanResult = cleanResult.slice(0, -3);
      cleanResult = cleanResult.trim();
      
      structuredData = JSON.parse(cleanResult);
      console.log(`[generate-scene-image] Analysis complete: ${structuredData.characters.length} characters`);
    } catch (parseErr) {
      console.error("[generate-scene-image] Analysis failed, using fallback:", parseErr);
      structuredData = {
        characters: [{
          name: characters?.[0]?.name || 'Character',
          genderPresentation: 'feminine' as GenderPresentation,
          bodyDescription: 'adult character portrait',
          pose: 'standing',
          expression: 'neutral',
          clothing: 'casual outfit'
        }],
        scene: sceneLocation || 'room',
        cameraAngle: 'medium shot'
      };
    }

    // Step 2: Get style block based on art style and gender presentation
    const artStyleId = artStylePrompt?.startsWith('cinematic') ? 'cinematic-2-5d' : (artStylePrompt || 'cinematic-2-5d');
    const primaryGender = structuredData.characters[0]?.genderPresentation || 'feminine';
    const styleBlock = getStyleBlock(artStyleId, primaryGender, artStylePrompt);

    // Step 3: Assemble byte-limited prompt
    const imagePrompt = assemblePromptWithByteLimit(structuredData, styleBlock);

    // Step 4: Generate image with Grok
    const imageUrl = await generateImage(imagePrompt);

    if (!imageUrl) {
      return new Response(JSON.stringify({ 
        error: "No image generated" 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[generate-scene-image] Image generated successfully");

    return new Response(JSON.stringify({ 
      imageUrl,
      prompt: imagePrompt 
    }), {
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
