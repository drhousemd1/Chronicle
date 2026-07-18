import { describe, expect, it, vi } from 'vitest';

import { persistAcceptedRoleplayMemoryCandidates } from './roleplay-memory-candidate-persistence';
import type { RoleplayMemoryCandidateReview } from './roleplay-memory-user-state-review';
import { buildCurrentTurnStateDigest } from '@/services/llm';
import { createDefaultScenarioData } from '@/utils';
import type { Memory } from '@/types';

function accepted(id: string, label: string): RoleplayMemoryCandidateReview {
  return {
    id,
    label,
    accepted: true,
    reason: 'accepted',
    durabilityCategory: 'durable_scene_or_world_fact',
    sourceClassification: 'raw_user_fact',
  };
}

describe('roleplay memory candidate persistence', () => {
  it('persists one row per accepted candidate and records each row id', async () => {
    const persistCandidate = vi.fn(async (candidate: RoleplayMemoryCandidateReview) => ({
      id: `row-${candidate.id}`,
    }));

    const result = await persistAcceptedRoleplayMemoryCandidates({
      candidates: [
        accepted('one', 'First durable fact.'),
        { ...accepted('rejected', 'Rejected fact.'), accepted: false },
        accepted('two', 'Second durable fact.'),
      ],
      isSourceCurrent: () => true,
      persistCandidate,
    });

    expect(persistCandidate).toHaveBeenCalledTimes(2);
    expect(persistCandidate.mock.calls.map(([candidate]) => candidate.label)).toEqual([
      'First durable fact.',
      'Second durable fact.',
    ]);
    expect(result.persistedTargets).toEqual(['row-one', 'row-two']);
    expect(result.outcomes).toEqual([
      expect.objectContaining({ id: 'one', persistenceStatus: 'persisted', persistenceTargetId: 'row-one' }),
      expect.objectContaining({ id: 'two', persistenceStatus: 'persisted', persistenceTargetId: 'row-two' }),
    ]);
  });

  it('records insert failures per candidate without joining or hiding later candidates', async () => {
    const persistCandidate = vi.fn(async (candidate: RoleplayMemoryCandidateReview) => {
      if (candidate.id === 'one') throw new Error('insert failed');
      return { id: `row-${candidate.id}` };
    });

    const result = await persistAcceptedRoleplayMemoryCandidates({
      candidates: [accepted('one', 'First.'), accepted('two', 'Second.')],
      isSourceCurrent: () => true,
      persistCandidate,
    });

    expect(result.failures).toEqual(['one:insert failed']);
    expect(result.persistedTargets).toEqual(['row-two']);
    expect(result.outcomes).toEqual([
      expect.objectContaining({ id: 'one', persistenceStatus: 'failed' }),
      expect.objectContaining({ id: 'two', persistenceStatus: 'persisted' }),
    ]);
  });

  it('stops new persistence after the source generation becomes stale', async () => {
    let current = true;
    const persistCandidate = vi.fn(async (candidate: RoleplayMemoryCandidateReview) => {
      current = false;
      return { id: `row-${candidate.id}` };
    });

    const result = await persistAcceptedRoleplayMemoryCandidates({
      candidates: [accepted('one', 'First.'), accepted('two', 'Second.')],
      isSourceCurrent: () => current,
      persistCandidate,
    });

    expect(persistCandidate).toHaveBeenCalledTimes(1);
    expect(result.sourceBecameStale).toBe(true);
    expect(result.outcomes).toEqual([
      expect.objectContaining({ id: 'one', persistenceStatus: 'persisted_stale' }),
      expect.objectContaining({ id: 'two', persistenceStatus: 'skipped_stale' }),
    ]);
  });

  it('allows only persisted accepted candidate text to re-enter the next prompt', async () => {
    const persistedMemories: Memory[] = [];
    const rejected: RoleplayMemoryCandidateReview = {
      ...accepted('rejected', 'Assistant-only interpretation must stay debug-only.'),
      accepted: false,
      reason: 'assistant_interpretation',
    };

    await persistAcceptedRoleplayMemoryCandidates({
      candidates: [accepted('accepted', 'Mara promised to protect the map.'), rejected],
      isSourceCurrent: () => true,
      persistCandidate: async (candidate) => {
        const memory: Memory = {
          id: `row-${candidate.id}`,
          conversationId: 'conversation-1',
          content: candidate.label,
          day: 1,
          timeOfDay: 'night',
          source: 'message',
          sourceMessageId: 'assistant-1',
          sourceGenerationId: 'generation-1',
          entryType: 'bullet',
          createdAt: 1,
          updatedAt: 1,
        };
        persistedMemories.push(memory);
        return memory;
      },
    });

    const digest = buildCurrentTurnStateDigest({
      appData: createDefaultScenarioData(),
      currentDay: 1,
      currentTimeOfDay: 'night',
      memories: persistedMemories,
      memoriesEnabled: true,
    });

    expect(digest).toContain('Mara promised to protect the map.');
    expect(digest).not.toContain('Assistant-only interpretation must stay debug-only.');
    expect(digest).not.toContain('assistant_interpretation');
  });
});
