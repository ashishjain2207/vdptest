import { describe, it, expect } from 'vitest';
import { toUserFacingRequestError } from '@/lib/networkErrorMessage';

describe('toUserFacingRequestError', () => {
  it('maps Failed to fetch to an upload hint', () => {
    const e = toUserFacingRequestError(new TypeError('Failed to fetch'), { upload: true });
    expect(e.message).toMatch(/maximum upload size|connection/i);
  });

  it('passes through AbortError', () => {
    const abort = new Error('Aborted');
    abort.name = 'AbortError';
    expect(toUserFacingRequestError(abort)).toBe(abort);
  });
});
