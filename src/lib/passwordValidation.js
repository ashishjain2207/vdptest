/** @typedef {'length' | 'uppercase' | 'lowercase' | 'digit' | 'nonAlphanumeric'} PasswordRuleId */

export const PASSWORD_RULE_ORDER = /** @type {const} */ ([
  'length',
  'uppercase',
  'lowercase',
  'digit',
  'nonAlphanumeric',
]);

/** Client-side rules aligned with Identity password requirements. */
export function validatePasswordClientSide(password) {
  const p = password ?? '';
  return {
    length: p.length >= 8,
    uppercase: /[A-Z]/.test(p),
    lowercase: /[a-z]/.test(p),
    digit: /\d/.test(p),
    nonAlphanumeric: /[^A-Za-z0-9]/.test(p),
  };
}

/** @param {string} password */
export function getPasswordValidation(password) {
  if (!password) {
    return null;
  }
  const rules = validatePasswordClientSide(password);
  return { valid: Object.values(rules).every(Boolean), rules };
}
