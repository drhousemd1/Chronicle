export type PhysicalStateReview = {
  character: string;
  reviewed: boolean;
  locationReviewed: boolean;
  scenePositionReviewed: boolean;
  changed: boolean;
  reason: string;
  evidence?: string;
  confidence?: number;
  source?: 'primary' | 'focused_retry';
};

export type PhysicalStateCompletenessReview = {
  character: string;
  reviewed: boolean;
  reason: string;
  source: 'primary' | 'focused_retry' | 'missing';
};

function normalizeName(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeKey(value: unknown): string {
  return normalizeName(value).toLowerCase();
}

function clampConfidence(value: unknown): number {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(1, numeric));
}

export function normalizePhysicalStateReviews(
  rawReviews: unknown,
  eligibleCharacters: Array<{ name: string } | string>,
  source: 'primary' | 'focused_retry' = 'primary',
): PhysicalStateReview[] {
  if (!Array.isArray(rawReviews)) return [];

  const eligibleByKey = new Map(
    eligibleCharacters
      .map((entry) => typeof entry === 'string' ? entry : entry.name)
      .map((name) => [normalizeKey(name), normalizeName(name)] as const)
      .filter(([key, name]) => key && name),
  );

  const seen = new Set<string>();
  const reviews: PhysicalStateReview[] = [];

  for (const raw of rawReviews) {
    const record = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
    const key = normalizeKey(record.character);
    const resolvedName = eligibleByKey.get(key);
    if (!resolvedName || seen.has(key)) continue;
    seen.add(key);

    reviews.push({
      character: resolvedName,
      reviewed: record.reviewed === true,
      locationReviewed: record.locationReviewed === true,
      scenePositionReviewed: record.scenePositionReviewed === true,
      changed: record.changed === true,
      reason: normalizeName(record.reason) || 'reviewed',
      evidence: normalizeName(record.evidence),
      confidence: clampConfidence(record.confidence),
      source,
    });
  }

  return reviews;
}

export function getMissingPhysicalStateReviewNames(
  eligibleCharacters: Array<{ name: string } | string>,
  reviews: PhysicalStateReview[],
): string[] {
  const reviewed = new Set(
    reviews
      .filter((review) => review.reviewed && review.locationReviewed && review.scenePositionReviewed)
      .map((review) => normalizeKey(review.character))
      .filter(Boolean),
  );

  return eligibleCharacters
    .map((entry) => typeof entry === 'string' ? entry : entry.name)
    .map(normalizeName)
    .filter(Boolean)
    .filter((name) => !reviewed.has(normalizeKey(name)));
}

export function buildPhysicalStateCompletenessReviews(
  eligibleCharacters: Array<{ name: string } | string>,
  reviews: PhysicalStateReview[],
): PhysicalStateCompletenessReview[] {
  const reviewByKey = new Map(
    reviews.map((review) => [normalizeKey(review.character), review]),
  );

  return eligibleCharacters
    .map((entry) => typeof entry === 'string' ? entry : entry.name)
    .map(normalizeName)
    .filter(Boolean)
    .map((name) => {
      const review = reviewByKey.get(normalizeKey(name));
      if (!review || !review.reviewed || !review.locationReviewed || !review.scenePositionReviewed) {
        return {
          character: name,
          reviewed: false,
          reason: 'missing_physical_state_review',
          source: 'missing' as const,
        };
      }
      return {
        character: name,
        reviewed: true,
        reason: review.reason || 'reviewed',
        source: review.source || 'primary',
      };
    });
}
