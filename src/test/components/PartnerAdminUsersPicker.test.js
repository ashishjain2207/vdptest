import { describe, it, expect } from 'vitest';
import { getPartnerAdminUsersPickerValidationMessage } from '@/components/partner/PartnerAdminUsersPicker';

describe('getPartnerAdminUsersPickerValidationMessage', () => {
  it('returns null for an empty search query', () => {
    expect(getPartnerAdminUsersPickerValidationMessage('', 'EN')).toBeNull();
    expect(getPartnerAdminUsersPickerValidationMessage('   ', 'EN')).toBeNull();
  });

  it('requires at least two characters when text is present', () => {
    expect(getPartnerAdminUsersPickerValidationMessage('a', 'EN')).toMatch(/2 characters/i);
    expect(getPartnerAdminUsersPickerValidationMessage('a', 'DE')).toMatch(/2 Zeichen/i);
  });

  it('requires selecting a user when search text is complete', () => {
    expect(getPartnerAdminUsersPickerValidationMessage('john', 'EN')).toMatch(/Select a member/i);
    expect(getPartnerAdminUsersPickerValidationMessage('john', 'DE')).toMatch(/Wählen Sie ein Mitglied/i);
  });

  it('requires at least one selected administrator when required', () => {
    expect(
      getPartnerAdminUsersPickerValidationMessage('', 'EN', { required: true, selectedCount: 0 }),
    ).toMatch(/at least one partner administrator/i);
    expect(
      getPartnerAdminUsersPickerValidationMessage('', 'DE', { required: true, selectedCount: 0 }),
    ).toMatch(/mindestens einen Partneradministrator/i);
    expect(
      getPartnerAdminUsersPickerValidationMessage('', 'EN', { required: true, selectedCount: 1 }),
    ).toBeNull();
  });
});
