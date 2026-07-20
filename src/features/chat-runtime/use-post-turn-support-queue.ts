import { useCallback, useRef } from 'react';

import type { Message } from '@/types';
import type {
  RoleplaySupportWorker,
} from './roleplay-support-review-envelope';
import type {
  SupportCallLifecycle,
} from './roleplay-support-readiness';
import { projectPlayerTurnVisibility } from './player-turn-visibility';

export interface PostTurnExtractionMeta {
  sourceMessageId?: string;
  sourceMessageGenerationId?: string;
  sourceUserMessageId?: string;
  sourceUserMessageGenerationId?: string;
  reason: 'post_turn_state_sync';
}

export interface PostTurnSupportLifecycleEvent {
  worker: RoleplaySupportWorker;
  lifecycle: SupportCallLifecycle;
  sourceMessage: Message;
  sourceUserMessage?: Message;
  reason: string;
  error?: unknown;
}

export interface UsePostTurnSupportQueueOptions<TCharacterUpdate, TApplyResult = void> {
  conversationId: string;
  saveNewMessages: (conversationId: string, messages: Message[]) => Promise<unknown>;
  queueMemoryExtraction: (
    userText: string,
    aiText: string,
    sourceMessage: Message,
    sourceUserMessage?: Message,
  ) => void | Promise<void>;
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
  isSourceCurrent?: (sourceMessage: Message) => boolean;
  onSupportLifecycle?: (event: PostTurnSupportLifecycleEvent) => void;
  debugLog?: (...args: unknown[]) => void;
  logger?: Pick<Console, 'error'>;
}

type PersistResult =
  | { ok: true }
  | { ok: false; error: unknown };

type LatestPostTurnOptions<TCharacterUpdate, TApplyResult> = Required<
  Omit<
    UsePostTurnSupportQueueOptions<TCharacterUpdate, TApplyResult>,
    'debugLog' | 'isSourceCurrent' | 'onSupportLifecycle'
  >
> & {
  debugLog?: (...args: unknown[]) => void;
  isSourceCurrent?: (sourceMessage: Message) => boolean;
  onSupportLifecycle?: (event: PostTurnSupportLifecycleEvent) => void;
};

export function usePostTurnSupportQueue<TCharacterUpdate, TApplyResult = void>({
  conversationId,
  saveNewMessages,
  queueMemoryExtraction,
  evaluateGoalProgress,
  evaluateGoalAlignment,
  extractCharacterUpdatesFromDialogue,
  applyExtractedUpdates,
  isSourceCurrent,
  onSupportLifecycle,
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
    isSourceCurrent,
    onSupportLifecycle,
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
    isSourceCurrent,
    onSupportLifecycle,
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

  const emitSupportLifecycle = useCallback((
    sourceConversationId: string,
    event: PostTurnSupportLifecycleEvent,
  ) => {
    getOptionsForConversation(sourceConversationId)?.onSupportLifecycle?.(event);
  }, [getOptionsForConversation]);

  const runSupportWorker = useCallback(async (
    sourceConversationId: string,
    worker: RoleplaySupportWorker,
    sourceMessage: Message,
    sourceUserMessage: Message | undefined,
    work: () => void | Promise<void>,
  ) => {
    const sourceOptions = getOptionsForConversation(sourceConversationId);
    if (sourceOptions?.isSourceCurrent && !sourceOptions.isSourceCurrent(sourceMessage)) {
      emitSupportLifecycle(sourceConversationId, {
        worker,
        lifecycle: 'stale',
        sourceMessage,
        sourceUserMessage,
        reason: 'source_generation_superseded_before_worker_start',
      });
      return;
    }
    emitSupportLifecycle(sourceConversationId, {
      worker,
      lifecycle: 'running',
      sourceMessage,
      sourceUserMessage,
      reason: 'support_worker_started',
    });
    try {
      await work();
      const completedOptions = getOptionsForConversation(sourceConversationId);
      if (completedOptions?.isSourceCurrent && !completedOptions.isSourceCurrent(sourceMessage)) {
        emitSupportLifecycle(sourceConversationId, {
          worker,
          lifecycle: 'stale',
          sourceMessage,
          sourceUserMessage,
          reason: 'source_generation_superseded_during_worker_run',
        });
        return;
      }
      emitSupportLifecycle(sourceConversationId, {
        worker,
        lifecycle: 'completed',
        sourceMessage,
        sourceUserMessage,
        reason: 'support_worker_completed',
      });
    } catch (error) {
      emitSupportLifecycle(sourceConversationId, {
        worker,
        lifecycle: 'failed',
        sourceMessage,
        sourceUserMessage,
        reason: 'support_worker_failed',
        error,
      });
      throw error;
    }
  }, [emitSupportLifecycle, getOptionsForConversation]);

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
      ...(sourceUserMessage?.generationId
        ? { sourceUserMessageGenerationId: sourceUserMessage.generationId }
        : {}),
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
    const visibleUserText = projectPlayerTurnVisibility(
      userText,
      sourceUserMessage?.id,
    ).visibleText;
    const workerSourceUserMessage = sourceUserMessage
      ? { ...sourceUserMessage, text: visibleUserText }
      : undefined;
    const queuedWorkers: RoleplaySupportWorker[] = [
      'memory_extraction',
      'goal_progress',
      'goal_alignment',
      'character_state',
    ];
    queuedWorkers.forEach((worker) => emitSupportLifecycle(sourceConversationId, {
      worker,
      lifecycle: 'queued',
      sourceMessage,
      sourceUserMessage,
      reason: 'queued_after_source_message_persisted',
    }));

    void runSupportWorker(
      sourceConversationId,
      'memory_extraction',
      sourceMessage,
      sourceUserMessage,
      () => workerSourceUserMessage
        ? latest.queueMemoryExtraction(visibleUserText, aiText, sourceMessage, workerSourceUserMessage)
        : latest.queueMemoryExtraction(visibleUserText, aiText, sourceMessage),
    ).catch(err => {
      latestOptionsRef.current.logger.error('[queueAssistantDerivedWork] Memory extraction failed:', err);
    });

    void runSupportWorker(
      sourceConversationId,
      'goal_progress',
      sourceMessage,
      sourceUserMessage,
      () => latest.evaluateGoalProgress(
        visibleUserText,
        aiText,
        sourceMessage.id,
        sourceMessage.generationId,
      ),
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
        return runSupportWorker(
          sourceConversationId,
          'goal_alignment',
          sourceMessage,
          sourceUserMessage,
          () => conversationOptions.evaluateGoalAlignment(
            visibleUserText,
            aiText,
            sourceMessage.id,
            sourceMessage.generationId,
          ),
        );
      })
      .catch(err => {
        latestOptionsRef.current.logger.error('[queueAssistantDerivedWork] Goal alignment evaluation failed:', err);
      });
    void goalAlignmentEvalQueueRef.current;

    characterStateSyncQueueRef.current = characterStateSyncQueueRef.current
      .catch(() => undefined)
      .then(() => runSupportWorker(
        sourceConversationId,
        'character_state',
        sourceMessage,
        sourceUserMessage,
        () => runCharacterStateSync(
          sourceConversationId,
          visibleUserText,
          aiText,
          sourceMessage,
          sourceUserMessage,
        ),
      ))
      .catch(err => {
        latestOptionsRef.current.logger.error('[queueAssistantDerivedWork] Character extraction failed:', err);
      });
    void characterStateSyncQueueRef.current;
  }, [emitSupportLifecycle, getOptionsForConversation, runCharacterStateSync, runSupportWorker]);

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

    sourcePersistQueueRef.current = sourcePersistQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        const persistResult: PersistResult = await sourceOptions
          .saveNewMessages(sourceConversationId, messagesToPersist)
          .then(() => ({ ok: true as const }))
          .catch((error) => ({ ok: false as const, error }));
        if (!persistResult.ok) {
          latestOptionsRef.current.logger.error(
            '[queueAssistantDerivedWork] Skipped derived work because source messages failed to persist:',
            persistResult.error,
          );
          const sourceOptionsForFailure = getOptionsForConversation(sourceConversationId);
          const skippedWorkers: RoleplaySupportWorker[] = [
            'memory_extraction',
            'goal_progress',
            'goal_alignment',
            'character_state',
          ];
          skippedWorkers.forEach((worker) => sourceOptionsForFailure?.onSupportLifecycle?.({
            worker,
            lifecycle: 'skipped',
            sourceMessage,
            sourceUserMessage,
            reason: 'source_message_persistence_failed',
            error: persistResult.error,
          }));
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
