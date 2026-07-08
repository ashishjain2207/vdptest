import { describe, expect, it } from 'vitest';
import { sanitizeAdTargetUrl } from './PlatformAdCard.jsx';

describe('sanitizeAdTargetUrl', () => {
  it('allows absolute http and https URLs', () => {
    expect(sanitizeAdTargetUrl('https://example.com/path?q=1')).toBe('https://example.com/path?q=1');
    expect(sanitizeAdTargetUrl('http://example.com/')).toBe('http://example.com/');
  });

  it('rejects non-http schemes', () => {
    expect(sanitizeAdTargetUrl('javascript:alert(1)')).toBe('');
    expect(sanitizeAdTargetUrl('data:text/html,<h1>x</h1>')).toBe('');
    expect(sanitizeAdTargetUrl('mailto:sales@example.com')).toBe('');
  });

  it('rejects relative or empty values', () => {
    expect(sanitizeAdTargetUrl('/promo')).toBe('');
    expect(sanitizeAdTargetUrl('')).toBe('');
    expect(sanitizeAdTargetUrl(null)).toBe('');
  });
});
