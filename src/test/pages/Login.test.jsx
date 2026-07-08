import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../utils/test-utils';
import Login from '@/pages/Login';
import * as authService from '@/services/auth/authService';

// Partial mock: keep real exports for AuthContext (logout, refreshToken, …); stub login entry points only.
vi.mock('@/services/auth/authService', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    loginWithPassword: vi.fn(),
    loginWithExternalProvider: vi.fn(),
  };
});

// Mock session-related exports; keep the rest of @/services so AuthContext (setOnIdleLogout, etc.) stays valid.
vi.mock('@/services', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getAccessToken: vi.fn(() => null),
    startSessionIdleCheck: vi.fn(),
    hasSession: vi.fn(() => false),
  };
});

/** Avoid getByLabelText(/password/i): it also matches the visibility toggle (`aria-label` contains "password"). */
function getPasswordInput() {
  const el = document.getElementById('password');
  if (!el) {
    throw new Error('Expected #password input');
  }
  return el;
}

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form', () => {
    renderWithProviders(<Login />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(getPasswordInput()).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders social login buttons', () => {
    renderWithProviders(<Login />);
    
    expect(screen.getByRole('button', { name: /google/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /microsoft/i })).toBeInTheDocument();
  });

  it('shows validation error when email is empty', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />);
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/e-mail ist erforderlich|email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/passwort ist erforderlich|password is required/i)).toBeInTheDocument();
    });
  });

  it('submits form with email and password', async () => {
    const user = userEvent.setup();
    const mockLogin = vi.fn().mockResolvedValue({});
    authService.loginWithPassword.mockImplementation(mockLogin);
    
    renderWithProviders(<Login />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = getPasswordInput();
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('displays error message on login failure', async () => {
    const user = userEvent.setup();
    authService.loginWithPassword.mockResolvedValue({
      error: 'invalid_grant',
      errorDescription: 'Invalid username or password',
    });
    
    renderWithProviders(<Login />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = getPasswordInput();
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/invalid username or password/i)).toBeInTheDocument();
    });
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />);
    
    const passwordInput = getPasswordInput();
    const toggleButton = screen.getByRole('button', { name: /show password|passwort anzeigen/i });
    
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');
    
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});
