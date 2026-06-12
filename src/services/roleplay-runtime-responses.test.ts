import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');

describe('roleplay runtime Responses migration source contracts', () => {
  it('opts API Call 1 into xAI Responses without changing the frontend commit contract', () => {
    const source = read('src/services/llm.ts');
    const chatInterfaceSource = read('src/components/chronicle/ChatInterfaceTab.tsx');

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
    expect(chatInterfaceSource).toContain('const unprefixedStandardNotice = PROVIDER_ERROR_NOTICE_TEXT.replace(/^Chronicle:\\s*/, \'\');');
    expect(chatInterfaceSource).toContain('trimmedMessage === unprefixedStandardNotice');
    expect(chatInterfaceSource).toContain('collectSendResponse(false)');
    expect(chatInterfaceSource).toContain('collectRegenerateResponse(false)');
    expect(chatInterfaceSource).toContain('collectContinueResponse(false)');
    expect(source).not.toContain("endpoint: 'https://api.x.ai/v1/chat/completions'");
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
