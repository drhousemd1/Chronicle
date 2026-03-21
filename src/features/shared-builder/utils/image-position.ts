export type Size2D = { width: number; height: number };

export const clampPercent = (value: number): number => Math.max(0, Math.min(100, value));

const mapAxis = (
  percent: number,
  imageLength: number,
  fromLength: number,
  toLength: number,
  fromScale: number,
  toScale: number
): number => {
  const fromRendered = imageLength * fromScale;
  const fromOverflow = Math.max(0, fromRendered - fromLength);
  const sourceOffset =
    fromOverflow === 0
      ? 0
      : ((fromOverflow * clampPercent(percent)) / 100) / fromScale;

  const toRendered = imageLength * toScale;
  const toOverflow = Math.max(0, toRendered - toLength);
  if (toOverflow === 0) return 50;

  const toOffset = sourceOffset * toScale;
  return clampPercent((toOffset / toOverflow) * 100);
};

export const mapPositionBetweenFrames = (
  stored: { x: number; y: number },
  imageSize: Size2D,
  fromSize: Size2D,
  toSize: Size2D
): { x: number; y: number } => {
  const fromScale = Math.max(
    fromSize.width / imageSize.width,
    fromSize.height / imageSize.height
  );
  const toScale = Math.max(
    toSize.width / imageSize.width,
    toSize.height / imageSize.height
  );

  return {
    x: mapAxis(stored.x, imageSize.width, fromSize.width, toSize.width, fromScale, toScale),
    y: mapAxis(stored.y, imageSize.height, fromSize.height, toSize.height, fromScale, toScale),
  };
};

export const mapPreviewToTilePosition = (
  storedPreviewPercent: { x: number; y: number },
  imageSize: Size2D,
  previewSize: Size2D,
  tileSize: Size2D
): { x: number; y: number } =>
  mapPositionBetweenFrames(storedPreviewPercent, imageSize, previewSize, tileSize);

export const mapTileToPreviewPosition = (
  tilePercent: { x: number; y: number },
  imageSize: Size2D,
  tileSize: Size2D,
  previewSize: Size2D
): { x: number; y: number } =>
  mapPositionBetweenFrames(tilePercent, imageSize, tileSize, previewSize);
