import { describe, expect, it } from 'vitest';
import { buildSrcSetFromVariantMap } from './responsiveImage.js';

describe('buildSrcSetFromVariantMap', () => {
  it('returns src only when variant map is empty', () => {
    expect(buildSrcSetFromVariantMap('https://cdn/x.webp', null)).toEqual({
      src: 'https://cdn/x.webp',
    });
    expect(buildSrcSetFromVariantMap('https://cdn/x.webp', {})).toEqual({
      src: 'https://cdn/x.webp',
    });
  });

  it('builds sorted srcSet and sizes from width keys', () => {
    const r = buildSrcSetFromVariantMap('https://cdn/x-1920.webp', { 640: 'https://a/640.webp', 1280: 'https://a/1280.webp' }, '(max-width: 800px) 100vw, 720px');
    expect(r.src).toBe('https://cdn/x-1920.webp');
    expect(r.srcSet).toBe('https://a/640.webp 640w, https://a/1280.webp 1280w');
    expect(r.sizes).toBe('(max-width: 800px) 100vw, 720px');
  });
});
