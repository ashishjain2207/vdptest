import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AdminOnlyRoute } from '@/components/AdminOnlyRoute';

vi.mock('@/lib/platformAuth', () => ({
  usePlatformAccess: vi.fn(),
}));

import { usePlatformAccess } from '@/lib/platformAuth';

function renderAdminOnly(initialEntry, access) {
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
          path="/admin/partners"
          element={
            <AdminOnlyRoute>
              <div>Partner Admin</div>
            </AdminOnlyRoute>
          }
        />
        <Route path="/support/inbox" element={<div>Support Inbox</div>} />
        <Route path="/access-denied" element={<div>Access Denied Page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('AdminOnlyRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children for platform admin', () => {
    renderAdminOnly('/admin/partners', { isPlatformAdmin: true, isPlatformStaff: true });
    expect(screen.getByText('Partner Admin')).toBeInTheDocument();
  });

  it('redirects support staff to support inbox', async () => {
    renderAdminOnly('/admin/partners', {
      isPlatformAdmin: false,
      isPlatformSupport: true,
      isPlatformStaff: true,
      isSupportOnly: true,
    });
    expect(screen.queryByText('Partner Admin')).not.toBeInTheDocument();
    expect(await screen.findByText('Support Inbox')).toBeInTheDocument();
  });

  it('redirects non-staff to access-denied', async () => {
    renderAdminOnly('/admin/partners', { isPlatformAdmin: false, isPlatformStaff: false });
    expect(await screen.findByText('Access Denied Page')).toBeInTheDocument();
  });
});
