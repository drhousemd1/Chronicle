import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ChatDebugRequestRecord, ChatDebugTrace, StoredChatDebugTraceMap } from '@/features/chat-debug/types';
import { useChatDebugTrace } from './use-chat-debug-trace';

function readOnlyStoredDebugRecord(): StoredChatDebugTraceMap {
  expect(window.sessionStorage.length).toBe(1);
  const key = window.sessionStorage.key(0);
  expect(key).toBeTruthy();
  return JSON.parse(window.sessionStorage.getItem(key!) || '{}') as StoredChatDebugTraceMap;
}

const call1Request = (): ChatDebugRequestRecord => ({
  id: 'call-1',
  label: 'API Call 1',
  apiCallGroup: 'call_1',
  endpoint: '/functions/v1/chat',
  method: 'POST',
  capturedAt: 10,
  status: 'completed',
  requestBody: { prompt: 'redacted' },
});

describe('useChatDebugTrace', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-12T21:00:00.000Z'));
  });

  afterEach(() => {
    window.sessionStorage.clear();
    vi.useRealTimers();
  });

  it('does not persist debug traces or support calls for non-admin users', () => {
    const { result } = renderHook(() => useChatDebugTrace({
      scenarioId: 'scenario-1',
      conversationId: 'conversation-1',
      isAdmin: false,
    }));

    act(() => {
      result.current.saveChatDebugTrace({ id: 'message-1', generationId: 'generation-1' }, null, call1Request());
      result.current.recordChatDebugSupportCall(
        { id: 'message-1', generationId: 'generation-1' },
        {
          id: 'support-1',
          label: 'Support',
          apiCallGroup: 'support',
          endpoint: '/functions/v1/extract',
          method: 'POST',
          capturedAt: 20,
          status: 'sent',
          requestBody: { ok: true },
        },
      );
    });

    expect(window.sessionStorage.length).toBe(0);
    expect(result.current.chatDebugTraceStoreRef.current).toEqual({});
  });

  it('persists call 1 debug data and enriches it from the model trace', () => {
    const { result } = renderHook(() => useChatDebugTrace({
      scenarioId: 'scenario-1',
      conversationId: 'conversation-1',
      isAdmin: true,
    }));
    const trace = {
      modelRequest: {
        endpoint: 'https://api.x.ai/v1/responses',
        requestBody: { store: false },
      },
      modelRequests: [
        {
          label: 'Primary',
          endpoint: 'https://api.x.ai/v1/responses',
          requestBody: { store: false },
        },
      ],
    } as ChatDebugTrace;

    act(() => {
      result.current.saveChatDebugTrace(
        { id: 'message-1', generationId: 'generation-1' },
        trace,
        call1Request(),
      );
    });

    const stored = readOnlyStoredDebugRecord();
    expect(stored['message-1:generation-1']).toMatchObject({
      messageId: 'message-1',
      generationId: 'generation-1',
      trace,
      call1Request: {
        id: 'call-1',
        modelRequest: trace.modelRequest,
        modelRequests: trace.modelRequests,
      },
    });
  });

  it('merges repeated support-call updates without losing the original request body', () => {
    const { result } = renderHook(() => useChatDebugTrace({
      scenarioId: 'scenario-1',
      conversationId: 'conversation-1',
      isAdmin: true,
    }));
    const message = { id: 'message-1', generationId: 'generation-1' };

    act(() => {
      result.current.recordChatDebugSupportCall(message, {
        id: 'support-1',
        label: 'Support',
        apiCallGroup: 'support',
        endpoint: '/functions/v1/extract-character-updates',
        method: 'POST',
        capturedAt: 20,
        status: 'sent',
        requestBody: { input: 'first payload' },
      });
      result.current.recordChatDebugSupportCall(message, {
        id: 'support-1',
        label: 'Support',
        apiCallGroup: 'support',
        endpoint: '/functions/v1/extract-character-updates',
        method: 'POST',
        capturedAt: 25,
        status: 'completed',
        requestBody: undefined as unknown,
        responseBody: { updates: [] },
      });
    });

    const stored = readOnlyStoredDebugRecord();
    expect(stored['message-1:generation-1'].supportCalls).toEqual([
      expect.objectContaining({
        id: 'support-1',
        status: 'completed',
        requestBody: { input: 'first payload' },
        responseBody: { updates: [] },
      }),
    ]);
  });
});
