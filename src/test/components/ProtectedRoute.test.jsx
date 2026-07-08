import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import * as authService from '@/services';

// Mock auth barrel (only the functions ProtectedRoute uses)
vi.mock('@/services', () => ({
  getAccessToken: vi.fn(),
  hasSession: vi.fn(),
}));

/**
 * React Router v6: `<Navigate />` from ProtectedRoute must be rendered under `<Routes>`, or the
 * test run can hang and eventually OOM. See e2e/ Vitest task 522642.
 */
function renderProtectedRoutes(initialEntry, mocks) {
  authService.getAccessToken.mockImplementation(() => mocks.getAccessToken?.() ?? null);
  authService.hasSession.mockImplementation(() => mocks.hasSession?.() ?? false);

  return render(
    <MemoryRouter
      initialEntries={[initialEntry]}
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route
          path="/protected"
          element={
            <ProtectedRoute>
              <div>Protected Content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children when user is authenticated', () => {
    renderProtectedRoutes('/protected', {
      getAccessToken: () => 'mock-token',
      hasSession: () => true,
    });

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to login when user is not authenticated', async () => {
    renderProtectedRoutes('/protected', {
      getAccessToken: () => null,
      hasSession: () => false,
    });

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(await screen.findByText('Login Page')).toBeInTheDocument();
  });
});
