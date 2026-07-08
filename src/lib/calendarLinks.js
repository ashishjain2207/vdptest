/**
 * Build third-party calendar URLs for “Add to calendar” actions.
 * Times are sent in UTC; calendar apps show them in the user’s local zone.
 */

/**
 * @param {Date} d
 */
function formatGoogleUtc(d) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const h = String(d.getUTCHours()).padStart(2, '0');
  const min = String(d.getUTCMinutes()).padStart(2, '0');
  const s = String(d.getUTCSeconds()).padStart(2, '0');
  return `${y}${m}${day}T${h}${min}${s}Z`;
}

/**
 * @param {Date} start
 * @param {Date | null | undefined} end
 */
export function resolveEventEnd(start, end) {
  if (end && !Number.isNaN(end.getTime()) && end.getTime() > start.getTime()) {
    return end;
  }
  return new Date(start.getTime() + 3600000);
}

/**
 * Google Calendar — opens in browser with prefilled event.
 * @param {{ title: string; description?: string; location?: string; start: Date; end: Date }} p
 */
export function buildGoogleCalendarUrl(p) {
  const { title, description = '', location = '', start, end } = p;
  const dates = `${formatGoogleUtc(start)}/${formatGoogleUtc(end)}`;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates,
    details: description,
    location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Outlook on the web (consumer) — compose view with prefilled fields.
 * @param {{ title: string; description?: string; location?: string; start: Date; end: Date }} p
 */
export function buildOutlookLiveCalendarUrl(p) {
  const { title, description = '', location = '', start, end } = p;
  const params = new URLSearchParams({
    subject: title,
    startdt: start.toISOString(),
    enddt: end.toISOString(),
    body: description,
    location,
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/**
 * Outlook on the web (Microsoft 365 work/school) — same parameters as consumer.
 * @param {{ title: string; description?: string; location?: string; start: Date; end: Date }} p
 */
export function buildOutlookOfficeCalendarUrl(p) {
  const { title, description = '', location = '', start, end } = p;
  const params = new URLSearchParams({
    subject: title,
    startdt: start.toISOString(),
    enddt: end.toISOString(),
    body: description,
    location,
  });
  return `https://outlook.office.com/calendar/0/deeplink/compose?${params.toString()}`;
}
