import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Scene } from '@/types';

const mocks = vi.hoisted(() => ({
  copyPrivateStorageImageTo: vi.fn(),
  getSignedMediaUrl: vi.fn(),
}));

vi.mock('./library-copy', () => ({
  copyPrivateStorageImageTo: mocks.copyPrivateStorageImageTo,
}));

vi.mock('./signed-media', () => ({
  STORAGE_SENTINEL_PREFIX: 'storage://',
  isStorageSentinel: (value: string | null | undefined) =>
    typeof value === 'string' && value.startsWith('storage://'),
  getSignedMediaUrl: mocks.getSignedMediaUrl,
}));

import { ensureSceneImagesOwnedByUser } from './scene-media-portability';

const scene = (overrides: Partial<Scene>): Scene => ({
  id: 'scene-1',
  title: 'Scene One',
  url: '',
  tags: [],
  createdAt: 1,
  ...overrides,
});

describe('ensureSceneImagesOwnedByUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hydrates same-owner storage sentinels without copying', async () => {
    mocks.getSignedMediaUrl.mockResolvedValue('https://signed.example/own-scene');

    const result = await ensureSceneImagesOwnedByUser(
      [scene({ url: 'storage://scenes/user-a/scene.webp' })],
      'user-a',
    );

    expect(result.scenes[0].imagePath).toBe('user-a/scene.webp');
    expect(result.scenes[0].url).toBe('https://signed.example/own-scene');
    expect(mocks.copyPrivateStorageImageTo).not.toHaveBeenCalled();
  });

  it('copies cross-owner scene images into the current user namespace', async () => {
    mocks.copyPrivateStorageImageTo.mockResolvedValue({
      destBucket: 'scenes',
      destPath: 'user-b/scene-copy-1.webp',
      publicOrSentinelUrl: 'storage://scenes/user-b/scene-copy-1.webp',
      previewUrl: 'https://signed.example/copied-scene',
      contentType: 'image/webp',
    });

    const result = await ensureSceneImagesOwnedByUser(
      [scene({ imagePath: 'user-a/original.webp', url: 'https://signed.example/original' })],
      'user-b',
    );

    expect(mocks.copyPrivateStorageImageTo).toHaveBeenCalledWith(
      { bucket: 'scenes', path: 'user-a/original.webp', filename: 'Scene One' },
      { bucket: 'scenes', userId: 'user-b', filenamePrefix: 'scene-copy' },
    );
    expect(result.scenes[0].imagePath).toBe('user-b/scene-copy-1.webp');
    expect(result.scenes[0].url).toBe('https://signed.example/copied-scene');
    expect(result.copied).toBe(1);
  });

  it('clears uncopyable cross-owner scene images when requested', async () => {
    mocks.copyPrivateStorageImageTo.mockRejectedValue(new Error('forbidden'));

    const result = await ensureSceneImagesOwnedByUser(
      [scene({ imagePath: 'user-a/private.webp', url: 'https://signed.example/private' })],
      'user-b',
      { onFailure: 'clear' },
    );

    expect(result.scenes[0].imagePath).toBeNull();
    expect(result.scenes[0].url).toBe('');
    expect(result.cleared).toBe(1);
    expect(result.warnings[0]).toContain('could not be copied');
  });
});
