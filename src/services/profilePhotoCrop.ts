export const CROP_SIZE = 360;

export function cropLayout(
  imageWidth: number,
  imageHeight: number,
  zoom: number,
  offsetX: number,
  offsetY: number,
) {
  const scale = Math.max(CROP_SIZE / imageWidth, CROP_SIZE / imageHeight) * zoom;
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  const maxX = (width - CROP_SIZE) / 2;
  const maxY = (height - CROP_SIZE) / 2;
  const x = Math.max(-maxX, Math.min(maxX, offsetX));
  const y = Math.max(-maxY, Math.min(maxY, offsetY));

  return {
    x: (CROP_SIZE - width) / 2 + x,
    y: (CROP_SIZE - height) / 2 + y,
    width,
    height,
    offsetX: x,
    offsetY: y,
  };
}
