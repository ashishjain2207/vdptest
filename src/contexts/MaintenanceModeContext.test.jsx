import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MaintenanceModeProvider, useMaintenanceMode } from './MaintenanceModeContext.jsx';

const mocks = vi.hoisted(() => ({
  fetchPublicMaintenanceStatus: vi.fn(),
  setPublicMaintenanceMode: vi.fn(),
}));

vi.mock('@/services/maintenanceStatusService', () => ({
  fetchPublicMaintenanceStatus: mocks.fetchPublicMaintenanceStatus,
}));

vi.mock('@/services/api/maintenanceApiGate', () => ({
  setPublicMaintenanceMode: mocks.setPublicMaintenanceMode,
}));

function Harness() {
  const { maintenanceMode, refresh } = useMaintenanceMode();
  return (
    <>
      <div data-testid="mode">{String(maintenanceMode)}</div>
      <button type="button" onClick={() => { void refresh(); }}>refresh</button>
    </>
  );
}

describe('MaintenanceModeContext', () => {
  beforeEach(() => {
    mocks.fetchPublicMaintenanceStatus.mockReset();
    mocks.setPublicMaintenanceMode.mockReset();
  });

  it('locks safely when the initial maintenance status refresh fails', async () => {
    mocks.fetchPublicMaintenanceStatus.mockRejectedValueOnce(new Error('network'));

    render(
      <MaintenanceModeProvider>
        <Harness />
      </MaintenanceModeProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('mode')).toHaveTextContent('true'));
    expect(mocks.setPublicMaintenanceMode).toHaveBeenLastCalledWith(true);
  });

  it('preserves the previous maintenance state when a later refresh fails', async () => {
    mocks.fetchPublicMaintenanceStatus
      .mockResolvedValueOnce(true)
      .mockRejectedValueOnce(new Error('network'));

    render(
      <MaintenanceModeProvider>
        <Harness />
      </MaintenanceModeProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('mode')).toHaveTextContent('true'));
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /refresh/i }));
    });

    await waitFor(() => expect(mocks.fetchPublicMaintenanceStatus).toHaveBeenCalledTimes(2));
    expect(screen.getByTestId('mode')).toHaveTextContent('true');
    expect(mocks.setPublicMaintenanceMode).toHaveBeenLastCalledWith(true);
  });
});
