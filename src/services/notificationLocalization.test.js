import { describe, expect, it } from 'vitest';
import {
  localizeNotificationContent,
  formatNotificationTimestamp,
} from './notificationService';

describe('localizeNotificationContent', () => {
  it('translates like/comment/repost/profile DE strings', () => {
    expect(localizeNotificationContent('Alice commented on your post', 'DE')).toBe(
      'Alice hat Ihren Beitrag kommentiert',
    );
    expect(localizeNotificationContent('Bob liked your post', 'DE')).toBe('Bob gefällt Ihr Beitrag');
    expect(localizeNotificationContent('Carol reposted your post', 'DE')).toBe(
      'Carol hat Ihren Beitrag geteilt',
    );
    expect(localizeNotificationContent('Dan viewed your profile', 'DE')).toBe(
      'Dan hat Ihr Profil angesehen',
    );
  });

  it('translates event reminders DE', () => {
    expect(localizeNotificationContent('Reminder: "Summit" is tomorrow.', 'DE')).toBe(
      'Erinnerung: „Summit" ist morgen.',
    );
    expect(localizeNotificationContent('Reminder: "Summit" is in one week.', 'DE')).toBe(
      'Erinnerung: „Summit" ist in einer Woche.',
    );
  });

  it('uses shared instead of reposted EN', () => {
    expect(localizeNotificationContent('Eve reposted your post', 'EN')).toBe('Eve shared your post');
  });
});

describe('formatNotificationTimestamp', () => {
  const now = Date.now();

  it('formats hours and days DE', () => {
    const fiveHoursAgo = new Date(now - (5 * 3_600_000)).toISOString();
    const oneDayAgo = new Date(now - 86_400_000).toISOString();
    expect(formatNotificationTimestamp(fiveHoursAgo, 'DE')).toBe('vor 5 Std.');
    expect(formatNotificationTimestamp(oneDayAgo, 'DE')).toBe('vor 1 Tag');
  });

  it('formats hours and days EN', () => {
    const fiveHoursAgo = new Date(now - (5 * 3_600_000)).toISOString();
    const oneDayAgo = new Date(now - 86_400_000).toISOString();
    expect(formatNotificationTimestamp(fiveHoursAgo, 'EN')).toBe('5h ago');
    expect(formatNotificationTimestamp(oneDayAgo, 'EN')).toBe('1d ago');
  });
});
