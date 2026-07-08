import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AdminRoute } from '@/components/AdminRoute';
import { ACCESS_DENIED_REASON } from '@/lib/accessDeniedReasons';

vi.mock('@/lib/platformAuth', () => ({
  usePlatformAccess: vi.fn(),
}));

import { usePlatformAccess } from '@/lib/platformAuth';

function renderAdminGate(initialEntry, access) {
  vi.mocked(usePlatformAccess).mockReturnValue({
    isPlatformAdmin: false,
    isPlatformSupport: false,
    isPlatformStaff: false,
    isSupportOnly: false,
    isReadOnlyAdmin: false,
    supportInboxPath: '/support/inbox',
    adminHomePath: '/admin',
    ...access,
  });

  return render(
    <MemoryRouter
      initialEntries={[initialEntry]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <div>Admin Area</div>
            </AdminRoute>
          }
        />
        <Route path="/support/inbox" element={<div>Support Inbox</div>} />
        <Route path="/access-denied" element={<div>Access Denied Page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('AdminRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children for platform staff', () => {
    renderAdminGate('/admin', { isPlatformStaff: true, isPlatformAdmin: true });
    expect(screen.getByText('Admin Area')).toBeInTheDocument();
  });

  it('redirects non-staff to access-denied', async () => {
    renderAdminGate('/admin', { isPlatformStaff: false });
    expect(screen.queryByText('Admin Area')).not.toBeInTheDocument();
    expect(await screen.findByText('Access Denied Page')).toBeInTheDocument();
  });

  it('uses platformStaff access-denied reason', () => {
    renderAdminGate('/admin', { isPlatformStaff: false });
    expect(ACCESS_DENIED_REASON.PLATFORM_STAFF).toBe('platformStaff');
  });
});
