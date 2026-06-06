// ============================================================================
// GROK ONLY -- Side character generation uses xAI Grok exclusively.
// Do NOT add Gemini or OpenAI. All text generation goes through xAI API.
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { checkRateLimit, getRateLimitHeaders } from "../_shared/rate-limit.ts";

const STRING_FIELD = { type: "string" };

const physicalAppearanceSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    hairColor: STRING_FIELD,
    eyeColor: STRING_FIELD,
    build: STRING_FIELD,
    bodyHair: STRING_FIELD,
    height: STRING_FIELD,
    breastSize: STRING_FIELD,
    genitalia: STRING_FIELD,
    skinTone: STRING_FIELD,
    makeup: STRING_FIELD,
    bodyMarkings: STRING_FIELD,
    temporaryConditions: STRING_FIELD,
  },
  required: [
    "hairColor",
    "eyeColor",
    "build",
    "bodyHair",
    "height",
    "breastSize",
    "genitalia",
    "skinTone",
    "makeup",
    "bodyMarkings",
    "temporaryConditions",
  ],
};

const currentlyWearingSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    top: STRING_FIELD,
    bottom: STRING_FIELD,
    undergarments: STRING_FIELD,
    miscellaneous: STRING_FIELD,
  },
  required: ["top", "bottom", "undergarments", "miscellaneous"],
};

const sideCharacterProfileResponseFormat = {
  type: "json_schema",
  json_schema: {
    name: "chronicle_side_character_profile",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        nicknames: STRING_FIELD,
        age: STRING_FIELD,
        sexType: STRING_FIELD,
        sexualOrientation: STRING_FIELD,
        roleDescription: STRING_FIELD,
        physicalAppearance: physicalAppearanceSchema,
        currentlyWearing: currentlyWearingSchema,
        background: {
          type: "object",
          additionalProperties: false,
          properties: {
            relationshipStatus: STRING_FIELD,
            residence: STRING_FIELD,
            educationLevel: STRING_FIELD,
          },
          required: ["relationshipStatus", "residence", "educationLevel"],
        },
        personality: {
          type: "object",
          additionalProperties: false,
          properties: {
            traits: {
              type: "array",
              items: STRING_FIELD,
            },
            miscellaneous: STRING_FIELD,
            secrets: STRING_FIELD,
            fears: STRING_FIELD,
            kinksFantasies: STRING_FIELD,
            desires: STRING_FIELD,
          },
          required: ["traits", "miscellaneous", "secrets", "fears", "kinksFantasies", "desires"],
        },
        avatarPrompt: STRING_FIELD,
      },
      required: [
        "nicknames",
        "age",
        "sexType",
        "sexualOrientation",
        "roleDescription",
        "physicalAppearance",
        "currentlyWearing",
        "background",
        "personality",
        "avatarPrompt",
      ],
    },
  },
};

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function normalizeForSupport(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function sourceSupportsValue(value: unknown, sourceText: string): boolean {
  const normalizedValue = normalizeForSupport(cleanString(value));
  if (!normalizedValue) return false;
  const normalizedSource = normalizeForSupport(sourceText);
  return normalizedSource.includes(normalizedValue);
}

function sourceSupportedOrEmpty(value: unknown, sourceText: string): string {
  const cleaned = cleanString(value);
  return sourceSupportsValue(cleaned, sourceText) ? cleaned : "";
}

function buildSanitizedAvatarPrompt(profile: Record<string, any>, name: string): string {
  const appearance = profile.physicalAppearance || {};
  const clothing = profile.currentlyWearing || {};
  const parts = [
    cleanString(name),
    cleanString(profile.age),
    cleanString(profile.sexType),
    cleanString(appearance.hairColor),
    cleanString(appearance.eyeColor),
    cleanString(appearance.build),
    cleanString(appearance.height),
    cleanString(appearance.skinTone),
    cleanString(appearance.makeup),
    cleanString(appearance.bodyMarkings),
    cleanString(appearance.temporaryConditions),
    cleanString(clothing.top),
    cleanString(clothing.bottom),
  ].filter(Boolean);

  const uniqueParts = Array.from(new Set(parts));
  return uniqueParts.length
    ? `Portrait of ${uniqueParts.join(", ")}.`
    : `Portrait of ${cleanString(name) || "supporting character"}.`;
}

function sanitizeGeneratedProfile(profile: Record<string, any>, sourceText: string, name: string): Record<string, any> {
  const physicalAppearance = profile?.physicalAppearance || {};
  const currentlyWearing = profile?.currentlyWearing || {};
  const background = profile?.background || {};
  const personality = profile?.personality || {};

  const sanitized = {
    nicknames: sourceSupportedOrEmpty(profile?.nicknames, sourceText),
    age: cleanString(profile?.age),
    sexType: cleanString(profile?.sexType),
    sexualOrientation: sourceSupportedOrEmpty(profile?.sexualOrientation, sourceText),
    roleDescription: cleanString(profile?.roleDescription),
    physicalAppearance: {
      hairColor: cleanString(physicalAppearance.hairColor),
      eyeColor: cleanString(physicalAppearance.eyeColor),
      build: cleanString(physicalAppearance.build),
      bodyHair: sourceSupportedOrEmpty(physicalAppearance.bodyHair, sourceText),
      height: cleanString(physicalAppearance.height),
      breastSize: sourceSupportedOrEmpty(physicalAppearance.breastSize, sourceText),
      genitalia: sourceSupportedOrEmpty(physicalAppearance.genitalia, sourceText),
      skinTone: cleanString(physicalAppearance.skinTone),
      makeup: cleanString(physicalAppearance.makeup),
      bodyMarkings: cleanString(physicalAppearance.bodyMarkings),
      temporaryConditions: cleanString(physicalAppearance.temporaryConditions),
    },
    currentlyWearing: {
      top: cleanString(currentlyWearing.top),
      bottom: cleanString(currentlyWearing.bottom),
      undergarments: sourceSupportedOrEmpty(currentlyWearing.undergarments, sourceText),
      miscellaneous: cleanString(currentlyWearing.miscellaneous),
    },
    background: {
      relationshipStatus: sourceSupportedOrEmpty(background.relationshipStatus, sourceText),
      residence: cleanString(background.residence),
      educationLevel: cleanString(background.educationLevel),
    },
    personality: {
      traits: Array.isArray(personality.traits)
        ? personality.traits.map(cleanString).filter(Boolean).slice(0, 2)
        : [],
      miscellaneous: cleanString(personality.miscellaneous),
      secrets: sourceSupportedOrEmpty(personality.secrets, sourceText),
      fears: sourceSupportedOrEmpty(personality.fears, sourceText),
      kinksFantasies: sourceSupportedOrEmpty(personality.kinksFantasies, sourceText),
      desires: sourceSupportedOrEmpty(personality.desires, sourceText),
    },
    avatarPrompt: "",
  };

  return {
    ...sanitized,
    avatarPrompt: buildSanitizedAvatarPrompt(sanitized, name),
  };
}

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
      scope: "generate-side-character",
      key: user.id,
      windowMs: 60_000,
      max: 20,
    });
    if (!rateDecision.allowed) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded for side character generation. Please try again shortly.",
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

    const { name, dialogContext, extractedTraits, worldContext, modelId, debugTrace = false } = await req.json();
    
    // GROK ONLY -- always use xAI
    const effectiveModelId = modelId === 'grok-4.3' ? modelId : 'grok-4.3';
    
    console.log(`[generate-side-character] Using model: ${effectiveModelId} (xAI)`);

    const XAI_API_KEY = Deno.env.get("XAI_API_KEY");
    if (!XAI_API_KEY) {
      throw new Error("XAI_API_KEY not configured. Please add your Grok API key in settings.");
    }

    const sourceSupportText = [
      dialogContext || "",
      JSON.stringify(extractedTraits || {}),
    ].join("\n");

    const prompt = `Based on this character's first appearance in a roleplay story, generate a starter side-character profile.

CHARACTER NAME: ${name}
FIRST APPEARANCE DIALOG: ${dialogContext}
EXTRACTED TRAITS: ${JSON.stringify(extractedTraits || {})}
WORLD CONTEXT: ${worldContext || 'Modern setting'}

Generate the requested JSON object using only the supplied first appearance, extracted traits, and world context. Be creative only where the supplied context supports a reasonable public-facing inference. Leave private or hidden details empty unless the first appearance directly establishes them. Do not infer private sexuality, intimate anatomy, undergarments, secrets, fears, kinks, or hidden desires from name, role, genre, or story tone alone.

Public visible fields may be estimated cautiously from the first appearance. Private fields must stay empty unless directly supported. The avatarPrompt must describe public visible appearance only.

Return ONLY valid JSON, no markdown formatting.`;

    const xaiRequestBody = {
      model: effectiveModelId,
      messages: [
        {
          role: "system",
          content: "You generate source-supported starter profiles for side characters in roleplay stories. Return only the requested JSON object. Do not invent private or hidden details from thin context."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.55,
      response_format: sideCharacterProfileResponseFormat,
    };
    const debugPayload = debugTrace === true
      ? {
          modelRequest: {
            endpoint: "https://api.x.ai/v1/chat/completions",
            method: "POST",
            capturedAt: Date.now(),
            requestBody: xaiRequestBody,
          },
        }
      : null;

    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${XAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(xaiRequestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("xAI error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI generation failed", details: errorText }), {
        status: 500,
        headers: { ...corsHeaders, ...rateHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    
    let cleanContent = content.trim();
    if (cleanContent.startsWith("```json")) {
      cleanContent = cleanContent.slice(7);
    } else if (cleanContent.startsWith("```")) {
      cleanContent = cleanContent.slice(3);
    }
    if (cleanContent.endsWith("```")) {
      cleanContent = cleanContent.slice(0, -3);
    }
    cleanContent = cleanContent.trim();
    
    try {
      const profile = sanitizeGeneratedProfile(JSON.parse(cleanContent), sourceSupportText, name);
      return new Response(JSON.stringify({ ...profile, ...(debugPayload ? { chronicle_debug_payload: debugPayload } : {}) }), {
        headers: { ...corsHeaders, ...rateHeaders, "Content-Type": "application/json" },
      });
    } catch (parseError) {
      console.error("Failed to parse AI response:", cleanContent);
      return new Response(JSON.stringify({ 
        error: "Failed to parse AI response",
        raw: cleanContent 
      }), {
        status: 500,
        headers: { ...corsHeaders, ...rateHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    console.error("generate-side-character error:", e);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
