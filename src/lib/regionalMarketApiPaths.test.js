import { describe, expect, it } from 'vitest';
import { isRegionalMarketScopedApiPath } from './regionalMarketApiPaths.js';

describe('isRegionalMarketScopedApiPath', () => {
  it('matches PascalCase and lowercase paths', () => {
    expect(isRegionalMarketScopedApiPath('/api/Posts/feed')).toBe(true);
    expect(isRegionalMarketScopedApiPath('/api/posts/feed')).toBe(true);
  });

  it('matches each configured prefix with subpaths', () => {
    expect(isRegionalMarketScopedApiPath('/api/comments')).toBe(true);
    expect(isRegionalMarketScopedApiPath('/api/comments/abc')).toBe(true);
    expect(isRegionalMarketScopedApiPath('/api/advertisements')).toBe(true);
    expect(isRegionalMarketScopedApiPath('/api/advertisements/x')).toBe(true);
    expect(isRegionalMarketScopedApiPath('/api/events')).toBe(true);
    expect(isRegionalMarketScopedApiPath('/api/events/upcoming')).toBe(true);
    expect(isRegionalMarketScopedApiPath('/api/partners')).toBe(true);
    expect(isRegionalMarketScopedApiPath('/api/partners/search')).toBe(true);
    expect(isRegionalMarketScopedApiPath('/api/trendings')).toBe(true);
    expect(isRegionalMarketScopedApiPath('/api/trendings/tags')).toBe(true);
  });

  it('returns false for user-centric APIs', () => {
    expect(isRegionalMarketScopedApiPath('/api/Users/me')).toBe(false);
    expect(isRegionalMarketScopedApiPath('/api/Messages')).toBe(false);
  });

  it('returns false for unrelated prefixes and empty input', () => {
    expect(isRegionalMarketScopedApiPath('/api/internal/users')).toBe(false);
    expect(isRegionalMarketScopedApiPath('')).toBe(false);
  });
});
