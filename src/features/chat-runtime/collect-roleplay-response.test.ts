import { describe, expect, it, vi } from 'vitest';

import type { ChatDebugRequestRecord, ChatDebugTrace } from '@/features/chat-debug/types';
import type { ScenarioData } from '@/types';
import { buildNormalSendResponseJob } from './roleplay-response-job';
import {
  collectRoleplayResponse,
  readRoleplayRequestDebugFromError,
} from './collect-roleplay-response';

const appData = {
  conversations: [{ id: 'conversation-1', messages: [] }],
} as unknown as ScenarioData;

const trace = { requestId: 'trace-1' } as unknown as ChatDebugTrace;
const request = { id: 'request-1' } as unknown as ChatDebugRequestRecord;

const sanitizeAssistantOutput = (text: string) =>
  text
    .replace(/\[UPDATE:[^\]]+\]/g, '')
    .trim();

describe('collectRoleplayResponse', () => {
  it('collects chunks, updates optional streaming UI, and returns sanitized final text', async () => {
    const onStreamingContent = vi.fn();
    const onFormattedStreamingContent = vi.fn();
    const generateStream = vi.fn(async function* (...args: any[]) {
      const options = args[11];
      options?.onDebugTrace?.(trace);
      options?.onRequestPayload?.(request);
      yield 'Hello';
      yield ' there [UPDATE:Ashley.location=cabin]';
    });
    const sourcePlaceholderMap = { 'Character A': 'Ashley' };

    const result = await collectRoleplayResponse({
      appData,
      conversationId: 'conversation-1',
      userMessage: 'User text',
      modelId: 'grok-test',
      currentDay: 2,
      currentTimeOfDay: 'day',
      memories: [],
      memoriesEnabled: true,
      debugTrace: true,
      placeholderMap: sourcePlaceholderMap,
      knownCharacterNames: new Set(['Ashley']),
      sanitizeAssistantOutput,
      streamToUi: true,
      onStreamingContent,
      onFormattedStreamingContent,
      generateStream,
    });

    expect(result.cleanedText).toBe('Hello there');
    expect(result.debugTrace).toBe(trace);
    expect(result.call1Request).toBe(request);
    expect(result.placeholderMap).not.toBe(sourcePlaceholderMap);
    expect(sourcePlaceholderMap).toEqual({ 'Character A': 'Ashley' });
    expect(onStreamingContent).toHaveBeenCalledWith('Hello');
    expect(onStreamingContent).toHaveBeenCalledWith('Hello there [UPDATE:Ashley.location=cabin]');
    expect(onFormattedStreamingContent).toHaveBeenLastCalledWith('Hello there');
    expect(generateStream).toHaveBeenCalledWith(
      appData,
      'conversation-1',
      'User text',
      'grok-test',
      2,
      'day',
      [],
      true,
      undefined,
      undefined,
      undefined,
      expect.objectContaining({ debugTrace: true }),
    );
  });

  it('does not call streaming UI callbacks when streamToUi is false', async () => {
    const onStreamingContent = vi.fn();
    const onFormattedStreamingContent = vi.fn();
    const generateStream = vi.fn(async function* () {
      yield 'Hidden';
      yield ' stream';
    });

    const result = await collectRoleplayResponse({
      appData,
      conversationId: 'conversation-1',
      userMessage: 'User text',
      modelId: 'grok-test',
      placeholderMap: {},
      knownCharacterNames: new Set(),
      sanitizeAssistantOutput,
      streamToUi: false,
      onStreamingContent,
      onFormattedStreamingContent,
      generateStream,
    });

    expect(result.cleanedText).toBe('Hidden stream');
    expect(onStreamingContent).not.toHaveBeenCalled();
    expect(onFormattedStreamingContent).not.toHaveBeenCalled();
  });

  it('passes a response job through to the stream generator options', async () => {
    const responseJob = buildNormalSendResponseJob({
      conversationId: 'conversation-1',
      playerTurn: {
        messageId: 'user-1',
        text: 'User text',
      },
      currentStateSummary: 'Kitchen scene remains active.',
      responseDetail: 'standard',
    });
    const generateStream = vi.fn(async function* (..._args: any[]) {
      yield 'Job routed';
    });

    const result = await collectRoleplayResponse({
      appData,
      conversationId: 'conversation-1',
      userMessage: 'User text',
      responseJob,
      modelId: 'grok-test',
      placeholderMap: {},
      knownCharacterNames: new Set(),
      sanitizeAssistantOutput,
      streamToUi: false,
      generateStream,
    });

    expect(result.cleanedText).toBe('Job routed');
    expect(generateStream).toHaveBeenCalledTimes(1);
    expect(generateStream.mock.calls[0][2]).toBe('User text');
    expect(generateStream.mock.calls[0][11]).toEqual(expect.objectContaining({
      responseJob,
    }));
  });

  it('attaches debug metadata to thrown provider errors', async () => {
    const providerError = new Error('provider blocked');
    const fallbackTrace = { requestId: 'fallback-trace' } as unknown as ChatDebugTrace;
    const fallbackRequest = { id: 'fallback-request' } as unknown as ChatDebugRequestRecord;
    const generateStream = vi.fn(async function* (...args: any[]) {
      const options = args[11];
      options?.onDebugTrace?.(trace);
      options?.onRequestPayload?.(request);
      throw providerError;
      yield '';
    });

    await expect(collectRoleplayResponse({
      appData,
      conversationId: 'conversation-1',
      userMessage: 'User text',
      modelId: 'grok-test',
      placeholderMap: {},
      knownCharacterNames: new Set(),
      sanitizeAssistantOutput,
      debugTrace: true,
      generateStream,
    })).rejects.toBe(providerError);

    expect(readRoleplayRequestDebugFromError(providerError, fallbackTrace, fallbackRequest)).toEqual({
      trace,
      call1Request: request,
    });
  });

  it('falls back to pending debug metadata when an error has no collector metadata', () => {
    const fallbackTrace = { requestId: 'fallback-trace' } as unknown as ChatDebugTrace;
    const fallbackRequest = { id: 'fallback-request' } as unknown as ChatDebugRequestRecord;

    expect(readRoleplayRequestDebugFromError(new Error('plain'), fallbackTrace, fallbackRequest)).toEqual({
      trace: fallbackTrace,
      call1Request: fallbackRequest,
    });
  });
});
