import { platformRoleLabel } from '@/lib/adminUserDisplay';

/** @typedef {{ key: string, label: string, value: string, tone?: 'default' | 'success' | 'warning' | 'muted' }} AuditDetailItem */

const TECHNICAL_ONLY_KEYS = new Set(['contentId']);

const FRIENDLY_FIELD_CONFIG = [
  { key: 'maintenanceMode', labelKey: 'detailFieldMaintenanceMode', kind: 'boolean' },
  { key: 'supportEmail', labelKey: 'detailFieldSupportEmail', kind: 'text' },
  { key: 'adminNotificationEmail', labelKey: 'detailFieldAdminNotificationEmail', kind: 'text' },
  { key: 'roleName', labelKey: 'detailFieldRoleName', kind: 'platformRole' },
  { key: 'reason', labelKey: 'detailFieldReason', kind: 'text' },
  { key: 'contentType', labelKey: 'detailFieldContentType', kind: 'contentType' },
  { key: 'previousStatus', labelKey: 'detailFieldPreviousStatus', kind: 'moderationStatus' },
  { key: 'newStatus', labelKey: 'detailFieldNewStatus', kind: 'moderationStatus' },
];

/**
 * @param {unknown} details
 * @returns {Record<string, unknown> | { _raw: string } | null}
 */
export function parseAuditDetails(details) {
  if (details === null || details === undefined) {
    return null;
  }
  const text = String(details).trim();
  if (!text) {
    return null;
  }
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // fall through
  }
  return { _raw: text };
}

/**
 * @param {string | undefined | null} displayName
 * @param {(path: string) => string} t
 */
export function formatAuditActorDisplay(displayName, t) {
  const name = (displayName ?? '').trim();
  if (name) {
    return name;
  }
  return t('adminAuditLogs.unknownActor');
}

/**
 * @param {{ entityType?: string, entityDisplayName?: string }} row
 * @param {(entityType: string) => string} entityLabel
 * @param {(path: string) => string} [t]
 */
export function formatAuditEntitySummary(row, entityLabel, t) {
  const type = row?.entityType ?? '';
  if (!type) {
    return '—';
  }
  if (type === 'User') {
    const name = (row?.entityDisplayName ?? '').trim();
    if (name) {
      return name;
    }
    return t ? t('adminAuditLogs.entityUserAccount') : entityLabel(type);
  }
  return entityLabel(type);
}

/**
 * Display name for the user account affected by a User.* audit event.
 * @param {{ entityType?: string, entityDisplayName?: string }} row
 * @param {(path: string) => string} t
 */
export function formatAuditAffectedUser(row, t) {
  if (row?.entityType !== 'User') {
    return null;
  }
  const name = (row?.entityDisplayName ?? '').trim();
  return name || t('adminAuditLogs.unknownActor');
}

/**
 * @param {Record<string, unknown> | { _raw: string }} parsed
 * @param {(path: string) => string} t
 * @param {string} [language='EN']
 * @returns {AuditDetailItem[]}
 */
export function getAuditDetailItems(parsed, t, language = 'EN') {
  if (!parsed) {
    return [];
  }
  if ('_raw' in parsed && typeof parsed._raw === 'string') {
    return [{
      key: '_raw',
      label: t('adminAuditLogs.details'),
      value: parsed._raw,
      tone: 'default',
    }];
  }

  /** @type {AuditDetailItem[]} */
  const items = [];
  const seen = new Set();

  for (const field of FRIENDLY_FIELD_CONFIG) {
    if (!(field.key in parsed)) {
      continue;
    }
    const raw = parsed[field.key];
    if (raw === null || raw === undefined || raw === '') {
      continue;
    }
    seen.add(field.key);
    items.push({
      key: field.key,
      label: t(`adminAuditLogs.${field.labelKey}`),
      value: formatDetailValue(field.kind, raw, t, language),
      tone: field.kind === 'boolean' ? (raw === true || raw === 'true' || raw === 1 || raw === '1' ? 'success' : 'muted') : 'default',
    });
  }

  for (const [key, raw] of Object.entries(parsed)) {
    if (seen.has(key) || TECHNICAL_ONLY_KEYS.has(key) || isTechnicalKey(key)) {
      continue;
    }
    if (raw === null || raw === undefined || raw === '') {
      continue;
    }
    items.push({
      key,
      label: humanizeDetailKey(key),
      value: typeof raw === 'object' ? JSON.stringify(raw) : String(raw),
      tone: 'default',
    });
  }

  return items;
}

/**
 * @param {{ id?: string, userId?: string, entityType?: string, entityId?: string, details?: string }} row
 */
export function buildAuditTechnicalPayload(row) {
  return {
    eventId: row?.id ?? null,
    actorUserId: row?.userId ?? null,
    entityType: row?.entityType ?? null,
    entityId: row?.entityId ?? null,
    details: row?.details ?? null,
  };
}

/**
 * @param {string} kind
 * @param {unknown} raw
 * @param {(path: string) => string} t
 * @param {string} language
 */
function formatDetailValue(kind, raw, t, language) {
  switch (kind) {
  case 'boolean':
    return isTruthy(raw) ? t('adminAuditLogs.detailValueEnabled') : t('adminAuditLogs.detailValueDisabled');
  case 'platformRole':
    return platformRoleLabel(String(raw), language);
  case 'contentType':
    return formatContentType(String(raw), t);
  case 'moderationStatus':
    return formatModerationStatus(String(raw), t);
  default:
    return String(raw);
  }
}

/** @param {unknown} raw */
function isTruthy(raw) {
  if (typeof raw === 'boolean') {
    return raw;
  }
  if (typeof raw === 'number') {
    return raw !== 0;
  }
  const text = String(raw).trim().toLowerCase();
  return text === 'true' || text === '1' || text === 'yes' || text === 'on';
}

/** @param {string} value @param {(path: string) => string} t */
function formatContentType(value, t) {
  switch (value) {
  case 'Post':
    return t('adminAuditLogs.contentTypePost');
  case 'Comment':
    return t('adminAuditLogs.contentTypeComment');
  case 'User':
    return t('adminAuditLogs.contentTypeUser');
  default:
    return value;
  }
}

/** @param {string} value @param {(path: string) => string} t */
function formatModerationStatus(value, t) {
  switch (value) {
  case 'Pending':
    return t('moderation.statusPending');
  case 'Reviewed':
    return t('moderation.statusReviewed');
  case 'Resolved':
    return t('moderation.statusResolved');
  case 'Dismissed':
    return t('moderation.statusDismissed');
  default:
    return value;
  }
}

/** @param {string} key */
function isTechnicalKey(key) {
  return /(^id$|Id$|UserId$)/.test(key);
}

/** @param {string} key */
function humanizeDetailKey(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}
