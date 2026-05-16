export type ParsedGoalUpdateValue = {
  desiredOutcome: string;
  currentStatus: string;
  progress: number | null;
  completeStepIndexes: number[];
  newStepsText: string;
  hasCurrentStatus: boolean;
  hasProgress: boolean;
};

const GOAL_UPDATE_KEYS = [
  'desired_outcome',
  'current_status',
  'progress',
  'complete_steps',
  'new_steps',
] as const;

function normalizeGoalText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getDelimitedGoalField(raw: string, key: (typeof GOAL_UPDATE_KEYS)[number]): string {
  const nextKeyPattern = GOAL_UPDATE_KEYS.filter((candidate) => candidate !== key).join('|');
  const pattern = new RegExp(
    `${key}\\s*:\\s*([\\s\\S]*?)(?=\\s*\\|\\s*(?:${nextKeyPattern})\\s*:|$)`,
    'i',
  );
  return raw.match(pattern)?.[1]?.trim() || '';
}

function stripGoalControlFields(raw: string): string {
  let cleaned = raw;
  for (const key of GOAL_UPDATE_KEYS) {
    const nextKeyPattern = GOAL_UPDATE_KEYS.filter((candidate) => candidate !== key).join('|');
    cleaned = cleaned.replace(
      new RegExp(`\\s*\\|?\\s*${key}\\s*:\\s*[\\s\\S]*?(?=\\s*\\|\\s*(?:${nextKeyPattern})\\s*:|$)`, 'ig'),
      ' ',
    );
  }
  return cleaned.replace(/\s+/g, ' ').trim();
}

export function parseExtractedGoalUpdateValue(raw: string): ParsedGoalUpdateValue {
  const value = raw.trim();
  const desiredOutcome = getDelimitedGoalField(value, 'desired_outcome');
  const currentStatus = getDelimitedGoalField(value, 'current_status') || stripGoalControlFields(value);
  const progressRaw = getDelimitedGoalField(value, 'progress');
  const completeStepsRaw = getDelimitedGoalField(value, 'complete_steps');
  const newStepsText = getDelimitedGoalField(value, 'new_steps');
  const parsedProgress = progressRaw.match(/\d+/)?.[0];

  return {
    desiredOutcome,
    currentStatus,
    progress: parsedProgress ? Math.min(100, Math.max(0, parseInt(parsedProgress, 10))) : null,
    completeStepIndexes: completeStepsRaw
      .split(',')
      .map((entry) => parseInt(entry.trim(), 10))
      .filter((entry) => Number.isFinite(entry)),
    newStepsText,
    hasCurrentStatus: /(?:^|\|)\s*current_status\s*:/i.test(value),
    hasProgress: /(?:^|\|)\s*progress\s*:/i.test(value),
  };
}

export function isTaskLevelGoalText(value: string): boolean {
  const normalized = normalizeGoalText(value);
  if (!normalized) return true;

  const words = normalized.split(/\s+/).filter(Boolean);
  const concreteImmediateStart =
    /^(ask|carry|check|close|drag|enter|exit|grab|guide|hand|inspect|latch|lead|light|lock|look|move|open|pick|place|pull|push|reach|scan|search|shove|squeeze|take|tell|unlock|walk)\b/.test(normalized);
  const immediateTimeBox =
    /\b(now|immediately|right now|this turn|this exchange|next exchange|next few exchanges)\b/.test(normalized);

  return immediateTimeBox || (concreteImmediateStart && words.length <= 10);
}
