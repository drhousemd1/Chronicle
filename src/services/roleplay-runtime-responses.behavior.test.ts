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
import { buildNormalSendResponseJob } from '@/features/chat-runtime/roleplay-response-job';
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
    expect(browserBody.roleplayKnowledgeVisibilityFacts).toEqual(expect.arrayContaining([
      expect.objectContaining({
        factId: `current-state:${aiCharacter.id}:location`,
        characterId: aiCharacter.id,
        sourceId: `effective-character:${aiCharacter.id}:location`,
        source: 'current_state',
        text: 'kitchen',
        availability: 'visible_now',
        disposition: 'include',
      }),
      expect.objectContaining({
        factId: `current-state:${userCharacter.id}:location`,
        characterId: userCharacter.id,
        text: 'kitchen',
      }),
    ]));

    expect(requestPayloads).toHaveLength(1);
    expect(requestPayloads[0].roleplayKnowledgeVisibilityFacts).toEqual(
      browserBody.roleplayKnowledgeVisibilityFacts,
    );
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
    expect(requestPayloads[0].modelRequest?.requestBody).not.toHaveProperty(
      'roleplayKnowledgeVisibilityFacts',
    );
    expect(requestPayloads[0].modelRequest?.requestBody).toMatchObject({
      input: browserBody.messages,
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

  it('captures response-job lane metadata on the API Call 1 debug request', async () => {
    const appData = createDefaultScenarioData();
    const [aiCharacter, userCharacter] = getHardcodedTestCharacters();
    aiCharacter.name = 'Ashley';
    aiCharacter.controlledBy = 'AI';
    userCharacter.name = 'James';
    userCharacter.controlledBy = 'User';
    appData.characters = [aiCharacter, userCharacter];
    appData.conversations = [
      {
        id: 'conversation-1',
        title: 'Story',
        currentDay: 1,
        currentTimeOfDay: 'day',
        messages: [
          {
            id: 'message-user-1',
            role: 'user',
            text: 'I step closer.',
            createdAt: now(),
          },
        ],
        createdAt: now(),
        updatedAt: now(),
      },
    ];
    const responseJob = buildNormalSendResponseJob({
      conversationId: 'conversation-1',
      playerTurn: {
        messageId: 'message-user-1',
        text: 'I step closer.',
      },
      currentStateSummary: 'Kitchen scene remains active.',
      responseDetail: 'detailed',
    });

    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(makeSseResponse([
      'data: {"choices":[{"delta":{"content":"Ashley: "}}]}',
      'data: {"choices":[{"delta":{"content":"\\"Come here.\\""}}]}',
      'data: [DONE]',
    ]));
    const requestPayloads: ChatDebugRequestRecord[] = [];

    await collect(generateRoleplayResponseStream(
      appData,
      'conversation-1',
      'legacy fallback user text',
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
        responseJob,
        onRequestPayload: (request) => requestPayloads.push(request),
      },
    ));

    const [, fetchInit] = fetchMock.mock.calls[0];
    const browserBody = JSON.parse(String(fetchInit?.body));
    expect(browserBody.responseJob).toEqual(responseJob);
    expect(browserBody.finalUserLaneEvidence).toEqual([
      expect.objectContaining({
        id: 'player_turn',
        kind: 'player_turn',
        sourceRole: 'user',
        authority: 'player_turn',
        modelFacing: true,
        contentLength: 'I step closer.'.length,
        contentPreview: 'I step closer.',
      }),
      expect.objectContaining({
        id: 'current_state',
        kind: 'current_state',
        sourceRole: 'runtime',
        authority: 'state',
        modelFacing: true,
      }),
      expect.objectContaining({
        id: 'response_detail',
        kind: 'response_detail',
        sourceRole: 'runtime',
        authority: 'control',
        modelFacing: true,
      }),
    ]);
    expect(requestPayloads[0].requestBody).toMatchObject({
      responseJob,
      finalUserLaneEvidence: browserBody.finalUserLaneEvidence,
      recentHistoryPacket: {
        providerMessages: [],
        receipts: [
          expect.objectContaining({
            messageId: 'message-user-1',
            responseJobSource: 'player_turn',
            alsoRenderedInFinalUserLane: 'player_turn',
            treatment: 'exact_user',
            reason: 'exact_user_turn_represented_in_higher_authority_player_lane',
            includedInProviderHistory: false,
          }),
        ],
        suppressedStyleAnchors: [],
      },
    });
    expect(browserBody.roleplaySourceReceipts).toEqual(expect.arrayContaining([
      expect.objectContaining({ surface: 'roleplay_core', modelFacing: true }),
      expect.objectContaining({ surface: 'story_world', modelFacing: true }),
      expect.objectContaining({ surface: 'player_turn', authority: 'highest', modelFacing: true }),
      expect.objectContaining({ surface: 'current_state', authority: 'high', modelFacing: true }),
      expect.objectContaining({ surface: 'execution_brief', authority: 'high', modelFacing: true }),
      expect.objectContaining({
        surface: 'debug_roleplay_context',
        authority: 'debug_only',
        modelFacing: false,
      }),
    ]));
    expect(requestPayloads[0].roleplaySourceReceipts).toEqual(browserBody.roleplaySourceReceipts);
    expect(browserBody.roleplayDuplicateSourceMetrics).toEqual(expect.arrayContaining([
      expect.objectContaining({
        surfaces: expect.arrayContaining(['recent_user_history', 'player_turn']),
        modelFacingCount: 1,
      }),
    ]));
    expect(requestPayloads[0].roleplayDuplicateSourceMetrics)
      .toEqual(browserBody.roleplayDuplicateSourceMetrics);
    expect(browserBody.roleplaySourceReceiptCoverage).not.toContainEqual(expect.objectContaining({
      status: 'missing_provider_text',
    }));
    expect(browserBody.roleplayProviderSectionCoverage).not.toContainEqual(expect.objectContaining({
      status: 'missing_source_receipt',
    }));
    expect(requestPayloads[0].roleplaySourceReceiptCoverage)
      .toEqual(browserBody.roleplaySourceReceiptCoverage);
    expect(requestPayloads[0].roleplayProviderSectionCoverage)
      .toEqual(browserBody.roleplayProviderSectionCoverage);
    expect(requestPayloads[0].modelRequest?.requestBody).not.toHaveProperty('roleplaySourceReceipts');
    expect(requestPayloads[0].modelRequest?.requestBody).not.toHaveProperty('roleplayDuplicateSourceMetrics');
    expect(requestPayloads[0].modelRequest?.requestBody).not.toHaveProperty('roleplaySourceReceiptCoverage');
    expect(requestPayloads[0].modelRequest?.requestBody).not.toHaveProperty('roleplayProviderSectionCoverage');
    expect(browserBody.messages.at(-1).content).toContain('[player_turn | user | player_turn | model-facing]');
    expect(browserBody.messages.at(-1).content).not.toContain('legacy fallback user text');
  });

  it('keeps established-fact notes separate from player-authored text in API Call 1 rendering', async () => {
    const appData = createDefaultScenarioData();
    appData.conversations = [
      {
        id: 'conversation-1',
        title: 'Story',
        currentDay: 1,
        currentTimeOfDay: 'day',
        messages: [],
        createdAt: now(),
        updatedAt: now(),
      },
    ];
    const establishedFactNote = '[ESTABLISHED FACT NOTE: User wrote content for AI character(s) in this message. That content is already true in the scene -- do not re-narrate it. Continue the story from after those events.]';
    const responseJob = buildNormalSendResponseJob({
      conversationId: 'conversation-1',
      playerTurn: {
        messageId: 'message-user-2',
        text: 'Sarah: "Keep your hands where I can see them."',
      },
      establishedFactNote,
      currentStateSummary: 'Kitchen scene remains active.',
      responseDetail: 'detailed',
    });

    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(makeSseResponse([
      'data: {"choices":[{"delta":{"content":"Sarah: "}}]}',
      'data: {"choices":[{"delta":{"content":"\\"I see you.\\""}}]}',
      'data: [DONE]',
    ]));

    await collect(generateRoleplayResponseStream(
      appData,
      'conversation-1',
      `${establishedFactNote} poisoned legacy player turn`,
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
        responseJob,
      },
    ));

    const [, fetchInit] = fetchMock.mock.calls[0];
    const browserBody = JSON.parse(String(fetchInit?.body));
    const finalUserContent = browserBody.messages.at(-1).content;

    expect(browserBody.finalUserLaneEvidence).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'established_fact_note',
        kind: 'established_fact_note',
        sourceRole: 'runtime',
        authority: 'state',
        modelFacing: true,
        contentPreview: expect.stringContaining('User wrote content for AI character'),
      }),
      expect.objectContaining({
        id: 'player_turn',
        kind: 'player_turn',
        sourceRole: 'user',
        authority: 'player_turn',
        modelFacing: true,
        contentPreview: 'Sarah: "Keep your hands where I can see them."',
      }),
    ]));
    expect(finalUserContent).toContain('[established_fact_note | runtime | state | model-facing]');
    expect(finalUserContent).toContain('[player_turn | user | player_turn | model-facing]');
    expect(finalUserContent).not.toContain('poisoned legacy player turn');
  });
});
