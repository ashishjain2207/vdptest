/**
 * Client-only schedule classification for admin list UIs (ads + events).
 * @typedef {'active' | 'scheduled' | 'expired' | 'unconfirmed'} ScheduleKind
 */

/** @param {unknown} iso */
export function parseUtcDate(iso) {
  if (iso === null || iso === undefined || iso === '') {
    return null;
  }
  const d = new Date(String(iso));
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Advertisements: `validFromUtc` / `validToUtc`.
 * @param {Record<string, unknown>} row
 * @param {Date} [now]
 * @returns {ScheduleKind}
 */
export function getAdvertisementScheduleStatus(row, now = new Date()) {
  const from = parseUtcDate(row.validFromUtc ?? row.ValidFromUtc);
  const to = parseUtcDate(row.validToUtc ?? row.ValidToUtc);
  if (to && now.getTime() > to.getTime()) {
    return 'expired';
  }
  if (from && now.getTime() < from.getTime()) {
    return 'scheduled';
  }
  return 'active';
}

/**
 * Events: `startDateUtc` / `endDateUtc`.
 * @param {Record<string, unknown>} row
 * @param {Date} [now]
 * @returns {ScheduleKind}
 */
export function getEventScheduleStatus(row, now = new Date()) {
  const scheduleConfirmed = row.isScheduleConfirmed ?? row.IsScheduleConfirmed;
  if (scheduleConfirmed === false) {
    return 'unconfirmed';
  }

  const start = parseUtcDate(row.startDateUtc ?? row.StartDateUtc);
  const end = parseUtcDate(row.endDateUtc ?? row.EndDateUtc);
  if (end && now.getTime() > end.getTime()) {
    return 'expired';
  }
  if (start && now.getTime() < start.getTime()) {
    return 'scheduled';
  }
  return 'active';
}

/**
 * @param {ScheduleKind} kind
 * @param {'all' | 'active' | 'scheduled' | 'expired' | 'unconfirmed'} filter
 */
export function scheduleMatchesFilter(kind, filter) {
  if (filter === 'all') {
    return true;
  }
  return kind === filter;
}

/**
 * Badge + row styling helpers (Tailwind classes).
 * @param {ScheduleKind} kind
 */
export function scheduleBadgeClassName(kind) {
  switch (kind) {
  case 'expired':
    return 'border-border bg-muted/80 text-muted-foreground';
  case 'scheduled':
    return 'border-sky-500/35 bg-sky-50 text-sky-900 dark:bg-sky-950/40 dark:text-sky-100';
  case 'unconfirmed':
    return 'border-amber-500/35 bg-amber-50 text-amber-900 dark:bg-amber-950/35 dark:text-amber-100';
  default:
    return 'border-emerald-600/35 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/35 dark:text-emerald-100';
  }
}

/**
 * @param {ScheduleKind} kind
 */
export function scheduleRowOpacityClassName(kind) {
  return kind === 'expired' ? 'opacity-[0.72] hover:opacity-100 transition-opacity' : '';
}
