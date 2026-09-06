import { parseRndMockupRecord } from './rnd-storage';
import { isRetiredRndMockupId } from './rnd-retired';
import type {
  RndMockupRecord,
  RndReferenceAsset,
  RndWorkspaceData,
} from './rnd-types';

const WORKSPACE_PATH = '/__rnd-repository/workspace';
const SAVE_PATH = '/__rnd-repository/save';

interface RepositoryAssetDescriptor {
  id: string;
  mockupId: string;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  url: string;
}

interface RepositoryWorkspaceResponse {
  mockups: unknown[];
  assets: unknown[];
}

export interface RepositorySaveResult {
  savedAt: string;
  repositoryPath: string;
}

function isRepositoryAssetDescriptor(value: unknown): value is RepositoryAssetDescriptor {
  if (!value || typeof value !== 'object') return false;
  const asset = value as Partial<RepositoryAssetDescriptor>;
  return (
    typeof asset.id === 'string' &&
    typeof asset.mockupId === 'string' &&
    typeof asset.fileName === 'string' &&
    typeof asset.mimeType === 'string' &&
    typeof asset.size === 'number' &&
    typeof asset.createdAt === 'string' &&
    typeof asset.url === 'string' &&
    asset.url.startsWith('/__rnd-repository/asset/')
  );
}

function isRepositoryWorkspaceResponse(value: unknown): value is RepositoryWorkspaceResponse {
  if (!value || typeof value !== 'object') return false;
  const response = value as Partial<RepositoryWorkspaceResponse>;
  return Array.isArray(response.mockups) && Array.isArray(response.assets);
}

async function responseMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as { message?: unknown };
    return typeof body.message === 'string' && body.message.length > 0 ? body.message : fallback;
  } catch {
    return fallback;
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 32_768;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

export async function loadRndRepositoryWorkspace(): Promise<RndWorkspaceData> {
  const response = await fetch(WORKSPACE_PATH, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  const contentType = response.headers.get('content-type') ?? '';
  if (response.status === 404 || !contentType.includes('application/json')) {
    return { mockups: [], assets: [] };
  }
  if (!response.ok) {
    throw new Error(await responseMessage(response, 'Chronicle could not load repository-backed R&D mock-ups.'));
  }
  const body = (await response.json()) as unknown;
  if (!isRepositoryWorkspaceResponse(body)) {
    throw new Error('The R&D repository workspace response is invalid.');
  }

  const mockups = body.mockups
    .map(parseRndMockupRecord)
    .filter(
      (mockup): mockup is RndMockupRecord =>
        mockup !== null && !isRetiredRndMockupId(mockup.id),
    );
  const descriptors = body.assets
    .filter(isRepositoryAssetDescriptor)
    .filter((asset) => !isRetiredRndMockupId(asset.mockupId));
  if (descriptors.length !== body.assets.length) {
    throw new Error('The R&D repository contains invalid image metadata.');
  }
  const assets = await Promise.all(
    descriptors.map(async (descriptor): Promise<RndReferenceAsset> => {
      const assetResponse = await fetch(descriptor.url, { cache: 'no-store' });
      if (!assetResponse.ok) {
        throw new Error(`Chronicle could not load repository image ${descriptor.fileName}.`);
      }
      const blob = await assetResponse.blob();
      if (blob.size !== descriptor.size || blob.type !== descriptor.mimeType) {
        throw new Error(`Repository image ${descriptor.fileName} does not match its manifest.`);
      }
      return {
        id: descriptor.id,
        mockupId: descriptor.mockupId,
        fileName: descriptor.fileName,
        mimeType: descriptor.mimeType,
        size: descriptor.size,
        createdAt: descriptor.createdAt,
        blob,
      };
    }),
  );
  return { mockups, assets };
}

export function mergeRndWorkspaces(
  localWorkspace: RndWorkspaceData,
  repositoryWorkspace: RndWorkspaceData,
): RndWorkspaceData {
  const localMockups = new Map(
    localWorkspace.mockups
      .filter((mockup) => !isRetiredRndMockupId(mockup.id))
      .map((mockup) => [mockup.id, mockup]),
  );
  const repositoryMockups = new Map(
    repositoryWorkspace.mockups
      .filter((mockup) => !isRetiredRndMockupId(mockup.id))
      .map((mockup) => [mockup.id, mockup]),
  );
  const localAssets = new Map(localWorkspace.assets.map((asset) => [asset.id, asset]));
  const repositoryAssets = new Map(
    repositoryWorkspace.assets.map((asset) => [asset.id, asset]),
  );
  const mockupIds = new Set([...localMockups.keys(), ...repositoryMockups.keys()]);
  const chosenSource = new Map<string, 'local' | 'repository'>();
  const mockups: RndMockupRecord[] = [];

  for (const id of mockupIds) {
    const local = localMockups.get(id);
    const repository = repositoryMockups.get(id);
    const useRepository =
      !!repository &&
      (!local || repository.contentUpdatedAt.localeCompare(local.contentUpdatedAt) >= 0);
    const chosen = useRepository ? repository : local;
    if (!chosen) continue;
    chosenSource.set(id, useRepository ? 'repository' : 'local');
    mockups.push(chosen);
  }
  mockups.sort((left, right) => left.createdAt.localeCompare(right.createdAt));

  const assets: RndReferenceAsset[] = [];
  const includedAssetIds = new Set<string>();
  for (const mockup of mockups) {
    const primary = chosenSource.get(mockup.id) === 'repository' ? repositoryAssets : localAssets;
    const fallback = primary === repositoryAssets ? localAssets : repositoryAssets;
    for (const assetId of mockup.assetIds) {
      if (includedAssetIds.has(assetId)) continue;
      const asset = primary.get(assetId) ?? fallback.get(assetId);
      if (!asset) continue;
      includedAssetIds.add(assetId);
      assets.push(asset);
    }
  }
  return { mockups, assets };
}

export async function saveRndMockupToRepository(
  record: RndMockupRecord,
  assets: readonly RndReferenceAsset[],
): Promise<RepositorySaveResult> {
  if (isRetiredRndMockupId(record.id)) {
    throw new Error('This retired R&D mock-up is preserved as history and cannot be saved as an active workspace.');
  }
  const serializedAssets = await Promise.all(
    assets.map(async (asset) => ({
      id: asset.id,
      mockupId: asset.mockupId,
      fileName: asset.fileName,
      mimeType: asset.mimeType,
      size: asset.size,
      createdAt: asset.createdAt,
      dataBase64: bytesToBase64(new Uint8Array(await asset.blob.arrayBuffer())),
    })),
  );
  const response = await fetch(SAVE_PATH, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ record, assets: serializedAssets }),
  });
  const contentType = response.headers.get('content-type') ?? '';
  if (!response.ok || !contentType.includes('application/json')) {
    throw new Error(
      await responseMessage(
        response,
        'Repository saving is available only from Chronicle’s local development server.',
      ),
    );
  }
  const body = (await response.json()) as Partial<RepositorySaveResult>;
  if (typeof body.savedAt !== 'string' || typeof body.repositoryPath !== 'string') {
    throw new Error('Chronicle received an invalid repository-save response.');
  }
  return { savedAt: body.savedAt, repositoryPath: body.repositoryPath };
}
