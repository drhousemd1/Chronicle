
export type CreatorReviewRatings = {
  conceptStrength: number;
  initialSituation: number;
  roleClarity: number;
  motivationTension: number;
  tonePromise: number;
  lowFrictionStart: number;
  worldbuildingVibe: number;
  replayability: number;
  characterDetailsComplexity: number;
};

type RatingKey = keyof CreatorReviewRatings;

export const REVIEW_WEIGHTS: Record<RatingKey, number> = {
  conceptStrength: 0.12,
  initialSituation: 0.12,
  roleClarity: 0.10,
  motivationTension: 0.10,
  tonePromise: 0.08,
  lowFrictionStart: 0.10,
  worldbuildingVibe: 0.12,
  replayability: 0.12,
  characterDetailsComplexity: 0.14,
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function roundToNearestHalf(raw: number) {
  return Math.round(raw * 2) / 2;
}

export function computeOverallRating(
  ratings: Partial<CreatorReviewRatings>,
  weights: Partial<Record<RatingKey, number>> = REVIEW_WEIGHTS
): { raw: number; display: number } | null {
  let weightedSum = 0;
  let weightSum = 0;

  (Object.keys(REVIEW_WEIGHTS) as RatingKey[]).forEach((k) => {
    const v = ratings[k];
    const w = weights[k];
    if (typeof v !== 'number') return;
    if (typeof w !== 'number' || w <= 0) return;
    weightedSum += clamp(v, 1, 5) * w;
    weightSum += w;
  });

  if (weightSum === 0) return null;

  const raw = weightedSum / weightSum;
  const display = clamp(roundToNearestHalf(raw), 1, 5);

  return { raw, display };
}

export function getStarBreakdown(display: number): { fullStars: number; halfStars: number; emptyStars: number } {
  const fullStars = Math.floor(display);
  const halfStars = display % 1 >= 0.5 ? 1 : 0;
  const emptyStars = 5 - fullStars - halfStars;
  return { fullStars, halfStars, emptyStars };
}

export interface ReviewCategory {
  key: RatingKey;
  label: string;
  description: string;
  dbColumn: string;
}

export const REVIEW_CATEGORIES: ReviewCategory[] = [
  { key: 'conceptStrength', label: 'Concept Strength', description: 'Is the scenario idea compelling, specific, and interesting?', dbColumn: 'concept_strength' },
  { key: 'initialSituation', label: 'Initial Situation', description: 'Does it establish a clear starting frame?', dbColumn: 'initial_situation' },
  { key: 'roleClarity', label: 'Role Clarity', description: 'Do you understand who you are and what interaction is expected?', dbColumn: 'role_clarity' },
  { key: 'motivationTension', label: 'Motivation / Tension', description: 'Is there a reason to engage immediately?', dbColumn: 'motivation_tension' },
  { key: 'tonePromise', label: 'Tone Promise', description: 'Does it signal the intended vibe clearly enough?', dbColumn: 'tone_promise' },
  { key: 'lowFrictionStart', label: 'Low-Friction Start', description: 'Can you hit Play and feel oriented?', dbColumn: 'low_friction_start' },
  { key: 'worldbuildingVibe', label: 'Worldbuilding & Vibe', description: 'How rich and usable is the setting for roleplay?', dbColumn: 'worldbuilding_vibe' },
  { key: 'replayability', label: 'Replayability', description: 'Enough depth or variety to replay differently?', dbColumn: 'replayability' },
  { key: 'characterDetailsComplexity', label: 'Character Details & Complexity', description: 'How strong are the character cards and story structure?', dbColumn: 'character_details_complexity' },
];
