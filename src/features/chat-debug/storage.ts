import type { StoredChatDebugTrace, StoredChatDebugTraceMap } from './types';

const STORAGE_PREFIX = 'chronicle.chat-debug.v1';

function canUseSessionStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

function buildStorageKey(scenarioId: string, conversationId: string): string {
  return `${STORAGE_PREFIX}:${scenarioId}:${conversationId}`;
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

  nextStore[buildChatDebugTraceKey(entry.messageId, entry.generationId)] = entry;
  return nextStore;
}

export function findChatDebugTrace(
  store: StoredChatDebugTraceMap,
  messageId: string,
  generationId?: string | null,
): StoredChatDebugTrace | null {
  return store[buildChatDebugTraceKey(messageId, generationId)] || null;
}
