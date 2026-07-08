import { describe, it, expect } from 'vitest';
import { validatePostMediaFile } from './postMediaUpload.js';

describe('validatePostMediaFile', () => {
  it('rejects when policy disallows extension', () => {
    const file = new File(['x'], 'a.mp4', { type: 'video/mp4' });
    const policy = { allowedExtensions: ['.png'], allowedMimes: ['image/png'] };
    const v = validatePostMediaFile(file, policy);
    expect(v.ok).toBe(false);
  });

  it('accepts when policy allows extension and mime', () => {
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    const policy = { allowedExtensions: ['.png'], allowedMimes: ['image/png'] };
    const v = validatePostMediaFile(file, policy);
    expect(v.ok).toBe(true);
  });
});

