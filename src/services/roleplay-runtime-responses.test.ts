import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');

function sliceBetween(source: string, startMarker: string, endMarker: string): string {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);
  return source.slice(start, end);
}

function expectCollectorResultCommittedAfterGuard(sourceSlice: string) {
  const collectIndex = sourceSlice.indexOf('const responseResult = await collectRoleplayResponse');
  expect(collectIndex).toBeGreaterThanOrEqual(0);
  const afterCollect = sourceSlice.slice(collectIndex);
  const guardIndex = afterCollect.indexOf('if (!liveConversation ||');
  const placeholderCommitIndex = afterCollect.indexOf('placeholderMapRef.current = responseResult.placeholderMap');
  expect(guardIndex).toBeGreaterThanOrEqual(0);
  expect(placeholderCommitIndex).toBeGreaterThan(guardIndex);
}

describe('roleplay runtime Responses migration source contracts', () => {
  it('opts API Call 1 into xAI Responses without changing the frontend commit contract', () => {
    const source = read('src/services/llm.ts');
    const chatInterfaceSource = read('src/components/chronicle/ChatInterfaceTab.tsx');
    const localNoticesSource = read('src/features/chat-runtime/local-notices.ts');
    const collectorSource = read('src/features/chat-runtime/collect-roleplay-response.ts');

    expect(source).toContain('const CHAT_RESPONSE_TIMEOUT_MS = 180_000;');
    expect(source).toContain("const ROLEPLAY_PROVIDER_TRANSPORT = 'responses';");
    expect(source).toContain("const ROLEPLAY_REASONING_EFFORT = 'medium';");
    expect(source).toContain('const ROLEPLAY_STORE = false;');
    expect(source).toContain('providerTransport: ROLEPLAY_PROVIDER_TRANSPORT');
    expect(source).toContain('reasoningEffort: ROLEPLAY_REASONING_EFFORT');
    expect(source).toContain('store: ROLEPLAY_STORE');
    expect(source).toContain("endpoint: 'https://api.x.ai/v1/responses'");
    expect(source).toContain('input: messages');
    expect(source).toContain('reasoning: { effort: ROLEPLAY_REASONING_EFFORT }');
    expect(source).toContain('max_output_tokens: maxTokens');
    expect(source).toContain('const providerError = parsed?.chronicle_provider_error');
    expect(source).toContain('emitCall1Trace("error_provider_stream"');
    expect(source).toContain('class ProviderStreamChatError extends Error');
    expect(source).toContain('throw new ProviderStreamChatError(providerError.message)');
    expect(source).toContain('if (error instanceof ProviderStreamChatError) throw error;');
    expect(localNoticesSource).toContain('const unprefixedStandardNotice = PROVIDER_ERROR_NOTICE_TEXT.replace(/^Chronicle:\\s*/, \'\');');
    expect(localNoticesSource).toContain('trimmedMessage === unprefixedStandardNotice');
    expect(chatInterfaceSource.split('collectRoleplayResponse(').length - 1).toBe(3);
    expect(chatInterfaceSource.split('streamToUi: false').length - 1).toBe(3);
    expect(chatInterfaceSource).toContain('placeholderMapRef.current = responseResult.placeholderMap');
    expect(chatInterfaceSource).toContain('readRoleplayRequestDebugFromError(err, pendingDebugTrace, pendingCall1Request)');
    expect(collectorSource).toContain('generateStream = generateRoleplayResponseStream');
    expect(collectorSource).toContain('attachRoleplayRequestDebugToError(error, responseDebugTrace, responseCall1Request)');
    expect(collectorSource).toContain('const candidatePlaceholderMap: PlaceholderNameMap = { ...placeholderMap };');
    expect(source).not.toContain("endpoint: 'https://api.x.ai/v1/chat/completions'");
  });

  it('keeps collector placeholder-map commits behind branch-specific stale guards', () => {
    const chatInterfaceSource = read('src/components/chronicle/ChatInterfaceTab.tsx');
    const sendSlice = sliceBetween(
      chatInterfaceSource,
      'const handleSend = async () => {',
      'const handleCopyMessage',
    );
    const regenerateSlice = sliceBetween(
      chatInterfaceSource,
      'const handleRegenerateMessage = async',
      'const handleContinueConversation = async',
    );
    const continueSlice = sliceBetween(
      chatInterfaceSource,
      'const handleContinueConversation = async',
      '// Generate scene image from recent conversation context',
    );

    expectCollectorResultCommittedAfterGuard(sendSlice);
    expectCollectorResultCommittedAfterGuard(regenerateSlice);
    expectCollectorResultCommittedAfterGuard(continueSlice);
  });

  it('routes the chat edge direct lane through Responses by default while keeping an explicit legacy lane', () => {
    const source = read('supabase/functions/chat/index.ts');

    expect(source).toContain('providerTransport?: \'chat_completions\' | \'responses\';');
    expect(source).toContain("providerTransport = 'responses'");
    expect(source).toContain("if (providerTransport === 'responses')");
    expect(source).toContain('return await handleResponsesDirect(');
    expect(source).toContain('return await handleDirect(');
    expect(source).toContain('callXaiResponses({');
    expect(source).toContain('store: ROLEPLAY_RESPONSES_STORE');
    expect(source).toContain('reasoningEffort: ROLEPLAY_RESPONSES_REASONING_EFFORT');
    expect(source).toContain("const ROLEPLAY_RESPONSES_REASONING_EFFORT: XaiResponsesReasoningEffort = \"medium\";");
    expect(source).toContain('const ROLEPLAY_RESPONSES_STORE = false;');
    expect(source).toContain('streamTextAsSSE(normalizedText');
    expect(source).toContain('streamContentFilterNoticeAsSSE');
    expect(source).toContain('streamProviderErrorAsSSE');
    expect(source).toContain('jsonProviderErrorResponse');
    expect(source).toContain('appendProviderErrorToDebugTrace');
    expect(source).toContain('providerStreamError: providerError');
    expect(source).toContain('CONTENT_REDIRECT_DIRECTIVE');
  });

  it('keeps non-roleplay helper generation out of the Phase 3 transport migration', () => {
    const source = read('src/services/llm.ts');
    const helperSource = source.slice(source.indexOf('export async function brainstormCharacterDetails'));
    const characterEnhanceSource = read('src/services/character-ai.ts');
    const worldEnhanceSource = read('src/services/world-ai.ts');

    expect(helperSource).toContain("supabase.functions.invoke('chat'");
    expect(helperSource).toContain('stream: false');
    expect(helperSource).toContain("providerTransport: 'chat_completions'");
    expect(helperSource).not.toContain('providerTransport: ROLEPLAY_PROVIDER_TRANSPORT');
    expect(helperSource).not.toContain('reasoningEffort: ROLEPLAY_REASONING_EFFORT');

    expect(characterEnhanceSource).toContain("providerTransport: 'chat_completions'");
    expect(worldEnhanceSource).toContain("providerTransport: 'chat_completions'");
  });
});
