// ============================================================================
// GROK ONLY -- All memory extraction uses xAI Grok. No Gemini. No OpenAI.
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { shouldReturnAdminDebugTrace } from "../_shared/admin-debug.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { checkRateLimit, getRateLimitHeaders } from "../_shared/rate-limit.ts";
import { recordServerAiUsage } from "../_shared/server-usage.ts";
import { buildProviderUsageMetadata } from "../_shared/usage-cost.ts";
import { callXaiResponses, extractXaiResponsesText, extractXaiResponsesUsage, getXaiResponsesBodyError } from "../_shared/xai-responses.ts";

const MEMORY_POINT_MAX_CHARS = 140;
const SUPPORT_REASONING_EFFORT = "medium" as const;
const SUPPORT_STORE = false;
const SUPPORT_RATE_LIMIT_WINDOW_MS = 60_000;
const SUPPORT_RATE_LIMIT_MAX = 30;
const MEMORY_CANDIDATE_MAX = 6;
const MEMORY_ACCEPTED_MAX = 3;
const DURABLE_CATEGORIES = new Set([
  "durable_relationship_dynamic",
  "meaningful_behavior_shift",
  "character_status_change",
  "durable_preference_or_boundary",
  "durable_scene_or_world_fact",
  "meaningful_interaction_pattern",
]);
const ACCEPTED_SOURCE_CLASSIFICATIONS = new Set([
  "raw_user_fact",
  "accepted_assistant_observable_change",
]);

type MemoryCandidateV1 = {
  id: string;
  candidateText: string;
  decision: "accepted" | "rejected";
  durabilityCategory: string;
  sourceClassification: string;
  evidence: string;
  rejectionReason: string | null;
  appliesToUserCharacter: boolean;
  userCharacterName: string | null;
  claimType: string | null;
  sourceRole: "user" | "assistant";
  evidenceBasis: string;
  authorityReason: string;
};

function trimAtWordBoundary(value: string, maxChars: number): string {
  if (value.length <= maxChars) return value;
  const clipped = value.slice(0, Math.max(0, maxChars - 3)).trimEnd();
  const lastSpace = clipped.lastIndexOf(" ");
  const base = lastSpace > 80 ? clipped.slice(0, lastSpace).trimEnd() : clipped;
  return `${base}...`;
}

function normalizeMemoryPoint(value: string): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  return trimAtWordBoundary(normalized, MEMORY_POINT_MAX_CHARS);
}

function normalizeCandidate(value: unknown, index: number): MemoryCandidateV1 | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  const candidateText = typeof row.candidateText === "string"
    ? normalizeMemoryPoint(row.candidateText)
    : "";
  const evidence = typeof row.evidence === "string" ? row.evidence.trim() : "";
  const authorityReason = typeof row.authorityReason === "string" ? row.authorityReason.trim() : "";
  if (
    !candidateText
    || !evidence
    || !authorityReason
    || (row.decision !== "accepted" && row.decision !== "rejected")
    || (row.sourceRole !== "user" && row.sourceRole !== "assistant")
    || typeof row.durabilityCategory !== "string"
    || typeof row.sourceClassification !== "string"
    || typeof row.evidenceBasis !== "string"
    || typeof row.appliesToUserCharacter !== "boolean"
  ) return null;

  const requestedDecision = row.decision;
  const structurallyAccepted = DURABLE_CATEGORIES.has(row.durabilityCategory)
    && ACCEPTED_SOURCE_CLASSIFICATIONS.has(row.sourceClassification);
  const decision = requestedDecision === "accepted" && structurallyAccepted
    ? "accepted"
    : "rejected";
  const invalidAcceptanceReason = requestedDecision === "accepted" && !structurallyAccepted
    ? "candidate_failed_durability_or_source_gate"
    : null;

  return {
    id: typeof row.id === "string" && row.id.trim() ? row.id.trim() : `memory-candidate-${index + 1}`,
    candidateText,
    decision,
    durabilityCategory: row.durabilityCategory,
    sourceClassification: row.sourceClassification,
    evidence,
    rejectionReason: invalidAcceptanceReason
      || (typeof row.rejectionReason === "string" && row.rejectionReason.trim()
        ? row.rejectionReason.trim()
        : decision === "rejected" ? "worker_rejected_candidate" : null),
    appliesToUserCharacter: row.appliesToUserCharacter,
    userCharacterName: typeof row.userCharacterName === "string" && row.userCharacterName.trim()
      ? row.userCharacterName.trim()
      : null,
    claimType: typeof row.claimType === "string" && row.claimType.trim()
      ? row.claimType.trim()
      : null,
    sourceRole: row.sourceRole,
    evidenceBasis: row.evidenceBasis,
    authorityReason,
  };
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

    const rateDecision = checkRateLimit({ scope: "extract-memory-events", key: user.id, windowMs: SUPPORT_RATE_LIMIT_WINDOW_MS, max: SUPPORT_RATE_LIMIT_MAX });
    if (!rateDecision.allowed) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded. Please wait before retrying memory extraction.",
          retryAfterSeconds: rateDecision.retryAfterSeconds,
        }),
        { status: 429, headers: { ...corsHeaders, ...getRateLimitHeaders(rateDecision), "Content-Type": "application/json" } }
      );
    }
    const rateHeaders = getRateLimitHeaders(rateDecision);
    const responseHeadersBase = { ...corsHeaders, ...rateHeaders };

    const {
      messageText,
      userMessage,
      aiResponse,
      characterNames,
      userCharacterNames = [],
      recentExistingMemories = [],
      modelId,
      debugTrace = false,
    } = await req.json();
    const debugTraceAllowed = await shouldReturnAdminDebugTrace(supabase, user.id, debugTrace, "[extract-memory-events]");
    const existingMemoryText = Array.isArray(recentExistingMemories) && recentExistingMemories.length > 0
      ? recentExistingMemories
          .filter((entry: unknown): entry is string => typeof entry === "string" && entry.trim().length > 0)
          .slice(-20)
          .map((entry) => `- ${entry.trim()}`)
          .join("\n")
      : "(none)";
    const exchangeText = [
      userMessage ? `USER MESSAGE:\n${userMessage}` : '',
      aiResponse ? `AI RESPONSE:\n${aiResponse}` : '',
      !userMessage && !aiResponse && messageText ? `MESSAGE:\n${messageText}` : '',
    ].filter(Boolean).join('\n\n---\n\n');
    
    if (!exchangeText) {
      return new Response(
        JSON.stringify({ error: 'userMessage, aiResponse, or messageText is required' }),
        { status: 400, headers: { ...responseHeadersBase, 'Content-Type': 'application/json' } }
      );
    }

    // GROK ONLY -- use xAI API key
    const XAI_API_KEY = Deno.env.get("XAI_API_KEY");
    if (!XAI_API_KEY) {
      throw new Error("XAI_API_KEY is not configured");
    }

    const systemPrompt = `You are a story memory curator for an adult roleplay. Review possible memory candidates from the latest user+AI exchange before anything can become durable story memory.

CHARACTERS: ${characterNames?.join(', ') || 'Unknown'}
USER-CONTROLLED CHARACTERS: ${Array.isArray(userCharacterNames) && userCharacterNames.length > 0 ? userCharacterNames.join(', ') : '(none identified)'}

RECENT SAVED MEMORIES:
${existingMemoryText}

Review up to six plausible candidates so rejected contamination stays inspectable. At most three candidates may be accepted. Empty candidates are valid when the exchange contains no useful memory.

Accept only source-backed information whose future loss would create meaningful inconsistency. Durable categories cover relationship dynamics, meaningful behavior shifts, character status changes, durable preferences or boundaries, durable scene or world facts, and meaningful interaction patterns. Temporary scene state and material that is not memory must be rejected.

Source classification must distinguish raw user facts and accepted assistant observable changes from assistant interpretation, unsupported overreach, static descriptors, duplicate existing memory, repeated phrasing, and support artifacts. Only the first two source classes can be accepted. Use a short exact quote from the source as evidence.

Use past tense and identify the relevant character. User-owned private state is durable fact only when explicitly authored by the user. An accepted assistant response may establish an observable change, but its interpretation of hidden state, assigned dialogue, or voluntary action is not a user-authored fact. Set appliesToUserCharacter for every candidate that names a user-controlled character or prior name; the frontend independently enforces that identity boundary.

For every candidate, return the durability category, source classification, evidence, accepted or rejected decision, rejection reason, and the existing user-state authority fields. A rejected decision requires a concise rejection reason. An accepted decision uses null for rejectionReason.

Return ONLY JSON matching the requested schema.
Empty candidates are acceptable.`;

    const effectiveModel = modelId === "grok-4.3" ? modelId : "grok-4.3";
    const messages = [
      { role: "system" as const, content: systemPrompt },
      { role: "user" as const, content: `Extract durable story-memory events from this latest exchange:\n\n${exchangeText}` },
    ];
    const responseFormat = {
      type: "json_schema",
      json_schema: {
        name: "chronicle_memory_events",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            candidates: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  id: { type: "string" },
                  candidateText: { type: "string" },
                  decision: { type: "string", enum: ["accepted", "rejected"] },
                  durabilityCategory: {
                    type: "string",
                    enum: [
                      "durable_relationship_dynamic",
                      "meaningful_behavior_shift",
                      "character_status_change",
                      "durable_preference_or_boundary",
                      "durable_scene_or_world_fact",
                      "meaningful_interaction_pattern",
                      "temporary_scene_state",
                      "not_memory",
                    ],
                  },
                  sourceClassification: {
                    type: "string",
                    enum: [
                      "raw_user_fact",
                      "accepted_assistant_observable_change",
                      "assistant_interpretation",
                      "unsupported_overreach",
                      "static_descriptor",
                      "duplicate_existing_memory",
                      "repeated_phrase",
                      "support_artifact",
                    ],
                  },
                  evidence: { type: "string" },
                  rejectionReason: { type: ["string", "null"] },
                  appliesToUserCharacter: { type: "boolean" },
                  userCharacterName: { type: ["string", "null"] },
                  claimType: {
                    type: ["string", "null"],
                    enum: [
                      "emotion",
                      "intent",
                      "arousal",
                      "consent",
                      "bodily_reaction",
                      "preference",
                      "voluntary_action",
                      "dialogue_assignment",
                      "internal_thought",
                      null,
                    ],
                  },
                  sourceRole: { type: "string", enum: ["user", "assistant"] },
                  evidenceBasis: {
                    type: "string",
                    enum: [
                      "explicit_user_authorship",
                      "accepted_visible_observation",
                      "in_character_interpretation",
                      "unsupported",
                      "not_applicable",
                    ],
                  },
                  authorityReason: { type: "string" },
                },
                required: [
                  "id",
                  "candidateText",
                  "decision",
                  "durabilityCategory",
                  "sourceClassification",
                  "evidence",
                  "rejectionReason",
                  "appliesToUserCharacter",
                  "userCharacterName",
                  "claimType",
                  "sourceRole",
                  "evidenceBasis",
                  "authorityReason",
                ],
              },
            },
          },
          required: ["candidates"],
        },
      },
    };
    const result = await callXaiResponses({
      apiKey: XAI_API_KEY,
      model: effectiveModel,
      messages,
      temperature: 0.3,
      maxOutputTokens: 1024,
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
	      if (result.status === 429) {
	        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later.", ...(debugPayload ? { chronicle_debug_payload: debugPayload } : {}) }),
          { status: 429, headers: { ...responseHeadersBase, "Content-Type": "application/json" } }
	        );
	      }
	      console.error("xAI Responses error:", result.status, result.errorText);
	      await recordServerAiUsage({
	        userId: user.id,
	        eventType: "memory_extraction_call",
	        functionName: "extract-memory-events",
	        metadata: {
	          modelId: effectiveModel,
	          status: "provider_http_error",
	          providerRequestCount: 1,
	          providerHttpStatus: result.status,
	        },
	      });
	      throw new Error("Failed to extract memory events");
	    }

    let data: unknown;
    try {
      data = await result.response.json();
    } catch (parseError) {
      const providerBodyError = parseError instanceof Error ? parseError.message : "Malformed provider JSON";
      await recordServerAiUsage({
        userId: user.id,
        eventType: "memory_extraction_call",
        functionName: "extract-memory-events",
        metadata: {
          modelId: effectiveModel,
          status: "provider_response_parse_error",
          providerBodyError,
          providerRequestCount: 1,
        },
      });
      return new Response(
        JSON.stringify({
          version: 1,
          candidates: [],
          events: [],
          extractedEvents: [],
          userStateReviews: [],
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
        eventType: "memory_extraction_call",
        functionName: "extract-memory-events",
        metadata: {
          modelId: effectiveModel,
          status: "provider_body_error",
          providerBodyError: bodyError,
          providerRequestCount: 1,
          ...providerUsageMetadata,
        },
      });
      return new Response(
        JSON.stringify({
          version: 1,
          candidates: [],
          events: [],
          extractedEvents: [],
          userStateReviews: [],
          providerBodyError: bodyError,
          ...(debugPayload ? { chronicle_debug_payload: debugPayload } : {}),
        }),
        { headers: { ...responseHeadersBase, 'Content-Type': 'application/json' } }
      );
    }
    const content = extractXaiResponsesText(data);
    
    let candidates: MemoryCandidateV1[] = [];
    let parseError: string | null = null;
    let malformedContent = "";
    try {
      const objectMatch = content.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        const parsed = JSON.parse(objectMatch[0]);
        if (Array.isArray(parsed.candidates)) {
          const malformedRows: number[] = [];
          candidates = parsed.candidates
            .slice(0, MEMORY_CANDIDATE_MAX)
            .map((candidate: unknown, index: number) => {
              const normalized = normalizeCandidate(candidate, index);
              if (!normalized) malformedRows.push(index);
              return normalized;
            })
            .filter((candidate: MemoryCandidateV1 | null): candidate is MemoryCandidateV1 => Boolean(candidate));
          if (malformedRows.length > 0) {
            parseError = `malformed_candidate_rows:${malformedRows.join(",")}`;
            malformedContent = content;
          }
        } else {
          parseError = "candidates_not_array";
          malformedContent = content;
        }
      } else {
        parseError = "missing_json_object";
        malformedContent = content;
      }
    } catch (_parseError) {
      console.error("Failed to parse extraction response:", content);
      candidates = [];
      parseError = "parse_error";
      malformedContent = content;
    }

    let acceptedCount = 0;
    candidates = candidates.map((candidate) => {
      if (candidate.decision !== "accepted") return candidate;
      acceptedCount += 1;
      if (acceptedCount <= MEMORY_ACCEPTED_MAX) return candidate;
      return {
        ...candidate,
        decision: "rejected" as const,
        rejectionReason: "accepted_candidate_limit_exceeded",
      };
    });
    const acceptedCandidates = candidates.filter((candidate) => candidate.decision === "accepted");
    const extractedEvents = acceptedCandidates.map((candidate) => candidate.candidateText);
    const userStateReviews = acceptedCandidates.map((candidate, eventIndex) => ({
      eventIndex,
      event: candidate.candidateText,
      appliesToUserCharacter: candidate.appliesToUserCharacter,
      userCharacterName: candidate.userCharacterName,
      claimType: candidate.claimType,
      sourceRole: candidate.sourceRole,
      evidenceBasis: candidate.evidenceBasis,
      evidence: candidate.evidence,
      reason: candidate.authorityReason,
    }));

    console.log(`[extract-memory-events] Extracted ${extractedEvents.length} events from latest exchange`);

    await recordServerAiUsage({
      userId: user.id,
      eventType: "memory_extraction_call",
      functionName: "extract-memory-events",
      metadata: {
        modelId: effectiveModel,
        status: parseError ? "parsed_with_rejections" : "success",
        extractedEventCount: extractedEvents.length,
        providerRequestCount: 1,
        ...providerUsageMetadata,
      },
    });
    if (extractedEvents.length > 0) {
      await recordServerAiUsage({
        userId: user.id,
        eventType: "memory_events_extracted",
        functionName: "extract-memory-events",
        count: extractedEvents.length,
        metadata: {
          modelId: effectiveModel,
          status: "success",
        },
      });
    }

    return new Response(
      JSON.stringify({
        version: 1,
        candidates,
        events: extractedEvents,
        extractedEvents,
        userStateReviews,
        ...(parseError ? {
          parseError,
          rejectedEvents: [{
            index: 0,
            accepted: false,
            reason: parseError,
            value: malformedContent.replace(/\s+/g, " ").trim().slice(0, 260),
          }],
        } : {}),
        ...(debugPayload ? { chronicle_debug_payload: debugPayload } : {}),
      }),
      { headers: { ...responseHeadersBase, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in extract-memory-events:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
