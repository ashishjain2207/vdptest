import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminFeedbackSupport from '@/pages/AdminFeedbackSupport';
import { REALTIME } from '@/lib/realtimeEvents';

vi.mock('@/contexts/AdminScopeCountryContext', () => ({
  useAdminScopeCountry: () => ({ country: 'US' }),
}));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: 'EN' }),
}));

vi.mock('@/hooks/useRefreshOnlyFullPageLoader', () => ({
  useRefreshOnlyFullPageLoader: () => ({
    showRefreshLoader: false,
    endInitialFetch: vi.fn(),
  }),
}));

const listAdminSupportInquiries = vi.fn();

vi.mock('@/services/adminSupportInquiryService', () => ({
  listAdminSupportInquiries: (...args) => listAdminSupportInquiries(...args),
  reopenAdminSupportInquiry: vi.fn(),
  resolveAdminSupportInquiry: vi.fn(),
}));

describe('AdminFeedbackSupport', () => {
  beforeEach(() => {
    listAdminSupportInquiries.mockReset();
    listAdminSupportInquiries.mockResolvedValue({
      items: [],
      summary: { total: 0, unread: 0, supportActive: 0, feedbackActive: 0 },
    });
  });

  it('reloads inbox when support inquiry realtime event fires', async () => {
    render(
      <MemoryRouter>
        <AdminFeedbackSupport />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(listAdminSupportInquiries).toHaveBeenCalledTimes(1);
    });

    act(() => {
      window.dispatchEvent(
        new CustomEvent(REALTIME.supportInquiry.INBOX_CHANGED, {
          detail: { platformSupportInquiryId: '22222222-2222-2222-2222-222222222222' },
        }),
      );
    });

    await waitFor(
      () => {
        expect(listAdminSupportInquiries).toHaveBeenCalledTimes(2);
      },
      { timeout: 2000 },
    );

    expect(screen.getByText(/Support Inbox/i)).toBeInTheDocument();
  });
});
