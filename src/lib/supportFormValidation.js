/** @typedef {(key: string, params?: Record<string, string | number>) => string} TranslateFn */

export const SUPPORT_MIN_NAME_LENGTH = 2;
export const SUPPORT_MAX_NAME_LENGTH = 200;
export const SUPPORT_MIN_MESSAGE_LENGTH = 10;
export const SUPPORT_MAX_MESSAGE_LENGTH = 2000;
export const SUPPORT_MIN_SUBJECT_LENGTH = 3;
export const SUPPORT_MAX_SUBJECT_LENGTH = 500;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const VALID_TYPES = new Set(['Support', 'Feedback']);
const FEEDBACK_CATEGORY_VALUES = new Set(['general', 'feature', 'bug', 'other']);
const SUPPORT_CATEGORY_VALUES = new Set(['technical', 'account', 'general', 'other', 'bug']);

/**
 * @param {{
 *   name: string,
 *   email: string,
 *   inquiryType: string,
 *   category: string,
 *   message: string,
 *   subject?: string,
 * }} fields
 * @param {TranslateFn} tr
 * @returns {Record<string, string>}
 */
export function validateSupportForm(fields, tr) {
  /** @type {Record<string, string>} */
  const errors = {};
  const name = String(fields.name ?? '').trim();
  const email = String(fields.email ?? '').trim();
  const inquiryType = String(fields.inquiryType ?? '').trim();
  const category = String(fields.category ?? '').trim();
  const message = String(fields.message ?? '').trim();
  const subject = String(fields.subject ?? '').trim();
  const isSupport = inquiryType === 'Support';

  if (!inquiryType || !VALID_TYPES.has(inquiryType)) {
    errors.inquiryType = tr('validation.selectType');
  }

  if (!name) {
    errors.name = tr('validation.nameRequired');
  } else if (name.length < SUPPORT_MIN_NAME_LENGTH) {
    errors.name = tr('validation.nameMinLength', { n: SUPPORT_MIN_NAME_LENGTH });
  } else if (name.length > SUPPORT_MAX_NAME_LENGTH) {
    errors.name = tr('validation.nameMaxLength', { n: SUPPORT_MAX_NAME_LENGTH });
  }

  if (!email) {
    errors.email = tr('validation.emailRequired');
  } else if (!EMAIL_RE.test(email)) {
    errors.email = tr('validation.emailInvalid');
  }

  const allowedCats = isSupport ? SUPPORT_CATEGORY_VALUES : FEEDBACK_CATEGORY_VALUES;
  if (!category || !allowedCats.has(category)) {
    errors.category = tr('validation.selectCategory');
  }

  if (isSupport) {
    if (!subject) {
      errors.subject = tr('validation.subjectRequired');
    } else if (subject.length < SUPPORT_MIN_SUBJECT_LENGTH) {
      errors.subject = tr('validation.subjectMinLength', { n: SUPPORT_MIN_SUBJECT_LENGTH });
    } else if (subject.length > SUPPORT_MAX_SUBJECT_LENGTH) {
      errors.subject = tr('validation.subjectMaxLength', { n: SUPPORT_MAX_SUBJECT_LENGTH });
    }
  }

  if (!message) {
    errors.message = tr('validation.messageRequired');
  } else if (message.length < SUPPORT_MIN_MESSAGE_LENGTH) {
    errors.message = tr('validation.messageMinLength', { n: SUPPORT_MIN_MESSAGE_LENGTH });
  } else if (message.length > SUPPORT_MAX_MESSAGE_LENGTH) {
    errors.message = tr('validation.messageMaxLength', { n: SUPPORT_MAX_MESSAGE_LENGTH });
  }

  return errors;
}

/**
 * @param {Parameters<typeof validateSupportForm>[0]} fields
 * @param {TranslateFn} tr
 */
export function isSupportFormValid(fields, tr) {
  return Object.keys(validateSupportForm(fields, tr)).length === 0;
}

export const FEEDBACK_CATEGORIES = [
  { value: 'general', labelKey: 'categories.feedbackGeneral' },
  { value: 'feature', labelKey: 'categories.feedbackFeature' },
  { value: 'bug', labelKey: 'categories.feedbackBug' },
  { value: 'other', labelKey: 'categories.feedbackOther' },
];

export const SUPPORT_CATEGORIES = [
  { value: 'technical', labelKey: 'categories.supportTechnical' },
  { value: 'account', labelKey: 'categories.supportAccount' },
  { value: 'general', labelKey: 'categories.supportGeneral' },
  { value: 'bug', labelKey: 'categories.supportBug' },
  { value: 'other', labelKey: 'categories.supportOther' },
];
