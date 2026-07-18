import type {
  Character,
  CharacterGoal,
  Scene,
  ScenarioData,
  StoryGoal,
} from '@/types';
import { shouldRenderGoalToWriter } from '@/lib/goal-alignment';
import type { RoleplayResponseMode } from './roleplay-response-job';

export type RoleplayGoalTier = 'active' | 'background' | 'hidden_this_turn';
export type RoleplayGoalRenderDetail = 'full' | 'compact' | 'debug_only';

export type RoleplayGoalTurnDecision = {
  goalId: string;
  title: string;
  goalKind: 'story' | 'character';
  ownerCharacterId?: string;
  ownerCharacterName?: string;
  tier: RoleplayGoalTier;
  reason: string;
  evidence: string[];
  renderDetail: RoleplayGoalRenderDetail;
  openMilestoneId?: string;
  partialProgress: 'none' | 'debug_only';
};

export type RoleplayGoalExposureDecision = {
  mode: RoleplayResponseMode;
  receiptId: string;
  decisions: RoleplayGoalTurnDecision[];
};

export type SelectRoleplayGoalsForTurnInput = {
  appData: ScenarioData;
  latestPlayerTurn: string;
  activeScene?: Scene | null;
  mode: RoleplayResponseMode;
};

type SelectableGoal = StoryGoal | CharacterGoal;

const GOAL_STOP_WORDS = new Set([
  'about', 'after', 'again', 'being', 'could', 'every', 'from', 'have', 'into',
  'more', 'should', 'their', 'there', 'these', 'they', 'this', 'through', 'with',
  'would', 'your', 'goal', 'current', 'story', 'character',
]);

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function evidenceTerms(value: unknown): Set<string> {
  return new Set(
    normalizeText(value)
      .split(/[^a-z0-9]+/)
      .filter((term) => term.length >= 4 && !GOAL_STOP_WORDS.has(term)),
  );
}

function goalEvidenceTerms(goal: SelectableGoal): Set<string> {
  const openMilestone = goal.steps?.find((step) => !step.completed)?.description || '';
  return evidenceTerms([
    goal.title,
    goal.desiredOutcome,
    goal.currentStatus,
    openMilestone,
  ].filter(Boolean).join(' '));
}

function intersection(left: Set<string>, right: Set<string>): string[] {
  return [...left].filter((term) => right.has(term)).sort();
}

function normalizedFlexibility(goal: SelectableGoal): 'rigid' | 'normal' | 'flexible' {
  return goal.flexibility === 'rigid' || goal.flexibility === 'flexible'
    ? goal.flexibility
    : 'normal';
}

function decideGoal(input: {
  goal: SelectableGoal;
  goalKind: 'story' | 'character';
  latestPlayerTurn: string;
  activeScene?: Scene | null;
  owner?: Pick<Character, 'id' | 'name'>;
}): RoleplayGoalTurnDecision {
  const { goal, goalKind, latestPlayerTurn, activeScene, owner } = input;
  const title = goal.title?.trim() || goal.desiredOutcome?.trim() || 'Untitled goal';
  const openMilestone = goal.steps?.find((step) => !step.completed);
  const base = {
    goalId: goal.id,
    title,
    goalKind,
    ownerCharacterId: owner?.id,
    ownerCharacterName: owner?.name,
    openMilestoneId: openMilestone?.id,
    partialProgress: 'debug_only' as const,
  };

  if (!shouldRenderGoalToWriter(goal.alignment, normalizedFlexibility(goal))) {
    return {
      ...base,
      tier: 'hidden_this_turn',
      reason: 'alignment_not_writer_visible',
      evidence: ['existing_goal_alignment_policy'],
      renderDetail: 'debug_only',
    };
  }

  const goalTerms = goalEvidenceTerms(goal);
  const playerTerms = evidenceTerms(latestPlayerTurn);
  const sceneTerms = evidenceTerms([
    activeScene?.title,
    ...(activeScene?.tags || []),
  ].filter(Boolean).join(' '));
  const playerMatches = intersection(goalTerms, playerTerms);
  const sceneMatches = intersection(goalTerms, sceneTerms);
  const ownerName = normalizeText(owner?.name);
  const ownerMentioned = ownerName.length > 0 && normalizeText(latestPlayerTurn).includes(ownerName);

  const evidence = [
    ownerMentioned && playerMatches.length >= 1
      ? `latest_player_turn_mentions_owner_and_goal:${owner?.name}:${playerMatches.join(',')}`
      : '',
    playerMatches.length >= 2 ? `latest_player_turn_goal_terms:${playerMatches.join(',')}` : '',
    sceneMatches.length >= 2 ? `active_scene_goal_terms:${sceneMatches.join(',')}` : '',
  ].filter(Boolean);

  if (evidence.length > 0) {
    return {
      ...base,
      tier: 'active',
      reason: 'supported_by_current_turn_evidence',
      evidence,
      renderDetail: 'full',
    };
  }

  return {
    ...base,
    tier: 'background',
    reason: 'writer_visible_without_current_turn_support',
    evidence: ['existing_goal_visibility_only'],
    renderDetail: 'compact',
  };
}

function hashReceiptValue(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function selectRoleplayGoalsForTurn({
  appData,
  latestPlayerTurn,
  activeScene,
  mode,
}: SelectRoleplayGoalsForTurnInput): RoleplayGoalExposureDecision {
  const storyDecisions = (appData.world.core.storyGoals || []).map((goal) => decideGoal({
    goal,
    goalKind: 'story',
    latestPlayerTurn,
    activeScene,
  }));

  const characterDecisions = appData.characters.flatMap((character) => (
    (character.goals || []).map((goal) => decideGoal({
      goal,
      goalKind: 'character',
      latestPlayerTurn,
      activeScene,
      owner: character,
    }))
  ));

  const decisions = [...storyDecisions, ...characterDecisions];
  const receiptSource = decisions
    .map((decision) => `${decision.goalKind}:${decision.goalId}:${decision.tier}:${decision.renderDetail}`)
    .join('|');

  return {
    mode,
    receiptId: `goal-exposure:${mode}:${hashReceiptValue(receiptSource)}`,
    decisions,
  };
}
