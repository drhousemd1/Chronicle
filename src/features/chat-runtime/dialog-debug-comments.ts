import type { Message } from '@/types';
import {
  normalizeDialogDebugTags,
  type DialogDebugComment,
} from '@/features/chat-debug/types';
import { buildDialogDebugCommentKey } from '@/features/chat-debug/storage';

export function buildDialogDebugCommentsStorageKey(scenarioId: string, conversationId: string): string {
  return `chronicle_dialog_debug_comments_v1:${scenarioId}:${conversationId}`;
}

export function buildConversationMessageGenerationMap(messages: Message[]): Map<string, string> {
  return new Map(
    messages.map((message) => [message.id, message.generationId || message.id]),
  );
}

export function mergeDialogDebugComments(
  ...sources: Array<Record<string, DialogDebugComment>>
): Record<string, DialogDebugComment> {
  const merged = new Map<string, DialogDebugComment>();

  for (const source of sources) {
    for (const [key, comment] of Object.entries(source)) {
      const existing = merged.get(key);
      if (!existing || comment.updatedAt >= existing.updatedAt) {
        merged.set(key, comment);
      }
    }
  }

  return Object.fromEntries(merged.entries());
}

export function stripDialogDebugCommentsForMessage(
  comments: Record<string, DialogDebugComment>,
  messageId: string,
): Record<string, DialogDebugComment> {
  return Object.fromEntries(
    Object.entries(comments).filter(([, comment]) => comment.messageId !== messageId),
  );
}

export function dialogDebugCommentsEqual(
  left: Record<string, DialogDebugComment>,
  right: Record<string, DialogDebugComment>,
): boolean {
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  if (leftKeys.length !== rightKeys.length) return false;
  return leftKeys.every((key, index) => {
    if (key !== rightKeys[index]) return false;
    const leftComment = left[key];
    const rightComment = right[key];
    return JSON.stringify(leftComment) === JSON.stringify(rightComment);
  });
}

export function buildExportDialogDebugComments(
  comments: Record<string, DialogDebugComment>,
  messages: Message[],
): Record<string, DialogDebugComment> {
  return Object.fromEntries(
    messages.flatMap((message) => {
      const key = buildDialogDebugCommentKey(message.id, message.generationId);
      const comment = comments[key];
      return comment ? [[message.id, comment] as const] : [];
    }),
  );
}

function canUseLocalStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function loadDialogDebugComments(
  scenarioId: string,
  conversationId: string,
  messages: Message[],
): Record<string, DialogDebugComment> {
  if (!canUseLocalStorage()) return {};

  const generationMap = buildConversationMessageGenerationMap(messages);
  try {
    const raw = window.localStorage.getItem(buildDialogDebugCommentsStorageKey(scenarioId, conversationId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return Object.fromEntries(
      Object.entries(parsed as Record<string, DialogDebugComment>).filter(([, comment]) => (
        comment
        && typeof comment.messageId === 'string'
        && typeof comment.note === 'string'
        && (
          comment.note.trim().length > 0
          || normalizeDialogDebugTags(comment.tags).length > 0
        )
      ))
      .map(([storedKey, comment]) => {
        const messageId = typeof comment.messageId === 'string'
          ? comment.messageId
          : storedKey.split(':', 1)[0];
        const generationId = typeof comment.generationId === 'string' && comment.generationId.trim().length > 0
          ? comment.generationId
          : generationMap.get(messageId) || messageId;
        const normalized: DialogDebugComment = {
          ...comment,
          messageId,
          generationId,
          tags: normalizeDialogDebugTags(comment.tags),
          createdAt: typeof comment.createdAt === 'number' ? comment.createdAt : Date.now(),
          updatedAt: typeof comment.updatedAt === 'number'
            ? comment.updatedAt
            : (typeof comment.createdAt === 'number' ? comment.createdAt : Date.now()),
        };
        return [buildDialogDebugCommentKey(messageId, generationId), normalized] as const;
      })
    );
  } catch {
    return {};
  }
}

export function saveDialogDebugComments(
  scenarioId: string,
  conversationId: string,
  comments: Record<string, DialogDebugComment>,
): void {
  if (!canUseLocalStorage()) return;

  try {
    window.localStorage.setItem(
      buildDialogDebugCommentsStorageKey(scenarioId, conversationId),
      JSON.stringify(comments),
    );
  } catch {
    // Debug notes are local convenience data; storage failure should never break chat.
  }
}
