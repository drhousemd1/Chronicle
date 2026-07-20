import { describe, expect, it } from 'vitest';
import type {
  CharacterStateMessageSnapshot,
  Memory,
  Message,
  SideCharacterMessageSnapshot,
  StoryGoalStepDerivation,
} from '@/types';
import {
  buildRoleplayAssistantOutcomeRecords,
  renderRoleplayAssistantOutcomeRecord,
} from './roleplay-assistant-outcome';

const assistantMessage: Message = {
  id: 'assistant-1',
  generationId: 'generation-1',
  role: 'assistant',
  text: 'Distinctive old prose must not become the outcome.',
  createdAt: 1,
};

function mainSnapshot(overrides: Partial<CharacterStateMessageSnapshot> = {}): CharacterStateMessageSnapshot {
  return {
    id: 'main-snapshot-1',
    conversationId: 'conversation-1',
    characterId: 'character-1',
    sourceMessageId: 'assistant-1',
    sourceGenerationId: 'generation-1',
    sourceRole: 'assistant',
    statePayload: {
      location: 'Kitchen',
      _fieldChangeMetadata: {
        location: {
          fieldPath: 'location',
          storyDay: 1,
          timeOfDay: 'day',
          sourceMessageId: 'assistant-1',
          sourceGenerationId: 'generation-1',
          updatedAt: 2,
          nextValuePreview: 'Kitchen',
        },
      },
    },
    createdAt: 2,
    ...overrides,
  };
}

function sideSnapshot(): SideCharacterMessageSnapshot {
  return {
    id: 'side-snapshot-1',
    conversationId: 'conversation-1',
    sideCharacterId: 'side-1',
    sourceMessageId: 'assistant-1',
    sourceGenerationId: 'generation-1',
    sourceRole: 'assistant',
    statePayload: {
      scenePosition: 'Beside the counter',
      _fieldChangeMetadata: {
        scenePosition: {
          fieldPath: 'scenePosition',
          storyDay: 1,
          timeOfDay: 'day',
          sourceMessageId: 'assistant-1',
          sourceGenerationId: 'generation-1',
          updatedAt: 2,
          nextValuePreview: 'Beside the counter',
        },
      },
    },
    createdAt: 2,
  };
}

function memory(overrides: Partial<Memory> = {}): Memory {
  return {
    id: 'memory-1',
    conversationId: 'conversation-1',
    content: 'Mara agreed to wait in the kitchen.',
    day: 1,
    timeOfDay: 'day',
    source: 'message',
    entryType: 'bullet',
    sourceMessageId: 'assistant-1',
    sourceGenerationId: 'generation-1',
    createdAt: 2,
    updatedAt: 2,
    ...overrides,
  };
}

const goalDerivation: StoryGoalStepDerivation = {
  id: 'goal-derivation-1',
  conversationId: 'conversation-1',
  goalId: 'goal-1',
  stepId: 'step-1',
  sourceMessageId: 'assistant-1',
  sourceGenerationId: 'generation-1',
  completed: true,
  day: 1,
  timeOfDay: 'day',
  createdAt: 2,
};

describe('roleplay assistant outcome compiler', () => {
  it('projects only generation-matched persisted artifacts into a typed outcome', () => {
    const [record] = buildRoleplayAssistantOutcomeRecords({
      messages: [assistantMessage],
      characterSnapshots: [mainSnapshot()],
      sideCharacterSnapshots: [sideSnapshot()],
      memories: [memory()],
      goalStepDerivations: [goalDerivation],
      mainCharacterNames: new Map([['character-1', 'Mara']]),
      sideCharacterNames: new Map([['side-1', 'Iris']]),
      storyGoals: [{
        id: 'goal-1',
        title: 'Reach an agreement',
        desiredOutcome: 'They agree.',
        currentStatus: '',
        flexibility: 'normal',
        steps: [{ id: 'step-1', description: 'Mara agrees to wait.', completed: false }],
        createdAt: 1,
        updatedAt: 1,
      }],
    });

    expect(record.facts.map((fact) => fact.content)).toEqual([
      'Mara.location: Kitchen',
      'Iris.scenePosition: Beside the counter',
      'Mara agreed to wait in the kitchen.',
      'Reach an agreement: Mara agrees to wait.',
    ]);
    expect(record.categoryStatus.every((status) => status.availability === 'available')).toBe(true);
    const rendered = renderRoleplayAssistantOutcomeRecord(record);
    expect(rendered).toContain('[OLDER ASSISTANT OUTCOME]');
    expect(rendered).not.toContain(assistantMessage.text);
  });

  it('does not project stale, lineage-free, incomplete, or interpretive artifacts', () => {
    const staleSnapshot = mainSnapshot({ sourceGenerationId: 'generation-old' });
    const [record] = buildRoleplayAssistantOutcomeRecords({
      messages: [assistantMessage],
      characterSnapshots: [staleSnapshot],
      memories: [memory({ sourceGenerationId: undefined })],
      goalStepDerivations: [{ ...goalDerivation, completed: false }],
      userStateAuthorityDecisions: [
        {
          claim: 'Mara assumes the user is nervous.',
          claimType: 'emotion',
          sourceMessageId: 'assistant-1',
          sourceGenerationId: 'generation-1',
          sourceRole: 'assistant',
          evidenceBasis: 'in_character_interpretation',
          authority: 'assistant_interpretation',
          modelFacingAction: 'allow_as_character_interpretation',
          reason: 'user_owned_state_requires_user_authorship',
        },
      ],
    });

    expect(record.facts).toEqual([]);
    expect(record.categoryStatus.find((status) => status.category === 'character_state')).toMatchObject({
      availability: 'stale',
    });
    expect(record.categoryStatus.find((status) => status.category === 'memory')).toMatchObject({
      availability: 'unsupported',
    });
    expect(record.authoritySummary.excludedInterpretationCount).toBe(1);
    expect(renderRoleplayAssistantOutcomeRecord(record)).toBeNull();
  });

  it('uses support completion only to distinguish none from unknown, never to invent a fact', () => {
    const [record] = buildRoleplayAssistantOutcomeRecords({
      messages: [assistantMessage],
      supportReviewEnvelopes: [{
        contract: 'RoleplaySupportReviewEnvelope',
        version: 2,
        worker: 'memory_extraction',
        sourceMessageId: 'assistant-1',
        sourceGenerationId: 'generation-1',
        accepted: [],
        rejected: [],
        omitted: [],
        persistence: { status: 'no_updates', targets: [], reason: 'no_candidates' },
        readiness: 'no_updates',
        futurePromptImpact: { eligible: false, targets: [], reason: 'no_candidates' },
        contextGaps: [],
      }],
    });

    expect(record.facts).toEqual([]);
    expect(record.categoryStatus.find((status) => status.category === 'memory')).toMatchObject({
      availability: 'none',
      reason: 'support_worker_no_updates',
    });
    expect(record.categoryStatus.find((status) => status.category === 'goal_step')).toMatchObject({
      availability: 'pending_or_unknown',
    });
  });
});
