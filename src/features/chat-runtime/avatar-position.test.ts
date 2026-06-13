import { describe, expect, it } from 'vitest';

import {
  CHAT_TILE_HEIGHT,
  CHAT_TILE_WIDTH,
  clampPercent,
  mapObjectPositionFromPreviewToTile,
  mapTilePositionToPreview,
} from './avatar-position';

describe('chat avatar position helpers', () => {
  it('clamps percentages to the supported object-position range', () => {
    expect(clampPercent(-20)).toBe(0);
    expect(clampPercent(40)).toBe(40);
    expect(clampPercent(120)).toBe(100);
  });

  it('round-trips the axis that still has crop overflow in the chat tile', () => {
    const imageSize = { width: 2400, height: 800 };
    const tileSize = { width: CHAT_TILE_WIDTH, height: CHAT_TILE_HEIGHT };
    const stored = { x: 40, y: 22 };

    const tile = mapObjectPositionFromPreviewToTile(stored, imageSize, tileSize);
    const preview = mapTilePositionToPreview(tile, imageSize, tileSize);

    expect(preview.x).toBeCloseTo(stored.x, 5);
    expect(tile.y).toBe(50);
  });

  it('centers an axis when the target crop has no overflow', () => {
    expect(mapObjectPositionFromPreviewToTile(
      { x: 90, y: 10 },
      { width: 100, height: 100 },
      { width: 100, height: 100 },
    )).toEqual({ x: 50, y: 50 });
  });
});
