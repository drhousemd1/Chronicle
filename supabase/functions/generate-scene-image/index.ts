// ============================================================================
// GROK ONLY -- Scene image generation uses xAI Grok exclusively.
// Text analysis: grok-4.3. Image generation: grok-imagine-image.
// Do NOT add Gemini or OpenAI.
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { checkRateLimit, getRateLimitHeaders } from "../_shared/rate-limit.ts";
import { recordServerAiUsage } from "../_shared/server-usage.ts";

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

const SCENE_IMAGE_APPEARANCE_KEYS = new Set([
  "hairColor",
  "eyeColor",
  "build",
  "height",
  "skinTone",
  "makeup",
  "bodyMarkings",
  "temporaryConditions",
]);

const SCENE_IMAGE_CLOTHING_KEYS = new Set(["top", "bottom"]);

const sceneAnalysisResponseFormat = {
  type: "json_schema",
  json_schema: {
    name: "chronicle_scene_image_analysis",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        characters: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              name: { type: "string" },
              genderPresentation: { type: "string", enum: ["feminine", "masculine", "androgynous"] },
              weightedTraits: { type: ["string", "null"] },
              bodyDescription: { type: "string" },
              pose: { type: "string" },
              expression: { type: "string" },
              clothing: { type: "string" },
            },
            required: ["name", "genderPresentation", "weightedTraits", "bodyDescription", "pose", "expression", "clothing"],
          },
        },
        scene: { type: "string" },
        cameraAngle: { type: "string", enum: ["medium shot", "full body", "close-up"] },
      },
      required: ["characters", "scene", "cameraAngle"],
    },
  },
};

// Style block is now passed dynamically from the frontend via artStylePrompt
function getStyleBlock(styleId: string, gender: GenderPresentation, fallbackPrompt?: string): string {
  // The frontend now sends the full style prompt, so fallbackPrompt is the primary source
  return fallbackPrompt || "Polished 2.5-D semi-realistic digital illustration, clean digital paintover, smooth airbrushed skin textures, airbrushed gradients and seamless clean transitions, simplified textures with no photographic microtexture, illustrative highlight shapes on metal and skin, realistic facial proportions and natural eye size, consistent lighting, no lineart, no cel shading, clean high-detail finish, soft background blur, warm rim light glow, high contrast soft pastel palette.";
}

// ============================================================================
// GROK ONLY -- Default text model for scene analysis
// ============================================================================

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
      "weightedTraits": "string with (trait:weight) format for explicit relevant visible traits, or null if none",
      "bodyDescription": "short visible appearance phrase from established data, or generic adult character if unavailable",
      "pose": "body position established by dialogue actions, or empty string",
      "expression": "facial expression established by dialogue emotion, or empty string",
      "clothing": "established visible clothing, simplified, or empty string"
    }
  ],
  "scene": "one or two words for location",
  "cameraAngle": "medium shot" | "full body" | "close-up"
}

===== WEIGHTING RULES =====
Use weightedTraits sparingly. Add weights only for visual traits that are explicitly present in character data and relevant to the requested image. Prefer distinctive non-sensitive visible traits before body or sexual emphasis. Apply body or sexual weights only when those traits are explicit and visually relevant to this image. If unsure, set weightedTraits to null.

===== GENDER PRESENTATION RULES =====
Base genderPresentation on visible presentation from established character data or recent dialogue. Consider styling, clothing, build, and described appearance. Use "androgynous" when presentation is mixed, unclear, or not visually established. Do not infer private anatomy or identity from sparse cues.

===== INFERENCE RULES =====
If character data is sparse:
- Use null, empty, or generic values when visual data is not established by character data or recent dialogue.
- Do not fill visual fields by guessing from story genre, sexual content, or private character data.
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

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function normalizeGenderPresentation(value: unknown): GenderPresentation {
  return value === "feminine" || value === "masculine" || value === "androgynous"
    ? value
    : "androgynous";
}

function normalizeWeightedTraits(value: unknown): string | undefined {
  const cleaned = cleanString(value);
  if (!cleaned || cleaned.toLowerCase() === "null" || cleaned.toLowerCase() === "none") {
    return undefined;
  }
  return cleaned;
}

function normalizeStructuredPromptData(
  value: unknown,
  sourceCharacters: any[],
  sceneLocation: string,
): StructuredPromptData {
  const raw = value && typeof value === "object" ? value as any : {};
  const rawCharacters = Array.isArray(raw.characters) ? raw.characters : [];
  const fallbackCharacters = Array.isArray(sourceCharacters) && sourceCharacters.length
    ? sourceCharacters
    : [{ name: "Character" }];

  const characters = (rawCharacters.length ? rawCharacters : fallbackCharacters).map((character: any, index: number) => ({
    name: cleanString(character?.name) || cleanString(fallbackCharacters[index]?.name) || "Character",
    genderPresentation: normalizeGenderPresentation(character?.genderPresentation),
    weightedTraits: normalizeWeightedTraits(character?.weightedTraits),
    bodyDescription: cleanString(character?.bodyDescription) || "generic adult character",
    pose: cleanString(character?.pose),
    expression: cleanString(character?.expression),
    clothing: cleanString(character?.clothing),
  }));

  return {
    characters,
    scene: cleanString(raw.scene) || cleanString(sceneLocation) || "unspecified setting",
    cameraAngle: ["medium shot", "full body", "close-up"].includes(cleanString(raw.cameraAngle))
      ? cleanString(raw.cameraAngle)
      : "medium shot",
  };
}

// ============================================================================
// GROK ONLY -- LLM CALLS (all go to xAI)
// ============================================================================

async function callAnalysisLLM(prompt: string, modelId: string): Promise<string> {
  const XAI_API_KEY = Deno.env.get("XAI_API_KEY");
  if (!XAI_API_KEY) {
    throw new Error("XAI_API_KEY not configured");
  }

  const textModel = modelId === 'grok-4.3' ? modelId : 'grok-4.3';
  
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
      response_format: sceneAnalysisResponseFormat,
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

// GROK ONLY -- image generation always uses grok-imagine-image
async function generateImage(prompt: string): Promise<string> {
  const XAI_API_KEY = Deno.env.get("XAI_API_KEY");
  if (!XAI_API_KEY) {
    throw new Error("XAI_API_KEY not configured");
  }

  console.log(`[generate-scene-image] Sending to Grok (grok-imagine-image), prompt length: ${prompt.length} chars`);

  const response = await fetch("https://api.x.ai/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${XAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: 'grok-imagine-image', // GROK ONLY
      prompt: prompt,
      n: 1,
      size: "1280x896", // 4:3 landscape - optimal for scene display in chat
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
      scope: "generate-scene-image",
      key: user.id,
      windowMs: 60_000,
      max: 12,
    });
    if (!rateDecision.allowed) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded for scene image generation. Please try again shortly.",
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
        headers: { ...corsHeaders, ...rateHeaders, "Content-Type": "application/json" },
      });
    }

    // GROK ONLY -- always use xAI
    const effectiveTextModel = modelId === 'grok-4.3' ? modelId : 'grok-4.3';
    
    console.log(`[generate-scene-image] Text model: ${effectiveTextModel} (xAI only)`);
    console.log(`[generate-scene-image] Image model: grok-imagine-image (xAI only)`);

    // Build character descriptions
    const characterDescriptions = (characters || []).map((c: any) => {
      const appearance = c.physicalAppearance || {};
      const wearing = c.currentlyWearing || {};
      
      const appearanceDetails = Object.entries(appearance)
        .filter(([key, value]) => SCENE_IMAGE_APPEARANCE_KEYS.has(key) && value)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
      
      const wearingDetails = Object.entries(wearing)
        .filter(([key, value]) => SCENE_IMAGE_CLOTHING_KEYS.has(key) && value)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
      
      return `${c.name || 'Unknown'}: visible appearance=[${appearanceDetails}], visible clothing=[${wearingDetails}]`;
    }).join('\n');

    // Build dialogue context from recent messages
    const dialogueContext = recentMessages
      .slice(-6)
      .map((m: any) => {
        const text = typeof m.content === 'string' ? m.content : typeof m.text === 'string' ? m.text : '';
        return `${m.role === 'user' ? 'Player' : 'AI'}: ${text.slice(0, 500)}`;
      })
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
      
      structuredData = normalizeStructuredPromptData(JSON.parse(cleanResult), characters || [], sceneLocation || '');
      console.log(`[generate-scene-image] Analysis complete: ${structuredData.characters.length} characters`);
    } catch (parseErr) {
      console.error("[generate-scene-image] Analysis failed, using fallback:", parseErr);
      structuredData = normalizeStructuredPromptData({}, characters || [], sceneLocation || '');
    }

    // Step 2: Get style block based on art style and gender presentation
    const artStyleId = artStylePrompt?.startsWith('cinematic') ? 'cinematic-2-5d' : (artStylePrompt || 'cinematic-2-5d');
    const primaryGender = structuredData.characters[0]?.genderPresentation || 'androgynous';
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
        headers: { ...corsHeaders, ...rateHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[generate-scene-image] Image generated successfully");

    await recordServerAiUsage({
      userId: user.id,
      eventType: "scene_image_generated",
      functionName: "generate-scene-image",
      metadata: {
        modelId: "grok-imagine-image",
        textModelId: effectiveTextModel,
        status: "success",
        recentMessageCount: Array.isArray(recentMessages) ? recentMessages.length : 0,
        characterCount: Array.isArray(characters) ? characters.length : 0,
        promptChars: imagePrompt.length,
      },
    });

    return new Response(JSON.stringify({ 
      imageUrl,
      prompt: imagePrompt 
    }), {
      headers: { ...corsHeaders, ...rateHeaders, "Content-Type": "application/json" },
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
