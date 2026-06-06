import type {
  GoalAlignmentEvaluation,
  GoalAlignmentSignal,
  GoalAlignmentState,
  GoalAlignmentStateSnapshot,
  GoalAlignmentStatus,
  GoalAlignmentTrend,
  GoalFlexibility,
  GoalKind,
  TimeOfDay,
} from '@/types';

export const GOAL_ALIGNMENT_NEUTRAL_SCORE = 50;

type AlignmentSource = {
  conversationId?: string;
  sourceMessageId?: string;
  sourceGenerationId?: string;
  day?: number | null;
  timeOfDay?: TimeOfDay | null;
  evaluatedAt?: number;
};

const ZERO_UUID = '00000000-0000-0000-0000-000000000000';

export function buildGoalAlignmentKey(
  goalKind: GoalKind,
  goalId: string,
  characterId?: string | null,
): string {
  return `${goalKind}:${characterId || ZERO_UUID}:${goalId}`;
}

export function normalizeGoalAlignmentState(
  partial: Partial<GoalAlignmentState> & { goalId: string; goalKind: GoalKind },
): GoalAlignmentState {
  return {
    id: partial.id,
    conversationId: partial.conversationId,
    goalId: partial.goalId,
    goalKind: partial.goalKind,
    characterId: partial.characterId ?? null,
    score: clampScore(partial.score ?? GOAL_ALIGNMENT_NEUTRAL_SCORE),
    status: partial.status || 'active',
    trend: partial.trend || 'stable',
    supportCount: Math.max(0, partial.supportCount ?? 0),
    resistanceCount: Math.max(0, partial.resistanceCount ?? 0),
    driftCount: Math.max(0, partial.driftCount ?? 0),
    lastSignal: partial.lastSignal || 'not_applicable',
    lastRationale: partial.lastRationale || '',
    lastEvaluatedAt: partial.lastEvaluatedAt,
    lastEvaluatedDay: partial.lastEvaluatedDay ?? null,
    lastEvaluatedTimeOfDay: partial.lastEvaluatedTimeOfDay ?? null,
    sourceMessageId: partial.sourceMessageId ?? null,
    sourceGenerationId: partial.sourceGenerationId ?? null,
    previousState: normalizePreviousStateSnapshot(partial.previousState),
    createdAt: partial.createdAt,
    updatedAt: partial.updatedAt,
  };
}

export function applyGoalAlignmentEvaluation(
  previous: Partial<GoalAlignmentState> & { goalId: string; goalKind: GoalKind },
  evaluation: GoalAlignmentEvaluation,
  flexibility: GoalFlexibility = 'normal',
  source: AlignmentSource = {},
): GoalAlignmentState {
  const base = normalizeGoalAlignmentState(previous);
  const intensity = normalizeIntensity(evaluation.intensity);
  const delta = getAlignmentDelta(evaluation.signal, intensity, flexibility);
  const nextScore = clampScore(base.score + delta);
  const trend = getTrend(delta);

  const supportCount = base.supportCount + (evaluation.signal === 'support' ? 1 : 0);
  const resistanceCount = base.resistanceCount + (evaluation.signal === 'resistance' ? 1 : 0);
  const driftCount = base.driftCount + (evaluation.signal === 'drift' ? 1 : 0);

  return normalizeGoalAlignmentState({
    ...base,
    goalId: evaluation.goalId,
    goalKind: evaluation.goalKind,
    characterId: evaluation.characterId ?? base.characterId ?? null,
    conversationId: source.conversationId ?? base.conversationId,
    score: nextScore,
    status: deriveGoalAlignmentStatus({
      signal: evaluation.signal,
      score: nextScore,
      flexibility,
      supportCount,
      resistanceCount,
      driftCount,
    }),
    trend,
    supportCount,
    resistanceCount,
    driftCount,
    lastSignal: evaluation.signal,
    lastRationale: summarizeRationale(evaluation.rationale, evaluation.evidence),
    lastEvaluatedAt: source.evaluatedAt ?? Date.now(),
    lastEvaluatedDay: source.day ?? base.lastEvaluatedDay ?? null,
    lastEvaluatedTimeOfDay: source.timeOfDay ?? base.lastEvaluatedTimeOfDay ?? null,
    sourceMessageId: source.sourceMessageId ?? base.sourceMessageId ?? null,
    sourceGenerationId: source.sourceGenerationId ?? base.sourceGenerationId ?? null,
    previousState: toPreviousStateSnapshot(base),
  });
}

export function shouldRenderGoalToWriter(alignment?: GoalAlignmentState, flexibility: GoalFlexibility = 'normal'): boolean {
  if (!alignment) return true;
  return alignment.status !== 'dropped';
}

export function describeGoalAlignmentForPrompt(
  alignment: GoalAlignmentState | undefined,
  flexibility: GoalFlexibility = 'normal',
): string {
  if (!alignment) return '';

  const score = clampScore(alignment.score);
  if (alignment.status === 'dropped') {
    return `Current alignment: dropped, score ${score}/100. The user and scene have repeatedly moved away from this goal; do not pursue it unless the user reintroduces it.`;
  }
  if (alignment.status === 'resisted') {
    return `Current alignment: resisted, score ${score}/100, trend ${alignment.trend}. The user recently pushed against this goal; reduce pressure and revisit only through organic opportunities.`;
  }
  if (alignment.status === 'drifting') {
    return `Current alignment: drifting, score ${score}/100, trend ${alignment.trend}. The scene has been carrying away from this goal; keep it in background unless a natural opening returns.`;
  }
  if (alignment.status === 'supported') {
    return `Current alignment: supported, score ${score}/100, trend ${alignment.trend}. The user and scene have been receptive; keep momentum natural without forcing the next response.`;
  }
  if (alignment.status === 'dormant') {
    return `Current alignment: dormant, score ${score}/100. Keep this as background context and wait for a relevant opening.`;
  }
  return `Current alignment: active, score ${score}/100, trend ${alignment.trend}. Use as background guidance, not as an immediate command.`;
}

export function formatGoalAlignmentChange(state: GoalAlignmentState, label: string): string {
  const rationale = state.lastRationale ? ` because ${state.lastRationale}` : '';
  const previous = state.previousState;
  if (previous) {
    return `${label} alignment ${previous.status} -> ${state.status}, score ${previous.score}/100 -> ${state.score}/100 (${state.trend}, ${state.lastSignal})${rationale}`;
  }
  return `${label} alignment ${state.status}, score ${state.score}/100 (${state.trend}, ${state.lastSignal})${rationale}`;
}

function getAlignmentDelta(
  signal: GoalAlignmentSignal,
  intensity: 0 | 1 | 2 | 3,
  flexibility: GoalFlexibility,
): number {
  if (intensity === 0 || signal === 'neutral' || signal === 'not_applicable') return 0;

  const tables: Record<GoalFlexibility, Record<'support' | 'resistance' | 'drift', number[]>> = {
    rigid: {
      support: [0, 3, 5, 7],
      resistance: [0, -2, -4, -6],
      drift: [0, -1, -2, -3],
    },
    normal: {
      support: [0, 5, 8, 11],
      resistance: [0, -5, -9, -13],
      drift: [0, -2, -4, -6],
    },
    flexible: {
      support: [0, 7, 11, 15],
      resistance: [0, -8, -14, -20],
      drift: [0, -4, -7, -10],
    },
  };

  if (signal === 'support' || signal === 'resistance' || signal === 'drift') {
    return tables[flexibility][signal][intensity];
  }

  return 0;
}

function deriveGoalAlignmentStatus(input: {
  signal: GoalAlignmentSignal;
  score: number;
  flexibility: GoalFlexibility;
  supportCount: number;
  resistanceCount: number;
  driftCount: number;
}): GoalAlignmentStatus {
  const negativeSignalCount = input.resistanceCount + input.driftCount;
  if (input.signal !== 'support') {
    if (input.flexibility === 'flexible' && input.score <= 18 && negativeSignalCount >= 3) return 'dropped';
    if (input.flexibility === 'normal' && input.score <= 10 && negativeSignalCount >= 5) return 'dropped';
  }
  if (input.signal === 'resistance') return 'resisted';
  if (input.signal === 'drift') return 'drifting';
  if (input.signal === 'support' && input.score >= 60) return 'supported';
  if (input.score <= 25) return 'dormant';
  return 'active';
}

function normalizeIntensity(value: unknown): 0 | 1 | 2 | 3 {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (numeric >= 3) return 3;
  if (numeric >= 2) return 2;
  if (numeric >= 1) return 1;
  return 0;
}

function normalizePreviousStateSnapshot(
  partial?: Partial<GoalAlignmentStateSnapshot> | null,
): GoalAlignmentStateSnapshot | null {
  if (!partial) return null;
  return {
    score: clampScore(partial.score ?? GOAL_ALIGNMENT_NEUTRAL_SCORE),
    status: partial.status || 'active',
    trend: partial.trend || 'stable',
    supportCount: Math.max(0, partial.supportCount ?? 0),
    resistanceCount: Math.max(0, partial.resistanceCount ?? 0),
    driftCount: Math.max(0, partial.driftCount ?? 0),
    lastSignal: partial.lastSignal || 'not_applicable',
    lastRationale: partial.lastRationale || '',
    lastEvaluatedAt: partial.lastEvaluatedAt,
    lastEvaluatedDay: partial.lastEvaluatedDay ?? null,
    lastEvaluatedTimeOfDay: partial.lastEvaluatedTimeOfDay ?? null,
    sourceMessageId: partial.sourceMessageId ?? null,
    sourceGenerationId: partial.sourceGenerationId ?? null,
  };
}

function toPreviousStateSnapshot(state: GoalAlignmentState): GoalAlignmentStateSnapshot {
  return {
    score: clampScore(state.score),
    status: state.status,
    trend: state.trend,
    supportCount: state.supportCount,
    resistanceCount: state.resistanceCount,
    driftCount: state.driftCount,
    lastSignal: state.lastSignal,
    lastRationale: state.lastRationale || '',
    lastEvaluatedAt: state.lastEvaluatedAt,
    lastEvaluatedDay: state.lastEvaluatedDay ?? null,
    lastEvaluatedTimeOfDay: state.lastEvaluatedTimeOfDay ?? null,
    sourceMessageId: state.sourceMessageId ?? null,
    sourceGenerationId: state.sourceGenerationId ?? null,
  };
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getTrend(delta: number): GoalAlignmentTrend {
  if (delta > 0) return 'rising';
  if (delta < 0) return 'falling';
  return 'stable';
}

function summarizeRationale(rationale?: string, evidence?: string): string {
  const combined = [rationale, evidence].filter(Boolean).join(' Evidence: ');
  return combined.trim().replace(/\s+/g, ' ').slice(0, 280);
}
