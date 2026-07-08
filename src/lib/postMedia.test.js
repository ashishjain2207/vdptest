import { describe, expect, it } from 'vitest';
import { postMediaKindFromApiType, postMediaKindFromUrl } from './postMedia.js';

describe('postMediaKindFromUrl', () => {
  it('keeps extensionless legacy media URLs renderable as images', () => {
    expect(postMediaKindFromUrl('https://cdn.example.com/media/abc123?sv=2026-01-01')).toBe('image');
    expect(postMediaKindFromUrl('blob:https://app.example.com/550e8400-e29b-41d4-a716-446655440000')).toBe('image');
  });

  it('still treats known document extensions as documents', () => {
    expect(postMediaKindFromUrl('https://cdn.example.com/files/report.pdf?token=abc')).toBe('document');
  });

  it('prefers image rendering for legacy media routes with unknown extensions', () => {
    expect(postMediaKindFromUrl('https://cdn.example.com/media/abc123.bin?sv=2026-01-01')).toBe('image');
  });
});

describe('postMediaKindFromApiType', () => {
  it('keeps explicit unknown API media types in the document branch', () => {
    expect(postMediaKindFromApiType('Unknown')).toBe('document');
  });
});
