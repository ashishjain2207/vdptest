import { describe, expect, it } from 'vitest';
import { scaleDimensionsToMaxEdge, scaleToTargetAspect } from './imageCropOutput';

describe('scaleDimensionsToMaxEdge', () => {
  it('keeps dimensions when below max edge', () => {
    expect(scaleDimensionsToMaxEdge(800, 600, 2560)).toEqual({ width: 800, height: 600 });
  });

  it('scales down the longest edge to the max', () => {
    const scaled = scaleDimensionsToMaxEdge(4000, 2250, 2560);
    expect(scaled.width).toBe(2560);
    expect(scaled.height).toBe(1440);
    expect(scaled.width / scaled.height).toBeCloseTo(16 / 9, 2);
  });

  it('preserves square aspect when scaling', () => {
    const scaled = scaleDimensionsToMaxEdge(3000, 3000, 1200);
    expect(scaled.width).toBe(1200);
    expect(scaled.height).toBe(1200);
  });

  it('preserves wide cover aspect when scaling', () => {
    const scaled = scaleDimensionsToMaxEdge(4000, 1000, 2560);
    expect(scaled.width).toBe(2560);
    expect(scaled.height).toBe(640);
    expect(scaled.width / scaled.height).toBeCloseTo(4, 2);
  });

  it('snaps output to the target aspect ratio before max-edge scaling', () => {
    const scaled = scaleToTargetAspect(800, 210, 4, 2560);
    expect(scaled.width / scaled.height).toBeCloseTo(4, 2);
    expect(scaled.width).toBeLessThanOrEqual(2560);
  });
});
