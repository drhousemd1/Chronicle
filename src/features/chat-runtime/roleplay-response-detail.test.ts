import { describe, expect, it } from 'vitest';
import { renderResponseDetailInstruction } from '@/services/llm';
import { resolveEffectiveResponseDetail } from './roleplay-response-detail';

describe('resolveEffectiveResponseDetail', () => {
  it.each([
    ['concise', 1024],
    ['balanced', 2048],
    ['detailed', 3072],
  ] as const)('records %s request intent and instruction evidence', (setting, maxOutputTokens) => {
    const detail = resolveEffectiveResponseDetail(setting, renderResponseDetailInstruction);
    expect(detail).toMatchObject({
      requestedSetting: setting,
      effectiveSetting: setting,
      source: 'explicit_ui_setting',
      maxOutputTokens,
    });
    expect(detail.instructionHash).toMatch(/^fnv1a-[0-9a-f]{8}$/);
    expect(detail.instructionPreview.length).toBeGreaterThan(40);
  });

  it('uses balanced fallback without inventing explicit provenance', () => {
    expect(resolveEffectiveResponseDetail('unsupported', renderResponseDetailInstruction)).toMatchObject({
      requestedSetting: 'unsupported',
      effectiveSetting: 'balanced',
      source: 'fallback_default',
      maxOutputTokens: 2048,
    });
  });
});
