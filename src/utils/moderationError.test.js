import { describe, expect, it } from 'vitest';
import { getModerationErrorMessage, isModerationError } from './moderationError';

describe('moderationError helpers', () => {
  it('detects HTTP 422 errors', () => {
    expect(isModerationError({ status: 422 })).toBe(true);
    expect(isModerationError({ response: { status: 422 } })).toBe(true);
    expect(isModerationError({ status: 400 })).toBe(false);
  });

  it('uses safe backend messages and falls back for technical details', () => {
    const fallback = 'Please edit the content and try again.';

    expect(getModerationErrorMessage({ message: 'This content may violate platform rules.' }, fallback))
      .toBe('This content may violate platform rules.');
    expect(getModerationErrorMessage({ message: 'Azure severity category failed' }, fallback))
      .toBe(fallback);
    expect(getModerationErrorMessage({}, fallback)).toBe(fallback);
  });

  it('falls back for generic HTTP status text', () => {
    const fallback = 'Please edit the content and try again.';

    expect(getModerationErrorMessage({ status: 422, message: 'Unprocessable Entity' }, fallback))
      .toBe(fallback);
  });

  it('prefers parsed problem details over generic HTTP status text', () => {
    const fallback = 'Please edit the content and try again.';

    expect(getModerationErrorMessage({
      status: 422,
      message: 'Unprocessable Entity',
      response: {
        data: {
          detail: 'This message may violate platform rules.',
        },
      },
    }, fallback)).toBe('This message may violate platform rules.');
  });
});
