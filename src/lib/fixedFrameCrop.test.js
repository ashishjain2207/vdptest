import { describe, expect, it } from 'vitest';
import {
  clampPan,
  computeCoverBaseScale,
  computeFitBaseScale,
  fitFrameSize,
  frameFitModeToDisplayMode,
  orientedImageSize,
} from './fixedFrameCrop';

describe('fitFrameSize', () => {
  it('fits a wide frame inside bounds', () => {
    const size = fitFrameSize(640, 400, 4);
    expect(size.width).toBe(640);
    expect(size.height).toBe(160);
    expect(size.width / size.height).toBeCloseTo(4, 2);
  });

  it('limits height when aspect is tall', () => {
    const size = fitFrameSize(400, 300, 0.75);
    expect(size.height).toBe(300);
    expect(size.width).toBe(225);
  });
});

describe('computeCoverBaseScale', () => {
  it('uses the larger scale so image covers the frame', () => {
    const scale = computeCoverBaseScale(2000, 1000, 800, 200, 0);
    expect(scale).toBeCloseTo(0.4);
    expect(2000 * scale).toBeGreaterThanOrEqual(800);
    expect(1000 * scale).toBeGreaterThanOrEqual(200);
  });

  it('swaps dimensions when rotated 90 degrees', () => {
    expect(orientedImageSize(2000, 1000, 90)).toEqual({ width: 1000, height: 2000 });
    const scale = computeCoverBaseScale(2000, 1000, 800, 200, 90);
    expect(1000 * scale).toBeGreaterThanOrEqual(800);
    expect(2000 * scale).toBeGreaterThanOrEqual(200);
  });
});

describe('computeFitBaseScale', () => {
  it('uses the smaller scale so the entire image fits in the frame', () => {
    const scale = computeFitBaseScale(2000, 1000, 800, 200, 0);
    expect(scale).toBeCloseTo(0.2);
    expect(2000 * scale).toBeLessThanOrEqual(800);
    expect(1000 * scale).toBeLessThanOrEqual(200);
  });
});

describe('frameFitModeToDisplayMode', () => {
  it('maps editor modes to display metadata modes', () => {
    expect(frameFitModeToDisplayMode('cover')).toBe('crop');
    expect(frameFitModeToDisplayMode('fit')).toBe('fit');
  });
});

describe('clampPan', () => {
  it('centers when image is smaller than frame on an axis', () => {
    const pan = clampPan({ x: 40, y: -30 }, 300, 100, 800, 200, 1, 1, 0);
    expect(pan).toEqual({ x: 0, y: 0 });
  });

  it('clamps pan when image exceeds frame', () => {
    const base = computeCoverBaseScale(2000, 1000, 800, 200, 0);
    const pan = clampPan({ x: 500, y: 0 }, 2000, 1000, 800, 200, base, 1, 0);
    const displayedW = 2000 * base;
    const max = (displayedW - 800) / 2;
    expect(pan.x).toBeCloseTo(max, 5);
  });
});
