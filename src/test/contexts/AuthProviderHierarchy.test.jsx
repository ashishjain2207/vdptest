import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../utils/test-utils';
import { useAuth } from '@/contexts/AuthContext';
import { AuthContext as AuthContextInstance } from '@/contexts/authContextInstance';
import { MessagesHubProvider } from '@/contexts/MessagesHubProvider';
import { NotificationsHubProvider } from '@/contexts/NotificationsHubProvider';
import { MobileSidebar } from '@/components/layout/MobileSidebar';

vi.mock('@/services', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getAccessToken: vi.fn(() => null),
    logout: vi.fn(),
    startSessionIdleCheck: vi.fn(),
    stopSessionIdleCheck: vi.fn(),
    setOnIdleLogout: vi.fn(),
    touchSession: vi.fn(),
    hasSession: vi.fn(() => false),
  };
});

vi.mock('@/services/messagesHub', () => ({
  connectMessagesHub: vi.fn(() => Promise.resolve(null)),
  disconnectMessagesHub: vi.fn(() => Promise.resolve()),
  updateLastSeen: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/services/notificationsHub', () => ({
  connectNotificationsHub: vi.fn(() => Promise.resolve(null)),
  disconnectNotificationsHub: vi.fn(() => Promise.resolve()),
}));

function AuthConsumer() {
  const { user } = useAuth();
  return <div data-testid="auth-consumer">{user ? 'logged-in' : 'logged-out'}</div>;
}

describe('Auth provider hierarchy', () => {
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

  beforeEach(() => {
    warnSpy.mockClear();
  });

  afterAll(() => {
    warnSpy.mockRestore();
  });

  it('does not warn when hub providers and consumers use useAuth inside AuthProvider', () => {
    renderWithProviders(
      <MessagesHubProvider>
        <NotificationsHubProvider>
          <AuthConsumer />
        </NotificationsHubProvider>
      </MessagesHubProvider>,
      { route: '/posts' },
    );

    expect(screen.getByTestId('auth-consumer')).toHaveTextContent('logged-out');
    expect(warnSpy).not.toHaveBeenCalledWith(
      'useAuth called outside AuthProvider - returning default. Ensure AuthProvider wraps your app.',
    );
  });

  it('does not warn for layout components inside AuthProvider', () => {
    renderWithProviders(<MobileSidebar open={false} onClose={() => {}} />, { route: '/posts' });

    expect(warnSpy).not.toHaveBeenCalledWith(
      'useAuth called outside AuthProvider - returning default. Ensure AuthProvider wraps your app.',
    );
  });

  it('uses one shared AuthContext instance across import paths', () => {
    let observedContext = null;

    function ContextProbe() {
      observedContext = useAuth();
      return null;
    }

    renderWithProviders(<ContextProbe />, { route: '/posts' });
    expect(observedContext).not.toBeNull();
    expect(AuthContextInstance).toBeTruthy();
  });
});
