import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchPublicMaintenanceStatus } from './maintenanceStatusService.js';

describe('fetchPublicMaintenanceStatus', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('returns the public maintenance flag on success', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ maintenanceMode: true }),
    });

    await expect(fetchPublicMaintenanceStatus()).resolves.toBe(true);
  });

  it('throws on HTTP failure so callers keep fail-closed behavior', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
    });

    await expect(fetchPublicMaintenanceStatus()).rejects.toThrow('Maintenance status request failed (503)');
  });
});
