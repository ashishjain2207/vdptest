import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAdminPlatformSettings, updateAdminPlatformSettings } from './adminPlatformSettingsService';

vi.mock('./api/client.js', () => ({
  apiGet: vi.fn(),
  apiPut: vi.fn(),
}));

import { apiGet, apiPut } from './api/client.js';

describe('adminPlatformSettingsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getAdminPlatformSettings fetches settings', async () => {
    apiGet.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        maintenanceMode: false,
        supportEmail: 'support@test.com',
        adminNotificationEmail: 'admin@test.com',
      }),
    });

    const data = await getAdminPlatformSettings();
    expect(data.supportEmail).toBe('support@test.com');
    expect(apiGet).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/platform-settings'),
      { showLoader: false },
    );
  });

  it('updateAdminPlatformSettings sends body', async () => {
    apiPut.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        maintenanceMode: true,
        supportEmail: 'a@b.com',
        adminNotificationEmail: 'c@d.com',
      }),
    });

    const body = {
      maintenanceMode: true,
      supportEmail: 'a@b.com',
      adminNotificationEmail: 'c@d.com',
    };
    const result = await updateAdminPlatformSettings(body);
    expect(result.maintenanceMode).toBe(true);
    expect(apiPut).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/platform-settings'),
      body,
      { showLoader: false },
    );
  });
});
