import { describe, it, expect } from 'vitest';
import {
  supportFormPath,
  resolveSupportInquiryTypeFromRoute,
  resolveSupportSubmitterFromSession,
} from './supportRoutes';

describe('supportRoutes', () => {
  it('builds typed support form paths', () => {
    expect(supportFormPath('support')).toBe('/support?type=support');
    expect(supportFormPath('feedback')).toBe('/support?type=feedback');
  });

  it('resolves inquiry type from query or state', () => {
    expect(resolveSupportInquiryTypeFromRoute(new URLSearchParams('type=feedback'), null)).toBe('Feedback');
    expect(resolveSupportInquiryTypeFromRoute(new URLSearchParams('type=support'), null)).toBe('Support');
    expect(resolveSupportInquiryTypeFromRoute(null, { inquiryType: 'Feedback' })).toBe('Feedback');
    expect(resolveSupportInquiryTypeFromRoute(null, null)).toBe('');
  });

  it('maps logged-in submitter from profile and token', () => {
    expect(resolveSupportSubmitterFromSession(null)).toEqual({ name: '', email: '' });
    expect(
      resolveSupportSubmitterFromSession({
        displayName: 'Jane Doe',
        contactEmail: 'jane@example.com',
      }),
    ).toEqual({ name: 'Jane Doe', email: 'jane@example.com' });
    const token = `eyJhbGciOiJub25lIn0.${btoa(JSON.stringify({ email: 'jwt@example.com', name: 'JWT User' }))}.`;
    expect(
      resolveSupportSubmitterFromSession({ handle: 'jdoe' }, token),
    ).toEqual({ name: 'jdoe', email: 'jwt@example.com' });
  });
});
