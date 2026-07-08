import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  shouldRefreshFeedOnAdminScopeChange,
  subscribeAdminScopeFeedRefresh,
} from '@/lib/platformAdminFeedScopeRefresh.js';

const getAccessToken = vi.fn();
const getPlatformAuthFromToken = vi.fn();

vi.mock('@/services/auth/authService.js', () => ({
  getAccessToken: () => getAccessToken(),
  getPlatformAuthFromToken: (token) => getPlatformAuthFromToken(token),
}));

describe('platformAdminFeedScopeRefresh', () => {
  beforeEach(() => {
    getAccessToken.mockReset();
    getPlatformAuthFromToken.mockReset();
  });

  it('shouldRefreshFeedOnAdminScopeChange is true for platform admin with token', () => {
    getAccessToken.mockReturnValue('token');
    getPlatformAuthFromToken.mockReturnValue({ isPlatformAdmin: true });
    expect(shouldRefreshFeedOnAdminScopeChange()).toBe(true);
  });

  it('shouldRefreshFeedOnAdminScopeChange is false without token or staff role', () => {
    getAccessToken.mockReturnValue(null);
    expect(shouldRefreshFeedOnAdminScopeChange()).toBe(false);

    getAccessToken.mockReturnValue('token');
    getPlatformAuthFromToken.mockReturnValue({ isPlatformAdmin: false, isPlatformSupport: false });
    expect(shouldRefreshFeedOnAdminScopeChange()).toBe(false);
  });

  it('shouldRefreshFeedOnAdminScopeChange is true for platform support', () => {
    getAccessToken.mockReturnValue('token');
    getPlatformAuthFromToken.mockReturnValue({ isPlatformAdmin: false, isPlatformSupport: true });
    expect(shouldRefreshFeedOnAdminScopeChange()).toBe(true);
  });

  it('subscribeAdminScopeFeedRefresh invokes callback for platform admin', () => {
    getAccessToken.mockReturnValue('token');
    getPlatformAuthFromToken.mockReturnValue({ isPlatformAdmin: true });
    const onRefresh = vi.fn();
    const unsubscribe = subscribeAdminScopeFeedRefresh(onRefresh);

    window.dispatchEvent(new CustomEvent('imriva-admin-scope-country-changed', { detail: 'DE' }));
    expect(onRefresh).toHaveBeenCalledTimes(1);

    unsubscribe();
    window.dispatchEvent(new CustomEvent('imriva-admin-scope-country-changed', { detail: 'US' }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('subscribeAdminScopeFeedRefresh invokes callback for platform support', () => {
    getAccessToken.mockReturnValue('token');
    getPlatformAuthFromToken.mockReturnValue({ isPlatformAdmin: false, isPlatformSupport: true });
    const onRefresh = vi.fn();
    subscribeAdminScopeFeedRefresh(onRefresh);

    window.dispatchEvent(new CustomEvent('imriva-admin-scope-country-changed', { detail: 'DE' }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('subscribeAdminScopeFeedRefresh ignores events for non-staff', () => {
    getAccessToken.mockReturnValue('token');
    getPlatformAuthFromToken.mockReturnValue({ isPlatformAdmin: false });
    const onRefresh = vi.fn();
    subscribeAdminScopeFeedRefresh(onRefresh);

    window.dispatchEvent(new CustomEvent('imriva-admin-scope-country-changed', { detail: 'DE' }));
    expect(onRefresh).not.toHaveBeenCalled();
  });
});
