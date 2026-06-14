import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');

describe('AI usage telemetry integrity source contracts', () => {
  it('records browser-submitted usage as diagnostic-only telemetry', () => {
    const source = read('supabase/functions/track-ai-usage/index.ts');

    expect(source).toContain('const CLIENT_DIAGNOSTIC_EVENT_SOURCE = "client_diagnostic";');
    expect(source).toContain('function sanitizeClientDiagnosticMetadata');
    expect(source).toContain('clientReportedCount');
    expect(source).toContain('diagnosticOnly: true');
    expect(source).toContain('event_source: CLIENT_DIAGNOSTIC_EVENT_SOURCE');
    expect(source).toContain('event_count: 1');
    expect(source).not.toContain('const count = Number.isFinite(rawBody?.count)');
    expect(source).not.toContain('toNonNegativeFloat(metadata.estCostUsd)');
  });

  it('excludes client-diagnostic usage rows from admin summary counters', () => {
    const source = read('supabase/functions/admin-ai-usage-summary/index.ts');

    expect(source).toContain('function isAuthoritativeUsageEventSource');
    expect(source).toContain('return source.startsWith("server:");');
    expect(source).toContain('.select("event_count, event_source")');
    expect(source).toContain('if (!isAuthoritativeUsageEventSource(row.event_source)) return sum;');
  });

  it('excludes client-diagnostic usage rows from admin timeseries counters and cost estimates', () => {
    const source = read('supabase/functions/admin-ai-usage-timeseries/index.ts');

    expect(source).toContain('function isAuthoritativeUsageEventSource');
    expect(source).toContain('return source.startsWith("server:");');
    expect(source).toContain('.select("created_at, event_type, event_count, event_source, user_id")');
    expect(source).toContain('if (!isAuthoritativeUsageEventSource(row.event_source)) continue;');
  });

  it('has a fail-open server-side usage recorder for authoritative provider telemetry', () => {
    const source = read('supabase/functions/_shared/server-usage.ts');

    expect(source).toContain('| "character_ai_fill"');
    expect(source).toContain('| "character_ai_generate"');
    expect(source).toContain('| "character_card_ai_update"');
    expect(source).toContain('| "character_ai_enhance_precise"');
    expect(source).toContain('| "world_ai_enhance_detailed"');
    expect(source).toContain('event_source: `server:${functionName}`');
    expect(source).toContain('event_count: normalizeCount(count)');
    expect(source).toContain('sanitizeServerUsageMetadata');
    expect(source).toContain('authoritative: true');
    expect(source).toContain('console.warn(`[${functionName}] Skipped server usage telemetry');
  });

  it('emits authoritative server usage events from provider-calling roleplay edge functions', () => {
    const expectedCalls: Array<[string, string]> = [
      ['supabase/functions/chat/index.ts', 'eventType: usageEventType'],
      ['supabase/functions/extract-character-updates/index.ts', 'eventType: characterUpdateUsageEventType'],
      ['supabase/functions/extract-memory-events/index.ts', 'eventType: "memory_extraction_call"'],
      ['supabase/functions/compress-day-memories/index.ts', 'eventType: "memory_day_compression_call"'],
      ['supabase/functions/evaluate-goal-progress/index.ts', 'eventType: "goal_progress_eval_call"'],
      ['supabase/functions/evaluate-goal-alignment/index.ts', 'eventType: "goal_alignment_eval_call"'],
      ['supabase/functions/generate-side-character/index.ts', 'eventType: "side_character_card_generated"'],
      ['supabase/functions/generate-side-character-avatar/index.ts', 'eventType: avatarUsageEventType'],
      ['supabase/functions/generate-scene-image/index.ts', 'eventType: "scene_image_generated"'],
      ['supabase/functions/generate-cover-image/index.ts', 'eventType: "cover_image_generated"'],
    ];

    for (const [path, eventType] of expectedCalls) {
      const source = read(path);
      expect(source).toContain('recordServerAiUsage');
      expect(source).toContain(eventType);
    }
  });

  it('passes builder/editor single-call categories to authoritative server telemetry', () => {
    const chatSource = read('supabase/functions/chat/index.ts');
    const characterSource = read('src/services/character-ai.ts');
    const worldSource = read('src/services/world-ai.ts');
    const editorSource = read('src/features/character-editor-modal/CharacterEditorModalScreen.tsx');
    const extractCharacterUpdatesSource = read('supabase/functions/extract-character-updates/index.ts');

    expect(chatSource).toContain('const CHAT_USAGE_EVENT_TYPES = new Set<ServerAiUsageEventType>');
    expect(chatSource).toContain('"character_ai_fill"');
    expect(chatSource).toContain('"character_ai_generate"');
    expect(chatSource).toContain('"character_ai_enhance_precise"');
    expect(chatSource).toContain('"world_ai_enhance_detailed"');
    expect(chatSource).toContain('const usageEventType = normalizeChatUsageEventType(body.usageEventType);');
    expect(chatSource).toContain('eventType: usageEventType');

    expect(characterSource).toContain('usageEventType?: AiUsageEventType');
    expect(characterSource).toContain('"character_ai_fill"');
    expect(characterSource).toContain('"character_ai_generate"');
    expect(characterSource).toContain('"character_ai_enhance_detailed"');

    expect(worldSource).toContain('usageEventType,');
    expect(worldSource).toContain('"world_ai_enhance_precise"');
    expect(worldSource).toContain('"world_ai_enhance_detailed"');

    expect(editorSource).toContain("usageEventType: 'character_card_ai_update'");
    expect(editorSource).toContain("usageEventType: 'character_avatar_generated'");
    expect(extractCharacterUpdatesSource).toContain('normalizeCharacterUpdateUsageEventType');
    expect(extractCharacterUpdatesSource).toContain('eventType: characterUpdateUsageEventType');
  });

  it('passes avatar usage category through the shared avatar endpoint callers', () => {
    const chatSource = read('src/components/chronicle/ChatInterfaceTab.tsx');
    const avatarModalSource = read('src/components/chronicle/AvatarGenerationModal.tsx');
    const avatarFunctionSource = read('supabase/functions/generate-side-character-avatar/index.ts');

    expect(chatSource).toContain("usageEventType: 'side_character_avatar_generated'");
    expect(avatarModalSource).toContain('usageEventType: "character_avatar_generated"');
    expect(avatarFunctionSource).toContain('usageEventType === "character_avatar_generated"');
    expect(avatarFunctionSource).toContain('avatarUsageKind: avatarUsageEventType');
  });
});
