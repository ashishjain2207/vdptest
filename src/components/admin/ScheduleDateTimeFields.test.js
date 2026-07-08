import { describe, expect, it } from 'vitest';
import {
  dateOnlyToUtcEndIso,
  dateOnlyToUtcStartIso,
  isoUtcToDateOnlyString,
  UNCONFIRMED_EVENT_START_PLACEHOLDER_ISO,
  isPlaceholderScheduleStartUtc,
  localStringToParts,
  partsToLocalString,
} from './ScheduleDateTimeFields.jsx';

describe('ad date-only local-calendar helpers', () => {
  it('maps selected yyyy-MM-dd to local start/end of day as ISO UTC', () => {
    expect(dateOnlyToUtcStartIso('2026-05-12')).toBe(new Date(2026, 4, 12, 0, 0, 0, 0).toISOString());
    expect(dateOnlyToUtcEndIso('2026-05-12')).toBe(new Date(2026, 4, 12, 23, 59, 59, 999).toISOString());
  });

  it('round-trips local calendar day for instants on the same local date', () => {
    const start = new Date(2026, 4, 12, 0, 0, 0, 0).toISOString();
    const end = new Date(2026, 4, 12, 23, 59, 59, 999).toISOString();
    expect(isoUtcToDateOnlyString(start)).toBe('2026-05-12');
    expect(isoUtcToDateOnlyString(end)).toBe('2026-05-12');
  });

  it('round-trips date field through start/end without changing the picked day', () => {
    const day = '2026-05-12';
    const vf = dateOnlyToUtcStartIso(day);
    const vt = dateOnlyToUtcEndIso(day);
    expect(vf && vt).toBeTruthy();
    expect(isoUtcToDateOnlyString(vf)).toBe(day);
    expect(isoUtcToDateOnlyString(vt)).toBe(day);
  });
});

describe('ScheduleDateTimeFields helpers', () => {
  it('treats the unconfirmed placeholder ISO as a placeholder schedule', () => {
    expect(isPlaceholderScheduleStartUtc(UNCONFIRMED_EVENT_START_PLACEHOLDER_ISO)).toBe(true);
  });

  it('treats invalid and empty values as placeholder schedules', () => {
    expect(isPlaceholderScheduleStartUtc('')).toBe(true);
    expect(isPlaceholderScheduleStartUtc('not-a-date')).toBe(true);
  });

  it('treats real dates before year 2100 as confirmed schedules', () => {
    expect(isPlaceholderScheduleStartUtc('2026-05-15T10:30:00.000Z')).toBe(false);
  });

  it('splits and rebuilds local date/time strings consistently', () => {
    expect(localStringToParts('2026-05-15T09:45')).toEqual({ date: '2026-05-15', time: '09:45' });
    expect(partsToLocalString('2026-05-15', '09:45')).toBe('2026-05-15T09:45');
  });
});
