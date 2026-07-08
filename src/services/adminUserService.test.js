import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  searchAdminUsers,
  getAssignablePlatformRoles,
  suspendAdminUser,
  unsuspendAdminUser,
  setAdminUserPlatformRole,
} from './adminUserService';

vi.mock('./api/client.js', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
}));

import { apiGet, apiPost, apiPut } from './api/client.js';

describe('adminUserService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('searchAdminUsers builds query params', async () => {
    apiGet.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [], page: 1, pageSize: 20, totalPages: 0 }),
    });

    await searchAdminUsers('navya', 2, 10, { excludePlatformAdmins: true });

    const url = String(apiGet.mock.calls[0][0]);
    expect(url).toContain('/api/admin/users?');
    expect(url).toContain('q=navya');
    expect(url).toContain('page=2');
    expect(url).toContain('pageSize=10');
    expect(url).toContain('excludePlatformAdmins=true');
    expect(apiGet).toHaveBeenCalledWith(url, { showLoader: false });
  });

  it('getAssignablePlatformRoles returns json on success', async () => {
    apiGet.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ name: 'VdpConnect.Member', label: 'Member' }],
    });

    const roles = await getAssignablePlatformRoles();
    expect(roles).toHaveLength(1);
  });

  it('suspendAdminUser throws with message on failure', async () => {
    apiPost.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: 'User not found' }),
    });

    await expect(suspendAdminUser('u1')).rejects.toThrow('User not found');
  });

  it('unsuspendAdminUser succeeds on 204', async () => {
    apiPost.mockResolvedValueOnce({ ok: true, status: 204 });
    await expect(unsuspendAdminUser('u1')).resolves.toBeUndefined();
  });

  it('setAdminUserPlatformRole sends role body', async () => {
    apiPut.mockResolvedValueOnce({ ok: true, status: 204 });

    await setAdminUserPlatformRole('u1', 'VdpConnect.Support');

    expect(apiPut).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/users/u1/platform-role'),
      { roleName: 'VdpConnect.Support' },
      { showLoader: false },
    );
  });
});
