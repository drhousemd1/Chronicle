// ============================================================================
// GROK ONLY -- Side character generation uses xAI Grok exclusively.
// Do NOT add Gemini or OpenAI. All text generation goes through xAI API.
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { name, dialogContext, extractedTraits, worldContext, modelId } = await req.json();
    
    // GROK ONLY -- always use xAI
    const effectiveModelId = modelId || 'grok-3';
    
    console.log(`[generate-side-character] Using model: ${effectiveModelId} (xAI)`);

    const XAI_API_KEY = Deno.env.get("XAI_API_KEY");
    if (!XAI_API_KEY) {
      throw new Error("XAI_API_KEY not configured. Please add your Grok API key in settings.");
    }

    const prompt = `Based on this character's first appearance in a roleplay scenario, generate a detailed profile.

CHARACTER NAME: ${name}
FIRST APPEARANCE DIALOG: ${dialogContext}
EXTRACTED TRAITS: ${JSON.stringify(extractedTraits || {})}
WORLD CONTEXT: ${worldContext || 'Modern setting'}

Generate a JSON object with these fields (be creative but consistent with the dialog context):
- nicknames: comma-separated string of alternative names, pet names, or aliases this character might be called (can be empty if none)
- age: estimated age as string (e.g., "25", "mid-30s")
- sexType: sex/gender identity (e.g., "Female", "Male", "Non-binary")
- roleDescription: their role in the story - what they do or their relationship to other characters (1 sentence)
- physicalAppearance: object with these fields (fill in what can be inferred, leave empty string if unknown):
  - hairColor: string
  - eyeColor: string
  - build: string (e.g., "Athletic", "Slim", "Curvy")
  - height: string (e.g., "Tall", "Average", "Short")
  - skinTone: string
  - bodyHair: string
  - breastSize: string (if applicable)
  - genitalia: string (if mentioned)
  - makeup: string
  - bodyMarkings: string
  - temporaryConditions: string
- currentlyWearing: object with:
  - top: string
  - bottom: string
  - undergarments: string
  - miscellaneous: string
- background: object with:
  - relationshipStatus: string (e.g., "Single", "Married", "Unknown")
  - residence: string (where they live)
  - educationLevel: string
- personality: object with:
  - traits: array of 1-2 personality traits as strings
  - miscellaneous: string (other personality notes)
  - secrets: string (a secret they might have)
  - fears: string
  - kinksFantasies: string (if applicable to adult content)
  - desires: string (what they want)
- avatarPrompt: a detailed image generation prompt for creating their portrait (describe their appearance for an AI image generator)

Return ONLY valid JSON, no markdown formatting.`;

    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${XAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: effectiveModelId,
        messages: [
          { 
            role: "system", 
            content: "You are a creative writing assistant specialized in character creation for roleplay scenarios. You generate detailed, consistent character profiles. Return ONLY valid JSON with no markdown code blocks or extra formatting." 
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.8
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("xAI error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI generation failed", details: errorText }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
      const profile = JSON.parse(cleanContent);
      return new Response(JSON.stringify(profile), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (parseError) {
      console.error("Failed to parse AI response:", cleanContent);
      return new Response(JSON.stringify({ 
        error: "Failed to parse AI response",
        raw: cleanContent 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
