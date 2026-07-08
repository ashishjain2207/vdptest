import { beforeEach, describe, expect, it, vi } from 'vitest';

const ensureAccessToken = vi.fn();
const getAccessToken = vi.fn();
const refreshToken = vi.fn();
const getPlatformAuthFromToken = vi.fn();
const getHomeCountryCode = vi.fn();
const getAdminScopeCountryCode = vi.fn();
const isMaintenanceApiBlocked = vi.fn();

vi.mock('../auth/authService.js', () => ({
  ensureAccessToken,
  getAccessToken,
  getPlatformAuthFromToken,
  refreshToken,
}));

vi.mock('@/lib/activeCountry.js', () => ({
  getHomeCountryCode,
}));

vi.mock('@/lib/adminScopeCountry.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getAdminScopeCountryCode,
  };
});

vi.mock('./maintenanceApiGate.js', () => ({
  isMaintenanceApiBlocked,
}));

describe('apiRequest country scope header', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    ensureAccessToken.mockResolvedValue('some-token');
    getHomeCountryCode.mockReturnValue('US');
    isMaintenanceApiBlocked.mockReturnValue(false);
    global.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
  });

  it('platform admin with preview uses admin scope on /api/admin/*', async () => {
    getPlatformAuthFromToken.mockReturnValue({ isPlatformAdmin: true });
    getAdminScopeCountryCode.mockReturnValue('DE');
    const { apiRequest } = await import('./client.js');

    await apiRequest('/api/admin/events', { showLoader: false });

    const headers = global.fetch.mock.calls[0][1].headers;
    expect(headers.get('X-Country-Code')).toBe('DE');
  });

  it('platform admin with preview uses admin scope on regional consumer APIs', async () => {
    getPlatformAuthFromToken.mockReturnValue({ isPlatformAdmin: true });
    getAdminScopeCountryCode.mockReturnValue('DE');
    const { apiRequest } = await import('./client.js');

    await apiRequest('/api/Posts/feed?page=1', { showLoader: false });

    const headers = global.fetch.mock.calls[0][1].headers;
    expect(headers.get('X-Country-Code')).toBe('DE');
  });

  it('platform admin without preview omits X-Country-Code on regional APIs (all markets)', async () => {
    getPlatformAuthFromToken.mockReturnValue({ isPlatformAdmin: true, isPlatformStaff: true });
    getAdminScopeCountryCode.mockReturnValue(null);
    getHomeCountryCode.mockReturnValue('US');
    const { apiRequest } = await import('./client.js');

    await apiRequest('/api/Posts/feed?page=1', { showLoader: false });

    const headers = global.fetch.mock.calls[0][1].headers;
    expect(headers.get('X-Country-Code')).toBeNull();
  });

  it('platform admin without preview omits X-Country-Code on /api/admin/*', async () => {
    getPlatformAuthFromToken.mockReturnValue({ isPlatformAdmin: true });
    getAdminScopeCountryCode.mockReturnValue(null);
    const { apiRequest } = await import('./client.js');

    await apiRequest('/api/admin/events', { showLoader: false });

    const headers = global.fetch.mock.calls[0][1].headers;
    expect(headers.get('X-Country-Code')).toBeNull();
  });

  it('platform admin with preview still uses home country on non-regional APIs', async () => {
    getPlatformAuthFromToken.mockReturnValue({ isPlatformAdmin: true });
    getAdminScopeCountryCode.mockReturnValue('DE');
    const { apiRequest } = await import('./client.js');

    await apiRequest('/api/Users/me', { showLoader: false });

    const headers = global.fetch.mock.calls[0][1].headers;
    expect(headers.get('X-Country-Code')).toBe('US');
  });

  it('non–platform admin uses home country on regional APIs', async () => {
    getPlatformAuthFromToken.mockReturnValue({ isPlatformAdmin: false, isPlatformSupport: false });
    getAdminScopeCountryCode.mockReturnValue('DE');
    const { apiRequest } = await import('./client.js');

    await apiRequest('/api/Posts/feed?page=1', { showLoader: false });

    const headers = global.fetch.mock.calls[0][1].headers;
    expect(headers.get('X-Country-Code')).toBe('US');
  });

  it('platform support uses country scope on regional consumer APIs', async () => {
    getPlatformAuthFromToken.mockReturnValue({
      isPlatformAdmin: false,
      isPlatformSupport: true,
      isPlatformStaff: true,
    });
    getAdminScopeCountryCode.mockReturnValue('DE');
    const { apiRequest } = await import('./client.js');

    await apiRequest('/api/Posts/feed?page=1', { showLoader: false });

    const headers = global.fetch.mock.calls[0][1].headers;
    expect(headers.get('X-Country-Code')).toBe('DE');
  });

  it('platform support without scope omits X-Country-Code on regional APIs (all markets)', async () => {
    getPlatformAuthFromToken.mockReturnValue({
      isPlatformAdmin: false,
      isPlatformSupport: true,
      isPlatformStaff: true,
    });
    getAdminScopeCountryCode.mockReturnValue(null);
    const { apiRequest } = await import('./client.js');

    await apiRequest('/api/Posts/feed?page=1', { showLoader: false });

    const headers = global.fetch.mock.calls[0][1].headers;
    expect(headers.get('X-Country-Code')).toBeNull();
  });

  it('platform support uses country scope on admin read APIs', async () => {
    getPlatformAuthFromToken.mockReturnValue({
      isPlatformAdmin: false,
      isPlatformSupport: true,
      isPlatformStaff: true,
    });
    getAdminScopeCountryCode.mockReturnValue('FR');
    const { apiRequest } = await import('./client.js');

    await apiRequest('/api/admin/support-inquiries', { showLoader: false });

    const headers = global.fetch.mock.calls[0][1].headers;
    expect(headers.get('X-Country-Code')).toBe('FR');
  });

  it('throws when regional API called without home country for member', async () => {
    getPlatformAuthFromToken.mockReturnValue({ isPlatformAdmin: false, isPlatformStaff: false });
    getHomeCountryCode.mockReturnValue(null);
    const { apiRequest, HomeCountryRequiredError } = await import('./client.js');

    await expect(
      apiRequest('/api/posts/feed?page=1', { showLoader: false }),
    ).rejects.toBeInstanceOf(HomeCountryRequiredError);
  });

  it('without token uses home country on regional /api/comments paths', async () => {
    ensureAccessToken.mockResolvedValue(null);
    getPlatformAuthFromToken.mockReturnValue({ isPlatformAdmin: false });
    const { apiRequest } = await import('./client.js');

    await apiRequest('/api/comments/post-id?page=1', { showLoader: false });

    const headers = global.fetch.mock.calls[0][1].headers;
    expect(headers.get('X-Country-Code')).toBe('US');
  });
});
