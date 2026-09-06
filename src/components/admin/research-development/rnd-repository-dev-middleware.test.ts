import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { rndRepositoryDevPlugin } from './rnd-repository-dev-middleware';
import type { RndMockupRecord } from './rnd-types';

type Middleware = (
  request: IncomingMessage,
  response: ServerResponse,
  next: () => void,
) => void | Promise<void>;

const temporaryRoots: string[] = [];

async function temporaryRepoRoot() {
  const root = await mkdtemp(join(tmpdir(), 'chronicle-rnd-repository-test-'));
  temporaryRoots.push(root);
  return root;
}

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

function captureMiddleware(repoRoot: string) {
  const captured: { middleware?: Middleware } = {};
  const plugin = rndRepositoryDevPlugin();
  const configureServer = plugin.configureServer;
  if (typeof configureServer !== 'function') throw new Error('Missing R&D repository middleware hook.');
  configureServer.call({} as never, {
    config: { root: repoRoot },
    middlewares: {
      use(value: Middleware) {
        captured.middleware = value;
      },
    },
  } as never);
  if (!captured.middleware) throw new Error('R&D repository middleware was not registered.');
  return captured.middleware;
}

function responseRecorder() {
  const headers = new Map<string, string>();
  const chunks: Buffer[] = [];
  const response = {
    statusCode: 0,
    setHeader(name: string, value: string) {
      headers.set(name.toLowerCase(), value);
    },
    end(value: string | Uint8Array = '') {
      chunks.push(typeof value === 'string' ? Buffer.from(value) : Buffer.from(value));
    },
  } as unknown as ServerResponse;
  return {
    response,
    headers,
    body: () => Buffer.concat(chunks),
    json: () => JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown,
  };
}

function request(
  url: string,
  method = 'GET',
  body = '',
  remoteAddress = '127.0.0.1',
): IncomingMessage {
  const stream = Readable.from(body.length > 0 ? [body] : []);
  Object.assign(stream, { url, method, socket: { remoteAddress } });
  return stream as IncomingMessage;
}

function record(purpose = 'Repository test'): RndMockupRecord {
  return {
    schemaVersion: 1,
    id: '11111111-1111-4111-8111-111111111111',
    displayTitle: 'Durable Mock-up',
    purpose,
    notes: 'Text above the image.\n',
    createdAt: '2026-08-10T08:00:00.000Z',
    contentUpdatedAt: '2026-08-10T08:30:00.000Z',
    previewBackground: 'paper',
    assetIds: ['22222222-2222-4222-8222-222222222222'],
    documentBlocks: [
      { id: '33333333-3333-4333-8333-333333333333', type: 'text', text: 'Text above the image.' },
      {
        id: '44444444-4444-4444-8444-444444444444',
        type: 'image',
        assetId: '22222222-2222-4222-8222-222222222222',
      },
      { id: '55555555-5555-4555-8555-555555555555', type: 'text', text: '' },
    ],
  };
}

function savePayload(purpose?: string) {
  const bytes = Buffer.from('safe-png-fixture');
  return JSON.stringify({
    record: record(purpose),
    assets: [
      {
        id: '22222222-2222-4222-8222-222222222222',
        mockupId: '11111111-1111-4111-8111-111111111111',
        fileName: 'reference.png',
        mimeType: 'image/png',
        size: bytes.length,
        createdAt: '2026-08-10T08:15:00.000Z',
        dataBase64: bytes.toString('base64'),
      },
    ],
  });
}

describe('R&D repository development middleware', () => {
  it('atomically saves a complete mock-up folder and exposes it for reload recovery', async () => {
    const repoRoot = await temporaryRepoRoot();
    const middleware = captureMiddleware(repoRoot);
    const saved = responseRecorder();

    await middleware(
      request('/__rnd-repository/save', 'POST', savePayload()),
      saved.response,
      vi.fn(),
    );

    expect(saved.response.statusCode).toBe(200);
    expect(saved.json()).toMatchObject({
      repositoryPath:
        'docs/research-development/mockups/11111111-1111-4111-8111-111111111111/mockup.json',
    });
    const manifestPath = join(
      repoRoot,
      'docs',
      'research-development',
      'mockups',
      '11111111-1111-4111-8111-111111111111',
      'mockup.json',
    );
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as {
      record: RndMockupRecord;
      assets: Array<{ relativePath: string }>;
    };
    expect(manifest.record.displayTitle).toBe('Durable Mock-up');
    expect(manifest.assets).toEqual([
      expect.objectContaining({
        relativePath: 'assets/22222222-2222-4222-8222-222222222222.png',
      }),
    ]);
    expect(
      await readFile(
        join(
          repoRoot,
          'docs',
          'research-development',
          'mockups',
          '11111111-1111-4111-8111-111111111111',
          'assets',
          '22222222-2222-4222-8222-222222222222.png',
        ),
        'utf8',
      ),
    ).toBe('safe-png-fixture');

    const workspace = responseRecorder();
    await middleware(request('/__rnd-repository/workspace'), workspace.response, vi.fn());
    expect(workspace.response.statusCode).toBe(200);
    expect(workspace.json()).toMatchObject({
      mockups: [expect.objectContaining({ id: record().id })],
      assets: [
        expect.objectContaining({
          id: '22222222-2222-4222-8222-222222222222',
          url: expect.stringMatching(/^\/__rnd-repository\/asset\//),
        }),
      ],
    });
  });

  it('replaces only the same stable mock-up folder when Save is repeated', async () => {
    const repoRoot = await temporaryRepoRoot();
    const middleware = captureMiddleware(repoRoot);

    await middleware(
      request('/__rnd-repository/save', 'POST', savePayload('First purpose')),
      responseRecorder().response,
      vi.fn(),
    );
    await middleware(
      request('/__rnd-repository/save', 'POST', savePayload('Updated purpose')),
      responseRecorder().response,
      vi.fn(),
    );

    const manifest = JSON.parse(
      await readFile(
        join(
          repoRoot,
          'docs',
          'research-development',
          'mockups',
          record().id,
          'mockup.json',
        ),
        'utf8',
      ),
    ) as { record: RndMockupRecord };
    expect(manifest.record.purpose).toBe('Updated purpose');
  });

  it('rejects non-loopback writes and traversal-shaped record IDs', async () => {
    const repoRoot = await temporaryRepoRoot();
    const middleware = captureMiddleware(repoRoot);
    const denied = responseRecorder();
    await middleware(
      request('/__rnd-repository/save', 'POST', savePayload(), '192.168.1.25'),
      denied.response,
      vi.fn(),
    );
    expect(denied.response.statusCode).toBe(403);

    const unsafePayload = JSON.parse(savePayload()) as { record: RndMockupRecord };
    unsafePayload.record.id = '../../outside';
    const invalid = responseRecorder();
    await middleware(
      request('/__rnd-repository/save', 'POST', JSON.stringify(unsafePayload)),
      invalid.response,
      vi.fn(),
    );
    expect(invalid.response.statusCode).toBe(400);
    expect(invalid.json()).toMatchObject({ error: 'invalid_request' });
  });

  it('loads, saves, and locally serves the restored Graphify prototype under its stable ID', async () => {
    const repoRoot = await temporaryRepoRoot();
    const middleware = captureMiddleware(repoRoot);
    const graphifyId = '6f290eb9-a458-4dbf-bd2d-b12da34b2ac7';
    const graphifyPayload = JSON.parse(savePayload()) as {
      record: RndMockupRecord;
      assets: Array<{ mockupId: string }>;
    };
    graphifyPayload.record.id = graphifyId;
    graphifyPayload.record.displayTitle = 'Chronicle Repository & Database Map';
    graphifyPayload.assets[0].mockupId = graphifyId;
    const saved = responseRecorder();

    await middleware(
      request('/__rnd-repository/save', 'POST', JSON.stringify(graphifyPayload)),
      saved.response,
      vi.fn(),
    );

    expect(saved.response.statusCode).toBe(200);
    expect(saved.json()).toMatchObject({
      repositoryPath: `docs/research-development/mockups/${graphifyId}/mockup.json`,
    });

    const generatedDirectory = join(
      repoRoot,
      'docs',
      'research-development',
      'generated',
      'graphify-chronicle-map',
    );
    await mkdir(generatedDirectory, { recursive: true });
    await writeFile(
      join(generatedDirectory, 'chronicle-areas.html'),
      '<!doctype html><title>Chronicle Areas</title>',
      'utf8',
    );

    const workspace = responseRecorder();
    await middleware(request('/__rnd-repository/workspace'), workspace.response, vi.fn());
    expect(workspace.response.statusCode).toBe(200);
    expect(workspace.json()).toMatchObject({
      mockups: [expect.objectContaining({ id: graphifyId })],
    });

    const artifact = responseRecorder();
    await middleware(
      request('/__rnd-repository/generated/graphify-chronicle-map/chronicle-areas.html'),
      artifact.response,
      vi.fn(),
    );
    expect(artifact.response.statusCode).toBe(200);
    expect(artifact.headers.get('content-type')).toBe('text/html; charset=utf-8');
    expect(artifact.headers.get('cache-control')).toBe('no-store');
    expect(artifact.body().toString('utf8')).toContain('Chronicle Areas');
  });

  it('passes unrelated routes through without exposing a write surface', async () => {
    const middleware = captureMiddleware(await temporaryRepoRoot());
    const next = vi.fn();
    const response = responseRecorder();

    await middleware(request('/unrelated'), response.response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(response.response.statusCode).toBe(0);
    expect(response.body()).toHaveLength(0);
  });
});
