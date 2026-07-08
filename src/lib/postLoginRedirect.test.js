import { describe, it, expect, vi, beforeEach } from 'vitest';
import { maintenanceModeForPostLoginRedirect, resolvePostLoginRedirect } from './postLoginRedirect';

vi.mock('@/services/auth/authService', () => ({
  getAccessToken: vi.fn(() => 'token'),
  getPlatformAuthFromToken: vi.fn(() => ({
    isPlatformAdmin: false,
    isPlatformSupport: false,
    isPlatformStaff: false,
  })),
}));

import { getPlatformAuthFromToken } from '@/services/auth/authService';

describe('resolvePostLoginRedirect', () => {
  beforeEach(() => {
    vi.mocked(getPlatformAuthFromToken).mockReturnValue({ isPlatformAdmin: false, platformRoles: [] });
  });

  it('returns intended path when maintenance is off', () => {
    expect(
      resolvePostLoginRedirect({ maintenanceMode: false, accessToken: 't', intendedPath: '/posts' }),
    ).toBe('/posts');
  });

  it('returns /maintenance for non-staff when maintenance is on', () => {
    expect(
      resolvePostLoginRedirect({ maintenanceMode: true, accessToken: 't', intendedPath: '/posts' }),
    ).toBe('/maintenance');
  });

  it('returns support inbox for support-only user during maintenance', () => {
    vi.mocked(getPlatformAuthFromToken).mockReturnValue({
      isPlatformAdmin: false,
      isPlatformSupport: true,
      isPlatformStaff: true,
      platformRoles: ['VdpConnect.Support'],
    });
    expect(
      resolvePostLoginRedirect({ maintenanceMode: true, accessToken: 't', intendedPath: '/posts' }),
    ).toBe('/support/inbox');
  });

  it('returns intended path for support user during maintenance when not default home', () => {
    vi.mocked(getPlatformAuthFromToken).mockReturnValue({
      isPlatformAdmin: false,
      isPlatformSupport: true,
      isPlatformStaff: true,
      platformRoles: ['VdpConnect.Support'],
    });
    expect(
      resolvePostLoginRedirect({ maintenanceMode: true, accessToken: 't', intendedPath: '/support/inbox' }),
    ).toBe('/support/inbox');
  });

  it('returns intended path for platform admin during maintenance', () => {
    vi.mocked(getPlatformAuthFromToken).mockReturnValue({
      isPlatformAdmin: true,
      isPlatformSupport: false,
      isPlatformStaff: true,
      platformRoles: ['VdpConnect.Admin'],
    });
    expect(
      resolvePostLoginRedirect({ maintenanceMode: true, accessToken: 't', intendedPath: '/admin' }),
    ).toBe('/admin');
  });

  it('returns support inbox for support-only user after login', () => {
    vi.mocked(getPlatformAuthFromToken).mockReturnValue({
      isPlatformAdmin: false,
      isPlatformSupport: true,
      isPlatformStaff: true,
      platformRoles: ['VdpConnect.Support'],
    });
    expect(
      resolvePostLoginRedirect({ maintenanceMode: false, accessToken: 't', intendedPath: '/posts' }),
    ).toBe('/support/inbox');
  });

  it('does not override intended path for support user when not default home', () => {
    vi.mocked(getPlatformAuthFromToken).mockReturnValue({
      isPlatformAdmin: false,
      isPlatformSupport: true,
      isPlatformStaff: true,
      platformRoles: ['VdpConnect.Support'],
    });
    expect(
      resolvePostLoginRedirect({ maintenanceMode: false, accessToken: 't', intendedPath: '/people' }),
    ).toBe('/people');
  });

  it('redirects to onboarding when home country is missing', () => {
    expect(
      resolvePostLoginRedirect({
        maintenanceMode: false,
        accessToken: 't',
        intendedPath: '/messages',
        hasHomeCountry: false,
      }),
    ).toBe('/onboarding?returnUrl=%2Fmessages');
  });

  it('skips onboarding redirect for platform staff without home country', () => {
    vi.mocked(getPlatformAuthFromToken).mockReturnValue({
      isPlatformAdmin: true,
      isPlatformSupport: false,
      isPlatformStaff: true,
      platformRoles: ['VdpConnect.Admin'],
    });
    expect(
      resolvePostLoginRedirect({
        maintenanceMode: false,
        accessToken: 't',
        intendedPath: '/posts',
        hasHomeCountry: false,
      }),
    ).toBe('/posts');
  });
});

describe('maintenanceModeForPostLoginRedirect', () => {
  it('returns cached value when already loaded', async () => {
    const refresh = vi.fn();
    await expect(maintenanceModeForPostLoginRedirect(true, refresh)).resolves.toBe(true);
    expect(refresh).not.toHaveBeenCalled();
  });

  it('calls refresh when status is still null', async () => {
    const refresh = vi.fn().mockResolvedValue(false);
    await expect(maintenanceModeForPostLoginRedirect(null, refresh)).resolves.toBe(false);
    expect(refresh).toHaveBeenCalledOnce();
  });
});
