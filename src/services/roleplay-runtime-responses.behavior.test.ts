import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock('@/services/usage-tracking', () => ({
  trackAiUsageEvent: vi.fn(),
}));

vi.mock('@/services/api-usage-validation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/api-usage-validation')>();
  return {
    ...actual,
    trackApiValidationSnapshot: vi.fn(),
  };
});

import { supabase } from '@/integrations/supabase/client';
import { trackApiValidationSnapshot } from '@/services/api-usage-validation';
import { trackAiUsageEvent } from '@/services/usage-tracking';
import { generateRoleplayResponseStream } from '@/services/llm';
import type { ChatDebugRequestRecord, ChatDebugTrace } from '@/features/chat-debug/types';
import { createDefaultScenarioData, getHardcodedTestCharacters, now, uid } from '@/utils';

function makeSseResponse(lines: string[]): Response {
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream({
      start(controller) {
        for (const line of lines) {
          controller.enqueue(encoder.encode(`${line}\n\n`));
        }
        controller.close();
      },
    }),
    { status: 200, headers: { 'Content-Type': 'text/event-stream' } },
  );
}

async function collect(generator: AsyncGenerator<string, void, unknown>): Promise<string> {
  let text = '';
  for await (const chunk of generator) {
    text += chunk;
  }
  return text;
}

describe('generateRoleplayResponseStream Responses runtime behavior', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://chronicle.test');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'public-test-key');
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { access_token: 'session-token' } },
      error: null,
    } as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('sends API Call 1 through the Responses transport while preserving Chat-Completions-shaped browser SSE output', async () => {
    const appData = createDefaultScenarioData();
    const [aiCharacter, userCharacter] = getHardcodedTestCharacters();
    aiCharacter.name = 'Ashley';
    aiCharacter.controlledBy = 'AI';
    aiCharacter.location = 'kitchen';
    aiCharacter.scenePosition = 'standing beside the counter';
    userCharacter.name = 'James';
    userCharacter.controlledBy = 'User';
    userCharacter.location = 'kitchen';
    userCharacter.scenePosition = 'near the doorway';
    appData.characters = [aiCharacter, userCharacter];
    appData.uiSettings = {
      ...appData.uiSettings!,
      responseVerbosity: 'detailed',
    };
    appData.world.core.scenarioName = 'Runtime test';
    appData.conversations = [
      {
        id: 'conversation-1',
        title: 'Story',
        currentDay: 1,
        currentTimeOfDay: 'day',
        messages: [
          {
            id: uid('msg'),
            role: 'assistant',
            text: 'Ashley: "Stay close."',
            createdAt: now(),
          },
        ],
        createdAt: now(),
        updatedAt: now(),
      },
    ];

    const debugTrace: ChatDebugTrace = {
      version: 1,
      pipeline: 'direct',
      finalPath: 'responses',
      fallbackReason: null,
      roleplayContext: {
        conversationId: 'conversation-1',
        currentDay: 1,
        currentTimeOfDay: 'day',
        activeSceneTitle: null,
        activeSceneTags: [],
        aiCharacterNames: ['Ashley'],
        userCharacterNames: ['James'],
        characterSceneStates: [],
      },
      latestUserTurnPreview: 'I step toward her.',
      recentWindowCount: 1,
      supportingExcerpts: [],
      planner: {
        usedFallback: false,
        failureReason: null,
        plan: {
          focusCharacter: null,
          allowedSpeakers: [],
          maxSpeakerBlocks: 1,
          directQuestionsToAnswer: [],
          mentionedAiCharacters: [],
          immediateSceneFocus: '',
          mustInclude: [],
          mustAvoid: [],
          continuityNotes: [],
          sceneStateFacts: [],
          formattingNotes: [],
        },
      },
      writer: {
        temperature: 0.6,
        draftPreview: 'Ashley: "Move closer."',
      },
      validator: {
        approved: true,
        issues: [],
        usedRevision: false,
        usedWriterDraftFallback: false,
        failureReason: null,
        revisedPreview: '',
      },
      normalization: {
        changed: false,
      },
      modelRequest: {
        endpoint: 'https://api.x.ai/v1/responses',
        method: 'POST',
        capturedAt: 123,
        requestBody: { store: false, reasoning: { effort: 'medium' } },
        responseUsage: {
          input_tokens: 100,
          output_tokens: 20,
          total_tokens: 120,
          reasoning_tokens: 8,
        },
      },
      notes: [],
    };
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(makeSseResponse([
      'data: {"choices":[{"delta":{"content":"Ashley: "}}]}',
      'data: {"choices":[{"delta":{"content":"\\"Move closer.\\""}}]}',
      `data: ${JSON.stringify({ chronicle_debug_trace: debugTrace })}`,
      'data: [DONE]',
    ]));
    const requestPayloads: ChatDebugRequestRecord[] = [];
    const debugTraces: ChatDebugTrace[] = [];

    const text = await collect(generateRoleplayResponseStream(
      appData,
      'conversation-1',
      'I step toward her.',
      'grok-4.3',
      1,
      'day',
      [],
      true,
      false,
      2,
      null,
      {
        debugTrace: true,
        onRequestPayload: (request) => requestPayloads.push(request),
        onDebugTrace: (trace) => debugTraces.push(trace),
      },
    ));

    expect(text).toBe('Ashley: "Move closer."');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://chronicle.test/functions/v1/chat',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer session-token',
          apikey: 'public-test-key',
        }),
      }),
    );

    const [, fetchInit] = fetchMock.mock.calls[0];
    const browserBody = JSON.parse(String(fetchInit?.body));
    expect(browserBody).toMatchObject({
      modelId: 'grok-4.3',
      stream: true,
      pipeline: 'direct',
      providerTransport: 'responses',
      reasoningEffort: 'medium',
      store: false,
      max_tokens: 3072,
      debugTrace: true,
    });
    expect(browserBody.roleplayContext.characterSceneStates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Ashley', location: 'kitchen', scenePosition: 'standing beside the counter' }),
        expect.objectContaining({ name: 'James', location: 'kitchen', scenePosition: 'near the doorway' }),
      ]),
    );

    expect(requestPayloads).toHaveLength(1);
    expect(requestPayloads[0].modelRequest).toMatchObject({
      endpoint: 'https://api.x.ai/v1/responses',
      method: 'POST',
      requestBody: {
        model: 'grok-4.3',
        stream: true,
        store: false,
        reasoning: { effort: 'medium' },
        max_output_tokens: 3072,
      },
    });
    expect(requestPayloads[0].modelRequest?.requestBody).toHaveProperty('input');
    expect(requestPayloads[0].modelRequest?.requestBody).not.toHaveProperty('messages');
    expect(debugTraces).toEqual([debugTrace]);
    expect(trackApiValidationSnapshot).toHaveBeenCalledWith(expect.objectContaining({
      eventKey: 'validation.call1.chat_payload',
      apiCallGroup: 'call_1',
    }));
    expect(trackAiUsageEvent).toHaveBeenCalledWith(expect.objectContaining({
      eventType: 'chat_call_1',
      metadata: expect.objectContaining({
        status: 'ok',
        providerTransport: 'responses',
        reasoningEffort: 'medium',
        store: false,
        providerReasoningTokens: 8,
      }),
    }));
  });
});
