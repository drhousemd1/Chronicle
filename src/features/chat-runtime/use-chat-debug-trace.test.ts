import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ChatDebugRequestRecord, ChatDebugTrace, StoredChatDebugTraceMap } from '@/features/chat-debug/types';
import {
  createPendingRoleplaySupportReviewEnvelope,
  createRoleplaySupportReviewEnvelope,
} from './roleplay-support-review-envelope';
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
  roleplaySourceReceipts: [
    {
      id: 'player_turn:player_turn:fnv1a-12345678',
      packetVersion: 'roleplay-source-packet-v1',
      surface: 'player_turn',
      sourceClass: 'player_turn',
      sourceId: 'player_turn',
      textHash: 'fnv1a-12345678',
      authority: 'highest',
      modelFacing: true,
      disposition: 'included',
      transformation: 'exact',
      duplicateGroup: 'exact:fnv1a-12345678',
      reason: 'response_job_lane:player_turn',
      contentLength: 14,
      preview: 'I step closer.',
    },
  ],
  roleplayDuplicateSourceMetrics: [
    {
      duplicateGroup: 'exact:fnv1a-12345678',
      receiptIds: ['player_turn:player_turn:fnv1a-12345678'],
      surfaces: ['player_turn'],
      authorities: ['highest'],
      dispositions: ['included'],
      modelFacingCount: 1,
      totalCount: 1,
    },
  ],
  roleplaySourceReceiptCoverage: [
    {
      receiptId: 'player_turn:player_turn:fnv1a-12345678',
      surface: 'player_turn',
      status: 'covered',
      providerMessageIndexes: [1],
      reason: 'receipt_preview_found_in_rendered_provider_message',
    },
  ],
  roleplayProviderSectionCoverage: [
    {
      providerSectionId: 'final-user-lane:player_turn',
      expectedSurface: 'player_turn',
      status: 'covered',
      receiptIds: ['player_turn:player_turn:fnv1a-12345678'],
    },
  ],
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
        roleplaySourceReceipts: expect.arrayContaining([
          expect.objectContaining({ id: 'player_turn:player_turn:fnv1a-12345678' }),
        ]),
        roleplayDuplicateSourceMetrics: call1Request().roleplayDuplicateSourceMetrics,
        roleplaySourceReceiptCoverage: call1Request().roleplaySourceReceiptCoverage,
        roleplayProviderSectionCoverage: call1Request().roleplayProviderSectionCoverage,
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
        roleplaySupportReviewEnvelope: createPendingRoleplaySupportReviewEnvelope({
          worker: 'character_state',
          sourceMessageId: 'message-1',
          sourceGenerationId: 'generation-1',
        }),
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
        roleplaySupportReviewEnvelope: createRoleplaySupportReviewEnvelope({
          worker: 'character_state',
          sourceMessageId: 'message-1',
          sourceGenerationId: 'generation-1',
          persistence: {
            status: 'no_updates',
            targets: [],
            reason: 'no_persistable_updates',
          },
          readiness: 'no_updates',
          futurePromptImpact: {
            eligible: false,
            targets: [],
            reason: 'no_eligible_persisted_output',
          },
        }),
      });
    });

    const stored = readOnlyStoredDebugRecord();
    expect(stored['message-1:generation-1'].supportCalls).toEqual([
      expect.objectContaining({
        id: 'support-1',
        status: 'completed',
        requestBody: { input: 'first payload' },
        responseBody: { updates: [] },
        roleplaySupportReviewEnvelope: expect.objectContaining({
          worker: 'character_state',
          sourceMessageId: 'message-1',
          sourceGenerationId: 'generation-1',
          readiness: 'no_updates',
          persistence: expect.objectContaining({ status: 'no_updates' }),
        }),
      }),
    ]);
  });
});
