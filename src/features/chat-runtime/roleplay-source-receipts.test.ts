import { describe, expect, it } from 'vitest';

import type { RoleplayRecentHistoryPacket } from './roleplay-recent-history';
import type { RoleplayFinalUserLane } from './roleplay-response-job';
import {
  buildRoleplayDuplicateSourceMetrics,
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
});
