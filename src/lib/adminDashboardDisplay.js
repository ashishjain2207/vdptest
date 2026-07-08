/** Dummy placeholders to hide from admin dashboard activity (QA / seed data). */
const DUMMY_ACTIVITY_TOKENS = [
  'sdfg',
  'edff',
  'hfgcgvhbj',
  'ertyhj',
  'rghjkl,jmnbf',
  'rghjkl',
  'jmnbf',
  'wertyujhgfd',
  'asdfghjkl',
];

/**
 * @param {unknown} text
 */
function containsDummyActivityText(text) {
  const t = String(text ?? '').trim().toLowerCase();
  if (!t) {
    return false;
  }
  return DUMMY_ACTIVITY_TOKENS.some((token) => t.includes(token));
}

/**
 * @param {Array<Record<string, unknown>>} rows
 */
export function filterAdminRecentActivity(rows) {
  if (!Array.isArray(rows)) {
    return [];
  }
  return rows.filter((row) => {
    const en = String(row.messageEn ?? row.MessageEn ?? '');
    const de = String(row.messageDe ?? row.MessageDe ?? '');
    return !containsDummyActivityText(en) && !containsDummyActivityText(de);
  });
}

/**
 * Normalizes activity line copy from API templates.
 * @param {unknown} text
 * @param {'EN' | 'DE'} language
 */
export function localizeAdminActivityMessage(text, language) {
  const s = String(text ?? '').trim();
  if (!s) {
    return s;
  }
  if (language === 'DE') {
    return s
      .replace(/\bAdvertising\b/gi, 'Anzeigen')
      .replace(/\bWerbung\b/gi, 'Anzeigen')
      .replace(/\bWerbebanner\b/gi, 'Anzeige')
      .replace(/\bAd banner\b/gi, 'Anzeige');
  }
  return s
    .replace(/\bAdvertising\b/gi, 'Ads')
    .replace(/\bAd banner\b/gi, 'Ad')
    .replace(/\bWerbung\b/gi, 'Ads');
}
