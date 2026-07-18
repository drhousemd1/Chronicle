// ============================================================================
// GROK ONLY -- All memory compression uses xAI Grok. No Gemini. No OpenAI.
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { shouldReturnAdminDebugTrace } from "../_shared/admin-debug.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { checkRateLimit, getRateLimitHeaders } from "../_shared/rate-limit.ts";
import { recordServerAiUsage } from "../_shared/server-usage.ts";
import { buildProviderUsageMetadata } from "../_shared/usage-cost.ts";
import { callXaiResponses, extractXaiResponsesText, extractXaiResponsesUsage, getXaiResponsesBodyError } from "../_shared/xai-responses.ts";

const DAY_SYNOPSIS_MAX_CHARS = 900;
const SUPPORT_REASONING_EFFORT = "medium" as const;
const SUPPORT_STORE = false;
const SUPPORT_RATE_LIMIT_WINDOW_MS = 60_000;
const SUPPORT_RATE_LIMIT_MAX = 30;

type DayCompressionInputMemoryRow = {
  id: string;
  content: string;
  conversationId: string;
  day: number | null;
  sourceMessageId?: string;
  sourceGenerationId?: string;
  createdAt: number;
};

type RejectedInputMemoryRow = { id: string; reason: string };

function trimAtWordBoundary(value: string, maxChars: number): string {
  if (value.length <= maxChars) return value;
  const clipped = value.slice(0, Math.max(0, maxChars - 3)).trimEnd();
  const lastSpace = clipped.lastIndexOf(" ");
  const base = lastSpace > 160 ? clipped.slice(0, lastSpace).trimEnd() : clipped;
  return `${base}...`;
}

function normalizeSynopsis(value: string): string {
  const withoutListMarkers = value
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[-*]\s+/, "").trim())
    .filter(Boolean)
    .join(" ");
  const collapsed = withoutListMarkers.replace(/\s+/g, " ").trim();
  const sentences = collapsed.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [collapsed];
  const limitedSentences = sentences.slice(0, 3).join(" ").replace(/\s+/g, " ").trim();
  return trimAtWordBoundary(limitedSentences, DAY_SYNOPSIS_MAX_CHARS);
}

function normalizeInputRows(value: unknown): DayCompressionInputMemoryRow[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const rows: DayCompressionInputMemoryRow[] = [];
  const ids = new Set<string>();
  for (const candidate of value) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return null;
    const row = candidate as Record<string, unknown>;
    const id = typeof row.id === "string" ? row.id.trim() : "";
    const content = typeof row.content === "string" ? row.content.trim() : "";
    const conversationId = typeof row.conversationId === "string" ? row.conversationId.trim() : "";
    const day = typeof row.day === "number" && Number.isFinite(row.day) ? row.day : null;
    const createdAt = typeof row.createdAt === "number" && Number.isFinite(row.createdAt)
      ? row.createdAt
      : 0;
    if (!id || !content || !conversationId || ids.has(id)) return null;
    ids.add(id);
    rows.push({
      id,
      content,
      conversationId,
      day,
      sourceMessageId: typeof row.sourceMessageId === "string" && row.sourceMessageId.trim()
        ? row.sourceMessageId.trim()
        : undefined,
      sourceGenerationId: typeof row.sourceGenerationId === "string" && row.sourceGenerationId.trim()
        ? row.sourceGenerationId.trim()
        : undefined,
      createdAt,
    });
  }
  return rows;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(req) });
  }
  const corsHeaders = getCorsHeaders(req);

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const rateDecision = checkRateLimit({ scope: "compress-day-memories", key: user.id, windowMs: SUPPORT_RATE_LIMIT_WINDOW_MS, max: SUPPORT_RATE_LIMIT_MAX });
    if (!rateDecision.allowed) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded. Please wait before retrying memory compression.",
          retryAfterSeconds: rateDecision.retryAfterSeconds,
        }),
        { status: 429, headers: { ...corsHeaders, ...getRateLimitHeaders(rateDecision), "Content-Type": "application/json" } }
      );
    }
    const rateHeaders = getRateLimitHeaders(rateDecision);
    const responseHeadersBase = { ...corsHeaders, ...rateHeaders };

    const {
      inputMemoryRows: rawInputMemoryRows,
      day,
      conversationId,
      inputTrustBoundary,
      debugTrace = false,
    } = await req.json();
    const debugTraceAllowed = await shouldReturnAdminDebugTrace(supabase, user.id, debugTrace, "[compress-day-memories]");
    const inputMemoryRows = normalizeInputRows(rawInputMemoryRows);

    if (!inputMemoryRows) {
      return new Response(
        JSON.stringify({ error: 'inputMemoryRows must contain unique rows with id, content, conversationId, and createdAt' }),
        { status: 400, headers: { ...responseHeadersBase, 'Content-Type': 'application/json' } }
      );
    }

    // GROK ONLY -- use xAI API key
    const XAI_API_KEY = Deno.env.get("XAI_API_KEY");
    if (!XAI_API_KEY) {
      throw new Error("XAI_API_KEY is not configured");
    }

    const systemPrompt = `You are reviewing story-memory rows from one completed roleplay day and compressing the durable rows into one brief micro-summary.

Each input row has a stable ID. Return a synopsis plus the exact IDs represented in that synopsis. Reject a row when it is duplicate, unsupported, unsafe, or not suitable for the synopsis. Omitted rows remain undeleted, so classify every row when possible.

Rules:
- Capture only changes, revelations, decisions, and events with future impact.
- Distill the narrative essence of the day.
- Use past tense.
- Keep the synopsis to 2-3 sentences with no bullet formatting.
- Never invent or alter an input ID.
- Return only JSON matching the requested schema.`;

    const userMessage = `Review and compress these Day ${day} memory rows:\n\n${inputMemoryRows
      .map((row) => `[${row.id}] ${row.content}`)
      .join('\n')}`;

    const responseFormat = {
      type: "json_schema",
      json_schema: {
        name: "chronicle_day_memory_compression",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            synopsis: { type: "string" },
            compressedInputMemoryRowIds: {
              type: "array",
              items: { type: "string" },
            },
            rejectedInputMemoryRows: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  id: { type: "string" },
                  reason: { type: "string" },
                },
                required: ["id", "reason"],
              },
            },
            warnings: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: [
            "synopsis",
            "compressedInputMemoryRowIds",
            "rejectedInputMemoryRows",
            "warnings",
          ],
        },
      },
    };

    const result = await callXaiResponses({
      apiKey: XAI_API_KEY,
      model: "grok-4.3",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.3,
      maxOutputTokens: 350,
      store: SUPPORT_STORE,
      reasoningEffort: SUPPORT_REASONING_EFFORT,
      textFormat: responseFormat,
    });
    const debugPayload = debugTraceAllowed
      ? {
          modelRequest: result.modelRequest,
        }
      : null;

	    if (!result.ok) {
	      console.error("xAI Responses error:", result.status, result.errorText);
	      await recordServerAiUsage({
	        userId: user.id,
	        eventType: "memory_day_compression_call",
	        functionName: "compress-day-memories",
	        metadata: {
	          modelId: "grok-4.3",
	          status: "provider_http_error",
	          providerRequestCount: 1,
	          providerHttpStatus: result.status,
	        },
	      });
	      return new Response(
        JSON.stringify({
          error: "Failed to compress day memories",
          providerBodyError: `xAI Responses HTTP ${result.status}`,
          ...(debugPayload ? { chronicle_debug_payload: debugPayload } : {}),
        }),
        { headers: { ...responseHeadersBase, 'Content-Type': 'application/json' } }
      );
    }

    let data: unknown;
    try {
      data = await result.response.json();
    } catch (parseError) {
      const providerBodyError = parseError instanceof Error ? parseError.message : "Malformed provider JSON";
      await recordServerAiUsage({
        userId: user.id,
        eventType: "memory_day_compression_call",
        functionName: "compress-day-memories",
        metadata: {
          modelId: "grok-4.3",
          day: typeof day === "number" ? day : null,
          inputRowCount: inputMemoryRows.length,
          status: "provider_response_parse_error",
          providerBodyError,
          providerRequestCount: 1,
        },
      });
      return new Response(
        JSON.stringify({
          error: "Failed to compress day memories",
          providerBodyError,
          ...(debugPayload ? { chronicle_debug_payload: debugPayload } : {}),
        }),
        { headers: { ...responseHeadersBase, 'Content-Type': 'application/json' } }
      );
    }
    const providerUsageMetadata = buildProviderUsageMetadata(extractXaiResponsesUsage(data));
    const bodyError = getXaiResponsesBodyError(data, { requireOutputText: true });
    if (bodyError) {
      console.error("xAI Responses body error:", bodyError);
      await recordServerAiUsage({
        userId: user.id,
        eventType: "memory_day_compression_call",
        functionName: "compress-day-memories",
        metadata: {
          modelId: "grok-4.3",
          day: typeof day === "number" ? day : null,
          inputRowCount: inputMemoryRows.length,
          status: "provider_body_error",
          providerBodyError: bodyError,
          providerRequestCount: 1,
          ...providerUsageMetadata,
        },
      });
      return new Response(
        JSON.stringify({
          error: "Failed to compress day memories",
          providerBodyError: bodyError,
          ...(debugPayload ? { chronicle_debug_payload: debugPayload } : {}),
        }),
        { headers: { ...responseHeadersBase, 'Content-Type': 'application/json' } }
      );
    }
    const content = extractXaiResponsesText(data) || '';
    const inputIdSet = new Set(inputMemoryRows.map((row) => row.id));
    let synopsis = '';
    let compressedInputMemoryRowIds: string[] = [];
    let rejectedInputMemoryRows: RejectedInputMemoryRow[] = [];
    let warnings: string[] = [
      inputTrustBoundary === "browser_supplied_runtime_rows"
        ? "browser_supplied_runtime_rows"
        : "input_trust_boundary_unspecified",
    ];
    const validationErrors: string[] = [];
    try {
      const objectMatch = content.match(/\{[\s\S]*\}/);
      const parsed = objectMatch ? JSON.parse(objectMatch[0]) as Record<string, unknown> : null;
      if (!parsed) throw new Error("missing_json_object");
      synopsis = normalizeSynopsis(typeof parsed.synopsis === "string" ? parsed.synopsis : "");
      const rawCompressedIds = Array.isArray(parsed.compressedInputMemoryRowIds)
        ? parsed.compressedInputMemoryRowIds
        : null;
      const rawRejectedRows = Array.isArray(parsed.rejectedInputMemoryRows)
        ? parsed.rejectedInputMemoryRows
        : null;
      const rawWarnings = Array.isArray(parsed.warnings) ? parsed.warnings : null;
      if (!rawCompressedIds) validationErrors.push("missing_compressed_input_memory_row_ids");
      if (!rawRejectedRows) validationErrors.push("missing_rejected_input_memory_rows");
      if (!rawWarnings) validationErrors.push("missing_warnings");
      compressedInputMemoryRowIds = (rawCompressedIds || [])
        .filter((id): id is string => typeof id === "string" && id.trim().length > 0)
        .map((id) => id.trim());
      rejectedInputMemoryRows = (rawRejectedRows || [])
        .map((value): RejectedInputMemoryRow | null => {
          if (!value || typeof value !== "object" || Array.isArray(value)) return null;
          const row = value as Record<string, unknown>;
          const id = typeof row.id === "string" ? row.id.trim() : "";
          const reason = typeof row.reason === "string" ? row.reason.trim() : "";
          return id && reason ? { id, reason } : null;
        })
        .filter((row): row is RejectedInputMemoryRow => Boolean(row));
      warnings.push(...(rawWarnings || [])
        .filter((warning): warning is string => typeof warning === "string" && warning.trim().length > 0)
        .map((warning) => warning.trim()));
      if (new Set(compressedInputMemoryRowIds).size !== compressedInputMemoryRowIds.length) {
        validationErrors.push("duplicate_compressed_input_memory_row_ids");
      }
      if (compressedInputMemoryRowIds.some((id) => !inputIdSet.has(id))) {
        validationErrors.push("unknown_compressed_input_memory_row_id");
      }
      const rejectedIds = rejectedInputMemoryRows.map((row) => row.id);
      if (new Set(rejectedIds).size !== rejectedIds.length) {
        validationErrors.push("duplicate_rejected_input_memory_row_id");
      }
      if (rejectedIds.some((id) => !inputIdSet.has(id))) {
        validationErrors.push("unknown_rejected_input_memory_row_id");
      }
      if (rejectedIds.some((id) => compressedInputMemoryRowIds.includes(id))) {
        validationErrors.push("row_both_compressed_and_rejected");
      }
    } catch (parseError) {
      validationErrors.push(parseError instanceof Error ? parseError.message : "parse_error");
    }

    const decidedIds = new Set([
      ...compressedInputMemoryRowIds,
      ...rejectedInputMemoryRows.map((row) => row.id),
    ]);
    const omittedInputMemoryRowIds = inputMemoryRows
      .map((row) => row.id)
      .filter((id) => !decidedIds.has(id));
    if (omittedInputMemoryRowIds.length > 0) {
      warnings.push(`omitted_input_memory_rows:${omittedInputMemoryRowIds.join(",")}`);
    }
    if (!synopsis) validationErrors.push("empty_synopsis");
    if (compressedInputMemoryRowIds.length === 0) {
      validationErrors.push("no_compressed_input_memory_rows");
    }
    if (validationErrors.length > 0) {
      compressedInputMemoryRowIds = [];
      warnings = [...warnings, ...validationErrors.map((error) => `validation_error:${error}`)];
    }

    if (!synopsis || compressedInputMemoryRowIds.length === 0) {
      await recordServerAiUsage({
        userId: user.id,
        eventType: "memory_day_compression_call",
        functionName: "compress-day-memories",
        metadata: {
          modelId: "grok-4.3",
          day: typeof day === "number" ? day : null,
          inputRowCount: inputMemoryRows.length,
          status: "compression_response_rejected",
          providerBodyError: validationErrors.join(",") || "No rows were safely compressed",
          providerRequestCount: 1,
          ...providerUsageMetadata,
        },
      });
      return new Response(
        JSON.stringify({
          version: 1,
          synopsis,
          compressedInputMemoryRowIds: [],
          rejectedInputMemoryRows,
          warnings,
          omittedInputMemoryRowIds,
          parseError: validationErrors.join(",") || "no_compressed_input_memory_rows",
          ...(debugPayload ? { chronicle_debug_payload: debugPayload } : {}),
        }),
        { headers: { ...responseHeadersBase, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[compress-day-memories] Compressed ${compressedInputMemoryRowIds.length}/${inputMemoryRows.length} rows from Day ${day} into synopsis`);

    await recordServerAiUsage({
      userId: user.id,
      eventType: "memory_day_compression_call",
      functionName: "compress-day-memories",
      metadata: {
        modelId: "grok-4.3",
        day: typeof day === "number" ? day : null,
        inputRowCount: inputMemoryRows.length,
        compressedInputRowCount: compressedInputMemoryRowIds.length,
        status: "success",
        providerRequestCount: 1,
        ...providerUsageMetadata,
      },
    });
    await recordServerAiUsage({
      userId: user.id,
      eventType: "memory_bullets_compressed",
      functionName: "compress-day-memories",
      count: compressedInputMemoryRowIds.length,
      metadata: {
        modelId: "grok-4.3",
        day: typeof day === "number" ? day : null,
        status: "success",
      },
    });

    return new Response(
      JSON.stringify({
        version: 1,
        synopsis,
        compressedInputMemoryRowIds,
        rejectedInputMemoryRows,
        warnings,
        omittedInputMemoryRowIds,
        ...(debugPayload ? { chronicle_debug_payload: debugPayload } : {}),
      }),
      { headers: { ...responseHeadersBase, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in compress-day-memories:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
