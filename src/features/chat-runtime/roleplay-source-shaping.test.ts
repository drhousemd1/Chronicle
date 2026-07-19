import { describe, expect, it } from 'vitest';

import { createCharacterPromptFact } from './roleplay-character-card-facts';
import { buildNormalSendResponseJob } from './roleplay-response-job';
import {
  createRoleplaySourceReceipt,
  type RoleplayDuplicateSourceMetric,
} from './roleplay-source-receipts';
import {
  buildRoleplayActiveScenePacketCandidate,
  buildRoleplayEffectiveFieldEvidence,
  buildRoleplaySourceBudgetSummary,
  linkRoleplayResponseJobSourceReceipts,
} from './roleplay-source-shaping';

const receipts = [
  createRoleplaySourceReceipt({
    surface: 'current_state',
    sourceId: 'scene-roster',
    content: 'Ashley location=Kitchen',
    authority: 'high',
    modelFacing: true,
    disposition: 'included',
    reason: 'current_scene_roster',
  }),
  createRoleplaySourceReceipt({
    surface: 'main_character_cards',
    sourceId: 'ashley-card',
    content: 'Ashley location=Old apartment',
    authority: 'low',
    modelFacing: true,
    disposition: 'included',
    reason: 'saved_card_reference',
  }),
  createRoleplaySourceReceipt({
    surface: 'player_turn',
    sourceId: 'user-1',
    content: 'I lead Ashley into the kitchen.',
    authority: 'highest',
    modelFacing: true,
    disposition: 'included',
    reason: 'response_job_lane:player_turn',
  }),
  createRoleplaySourceReceipt({
    surface: 'debug_roleplay_context',
    sourceId: 'debug-context',
    content: '{"conversationId":"conversation-1"}',
    authority: 'debug_only',
    modelFacing: false,
    disposition: 'debug_only',
    reason: 'debug_context',
  }),
];

describe('roleplay source shaping', () => {
  it('builds field evidence from existing roster, card, and user-authority owners', () => {
    const evidence = buildRoleplayEffectiveFieldEvidence({
      receipts,
      sceneRoster: [{
        characterId: 'ashley',
        name: 'Ashley',
        control: 'AI',
        role: 'Main',
        location: 'Kitchen',
        scenePosition: 'Beside the island',
      }],
      characterPromptFacts: [createCharacterPromptFact({
        characterId: 'ashley',
        characterName: 'Ashley',
        sourceField: 'background.occupation',
        sourceValue: 'Archivist',
        runtimeUse: 'stable_reference',
        authority: 'saved_card_reference',
        relevance: 'always',
        visibility: 'broad_reference',
        wordingPolicy: 'compact_fact',
        disposition: 'included',
        reason: 'stable_character_reference',
      })],
      userStateAuthorityDecisions: [{
        claim: 'The user leads Ashley into the kitchen.',
        claimType: 'voluntary_action',
        sourceMessageId: 'user-1',
        sourceRole: 'user',
        authority: 'raw_user_fact',
        modelFacingAction: 'allow_as_fact',
        reason: 'explicit_user_authorship',
      }],
    });

    expect(evidence).toEqual(expect.arrayContaining([
      expect.objectContaining({ fieldPath: 'location', valuePreview: 'Kitchen', treatment: 'selected' }),
      expect.objectContaining({ fieldPath: 'scenePosition', valuePreview: 'Beside the island' }),
      expect.objectContaining({ fieldPath: 'background.occupation', authority: 'saved_card_reference' }),
      expect.objectContaining({ fieldPath: 'user_state.voluntary_action', authority: 'raw_user_fact' }),
    ]));
  });

  it('summarizes source pressure and creates a debug-only candidate without changing full context', () => {
    const duplicateReceipts = [
      createRoleplaySourceReceipt({
        surface: 'current_state',
        sourceId: 'state-duplicate',
        content: 'Ashley is in the kitchen.',
        authority: 'high',
        modelFacing: true,
        disposition: 'included',
        reason: 'current_state',
      }),
      createRoleplaySourceReceipt({
        surface: 'main_character_cards',
        sourceId: 'card-duplicate',
        content: 'Ashley is in the kitchen.',
        authority: 'low',
        modelFacing: true,
        disposition: 'included',
        reason: 'saved_card',
      }),
      ...receipts,
    ];
    const duplicateMetric: RoleplayDuplicateSourceMetric = {
      duplicateGroup: duplicateReceipts[0].duplicateGroup!,
      receiptIds: duplicateReceipts.slice(0, 2).map((receipt) => receipt.id),
      surfaces: ['current_state', 'main_character_cards'],
      authorities: ['high', 'low'],
      dispositions: ['included'],
      modelFacingCount: 2,
      totalCount: 2,
    };
    const summary = buildRoleplaySourceBudgetSummary({
      receipts: duplicateReceipts,
      duplicateMetrics: [duplicateMetric],
    });
    const candidate = buildRoleplayActiveScenePacketCandidate({
      receipts: duplicateReceipts,
      turnNumber: 7,
    });

    expect(summary.totalReceipts).toBe(6);
    expect(summary.repeatedSourcePressureReceiptIds).toEqual(expect.arrayContaining(duplicateMetric.receiptIds));
    expect(candidate.liveShapingEnabled).toBe(false);
    expect(candidate.fullContextReceiptIds).toHaveLength(5);
    expect(candidate.includedReceiptIds).toContain(duplicateReceipts[0].id);
    expect(candidate.includedReceiptIds).not.toContain(duplicateReceipts[1].id);
    expect(candidate.omittedReceipts).toContainEqual(expect.objectContaining({
      receiptId: duplicateReceipts[1].id,
      treatment: 'omitted_by_budget',
      reason: 'duplicate_lower_authority',
    }));
    expect(candidate.omittedReceipts).toContainEqual(expect.objectContaining({
      receiptId: receipts[3].id,
      treatment: 'debug_only',
    }));
  });

  it('links receipt identities to the existing response job without changing mode or lanes', () => {
    const job = buildNormalSendResponseJob({
      conversationId: 'conversation-1',
      playerTurn: { messageId: 'user-1', text: 'I lead Ashley into the kitchen.' },
      currentStateSummary: 'Ashley is in the kitchen.',
      responseDetail: 'detailed',
    });
    const linked = linkRoleplayResponseJobSourceReceipts(job, receipts);

    expect(linked).toMatchObject({
      mode: 'normal_send',
      finalUserLanes: job.finalUserLanes,
      sourceReceiptIds: receipts.map((receipt) => receipt.id),
    });
    expect(job).not.toHaveProperty('sourceReceiptIds');
  });
});
