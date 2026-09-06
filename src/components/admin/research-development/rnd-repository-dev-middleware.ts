import { randomUUID } from 'node:crypto';
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { extname, join, resolve, sep } from 'node:path';
import type { Plugin } from 'vite';

import type { RndDocumentBlock, RndMockupRecord } from './rnd-types';
import { isRetiredRndMockupId } from './rnd-retired';

const API_ROOT = '/__rnd-repository';
const WORKSPACE_PATH = `${API_ROOT}/workspace`;
const SAVE_PATH = `${API_ROOT}/save`;
const ASSET_PATH_PREFIX = `${API_ROOT}/asset/`;
const GENERATED_ARTIFACT_PATH_PREFIX = `${API_ROOT}/generated/`;
const REPOSITORY_FORMAT_VERSION = 1;
const MAX_BODY_BYTES = 70 * 1024 * 1024;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_TOTAL_IMAGE_BYTES = 50 * 1024 * 1024;
const MAX_IMAGES = 20;
const MAX_GENERATED_ARTIFACT_BYTES = 12 * 1024 * 1024;
const SAFE_ID = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$/;
const SAFE_GENERATED_FILE = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,191}\.(html|js|json|md)$/;

const MIME_EXTENSIONS = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);

const GENERATED_ARTIFACT_MIME_TYPES = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.md', 'text/markdown; charset=utf-8'],
]);

interface RepositoryAssetPayload {
  id: string;
  mockupId: string;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  dataBase64: string;
}

interface RepositoryAssetManifest {
  id: string;
  mockupId: string;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  relativePath: string;
}

interface RepositoryManifest {
  repositoryFormatVersion: typeof REPOSITORY_FORMAT_VERSION;
  savedAt: string;
  record: RndMockupRecord;
  assets: RepositoryAssetManifest[];
}

interface RepositorySaveRequest {
  record: RndMockupRecord;
  assets: RepositoryAssetPayload[];
}

class RequestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RequestValidationError';
  }
}

class PayloadTooLargeError extends Error {
  constructor() {
    super('Repository save payload exceeds the 70 MB request limit.');
    this.name = 'PayloadTooLargeError';
  }
}

function isLoopbackRequest(request: IncomingMessage) {
  const address = request.socket.remoteAddress ?? '';
  return address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1';
}

function sendJson(response: ServerResponse, statusCode: number, value: unknown) {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.end(`${JSON.stringify(value, null, 2)}\n`);
}

function isDocumentBlock(value: unknown): value is RndDocumentBlock {
  if (!value || typeof value !== 'object') return false;
  const block = value as Partial<RndDocumentBlock>;
  return (
    typeof block.id === 'string' &&
    ((block.type === 'text' && typeof block.text === 'string') ||
      (block.type === 'image' && typeof block.assetId === 'string'))
  );
}

function isMockupRecord(value: unknown): value is RndMockupRecord {
  if (!value || typeof value !== 'object') return false;
  const record = value as Partial<RndMockupRecord>;
  return (
    record.schemaVersion === 1 &&
    typeof record.id === 'string' &&
    SAFE_ID.test(record.id) &&
    typeof record.displayTitle === 'string' &&
    typeof record.purpose === 'string' &&
    typeof record.notes === 'string' &&
    typeof record.createdAt === 'string' &&
    typeof record.contentUpdatedAt === 'string' &&
    typeof record.previewBackground === 'string' &&
    Array.isArray(record.assetIds) &&
    record.assetIds.every((id) => typeof id === 'string' && SAFE_ID.test(id)) &&
    Array.isArray(record.documentBlocks) &&
    record.documentBlocks.length > 0 &&
    record.documentBlocks.every(isDocumentBlock)
  );
}

function isRepositoryAssetManifest(
  value: unknown,
  record: RndMockupRecord,
): value is RepositoryAssetManifest {
  if (!value || typeof value !== 'object') return false;
  const asset = value as Partial<RepositoryAssetManifest>;
  const extension = typeof asset.mimeType === 'string' ? MIME_EXTENSIONS.get(asset.mimeType) : undefined;
  return (
    typeof asset.id === 'string' &&
    SAFE_ID.test(asset.id) &&
    asset.mockupId === record.id &&
    typeof asset.fileName === 'string' &&
    asset.fileName.length > 0 &&
    asset.fileName.length <= 512 &&
    typeof asset.mimeType === 'string' &&
    extension !== undefined &&
    typeof asset.size === 'number' &&
    Number.isSafeInteger(asset.size) &&
    asset.size >= 0 &&
    asset.size <= MAX_IMAGE_BYTES &&
    typeof asset.createdAt === 'string' &&
    asset.relativePath === `assets/${asset.id}.${extension}`
  );
}

function decodeBase64(value: string): Buffer {
  if (value.length === 0) return Buffer.alloc(0);
  if (value.length % 4 !== 0 || !/^[a-zA-Z0-9+/]+={0,2}$/.test(value)) {
    throw new RequestValidationError('Reference image data is not valid base64.');
  }
  const bytes = Buffer.from(value, 'base64');
  if (bytes.toString('base64') !== value) {
    throw new RequestValidationError('Reference image data is not canonical base64.');
  }
  return bytes;
}

function parseSaveRequest(value: unknown): {
  request: RepositorySaveRequest;
  imageBytes: Map<string, Buffer>;
} {
  if (!value || typeof value !== 'object') {
    throw new RequestValidationError('Repository save payload must be an object.');
  }
  const candidate = value as Partial<RepositorySaveRequest>;
  if (!isMockupRecord(candidate.record) || !Array.isArray(candidate.assets)) {
    throw new RequestValidationError('Repository save payload has an invalid mock-up record.');
  }
  if (candidate.assets.length > MAX_IMAGES) {
    throw new RequestValidationError(`A mock-up can contain up to ${MAX_IMAGES} images.`);
  }

  const imageBytes = new Map<string, Buffer>();
  let totalBytes = 0;
  for (const asset of candidate.assets) {
    if (!asset || typeof asset !== 'object') {
      throw new RequestValidationError('Repository asset metadata is invalid.');
    }
    const typedAsset = asset as Partial<RepositoryAssetPayload>;
    if (
      typeof typedAsset.id !== 'string' ||
      !SAFE_ID.test(typedAsset.id) ||
      typedAsset.mockupId !== candidate.record.id ||
      typeof typedAsset.fileName !== 'string' ||
      typedAsset.fileName.length === 0 ||
      typedAsset.fileName.length > 512 ||
      typeof typedAsset.mimeType !== 'string' ||
      !MIME_EXTENSIONS.has(typedAsset.mimeType) ||
      typeof typedAsset.size !== 'number' ||
      !Number.isSafeInteger(typedAsset.size) ||
      typedAsset.size < 0 ||
      typeof typedAsset.createdAt !== 'string' ||
      typeof typedAsset.dataBase64 !== 'string'
    ) {
      throw new RequestValidationError('Repository asset metadata is invalid.');
    }
    if (imageBytes.has(typedAsset.id)) {
      throw new RequestValidationError('Repository asset IDs must be unique.');
    }
    const bytes = decodeBase64(typedAsset.dataBase64);
    if (bytes.length !== typedAsset.size || bytes.length > MAX_IMAGE_BYTES) {
      throw new RequestValidationError('Repository asset size does not match its image data.');
    }
    totalBytes += bytes.length;
    if (totalBytes > MAX_TOTAL_IMAGE_BYTES) {
      throw new RequestValidationError('Repository images exceed the 50 MB mock-up limit.');
    }
    imageBytes.set(typedAsset.id, bytes);
  }

  const requestAssetIds = candidate.assets.map((asset) => asset.id).sort();
  const recordAssetIds = [...candidate.record.assetIds].sort();
  if (JSON.stringify(requestAssetIds) !== JSON.stringify(recordAssetIds)) {
    throw new RequestValidationError('Repository payload must include every referenced image exactly once.');
  }
  const blockAssetIds = candidate.record.documentBlocks
    .filter((block): block is Extract<RndDocumentBlock, { type: 'image' }> => block.type === 'image')
    .map((block) => block.assetId)
    .sort();
  if (JSON.stringify(blockAssetIds) !== JSON.stringify(recordAssetIds)) {
    throw new RequestValidationError('Document image blocks must match the record asset IDs.');
  }

  return {
    request: { record: candidate.record, assets: candidate.assets as RepositoryAssetPayload[] },
    imageBytes,
  };
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let byteLength = 0;
  for await (const chunk of request) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    byteLength += bytes.length;
    if (byteLength > MAX_BODY_BYTES) throw new PayloadTooLargeError();
    chunks.push(bytes);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
  } catch {
    throw new RequestValidationError('Repository save payload is not valid JSON.');
  }
}

async function repositoryMockupsRoot(repoRoot: string): Promise<string> {
  const resolvedRepoRoot = await realpath(repoRoot);
  const requestedRoot = resolve(resolvedRepoRoot, 'docs', 'research-development', 'mockups');
  await mkdir(requestedRoot, { recursive: true });
  const resolvedRoot = await realpath(requestedRoot);
  if (resolvedRoot !== resolvedRepoRoot && !resolvedRoot.startsWith(`${resolvedRepoRoot}${sep}`)) {
    throw new Error('R&D repository directory resolves outside the Chronicle repository.');
  }
  const rootStat = await lstat(resolvedRoot);
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) {
    throw new Error('R&D repository path must be a real directory.');
  }
  return resolvedRoot;
}

async function repositoryGeneratedRoot(repoRoot: string): Promise<string> {
  const resolvedRepoRoot = await realpath(repoRoot);
  const requestedRoot = resolve(resolvedRepoRoot, 'docs', 'research-development', 'generated');
  await mkdir(requestedRoot, { recursive: true });
  const resolvedRoot = await realpath(requestedRoot);
  if (resolvedRoot !== resolvedRepoRoot && !resolvedRoot.startsWith(`${resolvedRepoRoot}${sep}`)) {
    throw new Error('R&D generated-artifact directory resolves outside the Chronicle repository.');
  }
  const rootStat = await lstat(resolvedRoot);
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) {
    throw new Error('R&D generated-artifact path must be a real directory.');
  }
  return resolvedRoot;
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
}

async function readManifest(path: string): Promise<RepositoryManifest> {
  const manifestStat = await lstat(path);
  if (!manifestStat.isFile() || manifestStat.isSymbolicLink()) {
    throw new Error(`R&D repository manifest must be a real file: ${path}`);
  }
  const parsed = JSON.parse(await readFile(path, 'utf8')) as Partial<RepositoryManifest>;
  if (
    parsed.repositoryFormatVersion !== REPOSITORY_FORMAT_VERSION ||
    typeof parsed.savedAt !== 'string' ||
    !isMockupRecord(parsed.record) ||
    !Array.isArray(parsed.assets) ||
    parsed.assets.length > MAX_IMAGES ||
    !parsed.assets.every((asset) => isRepositoryAssetManifest(asset, parsed.record!))
  ) {
    throw new Error(`Invalid R&D repository manifest: ${path}`);
  }

  const assets = parsed.assets as RepositoryAssetManifest[];
  const manifestAssetIds = assets.map((asset) => asset.id).sort();
  const recordAssetIds = [...parsed.record.assetIds].sort();
  const blockAssetIds = parsed.record.documentBlocks
    .filter((block): block is Extract<RndDocumentBlock, { type: 'image' }> => block.type === 'image')
    .map((block) => block.assetId)
    .sort();
  const totalBytes = assets.reduce((sum, asset) => sum + asset.size, 0);
  if (
    new Set(manifestAssetIds).size !== manifestAssetIds.length ||
    totalBytes > MAX_TOTAL_IMAGE_BYTES ||
    JSON.stringify(manifestAssetIds) !== JSON.stringify(recordAssetIds) ||
    JSON.stringify(blockAssetIds) !== JSON.stringify(recordAssetIds)
  ) {
    throw new Error(`R&D repository manifest assets do not match its record: ${path}`);
  }
  return parsed as RepositoryManifest;
}

async function saveMockupToRepository(repoRoot: string, value: unknown) {
  const { request, imageBytes } = parseSaveRequest(value);
  if (isRetiredRndMockupId(request.record.id)) {
    throw new RequestValidationError('This retired R&D mock-up cannot be restored to the active workspace.');
  }
  const mockupsRoot = await repositoryMockupsRoot(repoRoot);
  const destination = join(mockupsRoot, request.record.id);
  const staging = await mkdtemp(join(mockupsRoot, '.tmp-save-'));
  const backup = join(mockupsRoot, `.backup-${request.record.id}-${randomUUID()}`);
  let backupCreated = false;

  try {
    const assetsDirectory = join(staging, 'assets');
    await mkdir(assetsDirectory, { recursive: true });
    const manifestAssets: RepositoryAssetManifest[] = [];
    for (const asset of request.assets) {
      const extension = MIME_EXTENSIONS.get(asset.mimeType);
      if (!extension) throw new RequestValidationError('Unsupported repository image type.');
      const relativePath = `assets/${asset.id}.${extension}`;
      await writeFile(join(staging, ...relativePath.split('/')), imageBytes.get(asset.id)!, {
        mode: 0o600,
      });
      manifestAssets.push({
        id: asset.id,
        mockupId: asset.mockupId,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
        size: asset.size,
        createdAt: asset.createdAt,
        relativePath,
      });
    }

    const savedAt = new Date().toISOString();
    const manifest: RepositoryManifest = {
      repositoryFormatVersion: REPOSITORY_FORMAT_VERSION,
      savedAt,
      record: request.record,
      assets: manifestAssets,
    };
    await writeFile(join(staging, 'mockup.json'), `${JSON.stringify(manifest, null, 2)}\n`, {
      encoding: 'utf8',
      mode: 0o600,
    });

    if (await pathExists(destination)) {
      const destinationStat = await lstat(destination);
      if (!destinationStat.isDirectory() || destinationStat.isSymbolicLink()) {
        throw new Error('Existing R&D mock-up path is not a safe directory.');
      }
      await rename(destination, backup);
      backupCreated = true;
    }

    try {
      await rename(staging, destination);
    } catch (error) {
      if (backupCreated && !(await pathExists(destination))) {
        await rename(backup, destination);
        backupCreated = false;
      }
      throw error;
    }

    if (backupCreated) {
      await rm(backup, { recursive: true, force: true });
      backupCreated = false;
    }
    return { savedAt, repositoryPath: `docs/research-development/mockups/${request.record.id}/mockup.json` };
  } finally {
    if (await pathExists(staging)) await rm(staging, { recursive: true, force: true });
    if (backupCreated && !(await pathExists(destination))) await rename(backup, destination);
  }
}

async function loadRepositoryWorkspace(repoRoot: string) {
  const mockupsRoot = await repositoryMockupsRoot(repoRoot);
  const entries = await readdir(mockupsRoot, { withFileTypes: true });
  const mockups: RndMockupRecord[] = [];
  const assets: Array<Omit<RepositoryAssetManifest, 'relativePath'> & { url: string }> = [];

  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if (!entry.isDirectory() || entry.name.startsWith('.') || !SAFE_ID.test(entry.name)) continue;
    if (isRetiredRndMockupId(entry.name)) continue;
    const directory = join(mockupsRoot, entry.name);
    const directoryStat = await lstat(directory);
    if (directoryStat.isSymbolicLink()) continue;
    const manifest = await readManifest(join(directory, 'mockup.json'));
    if (manifest.record.id !== entry.name) {
      throw new Error(`R&D manifest identity does not match its directory: ${entry.name}`);
    }
    mockups.push(manifest.record);
    for (const asset of manifest.assets) {
      const expectedPrefix = `assets/${asset.id}.`;
      if (!SAFE_ID.test(asset.id) || !asset.relativePath.startsWith(expectedPrefix)) {
        throw new Error(`Invalid R&D asset path in ${entry.name}.`);
      }
      assets.push({
        id: asset.id,
        mockupId: asset.mockupId,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
        size: asset.size,
        createdAt: asset.createdAt,
        url: `${ASSET_PATH_PREFIX}${encodeURIComponent(entry.name)}/${encodeURIComponent(asset.relativePath.slice('assets/'.length))}`,
      });
    }
  }
  return { mockups, assets };
}

async function sendRepositoryAsset(
  repoRoot: string,
  requestPath: string,
  response: ServerResponse,
) {
  const encoded = requestPath.slice(ASSET_PATH_PREFIX.length).split('/');
  if (encoded.length !== 2) throw new RequestValidationError('Invalid repository asset path.');
  let mockupId: string;
  let fileName: string;
  try {
    mockupId = decodeURIComponent(encoded[0]);
    fileName = decodeURIComponent(encoded[1]);
  } catch {
    throw new RequestValidationError('Invalid repository asset path encoding.');
  }
  if (!SAFE_ID.test(mockupId) || !/^[a-zA-Z0-9_-]+\.(jpg|png|webp)$/.test(fileName)) {
    throw new RequestValidationError('Invalid repository asset path.');
  }

  const mockupsRoot = await repositoryMockupsRoot(repoRoot);
  const directory = join(mockupsRoot, mockupId);
  const directoryStat = await lstat(directory);
  if (!directoryStat.isDirectory() || directoryStat.isSymbolicLink()) {
    throw new Error('R&D repository mock-up path must be a real directory.');
  }
  const manifest = await readManifest(join(directory, 'mockup.json'));
  const asset = manifest.assets.find((candidate) => candidate.relativePath === `assets/${fileName}`);
  if (!asset) {
    response.statusCode = 404;
    response.end();
    return;
  }
  const assetPath = join(directory, 'assets', fileName);
  const assetStat = await lstat(assetPath);
  if (!assetStat.isFile() || assetStat.isSymbolicLink() || assetStat.size !== asset.size) {
    throw new Error('R&D repository image does not match its manifest.');
  }
  const [resolvedDirectory, resolvedAssetPath] = await Promise.all([
    realpath(directory),
    realpath(assetPath),
  ]);
  if (!resolvedAssetPath.startsWith(`${resolvedDirectory}${sep}`)) {
    throw new Error('R&D repository image resolves outside its mock-up directory.');
  }
  const bytes = await readFile(resolvedAssetPath);
  response.statusCode = 200;
  response.setHeader('Content-Type', asset.mimeType);
  response.setHeader('Content-Length', String(bytes.length));
  response.setHeader('Cache-Control', 'no-store');
  response.end(bytes);
}

async function sendGeneratedArtifact(
  repoRoot: string,
  requestPath: string,
  response: ServerResponse,
) {
  const encoded = requestPath.slice(GENERATED_ARTIFACT_PATH_PREFIX.length).split('/');
  if (encoded.length !== 2) throw new RequestValidationError('Invalid generated-artifact path.');

  let prototypeId: string;
  let fileName: string;
  try {
    prototypeId = decodeURIComponent(encoded[0]);
    fileName = decodeURIComponent(encoded[1]);
  } catch {
    throw new RequestValidationError('Invalid generated-artifact path encoding.');
  }
  if (!SAFE_ID.test(prototypeId) || !SAFE_GENERATED_FILE.test(fileName)) {
    throw new RequestValidationError('Invalid generated-artifact path.');
  }

  const generatedRoot = await repositoryGeneratedRoot(repoRoot);
  const directory = join(generatedRoot, prototypeId);
  const artifactPath = join(directory, fileName);
  if (!(await pathExists(directory)) || !(await pathExists(artifactPath))) {
    response.statusCode = 404;
    response.end();
    return;
  }

  const [directoryStat, artifactStat] = await Promise.all([lstat(directory), lstat(artifactPath)]);
  if (!directoryStat.isDirectory() || directoryStat.isSymbolicLink()) {
    throw new Error('R&D generated prototype path must be a real directory.');
  }
  if (
    !artifactStat.isFile() ||
    artifactStat.isSymbolicLink() ||
    artifactStat.size > MAX_GENERATED_ARTIFACT_BYTES
  ) {
    throw new Error('R&D generated artifact must be a bounded real file.');
  }

  const [resolvedDirectory, resolvedArtifactPath] = await Promise.all([
    realpath(directory),
    realpath(artifactPath),
  ]);
  if (!resolvedArtifactPath.startsWith(`${resolvedDirectory}${sep}`)) {
    throw new Error('R&D generated artifact resolves outside its prototype directory.');
  }

  const mimeType = GENERATED_ARTIFACT_MIME_TYPES.get(extname(fileName).toLowerCase());
  if (!mimeType) throw new RequestValidationError('Unsupported generated-artifact type.');
  const bytes = await readFile(resolvedArtifactPath);
  response.statusCode = 200;
  response.setHeader('Content-Type', mimeType);
  response.setHeader('Content-Length', String(bytes.length));
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  if (extname(fileName).toLowerCase() === '.html') {
    response.setHeader(
      'Content-Security-Policy',
      "default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; font-src data:; connect-src 'none'; frame-ancestors 'self';",
    );
  }
  response.end(bytes);
}

export function rndRepositoryDevPlugin(): Plugin {
  let repositoryWriteQueue: Promise<void> = Promise.resolve();
  return {
    name: 'chronicle-rnd-repository-dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const requestUrl = new URL(request.url ?? '/', 'http://localhost');
        const isRepositoryRoute =
          requestUrl.pathname === WORKSPACE_PATH ||
          requestUrl.pathname === SAVE_PATH ||
          requestUrl.pathname.startsWith(ASSET_PATH_PREFIX) ||
          requestUrl.pathname.startsWith(GENERATED_ARTIFACT_PATH_PREFIX);
        if (!isRepositoryRoute) {
          next();
          return;
        }
        if (!isLoopbackRequest(request)) {
          sendJson(response, 403, { error: 'rnd_repository_is_loopback_only' });
          return;
        }

        try {
          if (requestUrl.pathname === WORKSPACE_PATH) {
            if (request.method !== 'GET') {
              sendJson(response, 405, { error: 'method_not_allowed' });
              return;
            }
            await repositoryWriteQueue;
            sendJson(response, 200, await loadRepositoryWorkspace(server.config.root));
            return;
          }
          if (requestUrl.pathname === SAVE_PATH) {
            if (request.method !== 'POST') {
              sendJson(response, 405, { error: 'method_not_allowed' });
              return;
            }
            const body = await readJsonBody(request);
            const saveTask = repositoryWriteQueue.then(() =>
              saveMockupToRepository(server.config.root, body),
            );
            repositoryWriteQueue = saveTask.then(
              () => undefined,
              () => undefined,
            );
            sendJson(response, 200, await saveTask);
            return;
          }
          if (request.method !== 'GET') {
            sendJson(response, 405, { error: 'method_not_allowed' });
            return;
          }
          await repositoryWriteQueue;
          if (requestUrl.pathname.startsWith(GENERATED_ARTIFACT_PATH_PREFIX)) {
            await sendGeneratedArtifact(server.config.root, requestUrl.pathname, response);
            return;
          }
          await sendRepositoryAsset(server.config.root, requestUrl.pathname, response);
        } catch (error) {
          if (error instanceof PayloadTooLargeError) {
            sendJson(response, 413, { error: 'payload_too_large', message: error.message });
            return;
          }
          if (error instanceof RequestValidationError) {
            sendJson(response, 400, { error: 'invalid_request', message: error.message });
            return;
          }
          sendJson(response, 500, {
            error: 'rnd_repository_unavailable',
            message: error instanceof Error ? error.message : 'Repository save failed.',
          });
        }
      });
    },
  };
}
