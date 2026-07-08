import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('@/lib/platformAuth', () => ({
  usePlatformAccess: vi.fn(),
}));

vi.mock('@/pages/AdminDashboard', () => ({
  default: () => <div>Admin Dashboard</div>,
}));

import { usePlatformAccess } from '@/lib/platformAuth';
import { AdminStaffHomeRedirect } from '@/components/admin/AdminStaffHomeRedirect';

function renderRedirect(access) {
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
      initialEntries={['/admin']}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/admin" element={<AdminStaffHomeRedirect />} />
        <Route path="/support/inbox" element={<div>Support Inbox</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('AdminStaffHomeRedirect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects support-only users to support inbox', async () => {
    renderRedirect({ isSupportOnly: true, isPlatformStaff: true });
    expect(await screen.findByText('Support Inbox')).toBeInTheDocument();
  });

  it('shows dashboard for platform admin', () => {
    renderRedirect({ isPlatformAdmin: true, isPlatformStaff: true, isSupportOnly: false });
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });
});
