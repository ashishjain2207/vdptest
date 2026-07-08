import { t } from '@/i18n';

/** QA / seed placeholders — hide from public and admin ad lists. */
const DUMMY_AD_TOKENS = [
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

/** @param {unknown} text */
export function isDummyAdText(text) {
  const normalized = String(text ?? '').trim().toLowerCase();
  if (!normalized) {
    return false;
  }
  if (normalized === 'asdfghjkl' || normalized === 'asdfghjkl;') {
    return true;
  }
  if (/^asdfg+h?j?k?l+$/i.test(normalized)) {
    return true;
  }
  return DUMMY_AD_TOKENS.some((token) => normalized.includes(token));
}

/** @param {unknown} text */
export function sanitizeAdField(text) {
  const raw = String(text ?? '').trim();
  if (!raw || isDummyAdText(raw)) {
    return '';
  }
  return raw;
}

/**
 * @param {unknown} title
 * @param {'EN' | 'DE'} language
 */
export function localizeAdTitle(title, language) {
  const raw = sanitizeAdField(title);
  if (!raw) {
    return '';
  }
  const key = raw.toLowerCase();
  if (key === 'modern luxury living at its finest') {
    return t(language, 'ads.demoTitle');
  }
  return raw;
}

/**
 * @param {unknown} body
 * @param {'EN' | 'DE'} language
 */
export function localizeAdBody(body, language) {
  const raw = sanitizeAdField(body);
  if (!raw) {
    return '';
  }
  if (
    /discover modern residential projects/i.test(raw)
    || /learn how digital solutions/i.test(raw)
    || /modern residential projects with premium/i.test(raw)
    || /entdecken sie moderne wohnprojekte/i.test(raw)
  ) {
    return t(language, 'ads.demoBody');
  }
  return raw;
}

/**
 * @param {unknown} cta
 * @param {'EN' | 'DE'} language
 */
export function localizeAdCta(cta, language) {
  const raw = sanitizeAdField(cta);
  if (!raw) {
    return '';
  }
  const normalized = raw.replace(/\s+/g, ' ').trim();
  if (
    /find your perfect home with us/i.test(normalized)
    || /find your new home/i.test(normalized)
    || /dreams meet the right address/i.test(normalized)
    || /wünsche die richtige adresse/i.test(normalized)
  ) {
    return t(language, 'ads.demoCtaLong');
  }
  if (/^learn more$/i.test(normalized)) {
    return t(language, 'ads.learnMore');
  }
  return raw;
}

/**
 * @param {unknown} name
 */
export function localizeAdvertiserName(name) {
  const raw = sanitizeAdField(name);
  if (!raw) {
    return '';
  }
  if (raw.toUpperCase() === 'DREAMHOME') {
    return 'DreamHome';
  }
  return raw;
}

/** @param {Record<string, unknown>} obj @param {...string} keys */
function readAdText(obj, ...keys) {
  for (const key of keys) {
    const value = obj?.[key];
    if (value !== null && value !== undefined) {
      const text = String(value).trim();
      if (text) {
        return text;
      }
    }
  }
  return '';
}

/**
 * Hide ads whose only text is dummy keyboard mash (e.g. asdfghjkl) and no media.
 * @param {Record<string, unknown>} ad
 * @param {'EN' | 'DE'} language
 */
export function isPublicAdRenderable(ad, language) {
  const lang = language === 'DE' ? 'DE' : 'EN';
  const title = localizeAdTitle(readAdText(ad, 'title', 'Title'), lang);
  const body = localizeAdBody(
    readAdText(ad, 'body', 'Body', 'description', 'Description'),
    lang,
  );
  const mediaUrl = readAdText(ad, 'imageUrl', 'ImageUrl', 'mediaUrl', 'MediaUrl');
  const targetUrl = readAdText(ad, 'targetUrl', 'TargetUrl');
  return Boolean(title || body || mediaUrl || targetUrl);
}
