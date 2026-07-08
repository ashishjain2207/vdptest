import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AdminOnlyRoute } from '@/components/AdminOnlyRoute';
import { SupportOrAdminRoute } from '@/components/SupportOrAdminRoute';

vi.mock('@/lib/platformAuth', () => ({
  usePlatformAccess: vi.fn(),
}));

import { usePlatformAccess } from '@/lib/platformAuth';

function mockAccess(access) {
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
}

function renderModerationRoutes(initialEntry, access) {
  mockAccess(access);

  return render(
    <MemoryRouter
      initialEntries={[initialEntry]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route
          path="/admin/content-moderation"
          element={
            <AdminOnlyRoute>
              <div>Admin Content Moderation</div>
            </AdminOnlyRoute>
          }
        />
        <Route
          path="/support/content-moderation"
          element={
            <SupportOrAdminRoute>
              <div>Support Content Moderation</div>
            </SupportOrAdminRoute>
          }
        />
        <Route path="/support/inbox" element={<div>Support Inbox</div>} />
        <Route path="/access-denied" element={<div>Access Denied Page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('support content moderation routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lets support-only staff open /support/content-moderation', () => {
    renderModerationRoutes('/support/content-moderation', {
      isPlatformSupport: true,
      isPlatformStaff: true,
      isSupportOnly: true,
    });
    expect(screen.getByText('Support Content Moderation')).toBeInTheDocument();
  });

  it('blocks support-only staff from /admin/content-moderation', async () => {
    renderModerationRoutes('/admin/content-moderation', {
      isPlatformSupport: true,
      isPlatformStaff: true,
      isSupportOnly: true,
    });
    expect(screen.queryByText('Admin Content Moderation')).not.toBeInTheDocument();
    expect(await screen.findByText('Support Inbox')).toBeInTheDocument();
  });

  it('lets platform admins open /admin/content-moderation', () => {
    renderModerationRoutes('/admin/content-moderation', {
      isPlatformAdmin: true,
      isPlatformStaff: true,
    });
    expect(screen.getByText('Admin Content Moderation')).toBeInTheDocument();
  });

  it('blocks regular users from /support/content-moderation', async () => {
    renderModerationRoutes('/support/content-moderation', { isPlatformStaff: false });
    expect(screen.queryByText('Support Content Moderation')).not.toBeInTheDocument();
    expect(await screen.findByText('Access Denied Page')).toBeInTheDocument();
  });

  it('blocks regular users from /admin/content-moderation', async () => {
    renderModerationRoutes('/admin/content-moderation', { isPlatformStaff: false });
    expect(screen.queryByText('Admin Content Moderation')).not.toBeInTheDocument();
    expect(await screen.findByText('Access Denied Page')).toBeInTheDocument();
  });
});
