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
import {
  buildContinueAssistantTailResponseJob,
  buildNormalSendResponseJob,
} from '@/features/chat-runtime/roleplay-response-job';
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

  it('rejects a direct runtime call that omits the typed response job', async () => {
    const appData = createDefaultScenarioData();
    appData.conversations = [{
      id: 'conversation-1',
      title: 'Story',
      currentDay: 1,
      currentTimeOfDay: 'day',
      messages: [],
      createdAt: now(),
      updatedAt: now(),
    }];
    const fetchMock = vi.spyOn(globalThis, 'fetch');

    await expect(collect(generateRoleplayResponseStream(
      appData,
      'conversation-1',
      'I step toward her.',
      'grok-4.3',
    ))).rejects.toThrow('RoleplayResponseJob is required for every roleplay response request.');
    expect(fetchMock).not.toHaveBeenCalled();
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
    const responseJob = buildNormalSendResponseJob({
      conversationId: 'conversation-1',
      playerTurn: {
        messageId: 'message-user-runtime-test',
        text: 'I step toward her.',
      },
      currentStateSummary: 'Ashley is beside the kitchen counter. James is near the doorway.',
      responseDetail: 'detailed',
    });

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
        responseJob,
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

  it('keeps full roleplay comparison evidence out of non-debug browser-to-edge requests', async () => {
    const appData = createDefaultScenarioData();
    const [aiCharacter, userCharacter] = getHardcodedTestCharacters();
    aiCharacter.name = 'Ashley';
    aiCharacter.controlledBy = 'AI';
    userCharacter.name = 'James';
    userCharacter.controlledBy = 'User';
    appData.characters = [aiCharacter, userCharacter];
    appData.conversations = [{
      id: 'conversation-non-debug-boundary',
      title: 'Story',
      currentDay: 1,
      currentTimeOfDay: 'day',
      messages: [{
        id: 'message-prior-assistant',
        role: 'assistant',
        text: 'Ashley: "Stay close."',
        createdAt: now(),
      }],
      createdAt: now(),
      updatedAt: now(),
    }];
    const responseJob = buildNormalSendResponseJob({
      conversationId: 'conversation-non-debug-boundary',
      playerTurn: {
        messageId: 'message-current-user',
        text: 'I follow her.',
      },
      currentStateSummary: 'Ashley and James are together.',
      responseDetail: 'standard',
    });
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(makeSseResponse([
      `data: ${JSON.stringify({ choices: [{ delta: { content: 'Ashley: "This way."' } }] })}`,
      'data: [DONE]',
    ]));

    await collect(generateRoleplayResponseStream(
      appData,
      'conversation-non-debug-boundary',
      responseJob.playerTurn?.text || '',
      'grok-4.3',
      1,
      'day',
      [],
      true,
      false,
      2,
      null,
      { responseJob },
    ));

    const [, fetchInit] = fetchMock.mock.calls[0];
    const browserBody = JSON.parse(String(fetchInit?.body));

    expect(browserBody.debugTrace).toBe(false);
    expect(browserBody.messages).toEqual(expect.any(Array));
    expect(browserBody.responseJob).toEqual(expect.objectContaining({
      mode: 'normal_send',
      conversationId: 'conversation-non-debug-boundary',
    }));
    expect(browserBody).not.toHaveProperty('finalUserLaneEvidence');
    expect(browserBody).not.toHaveProperty('recentHistoryPacket');
    expect(browserBody).not.toHaveProperty('roleplayContext');
    expect(browserBody).not.toHaveProperty('frontendArtifactIdentity');
    expect(browserBody).not.toHaveProperty('roleplaySourceReceipts');
    expect(browserBody).not.toHaveProperty('roleplaySourceSelection');
    expect(browserBody).not.toHaveProperty('roleplaySourcePacketComparison');
  });

  it('keeps an over-budget optional world source in debug evidence but out of the live provider packet', async () => {
    const appData = createDefaultScenarioData();
    const [aiCharacter, userCharacter] = getHardcodedTestCharacters();
    aiCharacter.name = 'Ashley';
    aiCharacter.controlledBy = 'AI';
    userCharacter.name = 'James';
    userCharacter.controlledBy = 'User';
    appData.characters = [aiCharacter, userCharacter];
    const archiveMarker = 'UNRELATED_ARCHIVE_MARKER';
    appData.world.core.customWorldSections = [{
      id: uid('world-section'),
      title: 'Remote Archive',
      items: [{
        id: uid('world-item'),
        label: 'Archived notes',
        value: `${archiveMarker} `.repeat(1_200),
      }],
    }];
    appData.conversations = [{
      id: 'conversation-source-selection',
      title: 'Story',
      currentDay: 1,
      currentTimeOfDay: 'day',
      messages: [{
        id: 'message-source-selection',
        role: 'user',
        text: 'I ask Ashley what she wants to do next.',
        createdAt: now(),
      }],
      createdAt: now(),
      updatedAt: now(),
    }];
    const responseJob = buildNormalSendResponseJob({
      conversationId: 'conversation-source-selection',
      playerTurn: {
        messageId: 'message-source-selection',
        text: 'I ask Ashley what she wants to do next.',
      },
      currentStateSummary: 'Ashley and James are together in the current scene.',
      responseDetail: 'standard',
    });
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(makeSseResponse([
      `data: ${JSON.stringify({ choices: [{ delta: { content: 'Ashley: "I have an idea."' } }] })}`,
      'data: [DONE]',
    ]));
    const requestPayloads: ChatDebugRequestRecord[] = [];

    await collect(generateRoleplayResponseStream(
      appData,
      'conversation-source-selection',
      responseJob.playerTurn?.text || '',
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
    const providerMessages = browserBody.messages as Array<{ role: string; content: string }>;
    const providerText = providerMessages.map((message) => message.content).join('\n');
    const omittedArchiveReceipt = browserBody.roleplaySourceReceipts.find((receipt: {
      surface: string;
      preview: string;
    }) => receipt.surface === 'story_world' && receipt.preview.includes(archiveMarker));

    expect(providerText).not.toContain(archiveMarker);
    expect(providerText).toContain('I ask Ashley what she wants to do next.');
    expect(omittedArchiveReceipt).toMatchObject({
      modelFacing: false,
      disposition: 'suppressed',
      omissionReason: expect.stringContaining('section_budget_exceeded'),
    });
    expect(browserBody.roleplaySourceSelection).toMatchObject({
      liveShapingEnabled: true,
      refreshReason: 'first_turn',
    });
    expect(browserBody.roleplaySourceSelection).not.toHaveProperty('candidates');
    expect(browserBody.roleplaySourcePacketComparison).toMatchObject({
      fullMessageCount: expect.any(Number),
      selectedMessageCount: expect.any(Number),
      removedChars: expect.any(Number),
    });
    expect(browserBody.roleplaySourcePacketComparison.removedChars).toBeGreaterThan(0);
    expect(requestPayloads[0].modelRequest?.requestBody).toMatchObject({
      input: providerMessages,
    });
    expect(JSON.stringify(requestPayloads[0].modelRequest?.requestBody)).not.toContain(archiveMarker);
  });

  it('captures response-job lane metadata on the API Call 1 debug request', async () => {
    const appData = createDefaultScenarioData();
    const [aiCharacter, userCharacter] = getHardcodedTestCharacters();
    aiCharacter.name = 'Ashley';
    aiCharacter.controlledBy = 'AI';
    userCharacter.name = 'James';
    userCharacter.controlledBy = 'User';
    appData.characters = [aiCharacter, userCharacter];
    const rawPlayerText = 'I step closer. (I hope she does not see the key.) "Stay back."';
    const visiblePlayerText = 'I step closer. "Stay back."';
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
            text: rawPlayerText,
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
        text: rawPlayerText,
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
    expect(browserBody.responseJob).toMatchObject({
      mode: responseJob.mode,
      playerTurn: {
        messageId: 'message-user-1',
        text: visiblePlayerText,
      },
      finalUserLanes: expect.arrayContaining([
        expect.objectContaining({ kind: 'player_turn', content: visiblePlayerText }),
      ]),
    });
    expect(browserBody.responseJob.sourceReceiptIds).toEqual(expect.arrayContaining([
      expect.stringContaining('player_turn:player_turn:'),
      expect.stringContaining('current_state:current_state:'),
      expect.stringContaining('response_detail:response_detail:'),
    ]));
    expect(browserBody.finalUserLaneEvidence).toEqual([
      expect.objectContaining({
        id: 'player_turn',
        kind: 'player_turn',
        sourceRole: 'user',
        authority: 'player_turn',
        modelFacing: true,
        contentLength: visiblePlayerText.length,
        contentPreview: visiblePlayerText,
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
      responseJob: browserBody.responseJob,
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
    expect(browserBody.frontendArtifactIdentity).toMatchObject({
      schemaVersion: 1,
      artifactName: 'frontend',
      sourceRevision: null,
      sourceState: 'unknown',
      sourceDigest: expect.stringMatching(/^[a-f0-9]{64}$/),
    });
    expect(requestPayloads[0].roleplayArtifactIdentity)
      .toEqual(browserBody.frontendArtifactIdentity);
    expect(browserBody.roleplaySourceReceipts).toEqual(expect.arrayContaining([
      expect.objectContaining({ surface: 'roleplay_core', modelFacing: true }),
      expect.objectContaining({ surface: 'story_world', modelFacing: true }),
      expect.objectContaining({ surface: 'player_turn', authority: 'highest', modelFacing: true }),
      expect.objectContaining({
        surface: 'player_turn',
        sourceMessageId: 'message-user-1',
        sourceField: 'private_parenthetical.0',
        authority: 'debug_only',
        modelFacing: false,
        disposition: 'suppressed',
        omissionReason: 'balanced_parenthetical_private_thought',
      }),
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
    expect(browserBody.messages.map((message: { content: string }) => message.content).join('\n'))
      .toContain(visiblePlayerText);
    expect(browserBody.messages.map((message: { content: string }) => message.content).join('\n'))
      .not.toContain('I hope she does not see the key.');
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

  it('keeps Continue on the shared goal selector without treating assistant-anchor wording as a new goal request', async () => {
    const appData = createDefaultScenarioData();
    const [aiCharacter, userCharacter] = getHardcodedTestCharacters();
    aiCharacter.controlledBy = 'AI';
    aiCharacter.goals = [{
      id: 'goal-repair-transmitter',
      title: 'Repair the transmitter',
      desiredOutcome: 'Repair the transmitter before the next storm.',
      progress: 0,
      steps: [{ id: 'step-repair', description: 'Repair the transmitter.', completed: false }],
      createdAt: now(),
      updatedAt: now(),
    }];
    userCharacter.controlledBy = 'User';
    appData.characters = [aiCharacter, userCharacter];
    appData.conversations = [{
      id: 'conversation-continue-goal',
      title: 'Story',
      currentDay: 1,
      currentTimeOfDay: 'day',
      messages: [
        {
          id: 'message-user-prior',
          generationId: 'generation-user-prior',
          role: 'user',
          text: 'I sit beside the window and wait for her to continue.',
          createdAt: now(),
        },
        {
          id: 'message-assistant-anchor',
          generationId: 'generation-assistant-anchor',
          role: 'assistant',
          text: 'She glances at the broken transmitter, then turns back toward the window.',
          createdAt: now(),
        },
      ],
      createdAt: now(),
      updatedAt: now(),
    }];
    const responseJob = buildContinueAssistantTailResponseJob({
      conversationId: 'conversation-continue-goal',
      assistantAnchor: {
        messageId: 'message-assistant-anchor',
        generationId: 'generation-assistant-anchor',
        acceptedTextTail: 'She glances at the broken transmitter, then turns back toward the window.',
      },
      priorUserMessageId: 'message-user-prior',
      currentStateSummary: 'Both characters remain beside the window.',
      responseDetail: 'standard',
    });
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(makeSseResponse([
      'data: {"choices":[{"delta":{"content":"She continues."}}]}',
      'data: [DONE]',
    ]));
    const requestPayloads: ChatDebugRequestRecord[] = [];

    await collect(generateRoleplayResponseStream(
      appData,
      'conversation-continue-goal',
      'legacy compatibility text that must not select goals',
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
    const goalDecision = requestPayloads[0].roleplayGoalExposureDecision;
    expect(goalDecision).toMatchObject({
      mode: 'continue_assistant_tail',
      sourceMessageId: 'message-user-prior',
    });
    expect(goalDecision?.decisions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        goalId: 'goal-repair-transmitter',
        tier: 'hidden_this_turn',
        renderDetail: 'debug_only',
      }),
    ]));
    expect(browserBody.responseJob.playerTurn).toBeNull();
    expect(browserBody.finalUserLaneEvidence).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'continue_anchor', sourceRole: 'assistant' }),
    ]));
    expect(browserBody.finalUserLaneEvidence).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'player_turn' }),
    ]));
  });
});
