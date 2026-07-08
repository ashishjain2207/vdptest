import { describe, expect, it } from 'vitest';
import { getNotificationRoute } from './notificationRoutes';

describe('getNotificationRoute', () => {
  it('routes likes to post detail when postId is present', () => {
    expect(getNotificationRoute({
      type: 'like',
      postId: 'abc-123',
    })).toEqual({ path: '/posts/abc-123' });
  });

  it('does not navigate to post detail without a usable postId', () => {
    expect(getNotificationRoute({ type: 'like', postId: '' })).toEqual({ path: '#' });
    expect(getNotificationRoute({ type: 'like', postId: 'null' })).toEqual({ path: '#' });
  });

  it('routes profile notifications using slug before actor id', () => {
    expect(getNotificationRoute({
      type: 'follow',
      actorId: '00000000-0000-0000-0000-000000000001',
      actorProfileSlug: 'jane-doe',
    })).toEqual({ path: '/profile/jane-doe' });
  });

  it('routes events to list when event id is missing', () => {
    expect(getNotificationRoute({ type: 'event' })).toEqual({ path: '/events' });
  });

  it('routes events to detail when event id is present', () => {
    expect(getNotificationRoute({
      type: 'event',
      eventId: 'evt-1',
    })).toEqual({ path: '/event/evt-1' });
  });

  it('redirects unknown types to a no-op hash', () => {
    expect(getNotificationRoute({ type: 'unknown' })).toEqual({ path: '#' });
  });

  it('routes platform support inbox notifications to support inbox', () => {
    expect(getNotificationRoute({
      type: 'platformSupportInquiry',
      platformSupportInquiryId: '11111111-1111-1111-1111-111111111111',
    })).toEqual({
      path: '/support/inbox',
      state: { openSupportInquiryId: '11111111-1111-1111-1111-111111111111' },
    });
  });
});
