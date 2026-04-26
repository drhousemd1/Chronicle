// ============================================================================
// GROK ONLY -- All chat calls go to xAI. No Gemini. No OpenAI.
// This edge function exclusively uses the xAI API for all chat completions.
//
// Supports two pipelines:
//   - 'direct'      (default, legacy behavior, unchanged contract)
//   - 'roleplay_v2' (planner -> writer -> deterministic cleanup)
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { checkRateLimit, getRateLimitHeaders } from "../_shared/rate-limit.ts";

type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type RoleplayContext = {
  conversationId?: string;
  currentDay?: number;
  currentTimeOfDay?: string;
  activeSceneTitle?: string;
  activeSceneTags?: string[];
  aiCharacterNames?: string[];
  userCharacterNames?: string[];
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
const SUPPORTING_HISTORY_WINDOW = 8;

const USE_MODEL_PLANNER = Deno.env.get("CHAT_USE_MODEL_PLANNER") === "true";

const TEMP_DIRECT = 0.55;
const TEMP_PLANNER = 0.15;
const TEMP_WRITER = 0.3;

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

// ============================================================================
// Helpers for non-streaming JSON extraction (planner + validator)
// ============================================================================
async function callXAIForJson(
  messages: Message[],
  modelId: string,
  maxTokens: number,
  temperature: number,
): Promise<{ ok: true; content: string } | { ok: false; reason: string }> {
  const result = await callXAI(messages, modelId, false, maxTokens, temperature);
  if (!result.ok) return { ok: false, reason: `status_${result.status}` };
  try {
    const data = await result.response.json();
    const content: string = data?.choices?.[0]?.message?.content ?? '';
    if (!content) return { ok: false, reason: 'empty_content' };
    return { ok: true, content };
  } catch (e) {
    return { ok: false, reason: `parse_${(e as Error).message}` };
  }
}

function extractJsonObject(raw: string): unknown | null {
  if (!raw) return null;
  const trimmed = raw.trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```$/i, '')
    .trim();
  // Try direct parse first
  try { return JSON.parse(trimmed); } catch { /* fall through */ }
  // Find the first {...} block
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try { return JSON.parse(trimmed.slice(start, end + 1)); } catch { /* ignore */ }
  }
  return null;
}

function previewText(text: string, maxLength = 220): string {
  const normalized = (text || '').replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 3).trimEnd()}...`;
}

function extractSpeakerBlockNames(text: string): string[] {
  const lines = (text || '').split('\n').filter((line) => line.trim().length > 0);
  const names: string[] = [];
  const tagRegex = /^\s*(?:\*\*)?([A-Z][a-zA-Z\s'-]{0,29})(?:\*\*)?:\s*/;

  for (const line of lines) {
    const match = line.match(tagRegex);
    if (!match) continue;
    const name = match[1].trim();
    if (!name) continue;
    if (names.length === 0 || names[names.length - 1] !== name) {
      names.push(name);
    }
  }

  return names;
}

function uniqueNonEmpty(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of values) {
    const value = String(raw ?? '').trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }
  return result;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findMentionedAiCharacters(text: string, aiCharacterNames: string[]): string[] {
  return aiCharacterNames.filter((name) => {
    if (!name.trim()) return false;
    return new RegExp(`(^|[^\\p{L}\\p{N}_])${escapeRegExp(name)}([^\\p{L}\\p{N}_]|$)`, 'iu').test(text);
  });
}

function extractQuestionSentences(text: string, maxItems = 3): string[] {
  const matches = (text || '').match(/[^.!?\n]*\?+/g) ?? [];
  return matches
    .map((sentence) => sentence.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .slice(0, maxItems);
}

function buildLocalPlannerPlan(messages: Message[], ctx: RoleplayContext | undefined, lastUser: string): PlannerPlan {
  const aiNames = uniqueNonEmpty(ctx?.aiCharacterNames ?? []);
  const previousAssistant = [...messages].reverse().find((message) => message.role === 'assistant')?.content ?? '';
  const previousSpeakers = extractSpeakerBlockNames(previousAssistant).filter((name) => (
    aiNames.some((aiName) => aiName.toLowerCase() === name.toLowerCase())
  ));
  const mentionedAiCharacters = findMentionedAiCharacters(lastUser, aiNames);
  const groupCue = /\b(you both|both of you|everyone|everybody|together|we|us|all of us|your mom|your daughter|group|stay together)\b/i.test(lastUser);
  const focusCharacter = mentionedAiCharacters[0] || previousSpeakers[0] || aiNames[0] || null;
  const secondaryCandidates = groupCue || mentionedAiCharacters.length > 1
    ? uniqueNonEmpty([...mentionedAiCharacters.slice(1), ...previousSpeakers, ...aiNames]).filter((name) => name !== focusCharacter)
    : [];
  const allowedSpeakers = uniqueNonEmpty([focusCharacter, ...mentionedAiCharacters, ...secondaryCandidates]).slice(0, 2);
  const directQuestionsToAnswer = uniqueNonEmpty([
    ...extractQuestionSentences(lastUser),
    ...extractQuestionSentences(previousAssistant).map((question) => `Carry forward or acknowledge prior AI question: ${question}`),
  ]).slice(0, 4);
  const sceneStateFacts = uniqueNonEmpty([
    ctx?.activeSceneTitle ? `Current scene: ${ctx.activeSceneTitle}` : null,
    ctx?.currentDay != null ? `Current day: ${ctx.currentDay}` : null,
    ctx?.currentTimeOfDay ? `Current time of day: ${ctx.currentTimeOfDay}` : null,
    ctx?.activeSceneTags?.length ? `Scene tags: ${ctx.activeSceneTags.join(', ')}` : null,
  ]);

  return {
    focusCharacter,
    allowedSpeakers,
    maxSpeakerBlocks: Math.max(1, Math.min(2, allowedSpeakers.length || 1)),
    directQuestionsToAnswer,
    mentionedAiCharacters,
    immediateBeat: 'Respond to the latest user action, make one concrete next beat, and keep the scene moving without a major jump unless the story clearly calls for it.',
    mustInclude: [
      'Treat user-written AI-character dialogue/action as canon, not as an instruction to ignore.',
      'If the latest turn names or directs an AI character, answer or acknowledge that direction in the next response.',
      'If the latest turn directly addresses two AI characters and both answers matter, give each addressed character one short block rather than letting one speak for or narrate the other.',
    ],
    mustAvoid: [
      'Do not speak for user-controlled characters.',
      'Do not force every present AI character to speak.',
      'Do not add filler second-speaker dialogue.',
      'Do not stall with consent, confirmation, or waiting loops.',
      'Do not output separator lines, code fences, or wrapper tags.',
      'Do not put a speaker tag inside an already tagged character bubble.',
      "Do not narrate one AI character's meaningful compliance, refusal, movement, answer, or decision inside another AI character speaker block.",
      'Do not ignore a directly addressed AI character by having another character merely observe their fear, silence, or body language.',
      'Do not invent narration labels, beat labels, or sentence-fragment headings with colons; every paragraph-start colon label must be an exact cast character name.',
      'Do not expose internal goal, priority, directive, planner, or checklist labels or shorthand such as "Survival priority:", "Priority is heat", "Priority\'s heat", "Goal:", "Plan:", or "Must include:" in story prose.',
      'Do not open with the same weather, time-of-day, or visibility recap used in recent turns.',
    ],
    continuityNotes: [
      'Latest user turn has priority over older excerpts.',
      'Preserve the current physical scene state and line of sight.',
      'Use prior memory as continuity support, not as a reason to repeat resolved beats.',
    ],
    sceneStateFacts,
    formattingNotes: [
      'Default to one tagged AI speaker; use a second only when they meaningfully contribute.',
      'Keep the response readable and responsive to the chat length setting.',
      'Use natural character voice instead of checklist language.',
      'Use roleplay formatting: visible action/narration in *asterisks*, spoken dialogue in straight double quotes, and private thoughts only in (parentheses).',
      'Do not put one AI character spoken dialogue inside another AI character speaker block.',
      'Tiny visible reactions can stay in the focal block; meaningful second-character actions or answers need their own short speaker block within the speaker cap.',
      'Keep all visible scanning, movement, and environmental description inside *asterisks* instead of bare prose or colon subheadings.',
      'Keep goals and priorities internal; render them as natural choices, actions, or subtext instead of visible planner/checklist labels or "priority is..." shorthand.',
      'Do not write bare unquoted internal monologue or mechanically repeat scene-state phrases.',
    ],
  };
}

function analyzePolicyViolations(text: string, plan: PlannerPlan): string[] {
  const issues: string[] = [];

  if (/^\s*(?:(?:[-—*_]){3,}|```(?:\w+)?|<\/?writer_draft>)\s*$/gim.test(text)) {
    issues.push('Remove leaked separator or wrapper lines such as ---, ***, code fences, or <writer_draft> tags.');
  }

  const speakerBlocks = extractSpeakerBlockNames(text);
  if (speakerBlocks.length > (plan.maxSpeakerBlocks || 1)) {
    issues.push(`Reduce speaker-tagged blocks to ${plan.maxSpeakerBlocks || 1} or fewer.`);
  }

  if (plan.allowedSpeakers.length > 0) {
    const allowed = new Set(plan.allowedSpeakers.map((name) => name.toLowerCase()));
    const disallowed = [...new Set(speakerBlocks.filter((name) => !allowed.has(name.toLowerCase())))];
    if (disallowed.length > 0) {
      issues.push(`Use only these allowed speaker tags: ${plan.allowedSpeakers.join(', ')}. Remove: ${disallowed.join(', ')}.`);
    }
  }

  return issues;
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
      temperature: args.pipeline === 'direct' ? TEMP_DIRECT : TEMP_WRITER,
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

// ============================================================================
// Supporting-canon selection (relevance based)
// ============================================================================
function tokenize(text: string): string[] {
  return (text || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4);
}

function selectSupportingExcerptDetails(
  allMessages: Message[],
  recentWindowSize: number,
  supportingLimit: number,
  ctx: RoleplayContext | undefined,
): SupportingExcerptDetail[] {
  const total = allMessages.length;
  if (total <= recentWindowSize) return [];
  const olderPool = allMessages.slice(0, total - recentWindowSize);
  const recent = allMessages.slice(total - recentWindowSize);
  const latestUserTurn = [...recent].reverse().find((m) => m.role === 'user');
  const latestText = latestUserTurn?.content ?? recent[recent.length - 1]?.content ?? '';
  const keywords = new Set(tokenize(latestText));
  const charNames = new Set(
    [
      ...(ctx?.aiCharacterNames ?? []),
      ...(ctx?.userCharacterNames ?? []),
    ].map((n) => n.toLowerCase()).filter(Boolean),
  );
  const sceneTerms = new Set(
    [
      ctx?.activeSceneTitle ?? '',
      ...(ctx?.activeSceneTags ?? []),
    ]
      .map((value) => value.toLowerCase())
      .filter(Boolean),
  );

  const scored = olderPool.map((m, idx) => {
    const lower = m.content.toLowerCase();
    let score = 0;
    for (const kw of keywords) {
      if (kw && lower.includes(kw)) score += 1;
    }
    for (const name of charNames) {
      if (name && lower.includes(name)) score += 2;
    }
    for (const sceneTerm of sceneTerms) {
      if (sceneTerm && lower.includes(sceneTerm)) score += 2;
    }
    if (/\?/.test(m.content)) score += 1; // unresolved question-like
    return { idx, score, msg: m };
  });

  // Always include the 2 messages immediately preceding the recent window (bridge continuity)
  const bridgeIndices = new Set<number>();
  if (olderPool.length >= 1) bridgeIndices.add(olderPool.length - 1);
  if (olderPool.length >= 2) bridgeIndices.add(olderPool.length - 2);

  const ranked = scored
    .filter((s) => s.score > 0 && !bridgeIndices.has(s.idx))
    .sort((a, b) => b.score - a.score || b.idx - a.idx);

  const picked = new Map<number, SupportingExcerptDetail>();
  for (const i of bridgeIndices) {
    const msg = olderPool[i];
    picked.set(i, {
      role: msg.role,
      content: msg.content,
      preview: previewText(msg.content),
      selectionReason: 'bridge',
      score: 0,
    });
  }
  for (const s of ranked) {
    if (picked.size >= supportingLimit) break;
    picked.set(s.idx, {
      role: s.msg.role,
      content: s.msg.content,
      preview: previewText(s.msg.content),
      selectionReason: 'scored',
      score: s.score,
    });
  }
  // Return in original chronological order
  return [...picked.entries()].sort((a, b) => a[0] - b[0]).map(([, detail]) => detail);
}

function selectSupportingExcerpts(
  allMessages: Message[],
  recentWindowSize: number,
  supportingLimit: number,
  ctx: RoleplayContext | undefined,
): Message[] {
  return selectSupportingExcerptDetails(allMessages, recentWindowSize, supportingLimit, ctx)
    .map((detail) => ({ role: detail.role, content: detail.content }));
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
  // Collapse multiple em dashes in a row to a single one
  out = out.replace(/(?:\s*—\s*){2,}/g, ' — ');
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
// roleplay_v2 orchestration
// ============================================================================
async function runRoleplayV2(
  messages: Message[],
  modelId: string,
  maxTokens: number,
  ctx: RoleplayContext | undefined,
): Promise<
  | { ok: true; finalText: string; debugTrace: RoleplayDebugTrace }
  | { ok: false; reason: string; debugTrace: RoleplayDebugTrace }
> {
  const totalStartedAt = performance.now();
  let plannerMs: number | null = null;
  let writerMs: number | null = null;
  let normalizationMs: number | null = null;
  const currentTiming = (): RoleplayDebugTiming => buildDebugTiming({
    totalMs: elapsedMs(totalStartedAt),
    plannerMs,
    writerMs,
    normalizationMs,
  });

  // ---- 1) Planner ---------------------------------------------------------
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';
  const recent = messages.slice(-RECENT_HISTORY_WINDOW);
  const supportingDetails = selectSupportingExcerptDetails(messages, RECENT_HISTORY_WINDOW, SUPPORTING_HISTORY_WINDOW, ctx);
  const supporting = supportingDetails.map((detail) => ({ role: detail.role, content: detail.content } as Message));

  const ctxLines = [
    ctx?.conversationId ? `Conversation: ${ctx.conversationId}` : '',
    ctx?.currentDay != null ? `Day: ${ctx.currentDay}` : '',
    ctx?.currentTimeOfDay ? `Time: ${ctx.currentTimeOfDay}` : '',
    ctx?.activeSceneTitle ? `Scene: ${ctx.activeSceneTitle}` : '',
    ctx?.activeSceneTags?.length ? `Scene tags: ${ctx.activeSceneTags.join(', ')}` : '',
    ctx?.aiCharacterNames?.length ? `AI characters: ${ctx.aiCharacterNames.join(', ')}` : '',
    ctx?.userCharacterNames?.length ? `User characters: ${ctx.userCharacterNames.join(', ')}` : '',
  ].filter(Boolean).join('\n');

  const plannerSystem: Message = {
    role: 'system',
    content: `You are the PLANNER for a roleplay writing pipeline. Output ONLY a single JSON object — no prose, no code fences, no commentary.

Required JSON shape (use these EXACT field names):
{
  "focusCharacter": string | null,
  "allowedSpeakers": string[],
  "maxSpeakerBlocks": number,
  "directQuestionsToAnswer": string[],
  "mentionedAiCharacters": string[],
  "immediateBeat": string,
  "mustInclude": string[],
  "mustAvoid": string[],
  "continuityNotes": string[],
  "sceneStateFacts": string[],
  "formattingNotes": string[]
}

Rules:
- focusCharacter: the AI character whose voice, action, or emotional position should drive this turn, or null if narration.
- allowedSpeakers: AI character names allowed to receive tagged paragraphs this turn. Usually one name. Add a second only when that character meaningfully contributes through knowledge, personality, relationship pressure, direct address, or a necessary answer.
- maxSpeakerBlocks: default 1. Use 2 only when a second AI character's contribution matters. Keep it 1 when the second character would only add filler or repeat the focal speaker.
- directQuestionsToAnswer: literal or obvious questions from the latest user turn, plus unanswered direct questions from the immediately previous AI turn when the user has now responded.
- mentionedAiCharacters: AI characters explicitly referenced or implied by the latest turn.
- immediateBeat: one concise sentence describing the next meaningful beat. This can be an answer, decision, action, reveal, refusal, invitation, or changed relationship posture. It does not need to be a major scene jump.
- mustInclude: short bullet phrases (facts, callbacks, named objects) the writer must respect.
- mustAvoid: anti-patterns for this turn, especially off-screen perception, contradictions, invented props, trope labels, repeated resolved beats, robotic wording, needless second-speaker filler, and repeated confirmation loops.
- continuityNotes: facts from earlier turns the writer must preserve.
- sceneStateFacts: current physical-state facts that remain true right now. Treat these like a state machine snapshot.
- formattingNotes: tone/length/format hints (e.g. "two paragraphs, no bullet lists").

${ctxLines ? `Context:\n${ctxLines}\n` : ''}`,
  };

  const plannerInput: Message[] = [
    plannerSystem,
    ...supporting.map((m) => ({ role: m.role, content: `[earlier] ${m.content}` } as Message)),
    ...recent,
    { role: 'user', content: `Latest user turn (verbatim):\n${lastUser}\n\nReturn the JSON plan now.` },
  ];

  let plan: PlannerPlan = buildLocalPlannerPlan(messages, ctx, lastUser);
  let plannerUsedFallback = false;
  let plannerFailureReason: string | null = null;
  const plannerStartedAt = performance.now();
  if (USE_MODEL_PLANNER) {
    const plannerCall = await callXAIForJson(plannerInput, modelId, 1024, TEMP_PLANNER);
    if (plannerCall.ok) {
      const parsed = extractJsonObject(plannerCall.content);
      if (parsed && typeof parsed === 'object') {
        const p = parsed as Partial<PlannerPlan>;
        plan = {
          focusCharacter: typeof p.focusCharacter === 'string' ? p.focusCharacter : null,
          allowedSpeakers: Array.isArray(p.allowedSpeakers) ? p.allowedSpeakers.map(String).filter(Boolean) : [],
          maxSpeakerBlocks: typeof p.maxSpeakerBlocks === 'number' && Number.isFinite(p.maxSpeakerBlocks)
            ? Math.max(1, Math.min(2, Math.round(p.maxSpeakerBlocks)))
            : 1,
          directQuestionsToAnswer: Array.isArray(p.directQuestionsToAnswer) ? p.directQuestionsToAnswer.map(String) : [],
          mentionedAiCharacters: Array.isArray(p.mentionedAiCharacters) ? p.mentionedAiCharacters.map(String) : [],
          immediateBeat: typeof p.immediateBeat === 'string' ? p.immediateBeat : '',
          mustInclude: Array.isArray(p.mustInclude) ? p.mustInclude.map(String) : [],
          mustAvoid: Array.isArray(p.mustAvoid) ? p.mustAvoid.map(String) : [],
          continuityNotes: Array.isArray(p.continuityNotes) ? p.continuityNotes.map(String) : [],
          sceneStateFacts: Array.isArray(p.sceneStateFacts) ? p.sceneStateFacts.map(String) : [],
          formattingNotes: Array.isArray(p.formattingNotes) ? p.formattingNotes.map(String) : [],
        };
        if (!plan.allowedSpeakers.length && plan.focusCharacter) {
          plan.allowedSpeakers = [plan.focusCharacter];
        }
      } else {
        plannerUsedFallback = true;
        plannerFailureReason = 'planner_json_parse_failed';
        warnLog('[chat] planner JSON parse failed -- using local planner plan');
      }
    } else {
      plannerUsedFallback = true;
      plannerFailureReason = plannerCall.reason;
      warnLog(`[chat] planner call failed (${plannerCall.reason}) -- using local planner plan`);
    }
  }
  plannerMs = elapsedMs(plannerStartedAt);
  if (!plan.allowedSpeakers.length) {
    const fallbackSpeaker = plan.focusCharacter || plan.mentionedAiCharacters[0] || ctx?.aiCharacterNames?.[0] || null;
    if (fallbackSpeaker) {
      plan.allowedSpeakers = [fallbackSpeaker];
    }
  }

  // ---- 2) Writer ----------------------------------------------------------
  const writerPlanInjection: Message = {
    role: 'system',
    content: `[ROLEPLAY PLAN - HIGH PRIORITY]
${JSON.stringify(plan, null, 2)}

Writer contract:
- Execute the plan naturally; do not mention the plan.
- Use only these speaker tags for tagged paragraphs: ${plan.allowedSpeakers.length ? plan.allowedSpeakers.join(', ') : '(focus character only)'}.
- Use at most ${plan.maxSpeakerBlocks} speaker-tagged block(s).
- Answer or acknowledge every directQuestionsToAnswer item.
- Treat sceneStateFacts as current truth.
- Include mustInclude facts without dumping them mechanically.
- Avoid mustAvoid items.
- Keep older excerpts subordinate to the latest user turn.
- Write in the selected character's real voice, not as a checklist.
- Use the app's roleplay format: CharacterName: *visible action/narration.* "spoken dialogue"
- Never put one character's quoted dialogue inside another character's tagged block; give the speaking AI character their own tag or make it a silent visible reaction.
- Do not write bare prose or loose internal monologue after a speaker tag; wrap action in *asterisks*, wrap rare private thought in (parentheses), or omit it.
- Treat sceneStateFacts as constraints, not phrases to repeat every turn.
- Treat goals, priorities, directives, and planning notes as internal reasoning; never output visible labels or shorthand like "Survival priority:", "Priority is heat", "Priority's heat", "Goal:", "Directive:", "Plan:", or "Must include:".
- Do not reuse the same environmental opening from recent assistant turns; show a new physical effect if the scene condition still matters.
- Do not output markdown separator lines such as --- or ***.`,
  };

  // Preserve original system messages already in `messages`, then inject the plan after them.
  const writerInput: Message[] = [];
  let injected = false;
  for (const m of messages.slice(0, messages.length - recent.length)) {
    if (m.role === 'system') writerInput.push(m);
  }
  writerInput.push(writerPlanInjection);
  injected = true;
  for (const m of supporting) writerInput.push({ role: m.role, content: `[earlier] ${m.content}` });
  for (const m of recent) writerInput.push(m);
  if (!injected) writerInput.push(writerPlanInjection);

  const writerStartedAt = performance.now();
  const writerCall = await callXAI(writerInput, modelId, false, maxTokens, TEMP_WRITER);
  if (!writerCall.ok) {
    writerMs = elapsedMs(writerStartedAt);
    return {
      ok: false,
      reason: `writer_status_${writerCall.status}`,
      debugTrace: buildRoleplayDebugTrace({
        pipeline: 'roleplay_v2',
        finalPath: 'roleplay_v2_direct_fallback',
        fallbackReason: `writer_status_${writerCall.status}`,
        ctx,
        lastUser,
        recentWindowCount: recent.length,
        supportingDetails,
        plannerPlan: plan,
        plannerUsedFallback,
        plannerFailureReason,
        writerDraft: '',
        validatorApproved: null,
        validatorIssues: [],
        validatorUsedRevision: false,
        validatorUsedWriterDraftFallback: false,
        normalizationChanged: false,
        timing: currentTiming(),
        notes: ['Writer call failed, so roleplay_v2 fell back to direct mode.'],
      }),
    };
  }
  let writerDraft = '';
  try {
    const data = await writerCall.response.json();
    writerDraft = data?.choices?.[0]?.message?.content ?? '';
    writerMs = elapsedMs(writerStartedAt);
  } catch {
    writerMs = elapsedMs(writerStartedAt);
    return {
      ok: false,
      reason: 'writer_parse_failed',
      debugTrace: buildRoleplayDebugTrace({
        pipeline: 'roleplay_v2',
        finalPath: 'roleplay_v2_direct_fallback',
        fallbackReason: 'writer_parse_failed',
        ctx,
        lastUser,
        recentWindowCount: recent.length,
        supportingDetails,
        plannerPlan: plan,
        plannerUsedFallback,
        plannerFailureReason,
        writerDraft: '',
        validatorApproved: null,
        validatorIssues: [],
        validatorUsedRevision: false,
        validatorUsedWriterDraftFallback: false,
        normalizationChanged: false,
        timing: currentTiming(),
        notes: ['Writer response could not be parsed, so roleplay_v2 fell back to direct mode.'],
      }),
    };
  }
  if (!writerDraft.trim()) {
    return {
      ok: false,
      reason: 'writer_empty',
      debugTrace: buildRoleplayDebugTrace({
        pipeline: 'roleplay_v2',
        finalPath: 'roleplay_v2_direct_fallback',
        fallbackReason: 'writer_empty',
        ctx,
        lastUser,
        recentWindowCount: recent.length,
        supportingDetails,
        plannerPlan: plan,
        plannerUsedFallback,
        plannerFailureReason,
        writerDraft: '',
        validatorApproved: null,
        validatorIssues: [],
        validatorUsedRevision: false,
        validatorUsedWriterDraftFallback: false,
        normalizationChanged: false,
        timing: currentTiming(),
        notes: ['Writer returned empty text, so roleplay_v2 fell back to direct mode.'],
      }),
    };
  }

  let finalText = writerDraft;
  let finalPath = 'roleplay_v2_writer_draft';
  let validatorApproved: boolean | null = null;
  let validatorIssues: string[] = [];
  const validatorUsedRevision = false;
  const validatorUsedWriterDraftFallback = false;
  let validatorFailureReason: string | null = null;
  const validatorRevisedText = '';

  // ---- 3) Deterministic cleanup -------------------------------------------
  const normalizationStartedAt = performance.now();
  const preNormalizedText = finalText;
  try {
    finalText = normalizeFinalText(finalText);
  } catch (e) {
    validatorFailureReason = validatorFailureReason ?? `normalization_error:${(e as Error).message}`;
    warnLog(`[chat] normalization error -- using pre-normalized text: ${(e as Error).message}`);
  }
  const normalizationChanged = finalText !== preNormalizedText;

  const policyViolations = analyzePolicyViolations(finalText, plan);
  validatorApproved = policyViolations.length === 0;
  validatorIssues = policyViolations;
  if (normalizationChanged) {
    finalPath = 'roleplay_v2_deterministic_cleanup';
  }
  normalizationMs = elapsedMs(normalizationStartedAt);

  if (!finalText.trim()) {
    return {
      ok: false,
      reason: 'empty_after_normalize',
      debugTrace: buildRoleplayDebugTrace({
        pipeline: 'roleplay_v2',
        finalPath: 'roleplay_v2_direct_fallback',
        fallbackReason: 'empty_after_normalize',
        ctx,
        lastUser,
        recentWindowCount: recent.length,
        supportingDetails,
        plannerPlan: plan,
        plannerUsedFallback,
        plannerFailureReason,
        writerDraft,
        validatorApproved,
        validatorIssues,
        validatorUsedRevision,
        validatorUsedWriterDraftFallback,
        validatorFailureReason,
        validatorRevisedText,
        normalizationChanged,
        timing: currentTiming(),
        notes: ['Final text was empty after normalization, so roleplay_v2 fell back to direct mode.'],
      }),
    };
  }

  return {
    ok: true,
    finalText,
    debugTrace: buildRoleplayDebugTrace({
      pipeline: 'roleplay_v2',
      finalPath,
      ctx,
      lastUser,
      recentWindowCount: recent.length,
      supportingDetails,
      plannerPlan: plan,
      plannerUsedFallback,
      plannerFailureReason,
      writerDraft,
      validatorApproved,
      validatorIssues,
      validatorUsedRevision,
      validatorUsedWriterDraftFallback,
      validatorFailureReason,
      validatorRevisedText,
      normalizationChanged,
      timing: currentTiming(),
      notes: [
        'Debug trace shows Chronicle pipeline-selected context, not hidden model chain-of-thought.',
        ...(!USE_MODEL_PLANNER ? ['Planner was built locally to avoid an extra model round trip.'] : []),
        ...(policyViolations.length > 0 ? [`Deterministic policy repair check triggered: ${policyViolations.join(' | ')}`] : []),
      ],
    }),
  };
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

    const VALID_GROK_MODELS = ['grok-4-1-fast-reasoning'];
    const modelId = VALID_GROK_MODELS.includes(body.modelId) ? body.modelId : 'grok-4-1-fast-reasoning';
    if (body.modelId !== modelId) {
      warnLog(`[chat] Rejected non-Grok model "${body.modelId}", using "${modelId}"`);
    }

    if (!messages || !modelId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: messages and modelId" }),
        { status: 400, headers: { ...responseHeadersBase, "Content-Type": "application/json" } },
      );
    }

    debugLog(`[chat] pipeline=${pipeline} model=${modelId} messages=${messages.length} stream=${stream}`);

    // ---- roleplay_v2 ------------------------------------------------------
    if (pipeline === 'roleplay_v2') {
      try {
        const orchestrated = await runRoleplayV2(messages, modelId, maxTokens, roleplayContext);
        if (orchestrated.ok) {
          if (stream) {
            return streamTextAsSSE(orchestrated.finalText, modelId, {
              ...responseHeadersBase,
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
              "Connection": "keep-alive",
            }, debugTraceRequested ? orchestrated.debugTrace : null);
          }
          return jsonResponseAsCompletion(orchestrated.finalText, modelId, {
            ...responseHeadersBase, "Content-Type": "application/json",
          }, debugTraceRequested ? orchestrated.debugTrace : null);
        }
        warnLog(`[chat] roleplay_v2 unable to produce text (${orchestrated.reason}); falling back to direct mode`);
        return await handleDirect(
          messages,
          modelId,
          stream,
          maxTokens,
          responseHeadersBase,
          debugTraceRequested ? orchestrated.debugTrace : null,
        );
      } catch (e) {
        warnLog(`[chat] roleplay_v2 threw (${(e as Error).message}); falling back to direct mode`);
        const directTrace = debugTraceRequested
          ? buildDirectDebugTrace(messages, roleplayContext, `roleplay_v2_throw:${(e as Error).message}`)
          : null;
        return await handleDirect(messages, modelId, stream, maxTokens, responseHeadersBase, directTrace);
      }
    }

    // ---- direct (default + final safety net) -----------------------------
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
