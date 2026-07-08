import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loginWithPassword, getAccessToken, logout, resolveHasPasswordFromUserInfo } from '@/services/auth/authService';

describe('authService', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loginWithPassword', () => {
    it('successfully logs in with valid credentials', async () => {
      const mockTokens = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokens,
      });

      const result = await loginWithPassword('test@example.com', 'password123');

      expect(result.error).toBeUndefined();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/connect/token'),
        expect.objectContaining({
          method: 'POST',
          body: expect.any(String),
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }),
      );
    });

    it('returns error on invalid credentials', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          error: 'invalid_grant',
          error_description: 'Invalid username or password',
        }),
        text: () => Promise.resolve('Invalid username or password'),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await loginWithPassword('test@example.com', 'wrongpassword');

      expect(result.error).toBe('invalid_grant');
      expect(result.errorDescription).toBe('Invalid username or password');
    });

    it('handles network errors', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      const result = await loginWithPassword('test@example.com', 'password123');
      expect(result.error).toBeDefined();
      expect(result.errorDescription).toBeDefined();
    });
  });

  describe('getAccessToken', () => {
    it('returns null when no token is stored', () => {
      const token = getAccessToken();
      expect(token).toBeNull();
    });

    it('returns token from sessionStorage (canonical key)', () => {
      sessionStorage.setItem('vdpconnect_tokens', JSON.stringify({ access_token: 'test-token', obtained_at: Date.now(), expires_in: 3600 }));
      const token = getAccessToken();
      expect(token).toBe('test-token');
    });

    it('returns token from localStorage when sessionStorage has expired legacy key', () => {
      const expiredAt = Date.now() - 7200_000;
      sessionStorage.setItem('oidc_tokens', JSON.stringify({
        access_token: 'stale-token',
        obtained_at: expiredAt,
        expires_in: 3600,
      }));
      localStorage.setItem('vdpconnect_tokens', JSON.stringify({
        access_token: 'fresh-token',
        obtained_at: Date.now(),
        expires_in: 3600,
      }));
      expect(getAccessToken()).toBe('fresh-token');
    });

    it('returns token from localStorage', () => {
      localStorage.setItem('vdpconnect_tokens', JSON.stringify({ access_token: 'local-token' }));
      const token = getAccessToken();
      expect(token).toBe('local-token');
    });
  });

  describe('logout', () => {
    it('clears tokens from storage', () => {
      sessionStorage.setItem('oidc_tokens', JSON.stringify({ access_token: 'test' }));
      localStorage.setItem('vdpconnect_tokens', 'test');

      logout();

      expect(sessionStorage.getItem('oidc_tokens')).toBeNull();
      expect(localStorage.getItem('vdpconnect_tokens')).toBeNull();
    });
  });

  describe('resolveHasPasswordFromUserInfo', () => {
    it('defaults to password-capable when has_password is omitted', () => {
      expect(resolveHasPasswordFromUserInfo({ email: 'a@b.com' })).toBe(true);
    });

    it('returns false only when has_password is explicitly false', () => {
      expect(resolveHasPasswordFromUserInfo({ has_password: false })).toBe(false);
      expect(resolveHasPasswordFromUserInfo({ hasPassword: false })).toBe(false);
    });

    it('returns null when userinfo is missing', () => {
      expect(resolveHasPasswordFromUserInfo(null)).toBeNull();
    });
  });
});
