import { describe, expect, it } from 'vitest';

import { resolveRoleplayContinueTailAction } from './continue-tail-action';

describe('resolveRoleplayContinueTailAction', () => {
  it('routes an accepted assistant tail through continue_assistant_tail with prior user boundary context', () => {
    const action = resolveRoleplayContinueTailAction({
      messages: [
        { id: 'user-1', role: 'user', text: 'What happens next?' },
        {
          id: 'assistant-1',
          role: 'assistant',
          text: 'She looks over and starts to answer.',
          generationId: 'generation-assistant-1',
        },
      ],
    });

    expect(action).toMatchObject({
      kind: 'continue_assistant_tail',
      reason: 'accepted_assistant_tail',
      assistantMessageId: 'assistant-1',
      assistantGenerationId: 'generation-assistant-1',
      priorUserMessage: {
        id: 'user-1',
        role: 'user',
        text: 'What happens next?',
      },
    });
  });

  it('routes a latest user tail with a matching deleted assistant marker through normal_send recovery', () => {
    const action = resolveRoleplayContinueTailAction({
      messages: [
        { id: 'user-1', role: 'user', text: 'What happens next?', generationId: 'generation-user-1' },
      ],
      deletedAssistantRecovery: {
        deletedAssistantMessageId: 'assistant-deleted-1',
        deletedAssistantGenerationId: 'generation-deleted-1',
        sourceUserMessageId: 'user-1',
      },
    });

    expect(action).toMatchObject({
      kind: 'normal_send_deleted_assistant_recovery',
      reason: 'assistant_reply_deleted_latest_user_tail',
      deletedAssistantMessageId: 'assistant-deleted-1',
      deletedAssistantGenerationId: 'generation-deleted-1',
      visibleUserTail: {
        id: 'user-1',
        role: 'user',
        text: 'What happens next?',
        generationId: 'generation-user-1',
      },
    });
  });

  it('does not treat an ordinary latest user tail as Continue', () => {
    const action = resolveRoleplayContinueTailAction({
      messages: [
        { id: 'user-1', role: 'user', text: 'What happens next?' },
      ],
    });

    expect(action).toEqual({
      kind: 'unavailable',
      reason: 'latest_tail_user_authored',
    });
  });

  it('ignores local notice rows when selecting the latest roleplay tail', () => {
    const action = resolveRoleplayContinueTailAction({
      messages: [
        { id: 'user-1', role: 'user', text: 'What happens next?' },
        { id: 'assistant-1', role: 'assistant', text: 'She starts to answer.' },
        { id: 'notice-1', role: 'assistant', text: 'Local notice', localNotice: true },
      ],
    });

    expect(action.kind).toBe('continue_assistant_tail');
    if (action.kind === 'continue_assistant_tail') {
      expect(action.assistantMessageId).toBe('assistant-1');
    }
  });
});
