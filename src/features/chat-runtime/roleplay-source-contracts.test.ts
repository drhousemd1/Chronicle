import { describe, expect, it } from 'vitest';

import {
  ROLEPLAY_SOURCE_PACKET_VERSION,
  createRoleplaySourceCandidate,
  createRoleplaySourceReceipt,
} from './roleplay-source-receipts';
import {
  buildRoleplayActiveScenePacketCandidate,
  type RoleplaySourceSectionBudget,
  type RoleplaySourceSelection,
} from './roleplay-source-shaping';

function candidateForSource(input: {
  surface: 'main_character_cards' | 'current_state' | 'goals';
  sourceId: string;
  sourceField: string;
  content: string;
  authority: 'high' | 'medium';
  relevance: 'mandatory' | 'relevant';
}) {
  const receipt = createRoleplaySourceReceipt({
    surface: input.surface,
    sourceId: input.sourceId,
    sourceField: input.sourceField,
    content: input.content,
    authority: input.authority,
    modelFacing: true,
    disposition: 'included',
    transformation: 'structured_fact',
    modelFacingSection: input.surface === 'main_character_cards'
      ? 'system_main_character_cards'
      : input.surface === 'current_state'
        ? 'final_current_state'
        : 'system_goals',
    reason: 'shared_candidate_contract_fixture',
  });

  return createRoleplaySourceCandidate({
    receipt,
    content: input.content,
    recency: {
      kind: input.surface === 'current_state' ? 'current_turn' : 'static_reference',
    },
    relevance: {
      status: input.relevance,
      reasons: ['required_by_current_exchange'],
    },
    privacy: {
      sensitivity: 'ordinary',
      owner: { scope: 'runtime' },
      audience: 'model',
      selectionEligibility: 'eligible',
      reason: 'approved_model_facing_source',
    },
  });
}

describe('shared roleplay source contracts', () => {
  it('lets card, scene-visibility, and goal owners emit one candidate vocabulary', () => {
    const cardCandidate = candidateForSource({
      surface: 'main_character_cards',
      sourceId: 'character-ashley',
      sourceField: 'relationship.user',
      content: 'Ashley distrusts the player after the broken promise.',
      authority: 'medium',
      relevance: 'relevant',
    });
    const sceneCandidate = candidateForSource({
      surface: 'current_state',
      sourceId: 'scene-roster:ashley',
      sourceField: 'location',
      content: 'Ashley is in the kitchen.',
      authority: 'high',
      relevance: 'mandatory',
    });
    const goalCandidate = candidateForSource({
      surface: 'goals',
      sourceId: 'goal-1',
      sourceField: 'currentMilestone',
      content: 'Ashley decides whether to reveal the unsigned agreement.',
      authority: 'medium',
      relevance: 'relevant',
    });

    expect(cardCandidate).toMatchObject({
      packetVersion: ROLEPLAY_SOURCE_PACKET_VERSION,
      sourceClass: 'character_card',
      sourceField: 'relationship.user',
      estimatedChars: cardCandidate.content.length,
    });
    expect(sceneCandidate).toMatchObject({
      sourceClass: 'current_state',
      relevance: { status: 'mandatory' },
      recency: { kind: 'current_turn' },
    });
    expect(goalCandidate).toMatchObject({
      sourceClass: 'goal',
      relevance: { status: 'relevant' },
    });
    expect(new Set([cardCandidate.receiptId, sceneCandidate.receiptId, goalCandidate.receiptId]).size).toBe(3);
  });

  it('defines a complete shadow selection result while live shaping remains disabled', () => {
    const sceneCandidate = candidateForSource({
      surface: 'current_state',
      sourceId: 'scene-roster:ashley',
      sourceField: 'location',
      content: 'Ashley is in the kitchen.',
      authority: 'high',
      relevance: 'mandatory',
    });
    const selection = {
      id: 'selection-shadow-1',
      packetVersion: ROLEPLAY_SOURCE_PACKET_VERSION,
      policyVersion: 'unimplemented-shadow-v1',
      liveShapingEnabled: false,
      refreshReason: 'first_turn',
      candidates: [sceneCandidate],
      selectedCandidateIds: [sceneCandidate.id],
      omittedCandidateIds: [],
      decisions: [{
        candidateId: sceneCandidate.id,
        receiptId: sceneCandidate.receiptId,
        disposition: 'selected',
        reason: 'mandatory_current_state_shadow_decision',
        modelFacingSection: 'final_current_state',
      }],
      sectionBudgets: [{
        sectionId: 'final_current_state',
        sourceClass: 'current_state',
        maxChars: 800,
        usedChars: sceneCandidate.estimatedChars,
        selectedCount: 1,
      }],
      mandatorySourceCoverage: [{
        candidateId: sceneCandidate.id,
        receiptId: sceneCandidate.receiptId,
        status: 'covered',
        reason: 'mandatory_candidate_present_in_shadow_selection',
      }],
    } satisfies RoleplaySourceSelection;

    expect(selection.liveShapingEnabled).toBe(false);
    expect(selection.decisions[0].receiptId).toBe(sceneCandidate.receiptId);
    expect(selection.mandatorySourceCoverage).toEqual([
      expect.objectContaining({ status: 'covered' }),
    ]);

    const currentCandidate = buildRoleplayActiveScenePacketCandidate({
      receipts: [createRoleplaySourceReceipt({
        surface: 'current_state',
        sourceId: 'scene-roster:ashley',
        content: sceneCandidate.content,
        authority: 'high',
        modelFacing: true,
        disposition: 'included',
        reason: 'current_shadow_packet',
      })],
      turnNumber: 1,
    });
    expect(currentCandidate.liveShapingEnabled).toBe(false);
  });

  it('keeps field-level identities distinct when two fields contain the same text', () => {
    const firstReceipt = createRoleplaySourceReceipt({
      surface: 'main_character_cards',
      sourceId: 'character-ashley',
      sourceRecordId: 'character-ashley',
      sourceField: 'personality.outward',
      content: 'Careful around strangers.',
      authority: 'medium',
      modelFacing: true,
      disposition: 'included',
      transformation: 'structured_fact',
      modelFacingSection: 'system_main_character_cards',
      reason: 'field_identity_fixture',
    });
    const secondReceipt = createRoleplaySourceReceipt({
      surface: 'main_character_cards',
      sourceId: 'character-ashley',
      sourceRecordId: 'character-ashley',
      sourceField: 'relationship.player',
      content: 'Careful around strangers.',
      authority: 'medium',
      modelFacing: true,
      disposition: 'included',
      transformation: 'structured_fact',
      modelFacingSection: 'system_main_character_cards',
      reason: 'field_identity_fixture',
    });

    expect(firstReceipt.textHash).toBe(secondReceipt.textHash);
    expect(firstReceipt.id).not.toBe(secondReceipt.id);
  });

  it('preserves exact candidate content including line structure', () => {
    const content = 'First relationship fact.\nSecond qualified fact.';
    const receipt = createRoleplaySourceReceipt({
      surface: 'main_character_cards',
      sourceId: 'character-ashley',
      sourceField: 'relationships.player',
      content,
      authority: 'medium',
      modelFacing: true,
      disposition: 'included',
      transformation: 'exact',
      modelFacingSection: 'system_main_character_cards',
      reason: 'multiline_candidate_fixture',
    });
    const candidate = createRoleplaySourceCandidate({
      receipt,
      content,
      recency: { kind: 'static_reference' },
      relevance: { status: 'relevant', reasons: ['current_exchange_reference'] },
      privacy: {
        sensitivity: 'ordinary',
        owner: { scope: 'runtime' },
        audience: 'model',
        selectionEligibility: 'eligible',
        reason: 'approved_model_facing_source',
      },
    });

    expect(candidate.content).toBe(content);
    expect(candidate.estimatedChars).toBe(content.length);
  });

  it('rejects contradictory model eligibility for private or debug-only receipts', () => {
    const privateReceipt = createRoleplaySourceReceipt({
      surface: 'player_turn',
      sourceId: 'message-user-1:private-span-1',
      sourceMessageId: 'message-user-1',
      sourceField: 'private_parenthetical.0',
      content: 'I hope she does not notice.',
      authority: 'debug_only',
      modelFacing: false,
      disposition: 'suppressed',
      transformation: 'none',
      omissionReason: 'balanced_parenthetical_private_thought',
      reason: 'private_player_thought_withheld',
    });

    expect(() => createRoleplaySourceCandidate({
      receipt: privateReceipt,
      content: privateReceipt.preview,
      recency: { kind: 'current_turn', messageId: 'message-user-1' },
      relevance: { status: 'mandatory', reasons: ['latest_player_turn'] },
      privacy: {
        sensitivity: 'private_player_thought',
        owner: { scope: 'conversation_owner' },
        audience: 'model',
        selectionEligibility: 'eligible',
        reason: 'contradictory_fixture',
      },
    })).toThrow('non-model-facing receipt');
  });

  it('rejects contradictory privacy directly on a source receipt', () => {
    expect(() => createRoleplaySourceReceipt({
      surface: 'player_turn',
      sourceId: 'message-user-1:private-span-1',
      content: 'I hope she does not notice.',
      authority: 'debug_only',
      modelFacing: true,
      disposition: 'included',
      privacy: {
        sensitivity: 'private_player_thought',
        owner: { scope: 'conversation_owner' },
        audience: 'owner_private_debug',
        selectionEligibility: 'withheld',
        reason: 'contradictory_fixture',
      },
      reason: 'contradictory_private_receipt',
    })).toThrow('cannot be model-facing or eligible');
  });

  it('keys budgets by provider section rather than source class alone', () => {
    const budgets = [
      {
        sectionId: 'system_current_state',
        sourceClass: 'current_state',
        maxChars: 900,
        usedChars: 180,
        selectedCount: 2,
      },
      {
        sectionId: 'final_current_state',
        sourceClass: 'current_state',
        maxChars: 600,
        usedChars: 120,
        selectedCount: 1,
      },
    ] satisfies RoleplaySourceSectionBudget[];

    expect(budgets.map((budget) => budget.sectionId)).toEqual([
      'system_current_state',
      'final_current_state',
    ]);
  });
});
