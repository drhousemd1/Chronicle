import type { Scene } from '@/types';
import { copyPrivateStorageImageTo } from './library-copy';
import { getSignedMediaUrl, isStorageSentinel, STORAGE_SENTINEL_PREFIX } from './signed-media';

type SceneImageFailureMode = 'throw' | 'clear';

export type SceneMediaPortabilityResult = {
  scenes: Scene[];
  warnings: string[];
  copied: number;
  cleared: number;
};

function normalizeSceneImagePath(scene: Scene): string | null {
  if (scene.imagePath) return scene.imagePath;
  const prefix = `${STORAGE_SENTINEL_PREFIX}scenes/`;
  if (isStorageSentinel(scene.url) && scene.url.startsWith(prefix)) {
    return scene.url.slice(prefix.length);
  }
  return null;
}

function getStoragePathOwner(path: string): string | null {
  const owner = path.split('/').find(Boolean);
  return owner || null;
}

function sceneLabel(scene: Scene, index: number): string {
  return scene.title?.trim() || `Scene ${index + 1}`;
}

function clearSceneImage(scene: Scene): Scene {
  return {
    ...scene,
    url: '',
    imagePath: null,
  };
}

/**
 * Enforces the private-scenes storage invariant:
 * a scenario owned by user B must not persist scene image paths under user A's
 * storage prefix. Cross-owner scene images are copied into the current user's
 * `scenes/<userId>/...` namespace before save/import/remix continues.
 */
export async function ensureSceneImagesOwnedByUser(
  scenes: Scene[],
  userId: string,
  options?: { onFailure?: SceneImageFailureMode },
): Promise<SceneMediaPortabilityResult> {
  const onFailure = options?.onFailure ?? 'throw';
  const warnings: string[] = [];
  let copied = 0;
  let cleared = 0;

  const nextScenes = await Promise.all(
    (scenes || []).map(async (scene, index) => {
      const imagePath = normalizeSceneImagePath(scene);
      if (!imagePath) return scene;

      const owner = getStoragePathOwner(imagePath);
      if (owner === userId) {
        if (!scene.url || isStorageSentinel(scene.url)) {
          const signedUrl = await getSignedMediaUrl('scenes', imagePath);
          if (signedUrl) return { ...scene, imagePath, url: signedUrl };
        }
        return { ...scene, imagePath };
      }

      try {
        const copiedImage = await copyPrivateStorageImageTo(
          {
            bucket: 'scenes',
            path: imagePath,
            filename: scene.title || scene.id || 'scene-image',
          },
          {
            bucket: 'scenes',
            userId,
            filenamePrefix: 'scene-copy',
          },
        );
        copied += 1;
        return {
          ...scene,
          imagePath: copiedImage.destPath,
          url: copiedImage.previewUrl,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const warning = `${sceneLabel(scene, index)} image could not be copied into this story owner's private scene storage and was removed.`;
        if (onFailure === 'clear') {
          warnings.push(warning);
          cleared += 1;
          console.warn('[scene-media-portability] cleared unportable scene image', {
            imagePath,
            error: message,
          });
          return clearSceneImage(scene);
        }
        throw new Error(`${warning} ${message}`);
      }
    }),
  );

  return {
    scenes: nextScenes,
    warnings,
    copied,
    cleared,
  };
}
