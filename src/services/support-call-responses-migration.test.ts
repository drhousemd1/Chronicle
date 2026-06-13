import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');

const roleplayStateSupportCalls = [
  'supabase/functions/extract-character-updates/index.ts',
  'supabase/functions/extract-memory-events/index.ts',
  'supabase/functions/evaluate-goal-progress/index.ts',
  'supabase/functions/evaluate-goal-alignment/index.ts',
  'supabase/functions/compress-day-memories/index.ts',
];

const structuredJsonSupportCalls = [
  'supabase/functions/extract-character-updates/index.ts',
  'supabase/functions/extract-memory-events/index.ts',
  'supabase/functions/evaluate-goal-progress/index.ts',
  'supabase/functions/evaluate-goal-alignment/index.ts',
];

function expectOrdered(source: string, path: string, markers: string[]) {
  let previousIndex = -1;
  for (const marker of markers) {
    const index = source.indexOf(marker);
    expect(index, `${path} missing marker: ${marker}`).toBeGreaterThanOrEqual(0);
    expect(index, `${path} marker out of order: ${marker}`).toBeGreaterThan(previousIndex);
    previousIndex = index;
  }
}

describe('roleplay support-call Responses migration contracts', () => {
  it('uses Responses reasoning with store=false for core roleplay state workers', () => {
    for (const path of roleplayStateSupportCalls) {
      const source = read(path);

      expect(source, path).toContain('callXaiResponses');
      expect(source, path).toMatch(/const SUPPORT_REASONING_EFFORT[^=]*= "medium"/);
      expect(source, path).toContain('SUPPORT_STORE = false');
      expect(source, path).toContain('store: SUPPORT_STORE');
      expect(source, path).toContain('reasoningEffort: SUPPORT_REASONING_EFFORT');
      expect(source, path).toContain('extractXaiResponsesText');
      expect(source, path).toContain('getXaiResponsesBodyError');
      expect(source, path).not.toContain('https://api.x.ai/v1/chat/completions');
      expect(source, path).not.toContain('response_format:');
      expect(source, path).not.toContain('max_tokens:');
      expect(source, path).not.toContain('choices?.[0]?.message?.content');
    }
  });

  it('keeps structured roleplay state workers on Responses text.format JSON schema output', () => {
    for (const path of structuredJsonSupportCalls) {
      const source = read(path);

      expect(source, path).toContain('textFormat:');
    }
  });

  it('sets explicit max output caps for compact support-call Responses bodies', () => {
    expect(read('supabase/functions/extract-memory-events/index.ts')).toContain('maxOutputTokens: 1024');
    expect(read('supabase/functions/evaluate-goal-progress/index.ts')).toContain('maxOutputTokens: 1024');
    expect(read('supabase/functions/evaluate-goal-alignment/index.ts')).toContain('maxOutputTokens: 2048');
    expect(read('supabase/functions/compress-day-memories/index.ts')).toContain('maxOutputTokens: 350');
  });

  it('does not migrate out-of-scope creative helper edge functions in this pass', () => {
    const sideCharacterSource = read('supabase/functions/generate-side-character/index.ts');
    const sceneImageSource = read('supabase/functions/generate-scene-image/index.ts');

    expect(sideCharacterSource).toContain('https://api.x.ai/v1/chat/completions');
    expect(sideCharacterSource).toContain('response_format: sideCharacterProfileResponseFormat');
    expect(sceneImageSource).toContain('https://api.x.ai/v1/chat/completions');
    expect(sceneImageSource).toContain('response_format: sceneAnalysisResponseFormat');
  });

  it('keeps character-state extraction retry paths on the same Responses transport as the primary request', () => {
    const source = read('supabase/functions/extract-character-updates/index.ts');
    const responseCalls = source.match(/callXaiResponses\(/g) || [];

    expect(responseCalls).toHaveLength(3);
    expect(source).toContain('Focused retry for omitted physical-state review coverage.');
    expect(source).toContain('Primary character-state sync request received 403; this safe retry extracted non-explicit metadata');
  });

  it('checks Responses body failure status before defaulting missing output to empty state', () => {
    const characterSource = read('supabase/functions/extract-character-updates/index.ts');
    expectOrdered(characterSource, 'extract-character-updates focused retry', [
      'const focusedData = await focusedResult.response.json();',
      'const focusedBodyError = getXaiResponsesBodyError(focusedData, { requireOutputText: true });',
      'const focusedContent = extractXaiResponsesText(focusedData) || EMPTY_CHARACTER_SYNC_JSON;',
    ]);
    expectOrdered(characterSource, 'extract-character-updates safe retry', [
      'const safeData = await safeResult.response.json();',
      'const safeBodyError = getXaiResponsesBodyError(safeData, { requireOutputText: true });',
      'const safeContent = extractXaiResponsesText(safeData) || EMPTY_CHARACTER_SYNC_JSON;',
    ]);
    expectOrdered(characterSource, 'extract-character-updates primary', [
      'const data = await result.response.json();',
      'const bodyError = getXaiResponsesBodyError(data, { requireOutputText: true });',
      'const content = extractXaiResponsesText(data) || EMPTY_CHARACTER_SYNC_JSON;',
    ]);

    for (const path of roleplayStateSupportCalls.filter((entry) => entry !== 'supabase/functions/extract-character-updates/index.ts')) {
      const source = read(path);
      expectOrdered(source, path, [
        'const data = await result.response.json();',
        'const bodyError = getXaiResponsesBodyError(data, { requireOutputText: true });',
        'extractXaiResponsesText(data)',
      ]);
    }
  });

  it('does not accept malformed support-call output as completed empty state', () => {
    const adapterSource = read('supabase/functions/_shared/xai-responses.ts');
    const memorySource = read('supabase/functions/extract-memory-events/index.ts');
    const characterSource = read('supabase/functions/extract-character-updates/index.ts');
    const chatInterfaceSource = read('src/components/chronicle/ChatInterfaceTab.tsx');
    const debugSupportSource = read('src/features/chat-runtime/debug-support.ts');

    expect(adapterSource).toContain('if (!isRecord(payload)) return "Responses response envelope missing or malformed";');
    expect(adapterSource).toContain('if (payload.object !== "response")');
    expect(adapterSource).toContain('if (!status) return "Responses response missing status";');
    expect(adapterSource).toContain('return "Responses response missing output";');

    expect(memorySource).toContain('providerBodyError: bodyError');
    expect(memorySource).toContain('parseError = "missing_json_object";');
    expect(memorySource).not.toContain('const arrayMatch = content.match');

    expect(characterSource).toContain('Safe character-state retry failed: HTTP ${safeResult.status}');
    expect(characterSource).toContain('providerBodyError: safeRetryError');

    expect(debugSupportSource).toContain('focusedRetryParseError');
    expect(debugSupportSource).toContain('return `focusedRetryParseError: ${focusedRetryParseError}`;');
  });

  it('records day-memory compression as a debug-visible support call', () => {
    const compressionSource = read('supabase/functions/compress-day-memories/index.ts');
    const chatInterfaceSource = read('src/components/chronicle/ChatInterfaceTab.tsx');

    expect(compressionSource).toContain('const { bullets, day, conversationId, debugTrace = false } = await req.json();');
    expect(compressionSource).toContain('providerBodyError: `xAI Responses HTTP ${result.status}`');
    expect(compressionSource).toContain('chronicle_debug_payload: debugPayload');

    expect(chatInterfaceSource).toContain("id: 'call2.memory-compress'");
    expect(chatInterfaceSource).toContain("label: 'Supporting Call - Day memory compression'");
    expect(chatInterfaceSource).toContain("endpoint: '/functions/v1/compress-day-memories'");
    expect(chatInterfaceSource).toContain('const compressionDebugStatus = buildSupportCallDebugStatus(error, compressionDebug.responseBody);');
  });
});
