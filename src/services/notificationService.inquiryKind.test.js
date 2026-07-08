import { describe, expect, it } from 'vitest';
import { mapApiNotificationToFrontend, parsePlatformSupportInquiryKind } from './notificationService.js';

describe('parsePlatformSupportInquiryKind', () => {
  it('detects support tickets', () => {
    expect(parsePlatformSupportInquiryKind('New support request from Jane Doe.')).toBe('support');
  });

  it('detects feedback tickets', () => {
    expect(parsePlatformSupportInquiryKind('New feedback request from Jane Doe.')).toBe('feedback');
  });
});

describe('mapApiNotificationToFrontend inquiryKind', () => {
  it('maps platform support inquiry kind from content', () => {
    const mapped = mapApiNotificationToFrontend({
      id: '1',
      type: 19,
      content: 'New feedback request from Pat.',
      isRead: false,
    });
    expect(mapped.type).toBe('platformSupportInquiry');
    expect(mapped.inquiryKind).toBe('feedback');
  });
});
