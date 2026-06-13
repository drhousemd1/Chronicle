import { useCallback, useEffect, useRef } from 'react';

import type { Message } from '@/types';
import {
  loadChatDebugTraceStore,
  persistChatDebugTraceStore,
  upsertChatDebugSupportCall,
  upsertChatDebugTrace,
} from '@/features/chat-debug/storage';
import type {
  ChatDebugRequestRecord,
  ChatDebugTrace,
  StoredChatDebugTraceMap,
} from '@/features/chat-debug/types';

export type UseChatDebugTraceArgs = {
  scenarioId: string;
  conversationId: string;
  isAdmin: boolean;
};

export function useChatDebugTrace({
  scenarioId,
  conversationId,
  isAdmin,
}: UseChatDebugTraceArgs) {
  const chatDebugTraceStoreRef = useRef<StoredChatDebugTraceMap>(
    loadChatDebugTraceStore(scenarioId, conversationId),
  );

  useEffect(() => {
    chatDebugTraceStoreRef.current = loadChatDebugTraceStore(scenarioId, conversationId);
  }, [conversationId, scenarioId]);

  const saveChatDebugTrace = useCallback((
    message: Pick<Message, 'id' | 'generationId'>,
    trace: ChatDebugTrace | null,
    call1Request?: ChatDebugRequestRecord | null,
  ) => {
    if (!isAdmin || (!trace && !call1Request)) return;

    const generationId = message.generationId || message.id;
    const enrichedCall1Request = call1Request && trace?.modelRequest
      ? {
          ...call1Request,
          modelRequest: trace.modelRequest,
          modelRequests: trace.modelRequests || call1Request.modelRequests,
        }
      : call1Request;
    const nextStore = upsertChatDebugTrace(chatDebugTraceStoreRef.current, {
      messageId: message.id,
      generationId,
      capturedAt: Date.now(),
      trace,
      call1Request: enrichedCall1Request || undefined,
    });

    chatDebugTraceStoreRef.current = nextStore;
    persistChatDebugTraceStore(scenarioId, conversationId, nextStore);
  }, [conversationId, isAdmin, scenarioId]);

  const recordChatDebugSupportCall = useCallback((
    message: Pick<Message, 'id' | 'generationId'> | null | undefined,
    call: ChatDebugRequestRecord,
  ) => {
    if (!isAdmin || !message?.id) return;

    const nextStore = upsertChatDebugSupportCall(
      chatDebugTraceStoreRef.current,
      message.id,
      message.generationId || message.id,
      call,
    );

    chatDebugTraceStoreRef.current = nextStore;
    persistChatDebugTraceStore(scenarioId, conversationId, nextStore);
  }, [conversationId, isAdmin, scenarioId]);

  return {
    chatDebugTraceStoreRef,
    saveChatDebugTrace,
    recordChatDebugSupportCall,
  };
}
