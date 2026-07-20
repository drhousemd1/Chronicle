import type { Message, TimeOfDay } from '@/types';
import type { StoredChatDebugTrace } from './types';

export type ChatReviewRetryAttempt = {
  messageId: string;
  generationId: string;
  attemptNumber: number;
  capturedAt: number;
  text: string;
  day?: number;
  timeOfDay?: TimeOfDay;
  createdAt: number;
  debugRecord?: StoredChatDebugTrace | null;
};

export type ChatReviewRetryAttemptHistory = Record<string, ChatReviewRetryAttempt[]>;

export type ChatReviewRetryLineage = {
  parentMessageId: string;
  finalGenerationId: string;
  attempts: ChatReviewRetryAttempt[];
  childSegmentIds: string[];
  storageScope: 'session_debug_only';
  livePromptReentry: false;
};

const RETRY_HISTORY_STORAGE_PREFIX = 'chronicle.chat-review-retry-history.v1';

function canUseSessionStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

export function buildChatReviewRetryHistoryStorageKey(
  scenarioId: string,
  conversationId: string,
): string {
  return `${RETRY_HISTORY_STORAGE_PREFIX}:${scenarioId}:${conversationId}`;
}

function parseRetryAttempt(value: unknown, parentMessageId: string): ChatReviewRetryAttempt | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<ChatReviewRetryAttempt>;
  if (
    candidate.messageId !== parentMessageId
    || typeof candidate.generationId !== 'string'
    || !candidate.generationId.trim()
    || typeof candidate.text !== 'string'
    || typeof candidate.attemptNumber !== 'number'
    || !Number.isInteger(candidate.attemptNumber)
    || candidate.attemptNumber < 1
    || typeof candidate.capturedAt !== 'number'
    || !Number.isFinite(candidate.capturedAt)
    || typeof candidate.createdAt !== 'number'
    || !Number.isFinite(candidate.createdAt)
  ) {
    return null;
  }
  if (candidate.day !== undefined && (typeof candidate.day !== 'number' || !Number.isFinite(candidate.day))) {
    return null;
  }
  if (candidate.timeOfDay !== undefined && !['sunrise', 'day', 'sunset', 'night'].includes(candidate.timeOfDay)) {
    return null;
  }
  if (candidate.debugRecord !== undefined && candidate.debugRecord !== null && typeof candidate.debugRecord !== 'object') {
    return null;
  }

  return {
    messageId: parentMessageId,
    generationId: candidate.generationId,
    attemptNumber: candidate.attemptNumber,
    capturedAt: candidate.capturedAt,
    text: candidate.text,
    day: candidate.day,
    timeOfDay: candidate.timeOfDay,
    createdAt: candidate.createdAt,
    debugRecord: candidate.debugRecord as StoredChatDebugTrace | null | undefined,
  };
}

export function loadChatReviewRetryAttemptHistory(
  scenarioId: string,
  conversationId: string,
): ChatReviewRetryAttemptHistory {
  if (!canUseSessionStorage()) return {};

  try {
    const raw = window.sessionStorage.getItem(
      buildChatReviewRetryHistoryStorageKey(scenarioId, conversationId),
    );
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>)
        .flatMap(([parentMessageId, attempts]) => {
          if (!parentMessageId || !Array.isArray(attempts)) return [];
          const seenGenerations = new Set<string>();
          const validAttempts = attempts
            .map((attempt) => parseRetryAttempt(attempt, parentMessageId))
            .filter((attempt): attempt is ChatReviewRetryAttempt => {
              if (!attempt || seenGenerations.has(attempt.generationId)) return false;
              seenGenerations.add(attempt.generationId);
              return true;
            })
            .sort((left, right) => (
              left.attemptNumber - right.attemptNumber
              || left.capturedAt - right.capturedAt
            ));
          return validAttempts.length > 0 ? [[parentMessageId, validAttempts] as const] : [];
        }),
    );
  } catch {
    return {};
  }
}

export function persistChatReviewRetryAttemptHistory(
  scenarioId: string,
  conversationId: string,
  history: ChatReviewRetryAttemptHistory,
): void {
  if (!canUseSessionStorage()) return;

  try {
    window.sessionStorage.setItem(
      buildChatReviewRetryHistoryStorageKey(scenarioId, conversationId),
      JSON.stringify(history),
    );
  } catch {
    // Debug persistence must never interrupt roleplay.
  }
}

export function buildChatReviewRetryLineage(input: {
  history: ChatReviewRetryAttemptHistory;
  parentMessageId: string;
  finalGenerationId: string;
  childSegmentIds: string[];
}): ChatReviewRetryLineage | null {
  const attempts = [...(input.history[input.parentMessageId] || [])].sort((left, right) => (
    left.attemptNumber - right.attemptNumber
    || left.capturedAt - right.capturedAt
  ));
  if (attempts.length === 0) return null;

  return {
    parentMessageId: input.parentMessageId,
    finalGenerationId: input.finalGenerationId,
    attempts,
    childSegmentIds: [...input.childSegmentIds],
    storageScope: 'session_debug_only',
    livePromptReentry: false,
  };
}

export function appendChatReviewRetryAttempt(
  history: ChatReviewRetryAttemptHistory,
  message: Message,
  debugRecord: StoredChatDebugTrace | null = null,
  capturedAt: number = Date.now(),
): ChatReviewRetryAttemptHistory {
  const existingAttempts = history[message.id] || [];
  const generationId = message.generationId || message.id;
  if (existingAttempts.some((attempt) => attempt.generationId === generationId)) {
    return history;
  }

  return {
    ...history,
    [message.id]: [
      ...existingAttempts,
      {
        messageId: message.id,
        generationId,
        attemptNumber: existingAttempts.length + 1,
        capturedAt,
        text: message.text,
        day: message.day,
        timeOfDay: message.timeOfDay,
        createdAt: message.createdAt,
        debugRecord,
      },
    ],
  };
}
