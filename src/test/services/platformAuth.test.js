import { describe, it, expect } from 'vitest';
import {
  getPlatformAuthFromToken,
  getRolesFromAccessToken,
  PLATFORM_ADMIN_ROLE,
  PLATFORM_SUPPORT_ROLE,
} from '@/services/auth/authService';
import { mockJwt } from '@/test/utils/mockJwt';

describe('getPlatformAuthFromToken', () => {
  it('detects platform admin role', () => {
    const token = mockJwt({ role: PLATFORM_ADMIN_ROLE });
    const auth = getPlatformAuthFromToken(token);
    expect(auth.isPlatformAdmin).toBe(true);
    expect(auth.isPlatformSupport).toBe(false);
    expect(auth.isPlatformStaff).toBe(true);
    expect(auth.platformRoles).toContain(PLATFORM_ADMIN_ROLE);
  });

  it('detects platform support role', () => {
    const token = mockJwt({ role: PLATFORM_SUPPORT_ROLE });
    const auth = getPlatformAuthFromToken(token);
    expect(auth.isPlatformAdmin).toBe(false);
    expect(auth.isPlatformSupport).toBe(true);
    expect(auth.isPlatformStaff).toBe(true);
  });

  it('returns no staff flags for member without platform roles', () => {
    const token = mockJwt({ role: 'VdpConnect.Member' });
    const auth = getPlatformAuthFromToken(token);
    expect(auth.isPlatformAdmin).toBe(false);
    expect(auth.isPlatformSupport).toBe(false);
    expect(auth.isPlatformStaff).toBe(false);
  });

  it('reads roles array claim', () => {
    const token = mockJwt({
      roles: [PLATFORM_SUPPORT_ROLE, 'Partner.Member'],
    });
    expect(getRolesFromAccessToken(token)).toEqual(
      expect.arrayContaining([PLATFORM_SUPPORT_ROLE, 'Partner.Member']),
    );
    expect(getPlatformAuthFromToken(token).isPlatformSupport).toBe(true);
  });
});
