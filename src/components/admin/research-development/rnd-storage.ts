import { uuid } from "@/utils";

import {
  RND_SCHEMA_VERSION,
  type RndDocumentBlock,
  type PreviewBackground,
  type RndMockupRecord,
  type RndReferenceAsset,
  type RndWorkspaceData,
} from "./rnd-types";
import { isRetiredRndMockupId } from "./rnd-retired";

const DATABASE_NAME = "chronicle-rnd-workspace";
const DATABASE_VERSION = 1;
const MOCKUPS_STORE = "mockups";
const ASSETS_STORE = "assets";

export const MAX_REFERENCE_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_REFERENCE_IMAGES_PER_MOCKUP = 20;
export const MAX_RND_ASSET_BYTES = 50 * 1024 * 1024;

const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const PREVIEW_BACKGROUNDS = new Set<PreviewBackground>([
  "charcoal",
  "light",
  "ink",
  "slate",
  "paper",
  "checkerboard",
]);

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Browser storage request failed."));
  });
}

function transactionComplete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Browser storage transaction failed."));
    transaction.onabort = () => reject(transaction.error ?? new Error("Browser storage transaction was cancelled."));
  });
}

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("This browser does not provide device-local IndexedDB storage."));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(MOCKUPS_STORE)) {
        database.createObjectStore(MOCKUPS_STORE, { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains(ASSETS_STORE)) {
        const assets = database.createObjectStore(ASSETS_STORE, { keyPath: "id" });
        assets.createIndex("mockupId", "mockupId", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open device-local R&D storage."));
    request.onblocked = () => reject(new Error("R&D storage is open in an older Chronicle tab. Close that tab and try again."));
  });
}

function parseDocumentBlocks(value: unknown): RndDocumentBlock[] | null {
  if (!Array.isArray(value)) return null;
  const blocks: RndDocumentBlock[] = [];

  for (const candidate of value) {
    if (!candidate || typeof candidate !== "object") return null;
    const block = candidate as Partial<RndDocumentBlock>;
    if (typeof block.id !== "string") return null;
    if (block.type === "text" && typeof block.text === "string") {
      blocks.push({ id: block.id, type: "text", text: block.text });
      continue;
    }
    if (block.type === "image" && typeof block.assetId === "string") {
      blocks.push({ id: block.id, type: "image", assetId: block.assetId });
      continue;
    }
    return null;
  }

  return blocks;
}

export function parseRndMockupRecord(value: unknown): RndMockupRecord | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Partial<RndMockupRecord>;
  if (
    record.schemaVersion !== RND_SCHEMA_VERSION ||
    typeof record.id !== "string" ||
    typeof record.displayTitle !== "string" ||
    typeof record.purpose !== "string" ||
    typeof record.notes !== "string" ||
    typeof record.createdAt !== "string" ||
    typeof record.contentUpdatedAt !== "string" ||
    typeof record.previewBackground !== "string" ||
    !PREVIEW_BACKGROUNDS.has(record.previewBackground as PreviewBackground) ||
    !Array.isArray(record.assetIds) ||
    !record.assetIds.every((id) => typeof id === "string")
  ) {
    return null;
  }

  const storedBlocks = parseDocumentBlocks(record.documentBlocks);
  const documentBlocks =
    storedBlocks && storedBlocks.length > 0
      ? storedBlocks
      : [
          ...record.notes.split("\n").map((text, index) => ({
            id: `${record.id}-legacy-text-${index}`,
            type: "text" as const,
            text,
          })),
          ...record.assetIds.map((assetId) => ({
            id: `${record.id}-legacy-image-${assetId}`,
            type: "image" as const,
            assetId,
          })),
        ];

  return {
    schemaVersion: RND_SCHEMA_VERSION,
    id: record.id,
    displayTitle: record.displayTitle,
    purpose: record.purpose,
    notes: record.notes,
    createdAt: record.createdAt,
    contentUpdatedAt: record.contentUpdatedAt,
    previewBackground: record.previewBackground as PreviewBackground,
    assetIds: record.assetIds,
    documentBlocks,
  };
}

function isReferenceAsset(value: unknown): value is RndReferenceAsset {
  if (!value || typeof value !== "object") return false;
  const asset = value as Partial<RndReferenceAsset>;
  return (
    typeof asset.id === "string" &&
    typeof asset.mockupId === "string" &&
    typeof asset.fileName === "string" &&
    typeof asset.mimeType === "string" &&
    typeof asset.size === "number" &&
    typeof asset.createdAt === "string" &&
    asset.blob instanceof Blob
  );
}

export function createBlankRndMockup(createdAt = new Date().toISOString()): RndMockupRecord {
  const id = uuid();
  return {
    schemaVersion: RND_SCHEMA_VERSION,
    id,
    displayTitle: "Untitled Mock-up",
    purpose: "",
    documentBlocks: [{ id: uuid(), type: "text", text: "" }],
    notes: "",
    createdAt,
    contentUpdatedAt: createdAt,
    previewBackground: "charcoal",
    assetIds: [],
  };
}

export async function loadRndWorkspace(): Promise<RndWorkspaceData> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction([MOCKUPS_STORE, ASSETS_STORE], "readonly");
    const mockupsRequest = transaction.objectStore(MOCKUPS_STORE).getAll();
    const assetsRequest = transaction.objectStore(ASSETS_STORE).getAll();
    const [rawMockups, rawAssets] = await Promise.all([
      requestResult(mockupsRequest),
      requestResult(assetsRequest),
      transactionComplete(transaction),
    ]);

    return {
      mockups: rawMockups
        .map(parseRndMockupRecord)
        .filter(
          (mockup): mockup is RndMockupRecord =>
            mockup !== null && !isRetiredRndMockupId(mockup.id),
        )
        .sort((left, right) => left.createdAt.localeCompare(right.createdAt)),
      assets: rawAssets.filter(isReferenceAsset),
    };
  } finally {
    database.close();
  }
}

export async function saveRndMockup(
  mockup: RndMockupRecord,
  newAssets: readonly RndReferenceAsset[] = [],
  removedAssetIds: readonly string[] = [],
): Promise<void> {
  if (isRetiredRndMockupId(mockup.id)) {
    throw new Error("This retired R&D mock-up is preserved as history and cannot be saved as an active workspace.");
  }
  const database = await openDatabase();
  try {
    const transaction = database.transaction([MOCKUPS_STORE, ASSETS_STORE], "readwrite");
    transaction.objectStore(MOCKUPS_STORE).put(mockup);
    const assetStore = transaction.objectStore(ASSETS_STORE);
    newAssets.forEach((asset) => assetStore.put(asset));
    removedAssetIds.forEach((assetId) => assetStore.delete(assetId));
    await transactionComplete(transaction);
  } finally {
    database.close();
  }
}

interface PrepareReferenceAssetsOptions {
  mockupId: string;
  existingPageCount: number;
  existingTotalBytes: number;
}

export function prepareReferenceAssets(
  files: readonly File[],
  options: PrepareReferenceAssetsOptions,
): RndReferenceAsset[] {
  if (files.length === 0) return [];

  if (options.existingPageCount + files.length > MAX_REFERENCE_IMAGES_PER_MOCKUP) {
    throw new Error(`A mock-up can contain up to ${MAX_REFERENCE_IMAGES_PER_MOCKUP} reference images.`);
  }

  let nextTotalBytes = options.existingTotalBytes;
  const now = new Date().toISOString();

  return files.map((file) => {
    if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
      throw new Error(`${file.name} is not a supported image. Use JPEG, PNG, or WebP.`);
    }
    if (file.size > MAX_REFERENCE_IMAGE_BYTES) {
      throw new Error(`${file.name} is larger than the 10 MB per-image limit.`);
    }

    nextTotalBytes += file.size;
    if (nextTotalBytes > MAX_RND_ASSET_BYTES) {
      throw new Error("R&D reference images have reached the 50 MB device-local storage limit.");
    }

    return {
      id: uuid(),
      mockupId: options.mockupId,
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
      createdAt: now,
      blob: file,
    };
  });
}

export function describeRndStorageError(error: unknown): string {
  if (error instanceof DOMException && error.name === "QuotaExceededError") {
    return "This browser is out of device-local space for R&D notes or images. Remove an image and try again.";
  }
  if (error instanceof Error && error.message) return error.message;
  return "Chronicle could not save this mock-up to device-local storage.";
}
