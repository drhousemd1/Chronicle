import { beforeEach, describe, expect, it, vi } from 'vitest';

const { rpcMock } = vi.hoisted(() => ({
  rpcMock: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: rpcMock,
  },
}));

import { fetchGalleryScenarios } from './gallery-data';

describe('fetchGalleryScenarios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects an RPC failure instead of treating it as an empty result', async () => {
    rpcMock.mockResolvedValueOnce({
      data: null,
      error: { message: 'gallery unavailable' },
    });

    const request = fetchGalleryScenarios({
      sortBy: 'all',
      limit: 20,
      offset: 0,
    });

    expect(rpcMock).toHaveBeenCalledWith(
      'fetch_gallery_scenarios',
      expect.objectContaining({
        p_sort_by: 'recent',
        p_limit: 20,
        p_offset: 0,
      }),
    );
    await expect(request).rejects.toMatchObject({ message: 'gallery unavailable' });
  });

  it('resolves a successful empty response as an empty result', async () => {
    rpcMock.mockResolvedValueOnce({ data: [], error: null });

    await expect(
      fetchGalleryScenarios({
        sortBy: 'all',
        limit: 20,
        offset: 0,
      }),
    ).resolves.toEqual([]);
  });
});
