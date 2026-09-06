import { describe, expect, it } from "vitest";

import {
  MAX_REFERENCE_IMAGE_BYTES,
  MAX_REFERENCE_IMAGES_PER_MOCKUP,
  MAX_RND_ASSET_BYTES,
  createBlankRndMockup,
  describeRndStorageError,
  prepareReferenceAssets,
} from "./rnd-storage";

describe("R&D device-local storage contract", () => {
  it("creates a stable blank workspace record without any coded preview data", () => {
    const record = createBlankRndMockup("2026-08-10T00:00:00.000Z");

    expect(record.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(record.displayTitle).toBe("Untitled Mock-up");
    expect(record.createdAt).toBe("2026-08-10T00:00:00.000Z");
    expect(record.assetIds).toEqual([]);
    expect(record.documentBlocks).toEqual([
      expect.objectContaining({ type: "text", text: "" }),
    ]);
    expect(record).not.toHaveProperty("html");
    expect(record).not.toHaveProperty("details");
  });

  it("accepts JPEG, PNG, and WebP reference images as original blobs", () => {
    const files = [
      new File(["jpg"], "reference.jpg", { type: "image/jpeg" }),
      new File(["png"], "reference.png", { type: "image/png" }),
      new File(["webp"], "reference.webp", { type: "image/webp" }),
    ];

    const assets = prepareReferenceAssets(files, {
      mockupId: "mockup-1",
      existingPageCount: 0,
      existingTotalBytes: 0,
    });

    expect(assets).toHaveLength(3);
    expect(assets.map((asset) => asset.mimeType)).toEqual(["image/jpeg", "image/png", "image/webp"]);
    expect(assets.every((asset) => asset.blob instanceof File)).toBe(true);
  });

  it("rejects unsafe or excessive reference-image input before storage", () => {
    expect(() =>
      prepareReferenceAssets([new File(["<svg />"], "reference.svg", { type: "image/svg+xml" })], {
        mockupId: "mockup-1",
        existingPageCount: 0,
        existingTotalBytes: 0,
      }),
    ).toThrow(/JPEG, PNG, or WebP/);

    expect(() =>
      prepareReferenceAssets([new File([new Uint8Array(MAX_REFERENCE_IMAGE_BYTES + 1)], "large.png", { type: "image/png" })], {
        mockupId: "mockup-1",
        existingPageCount: 0,
        existingTotalBytes: 0,
      }),
    ).toThrow(/10 MB/);

    expect(() =>
      prepareReferenceAssets([new File(["x"], "extra.png", { type: "image/png" })], {
        mockupId: "mockup-1",
        existingPageCount: MAX_REFERENCE_IMAGES_PER_MOCKUP,
        existingTotalBytes: 0,
      }),
    ).toThrow(/up to 20/);

    expect(() =>
      prepareReferenceAssets([new File(["x"], "extra.png", { type: "image/png" })], {
        mockupId: "mockup-1",
        existingPageCount: 0,
        existingTotalBytes: MAX_RND_ASSET_BYTES,
      }),
    ).toThrow(/50 MB/);
  });

  it("turns browser quota failures into an actionable message", () => {
    const error = new DOMException("Quota exceeded", "QuotaExceededError");
    expect(describeRndStorageError(error)).toMatch(/out of device-local space/i);
  });
});
