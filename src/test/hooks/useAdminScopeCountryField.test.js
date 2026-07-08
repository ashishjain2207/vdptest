import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAdminScopeCountryField } from '@/hooks/useAdminScopeCountryField';

const mockUseAdminScopeCountry = vi.fn(() => ({ country: 'DE' }));

vi.mock('@/contexts/AdminScopeCountryContext', () => ({
  useAdminScopeCountry: () => mockUseAdminScopeCountry(),
}));

describe('useAdminScopeCountryField', () => {
  beforeEach(() => {
    mockUseAdminScopeCountry.mockReturnValue({ country: 'DE' });
  });

  it('prefills create forms from admin scope', () => {
    const { result } = renderHook(() => useAdminScopeCountryField({ isCreate: true }));
    expect(result.current.countryCode).toBe('DE');
  });

  it('follows admin scope changes until the user edits the field', () => {
    const { result, rerender } = renderHook(() => useAdminScopeCountryField({ isCreate: true }));

    mockUseAdminScopeCountry.mockReturnValue({ country: 'FR' });
    rerender();

    expect(result.current.countryCode).toBe('FR');

    act(() => {
      result.current.setCountryCode('US');
    });

    mockUseAdminScopeCountry.mockReturnValue({ country: 'IT' });
    rerender();

    expect(result.current.countryCode).toBe('US');
  });

  it('keeps setCountryCodeFromApi stable across rerenders', () => {
    const { result, rerender } = renderHook(() => useAdminScopeCountryField({ isCreate: false }));
    const initial = result.current.setCountryCodeFromApi;

    mockUseAdminScopeCountry.mockReturnValue({ country: 'FR' });
    rerender();

    expect(result.current.setCountryCodeFromApi).toBe(initial);
  });

  it('does not sync admin scope on edit forms', () => {
    const { result, rerender } = renderHook(() => useAdminScopeCountryField({ isCreate: false }));

    act(() => {
      result.current.setCountryCodeFromApi('US');
    });

    mockUseAdminScopeCountry.mockReturnValue({ country: 'FR' });
    rerender();

    expect(result.current.countryCode).toBe('US');
  });
});
