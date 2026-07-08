import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { SupportOrAdminRoute } from '@/components/SupportOrAdminRoute';

vi.mock('@/lib/platformAuth', () => ({
  usePlatformAccess: vi.fn(),
}));

import { usePlatformAccess } from '@/lib/platformAuth';

function renderSupportGate(initialEntry, access) {
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
          path="/support/content-moderation"
          element={
            <SupportOrAdminRoute>
              <div>Support Content Moderation</div>
            </SupportOrAdminRoute>
          }
        />
        <Route path="/access-denied" element={<div>Access Denied Page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('SupportOrAdminRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children for support-only staff', () => {
    renderSupportGate('/support/content-moderation', {
      isPlatformSupport: true,
      isPlatformStaff: true,
      isSupportOnly: true,
    });
    expect(screen.getByText('Support Content Moderation')).toBeInTheDocument();
  });

  it('renders children for platform admin', () => {
    renderSupportGate('/support/content-moderation', {
      isPlatformAdmin: true,
      isPlatformStaff: true,
    });
    expect(screen.getByText('Support Content Moderation')).toBeInTheDocument();
  });

  it('redirects non-staff users to access-denied', async () => {
    renderSupportGate('/support/content-moderation', { isPlatformStaff: false });
    expect(screen.queryByText('Support Content Moderation')).not.toBeInTheDocument();
    expect(await screen.findByText('Access Denied Page')).toBeInTheDocument();
  });
});
