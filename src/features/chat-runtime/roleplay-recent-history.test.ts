import { describe, expect, it } from 'vitest';
import type { Message } from '@/types';
import {
  buildContinueAssistantTailResponseJob,
  buildNormalSendResponseJob,
  buildRetryRegenerateResponseJob,
} from './roleplay-response-job';
import { compileRoleplayRecentHistory } from './roleplay-recent-history';
import type { RoleplayAssistantOutcomeRecord } from './roleplay-assistant-outcome';
import type { RoleplayUserStateAuthorityDecision } from './roleplay-user-state-authority';

const isLocalNotice = (message: Message) => message.localNotice != null;

function message(input: Partial<Message> & Pick<Message, 'id' | 'role' | 'text'>): Message {
  return {
    createdAt: 1,
    ...input,
  };
}

describe('compileRoleplayRecentHistory', () => {
  it('keeps the active player turn only in the higher-authority response-job lane', () => {
    const responseJob = buildNormalSendResponseJob({
      conversationId: 'conversation-1',
      playerTurn: { messageId: 'user-current', text: 'I step closer.' },
      currentStateSummary: 'The kitchen remains active.',
      responseDetail: 'standard',
    });
    const result = compileRoleplayRecentHistory({
      messages: [message({ id: 'user-current', role: 'user', text: 'I step closer.' })],
      responseJob,
      limit: 5,
      isLocalNotice,
    });

    expect(result.packet.providerMessages).toEqual([]);
    expect(result.packet.receipts).toContainEqual(expect.objectContaining({
      messageId: 'user-current',
      responseJobSource: 'player_turn',
      alsoRenderedInFinalUserLane: 'player_turn',
      includedInProviderHistory: false,
      treatment: 'exact_user',
      reason: 'exact_user_turn_represented_in_higher_authority_player_lane',
    }));
  });

  it('keeps the source player message out of history when the active lane is a visibility projection', () => {
    const responseJob = buildNormalSendResponseJob({
      conversationId: 'conversation-1',
      playerTurn: { messageId: 'user-current', text: 'I step closer. "Stay there."' },
      currentStateSummary: 'The kitchen remains active.',
      responseDetail: 'standard',
    });
    const result = compileRoleplayRecentHistory({
      messages: [message({
        id: 'user-current',
        role: 'user',
        text: 'I step closer. (I hope she cannot hear my heartbeat.) "Stay there."',
      })],
      responseJob,
      limit: 5,
      isLocalNotice,
    });

    expect(result.packet.providerMessages).toEqual([]);
    expect(result.packet.receipts).toContainEqual(expect.objectContaining({
      messageId: 'user-current',
      responseJobSource: 'player_turn',
      includedInProviderHistory: false,
      reason: 'exact_user_turn_represented_in_higher_authority_player_lane',
    }));
  });

  it('removes balanced private spans from older user history', () => {
    const result = compileRoleplayRecentHistory({
      messages: [message({
        id: 'user-older',
        role: 'user',
        text: 'I set the glass down. (I do not trust her yet.) "Your turn."',
      })],
      limit: 5,
      isLocalNotice,
    });

    expect(result.packet.providerMessages).toEqual([
      { role: 'user', content: 'I set the glass down. "Your turn."' },
    ]);
    expect(result.packet.receipts).toContainEqual(expect.objectContaining({
      messageId: 'user-older',
      treatment: 'visible_user_projection',
      reason: 'private_parenthetical_spans_removed_from_user_history',
      transformedContent: 'I set the glass down. "Your turn."',
      privateSpans: [expect.objectContaining({ content: 'I do not trust her yet.' })],
    }));
  });

  it('omits thought-only older user history from provider messages', () => {
    const result = compileRoleplayRecentHistory({
      messages: [message({
        id: 'user-private',
        role: 'user',
        text: '(I wonder whether she noticed.)',
      })],
      limit: 5,
      isLocalNotice,
    });

    expect(result.packet.providerMessages).toEqual([]);
    expect(result.packet.receipts).toContainEqual(expect.objectContaining({
      messageId: 'user-private',
      treatment: 'visible_user_projection',
      includedInProviderHistory: false,
      reason: 'private_user_history_has_no_model_visible_text',
      privateSpans: [expect.objectContaining({ content: 'I wonder whether she noticed.' })],
    }));
  });

  it('keeps unmatched parentheses visible instead of silently hiding player text', () => {
    const result = compileRoleplayRecentHistory({
      messages: [message({
        id: 'user-unmatched',
        role: 'user',
        text: 'I step closer (and keep speaking.',
      })],
      limit: 5,
      isLocalNotice,
    });

    expect(result.packet.providerMessages).toEqual([
      { role: 'user', content: 'I step closer (and keep speaking.' },
    ]);
    expect(result.packet.receipts).toContainEqual(expect.objectContaining({
      messageId: 'user-unmatched',
      treatment: 'exact_user',
      reason: 'exact_user_continuity',
      visibilityWarnings: [expect.objectContaining({ code: 'unmatched_opening_parenthesis' })],
    }));
  });

  it('keeps exact user turns and latest assistant continuity while suppressing an exact repeated older anchor', () => {
    const result = compileRoleplayRecentHistory({
      messages: [
        message({ id: 'user-1', role: 'user', text: 'I ask her to decide.' }),
        message({
          id: 'assistant-old',
          generationId: 'generation-old',
          role: 'assistant',
          text: 'Mara: *She rests against the balcony rail.* "What do you do next?"',
        }),
        message({ id: 'user-2', role: 'user', text: 'I wait for the decision.' }),
        message({
          id: 'assistant-latest',
          generationId: 'generation-latest',
          role: 'assistant',
          text: 'Mara: *She finally chooses a direction.* "What do you do next?"',
        }),
      ],
      limit: 5,
      isLocalNotice,
    });

    expect(result.packet.providerMessages.map((entry) => entry.content)).toEqual([
      'I ask her to decide.',
      'I wait for the decision.',
      'Mara: *She finally chooses a direction.* "What do you do next?"',
    ]);
    expect(result.packet.receipts).toEqual(expect.arrayContaining([
      expect.objectContaining({ messageId: 'user-1', treatment: 'exact_user', includedInProviderHistory: true }),
      expect.objectContaining({
        messageId: 'assistant-old',
        treatment: 'suppressed_style_anchor',
        reason: 'older_assistant_without_outcome_record_omitted',
        includedInProviderHistory: false,
        repeatedAnchors: expect.arrayContaining(['what do you do next?']),
      }),
      expect.objectContaining({
        messageId: 'assistant-latest',
        treatment: 'exact_latest_assistant',
        includedInProviderHistory: true,
      }),
    ]));
  });

  it('transforms older assistant history only from a generation-matched persisted outcome record', () => {
    const decisions: RoleplayUserStateAuthorityDecision[] = [
      {
        claim: 'The user character has a visible tremor in one hand.',
        claimType: 'bodily_reaction',
        sourceMessageId: 'assistant-old',
        sourceGenerationId: 'generation-old',
        sourceRole: 'assistant',
        authority: 'accepted_assistant_observable_change',
        modelFacingAction: 'allow_as_observation',
        reason: 'accepted_assistant_generation_with_observable_change',
      },
      {
        claim: 'Mara suspects the user character is nervous.',
        claimType: 'emotion',
        sourceMessageId: 'assistant-old',
        sourceGenerationId: 'generation-old',
        sourceRole: 'assistant',
        authority: 'assistant_interpretation',
        modelFacingAction: 'allow_as_character_interpretation',
        reason: 'user_owned_state_requires_user_authorship',
      },
      {
        claim: 'The user secretly wants Mara.',
        claimType: 'intent',
        sourceMessageId: 'assistant-old',
        sourceGenerationId: 'generation-old',
        sourceRole: 'assistant',
        authority: 'unsupported_overreach',
        modelFacingAction: 'debug_only',
        reason: 'unsupported_source_authority',
      },
      {
        claim: 'A stale generation claimed the user consented.',
        claimType: 'consent',
        sourceMessageId: 'assistant-old',
        sourceGenerationId: 'generation-stale',
        sourceRole: 'assistant',
        authority: 'accepted_assistant_observable_change',
        modelFacingAction: 'allow_as_observation',
        reason: 'stale_fixture',
      },
    ];
    const assistantOutcomeRecords: RoleplayAssistantOutcomeRecord[] = [{
      contract: 'RoleplayAssistantOutcomeRecord',
      version: 1,
      messageId: 'assistant-old',
      generationId: 'generation-old',
      facts: [{
        id: 'memory-1',
        category: 'memory',
        label: 'Persisted bullet',
        content: 'Mara agreed to remain nearby.',
        artifactId: 'memory-1',
        sourceMessageId: 'assistant-old',
        sourceGenerationId: 'generation-old',
      }],
      categoryStatus: [
        { category: 'character_state', availability: 'pending_or_unknown', reason: 'none_loaded', factCount: 0 },
        { category: 'side_character_state', availability: 'pending_or_unknown', reason: 'none_loaded', factCount: 0 },
        { category: 'memory', availability: 'available', reason: 'persisted', factCount: 1 },
        { category: 'goal_step', availability: 'pending_or_unknown', reason: 'none_loaded', factCount: 0 },
      ],
      authoritySummary: {
        acceptedObservationCount: 1,
        excludedInterpretationCount: 1,
        excludedUnsupportedCount: 1,
        authorityClasses: [
          'accepted_assistant_observable_change',
          'assistant_interpretation',
          'unsupported_overreach',
        ],
      },
    }];
    const result = compileRoleplayRecentHistory({
      messages: [
        message({
          id: 'assistant-old',
          generationId: 'generation-old',
          role: 'assistant',
          text: 'Mara: *Distinctive old choreography repeats here.* "Distinctive old dialogue."',
        }),
        message({ id: 'user-2', role: 'user', text: 'I watch her carefully.' }),
        message({
          id: 'assistant-latest',
          generationId: 'generation-latest',
          role: 'assistant',
          text: 'Mara: *She changes course.* "I noticed."',
        }),
      ],
      userStateAuthorityDecisions: decisions,
      assistantOutcomeRecords,
      limit: 5,
      isLocalNotice,
    });

    const olderProviderMessage = result.packet.providerMessages[0];
    expect(olderProviderMessage).toEqual({
      role: 'assistant',
      content: [
        '[OLDER ASSISTANT OUTCOME]',
        'Use these persisted consequences for continuity. They replace the older assistant prose and are not a style example.',
        '- Mara agreed to remain nearby.',
      ].join('\n'),
    });
    expect(olderProviderMessage.content).not.toContain('Distinctive old choreography');
    expect(olderProviderMessage.content).not.toContain('Distinctive old dialogue');
    expect(olderProviderMessage.content).not.toContain('secretly wants');
    expect(olderProviderMessage.content).not.toContain('consented');
    expect(result.packet.receipts).toContainEqual(expect.objectContaining({
      messageId: 'assistant-old',
      generationId: 'generation-old',
      treatment: 'outcome_summary',
      reason: 'generation_matched_persisted_assistant_outcome',
      includedInProviderHistory: true,
      transformedContent: olderProviderMessage.content,
      sourceAuthorityDecisionCount: 3,
      sourceAuthorityClasses: [
        'accepted_assistant_observable_change',
        'assistant_interpretation',
        'unsupported_overreach',
      ],
      outcomeFactCount: 1,
    }));
  });

  it('does not claim outcome_summary when no safe structured decision matches', () => {
    const result = compileRoleplayRecentHistory({
      messages: [
        message({
          id: 'assistant-old',
          generationId: 'generation-old',
          role: 'assistant',
          text: 'Mara crosses the room without repeating herself.',
        }),
        message({
          id: 'assistant-latest',
          generationId: 'generation-latest',
          role: 'assistant',
          text: 'Mara opens the window.',
        }),
      ],
      userStateAuthorityDecisions: [{
        claim: 'Unsupported private state.',
        claimType: 'intent',
        sourceMessageId: 'assistant-old',
        sourceGenerationId: 'generation-old',
        sourceRole: 'assistant',
        authority: 'unsupported_overreach',
        modelFacingAction: 'debug_only',
        reason: 'unsupported_source_authority',
      }],
      limit: 5,
      isLocalNotice,
    });

    expect(result.packet.providerMessages[0]).toEqual({
      role: 'assistant',
      content: 'Mara opens the window.',
    });
    expect(result.packet.receipts).toContainEqual(expect.objectContaining({
      messageId: 'assistant-old',
      includedInProviderHistory: false,
      treatment: 'suppressed_style_anchor',
      reason: 'older_assistant_without_outcome_record_omitted',
      sourceAuthorityDecisionCount: 1,
      sourceAuthorityClasses: ['unsupported_overreach'],
    }));
    expect(result.packet.receipts.some((receipt) => receipt.treatment === 'outcome_summary')).toBe(false);
  });

  it('keeps a rejected Retry attempt outside ordinary provider history', () => {
    const responseJob = buildRetryRegenerateResponseJob({
      conversationId: 'conversation-1',
      playerTurn: { messageId: 'user-1', text: 'Try again.' },
      rejectedAttempt: {
        messageId: 'assistant-rejected',
        generationId: 'generation-rejected',
        text: 'Rejected full text.',
        summary: 'The prior answer repeated its final move.',
      },
      currentStateSummary: 'The room remains unchanged.',
      responseDetail: 'standard',
    });
    const result = compileRoleplayRecentHistory({
      messages: [
        message({ id: 'user-1', role: 'user', text: 'Try again.' }),
        message({ id: 'assistant-rejected', generationId: 'generation-rejected', role: 'assistant', text: 'Rejected full text.' }),
      ],
      responseJob,
      limit: 5,
      isLocalNotice,
    });

    expect(result.packet.providerMessages.map((entry) => entry.content)).not.toContain('Rejected full text.');
    expect(result.packet.receipts).toContainEqual(expect.objectContaining({
      messageId: 'assistant-rejected',
      responseJobSource: 'retry_contrast',
      sourceGenerationId: 'generation-rejected',
      generationMatchesResponseJobSource: true,
      includedInProviderHistory: false,
      reason: 'rejected_retry_attempt_not_accepted_history',
    }));
  });

  it('does not let an excluded Retry attempt suppress the latest accepted assistant history', () => {
    const responseJob = buildRetryRegenerateResponseJob({
      conversationId: 'conversation-1',
      playerTurn: { messageId: 'user-2', text: 'Try again.' },
      rejectedAttempt: {
        messageId: 'assistant-rejected',
        generationId: 'generation-rejected',
        text: 'Mara: "I will keep the lamp lit."',
        summary: 'The rejected response copied the same promise.',
      },
      currentStateSummary: 'The lamp remains lit.',
      responseDetail: 'standard',
    });
    const result = compileRoleplayRecentHistory({
      messages: [
        message({
          id: 'assistant-accepted',
          generationId: 'generation-accepted',
          role: 'assistant',
          text: 'Mara: "I will keep the lamp lit."',
        }),
        message({ id: 'user-2', role: 'user', text: 'Try again.' }),
        message({
          id: 'assistant-rejected',
          generationId: 'generation-rejected',
          role: 'assistant',
          text: 'Mara: "I will keep the lamp lit."',
        }),
      ],
      responseJob,
      limit: 5,
      isLocalNotice,
    });

    expect(result.packet.providerMessages.map((entry) => entry.content)).toContain('Mara: "I will keep the lamp lit."');
    expect(result.packet.receipts).toContainEqual(expect.objectContaining({
      messageId: 'assistant-accepted',
      treatment: 'exact_latest_assistant',
      includedInProviderHistory: true,
    }));
    expect(result.packet.receipts).toContainEqual(expect.objectContaining({
      messageId: 'assistant-rejected',
      responseJobSource: 'retry_contrast',
      includedInProviderHistory: false,
    }));
  });

  it('keeps a Continue tail in continue_anchor instead of duplicating it as ordinary history', () => {
    const responseJob = buildContinueAssistantTailResponseJob({
      conversationId: 'conversation-1',
      assistantAnchor: {
        messageId: 'assistant-tail',
        generationId: 'generation-tail',
        acceptedTextTail: 'Mara: "I have decided."',
      },
      priorUserMessageId: 'user-1',
      currentStateSummary: 'The room remains unchanged.',
      responseDetail: 'standard',
    });
    const result = compileRoleplayRecentHistory({
      messages: [
        message({ id: 'user-1', role: 'user', text: 'I wait. (I hope she decides.)' }),
        message({
          id: 'assistant-tail',
          generationId: 'generation-tail',
          role: 'assistant',
          text: 'Mara: "I have decided."',
        }),
      ],
      responseJob,
      limit: 5,
      isLocalNotice,
    });

    expect(result.packet.providerMessages.map((entry) => entry.content)).toEqual(['I wait.']);
    expect(result.packet.receipts).toContainEqual(expect.objectContaining({
      messageId: 'user-1',
      responseJobSource: 'continue_context',
      treatment: 'visible_user_projection',
      privateSpans: [expect.objectContaining({ content: 'I hope she decides.' })],
    }));
    expect(result.packet.receipts).toContainEqual(expect.objectContaining({
      messageId: 'assistant-tail',
      responseJobSource: 'continue_anchor',
      sourceGenerationId: 'generation-tail',
      generationMatchesResponseJobSource: true,
      includedInProviderHistory: false,
      treatment: 'exact_latest_assistant',
      reason: 'represented_in_continue_anchor_lane',
    }));
  });
});
