import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../utils/test-utils';
import { useAuth } from '@/contexts/AuthContext';
import * as authService from '@/services';

// Mock auth service
vi.mock('@/services', () => ({
  getAccessToken: vi.fn(() => null),
  logout: vi.fn(),
  startSessionIdleCheck: vi.fn(),
  stopSessionIdleCheck: vi.fn(),
  setOnIdleLogout: vi.fn(),
  touchSession: vi.fn(),
  hasSession: vi.fn(() => false),
}));

function TestComponent() {
  const { user, isAuthenticated, logout } = useAuth();
  
  return (
    <div>
      <div data-testid="user">{user ? 'Logged in' : 'Not logged in'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'Yes' : 'No'}</div>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides authentication state', () => {
    renderWithProviders(<TestComponent />);
    
    expect(screen.getByTestId('user')).toHaveTextContent('Not logged in');
    expect(screen.getByTestId('authenticated')).toHaveTextContent('No');
  });

  it('provides logout function', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TestComponent />);

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    await act(async () => {
      await user.click(logoutButton);
    });

    await waitFor(() => {
      expect(authService.logout).toHaveBeenCalled();
    });
  });
});
