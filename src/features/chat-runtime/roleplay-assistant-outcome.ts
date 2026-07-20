import type {
  CharacterStateMessageSnapshot,
  Memory,
  Message,
  SideCharacterMessageSnapshot,
  StoryGoal,
  StoryGoalStepDerivation,
} from '@/types';
import type { RoleplaySupportReviewEnvelope } from './roleplay-support-review-envelope';
import type {
  RoleplayUserStateAuthority,
  RoleplayUserStateAuthorityDecision,
} from './roleplay-user-state-authority';

export const ROLEPLAY_ASSISTANT_OUTCOME_CATEGORIES = [
  'character_state',
  'side_character_state',
  'memory',
  'goal_step',
] as const;

export type RoleplayAssistantOutcomeCategory = typeof ROLEPLAY_ASSISTANT_OUTCOME_CATEGORIES[number];

export type RoleplayAssistantOutcomeAvailability =
  | 'available'
  | 'none'
  | 'pending_or_unknown'
  | 'stale'
  | 'unsupported';

export type RoleplayAssistantOutcomeFact = {
  id: string;
  category: RoleplayAssistantOutcomeCategory;
  label: string;
  content: string;
  artifactId: string;
  sourceMessageId: string;
  sourceGenerationId: string;
};

export type RoleplayAssistantOutcomeCategoryStatus = {
  category: RoleplayAssistantOutcomeCategory;
  availability: RoleplayAssistantOutcomeAvailability;
  reason: string;
  factCount: number;
};

export type RoleplayAssistantOutcomeAuthoritySummary = {
  acceptedObservationCount: number;
  excludedInterpretationCount: number;
  excludedUnsupportedCount: number;
  authorityClasses: RoleplayUserStateAuthority[];
};

export type RoleplayAssistantOutcomeRecord = {
  contract: 'RoleplayAssistantOutcomeRecord';
  version: 1;
  messageId: string;
  generationId: string;
  facts: RoleplayAssistantOutcomeFact[];
  categoryStatus: RoleplayAssistantOutcomeCategoryStatus[];
  authoritySummary: RoleplayAssistantOutcomeAuthoritySummary;
};

type BuildRoleplayAssistantOutcomeRecordsInput = {
  messages: Message[];
  characterSnapshots?: CharacterStateMessageSnapshot[];
  sideCharacterSnapshots?: SideCharacterMessageSnapshot[];
  memories?: Memory[];
  goalStepDerivations?: StoryGoalStepDerivation[];
  userStateAuthorityDecisions?: RoleplayUserStateAuthorityDecision[];
  supportReviewEnvelopes?: RoleplaySupportReviewEnvelope[];
  mainCharacterNames?: ReadonlyMap<string, string>;
  sideCharacterNames?: ReadonlyMap<string, string>;
  storyGoals?: StoryGoal[];
};

type CategoryEvidence = {
  facts: RoleplayAssistantOutcomeFact[];
  hasStaleArtifact: boolean;
  hasUnsupportedArtifact: boolean;
  envelope?: RoleplaySupportReviewEnvelope;
};

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
}

function compactText(value: unknown, max = 320): string {
  const text = normalizeText(value);
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max - 1).trim()}...` : text;
}

function messageGenerationId(message: Pick<Message, 'id' | 'generationId'>): string {
  return message.generationId || message.id;
}

function artifactMatches(
  sourceMessageId: string | undefined,
  sourceGenerationId: string | undefined,
  messageId: string,
  generationId: string,
): boolean {
  return sourceMessageId === messageId && sourceGenerationId === generationId;
}

function artifactIsStale(
  sourceMessageId: string | undefined,
  sourceGenerationId: string | undefined,
  messageId: string,
  generationId: string,
): boolean {
  return sourceMessageId === messageId
    && Boolean(sourceGenerationId)
    && sourceGenerationId !== generationId;
}

function categoryWorker(category: RoleplayAssistantOutcomeCategory) {
  if (category === 'memory') return 'memory_extraction' as const;
  if (category === 'goal_step') return 'goal_progress' as const;
  return 'character_state' as const;
}

function matchingEnvelope(
  envelopes: RoleplaySupportReviewEnvelope[],
  category: RoleplayAssistantOutcomeCategory,
  messageId: string,
  generationId: string,
): RoleplaySupportReviewEnvelope | undefined {
  const worker = categoryWorker(category);
  return [...envelopes].reverse().find((envelope) => (
    envelope.worker === worker
      && envelope.sourceMessageId === messageId
      && envelope.sourceGenerationId === generationId
  ));
}

function categoryStatus(
  category: RoleplayAssistantOutcomeCategory,
  evidence: CategoryEvidence,
): RoleplayAssistantOutcomeCategoryStatus {
  if (evidence.facts.length > 0) {
    return {
      category,
      availability: 'available',
      reason: 'generation_matched_persisted_artifact_available',
      factCount: evidence.facts.length,
    };
  }
  if (evidence.hasStaleArtifact || evidence.envelope?.readiness === 'skipped_stale') {
    return {
      category,
      availability: 'stale',
      reason: 'artifact_exists_only_for_superseded_generation',
      factCount: 0,
    };
  }
  if (evidence.hasUnsupportedArtifact) {
    return {
      category,
      availability: 'unsupported',
      reason: 'artifact_missing_required_message_or_generation_lineage',
      factCount: 0,
    };
  }
  if (evidence.envelope?.readiness === 'no_updates'
    || evidence.envelope?.readiness === 'rejected_only') {
    return {
      category,
      availability: 'none',
      reason: `support_worker_${evidence.envelope.readiness}`,
      factCount: 0,
    };
  }
  return {
    category,
    availability: 'pending_or_unknown',
    reason: evidence.envelope
      ? `support_worker_${evidence.envelope.readiness}_without_loaded_persisted_artifact`
      : 'no_generation_matched_persisted_artifact_or_completion_receipt',
    factCount: 0,
  };
}

function pushUniqueFact(
  target: RoleplayAssistantOutcomeFact[],
  seen: Set<string>,
  fact: RoleplayAssistantOutcomeFact,
) {
  const key = `${fact.category}:${normalizeText(fact.content).toLocaleLowerCase()}`;
  if (!fact.content || seen.has(key)) return;
  seen.add(key);
  target.push(fact);
}

function buildCharacterStateEvidence(input: {
  snapshots: CharacterStateMessageSnapshot[];
  messageId: string;
  generationId: string;
  names: ReadonlyMap<string, string>;
  category: 'character_state';
  envelope?: RoleplaySupportReviewEnvelope;
}): CategoryEvidence {
  const facts: RoleplayAssistantOutcomeFact[] = [];
  const seen = new Set<string>();
  let hasStaleArtifact = false;
  let hasUnsupportedArtifact = false;

  for (const snapshot of input.snapshots) {
    if (artifactIsStale(snapshot.sourceMessageId, snapshot.sourceGenerationId, input.messageId, input.generationId)) {
      hasStaleArtifact = true;
      continue;
    }
    if (snapshot.sourceMessageId === input.messageId && !snapshot.sourceGenerationId) {
      hasUnsupportedArtifact = true;
      continue;
    }
    if (!artifactMatches(snapshot.sourceMessageId, snapshot.sourceGenerationId, input.messageId, input.generationId)) continue;

    const characterName = compactText(input.names.get(snapshot.characterId) || 'Character', 80);
    for (const metadata of Object.values(snapshot.statePayload._fieldChangeMetadata || {})) {
      if (!artifactMatches(metadata.sourceMessageId, metadata.sourceGenerationId, input.messageId, input.generationId)) continue;
      const value = compactText(metadata.nextValuePreview);
      if (!value) continue;
      pushUniqueFact(facts, seen, {
        id: `${snapshot.id}:${metadata.fieldPath}`,
        category: input.category,
        label: `${characterName} ${metadata.fieldPath}`,
        content: `${characterName}.${metadata.fieldPath}: ${value}`,
        artifactId: snapshot.id,
        sourceMessageId: input.messageId,
        sourceGenerationId: input.generationId,
      });
    }
  }

  return { facts, hasStaleArtifact, hasUnsupportedArtifact, envelope: input.envelope };
}

function buildSideCharacterStateEvidence(input: {
  snapshots: SideCharacterMessageSnapshot[];
  messageId: string;
  generationId: string;
  names: ReadonlyMap<string, string>;
  category: 'side_character_state';
  envelope?: RoleplaySupportReviewEnvelope;
}): CategoryEvidence {
  const facts: RoleplayAssistantOutcomeFact[] = [];
  const seen = new Set<string>();
  let hasStaleArtifact = false;
  let hasUnsupportedArtifact = false;

  for (const snapshot of input.snapshots) {
    if (artifactIsStale(snapshot.sourceMessageId, snapshot.sourceGenerationId, input.messageId, input.generationId)) {
      hasStaleArtifact = true;
      continue;
    }
    if (snapshot.sourceMessageId === input.messageId && !snapshot.sourceGenerationId) {
      hasUnsupportedArtifact = true;
      continue;
    }
    if (!artifactMatches(snapshot.sourceMessageId, snapshot.sourceGenerationId, input.messageId, input.generationId)) continue;

    const characterName = compactText(input.names.get(snapshot.sideCharacterId) || 'Side character', 80);
    for (const metadata of Object.values(snapshot.statePayload._fieldChangeMetadata || {})) {
      if (!artifactMatches(metadata.sourceMessageId, metadata.sourceGenerationId, input.messageId, input.generationId)) continue;
      const value = compactText(metadata.nextValuePreview);
      if (!value) continue;
      pushUniqueFact(facts, seen, {
        id: `${snapshot.id}:${metadata.fieldPath}`,
        category: input.category,
        label: `${characterName} ${metadata.fieldPath}`,
        content: `${characterName}.${metadata.fieldPath}: ${value}`,
        artifactId: snapshot.id,
        sourceMessageId: input.messageId,
        sourceGenerationId: input.generationId,
      });
    }
  }

  return { facts, hasStaleArtifact, hasUnsupportedArtifact, envelope: input.envelope };
}

function buildMemoryEvidence(input: {
  memories: Memory[];
  messageId: string;
  generationId: string;
  envelope?: RoleplaySupportReviewEnvelope;
}): CategoryEvidence {
  const facts: RoleplayAssistantOutcomeFact[] = [];
  const seen = new Set<string>();
  let hasStaleArtifact = false;
  let hasUnsupportedArtifact = false;

  for (const memory of input.memories) {
    if (artifactIsStale(memory.sourceMessageId, memory.sourceGenerationId, input.messageId, input.generationId)) {
      hasStaleArtifact = true;
      continue;
    }
    if (memory.sourceMessageId === input.messageId && !memory.sourceGenerationId) {
      hasUnsupportedArtifact = true;
      continue;
    }
    if (!artifactMatches(memory.sourceMessageId, memory.sourceGenerationId, input.messageId, input.generationId)) continue;
    const content = compactText(memory.content);
    if (!content) continue;
    pushUniqueFact(facts, seen, {
      id: memory.id,
      category: 'memory',
      label: `Persisted ${memory.entryType || 'memory'}`,
      content,
      artifactId: memory.id,
      sourceMessageId: input.messageId,
      sourceGenerationId: input.generationId,
    });
  }

  return { facts, hasStaleArtifact, hasUnsupportedArtifact, envelope: input.envelope };
}

function buildGoalEvidence(input: {
  derivations: StoryGoalStepDerivation[];
  messageId: string;
  generationId: string;
  goals: StoryGoal[];
  envelope?: RoleplaySupportReviewEnvelope;
}): CategoryEvidence {
  const facts: RoleplayAssistantOutcomeFact[] = [];
  const seen = new Set<string>();
  let hasStaleArtifact = false;
  let hasUnsupportedArtifact = false;
  const goalsById = new Map(input.goals.map((goal) => [goal.id, goal]));

  for (const derivation of input.derivations) {
    if (artifactIsStale(derivation.sourceMessageId, derivation.sourceGenerationId, input.messageId, input.generationId)) {
      hasStaleArtifact = true;
      continue;
    }
    if (derivation.sourceMessageId === input.messageId && !derivation.sourceGenerationId) {
      hasUnsupportedArtifact = true;
      continue;
    }
    if (!artifactMatches(derivation.sourceMessageId, derivation.sourceGenerationId, input.messageId, input.generationId)) continue;
    if (!derivation.completed) continue;
    const goal = goalsById.get(derivation.goalId);
    const step = goal?.steps?.find((entry) => entry.id === derivation.stepId);
    const goalLabel = compactText(goal?.title || derivation.goalId, 120);
    const stepLabel = compactText(step?.description || derivation.stepId, 220);
    pushUniqueFact(facts, seen, {
      id: derivation.id,
      category: 'goal_step',
      label: `Completed story goal step`,
      content: `${goalLabel}: ${stepLabel}`,
      artifactId: derivation.id,
      sourceMessageId: input.messageId,
      sourceGenerationId: input.generationId,
    });
  }

  return { facts, hasStaleArtifact, hasUnsupportedArtifact, envelope: input.envelope };
}

function buildAuthoritySummary(
  decisions: RoleplayUserStateAuthorityDecision[],
  messageId: string,
  generationId: string,
): RoleplayAssistantOutcomeAuthoritySummary {
  const matching = decisions.filter((decision) => (
    decision.sourceRole === 'assistant'
      && decision.sourceMessageId === messageId
      && decision.sourceGenerationId === generationId
  ));
  const authorityClasses = [...new Set(matching.map((decision) => decision.authority))];
  return {
    acceptedObservationCount: matching.filter((decision) => (
      decision.authority === 'accepted_assistant_observable_change'
        && decision.modelFacingAction === 'allow_as_observation'
    )).length,
    excludedInterpretationCount: matching.filter((decision) => (
      decision.authority === 'assistant_interpretation'
    )).length,
    excludedUnsupportedCount: matching.filter((decision) => (
      decision.authority === 'unsupported_overreach'
    )).length,
    authorityClasses,
  };
}

export function buildRoleplayAssistantOutcomeRecords({
  messages,
  characterSnapshots = [],
  sideCharacterSnapshots = [],
  memories = [],
  goalStepDerivations = [],
  userStateAuthorityDecisions = [],
  supportReviewEnvelopes = [],
  mainCharacterNames = new Map(),
  sideCharacterNames = new Map(),
  storyGoals = [],
}: BuildRoleplayAssistantOutcomeRecordsInput): RoleplayAssistantOutcomeRecord[] {
  return messages
    .filter((message) => message.role === 'assistant' && !message.localNotice)
    .map((message) => {
      const generationId = messageGenerationId(message);
      const evidenceByCategory: Record<RoleplayAssistantOutcomeCategory, CategoryEvidence> = {
        character_state: buildCharacterStateEvidence({
          snapshots: characterSnapshots,
          messageId: message.id,
          generationId,
          names: mainCharacterNames,
          category: 'character_state',
          envelope: matchingEnvelope(supportReviewEnvelopes, 'character_state', message.id, generationId),
        }),
        side_character_state: buildSideCharacterStateEvidence({
          snapshots: sideCharacterSnapshots,
          messageId: message.id,
          generationId,
          names: sideCharacterNames,
          category: 'side_character_state',
          envelope: matchingEnvelope(supportReviewEnvelopes, 'side_character_state', message.id, generationId),
        }),
        memory: buildMemoryEvidence({
          memories,
          messageId: message.id,
          generationId,
          envelope: matchingEnvelope(supportReviewEnvelopes, 'memory', message.id, generationId),
        }),
        goal_step: buildGoalEvidence({
          derivations: goalStepDerivations,
          messageId: message.id,
          generationId,
          goals: storyGoals,
          envelope: matchingEnvelope(supportReviewEnvelopes, 'goal_step', message.id, generationId),
        }),
      };
      const facts = ROLEPLAY_ASSISTANT_OUTCOME_CATEGORIES.flatMap((category) => (
        evidenceByCategory[category].facts
      ));
      return {
        contract: 'RoleplayAssistantOutcomeRecord' as const,
        version: 1 as const,
        messageId: message.id,
        generationId,
        facts,
        categoryStatus: ROLEPLAY_ASSISTANT_OUTCOME_CATEGORIES.map((category) => (
          categoryStatus(category, evidenceByCategory[category])
        )),
        authoritySummary: buildAuthoritySummary(
          userStateAuthorityDecisions,
          message.id,
          generationId,
        ),
      };
    });
}

export function renderRoleplayAssistantOutcomeRecord(
  record: RoleplayAssistantOutcomeRecord,
): string | null {
  if (record.facts.length === 0) return null;
  return [
    '[OLDER ASSISTANT OUTCOME]',
    'Use these persisted consequences for continuity. They replace the older assistant prose and are not a style example.',
    ...record.facts.map((fact) => `- ${fact.content}`),
  ].join('\n');
}
