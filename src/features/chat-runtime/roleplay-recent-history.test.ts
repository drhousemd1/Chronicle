import { describe, expect, it } from 'vitest';
import type { Message } from '@/types';
import {
  buildContinueAssistantTailResponseJob,
  buildNormalSendResponseJob,
  buildRetryRegenerateResponseJob,
} from './roleplay-response-job';
import { compileRoleplayRecentHistory } from './roleplay-recent-history';
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

  it('preserves same-id user history when its text differs from the active player-turn lane', () => {
    const responseJob = buildNormalSendResponseJob({
      conversationId: 'conversation-1',
      playerTurn: { messageId: 'user-current', text: 'I step closer.' },
      currentStateSummary: 'The kitchen remains active.',
      responseDetail: 'standard',
    });
    const result = compileRoleplayRecentHistory({
      messages: [message({ id: 'user-current', role: 'user', text: 'I stop at the doorway.' })],
      responseJob,
      limit: 5,
      isLocalNotice,
    });

    expect(result.packet.providerMessages).toEqual([
      { role: 'user', content: 'I stop at the doorway.' },
    ]);
    expect(result.packet.receipts).toContainEqual(expect.objectContaining({
      messageId: 'user-current',
      responseJobSource: 'recent_history',
      includedInProviderHistory: true,
      reason: 'player_turn_id_matched_but_content_differed_preserved_in_history',
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
      'Mara: *She rests against the balcony rail.*',
      'I wait for the decision.',
      'Mara: *She finally chooses a direction.* "What do you do next?"',
    ]);
    expect(result.packet.receipts).toEqual(expect.arrayContaining([
      expect.objectContaining({ messageId: 'user-1', treatment: 'exact_user', includedInProviderHistory: true }),
      expect.objectContaining({
        messageId: 'assistant-old',
        treatment: 'suppressed_style_anchor',
        reason: 'repeated_assistant_phrase_removed',
        includedInProviderHistory: true,
        repeatedAnchors: expect.arrayContaining(['what do you do next?']),
      }),
      expect.objectContaining({
        messageId: 'assistant-latest',
        treatment: 'exact_latest_assistant',
        includedInProviderHistory: true,
      }),
    ]));
  });

  it('transforms older assistant history only from exact generation-matched authority decisions', () => {
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
      limit: 5,
      isLocalNotice,
    });

    const olderProviderMessage = result.packet.providerMessages[0];
    expect(olderProviderMessage).toEqual({
      role: 'assistant',
      content: [
        'Older assistant outcome summary:',
        '- Observed change: The user character has a visible tremor in one hand.',
        '- Character interpretation, not established fact: Mara suspects the user character is nervous.',
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
      reason: 'structured_source_authority_outcome_summary',
      includedInProviderHistory: true,
      transformedContent: olderProviderMessage.content,
      sourceAuthorityDecisionCount: 2,
      sourceAuthorityClasses: [
        'accepted_assistant_observable_change',
        'assistant_interpretation',
      ],
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
      content: 'Mara crosses the room without repeating herself.',
    });
    expect(result.packet.receipts).toContainEqual(expect.objectContaining({
      messageId: 'assistant-old',
      treatment: 'exact_assistant_history',
      reason: 'accepted_assistant_history',
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
        message({ id: 'user-1', role: 'user', text: 'I wait.' }),
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
