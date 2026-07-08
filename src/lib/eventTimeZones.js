/**
 * IANA time zones for event scheduling (admin). Labels are for UI; values are sent to the API.
 * @type {Array<{ value: string, en: string, de: string }>}
 */
export const EVENT_TIMEZONE_OPTIONS = [
  { value: 'UTC', en: 'UTC', de: 'UTC' },
  { value: 'Europe/London', en: 'United Kingdom (London)', de: 'Vereinigtes Königreich (London)' },
  { value: 'Europe/Paris', en: 'Central European (Paris, Berlin)', de: 'Mitteleuropäisch (Paris, Berlin)' },
  { value: 'Europe/Berlin', en: 'Germany (Berlin)', de: 'Deutschland (Berlin)' },
  { value: 'Europe/Vienna', en: 'Austria (Vienna)', de: 'Österreich (Wien)' },
  { value: 'Europe/Zurich', en: 'Switzerland (Zurich)', de: 'Schweiz (Zürich)' },
  { value: 'America/New_York', en: 'US Eastern (New York)', de: 'US Ostküste (New York)' },
  { value: 'America/Chicago', en: 'US Central (Chicago)', de: 'US Zentral (Chicago)' },
  { value: 'America/Denver', en: 'US Mountain (Denver)', de: 'US Mountain (Denver)' },
  { value: 'America/Los_Angeles', en: 'US Pacific (Los Angeles)', de: 'US Westküste (Los Angeles)' },
  { value: 'America/Toronto', en: 'Eastern (Toronto)', de: 'Ost (Toronto)' },
  { value: 'Asia/Dubai', en: 'Gulf (Dubai)', de: 'Golf (Dubai)' },
  { value: 'Asia/Singapore', en: 'Singapore', de: 'Singapur' },
  { value: 'Asia/Tokyo', en: 'Japan (Tokyo)', de: 'Japan (Tokio)' },
  { value: 'Australia/Sydney', en: 'Australia (Sydney)', de: 'Australien (Sydney)' },
];
