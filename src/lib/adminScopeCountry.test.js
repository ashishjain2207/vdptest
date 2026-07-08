import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ADMIN_SCOPE_COUNTRY_STORAGE_KEY,
  getAdminScopeCountryCode,
  resolvePlatformAdminRegionalCountryCode,
  resolvePlatformSupportRegionalCountryCode,
  resolvePlatformStaffRegionalCountryCode,
  setAdminScopeCountryCode,
} from '@/lib/adminScopeCountry.js';

vi.mock('@/lib/activeCountry.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getHomeCountryCode: vi.fn(() => 'US'),
  };
});

describe('adminScopeCountry', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('reads and writes scoped country in localStorage', () => {
    expect(getAdminScopeCountryCode()).toBeNull();
    localStorage.setItem('imriva.vdp.homeCountry', 'US');
    setAdminScopeCountryCode('DE');
    expect(getAdminScopeCountryCode()).toBe('DE');
    expect(localStorage.getItem(ADMIN_SCOPE_COUNTRY_STORAGE_KEY)).toBe('DE');
    expect(localStorage.getItem('imriva.vdp.homeCountry')).toBe('US');
  });

  it('clears scope when set to empty', () => {
    setAdminScopeCountryCode('US');
    setAdminScopeCountryCode(null);
    expect(getAdminScopeCountryCode()).toBeNull();
    expect(localStorage.getItem(ADMIN_SCOPE_COUNTRY_STORAGE_KEY)).toBeNull();
  });

  it('dispatches imriva-admin-scope-country-changed on update', () => {
    const handler = vi.fn();
    window.addEventListener('imriva-admin-scope-country-changed', handler);
    setAdminScopeCountryCode('FR');
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail).toBe('FR');
    window.removeEventListener('imriva-admin-scope-country-changed', handler);
  });

  it('resolvePlatformAdminRegionalCountryCode uses scope only', () => {
    expect(resolvePlatformAdminRegionalCountryCode()).toBeNull();
    setAdminScopeCountryCode('DE');
    expect(resolvePlatformAdminRegionalCountryCode()).toBe('DE');
  });

  it('resolvePlatformSupportRegionalCountryCode uses scope only', () => {
    expect(resolvePlatformSupportRegionalCountryCode()).toBeNull();
    setAdminScopeCountryCode('FR');
    expect(resolvePlatformSupportRegionalCountryCode()).toBe('FR');
  });

  it('resolvePlatformStaffRegionalCountryCode routes by role', () => {
    setAdminScopeCountryCode('DE');
    expect(resolvePlatformStaffRegionalCountryCode({ isPlatformAdmin: true })).toBe('DE');
    expect(resolvePlatformStaffRegionalCountryCode({ isPlatformSupport: true })).toBe('DE');
    setAdminScopeCountryCode(null);
    expect(resolvePlatformStaffRegionalCountryCode({ isPlatformSupport: true })).toBeNull();
    expect(resolvePlatformStaffRegionalCountryCode({ isPlatformAdmin: true })).toBeNull();
  });
});
