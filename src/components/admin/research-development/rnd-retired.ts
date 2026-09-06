export const RETIRED_RND_MOCKUP_IDS: readonly string[] = Object.freeze([]);

const retiredIds = new Set(RETIRED_RND_MOCKUP_IDS);

export function isRetiredRndMockupId(value: string) {
  return retiredIds.has(value);
}
