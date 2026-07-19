import { beforeEach, describe, expect, it, vi } from 'vitest';

const supabaseMocks = vi.hoisted(() => {
  const select = vi.fn();
  const eq = vi.fn(() => ({ select }));
  const deleteRow = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ delete: deleteRow }));
  return { select, eq, deleteRow, from };
});

vi.mock('./shared', () => ({
  supabase: { from: supabaseMocks.from },
  toTimestamp: vi.fn((value: unknown) => value),
  defaultCurrentlyWearing: {},
  defaultPhysicalAppearance: {},
  defaultPreferredClothing: {},
  asCharacterBackground: vi.fn(),
  asCharacterPersonality: vi.fn(),
  asExtrasSection: vi.fn(),
  appCurrentlyWearingToDb: vi.fn(),
  appPhysicalAppearanceToDb: vi.fn(),
  appPreferredClothingToDb: vi.fn(),
  dbCurrentlyWearingToApp: vi.fn(),
  dbPhysicalAppearanceToApp: vi.fn(),
  dbPreferredClothingToApp: vi.fn(),
}));

vi.mock('./signed-media', () => ({
  buildStorageSentinel: vi.fn(),
  getSignedMediaUrl: vi.fn(),
  getSignedMediaUrls: vi.fn(),
  isStorageSentinel: vi.fn(),
  parseStorageSentinel: vi.fn(),
}));

describe('stale character-state snapshot cleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    supabaseMocks.eq.mockImplementation(() => ({ select: supabaseMocks.select }));
    supabaseMocks.select.mockResolvedValue({ data: [], error: null });
  });

  it('deletes an exact main-character snapshot row', async () => {
    supabaseMocks.select.mockResolvedValueOnce({ data: [{ id: 'main-snapshot-1' }], error: null });
    const { deleteCharacterStateMessageSnapshot } = await import('./conversations');
    await deleteCharacterStateMessageSnapshot('main-snapshot-1');

    expect(supabaseMocks.from).toHaveBeenCalledWith('character_state_message_snapshots');
    expect(supabaseMocks.deleteRow).toHaveBeenCalledTimes(1);
    expect(supabaseMocks.eq).toHaveBeenCalledWith('id', 'main-snapshot-1');
  });

  it('deletes an exact side-character snapshot row', async () => {
    supabaseMocks.select.mockResolvedValueOnce({ data: [{ id: 'side-snapshot-1' }], error: null });
    const { deleteSideCharacterMessageSnapshot } = await import('./side-characters');
    await deleteSideCharacterMessageSnapshot('side-snapshot-1');

    expect(supabaseMocks.from).toHaveBeenCalledWith('side_character_message_snapshots');
    expect(supabaseMocks.deleteRow).toHaveBeenCalledTimes(1);
    expect(supabaseMocks.eq).toHaveBeenCalledWith('id', 'side-snapshot-1');
  });

  it('surfaces cleanup failure instead of treating the stale row as removed', async () => {
    supabaseMocks.select.mockResolvedValueOnce({ data: null, error: new Error('delete denied') });
    const { deleteCharacterStateMessageSnapshot } = await import('./conversations');

    await expect(deleteCharacterStateMessageSnapshot('main-snapshot-2')).rejects.toThrow('delete denied');
  });

  it('treats a successful request that removed no row as a cleanup failure', async () => {
    const { deleteCharacterStateMessageSnapshot } = await import('./conversations');

    await expect(deleteCharacterStateMessageSnapshot('missing-snapshot')).rejects.toThrow(
      'Character-state snapshot cleanup did not remove missing-snapshot',
    );
  });
});
