import type { Memory, Scene, ScenarioData, TimeOfDay } from '@/types';
import type { ChatDebugRequestRecord, ChatDebugTrace } from '@/features/chat-debug/types';
import type { RoleplayResponseJob } from '@/features/chat-runtime/roleplay-response-job';
import type { RoleplayUserStateAuthorityDecision } from '@/features/chat-runtime/roleplay-user-state-authority';
import {
  generateRoleplayResponseStream,
  type GenerateRoleplayResponseStreamOptions,
} from '@/services/llm';
import {
  normalizePlaceholderNames,
  type PlaceholderNameMap,
} from '@/services/placeholder-name-guard';

type RoleplayStreamGenerator = (
  appData: ScenarioData,
  conversationId: string,
  userMessage: string,
  modelId: string,
  currentDay?: number,
  currentTimeOfDay?: TimeOfDay,
  memories?: Memory[],
  memoriesEnabled?: boolean,
  isRegeneration?: boolean,
  sessionMessageCount?: number,
  activeScene?: Scene | null,
  options?: GenerateRoleplayResponseStreamOptions,
) => AsyncGenerator<string, void, unknown>;

export interface CollectRoleplayResponseOptions {
  appData: ScenarioData;
  conversationId: string;
  userMessage: string;
  responseJob?: RoleplayResponseJob;
  userStateAuthorityDecisions?: RoleplayUserStateAuthorityDecision[];
  modelId: string;
  currentDay?: number;
  currentTimeOfDay?: TimeOfDay;
  memories?: Memory[];
  memoriesEnabled?: boolean;
  isRegeneration?: boolean;
  sessionMessageCount?: number;
  activeScene?: Scene | null;
  debugTrace?: boolean;
  placeholderMap: PlaceholderNameMap;
  knownCharacterNames: Set<string>;
  sanitizeAssistantOutput: (text: string) => string;
  streamToUi?: boolean;
  onStreamingContent?: (text: string) => void;
  onFormattedStreamingContent?: (text: string) => void;
  generateStream?: RoleplayStreamGenerator;
}

export interface CollectedRoleplayResponse {
  cleanedText: string;
  debugTrace: ChatDebugTrace | null;
  call1Request: ChatDebugRequestRecord | null;
  placeholderMap: PlaceholderNameMap;
}

export function attachRoleplayRequestDebugToError(
  error: unknown,
  trace: ChatDebugTrace | null,
  request: ChatDebugRequestRecord | null,
) {
  if (!error || typeof error !== 'object') return;
  const carrier = error as Record<string, unknown>;
  carrier.__chronicleDebugAttempted = true;
  carrier.__chronicleDebugTrace = trace ?? null;
  carrier.__chronicleCall1Request = request ?? null;
}

export function readRoleplayRequestDebugFromError(
  error: unknown,
  fallbackTrace: ChatDebugTrace | null,
  fallbackRequest: ChatDebugRequestRecord | null,
) {
  const carrier = error && typeof error === 'object' ? error as Record<string, unknown> : {};
  const hasAttemptDebug = carrier.__chronicleDebugAttempted === true;
  return {
    trace: hasAttemptDebug
      ? (carrier.__chronicleDebugTrace as ChatDebugTrace | null | undefined) ?? null
      : fallbackTrace,
    call1Request: hasAttemptDebug
      ? (carrier.__chronicleCall1Request as ChatDebugRequestRecord | null | undefined) ?? null
      : fallbackRequest,
  };
}

export async function collectRoleplayResponse({
  appData,
  conversationId,
  userMessage,
  responseJob,
  userStateAuthorityDecisions,
  modelId,
  currentDay,
  currentTimeOfDay,
  memories,
  memoriesEnabled,
  isRegeneration,
  sessionMessageCount,
  activeScene,
  debugTrace = false,
  placeholderMap,
  knownCharacterNames,
  sanitizeAssistantOutput,
  streamToUi = false,
  onStreamingContent,
  onFormattedStreamingContent,
  generateStream = generateRoleplayResponseStream,
}: CollectRoleplayResponseOptions): Promise<CollectedRoleplayResponse> {
  let responseText = '';
  let responseDebugTrace: ChatDebugTrace | null = null;
  let responseCall1Request: ChatDebugRequestRecord | null = null;
  const candidatePlaceholderMap: PlaceholderNameMap = { ...placeholderMap };

  const stream = generateStream(
    appData,
    conversationId,
    userMessage,
    modelId,
    currentDay,
    currentTimeOfDay,
    memories,
    memoriesEnabled,
    isRegeneration,
    sessionMessageCount,
    activeScene,
    {
      debugTrace,
      responseJob,
      userStateAuthorityDecisions,
      onDebugTrace: (trace) => {
        responseDebugTrace = trace;
      },
      onRequestPayload: (request) => {
        responseCall1Request = request;
      },
    },
  );

  try {
    for await (const chunk of stream) {
      responseText += chunk;

      if (streamToUi) {
        onStreamingContent?.(responseText);
        const formatted = sanitizeAssistantOutput(responseText);
        const { normalizedText } = normalizePlaceholderNames(
          formatted,
          knownCharacterNames,
          candidatePlaceholderMap,
        );
        onFormattedStreamingContent?.(normalizedText);
      }
    }
  } catch (error) {
    attachRoleplayRequestDebugToError(error, responseDebugTrace, responseCall1Request);
    throw error;
  }

  const cleanedText = normalizePlaceholderNames(
    sanitizeAssistantOutput(responseText),
    knownCharacterNames,
    candidatePlaceholderMap,
  ).normalizedText;

  return {
    cleanedText,
    debugTrace: responseDebugTrace,
    call1Request: responseCall1Request,
    placeholderMap: candidatePlaceholderMap,
  };
}
