import { describe, expect, it } from 'vitest';
import { buildSanitizedPageViewTelemetry } from './pageViewTelemetry.js';

describe('buildSanitizedPageViewTelemetry', () => {
  it('strips query and hash on OAuth callback routes', () => {
    const result = buildSanitizedPageViewTelemetry({
      origin: 'https://app.example.com',
      pathname: '/callback',
      search: '?code=secret-code&state=csrf-state',
      hash: '#access_token=leak',
      title: 'Signing in',
    });

    expect(result.uri).toBe('https://app.example.com/callback');
    expect(result.name).toBe('Signing in');
  });

  it('strips reset-password and verify-email tokens from telemetry', () => {
    expect(
      buildSanitizedPageViewTelemetry({
        origin: 'https://app.example.com',
        pathname: '/reset-password',
        search: '?token=reset-token&userId=user-123',
      }).uri,
    ).toBe('https://app.example.com/reset-password');

    expect(
      buildSanitizedPageViewTelemetry({
        origin: 'https://app.example.com',
        pathname: '/verify-email',
        search: '?token=verify-token&userId=user-456',
      }).uri,
    ).toBe('https://app.example.com/verify-email');
  });

  it('redacts sensitive params on other routes but keeps safe params', () => {
    const result = buildSanitizedPageViewTelemetry({
      origin: 'https://app.example.com',
      pathname: '/login',
      search: '?returnUrl=/posts&passwordReset=1&token=should-not-leak',
    });

    expect(result.uri).toBe(
      'https://app.example.com/login?returnUrl=%2Fposts&passwordReset=1&token=%5BRedacted%5D',
    );
  });

  it('never includes hash fragments in telemetry URIs', () => {
    const result = buildSanitizedPageViewTelemetry({
      origin: 'https://app.example.com',
      pathname: '/posts',
      search: '?tab=feed',
      hash: '#access_token=leak',
    });

    expect(result.uri).toBe('https://app.example.com/posts?tab=feed');
    expect(result.uri).not.toContain('#');
  });

  it('falls back to pathname when document title is empty', () => {
    const result = buildSanitizedPageViewTelemetry({
      origin: 'https://app.example.com',
      pathname: '/explore',
      search: '?page=2',
      title: '   ',
    });

    expect(result.name).toBe('/explore?page=2');
  });
});
