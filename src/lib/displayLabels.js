import { isPlaceholderScheduleStartUtc } from '@/components/admin/ScheduleDateTimeFields';
import { partnerPath, profilePath } from '@/lib/appRoutes';
import { t, tParams } from '@/i18n';

/** @typedef {'Premium' | 'Standard'} PartnerTier */

/** @param {unknown} value */
function normalizeCatalogKey(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[\s,_-]+/g, '');
}

/** @type {Array<{ id: string, en: string, de: string, keys: string[] }>} */
const PARTNER_CATEGORY_CATALOG = [
  { id: 'association', en: 'Association', de: 'Verband', keys: ['association', 'verband'] },
  { id: 'certification', en: 'Certification', de: 'Zertifizierung', keys: ['certification', 'zertifizierung'] },
  {
    id: 'realestate',
    en: 'Real Estate',
    de: 'Immobilien',
    keys: ['realestate', 'real estate', 'immobilien', 'research'],
  },
  { id: 'bank', en: 'Bank', de: 'Bank', keys: ['bank'] },
];

/** @type {Array<{ id: string, en: string, de: string, keys: string[] }>} */
const JOB_TITLE_CATALOG = [
  { id: 'projectManager', en: 'Project Manager', de: 'Projektmanager', keys: ['projectmanager', 'projektmanager'] },
  {
    id: 'financialAdvisor',
    en: 'Financial Advisor',
    de: 'Finanzberater',
    keys: ['financialadvisor', 'finanzberater', 'financialadviser'],
  },
];

/** @type {Array<{ id: string, en: string, de: string, keys: string[] }>} */
const LOCATION_CATALOG = [
  {
    id: 'berlinGermany',
    en: 'Berlin, Germany',
    de: 'Berlin, Deutschland',
    keys: ['berlingermany', 'berlindeutschland'],
  },
  {
    id: 'brusselsBelgium',
    en: 'Brussels, Belgium',
    de: 'Brüssel, Belgien',
    keys: [
      'brusselsbelgium',
      'brusselbelgium',
      'brusselbelgien',
      'brusselscapitalbelgium',
      'brusselshoofdstedgewestbelgium',
    ],
  },
  {
    id: 'frankfurtGermany',
    en: 'Frankfurt am Main, Hesse, Germany',
    de: 'Frankfurt am Main, Hessen, Deutschland',
    keys: [
      'frankfurtammainhessegermany',
      'frankfurtammainhessendeutschland',
      'frankfurthessegermany',
      'frankfurthessendeutschland',
      'frankfurtgermany',
      'frankfurtdeutschland',
    ],
  },
  {
    id: 'hamburgGermany',
    en: 'Hamburg, Germany',
    de: 'Hamburg, Deutschland',
    keys: ['hamburggermany', 'hamburgdeutschland'],
  },
];

const DUMMY_PARTNER_IDENTIFIERS = new Set(['sdfg', 'sd', 'xcv', 'dd', 'edff', '@dd']);

/** @param {Record<string, unknown>} partner */
export function isDummyPartner(partner) {
  const name = String(partner?.name ?? partner?.Name ?? '').trim().toLowerCase();
  const handle = String(partner?.handle ?? partner?.Handle ?? '').trim().toLowerCase().replace(/^@/, '');
  return DUMMY_PARTNER_IDENTIFIERS.has(name) || DUMMY_PARTNER_IDENTIFIERS.has(handle);
}

/**
 * @param {Array<{ id?: string, en: string, de: string, keys: string[] }>} catalog
 * @param {unknown} value
 */
function findCatalogEntry(catalog, value) {
  const n = normalizeCatalogKey(value);
  if (!n) {
    return null;
  }
  return catalog.find((entry) => entry.keys.some((k) => normalizeCatalogKey(k) === n)) ?? null;
}

/**
 * @param {string} catalogPath e.g. "catalogs.partnerCategory.association"
 * @param {'EN' | 'DE'} language
 * @param {string} fallback
 */
function catalogLabel(catalogPath, language, fallback) {
  const label = t(language, catalogPath);
  return label === catalogPath ? fallback : label;
}

/**
 * Known partner category enum — unknown API/DB values pass through unchanged.
 * @param {unknown} value
 * @param {'EN' | 'DE'} language
 */
export function partnerCategoryLabel(value, language) {
  const entry = findCatalogEntry(PARTNER_CATEGORY_CATALOG, value);
  if (entry?.id) {
    return catalogLabel(
      `catalogs.partnerCategory.${entry.id}`,
      language,
      language === 'DE' ? entry.de : entry.en,
    );
  }
  return String(value ?? '').trim();
}

/**
 * @param {unknown} partnerCategory
 * @param {string} filterChipId e.g. Association, RealEstate, premium
 */
export function partnerCategoryMatchesFilter(partnerCategory, filterChipId) {
  const entry = findCatalogEntry(PARTNER_CATEGORY_CATALOG, filterChipId);
  if (!entry) {
    return normalizeCatalogKey(partnerCategory) === normalizeCatalogKey(filterChipId);
  }
  const partnerEntry = findCatalogEntry(PARTNER_CATEGORY_CATALOG, partnerCategory);
  return partnerEntry?.id === entry.id;
}

/**
 * Known job title / designation — unknown values pass through unchanged.
 * @param {unknown} value
 * @param {'EN' | 'DE'} language
 */
export function jobTitleLabel(value, language) {
  const entry = findCatalogEntry(JOB_TITLE_CATALOG, value);
  if (entry?.id) {
    return catalogLabel(
      `catalogs.jobTitle.${entry.id}`,
      language,
      language === 'DE' ? entry.de : entry.en,
    );
  }
  return String(value ?? '').trim();
}

/**
 * @param {unknown} designationName
 * @param {string} query
 * @param {'EN' | 'DE'} language
 */
export function jobTitleMatchesQuery(designationName, query, language) {
  const q = String(query ?? '').trim().toLowerCase();
  if (!q) {
    return true;
  }
  const raw = String(designationName ?? '').toLowerCase();
  if (raw.includes(q)) {
    return true;
  }
  const localized = jobTitleLabel(designationName, language).toLowerCase();
  return localized.includes(q);
}

/**
 * Known location strings — unknown values pass through unchanged.
 * @param {unknown} value
 * @param {'EN' | 'DE'} language
 */
export function locationLabel(value, language) {
  const raw = String(value ?? '').trim();
  if (!raw) {
    return '';
  }
  const entry = findCatalogEntry(LOCATION_CATALOG, raw);
  if (entry?.id) {
    return catalogLabel(
      `catalogs.location.${entry.id}`,
      language,
      language === 'DE' ? entry.de : entry.en,
    );
  }
  return raw;
}

/** @param {Record<string, unknown>} post */
export function isPartnerOrganizationPost(post) {
  const raw = post?.organizationId ?? post?.OrganizationId;
  if (raw === null || raw === undefined) {
    return false;
  }
  const s = String(raw).trim();
  return s.length > 0 && s.toLowerCase() !== 'null' && s.toLowerCase() !== 'undefined';
}

/**
 * Partner tier badge for a post — only when posted on behalf of a partner organization.
 * Never used for personal (non-org) posts or user profiles.
 * @param {Record<string, unknown>} post
 * @returns {PartnerTier | null}
 */
export function resolvePostPartnerTier(post) {
  if (!isPartnerOrganizationPost(post)) {
    return null;
  }
  const tier = post.organizationTier ?? post.OrganizationTier;
  if (tier === 'Premium' || tier === 'Standard') {
    return tier;
  }
  const isPremium = post.organizationIsPremium ?? post.OrganizationIsPremium;
  return isPremium === true ? 'Premium' : 'Standard';
}

/**
 * Author header identity for feed/post detail — partner org posts show the organization, not the member.
 * @param {Record<string, unknown>} post
 * @returns {{
 *   isPartnerOrganizationPost: boolean,
 *   name: string,
 *   handle: string | null,
 *   avatar: string | null,
 *   showUserVerified: boolean,
 *   partnerTier: PartnerTier | null,
 *   navigationPath: string | null,
 * }}
 */
export function resolvePostDisplayIdentity(post) {
  if (isPartnerOrganizationPost(post)) {
    const orgId = String(post.organizationId ?? post.OrganizationId).trim();
    const name = String(post.organizationName ?? post.OrganizationName ?? '').trim() || 'Partner';
    const handle = String(post.organizationHandle ?? post.OrganizationHandle ?? '')
      .trim()
      .replace(/^@/, '');
    const partnerKey = handle || orgId;
    return {
      isPartnerOrganizationPost: true,
      name,
      handle: handle || null,
      avatar: post.organizationLogoUrl ?? post.OrganizationLogoUrl ?? null,
      showUserVerified: false,
      partnerTier: resolvePostPartnerTier(post),
      navigationPath: partnerPath(partnerKey),
    };
  }

  const author = post?.author ?? {};
  const handle = String(author.handle ?? '').trim().replace(/^@/, '');
  return {
    isPartnerOrganizationPost: false,
    name: String(author.name ?? '').trim(),
    handle: handle || null,
    avatar: author.avatar ?? null,
    showUserVerified: Boolean(author.isVerified),
    partnerTier: null,
    navigationPath: handle ? profilePath(handle) : null,
  };
}

/**
 * @param {PartnerTier | boolean | string | null | undefined} tierOrPremium
 * @param {'EN' | 'DE'} language
 */
/** @param {unknown} endsIn @param {'EN' | 'DE'} language */
export function pollEndsInLine(endsIn, language) {
  const s = String(endsIn ?? '').trim();
  const lower = s.toLowerCase();
  if (
    !s
    || lower === 'no end date'
    || lower === 'kein enddatum'
    || lower.includes('no end date')
    || lower.includes('kein enddatum')
  ) {
    return t(language, 'time.noEndDate');
  }
  if (s === 'Ended' || s === 'Beendet') {
    return t(language, 'time.ended');
  }
  return `${s} ${t(language, 'time.left')}`;
}

export function partnerTierLabel(tierOrPremium, language) {
  const isPremium =
    tierOrPremium === 'Premium' ||
    tierOrPremium === true ||
    tierOrPremium === 'premium';
  return isPremium
    ? t(language, 'partner.premiumPartner')
    : t(language, 'partner.standardPartner');
}

/** @param {'EN' | 'DE'} language */
export function partnerStatusColumnLabel(language) {
  return t(language, 'partner.partnerStatus');
}

/**
 * Runtime schedule status (events, ads) — not review/approval.
 * @param {'active' | 'scheduled' | 'expired' | 'unconfirmed'} kind
 * @param {'EN' | 'DE'} language
 */
export function runtimeStatusLabel(kind, language) {
  switch (kind) {
  case 'scheduled':
  case 'unconfirmed':
    return t(language, 'status.planned');
  case 'expired':
    return t(language, 'status.past');
  default:
    return t(language, 'status.active');
  }
}

/**
 * Review / listing approval status — separate from runtime schedule.
 * @param {'pending' | 'approved' | 'rejected' | string} status
 * @param {'EN' | 'DE'} language
 */
export function reviewStatusLabel(status, language) {
  const key = String(status ?? '').toLowerCase();
  if (key === 'approved' || key === 'active' || key === 'running') {
    return t(language, 'status.approved');
  }
  if (key === 'rejected') {
    return t(language, 'status.rejected');
  }
  return t(language, 'status.pending');
}

/**
 * @param {unknown} iso
 */
export function isInvalidOrPlaceholderEventDate(iso) {
  if (iso === null || iso === undefined || iso === '') {
    return true;
  }
  return isPlaceholderScheduleStartUtc(String(iso));
}

/**
 * Relative time for feeds and lists.
 * @param {string | Date | number | null | undefined} date
 * @param {'EN' | 'DE'} language
 */
export function formatRelativeTimeAgo(date, language) {
  if (date === null || date === undefined || date === '') {
    return '';
  }
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) {
    return '';
  }
  const now = Date.now();
  const diffMs = now - d.getTime();
  if (diffMs < 60_000) {
    return t(language, 'time.justNow');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.floor((today.getTime() - dateOnly.getTime()) / 86_400_000);

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / 3_600_000);
    if (diffHours >= 1) {
      return tParams(language, 'time.hoursAgo', { n: diffHours });
    }
    const diffMinutes = Math.floor(diffMs / 60_000);
    return tParams(language, 'time.minutesAgo', { n: diffMinutes });
  }
  if (diffDays === 1) {
    return t(language, 'time.yesterday');
  }
  if (diffDays < 7) {
    return tParams(language, 'time.daysAgo', { n: diffDays });
  }
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 5) {
    return diffWeeks === 1
      ? t(language, 'time.oneWeekAgo')
      : tParams(language, 'time.weeksAgo', { n: diffWeeks });
  }
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) {
    return diffMonths === 1
      ? t(language, 'time.oneMonthAgo')
      : tParams(language, 'time.monthsAgo', { n: diffMonths });
  }
  const diffYears = Math.floor(diffDays / 365);
  return diffYears === 1
    ? t(language, 'time.oneYearAgo')
    : tParams(language, 'time.yearsAgo', { n: diffYears });
}
