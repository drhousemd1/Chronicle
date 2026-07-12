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
