import { describe, expect, it } from 'vitest';

import {
  buildPhysicalStateCompletenessReviews,
  getMissingPhysicalStateReviewNames,
  normalizePhysicalStateReviews,
} from '../../supabase/functions/_shared/state-sync-completeness.ts';

describe('character-state physical review completeness', () => {
  it('detects when Grok omits an eligible character from physical-state review rows', () => {
    const eligibleCharacters = [{ name: 'James' }, { name: 'Ashley' }];
    const reviews = normalizePhysicalStateReviews([
      {
        character: 'James',
        reviewed: true,
        locationReviewed: true,
        scenePositionReviewed: true,
        changed: true,
        reason: 'latest exchange moved James indoors',
        evidence: 'James stepped inside',
        confidence: 0.9,
      },
    ], eligibleCharacters);

    expect(getMissingPhysicalStateReviewNames(eligibleCharacters, reviews)).toEqual(['Ashley']);
    expect(buildPhysicalStateCompletenessReviews(eligibleCharacters, reviews)).toEqual([
      { character: 'James', reviewed: true, reason: 'latest exchange moved James indoors', source: 'primary' },
      { character: 'Ashley', reviewed: false, reason: 'missing_physical_state_review', source: 'missing' },
    ]);
  });

  it('treats a focused retry review as completing the omitted character coverage without fabricating an update', () => {
    const eligibleCharacters = ['James', 'Ashley'];
    const primaryReviews = normalizePhysicalStateReviews([
      { character: 'James', reviewed: true, locationReviewed: true, scenePositionReviewed: true, changed: false, reason: 'no physical change', evidence: 'James stayed still', confidence: 0.8 },
    ], eligibleCharacters);
    const retryReviews = normalizePhysicalStateReviews([
      { character: 'Ashley', reviewed: true, locationReviewed: true, scenePositionReviewed: true, changed: true, reason: 'latest exchange placed Ashley beside James', evidence: 'Ashley moved beside James', confidence: 0.92 },
    ], eligibleCharacters, 'focused_retry');
    const allReviews = [...primaryReviews, ...retryReviews];

    expect(getMissingPhysicalStateReviewNames(eligibleCharacters, allReviews)).toEqual([]);
    expect(buildPhysicalStateCompletenessReviews(eligibleCharacters, allReviews)).toEqual([
      { character: 'James', reviewed: true, reason: 'no physical change', source: 'primary' },
      { character: 'Ashley', reviewed: true, reason: 'latest exchange placed Ashley beside James', source: 'focused_retry' },
    ]);
  });

  it('does not count a malformed review row as physical-state coverage', () => {
    const eligibleCharacters = ['Ashley'];
    const reviews = normalizePhysicalStateReviews([
      { character: 'Ashley', reason: 'reviewed' },
    ], eligibleCharacters);

    expect(getMissingPhysicalStateReviewNames(eligibleCharacters, reviews)).toEqual(['Ashley']);
    expect(buildPhysicalStateCompletenessReviews(eligibleCharacters, reviews)).toEqual([
      { character: 'Ashley', reviewed: false, reason: 'missing_physical_state_review', source: 'missing' },
    ]);
  });

  it('models the safe-fallback path by merging focused retry coverage for omitted reviews', () => {
    const eligibleCharacters = ['Sarah', 'Ashley'];
    const safeReviews = normalizePhysicalStateReviews([
      { character: 'Sarah', reviewed: true, locationReviewed: true, scenePositionReviewed: true, changed: false, reason: 'safe fallback reviewed Sarah', confidence: 0.7 },
    ], eligibleCharacters);
    const missingAfterSafe = getMissingPhysicalStateReviewNames(eligibleCharacters, safeReviews);
    const focusedRetryReviews = normalizePhysicalStateReviews([
      { character: 'Ashley', reviewed: true, locationReviewed: true, scenePositionReviewed: true, changed: true, reason: 'focused retry reviewed omitted Ashley', confidence: 0.8 },
    ], missingAfterSafe, 'focused_retry');
    const mergedReviews = [...safeReviews, ...focusedRetryReviews];

    expect(missingAfterSafe).toEqual(['Ashley']);
    expect(getMissingPhysicalStateReviewNames(eligibleCharacters, mergedReviews)).toEqual([]);
    expect(buildPhysicalStateCompletenessReviews(eligibleCharacters, mergedReviews)).toEqual([
      { character: 'Sarah', reviewed: true, reason: 'safe fallback reviewed Sarah', source: 'primary' },
      { character: 'Ashley', reviewed: true, reason: 'focused retry reviewed omitted Ashley', source: 'focused_retry' },
    ]);
  });
});
