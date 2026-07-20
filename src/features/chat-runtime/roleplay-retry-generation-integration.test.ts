import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Conversation, Memory, Message, ScenarioData } from '@/types';
import {
  appendChatReviewRetryAttempt,
  loadChatReviewRetryAttemptHistory,
  persistChatReviewRetryAttemptHistory,
} from '@/features/chat-debug/retry-history';
import { buildChatReviewHtml } from '@/features/chat-debug/review-export';
import {
  buildActiveCharacterSnapshotMap,
  buildActiveMemories,
  buildMessageGenerationMap,
} from './effective-state';
import { usePostTurnSupportQueue } from './use-post-turn-support-queue';

function assistantGeneration(generationId: string, text: string, createdAt: number): Message {
  return {
    id: 'assistant-parent',
    generationId,
    role: 'assistant',
    text,
    day: 1,
    timeOfDay: 'day',
    createdAt,
  };
}

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}

const flush = () => act(async () => {
  await Promise.resolve();
  await Promise.resolve();
});

const appData = {
  world: { core: { scenarioName: 'Retry lineage integration' }, entries: [] },
  characters: [{
    id: 'character-player',
    name: 'Player',
    nicknames: '',
    controlledBy: 'User',
    characterRole: 'Main',
  }, {
    id: 'character-ai',
    name: 'Companion',
    nicknames: '',
    controlledBy: 'AI',
    characterRole: 'Main',
  }],
  sideCharacters: [],
} as unknown as ScenarioData;

describe('Retry generation integration', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('keeps rejected delayed generations debug-only after the accepted generation replaces them', async () => {
    const attemptA = assistantGeneration('generation-a', 'Companion: The first rejected answer.', 11);
    const attemptB = assistantGeneration('generation-b', 'Companion: The second rejected answer.', 12);
    const acceptedC = assistantGeneration('generation-c', 'Companion: The accepted answer advances the scene.', 13);
    const userMessage: Message = {
      id: 'user-parent',
      generationId: 'user-generation',
      role: 'user',
      text: 'Player: Choose a different approach.',
      day: 1,
      timeOfDay: 'day',
      createdAt: 10,
    };
    let generationMap = buildMessageGenerationMap([userMessage, attemptA]);
    const delayedA = deferred();
    const delayedB = deferred();
    const lifecycle = vi.fn();
    const queueMemoryExtraction = vi.fn((
      _userText: string,
      _assistantText: string,
      sourceMessage: Message,
    ) => sourceMessage.generationId === 'generation-a' ? delayedA.promise : delayedB.promise);

    const { result } = renderHook(() => usePostTurnSupportQueue<string>({
      conversationId: 'conversation-1',
      saveNewMessages: vi.fn().mockResolvedValue(undefined),
      queueMemoryExtraction,
      evaluateGoalProgress: vi.fn().mockResolvedValue(undefined),
      evaluateGoalAlignment: vi.fn().mockResolvedValue(undefined),
      extractCharacterUpdatesFromDialogue: vi.fn().mockResolvedValue([]),
      applyExtractedUpdates: vi.fn().mockResolvedValue(undefined),
      isSourceCurrent: (sourceMessage) => generationMap.get(sourceMessage.id)
        === (sourceMessage.generationId || sourceMessage.id),
      onSupportLifecycle: lifecycle,
      logger: { error: vi.fn() },
    }));

    act(() => {
      result.current.queueAssistantDerivedWork(userMessage.text, attemptA.text, attemptA, userMessage);
    });
    await flush();

    generationMap = buildMessageGenerationMap([userMessage, attemptB]);
    act(() => {
      result.current.queueAssistantDerivedWork(userMessage.text, attemptB.text, attemptB, userMessage);
    });
    await flush();

    generationMap = buildMessageGenerationMap([userMessage, acceptedC]);
    await act(async () => {
      delayedA.resolve();
      delayedB.resolve();
      await Promise.all([delayedA.promise, delayedB.promise]);
    });
    await flush();

    for (const rejectedGeneration of ['generation-a', 'generation-b']) {
      const memoryEvents = lifecycle.mock.calls
        .map(([event]) => event)
        .filter((event) => event.worker === 'memory_extraction'
          && event.sourceMessage.generationId === rejectedGeneration);
      expect(memoryEvents.map((event) => event.lifecycle)).toEqual(['queued', 'running', 'stale']);
      expect(memoryEvents.at(-1)?.reason).toBe('source_generation_superseded_during_worker_run');
    }

    const memories = [
      { id: 'memory-a', sourceMessageId: attemptA.id, sourceGenerationId: attemptA.generationId, content: 'Rejected A' },
      { id: 'memory-b', sourceMessageId: attemptB.id, sourceGenerationId: attemptB.generationId, content: 'Rejected B' },
      { id: 'memory-c', sourceMessageId: acceptedC.id, sourceGenerationId: acceptedC.generationId, content: 'Accepted C' },
    ] as Memory[];
    expect(buildActiveMemories(memories, generationMap).map((memory) => memory.id)).toEqual(['memory-c']);

    const activeSnapshots = buildActiveCharacterSnapshotMap([{
      id: 'snapshot-a',
      conversationId: 'conversation-1',
      characterId: 'character-ai',
      sourceMessageId: attemptA.id,
      sourceGenerationId: 'generation-a',
      statePayload: { location: 'Rejected location A' },
      createdAt: 11,
    }, {
      id: 'snapshot-b',
      conversationId: 'conversation-1',
      characterId: 'character-ai',
      sourceMessageId: attemptB.id,
      sourceGenerationId: 'generation-b',
      statePayload: { location: 'Rejected location B' },
      createdAt: 12,
    }, {
      id: 'snapshot-c',
      conversationId: 'conversation-1',
      characterId: 'character-ai',
      sourceMessageId: acceptedC.id,
      sourceGenerationId: 'generation-c',
      statePayload: { location: 'Accepted location C' },
      createdAt: 13,
    }], generationMap, [userMessage, acceptedC]);
    expect(activeSnapshots.get('character-ai')?.statePayload.location).toBe('Accepted location C');

    let retryHistory = appendChatReviewRetryAttempt({}, attemptA, null, 101);
    retryHistory = appendChatReviewRetryAttempt(retryHistory, attemptB, null, 102);
    persistChatReviewRetryAttemptHistory('scenario-1', 'conversation-1', retryHistory);
    const reloadedRetryHistory = loadChatReviewRetryAttemptHistory('scenario-1', 'conversation-1');
    expect(reloadedRetryHistory['assistant-parent'].map((attempt) => attempt.generationId))
      .toEqual(['generation-a', 'generation-b']);

    const conversation: Conversation = {
      id: 'conversation-1',
      title: 'Retry integration',
      currentDay: 1,
      currentTimeOfDay: 'day',
      createdAt: 1,
      updatedAt: 13,
      messages: [userMessage, acceptedC],
    };
    const html = buildChatReviewHtml({
      appData,
      conversation,
      scenarioTitle: 'Retry integration',
      modelId: 'fixture-model',
      exportedAt: new Date('2026-07-19T00:00:00.000Z'),
      sanitizeAssistantText: (text) => text,
      retryAttemptHistory: reloadedRetryHistory,
    });

    expect(html.match(/Retry Attempt History \(2\)/g)).toHaveLength(1);
    expect(html).toContain('generation-a');
    expect(html).toContain('generation-b');
    expect(html).toContain('generation-c');
    expect(html).toContain('session_debug_only');
    expect(html).toContain('Live prompt re-entry');
    expect(html).toContain('"livePromptReentry": false');
    expect(html).toContain('The accepted answer advances the scene.');
  });
});
