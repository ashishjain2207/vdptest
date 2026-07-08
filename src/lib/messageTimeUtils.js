import { t, tParams } from '@/i18n';

/**
 * Formats a timestamp for the conversation list: "Today 14:30", "Yesterday 09:15", or "15 Jan" for older.
 * @param {string|Date|number|null|undefined} date - ISO string, Date, or timestamp (ms)
 * @param {{ language?: string }} [opts]
 */
export function formatConversationTime(date, opts = {}) {
  if (date === null || date === undefined) {return '';}
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) {return '';}
  const language = opts.language === 'DE' ? 'DE' : 'EN';
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const lang = language === 'DE' ? 'de-DE' : 'en-US';
  if (dateOnly.getTime() === today.getTime()) {
    return tParams(language, 'time.todayAt', { time });
  }
  if (dateOnly.getTime() === yesterday.getTime()) {
    return tParams(language, 'time.yesterdayAt', { time });
  }
  const daysDiff = Math.floor((today - dateOnly) / (24 * 60 * 60 * 1000));
  if (daysDiff < 7) {
    const weekday = d.toLocaleDateString(lang, { weekday: 'short' });
    return `${weekday} ${time}`;
  }
  return d.toLocaleDateString(lang, { day: 'numeric', month: 'short' });
}

/**
 * Returns a section label for grouping messages: "Today", "Yesterday", or formatted date.
 * @param {string|Date|number|null|undefined} date
 * @param {{ language?: string }} [opts]
 */
export function formatMessageSectionDate(date, opts = {}) {
  if (date === null || date === undefined) {return '';}
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) {return '';}
  const language = opts.language === 'DE' ? 'DE' : 'EN';
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const lang = language === 'DE' ? 'de-DE' : 'en-US';
  if (dateOnly.getTime() === today.getTime()) {
    return t(language, 'time.today');
  }
  if (dateOnly.getTime() === yesterday.getTime()) {
    return t(language, 'time.yesterday');
  }
  return d.toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Formats time for a single message (e.g. "2:30 PM").
 * @param {string|Date|number|null|undefined} date
 */
export function formatMessageTime(date) {
  if (date === null || date === undefined) {return '';}
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) {return '';}
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Formats date and time for message info: "Today, 2:30 PM", "Yesterday, 2:30 PM", or "6 Mar 2025, 2:30 PM".
 * @param {string|Date|number|null|undefined} date
 * @param {{ language?: string }} [opts]
 */
export function formatMessageDateTime(date, opts = {}) {
  if (date === null || date === undefined) {return '';}
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) {return '';}
  const language = opts.language === 'DE' ? 'DE' : 'EN';
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const lang = language === 'DE' ? 'de-DE' : 'en-US';
  if (dateOnly.getTime() === today.getTime()) {
    return tParams(language, 'time.todayComma', { time });
  }
  if (dateOnly.getTime() === yesterday.getTime()) {
    return tParams(language, 'time.yesterdayComma', { time });
  }
  const dateStr = d.toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric' });
  return `${dateStr}, ${time}`;
}

/**
 * Formats "last seen" for offline users.
 * @param {string|Date|number|null|undefined} date
 * @param {{ language?: string }} [opts]
 * @returns {string}
 */
export function formatLastSeen(date, opts = {}) {
  if (date === null || date === undefined) {return '';}
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) {return '';}
  const language = opts.language === 'DE' ? 'DE' : 'EN';
  const now = new Date();
  const diffMs = now - d;
  const diffMinutes = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffMinutes < 1) {
    return t(language, 'time.lastSeenJustNow');
  }
  if (diffMinutes < 60) {
    return tParams(language, 'time.lastSeenMinutesAgo', { n: diffMinutes });
  }
  if (diffHours < 24) {
    return tParams(language, 'time.lastSeenHoursAgo', { n: diffHours });
  }
  if (diffDays < 7) {
    return tParams(language, 'time.lastSeenDaysAgo', { n: diffDays });
  }
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = d.toLocaleDateString(language === 'DE' ? 'de-DE' : 'en-US', {
    day: 'numeric',
    month: 'short',
  });
  return tParams(language, 'time.lastSeenOn', { date: dateStr, time });
}
