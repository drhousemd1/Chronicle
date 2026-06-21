// ============================================================================
// GROK ONLY -- Avatar generation uses xAI Grok exclusively.
// Text prompt optimization: grok-4.3. Image generation: grok-imagine-image.
// Do NOT add Gemini or OpenAI.
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { shouldReturnAdminDebugTrace } from "../_shared/admin-debug.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { checkRateLimit, getRateLimitHeaders } from "../_shared/rate-limit.ts";
import { recordServerAiUsage, type ServerAiUsageEventType } from "../_shared/server-usage.ts";
import { readXaiErrorText } from "../_shared/xai-responses.ts";

type DebugModelRequest = {
  label?: string;
  endpoint: string;
  method?: string;
  capturedAt?: number;
  requestBody: unknown;
  notes?: string[];
};

// Step 1: Generate optimized image prompt using Grok
async function generateOptimizedPrompt(
  characterName: string,
  avatarPrompt: string,
  stylePrompt: string | null,
  negativePrompt: string | null,
  debugModelRequests?: DebugModelRequest[],
): Promise<{
  optimizedPrompt: string;
  providerUsageMetadata: Record<string, number | null>;
}> {
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

  const xaiRequestBody = {
    model: 'grok-4.3', // GROK ONLY
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    max_tokens: 300,
    temperature: 0.7
  };
  debugModelRequests?.push({
    label: "Avatar prompt optimization",
    endpoint: "https://api.x.ai/v1/chat/completions",
    method: "POST",
    capturedAt: Date.now(),
    requestBody: xaiRequestBody,
  });

  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${XAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(xaiRequestBody),
  });

  if (!response.ok) {
    const errorText = await readXaiErrorText(response);
    console.error("[generateOptimizedPrompt] xAI error:", errorText);
    throw new Error("Failed to generate prompt via xAI");
  }

  const data = await response.json();
  const promptTokenDetails = data?.usage?.prompt_tokens_details && typeof data.usage.prompt_tokens_details === "object"
    ? data.usage.prompt_tokens_details as Record<string, unknown>
    : {};
  return {
    optimizedPrompt: data.choices?.[0]?.message?.content?.trim() || avatarPrompt,
    providerUsageMetadata: {
      providerUsageRequestCount: 1,
      providerInputTokens: typeof data?.usage?.prompt_tokens === "number" ? data.usage.prompt_tokens : null,
      providerCachedInputTokens: typeof promptTokenDetails.cached_tokens === "number" ? promptTokenDetails.cached_tokens : null,
      providerOutputTokens: typeof data?.usage?.completion_tokens === "number" ? data.usage.completion_tokens : null,
      providerTotalTokens: typeof data?.usage?.total_tokens === "number" ? data.usage.total_tokens : null,
    },
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
      scope: "generate-side-character-avatar",
      key: user.id,
      windowMs: 60_000,
      max: 12,
    });
    if (!rateDecision.allowed) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded for avatar generation. Please try again shortly.",
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

    const { avatarPrompt, characterName, modelId, styleId, stylePrompt, gender, negativePrompt, usageEventType, debugTrace = false } = await req.json();
    const debugTraceAllowed = await shouldReturnAdminDebugTrace(supabase, user.id, debugTrace, "[generate-avatar]");
    const avatarUsageEventType: ServerAiUsageEventType = usageEventType === "character_avatar_generated"
      ? "character_avatar_generated"
      : "side_character_avatar_generated";
    
    if (!avatarPrompt) {
      return new Response(JSON.stringify({ error: "avatarPrompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, ...rateHeaders, "Content-Type": "application/json" },
      });
    }

    // BF-02: Resolve the art-style backend prompt server-side from styleId
    // (+ gender variant when provided) using the service role. Never trust
    // client-supplied prompt text for normal runtime.
    let resolvedStylePrompt = '';
    const resolvedStyleId: string | null = typeof styleId === 'string' ? styleId : null;
    if (resolvedStyleId) {
      try {
        const admin = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        );
        const { data: styleRow } = await admin
          .from('art_styles')
          .select('backend_prompt, backend_prompt_masculine, backend_prompt_androgynous')
          .eq('id', resolvedStyleId)
          .maybeSingle();
        const row = (styleRow as any) || {};
        if (gender === 'masculine' && row.backend_prompt_masculine) {
          resolvedStylePrompt = row.backend_prompt_masculine;
        } else if (gender === 'androgynous' && row.backend_prompt_androgynous) {
          resolvedStylePrompt = row.backend_prompt_androgynous;
        } else {
          resolvedStylePrompt = row.backend_prompt || '';
        }
      } catch (err) {
        console.error('[generate-avatar] art_styles lookup failed:', err);
      }
    }
    // Legacy backward-compat only: if no styleId AND no DB row, accept the
    // legacy client `stylePrompt`. Normal runtime should not reach this.
    if (!resolvedStylePrompt && typeof stylePrompt === 'string') {
      resolvedStylePrompt = stylePrompt;
    }

    console.log(`[generate-avatar] Using xAI (Grok only) for ${characterName}`);

    // Step 1: Generate optimized prompt using Grok
    let optimizedPrompt: string;
    let promptUsageMetadata: Record<string, number | null> = {};
    const debugModelRequests: DebugModelRequest[] = [];
    try {
      const promptResult = await generateOptimizedPrompt(
        characterName,
        avatarPrompt,
        resolvedStylePrompt || null,
        negativePrompt || null,
        debugTraceAllowed ? debugModelRequests : undefined,
      );
      optimizedPrompt = promptResult.optimizedPrompt;
      promptUsageMetadata = promptResult.providerUsageMetadata;
      console.log(`[generate-avatar] Optimized prompt (${optimizedPrompt.length} chars):`, optimizedPrompt);
    } catch (err) {
      console.error("[generate-avatar] Prompt generation failed, using fallback:", err);
      optimizedPrompt = `Portrait of ${characterName}. ${avatarPrompt}`.substring(0, 700);
    }

    // Enforce strict byte limit for xAI
    const encoder = new TextEncoder();
    const bytes = encoder.encode(optimizedPrompt);
    if (bytes.length > 950) {
      let truncated = optimizedPrompt;
      while (encoder.encode(truncated).length > 950 && truncated.length > 0) {
        truncated = truncated.slice(0, -10);
      }
      optimizedPrompt = truncated.trim() + '...';
      console.log(`[generate-avatar] Truncated prompt to ${encoder.encode(optimizedPrompt).length} bytes`);
    }

    // Step 2: Generate image using grok-imagine-image
    const XAI_API_KEY = Deno.env.get("XAI_API_KEY");
    if (!XAI_API_KEY) {
      throw new Error("XAI_API_KEY not configured. Please add your Grok API key in settings.");
    }

    const imageRequestBody = {
      model: 'grok-imagine-image', // GROK ONLY
      prompt: optimizedPrompt,
      n: 1,
    };
    if (debugTraceAllowed) {
      debugModelRequests.push({
        label: "Avatar image generation",
        endpoint: "https://api.x.ai/v1/images/generations",
        method: "POST",
        capturedAt: Date.now(),
        requestBody: imageRequestBody,
      });
    }

    let response: Response;
    try {
      response = await fetch("https://api.x.ai/v1/images/generations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${XAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(imageRequestBody),
      });
    } catch (fetchError) {
      const providerRequestError = fetchError instanceof Error ? fetchError.message : String(fetchError);
      await recordServerAiUsage({
        userId: user.id,
        eventType: avatarUsageEventType,
        functionName: "generate-side-character-avatar",
        metadata: {
          modelId: "grok-imagine-image",
          promptModelId: modelId === "grok-4.3" ? modelId : "grok-4.3",
          status: "provider_request_error",
          providerRequestError,
          providerRequestCount: 2,
          providerImageRequestCount: 1,
          ...promptUsageMetadata,
          imageCount: 1,
          avatarUsageKind: avatarUsageEventType,
          promptChars: optimizedPrompt.length,
          optimizedPromptChars: optimizedPrompt.length,
          styleId: resolvedStyleId,
          hadStylePrompt: Boolean(resolvedStylePrompt),
        },
      });
      return new Response(JSON.stringify({ error: "Image generation request failed", details: providerRequestError }), {
        status: 500,
        headers: { ...corsHeaders, ...rateHeaders, "Content-Type": "application/json" },
      });
    }

	    if (!response.ok) {
	      const errorText = await readXaiErrorText(response);
	      console.error("xAI image generation error:", response.status, errorText);
	      await recordServerAiUsage({
	        userId: user.id,
	        eventType: avatarUsageEventType,
	        functionName: "generate-side-character-avatar",
	        metadata: {
	          modelId: "grok-imagine-image",
	          promptModelId: modelId === "grok-4.3" ? modelId : "grok-4.3",
	          status: "provider_http_error",
	          providerRequestCount: 2,
	          providerImageRequestCount: 1,
	          providerHttpStatus: response.status,
	          ...promptUsageMetadata,
	          imageCount: 1,
	          avatarUsageKind: avatarUsageEventType,
	          promptChars: optimizedPrompt.length,
	          optimizedPromptChars: optimizedPrompt.length,
	          styleId: resolvedStyleId,
	          hadStylePrompt: Boolean(resolvedStylePrompt),
	        },
	      });
	      return new Response(JSON.stringify({ error: "Image generation failed", details: errorText }), {
        status: 500,
        headers: { ...corsHeaders, ...rateHeaders, "Content-Type": "application/json" },
      });
    }

    let data: any;
    try {
      data = await response.json();
    } catch (parseError) {
      const providerBodyError = parseError instanceof Error ? parseError.message : "Malformed provider JSON";
      await recordServerAiUsage({
        userId: user.id,
        eventType: avatarUsageEventType,
        functionName: "generate-side-character-avatar",
        metadata: {
          modelId: "grok-imagine-image",
          promptModelId: modelId === "grok-4.3" ? modelId : "grok-4.3",
          status: "provider_response_parse_error",
          providerBodyError,
          providerRequestCount: 2,
          providerImageRequestCount: 1,
          ...promptUsageMetadata,
          imageCount: 1,
          avatarUsageKind: avatarUsageEventType,
          promptChars: optimizedPrompt.length,
          optimizedPromptChars: optimizedPrompt.length,
          styleId: resolvedStyleId,
          hadStylePrompt: Boolean(resolvedStylePrompt),
        },
      });
      return new Response(JSON.stringify({ error: "Image generation response was unreadable", details: providerBodyError }), {
        status: 500,
        headers: { ...corsHeaders, ...rateHeaders, "Content-Type": "application/json" },
      });
    }
    let imageUrl = data.data?.[0]?.url;

    // Single-owner upload contract (Batch D Stage C): this edge function is
    // the sole writer for generated avatar bytes. Always upload to the
    // private character_avatars_private bucket and return the durable path
    // + sentinel + signed URL. Callers MUST persist avatar_path and MUST
    // NOT re-upload the bytes themselves.
    let imagePath: string | null = null;
    let storageSentinel: string | null = null;
    let imageBytes: Uint8Array | null = null;
    let avatarContentType = 'image/png';
    let imageDownloadError: string | null = null;
    let imageDecodeError: string | null = null;
    if (data.data?.[0]?.b64_json) {
      const raw = data.data[0].b64_json;
      try {
        imageBytes = Uint8Array.from(atob(raw), c => c.charCodeAt(0));
      } catch (err) {
        imageDecodeError = err instanceof Error ? err.message : String(err);
        console.error('[generate-avatar] Failed to decode xAI b64 image:', err);
      }
    } else if (imageUrl) {
      try {
        const fetched = await fetch(imageUrl);
        if (!fetched.ok) throw new Error(`fetch xAI url ${fetched.status}`);
        avatarContentType = fetched.headers.get('content-type') || 'image/png';
        imageBytes = new Uint8Array(await fetched.arrayBuffer());
      } catch (err) {
        imageDownloadError = err instanceof Error ? err.message : String(err);
        console.error('[generate-avatar] Failed to download xAI URL:', err);
      }
    }
    if (imageDecodeError && !imageBytes) {
      await recordServerAiUsage({
        userId: user.id,
        eventType: avatarUsageEventType,
        functionName: "generate-side-character-avatar",
        metadata: {
          modelId: "grok-imagine-image",
          promptModelId: modelId === "grok-4.3" ? modelId : "grok-4.3",
          status: "provider_image_decode_failed",
          providerImageDecodeError: imageDecodeError,
          providerRequestCount: 2,
          providerImageRequestCount: 1,
          ...promptUsageMetadata,
          imageCount: 1,
          avatarUsageKind: avatarUsageEventType,
          promptChars: optimizedPrompt.length,
          optimizedPromptChars: optimizedPrompt.length,
          styleId: resolvedStyleId,
          hadStylePrompt: Boolean(resolvedStylePrompt),
        },
      });
      return new Response(JSON.stringify({
        error: "Failed to decode generated image",
        debug: data,
      }), {
        status: 500,
        headers: { ...corsHeaders, ...rateHeaders, "Content-Type": "application/json" },
      });
    }
    if (imageDownloadError && !imageBytes) {
      await recordServerAiUsage({
        userId: user.id,
        eventType: avatarUsageEventType,
        functionName: "generate-side-character-avatar",
        metadata: {
          modelId: "grok-imagine-image",
          promptModelId: modelId === "grok-4.3" ? modelId : "grok-4.3",
          status: "provider_image_download_failed",
          providerImageDownloadError: imageDownloadError,
          providerRequestCount: 2,
          providerImageRequestCount: 1,
          ...promptUsageMetadata,
          imageCount: 1,
          avatarUsageKind: avatarUsageEventType,
          promptChars: optimizedPrompt.length,
          optimizedPromptChars: optimizedPrompt.length,
          styleId: resolvedStyleId,
          hadStylePrompt: Boolean(resolvedStylePrompt),
        },
      });
      return new Response(JSON.stringify({
        error: "Failed to download generated image",
        debug: data,
      }), {
        status: 500,
        headers: { ...corsHeaders, ...rateHeaders, "Content-Type": "application/json" },
      });
    }
    if (imageBytes) {
      const ext = avatarContentType.includes('jpeg') ? 'jpg' : 'png';
      const filename = `${user.id}/avatar-${Date.now()}.png`;
      const finalName = filename.replace(/\.png$/, `.${ext}`);
      const { error: uploadError } = await supabase.storage
        .from('character_avatars_private')
        .upload(finalName, imageBytes, { contentType: avatarContentType, upsert: true });
      if (uploadError) {
        console.error('[generate-avatar] Storage upload failed:', uploadError);
        await recordServerAiUsage({
          userId: user.id,
          eventType: avatarUsageEventType,
          functionName: "generate-side-character-avatar",
          metadata: {
            modelId: "grok-imagine-image",
            promptModelId: modelId === "grok-4.3" ? modelId : "grok-4.3",
            status: "storage_upload_failed",
            providerRequestCount: 2,
            providerImageRequestCount: 1,
            ...promptUsageMetadata,
            imageCount: 1,
            avatarUsageKind: avatarUsageEventType,
            promptChars: optimizedPrompt.length,
            optimizedPromptChars: optimizedPrompt.length,
            styleId: resolvedStyleId,
            hadStylePrompt: Boolean(resolvedStylePrompt),
          },
        });
        throw uploadError;
      }
      imagePath = finalName;
      storageSentinel = `storage://character_avatars_private/${finalName}`;
      const { data: signedData, error: signError } = await supabase.storage
        .from('character_avatars_private')
        .createSignedUrl(finalName, 60 * 60);
      if (signError) {
        console.error('[generate-avatar] Signed URL failed:', signError);
        await recordServerAiUsage({
          userId: user.id,
          eventType: avatarUsageEventType,
          functionName: "generate-side-character-avatar",
          metadata: {
            modelId: "grok-imagine-image",
            promptModelId: modelId === "grok-4.3" ? modelId : "grok-4.3",
            status: "signed_url_failed",
            providerRequestCount: 2,
            providerImageRequestCount: 1,
            ...promptUsageMetadata,
            imageCount: 1,
            avatarUsageKind: avatarUsageEventType,
            promptChars: optimizedPrompt.length,
            optimizedPromptChars: optimizedPrompt.length,
            styleId: resolvedStyleId,
            hadStylePrompt: Boolean(resolvedStylePrompt),
          },
        });
        throw signError;
      }
      imageUrl = signedData?.signedUrl || '';
      console.log('[generate-avatar] Uploaded to private storage:', finalName);
    }

    if (!imageUrl) {
      console.error("No image URL in xAI response:", JSON.stringify(data, null, 2));
      await recordServerAiUsage({
        userId: user.id,
        eventType: avatarUsageEventType,
        functionName: "generate-side-character-avatar",
        metadata: {
          modelId: "grok-imagine-image",
          promptModelId: modelId === "grok-4.3" ? modelId : "grok-4.3",
          status: "provider_no_image",
          providerRequestCount: 2,
          providerImageRequestCount: 1,
          ...promptUsageMetadata,
          imageCount: 1,
          avatarUsageKind: avatarUsageEventType,
          promptChars: optimizedPrompt.length,
          optimizedPromptChars: optimizedPrompt.length,
          styleId: resolvedStyleId,
          hadStylePrompt: Boolean(resolvedStylePrompt),
        },
      });
      return new Response(JSON.stringify({ 
        error: "No image generated",
        debug: data 
      }), {
        status: 500,
        headers: { ...corsHeaders, ...rateHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Avatar generated for ${characterName} via xAI`);

    await recordServerAiUsage({
      userId: user.id,
      eventType: avatarUsageEventType,
      functionName: "generate-side-character-avatar",
      metadata: {
        modelId: "grok-imagine-image",
        promptModelId: modelId === "grok-4.3" ? modelId : "grok-4.3",
        status: "success",
        providerRequestCount: 2,
        providerImageRequestCount: 1,
        ...promptUsageMetadata,
        imageCount: 1,
        avatarUsageKind: avatarUsageEventType,
        promptChars: optimizedPrompt.length,
        optimizedPromptChars: optimizedPrompt.length,
        styleId: resolvedStyleId,
        hadStylePrompt: Boolean(resolvedStylePrompt),
      },
    });

    return new Response(JSON.stringify({
      imageUrl,
      imagePath,
      storageSentinel,
      ...(debugTraceAllowed ? { chronicle_debug_payload: { modelRequests: debugModelRequests } } : {}),
    }), {
      headers: { ...corsHeaders, ...rateHeaders, "Content-Type": "application/json" },
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
