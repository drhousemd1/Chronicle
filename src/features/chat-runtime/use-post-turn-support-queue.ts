import { useCallback, useRef } from 'react';

import type { Message } from '@/types';

export interface PostTurnExtractionMeta {
  sourceMessageId?: string;
  sourceMessageGenerationId?: string;
  sourceUserMessageId?: string;
  reason: 'post_turn_state_sync';
}

export interface UsePostTurnSupportQueueOptions<TCharacterUpdate, TApplyResult = void> {
  conversationId: string;
  saveNewMessages: (conversationId: string, messages: Message[]) => Promise<unknown>;
  queueMemoryExtraction: (
    userText: string,
    aiText: string,
    sourceMessage: Message,
    sourceUserMessage?: Message,
  ) => void;
  evaluateGoalProgress: (
    userText: string,
    aiText: string,
    sourceMessageId?: string,
    sourceGenerationId?: string,
  ) => Promise<void>;
  evaluateGoalAlignment: (
    userText: string,
    aiText: string,
    sourceMessageId?: string,
    sourceGenerationId?: string,
  ) => Promise<void>;
  extractCharacterUpdatesFromDialogue: (
    userText: string,
    aiText: string,
    meta: PostTurnExtractionMeta,
  ) => Promise<TCharacterUpdate[]>;
  applyExtractedUpdates: (
    updates: TCharacterUpdate[],
    meta: PostTurnExtractionMeta,
  ) => Promise<TApplyResult> | TApplyResult;
  debugLog?: (...args: unknown[]) => void;
  logger?: Pick<Console, 'error'>;
}

type PersistResult =
  | { ok: true }
  | { ok: false; error: unknown };

type LatestPostTurnOptions<TCharacterUpdate, TApplyResult> = Required<
  Omit<UsePostTurnSupportQueueOptions<TCharacterUpdate, TApplyResult>, 'debugLog'>
> & {
  debugLog?: (...args: unknown[]) => void;
};

export function usePostTurnSupportQueue<TCharacterUpdate, TApplyResult = void>({
  conversationId,
  saveNewMessages,
  queueMemoryExtraction,
  evaluateGoalProgress,
  evaluateGoalAlignment,
  extractCharacterUpdatesFromDialogue,
  applyExtractedUpdates,
  debugLog,
  logger = console,
}: UsePostTurnSupportQueueOptions<TCharacterUpdate, TApplyResult>) {
  const latestOptionsRef = useRef<LatestPostTurnOptions<TCharacterUpdate, TApplyResult>>({
    conversationId,
    saveNewMessages,
    queueMemoryExtraction,
    evaluateGoalProgress,
    evaluateGoalAlignment,
    extractCharacterUpdatesFromDialogue,
    applyExtractedUpdates,
    debugLog,
    logger,
  });
  latestOptionsRef.current = {
    conversationId,
    saveNewMessages,
    queueMemoryExtraction,
    evaluateGoalProgress,
    evaluateGoalAlignment,
    extractCharacterUpdatesFromDialogue,
    applyExtractedUpdates,
    debugLog,
    logger,
  };
  const optionsByConversationRef = useRef(new Map<string, LatestPostTurnOptions<TCharacterUpdate, TApplyResult>>());
  optionsByConversationRef.current.set(conversationId, latestOptionsRef.current);
  const sourcePersistQueueRef = useRef<Promise<void>>(Promise.resolve());
  const goalAlignmentEvalQueueRef = useRef<Promise<void>>(Promise.resolve());
  const characterStateSyncQueueRef = useRef<Promise<void>>(Promise.resolve());

  const getOptionsForConversation = useCallback((sourceConversationId: string) => {
    return optionsByConversationRef.current.get(sourceConversationId);
  }, []);

  const runCharacterStateSync = useCallback(async (
    sourceConversationId: string,
    userText: string,
    aiText: string,
    sourceMessage: Message,
    sourceUserMessage?: Message,
  ) => {
    const extractionMeta: PostTurnExtractionMeta = {
      sourceMessageId: sourceMessage.id,
      sourceMessageGenerationId: sourceMessage.generationId,
      ...(sourceUserMessage?.id ? { sourceUserMessageId: sourceUserMessage.id } : {}),
      reason: 'post_turn_state_sync',
    };

    const latest = getOptionsForConversation(sourceConversationId);
    if (!latest) {
      latestOptionsRef.current.logger.error(
        '[queueAssistantDerivedWork] Skipped character extraction because the source conversation is no longer available:',
        sourceConversationId,
      );
      return;
    }
    const updates = await latest.extractCharacterUpdatesFromDialogue(userText, aiText, extractionMeta);
    if (updates.length === 0) return;

    latest.debugLog?.(
      `[queueAssistantDerivedWork] Extracted ${updates.length} character updates (${extractionMeta.reason})`,
      updates,
    );
    await latest.applyExtractedUpdates(updates, extractionMeta);
  }, [getOptionsForConversation]);

  const queueAssistantDerivedWorkForConversation = useCallback((
    sourceConversationId: string,
    userText: string,
    aiText: string,
    sourceMessage: Message,
    sourceUserMessage?: Message,
  ) => {
    const latest = getOptionsForConversation(sourceConversationId);
    if (!latest) {
      latestOptionsRef.current.logger.error(
        '[queueAssistantDerivedWork] Skipped derived work because the source conversation is no longer available:',
        sourceConversationId,
      );
      return;
    }
    if (sourceUserMessage) {
      latest.queueMemoryExtraction(userText, aiText, sourceMessage, sourceUserMessage);
    } else {
      latest.queueMemoryExtraction(userText, aiText, sourceMessage);
    }

    latest.evaluateGoalProgress(
      userText,
      aiText,
      sourceMessage.id,
      sourceMessage.generationId,
    ).catch(err => {
      latestOptionsRef.current.logger.error('[queueAssistantDerivedWork] Goal progress evaluation failed:', err);
    });

    goalAlignmentEvalQueueRef.current = goalAlignmentEvalQueueRef.current
      .catch(() => undefined)
      .then(() => {
        const conversationOptions = getOptionsForConversation(sourceConversationId);
        if (!conversationOptions) {
          latestOptionsRef.current.logger.error(
            '[queueAssistantDerivedWork] Skipped goal alignment because the source conversation is no longer available:',
            sourceConversationId,
          );
          return undefined;
        }
        return conversationOptions.evaluateGoalAlignment(
          userText,
          aiText,
          sourceMessage.id,
          sourceMessage.generationId,
        );
      })
      .catch(err => {
        latestOptionsRef.current.logger.error('[queueAssistantDerivedWork] Goal alignment evaluation failed:', err);
      });
    void goalAlignmentEvalQueueRef.current;

    characterStateSyncQueueRef.current = characterStateSyncQueueRef.current
      .catch(() => undefined)
      .then(() => runCharacterStateSync(
        sourceConversationId,
        userText,
        aiText,
        sourceMessage,
        sourceUserMessage,
      ))
      .catch(err => {
        latestOptionsRef.current.logger.error('[queueAssistantDerivedWork] Character extraction failed:', err);
      });
    void characterStateSyncQueueRef.current;
  }, [getOptionsForConversation, runCharacterStateSync]);

  const queueAssistantDerivedWork = useCallback((
    userText: string,
    aiText: string,
    sourceMessage: Message,
    sourceUserMessage?: Message,
  ) => {
    queueAssistantDerivedWorkForConversation(
      latestOptionsRef.current.conversationId,
      userText,
      aiText,
      sourceMessage,
      sourceUserMessage,
    );
  }, [queueAssistantDerivedWorkForConversation]);

  const queueAssistantDerivedWorkAfterSourcePersist = useCallback((
    messagesToPersist: Message[],
    userText: string,
    aiText: string,
    sourceMessage: Message,
    sourceUserMessage?: Message,
  ) => {
    const sourceConversationId = latestOptionsRef.current.conversationId;
    const sourceOptions = getOptionsForConversation(sourceConversationId);
    if (!sourceOptions) {
      latestOptionsRef.current.logger.error(
        '[queueAssistantDerivedWork] Skipped source persistence because the source conversation is no longer available:',
        sourceConversationId,
      );
      return;
    }

    const persistResultPromise: Promise<PersistResult> = sourceOptions.saveNewMessages(sourceConversationId, messagesToPersist)
      .then(() => ({ ok: true as const }))
      .catch((error) => ({ ok: false as const, error }));

    sourcePersistQueueRef.current = sourcePersistQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        const persistResult = await persistResultPromise;
        if (!persistResult.ok) {
          latestOptionsRef.current.logger.error(
            '[queueAssistantDerivedWork] Skipped derived work because source messages failed to persist:',
            persistResult.error,
          );
          return;
        }
        queueAssistantDerivedWorkForConversation(
          sourceConversationId,
          userText,
          aiText,
          sourceMessage,
          sourceUserMessage,
        );
      });
    void sourcePersistQueueRef.current;
  }, [getOptionsForConversation, queueAssistantDerivedWorkForConversation]);

  return {
    queueAssistantDerivedWork,
    queueAssistantDerivedWorkAfterSourcePersist,
  };
}
