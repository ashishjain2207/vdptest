import { describe, expect, it } from 'vitest';
import { normalizeAdminUserStatus, platformRoleLabel } from './adminUserDisplay';

describe('normalizeAdminUserStatus', () => {
  it('maps numeric and string suspended values', () => {
    expect(normalizeAdminUserStatus(1)).toBe('Suspended');
    expect(normalizeAdminUserStatus('Suspended')).toBe('Suspended');
  });

  it('maps numeric and string pending values', () => {
    expect(normalizeAdminUserStatus(2)).toBe('Pending');
    expect(normalizeAdminUserStatus('pending')).toBe('Pending');
  });

  it('defaults to active', () => {
    expect(normalizeAdminUserStatus(0)).toBe('Active');
    expect(normalizeAdminUserStatus('Active')).toBe('Active');
    expect(normalizeAdminUserStatus(null)).toBe('Active');
  });
});

describe('platformRoleLabel', () => {
  it('localizes known roles in EN', () => {
    expect(platformRoleLabel('VdpConnect.Admin', 'EN')).toBe('Platform admin');
    expect(platformRoleLabel('VdpConnect.Member', 'EN')).toBe('Member');
  });

  it('localizes known roles in DE', () => {
    expect(platformRoleLabel('VdpConnect.Admin', 'DE')).toBe('Plattform-Admin');
    expect(platformRoleLabel('VdpConnect.Support', 'DE')).toBe('Unterstützung');
  });

  it('maps deprecated platform roles to Member labels', () => {
    expect(platformRoleLabel('VdpConnect.Moderator', 'EN')).toBe('Member');
    expect(platformRoleLabel('VdpConnect.ContentCreator', 'DE')).toBe('Mitglied');
  });
});
