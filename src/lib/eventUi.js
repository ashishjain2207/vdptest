import { DateTime } from 'luxon';
import { isPlaceholderScheduleStartUtc } from '@/components/admin/ScheduleDateTimeFields';
import {
  localizeEventDescription,
  localizeEventLocation,
  localizeEventTitle,
} from '@/lib/eventDisplay';

/** Default cover when API returns no image */
export const DEFAULT_EVENT_COVER =
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=200&fit=crop';

/**
 * @param {Date | null} start
 * @param {Date | null} end
 * @param {string | undefined} locale
 */
/** @param {unknown} s */
export function isLikelyHttpUrl(s) {
  return /^https?:\/\//i.test(String(s ?? '').trim());
}

/**
 * Absolute http/https only — safe for window.open / href to third-party booking.
 * @param {unknown} raw
 * @returns {string}
 */
export function sanitizeUrlForNewTab(raw) {
  if (typeof raw !== 'string') {
    return '';
  }
  const t = raw.trim();
  if (!t) {
    return '';
  }
  try {
    const u = new URL(t);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      return '';
    }
    return u.href;
  } catch {
    return '';
  }
}

function sameLocalCalendarDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatLocalDateMedium(d, locale) {
  return d.toLocaleDateString(locale || undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * @param {Date} start
 * @param {Date} end
 * @param {string} [locale]
 */
export function formatLocalDateRange(start, end, locale) {
  if (!start || Number.isNaN(start.getTime())) {
    return '—';
  }
  if (!end || Number.isNaN(end.getTime())) {
    return formatLocalDateMedium(start, locale);
  }
  if (sameLocalCalendarDay(start, end)) {
    return formatLocalDateMedium(start, locale);
  }
  const y1 = start.getFullYear();
  const y2 = end.getFullYear();
  if (y1 === y2) {
    const md1 = start.toLocaleDateString(locale || undefined, { month: 'short', day: 'numeric' });
    return `${md1} – ${formatLocalDateMedium(end, locale)}`;
  }
  return `${formatLocalDateMedium(start, locale)} – ${formatLocalDateMedium(end, locale)}`;
}

function formatTimeRangeFromDates(start, end, locale) {
  if (!start || Number.isNaN(start.getTime())) {
    return '';
  }
  const opts = { hour: 'numeric', minute: '2-digit' };
  const a = start.toLocaleTimeString(locale || undefined, opts);
  if (end && !Number.isNaN(end.getTime()) && end.getTime() !== start.getTime()) {
    const b = end.toLocaleTimeString(locale || undefined, opts);
    return `${a} – ${b}`;
  }
  return a;
}

/**
 * @param {Date} start
 * @param {Date} end
 * @param {string} timeZoneId IANA
 * @param {string} [locale]
 */
function formatTimeRangeInTimeZone(start, end, timeZoneId, locale) {
  if (!start || Number.isNaN(start.getTime())) {
    return '';
  }
  try {
    const opts = { hour: 'numeric', minute: '2-digit', timeZone: timeZoneId };
    const a = start.toLocaleTimeString(locale || undefined, opts);
    if (end && !Number.isNaN(end.getTime()) && end.getTime() !== start.getTime()) {
      const b = end.toLocaleTimeString(locale || undefined, opts);
      return `${a} – ${b}`;
    }
    return a;
  } catch {
    return formatTimeRangeFromDates(start, end, locale);
  }
}

/**
 * Date range as calendar days in the event zone (multi-day trade shows, etc.).
 * @param {Date} start
 * @param {Date | null} end
 * @param {string} ianaId
 * @param {string} [locale]
 */
function formatZonedDateRange(start, end, ianaId, locale) {
  if (!start || Number.isNaN(start.getTime())) {
    return '—';
  }
  const loc = locale === 'de-DE' ? 'de' : 'en';
  const s = DateTime.fromMillis(start.getTime(), { zone: 'utc' }).setZone(ianaId);
  if (!s.isValid) {
    return end ? formatLocalDateRange(start, end, locale) : formatLocalDateMedium(start, locale);
  }
  if (!end || Number.isNaN(end.getTime())) {
    return s.setLocale(loc).toLocaleString(DateTime.DATE_MED);
  }
  const e = DateTime.fromMillis(end.getTime(), { zone: 'utc' }).setZone(ianaId);
  if (!e.isValid) {
    return s.setLocale(loc).toLocaleString(DateTime.DATE_MED);
  }
  if (s.toISODate() === e.toISODate()) {
    return s.setLocale(loc).toLocaleString(DateTime.DATE_MED);
  }
  const y1 = s.year;
  const y2 = e.year;
  if (y1 === y2) {
    const md1 = s.setLocale(loc).toFormat('LLL d');
    return `${md1} – ${e.setLocale(loc).toLocaleString(DateTime.DATE_MED)}`;
  }
  return `${s.setLocale(loc).toLocaleString(DateTime.DATE_MED)} – ${e.setLocale(loc).toLocaleString(DateTime.DATE_MED)}`;
}

/**
 * @param {string} ianaId
 * @param {string} [locale]
 */
export function formatTimeZoneLabel(ianaId, locale) {
  if (!ianaId || typeof ianaId !== 'string') {
    return '';
  }
  const id = ianaId.trim();
  if (!id) {
    return '';
  }
  try {
    const sample = new Date('2026-06-15T12:00:00Z');
    const fmt = new Intl.DateTimeFormat(locale || undefined, {
      timeZone: id,
      timeZoneName: 'long',
    });
    const parts = fmt.formatToParts(sample);
    const name = parts.find((p) => p.type === 'timeZoneName');
    return name?.value || id;
  } catch {
    return id;
  }
}

/**
 * Maps API public event DTO to EventCard / feed shape.
 * @param {Record<string, unknown>} raw
 * @param {{ locale?: string, language?: 'EN' | 'DE' }} [opts]
 */
export function mapPublicEventToCard(raw, opts = {}) {
  const locale = opts.locale || undefined;
  const language = opts.language === 'DE' ? 'DE' : 'EN';
  const id = String(raw.id ?? raw.Id ?? '');
  const title = localizeEventTitle(String(raw.title ?? raw.Title ?? ''), language);
  const description = localizeEventDescription(String(raw.description ?? raw.Description ?? ''), language);
  const imageUrl = raw.imageUrl ?? raw.ImageUrl;
  const image = typeof imageUrl === 'string' && imageUrl.trim() ? imageUrl.trim() : DEFAULT_EVENT_COVER;
  const rawImageVariants = raw.imageVariantUrls ?? raw.ImageVariantUrls;
  const imageVariantUrls =
    rawImageVariants && typeof rawImageVariants === 'object' && !Array.isArray(rawImageVariants)
      ? /** @type {Record<string, string>} */ (rawImageVariants)
      : null;
  const imageDisplay = raw.imageDisplay ?? raw.ImageDisplay ?? null;
  const startIso = raw.startDateUtc ?? raw.StartDateUtc;
  const start = startIso ? new Date(String(startIso)) : null;
  const endIso = raw.endDateUtc ?? raw.EndDateUtc;
  const endParsed = endIso ? new Date(String(endIso)) : null;
  const end =
    endParsed && !Number.isNaN(endParsed.getTime()) ? endParsed : null;
  const scheduleConfirmed = raw.isScheduleConfirmed ?? raw.IsScheduleConfirmed;
  const startIsPlaceholder = isPlaceholderScheduleStartUtc(startIso ? String(startIso) : undefined);
  const isScheduleConfirmed =
    !startIsPlaceholder &&
    (scheduleConfirmed === undefined || scheduleConfirmed === null ? true : Boolean(scheduleConfirmed));
  const timeZoneIdRaw = raw.timeZoneId ?? raw.TimeZoneId;
  const timeZoneId = typeof timeZoneIdRaw === 'string' && timeZoneIdRaw.trim() ? timeZoneIdRaw.trim() : '';

  const dateStr =
    isScheduleConfirmed && start && !Number.isNaN(start.getTime())
      ? timeZoneId
        ? formatZonedDateRange(start, end, timeZoneId, locale)
        : end && !Number.isNaN(end.getTime()) && !sameLocalCalendarDay(start, end)
          ? formatLocalDateRange(start, end, locale)
          : start.toLocaleDateString(locale || undefined, { month: 'short', day: 'numeric', year: 'numeric' })
      : '—';
  const timeFromApi = String(raw.time ?? raw.Time ?? '').trim();
  const timeStr = isScheduleConfirmed
    ? timeFromApi ||
      (timeZoneId
        ? formatTimeRangeInTimeZone(start, end, timeZoneId, locale)
        : formatTimeRangeFromDates(start, end, locale))
    : '';
  const isVirtual = Boolean(raw.isVirtual ?? raw.IsVirtual);
  const locRaw = String(raw.location ?? raw.Location ?? '').trim();
  const location = localizeEventLocation(locRaw, isVirtual, language);
  const organizer = String(raw.organizer ?? raw.Organizer ?? '');
  const externalBookingUrlRaw = raw.externalBookingUrl ?? raw.ExternalBookingUrl;
  const externalBookingUrl = sanitizeUrlForNewTab(
    typeof externalBookingUrlRaw === 'string' ? externalBookingUrlRaw : '',
  );

  /** Aligned with public list "upcoming": ended means EndDateUtc is set and before now. */
  const now = Date.now();
  const isExpired = Boolean(
    end && !Number.isNaN(end.getTime()) && end.getTime() < now,
  );

  return {
    id,
    title,
    description,
    image,
    imageVariantUrls,
    imageDisplay,
    date: dateStr,
    time: timeStr || '—',
    location,
    isVirtual,
    scheduleConfirmed: isScheduleConfirmed,
    organizer,
    externalBookingUrl,
    isExpired,
    timeZoneId: timeZoneId || undefined,
    _start: isScheduleConfirmed && start && !Number.isNaN(start.getTime()) ? start : null,
    _end: end,
  };
}
