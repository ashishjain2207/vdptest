import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../utils/test-utils';
import AdminUsers from '@/pages/AdminUsers';

vi.mock('@/services/adminUserService', () => ({
  searchAdminUsers: vi.fn(),
  getAssignablePlatformRoles: vi.fn(),
  suspendAdminUser: vi.fn(),
  unsuspendAdminUser: vi.fn(),
  setAdminUserPlatformRole: vi.fn(),
}));

vi.mock('@/contexts/AdminScopeCountryContext', () => ({
  useAdminScopeCountry: () => ({ country: null }),
}));

const endInitialFetchMock = vi.fn();

vi.mock('@/hooks/useRefreshOnlyFullPageLoader', () => ({
  useRefreshOnlyFullPageLoader: () => ({
    showRefreshLoader: false,
    endInitialFetch: endInitialFetchMock,
  }),
}));

const platformAccessRef = { isPlatformAdmin: true };

vi.mock('@/lib/platformAuth', () => ({
  usePlatformAccess: () => ({
    isPlatformAdmin: platformAccessRef.isPlatformAdmin,
    isPlatformSupport: !platformAccessRef.isPlatformAdmin,
    isPlatformStaff: true,
    isSupportOnly: !platformAccessRef.isPlatformAdmin,
    isReadOnlyAdmin: !platformAccessRef.isPlatformAdmin,
  }),
}));

import {
  searchAdminUsers,
  getAssignablePlatformRoles,
} from '@/services/adminUserService';

describe('AdminUsers page', () => {
  beforeEach(() => {
    platformAccessRef.isPlatformAdmin = true;
    vi.clearAllMocks();
    endInitialFetchMock.mockClear();
    getAssignablePlatformRoles.mockResolvedValue([
      { name: 'VdpConnect.Member', label: 'Member' },
    ]);
    searchAdminUsers.mockResolvedValue({
      data: [
        {
          userId: 'u1',
          displayName: 'Test User',
          handle: 'testuser',
          status: 'Active',
          platformRole: 'VdpConnect.Member',
          postsCount: 3,
          lastActivityAt: '2026-01-01T00:00:00Z',
        },
      ],
      totalPages: 1,
    });
  });

  it('renders heading and user row from admin API', async () => {
    renderWithProviders(<AdminUsers />, { route: '/admin/users' });

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    expect(screen.getByText('@testuser')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(searchAdminUsers).toHaveBeenCalled();
  });

  it('passes excludePlatformAdmins when checkbox checked', async () => {
    renderWithProviders(<AdminUsers />, { route: '/admin/users' });

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    const checkbox = screen.getByRole('checkbox', { name: /hide administrators|administratoren ausblenden/i });
    fireEvent.click(checkbox);

    await waitFor(
      () => {
        expect(searchAdminUsers).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(Number),
          expect.any(Number),
          { excludePlatformAdmins: true },
        );
      },
      { timeout: 3000 },
    );
  });

  it('hides role and suspension actions for support staff', async () => {
    platformAccessRef.isPlatformAdmin = false;

    renderWithProviders(<AdminUsers />, { route: '/admin/users' });

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    expect(screen.queryByText('Change role')).not.toBeInTheDocument();
    expect(screen.queryByText('Suspend user')).not.toBeInTheDocument();
    expect(screen.queryByText('Change platform role')).not.toBeInTheDocument();
  });
});
