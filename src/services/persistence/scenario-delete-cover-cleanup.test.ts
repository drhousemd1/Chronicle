import { beforeEach, describe, expect, it, vi } from 'vitest';

const supabaseMocks = vi.hoisted(() => {
  const eqMock = vi.fn();
  const deleteMock = vi.fn(() => ({ eq: eqMock }));
  const fromMock = vi.fn((_: string) => ({ delete: deleteMock }));
  const invokeMock = vi.fn((_n: string, _o?: unknown) => Promise.resolve({ data: null, error: null }));
  const callOrder: string[] = [];
  return { eqMock, deleteMock, fromMock, invokeMock, callOrder };
});

vi.mock('./shared', () => ({
  supabase: {
    from: (name: string) => {
      supabaseMocks.callOrder.push('from:' + name);
      return supabaseMocks.fromMock(name);
    },
    functions: {
      invoke: (name: string, opts?: unknown) => {
        supabaseMocks.callOrder.push('invoke:' + name);
        return supabaseMocks.invokeMock(name, opts);
      },
    },
  },
  ensureStorageUrl: vi.fn(),
  ensurePrivateStorageSentinel: vi.fn(),
  toTimestamp: vi.fn((v: unknown) => v as number | null),
}));

vi.mock('./signed-media', () => ({
  buildStorageSentinel: vi.fn(),
  getSignedMediaUrl: vi.fn(),
  getSignedMediaUrls: vi.fn(),
  isStorageSentinel: vi.fn(),
  parseStorageSentinel: vi.fn(),
  resolveStorageMaybeSentinel: vi.fn(),
}));

vi.mock('./characters', () => ({
  characterToDb: vi.fn(),
  dbToCharacter: vi.fn(),
  hydrateCharacterAvatars: vi.fn(),
}));

vi.mock('./conversations', () => ({
  dbToConversation: vi.fn(),
}));

describe('deleteScenario public cover cleanup wiring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    supabaseMocks.callOrder.length = 0;
    supabaseMocks.eqMock.mockResolvedValue({ error: null });
    supabaseMocks.invokeMock.mockResolvedValue({ data: null, error: null });
  });

  it('invokes publish-cover action=unpublish BEFORE the stories DELETE', async () => {
    const { deleteScenario } = await import('./scenarios');
    await deleteScenario('scenario-xyz');

    expect(supabaseMocks.invokeMock).toHaveBeenCalledWith('publish-cover', {
      body: { scenarioId: 'scenario-xyz', action: 'unpublish' },
    });
    expect(supabaseMocks.fromMock).toHaveBeenCalledWith('stories');
    expect(supabaseMocks.deleteMock).toHaveBeenCalled();

    // Order: invoke must run before from('stories').delete()
    const invokeIdx = supabaseMocks.callOrder.indexOf('invoke:publish-cover');
    const fromIdx = supabaseMocks.callOrder.indexOf('from:stories');
    expect(invokeIdx).toBeGreaterThanOrEqual(0);
    expect(fromIdx).toBeGreaterThan(invokeIdx);
  });

  it('does not block deletion when publish-cover throws', async () => {
    supabaseMocks.invokeMock.mockRejectedValueOnce(new Error('boom'));
    const { deleteScenario } = await import('./scenarios');
    await expect(deleteScenario('scenario-xyz')).resolves.toBeUndefined();
    expect(supabaseMocks.fromMock).toHaveBeenCalledWith('stories');
  });
});