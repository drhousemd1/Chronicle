import { describe, expect, it } from 'vitest';

import { createRoleplaySupportReviewEnvelope } from './roleplay-support-review-envelope';
import { deriveRoleplaySupportReviewRows } from './roleplay-support-review-projections';

describe('support review projections', () => {
  it('derives registry and re-entry rows only from accepted persisted outcomes', () => {
    const rows = deriveRoleplaySupportReviewRows(createRoleplaySupportReviewEnvelope({
      worker: 'memory_extraction',
      sourceMessageId: 'assistant-1',
      sourceGenerationId: 'generation-1',
      accepted: [{ id: 'memory-1', label: 'Durable memory', reason: 'accepted' }],
      rejected: [{ id: 'memory-2', label: 'Temporary detail', reason: 'not_durable' }],
      persistence: {
        status: 'persisted',
        targets: ['memory-row-1'],
        reason: 'memory_row_created',
      },
      readiness: 'completed',
      futurePromptImpact: {
        eligible: true,
        targets: ['memory'],
        reason: 'accepted_output_persisted_for_future_prompt_use',
      },
    }));

    expect(rows.registry).toMatchObject({
      worker: 'memory_extraction',
      readiness: 'completed',
      persistence: 'persisted',
      futurePromptEligible: true,
      acceptedCount: 1,
      rejectedCount: 1,
    });
    expect(rows.reentry).toEqual([expect.objectContaining({
      target: 'memory',
      acceptedItemIds: ['memory-1'],
      persistenceTargets: ['memory-row-1'],
    })]);
  });

  it('excludes accepted candidates whose individual persistence failed from re-entry', () => {
    const rows = deriveRoleplaySupportReviewRows(createRoleplaySupportReviewEnvelope({
      worker: 'memory_extraction',
      accepted: [
        { id: 'memory-1', label: 'Persisted memory', reason: 'accepted', persistenceStatus: 'persisted' },
        { id: 'memory-2', label: 'Failed memory', reason: 'accepted', persistenceStatus: 'failed' },
      ],
      persistence: { status: 'persisted', targets: ['memory-row-1'], reason: 'partial_success' },
      readiness: 'completed',
      futurePromptImpact: {
        eligible: true,
        targets: ['memory'],
        reason: 'accepted_output_persisted_for_future_prompt_use',
      },
    }));

    expect(rows.registry.futurePromptEligible).toBe(true);
    expect(rows.reentry[0]?.acceptedItemIds).toEqual(['memory-1']);
  });

  it.each([
    ['pending persistence', 'pending', true],
    ['stale output', 'skipped_stale', true],
    ['failed persistence', 'failed', true],
    ['debug-only output', 'debug_only', true],
    ['explicitly ineligible output', 'persisted', false],
  ] as const)('excludes %s from future-prompt re-entry', (_label, persistence, eligible) => {
    const rows = deriveRoleplaySupportReviewRows(createRoleplaySupportReviewEnvelope({
      worker: persistence === 'debug_only' ? 'goal_alignment' : 'goal_progress',
      accepted: [{ id: 'result-1', label: 'Reviewed result', reason: 'accepted' }],
      persistence: { status: persistence, targets: [], reason: persistence },
      readiness: persistence === 'skipped_stale' ? 'skipped_stale' : 'completed',
      futurePromptImpact: {
        eligible,
        targets: persistence === 'debug_only' ? [] : ['goal_state'],
        reason: 'test_boundary',
      },
    }));

    expect(rows.registry.futurePromptEligible).toBe(false);
    expect(rows.reentry).toEqual([]);
  });

  it('projects context gaps without adding them to prompt re-entry', () => {
    const rows = deriveRoleplaySupportReviewRows(createRoleplaySupportReviewEnvelope({
      worker: 'character_state',
      sourceMessageId: 'assistant-2',
      sourceGenerationId: 'generation-old',
      persistence: { status: 'skipped_stale', targets: [], reason: 'superseded' },
      readiness: 'skipped_stale',
      futurePromptImpact: { eligible: false, targets: [], reason: 'superseded' },
      contextGaps: ['Character state was not updated because the generation was superseded.'],
    }));

    expect(rows.contextGaps).toEqual([{
      worker: 'character_state',
      sourceMessageId: 'assistant-2',
      sourceGenerationId: 'generation-old',
      message: 'Character state was not updated because the generation was superseded.',
    }]);
    expect(rows.reentry).toEqual([]);
  });

  it('rejects a contradictory deserialized stale envelope even when it claims eligibility', () => {
    const rows = deriveRoleplaySupportReviewRows({
      contract: 'RoleplaySupportReviewEnvelope',
      version: 2,
      worker: 'memory_extraction',
      accepted: [{ id: 'memory-1', label: 'Stale result', reason: 'accepted' }],
      rejected: [],
      omitted: [],
      persistence: { status: 'persisted', targets: ['memory-row-1'], reason: 'persisted' },
      readiness: 'skipped_stale',
      futurePromptImpact: { eligible: true, targets: ['memory'], reason: 'invalid_external_claim' },
      contextGaps: [],
    });

    expect(rows.registry.futurePromptEligible).toBe(false);
    expect(rows.reentry).toEqual([]);
  });
});
