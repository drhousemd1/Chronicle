// ============================================================================
// GROK ONLY -- All chat calls go to xAI. No Gemini. No OpenAI.
// This edge function exclusively uses the xAI API for all chat completions.
//
// Chronicle chat now uses a single direct generation lane.
// The older `roleplay_v2` pipeline value is still accepted as a compatibility
// alias, but it no longer routes through planner/writer orchestration.
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { checkRateLimit, getRateLimitHeaders } from "../_shared/rate-limit.ts";

type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type CharacterSceneState = {
  name: string;
  controlledBy?: string;
  characterRole?: string;
  location?: string;
  scenePosition?: string;
  currentMood?: string;
};

type RoleplayContext = {
  conversationId?: string;
  currentDay?: number;
  currentTimeOfDay?: string;
  activeSceneTitle?: string;
  activeSceneTags?: string[];
  aiCharacterNames?: string[];
  userCharacterNames?: string[];
  characterSceneStates?: CharacterSceneState[];
};

type ChatRequest = {
  messages: Message[];
  modelId: string;
  stream?: boolean;
  max_tokens?: number;
  pipeline?: 'direct' | 'roleplay_v2';
  debugTrace?: boolean;
  roleplayContext?: RoleplayContext;
};

type XAIResult = { ok: true; response: Response } | { ok: false; status: number; errorText: string };

type PlannerPlan = {
  focusCharacter: string | null;
  allowedSpeakers: string[];
  maxSpeakerBlocks: number;
  directQuestionsToAnswer: string[];
  mentionedAiCharacters: string[];
  immediateBeat: string;
  mustInclude: string[];
  mustAvoid: string[];
  continuityNotes: string[];
  sceneStateFacts: string[];
  formattingNotes: string[];
};

type SupportingExcerptDetail = {
  role: Message['role'];
  content: string;
  preview: string;
  selectionReason: 'bridge' | 'scored';
  score: number;
};

type RoleplayDebugTiming = {
  totalMs: number | null;
  plannerMs: number | null;
  writerMs: number | null;
  normalizationMs: number | null;
  directMs: number | null;
  fallbackMs: number | null;
};

type RoleplayDebugTrace = {
  version: 1;
  pipeline: 'roleplay_v2' | 'direct';
  finalPath: string;
  fallbackReason: string | null;
  roleplayContext: {
    conversationId: string | null;
    currentDay: number | null;
    currentTimeOfDay: string | null;
    activeSceneTitle: string | null;
    activeSceneTags: string[];
    aiCharacterNames: string[];
    userCharacterNames: string[];
    characterSceneStates: CharacterSceneState[];
  };
  latestUserTurnPreview: string;
  recentWindowCount: number;
  supportingExcerpts: Array<{
    role: Message['role'];
    preview: string;
    selectionReason: 'bridge' | 'scored';
    score: number;
  }>;
  planner: {
    usedFallback: boolean;
    failureReason: string | null;
    plan: PlannerPlan;
  };
  writer: {
    temperature: number;
    draftPreview: string;
  };
  validator: {
    approved: boolean | null;
    issues: string[];
    usedRevision: boolean;
    usedWriterDraftFallback: boolean;
    failureReason: string | null;
    revisedPreview: string;
  };
  normalization: {
    changed: boolean;
  };
  timing: RoleplayDebugTiming;
  notes: string[];
};

const CONTENT_REDIRECT_DIRECTIVE = `[CONTENT REDIRECT] The previous user message touched on content the model cannot engage with directly. Continue the roleplay naturally by:
1. Having the character(s) take a CONCRETE, IMMEDIATE action that pivots the scene — NOT a deflection or subject change
2. Maintain the current scene's tone and momentum
3. Do NOT reference the filter or moderation — stay fully in-character
4. Move the story forward with a specific present-tense event (e.g., a character does something physical, makes a decision, initiates a new activity)
5. FORBIDDEN: Postponement language ("we'll talk later," "let's discuss this soon," "another time"). Act NOW.
6. FORBIDDEN: Vague redirects ("let's change the subject," "how about we..."). Be specific and decisive.`;

const DEBUG_CHAT_LOGS = Deno.env.get("DEBUG_CHAT_LOGS") === "true";

const RECENT_HISTORY_WINDOW = 16;

const TEMP_DIRECT = 0.55;

const BANNED_TROPE_REPLACEMENTS: Record<string, string> = {
  tsundere: 'sharp-edged',
  yandere: 'obsessive',
  deredere: 'warm',
  kuudere: 'cool-headed',
};

const FALLBACK_PLAN: PlannerPlan = {
  focusCharacter: null,
  allowedSpeakers: [],
  maxSpeakerBlocks: 1,
  directQuestionsToAnswer: [],
  mentionedAiCharacters: [],
  immediateBeat: '',
  mustInclude: [],
  mustAvoid: [],
  continuityNotes: [],
  sceneStateFacts: [],
  formattingNotes: [],
};

function debugLog(message: string) {
  if (DEBUG_CHAT_LOGS) console.debug(message);
}

function warnLog(message: string) {
  if (DEBUG_CHAT_LOGS) console.warn(message);
}

function elapsedMs(startedAt: number): number {
  return Math.max(0, Math.round(performance.now() - startedAt));
}

function buildDebugTiming(timing?: Partial<RoleplayDebugTiming> | null): RoleplayDebugTiming {
  return {
    totalMs: timing?.totalMs ?? null,
    plannerMs: timing?.plannerMs ?? null,
    writerMs: timing?.writerMs ?? null,
    normalizationMs: timing?.normalizationMs ?? null,
    directMs: timing?.directMs ?? null,
    fallbackMs: timing?.fallbackMs ?? null,
  };
}

function withDebugTiming(
  debugTrace: RoleplayDebugTrace | null,
  timing: Partial<RoleplayDebugTiming>,
): RoleplayDebugTrace | null {
  if (!debugTrace) return null;
  const nextTiming = buildDebugTiming({ ...debugTrace.timing, ...timing });
  if (debugTrace.pipeline === 'direct' && nextTiming.totalMs === null) {
    nextTiming.totalMs = nextTiming.fallbackMs ?? nextTiming.directMs;
  }
  return { ...debugTrace, timing: nextTiming };
}

// ============================================================================
// xAI call (shared) — `temperature` is now an explicit parameter so each pass
// can use its own value. Direct path keeps 0.55, planner 0.15, writer 0.3.
// ============================================================================
async function callXAI(
  messages: Message[],
  modelId: string,
  stream: boolean,
  maxTokens: number = 4096,
  temperature: number = TEMP_DIRECT,
): Promise<XAIResult> {
  const XAI_API_KEY = Deno.env.get("XAI_API_KEY");
  if (!XAI_API_KEY) {
    throw new Error("XAI_API_KEY is not configured. Please add your Grok API key in settings.");
  }

  debugLog(`[chat] Calling xAI/Grok model=${modelId} stream=${stream} temp=${temperature}`);

  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${XAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelId,
      messages,
      stream,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[chat] xAI/Grok error: ${response.status}`);
    debugLog(`[chat] xAI/Grok error detail: ${errorText.slice(0, 500)}`);
    return { ok: false, status: response.status, errorText };
  }

  return { ok: true, response };
}

function previewText(text: string, maxLength = 220): string {
  const normalized = (text || '').replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 3).trimEnd()}...`;
}

function buildRoleplayContextSummary(ctx: RoleplayContext | undefined): RoleplayDebugTrace['roleplayContext'] {
  return {
    conversationId: ctx?.conversationId ?? null,
    currentDay: ctx?.currentDay ?? null,
    currentTimeOfDay: ctx?.currentTimeOfDay ?? null,
    activeSceneTitle: ctx?.activeSceneTitle ?? null,
    activeSceneTags: [...(ctx?.activeSceneTags ?? [])],
    aiCharacterNames: [...(ctx?.aiCharacterNames ?? [])],
    userCharacterNames: [...(ctx?.userCharacterNames ?? [])],
    characterSceneStates: [...(ctx?.characterSceneStates ?? [])],
  };
}

function buildRoleplayDebugTrace(args: {
  pipeline: 'roleplay_v2' | 'direct';
  finalPath: string;
  fallbackReason?: string | null;
  ctx: RoleplayContext | undefined;
  lastUser: string;
  recentWindowCount: number;
  supportingDetails: SupportingExcerptDetail[];
  plannerPlan: PlannerPlan;
  plannerUsedFallback: boolean;
  plannerFailureReason?: string | null;
  writerDraft: string;
  validatorApproved: boolean | null;
  validatorIssues: string[];
  validatorUsedRevision: boolean;
  validatorUsedWriterDraftFallback: boolean;
  validatorFailureReason?: string | null;
  validatorRevisedText?: string;
  normalizationChanged: boolean;
  timing?: Partial<RoleplayDebugTiming> | null;
  notes?: string[];
}): RoleplayDebugTrace {
  return {
    version: 1,
    pipeline: args.pipeline,
    finalPath: args.finalPath,
    fallbackReason: args.fallbackReason ?? null,
    roleplayContext: buildRoleplayContextSummary(args.ctx),
    latestUserTurnPreview: previewText(args.lastUser),
    recentWindowCount: args.recentWindowCount,
    supportingExcerpts: args.supportingDetails.map((detail) => ({
      role: detail.role,
      preview: detail.preview,
      selectionReason: detail.selectionReason,
      score: detail.score,
    })),
    planner: {
      usedFallback: args.plannerUsedFallback,
      failureReason: args.plannerFailureReason ?? null,
      plan: args.plannerPlan,
    },
    writer: {
      temperature: TEMP_DIRECT,
      draftPreview: previewText(args.writerDraft),
    },
    validator: {
      approved: args.validatorApproved,
      issues: args.validatorIssues,
      usedRevision: args.validatorUsedRevision,
      usedWriterDraftFallback: args.validatorUsedWriterDraftFallback,
      failureReason: args.validatorFailureReason ?? null,
      revisedPreview: previewText(args.validatorRevisedText || ''),
    },
    normalization: {
      changed: args.normalizationChanged,
    },
    timing: buildDebugTiming(args.timing),
    notes: args.notes ?? [],
  };
}

function buildDirectDebugTrace(
  messages: Message[],
  ctx: RoleplayContext | undefined,
  fallbackReason: string | null = null,
): RoleplayDebugTrace {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';
  return buildRoleplayDebugTrace({
    pipeline: 'direct',
    finalPath: 'direct',
    fallbackReason,
    ctx,
    lastUser,
    recentWindowCount: Math.min(messages.length, RECENT_HISTORY_WINDOW),
    supportingDetails: [],
    plannerPlan: FALLBACK_PLAN,
    plannerUsedFallback: false,
    writerDraft: '',
    validatorApproved: null,
    validatorIssues: [],
    validatorUsedRevision: false,
    validatorUsedWriterDraftFallback: false,
    normalizationChanged: false,
    notes: ['Direct pipeline does not expose planner/validator trace data.'],
  });
}

function normalizeEmDashUsage(line: string): string {
  return line.replace(/\s*—\s*/g, '... ');
}

// ============================================================================
// Normalization
// ============================================================================
function normalizeFinalText(text: string): string {
  let out = text;
  // Trope-term replacements (case-insensitive, preserve nothing)
  for (const [bad, replacement] of Object.entries(BANNED_TROPE_REPLACEMENTS)) {
    out = out.replace(new RegExp(`\\b${bad}\\b`, 'gi'), replacement);
  }
  // Remove leaked validator / markdown wrapper artifacts if they appear as standalone lines.
  out = out.replace(/^\s*(?:(?:[-—*_]){3,}|```(?:\w+)?|<\/?writer_draft>)\s*$/gim, '');
  // Normalize malformed speaker tags like "Sarah::" so the UI doesn't show a stray extra colon.
  out = out.replace(/^(\s*(?:\*\*)?[A-Z][a-zA-Z\s'-]{0,29}(?:\*\*)?)\s*:{2,}\s*/gm, '$1: ');
  // Normalize miswrapped thoughts like "*(She thought...)*" back to "(She thought...)".
  out = out.replace(/\*\(\s*([\s\S]*?)\s*\)\*/g, '($1)');
  // Remove leaked internal-planning lead-ins without deleting the surrounding prose.
  out = out.replace(/\b(?:survival\s+(?:priority|step)\s*[:—-]?|priority(?:\s+is|'s)\s*[:—-]?|priority\s*:)\s*/gi, '');
  out = out.replace(/\b(?:goal|directive|plan|must include)\s*:\s*/gi, '');
  // Deterministically replace em dashes with ellipses so display/save does not depend on Grok changing the habit.
  out = out.split('\n').map(normalizeEmDashUsage).join('\n');
  // Whitespace cleanup
  out = out.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  return out;
}

// ============================================================================
// Streaming helper — re-emit a final string as Grok-style SSE deltas so the
// frontend's existing chunk parser keeps working unchanged.
// ============================================================================
function prependDebugTraceToSSE(
  body: ReadableStream<Uint8Array> | null,
  headers: HeadersInit,
  debugTrace: RoleplayDebugTrace | null,
): Response {
  if (!body || !debugTrace) {
    return new Response(body, { headers });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chronicle_debug_trace: debugTrace })}\n\n`));
      const reader = body.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) controller.enqueue(value);
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      } finally {
        reader.releaseLock();
      }
    },
  });

  return new Response(stream, { headers });
}

function streamTextAsSSE(
  text: string,
  modelId: string,
  headers: HeadersInit,
  debugTrace: RoleplayDebugTrace | null = null,
): Response {
  const encoder = new TextEncoder();
  const id = `chatcmpl-${crypto.randomUUID()}`;
  const created = Math.floor(Date.now() / 1000);

  // Chunk by ~80 char segments to feel streamed
  const chunks: string[] = [];
  const segSize = 80;
  for (let i = 0; i < text.length; i += segSize) chunks.push(text.slice(i, i + segSize));

  const stream = new ReadableStream({
    start(controller) {
      const sendChunk = (delta: Record<string, unknown>, finishReason: string | null) => {
        const payload = {
          id,
          object: 'chat.completion.chunk',
          created,
          model: modelId,
          choices: [{ index: 0, delta, finish_reason: finishReason }],
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };
      if (debugTrace) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chronicle_debug_trace: debugTrace })}\n\n`));
      }
      sendChunk({ role: 'assistant' }, null);
      for (const c of chunks) sendChunk({ content: c }, null);
      sendChunk({}, 'stop');
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });

  return new Response(stream, { headers });
}

async function readXAIStreamContent(body: ReadableStream<Uint8Array> | null): Promise<string> {
  if (!body) return '';

  const decoder = new TextDecoder();
  const reader = body.getReader();
  let buffer = '';
  let content = '';

  const consumeFrame = (frame: string) => {
    for (const rawLine of frame.split('\n')) {
      const line = rawLine.trim();
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (!data || data === '[DONE]') continue;
      try {
        const parsed = JSON.parse(data);
        const delta = parsed?.choices?.[0]?.delta?.content;
        if (typeof delta === 'string') content += delta;
      } catch {
        // Ignore malformed stream metadata and keep consuming later frames.
      }
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const frames = buffer.split(/\r?\n\r?\n/);
      buffer = frames.pop() ?? '';
      frames.forEach(consumeFrame);
    }
    buffer += decoder.decode();
    if (buffer.trim()) consumeFrame(buffer);
  } finally {
    reader.releaseLock();
  }

  return content;
}

async function streamSanitizedXAICompletion(
  body: ReadableStream<Uint8Array> | null,
  modelId: string,
  headers: HeadersInit,
  debugTrace: RoleplayDebugTrace | null = null,
): Promise<Response> {
  const rawText = await readXAIStreamContent(body);
  const normalizedText = normalizeFinalText(rawText);
  return streamTextAsSSE(normalizedText, modelId, headers, debugTrace);
}

function jsonResponseAsCompletion(
  text: string,
  modelId: string,
  headers: HeadersInit,
  debugTrace: RoleplayDebugTrace | null = null,
): Response {
  const payload: Record<string, unknown> = {
    id: `chatcmpl-${crypto.randomUUID()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: modelId,
    choices: [{
      index: 0,
      message: { role: 'assistant', content: text },
      finish_reason: 'stop',
    }],
  };
  if (debugTrace) {
    payload.chronicle_debug_trace = debugTrace;
  }
  return new Response(JSON.stringify(payload), { headers });
}

// ============================================================================
// Direct-mode handler (preserves legacy behavior, including 403 retry)
// ============================================================================
async function handleDirect(
  messages: Message[],
  modelId: string,
  stream: boolean,
  maxTokens: number,
  responseHeadersBase: Record<string, string>,
  debugTrace: RoleplayDebugTrace | null = null,
): Promise<Response> {
  const directStartedAt = performance.now();
  const result = await callXAI(messages, modelId, stream, maxTokens, TEMP_DIRECT);
  let timedDebugTrace = withDebugTiming(debugTrace, { directMs: elapsedMs(directStartedAt) });

  if (result.ok) {
    if (stream) {
      return await streamSanitizedXAICompletion(result.response.body, modelId, {
        ...responseHeadersBase,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      }, timedDebugTrace);
    }
    const data = await result.response.json();
    if (timedDebugTrace) {
      data.chronicle_debug_trace = timedDebugTrace;
    }
    return new Response(JSON.stringify(data), {
      headers: { ...responseHeadersBase, "Content-Type": "application/json" },
    });
  }

  // 403 -> redirect retry
  if (result.status === 403) {
    debugLog('[chat] 403 content safety, retrying with redirect directive');
    const redirectMessages: Message[] = [
      ...messages.slice(0, -1),
      { role: 'system' as const, content: CONTENT_REDIRECT_DIRECTIVE },
      messages[messages.length - 1],
    ];
    const fallbackStartedAt = performance.now();
    const retry = await callXAI(redirectMessages, modelId, stream, maxTokens, TEMP_DIRECT);
    timedDebugTrace = withDebugTiming(timedDebugTrace, { fallbackMs: elapsedMs(fallbackStartedAt) });
    if (retry.ok) {
      if (stream) {
        return await streamSanitizedXAICompletion(retry.response.body, modelId, {
          ...responseHeadersBase,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        }, timedDebugTrace);
      }
      const data = await retry.response.json();
      if (timedDebugTrace) {
        data.chronicle_debug_trace = timedDebugTrace;
      }
      return new Response(JSON.stringify(data), {
        headers: { ...responseHeadersBase, "Content-Type": "application/json" },
      });
    }
    return new Response(
      JSON.stringify({ error: "Content filtered by safety system", error_type: "content_filtered" }),
      { status: 422, headers: { ...responseHeadersBase, "Content-Type": "application/json" } },
    );
  }

  throw new Error(`xAI/Grok error: ${result.status}`);
}

// ============================================================================
// Server
// ============================================================================
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }
  const corsHeaders = getCorsHeaders(req);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rateDecision = checkRateLimit({ scope: "chat", key: user.id, windowMs: 60_000, max: 40 });
    if (!rateDecision.allowed) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded. Please wait before sending more messages.",
          retryAfterSeconds: rateDecision.retryAfterSeconds,
        }),
        { status: 429, headers: { ...corsHeaders, ...getRateLimitHeaders(rateDecision), "Content-Type": "application/json" } },
      );
    }
    const rateHeaders = getRateLimitHeaders(rateDecision);
    const responseHeadersBase = { ...corsHeaders, ...rateHeaders };

    const body: ChatRequest = await req.json();
    const {
      messages,
      stream = true,
      max_tokens: maxTokens = 4096,
      pipeline = 'direct',
      debugTrace: debugTraceRequested = false,
      roleplayContext,
    } = body;

    const VALID_GROK_MODELS = ['grok-4.20-0309-reasoning'];
    const modelId = VALID_GROK_MODELS.includes(body.modelId) ? body.modelId : 'grok-4.20-0309-reasoning';
    if (body.modelId !== modelId) {
      warnLog(`[chat] Rejected non-Grok model "${body.modelId}", using "${modelId}"`);
    }

    if (!messages || !modelId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: messages and modelId" }),
        { status: 400, headers: { ...responseHeadersBase, "Content-Type": "application/json" } },
      );
    }

    const normalizedPipeline = pipeline === 'roleplay_v2' ? 'direct' : pipeline;
    if (pipeline === 'roleplay_v2') {
      warnLog('[chat] roleplay_v2 requested, but Chronicle now aliases that lane to direct mode.');
    }

    debugLog(`[chat] pipeline=${normalizedPipeline} model=${modelId} messages=${messages.length} stream=${stream}`);

    // ---- direct (default + compatibility alias) --------------------------
    return await handleDirect(
      messages,
      modelId,
      stream,
      maxTokens,
      responseHeadersBase,
      debugTraceRequested ? buildDirectDebugTrace(messages, roleplayContext) : null,
    );
  } catch (error) {
    console.error("[chat] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const status = errorMessage.includes("not configured") ? 400 : 500;
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
