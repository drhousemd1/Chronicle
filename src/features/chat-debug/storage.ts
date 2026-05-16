import type { ChatDebugRequestRecord, StoredChatDebugTrace, StoredChatDebugTraceMap } from './types';

const STORAGE_PREFIX = 'chronicle.chat-debug.v1';

function canUseSessionStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

function buildStorageKey(scenarioId: string, conversationId: string): string {
  return `${STORAGE_PREFIX}:${scenarioId}:${conversationId}`;
}

export function buildDialogDebugCommentKey(messageId: string, generationId?: string | null): string {
  const stableGenerationId = generationId || messageId;
  return `${messageId}:${stableGenerationId}`;
}

export function buildChatDebugTraceKey(messageId: string, generationId?: string | null): string {
  const stableGenerationId = generationId || messageId;
  return `${messageId}:${stableGenerationId}`;
}

export function loadChatDebugTraceStore(
  scenarioId: string,
  conversationId: string,
): StoredChatDebugTraceMap {
  if (!canUseSessionStorage()) return {};

  try {
    const raw = window.sessionStorage.getItem(buildStorageKey(scenarioId, conversationId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed as StoredChatDebugTraceMap : {};
  } catch {
    return {};
  }
}

export function persistChatDebugTraceStore(
  scenarioId: string,
  conversationId: string,
  store: StoredChatDebugTraceMap,
): void {
  if (!canUseSessionStorage()) return;

  try {
    window.sessionStorage.setItem(buildStorageKey(scenarioId, conversationId), JSON.stringify(store));
  } catch {
    // Never let debug persistence break chat.
  }
}

export function upsertChatDebugTrace(
  store: StoredChatDebugTraceMap,
  entry: StoredChatDebugTrace,
): StoredChatDebugTraceMap {
  const nextStore: StoredChatDebugTraceMap = { ...store };

  for (const [key, value] of Object.entries(nextStore)) {
    if (value.messageId === entry.messageId && value.generationId !== entry.generationId) {
      delete nextStore[key];
    }
  }

  const key = buildChatDebugTraceKey(entry.messageId, entry.generationId);
  const existing = nextStore[key];
  nextStore[key] = {
    ...existing,
    ...entry,
    trace: entry.trace ?? existing?.trace ?? null,
    call1Request: entry.call1Request ?? existing?.call1Request,
    supportCalls: entry.supportCalls ?? existing?.supportCalls ?? [],
    capturedAt: entry.capturedAt || existing?.capturedAt || Date.now(),
  };
  return nextStore;
}

export function upsertChatDebugSupportCall(
  store: StoredChatDebugTraceMap,
  messageId: string,
  generationId: string | null | undefined,
  call: ChatDebugRequestRecord,
): StoredChatDebugTraceMap {
  const stableGenerationId = generationId || messageId;
  const key = buildChatDebugTraceKey(messageId, stableGenerationId);
  const existing = store[key];
  const supportCalls = [...(existing?.supportCalls || [])];
  const existingIndex = supportCalls.findIndex((entry) => entry.id === call.id);
  if (existingIndex === -1) {
    supportCalls.push(call);
  } else {
    supportCalls[existingIndex] = {
      ...supportCalls[existingIndex],
      ...call,
      requestBody: call.requestBody ?? supportCalls[existingIndex].requestBody,
      modelRequest: call.modelRequest ?? supportCalls[existingIndex].modelRequest,
      modelRequests: call.modelRequests ?? supportCalls[existingIndex].modelRequests,
      responseBody: call.responseBody ?? supportCalls[existingIndex].responseBody,
      error: call.error ?? supportCalls[existingIndex].error,
      notes: call.notes ?? supportCalls[existingIndex].notes,
    };
  }

  return {
    ...store,
    [key]: {
      messageId,
      generationId: stableGenerationId,
      capturedAt: existing?.capturedAt || Date.now(),
      trace: existing?.trace ?? null,
      call1Request: existing?.call1Request,
      supportCalls,
    },
  };
}

export function upsertChatDebugCall1Request(
  store: StoredChatDebugTraceMap,
  messageId: string,
  generationId: string | null | undefined,
  call: ChatDebugRequestRecord,
): StoredChatDebugTraceMap {
  const stableGenerationId = generationId || messageId;
  const key = buildChatDebugTraceKey(messageId, stableGenerationId);
  const existing = store[key];

  return {
    ...store,
    [key]: {
      messageId,
      generationId: stableGenerationId,
      capturedAt: existing?.capturedAt || Date.now(),
      trace: existing?.trace ?? null,
      call1Request: call,
      supportCalls: existing?.supportCalls ?? [],
    },
  };
}

export function getChatDebugRecordsForMessage(
  store: StoredChatDebugTraceMap,
  messageId: string,
  generationId?: string | null,
): StoredChatDebugTrace | null {
  return store[buildChatDebugTraceKey(messageId, generationId)] || null;
}

export function findChatDebugTrace(
  store: StoredChatDebugTraceMap,
  messageId: string,
  generationId?: string | null,
): StoredChatDebugTrace | null {
  return store[buildChatDebugTraceKey(messageId, generationId)] || null;
}
