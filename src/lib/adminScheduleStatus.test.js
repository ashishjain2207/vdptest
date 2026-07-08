import { describe, it, expect } from 'vitest';
import {
  getAdvertisementScheduleStatus,
  getEventScheduleStatus,
  scheduleMatchesFilter,
} from './adminScheduleStatus';

describe('adminScheduleStatus', () => {
  const jan1 = new Date('2026-01-01T12:00:00.000Z');
  const jan15 = new Date('2026-01-15T12:00:00.000Z');
  const feb1 = new Date('2026-02-01T12:00:00.000Z');

  it('classifies advertisement before validFrom as scheduled', () => {
    expect(
      getAdvertisementScheduleStatus(
        { validFromUtc: feb1.toISOString(), validToUtc: '2026-03-01T12:00:00.000Z' },
        jan15,
      ),
    ).toBe('scheduled');
  });

  it('classifies advertisement after validTo as expired', () => {
    expect(
      getAdvertisementScheduleStatus(
        { validFromUtc: jan1.toISOString(), validToUtc: jan15.toISOString() },
        feb1,
      ),
    ).toBe('expired');
  });

  it('classifies advertisement in window as active', () => {
    expect(
      getAdvertisementScheduleStatus(
        { validFromUtc: jan1.toISOString(), validToUtc: feb1.toISOString() },
        jan15,
      ),
    ).toBe('active');
  });

  it('classifies event after endDateUtc as expired', () => {
    expect(
      getEventScheduleStatus(
        { startDateUtc: jan1.toISOString(), endDateUtc: jan15.toISOString() },
        feb1,
      ),
    ).toBe('expired');
  });

  it('classifies event with no end after start as active', () => {
    expect(
      getEventScheduleStatus({ startDateUtc: jan1.toISOString(), endDateUtc: null }, jan15),
    ).toBe('active');
  });

  it('classifies event with unconfirmed date/time as unconfirmed even with future placeholder date', () => {
    expect(
      getEventScheduleStatus(
        {
          startDateUtc: '2100-01-01T12:00:00.000Z',
          endDateUtc: null,
          isScheduleConfirmed: false,
        },
        jan15,
      ),
    ).toBe('unconfirmed');
  });

  it('scheduleMatchesFilter respects all', () => {
    expect(scheduleMatchesFilter('expired', 'all')).toBe(true);
    expect(scheduleMatchesFilter('scheduled', 'active')).toBe(false);
    expect(scheduleMatchesFilter('unconfirmed', 'unconfirmed')).toBe(true);
  });
});
