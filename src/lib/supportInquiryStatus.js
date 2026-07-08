import { t } from '@/i18n';

/** @typedef {{ value: string, labelKey: string }} SupportInquiryStatusOption */

export const SUPPORT_TICKET_STATUS_OPTIONS = /** @type {SupportInquiryStatusOption[]} */ ([
  { value: 'New', labelKey: 'support.inquiryStatus.new' },
  { value: 'Open', labelKey: 'support.inquiryStatus.open' },
  { value: 'InProgress', labelKey: 'support.inquiryStatus.inProgress' },
  { value: 'OnHold', labelKey: 'support.inquiryStatus.onHold' },
  { value: 'Resolved', labelKey: 'support.inquiryStatus.resolved' },
  { value: 'Closed', labelKey: 'support.inquiryStatus.closed' },
]);

export const FEEDBACK_STATUS_OPTIONS = /** @type {SupportInquiryStatusOption[]} */ ([
  { value: 'New', labelKey: 'support.inquiryStatus.new' },
  { value: 'Reviewed', labelKey: 'support.inquiryStatus.reviewed' },
  { value: 'Actioned', labelKey: 'support.inquiryStatus.actioned' },
]);

/** @deprecated Use getSupportInquiryStatusOptions(inquiryType) */
export const SUPPORT_INQUIRY_STATUS_OPTIONS = SUPPORT_TICKET_STATUS_OPTIONS;

export const SUPPORT_TICKET_STATUS_ORDER = ['New', 'Open', 'InProgress', 'OnHold', 'Resolved', 'Closed'];
export const FEEDBACK_STATUS_ORDER = ['New', 'Reviewed', 'Actioned'];

/** @deprecated Use getSupportInquiryStatusOrder(inquiryType) */
export const SUPPORT_INQUIRY_STATUS_ORDER = SUPPORT_TICKET_STATUS_ORDER;

/**
 * @param {string | null | undefined} inquiryType
 * @returns {boolean}
 */
export function isFeedbackInquiryType(inquiryType) {
  return String(inquiryType ?? '').trim().toLowerCase() === 'feedback';
}

/**
 * @param {string | null | undefined} inquiryType
 * @returns {string[]}
 */
export function getSupportInquiryStatusOrder(inquiryType) {
  return isFeedbackInquiryType(inquiryType) ? FEEDBACK_STATUS_ORDER : SUPPORT_TICKET_STATUS_ORDER;
}

/**
 * @param {string | null | undefined} inquiryType
 * @returns {SupportInquiryStatusOption[]}
 */
export function getSupportInquiryStatusOptions(inquiryType) {
  return isFeedbackInquiryType(inquiryType) ? FEEDBACK_STATUS_OPTIONS : SUPPORT_TICKET_STATUS_OPTIONS;
}

/**
 * @param {string | null | undefined} typeFilter
 * @returns {SupportInquiryStatusOption[]}
 */
export function getSupportInquiryFilterStatusOptions(typeFilter) {
  if (String(typeFilter ?? '').toLowerCase() === 'feedback') {
    return FEEDBACK_STATUS_OPTIONS;
  }
  if (String(typeFilter ?? '').toLowerCase() === 'support') {
    return SUPPORT_TICKET_STATUS_OPTIONS;
  }

  return [
    { value: 'New', labelKey: 'support.inquiryStatus.new' },
    { value: 'Open', labelKey: 'support.inquiryStatus.open' },
    { value: 'InProgress', labelKey: 'support.inquiryStatus.inProgress' },
    { value: 'OnHold', labelKey: 'support.inquiryStatus.onHold' },
    { value: 'Reviewed', labelKey: 'support.inquiryStatus.reviewed' },
    { value: 'Resolved', labelKey: 'support.inquiryStatus.resolved' },
    { value: 'Actioned', labelKey: 'support.inquiryStatus.actioned' },
    { value: 'Closed', labelKey: 'support.inquiryStatus.closed' },
  ];
}

/**
 * @param {string} raw
 * @param {string | null | undefined} [inquiryType]
 * @returns {string}
 */
export function normalizeSupportInquiryStatus(raw, inquiryType) {
  const s = String(raw ?? '').trim();
  if (!s) {
    return 'New';
  }

  if (s.toLowerCase() === 'in progress' || s.toLowerCase() === 'inprogress') {
    return isFeedbackInquiryType(inquiryType) ? 'Reviewed' : 'InProgress';
  }

  if (s.toLowerCase() === 'on hold' || s.toLowerCase() === 'onhold') {
    return 'OnHold';
  }

  if (isFeedbackInquiryType(inquiryType)) {
    if (s.toLowerCase() === 'open') {
      return 'Reviewed';
    }
    if (s.toLowerCase() === 'resolved' || s.toLowerCase() === 'closed') {
      return 'Actioned';
    }
    const match = FEEDBACK_STATUS_ORDER.find((x) => x.toLowerCase() === s.toLowerCase());
    return match ?? 'New';
  }

  const match = SUPPORT_TICKET_STATUS_ORDER.find((x) => x.toLowerCase() === s.toLowerCase());
  return match ?? 'New';
}

/**
 * @param {string} status
 * @param {string | null | undefined} inquiryType
 * @returns {boolean}
 */
export function isTerminalSupportInquiryStatus(status, inquiryType) {
  const normalized = normalizeSupportInquiryStatus(status, inquiryType);
  if (isFeedbackInquiryType(inquiryType)) {
    return normalized === 'Actioned' || normalized === 'Resolved' || normalized === 'Closed';
  }
  return normalized === 'Resolved' || normalized === 'Closed';
}

/**
 * Forward-only status targets (never includes New once past New).
 * Terminal rows also offer Reopen.
 *
 * @param {string} currentStatus
 * @param {string | null | undefined} [inquiryType]
 * @returns {SupportInquiryStatusOption[]}
 */
export function getForwardSupportInquiryStatusOptions(currentStatus, inquiryType) {
  const order = getSupportInquiryStatusOrder(inquiryType);
  const options = getSupportInquiryStatusOptions(inquiryType);
  const current = normalizeSupportInquiryStatus(currentStatus, inquiryType);
  const currentIdx = order.indexOf(current);
  if (currentIdx < 0) {
    return [];
  }

  const forward = options.filter((opt) => {
    const idx = order.indexOf(opt.value);
    return idx > currentIdx && opt.value !== 'New';
  });

  if (isTerminalSupportInquiryStatus(current, inquiryType)) {
    const reopenValue = isFeedbackInquiryType(inquiryType) ? 'Reviewed' : 'Open';
    const reopenLabelKey = isFeedbackInquiryType(inquiryType)
      ? 'support.inquiryStatus.markReviewedAgain'
      : 'support.inquiryStatus.reopen';
    return [{ value: reopenValue, labelKey: reopenLabelKey }, ...forward];
  }

  return forward;
}

/**
 * @param {string} status
 * @param {string} language
 * @param {string | null | undefined} [inquiryType]
 * @returns {string}
 */
export function supportInquiryStatusLabel(status, language, inquiryType) {
  const normalized = normalizeSupportInquiryStatus(status, inquiryType);
  const options = getSupportInquiryStatusOptions(inquiryType);
  const opt = options.find((o) => o.value === normalized) ?? options[0];
  return t(language, opt.labelKey);
}

/**
 * @param {string | null | undefined} inquiryType
 * @param {string} language
 * @returns {string}
 */
export function supportInquiryResolvedFieldLabel(inquiryType, language) {
  if (isFeedbackInquiryType(inquiryType)) {
    return t(language, 'support.inquiryStatus.actionedField');
  }
  return t(language, 'support.inquiryStatus.resolvedField');
}

/**
 * @param {string | null | undefined} inquiryType
 * @param {string} language
 * @returns {string}
 */
export function supportInquiryResolveActionLabel(inquiryType, language) {
  if (isFeedbackInquiryType(inquiryType)) {
    return t(language, 'support.inquiryStatus.markActioned');
  }
  return t(language, 'support.inquiryStatus.markResolved');
}

/**
 * @param {string | null | undefined} inquiryType
 * @param {string} language
 * @returns {string}
 */
export function supportInquiryResolvedToastMessage(inquiryType, language) {
  if (isFeedbackInquiryType(inquiryType)) {
    return t(language, 'support.inquiryStatus.markedActioned');
  }
  return t(language, 'support.inquiryStatus.markedResolved');
}
