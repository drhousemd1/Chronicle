export type RoleplayContinueTailMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  generationId?: string;
  localNotice?: boolean;
};

export type RoleplayDeletedAssistantRecoveryMarker = {
  deletedAssistantMessageId: string;
  deletedAssistantGenerationId?: string;
  sourceUserMessageId: string;
};

export type RoleplayContinueTailAction =
  | {
      kind: 'continue_assistant_tail';
      reason: 'accepted_assistant_tail';
      assistantMessage: RoleplayContinueTailMessage;
      assistantMessageId: string;
      assistantGenerationId: string;
      priorUserMessage: RoleplayContinueTailMessage | null;
    }
  | {
      kind: 'normal_send_deleted_assistant_recovery';
      reason: 'assistant_reply_deleted_latest_user_tail';
      visibleUserTail: RoleplayContinueTailMessage;
      deletedAssistantMessageId: string;
      deletedAssistantGenerationId?: string;
    }
  | {
      kind: 'unavailable';
      reason: 'no_roleplay_tail' | 'latest_tail_user_authored' | 'latest_tail_unusable_text';
    };

export type ResolveRoleplayContinueTailActionInput = {
  messages: RoleplayContinueTailMessage[];
  deletedAssistantRecovery?: RoleplayDeletedAssistantRecoveryMarker | null;
};

function hasUsableText(message: RoleplayContinueTailMessage): boolean {
  return message.text.trim().length > 0;
}

function findPriorUserMessage(
  messages: RoleplayContinueTailMessage[],
  latestIndex: number,
): RoleplayContinueTailMessage | null {
  for (let index = latestIndex - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role === 'user' && hasUsableText(message)) {
      return message;
    }
  }
  return null;
}

export function resolveRoleplayContinueTailAction({
  messages,
  deletedAssistantRecovery = null,
}: ResolveRoleplayContinueTailActionInput): RoleplayContinueTailAction {
  const roleplayMessages = messages.filter((message) => !message.localNotice);
  const latestIndex = roleplayMessages.length - 1;
  const latest = latestIndex >= 0 ? roleplayMessages[latestIndex] : undefined;

  if (!latest) {
    return {
      kind: 'unavailable',
      reason: 'no_roleplay_tail',
    };
  }

  if (!hasUsableText(latest)) {
    return {
      kind: 'unavailable',
      reason: 'latest_tail_unusable_text',
    };
  }

  if (latest.role === 'assistant') {
    return {
      kind: 'continue_assistant_tail',
      reason: 'accepted_assistant_tail',
      assistantMessage: latest,
      assistantMessageId: latest.id,
      assistantGenerationId: latest.generationId || latest.id,
      priorUserMessage: findPriorUserMessage(roleplayMessages, latestIndex),
    };
  }

  if (
    latest.role === 'user'
    && deletedAssistantRecovery
    && deletedAssistantRecovery.sourceUserMessageId === latest.id
  ) {
    return {
      kind: 'normal_send_deleted_assistant_recovery',
      reason: 'assistant_reply_deleted_latest_user_tail',
      visibleUserTail: latest,
      deletedAssistantMessageId: deletedAssistantRecovery.deletedAssistantMessageId,
      deletedAssistantGenerationId: deletedAssistantRecovery.deletedAssistantGenerationId,
    };
  }

  return {
    kind: 'unavailable',
    reason: 'latest_tail_user_authored',
  };
}
