import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const source = readFileSync('src/components/chronicle/ChatInterfaceTab.tsx', 'utf8');
const extractionSource = source.slice(
  source.indexOf('const extractCharacterUpdatesFromDialogue'),
  source.indexOf('const sanitizeMoodValue'),
);

function expectOrdered(haystack: string, markers: string[]) {
  let previousIndex = -1;
  for (const marker of markers) {
    const index = haystack.indexOf(marker);
    expect(index, `missing marker: ${marker}`).toBeGreaterThanOrEqual(0);
    expect(index, `marker out of order: ${marker}`).toBeGreaterThan(previousIndex);
    previousIndex = index;
  }
}

describe('reviewed character-state runtime wiring', () => {
  it('builds the reviewed contract before selecting apply candidates', () => {
    expectOrdered(extractionSource, [
      'const reviewedCharacterState = buildRoleplayReviewedCharacterStateContract({',
      'reviewedCharacterStateRows: reviewedCharacterState.rows,',
      'const updates = getRoleplayReviewedCharacterStatePersistenceCandidates(reviewedCharacterState)',
    ]);
  });

  it('does not use raw character updates as the persistence source', () => {
    expect(extractionSource).not.toContain('const updates = rawCharacterUpdates');
    expect(extractionSource).toContain("reason: 'missing_candidate_review'");
    expect(extractionSource).toContain('unmatchedCharacterStateCandidates: reviewedCharacterState.unmatchedCandidates');
  });

  it('records deterministic eligibility and missing-review evidence while scoping the worker payload', () => {
    expectOrdered(extractionSource, [
      'const characterEligibilityReviews = buildCharacterStateEligibilityRows(',
      ').filter(c => eligibleNames.has(c.name.toLowerCase()))',
      'characterEligibilityReviews,',
      'missingCharacterStateReviews: reviewedCharacterState.rows.filter((row) => row.missingReviewReason)',
    ]);
    expect(source).toContain("...parseMessageSegments(userMessage)");
    expect(source).toContain("...parseMessageSegments(aiResponse)");
  });

  it('returns structured apply receipts for every terminal persistence path', () => {
    expect(source).toContain('Promise<RoleplayCharacterStateApplyReceipt[]>');
    expect(source).toContain("'persisted',\n          'character_state_snapshot_persisted'");
    expect(source).toContain("'no_canonical_delta'");
    expect(source).toContain("'missing_source_metadata'");
    expect(source).toContain("'stale_generation'");
    expect(source).toContain("'character_not_found'");
    expect(source).toContain("'unsupported_field'");
    expect(source).toContain("'persistence_failed'");
    expect(source).toContain("persistenceReason: persistedTargets.length > 0\n          ? 'character_state_partially_persisted_with_gap'");
  });

  it('removes rows written by a generation that becomes stale and reports cleanup failures truthfully', () => {
    expect(source).toContain('persistedWrites.push({');
    expect(source).toContain('await supabaseData.deleteCharacterStateMessageSnapshot(write.snapshotId)');
    expect(source).toContain('await supabaseData.deleteSideCharacterMessageSnapshot(write.snapshotId)');
    expect(source).toContain('persistenceTargetId: write.snapshotId');
    expect(source).toContain('persisted: cleanupFailed');
    expect(source).toContain("`${reason}_cleanup_failed: ${cleanup.error || 'unknown cleanup error'}`");
    expect(source).toContain('removeCharacterSnapshotFromRuntimeState(write.snapshotId)');
    expect(source).toContain('removeSideCharacterSnapshotFromRuntimeState(write.snapshotId)');
  });

  it('patches apply receipts onto the existing support debug record', () => {
    expect(source).toContain('responseBodyPatch?: Record<string, unknown>');
    expect(source).toContain('applyStageReviews: finalReceipts');
    expect(source).toContain('persistedUpdates: finalReceipts.filter((receipt) => receipt.persisted)');
    expect(source).toContain('rejectedAtApplyStage: finalReceipts.filter((receipt) => !receipt.persisted)');
  });
});
