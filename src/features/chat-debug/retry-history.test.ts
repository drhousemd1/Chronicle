import { describe, expect, it } from 'vitest';
import type { Message } from '@/types';
import {
  appendChatReviewRetryAttempt,
  buildChatReviewRetryLineage,
} from './retry-history';

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

  it('builds one final-parent lineage with explicit debug-only scope', () => {
    const history = {
      'message-ai-1': [
        {
          messageId: 'message-ai-1',
          generationId: 'generation-retry-2',
          attemptNumber: 2,
          capturedAt: 2000,
          text: 'Second replaced response.',
          createdAt: 200,
        },
        {
          messageId: 'message-ai-1',
          generationId: 'generation-original',
          attemptNumber: 1,
          capturedAt: 1000,
          text: 'First replaced response.',
          createdAt: 100,
        },
      ],
    };

    expect(buildChatReviewRetryLineage({
      history,
      parentMessageId: 'message-ai-1',
      finalGenerationId: 'generation-final',
      childSegmentIds: ['message-ai-1-0', 'message-ai-1-1'],
    })).toEqual({
      parentMessageId: 'message-ai-1',
      finalGenerationId: 'generation-final',
      attempts: [history['message-ai-1'][1], history['message-ai-1'][0]],
      childSegmentIds: ['message-ai-1-0', 'message-ai-1-1'],
      storageScope: 'session_debug_only',
      livePromptReentry: false,
    });
  });

  it('does not create lineage for a parent with no replaced attempts', () => {
    expect(buildChatReviewRetryLineage({
      history: {},
      parentMessageId: 'message-ai-1',
      finalGenerationId: 'generation-final',
      childSegmentIds: ['message-ai-1-0'],
    })).toBeNull();
  });
});
