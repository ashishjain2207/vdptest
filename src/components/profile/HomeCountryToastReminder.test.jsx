import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HomeCountryToastReminder } from './HomeCountryToastReminder';

const toastInfo = vi.fn();
const maintenanceModeRef = { value: false };

vi.mock('sonner', () => ({
  toast: { info: (...args) => toastInfo(...args) },
}));

vi.mock('@/store/hooks', () => ({
  useAppSelector: (selector) =>
    selector({
      user: {
        user: { loggedIn: true, userId: 'u1', homeCountryCode: null },
        loading: false,
      },
    }),
}));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: 'EN' }),
}));

vi.mock('@/contexts/MaintenanceModeContext', () => ({
  useMaintenanceMode: () => ({ maintenanceMode: maintenanceModeRef.value }),
}));

vi.mock('@/services', () => ({
  getAccessToken: () => 'token',
  getPlatformAuthFromToken: () => ({ isPlatformAdmin: false }),
}));

vi.mock('@/lib/activeCountry', () => ({
  getHomeCountryCode: () => null,
}));

describe('HomeCountryToastReminder', () => {
  beforeEach(() => {
    toastInfo.mockClear();
    maintenanceModeRef.value = false;
    sessionStorage.clear();
  });

  it('does not toast on maintenance route', () => {
    render(
      <MemoryRouter initialEntries={['/maintenance']}>
        <HomeCountryToastReminder />
      </MemoryRouter>,
    );
    expect(toastInfo).not.toHaveBeenCalled();
  });

  it('does not toast when maintenance mode is on', () => {
    maintenanceModeRef.value = true;
    render(
      <MemoryRouter initialEntries={['/posts']}>
        <HomeCountryToastReminder />
      </MemoryRouter>,
    );
    expect(toastInfo).not.toHaveBeenCalled();
  });

  it('toasts once on app route when home country missing', () => {
    render(
      <MemoryRouter initialEntries={['/posts']}>
        <HomeCountryToastReminder />
      </MemoryRouter>,
    );
    expect(toastInfo).toHaveBeenCalledTimes(1);
    expect(toastInfo.mock.calls[0][0]).toMatch(/country in profile settings/i);
  });
});
