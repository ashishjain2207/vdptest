import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shouldBlockLoginDuringMaintenance } from './maintenanceLoginPolicy';

vi.mock('@/services/auth/authService', () => ({
  getPlatformAuthFromToken: vi.fn(() => ({
    isPlatformAdmin: false,
    isPlatformSupport: false,
    isPlatformStaff: false,
  })),
}));

import { getPlatformAuthFromToken } from '@/services/auth/authService';

describe('shouldBlockLoginDuringMaintenance', () => {
  beforeEach(() => {
    vi.mocked(getPlatformAuthFromToken).mockReturnValue({
      isPlatformAdmin: false,
      isPlatformSupport: false,
      isPlatformStaff: false,
      platformRoles: [],
    });
  });

  it('does not block when maintenance is off', () => {
    expect(shouldBlockLoginDuringMaintenance(false, 'token')).toBe(false);
    expect(shouldBlockLoginDuringMaintenance(null, 'token')).toBe(false);
  });

  it('blocks non-staff during maintenance', () => {
    expect(shouldBlockLoginDuringMaintenance(true, 'token')).toBe(true);
  });

  it('allows platform admin during maintenance', () => {
    vi.mocked(getPlatformAuthFromToken).mockReturnValue({
      isPlatformAdmin: true,
      isPlatformSupport: false,
      isPlatformStaff: true,
      platformRoles: ['VdpConnect.Admin'],
    });
    expect(shouldBlockLoginDuringMaintenance(true, 'token')).toBe(false);
  });

  it('allows platform support during maintenance', () => {
    vi.mocked(getPlatformAuthFromToken).mockReturnValue({
      isPlatformAdmin: false,
      isPlatformSupport: true,
      isPlatformStaff: true,
      platformRoles: ['VdpConnect.Support'],
    });
    expect(shouldBlockLoginDuringMaintenance(true, 'token')).toBe(false);
  });
});
