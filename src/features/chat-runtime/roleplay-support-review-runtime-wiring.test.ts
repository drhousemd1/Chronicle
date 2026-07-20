import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const source = readFileSync('src/components/chronicle/ChatInterfaceTab.tsx', 'utf8');
const memorySource = source.slice(source.indexOf('const queueAssistantMemoryExtraction'));
const memoryPersistenceSource = readFileSync(
  'src/features/chat-runtime/roleplay-memory-candidate-persistence.ts',
  'utf8',
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

describe('RoleplaySupportReviewEnvelope runtime wiring', () => {
  it('finalizes the four mutating worker records after their persistence boundaries', () => {
    expect(source).toContain("updateRoleplaySupportPersistence(\n            compressionSourceMessage,\n            'call2.memory-compress'");
    expect(source).toContain("updateRoleplaySupportPersistence(sourceMessage, 'call2.goal-progress-eval'");
    expect(source).toContain("updateRoleplaySupportPersistence(supportSourceMessage, 'call2.character-state-sync'");
    expect(source).toContain("updateRoleplaySupportPersistence(sourceMessage, 'call2.memory-extraction'");
    expect(source).toContain("persistenceStatus: 'persisted'");
    expect(source).toContain("persistenceStatus: 'failed'");
    expect(source).toContain("persistenceStatus: 'skipped_stale'");
    expect(source).toContain("persistenceStatus: 'source_not_persisted'");
  });

  it('reviews memory source authority and duplicates before recording accepted envelope outcomes', () => {
    expectOrdered(memorySource, [
      'const parsedMemoryResponse = parseMemoryExtractionResponseV1(memoryDebug.responseBody);',
      'const memoryReview = reviewRoleplayMemoryExtractionCandidates({',
      'candidates: parsedMemoryResponse.ok ? parsedMemoryResponse.response.candidates : [],',
      'candidateReviews: candidateOutcomes,',
      'roleplaySupportReviewEnvelope: createRoleplaySupportReviewEnvelopeFromWorkerResult({',
      'const persistenceResult = await persistAcceptedRoleplayMemoryCandidates({',
      'persistCandidate: (candidate) => handleCreateMemory(',
      'const allPersistenceFailed = persistenceResult.persistedTargets.length === 0',
    ]);
    expect(source).toContain('queueAssistantDerivedWorkAfterSourcePersist([userMsg, aiMsg], userInput, cleanedText, aiMsg, userMsg);');
    expect(source).toContain('responseContractStatus: parsedMemoryResponse.ok ? \'accepted\' : \'rejected\',');
    expect(source).toContain('sourceUserMessageId: sourceUserMessage?.id,');
    expect(source).toContain('const refreshedReviewEnvelope = responseBodyPatch');
    expect(source).toContain('accepted: refreshedReviewEnvelope.accepted');
    expect(source).toContain('rejected: refreshedReviewEnvelope.rejected');
    expect(source).toContain('omitted: refreshedReviewEnvelope.omitted');
  });

  it('keeps goal alignment diagnostic-only instead of adding a persistence finalizer', () => {
    expect(source).toContain("worker: 'goal_alignment'");
    expect(source).not.toContain("updateRoleplaySupportPersistence(sourceMessage, 'call2.goal-alignment-eval'");
  });

  it('rechecks source-generation freshness after awaited persistence writes', () => {
    expect(memoryPersistenceSource).toContain("'source_generation_superseded_during_candidate_persistence'");
    expect(memoryPersistenceSource).toContain("'missing_candidate_source_lineage'");
    expect(memorySource).toContain('isSourceCurrent: (candidate) => isMessageGenerationStillCurrent(');
    expect(memorySource).toContain('candidate.sourceMessageId,\n          candidate.sourceGenerationId,');
    expect(memorySource).toContain('candidate.sourceMessageId,\n            candidate.sourceGenerationId,');
    expect(memorySource).not.toContain('if (!memorySourceCurrent)');
    expect(source).toContain("'source_generation_superseded_during_character_persistence',");
    expect(source).toContain("'source_generation_superseded_before_character_finalization',");
    expectOrdered(source, [
      'const persistedSnapshot = await supabaseData.upsertCharacterStateMessageSnapshot({',
      "persistedWrites.push({\n          kind: 'main',",
      "'source_generation_superseded_during_character_persistence',",
    ]);
    expectOrdered(source, [
      'const persisted = await supabaseData.upsertStoryGoalStepDerivations({',
      "persistenceReason: 'source_generation_superseded_during_persistence'",
      "persistenceReason: 'goal_step_derivations_persisted'",
    ]);
    expectOrdered(memoryPersistenceSource, [
      'const persisted = await input.persistCandidate(candidate);',
      "'source_generation_superseded_during_candidate_persistence'",
    ]);
    expect(memorySource).toContain("'accepted_memory_candidates_persisted_individually'");
  });

  it('keeps a persisted day synopsis truthful when source-row cleanup is only partially successful', () => {
    expectOrdered(source, [
      'const persistenceResult = await persistReviewedDayCompression({',
      "persistenceReason: 'compressed_synopsis_persisted_with_cleanup_gap'",
      "persistenceReason: 'compressed_synopsis_persisted_and_accepted_source_rows_deleted'",
    ]);
    expect(source).toContain('compressedInputMemoryRowIds: persistenceResult.review.compressedInputMemoryRowIds');
    expect(source).toContain('deletedInputMemoryRowIds: persistenceResult.deletedInputMemoryRowIds');
    expect(source).toContain('The synopsis remains available to future prompts; the undeleted source rows require cleanup.');
    expect(source).toContain("persistenceReason: 'day_memory_compression_pipeline_failed'");
  });
});
