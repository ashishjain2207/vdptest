import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AdminSupportIncidentDialog } from '@/components/admin/AdminSupportIncidentDialog';

const getAdminSupportInquiry = vi.fn();

vi.mock('@/services/adminSupportInquiryService', () => ({
  getAdminSupportInquiry: (...args) => getAdminSupportInquiry(...args),
  patchAdminSupportInquiry: vi.fn(),
}));

describe('AdminSupportIncidentDialog', () => {
  beforeEach(() => {
    getAdminSupportInquiry.mockReset();
    getAdminSupportInquiry.mockResolvedValue({
      id: '11111111-1111-1111-1111-111111111111',
      inquiryType: 'Support',
      category: 'technical',
      status: 'Open',
      submitterName: 'Jane Doe',
      submitterEmail: 'jane@example.com',
      subject: 'Cannot log in to my account',
      message: 'I get an error when signing in.',
      createdAtUtc: '2026-06-01T10:00:00Z',
    });
  });

  it('renders subject above message when detail loads', async () => {
    render(
      <AdminSupportIncidentDialog
        open
        inquiryId="11111111-1111-1111-1111-111111111111"
        onClose={() => {}}
        onUpdated={() => {}}
        language="EN"
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('support-incident-subject')).toHaveTextContent('Cannot log in to my account');
    });

    const subject = screen.getByTestId('support-incident-subject');
    const message = screen.getByTestId('support-incident-message');
    expect(subject.compareDocumentPosition(message) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(message).toHaveTextContent('I get an error when signing in.');
    expect(screen.getByTestId('support-incident-customer-message-label')).toBeInTheDocument();
  });
});
