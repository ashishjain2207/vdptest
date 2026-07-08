import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../utils/test-utils';
import Signup from '@/pages/Signup';
import * as apiService from '@/services';

// Mock API; keep other @/services exports for AuthProvider.
vi.mock('@/services', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    apiPost: vi.fn(),
  };
});

vi.mock('@/services/countriesService.js', () => ({
  getSupportedCountries: vi.fn().mockResolvedValue([
    { code: 'US', name: 'United States (US)', clusterCode: 'NA' },
  ]),
  getAvailableCountries: vi.fn().mockResolvedValue([
    { code: 'US', name: 'United States (US)', clusterCode: 'NA' },
  ]),
}));

describe('Signup Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders signup form', () => {
    renderWithProviders(<Signup />);

    expect(screen.getByLabelText(/^name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/business email address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/^create password$/i)).toBeInTheDocument();
    expect(screen.queryByText(/select your role/i)).not.toBeInTheDocument();
  });

  it('renders social signup buttons', () => {
    renderWithProviders(<Signup />);

    expect(screen.getByRole('button', { name: /google/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /microsoft/i })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Signup />);

    const submitButton = screen.getByRole('button', { name: /create free account/i });
    await user.click(submitButton);

    expect(await screen.findByText(/please enter your name/i)).toBeInTheDocument();
    expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
  });

  it(
    'submits form with all required fields',
    async () => {
      const user = userEvent.setup({ delay: null });
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ available: true }),
      }));
      apiService.apiPost.mockResolvedValue({ ok: true, json: async () => ({}) });

      renderWithProviders(<Signup />);

      fireEvent.change(screen.getByLabelText(/^name/i), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByLabelText(/business email address/i), { target: { value: 'john@example.com' } });
      const pwd = screen.getByPlaceholderText(/^create password$/i);
      fireEvent.change(pwd, { target: { value: 'Password123!' } });

      const countryInput = screen.getByLabelText(/^country/i);
      await waitFor(() => {
        expect(countryInput).not.toBeDisabled();
      });
      await user.click(countryInput);
      await user.click(await screen.findByRole('option', { name: /united states \(us\)/i }));

      await waitFor(
        () => {
          expect(globalThis.fetch).toHaveBeenCalled();
        },
        { timeout: 3000 },
      );

      const submitButton = screen.getByRole('button', { name: /create free account/i });
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(apiService.apiPost).toHaveBeenCalled();
      });
    },
    20_000,
  );
});
