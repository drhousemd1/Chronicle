import type {
  RoleplaySupportPromptTarget,
  RoleplaySupportReviewEnvelope,
  RoleplaySupportWorker,
} from './roleplay-support-review-envelope';
import { isRoleplaySupportReviewEnvelopePromptEligible } from './roleplay-support-review-envelope';

export type RoleplaySupportRegistryRow = {
  worker: RoleplaySupportWorker;
  sourceMessageId?: string;
  sourceGenerationId?: string;
  readiness: RoleplaySupportReviewEnvelope['readiness'];
  persistence: RoleplaySupportReviewEnvelope['persistence']['status'];
  futurePromptEligible: boolean;
  acceptedCount: number;
  rejectedCount: number;
  omittedCount: number;
};

export type RoleplaySupportReentryRow = {
  worker: RoleplaySupportWorker;
  sourceMessageId?: string;
  sourceGenerationId?: string;
  target: RoleplaySupportPromptTarget;
  acceptedItemIds: string[];
  persistenceTargets: string[];
  reason: string;
};

export type RoleplaySupportContextGapRow = {
  worker: RoleplaySupportWorker;
  sourceMessageId?: string;
  sourceGenerationId?: string;
  message: string;
};

export type RoleplaySupportReviewRows = {
  registry: RoleplaySupportRegistryRow;
  reentry: RoleplaySupportReentryRow[];
  contextGaps: RoleplaySupportContextGapRow[];
};

export function deriveRoleplaySupportReviewRows(
  envelope: RoleplaySupportReviewEnvelope,
): RoleplaySupportReviewRows {
  const futurePromptEligible = isRoleplaySupportReviewEnvelopePromptEligible(envelope);
  const persistedAcceptedItems = envelope.accepted.filter((item) => (
    item.persistenceStatus
      ? item.persistenceStatus === 'persisted'
      : envelope.persistence.status === 'persisted'
  ));

  return {
    registry: {
      worker: envelope.worker,
      sourceMessageId: envelope.sourceMessageId,
      sourceGenerationId: envelope.sourceGenerationId,
      readiness: envelope.readiness,
      persistence: envelope.persistence.status,
      futurePromptEligible,
      acceptedCount: envelope.accepted.length,
      rejectedCount: envelope.rejected.length,
      omittedCount: envelope.omitted.length,
    },
    reentry: futurePromptEligible
      ? envelope.futurePromptImpact.targets.map((target) => ({
          worker: envelope.worker,
          sourceMessageId: envelope.sourceMessageId,
          sourceGenerationId: envelope.sourceGenerationId,
          target,
          acceptedItemIds: persistedAcceptedItems.map((item) => item.id),
          persistenceTargets: envelope.persistence.targets,
          reason: envelope.futurePromptImpact.reason,
        }))
      : [],
    contextGaps: envelope.contextGaps.map((message) => ({
      worker: envelope.worker,
      sourceMessageId: envelope.sourceMessageId,
      sourceGenerationId: envelope.sourceGenerationId,
      message,
    })),
  };
}
