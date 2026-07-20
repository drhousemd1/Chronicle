import { describe, expect, it } from 'vitest';

import { createCharacterPromptFact } from './roleplay-character-card-facts';
import { buildNormalSendResponseJob } from './roleplay-response-job';
import {
  createRoleplaySourceCandidate,
  createRoleplaySourceReceipt,
  type RoleplayDuplicateSourceMetric,
  type RoleplaySourceReceipt,
} from './roleplay-source-receipts';
import {
  applyRoleplaySourceSelectionToReceipts,
  buildRoleplayActiveScenePacketCandidate,
  buildRoleplayEffectiveFieldEvidence,
  buildRoleplaySelectedProviderPacket,
  buildRoleplaySourceBudgetSummary,
  linkRoleplayResponseJobSourceReceipts,
  resolveRoleplaySourceRefreshReason,
  selectRoleplaySources,
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
  it('resolves refresh reasons from explicit requests, state resets, source edits, scene changes, and periodic turns', () => {
    const stable = { sourceFingerprint: 'source-a', sceneFingerprint: 'scene-a' };

    expect(resolveRoleplaySourceRefreshReason({
      playerTurnCount: 1,
      current: stable,
    })).toBe('first_turn');
    expect(resolveRoleplaySourceRefreshReason({
      playerTurnCount: 3,
      current: stable,
    })).toBe('state_reset');
    expect(resolveRoleplaySourceRefreshReason({
      playerTurnCount: 3,
      current: stable,
      previous: stable,
      requestedReason: 'safety_refresh',
    })).toBe('safety_refresh');
    expect(resolveRoleplaySourceRefreshReason({
      playerTurnCount: 3,
      current: { ...stable, sceneFingerprint: 'scene-b' },
      previous: stable,
    })).toBe('scene_change');
    expect(resolveRoleplaySourceRefreshReason({
      playerTurnCount: 3,
      current: { ...stable, sourceFingerprint: 'source-b' },
      previous: stable,
    })).toBe('source_edited');
    expect(resolveRoleplaySourceRefreshReason({
      playerTurnCount: 12,
      current: stable,
      previous: stable,
    })).toBe('periodic_turn_count');
    expect(resolveRoleplaySourceRefreshReason({
      playerTurnCount: 5,
      current: stable,
      previous: stable,
    })).toBe('routine_turn');
  });

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
        sourceSurface: 'main_character_cards',
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

  it('links each card fact only to its owning model-facing card surface', () => {
    const sideReceipt = createRoleplaySourceReceipt({
      surface: 'side_character_cards',
      sourceId: 'side-cards',
      content: 'SIDE CHARACTER: Jules',
      authority: 'medium',
      modelFacing: true,
      disposition: 'included',
      reason: 'rendered_system_instruction_section',
    });
    const userReceipt = createRoleplaySourceReceipt({
      surface: 'user_character_cards',
      sourceId: 'user-cards',
      content: 'USER CHARACTER: Rowan',
      authority: 'medium',
      modelFacing: true,
      disposition: 'included',
      reason: 'rendered_system_instruction_section',
    });
    const privateFact = createCharacterPromptFact({
      characterId: 'ashley',
      characterName: 'Ashley',
      sourceSurface: 'main_character_cards',
      sourceField: 'secrets.private',
      sourceValue: 'Hidden debt',
      runtimeUse: 'private_reference',
      authority: 'visibility_policy',
      relevance: 'conditional',
      visibility: 'private_reference',
      wordingPolicy: 'withhold',
      disposition: 'debug_only',
      reason: 'private_saved_fact_requires_explicit_visibility_or_knowledge_policy',
    });
    const allReceipts = [...receipts, sideReceipt, userReceipt];
    const evidence = buildRoleplayEffectiveFieldEvidence({
      receipts: allReceipts,
      sceneRoster: [],
      characterPromptFacts: [
        createCharacterPromptFact({
          characterId: 'ashley',
          characterName: 'Ashley',
          sourceSurface: 'main_character_cards',
          sourceField: 'background.occupation',
          sourceValue: 'Archivist',
          runtimeUse: 'stable_reference',
          authority: 'saved_card_reference',
          relevance: 'always',
          visibility: 'broad_reference',
          wordingPolicy: 'compact_fact',
          disposition: 'included',
          reason: 'stable_character_reference',
        }),
        createCharacterPromptFact({
          characterId: 'jules',
          characterName: 'Jules',
          sourceSurface: 'side_character_cards',
          sourceField: 'roleDescription',
          sourceValue: 'Courier',
          runtimeUse: 'stable_reference',
          authority: 'saved_card_reference',
          relevance: 'always',
          visibility: 'broad_reference',
          wordingPolicy: 'compact_fact',
          disposition: 'included',
          reason: 'stable_character_reference',
        }),
        createCharacterPromptFact({
          characterId: 'rowan',
          characterName: 'Rowan',
          sourceSurface: 'user_character_cards',
          sourceField: 'roleDescription',
          sourceValue: 'Detective',
          runtimeUse: 'stable_reference',
          authority: 'saved_card_reference',
          relevance: 'always',
          visibility: 'broad_reference',
          wordingPolicy: 'compact_fact',
          disposition: 'included',
          reason: 'stable_character_reference',
        }),
        privateFact,
      ],
      userStateAuthorityDecisions: [],
    });

    expect(evidence.find((entry) => entry.fieldPath === 'background.occupation')?.sourceReceiptIds)
      .toEqual([receipts[1].id]);
    expect(evidence.find((entry) => entry.entityId === 'jules')?.sourceReceiptIds).toEqual([sideReceipt.id]);
    expect(evidence.find((entry) => entry.entityId === 'rowan')?.sourceReceiptIds).toEqual([userReceipt.id]);
    expect(evidence.find((entry) => entry.fieldPath === 'secrets.private')?.sourceReceiptIds).toEqual([]);
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

  it('keeps mandatory sources, prefers the authoritative duplicate, and omits optional overflow', () => {
    const mandatoryReceipt = createRoleplaySourceReceipt({
      surface: 'current_state',
      sourceId: 'current-location',
      content: 'Ashley is in the kitchen.',
      authority: 'high',
      modelFacing: true,
      disposition: 'included',
      modelFacingSection: 'system_current_state',
      reason: 'current_location',
    });
    const staleDuplicateReceipt = createRoleplaySourceReceipt({
      surface: 'main_character_cards',
      sourceId: 'saved-location',
      content: 'Ashley is in the kitchen.',
      authority: 'low',
      modelFacing: true,
      disposition: 'included',
      modelFacingSection: 'system_main_character_cards',
      reason: 'saved_location',
    });
    const loreReceipt = createRoleplaySourceReceipt({
      surface: 'story_world',
      sourceId: 'unrelated-lore',
      content: 'A distant kingdom has an extensive unrelated history.',
      authority: 'medium',
      modelFacing: true,
      disposition: 'included',
      modelFacingSection: 'system_story_world',
      reason: 'optional_lore',
    });
    const makeCandidate = (receipt: RoleplaySourceReceipt, relevance: 'mandatory' | 'unknown') => (
      createRoleplaySourceCandidate({
        receipt,
        content: receipt.preview,
        recency: { kind: receipt.surface === 'current_state' ? 'current_turn' : 'static_reference' },
        relevance: { status: relevance, reasons: ['fixture'] },
        privacy: {
          sensitivity: 'ordinary',
          owner: { scope: 'runtime' },
          audience: 'model',
          selectionEligibility: 'eligible',
          reason: 'fixture',
        },
      })
    );
    const candidates = [
      makeCandidate(mandatoryReceipt, 'mandatory'),
      makeCandidate(staleDuplicateReceipt, 'unknown'),
      makeCandidate(loreReceipt, 'unknown'),
    ];
    const selection = selectRoleplaySources({
      candidates,
      receipts: [mandatoryReceipt, staleDuplicateReceipt, loreReceipt],
      refreshReason: 'routine_turn',
      liveShapingEnabled: true,
      classBudgets: { story_reference: 8 },
    });

    expect(selection.liveShapingEnabled).toBe(true);
    expect(selection.selectedCandidateIds).toContain(candidates[0].id);
    expect(selection.omittedCandidateIds).toContain(candidates[1].id);
    expect(selection.omittedCandidateIds).toContain(candidates[2].id);
    expect(selection.decisions.find((decision) => decision.candidateId === candidates[1].id)?.reason)
      .toBe('lower_priority_semantic_or_exact_duplicate');
    expect(selection.mandatorySourceCoverage).toEqual([
      expect.objectContaining({ candidateId: candidates[0].id, status: 'covered' }),
    ]);
  });

  it('renders only selected system and history candidates while preserving the final user message exactly', () => {
    const systemReceipt = createRoleplaySourceReceipt({
      surface: 'roleplay_core',
      sourceId: 'core',
      content: 'Core instruction.',
      authority: 'high',
      modelFacing: true,
      disposition: 'included',
      modelFacingSection: 'system_roleplay_core',
      reason: 'core',
    });
    const omittedReceipt = createRoleplaySourceReceipt({
      surface: 'story_world',
      sourceId: 'oversized-lore',
      content: 'Background that should not be rendered.',
      authority: 'low',
      modelFacing: true,
      disposition: 'included',
      modelFacingSection: 'system_story_world',
      reason: 'optional_lore',
    });
    const historyReceipt = createRoleplaySourceReceipt({
      surface: 'recent_assistant_history',
      sourceId: 'assistant-1:generation-1',
      sourceMessageId: 'assistant-1',
      sourceGenerationId: 'generation-1',
      content: 'Ashley sets the cup down.',
      authority: 'medium',
      modelFacing: true,
      disposition: 'included',
      modelFacingSection: 'recent_history',
      reason: 'accepted_history',
    });
    const makeCandidate = (
      receipt: RoleplaySourceReceipt,
      relevance: 'mandatory' | 'relevant' | 'unknown',
    ) => createRoleplaySourceCandidate({
      receipt,
      content: receipt.preview,
      recency: { kind: receipt.surface.includes('history') ? 'recent_exchange' : 'unknown' },
      relevance: { status: relevance, reasons: ['fixture'] },
      privacy: {
        sensitivity: 'ordinary',
        owner: { scope: 'runtime' },
        audience: 'model',
        selectionEligibility: 'eligible',
        reason: 'fixture',
      },
    });
    const candidates = [
      makeCandidate(systemReceipt, 'mandatory'),
      makeCandidate(omittedReceipt, 'unknown'),
      makeCandidate(historyReceipt, 'relevant'),
    ];
    const selection = selectRoleplaySources({
      candidates,
      receipts: [systemReceipt, omittedReceipt, historyReceipt],
      refreshReason: 'routine_turn',
      liveShapingEnabled: true,
      classBudgets: { story_reference: 1 },
    });
    const finalUserContent = '[FINAL USER LANES]\n[player_turn | user | player_turn | model-facing]\nI answer her.';
    const packet = buildRoleplaySelectedProviderPacket({
      fullMessages: [
        { role: 'system', content: 'Core instruction.\n\nBackground that should not be rendered.' },
        { role: 'assistant', content: 'Ashley sets the cup down.' },
        { role: 'user', content: finalUserContent },
      ],
      receipts: [systemReceipt, omittedReceipt, historyReceipt],
      selection,
      finalUserContent,
    });
    const selectedReceipts = applyRoleplaySourceSelectionToReceipts({
      receipts: [systemReceipt, omittedReceipt, historyReceipt],
      selection,
    });

    expect(packet.messages).toEqual([
      { role: 'system', content: 'Core instruction.' },
      { role: 'assistant', content: 'Ashley sets the cup down.' },
      { role: 'user', content: finalUserContent },
    ]);
    expect(packet.removedChars).toBeGreaterThan(0);
    expect(selectedReceipts.find((receipt) => receipt.id === omittedReceipt.id)).toMatchObject({
      modelFacing: false,
      disposition: 'suppressed',
      omissionReason: expect.stringContaining('section_budget_exceeded'),
    });
  });
});
