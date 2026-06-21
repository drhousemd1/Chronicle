import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { estimateAiUsageCost } from '../../supabase/functions/_shared/usage-cost';

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
    expect(source).toContain('estimateAiUsageCost');
    expect(source).toContain('clientDiagnosticOnly: true');
    expect(source).not.toContain('est_cost_usd: 0');
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
    expect(source).toContain('.select("created_at, event_type, event_count, event_source, user_id, metadata")');
    expect(source).toContain('if (!isAuthoritativeUsageEventSource(row.event_source)) continue;');
    expect(source).toContain('estimateAiUsageCost(row.event_type, metadata, count)');
    expect(source).toContain('function isSuccessfulGeneratedEvent');
    expect(source).toContain('if (successfulGeneratedEvent) points[idx].sceneImagesGenerated += count;');
  });

  it('has a fail-open server-side usage recorder for authoritative provider telemetry', () => {
    const source = read('supabase/functions/_shared/server-usage.ts');

    expect(source).toContain('| "character_ai_fill"');
    expect(source).toContain('| "character_ai_generate"');
    expect(source).toContain('| "character_card_ai_update"');
    expect(source).toContain('| "character_ai_enhance_precise"');
    expect(source).toContain('| "world_ai_enhance_detailed"');
    expect(source).toContain('event_source: `server:${functionName}`');
    expect(source).toContain('event_count: eventCount');
    expect(source).toContain('sanitizeServerUsageMetadata');
    expect(source).toContain('authoritative: true');
    expect(source).toContain('mirrorServerUsageToActiveTestSession');
    expect(source).toContain('serverAuthoritative: true');
    expect(source).toContain('costEstimateSource: estimate.costEstimateSource');
    expect(source).toContain('console.warn(`[${functionName}] Skipped server usage telemetry');
  });

  it('prefers server-authoritative rows over duplicate client diagnostics in the test-session report', () => {
    const source = read('supabase/functions/admin-api-usage-test-report/index.ts');

    expect(source).toContain('isServerAuthoritativeEvent');
    expect(source).toContain('buildMetricEvents');
    expect(source).toContain('clientCountsSeenByKey');
    expect(source).toContain('countFromEvent');
    expect(source).toContain('created_at');
    expect(source).toContain('input_chars, output_chars');
    expect(source).toContain('Treat client-only chat rows as generated');
    expect(source).toContain('metadata.outputChars');
    expect(source).toContain('isValidationSnapshotEvent');
    expect(source).toContain('fallback_success');
    expect(source).toContain('metricEvents');
    expect(source).toContain('eventAccountingMode');
    expect(source).toContain('server_authoritative');
    expect(source).toContain('server_authoritative_with_client_fallback');
  });

  it('keeps finance trace validation scoped to visible columns and avoids misleading cost labels', () => {
    const source = read('src/components/admin/finance/usage/ApiUsagePage.tsx');

    expect(source).toContain('visibleValidationSummary');
    expect(source).toContain('Visible columns — Pass:');
    expect(source).toContain('Costed Rows');
    expect(source).toContain('Estimated Spend');
    expect(source).toContain('server+client-est.');
    expect(source).toContain('const COST_SERIES_META');
    expect(source).toContain('if (mode === "cost") return COST_SERIES_META;');
    expect(source).toContain('Cost view uses server-estimated spend from provider usage metadata.');
    expect(source).not.toContain('Costed Events');
    expect(source).not.toContain('Total Cost');
    expect(source).not.toContain('raw * series.costPerEvent');
  });

  it('estimates provider cost with cached input tokens and paid fallback attempts', () => {
    const cachedEstimate = estimateAiUsageCost('chat_call_1', {
      providerInputTokens: 1_000_000,
      providerCachedInputTokens: 500_000,
      providerOutputTokens: 1_000_000,
      providerTotalTokens: 2_000_000,
    });

    expect(cachedEstimate.cachedInputTokens).toBe(500_000);
    expect(cachedEstimate.estimatedCostUsd).toBe(3.225);
    expect(cachedEstimate.costEstimateSource).toBe('provider_tokens');

    const fallbackEstimate = estimateAiUsageCost('chat_call_1', {
      providerInputTokens: 1_000,
      providerOutputTokens: 1_000,
      providerTotalTokens: 2_000,
      providerRequestCount: 2,
      providerPreGenerationViolationCount: 1,
    });

    expect(fallbackEstimate.estimatedCostUsd).toBe(0.05375);
    expect(fallbackEstimate.costEstimateSource).toBe('provider_tokens_plus_extra_requests');

    const imageEstimate = estimateAiUsageCost('scene_image_generated', {
      providerRequestCount: 2,
      providerImageRequestCount: 1,
      imageCount: 1,
      promptChars: 2_000,
    });

    expect(imageEstimate.estimatedCostUsd).toBe(0.0347);
    expect(imageEstimate.costEstimateSource).toBe('image_fixed_rate_plus_extra_requests');

    const combinedExactUsageEstimate = estimateAiUsageCost('character_cards_update_call', {
      providerRequestCount: 2,
      providerUsageRequestCount: 2,
      providerInputTokens: 2_000,
      providerOutputTokens: 1_000,
      providerTotalTokens: 3_000,
    });

    expect(combinedExactUsageEstimate.estimatedCostUsd).toBe(0.005);
    expect(combinedExactUsageEstimate.costEstimateSource).toBe('provider_tokens');

    const legacyChatFilterEstimate = estimateAiUsageCost('chat_call_1', {
      providerTransport: 'chat_completions',
      providerRequestCount: 2,
      providerPreGenerationViolationCount: 2,
    });

    expect(legacyChatFilterEstimate.estimatedCostUsd).toBe(0);
    expect(legacyChatFilterEstimate.costEstimateSource).toBe('fallback_per_call');
  });

  it('does not log AI Fill usage before confirming there is paid work to perform', () => {
    const source = read('src/services/character-ai.ts');

    const noWorkIndex = source.indexOf('if (totalEmpty === 0)');
    const trackIndex = source.indexOf('eventType: "character_ai_fill"', noWorkIndex);
    expect(noWorkIndex).toBeGreaterThan(-1);
    expect(trackIndex).toBeGreaterThan(noWorkIndex);
    expect(source).toContain('emptyFieldCount: totalEmpty');
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

    const joinedEdgeSources = expectedCalls
      .map(([path]) => read(path))
      .join('\n');
    expect(joinedEdgeSources).toContain('provider_response_parse_error');
    expect(joinedEdgeSources).toContain('provider_image_download_failed');
    expect(joinedEdgeSources).toContain('providerPreGenerationViolationCount');
    expect(read('supabase/functions/_shared/xai-responses.ts')).toContain('export async function readXaiErrorText');
    expect(read('supabase/functions/chat/index.ts')).toContain('const errorText = await readXaiErrorText(response);');
    expect(read('supabase/functions/generate-scene-image/index.ts')).toContain('const errorText = await readXaiErrorText(response);');
  });

  it('preserves Responses token usage when a 200 response body fails validation', () => {
    const chatSource = read('supabase/functions/chat/index.ts');

    expect(chatSource).toContain('class ResponsesContentError extends Error');
    expect(chatSource).toContain('this.responseUsage = details.responseUsage ?? null;');
    expect(chatSource).toContain('throw new ResponsesContentError(bodyError, {');
    expect(chatSource).toContain('throw new ResponsesContentError(normalized.errorMessage || "Responses stream failed", {');
    expect(chatSource).toContain('const contentError = getResponsesContentError(error);');
    expect(chatSource).toContain('...providerMetadataFromResponsesUsage(contentError?.responseUsage)');
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
