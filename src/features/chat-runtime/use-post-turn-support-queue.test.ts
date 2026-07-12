import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { Message } from '@/types';
import { usePostTurnSupportQueue, type PostTurnExtractionMeta } from './use-post-turn-support-queue';

const message = (patch: Partial<Message> = {}): Message => ({
  id: patch.id || 'assistant-1',
  generationId: patch.generationId || 'generation-1',
  role: patch.role || 'assistant',
  text: patch.text || 'assistant text',
  createdAt: patch.createdAt ?? 1,
});

function deferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const flush = () => act(async () => {
  await Promise.resolve();
});

function renderQueue(overrides: Partial<Parameters<typeof usePostTurnSupportQueue<string>>[0]> = {}) {
  const saveNewMessages = vi.fn().mockResolvedValue(undefined);
  const queueMemoryExtraction = vi.fn();
  const evaluateGoalProgress = vi.fn().mockResolvedValue(undefined);
  const evaluateGoalAlignment = vi.fn().mockResolvedValue(undefined);
  const extractCharacterUpdatesFromDialogue = vi.fn().mockResolvedValue([] as string[]);
  const applyExtractedUpdates = vi.fn().mockResolvedValue(undefined);
  const debugLog = vi.fn();
  const logger = { error: vi.fn() };

  const options = {
    conversationId: 'conversation-1',
    saveNewMessages,
    queueMemoryExtraction,
    evaluateGoalProgress,
    evaluateGoalAlignment,
    extractCharacterUpdatesFromDialogue,
    applyExtractedUpdates,
    debugLog,
    logger,
    ...overrides,
  };

  const hook = renderHook(() => usePostTurnSupportQueue<string>(options));
  return { hook, options };
}

describe('usePostTurnSupportQueue', () => {
  it('does not run derived work until the assistant source message has persisted', async () => {
    const save = deferred();
    const { hook, options } = renderQueue({
      saveNewMessages: vi.fn().mockReturnValue(save.promise),
    });
    const source = message();

    act(() => {
      hook.result.current.queueAssistantDerivedWorkAfterSourcePersist([source], 'user', 'assistant', source);
    });

    expect(options.saveNewMessages).toHaveBeenCalledWith('conversation-1', [source]);
    expect(options.queueMemoryExtraction).not.toHaveBeenCalled();
    expect(options.evaluateGoalProgress).not.toHaveBeenCalled();
    expect(options.evaluateGoalAlignment).not.toHaveBeenCalled();
    expect(options.extractCharacterUpdatesFromDialogue).not.toHaveBeenCalled();

    await act(async () => {
      save.resolve();
      await save.promise;
    });
    await flush();

    expect(options.queueMemoryExtraction).toHaveBeenCalledWith('user', 'assistant', source);
    expect(options.evaluateGoalProgress).toHaveBeenCalledWith('user', 'assistant', source.id, source.generationId);
    expect(options.evaluateGoalAlignment).toHaveBeenCalledWith('user', 'assistant', source.id, source.generationId);
    expect(options.extractCharacterUpdatesFromDialogue).toHaveBeenCalledWith('user', 'assistant', {
      sourceMessageId: source.id,
      sourceMessageGenerationId: source.generationId,
      reason: 'post_turn_state_sync',
    });
  });

  it('forwards the exact user source message to memory review after persistence', async () => {
    const { hook, options } = renderQueue();
    const assistantSource = message();
    const userSource = message({
      id: 'user-1',
      generationId: 'user-generation-1',
      role: 'user',
      text: 'user text',
    });

    act(() => {
      hook.result.current.queueAssistantDerivedWorkAfterSourcePersist(
        [assistantSource],
        userSource.text,
        assistantSource.text,
        assistantSource,
        userSource,
      );
    });
    await flush();

    expect(options.queueMemoryExtraction).toHaveBeenCalledWith(
      userSource.text,
      assistantSource.text,
      assistantSource,
      userSource,
    );
    expect(options.extractCharacterUpdatesFromDialogue).toHaveBeenCalledWith(
      userSource.text,
      assistantSource.text,
      {
        sourceMessageId: assistantSource.id,
        sourceMessageGenerationId: assistantSource.generationId,
        sourceUserMessageId: userSource.id,
        reason: 'post_turn_state_sync',
      },
    );
  });

  it('skips derived work when source persistence fails', async () => {
    const save = deferred();
    const { hook, options } = renderQueue({
      saveNewMessages: vi.fn().mockReturnValue(save.promise),
    });

    act(() => {
      hook.result.current.queueAssistantDerivedWorkAfterSourcePersist([message()], 'user', 'assistant', message());
    });

    await act(async () => {
      save.reject(new Error('database down'));
      await save.promise.catch(() => undefined);
    });
    await flush();

    expect(options.queueMemoryExtraction).not.toHaveBeenCalled();
    expect(options.evaluateGoalProgress).not.toHaveBeenCalled();
    expect(options.evaluateGoalAlignment).not.toHaveBeenCalled();
    expect(options.extractCharacterUpdatesFromDialogue).not.toHaveBeenCalled();
    expect(options.logger.error).toHaveBeenCalledWith(
      '[queueAssistantDerivedWork] Skipped derived work because source messages failed to persist:',
      expect.any(Error),
    );
  });

  it('preserves queued turn order when source-message persistence resolves out of order', async () => {
    const firstSave = deferred();
    const secondSave = deferred();
    const events: string[] = [];
    const { hook, options } = renderQueue({
      saveNewMessages: vi.fn()
        .mockReturnValueOnce(firstSave.promise)
        .mockReturnValueOnce(secondSave.promise),
      queueMemoryExtraction: vi.fn((userText: string) => {
        events.push(`memory:${userText}`);
      }),
      evaluateGoalProgress: vi.fn(async (userText: string) => {
        events.push(`progress:${userText}`);
      }),
      evaluateGoalAlignment: vi.fn(async (userText: string) => {
        events.push(`alignment:${userText}`);
      }),
      extractCharacterUpdatesFromDialogue: vi.fn(async (userText: string) => {
        events.push(`extract:${userText}`);
        return [];
      }),
    });
    const first = message({ id: 'assistant-1', generationId: 'generation-1' });
    const second = message({ id: 'assistant-2', generationId: 'generation-2' });

    act(() => {
      hook.result.current.queueAssistantDerivedWorkAfterSourcePersist([first], 'user-1', 'assistant-1', first);
      hook.result.current.queueAssistantDerivedWorkAfterSourcePersist([second], 'user-2', 'assistant-2', second);
    });

    await act(async () => {
      secondSave.resolve();
      await secondSave.promise;
    });
    await flush();

    expect(events).toEqual([]);

    await act(async () => {
      firstSave.resolve();
      await firstSave.promise;
    });
    await flush();

    await flush();

    expect(events).toEqual([
      'memory:user-1',
      'progress:user-1',
      'alignment:user-1',
      'extract:user-1',
      'memory:user-2',
      'progress:user-2',
      'alignment:user-2',
      'extract:user-2',
    ]);
    expect(options.saveNewMessages).toHaveBeenNthCalledWith(1, 'conversation-1', [first]);
    expect(options.saveNewMessages).toHaveBeenNthCalledWith(2, 'conversation-1', [second]);
  });

  it('serializes goal alignment evaluation while leaving memory and progress fan-out immediate', async () => {
    const firstAlignment = deferred();
    const starts: string[] = [];
    const { hook, options } = renderQueue({
      evaluateGoalAlignment: vi.fn((userText: string) => {
        starts.push(`alignment:${userText}`);
        return userText === 'user-1' ? firstAlignment.promise : Promise.resolve();
      }),
    });
    const first = message({ id: 'assistant-1', generationId: 'generation-1' });
    const second = message({ id: 'assistant-2', generationId: 'generation-2' });

    act(() => {
      hook.result.current.queueAssistantDerivedWork('user-1', 'assistant-1', first);
      hook.result.current.queueAssistantDerivedWork('user-2', 'assistant-2', second);
    });
    await flush();

    expect(options.queueMemoryExtraction).toHaveBeenCalledTimes(2);
    expect(options.evaluateGoalProgress).toHaveBeenCalledTimes(2);
    expect(starts).toEqual(['alignment:user-1']);

    await act(async () => {
      firstAlignment.resolve();
      await firstAlignment.promise;
    });
    await flush();

    expect(starts).toEqual(['alignment:user-1', 'alignment:user-2']);
  });

  it('serializes character extraction and waits for extracted updates to finish applying', async () => {
    const firstApply = deferred();
    const events: string[] = [];
    const { hook, options } = renderQueue({
      extractCharacterUpdatesFromDialogue: vi.fn(async (userText: string, _aiText: string, meta: PostTurnExtractionMeta) => {
        events.push(`extract:${userText}:${meta.sourceMessageId}:${meta.sourceMessageGenerationId}`);
        return [`update-${userText}`];
      }),
      applyExtractedUpdates: vi.fn((updates: string[], meta: PostTurnExtractionMeta) => {
        events.push(`apply:${updates[0]}:${meta.sourceMessageId}:${meta.sourceMessageGenerationId}`);
        return updates[0] === 'update-user-1' ? firstApply.promise : Promise.resolve();
      }),
    });
    const first = message({ id: 'assistant-1', generationId: 'generation-1' });
    const second = message({ id: 'assistant-2', generationId: 'generation-2' });

    act(() => {
      hook.result.current.queueAssistantDerivedWork('user-1', 'assistant-1', first);
      hook.result.current.queueAssistantDerivedWork('user-2', 'assistant-2', second);
    });
    await flush();

    expect(events).toEqual([
      'extract:user-1:assistant-1:generation-1',
      'apply:update-user-1:assistant-1:generation-1',
    ]);
    expect(options.applyExtractedUpdates).toHaveBeenCalledTimes(1);

    await act(async () => {
      firstApply.resolve();
      await firstApply.promise;
    });
    await flush();

    expect(events).toEqual([
      'extract:user-1:assistant-1:generation-1',
      'apply:update-user-1:assistant-1:generation-1',
      'extract:user-2:assistant-2:generation-2',
      'apply:update-user-2:assistant-2:generation-2',
    ]);
    expect(options.applyExtractedUpdates).toHaveBeenCalledTimes(2);
  });

  it('uses the latest character extraction callback when a queued task starts after rerender', async () => {
    const firstApply = deferred();
    const events: string[] = [];
    const extractBeforeRerender = vi.fn(async (userText: string) => {
      events.push(`extract-before:${userText}`);
      return [`update-${userText}`];
    });
    const extractAfterRerender = vi.fn(async (userText: string) => {
      events.push(`extract-after:${userText}`);
      return [`update-${userText}`];
    });
    const applyExtractedUpdates = vi.fn((updates: string[]) => {
      events.push(`apply:${updates[0]}`);
      return updates[0] === 'update-user-1' ? firstApply.promise : Promise.resolve();
    });
    const baseOptions = {
      conversationId: 'conversation-1',
      saveNewMessages: vi.fn().mockResolvedValue(undefined),
      queueMemoryExtraction: vi.fn(),
      evaluateGoalProgress: vi.fn().mockResolvedValue(undefined),
      evaluateGoalAlignment: vi.fn().mockResolvedValue(undefined),
      applyExtractedUpdates,
      debugLog: vi.fn(),
      logger: { error: vi.fn() },
    };
    const { result, rerender } = renderHook(
      ({ extractCharacterUpdatesFromDialogue }) => usePostTurnSupportQueue<string>({
        ...baseOptions,
        extractCharacterUpdatesFromDialogue,
      }),
      { initialProps: { extractCharacterUpdatesFromDialogue: extractBeforeRerender } },
    );
    const first = message({ id: 'assistant-1', generationId: 'generation-1' });
    const second = message({ id: 'assistant-2', generationId: 'generation-2' });

    act(() => {
      result.current.queueAssistantDerivedWork('user-1', 'assistant-1', first);
      result.current.queueAssistantDerivedWork('user-2', 'assistant-2', second);
    });
    await flush();

    rerender({ extractCharacterUpdatesFromDialogue: extractAfterRerender });

    await act(async () => {
      firstApply.resolve();
      await firstApply.promise;
    });
    await flush();

    expect(events).toEqual([
      'extract-before:user-1',
      'apply:update-user-1',
      'extract-after:user-2',
      'apply:update-user-2',
    ]);
    expect(extractBeforeRerender).toHaveBeenCalledTimes(1);
    expect(extractAfterRerender).toHaveBeenCalledTimes(1);
  });

  it('does not route queued source-persisted work through a later conversation rerender', async () => {
    const save = deferred();
    const firstConversationMemory = vi.fn();
    const secondConversationMemory = vi.fn();
    const firstConversationExtract = vi.fn().mockResolvedValue([]);
    const secondConversationExtract = vi.fn().mockResolvedValue([]);
    const sharedOptions = {
      saveNewMessages: vi.fn().mockReturnValue(save.promise),
      evaluateGoalProgress: vi.fn().mockResolvedValue(undefined),
      evaluateGoalAlignment: vi.fn().mockResolvedValue(undefined),
      applyExtractedUpdates: vi.fn().mockResolvedValue(undefined),
      debugLog: vi.fn(),
      logger: { error: vi.fn() },
    };
    const { result, rerender } = renderHook(
      ({ conversationId, queueMemoryExtraction, extractCharacterUpdatesFromDialogue }) => usePostTurnSupportQueue<string>({
        ...sharedOptions,
        conversationId,
        queueMemoryExtraction,
        extractCharacterUpdatesFromDialogue,
      }),
      {
        initialProps: {
          conversationId: 'conversation-1',
          queueMemoryExtraction: firstConversationMemory,
          extractCharacterUpdatesFromDialogue: firstConversationExtract,
        },
      },
    );
    const source = message({ id: 'assistant-1', generationId: 'generation-1' });

    act(() => {
      result.current.queueAssistantDerivedWorkAfterSourcePersist([source], 'user-1', 'assistant-1', source);
    });

    rerender({
      conversationId: 'conversation-2',
      queueMemoryExtraction: secondConversationMemory,
      extractCharacterUpdatesFromDialogue: secondConversationExtract,
    });

    await act(async () => {
      save.resolve();
      await save.promise;
    });
    await flush();

    expect(sharedOptions.saveNewMessages).toHaveBeenCalledWith('conversation-1', [source]);
    expect(firstConversationMemory).toHaveBeenCalledWith('user-1', 'assistant-1', source);
    expect(firstConversationExtract).toHaveBeenCalledWith('user-1', 'assistant-1', {
      sourceMessageId: source.id,
      sourceMessageGenerationId: source.generationId,
      reason: 'post_turn_state_sync',
    });
    expect(secondConversationMemory).not.toHaveBeenCalled();
    expect(secondConversationExtract).not.toHaveBeenCalled();
  });

  it('does not apply character updates when extraction returns no accepted updates', async () => {
    const { hook, options } = renderQueue({
      extractCharacterUpdatesFromDialogue: vi.fn().mockResolvedValue([]),
    });

    act(() => {
      hook.result.current.queueAssistantDerivedWork('user', 'assistant', message());
    });
    await flush();

    expect(options.applyExtractedUpdates).not.toHaveBeenCalled();
    expect(options.debugLog).not.toHaveBeenCalledWith(expect.stringContaining('Extracted'));
  });

  it('keeps goal alignment queue moving after one alignment call rejects', async () => {
    const events: string[] = [];
    const alignmentError = new Error('alignment unavailable');
    const { hook, options } = renderQueue({
      evaluateGoalAlignment: vi.fn(async (userText: string) => {
        events.push(`alignment:${userText}`);
        if (userText === 'user-1') throw alignmentError;
      }),
    });
    const first = message({ id: 'assistant-1', generationId: 'generation-1' });
    const second = message({ id: 'assistant-2', generationId: 'generation-2' });

    act(() => {
      hook.result.current.queueAssistantDerivedWork('user-1', 'assistant-1', first);
      hook.result.current.queueAssistantDerivedWork('user-2', 'assistant-2', second);
    });
    await flush();
    await flush();

    expect(events).toEqual(['alignment:user-1', 'alignment:user-2']);
    expect(options.logger.error).toHaveBeenCalledWith(
      '[queueAssistantDerivedWork] Goal alignment evaluation failed:',
      alignmentError,
    );
  });

  it('keeps character extraction queue moving after one extraction call rejects', async () => {
    const events: string[] = [];
    const extractionError = new Error('extractor unavailable');
    const { hook, options } = renderQueue({
      extractCharacterUpdatesFromDialogue: vi.fn(async (userText: string) => {
        events.push(`extract:${userText}`);
        if (userText === 'user-1') throw extractionError;
        return [`update-${userText}`];
      }),
      applyExtractedUpdates: vi.fn((updates: string[]) => {
        events.push(`apply:${updates[0]}`);
        return Promise.resolve();
      }),
    });
    const first = message({ id: 'assistant-1', generationId: 'generation-1' });
    const second = message({ id: 'assistant-2', generationId: 'generation-2' });

    act(() => {
      hook.result.current.queueAssistantDerivedWork('user-1', 'assistant-1', first);
      hook.result.current.queueAssistantDerivedWork('user-2', 'assistant-2', second);
    });
    await flush();
    await flush();

    expect(events).toEqual(['extract:user-1', 'extract:user-2', 'apply:update-user-2']);
    expect(options.applyExtractedUpdates).toHaveBeenCalledTimes(1);
    expect(options.logger.error).toHaveBeenCalledWith(
      '[queueAssistantDerivedWork] Character extraction failed:',
      extractionError,
    );
  });

  it('logs goal progress failure without blocking alignment or character sync', async () => {
    const events: string[] = [];
    const progressError = new Error('progress unavailable');
    const { hook, options } = renderQueue({
      evaluateGoalProgress: vi.fn(async () => {
        throw progressError;
      }),
      evaluateGoalAlignment: vi.fn(async () => {
        events.push('alignment');
      }),
      extractCharacterUpdatesFromDialogue: vi.fn(async () => {
        events.push('extract');
        return [];
      }),
    });

    act(() => {
      hook.result.current.queueAssistantDerivedWork('user', 'assistant', message());
    });
    await flush();
    await flush();

    expect(events).toEqual(['alignment', 'extract']);
    expect(options.logger.error).toHaveBeenCalledWith(
      '[queueAssistantDerivedWork] Goal progress evaluation failed:',
      progressError,
    );
  });
});
