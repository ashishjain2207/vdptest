import { describe, it, expect } from 'vitest';
import { DEFAULT_MAX_OUTPUT_BYTES } from './mediaOptimize';

describe('mediaOptimize', () => {
  it('uses a 3 MiB default output cap aligned with API PostMedia settings', () => {
    expect(DEFAULT_MAX_OUTPUT_BYTES).toBe(3145728);
  });
});
