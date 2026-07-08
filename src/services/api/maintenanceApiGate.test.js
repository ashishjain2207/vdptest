import { beforeEach, describe, expect, it } from 'vitest';
import { isMaintenanceApiBlocked, setPublicMaintenanceMode } from './maintenanceApiGate.js';

function makeJwt(payload) {
  const enc = (obj) =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  return `${enc({ alg: 'none', typ: 'JWT' })}.${enc(payload)}.sig`;
}

describe('maintenanceApiGate', () => {
  beforeEach(() => {
    setPublicMaintenanceMode(null);
  });

  it('allows platform admin when a fresh token is supplied after refresh', () => {
    setPublicMaintenanceMode(true);

    const token = makeJwt({
      sub: 'admin-user',
      role: 'VdpConnect.Admin',
    });

    expect(isMaintenanceApiBlocked(token)).toBe(false);
  });

  it('allows platform support staff during maintenance', () => {
    setPublicMaintenanceMode(true);

    const token = makeJwt({
      sub: 'support-user',
      role: 'VdpConnect.Support',
    });

    expect(isMaintenanceApiBlocked(token)).toBe(false);
  });

  it('blocks when maintenance is on and no staff token is available', () => {
    setPublicMaintenanceMode(true);

    expect(isMaintenanceApiBlocked(null)).toBe(true);
  });

  it('allows public registration calls without a token during maintenance', () => {
    setPublicMaintenanceMode(true);

    expect(isMaintenanceApiBlocked(null, '/api-identity/api/register')).toBe(false);
    expect(isMaintenanceApiBlocked(null, 'https://auth.example.com/api/register')).toBe(false);
  });

  it('allows public support inquiry submission without a token during maintenance', () => {
    setPublicMaintenanceMode(true);

    expect(isMaintenanceApiBlocked(null, '/api/public/support-inquiries')).toBe(false);
    expect(
      isMaintenanceApiBlocked(null, 'https://api.example.com/api/public/support-inquiries'),
    ).toBe(false);
  });
});
