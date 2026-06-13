export const CHARACTER_AVATAR_PREVIEW_SIZE = 192;
export const CHAT_TILE_HEIGHT = 140;
export const CHAT_TILE_WIDTH = 268;
export const CHAT_SIDEBAR_WIDTH = CHAT_TILE_WIDTH + 32;

export type Size2D = { width: number; height: number };

export const avatarNaturalSizeCache = new Map<string, Size2D>();

export function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function mapObjectPositionFromPreviewToTile(
  stored: { x: number; y: number },
  imageSize: Size2D,
  tileSize: Size2D,
): { x: number; y: number } {
  const fromSize = {
    width: CHARACTER_AVATAR_PREVIEW_SIZE,
    height: CHARACTER_AVATAR_PREVIEW_SIZE,
  };

  const fromScale = Math.max(fromSize.width / imageSize.width, fromSize.height / imageSize.height);
  const toScale = Math.max(tileSize.width / imageSize.width, tileSize.height / imageSize.height);

  const mapAxis = (
    storedPercent: number,
    imageLength: number,
    fromLength: number,
    toLength: number,
  ): number => {
    const fromRendered = imageLength * fromScale;
    const fromOverflow = Math.max(0, fromRendered - fromLength);
    const sourceOffset = fromOverflow === 0 ? 0 : ((fromOverflow * clampPercent(storedPercent)) / 100) / fromScale;

    const toRendered = imageLength * toScale;
    const toOverflow = Math.max(0, toRendered - toLength);
    if (toOverflow === 0) return 50;
    const toOffset = sourceOffset * toScale;
    return clampPercent((toOffset / toOverflow) * 100);
  };

  return {
    x: mapAxis(stored.x, imageSize.width, fromSize.width, tileSize.width),
    y: mapAxis(stored.y, imageSize.height, fromSize.height, tileSize.height),
  };
}

export function mapTilePositionToPreview(
  tilePos: { x: number; y: number },
  imageSize: Size2D,
  tileSize: Size2D,
): { x: number; y: number } {
  const previewSize = { width: CHARACTER_AVATAR_PREVIEW_SIZE, height: CHARACTER_AVATAR_PREVIEW_SIZE };

  const fromScale = Math.max(tileSize.width / imageSize.width, tileSize.height / imageSize.height);
  const toScale = Math.max(previewSize.width / imageSize.width, previewSize.height / imageSize.height);

  const mapAxis = (
    tilePercent: number,
    imageLength: number,
    fromLength: number,
    toLength: number,
  ): number => {
    const fromRendered = imageLength * fromScale;
    const fromOverflow = Math.max(0, fromRendered - fromLength);
    const sourceOffset = fromOverflow === 0 ? 0 : ((fromOverflow * clampPercent(tilePercent)) / 100) / fromScale;

    const toRendered = imageLength * toScale;
    const toOverflow = Math.max(0, toRendered - toLength);
    if (toOverflow === 0) return 50;
    const toOffset = sourceOffset * toScale;
    return clampPercent((toOffset / toOverflow) * 100);
  };

  return {
    x: mapAxis(tilePos.x, imageSize.width, tileSize.width, previewSize.width),
    y: mapAxis(tilePos.y, imageSize.height, tileSize.height, previewSize.height),
  };
}
