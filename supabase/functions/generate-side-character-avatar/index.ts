// ============================================================================
// GROK ONLY -- Avatar generation uses xAI Grok exclusively.
// Text prompt optimization: grok-3-mini. Image generation: grok-2-image-1212.
// Do NOT add Gemini or OpenAI.
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Step 1: Generate optimized image prompt using Grok
async function generateOptimizedPrompt(
  characterName: string,
  avatarPrompt: string,
  stylePrompt: string | null,
  negativePrompt: string | null
): Promise<string> {
  const XAI_API_KEY = Deno.env.get("XAI_API_KEY");
  if (!XAI_API_KEY) throw new Error("XAI_API_KEY not configured");

  const maxLength = 700; // xAI has strict 1024 byte limit
  
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

  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${XAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: 'grok-3-mini', // GROK ONLY
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
}

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

    const { avatarPrompt, characterName, modelId, stylePrompt, negativePrompt } = await req.json();
    
    if (!avatarPrompt) {
      return new Response(JSON.stringify({ error: "avatarPrompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[generate-avatar] Using xAI (Grok only) for ${characterName}`);

    // Step 1: Generate optimized prompt using Grok
    let optimizedPrompt: string;
    try {
      optimizedPrompt = await generateOptimizedPrompt(
        characterName,
        avatarPrompt,
        stylePrompt || null,
        negativePrompt || null
      );
      console.log(`[generate-avatar] Optimized prompt (${optimizedPrompt.length} chars):`, optimizedPrompt);
    } catch (err) {
      console.error("[generate-avatar] Prompt generation failed, using fallback:", err);
      optimizedPrompt = `Portrait of ${characterName}. ${avatarPrompt}`.substring(0, 700);
    }

    // Enforce strict byte limit for xAI
    const encoder = new TextEncoder();
    let bytes = encoder.encode(optimizedPrompt);
    if (bytes.length > 950) {
      let truncated = optimizedPrompt;
      while (encoder.encode(truncated).length > 950 && truncated.length > 0) {
        truncated = truncated.slice(0, -10);
      }
      optimizedPrompt = truncated.trim() + '...';
      console.log(`[generate-avatar] Truncated prompt to ${encoder.encode(optimizedPrompt).length} bytes`);
    }

    // Step 2: Generate image using grok-2-image-1212
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
        model: 'grok-2-image-1212', // GROK ONLY
        prompt: optimizedPrompt,
        n: 1,
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
    let imageUrl = data.data?.[0]?.url;

    // If API returned base64 instead of URL, upload to storage
    if (!imageUrl && data.data?.[0]?.b64_json) {
      const raw = data.data[0].b64_json;
      const imageBytes = Uint8Array.from(atob(raw), c => c.charCodeAt(0));
      const filename = `${user.id}/avatar-${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filename, imageBytes, { contentType: 'image/png', upsert: true });
      if (uploadError) {
        console.error('[generate-avatar] Storage upload failed:', uploadError);
        throw uploadError;
      }
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filename);
      imageUrl = urlData.publicUrl;
      console.log('[generate-avatar] Uploaded b64 to storage:', imageUrl);
    }

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

  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    console.error("generate-avatar error:", e);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
