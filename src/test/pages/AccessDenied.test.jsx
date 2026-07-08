import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ACCESS_DENIED_REASON } from '@/lib/accessDeniedReasons';

vi.mock('@/components/layout/MainLayout', () => ({
  MainLayout: ({ children }) => <div data-testid="main-layout">{children}</div>,
}));

import AccessDenied from '@/pages/AccessDenied';

function renderAccessDenied(state) {
  return render(
    <MemoryRouter
      initialEntries={[{ pathname: '/access-denied', state }]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/access-denied" element={<AccessDenied />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('AccessDenied', () => {
  it('shows platform staff message', () => {
    renderAccessDenied({ reason: ACCESS_DENIED_REASON.PLATFORM_STAFF });
    expect(
      screen.getByRole('heading', { name: /access denied|zugriff verweigert/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/support inbox or admin areas|unterstützungs-posteingang oder admin-bereiche/i),
    ).toBeInTheDocument();
  });

  it('shows platform admin message', () => {
    renderAccessDenied({ reason: ACCESS_DENIED_REASON.PLATFORM_ADMIN });
    expect(
      screen.getByText(/partner management|partnerverwaltung/i),
    ).toBeInTheDocument();
  });

  it('shows generic message when reason is missing', () => {
    renderAccessDenied({});
    expect(
      screen.getByText(
        /don't have permission to view this page|keine berechtigung, diese seite anzuzeigen/i,
      ),
    ).toBeInTheDocument();
  });
});
