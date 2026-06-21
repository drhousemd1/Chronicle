import { describe, expect, it } from 'vitest';
import type { Message } from '@/types';
import { appendChatReviewRetryAttempt } from './retry-history';

describe('appendChatReviewRetryAttempt', () => {
  it('appends replaced assistant generations without mutating existing history', () => {
    const firstMessage = {
      id: 'message-ai-1',
      generationId: 'generation-original',
      role: 'assistant',
      text: 'Ashley: "Original response."',
      day: 1,
      timeOfDay: 'night',
      createdAt: 100,
    } as Message;
    const secondMessage = {
      ...firstMessage,
      generationId: 'generation-retry-1',
      text: 'Ashley: "First retry response."',
      createdAt: 200,
    };
    const debugRecord = {
      messageId: 'message-ai-1',
      generationId: 'generation-original',
      capturedAt: 1000,
      trace: null,
      supportCalls: [],
    };

    const firstHistory = appendChatReviewRetryAttempt({}, firstMessage, debugRecord, 1000);
    const secondHistory = appendChatReviewRetryAttempt(firstHistory, secondMessage, null, 2000);

    expect(firstHistory['message-ai-1']).toHaveLength(1);
    expect(secondHistory['message-ai-1']).toHaveLength(2);
    expect(secondHistory['message-ai-1'][0]).toMatchObject({
      generationId: 'generation-original',
      attemptNumber: 1,
      text: 'Ashley: "Original response."',
      debugRecord,
    });
    expect(secondHistory['message-ai-1'][1]).toMatchObject({
      generationId: 'generation-retry-1',
      attemptNumber: 2,
      text: 'Ashley: "First retry response."',
      debugRecord: null,
    });
  });
});
