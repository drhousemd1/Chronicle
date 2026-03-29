import { describe, expect, it } from 'vitest';

import {
  migrateWorldCoreToCanonical,
  needsWorldCoreBackfill,
} from '@/lib/canonical-field-registry';

describe('canonical world-core migration', () => {
  it('normalizes canonical world-core fields and keeps authored sections intact', () => {
    const migrated = migrateWorldCoreToCanonical({
      scenarioName: 'Chronicle',
      briefDescription: 'Brief',
      storyPremise: 'Premise',
      structuredLocations: [{ id: 'loc-1', label: 'Velaris', description: 'City of Starlight' }],
      customWorldSections: [
        {
          id: 'sec-1',
          title: 'Political Stakes',
          items: [{ id: 'item-1', label: 'Treaty', value: 'Fragile' }],
        },
      ],
      dialogFormatting: '',
    });

    expect(migrated.scenarioName).toBe('Chronicle');
    expect(migrated.briefDescription).toBe('Brief');
    expect(migrated.storyPremise).toBe('Premise');

    expect(migrated.structuredLocations?.length).toBe(1);
    expect(migrated.structuredLocations?.[0].label).toBe('Velaris');
    expect(migrated.customWorldSections?.[0].title).toBe('Political Stakes');
  });

  it('flags backfill when raw core differs from canonical normalization and clears after save-shape', () => {
    const nonCanonicalRaw = {
      scenarioName: ' Story ',
      storyPremise: ' Premise ',
      dialogFormatting: '',
    };

    const before = needsWorldCoreBackfill(nonCanonicalRaw as any);
    expect(before.shouldBackfill).toBe(true);

    const after = needsWorldCoreBackfill(before.canonical as any);
    expect(after.shouldBackfill).toBe(false);
  });

  it('is idempotent when migration runs more than once', () => {
    const first = migrateWorldCoreToCanonical({
      scenarioName: 'Test',
      storyPremise: 'Premise',
      structuredLocations: [{ id: 'loc-1', label: 'Court', description: 'Description' }],
      customWorldSections: [
        {
          id: 'sec_1',
          title: 'Lore Notes',
          items: [{ id: 'item_1', label: 'Law', value: 'Ancient pact' }],
        },
      ],
    } as any);

    const second = migrateWorldCoreToCanonical(first as any);
    expect(second).toEqual(first);
  });
});
