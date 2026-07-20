import { describe, expect, it } from 'vitest';

import type { RoleplayRecentHistoryPacket } from './roleplay-recent-history';
import type { RoleplayFinalUserLane } from './roleplay-response-job';
import { projectPlayerTurnVisibility } from './player-turn-visibility';
import {
  buildRoleplayDuplicateSourceMetrics,
  buildRoleplaySourceArtifacts,
  buildRoleplaySourceCoverage,
  buildRoleplaySourceReceipts,
  createRoleplaySourceReceipt,
  hashRoleplaySourceText,
} from './roleplay-source-receipts';

describe('RoleplaySourceReceipt', () => {
  it('creates stable receipts and exact-text duplicate groups', () => {
    const first = createRoleplaySourceReceipt({
      surface: 'memory',
      sourceId: 'memory-1',
      content: '  Ashley waits by the counter. ',
      authority: 'medium',
      modelFacing: true,
      disposition: 'included',
      reason: 'test_memory',
    });
    const second = createRoleplaySourceReceipt({
      surface: 'current_state',
      sourceId: 'state-1',
      content: 'Ashley   waits by the counter.',
      authority: 'high',
      modelFacing: true,
      disposition: 'included',
      reason: 'test_state',
    });

    expect(first.textHash).toBe(hashRoleplaySourceText('Ashley waits by the counter.'));
    expect(first.duplicateGroup).toBe(second.duplicateGroup);
    expect(first).toMatchObject({
      id: expect.stringContaining('memory:memory-1:fnv1a-'),
      contentLength: 'Ashley waits by the counter.'.length,
      preview: 'Ashley waits by the counter.',
    });
  });

  it('covers rendered sections, history, response-job lanes, controls, and debug-only context', () => {
    const finalUserLanes: RoleplayFinalUserLane[] = [
      {
        id: 'player_turn',
        kind: 'player_turn',
        sourceRole: 'user',
        authority: 'player_turn',
        modelFacing: true,
        content: 'I step closer.',
      },
      {
        id: 'retry_rejection',
        kind: 'retry_rejection',
        sourceRole: 'assistant',
        authority: 'control',
        modelFacing: true,
        content: 'Use the rejected attempt only as contrast.',
      },
    ];
    const recentHistoryPacket: RoleplayRecentHistoryPacket = {
      providerMessages: [{ role: 'user', content: 'I step closer.' }],
      receipts: [
        {
          messageId: 'user-1',
          role: 'user',
          includedInProviderHistory: true,
          responseJobSource: 'player_turn',
          treatment: 'exact_user',
          reason: 'exact_user_turn_also_rendered_in_player_lane',
        },
        {
          messageId: 'assistant-rejected',
          generationId: 'generation-rejected',
          role: 'assistant',
          includedInProviderHistory: false,
          responseJobSource: 'retry_contrast',
          treatment: 'suppressed_style_anchor',
          reason: 'rejected_retry_attempt_not_accepted_history',
        },
      ],
      suppressedStyleAnchors: [],
    };

    const receipts = buildRoleplaySourceReceipts({
      systemInstruction: [
        '--- SECTION 1 - CORE ROLEPLAY LOGIC ---\n\nCore rules.',
        [
          '--- SECTION 2 - STORY AND WORLD INFORMATION ---',
          '',
          'Story data.',
          '',
          'MAIN STORY GOALS',
          'STORY GOAL: Reach the station',
          '',
          '--- STORY THEMES ---',
          '- Slow burn: Let the relationship develop naturally.',
        ].join('\n'),
        [
          '--- SECTION 6 - STORY MEMORIES AND CURRENT SCENE STATE ---',
          '',
          '--- STORY MEMORIES ---',
          '',
          'The day began in the kitchen.',
          '',
          '--- CURRENT PHYSICAL SCENE STATE ---',
          '',
          'Ashley is beside the counter.',
          '',
          '--- ACTIVE SCENE CONTEXT ---',
          '',
          'Scene Title: Kitchen',
          '',
          '--- CURRENT TEMPORAL CONTEXT ---',
          '',
          'Day 1, afternoon.',
        ].join('\n'),
      ].join('\n\n'),
      finalUserLanes,
      recentHistoryPacket,
      executionBrief: 'Continue from the latest established scene change.',
      roleplayContext: { conversationId: 'conversation-1' },
    });

    expect(receipts).toEqual(expect.arrayContaining([
      expect.objectContaining({ surface: 'roleplay_core', modelFacing: true }),
      expect.objectContaining({ surface: 'story_world', modelFacing: true }),
      expect.objectContaining({ surface: 'goals', sourceId: 'main-story-goals', modelFacing: true }),
      expect.objectContaining({ surface: 'content_theme', sourceId: 'story-themes', modelFacing: true }),
      expect.objectContaining({ surface: 'memory', modelFacing: true }),
      expect.objectContaining({ surface: 'current_state', modelFacing: true }),
      expect.objectContaining({ surface: 'active_scene', modelFacing: true }),
      expect.objectContaining({ surface: 'temporal_context', modelFacing: true }),
      expect.objectContaining({ surface: 'player_turn', authority: 'highest' }),
      expect.objectContaining({ surface: 'mode_control', authority: 'contrast_only' }),
      expect.objectContaining({ surface: 'recent_user_history', disposition: 'included' }),
      expect.objectContaining({ surface: 'recent_assistant_history', disposition: 'suppressed' }),
      expect.objectContaining({ surface: 'execution_brief', modelFacing: true }),
      expect.objectContaining({
        surface: 'debug_roleplay_context',
        authority: 'debug_only',
        modelFacing: false,
        disposition: 'debug_only',
      }),
    ]));
    expect(receipts.find((receipt) => receipt.surface === 'recent_user_history')?.duplicateGroup)
      .toBe(receipts.find((receipt) => receipt.surface === 'player_turn')?.duplicateGroup);

    expect(buildRoleplayDuplicateSourceMetrics(receipts)).toEqual(expect.arrayContaining([
      expect.objectContaining({
        surfaces: expect.arrayContaining(['recent_user_history', 'player_turn']),
        modelFacingCount: 2,
        totalCount: 2,
      }),
    ]));
  });

  it('keeps Section 2 sources disjoint and preserves their exact rendered content in candidates', () => {
    const systemInstruction = [
      '--- SECTION 1 - CORE ROLEPLAY LOGIC ---\n\nCore rules.',
      [
        '--- SECTION 2 - STORY AND WORLD INFORMATION ---',
        '',
        'Use the reference information only when it applies.',
        '',
        '--- WORLD CONTEXT ---',
        'The story takes place in Meridian.',
        '',
        'MAIN STORY GOALS',
        'STORY GOAL: Reach the station',
        '',
        '--- STORY THEMES ---',
        '- Slow burn: Let the relationship develop naturally.',
      ].join('\n'),
      [
        '--- STORY AND CHARACTER CARD REFERENCE RULE ---',
        '',
        'Treat reference details as background rather than player actions.',
      ].join('\n'),
      '--- SECTION 3 - MAIN CHARACTERS ---\n\nCharacter rules.\n\nCHARACTER: Ashley\nROLE: Main',
    ].join('\n\n');
    const artifacts = buildRoleplaySourceArtifacts({
      systemInstruction,
      finalUserLanes: [],
      recentHistoryPacket: { providerMessages: [], receipts: [], suppressedStyleAnchors: [] },
      executionBrief: 'Continue.',
    });
    const modelCandidates = artifacts.candidates.filter((candidate) => candidate.privacy.audience === 'model');

    expect(modelCandidates).toEqual(expect.arrayContaining([
      expect.objectContaining({
        sourceId: 'section-2-structure',
        surface: 'roleplay_core',
        content: '--- SECTION 2 - STORY AND WORLD INFORMATION ---',
      }),
      expect.objectContaining({
        sourceId: 'section-2-story-world-preamble',
        surface: 'story_world',
        content: 'Use the reference information only when it applies.',
      }),
      expect.objectContaining({
        sourceId: 'world-context',
        content: '--- WORLD CONTEXT ---\nThe story takes place in Meridian.',
      }),
      expect.objectContaining({
        sourceId: 'main-story-goals',
        content: 'MAIN STORY GOALS\nSTORY GOAL: Reach the station',
      }),
      expect.objectContaining({
        sourceId: 'story-themes',
        content: '--- STORY THEMES ---\n- Slow burn: Let the relationship develop naturally.',
      }),
      expect.objectContaining({
        sourceId: 'character-card-reference-rule',
        content: '--- STORY AND CHARACTER CARD REFERENCE RULE ---\n\nTreat reference details as background rather than player actions.',
      }),
    ]));
    const section2CandidateIds = new Set([
      'section-2-structure',
      'section-2-story-world-preamble',
      'world-context',
      'main-story-goals',
      'story-themes',
    ]);
    const section2Candidates = modelCandidates.filter((candidate) => section2CandidateIds.has(candidate.sourceId ?? ''));
    expect(section2Candidates).toHaveLength(5);
    expect(section2Candidates.some((candidate) => candidate.content.includes('WORLD CONTEXT')
      && candidate.content.includes('MAIN STORY GOALS'))).toBe(false);
  });

  it('splits rendered character cards into independently selectable exact-content candidates', () => {
    const artifacts = buildRoleplaySourceArtifacts({
      systemInstruction: [
        '--- SECTION 1 - CORE ROLEPLAY LOGIC ---\n\nCore rules.',
        [
          '--- SECTION 3 - MAIN CHARACTERS ---',
          '',
          'Use the current main-character cards.',
          '',
          'CHARACTER: Ashley',
          'ROLE: Main',
          'LOCATION: Kitchen',
          '',
          'CHARACTER: Jordan',
          'ROLE: Main',
          'LOCATION: Hall',
        ].join('\n'),
        [
          '--- SECTION 4 - SIDE CHARACTERS ---',
          '',
          'Use side characters only when relevant.',
          '',
          'CHARACTER: Ashley',
          'ROLE: Side',
          'LOCATION: Street',
        ].join('\n'),
      ].join('\n\n'),
      finalUserLanes: [],
      recentHistoryPacket: { providerMessages: [], receipts: [], suppressedStyleAnchors: [] },
      executionBrief: 'Continue.',
    });
    const cards = artifacts.candidates.filter((candidate) => candidate.sourceField === 'prompt_card');

    expect(cards).toHaveLength(3);
    expect(cards.map((candidate) => candidate.content)).toEqual([
      'CHARACTER: Ashley\nROLE: Main\nLOCATION: Kitchen',
      'CHARACTER: Jordan\nROLE: Main\nLOCATION: Hall',
      'CHARACTER: Ashley\nROLE: Side\nLOCATION: Street',
    ]);
    expect(new Set(cards.map((candidate) => candidate.sourceRecordId)).size).toBe(3);
    expect(cards.every((candidate) => candidate.contentHash === hashRoleplaySourceText(candidate.content))).toBe(true);
  });

  it('reports both receipt-only and provider-section-only coverage failures', () => {
    const orphanReceipt = createRoleplaySourceReceipt({
      surface: 'player_turn',
      sourceId: 'player_turn',
      content: 'This player text is absent from the provider request.',
      authority: 'highest',
      modelFacing: true,
      disposition: 'included',
      reason: 'test_missing_provider_text',
    });

    const coverage = buildRoleplaySourceCoverage({
      receipts: [orphanReceipt],
      providerMessages: [
        {
          role: 'system',
          content: '--- SECTION 1 - CORE ROLEPLAY LOGIC ---\n\nCore rules without a receipt.',
        },
        {
          role: 'user',
          content: '[FINAL USER LANES]\n[player_turn | user | player_turn | model-facing]\nDifferent text.\n\n[EXECUTION BRIEF]\nContinue.',
        },
      ],
    });

    expect(coverage.receiptCoverage).toContainEqual(expect.objectContaining({
      receiptId: orphanReceipt.id,
      status: 'missing_provider_text',
    }));
    expect(coverage.providerSectionCoverage).toEqual(expect.arrayContaining([
      expect.objectContaining({
        providerSectionId: 'section-1',
        status: 'missing_source_receipt',
      }),
      expect.objectContaining({
        providerSectionId: 'execution-brief',
        status: 'missing_source_receipt',
      }),
    ]));
  });

  it('keeps the visible player projection model-facing and private spans debug-only', () => {
    const projection = projectPlayerTurnVisibility(
      'I close the door. (I need a moment to think.) "Wait here."',
      'user-private-1',
    );
    const receipts = buildRoleplaySourceReceipts({
      systemInstruction: '--- SECTION 1 - CORE ROLEPLAY LOGIC ---\n\nCore rules.',
      finalUserLanes: [{
        id: 'player_turn',
        kind: 'player_turn',
        sourceRole: 'user',
        authority: 'player_turn',
        modelFacing: true,
        content: projection.visibleText,
      }],
      recentHistoryPacket: {
        providerMessages: [],
        receipts: [],
        suppressedStyleAnchors: [],
      },
      executionBrief: 'Continue from the latest established scene change.',
      roleplayContext: { conversationId: 'conversation-1' },
      playerTurnVisibilityProjection: projection,
    });

    expect(receipts).toEqual(expect.arrayContaining([
      expect.objectContaining({
        surface: 'player_turn',
        sourceMessageId: 'user-private-1',
        sourceField: 'visible_text',
        contentLength: projection.visibleText.length,
        transformation: 'visible_projection',
        modelFacing: true,
        disposition: 'included',
      }),
      expect.objectContaining({
        surface: 'player_turn',
        sourceMessageId: 'user-private-1',
        sourceField: 'private_parenthetical.0',
        authority: 'debug_only',
        modelFacing: false,
        disposition: 'suppressed',
        privacy: {
          sensitivity: 'private_player_thought',
          owner: { scope: 'conversation_owner' },
          audience: 'owner_private_debug',
          selectionEligibility: 'withheld',
          reason: 'balanced_parenthetical_private_thought',
        },
        omissionReason: 'balanced_parenthetical_private_thought',
      }),
    ]));
    const privateReceipt = receipts.find((receipt) => receipt.sourceField === 'private_parenthetical.0');
    expect(privateReceipt?.preview).toBe('(I need a moment to think.)');
    expect(receipts.filter((receipt) => receipt.modelFacing).map((receipt) => receipt.preview))
      .not.toContain('(I need a moment to think.)');
  });

  it('records unmatched player delimiters as debug warnings while leaving the text visible', () => {
    const rawText = 'I keep talking (without finishing the aside.';
    const projection = projectPlayerTurnVisibility(rawText, 'user-unmatched-1');
    const receipts = buildRoleplaySourceReceipts({
      systemInstruction: '--- SECTION 1 - CORE ROLEPLAY LOGIC ---\n\nCore rules.',
      finalUserLanes: [{
        id: 'player_turn',
        kind: 'player_turn',
        sourceRole: 'user',
        authority: 'player_turn',
        modelFacing: true,
        content: projection.visibleText,
      }],
      recentHistoryPacket: { providerMessages: [], receipts: [], suppressedStyleAnchors: [] },
      executionBrief: 'Continue from the latest established scene change.',
      roleplayContext: { conversationId: 'conversation-1' },
      playerTurnVisibilityProjection: projection,
    });

    expect(projection.visibleText).toBe(rawText);
    expect(receipts).toContainEqual(expect.objectContaining({
      surface: 'player_turn',
      sourceMessageId: 'user-unmatched-1',
      sourceField: 'visibility_warning.0',
      authority: 'debug_only',
      modelFacing: false,
      disposition: 'debug_only',
      reason: 'unmatched_parenthetical_delimiter_left_visible',
    }));
  });

  it('keeps older-history private spans and delimiter warnings in owner-private debug receipts', () => {
    const receipts = buildRoleplaySourceReceipts({
      systemInstruction: '--- SECTION 1 - CORE ROLEPLAY LOGIC ---\n\nCore rules.',
      finalUserLanes: [],
      recentHistoryPacket: {
        providerMessages: [{ role: 'user', content: 'I open the door.' }],
        receipts: [{
          messageId: 'user-history-private',
          role: 'user',
          includedInProviderHistory: true,
          responseJobSource: 'continue_context',
          treatment: 'visible_user_projection',
          reason: 'private_parenthetical_spans_removed_from_user_history',
          transformedContent: 'I open the door.',
          privateSpans: [{
            id: 'user-history-private:private-parenthetical:1',
            index: 0,
            start: 17,
            end: 37,
            rawText: '(I hope she follows.)',
            content: 'I hope she follows.',
          }],
          visibilityWarnings: [{
            code: 'unmatched_closing_parenthesis',
            index: 41,
            delimiter: ')',
          }],
        }],
        suppressedStyleAnchors: [],
      },
      executionBrief: 'Continue from the latest established scene change.',
    });

    expect(receipts).toEqual(expect.arrayContaining([
      expect.objectContaining({
        surface: 'recent_user_history',
        sourceMessageId: 'user-history-private',
        sourceField: 'private_parenthetical.0',
        modelFacing: false,
        disposition: 'suppressed',
        privacy: expect.objectContaining({
          owner: { scope: 'conversation_owner' },
          audience: 'owner_private_debug',
          selectionEligibility: 'withheld',
        }),
      }),
      expect.objectContaining({
        surface: 'recent_user_history',
        sourceMessageId: 'user-history-private',
        sourceField: 'visibility_warning.0',
        modelFacing: false,
        disposition: 'debug_only',
      }),
    ]));
    expect(receipts.filter((receipt) => receipt.modelFacing).map((receipt) => receipt.preview))
      .not.toContain('(I hope she follows.)');
  });
});
