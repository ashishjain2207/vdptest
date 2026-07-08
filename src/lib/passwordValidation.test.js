import { describe, expect, it } from 'vitest';
import { getPasswordValidation, validatePasswordClientSide } from './passwordValidation';

describe('passwordValidation', () => {
  it('requires all rules', () => {
    const weak = getPasswordValidation('short');
    expect(weak?.valid).toBe(false);
    expect(weak?.rules.length).toBe(false);

    const strong = getPasswordValidation('Abcd1234!');
    expect(strong?.valid).toBe(true);
    expect(validatePasswordClientSide('Abcd1234!')).toMatchObject({
      length: true,
      uppercase: true,
      lowercase: true,
      digit: true,
      nonAlphanumeric: true,
    });
  });

  it('returns null for empty password', () => {
    expect(getPasswordValidation('')).toBeNull();
  });
});
