// ============================================================================
// GROK ONLY -- All chat calls go to xAI. No Gemini. No OpenAI.
// This edge function exclusively uses xAI APIs for chat generation.
//
// Chronicle chat now uses a single direct generation lane.
// The older `roleplay_v2` pipeline value is still accepted as a compatibility
// alias, but it no longer routes through planner/writer orchestration.
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { shouldReturnAdminDebugTrace } from "../_shared/admin-debug.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { checkRateLimit, getRateLimitHeaders } from "../_shared/rate-limit.ts";
import { recordServerAiUsage, type ServerAiUsageEventType } from "../_shared/server-usage.ts";
import {
  callXaiResponses,
  extractXaiResponsesReasoningSummaries,
  extractXaiResponsesText,
  extractXaiResponsesUsage,
  getXaiResponsesBodyError,
  normalizeResponsesStreamEvent,
  readXaiErrorText,
  type XaiResponsesReasoningEffort,
  type XaiResponsesUsage,
} from "../_shared/xai-responses.ts";

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
  providerTransport?: 'chat_completions' | 'responses';
  reasoningEffort?: XaiResponsesReasoningEffort;
  store?: boolean;
  debugTrace?: boolean;
  roleplayContext?: RoleplayContext;
  usageEventType?: string;
};

const CHAT_USAGE_EVENT_TYPES = new Set<ServerAiUsageEventType>([
  "chat_call_1",
  "character_ai_fill",
  "character_ai_generate",
  "character_ai_enhance_precise",
  "character_ai_enhance_detailed",
  "world_ai_enhance_precise",
  "world_ai_enhance_detailed",
]);

function normalizeChatUsageEventType(input: unknown): ServerAiUsageEventType {
  if (typeof input !== "string") return "chat_call_1";
  return CHAT_USAGE_EVENT_TYPES.has(input as ServerAiUsageEventType)
    ? input as ServerAiUsageEventType
    : "chat_call_1";
}

type XAIResult = { ok: true; response: Response } | { ok: false; status: number; errorText: string };

type PlannerPlan = {
  focusCharacter: string | null;
  allowedSpeakers: string[];
  maxSpeakerBlocks: number;
  directQuestionsToAnswer: string[];
  mentionedAiCharacters: string[];
  immediateSceneFocus: string;
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

type RoleplayDebugModelRequest = {
  label?: string;
  endpoint: string;
  method?: string;
  capturedAt?: number;
  requestBody: unknown;
  notes?: string[];
  responseUsage?: XaiResponsesUsage | null;
  reasoningSummaries?: string[];
  providerStreamError?: string | null;
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
  modelRequest?: RoleplayDebugModelRequest;
  modelRequests?: RoleplayDebugModelRequest[];
  notes: string[];
};

const CONTENT_REDIRECT_DIRECTIVE = `[CONTENT REDIRECT]
The provider blocked the previous request. Continue in character without mentioning filters, moderation, or policy.
Preserve the current scene, established facts, character knowledge, and user-control boundaries.
If the blocked wording cannot be continued directly, continue through a believable character response, visible reaction, or immediate consequence that fits what was already happening.
Do not abruptly replace the scene, ask the user to restate the scene, or turn the response into an out-of-character safety explanation.`;

const CONTENT_FILTER_NOTICE_TEXT = 'Chronicle: The model provider blocked this turn. This can happen because of your latest message or because the previous AI response is included in the request. Try editing the last user or AI message, then send again.';

const DEBUG_CHAT_LOGS = Deno.env.get("DEBUG_CHAT_LOGS") === "true";

const RECENT_HISTORY_WINDOW = 16;
const CHAT_REQUEST_MAX_BODY_BYTES = 512_000;
const CHAT_REQUEST_MAX_MESSAGES = 12;
const CHAT_REQUEST_MAX_SINGLE_MESSAGE_CHARS = 180_000;
const CHAT_REQUEST_MAX_TOTAL_MESSAGE_CHARS = 240_000;
const CHAT_MIN_OUTPUT_TOKENS = 256;
const CHAT_DEFAULT_OUTPUT_TOKENS = 2048;
const CHAT_MAX_OUTPUT_TOKENS = 3072;

const TEMP_DIRECT = 0.6;
const ROLEPLAY_RESPONSES_REASONING_EFFORT: XaiResponsesReasoningEffort = "medium";
const ROLEPLAY_RESPONSES_STORE = false;

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
  immediateSceneFocus: '',
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
// can use its own value. Direct path keeps 0.6, planner 0.15, writer 0.3.
// ============================================================================
async function callXAI(
  messages: Message[],
  modelId: string,
  stream: boolean,
  maxTokens: number = CHAT_DEFAULT_OUTPUT_TOKENS,
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
    const errorText = await readXaiErrorText(response);
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
      // Keep the browser-facing stream Chat Completions-shaped even when the
      // provider call used Responses; the frontend parser depends on this shape.
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

function streamContentFilterNoticeAsSSE(
  modelId: string,
  headers: HeadersInit,
  debugTrace: RoleplayDebugTrace | null = null,
): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      if (debugTrace) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chronicle_debug_trace: debugTrace })}\n\n`));
      }
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({
        chronicle_content_filter: {
          message: CONTENT_FILTER_NOTICE_TEXT,
          reason: 'provider_content_filter',
        },
      })}\n\n`));
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });

  return new Response(stream, { headers });
}

function previewProviderError(errorText: string, max = 800): string {
  const normalized = (errorText || '').replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  return normalized.length > max ? `${normalized.slice(0, max - 1).trim()}…` : normalized;
}

function messageFromUnknown(error: unknown): string {
  return error instanceof Error ? error.message : String(error || 'Unknown provider error');
}

function cachedInputTokensFromUsage(usage: XaiResponsesUsage | null | undefined): number | null {
  const details = usage?.input_tokens_details;
  if (!details || typeof details !== "object") return null;
  const cachedTokens = (details as Record<string, unknown>).cached_tokens;
  return typeof cachedTokens === "number" && Number.isFinite(cachedTokens) ? cachedTokens : null;
}

function providerMetadataFromResponsesUsage(usage: XaiResponsesUsage | null | undefined): Record<string, number | null> {
  return {
    providerInputTokens: usage?.input_tokens ?? null,
    providerCachedInputTokens: cachedInputTokensFromUsage(usage),
    providerOutputTokens: usage?.output_tokens ?? null,
    providerTotalTokens: usage?.total_tokens ?? null,
    providerReasoningTokens: usage?.reasoning_tokens ?? null,
  };
}

function providerMetadataFromChatCompletionsUsage(usage: unknown): Record<string, number | null> {
  if (!usage || typeof usage !== "object") {
    return {
      providerInputTokens: null,
      providerCachedInputTokens: null,
      providerOutputTokens: null,
      providerTotalTokens: null,
      providerReasoningTokens: null,
    };
  }
  const row = usage as Record<string, unknown>;
  const promptDetails = row.prompt_tokens_details && typeof row.prompt_tokens_details === "object"
    ? row.prompt_tokens_details as Record<string, unknown>
    : {};
  const completionDetails = row.completion_tokens_details && typeof row.completion_tokens_details === "object"
    ? row.completion_tokens_details as Record<string, unknown>
    : {};
  const numberOrNull = (value: unknown): number | null =>
    typeof value === "number" && Number.isFinite(value) ? value : null;

  return {
    providerInputTokens: numberOrNull(row.prompt_tokens),
    providerCachedInputTokens: numberOrNull(promptDetails.cached_tokens),
    providerOutputTokens: numberOrNull(row.completion_tokens),
    providerTotalTokens: numberOrNull(row.total_tokens),
    providerReasoningTokens: numberOrNull(completionDetails.reasoning_tokens),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

async function readBoundedJsonBody(req: Request): Promise<
  | { ok: true; body: unknown }
  | { ok: false; status: number; error: string }
> {
  const declaredLength = Number(req.headers.get('content-length') || 0);
  if (Number.isFinite(declaredLength) && declaredLength > CHAT_REQUEST_MAX_BODY_BYTES) {
    return {
      ok: false,
      status: 413,
      error: `Request body is too large. Maximum size is ${CHAT_REQUEST_MAX_BODY_BYTES} bytes.`,
    };
  }

  const rawBody = await req.text();
  const actualLength = new TextEncoder().encode(rawBody).length;
  if (actualLength > CHAT_REQUEST_MAX_BODY_BYTES) {
    return {
      ok: false,
      status: 413,
      error: `Request body is too large. Maximum size is ${CHAT_REQUEST_MAX_BODY_BYTES} bytes.`,
    };
  }

  try {
    return { ok: true, body: JSON.parse(rawBody) };
  } catch {
    return { ok: false, status: 400, error: 'Invalid JSON request body.' };
  }
}

function normalizeChatMessages(value: unknown): (
  | { ok: true; messages: Message[] }
  | { ok: false; error: string }
) {
  if (!Array.isArray(value) || value.length === 0) {
    return { ok: false, error: 'Missing required field: messages must be a non-empty array.' };
  }

  if (value.length > CHAT_REQUEST_MAX_MESSAGES) {
    return {
      ok: false,
      error: `Too many messages. Maximum is ${CHAT_REQUEST_MAX_MESSAGES}.`,
    };
  }

  let totalChars = 0;
  const messages: Message[] = [];
  const validRoles = new Set<Message['role']>(['system', 'user', 'assistant']);

  for (const [index, rawMessage] of value.entries()) {
    if (!isRecord(rawMessage)) {
      return { ok: false, error: `Invalid message at index ${index}.` };
    }

    const role = rawMessage.role;
    const content = rawMessage.content;
    if (role !== 'system' && role !== 'user' && role !== 'assistant') {
      return { ok: false, error: `Invalid message role at index ${index}.` };
    }
    if (!validRoles.has(role)) {
      return { ok: false, error: `Invalid message role at index ${index}.` };
    }
    if (typeof content !== 'string') {
      return { ok: false, error: `Invalid message content at index ${index}.` };
    }
    if (content.length > CHAT_REQUEST_MAX_SINGLE_MESSAGE_CHARS) {
      return {
        ok: false,
        error: `Message at index ${index} is too large. Maximum is ${CHAT_REQUEST_MAX_SINGLE_MESSAGE_CHARS} characters.`,
      };
    }

    totalChars += content.length;
    if (totalChars > CHAT_REQUEST_MAX_TOTAL_MESSAGE_CHARS) {
      return {
        ok: false,
        error: `Messages are too large. Maximum total content is ${CHAT_REQUEST_MAX_TOTAL_MESSAGE_CHARS} characters.`,
      };
    }

    messages.push({ role, content });
  }

  return { ok: true, messages };
}

function clampChatMaxTokens(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return CHAT_DEFAULT_OUTPUT_TOKENS;
  }

  return Math.min(
    CHAT_MAX_OUTPUT_TOKENS,
    Math.max(CHAT_MIN_OUTPUT_TOKENS, Math.floor(value)),
  );
}

function appendProviderErrorToDebugTrace(
  debugTrace: RoleplayDebugTrace | null,
  modelRequest: RoleplayDebugModelRequest,
  providerError: string,
): RoleplayDebugTrace | null {
  if (!debugTrace) return null;
  return {
    ...debugTrace,
    modelRequest: {
      ...modelRequest,
      providerStreamError: providerError,
    },
    finalPath: 'provider_error',
    fallbackReason: 'provider_error',
    notes: [
      ...debugTrace.notes,
      `Provider error preserved for debugging: ${previewProviderError(providerError)}`,
    ],
  };
}

function streamProviderErrorAsSSE(
  modelId: string,
  headers: HeadersInit,
  message: string,
  reason: string,
  debugTrace: RoleplayDebugTrace | null = null,
): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      if (debugTrace) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chronicle_debug_trace: debugTrace })}\n\n`));
      }
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({
        chronicle_provider_error: {
          message,
          reason,
          model: modelId,
        },
      })}\n\n`));
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });

  return new Response(stream, { headers });
}

function jsonProviderErrorResponse(
  status: number,
  message: string,
  reason: string,
  headers: HeadersInit,
  debugTrace: RoleplayDebugTrace | null = null,
): Response {
  return new Response(
    JSON.stringify({
      error: message,
      error_type: reason,
      chronicle_debug_trace: debugTrace,
    }),
    { status, headers },
  );
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
function buildXaiDebugModelRequest(
  messages: Message[],
  modelId: string,
  stream: boolean,
  maxTokens: number,
  temperature: number,
  notes?: string[],
): RoleplayDebugModelRequest {
  return {
    endpoint: "https://api.x.ai/v1/chat/completions",
    method: "POST",
    capturedAt: Date.now(),
    requestBody: {
      model: modelId,
      messages,
      stream,
      temperature,
      max_tokens: maxTokens,
    },
    notes,
  };
}

function appendResponsesMetadataToDebugTrace(
  debugTrace: RoleplayDebugTrace | null,
  metadata: {
    modelRequest: RoleplayDebugModelRequest;
    responseUsage?: XaiResponsesUsage | null;
    reasoningSummaries?: string[];
    providerStreamError?: string | null;
  },
): RoleplayDebugTrace | null {
  if (!debugTrace) return null;
  return {
    ...debugTrace,
    modelRequest: {
      ...metadata.modelRequest,
      responseUsage: metadata.responseUsage ?? metadata.modelRequest.responseUsage ?? null,
      reasoningSummaries: metadata.reasoningSummaries ?? metadata.modelRequest.reasoningSummaries,
      providerStreamError: metadata.providerStreamError ?? metadata.modelRequest.providerStreamError ?? null,
    },
  };
}

class ResponsesContentError extends Error {
  readonly responseUsage: XaiResponsesUsage | null;
  readonly reasoningSummaries: string[];

  constructor(
    message: string,
    details: {
      responseUsage?: XaiResponsesUsage | null;
      reasoningSummaries?: string[];
    } = {},
  ) {
    super(message);
    this.name = "ResponsesContentError";
    this.responseUsage = details.responseUsage ?? null;
    this.reasoningSummaries = details.reasoningSummaries ?? [];
  }
}

function getResponsesContentError(error: unknown): ResponsesContentError | null {
  return error instanceof ResponsesContentError ? error : null;
}

async function readResponsesStreamContent(body: ReadableStream<Uint8Array> | null): Promise<{
  text: string;
  reasoningSummaries: string[];
  responseUsage: XaiResponsesUsage | null;
}> {
  if (!body) {
    throw new ResponsesContentError("Responses stream missing response body");
  }

  const decoder = new TextDecoder();
  const reader = body.getReader();
  let buffer = "";
  let text = "";
  const reasoningSummaries: string[] = [];
  let completed = false;
  let responseUsage: XaiResponsesUsage | null = null;

  const consumeFrame = (frame: string) => {
    for (const rawLine of frame.split("\n")) {
      const line = rawLine.trim();
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      let parsed: unknown;
      try {
        parsed = JSON.parse(data);
      } catch {
        continue;
      }
      const normalized = normalizeResponsesStreamEvent(parsed);
      if (normalized.visibleText) text += normalized.visibleText;
      if (normalized.reasoningSummary) reasoningSummaries.push(normalized.reasoningSummary);
      if (normalized.responseUsage) responseUsage = normalized.responseUsage;
      if (normalized.failed || normalized.incomplete) {
        throw new ResponsesContentError(normalized.errorMessage || "Responses stream failed", {
          responseUsage,
          reasoningSummaries,
        });
      }
      if (normalized.completed) {
        completed = true;
        const completedText = extractXaiResponsesText((parsed as { response?: unknown }).response);
        if (completedText && completedText !== text) {
          text = completedText;
        }
        const completedReasoning = extractXaiResponsesReasoningSummaries((parsed as { response?: unknown }).response);
        if (completedReasoning.length) reasoningSummaries.push(...completedReasoning);
        responseUsage = extractXaiResponsesUsage((parsed as { response?: unknown }).response) ?? responseUsage;
      }
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const frames = buffer.split(/\r?\n\r?\n/);
      buffer = frames.pop() ?? "";
      frames.forEach(consumeFrame);
    }
    buffer += decoder.decode();
    if (buffer.trim()) consumeFrame(buffer);
  } finally {
    reader.releaseLock();
  }

  if (!completed) {
    throw new ResponsesContentError("Responses stream ended before response.completed", {
      responseUsage,
      reasoningSummaries,
    });
  }
  if (!text.trim()) {
    throw new ResponsesContentError("Responses stream completed without output_text", {
      responseUsage,
      reasoningSummaries,
    });
  }

  return { text, reasoningSummaries, responseUsage };
}

async function readResponsesJsonContent(response: Response): Promise<{
  data: unknown;
  text: string;
  reasoningSummaries: string[];
  responseUsage: XaiResponsesUsage | null;
}> {
  const data = await response.json();
  const responseUsage = extractXaiResponsesUsage(data);
  const reasoningSummaries = extractXaiResponsesReasoningSummaries(data);
  const bodyError = getXaiResponsesBodyError(data, { requireOutputText: true });
  if (bodyError) {
    throw new ResponsesContentError(bodyError, {
      responseUsage,
      reasoningSummaries,
    });
  }
  return {
    data,
    text: extractXaiResponsesText(data),
    reasoningSummaries,
    responseUsage,
  };
}

async function handleResponsesDirect(
  messages: Message[],
  modelId: string,
  stream: boolean,
  maxTokens: number,
  responseHeadersBase: Record<string, string>,
  userId: string,
  usageEventType: ServerAiUsageEventType,
  debugTrace: RoleplayDebugTrace | null = null,
): Promise<Response> {
  const XAI_API_KEY = Deno.env.get("XAI_API_KEY");
  if (!XAI_API_KEY) {
    throw new Error("XAI_API_KEY is not configured. Please add your Grok API key in settings.");
  }

  const directStartedAt = performance.now();
  const primary = await callXaiResponses({
    apiKey: XAI_API_KEY,
    model: modelId,
    messages,
    stream,
    maxOutputTokens: maxTokens,
    temperature: TEMP_DIRECT,
    store: ROLEPLAY_RESPONSES_STORE,
    reasoningEffort: ROLEPLAY_RESPONSES_REASONING_EFFORT,
  });

  let timedDebugTrace = withDebugTiming(debugTrace, { directMs: elapsedMs(directStartedAt) });

  if (primary.ok) {
    if (stream) {
      const streamHeaders = {
        ...responseHeadersBase,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      };
      try {
        const streamResult = await readResponsesStreamContent(primary.response.body);
        const normalizedText = normalizeFinalText(streamResult.text);
        timedDebugTrace = appendResponsesMetadataToDebugTrace(timedDebugTrace, {
          modelRequest: primary.modelRequest,
          responseUsage: streamResult.responseUsage,
          reasoningSummaries: streamResult.reasoningSummaries,
        });
        await recordServerAiUsage({
          userId,
          eventType: usageEventType,
          functionName: "chat",
          metadata: {
            modelId,
            providerTransport: "responses",
            stream,
            status: "success",
            providerRequestCount: 1,
            providerInputTokens: streamResult.responseUsage?.input_tokens ?? null,
            providerCachedInputTokens: cachedInputTokensFromUsage(streamResult.responseUsage),
            providerOutputTokens: streamResult.responseUsage?.output_tokens ?? null,
            providerTotalTokens: streamResult.responseUsage?.total_tokens ?? null,
            providerReasoningTokens: streamResult.responseUsage?.reasoning_tokens ?? null,
          },
        });
        return streamTextAsSSE(normalizedText, modelId, streamHeaders, timedDebugTrace);
      } catch (error) {
        const providerError = messageFromUnknown(error);
        const contentError = getResponsesContentError(error);
        const errorModelRequest: RoleplayDebugModelRequest = {
          ...primary.modelRequest,
          responseUsage: contentError?.responseUsage ?? null,
          reasoningSummaries: contentError?.reasoningSummaries,
        };
        timedDebugTrace = appendProviderErrorToDebugTrace(timedDebugTrace, errorModelRequest, providerError);
        await recordServerAiUsage({
          userId,
          eventType: usageEventType,
          functionName: "chat",
          metadata: {
            modelId,
            providerTransport: "responses",
            stream,
            status: "provider_stream_error",
            providerRequestCount: 1,
            ...providerMetadataFromResponsesUsage(contentError?.responseUsage),
          },
        });
        return streamProviderErrorAsSSE(
          modelId,
          streamHeaders,
          "The AI provider failed while generating this turn. Please try again.",
          'provider_stream_error',
          timedDebugTrace,
        );
      }
    }

    let content: Awaited<ReturnType<typeof readResponsesJsonContent>>;
    try {
      content = await readResponsesJsonContent(primary.response);
    } catch (error) {
      const providerError = messageFromUnknown(error);
      const contentError = getResponsesContentError(error);
      const errorModelRequest: RoleplayDebugModelRequest = {
        ...primary.modelRequest,
        responseUsage: contentError?.responseUsage ?? null,
        reasoningSummaries: contentError?.reasoningSummaries,
      };
      timedDebugTrace = appendProviderErrorToDebugTrace(timedDebugTrace, errorModelRequest, providerError);
      await recordServerAiUsage({
        userId,
        eventType: usageEventType,
        functionName: "chat",
        metadata: {
          modelId,
          providerTransport: "responses",
          stream,
          status: "provider_response_parse_error",
          providerRequestCount: 1,
          ...providerMetadataFromResponsesUsage(contentError?.responseUsage),
        },
      });
      return jsonProviderErrorResponse(
        502,
        "The AI provider returned an unreadable response. Please try again.",
        'provider_response_parse_error',
        { ...responseHeadersBase, "Content-Type": "application/json" },
        timedDebugTrace,
      );
    }
    const data = {
      id: `chatcmpl-${crypto.randomUUID()}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: modelId,
      choices: [{
        index: 0,
        message: { role: "assistant", content: normalizeFinalText(content.text) },
        finish_reason: "stop",
      }],
    };
    timedDebugTrace = appendResponsesMetadataToDebugTrace(timedDebugTrace, {
      modelRequest: primary.modelRequest,
      responseUsage: content.responseUsage,
      reasoningSummaries: content.reasoningSummaries,
    });
    await recordServerAiUsage({
      userId,
      eventType: usageEventType,
      functionName: "chat",
      metadata: {
        modelId,
        providerTransport: "responses",
        stream,
        status: "success",
        providerRequestCount: 1,
        providerInputTokens: content.responseUsage?.input_tokens ?? null,
        providerCachedInputTokens: cachedInputTokensFromUsage(content.responseUsage),
        providerOutputTokens: content.responseUsage?.output_tokens ?? null,
        providerTotalTokens: content.responseUsage?.total_tokens ?? null,
        providerReasoningTokens: content.responseUsage?.reasoning_tokens ?? null,
      },
    });
    return new Response(JSON.stringify({ ...data, chronicle_debug_trace: timedDebugTrace }), {
      headers: { ...responseHeadersBase, "Content-Type": "application/json" },
    });
  }

  if (primary.status === 403) {
    debugLog('[chat] Responses 403 content safety, retrying with redirect directive');
    const redirectMessages: Message[] = [
      ...messages.slice(0, -1),
      { role: 'system' as const, content: CONTENT_REDIRECT_DIRECTIVE },
      messages[messages.length - 1],
    ];
    const fallbackStartedAt = performance.now();
    const retry = await callXaiResponses({
      apiKey: XAI_API_KEY,
      model: modelId,
      messages: redirectMessages,
      stream,
      maxOutputTokens: maxTokens,
      temperature: TEMP_DIRECT,
      store: ROLEPLAY_RESPONSES_STORE,
      reasoningEffort: ROLEPLAY_RESPONSES_REASONING_EFFORT,
      notes: ["Primary Responses request received 403; this retry request was the final Grok request."],
    });
    timedDebugTrace = withDebugTiming(timedDebugTrace, { fallbackMs: elapsedMs(fallbackStartedAt) });

    if (retry.ok) {
      const priorModelRequest = { ...primary.modelRequest, label: 'Primary Responses request before provider fallback attempt' };
      if (stream) {
        const streamHeaders = {
          ...responseHeadersBase,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        };
        try {
          const streamResult = await readResponsesStreamContent(retry.response.body);
          const normalizedText = normalizeFinalText(streamResult.text);
          timedDebugTrace = timedDebugTrace
            ? {
                ...appendResponsesMetadataToDebugTrace(timedDebugTrace, {
                  modelRequest: retry.modelRequest,
                  responseUsage: streamResult.responseUsage,
                  reasoningSummaries: streamResult.reasoningSummaries,
                })!,
                modelRequests: [priorModelRequest],
              }
            : null;
          await recordServerAiUsage({
            userId,
            eventType: usageEventType,
            functionName: "chat",
            metadata: {
              modelId,
              providerTransport: "responses",
              stream,
              status: "fallback_success",
              providerRequestCount: 2,
              providerPreGenerationViolationCount: 1,
              providerInputTokens: streamResult.responseUsage?.input_tokens ?? null,
              providerCachedInputTokens: cachedInputTokensFromUsage(streamResult.responseUsage),
              providerOutputTokens: streamResult.responseUsage?.output_tokens ?? null,
              providerTotalTokens: streamResult.responseUsage?.total_tokens ?? null,
              providerReasoningTokens: streamResult.responseUsage?.reasoning_tokens ?? null,
            },
          });
          return streamTextAsSSE(normalizedText, modelId, streamHeaders, timedDebugTrace);
        } catch (error) {
          const providerError = messageFromUnknown(error);
          const contentError = getResponsesContentError(error);
          const errorModelRequest: RoleplayDebugModelRequest = {
            ...retry.modelRequest,
            responseUsage: contentError?.responseUsage ?? null,
            reasoningSummaries: contentError?.reasoningSummaries,
          };
          timedDebugTrace = timedDebugTrace
            ? {
                ...appendProviderErrorToDebugTrace(timedDebugTrace, errorModelRequest, providerError)!,
                modelRequests: [priorModelRequest],
              }
            : null;
          await recordServerAiUsage({
            userId,
            eventType: usageEventType,
            functionName: "chat",
            metadata: {
              modelId,
              providerTransport: "responses",
              stream,
              status: "provider_stream_error",
              providerRequestCount: 2,
              providerPreGenerationViolationCount: 1,
                ...providerMetadataFromResponsesUsage(contentError?.responseUsage),
            },
          });
          return streamProviderErrorAsSSE(
            modelId,
            streamHeaders,
            "The AI provider failed while generating this turn. Please try again.",
            'provider_stream_error',
            timedDebugTrace,
          );
        }
      }

      let content: Awaited<ReturnType<typeof readResponsesJsonContent>>;
      try {
        content = await readResponsesJsonContent(retry.response);
      } catch (error) {
        const providerError = messageFromUnknown(error);
        const contentError = getResponsesContentError(error);
        const errorModelRequest: RoleplayDebugModelRequest = {
          ...retry.modelRequest,
          responseUsage: contentError?.responseUsage ?? null,
          reasoningSummaries: contentError?.reasoningSummaries,
        };
        timedDebugTrace = timedDebugTrace
          ? {
              ...appendProviderErrorToDebugTrace(timedDebugTrace, errorModelRequest, providerError)!,
              modelRequests: [priorModelRequest],
            }
          : null;
        await recordServerAiUsage({
          userId,
          eventType: usageEventType,
          functionName: "chat",
          metadata: {
            modelId,
            providerTransport: "responses",
            stream,
            status: "provider_response_parse_error",
            providerRequestCount: 2,
            providerPreGenerationViolationCount: 1,
              ...providerMetadataFromResponsesUsage(contentError?.responseUsage),
          },
        });
        return jsonProviderErrorResponse(
          502,
          "The AI provider returned an unreadable response. Please try again.",
          'provider_response_parse_error',
          { ...responseHeadersBase, "Content-Type": "application/json" },
          timedDebugTrace,
        );
      }
      timedDebugTrace = timedDebugTrace
        ? {
            ...appendResponsesMetadataToDebugTrace(timedDebugTrace, {
              modelRequest: retry.modelRequest,
              responseUsage: content.responseUsage,
              reasoningSummaries: content.reasoningSummaries,
            })!,
            modelRequests: [priorModelRequest],
        }
        : null;
      await recordServerAiUsage({
        userId,
        eventType: usageEventType,
        functionName: "chat",
        metadata: {
          modelId,
          providerTransport: "responses",
          stream,
          status: "fallback_success",
          providerRequestCount: 2,
          providerPreGenerationViolationCount: 1,
          providerInputTokens: content.responseUsage?.input_tokens ?? null,
          providerCachedInputTokens: cachedInputTokensFromUsage(content.responseUsage),
          providerOutputTokens: content.responseUsage?.output_tokens ?? null,
          providerTotalTokens: content.responseUsage?.total_tokens ?? null,
          providerReasoningTokens: content.responseUsage?.reasoning_tokens ?? null,
        },
      });
      return jsonResponseAsCompletion(normalizeFinalText(content.text), modelId, {
        ...responseHeadersBase,
        "Content-Type": "application/json",
      }, timedDebugTrace);
    }

	    if (retry.status !== 403) {
	      const providerError = `Responses provider fallback attempt failed with HTTP ${retry.status}: ${previewProviderError(retry.errorText)}`;
      timedDebugTrace = timedDebugTrace
        ? {
            ...appendProviderErrorToDebugTrace(timedDebugTrace, retry.modelRequest, providerError)!,
            modelRequests: [{ ...primary.modelRequest, label: 'Primary Responses request before provider fallback attempt' }],
	          }
	          : null;
	      await recordServerAiUsage({
	        userId,
	        eventType: usageEventType,
	        functionName: "chat",
	        metadata: {
	          modelId,
	          providerTransport: "responses",
	          stream,
	          status: "provider_http_error",
	          providerRequestCount: 2,
	          providerPreGenerationViolationCount: 1,
	          providerHttpStatus: retry.status,
	        },
	      });
	      if (stream) {
        return streamProviderErrorAsSSE(modelId, {
          ...responseHeadersBase,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        }, "The AI provider failed while generating this turn. Please try again.", 'provider_http_error', timedDebugTrace);
      }
      return jsonProviderErrorResponse(
        502,
        "The AI provider failed while generating this turn. Please try again.",
        'provider_http_error',
        { ...responseHeadersBase, "Content-Type": "application/json" },
        timedDebugTrace,
      );
    }

	    const blockedTrace: RoleplayDebugTrace | null = timedDebugTrace
      ? {
          ...timedDebugTrace,
          modelRequest: retry.modelRequest,
          modelRequests: [{ ...primary.modelRequest, label: 'Primary Responses request before provider fallback attempt' }],
          finalPath: 'content_filter_notice',
          fallbackReason: 'provider_content_filter',
          notes: [
            ...timedDebugTrace.notes,
            'Primary Responses request and content-redirect retry were both blocked by the provider.',
            'The edge function returned a structured content-filter notice over HTTP 200 so the frontend can avoid a runtime overlay.',
          ],
        }
	      : null;

	    await recordServerAiUsage({
	      userId,
	      eventType: usageEventType,
	      functionName: "chat",
	      metadata: {
	        modelId,
	        providerTransport: "responses",
	        stream,
	        status: "content_filtered",
	        providerRequestCount: 2,
	        providerPreGenerationViolationCount: 2,
	      },
	    });

	    if (stream) {
      return streamContentFilterNoticeAsSSE(modelId, {
        ...responseHeadersBase,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      }, blockedTrace);
    }

    return new Response(
      JSON.stringify({
        ok: false,
        skipped: true,
        error: "Content filtered by provider",
        error_type: "content_filtered",
        message: CONTENT_FILTER_NOTICE_TEXT,
        chronicle_debug_trace: blockedTrace,
      }),
      { status: 200, headers: { ...responseHeadersBase, "Content-Type": "application/json" } },
    );
  }

	  const providerError = `Responses request failed with HTTP ${primary.status}: ${previewProviderError(primary.errorText)}`;
	  timedDebugTrace = appendProviderErrorToDebugTrace(timedDebugTrace, primary.modelRequest, providerError);
	  await recordServerAiUsage({
	    userId,
	    eventType: usageEventType,
	    functionName: "chat",
	    metadata: {
	      modelId,
	      providerTransport: "responses",
	      stream,
	      status: "provider_http_error",
	      providerRequestCount: 1,
	      providerHttpStatus: primary.status,
	    },
	  });
	  if (stream) {
    return streamProviderErrorAsSSE(modelId, {
      ...responseHeadersBase,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    }, "The AI provider failed while generating this turn. Please try again.", 'provider_http_error', timedDebugTrace);
  }
  return jsonProviderErrorResponse(
    502,
    "The AI provider failed while generating this turn. Please try again.",
    'provider_http_error',
    { ...responseHeadersBase, "Content-Type": "application/json" },
    timedDebugTrace,
  );
}

async function handleDirect(
  messages: Message[],
  modelId: string,
  stream: boolean,
  maxTokens: number,
  responseHeadersBase: Record<string, string>,
  userId: string,
  usageEventType: ServerAiUsageEventType,
  debugTrace: RoleplayDebugTrace | null = null,
): Promise<Response> {
  const directStartedAt = performance.now();
  const primaryModelRequest = buildXaiDebugModelRequest(messages, modelId, stream, maxTokens, TEMP_DIRECT);
  const result = await callXAI(messages, modelId, stream, maxTokens, TEMP_DIRECT);
  let timedDebugTrace = withDebugTiming(debugTrace, { directMs: elapsedMs(directStartedAt) });
  if (timedDebugTrace) {
    timedDebugTrace = { ...timedDebugTrace, modelRequest: primaryModelRequest };
  }

  if (result.ok) {
    if (stream) {
      let streamedResponse: Response;
      try {
        streamedResponse = await streamSanitizedXAICompletion(result.response.body, modelId, {
          ...responseHeadersBase,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        }, timedDebugTrace);
      } catch (error) {
        if (timedDebugTrace) {
          timedDebugTrace = appendProviderErrorToDebugTrace(timedDebugTrace, primaryModelRequest, messageFromUnknown(error));
        }
        await recordServerAiUsage({
          userId,
          eventType: usageEventType,
          functionName: "chat",
          metadata: {
            modelId,
            providerTransport: "chat_completions",
            stream,
            status: "provider_stream_error",
            providerRequestCount: 1,
          },
        });
        throw error;
      }
      await recordServerAiUsage({
        userId,
        eventType: usageEventType,
        functionName: "chat",
        metadata: {
          modelId,
          providerTransport: "chat_completions",
          stream,
          status: "success",
          providerRequestCount: 1,
        },
      });
      return streamedResponse;
    }
    let data: any;
    try {
      data = await result.response.json();
    } catch (error) {
      if (timedDebugTrace) {
        timedDebugTrace = appendProviderErrorToDebugTrace(timedDebugTrace, primaryModelRequest, messageFromUnknown(error));
      }
      await recordServerAiUsage({
        userId,
        eventType: usageEventType,
        functionName: "chat",
        metadata: {
          modelId,
          providerTransport: "chat_completions",
          stream,
          status: "provider_response_parse_error",
          providerRequestCount: 1,
        },
      });
      throw error;
    }
    const providerUsageMetadata = providerMetadataFromChatCompletionsUsage(data?.usage);
    if (timedDebugTrace) {
      data.chronicle_debug_trace = timedDebugTrace;
    }
    await recordServerAiUsage({
      userId,
      eventType: usageEventType,
      functionName: "chat",
      metadata: {
        modelId,
        providerTransport: "chat_completions",
        stream,
	        status: "success",
	        providerRequestCount: 1,
	        ...providerUsageMetadata,
	      },
	    });
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
    const retryModelRequest = buildXaiDebugModelRequest(
      redirectMessages,
      modelId,
      stream,
      maxTokens,
      TEMP_DIRECT,
      ["Primary chat request received 403; this retry request was the final Grok request."],
    );
    const retry = await callXAI(redirectMessages, modelId, stream, maxTokens, TEMP_DIRECT);
    timedDebugTrace = withDebugTiming(timedDebugTrace, { fallbackMs: elapsedMs(fallbackStartedAt) });
    if (timedDebugTrace) {
      timedDebugTrace = {
        ...timedDebugTrace,
        modelRequest: retryModelRequest,
        modelRequests: [{ ...primaryModelRequest, label: 'Primary request before provider fallback attempt' }],
      };
    }
    if (retry.ok) {
      if (stream) {
        let streamedResponse: Response;
        try {
          streamedResponse = await streamSanitizedXAICompletion(retry.response.body, modelId, {
            ...responseHeadersBase,
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
          }, timedDebugTrace);
        } catch (error) {
          if (timedDebugTrace) {
            timedDebugTrace = appendProviderErrorToDebugTrace(timedDebugTrace, retryModelRequest, messageFromUnknown(error));
          }
          await recordServerAiUsage({
            userId,
            eventType: usageEventType,
            functionName: "chat",
            metadata: {
              modelId,
              providerTransport: "chat_completions",
              stream,
              status: "provider_stream_error",
              providerRequestCount: 2,
              providerPreGenerationViolationCount: 1,
            },
          });
          throw error;
        }
        await recordServerAiUsage({
          userId,
          eventType: usageEventType,
          functionName: "chat",
          metadata: {
            modelId,
            providerTransport: "chat_completions",
            stream,
            status: "fallback_success",
            providerRequestCount: 2,
            providerPreGenerationViolationCount: 1,
          },
        });
        return streamedResponse;
      }
      let data: any;
      try {
        data = await retry.response.json();
      } catch (error) {
        if (timedDebugTrace) {
          timedDebugTrace = appendProviderErrorToDebugTrace(timedDebugTrace, retryModelRequest, messageFromUnknown(error));
        }
        await recordServerAiUsage({
          userId,
          eventType: usageEventType,
          functionName: "chat",
          metadata: {
            modelId,
            providerTransport: "chat_completions",
            stream,
            status: "provider_response_parse_error",
            providerRequestCount: 2,
            providerPreGenerationViolationCount: 1,
          },
        });
        throw error;
      }
      const providerUsageMetadata = providerMetadataFromChatCompletionsUsage(data?.usage);
      if (timedDebugTrace) {
        data.chronicle_debug_trace = timedDebugTrace;
      }
      await recordServerAiUsage({
        userId,
        eventType: usageEventType,
        functionName: "chat",
        metadata: {
          modelId,
          providerTransport: "chat_completions",
          stream,
          status: "fallback_success",
          providerRequestCount: 2,
          providerPreGenerationViolationCount: 1,
          ...providerUsageMetadata,
        },
      });
      return new Response(JSON.stringify(data), {
        headers: { ...responseHeadersBase, "Content-Type": "application/json" },
      });
    }
    const retryStatus = retry.status === 403 ? "content_filtered" : "provider_http_error";
    const blockedTrace: RoleplayDebugTrace | null = timedDebugTrace
      ? {
          ...timedDebugTrace,
          finalPath: retry.status === 403 ? 'content_filter_notice' : 'provider_http_error',
          fallbackReason: retry.status === 403 ? 'provider_content_filter' : 'provider_http_error',
          notes: [
            ...timedDebugTrace.notes,
            retry.status === 403
              ? 'Primary chat request and content-redirect retry were both blocked by the provider.'
              : `Primary chat request was blocked, then the provider content-redirect fallback failed with HTTP ${retry.status}.`,
            retry.status === 403
              ? 'The edge function returned a structured content-filter notice over HTTP 200 so the frontend can avoid a runtime overlay.'
              : 'The edge function returned a provider error response after recording the paid retry attempt.',
          ],
        }
      : null;

	    await recordServerAiUsage({
	      userId,
	      eventType: usageEventType,
	      functionName: "chat",
	      metadata: {
          modelId,
          providerTransport: "chat_completions",
          stream,
          status: retryStatus,
          providerRequestCount: 2,
          providerPreGenerationViolationCount: retry.status === 403 ? 2 : 1,
          providerHttpStatus: retry.status,
        },
      });

    if (retry.status !== 403) {
      if (stream) {
        return streamProviderErrorAsSSE(modelId, {
          ...responseHeadersBase,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        }, "The AI provider failed while generating this turn. Please try again.", 'provider_http_error', blockedTrace);
      }
      return jsonProviderErrorResponse(
        502,
        "The AI provider failed while generating this turn. Please try again.",
        'provider_http_error',
        { ...responseHeadersBase, "Content-Type": "application/json" },
        blockedTrace,
      );
    }

    if (stream) {
      return streamContentFilterNoticeAsSSE(modelId, {
        ...responseHeadersBase,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      }, blockedTrace);
    }

    return new Response(
      JSON.stringify({
        ok: false,
        skipped: true,
        error: "Content filtered by provider",
        error_type: "content_filtered",
        message: CONTENT_FILTER_NOTICE_TEXT,
        chronicle_debug_trace: blockedTrace,
      }),
      { status: 200, headers: { ...responseHeadersBase, "Content-Type": "application/json" } },
    );
  }

  await recordServerAiUsage({
    userId,
    eventType: usageEventType,
    functionName: "chat",
    metadata: {
      modelId,
      providerTransport: "chat_completions",
      stream,
      status: "provider_http_error",
      providerRequestCount: 1,
      providerHttpStatus: result.status,
    },
  });

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

    const bodyResult = await readBoundedJsonBody(req);
    if (!bodyResult.ok) {
      return new Response(
        JSON.stringify({ error: bodyResult.error }),
        { status: bodyResult.status, headers: { ...responseHeadersBase, "Content-Type": "application/json" } },
      );
    }

    const body = bodyResult.body as Partial<ChatRequest>;
    const messageResult = normalizeChatMessages(body.messages);
    if (!messageResult.ok) {
      return new Response(
        JSON.stringify({ error: messageResult.error }),
        { status: 400, headers: { ...responseHeadersBase, "Content-Type": "application/json" } },
      );
    }

    const messages = messageResult.messages;
    const stream = body.stream !== false;
    const maxTokens = clampChatMaxTokens(body.max_tokens);
    const pipeline = body.pipeline === 'roleplay_v2' ? 'roleplay_v2' : 'direct';
    const providerTransport = body.providerTransport === 'chat_completions' ? 'chat_completions' : 'responses';
    const usageEventType = normalizeChatUsageEventType(body.usageEventType);
    const debugTraceAllowed = await shouldReturnAdminDebugTrace(supabase, user.id, body.debugTrace, "[chat]");
    const roleplayContext = isRecord(body.roleplayContext) ? body.roleplayContext as RoleplayContext : undefined;

    const VALID_GROK_MODELS = ['grok-4.3'];
    const requestedModelId = typeof body.modelId === 'string' ? body.modelId : '';
    const modelId = VALID_GROK_MODELS.includes(requestedModelId) ? requestedModelId : 'grok-4.3';
    if (requestedModelId !== modelId) {
      warnLog(`[chat] Rejected non-Grok model "${requestedModelId}", using "${modelId}"`);
    }

    const normalizedPipeline = pipeline === 'roleplay_v2' ? 'direct' : pipeline;
    if (pipeline === 'roleplay_v2') {
      warnLog('[chat] roleplay_v2 requested, but Chronicle now aliases that lane to direct mode.');
    }

    debugLog(`[chat] pipeline=${normalizedPipeline} transport=${providerTransport} model=${modelId} messages=${messages.length} stream=${stream}`);

    // ---- direct (default + compatibility alias) --------------------------
    if (providerTransport === 'responses') {
      return await handleResponsesDirect(
        messages,
        modelId,
        stream,
        maxTokens,
        responseHeadersBase,
        user.id,
        usageEventType,
        debugTraceAllowed ? buildDirectDebugTrace(messages, roleplayContext) : null,
      );
    }

    return await handleDirect(
      messages,
      modelId,
      stream,
      maxTokens,
      responseHeadersBase,
      user.id,
      usageEventType,
      debugTraceAllowed ? buildDirectDebugTrace(messages, roleplayContext) : null,
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
