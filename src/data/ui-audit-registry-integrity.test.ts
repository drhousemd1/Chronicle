import { describe, expect, it } from 'vitest';

import { qualityHubInitialRegistry } from '@/data/ui-audit-findings';

const findDuplicateIds = (items: Array<{ id: string }>): string[] => {
  const counts = new Map<string, number>();
  items.forEach((item) => {
    counts.set(item.id, (counts.get(item.id) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([id]) => id)
    .sort();
};

describe('Quality Hub registry integrity', () => {
  it('keeps seeded registry IDs unique by collection', () => {
    const duplicateIdsByCollection = {
      findings: findDuplicateIds(qualityHubInitialRegistry.findings),
      runs: findDuplicateIds(qualityHubInitialRegistry.runs),
      scanModules: findDuplicateIds(qualityHubInitialRegistry.scanModules),
      reviewUnits: findDuplicateIds(qualityHubInitialRegistry.reviewUnits),
      changeLog: findDuplicateIds(qualityHubInitialRegistry.changeLog),
    };

    expect(duplicateIdsByCollection).toEqual({
      findings: [],
      runs: [],
      scanModules: [],
      reviewUnits: [],
      changeLog: [],
    });
  });
});
