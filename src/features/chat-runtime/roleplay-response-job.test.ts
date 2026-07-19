import { describe, expect, it } from 'vitest';

import {
  buildContinueAssistantTailResponseJob,
  buildDeletedAssistantRecoveryResponseJob,
  buildNormalSendResponseJob,
  buildRetryRegenerateResponseJob,
} from './roleplay-response-job';

describe('RoleplayResponseJob contract', () => {
  it('keeps normal send, retry, and continue as distinct first-class runtime jobs', () => {
    const normalSend = buildNormalSendResponseJob({
      conversationId: 'conversation-1',
      playerTurn: { messageId: 'user-1', text: 'I step closer.' },
      currentStateSummary: 'Ashley and James are in the kitchen.',
      responseDetail: 'detailed',
    });

    expect(normalSend).toMatchObject({
      mode: 'normal_send',
      purpose: 'respond_to_player_turn',
      playerTurn: { messageId: 'user-1', text: 'I step closer.' },
      responseDetail: 'detailed',
      historyPolicy: { strategy: 'standard_recent_history' },
      modeData: { kind: 'normal_send' },
    });
    expect(normalSend.finalUserLanes.map((lane) => lane.kind)).toEqual([
      'player_turn',
      'current_state',
      'response_detail',
    ]);
    expect(normalSend.finalUserLanes.map((lane) => [lane.kind, lane.sourceRole, lane.authority])).toEqual([
      ['player_turn', 'user', 'player_turn'],
      ['current_state', 'runtime', 'state'],
      ['response_detail', 'runtime', 'control'],
    ]);

    const retry = buildRetryRegenerateResponseJob({
      conversationId: 'conversation-1',
      playerTurn: { messageId: 'user-1', text: 'I step closer.' },
      rejectedAttempt: {
        messageId: 'assistant-1',
        text: 'Full rejected assistant text that should stay debug-only.',
        summary: 'The rejected answer repeated the same final question.',
      },
      currentStateSummary: 'Ashley and James are in the kitchen.',
      responseDetail: 'detailed',
    });

    expect(retry).toMatchObject({
      mode: 'retry_regenerate',
      purpose: 'replace_rejected_assistant_response',
      playerTurn: { messageId: 'user-1', text: 'I step closer.' },
      historyPolicy: { strategy: 'exclude_rejected_attempt' },
      modeData: {
        kind: 'retry_regenerate',
        rejectedMessageId: 'assistant-1',
        rejectedAttemptSummary: 'The rejected answer repeated the same final question.',
      },
    });
    expect(retry.finalUserLanes.find((lane) => lane.kind === 'retry_rejection')?.content)
      .toContain('The rejected answer repeated the same final question.');
    expect(retry.finalUserLanes.find((lane) => lane.kind === 'retry_rejection')?.content)
      .toContain('Change at least one response function, opening move, dialogue angle, action progression, or final-question shape.');
    expect(retry.finalUserLanes.find((lane) => lane.kind === 'retry_rejection')?.authority)
      .toBe('control');
    expect(retry.finalUserLanes.map((lane) => lane.content).join('\n'))
      .not.toContain('Full rejected assistant text that should stay debug-only.');

    const continuation = buildContinueAssistantTailResponseJob({
      conversationId: 'conversation-1',
      assistantAnchor: {
        messageId: 'assistant-2',
        generationId: 'generation-assistant-2',
        acceptedTextTail: 'Ashley looks up from the counter.',
      },
      priorUserMessageId: 'user-2',
      currentStateSummary: 'Ashley and James are in the kitchen.',
      responseDetail: 'concise',
    });

    expect(continuation).toMatchObject({
      mode: 'continue_assistant_tail',
      purpose: 'extend_accepted_assistant_response',
      playerTurn: null,
      historyPolicy: { strategy: 'anchor_on_accepted_assistant_tail' },
      modeData: {
        kind: 'continue_assistant_tail',
        assistantMessageId: 'assistant-2',
        assistantGenerationId: 'generation-assistant-2',
        priorUserMessageId: 'user-2',
      },
    });
    expect(continuation.finalUserLanes.some((lane) => lane.kind === 'player_turn')).toBe(false);
    expect(continuation.finalUserLanes.find((lane) => lane.kind === 'continue_anchor')?.content)
      .toBe('Ashley looks up from the counter.');
    expect(continuation.finalUserLanes.find((lane) => lane.kind === 'continue_anchor')?.authority)
      .toBe('state');
  });

  it('models deleted-assistant recovery as a normal_send variant without creating a dummy user row', () => {
    const recovery = buildDeletedAssistantRecoveryResponseJob({
      conversationId: 'conversation-1',
      visibleUserTail: { messageId: 'user-2', text: 'What does she do next?' },
      deletedAssistantMessageId: 'assistant-deleted-1',
      deletedAssistantGenerationId: 'generation-deleted-1',
      currentStateSummary: 'The latest visible message is user-authored because the assistant reply was deleted.',
      responseDetail: 'detailed',
    });

    expect(recovery.mode).toBe('normal_send');
    expect(recovery.purpose).toBe('recover_after_deleted_assistant_response');
    expect(recovery.playerTurn).toEqual({ messageId: 'user-2', text: 'What does she do next?' });
    expect(recovery.modeData).toEqual({
      kind: 'normal_send',
      variant: 'deleted_assistant_recovery',
      deletedAssistantMessageId: 'assistant-deleted-1',
      deletedAssistantGenerationId: 'generation-deleted-1',
      createsNewUserMessage: false,
      tailActionReason: 'assistant_reply_deleted_latest_user_tail',
    });
    expect(recovery.finalUserLanes.find((lane) => lane.kind === 'player_turn')?.content)
      .toBe('What does she do next?');
    expect(recovery.finalUserLanes.map((lane) => lane.kind)).not.toContain('continue_anchor');
  });

  it('keeps established-fact notes outside the player-turn lane for normal send', () => {
    const establishedFactNote = '[ESTABLISHED FACT NOTE: User wrote content for AI character(s) in this message. That content is already true in the scene -- do not re-narrate it. Continue the story from after those events.]';
    const normalSend = buildNormalSendResponseJob({
      conversationId: 'conversation-1',
      playerTurn: { messageId: 'user-3', text: 'Sarah: "Keep your hands where I can see them."' },
      establishedFactNote,
      currentStateSummary: 'Kitchen scene remains active.',
      responseDetail: 'detailed',
    });

    expect(normalSend.finalUserLanes.map((lane) => lane.kind)).toEqual([
      'player_turn',
      'established_fact_note',
      'current_state',
      'response_detail',
    ]);
    expect(normalSend.finalUserLanes.find((lane) => lane.kind === 'player_turn')).toMatchObject({
      sourceRole: 'user',
      authority: 'player_turn',
      content: 'Sarah: "Keep your hands where I can see them."',
    });
    expect(normalSend.finalUserLanes.find((lane) => lane.kind === 'established_fact_note')).toMatchObject({
      sourceRole: 'runtime',
      authority: 'state',
      modelFacing: true,
      content: establishedFactNote,
    });
  });

  it('keeps retry established facts and rejected attempts out of the player-turn lane', () => {
    const establishedFactNote = '[ESTABLISHED FACT NOTE: User wrote content for AI character(s) in this message. That content is already true in the scene -- do not re-narrate it. Continue the story from after those events.]';
    const fullRejectedText = 'Full rejected assistant text that should remain debug-only and never become model-facing retry context.';
    const retry = buildRetryRegenerateResponseJob({
      conversationId: 'conversation-1',
      playerTurn: { messageId: 'user-4', text: 'Sarah: "Keep your hands where I can see them."' },
      establishedFactNote,
      rejectedAttempt: {
        messageId: 'assistant-3',
        text: fullRejectedText,
        summary: 'The rejected answer repeated the same final question and should be meaningfully changed.',
      },
      currentStateSummary: 'Kitchen scene remains active.',
      responseDetail: 'detailed',
    } as Parameters<typeof buildRetryRegenerateResponseJob>[0] & { establishedFactNote: string });

    expect(retry.finalUserLanes.map((lane) => lane.kind)).toEqual([
      'player_turn',
      'established_fact_note',
      'retry_rejection',
      'current_state',
      'response_detail',
    ]);
    expect(retry.finalUserLanes.find((lane) => lane.kind === 'player_turn')).toMatchObject({
      sourceRole: 'user',
      authority: 'player_turn',
      content: 'Sarah: "Keep your hands where I can see them."',
    });
    expect(retry.finalUserLanes.find((lane) => lane.kind === 'established_fact_note')).toMatchObject({
      sourceRole: 'runtime',
      authority: 'state',
      modelFacing: true,
      content: establishedFactNote,
    });
    expect(retry.finalUserLanes.find((lane) => lane.kind === 'retry_rejection')).toMatchObject({
      sourceRole: 'assistant',
      authority: 'control',
      modelFacing: true,
    });
    expect(retry.finalUserLanes.find((lane) => lane.kind === 'retry_rejection')?.content)
      .toContain('The rejected answer repeated the same final question and should be meaningfully changed.');
    expect(retry.finalUserLanes.find((lane) => lane.kind === 'retry_rejection')?.content)
      .toContain('Change at least one response function, opening move, dialogue angle, action progression, or final-question shape.');
    expect(retry.modeData).toMatchObject({
      kind: 'retry_regenerate',
      requiredDifference: 'Change at least one response function, opening move, dialogue angle, action progression, or final-question shape.',
      preserveRule: 'Preserve established facts and user-controlled actions; keep the full rejected assistant text debug-only by default.',
    });
    expect(retry.finalUserLanes.map((lane) => lane.content).join('\n')).not.toContain(fullRejectedText);
  });
});
