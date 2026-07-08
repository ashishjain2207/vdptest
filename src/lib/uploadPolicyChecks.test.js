import { describe, it, expect } from 'vitest';
import { fileExt, isFileAllowedByUploadPolicy } from './uploadPolicyChecks.js';

describe('uploadPolicyChecks', () => {
  it('extracts extension in lowercase', () => {
    expect(fileExt('Photo.JPG')).toBe('.jpg');
    expect(fileExt('noext')).toBe('');
  });

  it('rejects file when extension not in policy', () => {
    const file = new File(['x'], 'a.mp4', { type: 'video/mp4' });
    const policy = { allowedExtensions: ['.png'], allowedMimes: ['image/png'] };
    expect(isFileAllowedByUploadPolicy(file, policy)).toBe(false);
  });

  it('accepts when extension and mime match policy', () => {
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    const policy = { allowedExtensions: ['.png'], allowedMimes: ['image/png'] };
    expect(isFileAllowedByUploadPolicy(file, policy)).toBe(true);
  });

  it('accepts when extension is missing but MIME matches policy', () => {
    const file = new File(['x'], 'camera_upload', { type: 'image/png' });
    const policy = { allowedExtensions: ['.png'], allowedMimes: ['image/png'] };
    expect(isFileAllowedByUploadPolicy(file, policy)).toBe(true);
  });
});

