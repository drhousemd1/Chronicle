// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  mergeRndWorkspaces,
  saveRndMockupToRepository,
} from './rnd-repository-client';
import { createBlankRndMockup } from './rnd-storage';
import type { RndReferenceAsset } from './rnd-types';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('R&D repository browser client', () => {
  it('restores repository records when the browser-local workspace is empty', () => {
    const repositoryRecord = createBlankRndMockup('2026-08-10T08:00:00.000Z');
    repositoryRecord.displayTitle = 'Recovered from repository';

    const merged = mergeRndWorkspaces(
      { mockups: [], assets: [] },
      { mockups: [repositoryRecord], assets: [] },
    );

    expect(merged.mockups).toEqual([repositoryRecord]);
  });

  it('preserves a newer local recovery draft over an older repository copy', () => {
    const repositoryRecord = createBlankRndMockup('2026-08-10T08:00:00.000Z');
    repositoryRecord.contentUpdatedAt = '2026-08-10T08:30:00.000Z';
    repositoryRecord.displayTitle = 'Repository copy';
    const localRecord = {
      ...repositoryRecord,
      displayTitle: 'Newer local draft',
      contentUpdatedAt: '2026-08-10T08:45:00.000Z',
    };

    const merged = mergeRndWorkspaces(
      { mockups: [localRecord], assets: [] },
      { mockups: [repositoryRecord], assets: [] },
    );

    expect(merged.mockups[0].displayTitle).toBe('Newer local draft');
  });

  it('keeps the restored Graphify workspace active in local and repository inputs', () => {
    const localGraphify = createBlankRndMockup('2026-08-29T19:58:36.000Z');
    localGraphify.id = '6f290eb9-a458-4dbf-bd2d-b12da34b2ac7';
    localGraphify.displayTitle = 'Local Graphify copy';
    const repositoryGraphify = {
      ...localGraphify,
      displayTitle: 'Chronicle Repository & Database Map',
      contentUpdatedAt: '2026-08-29T20:00:00.000Z',
    };

    const merged = mergeRndWorkspaces(
      { mockups: [localGraphify], assets: [] },
      { mockups: [repositoryGraphify], assets: [] },
    );

    expect(merged.mockups).toEqual([repositoryGraphify]);
  });

  it('allows the restored Graphify workspace to be saved under its stable ID', async () => {
    const graphify = createBlankRndMockup('2026-08-29T19:58:36.000Z');
    graphify.id = '6f290eb9-a458-4dbf-bd2d-b12da34b2ac7';
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        savedAt: graphify.contentUpdatedAt,
        repositoryPath: `docs/research-development/mockups/${graphify.id}/mockup.json`,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(saveRndMockupToRepository(graphify, [])).resolves.toMatchObject({
      repositoryPath: `docs/research-development/mockups/${graphify.id}/mockup.json`,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string).record.id).toBe(graphify.id);
  });

  it('serializes the complete record and original image bytes for one-click repository save', async () => {
    const record = createBlankRndMockup('2026-08-10T08:00:00.000Z');
    const asset: RndReferenceAsset = {
      id: '22222222-2222-4222-8222-222222222222',
      mockupId: record.id,
      fileName: 'reference.png',
      mimeType: 'image/png',
      size: 5,
      createdAt: '2026-08-10T08:15:00.000Z',
      blob: new Blob(['image'], { type: 'image/png' }),
    };
    record.assetIds = [asset.id];
    record.documentBlocks = [
      { id: '33333333-3333-4333-8333-333333333333', type: 'image', assetId: asset.id },
      { id: '44444444-4444-4444-8444-444444444444', type: 'text', text: '' },
    ];
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          savedAt: '2026-08-10T09:00:00.000Z',
          repositoryPath: `docs/research-development/mockups/${record.id}/mockup.json`,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    await saveRndMockupToRepository(record, [asset]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const request = fetchMock.mock.calls[0][1] as RequestInit;
    const body = JSON.parse(request.body as string) as {
      record: { id: string };
      assets: Array<{ dataBase64: string; fileName: string }>;
    };
    expect(body.record.id).toBe(record.id);
    expect(body.assets).toEqual([
      expect.objectContaining({ fileName: 'reference.png', dataBase64: 'aW1hZ2U=' }),
    ]);
  });
});
