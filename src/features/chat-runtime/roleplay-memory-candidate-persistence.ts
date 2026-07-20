import type { RoleplayMemoryCandidateReview } from './roleplay-memory-user-state-review';

export type RoleplayMemoryCandidatePersistenceStatus =
  | 'persisted'
  | 'persisted_stale'
  | 'skipped_stale'
  | 'failed';

export type RoleplayMemoryCandidatePersistenceOutcome = RoleplayMemoryCandidateReview & {
  persistenceStatus: RoleplayMemoryCandidatePersistenceStatus;
  persistenceReason: string;
  persistenceTargetId?: string;
};

export type RoleplayMemoryCandidatePersistenceResult = {
  outcomes: RoleplayMemoryCandidatePersistenceOutcome[];
  persistedTargets: string[];
  failures: string[];
  sourceBecameStale: boolean;
};

export async function persistAcceptedRoleplayMemoryCandidates<T extends { id: string }>(input: {
  candidates: RoleplayMemoryCandidateReview[];
  isSourceCurrent: (candidate: RoleplayMemoryCandidateReview) => boolean;
  persistCandidate: (candidate: RoleplayMemoryCandidateReview) => Promise<T>;
}): Promise<RoleplayMemoryCandidatePersistenceResult> {
  const outcomes: RoleplayMemoryCandidatePersistenceOutcome[] = [];
  const persistedTargets: string[] = [];
  const failures: string[] = [];
  let sourceBecameStale = false;

  for (const candidate of input.candidates.filter((entry) => entry.accepted)) {
    if (!candidate.sourceMessageId || !candidate.sourceGenerationId) {
      const failure = `${candidate.id}:missing_candidate_source_lineage`;
      failures.push(failure);
      outcomes.push({
        ...candidate,
        persistenceStatus: 'failed',
        persistenceReason: 'missing_candidate_source_lineage',
      });
      continue;
    }

    if (!input.isSourceCurrent(candidate)) {
      sourceBecameStale = true;
      outcomes.push({
        ...candidate,
        persistenceStatus: 'skipped_stale',
        persistenceReason: 'source_generation_superseded_before_candidate_persistence',
      });
      continue;
    }

    try {
      const persisted = await input.persistCandidate(candidate);
      persistedTargets.push(persisted.id);
      const sourceStillCurrent = input.isSourceCurrent(candidate);
      if (!sourceStillCurrent) sourceBecameStale = true;
      outcomes.push({
        ...candidate,
        persistenceStatus: sourceStillCurrent ? 'persisted' : 'persisted_stale',
        persistenceReason: sourceStillCurrent
          ? 'accepted_candidate_persisted'
          : 'source_generation_superseded_during_candidate_persistence',
        persistenceTargetId: persisted.id,
      });
    } catch (error) {
      const failure = error instanceof Error ? error.message : String(error);
      failures.push(`${candidate.id}:${failure}`);
      outcomes.push({
        ...candidate,
        persistenceStatus: 'failed',
        persistenceReason: failure,
      });
    }
  }

  return { outcomes, persistedTargets, failures, sourceBecameStale };
}
