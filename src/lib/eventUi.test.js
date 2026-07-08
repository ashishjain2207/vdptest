import { describe, it, expect } from 'vitest';
import { sanitizeUrlForNewTab } from './eventUi.js';

describe('sanitizeUrlForNewTab', () => {
  it('allows http and https', () => {
    expect(sanitizeUrlForNewTab('https://example.com/x')).toBe('https://example.com/x');
    expect(sanitizeUrlForNewTab('http://example.com/')).toBe('http://example.com/');
  });

  it('rejects javascript: and data:', () => {
    expect(sanitizeUrlForNewTab('javascript:alert(1)')).toBe('');
    expect(sanitizeUrlForNewTab('data:text/html,hi')).toBe('');
  });

  it('rejects empty and invalid', () => {
    expect(sanitizeUrlForNewTab('')).toBe('');
    expect(sanitizeUrlForNewTab('   ')).toBe('');
    expect(sanitizeUrlForNewTab(null)).toBe('');
  });
});
