import { t, tParams } from '@/i18n';

const DUMMY_EVENT_TITLES = new Set(['edfd']);

/** @param {Record<string, unknown>} event */
export function isDummyEvent(event) {
  const title = String(event?.title ?? event?.Title ?? '').trim().toLowerCase();
  return DUMMY_EVENT_TITLES.has(title);
}

/**
 * Localizes API event titles/descriptions and display helpers for EN/DE UI.
 * @param {unknown} title
 * @param {'EN' | 'DE'} language
 */
export function localizeEventTitle(title, language) {
  const raw = String(title ?? '').trim();
  if (!raw) {
    return raw;
  }
  const key = raw.toLowerCase();
  if (key === 'smart real estate investment') {
    return t(language, 'events.demoTitle');
  }
  if (key === 'the modern real estate market.') {
    return t(language, 'events.demoModernMarket');
  }
  return raw;
}

/**
 * @param {unknown} description
 * @param {'EN' | 'DE'} language
 */
export function localizeEventDescription(description, language) {
  const raw = String(description ?? '').trim();
  if (!raw) {
    return raw;
  }
  if (
    /learn how digital solutions are transforming real estate/i.test(raw)
    || /digitale lösungen die immobilienbranche/i.test(raw)
  ) {
    return t(language, 'events.demoDescription');
  }
  return raw;
}

/**
 * Card subtitle: "by Organizer" / "von Organizer"
 * @param {unknown} organizer
 * @param {'EN' | 'DE'} language
 */
export function eventOrganizerByLine(organizer, language) {
  const name = String(organizer ?? '').trim();
  if (!name) {
    return '';
  }
  return tParams(language, 'events.organizerBy', { name });
}

/**
 * @param {'EN' | 'DE'} language
 */
export function defaultOnlineEventLocation(language) {
  return t(language, 'events.onlineEvent');
}

/**
 * @param {unknown} location
 * @param {boolean} isVirtual
 * @param {'EN' | 'DE'} language
 */
export function localizeEventLocation(location, isVirtual, language) {
  const loc = String(location ?? '').trim();
  if (!isVirtual) {
    return loc || '—';
  }
  if (!loc || /^virtual event$/i.test(loc) || /^virtuelle veranstaltung$/i.test(loc) || /^online(-veranstaltung| event)?$/i.test(loc)) {
    return defaultOnlineEventLocation(language);
  }
  return loc;
}
