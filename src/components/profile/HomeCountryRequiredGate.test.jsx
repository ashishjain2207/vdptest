import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HomeCountryRequiredGate } from './HomeCountryRequiredGate';

const maintenanceModeRef = { value: false };
const userStateRef = {
  user: { loggedIn: true, userId: 'u1', homeCountryCode: null },
  loading: false,
};

vi.mock('@/store/hooks', () => ({
  useAppSelector: (selector) =>
    selector({
      user: userStateRef,
    }),
  useAppDispatch: () => vi.fn(),
}));

vi.mock('@/contexts/MaintenanceModeContext', () => ({
  useMaintenanceMode: () => ({ maintenanceMode: maintenanceModeRef.value }),
}));

vi.mock('@/services', () => ({
  getAccessToken: () => 'token',
  getPlatformAuthFromToken: () => ({
    isPlatformAdmin: false,
    isPlatformSupport: false,
    isPlatformStaff: false,
  }),
}));

describe('HomeCountryRequiredGate', () => {
  beforeEach(() => {
    maintenanceModeRef.value = false;
    userStateRef.user = { loggedIn: true, userId: 'u1', homeCountryCode: null };
    userStateRef.loading = false;
  });

  it('redirects to onboarding on posts without home country', () => {
    render(
      <MemoryRouter initialEntries={['/posts']}>
        <Routes>
          <Route path="/onboarding" element={<div>Onboarding</div>} />
          <Route
            path="*"
            element={(
              <HomeCountryRequiredGate>
                <div>Feed</div>
              </HomeCountryRequiredGate>
            )}
          />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('Onboarding')).toBeInTheDocument();
    expect(screen.queryByText('Feed')).not.toBeInTheDocument();
  });

  it('does not block support inbox', () => {
    render(
      <MemoryRouter initialEntries={['/support/inbox']}>
        <HomeCountryRequiredGate>
          <div>Inbox</div>
        </HomeCountryRequiredGate>
      </MemoryRouter>,
    );
    expect(screen.getByText('Inbox')).toBeInTheDocument();
  });

  it('allows feed when home country is set', () => {
    userStateRef.user = { loggedIn: true, userId: 'u1', homeCountryCode: 'DE' };
    render(
      <MemoryRouter initialEntries={['/posts']}>
        <HomeCountryRequiredGate>
          <div>Feed</div>
        </HomeCountryRequiredGate>
      </MemoryRouter>,
    );
    expect(screen.getByText('Feed')).toBeInTheDocument();
  });

  it('redirects messages without home country', () => {
    render(
      <MemoryRouter initialEntries={['/messages']}>
        <Routes>
          <Route path="/onboarding" element={<div>Onboarding</div>} />
          <Route
            path="*"
            element={(
              <HomeCountryRequiredGate>
                <div>Messages</div>
              </HomeCountryRequiredGate>
            )}
          />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('Onboarding')).toBeInTheDocument();
  });
});
