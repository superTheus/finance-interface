import { describe, expect, it } from 'vitest';
import { CROP_SIZE, cropLayout } from './profilePhotoCrop';

describe('cropLayout', () => {
  it('covers the crop area for landscape and portrait images', () => {
    for (const [width, height] of [[1200, 600], [600, 1200], [800, 800]]) {
      const layout = cropLayout(width, height, 1, 0, 0);
      expect(layout.x).toBeLessThanOrEqual(0);
      expect(layout.y).toBeLessThanOrEqual(0);
      expect(layout.x + layout.width).toBeGreaterThanOrEqual(CROP_SIZE);
      expect(layout.y + layout.height).toBeGreaterThanOrEqual(CROP_SIZE);
    }
  });

  it('clamps dragging so no empty area enters the crop', () => {
    const layout = cropLayout(1200, 600, 2, 9999, -9999);
    expect(layout.x).toBe(0);
    expect(layout.y + layout.height).toBe(CROP_SIZE);
    expect(layout.offsetX).toBeLessThan(9999);
    expect(layout.offsetY).toBeGreaterThan(-9999);
  });
});
