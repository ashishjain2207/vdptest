import { describe, it, expect } from 'vitest';
import { validateSupportForm, isSupportFormValid } from './supportFormValidation';

const t = (en) => en;

const valid = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  inquiryType: 'Support',
  category: 'technical',
  subject: 'Cannot sign in',
  message: 'Something went wrong with login.',
};

describe('validateSupportForm', () => {
  it('accepts a complete valid form', () => {
    expect(validateSupportForm(valid, t)).toEqual({});
    expect(isSupportFormValid(valid, t)).toBe(true);
  });

  it('requires all fields', () => {
    const errors = validateSupportForm(
      { name: '', email: '', inquiryType: '', category: '', message: '', subject: '' },
      t,
    );
    expect(errors.name).toBeTruthy();
    expect(errors.email).toBeTruthy();
    expect(errors.inquiryType).toBeTruthy();
    expect(errors.category).toBeTruthy();
    expect(errors.message).toBeTruthy();
  });

  it('rejects invalid email and short message', () => {
    const errors = validateSupportForm(
      { ...valid, email: 'not-an-email', message: 'short' },
      t,
    );
    expect(errors.email).toBeTruthy();
    expect(errors.message).toBeTruthy();
  });
});
