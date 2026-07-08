import { DateTime } from 'luxon';

export function getBrowserTimeZoneId() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/**
 * @param {string} dateStr yyyy-MM-dd
 * @param {string} timeStr HH:mm
 * @param {string} ianaZone
 * @returns {string | null} ISO-8601 in UTC
 */
export function zonedLocalToUtcIso(dateStr, timeStr, ianaZone) {
  if (!dateStr || !timeStr || !ianaZone) {
    return null;
  }
  const ymd = dateStr.split('-').map((x) => parseInt(x, 10));
  if (ymd.length < 3 || ymd.some((n) => !Number.isFinite(n))) {
    return null;
  }
  const [hs, ms] = String(timeStr).split(':');
  const h = parseInt(hs, 10);
  const m = parseInt(ms || '0', 10);
  const dt = DateTime.fromObject(
    {
      year: ymd[0],
      month: ymd[1],
      day: ymd[2],
      hour: Number.isFinite(h) ? h : 0,
      minute: Number.isFinite(m) ? m : 0,
      second: 0,
      millisecond: 0,
    },
    { zone: ianaZone },
  );
  if (!dt.isValid) {
    return null;
  }
  return dt.toUTC().toISO({ suppressMilliseconds: true });
}

/**
 * @param {string} isoUtc
 * @param {string} ianaZone
 * @returns {{ date: string, time: string }}
 */
export function utcIsoToZonedParts(isoUtc, ianaZone) {
  const zone = ianaZone || 'UTC';
  const dt = DateTime.fromISO(String(isoUtc), { zone: 'utc' }).setZone(zone);
  if (!dt.isValid) {
    return { date: '', time: '09:00' };
  }
  return { date: dt.toFormat('yyyy-MM-dd'), time: dt.toFormat('HH:mm') };
}
