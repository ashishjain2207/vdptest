import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiPost = vi.fn();

vi.mock('./api/client.js', () => ({
  apiPost,
  apiGet: vi.fn(),
  apiPut: vi.fn(),
}));

describe('ensureProfile pending home country', () => {
  beforeEach(() => {
    vi.resetModules();
    apiPost.mockReset();
    sessionStorage.clear();
    localStorage.clear();
  });

  it('does not send stale pending home country for a different login email', async () => {
    sessionStorage.setItem('pendingHomeCountry', 'DE');
    sessionStorage.setItem('pendingHomeCountryEmail', 'signup@example.com');
    apiPost.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ userId: 'user-1' }),
    });

    const { ensureProfile } = await import('./profileService.js');
    await ensureProfile({ email: 'other@example.com' });

    expect(apiPost).toHaveBeenCalledWith(
      expect.stringContaining('/api/Users/me/ensure-profile'),
      { email: 'other@example.com' },
      expect.any(Object),
    );
  });

  it('sends pending home country only when it belongs to the login email', async () => {
    sessionStorage.setItem('pendingHomeCountry', 'DE');
    sessionStorage.setItem('pendingHomeCountryEmail', 'signup@example.com');
    apiPost.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ userId: 'user-1' }),
    });

    const { ensureProfile } = await import('./profileService.js');
    await ensureProfile({ email: 'SIGNUP@example.com' });

    expect(apiPost).toHaveBeenCalledWith(
      expect.stringContaining('/api/Users/me/ensure-profile'),
      { email: 'SIGNUP@example.com', homeCountryCode: 'DE' },
      expect.any(Object),
    );
  });

  it('uses locally persisted pending home country after email verification opens a new tab', async () => {
    localStorage.setItem('pendingHomeCountry', 'DE');
    localStorage.setItem('pendingHomeCountryEmail', 'signup@example.com');
    apiPost.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ userId: 'user-1' }),
    });

    const { ensureProfile } = await import('./profileService.js');
    await ensureProfile({ email: 'signup@example.com' });

    expect(apiPost).toHaveBeenCalledWith(
      expect.stringContaining('/api/Users/me/ensure-profile'),
      { email: 'signup@example.com', homeCountryCode: 'DE' },
      expect.any(Object),
    );
    expect(localStorage.getItem('pendingHomeCountry')).toBeNull();
    expect(localStorage.getItem('pendingHomeCountryEmail')).toBeNull();
  });

  it('does not mix pending country and email from different storage buckets', async () => {
    sessionStorage.setItem('pendingHomeCountryEmail', 'signup@example.com');
    localStorage.setItem('pendingHomeCountry', 'DE');
    localStorage.setItem('pendingHomeCountryEmail', 'other@example.com');
    apiPost.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ userId: 'user-1' }),
    });

    const { ensureProfile } = await import('./profileService.js');
    await ensureProfile({ email: 'signup@example.com' });

    expect(apiPost).toHaveBeenCalledWith(
      expect.stringContaining('/api/Users/me/ensure-profile'),
      { email: 'signup@example.com' },
      expect.any(Object),
    );
  });

  it('returns social signup country from the storage bucket that matched the oauth state', async () => {
    sessionStorage.setItem('pendingHomeCountry', 'IN');
    localStorage.setItem('pendingHomeCountry', 'DE');
    localStorage.setItem('pendingHomeCountrySocialSignup', '1');
    localStorage.setItem('pendingHomeCountrySocialSignupState', 'oauth-state');

    const { getPendingSocialSignupHomeCountry, hasPendingSocialSignupHomeCountry } = await import('./profileService.js');

    expect(getPendingSocialSignupHomeCountry('oauth-state')).toBe('DE');
    expect(hasPendingSocialSignupHomeCountry('oauth-state')).toBe(true);
  });

  it('continues when localStorage access is blocked', async () => {
    sessionStorage.setItem('pendingHomeCountry', 'DE');
    sessionStorage.setItem('pendingHomeCountryEmail', 'signup@example.com');
    apiPost.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ userId: 'user-1' }),
    });
    const localStorageSpy = vi.spyOn(globalThis, 'localStorage', 'get').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError');
    });

    try {
      const { ensureProfile } = await import('./profileService.js');
      await ensureProfile({ email: 'signup@example.com' });

      expect(apiPost).toHaveBeenCalledWith(
        expect.stringContaining('/api/Users/me/ensure-profile'),
        { email: 'signup@example.com', homeCountryCode: 'DE' },
        expect.any(Object),
      );
    } finally {
      localStorageSpy.mockRestore();
    }
  });

  it('sends pending home country for email-less social signup when explicitly opted in', async () => {
    sessionStorage.setItem('pendingHomeCountry', 'DE');
    sessionStorage.setItem('pendingHomeCountrySocialSignup', '1');
    apiPost.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ userId: 'user-1' }),
    });

    const { ensureProfile } = await import('./profileService.js');
    await ensureProfile({ email: 'social@example.com', usePendingHomeCountry: true });

    expect(apiPost).toHaveBeenCalledWith(
      expect.stringContaining('/api/Users/me/ensure-profile'),
      { email: 'social@example.com', homeCountryCode: 'DE' },
      expect.any(Object),
    );
  });

  it('detects social signup pending country only when the marker and country are present', async () => {
    const { hasPendingSocialSignupHomeCountry } = await import('./profileService.js');

    sessionStorage.setItem('pendingHomeCountry', 'DE');
    sessionStorage.setItem('pendingHomeCountrySocialSignupState', 'oauth-state');
    expect(hasPendingSocialSignupHomeCountry('oauth-state')).toBe(false);

    sessionStorage.setItem('pendingHomeCountrySocialSignup', '1');
    expect(hasPendingSocialSignupHomeCountry('oauth-state')).toBe(true);
    expect(hasPendingSocialSignupHomeCountry('other-state')).toBe(false);

    sessionStorage.removeItem('pendingHomeCountry');
    expect(hasPendingSocialSignupHomeCountry('oauth-state')).toBe(false);
  });
});
